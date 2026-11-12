import { n as defineMonoElement } from "./mono-element-CKcT0rwv.js";
import { a as defineHybridPropAliases, r as booleanStringConverter, t as __decorate } from "./decorate-DbYFpi8R.js";
import { t as dispatchMonoEvent } from "./mono-event-CAZf0F_k.js";
import { t as chip_css_raw_default } from "./chip.css_raw-ChfRSHLO.js";
import { LitElement, html, nothing, unsafeCSS } from "lit";
import { property, query, state } from "lit/decorators.js";
import { ifDefined } from "lit/directives/if-defined.js";
import { when } from "lit/directives/when.js";

//#region src/components/chip/chip-core.ts
/**
* `MonoChipCore` — all render-mode-agnostic logic for `mono-chip`: reactive
* props, hybrid aliases (incl. the `ariaLabel`/`aria-label`/`arialabel` →
* `ariaLabelText` getters), camelCase attribute fallbacks, the `modelValue`↔
* `selected` sync + SSR boolean coercion in `willUpdate`, class computation,
* click/keyboard/close interactivity (`mno-click`/`mno-close`), and the imperative
* `focus/blur/click`. No `render()` — the light build keeps its `[data-mono-slot]`
* capture strategy and the shadow build uses native `<slot>` (mirrors `mono-button`).
*
* SSR-safe: no `document`/`window` access; `_chipElement` (`@query`) is lazy and
* `focus/blur/click` only run client-side.
*/
const MonoChipCore = (superClass) => {
	class MonoChipCoreClass extends superClass {
		constructor(...args) {
			super(...args);
			this.cssClass = {};
			this._hasIcon = false;
			defineHybridPropAliases(this, [
				"modelValue",
				"iconPosition",
				"ariaLabelText",
				"closeLabel",
				"cssClass"
			]);
			for (const name of [
				"ariaLabel",
				"aria-label",
				"arialabel"
			]) Object.defineProperty(this, name, {
				get: () => this.ariaLabelText,
				set: (value) => {
					this.ariaLabelText = value == null ? void 0 : String(value);
				},
				configurable: true,
				enumerable: false
			});
			this.size = "md";
			this.color = "primary";
			this.variant = "soft";
			this.label = void 0;
			this.dot = false;
			this.removable = false;
			this.clickable = false;
			this.disabled = false;
			this.modelValue = false;
			this.selected = false;
			this.href = void 0;
			this.target = void 0;
			this.iconPosition = "left";
			this.ariaLabelText = void 0;
			this.closeLabel = "Remove";
			this._isActive = false;
		}
		static get observedAttributes() {
			return [
				...super.observedAttributes ?? [],
				"modelvalue",
				"iconposition",
				"closelabel",
				"arialabeltext",
				"arialabel"
			];
		}
		attributeChangedCallback(name, oldValue, newValue) {
			super.attributeChangedCallback(name, oldValue, newValue);
			if (oldValue === newValue) return;
			if (name === "modelvalue") {
				this.modelValue = this._toBoolean(newValue);
				return;
			}
			if (name === "iconposition") {
				this.iconPosition = newValue ?? "left";
				return;
			}
			if (name === "closelabel") {
				this.closeLabel = newValue ?? "Remove";
				return;
			}
			if (name === "arialabeltext" || name === "arialabel") this.ariaLabelText = newValue ?? void 0;
		}
		willUpdate(changed) {
			for (const key of [
				"dot",
				"removable",
				"clickable",
				"disabled",
				"modelValue",
				"selected"
			]) if (typeof this[key] === "string") this[key] = this._toBoolean(this[key]);
			if (!this.hasUpdated) {
				const on = this.selected || this.modelValue;
				if (this.selected !== on) this.selected = on;
				if (this.modelValue !== on) this.modelValue = on;
			} else {
				if (changed.has("modelValue") && this.selected !== this.modelValue) this.selected = this.modelValue;
				if (changed.has("selected") && this.modelValue !== this.selected) this.modelValue = this.selected;
			}
			super.willUpdate?.(changed);
		}
		_toBoolean(value) {
			if (typeof value === "boolean") return value;
			if (typeof value === "string") {
				const normalized = value.toLowerCase().trim();
				return normalized === "" || normalized === "true";
			}
			return Boolean(value);
		}
		_cls(base, key) {
			const extra = this.cssClass?.[key];
			return extra ? `${base} ${extra}` : base;
		}
		get _isInteractive() {
			return this.clickable || Boolean(this.href) || this.removable;
		}
		get _chipClasses() {
			const classes = ["mono-chip"];
			classes.push(this.size);
			if (this.variant === "soft") classes.push(`soft-${this.color}`);
			else if (this.variant === "solid") classes.push(`solid-${this.color}`);
			else if (this.variant === "outline") classes.push(`outline-${this.color}`);
			if (this.dot) classes.push("has-dot");
			if (this.removable) classes.push("removable");
			if (this.clickable || this.href) classes.push("clickable");
			if (this.disabled) classes.push("disabled");
			if (this.selected || this._isActive) classes.push("selected");
			if (this.cssClass?.root) classes.push(this.cssClass.root);
			return classes.join(" ");
		}
		_createModelDetail(args) {
			return {
				modelValue: args.modelValue,
				currentValue: args.modelValue,
				oldValue: args.oldValue,
				value: args.modelValue,
				selected: args.modelValue,
				label: this.label ?? "",
				sourceEvent: args.sourceEvent
			};
		}
		_emitClick(detail) {
			dispatchMonoEvent(this, "click", detail);
		}
		_emitClose(detail) {
			dispatchMonoEvent(this, "close", detail);
		}
		_handleClick(event) {
			if (this.disabled) {
				event.preventDefault();
				event.stopPropagation();
				return;
			}
			const oldValue = this.modelValue;
			let nextValue = this.modelValue;
			if (this.clickable && !this.href) {
				nextValue = !this.modelValue;
				this.modelValue = nextValue;
				this.selected = nextValue;
			}
			const detail = this._createModelDetail({
				modelValue: nextValue,
				oldValue,
				sourceEvent: event
			});
			this._emitClick(detail);
		}
		_handleKeyDown(event) {
			if (this.disabled) return;
			if (event.key === "Enter" || event.key === " ") {
				event.preventDefault();
				this._chipElement?.click();
			}
			if ((event.key === "Backspace" || event.key === "Delete") && this.removable) {
				event.preventDefault();
				const detail = this._createModelDetail({
					modelValue: this.modelValue,
					oldValue: this.modelValue,
					sourceEvent: event
				});
				this._emitClose(detail);
			}
		}
		_handleFocus() {
			this._isActive = true;
		}
		_handleBlur() {
			this._isActive = false;
		}
		_handleClose(event) {
			event.preventDefault();
			event.stopPropagation();
			if (this.disabled) return;
			const detail = this._createModelDetail({
				modelValue: this.modelValue,
				oldValue: this.modelValue,
				sourceEvent: event
			});
			this._emitClose(detail);
		}
		focus() {
			this._chipElement?.focus();
		}
		blur() {
			this._chipElement?.blur();
		}
		click() {
			this._chipElement?.click();
		}
	}
	__decorate([property({ type: String })], MonoChipCoreClass.prototype, "size", void 0);
	__decorate([property({ type: String })], MonoChipCoreClass.prototype, "color", void 0);
	__decorate([property({ type: String })], MonoChipCoreClass.prototype, "variant", void 0);
	__decorate([property({ type: String })], MonoChipCoreClass.prototype, "rounded", void 0);
	__decorate([property({ type: String })], MonoChipCoreClass.prototype, "label", void 0);
	__decorate([property({
		reflect: true,
		converter: booleanStringConverter
	})], MonoChipCoreClass.prototype, "dot", void 0);
	__decorate([property({
		reflect: true,
		converter: booleanStringConverter
	})], MonoChipCoreClass.prototype, "removable", void 0);
	__decorate([property({
		reflect: true,
		converter: booleanStringConverter
	})], MonoChipCoreClass.prototype, "clickable", void 0);
	__decorate([property({
		reflect: true,
		converter: booleanStringConverter
	})], MonoChipCoreClass.prototype, "disabled", void 0);
	__decorate([property({
		attribute: "model-value",
		reflect: true,
		converter: booleanStringConverter
	})], MonoChipCoreClass.prototype, "modelValue", void 0);
	__decorate([property({
		reflect: true,
		converter: booleanStringConverter
	})], MonoChipCoreClass.prototype, "selected", void 0);
	__decorate([property({ type: String })], MonoChipCoreClass.prototype, "href", void 0);
	__decorate([property({ type: String })], MonoChipCoreClass.prototype, "target", void 0);
	__decorate([property({
		type: String,
		attribute: "icon-position"
	})], MonoChipCoreClass.prototype, "iconPosition", void 0);
	__decorate([property({
		type: String,
		attribute: "aria-label"
	})], MonoChipCoreClass.prototype, "ariaLabelText", void 0);
	__decorate([property({
		type: String,
		attribute: "close-label"
	})], MonoChipCoreClass.prototype, "closeLabel", void 0);
	__decorate([property({ attribute: false })], MonoChipCoreClass.prototype, "cssClass", void 0);
	__decorate([state()], MonoChipCoreClass.prototype, "_isActive", void 0);
	__decorate([state()], MonoChipCoreClass.prototype, "_hasIcon", void 0);
	__decorate([query("div > span, div > a")], MonoChipCoreClass.prototype, "_chipElement", void 0);
	return MonoChipCoreClass;
};

//#endregion
//#region src/components/chip/mono-status-dot.ts
/**
* `mono-status-dot` — a small status indicator. Already a real shadow-DOM
* LitElement (default render root + `static styles`, native `<slot>`), so it is
* SSR-compatible as-is and shared verbatim by BOTH the light (`@mono-lit/helper/ui/chip`)
* and shadow (`@mono-lit/helper/ui/shadow/chip`) chip builds. It lives in its own
* module so the shadow chip build can register it WITHOUT importing the light
* `mono-chip` (which would collide with the shadow `mono-chip` class).
*
* It keeps the SAME `mono-status-dot` tag in both builds (it has no light/shadow
* variant — it is always a shadow-DOM element), so its registration is guarded
* (see bottom of file): whichever chip build loads first wins, and a page that
* loads both light + shadow chip won't throw a "already defined" registry error.
*/
var MonoStatusDot = class extends LitElement {
	static {
		this.styles = [unsafeCSS(chip_css_raw_default)];
	}
	constructor() {
		super();
		this.state = "online";
		this.pulse = false;
		this.label = void 0;
		this.color = void 0;
	}
	get _statusClasses() {
		const classes = ["mono-status-dot", `sd-${this.state}`];
		if (this.pulse) classes.push("pulse");
		return classes.join(" ");
	}
	get _statusStyle() {
		if (!this.color) return void 0;
		return `--mono-status-dot-color:${this.color};`;
	}
	render() {
		return html`
      <span
        class=${this._statusClasses}
        mono-status-dot
        mono-status=${this.state === "online" ? nothing : this.state}
        ?mono-pulse=${this.pulse}
        style=${ifDefined(this._statusStyle)}
        role="status"
        aria-label=${ifDefined(this.label)}
      >
        <span class="sd-dot" mono-dot aria-hidden="true"></span>
        <span class="sd-label">
          ${when(Boolean(this.label), () => this.label, () => html`<slot></slot>`)}
        </span>
      </span>
    `;
	}
	focus() {
		this._statusElement?.focus();
	}
	blur() {
		this._statusElement?.blur();
	}
};
__decorate([property({ type: String })], MonoStatusDot.prototype, "state", void 0);
__decorate([property({
	reflect: true,
	converter: booleanStringConverter
})], MonoStatusDot.prototype, "pulse", void 0);
__decorate([property({ type: String })], MonoStatusDot.prototype, "label", void 0);
__decorate([property({ type: String })], MonoStatusDot.prototype, "color", void 0);
__decorate([query("span")], MonoStatusDot.prototype, "_statusElement", void 0);
defineMonoElement("mono-status-dot", MonoStatusDot);

//#endregion
//#region src/components/chip/chip-utils.ts
function generateChipRootClasses(props) {
	const classes = ["mono-chip"];
	classes.push(props.size ?? "md");
	if (props.rounded) classes.push(`rounded-${props.rounded}`);
	const variant = props.variant ?? "soft";
	const color = props.color ?? "primary";
	classes.push(`${variant}-${color}`);
	if (props.clickable) classes.push("clickable");
	if (props.removable) classes.push("removable");
	if (props.disabled) classes.push("disabled");
	if (props.selected) classes.push("selected");
	if (props.dot) classes.push("has-dot");
	return classes.join(" ");
}
function isInteractive(props) {
	return Boolean(!props.disabled && (props.clickable || props.href || props.removable));
}
function validateChipProps(props) {
	const validSizes = [
		"xs",
		"sm",
		"md",
		"lg",
		"xl",
		"xxl"
	];
	const validColors = [
		"primary",
		"success",
		"danger",
		"warning",
		"info",
		"teal",
		"purple",
		"neutral",
		"dark"
	];
	const validVariants = [
		"soft",
		"solid",
		"outline"
	];
	const validRounded = [
		"none",
		"xs",
		"sm",
		"md",
		"lg",
		"xl",
		"xxl",
		"full"
	];
	if (props.size && !validSizes.includes(props.size)) return false;
	if (props.color && !validColors.includes(props.color)) return false;
	if (props.variant && !validVariants.includes(props.variant)) return false;
	if (props.rounded && !validRounded.includes(props.rounded)) return false;
	return true;
}

//#endregion
export { MonoChipCore as a, MonoStatusDot as i, isInteractive as n, validateChipProps as r, generateChipRootClasses as t };