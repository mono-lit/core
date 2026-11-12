import { a as defineHybridPropAliases, i as defineHybridPropAlias, r as booleanStringConverter, t as __decorate } from "./decorate-DbYFpi8R.js";
import { t as isIconifyClass } from "./icon-BM9N-jOt.js";
import { a as closeIcon } from "./field-icons-t8rXRCKs.js";
import { html, nothing } from "lit";
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
export { MonoAlertCore as t };