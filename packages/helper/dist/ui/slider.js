import { g as monoHostChildNodes } from "../mono-ui-kvLVIf1V.js";
import { t as customElement } from "../mono-element-CKcT0rwv.js";
import { t as __decorate } from "../decorate-DbYFpi8R.js";
import { s as placeSlotNode } from "../light-slots-B5Ck0t_E.js";
import { a as moveRun, c as normalise, d as stepFrom, f as thumbBounds, i as markPoints, l as resolveScale, m as trackPieces, n as coerceNumbers, o as moveThumb, p as toPercent, r as fromRatio, s as nearestThumb, t as MonoSliderCore, u as snap } from "../slider-core-vcWr321-.js";
import { LitElement, isServer } from "lit";

//#region src/components/slider/mono-slider.ts
let MonoSlider = class MonoSlider extends MonoSliderCore(LitElement) {
	constructor(..._args) {
		super(..._args);
		this._slotLabel = [];
		this._slotHelper = [];
	}
	createRenderRoot() {
		return this;
	}
	/** Capture `slot="label|helper"` children. Safe to re-run: captured nodes lose `slot` and leave the host. */
	_captureSlots() {
		this._slotObserver?.disconnect();
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