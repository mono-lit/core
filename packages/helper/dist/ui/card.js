import { t as customElement } from "../mono-element-B0kP_96P.js";
import { a as defineHybridPropAliases, i as defineHybridPropAlias, r as booleanStringConverter, t as __decorate } from "../decorate-DEXtNagw.js";
import { t as dispatchMonoEvent } from "../mono-event-Bi1qP9uN.js";
import { a as parkDetachedNodes, n as bucketHasContent, o as placeLightSlots, r as captureLightSlots } from "../light-slots-DW1WgfgT.js";
import { t as buildSizeStyle } from "../css-size-DhHSVZJK.js";
import { LitElement, html, nothing, unsafeCSS } from "lit";
import { property, query, state } from "lit/decorators.js";
import { ifDefined } from "lit/directives/if-defined.js";
import { styleMap } from "lit/directives/style-map.js";
//#region src/components/card/card-core.ts
/**
* `MonoCardCore` — all render-mode-agnostic logic for `mono-card`: reactive
* props, hybrid aliases, the camelCase attribute fallbacks, slot-presence
* `@state`, class/getter computation, click/keyboard interactivity, and the
* imperative `focus/blur/click`. No `render()` — the light build keeps its
* `[data-mono-slot]` capture strategy and the shadow build uses native `<slot>`
* (each ships its own `render()`, mirroring `mono-input`).
*
* SSR-safe: no `document`/`window` access. `_cardElement` (`@query`) is lazy and
* `focus/blur/click` + the `HTMLAnchorElement` check only run client-side.
*/
var MonoCardCore = (superClass) => {
	class MonoCardCoreClass extends superClass {
		constructor(...args) {
			super(...args);
			this._hasMedia = false;
			this._hasIcon = false;
			this._hasTitle = false;
			this._hasSubtitle = false;
			this._hasHeaderSlot = false;
			this._hasActions = false;
			this._hasFooter = false;
			this._hasDefault = false;
			defineHybridPropAliases(this, [
				"mediaPosition",
				"headerDivider",
				"footerDivider",
				"ariaLabelText",
				"cssClass",
				"minWidth",
				"maxWidth",
				"minHeight",
				"maxHeight"
			]);
			defineHybridPropAlias(this, "heading", "title");
			defineHybridPropAlias(this, "subheading", "subtitle");
			this.size = "md";
			this.variant = "elevated";
			this.color = "neutral";
			this.mediaPosition = "top";
			this.title = "";
			this.subtitle = "";
			this.bordered = false;
			this.hoverable = false;
			this.clickable = false;
			this.selected = false;
			this.disabled = false;
			this.loading = false;
			this.headerDivider = true;
			this.footerDivider = true;
			this.href = void 0;
			this.target = void 0;
			this.ariaLabelText = void 0;
			this.cssClass = {};
		}
		/**
		* Static camelCase HTML fallback.
		*
		* Browser converts:
		* mediaPosition -> mediaposition
		* headerDivider -> headerdivider
		* footerDivider -> footerdivider
		* ariaLabelText -> arialabeltext
		*/
		static get observedAttributes() {
			return [
				...super.observedAttributes ?? [],
				"mediaposition",
				"headerdivider",
				"footerdivider",
				"arialabeltext",
				"arialabel",
				"heading",
				"subheading"
			];
		}
		attributeChangedCallback(name, oldValue, newValue) {
			super.attributeChangedCallback(name, oldValue, newValue);
			if (oldValue === newValue) return;
			if (name === "mediaposition") {
				this.mediaPosition = newValue ?? "top";
				return;
			}
			if (name === "headerdivider") {
				this.headerDivider = this._toBoolean(newValue);
				return;
			}
			if (name === "footerdivider") {
				this.footerDivider = this._toBoolean(newValue);
				return;
			}
			if (name === "arialabeltext" || name === "arialabel") {
				this.ariaLabelText = newValue ?? void 0;
				return;
			}
			if (name === "heading") {
				this.title = newValue ?? "";
				return;
			}
			if (name === "subheading") this.subtitle = newValue ?? "";
		}
		_cls(base, key) {
			const extra = this.cssClass?.[key];
			return extra ? `${base} ${extra}` : base;
		}
		/** Inline sizing applied to the card root. */
		_sizeStyle() {
			return buildSizeStyle(this);
		}
		_toBoolean(value) {
			if (typeof value === "boolean") return value;
			if (typeof value === "string") {
				const normalized = value.toLowerCase().trim();
				return normalized === "" || normalized === "true";
			}
			return Boolean(value);
		}
		get _isInteractive() {
			return Boolean(this.href) || this.clickable;
		}
		get _isDisabled() {
			return this.disabled || this.loading;
		}
		get _hasHeader() {
			return Boolean(this._hasIcon || this._hasTitle || this._hasSubtitle || this._hasHeaderSlot || this.title || this.subtitle);
		}
		get _cardClasses() {
			const classes = ["mono-card"];
			classes.push(this.size);
			classes.push(this.variant);
			classes.push(this.color);
			if (this.rounded) classes.push(`rounded-${this.rounded}`);
			if (this.bordered) classes.push("bordered");
			if (this.hoverable) classes.push("hoverable");
			if (this.clickable || this.href) classes.push("clickable");
			if (this.selected) classes.push("selected");
			if (this.disabled) classes.push("disabled");
			if (this.loading) classes.push("loading");
			if (!this.headerDivider) classes.push("no-header-divider");
			if (!this.footerDivider) classes.push("no-footer-divider");
			if (this._hasMedia) classes.push(`media-${this.mediaPosition}`);
			if (this.cssClass?.root) classes.push(this.cssClass.root);
			return classes.join(" ");
		}
		_emitClick(originalEvent) {
			const detail = { originalEvent };
			dispatchMonoEvent(this, "click", detail, { sourceEvent: originalEvent });
		}
		_handleClick(event) {
			if (this._isDisabled) {
				event.preventDefault();
				event.stopPropagation();
				return;
			}
			if (!this._isInteractive) return;
			this._emitClick(event);
		}
		_handleKeyDown(event) {
			if (this._isDisabled || !this._isInteractive) return;
			if (event.key === "Enter" || event.key === " ") {
				event.preventDefault();
				if (this._cardElement) {
					this._cardElement.click();
					return;
				}
				this._emitClick(event);
			}
		}
		focus() {
			this._cardElement?.focus();
		}
		blur() {
			this._cardElement?.blur();
		}
		click() {
			this._cardElement?.click();
		}
	}
	__decorate([property({ type: String })], MonoCardCoreClass.prototype, "size", void 0);
	__decorate([property({ type: String })], MonoCardCoreClass.prototype, "variant", void 0);
	__decorate([property({ type: String })], MonoCardCoreClass.prototype, "color", void 0);
	__decorate([property({ type: String })], MonoCardCoreClass.prototype, "rounded", void 0);
	__decorate([property({
		type: String,
		attribute: "media-position"
	})], MonoCardCoreClass.prototype, "mediaPosition", void 0);
	__decorate([property({ type: String })], MonoCardCoreClass.prototype, "title", void 0);
	__decorate([property({ type: String })], MonoCardCoreClass.prototype, "subtitle", void 0);
	__decorate([property({
		reflect: true,
		converter: booleanStringConverter
	})], MonoCardCoreClass.prototype, "bordered", void 0);
	__decorate([property({
		reflect: true,
		converter: booleanStringConverter
	})], MonoCardCoreClass.prototype, "hoverable", void 0);
	__decorate([property({
		reflect: true,
		converter: booleanStringConverter
	})], MonoCardCoreClass.prototype, "clickable", void 0);
	__decorate([property({
		reflect: true,
		converter: booleanStringConverter
	})], MonoCardCoreClass.prototype, "selected", void 0);
	__decorate([property({
		reflect: true,
		converter: booleanStringConverter
	})], MonoCardCoreClass.prototype, "disabled", void 0);
	__decorate([property({
		reflect: true,
		converter: booleanStringConverter
	})], MonoCardCoreClass.prototype, "loading", void 0);
	__decorate([property({ type: String })], MonoCardCoreClass.prototype, "width", void 0);
	__decorate([property({ type: String })], MonoCardCoreClass.prototype, "height", void 0);
	__decorate([property({
		type: String,
		attribute: "min-width"
	})], MonoCardCoreClass.prototype, "minWidth", void 0);
	__decorate([property({
		type: String,
		attribute: "max-width"
	})], MonoCardCoreClass.prototype, "maxWidth", void 0);
	__decorate([property({
		type: String,
		attribute: "min-height"
	})], MonoCardCoreClass.prototype, "minHeight", void 0);
	__decorate([property({
		type: String,
		attribute: "max-height"
	})], MonoCardCoreClass.prototype, "maxHeight", void 0);
	__decorate([property({
		attribute: "header-divider",
		reflect: true,
		converter: booleanStringConverter
	})], MonoCardCoreClass.prototype, "headerDivider", void 0);
	__decorate([property({
		attribute: "footer-divider",
		reflect: true,
		converter: booleanStringConverter
	})], MonoCardCoreClass.prototype, "footerDivider", void 0);
	__decorate([property({ type: String })], MonoCardCoreClass.prototype, "href", void 0);
	__decorate([property({ type: String })], MonoCardCoreClass.prototype, "target", void 0);
	__decorate([property({
		type: String,
		attribute: "aria-label-text"
	})], MonoCardCoreClass.prototype, "ariaLabelText", void 0);
	__decorate([property({ attribute: false })], MonoCardCoreClass.prototype, "cssClass", void 0);
	__decorate([state()], MonoCardCoreClass.prototype, "_hasMedia", void 0);
	__decorate([state()], MonoCardCoreClass.prototype, "_hasIcon", void 0);
	__decorate([state()], MonoCardCoreClass.prototype, "_hasTitle", void 0);
	__decorate([state()], MonoCardCoreClass.prototype, "_hasSubtitle", void 0);
	__decorate([state()], MonoCardCoreClass.prototype, "_hasHeaderSlot", void 0);
	__decorate([state()], MonoCardCoreClass.prototype, "_hasActions", void 0);
	__decorate([state()], MonoCardCoreClass.prototype, "_hasFooter", void 0);
	__decorate([state()], MonoCardCoreClass.prototype, "_hasDefault", void 0);
	__decorate([query(".mono-card")], MonoCardCoreClass.prototype, "_cardElement", void 0);
	return MonoCardCoreClass;
};
//#endregion
//#region src/components/card/card.css?raw
var card_default = "/* =========================================================================\r\n   mono-card — a port of Basecoat's `.card` (basecoat-css@1.0.2, vega style).\r\n\r\n   Styled by ATTRIBUTE, like Basecoat — and the attributes mirror the element's\r\n   props one for one, so hand-written markup reads like the Lit / Vue tag:\r\n\r\n     <mono-card size=\"sm\" variant=\"outlined\" color=\"primary\" title=\"Title\">\r\n     <div mono-card mono-size=\"sm\" mono-variant=\"outlined\" mono-color=\"primary\">\r\n       <div mono-header>\r\n         <div mono-header-content><h3 mono-title>Title</h3></div>\r\n       </div>\r\n       <div mono-body><p>…</p></div>\r\n       <div mono-footer>…</div>\r\n     </div>\r\n\r\n   An absent attribute is the prop's default (`:not([mono-size])` = md,\r\n   `:not([mono-variant])` = elevated, `:not([mono-color])` = neutral). The element\r\n   renders these attributes on its root (both builds) plus the STATES\r\n   `mono-bordered` / `mono-hoverable` / `mono-clickable` / `mono-selected` /\r\n   `mono-disabled` / `mono-loading`, and the negatives `mono-no-header-divider` /\r\n   `mono-no-footer-divider` (both dividers default ON, so the attribute marks the\r\n   exception). The old classes (`.mono-card.md.elevated.primary`) are still\r\n   emitted as inert hooks until 2.0 but no rule here reads them.\r\n\r\n   Selector map (ours ≡ upstream):\r\n     [mono-card]                                   ≡ .card (flex-col gap-6 py-6 rounded-xl bg-card text-card-foreground text-sm shadow-xs ring-1 ring-foreground/10 overflow-hidden)\r\n                                                     — the ring is drawn as an INSET box-shadow, see --_mono-card-edge-*\r\n     [mono-card] > [mono-header]                   ≡ .card > header (grid auto-rows-min gap-1 px-6)\r\n     [mono-title]                                  ≡ .card > header > :is(h2, h3, [data-title], .card-title) (text-base font-medium leading-normal)\r\n     [mono-subtitle]                               ≡ .card > header > :is(p, [data-description], .card-description) (text-sm text-muted-foreground)\r\n     [mono-body]                                   ≡ .card > section (px-6)\r\n     [mono-footer] / [mono-actions]                ≡ .card > footer (flex items-center px-6)\r\n     [mono-size=\"sm\"]                              ≡ .card[data-size='sm'] (gap-4 py-4, px-4 on every region)\r\n     [mono-size=\"xs|lg|xl|xxl\"]                    ≡ EXTENSION (the same ladder continued)\r\n     [mono-variant=\"outlined\"]                     ≡ .card verbatim (the ring + shadow-xs)\r\n     [mono-variant=\"elevated|flat|tonal|glass\"]    ≡ EXTENSION (shadow-md / none / an accent tint / a blurred pane)\r\n     [mono-color=\"…\"]                              ≡ EXTENSION (the ring and the title in the role's colour)\r\n     [mono-media]                                  ≡ .card [&>img:first-child]:rounded-t-xl — a full-bleed media band\r\n     [mono-icon], [mono-loading], [mono-selected]  ≡ EXTENSION\r\n\r\n   `gradient` is GONE (variant and colour alike): the port drops every colour\r\n   gradient. `--mono-card-gradient-*` are no-ops until 2.0.\r\n\r\n   Specificity contract (same as the pre-port class sheet): a part's RESTING rule\r\n   is exactly one attribute strong — `:where([mono-card]) [mono-body]` = (0,1,0)\r\n   — so a utility class handed in through `cssClass` wins by source order, while\r\n   prop and state rules stay heavier and win over it.\r\n\r\n   Inner parts: [mono-media], [mono-header] > [mono-icon] / [mono-header-content]\r\n   > [mono-title] / [mono-subtitle], [mono-body], [mono-actions], [mono-footer],\r\n   [mono-loading] > [mono-spinner]. The shadow build renders every region and\r\n   marks the empty ones [mono-empty]; this sheet hides them.\r\n\r\n   FLAVORS set `--mono-card-{radius,shadow,ring-color,ring-width,padding-<size>,\r\n   gap-<size>,title-font-<size>,…}` (the per-style `.card` deltas); every fallback\r\n   here is vega's value (`node scripts/basecoat-styles.mjs --varying \"^\\.card\"`).\r\n   ========================================================================= */\r\n\r\nmono-card {\r\n  display: block;\r\n}\r\n\r\n[mono-card] {\r\n  /* ── palette: each slot is a public knob over a Basecoat token ─────────── */\r\n  --_mono-card-bg: var(--mono-card-bg, var(--card));\r\n  --_mono-card-text: var(--mono-card-text, var(--card-foreground));\r\n  --_mono-card-subtext: var(--mono-card-subtext, var(--muted-foreground));\r\n  --_mono-card-accent: var(--mono-card-accent, var(--_mono-card-accent-preset, var(--neutral)));\r\n  /* ring-1 ring-foreground/10 — Basecoat rings the card, it does not border it;\r\n     `bordered` adds a real border on top (EXTENSION) */\r\n  --_mono-card-ring-color: var(--mono-card-ring-color, color-mix(in oklab, var(--foreground) 10%, transparent));\r\n  --_mono-card-ring-width: var(--mono-card-ring-width, var(--mono-border-width));\r\n  --_mono-card-shadow: var(--mono-card-shadow, var(--mono-shadow-xs));\r\n  --_mono-card-shadow-elevated: var(--mono-card-shadow-elevated, var(--mono-shadow-md));\r\n  --_mono-card-shadow-hover: var(--mono-card-shadow-hover, var(--mono-shadow-lg));\r\n  /* the ONE knob a prop also drives: `rounded` writes --_mono-card-radius-preset\r\n     on the element, so a FLAVOR must write that same preset tier (an inherited\r\n     preset loses to the element's own) while --mono-card-radius stays the\r\n     consumer's override and wins over both */\r\n  --_mono-card-radius: var(--mono-card-radius, var(--_mono-card-radius-preset, var(--mono-radius-xl)));\r\n  --_mono-card-border-width: var(--mono-card-border-width, var(--mono-border-width));\r\n  --_mono-card-border-color: var(--mono-card-border-color, var(--border));\r\n  --_mono-card-divider-color: var(--mono-card-divider-color, var(--border));\r\n  --_mono-card-focus-ring-color: var(--mono-card-focus-ring-color, var(--ring));\r\n  --_mono-card-focus-ring-width: var(--mono-card-focus-ring-width, var(--mono-ring-width));\r\n  --_mono-card-focus-ring-alpha: var(--mono-card-focus-ring-alpha, var(--mono-ring-alpha));\r\n\r\n  /* ── md metrics live on the unqualified root ON PURPOSE ────────────────────\r\n     basecoat@1.0.2 styles/vega.css .card — gap-6 py-6 text-sm; .card > header —\r\n     gap-1 px-6; .card > section / > footer — px-6 */\r\n  --_mono-card-padding: var(--mono-card-padding, var(--mono-card-padding-md, calc(var(--mono-spacing) * 6)));\r\n  --_mono-card-gap: var(--mono-card-gap, var(--mono-card-gap-md, calc(var(--mono-spacing) * 6)));\r\n  --_mono-card-header-gap: var(--mono-card-header-gap, var(--mono-card-header-gap-md, calc(var(--mono-spacing) * 1)));\r\n  --_mono-card-actions-gap: var(--mono-card-actions-gap, var(--mono-card-actions-gap-md, calc(var(--mono-spacing) * 2)));\r\n  --_mono-card-font: var(--mono-card-font, var(--mono-card-font-md, var(--mono-text-sm)));\r\n  --_mono-card-title-font: var(--mono-card-title-font, var(--mono-card-title-font-md, var(--mono-text-base)));\r\n  --_mono-card-subtitle-font: var(--mono-card-subtitle-font, var(--mono-card-subtitle-font-md, var(--mono-text-sm)));\r\n  --_mono-card-icon-size: var(--mono-card-icon-size, var(--mono-card-icon-size-md, calc(var(--mono-spacing) * 9)));\r\n  --_mono-card-icon-glyph: var(--mono-card-icon-glyph, 55%);\r\n\r\n  /* The edge and the elevation are independent, so a variant can drop one\r\n     without touching the other.\r\n\r\n     DEVIATION from upstream: Basecoat draws the edge with `ring-1`, a box-shadow\r\n     OUTSIDE the border box. That pixel is lost wherever the card is flush against\r\n     anything that clips — a container with `overflow: hidden` (every demo stage),\r\n     a horizontal scroller, or the viewport itself — which hid the left edge of a\r\n     full-width card at most widths. The same hairline drawn INSIDE the box is\r\n     unclippable: an INSET box-shadow, layered under the elevation. (It used to\r\n     be an outline with a negative offset; an outline is rasterised as a stroke\r\n     of its own, and on fractional display scales it landed one device pixel\r\n     inside the background's edge, so the card read as a DOUBLE border. An inset\r\n     shadow is part of the background's own box and cannot separate from it.)\r\n     It paints under the descendants, so a full-bleed child must stop one\r\n     edge-width short of the box, or cover it knowingly. */\r\n  --_mono-card-edge-width: var(--_mono-card-ring-width);\r\n  --_mono-card-edge-color: var(--_mono-card-ring-color);\r\n  --_mono-card-elevation: var(--_mono-card-shadow);\r\n\r\n  display: flex;\r\n  flex-direction: column;\r\n  gap: var(--_mono-card-gap);\r\n  position: relative;\r\n  min-width: 0;\r\n  padding-block: var(--_mono-card-padding);\r\n  overflow: hidden;\r\n  border-radius: var(--_mono-card-radius);\r\n  background-color: var(--_mono-card-bg);\r\n  color: var(--_mono-card-text);\r\n  font-family: inherit;\r\n  font-size: var(--_mono-card-font);\r\n  box-shadow:\r\n    inset 0 0 0 var(--_mono-card-edge-width) var(--_mono-card-edge-color),\r\n    var(--_mono-card-elevation);\r\n  text-decoration: none;\r\n  transition-property: background-color, border-color, box-shadow, transform, opacity;\r\n  transition-timing-function: var(--mono-ease);\r\n  transition-duration: var(--mono-duration);\r\n}\r\n\r\n[mono-card],\r\n:where([mono-card]) *,\r\n:where([mono-card]) *::before,\r\n:where([mono-card]) *::after {\r\n  box-sizing: border-box;\r\n}\r\n\r\n/* The shadow build renders EVERY region up front (so DSD can project into them\r\n   server-side) and marks the ones with nothing in them; the light build renders\r\n   only what exists. Hiding them here is what keeps the two builds identical —\r\n   and why the media rules below test `:not([mono-empty])`.\r\n\r\n   NOT wrapped in `:where()`, unlike the other parts: a region rule such as\r\n   `[mono-header] > [mono-icon]` is two attributes strong, so a zero-weight hide\r\n   would tie and lose on source order — the icon box kept its 36px in the shadow\r\n   build while the light one rendered nothing at all. */\r\n[mono-card] :is(\r\n  [mono-media],\r\n  [mono-header],\r\n  [mono-icon],\r\n  [mono-title],\r\n  [mono-subtitle],\r\n  [mono-body],\r\n  [mono-actions],\r\n  [mono-footer]\r\n)[mono-empty] {\r\n  display: none;\r\n}\r\n\r\n/* =========================================\r\n   Sizes — `sm` is upstream's data-size='sm'; the rest continue the ladder\r\n   ========================================= */\r\n\r\n[mono-card][mono-size=\"xs\"] {\r\n  --_mono-card-padding: var(--mono-card-padding, var(--mono-card-padding-xs, calc(var(--mono-spacing) * 2.5)));\r\n  --_mono-card-gap: var(--mono-card-gap, var(--mono-card-gap-xs, calc(var(--mono-spacing) * 2.5)));\r\n  --_mono-card-font: var(--mono-card-font, var(--mono-card-font-xs, var(--mono-text-xs)));\r\n  --_mono-card-title-font: var(--mono-card-title-font, var(--mono-card-title-font-xs, 0.8125rem));\r\n  --_mono-card-subtitle-font: var(--mono-card-subtitle-font, var(--mono-card-subtitle-font-xs, var(--mono-text-xs)));\r\n  --_mono-card-icon-size: var(--mono-card-icon-size, var(--mono-card-icon-size-xs, calc(var(--mono-spacing) * 6)));\r\n}\r\n\r\n/* basecoat@1.0.2 styles/vega.css .card[data-size='sm'] — gap-4 py-4 (px-4 on every region) */\r\n[mono-card][mono-size=\"sm\"] {\r\n  --_mono-card-padding: var(--mono-card-padding, var(--mono-card-padding-sm, calc(var(--mono-spacing) * 4)));\r\n  --_mono-card-gap: var(--mono-card-gap, var(--mono-card-gap-sm, calc(var(--mono-spacing) * 4)));\r\n  --_mono-card-font: var(--mono-card-font, var(--mono-card-font-sm, var(--mono-text-sm)));\r\n  --_mono-card-title-font: var(--mono-card-title-font, var(--mono-card-title-font-sm, var(--mono-text-sm)));\r\n  --_mono-card-subtitle-font: var(--mono-card-subtitle-font, var(--mono-card-subtitle-font-sm, var(--mono-text-sm)));\r\n  --_mono-card-icon-size: var(--mono-card-icon-size, var(--mono-card-icon-size-sm, calc(var(--mono-spacing) * 7.5)));\r\n}\r\n\r\n[mono-card][mono-size=\"lg\"] {\r\n  --_mono-card-padding: var(--mono-card-padding, var(--mono-card-padding-lg, calc(var(--mono-spacing) * 7)));\r\n  --_mono-card-gap: var(--mono-card-gap, var(--mono-card-gap-lg, calc(var(--mono-spacing) * 7)));\r\n  /* lg keeps md's body and subtitle type by DEFAULT, but still reads its own\r\n     knobs — every step of the ladder has to be settable, or a flavor's value is\r\n     silently inert (the theme lint catches that). */\r\n  --_mono-card-font: var(--mono-card-font, var(--mono-card-font-lg, var(--mono-text-sm)));\r\n  --_mono-card-subtitle-font: var(--mono-card-subtitle-font, var(--mono-card-subtitle-font-lg, var(--mono-text-sm)));\r\n  --_mono-card-title-font: var(--mono-card-title-font, var(--mono-card-title-font-lg, var(--mono-text-lg)));\r\n  --_mono-card-icon-size: var(--mono-card-icon-size, var(--mono-card-icon-size-lg, calc(var(--mono-spacing) * 10)));\r\n}\r\n\r\n[mono-card][mono-size=\"xl\"] {\r\n  --_mono-card-padding: var(--mono-card-padding, var(--mono-card-padding-xl, calc(var(--mono-spacing) * 8)));\r\n  --_mono-card-gap: var(--mono-card-gap, var(--mono-card-gap-xl, calc(var(--mono-spacing) * 8)));\r\n  --_mono-card-font: var(--mono-card-font, var(--mono-card-font-xl, var(--mono-text-base)));\r\n  --_mono-card-title-font: var(--mono-card-title-font, var(--mono-card-title-font-xl, var(--mono-text-xl)));\r\n  --_mono-card-subtitle-font: var(--mono-card-subtitle-font, var(--mono-card-subtitle-font-xl, var(--mono-text-base)));\r\n  --_mono-card-icon-size: var(--mono-card-icon-size, var(--mono-card-icon-size-xl, calc(var(--mono-spacing) * 11)));\r\n}\r\n\r\n[mono-card][mono-size=\"xxl\"] {\r\n  --_mono-card-padding: var(--mono-card-padding, var(--mono-card-padding-xxl, calc(var(--mono-spacing) * 9)));\r\n  --_mono-card-gap: var(--mono-card-gap, var(--mono-card-gap-xxl, calc(var(--mono-spacing) * 9)));\r\n  --_mono-card-font: var(--mono-card-font, var(--mono-card-font-xxl, var(--mono-text-base)));\r\n  --_mono-card-title-font: var(--mono-card-title-font, var(--mono-card-title-font-xxl, calc(var(--mono-text-xl) * 1.125)));\r\n  --_mono-card-subtitle-font: var(--mono-card-subtitle-font, var(--mono-card-subtitle-font-xxl, var(--mono-text-lg)));\r\n  --_mono-card-icon-size: var(--mono-card-icon-size, var(--mono-card-icon-size-xxl, calc(var(--mono-spacing) * 12)));\r\n}\r\n\r\n/* =========================================\r\n   Corners — the library-wide radius scale\r\n   ========================================= */\r\n\r\n[mono-card][mono-rounded=\"none\"] {\r\n  --_mono-card-radius-preset: 0;\r\n}\r\n[mono-card][mono-rounded=\"xs\"] {\r\n  --_mono-card-radius-preset: var(--mono-radius-sm);\r\n}\r\n[mono-card][mono-rounded=\"sm\"] {\r\n  --_mono-card-radius-preset: var(--mono-radius-sm);\r\n}\r\n[mono-card][mono-rounded=\"md\"] {\r\n  --_mono-card-radius-preset: var(--mono-radius-md);\r\n}\r\n[mono-card][mono-rounded=\"lg\"] {\r\n  --_mono-card-radius-preset: var(--mono-radius-lg);\r\n}\r\n[mono-card][mono-rounded=\"xl\"] {\r\n  --_mono-card-radius-preset: var(--mono-radius-xl);\r\n}\r\n[mono-card][mono-rounded=\"xxl\"] {\r\n  --_mono-card-radius-preset: var(--mono-radius-2xl);\r\n}\r\n[mono-card][mono-rounded=\"full\"] {\r\n  --_mono-card-radius-preset: var(--mono-radius-full);\r\n}\r\n\r\n/* =========================================\r\n   Colours — EXTENSION: the ring and the title take the role's colour\r\n   ========================================= */\r\n\r\n[mono-card][mono-color=\"primary\"] {\r\n  --_mono-card-accent-preset: var(--primary);\r\n}\r\n[mono-card][mono-color=\"secondary\"] {\r\n  --_mono-card-accent-preset: var(--secondary-foreground);\r\n}\r\n[mono-card][mono-color=\"success\"] {\r\n  --_mono-card-accent-preset: var(--success);\r\n}\r\n[mono-card][mono-color=\"danger\"] {\r\n  --_mono-card-accent-preset: var(--destructive);\r\n}\r\n[mono-card][mono-color=\"warning\"] {\r\n  --_mono-card-accent-preset: var(--warning);\r\n}\r\n[mono-card][mono-color=\"info\"] {\r\n  --_mono-card-accent-preset: var(--info);\r\n}\r\n[mono-card][mono-color=\"teal\"] {\r\n  --_mono-card-accent-preset: var(--teal);\r\n}\r\n[mono-card][mono-color=\"purple\"] {\r\n  --_mono-card-accent-preset: var(--purple);\r\n}\r\n[mono-card][mono-color=\"dark\"] {\r\n  --_mono-card-accent-preset: var(--dark);\r\n}\r\n[mono-card][mono-color=\"neutral\"] {\r\n  --_mono-card-accent-preset: var(--neutral);\r\n}\r\n[mono-card][mono-color=\"light\"] {\r\n  --_mono-card-accent-preset: var(--muted-foreground);\r\n}\r\n\r\n/* =========================================\r\n   Variants\r\n   ========================================= */\r\n\r\n/* `outlined` IS upstream's `.card`: the ring and shadow-xs already on the root */\r\n[mono-card][mono-variant=\"outlined\"] {\r\n  --_mono-card-ring-color: var(--mono-card-ring-color, color-mix(in oklab, var(--_mono-card-accent) 34%, transparent));\r\n}\r\n\r\n/* EXTENSION — a lifted card; the ring stays, the elevation grows */\r\n[mono-card]:is(:not([mono-variant]), [mono-variant=\"elevated\"]) {\r\n  --_mono-card-elevation: var(--_mono-card-shadow-elevated);\r\n}\r\n\r\n/* EXTENSION — no elevation at all */\r\n[mono-card][mono-variant=\"flat\"] {\r\n  --_mono-card-elevation: 0 0 #0000;\r\n}\r\n\r\n/* EXTENSION — an accent wash (flat tint, never a gradient) */\r\n[mono-card][mono-variant=\"tonal\"] {\r\n  --_mono-card-elevation: 0 0 #0000;\r\n  --_mono-card-ring-color: var(--mono-card-ring-color, color-mix(in oklab, var(--_mono-card-accent) 22%, transparent));\r\n  background-color: color-mix(in oklab, var(--_mono-card-accent) var(--mono-mode-tint), var(--_mono-card-bg));\r\n}\r\n\r\n/* EXTENSION — a blurred pane over whatever is behind it */\r\n[mono-card][mono-variant=\"glass\"] {\r\n  --_mono-card-elevation: var(--mono-shadow-lg);\r\n  --_mono-card-ring-color: var(--mono-card-glass-border, color-mix(in oklab, var(--foreground) 12%, transparent));\r\n  background-color: var(--mono-card-glass-bg, color-mix(in oklab, var(--card) 45%, transparent));\r\n  backdrop-filter: blur(var(--mono-card-glass-blur, 12px));\r\n}\r\n\r\n/* =========================================\r\n   States\r\n   ========================================= */\r\n\r\n/* EXTENSION — a real border on top of the ring */\r\n[mono-card][mono-bordered] {\r\n  border: var(--_mono-card-border-width) solid var(--_mono-card-border-color);\r\n}\r\n\r\n[mono-card][mono-clickable] {\r\n  cursor: pointer;\r\n}\r\n\r\n@media (hover: hover) {\r\n  [mono-card]:is([mono-hoverable], [mono-clickable]):not([mono-disabled]):hover {\r\n    --_mono-card-elevation: var(--_mono-card-shadow-hover);\r\n  }\r\n}\r\n\r\n/* EXTENSION — the chosen card, in the accent (Basecoat's own `has-[:checked]`\r\n   treatment for a selectable label: primary/5 with a primary/30 edge) */\r\n[mono-card][mono-selected] {\r\n  --_mono-card-edge-color: color-mix(in oklab, var(--_mono-card-accent) var(--mono-mode-checked-border), transparent);\r\n  --_mono-card-edge-width: calc(var(--mono-border-width) * 2);\r\n  background-color: color-mix(in oklab, var(--_mono-card-accent) var(--mono-mode-checked-bg), var(--_mono-card-bg));\r\n}\r\n\r\n[mono-card][mono-disabled] {\r\n  cursor: not-allowed;\r\n  opacity: 0.5;\r\n  pointer-events: none;\r\n}\r\n\r\n/* the focus ring is that same inside edge, recoloured and thickened — an\r\n   outside ring would be clipped exactly where the resting one was */\r\n[mono-card]:focus-visible {\r\n  --_mono-card-edge-width: var(--_mono-card-focus-ring-width);\r\n  --_mono-card-edge-color: color-mix(in oklab, var(--_mono-card-focus-ring-color) var(--_mono-card-focus-ring-alpha), transparent);\r\n}\r\n\r\n/* =========================================\r\n   Regions — every one of them is inset by the card's padding, which is how\r\n   upstream does it (`px-6` per region, `py-6` on the card) so a media band can\r\n   run full-bleed between them\r\n   ========================================= */\r\n\r\n/* basecoat@1.0.2 components/card.css .card >> > header\r\n   — grid auto-rows-min items-start (grid-cols-[1fr_auto] when an action is present) */\r\n/* basecoat@1.0.2 styles/vega.css .card > header — gap-1 px-6 */\r\n:where([mono-card]) > [mono-header] {\r\n  display: flex;\r\n  align-items: flex-start;\r\n  gap: var(--_mono-card-actions-gap);\r\n  padding-inline: var(--_mono-card-padding);\r\n}\r\n\r\n:where([mono-card]) > [mono-header] > [mono-header-content] {\r\n  display: grid;\r\n  align-content: start;\r\n  gap: var(--_mono-card-header-gap);\r\n  min-width: 0;\r\n  flex: 1 1 auto;\r\n}\r\n\r\n/* basecoat@1.0.2 styles/vega.css .card > header > :is(h2, h3, [data-title], .card-title)\r\n   — text-base leading-normal font-medium (upstream also sets `leading-none` in\r\n   components/card.css; vega's `leading-normal` wins) */\r\n:where([mono-card]) [mono-title] {\r\n  margin: 0;\r\n  font-size: var(--_mono-card-title-font);\r\n  line-height: var(--mono-card-title-line-height, var(--mono-leading-normal));\r\n  font-weight: var(--mono-card-title-font-weight, var(--mono-font-weight-medium));\r\n  letter-spacing: var(--mono-card-title-tracking, normal);\r\n  text-transform: var(--mono-card-title-transform, none);\r\n  color: var(--mono-card-title-color, var(--_mono-card-text));\r\n}\r\n\r\n/* the colour prop tints the title, nothing else — `color` is an accent, not a fill */\r\n[mono-card][mono-color]:not([mono-color=\"neutral\"]) [mono-title] {\r\n  color: var(--mono-card-title-color, var(--_mono-card-accent));\r\n}\r\n\r\n/* A heading handed in as <h2>/<h3>/<p> brings its own margins and type, and a\r\n   host page styles those tags too (`.vp-doc h3` is a class selector, so it beats\r\n   any sane rule here). The card OWNS the header type — Basecoat's own\r\n   `.card > header > :is(h2, h3, …)` does the same — so both twins are important:\r\n   the light one to beat the page, the slotted one because an inner-tree rule\r\n   cannot otherwise reach outer-tree content at all. */\r\n:where([mono-card]) :is([mono-title], [mono-subtitle]) > * {\r\n  margin: 0 !important;\r\n  font: inherit !important;\r\n  letter-spacing: inherit !important;\r\n  color: inherit !important;\r\n}\r\n\r\n:where([mono-card]) :is([mono-title], [mono-subtitle]) slot::slotted(*) {\r\n  margin: 0 !important;\r\n  font: inherit !important;\r\n  letter-spacing: inherit !important;\r\n  color: inherit !important;\r\n}\r\n\r\n[mono-card] :is(h1, h2, h3, h4, h5, h6, p, small)[mono-title] {\r\n  margin: 0;\r\n  font-size: var(--_mono-card-title-font);\r\n  line-height: var(--mono-card-title-line-height, var(--mono-leading-normal));\r\n  font-weight: var(--mono-card-title-font-weight, var(--mono-font-weight-medium));\r\n  letter-spacing: var(--mono-card-title-tracking, normal);\r\n}\r\n\r\n[mono-card] :is(h1, h2, h3, h4, h5, h6, p, small)[mono-subtitle] {\r\n  margin: 0;\r\n  font-size: var(--_mono-card-subtitle-font);\r\n  line-height: var(--mono-card-subtitle-line-height, var(--mono-leading-normal));\r\n  font-weight: var(--mono-font-weight-normal);\r\n}\r\n\r\n/* basecoat@1.0.2 styles/vega.css .card > header > :is(p, [data-description], .card-description)\r\n   — text-muted-foreground text-sm */\r\n:where([mono-card]) [mono-subtitle] {\r\n  margin: 0;\r\n  font-size: var(--_mono-card-subtitle-font);\r\n  line-height: var(--mono-card-subtitle-line-height, var(--mono-leading-normal));\r\n  font-weight: var(--mono-font-weight-normal);\r\n  color: var(--_mono-card-subtext);\r\n}\r\n\r\n/* EXTENSION — the header's leading glyph box */\r\n:where([mono-card]) > [mono-header] > [mono-icon] {\r\n  flex: 0 0 auto;\r\n  display: inline-flex;\r\n  align-items: center;\r\n  justify-content: center;\r\n  width: var(--_mono-card-icon-size);\r\n  height: var(--_mono-card-icon-size);\r\n  border-radius: var(--mono-card-icon-radius, var(--mono-radius-md));\r\n  line-height: 1;\r\n  background-color: color-mix(in oklab, var(--_mono-card-accent) var(--mono-mode-tint), transparent);\r\n  color: var(--_mono-card-accent);\r\n  overflow: hidden;\r\n}\r\n\r\n/* `:not(slot)`: in the shadow build the region's only child IS a <slot>, a real\r\n   element that this rule would size — and then `::slotted()` would size the\r\n   glyph again, to 55% of that 55%. The glyph came out half the size of its light\r\n   twin. */\r\n:where([mono-card]) > [mono-header] > [mono-icon] > *:not(slot) {\r\n  display: block;\r\n  width: var(--_mono-card-icon-glyph);\r\n  height: var(--_mono-card-icon-glyph);\r\n}\r\n\r\n:where([mono-card]) > [mono-header] > [mono-icon] slot::slotted(*) {\r\n  display: block !important;\r\n  width: var(--_mono-card-icon-glyph) !important;\r\n  height: var(--_mono-card-icon-glyph) !important;\r\n}\r\n\r\n/* basecoat@1.0.2 styles/vega.css .card > section — px-6 */\r\n:where([mono-card]) > [mono-body] {\r\n  padding-inline: var(--_mono-card-padding);\r\n  min-width: 0;\r\n}\r\n\r\n[mono-card] > :is(p, ul, ol, dl, blockquote)[mono-body] {\r\n  margin-block: 0;\r\n}\r\n\r\n:where([mono-card]) > [mono-body]:empty {\r\n  display: none;\r\n}\r\n\r\n/* The body's own children keep their block margins out of the card's rhythm —\r\n   the card's `gap` is what spaces the regions, and content that wants paragraph\r\n   spacing brings its own.\r\n\r\n   ALL children, not just the first and last: in the shadow build `::slotted()`\r\n   sees the HOST's child order, so `:first-child` there means \"first child of the\r\n   card element\" — a body paragraph that follows a `slot=\"title\"` heading is not\r\n   first, and kept the page's margins while its light twin did not.\r\n\r\n   `!important` on the slotted twins is not a style choice: a `::slotted()` rule\r\n   is an INNER-tree declaration, and a normal declaration from the outer tree (a\r\n   page's `p { margin: … }`) beats it at any specificity. Marking it important\r\n   inverts that order. The light twins need no such thing — they are ordinary\r\n   descendant rules in the same tree as the page. */\r\n:where([mono-card]) > [mono-body] > * {\r\n  margin-block: 0 !important;\r\n}\r\n\r\n:where([mono-card]) > [mono-body] slot::slotted(*) {\r\n  margin-block: 0 !important;\r\n}\r\n\r\n/* basecoat@1.0.2 components/card.css .card >> > footer — flex items-center */\r\n/* basecoat@1.0.2 styles/vega.css .card > footer — rounded-b-xl px-6 [.border-t]:pt-6 */\r\n:where([mono-card]) > :is([mono-actions], [mono-footer]) {\r\n  display: flex;\r\n  align-items: center;\r\n  flex-wrap: wrap;\r\n  gap: var(--_mono-card-actions-gap);\r\n  padding-inline: var(--_mono-card-padding);\r\n}\r\n\r\n:where([mono-card]) > [mono-actions] {\r\n  justify-content: flex-end;\r\n}\r\n\r\n/* the dividers: upstream's `[.border-b]:pb-6` idiom — a divided region pays the\r\n   padding back on the divided edge. Both are ON by default, so the ATTRIBUTE\r\n   marks the exception. */\r\n[mono-card]:not([mono-no-header-divider]) > [mono-header]:not([mono-empty]) {\r\n  padding-bottom: var(--_mono-card-padding);\r\n  border-bottom: var(--mono-border-width) solid var(--_mono-card-divider-color);\r\n}\r\n\r\n[mono-card]:not([mono-no-footer-divider]) > :is([mono-actions], [mono-footer]):not([mono-empty]) {\r\n  padding-top: var(--_mono-card-padding);\r\n  border-top: var(--mono-border-width) solid var(--_mono-card-divider-color);\r\n}\r\n\r\n/* =========================================\r\n   Media — a full-bleed band; upstream gives the first/last child image the\r\n   card's own corners and drops the padding on that edge\r\n   ========================================= */\r\n\r\n/* basecoat@1.0.2 styles/vega.css .card\r\n   — has-[>img:first-child]:pt-0 [&>img:first-child]:rounded-t-xl [&>img:last-child]:rounded-b-xl */\r\n:where([mono-card]) > [mono-media] {\r\n  display: block;\r\n  overflow: hidden;\r\n  line-height: 0;\r\n}\r\n\r\n:where([mono-card]) > [mono-media] :is(img, picture, video, canvas, svg) {\r\n  display: block;\r\n  width: 100%;\r\n  max-width: 100%;\r\n  height: auto;\r\n  object-fit: cover;\r\n}\r\n\r\n:where([mono-card]) > [mono-media] slot::slotted(:is(img, picture, video, canvas, svg)) {\r\n  display: block !important;\r\n  width: 100% !important;\r\n  max-width: 100% !important;\r\n  height: auto !important;\r\n  object-fit: cover !important;\r\n}\r\n\r\n[mono-card]:has(> [mono-media]:not([mono-empty]):first-child) {\r\n  padding-top: 0;\r\n}\r\n\r\n[mono-card]:has(> [mono-media]:not([mono-empty]):last-child) {\r\n  padding-bottom: 0;\r\n}\r\n\r\n/* =========================================\r\n   Loading — EXTENSION: a blurred veil with a spinner\r\n   ========================================= */\r\n\r\n:where([mono-card]) > [mono-loading] {\r\n  position: absolute;\r\n  inset: 0;\r\n  z-index: 2;\r\n  display: flex;\r\n  align-items: center;\r\n  justify-content: center;\r\n  background-color: var(--mono-card-loading-bg, color-mix(in oklab, var(--card) 58%, transparent));\r\n  backdrop-filter: blur(var(--mono-card-loading-blur, 2px));\r\n}\r\n\r\n:where([mono-card]) [mono-spinner] {\r\n  display: block;\r\n  width: var(--mono-card-spinner-size, calc(var(--mono-spacing) * 5.5));\r\n  height: var(--mono-card-spinner-size, calc(var(--mono-spacing) * 5.5));\r\n  border: var(--mono-card-spinner-width, 2px) solid color-mix(in oklab, var(--_mono-card-accent) 25%, transparent);\r\n  border-top-color: var(--_mono-card-accent);\r\n  border-radius: var(--mono-radius-full);\r\n  animation: mono-card-spin var(--mono-card-spinner-speed, 0.65s) linear infinite;\r\n}\r\n\r\n@keyframes mono-card-spin {\r\n  to {\r\n    transform: rotate(360deg);\r\n  }\r\n}\r\n\r\n@media (prefers-reduced-motion: reduce) {\r\n  [mono-card] {\r\n    transition: none;\r\n  }\r\n\r\n  :where([mono-card]) [mono-spinner] {\r\n    animation-duration: 2.4s;\r\n  }\r\n}\r\n";
//#endregion
//#region src/components/card/mono-card.ts
/** Named regions the card lays out. The unnamed body is the fallback bucket. */
var CARD_NAMED_SLOTS = [
	"media",
	"icon",
	"title",
	"subtitle",
	"header",
	"actions",
	"footer"
];
var MonoCard = class MonoCard extends MonoCardCore(LitElement) {
	constructor(..._args) {
		super(..._args);
		this._slotsCaptured = false;
		this._buckets = /* @__PURE__ */ new Map();
	}
	static {
		this.styles = [unsafeCSS(card_default)];
	}
	createRenderRoot() {
		return this;
	}
	_renderMedia() {
		if (!this._hasMedia) return nothing;
		return html`
      <div class=${this._cls("mono-card-media", "media")} mono-media data-mono-slot="media"></div>
    `;
	}
	_renderHeader() {
		if (!this._hasHeader) return nothing;
		return html`
      <div class=${this._cls("mono-card-header", "header")} mono-header>
        ${this._hasIcon && !this._hasHeaderSlot ? html`
              <div class=${this._cls("card-icon", "icon")} mono-icon data-mono-slot="icon"></div>
            ` : nothing}

        ${this._hasHeaderSlot ? html`
              <div
                class=${this._cls("mono-card-header-content", "headerContent")}
                mono-header-content
                data-mono-slot="header"
              ></div>
            ` : html`
              <div class=${this._cls("mono-card-header-content", "headerContent")} mono-header-content>
                ${this._hasTitle ? html`
                      <div class=${this._cls("card-title", "title")} mono-title data-mono-slot="title"></div>
                    ` : this.title ? html`
                        <div class=${this._cls("card-title", "title")} mono-title>
                          ${this.title}
                        </div>
                      ` : nothing}

                ${this._hasSubtitle ? html`
                      <div class=${this._cls("card-subtitle", "subtitle")} mono-subtitle data-mono-slot="subtitle"></div>
                    ` : this.subtitle ? html`
                        <div class=${this._cls("card-subtitle", "subtitle")} mono-subtitle>
                          ${this.subtitle}
                        </div>
                      ` : nothing}
              </div>
            `}
      </div>
    `;
	}
	/**
	* The body is the only region rendered unconditionally.
	*
	* It's the home for the fallback bucket, which holds the consumer framework's
	* positional anchors. Those need a live parent even when the card starts with
	* no visible body content — that's what lets a `v-if` flipping on later insert
	* *inside* the card instead of beside it, and it stops Lit from ever destroying
	* a container that holds the consumer's nodes. `.mono-card-body:empty` collapses
	* it while it holds nothing but anchors.
	*/
	_renderBody() {
		return html`
      <div class=${this._cls("mono-card-body", "body")} mono-body data-mono-slot="default"></div>
    `;
	}
	_renderActions() {
		if (!this._hasActions) return nothing;
		return html`
      <div class=${this._cls("mono-card-actions", "actions")} mono-actions data-mono-slot="actions"></div>
    `;
	}
	_renderFooter() {
		if (!this._hasFooter) return nothing;
		return html`
      <div class=${this._cls("mono-card-footer", "footer")} mono-footer data-mono-slot="footer"></div>
    `;
	}
	_renderLoading() {
		if (!this.loading) return nothing;
		return html`
      <div class=${this._cls("mono-card-loading", "loading")} mono-loading>
        <span class="mono-card-spinner" mono-spinner></span>
      </div>
    `;
	}
	_renderContent() {
		const mediaTop = this.mediaPosition === "top";
		const mediaBottom = this.mediaPosition === "bottom";
		return html`
      ${mediaTop ? this._renderMedia() : nothing}
      ${this._renderHeader()}
      ${this._renderBody()}
      ${this._renderActions()}
      ${this._renderFooter()}
      ${mediaBottom ? this._renderMedia() : nothing}
      ${this._renderLoading()}
    `;
	}
	render() {
		const role = this._isInteractive ? "button" : "article";
		const tabIndex = this._isInteractive && !this._isDisabled ? "0" : void 0;
		if (this.href) return html`
        <a
          class=${this._cardClasses}
          mono-card
          mono-size=${this.size === "md" ? nothing : this.size}
          mono-variant=${this.variant === "elevated" ? nothing : this.variant}
          mono-color=${this.color === "neutral" ? nothing : this.color}
          mono-rounded=${this.rounded ? this.rounded : nothing}
          ?mono-bordered=${this.bordered}
          ?mono-hoverable=${this.hoverable}
          ?mono-clickable=${this.clickable || !!this.href}
          ?mono-selected=${this.selected}
          ?mono-disabled=${this._isDisabled}
          ?mono-loading=${this.loading}
          ?mono-no-header-divider=${!this.headerDivider}
          ?mono-no-footer-divider=${!this.footerDivider}
          style=${styleMap(this._sizeStyle())}
          href=${this._isDisabled ? void 0 : ifDefined(this.href)}
          target=${ifDefined(this.target)}
          role=${role}
          tabindex=${ifDefined(tabIndex)}
          aria-label=${ifDefined(this.ariaLabelText)}
          aria-disabled=${this._isDisabled ? "true" : "false"}
          aria-busy=${this.loading ? "true" : "false"}
          title=""
          @click=${this._handleClick}
          @keydown=${this._handleKeyDown}
        >
          ${this._renderContent()}
        </a>
      `;
		return html`
      <div
        class=${this._cardClasses}
        mono-card
        mono-size=${this.size === "md" ? nothing : this.size}
        mono-variant=${this.variant === "elevated" ? nothing : this.variant}
        mono-color=${this.color === "neutral" ? nothing : this.color}
        mono-rounded=${this.rounded ? this.rounded : nothing}
        ?mono-bordered=${this.bordered}
        ?mono-hoverable=${this.hoverable}
        ?mono-clickable=${this.clickable || !!this.href}
        ?mono-selected=${this.selected}
        ?mono-disabled=${this._isDisabled}
        ?mono-loading=${this.loading}
        ?mono-no-header-divider=${!this.headerDivider}
        ?mono-no-footer-divider=${!this.footerDivider}
        style=${styleMap(this._sizeStyle())}
        role=${role}
        tabindex=${ifDefined(tabIndex)}
        aria-label=${ifDefined(this.ariaLabelText)}
        aria-disabled=${this._isDisabled ? "true" : "false"}
        aria-busy=${this.loading ? "true" : "false"}
          title=""
        @click=${this._handleClick}
        @keydown=${this._handleKeyDown}
      >
        ${this._renderContent()}
      </div>
    `;
	}
	connectedCallback() {
		super.connectedCallback();
		this._captureSlots();
		if (this.isConnected) this.performUpdate();
	}
	_captureSlots() {
		if (this._slotsCaptured) return;
		this._slotsCaptured = true;
		this._buckets = captureLightSlots(this, { names: CARD_NAMED_SLOTS });
		this._hasMedia = bucketHasContent(this._buckets.get("media"));
		this._hasIcon = bucketHasContent(this._buckets.get("icon"));
		this._hasTitle = bucketHasContent(this._buckets.get("title"));
		this._hasSubtitle = bucketHasContent(this._buckets.get("subtitle"));
		this._hasHeaderSlot = bucketHasContent(this._buckets.get("header"));
		this._hasActions = bucketHasContent(this._buckets.get("actions"));
		this._hasFooter = bucketHasContent(this._buckets.get("footer"));
		this._hasDefault = bucketHasContent(this._buckets.get("default"));
	}
	updated(changed) {
		super.updated(changed);
		placeLightSlots(this, this._buckets);
		for (const nodes of this._buckets.values()) this._parked = parkDetachedNodes(this._parked, nodes);
	}
};
MonoCard = __decorate([customElement("mono-card")], MonoCard);
//#endregion
//#region src/components/card/card-utils.ts
/**
* Validate card props
*/
function validateCardProps(props) {
	const validVariants = [
		"outlined",
		"elevated",
		"flat",
		"tonal"
	];
	const validColors = [
		"primary",
		"secondary",
		"success",
		"danger",
		"warning",
		"info",
		"neutral"
	];
	if (props.variant && !validVariants.includes(props.variant)) return false;
	if (props.color && !validColors.includes(props.color)) return false;
	return true;
}
/**
* Generate ARIA attributes for accessibility
*/
function generateCardAttributes(clickable, hoverable, label) {
	return {
		"role": clickable ? "button" : "article",
		"tabindex": clickable ? "0" : void 0,
		"aria-label": label || void 0
	};
}
//#endregion
export { MonoCard, generateCardAttributes, validateCardProps };
