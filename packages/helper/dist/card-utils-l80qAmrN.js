import { d as buildSizeStyle } from "./mono-ui-kvLVIf1V.js";
import { a as defineHybridPropAliases, i as defineHybridPropAlias, r as booleanStringConverter, t as __decorate } from "./decorate-DbYFpi8R.js";
import { t as dispatchMonoEvent } from "./mono-event-CAZf0F_k.js";
import { property, query, state } from "lit/decorators.js";

//#region src/components/card/card-core.ts
/**
* `MonoCardCore` — all render-mode-agnostic logic for `mono-card`: reactive
* props, hybrid aliases, the camelCase attribute fallbacks, slot-presence
* `@state`, class/getter computation, click/keyboard interactivity, and the
* imperative `focus/blur/click`. No `render()` — the light build keeps its
* `[data-mono-slot]` capture strategy and the shadow build uses native `<slot>`
* (each ships its own `render()`, mirroring `mono-input`).
*
* SSR-safe: no `document`/`window` access. `_cardElement` (`@query`) is lazy and
* `focus/blur/click` + the `HTMLAnchorElement` check only run client-side.
*/
const MonoCardCore = (superClass) => {
	class MonoCardCoreClass extends superClass {
		constructor(...args) {
			super(...args);
			this._hasMedia = false;
			this._hasIcon = false;
			this._hasTitle = false;
			this._hasSubtitle = false;
			this._hasHeaderSlot = false;
			this._hasActions = false;
			this._hasFooter = false;
			this._hasDefault = false;
			defineHybridPropAliases(this, [
				"mediaPosition",
				"headerDivider",
				"footerDivider",
				"ariaLabelText",
				"cssClass",
				"minWidth",
				"maxWidth",
				"minHeight",
				"maxHeight"
			]);
			defineHybridPropAlias(this, "heading", "title");
			defineHybridPropAlias(this, "subheading", "subtitle");
			this.size = "md";
			this.variant = "elevated";
			this.color = "neutral";
			this.mediaPosition = "top";
			this.title = "";
			this.subtitle = "";
			this.bordered = false;
			this.hoverable = false;
			this.clickable = false;
			this.selected = false;
			this.disabled = false;
			this.loading = false;
			this.headerDivider = true;
			this.footerDivider = true;
			this.href = void 0;
			this.target = void 0;
			this.ariaLabelText = void 0;
			this.cssClass = {};
		}
		/**
		* Static camelCase HTML fallback.
		*
		* Browser converts:
		* mediaPosition -> mediaposition
		* headerDivider -> headerdivider
		* footerDivider -> footerdivider
		* ariaLabelText -> arialabeltext
		*/
		static get observedAttributes() {
			return [
				...super.observedAttributes ?? [],
				"mediaposition",
				"headerdivider",
				"footerdivider",
				"arialabeltext",
				"arialabel",
				"heading",
				"subheading"
			];
		}
		attributeChangedCallback(name, oldValue, newValue) {
			super.attributeChangedCallback(name, oldValue, newValue);
			if (oldValue === newValue) return;
			if (name === "mediaposition") {
				this.mediaPosition = newValue ?? "top";
				return;
			}
			if (name === "headerdivider") {
				this.headerDivider = this._toBoolean(newValue);
				return;
			}
			if (name === "footerdivider") {
				this.footerDivider = this._toBoolean(newValue);
				return;
			}
			if (name === "arialabeltext" || name === "arialabel") {
				this.ariaLabelText = newValue ?? void 0;
				return;
			}
			if (name === "heading") {
				this.title = newValue ?? "";
				return;
			}
			if (name === "subheading") this.subtitle = newValue ?? "";
		}
		_cls(base, key) {
			const extra = this.cssClass?.[key];
			return extra ? `${base} ${extra}` : base;
		}
		/** Inline sizing applied to the card root. */
		_sizeStyle() {
			return buildSizeStyle(this);
		}
		_toBoolean(value) {
			if (typeof value === "boolean") return value;
			if (typeof value === "string") {
				const normalized = value.toLowerCase().trim();
				return normalized === "" || normalized === "true";
			}
			return Boolean(value);
		}
		get _isInteractive() {
			return Boolean(this.href) || this.clickable;
		}
		get _isDisabled() {
			return this.disabled || this.loading;
		}
		get _hasHeader() {
			return Boolean(this._hasIcon || this._hasTitle || this._hasSubtitle || this._hasHeaderSlot || this.title || this.subtitle);
		}
		/**
		* The header shows a title with NO subtitle under it — drives `mono-no-subtitle`,
		* which centres the icon chip and that lone title on one axis. With a subtitle
		* the row stays top-aligned (icon level with the first line); a `slot="header"`
		* owns its own layout, so it never counts.
		*/
		get _noSubtitle() {
			return !this._hasHeaderSlot && !this._hasSubtitle && !this.subtitle;
		}
		get _cardClasses() {
			const classes = ["mono-card"];
			classes.push(this.size);
			classes.push(this.variant);
			classes.push(this.color);
			if (this.rounded) classes.push(`rounded-${this.rounded}`);
			if (this.bordered) classes.push("bordered");
			if (this.hoverable) classes.push("hoverable");
			if (this.clickable || this.href) classes.push("clickable");
			if (this.selected) classes.push("selected");
			if (this.disabled) classes.push("disabled");
			if (this.loading) classes.push("loading");
			if (!this.headerDivider) classes.push("no-header-divider");
			if (!this.footerDivider) classes.push("no-footer-divider");
			if (this._hasMedia) classes.push(`media-${this.mediaPosition}`);
			if (this.cssClass?.root) classes.push(this.cssClass.root);
			return classes.join(" ");
		}
		_emitClick(originalEvent) {
			const detail = { originalEvent };
			dispatchMonoEvent(this, "click", detail, { sourceEvent: originalEvent });
		}
		_handleClick(event) {
			if (this._isDisabled) {
				event.preventDefault();
				event.stopPropagation();
				return;
			}
			if (!this._isInteractive) return;
			this._emitClick(event);
		}
		_handleKeyDown(event) {
			if (this._isDisabled || !this._isInteractive) return;
			if (event.key === "Enter" || event.key === " ") {
				event.preventDefault();
				if (this._cardElement) {
					this._cardElement.click();
					return;
				}
				this._emitClick(event);
			}
		}
		focus() {
			this._cardElement?.focus();
		}
		blur() {
			this._cardElement?.blur();
		}
		click() {
			this._cardElement?.click();
		}
	}
	__decorate([property({ type: String })], MonoCardCoreClass.prototype, "size", void 0);
	__decorate([property({ type: String })], MonoCardCoreClass.prototype, "variant", void 0);
	__decorate([property({ type: String })], MonoCardCoreClass.prototype, "color", void 0);
	__decorate([property({ type: String })], MonoCardCoreClass.prototype, "rounded", void 0);
	__decorate([property({
		type: String,
		attribute: "media-position"
	})], MonoCardCoreClass.prototype, "mediaPosition", void 0);
	__decorate([property({ type: String })], MonoCardCoreClass.prototype, "title", void 0);
	__decorate([property({ type: String })], MonoCardCoreClass.prototype, "subtitle", void 0);
	__decorate([property({
		reflect: true,
		converter: booleanStringConverter
	})], MonoCardCoreClass.prototype, "bordered", void 0);
	__decorate([property({
		reflect: true,
		converter: booleanStringConverter
	})], MonoCardCoreClass.prototype, "hoverable", void 0);
	__decorate([property({
		reflect: true,
		converter: booleanStringConverter
	})], MonoCardCoreClass.prototype, "clickable", void 0);
	__decorate([property({
		reflect: true,
		converter: booleanStringConverter
	})], MonoCardCoreClass.prototype, "selected", void 0);
	__decorate([property({
		reflect: true,
		converter: booleanStringConverter
	})], MonoCardCoreClass.prototype, "disabled", void 0);
	__decorate([property({
		reflect: true,
		converter: booleanStringConverter
	})], MonoCardCoreClass.prototype, "loading", void 0);
	__decorate([property({ type: String })], MonoCardCoreClass.prototype, "width", void 0);
	__decorate([property({ type: String })], MonoCardCoreClass.prototype, "height", void 0);
	__decorate([property({
		type: String,
		attribute: "min-width"
	})], MonoCardCoreClass.prototype, "minWidth", void 0);
	__decorate([property({
		type: String,
		attribute: "max-width"
	})], MonoCardCoreClass.prototype, "maxWidth", void 0);
	__decorate([property({
		type: String,
		attribute: "min-height"
	})], MonoCardCoreClass.prototype, "minHeight", void 0);
	__decorate([property({
		type: String,
		attribute: "max-height"
	})], MonoCardCoreClass.prototype, "maxHeight", void 0);
	__decorate([property({
		attribute: "header-divider",
		reflect: true,
		converter: booleanStringConverter
	})], MonoCardCoreClass.prototype, "headerDivider", void 0);
	__decorate([property({
		attribute: "footer-divider",
		reflect: true,
		converter: booleanStringConverter
	})], MonoCardCoreClass.prototype, "footerDivider", void 0);
	__decorate([property({ type: String })], MonoCardCoreClass.prototype, "href", void 0);
	__decorate([property({ type: String })], MonoCardCoreClass.prototype, "target", void 0);
	__decorate([property({
		type: String,
		attribute: "aria-label-text"
	})], MonoCardCoreClass.prototype, "ariaLabelText", void 0);
	__decorate([property({ attribute: false })], MonoCardCoreClass.prototype, "cssClass", void 0);
	__decorate([state()], MonoCardCoreClass.prototype, "_hasMedia", void 0);
	__decorate([state()], MonoCardCoreClass.prototype, "_hasIcon", void 0);
	__decorate([state()], MonoCardCoreClass.prototype, "_hasTitle", void 0);
	__decorate([state()], MonoCardCoreClass.prototype, "_hasSubtitle", void 0);
	__decorate([state()], MonoCardCoreClass.prototype, "_hasHeaderSlot", void 0);
	__decorate([state()], MonoCardCoreClass.prototype, "_hasActions", void 0);
	__decorate([state()], MonoCardCoreClass.prototype, "_hasFooter", void 0);
	__decorate([state()], MonoCardCoreClass.prototype, "_hasDefault", void 0);
	__decorate([query(".mono-card")], MonoCardCoreClass.prototype, "_cardElement", void 0);
	return MonoCardCoreClass;
};

//#endregion
//#region src/components/card/card-utils.ts
/**
* Validate card props
*/
function validateCardProps(props) {
	const validVariants = [
		"outlined",
		"elevated",
		"flat",
		"tonal"
	];
	const validColors = [
		"primary",
		"secondary",
		"success",
		"danger",
		"warning",
		"info",
		"neutral"
	];
	if (props.variant && !validVariants.includes(props.variant)) return false;
	if (props.color && !validColors.includes(props.color)) return false;
	return true;
}
/**
* Generate ARIA attributes for accessibility
*/
function generateCardAttributes(clickable, hoverable, label) {
	return {
		"role": clickable ? "button" : "article",
		"tabindex": clickable ? "0" : void 0,
		"aria-label": label || void 0
	};
}

//#endregion
export { validateCardProps as n, MonoCardCore as r, generateCardAttributes as t };