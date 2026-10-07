import { f as monoPendingGrace } from "../mono-ui-CPV7rrdo.js";
import { n as detachEventHandlers, t as applyProps } from "../element-props-CLB6yvbm.js";
import { i as composeApply, n as buildChartApply, r as buildChartOdataRequest, t as monoChart } from "../mono-data-chart-ChU4Ii3p.js";
import { t as customElement } from "../mono-element-B0kP_96P.js";
import { a as defineHybridPropAliases, i as defineHybridPropAlias, o as numberStringConverter, r as booleanStringConverter, t as __decorate } from "../decorate-DEXtNagw.js";
import { n as toCssSize } from "../css-size-DhHSVZJK.js";
import { LitElement, html, isServer, nothing, unsafeCSS } from "lit";
import { property, query, state } from "lit/decorators.js";
import { styleMap } from "lit/directives/style-map.js";
//#region src/components/chart/chart-core.ts
/**
* The mono color names a chart accepts wherever a color is expected. They map to
* the `--_mono-chart-<name>` resolvers in chart.css, which chain through the
* public `--mono-chart-*` overrides to the Basecoat tokens — `chart-1` … `chart-5`
* are Basecoat's own chart palette (`--chart-1` … `--chart-5`), the roles are the
* page's. `surface` is internal: the hairline between slices.
*/
var MONO_COLOR_NAMES = new Set([
	"chart-1",
	"chart-2",
	"chart-3",
	"chart-4",
	"chart-5",
	"primary",
	"secondary",
	"accent",
	"success",
	"warning",
	"danger",
	"info",
	"surface"
]);
/** Used before the element is in the DOM (SSR) or if a token resolves empty — ONE, light. */
var MONO_COLOR_FALLBACK = {
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
/** The tooltip lines come from the data (labels, formatted values) — never markup. */
function escapeHtml(s) {
	return s.replace(/[&<>"']/g, (c) => ({
		"&": "&amp;",
		"<": "&lt;",
		">": "&gt;",
		"\"": "&quot;",
		"'": "&#39;"
	})[c]);
}
/**
* Cached loader for the OPTIONAL `chart.js` peer.
*
* `chart.js/auto` self-registers every controller/scale/element — the right
* trade here because the library is externalized, so the consumer's bundler
* owns the cost and tree-shaking on our side would buy nothing.
*/
var _chartPromise = null;
function loadChartJs() {
	_chartPromise ??= import("chart.js/auto").then((m) => m?.default ?? m).catch((err) => {
		_chartPromise = null;
		throw new Error("[mono-chart] needs the optional peer dependency \"chart.js\". Install it in your app: pnpm add chart.js@4.5.1" + (err?.message ? ` (original error: ${err.message})` : ""));
	});
	return _chartPromise;
}
/**
* `MonoChartCore` — render-mode-agnostic logic for the chart elements.
*
* It owns the imperative Chart.js lifecycle, following the same shape as the
* flatpickr wrapper in `date-core.ts`: create in `firstUpdated` behind an
* `isServer` guard and a dynamic import, split `updated()` into a cheap data
* update vs a full rebuild, and destroy in `disconnectedCallback` BEFORE
* `super`. A `ResizeObserver` is added on top because, unlike flatpickr, a
* canvas needs to be told when its box changes.
*/
var MonoChartCore = (superClass) => {
	class MonoChartCoreClass extends superClass {
		constructor(...args) {
			super(...args);
			this.aspectRatio = 2;
			this.legend = true;
			this.title = "";
			this.stacked = false;
			this.cssClass = {};
			this.cssClassName = "";
			this._error = "";
			this._chart = null;
			this._buildToken = 0;
			this._onThemeChanged = () => {
				if (isServer || !this._chart) return;
				requestAnimationFrame(() => {
					if (!this._chart) return;
					const palette = this._colors;
					if (palette?.length) this.dataChart?.setColors(palette);
					else this.dataChart?._setColorResolver((c) => this._resolveColor(c));
					this.rebuild();
				});
			};
			this._applyQueued = false;
			this._externalTooltip = (context) => {
				const el = this._tooltipEl;
				if (!el) return;
				const tip = context.tooltip;
				if (!tip || tip.opacity === 0) {
					el.removeAttribute("data-open");
					el.setAttribute("aria-hidden", "true");
					return;
				}
				const title = tip.title ?? [];
				const bodies = (tip.body ?? []).map((b) => b.lines ?? []);
				const colors = tip.labelColors ?? [];
				const parts = [];
				for (const t of title) parts.push(`<div class="mono-chart-tooltip-title">${escapeHtml(String(t))}</div>`);
				bodies.forEach((lines, i) => {
					const swatch = colors[i]?.backgroundColor ?? colors[i]?.borderColor;
					for (const line of lines) {
						const m = /^(.*?):\s*(.+)$/.exec(String(line));
						const text = m ? `<span class="mono-chart-tooltip-label">${escapeHtml(m[1])}</span><span class="mono-chart-tooltip-value">${escapeHtml(m[2])}</span>` : `<span class="mono-chart-tooltip-label">${escapeHtml(String(line))}</span>`;
						parts.push(`<div class="mono-chart-tooltip-row">${swatch ? `<span class="mono-chart-tooltip-swatch" style="background:${escapeHtml(String(swatch))}"></span>` : ""}${text}</div>`);
					}
				});
				el.innerHTML = parts.join("");
				const width = el.parentElement?.clientWidth ?? context.chart.width;
				const gap = 8;
				el.setAttribute("data-open", "");
				el.setAttribute("aria-hidden", "false");
				const h = el.offsetHeight;
				const w = el.offsetWidth;
				const side = tip.caretY - h - gap < 0 ? "bottom" : "top";
				el.setAttribute("data-side", side);
				const x = Math.min(Math.max(tip.caretX, w / 2), Math.max(width - w / 2, w / 2));
				el.style.left = `${x}px`;
				el.style.top = `${tip.caretY}px`;
			};
			defineHybridPropAliases(this, [
				"dataChart",
				"chartOptions",
				"aspectRatio",
				"cssClass"
			]);
			defineHybridPropAlias(this, "controlChart", "dataChart");
			for (const alias of ["css-class", "cssclass"]) Object.defineProperty(this, alias, {
				get: () => this.cssClass,
				set: (value) => this._setCssClass(value),
				configurable: true,
				enumerable: false
			});
		}
		static {
			this.monoPendingAuto = "data";
		}
		_monoPendingReady() {
			const ctrl = this.dataChart;
			if (!ctrl) return this.data != null || monoPendingGrace(this);
			if (ctrl.loading) return false;
			return monoPendingGrace(this) || ctrl.data().datasets.length > 0;
		}
		static {
			this._rebuildKeys = [
				"type",
				"chartOptions",
				"legend",
				"title",
				"stacked",
				"aspectRatio"
			];
		}
		static get observedAttributes() {
			return [
				...super.observedAttributes ?? [],
				"aspectratio",
				"chartoptions",
				"css-class",
				"cssclass",
				"colors"
			];
		}
		attributeChangedCallback(name, old, value) {
			super.attributeChangedCallback(name, old, value);
			if (old === value) return;
			if (name === "css-class" || name === "cssclass") this._setCssClass(value);
			else if (name === "colors") this.colors = value ?? void 0;
		}
		_setCssClass(value) {
			if (value == null) {
				this.cssClass = {};
				this.cssClassName = "";
				return;
			}
			if (typeof value === "object") {
				this.cssClass = value;
				return;
			}
			const trimmed = String(value).trim();
			if (!trimmed) {
				this.cssClass = {};
				this.cssClassName = "";
				return;
			}
			if (trimmed.startsWith("{") && trimmed.endsWith("}")) try {
				this.cssClass = JSON.parse(trimmed);
				return;
			} catch {}
			this.cssClassName = trimmed;
		}
		/** The live chart.js instance, or null before it mounts. */
		get chart() {
			return this._chart;
		}
		connectedCallback() {
			super.connectedCallback();
			this._subscribe();
			if (!isServer) {
				window.addEventListener("theme-changed", this._onThemeChanged);
				this._watchMode();
			}
		}
		disconnectedCallback() {
			this._off?.();
			this._off = void 0;
			if (!isServer) {
				window.removeEventListener("theme-changed", this._onThemeChanged);
				this._modeObserver?.disconnect();
				this._modeObserver = void 0;
				this._modeQuery?.removeEventListener("change", this._onThemeChanged);
				this._modeQuery = void 0;
			}
			this._destroyChart();
			super.disconnectedCallback();
		}
		/**
		* Dark mode is the same tokens flipped by the `.dark` class on `<html>` /
		* `<body>` (or the OS, under `color-scheme: system`) — and nothing fires
		* `theme-changed` for that: VitePress's appearance toggle and a consumer's
		* own switch just swap the class. Watch the class and the media query and
		* treat a flip exactly like a theme change.
		*/
		_watchMode() {
			if (typeof MutationObserver === "undefined") return;
			let dark = document.documentElement.classList.contains("dark") || document.body?.classList.contains("dark");
			this._modeObserver = new MutationObserver(() => {
				const next = document.documentElement.classList.contains("dark") || document.body?.classList.contains("dark");
				if (next === dark) return;
				dark = next;
				this._onThemeChanged();
			});
			this._modeObserver.observe(document.documentElement, {
				attributes: true,
				attributeFilter: ["class"]
			});
			if (document.body) this._modeObserver.observe(document.body, {
				attributes: true,
				attributeFilter: ["class"]
			});
			this._modeQuery = window.matchMedia?.("(prefers-color-scheme: dark)");
			this._modeQuery?.addEventListener?.("change", this._onThemeChanged);
		}
		willUpdate(changed) {
			super.willUpdate?.(changed);
			if (changed.has("dataChart")) this._subscribe();
		}
		_subscribe() {
			this._off?.();
			detachEventHandlers(this);
			this._off = this.dataChart?.subscribe(() => {
				this._scheduleApplyProps();
				this.requestUpdate();
			});
			if (!isServer) this.dataChart?._setColorResolver((c) => this._resolveColor(c));
			this._scheduleApplyProps();
		}
		/**
		* Drive the apply from `update()` as well as `_subscribe()` — every render
		* reaches here, so a controller that arrives late (or a `setProps` between
		* subscriptions) can't be missed. Same arrangement as
		* `table-controller-core`, which documents why `_subscribe` alone is fragile.
		*/
		update(changed) {
			this._scheduleApplyProps();
			super.update(changed);
		}
		/**
		* Deferred + de-duplicated: the apply writes reactive props, and doing that
		* inside the update cycle would trip Lit's change-in-update warning.
		*/
		_scheduleApplyProps() {
			if (isServer) return;
			if (this._applyQueued) return;
			if (typeof queueMicrotask !== "function") {
				this._applyControllerProps();
				return;
			}
			this._applyQueued = true;
			queueMicrotask(() => {
				this._applyQueued = false;
				this._applyControllerProps();
			});
		}
		/**
		* Pull `controlMonoChart({ props })` onto this element, so the template needs
		* nothing but the controller binding.
		*
		* The CONTROLLER WINS for keys it declares (matching `controlMonoTable` and
		* `controlMonoForm`); keys it doesn't mention are left to whatever the
		* template set. `applyProps` supplies the skip-undefined, read-only and
		* equality guards. `?.props` is optional-called so a controller built before
		* this option existed simply contributes nothing.
		*/
		_applyControllerProps() {
			applyProps(this, this.dataChart?.props?.());
		}
		/**
		* Effective type. A preset's locked type wins (a `<mono-chart-pie>` is a pie),
		* then an explicit element `type`, then the controller's, then `'bar'`.
		*/
		get _type() {
			return this._presetType ?? this.type ?? this.dataChart?.type ?? "bar";
		}
		/** Effective data: the element's raw `data` wins, else the controller's. */
		get _data() {
			return this.data ?? this.dataChart?.data() ?? {
				labels: [],
				datasets: []
			};
		}
		get _loading() {
			return !!this.dataChart?.loading;
		}
		get _empty() {
			const d = this._data;
			return !d.datasets?.length || d.datasets.every((s) => !s.data?.length);
		}
		/** Palette from the `colors` prop, as an array. */
		/** The raw `colors` prop as a list, before name resolution. */
		get _colorList() {
			const c = this.colors;
			if (!c) return null;
			if (Array.isArray(c)) return c.filter(Boolean);
			return String(c).split(",").map((s) => s.trim()).filter(Boolean);
		}
		/**
		* The palette handed to Chart.js: the `colors` list if given, else the single
		* `color` accent, else null (the controller keeps its own default).
		* Mono color NAMES are resolved to real values here — see `_resolveColor`.
		*/
		get _colors() {
			const list = this._colorList ?? (this.color ? [this.color] : null);
			if (!list?.length) return null;
			return list.map((c) => this._resolveColor(c));
		}
		/**
		* The element's own computed style scope.
		*
		* Read from the inner `.mono-chart` wrapper, not the host: in the shadow
		* build the custom properties are declared inside the shadow root, so the
		* host would return empty strings.
		*/
		_styleScope() {
			if (isServer) return null;
			return this.renderRoot?.querySelector?.(".mono-chart") ?? this;
		}
		/**
		* Turn a mono color NAME into the value the canvas needs.
		*
		* Chart.js paints onto a bitmap and never resolves `var()`, so `success` (or
		* a literal `var(--x)`) would render as transparent. Names map to the
		* component's `--_mono-chart-*` resolvers, which chain through the public
		* `--mono-chart-*` overrides down to the Basecoat tokens — so a consumer
		* who re-themes the app gets re-themed charts for free. Anything that isn't
		* a known name (a hex, `rgb()`, `hsl()`) is passed through untouched.
		*/
		_resolveColor(value) {
			const name = value.trim();
			if (!MONO_COLOR_NAMES.has(name)) return name;
			const scope = this._styleScope();
			if (!scope) return MONO_COLOR_FALLBACK[name] ?? name;
			const prop = name.startsWith("chart-") ? `--_mono-chart-${name.slice(6)}` : `--_mono-chart-${name}`;
			return getComputedStyle(scope).getPropertyValue(prop).trim() || MONO_COLOR_FALLBACK[name] || name;
		}
		/**
		* The inks and type Chart.js paints the chrome with — read off the element's
		* own box, where chart.css resolved them from the Basecoat tokens: legend
		* and title in `--foreground`, ticks in `--muted-foreground`, the grid in
		* `--border`, the tooltip as a popover, the page font at text-xs.
		*/
		_themeColors() {
			const fallback = {
				text: "oklch(0.372 0.039 257.29)",
				muted: "oklch(0.554 0.041 257.42)",
				grid: "oklch(0.929 0.013 255.51)",
				tooltipBg: "oklch(1 0 0)",
				tooltipColor: "oklch(0.372 0.039 257.29)",
				tooltipBorder: "oklch(0.929 0.013 255.51)",
				fontFamily: "ui-sans-serif, system-ui, sans-serif",
				fontSize: 12,
				radius: 8,
				barRadius: 8
			};
			const scope = this._styleScope();
			if (!scope) return fallback;
			const cs = getComputedStyle(scope);
			const read = (name, fb) => cs.getPropertyValue(name).trim() || fb;
			const px = (v, fb, min = 1) => {
				const n = parseFloat(v);
				return Number.isFinite(n) && n >= min ? n : fb;
			};
			return {
				text: read("--_mono-chart-text", fallback.text),
				muted: read("--_mono-chart-muted", fallback.muted),
				grid: read("--_mono-chart-grid", fallback.grid),
				tooltipBg: read("--_mono-chart-tooltip-bg", fallback.tooltipBg),
				tooltipColor: read("--_mono-chart-tooltip-color", fallback.tooltipColor),
				tooltipBorder: read("--_mono-chart-tooltip-border", fallback.tooltipBorder),
				fontFamily: cs.fontFamily || fallback.fontFamily,
				fontSize: px(cs.fontSize, fallback.fontSize),
				radius: px(cs.borderTopLeftRadius, fallback.radius, 0),
				barRadius: px(getComputedStyle(this.renderRoot?.querySelector?.(".mono-chart-canvas-wrap") ?? scope).borderTopLeftRadius, fallback.barRadius, 0)
			};
		}
		/** Merge the element's presentational props with the consumer's raw options. */
		_buildOptions() {
			const theme = this._themeColors();
			const legendOn = this.legend !== false && this.legend !== "false";
			const legendPos = typeof this.legend === "string" && this.legend !== "true" ? this.legend : "top";
			const scaled = this._type !== "pie" && this._type !== "doughnut" && this._type !== "polarArea";
			const base = {
				responsive: true,
				maintainAspectRatio: !this.height,
				aspectRatio: this.aspectRatio,
				font: {
					family: theme.fontFamily,
					size: theme.fontSize
				},
				color: theme.text,
				plugins: {
					legend: {
						display: legendOn,
						position: legendPos,
						labels: {
							color: theme.text,
							font: {
								family: theme.fontFamily,
								size: theme.fontSize
							},
							boxWidth: theme.fontSize,
							boxHeight: theme.fontSize,
							useBorderRadius: true,
							borderRadius: Math.round(theme.fontSize / 4)
						}
					},
					title: this.title ? {
						display: true,
						text: this.title,
						color: theme.text,
						font: {
							family: theme.fontFamily,
							size: theme.fontSize + 2,
							weight: 500
						}
					} : { display: false },
					tooltip: {
						enabled: false,
						external: this._externalTooltip,
						backgroundColor: theme.tooltipBg,
						titleColor: theme.tooltipColor,
						bodyColor: theme.tooltipColor,
						borderColor: theme.tooltipBorder,
						borderWidth: 1,
						cornerRadius: theme.radius,
						padding: {
							x: 12,
							y: 6
						},
						titleFont: {
							family: theme.fontFamily,
							size: theme.fontSize,
							weight: 500
						},
						bodyFont: {
							family: theme.fontFamily,
							size: theme.fontSize
						},
						boxPadding: 4,
						usePointStyle: true
					}
				},
				onClick: (_e, els) => {
					const hit = els?.[0];
					if (!hit) return;
					this.dataChart?._emitPoint?.(hit.datasetIndex, hit.index);
				}
			};
			if (scaled) {
				base.elements = { bar: { borderRadius: theme.barRadius } };
				base.interaction = {
					mode: "index",
					intersect: false
				};
				base.scales = {
					x: {
						stacked: this.stacked,
						ticks: {
							color: theme.muted,
							font: {
								family: theme.fontFamily,
								size: theme.fontSize
							}
						},
						grid: { color: theme.grid },
						border: { color: theme.grid }
					},
					y: {
						stacked: this.stacked,
						ticks: {
							color: theme.muted,
							font: {
								family: theme.fontFamily,
								size: theme.fontSize
							}
						},
						grid: { color: theme.grid },
						border: { color: theme.grid }
					}
				};
			}
			return deepMerge(deepMerge(base, this.dataChart?.options() ?? {}), this.chartOptions ?? {});
		}
		async firstUpdated(changed) {
			super.firstUpdated?.(changed);
			if (isServer) return;
			this.dataChart?._setColorResolver((c) => this._resolveColor(c));
			const palette = this._colors;
			if (palette?.length) this.dataChart?.setColors(palette);
			this._syncTypeToController();
			await this._createChart();
		}
		updated(changed) {
			super.updated?.(changed);
			if (isServer) return;
			if (changed.has("colors") || changed.has("color")) {
				const palette = this._colors;
				if (palette?.length) this.dataChart?.setColors(palette);
			}
			this._syncTypeToController();
			if (!this._chart) {
				if (!this._error && !this._empty) this._createChart();
				return;
			}
			if (MonoChartCoreClass._rebuildKeys.some((k) => changed.has(k))) {
				this.rebuild();
				return;
			}
			if (this._chart.config?.type !== this._type) {
				this.rebuild();
				return;
			}
			this._applyData();
		}
		/**
		* Tell the controller which type actually won.
		*
		* The projection depends on it: pie-family charts colour every SLICE, bar
		* and line colour each DATASET. A preset (`<mono-chart-pie>`) fixes its type
		* on the element, so without this the controller would still think it was
		* projecting for the default `bar` and every slice would come out the same
		* colour. `setType` early-returns when unchanged, so this settles in one
		* extra update rather than looping.
		*
		* NOTE: the type is controller state, so pointing a bar element and a pie
		* element at ONE shared controller makes them fight — give each its own.
		*/
		_syncTypeToController() {
			const grid = this.dataChart;
			if (grid && grid.type !== this._type) grid.setType(this._type);
		}
		async _createChart() {
			if (isServer || this._chart) return;
			if (!this._canvas) return;
			const token = ++this._buildToken;
			let Chart;
			try {
				Chart = await loadChartJs();
			} catch (err) {
				this._error = err?.message ?? String(err);
				return;
			}
			if (token !== this._buildToken || !this.isConnected || !this._canvas) return;
			try {
				this._chart = new Chart(this._canvas, {
					type: this._type,
					data: this._cloneData(),
					options: this._buildOptions()
				});
				this._error = "";
				this.dataChart?._attachInstance(this._chart);
				this._observeResize();
			} catch (err) {
				this._error = err?.message ?? String(err);
			}
		}
		/**
		* Hand chart.js its own copy. It mutates `data` in place (adding computed
		* metadata), so sharing the controller's projected object would corrupt it.
		*/
		_cloneData() {
			const d = this._data;
			return {
				labels: [...d.labels ?? []],
				datasets: (d.datasets ?? []).map((s) => ({
					...s,
					data: [...s.data ?? []]
				}))
			};
		}
		_applyData() {
			if (!this._chart) return;
			const next = this._cloneData();
			this._chart.data.labels = next.labels;
			this._chart.data.datasets = next.datasets;
			this._chart.update();
		}
		/** Destroy + recreate. Needed for `type` and structural option changes. */
		rebuild() {
			if (isServer) return;
			this._destroyChart();
			this._createChart();
		}
		_destroyChart() {
			this._buildToken++;
			this._ro?.disconnect();
			this._ro = void 0;
			try {
				this._chart?.destroy();
			} catch {}
			this._chart = null;
			this.dataChart?._attachInstance(null);
			this._tooltipEl?.removeAttribute("data-open");
		}
		/**
		* Chart.js `responsive` already listens for window resizes, but not for a
		* container that changes size on its own (a sidebar opening, a flex reflow).
		*/
		_observeResize() {
			if (this._ro || typeof ResizeObserver === "undefined") return;
			const wrap = this.renderRoot?.querySelector?.(".mono-chart-canvas-wrap");
			if (!wrap) return;
			this._ro = new ResizeObserver(() => this._chart?.resize());
			this._ro.observe(wrap);
		}
		_cls(base, key) {
			const extra = this.cssClass?.[key];
			return extra ? `${base} ${extra}` : base;
		}
		get _rootClasses() {
			return [
				"mono-chart",
				this._loading ? "loading" : "",
				this.cssClassName,
				this.cssClass?.root
			].filter(Boolean).join(" ");
		}
		_wrapStyle() {
			const s = {};
			const w = toCssSize(this.width);
			const h = toCssSize(this.height);
			if (w) s.width = w;
			if (h) s.height = h;
			return s;
		}
		renderChart() {
			return html`
        <div class=${this._rootClasses}>
          ${this._error ? html`<div class=${this._cls("mono-chart-message error", "message")} role="alert">
                ${this._error}
              </div>` : nothing}
          <div class="mono-chart-canvas-wrap" style=${styleMap(this._wrapStyle())}>
            <canvas class=${this._cls("", "canvas")} role="img"></canvas>
            <div class="mono-chart-tooltip" role="tooltip" aria-hidden="true"></div>
          </div>
        </div>
      `;
		}
	}
	__decorate([property({ attribute: false })], MonoChartCoreClass.prototype, "dataChart", void 0);
	__decorate([property({ type: String })], MonoChartCoreClass.prototype, "type", void 0);
	__decorate([property({ attribute: false })], MonoChartCoreClass.prototype, "data", void 0);
	__decorate([property({ attribute: false })], MonoChartCoreClass.prototype, "chartOptions", void 0);
	__decorate([property({ type: String })], MonoChartCoreClass.prototype, "width", void 0);
	__decorate([property({ type: String })], MonoChartCoreClass.prototype, "height", void 0);
	__decorate([property({
		attribute: "aspect-ratio",
		converter: numberStringConverter
	})], MonoChartCoreClass.prototype, "aspectRatio", void 0);
	__decorate([property()], MonoChartCoreClass.prototype, "legend", void 0);
	__decorate([property({ type: String })], MonoChartCoreClass.prototype, "title", void 0);
	__decorate([property({ converter: booleanStringConverter })], MonoChartCoreClass.prototype, "stacked", void 0);
	__decorate([property({ type: String })], MonoChartCoreClass.prototype, "color", void 0);
	__decorate([property({ attribute: false })], MonoChartCoreClass.prototype, "colors", void 0);
	__decorate([property({ attribute: false })], MonoChartCoreClass.prototype, "cssClass", void 0);
	__decorate([property({ attribute: false })], MonoChartCoreClass.prototype, "cssClassName", void 0);
	__decorate([state()], MonoChartCoreClass.prototype, "_error", void 0);
	__decorate([query("canvas")], MonoChartCoreClass.prototype, "_canvas", void 0);
	__decorate([query(".mono-chart-tooltip")], MonoChartCoreClass.prototype, "_tooltipEl", void 0);
	return MonoChartCoreClass;
};
/** Shallow-recursive merge; arrays and non-plain values are replaced wholesale. */
function deepMerge(base, over) {
	const out = { ...base };
	for (const [k, v] of Object.entries(over)) {
		const prev = out[k];
		if (v && typeof v === "object" && !Array.isArray(v) && prev && typeof prev === "object" && !Array.isArray(prev)) out[k] = deepMerge(prev, v);
		else out[k] = v;
	}
	return out;
}
//#endregion
//#region src/components/chart/chart.css?raw
var chart_default = "/* ============================================================================\r\n   mono-chart — a Chart.js canvas driven by `monoChart(...)` (or a raw chart.js\r\n   `data` object). The library is an OPTIONAL peer, loaded on demand; until it\r\n   resolves the element renders an empty, correctly-sized box so nothing jumps.\r\n\r\n   NOT attribute-styled, on purpose: the chart is a bitmap. This sheet declares\r\n   the palette and the inks as custom properties over the Basecoat tokens, and\r\n   the ELEMENT reads them back at mount (`_resolveColor`, `_themeColors`) and\r\n   hands Chart.js real values — a canvas cannot resolve `var()`. The two boxes\r\n   this sheet does paint (the message, the loading veil) keep their classes.\r\n\r\n   Tokens (ours → Basecoat):\r\n     --_mono-chart-1 … -5                  ≡ --chart-1 … --chart-5 (the default palette, in that order)\r\n     --_mono-chart-primary                 ≡ --primary\r\n     --_mono-chart-secondary               ≡ --muted-foreground (the \"secondary\" ink every field uses)\r\n     --_mono-chart-accent                  ≡ --chart-2 (Basecoat's --accent is a surface, not a series colour)\r\n     --_mono-chart-success/warning/danger/info ≡ --success / --warning / --destructive / --info\r\n     --_mono-chart-text                    ≡ --foreground (legend, title)\r\n     --_mono-chart-muted                   ≡ --muted-foreground (axis ticks, the empty message)\r\n     --_mono-chart-grid                    ≡ --border\r\n     --_mono-chart-surface                 ≡ --background (the hairline between slices)\r\n     --_mono-chart-tooltip-*               ≡ the select panel's popover: --mono-select-dropdown-{bg,color,radius,ring,shadow} → --popover … (the tooltip IS an element, painted here)\r\n     --_mono-chart-font                    ≡ text-xs, in the page font (inherited)\r\n     --_mono-chart-radius                  ≡ --mono-radius-md (tooltip corner, message box)\r\n     --_mono-chart-bar-radius              ≡ the field's corner chain (--mono-input-outline-radius → --mono-input-radius → --mono-radius-md)\r\n\r\n   Every `--mono-chart-<k>` is a public override; the flavours carry nothing —\r\n   the tokens they retune (border, foreground, popover, chart-n) reach the chart\r\n   through these chains. Dark mode is the same tokens flipped; the element\r\n   watches the mode class and repaints.\r\n   ============================================================================ */\r\n\r\nmono-chart,\r\nmono-chart-bar,\r\nmono-chart-line,\r\nmono-chart-pie,\r\nmono-chart-doughnut {\r\n  display: block;\r\n  width: 100%;\r\n}\r\n\r\nmono-chart *,\r\nmono-chart-bar *,\r\nmono-chart-line *,\r\nmono-chart-pie *,\r\nmono-chart-doughnut * {\r\n  box-sizing: border-box;\r\n}\r\n\r\n.mono-chart {\r\n  position: relative;\r\n  width: 100%;\r\n  color: var(--_mono-chart-text);\r\n  /* the canvas inherits nothing; the element READS these two off this box */\r\n  font-family: var(--_mono-chart-font-family);\r\n  font-size: var(--_mono-chart-font);\r\n\r\n  /* Public customization API → private resolvers. The ELEMENT also reads these\r\n     at mount time and hands the resolved colors to Chart.js: canvas painting\r\n     can't resolve `var()`, so the palette has to cross into JS as real values. */\r\n  --_mono-chart-1: var(--mono-chart-1, var(--chart-1));\r\n  --_mono-chart-2: var(--mono-chart-2, var(--chart-2));\r\n  --_mono-chart-3: var(--mono-chart-3, var(--chart-3));\r\n  --_mono-chart-4: var(--mono-chart-4, var(--chart-4));\r\n  --_mono-chart-5: var(--mono-chart-5, var(--chart-5));\r\n\r\n  --_mono-chart-primary: var(--mono-chart-primary, var(--primary));\r\n  --_mono-chart-secondary: var(--mono-chart-secondary, var(--muted-foreground));\r\n  --_mono-chart-accent: var(--mono-chart-accent, var(--chart-2));\r\n  --_mono-chart-success: var(--mono-chart-success, var(--success));\r\n  --_mono-chart-warning: var(--mono-chart-warning, var(--warning));\r\n  --_mono-chart-danger: var(--mono-chart-danger, var(--destructive));\r\n  --_mono-chart-info: var(--mono-chart-info, var(--info));\r\n\r\n  --_mono-chart-text: var(--mono-chart-text, var(--foreground));\r\n  --_mono-chart-muted: var(--mono-chart-muted, var(--muted-foreground));\r\n  --_mono-chart-grid: var(--mono-chart-grid, var(--border));\r\n  --_mono-chart-surface: var(--mono-chart-surface, var(--background));\r\n\r\n  /* basecoat@1.0.2 styles/vega.css .combobox [data-popover] — bg-popover text-popover-foreground ring-foreground/10 rounded-md shadow-md ring-1\r\n     (a tooltip is a popover: the same chrome, at text-xs). It is the FLAVOUR's\r\n     popover: the corner, ring and shadow read the select panel's public knobs,\r\n     which every flavour writes (luma 3xl + shadow-lg, lyra 0, maia 2xl …). */\r\n  --_mono-chart-tooltip-bg: var(--mono-chart-tooltip-bg, var(--mono-select-dropdown-bg, var(--popover)));\r\n  --_mono-chart-tooltip-color: var(--mono-chart-tooltip-color, var(--mono-select-dropdown-color, var(--popover-foreground)));\r\n  --_mono-chart-tooltip-border: var(--mono-chart-tooltip-border, var(--border));\r\n  --_mono-chart-tooltip-radius: var(--mono-chart-tooltip-radius, var(--mono-select-dropdown-radius, var(--mono-radius-md)));\r\n  --_mono-chart-tooltip-ring: var(--mono-chart-tooltip-ring, var(--mono-select-dropdown-ring, 0 0 0 1px color-mix(in oklab, var(--foreground) 10%, transparent)));\r\n  --_mono-chart-tooltip-shadow: var(--mono-chart-tooltip-shadow, var(--mono-select-dropdown-shadow, var(--mono-shadow-md)));\r\n\r\n  --_mono-chart-font: var(--mono-chart-font, var(--mono-text-xs));\r\n  /* INHERIT, not --font-sans: every other mono control inherits the page font\r\n     for its labels, and a chart sits among them */\r\n  --_mono-chart-font-family: var(--mono-chart-font-family, inherit);\r\n  --_mono-chart-radius: var(--mono-chart-radius, var(--mono-radius-md));\r\n  /* The bars' corner IS the flavour's field corner — lyra squares a field through\r\n     `--mono-input-radius`, sera through `--mono-input-outline-radius`, maia and\r\n     luma pill it through the same knob — so bars are square where the fields are\r\n     and round where they are, with nothing set. Chart.js clamps it to half a bar. */\r\n  --_mono-chart-bar-radius: var(--mono-chart-bar-radius, var(--mono-input-outline-radius, var(--mono-input-radius, var(--mono-radius-md))));\r\n\r\n  /* Chart.js wants PIXELS and a custom property's computed value is still the\r\n     token string (`calc(…)`, `2rem`), so the two radii are painted onto real,\r\n     invisible border-radius properties here and read back computed. */\r\n  border-radius: var(--_mono-chart-radius);\r\n}\r\n\r\n/* The canvas box. Chart.js sets the canvas' intrinsic width/height itself; this\r\n   wrapper owns the LAYOUT size so `responsive: true` has something to measure. */\r\n.mono-chart-canvas-wrap {\r\n  position: relative;\r\n  width: 100%;\r\n  /* the bar corner, in px — see the root */\r\n  border-radius: var(--_mono-chart-bar-radius);\r\n}\r\n\r\n.mono-chart canvas {\r\n  display: block;\r\n  width: 100%;\r\n  max-width: 100%;\r\n}\r\n\r\n/* The tooltip — an HTML popover placed over the canvas by the element\r\n   (Chart.js's `tooltip.external`), not the bitmap one: a canvas can take a\r\n   colour and a corner, not the flavour's ring and shadow. Positioned from the\r\n   caret; `data-side` says which way it opened. */\r\n.mono-chart-tooltip {\r\n  position: absolute;\r\n  left: 0;\r\n  top: 0;\r\n  z-index: 2;\r\n  display: none;\r\n  flex-direction: column;\r\n  gap: calc(var(--mono-spacing) * 0.5);\r\n  /* basecoat@1.0.2 styles/vega.css .combobox [data-popover] — bg-popover text-popover-foreground ring-foreground/10 rounded-md shadow-md ring-1; px-3 py-1.5 text-xs */\r\n  padding: calc(var(--mono-spacing) * 1.5) calc(var(--mono-spacing) * 3);\r\n  border-radius: var(--_mono-chart-tooltip-radius);\r\n  background: var(--_mono-chart-tooltip-bg);\r\n  color: var(--_mono-chart-tooltip-color);\r\n  box-shadow: var(--_mono-chart-tooltip-ring), var(--_mono-chart-tooltip-shadow);\r\n  font-size: var(--_mono-chart-font);\r\n  line-height: var(--mono-text-xs--lh);\r\n  white-space: nowrap;\r\n  pointer-events: none;\r\n  transform: translate(-50%, calc(-100% - calc(var(--mono-spacing) * 2)));\r\n  opacity: 0;\r\n  transition: opacity var(--mono-duration-fast, 100ms) var(--mono-ease);\r\n}\r\n\r\n.mono-chart-tooltip[data-open] {\r\n  display: flex;\r\n  opacity: 1;\r\n}\r\n\r\n/* no room above the point: open below it */\r\n.mono-chart-tooltip[data-side='bottom'] {\r\n  transform: translate(-50%, calc(var(--mono-spacing) * 2));\r\n}\r\n\r\n.mono-chart-tooltip-title {\r\n  font-weight: var(--mono-font-weight-medium);\r\n}\r\n\r\n.mono-chart-tooltip-row {\r\n  display: flex;\r\n  align-items: center;\r\n  gap: calc(var(--mono-spacing) * 2);\r\n}\r\n\r\n/* the series swatch — a rounded chip, like the legend's */\r\n.mono-chart-tooltip-swatch {\r\n  flex: 0 0 auto;\r\n  width: calc(var(--mono-spacing) * 2.5);\r\n  height: calc(var(--mono-spacing) * 2.5);\r\n  border-radius: var(--mono-radius-sm);\r\n}\r\n\r\n.mono-chart-tooltip-value {\r\n  margin-inline-start: auto;\r\n  font-variant-numeric: tabular-nums;\r\n  padding-inline-start: calc(var(--mono-spacing) * 3);\r\n}\r\n\r\n@media (prefers-reduced-motion: reduce) {\r\n  .mono-chart-tooltip {\r\n    transition: none;\r\n  }\r\n}\r\n\r\n/* Shown while the optional peer loads, when there is no data, or on error —\r\n   basecoat's empty-state idiom: a dashed hairline, muted text. */\r\n.mono-chart-message {\r\n  display: flex;\r\n  align-items: center;\r\n  justify-content: center;\r\n  min-height: 6rem;\r\n  padding: calc(var(--mono-spacing) * 4);\r\n  font-size: var(--mono-text-sm);\r\n  line-height: var(--mono-text-sm--lh);\r\n  color: var(--_mono-chart-muted);\r\n  text-align: center;\r\n  border: var(--mono-border-width) dashed var(--_mono-chart-grid);\r\n  border-radius: var(--_mono-chart-radius);\r\n}\r\n\r\n.mono-chart-message.error {\r\n  color: var(--_mono-chart-danger);\r\n  border-color: color-mix(in oklab, var(--_mono-chart-danger) 45%, var(--_mono-chart-grid));\r\n}\r\n\r\n/* Loading veil — the canvas stays mounted so Chart.js keeps its size. */\r\n.mono-chart.loading .mono-chart-canvas-wrap {\r\n  opacity: 0.55;\r\n  transition: opacity var(--mono-duration) var(--mono-ease);\r\n}\r\n\r\n@media (prefers-reduced-motion: reduce) {\r\n  .mono-chart.loading .mono-chart-canvas-wrap {\r\n    transition: none;\r\n  }\r\n}\r\n";
//#endregion
//#region src/components/chart/mono-chart.ts
var MonoChart = class MonoChart extends MonoChartCore(LitElement) {
	static {
		this.styles = [unsafeCSS(chart_default)];
	}
	createRenderRoot() {
		return this;
	}
	render() {
		return this.renderChart();
	}
};
MonoChart = __decorate([customElement("mono-chart")], MonoChart);
//#endregion
//#region src/components/chart/mono-chart-presets.ts
var MonoChartBar = class MonoChartBar extends MonoChartCore(LitElement) {
	constructor(..._args) {
		super(..._args);
		this._presetType = "bar";
	}
	static {
		this.styles = [unsafeCSS(chart_default)];
	}
	createRenderRoot() {
		return this;
	}
	render() {
		return this.renderChart();
	}
};
MonoChartBar = __decorate([customElement("mono-chart-bar")], MonoChartBar);
var MonoChartLine = class MonoChartLine extends MonoChartCore(LitElement) {
	constructor(..._args2) {
		super(..._args2);
		this._presetType = "line";
	}
	static {
		this.styles = [unsafeCSS(chart_default)];
	}
	createRenderRoot() {
		return this;
	}
	render() {
		return this.renderChart();
	}
};
MonoChartLine = __decorate([customElement("mono-chart-line")], MonoChartLine);
var MonoChartPie = class MonoChartPie extends MonoChartCore(LitElement) {
	constructor(..._args3) {
		super(..._args3);
		this._presetType = "pie";
	}
	static {
		this.styles = [unsafeCSS(chart_default)];
	}
	createRenderRoot() {
		return this;
	}
	render() {
		return this.renderChart();
	}
};
MonoChartPie = __decorate([customElement("mono-chart-pie")], MonoChartPie);
var MonoChartDoughnut = class MonoChartDoughnut extends MonoChartCore(LitElement) {
	constructor(..._args4) {
		super(..._args4);
		this._presetType = "doughnut";
	}
	static {
		this.styles = [unsafeCSS(chart_default)];
	}
	createRenderRoot() {
		return this;
	}
	render() {
		return this.renderChart();
	}
};
MonoChartDoughnut = __decorate([customElement("mono-chart-doughnut")], MonoChartDoughnut);
//#endregion
export { MonoChart, MonoChartBar, MonoChartCore, MonoChartDoughnut, MonoChartLine, MonoChartPie, buildChartApply, buildChartOdataRequest, composeApply, monoChart as controlMonoChart, monoChart, loadChartJs };
