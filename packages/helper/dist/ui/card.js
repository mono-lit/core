import { t as customElement } from "../mono-element-CKcT0rwv.js";
import { t as __decorate } from "../decorate-DbYFpi8R.js";
import { a as parkDetachedNodes, n as bucketHasContent, o as placeLightSlots, r as captureLightSlots } from "../light-slots-B5Ck0t_E.js";
import { n as validateCardProps, r as MonoCardCore, t as generateCardAttributes } from "../card-utils-l80qAmrN.js";
import { LitElement, html, nothing } from "lit";
import { ifDefined } from "lit/directives/if-defined.js";
import { styleMap } from "lit/directives/style-map.js";

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
export { MonoCard, generateCardAttributes, validateCardProps };