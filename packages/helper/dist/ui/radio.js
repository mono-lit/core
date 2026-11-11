import { g as monoHostChildNodes } from "../mono-ui-kvLVIf1V.js";
import { t as customElement } from "../mono-element-CKcT0rwv.js";
import { a as defineHybridPropAliases, i as defineHybridPropAlias, r as booleanStringConverter, t as __decorate } from "../decorate-DbYFpi8R.js";
import { t as dispatchMonoEvent } from "../mono-event-CAZf0F_k.js";
import { s as placeSlotNode } from "../light-slots-B5Ck0t_E.js";
import { t as MonoFormControlCore } from "../form-control-core-CRZPZ1ru.js";
import { LitElement, html, nothing } from "lit";
import { property, state } from "lit/decorators.js";
import { ifDefined } from "lit/directives/if-defined.js";

//#region src/components/radio/radio-core.ts
/**
* `MonoRadioCore` — all render-mode-agnostic logic for `mono-radio`: reactive
* props (incl. SSR `disabled` coercion), hybrid aliases (incl. the
* `ariaLabel`/`aria-label`/`arialabel` → `ariaLabelText` getters), camelCase
* attribute fallbacks, class computation, the `mno-change` interactivity, and the
* shared `<label><input><circle><dot></circle><labelBlock></label>` `render()`
* (the radio dot is pure CSS — no icons). Only the label/description region is a
* hook (`_renderLabelBlock`) — the light build uses `data-mono-slot`, the shadow
* build native `<slot>` (mirrors `mono-checkbox`).
*
* SSR-safe: no `document`/`window` access; `focus`/`blur` query `this.renderRoot`.
*/
const MonoRadioCore = (superClass) => {
	class MonoRadioCoreClass extends MonoFormControlCore(superClass) {
		constructor(...args) {
			super(...args);
			this.size = "md";
			this.color = "primary";
			this.value = "";
			this.modelValue = "";
			this.disabled = false;
			this.label = "";
			this.sublabel = "";
			this.cssClass = {};
			this.cssClassName = "";
			this._hasLabelSlotState = false;
			this._hasDescriptionSlotState = false;
			defineHybridPropAliases(this, [
				"modelValue",
				"ariaLabelText",
				"cssClass"
			]);
			defineHybridPropAlias(this, "description", "sublabel");
			Object.defineProperty(this, "css-class", {
				get: () => this.cssClass,
				set: (value) => this._setCssClass(value),
				configurable: true,
				enumerable: false
			});
			Object.defineProperty(this, "cssclass", {
				get: () => this.cssClass,
				set: (value) => this._setCssClass(value),
				configurable: true,
				enumerable: false
			});
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
		}
		static get observedAttributes() {
			return [
				...super.observedAttributes ?? [],
				"modelvalue",
				"arialabeltext",
				"description",
				"arialabel",
				"css-class",
				"cssclass"
			];
		}
		attributeChangedCallback(name, oldValue, newValue) {
			super.attributeChangedCallback(name, oldValue, newValue);
			if (oldValue === newValue) return;
			if (name === "modelvalue") {
				this.modelValue = this._toRadioValue(newValue);
				return;
			}
			if (name === "arialabeltext" || name === "arialabel") {
				this.ariaLabelText = newValue ?? void 0;
				return;
			}
			if (name === "description") {
				this.sublabel = newValue ?? "";
				return;
			}
			if (name === "css-class" || name === "cssclass") this._setCssClass(newValue);
		}
		willUpdate(changed) {
			if (typeof this.disabled === "string") {
				const normalized = this.disabled.toLowerCase().trim();
				this.disabled = normalized === "" || normalized === "true";
			}
			super.willUpdate?.(changed);
		}
		_setCssClass(value) {
			if (value == null) {
				this.cssClass = {};
				this.cssClassName = "";
				return;
			}
			if (typeof value === "object") {
				this.cssClass = value;
				return;
			}
			if (typeof value === "string") {
				const trimmed = value.trim();
				if (!trimmed) {
					this.cssClass = {};
					this.cssClassName = "";
					return;
				}
				if (trimmed.startsWith("{") && trimmed.endsWith("}")) try {
					this.cssClass = JSON.parse(trimmed);
					return;
				} catch {}
				this.cssClassName = trimmed;
			}
		}
		_toRadioValue(value) {
			if (value === void 0 || value === null) return "";
			if (typeof value === "boolean") return value;
			if (typeof value === "number") return value;
			return String(value);
		}
		_cls(base, key) {
			const extra = this.cssClass?.[key];
			return extra ? `${base} ${extra}` : base;
		}
		get _checked() {
			return this.modelValue === this.value;
		}
		get _wrapperClasses() {
			return [
				"mono-radio",
				this.size,
				this.color,
				this.disabled ? "disabled" : "",
				this._checked ? "mono-radio-checked" : "",
				this.cssClassName,
				this.cssClass?.root
			].filter(Boolean).join(" ");
		}
		get _inputClasses() {
			return this._cls("mono-radio-input", "input");
		}
		get _circleClasses() {
			return [this._cls("mono-radio-circle", "circle"), this.size].filter(Boolean).join(" ");
		}
		get _dotClasses() {
			return [this._cls("mono-radio-dot", "dot"), this.size].filter(Boolean).join(" ");
		}
		_hasLabelContent() {
			return Boolean(this.label) || this._hasLabelSlotState;
		}
		_hasDescriptionContent() {
			return Boolean(this.sublabel) || this._hasDescriptionSlotState;
		}
		_createModelDetail(args) {
			return {
				modelValue: args.modelValue,
				currentValue: args.modelValue,
				oldValue: args.oldValue,
				value: this.value,
				checked: args.modelValue === this.value,
				sourceEvent: args.sourceEvent
			};
		}
		_emitChange(detail) {
			dispatchMonoEvent(this, "change", detail);
		}
		_handleChange(event) {
			if (this.disabled) return;
			if (!event.currentTarget.checked) return;
			const oldValue = this.modelValue;
			const nextValue = this.value;
			this.modelValue = nextValue;
			const detail = this._createModelDetail({
				modelValue: nextValue,
				oldValue,
				sourceEvent: event
			});
			this._emitChange(detail);
		}
		/** Light-DOM label block (data-mono-slot). Shadow build overrides with `<slot>`. */
		_renderLabelBlock() {
			if (!this._hasLabelContent() && !this._hasDescriptionContent()) return nothing;
			return html`
        <span class=${this._cls("mono-radio-label", "label")} mono-label>
          ${this._hasLabelContent() ? html`
                <span class=${this._cls("mono-radio-label-text", "labelText")} mono-label-text>
                  ${this._hasLabelSlotState ? html`<span data-mono-slot="label"></span>` : this.label}
                </span>
              ` : nothing}

          ${this._hasDescriptionContent() ? html`
                <span class=${this._cls("mono-radio-label-description", "description")} mono-description>
                  ${this._hasDescriptionSlotState ? html`<span data-mono-slot="description"></span>` : this.sublabel}
                </span>
              ` : nothing}
        </span>
      `;
		}
		render() {
			const ariaLabel = this.ariaLabelText || this.label || (this._hasLabelSlotState ? "Radio option" : void 0);
			return html`
        <label
          class=${this._wrapperClasses}
          mono-radio
          mono-size=${this.size === "md" ? nothing : this.size}
          mono-color=${this.color === "primary" ? nothing : this.color}
          ?mono-checked=${this._checked}
          ?mono-disabled=${this.disabled}
        >
          <input
            class=${this._inputClasses}
            mono-input
            type="radio"
            .checked=${this._checked}
            .value=${String(this.value ?? "")}
            ?disabled=${this.disabled}
            aria-checked=${String(this._checked)}
            aria-label=${ifDefined(ariaLabel)}
            @change=${this._handleChange}
          />

          <span class=${this._circleClasses} mono-circle aria-hidden="true">
            <span class=${this._dotClasses} mono-dot></span>
          </span>

          ${this._renderLabelBlock()}
        </label>
      `;
		}
		focus(options) {
			this.renderRoot.querySelector(".mono-radio-input")?.focus(options);
		}
		blur() {
			this.renderRoot.querySelector(".mono-radio-input")?.blur();
		}
	}
	__decorate([property({ type: String })], MonoRadioCoreClass.prototype, "size", void 0);
	__decorate([property({ type: String })], MonoRadioCoreClass.prototype, "color", void 0);
	__decorate([property({ type: String })], MonoRadioCoreClass.prototype, "value", void 0);
	__decorate([property({
		type: String,
		attribute: "model-value",
		reflect: true
	})], MonoRadioCoreClass.prototype, "modelValue", void 0);
	__decorate([property({
		reflect: true,
		converter: booleanStringConverter
	})], MonoRadioCoreClass.prototype, "disabled", void 0);
	__decorate([property({ type: String })], MonoRadioCoreClass.prototype, "label", void 0);
	__decorate([property({ type: String })], MonoRadioCoreClass.prototype, "sublabel", void 0);
	__decorate([property({
		type: String,
		attribute: "aria-label"
	})], MonoRadioCoreClass.prototype, "ariaLabelText", void 0);
	__decorate([property({ attribute: false })], MonoRadioCoreClass.prototype, "cssClass", void 0);
	__decorate([property({
		type: String,
		attribute: false
	})], MonoRadioCoreClass.prototype, "cssClassName", void 0);
	__decorate([state()], MonoRadioCoreClass.prototype, "_hasLabelSlotState", void 0);
	__decorate([state()], MonoRadioCoreClass.prototype, "_hasDescriptionSlotState", void 0);
	return MonoRadioCoreClass;
};

//#endregion
//#region src/components/radio/mono-radio.ts
let MonoRadio = class MonoRadio extends MonoRadioCore(LitElement) {
	constructor(..._args) {
		super(..._args);
		this._slotsCaptured = false;
		this._slotLabel = [];
		this._slotDescription = [];
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
		this._placeSlot("label", this._slotLabel);
		this._placeSlot("description", this._slotDescription);
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
			if (slotName === "sublabel" || slotName === "description") {
				node.removeAttribute("slot");
				this._slotDescription.push(node);
				capturedSlotNodes.add(node);
			}
		}
		this._hasLabelSlotState = this._slotLabel.length > 0;
		this._hasDescriptionSlotState = this._slotDescription.length > 0;
		for (const node of capturedSlotNodes) if (node.parentNode === this) this.removeChild(node);
	}
	_placeSlot(name, nodes) {
		if (!nodes.length) return;
		const target = this.querySelector(`[data-mono-slot="${name}"]`);
		if (!target) return;
		for (const node of nodes) placeSlotNode(target, node);
	}
};
__decorate([state()], MonoRadio.prototype, "_slotsCaptured", void 0);
MonoRadio = __decorate([customElement("mono-radio")], MonoRadio);

//#endregion
//#region src/components/radio/radio-utils.ts
/**
* Validate radio props
*/
function validateRadioProps(props) {
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
		"secondary",
		"success",
		"danger",
		"warning",
		"info",
		"teal",
		"purple",
		"neutral",
		"dark"
	];
	if (props.size && !validSizes.includes(props.size)) return false;
	if (props.color && !validColors.includes(props.color)) return false;
	return true;
}
/**
* Generate ARIA attributes for accessibility
*/
function generateRadioAttributes(disabled, checked, label) {
	return {
		"aria-disabled": disabled ? "true" : void 0,
		"aria-checked": String(checked),
		"role": "radio",
		"aria-label": label || void 0
	};
}

//#endregion
export { MonoRadio, generateRadioAttributes, validateRadioProps };