import { t as customElement } from "../mono-element-CKcT0rwv.js";
import { t as __decorate } from "../decorate-DbYFpi8R.js";
import { a as parkDetachedNodes, n as bucketHasContent, o as placeLightSlots, r as captureLightSlots } from "../light-slots-B5Ck0t_E.js";
import { t as MonoAlertCore } from "../alert-core-DWtHbX_-.js";
import { LitElement, html, nothing } from "lit";

//#region src/components/alert/mono-alert.ts
/** Named regions. Unslotted children fall into `body` (the capture fallback). */
const ALERT_NAMED_SLOTS = [
	"icon",
	"title",
	"subtitle",
	"body"
];
let MonoAlert = class MonoAlert extends MonoAlertCore(LitElement) {
	constructor(..._args) {
		super(..._args);
		this._slotsCaptured = false;
		this._buckets = /* @__PURE__ */ new Map();
	}
	createRenderRoot() {
		return this;
	}
	/**
	* The body region is ALWAYS rendered (like the card's): it is also the home
	* of the consumer framework's positional anchors (`<!--v-if-->`), which must
	* keep a live, visible parent — content a `v-if` inserts there later has to
	* show up. It is `mono-empty` while it holds nothing but anchors, and a
	* MutationObserver flips `_hasBodySlot` when real content arrives or leaves.
	*/
	_renderMain() {
		const body = html`<div
      class=${this._cls("mono-alert-body", "body")}
      mono-body
      data-mono-slot="body"
      ?mono-empty=${!this._hasBodySlot}
    ></div>`;
		const icon = this._showsIcon ? html`<span class=${this._cls("mono-alert-icon", "icon")} mono-icon aria-hidden="true"
          >${this._hasIconSlot ? html`<span data-mono-slot="icon"></span>` : this._renderIconGlyph()}</span
        >` : nothing;
		const title = this._showsTitle ? this._hasTitleSlot ? html`<div class=${this._cls("mono-alert-title", "title")} mono-title data-mono-slot="title"></div>` : html`<div class=${this._cls("mono-alert-title", "title")} mono-title>${this.title}</div>` : nothing;
		const subtitle = this._showsSubtitle ? this._hasSubtitleSlot ? html`<div class=${this._cls("mono-alert-subtitle", "subtitle")} mono-subtitle data-mono-slot="subtitle"></div>` : html`<div class=${this._cls("mono-alert-subtitle", "subtitle")} mono-subtitle>${this.subtitle}</div>` : nothing;
		return html`${icon}${title}${subtitle}${body}`;
	}
	/** Re-read body presence from the placed region (late `v-if` content). */
	_watchBody() {
		if (this._bodyObserver || typeof MutationObserver === "undefined") return;
		const region = this.querySelector(":scope > [mono-alert] > [data-mono-slot=\"body\"], :scope > phantom-ui > [mono-alert] > [data-mono-slot=\"body\"]");
		if (!region) return;
		this._bodyObserver = new MutationObserver(() => {
			const has = bucketHasContent(Array.from(region.childNodes));
			if (has !== this._hasBodySlot) this._hasBodySlot = has;
		});
		this._bodyObserver.observe(region, {
			childList: true,
			characterData: true,
			subtree: true
		});
	}
	disconnectedCallback() {
		super.disconnectedCallback();
		this._bodyObserver?.disconnect();
		this._bodyObserver = void 0;
	}
	connectedCallback() {
		super.connectedCallback();
		this._captureSlots();
		if (this.isConnected) this.performUpdate();
	}
	_captureSlots() {
		if (this._slotsCaptured) return;
		this._slotsCaptured = true;
		this._buckets = captureLightSlots(this, {
			names: ALERT_NAMED_SLOTS,
			fallback: "body"
		});
		this._hasIconSlot = bucketHasContent(this._buckets.get("icon"));
		this._hasTitleSlot = bucketHasContent(this._buckets.get("title"));
		this._hasSubtitleSlot = bucketHasContent(this._buckets.get("subtitle"));
		this._hasBodySlot = bucketHasContent(this._buckets.get("body"));
	}
	updated(changed) {
		super.updated(changed);
		placeLightSlots(this, this._buckets);
		for (const nodes of this._buckets.values()) this._parked = parkDetachedNodes(this._parked, nodes);
		this._watchBody();
	}
};
MonoAlert = __decorate([customElement("mono-alert")], MonoAlert);

//#endregion
export { MonoAlert };