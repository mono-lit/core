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
 */

import { columnCount } from './table-overlay'
import { colorClassToken, customColorStyle, isThemeColorToken } from '../../composables/color'
import type { MonoGroupedItem, MonoGroupedWindow } from './grouped-bands'

/** What the injector reads off the controller. */
export interface BandHost {
  subscribe(cb: () => void): () => void
  readonly groupedWindow: MonoGroupedWindow | null
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
    const rh = this.ctrl.scrollMode === 'virtual' ? this.ctrl.virtualRowHeight : undefined
    const hv = rh && rh > 0 ? `${rh}px` : ''
    if (this.table.style.getPropertyValue('--mono-table-grouped-h') !== hv) {
      if (hv) this.table.style.setProperty('--mono-table-grouped-h', hv)
      else this.table.style.removeProperty('--mono-table-grouped-h')
    }
    if (!this.table.style.getPropertyValue('--mono-table-grouped-head')) this.syncHeadHeight()

    const span = columnCount(this.table) || 1
    const keep = new Set<string>()

    // Groups of bands, each placed in order in front of one reference row.
    const groups: Array<{ bands: MonoGroupedItem[]; off: number }> = []
    const atZero = win.before.get(0) ?? []
    if (win.leads.length || atZero.length) groups.push({ bands: [...win.leads, ...atZero], off: 0 })
    const offs = [...win.before.keys()].filter((k) => k !== 0).sort((a, b) => a - b)
    for (const off of offs) groups.push({ bands: win.before.get(off)!, off })

    for (const { bands, off } of groups) {
      const trs = bands.map((b) => {
        keep.add(b.path)
        return this.rowFor(b, span)
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

  /** The band's row — created on first use, its attributes / text kept current. */
  private rowFor(b: MonoGroupedItem, span: number): HTMLTableRowElement {
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
      const text = document.createElement('span')
      text.setAttribute('mono-grouped-text', '')
      const count = document.createElement('span')
      count.setAttribute('mono-grouped-count', '')
      label.append(chevron, text, count)
      td.appendChild(label)
      tr.appendChild(td)
      const toggle = (): void => {
        const path = tr!.dataset.groupedPath
        if (path && tr!.hasAttribute('mono-grouped-collapsible')) this.ctrl.toggleGrouped(path)
      }
      tr.addEventListener('click', toggle)
      tr.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          toggle()
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

    const td = tr.firstElementChild as HTMLTableCellElement
    if (td.colSpan !== span) td.colSpan = span
    const label = td.firstElementChild as HTMLElement
    const [, text, count] = Array.from(label.children) as HTMLElement[]
    if (text!.textContent !== b.label) text!.textContent = b.label
    const c = b.showCount ? `(${b.count})` : ''
    if (count!.textContent !== c) count!.textContent = c
    if (count!.hidden !== !b.showCount) count!.hidden = !b.showCount
    return tr
  }
}
