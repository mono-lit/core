import { g as monoHostChildNodes } from "../mono-ui-jtBvJ9d5.js";
import { t as customElement } from "../mono-element-9uQRbp5X.js";
import { a as defineHybridPropAliases, i as defineHybridPropAlias, r as booleanStringConverter, t as __decorate } from "../decorate-DbYFpi8R.js";
import { t as dispatchMonoEvent } from "../mono-event-BPku9HpS.js";
import { s as placeSlotNode } from "../light-slots-B980aknU.js";
import { t as MonoFormControlCore } from "../form-control-core-CRZPZ1ru.js";
import { LitElement, html, nothing } from "lit";
import { property, state } from "lit/decorators.js";
import { ifDefined } from "lit/directives/if-defined.js";

//#region src/components/switch/switch-core.ts
/**
* `MonoSwitchCore` — all render-mode-agnostic logic for `mono-switch`: reactive
* props (incl. SSR boolean coercion), hybrid aliases, camelCase attribute
* fallbacks, the `modelValue`↔`checked` sync, class computation, change
* interactivity (`mno-change`), `focus`/`blur`, AND the shared `render()`
* skeleton (`<label><input role=switch><track><thumb></track><labelBlock></label>`).
* The slot-bearing label/description region is an overridable hook
* (`_renderLabelBlock()`) that defaults to the light build's `[data-mono-slot]`
* placeholders; the shadow build overrides it with native `<slot>` (mirrors
* `mono-checkbox`). SSR-safe: no `document`/`window`; `focus`/`blur` query
* `this.renderRoot`.
*/
const MonoSwitchCore = (superClass) => {
	class MonoSwitchCoreClass extends MonoFormControlCore(superClass) {
		constructor(...args) {
			super(...args);
			this.size = "md";
			this.color = "primary";
			this.modelValue = false;
			this.checked = false;
			this.disabled = false;
			this.loading = false;
			this.label = "";
			this.sublabel = "";
			this.value = "";
			this.name = "";
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
			for (const alias of [
				"ariaLabel",
				"aria-label",
				"arialabel"
			]) Object.defineProperty(this, alias, {
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
				"arialabel",
				"description",
				"css-class",
				"cssclass"
			];
		}
		attributeChangedCallback(name, oldValue, newValue) {
			super.attributeChangedCallback(name, oldValue, newValue);
			if (oldValue === newValue) return;
			if (name === "modelvalue") {
				this.modelValue = this._toBoolean(newValue);
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
			for (const key of [
				"modelValue",
				"checked",
				"disabled",
				"loading"
			]) if (typeof this[key] === "string") this[key] = this._toBoolean(this[key]);
			if (changed.has("modelValue") && this.checked !== this.modelValue) this.checked = this.modelValue;
			if (changed.has("checked") && this.modelValue !== this.checked) this.modelValue = this.checked;
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
		_cls(base, key) {
			const extra = this.cssClass?.[key];
			return extra ? `${base} ${extra}` : base;
		}
		get _wrapperClasses() {
			return [
				"mono-switch",
				this.size,
				this.color,
				this.disabled ? "disabled" : "",
				this.loading ? "loading" : "",
				this.checked ? "mono-switch-checked" : "",
				this.cssClassName,
				this.cssClass?.root
			].filter(Boolean).join(" ");
		}
		get _inputClasses() {
			return this._cls("mono-switch-input", "input");
		}
		get _trackClasses() {
			return [this._cls("mono-switch-track", "track"), this.size].filter(Boolean).join(" ");
		}
		get _thumbClasses() {
			return [this._cls("mono-switch-thumb", "thumb"), this.size].filter(Boolean).join(" ");
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
				checked: args.modelValue,
				value: this.value,
				name: this.name,
				sourceEvent: args.sourceEvent
			};
		}
		_emitChange(detail) {
			dispatchMonoEvent(this, "change", detail);
		}
		_handleChange(event) {
			if (this.disabled || this.loading) return;
			const input = event.currentTarget;
			const oldValue = this.modelValue;
			const nextValue = input.checked;
			this.checked = nextValue;
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
        <span class=${this._cls("mono-switch-label", "label")} mono-label>
          ${this._hasLabelContent() ? html`
                <span class=${this._cls("mono-switch-label-text", "labelText")} mono-label-text>
                  ${this._hasLabelSlotState ? html`<span data-mono-slot="label"></span>` : this.label}
                </span>
              ` : nothing}

          ${this._hasDescriptionContent() ? html`
                <span class=${this._cls("mono-switch-label-description", "description")} mono-description>
                  ${this._hasDescriptionSlotState ? html`<span data-mono-slot="description"></span>` : this.sublabel}
                </span>
              ` : nothing}
        </span>
      `;
		}
		render() {
			const ariaLabel = this.ariaLabelText || this.label || (this._hasLabelSlotState ? "Switch" : void 0);
			return html`
        <label
          class=${this._wrapperClasses}
          mono-switch
          mono-size=${this.size === "md" ? nothing : this.size}
          mono-color=${this.color === "primary" ? nothing : this.color}
          ?mono-checked=${this.checked}
          ?mono-disabled=${this.disabled}
          ?mono-loading=${this.loading}
        >
          <input
            class=${this._inputClasses}
            mono-input
            type="checkbox"
            role="switch"
            .checked=${this.checked}
            .value=${this.value}
            name=${ifDefined(this.name || void 0)}
            ?disabled=${this.disabled || this.loading}
            aria-checked=${String(this.checked)}
            aria-label=${ifDefined(ariaLabel)}
            @change=${this._handleChange}
          />

          <span class=${this._trackClasses} mono-track aria-hidden="true">
            <span class=${this._thumbClasses} mono-thumb></span>
          </span>

          ${this._renderLabelBlock()}
        </label>
      `;
		}
		focus(options) {
			this.renderRoot.querySelector(".mono-switch-input")?.focus(options);
		}
		blur() {
			this.renderRoot.querySelector(".mono-switch-input")?.blur();
		}
	}
	__decorate([property({ type: String })], MonoSwitchCoreClass.prototype, "size", void 0);
	__decorate([property({ type: String })], MonoSwitchCoreClass.prototype, "color", void 0);
	__decorate([property({
		attribute: "model-value",
		reflect: true,
		converter: booleanStringConverter
	})], MonoSwitchCoreClass.prototype, "modelValue", void 0);
	__decorate([property({
		reflect: true,
		converter: booleanStringConverter
	})], MonoSwitchCoreClass.prototype, "checked", void 0);
	__decorate([property({
		reflect: true,
		converter: booleanStringConverter
	})], MonoSwitchCoreClass.prototype, "disabled", void 0);
	__decorate([property({
		reflect: true,
		converter: booleanStringConverter
	})], MonoSwitchCoreClass.prototype, "loading", void 0);
	__decorate([property({ type: String })], MonoSwitchCoreClass.prototype, "label", void 0);
	__decorate([property({ type: String })], MonoSwitchCoreClass.prototype, "sublabel", void 0);
	__decorate([property({ type: String })], MonoSwitchCoreClass.prototype, "value", void 0);
	__decorate([property({ type: String })], MonoSwitchCoreClass.prototype, "name", void 0);
	__decorate([property({
		type: String,
		attribute: "aria-label"
	})], MonoSwitchCoreClass.prototype, "ariaLabelText", void 0);
	__decorate([property({ attribute: false })], MonoSwitchCoreClass.prototype, "cssClass", void 0);
	__decorate([property({ attribute: false })], MonoSwitchCoreClass.prototype, "cssClassName", void 0);
	__decorate([state()], MonoSwitchCoreClass.prototype, "_hasLabelSlotState", void 0);
	__decorate([state()], MonoSwitchCoreClass.prototype, "_hasDescriptionSlotState", void 0);
	return MonoSwitchCoreClass;
};

//#endregion
//#region src/components/switch/mono-switch.ts
let MonoSwitch = class MonoSwitch extends MonoSwitchCore(LitElement) {
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
		super.updated(changed);
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
__decorate([state()], MonoSwitch.prototype, "_slotsCaptured", void 0);
MonoSwitch = __decorate([customElement("mono-switch")], MonoSwitch);

//#endregion
//#region src/components/switch/switch-utils.ts
/**
* Validate switch props
*/
function validateSwitchProps(props) {
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
function generateSwitchAttributes(disabled, loading, checked, label) {
	return {
		"aria-disabled": disabled || loading ? "true" : void 0,
		"aria-busy": loading ? "true" : void 0,
		"aria-checked": String(checked),
		"role": "switch",
		"aria-label": label || void 0
	};
}

//#endregion
export { MonoSwitch, generateSwitchAttributes, validateSwitchProps };