import { t as customElement } from "../mono-element-CKcT0rwv.js";
import { t as __decorate } from "../decorate-DbYFpi8R.js";
import { n as bucketHasContent, r as captureLightSlots, s as placeSlotNode } from "../light-slots-B5Ck0t_E.js";
import { a as MonoChipCore, i as MonoStatusDot, n as isInteractive, r as validateChipProps, t as generateChipRootClasses } from "../chip-utils-DpRrd7Zj.js";
import { LitElement, html, nothing } from "lit";
import { ifDefined } from "lit/directives/if-defined.js";
import { when } from "lit/directives/when.js";

//#region src/components/chip/mono-chip.ts
let MonoChip = class MonoChip extends MonoChipCore(LitElement) {
	constructor(..._args) {
		super(..._args);
		this._buckets = /* @__PURE__ */ new Map();
		this._slotsCaptured = false;
	}
	createRenderRoot() {
		return this;
	}
	_renderLabel() {
		return html`
      <span class=${this._cls("chip-label", "label")} mono-label data-mono-slot="default">
        ${when(Boolean(this.label), () => this.label, () => nothing)}
      </span>
    `;
	}
	_renderDot() {
		return when(this.dot, () => html`<span class=${this._cls("chip-dot", "dot")} mono-dot aria-hidden="true"></span>`, () => nothing);
	}
	_renderClose() {
		return when(this.removable, () => html`
        <button
          class=${this._cls("chip-close", "close")}
          mono-close
          type="button"
          aria-label=${this.closeLabel}
          ?disabled=${this.disabled}
          data-mono-slot="close"
          @click=${this._handleClose}
        >
          ${bucketHasContent(this._buckets.get("close")) ? nothing : html`<span class="mono-icon i-mdi-close" mono-glyph aria-hidden="true"></span>`}
        </button>
      `, () => nothing);
	}
	_renderContent() {
		const hasIcon = this._hasIcon;
		const contentClass = this._cls(hasIcon ? this.iconPosition === "right" ? "chip-content icon-right" : "chip-content icon-left" : "chip-content", "content");
		return html`
      <span class=${contentClass} mono-content>
        ${this._renderDot()}

        ${when(hasIcon && this.iconPosition === "left", () => html`<span data-mono-slot="icon"></span>`, () => nothing)}

        ${this._renderLabel()}

        ${when(hasIcon && this.iconPosition === "right", () => html`<span data-mono-slot="icon"></span>`, () => nothing)}

        ${this._renderClose()}
      </span>
    `;
	}
	render() {
		const tabIndex = this._isInteractive && !this.disabled ? "0" : void 0;
		const ariaLabel = this.ariaLabelText ?? this.label;
		if (this.href) return html`
        <div
        class=${this._chipClasses}
        mono-chip
        mono-size=${this.size === "md" ? nothing : this.size}
        mono-color=${this.color === "primary" ? nothing : this.color}
        mono-variant=${this.variant === "soft" ? nothing : this.variant}
        mono-rounded=${this.rounded ? this.rounded : nothing}
        mono-icon-position=${this.iconPosition === "right" ? "right" : nothing}
        ?mono-has-dot=${this.dot}
        ?mono-removable=${this.removable}
        ?mono-clickable=${this.clickable || !!this.href}
        ?mono-disabled=${this.disabled}
        ?mono-selected=${this.selected || this._isActive}
      >
          <a
            class=${"mono-chip-native" + (this.cssClass?.main ? " " + this.cssClass.main : "")}
            mono-main
            href=${ifDefined(this.href)}
            target=${ifDefined(this.target)}
            role="button"
            aria-label=${ifDefined(ariaLabel)}
            aria-disabled=${this.disabled ? "true" : "false"}
            @click=${this._handleClick}
            @keydown=${this._handleKeyDown}
            @focus=${this._handleFocus}
            @blur=${this._handleBlur}
          >
            ${this._renderContent()}
          </a>
        </div>
      `;
		return html`
      <div
        class=${this._chipClasses}
        mono-chip
        mono-size=${this.size === "md" ? nothing : this.size}
        mono-color=${this.color === "primary" ? nothing : this.color}
        mono-variant=${this.variant === "soft" ? nothing : this.variant}
        mono-rounded=${this.rounded ? this.rounded : nothing}
        mono-icon-position=${this.iconPosition === "right" ? "right" : nothing}
        ?mono-has-dot=${this.dot}
        ?mono-removable=${this.removable}
        ?mono-clickable=${this.clickable || !!this.href}
        ?mono-disabled=${this.disabled}
        ?mono-selected=${this.selected || this._isActive}
      >
        <span
          class=${ifDefined(this.cssClass?.main)}
          mono-main
          role=${this._isInteractive ? "button" : "status"}
          tabindex=${ifDefined(tabIndex)}
          aria-label=${ifDefined(ariaLabel)}
          aria-disabled=${this.disabled ? "true" : "false"}
          @click=${this._handleClick}
          @keydown=${this._handleKeyDown}
          @focus=${this._handleFocus}
          @blur=${this._handleBlur}
        >
          ${this._renderContent()}
        </span>
      </div>
    `;
	}
	connectedCallback() {
		super.connectedCallback();
		this.setAttribute("role", "status");
		this._captureSlots();
		if (this.isConnected) this.performUpdate();
	}
	/**
	* In light DOM mode, <slot> elements no longer project the host's children.
	* Capture them once before Lit's first render replaces the children, then
	* re-place them in the render template at the right positions. `light-slots`
	* carries comments and zero-length Fragment text nodes with the content they
	* anchor and removes *only* what it buckets — the previous inline logic deleted
	* every original child, dropping Vue's anchors for good.
	*/
	_captureSlots() {
		if (this._slotsCaptured) return;
		this._slotsCaptured = true;
		this._buckets = captureLightSlots(this, { names: ["icon", "close"] });
		this._hasIcon = bucketHasContent(this._buckets.get("icon"));
	}
	updated(changed) {
		super.updated(changed);
		this._placeSlot("icon", this._buckets.get("icon") ?? []);
		this._placeSlot("close", this._buckets.get("close") ?? []);
		if (!this.label) this._placeSlot("default", this._buckets.get("default") ?? []);
	}
	_placeSlot(name, nodes) {
		if (!nodes.length) return;
		const target = this.querySelector(`[data-mono-slot="${name}"]`);
		if (!target) return;
		for (const node of nodes) placeSlotNode(target, node);
	}
};
MonoChip = __decorate([customElement("mono-chip")], MonoChip);

//#endregion
export { MonoChip, MonoStatusDot, generateChipRootClasses, isInteractive, validateChipProps };