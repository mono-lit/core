import { g as monoHostChildNodes } from "../mono-ui-kvLVIf1V.js";
import { t as customElement } from "../mono-element-CKcT0rwv.js";
import { t as __decorate } from "../decorate-DbYFpi8R.js";
import { i as guardHostTextContent, s as placeSlotNode } from "../light-slots-B5Ck0t_E.js";
import { t as MonoDropdownCore } from "../dropdown-core-BCH1pK14.js";
import { LitElement, html, nothing } from "lit";
import { state } from "lit/decorators.js";

//#region src/components/dropdown/mono-dropdown.ts
let MonoDropdown = class MonoDropdown extends MonoDropdownCore(LitElement) {
	constructor(..._args) {
		super(..._args);
		this._hasBodySlotState = false;
		this._slotsCaptured = false;
		this._slotMain = [];
		this._slotBody = [];
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
		this._placeSlot("main", this._slotMain);
		this._placeSlot("body", this._slotBody);
		super.updated(changed);
	}
	_activeMainNodes() {
		return this._slotMain.filter((n) => n instanceof HTMLElement);
	}
	_captureSlots() {
		if (this._slotsCaptured) return;
		this._slotsCaptured = true;
		const captured = monoHostChildNodes(this);
		const capturedSlotNodes = /* @__PURE__ */ new Set();
		let unslottedSeen = false;
		for (const node of captured) {
			if (!(node instanceof Element)) {
				if (node.nodeType === Node.TEXT_NODE && node.textContent?.trim()) unslottedSeen = true;
				continue;
			}
			const slotName = node.getAttribute("slot");
			if (slotName === "main") {
				node.removeAttribute("slot");
				this._slotMain.push(node);
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
		this._hasBodySlotState = unslottedSeen && this._slotBody.length > 0;
		for (const node of capturedSlotNodes) if (node.parentNode === this) this.removeChild(node);
		guardHostTextContent(this, /* @__PURE__ */ new Map([["main", this._slotMain], ["body", this._slotBody]]), {
			fallback: "body",
			onWrite: () => {
				this._hasBodySlotState = this._slotBody.length > 0;
				this.requestUpdate();
			}
		});
	}
	_placeSlot(name, nodes) {
		if (!nodes.length) return;
		const sel = `[data-mono-slot="${name}"]`;
		const target = this.querySelector(sel) ?? this._popup.panelRoot.querySelector(sel);
		if (!target) return;
		for (const node of nodes) placeSlotNode(target, node);
	}
	_renderBody() {
		if (!this._hasBodySlotState) return nothing;
		return html`<div class=${this._cls("mono-dropdown-body", "body")} mono-body data-mono-slot="body"></div>`;
	}
	render() {
		return html`
      <span class=${this._cls("mono-dropdown-main", "main")} mono-activator data-mono-slot="main"></span>
      <div
        class=${this._cls("mono-dropdown-panel", "panel")}
        mono-panel
        role="dialog"
        aria-hidden=${this.modelValue ? "false" : "true"}
      >
        ${this._renderBody()}
      </div>
    `;
	}
};
__decorate([state()], MonoDropdown.prototype, "_hasBodySlotState", void 0);
MonoDropdown = __decorate([customElement("mono-dropdown")], MonoDropdown);

//#endregion
export { MonoDropdown };