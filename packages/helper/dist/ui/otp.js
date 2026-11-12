import { g as monoHostChildNodes } from "../mono-ui-kvLVIf1V.js";
import { t as customElement } from "../mono-element-CKcT0rwv.js";
import { t as __decorate } from "../decorate-DbYFpi8R.js";
import { s as placeSlotNode } from "../light-slots-B5Ck0t_E.js";
import { a as normaliseOtpValue, c as resolveOtpLength, d as spliceOtpValue, i as clampCaret, l as sanitizeOtpChar, n as OTP_DEFAULT_LENGTH, o as parseOtpGroups, r as backspaceOtp, s as removeOtpChar, t as MonoOtpCore, u as sanitizeOtpText } from "../otp-core-DXg3vFLh.js";
import { LitElement, html, isServer } from "lit";

//#region src/components/otp/mono-otp.ts
let MonoOtp = class MonoOtp extends MonoOtpCore(LitElement) {
	constructor(..._args) {
		super(..._args);
		this._slots = {
			prefix: [],
			suffix: [],
			label: [],
			helper: []
		};
	}
	createRenderRoot() {
		return this;
	}
	/** Capture `slot="…"` children. Safe to re-run: captured nodes lose `slot` and leave the host. */
	_captureSlots() {
		this._slotObserver?.disconnect();
		const captured = /* @__PURE__ */ new Set();
		for (const node of monoHostChildNodes(this)) {
			if (!(node instanceof Element)) continue;
			const name = node.getAttribute("slot");
			if (name !== "prefix" && name !== "suffix" && name !== "label" && name !== "helper") continue;
			this._slots[name].push(node);
			node.removeAttribute("slot");
			captured.add(node);
		}
		if (captured.size) {
			this._hasPrefixSlotState = this._slots.prefix.length > 0;
			this._hasSuffixSlotState = this._slots.suffix.length > 0;
			this._hasLabelSlotState = this._slots.label.length > 0;
			this._hasHelperSlotState = this._slots.helper.length > 0;
			for (const node of captured) if (node.parentNode === this) this.removeChild(node);
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
		for (const name of [
			"prefix",
			"suffix",
			"label",
			"helper"
		]) {
			const nodes = this._slots[name];
			if (!nodes.length) continue;
			const target = this.querySelector(`[data-mono-slot="${name}"]`);
			if (!target) continue;
			for (const node of nodes) placeSlotNode(target, node);
		}
	}
	renderIcon(_name) {
		return html`<span class="mono-icon i-mdi-close" mono-icon aria-hidden="true"></span>`;
	}
};
MonoOtp = __decorate([customElement("mono-otp")], MonoOtp);

//#endregion
export { MonoOtp, OTP_DEFAULT_LENGTH, backspaceOtp, clampCaret, normaliseOtpValue, parseOtpGroups, removeOtpChar, resolveOtpLength, sanitizeOtpChar, sanitizeOtpText, spliceOtpValue };