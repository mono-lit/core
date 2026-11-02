import { d as buildSizeStyle } from "../mono-ui-jtBvJ9d5.js";
import { t as customElement } from "../mono-element-9uQRbp5X.js";
import { a as defineHybridPropAliases, i as defineHybridPropAlias, r as booleanStringConverter, t as __decorate } from "../decorate-DbYFpi8R.js";
import { t as dispatchMonoEvent } from "../mono-event-BPku9HpS.js";
import { a as parkDetachedNodes, n as bucketHasContent, o as placeLightSlots, r as captureLightSlots } from "../light-slots-B980aknU.js";
import { LitElement, html, nothing } from "lit";
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
const MonoCardCore = (superClass) => {
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
		/**
		* The header shows a title with NO subtitle under it — drives `mono-no-subtitle`,
		* which centres the icon chip and that lone title on one axis. With a subtitle
		* the row stays top-aligned (icon level with the first line); a `slot="header"`
		* owns its own layout, so it never counts.
		*/
		get _noSubtitle() {
			return !this._hasHeaderSlot && !this._hasSubtitle && !this.subtitle;
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
//#region src/components/card/mono-card.ts
/** Named regions the card lays out. The unnamed body is the fallback bucket. */
const CARD_NAMED_SLOTS = [
	"media",
	"icon",
	"title",
	"subtitle",
	"header",
	"actions",
	"footer"
];
let MonoCard = class MonoCard extends MonoCardCore(LitElement) {
	constructor(..._args) {
		super(..._args);
		this._slotsCaptured = false;
		this._buckets = /* @__PURE__ */ new Map();
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
      <div
        class=${this._cls("mono-card-header", "header")}
        mono-header
        ?mono-no-subtitle=${this._noSubtitle}
      >
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