import { t as customElement } from "../../mono-element-CKcT0rwv.js";
import { t as __decorate } from "../../decorate-DbYFpi8R.js";
import { a as MonoChipCore, i as MonoStatusDot, n as isInteractive, r as validateChipProps, t as generateChipRootClasses } from "../../chip-utils-DpRrd7Zj.js";
import { t as chip_css_raw_default } from "../../chip.css_raw-ChfRSHLO.js";
import { i as withShadowUtilityStyles, r as toShadowCss, t as flushSsrHydration } from "../../hydration-flush-Volt9X7Q.js";
import { LitElement, html, isServer, nothing, unsafeCSS } from "lit";
import { ifDefined } from "lit/directives/if-defined.js";
import { when } from "lit/directives/when.js";

//#region src/components/chip/mono-chip.shadow.ts
const SHADOW_EXTRA_CSS = `
[data-mono-slot='icon'][data-empty] {
  display: none;
}
`;
let MonoChipShadow = class MonoChipShadow extends withShadowUtilityStyles(MonoChipCore(LitElement)) {
	static {
		this.disableWarning?.("change-in-update");
	}
	static {
		this.styles = [unsafeCSS(toShadowCss(chip_css_raw_default, {
			host: "mono-chip",
			append: SHADOW_EXTRA_CSS
		}))];
	}
	connectedCallback() {
		super.connectedCallback();
		if (isServer) return;
		flushSsrHydration(this);
	}
	firstUpdated(changed) {
		super.firstUpdated?.(changed);
		if (isServer) return;
		this._hasIcon = this._slotHasContent(this._iconSlot());
	}
	_iconSlot() {
		return this.renderRoot.querySelector("slot[name=\"icon\"]");
	}
	_slotHasContent(slot) {
		return !!slot && slot.assignedNodes({ flatten: true }).some((n) => n.nodeType === Node.ELEMENT_NODE || !!(n.textContent ?? "").trim());
	}
	_onIconSlotChange(event) {
		this._hasIcon = this._slotHasContent(event.target);
	}
	_renderDot() {
		return when(this.dot, () => html`<span class=${this._cls("chip-dot", "dot")} mono-dot aria-hidden="true"></span>`, () => nothing);
	}
	_iconSpan() {
		return html`
      <span data-mono-slot="icon" ?mono-empty=${!this._hasIcon}>
        <slot name="icon" @slotchange=${(e) => this._onIconSlotChange(e)}></slot>
      </span>
    `;
	}
	_renderLabel() {
		return html`
      <span class=${this._cls("chip-label", "label")} mono-label>
        ${this.label ? this.label : html`<slot></slot>`}
      </span>
    `;
	}
	_renderClose() {
		return when(this.removable, () => html`
        <button
          class=${this._cls("chip-close", "close")}
          mono-close
          type="button"
          aria-label=${this.closeLabel}
          ?disabled=${this.disabled}
          @click=${this._handleClose}
        >
          <slot name="close">
            <svg
              class="mono-icon"
              mono-glyph
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
              aria-hidden="true"
            >
              <path d="M18 6 6 18M6 6l12 12"></path>
            </svg>
          </slot>
        </button>
      `, () => nothing);
	}
	_renderContent() {
		const contentClass = this._cls(this.iconPosition === "right" ? "chip-content icon-right" : "chip-content icon-left", "content");
		return html`
      <span class=${contentClass} mono-content>
        ${this._renderDot()}
        ${this.iconPosition === "left" ? this._iconSpan() : nothing}
        ${this._renderLabel()}
        ${this.iconPosition === "right" ? this._iconSpan() : nothing}
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
};
MonoChipShadow = __decorate([customElement("mono-shadow-chip")], MonoChipShadow);

//#endregion
export { MonoChipCore, MonoChipShadow, MonoStatusDot, generateChipRootClasses, isInteractive, validateChipProps };