/**
 * Cell marks — the attributes `table.css` keys two cell rules on, set by the element that sits in
 * the cell instead of being found with `:has()`.
 *
 * - `mono-edit-cell`: the cell holds a mono form control anywhere inside it (the seamless inline
 *   editor — flattened into the cell, focus cue on the `<td>`).
 * - `mono-action-cell`: a `<mono-button>` is a DIRECT child of the cell (row actions are exempt
 *   from `mono-table-fixed`'s ellipsis clip).
 *
 * WHY NOT `td:has(mono-input, …)`: in Chrome a `:has()` whose subject is a table cell is paid on
 * every row the table gains. A virtual-scroll window shift inserts and removes dozens of rows per
 * step, and each one re-ran six such `:has()` lists over every cell's subtree — measured on a
 * 19-column budget table, those six rules were ~2/3 of the style + layout cost of a scroll step
 * (Firefox invalidates `:has()` far more narrowly, which is why the same table scrolled smoothly
 * there). An attribute selector costs nothing to match.
 *
 * The cost of the trade: the mark appears when the element CONNECTS (client-side). A shadow-build
 * editor server-rendered into a cell shows its own field chrome until it upgrades.
 */
export type TableCellMark = 'mono-edit-cell' | 'mono-action-cell'

/** The form controls that flatten into their cell — the exact list the `:has()` rules named. */
const EDIT_CONTROLS = new Set(['input', 'textarea', 'select', 'tag-input', 'date', 'dropdown-table', 'checkbox', 'radio', 'switch'])

/** `mono-input` / `mono-shadow-input` → `input`. */
const baseName = (el: Element): string => el.localName.replace(/^mono-(?:shadow-)?/, '')

/** Is this element one of the controls a table cell flattens? */
export const isEditCellControl = (el: Element): boolean => el.localName.startsWith('mono-') && EDIT_CONTROLS.has(baseName(el))

/** Is this element a plain mono button (not a dropdown / table part)? */
export const isActionCellButton = (el: Element): boolean => el.localName.startsWith('mono-') && baseName(el) === 'button'

/** What each element marked, so the mark is released from the RIGHT cell once it has moved away. */
const marked = new WeakMap<Element, { cell: Element; mark: TableCellMark }>()
/** How many elements hold each mark on a cell — two editors in one cell keep it until both leave. */
const holders = new WeakMap<Element, Partial<Record<TableCellMark, number>>>()

function cellFor(el: Element, mark: TableCellMark): Element | null {
  if (mark === 'mono-action-cell') {
    const parent = el.parentElement
    return parent?.tagName === 'TD' ? parent : null
  }
  return el.parentElement?.closest('td') ?? null
}

/** Mark the cell `el` sits in (call from `connectedCallback`). Idempotent; re-homes after a move. */
export function markTableCell(el: Element, mark: TableCellMark): void {
  // connectedCallback never runs under lit-ssr; this only guards a bare server import.
  if (typeof document === 'undefined') return
  const cell = cellFor(el, mark)
  const prev = marked.get(el)
  if (prev && prev.cell === cell && prev.mark === mark) return
  unmarkTableCell(el)
  if (!cell) return
  const count = holders.get(cell) ?? {}
  count[mark] = (count[mark] ?? 0) + 1
  holders.set(cell, count)
  if (count[mark] === 1) cell.setAttribute(mark, '')
  marked.set(el, { cell, mark })
}

/** Release `el`'s mark (call from `disconnectedCallback`). */
export function unmarkTableCell(el: Element): void {
  const prev = marked.get(el)
  if (!prev) return
  marked.delete(el)
  const count = holders.get(prev.cell)
  if (!count) return
  const left = (count[prev.mark] ?? 1) - 1
  if (left > 0) {
    count[prev.mark] = left
    return
  }
  delete count[prev.mark]
  prev.cell.removeAttribute(prev.mark)
}
