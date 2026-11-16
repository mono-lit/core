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
/** How many elements hold each mark on a cell — two editors in one cell keep it until both leave. */
const holders = /* @__PURE__ */ new WeakMap();
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
	const count = holders.get(cell) ?? {};
	count[mark] = (count[mark] ?? 0) + 1;
	holders.set(cell, count);
	if (count[mark] === 1) cell.setAttribute(mark, "");
	marked.set(el, {
		cell,
		mark
	});
}
/** Release `el`'s mark (call from `disconnectedCallback`). */
function unmarkTableCell(el) {
	const prev = marked.get(el);
	if (!prev) return;
	marked.delete(el);
	const count = holders.get(prev.cell);
	if (!count) return;
	const left = (count[prev.mark] ?? 1) - 1;
	if (left > 0) {
		count[prev.mark] = left;
		return;
	}
	delete count[prev.mark];
	prev.cell.removeAttribute(prev.mark);
}

//#endregion
export { unmarkTableCell as i, isEditCellControl as n, markTableCell as r, isActionCellButton as t };