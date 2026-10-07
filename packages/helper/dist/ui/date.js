import { t as customElement } from "../mono-element-B0kP_96P.js";
import { a as defineHybridPropAliases, r as booleanStringConverter, t as __decorate } from "../decorate-DEXtNagw.js";
import { t as dispatchMonoEvent } from "../mono-event-Bi1qP9uN.js";
import { t as buildSizeStyle } from "../css-size-DhHSVZJK.js";
import { t as MonoFormControlCore } from "../form-control-core-eeRr0zLU.js";
import { LitElement, html, isServer, nothing, unsafeCSS } from "lit";
import { property, query, state } from "lit/decorators.js";
import { ifDefined } from "lit/directives/if-defined.js";
import { styleMap } from "lit/directives/style-map.js";
//#region src/components/date/date-core.ts
var numberStringConverter = {
	fromAttribute(value) {
		if (value === null || value === "") return void 0;
		const parsed = Number(value);
		return Number.isFinite(parsed) ? parsed : void 0;
	},
	toAttribute(value) {
		return value === void 0 || value === null ? null : String(value);
	}
};
var _uid = 0;
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
var MonoDateCore = (superClass) => {
	class MonoDateCoreClass extends MonoFormControlCore(superClass) {
		constructor(...args) {
			super(...args);
			this.type = "date";
			this.modelValue = "";
			this.size = "md";
			this.color = "primary";
			this.variant = "outlined";
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
			const { default: flatpickr } = await import("../esm-Ptok4SQZ.js");
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
				onOpen: [(dates, _s, instance) => this._emitOpenClose("open", dates, instance)],
				onClose: [(dates, _s, instance) => this._emitOpenClose("close", dates, instance)]
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
			import("../esm-Ptok4SQZ.js").then(({ default: flatpickr }) => {
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
			return this.validationState ?? "default";
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
		_renderMessage() {
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
        mono-validation-state=${state === "default" ? nothing : state}
        ?mono-disabled=${this.disabled}
        ?mono-readonly=${this.readonly}
        ?mono-required=${this.required}
        ?mono-clearable=${this.clearable}
      >
        ${this.label ? html`<label class=${this._cls("mono-date-label", "label")} mono-label for=${this._id}>
              ${this.label}${this.required ? html`<span class=${this._cls("mono-date-required", "required")} mono-required-mark>*</span>` : nothing}
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
	__decorate([property({ type: String })], MonoDateCoreClass.prototype, "label", void 0);
	__decorate([property({ type: String })], MonoDateCoreClass.prototype, "placeholder", void 0);
	__decorate([property({
		type: String,
		attribute: "helper-text"
	})], MonoDateCoreClass.prototype, "helperText", void 0);
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
//#region src/components/date/date.css?raw
var date_default = "/* @unocss-include */\r\n\r\n/* flatpickr's base stylesheet. The calendar renders into <body>, so this must\r\n   live in the global bundle (dist/ui/index.css) — that's why date.css is\r\n   @imported from src/entries/index.css. */\r\n@import 'flatpickr/dist/flatpickr.css';\r\n\r\n/* =========================================================================\r\n   mono-date — the mono-input box (a port of Basecoat's `.input-group` with a\r\n   leading icon, basecoat-css@1.0.2, vega style) around a flatpickr field, plus\r\n   a calendar restyled in Basecoat's popover idiom.\r\n\r\n   Styled by ATTRIBUTE, like Basecoat — and the attributes mirror the element's\r\n   props one for one, so hand-written markup reads like the Lit / Vue tag:\r\n\r\n     <mono-date size=\"sm\" color=\"danger\" variant=\"filled\" label=\"Start\">\r\n     <div mono-date mono-size=\"sm\" mono-color=\"danger\" mono-variant=\"filled\">\r\n       <label mono-label>Start</label>\r\n       <div mono-field>\r\n         <span mono-prefix><span mono-icon class=\"mono-icon i-mdi-calendar-outline\"></span></span>\r\n         <input mono-native type=\"text\" placeholder=\"Pick a date\" />\r\n       </div>\r\n     </div>\r\n\r\n   An absent attribute is the prop's default (`:not([mono-size])` = md,\r\n   `:not([mono-color])` = primary, `:not([mono-variant])` = outlined). The element\r\n   renders these attributes on its wrapper (both builds); the old classes\r\n   (`.mono-date.sm.filled`) are still emitted as inert hooks until 2.0 but no\r\n   rule here reads them.\r\n\r\n   Selector map (ours ≡ upstream):\r\n     [mono-date]                                   ≡ .field (flex column gap-3)\r\n     [mono-date] > [mono-label]                    ≡ .field > label / .label\r\n     [mono-date] > [mono-field]                    ≡ .input-group (h-9 rounded-md border-input shadow-xs)\r\n     [mono-field] > [mono-prefix] > [mono-icon]    ≡ .input-group > span[data-align='start'] > svg (ps-2, size-4, muted)\r\n     [mono-field] > [mono-native]                  ≡ .input-group > input (borderless, ps-1.5 after an affix, text-sm)\r\n     [mono-field] > [mono-clear] > [mono-icon]     ≡ .input-group > button[data-align='end']:has(> svg) (ghost, size-6)\r\n     [mono-message-wrap] > [mono-message]          ≡ .field > p / .field [role='alert']\r\n     [mono-validation-state=\"error\"]               ≡ .input-group:has([aria-invalid=true]) + .field[data-invalid]\r\n     [mono-validation-state=\"success\"]             ≡ EXTENSION (the invalid pattern in --success)\r\n     [mono-size=\"xs|sm|lg|xl|xxl\"]                 ≡ EXTENSION (the --mono-control-height-* ladder)\r\n     [mono-variant=\"filled\"]                       ≡ EXTENSION (luma's .input-group)\r\n     [mono-variant=\"underlined\"]                   ≡ EXTENSION (sera's .input-group: bottom edge only, no ring)\r\n     .flatpickr-calendar.mono-flatpickr            ≡ [data-popover] frame (bg-popover ring-1 ring-foreground/10 rounded-md shadow-md)\r\n                                                     + EXTENSION: shadcn Calendar values (Basecoat 1.0.2 ships no calendar)\r\n\r\n   Inner parts are attributes too: [mono-label] (+ [mono-required-mark]),\r\n   [mono-field], [mono-prefix] > [mono-icon], [mono-native], [mono-clear] >\r\n   [mono-icon], [mono-message-wrap] > [mono-message=\"helper|error|success\"].\r\n\r\n   The calendar renders into <body> (both builds), so it is styled through\r\n   flatpickr's own classes under our `.mono-flatpickr` marker and reads the page\r\n   tokens directly; the element copies the field's accent onto it as\r\n   `--cal-accent` / `--cal-accent-foreground` so it follows the `color` prop.\r\n\r\n   FLAVORS set the same knobs as mono-input, renamed `--mono-date-*` (see\r\n   input.css) plus `--mono-date-calendar-{radius,shadow,ring,day-radius}`. Every\r\n   fallback here is vega's value.\r\n   ========================================================================= */\r\n\r\nmono-date {\r\n  display: block;\r\n}\r\n\r\n[mono-date] {\r\n  /* ── palette: each slot is a public knob over a Basecoat token ─────────── */\r\n  --_mono-date-text: var(--mono-date-color, var(--mono-date-text, var(--foreground)));\r\n  --_mono-date-placeholder: var(--mono-date-placeholder, var(--muted-foreground));\r\n  --_mono-date-muted: var(--mono-date-muted, var(--muted-foreground));\r\n  --_mono-date-primary: var(--mono-date-primary, var(--_mono-date-primary-preset, var(--ring)));\r\n  --_mono-date-primary-foreground: var(--mono-date-primary-foreground, var(--_mono-date-primary-foreground-preset, var(--primary-foreground)));\r\n  --_mono-date-danger: var(--mono-date-danger, var(--destructive));\r\n  --_mono-date-success: var(--mono-date-success, var(--success));\r\n  --_mono-date-warning: var(--mono-date-warning, var(--warning));\r\n  --_mono-date-info: var(--mono-date-info, var(--info));\r\n  --_mono-date-teal: var(--mono-date-teal, var(--teal));\r\n  --_mono-date-purple: var(--mono-date-purple, var(--purple));\r\n  --_mono-date-neutral: var(--mono-date-neutral, var(--neutral));\r\n  --_mono-date-dark: var(--mono-date-dark, var(--dark));\r\n  --_mono-date-secondary: var(--mono-date-secondary, var(--muted-foreground));\r\n\r\n  /* ── the painted result — three tiers, base = .input-group (vega) ──────── */\r\n  --_mono-date-ring-color: var(--mono-date-ring-color, var(--mono-date-focus-color, var(--_mono-date-primary)));\r\n  --_mono-date-ring-width: var(--mono-date-ring-width, var(--_mono-date-ring-width-preset, var(--mono-ring-width)));\r\n  --_mono-date-ring-alpha: var(--mono-date-ring-alpha, var(--mono-ring-alpha));\r\n  --_mono-date-border-color: var(--mono-date-rest-border, var(--mono-date-border-color, var(--mono-date-border, var(--_mono-date-border-color-preset, var(--input)))));\r\n  --_mono-date-bg: var(--mono-date-bg, var(--mono-date-surface, var(--_mono-date-bg-preset, var(--mono-mode-surface))));\r\n  --_mono-date-shadow: var(--mono-date-shadow, var(--_mono-date-shadow-preset, 0 0 #0000));\r\n  --_mono-date-affix-padding: var(--mono-date-affix-padding, var(--_mono-date-affix-padding-preset, calc(var(--mono-spacing) * 2)));\r\n  --_mono-date-affix-icon: var(--mono-date-affix-icon-size, calc(var(--mono-spacing) * 4));\r\n\r\n  /* ── md metrics live on the unqualified root ON PURPOSE: hand-written\r\n        `<div mono-date>` that names no size renders exactly like size=\"md\".\r\n        basecoat@1.0.2 styles/vega.css .input-group — h-9 rounded-md; > input px-2.5 text-sm ── */\r\n  --_mono-date-height: var(--mono-date-height-md, var(--mono-control-height-md));\r\n  --_mono-date-radius: var(--mono-date-radius-md, var(--_mono-date-radius-preset, var(--mono-date-radius, var(--mono-radius-md))));\r\n  --_mono-date-padding-x: var(--mono-date-padding-x-md, var(--mono-date-padding-x, var(--_mono-date-padding-x-preset, calc(var(--mono-spacing) * 2.5))));\r\n  --_mono-date-font-size: var(--mono-date-font-md, var(--mono-text-sm));\r\n  --_mono-date-line-height: var(--mono-date-line-height, var(--mono-date-line-height-md, var(--mono-text-sm--lh)));\r\n  --_mono-date-clear: calc(var(--mono-spacing) * 6);\r\n  --_mono-date-clear-glyph: calc(var(--mono-spacing) * 3.5);\r\n\r\n  /* basecoat@1.0.2 styles/vega.css .field — flex w-full flex-col gap-3 */\r\n  display: flex;\r\n  flex-direction: column;\r\n  gap: var(--mono-date-gap, calc(var(--mono-spacing) * 3));\r\n  width: 100%;\r\n  font-family: inherit;\r\n  color: var(--_mono-date-text);\r\n}\r\n\r\n[mono-date],\r\n[mono-date] *,\r\n[mono-date] *::before,\r\n[mono-date] *::after {\r\n  box-sizing: border-box;\r\n}\r\n\r\n[mono-date] :is([mono-label], [mono-message])[mono-empty] {\r\n  display: none;\r\n}\r\n\r\n/* =========================================\r\n   Sizes — the field's painted height IS the token (tests/perf/field-heights)\r\n   EXTENSION: the shared --mono-control-height-* ladder; text follows .btn's steps\r\n   ========================================= */\r\n\r\n@media (width < 48rem) {\r\n  [mono-date]:is(:not([mono-size]), [mono-size=\"md\"]) {\r\n    --_mono-date-font-size: var(--mono-date-font-md, var(--mono-text-base));\r\n    --_mono-date-line-height: var(--mono-date-line-height, var(--mono-date-line-height-md, var(--mono-text-base--lh)));\r\n  }\r\n}\r\n\r\n[mono-date][mono-size=\"xs\"] {\r\n  --_mono-date-height: var(--mono-date-height-xs, var(--mono-control-height-xs));\r\n  --_mono-date-radius: var(--mono-date-radius-xs, var(--_mono-date-radius-preset, var(--mono-date-radius, var(--mono-radius-md))));\r\n  --_mono-date-padding-x: var(--mono-date-padding-x-xs, var(--mono-date-padding-x, var(--_mono-date-padding-x-preset, calc(var(--mono-spacing) * 2))));\r\n  --_mono-date-font-size: var(--mono-date-font-xs, var(--mono-text-xs));\r\n  --_mono-date-line-height: var(--mono-date-line-height, var(--mono-date-line-height-xs, var(--mono-text-xs--lh)));\r\n  --_mono-date-affix-icon: var(--mono-date-affix-icon-size, calc(var(--mono-spacing) * 3.5));\r\n  --_mono-date-clear: calc(var(--mono-spacing) * 4);\r\n  --_mono-date-clear-glyph: calc(var(--mono-spacing) * 3);\r\n}\r\n\r\n[mono-date][mono-size=\"sm\"] {\r\n  --_mono-date-height: var(--mono-date-height-sm, var(--mono-control-height-sm));\r\n  --_mono-date-radius: var(--mono-date-radius-sm, var(--_mono-date-radius-preset, var(--mono-date-radius, var(--mono-radius-md))));\r\n  --_mono-date-padding-x: var(--mono-date-padding-x-sm, var(--mono-date-padding-x, var(--_mono-date-padding-x-preset, calc(var(--mono-spacing) * 2.5))));\r\n  --_mono-date-font-size: var(--mono-date-font-sm, var(--mono-date-font-md, var(--mono-text-sm)));\r\n  --_mono-date-line-height: var(--mono-date-line-height, var(--mono-date-line-height-sm, var(--mono-text-sm--lh)));\r\n  --_mono-date-clear: calc(var(--mono-spacing) * 5);\r\n  --_mono-date-clear-glyph: calc(var(--mono-spacing) * 3.5);\r\n}\r\n\r\n[mono-date][mono-size=\"lg\"] {\r\n  --_mono-date-height: var(--mono-date-height-lg, var(--mono-control-height-lg));\r\n  --_mono-date-radius: var(--mono-date-radius-lg, var(--_mono-date-radius-preset, var(--mono-date-radius, var(--mono-radius-md))));\r\n  --_mono-date-padding-x: var(--mono-date-padding-x-lg, var(--mono-date-padding-x, var(--_mono-date-padding-x-preset, calc(var(--mono-spacing) * 2.5))));\r\n  --_mono-date-font-size: var(--mono-date-font-lg, var(--mono-date-font-md, var(--mono-text-sm)));\r\n  --_mono-date-line-height: var(--mono-date-line-height, var(--mono-date-line-height-lg, var(--mono-text-sm--lh)));\r\n}\r\n\r\n[mono-date][mono-size=\"xl\"] {\r\n  --_mono-date-height: var(--mono-date-height-xl, var(--mono-control-height-xl));\r\n  --_mono-date-radius: var(--mono-date-radius-xl, var(--_mono-date-radius-preset, var(--mono-date-radius, var(--mono-radius-md))));\r\n  --_mono-date-padding-x: var(--mono-date-padding-x-xl, var(--mono-date-padding-x, var(--_mono-date-padding-x-preset, calc(var(--mono-spacing) * 3))));\r\n  --_mono-date-font-size: var(--mono-date-font-xl, var(--mono-text-base));\r\n  --_mono-date-line-height: var(--mono-date-line-height, var(--mono-date-line-height-xl, var(--mono-text-base--lh)));\r\n  --_mono-date-affix-icon: var(--mono-date-affix-icon-size, calc(var(--mono-spacing) * 5));\r\n  --_mono-date-clear: calc(var(--mono-spacing) * 7);\r\n  --_mono-date-clear-glyph: calc(var(--mono-spacing) * 4);\r\n}\r\n\r\n[mono-date][mono-size=\"xxl\"] {\r\n  --_mono-date-height: var(--mono-date-height-xxl, var(--mono-control-height-xxl));\r\n  --_mono-date-radius: var(--mono-date-radius-xxl, var(--_mono-date-radius-preset, var(--mono-date-radius, var(--mono-radius-md))));\r\n  --_mono-date-padding-x: var(--mono-date-padding-x-xxl, var(--mono-date-padding-x, var(--_mono-date-padding-x-preset, calc(var(--mono-spacing) * 4))));\r\n  --_mono-date-font-size: var(--mono-date-font-xxl, var(--mono-text-lg));\r\n  --_mono-date-line-height: var(--mono-date-line-height, var(--mono-date-line-height-xxl, var(--mono-text-lg--lh)));\r\n  --_mono-date-affix-icon: var(--mono-date-affix-icon-size, calc(var(--mono-spacing) * 5));\r\n  --_mono-date-clear: calc(var(--mono-spacing) * 8);\r\n  --_mono-date-clear-glyph: calc(var(--mono-spacing) * 4);\r\n}\r\n\r\n/* =========================================\r\n   Variants — each writes only `*-preset` slots\r\n   ========================================= */\r\n\r\n/* basecoat@1.0.2 styles/vega.css .input-group — rounded-md border border-input\r\n   shadow-xs bg-transparent (dark:bg-input/30 via --mono-mode-surface) */\r\n[mono-date]:is(:not([mono-variant]), [mono-variant=\"outlined\"]) {\r\n  --_mono-date-bg-preset: var(--mono-date-outline-bg);\r\n  --_mono-date-border-color-preset: var(--mono-date-outline-border-color);\r\n  --_mono-date-side-border-color-preset: var(--mono-date-outline-side-border-color);\r\n  --_mono-date-shadow-preset: var(--mono-date-outline-shadow, var(--mono-shadow-xs));\r\n  --_mono-date-ring-width-preset: var(--mono-date-outline-ring-width);\r\n  --_mono-date-radius-preset: var(--mono-date-outline-radius);\r\n  --_mono-date-padding-x-preset: var(--mono-date-outline-padding-x);\r\n  --_mono-date-affix-padding-preset: var(--mono-date-outline-affix-padding);\r\n}\r\n\r\n/* EXTENSION — filled ≡ basecoat@1.0.2 styles/luma.css .input-group */\r\n[mono-date][mono-variant=\"filled\"] {\r\n  --_mono-date-bg-preset: var(--mono-date-filled-bg, color-mix(in oklab, var(--input) 50%, transparent));\r\n  --_mono-date-border-color-preset: transparent;\r\n  --_mono-date-shadow-preset: 0 0 #0000;\r\n}\r\n\r\n/* EXTENSION — underlined ≡ basecoat@1.0.2 styles/sera.css .input-group */\r\n[mono-date][mono-variant=\"underlined\"] {\r\n  --_mono-date-bg-preset: transparent;\r\n  --_mono-date-side-border-color-preset: transparent;\r\n  --_mono-date-shadow-preset: 0 0 #0000;\r\n  --_mono-date-ring-width-preset: 0px;\r\n  --_mono-date-radius-preset: 0;\r\n  --_mono-date-padding-x-preset: 0;\r\n  --_mono-date-affix-padding-preset: 0;\r\n}\r\n\r\n/* =========================================\r\n   Colours — the `color` prop is the accent: the focus ring + the calendar's\r\n   selected day. Primary is Basecoat's --ring for the ring and --primary for the\r\n   calendar (copied by the element as --cal-accent).\r\n   ========================================= */\r\n\r\n[mono-date]:is(:not([mono-color]), [mono-color=\"primary\"]) {\r\n  --_mono-date-primary-preset: var(--ring);\r\n  --_mono-date-primary-foreground-preset: var(--primary-foreground);\r\n  --_mono-date-calendar-accent: var(--mono-date-calendar-accent, var(--primary));\r\n}\r\n[mono-date][mono-color=\"secondary\"] {\r\n  --_mono-date-primary-preset: var(--_mono-date-secondary);\r\n  --_mono-date-primary-foreground-preset: var(--background);\r\n  --_mono-date-calendar-accent: var(--mono-date-calendar-accent, var(--_mono-date-secondary));\r\n}\r\n[mono-date][mono-color=\"success\"] {\r\n  --_mono-date-primary-preset: var(--_mono-date-success);\r\n  --_mono-date-primary-foreground-preset: var(--success-foreground);\r\n  --_mono-date-calendar-accent: var(--mono-date-calendar-accent, var(--_mono-date-success));\r\n}\r\n[mono-date][mono-color=\"danger\"] {\r\n  --_mono-date-primary-preset: var(--_mono-date-danger);\r\n  --_mono-date-primary-foreground-preset: var(--destructive-foreground);\r\n  --_mono-date-calendar-accent: var(--mono-date-calendar-accent, var(--_mono-date-danger));\r\n}\r\n[mono-date][mono-color=\"warning\"] {\r\n  --_mono-date-primary-preset: var(--_mono-date-warning);\r\n  --_mono-date-primary-foreground-preset: var(--warning-foreground);\r\n  --_mono-date-calendar-accent: var(--mono-date-calendar-accent, var(--_mono-date-warning));\r\n}\r\n[mono-date][mono-color=\"info\"] {\r\n  --_mono-date-primary-preset: var(--_mono-date-info);\r\n  --_mono-date-primary-foreground-preset: var(--info-foreground);\r\n  --_mono-date-calendar-accent: var(--mono-date-calendar-accent, var(--_mono-date-info));\r\n}\r\n[mono-date][mono-color=\"teal\"] {\r\n  --_mono-date-primary-preset: var(--_mono-date-teal);\r\n  --_mono-date-primary-foreground-preset: var(--teal-foreground);\r\n  --_mono-date-calendar-accent: var(--mono-date-calendar-accent, var(--_mono-date-teal));\r\n}\r\n[mono-date][mono-color=\"purple\"] {\r\n  --_mono-date-primary-preset: var(--_mono-date-purple);\r\n  --_mono-date-primary-foreground-preset: var(--purple-foreground);\r\n  --_mono-date-calendar-accent: var(--mono-date-calendar-accent, var(--_mono-date-purple));\r\n}\r\n[mono-date][mono-color=\"neutral\"] {\r\n  --_mono-date-primary-preset: var(--_mono-date-neutral);\r\n  --_mono-date-primary-foreground-preset: var(--neutral-foreground);\r\n  --_mono-date-calendar-accent: var(--mono-date-calendar-accent, var(--_mono-date-neutral));\r\n}\r\n[mono-date][mono-color=\"dark\"] {\r\n  --_mono-date-primary-preset: var(--_mono-date-dark);\r\n  --_mono-date-primary-foreground-preset: var(--dark-foreground);\r\n  --_mono-date-calendar-accent: var(--mono-date-calendar-accent, var(--_mono-date-dark));\r\n}\r\n\r\n/* =========================================\r\n   Label\r\n   ========================================= */\r\n\r\n/* basecoat@1.0.2 styles/vega.css .field > label, .label — flex items-center\r\n   gap-2 text-sm leading-none font-medium select-none w-fit */\r\n[mono-date] > [mono-label] {\r\n  display: flex;\r\n  align-items: center;\r\n  width: fit-content;\r\n  gap: var(--mono-date-label-gap, calc(var(--mono-spacing) * 2));\r\n  font-size: var(--mono-date-label-font-size, var(--mono-text-sm));\r\n  line-height: var(--mono-date-label-line-height, 1);\r\n  font-weight: var(--mono-date-label-font-weight, var(--mono-label-font-weight, var(--mono-font-weight-medium)));\r\n  text-transform: var(--mono-date-label-text-transform, none);\r\n  letter-spacing: var(--mono-date-label-letter-spacing, normal);\r\n  color: var(--_mono-date-text);\r\n  user-select: none;\r\n}\r\n\r\n[mono-date][mono-disabled] > [mono-label],\r\n[mono-date]:has(> [mono-field] > [mono-native]:disabled) > [mono-label] {\r\n  opacity: 0.5;\r\n  pointer-events: none;\r\n}\r\n\r\n/* basecoat@1.0.2 styles/vega.css .field — data-invalid:text-destructive */\r\n[mono-date][mono-validation-state=\"error\"] > [mono-label] {\r\n  color: var(--_mono-date-danger);\r\n}\r\n\r\n[mono-date] [mono-required-mark] {\r\n  color: var(--_mono-date-danger);\r\n}\r\n\r\n/* =========================================\r\n   The field — the bordered box\r\n   ========================================= */\r\n\r\n/* basecoat@1.0.2 components/input-group.css .input-group */\r\n/* basecoat@1.0.2 styles/vega.css .input-group — h-9 rounded-md border border-input\r\n   shadow-xs focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/50 */\r\n[mono-date] > [mono-field] {\r\n  --_mono-date-bc: var(--_mono-date-border-color);\r\n  --_mono-date-side-bc: var(--mono-date-side-border-color, var(--_mono-date-side-border-color-preset, var(--_mono-date-bc)));\r\n  --_mono-date-ring: 0 0 #0000;\r\n\r\n  position: relative;\r\n  display: flex;\r\n  align-items: center;\r\n  width: 100%;\r\n  min-width: 0;\r\n  min-height: var(--_mono-date-height);\r\n  padding-block: var(--mono-date-padding-y, 0);\r\n  outline-style: none;\r\n  border: var(--mono-border-width) solid var(--_mono-date-bc);\r\n  border-top-color: var(--_mono-date-side-bc);\r\n  border-inline-color: var(--_mono-date-side-bc);\r\n  border-radius: var(--_mono-date-radius);\r\n  background: var(--_mono-date-bg);\r\n  color: var(--_mono-date-text);\r\n  box-shadow: var(--_mono-date-ring), var(--_mono-date-shadow);\r\n  transition-property: color, box-shadow, border-color, background-color;\r\n  transition-timing-function: var(--mono-ease);\r\n  transition-duration: var(--mono-duration);\r\n\r\n  &:focus-within {\r\n    --_mono-date-bc: var(--_mono-date-ring-color);\r\n    --_mono-date-ring: 0 0 0 var(--_mono-date-ring-width) color-mix(in oklab, var(--_mono-date-ring-color) var(--_mono-date-ring-alpha), transparent);\r\n  }\r\n}\r\n\r\n/* basecoat@1.0.2 styles/vega.css .input-group — has-[[aria-invalid=true]]:border-destructive\r\n   has-[[aria-invalid=true]]:ring-3 has-[[aria-invalid=true]]:ring-destructive/20 */\r\n[mono-date][mono-validation-state=\"error\"] > [mono-field],\r\n[mono-date] > [mono-field]:has(> [mono-native][aria-invalid=\"true\"]) {\r\n  --_mono-date-bc: var(--mono-mode-invalid-border);\r\n  --_mono-date-ring: 0 0 0 var(--_mono-date-ring-width) var(--mono-mode-invalid-ring);\r\n}\r\n\r\n/* EXTENSION — success is the invalid pattern in --success */\r\n[mono-date][mono-validation-state=\"success\"] > [mono-field] {\r\n  --_mono-date-bc: color-mix(in oklab, var(--_mono-date-success) var(--mono-mode-state-border-alpha), transparent);\r\n  --_mono-date-ring: 0 0 0 var(--_mono-date-ring-width) color-mix(in oklab, var(--_mono-date-success) var(--mono-mode-state-ring-alpha), transparent);\r\n}\r\n\r\n/* EXTENSION — readonly: a muted surface */\r\n[mono-date][mono-readonly] > [mono-field] {\r\n  background: var(--mono-date-readonly-bg, var(--muted));\r\n}\r\n\r\n/* basecoat@1.0.2 styles/vega.css .input-group:has(> :is(input, textarea, select, [data-control]):disabled) — opacity-50 */\r\n[mono-date][mono-disabled] > [mono-field],\r\n[mono-date]:not([mono-readonly]) > [mono-field]:has(> [mono-native]:disabled) {\r\n  opacity: 0.5;\r\n  cursor: not-allowed;\r\n  background: var(--mono-date-disabled-bg, var(--_mono-date-bg));\r\n}\r\n\r\n/* =========================================\r\n   The native input (flatpickr's altInput takes the same rule: it replaces the\r\n   native in the DOM and inherits its class + attributes)\r\n   ========================================= */\r\n\r\n/* basecoat@1.0.2 components/input-group.css .input-group > :is(input, textarea, select, [data-control]) */\r\n/* basecoat@1.0.2 styles/vega.css .input-group > :is(input, select, [data-control]) — px-2.5 py-1 text-sm */\r\n[mono-date] [mono-native],\r\n[mono-date] [mono-field] > input.flatpickr-input.altInput {\r\n  display: block;\r\n  flex: 1 1 auto;\r\n  width: 100%;\r\n  min-width: 0;\r\n  align-self: stretch;\r\n  appearance: none;\r\n  margin: 0;\r\n  border: 0;\r\n  border-radius: 0;\r\n  outline: none;\r\n  background: transparent;\r\n  box-shadow: none;\r\n  color: var(--_mono-date-text);\r\n  font-family: inherit;\r\n  font-size: var(--_mono-date-font-size);\r\n  line-height: var(--_mono-date-line-height);\r\n  padding-inline: var(--_mono-date-padding-x);\r\n  padding-block: 0;\r\n\r\n  &::placeholder {\r\n    color: var(--_mono-date-placeholder);\r\n  }\r\n\r\n  &:disabled {\r\n    pointer-events: none;\r\n    cursor: not-allowed;\r\n  }\r\n\r\n  &:read-only {\r\n    cursor: inherit;\r\n  }\r\n\r\n  &:focus,\r\n  &:focus-visible {\r\n    outline: none !important;\r\n  }\r\n}\r\n\r\n/* basecoat@1.0.2 styles/vega.css .input-group:not([data-orientation='vertical']):has(> :is([data-align='start'], [data-align='inline-start'])) > :is(input, select, [data-control]) — ps-1.5 */\r\n[mono-date] > [mono-field]:has(> [mono-prefix]:not([mono-empty])) > :is([mono-native], input.flatpickr-input.altInput) {\r\n  padding-inline-start: var(--mono-date-affix-gap, calc(var(--mono-spacing) * 1.5));\r\n}\r\n[mono-date] > [mono-field]:has(> [mono-clear]) > :is([mono-native], input.flatpickr-input.altInput) {\r\n  padding-inline-end: var(--mono-date-affix-gap, calc(var(--mono-spacing) * 1.5));\r\n}\r\n\r\n/* =========================================\r\n   The leading icon\r\n   ========================================= */\r\n\r\n/* basecoat@1.0.2 styles/vega.css .input-group > :is(span, [role='group'], header, footer), .input-group > :is(svg, kbd, .popover, .dropdown-menu)\r\n   — text-muted-foreground select-none, svg size-4; [data-align='start'] ps-2 */\r\n[mono-date] [mono-prefix] {\r\n  flex: 0 0 auto;\r\n  display: inline-flex;\r\n  align-items: center;\r\n  padding-inline-start: var(--_mono-date-affix-padding);\r\n  color: var(--_mono-date-muted);\r\n  user-select: none;\r\n  pointer-events: none;\r\n}\r\n\r\n[mono-date] [mono-prefix] > :is(svg, .mono-icon, [mono-icon]) {\r\n  display: block;\r\n  width: var(--_mono-date-affix-icon);\r\n  height: var(--_mono-date-affix-icon);\r\n  flex-shrink: 0;\r\n}\r\n\r\n/* =========================================\r\n   Clear button — a ghost icon button in the end slot\r\n   ========================================= */\r\n\r\n/* basecoat@1.0.2 styles/vega.css .input-group > :is(button, [role='group'] > button, header > button, footer > button):has(> svg):not(:has(> :not(svg)))\r\n   — size-6 rounded-[calc(var(--radius)-5px)] p-0 shadow-none, svg size-3.5; me-1 */\r\n[mono-date] [mono-clear] {\r\n  flex: 0 0 auto;\r\n  display: inline-flex;\r\n  align-items: center;\r\n  justify-content: center;\r\n  width: var(--_mono-date-clear);\r\n  height: var(--_mono-date-clear);\r\n  padding: 0;\r\n  margin: 0;\r\n  margin-inline-end: var(--mono-spacing);\r\n  border: 0;\r\n  border-radius: var(--mono-date-clear-radius, calc(var(--radius) - 5px));\r\n  background: transparent;\r\n  box-shadow: none;\r\n  color: var(--_mono-date-muted);\r\n  font: inherit;\r\n  line-height: 1;\r\n  cursor: pointer;\r\n  outline-style: none;\r\n  transition-property: color, background-color, box-shadow;\r\n  transition-timing-function: var(--mono-ease);\r\n  transition-duration: var(--mono-duration);\r\n\r\n  &:focus-visible {\r\n    box-shadow: 0 0 0 var(--_mono-date-ring-width) color-mix(in oklab, var(--_mono-date-ring-color) var(--_mono-date-ring-alpha), transparent);\r\n  }\r\n}\r\n\r\n/* basecoat@1.0.2 styles/vega.css .btn[data-variant='ghost'] — hover:bg-muted hover:text-foreground */\r\n@media (hover: hover) {\r\n  [mono-date] [mono-clear]:hover {\r\n    background: var(--mono-mode-ghost-hover);\r\n    color: var(--_mono-date-text);\r\n  }\r\n}\r\n\r\n[mono-date] [mono-clear] > :is(svg, .mono-icon, [mono-icon]) {\r\n  display: block;\r\n  width: var(--_mono-date-clear-glyph);\r\n  height: var(--_mono-date-clear-glyph);\r\n  pointer-events: none;\r\n}\r\n\r\n/* =========================================\r\n   Message\r\n   ========================================= */\r\n\r\n/* basecoat@1.0.2 styles/vega.css .fieldset legend + p, .field > p, .field section > p */\r\n[mono-date] > [mono-message-wrap] {\r\n  display: block;\r\n}\r\n\r\n[mono-date] > [mono-message-wrap]:not(:has([mono-message]:not([mono-empty]))) {\r\n  display: none;\r\n}\r\n\r\n[mono-date] [mono-message] {\r\n  font-size: var(--mono-date-message-font-size, var(--mono-text-sm));\r\n  line-height: var(--mono-date-message-line-height, var(--mono-leading-normal));\r\n  font-weight: var(--mono-font-weight-normal);\r\n  text-align: start;\r\n  color: var(--_mono-date-muted);\r\n}\r\n\r\n/* basecoat@1.0.2 styles/vega.css .field [role=\"alert\"] — text-destructive text-sm */\r\n[mono-date] [mono-message=\"error\"] {\r\n  color: var(--_mono-date-danger);\r\n}\r\n\r\n[mono-date] [mono-message=\"success\"] {\r\n  color: var(--_mono-date-success);\r\n}\r\n\r\n@media (prefers-reduced-motion: reduce) {\r\n  [mono-date] > [mono-field],\r\n  [mono-date] [mono-clear] {\r\n    transition: none;\r\n  }\r\n}\r\n\r\n/* =========================================\r\n   flatpickr calendar — restyled in Basecoat's idiom\r\n   -----------------------------------------\r\n   The calendar renders into <body>, so it reads the page tokens and cannot see\r\n   the field's resolvers; the element copies the field's accent onto it as\r\n   `--cal-accent` / `--cal-accent-foreground` (inline) so it follows the `color`\r\n   prop. Every rule is scoped to our `.mono-flatpickr` marker; flatpickr's own\r\n   geometry (day cells, container widths) is kept — only colour, radius,\r\n   typography and the frame are ours.\r\n\r\n   basecoat@1.0.2 styles/vega.css .select:not(select) [data-popover] — the frame:\r\n   bg-popover text-popover-foreground ring-1 ring-foreground/10 rounded-md\r\n   shadow-md. EXTENSION: the day / caption / nav values are shadcn's Calendar\r\n   (Basecoat 1.0.2 ships no calendar): day size-8 rounded-md text-sm,\r\n   hover / today / in-range bg-accent text-accent-foreground, selected\r\n   bg-primary text-primary-foreground, outside days text-muted-foreground/50,\r\n   caption text-sm font-medium, weekdays text-muted-foreground text-[0.8rem].\r\n   ========================================= */\r\n.flatpickr-calendar.mono-flatpickr {\r\n  --cal-bg: var(--mono-date-calendar-bg, var(--popover));\r\n  --cal-text: var(--mono-date-calendar-color, var(--popover-foreground));\r\n  --cal-muted: var(--muted-foreground);\r\n  --cal-faint: color-mix(in oklab, var(--muted-foreground) 50%, transparent);\r\n  --cal-border: var(--border);\r\n  --cal-soft: var(--accent);\r\n  --cal-soft-foreground: var(--accent-foreground);\r\n  --cal-accent: var(--primary);\r\n  --cal-accent-foreground: var(--primary-foreground);\r\n  --cal-radius: var(--mono-date-calendar-day-radius, var(--mono-radius-md));\r\n\r\n  background: var(--cal-bg);\r\n  border: 0;\r\n  border-radius: var(--mono-date-calendar-radius, var(--mono-radius-md));\r\n  box-shadow: var(--mono-date-calendar-ring, 0 0 0 1px color-mix(in oklab, var(--foreground) 10%, transparent)), var(--mono-date-calendar-shadow, var(--mono-shadow-md));\r\n  color: var(--cal-text);\r\n  font-family: inherit;\r\n  font-size: var(--mono-text-sm);\r\n  line-height: var(--mono-text-sm--lh);\r\n}\r\n\r\n/* a popover has no pointer arrow */\r\n.flatpickr-calendar.mono-flatpickr::before,\r\n.flatpickr-calendar.mono-flatpickr::after {\r\n  display: none;\r\n}\r\n\r\n/* months / header — text-sm font-medium */\r\n.flatpickr-calendar.mono-flatpickr .flatpickr-month,\r\n.flatpickr-calendar.mono-flatpickr .flatpickr-current-month,\r\n.flatpickr-calendar.mono-flatpickr .flatpickr-current-month input.cur-year {\r\n  color: var(--cal-text);\r\n  fill: var(--cal-text);\r\n  font-size: var(--mono-text-sm);\r\n  font-weight: var(--mono-font-weight-medium);\r\n}\r\n\r\n/* nav — .btn[data-variant='outline'][data-size='icon-sm']: size-7 rounded-md\r\n   border-border bg-background hover:bg-muted, painted flat here */\r\n.flatpickr-calendar.mono-flatpickr .flatpickr-prev-month,\r\n.flatpickr-calendar.mono-flatpickr .flatpickr-next-month {\r\n  color: var(--cal-muted);\r\n  fill: var(--cal-muted);\r\n  border-radius: var(--cal-radius);\r\n  transition-property: color, background-color;\r\n  transition-timing-function: var(--mono-ease);\r\n  transition-duration: var(--mono-duration);\r\n}\r\n\r\n.flatpickr-calendar.mono-flatpickr .flatpickr-prev-month svg,\r\n.flatpickr-calendar.mono-flatpickr .flatpickr-next-month svg {\r\n  fill: currentColor;\r\n}\r\n\r\n.flatpickr-calendar.mono-flatpickr .flatpickr-prev-month:hover,\r\n.flatpickr-calendar.mono-flatpickr .flatpickr-next-month:hover {\r\n  background: var(--cal-soft);\r\n  color: var(--cal-soft-foreground);\r\n}\r\n\r\n.flatpickr-calendar.mono-flatpickr .flatpickr-prev-month:hover svg,\r\n.flatpickr-calendar.mono-flatpickr .flatpickr-next-month:hover svg {\r\n  fill: var(--cal-soft-foreground);\r\n}\r\n\r\n/* month dropdown — a native <select>. Its popup list is drawn by the browser\r\n   from the select's OWN background-color and the option colours (a transparent\r\n   select falls back to the OS palette, which is what mismatched the dark popover),\r\n   so the select carries the popover surface and never changes it on hover. */\r\n.flatpickr-calendar.mono-flatpickr .flatpickr-monthDropdown-months {\r\n  background: var(--cal-bg);\r\n  color: var(--cal-text);\r\n  color-scheme: inherit;\r\n  font-weight: var(--mono-font-weight-medium);\r\n  border-radius: var(--cal-radius);\r\n  transition-property: color;\r\n  transition-timing-function: var(--mono-ease);\r\n  transition-duration: var(--mono-duration);\r\n}\r\n\r\n.flatpickr-calendar.mono-flatpickr .flatpickr-monthDropdown-months:hover {\r\n  background: var(--cal-bg);\r\n  color: var(--cal-accent);\r\n}\r\n\r\n.flatpickr-calendar.mono-flatpickr .flatpickr-monthDropdown-months .flatpickr-monthDropdown-month {\r\n  background: var(--cal-bg);\r\n  color: var(--cal-text);\r\n  font-weight: var(--mono-font-weight-normal);\r\n}\r\n\r\n.flatpickr-calendar.mono-flatpickr .flatpickr-monthDropdown-months .flatpickr-monthDropdown-month:checked {\r\n  background: var(--cal-soft);\r\n  color: var(--cal-soft-foreground);\r\n}\r\n\r\n/* year stepper */\r\n\r\n.flatpickr-calendar.mono-flatpickr .numInputWrapper:hover {\r\n  background: var(--cal-soft);\r\n}\r\n\r\n.flatpickr-calendar.mono-flatpickr .numInputWrapper span {\r\n  border-color: var(--cal-border);\r\n}\r\n\r\n.flatpickr-calendar.mono-flatpickr .numInputWrapper span:hover {\r\n  background: var(--cal-soft);\r\n}\r\n\r\n.flatpickr-calendar.mono-flatpickr .numInputWrapper span.arrowUp::after {\r\n  border-bottom-color: var(--cal-muted);\r\n}\r\n\r\n.flatpickr-calendar.mono-flatpickr .numInputWrapper span.arrowDown::after {\r\n  border-top-color: var(--cal-muted);\r\n}\r\n\r\n/* weekdays — text-muted-foreground text-[0.8rem] font-normal */\r\n.flatpickr-calendar.mono-flatpickr .flatpickr-weekdays {\r\n  background: transparent;\r\n}\r\n\r\n.flatpickr-calendar.mono-flatpickr span.flatpickr-weekday {\r\n  background: transparent;\r\n  color: var(--cal-muted);\r\n  font-size: 0.8rem;\r\n  font-weight: var(--mono-font-weight-normal);\r\n}\r\n\r\n/* days — rounded-md text-sm; hover bg-accent; today bg-accent; selected bg-primary */\r\n.flatpickr-calendar.mono-flatpickr .flatpickr-day {\r\n  color: var(--cal-text);\r\n  border: 1px solid transparent;\r\n  border-radius: var(--cal-radius);\r\n  font-size: var(--mono-text-sm);\r\n  font-weight: var(--mono-font-weight-normal);\r\n}\r\n\r\n.flatpickr-calendar.mono-flatpickr .flatpickr-day:hover,\r\n.flatpickr-calendar.mono-flatpickr .flatpickr-day:focus {\r\n  background: var(--cal-soft);\r\n  border-color: transparent;\r\n  color: var(--cal-soft-foreground);\r\n}\r\n\r\n.flatpickr-calendar.mono-flatpickr .flatpickr-day.today {\r\n  background: var(--cal-soft);\r\n  border-color: transparent;\r\n  color: var(--cal-soft-foreground);\r\n}\r\n\r\n.flatpickr-calendar.mono-flatpickr .flatpickr-day.selected,\r\n.flatpickr-calendar.mono-flatpickr .flatpickr-day.startRange,\r\n.flatpickr-calendar.mono-flatpickr .flatpickr-day.endRange,\r\n.flatpickr-calendar.mono-flatpickr .flatpickr-day.selected:hover,\r\n.flatpickr-calendar.mono-flatpickr .flatpickr-day.startRange:hover,\r\n.flatpickr-calendar.mono-flatpickr .flatpickr-day.endRange:hover,\r\n.flatpickr-calendar.mono-flatpickr .flatpickr-day.selected:focus,\r\n.flatpickr-calendar.mono-flatpickr .flatpickr-day.startRange:focus,\r\n.flatpickr-calendar.mono-flatpickr .flatpickr-day.endRange:focus,\r\n.flatpickr-calendar.mono-flatpickr .flatpickr-day.selected.today {\r\n  background: var(--cal-accent);\r\n  border-color: var(--cal-accent);\r\n  color: var(--cal-accent-foreground);\r\n}\r\n\r\n/* range middle — bg-accent, squared between the two ends */\r\n.flatpickr-calendar.mono-flatpickr .flatpickr-day.inRange {\r\n  background: var(--cal-soft);\r\n  border-color: transparent;\r\n  color: var(--cal-soft-foreground);\r\n  border-radius: 0;\r\n  box-shadow: -5px 0 0 var(--cal-soft), 5px 0 0 var(--cal-soft);\r\n}\r\n\r\n.flatpickr-calendar.mono-flatpickr .flatpickr-day.prevMonthDay,\r\n.flatpickr-calendar.mono-flatpickr .flatpickr-day.nextMonthDay {\r\n  color: var(--cal-faint);\r\n}\r\n\r\n.flatpickr-calendar.mono-flatpickr .flatpickr-day.flatpickr-disabled,\r\n.flatpickr-calendar.mono-flatpickr .flatpickr-day.flatpickr-disabled:hover {\r\n  color: var(--cal-faint);\r\n  background: transparent;\r\n  cursor: not-allowed;\r\n}\r\n\r\n/* week numbers */\r\n.flatpickr-calendar.mono-flatpickr .flatpickr-weekwrapper .flatpickr-weekday,\r\n.flatpickr-calendar.mono-flatpickr .flatpickr-weekwrapper span.flatpickr-day {\r\n  color: var(--cal-faint);\r\n}\r\n\r\n/* time */\r\n.flatpickr-calendar.mono-flatpickr.hasTime .flatpickr-time {\r\n  border-top: 1px solid var(--cal-border);\r\n}\r\n\r\n.flatpickr-calendar.mono-flatpickr .flatpickr-time input,\r\n.flatpickr-calendar.mono-flatpickr .flatpickr-time .flatpickr-time-separator,\r\n.flatpickr-calendar.mono-flatpickr .flatpickr-time .flatpickr-am-pm {\r\n  color: var(--cal-text);\r\n  background: transparent;\r\n}\r\n\r\n.flatpickr-calendar.mono-flatpickr .flatpickr-time input:hover,\r\n.flatpickr-calendar.mono-flatpickr .flatpickr-time input:focus,\r\n.flatpickr-calendar.mono-flatpickr .flatpickr-time .flatpickr-am-pm:hover,\r\n.flatpickr-calendar.mono-flatpickr .flatpickr-time .flatpickr-am-pm:focus {\r\n  background: var(--cal-soft);\r\n  color: var(--cal-soft-foreground);\r\n}\r\n\r\n/* the inline calendar (`inline`) sits in the page flow, on the field's own surface */\r\n.flatpickr-calendar.mono-flatpickr.inline {\r\n  box-shadow: var(--mono-date-calendar-ring, 0 0 0 1px color-mix(in oklab, var(--foreground) 10%, transparent));\r\n}\r\n";
//#endregion
//#region src/components/date/mono-date.ts
var MonoDate = class MonoDate extends MonoDateCore(LitElement) {
	static {
		this.styles = [unsafeCSS(date_default)];
	}
	createRenderRoot() {
		return this;
	}
};
MonoDate = __decorate([customElement("mono-date")], MonoDate);
//#endregion
export { MonoDate };
