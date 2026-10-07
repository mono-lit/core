//#region src/composables/css-size.ts
/**
* Normalize a sizing prop to a CSS length string.
* - `number` (or numeric string) → `${n}px`
* - any other non-empty string → passed through verbatim (`"12rem"`, `"80%"`, …)
* - `null` / `undefined` / `''` → `undefined` (treated as "not set")
*/
function toCssSize(value) {
	if (value === null || value === void 0) return void 0;
	if (typeof value === "number") return Number.isFinite(value) ? `${value}px` : void 0;
	const trimmed = String(value).trim();
	if (trimmed === "") return void 0;
	if (/^-?\d+(\.\d+)?$/.test(trimmed)) return `${trimmed}px`;
	return trimmed;
}
/**
* Build a Lit `styleMap` object from the six sizing props, normalizing each via
* `toCssSize` and omitting the ones that aren't set.
*/
function buildSizeStyle(src) {
	const style = {};
	const width = toCssSize(src.width);
	const height = toCssSize(src.height);
	const minWidth = toCssSize(src.minWidth);
	const maxWidth = toCssSize(src.maxWidth);
	const minHeight = toCssSize(src.minHeight);
	const maxHeight = toCssSize(src.maxHeight);
	if (width) style.width = width;
	if (height) style.height = height;
	if (minWidth) style["min-width"] = minWidth;
	if (maxWidth) style["max-width"] = maxWidth;
	if (minHeight) style["min-height"] = minHeight;
	if (maxHeight) style["max-height"] = maxHeight;
	return style;
}
//#endregion
export { toCssSize as n, buildSizeStyle as t };
