import { a as __decorate, f as customElement, i as withShadowUtilityStyles, l as defineHybridPropAliases, p as defineMonoElement, r as toShadowCss, s as booleanStringConverter, t as flushSsrHydration } from "../../hydration-flush-RB5Tz5nl.js";
import { t as dispatchMonoEvent } from "../../mono-event-Bi1qP9uN.js";
import { t as chip_default } from "../../chip-DBUUa2eB.js";
import { LitElement, html, isServer, nothing, unsafeCSS } from "lit";
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
var MonoChipCore = (superClass) => {
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
//#region src/components/chip/mono-chip.shadow.ts
var SHADOW_EXTRA_CSS = `
[data-mono-slot='icon'][data-empty] {
  display: none;
}
`;
var MonoChipShadow = class MonoChipShadow extends withShadowUtilityStyles(MonoChipCore(LitElement)) {
	static {
		this.disableWarning?.("change-in-update");
	}
	static {
		this.styles = [unsafeCSS(toShadowCss(chip_default, {
			host: "mono-chip",
			append: SHADOW_EXTRA_CSS
		}))];
	}
	connectedCallback() {
		super.connectedCallback();
		if (isServer) return;
		flushSsrHydration(this);
	}
	firstUpdated(changed) {
		super.firstUpdated?.(changed);
		if (isServer) return;
		this._hasIcon = this._slotHasContent(this._iconSlot());
	}
	_iconSlot() {
		return this.renderRoot.querySelector("slot[name=\"icon\"]");
	}
	_slotHasContent(slot) {
		return !!slot && slot.assignedNodes({ flatten: true }).some((n) => n.nodeType === Node.ELEMENT_NODE || !!(n.textContent ?? "").trim());
	}
	_onIconSlotChange(event) {
		this._hasIcon = this._slotHasContent(event.target);
	}
	_renderDot() {
		return when(this.dot, () => html`<span class=${this._cls("chip-dot", "dot")} mono-dot aria-hidden="true"></span>`, () => nothing);
	}
	_iconSpan() {
		return html`
      <span data-mono-slot="icon" ?mono-empty=${!this._hasIcon}>
        <slot name="icon" @slotchange=${(e) => this._onIconSlotChange(e)}></slot>
      </span>
    `;
	}
	_renderLabel() {
		return html`
      <span class=${this._cls("chip-label", "label")} mono-label>
        ${this.label ? this.label : html`<slot></slot>`}
      </span>
    `;
	}
	_renderClose() {
		return when(this.removable, () => html`
        <button
          class=${this._cls("chip-close", "close")}
          mono-close
          type="button"
          aria-label=${this.closeLabel}
          ?disabled=${this.disabled}
          @click=${this._handleClose}
        >
          <slot name="close">
            <svg
              class="mono-icon"
              mono-glyph
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
              aria-hidden="true"
            >
              <path d="M18 6 6 18M6 6l12 12"></path>
            </svg>
          </slot>
        </button>
      `, () => nothing);
	}
	_renderContent() {
		return html`
      <span class=${this._cls(this.iconPosition === "right" ? "chip-content icon-right" : "chip-content icon-left", "content")} mono-content>
        ${this._renderDot()}
        ${this.iconPosition === "left" ? this._iconSpan() : nothing}
        ${this._renderLabel()}
        ${this.iconPosition === "right" ? this._iconSpan() : nothing}
        ${this._renderClose()}
      </span>
    `;
	}
	render() {
		const tabIndex = this._isInteractive && !this.disabled ? "0" : void 0;
		const ariaLabel = this.ariaLabelText ?? this.label;
		if (this.href) return html`
        <div
        class=${this._chipClasses}
        mono-chip
        mono-size=${this.size === "md" ? nothing : this.size}
        mono-color=${this.color === "primary" ? nothing : this.color}
        mono-variant=${this.variant === "soft" ? nothing : this.variant}
        mono-rounded=${this.rounded ? this.rounded : nothing}
        mono-icon-position=${this.iconPosition === "right" ? "right" : nothing}
        ?mono-has-dot=${this.dot}
        ?mono-removable=${this.removable}
        ?mono-clickable=${this.clickable || !!this.href}
        ?mono-disabled=${this.disabled}
        ?mono-selected=${this.selected || this._isActive}
      >
          <a
            class=${"mono-chip-native" + (this.cssClass?.main ? " " + this.cssClass.main : "")}
            mono-main
            href=${ifDefined(this.href)}
            target=${ifDefined(this.target)}
            role="button"
            aria-label=${ifDefined(ariaLabel)}
            aria-disabled=${this.disabled ? "true" : "false"}
            @click=${this._handleClick}
            @keydown=${this._handleKeyDown}
            @focus=${this._handleFocus}
            @blur=${this._handleBlur}
          >
            ${this._renderContent()}
          </a>
        </div>
      `;
		return html`
      <div
        class=${this._chipClasses}
        mono-chip
        mono-size=${this.size === "md" ? nothing : this.size}
        mono-color=${this.color === "primary" ? nothing : this.color}
        mono-variant=${this.variant === "soft" ? nothing : this.variant}
        mono-rounded=${this.rounded ? this.rounded : nothing}
        mono-icon-position=${this.iconPosition === "right" ? "right" : nothing}
        ?mono-has-dot=${this.dot}
        ?mono-removable=${this.removable}
        ?mono-clickable=${this.clickable || !!this.href}
        ?mono-disabled=${this.disabled}
        ?mono-selected=${this.selected || this._isActive}
      >
        <span
          class=${ifDefined(this.cssClass?.main)}
          mono-main
          role=${this._isInteractive ? "button" : "status"}
          tabindex=${ifDefined(tabIndex)}
          aria-label=${ifDefined(ariaLabel)}
          aria-disabled=${this.disabled ? "true" : "false"}
          @click=${this._handleClick}
          @keydown=${this._handleKeyDown}
          @focus=${this._handleFocus}
          @blur=${this._handleBlur}
        >
          ${this._renderContent()}
        </span>
      </div>
    `;
	}
};
MonoChipShadow = __decorate([customElement("mono-shadow-chip")], MonoChipShadow);
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
		this.styles = [unsafeCSS(chip_default)];
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
export { MonoChipCore, MonoChipShadow, MonoStatusDot, generateChipRootClasses, isInteractive, validateChipProps };
