/**
 * The tbody half of `grouped`: inserts the band `<tr>`s in front of the rows the
 * controller says they head (`ctrl.groupedWindow`).
 *
 * The consumer's framework owns every OTHER row, so the band rows are foreign
 * nodes in a tbody it patches. That is safe as long as mono only ever adds and
 * moves its own rows (a framework never touches a node it did not create), and
 * re-places them whenever the framework's patch shifts the rows around — a
 * `MutationObserver` on the tbody's children does that, in the same microtask
 * checkpoint as the patch, so a misplaced band is never painted. A framework
 * removing a range that happens to include a band (a fragment unmount) simply
 * gets the band re-created on the next pass.
 *
 * Which `<tr>` is "row i": the tbody's rows in DOM order, minus every row that
 * is not a data row — mono's bands, `[data-mono-stripe-skip]` rows (mono's own
 * overlay rows and a consumer's extras), `aria-hidden` spacers, detail / filler /
 * group rows. The same set the zebra stripe skips. If that count does not match
 * `ctrl.items` the framework is mid-patch and the pass is skipped; its own
 * mutations trigger the next one.
 *
 * Band checkboxes (`selectable`): a band at a level with `selectable` gets a
 * `<mono-table-checkbox type="grouped">` in the column the ROW checkboxes sit in —
 * found from a data row's `mono-table-checkbox` (else a header one, else the
 * configured `field`'s header cell), remembered for when every band is folded. The
 * band is then cut into: one lead cell per cell in front of that column (mirroring
 * its pinning, so a pinned flag column stays pinned), the checkbox cell, and the
 * label cell spanning the rest. No row checkbox anywhere → no band checkbox.
 */

import { columnCount } from './table-overlay'
import { colorClassToken, customColorStyle, isThemeColorToken } from '../../composables/color'
import { isIconifyClass } from '../../composables/icon'
import type { MonoGroupedItem, MonoGroupedWindow } from './grouped-bands'

/** The row checkbox element tags — light and shadow builds. */
const ROW_CHECKBOX = 'mono-table-checkbox, mono-shadow-table-checkbox'
const PIN_LEFT = '.mono-table-sticky-left,[mono-sticky-left]'
const PIN_RIGHT = '.mono-table-sticky-right,[mono-sticky-right]'

/** One cell of the checkbox column's row, up to and including the checkbox's own cell. */
interface CheckCell {
  span: number
  pin: 'left' | 'right' | null
  /** The pin offset custom properties / inline `left` / `right` it carries. */
  style: string
}

/** Where the band checkbox goes, read off the table. */
interface CheckColumn {
  tag: string
  size?: string
  color?: string
  /** The cells in front of the checkbox's cell, then its cell (last). */
  cells: CheckCell[]
  /** Columns covered by `cells`. */
  cols: number
  /** px the label must clear on a sideways scroll: where the pinned checkbox cell ends. */
  labelLeft: number
  /** The row checkbox cell's `text-align`, so the band box lines up with the row boxes. */
  align: string
}

function pinOf(cell: Element): CheckCell['pin'] {
  return cell.matches(PIN_LEFT) ? 'left' : cell.matches(PIN_RIGHT) ? 'right' : null
}

function pinStyle(cell: HTMLElement): string {
  const st = cell.style
  const out: string[] = []
  for (const prop of ['--mono-table-sticky-left', '--mono-table-sticky-right', 'left', 'right']) {
    const v = st.getPropertyValue(prop)
    if (v) out.push(`${prop}: ${v}`)
  }
  return out.join('; ')
}

/** The cells of `row` up to and including `target`, as a {@link CheckColumn}. */
function columnFrom(row: HTMLTableRowElement, target: HTMLTableCellElement, box: Element | null): CheckColumn {
  const cells: CheckCell[] = []
  let cols = 0
  for (const cell of Array.from(row.cells)) {
    cells.push({ span: Math.max(1, cell.colSpan || 1), pin: pinOf(cell), style: pinStyle(cell) })
    cols += Math.max(1, cell.colSpan || 1)
    if (cell === target) break
  }
  const cs = getComputedStyle(target)
  // A pinned-left cell stops at its `left`; its right edge is where the label must stop.
  const labelLeft = pinOf(target) === 'left' ? (parseFloat(cs.left) || 0) + target.getBoundingClientRect().width : 0
  const el = box as (Element & { size?: string; color?: string }) | null
  return {
    tag: el?.localName ?? 'mono-table-checkbox',
    size: el?.size || undefined,
    color: el?.color || undefined,
    cells,
    cols,
    labelLeft: Math.round(labelLeft),
    align: box ? cs.textAlign : '',
  }
}

/** The band box's `cssClass` when none is configured — one object, so it never reads as a change. */
const NO_CSS_CLASS = Object.freeze({})

/** The band checkbox element's surface the injector sets. */
type BandCheckbox = HTMLElement & {
  type?: string
  groupedPath?: string
  dataGrid?: unknown
  size?: string
  color?: string
  disabled?: boolean
  ariaLabelText?: string
}

/** What the injector reads off the controller. */
export interface BandHost {
  subscribe(cb: () => void): () => void
  readonly groupedWindow: MonoGroupedWindow | null
  /** Every band drawn (the ones under a folded band are not). */
  readonly grouped: readonly unknown[]
  /** Bands + visible rows — equal to `grouped.length` when every band is folded. */
  readonly virtualSlotCount?: number
  readonly items: unknown[]
  readonly scrollMode: 'off' | 'infinity' | 'virtual'
  readonly virtualRowHeight?: number
  toggleGrouped(path: string): void
}

const NON_DATA_ROW =
  '[mono-grouped],[data-mono-stripe-skip],[aria-hidden="true"],[mono-detail-row],.mono-table-detail-row,' +
  '[mono-filler],.mono-table-filler,[mono-group-row],.mono-table-group-row'

/** The tbody's data rows, in order — see the module comment. */
export function dataRowsOf(body: HTMLTableSectionElement): HTMLTableRowElement[] {
  const out: HTMLTableRowElement[] = []
  for (const tr of Array.from(body.rows)) if (!tr.matches(NON_DATA_ROW)) out.push(tr)
  return out
}

function isDetailRow(el: Element | null): boolean {
  return !!el && el.matches('[mono-detail-row],.mono-table-detail-row')
}

export class BandInjector {
  readonly table: HTMLTableElement
  private readonly ctrl: BandHost
  /** Band rows by path — reused across passes so a band keeps its node (and focus). */
  private readonly rows = new Map<string, HTMLTableRowElement>()
  private body: HTMLTableSectionElement | null = null
  private unsubscribe: (() => void) | null = null
  private mo: MutationObserver | null = null
  private ro: ResizeObserver | null = null
  private queued = false
  private stopped = false
  /** The last checkbox column found — kept for passes with no row to read it from. */
  private checkCol: CheckColumn | null = null

  constructor(ctrl: BandHost, table: HTMLTableElement) {
    this.ctrl = ctrl
    this.table = table
    this.unsubscribe = ctrl.subscribe(() => this.schedule())
    if (typeof ResizeObserver !== 'undefined') {
      this.ro = new ResizeObserver(() => this.syncHeadHeight())
      if (table.tHead) this.ro.observe(table.tHead)
    }
    this.schedule()
  }

  /** Re-run a pass now-ish (after a config change that may not notify). */
  refresh(): void {
    this.schedule()
  }

  stop(): void {
    this.stopped = true
    this.unsubscribe?.()
    this.unsubscribe = null
    this.mo?.disconnect()
    this.mo = null
    this.ro?.disconnect()
    this.ro = null
    this.removeAll()
  }

  private schedule(): void {
    if (this.queued || this.stopped) return
    this.queued = true
    queueMicrotask(() => {
      this.queued = false
      if (!this.stopped) this.flush()
    })
  }

  /** Watch the CURRENT tbody — a framework may swap it. */
  private watch(body: HTMLTableSectionElement | null): void {
    if (body === this.body) return
    this.mo?.disconnect()
    this.body = body
    if (!body || typeof MutationObserver === 'undefined') return
    this.mo ??= new MutationObserver(() => this.schedule())
    this.mo.observe(body, { childList: true })
  }

  private syncHeadHeight(): void {
    const h = this.table.tHead?.getBoundingClientRect().height ?? 0
    const v = `${Math.round(h)}px`
    if (this.table.style.getPropertyValue('--mono-table-grouped-head') !== v) {
      this.table.style.setProperty('--mono-table-grouped-head', v)
    }
  }

  private removeAll(): void {
    for (const tr of this.rows.values()) tr.remove()
    this.rows.clear()
    this.table.removeAttribute('mono-grouped-table')
    this.table.removeAttribute('mono-grouped-folded')
    this.table.style.removeProperty('--mono-table-grouped-h')
  }

  /** One placement pass. Public for tests; normally driven by notify / mutations. */
  flush(): void {
    const body = this.table.tBodies[0] ?? null
    this.watch(body)
    const win = this.ctrl.groupedWindow
    if (!win || !body) {
      this.removeAll()
      return
    }
    const data = dataRowsOf(body)
    if (data.length !== this.ctrl.items.length) return // mid-patch — the patch's own mutations come back here

    this.table.setAttribute('mono-grouped-table', '')
    // Every band folded — no data row anywhere, only full-width bands. The CSS drops the
    // filler's column lines then: under nothing but bands they would start from nowhere.
    const folded = this.ctrl.grouped.length > 0 && this.ctrl.virtualSlotCount === this.ctrl.grouped.length
    if (folded !== this.table.hasAttribute('mono-grouped-folded')) {
      this.table.toggleAttribute('mono-grouped-folded', folded)
    }
    const rh = this.ctrl.scrollMode === 'virtual' ? this.ctrl.virtualRowHeight : undefined
    const hv = rh && rh > 0 ? `${rh}px` : ''
    if (this.table.style.getPropertyValue('--mono-table-grouped-h') !== hv) {
      if (hv) this.table.style.setProperty('--mono-table-grouped-h', hv)
      else this.table.style.removeProperty('--mono-table-grouped-h')
    }
    if (!this.table.style.getPropertyValue('--mono-table-grouped-head')) this.syncHeadHeight()

    const span = columnCount(this.table) || 1
    const keep = new Set<string>()
    const checkCol = this.findCheckColumn(data, win, span)

    // Groups of bands, each placed in order in front of one reference row.
    const groups: Array<{ bands: MonoGroupedItem[]; off: number }> = []
    const atZero = win.before.get(0) ?? []
    if (win.leads.length || atZero.length) groups.push({ bands: [...win.leads, ...atZero], off: 0 })
    const offs = [...win.before.keys()].filter((k) => k !== 0).sort((a, b) => a - b)
    for (const off of offs) groups.push({ bands: win.before.get(off)!, off })

    for (const { bands, off } of groups) {
      const trs = bands.map((b) => {
        keep.add(b.path)
        return this.rowFor(b, span, checkCol)
      })
      if (off < data.length) {
        // In front of data row `off`: walk backwards so each check is "my next element is right".
        let ref: Element = data[off]!
        for (let j = trs.length - 1; j >= 0; j--) {
          const tr = trs[j]!
          if (tr.parentNode !== body || tr.nextElementSibling !== ref) body.insertBefore(tr, ref)
          ref = tr
        }
      } else {
        // After the last row (trailing collapsed bands) — past its detail row too.
        let prev: Element | null = data.length ? data[data.length - 1]! : null
        while (prev && isDetailRow(prev.nextElementSibling)) prev = prev.nextElementSibling
        // No data rows at all (every band folded): in front of the first spacer / filler —
        // with nothing in the window there is no top spacer, so that one is the bottom one.
        const fallback = prev
          ? null
          : body.querySelector(':scope > tr[aria-hidden="true"], :scope > tr[mono-filler], :scope > tr.mono-table-filler')
        for (const tr of trs) {
          const ok = tr.parentNode === body && (prev ? tr.previousElementSibling === prev : !tr.previousElementSibling || tr.nextElementSibling === fallback)
          if (!ok) body.insertBefore(tr, prev ? prev.nextSibling : fallback)
          prev = tr
        }
      }
    }

    for (const [path, tr] of this.rows) {
      if (!keep.has(path)) {
        tr.remove()
        this.rows.delete(path)
      }
    }
    // Our own moves are not news.
    this.mo?.takeRecords()
  }

  /**
   * The column the band checkboxes go in, or `null` (no band asks for one, or the
   * table has no row checkbox to line up with). See the module comment.
   */
  private findCheckColumn(data: HTMLTableRowElement[], win: MonoGroupedWindow, span: number): CheckColumn | null {
    let field: string | undefined
    let wanted = false
    for (const b of [...win.leads, ...[...win.before.values()].flat()]) {
      if (!b.selectable) continue
      wanted = true
      field ??= b.selectable.field
    }
    if (!wanted) return this.checkCol
    let found: CheckColumn | null = null
    // 1. A data row's own checkbox.
    for (const row of data) {
      const box = row.querySelector(ROW_CHECKBOX)
      const cell = box?.closest('td,th') as HTMLTableCellElement | null
      if (box && cell && cell.parentElement === row) {
        found = columnFrom(row, cell, box)
        break
      }
    }
    // 2. The header: its select-all, else the configured field's cell.
    if (!found && this.table.tHead) {
      for (const row of Array.from(this.table.tHead.rows)) {
        let cell: HTMLTableCellElement | null = null
        let box: Element | null = null
        for (const c of Array.from(row.cells)) {
          box = c.querySelector(ROW_CHECKBOX)
          if (box) {
            cell = c
            break
          }
          const th = c.querySelector('mono-table-th, mono-shadow-table-th') as (Element & { field?: string }) | null
          if (field && (c.getAttribute('data-field') === field || th?.field === field || th?.getAttribute('field') === field)) {
            cell = c
            break
          }
        }
        if (cell) {
          found = columnFrom(row, cell, box)
          // A header cell carries the header's look — only its pinning is wanted.
          if (!box) {
            found.tag = this.checkCol?.tag ?? 'mono-table-checkbox'
            found.size ??= this.checkCol?.size
            found.color ??= this.checkCol?.color
            found.align = this.checkCol?.align ?? ''
          }
          break
        }
      }
    }
    if (found && found.cols >= span) found = null // nothing left for the label
    if (found) this.checkCol = found
    // The element must be registered — a table that never loaded the row checkbox
    // gets none on its bands either.
    const col = found ?? this.checkCol
    if (col && typeof customElements !== 'undefined' && !customElements.get(col.tag)) return null
    return col
  }

  /** The band's row — created on first use, its attributes / text kept current. */
  private rowFor(b: MonoGroupedItem, span: number, checkCol: CheckColumn | null): HTMLTableRowElement {
    let tr = this.rows.get(b.path)
    if (!tr) {
      tr = document.createElement('tr')
      tr.className = 'mono-table-grouped'
      tr.setAttribute('mono-grouped', '')
      tr.setAttribute('data-mono-stripe-skip', '')
      const td = document.createElement('td')
      td.setAttribute('mono-grouped-cell', '')
      const label = document.createElement('div')
      label.setAttribute('mono-grouped-label', '')
      const chevron = document.createElement('span')
      chevron.setAttribute('mono-grouped-chevron', '')
      chevron.setAttribute('aria-hidden', 'true')
      const icon = document.createElement('span')
      icon.setAttribute('mono-grouped-icon', '')
      icon.setAttribute('aria-hidden', 'true')
      icon.hidden = true
      const text = document.createElement('span')
      text.setAttribute('mono-grouped-text', '')
      const count = document.createElement('span')
      count.setAttribute('mono-grouped-count', '')
      label.append(chevron, icon, text, count)
      td.appendChild(label)
      tr.appendChild(td)
      const toggle = (e: Event): void => {
        // The band's checkbox selects; it never folds the band.
        if ((e.target as Element | null)?.closest?.('[mono-grouped-check]')) return
        const path = tr!.dataset.groupedPath
        if (path && tr!.hasAttribute('mono-grouped-collapsible')) this.ctrl.toggleGrouped(path)
      }
      tr.addEventListener('click', toggle)
      tr.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          if ((e.target as Element | null)?.closest?.('[mono-grouped-check]')) return
          e.preventDefault()
          toggle(e)
        }
      })
      this.rows.set(b.path, tr)
    }

    const set = (name: string, value: string | null): void => {
      if (value == null) {
        if (tr!.hasAttribute(name)) tr!.removeAttribute(name)
      } else if (tr!.getAttribute(name) !== value) tr!.setAttribute(name, value)
    }
    set('data-grouped-path', b.path)
    set('mono-grouped-level', String(b.level))
    set('mono-grouped-field', b.field)
    set('mono-variant', b.variant)
    const token = colorClassToken(b.color) || 'primary'
    set('mono-color', token)
    const custom = isThemeColorToken(b.color) ? '' : customColorStyle(b.color, 'table-grouped')
    if ((tr.getAttribute('style') ?? '') !== custom) {
      if (custom) tr.setAttribute('style', custom)
      else tr.removeAttribute('style')
    }
    set('mono-grouped-collapsible', b.collapsible ? '' : null)
    set('mono-grouped-collapsed', b.collapsed ? '' : null)
    set('aria-expanded', b.collapsible ? String(!b.collapsed) : null)
    set('tabindex', b.collapsible ? '0' : null)

    const td = tr.querySelector(':scope > td[mono-grouped-cell]') as HTMLTableCellElement
    const withCheck = checkCol && b.selectable ? checkCol : null
    this.syncCells(tr, td, b, withCheck)
    const labelSpan = withCheck ? span - withCheck.cols : span
    if (td.colSpan !== labelSpan) td.colSpan = labelSpan
    const left = withCheck?.labelLeft ? `${withCheck.labelLeft}px` : ''
    if (td.style.getPropertyValue('--_mono-table-grouped-label-left') !== left) {
      if (left) td.style.setProperty('--_mono-table-grouped-label-left', left)
      else td.style.removeProperty('--_mono-table-grouped-label-left')
    }
    set('mono-grouped-selectable', withCheck ? '' : null)
    const label = td.firstElementChild as HTMLElement
    const [, icon, text, count] = Array.from(label.children) as HTMLElement[]
    this.syncIcon(icon!, b.icon)
    if (text!.textContent !== b.label) text!.textContent = b.label
    const c = b.showCount ? `(${b.count})` : ''
    if (count!.textContent !== c) count!.textContent = c
    if (count!.hidden !== !b.showCount) count!.hidden = !b.showCount
    return tr
  }

  /**
   * The cells in front of the label: the lead cells and the checkbox cell, rebuilt only
   * when the column layout changed; the checkbox's own props kept current.
   */
  private syncCells(tr: HTMLTableRowElement, label: HTMLTableCellElement, b: MonoGroupedItem, col: CheckColumn | null): void {
    const shape = col ? `${col.tag}|${col.align}|${col.cells.map((c) => `${c.span}:${c.pin ?? ''}:${c.style}`).join(',')}` : ''
    if ((tr.dataset.groupedShape ?? '') !== shape) {
      tr.dataset.groupedShape = shape
      while (tr.firstElementChild && tr.firstElementChild !== label) tr.firstElementChild.remove()
      if (col) {
        col.cells.forEach((c, i) => {
          const cell = document.createElement('td')
          const isCheck = i === col.cells.length - 1
          cell.setAttribute(isCheck ? 'mono-grouped-check' : 'mono-grouped-lead', '')
          if (c.span > 1) cell.colSpan = c.span
          if (c.pin) cell.setAttribute(`mono-sticky-${c.pin}`, '')
          const style = [c.style, isCheck && col.align ? `text-align: ${col.align}` : ''].filter(Boolean).join('; ')
          if (style) cell.setAttribute('style', style)
          if (isCheck) cell.appendChild(document.createElement(col.tag))
          tr.insertBefore(cell, label)
        })
      }
    }
    if (!col) return
    const box = tr.querySelector(':scope > td[mono-grouped-check] > *') as BandCheckbox | null
    if (!box) return
    const cb = b.selectable!.checkbox
    if (box.type !== 'grouped') box.type = 'grouped'
    if (box.groupedPath !== b.path) box.groupedPath = b.path
    if (box.dataGrid !== this.ctrl) box.dataGrid = this.ctrl
    // `selectable.checkbox` — the box's own props. Each one falls back to a STABLE value
    // (the row boxes' size / colour, the element's defaults), so an unchanged config
    // writes nothing and the box does not re-render on every pass.
    const want: Record<string, unknown> = {
      size: cb.size ?? col.size ?? 'md',
      color: cb.color ?? col.color ?? 'primary',
      disabled: cb.disabled ?? false,
      label: cb.label ?? '',
      sublabel: cb.sublabel ?? '',
      ariaLabelText: cb.ariaLabelText ?? b.label,
      cssClass: cb.cssClass ?? NO_CSS_CLASS,
      cssClassName: cb.cssClassName ?? '',
    }
    const el = box as unknown as Record<string, unknown>
    for (const [k, v] of Object.entries(want)) if (el[k] !== v) el[k] = v
  }

  /**
   * The band's icon, the way every mono icon works: an iconify class
   * (`i-mdi-tag`) is an empty span carrying the class — UnoCSS's preset-icons
   * paints it as a mask, and since the band row is light DOM the page's utility
   * CSS reaches it — anything else (an emoji, a character) is plain text.
   * Rewritten only when the value changed.
   */
  private syncIcon(el: HTMLElement, icon: string): void {
    const value = (icon ?? '').trim()
    if (el.dataset.icon === value) return
    el.dataset.icon = value
    el.replaceChildren()
    el.hidden = !value
    if (!value) return
    if (isIconifyClass(value)) {
      const glyph = document.createElement('span')
      glyph.className = value
      glyph.setAttribute('mono-glyph', '')
      el.removeAttribute('mono-grouped-icon-text')
      el.appendChild(glyph)
    } else {
      el.setAttribute('mono-grouped-icon-text', '')
      el.textContent = value
    }
  }
}
