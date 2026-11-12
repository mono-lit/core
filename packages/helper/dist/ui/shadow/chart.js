import { i as composeApply, n as buildChartApply, t as monoChart } from "../../mono-data-chart-ChF4J9RT.js";
import { t as customElement } from "../../mono-element-CKcT0rwv.js";
import { t as __decorate } from "../../decorate-DbYFpi8R.js";
import { n as loadChartJs, t as MonoChartCore } from "../../chart-core-DV7hD3ZY.js";
import { i as withShadowUtilityStyles, r as toShadowCss, t as flushSsrHydration } from "../../hydration-flush-Volt9X7Q.js";
import { LitElement, isServer, unsafeCSS } from "lit";

//#region \0raw:C:\Users\VCT-DEV\Desktop\libs\packages\helper\src\components\chart\chart.css?raw.js
var chart_css_raw_default = "/* ============================================================================\r\n   mono-chart — a Chart.js canvas driven by `monoChart(...)` (or a raw chart.js\r\n   `data` object). The library is an OPTIONAL peer, loaded on demand; until it\r\n   resolves the element renders an empty, correctly-sized box so nothing jumps.\r\n\r\n   NOT attribute-styled, on purpose: the chart is a bitmap. This sheet declares\r\n   the palette and the inks as custom properties over the Basecoat tokens, and\r\n   the ELEMENT reads them back at mount (`_resolveColor`, `_themeColors`) and\r\n   hands Chart.js real values — a canvas cannot resolve `var()`. The two boxes\r\n   this sheet does paint (the message, the loading veil) keep their classes.\r\n\r\n   Tokens (ours → Basecoat):\r\n     --_mono-chart-1 … -5                  ≡ --chart-1 … --chart-5 (the default palette, in that order)\r\n     --_mono-chart-primary                 ≡ --primary\r\n     --_mono-chart-secondary               ≡ --muted-foreground (the \"secondary\" ink every field uses)\r\n     --_mono-chart-accent                  ≡ --chart-2 (Basecoat's --accent is a surface, not a series colour)\r\n     --_mono-chart-success/warning/danger/info ≡ --success / --warning / --destructive / --info\r\n     --_mono-chart-text                    ≡ --foreground (legend, title)\r\n     --_mono-chart-muted                   ≡ --muted-foreground (axis ticks, the empty message)\r\n     --_mono-chart-grid                    ≡ --border\r\n     --_mono-chart-surface                 ≡ --background (the hairline between slices)\r\n     --_mono-chart-tooltip-*               ≡ the select panel's popover: --mono-select-dropdown-{bg,color,radius,ring,shadow} → --popover … (the tooltip IS an element, painted here)\r\n     --_mono-chart-font                    ≡ text-xs, in the page font (inherited)\r\n     --_mono-chart-radius                  ≡ --mono-radius-md (tooltip corner, message box)\r\n     --_mono-chart-bar-radius              ≡ the field's corner chain (--mono-input-outline-radius → --mono-input-radius → --mono-radius-md)\r\n\r\n   Every `--mono-chart-<k>` is a public override; the flavours carry nothing —\r\n   the tokens they retune (border, foreground, popover, chart-n) reach the chart\r\n   through these chains. Dark mode is the same tokens flipped; the element\r\n   watches the mode class and repaints.\r\n   ============================================================================ */\r\n\r\nmono-chart,\r\nmono-chart-bar,\r\nmono-chart-line,\r\nmono-chart-pie,\r\nmono-chart-doughnut {\r\n  display: block;\r\n  width: 100%;\r\n}\r\n\r\nmono-chart *,\r\nmono-chart-bar *,\r\nmono-chart-line *,\r\nmono-chart-pie *,\r\nmono-chart-doughnut * {\r\n  box-sizing: border-box;\r\n}\r\n\r\n.mono-chart {\r\n  position: relative;\r\n  width: 100%;\r\n  color: var(--_mono-chart-text);\r\n  /* the canvas inherits nothing; the element READS these two off this box */\r\n  font-family: var(--_mono-chart-font-family);\r\n  font-size: var(--_mono-chart-font);\r\n\r\n  /* Public customization API → private resolvers. The ELEMENT also reads these\r\n     at mount time and hands the resolved colors to Chart.js: canvas painting\r\n     can't resolve `var()`, so the palette has to cross into JS as real values. */\r\n  --_mono-chart-1: var(--mono-chart-1, var(--chart-1));\r\n  --_mono-chart-2: var(--mono-chart-2, var(--chart-2));\r\n  --_mono-chart-3: var(--mono-chart-3, var(--chart-3));\r\n  --_mono-chart-4: var(--mono-chart-4, var(--chart-4));\r\n  --_mono-chart-5: var(--mono-chart-5, var(--chart-5));\r\n\r\n  --_mono-chart-primary: var(--mono-chart-primary, var(--primary));\r\n  --_mono-chart-secondary: var(--mono-chart-secondary, var(--muted-foreground));\r\n  --_mono-chart-accent: var(--mono-chart-accent, var(--chart-2));\r\n  --_mono-chart-success: var(--mono-chart-success, var(--success));\r\n  --_mono-chart-warning: var(--mono-chart-warning, var(--warning));\r\n  --_mono-chart-danger: var(--mono-chart-danger, var(--destructive));\r\n  --_mono-chart-info: var(--mono-chart-info, var(--info));\r\n\r\n  --_mono-chart-text: var(--mono-chart-text, var(--foreground));\r\n  --_mono-chart-muted: var(--mono-chart-muted, var(--muted-foreground));\r\n  --_mono-chart-grid: var(--mono-chart-grid, var(--border));\r\n  --_mono-chart-surface: var(--mono-chart-surface, var(--background));\r\n\r\n  /* basecoat@1.0.2 styles/vega.css .combobox [data-popover] — bg-popover text-popover-foreground ring-foreground/10 rounded-md shadow-md ring-1\r\n     (a tooltip is a popover: the same chrome, at text-xs). It is the FLAVOUR's\r\n     popover: the corner, ring and shadow read the select panel's public knobs,\r\n     which every flavour writes (luma 3xl + shadow-lg, lyra 0, maia 2xl …). */\r\n  --_mono-chart-tooltip-bg: var(--mono-chart-tooltip-bg, var(--mono-select-dropdown-bg, var(--popover)));\r\n  --_mono-chart-tooltip-color: var(--mono-chart-tooltip-color, var(--mono-select-dropdown-color, var(--popover-foreground)));\r\n  --_mono-chart-tooltip-border: var(--mono-chart-tooltip-border, var(--border));\r\n  --_mono-chart-tooltip-radius: var(--mono-chart-tooltip-radius, var(--mono-select-dropdown-radius, var(--mono-radius-md)));\r\n  --_mono-chart-tooltip-ring: var(--mono-chart-tooltip-ring, var(--mono-select-dropdown-ring, 0 0 0 1px color-mix(in oklab, var(--foreground) 10%, transparent)));\r\n  --_mono-chart-tooltip-shadow: var(--mono-chart-tooltip-shadow, var(--mono-select-dropdown-shadow, var(--mono-shadow-md)));\r\n\r\n  --_mono-chart-font: var(--mono-chart-font, var(--mono-text-xs));\r\n  /* INHERIT, not --font-sans: every other mono control inherits the page font\r\n     for its labels, and a chart sits among them */\r\n  --_mono-chart-font-family: var(--mono-chart-font-family, inherit);\r\n  --_mono-chart-radius: var(--mono-chart-radius, var(--mono-radius-md));\r\n  /* The bars' corner IS the flavour's field corner — lyra squares a field through\r\n     `--mono-input-radius`, sera through `--mono-input-outline-radius`, maia and\r\n     luma pill it through the same knob — so bars are square where the fields are\r\n     and round where they are, with nothing set. Chart.js clamps it to half a bar. */\r\n  --_mono-chart-bar-radius: var(--mono-chart-bar-radius, var(--mono-input-outline-radius, var(--mono-input-radius, var(--mono-radius-md))));\r\n\r\n  /* Chart.js wants PIXELS and a custom property's computed value is still the\r\n     token string (`calc(…)`, `2rem`), so the two radii are painted onto real,\r\n     invisible border-radius properties here and read back computed. */\r\n  border-radius: var(--_mono-chart-radius);\r\n}\r\n\r\n/* The canvas box. Chart.js sets the canvas' intrinsic width/height itself; this\r\n   wrapper owns the LAYOUT size so `responsive: true` has something to measure. */\r\n.mono-chart-canvas-wrap {\r\n  position: relative;\r\n  width: 100%;\r\n  /* the bar corner, in px — see the root */\r\n  border-radius: var(--_mono-chart-bar-radius);\r\n}\r\n\r\n.mono-chart canvas {\r\n  display: block;\r\n  width: 100%;\r\n  max-width: 100%;\r\n}\r\n\r\n/* The tooltip — an HTML popover placed over the canvas by the element\r\n   (Chart.js's `tooltip.external`), not the bitmap one: a canvas can take a\r\n   colour and a corner, not the flavour's ring and shadow. Positioned from the\r\n   caret; `data-side` says which way it opened. */\r\n.mono-chart-tooltip {\r\n  position: absolute;\r\n  left: 0;\r\n  top: 0;\r\n  z-index: 2;\r\n  display: none;\r\n  flex-direction: column;\r\n  gap: calc(var(--mono-spacing) * 0.5);\r\n  /* basecoat@1.0.2 styles/vega.css .combobox [data-popover] — bg-popover text-popover-foreground ring-foreground/10 rounded-md shadow-md ring-1; px-3 py-1.5 text-xs */\r\n  padding: calc(var(--mono-spacing) * 1.5) calc(var(--mono-spacing) * 3);\r\n  border-radius: var(--_mono-chart-tooltip-radius);\r\n  background: var(--_mono-chart-tooltip-bg);\r\n  color: var(--_mono-chart-tooltip-color);\r\n  box-shadow: var(--_mono-chart-tooltip-ring), var(--_mono-chart-tooltip-shadow);\r\n  font-size: var(--_mono-chart-font);\r\n  line-height: var(--mono-text-xs--lh);\r\n  white-space: nowrap;\r\n  pointer-events: none;\r\n  transform: translate(-50%, calc(-100% - calc(var(--mono-spacing) * 2)));\r\n  opacity: 0;\r\n  transition: opacity var(--mono-duration-fast, 100ms) var(--mono-ease);\r\n}\r\n\r\n.mono-chart-tooltip[data-open] {\r\n  display: flex;\r\n  opacity: 1;\r\n}\r\n\r\n/* no room above the point: open below it */\r\n.mono-chart-tooltip[data-side='bottom'] {\r\n  transform: translate(-50%, calc(var(--mono-spacing) * 2));\r\n}\r\n\r\n.mono-chart-tooltip-title {\r\n  font-weight: var(--mono-font-weight-medium);\r\n}\r\n\r\n.mono-chart-tooltip-row {\r\n  display: flex;\r\n  align-items: center;\r\n  gap: calc(var(--mono-spacing) * 2);\r\n}\r\n\r\n/* the series swatch — a rounded chip, like the legend's */\r\n.mono-chart-tooltip-swatch {\r\n  flex: 0 0 auto;\r\n  width: calc(var(--mono-spacing) * 2.5);\r\n  height: calc(var(--mono-spacing) * 2.5);\r\n  border-radius: var(--mono-radius-sm);\r\n}\r\n\r\n.mono-chart-tooltip-value {\r\n  margin-inline-start: auto;\r\n  font-variant-numeric: tabular-nums;\r\n  padding-inline-start: calc(var(--mono-spacing) * 3);\r\n}\r\n\r\n@media (prefers-reduced-motion: reduce) {\r\n  .mono-chart-tooltip {\r\n    transition: none;\r\n  }\r\n}\r\n\r\n/* Shown while the optional peer loads, when there is no data, or on error —\r\n   basecoat's empty-state idiom: a dashed hairline, muted text. */\r\n.mono-chart-message {\r\n  display: flex;\r\n  align-items: center;\r\n  justify-content: center;\r\n  min-height: 6rem;\r\n  padding: calc(var(--mono-spacing) * 4);\r\n  font-size: var(--mono-text-sm);\r\n  line-height: var(--mono-text-sm--lh);\r\n  color: var(--_mono-chart-muted);\r\n  text-align: center;\r\n  border: var(--mono-border-width) dashed var(--_mono-chart-grid);\r\n  border-radius: var(--_mono-chart-radius);\r\n}\r\n\r\n.mono-chart-message.error {\r\n  color: var(--_mono-chart-danger);\r\n  border-color: color-mix(in oklab, var(--_mono-chart-danger) 45%, var(--_mono-chart-grid));\r\n}\r\n\r\n/* Loading veil — the canvas stays mounted so Chart.js keeps its size. The\r\n   source-state overlay is exempt: the spinner must not fade with the chart. */\r\n.mono-chart.loading .mono-chart-canvas-wrap > :not(.mono-chart-state) {\r\n  opacity: 0.55;\r\n  transition: opacity var(--mono-duration) var(--mono-ease);\r\n}\r\n\r\n/* EXTENSION — dataSource state: the first load shows a spinner over the\r\n   (still sized) canvas; a failed load shows the error and a ↻, and outlines the\r\n   plot in the invalid colour — the same signal a failed field gives. */\r\n.mono-chart-state {\r\n  position: absolute;\r\n  inset: 0;\r\n  display: flex;\r\n  align-items: center;\r\n  justify-content: center;\r\n  gap: calc(var(--mono-spacing) * 2);\r\n  padding: calc(var(--mono-spacing) * 4);\r\n  font-size: var(--mono-text-sm);\r\n  line-height: var(--mono-text-sm--lh);\r\n  color: var(--_mono-chart-muted);\r\n  text-align: center;\r\n}\r\n\r\n.mono-chart[mono-ds-error] .mono-chart-state {\r\n  color: var(--mono-chart-ds-error-text, var(--_mono-chart-danger));\r\n}\r\n\r\n.mono-chart[mono-ds-error] .mono-chart-canvas-wrap {\r\n  outline: var(--mono-border-width, 1px) solid var(--mono-chart-ds-error-border, var(--mono-mode-invalid-border));\r\n  box-shadow: 0 0 0 3px var(--mono-chart-ds-error-ring, var(--mono-mode-invalid-ring));\r\n}\r\n\r\n.mono-chart[mono-ds-loading] .mono-chart-canvas-wrap {\r\n  cursor: progress;\r\n}\r\n\r\n.mono-chart-state-text {\r\n  min-width: 0;\r\n  overflow: hidden;\r\n  text-overflow: ellipsis;\r\n}\r\n\r\n.mono-chart-state [mono-ds-spinner],\r\n.mono-chart-state [mono-ds-retry] {\r\n  display: inline-flex;\r\n  align-items: center;\r\n  justify-content: center;\r\n  flex-shrink: 0;\r\n  width: 1.5rem;\r\n  height: 1.5rem;\r\n  margin: 0;\r\n  padding: 0;\r\n  border: 0;\r\n  border-radius: calc(var(--radius) - 5px);\r\n  background: transparent;\r\n  color: inherit;\r\n  font: inherit;\r\n}\r\n\r\n.mono-chart-state [mono-ds-retry] {\r\n  cursor: pointer;\r\n}\r\n\r\n@media (hover: hover) {\r\n  .mono-chart-state [mono-ds-retry]:hover {\r\n    background: var(--mono-mode-ghost-hover);\r\n  }\r\n}\r\n\r\n.mono-chart-state [mono-ds-retry]:focus-visible {\r\n  outline: 2px solid currentColor;\r\n  outline-offset: 1px;\r\n}\r\n\r\n.mono-chart-state :is([mono-ds-spinner], [mono-ds-retry]) > svg {\r\n  display: block;\r\n  width: 1rem;\r\n  height: 1rem;\r\n}\r\n\r\n.mono-chart-state [mono-ds-spinner] > svg {\r\n  animation: mono-chart-spin 0.7s linear infinite;\r\n}\r\n\r\n@keyframes mono-chart-spin {\r\n  to {\r\n    transform: rotate(360deg);\r\n  }\r\n}\r\n\r\n@media (prefers-reduced-motion: reduce) {\r\n  .mono-chart.loading .mono-chart-canvas-wrap > :not(.mono-chart-state) {\r\n    transition: none;\r\n  }\r\n\r\n  .mono-chart-state [mono-ds-spinner] > svg {\r\n    animation-duration: 2.4s;\r\n  }\r\n}\r\n";

//#endregion
//#region src/components/chart/mono-chart.shadow.ts
const SHADOW_CHART_CSS$1 = toShadowCss(chart_css_raw_default, { host: "mono-chart" });
let MonoChartShadow = class MonoChartShadow extends withShadowUtilityStyles(MonoChartCore(LitElement)) {
	static {
		this.disableWarning?.("change-in-update");
	}
	static {
		this.styles = [unsafeCSS(SHADOW_CHART_CSS$1)];
	}
	connectedCallback() {
		super.connectedCallback();
		if (isServer) return;
		flushSsrHydration(this);
	}
	render() {
		return this.renderChart();
	}
};
MonoChartShadow = __decorate([customElement("mono-shadow-chart")], MonoChartShadow);

//#endregion
//#region src/components/chart/mono-chart-presets.shadow.ts
const SHADOW_CHART_CSS = toShadowCss(chart_css_raw_default, { host: "mono-chart" });
let MonoChartBarShadow = class MonoChartBarShadow extends withShadowUtilityStyles(MonoChartCore(LitElement)) {
	constructor(..._args) {
		super(..._args);
		this._presetType = "bar";
	}
	static {
		this.disableWarning?.("change-in-update");
	}
	static {
		this.styles = [unsafeCSS(SHADOW_CHART_CSS)];
	}
	connectedCallback() {
		super.connectedCallback();
		if (isServer) return;
		flushSsrHydration(this);
	}
	render() {
		return this.renderChart();
	}
};
MonoChartBarShadow = __decorate([customElement("mono-shadow-chart-bar")], MonoChartBarShadow);
let MonoChartLineShadow = class MonoChartLineShadow extends withShadowUtilityStyles(MonoChartCore(LitElement)) {
	constructor(..._args2) {
		super(..._args2);
		this._presetType = "line";
	}
	static {
		this.disableWarning?.("change-in-update");
	}
	static {
		this.styles = [unsafeCSS(SHADOW_CHART_CSS)];
	}
	connectedCallback() {
		super.connectedCallback();
		if (isServer) return;
		flushSsrHydration(this);
	}
	render() {
		return this.renderChart();
	}
};
MonoChartLineShadow = __decorate([customElement("mono-shadow-chart-line")], MonoChartLineShadow);
let MonoChartPieShadow = class MonoChartPieShadow extends withShadowUtilityStyles(MonoChartCore(LitElement)) {
	constructor(..._args3) {
		super(..._args3);
		this._presetType = "pie";
	}
	static {
		this.disableWarning?.("change-in-update");
	}
	static {
		this.styles = [unsafeCSS(SHADOW_CHART_CSS)];
	}
	connectedCallback() {
		super.connectedCallback();
		if (isServer) return;
		flushSsrHydration(this);
	}
	render() {
		return this.renderChart();
	}
};
MonoChartPieShadow = __decorate([customElement("mono-shadow-chart-pie")], MonoChartPieShadow);
let MonoChartDoughnutShadow = class MonoChartDoughnutShadow extends withShadowUtilityStyles(MonoChartCore(LitElement)) {
	constructor(..._args4) {
		super(..._args4);
		this._presetType = "doughnut";
	}
	static {
		this.disableWarning?.("change-in-update");
	}
	static {
		this.styles = [unsafeCSS(SHADOW_CHART_CSS)];
	}
	connectedCallback() {
		super.connectedCallback();
		if (isServer) return;
		flushSsrHydration(this);
	}
	render() {
		return this.renderChart();
	}
};
MonoChartDoughnutShadow = __decorate([customElement("mono-shadow-chart-doughnut")], MonoChartDoughnutShadow);

//#endregion
export { MonoChartBarShadow, MonoChartCore, MonoChartDoughnutShadow, MonoChartLineShadow, MonoChartPieShadow, MonoChartShadow, buildChartApply, composeApply, monoChart as controlMonoChart, monoChart, loadChartJs };