import { t as customElement } from "../mono-element-B0kP_96P.js";
import { a as defineHybridPropAliases, i as defineHybridPropAlias, r as booleanStringConverter, t as __decorate } from "../decorate-DEXtNagw.js";
import { a as parkDetachedNodes, n as bucketHasContent, o as placeLightSlots, r as captureLightSlots } from "../light-slots-DW1WgfgT.js";
import { t as isIconifyClass } from "../icon-dVhYJUIH.js";
import { r as closeIcon } from "../field-icons-BoOG6KrL.js";
import { LitElement, html, nothing, unsafeCSS } from "lit";
import { property, state } from "lit/decorators.js";
//#region src/components/alert/alert-core.ts
/**
* `MonoAlertCore` — everything both builds share: props (with the `closeable`
* alias), the ✕ that hides the alert, and the root template. The regions are
* one overridable hook, `_renderMain()`: the light build fills `[data-mono-slot]`
* placeholders, the shadow build uses native `<slot>`s.
*
* The alert emits NO events of its own. `@click` on it is the browser's click;
* the ✕ only hides the element (the native `hidden` attribute), and stops its
* own click so a listener on the alert does not fire for it.
*
* SSR-safe: no `document`/`window` access.
*/
var MonoAlertCore = (superClass) => {
	class MonoAlertCoreClass extends superClass {
		constructor(...args) {
			super(...args);
			this._hasIconSlot = false;
			this._hasTitleSlot = false;
			this._hasSubtitleSlot = false;
			this._hasBodySlot = false;
			this._clear = (event) => {
				event.stopPropagation();
				this.hidden = true;
			};
			defineHybridPropAliases(this, ["clearLabel", "cssClass"]);
			defineHybridPropAlias(this, "closeable", "clearable");
			this.title = "";
			this.subtitle = "";
			this.icon = "";
			this.color = "neutral";
			this.variant = "outline";
			this.size = "md";
			this.clearable = false;
			this.clearLabel = "Close";
			this.cssClass = {};
		}
		static get observedAttributes() {
			return [
				...super.observedAttributes ?? [],
				"closeable",
				"clearlabel",
				"cssclass"
			];
		}
		attributeChangedCallback(name, oldValue, newValue) {
			super.attributeChangedCallback(name, oldValue, newValue);
			if (oldValue === newValue) return;
			if (name === "closeable") {
				this.clearable = booleanStringConverter.fromAttribute(newValue);
				return;
			}
			if (name === "clearlabel") this.clearLabel = newValue ?? "Close";
		}
		_cls(base, key) {
			const extra = this.cssClass?.[key];
			return extra ? `${base} ${extra}` : base;
		}
		get _showsIcon() {
			return !this._hasBodySlot && (this._hasIconSlot || Boolean(this.icon));
		}
		get _showsTitle() {
			return !this._hasBodySlot && (this._hasTitleSlot || Boolean(this.title));
		}
		get _showsSubtitle() {
			return !this._hasBodySlot && (this._hasSubtitleSlot || Boolean(this.subtitle));
		}
		/**
		* The `icon` prop: an iconify class becomes an empty masked span, anything
		* else is text. The shadow build overrides this with inline SVG (a page
		* utility class cannot reach inside a shadow root).
		*/
		_renderIconGlyph() {
			if (!this.icon) return nothing;
			if (isIconifyClass(this.icon)) return html`<span class=${`mono-alert-iconify ${this.icon}`} mono-glyph></span>`;
			return html`${this.icon}`;
		}
		/** The regions — each build renders its own slot strategy here. */
		_renderMain() {
			return nothing;
		}
		_renderClear() {
			if (!this.clearable) return nothing;
			return html`<button
        type="button"
        class=${this._cls("mono-alert-clear", "clear")}
        mono-clear
        aria-label=${this.clearLabel}
        @click=${this._clear}
      >${closeIcon()}</button>`;
		}
		render() {
			return html`<div
        class=${this._cls("mono-alert", "root")}
        mono-alert
        mono-size=${this.size && this.size !== "md" ? this.size : nothing}
        mono-variant=${this.variant && this.variant !== "outline" ? this.variant : nothing}
        mono-color=${this.color && this.color !== "neutral" ? this.color : nothing}
        ?mono-clearable=${this.clearable}
        role="alert"
        title=""
      >${this._renderMain()}${this._renderClear()}</div>`;
		}
	}
	__decorate([property({ type: String })], MonoAlertCoreClass.prototype, "title", void 0);
	__decorate([property({ type: String })], MonoAlertCoreClass.prototype, "subtitle", void 0);
	__decorate([property({ type: String })], MonoAlertCoreClass.prototype, "icon", void 0);
	__decorate([property({ type: String })], MonoAlertCoreClass.prototype, "color", void 0);
	__decorate([property({ type: String })], MonoAlertCoreClass.prototype, "variant", void 0);
	__decorate([property({ type: String })], MonoAlertCoreClass.prototype, "size", void 0);
	__decorate([property({
		reflect: true,
		converter: booleanStringConverter
	})], MonoAlertCoreClass.prototype, "clearable", void 0);
	__decorate([property({
		type: String,
		attribute: "clear-label"
	})], MonoAlertCoreClass.prototype, "clearLabel", void 0);
	__decorate([property({ attribute: false })], MonoAlertCoreClass.prototype, "cssClass", void 0);
	__decorate([state()], MonoAlertCoreClass.prototype, "_hasIconSlot", void 0);
	__decorate([state()], MonoAlertCoreClass.prototype, "_hasTitleSlot", void 0);
	__decorate([state()], MonoAlertCoreClass.prototype, "_hasSubtitleSlot", void 0);
	__decorate([state()], MonoAlertCoreClass.prototype, "_hasBodySlot", void 0);
	return MonoAlertCoreClass;
};
//#endregion
//#region src/components/alert/alert.css?raw
var alert_default = "/* =========================================================================\r\n   mono-alert — a port of Basecoat's `.alert` (basecoat-css@1.0.2, vega style).\r\n\r\n   Styled by ATTRIBUTE, like Basecoat — and the attributes mirror the element's\r\n   props one for one, so hand-written markup reads like the Lit / Vue tag:\r\n\r\n     <mono-alert color=\"danger\" variant=\"tonal\" icon=\"i-mdi-alert-outline\"\r\n                 title=\"Payment failed\" subtitle=\"Check the card details.\" clearable>\r\n     <div mono-alert mono-color=\"danger\" mono-variant=\"tonal\" mono-clearable role=\"alert\">\r\n       <span mono-icon><svg …></svg></span>\r\n       <div mono-title>Payment failed</div>\r\n       <div mono-subtitle>Check the card details.</div>\r\n       <button type=\"button\" mono-clear aria-label=\"Close\"><svg …></svg></button>\r\n     </div>\r\n\r\n   An absent attribute is the prop's default (`:not([mono-size])` = md,\r\n   `:not([mono-variant])` = outline, `:not([mono-color])` = neutral).\r\n\r\n   Selector map (ours ≡ upstream):\r\n     [mono-alert]                           ≡ .alert (grid gap-0.5 rounded-lg border px-4 py-3 text-sm bg-card text-card-foreground)\r\n     [mono-alert]:has(> [mono-icon])        ≡ .alert has-[>svg]:grid-cols-[auto_1fr] has-[>svg]:gap-x-2.5\r\n     [mono-icon]                            ≡ .alert > svg (row-span-2 translate-y-0.5 size-4 text-current)\r\n     [mono-title]                           ≡ .alert > :is(h2…h6, strong, [data-title]) (font-medium, col-start-2 beside an icon)\r\n     [mono-subtitle]                        ≡ .alert > section (text-sm text-muted-foreground text-balance)\r\n     [mono-body]                            ≡ EXTENSION (`slot=\"body\"`: the whole content, across both columns)\r\n     [mono-clear]                           ≡ .alert > footer position (top-2.5 end-3), drawn as a ghost ✕\r\n     [mono-variant=\"outline\"] (default)     ≡ .alert verbatim; with a colour ≡ .alert[data-variant='destructive'] for every hue\r\n     [mono-variant=\"tonal|solid|text\"]      ≡ EXTENSION — the same four looks as mono-button\r\n     [mono-color=\"…\"]                       ≡ EXTENSION (`danger` is upstream's destructive)\r\n     [mono-size=\"…\"]                        ≡ EXTENSION — ONE scale factor over the md metrics (see below)\r\n\r\n   Specificity contract: a part's RESTING rule is `:where([mono-alert]) > [part]`\r\n   = (0,1,0), so a utility class handed in through `cssClass` wins by order;\r\n   variant / colour / size rules are heavier and win over it.\r\n\r\n   The shadow build renders every region and marks the empty ones [mono-empty];\r\n   this sheet hides them.\r\n\r\n   FLAVORS set `--mono-alert-{radius,padding-x,padding-y,font-size,\r\n   subtitle-font-size,subtitle-line-height,icon-size,icon-gap,icon-offset,\r\n   title-weight,accent-bar-width}` — the md values only: every size is a multiple\r\n   of md, so a flavor never has to restate a ladder (and can never leave one step\r\n   behind). Every fallback here is vega's value\r\n   (`node scripts/basecoat-styles.mjs --varying \"^\\.alert(?!-dialog)\"`).\r\n   ========================================================================= */\r\n\r\nmono-alert {\r\n  display: block;\r\n}\r\n\r\n/* The ✕ hides the alert with the native `hidden` attribute; the element's own\r\n   `display: block` would otherwise out-rank the UA's `[hidden]`. */\r\nmono-alert[hidden],\r\n[mono-alert][hidden] {\r\n  display: none;\r\n}\r\n\r\n[mono-alert] {\r\n  /* ── presets, RESET on every alert ───────────────────────────────────────\r\n     A preset is written by a [mono-size] / [mono-color] rule on the alert that\r\n     has the prop — and a custom property INHERITS. An alert nested in another\r\n     alert's body (a supported layout) would otherwise pick up the outer one's\r\n     size and colour: a plain alert inside a `danger` `lg` one came out large.\r\n     Declaring the defaults here gives every alert its own; the qualified rules\r\n     are heavier and still win on the element they target. */\r\n  --_mono-alert-scale-preset: 1;\r\n  --_mono-alert-c-preset: var(--card-foreground);\r\n  --_mono-alert-solid-bg-preset: var(--foreground);\r\n  --_mono-alert-solid-fg-preset: var(--background);\r\n\r\n  /* ── the size factor: md = 1; every metric below is md × this ───────────── */\r\n  --_mono-alert-scale: var(--_mono-alert-scale-preset);\r\n\r\n  /* ── palette ─────────────────────────────────────────────────────────────── */\r\n  --_mono-alert-bg: var(--mono-alert-bg, var(--card));\r\n  --_mono-alert-text: var(--mono-alert-text, var(--card-foreground));\r\n  --_mono-alert-subtext: var(--mono-alert-subtext, var(--muted-foreground));\r\n  --_mono-alert-border-color: var(--mono-alert-border-color, var(--border));\r\n  --_mono-alert-border-width: var(--mono-alert-border-width, var(--mono-border-width));\r\n  /* the colour in play — the plain card ink unless a [mono-color] rule re-points it */\r\n  --_mono-alert-c: var(--_mono-alert-c-preset);\r\n  --_mono-alert-solid-bg: var(--_mono-alert-solid-bg-preset);\r\n  --_mono-alert-solid-fg: var(--_mono-alert-solid-fg-preset);\r\n\r\n  /* ── shape + md metrics ──────────────────────────────────────────────────\r\n     basecoat@1.0.2 styles/vega.css .alert — grid gap-0.5 rounded-lg border px-4 py-3 text-start text-sm has-[>svg]:grid-cols-[auto_1fr] has-[>svg]:gap-x-2.5 [&>svg]:row-span-2 [&>svg]:translate-y-0.5 [&>svg]:text-current [&>svg:not([class*='size-'])]:size-4 */\r\n  --_mono-alert-radius: var(--mono-alert-radius, var(--mono-radius-lg));\r\n  --_mono-alert-padding-x: calc(var(--mono-alert-padding-x, calc(var(--mono-spacing) * 4)) * var(--_mono-alert-scale));\r\n  --_mono-alert-padding-y: calc(var(--mono-alert-padding-y, calc(var(--mono-spacing) * 3)) * var(--_mono-alert-scale));\r\n  --_mono-alert-gap: calc(var(--mono-alert-gap, calc(var(--mono-spacing) * 0.5)) * var(--_mono-alert-scale));\r\n  --_mono-alert-icon-gap: calc(var(--mono-alert-icon-gap, calc(var(--mono-spacing) * 2.5)) * var(--_mono-alert-scale));\r\n  --_mono-alert-icon-size: calc(var(--mono-alert-icon-size, calc(var(--mono-spacing) * 4)) * var(--_mono-alert-scale));\r\n  --_mono-alert-icon-offset: calc(var(--mono-alert-icon-offset, calc(var(--mono-spacing) * 0.5)) * var(--_mono-alert-scale));\r\n  --_mono-alert-font-size: calc(var(--mono-alert-font-size, var(--mono-text-sm)) * var(--_mono-alert-scale));\r\n  --_mono-alert-line-height: var(--mono-alert-line-height, var(--mono-text-sm--lh));\r\n  --_mono-alert-title-weight: var(--mono-alert-title-weight, var(--mono-font-weight-medium));\r\n  --_mono-alert-subtitle-font-size: calc(var(--mono-alert-subtitle-font-size, var(--mono-text-sm)) * var(--_mono-alert-scale));\r\n  --_mono-alert-subtitle-line-height: var(--mono-alert-subtitle-line-height, var(--mono-text-sm--lh));\r\n  /* sera's start-edge bar (`after:w-0.5 after:bg-foreground`); 0 everywhere else */\r\n  --_mono-alert-accent-bar-width: var(--mono-alert-accent-bar-width, 0px);\r\n  --_mono-alert-clear-size: calc(var(--mono-alert-clear-size, calc(var(--mono-spacing) * 6)) * var(--_mono-alert-scale));\r\n\r\n  /* ── the look, resolved per variant below ───────────────────────────────── */\r\n  --_mono-alert-surface: var(--_mono-alert-bg);\r\n  --_mono-alert-edge: var(--_mono-alert-border-color);\r\n  --_mono-alert-ink: var(--_mono-alert-text);\r\n  --_mono-alert-sub-ink: var(--_mono-alert-subtext);\r\n  --_mono-alert-bar: var(--_mono-alert-c);\r\n\r\n  position: relative;\r\n  box-sizing: border-box;\r\n  display: grid;\r\n  grid-template-columns: minmax(0, 1fr);\r\n  align-items: start;\r\n  row-gap: var(--_mono-alert-gap);\r\n  width: 100%;\r\n  min-width: 0;\r\n  padding: var(--_mono-alert-padding-y) var(--_mono-alert-padding-x);\r\n  border: var(--_mono-alert-border-width) solid var(--_mono-alert-edge);\r\n  border-radius: var(--_mono-alert-radius);\r\n  background-color: var(--_mono-alert-surface);\r\n  color: var(--_mono-alert-ink);\r\n  font-size: var(--_mono-alert-font-size);\r\n  line-height: var(--_mono-alert-line-height);\r\n  text-align: start;\r\n}\r\n\r\n/* sera — `relative after:-inset-y-px after:-start-px after:w-0.5 after:absolute\r\n   after:bg-foreground` (destructive: after:bg-destructive). Zero-width elsewhere. */\r\n[mono-alert]::after {\r\n  content: '';\r\n  position: absolute;\r\n  inset-block: calc(var(--_mono-alert-border-width) * -1);\r\n  inset-inline-start: calc(var(--_mono-alert-border-width) * -1);\r\n  width: var(--_mono-alert-accent-bar-width);\r\n  background: var(--_mono-alert-bar);\r\n  pointer-events: none;\r\n}\r\n\r\n/* basecoat@1.0.2 components/alert.css .alert — relative w-full (the icon column\r\n   below is vega's `has-[>svg]:grid-cols-[auto_1fr] has-[>svg]:gap-x-2.5`) */\r\n[mono-alert]:has(> [mono-icon]:not([mono-empty])) {\r\n  grid-template-columns: auto minmax(0, 1fr);\r\n  column-gap: var(--_mono-alert-icon-gap);\r\n}\r\n\r\n/* The shadow build renders every region and marks the empty ones. A child\r\n   combinator, so a nested component's own regions inside the body are left alone. */\r\n[mono-alert] > :is([mono-icon], [mono-title], [mono-subtitle], [mono-body])[mono-empty] {\r\n  display: none;\r\n}\r\n\r\n/* =========================================\r\n   Icon — `[&>svg]:row-span-2 translate-y-0.5 text-current size-4`\r\n   ========================================= */\r\n\r\n:where([mono-alert]) > [mono-icon] {\r\n  grid-row: span 2;\r\n  display: inline-flex;\r\n  align-items: center;\r\n  justify-content: center;\r\n  width: var(--_mono-alert-icon-size);\r\n  height: var(--_mono-alert-icon-size);\r\n  translate: 0 var(--_mono-alert-icon-offset);\r\n  color: currentColor;\r\n  line-height: 1;\r\n}\r\n\r\n/* Whatever paints the glyph fills the box: an inline svg (raw markup, a slotted\r\n   svg, the shadow build's bundled glyph) or the light build's iconify span.\r\n   Two attributes strong ON PURPOSE — UnoCSS's `i-*` sets width/height at (0,1,0)\r\n   and loads later — and scoped to the alert (a bare `[mono-glyph]` rule is global\r\n   and would resize every component's glyph).\r\n\r\n   DESCENDANT, not `>`: in the shadow build the glyph is the FALLBACK of\r\n   `<slot name=\"icon\">`, so the tree is [mono-icon] > slot > [mono-glyph] > svg.\r\n   A child combinator never matched it and the icon measured 0 × 0. (The slot is\r\n   `display: contents`, so the glyph is still the box's flex item.) */\r\n[mono-alert] > [mono-icon] :is(svg, img, [mono-glyph]) {\r\n  display: block;\r\n  width: 100%;\r\n  height: 100%;\r\n  flex-shrink: 0;\r\n}\r\n\r\n/* the light build's placeholder is invisible to layout, so the svg sizes against\r\n   the icon box, not against a zero-width span */\r\n[mono-alert] > [mono-icon] > [data-mono-slot='icon'] {\r\n  display: contents;\r\n}\r\n\r\n[mono-alert] > [mono-icon] slot::slotted(:is(svg, img, span)) {\r\n  display: block;\r\n  width: 100%;\r\n  height: 100%;\r\n}\r\n\r\n/* =========================================\r\n   Title + subtitle\r\n   ========================================= */\r\n\r\n/* basecoat@1.0.2 styles/vega.css .alert > :is(h2, h3, h4, h5, h6, strong, [data-title]), .alert[data-variant='destructive'] > :is(h2, h3, h4, h5, h6, strong, [data-title]) — font-medium\r\n   basecoat@1.0.2 components/alert.css .alert > :is(h2, h3, h4, h5, h6, strong, [data-title]) — min-h-4 */\r\n:where([mono-alert]) > [mono-title] {\r\n  min-height: var(--_mono-alert-icon-size);\r\n  margin: 0;\r\n  font-size: var(--_mono-alert-font-size);\r\n  line-height: var(--_mono-alert-line-height);\r\n  font-weight: var(--_mono-alert-title-weight);\r\n  color: inherit;\r\n}\r\n\r\n/* basecoat@1.0.2 styles/vega.css .alert > section — text-muted-foreground text-sm text-balance md:text-pretty */\r\n:where([mono-alert]) > [mono-subtitle] {\r\n  margin: 0;\r\n  font-size: var(--_mono-alert-subtitle-font-size);\r\n  line-height: var(--_mono-alert-subtitle-line-height);\r\n  color: var(--_mono-alert-sub-ink);\r\n  text-wrap: pretty;\r\n}\r\n\r\n/* basecoat@1.0.2 styles/vega.css .alert:has(> svg) > :is(h2, h3, h4, h5, h6, strong, [data-title]) — col-start-2 */\r\n[mono-alert]:has(> [mono-icon]:not([mono-empty])) > :is([mono-title], [mono-subtitle]) {\r\n  grid-column-start: 2;\r\n}\r\n\r\n/* Raw markup puts the region attribute ON a prose tag, which a host page styles\r\n   by tag through a class selector (`.vp-doc h3`, (0,1,1)) — restate the type and\r\n   margin at (0,2,1) so the tag reads like the element's <div>. */\r\n[mono-alert] > :is(h1, h2, h3, h4, h5, h6, p, strong)[mono-title] {\r\n  margin: 0;\r\n  font-size: var(--_mono-alert-font-size);\r\n  line-height: var(--_mono-alert-line-height);\r\n  font-weight: var(--_mono-alert-title-weight);\r\n}\r\n\r\n[mono-alert] > :is(h1, h2, h3, h4, h5, h6, p, strong)[mono-subtitle] {\r\n  margin: 0;\r\n  font-size: var(--_mono-alert-subtitle-font-size);\r\n  line-height: var(--_mono-alert-subtitle-line-height);\r\n}\r\n\r\n/* =========================================\r\n   Body — `slot=\"body\"` / unslotted children: the whole content, both columns\r\n   ========================================= */\r\n\r\n:where([mono-alert]) > [mono-body] {\r\n  grid-column: 1 / -1;\r\n  min-width: 0;\r\n}\r\n\r\n/* basecoat@1.0.2 components/alert.css .alert > section >> :where(p, ul, ol) — m-0\r\n   basecoat@1.0.2 components/alert.css .alert > section >> :where(p, ul, ol):not(:last-child) — mb-4 */\r\n:where([mono-alert]) > [mono-body] :where(p, ul, ol) {\r\n  margin: 0;\r\n}\r\n\r\n:where([mono-alert]) > [mono-body] :where(p, ul, ol):not(:last-child) {\r\n  margin-bottom: calc(var(--mono-spacing) * 4);\r\n}\r\n\r\n/* =========================================\r\n   The ✕ — a ghost icon button at the top end, centred on the icon's line\r\n   basecoat@1.0.2 styles/vega.css .alert > footer, .alert[data-variant='destructive'] > footer — top-2.5 end-3\r\n   basecoat@1.0.2 components/alert.css .alert:has(> footer) — pe-[4.5rem] (here: just the button's room)\r\n   ========================================= */\r\n\r\n[mono-alert][mono-clearable] {\r\n  padding-inline-end: calc(var(--_mono-alert-padding-x) + var(--_mono-alert-clear-size));\r\n}\r\n\r\n:where([mono-alert]) > [mono-clear] {\r\n  position: absolute;\r\n  top: calc(\r\n    var(--_mono-alert-padding-y) + var(--_mono-alert-icon-offset) +\r\n      (var(--_mono-alert-icon-size) - var(--_mono-alert-clear-size)) / 2\r\n  );\r\n  inset-inline-end: calc(var(--_mono-alert-padding-x) - (var(--_mono-alert-clear-size) - var(--_mono-alert-icon-size)) / 2);\r\n  display: inline-flex;\r\n  align-items: center;\r\n  justify-content: center;\r\n  width: var(--_mono-alert-clear-size);\r\n  height: var(--_mono-alert-clear-size);\r\n  padding: 0;\r\n  border: 0;\r\n  border-radius: var(--mono-radius-md);\r\n  background: transparent;\r\n  color: inherit;\r\n  opacity: 0.7;\r\n  cursor: pointer;\r\n  transition:\r\n    opacity var(--mono-duration-fast, 100ms) var(--mono-ease),\r\n    background-color var(--mono-duration-fast, 100ms) var(--mono-ease);\r\n}\r\n\r\n:where([mono-alert]) > [mono-clear] > svg {\r\n  width: var(--_mono-alert-icon-size);\r\n  height: var(--_mono-alert-icon-size);\r\n}\r\n\r\n@media (hover: hover) {\r\n  :where([mono-alert]) > [mono-clear]:hover {\r\n    opacity: 1;\r\n    background-color: color-mix(in oklab, currentColor 10%, transparent);\r\n  }\r\n}\r\n\r\n:where([mono-alert]) > [mono-clear]:focus-visible {\r\n  opacity: 1;\r\n  outline: none;\r\n  box-shadow: 0 0 0 var(--mono-ring-width) color-mix(in oklab, var(--ring) var(--mono-ring-alpha), transparent);\r\n}\r\n\r\n/* =========================================\r\n   Sizes — one factor over the md metrics (md = 1, the unqualified root)\r\n   ========================================= */\r\n\r\n[mono-alert][mono-size='xs'] { --_mono-alert-scale-preset: 0.8; }\r\n[mono-alert][mono-size='sm'] { --_mono-alert-scale-preset: 0.9; }\r\n[mono-alert][mono-size='lg'] { --_mono-alert-scale-preset: 1.1; }\r\n[mono-alert][mono-size='xl'] { --_mono-alert-scale-preset: 1.25; }\r\n[mono-alert][mono-size='xxl'] { --_mono-alert-scale-preset: 1.4; }\r\n\r\n/* =========================================\r\n   Colours — `danger` is upstream's destructive; `secondary` is the grey\r\n   SURFACE pair (its ink is the foreground, its solid plate the surface)\r\n   ========================================= */\r\n\r\n[mono-alert][mono-color='primary'] { --_mono-alert-c-preset: var(--primary); --_mono-alert-solid-bg-preset: var(--primary); --_mono-alert-solid-fg-preset: var(--primary-foreground); }\r\n[mono-alert][mono-color='secondary'] { --_mono-alert-c-preset: var(--secondary-foreground); --_mono-alert-solid-bg-preset: var(--secondary); --_mono-alert-solid-fg-preset: var(--secondary-foreground); }\r\n[mono-alert][mono-color='success'] { --_mono-alert-c-preset: var(--success); --_mono-alert-solid-bg-preset: var(--success); --_mono-alert-solid-fg-preset: var(--success-foreground); }\r\n[mono-alert][mono-color='danger'] { --_mono-alert-c-preset: var(--destructive); --_mono-alert-solid-bg-preset: var(--destructive); --_mono-alert-solid-fg-preset: var(--destructive-foreground); }\r\n[mono-alert][mono-color='warning'] { --_mono-alert-c-preset: var(--warning); --_mono-alert-solid-bg-preset: var(--warning); --_mono-alert-solid-fg-preset: var(--warning-foreground); }\r\n[mono-alert][mono-color='info'] { --_mono-alert-c-preset: var(--info); --_mono-alert-solid-bg-preset: var(--info); --_mono-alert-solid-fg-preset: var(--info-foreground); }\r\n[mono-alert][mono-color='teal'] { --_mono-alert-c-preset: var(--teal); --_mono-alert-solid-bg-preset: var(--teal); --_mono-alert-solid-fg-preset: var(--teal-foreground); }\r\n[mono-alert][mono-color='purple'] { --_mono-alert-c-preset: var(--purple); --_mono-alert-solid-bg-preset: var(--purple); --_mono-alert-solid-fg-preset: var(--purple-foreground); }\r\n[mono-alert][mono-color='neutral'] { --_mono-alert-c-preset: var(--neutral); --_mono-alert-solid-bg-preset: var(--neutral); --_mono-alert-solid-fg-preset: var(--neutral-foreground); }\r\n[mono-alert][mono-color='dark'] { --_mono-alert-c-preset: var(--dark); --_mono-alert-solid-bg-preset: var(--dark); --_mono-alert-solid-fg-preset: var(--dark-foreground); }\r\n\r\n/* =========================================\r\n   Variants — each resolves surface / edge / ink / sub-ink\r\n   ========================================= */\r\n\r\n/* outline (default) WITH a colour —\r\n   basecoat@1.0.2 styles/vega.css .alert[data-variant='destructive'] — text-destructive bg-card [&>svg]:text-current\r\n   basecoat@1.0.2 styles/vega.css .alert[data-variant='destructive'] > section — text-destructive/90\r\n   generalised to every hue; the edge picks up the hue too (EXTENSION), mixed into\r\n   --border so it follows the mode. Without a colour it is `.alert` verbatim. */\r\n[mono-alert][mono-color]:is(:not([mono-variant]), [mono-variant='outline']) {\r\n  --_mono-alert-edge: color-mix(in oklab, var(--_mono-alert-c) 45%, var(--_mono-alert-border-color));\r\n  --_mono-alert-ink: var(--_mono-alert-c);\r\n  --_mono-alert-sub-ink: color-mix(in oklab, var(--_mono-alert-c) 90%, transparent);\r\n}\r\n\r\n/* tonal — the hue tinted over the card (chip `soft` / card `tonal`); dark mode\r\n   deepens the tint through --mono-mode-tint */\r\n[mono-alert][mono-variant='tonal'] {\r\n  --_mono-alert-surface: color-mix(in oklab, var(--_mono-alert-c) var(--mono-mode-tint), var(--_mono-alert-bg));\r\n  --_mono-alert-edge: transparent;\r\n  --_mono-alert-ink: var(--_mono-alert-c);\r\n  --_mono-alert-sub-ink: color-mix(in oklab, var(--_mono-alert-c) 90%, transparent);\r\n}\r\n\r\n/* solid — the hue as the plate */\r\n[mono-alert][mono-variant='solid'] {\r\n  --_mono-alert-surface: var(--_mono-alert-solid-bg);\r\n  --_mono-alert-edge: transparent;\r\n  --_mono-alert-ink: var(--_mono-alert-solid-fg);\r\n  --_mono-alert-sub-ink: color-mix(in oklab, var(--_mono-alert-solid-fg) 90%, transparent);\r\n  --_mono-alert-bar: var(--_mono-alert-solid-fg);\r\n}\r\n\r\n/* text — no plate, no edge: an inline notice in the hue */\r\n[mono-alert][mono-variant='text'] {\r\n  --_mono-alert-surface: transparent;\r\n  --_mono-alert-edge: transparent;\r\n  --_mono-alert-ink: var(--_mono-alert-c);\r\n  --_mono-alert-sub-ink: color-mix(in oklab, var(--_mono-alert-c) 90%, transparent);\r\n}\r\n\r\n/* =========================================\r\n   Stacking — consecutive visible alerts keep a gap; a hidden (✕-ed) one takes\r\n   no room, so the rest move up. `[mono-alert-group]` lays them out itself.\r\n   ========================================= */\r\n\r\n:where(mono-alert, mono-shadow-alert, [mono-alert]):not([hidden]) ~ :where(mono-alert, mono-shadow-alert, [mono-alert]):not([hidden]) {\r\n  margin-block-start: var(--mono-alert-stack-gap, calc(var(--mono-spacing) * 3));\r\n}\r\n\r\n[mono-alert-group] {\r\n  display: flex;\r\n  flex-direction: column;\r\n  gap: var(--mono-alert-group-gap, calc(var(--mono-spacing) * 3));\r\n}\r\n\r\n[mono-alert-group] > :is(mono-alert, mono-shadow-alert, [mono-alert]) {\r\n  margin-block-start: 0;\r\n}\r\n";
//#endregion
//#region src/components/alert/mono-alert.ts
/** Named regions. Unslotted children fall into `body` (the capture fallback). */
var ALERT_NAMED_SLOTS = [
	"icon",
	"title",
	"subtitle",
	"body"
];
var MonoAlert = class MonoAlert extends MonoAlertCore(LitElement) {
	constructor(..._args) {
		super(..._args);
		this._slotsCaptured = false;
		this._buckets = /* @__PURE__ */ new Map();
	}
	static {
		this.styles = [unsafeCSS(alert_default)];
	}
	createRenderRoot() {
		return this;
	}
	/**
	* The body region is ALWAYS rendered (like the card's): it is also the home
	* of the consumer framework's positional anchors (`<!--v-if-->`), which must
	* keep a live, visible parent — content a `v-if` inserts there later has to
	* show up. It is `mono-empty` while it holds nothing but anchors, and a
	* MutationObserver flips `_hasBodySlot` when real content arrives or leaves.
	*/
	_renderMain() {
		const body = html`<div
      class=${this._cls("mono-alert-body", "body")}
      mono-body
      data-mono-slot="body"
      ?mono-empty=${!this._hasBodySlot}
    ></div>`;
		return html`${this._showsIcon ? html`<span class=${this._cls("mono-alert-icon", "icon")} mono-icon aria-hidden="true"
          >${this._hasIconSlot ? html`<span data-mono-slot="icon"></span>` : this._renderIconGlyph()}</span
        >` : nothing}${this._showsTitle ? this._hasTitleSlot ? html`<div class=${this._cls("mono-alert-title", "title")} mono-title data-mono-slot="title"></div>` : html`<div class=${this._cls("mono-alert-title", "title")} mono-title>${this.title}</div>` : nothing}${this._showsSubtitle ? this._hasSubtitleSlot ? html`<div class=${this._cls("mono-alert-subtitle", "subtitle")} mono-subtitle data-mono-slot="subtitle"></div>` : html`<div class=${this._cls("mono-alert-subtitle", "subtitle")} mono-subtitle>${this.subtitle}</div>` : nothing}${body}`;
	}
	/** Re-read body presence from the placed region (late `v-if` content). */
	_watchBody() {
		if (this._bodyObserver || typeof MutationObserver === "undefined") return;
		const region = this.querySelector(":scope > [mono-alert] > [data-mono-slot=\"body\"], :scope > phantom-ui > [mono-alert] > [data-mono-slot=\"body\"]");
		if (!region) return;
		this._bodyObserver = new MutationObserver(() => {
			const has = bucketHasContent(Array.from(region.childNodes));
			if (has !== this._hasBodySlot) this._hasBodySlot = has;
		});
		this._bodyObserver.observe(region, {
			childList: true,
			characterData: true,
			subtree: true
		});
	}
	disconnectedCallback() {
		super.disconnectedCallback();
		this._bodyObserver?.disconnect();
		this._bodyObserver = void 0;
	}
	connectedCallback() {
		super.connectedCallback();
		this._captureSlots();
		if (this.isConnected) this.performUpdate();
	}
	_captureSlots() {
		if (this._slotsCaptured) return;
		this._slotsCaptured = true;
		this._buckets = captureLightSlots(this, {
			names: ALERT_NAMED_SLOTS,
			fallback: "body"
		});
		this._hasIconSlot = bucketHasContent(this._buckets.get("icon"));
		this._hasTitleSlot = bucketHasContent(this._buckets.get("title"));
		this._hasSubtitleSlot = bucketHasContent(this._buckets.get("subtitle"));
		this._hasBodySlot = bucketHasContent(this._buckets.get("body"));
	}
	updated(changed) {
		super.updated(changed);
		placeLightSlots(this, this._buckets);
		for (const nodes of this._buckets.values()) this._parked = parkDetachedNodes(this._parked, nodes);
		this._watchBody();
	}
};
MonoAlert = __decorate([customElement("mono-alert")], MonoAlert);
//#endregion
export { MonoAlert };
