import { c as toODataClause, n as isPath, t as getFieldValue } from "./field-path-C92eGLg3.js";
import { t as andFilters } from "./filter-eval-DIfU2EAn.js";
import { n as unwrapReactive } from "./reactive-D3EERqgO.js";
//#region src/components/table/grouping.ts
/**
* Client-side grouping helpers shared by {@link monoArraySource} and
* {@link monoDataGrid}. Dependency-free so @mono-lit/helper stays standalone; the
* tree shape mirrors what a devextreme DataSource produces for `group`, so a
* consumer can read `row.key` / `row.items[i].key` / … exactly as before.
*/
/** Duck-type a grouped node: `{ key, items: [...] }`. */
function isGroupNode(x) {
	return !!x && typeof x === "object" && "key" in x && Array.isArray(x.items);
}
/**
* Recursively collect the leaf records from a possibly-grouped array. Already
* flat rows pass straight through, so this safely normalises both a grouped
* payload (devextreme `type:'data'` with `group`) and a plain array.
*/
function flattenLeaves(rows) {
	const out = [];
	for (const row of rows) if (isGroupNode(row)) out.push(...flattenLeaves(row.items));
	else out.push(row);
	return out;
}
/**
* Bucket flat leaf records into the nested {@link MonoGroupNode} tree by
* `fields` (in order). Group order follows first appearance in `rows` — the
* source group-orders the rows, so a paged slice renders contiguous headers.
*
* @param rows     Flat leaf records (already group-ordered for nice paging).
* @param fields   Group-by field names, outermost first.
* @param collapsed Set of collapsed `path`s; matching nodes get `collapsed:true`.
*/
function buildGroups(rows, fields, collapsed = /* @__PURE__ */ new Set()) {
	const build = (items, level, parentPath) => {
		const field = fields[level];
		const buckets = /* @__PURE__ */ new Map();
		for (const row of items) {
			const key = isPath(field) ? getFieldValue(row, field) : row?.[field];
			const keyStr = String(key);
			let bucket = buckets.get(keyStr);
			if (!bucket) {
				bucket = {
					key,
					rows: []
				};
				buckets.set(keyStr, bucket);
			}
			bucket.rows.push(row);
		}
		const nodes = [];
		for (const [keyStr, bucket] of buckets) {
			const path = parentPath ? `${parentPath}/${keyStr}` : keyStr;
			const isLast = level >= fields.length - 1;
			nodes.push({
				key: bucket.key,
				items: isLast ? bucket.rows : build(bucket.rows, level + 1, path),
				count: bucket.rows.length,
				level,
				path,
				collapsed: collapsed.has(path)
			});
		}
		return nodes;
	};
	return fields.length ? build(rows, 0, "") : [];
}
/** Collect every group node's `path` from a built tree (for collapse-all). */
function collectGroupPaths(nodes) {
	const out = [];
	const walk = (list) => {
		for (const node of list) {
			out.push(node.path);
			const children = node.items;
			if (children.length && isGroupNode(children[0])) walk(children);
		}
	};
	walk(nodes);
	return out;
}
//#endregion
//#region src/utils/data-source-read.ts
/**
* Draining a devextreme DataSource (or store) to a flat array.
*
* The single place that knows how to read *everything* out of a source, shared
* by `monoDataGrid.getData()` and the report engine's `data` resolver. Kept
* duck-typed and dependency-free — @mono-lit/helper never imports devextreme, and a
* real DataSource satisfies these shapes structurally.
*
* The hard part isn't the loop, it's reading a source **without disturbing it**:
* the same DataSource is usually bound to a live grid, so paging state must
* either be left alone (the store path) or restored exactly (the array path).
*/
/** Stop runaway loops if a backend keeps returning full chunks forever. */
var MAX_SKIP = 1e7;
/** A devextreme DataSource: it both loads and holds a current page. */
function isDataSourceLike(value) {
	const v = value;
	return !!v && typeof v === "object" && typeof v.load === "function" && typeof v.items === "function";
}
/** A bare store (ODataStore / CustomStore / ArrayStore) — loads, but has no page. */
function isStoreLike(value) {
	const v = value;
	return !!v && typeof v === "object" && typeof v.load === "function" && typeof v.items !== "function" && (typeof v.key === "function" || typeof v.byKey === "function");
}
/** Anything this module can drain into an array. */
function isReadableSource(value) {
	return isDataSourceLike(value) || isStoreLike(value);
}
/** devextreme `store.load` resolves to either an array or `{ data, … }`. */
function rowsOf(res) {
	return Array.isArray(res) ? res : res?.data ?? [];
}
/**
* Build a devextreme filter expression for a DataSource's **active search**.
*
* This is the subtle one. `searchValue` / `searchExpr` are DataSource-level
* options: the DataSource folds them into the request it sends to its store.
* Reading the store directly bypasses them entirely — so an export would
* silently include rows the user filtered away with `<mono-table-search>`.
* Reconstructing the filter here keeps the store path faithful to the grid.
*/
function searchFilterOf(source) {
	const value = source.searchValue?.();
	const search = value == null || value === "" ? null : String(value);
	if (!search) return void 0;
	const expr = source.searchExpr?.();
	const cols = Array.isArray(expr) ? expr : expr ? [expr] : [];
	if (!cols.length) return void 0;
	const op = source.searchOperation?.() || "contains";
	const clauses = cols.map((c) => toODataClause(c, op, search)).filter((c) => c != null);
	if (!clauses.length) return void 0;
	if (clauses.length === 1) return clauses[0];
	const out = [];
	clauses.forEach((c, i) => {
		if (i) out.push("or");
		out.push(c);
	});
	return out;
}
/**
* Read every row a source can produce, in chunks.
*
* A plain array passes straight through, so callers can accept
* "array or DataSource" without branching.
*/
async function readAllRows(source, options = {}) {
	const src = unwrapReactive(source);
	if (Array.isArray(src)) return flattenLeaves(src);
	if (!src) return [];
	const chunkSize = Math.max(1, Math.floor(options.chunkSize ?? 100));
	if (isDataSourceLike(src)) {
		const store = src.store?.();
		if (store && typeof store.load === "function") {
			const filter = andFilters(andFilters(src.filter?.() ?? null, searchFilterOf(src) ?? null), options.filter ?? null);
			const sort = options.sort ?? src.sort?.() ?? null;
			const select = options.select ?? src.select?.() ?? null;
			return drainStore(store, {
				chunkSize,
				...select ? { select } : {},
				...filter ? { filter } : {},
				...sort ? { sort } : {},
				...options.loadOptions ? { loadOptions: options.loadOptions } : {}
			});
		}
		return readArrayDataSource(src);
	}
	if (isStoreLike(src)) return drainStore(src, {
		chunkSize,
		select: options.select,
		sort: options.sort,
		...options.filter ? { filter: options.filter } : {},
		...options.loadOptions ? { loadOptions: options.loadOptions } : {}
	});
	return [];
}
/** Loop `store.load` until a short chunk comes back. */
async function drainStore(store, opts) {
	const acc = [];
	for (let skip = 0;; skip += opts.chunkSize) {
		const rows = rowsOf(await store.load({
			...opts.loadOptions ?? {},
			...opts.filter ? { filter: opts.filter } : {},
			...opts.sort ? { sort: opts.sort } : {},
			...opts.select ? { select: opts.select } : {},
			skip,
			take: opts.chunkSize,
			requireTotalCount: false
		}));
		acc.push(...flattenLeaves(rows));
		if (rows.length < opts.chunkSize) break;
		if (skip > MAX_SKIP) break;
	}
	return acc;
}
/**
* An array-backed DataSource has no separate read channel, so its paging has to
* be switched off, read, and put back exactly as it was — subscribers must not
* observe the detour.
*/
async function readArrayDataSource(src) {
	const paginate = src.paginate?.();
	const pageIndex = src.pageIndex?.();
	try {
		src.paginate?.(false);
		await src.load();
		return flattenLeaves([...src.items?.() ?? []]);
	} finally {
		if (typeof paginate === "boolean") src.paginate?.(paginate);
		if (typeof pageIndex === "number") src.pageIndex?.(pageIndex);
		await src.load();
	}
}
//#endregion
export { buildGroups as a, isGroupNode as c, searchFilterOf as i, isReadableSource as n, collectGroupPaths as o, readAllRows as r, flattenLeaves as s, isDataSourceLike as t };
