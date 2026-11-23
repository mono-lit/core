import { a as parseFieldPath, c as toODataClause, l as toODataSelector, n as isPath, o as projectFields, r as mergePatch, s as setFieldValue, t as getFieldValue } from "./field-path-DK2VBWHl.js";
import { a as buildGroups, c as isGroupNode, i as searchFilterOf, o as collectGroupPaths, r as readAllRows, s as flattenLeaves } from "./data-source-read-B49mOn5M.js";
import { i as joinFilters, n as andPredicates, r as compileFilterPredicate, t as andFilters } from "./filter-eval-CqeBnMYh.js";
import { A as resolveSearchEntries, C as customRemoteClause, E as hasWildcardSearch, S as customPredicate, T as hasCustomSearch, h as mergeSearchFields, j as searchEntryFor, k as plainSearchColumns, n as describeError, o as isCanceled, u as DEFAULT_SEARCH_FIELDS } from "./normalize-error-BEcd1tmS.js";
import { _ as monoArraySource, a as resolveDataSourceOptions, c as composeSummaryApply, d as createApplyGate, f as isRolledUp, g as storeRows, i as normalizeSortList, l as summaryAliases, n as extraLoadOptions, o as toList, p as loadApply, s as buildSummaryApply, t as dataSourceOptionsKey, u as summaryFilterOf } from "./data-source-options-Cujz8TZ_.js";
import { n as unwrapReactive } from "./reactive-Dtd-esHO.js";
import { i as isThemeColorToken, n as colorClassToken, r as customColorStyle } from "./color-CEYYtRX-.js";
import { n as dateTimeFormat, r as numberFormat, t as collator } from "./intl-cache-DoVGRXDU.js";
import { t as arrayToODataString } from "./filter-odata-GsczYKNC.js";
import { t as createNotifier } from "./notifier-BIrqUzRh.js";
import { t as monoFilterBuilder } from "./filter-builder-vbqIuPhX.js";

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
			const res = await store.load({
				group: [{
					selector: groupField,
					isExpanded: false
				}],
				...summaryDesc ? { groupSummary: summaryDesc } : {},
				requireGroupCount: true,
				...filter ? { filter } : {},
				sort: ctx.sort ?? [{ selector: groupField }],
				...ctx.loadOptions ?? {}
			});
			return rows(res).map((g) => ({
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
			const res = await store.load({
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
			});
			return rows(res);
		}
	};
}

//#endregion
//#region src/components/table/grouped-bands.ts
/**
* `grouped` — sticky group BANDS over a flat, ordered row list.
*
* Unlike `group` (a tree: `displayRows` with group headers, per-group pagers, no
* virtual scroll) a band is a single header row placed in front of the first row
* of each run of equal keys. The rows themselves stay a flat list, so every flat
* feature keeps working — virtual / infinity scroll, paging, search, summaries.
*
* Pure and dependency-free: the controller (`mono-data-grid.ts`) owns the rows,
* the injector (`table-bands.ts`) owns the DOM; this module only does the maths.
*
* Coordinates:
* - **row** — an index into `visible` (the ordered rows minus those under a
*   collapsed band). `band.at` is the row the band is drawn in front of.
* - **slot** — one per drawn thing, band or row, in display order. A virtual
*   scroller measures in slots (each one `rowHeight` tall).
*/
const VARIANTS = [
	"solid",
	"outline",
	"tonal",
	"text"
];
/** Resolve a config; `null` when there is nothing to band by. */
function normalizeGrouped(cfg) {
	if (!cfg || typeof cfg !== "object" || !Array.isArray(cfg.fields)) return null;
	const collapsible = cfg.collapsible !== false;
	const open = cfg.open !== false;
	const stayOpen = cfg.stayOpen !== false;
	const entries = cfg.fields.map((f, i) => ({
		f: typeof f === "string" ? { field: f } : f,
		i
	})).filter((e) => !!e.f && typeof e.f.field === "string" && e.f.field.length > 0);
	if (!entries.length) return null;
	entries.sort((a, b) => {
		return (typeof a.f.order === "number" ? a.f.order : a.i) - (typeof b.f.order === "number" ? b.f.order : b.i) || a.i - b.i;
	});
	const seen = /* @__PURE__ */ new Set();
	const fields = [];
	for (const { f } of entries) {
		if (seen.has(f.field)) continue;
		seen.add(f.field);
		fields.push({
			field: f.field,
			level: fields.length,
			custom: typeof f.custom === "function" ? f.custom : void 0,
			count: f.count !== false,
			variant: f.variant ?? "tonal",
			color: f.color ?? "primary",
			collapsible: typeof f.collapsible === "boolean" ? f.collapsible : collapsible,
			open: typeof f.open === "boolean" ? f.open : open,
			stayOpen: typeof f.stayOpen === "boolean" ? f.stayOpen : stayOpen
		});
	}
	return {
		fields,
		chunk: Math.max(1, Math.floor(Number(cfg.chunk) || 100)),
		collapsible,
		open,
		stayOpen
	};
}
/**
* A config's identity for "did it change?". Functions count by presence only: a
* template's inline `:grouped.prop="{ … custom: (r) => … }"` is a NEW object with
* new closures on every render, and must not re-band (or re-render) each time.
*/
function groupedSignature(cfg) {
	if (!cfg || typeof cfg !== "object" || !Array.isArray(cfg.fields)) return "";
	const fn = (v) => typeof v === "function" ? "ƒ" : v ?? null;
	return JSON.stringify({
		c: cfg.chunk ?? null,
		k: cfg.collapsible ?? null,
		p: cfg.open ?? null,
		s: cfg.stayOpen ?? null,
		f: cfg.fields.map((f) => typeof f === "string" ? f : f && {
			field: f.field,
			o: f.order ?? null,
			n: f.count ?? null,
			v: fn(f.variant),
			c: fn(f.color),
			x: typeof f.custom === "function",
			k: f.collapsible ?? null,
			p: f.open ?? null,
			s: f.stayOpen ?? null
		})
	});
}
/** A row's raw key at `field` (path-aware, like `grouping.ts`). */
function bandKeyOf(row, field) {
	return isPath(field) ? getFieldValue(row, field) : row?.[field];
}
/** The string a key compares by — `null` / `undefined` / `''` are one "blank" band. */
function keyString(key) {
	if (key == null || key === "") return "";
	if (key instanceof Date) return `d:${key.getTime()}`;
	if (typeof key === "object") try {
		return `j:${JSON.stringify(key)}`;
	} catch {
		return String(key);
	}
	return `${typeof key === "number" ? "n" : typeof key === "boolean" ? "b" : "s"}:${String(key)}`;
}
function defaultLabel(key) {
	if (key == null || key === "") return "(blank)";
	if (key instanceof Date) return key.toLocaleDateString();
	return String(key);
}
function resolveVariant(v, row) {
	let out = v;
	if (typeof v === "function") try {
		out = v(row);
	} catch {
		out = "tonal";
	}
	return VARIANTS.includes(out) ? out : "tonal";
}
function resolveColor(c, row) {
	if (typeof c !== "function") return c || "primary";
	try {
		return c(row) || "primary";
	} catch {
		return "primary";
	}
}
function resolveLabel(f, row, key) {
	if (!f.custom) return defaultLabel(key);
	try {
		const out = f.custom(row);
		return out == null ? "" : String(out);
	} catch (err) {
		console.warn(`[mono-table] grouped: custom() for "${f.field}" threw —`, err);
		return defaultLabel(key);
	}
}
/**
* Walk the ORDERED rows once and cut them into bands.
*
* A band opens at level L whenever the key at L — or at any outer level — differs
* from the previous row's. The caller must keep each band contiguous (the band
* fields lead the sort); a key that reappears later simply opens a second band.
*/
function buildGrouped(rows, fields, collapsed = /* @__PURE__ */ new Set()) {
	const isFolded = typeof collapsed === "function" ? collapsed : (path, f) => !f.open || collapsed.has(path);
	const bands = [];
	const visible = [];
	const depth = fields.length;
	if (!depth) return {
		grouped: bands,
		visible: [...rows],
		slotCount: rows.length
	};
	/** The band open at each level for the current run. */
	const open = new Array(depth).fill(null);
	/** Whether the band at each level is drawn (no collapsed ancestor). */
	const drawn = new Array(depth).fill(false);
	/** Level of the outermost collapsed open band, or -1. */
	let foldedAt = -1;
	let prev = null;
	for (const row of rows) {
		const keys = fields.map((f) => bandKeyOf(row, f.field));
		const strs = keys.map(keyString);
		let d = 0;
		if (prev) while (d < depth && strs[d] === prev[d]) d++;
		if (d < depth) {
			if (foldedAt >= d) foldedAt = -1;
			for (let lvl = d; lvl < depth; lvl++) {
				const f = fields[lvl];
				const parent = lvl > 0 ? open[lvl - 1].path : "";
				const seg = encodeURIComponent(strs[lvl]);
				const path = parent ? `${parent}/${seg}` : seg;
				const isDrawn = foldedAt < 0;
				const isCollapsed = f.collapsible && isFolded(path, f);
				const band = {
					path,
					level: lvl,
					field: f.field,
					key: keys[lvl],
					label: resolveLabel(f, row, keys[lvl]),
					count: 0,
					showCount: f.count,
					row,
					variant: resolveVariant(f.variant, row),
					color: resolveColor(f.color, row),
					collapsible: f.collapsible,
					collapsed: isCollapsed,
					at: visible.length,
					slot: 0
				};
				open[lvl] = band;
				drawn[lvl] = isDrawn;
				if (isDrawn) {
					band.slot = visible.length + bands.length;
					bands.push(band);
				}
				if (isDrawn && isCollapsed && foldedAt < 0) foldedAt = lvl;
			}
		}
		for (let lvl = 0; lvl < depth; lvl++) open[lvl].count++;
		if (foldedAt < 0) visible.push(row);
		prev = strs;
	}
	return {
		grouped: bands,
		visible,
		slotCount: visible.length + bands.length
	};
}
/** Index of the first band whose `key(band) >= value` (bands are ascending in both coordinates). */
function lowerBound(bands, value, key) {
	let lo = 0;
	let hi = bands.length;
	while (lo < hi) {
		const mid = lo + hi >>> 1;
		if (key(bands[mid]) < value) lo = mid + 1;
		else hi = mid;
	}
	return lo;
}
/** Number of visible rows in front of `slot` — the row a slot window starts at. */
function slotToRow(layout, slot) {
	const s = Math.max(0, Math.min(Math.floor(slot), layout.slotCount));
	const bandsBefore = lowerBound(layout.grouped, s, (b) => b.slot);
	return Math.max(0, Math.min(layout.visible.length, s - bandsBefore));
}
/** The slot of visible row `row`. */
function rowToSlot(layout, row) {
	const r = Math.max(0, Math.min(Math.floor(row), layout.visible.length));
	return r + lowerBound(layout.grouped, r + 1, (b) => b.at);
}
/**
* The bands a row window draws, and the slots it leaves to the spacers.
*
* The heights always add up: `slotsAbove + leads + drawn bands + rows + slotsBelow
* === slotCount`, so a band entering or leaving the window never makes the content
* jump.
*/
function groupedWindow(layout, rowStart, rowEnd) {
	const { grouped: bands, visible } = layout;
	const end = Math.max(0, Math.min(Math.floor(rowEnd), visible.length));
	const start = Math.max(0, Math.min(Math.floor(rowStart), end));
	const tail = end === visible.length;
	const before = /* @__PURE__ */ new Map();
	const firstIn = lowerBound(bands, start, (b) => b.at);
	let i = firstIn;
	for (; i < bands.length; i++) {
		const b = bands[i];
		if (b.at > end || b.at === end && !tail) break;
		const off = b.at - start;
		const list = before.get(off);
		if (list) list.push(b);
		else before.set(off, [b]);
	}
	const bandsBelow = bands.length - i;
	const leads = [];
	if (start > 0 && end > start) {
		const chain = [];
		for (let j = 0; j < firstIn; j++) {
			const b = bands[j];
			chain[b.level] = b;
			chain.length = b.level + 1;
		}
		for (const b of chain) if (b && b.at < start) leads.push(b);
		const atStart = before.get(0);
		if (atStart?.length) {
			const minLevel = Math.min(...atStart.map((b) => b.level));
			while (leads.length && leads[leads.length - 1].level >= minLevel) leads.pop();
		}
	}
	return {
		before,
		leads,
		slotsAbove: start + firstIn - leads.length,
		slotsBelow: visible.length - end + bandsBelow
	};
}
/** Every collapsible band path — for collapse-all. */
function collapsiblePaths(rows, fields) {
	return buildGrouped(rows, fields, () => false).grouped.filter((b) => b.collapsible).map((b) => b.path);
}

//#endregion
//#region src/components/table/table-overlay.ts
/**
* The element an overlay covers: the `<table>` first, the scroll wrapper only as
* a fallback.
*
* The order is the whole point. An absolutely positioned descendant of a SCROLL
* CONTAINER scrolls with the content, so covering the wrapper pins the overlay to
* the scroll origin at only the scrollport's size — scroll a wide or long table
* and the overlay slides away, leaving live rows showing through beside it. The
* table's box IS the content, so covering that keeps every column and row under
* the overlay at any scroll offset.
*/
function overlayHost(el) {
	return el.closest("table") ?? el.closest(".mono-table-scroll, [mono-table-scroll]");
}
/**
* The element whose height is reserved while an overlay is up — NEVER the
* `<table>`.
*
* A `<table>` does not treat a height as "reserve this much space": CSS table
* layout DISTRIBUTES any surplus over the rows. Freeze a table at the height it
* had when it was full, then let the source clear its rows, and the surplus lands
* on the only row left — the header — which stretches into a band hundreds of
* pixels tall with its captions floating in the middle of it. That is the
* opposite of the collapse this guard exists to prevent.
*
* A block box just reserves the space, so the hold goes on the scroll wrapper, or
* failing that on the table's own parent. If the table has no block ancestor to
* hold the space the hold is SKIPPED — a grid that briefly goes short is a
* smaller problem than a deformed one.
*/
function overlaySizeHost(el) {
	const scroll = el.closest(".mono-table-scroll, [mono-table-scroll]");
	if (scroll) return scroll;
	const table = el.closest("table");
	if (!table) return overlayHost(el);
	const parent = table.parentElement;
	return parent && parent.tagName !== "TABLE" ? parent : null;
}
/**
* Widest header row, counting `colspan` — the span a generated overlay cell
* needs.
*
* Generated and spacer rows are excluded by `data-mono-stripe-skip` rather than
* by class name: this has to skip the row the OTHER overlay may have built as
* well as its own, and both already carry that attribute for the zebra count.
*
* THIS table's rows only (`tHead.rows` / `tBodies`). A plain `thead tr` also matches the header
* of a table NESTED in a row — an open `<mono-table-detail>` panel holding its own
* grid — and a 20-column inner header then stamped `colspan="20"` on the outer
* 11-column table's overlay row. Under `table-layout: fixed` those 9 phantom
* columns have no width, take all the spare width, and the real columns shrink
* to their declared minimum.
*/
function columnCount(table) {
	const widest = Array.from(table.tHead?.rows ?? []).reduce((max, tr) => {
		const span = Array.from(tr.children).reduce((sum, c) => sum + (c.colSpan || 1), 0);
		return Math.max(max, span);
	}, 0);
	if (widest) return widest;
	const first = Array.from(table.tBodies).flatMap((body) => Array.from(body.rows)).find((row) => !row.hasAttribute("data-mono-stripe-skip"));
	return first ? Array.from(first.children).length : 0;
}
/**
* Give an overlay a spec-valid home inside the table, and make that home carry
* what the styling keys on.
*
* `<table>`'s content model permits only `caption` / `colgroup` / `thead` /
* `tbody` / `tfoot`, and a row section permits only `<tr>` — so a bare custom
* element in either is invalid HTML. Vue's compiler warns about it on every
* consumer build, and the HTML PARSER foster-parents it out of the table: a
* server-rendered `<mono-shadow-table-error>` written straight into `<tbody>`
* has left the table before hydration starts, at which point it is not a row and
* covers nothing.
*
* So the form the docs teach is the valid one — `<tr><td colspan>` written by the
* consumer — and this function has two jobs:
*
* 1. **Adopt** a hand-written cell. A row the consumer wrote lacks the three
*    things the generated one has: the `rowClass` (which is the ONLY thing the
*    padding/border reset in `table.css` keys on — without it a docs-style
*    `td { padding }` puts a 14px gutter around the bar), `data-mono-stripe-skip`
*    (zebra parity), and a `colspan` that `syncRowSpan` keeps in step with the
*    columns. Asking a consumer to remember all three is a trap, so the element
*    stamps them on the row it finds itself in. The class is ADDED, never
*    replaced — a framework does not patch an attribute it did not bind, so what
*    is written here survives their re-renders, and what they wrote survives us.
*
* 2. **Generate** a row when the element is dropped bare into a table or a row
*    section anyway — the client-only fallback that makes an imperative
*    `body.appendChild(el)` keep working. Not the taught form, for the reasons
*    above.
*
* A `<caption>` host is left alone: it is valid HTML and its CSS is honoured as
* written. Anything else (`undefined`) is not a table position at all.
*/
function ensureRowHost(el, rowClass) {
	const rowAttr = rowClass.replace(/^mono-table-/, "mono-");
	const parent = el.parentElement;
	if (!parent) return void 0;
	const tag = parent.tagName;
	if (tag === "TD" || tag === "TH") {
		const row = parent.parentElement;
		if (!row || row.tagName !== "TR") return void 0;
		row.classList.add(rowClass);
		row.setAttribute(rowAttr, "");
		row.setAttribute("data-mono-stripe-skip", "");
		return {
			row,
			generated: false
		};
	}
	if (tag !== "TABLE" && tag !== "TBODY" && tag !== "THEAD" && tag !== "TFOOT") return void 0;
	const table = el.closest("table");
	const row = document.createElement("tr");
	row.className = rowClass;
	row.setAttribute(rowAttr, "");
	row.setAttribute("data-mono-stripe-skip", "");
	const cell = document.createElement("td");
	const span = table ? columnCount(table) : 0;
	if (span > 0) cell.colSpan = span;
	const section = tag === "TABLE" ? table?.tBodies[0] ?? table?.appendChild(document.createElement("tbody")) : parent;
	cell.appendChild(el);
	row.appendChild(cell);
	section?.insertBefore(row, section.firstChild);
	return {
		row,
		generated: true
	};
}
/**
* Drop a GENERATED row on disconnect. An empty `<tr>` left behind would still
* draw a border and occupy a slot in the zebra parity count.
*
* An adopted row is never touched: it is the consumer's node, still referenced by
* whatever rendered it, and removing it is exactly the "disrupt future
* functionality" the Vue warning threatens.
*/
function releaseRowHost(el, host) {
	if (host?.generated && !host.row.contains(el)) host.row.remove();
}
/**
* Re-widen the row's cell after a column change — generated or adopted.
*
* `ensureRowHost` sets `colspan` once on a generated cell, from the header as it
* stood on connect; a hand-written cell has whatever the consumer typed, which
* may be nothing. A grid whose columns are driven by data — a `v-for` over a
* props snapshot, a column toggled off — changes that count later, and a stale
* span leaves the row short of the table or overflowing it.
* `mono-table-detail-core` recomputes for the same reason.
*
* Only writes when the number actually moved, so this is safe to call from every
* `updated()` — and a consumer's correct `colspan` is never rewritten.
*/
function syncRowSpan(el, host) {
	if (!host) return;
	const table = el.closest("table");
	if (!table) return;
	const cell = el.closest("td, th") ?? host.row.firstElementChild;
	if (!cell) return;
	const span = columnCount(table);
	if (span > 0 && cell.colSpan !== span) cell.colSpan = span;
}
/**
* Prefix for the per-overlay height reservations parked on the size host.
*
* Every overlay reserves room by writing ITS OWN variable here, and the host's
* `min-height` is then the `max()` of whatever variables are present. A single
* shared inline `min-height` cannot work once two overlays are in the same table
* — which is the arrangement the docs teach, a spinner and an empty state in one
* `<caption>`: the spinner's hide would clear the reservation the empty state had
* just made, the scroll wrapper would collapse to a header, and the message would
* be clipped out of existence by the wrapper's own `overflow`. Nothing about the
* DOM would look wrong; the grid would simply be blank.
*/
const HOLD_PREFIX = "--mono-table-hold-";
/** `max()` over every reservation currently parked on `el`, or `''` if none. */
function holdExpression(el) {
	const names = [];
	for (let i = 0; i < el.style.length; i++) {
		const name = el.style.item(i);
		if (name.startsWith(HOLD_PREFIX)) names.push(name);
	}
	if (!names.length) return "";
	const terms = names.map((n) => `var(${n}, 0px)`);
	return terms.length === 1 ? terms[0] : `max(${terms.join(", ")})`;
}
/**
* The hosts an overlay is currently holding.
*
* Remembered rather than re-derived, because the one moment they are most needed
* is the one moment they cannot be found: `disconnectedCallback` runs AFTER the
* element leaves the tree, so `closest('table')` returns null and an overlay
* cleaning up on its way out would silently clean up nothing — leaving a
* permanent reservation on the consumer's own scroll wrapper, i.e. a gap under
* their header that nothing on the page explains.
*/
const applied = /* @__PURE__ */ new WeakMap();
/**
* Give back everything an overlay reserved, from the hosts it remembers.
*
* Safe to call on an element that never applied anything, and safe to call after
* it has been removed from the DOM — which is the point.
*/
function releaseOverlayHost(el) {
	const last = applied.get(el);
	if (!last) return;
	if (last.sizeHost) {
		last.sizeHost.style.removeProperty(last.holdVar);
		last.sizeHost.style.minHeight = holdExpression(last.sizeHost);
	}
	el.style.minHeight = "";
	last.host.style.removeProperty(last.headVar);
	applied.delete(el);
}
/**
* Make the host a positioning context, publish the header offset, reserve the
* space and stretch the overlay — or undo all four.
*
* **The order is load-bearing, and each step feeds the next.** The header offset
* goes first because a configured hold may be a function of it. The hold goes
* next because the stretch measures the scroll region the hold has just resized —
* do it the other way round and the overlay is stretched to the height the table
* had before any room was made, which on an empty grid is a header-high strip.
*/
function applyOverlayHost(el, on, opts) {
	const host = overlayHost(el);
	if (!host) return;
	const sizeHost = overlaySizeHost(el);
	if (!on) {
		releaseOverlayHost(el);
		return;
	}
	if (getComputedStyle(host).position === "static") host.style.position = "relative";
	applied.set(el, {
		host,
		sizeHost,
		headVar: opts.headVar,
		holdVar: opts.holdVar
	});
	const head = opts.measureHead === "always" || !!host.closest("[mono-sticky-head], .mono-table-sticky-head") ? host.querySelector(":scope > thead")?.offsetHeight ?? 0 : 0;
	host.style.setProperty(opts.headVar, `${head}px`);
	if (sizeHost) {
		if (opts.hold === "measure") {
			if (!sizeHost.style.getPropertyValue(opts.holdVar)) sizeHost.style.setProperty(opts.holdVar, `${sizeHost.offsetHeight}px`);
		} else sizeHost.style.setProperty(opts.holdVar, typeof opts.hold === "function" ? opts.hold() : opts.hold);
		sizeHost.style.minHeight = holdExpression(sizeHost);
	}
	if (sizeHost && sizeHost !== host) el.style.minHeight = holdExpression(sizeHost);
}

//#endregion
//#region src/components/table/table-bands.ts
/**
* The tbody half of `grouped`: inserts the band `<tr>`s in front of the rows the
* controller says they head (`ctrl.groupedWindow`).
*
* The consumer's framework owns every OTHER row, so the band rows are foreign
* nodes in a tbody it patches. That is safe as long as mono only ever adds and
* moves its own rows (a framework never touches a node it did not create), and
* re-places them whenever the framework's patch shifts the rows around — a
* `MutationObserver` on the tbody's children does that, in the same microtask
* checkpoint as the patch, so a misplaced band is never painted. A framework
* removing a range that happens to include a band (a fragment unmount) simply
* gets the band re-created on the next pass.
*
* Which `<tr>` is "row i": the tbody's rows in DOM order, minus every row that
* is not a data row — mono's bands, `[data-mono-stripe-skip]` rows (mono's own
* overlay rows and a consumer's extras), `aria-hidden` spacers, detail / filler /
* group rows. The same set the zebra stripe skips. If that count does not match
* `ctrl.items` the framework is mid-patch and the pass is skipped; its own
* mutations trigger the next one.
*/
const NON_DATA_ROW = "[mono-grouped],[data-mono-stripe-skip],[aria-hidden=\"true\"],[mono-detail-row],.mono-table-detail-row,[mono-filler],.mono-table-filler,[mono-group-row],.mono-table-group-row";
/** The tbody's data rows, in order — see the module comment. */
function dataRowsOf(body) {
	const out = [];
	for (const tr of Array.from(body.rows)) if (!tr.matches(NON_DATA_ROW)) out.push(tr);
	return out;
}
function isDetailRow(el) {
	return !!el && el.matches("[mono-detail-row],.mono-table-detail-row");
}
var BandInjector = class {
	constructor(ctrl, table) {
		this.rows = /* @__PURE__ */ new Map();
		this.body = null;
		this.unsubscribe = null;
		this.mo = null;
		this.ro = null;
		this.queued = false;
		this.stopped = false;
		this.ctrl = ctrl;
		this.table = table;
		this.unsubscribe = ctrl.subscribe(() => this.schedule());
		if (typeof ResizeObserver !== "undefined") {
			this.ro = new ResizeObserver(() => this.syncHeadHeight());
			if (table.tHead) this.ro.observe(table.tHead);
		}
		this.schedule();
	}
	/** Re-run a pass now-ish (after a config change that may not notify). */
	refresh() {
		this.schedule();
	}
	stop() {
		this.stopped = true;
		this.unsubscribe?.();
		this.unsubscribe = null;
		this.mo?.disconnect();
		this.mo = null;
		this.ro?.disconnect();
		this.ro = null;
		this.removeAll();
	}
	schedule() {
		if (this.queued || this.stopped) return;
		this.queued = true;
		queueMicrotask(() => {
			this.queued = false;
			if (!this.stopped) this.flush();
		});
	}
	/** Watch the CURRENT tbody — a framework may swap it. */
	watch(body) {
		if (body === this.body) return;
		this.mo?.disconnect();
		this.body = body;
		if (!body || typeof MutationObserver === "undefined") return;
		this.mo ??= new MutationObserver(() => this.schedule());
		this.mo.observe(body, { childList: true });
	}
	syncHeadHeight() {
		const h = this.table.tHead?.getBoundingClientRect().height ?? 0;
		const v = `${Math.round(h)}px`;
		if (this.table.style.getPropertyValue("--mono-table-grouped-head") !== v) this.table.style.setProperty("--mono-table-grouped-head", v);
	}
	removeAll() {
		for (const tr of this.rows.values()) tr.remove();
		this.rows.clear();
		this.table.removeAttribute("mono-grouped-table");
		this.table.style.removeProperty("--mono-table-grouped-h");
	}
	/** One placement pass. Public for tests; normally driven by notify / mutations. */
	flush() {
		const body = this.table.tBodies[0] ?? null;
		this.watch(body);
		const win = this.ctrl.groupedWindow;
		if (!win || !body) {
			this.removeAll();
			return;
		}
		const data = dataRowsOf(body);
		if (data.length !== this.ctrl.items.length) return;
		this.table.setAttribute("mono-grouped-table", "");
		const rh = this.ctrl.scrollMode === "virtual" ? this.ctrl.virtualRowHeight : void 0;
		const hv = rh && rh > 0 ? `${rh}px` : "";
		if (this.table.style.getPropertyValue("--mono-table-grouped-h") !== hv) {
			if (hv) this.table.style.setProperty("--mono-table-grouped-h", hv);
			else this.table.style.removeProperty("--mono-table-grouped-h");
		}
		if (!this.table.style.getPropertyValue("--mono-table-grouped-head")) this.syncHeadHeight();
		const span = columnCount(this.table) || 1;
		const keep = /* @__PURE__ */ new Set();
		const groups = [];
		const atZero = win.before.get(0) ?? [];
		if (win.leads.length || atZero.length) groups.push({
			bands: [...win.leads, ...atZero],
			off: 0
		});
		const offs = [...win.before.keys()].filter((k) => k !== 0).sort((a, b) => a - b);
		for (const off of offs) groups.push({
			bands: win.before.get(off),
			off
		});
		for (const { bands, off } of groups) {
			const trs = bands.map((b) => {
				keep.add(b.path);
				return this.rowFor(b, span);
			});
			if (off < data.length) {
				let ref = data[off];
				for (let j = trs.length - 1; j >= 0; j--) {
					const tr = trs[j];
					if (tr.parentNode !== body || tr.nextElementSibling !== ref) body.insertBefore(tr, ref);
					ref = tr;
				}
			} else {
				let prev = data.length ? data[data.length - 1] : null;
				while (prev && isDetailRow(prev.nextElementSibling)) prev = prev.nextElementSibling;
				const fallback = prev ? null : body.querySelector(":scope > tr[aria-hidden=\"true\"], :scope > tr[mono-filler], :scope > tr.mono-table-filler");
				for (const tr of trs) {
					if (!(tr.parentNode === body && (prev ? tr.previousElementSibling === prev : !tr.previousElementSibling || tr.nextElementSibling === fallback))) body.insertBefore(tr, prev ? prev.nextSibling : fallback);
					prev = tr;
				}
			}
		}
		for (const [path, tr] of this.rows) if (!keep.has(path)) {
			tr.remove();
			this.rows.delete(path);
		}
		this.mo?.takeRecords();
	}
	/** The band's row — created on first use, its attributes / text kept current. */
	rowFor(b, span) {
		let tr = this.rows.get(b.path);
		if (!tr) {
			tr = document.createElement("tr");
			tr.className = "mono-table-grouped";
			tr.setAttribute("mono-grouped", "");
			tr.setAttribute("data-mono-stripe-skip", "");
			const td = document.createElement("td");
			td.setAttribute("mono-grouped-cell", "");
			const label = document.createElement("div");
			label.setAttribute("mono-grouped-label", "");
			const chevron = document.createElement("span");
			chevron.setAttribute("mono-grouped-chevron", "");
			chevron.setAttribute("aria-hidden", "true");
			const text = document.createElement("span");
			text.setAttribute("mono-grouped-text", "");
			const count = document.createElement("span");
			count.setAttribute("mono-grouped-count", "");
			label.append(chevron, text, count);
			td.appendChild(label);
			tr.appendChild(td);
			const toggle = () => {
				const path = tr.dataset.groupedPath;
				if (path && tr.hasAttribute("mono-grouped-collapsible")) this.ctrl.toggleGrouped(path);
			};
			tr.addEventListener("click", toggle);
			tr.addEventListener("keydown", (e) => {
				if (e.key === "Enter" || e.key === " ") {
					e.preventDefault();
					toggle();
				}
			});
			this.rows.set(b.path, tr);
		}
		const set = (name, value) => {
			if (value == null) {
				if (tr.hasAttribute(name)) tr.removeAttribute(name);
			} else if (tr.getAttribute(name) !== value) tr.setAttribute(name, value);
		};
		set("data-grouped-path", b.path);
		set("mono-grouped-level", String(b.level));
		set("mono-grouped-field", b.field);
		set("mono-variant", b.variant);
		set("mono-color", colorClassToken(b.color) || "primary");
		const custom = isThemeColorToken(b.color) ? "" : customColorStyle(b.color, "table-grouped");
		if ((tr.getAttribute("style") ?? "") !== custom) {
			if (custom) tr.setAttribute("style", custom);
			else tr.removeAttribute("style");
		}
		set("mono-grouped-collapsible", b.collapsible ? "" : null);
		set("mono-grouped-collapsed", b.collapsed ? "" : null);
		set("aria-expanded", b.collapsible ? String(!b.collapsed) : null);
		set("tabindex", b.collapsible ? "0" : null);
		const td = tr.firstElementChild;
		if (td.colSpan !== span) td.colSpan = span;
		const label = td.firstElementChild;
		const [, text, count] = Array.from(label.children);
		if (text.textContent !== b.label) text.textContent = b.label;
		const c = b.showCount ? `(${b.count})` : "";
		if (count.textContent !== c) count.textContent = c;
		if (count.hidden !== !b.showCount) count.hidden = !b.showCount;
		return tr;
	}
};

//#endregion
//#region src/components/table/date-filter-tree.ts
const DATE_LEVELS = [
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
const BLANK_KEY = "blank";
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
		case "month": return dateTimeFormat(locale, {
			month: "long",
			...tz
		}).format(d);
		case "day": return `${two(parts[2])} (${dateTimeFormat(locale, {
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
const childMaps = /* @__PURE__ */ new WeakMap();
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
//#region src/utils/group-count.ts
/**
* Per-value row counts for ONE field, as `{ value, count }` rows.
*
* Two consumers share this: the grid's header filter (`distinctValues`) and the
* table search's filter suggestion (`components/table/filter-suggestion.ts`),
* which asks "how many rows match this search under each OTHER value of Dept".
*
* Remote: one `$apply=filter(…)/groupby((field),aggregate($count as count))`
* through the store (see `data-source-apply.ts` for why it rides `urlOverride`).
* Array: a plain tally over the rows.
*/
/**
* Group-count `field` through `store` with ONE `$apply`, or `null` when that path
* is not available — the gate is off, a wildcard path (nothing to group by), a
* store that cannot carry an `$apply` (a CustomStore), a failed request (reported
* to the gate), or a response that is not rolled up (a server that ignored the
* clause). An EMPTY grouped result is a real answer and comes back as `[]`.
*
* The rows are returned in server order — the caller sorts.
*/
async function groupCountViaApply(store, field, filter, gate, options = {}) {
	const rows = await groupCountsViaApply(store, [field], filter, gate, options);
	return rows ? rows.map((r) => ({
		value: r.values[field],
		count: r.count
	})) : null;
}
/**
* {@link groupCountViaApply} over SEVERAL fields at once — one
* `groupby((A,B),aggregate($count as count))` request, one row per combination
* that exists. Same `null` contract.
*/
async function groupCountsViaApply(store, fields, filter, gate, options = {}) {
	if (gate.skip || !fields.length) return null;
	const selectors = [];
	for (const field of fields) {
		if (parseFieldPath(field).hasWildcard) return null;
		const selector = isPath(field) ? toODataSelector(field) : field;
		if (!selector) return null;
		selectors.push(selector);
	}
	const apply = `groupby((${selectors.join(",")}),aggregate($count as count))`;
	const odataFilter = filter != null ? arrayToODataString(filter) : "";
	const clause = odataFilter ? `filter(${odataFilter})/${apply}` : apply;
	const top = typeof options.top === "number" && options.top >= 0 ? options.top : void 0;
	let rows;
	try {
		rows = await loadApply(store, clause, { top });
	} catch (err) {
		gate.reject(err);
		return null;
	}
	if (!rows) return null;
	if (!rows.length) return [];
	const first = rows[0];
	if (!first || typeof first !== "object" || !isCount(first.count)) return null;
	if (!isRolledUp(rows, [...fields, "count"])) return null;
	return rows.map((r) => ({
		values: pickValues(r, fields),
		count: Number(r.count) || 0
	}));
}
/** Each field's value off a row, path-aware. */
function pickValues(row, fields) {
	const out = {};
	for (const f of fields) out[f] = isPath(f) ? getFieldValue(row, f) : row?.[f];
	return out;
}
/** {@link countValues} over several fields: one tuple per combination, with its row count. */
function countTuples(rows, fields) {
	const by = /* @__PURE__ */ new Map();
	for (const r of rows) {
		const values = pickValues(r, fields);
		const key = JSON.stringify(fields.map((f) => values[f] ?? null));
		const hit = by.get(key);
		if (hit) hit.count++;
		else by.set(key, {
			values,
			count: 1
		});
	}
	return [...by.values()];
}
/** A number, or a string that is one (`"12"`). */
function isCount(v) {
	if (typeof v === "number") return Number.isFinite(v);
	return typeof v === "string" && v.trim() !== "" && Number.isFinite(Number(v));
}
/** Count occurrences of `field` across `rows` (path-aware; a wildcard path flattens). */
function countValues(rows, field) {
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
	return [...counts.entries()].map(([value, count]) => ({
		value,
		count
	}));
}

//#endregion
//#region src/components/table/mono-data-grid.ts
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
	let browserRows = null;
	let browserPageIndex = 0;
	let browserPageSize = 0;
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
	let bandCfg = normalizeGrouped(opts.grouped);
	let bandSig = groupedSignature(opts.grouped);
	let bandRead = null;
	let bandRows = [];
	let bandLayout = null;
	const bandOpen = /* @__PURE__ */ new Map();
	let bandAll = null;
	let bandPageIndex = 0;
	let bandPageSize = 0;
	let bandRowHeight = 44;
	let bandSeq = 0;
	let bandReading = false;
	let bandWarned = false;
	let bandInjector = null;
	let bandHostEl = null;
	const isGrouped = () => groupFields.length > 0;
	/** Bands apply: a config is set and the `group` tree is not in charge. */
	const bandsActive = () => {
		if (!bandCfg) return false;
		if (groupFields.length > 0) {
			if (!bandWarned) {
				bandWarned = true;
				console.warn("[monoDataGrid] `grouped` is ignored while `group` is set — they are two different groupings.");
			}
			return false;
		}
		return true;
	};
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
		filterSuggestion: null,
		filterSuggestions: [],
		setFilterSuggestion,
		sorts: [],
		sortField: null,
		sortOrder: null,
		groupTree: groupFields.length > 0,
		scrollMode: "off",
		hasMore: false,
		loadedCount: 0,
		virtualStart: 0,
		virtualEnd: 0,
		virtualPadTop: 0,
		virtualPadBottom: 0,
		grouped: [],
		groupedWindow: null,
		virtualSlotCount: void 0,
		setGrouped,
		groupedConfig: () => bandsActive() ? bandCfg : null,
		toggleGrouped,
		openGrouped,
		closeGrouped,
		isGroupedCollapsed,
		expandAllGrouped,
		collapseAllGrouped,
		bindGroupedHost,
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
		const body = spec.precision != null ? numberFormat(void 0, {
			minimumFractionDigits: spec.precision,
			maximumFractionDigits: spec.precision
		}).format(value) : numberFormat().format(value);
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
	/**
	* Bumped on every selection notify (a rejected toggle included — its subscribers repaint the
	* revert), so a listener can tell a selection change from the grid's other notifies without
	* diffing the store. See `MonoCheckHandle.version`.
	*/
	let checkVersion = 0;
	function checkChanged() {
		checkVersion += 1;
		notify();
	}
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
			if (!(next && !has && max !== void 0 && checkedRows.size >= max || !next && has && min !== void 0 && checkedRows.size <= min)) {
				if (next) checkedRows.set(key, item);
				else checkedRows.delete(key);
			}
			checkChanged();
		},
		selectPage() {
			addChecked(ctrl.items);
			checkChanged();
		},
		replace(rows) {
			checkedRows.clear();
			addChecked(rows, false);
			checkChanged();
		},
		async selectAll() {
			if (checkPending) return;
			if (drainIsReusable()) {
				addChecked(drainedRows);
				checkChanged();
				return;
			}
			checkPending = true;
			checkChanged();
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
				checkChanged();
			}
		},
		clear() {
			if (!checkedRows.size) return;
			const min = checkLimits().min ?? 0;
			if (min > 0) {
				if (checkedRows.size <= min) {
					checkChanged();
					return;
				}
				const keep = [...checkedRows.entries()].slice(0, min);
				checkedRows.clear();
				for (const [key, row] of keep) checkedRows.set(key, row);
			} else checkedRows.clear();
			checkChanged();
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
		get version() {
			return checkVersion;
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
	/**
	* Row → index and row key → index over `ctrl.items`, built lazily per items ARRAY.
	*
	* `rowKey()` / `indexOfRowKey()` were linear scans, and they are per-row calls: every
	* `<mono-table-checkbox>` asks `check.isChecked(row)` on every notify, so a tick on a grid
	* holding N rows (infinity scroll and page-size "all" hold the whole set) cost O(N²).
	*
	* A HIT is always verified against the live array, and a MISS falls back to the scan
	* (rebuilding when the scan finds the row) — so an in-place mutation of `ctrl.items`, or a
	* key that moved, costs one rebuild and is never answered wrong.
	*/
	let indexFor = null;
	let indexByRow = /* @__PURE__ */ new Map();
	let keyIndexFor = null;
	let indexByKey = /* @__PURE__ */ new Map();
	function rebuildRowIndex(items) {
		indexFor = items;
		indexByRow = /* @__PURE__ */ new Map();
		items.forEach((row, i) => {
			if (!indexByRow.has(row)) indexByRow.set(row, i);
		});
	}
	function indexOfRow(raw) {
		const items = ctrl.items;
		if (indexFor !== items) rebuildRowIndex(items);
		const hit = indexByRow.get(raw);
		if (hit !== void 0 && items[hit] === raw) return hit;
		const i = items.indexOf(raw);
		if (i >= 0) rebuildRowIndex(items);
		return i;
	}
	function rebuildKeyIndex(items) {
		keyIndexFor = items;
		indexByKey = /* @__PURE__ */ new Map();
		items.forEach((row, i) => {
			const k = rowKeyOf(row, i);
			if (!indexByKey.has(k)) indexByKey.set(k, i);
		});
	}
	function indexOfRowKey(rowKey) {
		const items = ctrl.items;
		if (keyIndexFor !== items) rebuildKeyIndex(items);
		const hit = indexByKey.get(rowKey);
		if (hit !== void 0 && hit < items.length && rowKeyOf(items[hit], hit) === rowKey) return hit;
		const i = items.findIndex((row, j) => rowKeyOf(row, j) === rowKey);
		if (i >= 0) rebuildKeyIndex(items);
		return i;
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
		let editableCol = false;
		for (const el of columnEls) if (el.field === field && el.editable) {
			editableCol = true;
			break;
		}
		if (!editableCol) return false;
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
		const keys = ctrl.sorts.filter((s) => !isBrowserSortKey(s.field)).map((s) => ({
			field: s.field,
			selector: declaredSortSelector(s.field) ?? s.field,
			desc: s.order === "desc"
		}));
		const entry = (k) => ({
			selector: k.selector,
			desc: k.desc
		});
		const lead = groupFields.length ? groupFields : bandsActive() ? bandCfg?.fields.map((f) => f.field) ?? [] : [];
		if (!lead.length) return keys.length ? keys.map(entry) : null;
		const list = lead.map((f) => ({
			selector: f,
			desc: keys.find((k) => k.field === f)?.desc ?? false
		}));
		for (const k of keys) if (!lead.includes(k.field)) list.push(entry(k));
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
		const i = indexOfRow(raw);
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
	/** What `ctrl.mapped` was last built from — see `syncMapped`. */
	let mappedFrom = [];
	/**
	* Recompute `ctrl.mapped` from `ctrl.items`. Cheap no-op without a map.
	*
	* Skipped when nothing it reads has moved: the same `items` array (same length), the same
	* row set (`rowSetVersion`) and the same map config. It runs on EVERY notifier flush, so a
	* checkbox tick or a loading flip re-mapped every row — every accumulated row under infinity
	* scroll or page-size "all" — and handed out new `mapped` identities each time.
	*
	* Never skipped while a row can be edited IN PLACE (an inline edit, a `showForm` row, form
	* ops): those write straight into the row objects, which no identity check can see.
	*/
	function syncMapped() {
		if (!hasMap()) {
			ctrl.mapped = ctrl.items;
			mappedFrom = [];
			return;
		}
		const from = [
			ctrl.items,
			ctrl.items.length,
			rowSetVersion,
			elementProps.th,
			opts.map
		];
		if (!(formHandle != null || formOps.length > 0 || ctrl.editingKey != null) && from.length === mappedFrom.length && from.every((v, i) => Object.is(v, mappedFrom[i]))) return;
		const cols = mapColumns();
		ctrl.mapped = ctrl.items.map((row, i) => mapRow(row, i, cols));
		mappedFrom = from;
	}
	/** Flatten `ctrl.items` into the ready-to-render, keyed `displayRows` list. */
	function buildDisplayRows() {
		const out = [];
		const cols = mapColumns();
		if (!isGrouped()) {
			syncMapped();
			const mapped = ctrl.mapped;
			ctrl.items.forEach((row, i) => out.push({
				key: `r:${rowKeyOf(row, i)}`,
				kind: "row",
				level: 0,
				row,
				mapped: mapped[i]
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
		const src = bound ? bound.items?.() ?? [] : [];
		const from = [
			src,
			src.length,
			groupFields.join("\0"),
			rowSetVersion
		];
		if (!(!(formHandle != null || formOps.length > 0 || ctrl.editingKey != null) && from.length === groupTreeFrom.length && from.every((v, i) => Object.is(v, groupTreeFrom[i])))) {
			groupTree = buildGroups(flattenLeaves([...src]), groupFields, collapsed);
			groupTreeFrom = from;
			return groupTree;
		}
		const stamp = (nodes) => {
			for (const node of nodes) {
				node.collapsed = collapsed.has(node.path);
				if (node.items.length && isGroupNode(node.items[0])) stamp(node.items);
			}
		};
		stamp(groupTree);
		return groupTree;
	}
	let groupTreeFrom = [];
	let groupTree = [];
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
		ctrl.groupTree = true;
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
		ctrl.groupTree = true;
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
		if (bandsActive()) {
			syncBands();
			return;
		}
		if (scrollMode !== "off") {
			syncScroll();
			return;
		}
		if (browserRows && browserSortActive()) {
			syncBrowser();
			return;
		}
		if (pageSizeAll) {
			ctrl.groupTree = false;
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
		ctrl.groupTree = false;
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
		if (bandsActive()) {
			await loadBanded();
			return;
		}
		if (scrollActive()) {
			await loadScrollPage(true);
			return;
		}
		if (browserSortActive()) {
			await loadBrowserSorted();
			return;
		}
		browserRows = null;
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
		if (bandsActive()) {
			await loadBanded();
			return;
		}
		if (scrollActive()) {
			await loadScrollPage(true);
			return;
		}
		if (browserSortActive()) {
			await loadBrowserSorted();
			return;
		}
		browserRows = null;
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
		if (bandRead) {
			clearBands();
			bandRead = [];
		}
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
		if (bandsActive()) {
			bandPageIndex = Math.max(0, pageIndex);
			sync();
			return;
		}
		if (browserRows && browserSortActive()) {
			browserPageIndex = Math.max(0, pageIndex);
			syncBrowser();
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
		if (bandsActive()) {
			if (!all) {
				bandPageSize = Math.max(1, pageSize);
				bound?.pageSize?.(bandPageSize);
			}
			bandPageIndex = 0;
			sync();
			return;
		}
		const s = bound;
		if (!s) return;
		if (browserRows && browserSortActive()) {
			if (!all) {
				browserPageSize = Math.max(1, pageSize);
				s.pageSize?.(browserPageSize);
			}
			browserPageIndex = 0;
			syncBrowser();
			return;
		}
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
	const BROWSER_SORT_MAX_ROWS = 5e3;
	/** The active sort keys when ANY of them sorts in the browser, else `null`. */
	function browserSortKeys() {
		if (!ctrl.sorts.some((s) => isBrowserSortKey(s.field))) return null;
		return ctrl.sorts.map((s) => {
			const browser = isBrowserSortKey(s.field);
			return {
				field: s.field,
				selector: declaredSortSelector(s.field) ?? s.field,
				desc: s.order === "desc",
				aggregate: browser ? declaredSortConfig(s.field).aggregate ?? "sum" : null
			};
		});
	}
	/** Browser sort applies: a browser-sorted column is active on a flat, paged, bound table. */
	function browserSortActive() {
		return !!bound && !isGrouped() && !serverMode() && !scrollActive() && !!browserSortKeys();
	}
	/** The smallest `maxRows` any active browser-sorted column declares (default 5000). */
	function browserSortCap() {
		const caps = ctrl.sorts.filter((s) => isBrowserSortKey(s.field)).map((s) => Number(declaredSortConfig(s.field).maxRows)).filter((n) => Number.isFinite(n) && n > 0);
		return caps.length ? Math.min(...caps) : BROWSER_SORT_MAX_ROWS;
	}
	/** A row's matches for `selector` reduced to one sortable value. */
	function browserSortValue(row, selector, aggregate) {
		const raw = getFieldValue(row, selector);
		if (!aggregate) return raw;
		const list = Array.isArray(raw) ? raw : raw == null ? [] : [raw];
		if (aggregate === "count") return list.length;
		const nums = list.map(Number).filter((n) => Number.isFinite(n));
		if (!nums.length) return aggregate === "sum" ? 0 : null;
		if (aggregate === "min") return Math.min(...nums);
		if (aggregate === "max") return Math.max(...nums);
		const sum = nums.reduce((a, b) => a + b, 0);
		return aggregate === "avg" ? sum / nums.length : sum;
	}
	/** Empties last in either direction; numbers numerically; text numeric-aware. */
	function compareBrowserValues(a, b) {
		const ea = a == null || a === "";
		const eb = b == null || b === "";
		if (ea || eb) return ea === eb ? 0 : ea ? 1 : -1;
		if (typeof a === "number" && typeof b === "number") return a - b;
		if (a instanceof Date && b instanceof Date) return a.getTime() - b.getTime();
		return collator(void 0, { numeric: true }).compare(String(a), String(b));
	}
	/** Every matching row, sorted by the active keys (stable). */
	function sortBrowserRows(rows) {
		const keys = browserSortKeys() ?? [];
		const decorated = rows.map((row, i) => ({
			row,
			i,
			v: keys.map((k) => browserSortValue(row, k.selector, k.aggregate))
		}));
		decorated.sort((x, y) => {
			for (let k = 0; k < keys.length; k++) {
				const ex = x.v[k] == null || x.v[k] === "";
				const ey = y.v[k] == null || y.v[k] === "";
				const c = compareBrowserValues(x.v[k], y.v[k]);
				if (c) return ex || ey ? c : keys[k].desc ? -c : c;
			}
			return x.i - y.i;
		});
		return decorated.map((d) => d.row);
	}
	/** Too many rows to sort in the browser: drop those keys, warn, load normally. */
	async function refuseBrowserSort(count, cap) {
		const fields = ctrl.sorts.filter((s) => isBrowserSortKey(s.field)).map((s) => s.field);
		console.warn(`[monoDataGrid] sort: "${fields.join("\", \"")}" sorts in the browser and needs every row, but ${count} match (maxRows ${cap}) — sort cleared.`);
		ctrl.sorts = ctrl.sorts.filter((s) => !isBrowserSortKey(s.field));
		syncPrimarySort();
		browserRows = null;
		applySourceSort();
		notify();
		await load();
	}
	/** Read every matching row, sort it in memory, show the first page. */
	async function loadBrowserSorted() {
		const s = bound;
		if (!s) return;
		const cap = browserSortCap();
		const known = s.totalCount?.();
		if (typeof known === "number" && known > cap) {
			await refuseBrowserSort(known, cap);
			return;
		}
		if (!browserPageSize) browserPageSize = Math.max(1, s.pageSize?.() || ctrl.pageSize || 20);
		ctrl.loading = true;
		notify();
		let rows = [];
		try {
			await runLoad(async () => {
				rows = await readAllFromSource();
			});
		} finally {
			ctrl.loading = false;
		}
		if (rows.length > cap) {
			await refuseBrowserSort(rows.length, cap);
			return;
		}
		browserRows = sortBrowserRows(rows);
		browserPageIndex = 0;
		sync();
		recomputeSummaries();
	}
	/** Map the in-memory sorted rows (current page, or all) onto `ctrl`. */
	function syncBrowser() {
		const rows = browserRows ?? [];
		const size = pageSizeAll ? Math.max(1, rows.length) : Math.max(1, browserPageSize);
		const pageCount = Math.max(1, Math.ceil(rows.length / size));
		browserPageIndex = Math.min(Math.max(0, browserPageIndex), pageCount - 1);
		const start = browserPageIndex * size;
		ctrl.groupTree = false;
		ctrl.items = rows.slice(start, start + size);
		ctrl.pageIndex = browserPageIndex;
		ctrl.pageSize = size;
		ctrl.pageSizeAll = pageSizeAll;
		ctrl.totalCount = rows.length;
		ctrl.pageCount = pageCount;
		render();
	}
	/** The band keys lead (direction from the column sort when sorted), the column sort follows. */
	function bandSortKeys() {
		const fields = bandCfg?.fields.map((f) => f.field) ?? [];
		const keys = fields.map((f) => ({
			selector: f,
			desc: sortOf(f) === "desc",
			aggregate: null
		}));
		for (const s of ctrl.sorts) {
			if (fields.includes(s.field)) continue;
			keys.push({
				selector: declaredSortSelector(s.field) ?? s.field,
				desc: s.order === "desc",
				aggregate: isBrowserSortKey(s.field) ? declaredSortConfig(s.field).aggregate ?? "sum" : null
			});
		}
		return keys;
	}
	/**
	* `bandRead` in display order — a STABLE in-memory sort, so the bands are
	* contiguous whatever order (or collation) the source returned, and rows the
	* keys tie on keep the source's order.
	*/
	function resortBands() {
		const rows = bandRead ?? [];
		const keys = bandSortKeys();
		const decorated = rows.map((row, i) => ({
			row,
			i,
			v: keys.map((k) => browserSortValue(row, k.selector, k.aggregate))
		}));
		decorated.sort((x, y) => {
			for (let k = 0; k < keys.length; k++) {
				const ex = x.v[k] == null || x.v[k] === "";
				const ey = y.v[k] == null || y.v[k] === "";
				const c = compareBrowserValues(x.v[k], y.v[k]);
				if (c) return ex || ey ? c : keys[k].desc ? -c : c;
			}
			return x.i - y.i;
		});
		bandRows = decorated.map((d) => d.row);
	}
	function relayoutBands() {
		bandLayout = bandCfg ? buildGrouped(bandRows, bandCfg.fields, bandFolded) : null;
	}
	/** Read every matching row for the bands. Superseded reads are dropped. */
	async function loadBanded() {
		const s = bound;
		const seq = ++bandSeq;
		if (!s) {
			bandRead = [];
			resortBands();
			relayoutBands();
			sync();
			return;
		}
		applySourceSort();
		ctrl.loading = true;
		bandReading = true;
		notify();
		let rows = [];
		let ok = false;
		try {
			await runLoad(async () => {
				rows = await readAllFromSource({
					chunkSize: bandCfg?.chunk ?? chunkSize,
					countFirst: true
				});
			});
			ok = true;
		} finally {
			if (seq === bandSeq) {
				ctrl.loading = false;
				bandReading = false;
			}
		}
		if (seq !== bandSeq) return;
		if (!ok) {
			notify();
			return;
		}
		bandRead = rows;
		bandPageIndex = 0;
		resortBands();
		relayoutBands();
		sync();
		recomputeSummaries();
	}
	/** Map the banded rows (window / page / all) onto `ctrl` and render. */
	function syncBands() {
		const layout = bandLayout ?? {
			grouped: [],
			visible: [],
			slotCount: 0
		};
		const vis = layout.visible;
		ctrl.groupTree = false;
		ctrl.scrollMode = scrollMode;
		ctrl.loadedCount = bandRows.length;
		ctrl.hasMore = false;
		ctrl.totalCount = bandRows.length;
		ctrl.pageSizeAll = pageSizeAll;
		ctrl.grouped = layout.grouped;
		ctrl.virtualSlotCount = layout.slotCount;
		let start = 0;
		let end = vis.length;
		if (scrollMode === "virtual") {
			const ss = Math.max(0, Math.min(vStart, layout.slotCount));
			const se = Math.max(ss, Math.min(vEnd, layout.slotCount));
			start = slotToRow(layout, ss);
			end = Math.max(start, slotToRow(layout, se));
			if (se > ss && end === start && start < vis.length) end = start + 1;
			ctrl.pageIndex = 0;
			ctrl.pageSize = vis.length || 1;
			ctrl.pageCount = 1;
		} else if (scrollMode === "infinity" || pageSizeAll) {
			ctrl.pageIndex = 0;
			ctrl.pageSize = vis.length || 1;
			ctrl.pageCount = 1;
		} else {
			const size = Math.max(1, bandPageSize || preferredPageSize || bound?.pageSize?.() || opts.pageSize || 20);
			const pageCount = Math.max(1, Math.ceil(vis.length / size));
			bandPageIndex = Math.min(Math.max(0, bandPageIndex), pageCount - 1);
			start = bandPageIndex * size;
			end = Math.min(vis.length, start + size);
			ctrl.pageIndex = bandPageIndex;
			ctrl.pageSize = size;
			ctrl.pageCount = pageCount;
		}
		const win = groupedWindow(layout, start, end);
		ctrl.items = vis.slice(start, end);
		ctrl.virtualStart = start;
		ctrl.virtualEnd = end;
		if (scrollMode === "virtual") {
			ctrl.virtualPadTop = win.slotsAbove * bandRowHeight;
			ctrl.virtualPadBottom = win.slotsBelow * bandRowHeight;
			ctrl.virtualRowHeight = bandRowHeight;
		} else {
			ctrl.virtualPadTop = ctrl.virtualPadBottom = 0;
			ctrl.virtualRowHeight = void 0;
		}
		ctrl.groupedWindow = win;
		ensureBandInjector();
		render();
	}
	/** Leave band mode: drop every banded buffer and the published band state. */
	function clearBands() {
		bandSeq++;
		bandReading = false;
		bandRead = null;
		bandRows = [];
		bandLayout = null;
		bandPageIndex = 0;
		ctrl.grouped = [];
		ctrl.groupedWindow = null;
		ctrl.virtualSlotCount = void 0;
		ctrl.virtualRowHeight = void 0;
	}
	async function setGrouped(next) {
		const sig = groupedSignature(next);
		const resolved = normalizeGrouped(next);
		if (sig === bandSig) {
			if (resolved) bandCfg = resolved;
			return;
		}
		const wasActive = bandsActive();
		bandSig = sig;
		bandCfg = resolved;
		bandOpen.clear();
		bandAll = null;
		if (!bandsActive()) {
			if (wasActive) {
				clearBands();
				stopBandInjector();
				if (bound) {
					applySourceSort();
					await load();
				} else sync();
			}
			return;
		}
		if (bandRead) {
			resortBands();
			relayoutBands();
			sync();
			applySourceSort();
			return;
		}
		accumulated = [];
		browserRows = null;
		await loadBanded();
	}
	/**
	* A band's fold state: a per-path choice (a click / `open()` / `close()`) wins,
	* then the last expand-all / collapse-all, then its level's `open` default.
	* Paths outlive a re-read (same keys → same path), so a search keeps the folds.
	*/
	function bandFolded(path, field) {
		const open = bandOpen.get(path);
		if (open !== void 0) return !open;
		if (bandAll) return bandAll === "closed";
		return field ? !field.open : false;
	}
	/** The level config a path belongs to (one encoded segment per level). */
	function bandFieldOf(path) {
		return bandCfg?.fields[path.split("/").length - 1];
	}
	function setBandOpen(path, open) {
		if (!bandsActive() || !path) return;
		const f = bandFieldOf(path);
		if (f && !f.collapsible) return;
		if (!bandFolded(path, f) === open) return;
		bandOpen.set(path, open);
		if (open && f && !f.stayOpen && bandCfg) {
			const cut = path.lastIndexOf("/");
			const parent = cut < 0 ? "" : path.slice(0, cut + 1);
			const depth = path.split("/").length;
			for (const p of collapsiblePaths(bandRows, bandCfg.fields)) {
				if (p === path || p.split("/").length !== depth) continue;
				if (parent ? !p.startsWith(parent) : false) continue;
				if (!bandFolded(p, f)) bandOpen.set(p, false);
			}
		}
		relayoutBands();
		sync();
	}
	function toggleGrouped(path) {
		setBandOpen(path, isGroupedCollapsed(path));
	}
	function isGroupedCollapsed(path) {
		const f = bandFieldOf(path);
		return !!f && f.collapsible && bandFolded(path, f);
	}
	function expandAllGrouped() {
		if (!bandsActive()) return;
		bandOpen.clear();
		bandAll = "open";
		relayoutBands();
		sync();
	}
	function collapseAllGrouped() {
		if (!bandsActive()) return;
		bandOpen.clear();
		bandAll = "closed";
		relayoutBands();
		sync();
	}
	function openGrouped(path) {
		setBandOpen(path, true);
	}
	function closeGrouped(path) {
		setBandOpen(path, false);
	}
	/**
	* Remember the `<table>` the band rows go into. The injector itself only exists
	* while bands are on (`ensureBandInjector`) — every table has headers calling in
	* here, and a table without bands must not pay a subscriber + observer for it.
	*/
	function bindGroupedHost(tableEl) {
		if (typeof document === "undefined") return;
		if (tableEl === bandHostEl) return;
		bandHostEl = tableEl;
		bandInjector?.stop();
		bandInjector = null;
		if (bandsActive()) ensureBandInjector();
	}
	function ensureBandInjector() {
		if (bandInjector || !bandHostEl || typeof document === "undefined") return;
		bandInjector = new BandInjector(ctrl, bandHostEl);
	}
	function stopBandInjector() {
		bandInjector?.stop();
		bandInjector = null;
	}
	/** Scroll modes only apply to a flat (ungrouped, non-server) grid. */
	function scrollActive() {
		return scrollMode !== "off" && !isGrouped() && !serverMode() && !bandsActive();
	}
	/** Map the accumulator (+ virtual window) onto `ctrl` and render. */
	function syncScroll() {
		const s = bound;
		const total = s?.totalCount?.();
		const hasTotal = typeof total === "number" && total >= 0;
		ctrl.groupTree = false;
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
		if (bandsActive()) {
			vStart = vEnd = 0;
			if (bandRead) sync();
			else if (reload && bound && !bandReading) await load();
			return;
		}
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
	function setVirtualWindow(start, end, padTop, padBottom, rowHeight) {
		if (scrollMode !== "virtual") return;
		const ns = Math.max(0, Math.floor(start));
		const ne = Math.max(ns, Math.floor(end));
		const nt = Math.max(0, Math.round(padTop));
		const nb = Math.max(0, Math.round(padBottom));
		if (bandsActive()) {
			let rh = Number(rowHeight);
			if (!(rh > 0)) {
				const below = (ctrl.virtualSlotCount ?? 0) - ne;
				rh = ns > 0 && nt > 0 ? nt / ns : below > 0 && nb > 0 ? nb / below : bandRowHeight;
			}
			if (ns === vStart && ne === vEnd && rh === bandRowHeight) return;
			vStart = ns;
			vEnd = ne;
			bandRowHeight = rh;
			sync();
			return;
		}
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
	/** What identifies an offer for the change check — a re-published identical list is a no-op. */
	const offerKey = (list) => {
		try {
			return JSON.stringify(list.map((s) => [
				s.key,
				s.count,
				s.values
			]));
		} catch {
			return String(Math.random());
		}
	};
	/** Equality-guarded so a re-published identical list costs no notify (no re-render loop). */
	function setFilterSuggestion(next) {
		const list = next == null ? [] : Array.isArray(next) ? next.filter(Boolean) : [next];
		if (offerKey(list) === offerKey(ctrl.filterSuggestions)) return;
		ctrl.filterSuggestions = list;
		ctrl.filterSuggestion = list[0] ?? null;
		notify();
	}
	async function setSearchTerms(terms) {
		ctrl.searchTerms = (terms ?? []).filter((t) => t && String(t.value ?? "") !== "");
		ctrl.filterSuggestion = null;
		ctrl.filterSuggestions = [];
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
					const from = v.from instanceof Date ? v.from : new Date(v.from);
					const to = v.to instanceof Date ? v.to : new Date(v.to);
					return inRange(d, {
						from,
						to
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
		const top = typeof options?.take === "number" && options.take >= 0 ? options.take : void 0;
		const rows = await groupCountViaApply(store, field, options?.filter ?? null, applyGate, { top });
		return rows ? sortColumnValues(rows) : null;
	}
	/** Count occurrences of `field` across `rows` into a sorted `{value,count}[]`. */
	function distinctFromRows(rows, field) {
		return sortColumnValues(countValues(rows, field));
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
		const res = await store.load(loadOpts);
		return distinctFromRows(storeRows(res), field);
	}
	async function setData(next) {
		const s = bound;
		if (typeof s?.setData !== "function") return;
		bumpSummary("data");
		await runLoad(() => s.setData(next));
		if (bandsActive()) {
			await loadBanded();
			return;
		}
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
	/**
	* The source selector a column DECLARED via `sort.selector`, if any — what the
	* DataSource / array source orders by in place of the field. Resolved like
	* `declaredSortIndex`: central `props.th` config first, then the element's own
	* `:sort.prop`. A blank string counts as not declared.
	*/
	function declaredSortSelector(field) {
		const sel = declaredSortConfig(field).selector;
		return typeof sel === "string" && sel.trim() ? sel.trim() : void 0;
	}
	/**
	* A column's declared sort OBJECT — the element's `:sort.prop` with central
	* `props.th` config merged over it (props win key by key, as everywhere). `{}`
	* for `sort: true` / no config.
	*/
	function declaredSortConfig(field) {
		const asObj = (sort) => typeof sort === "object" && sort ? sort : {};
		let fromEl = {};
		for (const el of columnEls) if (el.field === field && typeof el.sort === "object" && el.sort) {
			fromEl = asObj(el.sort);
			break;
		}
		return {
			...fromEl,
			...asObj((elementProps.th ?? []).find((c) => c?.field === field)?.sort)
		};
	}
	/**
	* Whether a sorted column is sorted IN THE BROWSER — its selector fans out over a
	* collection (`[*]`, which no source can order by) or it declares an `aggregate`.
	*/
	function isBrowserSortKey(field) {
		const sel = declaredSortSelector(field);
		return !!sel && parseFieldPath(sel).hasWildcard || !!declaredSortConfig(field).aggregate;
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
			else if (multi) {
				const at = ctrl.sorts.findIndex((s) => s.field === field);
				ctrl.sorts = at >= 0 ? ctrl.sorts.map((s) => s.field === field ? {
					field,
					order: next
				} : s) : [...ctrl.sorts, {
					field,
					order: next
				}];
			} else ctrl.sorts = [{
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
		if (bandsActive() && bandRead) {
			applySourceSort();
			bandPageIndex = 0;
			resortBands();
			relayoutBands();
			sync();
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
		ctrl.groupTree = groupFields.length > 0;
		if (groupFields.length && bandRead) {
			clearBands();
			stopBandInjector();
		}
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
		const raw = bound ? [...bound.items?.() ?? []] : [];
		const tree = buildGroups(flattenLeaves(raw), groupFields);
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
		if (groupRowPaging.delete(path)) {
			if (serverMode()) {
				groupRowsKey.delete(path);
				sync();
				fetchVisibleRows();
			} else sync();
		}
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
		if (browserRows && browserSortActive()) return [...browserRows];
		if (bandsActive() && bandRead) return [...bandRows];
		return readAllFromSource();
	}
	/** `getData`'s read — every matching row from the source, in its own order. */
	async function readAllFromSource(read = {}) {
		const s = bound;
		if (!s) return [];
		const loadOptions = {};
		if (resolvedOpts.expand !== void 0) loadOptions.expand = resolvedOpts.expand;
		if (resolvedOpts.customQueryParams !== void 0) loadOptions.customQueryParams = resolvedOpts.customQueryParams;
		suppressSync = true;
		try {
			return await readAllRows(s, {
				chunkSize: read.chunkSize ?? chunkSize,
				...read.countFirst ? { countFirst: true } : {},
				select: opts.select ?? toList(resolvedOpts.select),
				sort: mergedSort(),
				...Object.keys(loadOptions).length ? { loadOptions } : {}
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
		const source = rows ?? await getData();
		return buildGroups(source, groupFields);
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
		stopBandInjector();
		bandHostEl = null;
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
export { buildGrouped as _, checkState as a, rowToSlot as b, setAllChecked as c, columnCount as d, ensureRowHost as f, syncRowSpan as g, releaseRowHost as h, buildDateTree as i, setChecked as l, releaseOverlayHost as m, countTuples as n, minimize as o, overlayHost as p, groupCountsViaApply as r, seedFromRanges as s, monoDataGrid as t, applyOverlayHost as u, groupedWindow as v, slotToRow as x, normalizeGrouped as y };