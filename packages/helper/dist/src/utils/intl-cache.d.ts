//#region src/utils/intl-cache.d.ts
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
/** A shared `Intl.NumberFormat(locale, options)`. Throws as the constructor would (bad currency…). */
export declare function numberFormat(locale?: string | string[], options?: Intl.NumberFormatOptions): Intl.NumberFormat;
/** A shared `Intl.DateTimeFormat(locale, options)`. */
export declare function dateTimeFormat(locale?: string | string[], options?: Intl.DateTimeFormatOptions): Intl.DateTimeFormat;
/** A shared `Intl.Collator(locale, options)` — `collator(…).compare` in place of `localeCompare`. */
export declare function collator(locale?: string | string[], options?: Intl.CollatorOptions): Intl.Collator;
//#endregion