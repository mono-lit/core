//#region src/composables/table-cell-marks.d.ts
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
export type TableCellMark = 'mono-edit-cell' | 'mono-action-cell';
/** Is this element one of the controls a table cell flattens? */
export declare const isEditCellControl: (el: Element) => boolean;
/** Is this element a plain mono button (not a dropdown / table part)? */
export declare const isActionCellButton: (el: Element) => boolean;
/** Mark the cell `el` sits in (call from `connectedCallback`). Idempotent; re-homes after a move. */
export declare function markTableCell(el: Element, mark: TableCellMark): void;
/** Release `el`'s mark (call from `disconnectedCallback`). */
export declare function unmarkTableCell(el: Element): void;
//#endregion