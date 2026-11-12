import { g as monoHostChildNodes } from "../mono-ui-kvLVIf1V.js";
import { t as monoDataDropdown } from "../mono-data-dropdown-Bgj2PDfm.js";
import { t as customElement } from "../mono-element-CKcT0rwv.js";
import { t as __decorate } from "../decorate-DbYFpi8R.js";
import { i as guardHostTextContent, s as placeSlotNode } from "../light-slots-B5Ck0t_E.js";
import { t as MonoDropdownTableCore } from "../dropdown-table-core-SfHUJVFq.js";
import { LitElement } from "lit";

//#region src/components/dropdown-table/mono-dropdown-table.ts
let MonoDropdownTable = class MonoDropdownTable extends MonoDropdownTableCore(LitElement) {
	constructor(..._args) {
		super(..._args);
		this._slotsCaptured = false;
		this._slotSearch = [];
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
		this._placeSlot("search", this._slotSearch);
		this._placeSlot("body", this._slotBody);
		this._placeSlot("footer", this._slotFooter);
		super.updated(changed);
	}
	_captureSlots() {
		if (this._slotsCaptured) return;
		this._slotsCaptured = true;
		const captured = monoHostChildNodes(this);
		const taken = /* @__PURE__ */ new Set();
		for (const node of captured) {
			if (!(node instanceof Element)) continue;
			const slotName = node.getAttribute("slot");
			if (slotName === "search") {
				node.removeAttribute("slot");
				this._slotSearch.push(node);
			} else if (slotName === "footer") {
				node.removeAttribute("slot");
				this._slotFooter.push(node);
			} else this._slotBody.push(node);
			taken.add(node);
		}
		for (const node of taken) if (node.parentNode === this) this.removeChild(node);
		guardHostTextContent(this, /* @__PURE__ */ new Map([
			["search", this._slotSearch],
			["body", this._slotBody],
			["footer", this._slotFooter]
		]), {
			fallback: "body",
			onWrite: () => this.requestUpdate()
		});
	}
	_placeSlot(name, nodes) {
		if (!nodes.length) return;
		const sel = `[data-mono-slot="${name}"]`;
		const target = this.querySelector(sel) ?? this._popup.panelRoot?.querySelector?.(sel);
		if (!target) return;
		for (const node of nodes) placeSlotNode(target, node);
	}
};
MonoDropdownTable = __decorate([customElement("mono-dropdown-table")], MonoDropdownTable);

//#endregion
export { MonoDropdownTable, monoDataDropdown as controlMonoDataDropdown, monoDataDropdown };