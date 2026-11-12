import { g as monoHostChildNodes } from "../mono-ui-kvLVIf1V.js";
import { t as customElement } from "../mono-element-CKcT0rwv.js";
import { t as __decorate } from "../decorate-DbYFpi8R.js";
import { a as parkDetachedNodes, i as guardHostTextContent, s as placeSlotNode } from "../light-slots-B5Ck0t_E.js";
import { t as MonoDrawerCore } from "../drawer-core-DbFWvNln.js";
import { LitElement } from "lit";

//#region src/components/drawer/mono-drawer.ts
let MonoDrawer = class MonoDrawer extends MonoDrawerCore(LitElement) {
	constructor(..._args) {
		super(..._args);
		this._portal = null;
		this._appliedPortalClasses = /* @__PURE__ */ new Set();
		this._slotHeader = [];
		this._slotTitle = [];
		this._slotSubtitle = [];
		this._slotBody = [];
		this._slotFooter = [];
	}
	createRenderRoot() {
		if (this._portal) return this._portal;
		if (typeof document === "undefined") return this;
		const portal = document.createElement("div");
		portal.setAttribute("data-mono-drawer-portal", "");
		const initialClasses = this._computeDrawerClasses();
		portal.className = initialClasses.join(" ");
		this._appliedPortalClasses = new Set(initialClasses);
		this._portal = portal;
		document.body.appendChild(portal);
		return portal;
	}
	connectedCallback() {
		super.connectedCallback();
		if (this._portal && !this._portal.isConnected && typeof document !== "undefined") document.body.appendChild(this._portal);
		this._captureSlots();
		this._updatePortalClasses();
		this._updatePortalAttributes();
		if (this.isConnected) this.performUpdate();
	}
	disconnectedCallback() {
		if (this._portal && this._portal.parentNode) this._portal.parentNode.removeChild(this._portal);
		super.disconnectedCallback();
	}
	updated(changed) {
		super.updated(changed);
		this._updatePortalClasses();
		this._updatePortalAttributes();
		this._placeSlot("header", this._slotHeader);
		this._placeSlot("title", this._slotTitle);
		this._placeSlot("subtitle", this._slotSubtitle);
		this._placeSlot("body", this._slotBody);
		this._placeSlot("footer", this._slotFooter);
		this._orphanHolder = parkDetachedNodes(this._orphanHolder, [...this._slotTitle, ...this._slotSubtitle]);
	}
	/** Light build: the size-vars live on the portal (the `.mono-drawer` root). */
	_setDrawerSizeVar(name, value) {
		this._portal?.style.setProperty(name, value);
	}
	_removeDrawerSizeVar(name) {
		this._portal?.style.removeProperty(name);
	}
	_updatePortalClasses() {
		if (!this._portal) return;
		const next = new Set(this._computeDrawerClasses());
		for (const cls of this._appliedPortalClasses) if (!next.has(cls)) this._portal.classList.remove(cls);
		for (const cls of next) if (!this._appliedPortalClasses.has(cls)) this._portal.classList.add(cls);
		this._appliedPortalClasses = next;
	}
	_updatePortalAttributes() {
		if (!this._portal) return;
		this._portal.style.setProperty("--mono-drawer-z", String(this._effectiveZ));
		for (let i = 0; i < this.style.length; i++) {
			const prop = this.style.item(i);
			if (prop.startsWith("--mono-drawer-")) this._portal.style.setProperty(prop, this.style.getPropertyValue(prop));
		}
		this._applyRootAttrs(this._portal);
		this._portal.setAttribute("role", "dialog");
		this._portal.setAttribute("title", "");
		const aria = this._headingAria();
		for (const [attr, value] of [["aria-labelledby", aria.labelledby], ["aria-describedby", aria.describedby]]) if (value) this._portal.setAttribute(attr, value);
		else this._portal.removeAttribute(attr);
		this._portal.setAttribute("aria-modal", this.overlay ? "true" : "false");
		this._portal.setAttribute("aria-hidden", this.modelValue ? "false" : "true");
		if (!this._portal.hasAttribute("tabindex")) this._portal.setAttribute("tabindex", "-1");
	}
	render() {
		return this._renderDrawerBody();
	}
	_captureSlots() {
		if (this._slotsCaptured) return;
		this._slotsCaptured = true;
		const captured = monoHostChildNodes(this);
		const capturedSlotNodes = /* @__PURE__ */ new Set();
		let unslottedSeen = false;
		for (const node of captured) {
			if (!(node instanceof Element)) {
				if (node.nodeType === Node.TEXT_NODE && node.textContent?.trim()) {
					this._slotBody.push(node);
					capturedSlotNodes.add(node);
					unslottedSeen = true;
				}
				continue;
			}
			const slotName = node.getAttribute("slot");
			if (slotName === "header" || slotName === "title" || slotName === "subtitle") {
				node.removeAttribute("slot");
				(slotName === "header" ? this._slotHeader : slotName === "title" ? this._slotTitle : this._slotSubtitle).push(node);
				capturedSlotNodes.add(node);
				continue;
			}
			if (slotName === "footer" || slotName === "foot") {
				node.removeAttribute("slot");
				this._slotFooter.push(node);
				capturedSlotNodes.add(node);
				continue;
			}
			if (slotName === "body" || slotName === null) {
				if (slotName === "body") node.removeAttribute("slot");
				this._slotBody.push(node);
				capturedSlotNodes.add(node);
				unslottedSeen = true;
				continue;
			}
		}
		this._hasHeaderSlotState = this._slotHeader.length > 0;
		this._hasTitleSlotState = this._slotTitle.length > 0;
		this._hasSubtitleSlotState = this._slotSubtitle.length > 0;
		this._hasFooterSlotState = this._slotFooter.length > 0;
		this._hasBodySlotState = unslottedSeen && this._slotBody.length > 0;
		for (const node of capturedSlotNodes) if (node.parentNode === this) this.removeChild(node);
		guardHostTextContent(this, /* @__PURE__ */ new Map([
			["header", this._slotHeader],
			["title", this._slotTitle],
			["subtitle", this._slotSubtitle],
			["body", this._slotBody],
			["footer", this._slotFooter]
		]), {
			fallback: "body",
			onWrite: () => {
				this._hasBodySlotState = this._slotBody.length > 0;
				this.requestUpdate();
			}
		});
	}
	_placeSlot(name, nodes) {
		if (!nodes.length || !this._portal) return;
		const target = this._portal.querySelector(`[data-mono-slot="${name}"]`);
		if (!target) return;
		for (const node of nodes) placeSlotNode(target, node);
	}
};
MonoDrawer = __decorate([customElement("mono-drawer")], MonoDrawer);

//#endregion
export { MonoDrawer };