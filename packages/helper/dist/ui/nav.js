import { g as monoHostChildNodes } from "../mono-ui-kvLVIf1V.js";
import { t as customElement } from "../mono-element-CKcT0rwv.js";
import { t as __decorate } from "../decorate-DbYFpi8R.js";
import { i as guardHostTextContent, s as placeSlotNode } from "../light-slots-B5Ck0t_E.js";
import { i as validateNavProps, n as generateNavRootClasses, r as getNavHeight, t as MonoNavCore } from "../nav-core-B5qU2dzn.js";
import { LitElement } from "lit";
import { state } from "lit/decorators.js";

//#region src/components/nav/mono-nav.ts
let MonoNav = class MonoNav extends MonoNavCore(LitElement) {
	constructor(..._args) {
		super(..._args);
		this._slotsCaptured = false;
		this._slotNodes = /* @__PURE__ */ new Map();
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
		this._placeSlots();
	}
	/**
	* Pull every direct child into one of four buckets:
	*  - `slot="start"`  → start
	*  - `slot="end"`    → end
	*  - `slot="extension"` → extension
	*  - everything else (no slot attr) → default (center)
	*
	* Captured nodes are removed from the host root and re-inserted into the
	* matching `[data-mono-slot]` target during `updated()`.
	*/
	_captureSlots() {
		if (this._slotsCaptured) return;
		this._slotsCaptured = true;
		const captured = monoHostChildNodes(this);
		const toRemove = /* @__PURE__ */ new Set();
		for (const node of captured) {
			let slotName = "default";
			if (node instanceof Element) {
				const explicit = node.getAttribute("slot");
				if (explicit === "start" || explicit === "end" || explicit === "extension") {
					slotName = explicit;
					node.removeAttribute("slot");
				}
			} else if (node.nodeType === Node.TEXT_NODE) {
				if (!(node.textContent ?? "").trim()) continue;
			} else if (node.nodeType === Node.COMMENT_NODE) continue;
			const list = this._slotNodes.get(slotName) ?? [];
			list.push(node);
			this._slotNodes.set(slotName, list);
			toRemove.add(node);
		}
		for (const node of toRemove) if (node.parentNode === this) this.removeChild(node);
		guardHostTextContent(this, this._slotNodes, { onWrite: () => this.requestUpdate() });
	}
	_placeSlots() {
		if (!this._slotNodes.size) return;
		for (const [slotName, nodes] of this._slotNodes) {
			const target = this.querySelector(`[data-mono-slot="${slotName}"]`);
			if (!target) continue;
			for (const node of nodes) placeSlotNode(target, node);
		}
	}
};
__decorate([state()], MonoNav.prototype, "_slotsCaptured", void 0);
MonoNav = __decorate([customElement("mono-nav")], MonoNav);

//#endregion
export { MonoNav, generateNavRootClasses, getNavHeight, validateNavProps };