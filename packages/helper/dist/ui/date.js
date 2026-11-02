import { d as buildSizeStyle } from "../mono-ui-jtBvJ9d5.js";
import { t as customElement } from "../mono-element-9uQRbp5X.js";
import { a as defineHybridPropAliases, r as booleanStringConverter, t as __decorate } from "../decorate-DbYFpi8R.js";
import { t as dispatchMonoEvent } from "../mono-event-BPku9HpS.js";
import { t as MonoFormControlCore } from "../form-control-core-CRZPZ1ru.js";
import { t as FieldTooltipController } from "../field-tooltip-Csk4s2ve.js";
import { t as FieldValidationController } from "../field-validation-CFmUmuDx.js";
import { LitElement, html, isServer, nothing } from "lit";
import { property, query, state } from "lit/decorators.js";
import { ifDefined } from "lit/directives/if-defined.js";
import { styleMap } from "lit/directives/style-map.js";

//#region src/components/date/date-core.ts
const numberStringConverter = {
	fromAttribute(value) {
		if (value === null || value === "") return void 0;
		const parsed = Number(value);
		return Number.isFinite(parsed) ? parsed : void 0;
	},
	toAttribute(value) {
		return value === void 0 || value === null ? null : String(value);
	}
};
let _uid = 0;
/**
* `MonoDateCore` — render-mode-agnostic logic for `mono-date` (props, hybrid
* aliases, flatpickr instance lifecycle, validation/state, and the full
* `render()`). SSR-safe: all DOM/`window` access (flatpickr init in
* `firstUpdated`, the accent read in `_onReady`) is `isServer`-guarded, so the
* server emits only the field markup and flatpickr is created on the client after
* hydration. Each build supplies `createRenderRoot()` + `static styles`. Mirrors
* `textarea-core`/`switch-core`.
*
* `mono-date` has no named slots — all content comes from props — so there is no
* slot capture/scan machinery here. The calendar popup is owned by flatpickr
* (appended to `<body>`, client-only, styled by the global bundle), so this needs
* no `PopupPortalController`/`popup-stack`.
*/
const MonoDateCore = (superClass) => {
	class MonoDateCoreClass extends MonoFormControlCore(superClass) {
		constructor(...args) {
			super(...args);
			this.type = "date";
			this.modelValue = "";
			this.size = "md";
			this.color = "primary";
			this.variant = "outlined";
			this.labelPosition = "top";
			this.validationPosition = "bottom";
			this.tooltip = null;
			this._tooltip = new FieldTooltipController(this, () => this.tooltip);
			this._validation = new FieldValidationController(this, () => ({
				position: this.validationPosition,
				...this._validationNotice ?? {
					state: void 0,
					text: void 0
				},
				suppressed: !!this._fp?.isOpen
			}), () => this.renderRoot?.querySelector?.("[mono-date] > [mono-field]"));
			this.error = false;
			this.success = false;
			this.disabled = false;
			this.readonly = false;
			this.required = false;
			this.clearable = false;
			this.cssClass = {};
			this.cssClassName = "";
			this._hasValue = false;
			this._fp = null;
			this._buildToken = 0;
			this._id = `mono-date-${++_uid}`;
			this._onTyping = (event) => {
				if (!this._fp || !this._typeable || this.disabled || this.readonly) return;
				if (this.mode === "range" || this.mode === "multiple") return;
				const raw = event.target.value;
				if (!raw.trim()) return;
				const fmt = this._fp.config.dateFormat;
				const parsed = this._fp.parseDate(raw, fmt);
				if (!parsed) return;
				this._fp.jumpToDate(parsed);
				if (this._fp.formatDate(parsed, fmt) === raw) this._fp.setDate(parsed, true);
			};
			defineHybridPropAliases(this, [
				"labelPosition",
				"validationPosition",
				"modelValue",
				"helperText",
				"validationState",
				"validationMessage",
				"errorMessage",
				"successMessage",
				"ariaLabelText",
				"cssClass",
				"dateFormat",
				"altInput",
				"altFormat",
				"clickOpens",
				"defaultDate",
				"minDate",
				"maxDate",
				"enableSeconds",
				"hourIncrement",
				"minuteIncrement",
				"defaultHour",
				"defaultMinute",
				"weekNumbers",
				"monthSelectorType",
				"shorthandCurrentMonth",
				"ariaDateFormat",
				"minWidth",
				"maxWidth",
				"minHeight",
				"maxHeight"
			]);
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
		}
		static get observedAttributes() {
			return [
				...super.observedAttributes ?? [],
				"modelvalue",
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
			if (name === "css-class" || name === "cssclass") this._setCssClass(newValue);
		}
		/**
		* Normalized `typeable` flag. Frameworks (e.g. Vue) set a bare boolean
		* attribute as the *property* `''` — which bypasses `booleanStringConverter`
		* and is falsy. Treat presence (`''`/`true`/`'true'`) as enabled so typing
		* actually works.
		*/
		get _typeable() {
			const v = this.typeable;
			return v === true || v === "" || v === "true";
		}
		static {
			this._configKeys = [
				"type",
				"options",
				"mode",
				"inline",
				"locale",
				"dateFormat",
				"altInput",
				"altFormat",
				"typeable",
				"clickOpens",
				"defaultDate",
				"minDate",
				"maxDate",
				"disable",
				"enable",
				"enableSeconds",
				"time24hr",
				"hourIncrement",
				"minuteIncrement",
				"defaultHour",
				"defaultMinute",
				"weekNumbers",
				"monthSelectorType",
				"shorthandCurrentMonth",
				"position",
				"ariaDateFormat",
				"disabled",
				"readonly"
			];
		}
		willUpdate(changed) {
			super.willUpdate?.(changed);
			for (const key of [
				"error",
				"success",
				"disabled",
				"readonly",
				"required",
				"clearable"
			]) {
				const v = this[key];
				if (typeof v !== "boolean") this[key] = this._toBoolean(v);
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
		async firstUpdated() {
			await this._ensurePicker();
		}
		/**
		* Build the picker if there isn't one — idempotent, and safe to call from every
		* update.
		*
		* Creation used to live only in `firstUpdated`, which Lit runs exactly once. After
		* a disconnect (`v-if`, `<KeepAlive>`, a Vue node move) `disconnectedCallback`
		* destroyed the instance and nothing ever rebuilt it, so the field rendered but had
		* no picker at all — every `open`/`close`/`toggle` was a silent `this._fp?.` no-op.
		* `chart-core` self-heals the same way.
		*
		* The `isConnected` re-check after the await matters just as much: without it, an
		* element disconnected *during* the dynamic import would construct a flatpickr on a
		* detached input that nothing would ever destroy — leaking its calendar DOM and the
		* four document/window listeners flatpickr binds.
		*/
		async _ensurePicker() {
			if (isServer || this._fp || !this._nativeEl) return;
			const token = ++this._buildToken;
			const { default: flatpickr } = await import("../esm-D0We7ndD.js");
			if (token !== this._buildToken || !this.isConnected || !this._nativeEl || this._fp) return;
			this._fp = flatpickr(this._nativeEl, this._buildConfig());
			this._hasValue = Boolean(this.modelValue);
		}
		updated(changed) {
			super.updated?.(changed);
			if (!this._fp) {
				this._ensurePicker();
				return;
			}
			if (MonoDateCoreClass._configKeys.some((k) => changed.has(k))) {
				this._rebuild();
				return;
			}
			if (changed.has("modelValue")) this._applyModelValue();
		}
		connectedCallback() {
			super.connectedCallback();
			if (!isServer) this._ensurePicker();
		}
		disconnectedCallback() {
			this._buildToken++;
			this._fp?.destroy();
			this._fp = null;
			super.disconnectedCallback();
		}
		_buildConfig() {
			const typeDefaults = this.type === "time" ? {
				enableTime: true,
				noCalendar: true
			} : this.type === "datetime" ? { enableTime: true } : {};
			const named = {};
			const str = (k, v) => {
				if (v !== void 0 && v !== "") named[k] = v;
			};
			const any = (k, v) => {
				if (v !== void 0) named[k] = v;
			};
			str("dateFormat", this.dateFormat);
			any("altInput", this.altInput);
			str("altFormat", this.altFormat);
			any("allowInput", this._typeable);
			any("clickOpens", this.clickOpens);
			any("defaultDate", this.defaultDate);
			any("minDate", this.minDate);
			any("maxDate", this.maxDate);
			any("disable", this.disable);
			any("enable", this.enable);
			str("mode", this.mode);
			any("enableSeconds", this.enableSeconds);
			any("time_24hr", this.time24hr);
			any("hourIncrement", this.hourIncrement);
			any("minuteIncrement", this.minuteIncrement);
			any("defaultHour", this.defaultHour);
			any("defaultMinute", this.defaultMinute);
			any("inline", this.inline);
			any("weekNumbers", this.weekNumbers);
			str("monthSelectorType", this.monthSelectorType);
			any("shorthandCurrentMonth", this.shorthandCurrentMonth);
			str("position", this.position);
			str("ariaDateFormat", this.ariaDateFormat);
			any("locale", this.locale);
			const config = {
				...typeDefaults,
				...this.options ?? {},
				...named,
				onReady: [(_d, _s, instance) => this._onReady(instance)],
				onChange: [(dates, dateStr, instance) => this._onChange(dates, dateStr, instance)],
				onOpen: [(dates, _s, instance) => {
					this._emitOpenClose("open", dates, instance);
					this._validation.refresh();
				}],
				onClose: [(dates, _s, instance) => {
					this._emitOpenClose("close", dates, instance);
					this._validation.refresh();
				}]
			};
			if (this.modelValue) config.defaultDate = this.modelValue;
			if (this.disabled || this.readonly) config.clickOpens = false;
			return config;
		}
		/**
		* Open / close the calendar. flatpickr owns the popup, so these just forward
		* to the instance — but they give `mono-date` the same `open()`/`close()`/
		* `toggle()` surface as `mono-select` and `mono-dropdown-table`, which lets
		* anything driving an editor generically (e.g. the data grid opening the
		* focused inline editor on `Enter`) treat all of them the same.
		*/
		/** Whether the calendar is currently open. */
		get isOpen() {
			return !!this._fp?.isOpen;
		}
		open() {
			if (this.disabled || this.readonly) return;
			this._fp?.open();
		}
		close() {
			this._fp?.close();
		}
		toggle() {
			if (this._fp?.isOpen) this.close();
			else this.open();
		}
		_rebuild() {
			if (!this._nativeEl) return;
			const open = this._fp?.isOpen;
			this._fp?.destroy();
			this._fp = null;
			const token = ++this._buildToken;
			import("../esm-D0We7ndD.js").then(({ default: flatpickr }) => {
				if (token !== this._buildToken || !this.isConnected || !this._nativeEl) return;
				this._fp = flatpickr(this._nativeEl, this._buildConfig());
				if (open) this._fp.open();
			});
		}
		_applyModelValue() {
			this._fp?.setDate(this.modelValue || "", false);
			this._hasValue = Boolean(this.modelValue);
		}
		/**
		* Tag the calendar so our CSS only targets our pickers, and copy the host's
		* resolved accent onto it (the calendar lives in <body> and can't inherit the
		* field's `--date-primary`, so it follows the `color` prop via `--cal-accent`).
		*
		* The accent variable is declared on the `.mono-date` element (the inner
		* wrapper), which in the shadow build lives inside the shadow root — reading
		* from the host (`this`) would return empty. Read from that wrapper instead;
		* in the light build `renderRoot === this` and `.mono-date` is the child, so
		* this resolves correctly for both.
		*/
		_onReady(instance) {
			if (isServer) return;
			const cal = instance.calendarContainer;
			if (!cal) return;
			cal.classList.add("mono-flatpickr");
			const scope = this.renderRoot.querySelector?.("[mono-date]") ?? this;
			const cs = getComputedStyle(scope);
			const accent = cs.getPropertyValue("--_mono-date-calendar-accent").trim();
			const accentFg = cs.getPropertyValue("--_mono-date-primary-foreground").trim();
			if (accent) cal.style.setProperty("--cal-accent", accent);
			if (accentFg) cal.style.setProperty("--cal-accent-foreground", accentFg);
		}
		_onChange(dates, dateStr, instance) {
			this.modelValue = dateStr;
			this._hasValue = Boolean(dateStr);
			const detail = {
				value: dateStr,
				modelValue: dateStr,
				dates,
				instance
			};
			const native = this._nativeEl;
			let done = false;
			const onNative = (event) => {
				done = true;
				dispatchMonoEvent(this, "change", detail, { sourceEvent: event });
			};
			native?.addEventListener("change", onNative, {
				once: true,
				capture: true
			});
			queueMicrotask(() => {
				if (done) return;
				done = true;
				native?.removeEventListener("change", onNative, { capture: true });
				dispatchMonoEvent(this, "change", detail);
			});
		}
		_emitOpenClose(kind, dates, instance) {
			dispatchMonoEvent(this, kind, {
				dates,
				instance
			});
		}
		_clear() {
			this._fp?.clear();
			this.modelValue = "";
			this._hasValue = false;
			const detail = {
				value: "",
				modelValue: "",
				dates: [],
				instance: this._fp
			};
			dispatchMonoEvent(this, "change", detail);
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
		get _resolvedState() {
			if (this.error) return "error";
			if (this.success) return "success";
			const state = this.validationState;
			if (state === "invalid") return "error";
			if (state === "valid") return "success";
			return state ?? "default";
		}
		get _message() {
			if (this._resolvedState === "error") return this.errorMessage || this.validationMessage || void 0;
			if (this._resolvedState === "success") return this.successMessage || this.validationMessage || void 0;
			return this.helperText || void 0;
		}
		get _wrapperClasses() {
			return [
				"mono-date",
				this.size,
				this.color,
				this.variant,
				this.disabled ? "disabled" : "",
				this.readonly ? "readonly" : "",
				this.required ? "required" : "",
				this._hasValue ? "has-value" : "",
				this._resolvedState !== "default" ? `is-${this._resolvedState}` : "",
				this.cssClassName || "",
				this.cssClass?.root || ""
			].filter(Boolean).join(" ");
		}
		get _fieldClasses() {
			return [
				this._cls("mono-date-field", "field"),
				this.size,
				this.color,
				this.variant,
				this._resolvedState !== "default" ? `is-${this._resolvedState}` : ""
			].filter(Boolean).join(" ");
		}
		_icon() {
			return this.renderIcon(this.type === "time" ? "clock" : "calendar");
		}
		/**
		* Icon hook. Light build (default): the global `.mono-icon` / `i-mdi-*` UnoCSS
		* icon. Shadow overrides with inline SVG (UnoCSS mask rules can't reach a
		* shadow root — they'd render as a solid "black cube").
		*/
		renderIcon(name) {
			return html`<span class=${`mono-icon ${name === "calendar" ? "i-mdi-calendar-outline" : name === "clock" ? "i-mdi-clock-outline" : "i-mdi-close"}`} mono-icon aria-hidden="true"></span>`;
		}
		/**
		* The wrapper renders unconditionally, like input / select / tag-input. The
		* wrapper is a grid child, so returning `nothing` when there is no message left
		* date's block exactly one row-gap shorter than its siblings' — visible as soon
		* as a labelled date sits beside a labelled input in the same row.
		*/
		/** The validation message and its state — the same precedence `_message` uses. */
		get _validationNotice() {
			const state = this._resolvedState;
			const text = state === "error" ? this.errorMessage || this.validationMessage : state === "success" ? this.successMessage || this.validationMessage : "";
			return text ? {
				state,
				text
			} : null;
		}
		_renderMessage() {
			if (this._validation.moved) {
				const notice = this._validationNotice;
				return html`
        <div class=${this._cls("mono-date-message-wrap", "messageWrap")} mono-message-wrap>
          ${this.helperText ? html`<div class=${`${this._cls("mono-date-message", "message")} default`} mono-message="helper">${this.helperText}</div>` : nothing}
          <div
            class=${`${this._cls("mono-date-message", "message")} ${notice.state}`}
            mono-message=${notice.state}
            mono-sr-only
            role=${notice.state === "error" ? "alert" : nothing}
          >${notice.text}</div>
        </div>
      `;
			}
			const msg = this._message;
			return html`
      <div class=${this._cls("mono-date-message-wrap", "messageWrap")} mono-message-wrap>
        ${msg ? html`<div
              class=${`${this._cls("mono-date-message", "message")} ${this._resolvedState}`}
              mono-message=${this._resolvedState === "default" ? "helper" : this._resolvedState}
              role=${this._resolvedState === "error" ? "alert" : nothing}
            >${msg}</div>` : nothing}
      </div>
    `;
		}
		render() {
			const state = this._resolvedState;
			return html`
      <div
        class=${this._wrapperClasses}
        style=${styleMap(buildSizeStyle(this))}
        mono-date
        mono-size=${this.size === "md" ? nothing : this.size}
        mono-color=${this.color === "primary" ? nothing : this.color}
        mono-variant=${this.variant === "outlined" ? nothing : this.variant}
        mono-label-position=${this.labelPosition === "top" ? nothing : this.labelPosition}
        mono-validation-position=${this.validationPosition === "bottom" ? nothing : this.validationPosition}
        mono-validation-state=${state === "default" ? nothing : state}
        ?mono-disabled=${this.disabled}
        ?mono-readonly=${this.readonly}
        ?mono-required=${this.required}
        ?mono-clearable=${this.clearable}
      >
        ${this.label ? html`<label class=${this._cls("mono-date-label", "label")} mono-label for=${this._id}>
              ${this.label}${this.required ? html`<span class=${this._cls("mono-date-required", "required")} mono-required-mark>*</span>` : nothing}${this._tooltip.render()}
            </label>` : nothing}

        <div class=${this._fieldClasses} mono-field>
          <span class=${this._cls("mono-date-icon", "icon")} mono-prefix aria-hidden="true">${this._icon()}</span>
          <input
            class=${this._cls("mono-date-native", "native")}
            mono-native
            id=${this._id}
            type="text"
            placeholder=${ifDefined(this.placeholder)}
            ?disabled=${this.disabled}
            ?readonly=${this.readonly && !this._typeable}
            aria-label=${ifDefined(this.ariaLabelText || this.label || void 0)}
            @input=${this._onTyping}
          />
          ${this._validation.renderIcon()}
          ${this.clearable && this._hasValue && !this.disabled && !this.readonly ? html`<button
                type="button"
                class=${this._cls("mono-date-clear", "clear")}
                mono-clear
                aria-label="Clear"
                @click=${this._clear}
              >
                ${this.renderIcon("close")}
              </button>` : nothing}
        </div>

        ${this._renderMessage()}
        ${this._validation.renderFloat()}
      </div>
    `;
		}
	}
	__decorate([property({ type: String })], MonoDateCoreClass.prototype, "type", void 0);
	__decorate([property({
		attribute: "model-value",
		reflect: true
	})], MonoDateCoreClass.prototype, "modelValue", void 0);
	__decorate([property({ type: String })], MonoDateCoreClass.prototype, "size", void 0);
	__decorate([property({ type: String })], MonoDateCoreClass.prototype, "color", void 0);
	__decorate([property({ type: String })], MonoDateCoreClass.prototype, "variant", void 0);
	__decorate([property({
		type: String,
		attribute: "label-position"
	})], MonoDateCoreClass.prototype, "labelPosition", void 0);
	__decorate([property({
		type: String,
		attribute: "validation-position"
	})], MonoDateCoreClass.prototype, "validationPosition", void 0);
	__decorate([property({ type: String })], MonoDateCoreClass.prototype, "label", void 0);
	__decorate([property({ type: String })], MonoDateCoreClass.prototype, "placeholder", void 0);
	__decorate([property({
		type: String,
		attribute: "helper-text"
	})], MonoDateCoreClass.prototype, "helperText", void 0);
	__decorate([property()], MonoDateCoreClass.prototype, "tooltip", void 0);
	__decorate([property({
		type: String,
		attribute: "validation-state"
	})], MonoDateCoreClass.prototype, "validationState", void 0);
	__decorate([property({
		type: String,
		attribute: "validation-message"
	})], MonoDateCoreClass.prototype, "validationMessage", void 0);
	__decorate([property({ converter: booleanStringConverter })], MonoDateCoreClass.prototype, "error", void 0);
	__decorate([property({
		type: String,
		attribute: "error-message"
	})], MonoDateCoreClass.prototype, "errorMessage", void 0);
	__decorate([property({ converter: booleanStringConverter })], MonoDateCoreClass.prototype, "success", void 0);
	__decorate([property({
		type: String,
		attribute: "success-message"
	})], MonoDateCoreClass.prototype, "successMessage", void 0);
	__decorate([property({
		reflect: true,
		converter: booleanStringConverter
	})], MonoDateCoreClass.prototype, "disabled", void 0);
	__decorate([property({
		reflect: true,
		converter: booleanStringConverter
	})], MonoDateCoreClass.prototype, "readonly", void 0);
	__decorate([property({
		reflect: true,
		converter: booleanStringConverter
	})], MonoDateCoreClass.prototype, "required", void 0);
	__decorate([property({ converter: booleanStringConverter })], MonoDateCoreClass.prototype, "clearable", void 0);
	__decorate([property({
		type: String,
		attribute: "aria-label-text"
	})], MonoDateCoreClass.prototype, "ariaLabelText", void 0);
	__decorate([property({
		type: String,
		attribute: "date-format"
	})], MonoDateCoreClass.prototype, "dateFormat", void 0);
	__decorate([property({
		attribute: "alt-input",
		converter: booleanStringConverter
	})], MonoDateCoreClass.prototype, "altInput", void 0);
	__decorate([property({
		type: String,
		attribute: "alt-format"
	})], MonoDateCoreClass.prototype, "altFormat", void 0);
	__decorate([property({ converter: booleanStringConverter })], MonoDateCoreClass.prototype, "typeable", void 0);
	__decorate([property({
		attribute: "click-opens",
		converter: booleanStringConverter
	})], MonoDateCoreClass.prototype, "clickOpens", void 0);
	__decorate([property({ attribute: "default-date" })], MonoDateCoreClass.prototype, "defaultDate", void 0);
	__decorate([property({ attribute: "min-date" })], MonoDateCoreClass.prototype, "minDate", void 0);
	__decorate([property({ attribute: "max-date" })], MonoDateCoreClass.prototype, "maxDate", void 0);
	__decorate([property({ attribute: false })], MonoDateCoreClass.prototype, "disable", void 0);
	__decorate([property({ attribute: false })], MonoDateCoreClass.prototype, "enable", void 0);
	__decorate([property({ type: String })], MonoDateCoreClass.prototype, "mode", void 0);
	__decorate([property({
		attribute: "enable-seconds",
		converter: booleanStringConverter
	})], MonoDateCoreClass.prototype, "enableSeconds", void 0);
	__decorate([property({
		attribute: "time-24hr",
		converter: booleanStringConverter
	})], MonoDateCoreClass.prototype, "time24hr", void 0);
	__decorate([property({
		attribute: "hour-increment",
		converter: numberStringConverter
	})], MonoDateCoreClass.prototype, "hourIncrement", void 0);
	__decorate([property({
		attribute: "minute-increment",
		converter: numberStringConverter
	})], MonoDateCoreClass.prototype, "minuteIncrement", void 0);
	__decorate([property({
		attribute: "default-hour",
		converter: numberStringConverter
	})], MonoDateCoreClass.prototype, "defaultHour", void 0);
	__decorate([property({
		attribute: "default-minute",
		converter: numberStringConverter
	})], MonoDateCoreClass.prototype, "defaultMinute", void 0);
	__decorate([property({ converter: booleanStringConverter })], MonoDateCoreClass.prototype, "inline", void 0);
	__decorate([property({
		attribute: "week-numbers",
		converter: booleanStringConverter
	})], MonoDateCoreClass.prototype, "weekNumbers", void 0);
	__decorate([property({ attribute: "month-selector-type" })], MonoDateCoreClass.prototype, "monthSelectorType", void 0);
	__decorate([property({
		attribute: "shorthand-current-month",
		converter: booleanStringConverter
	})], MonoDateCoreClass.prototype, "shorthandCurrentMonth", void 0);
	__decorate([property({ type: String })], MonoDateCoreClass.prototype, "position", void 0);
	__decorate([property({
		type: String,
		attribute: "aria-date-format"
	})], MonoDateCoreClass.prototype, "ariaDateFormat", void 0);
	__decorate([property({ attribute: false })], MonoDateCoreClass.prototype, "locale", void 0);
	__decorate([property({ attribute: false })], MonoDateCoreClass.prototype, "options", void 0);
	__decorate([property({ type: String })], MonoDateCoreClass.prototype, "width", void 0);
	__decorate([property({ type: String })], MonoDateCoreClass.prototype, "height", void 0);
	__decorate([property({
		type: String,
		attribute: "min-width"
	})], MonoDateCoreClass.prototype, "minWidth", void 0);
	__decorate([property({
		type: String,
		attribute: "max-width"
	})], MonoDateCoreClass.prototype, "maxWidth", void 0);
	__decorate([property({
		type: String,
		attribute: "min-height"
	})], MonoDateCoreClass.prototype, "minHeight", void 0);
	__decorate([property({
		type: String,
		attribute: "max-height"
	})], MonoDateCoreClass.prototype, "maxHeight", void 0);
	__decorate([property({ attribute: false })], MonoDateCoreClass.prototype, "cssClass", void 0);
	__decorate([property({ attribute: false })], MonoDateCoreClass.prototype, "cssClassName", void 0);
	__decorate([state()], MonoDateCoreClass.prototype, "_hasValue", void 0);
	__decorate([query(".mono-date-native")], MonoDateCoreClass.prototype, "_nativeEl", void 0);
	return MonoDateCoreClass;
};

//#endregion
//#region src/components/date/mono-date.ts
let MonoDate = class MonoDate extends MonoDateCore(LitElement) {
	createRenderRoot() {
		return this;
	}
};
MonoDate = __decorate([customElement("mono-date")], MonoDate);

//#endregion
export { MonoDate };