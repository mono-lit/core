import { t as customElement } from "../../mono-element-CKcT0rwv.js";
import { t as __decorate } from "../../decorate-DbYFpi8R.js";
import { a as parseFormat, c as stripFormat, i as normaliseValue, n as caretAfterFormat, o as resolveFormat, r as localeSeparators, s as significantFor, t as applyFormat } from "../../input-format-GrRCJBqV.js";
import { a as MonoInputCore, i as validateInputProps, n as generateInputAttributes, r as getInputIcon, t as generateInputAriaAttributes } from "../../input-utils-BglY-k0H.js";
import { i as withShadowUtilityStyles, r as toShadowCss, t as flushSsrHydration } from "../../hydration-flush-Volt9X7Q.js";
import { t as input_css_raw_default } from "../../input.css_raw-Br-T8RWv.js";
import { n as label_position_css_raw_default, t as field_validation_css_raw_default } from "../../field-validation.css_raw-BU7C6173.js";
import { t as field_tooltip_css_raw_default } from "../../field-tooltip.css_raw-DVblekCl.js";
import { LitElement, html, isServer, nothing, unsafeCSS } from "lit";

//#region src/components/input/mono-input.shadow.ts
const SHADOW_EXTRA_CSS = "";
let MonoInputShadow = class MonoInputShadow extends withShadowUtilityStyles(MonoInputCore(LitElement)) {
	static {
		this.disableWarning?.("change-in-update");
	}
	static {
		this.styles = [unsafeCSS(toShadowCss(input_css_raw_default + label_position_css_raw_default + field_tooltip_css_raw_default + field_validation_css_raw_default, {
			host: "mono-input",
			append: SHADOW_EXTRA_CSS
		}))];
	}
	firstUpdated(changed) {
		super.firstUpdated(changed);
		for (const name of [
			"prefix",
			"suffix",
			"label",
			"helper"
		]) {
			const slot = this.renderRoot.querySelector(`slot[name="${name}"]`);
			this._setSlotState(name, this._slotHasContent(slot));
		}
	}
	_slotHasContent(slot) {
		return !!slot && slot.assignedNodes({ flatten: true }).some((n) => n.nodeType === Node.ELEMENT_NODE || !!(n.textContent ?? "").trim());
	}
	_setSlotState(name, has) {
		if (name === "prefix") this._hasPrefixSlotState = has;
		else if (name === "suffix") this._hasSuffixSlotState = has;
		else if (name === "label") this._hasLabelSlotState = has;
		else if (name === "helper") this._hasHelperSlotState = has;
	}
	_onSlotChange(name, event) {
		this._setSlotState(name, this._slotHasContent(event.target));
	}
	renderIcon(name) {
		if (name === "upload") return html`
        <svg viewBox="0 0 24 24" mono-icon fill="currentColor" aria-hidden="true">
          <path d="M6.5 20q-2.28 0-3.89-1.57Q1 16.85 1 14.58q0-1.95 1.17-3.48q1.18-1.53 3.08-1.95q.63-2.3 2.5-3.72Q9.63 4 12 4q2.93 0 4.96 2.04Q19 8.07 19 11q1.73.2 2.86 1.5q1.14 1.28 1.14 3q0 1.88-1.31 3.19T18.5 20H13q-.82 0-1.41-.59Q11 18.83 11 18v-5.15L9.4 14.4L8 13l4-4l4 4l-1.4 1.4l-1.6-1.55V18h5.5q1.05 0 1.77-.73q.73-.72.73-1.77t-.73-1.77Q19.55 13 18.5 13H17v-2q0-2.07-1.46-3.54Q14.08 6 12 6Q9.93 6 8.46 7.46Q7 8.93 7 11h-.5q-1.45 0-2.47 1.03Q3 13.05 3 14.5T4.03 17q1.02 1 2.47 1H9v2m3-7" />
        </svg>
      `;
		return html`
      <svg viewBox="0 0 24 24" mono-icon fill="currentColor" aria-hidden="true">
        <path d="M19,6.41L17.59,5L12,10.59L6.41,5L5,6.41L10.59,12L5,17.59L6.41,19L12,13.41L17.59,19L19,17.59L13.41,12L19,6.41Z" />
      </svg>
    `;
	}
	_renderLabel() {
		return html`
      <label
        class=${this._cls("mono-input-label", "label")}
        mono-label
        for=${this._inputId}
        ?mono-empty=${!this.label && !this._hasLabelSlot}
      >
        <slot name="label" @slotchange=${(e) => this._onSlotChange("label", e)}>${this.label}</slot>
        ${this.required ? html`<span class=${this._cls("mono-input-required", "required")} mono-required-mark>*</span>` : nothing}
        ${this._tooltip.render()}
        ${this._renderRangeValue("label")}
      </label>
    `;
	}
	_renderHelper() {
		const base = this._cls("mono-input-message", "message");
		if (this._validation.moved) return html`${this._renderHelperText(base)}${this._renderMovedMessage()}`;
		if (this.validationMessage) {
			const state = this._resolvedValidationState;
			return html`<div class=${`${base} ${state}`} mono-message=${state} role=${state === "invalid" ? "alert" : nothing}>${this.validationMessage}</div>`;
		}
		if (this.errorMessage) return html`<div class=${`${base} invalid`} mono-message="invalid" role="alert">${this.errorMessage}</div>`;
		if (this.successMessage) return html`<div class=${`${base} valid`} mono-message="valid">${this.successMessage}</div>`;
		return this._renderHelperText(base);
	}
	_renderHelperText(base) {
		return html`
      <div
        class=${`${base} helper`}
        mono-message="helper"
        ?mono-empty=${!this.helperText && !this._hasHelperSlot}
      >
        <slot name="helper" @slotchange=${(e) => this._onSlotChange("helper", e)}>${this.helperText}</slot>
      </div>
    `;
	}
	render() {
		return this._renderWrapper(html`
        ${this._renderLabel()}
        <div class=${this._fieldClasses} mono-field>
          <span class=${this._cls("mono-input-prefix", "prefix")} mono-prefix ?mono-empty=${!this._hasPrefixSlot}>
            <slot name="prefix" @slotchange=${(e) => this._onSlotChange("prefix", e)}></slot>
          </span>
          ${this._renderNative()}
          ${this._renderRangeValue("field")}
          ${this._validation.renderIcon()}
          ${this._renderClear()}
          ${this._renderFileIcon()}
          <span class=${this._cls("mono-input-suffix", "suffix")} mono-suffix ?mono-empty=${!this._hasSuffixSlot}>
            <slot name="suffix" @slotchange=${(e) => this._onSlotChange("suffix", e)}></slot>
          </span>
        </div>
        <div id=${this._messageId} class=${this.cssClass?.messageWrap ?? ""} mono-message-wrap>
          ${this._renderHelper()}
        </div>
        ${this._validation.renderFloat()}
    `);
	}
	connectedCallback() {
		super.connectedCallback();
		if (isServer) return;
		flushSsrHydration(this);
	}
};
MonoInputShadow = __decorate([customElement("mono-shadow-input")], MonoInputShadow);

//#endregion
export { MonoInputCore, MonoInputShadow, applyFormat, caretAfterFormat, generateInputAriaAttributes, generateInputAttributes, getInputIcon, localeSeparators, normaliseValue, parseFormat, resolveFormat, significantFor, stripFormat, validateInputProps };