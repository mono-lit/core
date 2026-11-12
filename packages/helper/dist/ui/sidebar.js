import { g as monoHostChildNodes } from "../mono-ui-kvLVIf1V.js";
import { t as customElement } from "../mono-element-CKcT0rwv.js";
import { t as __decorate } from "../decorate-DbYFpi8R.js";
import { i as guardHostTextContent, s as placeSlotNode } from "../light-slots-B5Ck0t_E.js";
import { a as resolveMode, i as isAutoTemporary, n as SIDEBAR_AUTO_BREAKPOINT, o as validateSidebarProps, r as generateSidebarRootClasses, t as MonoSidebarCore } from "../sidebar-core-CD6txDo3.js";
import { LitElement, html } from "lit";

//#region src/components/sidebar/mono-sidebar.ts
let MonoSidebar = class MonoSidebar extends MonoSidebarCore(LitElement) {
	constructor(..._args) {
		super(..._args);
		this._slotsCaptured = false;
		this._slotHeader = [];
		this._slotBody = [];
		this._slotFooter = [];
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
	renderIcon(_name) {
		return html`<span class="mono-icon i-mdi-chevron-right" aria-hidden="true"></span>`;
	}
	_captureSlots() {
		if (this._slotsCaptured) return;
		this._slotsCaptured = true;
		const captured = monoHostChildNodes(this);
		const toRemove = /* @__PURE__ */ new Set();
		for (const node of captured) {
			let bucket = "body";
			if (node instanceof Element) {
				const explicit = node.getAttribute("slot");
				if (explicit === "header" || explicit === "footer") {
					bucket = explicit;
					node.removeAttribute("slot");
				} else if (explicit === "body" || explicit === null) {
					bucket = "body";
					if (explicit === "body") node.removeAttribute("slot");
				}
			} else if (node.nodeType === Node.TEXT_NODE) {
				if (!(node.textContent ?? "").trim()) continue;
			} else if (node.nodeType === Node.COMMENT_NODE) continue;
			if (bucket === "header") this._slotHeader.push(node);
			else if (bucket === "footer") this._slotFooter.push(node);
			else this._slotBody.push(node);
			toRemove.add(node);
		}
		for (const node of toRemove) if (node.parentNode === this) this.removeChild(node);
		guardHostTextContent(this, /* @__PURE__ */ new Map([
			["header", this._slotHeader],
			["body", this._slotBody],
			["footer", this._slotFooter]
		]), {
			fallback: "body",
			onWrite: () => this.requestUpdate()
		});
	}
	_placeSlots() {
		this._placeSlot("header", this._slotHeader);
		this._placeSlot("body", this._slotBody);
		this._placeSlot("footer", this._slotFooter);
	}
	_placeSlot(name, nodes) {
		if (!nodes.length) return;
		const target = this.querySelector(`[data-mono-slot="${name}"]`);
		if (!target) return;
		for (const node of nodes) placeSlotNode(target, node);
	}
};
MonoSidebar = __decorate([customElement("mono-sidebar")], MonoSidebar);

//#endregion
export { MonoSidebar, SIDEBAR_AUTO_BREAKPOINT, generateSidebarRootClasses, isAutoTemporary, resolveMode, validateSidebarProps };