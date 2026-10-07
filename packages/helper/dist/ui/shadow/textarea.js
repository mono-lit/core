import { a as __decorate, f as customElement, i as withShadowUtilityStyles, l as defineHybridPropAliases, r as toShadowCss, s as booleanStringConverter, t as flushSsrHydration } from "../../hydration-flush-RB5Tz5nl.js";
import { t as dispatchMonoEvent } from "../../mono-event-Bi1qP9uN.js";
import { t as buildSizeStyle } from "../../css-size-DhHSVZJK.js";
import { t as MonoFormControlCore } from "../../form-control-core-B8d7k6vk.js";
import { LitElement, html, isServer, nothing, unsafeCSS } from "lit";
import { property, query, state } from "lit/decorators.js";
import { ifDefined } from "lit/directives/if-defined.js";
import { styleMap } from "lit/directives/style-map.js";
//#region src/components/textarea/textarea-core.ts
var numberStringConverter = {
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
var MonoTextareaCore = (superClass) => {
	class MonoTextareaCoreClass extends MonoFormControlCore(superClass) {
		constructor(...args) {
			super(...args);
			this.size = "md";
			this.color = "primary";
			this.variant = "outlined";
			this.modelValue = "";
			this.value = "";
			this.name = "";
			this.placeholder = "";
			this.label = "";
			this.helperText = "";
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
      </label>
    `;
		}
		_renderMessage() {
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
        mono-validation-state=${this._resolvedValidationState === "default" ? nothing : this._resolvedValidationState}
        ?mono-disabled=${this.disabled}
        ?mono-readonly=${this.readonly}
        ?mono-required=${this.required}
        ?mono-auto-resize=${this.autoResize}
      >
        ${this._renderLabel()}

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
//#region src/components/textarea/textarea.css?raw
var textarea_default = "/* =========================================================================\r\n   mono-textarea — a port of Basecoat's `.textarea` inside a `.field`\r\n   (basecoat-css@1.0.2, vega style).\r\n\r\n   Styled by ATTRIBUTE, like Basecoat — and the attributes mirror the element's\r\n   props one for one, so hand-written markup reads like the Lit / Vue tag:\r\n\r\n     <mono-textarea size=\"sm\" color=\"danger\" label=\"Notes\" placeholder=\"…\">\r\n     <div mono-textarea mono-size=\"sm\" mono-color=\"danger\">\r\n       <label mono-label>Notes</label>\r\n       <textarea mono-native placeholder=\"…\"></textarea>\r\n       <div mono-message-wrap><div mono-message=\"helper\">…</div></div>\r\n     </div>\r\n\r\n   An absent attribute is the prop's default (`:not([mono-size])` = md,\r\n   `:not([mono-color])` = primary, `:not([mono-variant])` = outlined). The\r\n   element renders these on its root (both builds) plus the states\r\n   `mono-disabled` / `mono-readonly` / `mono-required` / `mono-auto-resize` and\r\n   `mono-validation-state=\"valid|invalid|warning\"`. The old classes\r\n   (`.mono-textarea.md.primary.outlined`) are still emitted as inert hooks until\r\n   2.0 but no rule here reads them.\r\n\r\n   Selector map (ours ≡ upstream):\r\n     [mono-textarea]                               ≡ .field (flex w-full flex-col gap-3)\r\n     [mono-textarea] > [mono-label]                ≡ .field > label / .label\r\n     [mono-native]                                 ≡ .field > textarea / .textarea\r\n                                                     (field-sizing-content min-h-16 w-full rounded-md\r\n                                                      border-input bg-transparent px-2.5 py-2 shadow-xs\r\n                                                      text-base md:text-sm, focus ring-3 ring-ring/50)\r\n     [mono-message-wrap] > [mono-message=\"…\"]      ≡ .field > p / .field [role='alert']\r\n     [mono-validation-state=\"invalid\"]             ≡ aria-invalid:border-destructive aria-invalid:ring-destructive/20\r\n     [mono-validation-state=\"valid|warning\"]       ≡ EXTENSION (the same treatment in --success / --warning)\r\n     [mono-size=\"xs|sm|lg|xl|xxl\"]                 ≡ EXTENSION (Basecoat sizes only the select; the\r\n                                                     ladder is --mono-control-height-*)\r\n     [mono-variant=\"filled\"]                       ≡ EXTENSION (luma/mira/rhea's textarea: bg-input/50, no shadow)\r\n     [mono-variant=\"underlined\"]                   ≡ EXTENSION (sera's: border-transparent border-b-input,\r\n                                                     rounded-none px-0, the ring on the bottom edge only)\r\n     [mono-counter], [mono-footer]                 ≡ EXTENSION (the character counter row)\r\n\r\n   A textarea must NOT be --mono-control-height-* tall — it is multi-line — but\r\n   its metrics DERIVE from that token, or retuning the ladder leaves it behind:\r\n\r\n     padY       = (T - L) / 2 - B\r\n     min-height = ROWS x L + 2*padY + 2*B  =  T + (ROWS - 1) x L\r\n\r\n   with T the control height, L one text line (font x line-height) and B the\r\n   border. The first puts the textarea's FIRST line box at the same offset as an\r\n   input's single line, so the two start their text on the same baseline side by\r\n   side; the second reads as \"one input tall, plus N-1 lines\". ROWS is the only\r\n   per-size literal. (Upstream's own `min-h-16` is a flat 64px; the derivation is\r\n   mono's, and `field-sizing: content` still grows the box from there.)\r\n\r\n   Specificity contract (same as the pre-port class sheet): a part's RESTING rule\r\n   is exactly one attribute strong — `:where([mono-textarea]) [mono-native]` =\r\n   (0,1,0) — so a utility class handed in through `cssClass` wins by source\r\n   order, while the prop and state rules stay heavier and win over it.\r\n\r\n   Inner parts: [mono-label] (+ [mono-required-mark]), [mono-native],\r\n   [mono-footer] > [mono-message-wrap] > [mono-message=\"helper|valid|invalid|\r\n   warning\"] / [mono-counter] (+ [mono-near], [mono-over]). The shadow build\r\n   marks an unassigned slot wrapper [mono-empty].\r\n\r\n   FLAVORS set `--mono-textarea-{radius,padding-x-<size>,padding-y-<size>,\r\n   font-<size>,line-height,ring-width,ring-alpha,gap,resize,bg,border-color,\r\n   shadow}` and the outline-scoped `--mono-textarea-outline-*`; every fallback\r\n   here is vega's value\r\n   (`node scripts/basecoat-styles.mjs --varying \"textarea\"`).\r\n   ========================================================================= */\r\n\r\nmono-textarea {\r\n  display: block;\r\n}\r\n\r\n[mono-textarea] {\r\n  /* ── palette: each slot is a public knob over a Basecoat token ─────────── */\r\n  --_mono-textarea-text: var(--mono-textarea-color, var(--mono-textarea-text, var(--foreground)));\r\n  --_mono-textarea-placeholder: var(--mono-textarea-placeholder, var(--muted-foreground));\r\n  --_mono-textarea-muted: var(--mono-textarea-muted, var(--muted-foreground));\r\n  /* the `color` prop picks the FOCUS colour; primary is Basecoat's `--ring` */\r\n  --_mono-textarea-primary: var(--mono-textarea-primary, var(--ring));\r\n  --_mono-textarea-secondary: var(--mono-textarea-secondary, var(--muted-foreground));\r\n  --_mono-textarea-success: var(--mono-textarea-success, var(--success));\r\n  --_mono-textarea-danger: var(--mono-textarea-danger, var(--destructive));\r\n  --_mono-textarea-warning: var(--mono-textarea-warning, var(--warning));\r\n  --_mono-textarea-info: var(--mono-textarea-info, var(--info));\r\n  --_mono-textarea-teal: var(--mono-textarea-teal, var(--teal));\r\n  --_mono-textarea-purple: var(--mono-textarea-purple, var(--purple));\r\n  --_mono-textarea-neutral: var(--mono-textarea-neutral, var(--neutral));\r\n  --_mono-textarea-dark: var(--mono-textarea-dark, var(--dark));\r\n  --_mono-textarea-valid: var(--mono-textarea-valid, var(--success));\r\n  --_mono-textarea-invalid: var(--mono-textarea-invalid, var(--destructive));\r\n\r\n  /* ── the painted result — three tiers, base = vega's .textarea ─────────── */\r\n  --_mono-textarea-ring-color: var(--mono-textarea-ring-color, var(--mono-textarea-focus-color, var(--_mono-textarea-ring-color-preset, var(--_mono-textarea-primary))));\r\n  --_mono-textarea-ring-width: var(--mono-textarea-ring-width, var(--_mono-textarea-ring-width-preset, var(--mono-ring-width)));\r\n  --_mono-textarea-ring-alpha: var(--mono-textarea-ring-alpha, var(--mono-ring-alpha));\r\n  --_mono-textarea-border-color: var(--mono-textarea-rest-border, var(--mono-textarea-border-color, var(--_mono-textarea-border-color-preset, var(--input))));\r\n  --_mono-textarea-side-border-color: var(--_mono-textarea-side-border-color-preset, var(--_mono-textarea-border-color));\r\n  --_mono-textarea-bg: var(--mono-textarea-bg, var(--mono-textarea-surface, var(--_mono-textarea-bg-preset, var(--mono-mode-surface))));\r\n  --_mono-textarea-shadow: var(--mono-textarea-shadow, var(--_mono-textarea-shadow-preset, var(--mono-shadow-xs)));\r\n  --_mono-textarea-border-width: var(--mono-textarea-border-width, var(--mono-border-width));\r\n  --_mono-textarea-radius: var(--mono-textarea-radius, var(--_mono-textarea-radius-preset, var(--mono-radius-md)));\r\n\r\n  /* ── md metrics live on the unqualified root ON PURPOSE: hand-written\r\n        `<div mono-textarea>` that names no size renders exactly like size=\"md\".\r\n        basecoat@1.0.2 styles/vega.css .textarea — px-2.5 py-2 text-base md:text-sm ── */\r\n  --_mono-textarea-height: var(--mono-textarea-height-md, var(--mono-control-height-md));\r\n  --_mono-textarea-padding-x: var(--mono-textarea-padding-x-md, var(--_mono-textarea-padding-x-preset, calc(var(--mono-spacing) * 2.5)));\r\n  --_mono-textarea-font-size: var(--mono-textarea-font-md, var(--mono-text-sm));\r\n  --_mono-textarea-line-height: var(--mono-textarea-line-height, var(--mono-textarea-line-height-md, var(--mono-leading-normal)));\r\n  --_mono-textarea-rows: var(--mono-textarea-rows, var(--mono-textarea-rows-md, 4));\r\n\r\n  /* one text line, and the two derived metrics that hang off it */\r\n  --_mono-textarea-line: calc(var(--_mono-textarea-font-size) * var(--_mono-textarea-line-height));\r\n  --_mono-textarea-padding-y: var(\r\n    --mono-textarea-padding-y,\r\n    max(0px, calc((var(--_mono-textarea-height) - var(--_mono-textarea-line)) / 2 - var(--_mono-textarea-border-width)))\r\n  );\r\n  --_mono-textarea-min-height: var(\r\n    --mono-textarea-min-height,\r\n    calc(var(--_mono-textarea-height) + (var(--_mono-textarea-rows) - 1) * var(--_mono-textarea-line))\r\n  );\r\n\r\n  /* basecoat@1.0.2 styles/vega.css .field — flex w-full flex-col gap-3 */\r\n  display: flex;\r\n  flex-direction: column;\r\n  gap: var(--mono-textarea-gap, calc(var(--mono-spacing) * 3));\r\n  width: 100%;\r\n  min-width: 0;\r\n  color: var(--_mono-textarea-text);\r\n  font-family: inherit;\r\n}\r\n\r\n[mono-textarea],\r\n:where([mono-textarea]) *,\r\n:where([mono-textarea]) *::before,\r\n:where([mono-textarea]) *::after {\r\n  box-sizing: border-box;\r\n}\r\n\r\n/* The element wraps the footer in an aria-describedby outlet; hand-written markup\r\n   has no such wrapper. It is a flex child either way, so an EMPTY outlet still\r\n   paid the root's `gap` and made the element stand taller than the same raw\r\n   markup. The shadow build always RENDERS the footer and marks it empty, so the\r\n   test is for a footer that is actually showing. */\r\n[mono-textarea] > [mono-message-outlet]:not(:has([mono-footer]:not([mono-empty]))) {\r\n  display: none;\r\n}\r\n\r\n/* the shadow build renders every region and marks the empty ones; the light\r\n   build renders only what exists. Out-specifies the region rules on purpose —\r\n   a zero-weight hide would tie with them and lose on source order. */\r\n[mono-textarea] :is([mono-label], [mono-message], [mono-footer], [mono-counter])[mono-empty] {\r\n  display: none;\r\n}\r\n\r\n/* =========================================\r\n   Sizes — EXTENSION: Basecoat sizes only the select, so the ladder is\r\n   --mono-control-height-* and the derivation above\r\n   ========================================= */\r\n\r\n[mono-textarea][mono-size=\"xs\"] {\r\n  --_mono-textarea-height: var(--mono-textarea-height-xs, var(--mono-control-height-xs));\r\n  --_mono-textarea-padding-x: var(--mono-textarea-padding-x-xs, var(--_mono-textarea-padding-x-preset, calc(var(--mono-spacing) * 2)));\r\n  --_mono-textarea-font-size: var(--mono-textarea-font-xs, var(--mono-text-xs));\r\n  --_mono-textarea-rows: var(--mono-textarea-rows, var(--mono-textarea-rows-xs, 3));\r\n}\r\n\r\n[mono-textarea][mono-size=\"sm\"] {\r\n  --_mono-textarea-height: var(--mono-textarea-height-sm, var(--mono-control-height-sm));\r\n  --_mono-textarea-padding-x: var(--mono-textarea-padding-x-sm, var(--_mono-textarea-padding-x-preset, calc(var(--mono-spacing) * 2.5)));\r\n  --_mono-textarea-font-size: var(--mono-textarea-font-sm, var(--mono-textarea-font-md, var(--mono-text-sm)));\r\n  --_mono-textarea-rows: var(--mono-textarea-rows, var(--mono-textarea-rows-sm, 3));\r\n}\r\n\r\n[mono-textarea][mono-size=\"lg\"] {\r\n  --_mono-textarea-height: var(--mono-textarea-height-lg, var(--mono-control-height-lg));\r\n  --_mono-textarea-padding-x: var(--mono-textarea-padding-x-lg, var(--_mono-textarea-padding-x-preset, calc(var(--mono-spacing) * 2.5)));\r\n  --_mono-textarea-font-size: var(--mono-textarea-font-lg, var(--mono-textarea-font-md, var(--mono-text-sm)));\r\n  --_mono-textarea-rows: var(--mono-textarea-rows, var(--mono-textarea-rows-lg, 4));\r\n}\r\n\r\n[mono-textarea][mono-size=\"xl\"] {\r\n  --_mono-textarea-height: var(--mono-textarea-height-xl, var(--mono-control-height-xl));\r\n  --_mono-textarea-padding-x: var(--mono-textarea-padding-x-xl, var(--_mono-textarea-padding-x-preset, calc(var(--mono-spacing) * 3)));\r\n  --_mono-textarea-font-size: var(--mono-textarea-font-xl, var(--mono-text-base));\r\n  --_mono-textarea-rows: var(--mono-textarea-rows, var(--mono-textarea-rows-xl, 5));\r\n}\r\n\r\n[mono-textarea][mono-size=\"xxl\"] {\r\n  --_mono-textarea-height: var(--mono-textarea-height-xxl, var(--mono-control-height-xxl));\r\n  --_mono-textarea-padding-x: var(--mono-textarea-padding-x-xxl, var(--_mono-textarea-padding-x-preset, calc(var(--mono-spacing) * 3)));\r\n  --_mono-textarea-font-size: var(--mono-textarea-font-xxl, var(--mono-text-base));\r\n  --_mono-textarea-rows: var(--mono-textarea-rows, var(--mono-textarea-rows-xxl, 5));\r\n}\r\n\r\n/* =========================================\r\n   Colours — EXTENSION: the `color` prop is the FOCUS colour, nothing else\r\n   ========================================= */\r\n\r\n[mono-textarea][mono-color=\"secondary\"] {\r\n  --_mono-textarea-ring-color-preset: var(--_mono-textarea-secondary);\r\n}\r\n[mono-textarea][mono-color=\"success\"] {\r\n  --_mono-textarea-ring-color-preset: var(--_mono-textarea-success);\r\n}\r\n[mono-textarea][mono-color=\"danger\"] {\r\n  --_mono-textarea-ring-color-preset: var(--_mono-textarea-danger);\r\n}\r\n[mono-textarea][mono-color=\"warning\"] {\r\n  --_mono-textarea-ring-color-preset: var(--_mono-textarea-warning);\r\n}\r\n[mono-textarea][mono-color=\"info\"] {\r\n  --_mono-textarea-ring-color-preset: var(--_mono-textarea-info);\r\n}\r\n[mono-textarea][mono-color=\"teal\"] {\r\n  --_mono-textarea-ring-color-preset: var(--_mono-textarea-teal);\r\n}\r\n[mono-textarea][mono-color=\"purple\"] {\r\n  --_mono-textarea-ring-color-preset: var(--_mono-textarea-purple);\r\n}\r\n[mono-textarea][mono-color=\"neutral\"] {\r\n  --_mono-textarea-ring-color-preset: var(--_mono-textarea-neutral);\r\n}\r\n[mono-textarea][mono-color=\"dark\"] {\r\n  --_mono-textarea-ring-color-preset: var(--_mono-textarea-dark);\r\n}\r\n\r\n/* =========================================\r\n   Label\r\n   ========================================= */\r\n\r\n/* basecoat@1.0.2 styles/vega.css .field > label, .label\r\n   — text-sm leading-snug font-medium */\r\n:where([mono-textarea]) > [mono-label] {\r\n  display: flex;\r\n  align-items: center;\r\n  gap: calc(var(--mono-spacing) * 1);\r\n  font-size: var(--mono-textarea-label-font-size, var(--mono-text-sm));\r\n  line-height: var(--mono-textarea-label-line-height, var(--mono-leading-snug));\r\n  font-weight: var(--mono-textarea-label-font-weight, var(--mono-label-font-weight, var(--mono-font-weight-medium)));\r\n  color: var(--mono-textarea-label-color, var(--_mono-textarea-text));\r\n}\r\n\r\n[mono-textarea][mono-validation-state=\"invalid\"] > [mono-label] {\r\n  color: var(--mono-textarea-label-color, var(--_mono-textarea-invalid));\r\n}\r\n\r\n:where([mono-textarea]) [mono-required-mark] {\r\n  color: var(--mono-textarea-required-color, var(--destructive));\r\n}\r\n\r\n/* =========================================\r\n   The field\r\n   ========================================= */\r\n\r\n/* basecoat@1.0.2 components/textarea.css .field > textarea, .textarea\r\n   — flex field-sizing-content min-h-16 w-full outline-none\r\n   placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50 */\r\n/* basecoat@1.0.2 styles/vega.css .field > textarea, .textarea\r\n   — rounded-md border border-input bg-transparent px-2.5 py-2 text-base md:text-sm\r\n   shadow-xs transition-[color,box-shadow] (dark:bg-input/30 via --mono-mode-surface);\r\n   mono: `--tw-ring-*` flattened to the ring + shadow slots, and the height is\r\n   derived from the control step rather than upstream's flat min-h-16 */\r\n:where([mono-textarea]) [mono-native] {\r\n  --_mono-textarea-ring: 0 0 #0000;\r\n  display: block;\r\n  width: 100%;\r\n  min-width: 0;\r\n  min-height: var(--_mono-textarea-min-height);\r\n  padding: var(--_mono-textarea-padding-y) var(--_mono-textarea-padding-x);\r\n  border: var(--_mono-textarea-border-width) solid var(--_mono-textarea-border-color);\r\n  border-radius: var(--_mono-textarea-radius);\r\n  background-color: var(--_mono-textarea-bg);\r\n  color: var(--_mono-textarea-text);\r\n  font-family: inherit;\r\n  font-size: var(--_mono-textarea-font-size);\r\n  line-height: var(--_mono-textarea-line-height);\r\n  resize: var(--mono-textarea-resize, vertical);\r\n  outline: none;\r\n  box-shadow: var(--_mono-textarea-ring), var(--_mono-textarea-shadow);\r\n  transition-property: color, background-color, border-color, box-shadow;\r\n  transition-timing-function: var(--mono-ease);\r\n  transition-duration: var(--mono-duration);\r\n}\r\n\r\n/* Upstream grows the box with `field-sizing: content`, which has no ceiling.\r\n   mono's `auto-resize` is a JS height instead, BECAUSE it honours `min-rows` and\r\n   `max-rows` — so this rule must not hand the sizing back to the browser, or the\r\n   two fight over the height. All the attribute does here is drop the manual grip:\r\n   a box that resizes itself should not also offer one. */\r\n[mono-textarea][mono-auto-resize] > [mono-native] {\r\n  resize: var(--mono-textarea-resize, none);\r\n}\r\n\r\n/* placeholder:text-muted-foreground */\r\n:where([mono-textarea]) [mono-native]::placeholder {\r\n  color: var(--_mono-textarea-placeholder);\r\n  opacity: 1;\r\n}\r\n\r\n/* focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 */\r\n:where([mono-textarea]) [mono-native]:focus-visible,\r\n:where([mono-textarea]) [mono-native]:focus {\r\n  border-color: var(--_mono-textarea-ring-color);\r\n  --_mono-textarea-ring: 0 0 0 var(--_mono-textarea-ring-width) color-mix(in oklab, var(--_mono-textarea-ring-color) var(--_mono-textarea-ring-alpha), transparent);\r\n}\r\n\r\n/* aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20\r\n   (dark: /50 and /40, carried by the mode tokens) */\r\n[mono-textarea][mono-validation-state=\"invalid\"] > [mono-native],\r\n:where([mono-textarea]) [mono-native][aria-invalid=\"true\"] {\r\n  --_mono-textarea-border-color: var(--mono-mode-invalid-border);\r\n  --_mono-textarea-ring: 0 0 0 var(--_mono-textarea-ring-width) var(--mono-mode-invalid-ring);\r\n}\r\n\r\n/* EXTENSION — the same treatment in the success / warning roles */\r\n[mono-textarea][mono-validation-state=\"valid\"] > [mono-native] {\r\n  --_mono-textarea-border-color: color-mix(in oklab, var(--_mono-textarea-valid) var(--mono-mode-state-border-alpha), transparent);\r\n  --_mono-textarea-ring: 0 0 0 var(--_mono-textarea-ring-width) color-mix(in oklab, var(--_mono-textarea-valid) var(--mono-mode-state-ring-alpha), transparent);\r\n}\r\n\r\n[mono-textarea][mono-validation-state=\"warning\"] > [mono-native] {\r\n  --_mono-textarea-border-color: color-mix(in oklab, var(--_mono-textarea-warning) var(--mono-mode-state-border-alpha), transparent);\r\n  --_mono-textarea-ring: 0 0 0 var(--_mono-textarea-ring-width) color-mix(in oklab, var(--_mono-textarea-warning) var(--mono-mode-state-ring-alpha), transparent);\r\n}\r\n\r\n/* disabled:cursor-not-allowed disabled:opacity-50 */\r\n[mono-textarea][mono-disabled] > [mono-native],\r\n:where([mono-textarea]) [mono-native]:disabled {\r\n  cursor: not-allowed;\r\n  opacity: 0.5;\r\n  background-color: var(--mono-textarea-disabled-bg, var(--_mono-textarea-bg));\r\n}\r\n\r\n/* EXTENSION — readonly is legible, not dimmed: a muted surface and no caret */\r\n[mono-textarea][mono-readonly] > [mono-native],\r\n:where([mono-textarea]) [mono-native]:read-only:not(:disabled) {\r\n  background-color: var(--mono-textarea-readonly-bg, var(--muted));\r\n  cursor: default;\r\n}\r\n\r\n/* =========================================\r\n   Variants — EXTENSION: the two other looks Basecoat's styles ship\r\n   ========================================= */\r\n\r\n/* `outlined` is the default and IS vega's textarea. The `--mono-textarea-outline-*`\r\n   knobs are how a FLAVOR restyles this variant alone: writing the shared\r\n   `--mono-textarea-bg` would repaint `filled` and `underlined` too (the public\r\n   tier out-ranks a variant's preset), which is exactly what made every style's\r\n   underlined textarea come out as a filled box. */\r\n[mono-textarea]:is(:not([mono-variant]), [mono-variant=\"outlined\"]) {\r\n  --_mono-textarea-bg-preset: var(--mono-textarea-outline-bg);\r\n  --_mono-textarea-border-color-preset: var(--mono-textarea-outline-border-color);\r\n  --_mono-textarea-side-border-color-preset: var(--mono-textarea-outline-side-border-color);\r\n  --_mono-textarea-shadow-preset: var(--mono-textarea-outline-shadow, var(--mono-shadow-xs));\r\n  --_mono-textarea-radius-preset: var(--mono-textarea-outline-radius);\r\n  --_mono-textarea-padding-x-preset: var(--mono-textarea-outline-padding-x);\r\n  --_mono-textarea-ring-width-preset: var(--mono-textarea-outline-ring-width);\r\n}\r\n\r\n/* `filled` ≡ luma / mira / rhea's textarea: a tinted surface, no border, no shadow */\r\n[mono-textarea][mono-variant=\"filled\"] {\r\n  --_mono-textarea-bg-preset: var(--mono-textarea-filled-bg, color-mix(in oklab, var(--input) 50%, transparent));\r\n  --_mono-textarea-border-color-preset: transparent;\r\n  --_mono-textarea-shadow-preset: 0 0 #0000;\r\n}\r\n\r\n/* `underlined` ≡ sera's: square, the bottom edge only, and the ring rides that\r\n   edge instead of wrapping the box (never `box-shadow: none` — the resting slot\r\n   is neutralised so a focus rule can still fill it) */\r\n[mono-textarea][mono-variant=\"underlined\"] {\r\n  --_mono-textarea-radius-preset: 0;\r\n  --_mono-textarea-bg-preset: transparent;\r\n  /* the bottom edge keeps --_mono-textarea-border-color; only the other three\r\n     sides are cleared, through the side slot */\r\n  --_mono-textarea-side-border-color-preset: transparent;\r\n  --_mono-textarea-shadow-preset: 0 0 #0000;\r\n  --_mono-textarea-padding-x-preset: 0px;\r\n  --_mono-textarea-ring-width-preset: 0px;\r\n}\r\n\r\n[mono-textarea][mono-variant=\"underlined\"] > [mono-native],\r\n[mono-textarea]:is(:not([mono-variant]), [mono-variant=\"outlined\"]) > [mono-native] {\r\n  border-color: var(--_mono-textarea-side-border-color);\r\n  border-bottom-color: var(--_mono-textarea-border-color);\r\n}\r\n\r\n[mono-textarea][mono-variant=\"underlined\"] > [mono-native]:is(:focus, :focus-visible) {\r\n  border-color: var(--_mono-textarea-side-border-color);\r\n  border-bottom-color: var(--_mono-textarea-ring-color);\r\n}\r\n\r\n/* =========================================\r\n   Footer — EXTENSION: the message row and the character counter\r\n   ========================================= */\r\n\r\n/* basecoat@1.0.2 styles/vega.css .fieldset legend + p, .field > p, .field section > p\r\n   — text-sm text-muted-foreground leading-normal font-normal */\r\n:where([mono-textarea]) > [mono-footer] {\r\n  display: flex;\r\n  align-items: flex-start;\r\n  justify-content: space-between;\r\n  gap: calc(var(--mono-spacing) * 2);\r\n}\r\n\r\n:where([mono-textarea]) [mono-message-wrap] {\r\n  flex: 1 1 auto;\r\n  min-width: 0;\r\n}\r\n\r\n:where([mono-textarea]) [mono-message] {\r\n  font-size: var(--mono-textarea-message-font-size, var(--mono-text-sm));\r\n  line-height: var(--mono-textarea-message-line-height, var(--mono-leading-normal));\r\n  color: var(--_mono-textarea-muted);\r\n}\r\n\r\n/* .field [role='alert'] — the invalid message is the destructive one */\r\n:where([mono-textarea]) [mono-message=\"invalid\"] {\r\n  color: var(--_mono-textarea-invalid);\r\n}\r\n\r\n:where([mono-textarea]) [mono-message=\"valid\"] {\r\n  color: var(--_mono-textarea-valid);\r\n}\r\n\r\n:where([mono-textarea]) [mono-message=\"warning\"] {\r\n  color: var(--_mono-textarea-warning);\r\n}\r\n\r\n:where([mono-textarea]) [mono-counter] {\r\n  flex: 0 0 auto;\r\n  font-size: var(--mono-textarea-counter-font-size, var(--mono-text-xs));\r\n  line-height: var(--mono-leading-normal);\r\n  font-variant-numeric: tabular-nums;\r\n  color: var(--_mono-textarea-muted);\r\n}\r\n\r\n:where([mono-textarea]) [mono-counter][mono-near] {\r\n  color: var(--_mono-textarea-warning);\r\n}\r\n\r\n:where([mono-textarea]) [mono-counter][mono-over] {\r\n  color: var(--_mono-textarea-invalid);\r\n  font-weight: var(--mono-font-weight-medium);\r\n}\r\n\r\n@media (prefers-reduced-motion: reduce) {\r\n  :where([mono-textarea]) [mono-native] {\r\n    transition: none;\r\n  }\r\n}\r\n";
//#endregion
//#region src/components/textarea/mono-textarea.shadow.ts
var SHADOW_EXTRA_CSS = "";
var MonoTextareaShadow = class MonoTextareaShadow extends withShadowUtilityStyles(MonoTextareaCore(LitElement)) {
	static {
		this.disableWarning?.("change-in-update");
	}
	static {
		this.styles = [unsafeCSS(toShadowCss(textarea_default, {
			host: "mono-textarea",
			append: SHADOW_EXTRA_CSS
		}))];
	}
	get _slotsAlwaysRender() {
		return true;
	}
	connectedCallback() {
		super.connectedCallback();
		if (isServer) return;
		flushSsrHydration(this);
	}
	firstUpdated(changed) {
		super.firstUpdated?.(changed);
		if (isServer) return;
		this._scanSlots();
	}
	updated(changed) {
		super.updated(changed);
		if (!isServer) this._scanSlots();
	}
	_slotFor(name) {
		return this.renderRoot.querySelector(`slot[name="${name}"]`);
	}
	_slotHasContent(slot) {
		return !!slot && slot.assignedNodes({ flatten: true }).some((n) => n.nodeType === Node.ELEMENT_NODE || !!(n.textContent ?? "").trim());
	}
	_onSlotChange(name, event) {
		this._setSlotState(name, this._slotHasContent(event.target));
	}
	/** Reconcile the 2 slot-presence flags from their slots' assigned content. */
	_scanSlots() {
		for (const name of ["label", "helper"]) {
			const has = this._slotHasContent(this._slotFor(name));
			if (has !== (name === "label" ? this._hasLabelSlotState : this._hasHelperSlotState)) this._setSlotState(name, has);
		}
	}
	/** Native `<slot>` carrying the prop fallback as native slot content. */
	_slotOutlet(name, fallback = nothing) {
		return html`<slot
      name=${name}
      @slotchange=${(e) => this._onSlotChange(name, e)}
      >${fallback}</slot
    >`;
	}
};
MonoTextareaShadow = __decorate([customElement("mono-shadow-textarea")], MonoTextareaShadow);
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
export { MonoTextareaCore, MonoTextareaShadow, validateTextareaProps };
