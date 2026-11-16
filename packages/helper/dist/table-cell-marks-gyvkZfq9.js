//#region src/composables/table-cell-marks.ts
/** The form controls that flatten into their cell — the exact list the `:has()` rules named. */
const EDIT_CONTROLS = /* @__PURE__ */ new Set([
	"input",
	"textarea",
	"select",
	"tag-input",
	"date",
	"dropdown-table",
	"checkbox",
	"radio",
	"switch"
]);
/** `mono-input` / `mono-shadow-input` → `input`. */
const baseName = (el) => el.localName.replace(/^mono-(?:shadow-)?/, "");
/** Is this element one of the controls a table cell flattens? */
const isEditCellControl = (el) => el.localName.startsWith("mono-") && EDIT_CONTROLS.has(baseName(el));
/** Is this element a plain mono button (not a dropdown / table part)? */
const isActionCellButton = (el) => el.localName.startsWith("mono-") && baseName(el) === "button";
/** What each element marked, so the mark is released from the RIGHT cell once it has moved away. */
const marked = /* @__PURE__ */ new WeakMap();
/**
* Per cell, per mark: how many elements of each KIND hold it — two editors in one cell keep the
* mark until both leave.
*
* The attribute's VALUE is the kinds present, sorted and space-separated — `mono-edit-cell="input"`,
* `"checkbox"`, `"input select"` — so a stylesheet can tell a text editor from a glyph control
* without `:has()`: `td[mono-edit-cell]:not([mono-edit-cell="checkbox"])`, or `~=` for one kind.
*/
const holders = /* @__PURE__ */ new WeakMap();
function writeMark(cell, mark, kinds) {
	if (!kinds.size) cell.removeAttribute(mark);
	else cell.setAttribute(mark, [...kinds.keys()].sort().join(" "));
}
function cellFor(el, mark) {
	if (mark === "mono-action-cell") {
		const parent = el.parentElement;
		return parent?.tagName === "TD" ? parent : null;
	}
	return el.parentElement?.closest("td") ?? null;
}
/** Mark the cell `el` sits in (call from `connectedCallback`). Idempotent; re-homes after a move. */
function markTableCell(el, mark) {
	if (typeof document === "undefined") return;
	const cell = cellFor(el, mark);
	const prev = marked.get(el);
	if (prev && prev.cell === cell && prev.mark === mark) return;
	unmarkTableCell(el);
	if (!cell) return;
	const kind = baseName(el);
	const perCell = holders.get(cell) ?? {};
	const kinds = perCell[mark] ??= /* @__PURE__ */ new Map();
	holders.set(cell, perCell);
	const before = kinds.size;
	kinds.set(kind, (kinds.get(kind) ?? 0) + 1);
	if (kinds.size !== before) writeMark(cell, mark, kinds);
	marked.set(el, {
		cell,
		mark,
		kind
	});
}
/** Release `el`'s mark (call from `disconnectedCallback`). */
function unmarkTableCell(el) {
	const prev = marked.get(el);
	if (!prev) return;
	marked.delete(el);
	const kinds = holders.get(prev.cell)?.[prev.mark];
	if (!kinds) return;
	const left = (kinds.get(prev.kind) ?? 1) - 1;
	if (left > 0) {
		kinds.set(prev.kind, left);
		return;
	}
	kinds.delete(prev.kind);
	writeMark(prev.cell, prev.mark, kinds);
}

//#endregion
export { unmarkTableCell as i, isEditCellControl as n, markTableCell as r, isActionCellButton as t };