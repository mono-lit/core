import { t as customElement } from "../mono-element-CKcT0rwv.js";
import { a as defineHybridPropAliases, i as defineHybridPropAlias, r as booleanStringConverter, t as __decorate } from "../decorate-DbYFpi8R.js";
import { t as isIconifyClass } from "../icon-ClxnYhBG.js";
import { a as parkDetachedNodes, n as bucketHasContent, o as placeLightSlots, r as captureLightSlots } from "../light-slots-B5Ck0t_E.js";
import { a as closeIcon } from "../field-icons-t8rXRCKs.js";
import { LitElement, html, nothing } from "lit";
import { property, state } from "lit/decorators.js";

//#region src/components/alert/alert-core.ts
/**
* `MonoAlertCore` — everything both builds share: props (with the `closeable`
* alias), the ✕ that hides the alert, and the root template. The regions are
* one overridable hook, `_renderMain()`: the light build fills `[data-mono-slot]`
* placeholders, the shadow build uses native `<slot>`s.
*
* The alert emits NO events of its own. `@click` on it is the browser's click;
* the ✕ only hides the element (the native `hidden` attribute), and stops its
* own click so a listener on the alert does not fire for it.
*
* SSR-safe: no `document`/`window` access.
*/
const MonoAlertCore = (superClass) => {
	class MonoAlertCoreClass extends superClass {
		constructor(...args) {
			super(...args);
			this._hasIconSlot = false;
			this._hasTitleSlot = false;
			this._hasSubtitleSlot = false;
			this._hasBodySlot = false;
			this._clear = (event) => {
				event.stopPropagation();
				this.hidden = true;
			};
			defineHybridPropAliases(this, ["clearLabel", "cssClass"]);
			defineHybridPropAlias(this, "closeable", "clearable");
			this.title = "";
			this.subtitle = "";
			this.icon = "";
			this.color = "neutral";
			this.variant = "outline";
			this.size = "md";
			this.clearable = false;
			this.clearLabel = "Close";
			this.cssClass = {};
		}
		static get observedAttributes() {
			return [
				...super.observedAttributes ?? [],
				"closeable",
				"clearlabel",
				"cssclass"
			];
		}
		attributeChangedCallback(name, oldValue, newValue) {
			super.attributeChangedCallback(name, oldValue, newValue);
			if (oldValue === newValue) return;
			if (name === "closeable") {
				this.clearable = booleanStringConverter.fromAttribute(newValue);
				return;
			}
			if (name === "clearlabel") this.clearLabel = newValue ?? "Close";
		}
		_cls(base, key) {
			const extra = this.cssClass?.[key];
			return extra ? `${base} ${extra}` : base;
		}
		get _showsIcon() {
			return !this._hasBodySlot && (this._hasIconSlot || Boolean(this.icon));
		}
		get _showsTitle() {
			return !this._hasBodySlot && (this._hasTitleSlot || Boolean(this.title));
		}
		get _showsSubtitle() {
			return !this._hasBodySlot && (this._hasSubtitleSlot || Boolean(this.subtitle));
		}
		/**
		* The `icon` prop: an iconify class becomes an empty masked span, anything
		* else is text. The shadow build overrides this with inline SVG (a page
		* utility class cannot reach inside a shadow root).
		*/
		_renderIconGlyph() {
			if (!this.icon) return nothing;
			if (isIconifyClass(this.icon)) return html`<span class=${`mono-alert-iconify ${this.icon}`} mono-glyph></span>`;
			return html`${this.icon}`;
		}
		/** The regions — each build renders its own slot strategy here. */
		_renderMain() {
			return nothing;
		}
		_renderClear() {
			if (!this.clearable) return nothing;
			return html`<button
        type="button"
        class=${this._cls("mono-alert-clear", "clear")}
        mono-clear
        aria-label=${this.clearLabel}
        @click=${this._clear}
      >${closeIcon()}</button>`;
		}
		render() {
			return html`<div
        class=${this._cls("mono-alert", "root")}
        mono-alert
        mono-size=${this.size && this.size !== "md" ? this.size : nothing}
        mono-variant=${this.variant && this.variant !== "outline" ? this.variant : nothing}
        mono-color=${this.color && this.color !== "neutral" ? this.color : nothing}
        ?mono-clearable=${this.clearable}
        role="alert"
        title=""
      >${this._renderMain()}${this._renderClear()}</div>`;
		}
	}
	__decorate([property({ type: String })], MonoAlertCoreClass.prototype, "title", void 0);
	__decorate([property({ type: String })], MonoAlertCoreClass.prototype, "subtitle", void 0);
	__decorate([property({ type: String })], MonoAlertCoreClass.prototype, "icon", void 0);
	__decorate([property({ type: String })], MonoAlertCoreClass.prototype, "color", void 0);
	__decorate([property({ type: String })], MonoAlertCoreClass.prototype, "variant", void 0);
	__decorate([property({ type: String })], MonoAlertCoreClass.prototype, "size", void 0);
	__decorate([property({
		reflect: true,
		converter: booleanStringConverter
	})], MonoAlertCoreClass.prototype, "clearable", void 0);
	__decorate([property({
		type: String,
		attribute: "clear-label"
	})], MonoAlertCoreClass.prototype, "clearLabel", void 0);
	__decorate([property({ attribute: false })], MonoAlertCoreClass.prototype, "cssClass", void 0);
	__decorate([state()], MonoAlertCoreClass.prototype, "_hasIconSlot", void 0);
	__decorate([state()], MonoAlertCoreClass.prototype, "_hasTitleSlot", void 0);
	__decorate([state()], MonoAlertCoreClass.prototype, "_hasSubtitleSlot", void 0);
	__decorate([state()], MonoAlertCoreClass.prototype, "_hasBodySlot", void 0);
	return MonoAlertCoreClass;
};

//#endregion
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