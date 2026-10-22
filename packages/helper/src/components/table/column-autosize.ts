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

/** A computed style's font shorthand — some engines leave `font` empty and only fill the longhands. */
function fontOf(style: CSSStyleDeclaration): string {
  return (
    style.font ||
    [style.fontStyle, style.fontVariant, style.fontWeight, style.fontSize, style.fontFamily].filter(Boolean).join(' ')
  )
}

const px = (v: string) => parseFloat(v) || 0

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
        const parent = child.parentElement ?? cell
        width += autosizeEnv.measure(text, fontOf(getComputedStyle(parent)))
      } else if (child.nodeType === Node.ELEMENT_NODE) {
        const el = child as HTMLElement
        if (isHidden(el)) continue
        if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
          const input = el as HTMLInputElement
          const style = getComputedStyle(input)
          width += autosizeEnv.measure(input.value || input.placeholder || '', fontOf(style)) + boxX(style)
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
  let width = text ? autosizeEnv.measure(text, fontOf(getComputedStyle(label ?? host))) : 0
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

/**
 * One auto-sized column, owned by its `mono-table-th`. `schedule()` coalesces every trigger (a
 * controller notify, a body mutation, typing in an editor) into one measurement per frame.
 */
export class ColumnAutoSize {
  min?: number
  max?: number

  private _raf = 0
  private _table?: HTMLTableElement
  private _observer?: MutationObserver
  private _wrote?: { col?: HTMLTableColElement; cell: HTMLElement }
  private readonly _onInput = (e: Event): void => {
    const t = e.target as Element | null
    if (t && this._table && !this._table.tHead?.contains(t)) this.schedule()
  }

  constructor(private readonly host: HTMLElement) {}

  schedule(): void {
    if (this._raf) return
    this._raf = requestAnimationFrame(() => {
      this._raf = 0
      this._run()
    })
  }

  /** Stop watching, and hand the column back to whatever width it is given next. */
  stop(clear = false): void {
    if (this._raf) cancelAnimationFrame(this._raf)
    this._raf = 0
    this._unwatch()
    if (clear && this._wrote) {
      if (this._wrote.col) this._wrote.col.style.width = ''
      this._wrote.cell.style.width = ''
    }
    this._wrote = undefined
  }

  private _watch(table: HTMLTableElement): void {
    if (this._table === table) return
    this._unwatch()
    this._table = table
    // The whole table, subtree: the `<tfoot>` comes and goes with `v-if`. Header churn (this
    // element's own re-renders) is filtered out — it would only re-schedule us forever.
    this._observer = new MutationObserver((records) => {
      const head = table.tHead
      if (records.some((r) => !head?.contains(r.target))) this.schedule()
    })
    this._observer.observe(table, { childList: true, characterData: true, subtree: true })
    // Typing changes an input's value without touching the DOM.
    table.addEventListener('input', this._onInput, true)
  }

  private _unwatch(): void {
    this._observer?.disconnect()
    this._observer = undefined
    this._table?.removeEventListener('input', this._onInput, true)
    this._table = undefined
  }

  private _run(): void {
    const cell = this.host.closest('th, td') as HTMLTableCellElement | null
    const table = cell?.closest('table') as HTMLTableElement | null
    if (!cell || !table || !this.host.isConnected) return
    this._watch(table)

    const index = headerColumnIndex(cell)
    let width = headerWidth(cell, this.host)
    const sections = [...Array.from(table.tBodies), ...(table.tFoot ? [table.tFoot] : [])]
    for (const section of sections) {
      for (const row of Array.from(section.rows)) {
        const target = cellAt(row, index)
        if (target) width = Math.max(width, contentWidth(target))
      }
    }
    width = Math.ceil(clampWidth(width + 1, this.min, this.max)) // +1: sub-pixel text never ellipses
    const value = `${width}px`

    const col = colAt(table, index)
    // Skip a write that changes nothing — it would only re-trigger layout.
    if (cell.style.width !== value) cell.style.width = value
    if (col && col.style.width !== value) col.style.width = value
    this._wrote = { col, cell }
  }
}
