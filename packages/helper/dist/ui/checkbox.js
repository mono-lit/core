import { g as monoHostChildNodes } from "../mono-ui-jtBvJ9d5.js";
import { t as customElement } from "../mono-element-9uQRbp5X.js";
import { a as defineHybridPropAliases, i as defineHybridPropAlias, r as booleanStringConverter, t as __decorate } from "../decorate-DbYFpi8R.js";
import { t as dispatchMonoEvent } from "../mono-event-BPku9HpS.js";
import { s as placeSlotNode } from "../light-slots-B980aknU.js";
import { t as MonoFormControlCore } from "../form-control-core-CRZPZ1ru.js";
import { LitElement, html, nothing } from "lit";
import { property, state } from "lit/decorators.js";
import { ifDefined } from "lit/directives/if-defined.js";

//#region src/components/checkbox/checkbox-core.ts
/**
* `MonoCheckboxCore` — all render-mode-agnostic logic for `mono-checkbox`:
* reactive props (incl. SSR boolean coercion), hybrid aliases, camelCase
* attribute fallbacks, the `modelValue`↔`checked` sync, class computation,
* change interactivity (`mno-change`), `focus`/`blur`, AND the shared `render()`
* skeleton (`<label><input><box></box><labelBlock></label>`). The slot-bearing
* regions are two overridable hooks — `_renderCustomIcon()` / `_renderLabelBlock()`
* — that default to the light build's `[data-mono-slot]` placeholders; the shadow
* build overrides them with native `<slot>` (mirrors `mono-accordion`).
*
* SSR-safe: no `document`/`window` access; `focus`/`blur` query `this.renderRoot`.
*/
const MonoCheckboxCore = (superClass) => {
	class MonoCheckboxCoreClass extends MonoFormControlCore(superClass) {
		constructor(...args) {
			super(...args);
			this.size = "md";
			this.color = "primary";
			this.modelValue = false;
			this.checked = false;
			this.disabled = false;
			this.indeterminate = false;
			this.loading = false;
			this.label = "";
			this.sublabel = "";
			this.value = "";
			this.name = "";
			this.cssClass = {};
			this.cssClassName = "";
			this._hasIcon = false;
			this._hasIndeterminateIcon = false;
			this._hasLabelSlotState = false;
			this._hasDescriptionSlotState = false;
			defineHybridPropAliases(this, [
				"modelValue",
				"ariaLabelText",
				"cssClass"
			]);
			defineHybridPropAlias(this, "description", "sublabel");
		}
		static get observedAttributes() {
			return [
				...super.observedAttributes ?? [],
				"modelvalue",
				"arialabeltext",
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
			if (name === "arialabeltext") {
				this.ariaLabelText = newValue ?? void 0;
				return;
			}
			if (name === "description") {
				this.sublabel = newValue ?? "";
				return;
			}
			if (name === "css-class" || name === "cssclass") this.cssClassName = newValue ?? "";
		}
		willUpdate(changed) {
			for (const key of [
				"modelValue",
				"checked",
				"disabled",
				"indeterminate"
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
		_cls(base, key) {
			const extra = this.cssClass?.[key];
			return extra ? `${base} ${extra}` : base;
		}
		get _wrapperClasses() {
			return [
				"mono-checkbox",
				this.size,
				this.color,
				this.disabled ? "disabled" : "",
				this.checked ? "mono-checkbox-checked" : "",
				this.indeterminate ? "mono-checkbox-indeterminate" : "",
				this.cssClassName,
				this.cssClass?.root
			].filter(Boolean).join(" ");
		}
		get _inputClasses() {
			return this._cls("mono-checkbox-input", "input");
		}
		get _boxClasses() {
			return [
				this._cls("mono-checkbox-box", "box"),
				this.size,
				this._hasIcon || this.loading ? "has-custom-icon" : "",
				this._hasIndeterminateIcon || this.loading ? "has-custom-indeterminate-icon" : ""
			].filter(Boolean).join(" ");
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
			if (this.disabled) return;
			const input = event.currentTarget;
			const oldValue = this.modelValue;
			const nextValue = input.checked;
			if (this.indeterminate) this.indeterminate = false;
			this.checked = nextValue;
			this.modelValue = nextValue;
			const detail = this._createModelDetail({
				modelValue: nextValue,
				oldValue,
				sourceEvent: event
			});
			this._emitChange(detail);
		}
		/**
		* The `loading` spinner, shown in place of the tick/dash. Light uses the global
		* icon utility class; the shadow build overrides this with inline SVG, which
		* page-level CSS cannot reach.
		*/
		_renderLoadingIcon() {
			return html`<span class="mono-icon i-mdi-loading mono-checkbox-spinner" mono-spinner aria-hidden="true"></span>`;
		}
		/** Light-DOM custom icon (data-mono-slot). Shadow build overrides with `<slot>`. */
		_renderCustomIcon() {
			if (this.indeterminate && this._hasIndeterminateIcon) return html`
          <span
            class=${[this._cls("mono-checkbox-indeterminate-icon", "indeterminateIcon"), this.size].filter(Boolean).join(" ")}
            mono-indeterminate-icon
            data-mono-slot="indeterminate-icon"
          ></span>
        `;
			if (this.checked && this._hasIcon) return html`
          <span
            class=${[this._cls("mono-checkbox-icon", "icon"), this.size].filter(Boolean).join(" ")}
            mono-icon
            data-mono-slot="icon"
          ></span>
        `;
			return nothing;
		}
		/** Light-DOM label block (data-mono-slot). Shadow build overrides with `<slot>`. */
		_renderLabelBlock() {
			if (!this._hasLabelContent() && !this._hasDescriptionContent()) return nothing;
			return html`
        <span class=${this._cls("mono-checkbox-label", "label")} mono-label>
          ${this._hasLabelContent() ? html`
                <span class=${this._cls("mono-checkbox-label-text", "labelText")} mono-label-text>
                  ${this._hasLabelSlotState ? html`<span data-mono-slot="label"></span>` : this.label}
                </span>
              ` : nothing}

          ${this._hasDescriptionContent() ? html`
                <span class=${this._cls("mono-checkbox-label-description", "description")} mono-description>
                  ${this._hasDescriptionSlotState ? html`<span data-mono-slot="description"></span>` : this.sublabel}
                </span>
              ` : nothing}
        </span>
      `;
		}
		render() {
			const ariaLabel = this.ariaLabelText || this.label || (this._hasLabelSlotState ? "Checkbox" : void 0);
			return html`
        <label
          class=${this._wrapperClasses}
          mono-checkbox
          mono-size=${this.size === "md" ? nothing : this.size}
          mono-color=${this.color === "primary" ? nothing : this.color}
          ?mono-checked=${this.checked}
          ?mono-indeterminate=${this.indeterminate}
          ?mono-disabled=${this.disabled}
          ?mono-loading=${this.loading}
        >
          <input
            class=${this._inputClasses}
            mono-input
            type="checkbox"
            .checked=${this.checked}
            .indeterminate=${this.indeterminate}
            .value=${this.value}
            name=${ifDefined(this.name || void 0)}
            ?disabled=${this.disabled || this.loading}
            aria-checked=${this.indeterminate ? "mixed" : String(this.checked)}
            aria-label=${ifDefined(ariaLabel)}
            aria-busy=${this.loading ? "true" : "false"}
            @change=${this._handleChange}
          />

          <span
            class=${this._boxClasses}
            mono-box
            ?mono-custom-icon=${this._hasIcon || this.loading}
            ?mono-custom-indeterminate-icon=${this._hasIndeterminateIcon || this.loading}
            aria-hidden="true"
          >
            ${this.loading ? this._renderLoadingIcon() : this._renderCustomIcon()}
          </span>

          ${this._renderLabelBlock()}
        </label>
      `;
		}
		focus(options) {
			this.renderRoot.querySelector(".mono-checkbox-input")?.focus(options);
		}
		blur() {
			this.renderRoot.querySelector(".mono-checkbox-input")?.blur();
		}
	}
	__decorate([property({ type: String })], MonoCheckboxCoreClass.prototype, "size", void 0);
	__decorate([property({ type: String })], MonoCheckboxCoreClass.prototype, "color", void 0);
	__decorate([property({
		attribute: "model-value",
		reflect: true,
		converter: booleanStringConverter
	})], MonoCheckboxCoreClass.prototype, "modelValue", void 0);
	__decorate([property({
		reflect: true,
		converter: booleanStringConverter
	})], MonoCheckboxCoreClass.prototype, "checked", void 0);
	__decorate([property({
		reflect: true,
		converter: booleanStringConverter
	})], MonoCheckboxCoreClass.prototype, "disabled", void 0);
	__decorate([property({
		reflect: true,
		converter: booleanStringConverter
	})], MonoCheckboxCoreClass.prototype, "indeterminate", void 0);
	__decorate([property({
		reflect: true,
		converter: booleanStringConverter
	})], MonoCheckboxCoreClass.prototype, "loading", void 0);
	__decorate([property({ type: String })], MonoCheckboxCoreClass.prototype, "label", void 0);
	__decorate([property({ type: String })], MonoCheckboxCoreClass.prototype, "sublabel", void 0);
	__decorate([property({ type: String })], MonoCheckboxCoreClass.prototype, "value", void 0);
	__decorate([property({ type: String })], MonoCheckboxCoreClass.prototype, "name", void 0);
	__decorate([property({
		type: String,
		attribute: "aria-label"
	})], MonoCheckboxCoreClass.prototype, "ariaLabelText", void 0);
	__decorate([property({ attribute: false })], MonoCheckboxCoreClass.prototype, "cssClass", void 0);
	__decorate([property({
		type: String,
		attribute: "css-class"
	})], MonoCheckboxCoreClass.prototype, "cssClassName", void 0);
	__decorate([state()], MonoCheckboxCoreClass.prototype, "_hasIcon", void 0);
	__decorate([state()], MonoCheckboxCoreClass.prototype, "_hasIndeterminateIcon", void 0);
	__decorate([state()], MonoCheckboxCoreClass.prototype, "_hasLabelSlotState", void 0);
	__decorate([state()], MonoCheckboxCoreClass.prototype, "_hasDescriptionSlotState", void 0);
	return MonoCheckboxCoreClass;
};

//#endregion
//#region src/components/checkbox/mono-checkbox.ts
let MonoCheckbox = class MonoCheckbox extends MonoCheckboxCore(LitElement) {
	constructor(..._args) {
		super(..._args);
		this._slotsCaptured = false;
		this._slotIcon = [];
		this._slotIndeterminateIcon = [];
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
		this._placeSlot("icon", this._slotIcon);
		this._placeSlot("indeterminate-icon", this._slotIndeterminateIcon);
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
			if (slotName === "icon") {
				node.removeAttribute("slot");
				this._slotIcon.push(node);
				capturedSlotNodes.add(node);
			}
			if (slotName === "indeterminate-icon") {
				node.removeAttribute("slot");
				this._slotIndeterminateIcon.push(node);
				capturedSlotNodes.add(node);
			}
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
		this._hasIcon = this._slotIcon.length > 0;
		this._hasIndeterminateIcon = this._slotIndeterminateIcon.length > 0;
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
__decorate([state()], MonoCheckbox.prototype, "_slotsCaptured", void 0);
MonoCheckbox = __decorate([customElement("mono-checkbox")], MonoCheckbox);

//#endregion
//#region src/components/checkbox/checkbox-utils.ts
/**
* Validate checkbox props
*/
function validateCheckboxProps(props) {
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
function generateCheckboxAttributes(disabled, checked, indeterminate, label) {
	return {
		"aria-disabled": disabled ? "true" : void 0,
		"aria-checked": indeterminate ? "mixed" : String(checked),
		"role": "checkbox",
		"aria-label": label || void 0
	};
}

//#endregion
export { MonoCheckbox, generateCheckboxAttributes, validateCheckboxProps };