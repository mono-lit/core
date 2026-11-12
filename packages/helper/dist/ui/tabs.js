import { g as monoHostChildNodes } from "../mono-ui-kvLVIf1V.js";
import { t as customElement } from "../mono-element-CKcT0rwv.js";
import { t as __decorate } from "../decorate-DbYFpi8R.js";
import { a as parkDetachedNodes, s as placeSlotNode } from "../light-slots-B5Ck0t_E.js";
import { t as MonoTabsCore } from "../tabs-core-r5-B8k_N.js";
import { LitElement } from "lit";
import { state } from "lit/decorators.js";

//#region src/components/tabs/mono-tabs.ts
let MonoTabs = class MonoTabs extends MonoTabsCore(LitElement) {
	constructor(..._args) {
		super(..._args);
		this._slotsCaptured = false;
		this._slotIcons = /* @__PURE__ */ new Map();
	}
	createRenderRoot() {
		return this;
	}
	/** Light-DOM: a tab has an icon when a `slot="icon-<id>"` child was captured. */
	_iconHasContent(id) {
		return this._slotIcons.has(id);
	}
	connectedCallback() {
		super.connectedCallback();
		this._captureSlots();
		if (this.isConnected) this.performUpdate();
	}
	updated(changed) {
		super.updated(changed);
		this._placeIconSlots();
		this._orphanHolder = parkDetachedNodes(this._orphanHolder, [...this._slotIcons.values()].flat());
	}
	_captureSlots() {
		if (this._slotsCaptured) return;
		this._slotsCaptured = true;
		const captured = monoHostChildNodes(this);
		const capturedSlotNodes = /* @__PURE__ */ new Set();
		for (const node of captured) {
			if (!(node instanceof Element)) continue;
			const slotName = node.getAttribute("slot");
			if (!slotName || !slotName.startsWith("icon-")) continue;
			const id = slotName.slice(5);
			if (!id) continue;
			node.removeAttribute("slot");
			const list = this._slotIcons.get(id) ?? [];
			list.push(node);
			this._slotIcons.set(id, list);
			capturedSlotNodes.add(node);
		}
		for (const node of capturedSlotNodes) if (node.parentNode === this) this.removeChild(node);
	}
	_placeIconSlots() {
		if (!this._slotIcons.size) return;
		for (const [id, nodes] of this._slotIcons) {
			const target = this.querySelector(`[data-mono-slot="icon-${id}"]`);
			if (!target) continue;
			for (const node of nodes) placeSlotNode(target, node);
		}
	}
};
__decorate([state()], MonoTabs.prototype, "_slotsCaptured", void 0);
MonoTabs = __decorate([customElement("mono-tabs")], MonoTabs);

//#endregion
export { MonoTabs };