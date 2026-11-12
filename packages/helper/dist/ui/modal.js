import { g as monoHostChildNodes } from "../mono-ui-kvLVIf1V.js";
import { t as monoModal } from "../mono-modal-controller-ClObbHUs.js";
import { t as customElement } from "../mono-element-CKcT0rwv.js";
import { t as __decorate } from "../decorate-DbYFpi8R.js";
import { a as parkDetachedNodes, i as guardHostTextContent, s as placeSlotNode } from "../light-slots-B5Ck0t_E.js";
import "../mono-button-DVvZ03P-.js";
import { t as MonoModalCore } from "../modal-core-CSBSPN_m.js";
import { LitElement } from "lit";

//#region src/components/modal/mono-modal.ts
let MonoModal = class MonoModal extends MonoModalCore(LitElement) {
	constructor(..._args) {
		super(..._args);
		this._portal = null;
		this._appliedPortalClasses = /* @__PURE__ */ new Set();
		this._slotHead = [];
		this._slotTitle = [];
		this._slotSubtitle = [];
		this._slotBody = [];
		this._slotFoot = [];
		this._slotHeaderAlias = [];
		this._slotFooterAlias = [];
	}
	createRenderRoot() {
		if (this._portal) return this._portal;
		if (typeof document === "undefined") return this;
		const portal = document.createElement("div");
		portal.setAttribute("data-mono-modal-portal", "");
		const initialClasses = this._computeModalClasses();
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
		this._placeSlot("head", this._slotHead);
		this._placeSlot("title", this._slotTitle);
		this._placeSlot("subtitle", this._slotSubtitle);
		this._placeSlot("body", this._slotBody);
		this._placeSlot("foot", this._slotFoot);
		this._orphanHolder = parkDetachedNodes(this._orphanHolder, [...this._slotTitle, ...this._slotSubtitle]);
	}
	_updatePortalClasses() {
		if (!this._portal) return;
		const next = new Set(this._computeModalClasses());
		for (const cls of this._appliedPortalClasses) if (!next.has(cls)) this._portal.classList.remove(cls);
		for (const cls of next) if (!this._appliedPortalClasses.has(cls)) this._portal.classList.add(cls);
		this._appliedPortalClasses = next;
	}
	_updatePortalAttributes() {
		if (!this._portal) return;
		this._portal.style.setProperty("--mono-modal-z", String(this._effectiveZ));
		for (let i = 0; i < this.style.length; i++) {
			const prop = this.style.item(i);
			if (prop.startsWith("--mono-modal-")) this._portal.style.setProperty(prop, this.style.getPropertyValue(prop));
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
		return this._renderModalBody();
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
			if (slotName === "head" || slotName === "header") {
				node.removeAttribute("slot");
				(slotName === "header" ? this._slotHeaderAlias : this._slotHead).push(node);
				capturedSlotNodes.add(node);
				continue;
			}
			if (slotName === "title" || slotName === "subtitle") {
				node.removeAttribute("slot");
				(slotName === "title" ? this._slotTitle : this._slotSubtitle).push(node);
				capturedSlotNodes.add(node);
				continue;
			}
			if (slotName === "foot" || slotName === "footer") {
				node.removeAttribute("slot");
				(slotName === "footer" ? this._slotFooterAlias : this._slotFoot).push(node);
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
		if (this._slotHeaderAlias.length) {
			this._orphanHolder = parkDetachedNodes(this._orphanHolder, this._slotHead);
			this._slotHead = this._slotHeaderAlias;
		}
		if (this._slotFooterAlias.length) {
			this._orphanHolder = parkDetachedNodes(this._orphanHolder, this._slotFoot);
			this._slotFoot = this._slotFooterAlias;
		}
		this._hasHeadSlotState = this._slotHead.length > 0;
		this._hasTitleSlotState = this._slotTitle.length > 0;
		this._hasSubtitleSlotState = this._slotSubtitle.length > 0;
		this._hasFootSlotState = this._slotFoot.length > 0;
		this._hasBodySlotState = unslottedSeen && this._slotBody.length > 0;
		for (const node of capturedSlotNodes) if (node.parentNode === this) this.removeChild(node);
		guardHostTextContent(this, /* @__PURE__ */ new Map([
			["head", this._slotHead],
			["title", this._slotTitle],
			["subtitle", this._slotSubtitle],
			["body", this._slotBody],
			["foot", this._slotFoot]
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
MonoModal = __decorate([customElement("mono-modal")], MonoModal);

//#endregion
export { MonoModal, monoModal as controlMonoModal, monoModal };