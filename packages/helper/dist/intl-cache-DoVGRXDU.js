//#region src/utils/intl-cache.ts
/**
* Cached `Intl` formatters and collators — one instance per (locale, options), reused.
*
* `n.toLocaleString(locale?, options?)`, `a.localeCompare(b, locale?, options)` and
* `new Intl.NumberFormat(…)` build a fresh ICU object on EVERY call: locale negotiation, pattern
* compilation and all. Older V8 hid part of that behind an internal cache; current Chrome does not.
* Measured in Chrome 157 (2026-11-18), 20k calls each:
*
*   `n.toLocaleString()`                       283ms   vs a cached `NumberFormat.format`   10ms
*   `n.toLocaleString(undefined, { 2 digits })` 329ms   vs cached                            9ms
*   `a.localeCompare(b, undefined, { numeric })` 96ms   vs a cached `Collator.compare`        6ms
*
* Every one of these sat on a per-cell or per-comparison path (a summary footer re-rendered on
* every grid notify, a client-side sort's n·log n comparisons, an export's per-cell helpers), so
* the call site must reuse one object — that is all this module is for. The output is identical:
* `toLocaleString(l, o)` IS `new Intl.NumberFormat(l, o).format(n)` by spec, and
* `localeCompare(b, l, o)` IS `new Intl.Collator(l, o).compare(a, b)`.
*/
/** Distinct (locale, options) pairs are few per app; the cap only guards against a pathological caller. */
const MAX_ENTRIES = 64;
function cached(cache, locale, options, make) {
	const key = `${Array.isArray(locale) ? locale.join(",") : locale ?? ""}|${options ? JSON.stringify(options) : ""}`;
	let hit = cache.get(key);
	if (hit === void 0) {
		hit = make();
		if (cache.size >= MAX_ENTRIES) cache.clear();
		cache.set(key, hit);
	}
	return hit;
}
const numberFormats = /* @__PURE__ */ new Map();
const dateFormats = /* @__PURE__ */ new Map();
const collators = /* @__PURE__ */ new Map();
/** A shared `Intl.NumberFormat(locale, options)`. Throws as the constructor would (bad currency…). */
function numberFormat(locale, options) {
	return cached(numberFormats, locale, options, () => new Intl.NumberFormat(locale, options));
}
/** A shared `Intl.DateTimeFormat(locale, options)`. */
function dateTimeFormat(locale, options) {
	return cached(dateFormats, locale, options, () => new Intl.DateTimeFormat(locale, options));
}
/** A shared `Intl.Collator(locale, options)` — `collator(…).compare` in place of `localeCompare`. */
function collator(locale, options) {
	return cached(collators, locale, options, () => new Intl.Collator(locale, options));
}

//#endregion
export { dateTimeFormat as n, numberFormat as r, collator as t };