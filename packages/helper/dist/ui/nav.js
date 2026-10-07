import { l as monoHostChildNodes } from "../mono-ui-CPV7rrdo.js";
import { t as customElement } from "../mono-element-B0kP_96P.js";
import { r as booleanStringConverter, t as __decorate } from "../decorate-DEXtNagw.js";
import { i as guardHostTextContent, s as placeSlotNode } from "../light-slots-DW1WgfgT.js";
import { n as cssPart, r as defineCssClassAliases, t as applyCssClass } from "../css-class-BRKRzHx-.js";
import { a as validateColorProp, i as isThemeColorToken, n as colorClassToken, r as customColorStyle, t as CUSTOM_COLOR_CLASS } from "../color-DHYrfXsX.js";
import { n as releaseLayoutVar, t as claimLayoutVar } from "../layout-var-CZnzMC0s.js";
import { LitElement, html, nothing, unsafeCSS } from "lit";
import { property, state } from "lit/decorators.js";
//#region src/components/nav/nav-utils.ts
var DENSITY_HEIGHTS = {
	compact: 48,
	comfortable: 56,
	default: 64
};
function getNavHeight(density) {
	return DENSITY_HEIGHTS[density] ?? DENSITY_HEIGHTS.default;
}
function generateNavRootClasses(props) {
	return [
		"mono-nav",
		props.density,
		colorClassToken(props.color),
		props.variant,
		props.sticky ? "sticky" : "",
		props.extension ? "has-extension" : "",
		props.cssClassName ?? "",
		props.rootExtra ?? ""
	].filter(Boolean).join(" ");
}
function validateNavProps(props) {
	const errors = [];
	if (props.density && ![
		"compact",
		"comfortable",
		"default"
	].includes(props.density)) errors.push(`Invalid density: ${String(props.density)}`);
	const colorError = validateColorProp(props.color);
	if (colorError) errors.push(colorError);
	if (props.variant && ![
		"flat",
		"elevated",
		"outlined"
	].includes(props.variant)) errors.push(`Invalid variant: ${String(props.variant)}`);
	return errors;
}
//#endregion
//#region src/components/nav/nav-core.ts
/**
* `MonoNavCore` — every render-mode-agnostic concern for `mono-nav`:
* reactive props, the `css-class`/`cssclass` hybrid aliases, attribute
* observation, layout-var side effects, and the chrome `render()`.
*
* What it deliberately does NOT decide:
*  - `createRenderRoot()` (light vs shadow) — set by each wrapper.
*  - how styles apply (global sheet vs `static styles`) — set by each wrapper.
*  - the slot strategy — `renderSlot()` is a hook each wrapper overrides
*    (light: empty, nodes are captured/placed; shadow: native `<slot>`).
*/
var MonoNavCore = (superClass) => {
	class MonoNavCoreClass extends superClass {
		constructor(...args) {
			super(...args);
			this.density = "comfortable";
			this.color = "surface";
			this.variant = "elevated";
			this.sticky = true;
			this.extension = false;
			this.cssClass = {};
			this.cssClassName = "";
			defineCssClassAliases(this, (value) => this._setCssClass(value));
		}
		static get observedAttributes() {
			return [
				...super.observedAttributes ?? [],
				"css-class",
				"cssclass"
			];
		}
		attributeChangedCallback(name, oldValue, newValue) {
			super.attributeChangedCallback(name, oldValue, newValue);
			if (oldValue === newValue) return;
			if (name === "css-class" || name === "cssclass") this._setCssClass(newValue);
		}
		connectedCallback() {
			super.connectedCallback();
			this._writeLayoutVar();
		}
		disconnectedCallback() {
			super.disconnectedCallback();
			this._clearLayoutVar();
		}
		willUpdate(changed) {
			if (changed.has("density") && this.isConnected) this._writeLayoutVar();
			super.willUpdate?.(changed);
		}
		_setCssClass(value) {
			applyCssClass(this, value);
		}
		_cls(base, key) {
			return cssPart(this.cssClass, base, key);
		}
		get _rootClasses() {
			return generateNavRootClasses({
				density: this.density,
				color: this.color,
				variant: this.variant,
				sticky: this.sticky,
				extension: this.extension,
				cssClassName: this.cssClassName,
				rootExtra: this.cssClass?.root
			});
		}
		/**
		* Resolved bar height in pixels. Includes the extension row when enabled.
		* Public so consumers can size their main content imperatively if they
		* prefer JS over the `--mono-nav-height` CSS variable.
		*/
		getHeight() {
			const base = getNavHeight(this.density);
			if (!this.extension) return base;
			return base + (this.density === "compact" ? 36 : this.density === "default" ? 48 : 44);
		}
		/**
		* `--mono-nav-height` is a DOCUMENT-level property, so every mounted nav writes
		* the same one. Claiming it through the shared refcount means unmounting one nav
		* no longer blanks the height for a nav that is still on screen — which is what
		* a route transition that mounts the new nav before unmounting the old one does.
		* See `composables/layout-var.ts`; `mono-sidebar` had the identical bug.
		*/
		_writeLayoutVar() {
			if (typeof document === "undefined") return;
			claimLayoutVar("--mono-nav-height", this, `${this.getHeight()}px`);
		}
		_clearLayoutVar() {
			if (typeof document === "undefined") return;
			releaseLayoutVar("--mono-nav-height", this);
		}
		/**
		* Per-region slot content. Overridden by each build:
		*  - light DOM: returns nothing — children are captured and appended into
		*    the `[data-mono-slot]` targets imperatively.
		*  - shadow DOM: returns a native `<slot>` (unnamed for `default`).
		*/
		renderSlot(_slotName) {
			return html``;
		}
		/**
		
		* Carries a literal `color` (`#7c3aed`, `rgb(…)`) that no stylesheet can know about.
		* Empty for a palette slot, which resolves entirely through the `.mono-nav.<token>`
		* rules instead.
		*
		* Must land on the ROOT element, not the host: a class-based `-preset` declared on
		* the root beats an inherited one, so a host-level write would silently lose. If a
		* `_syncRootFromState`-style attribute re-assert is ever added here (sidebar has one),
		* it has to serialize from THIS getter or it will wipe the colour.
		*/
		get _inlineRootStyle() {
			return customColorStyle(isThemeColorToken(this.color) || this.color === "surface" ? "" : this.color, "nav");
		}
		/**
		* The Basecoat styling attributes, mirroring the props one for one. A prop
		* at its DEFAULT emits nothing — `:not([mono-density])` is comfortable,
		* `:not([mono-color])` is surface, `:not([mono-variant])` is elevated —
		* so the rendered DOM is also the shortest hand-written markup that paints
		* the same (see nav.css).
		*
		* `sticky` is the exception: it defaults to TRUE, so it is the negative
		* that carries information and `mono-static` is what a non-sticky bar says.
		*/
		get _densityAttr() {
			return this.density === "comfortable" ? nothing : this.density;
		}
		/** A literal colour cannot be an attribute VALUE any more than it could be a
		*  class token, so it collapses to the same `custom` marker and the colour
		*  itself arrives inline (see `_inlineRootStyle`). */
		get _colorAttr() {
			if (!this.color || this.color === "surface") return nothing;
			return isThemeColorToken(this.color) ? this.color : CUSTOM_COLOR_CLASS;
		}
		get _variantAttr() {
			return this.variant === "elevated" ? nothing : this.variant;
		}
		render() {
			return html`
        <header
          class=${this._rootClasses}
          style=${this._inlineRootStyle}
          role="banner"
          mono-nav
          mono-density=${this._densityAttr}
          mono-color=${this._colorAttr}
          mono-variant=${this._variantAttr}
          ?mono-static=${!this.sticky}
          ?mono-has-extension=${this.extension}
        >
          <div class=${this._cls("mono-nav-inner", "inner")} mono-inner>
            <div class=${this._cls("mono-nav-start", "start")} mono-start data-mono-slot="start">${this.renderSlot("start")}</div>
            <div class=${this._cls("mono-nav-center", "center")} mono-center data-mono-slot="default">${this.renderSlot("default")}</div>
            <div class=${this._cls("mono-nav-end", "end")} mono-end data-mono-slot="end">${this.renderSlot("end")}</div>
          </div>
          <div class=${this._cls("mono-nav-extension", "extension")} mono-extension data-mono-slot="extension">${this.renderSlot("extension")}</div>
        </header>
      `;
		}
	}
	__decorate([property({ type: String })], MonoNavCoreClass.prototype, "density", void 0);
	__decorate([property({ type: String })], MonoNavCoreClass.prototype, "color", void 0);
	__decorate([property({ type: String })], MonoNavCoreClass.prototype, "variant", void 0);
	__decorate([property({
		reflect: true,
		converter: booleanStringConverter
	})], MonoNavCoreClass.prototype, "sticky", void 0);
	__decorate([property({
		reflect: true,
		converter: booleanStringConverter
	})], MonoNavCoreClass.prototype, "extension", void 0);
	__decorate([property({ attribute: false })], MonoNavCoreClass.prototype, "cssClass", void 0);
	__decorate([property({ attribute: false })], MonoNavCoreClass.prototype, "cssClassName", void 0);
	return MonoNavCoreClass;
};
//#endregion
//#region src/components/nav/nav.css?raw
var nav_default = "/* @unocss-include */\r\n\r\n/* =========================================================================\r\n   mono-nav — the top app bar.\r\n\r\n   Basecoat ships NO nav component. basecoat-css@1.0.2 has dialog, drawer,\r\n   sidebar, tabs, dropdown-menu … and no header bar, so this is an EXTENSION:\r\n   the structure is mono's own and every VALUE is drawn from the Basecoat token\r\n   layer and from `.sidebar nav`, which is the other piece of app chrome and the\r\n   one this bar sits beside. Where a rule has an upstream counterpart it is\r\n   cited; everything else is ours.\r\n\r\n   Styled by ATTRIBUTE, like the rest of the port — and the attributes mirror\r\n   the element's props one for one, so hand-written markup reads like the Lit /\r\n   Vue tag:\r\n\r\n     <mono-nav density=\"compact\" color=\"primary\" variant=\"outlined\" extension>\r\n     <header mono-nav mono-density=\"compact\" mono-color=\"primary\"\r\n             mono-variant=\"outlined\" mono-has-extension role=\"banner\">\r\n       <div mono-inner>\r\n         <div mono-start>…</div>\r\n         <div mono-center>…</div>\r\n         <div mono-end>…</div>\r\n       </div>\r\n       <div mono-extension>…</div>\r\n     </header>\r\n\r\n   An absent attribute is the prop's default (`:not([mono-density])` =\r\n   comfortable, `:not([mono-color])` = surface, `:not([mono-variant])` =\r\n   elevated). `sticky` defaults to TRUE, so it is the NEGATIVE that says\r\n   something: `mono-static` opts a bar out. The old classes\r\n   (`.mono-nav.comfortable.surface.elevated.sticky`) are still emitted as inert\r\n   hooks until 2.0 but no rule here reads them.\r\n\r\n   Selector map:\r\n     [mono-nav]            the <header> — the bar, and the var scope\r\n     [mono-density=…]      EXTENSION (compact / comfortable / default)\r\n     [mono-color=…]        EXTENSION (ten palette roles, `surface`, `custom`)\r\n     [mono-variant=…]      EXTENSION (elevated / flat / outlined)\r\n     [mono-inner]          the bar row\r\n     [mono-start] / [mono-center] / [mono-end]   the three regions\r\n     [mono-extension]      the optional second row\r\n\r\n   COLOUR. `surface` (the default) leaves the bar unpainted: it takes\r\n   `--sidebar` / `--sidebar-foreground` / `--sidebar-border`, exactly what\r\n   upstream gives the sidebar's own chrome. Every other role PAINTS the bar in\r\n   that role and inks it in the role's `-foreground` token, the way\r\n   `.btn[data-variant='primary']` does — which is what finally retires the\r\n   `--*-rgb` triples and the hand-rolled contrast maths the pre-port sheet\r\n   needed. A literal `color` (\"#7c3aed\") still arrives inline from the component\r\n   (`composables/color.ts`) as `mono-color=\"custom\"`.\r\n\r\n   NO GRADIENTS, NO BLUR. The pre-port `surface` bar was a 96%-opaque\r\n   `backdrop-filter: blur(12px)` pane and `elevated` was an accent-tinted glow.\r\n   Both are gone: the bar is opaque and `elevated` is `--mono-shadow-sm`.\r\n   `--mono-nav-backdrop-filter` brings the blur back for a page that wants it.\r\n\r\n   DARK MODE comes free — every colour here resolves through a Basecoat token\r\n   that already flips, and the alphas are mode-independent. No `.dark` rule can\r\n   live in component CSS anyway: a selector crosses neither the custom-element\r\n   host nor the shadow boundary.\r\n\r\n   FLAVORS set `--mono-nav-{bar-height,pad-x,gap,extension-height,radius,shadow,\r\n   font-size,…}` (+ the per-density forms). Every fallback here is the token\r\n   layer's own value.\r\n   ========================================================================= */\r\n\r\nmono-nav {\r\n  display: block;\r\n}\r\n\r\n/* =========================================\r\n   Root — the bar\r\n   ========================================= */\r\n\r\n[mono-nav] {\r\n  /* ── the ten roles, each a public knob over a Basecoat token ───────────── */\r\n  --_mono-nav-primary: var(--mono-nav-primary, var(--primary));\r\n  --_mono-nav-secondary: var(--mono-nav-secondary, var(--secondary-foreground));\r\n  --_mono-nav-success: var(--mono-nav-success, var(--success));\r\n  --_mono-nav-danger: var(--mono-nav-danger, var(--destructive));\r\n  --_mono-nav-warning: var(--mono-nav-warning, var(--warning));\r\n  --_mono-nav-info: var(--mono-nav-info, var(--info));\r\n  --_mono-nav-teal: var(--mono-nav-teal, var(--teal));\r\n  --_mono-nav-purple: var(--mono-nav-purple, var(--purple));\r\n  --_mono-nav-neutral: var(--mono-nav-neutral, var(--neutral));\r\n  --_mono-nav-dark: var(--mono-nav-dark, var(--dark));\r\n\r\n  /* the colour in play — `primary` unless a [mono-color] rule re-points it */\r\n  --_mono-nav-accent: var(--mono-nav-accent, var(--_mono-nav-accent-preset, var(--_mono-nav-primary)));\r\n  /* Ink for anything painted IN the accent. Each role points this at its own\r\n     `-foreground` token, so a light role (warning, neutral) gets readable ink\r\n     without a luminance calculation; a literal colour gets one written inline\r\n     by the component. */\r\n  --_mono-nav-on-accent: var(--mono-nav-on-accent, var(--_mono-nav-on-accent-preset, var(--primary-foreground)));\r\n\r\n  /* ── the unpainted surface ───────────────────────────────────────────────\r\n     basecoat@1.0.2 styles/vega.css .sidebar nav — bg-sidebar text-sidebar-foreground\r\n     `--sidebar` IS `--card` in the token layer, so this is the card's surface\r\n     under the name the one piece of upstream chrome actually uses. */\r\n  --_mono-nav-surface: var(--mono-nav-surface, var(--sidebar));\r\n  /* the `outlined` variant's bottom rule — a nav idiom with no card counterpart,\r\n     so it takes the card's ring colour rather than inventing one */\r\n  --_mono-nav-border: var(--mono-nav-border, var(--_mono-nav-ring-color));\r\n\r\n  --_mono-nav-bg: var(--mono-nav-bg, var(--_mono-nav-bg-preset, var(--_mono-nav-surface)));\r\n  --_mono-nav-text: var(--mono-nav-text, var(--_mono-nav-text-preset, var(--sidebar-foreground)));\r\n  /* basecoat@1.0.2 styles/vega.css .sidebar nav h3 — text-sidebar-foreground/70 …:\r\n     upstream's muted chrome ink is the bar ink at 70%, not a separate token. */\r\n  --_mono-nav-text-soft: var(--mono-nav-text-soft, var(--_mono-nav-text-soft-preset, color-mix(in oklab, var(--_mono-nav-text) 70%, transparent)));\r\n  /* basecoat@1.0.2 styles/vega.css .sidebar nav [role=separator] — border-sidebar-border mx-2 */\r\n  --_mono-nav-border-lite: var(--mono-nav-border-lite, var(--_mono-nav-border-lite-preset, var(--sidebar-border)));\r\n\r\n  /* ── comfortable metrics live on the unqualified root ON PURPOSE ───────── */\r\n  --_mono-nav-height: var(--mono-nav-bar-height, var(--_mono-nav-height-preset, var(--mono-nav-bar-height-comfortable, calc(var(--mono-spacing) * 14))));\r\n  --_mono-nav-extension-height: var(--mono-nav-extension-height, var(--_mono-nav-extension-height-preset, var(--mono-nav-extension-height-comfortable, calc(var(--mono-spacing) * 11))));\r\n  /* the card's own gutter — basecoat@1.0.2 styles/vega.css .card > header — gap-1 rounded-t-xl px-6 …\r\n     The compact and default steps SCALE from this one, so a flavor moves all\r\n     three gutters by setting `--mono-nav-pad-x-comfortable` alone. */\r\n  --_mono-nav-pad-unit: var(--mono-nav-pad-x-comfortable, calc(var(--mono-spacing) * 6));\r\n  --_mono-nav-pad-x: var(--mono-nav-pad-x, var(--_mono-nav-pad-x-preset, var(--_mono-nav-pad-unit)));\r\n  --_mono-nav-gap: var(--mono-nav-gap, var(--_mono-nav-gap-preset, var(--mono-nav-gap-comfortable, calc(var(--mono-spacing) * 3))));\r\n  --_mono-nav-font: var(--mono-nav-font, var(--_mono-nav-font-preset, var(--mono-nav-font-comfortable, var(--mono-text-sm))));\r\n  --_mono-nav-extension-font: var(--mono-nav-extension-font, var(--_mono-nav-extension-font-preset, var(--mono-nav-extension-font-comfortable, var(--mono-text-sm))));\r\n\r\n  /* ── chrome — THE NAV IS A CARD ─────────────────────────────────────────\r\n     basecoat@1.0.2 styles/vega.css .card — ring-foreground/10 bg-card\r\n     text-card-foreground overflow-hidden rounded-xl text-sm shadow-xs ring-1 …\r\n\r\n     Basecoat has no nav, but it has a wide rectangular surface with an edge and\r\n     an elevation, and that is exactly what a top bar is. So the bar's chrome\r\n     tracks `.card` value for value — radius, ring, shadow, gutter and type —\r\n     and every flavor's nav delta is its CARD delta (sera square and roomy, maia\r\n     2xl, luma 4xl with shadow-md, mira lg, lyra square and tight, rhea 3xl).\r\n     Without this the eight styles all painted the same bar, which was the bug.\r\n\r\n     The ring is drawn INSIDE the border box, as card.css draws it: an outside\r\n     ring is the first pixel lost to any ancestor that clips, and a bar is\r\n     usually flush against one. A full-bleed bar that wants no edge at all sets\r\n     `--mono-nav-ring-width: 0`. */\r\n  --_mono-nav-radius: var(--mono-nav-radius, var(--mono-radius-xl));\r\n  --_mono-nav-ring-color: var(--mono-nav-ring-color, color-mix(in oklab, var(--foreground) 10%, transparent));\r\n  --_mono-nav-ring-width: var(--mono-nav-ring-width, var(--mono-border-width));\r\n  --_mono-nav-ring: inset 0 0 0 var(--_mono-nav-ring-width) var(--_mono-nav-ring-color);\r\n  --_mono-nav-shadow: var(--mono-nav-shadow, var(--mono-shadow-xs));\r\n  --_mono-nav-border-width: var(--mono-nav-border-width, var(--mono-border-width));\r\n  --_mono-nav-backdrop-filter: var(--mono-nav-backdrop-filter, none);\r\n  --_mono-nav-z: var(--mono-nav-z, 30);\r\n\r\n  display: block;\r\n  width: 100%;\r\n  font-family: inherit;\r\n  font-size: var(--_mono-nav-font);\r\n  color: var(--_mono-nav-text);\r\n  background: var(--_mono-nav-bg);\r\n  border-radius: var(--_mono-nav-radius);\r\n  border-bottom: var(--_mono-nav-border-width) solid transparent;\r\n  backdrop-filter: var(--_mono-nav-backdrop-filter);\r\n  -webkit-backdrop-filter: var(--_mono-nav-backdrop-filter);\r\n  z-index: var(--_mono-nav-z);\r\n\r\n  transition:\r\n    background-color var(--mono-duration) var(--mono-ease),\r\n    box-shadow var(--mono-duration) var(--mono-ease),\r\n    border-color var(--mono-duration) var(--mono-ease);\r\n}\r\n\r\n[mono-nav],\r\n:where([mono-nav]) *,\r\n:where([mono-nav]) *::before,\r\n:where([mono-nav]) *::after {\r\n  box-sizing: border-box;\r\n}\r\n\r\n/* =========================================\r\n   Density — EXTENSION: the bar's vertical rhythm\r\n   ========================================= */\r\n\r\n[mono-nav][mono-density=\"compact\"] {\r\n  --_mono-nav-height-preset: var(--mono-nav-bar-height-compact, calc(var(--mono-spacing) * 12));\r\n  --_mono-nav-extension-height-preset: var(--mono-nav-extension-height-compact, calc(var(--mono-spacing) * 9));\r\n  --_mono-nav-pad-x-preset: var(--mono-nav-pad-x-compact, calc(var(--_mono-nav-pad-unit) * 0.6667));\r\n  --_mono-nav-gap-preset: var(--mono-nav-gap-compact, calc(var(--mono-spacing) * 2));\r\n  --_mono-nav-font-preset: var(--mono-nav-font-compact, var(--mono-text-xs));\r\n  --_mono-nav-extension-font-preset: var(--mono-nav-extension-font-compact, var(--mono-text-xs));\r\n}\r\n\r\n[mono-nav][mono-density=\"default\"] {\r\n  --_mono-nav-height-preset: var(--mono-nav-bar-height-default, calc(var(--mono-spacing) * 16));\r\n  --_mono-nav-extension-height-preset: var(--mono-nav-extension-height-default, calc(var(--mono-spacing) * 12));\r\n  --_mono-nav-pad-x-preset: var(--mono-nav-pad-x-default, calc(var(--_mono-nav-pad-unit) * 1.3333));\r\n  --_mono-nav-gap-preset: var(--mono-nav-gap-default, calc(var(--mono-spacing) * 3.5));\r\n  --_mono-nav-font-preset: var(--mono-nav-font-default, var(--mono-text-base));\r\n  --_mono-nav-extension-font-preset: var(--mono-nav-extension-font-default, var(--mono-text-sm));\r\n}\r\n\r\n/* =========================================\r\n   Colours — EXTENSION: `surface` is the bar unpainted, every role paints it\r\n   ========================================= */\r\n\r\n[mono-nav][mono-color=\"primary\"] {\r\n  --_mono-nav-accent-preset: var(--_mono-nav-primary);\r\n  --_mono-nav-on-accent-preset: var(--primary-foreground);\r\n}\r\n\r\n[mono-nav][mono-color=\"secondary\"] {\r\n  --_mono-nav-accent-preset: var(--_mono-nav-secondary);\r\n  --_mono-nav-on-accent-preset: var(--secondary);\r\n}\r\n\r\n[mono-nav][mono-color=\"success\"] {\r\n  --_mono-nav-accent-preset: var(--_mono-nav-success);\r\n  --_mono-nav-on-accent-preset: var(--success-foreground);\r\n}\r\n\r\n[mono-nav][mono-color=\"danger\"] {\r\n  --_mono-nav-accent-preset: var(--_mono-nav-danger);\r\n  --_mono-nav-on-accent-preset: var(--destructive-foreground);\r\n}\r\n\r\n[mono-nav][mono-color=\"warning\"] {\r\n  --_mono-nav-accent-preset: var(--_mono-nav-warning);\r\n  --_mono-nav-on-accent-preset: var(--warning-foreground);\r\n}\r\n\r\n[mono-nav][mono-color=\"info\"] {\r\n  --_mono-nav-accent-preset: var(--_mono-nav-info);\r\n  --_mono-nav-on-accent-preset: var(--info-foreground);\r\n}\r\n\r\n[mono-nav][mono-color=\"teal\"] {\r\n  --_mono-nav-accent-preset: var(--_mono-nav-teal);\r\n  --_mono-nav-on-accent-preset: var(--teal-foreground);\r\n}\r\n\r\n[mono-nav][mono-color=\"purple\"] {\r\n  --_mono-nav-accent-preset: var(--_mono-nav-purple);\r\n  --_mono-nav-on-accent-preset: var(--purple-foreground);\r\n}\r\n\r\n[mono-nav][mono-color=\"neutral\"] {\r\n  --_mono-nav-accent-preset: var(--_mono-nav-neutral);\r\n  --_mono-nav-on-accent-preset: var(--neutral-foreground);\r\n}\r\n\r\n[mono-nav][mono-color=\"dark\"] {\r\n  --_mono-nav-accent-preset: var(--_mono-nav-dark);\r\n  --_mono-nav-on-accent-preset: var(--dark-foreground);\r\n}\r\n\r\n/* A painted bar takes the role as its fill and the role's `-foreground` as its\r\n   ink — the `.btn[data-variant='primary']` pattern, one level up. Every\r\n   foreground on the bar is then mixed FROM that ink rather than from a literal\r\n   white, so `warning` and `neutral` stay readable. `custom` is the marker for a\r\n   literal `color`; its accent and ink arrive inline from the component. */\r\n[mono-nav]:is(\r\n    [mono-color=\"primary\"],\r\n    [mono-color=\"secondary\"],\r\n    [mono-color=\"success\"],\r\n    [mono-color=\"danger\"],\r\n    [mono-color=\"warning\"],\r\n    [mono-color=\"info\"],\r\n    [mono-color=\"teal\"],\r\n    [mono-color=\"purple\"],\r\n    [mono-color=\"neutral\"],\r\n    [mono-color=\"dark\"],\r\n    [mono-color=\"custom\"]\r\n  ) {\r\n  --_mono-nav-bg-preset: var(--_mono-nav-accent);\r\n  --_mono-nav-text-preset: var(--_mono-nav-on-accent);\r\n  --_mono-nav-text-soft-preset: color-mix(in oklab, var(--_mono-nav-on-accent) 70%, transparent);\r\n  --_mono-nav-border-lite-preset: color-mix(in oklab, var(--_mono-nav-on-accent) 20%, transparent);\r\n}\r\n\r\n/* =========================================\r\n   Variants\r\n   ========================================= */\r\n\r\n/* `elevated` is the default, so the unqualified root carries it — and it is the\r\n   card exactly: the inset ring AND the elevation, in that order. */\r\n[mono-nav]:is(:not([mono-variant]), [mono-variant=\"elevated\"]) {\r\n  box-shadow: var(--_mono-nav-ring), var(--_mono-nav-shadow);\r\n}\r\n\r\n/* `flat` drops both. */\r\n[mono-nav][mono-variant=\"flat\"] {\r\n  box-shadow: none;\r\n  border-bottom-color: transparent;\r\n}\r\n\r\n/* `outlined` trades the elevation for a bottom rule — the nav idiom, and the\r\n   one piece of its chrome the card has no counterpart for. The ring stays, so\r\n   an outlined bar still reads as the same surface. */\r\n[mono-nav][mono-variant=\"outlined\"] {\r\n  box-shadow: var(--_mono-nav-ring);\r\n  border-bottom-color: var(--_mono-nav-border);\r\n}\r\n\r\n/* =========================================\r\n   Sticky\r\n   -----------------------------------------------------------------------------\r\n   `sticky` is ON by default, so the attribute that says something is the\r\n   negative. In the light build the host `<mono-nav>` is what sits in the parent\r\n   layout flow and the inner `<header>` only fills it, so the host is what has to\r\n   stick — a sticky inner header has no scroll distance inside a host that\r\n   shrink-wraps it (which is also why leaving the rule on both is harmless). In\r\n   hand-written markup the `<header>` IS the element in flow, and the same rule\r\n   does the work.\r\n\r\n   The host reflects the prop (`converter` empty-attr === true, missing ===\r\n   false), so `[sticky]` is the right selector there.\r\n   ========================================= */\r\n\r\nmono-nav[sticky],\r\n[mono-nav]:not([mono-static]) {\r\n  position: sticky;\r\n  top: 0;\r\n  z-index: var(--mono-nav-z, 30);\r\n}\r\n\r\n[mono-nav][mono-static] {\r\n  position: static;\r\n}\r\n\r\n/* =========================================\r\n   The bar row\r\n   ========================================= */\r\n\r\n:where([mono-nav]) > [mono-inner] {\r\n  display: flex;\r\n  align-items: center;\r\n  gap: var(--_mono-nav-gap);\r\n  padding: 0 var(--_mono-nav-pad-x);\r\n  height: var(--_mono-nav-height);\r\n  min-height: var(--_mono-nav-height);\r\n  width: 100%;\r\n}\r\n\r\n:where([mono-nav] > [mono-inner]) > [mono-start] {\r\n  display: flex;\r\n  align-items: center;\r\n  gap: var(--_mono-nav-gap);\r\n  flex-shrink: 0;\r\n  min-width: 0;\r\n}\r\n\r\n:where([mono-nav] > [mono-inner]) > [mono-center] {\r\n  display: flex;\r\n  align-items: center;\r\n  gap: var(--_mono-nav-gap);\r\n  flex: 1;\r\n  min-width: 0;\r\n}\r\n\r\n/* `margin-left: auto` keeps the end region at the trailing edge even when the\r\n   center is empty and collapsed. */\r\n:where([mono-nav] > [mono-inner]) > [mono-end] {\r\n  display: flex;\r\n  align-items: center;\r\n  gap: calc(var(--_mono-nav-gap) * 0.7);\r\n  flex-shrink: 0;\r\n  margin-left: auto;\r\n}\r\n\r\n/* An empty region is NOT hidden.\r\n\r\n   `:empty` cannot see across a shadow boundary: in the shadow build each region\r\n   holds a <slot> ELEMENT, so the region is never `:empty` whether or not anything\r\n   is assigned to it, and a <slot>'s own children are its fallback content rather\r\n   than the assigned nodes — there is no selector for \"nothing was slotted here\".\r\n   The light build WAS `:empty` in that case, so a bar with no center content laid\r\n   out with one flex gap in the light build and two in the shadow one: 12px apart\r\n   at max-content width, which is what a shrink-to-fit demo shows.\r\n\r\n   Leaving every region in place is what makes the two builds agree. It costs\r\n   nothing at a normal full-width bar — the center is `flex: 1` and eats the slack\r\n   either way, and the end region is pinned by its own `margin-left: auto`. */\r\n\r\n/* =========================================\r\n   Extension row\r\n   ========================================= */\r\n\r\n:where([mono-nav]) > [mono-extension] {\r\n  display: flex;\r\n  align-items: center;\r\n  gap: var(--_mono-nav-gap);\r\n  padding: 0 var(--_mono-nav-pad-x);\r\n  min-height: var(--_mono-nav-extension-height);\r\n  border-top: var(--_mono-nav-border-width) solid var(--_mono-nav-border-lite);\r\n  font-size: var(--_mono-nav-extension-font);\r\n}\r\n\r\n/* The element always renders the row so its slot target is stable; the root\r\n   attribute is what turns it on. Hand-written markup that simply omits the row\r\n   needs neither. */\r\n[mono-nav]:not([mono-has-extension]) > [mono-extension] {\r\n  display: none;\r\n}\r\n\r\n/* A slotted control inherits the bar's face, not the UA's. */\r\n[mono-nav] :is(button, input, select, textarea) {\r\n  font-family: inherit;\r\n}\r\n\r\n/* =========================================\r\n   Responsive — a wide bar steps down a density on a narrow screen\r\n   ========================================= */\r\n\r\n@media (max-width: 639.98px) {\r\n  [mono-nav][mono-density=\"default\"] {\r\n    --_mono-nav-height-preset: calc(var(--mono-spacing) * 14);\r\n    --_mono-nav-pad-x-preset: calc(var(--mono-spacing) * 4);\r\n    --_mono-nav-gap-preset: calc(var(--mono-spacing) * 2.5);\r\n  }\r\n\r\n  [mono-nav]:not([mono-density]) {\r\n    --_mono-nav-height-preset: calc(var(--mono-spacing) * 12);\r\n    --_mono-nav-pad-x-preset: calc(var(--mono-spacing) * 3.5);\r\n    --_mono-nav-gap-preset: calc(var(--mono-spacing) * 2);\r\n  }\r\n}\r\n\r\n/* =========================================\r\n   Layout helper\r\n   -----------------------------------------------------------------------------\r\n   Consumers wrap their main content in this to pad around the nav (and the\r\n   sidebar). The vars are written on `:root` by mono-nav and mono-sidebar\r\n   themselves. Kept as a CLASS — it is a consumer-applied utility, not a part of\r\n   this component — with the attribute form accepted for markup that would\r\n   rather stay attributes all the way down.\r\n   ========================================= */\r\n\r\n.mono-layout-content,\r\n[mono-layout-content] {\r\n  padding-top: var(--mono-nav-height, 0);\r\n  padding-left: var(--mono-sidebar-left-width, 0);\r\n  padding-right: var(--mono-sidebar-right-width, 0);\r\n  min-height: 100vh;\r\n  min-height: 100dvh;\r\n  box-sizing: border-box;\r\n}\r\n\r\n/* =========================================\r\n   Reduced motion\r\n   ========================================= */\r\n\r\n@media (prefers-reduced-motion: reduce) {\r\n  [mono-nav] {\r\n    transition: none;\r\n  }\r\n}\r\n";
//#endregion
//#region src/components/nav/mono-nav.ts
var MonoNav = class MonoNav extends MonoNavCore(LitElement) {
	constructor(..._args) {
		super(..._args);
		this._slotsCaptured = false;
		this._slotNodes = /* @__PURE__ */ new Map();
	}
	static {
		this.styles = [unsafeCSS(nav_default)];
	}
	createRenderRoot() {
		return this;
	}
	connectedCallback() {
		super.connectedCallback();
		this._captureSlots();
		if (this.isConnected) this.performUpdate();
	}
	updated(changed) {
		super.updated(changed);
		this._placeSlots();
	}
	/**
	* Pull every direct child into one of four buckets:
	*  - `slot="start"`  → start
	*  - `slot="end"`    → end
	*  - `slot="extension"` → extension
	*  - everything else (no slot attr) → default (center)
	*
	* Captured nodes are removed from the host root and re-inserted into the
	* matching `[data-mono-slot]` target during `updated()`.
	*/
	_captureSlots() {
		if (this._slotsCaptured) return;
		this._slotsCaptured = true;
		const captured = monoHostChildNodes(this);
		const toRemove = /* @__PURE__ */ new Set();
		for (const node of captured) {
			let slotName = "default";
			if (node instanceof Element) {
				const explicit = node.getAttribute("slot");
				if (explicit === "start" || explicit === "end" || explicit === "extension") {
					slotName = explicit;
					node.removeAttribute("slot");
				}
			} else if (node.nodeType === Node.TEXT_NODE) {
				if (!(node.textContent ?? "").trim()) continue;
			} else if (node.nodeType === Node.COMMENT_NODE) continue;
			const list = this._slotNodes.get(slotName) ?? [];
			list.push(node);
			this._slotNodes.set(slotName, list);
			toRemove.add(node);
		}
		for (const node of toRemove) if (node.parentNode === this) this.removeChild(node);
		guardHostTextContent(this, this._slotNodes, { onWrite: () => this.requestUpdate() });
	}
	_placeSlots() {
		if (!this._slotNodes.size) return;
		for (const [slotName, nodes] of this._slotNodes) {
			const target = this.querySelector(`[data-mono-slot="${slotName}"]`);
			if (!target) continue;
			for (const node of nodes) placeSlotNode(target, node);
		}
	}
};
__decorate([state()], MonoNav.prototype, "_slotsCaptured", void 0);
MonoNav = __decorate([customElement("mono-nav")], MonoNav);
//#endregion
export { MonoNav, generateNavRootClasses, getNavHeight, validateNavProps };
