import { a as parseFieldPath, c as toODataClause, l as toODataSelector, n as isPath, o as projectFields, r as mergePatch, s as setFieldValue, t as getFieldValue } from "./field-path-C92eGLg3.js";
import { a as buildGroups, c as isGroupNode, i as searchFilterOf, o as collectGroupPaths, r as readAllRows, s as flattenLeaves } from "./data-source-read-DL88aH8t.js";
import { i as joinFilters, n as andPredicates, r as compileFilterPredicate, t as andFilters } from "./filter-eval-DIfU2EAn.js";
import { S as searchEntryFor, _ as hasWildcardSearch, b as plainSearchColumns, g as hasCustomSearch, m as customRemoteClause, o as mergeSearchFields, p as customPredicate, t as DEFAULT_SEARCH_FIELDS, x as resolveSearchEntries } from "./data-search-Bwo5bg8K.js";
import { a as resolveDataSourceOptions, c as composeSummaryApply, d as createApplyGate, f as isRolledUp, h as monoArraySource, i as normalizeSortList, l as summaryAliases, m as storeRows, n as extraLoadOptions, o as toList, p as loadApply, s as buildSummaryApply, t as dataSourceOptionsKey, u as summaryFilterOf } from "./data-source-options-CQSTZHPE.js";
import { n as unwrapReactive } from "./reactive-D3EERqgO.js";
import { t as arrayToODataString } from "./filter-odata-C1vSGZaY.js";
import { t as createNotifier } from "./notifier-CE4yxMUQ.js";
import { t as monoFilterBuilder } from "./filter-builder-Bke3qOgJ.js";
//#region src/utils/normalize-error.ts
/** Fields worth reading off an object that is not an `Error`. */
var MESSAGE_KEYS = [
	"message",
	"statusText",
	"errorMessage",
	"error",
	"detail"
];
var text = (value) => typeof value === "string" && value.trim() ? value.trim() : "";
var isObject = (value) => value !== null && typeof value === "object";
/**
* A readable message for `raw`, or `fallback` when nothing legible can be found.
*
* Never throws, and never returns an empty string — a caller rendering this into
* an error bar has to have something to render, and a blank bar is worse than a
* generic one.
*/
function normalizeError(raw, fallback = "Request failed") {
	if (raw == null) return fallback;
	if (raw instanceof Error) {
		const own = text(raw.message);
		if (own) return own;
	} else {
		if (typeof raw === "string") return text(raw) || fallback;
		if (typeof raw === "number" || typeof raw === "boolean") return String(raw);
	}
	if (isObject(raw)) {
		const obj = raw;
		for (const key of MESSAGE_KEYS) {
			const hit = text(obj[key]);
			if (hit) return hit;
		}
		const response = obj.response;
		if (isObject(response)) {
			const nested = text(response.statusText) || text(response.message);
			if (nested) return nested;
		}
		const status = errorStatus(obj);
		if (status !== void 0 && status > 0) return `HTTP ${status}`;
		if (raw instanceof Error) return text(raw.name) || fallback;
		return fallback;
	}
	return text(String(raw)) || fallback;
}
/**
* What the bar says for a status. English; an app puts its own language in
* ONCE with `setErrorMessages()` rather than on every table.
*/
var DEFAULT_ERROR_MESSAGES = Object.freeze({
	network: "Could not reach the server. Check your connection and try again.",
	400: "The server rejected the request.",
	401: "Your session has expired. Please sign in again.",
	403: "You do not have permission to view this data.",
	404: "The requested data could not be found.",
	408: "The server took too long to respond. Please try again.",
	409: "The request conflicts with the current state of the data.",
	422: "The server could not process the request.",
	429: "Too many requests. Please wait a moment and try again.",
	500: "Something went wrong on the server. Please try again later.",
	502: "The server is temporarily unavailable. Please try again later.",
	503: "The server is temporarily unavailable. Please try again later.",
	504: "The server took too long to respond. Please try again later.",
	default: "Request failed"
});
var globalMessages = null;
/**
* App-wide wording, merged over the defaults; `null` restores them. A grid's own
* `errorMessages` merges over this in turn, so a single table can still differ.
*/
function setErrorMessages(messages) {
	globalMessages = messages ? { ...messages } : null;
}
/** Defaults ← app-wide ← `local`, same shape as the filter builder's `resolveTexts`. */
function resolveErrorMessages(local) {
	const merged = { ...DEFAULT_ERROR_MESSAGES };
	for (const layer of [globalMessages, local]) {
		if (!layer) continue;
		for (const key of Object.keys(layer)) {
			const value = layer[key];
			if (typeof value === "string" && value.trim()) merged[key] = value;
		}
	}
	return merged;
}
/**
* The standard reason phrases. Not shown to anyone — they are what `describeError`
* uses to recognise that an error's text is ONLY the phrase for its status
* (`Error('Forbidden')` + `httpStatus: 403`), which adds nothing to the preset and
* so is not a detail worth appending.
*/
var REASON_PHRASES = {
	400: "Bad Request",
	401: "Unauthorized",
	402: "Payment Required",
	403: "Forbidden",
	404: "Not Found",
	405: "Method Not Allowed",
	408: "Request Timeout",
	409: "Conflict",
	410: "Gone",
	412: "Precondition Failed",
	413: "Payload Too Large",
	415: "Unsupported Media Type",
	422: "Unprocessable Entity",
	429: "Too Many Requests",
	500: "Internal Server Error",
	501: "Not Implemented",
	502: "Bad Gateway",
	503: "Service Unavailable",
	504: "Gateway Timeout"
};
/** Texts a transport mints for "no answer at all" — a status of 0 in words. */
var NETWORK_TEXTS = [
	"failed to fetch",
	"networkerror when attempting to fetch resource",
	"load failed",
	"network error",
	"unspecified network error",
	"network connection timeout",
	"network request failed"
];
var toStatus = (value) => {
	if (value === null || value === void 0 || value === "") return void 0;
	const n = Number(value);
	return Number.isInteger(n) && n >= 0 && n < 1e3 ? n : void 0;
};
/**
* The HTTP status an error carries, `0` for a network failure, `undefined` when
* it has none.
*
* Reads the fields the common transports use — devextreme's `httpStatus`, a
* fetch `Response` / axios error's `status` and `response.status`, ofetch's
* `statusCode`, an OData error body's numeric `code` — on an `Error` instance as
* readily as on a plain object, since devextreme `extend()`s them onto an
* `Error`.
*/
function errorStatus(raw) {
	if (!isObject(raw)) return void 0;
	const response = isObject(raw.response) ? raw.response : void 0;
	const direct = toStatus(raw.httpStatus) ?? toStatus(raw.status) ?? toStatus(raw.statusCode) ?? toStatus(response?.status) ?? toStatus(response?.statusCode);
	if (direct !== void 0) return direct;
	const code = toStatus((isObject(raw.errorDetails) ? raw.errorDetails : void 0)?.code);
	if (code !== void 0 && code >= 400) return code;
	const own = (raw instanceof Error ? text(raw.message) : text(raw.message)).toLowerCase();
	if (own && NETWORK_TEXTS.some((t) => own.includes(t))) return 0;
}
/**
* The text a SERVER wrote about the failure, if the error carries one — an OData
* error body's message, a JSON body's `message` / `error`, an axios
* `response.data`. `''` when there is nothing beyond the transport's own words.
*/
function serverDetail(raw) {
	if (!isObject(raw)) return "";
	const details = raw.errorDetails;
	if (isObject(details)) {
		const m = details.message;
		const hit = text(m) || (isObject(m) ? text(m.value) : "");
		if (hit) return hit;
	}
	const response = isObject(raw.response) ? raw.response : void 0;
	const data = response?.data ?? response?._data ?? raw.data;
	if (isObject(data)) {
		const err = data.error;
		const hit = text(data.message) || text(data.detail) || text(data.title) || text(err) || (isObject(err) ? text(err.message) : "");
		if (hit) return hit;
	} else if (text(data)) return text(data);
	if (!(raw instanceof Error)) {
		const err = raw.error;
		const hit = text(raw.errorMessage) || text(raw.detail) || (isObject(err) ? text(err.message) : "");
		if (hit) return hit;
	}
	return "";
}
/** Is `value` nothing more than the reason phrase / a generic label for `status`? */
function isBoilerplate(value, status) {
	const v = value.toLowerCase();
	if (!v || v === "error" || v === "unknown error" || v === "request failed") return true;
	if (/^http\s*\d{3}$/.test(v)) return true;
	if (NETWORK_TEXTS.some((t) => v.includes(t))) return true;
	if (status !== void 0) {
		const phrase = REASON_PHRASES[status]?.toLowerCase();
		if (phrase && (v === phrase || v === `${status} ${phrase}` || v === `${status}`)) return true;
		if (v === String(status)) return true;
	}
	return Object.values(REASON_PHRASES).some((p) => p.toLowerCase() === v);
}
/**
* The line a person should read for `raw`.
*
* Order: a preset for the status (`'network'` for 0) → the error's own text →
* `messages.default`. When a preset is the headline, whatever the server said
* on top of the status becomes `detail`; without a preset, the raw text IS the
* headline and only a distinct server body is a detail. Never throws, never
* returns an empty `message`.
*/
function describeError(raw, messages) {
	const texts = resolveErrorMessages(messages);
	const status = errorStatus(raw);
	const fallback = texts.default || DEFAULT_ERROR_MESSAGES.default;
	const rawText = normalizeError(raw, fallback);
	const preset = status === void 0 ? void 0 : status === 0 ? texts.network : texts[status];
	if (preset) {
		const candidate = serverDetail(raw) || (rawText === fallback ? "" : rawText);
		const detail = candidate && !isBoilerplate(candidate, status) && candidate !== preset ? candidate : "";
		return detail ? {
			message: preset,
			status,
			detail
		} : {
			message: preset,
			status
		};
	}
	const message = rawText || fallback;
	const fromServer = serverDetail(raw);
	const detail = fromServer && fromServer !== message && !isBoilerplate(fromServer, status) ? fromServer : "";
	const out = { message };
	if (status !== void 0) out.status = status;
	if (detail) out.detail = detail;
	return out;
}
//#endregion
//#region src/components/table/store-group-source.ts
/**
* Build a {@link MonoServerGroupSource} that drives **server-side** group paging
* straight from a devextreme `DataSource`'s store — no extra fetcher, no custom
* callbacks. `loadGroups` issues one cheap grouped query (group keys + counts +
* optional summaries, no rows); `loadRows` fetches a single group's page with
* `$filter` + `$skip`/`$top`. Returns `null` if the source has no usable store
* (e.g. a plain in-memory array), so the caller can fall back to client grouping.
*/
function storeGroupSource(source, config) {
	const store = source.store?.();
	if (!store || typeof store.load !== "function") return null;
	const { groupField, select, searchExpr, searchOperation, groupSummary } = config;
	const summaryDesc = groupSummary ? Object.entries(groupSummary).map(([selector, summaryType]) => ({
		selector,
		summaryType
	})) : void 0;
	/**
	* Build a devextreme filter expression for the active search (or undefined).
	* Delegates to the shared builder, which takes the search state off a source;
	* here the search arrives per-call via `ctx`, so a minimal stand-in carries it.
	*/
	function searchFilter(search) {
		if (!search || !searchExpr) return void 0;
		return searchFilterOf({
			load: () => [],
			items: () => [],
			searchValue: () => search,
			searchExpr: () => searchExpr,
			searchOperation: () => searchOperation ?? "contains"
		});
	}
	/** devextreme `store.load` returns either an array or `{ data, … }`. */
	const rows = (res) => Array.isArray(res) ? res : res?.data ?? [];
	return {
		async loadGroups(ctx) {
			const filter = joinFilters([ctx.filter, searchFilter(ctx.search)], "and");
			return rows(await store.load({
				group: [{
					selector: groupField,
					isExpanded: false
				}],
				...summaryDesc ? { groupSummary: summaryDesc } : {},
				requireGroupCount: true,
				...filter ? { filter } : {},
				sort: ctx.sort ?? [{ selector: groupField }],
				...ctx.loadOptions ?? {}
			})).map((g) => ({
				key: g.key,
				count: Number(g.count ?? (Array.isArray(g.items) ? g.items.length : 0)) || 0,
				aggregates: summaryDesc && Array.isArray(g.summary) ? Object.fromEntries(summaryDesc.map((s, i) => [s.selector, Number(g.summary[i]) || 0])) : void 0
			}));
		},
		async loadRows(key, ctx) {
			const groupFilter = [
				groupField,
				"=",
				key
			];
			const rowSelect = select ?? ctx.select;
			return rows(await store.load({
				filter: joinFilters([
					groupFilter,
					ctx.filter,
					searchFilter(ctx.search)
				], "and"),
				...rowSelect ? { select: rowSelect } : {},
				...ctx.sort ? { sort: ctx.sort } : {},
				skip: ctx.skip,
				take: ctx.take,
				requireTotalCount: false,
				...ctx.loadOptions ?? {}
			}));
		}
	};
}
//#endregion
//#region src/components/table/date-filter-tree.ts
var DATE_LEVELS = [
	"year",
	"month",
	"day",
	"hour",
	"minute",
	"second"
];
/** A `{ from, to }` pair of Dates (or ISO strings, which `setColumnFilter` also accepts). */
function isDateRange(v) {
	if (!v || typeof v !== "object") return false;
	const o = v;
	const ok = (x) => x instanceof Date || typeof x === "string";
	return ok(o.from) && ok(o.to);
}
var BLANK_KEY = "blank";
/**
* A column value as a Date, or `null` for a blank / unparsable one. Accepts a
* `Date`, a number (epoch ms), an ISO string, and a bare `YYYY-MM-DD` — the
* last is parsed as a LOCAL date on purpose (`new Date('2026-03-05')` would be
* UTC midnight and shift a day west of Greenwich).
*/
function parseDateValue(v) {
	if (v == null || v === "") return null;
	if (v instanceof Date) return Number.isNaN(v.getTime()) ? null : v;
	if (typeof v === "number") {
		const d = new Date(v);
		return Number.isNaN(d.getTime()) ? null : d;
	}
	if (typeof v !== "string") return null;
	const s = v.trim();
	const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s);
	if (m) return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
	const d = new Date(s);
	return Number.isNaN(d.getTime()) ? null : d;
}
/** `[year, month(1-12), day, hour, minute, second]` of a Date, local or UTC. */
function datePartsOf(d, utc = false) {
	return utc ? [
		d.getUTCFullYear(),
		d.getUTCMonth() + 1,
		d.getUTCDate(),
		d.getUTCHours(),
		d.getUTCMinutes(),
		d.getUTCSeconds()
	] : [
		d.getFullYear(),
		d.getMonth() + 1,
		d.getDate(),
		d.getHours(),
		d.getMinutes(),
		d.getSeconds()
	];
}
/** The Date at the START of the period the parts describe (missing parts = their minimum). */
function dateFromParts(parts, utc) {
	const [y, mo = 1, d = 1, h = 0, mi = 0, s = 0] = parts;
	return utc ? new Date(Date.UTC(y, mo - 1, d, h, mi, s)) : new Date(y, mo - 1, d, h, mi, s);
}
/** The period `[from, to)` of a node at `level` with these parts. */
function periodOf(parts, level, utc = false) {
	const i = DATE_LEVELS.indexOf(level);
	const own = parts.slice(0, i + 1);
	const next = [...own];
	next[i] += 1;
	return {
		from: dateFromParts(own, utc),
		to: dateFromParts(next, utc)
	};
}
function labelFor(parts, level, utc, locale) {
	const d = dateFromParts(parts, utc);
	const tz = utc ? { timeZone: "UTC" } : {};
	const two = (n) => String(n).padStart(2, "0");
	switch (level) {
		case "year": return String(parts[0]);
		case "month": return new Intl.DateTimeFormat(locale, {
			month: "long",
			...tz
		}).format(d);
		case "day": return `${two(parts[2])} (${new Intl.DateTimeFormat(locale, {
			weekday: "short",
			...tz
		}).format(d)})`;
		case "hour": return `${two(parts[3])}:00`;
		case "minute": return `${two(parts[3])}:${two(parts[4])}`;
		case "second": return `${two(parts[3])}:${two(parts[4])}:${two(parts[5])}`;
	}
}
/**
* Fold distinct timestamps into the tree. Only periods that occur are built,
* counts are summed up the branches, siblings are in chronological order, and
* a blank value becomes one `(Blanks)` node at the top (never expandable).
*/
function buildDateTree(values, options = {}) {
	const depth = DATE_LEVELS.indexOf(options.depth ?? "month");
	const utc = options.utc ?? false;
	const locale = options.locale;
	const roots = /* @__PURE__ */ new Map();
	let blanks = 0;
	for (const v of values) {
		const d = parseDateValue(v.value);
		const count = Number(v.count) || 0;
		if (!d) {
			blanks += count;
			continue;
		}
		const parts = datePartsOf(d, utc);
		let siblings = roots;
		for (let i = 0; i <= depth; i++) {
			const level = DATE_LEVELS[i];
			const own = parts.slice(0, i + 1);
			let n = siblings.get(parts[i]);
			if (!n) {
				const { from, to } = periodOf(own, level, utc);
				n = {
					key: own.join("-"),
					level,
					parts: own,
					label: labelFor(own, level, utc, locale),
					count: 0,
					from,
					to,
					children: []
				};
				siblings.set(parts[i], n);
			}
			n.count += count;
			siblings = childMap(n);
		}
	}
	const finish = (map) => [...map.entries()].sort(([a], [b]) => a - b).map(([, n]) => {
		n.children = finish(childMap(n));
		childMaps.delete(n);
		return n;
	});
	const out = finish(roots);
	if (blanks > 0) out.unshift({
		key: BLANK_KEY,
		level: "year",
		parts: [],
		label: "(Blanks)",
		count: blanks,
		from: null,
		to: null,
		children: []
	});
	return out;
}
var childMaps = /* @__PURE__ */ new WeakMap();
function childMap(n) {
	let m = childMaps.get(n);
	if (!m) {
		m = /* @__PURE__ */ new Map();
		childMaps.set(n, m);
	}
	return m;
}
/**
* A node's tick state from the set of ticked keys. A key in the set means the
* WHOLE node is ticked (so every descendant is on too); otherwise the children
* decide — all on → on, none → off, some (or a partly-ticked child) → mixed.
*
* Pass `roots` to have a ticked ANCESTOR count (the node is then on) — the
* renderer walks top-down and passes `inheritedOn` instead, which is the same
* answer without a path lookup per row.
*/
function checkState(node, checked, roots, inheritedOn = false) {
	if (inheritedOn || checked.has(node.key)) return "on";
	if (roots && pathTo(node.key, roots).slice(0, -1).some((a) => checked.has(a.key))) return "on";
	if (!node.children.length) return "off";
	let on = 0;
	let mixed = false;
	for (const c of node.children) {
		const s = checkState(c, checked);
		if (s === "on") on++;
		else if (s === "mixed") mixed = true;
	}
	if (on === node.children.length) return "on";
	return on > 0 || mixed ? "mixed" : "off";
}
/**
* Tick or untick a node: the node's own key goes in (and every descendant key
* comes out — the node covers them) or the node and every descendant come out.
* Ticking a child of a fully-ticked parent first expands the parent's tick to its
* siblings, so unticking one day of a ticked month leaves the other days ticked.
*/
function setChecked(node, on, checked, roots) {
	const next = new Set(checked);
	const path = pathTo(node.key, roots);
	for (let i = 0; i < path.length - 1; i++) {
		const anc = path[i];
		if (next.has(anc.key)) {
			next.delete(anc.key);
			for (const c of anc.children) next.add(c.key);
		}
	}
	const strip = (n) => {
		next.delete(n.key);
		n.children.forEach(strip);
	};
	strip(node);
	if (on) next.add(node.key);
	for (let i = path.length - 2; i >= 0; i--) {
		const anc = path[i];
		if (anc.children.length && anc.children.every((c) => next.has(c.key))) {
			anc.children.forEach((c) => next.delete(c.key));
			next.add(anc.key);
		}
	}
	return next;
}
function pathTo(key, roots) {
	const walk = (nodes, trail) => {
		for (const n of nodes) {
			if (n.key === key) return [...trail, n];
			const found = walk(n.children, [...trail, n]);
			if (found) return found;
		}
		return null;
	};
	return walk(roots, []) ?? [];
}
/** Tick everything (every root) or nothing. */
function setAllChecked(roots, on) {
	return on ? new Set(roots.map((r) => r.key)) : /* @__PURE__ */ new Set();
}
/**
* The ticked periods as filter values — one `{ from, to }` per fully-ticked node,
* walking down only where a node is partly ticked. `(Blanks)` ticked adds a
* `null` value (the column filter's "is blank"), matching what the plain header
* filter sends for a blank.
*/
function minimize(roots, checked) {
	const out = [];
	const walk = (n) => {
		if (checked.has(n.key)) {
			out.push(n.from && n.to ? {
				from: n.from,
				to: n.to
			} : null);
			return;
		}
		n.children.forEach(walk);
	};
	roots.forEach(walk);
	return out;
}
/**
* The tick set that reproduces an applied filter (`table.columnFilter(field)`):
* a node is ticked when one of the ranges covers its whole period; a blank value
* ticks `(Blanks)`. A range that only partly covers a node ticks the children it
* covers instead.
*/
function seedFromRanges(roots, values) {
	const ranges = [];
	let blank = false;
	for (const v of values) if (v == null || v === "") blank = true;
	else if (isDateRange(v)) {
		const from = v.from instanceof Date ? v.from : new Date(v.from);
		const to = v.to instanceof Date ? v.to : new Date(v.to);
		if (!Number.isNaN(from.getTime()) && !Number.isNaN(to.getTime())) ranges.push({
			from,
			to
		});
	}
	const out = /* @__PURE__ */ new Set();
	const covers = (n) => !!n.from && !!n.to && ranges.some((r) => r.from.getTime() <= n.from.getTime() && r.to.getTime() >= n.to.getTime());
	const walk = (n) => {
		if (n.key === "blank") {
			if (blank) out.add(n.key);
			return;
		}
		if (covers(n)) {
			out.add(n.key);
			return;
		}
		n.children.forEach(walk);
	};
	roots.forEach(walk);
	return out;
}
/** Whether a Date falls in `[from, to)`. */
function inRange(d, r) {
	const t = d.getTime();
	return t >= r.from.getTime() && t < r.to.getTime();
}
//#endregion
//#region src/components/table/mono-data-grid.ts
function isCanceled(err) {
	if (!err) return false;
	return err === "canceled" || err.name === "canceled" || err.message === "canceled" || err.__id === "canceled";
}
function monoDataGrid(ds = null, opts = {}) {
	let bound = null;
	let searchFieldsOverride;
	let searchFieldsCache = null;
	/**
	* The configured search fields, or `undefined` when none of the four spellings
	* was given. `undefined` is load-bearing: it means "not configured", which lets
	* a data source keep using its own `searchExpr` instead of being handed `[]`.
	*
	* An override set through {@link setSearchExpr} (i.e. by `<mono-table-search>`)
	* wins over the options — the element is the more specific declaration.
	*/
	function searchFields() {
		if (searchFieldsOverride !== void 0) return searchFieldsOverride;
		const keys = [
			opts.searchExpr,
			opts["search-expr"],
			opts.searchValue,
			opts["search-value"]
		];
		if (searchFieldsCache && searchFieldsCache.keys.length === keys.length && searchFieldsCache.keys.every((k, i) => k === keys[i])) return searchFieldsCache.entries;
		const entries = mergeSearchFields(opts);
		searchFieldsCache = {
			keys,
			entries
		};
		return entries;
	}
	/** Whether the CONSUMER declared fields (any spelling, or via `setSearchValue`). */
	function searchFieldsConfigured() {
		return searchFields() !== void 0;
	}
	/**
	* Whether the bound SOURCE carries its own column list.
	*
	* A devextreme DataSource can be built with `searchExpr` of its own, and a grid
	* that declares nothing relies on that source folding the search itself. The
	* `'*'` default must not take that over — it would replace a correct server-side
	* search with one derived from the loaded page.
	*/
	function sourceDeclaresSearchFields() {
		const e = bound?.searchExpr?.();
		return Array.isArray(e) ? e.length > 0 : !!e;
	}
	/**
	* The fields actually searched: what the consumer configured, else what the
	* source declares (left to the source — see above), else the **default `'*'`**,
	* meaning every top-level field.
	*
	* `'*'` is resolved against real rows by `searchEntries()` and never leaves the
	* client as a literal — it expands to concrete column names first.
	*/
	function effectiveSearchFields() {
		const configured = searchFields();
		if (configured !== void 0) return configured;
		if (sourceDeclaresSearchFields()) return void 0;
		return [...DEFAULT_SEARCH_FIELDS];
	}
	let groupFields = toFields(opts.group);
	const collapsed = /* @__PURE__ */ new Set();
	let groupPageSize = Math.max(1, opts.pageSize ?? 10);
	let groupPageIndex = 0;
	let pageSizeAll = false;
	const chunkSize = Math.max(1, opts.chunkSize ?? 100);
	let suppressSync = false;
	let allRows = [];
	let scrollMode = "off";
	let accumulated = [];
	let scrollNextPage = 0;
	let scrollHasMore = false;
	let scrollLoading = false;
	let scrollToken = 0;
	let preferredPageSize = null;
	let sourcePageSize = null;
	let vStart = 0;
	let vEnd = 0;
	let vPadTop = 0;
	let vPadBottom = 0;
	const groupRowPaging = /* @__PURE__ */ new Map();
	const defaultGroupRowPageSize = opts.groupRowPageSize && opts.groupRowPageSize > 0 ? Math.floor(opts.groupRowPageSize) : 0;
	/** Effective row paging for a group: explicit registration, else the default. */
	function groupRowPagingFor(path) {
		const explicit = groupRowPaging.get(path);
		if (explicit) return explicit;
		return defaultGroupRowPageSize ? {
			pageIndex: 0,
			pageSize: defaultGroupRowPageSize
		} : null;
	}
	const pathIndex = /* @__PURE__ */ new Map();
	let serverGroup = opts.serverGroup ?? null;
	let serverGroups = [];
	const groupRows = /* @__PURE__ */ new Map();
	const groupRowsKey = /* @__PURE__ */ new Map();
	const groupRowLoading = /* @__PURE__ */ new Set();
	let searchValue = null;
	let groupSeq = 0;
	const isGrouped = () => groupFields.length > 0;
	/** Server mode requires a single group field + a `serverGroup` provider. */
	const serverMode = () => !!serverGroup && groupFields.length === 1;
	function clearRowCaches() {
		groupRows.clear();
		groupRowsKey.clear();
		groupRowLoading.clear();
	}
	const formOps = [];
	let formKey = null;
	let formShowForm = false;
	let formTempSeq = 0;
	let formHandle = null;
	const MONO_ROW_KEY = Symbol("monoFormRowKey");
	const EDITABLE_MARK = "Editable";
	const ctrl = {
		items: [],
		mapped: [],
		displayRows: [],
		loading: false,
		hasLoaded: false,
		error: null,
		totalCount: 0,
		pageIndex: 0,
		pageSize: 0,
		pageSizeAll: false,
		pageCount: 0,
		searchTerms: [],
		sorts: [],
		sortField: null,
		sortOrder: null,
		grouped: groupFields.length > 0,
		scrollMode: "off",
		hasMore: false,
		loadedCount: 0,
		virtualStart: 0,
		virtualEnd: 0,
		virtualPadTop: 0,
		virtualPadBottom: 0,
		dataSource: null,
		editingKey: null,
		editableTrigger: opts.editableTrigger ?? "click",
		editorNavKeys: opts.editorNavKeys ?? "tab-arrows",
		onCellChange: null,
		pendingData: formOps,
		load,
		reload,
		clear,
		setPage,
		setScrollPaging,
		loadNext,
		setVirtualWindow,
		setPreferredPageSize,
		setPageSize,
		setSearch,
		setSearchTerms,
		setSearchValue: setSearchExpr,
		setSearchExpr,
		searchValue: effectiveSearchFields,
		searchExpr: effectiveSearchFields,
		setFilter,
		setDataSourceOptions,
		setOdataOptions,
		refresh,
		resolvedDataSourceOptions,
		setColumnFilter,
		columnFilterCombining,
		errorBehaviour,
		setErrorBehaviour,
		columnFilter,
		filteredColumns,
		distinctValues,
		setSort,
		sortCombining,
		sortOf,
		sortIndex,
		clearSort,
		columnMap,
		setData,
		setGroup,
		toggleGroup,
		isGroupCollapsed,
		expandAllGroups,
		collapseAllGroups,
		setGroupPageSize,
		setGroupPage,
		clearGroupPaging,
		groupPageInfo,
		groupNode,
		getData,
		summary,
		summaryText,
		setSummaryResolver,
		registerSummary,
		unregisterSummary,
		summaries,
		buildGroups: buildGroupTree,
		export: exportReport,
		import: importSheet,
		isCellImported,
		isRowImported,
		bind,
		subscribe,
		dispose,
		registerColumn,
		unregisterColumn,
		detail,
		check,
		registerDetail,
		unregisterDetail,
		columns,
		props,
		registeredColumns,
		editableColumns,
		moveEditor,
		bindRowTrigger,
		beginEditRow,
		cancelEdit,
		isEditingRow,
		isEditingCell,
		commitCell,
		editorKeydown,
		stageCell,
		cellValue,
		isCellDirty,
		isRowDirty,
		pendingCount,
		hasChanges,
		changes,
		discardChanges,
		saveChanges,
		form,
		rowKey
	};
	if (opts.filterBuilder) ctrl.filterBuilder = monoFilterBuilder({
		...opts.filterBuilder,
		dataGrid: ctrl
	});
	const columnEls = /* @__PURE__ */ new Set();
	const pending = /* @__PURE__ */ new Map();
	function normalizeSummary(cfg) {
		if (!cfg) return {
			specs: [],
			recalcSearching: false,
			recalcChangedData: true,
			resolve: null
		};
		if (Array.isArray(cfg)) return {
			specs: [...cfg],
			recalcSearching: false,
			recalcChangedData: true,
			resolve: null
		};
		const specs = [];
		for (const [field, spec] of Object.entries(cfg.fields ?? {})) {
			const list = Array.isArray(spec) ? spec : [spec];
			for (const s of list) specs.push({
				field,
				...s
			});
		}
		return {
			specs,
			recalcSearching: cfg.recalculate?.searching ?? false,
			recalcChangedData: cfg.recalculate?.changedData ?? true,
			resolve: cfg.resolve ?? null
		};
	}
	const _summaryCfg = normalizeSummary(opts.summary);
	const summarySpecs = _summaryCfg.specs;
	for (const col of opts.props?.th ?? []) {
		if (!col?.field || !col.summary) continue;
		const spec = {
			field: col.field,
			...col.summary
		};
		if (!summarySpecs.some((s) => s.field === spec.field && (s.type ?? "sum") === (spec.type ?? "sum") && s.name === spec.name)) summarySpecs.push(spec);
	}
	const recalcSearching = _summaryCfg.recalcSearching;
	const recalcChangedData = _summaryCfg.recalcChangedData;
	let summaryResolve = _summaryCfg.resolve;
	const summaryCache = /* @__PURE__ */ new Map();
	/**
	* The `$apply`-through-the-store switch, shared by the summary footer and the
	* header filter: off by option, or off for good once the backend rejected one.
	*/
	const applyGate = createApplyGate(opts.serverApply !== false);
	let errorMode = opts.onError === "keep-list" ? "keep-list" : "clear-list";
	function errorBehaviour() {
		return errorMode;
	}
	function setErrorBehaviour(next) {
		errorMode = next === "keep-list" ? "keep-list" : "clear-list";
	}
	const summaryKey = (spec) => `${spec.field ?? "*"}|${spec.type ?? "sum"}|${spec.name ?? ""}`;
	/** Find the spec that a `(field, type)` read refers to. Type is matched only when given. */
	function findSummarySpec(field, type) {
		return summarySpecs.find((s) => (s.field ?? "") === field && (type === void 0 || (s.type ?? "sum") === type));
	}
	/**
	* How many elements currently want each spec.
	*
	* Registration is REFCOUNTED because several `<mono-table-summary>` cells can
	* declare the same field (a footer total and a toolbar total, say). Only the
	* first pushes the spec; previously the first to unmount removed the shared spec
	* out from under the others, and since nothing re-runs their registration they
	* rendered an empty value forever.
	*/
	const summaryRefs = /* @__PURE__ */ new Map();
	function registerSummary(spec) {
		const key = summaryKey(spec);
		summaryRefs.set(key, (summaryRefs.get(key) ?? 0) + 1);
		if (summarySpecs.some((s) => summaryKey(s) === key)) return;
		summarySpecs.push(spec);
		recomputeSummaries(true);
	}
	function unregisterSummary(spec) {
		const key = summaryKey(spec);
		const refs = (summaryRefs.get(key) ?? 1) - 1;
		if (refs > 0) {
			summaryRefs.set(key, refs);
			return;
		}
		summaryRefs.delete(key);
		const i = summarySpecs.findIndex((s) => summaryKey(s) === key);
		if (i >= 0) summarySpecs.splice(i, 1);
	}
	function summaries() {
		return summarySpecs;
	}
	/** Build the public result object for one spec from the cache. */
	function summaryResult(spec) {
		const value = summaryCache.get(summaryKey(spec)) ?? null;
		return {
			field: spec.field,
			type: spec.type ?? "sum",
			name: spec.name,
			value,
			text: formatSummary(value, spec)
		};
	}
	const summaryHandle = {
		get(field, type) {
			const spec = findSummarySpec(field, type);
			return spec ? summaryResult(spec) : null;
		},
		getAll() {
			return summarySpecs.map(summaryResult);
		}
	};
	function summary(field, type) {
		if (field === void 0) return summaryHandle;
		let spec = findSummarySpec(field, type);
		if (!spec) {
			spec = {
				field,
				type: type ?? "sum"
			};
			registerSummary(spec);
		}
		return summaryCache.get(summaryKey(spec)) ?? null;
	}
	let summaryVersion = 0;
	let summaryComputed = -1;
	/**
	* Bumped on EVERY row-set change, unconditionally — `summaryVersion` is gated
	* by the `recalculate` config, so it can't be used to answer "is the row set
	* still the one I last read?". `check().selectAll()` uses this to know whether
	* its cached drain is still valid.
	*/
	let rowSetVersion = 0;
	const bumpSummary = (reason) => {
		rowSetVersion++;
		if (reason === "search" && !recalcSearching) return;
		if (reason === "data" && !recalcChangedData && summaryComputed >= 0) return;
		summaryVersion++;
	};
	function summaryText(field, type) {
		const spec = findSummarySpec(field, type) ?? {
			field,
			type: type ?? "sum"
		};
		return formatSummary(summary(field, type), spec);
	}
	function formatSummary(value, spec) {
		if (spec.format) return spec.format(value, ctrl.items);
		if (value === null || Number.isNaN(value)) return spec.emptyText ?? "—";
		const body = spec.precision != null ? value.toLocaleString(void 0, {
			minimumFractionDigits: spec.precision,
			maximumFractionDigits: spec.precision
		}) : value.toLocaleString();
		return `${spec.prefix ?? ""}${body}${spec.suffix ?? ""}`;
	}
	/** Aggregate one spec over `rows`. Non-numeric values are skipped. */
	function aggregate(spec, rows) {
		const type = spec.type ?? "sum";
		if (type === "count") return rows.length;
		const field = spec.field;
		if (!field) return null;
		const valuesOf = (row) => {
			const raw = getFieldValue(row, field);
			return Array.isArray(raw) ? raw : [raw];
		};
		if (type === "countDistinct") {
			const seen = /* @__PURE__ */ new Set();
			for (const row of rows) for (const v of valuesOf(row)) if (v != null && v !== "") seen.add(v);
			return seen.size;
		}
		const nums = [];
		for (const row of rows) for (const raw of valuesOf(row)) {
			if (raw == null || raw === "") continue;
			const n = Number(raw);
			if (Number.isFinite(n)) nums.push(n);
		}
		if (!nums.length) return null;
		switch (type) {
			case "sum": return nums.reduce((a, b) => a + b, 0);
			case "avg": return nums.reduce((a, b) => a + b, 0) / nums.length;
			case "min": return Math.min(...nums);
			case "max": return Math.max(...nums);
			default: return null;
		}
	}
	/**
	* Run the consumer's resolver, normalised to one value per spec.
	*
	* Declines (`null`) for every case the caller should not have to think about:
	* no resolver, no bound source, an ARRAY source (already in memory — a network
	* round trip for rows we hold would be absurd), a spec set no `$apply` can
	* express, or a resolver that returned the wrong shape.
	*
	* A THROW is caught and reported once rather than propagated: a failed totals
	* request should degrade to a slower total, not break the grid. It is warned
	* about exactly once per grid so a persistent fault is visible without
	* flooding the console on every reload.
	*/
	let _summaryResolveWarned = false;
	/**
	* Swap the resolver after construction.
	*
	* The option form covers a grid you build yourself. This covers the other
	* case, which is at least as common: a grid built by a shared factory or
	* composable that does not forward `summary` — the consumer still owns the
	* fetcher, and needs somewhere to hand it over.
	*
	* Forces a recompute rather than waiting for the next data change, so a footer
	* already on screen with a locally-drained total corrects itself, and clears
	* the one-shot warning so a newly attached resolver gets a fair hearing.
	*/
	function setSummaryResolver(resolve) {
		summaryResolve = resolve ?? null;
		_summaryResolveWarned = false;
		recomputeSummaries(true);
	}
	/**
	* A resolver's (or the server's) answer → one value per spec, in spec order.
	* Positional, or keyed by alias — falling back to the plain field name, which
	* is what an `$apply` aliases to whenever a field carries one aggregate (the
	* ordinary case). `null` when the shape cannot be read.
	*/
	function summaryOutToValues(out) {
		const num = (v) => {
			const n = Number(v);
			return Number.isFinite(n) ? n : null;
		};
		if (Array.isArray(out)) return out.length === summarySpecs.length ? out.map(num) : null;
		if (!out || typeof out !== "object") return null;
		const row = out;
		const aliases = summaryAliases(summarySpecs);
		return summarySpecs.map((spec, i) => {
			const key = aliases[i];
			if (key in row) return num(row[key]);
			if (spec.field && spec.field in row) return num(row[spec.field]);
			return null;
		});
	}
	async function resolveSummaries() {
		if (!summaryResolve || !bound || Array.isArray(bound)) return null;
		const apply = buildSummaryApply(summarySpecs);
		if (!apply) return null;
		const filter = summaryFilterOf(bound);
		const aliases = summaryAliases(summarySpecs);
		try {
			const out = await summaryResolve({
				specs: summarySpecs,
				aliases,
				filter,
				odataFilter: arrayToODataString(filter) ?? "",
				apply,
				applyWithFilter: composeSummaryApply(apply, filter),
				source: bound
			});
			if (!out) return null;
			return summaryOutToValues(out);
		} catch (err) {
			if (!_summaryResolveWarned) {
				_summaryResolveWarned = true;
				console.warn("[mono-table] summary resolver failed; falling back to reading every row. Return \"null\" from the resolver to fall back without this warning.", err);
			}
			return null;
		}
	}
	/**
	* The totals as ONE `$apply=filter(…)/aggregate(…)` request through the bound
	* source's own store — the same clause the consumer resolver is offered, sent
	* by the grid itself when there is no resolver (or it declined).
	*
	* `null` is the decline: no store, the path switched off, a store that cannot
	* carry an `$apply` (`loadApply`), a response that is not one aggregated row
	* (a server that ignored the clause hands back entities, which carry none of
	* the aliases), or a failed request — which also reports to the gate, so a
	* backend that rejects `$apply` is asked exactly once.
	*/
	async function resolveSummariesViaStore() {
		if (applyGate.skip || !bound || Array.isArray(bound) || !hasStore()) return null;
		const apply = buildSummaryApply(summarySpecs);
		if (!apply) return null;
		let rows;
		try {
			rows = await loadApply(bound.store(), composeSummaryApply(apply, summaryFilterOf(bound)));
		} catch (err) {
			applyGate.reject(err);
			return null;
		}
		if (!rows || rows.length !== 1 || !isRolledUp(rows, summaryAliases(summarySpecs))) return null;
		return summaryOutToValues(rows[0]);
	}
	let _summaryRun = 0;
	/**
	* Recompute every registered summary over the full filtered set and notify.
	* No-op when nothing is registered (an unused grid never fetches) or — unless
	* `force`d — when the set hasn't changed since the last compute (so sort/paging
	* don't refetch). A run token guards against overlapping async reads landing
	* out of order.
	*
	* BURST COALESCING: a footer mounts many `<mono-table-summary>` elements and each
	* registration forces a recompute — Lit elements upgrade across separate tasks, so a
	* 48-column footer used to fire one resolver request PER element, each carrying only
	* the specs registered so far (the `$apply` aggregate list visibly grew 1 → 2 → N).
	* While one recompute is in flight, later ones only mark `_summaryQueued` and return;
	* a single trailing recompute then runs with the FULL spec set. A mount burst is
	* capped at leading + trailing requests whatever N is, and the trailing run's cache
	* write is what the footer finally shows.
	*/
	let _summaryInFlight = false;
	let _summaryQueued = false;
	async function recomputeSummaries(force = false) {
		if (!summarySpecs.length) return;
		if (!force && summaryComputed === summaryVersion) return;
		if (_summaryInFlight) {
			_summaryQueued = true;
			return;
		}
		_summaryInFlight = true;
		const run = ++_summaryRun;
		const captured = summaryVersion;
		try {
			let resolved = await resolveSummaries();
			if (run !== _summaryRun) return;
			if (!resolved) {
				resolved = await resolveSummariesViaStore();
				if (run !== _summaryRun) return;
			}
			if (resolved) {
				summarySpecs.forEach((spec, i) => {
					summaryCache.set(summaryKey(spec), resolved[i] ?? null);
				});
				summaryComputed = captured;
				notify();
				return;
			}
			const rows = await getData();
			if (run !== _summaryRun) return;
			for (const spec of summarySpecs) summaryCache.set(summaryKey(spec), aggregate(spec, rows));
			summaryComputed = captured;
			notify();
		} finally {
			_summaryInFlight = false;
			if (_summaryQueued) {
				_summaryQueued = false;
				recomputeSummaries(true);
			}
		}
	}
	function registerColumn(el) {
		columnEls.add(el);
	}
	function unregisterColumn(el) {
		columnEls.delete(el);
		if (columnEls.size === 0) unbindRowTrigger();
	}
	const detailEls = /* @__PURE__ */ new Set();
	function registerDetail(el) {
		detailEls.add(el);
	}
	function unregisterDetail(el) {
		detailEls.delete(el);
	}
	const detailHandle = {
		expandAll() {
			for (const el of detailEls) el.open = true;
			notify();
		},
		collapseAll() {
			for (const el of detailEls) if (!el.stayOpen) el.open = false;
			notify();
		},
		collapseOthers(except) {
			let changed = false;
			for (const el of detailEls) {
				if (el === except || el.stayOpen || !el.open) continue;
				el.open = false;
				changed = true;
			}
			if (changed) notify();
		},
		openCount() {
			let open = 0;
			for (const el of detailEls) if (el.open) open++;
			return open;
		},
		getAll: () => domOrdered(Array.from(detailEls))
	};
	function detail() {
		return detailHandle;
	}
	const checkedRows = /* @__PURE__ */ new Map();
	let checkConfig = {};
	let checkPending = false;
	/** `keyValue` as a list (empty = project nothing, i.e. keep the whole row). */
	function checkKeys() {
		const k = checkConfig.keyValue;
		if (!k) return [];
		return (Array.isArray(k) ? k : [k]).filter(Boolean);
	}
	/**
	* Columns to fetch while draining, or `null` for "everything".
	*
	* `keyExpr` is normally included, even when the consumer only asked for other
	* fields: `rowKeyOf` reads `row[keyExpr]` and falls back to the array INDEX
	* when it's missing, so a drain without it would key every row by its position
	* and collide with the loaded page. A `[*]` path can't be expressed as
	* `$select` at all (it needs an expand), so any wildcard drops the optimisation.
	*
	* EXCEPT when `keyExpr` names a field the rows do not have — a misconfigured
	* (or defaulted) key would otherwise put a non-existent column on the wire and
	* the server rejects the whole drain: OData answers `$select=Id` on an entity
	* without `Id` with a 400. A wrong key should cost a wider fetch, not a failed
	* one, so drop the optimisation and read whole rows instead.
	*/
	function checkSelect() {
		const keys = checkKeys();
		if (!keys.length) return null;
		const cols = [];
		for (const key of keys) {
			if (parseFieldPath(key).hasWildcard) return null;
			const selector = toODataSelector(key);
			if (!selector) return null;
			cols.push(selector);
		}
		if (!cols.includes(keyExpr)) {
			if (!rowsHaveKeyExpr()) {
				warnMissingKeyExpr();
				return null;
			}
			cols.push(keyExpr);
		}
		return cols;
	}
	/** A positive integer limit, or undefined when the config has none. */
	function limitOf(value) {
		if (value == null) return void 0;
		const n = Math.floor(Number(value));
		return Number.isFinite(n) && n >= 0 ? n : void 0;
	}
	function checkLimits() {
		const max = limitOf(checkConfig.max);
		const min = limitOf(checkConfig.min);
		return {
			...max !== void 0 ? { max } : {},
			...min !== void 0 ? { min } : {}
		};
	}
	/**
	* Add rows up to the cap. Rows already selected never count against the room
	* left — re-selecting a drained set the user has partly unticked must still be
	* a no-op for what is there. When `capped` is false (`replace`) the cap is
	* ignored: a value the developer pushes in is theirs.
	*/
	function addChecked(rows, capped = true) {
		const max = capped ? checkLimits().max : void 0;
		rows.forEach((row, i) => {
			const key = rowKeyOf(row, i);
			if (!checkedRows.has(key) && max !== void 0 && checkedRows.size >= max) return;
			checkedRows.set(key, row);
		});
	}
	/**
	* The last completed drain, so "select all → untick one → select all again"
	* costs nothing instead of walking the whole source a second time.
	*
	* Deliberately NOT an OData `not in (…)` query over the already-selected keys:
	* the exclusion list is largest exactly when the selection is largest, so
	* re-selecting after unticking one of 1,085 rows would mean putting 1,084 ids
	* in a URL — past every practical URL limit, and slower than the paged drain it
	* replaces. Remembering the drain is the cheap direction.
	*
	* One entry, invalidated whenever the ROW SET could differ: a different
	* filter/search (compared by reference, since the controller builds a fresh
	* expression for every real change), a different `$select` projection, or any
	* `bumpSummary` (bind / reload / setData / search / filter). Sorting and paging
	* deliberately do NOT invalidate — they reorder or window the same set.
	*/
	let drainedRows = null;
	let drainedFilter = null;
	let drainedSearch = null;
	let drainedTerms = "";
	let drainedSelect = "";
	let drainedVersion = -1;
	function drainIsReusable() {
		if (!drainedRows) return false;
		return Object.is(drainedFilter, bound?.filter?.() ?? null) && Object.is(drainedSearch, bound?.searchValue?.() ?? null) && drainedTerms === JSON.stringify(ctrl.searchTerms) && drainedSelect === JSON.stringify(checkSelect()) && drainedVersion === rowSetVersion;
	}
	function rememberDrain(rows) {
		drainedRows = rows;
		drainedFilter = bound?.filter?.() ?? null;
		drainedSearch = bound?.searchValue?.() ?? null;
		drainedTerms = JSON.stringify(ctrl.searchTerms);
		drainedSelect = JSON.stringify(checkSelect());
		drainedVersion = rowSetVersion;
	}
	const checkHandle = {
		getAll() {
			const keys = checkKeys();
			return [...checkedRows.values()].map((row) => projectFields(row, keys));
		},
		count: () => checkedRows.size,
		rows: () => [...checkedRows.values()],
		isChecked(row) {
			return checkedRows.has(typeof row === "string" ? row : rowKey(row));
		},
		toggle(item, checked) {
			if (item == null) return;
			const key = rowKey(item);
			const has = checkedRows.has(key);
			const next = checked === void 0 ? !has : checked;
			const { max, min } = checkLimits();
			if (!(next && !has && max !== void 0 && checkedRows.size >= max || !next && has && min !== void 0 && checkedRows.size <= min)) if (next) checkedRows.set(key, item);
			else checkedRows.delete(key);
			notify();
		},
		selectPage() {
			addChecked(ctrl.items);
			notify();
		},
		replace(rows) {
			checkedRows.clear();
			addChecked(rows, false);
			notify();
		},
		async selectAll() {
			if (checkPending) return;
			if (drainIsReusable()) {
				addChecked(drainedRows);
				notify();
				return;
			}
			checkPending = true;
			notify();
			try {
				const select = checkSelect();
				const rows = await readAllRows(bound, {
					chunkSize: Math.max(1, Math.floor(checkConfig.chunk ?? 100)),
					...select ? { select } : {},
					sort: mergedSort()
				});
				rememberDrain(rows);
				addChecked(rows);
				clearError();
			} catch (err) {
				captureError(err, "selectAll");
				throw err;
			} finally {
				checkPending = false;
				notify();
			}
		},
		clear() {
			if (!checkedRows.size) return;
			const min = checkLimits().min ?? 0;
			if (min > 0) {
				if (checkedRows.size <= min) {
					notify();
					return;
				}
				const keep = [...checkedRows.entries()].slice(0, min);
				checkedRows.clear();
				for (const [key, row] of keep) checkedRows.set(key, row);
			} else checkedRows.clear();
			notify();
		},
		limits: checkLimits,
		get atMax() {
			const max = checkLimits().max;
			return max !== void 0 && checkedRows.size >= max;
		},
		get atMin() {
			const min = checkLimits().min;
			return min !== void 0 && checkedRows.size <= min;
		},
		get pending() {
			return checkPending;
		},
		get allChecked() {
			const rows = ctrl.items;
			return rows.length > 0 && rows.every((row, i) => checkedRows.has(rowKeyOf(row, i)));
		},
		get someChecked() {
			const rows = ctrl.items;
			if (!rows.length || !checkedRows.size) return false;
			return !rows.every((row, i) => checkedRows.has(rowKeyOf(row, i)));
		},
		configure(config) {
			for (const [k, v] of Object.entries(config)) if (v === null) delete checkConfig[k];
			else if (v !== void 0) checkConfig[k] = v;
		}
	};
	function check() {
		return checkHandle;
	}
	/**
	* Sort elements by document order so a handle reads left→right / top→bottom as
	* displayed. Falls back to insertion order where `compareDocumentPosition` is
	* unavailable (SSR / no DOM).
	*/
	function domOrdered(els) {
		return els.sort((a, b) => {
			if (typeof a.compareDocumentPosition !== "function") return 0;
			const pos = a.compareDocumentPosition(b);
			if (pos & 4) return -1;
			if (pos & 2) return 1;
			return 0;
		});
	}
	function orderedColumnEls() {
		return Array.from(columnEls).sort((a, b) => {
			if (typeof a.compareDocumentPosition !== "function") return 0;
			const pos = a.compareDocumentPosition(b);
			if (pos & 4) return -1;
			if (pos & 2) return 1;
			return 0;
		});
	}
	function registeredColumns() {
		return orderedColumnEls().map((el) => ({
			field: el.field,
			caption: el.caption,
			sort: el.sort,
			editable: el.editable,
			headerFilter: el.headerFilter,
			dateFilter: el.dateFilter
		}));
	}
	function editableColumns() {
		return registeredColumns().filter((c) => !!c.editable && !!c.field);
	}
	const columnDefs = [...opts.columns ?? []];
	const columnsHandle = {
		get: (field) => columnDefs.find((c) => c.field === field) ?? null,
		getAll: () => columnDefs
	};
	const elementProps = { ...opts.props ?? {} };
	{
		const declared = opts.props?.th ?? [];
		const byField = /* @__PURE__ */ new Map();
		for (const c of columnDefs) if (c?.field) byField.set(c.field, { ...c });
		for (const c of declared) {
			if (!c?.field) continue;
			byField.set(c.field, {
				...byField.get(c.field) ?? {},
				...c
			});
		}
		const ordered = [];
		for (const c of declared) if (c?.field && byField.has(c.field)) ordered.push(byField.get(c.field));
		for (const [field, c] of byField) if (!ordered.some((o) => o.field === field)) ordered.push(c);
		elementProps.th = ordered;
	}
	function props() {
		return elementProps;
	}
	/** Snapshot written into `opts.state` on every notify (see `notify`). */
	function propsSnapshot() {
		return {
			...elementProps,
			th: (elementProps.th ?? []).map((c) => ({ ...c }))
		};
	}
	function columns() {
		return columnsHandle;
	}
	function indexOfRowKey(rowKey) {
		return ctrl.items.findIndex((row, i) => rowKeyOf(row, i) === rowKey);
	}
	function rowByKey(rowKey) {
		const i = indexOfRowKey(rowKey);
		return i >= 0 ? ctrl.items[i] : void 0;
	}
	function _cssEscape(value) {
		return typeof CSS !== "undefined" && CSS.escape ? CSS.escape(value) : value;
	}
	/**
	* Is this pointer event a press on `el`'s scrollbar rather than on its content?
	*
	* Overlay scrollbars are painted over the content box, so the event target is
	* the element underneath and only the coordinates can tell the two apart. A
	* band is live only on an axis that actually overflows, which keeps a genuine
	* click on the last row from being mistaken for a scrollbar grab.
	*/
	function _inScrollbarBand(el, e) {
		const { clientX: x, clientY: y } = e;
		if (typeof x !== "number" || typeof y !== "number") return false;
		const BAND = 17;
		const r = el.getBoundingClientRect();
		const inX = x >= r.left && x <= r.right;
		const inY = y >= r.top && y <= r.bottom;
		if (el.scrollWidth > el.clientWidth + 1 && inX && y >= r.bottom - BAND && y <= r.bottom) return true;
		if (el.scrollHeight > el.clientHeight + 1 && inY && x >= r.right - BAND && x <= r.right) return true;
		return false;
	}
	let _outsidePointer = null;
	function installOutsideExit() {
		if (typeof document === "undefined" || _outsidePointer) return;
		_outsidePointer = (e) => {
			const key = ctrl.editingKey;
			if (key == null) return;
			const target = e.target;
			if (!target?.closest) return;
			if (target.closest(`[data-row-key="${_cssEscape(key)}"]`) || target.closest("[data-mono-popup-portal], .flatpickr-calendar")) return;
			let node = target;
			while (node) {
				const s = getComputedStyle(node);
				if (/(auto|scroll)/.test(s.overflowX + s.overflowY) && _inScrollbarBand(node, e)) return;
				node = node.parentElement;
			}
			setTimeout(() => {
				if (ctrl.editingKey === key) cancelEdit();
			}, 0);
		};
		document.addEventListener("pointerdown", _outsidePointer, true);
	}
	function removeOutsideExit() {
		if (!_outsidePointer || typeof document === "undefined") return;
		document.removeEventListener("pointerdown", _outsidePointer, true);
		_outsidePointer = null;
	}
	let _triggerEl = null;
	let _triggerHandler = null;
	let _triggerType = null;
	const _onRowTrigger = (e) => {
		const target = e.target;
		if (!target?.closest) return;
		if (target.closest("[data-edit-cell]")) return;
		if (target.closest("button, a, input, select, textarea, label, [contenteditable=\"true\"]")) return;
		const rowEl = target.closest("[data-row-key]");
		if (!rowEl) return;
		const key = rowEl.getAttribute("data-row-key");
		if (key == null || ctrl.editingKey === key) return;
		if (!editableColumns().length) return;
		if (isEditableRow(rowByKey(key))) return;
		beginEditRow(key, e);
	};
	/**
	* Point the row trigger at the `<table>` that owns this grid's rows. Called by
	* every `mono-table-th` on update; idempotent, so only a changed table element
	* or a changed `editableTrigger` actually re-binds.
	*/
	function bindRowTrigger(tableEl) {
		if (typeof document === "undefined") return;
		const type = ctrl.editableTrigger === "double-click" ? "dblclick" : "click";
		if (tableEl === _triggerEl && type === _triggerType) return;
		unbindRowTrigger();
		if (!tableEl) return;
		_triggerHandler = _onRowTrigger;
		_triggerType = type;
		_triggerEl = tableEl;
		tableEl.addEventListener(type, _triggerHandler);
	}
	function unbindRowTrigger() {
		if (_triggerEl && _triggerHandler && _triggerType) _triggerEl.removeEventListener(_triggerType, _triggerHandler);
		_triggerEl = null;
		_triggerHandler = null;
		_triggerType = null;
	}
	function beginEditRow(rowKey, event) {
		if (ctrl.editingKey === rowKey) return;
		ctrl.editingKey = rowKey;
		installOutsideExit();
		installEditorKeys();
		notify();
		if (event) focusRowCell(event.target, rowKey, "first", { preferClicked: true });
	}
	function cancelEdit() {
		removeOutsideExit();
		removeEditorKeys();
		if (ctrl.editingKey === null) return;
		ctrl.editingKey = null;
		notify();
	}
	function isEditingRow(rowKey) {
		return ctrl.editingKey === rowKey;
	}
	/** A `form({ showForm: true })` row inserted for inline data entry. */
	function isEditableRow(row) {
		return !!row && row._Type === EDITABLE_MARK;
	}
	function isEditingCell(rowKeyStr, field) {
		if (!registeredColumns().some((c) => c.field === field && !!c.editable)) return false;
		return ctrl.editingKey === rowKeyStr || isEditableRow(rowByKey(rowKeyStr));
	}
	function commitCell(rowKey, field, value) {
		ctrl.onCellChange?.({
			rowKey,
			field,
			value,
			row: rowByKey(rowKey)
		});
	}
	function serverKeyOf(rowKey) {
		const row = rowByKey(rowKey);
		return row ? row[keyExpr] ?? rowKey : rowKey;
	}
	function stageCell(rowKey, field, value) {
		const row = rowByKey(rowKey);
		if (isEditableRow(row)) {
			if (isPath(field)) setFieldValue(row, field, value);
			else row[field] = value;
			notify();
			return;
		}
		const patch = pending.get(rowKey) ?? {};
		patch[field] = value;
		pending.set(rowKey, patch);
		clearImported(rowKey, field);
		notify();
	}
	const importedCells = /* @__PURE__ */ new Map();
	function markImported(rowKey, fields) {
		const set = importedCells.get(rowKey) ?? /* @__PURE__ */ new Set();
		for (const f of fields) set.add(f);
		importedCells.set(rowKey, set);
	}
	function clearImported(rowKey, field) {
		const set = importedCells.get(rowKey);
		if (!set) return;
		set.delete(field);
		if (!set.size) importedCells.delete(rowKey);
	}
	function isCellImported(rowKey, field) {
		return !!importedCells.get(rowKey)?.has(field);
	}
	function isRowImported(rowKey) {
		return !!importedCells.get(rowKey)?.size;
	}
	/** Staged value for a cell, or `fallback` when the cell isn't staged. */
	function cellValue(rowKey, field, fallback) {
		const row = rowByKey(rowKey);
		if (isEditableRow(row)) {
			const v = isPath(field) ? getFieldValue(row, field) : row[field];
			return v === void 0 ? fallback : v;
		}
		const patch = pending.get(rowKey);
		return patch && field in patch ? patch[field] : fallback;
	}
	function isCellDirty(rowKey, field) {
		const patch = pending.get(rowKey);
		return !!patch && field in patch;
	}
	function isRowDirty(rowKey) {
		return pending.has(rowKey);
	}
	function pendingCount() {
		return pending.size;
	}
	function hasChanges() {
		return pending.size > 0;
	}
	/** The staged change set — for a consumer that sends its own (bulk) request. */
	function changes() {
		return Array.from(pending.entries()).map(([rowKey, patch]) => ({
			rowKey,
			key: serverKeyOf(rowKey),
			patch: { ...patch },
			row: rowByKey(rowKey)
		}));
	}
	/** Drop the staged buffer and the import marks that shadow it. */
	function clearPending() {
		pending.clear();
		importedCells.clear();
	}
	function discardChanges() {
		if (pending.size === 0) return;
		clearPending();
		notify();
	}
	/**
	* Flush every staged row to the bound source, then clear + reflect. Remote
	* DataSource → `store.update(key, patch)` per row + `reload()`; array source →
	* per-row `update`; else a `setData` merge of the current page. On error the
	* buffer is KEPT so the save can be retried.
	*/
	async function saveChanges() {
		if (pending.size === 0) return;
		const entries = Array.from(pending.entries());
		const s = bound;
		const store = s?.store?.();
		if (store && typeof store.update === "function") {
			for (const [rowKey, patch] of entries) {
				if (Object.keys(patch).some(isPath)) console.warn("[monoDataGrid] saveChanges: a remote store.update patch contains a path key; nested PATCH bodies are not auto-built — send the nested shape your backend expects.");
				await store.update(serverKeyOf(rowKey), patch);
			}
			clearPending();
			await reload();
			return;
		}
		if (s && typeof s.update === "function") {
			for (const [rowKey, patch] of entries) await s.update(serverKeyOf(rowKey), patch);
			clearPending();
			notify();
			return;
		}
		if (s && typeof s.setData === "function") {
			const next = (s.data?.() ?? ctrl.items ?? []).map((row, i) => {
				const patch = pending.get(rowKeyOf(row, i));
				return patch ? mergePatch(row, patch) : row;
			});
			clearPending();
			await setData(next);
			return;
		}
		clearPending();
		notify();
	}
	/** First existing row to infer an empty-row shape from (array backing → page → items). */
	function formSample() {
		const fromData = (bound?.data?.())?.[0];
		const fromItems = (bound?.items?.())?.[0];
		return fromData ?? fromItems ?? ctrl.items[0];
	}
	/** Build a typed-empty row from a sample: number→0, string→'', bool→false, array→[], Date→null, object→{}. */
	function emptyLike(sample) {
		const out = {};
		for (const k in sample) {
			const v = sample[k];
			if (v == null) out[k] = null;
			else if (typeof v === "number") out[k] = 0;
			else if (typeof v === "string") out[k] = "";
			else if (typeof v === "boolean") out[k] = false;
			else if (Array.isArray(v)) out[k] = [];
			else if (v instanceof Date) out[k] = null;
			else if (typeof v === "object") out[k] = {};
			else out[k] = null;
		}
		return out;
	}
	/** Strip OData response metadata off a staged row before it enters the data. */
	function cleanRow(row) {
		if (row && typeof row === "object") {
			const r = row;
			if ("@odata.context" in r) delete r["@odata.context"];
			if ("@odata.url" in r) delete r["@odata.url"];
		}
		return row;
	}
	/**
	* The row to actually commit: OData metadata stripped, and — for a `showForm`
	* row — the `_Type` marker removed (the non-enumerable identity symbol is dropped
	* by the spread). Returns a clean object; never carries the editable marker.
	*/
	function commitRow(row) {
		cleanRow(row);
		if (isEditableRow(row)) {
			const { _Type, ...rest } = row;
			return rest;
		}
		return row;
	}
	const looseEq = (a, b) => a == b;
	/** Replay one op into a full array (array source path). */
	function replayArray(arr, op, key) {
		const idxOf = (k) => arr.findIndex((e) => looseEq(e?.[key], k));
		if (op.op === "add") for (const src of op.rows) {
			const row = commitRow(src);
			const i = idxOf(row?.[key]);
			if (i >= 0) arr.splice(i, 1, row);
			else arr.unshift(row);
		}
		else if (op.op === "edit") {
			const i = idxOf(op.key);
			if (i >= 0) arr.splice(i, 1, {
				...arr[i],
				...op.row
			});
		} else {
			const i = idxOf(op.key);
			if (i >= 0) arr.splice(i, 1);
		}
	}
	/** Replay one op into the live page collection (remote source path). Returns the totalCount delta. */
	function replayDs(coll, op, key, pushes) {
		const idxOf = (k) => coll.findIndex((e) => looseEq(e?.[key], k));
		if (op.op === "add") {
			let delta = 0;
			for (const src of op.rows) {
				const row = commitRow(src);
				const k = row?.[key];
				const i = idxOf(k);
				if (i >= 0) Object.assign(coll[i], row);
				else {
					coll.unshift(row);
					pushes.push({
						type: "insert",
						data: row,
						key: k
					});
					delta++;
				}
			}
			return delta;
		}
		if (op.op === "edit") {
			const i = idxOf(op.key);
			if (i >= 0) {
				Object.assign(coll[i], op.row);
				pushes.push({
					type: "update",
					key: op.key,
					data: op.row
				});
			}
			return 0;
		}
		const i = idxOf(op.key);
		if (i >= 0) {
			coll.splice(i, 1);
			pushes.push({
				type: "remove",
				key: op.key
			});
			return -1;
		}
		return 0;
	}
	/** Commit all staged form ops into the rendered data. Local only — no server call. Final: no undo. */
	async function applyForm() {
		if (formOps.length === 0) return;
		const key = formKey ?? keyExpr;
		const ops = formOps.splice(0, formOps.length);
		const s = bound;
		if (s && typeof s.setData === "function") {
			const next = [...s.data?.() ?? ctrl.items.filter((r) => !isEditableRow(r)) ?? []];
			for (const op of ops) replayArray(next, op, key);
			await setData(next);
			return;
		}
		const store = s?.store?.();
		if (s && store) {
			if (isGrouped() || serverMode()) console.warn("[monoDataGrid] form().apply() on a grouped/server grid updates only the flat page; reload to refresh groups.");
			const coll = s.items?.() ?? [];
			const pushes = [];
			let delta = 0;
			for (const op of ops) delta += replayDs(coll, op, key, pushes);
			if (typeof store.push === "function" && pushes.length) store.push(pushes);
			ctrl.items = [...coll];
			ctrl.totalCount = Math.max(0, ctrl.totalCount + delta);
			render();
			return;
		}
		notify();
	}
	/** Tag a `showForm` row: visible marker + stable non-enumerable identity. */
	function tagEditable(row) {
		row._Type = EDITABLE_MARK;
		Object.defineProperty(row, MONO_ROW_KEY, {
			value: `__form_${++formTempSeq}`,
			enumerable: false,
			configurable: true,
			writable: true
		});
		return row;
	}
	/** {@link MonoTableController.form} — memoized, chainable handle over one shared buffer. */
	function form(config) {
		if (config?.key) formKey = config.key;
		formShowForm = !!config?.showForm;
		if (formHandle) return formHandle;
		const handle = {
			add(row) {
				let rows;
				if (row === void 0) {
					const sample = formSample();
					rows = [sample ? emptyLike(sample) : {}];
				} else rows = Array.isArray(row) ? row : [row];
				if (formShowForm) {
					rows.forEach(tagEditable);
					ctrl.items.unshift(...rows);
					ctrl.totalCount += rows.length;
					render();
				}
				formOps.push({
					op: "add",
					rows
				});
				return handle;
			},
			edit(k, row) {
				formOps.push({
					op: "edit",
					key: k,
					row
				});
				return handle;
			},
			delete(k) {
				formOps.push({
					op: "delete",
					key: k
				});
				return handle;
			},
			apply: applyForm,
			revert(key) {
				const k = String(key);
				const items = ctrl.items;
				const idx = items.findIndex((r, i) => rowKeyOf(r, i) === k);
				if (idx >= 0 && isEditableRow(items[idx])) {
					items.splice(idx, 1);
					ctrl.totalCount = Math.max(0, ctrl.totalCount - 1);
				}
				for (let i = formOps.length - 1; i >= 0; i--) {
					const op = formOps[i];
					if (op.op !== "add") continue;
					op.rows = op.rows.filter((r) => rowKeyOf(r, -1) !== k);
					if (op.rows.length === 0) formOps.splice(i, 1);
				}
				render();
				return handle;
			},
			revertAll() {
				const shown = ctrl.items.filter((r) => isEditableRow(r)).length;
				if (shown) {
					ctrl.items = ctrl.items.filter((r) => !isEditableRow(r));
					ctrl.totalCount = Math.max(0, ctrl.totalCount - shown);
				}
				for (let i = formOps.length - 1; i >= 0; i--) {
					const op = formOps[i];
					if (op.op !== "add") continue;
					op.rows = op.rows.filter((r) => !isEditableRow(r));
					if (op.rows.length === 0) formOps.splice(i, 1);
				}
				render();
				return handle;
			},
			changes: () => formOps.map((o) => ({ ...o })),
			discard(key) {
				if (key === void 0) {
					formOps.length = 0;
					const shown = ctrl.items.filter((r) => isEditableRow(r)).length;
					if (shown) {
						ctrl.items = ctrl.items.filter((r) => !isEditableRow(r));
						ctrl.totalCount = Math.max(0, ctrl.totalCount - shown);
						render();
					}
					return handle;
				}
				const k = String(key);
				const items = ctrl.items;
				const idx = items.findIndex((r, i) => rowKeyOf(r, i) === k);
				if (idx >= 0 && isEditableRow(items[idx])) {
					items.splice(idx, 1);
					ctrl.totalCount = Math.max(0, ctrl.totalCount - 1);
				}
				for (let i = formOps.length - 1; i >= 0; i--) {
					const op = formOps[i];
					if (op.op === "add") {
						op.rows = op.rows.filter((r) => rowKeyOf(r, -1) !== k);
						if (op.rows.length === 0) formOps.splice(i, 1);
					} else if (String(op.key) === k) formOps.splice(i, 1);
				}
				render();
				return handle;
			},
			discardAll() {
				handle.discard();
				clearPending();
				cancelEdit();
				render();
				return handle;
			}
		};
		formHandle = handle;
		return handle;
	}
	/**
	* Focus an editor in `rowKey`.
	*
	* `preventScroll` is the important part: a bare `.focus()` scrolls the element
	* into view, and this runs inside a `requestAnimationFrame` — one frame AFTER
	* the row re-rendered — so the browser scrolls `.mono-table-scroll`
	* (`overflow-x: auto`) or the page a moment after the click lands. That
	* delayed nudge is what reads as the editor "jumping".
	*
	* `reveal` opts back into a MINIMAL scroll for the cross-row Tab, where the
	* next row genuinely may be off screen. `block: 'nearest'` moves the least
	* possible amount and does nothing when the row is already visible — unlike
	* the default focus scroll, which can centre it.
	*
	* `preferClicked` focuses the editor in the cell the user actually clicked
	* (falling back to `edge` when that cell has none — an ID or actions column,
	* or a click on the row's padding). Without it, opening a row by clicking its
	* Job cell would drop the caret in Name, and the user has to Tab back across
	* the row to reach the field they aimed at.
	*/
	function focusRowCell(fromEl, rowKey, edge, opts = {}) {
		const from = fromEl;
		const table = from?.closest?.("table");
		if (!table || typeof requestAnimationFrame === "undefined") return;
		const clickedCell = opts.preferClicked ? from?.closest?.("td") : null;
		requestAnimationFrame(() => {
			const escaped = typeof CSS !== "undefined" && CSS.escape ? CSS.escape(rowKey) : rowKey;
			const cells = table.querySelectorAll(`[data-row-key="${escaped}"] [data-edit-cell]`);
			const clicked = clickedCell?.closest(`[data-row-key="${escaped}"]`) && table.contains(clickedCell) ? clickedCell.querySelector("[data-edit-cell]") : null;
			const target = (opts.field ? table.querySelector(`[data-row-key="${escaped}"] [data-edit-cell="${_cssEscape(opts.field)}"]`) : null) ?? clicked ?? (edge === "first" ? cells[0] : cells[cells.length - 1]);
			const definesOwnFocus = typeof target?.focus === "function" && typeof HTMLElement !== "undefined" && target.focus !== HTMLElement.prototype.focus;
			const focusable = target?.matches?.("input, textarea, select, button") ? target : definesOwnFocus ? target : target?.querySelector?.("input, textarea, select, button") ?? target;
			if (opts.reveal) revealCell(target);
			focusable?.focus?.({ preventScroll: true });
		});
	}
	/** The nearest scrollable ancestor of `el` — the table's own scroll region first. */
	function scrollParentOf(el) {
		const region = el.closest(".mono-table-scroll, [mono-table-scroll]");
		if (region) return region;
		let node = el.parentElement;
		while (node) {
			const s = getComputedStyle(node);
			if (/(auto|scroll)/.test(s.overflowX + s.overflowY)) return node;
			node = node.parentElement;
		}
		return null;
	}
	/**
	* Scroll `cell` into view by the SMALLEST delta that works — and no further.
	*
	* `scrollIntoView({ block: 'nearest', inline: 'nearest' })` looks like the
	* answer but isn't: it knows nothing about pinned columns, so on a wide grid
	* it happily parks the cell *underneath* a `.mono-table-sticky-left` column or
	* the sticky header, leaving the user typing into something they can't see.
	* So compute the genuinely visible band from the pinned elements' own rects
	* and scroll only as far as that band requires. Each axis is handled
	* independently, so stepping sideways never nudges the page vertically.
	*
	* This has to be explicit now: the keyboard path focuses with
	* `preventScroll: true`, which is what stopped the browser from revealing the
	* editor for us.
	*/
	function revealCell(cell) {
		if (!cell || typeof getComputedStyle === "undefined") return;
		const scroller = scrollParentOf(cell);
		if (!scroller) return;
		const cellBox = cell.getBoundingClientRect();
		const view = scroller.getBoundingClientRect();
		const row = cell.closest("tr");
		const table = cell.closest("table");
		const MARGIN = 8;
		const edgeOf = (sel, side) => {
			const rects = Array.from((row ?? table)?.querySelectorAll(sel) ?? []).filter((n) => !n.contains(cell)).map((n) => n.getBoundingClientRect());
			if (!rects.length) return null;
			if (side === "left") return Math.max(...rects.map((r) => r.right));
			if (side === "right") return Math.min(...rects.map((r) => r.left));
			if (side === "top") return Math.max(...rects.map((r) => r.bottom));
			return Math.min(...rects.map((r) => r.top));
		};
		const left = Math.max(view.left, edgeOf(".mono-table-sticky-left, [mono-sticky-left]", "left") ?? -Infinity);
		const right = Math.min(view.right, edgeOf(".mono-table-sticky-right, [mono-sticky-right]", "right") ?? Infinity);
		if (cellBox.left < left + MARGIN) scroller.scrollLeft -= left + MARGIN - cellBox.left;
		else if (cellBox.right > right - MARGIN) scroller.scrollLeft += cellBox.right - (right - MARGIN);
		if (scroller.scrollHeight <= scroller.clientHeight + 1) return;
		const heads = Array.from(table?.querySelectorAll(".mono-table-sticky-head thead th, [mono-sticky-head] thead th, thead th") ?? []).map((n) => n.getBoundingClientRect());
		const foots = Array.from(table?.querySelectorAll(".mono-table-sticky-foot tfoot th, .mono-table-sticky-foot tfoot td, [mono-sticky-foot] tfoot th, [mono-sticky-foot] tfoot td") ?? []).map((n) => n.getBoundingClientRect());
		const top = Math.max(view.top, ...heads.map((r) => r.bottom).filter((v) => v <= view.bottom));
		const bottom = Math.min(view.bottom, ...foots.map((r) => r.top).filter((v) => v >= view.top));
		if (cellBox.top < top + MARGIN) scroller.scrollTop -= top + MARGIN - cellBox.top;
		else if (cellBox.bottom > bottom - MARGIN) scroller.scrollTop += cellBox.bottom - (bottom - MARGIN);
	}
	/** Which `[data-edit-cell]` holds the caret right now. */
	function activeEditorCell(fromEl) {
		const byEvent = fromEl?.closest?.("[data-edit-cell]");
		if (byEvent) return byEvent;
		return (typeof document !== "undefined" ? document.activeElement : null)?.closest?.("[data-edit-cell]") ?? null;
	}
	/**
	* Move the editor one cell and focus it. Clamps on both axes and returns
	* `false` when the move is blocked, so the caller can swallow the key without
	* anything happening — arrow navigation must NOT wrap around an edge. Only the
	* plain Tab tap passes `wrap`, which lets left/right cross into the
	* previous/next row in reading order (the long-standing Tab behaviour).
	*/
	function moveEditor(dir, fromEl, opts = {}) {
		const rowKey = ctrl.editingKey;
		if (rowKey == null) return false;
		const cell = activeEditorCell(fromEl);
		const field = cell?.getAttribute("data-edit-cell");
		const cols = editableColumns();
		const colIdx = field ? cols.findIndex((c) => c.field === field) : -1;
		const rowIdx = indexOfRowKey(rowKey);
		if (colIdx === -1 || rowIdx === -1 || !cols.length) return false;
		const rows = ctrl.items;
		const anchor = cell ?? fromEl;
		if (dir === "up" || dir === "down") {
			const nextIdx = rowIdx + (dir === "down" ? 1 : -1);
			const next = rows[nextIdx];
			if (!next) return false;
			const nextKey = rowKeyOf(next, nextIdx);
			beginEditRow(nextKey);
			focusRowCell(anchor, nextKey, "first", {
				reveal: true,
				field: cols[colIdx].field
			});
			return true;
		}
		const nextCol = colIdx + (dir === "right" ? 1 : -1);
		if (nextCol >= 0 && nextCol < cols.length) {
			focusRowCell(anchor, rowKey, "first", {
				reveal: true,
				field: cols[nextCol].field
			});
			return true;
		}
		if (!opts.wrap) return false;
		const nextIdx = rowIdx + (dir === "right" ? 1 : -1);
		const next = rows[nextIdx];
		if (!next) return false;
		const nextKey = rowKeyOf(next, nextIdx);
		beginEditRow(nextKey);
		focusRowCell(anchor, nextKey, dir === "right" ? "first" : "last", { reveal: true });
		return true;
	}
	const ARROW_DIRS = {
		ArrowLeft: "left",
		ArrowRight: "right",
		ArrowUp: "up",
		ArrowDown: "down"
	};
	let _editorKeys = null;
	let _tabHeld = false;
	let _tabConsumed = false;
	let _tabShift = false;
	/**
	* The control inside `cell` that owns a popup. `data-edit-cell` usually sits on
	* the control itself, but allow a wrapper. Custom elements only, and `open`
	* must be a METHOD — `<details>` and `<dialog>` both carry a boolean `open`
	* property that isn't callable.
	*/
	function popupEditorOf(cell) {
		if (!cell) return null;
		return [cell, ...Array.from(cell.querySelectorAll("*"))].find((el) => el.tagName.includes("-") && typeof el.open === "function") ?? null;
	}
	/**
	* `Enter` / `Escape`, shared by the document-level machine and the per-editor
	* `editorKeydown` so the two modes behave identically. Returns whether the key
	* belonged to us.
	*/
	function handleEditorActionKey(e, cell) {
		if (e.key === "Escape") {
			const host = popupEditorOf(cell);
			if (host?.isOpen && typeof host.close === "function") {
				e.preventDefault();
				e.stopPropagation();
				host.close();
				return true;
			}
			cancelEdit();
			return true;
		}
		if (e.key !== "Enter") return false;
		const active = e.target;
		if (active?.tagName === "TEXTAREA" || active?.isContentEditable) return false;
		const host = popupEditorOf(cell);
		if (host?.isOpen) return false;
		e.preventDefault();
		if (host) {
			e.stopPropagation();
			host.open();
		}
		return true;
	}
	/**
	* The very last cell in the grid (or the very first, going back). Tab is left
	* alone there so a keyboard user can still leave the table — trapping focus in
	* the grid would be worse than losing Tab+Arrow from that one cell.
	*/
	function atGridEdge(cell, back) {
		const cols = editableColumns();
		const colIdx = cols.findIndex((c) => c.field === cell.getAttribute("data-edit-cell"));
		const rowIdx = ctrl.editingKey != null ? indexOfRowKey(ctrl.editingKey) : -1;
		if (colIdx === -1 || rowIdx === -1) return true;
		return back ? colIdx === 0 && rowIdx === 0 : colIdx === cols.length - 1 && rowIdx === ctrl.items.length - 1;
	}
	function installEditorKeys() {
		if (typeof document === "undefined" || _editorKeys) return;
		if (ctrl.editorNavKeys !== "tab-arrows") return;
		const editingCell = (e) => {
			const key = ctrl.editingKey;
			if (key == null) return null;
			const cell = e.target?.closest?.("[data-edit-cell]");
			return cell?.closest(`[data-row-key="${_cssEscape(key)}"]`) ? cell : null;
		};
		const down = (evt) => {
			const e = evt;
			const cell = editingCell(e);
			if (!cell) return;
			if (handleEditorActionKey(e, cell)) return;
			if (e.key === "Tab") {
				if (atGridEdge(cell, e.shiftKey)) {
					_tabHeld = false;
					return;
				}
				e.preventDefault();
				if (!e.repeat) {
					_tabHeld = true;
					_tabConsumed = false;
					_tabShift = e.shiftKey;
				}
				return;
			}
			if (!_tabHeld) return;
			const dir = ARROW_DIRS[e.key];
			if (!dir) return;
			e.preventDefault();
			_tabConsumed = true;
			moveEditor(dir, e.target);
		};
		const up = (evt) => {
			const e = evt;
			if (e.key !== "Tab" || !_tabHeld) return;
			_tabHeld = false;
			if (_tabConsumed) return;
			moveEditor(_tabShift ? "left" : "right", e.target, { wrap: true });
		};
		document.addEventListener("keydown", down, true);
		document.addEventListener("keyup", up, true);
		_editorKeys = {
			down,
			up
		};
	}
	function removeEditorKeys() {
		_tabHeld = false;
		_tabConsumed = false;
		if (!_editorKeys || typeof document === "undefined") return;
		document.removeEventListener("keydown", _editorKeys.down, true);
		document.removeEventListener("keyup", _editorKeys.up, true);
		_editorKeys = null;
	}
	function editorKeydown(event, rowKey, field) {
		if (ctrl.editorNavKeys === "tab-arrows") return;
		if (event.key === "Escape" || event.key === "Enter") {
			const cell = event.target?.closest?.("[data-edit-cell]");
			handleEditorActionKey(event, cell);
			return;
		}
		if (event.key !== "Tab") return;
		const cols = editableColumns();
		const idx = cols.findIndex((c) => c.field === field);
		if (idx === -1) return;
		const rowIdx = indexOfRowKey(rowKey);
		if (rowIdx === -1) return;
		if (event.shiftKey) {
			if (idx > 0) return;
			const prev = ctrl.items[rowIdx - 1];
			if (!prev) return;
			event.preventDefault();
			const prevKey = rowKeyOf(prev, rowIdx - 1);
			beginEditRow(prevKey);
			focusRowCell(event.target, prevKey, "last", { reveal: true });
		} else {
			if (idx < cols.length - 1) return;
			const nextRow = ctrl.items[rowIdx + 1];
			if (!nextRow) return;
			event.preventDefault();
			const nextKey = rowKeyOf(nextRow, rowIdx + 1);
			beginEditRow(nextKey);
			focusRowCell(event.target, nextKey, "first", { reveal: true });
		}
	}
	function toFields(group) {
		if (!group) return [];
		return (Array.isArray(group) ? group : [group]).filter(Boolean);
	}
	/**
	* Sort descriptor sent to the source. When grouping, the group fields lead
	* (so each fetched/sliced page holds contiguous, ordered groups); the active
	* column sort follows — applied to the group field itself if it is one.
	*/
	function effectiveSort() {
		const keys = ctrl.sorts.map((s) => ({
			selector: s.field,
			desc: s.order === "desc"
		}));
		if (!groupFields.length) return keys.length ? keys : null;
		const list = groupFields.map((f) => ({
			selector: f,
			desc: keys.find((k) => k.selector === f)?.desc ?? false
		}));
		for (const k of keys) if (!groupFields.includes(k.selector)) list.push(k);
		return list;
	}
	/**
	* Push the merged sort onto the bound source — the column sort plus the base
	* sort as tiebreakers (see `mergedSort`). Remembers what it wrote so a sort the
	* consumer sets on the source afterwards can be told apart and adopted.
	*/
	function applySourceSort() {
		const s = bound;
		if (!s || typeof s.sort !== "function") return;
		s.sort(mergedSort());
		lastWrittenSort = s.sort() ?? null;
	}
	const notifier = createNotifier({ onFlush: () => {
		syncMapped();
		if (opts.state) opts.state.value = propsSnapshot();
	} });
	const notify = notifier.notify;
	const keyExpr = opts.keyExpr ?? "Id";
	const rowKeyOf = (row, i) => String(row?.[MONO_ROW_KEY] ?? row?.[keyExpr] ?? i);
	/**
	* Last-resort identity for a row we cannot place: stable per object, and never
	* equal to another row's. See `rowKey` for why "-1 for everyone" is not an option.
	*/
	const orphanKeys = /* @__PURE__ */ new WeakMap();
	let orphanSeq = 0;
	/**
	* Does the loaded row set actually carry `keyExpr`? Drives the drain + the warning.
	*
	* `ctrl.items` is not always rows. Once grouping is on it holds group NODES
	* (`{ key, items, count, level, path, … }`), and a node has none of the row's fields — so
	* sampling it would report every correctly-configured grouped table as misconfigured. Dig one
	* level down to the first group that actually has rows loaded instead; in server-group mode a
	* group's rows arrive only when it is on screen, so "no rows yet" means not-yet-known, not
	* missing, and takes the same benefit of the doubt as an empty ungrouped table.
	*/
	function rowsHaveKeyExpr() {
		/** A group node, not a row — the shape `syncGrouped` / `renderServer` put in `ctrl.items`. */
		const isNode = (x) => !!x && typeof x === "object" && Array.isArray(x.items) && "path" in x;
		/** First real row under `list`, descending as many group levels as there are. */
		const firstRow = (list, depth = 0) => {
			if (depth > 8) return void 0;
			for (const entry of list) {
				if (!isNode(entry)) return entry;
				const found = firstRow(entry.items ?? [], depth + 1);
				if (found != null) return found;
			}
		};
		const sample = firstRow(ctrl.items);
		if (sample == null || typeof sample !== "object") return true;
		return keyExpr in sample;
	}
	let keyExprWarned = false;
	/** Dev-only, once per controller: a wrong `keyExpr` otherwise fails completely silently. */
	function warnMissingKeyExpr() {
		if (keyExprWarned || ctrl.items.length === 0 || rowsHaveKeyExpr()) return;
		keyExprWarned = true;
		console.warn(`[mono-table] keyExpr "${keyExpr}" is not a property of the loaded rows${opts.keyExpr ? "" : " (nothing set one, so it defaulted to \"Id\")"}. Row keys fall back to identity, and a remote drain cannot \$select it. Set \`keyExpr\` to the row key field.`);
	}
	/**
	* Public stable row key — prefers the `showForm` identity, else `keyExpr`.
	*
	* `unwrapReactive` first: Vue hands components a reactive PROXY of the row while
	* `ctrl.items` holds the raw object, so a bare `indexOf(proxy)` is always `-1`.
	* With `keyExpr` also missing that made EVERY row key `"-1"` — tick one row and
	* the whole grid reads as ticked. A row we still cannot place gets its own
	* WeakMap id rather than a shared sentinel, so two rows can never collide
	* whatever the config. A row with a real index keeps its index-derived key, so
	* array grids with no `keyExpr` are untouched.
	*/
	function rowKey(row) {
		const raw = unwrapReactive(row);
		const i = ctrl.items.indexOf(raw);
		if (i >= 0) return rowKeyOf(raw, i);
		const direct = rowKeyOf(raw, NaN);
		if (direct !== "NaN") return direct;
		warnMissingKeyExpr();
		const obj = raw;
		if (obj == null || typeof obj !== "object") return String(raw);
		let id = orphanKeys.get(obj);
		if (!id) {
			id = `mono-orphan:${orphanSeq += 1}`;
			orphanKeys.set(obj, id);
		}
		return id;
	}
	/** Columns that declare a per-column `map`, resolved once per mapping pass. */
	function mapColumns() {
		const out = [];
		for (const c of elementProps.th ?? []) if (c?.field && typeof c.map === "function") out.push({
			field: c.field,
			map: c.map
		});
		return out;
	}
	/** True when anything at all would transform a row (lets the fast path skip). */
	function hasMap() {
		return typeof opts.map === "function" || mapColumns().length > 0;
	}
	/** One column's `map`, for the header filter's value labels. */
	function columnMap(field) {
		return mapColumns().find((c) => c.field === field)?.map;
	}
	/**
	* Raw row → presentation row. The grid-level `map` builds the row, then each
	* column's `map` overwrites its own field — reading the RAW value, deliberately
	* not the grid map's output, so a column map behaves identically here and in the
	* header-filter list (which can only hand it a raw distinct value).
	*
	* Returns the SAME object when nothing is configured, so no-map tables allocate
	* nothing and `mapped === items` holds by reference.
	*/
	function mapRow(row, index, cols = mapColumns()) {
		const rowMap = typeof opts.map === "function" ? opts.map : null;
		if (!rowMap && cols.length === 0) return row;
		let out = rowMap ? rowMap(row, index) : { ...row };
		if (cols.length && out && typeof out === "object") for (const c of cols) out[c.field] = c.map(row?.[c.field], row, index);
		return out;
	}
	/** Recompute `ctrl.mapped` from `ctrl.items`. Cheap no-op without a map. */
	function syncMapped() {
		if (!hasMap()) {
			ctrl.mapped = ctrl.items;
			return;
		}
		const cols = mapColumns();
		ctrl.mapped = ctrl.items.map((row, i) => mapRow(row, i, cols));
	}
	/** Flatten `ctrl.items` into the ready-to-render, keyed `displayRows` list. */
	function buildDisplayRows() {
		const out = [];
		const cols = mapColumns();
		if (!isGrouped()) {
			ctrl.items.forEach((row, i) => out.push({
				key: `r:${rowKeyOf(row, i)}`,
				kind: "row",
				level: 0,
				row,
				mapped: mapRow(row, i, cols)
			}));
			return out;
		}
		const footerOn = !pageSizeAll && (serverMode() || defaultGroupRowPageSize > 0 || groupRowPaging.size > 0);
		const walk = (nodes) => {
			for (const node of nodes) {
				out.push({
					key: `g:${node.path}`,
					kind: "group",
					level: node.level,
					node
				});
				if (node.collapsed) continue;
				const children = node.items;
				if (children.length > 0 && isGroupNode(children[0])) walk(children);
				else {
					children.forEach((row, i) => out.push({
						key: `r:${node.path}:${rowKeyOf(row, i)}`,
						kind: "row",
						level: node.level + 1,
						row,
						mapped: mapRow(row, i, cols)
					}));
					if (footerOn) out.push({
						key: `f:${node.path}`,
						kind: "footer",
						level: node.level,
						node
					});
				}
			}
		};
		walk(ctrl.items);
		return out;
	}
	/** Rebuild `displayRows` from the current `items`, then notify subscribers. */
	function render() {
		ctrl.displayRows = buildDisplayRows();
		notify();
	}
	/** Build the full group tree from every matched row the source holds. */
	function fullGroups() {
		return buildGroups(flattenLeaves(bound ? [...bound.items?.() ?? []] : []), groupFields, collapsed);
	}
	/** Index every group node by path (full, unsliced) for `groupPageInfo`. */
	function indexPaths(nodes) {
		for (const node of nodes) {
			pathIndex.set(node.path, node);
			if (node.items.length && isGroupNode(node.items[0])) indexPaths(node.items);
		}
	}
	/** Clone nodes, slicing each group's items to its registered group-page. */
	function toDisplay(nodes) {
		return nodes.map((node) => {
			let items = node.items.length > 0 && isGroupNode(node.items[0]) ? toDisplay(node.items) : node.items;
			const pg = pageSizeAll ? null : groupRowPagingFor(node.path);
			if (pg) {
				const start = pg.pageIndex * pg.pageSize;
				items = items.slice(start, start + pg.pageSize);
			}
			return {
				...node,
				items
			};
		});
	}
	function syncGrouped() {
		const all = fullGroups();
		pathIndex.clear();
		indexPaths(all);
		const total = all.length;
		const size = pageSizeAll ? Math.max(1, total) : Math.max(1, groupPageSize);
		const pageCount = Math.max(1, Math.ceil(total / size));
		if (groupPageIndex > pageCount - 1) groupPageIndex = pageCount - 1;
		if (groupPageIndex < 0) groupPageIndex = 0;
		const start = groupPageIndex * size;
		ctrl.grouped = true;
		ctrl.items = toDisplay(all.slice(start, start + size));
		ctrl.totalCount = total;
		ctrl.pageSize = size;
		ctrl.pageSizeAll = pageSizeAll;
		ctrl.pageIndex = groupPageIndex;
		ctrl.pageCount = pageCount;
		render();
	}
	/** Effective row paging for a group in server mode (always has a size). */
	function serverRowPaging(path) {
		return groupRowPagingFor(path) ?? {
			pageIndex: 0,
			pageSize: defaultGroupRowPageSize || groupPageSize
		};
	}
	/** Re-render from the in-memory group list + loaded row pages (no fetch). */
	function renderServer() {
		pathIndex.clear();
		const total = serverGroups.length;
		const size = pageSizeAll ? Math.max(1, total) : Math.max(1, groupPageSize);
		const pageCount = Math.max(1, Math.ceil(total / size));
		if (groupPageIndex > pageCount - 1) groupPageIndex = pageCount - 1;
		if (groupPageIndex < 0) groupPageIndex = 0;
		const start = groupPageIndex * size;
		const nodes = serverGroups.slice(start, start + size).map((meta) => {
			const path = String(meta.key);
			const node = {
				key: meta.key,
				items: collapsed.has(path) ? [] : groupRows.get(path) ?? [],
				count: meta.count,
				level: 0,
				path,
				collapsed: collapsed.has(path),
				meta
			};
			pathIndex.set(path, node);
			return node;
		});
		ctrl.grouped = true;
		ctrl.items = nodes;
		ctrl.totalCount = total;
		ctrl.pageSize = size;
		ctrl.pageSizeAll = pageSizeAll;
		ctrl.pageIndex = groupPageIndex;
		ctrl.pageCount = pageCount;
		ctrl.loading = groupRowLoading.size > 0;
		render();
	}
	/** Fetch a group's current page — or, in "all" mode, every row (chunked). */
	async function loadGroupRows(meta, pg, want) {
		if (!serverGroup) return;
		const path = String(meta.key);
		groupRowLoading.add(path);
		renderServer();
		try {
			if (pageSizeAll) {
				const acc = [];
				for (let skip = 0;; skip += chunkSize) {
					const chunk = await serverGroup.loadRows(meta.key, {
						skip,
						take: chunkSize,
						search: searchValue,
						...serverCtx()
					});
					acc.push(...chunk ?? []);
					if (!chunk || chunk.length < chunkSize || acc.length >= meta.count) break;
					if (skip > 1e7) break;
				}
				groupRows.set(path, acc);
			} else {
				const rows = await serverGroup.loadRows(meta.key, {
					skip: pg.pageIndex * pg.pageSize,
					take: pg.pageSize,
					search: searchValue,
					...serverCtx()
				});
				groupRows.set(path, rows ?? []);
			}
			groupRowsKey.set(path, want);
		} catch (err) {
			captureError(err, "groupRows");
		} finally {
			groupRowLoading.delete(path);
			renderServer();
		}
	}
	/** Fetch rows for every visible, expanded group missing its current page. */
	async function fetchVisibleRows() {
		if (!serverGroup) return;
		const size = pageSizeAll ? Math.max(1, serverGroups.length) : Math.max(1, groupPageSize);
		const start = groupPageIndex * size;
		const visible = serverGroups.slice(start, start + size);
		const jobs = [];
		for (const meta of visible) {
			const path = String(meta.key);
			if (collapsed.has(path)) continue;
			const pg = serverRowPaging(path);
			const want = pageSizeAll ? "all" : `${pg.pageIndex}:${pg.pageSize}`;
			if (groupRowsKey.get(path) === want || groupRowLoading.has(path)) continue;
			jobs.push(loadGroupRows(meta, pg, want));
		}
		if (jobs.length) await Promise.all(jobs);
	}
	/** Reload the group list (cheap groupby), then the visible groups' rows. */
	async function loadGroupsServer() {
		if (!serverGroup) return;
		if (bound) applyBase(bound);
		const seq = ++groupSeq;
		ctrl.loading = true;
		notify();
		let metas = [];
		try {
			metas = await serverGroup.loadGroups({
				search: searchValue,
				...serverCtx()
			}) ?? [];
			clearError();
		} catch (err) {
			captureError(err, "group");
			metas = [];
		}
		if (seq !== groupSeq) return;
		serverGroups = metas;
		clearRowCaches();
		renderServer();
		await fetchVisibleRows();
	}
	/**
	* Republish `ctrl` from the bound source.
	*
	* `initial` marks the one call `bind()` makes for itself. Every OTHER call
	* happens because the source produced a result — a load, a search, a filter, a
	* sort, a page — so this is the funnel where `hasLoaded` latches, rather than
	* the `changed` handler: a source that resolves `load()` without emitting still
	* reaches here, and `bind()`'s own pass must NOT count, because reflecting
	* whatever a source already holds is not the same as having asked it for
	* anything.
	*/
	function sync(initial = false) {
		if (!initial) ctrl.hasLoaded = true;
		warnMissingKeyExpr();
		if (serverMode()) {
			renderServer();
			return;
		}
		if (isGrouped()) {
			syncGrouped();
			return;
		}
		if (scrollMode !== "off") {
			syncScroll();
			return;
		}
		if (pageSizeAll) {
			ctrl.grouped = false;
			ctrl.items = allRows;
			ctrl.pageIndex = 0;
			ctrl.pageSize = allRows.length || 1;
			ctrl.pageSizeAll = true;
			ctrl.totalCount = allRows.length;
			ctrl.pageCount = 1;
			render();
			return;
		}
		const s = bound;
		const rawItems = s ? [...s.items?.() ?? []] : [];
		const total = s?.totalCount?.();
		const pageSize = s?.pageSize?.() ?? rawItems.length;
		const pageIndex = s?.pageIndex?.() ?? 0;
		const hasTotal = typeof total === "number" && total >= 0;
		ctrl.grouped = false;
		ctrl.items = rawItems;
		ctrl.pageIndex = pageIndex;
		ctrl.pageSize = pageSize;
		ctrl.pageSizeAll = false;
		ctrl.totalCount = hasTotal ? total : rawItems.length;
		if (hasTotal && pageSize > 0) ctrl.pageCount = Math.max(1, Math.ceil(total / pageSize));
		else if (s?.isLastPage?.()) ctrl.pageCount = pageIndex + 1;
		else ctrl.pageCount = pageIndex + 2;
		render();
	}
	function syncLoading() {
		ctrl.loading = bound?.isLoading?.() ?? false;
		notify();
	}
	const onChanged = () => {
		if (suppressSync) return;
		sync();
		recomputeSummaries();
	};
	const onLoadingChanged = () => syncLoading();
	function detach() {
		if (!bound) return;
		bound.off("changed", onChanged);
		bound.off("loadingChanged", onLoadingChanged);
		bound.off("loadError", onLoadingChanged);
		bound = null;
		ctrl.hasLoaded = false;
		ctrl.error = null;
	}
	function bind(next) {
		const source = Array.isArray(next) ? monoArraySource(next, {
			pageSize: opts.pageSize,
			keyExpr: opts.keyExpr,
			searchExpr: plainSearchColumns(searchFields()),
			group: groupFields
		}) : next;
		if (bound === source) return;
		detach();
		bound = source;
		ctrl.dataSource = source;
		bumpSummary("data");
		externalBase = source?.filter?.() ?? null;
		lastWrittenFilter = externalBase;
		lastComposed = void 0;
		composeMemo = null;
		lastWrittenSort = source?.sort?.() ?? null;
		externalSort = normalizeSortList(lastWrittenSort);
		resolvedKey = null;
		appliedKnobs.clear();
		if (!source) {
			sync(true);
			return;
		}
		rebuildGridExpr();
		if (!opts.serverGroup && groupFields.length === 1 && typeof source.store === "function") serverGroup = storeGroupSource(source, {
			groupField: groupFields[0],
			select: opts.select,
			searchExpr: plainSearchColumns(searchFields()),
			searchOperation: opts.searchOperation,
			groupSummary: opts.groupSummary
		});
		source.on("changed", onChanged);
		source.on("loadingChanged", onLoadingChanged);
		source.on("loadError", onLoadingChanged);
		if (preferredPageSize != null) {
			const cur = source.pageSize?.();
			if (typeof cur === "number" && cur > 0) sourcePageSize = cur;
			source.pageSize?.(preferredPageSize);
		}
		if (groupFields.length && !serverMode()) applySourceSort();
		sync(true);
	}
	/**
	* Record a failed operation so something can render it.
	*
	* A FRESH object every time, never a reused one. `<mono-table-error>` dismisses
	* per failure rather than per message — it remembers the object it dismissed
	* and re-shows when a different one arrives — so two identical failures have to
	* be distinguishable, and object identity is the only thing that reliably is
	* (a store rejecting with the plain string `'Network error'` gives `===` values
	* for two entirely unrelated attempts).
	*/
	function captureError(raw, source) {
		const { message, status, detail } = describeError(raw, opts.errorMessages);
		ctrl.error = {
			raw,
			message,
			status,
			detail,
			source,
			at: Date.now()
		};
		if (errorMode === "clear-list" && source !== "selectAll") {
			clear();
			return;
		}
		notify();
	}
	/**
	* Drop a recorded error because an operation just succeeded.
	*
	* Called at each operation's own success point rather than from the render
	* funnels (`sync` / `renderServer`), and that is not a stylistic choice:
	* `loadGroupsServer` calls `renderServer()` immediately AFTER its catch, so a
	* clear there would wipe the error it had just captured, every time.
	*
	* Guarded, so a table that has never failed does not publish a notify on every
	* successful load for a field nobody changed.
	*/
	function clearError() {
		if (!ctrl.error) return;
		ctrl.error = null;
		notify();
	}
	async function runLoad(fn, source = "load") {
		if (!bound) return;
		try {
			await Promise.resolve(fn());
			clearError();
		} catch (err) {
			if (isCanceled(err)) return;
			captureError(err, source);
			throw err;
		}
	}
	/**
	* Whether the source pages. Client group mode pages the groups in memory, so
	* it loads everything; otherwise `dataSourceOptions.paginate` decides, and the
	* default is to page — a flat table always did.
	*/
	function sourcePaginate() {
		if (isGrouped()) return false;
		return resolvedOpts.paginate ?? true;
	}
	async function load() {
		const s = bound;
		if (s) applyBase(s);
		if (serverMode()) {
			await loadGroupsServer();
			return;
		}
		if (scrollActive()) {
			await loadScrollPage(true);
			return;
		}
		if (pageSizeAll && !isGrouped()) {
			await loadAllChunked();
			return;
		}
		if (!s) return;
		s.paginate?.(sourcePaginate());
		await runLoad(() => s.load());
	}
	async function reload() {
		bumpSummary("data");
		const s = bound;
		if (s) applyBase(s);
		if (serverMode()) {
			clearRowCaches();
			await loadGroupsServer();
			return;
		}
		if (scrollActive()) {
			await loadScrollPage(true);
			return;
		}
		if (pageSizeAll && !isGrouped()) {
			await loadAllChunked();
			return;
		}
		if (!s) return;
		s.paginate?.(sourcePaginate());
		await runLoad(() => s.reload ? s.reload() : s.load(), "reload");
	}
	function clear() {
		scrollToken++;
		suppressSync = false;
		accumulated = [];
		allRows = [];
		scrollNextPage = 0;
		scrollHasMore = false;
		vStart = vEnd = vPadTop = vPadBottom = 0;
		serverGroups = [];
		clearRowCaches();
		ctrl.items = [];
		ctrl.loading = false;
		ctrl.totalCount = 0;
		ctrl.pageIndex = 0;
		ctrl.pageCount = 1;
		ctrl.loadedCount = 0;
		ctrl.hasMore = false;
		ctrl.virtualStart = ctrl.virtualEnd = 0;
		ctrl.virtualPadTop = ctrl.virtualPadBottom = 0;
		render();
	}
	async function setPage(pageIndex) {
		if (isGrouped()) {
			groupPageIndex = Math.max(0, pageIndex);
			sync();
			if (serverMode()) await fetchVisibleRows();
			return;
		}
		const s = bound;
		if (!s) return;
		s.pageIndex?.(Math.max(0, pageIndex));
		await load();
	}
	async function setPageSize(pageSize) {
		const all = pageSize === "all";
		pageSizeAll = all;
		if (isGrouped()) {
			if (!all) groupPageSize = Math.max(1, pageSize);
			groupPageIndex = 0;
			sync();
			if (serverMode()) await fetchVisibleRows();
			return;
		}
		const s = bound;
		if (!s) return;
		if (all) {
			await loadAllChunked();
			return;
		}
		s.pageSize?.(pageSize);
		s.pageIndex?.(0);
		await load();
	}
	/**
	* Ungrouped "all": pull every row, in `chunkSize` requests, accumulate, and
	* show on one page. Works with a capped backend (e.g. 100 rows/request).
	*/
	async function loadAllChunked() {
		const s = bound;
		if (!s) {
			allRows = [];
			sync();
			return;
		}
		suppressSync = true;
		ctrl.loading = true;
		notify();
		const acc = [];
		try {
			applyBase(s);
			s.paginate?.(true);
			s.pageSize?.(chunkSize);
			let page = 0;
			for (;;) {
				s.pageIndex?.(page);
				await runLoad(() => s.load());
				const items = [...s.items?.() ?? []];
				acc.push(...items);
				const total = s.totalCount?.();
				const reachedTotal = typeof total === "number" && total >= 0 && acc.length >= total;
				if ((s.isLastPage?.() ?? items.length < chunkSize) || reachedTotal || items.length === 0) break;
				page += 1;
				if (page > 1e5) break;
			}
		} finally {
			suppressSync = false;
		}
		allRows = acc;
		ctrl.loading = bound?.isLoading?.() ?? false;
		sync();
	}
	/** Scroll modes only apply to a flat (ungrouped, non-server) grid. */
	function scrollActive() {
		return scrollMode !== "off" && !isGrouped() && !serverMode();
	}
	/** Map the accumulator (+ virtual window) onto `ctrl` and render. */
	function syncScroll() {
		const s = bound;
		const total = s?.totalCount?.();
		const hasTotal = typeof total === "number" && total >= 0;
		ctrl.grouped = false;
		ctrl.pageSizeAll = false;
		ctrl.scrollMode = scrollMode;
		ctrl.loading = s?.isLoading?.() ?? false;
		ctrl.loadedCount = accumulated.length;
		ctrl.hasMore = scrollHasMore;
		ctrl.totalCount = hasTotal ? total : accumulated.length;
		ctrl.pageIndex = 0;
		ctrl.pageSize = accumulated.length || 1;
		ctrl.pageCount = 1;
		if (scrollMode === "virtual") {
			const end = Math.min(Math.max(vStart, vEnd), accumulated.length);
			const start = Math.min(Math.max(0, vStart), end);
			ctrl.items = accumulated.slice(start, end);
			ctrl.virtualStart = start;
			ctrl.virtualEnd = end;
			ctrl.virtualPadTop = Math.max(0, vPadTop);
			ctrl.virtualPadBottom = Math.max(0, vPadBottom);
		} else {
			ctrl.items = accumulated;
			ctrl.virtualStart = 0;
			ctrl.virtualEnd = accumulated.length;
			ctrl.virtualPadTop = 0;
			ctrl.virtualPadBottom = 0;
		}
		render();
	}
	/**
	* Load one source page and append it to the accumulator. `reset` clears the
	* accumulator and starts from page 0 (a fresh query / mode enable).
	*
	* Concurrency: every entry claims a `scrollToken`. Only the holder of the newest one may
	* append, advance the page counter or release the shared load flags -- a reset (filter change,
	* search, rebind) routinely lands while a `loadNext()` is still awaiting its page, and
	* `runLoad` swallows the cancellation that would otherwise stop the loser.
	*/
	async function loadScrollPage(reset) {
		const s = bound;
		if (!s) {
			accumulated = [];
			scrollNextPage = 0;
			scrollHasMore = false;
			syncScroll();
			return;
		}
		const token = ++scrollToken;
		const mine = () => token === scrollToken;
		if (reset) {
			applyBase(s);
			accumulated = [];
			scrollNextPage = 0;
			vStart = vEnd = vPadTop = vPadBottom = 0;
			ctrl.items = [];
			ctrl.loadedCount = 0;
			ctrl.hasMore = false;
			ctrl.virtualStart = ctrl.virtualEnd = 0;
			ctrl.virtualPadTop = ctrl.virtualPadBottom = 0;
		}
		suppressSync = true;
		ctrl.loading = true;
		notify();
		try {
			s.paginate?.(true);
			const page = scrollNextPage;
			s.pageIndex?.(page);
			await runLoad(() => s.load());
			if (!mine()) return;
			const rows = [...s.items?.() ?? []];
			accumulated.push(...rows);
			const total = s.totalCount?.();
			const size = s.pageSize?.() ?? rows.length;
			const reachedTotal = typeof total === "number" && total >= 0 && accumulated.length >= total;
			const isLast = s.isLastPage?.() ?? rows.length < (size || 1);
			scrollHasMore = !(reachedTotal || isLast || rows.length === 0);
			scrollNextPage = page + 1;
		} finally {
			if (mine()) suppressSync = false;
		}
		if (!mine()) return;
		ctrl.loading = bound?.isLoading?.() ?? false;
		syncScroll();
	}
	async function setScrollPaging(mode, opts = {}) {
		const reload = opts.reload !== false;
		if (mode !== "off" && (isGrouped() || serverMode())) {
			if (typeof console !== "undefined") console.warn(`[mono-table] scroll paging ("${mode}") requires a flat (ungrouped) table; keeping standard paging.`);
			if (scrollMode !== "off") {
				scrollMode = "off";
				ctrl.scrollMode = "off";
			}
			return;
		}
		if (scrollMode === mode) return;
		scrollMode = mode;
		ctrl.scrollMode = mode;
		if (mode === "off") {
			if (!reload) {
				syncScroll();
				return;
			}
			accumulated = [];
			await load();
			return;
		}
		if (!bound) {
			syncScroll();
			return;
		}
		if (accumulated.length) {
			syncScroll();
			return;
		}
		await loadScrollPage(true);
	}
	async function loadNext() {
		if (!scrollActive() || !scrollHasMore || scrollLoading) return;
		scrollLoading = true;
		try {
			await loadScrollPage(false);
		} finally {
			scrollLoading = false;
		}
	}
	function setVirtualWindow(start, end, padTop, padBottom) {
		if (scrollMode !== "virtual") return;
		const ns = Math.max(0, Math.floor(start));
		const ne = Math.max(ns, Math.floor(end));
		const nt = Math.max(0, Math.round(padTop));
		const nb = Math.max(0, Math.round(padBottom));
		if (ns === vStart && ne === vEnd && nt === vPadTop && nb === vPadBottom) return;
		vStart = ns;
		vEnd = ne;
		vPadTop = nt;
		vPadBottom = nb;
		syncScroll();
	}
	async function setPreferredPageSize(pageSize) {
		const v = typeof pageSize === "number" && pageSize > 0 ? Math.floor(pageSize) : null;
		if (v === preferredPageSize) return;
		const wasOverriding = preferredPageSize != null;
		preferredPageSize = v;
		const s = bound;
		if (!s) return;
		if (v != null) {
			if (!wasOverriding) {
				const cur = s.pageSize?.();
				sourcePageSize = typeof cur === "number" && cur > 0 ? cur : null;
			}
			s.pageSize?.(v);
		} else {
			const base = resolvedOpts.pageSize;
			if (typeof base === "number" && base > 0) s.pageSize?.(base);
			else if (sourcePageSize != null) s.pageSize?.(sourcePageSize);
			sourcePageSize = null;
		}
		s.pageIndex?.(0);
		await load();
	}
	/**
	* Rows a `*` pattern resolves against. The full backing array when the source
	* has one (an in-memory source exposes `data()`), else the loaded page — which
	* is all a remote source can offer, and is enough to read the shape.
	*/
	function searchSampleRows() {
		return bound?.data?.() ?? ctrl.items ?? [];
	}
	/**
	* searchExpr as a list of entries — plain column names, `{ field, custom }` and
	* `*` patterns resolved against the data. `textOnly` for a remote source, whose
	* `$filter` can only `contains` a string column.
	*/
	function searchEntries() {
		return resolveSearchEntries(effectiveSearchFields(), {
			rows: searchSampleRows(),
			textOnly: hasStore()
		});
	}
	/**
	* The entries an unbound term fans out over, or the single entry a
	* column-bound term targets. A bound field with no `searchExpr` entry keeps the
	* old behaviour and is treated as a plain column.
	*/
	function entriesForTerm(field, all) {
		if (!field) return all;
		return [searchEntryFor(searchFields(), field) ?? field];
	}
	/** Whether a remote search must bypass devextreme folding (a path/wildcard column). */
	function searchIsPath() {
		return hasStore() && plainSearchColumns(searchFields()).some(isPath);
	}
	/** Current live search string, held when the controller owns the search filter (path mode). */
	let searchTerm = null;
	/**
	* Remote OData search filter expr, built by the controller when a searchExpr
	* column is a path/wildcard (devextreme's own search folding can't emit `Job/Name`
	* navigation or `Nav/any(...)` lambdas). Returns `null` when folding handles it.
	*/
	/** Join expressions with `and` / `or`, returning the lone one unwrapped. */
	function joinExprs(parts, join) {
		const kept = parts.filter((p) => p != null);
		if (!kept.length) return null;
		if (kept.length === 1) return kept[0];
		const out = [];
		kept.forEach((p, i) => {
			if (i) out.push(join);
			out.push(p);
		});
		return out;
	}
	/**
	* Group the live terms by `field` — a term with no field covers every
	* `searchExpr` column. Preserves first-seen order so the emitted filter is
	* stable and diffable.
	*/
	function groupedSearchTerms() {
		const order = [];
		const byField = /* @__PURE__ */ new Map();
		for (const t of ctrl.searchTerms) {
			const v = String(t?.value ?? "");
			if (!v) continue;
			const key = t.field || void 0;
			if (!byField.has(key)) {
				byField.set(key, []);
				order.push(key);
			}
			byField.get(key).push(v);
		}
		return order.map((field) => ({
			field,
			values: byField.get(field)
		}));
	}
	/**
	* Remote OData search filter built by the controller rather than devextreme's
	* own `searchValue` folding. Used when folding CAN'T express the search:
	*  - a `searchExpr` column is a path/wildcard (`Job/Name`, `Nav/any(...)`), or
	*  - there is more than one term, or any term is bound to a single column —
	*    devextreme's `searchValue` holds exactly one string across one column set.
	*
	* Shape: OR within a field, AND across fields.
	*/
	function remoteSearchExpr() {
		const groups = groupedSearchTerms();
		if (!groups.length || !controllerOwnsSearch()) return null;
		const op = opts.searchOperation ?? "contains";
		const all = searchEntries();
		return joinExprs(groups.map((g) => {
			const entries = entriesForTerm(g.field, all);
			const clauses = [];
			for (const value of g.values) {
				const expr = joinExprs(entries.map((e) => typeof e === "string" ? toODataClause(e, op, value) : customRemoteClause(e, value, op)).filter((c) => c != null), "or");
				if (expr != null) clauses.push(expr);
			}
			return joinExprs(clauses, "or");
		}), "and");
	}
	/**
	* Whether the controller (not devextreme) must build the search filter. One
	* plain unbound term over plain columns can still ride devextreme's folding.
	*/
	function controllerOwnsSearch() {
		const groups = groupedSearchTerms();
		if (!groups.length) return false;
		if (!hasStore()) return false;
		if (searchIsPath()) return true;
		if (hasCustomSearch(effectiveSearchFields()) || hasWildcardSearch(effectiveSearchFields())) return true;
		return !(groups.length === 1 && groups[0].values.length === 1 && !groups[0].field);
	}
	/** Client-side equivalent: OR within a field, AND across fields. */
	function searchPredicate() {
		const groups = groupedSearchTerms();
		if (!groups.length) return null;
		const op = opts.searchOperation ?? "contains";
		const matches = (row, col, needle) => {
			const raw = isPath(col) ? getFieldValue(row, col) : row?.[col];
			return (Array.isArray(raw) ? raw : [raw]).some((v) => {
				const s = String(v ?? "").toLowerCase();
				const n = needle.toLowerCase();
				if (op === "startswith") return s.startsWith(n);
				if (op === "endswith") return s.endsWith(n);
				if (op === "=" || op === "equals") return s === n;
				return s.includes(n);
			});
		};
		const all = searchEntries();
		const perGroup = groups.map((g) => entriesForTerm(g.field, all));
		return (row) => groups.every((g, i) => {
			const entries = perGroup[i];
			if (!entries.length) return true;
			return g.values.some((needle) => entries.some((e) => {
				if (typeof e === "string") return matches(row, e, needle);
				const pred = customPredicate(e, needle, op);
				return pred ? pred(row) : false;
			}));
		});
	}
	/**
	* Whether an ARRAY source needs the controller's predicate. One plain unbound
	* term can stay on the source's own `searchValue`/`searchExpr` — which matters
	* when `searchExpr` was configured on `monoArraySource` and not on the grid.
	*/
	function controllerOwnsArraySearch() {
		const groups = groupedSearchTerms();
		if (!groups.length) return false;
		if (hasCustomSearch(effectiveSearchFields()) || hasWildcardSearch(effectiveSearchFields())) return true;
		if (groups.length === 1 && groups[0].values.length === 1 && !groups[0].field) return false;
		return true;
	}
	/** Single-term shorthand — the classic search box. */
	async function setSearch(value) {
		await setSearchTerms(value ? [{ value }] : []);
	}
	/**
	* Replace the searched fields. `undefined`/`null` drops the override so the
	* `searchExpr` / `search-value` option takes over again.
	*
	* Only re-runs the query when a search is actually live — changing the fields
	* with an empty box has nothing to re-filter, and a needless `load()` would
	* make `<mono-table-search>` refetch on every connect.
	*/
	async function setSearchExpr(expr) {
		searchFieldsOverride = expr == null ? void 0 : mergeSearchFields({ searchExpr: expr });
		if (!ctrl.searchTerms.length) {
			notify();
			return;
		}
		await setSearchTerms(ctrl.searchTerms);
	}
	async function setSearchTerms(terms) {
		ctrl.searchTerms = (terms ?? []).filter((t) => t && String(t.value ?? "") !== "");
		groupPageIndex = 0;
		bumpSummary("search");
		if (serverMode()) {
			searchValue = ctrl.searchTerms.map((t) => t.value).join(" ") || null;
			notify();
			await loadGroupsServer();
			return;
		}
		const s = bound;
		if (!s) return;
		searchTerm = ctrl.searchTerms[0]?.value ?? null;
		if (!hasStore()) {
			if (controllerOwnsArraySearch()) s.searchValue?.(null);
			else {
				s.searchOperation?.(opts.searchOperation ?? "contains");
				if (searchFieldsConfigured()) s.searchExpr?.(plainSearchColumns(searchFields()));
				s.searchValue?.(searchTerm);
			}
			applyFilter();
		} else if (controllerOwnsSearch()) {
			s.searchValue?.(null);
			applyFilter();
		} else {
			s.searchOperation?.(opts.searchOperation ?? "contains");
			if (searchFieldsConfigured()) s.searchExpr?.(plainSearchColumns(searchFields()));
			s.searchValue?.(searchTerm);
			applyFilter();
		}
		s.pageIndex?.(0);
		notify();
		await load();
	}
	/**
	* The grid's explicit filter — ONE layer, not a replacement.
	*
	* This is what the slotted filter builder writes, and it used to be a bare
	* `s.filter(x)`: it replaced the consumer's own source filter, the column
	* filters and the search in one go, and the next keystroke then replaced IT
	* with the search alone. It is now composed like everything else — under the
	* base, beside the columns and the search — and `null` clears only this layer.
	* That is also why it is NOT the adopted external base: the builder's *Clear*
	* would otherwise wipe the scope the consumer set on the source.
	*/
	async function setFilter(filter) {
		if (!bound) return;
		bumpSummary("search");
		explicitFilter = hasStore() ? filter ?? null : compileOrPredicate(filter);
		applyFilter();
		groupPageIndex = 0;
		await load();
	}
	const columnFilters = /* @__PURE__ */ new Map();
	/** The combine gesture, remembered — see `MonoSetColumnFilterOptions.sticky`. */
	let filterCombining = false;
	/** Whether the bound source is a remote DataSource (has a devextreme store). */
	function hasStore() {
		return typeof bound?.store === "function" && !!bound.store();
	}
	/**
	* OR-join a column's value clauses into a devextreme filter expression (path-aware).
	*
	* A value is normally a plain equality; a `{ from, to }` range (what the DATE
	* filter stores) becomes `[[f,'>=',from],'and',[f,'<',to]]` — half-open, so
	* a "March" range never touches April 1st 00:00:00.
	*/
	function orClauses(field, values) {
		const clauses = values.map((v) => {
			if (isDateRange(v)) {
				const ge = toODataClause(field, ">=", v.from);
				const lt = toODataClause(field, "<", v.to);
				return ge && lt ? [
					ge,
					"and",
					lt
				] : null;
			}
			return toODataClause(field, "=", v);
		}).filter((c) => c != null);
		if (!clauses.length) return null;
		if (clauses.length === 1) return clauses[0];
		const out = [];
		clauses.forEach((c, i) => {
			if (i) out.push("or");
			out.push(c);
		});
		return out;
	}
	/**
	* Rebuild the grid's OWN filter layers from the column filters and the
	* controller-owned search — `columnExpr` (columns only, what a server-group
	* source gets) and `gridExpr` (columns AND search, what the source gets).
	*
	* Only builds; it writes nothing. Until this was split out, the write was here
	* too, and it wrote THIS expression alone — so a filter the consumer had put on
	* the source was gone on the first search keystroke and "restored" to nothing
	* on clear. The write now goes through `writeFilter()`, which composes these on
	* top of the base.
	*/
	/** The active column filters, optionally leaving one column out (its own panel). */
	function activeColumnFilters(except) {
		return [...columnFilters.entries()].filter(([f, v]) => v.length && f !== except);
	}
	/** Remote: the column filters as ONE devextreme expression — AND across columns, OR within. */
	function columnFilterExpr(except) {
		const cols = activeColumnFilters(except).map(([f, v]) => orClauses(f, v)).filter((c) => c != null);
		if (!cols.length) return null;
		if (cols.length === 1) return cols[0];
		const out = [];
		cols.forEach((c, i) => {
			if (i) out.push("and");
			out.push(c);
		});
		return out;
	}
	/**
	* Array / client: the same as a predicate. Path fields resolve nested/wildcard
	* values (wildcard = match any element).
	*/
	function columnFilterPredicate(except) {
		const active = activeColumnFilters(except);
		if (!active.length) return null;
		return (row) => active.every(([f, vals]) => {
			const raw = isPath(f) ? getFieldValue(row, f) : row?.[f];
			return (Array.isArray(raw) ? raw : [raw]).some((rv) => vals.some((v) => {
				if (isDateRange(v)) {
					const d = parseDateValue(rv);
					if (!d) return false;
					return inRange(d, {
						from: v.from instanceof Date ? v.from : new Date(v.from),
						to: v.to instanceof Date ? v.to : new Date(v.to)
					});
				}
				return String(rv) === String(v);
			}));
		});
	}
	function rebuildGridExpr() {
		if (hasStore()) {
			const expr = columnFilterExpr();
			columnExpr = expr;
			gridExpr = andFilters(expr, remoteSearchExpr());
		} else {
			const colPred = columnFilterPredicate();
			const sPred = controllerOwnsArraySearch() ? searchPredicate() : null;
			columnExpr = colPred;
			gridExpr = andPredicates(colPred, sPred);
		}
	}
	/**
	* A grid-driven filter change: search, column filter, `setFilter`. Adopts
	* anything the consumer changed on the source in the meantime, rebuilds the
	* grid's layers, writes the composed filter and goes back to page 0.
	*/
	function applyFilter() {
		const s = bound;
		if (!s) return;
		syncExternalFilter(s);
		rebuildGridExpr();
		writeFilter(s);
		s.pageIndex?.(0);
	}
	async function setColumnFilter(field, values, options) {
		if (!field) return;
		const multi = options?.multi === true;
		if (!multi) columnFilters.clear();
		if (!values || !values.length) columnFilters.delete(field);
		else columnFilters.set(field, [...values]);
		filterCombining = columnFilters.size > 0 && multi && (options?.sticky === true || filterCombining);
		groupPageIndex = 0;
		bumpSummary("search");
		notify();
		applyFilter();
		await load();
	}
	function columnFilter(field) {
		return [...columnFilters.get(field) ?? []];
	}
	function columnFilterCombining() {
		return filterCombining;
	}
	function filteredColumns() {
		return [...columnFilters.entries()].filter(([, v]) => v.length).map(([f]) => f);
	}
	let dsOptionsSource = opts.dataSourceOptions;
	let odataOptionsSource = opts.odataOptions;
	/** The merged, normalised options as of the last resolve. */
	let resolvedOpts = {};
	/** Change key of `resolvedOpts` — `null` until the first resolve, which always counts. */
	let resolvedKey = null;
	/** A function-valued `filter` cannot go through the key; compared by reference instead. */
	let optionsFilterRef = void 0;
	let optionsFilter = null;
	let optionsSort = [];
	/** Knobs `applyBaseOptions` has written, so a knob that DISAPPEARS is cleared, not left behind. */
	const appliedKnobs = /* @__PURE__ */ new Set();
	let externalBase = null;
	let explicitFilter = null;
	let columnExpr = null;
	let gridExpr = null;
	/** What the source HELD after the grid's last write (read back — a source may normalise). */
	let lastWrittenFilter = null;
	/** What the grid last composed and handed to the source. */
	let lastComposed = void 0;
	let composeMemo = null;
	let externalSort = [];
	let lastWrittenSort = null;
	let rawFilterWarned = false;
	/** Array-source filter layer: a predicate as given, an array compiled, a raw OData string dropped. */
	function compileOrPredicate(filter) {
		if (filter == null) return null;
		if (typeof filter === "function") return filter;
		if (Array.isArray(filter) && filter.length === 1 && typeof filter[0] === "string") {
			if (!rawFilterWarned) {
				rawFilterWarned = true;
				console.warn("[monoDataGrid] a raw OData $filter string cannot filter an array source — ignored.");
			}
			return null;
		}
		return compileFilterPredicate(filter);
	}
	/**
	* Re-read the two option bags. Returns whether anything changed since the last
	* resolve — the getters hand back a fresh object every time, so the comparison
	* is by content, not identity.
	*/
	function resolveDsOptions() {
		const merged = resolveDataSourceOptions(dsOptionsSource, odataOptionsSource);
		const fnFilter = typeof merged.filter === "function" ? merged.filter : void 0;
		const key = dataSourceOptionsKey(merged);
		if (key === resolvedKey && fnFilter === optionsFilterRef) return false;
		resolvedKey = key;
		optionsFilterRef = fnFilter;
		resolvedOpts = merged;
		optionsFilter = hasStore() ? merged.filter ?? null : compileOrPredicate(merged.filter);
		optionsSort = normalizeSortList(merged.sort);
		return true;
	}
	/**
	* Adopt a filter the consumer set on the source directly: anything the source
	* holds that is not what the grid last put there. One comparison is enough
	* because `writeFilter` records what the source HOLDS after a write, not what
	* was passed — so a source that ignores writes (a getter-only fake) reads back
	* as its own last write and is never adopted, and a source that normalises
	* compares against its normalised value.
	*/
	function syncExternalFilter(s) {
		if (typeof s.filter !== "function") return false;
		const live = s.filter() ?? null;
		if (live === lastWrittenFilter) return false;
		externalBase = live;
		return true;
	}
	/** The same for `ds.sort(...)`. */
	function syncExternalSort(s) {
		if (typeof s.sort !== "function") return false;
		const live = s.sort() ?? null;
		if (live === lastWrittenSort) return false;
		lastWrittenSort = live;
		externalSort = normalizeSortList(live);
		return true;
	}
	/** options ∧ external ∧ explicit — everything under the grid's own layers. */
	function baseFilter() {
		return hasStore() ? andFilters(andFilters(optionsFilter, externalBase), explicitFilter) : andPredicates(optionsFilter, externalBase, explicitFilter);
	}
	/** What a server-group source gets: the base plus the column filters, NOT the search (it folds that itself). */
	function baseFilterWithColumns() {
		return hasStore() ? andFilters(baseFilter(), columnExpr) : andPredicates(baseFilter(), columnExpr);
	}
	function composeFilter() {
		const m = composeMemo;
		if (m && m.o === optionsFilter && m.e === externalBase && m.x === explicitFilter && m.g === gridExpr) return m.out;
		const out = hasStore() ? andFilters(baseFilter(), gridExpr) : andPredicates(baseFilter(), gridExpr);
		composeMemo = {
			o: optionsFilter,
			e: externalBase,
			x: explicitFilter,
			g: gridExpr,
			out
		};
		return out;
	}
	/** Write the composed filter — only when it is not what the source already holds. */
	function writeFilter(s) {
		if (typeof s.filter !== "function") return false;
		const next = composeFilter();
		if (next === lastComposed && (s.filter() ?? null) === lastWrittenFilter) return false;
		s.filter(next);
		lastComposed = next;
		lastWrittenFilter = s.filter() ?? null;
		return true;
	}
	/**
	* The sort actually sent: the user's column sort first (it wins), then the
	* options' sort, then whatever the consumer set on the source — later entries
	* only for selectors not already sorted, so they act as tiebreakers. Clearing
	* the column sort therefore falls back to the base instead of to nothing.
	*/
	function mergedSort() {
		let keys = effectiveSort() ?? [];
		if (hasStore()) keys = keys.map((s) => {
			if (!isPath(s.selector)) return s;
			const selector = toODataSelector(s.selector);
			if (selector) return {
				...s,
				selector
			};
			console.warn(`[monoDataGrid] sort: path "${s.selector}" is not an OData selector — skipped.`);
			return null;
		}).filter((s) => !!s);
		const out = [...keys];
		for (const e of [...optionsSort, ...externalSort]) if (!out.some((k) => k.selector === e.selector)) out.push({
			selector: e.selector,
			desc: !!e.desc
		});
		return out.length ? out : null;
	}
	/** Push the non-filter knobs of `resolvedOpts` onto the source. Only called when they changed. */
	function applyBaseOptions(s) {
		const o = resolvedOpts;
		const knob = (name, present, write) => {
			if (present) {
				write(false);
				appliedKnobs.add(name);
			} else if (appliedKnobs.has(name)) {
				write(true);
				appliedKnobs.delete(name);
			}
		};
		knob("select", o.select !== void 0, (clear) => s.select?.(clear ? null : toList(o.select) ?? null));
		knob("requireTotalCount", typeof o.requireTotalCount === "boolean", (clear) => s.requireTotalCount?.(clear ? false : !!o.requireTotalCount));
		if (!searchFieldsConfigured()) {
			knob("searchExpr", o.searchExpr !== void 0, (clear) => s.searchExpr?.(clear ? null : o.searchExpr));
			knob("searchOperation", typeof o.searchOperation === "string", (clear) => s.searchOperation?.(clear ? "contains" : String(o.searchOperation)));
		}
		if (preferredPageSize == null && typeof o.pageSize === "number" && o.pageSize > 0) s.pageSize?.(o.pageSize);
		const lo = typeof s.loadOptions === "function" ? s.loadOptions() : null;
		if (lo && typeof lo === "object") {
			const extras = extraLoadOptions(o);
			for (const k of Object.keys(extras)) knob(`lo:${k}`, extras[k] !== void 0, (clear) => {
				if (clear) delete lo[k];
				else lo[k] = extras[k];
			});
			for (const name of [...appliedKnobs]) if (name.startsWith("lo:") && !(name.slice(3) in extras)) {
				delete lo[name.slice(3)];
				appliedKnobs.delete(name);
			}
		}
		if (optionsSort.length || appliedKnobs.has("sort")) {
			applySourceSort();
			if (optionsSort.length) appliedKnobs.add("sort");
			else appliedKnobs.delete("sort");
		}
	}
	/**
	* The one call every load funnel makes first: re-read the options, adopt what
	* the consumer changed on the source, push the knobs, write the composed
	* filter. Never loads — the funnel does that — and writes nothing when nothing
	* moved, so a plain `setPage(n)` costs no filter write and keeps its page.
	*/
	function applyBase(s) {
		const optChanged = resolveDsOptions();
		const extChanged = syncExternalFilter(s);
		const sortAdopted = syncExternalSort(s);
		if (optChanged) applyBaseOptions(s);
		else if (sortAdopted && (ctrl.sorts.length || optionsSort.length)) applySourceSort();
		if (optChanged || extChanged) {
			bumpSummary("search");
			groupPageIndex = 0;
		}
		writeFilter(s);
		return optChanged || extChanged;
	}
	/** The `MonoServerGroupCtx` for the current query. */
	function serverCtx() {
		const loadOptions = {};
		if (resolvedOpts.expand !== void 0) loadOptions.expand = resolvedOpts.expand;
		if (resolvedOpts.customQueryParams !== void 0) loadOptions.customQueryParams = resolvedOpts.customQueryParams;
		const filter = baseFilterWithColumns();
		const select = opts.select ?? toList(resolvedOpts.select);
		return {
			sort: mergedSort(),
			...filter != null ? { filter } : {},
			...select ? { select } : {},
			...Object.keys(loadOptions).length ? { loadOptions } : {}
		};
	}
	async function setDataSourceOptions(next) {
		dsOptionsSource = next;
		await refresh();
	}
	async function setOdataOptions(next) {
		odataOptionsSource = next;
		await refresh();
	}
	async function refresh() {
		const s = bound;
		if (!s) return;
		if (applyBase(s)) s.pageIndex?.(0);
		await load();
	}
	function resolvedDataSourceOptions() {
		return resolvedOpts;
	}
	/** The panel's order: nulls first, numeric before lexical. Shared by both distinct paths. */
	function sortColumnValues(values) {
		return values.sort((a, b) => {
			const av = a.value, bv = b.value;
			if (av == null) return bv == null ? 0 : -1;
			if (bv == null) return 1;
			const an = Number(av), bn = Number(bv);
			if (!Number.isNaN(an) && !Number.isNaN(bn)) return an - bn;
			return String(av).localeCompare(String(bv));
		});
	}
	/**
	* Distinct values as ONE `$apply=groupby((field),aggregate($count as count))`
	* request through the store, or `null` when that is not on.
	*
	* `null` — not `[]` — is the fallback signal, and it comes from four places:
	* the path switched off (`serverApply: false`, or a backend that already
	* rejected an `$apply` — the gate remembers), a wildcard path (there is no
	* selector to group by), a store that cannot carry an `$apply` at all (a
	* CustomStore — `loadApply` sends nothing) or a request that failed, and a
	* response that is not grouped (a server that ignored the clause hands back
	* plain entities, which have no `count`). An EMPTY grouped result is a real
	* answer (nothing in scope) and is returned as such.
	*
	* The request carries `$apply` and nothing else: `$select` beside `$apply` is
	* rejected by most servers, a sibling `$filter` would be applied a second time
	* (the base folds INSIDE the clause), and `$top` only if the column asked for
	* a cap. `loadApply` puts the clause INTO the url (`urlOverride` —
	* `customQueryParams` is quoted as a literal by devextreme and becomes a
	* function call on v4), so this rides the store's URL, `beforeSend` and auth
	* exactly as every other request does.
	*/
	async function distinctViaApply(store, field, options) {
		if (applyGate.skip) return null;
		if (parseFieldPath(field).hasWildcard) return null;
		const selector = isPath(field) ? toODataSelector(field) : field;
		if (!selector) return null;
		const apply = `groupby((${selector}),aggregate($count as count))`;
		const odataFilter = options?.filter != null ? arrayToODataString(options.filter) : "";
		const clause = odataFilter ? `filter(${odataFilter})/${apply}` : apply;
		const top = typeof options?.take === "number" && options.take >= 0 ? options.take : void 0;
		let rows;
		try {
			rows = await loadApply(store, clause, { top });
		} catch (err) {
			applyGate.reject(err);
			return null;
		}
		if (!rows) return null;
		if (!rows.length) return [];
		const first = rows[0];
		if (!first || typeof first !== "object" || typeof first.count !== "number") return null;
		if (!isRolledUp(rows, [field, "count"])) return null;
		const path = isPath(field);
		return sortColumnValues(rows.map((r) => ({
			value: path ? getFieldValue(r, field) : r[field],
			count: Number(r.count) || 0
		})));
	}
	/** Count occurrences of `field` across `rows` into a sorted `{value,count}[]`. */
	function distinctFromRows(rows, field) {
		const counts = /* @__PURE__ */ new Map();
		const bump = (v) => {
			counts.set(v, (counts.get(v) ?? 0) + 1);
		};
		const path = isPath(field);
		for (const r of rows) if (path) {
			const v = getFieldValue(r, field);
			if (Array.isArray(v)) v.forEach(bump);
			else bump(v);
		} else bump(r?.[field]);
		return sortColumnValues([...counts.entries()].map(([value, count]) => ({
			value,
			count
		})));
	}
	async function distinctValues(field, options) {
		if (!field) return [];
		resolveDsOptions();
		if (bound) syncExternalFilter(bound);
		const base = baseFilter();
		const cascade = opts.headerFilterCascade !== false;
		let filter;
		if (hasStore()) {
			filter = andFilters(base, options?.filter ?? null);
			if (cascade) {
				const search = remoteSearchExpr() ?? searchFilterOf(bound) ?? null;
				filter = andFilters(filter, andFilters(columnFilterExpr(field), search));
			}
		} else {
			filter = andPredicates(base, typeof options?.filter === "function" ? options.filter : null);
			if (cascade) filter = andPredicates(andPredicates(filter, columnFilterPredicate(field)), searchPredicate());
		}
		const scoped = filter == null ? options : {
			...options ?? {},
			filter
		};
		if (typeof opts.distinctValues === "function") {
			const filter = hasStore() ? scoped?.filter ?? null : null;
			const odataFilter = filter != null ? arrayToODataString(filter) : "";
			const apply = `groupby((${isPath(field) ? toODataSelector(field) ?? field : field}),aggregate($count as count))`;
			const ctx = {
				filter,
				odataFilter,
				apply,
				applyWithFilter: odataFilter ? `filter(${odataFilter})/${apply}` : apply,
				source: bound
			};
			return (await opts.distinctValues(field, scoped, ctx) ?? []).map((r) => {
				const o = r;
				return o && typeof o === "object" && "value" in o ? {
					value: o.value,
					count: Number(o.count ?? 0) || 0
				} : {
					value: r,
					count: 0
				};
			});
		}
		const s = bound;
		if (!hasStore()) {
			let rows = s?.data?.() ?? ctrl.items;
			if (typeof scoped?.filter === "function") rows = rows.filter(scoped.filter);
			if (typeof scoped?.take === "number" && scoped.take >= 0) rows = rows.slice(0, scoped.take);
			return distinctFromRows(rows, field);
		}
		const store = s.store();
		const grouped = await distinctViaApply(store, field, scoped);
		if (grouped) return grouped;
		const loadOpts = {};
		if (!isPath(field)) loadOpts.select = [field];
		for (const [key, value] of Object.entries(scoped ?? {})) if (value == null) delete loadOpts[key];
		else loadOpts[key] = value;
		return distinctFromRows(storeRows(await store.load(loadOpts)), field);
	}
	async function setData(next) {
		const s = bound;
		if (typeof s?.setData !== "function") return;
		bumpSummary("data");
		await runLoad(() => s.setData(next));
		if (scrollActive()) await loadScrollPage(true);
	}
	/** The combine gesture, remembered — see `MonoSetSortOptions.sticky`. */
	let sortCombineMode = false;
	function sortCombining() {
		return sortCombineMode;
	}
	/** This column's direction, or null when it isn't part of the sort. */
	function sortOf(field) {
		return ctrl.sorts.find((s) => s.field === field)?.order ?? null;
	}
	/** 1-based precedence in `sorts`; `0` when the column isn't sorted. */
	function sortIndex(field) {
		return ctrl.sorts.findIndex((s) => s.field === field) + 1;
	}
	/**
	* The 1-based precedence a column DECLARED via `sort.index`, if any. Central
	* `props.th` config wins over the element's own `:sort.prop`, matching how every
	* other key resolves.
	*/
	function declaredSortIndex(field) {
		const fromProps = (elementProps.th ?? []).find((c) => c?.field === field)?.sort;
		if (typeof fromProps === "object" && typeof fromProps?.index === "number") return fromProps.index;
		for (const el of columnEls) if (el.field === field && typeof el.sort === "object" && typeof el.sort?.index === "number") return el.sort.index;
	}
	/**
	* Re-order `sorts` so any column declaring `sort.index` sits at that slot.
	* Unindexed columns keep their click order and fill the remaining slots — the
	* comparator falls back to the current position, so the sort is stable.
	* No-ops (and allocates nothing) when no column declares an index.
	*/
	function applyDeclaredSortOrder() {
		if (ctrl.sorts.length < 2) return;
		const marked = ctrl.sorts.map((s, i) => ({
			s,
			i,
			hint: declaredSortIndex(s.field)
		}));
		if (!marked.some((m) => typeof m.hint === "number")) return;
		marked.sort((a, b) => {
			const ah = a.hint ?? Number.POSITIVE_INFINITY;
			const bh = b.hint ?? Number.POSITIVE_INFINITY;
			return ah === bh ? a.i - b.i : ah - bh;
		});
		ctrl.sorts = marked.map((m) => m.s);
	}
	/** Keep the single-value mirrors pointing at the primary key. */
	function syncPrimarySort() {
		ctrl.sortField = ctrl.sorts[0]?.field ?? null;
		ctrl.sortOrder = ctrl.sorts[0]?.order ?? null;
	}
	function clearSort() {
		return setSort(null);
	}
	async function setSort(field, order, options) {
		if (!field) {
			ctrl.sorts = [];
			sortCombineMode = false;
		} else {
			const multi = options?.multi === true;
			const current = sortOf(field);
			const next = order !== void 0 ? order : current === "asc" ? "desc" : current === "desc" ? null : "asc";
			if (!next) ctrl.sorts = multi ? ctrl.sorts.filter((s) => s.field !== field) : [];
			else if (multi) ctrl.sorts = ctrl.sorts.findIndex((s) => s.field === field) >= 0 ? ctrl.sorts.map((s) => s.field === field ? {
				field,
				order: next
			} : s) : [...ctrl.sorts, {
				field,
				order: next
			}];
			else ctrl.sorts = [{
				field,
				order: next
			}];
			sortCombineMode = ctrl.sorts.length > 0 && multi && (options?.sticky === true || sortCombineMode);
		}
		applyDeclaredSortOrder();
		syncPrimarySort();
		notify();
		groupPageIndex = 0;
		if (serverMode()) {
			await loadGroupsServer();
			return;
		}
		const s = bound;
		if (!s) return;
		applySourceSort();
		s.pageIndex?.(0);
		await load();
	}
	async function setGroup(group) {
		groupFields = toFields(group);
		ctrl.grouped = groupFields.length > 0;
		collapsed.clear();
		groupRowPaging.clear();
		groupPageIndex = 0;
		if (serverMode()) {
			clearRowCaches();
			await loadGroupsServer();
			return;
		}
		const s = bound;
		if (!s) {
			sync();
			return;
		}
		applySourceSort();
		s.pageIndex?.(0);
		await load();
	}
	function toggleGroup(target) {
		const path = typeof target === "string" ? target : target?.path;
		if (!path) return;
		if (collapsed.has(path)) collapsed.delete(path);
		else collapsed.add(path);
		sync();
		if (serverMode()) fetchVisibleRows();
	}
	function isGroupCollapsed(path) {
		return collapsed.has(path);
	}
	function expandAllGroups() {
		if (!collapsed.size) return;
		collapsed.clear();
		sync();
		if (serverMode()) fetchVisibleRows();
	}
	function collapseAllGroups() {
		if (!groupFields.length) return;
		if (serverMode()) {
			for (const meta of serverGroups) collapsed.add(String(meta.key));
			sync();
			return;
		}
		const tree = buildGroups(flattenLeaves(bound ? [...bound.items?.() ?? []] : []), groupFields);
		for (const path of collectGroupPaths(tree)) collapsed.add(path);
		sync();
	}
	function setGroupPageSize(path, pageSize) {
		if (!path) return;
		const size = Math.max(1, Math.floor(pageSize) || 1);
		const cur = groupRowPaging.get(path);
		if (cur && cur.pageSize === size) return;
		groupRowPaging.set(path, {
			pageIndex: 0,
			pageSize: size
		});
		if (serverMode()) {
			groupRowsKey.delete(path);
			sync();
			fetchVisibleRows();
			return;
		}
		sync();
	}
	function setGroupPage(path, pageIndex) {
		if (!path) return;
		const pageSize = groupRowPaging.get(path)?.pageSize ?? (defaultGroupRowPageSize || groupPageSize);
		groupRowPaging.set(path, {
			pageIndex: Math.max(0, pageIndex),
			pageSize
		});
		if (serverMode()) {
			groupRowsKey.delete(path);
			sync();
			fetchVisibleRows();
			return;
		}
		sync();
	}
	function clearGroupPaging(path) {
		if (groupRowPaging.delete(path)) if (serverMode()) {
			groupRowsKey.delete(path);
			sync();
			fetchVisibleRows();
		} else sync();
	}
	function groupPageInfo(path) {
		if (pageSizeAll) {
			const node = pathIndex.get(path);
			const total = serverMode() ? serverGroups.find((g) => String(g.key) === path)?.count ?? 0 : node?.items.length ?? 0;
			return {
				pageIndex: 0,
				pageCount: 1,
				pageSize: Math.max(1, total),
				total
			};
		}
		if (serverMode()) {
			const total = serverGroups.find((g) => String(g.key) === path)?.count ?? 0;
			const pg = groupRowPagingFor(path);
			const pageSize = Math.max(1, pg?.pageSize ?? (defaultGroupRowPageSize || total || 1));
			const pageCount = Math.max(1, Math.ceil(total / pageSize));
			return {
				pageIndex: Math.min(Math.max(0, pg?.pageIndex ?? 0), pageCount - 1),
				pageCount,
				pageSize,
				total
			};
		}
		const node = pathIndex.get(path);
		const total = node ? node.items.length : 0;
		const pg = groupRowPagingFor(path);
		const pageSize = Math.max(1, pg?.pageSize ?? total ?? 1);
		const pageCount = Math.max(1, Math.ceil(total / pageSize));
		return {
			pageIndex: Math.min(Math.max(0, pg?.pageIndex ?? 0), pageCount - 1),
			pageCount,
			pageSize,
			total
		};
	}
	function groupNode(path) {
		return pathIndex.get(path);
	}
	/**
	* Every row matching the current query, without disturbing what's on screen.
	*
	* The chunked read itself lives in `readAllRows` (shared with the report
	* engine's `data` resolver), which also reconstructs the DataSource's active
	* **search** — `searchValue` is a DataSource-level option the store knows
	* nothing about, so reading the store directly would otherwise hand back rows
	* the user filtered away.
	*
	* `suppressSync` wraps the call because an array-backed source has to be
	* re-paged to be read: the detour fires `changed`, and subscribers must not
	* see the intermediate full-list state.
	*/
	async function getData() {
		const s = bound;
		if (!s) return [];
		suppressSync = true;
		try {
			return await readAllRows(s, {
				chunkSize,
				select: opts.select ?? toList(resolvedOpts.select),
				sort: mergedSort()
			});
		} finally {
			suppressSync = false;
		}
	}
	/**
	* Group `rows` (or everything {@link getData} returns) by the grid's own
	* group fields. Named `buildGroupTree` internally so it doesn't shadow the
	* imported `buildGroups` helper that `syncGrouped` and friends rely on.
	*/
	async function buildGroupTree(rows) {
		if (!groupFields.length) return [];
		return buildGroups(rows ?? await getData(), groupFields);
	}
	async function importSheet(options) {
		const { importTable } = await import("./import.js");
		return importTable(options, {
			getData,
			rowKeyOf,
			serverKeyOf: (row) => row?.[keyExpr] ?? rowKeyOf(row, -1),
			stageImported: (changes) => {
				for (const change of changes) {
					const patch = pending.get(change.rowKey) ?? {};
					Object.assign(patch, change.patch);
					pending.set(change.rowKey, patch);
					markImported(change.rowKey, Object.keys(change.patch));
				}
				notify();
			}
		});
	}
	async function exportReport(options) {
		const { exportTable } = await import("./export.js");
		return exportTable(options);
	}
	function subscribe(cb) {
		return notifier.subscribe(cb);
	}
	function dispose() {
		detach();
		removeOutsideExit();
		unbindRowTrigger();
		clearRowCaches();
		formOps.length = 0;
		formHandle = null;
		ctrl.filterBuilder?.dispose();
		notifier.clear();
	}
	if (ds) bind(ds);
	return ctrl;
}
//#endregion
export { seedFromRanges as a, DEFAULT_ERROR_MESSAGES as c, normalizeError as d, resolveErrorMessages as f, minimize as i, describeError as l, buildDateTree as n, setAllChecked as o, setErrorMessages as p, checkState as r, setChecked as s, monoDataGrid as t, errorStatus as u };
