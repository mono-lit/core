import { a as parseFieldPath, c as toODataClause, n as isPath, t as getFieldValue } from "./field-path-C92eGLg3.js";
import { i as joinFilters, r as compileFilterPredicate, t as andFilters } from "./filter-eval-DIfU2EAn.js";
//#region src/search/search-expr.ts
/**
* Search-expression entries: the fields a typed term is matched against.
*
* One grammar, shared by every component that searches data — `monoDataGrid`'s
* `searchExpr`, and the `search-value` prop on `mono-select`, `mono-tag-input`
* and `mono-dropdown-table`. An entry may be:
*
* - a plain column name (`'Nama'`)
* - a **path** (`'Company.Name'`, `'Transaction.[1].Name'`, `'Transaction.[*].Price'`)
* - a **`*` pattern** (`'*'`, `'Company.*'`, `'*.*'`, `'*.[*].*'`)
* - a **`{ field, custom }` clause builder**
*
* An entry is normally just a column name, and every column is searched the same
* way — `contains(<col>,'<term>')`. That is wrong for any column whose data isn't
* free text: a **boolean** can't take `contains` at all, and a **coded** column
* stores something the user never types (a `Month` of `0..11` can never match the
* string `"Jan"`).
*
* So an entry may instead be `{ field, custom }`, where `custom` receives the live
* term and returns the clause to use for that column:
*
* ```ts
* const MONTHS = ['Jan', 'Feb', 'Mar', …]
*
* searchExpr: [
*   'Code',
*   'Nama',
*   { field: 'Active', custom: ({ field, value }) => `${field} eq ${value}` },
*   { field: 'Month',  custom: ({ field, value }) => [field, '=', MONTHS.indexOf(value)] },
* ]
* ```
*
* A custom column takes part in the plain search box like any other, so it runs on
* every term. **Return `null`/`undefined` to opt out** of one — which is what makes
* the `Month` example workable: `"Jan"` → `0`, `"zzz"` → `-1` → return `null` and
* the column simply drops out of that query instead of matching nothing.
*
* | `custom` returns | remote (devextreme store) | array / in-memory |
* | --- | --- | --- |
* | `[field, op, value]`, or a nested `and`/`or` array | used as-is | compiled to a predicate |
* | `(row) => boolean` | warn + skip | used as the predicate |
* | `"Active eq true"` (raw OData) | wrapped as `[raw]` | warn + skip |
* | `null` / `undefined` / `false` | skipped | skipped |
*
* Only the explicit `{ field, custom }` shape is accepted — a `{ Month: fn }` map
* is not, so there is exactly one form to read and to type.
*
* An entry may also be a **`*` pattern**, resolved against the loaded rows so a
* grid can search everything without listing columns:
*
* ```ts
* searchExpr: ['*']                     // every top-level field
* searchExpr: ['*', '*.[*].*']          // …plus every field of every array expand
* searchExpr: ['*', '*.*']              // …plus every field of every object expand
* searchExpr: ['*', { field: 'Month', custom }]   // the explicit entry wins for Month
* ```
*
* Patterns read literally, segment by segment — `'*.[*].*'` covers the expand ONLY.
* See {@link expandWildcard} for the type rule that keeps a remote `$filter` valid.
*
* This module is pure: types + stateless helpers, no controller state, mirroring
* `field-path.ts`.
*/
/** Entries already warned about, so a per-keystroke path can't flood the console. */
var warned = /* @__PURE__ */ new WeakSet();
function warnOnce(key, message) {
	if (warned.has(key)) return;
	warned.add(key);
	console.warn(`[@mono-lit/helper] ${message}`);
}
/** Malformed entries are warned about once each, keyed by the object itself. */
function isCustomEntry(entry) {
	if (typeof entry !== "object" || entry === null) return false;
	const e = entry;
	if (typeof e.field === "string" && e.field && typeof e.custom === "function") return true;
	warnOnce(entry, `searchExpr: ignoring an entry that is neither a column name nor { field, custom } — ${JSON.stringify(Object.keys(entry))}. The { Field: fn } shorthand is not supported.`);
	return false;
}
/** Every usable entry, in the order written. Strings and customs, malformed dropped. */
function normalizeSearchExpr(expr) {
	if (expr == null) return [];
	const list = Array.isArray(expr) ? expr : [expr];
	const out = [];
	for (const entry of list) if (typeof entry === "string") {
		if (entry) out.push(entry);
	} else if (isCustomEntry(entry)) out.push(entry);
	return out;
}
/**
* The plain column names only — no `{ field, custom }` entries, no `*` patterns.
*
* This is what a SOURCE may be handed: `monoArraySource`, `storeGroupSource` and
* devextreme all type `searchExpr` as `string | string[]` and feed it straight to
* `toODataClause` — an object entry would serialize to garbage and a `'*'` would
* be searched as a column literally named `*`. Both are resolved by the controller
* instead.
*/
function plainSearchColumns(expr) {
	return normalizeSearchExpr(expr).filter((e) => typeof e === "string" && !isWildcardPattern(e));
}
/** The field name an entry covers. */
function searchEntryField(entry) {
	return typeof entry === "string" ? entry : entry.field;
}
/** The entry declaring `field`, if any — used to resolve a column-bound term. */
function searchEntryFor(expr, field) {
	return normalizeSearchExpr(expr).find((e) => searchEntryField(e) === field);
}
/** Whether any entry brings its own builder (so folding must be bypassed). */
function hasCustomSearch(expr) {
	return normalizeSearchExpr(expr).some((e) => typeof e !== "string");
}
/** Whether `field` is a `*` pattern rather than a concrete column/path. */
function isWildcardPattern(field) {
	if (typeof field !== "string" || !field.includes("*")) return false;
	return parseFieldPath(field).segments.some((s) => s.kind === "key" && s.name === "*");
}
/** A value that can be searched as-is (anything that isn't a container). */
function isLeaf(value) {
	return value !== null && typeof value !== "object";
}
var isPlainObject = (value) => typeof value === "object" && value !== null && !Array.isArray(value);
/** How many rows to sample when resolving a pattern (row 0 alone may be sparse). */
var SAMPLE_ROWS = 20;
/**
* Resolve a `*` pattern against real rows, returning the concrete field paths it
* covers — `'*.[*].*'` over `{ Detail: [{ Bulan, Ket }] }` gives
* `['Detail.[*].Bulan', 'Detail.[*].Ket']`, which the existing path machinery
* already knows how to match client-side and translate to an OData lambda.
*
* `textOnly` drops every leaf that isn't a string. A REMOTE source needs that:
* `contains(Price,'x')` is not valid OData and would reject the whole request, so
* a wildcard never emits a clause for a numeric/boolean/date column. Give such a
* column an explicit `{ field, custom }` entry instead. In-memory sources compare
* stringified values, so they keep every leaf.
*
* A field that is `null`/`undefined` in every sampled row is skipped — there is
* nothing to type it by.
*/
function expandWildcard(pattern, rows, textOnly) {
	const { segments } = parseFieldPath(pattern);
	const found = /* @__PURE__ */ new Set();
	for (const row of rows.slice(0, SAMPLE_ROWS)) {
		let candidates = [{
			path: [],
			value: row
		}];
		for (const seg of segments) {
			const next = [];
			for (const { path, value } of candidates) {
				if (value == null) continue;
				if (seg.kind === "wildcard") {
					if (Array.isArray(value)) for (const el of value) next.push({
						path: [...path, "[*]"],
						value: el
					});
				} else if (seg.kind === "index") {
					if (Array.isArray(value)) next.push({
						path: [...path, `[${seg.index}]`],
						value: value[seg.index]
					});
				} else if (seg.name === "*") {
					if (isPlainObject(value)) for (const key of Object.keys(value)) next.push({
						path: [...path, key],
						value: value[key]
					});
				} else if (isPlainObject(value)) next.push({
					path: [...path, seg.name],
					value: value[seg.name]
				});
			}
			candidates = next;
			if (!candidates.length) break;
		}
		for (const { path, value } of candidates) {
			if (!path.length || !isLeaf(value)) continue;
			if (textOnly && typeof value !== "string") continue;
			found.add(path.join("."));
		}
	}
	return [...found];
}
/**
* The entries a search actually runs over: every `*` pattern replaced by the
* concrete fields it resolves to, in place.
*
* **An explicitly named field always wins.** A field named anywhere in the list —
* as a plain string or as `{ field, custom }` — is dropped from every pattern
* expansion regardless of order, so `['*', { field: 'Name', custom }]` and
* `[{ field: 'Name', custom }, '*']` both search `Name` with the custom, exactly
* once, at the position it was written.
*/
function resolveSearchEntries(expr, options = {}) {
	const entries = normalizeSearchExpr(expr);
	if (!entries.some((e) => typeof e === "string" && isWildcardPattern(e))) return entries;
	const { rows = [], textOnly = false } = options;
	const explicit = new Set(entries.filter((e) => typeof e !== "string" || !isWildcardPattern(e)).map((e) => searchEntryField(e)));
	const out = [];
	const seen = /* @__PURE__ */ new Set();
	for (const entry of entries) {
		if (typeof entry === "string" && isWildcardPattern(entry)) {
			for (const field of expandWildcard(entry, rows, textOnly)) {
				if (explicit.has(field) || seen.has(field)) continue;
				seen.add(field);
				out.push(field);
			}
			continue;
		}
		const field = searchEntryField(entry);
		if (seen.has(field)) continue;
		seen.add(field);
		out.push(entry);
	}
	return out;
}
/** Whether any entry is a `*` pattern (so folding must be bypassed). */
function hasWildcardSearch(expr) {
	return normalizeSearchExpr(expr).some((e) => typeof e === "string" && isWildcardPattern(e));
}
/** Run the builder, guarding against a throw in consumer code. */
function runCustom(entry, value, operation) {
	try {
		return entry.custom({
			field: entry.field,
			value,
			operation
		});
	} catch (error) {
		warnOnce(entry, `searchExpr custom for "${entry.field}" threw — column skipped. ${error}`);
		return null;
	}
}
/**
* The devextreme filter clause for one custom entry + term, or `null` to skip it.
*
* A raw string is wrapped as `[raw]` — the single-member raw-passthrough clause
* devextreme honours inside a filter array, the same shape `toODataClause` emits
* for a wildcard lambda, so it slots into the OR/AND groups unchanged.
*/
function customRemoteClause(entry, value, operation) {
	const result = runCustom(entry, value, operation);
	if (result == null || result === false) return null;
	if (typeof result === "string") return result ? [result] : null;
	if (Array.isArray(result)) return result.length ? result : null;
	if (typeof result === "function") warnOnce(entry, `searchExpr custom for "${entry.field}" returned a predicate function, which a remote source can't send — column skipped. Return a filter array or an OData string for remote sources.`);
	return null;
}
/**
* The client-side row predicate for one custom entry + term, or `null` to skip it.
*
* Filter arrays go through `compileFilterPredicate`, which already understands
* nested `and`/`or` groups, `['!', …]` negation and path fields — so the SAME
* `[field, op, value]` a remote source receives also narrows an array source.
*/
function customPredicate(entry, value, operation) {
	const result = runCustom(entry, value, operation);
	if (result == null || result === false) return null;
	if (typeof result === "function") return result;
	if (Array.isArray(result)) return result.length ? compileFilterPredicate(result) : null;
	if (typeof result === "string") warnOnce(entry, `searchExpr custom for "${entry.field}" returned the raw OData string ${JSON.stringify(result)}, which only a remote source can use — column skipped for this in-memory source. Return a filter array to support both.`);
	return null;
}
//#endregion
//#region src/search/data-search.ts
/**
* The shared search engine — one implementation of "match a typed term against
* a set of fields", used by every component that searches data.
*
* `monoDataGrid` grew this pipeline first (paths, `*` patterns, `{ field, custom }`
* clause builders); this module lifts the reusable half out of the grid so
* `mono-select`, `mono-tag-input` and `mono-dropdown-table` share it verbatim
* rather than each re-deriving a weaker version.
*
* ## The `search-value` grammar
*
* A component's `search-value` prop accepts either form, interchangeably:
*
* ```ts
* // array — the full grammar, including custom clause builders
* :search-value.prop="['Company.Name', 'Transaction.[*].Price', '*.[*].*']"
*
* // comma-separated string — the same thing from plain HTML
* search-value="Company.Name,Transaction.[*].Price,*.[*].*"
* ```
*
* Whitespace around a comma is trimmed, so `'a, b, c'` and `'a,b,c'` are equal.
* A comma is never part of a path or a pattern, so splitting on it is lossless —
* only `{ field, custom }` entries need the array form.
*
* ## The two output shapes
*
* A search has to be expressed twice, because the two source kinds evaluate it in
* different places:
*
* - **remote** (a devextreme store): a `$filter` expression → {@link searchRemoteFilter}
* - **array / in-memory**: a `(row) => boolean` → {@link searchRowPredicate}
*
* Both are built from the SAME resolved entry list, so the two paths can't drift.
*
* ## Why a source can't always do it itself
*
* devextreme folds `searchValue` + `searchExpr` into the request on its own, which
* is cheaper and is kept for the common case. But folding emits exactly
* `contains(<col>,'<term>')` per column, so it cannot express a nav path
* (`Job/Name`), a collection lambda (`Nav/any(...)`) or a custom clause.
* {@link isFoldableSearch} decides; {@link MonoSourceSearch} routes.
*/
/** The default devextreme search operation. */
var DEFAULT_SEARCH_OPERATION = "contains";
/**
* Split the string form of `search-value` on commas.
*
* Kept separate from {@link resolveSearchFields} so a component can show a user
* what its raw prop parsed to without also resolving `*` patterns against data.
*/
function parseSearchValue(value) {
	if (value == null) return [];
	if (Array.isArray(value)) return normalizeSearchExpr(value);
	if (typeof value !== "string") return [];
	return normalizeSearchExpr(value.split(",").map((s) => s.trim()).filter(Boolean));
}
/** The spellings, in the order a merge reads them. */
var SEARCH_FIELDS_KEYS = [
	"searchExpr",
	"search-expr",
	"searchValue",
	"search-value"
];
/**
* Merge every spelling present into one entry list, de-duplicated by field name.
*
* They all mean the same thing, so passing two of them means the union rather
* than one silently shadowing the other. Order only decides *position* among
* equal field names — first occurrence wins, so a `{ field, custom }` entry
* written under one spelling isn't displaced by a plain column under another.
*
* Returns **`undefined` when none of the keys is present**, which callers rely on
* to mean "not configured at all" — distinctly different from `[]` ("configured,
* but empty"). The grid uses that difference to decide whether to leave a data
* source's own `searchExpr` alone.
*/
function mergeSearchFields(src) {
	if (!src) return void 0;
	let present = false;
	const out = [];
	const seen = /* @__PURE__ */ new Set();
	for (const key of SEARCH_FIELDS_KEYS) {
		const raw = src[key];
		if (raw === void 0) continue;
		present = true;
		for (const entry of parseSearchValue(raw)) {
			const field = searchEntryField(entry);
			if (seen.has(field)) continue;
			seen.add(field);
			out.push(entry);
		}
	}
	return present ? out : void 0;
}
/** The default when nothing is configured: every top-level field. */
var DEFAULT_SEARCH_FIELDS = ["*"];
/**
* The entries a search actually runs over: the prop parsed, the fallbacks applied
* when it's empty, and every `*` pattern expanded against `rows`.
*
* Call this **once per query**, never per row — a pattern samples up to 20 rows,
* so resolving inside a row loop is O(rows × fields) on every keystroke.
*/
function resolveSearchFields(options = {}) {
	const { searchValue, fallbackFields = [], rows = [], remote = false, defaultToWildcard = false } = options;
	let entries = parseSearchValue(searchValue);
	if (!entries.length) {
		const fallbacks = fallbackFields.filter((f) => typeof f === "string" && !!f);
		entries = defaultToWildcard ? [...DEFAULT_SEARCH_FIELDS, ...fallbacks] : fallbacks;
	}
	if (!entries.length) return [];
	return resolveSearchEntries(entries, {
		rows,
		textOnly: remote
	});
}
/**
* Whether a source's own `searchValue`/`searchExpr` folding can express these
* entries — true only for plain top-level column names.
*
* A path needs a nav selector or an `any()` lambda and a custom brings its own
* clause; folding would silently search either with a flat `contains` instead.
*/
function isFoldableSearch(entries) {
	return entries.every((e) => typeof e === "string" && !isPath(e) && !isWildcardPattern(e));
}
/** The plain column names among `entries` — what a source may safely be handed. */
function plainSearchFields(entries) {
	return entries.filter((e) => typeof e === "string" && !isWildcardPattern(e));
}
/** Compare one resolved value against the needle using a devextreme operation. */
function matchesValue(value, needle, operation) {
	const s = String(value ?? "").toLowerCase();
	const n = needle.toLowerCase();
	if (operation === "startswith") return s.startsWith(n);
	if (operation === "endswith") return s.endsWith(n);
	if (operation === "=" || operation === "equals") return s === n;
	if (operation === "notcontains") return !s.includes(n);
	return s.includes(n);
}
/**
* Read a field off a row, path-aware. A wildcard path resolves to an array of
* every match, so the caller matches if ANY element hits.
*/
function readSearchField(row, field) {
	const raw = isPath(field) ? getFieldValue(row, field) : row?.[field];
	return Array.isArray(raw) ? raw : [raw];
}
/**
* The client-side row test for one query, or `null` when there is nothing to
* match on.
*
* `null` means "no opinion" — the caller should keep every row rather than filter
* them all away, which is what a component with no configured fields wants.
*/
function searchRowPredicate(entries, query, operation = DEFAULT_SEARCH_OPERATION) {
	const needle = String(query ?? "").trim();
	if (!needle || !entries.length) return null;
	return (row) => entries.some((entry) => {
		if (typeof entry === "string") return readSearchField(row, entry).some((v) => matchesValue(v, needle, operation));
		const pred = customPredicate(entry, needle, operation);
		return pred ? pred(row) : false;
	});
}
/**
* The devextreme `$filter` expression for one query — an OR across every entry —
* or `null` when there is nothing to send.
*/
function searchRemoteFilter(entries, query, operation = DEFAULT_SEARCH_OPERATION) {
	const needle = String(query ?? "").trim();
	if (!needle || !entries.length) return null;
	return joinFilters(entries.map((entry) => typeof entry === "string" ? toODataClause(entry, operation, needle) : customRemoteClause(entry, needle, operation)).filter((c) => c != null), "or");
}
/**
* Applies a search to a bound DataSource, choosing between the source's own
* folding and a controller-built `$filter`.
*
* The reason this needs to be an object rather than a function is the **base
* filter**: when the search can't be folded it has to live in `source.filter()`,
* which is also where the consumer's own filter lives. So the consumer's filter is
* captured and every search re-composes from that snapshot — otherwise each
* keystroke would AND another search clause onto the previous one and the filter
* would grow without bound.
*
* The snapshot is not taken once and kept. Before every apply (and every clear)
* the live `filter()` is compared against what this instance last WROTE: if it
* differs, the consumer changed the filter in the meantime — a watcher scoping
* the source — and that becomes the new base. Snapshotting only at `bind()` made
* the next keystroke overwrite such a filter with the stale one, and "restored"
* the stale one on clear.
*
* ```ts
* private _search = new MonoSourceSearch()
* // on `dataSource` change:
* this._search.bind(this.dataSource)
* // on a (debounced) query:
* await this._search.apply(this.dataSource, {
*   query, searchValue: this.searchValue, fallbackFields: [...], rows, remote: true,
* })
* ```
*/
var MonoSourceSearch = class {
	constructor() {
		this._source = null;
		this._baseFilter = null;
		this._wroteFilter = false;
		this._lastWritten = null;
	}
	/**
	* Snapshot a source's own filter. Safe to call repeatedly — the snapshot is
	* only (re)taken when the source identity actually changes, so it can be driven
	* straight from a `willUpdate` branch. A change on the SAME source is picked up
	* by `_syncBase` at the next apply/clear instead.
	*/
	bind(source) {
		if (source === this._source) return;
		this._source = source ?? null;
		this._baseFilter = source?.filter?.() ?? null;
		this._lastWritten = this._baseFilter;
		this._wroteFilter = false;
	}
	/**
	* Adopt a filter the consumer set on the source since the last write —
	* anything the source holds that is not what this instance last put there.
	* `_writeFilter` records what the source HOLDS after a write (read back), so a
	* source that ignores writes reads back as its own last write and is never
	* re-adopted, and one that normalises compares against its normalised value.
	*/
	_syncBase(s) {
		if (typeof s.filter !== "function") return;
		const live = s.filter() ?? null;
		if (live === this._lastWritten) return;
		this._baseFilter = live;
		this._wroteFilter = false;
	}
	/** Write `filter()` and remember what the source holds afterwards. */
	_writeFilter(s, value) {
		s.filter?.(value);
		this._lastWritten = s.filter?.() ?? null;
	}
	/**
	* Undo whatever this instance wrote onto the source, then forget it.
	*
	* `reset()` alone is not enough at teardown. With `defaultToWildcard`, a `'*'`
	* entry is never foldable, so the search is AND-ed into `source.filter()` — the
	* same slot the CONSUMER's own filter lives in. Only `apply()` ever restores the
	* captured base (and only when the next apply happens to be foldable), so an
	* element torn down mid-query used to leave its clause behind on a DataSource
	* the app still owns and shares.
	*
	* Deliberately does NOT `load()`: teardown must not issue a request. The next
	* consumer of the source reloads on its own terms.
	*/
	clear(source) {
		const s = source ?? this._source;
		if (s) {
			this._syncBase(s);
			s.searchValue?.(null);
			if (this._wroteFilter) this._writeFilter(s, this._baseFilter ?? null);
		}
		this.reset();
	}
	/** Forget the captured state without touching the source. */
	reset() {
		this._source = null;
		this._baseFilter = null;
		this._lastWritten = null;
		this._wroteFilter = false;
	}
	/**
	* Push `query` onto `source` and reload it. Returns the resolved entries so a
	* caller can reuse them for its own client-side rendering without re-resolving.
	*/
	async apply(source, options) {
		const s = source;
		if (!s) return [];
		this.bind(source);
		this._syncBase(s);
		const operation = options.operation || "contains";
		const entries = resolveSearchFields({
			...options,
			remote: options.remote ?? true
		});
		const query = String(options.query ?? "").trim();
		if (isFoldableSearch(entries)) {
			s.searchOperation?.(operation);
			s.searchExpr?.(plainSearchFields(entries));
			s.searchValue?.(query || null);
			if (this._wroteFilter) {
				this._writeFilter(s, this._baseFilter ?? null);
				this._wroteFilter = false;
			}
		} else {
			s.searchValue?.(null);
			const expr = searchRemoteFilter(entries, query, operation);
			this._writeFilter(s, andFilters(this._baseFilter ?? null, expr));
			this._wroteFilter = expr != null;
		}
		s.pageIndex?.(0);
		await Promise.resolve(s.load?.());
		return entries;
	}
};
//#endregion
export { searchEntryFor as S, hasWildcardSearch as _, isFoldableSearch as a, plainSearchColumns as b, plainSearchFields as c, searchRemoteFilter as d, searchRowPredicate as f, hasCustomSearch as g, expandWildcard as h, SEARCH_FIELDS_KEYS as i, readSearchField as l, customRemoteClause as m, DEFAULT_SEARCH_OPERATION as n, mergeSearchFields as o, customPredicate as p, MonoSourceSearch as r, parseSearchValue as s, DEFAULT_SEARCH_FIELDS as t, resolveSearchFields as u, isWildcardPattern as v, resolveSearchEntries as x, normalizeSearchExpr as y };
