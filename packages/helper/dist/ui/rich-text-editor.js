import { g as monoHostChildNodes } from "../mono-ui-kvLVIf1V.js";
import { t as customElement } from "../mono-element-CKcT0rwv.js";
import { t as __decorate } from "../decorate-DbYFpi8R.js";
import { s as placeSlotNode } from "../light-slots-B5Ck0t_E.js";
import { a as TOOLBAR_DEFAULT, c as TOOLBAR_STANDARD, d as resolveToolbar, f as SUNEDITOR_LANG_CODES, g as loadSunEditorPlugins, h as loadSunEditorLang, i as TOOLBAR_BASIC, l as pruneToolbar, m as loadSunEditorCss, n as AUTO_EXCLUDED_PLUGINS, o as TOOLBAR_FULL, p as loadSunEditor, r as SUNEDITOR_CORE_BUTTONS, s as TOOLBAR_PRESETS, t as MonoRichTextEditorCore, u as resolvePlugins } from "../rich-text-editor-core-Ddd_QaLn.js";
import { LitElement } from "lit";

//#region src/components/rich-text-editor/mono-rich-text-editor.ts
let MonoRichTextEditor = class MonoRichTextEditor extends MonoRichTextEditorCore(LitElement) {
	constructor(..._args) {
		super(..._args);
		this._slotsCaptured = false;
		this._slotLabel = [];
		this._slotHelper = [];
	}
	createRenderRoot() {
		return this;
	}
	connectedCallback() {
		this._captureSlots();
		super.connectedCallback();
		if (this.isConnected) this.performUpdate();
	}
	updated(changed) {
		super.updated(changed);
		this._placeSlot("label", this._slotLabel);
		this._placeSlot("helper", this._slotHelper);
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
		}
		this._hasLabelSlotState = this._slotLabel.length > 0;
		this._hasHelperSlotState = this._slotHelper.length > 0;
		for (const node of capturedSlotNodes) if (node.parentNode === this) this.removeChild(node);
	}
	_placeSlot(name, nodes) {
		if (!nodes.length) return;
		const target = this.querySelector(`[data-mono-slot="${name}"]`);
		if (!target) return;
		for (const node of nodes) placeSlotNode(target, node);
	}
};
MonoRichTextEditor = __decorate([customElement("mono-rich-text-editor")], MonoRichTextEditor);

//#endregion
export { AUTO_EXCLUDED_PLUGINS, MonoRichTextEditor, SUNEDITOR_CORE_BUTTONS, SUNEDITOR_LANG_CODES, TOOLBAR_BASIC, TOOLBAR_DEFAULT, TOOLBAR_FULL, TOOLBAR_PRESETS, TOOLBAR_STANDARD, loadSunEditor, loadSunEditorCss, loadSunEditorLang, loadSunEditorPlugins, pruneToolbar, resolvePlugins, resolveToolbar };