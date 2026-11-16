import { g as monoHostChildNodes } from "../mono-ui-bwtsaC-q.js";
import { t as customElement } from "../mono-element-D1l07Tbd.js";
import { t as __decorate } from "../decorate-BpnJwD08.js";
import { s as placeSlotNode } from "../light-slots-CQuCgSHh.js";
import { n as MonoTextareaCore, t as validateTextareaProps } from "../textarea-utils-loZHL__o.js";
import { LitElement } from "lit";

//#region src/components/textarea/mono-textarea.ts
let MonoTextarea = class MonoTextarea extends MonoTextareaCore(LitElement) {
	constructor(..._args) {
		super(..._args);
		this._slotsCaptured = false;
		this._slotLabel = [];
		this._slotHelper = [];
	}
	createRenderRoot() {
		return this;
	}
	connectedCallback() {
		super.connectedCallback();
		this._captureSlots();
		if (this.isConnected) this.performUpdate();
	}
	updated(changed) {
		super.updated(changed);
		this._placeSlot("label", this._slotLabel);
		this._placeSlot("helper", this._slotHelper);
	}
	_captureSlots() {
		if (this._slotsCaptured) return;
		this._slotsCaptured = true;
		const captured = monoHostChildNodes(this);
		const capturedSlotNodes = /* @__PURE__ */ new Set();
		for (const node of captured) {
			if (!(node instanceof Element)) continue;
			const slotName = node.getAttribute("slot");
			if (slotName === "label") {
				node.removeAttribute("slot");
				this._slotLabel.push(node);
				capturedSlotNodes.add(node);
			}
			if (slotName === "helper") {
				node.removeAttribute("slot");
				this._slotHelper.push(node);
				capturedSlotNodes.add(node);
			}
		}
		this._hasLabelSlotState = this._slotLabel.length > 0;
		this._hasHelperSlotState = this._slotHelper.length > 0;
		for (const node of capturedSlotNodes) if (node.parentNode === this) this.removeChild(node);
	}
	_placeSlot(name, nodes) {
		if (!nodes.length) return;
		const target = this.querySelector(`[data-mono-slot="${name}"]`);
		if (!target) return;
		for (const node of nodes) placeSlotNode(target, node);
	}
};
MonoTextarea = __decorate([customElement("mono-textarea")], MonoTextarea);

//#endregion
export { MonoTextarea, validateTextareaProps };