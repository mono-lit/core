import { g as monoHostChildNodes } from "../mono-ui-bwtsaC-q.js";
import { t as customElement } from "../mono-element-D1l07Tbd.js";
import { t as __decorate } from "../decorate-BpnJwD08.js";
import { c as unwatchHostChildren, l as watchHostChildren, s as placeSlotNode } from "../light-slots-CQuCgSHh.js";
import { a as moveRun, c as normalise, d as stepFrom, f as thumbBounds, i as markPoints, l as resolveScale, m as trackPieces, n as coerceNumbers, o as moveThumb, p as toPercent, r as fromRatio, s as nearestThumb, t as MonoSliderCore, u as snap } from "../slider-core-98bK7dkJ.js";
import { LitElement, isServer } from "lit";

//#region src/components/slider/mono-slider.ts
let MonoSlider = class MonoSlider extends MonoSliderCore(LitElement) {
	constructor(..._args) {
		super(..._args);
		this._slotLabel = [];
		this._slotHelper = [];
		this._onHostChildren = () => this._captureSlots();
	}
	createRenderRoot() {
		return this;
	}
	/** Capture `slot="label|helper"` children. Safe to re-run: captured nodes lose `slot` and leave the host. */
	_captureSlots() {
		const captured = /* @__PURE__ */ new Set();
		for (const node of monoHostChildNodes(this)) {
			if (!(node instanceof Element)) continue;
			const name = node.getAttribute("slot");
			if (name === "label") this._slotLabel.push(node);
			else if (name === "helper") this._slotHelper.push(node);
			else continue;
			node.removeAttribute("slot");
			captured.add(node);
		}
		if (captured.size) {
			this._hasLabelSlotState = this._slotLabel.length > 0;
			this._hasHelperSlotState = this._slotHelper.length > 0;
			for (const node of captured) if (node.parentNode === this) this.removeChild(node);
		}
	}
	connectedCallback() {
		super.connectedCallback();
		if (!isServer) watchHostChildren(this, this._onHostChildren);
		this._captureSlots();
		if (this.isConnected) this.performUpdate();
	}
	disconnectedCallback() {
		unwatchHostChildren(this, this._onHostChildren);
		super.disconnectedCallback();
	}
	updated(changed) {
		super.updated(changed);
		this._placeSlot("label", this._slotLabel);
		this._placeSlot("helper", this._slotHelper);
	}
	_placeSlot(name, nodes) {
		if (!nodes.length) return;
		const target = this.querySelector(`[data-mono-slot="${name}"]`);
		if (!target) return;
		for (const node of nodes) placeSlotNode(target, node);
	}
};
MonoSlider = __decorate([customElement("mono-slider")], MonoSlider);

//#endregion
export { MonoSlider, coerceNumbers, fromRatio, markPoints, moveRun, moveThumb, nearestThumb, normalise, resolveScale, snap, stepFrom, thumbBounds, toPercent, trackPieces };