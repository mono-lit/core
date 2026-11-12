import { g as monoHostChildNodes } from "../mono-ui-kvLVIf1V.js";
import { t as customElement } from "../mono-element-CKcT0rwv.js";
import { t as __decorate } from "../decorate-DbYFpi8R.js";
import { s as placeSlotNode } from "../light-slots-B5Ck0t_E.js";
import { n as validateCheckboxProps, r as MonoCheckboxCore, t as generateCheckboxAttributes } from "../checkbox-utils-DKdrhAzF.js";
import { LitElement } from "lit";
import { state } from "lit/decorators.js";

//#region src/components/checkbox/mono-checkbox.ts
let MonoCheckbox = class MonoCheckbox extends MonoCheckboxCore(LitElement) {
	constructor(..._args) {
		super(..._args);
		this._slotsCaptured = false;
		this._slotIcon = [];
		this._slotIndeterminateIcon = [];
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
		super.updated(changed);
		this._placeSlot("icon", this._slotIcon);
		this._placeSlot("indeterminate-icon", this._slotIndeterminateIcon);
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
			if (slotName === "icon") {
				node.removeAttribute("slot");
				this._slotIcon.push(node);
				capturedSlotNodes.add(node);
			}
			if (slotName === "indeterminate-icon") {
				node.removeAttribute("slot");
				this._slotIndeterminateIcon.push(node);
				capturedSlotNodes.add(node);
			}
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
		this._hasIcon = this._slotIcon.length > 0;
		this._hasIndeterminateIcon = this._slotIndeterminateIcon.length > 0;
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
__decorate([state()], MonoCheckbox.prototype, "_slotsCaptured", void 0);
MonoCheckbox = __decorate([customElement("mono-checkbox")], MonoCheckbox);

//#endregion
export { MonoCheckbox, generateCheckboxAttributes, validateCheckboxProps };