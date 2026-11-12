import { g as monoHostChildNodes } from "../mono-ui-kvLVIf1V.js";
import { t as customElement } from "../mono-element-CKcT0rwv.js";
import { t as __decorate } from "../decorate-DbYFpi8R.js";
import { s as placeSlotNode } from "../light-slots-B5Ck0t_E.js";
import { n as MonoSelectCore, t as validateSelectProps } from "../select-utils-BgArYHk8.js";
import { LitElement, html } from "lit";

//#region src/components/select/mono-select.ts
let MonoSelect = class MonoSelect extends MonoSelectCore(LitElement) {
	constructor(..._args) {
		super(..._args);
		this._slotsCaptured = false;
		this._slotLabel = [];
		this._slotHelper = [];
		this._slotPrefix = [];
		this._slotSuffix = [];
		this._slotList = null;
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
		this._onLateListSlot();
		this._placeSlot("label", this._slotLabel);
		this._placeSlot("helper", this._slotHelper);
		this._placeSlot("prefix", this._slotPrefix);
		this._placeSlot("suffix", this._slotSuffix);
		this._placeListSlot();
		this._watchListChrome();
		this._syncListChrome();
	}
	/**
	* The captured wrapper, which is the truth for this build at every moment: parked out of the
	* host before the panel exists, and inside the panel after. The core's default (a light child of
	* the host) is the SHADOW build's answer and would find nothing here.
	*/
	get _listSlotWrapper() {
		return this._slotList;
	}
	/** Light-DOM target for the list wrapper; the shadow build projects instead. */
	renderListSlot() {
		return html`<div class="mono-select-list-slot" mono-list-slot data-mono-slot="list" @click=${this._onListSlotClick}></div>`;
	}
	/**
	* Move the wrapper into the panel, once it exists.
	*
	* The panel is relocated into a body portal while open, so the target is queried through the
	* core's portal-aware root rather than the host. Idempotent: once the wrapper is inside the
	* target it is left alone, which matters because re-appending it on every render would blow away
	* the consumer's scroll position and focus.
	*/
	_placeListSlot() {
		const wrapper = this._slotList;
		if (!wrapper) return;
		const target = this._listSlotTarget;
		if (!target || wrapper.parentNode === target) return;
		target.appendChild(wrapper);
	}
	/**
	* Adopt a wrapper that appeared after `connectedCallback` — see `LateSlotWatcher`.
	*
	* Two things have to happen and the order matters. It is PARKED first, out of the host, because
	* until it is placed it would otherwise paint in the host's own flow, under the field rather
	* than inside the panel — that is the bug this exists for. Only then is the flag flipped, which
	* schedules the render that creates the target `_placeListSlot` needs.
	*
	* Parking detached is safe for the subtree inside it: the consumer's `v-for` inserts against
	* anchors that are its OWN children, and those move with it.
	*/
	_onLateListSlot() {
		if (this._slotList) return;
		const wrapper = this._lateListSlot.find();
		if (!wrapper) return;
		this._slotList = wrapper;
		if (wrapper.parentNode === this) this.removeChild(wrapper);
		this._hasListSlotState = true;
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
			if (slotName === "prefix") {
				node.removeAttribute("slot");
				this._slotPrefix.push(node);
				capturedSlotNodes.add(node);
			}
			if (slotName === "suffix") {
				node.removeAttribute("slot");
				this._slotSuffix.push(node);
				capturedSlotNodes.add(node);
			}
			if (slotName === "list" && !this._slotList) {
				this._slotList = node;
				this._hasListSlotState = true;
				capturedSlotNodes.add(node);
			}
		}
		this._hasLabelSlotState = this._slotLabel.length > 0;
		this._hasHelperSlotState = this._slotHelper.length > 0;
		this._hasPrefixSlotState = this._slotPrefix.length > 0;
		this._hasSuffixSlotState = this._slotSuffix.length > 0;
		for (const node of capturedSlotNodes) if (node.parentNode === this) this.removeChild(node);
	}
	_placeSlot(name, nodes) {
		if (!nodes.length) return;
		const target = this.querySelector(`[data-mono-slot="${name}"]`);
		if (!target) return;
		for (const node of nodes) placeSlotNode(target, node);
	}
};
MonoSelect = __decorate([customElement("mono-select")], MonoSelect);

//#endregion
export { MonoSelect, validateSelectProps };