import { d as buildSizeStyle, g as monoHostChildNodes } from "../mono-ui-jtBvJ9d5.js";
import { t as customElement } from "../mono-element-9uQRbp5X.js";
import { a as defineHybridPropAliases, r as booleanStringConverter, t as __decorate } from "../decorate-DbYFpi8R.js";
import { t as dispatchMonoEvent } from "../mono-event-BPku9HpS.js";
import { s as placeSlotNode } from "../light-slots-B980aknU.js";
import { t as MonoFormControlCore } from "../form-control-core-CRZPZ1ru.js";
import { t as FieldTooltipController } from "../field-tooltip-Csk4s2ve.js";
import { t as FieldValidationController } from "../field-validation-CFmUmuDx.js";
import { LitElement, html, isServer, nothing } from "lit";
import { property, query, state } from "lit/decorators.js";
import { ifDefined } from "lit/directives/if-defined.js";
import { styleMap } from "lit/directives/style-map.js";

//#region src/components/textarea/textarea-core.ts
const numberStringConverter = {
	fromAttribute(value) {
		if (value === null || value === "") return void 0;
		const parsed = Number(value);
		return Number.isFinite(parsed) ? parsed : void 0;
	},
	toAttribute(value) {
		if (value === void 0 || value === null) return null;
		return String(value);
	}
};
/**
* `MonoTextareaCore` — render-mode-agnostic logic for `mono-textarea` (props,
* hybrid aliases, value/model sync, validation, char counter, auto-resize, and
* the full `render()`). SSR-safe: the only DOM/`window` access (`_syncAutoResize`)
* is `isServer`-guarded. Each build supplies `createRenderRoot()` + `static styles`
* and the slot strategy via the `_slotOutlet` hook (light: `data-mono-slot`
* placeholders; shadow: native `<slot>`). Mirrors `switch-core`/`select-core`.
*/
const MonoTextareaCore = (superClass) => {
	class MonoTextareaCoreClass extends MonoFormControlCore(superClass) {
		constructor(...args) {
			super(...args);
			this.size = "md";
			this.color = "primary";
			this.variant = "outlined";
			this.labelPosition = "top";
			this.validationPosition = "bottom";
			this.modelValue = "";
			this.value = "";
			this.name = "";
			this.placeholder = "";
			this.label = "";
			this.helperText = "";
			this.tooltip = null;
			this._tooltip = new FieldTooltipController(this, () => this.tooltip);
			this._validation = new FieldValidationController(this, () => ({
				position: this.validationPosition,
				...this._validationNotice ?? {
					state: void 0,
					text: void 0
				},
				suppressed: false
			}), () => this.renderRoot?.querySelector?.("[mono-textarea] > textarea[mono-native]"));
			this.validationState = "default";
			this.validationMessage = "";
			this.errorMessage = "";
			this.successMessage = "";
			this.disabled = false;
			this.readonly = false;
			this.required = false;
			this.autofocus = false;
			this.autoResize = false;
			this.showCounter = false;
			this.cssClass = {};
			this.cssClassName = "";
			this._hasLabelSlotState = false;
			this._hasHelperSlotState = false;
			this._textareaId = `mono-textarea-${Math.random().toString(36).slice(2)}`;
			this._messageId = `${this._textareaId}-message`;
			this._lastAutoResizeWidth = -1;
			defineHybridPropAliases(this, [
				"labelPosition",
				"validationPosition",
				"modelValue",
				"helperText",
				"validationState",
				"validationMessage",
				"errorMessage",
				"successMessage",
				"autoResize",
				"minRows",
				"maxRows",
				"minLength",
				"maxLength",
				"showCounter",
				"ariaLabelText",
				"cssClass",
				"minWidth",
				"maxWidth",
				"minHeight",
				"maxHeight"
			]);
			/**
			* Vue support:
			*
			* <mono-textarea :cssClass="{}" />
			* <mono-textarea :css-class="{}" />
			* <mono-textarea :cssclass="{}" />
			*/
			Object.defineProperty(this, "css-class", {
				get: () => this.cssClass,
				set: (value) => {
					this._setCssClass(value);
				},
				configurable: true,
				enumerable: false
			});
			Object.defineProperty(this, "cssclass", {
				get: () => this.cssClass,
				set: (value) => {
					this._setCssClass(value);
				},
				configurable: true,
				enumerable: false
			});
			Object.defineProperty(this, "ariaLabel", {
				get: () => this.ariaLabelText,
				set: (value) => {
					this.ariaLabelText = value == null ? void 0 : String(value);
				},
				configurable: true,
				enumerable: false
			});
			Object.defineProperty(this, "aria-label", {
				get: () => this.ariaLabelText,
				set: (value) => {
					this.ariaLabelText = value == null ? void 0 : String(value);
				},
				configurable: true,
				enumerable: false
			});
			Object.defineProperty(this, "arialabel", {
				get: () => this.ariaLabelText,
				set: (value) => {
					this.ariaLabelText = value == null ? void 0 : String(value);
				},
				configurable: true,
				enumerable: false
			});
			Object.defineProperty(this, "maxlength", {
				get: () => this.maxLength,
				set: (value) => {
					this.maxLength = this._toOptionalNumber(value);
				},
				configurable: true,
				enumerable: false
			});
			Object.defineProperty(this, "minlength", {
				get: () => this.minLength,
				set: (value) => {
					this.minLength = this._toOptionalNumber(value);
				},
				configurable: true,
				enumerable: false
			});
		}
		static get observedAttributes() {
			return [
				...super.observedAttributes ?? [],
				"modelvalue",
				"helpertext",
				"validationstate",
				"validationmessage",
				"errormessage",
				"successmessage",
				"autoresize",
				"minrows",
				"maxrows",
				"minlength",
				"maxlength",
				"showcounter",
				"arialabeltext",
				"arialabel",
				"css-class",
				"cssclass"
			];
		}
		attributeChangedCallback(name, oldValue, newValue) {
			super.attributeChangedCallback(name, oldValue, newValue);
			if (oldValue === newValue) return;
			if (name === "modelvalue") {
				this.modelValue = newValue ?? "";
				return;
			}
			if (name === "helpertext") {
				this.helperText = newValue ?? "";
				return;
			}
			if (name === "validationstate") {
				this.validationState = newValue ?? "default";
				return;
			}
			if (name === "validationmessage") {
				this.validationMessage = newValue ?? "";
				return;
			}
			if (name === "errormessage") {
				this.errorMessage = newValue ?? "";
				return;
			}
			if (name === "successmessage") {
				this.successMessage = newValue ?? "";
				return;
			}
			if (name === "autoresize") {
				this.autoResize = this._toBoolean(newValue);
				return;
			}
			if (name === "minrows") {
				this.minRows = this._toOptionalNumber(newValue);
				return;
			}
			if (name === "maxrows") {
				this.maxRows = this._toOptionalNumber(newValue);
				return;
			}
			if (name === "minlength") {
				this.minLength = this._toOptionalNumber(newValue);
				return;
			}
			if (name === "maxlength") {
				this.maxLength = this._toOptionalNumber(newValue);
				return;
			}
			if (name === "showcounter") {
				this.showCounter = this._toBoolean(newValue);
				return;
			}
			if (name === "arialabeltext" || name === "arialabel") {
				this.ariaLabelText = newValue ?? void 0;
				return;
			}
			if (name === "css-class" || name === "cssclass") this._setCssClass(newValue);
		}
		/** The validation message and its state — the same precedence the message row uses. */
		get _validationNotice() {
			if (this.validationMessage) return {
				state: this._resolvedValidationState,
				text: this.validationMessage
			};
			if (this.errorMessage) return {
				state: "invalid",
				text: this.errorMessage
			};
			if (this.successMessage) return {
				state: "valid",
				text: this.successMessage
			};
			return null;
		}
		/** The message that moved to the icon / float bubble, kept for assistive tech only. */
		_renderMovedMessage() {
			const notice = this._validationNotice;
			return html`<div
      class=${`${this._cls("mono-textarea-message", "message")} ${notice.state}`}
      mono-message=${notice.state}
      mono-sr-only
      role=${notice.state === "invalid" ? "alert" : nothing}
    >${notice.text}</div>`;
		}
		willUpdate(changed) {
			for (const key of [
				"disabled",
				"readonly",
				"required",
				"autofocus",
				"autoResize",
				"showCounter"
			]) {
				const v = this[key];
				if (typeof v !== "boolean") this[key] = this._toBoolean(v);
			}
			if (changed.has("modelValue") && this.value !== this.modelValue) this.value = this.modelValue ?? "";
			if (changed.has("value") && this.modelValue !== this.value) this.modelValue = String(this.value ?? "");
		}
		connectedCallback() {
			super.connectedCallback();
			if (isServer) return;
			this._setupAutoResizeObserver();
			this._syncAutoResize();
		}
		disconnectedCallback() {
			this._teardownAutoResizeObserver();
			super.disconnectedCallback();
		}
		firstUpdated() {
			if (isServer) return;
			if (this.autofocus) this.focus();
			this._syncAutoResize();
		}
		/**
		* Recompute the height when the element's WIDTH changes.
		*
		* The reconnect hook above only covers being moved; the same staleness happens on a
		* window resize, a sidebar opening, or any layout shift that renarrows the column.
		* Width is the real input to the height calculation, so watch it directly.
		*/
		_setupAutoResizeObserver() {
			if (isServer || this._autoResizeRo) return;
			if (typeof ResizeObserver === "undefined") return;
			this._autoResizeRo = new ResizeObserver(() => {
				if (!this.autoResize) return;
				const width = this.getBoundingClientRect().width;
				if (width === this._lastAutoResizeWidth) return;
				this._lastAutoResizeWidth = width;
				this._syncAutoResize();
			});
			this._autoResizeRo.observe(this);
		}
		_teardownAutoResizeObserver() {
			this._autoResizeRo?.disconnect();
			this._autoResizeRo = void 0;
			this._lastAutoResizeWidth = -1;
		}
		updated(changed) {
			super.updated(changed);
			if (isServer) return;
			if (changed.has("value") || changed.has("modelValue") || changed.has("autoResize") || changed.has("minRows") || changed.has("maxRows")) this._syncAutoResize();
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
				/**
				* Optional HTML object support:
				*
				* <mono-textarea css-class='{"root":"...", "field":"..."}'></mono-textarea>
				*/
				if (trimmed.startsWith("{") && trimmed.endsWith("}")) try {
					this.cssClass = JSON.parse(trimmed);
					return;
				} catch {}
				this.cssClassName = trimmed;
			}
		}
		_toBoolean(value) {
			if (typeof value === "boolean") return value;
			if (typeof value === "string") {
				const normalized = value.toLowerCase().trim();
				return normalized === "" || normalized === "true";
			}
			return Boolean(value);
		}
		_toOptionalNumber(value) {
			if (value === void 0 || value === null || value === "") return void 0;
			const parsed = Number(value);
			return Number.isFinite(parsed) ? parsed : void 0;
		}
		_cls(base, key) {
			const extra = this.cssClass?.[key];
			return extra ? `${base} ${extra}` : base;
		}
		get _hasLabelSlot() {
			return this._hasLabelSlotState;
		}
		get _hasHelperSlot() {
			return this._hasHelperSlotState;
		}
		get _resolvedValidationState() {
			if (this.validationState && this.validationState !== "default") return this.validationState;
			if (this.errorMessage) return "invalid";
			if (this.successMessage) return "valid";
			return "default";
		}
		get _wrapperClasses() {
			return [
				"mono-textarea",
				this.size,
				this.color,
				this.variant,
				this.disabled ? "disabled" : "",
				this.readonly ? "readonly" : "",
				this._resolvedValidationState !== "default" ? `is-${this._resolvedValidationState}` : "",
				this.value ? "has-value" : "",
				this.autoResize ? "auto-resize" : "",
				this.cssClassName,
				this.cssClass?.root
			].filter(Boolean).join(" ");
		}
		get _fieldClasses() {
			return [
				this._cls("mono-textarea-field", "field"),
				this.size,
				this.color,
				this.variant
			].filter(Boolean).join(" ");
		}
		/** `near` at 85% of the cap, `over` past it — the attribute twin of the class. */
		get _counterState() {
			const max = this.maxLength;
			if (max === void 0) return "default";
			const length = this.value.length;
			if (length > max) return "over";
			if (length >= Math.floor(max * .85)) return "near";
			return "default";
		}
		get _counterClass() {
			const length = this.value.length;
			const max = this.maxLength;
			if (max !== void 0 && length > max) return `${this._cls("mono-textarea-counter", "counter")} over`;
			if (max !== void 0 && length >= Math.floor(max * .85)) return `${this._cls("mono-textarea-counter", "counter")} near`;
			return this._cls("mono-textarea-counter", "counter");
		}
		get _shouldShowFooter() {
			return Boolean(this.validationMessage || this.errorMessage || this.successMessage || this.helperText || this._hasHelperSlot || this.showCounter);
		}
		_createModelDetail(args) {
			return {
				modelValue: args.modelValue,
				currentValue: args.modelValue,
				oldValue: args.oldValue,
				value: args.modelValue,
				name: this.name,
				sourceEvent: args.sourceEvent
			};
		}
		_emitInput(detail) {
			dispatchMonoEvent(this, "input", detail);
		}
		_emitChange(detail) {
			dispatchMonoEvent(this, "change", detail);
		}
		_handleInput(event) {
			if (this.disabled || this.readonly) return;
			const textarea = event.currentTarget;
			const oldValue = this.modelValue;
			const nextValue = textarea.value;
			this.value = nextValue;
			this.modelValue = nextValue;
			const detail = this._createModelDetail({
				modelValue: nextValue,
				oldValue,
				sourceEvent: event
			});
			this._emitInput(detail);
			this._syncAutoResize();
		}
		_handleChange(event) {
			if (this.disabled || this.readonly) return;
			const textarea = event.currentTarget;
			const oldValue = this.modelValue;
			const nextValue = textarea.value;
			this.value = nextValue;
			this.modelValue = nextValue;
			const detail = this._createModelDetail({
				modelValue: nextValue,
				oldValue,
				sourceEvent: event
			});
			this._emitChange(detail);
		}
		_syncAutoResize() {
			if (isServer) return;
			if (!this.autoResize || !this._textareaEl) return;
			const textarea = this._textareaEl;
			const computed = window.getComputedStyle(textarea);
			const lineHeight = Number.parseFloat(computed.lineHeight) || 20;
			const paddingTop = Number.parseFloat(computed.paddingTop) || 0;
			const paddingBottom = Number.parseFloat(computed.paddingBottom) || 0;
			const borderTop = Number.parseFloat(computed.borderTopWidth) || 0;
			const borderBottom = Number.parseFloat(computed.borderBottomWidth) || 0;
			const minRows = this.minRows ?? this.rows;
			const maxRows = this.maxRows;
			const minHeight = minRows !== void 0 ? lineHeight * minRows + paddingTop + paddingBottom + borderTop + borderBottom : void 0;
			const maxHeight = maxRows !== void 0 ? lineHeight * maxRows + paddingTop + paddingBottom + borderTop + borderBottom : void 0;
			textarea.style.height = "auto";
			let nextHeight = textarea.scrollHeight;
			if (minHeight !== void 0) nextHeight = Math.max(nextHeight, minHeight);
			if (maxHeight !== void 0) {
				nextHeight = Math.min(nextHeight, maxHeight);
				textarea.style.overflowY = textarea.scrollHeight > maxHeight ? "auto" : "hidden";
			} else textarea.style.overflowY = "hidden";
			textarea.style.height = `${nextHeight}px`;
		}
		_renderLabel() {
			const hasContent = !!this.label || this._hasLabelSlotState;
			if (!hasContent && !this._slotsAlwaysRender) return nothing;
			return html`
      <label
        class=${this._cls("mono-textarea-label", "label")}
        mono-label
        for=${this._textareaId}
        ?mono-empty=${!hasContent}
      >
        ${this._slotOutlet("label", this.label)}

        ${this.required ? html`
              <span class=${this._cls("mono-textarea-required", "required")} mono-required-mark>
                *
              </span>
            ` : nothing}
        ${this._tooltip.render()}
      </label>
    `;
		}
		_renderMessage() {
			if (this._validation.moved) return html`${this._renderHelperText()}${this._renderMovedMessage()}`;
			if (this.validationMessage) return html`
        <div
          class=${`${this._cls("mono-textarea-message", "message")} ${this._resolvedValidationState}`}
          mono-message=${this._resolvedValidationState}
        >
          ${this.validationMessage}
        </div>
      `;
			if (this.errorMessage) return html`
        <div class=${`${this._cls("mono-textarea-message", "message")} invalid`} mono-message="invalid">
          ${this.errorMessage}
        </div>
      `;
			if (this.successMessage) return html`
        <div class=${`${this._cls("mono-textarea-message", "message")} valid`} mono-message="valid">
          ${this.successMessage}
        </div>
      `;
			return this._renderHelperText();
		}
		_renderHelperText() {
			if (this.helperText || this._hasHelperSlot || this._slotsAlwaysRender) return html`
        <div
          class=${`${this._cls("mono-textarea-message", "message")} helper`}
          mono-message="helper"
          ?mono-empty=${!this.helperText && !this._hasHelperSlot}
        >
          ${this._slotOutlet("helper", this.helperText)}
        </div>
      `;
			return nothing;
		}
		_renderCounter() {
			if (!this.showCounter) return nothing;
			const max = this.maxLength;
			const length = this.value.length;
			return html`
      <div
        class=${this._counterClass}
        mono-counter
        ?mono-near=${this._counterState === "near"}
        ?mono-over=${this._counterState === "over"}
      >
        ${max !== void 0 ? `${length}/${max}` : length}
      </div>
    `;
		}
		_renderFooter() {
			if (!this._shouldShowFooter && !this._slotsAlwaysRender) return nothing;
			return html`
      <div
        class=${this._cls("mono-textarea-footer", "footer")}
        mono-footer
        ?mono-empty=${!this._shouldShowFooter}
      >
        <div class=${this.cssClass?.messageWrap ?? ""} mono-message-wrap>
          ${this._renderMessage()}
        </div>

        ${this._renderCounter()}
      </div>
    `;
		}
		/** Inline sizing applied to the root wrapper. */
		_sizeStyle() {
			return buildSizeStyle(this);
		}
		render() {
			const describedBy = this._shouldShowFooter ? this._messageId : void 0;
			const ariaLabel = this.ariaLabelText || this.label || this.placeholder || void 0;
			return html`
      <div
        class=${this._wrapperClasses}
        style=${styleMap(this._sizeStyle())}
        mono-textarea
        mono-size=${this.size === "md" ? nothing : this.size}
        mono-color=${this.color === "primary" ? nothing : this.color}
        mono-variant=${this.variant === "outlined" ? nothing : this.variant}
        mono-label-position=${this.labelPosition === "top" ? nothing : this.labelPosition}
        mono-validation-position=${this.validationPosition === "bottom" ? nothing : this.validationPosition}
        mono-validation-state=${this._resolvedValidationState === "default" ? nothing : this._resolvedValidationState}
        ?mono-disabled=${this.disabled}
        ?mono-readonly=${this.readonly}
        ?mono-required=${this.required}
        ?mono-auto-resize=${this.autoResize}
      >
        ${this._renderLabel()}

        ${this._validation.renderIcon({ anchored: true })}
        <textarea
          id=${this._textareaId}
          class=${this._fieldClasses}
          mono-native
          .value=${this.value}
          name=${ifDefined(this.name || void 0)}
          placeholder=${ifDefined(this.placeholder || void 0)}
          rows=${ifDefined(this.rows)}
          minlength=${ifDefined(this.minLength)}
          maxlength=${ifDefined(this.maxLength)}
          ?disabled=${this.disabled}
          ?readonly=${this.readonly}
          ?required=${this.required}
          aria-label=${ifDefined(ariaLabel)}
          aria-invalid=${this._resolvedValidationState === "invalid" ? "true" : "false"}
          aria-describedby=${ifDefined(describedBy)}
          @input=${this._handleInput}
          @change=${this._handleChange}
        ></textarea>

        <div id=${this._messageId} mono-message-outlet>
          ${this._renderFooter()}
        </div>

        ${this._validation.renderFloat()}
      </div>
    `;
		}
		focus(options) {
			this._textareaEl?.focus(options);
		}
		blur() {
			this._textareaEl?.blur();
		}
		select() {
			this._textareaEl?.select();
		}
		setSelectionRange(start, end, direction) {
			this._textareaEl?.setSelectionRange(start, end, direction);
		}
		/** Whether the slot regions render even when empty. Light: no. Shadow: yes —
		*  the native `<slot>`s must exist to project DSD content + be scanned
		*  (hidden via `[data-empty]` when empty). */
		get _slotsAlwaysRender() {
			return false;
		}
		_hasSlot(name) {
			return name === "label" ? this._hasLabelSlotState : this._hasHelperSlotState;
		}
		_setSlotState(name, has) {
			if (name === "label") this._hasLabelSlotState = has;
			else this._hasHelperSlotState = has;
		}
		/**
		* Slot outlet. Light build (default): a `data-mono-slot` placeholder the
		* captured light-DOM nodes are re-parented into when present, else the prop
		* `fallback`. Shadow build overrides this with a native `<slot name>`.
		*/
		_slotOutlet(name, fallback = nothing) {
			return this._hasSlot(name) ? html`<span data-mono-slot=${name}></span>` : html`${fallback}`;
		}
	}
	__decorate([property({ type: String })], MonoTextareaCoreClass.prototype, "size", void 0);
	__decorate([property({ type: String })], MonoTextareaCoreClass.prototype, "color", void 0);
	__decorate([property({ type: String })], MonoTextareaCoreClass.prototype, "variant", void 0);
	__decorate([property({
		type: String,
		attribute: "label-position"
	})], MonoTextareaCoreClass.prototype, "labelPosition", void 0);
	__decorate([property({
		type: String,
		attribute: "validation-position"
	})], MonoTextareaCoreClass.prototype, "validationPosition", void 0);
	__decorate([property({
		type: String,
		attribute: "model-value",
		reflect: true
	})], MonoTextareaCoreClass.prototype, "modelValue", void 0);
	__decorate([property({ type: String })], MonoTextareaCoreClass.prototype, "value", void 0);
	__decorate([property({ type: String })], MonoTextareaCoreClass.prototype, "name", void 0);
	__decorate([property({ type: String })], MonoTextareaCoreClass.prototype, "placeholder", void 0);
	__decorate([property({ type: String })], MonoTextareaCoreClass.prototype, "label", void 0);
	__decorate([property({
		type: String,
		attribute: "helper-text"
	})], MonoTextareaCoreClass.prototype, "helperText", void 0);
	__decorate([property()], MonoTextareaCoreClass.prototype, "tooltip", void 0);
	__decorate([property({
		type: String,
		attribute: "validation-state"
	})], MonoTextareaCoreClass.prototype, "validationState", void 0);
	__decorate([property({
		type: String,
		attribute: "validation-message"
	})], MonoTextareaCoreClass.prototype, "validationMessage", void 0);
	__decorate([property({
		type: String,
		attribute: "error-message"
	})], MonoTextareaCoreClass.prototype, "errorMessage", void 0);
	__decorate([property({
		type: String,
		attribute: "success-message"
	})], MonoTextareaCoreClass.prototype, "successMessage", void 0);
	__decorate([property({
		type: String,
		attribute: "aria-label"
	})], MonoTextareaCoreClass.prototype, "ariaLabelText", void 0);
	__decorate([property({
		reflect: true,
		converter: booleanStringConverter
	})], MonoTextareaCoreClass.prototype, "disabled", void 0);
	__decorate([property({
		reflect: true,
		converter: booleanStringConverter
	})], MonoTextareaCoreClass.prototype, "readonly", void 0);
	__decorate([property({
		reflect: true,
		converter: booleanStringConverter
	})], MonoTextareaCoreClass.prototype, "required", void 0);
	__decorate([property({
		reflect: true,
		converter: booleanStringConverter
	})], MonoTextareaCoreClass.prototype, "autofocus", void 0);
	__decorate([property({
		attribute: "auto-resize",
		reflect: true,
		converter: booleanStringConverter
	})], MonoTextareaCoreClass.prototype, "autoResize", void 0);
	__decorate([property({
		attribute: "show-counter",
		reflect: true,
		converter: booleanStringConverter
	})], MonoTextareaCoreClass.prototype, "showCounter", void 0);
	__decorate([property({ converter: numberStringConverter })], MonoTextareaCoreClass.prototype, "rows", void 0);
	__decorate([property({
		attribute: "min-rows",
		converter: numberStringConverter
	})], MonoTextareaCoreClass.prototype, "minRows", void 0);
	__decorate([property({
		attribute: "max-rows",
		converter: numberStringConverter
	})], MonoTextareaCoreClass.prototype, "maxRows", void 0);
	__decorate([property({
		attribute: "min-length",
		converter: numberStringConverter
	})], MonoTextareaCoreClass.prototype, "minLength", void 0);
	__decorate([property({
		attribute: "max-length",
		converter: numberStringConverter
	})], MonoTextareaCoreClass.prototype, "maxLength", void 0);
	__decorate([property({ attribute: false })], MonoTextareaCoreClass.prototype, "cssClass", void 0);
	__decorate([property({ attribute: false })], MonoTextareaCoreClass.prototype, "cssClassName", void 0);
	__decorate([state()], MonoTextareaCoreClass.prototype, "_hasLabelSlotState", void 0);
	__decorate([state()], MonoTextareaCoreClass.prototype, "_hasHelperSlotState", void 0);
	__decorate([query(".mono-textarea-field")], MonoTextareaCoreClass.prototype, "_textareaEl", void 0);
	__decorate([property({ type: String })], MonoTextareaCoreClass.prototype, "width", void 0);
	__decorate([property({ type: String })], MonoTextareaCoreClass.prototype, "height", void 0);
	__decorate([property({
		type: String,
		attribute: "min-width"
	})], MonoTextareaCoreClass.prototype, "minWidth", void 0);
	__decorate([property({
		type: String,
		attribute: "max-width"
	})], MonoTextareaCoreClass.prototype, "maxWidth", void 0);
	__decorate([property({
		type: String,
		attribute: "min-height"
	})], MonoTextareaCoreClass.prototype, "minHeight", void 0);
	__decorate([property({
		type: String,
		attribute: "max-height"
	})], MonoTextareaCoreClass.prototype, "maxHeight", void 0);
	return MonoTextareaCoreClass;
};

//#endregion
//#region src/components/textarea/mono-textarea.ts
let MonoTextarea = class MonoTextarea extends MonoTextareaCore(LitElement) {
	constructor(..._args) {
		super(..._args);
		this._slotsCaptured = false;
		this._slotLabel = [];
		this._slotHelper = [];
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
		this._placeSlot("helper", this._slotHelper);
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
			if (slotName === "helper") {
				node.removeAttribute("slot");
				this._slotHelper.push(node);
				capturedSlotNodes.add(node);
			}
		}
		this._hasLabelSlotState = this._slotLabel.length > 0;
		this._hasHelperSlotState = this._slotHelper.length > 0;
		for (const node of capturedSlotNodes) if (node.parentNode === this) this.removeChild(node);
	}
	_placeSlot(name, nodes) {
		if (!nodes.length) return;
		const target = this.querySelector(`[data-mono-slot="${name}"]`);
		if (!target) return;
		for (const node of nodes) placeSlotNode(target, node);
	}
};
MonoTextarea = __decorate([customElement("mono-textarea")], MonoTextarea);

//#endregion
//#region src/components/textarea/textarea-utils.ts
function validateTextareaProps(props) {
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
	const validVariants = [
		"outlined",
		"filled",
		"underlined"
	];
	const validStates = [
		"default",
		"valid",
		"invalid",
		"warning"
	];
	if (props.size && !validSizes.includes(props.size)) return false;
	if (props.color && !validColors.includes(props.color)) return false;
	if (props.variant && !validVariants.includes(props.variant)) return false;
	if (props.validationState && !validStates.includes(props.validationState)) return false;
	return true;
}

//#endregion
export { MonoTextarea, validateTextareaProps };