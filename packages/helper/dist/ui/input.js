import { g as monoHostChildNodes } from "../mono-ui-kvLVIf1V.js";
import { t as customElement } from "../mono-element-CKcT0rwv.js";
import { t as __decorate } from "../decorate-DbYFpi8R.js";
import { s as placeSlotNode } from "../light-slots-B5Ck0t_E.js";
import { a as parseFormat, c as stripFormat, i as normaliseValue, n as caretAfterFormat, o as resolveFormat, r as localeSeparators, s as significantFor, t as applyFormat } from "../input-format-GrRCJBqV.js";
import { a as MonoInputCore, i as validateInputProps, n as generateInputAttributes, r as getInputIcon, t as generateInputAriaAttributes } from "../input-utils-BglY-k0H.js";
import { LitElement, html, isServer, nothing } from "lit";

//#region src/components/input/mono-input.ts
let MonoInput = class MonoInput extends MonoInputCore(LitElement) {
	constructor(..._args) {
		super(..._args);
		this._slotPrefix = [];
		this._slotSuffix = [];
		this._slotLabel = [];
		this._slotHelper = [];
	}
	createRenderRoot() {
		return this;
	}
	/**
	* Capture `slot="…"` light-DOM children into the per-region arrays. Safe to run
	* MORE THAN ONCE: captured nodes have their `slot` attribute removed and are
	* detached from the host, so a re-scan never re-captures them. Re-running lets
	* us pick up children Vue appends AFTER `connectedCallback` (e.g. a client-only
	* `<mono-input>` slotted into the SSR `<mono-nav>`'s shadow `<slot>`, where the
	* `<span slot="prefix">` can arrive late) — the original one-shot capture missed
	* those, so the prefix wrapper was never rendered and the icon never showed.
	*/
	_captureSlots() {
		this._slotObserver?.disconnect();
		const captured = monoHostChildNodes(this);
		const capturedSlotNodes = /* @__PURE__ */ new Set();
		for (const node of captured) {
			if (!(node instanceof Element)) continue;
			const slotName = node.getAttribute("slot");
			if (slotName === "prefix") {
				node.removeAttribute("slot");
				this._slotPrefix.push(node);
				capturedSlotNodes.add(node);
			} else if (slotName === "suffix") {
				node.removeAttribute("slot");
				this._slotSuffix.push(node);
				capturedSlotNodes.add(node);
			} else if (slotName === "label") {
				node.removeAttribute("slot");
				this._slotLabel.push(node);
				capturedSlotNodes.add(node);
			} else if (slotName === "helper") {
				node.removeAttribute("slot");
				this._slotHelper.push(node);
				capturedSlotNodes.add(node);
			}
		}
		if (capturedSlotNodes.size) {
			this._hasPrefixSlotState = this._slotPrefix.length > 0;
			this._hasSuffixSlotState = this._slotSuffix.length > 0;
			this._hasLabelSlotState = this._slotLabel.length > 0;
			this._hasHelperSlotState = this._slotHelper.length > 0;
			for (const node of capturedSlotNodes) if (node.parentNode === this) this.removeChild(node);
		}
		if (this._slotObserver && this.isConnected) this._slotObserver.observe(this, { childList: true });
	}
	connectedCallback() {
		super.connectedCallback();
		if (!isServer && !this._slotObserver && typeof MutationObserver !== "undefined") this._slotObserver = new MutationObserver(() => this._captureSlots());
		this._captureSlots();
		if (this.isConnected) this.performUpdate();
	}
	disconnectedCallback() {
		this._slotObserver?.disconnect();
		super.disconnectedCallback();
	}
	updated(changed) {
		super.updated(changed);
		this._placeSlot("prefix", this._slotPrefix);
		this._placeSlot("suffix", this._slotSuffix);
		this._placeSlot("label", this._slotLabel);
		this._placeSlot("helper", this._slotHelper);
	}
	_placeSlot(name, nodes) {
		if (!nodes.length) return;
		const target = this.querySelector(`[data-mono-slot="${name}"]`);
		if (!target) return;
		for (const node of nodes) placeSlotNode(target, node);
	}
	renderIcon(name) {
		if (name === "upload") return html`<span class="mono-icon i-mdi-cloud-upload-outline" mono-icon aria-hidden="true"></span>`;
		return html`<span class="mono-icon i-mdi-close" mono-icon aria-hidden="true"></span>`;
	}
	_renderLabel() {
		if (!this.label && !this._hasLabelSlot) return nothing;
		return html`
      <label class=${this._cls("mono-input-label", "label")} mono-label for=${this._inputId}>
        ${this._hasLabelSlot ? html`<span data-mono-slot="label"></span>` : this.label}
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
		if (this.helperText || this._hasHelperSlot) return html`<div class=${`${base} helper`} mono-message="helper">${this._hasHelperSlot ? html`<span data-mono-slot="helper"></span>` : this.helperText}</div>`;
		return nothing;
	}
	render() {
		return this._renderWrapper(html`
        ${this._renderLabel()}
        <div class=${this._fieldClasses} mono-field>
          ${this._hasPrefixSlot ? html`<span class=${this._cls("mono-input-prefix", "prefix")} mono-prefix><span data-mono-slot="prefix"></span></span>` : nothing}
          ${this._renderNative()}
          ${this._renderRangeValue("field")}
          ${this._validation.renderIcon()}
          ${this._renderClear()}
          ${this._renderFileIcon()}
          ${this._hasSuffixSlot ? html`<span class=${this._cls("mono-input-suffix", "suffix")} mono-suffix><span data-mono-slot="suffix"></span></span>` : nothing}
        </div>
        <div id=${this._messageId} class=${this.cssClass?.messageWrap ?? ""} mono-message-wrap>
          ${this._renderHelper()}
        </div>
        ${this._validation.renderFloat()}
    `);
	}
};
MonoInput = __decorate([customElement("mono-input")], MonoInput);

//#endregion
export { MonoInput, applyFormat, caretAfterFormat, generateInputAriaAttributes, generateInputAttributes, getInputIcon, localeSeparators, normaliseValue, parseFormat, resolveFormat, significantFor, stripFormat, validateInputProps };