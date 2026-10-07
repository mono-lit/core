import { n as isPath, r as mergePatch, t as getFieldValue } from "./field-path-C92eGLg3.js";
import { i as searchFilterOf, s as flattenLeaves, t as isDataSourceLike } from "./data-source-read-DL88aH8t.js";
import { n as andPredicates, r as compileFilterPredicate, t as andFilters } from "./filter-eval-DIfU2EAn.js";
import { o as mergeSearchFields } from "./data-search-Bwo5bg8K.js";
import { t as resolveMaybeReactive } from "./reactive-D3EERqgO.js";
import { s as odataStringToArray, t as arrayToODataString } from "./filter-odata-C1vSGZaY.js";
//#region src/components/table/array-source.ts
/** Normalise a possibly-grouped input array to flat leaf rows when grouping. */
function normalizeInput(data, group) {
	return (Array.isArray(group) ? group.length > 0 : !!group) ? flattenLeaves(data) : [...data];
}
/**
* Wrap a plain array in the structural {@link MonoGridSource} shape so
* {@link monoDataGrid} can drive it with no devextreme DataSource — paging,
* search and filtering all run client-side, in memory.
*
* @example
* const source = monoArraySource(rows, { pageSize: 10, searchValue: ['name'] })
* const table = monoDataGrid(source)
* await table.load()
* // later: source.setData(nextRows)  // swap the underlying array
*/
function monoArraySource(data = [], opts = {}) {
	const handlers = {
		changed: [],
		loadingChanged: [],
		loadError: []
	};
	let all = normalizeInput(data, opts.group);
	let pageIndex = 0;
	let pageSize = opts.pageSize ?? 10;
	let paginate = true;
	let search = null;
	let searchExpr = mergeSearchFields(opts)?.filter((e) => typeof e === "string") ?? null;
	let searchOperation = "contains";
	let filter = null;
	let sortList = [];
	let page = [];
	const emit = (event, arg) => (handlers[event] ?? []).slice().forEach((h) => h(arg));
	/** Normalise a single devextreme sort entry into `{ selector, desc }`. */
	function normalizeSortEntry(value) {
		if (!value) return null;
		if (typeof value === "string") return {
			selector: value,
			desc: false
		};
		const o = value;
		return o.selector ? {
			selector: o.selector,
			desc: !!o.desc
		} : null;
	}
	/** Normalise the devextreme sort forms into an ordered multi-key list. */
	function normalizeSortList(value) {
		return (Array.isArray(value) ? value : value == null ? [] : [value]).map(normalizeSortEntry).filter((e) => !!e);
	}
	/** Read a sort/compare value; a wildcard path sorts best-effort by its first match. */
	function sortValue(row, selector) {
		if (!isPath(selector)) return row[selector];
		const v = getFieldValue(row, selector);
		return Array.isArray(v) ? v[0] : v;
	}
	/** Compare two rows by one selector (numeric when both sides parse). */
	function compareBy(a, b, selector, desc) {
		const av = sortValue(a, selector);
		const bv = sortValue(b, selector);
		const dir = desc ? -1 : 1;
		if (av == null && bv == null) return 0;
		if (av == null) return -dir;
		if (bv == null) return dir;
		const an = Number(av);
		const bn = Number(bv);
		const cmp = !Number.isNaN(an) && !Number.isNaN(bn) ? an - bn : String(av).localeCompare(String(bv));
		return cmp === 0 ? 0 : (cmp < 0 ? -1 : 1) * dir;
	}
	/** Apply filter + search + sort, returning the matching rows. */
	function applied() {
		let rows = all;
		if (typeof filter === "function") rows = rows.filter(filter);
		const cols = searchExpr == null ? [] : Array.isArray(searchExpr) ? searchExpr : [searchExpr];
		if (search && cols.length) {
			const needle = String(search).toLowerCase();
			const matches = (row, c) => {
				const raw = isPath(c) ? getFieldValue(row, c) : row[c];
				return (Array.isArray(raw) ? raw : [raw]).some((v) => String(v ?? "").toLowerCase().includes(needle));
			};
			rows = rows.filter((row) => cols.some((c) => matches(row, c)));
		}
		if (sortList.length) rows = [...rows].sort((a, b) => {
			for (const { selector, desc } of sortList) {
				const cmp = compareBy(a, b, selector, desc);
				if (cmp !== 0) return cmp;
			}
			return 0;
		});
		return rows;
	}
	const source = {
		on: (event, handler) => void (handlers[event] ??= []).push(handler),
		off: (event, handler) => {
			handlers[event] = (handlers[event] ?? []).filter((h) => h !== handler);
		},
		items: () => page,
		/** Full backing array (unfiltered) — lets the grid derive header-filter values. */
		data: () => [...all],
		isLoading: () => false,
		totalCount: () => applied().length,
		isLastPage: () => (pageIndex + 1) * pageSize >= applied().length,
		paginate: (value) => value === void 0 ? paginate : paginate = value,
		pageSize: (value) => value === void 0 ? pageSize : pageSize = value,
		pageIndex: (value) => value === void 0 ? pageIndex : pageIndex = value,
		searchValue: (value) => value === void 0 ? search : search = value || null,
		searchExpr: (value) => value === void 0 ? searchExpr : searchExpr = value ?? null,
		searchOperation: (op) => op === void 0 ? searchOperation : searchOperation = op,
		filter: (value) => value === void 0 ? filter : filter = typeof value === "function" ? value : null,
		sort: (value) => value === void 0 ? sortList : sortList = normalizeSortList(value),
		load: () => {
			emit("loadingChanged", true);
			const rows = applied();
			const start = pageIndex * pageSize;
			page = paginate ? rows.slice(start, start + pageSize) : rows.slice();
			emit("changed");
			emit("loadingChanged", false);
			return Promise.resolve(page);
		},
		reload: () => source.load(),
		/** Replace the backing array and reload from page 0. */
		setData: (next) => {
			all = normalizeInput(next, opts.group);
			pageIndex = 0;
			return Promise.resolve(source.load());
		},
		/**
		* Merge `values` into the row whose `keyExpr` field equals `key`, then reload
		* — the per-row write path used by `monoDataGrid.saveChanges()` for an
		* array-backed table (correct across pages, unlike a whole-array `setData`).
		*/
		update: (key, values) => {
			const keyExpr = opts.keyExpr ?? "Id";
			const idx = all.findIndex((row) => String(row?.[keyExpr]) === String(key));
			if (idx >= 0) all[idx] = mergePatch(all[idx], values);
			return Promise.resolve(source.load());
		}
	};
	return source;
}
//#endregion
//#region src/utils/data-source-apply.ts
/** The store's OData version, or `null` for anything that is not an OData store. */
function odataStoreVersion(store) {
	const s = store;
	if (!s || typeof s.version !== "function") return null;
	const v = Number(s.version());
	return Number.isFinite(v) ? v : null;
}
/** The store's base url, or `null` when it cannot be read. */
function odataStoreUrl(store) {
	const s = store;
	const url = s?._requestDispatcher?.url ?? s?._url;
	return typeof url === "string" && url ? url : null;
}
/** `<url>?$apply=<encoded clause>` — `&` when the url already has a query string. */
function applyRequestUrl(url, apply) {
	return `${url}${url.includes("?") ? "&" : "?"}$apply=${encodeURIComponent(apply)}`;
}
/**
* The `store.load()` options that carry `apply`, or `null` when this store
* cannot carry one (no request should be made).
*
* `requireTotalCount: false` keeps `$count` off — a rolled-up result has no
* meaningful total, and `$count` beside `$apply` is rejected by some servers.
*/
function applyLoadOptions(store, apply, options = {}) {
	if (odataStoreVersion(store) == null) return null;
	const url = odataStoreUrl(store);
	if (!url) return null;
	const hasTop = typeof options.top === "number" && options.top >= 0;
	return {
		urlOverride: applyRequestUrl(url, apply),
		requireTotalCount: false,
		...hasTop ? { take: options.top } : {}
	};
}
/** Normalise a devextreme store `load` result into a plain rows array. */
function storeRows(res) {
	return Array.isArray(res) ? res : res?.data ?? [];
}
/**
* Send `apply` through `store` and return the rolled-up rows, or `null` when
* the store cannot carry an `$apply` (nothing was requested). A request that
* FAILS throws — the caller decides whether that disables the path for good
* (see {@link createApplyGate}).
*/
async function loadApply(store, apply, options = {}) {
	const loadOptions = applyLoadOptions(store, apply, options);
	if (!loadOptions) return null;
	return storeRows(await store.load(loadOptions));
}
/**
* Whether `rows` are what an honoured `$apply` returns — each row carrying
* ONLY the grouping key(s) and the aggregate aliases in `keys` (plus OData
* `@odata.*` annotations) — as opposed to plain entities from a server that
* ignored the clause. The distinction matters because an alias is usually the
* field's own name: an entity `{ Id, Dept, Total }` has the alias `Total` too,
* and would be mistaken for a bucket by a presence check. The extra `Id` is
* what gives it away. `keys` are matched on their ROOT segment (`Job/Title`
* comes back as `{ Job: { Title } }`).
*/
function isRolledUp(rows, keys) {
	const allowed = new Set(keys.map((k) => k.split(/[./]/, 1)[0]));
	return rows.every((row) => !!row && typeof row === "object" && Object.keys(row).every((k) => k.startsWith("@") || allowed.has(k)));
}
/**
* Whether a failed `$apply` request means the BACKEND does not do `$apply` —
* a 4xx (`400 Bad Request`, `404`) or `501 Not Implemented` — as opposed to a
* transient fault (network down: `httpStatus` 0 / absent, a 5xx). devextreme
* puts the status on the error as `httpStatus`.
*/
function isApplyRejected(err) {
	const status = Number(err?.httpStatus);
	if (!Number.isFinite(status)) return false;
	return status >= 400 && status < 500 || status === 501;
}
/**
* Per-controller "is the `$apply` path still worth trying?" switch.
*
* A backend without `$apply` answers every attempt with the same 4xx, and a
* grid that retried on every panel open / recompute would pay one failed
* request each time before falling back. So the FIRST definite rejection is
* remembered for the controller's lifetime; a transient failure is not, and
* the next attempt goes out normally.
*/
function createApplyGate(enabled) {
	let rejected = false;
	return {
		get skip() {
			return !enabled || rejected;
		},
		reject(err) {
			if (isApplyRejected(err)) rejected = true;
		}
	};
}
//#endregion
//#region src/utils/data-source-summary.ts
/**
* Server-side column aggregates: the pieces a consumer needs to answer
* "what are the totals?" without the grid draining every row to add them up.
*
* ── Resolver → store → drain ──
*
* A registered summary covers the FULL filtered set, not the current page, so
* something has to see every matching row. Left to itself the grid drains the
* bound source in `take: 100` chunks — free over an array, and pathological over
* a server-paged table, where it re-fetches through the pager exactly the rows
* the pager exists to avoid.
*
* The fix is to ask the server for the totals, and there are two ways in. The
* grid's own: ONE `$apply=filter(…)/aggregate(…)` through the bound source's
* STORE (`utils/data-source-apply`), which rides its url, `beforeSend` and auth.
* That needs a devextreme `ODataStore` — a CustomStore has nothing to carry the
* clause on, and **devextreme itself has no aggregate support**: `totalSummary`,
* `groupSummary` and `$apply` appear nowhere in it, an unknown load option is
* dropped in silence rather than refused (a `store.load({ totalSummary })` comes
* back as ordinary rows), and `customQueryParams` are service-operation
* parameters — quoted as literals, and on OData v4 a FUNCTION-INVOCATION url,
* `Entity($apply='…')` — so the clause has to go into the url (`urlOverride`),
* which is what `loadApply` does.
*
* The consumer's: a resolver. It is asked FIRST and covers what the store path
* cannot — a fetcher of the consumer's own, a custom dialect, a cached answer.
* The library builds the clause and hands it over; the consumer performs the
* request with whatever it already uses. Declining (`null`) falls through to the
* store path, and that declining falls through to the drain.
*/
/**
* mono's aggregate kinds → the OData v4 aggregation keyword.
*
* `countDistinct` maps to `countdistinct`, which OData does define — unlike the
* devextreme summary descriptor, which has no equivalent at all. Building the
* clause is free; whether a given backend implements it is the consumer's
* problem, and declining is always safe.
*/
var ODATA_AGG = {
	sum: "sum",
	avg: "average",
	min: "min",
	max: "max",
	count: "$count",
	countDistinct: "countdistinct"
};
/** A dotted path (`Job.Budget`) addresses a nav property as `Job/Budget` in OData. */
var toODataPath = (field) => field.replaceAll(".", "/");
/**
* A field a server can aggregate.
*
* A WILDCARD or INDEX path (`Lines.[*].Total`) is rejected: `getFieldValue`
* resolves those by walking a collection on a loaded row, and no `$apply`
* expression means the same thing — the nearest OData construct aggregates the
* collection per parent rather than across all of them.
*/
var isAggregatableField = (field) => !!field && !field.includes("[") && !field.includes("*");
/**
* The response key each spec's value comes back under.
*
* Plain `field` while that field carries ONE aggregate, which is the ordinary
* case and keeps the response readable; `field_type` once the same field has
* two (a `sum` and an `avg` of `Price`), because an `$apply` cannot alias two
* values to the same name. An explicit `name` always wins, and a bare `count`
* has no field to name it after.
*/
function summaryAliases(specs) {
	const seen = /* @__PURE__ */ new Map();
	for (const s of specs) {
		if (!s.field) continue;
		seen.set(s.field, (seen.get(s.field) ?? 0) + 1);
	}
	return specs.map((s, i) => {
		if (s.name) return s.name;
		if (!s.field) return `count_${i}`;
		return (seen.get(s.field) ?? 0) > 1 ? `${s.field}_${s.type ?? "sum"}` : s.field;
	});
}
/**
* Build `aggregate(<field> with <agg> as <alias>, …)` for a set of specs.
*
* Returns `null` when no spec can be expressed — a caller with nothing to ask
* for should not make a request.
*/
function buildSummaryApply(specs) {
	const aliases = summaryAliases(specs);
	const parts = specs.map((spec, i) => {
		const agg = ODATA_AGG[spec.type ?? "sum"];
		if (!agg) return null;
		if (agg === "$count") return `$count as ${aliases[i]}`;
		if (!spec.field || !isAggregatableField(spec.field)) return null;
		return `${toODataPath(spec.field)} with ${agg} as ${aliases[i]}`;
	}).filter((p) => !!p);
	return parts.length ? `aggregate(${parts.join(",")})` : null;
}
/**
* Compose a filter with an aggregate: `filter(<expr>)/aggregate(…)`.
*
* The filter goes INSIDE `$apply` rather than travelling as a sibling `$filter`
* — that is what makes the two compose, since the filter runs first and the
* aggregation sees only matching rows.
*/
function composeSummaryApply(apply, filter) {
	const expr = arrayToODataString(filter);
	return expr ? `filter(${expr})/${apply}` : apply;
}
/**
* The predicate a summary must aggregate over — IDENTICAL to what the drain uses.
*
* `readAllRows` reads a DataSource as its own `filter()` AND its reconstructed
* `searchValue`, which is a DataSource-level option the store knows nothing
* about. Anything less here and a total would quietly count rows the user had
* searched away, which is worse than being slow.
*/
function summaryFilterOf(source) {
	if (!isDataSourceLike(source)) return null;
	const ds = source;
	return andFilters(ds.filter?.() ?? null, searchFilterOf(ds) ?? null);
}
//#endregion
//#region src/utils/data-source-options.ts
/** The knobs with a meaning of their own; anything else is passed through as a load option. */
var DATA_SOURCE_KNOBS = new Set([
	"filter",
	"select",
	"expand",
	"sort",
	"customQueryParams",
	"paginate",
	"pageSize",
	"requireTotalCount",
	"searchExpr",
	"searchOperation"
]);
/** A comma string or an array → a trimmed string list; `null`/`undefined` → `undefined`. */
function toList(v) {
	if (v == null) return void 0;
	if (Array.isArray(v)) return v.map(String);
	return String(v).split(",").map((x) => x.trim()).filter(Boolean);
}
/** devextreme's sort forms (string / object / array / mixed) → an ordered entry list. */
function normalizeSortList(value) {
	const arr = Array.isArray(value) ? value : value == null ? [] : [value];
	const out = [];
	for (const v of arr) {
		if (!v) continue;
		if (typeof v === "string") out.push({
			selector: v,
			desc: false
		});
		else if (typeof v === "object" && v.selector) out.push({
			selector: v.selector,
			desc: !!v.desc
		});
	}
	return out;
}
/** `"A desc, B"` → `[{A, desc}, {B}]`. */
function parseOrderby(text) {
	return text.split(",").map((part) => part.trim()).filter(Boolean).map((part) => {
		const [selector, dir] = part.split(/\s+/);
		return {
			selector,
			desc: (dir ?? "").toLowerCase() === "desc"
		};
	});
}
/**
* The parser emits OData keyword operators (`eq`, `ge`) — the filter builder's
* tree reads either — but devextreme's ODataStore compiles ONLY the symbol forms
* and throws `E4003` on a keyword. Rewritten recursively.
*/
function toSymbolOps(expr) {
	if (!Array.isArray(expr)) return expr;
	const SYM = {
		eq: "=",
		ne: "<>",
		gt: ">",
		ge: ">=",
		lt: "<",
		le: "<="
	};
	if (expr.length === 3 && typeof expr[0] === "string" && typeof expr[1] === "string" && !Array.isArray(expr[2])) {
		const op = SYM[expr[1].toLowerCase()];
		return op ? [
			expr[0],
			op,
			expr[2]
		] : expr;
	}
	return expr.map((part) => Array.isArray(part) ? toSymbolOps(part) : part);
}
/**
* A raw `$filter` → devextreme's array form, so the store compiles it TOGETHER
* with whatever the component adds. The parser throws on syntax it does not know
* (lambdas, ISO date literals); those go through as a one-element raw clause,
* which devextreme emits as `(expr) eq true` — valid OData, with the caveat that
* it rewrites `.` to `/` inside the text.
*/
function parseOdataFilter(raw) {
	const text = raw.trim();
	if (!text) return null;
	try {
		return toSymbolOps(odataStringToArray(text) ?? null);
	} catch {
		return [`(${text})`];
	}
}
/** `{ $select, $expand, $orderby, $filter, …custom }` → the DataSource shape. */
function normalizeOdataOptions(o) {
	const out = {};
	const custom = {};
	for (const [k, v] of Object.entries(o)) {
		if (v === void 0) continue;
		if (k === "$select") out.select = toList(v);
		else if (k === "$expand") out.expand = Array.isArray(v) ? v.map(String) : String(v);
		else if (k === "$orderby") out.sort = parseOrderby(String(v));
		else if (k === "$filter") {
			const f = parseOdataFilter(String(v));
			if (f != null) out.filter = f;
		} else custom[k] = v;
	}
	if (Object.keys(custom).length) out.customQueryParams = custom;
	return out;
}
/**
* `a` ∧ `b`: filters AND-ed (predicates and arrays each on their own terms),
* `select`/`expand` unioned, sort de-duplicated by selector with `a` leading,
* `customQueryParams` merged with `b` winning, scalars `b` if defined else `a`.
*/
function mergeDataSourceOptions(a, b) {
	const out = {
		...a,
		...b
	};
	if (a.filter != null && b.filter != null) out.filter = typeof a.filter === "function" || typeof b.filter === "function" ? andPredicates(typeof a.filter === "function" ? a.filter : compileFilterPredicate(a.filter), typeof b.filter === "function" ? b.filter : compileFilterPredicate(b.filter)) : andFilters(a.filter, b.filter);
	else out.filter = a.filter ?? b.filter;
	const union = (x, y) => {
		const xs = toList(x), ys = toList(y);
		if (!xs && !ys) return void 0;
		return [...new Set([...xs ?? [], ...ys ?? []])];
	};
	if (a.select !== void 0 || b.select !== void 0) out.select = union(a.select, b.select);
	if (a.expand !== void 0 || b.expand !== void 0) {
		const nested = (v) => typeof v === "string" && v.includes("(");
		out.expand = nested(a.expand) || nested(b.expand) ? b.expand ?? a.expand : union(a.expand, b.expand);
	}
	if (a.sort !== void 0 || b.sort !== void 0) {
		const as = normalizeSortList(a.sort);
		const bs = normalizeSortList(b.sort).filter((e) => !as.some((x) => x.selector === e.selector));
		out.sort = [...as, ...bs];
	}
	if (a.customQueryParams || b.customQueryParams) out.customQueryParams = {
		...a.customQueryParams ?? {},
		...b.customQueryParams ?? {}
	};
	return out;
}
/**
* Read both option bags fresh and merge them — the one call a controller makes
* at the top of every query. Returns a NEW object every time (a getter hands
* back fresh state), so callers that need change detection compare by content:
* see {@link dataSourceOptionsKey}.
*/
function resolveDataSourceOptions(dataSourceOptions, odataOptions) {
	const ds = resolveMaybeReactive(dataSourceOptions) ?? {};
	const od = resolveMaybeReactive(odataOptions);
	return od ? mergeDataSourceOptions(ds, normalizeOdataOptions(od)) : { ...ds };
}
/**
* A content key for change detection. Functions (an array-source predicate) do
* not stringify, so they are marked and must be compared by reference by the
* caller; a circular object yields a fresh random key and so always counts as
* changed.
*/
function dataSourceOptionsKey(o) {
	try {
		return JSON.stringify(o, (_k, v) => typeof v === "function" ? "[fn]" : v);
	} catch {
		return String(Math.random());
	}
}
/** `expand` / `customQueryParams` / unknown keys — what goes onto a `store.load()` beside the knobs. */
function extraLoadOptions(o) {
	const out = {};
	for (const [k, v] of Object.entries(o)) if (!DATA_SOURCE_KNOBS.has(k) && v !== void 0) out[k] = v;
	if (o.expand !== void 0) out.expand = o.expand;
	if (o.customQueryParams !== void 0) out.customQueryParams = o.customQueryParams;
	return out;
}
//#endregion
export { resolveDataSourceOptions as a, composeSummaryApply as c, createApplyGate as d, isRolledUp as f, monoArraySource as h, normalizeSortList as i, summaryAliases as l, storeRows as m, extraLoadOptions as n, toList as o, loadApply as p, mergeDataSourceOptions as r, buildSummaryApply as s, dataSourceOptionsKey as t, summaryFilterOf as u };
