import { r as checkCircleIcon, t as alertCircleIcon } from "./field-icons-t8rXRCKs.js";
import { n as FieldBubble } from "./field-tooltip-FyMi9vNM.js";
import { html, nothing } from "lit";
import { ref } from "lit/directives/ref.js";

//#region src/composables/field-validation.ts
/** `default` (or no state) → `null`: a stateless message stays in the bottom row. */
function toneOf(state) {
	if (state === "invalid" || state === "error") return "invalid";
	if (state === "valid" || state === "success") return "valid";
	if (state === "warning") return "warning";
	return null;
}
var FieldValidationController = class {
	constructor(host, read, getBox) {
		this.host = host;
		this.read = read;
		this.getBox = getBox;
		this._iconBubble = new FieldBubble({
			side: "top",
			align: "center"
		});
		this._floatBubble = new FieldBubble({
			side: "bottom",
			align: "start"
		});
		this._hovered = false;
		this._focused = false;
		this._onIconClick = (e) => {
			stopEvent(e);
			this._iconBubble.show();
		};
		this._onEnter = () => {
			this._hovered = true;
			this._syncFloat();
		};
		this._onLeave = (e) => {
			if (e.pointerType === "touch") return;
			this._hovered = false;
			this._syncFloat();
		};
		this._onFocusIn = (e) => {
			this._focused = true;
			this._syncFloat();
			if (this.notice?.position === "icon" && isFocusVisible(e)) this._iconBubble.show();
		};
		this._onFocusOut = (e) => {
			const next = e.relatedTarget;
			if (next && (next === this.host || this.host.contains(next))) return;
			this._focused = false;
			this._syncFloat();
			this._iconBubble.hide();
		};
		host.addController(this);
	}
	/** The message that moved out of the bottom row, or `null` (bottom mode / no text). */
	get notice() {
		const { position, state, text } = this.read();
		if (position !== "icon" && position !== "float") return null;
		const message = typeof text === "string" ? text.trim() : "";
		const tone = toneOf(state);
		if (!message || !tone) return null;
		return {
			position,
			tone,
			text: message
		};
	}
	/** True when the bottom row should show the helper and keep the validation text sr-only. */
	get moved() {
		return this.notice !== null;
	}
	hostConnected() {
		this.host.addEventListener("pointerenter", this._onEnter);
		this.host.addEventListener("pointerleave", this._onLeave);
		this.host.addEventListener("focusin", this._onFocusIn);
		this.host.addEventListener("focusout", this._onFocusOut);
	}
	hostDisconnected() {
		this.host.removeEventListener("pointerenter", this._onEnter);
		this.host.removeEventListener("pointerleave", this._onLeave);
		this.host.removeEventListener("focusin", this._onFocusIn);
		this.host.removeEventListener("focusout", this._onFocusOut);
		this._iconBubble.hide();
		this._floatBubble.hide();
		this._hovered = false;
		this._focused = false;
	}
	hostUpdated() {
		this._floatBubble.setAnchor(this.getBox() ?? null);
		if (this.notice?.position !== "icon") this._iconBubble.hide();
		this._syncFloat();
		this._iconBubble.place();
		this._floatBubble.place();
	}
	/** Re-evaluate the float bubble — for popups the host opens without a re-render (date's calendar). */
	refresh() {
		this._syncFloat();
	}
	/**
	* `icon` mode: the state icon for inside the box (before the clear button /
	* actions). `anchored` wraps it in a zero-height `[mono-validation-anchor]`
	* — for the textarea, whose box can't hold children.
	*/
	renderIcon(options = {}) {
		const notice = this.notice;
		if (notice?.position !== "icon") return nothing;
		const icon = html`<span
      mono-validation-icon
      mono-state=${notice.tone}
      aria-hidden="true"
      @pointerenter=${this._iconBubble.show}
      @pointerleave=${this._iconBubble.onPointerLeave}
      @pointerdown=${stopEvent}
      @click=${this._onIconClick}
      ${ref(this._iconBubble.setAnchor)}
    >${this._glyph(notice.tone)}<span
        mono-field-bubble
        mono-validation-tip
        mono-state=${notice.tone}
        popover="manual"
        @pointerenter=${this._iconBubble.cancelHide}
        @pointerleave=${this._iconBubble.onPointerLeave}
        @click=${stopEvent}
        ${ref(this._iconBubble.setBubble)}
      >${notice.text}</span></span>`;
		return options.anchored ? html`<span mono-validation-anchor>${icon}</span>` : icon;
	}
	/** `float` mode: the bubble that floats under the box while the field is hovered or focused. */
	renderFloat() {
		const notice = this.notice;
		if (notice?.position !== "float") return nothing;
		return html`<span
      mono-field-bubble
      mono-validation-float
      mono-state=${notice.tone}
      aria-hidden="true"
      popover="manual"
      @click=${stopEvent}
      ${ref(this._floatBubble.setBubble)}
    >${notice.text}</span>`;
	}
	/** Light build: UnoCSS mask icons; shadow build: inline SVG (page icon CSS can't reach a shadow root). */
	_glyph(tone) {
		if (this.host.renderRoot instanceof ShadowRoot) return tone === "valid" ? checkCircleIcon() : alertCircleIcon();
		return tone === "valid" ? html`<span class="mono-icon i-mdi-check-circle-outline" mono-icon aria-hidden="true"></span>` : html`<span class="mono-icon i-mdi-alert-circle-outline" mono-icon aria-hidden="true"></span>`;
	}
	_syncFloat() {
		const notice = this.notice;
		const active = this._hovered || this._focused;
		if (notice?.position === "float" && active && !this.read().suppressed) this._floatBubble.show();
		else if (!active) this._floatBubble.scheduleHide();
		else this._floatBubble.hide();
	}
};
const stopEvent = (e) => {
	e.preventDefault();
	e.stopPropagation();
};
function isFocusVisible(e) {
	const target = e.composedPath?.()[0] ?? e.target;
	try {
		return !!target?.matches?.(":focus-visible");
	} catch {
		return false;
	}
}

//#endregion
export { FieldValidationController as t };