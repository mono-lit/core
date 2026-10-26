import { r as checkCircleIcon, t as alertCircleIcon } from "./field-icons-t8rXRCKs.js";
import { r as FieldBubble } from "./field-tooltip.css_raw-CLOqV4J-.js";
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
//#region \0raw:C:\Users\VCT-DEV\Desktop\libs\packages\helper\src\components\form\label-position.css?raw.js
var label_position_css_raw_default = "/* =========================================\r\n   label-position — shared by every field-like control\r\n   (input, select, tag-input, date, textarea, dropdown-table; otp — left / right only).\r\n\r\n   `top` (default) emits NO attribute, so nothing here touches it. The other\r\n   three are layout-only: the label's type, colour and states stay with each\r\n   component's own label rules.\r\n\r\n   Each component's root writes the private slots read below:\r\n     --_mono-lp-width      left/right label column  (--mono-<c>-label-width, auto)\r\n     --_mono-lp-gap        left/right column gap    (--mono-<c>-label-side-gap)\r\n     --_mono-lp-height     one control row — the side label centres on it\r\n     --_mono-lp-box-min    the box's resting min-height (textarea: its rows)\r\n     --_mono-lp-padding-x  the box's inline-start padding — the notch lines up with the text\r\n     --_mono-lp-font       notched label font-size  (--mono-<c>-label-notch-font-size)\r\n     --_mono-lp-notch-bg   the surface the notch is cut from (--mono-<c>-label-notch-bg)\r\n     --_mono-lp-field-bg   the box's own surface — paints the notch's lower half\r\n\r\n   Light: imported once by entries/index.css. Shadow: appended to each\r\n   component's shadow sheet (the inner root keeps its `mono-<c>` attribute).\r\n   ========================================= */\r\n\r\n/* ── left / right — label column + field column; messages stay under the box ── */\r\n:is([mono-input], [mono-select], [mono-tag-input], [mono-date], [mono-textarea], [mono-dropdown-table], [mono-otp]):is([mono-label-position=\"left\"], [mono-label-position=\"right\"]) {\r\n  display: grid;\r\n  grid-template-columns: var(--_mono-lp-width) minmax(0, 1fr);\r\n  column-gap: var(--_mono-lp-gap);\r\n  align-items: start;\r\n}\r\n\r\n:is([mono-input], [mono-select], [mono-tag-input], [mono-date], [mono-textarea], [mono-dropdown-table], [mono-otp])[mono-label-position=\"right\"] {\r\n  grid-template-columns: minmax(0, 1fr) var(--_mono-lp-width);\r\n}\r\n\r\n/* Everything but the label lives in the field column (an absolute panel then\r\n   measures against that column too). */\r\n:is([mono-input], [mono-select], [mono-tag-input], [mono-date], [mono-textarea], [mono-dropdown-table], [mono-otp])[mono-label-position=\"left\"] > * {\r\n  grid-column: 2;\r\n}\r\n:is([mono-input], [mono-select], [mono-tag-input], [mono-date], [mono-textarea], [mono-dropdown-table], [mono-otp])[mono-label-position=\"right\"] > * {\r\n  grid-column: 1;\r\n}\r\n\r\n/* The label centres on the FIRST control row, so a tag-input growing chip\r\n   rows or a tall textarea keeps it beside the top line. */\r\n:is([mono-input], [mono-select], [mono-tag-input], [mono-date], [mono-textarea], [mono-dropdown-table], [mono-otp]):is([mono-label-position=\"left\"], [mono-label-position=\"right\"]) > :is([mono-label], [mono-dd-label]) {\r\n  grid-row: 1;\r\n  grid-column: 1;\r\n  min-height: var(--_mono-lp-height);\r\n  margin: 0;\r\n}\r\n:is([mono-input], [mono-select], [mono-tag-input], [mono-date], [mono-textarea], [mono-dropdown-table], [mono-otp])[mono-label-position=\"right\"] > :is([mono-label], [mono-dd-label]) {\r\n  grid-column: 2;\r\n}\r\n\r\n/* ── notched — shared by both looks: the label leaves the flow ── */\r\n:is([mono-input], [mono-select], [mono-tag-input], [mono-date], [mono-textarea], [mono-dropdown-table])[mono-label-position=\"notched\"] {\r\n  position: relative;\r\n}\r\n\r\n:is([mono-input], [mono-select], [mono-tag-input], [mono-date], [mono-textarea], [mono-dropdown-table])[mono-label-position=\"notched\"] > :is([mono-label], [mono-dd-label]) {\r\n  position: absolute;\r\n  z-index: 1;\r\n  max-width: calc(100% - 2 * var(--_mono-lp-padding-x) - 2 * var(--mono-spacing));\r\n  margin: 0;\r\n  font-size: var(--_mono-lp-font);\r\n  line-height: 1;\r\n  white-space: nowrap;\r\n}\r\n\r\n/* ── notched + outlined — the label sits ON the top border: ──Label── ──\r\n   The \"notch\" is a background patch: page surface above the border line, the\r\n   box's surface below it. On a non-solid parent set --mono-<c>-label-notch-bg. */\r\n:is([mono-input], [mono-select], [mono-tag-input], [mono-date], [mono-textarea], [mono-dropdown-table])[mono-label-position=\"notched\"]:is(:not([mono-variant]), [mono-variant=\"outlined\"]) {\r\n  padding-top: calc(var(--_mono-lp-font) / 2);\r\n}\r\n\r\n:is([mono-input], [mono-select], [mono-tag-input], [mono-date], [mono-textarea], [mono-dropdown-table])[mono-label-position=\"notched\"]:is(:not([mono-variant]), [mono-variant=\"outlined\"]) > :is([mono-label], [mono-dd-label]) {\r\n  top: 0;\r\n  inset-inline-start: calc(var(--mono-border-width) + var(--_mono-lp-padding-x) - var(--mono-spacing));\r\n  padding-inline: var(--mono-spacing);\r\n  background:\r\n    linear-gradient(var(--_mono-lp-field-bg), var(--_mono-lp-field-bg)) bottom / 100% 50% no-repeat,\r\n    var(--_mono-lp-notch-bg);\r\n}\r\n\r\n/* ── notched + filled / underlined — no outline to cut, so the label insets\r\n   into the top of the box (Material \"filled\") and the box grows by its line ── */\r\n:is([mono-input], [mono-select], [mono-tag-input], [mono-date], [mono-textarea], [mono-dropdown-table])[mono-label-position=\"notched\"]:is([mono-variant=\"filled\"], [mono-variant=\"underlined\"]) > :is([mono-label], [mono-dd-label]) {\r\n  top: calc(var(--mono-border-width) + var(--_mono-lp-inset-y));\r\n  inset-inline-start: calc(var(--mono-border-width) + var(--_mono-lp-padding-x));\r\n}\r\n\r\n:is([mono-input], [mono-select], [mono-tag-input], [mono-date], [mono-textarea])[mono-label-position=\"notched\"]:is([mono-variant=\"filled\"], [mono-variant=\"underlined\"]) > :is([mono-field], [mono-trigger], textarea[mono-native]),\r\n[mono-dropdown-table][mono-label-position=\"notched\"]:is([mono-variant=\"filled\"], [mono-variant=\"underlined\"]) > [mono-dd-control] > [mono-dd-trigger] {\r\n  min-height: calc(var(--_mono-lp-box-min) + var(--_mono-lp-font) + var(--_mono-lp-inset-y));\r\n  padding-top: calc(var(--_mono-lp-inset-y) + var(--_mono-lp-font) + var(--_mono-lp-padding-y, 0px));\r\n}\r\n\r\n/* Slots the component sheets don't need to set. */\r\n:is([mono-input], [mono-select], [mono-tag-input], [mono-date], [mono-textarea], [mono-dropdown-table])[mono-label-position] {\r\n  --_mono-lp-inset-y: calc(var(--mono-spacing) * 1.5);\r\n}\r\n";

//#endregion
//#region \0raw:C:\Users\VCT-DEV\Desktop\libs\packages\helper\src\components\form\field-validation.css?raw.js
var field_validation_css_raw_default = "/* =========================================\r\n   validation-position — `icon` and `float` (composables/field-validation.ts)\r\n   on input, select, tag-input, date, textarea and dropdown-table.\r\n\r\n   The bubbles share the [mono-field-bubble] look (field-tooltip.css); this\r\n   sheet paints them in the state colour, and draws the state icon inside the\r\n   box. Knobs:\r\n     --mono-validation-invalid-bg / -color   (default --destructive / -foreground)\r\n     --mono-validation-warning-bg / -color   (default --warning / -foreground)\r\n     --mono-validation-valid-bg / -color     (default --success / -foreground)\r\n     --mono-validation-icon-size             (default 1rem)\r\n\r\n   Light: imported once by entries/index.css. Shadow: appended to each\r\n   control's shadow sheet.\r\n   ========================================= */\r\n\r\n/* ── state-coloured bubbles ── */\r\n[mono-field-bubble][mono-state=\"invalid\"] {\r\n  --_mono-field-tip-bg: var(--mono-validation-invalid-bg, var(--destructive));\r\n  color: var(--mono-validation-invalid-color, var(--destructive-foreground, #fff));\r\n}\r\n[mono-field-bubble][mono-state=\"warning\"] {\r\n  --_mono-field-tip-bg: var(--mono-validation-warning-bg, var(--warning));\r\n  color: var(--mono-validation-warning-color, var(--warning-foreground, #fff));\r\n}\r\n[mono-field-bubble][mono-state=\"valid\"] {\r\n  --_mono-field-tip-bg: var(--mono-validation-valid-bg, var(--success));\r\n  color: var(--mono-validation-valid-color, var(--success-foreground, #fff));\r\n}\r\n\r\n/* ── float: a compact message under the box ── */\r\n[mono-field-bubble][mono-validation-float] {\r\n  max-width: min(var(--mono-validation-float-max-width, 24rem), calc(100vw - 16px));\r\n  padding: var(--mono-validation-float-padding-y, var(--mono-spacing)) var(--mono-validation-float-padding-x, calc(var(--mono-spacing) * 2));\r\n  font-size: var(--mono-validation-float-font-size, var(--mono-text-xs));\r\n  /* hover-transparent: it must not steal the pointer from the field it describes */\r\n  pointer-events: none;\r\n}\r\n[mono-field-bubble][mono-validation-float]::before {\r\n  display: none;\r\n}\r\n\r\n/* ── icon: the state glyph inside the box ── */\r\n[mono-validation-icon] {\r\n  position: relative;\r\n  display: inline-flex;\r\n  flex: none;\r\n  align-items: center;\r\n  justify-content: center;\r\n  align-self: center;\r\n  margin-inline: var(--mono-validation-icon-gap, var(--mono-spacing));\r\n  font-size: var(--mono-validation-icon-size, 1rem);\r\n  line-height: 1;\r\n  cursor: help;\r\n  /* a disabled field turns events off — the reason is exactly what to show */\r\n  pointer-events: auto;\r\n}\r\n[mono-validation-icon] > [mono-icon] {\r\n  width: 1em;\r\n  height: 1em;\r\n}\r\n[mono-validation-icon][mono-state=\"invalid\"] {\r\n  color: var(--mono-validation-invalid-bg, var(--destructive));\r\n}\r\n[mono-validation-icon][mono-state=\"warning\"] {\r\n  color: var(--mono-validation-warning-bg, var(--warning));\r\n}\r\n[mono-validation-icon][mono-state=\"valid\"] {\r\n  color: var(--mono-validation-valid-bg, var(--success));\r\n}\r\n\r\n/* textarea: the box can't hold children, so a zero-height anchor sits on the\r\n   textarea's top edge (its negative margin cancels the flex gap it adds) and\r\n   the icon pins to the top-right corner, over reserved inline padding. */\r\n[mono-textarea] > [mono-validation-anchor] {\r\n  position: relative;\r\n  z-index: 1;\r\n  display: block;\r\n  height: 0;\r\n  margin-bottom: calc(-1 * var(--mono-textarea-gap, calc(var(--mono-spacing) * 3)));\r\n}\r\n[mono-textarea] > [mono-validation-anchor] > [mono-validation-icon] {\r\n  position: absolute;\r\n  top: calc(var(--mono-border-width) + var(--_mono-textarea-padding-y, var(--mono-spacing)));\r\n  inset-inline-end: calc(var(--mono-border-width) + var(--_mono-textarea-padding-x, calc(var(--mono-spacing) * 2.5)));\r\n  margin: 0;\r\n}\r\n[mono-textarea]:has(> [mono-validation-anchor]) > textarea[mono-native] {\r\n  padding-inline-end: calc(var(--_mono-textarea-padding-x, calc(var(--mono-spacing) * 2.5)) + var(--mono-validation-icon-size, 1rem) + var(--mono-spacing));\r\n}\r\n/* side labels: the anchor shares the textarea's grid row */\r\n[mono-textarea]:is([mono-label-position=\"left\"], [mono-label-position=\"right\"]) > :is([mono-validation-anchor], textarea[mono-native]) {\r\n  grid-row: 1;\r\n  align-self: start;\r\n}\r\n[mono-textarea]:is([mono-label-position=\"left\"], [mono-label-position=\"right\"]) > [mono-validation-anchor] {\r\n  margin-bottom: 0;\r\n}\r\n\r\n/* ── the moved message stays for assistive tech only ── */\r\n[mono-sr-only] {\r\n  position: absolute !important;\r\n  width: 1px !important;\r\n  height: 1px !important;\r\n  margin: -1px !important;\r\n  padding: 0 !important;\r\n  overflow: hidden !important;\r\n  clip-path: inset(50%) !important;\r\n  white-space: nowrap !important;\r\n  border: 0 !important;\r\n}\r\n";

//#endregion
export { label_position_css_raw_default as n, FieldValidationController as r, field_validation_css_raw_default as t };