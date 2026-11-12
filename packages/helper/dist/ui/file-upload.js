import { g as monoHostChildNodes } from "../mono-ui-kvLVIf1V.js";
import { t as customElement } from "../mono-element-CKcT0rwv.js";
import { t as __decorate } from "../decorate-DbYFpi8R.js";
import { a as parkDetachedNodes, s as placeSlotNode } from "../light-slots-B5Ck0t_E.js";
import { a as validateFileUploadProps, i as getFileIcon, n as createUploadItem, r as formatFileSize, t as MonoFileUploadCore } from "../file-upload-core-Cz_dBQMx.js";
import { LitElement } from "lit";

//#region src/components/file-upload/mono-file-upload.ts
/** Named slots the light build captures: the dropzone icon and its two text lines. */
const FILE_UPLOAD_LIGHT_SLOTS = [
	"icon",
	"title",
	"subtitle"
];
let MonoFileUpload = class MonoFileUpload extends MonoFileUploadCore(LitElement) {
	constructor(..._args) {
		super(..._args);
		this._slotsCaptured = false;
		this._slots = {
			icon: [],
			title: [],
			subtitle: []
		};
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
		super.updated?.(changed);
		for (const name of FILE_UPLOAD_LIGHT_SLOTS) {
			this._placeSlot(name, this._slots[name]);
			this._parked = parkDetachedNodes(this._parked, this._slots[name]);
		}
	}
	/** Move light-DOM `slot="icon|title|subtitle"` children out for placement into their regions. */
	_captureSlots() {
		if (this._slotsCaptured) return;
		this._slotsCaptured = true;
		for (const node of monoHostChildNodes(this)) {
			if (!(node instanceof Element)) continue;
			const name = node.getAttribute("slot");
			if (name && FILE_UPLOAD_LIGHT_SLOTS.includes(name)) {
				node.removeAttribute("slot");
				this._slots[name].push(node);
			}
		}
		this._hasIconSlot = this._slots.icon.length > 0;
		this._hasTitleSlot = this._slots.title.length > 0;
		this._hasSubtitleSlot = this._slots.subtitle.length > 0;
		for (const name of FILE_UPLOAD_LIGHT_SLOTS) for (const node of this._slots[name]) if (node.parentNode === this) this.removeChild(node);
	}
	_placeSlot(name, nodes) {
		if (!nodes.length) return;
		const target = this.querySelector(`[data-mono-slot="${name}"]`);
		if (!target) return;
		for (const node of nodes) placeSlotNode(target, node);
	}
};
MonoFileUpload = __decorate([customElement("mono-file-upload")], MonoFileUpload);

//#endregion
export { MonoFileUpload, createUploadItem, formatFileSize, getFileIcon, validateFileUploadProps };