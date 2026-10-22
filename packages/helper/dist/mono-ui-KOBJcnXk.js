//#region src/composables/mono-skeleton.ts
/**
* "Is there a DOM to render into?" — deliberately NOT lit's `isServer`. That flag is a
* build-time constant of lit's node entry, so it is `true` wherever Node's export
* conditions pick that build — including a jsdom test run, where this feature must work.
* On a real server (`@lit-labs/ssr` + its dom shim) there is a `customElements` but no
* `document`, which is exactly the distinction that matters here.
*/
const hasDom = typeof document !== "undefined" && typeof customElements !== "undefined";
/**
* ONE store per realm, on `globalThis` (same reasoning as `mono-ui.ts`): the light and
* shadow builds are separate bundles and a pnpm peer fork can install two copies of the
* package, yet all of them must agree on "active" and on the defaults.
*/
const STATE_KEY$1 = Symbol.for("mono-helper.skeleton");
const state$1 = globalThis[STATE_KEY$1] ??= {
	active: false,
	disabled: false,
	ssr: null,
	ssrSniffed: null,
	defaults: {},
	watching: false,
	createdBeforeActive: 0,
	createdBeforeActiveTags: [],
	warnedLate: false,
	waiting: /* @__PURE__ */ new Set(),
	holders: /* @__PURE__ */ new Set()
};
const PHANTOM_TAG = "phantom-ui";
const DEFAULT_MAX_WAIT = 15e3;
/** Per-element slots the Cores can read without depending on the mixin's class shape. */
const TAG_DEFAULT = Symbol.for("mono-helper.skeleton.tagDefault");
const PENDING_ACTIVE = Symbol.for("mono-helper.skeleton.active");
const PENDING_GRACE = Symbol.for("mono-helper.skeleton.grace");
const PENDING_PHANTOM = Symbol.for("mono-helper.skeleton.phantom");
/** Where `applyMonoUIDefaults` parks a tag's `pending` default (not assigned to the prop). */
const MONO_PENDING_TAG_DEFAULT = TAG_DEFAULT;
function isActive() {
	return state$1.active && !state$1.disabled;
}
/**
* Start following the registry. Idempotent; a no-op on the server. Called by the mono
* `customElement` decorator, so the watcher exists before any element constructs.
*/
function watchSkeletonActivation() {
	if (!hasDom || state$1.watching) return;
	state$1.watching = true;
	const activate = () => {
		state$1.active = true;
		if (state$1.createdBeforeActive > 0 && !state$1.warnedLate) {
			state$1.warnedLate = true;
			const tags = state$1.createdBeforeActiveTags.slice(0, 5).join(", ");
			console.warn(`[mono-skeleton] phantom-ui was defined after ${state$1.createdBeforeActive} mono element(s) had rendered (${tags}); their first paint had no skeleton. Load "@aejkatappaja/phantom-ui" before the app mounts (main.ts import, or let @mono-lit/helper/nuxt do it).`);
		}
	};
	if (customElements.get(PHANTOM_TAG)) {
		activate();
		return;
	}
	customElements.whenDefined(PHANTOM_TAG).then(activate, () => {});
}
/**
* Is this an SSR app? The explicit flag (`createMonoUI({ skeleton: { ssr } })`, which the
* Nuxt module sets from `nuxt.options.ssr`) wins; otherwise the Nuxt payload marker is
* sniffed once (`<script id="__NUXT_DATA__" data-ssr="true">`).
*/
function isMonoSsrApp() {
	if (state$1.ssr !== null) return state$1.ssr;
	if (state$1.ssrSniffed === null) state$1.ssrSniffed = hasDom && document.getElementById("__NUXT_DATA__")?.getAttribute("data-ssr") === "true";
	return state$1.ssrSniffed;
}
/** Set the global defaults (`createMonoUI`'s `skeleton` key routes here). `false` disables the skeleton. */
function setMonoSkeletonDefaults(defaults) {
	if (defaults === false) {
		state$1.disabled = true;
		return;
	}
	state$1.disabled = false;
	const { ssr, ...rest } = defaults ?? {};
	state$1.ssr = typeof ssr === "boolean" ? ssr : null;
	state$1.defaults = { ...rest };
}
function getMonoSkeletonStatus() {
	return {
		active: isActive(),
		ssr: state$1.ssr,
		createdBeforeActive: state$1.createdBeforeActive,
		createdBeforeActiveTags: [...state$1.createdBeforeActiveTags]
	};
}
/** Drop defaults / flag / counters (tests). `active` stays — an element cannot be undefined. */
function resetMonoSkeleton() {
	state$1.disabled = false;
	state$1.ssr = null;
	state$1.ssrSniffed = null;
	state$1.defaults = {};
	state$1.createdBeforeActive = 0;
	state$1.createdBeforeActiveTags = [];
	state$1.warnedLate = false;
	state$1.waiting.clear();
	state$1.holders.clear();
}
const PHANTOM_KEYS = [
	"animation",
	"mode",
	"shimmerDirection",
	"shimmerColor",
	"backgroundColor",
	"duration",
	"stagger",
	"reveal",
	"count",
	"countGap",
	"fallbackRadius",
	"loadingLabel",
	"pierceShadow",
	"debug"
];
const kebab = (name) => name.replace(/[A-Z]/g, (m) => `-${m.toLowerCase()}`);
function isPendingObject(value) {
	return !!value && typeof value === "object";
}
/** The boolean a `pending` value carries (`undefined` = auto). */
function activeOf(value) {
	if (typeof value === "boolean") return value;
	if (isPendingObject(value)) return typeof value.active === "boolean" ? value.active : void 0;
}
/** Only the phantom options of a value (an object), as a plain record. */
function phantomOf(value) {
	const out = {};
	if (!isPendingObject(value)) return out;
	for (const key of PHANTOM_KEYS) {
		const v = value[key];
		if (v !== void 0) out[key] = v;
	}
	return out;
}
function shallowEqual(a, b) {
	const ka = Object.keys(a);
	const kb = Object.keys(b);
	if (ka.length !== kb.length) return false;
	for (const k of ka) if (a[k] !== b[k]) return false;
	return true;
}
/** `hasChanged` for the property: booleans by value, objects shallowly. */
function pendingChanged(next, prev) {
	if (isPendingObject(next) && isPendingObject(prev)) return !shallowEqual(next, prev);
	return next !== prev;
}
/**
* The attribute converter. The attribute form is boolean-only: `pending`,
* `pending="true"` → true; `pending="false"` → false; absent or `pending="auto"` → auto.
* A real boolean is accepted too (what a server renderer hands over).
*/
const pendingConverter = {
	fromAttribute(value) {
		if (value === null || value === void 0) return void 0;
		if (typeof value === "boolean") return value;
		const s = String(value).trim().toLowerCase();
		if (s === "auto") return void 0;
		return s === "" || s === "true";
	},
	toAttribute() {
		return null;
	}
};
/**
* Register the `pending` property on a registered element class. Called by the mono
* `customElement` decorator BEFORE `customElements.define`, so the attribute lands in
* Lit's attribute map when `observedAttributes` is read.
*/
function registerPendingProperty(cls) {
	cls.createProperty("pending", {
		attribute: "pending",
		reflect: false,
		converter: pendingConverter,
		hasChanged: pendingChanged
	});
}
/** Whether `pending` currently resolves to true for `el` (set before each render). */
function monoPendingActive(el) {
	return !!el[PENDING_ACTIVE];
}
/**
* True once one macrotask has passed since the element first resolved pending — lets a
* `'data'` Core say "no controller / source after one tick → nothing to wait for" without
* releasing before a binding made in the consumer's `onMounted`.
*/
function monoPendingGrace(el) {
	return !!el[PENDING_GRACE];
}
/**
* The phantom options resolved for `el` while pending (element object over tag default
* over global default), camelCase keys. Empty while not pending. For `'custom'` Cores
* that render their own `<phantom-ui>` and want a value in the template (e.g. `count`).
*/
function monoPhantomOptions(el) {
	return el[PENDING_PHANTOM] ?? {};
}
/**
* Apply the resolved phantom options to a `<phantom-ui>` element as attributes (used by
* the mixin for its wrapper, and by `'custom'` Cores for the phantom they render).
* Diffed against what was last applied to that element, so unchanged values cost nothing.
*/
function monoApplyPhantomOptions(el, target) {
	if (!target) return;
	const next = el[PENDING_PHANTOM] ?? {};
	const store = target;
	const prev = store[PENDING_PHANTOM] ?? {};
	if (shallowEqual(next, prev)) return;
	for (const key of /* @__PURE__ */ new Set([...Object.keys(prev), ...Object.keys(next)])) {
		const value = next[key];
		const attr = kebab(key);
		if (value === void 0 || value === null || value === false) target.removeAttribute(attr);
		else if (value === true) target.setAttribute(attr, "");
		else target.setAttribute(attr, String(value));
	}
	store[PENDING_PHANTOM] = { ...next };
}
/** @internal */
const monoSkeletonInternals = {
	hasDom,
	isActive,
	state: state$1,
	slots: {
		TAG_DEFAULT,
		PENDING_ACTIVE,
		PENDING_GRACE,
		PENDING_PHANTOM
	},
	activeOf,
	phantomOf,
	PHANTOM_TAG,
	DEFAULT_MAX_WAIT
};
/** The `<phantom-ui>` wrapper the skeleton mixin renders around an element's content. */
function isMonoSkeletonWrapper(node) {
	return !!node && node.nodeType === 1 && node.localName === PHANTOM_TAG && node.hasAttribute("mono-skeleton");
}
/** `Array.from(host.childNodes)` minus the skeleton wrapper. */
function monoHostChildNodes(host) {
	return Array.from(host.childNodes).filter((n) => !isMonoSkeletonWrapper(n));
}
/** `Array.from(host.children)` minus the skeleton wrapper. */
function monoHostChildren(host) {
	return Array.from(host.children).filter((n) => !isMonoSkeletonWrapper(n));
}

//#endregion
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
//#region src/components/table/column-autosize.ts
/**
* Content-sized columns — what `mono-table-th`'s `width="auto"` drives.
*
* Under `mono-table-fixed` (`table-layout: fixed`) CSS cannot do this: an `auto` column takes
* the WHOLE surplus instead of fitting its content, and `min-width` / `max-width` on a cell are
* ignored by the table algorithm. So the column is measured here and handed a concrete px width,
* clamped to `minWidth` / `maxWidth`, written to its `<col>` (which wins under fixed layout) and
* to the header cell.
*
* Text is measured with a canvas, not read back from the cell: reading the cell's own width would
* return the width last written, and a column could then never shrink. Measuring text also keeps
* the pass free of layout reads, so re-running it on every change is cheap.
*
* What is measured: the header (caption + its icons), every body cell and every FOOTER cell of
* the column. The footer matters — a `<mono-table-summary>` total covers the whole set, so a
* virtual-scroll window that only shows small figures still sizes for the largest one.
*
* Cell content is treated as one line (what a money column is). An editor (`<input>`, including
* the one inside `mono-input`) counts with its value and its own padding / border.
*/
/** The text measurer — swappable so tests can run where there is no canvas (jsdom). */
const autosizeEnv = { measure: defaultMeasure };
let ctx;
function defaultMeasure(text, font) {
	if (ctx === void 0) ctx = document.createElement("canvas").getContext("2d");
	if (!ctx) return text.length * 8;
	ctx.font = font;
	return ctx.measureText(text).width;
}
/**
* A canvas `font` string for a computed style — always built from the longhands.
*
* NOT `style.font`: the shorthand serialises to `''` whenever a longhand it cannot express is set,
* and `font-variant-numeric: tabular-nums` (every `mono-table-summary`) is one. The old fallback then
* put `fontVariant` (`tabular-nums`) into the string, canvas rejected it, kept its default
* `10px sans-serif`, and a footer total measured far too narrow — the largest figure ellipsed.
* Only `small-caps` is a variant canvas takes; tabular figures are handled in `measureStyled`.
*/
function fontOf(style) {
	const caps = style.fontVariantCaps === "small-caps" ? "small-caps" : "";
	return [
		style.fontStyle,
		caps,
		style.fontWeight,
		style.fontSize,
		style.fontFamily
	].filter(Boolean).join(" ");
}
const px = (v) => parseFloat(v) || 0;
/** The widest digit in `font` — a tabular figure's advance, which canvas cannot be asked for. */
const digitWidths = /* @__PURE__ */ new Map();
function maxDigit(font) {
	let w = digitWidths.get(font);
	if (w === void 0) {
		w = Math.max(..."0123456789".split("").map((d) => autosizeEnv.measure(d, font)));
		digitWidths.set(font, w);
	}
	return w;
}
/**
* `text` as the element renders it: its `text-transform`, its `letter-spacing` (canvas ignores
* both) and its `font-variant-numeric: tabular-nums` (every digit at the widest digit's advance —
* a safe upper bound; tabular figures are wider than the proportional ones canvas measures).
*/
function measureStyled(text, style) {
	const font = fontOf(style);
	if (style.textTransform === "uppercase") text = text.toUpperCase();
	else if (style.textTransform === "lowercase") text = text.toLowerCase();
	let width;
	if (/tabular-nums/.test(style.fontVariantNumeric ?? "")) {
		const digits = text.replace(/\D/g, "").length;
		width = autosizeEnv.measure(text.replace(/\d/g, ""), font) + digits * maxDigit(font);
	} else width = autosizeEnv.measure(text, font);
	return width + px(style.letterSpacing) * text.length;
}
/** Horizontal padding + border of an element's box. */
function boxX(style) {
	return px(style.paddingLeft) + px(style.paddingRight) + px(style.borderLeftWidth) + px(style.borderRightWidth);
}
/**
* A size prop as px: a number / bare numeric string / `px` → px, `rem` → × the root font size,
* `em` → × `el`'s font size. Anything else (`%`, `auto`, a var) → `undefined`: not a bound.
*/
function cssLengthToPx(value, el) {
	if (value == null) return void 0;
	if (typeof value === "number") return Number.isFinite(value) ? value : void 0;
	const m = /^\s*(-?\d+(?:\.\d+)?)\s*(px|rem|em)?\s*$/i.exec(value);
	if (!m) return void 0;
	const n = parseFloat(m[1]);
	const unit = (m[2] ?? "px").toLowerCase();
	if (unit === "px") return n;
	const ref = unit === "rem" ? document.documentElement : el ?? document.documentElement;
	return n * (px(getComputedStyle(ref).fontSize) || 16);
}
/** `w` clamped to `[min, max]`; an unset bound does not clamp. `min` wins over a smaller `max`. */
function clampWidth(w, min, max) {
	if (max != null) w = Math.min(w, max);
	if (min != null) w = Math.max(w, min);
	return w;
}
/**
* The grid column a header cell STARTS at — a walk over its section's rows honouring `rowspan`
* and `colspan`, so a leaf header under a band row (`<th colspan>` above it) maps to its real
* column. `cellIndex` alone would count only the cells of its own row.
*/
function headerColumnIndex(cell) {
	const section = cell.parentElement?.parentElement;
	if (!section) return cell.cellIndex;
	const taken = [];
	const rows = Array.from(section.children).filter((r) => r.tagName === "TR");
	for (let r = 0; r < rows.length; r++) {
		taken[r] ??= [];
		let c = 0;
		for (const cur of Array.from(rows[r].cells)) {
			while (taken[r][c]) c++;
			if (cur === cell) return c;
			for (let dr = 0; dr < Math.max(1, cur.rowSpan); dr++) {
				const row = taken[r + dr] ??= [];
				for (let dc = 0; dc < Math.max(1, cur.colSpan); dc++) row[c + dc] = true;
			}
			c += Math.max(1, cur.colSpan);
		}
	}
	return cell.cellIndex;
}
/** The single-column cell of `row` at grid column `col` — a spanning cell (a spacer row) is none. */
function cellAt(row, col) {
	let c = 0;
	for (const cell of Array.from(row.cells)) {
		const span = Math.max(1, cell.colSpan);
		if (c === col) return span === 1 ? cell : void 0;
		if (c > col) return void 0;
		c += span;
	}
}
/** The `<col>` at grid column `col`, honouring `<col span>`. */
function colAt(table, col) {
	let c = 0;
	for (const group of Array.from(table.children).filter((e) => e.tagName === "COLGROUP")) {
		const cols = Array.from(group.children).filter((e) => e.tagName === "COL");
		for (const el of cols) {
			const span = Math.max(1, el.span || 1);
			if (col < c + span) return span === 1 ? el : void 0;
			c += span;
		}
	}
}
/** An element hidden by `v-show` / `hidden` — its text does not show, so it does not count. */
function isHidden(el) {
	return el.hidden === true || el.style?.display === "none";
}
/** The one-line width a cell's content needs, padding included. */
function contentWidth(cell) {
	let width = 0;
	const walk = (node) => {
		for (const child of Array.from(node.childNodes)) if (child.nodeType === Node.TEXT_NODE) {
			const text = (child.textContent ?? "").replace(/\s+/g, " ");
			if (!text.trim()) continue;
			const parent = child.parentElement ?? node.host ?? cell;
			width += measureStyled(text, getComputedStyle(parent));
		} else if (child.nodeType === Node.ELEMENT_NODE) {
			const el = child;
			if (isHidden(el)) continue;
			if (el.tagName === "INPUT" || el.tagName === "TEXTAREA") {
				const input = el;
				const style = getComputedStyle(input);
				width += measureStyled(input.value || input.placeholder || "", style) + boxX(style);
				continue;
			}
			if (el.tagName === "SVG" || el.tagName === "svg") {
				width += el.getBoundingClientRect?.().width || 0;
				continue;
			}
			walk(el.shadowRoot ?? el);
		}
	};
	walk(cell);
	return width + boxX(getComputedStyle(cell));
}
/** The header cell's need: the caption text plus whatever icons sit beside it. */
function headerWidth(cell, host) {
	const label = host.querySelector("[data-mono-slot=\"label\"]");
	const text = (label?.textContent ?? host.textContent ?? "").replace(/\s+/g, " ").trim();
	let width = text ? measureStyled(text, getComputedStyle(label ?? host)) : 0;
	for (const icon of Array.from(host.querySelectorAll(".mono-th-filter-ind, .mono-table-sort-btn:not(.label-trigger), .mono-th-required"))) {
		const w = icon.getBoundingClientRect?.().width || 0;
		width += w ? w + 4 : 0;
	}
	return width + boxX(getComputedStyle(cell));
}
/**
* One auto-sized column, owned by its `mono-table-th`. `schedule()` coalesces every trigger (a
* controller notify, a body mutation, typing in an editor) into one measurement per frame.
*/
var ColumnAutoSize = class {
	constructor(host) {
		this.host = host;
		this._raf = 0;
		this._onInput = (e) => {
			const t = e.target;
			if (t && this._table && !this._table.tHead?.contains(t)) this.schedule();
		};
		this._onFonts = () => {
			digitWidths.clear();
			this.schedule();
		};
	}
	schedule() {
		if (this._raf) return;
		this._raf = requestAnimationFrame(() => {
			this._raf = 0;
			this._run();
		});
	}
	/** Stop watching, and hand the column back to whatever width it is given next. */
	stop(clear = false) {
		if (this._raf) cancelAnimationFrame(this._raf);
		this._raf = 0;
		this._unwatch();
		if (clear && this._wrote) {
			if (this._wrote.col) this._wrote.col.style.width = "";
			this._wrote.cell.style.width = "";
		}
		this._wrote = void 0;
	}
	_watch(table) {
		if (this._table === table) return;
		this._unwatch();
		this._table = table;
		this._observer = new MutationObserver((records) => {
			const head = table.tHead;
			if (records.some((r) => !head?.contains(r.target))) this.schedule();
		});
		this._observer.observe(table, {
			childList: true,
			characterData: true,
			subtree: true
		});
		table.addEventListener("input", this._onInput, true);
		document.fonts?.addEventListener?.("loadingdone", this._onFonts);
	}
	_unwatch() {
		this._observer?.disconnect();
		this._observer = void 0;
		this._table?.removeEventListener("input", this._onInput, true);
		document.fonts?.removeEventListener?.("loadingdone", this._onFonts);
		this._table = void 0;
	}
	_run() {
		const cell = this.host.closest("th, td");
		const table = cell?.closest("table");
		if (!cell || !table || !this.host.isConnected) return;
		this._watch(table);
		const index = headerColumnIndex(cell);
		let width = headerWidth(cell, this.host);
		const sections = [...Array.from(table.tBodies), ...table.tFoot ? [table.tFoot] : []];
		for (const section of sections) for (const row of Array.from(section.rows)) {
			const target = cellAt(row, index);
			if (target) width = Math.max(width, contentWidth(target));
		}
		width = Math.ceil(clampWidth(width + 1, this.min, this.max));
		const value = `${width}px`;
		const col = colAt(table, index);
		if (cell.style.width !== value) cell.style.width = value;
		if (col && col.style.width !== value) col.style.width = value;
		this._wrote = {
			col,
			cell
		};
	}
};

//#endregion
//#region src/composables/mono-size-attrs.ts
const ATTRS = [
	"mono-width",
	"mono-min-width",
	"mono-max-width"
];
const SELECTOR = ATTRS.map((a) => `[${a}]`).join(", ");
/** Auto-sized cells and their sizers — a cell that loses `auto` or the document gets stopped. */
const sizers = /* @__PURE__ */ new Map();
let observer = null;
const isCell = (el) => el.tagName === "TH" || el.tagName === "TD";
/** Apply the three attributes to one element. Re-run whenever one of them changes. */
function applyMonoSizeAttributes(el) {
	const width = el.getAttribute("mono-width")?.trim() ?? "";
	const min = el.getAttribute("mono-min-width")?.trim() ?? "";
	const max = el.getAttribute("mono-max-width")?.trim() ?? "";
	const auto = width.toLowerCase() === "auto";
	el.style.minWidth = min ? toCssSize(min) ?? "" : "";
	el.style.maxWidth = max ? toCssSize(max) ?? "" : "";
	if (!isCell(el)) {
		el.style.width = auto ? "fit-content" : width ? toCssSize(width) ?? "" : "";
		return;
	}
	let sizer = sizers.get(el);
	if (!auto) {
		if (sizer) {
			sizer.stop(true);
			sizers.delete(el);
		}
		el.style.width = width ? toCssSize(width) ?? "" : "";
		return;
	}
	if (!sizer) sizers.set(el, sizer = new ColumnAutoSize(el));
	sizer.min = cssLengthToPx(min || null, el);
	sizer.max = cssLengthToPx(max || null, el);
	sizer.schedule();
}
/** Stop the sizers of cells that left the document. */
function sweep() {
	for (const [el, sizer] of sizers) {
		if (el.isConnected) continue;
		sizer.stop();
		sizers.delete(el);
	}
}
function scan(root) {
	if (root instanceof HTMLElement && root.matches(SELECTOR)) applyMonoSizeAttributes(root);
	for (const el of Array.from(root.querySelectorAll(SELECTOR))) applyMonoSizeAttributes(el);
}
/**
* Turn the attributes on for the whole document — idempotent, so every caller may call it.
* Returns a stop function (tests; an app never needs it).
*/
function startMonoSizeAttributes() {
	if (typeof document === "undefined" || typeof MutationObserver === "undefined") return () => {};
	if (!observer) {
		observer = new MutationObserver((records) => {
			let removed = false;
			for (const r of records) {
				if (r.type === "attributes") {
					applyMonoSizeAttributes(r.target);
					continue;
				}
				for (const node of Array.from(r.addedNodes)) if (node.nodeType === 1) scan(node);
				if (r.removedNodes.length) removed = true;
			}
			if (removed) sweep();
		});
		observer.observe(document.documentElement, {
			subtree: true,
			childList: true,
			attributes: true,
			attributeFilter: [...ATTRS]
		});
		scan(document);
	}
	return stopMonoSizeAttributes;
}
function stopMonoSizeAttributes() {
	observer?.disconnect();
	observer = null;
	for (const sizer of sizers.values()) sizer.stop();
	sizers.clear();
}

//#endregion
//#region src/composables/mono-ui.ts
const STATE_KEY = Symbol.for("mono-helper.ui");
const state = globalThis[STATE_KEY] ??= {
	store: null,
	createdTotal: 0,
	createdTags: [],
	createdBeforeConfig: 0,
	createdBeforeConfigTags: [],
	warned: /* @__PURE__ */ new Set()
};
const SHADOW_PREFIX = "mono-shadow-";
function warnOnce(key, message) {
	if (state.warned.has(key)) return;
	state.warned.add(key);
	console.warn(`[mono-ui] ${message}`);
}
const camel = (name) => name.replace(/-([a-z0-9])/g, (_m, c) => c.toUpperCase());
/** Arrays and plain objects are copied per element, so one element cannot mutate the shared config. */
function fresh(value) {
	if (Array.isArray(value)) return [...value];
	if (value && typeof value === "object" && Object.getPrototypeOf(value) === Object.prototype) return { ...value };
	return value;
}
/**
* Set the app-wide default props. Call once, first — usually in `main.ts`:
*
* ```ts
* app.use(createMonoUI({ 'mono-button': { size: 'xs' } }))
* // or simply
* createMonoUI({ 'mono-button': { size: 'xs' } })
* ```
*
* A later call replaces the previous config for elements created afterwards.
*/
function createMonoUI(config = {}) {
	const next = {};
	setMonoSkeletonDefaults(config.skeleton);
	for (const [tag, props] of Object.entries(config)) {
		if (tag === "skeleton") continue;
		if (!/^mono-[a-z0-9-]+$/.test(tag)) {
			warnOnce(`tag:${tag}`, `"${tag}" is not a mono component tag — expected "mono-<name>". Ignored.`);
			continue;
		}
		if (!props || typeof props !== "object") continue;
		next[tag] = { ...props };
	}
	state.createdBeforeConfig = state.createdTotal;
	state.createdBeforeConfigTags = [...state.createdTags];
	if (state.createdTotal > 0 && typeof document !== "undefined") {
		const tags = state.createdTags.slice(0, 5).join(", ") + (state.createdTags.length > 5 ? ", …" : "");
		console.warn(`[mono-ui] createMonoUI() ran after ${state.createdTotal} mono element${state.createdTotal === 1 ? " was" : "s were"} created (${tags}); ${state.createdTotal === 1 ? "it keeps its" : "those keep their"} built-in defaults. Call createMonoUI() first in main.ts, before app.mount().`);
	}
	state.store = next;
	startMonoSizeAttributes();
	return {
		config: { ...next },
		install() {}
	};
}
/** The current config, or `null` when `createMonoUI` has not been called. */
function getMonoUI() {
	return state.store;
}
/** Whether the config is set, and how many elements were created before it was. */
function getMonoUIStatus() {
	return {
		configured: state.store !== null,
		createdBefore: state.store ? state.createdBeforeConfig : state.createdTotal,
		createdBeforeTags: state.store ? [...state.createdBeforeConfigTags] : [...state.createdTags]
	};
}
/** Drop the config (tests, or reconfiguring before mount). Elements created afterwards get built-in defaults. */
function resetMonoUI() {
	resetMonoSkeleton();
	state.store = null;
	state.createdTotal = 0;
	state.createdTags.length = 0;
	state.createdBeforeConfig = 0;
	state.createdBeforeConfigTags = [];
	state.warned.clear();
}
/**
* Apply the configured defaults to a freshly constructed element. Called by the
* mono `customElement` decorator at the end of construction — not public API.
* @internal
*/
function applyMonoUIDefaults(el, tag) {
	state.createdTotal++;
	if (!state.createdTags.includes(tag)) state.createdTags.push(tag);
	if (!state.store) return;
	const base = tag.startsWith(SHADOW_PREFIX) ? `mono-${tag.slice(12)}` : tag;
	const props = {
		...state.store[base] ?? {},
		...base !== tag ? state.store[tag] ?? {} : {}
	};
	for (const [key, value] of Object.entries(props)) {
		if (value === void 0) continue;
		const prop = camel(key);
		if (prop === "pending") {
			el[MONO_PENDING_TAG_DEFAULT] = fresh(value);
			continue;
		}
		if (!(prop in el)) {
			warnOnce(`prop:${base}:${prop}`, `<${base}> has no prop "${key}". Ignored.`);
			continue;
		}
		el[prop] = fresh(value);
	}
}

//#endregion
export { resetMonoSkeleton as C, registerPendingProperty as S, monoHostChildren as _, resetMonoUI as a, monoPhantomOptions as b, stopMonoSizeAttributes as c, buildSizeStyle as d, toCssSize as f, monoHostChildNodes as g, monoApplyPhantomOptions as h, getMonoUIStatus as i, ColumnAutoSize as l, isMonoSsrApp as m, createMonoUI as n, applyMonoSizeAttributes as o, getMonoSkeletonStatus as p, getMonoUI as r, startMonoSizeAttributes as s, applyMonoUIDefaults as t, cssLengthToPx as u, monoPendingActive as v, watchSkeletonActivation as w, monoSkeletonInternals as x, monoPendingGrace as y };