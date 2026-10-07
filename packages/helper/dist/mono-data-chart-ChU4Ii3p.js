import { n as isPath, t as getFieldValue } from "./field-path-C92eGLg3.js";
import { r as readAllRows } from "./data-source-read-DL88aH8t.js";
import { n as andPredicates, r as compileFilterPredicate, t as andFilters } from "./filter-eval-DIfU2EAn.js";
import { a as resolveDataSourceOptions, d as createApplyGate, f as isRolledUp, h as monoArraySource, i as normalizeSortList, n as extraLoadOptions, o as toList, p as loadApply, r as mergeDataSourceOptions, u as summaryFilterOf } from "./data-source-options-CQSTZHPE.js";
import { t as arrayToODataString } from "./filter-odata-C1vSGZaY.js";
import { t as createNotifier } from "./notifier-CE4yxMUQ.js";
//#region src/components/chart/chart-odata.ts
/**
* `MonoChartAgg` → the OData aggregate keyword. Every value the chart supports has
* an exact equivalent, so the server path never has to fall back to draining.
*/
var ODATA_AGG = {
	sum: "sum",
	avg: "average",
	min: "min",
	max: "max",
	count: "$count"
};
/** A dotted path (`Job.Budget`) addresses a nav property as `Job/Budget` in OData. */
var toODataPath = (field) => field.replaceAll(".", "/");
/**
* Build `groupby((<groupBy>),aggregate(<field> with <agg> as <field>, …))`.
*
* Each aggregate is aliased back to **its own series field**, which is what lets
* the result flow through the chart's existing projection untouched: one row per
* bucket, and re-aggregating a single value is the identity. No special-casing
* downstream, and a client-side roll-up and a server-side one render identically.
*
* `count` has no operand, so it emits `$count as <field>`.
*/
function buildChartApply(groupBy, series = []) {
	const key = toODataPath(groupBy);
	const aggregates = series.filter((s) => s?.field).map((s) => {
		const agg = ODATA_AGG[s.agg ?? "sum"] ?? "sum";
		return agg === "$count" ? `$count as ${s.field}` : `${toODataPath(s.field)} with ${agg} as ${s.field}`;
	});
	return aggregates.length ? `groupby((${key}),aggregate(${aggregates.join(",")}))` : `groupby((${key}))`;
}
/**
* Compose a filter with a groupby: `filter(<expr>)/groupby(…)`.
*
* Filtering INSIDE `$apply` (rather than as a sibling `$filter`) is what keeps the
* two composable — the filter runs first and the aggregation sees only matching
* rows, which is the whole point of doing this server-side.
*/
function composeApply(apply, filter) {
	const expr = arrayToODataString(filter);
	return expr ? `filter(${expr})/${apply}` : apply;
}
/**
* Compose the request an `odata` chart sends — pure, so the merge of
* `odata.options` with the controller's base (`dataSourceOptions` /
* `odataOptions`) and the `$apply` folding can be asserted without a network.
*
* The base's `filter` is AND-ed under `odata.options.filter`; its `select` /
* `expand` / `sort` / `paginate` become load options; its `customQueryParams`
* become raw params beside `$apply`. On the `$apply` path the composed filter
* travels INSIDE the clause (that is what keeps it composable with the grouping)
* and is removed from the load options so it is not also sent as a sibling
* `$filter`; `paginate` is forced off so every bucket comes back.
*/
function buildChartOdataRequest(input) {
	const base = input.base ?? {};
	const { customQueryParams, ...rest } = mergeDataSourceOptions(input.options ?? {}, base);
	const options = { ...rest };
	const params = { ...customQueryParams ?? {} };
	if (typeof input.aggregate === "function") {
		const groupBy = input.groupBy;
		if (!groupBy) throw new Error("[mono-chart] `odata.aggregate` needs a `groupBy` — there is nothing to group by.");
		const apply = buildChartApply(groupBy, input.series);
		const filter = options.filter;
		params.$apply = input.aggregate({
			apply,
			filter,
			odataFilter: arrayToODataString,
			withFilter: (a, f) => composeApply(a, f === void 0 ? filter : f),
			groupBy,
			series: [...input.series]
		});
		delete options.filter;
		options.paginate = false;
	}
	return {
		options,
		params,
		aggregated: params.$apply !== void 0
	};
}
//#endregion
//#region src/components/chart/mono-data-chart.ts
/**
* Default palette, expressed as mono color NAMES rather than literals so a chart
* follows the active theme out of the box — exactly like every other component.
* These are Basecoat's own chart colours: the element resolves each name through
* `--_mono-chart-<name>` → `--mono-chart-*` → `--chart-1` … `--chart-5` at paint
* time, so a colour preset, a flavour or dark mode recolours charts too. Past
* five series the roles follow, so a sixth dataset is still its own colour.
*/
var DEFAULT_COLORS = [
	"chart-1",
	"chart-2",
	"chart-3",
	"chart-4",
	"chart-5",
	"success",
	"warning",
	"danger"
];
/**
* Values used when nobody has resolved a name yet — a controller used headlessly
* (reading `data()` in Node), or before an element mounts. ONE's light tokens,
* so the shape is right even without a DOM.
*/
var NAME_FALLBACK = {
	"chart-1": "oklch(0.859 0.069 267.7)",
	"chart-2": "oklch(0.735 0.12 268.04)",
	"chart-3": "oklch(0.61 0.12 267.95)",
	"chart-4": "oklch(0.485 0.119 267.92)",
	"chart-5": "oklch(0.36 0.12 268.21)",
	primary: "oklch(0.299 0.119 267.96)",
	secondary: "oklch(0.554 0.041 257.42)",
	accent: "oklch(0.735 0.12 268.04)",
	success: "oklch(0.5239 0.0917 180.004)",
	warning: "oklch(0.5423 0.1066 70.504)",
	danger: "oklch(0.561 0.202 26.71)",
	info: "oklch(0.431 0.163 267.72)",
	surface: "oklch(0.973 0.007 268.55)"
};
/** Read a row field, honouring path expressions (`Job.Name`, `Items.[*].Total`). */
function fieldValue(row, field) {
	if (row == null) return void 0;
	if (!isPath(field)) return row[field];
	const v = getFieldValue(row, field);
	return Array.isArray(v) ? v[0] : v;
}
/** Coerce to a finite number, or null when the value isn't numeric. */
function num(value) {
	if (value == null || value === "") return null;
	const n = typeof value === "number" ? value : Number(value);
	return Number.isFinite(n) ? n : null;
}
/** Apply an aggregate to a bucket of raw values. */
function aggregate(values, agg) {
	if (agg === "count") return values.length;
	const nums = values.map(num).filter((n) => n != null);
	if (!nums.length) return agg === "sum" ? 0 : null;
	switch (agg) {
		case "sum": return nums.reduce((a, b) => a + b, 0);
		case "avg": return nums.reduce((a, b) => a + b, 0) / nums.length;
		case "min": return Math.min(...nums);
		case "max": return Math.max(...nums);
		default: return null;
	}
}
/** Parse `#rgb` / `#rrggbb` / `rgb(r,g,b)` to channels; null if unrecognised. */
function toRgb(color) {
	const s = color.trim();
	const hex = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(s);
	if (hex) {
		const h = hex[1].length === 3 ? hex[1].replace(/./g, (c) => c + c) : hex[1];
		const n = parseInt(h, 16);
		return [
			n >> 16 & 255,
			n >> 8 & 255,
			n & 255
		];
	}
	const rgb = /^rgba?\(\s*([\d.]+)[\s,]+([\d.]+)[\s,]+([\d.]+)/i.exec(s);
	if (rgb) return [
		Number(rgb[1]),
		Number(rgb[2]),
		Number(rgb[3])
	];
	return null;
}
/** Shift a color's lightness by `delta` (-1…1), preserving hue and saturation. */
function shiftLightness(color, delta) {
	const rgb = toRgb(color);
	if (!rgb) return color;
	const [r, g, b] = rgb.map((v) => v / 255);
	const max = Math.max(r, g, b);
	const min = Math.min(r, g, b);
	const l = (max + min) / 2;
	const d = max - min;
	const s = d === 0 ? 0 : d / (1 - Math.abs(2 * l - 1));
	let h = 0;
	if (d !== 0) {
		if (max === r) h = (g - b) / d % 6;
		else if (max === g) h = (b - r) / d + 2;
		else h = (r - g) / d + 4;
		h *= 60;
		if (h < 0) h += 360;
	}
	const nl = Math.min(.92, Math.max(.08, l + delta));
	const c = (1 - Math.abs(2 * nl - 1)) * s;
	const x = c * (1 - Math.abs(h / 60 % 2 - 1));
	const m = nl - c / 2;
	const [r1, g1, b1] = h < 60 ? [
		c,
		x,
		0
	] : h < 120 ? [
		x,
		c,
		0
	] : h < 180 ? [
		0,
		c,
		x
	] : h < 240 ? [
		0,
		x,
		c
	] : h < 300 ? [
		x,
		0,
		c
	] : [
		c,
		0,
		x
	];
	const out = [
		r1,
		g1,
		b1
	].map((v) => Math.round((v + m) * 255));
	return `rgb(${out[0]}, ${out[1]}, ${out[2]})`;
}
/**
* Make every entry visually distinct.
*
* A token set may ALIAS roles — in ONE, `--success` and `--teal` are the same
* colour, and a consumer's own preset can fold two more. That's fine for UI (a chip is either "info" or
* "secondary"), but a chart drawing two series in the same colour is unreadable.
* On a collision, step the lightness until the colour is unused.
*
* Only applied to the DEFAULT palette — an explicit `colors` list is honoured
* exactly as written, duplicates included.
*/
function distinctColors(list) {
	const seen = /* @__PURE__ */ new Set();
	return list.map((color) => {
		let candidate = color;
		for (let i = 1; seen.has(candidate.toLowerCase()) && i <= 6; i++) candidate = shiftLightness(color, (i % 2 ? 1 : -1) * .14 * Math.ceil(i / 2));
		seen.add(candidate.toLowerCase());
		return candidate;
	});
}
/** True for a raw chart.js `data` object (as opposed to a row array / DataSource). */
function isRawData(value) {
	return !!value && typeof value === "object" && !Array.isArray(value) && Array.isArray(value.datasets);
}
/** Types that colour each POINT rather than each dataset. */
function isPerPointType(type) {
	return type === "pie" || type === "doughnut" || type === "polarArea";
}
function monoChart(source = null, opts = {}) {
	let bound = null;
	let raw = null;
	let rows = [];
	/** Rows per label index, so a click can report what produced the point. */
	let buckets = [];
	let projected = {
		labels: [],
		datasets: []
	};
	let instance = null;
	/**
	* How many drains are in flight. A COUNTER, not a flag: `bind()` starts one
	* sync and a following `reload()` starts another, so two drains overlap — with
	* a boolean the first one to finish cleared it and the chart reported "done"
	* while the second was still fetching chunks.
	*
	* Also guards the re-entrant `changed` echo while a drain is running.
	*/
	let drainDepth = 0;
	/**
	* Whether `rows` came back already rolled up by the server (`odata.aggregate`).
	* Read by `project()`, which must not re-apply each series' `agg` to a bucket
	* that is already a single aggregated row.
	*/
	let preAggregated = false;
	/**
	* The `$apply`-through-the-store switch for a bound source: off by option
	* (`serverApply: false`), or off for good once the backend rejected one.
	*/
	const applyGate = createApplyGate(opts.serverApply !== false);
	let series = opts.series ? [...opts.series] : [];
	let colors = opts.colors?.length ? [...opts.colors] : [...DEFAULT_COLORS];
	/** Only the DEFAULT palette gets de-duplicated; an explicit list is honoured as written. */
	let paletteIsDefault = !opts.colors?.length;
	/**
	* Turns a mono color NAME into a real value. Falls back to the static token
	* values until an element installs the DOM-aware version — the controller has
	* no DOM, and only the element can read the `--_mono-chart-*` tokens (which is
	* also what makes the palette follow a live theme change).
	*/
	let resolveColor = (c) => NAME_FALLBACK[c] ?? c;
	const notifier = createNotifier();
	const notify = notifier.notify;
	const elementProps = { ...opts.props ?? {} };
	/** Build `{ labels, datasets }` from the current rows + series config. */
	function project() {
		if (raw) {
			projected = raw;
			buckets = [];
			return;
		}
		const groupBy = opts.groupBy;
		const labelField = opts.labelField ?? groupBy;
		const specs = series.length ? series : inferSeries();
		let labels;
		let groups;
		if (groupBy) {
			const order = [];
			const map = /* @__PURE__ */ new Map();
			for (const row of rows) {
				const value = fieldValue(row, groupBy);
				const key = String(value);
				let entry = map.get(key);
				if (!entry) {
					entry = {
						label: value,
						rows: []
					};
					map.set(key, entry);
					order.push(key);
				}
				entry.rows.push(row);
			}
			labels = order.map((k) => map.get(String(k)).label);
			groups = order.map((k) => map.get(String(k)).rows);
		} else {
			labels = labelField ? rows.map((r) => fieldValue(r, labelField)) : rows.map((_, i) => i + 1);
			groups = rows.map((r) => [r]);
		}
		const perPoint = isPerPointType(ctrl.type);
		const resolved = colors.map(resolveColor);
		const palette = paletteIsDefault ? distinctColors(resolved) : resolved;
		const datasets = specs.map((spec, i) => {
			/**
			* Rows that arrived pre-aggregated (`odata.aggregate`) are already one per
			* bucket, so the series' own `agg` must NOT run again — it would re-reduce a
			* single value. `sum` is the identity there for `sum`/`min`/`max`/`avg`, but
			* `count` is not: counting one rolled-up row yields 1 and throws away the
			* server's `$count`. Reading the value covers every agg uniformly.
			*/
			const agg = preAggregated ? "sum" : spec.agg ?? "sum";
			const data = groups.map((bucket) => {
				const values = bucket.map((row) => fieldValue(row, spec.field));
				if ((preAggregated || !groupBy) && bucket.length === 1 && agg === "sum") return num(values[0]);
				return aggregate(values, agg);
			});
			const color = spec.color ? resolveColor(spec.color) : palette[i % palette.length];
			const base = {
				label: spec.label ?? spec.field,
				data,
				backgroundColor: perPoint ? labels.map((_, j) => palette[j % palette.length]) : color,
				borderColor: perPoint ? resolveColor("surface") : color
			};
			if (spec.type) base.type = spec.type;
			return spec.dataset ? {
				...base,
				...spec.dataset
			} : base;
		});
		projected = {
			labels,
			datasets
		};
		buckets = groups;
	}
	/**
	* With no `series`, chart every numeric field on the first row except the
	* label/group field — so `monoChart(rows, { labelField: 'month' })` just works.
	*/
	function inferSeries() {
		const first = rows[0];
		if (!first) return [];
		const skip = new Set([opts.labelField, opts.groupBy].filter(Boolean));
		return Object.keys(first).filter((k) => !skip.has(k) && num(first[k]) != null).map((field) => ({ field }));
	}
	const onChanged = () => {
		if (drainDepth > 0) return;
		sync();
	};
	/**
	* Publish the loading state, notifying only on a real change.
	*
	* The DataSource's own `isLoading()` is NOT enough: a draining chart reads the
	* STORE directly (`readAllRows`), which never goes through the DataSource and so
	* never flips its loading flag. Reporting only `isLoading()` made the chart look
	* finished while chunk after chunk was still in flight — `draining` is the half
	* that covers it.
	*/
	function setLoading(next) {
		if (ctrl.loading === next) return;
		ctrl.loading = next;
		notify();
	}
	const syncLoading = () => {
		setLoading(drainDepth > 0 || (bound?.isLoading?.() ?? false));
	};
	const onLoadingChanged = () => {
		syncLoading();
		notify();
	};
	function detach() {
		if (!bound) return;
		bound.off("changed", onChanged);
		bound.off("loadingChanged", onLoadingChanged);
		bound.off("loadError", onLoadingChanged);
		bound = null;
	}
	let dsOptionsSource = opts.dataSourceOptions;
	let odataOptionsSource = opts.odataOptions;
	let resolvedOpts = {};
	/** The consumer's own `ds.filter(...)`, adopted (page path only). */
	let externalBase = null;
	/** What the source HELD after this controller's last `filter()` write (read back). */
	let lastWrittenFilter = null;
	let lastComposed = void 0;
	let composeMemo = null;
	function resolveBase() {
		resolvedOpts = resolveDataSourceOptions(dsOptionsSource, odataOptionsSource);
		return resolvedOpts;
	}
	/** A base `filter` for the source at hand: arrays and predicates as-is, a raw OData string dropped for an array source. */
	function baseFilterFor(s) {
		const f = resolvedOpts.filter;
		if (f == null) return null;
		if (typeof s?.store === "function" && !!s.store()) return f;
		if (typeof f === "function") return f;
		if (Array.isArray(f) && f.length === 1 && typeof f[0] === "string") return null;
		return compileFilterPredicate(f);
	}
	/**
	* `loadAll: false` — the source's own page is what renders, so the base goes
	* onto the source. Adoption rule as in the grid: what the source holds that is
	* not this controller's last write is the consumer's, and becomes the base.
	*/
	function applyBaseToSource(s) {
		if (typeof s.filter === "function") {
			const live = s.filter() ?? null;
			if (live !== lastWrittenFilter) externalBase = live;
			const own = baseFilterFor(s);
			const remote = typeof s.store === "function" && !!s.store();
			let next;
			if (composeMemo && composeMemo.own === own && composeMemo.ext === externalBase) next = composeMemo.out;
			else {
				next = remote ? andFilters(own, externalBase) : andPredicates(own, externalBase);
				composeMemo = {
					own,
					ext: externalBase,
					out: next
				};
			}
			if (next !== lastComposed || (s.filter() ?? null) !== lastWrittenFilter) {
				s.filter(next);
				lastComposed = next;
				lastWrittenFilter = s.filter() ?? null;
			}
		}
		if (resolvedOpts.select !== void 0 && typeof s.select === "function") s.select(toList(resolvedOpts.select) ?? null);
		if (resolvedOpts.sort !== void 0 && typeof s.sort === "function") s.sort(normalizeSortList(resolvedOpts.sort));
		const lo = typeof s.loadOptions === "function" ? s.loadOptions() : null;
		if (lo && typeof lo === "object") Object.assign(lo, extraLoadOptions(resolvedOpts));
	}
	/**
	* The bound source rolled up by the SERVER: ONE
	* `$apply=filter(…)/groupby((groupBy),aggregate(…))` through the source's own
	* store, one row per bucket, instead of draining every row to bucket them
	* here. Same clause `odata.aggregate` builds, same transport the grid's header
	* filter and summary use (`utils/data-source-apply`).
	*
	* `null` is the decline, and the drain is still the definition of the result:
	* the path switched off (`serverApply: false`, or a backend that already
	* rejected an `$apply` — the gate remembers), no `groupBy`, no explicit
	* `series` (the clause needs the fields; `inferSeries` reads them off rows
	* that are not there yet), a store that cannot carry an `$apply` (a
	* CustomStore), a failed request, or rows that are not buckets (a server that
	* ignored the clause hands back entities — `isRolledUp`).
	*
	* The filter is what the drain would see: the base ∧ the source's live
	* `filter()` ∧ its search, folded INSIDE the clause.
	*/
	async function rollUpViaStore(s) {
		if (applyGate.skip || !opts.groupBy) return null;
		const specs = series.filter((sp) => sp?.field);
		if (!specs.length) return null;
		const store = typeof s.store === "function" ? s.store() : null;
		if (!store) return null;
		const apply = buildChartApply(opts.groupBy, specs);
		const filter = andFilters(baseFilterFor(s), summaryFilterOf(s));
		let rolled;
		try {
			rolled = await loadApply(store, composeApply(apply, filter));
		} catch (err) {
			applyGate.reject(err);
			return null;
		}
		if (!rolled) return null;
		return isRolledUp(rolled, [opts.groupBy, ...specs.map((sp) => sp.field)]) ? rolled : null;
	}
	/** Mirror the source's rows onto `ctrl`, re-project, then notify. */
	async function sync() {
		preAggregated = false;
		resolveBase();
		if (!bound) rows = [];
		else if (opts.loadAll === false) rows = [...bound.items?.() ?? []];
		else {
			drainDepth++;
			syncLoading();
			try {
				const rolled = await rollUpViaStore(bound);
				if (rolled) {
					rows = rolled;
					preAggregated = true;
				} else {
					const base = resolvedOpts;
					const filter = baseFilterFor(bound);
					const loadOptions = extraLoadOptions(base);
					const isArray = !(typeof bound.store === "function" && bound.store());
					const drained = await readAllRows(bound, {
						chunkSize: opts.chunkSize ?? 100,
						...filter != null && !isArray ? { filter } : {},
						...base.select !== void 0 ? { select: toList(base.select) } : {},
						...base.sort !== void 0 ? { sort: normalizeSortList(base.sort) } : {},
						...Object.keys(loadOptions).length ? { loadOptions } : {}
					});
					rows = isArray && typeof filter === "function" ? drained.filter(filter) : drained;
				}
			} finally {
				drainDepth--;
				syncLoading();
			}
		}
		ctrl.items = rows;
		project();
		notify();
	}
	function bind(next) {
		if (isRawData(next)) {
			detach();
			raw = next;
			rows = [];
			ctrl.items = rows;
			ctrl.dataSource = null;
			project();
			notify();
			return;
		}
		raw = null;
		const src = Array.isArray(next) ? monoArraySource(next, { pageSize: 0 }) : next;
		if (bound === src) return;
		detach();
		bound = src;
		ctrl.dataSource = src;
		if (!src) {
			sync();
			return;
		}
		src.on("changed", onChanged);
		src.on("loadingChanged", onLoadingChanged);
		src.on("loadError", onLoadingChanged);
		sync();
	}
	/**
	* Load through `monoOdataFetch`.
	*
	* With `odata.aggregate` this is ONE request: the server rolls the data up with
	* `$apply` and returns a row per bucket, instead of the chart draining every row
	* to sum them locally. Without it, rows are fetched normally and `options`
	* (`select` / `filter` / `take`) is what keeps the payload small.
	*
	* `@mono-lit/utility` is imported on demand — it is an OPTIONAL peer, so a consumer that
	* never sets `odata` neither installs nor loads it (same arrangement as
	* `chart.js` itself).
	*/
	async function loadOdata() {
		const od = opts.odata;
		if (!od?.url) return;
		let fetching;
		try {
			fetching = await import("@mono-lit/utility/fetching");
		} catch (err) {
			throw new Error("[mono-chart] `odata` needs the optional peer dependency \"@mono-lit/utility\". Install it in your app: pnpm add @mono-lit/utility" + (err?.message ? ` (original error: ${err.message})` : ""));
		}
		const request = buildChartOdataRequest({
			options: od.options,
			base: resolveBase(),
			aggregate: od.aggregate,
			groupBy: opts.groupBy,
			series
		});
		setLoading(true);
		try {
			const res = await fetching.monoOdataFetch({
				baseUrl: od.baseUrl,
				configBaseUrl: od.configBaseUrl,
				url: od.url,
				method: od.method,
				type: "data",
				notif: false,
				options: request.options,
				...Object.keys(request.params).length ? { params: request.params } : {}
			});
			if (res?.error) throw new Error(res.error.message ?? "odata request failed");
			rows = res?.data ?? [];
			preAggregated = request.aggregated;
		} finally {
			setLoading(false);
		}
		ctrl.items = rows;
		project();
		notify();
	}
	async function reload() {
		if (opts.odata?.url) {
			await loadOdata();
			return;
		}
		drainDepth++;
		syncLoading();
		try {
			if (opts.loadAll === false && bound?.load) {
				resolveBase();
				applyBaseToSource(bound);
				await bound.load();
			}
			await sync();
		} finally {
			drainDepth--;
			syncLoading();
		}
	}
	async function setDataSourceOptions(next) {
		dsOptionsSource = next;
		await reload();
	}
	async function setOdataOptions(next) {
		odataOptionsSource = next;
		await reload();
	}
	function resolvedDataSourceOptions() {
		return resolvedOpts;
	}
	function setType(next) {
		if (ctrl.type === next) return;
		ctrl.type = next;
		project();
		notify();
	}
	function setSeries(next) {
		series = [...next];
		project();
		notify();
	}
	function setColors(next) {
		colors = next.length ? [...next] : [...DEFAULT_COLORS];
		paletteIsDefault = !next.length;
		project();
		notify();
	}
	function setData(next) {
		preAggregated = false;
		bind(next);
	}
	/** Resolve a clicked point back to the rows that produced it. */
	function pointEvent(datasetIndex, index) {
		return {
			index,
			datasetIndex,
			label: projected.labels?.[index],
			value: projected.datasets[datasetIndex]?.data?.[index],
			rows: buckets[index] ?? []
		};
	}
	const ctrl = {
		items: rows,
		loading: false,
		type: opts.type ?? "bar",
		dataSource: null,
		get instance() {
			return instance;
		},
		data: () => projected,
		options: () => opts.options ?? {},
		props: () => elementProps,
		/**
		* Merge, not replace — a partial patch leaves everything else alone.
		* `undefined` values pass straight through: `applyProps` skips them on the
		* write side, so "not declared" can never clobber a value the template set.
		*/
		setProps(patch) {
			if (!patch) return;
			Object.assign(elementProps, patch);
			notify();
		},
		setType,
		setSeries,
		setColors,
		setData,
		bind,
		reload,
		refresh: reload,
		setDataSourceOptions,
		setOdataOptions,
		resolvedDataSourceOptions,
		onPointClick: null,
		subscribe: notifier.subscribe,
		dispose() {
			detach();
			notifier.clear();
			instance = null;
		},
		_attachInstance(next) {
			instance = next;
		},
		_setColorResolver(fn) {
			resolveColor = fn ?? ((c) => NAME_FALLBACK[c] ?? c);
			project();
			notify();
		}
	};
	ctrl._emitPoint = (d, i) => {
		ctrl.onPointClick?.(pointEvent(d, i));
	};
	if (source) bind(source);
	else project();
	if (!source && opts.odata?.url) loadOdata().catch((err) => {
		console.error("[mono-chart] odata load failed:", err);
	});
	return ctrl;
}
//#endregion
export { composeApply as i, buildChartApply as n, buildChartOdataRequest as r, monoChart as t };
