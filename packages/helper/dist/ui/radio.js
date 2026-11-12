import { g as monoHostChildNodes } from "../mono-ui-kvLVIf1V.js";
import { t as customElement } from "../mono-element-CKcT0rwv.js";
import { t as __decorate } from "../decorate-DbYFpi8R.js";
import { s as placeSlotNode } from "../light-slots-B5Ck0t_E.js";
import { n as validateRadioProps, r as MonoRadioCore, t as generateRadioAttributes } from "../radio-utils-Dk9Tl1jz.js";
import { LitElement } from "lit";
import { state } from "lit/decorators.js";

//#region src/components/radio/mono-radio.ts
let MonoRadio = class MonoRadio extends MonoRadioCore(LitElement) {
	constructor(..._args) {
		super(..._args);
		this._slotsCaptured = false;
		this._slotLabel = [];
		this._slotDescription = [];
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
		super.updated?.(changed);
		this._placeSlot("label", this._slotLabel);
		this._placeSlot("description", this._slotDescription);
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
			if (slotName === "sublabel" || slotName === "description") {
				node.removeAttribute("slot");
				this._slotDescription.push(node);
				capturedSlotNodes.add(node);
			}
		}
		this._hasLabelSlotState = this._slotLabel.length > 0;
		this._hasDescriptionSlotState = this._slotDescription.length > 0;
		for (const node of capturedSlotNodes) if (node.parentNode === this) this.removeChild(node);
	}
	_placeSlot(name, nodes) {
		if (!nodes.length) return;
		const target = this.querySelector(`[data-mono-slot="${name}"]`);
		if (!target) return;
		for (const node of nodes) placeSlotNode(target, node);
	}
};
__decorate([state()], MonoRadio.prototype, "_slotsCaptured", void 0);
MonoRadio = __decorate([customElement("mono-radio")], MonoRadio);

//#endregion
export { MonoRadio, generateRadioAttributes, validateRadioProps };