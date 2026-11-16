import { type CssSizeValue } from '../../composables/css-size'

/**
 * Content-sized columns — what `mono-table-th`'s `width="auto"` drives.
 *
 * Under `mono-table-fixed` (`table-layout: fixed`) CSS cannot do this: an `auto` column takes
 * the WHOLE surplus instead of fitting its content, and `min-width` / `max-width` on a cell are
 * ignored by the table algorithm. So the column is measured here and handed a concrete px width,
 * clamped to `minWidth` / `maxWidth`, written to its `<col>` (which wins under fixed layout) and
 * to the header cell.
 *
 * Text is measured with a canvas, not read back from the cell: reading the cell's own width would
 * return the width last written, and a column could then never shrink. Measuring text also keeps
 * the pass free of layout reads, so re-running it on every change is cheap.
 *
 * What is measured: the header (caption + its icons), every body cell and every FOOTER cell of
 * the column. The footer matters — a `<mono-table-summary>` total covers the whole set, so a
 * virtual-scroll window that only shows small figures still sizes for the largest one.
 *
 * Cell content is treated as one line (what a money column is). An editor (`<input>`, including
 * the one inside `mono-input`) counts with its value and its own padding / border.
 */

/** The text measurer — swappable so tests can run where there is no canvas (jsdom). */
export const autosizeEnv = {
  measure: defaultMeasure as (text: string, font: string) => number,
}

let ctx: CanvasRenderingContext2D | null | undefined

function defaultMeasure(text: string, font: string): number {
  if (ctx === undefined) ctx = document.createElement('canvas').getContext('2d')
  if (!ctx) return text.length * 8 // no canvas: a rough average glyph width
  ctx.font = font
  return ctx.measureText(text).width
}

/**
 * A canvas `font` string for a computed style — always built from the longhands.
 *
 * NOT `style.font`: the shorthand serialises to `''` whenever a longhand it cannot express is set,
 * and `font-variant-numeric: tabular-nums` (every `mono-table-summary`) is one. The old fallback then
 * put `fontVariant` (`tabular-nums`) into the string, canvas rejected it, kept its default
 * `10px sans-serif`, and a footer total measured far too narrow — the largest figure ellipsed.
 * Only `small-caps` is a variant canvas takes; tabular figures are handled in `measureStyled`.
 */
function fontOf(style: CSSStyleDeclaration): string {
  const caps = style.fontVariantCaps === 'small-caps' ? 'small-caps' : ''
  return [style.fontStyle, caps, style.fontWeight, style.fontSize, style.fontFamily].filter(Boolean).join(' ')
}

const px = (v: string) => parseFloat(v) || 0

/** The widest digit in `font` — a tabular figure's advance, which canvas cannot be asked for. */
const digitWidths = new Map<string, number>()
function maxDigit(font: string): number {
  let w = digitWidths.get(font)
  if (w === undefined) {
    w = Math.max(...'0123456789'.split('').map((d) => autosizeEnv.measure(d, font)))
    digitWidths.set(font, w)
  }
  return w
}

/**
 * `text` as the element renders it: its `text-transform`, its `letter-spacing` (canvas ignores
 * both) and its `font-variant-numeric: tabular-nums` (every digit at the widest digit's advance —
 * a safe upper bound; tabular figures are wider than the proportional ones canvas measures).
 */
export function measureStyled(text: string, style: CSSStyleDeclaration): number {
  const font = fontOf(style)
  if (style.textTransform === 'uppercase') text = text.toUpperCase()
  else if (style.textTransform === 'lowercase') text = text.toLowerCase()
  let width: number
  if (/tabular-nums/.test(style.fontVariantNumeric ?? '')) {
    const digits = text.replace(/\D/g, '').length
    width = autosizeEnv.measure(text.replace(/\d/g, ''), font) + digits * maxDigit(font)
  } else {
    width = autosizeEnv.measure(text, font)
  }
  return width + px(style.letterSpacing) * text.length
}

/** Horizontal padding + border of an element's box. */
function boxX(style: CSSStyleDeclaration): number {
  return (
    px(style.paddingLeft) + px(style.paddingRight) + px(style.borderLeftWidth) + px(style.borderRightWidth)
  )
}

/**
 * A size prop as px: a number / bare numeric string / `px` → px, `rem` → × the root font size,
 * `em` → × `el`'s font size. Anything else (`%`, `auto`, a var) → `undefined`: not a bound.
 */
export function cssLengthToPx(value: CssSizeValue | null, el?: Element): number | undefined {
  if (value == null) return undefined
  if (typeof value === 'number') return Number.isFinite(value) ? value : undefined
  const m = /^\s*(-?\d+(?:\.\d+)?)\s*(px|rem|em)?\s*$/i.exec(value)
  if (!m) return undefined
  const n = parseFloat(m[1]!)
  const unit = (m[2] ?? 'px').toLowerCase()
  if (unit === 'px') return n
  const ref = unit === 'rem' ? document.documentElement : (el ?? document.documentElement)
  return n * (px(getComputedStyle(ref).fontSize) || 16)
}

/** `w` clamped to `[min, max]`; an unset bound does not clamp. `min` wins over a smaller `max`. */
export function clampWidth(w: number, min?: number, max?: number): number {
  if (max != null) w = Math.min(w, max)
  if (min != null) w = Math.max(w, min)
  return w
}

/**
 * The grid column a header cell STARTS at — a walk over its section's rows honouring `rowspan`
 * and `colspan`, so a leaf header under a band row (`<th colspan>` above it) maps to its real
 * column. `cellIndex` alone would count only the cells of its own row.
 */
export function headerColumnIndex(cell: HTMLTableCellElement): number {
  const section = cell.parentElement?.parentElement
  if (!section) return cell.cellIndex
  const taken: boolean[][] = []
  const rows = Array.from(section.children).filter((r): r is HTMLTableRowElement => r.tagName === 'TR')
  for (let r = 0; r < rows.length; r++) {
    taken[r] ??= []
    let c = 0
    for (const cur of Array.from(rows[r]!.cells)) {
      while (taken[r]![c]) c++
      if (cur === cell) return c
      for (let dr = 0; dr < Math.max(1, cur.rowSpan); dr++) {
        const row = (taken[r + dr] ??= [])
        for (let dc = 0; dc < Math.max(1, cur.colSpan); dc++) row[c + dc] = true
      }
      c += Math.max(1, cur.colSpan)
    }
  }
  return cell.cellIndex
}

/** The single-column cell of `row` at grid column `col` — a spanning cell (a spacer row) is none. */
function cellAt(row: HTMLTableRowElement, col: number): HTMLTableCellElement | undefined {
  let c = 0
  for (const cell of Array.from(row.cells)) {
    const span = Math.max(1, cell.colSpan)
    if (c === col) return span === 1 ? cell : undefined
    if (c > col) return undefined
    c += span
  }
  return undefined
}

/** The `<col>` at grid column `col`, honouring `<col span>`. */
function colAt(table: HTMLTableElement, col: number): HTMLTableColElement | undefined {
  let c = 0
  for (const group of Array.from(table.children).filter((e) => e.tagName === 'COLGROUP')) {
    const cols = Array.from(group.children).filter((e): e is HTMLTableColElement => e.tagName === 'COL')
    for (const el of cols) {
      const span = Math.max(1, el.span || 1)
      if (col < c + span) return span === 1 ? el : undefined
      c += span
    }
  }
  return undefined
}

/** An element hidden by `v-show` / `hidden` — its text does not show, so it does not count. */
function isHidden(el: Element): boolean {
  return (el as HTMLElement).hidden === true || (el as HTMLElement).style?.display === 'none'
}

/** The one-line width a cell's content needs, padding included. */
export function contentWidth(cell: HTMLElement): number {
  let width = 0
  const walk = (node: Node): void => {
    for (const child of Array.from(node.childNodes)) {
      if (child.nodeType === Node.TEXT_NODE) {
        const text = (child.textContent ?? '').replace(/\s+/g, ' ')
        if (!text.trim()) continue
        // A text node straight under a shadow root has no parent ELEMENT — its styles are the host's.
        const parent = child.parentElement ?? (node as ShadowRoot).host ?? cell
        width += measureStyled(text, getComputedStyle(parent))
      } else if (child.nodeType === Node.ELEMENT_NODE) {
        const el = child as HTMLElement
        if (isHidden(el)) continue
        if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
          const input = el as HTMLInputElement
          const style = getComputedStyle(input)
          width += measureStyled(input.value || input.placeholder || '', style) + boxX(style)
          continue
        }
        if (el.tagName === 'SVG' || el.tagName === 'svg') {
          width += el.getBoundingClientRect?.().width || 0
          continue
        }
        // A shadow-DOM editor keeps its input inside its root.
        walk(el.shadowRoot ?? el)
      }
    }
  }
  walk(cell)
  return width + boxX(getComputedStyle(cell))
}

/** The header cell's need: the caption text plus whatever icons sit beside it. */
function headerWidth(cell: HTMLElement, host: HTMLElement): number {
  const label = host.querySelector('[data-mono-slot="label"]') as HTMLElement | null
  const text = (label?.textContent ?? host.textContent ?? '').replace(/\s+/g, ' ').trim()
  let width = text ? measureStyled(text, getComputedStyle(label ?? host)) : 0
  // The sort arrow and the filter funnel — laid out boxes, so read their size. A label-trigger
  // sort button wraps the caption itself and is already counted.
  for (const icon of Array.from(
    host.querySelectorAll('.mono-th-filter-ind, .mono-table-sort-btn:not(.label-trigger), .mono-th-required'),
  )) {
    const w = (icon as HTMLElement).getBoundingClientRect?.().width || 0
    width += w ? w + 4 : 0 // + the flex gap
  }
  return width + boxX(getComputedStyle(cell))
}

/** The body / footer row of `table` that `node` sits in — never a row of a table nested in a cell. */
function ownRow(node: Node, table: HTMLTableElement): HTMLTableRowElement | undefined {
  for (let el: Element | null = node instanceof Element ? node : node.parentElement; el; el = el.parentElement) {
    if (el === table) return undefined
    if (el.tagName === 'TR' && el.parentElement?.parentElement === table) return el as HTMLTableRowElement
  }
  return undefined
}

/**
 * What a batch of body mutations touched: the rows that were added or changed inside, and whether
 * anything changed OUTSIDE a row (a section swapped in, a `<tfoot>` from `v-if`) — that is `full`.
 * Removed rows are not tracked: a grow-only column cannot narrow, every other column re-measures
 * in full on any change.
 */
interface BodyChange {
  rows: Set<HTMLTableRowElement>
  full: boolean
}

/**
 * ONE observer + input listener per TABLE, shared by every auto column in it.
 *
 * Each column used to own a `subtree` observer on the whole table. Under virtual scroll every
 * window shift inserts and removes dozens of rows, so a table with 13 auto columns queued 13
 * copies of every record (≈112k records for a 120-step scroll) and each column re-measured the
 * WHOLE body, header included, on every step. The records are now classified once — which rows
 * came in or changed — and each column decides from that how much to re-measure.
 */
class TableWatch {
  readonly sizers = new Set<ColumnAutoSize>()
  private readonly _observer: MutationObserver

  private readonly _onInput = (e: Event): void => {
    const t = e.target as Element | null
    if (!t || this.table.tHead?.contains(t)) return
    const row = ownRow(t, this.table)
    this._notify({ rows: new Set(row ? [row] : []), full: !row })
  }

  /**
   * A web font that finished loading after a measurement: canvas measured the FALLBACK face, so
   * the width (and the cached digit advances) are stale — usually too narrow for the real font.
   */
  private readonly _onFonts = (): void => {
    digitWidths.clear()
    for (const s of this.sizers) s.schedule()
  }

  constructor(readonly table: HTMLTableElement) {
    // The whole table, subtree: the `<tfoot>` comes and goes with `v-if`. Header churn (the
    // `mono-table-th` elements' own re-renders) is filtered out — it would only re-schedule us forever.
    this._observer = new MutationObserver((records) => this._onRecords(records))
    this._observer.observe(table, { childList: true, characterData: true, subtree: true })
    // Typing changes an input's value without touching the DOM.
    table.addEventListener('input', this._onInput, true)
    document.fonts?.addEventListener?.('loadingdone', this._onFonts)
  }

  dispose(): void {
    this._observer.disconnect()
    this.table.removeEventListener('input', this._onInput, true)
    document.fonts?.removeEventListener?.('loadingdone', this._onFonts)
  }

  private _onRecords(records: MutationRecord[]): void {
    const head = this.table.tHead
    const change: BodyChange = { rows: new Set(), full: false }
    let relevant = false
    for (const r of records) {
      if (head?.contains(r.target)) continue
      relevant = true
      const target = r.target
      const isSection = target.parentNode === this.table && /^(TBODY|TFOOT)$/.test((target as Element).tagName ?? '')
      if (r.type === 'childList' && isSection) {
        // Rows in and out of a body section — the virtual-scroll window moving.
        for (const n of Array.from(r.addedNodes)) {
          if (n.nodeType !== Node.ELEMENT_NODE) continue // Vue's text / comment anchors
          if ((n as Element).tagName === 'TR') change.rows.add(n as HTMLTableRowElement)
          else change.full = true
        }
        continue
      }
      const row = ownRow(target, this.table)
      if (row) change.rows.add(row)
      else change.full = true // the table itself (a section swapped), or something outside a row
    }
    if (relevant) this._notify(change)
  }

  private _notify(change: BodyChange): void {
    for (const s of this.sizers) s._bodyChanged(change)
  }
}

const tableWatches = new WeakMap<HTMLTableElement, TableWatch>()

/**
 * One auto-sized column, owned by its `mono-table-th`. `schedule()` coalesces every trigger (a
 * controller notify, a body mutation, typing in an editor) into one measurement per frame.
 */
export class ColumnAutoSize {
  min?: number
  max?: number
  /**
   * Never shrink — for a virtual-scroll table, whose body holds only the WINDOW of the rows: each
   * window shift measured a different slice, so the column grew and shrank as the list scrolled and
   * every change relaid the whole table. The column settles at the widest value seen instead, until
   * `resetFloor()` (a new result set).
   *
   * It also makes body changes INCREMENTAL: a column that can only grow needs to look at nothing
   * but the rows that came in or changed — everything else is already in the floor. A window shift
   * then measures the few rows that scrolled in, not the whole window plus the header.
   */
  growOnly = false

  private _floor = 0
  private _raf = 0
  /** The next measurement must walk header + every row (vs. only `_dirty`). */
  private _full = true
  private _dirty = new Set<HTMLTableRowElement>()
  private _watch?: TableWatch
  private _wrote?: { col?: HTMLTableColElement; cell: HTMLElement }

  constructor(private readonly host: HTMLElement) {}

  /**
   * Every sizer on the page shares ONE frame callback (`_flush`), which measures all of them
   * first and writes all of them after.
   *
   * Each used to run in its own frame callback, measure-then-write: column A wrote its width,
   * so column B's measurement (`getBoundingClientRect` on header icons, an SVG) forced a
   * synchronous layout of the whole table — one per auto column, per frame.
   */
  private static _queued = new Set<ColumnAutoSize>()
  private static _frame = 0

  private static _flush(): void {
    ColumnAutoSize._frame = 0
    const batch = [...ColumnAutoSize._queued]
    ColumnAutoSize._queued.clear()
    const writes = batch.map((s) => {
      s._raf = 0
      return s._measure()
    })
    for (const write of writes) write?.()
  }

  /** Re-measure everything — header, body and footer — on the next frame. */
  schedule(): void {
    this._full = true
    this._queue()
  }

  /**
   * @internal — from the table's shared watcher. A grow-only column with a floor already set only
   * needs the rows that came in or changed (a removed row cannot make it wider); anything else
   * measures in full.
   */
  _bodyChanged(change: BodyChange): void {
    if (change.full || !this.growOnly || !this._floor) this._full = true
    else for (const row of change.rows) this._dirty.add(row)
    if (this._full || this._dirty.size) this._queue()
  }

  private _queue(): void {
    if (this._raf) return
    this._raf = 1
    ColumnAutoSize._queued.add(this)
    ColumnAutoSize._frame ||= requestAnimationFrame(() => ColumnAutoSize._flush())
  }

  /** Forget the grow-only floor (new rows) and re-measure. */
  resetFloor(): void {
    if (!this._floor) return
    this._floor = 0
    this.schedule()
  }

  /** Stop watching, and hand the column back to whatever width it is given next. */
  stop(clear = false): void {
    ColumnAutoSize._queued.delete(this)
    this._raf = 0
    this._full = true
    this._dirty.clear()
    this._unwatch()
    if (clear && this._wrote) {
      if (this._wrote.col) this._wrote.col.style.width = ''
      this._wrote.cell.style.width = ''
    }
    this._wrote = undefined
  }

  private _watchTable(table: HTMLTableElement): void {
    if (this._watch?.table === table) return
    this._unwatch()
    let watch = tableWatches.get(table)
    if (!watch) tableWatches.set(table, (watch = new TableWatch(table)))
    watch.sizers.add(this)
    this._watch = watch
  }

  private _unwatch(): void {
    const watch = this._watch
    if (!watch) return
    this._watch = undefined
    watch.sizers.delete(this)
    if (!watch.sizers.size) {
      watch.dispose()
      tableWatches.delete(watch.table)
    }
  }

  /** Measure now (reads only); returns the write to apply after every sizer has measured. */
  private _measure(): (() => void) | null {
    const cell = this.host.closest('th, td') as HTMLTableCellElement | null
    const table = cell?.closest('table') as HTMLTableElement | null
    if (!cell || !table || !this.host.isConnected) return null
    this._watchTable(table)

    const index = headerColumnIndex(cell)
    const full = this._full || !this.growOnly || !this._floor
    const dirty = this._dirty
    this._full = false
    this._dirty = new Set()

    let width: number
    if (full) {
      width = headerWidth(cell, this.host)
      const sections = [...Array.from(table.tBodies), ...(table.tFoot ? [table.tFoot] : [])]
      for (const section of sections) {
        for (const row of Array.from(section.rows)) {
          const target = cellAt(row, index)
          if (target) width = Math.max(width, contentWidth(target))
        }
      }
    } else {
      // Grow-only, floor set: only the rows that came in or changed can widen the column. No
      // header read either — it is already in the floor, and its icons are LAID-OUT boxes, so
      // reading them is what forced a synchronous layout of the whole table on every scroll step.
      width = 0
      for (const row of dirty) {
        if (!row.isConnected || row.parentElement?.parentElement !== table) continue
        const target = cellAt(row, index)
        if (target) width = Math.max(width, contentWidth(target))
      }
      if (!width) return null
    }
    width = Math.ceil(clampWidth(width + 1, this.min, this.max)) // +1: sub-pixel text never ellipses
    if (this.growOnly) {
      const grown = Math.max(width, this._floor)
      if (!full && grown === this._floor) return null // nothing wider came in
      width = this._floor = grown
    } else this._floor = 0
    const value = `${width}px`

    const col = colAt(table, index)
    return () => {
      // Skip a write that changes nothing — it would only re-trigger layout.
      if (cell.style.width !== value) cell.style.width = value
      if (col && col.style.width !== value) col.style.width = value
      this._wrote = { col, cell }
    }
  }
}
