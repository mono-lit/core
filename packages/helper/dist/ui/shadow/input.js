import { a as __decorate, f as customElement, i as withShadowUtilityStyles, l as defineHybridPropAliases, r as toShadowCss, s as booleanStringConverter, t as flushSsrHydration } from "../../hydration-flush-DHrl4_KK.js";
import { t as dispatchMonoEvent } from "../../mono-event-BPku9HpS.js";
import { n as cssPart } from "../../css-class-B6Tc_MAx.js";
import { a as parseFormat, c as stripFormat, i as normaliseValue, n as caretAfterFormat, o as resolveFormat, r as localeSeparators, s as significantFor, t as applyFormat } from "../../input-format-GrRCJBqV.js";
import { t as buildSizeStyle } from "../../css-size-DWAPgQdT.js";
import { t as MonoFormControlCore } from "../../form-control-core-CIdMLXMo.js";
import { n as FieldTooltipController, t as field_tooltip_css_raw_default } from "../../field-tooltip.css_raw-DEctHXKm.js";
import { n as label_position_css_raw_default, r as FieldValidationController, t as field_validation_css_raw_default } from "../../field-validation.css_raw-B3Iu33rS.js";
import { t as input_css_raw_default } from "../../input.css_raw-CQu2fAsU.js";
import { LitElement, html, isServer, nothing, unsafeCSS } from "lit";
import { property, query, state } from "lit/decorators.js";
import { ifDefined } from "lit/directives/if-defined.js";
import { styleMap } from "lit/directives/style-map.js";

//#region src/components/input/input-core.ts
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
* `modelValue` reflects to `model-value`, but only while it is TEXT — a `type="file"` value is a
* `File` / `File[]`, which would otherwise land in the DOM as `"[object File]"`.
*/
const modelValueConverter = {
	fromAttribute(value) {
		return value ?? "";
	},
	toAttribute(value) {
		return typeof value === "string" ? value : null;
	}
};
/**
* `MonoInputCore` — all render-mode-agnostic logic for `mono-input`: reactive
* props, hybrid prop aliases (camelCase ↔ kebab ↔ lowercase), attribute
* observation, value/model two-way sync, events, validation/class computation,
* sizing, and imperative focus/blur/select.
*
* It deliberately leaves out:
*  - `createRenderRoot()` (light vs shadow) — set by each wrapper.
*  - the slot strategy + `render()` — light uses a capture/`data-mono-slot`
*    hack; shadow uses native `<slot>` with slotchange-driven presence. The
*    shared `_hasXxxSlotState` `@state` fields back both strategies and feed the
*    class getters.
*/
const MonoInputCore = (superClass) => {
	class MonoInputCoreClass extends MonoFormControlCore(superClass) {
		constructor(...args) {
			super(...args);
			this.cssClass = {};
			this.cssClassName = "";
			this.type = "text";
			this.size = "md";
			this.color = "primary";
			this.variant = "outlined";
			this.labelPosition = "top";
			this.validationPosition = "bottom";
			this.modelValue = "";
			this.value = "";
			this.accept = "";
			this.multiple = false;
			this.showValue = true;
			this.formatOn = "input";
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
				}
			}), () => this.renderRoot?.querySelector?.("[mono-input] > [mono-field]"));
			this.validationState = "default";
			this.validationMessage = "";
			this.error = false;
			this.errorMessage = "";
			this.success = false;
			this.successMessage = "";
			this.pattern = "";
			this.autocomplete = "";
			this.inputmode = "";
			this.disabled = false;
			this.readonly = false;
			this.required = false;
			this.clearable = false;
			this.autofocus = false;
			this._display = "";
			this._focused = false;
			this._internalWrite = false;
			this._hasPrefixSlotState = false;
			this._hasSuffixSlotState = false;
			this._hasLabelSlotState = false;
			this._hasHelperSlotState = false;
			this._inputId = `mono-input-${Math.random().toString(36).slice(2)}`;
			this._messageId = `${this._inputId}-message`;
			defineHybridPropAliases(this, [
				"labelPosition",
				"validationPosition",
				"modelValue",
				"formatDisplay",
				"formatValue",
				"formatOn",
				"formatLocale",
				"helperText",
				"validationState",
				"validationMessage",
				"errorMessage",
				"successMessage",
				"ariaLabelText",
				"minLength",
				"maxLength",
				"maxFileSize",
				"showValue",
				"cssClass",
				"minWidth",
				"maxWidth",
				"minHeight",
				"maxHeight"
			]);
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
				"arialabeltext",
				"arialabel",
				"minlength",
				"maxlength",
				"maxfilesize",
				"showvalue",
				"css-class",
				"cssclass",
				"formatdisplay",
				"format-display",
				"formatvalue",
				"format-value",
				"formaton",
				"formatlocale"
			];
		}
		attributeChangedCallback(name, oldValue, newValue) {
			super.attributeChangedCallback(name, oldValue, newValue);
			if (oldValue === newValue) return;
			switch (name) {
				case "css-class":
				case "cssclass":
					this.cssClassName = newValue ?? "";
					return;
				case "formatdisplay":
				case "format-display":
					this._setFormatFromAttribute("formatDisplay", newValue);
					return;
				case "formatvalue":
				case "format-value":
					this._setFormatFromAttribute("formatValue", newValue);
					return;
				case "formaton":
					this.formatOn = newValue ?? "input";
					return;
				case "formatlocale":
					this.formatLocale = newValue ?? void 0;
					return;
				case "modelvalue":
					this.modelValue = newValue ?? "";
					return;
				case "helpertext":
					this.helperText = newValue ?? "";
					return;
				case "validationstate":
					this.validationState = newValue ?? "default";
					return;
				case "validationmessage":
					this.validationMessage = newValue ?? "";
					return;
				case "errormessage":
					this.errorMessage = newValue ?? "";
					return;
				case "successmessage":
					this.successMessage = newValue ?? "";
					return;
				case "arialabeltext":
				case "arialabel":
					this.ariaLabelText = newValue ?? void 0;
					return;
				case "minlength":
					this.minLength = this._toOptionalNumber(newValue);
					return;
				case "maxlength":
					this.maxLength = this._toOptionalNumber(newValue);
					return;
				case "maxfilesize":
					this.maxFileSize = this._toOptionalNumber(newValue);
					return;
				case "showvalue":
					this.showValue = newValue === null ? true : booleanStringConverter.fromAttribute(newValue);
					return;
			}
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
        class=${`${this._cls("mono-input-message", "message")} ${notice.state}`}
        mono-message=${notice.state}
        mono-sr-only
        role=${notice.state === "invalid" ? "alert" : nothing}
      >${notice.text}</div>`;
		}
		willUpdate(changed) {
			if (this._isFile) {
				if (changed.has("modelValue") || changed.has("type")) {
					const files = this._fileList();
					const names = this._fileNames(files);
					this.value = names;
					this._display = names;
					if (!files.length && this._fileEl) this._fileEl.value = "";
				}
				this._internalWrite = false;
				return;
			}
			if (changed.has("modelValue") && this.value !== this.modelValue) this.value = typeof this.modelValue === "string" ? this.modelValue : "";
			if (changed.has("value") && this.modelValue !== this.value) this.modelValue = String(this.value ?? "");
			if (!this._internalWrite && !this._focused && (changed.has("value") || changed.has("modelValue") || changed.has("formatDisplay"))) this._syncDisplayFromValue();
			this._internalWrite = false;
		}
		firstUpdated() {
			if (this.autofocus) this.focus();
		}
		_toOptionalNumber(value) {
			if (value === void 0 || value === null || value === "") return void 0;
			if (typeof value === "number") return Number.isFinite(value) ? value : void 0;
			if (typeof value === "string") {
				const parsed = Number(value);
				return Number.isFinite(parsed) ? parsed : void 0;
			}
		}
		get _hasPrefixSlot() {
			return this._hasPrefixSlotState;
		}
		get _hasSuffixSlot() {
			return this._hasSuffixSlotState;
		}
		get _hasLabelSlot() {
			return this._hasLabelSlotState;
		}
		get _hasHelperSlot() {
			return this._hasHelperSlotState;
		}
		get _resolvedValidationState() {
			if (this.validationState && this.validationState !== "default") return this.validationState;
			if (this.error || this.errorMessage) return "invalid";
			if (this.success || this.successMessage) return "valid";
			return "default";
		}
		_cls(base, key) {
			return cssPart(this.cssClass, base, key);
		}
		get _wrapperClasses() {
			return [
				"mono-input",
				this.size,
				this.color,
				this.variant,
				this.disabled ? "disabled" : "",
				this.readonly ? "readonly" : "",
				this._resolvedValidationState !== "default" ? `is-${this._resolvedValidationState}` : "",
				this._hasPrefixSlot ? "has-prefix" : "",
				this._hasSuffixSlot || this.clearable || this._isFile ? "has-suffix" : "",
				this.value ? "has-value" : "",
				this.cssClassName,
				this.cssClass?.root
			].filter(Boolean).join(" ");
		}
		get _fieldClasses() {
			return [
				this._cls("mono-input-field", "field"),
				this.size,
				this.color,
				this.variant,
				this.disabled ? "disabled" : "",
				this.readonly ? "readonly" : "",
				this._resolvedValidationState !== "default" ? `is-${this._resolvedValidationState}` : "",
				this._hasPrefixSlot ? "has-prefix" : "",
				this._hasSuffixSlot || this.clearable || this._isFile ? "has-suffix" : "",
				this.value ? "has-value" : ""
			].filter(Boolean).join(" ");
		}
		get _isFile() {
			return this.type === "file";
		}
		get _isRange() {
			return this.type === "range";
		}
		/** `min` / `max` / `step` as the native range resolves them (0 / 100 / 1 when unset). */
		_rangeBounds() {
			const min = this._toOptionalNumber(this.min) ?? 0;
			const rawMax = this._toOptionalNumber(this.max) ?? 100;
			const max = rawMax < min ? min : rawMax;
			const step = this._toOptionalNumber(this.step);
			return {
				min,
				max,
				step: step && step > 0 ? step : 1
			};
		}
		/**
		* The value the slider is actually AT, as a string. An empty value is not a position — the
		* native range parks itself at the midpoint — so the readout and the fill follow the native
		* rule rather than reading `''` as 0. The model is not rewritten: nothing was chosen yet.
		*/
		get _rangeValue() {
			const { min, max, step } = this._rangeBounds();
			const target = this._toOptionalNumber(this.value) ?? min + (max - min) / 2;
			const snapped = min + Math.round((target - min) / step) * step;
			return String(Number(Math.min(max, Math.max(min, snapped)).toFixed(10)));
		}
		/** How far along the track the value sits, 0–100 — drives the fill. */
		get _rangeProgress() {
			const { min, max } = this._rangeBounds();
			if (max === min) return 0;
			return (Number(this._rangeValue) - min) / (max - min) * 100;
		}
		/** The readout text: the value drawn through `format-display`. */
		get _rangeText() {
			return this._formatDisplay(this._rangeValue, { pad: true });
		}
		/**
		* A native range ignores `readonly`, so a readonly slider would still move. Put the thumb
		* back where the value says and report that the event was handled.
		*/
		_revertReadonlyRange(event) {
			if (!this._isRange || !this.readonly || this.disabled) return false;
			event.currentTarget.value = this._rangeValue;
			event.stopPropagation();
			return true;
		}
		/** `modelValue` as an array of files, whatever shape it arrived in (File, File[], null, ''). */
		_fileList() {
			const isFile = (v) => !!v && typeof v === "object" && typeof v.name === "string";
			const v = this.modelValue;
			if (Array.isArray(v)) return v.filter(isFile);
			return isFile(v) ? [v] : [];
		}
		_fileNames(files) {
			return files.map((f) => f.name).join(", ");
		}
		_openFilePicker() {
			if (this.disabled || this.readonly) return;
			this._fileEl?.click();
		}
		_handleFileKeydown(event) {
			if (event.key !== "Enter" && event.key !== " ") return;
			event.preventDefault();
			this._openFilePicker();
		}
		/** Files above `maxFileSize` are dropped, each one reported through `error`. */
		_acceptFiles(files, sourceEvent) {
			const limit = this.maxFileSize;
			if (!limit || limit <= 0) return files;
			return files.filter((file) => {
				if (file.size <= limit) return true;
				const detail = {
					message: `File "${file.name}" exceeds the maximum size limit.`,
					reason: "max-file-size",
					file,
					maxFileSize: limit,
					sourceEvent
				};
				dispatchMonoEvent(this, "error", detail);
				return false;
			});
		}
		/**
		* The picker's native `input` fires BEFORE its `change`, i.e. before the value below is
		* written — left to bubble, a host `@input` (and a bound form) would read the OLD value. Our
		* own `input` is emitted from the change handler instead.
		*/
		_swallowNativeInput(event) {
			event.stopPropagation();
		}
		_handleFileChange(event) {
			if (this.disabled || this.readonly) return;
			const input = event.currentTarget;
			const files = this._acceptFiles(Array.from(input.files ?? []), event);
			if (!files.length) {
				input.value = "";
				return;
			}
			this._internalWrite = true;
			const oldValue = this.modelValue;
			const nextValue = this.multiple ? files : files[0];
			this.modelValue = nextValue;
			this.value = this._display = this._fileNames(files);
			const detail = this._createModelDetail({
				modelValue: nextValue,
				oldValue,
				sourceEvent: event
			});
			this._emitInput(detail);
			this._emitChange(detail);
		}
		_createModelDetail(args) {
			return {
				...this._isFile ? { files: this._fileList() } : {},
				modelValue: args.modelValue,
				currentValue: args.modelValue,
				oldValue: args.oldValue,
				value: args.modelValue,
				displayValue: this._display,
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
		_emitClear(detail) {
			dispatchMonoEvent(this, "clear", detail);
		}
		/**
		* Take a format from an ATTRIBUTE.
		*
		* Both format props are `attribute: false`, because a function cannot cross an attribute —
		* so Lit ignores the markup form entirely and this is what puts it back. Two guards, both
		* borrowed from `mono-select`'s `displayValue`, which has exactly this shape:
		*
		* - a function already set through `.prop` is never overwritten by an attribute;
		* - Vue stringifies non-primitive props when it also mirrors them as attributes, so a value
		*   that merely LOOKS like a serialized function is skipped — otherwise the real function,
		*   arriving a tick later, would be clobbered by its own `String()` form.
		*/
		_setFormatFromAttribute(key, next) {
			if (typeof this[key] === "function") return;
			const value = next ?? "";
			if (this._looksLikeSerializedFunction(value)) return;
			this[key] = value;
		}
		_looksLikeSerializedFunction(value) {
			const trimmed = value.trim();
			if (!trimmed) return false;
			return /^(?:asyncs+)?(?:function|([^)]*)s*=>|[A-Za-z_$][w$]*s*=>)/.test(trimmed);
		}
		/** Is either format prop set? Everything below short-circuits when not. */
		get _hasFormat() {
			return !!(this.formatDisplay || this.formatValue);
		}
		/** The display pattern parsed once per read — used for stripping and for caret significance. */
		get _displayDescriptor() {
			const format = this.formatDisplay ?? this.formatValue;
			return typeof format === "string" && format ? parseFormat(format) : null;
		}
		/**
		* The text in the field, reduced to what the user actually typed.
		*
		* A function format has no inverse, so there is nothing to strip — the typed text IS the raw
		* value, and a caller using a function owns both directions.
		*/
		_rawFromDisplay(text) {
			return stripFormat(text, this._displayDescriptor, this.formatLocale);
		}
		/** Re-render the display from the current value. Skipped while focused — see the call site. */
		_syncDisplayFromValue() {
			const raw = this._rawFromDisplay(String(this.value ?? ""));
			this._display = this._formatDisplay(raw, { pad: true });
		}
		_formatDisplay(raw, opts = {}) {
			if (!this.formatDisplay) return raw;
			if (typeof this.formatDisplay === "function") return String(this.formatDisplay({
				value: raw,
				type: this.type,
				locale: this.formatLocale
			}) ?? "");
			const descriptor = parseFormat(this.formatDisplay);
			if (!descriptor) return raw;
			return applyFormat(raw, descriptor, this.formatLocale, opts);
		}
		_formatValue(raw) {
			if (!this.formatValue) return raw;
			if (typeof this.formatValue === "function") return String(this.formatValue({
				value: raw,
				type: this.type,
				locale: this.formatLocale
			}) ?? "");
			const descriptor = parseFormat(this.formatValue);
			if (!descriptor) return raw;
			return normaliseValue(raw, descriptor);
		}
		/**
		* Hold a formatted numeric value inside `min` / `max`.
		*
		* Those two are otherwise INERT on this component. They are forwarded to the native input, and
		* the platform only honours them on `number`, `range` and the date types — while a numeric
		* format REQUIRES `type="text"`, because a native number input blanks itself the moment a
		* grouping separator appears. So `max="100"` on a formatted field did exactly nothing, which
		* is the opposite of what it reads like. This is what gives it meaning.
		*
		* Only the number-pattern path clamps. Everywhere else `min` / `max` keep their native
		* meaning and are simply passed through, so a plain `type="text"` field is untouched —
		* clamping arbitrary text against a number would be nonsense.
		*
		* `max` applies WHILE TYPING; `min` only on commit. The asymmetry is deliberate: a lower
		* bound is crossed on the way to almost every legal value — with `min="10"`, clamping live
		* would rewrite the first `1` to `10` and `15` could never be typed — whereas an upper bound
		* is only ever crossed by overshooting, which is precisely when it should cut.
		*
		* A part-typed value is left alone. `''` and a lone `-` return early, and a trailing decimal
		* point parses to the integer before it, so `"2."` under `max="100"` keeps its point instead
		* of having it deleted from under the caret.
		*
		* Values arriving from OUTSIDE — a `modelValue` binding, a form write-back — are deliberately
		* not clamped: this bounds what a person types, and silently rewriting data handed to the
		* field would hide a mismatch rather than surface it.
		*/
		_clampRaw(raw, opts = {}) {
			if (this._displayDescriptor?.kind !== "number") return raw;
			if (!raw || raw === "-") return raw;
			const n = Number(raw);
			if (!Number.isFinite(n)) return raw;
			const max = this._toOptionalNumber(this.max);
			if (max != null && n > max) return String(max);
			const min = this._toOptionalNumber(this.min);
			if (opts.commit && min != null && n < min) return String(min);
			return raw;
		}
		/**
		* Rewrite the field and put the caret back where the user left it.
		*
		* Written IMPERATIVELY rather than through `this._display` alone, and that is the whole trick:
		* lit commits `.value` in a microtask AFTER this handler returns, and the browser parks the
		* caret at the end of any value it is handed. Writing here — synchronously, inside the input
		* event — means the caret can be restored in the same breath, and setting `_display` to the
		* same string afterwards leaves lit's committed value already matching, so it never writes
		* again and never gets the chance to move it.
		*/
		_applyDisplay(input, next, caretBefore) {
			const prev = input.value;
			if (prev === next) {
				this._display = next;
				return;
			}
			input.value = next;
			this._display = next;
			if (caretBefore == null) return;
			const significant = significantFor(this._displayDescriptor, this.formatLocale);
			const caret = caretAfterFormat(next, caretBefore, prev, significant);
			try {
				input.setSelectionRange(caret, caret);
			} catch {}
		}
		_handleInput(event) {
			if (this._revertReadonlyRange(event)) return;
			if (this.disabled || this.readonly) return;
			this._internalWrite = true;
			const input = event.currentTarget;
			const oldValue = this.modelValue;
			if (!this._hasFormat || this._isRange) {
				const nextValue = input.value;
				this.value = nextValue;
				this.modelValue = nextValue;
				this._display = nextValue;
				this._emitInput(this._createModelDetail({
					modelValue: nextValue,
					oldValue,
					sourceEvent: event
				}));
				return;
			}
			const caret = input.selectionStart;
			const raw = this._clampRaw(this._rawFromDisplay(input.value));
			const nextValue = this._formatValue(raw);
			if (this.formatOn === "input") this._applyDisplay(input, this._formatDisplay(raw), caret);
			else this._display = input.value;
			this.value = nextValue;
			this.modelValue = nextValue;
			this._emitInput(this._createModelDetail({
				modelValue: nextValue,
				oldValue,
				sourceEvent: event
			}));
		}
		_handleChange(event) {
			if (this._revertReadonlyRange(event)) return;
			if (this.disabled || this.readonly) return;
			this._internalWrite = true;
			const input = event.currentTarget;
			const oldValue = this.modelValue;
			if (!this._hasFormat || this._isRange) {
				const nextValue = input.value;
				this.value = nextValue;
				this.modelValue = nextValue;
				this._display = nextValue;
				this._emitChange(this._createModelDetail({
					modelValue: nextValue,
					oldValue,
					sourceEvent: event
				}));
				return;
			}
			const raw = this._clampRaw(this._rawFromDisplay(input.value), { commit: true });
			const nextValue = this._formatValue(raw);
			this._applyDisplay(input, this._formatDisplay(raw, { pad: true }), null);
			this.value = nextValue;
			this.modelValue = nextValue;
			this._emitChange(this._createModelDetail({
				modelValue: nextValue,
				oldValue,
				sourceEvent: event
			}));
		}
		_handleFocus() {
			this._focused = true;
		}
		_handleBlur() {
			this._focused = false;
			if (this._hasFormat) this._syncDisplayFromValue();
		}
		_handleClear() {
			if (this.disabled || this.readonly) return;
			this._internalWrite = true;
			const oldValue = this.modelValue;
			if (this._isFile) {
				const empty = this.multiple ? [] : null;
				this.modelValue = empty;
				this.value = this._display = "";
				if (this._fileEl) this._fileEl.value = "";
				this._inputEl?.focus();
				const detail = this._createModelDetail({
					modelValue: empty,
					oldValue
				});
				this._emitInput(detail);
				this._emitChange(detail);
				this._emitClear(detail);
				return;
			}
			const nextValue = "";
			this.value = nextValue;
			this.modelValue = nextValue;
			this._display = nextValue;
			if (this._inputEl) {
				this._inputEl.value = nextValue;
				this._inputEl.focus();
			}
			const detail = this._createModelDetail({
				modelValue: nextValue,
				oldValue
			});
			this._emitInput(detail);
			this._emitClear(detail);
		}
		/** Inline sizing applied to the root wrapper. */
		_sizeStyle() {
			return buildSizeStyle(this);
		}
		/**
		* The root wrapper, shared by both builds. Its `mono-*` attributes mirror the
		* props one for one and are what input.css styles (`[mono-input][mono-size="sm"]`);
		* a prop at its default emits NO attribute, so the DOM reads exactly like the
		* hand-written CSS-tab markup. The classes stay as inert hooks until 2.0.
		*/
		_renderWrapper(inner) {
			const state = this._resolvedValidationState;
			return html`<div
        class=${this._wrapperClasses}
        style=${styleMap(this._sizeStyle())}
        mono-input
        mono-size=${this.size === "md" ? nothing : this.size}
        mono-color=${this.color === "primary" ? nothing : this.color}
        mono-variant=${this.variant === "outlined" ? nothing : this.variant}
        mono-label-position=${this.labelPosition === "top" ? nothing : this.labelPosition}
        mono-validation-position=${this.validationPosition === "bottom" ? nothing : this.validationPosition}
        mono-validation-state=${state === "default" ? nothing : state}
        mono-type=${this._isFile || this._isRange ? this.type : nothing}
        ?mono-disabled=${this.disabled}
        ?mono-readonly=${this.readonly}
        ?mono-required=${this.required}
        ?mono-clearable=${this.clearable}
      >${inner}</div>`;
		}
		/** Computed aria-label fallback chain (shared by both builds' render()). */
		get _ariaLabel() {
			return this.ariaLabelText || this.label || this.placeholder || void 0;
		}
		/** id referenced by aria-describedby when a message is shown. */
		get _describedBy() {
			return this.validationMessage || this.errorMessage || this.successMessage || this.helperText || this._hasHelperSlot ? this._messageId : void 0;
		}
		/**
		* `type="file"`: a hidden native picker, and in front of it a read-only text input showing
		* the picked name(s). The text input keeps `mono-native` + `.mono-input-native`, so focus,
		* the label's `for`, sizing and the focus ring all behave exactly as on a text field.
		*/
		_renderFileNative() {
			return html`
        <input
          type="file"
          mono-file-input
          hidden
          tabindex="-1"
          accept=${ifDefined(this.accept || void 0)}
          ?multiple=${this.multiple}
          name=${ifDefined(this.name || void 0)}
          ?disabled=${this.disabled}
          @input=${this._swallowNativeInput}
          @change=${this._handleFileChange}
        />
        <input
          id=${this._inputId}
          class=${`${this._cls("mono-input-native", "native")} ${this.size}`}
          mono-native
          mono-file
          type="text"
          readonly
          .value=${this._display}
          placeholder=${ifDefined(this.placeholder || void 0)}
          ?disabled=${this.disabled}
          ?required=${this.required}
          aria-label=${ifDefined(this._ariaLabel)}
          aria-invalid=${this._resolvedValidationState === "invalid" ? "true" : "false"}
          aria-describedby=${ifDefined(this._describedBy)}
          aria-haspopup="dialog"
          @focus=${this._handleFocus}
          @blur=${this._handleBlur}
          @click=${this._openFilePicker}
          @keydown=${this._handleFileKeydown}
        />
      `;
		}
		/** `type="file"` — the upload glyph at the end of the field; clicking it opens the picker too. */
		_renderFileIcon() {
			if (!this._isFile) return nothing;
			return html`
        <span
          class=${this._cls("mono-input-suffix", "fileIcon")}
          mono-suffix
          mono-file-icon
          aria-hidden="true"
          @click=${this._openFilePicker}
        >${this.renderIcon("upload")}</span>
      `;
		}
		/**
		* `type="range"`: Basecoat's slider. The fill is a gradient stop on the track, so the element
		* writes the position as `--mono-input-range-value` (Basecoat's `--slider-value`) — hand-written
		* markup sets the same property itself.
		*/
		_renderRangeNative() {
			const { min, max, step } = this._rangeBounds();
			const text = this._rangeText;
			return html`
        <input
          id=${this._inputId}
          class=${`${this._cls("mono-input-native", "native")} ${this.size}`}
          mono-native
          mono-range
          type="range"
          min=${min}
          max=${max}
          step=${ifDefined(this.step == null ? void 0 : step)}
          .value=${this._rangeValue}
          name=${ifDefined(this.name || void 0)}
          style=${`--mono-input-range-value: ${this._rangeProgress}%`}
          ?disabled=${this.disabled}
          ?required=${this.required}
          aria-label=${ifDefined(this._ariaLabel)}
          aria-valuetext=${ifDefined(text !== this._rangeValue ? text : void 0)}
          aria-readonly=${ifDefined(this.readonly ? "true" : void 0)}
          aria-invalid=${this._resolvedValidationState === "invalid" ? "true" : "false"}
          aria-describedby=${ifDefined(this._describedBy)}
          @focus=${this._handleFocus}
          @blur=${this._handleBlur}
          @input=${this._handleInput}
          @change=${this._handleChange}
        />
      `;
		}
		/**
		* `type="range"` — the value readout. It sits at the end of the LABEL row when there is a
		* label (the EJI ONE layout), and after the slider when there is not; each build calls this
		* from both places and exactly one of them renders. `aria-hidden`: the slider already
		* announces its value (`aria-valuetext` carries the formatted text).
		*/
		_renderRangeValue(where) {
			if (!this._isRange || !this.showValue) return nothing;
			const inLabel = !!(this.label || this._hasLabelSlot);
			if (where === "label" !== inLabel) return nothing;
			return html`<span class=${this._cls("mono-input-range-value", "rangeValue")} mono-range-value aria-hidden="true">${this._rangeText}</span>`;
		}
		/** The native <input>, shared by both builds' render(). */
		_renderNative() {
			if (this._isFile) return this._renderFileNative();
			if (this._isRange) return this._renderRangeNative();
			return html`
        <input
          id=${this._inputId}
          class=${`${this._cls("mono-input-native", "native")} ${this.size}`}
          mono-native
          type=${this.type}
          .value=${this._display}
          name=${ifDefined(this.name || void 0)}
          placeholder=${ifDefined(this.placeholder || void 0)}
          pattern=${ifDefined(this.pattern || void 0)}
          autocomplete=${ifDefined(this.autocomplete || void 0)}
          inputmode=${ifDefined(this.inputmode || void 0)}
          minlength=${ifDefined(this.minLength)}
          maxlength=${ifDefined(this.maxLength)}
          min=${ifDefined(this.min)}
          max=${ifDefined(this.max)}
          step=${ifDefined(this.step)}
          ?disabled=${this.disabled}
          ?readonly=${this.readonly}
          ?required=${this.required}
          aria-label=${ifDefined(this._ariaLabel)}
          aria-invalid=${this._resolvedValidationState === "invalid" ? "true" : "false"}
          aria-describedby=${ifDefined(this._describedBy)}
          @focus=${this._handleFocus}
          @blur=${this._handleBlur}
          @input=${this._handleInput}
          @change=${this._handleChange}
        />
      `;
		}
		/** The clear button (uses the build-specific icon). */
		_renderClear() {
			if (this._isRange || !(this.clearable && this.value && !this.disabled && !this.readonly)) return nothing;
			return html`
        <button
          type="button"
          class=${this._cls("mono-input-clear", "clear")}
          mono-clear
          aria-label="Clear input"
          @click=${this._handleClear}
        >
          ${this.renderIcon("close")}
        </button>
      `;
		}
		/**
		* Icon hook — overridden per build. Light: global `.mono-icon`/`i-mdi-*`
		* UnoCSS icon. Shadow: inline SVG (global icon CSS can't reach a shadow root).
		*/
		renderIcon(_name) {
			return html``;
		}
		focus(options) {
			this._inputEl?.focus(options);
		}
		blur() {
			this._inputEl?.blur();
		}
		select() {
			this._inputEl?.select();
		}
	}
	__decorate([property({ attribute: false })], MonoInputCoreClass.prototype, "cssClass", void 0);
	__decorate([property({
		type: String,
		attribute: "css-class"
	})], MonoInputCoreClass.prototype, "cssClassName", void 0);
	__decorate([property({ type: String })], MonoInputCoreClass.prototype, "type", void 0);
	__decorate([property({ type: String })], MonoInputCoreClass.prototype, "size", void 0);
	__decorate([property({ type: String })], MonoInputCoreClass.prototype, "color", void 0);
	__decorate([property({ type: String })], MonoInputCoreClass.prototype, "variant", void 0);
	__decorate([property({
		type: String,
		attribute: "label-position"
	})], MonoInputCoreClass.prototype, "labelPosition", void 0);
	__decorate([property({
		type: String,
		attribute: "validation-position"
	})], MonoInputCoreClass.prototype, "validationPosition", void 0);
	__decorate([property({
		attribute: "model-value",
		reflect: true,
		converter: modelValueConverter
	})], MonoInputCoreClass.prototype, "modelValue", void 0);
	__decorate([property({ type: String })], MonoInputCoreClass.prototype, "value", void 0);
	__decorate([property({ type: String })], MonoInputCoreClass.prototype, "accept", void 0);
	__decorate([property({
		reflect: true,
		converter: booleanStringConverter
	})], MonoInputCoreClass.prototype, "multiple", void 0);
	__decorate([property({
		attribute: "max-file-size",
		converter: numberStringConverter
	})], MonoInputCoreClass.prototype, "maxFileSize", void 0);
	__decorate([property({
		attribute: "show-value",
		converter: { fromAttribute: (v) => v === null ? true : booleanStringConverter.fromAttribute(v) }
	})], MonoInputCoreClass.prototype, "showValue", void 0);
	__decorate([property({ attribute: false })], MonoInputCoreClass.prototype, "formatDisplay", void 0);
	__decorate([property({ attribute: false })], MonoInputCoreClass.prototype, "formatValue", void 0);
	__decorate([property({ attribute: "format-on" })], MonoInputCoreClass.prototype, "formatOn", void 0);
	__decorate([property({ attribute: "format-locale" })], MonoInputCoreClass.prototype, "formatLocale", void 0);
	__decorate([property({ type: String })], MonoInputCoreClass.prototype, "name", void 0);
	__decorate([property({ type: String })], MonoInputCoreClass.prototype, "placeholder", void 0);
	__decorate([property({ type: String })], MonoInputCoreClass.prototype, "label", void 0);
	__decorate([property({
		type: String,
		attribute: "helper-text"
	})], MonoInputCoreClass.prototype, "helperText", void 0);
	__decorate([property()], MonoInputCoreClass.prototype, "tooltip", void 0);
	__decorate([property({
		type: String,
		attribute: "validation-state"
	})], MonoInputCoreClass.prototype, "validationState", void 0);
	__decorate([property({
		type: String,
		attribute: "validation-message"
	})], MonoInputCoreClass.prototype, "validationMessage", void 0);
	__decorate([property({
		reflect: true,
		converter: booleanStringConverter
	})], MonoInputCoreClass.prototype, "error", void 0);
	__decorate([property({
		type: String,
		attribute: "error-message"
	})], MonoInputCoreClass.prototype, "errorMessage", void 0);
	__decorate([property({
		reflect: true,
		converter: booleanStringConverter
	})], MonoInputCoreClass.prototype, "success", void 0);
	__decorate([property({
		type: String,
		attribute: "success-message"
	})], MonoInputCoreClass.prototype, "successMessage", void 0);
	__decorate([property({ type: String })], MonoInputCoreClass.prototype, "pattern", void 0);
	__decorate([property({ type: String })], MonoInputCoreClass.prototype, "autocomplete", void 0);
	__decorate([property({ type: String })], MonoInputCoreClass.prototype, "inputmode", void 0);
	__decorate([property({
		type: String,
		attribute: "aria-label"
	})], MonoInputCoreClass.prototype, "ariaLabelText", void 0);
	__decorate([property({
		attribute: "min-length",
		converter: numberStringConverter
	})], MonoInputCoreClass.prototype, "minLength", void 0);
	__decorate([property({
		attribute: "max-length",
		converter: numberStringConverter
	})], MonoInputCoreClass.prototype, "maxLength", void 0);
	__decorate([property({ type: Number })], MonoInputCoreClass.prototype, "min", void 0);
	__decorate([property({ type: Number })], MonoInputCoreClass.prototype, "max", void 0);
	__decorate([property({ type: Number })], MonoInputCoreClass.prototype, "step", void 0);
	__decorate([property({
		reflect: true,
		converter: booleanStringConverter
	})], MonoInputCoreClass.prototype, "disabled", void 0);
	__decorate([property({
		reflect: true,
		converter: booleanStringConverter
	})], MonoInputCoreClass.prototype, "readonly", void 0);
	__decorate([property({
		reflect: true,
		converter: booleanStringConverter
	})], MonoInputCoreClass.prototype, "required", void 0);
	__decorate([property({
		reflect: true,
		converter: booleanStringConverter
	})], MonoInputCoreClass.prototype, "clearable", void 0);
	__decorate([property({
		reflect: true,
		converter: booleanStringConverter
	})], MonoInputCoreClass.prototype, "autofocus", void 0);
	__decorate([property({ type: String })], MonoInputCoreClass.prototype, "width", void 0);
	__decorate([property({ type: String })], MonoInputCoreClass.prototype, "height", void 0);
	__decorate([property({
		type: String,
		attribute: "min-width"
	})], MonoInputCoreClass.prototype, "minWidth", void 0);
	__decorate([property({
		type: String,
		attribute: "max-width"
	})], MonoInputCoreClass.prototype, "maxWidth", void 0);
	__decorate([property({
		type: String,
		attribute: "min-height"
	})], MonoInputCoreClass.prototype, "minHeight", void 0);
	__decorate([property({
		type: String,
		attribute: "max-height"
	})], MonoInputCoreClass.prototype, "maxHeight", void 0);
	__decorate([query(".mono-input-native")], MonoInputCoreClass.prototype, "_inputEl", void 0);
	__decorate([query("[mono-file-input]")], MonoInputCoreClass.prototype, "_fileEl", void 0);
	__decorate([state()], MonoInputCoreClass.prototype, "_display", void 0);
	__decorate([state()], MonoInputCoreClass.prototype, "_focused", void 0);
	__decorate([state()], MonoInputCoreClass.prototype, "_hasPrefixSlotState", void 0);
	__decorate([state()], MonoInputCoreClass.prototype, "_hasSuffixSlotState", void 0);
	__decorate([state()], MonoInputCoreClass.prototype, "_hasLabelSlotState", void 0);
	__decorate([state()], MonoInputCoreClass.prototype, "_hasHelperSlotState", void 0);
	return MonoInputCoreClass;
};

//#endregion
//#region src/components/input/mono-input.shadow.ts
const SHADOW_EXTRA_CSS = "";
let MonoInputShadow = class MonoInputShadow extends withShadowUtilityStyles(MonoInputCore(LitElement)) {
	static {
		this.disableWarning?.("change-in-update");
	}
	static {
		this.styles = [unsafeCSS(toShadowCss(input_css_raw_default + label_position_css_raw_default + field_tooltip_css_raw_default + field_validation_css_raw_default, {
			host: "mono-input",
			append: SHADOW_EXTRA_CSS
		}))];
	}
	firstUpdated(changed) {
		super.firstUpdated(changed);
		for (const name of [
			"prefix",
			"suffix",
			"label",
			"helper"
		]) {
			const slot = this.renderRoot.querySelector(`slot[name="${name}"]`);
			this._setSlotState(name, this._slotHasContent(slot));
		}
	}
	_slotHasContent(slot) {
		return !!slot && slot.assignedNodes({ flatten: true }).some((n) => n.nodeType === Node.ELEMENT_NODE || !!(n.textContent ?? "").trim());
	}
	_setSlotState(name, has) {
		if (name === "prefix") this._hasPrefixSlotState = has;
		else if (name === "suffix") this._hasSuffixSlotState = has;
		else if (name === "label") this._hasLabelSlotState = has;
		else if (name === "helper") this._hasHelperSlotState = has;
	}
	_onSlotChange(name, event) {
		this._setSlotState(name, this._slotHasContent(event.target));
	}
	renderIcon(name) {
		if (name === "upload") return html`
        <svg viewBox="0 0 24 24" mono-icon fill="currentColor" aria-hidden="true">
          <path d="M6.5 20q-2.28 0-3.89-1.57Q1 16.85 1 14.58q0-1.95 1.17-3.48q1.18-1.53 3.08-1.95q.63-2.3 2.5-3.72Q9.63 4 12 4q2.93 0 4.96 2.04Q19 8.07 19 11q1.73.2 2.86 1.5q1.14 1.28 1.14 3q0 1.88-1.31 3.19T18.5 20H13q-.82 0-1.41-.59Q11 18.83 11 18v-5.15L9.4 14.4L8 13l4-4l4 4l-1.4 1.4l-1.6-1.55V18h5.5q1.05 0 1.77-.73q.73-.72.73-1.77t-.73-1.77Q19.55 13 18.5 13H17v-2q0-2.07-1.46-3.54Q14.08 6 12 6Q9.93 6 8.46 7.46Q7 8.93 7 11h-.5q-1.45 0-2.47 1.03Q3 13.05 3 14.5T4.03 17q1.02 1 2.47 1H9v2m3-7" />
        </svg>
      `;
		return html`
      <svg viewBox="0 0 24 24" mono-icon fill="currentColor" aria-hidden="true">
        <path d="M19,6.41L17.59,5L12,10.59L6.41,5L5,6.41L10.59,12L5,17.59L6.41,19L12,13.41L17.59,19L19,17.59L13.41,12L19,6.41Z" />
      </svg>
    `;
	}
	_renderLabel() {
		return html`
      <label
        class=${this._cls("mono-input-label", "label")}
        mono-label
        for=${this._inputId}
        ?mono-empty=${!this.label && !this._hasLabelSlot}
      >
        <slot name="label" @slotchange=${(e) => this._onSlotChange("label", e)}>${this.label}</slot>
        ${this.required ? html`<span class=${this._cls("mono-input-required", "required")} mono-required-mark>*</span>` : nothing}
        ${this._tooltip.render()}
        ${this._renderRangeValue("label")}
      </label>
    `;
	}
	_renderHelper() {
		const base = this._cls("mono-input-message", "message");
		if (this._validation.moved) return html`${this._renderHelperText(base)}${this._renderMovedMessage()}`;
		if (this.validationMessage) {
			const state = this._resolvedValidationState;
			return html`<div class=${`${base} ${state}`} mono-message=${state} role=${state === "invalid" ? "alert" : nothing}>${this.validationMessage}</div>`;
		}
		if (this.errorMessage) return html`<div class=${`${base} invalid`} mono-message="invalid" role="alert">${this.errorMessage}</div>`;
		if (this.successMessage) return html`<div class=${`${base} valid`} mono-message="valid">${this.successMessage}</div>`;
		return this._renderHelperText(base);
	}
	_renderHelperText(base) {
		return html`
      <div
        class=${`${base} helper`}
        mono-message="helper"
        ?mono-empty=${!this.helperText && !this._hasHelperSlot}
      >
        <slot name="helper" @slotchange=${(e) => this._onSlotChange("helper", e)}>${this.helperText}</slot>
      </div>
    `;
	}
	render() {
		return this._renderWrapper(html`
        ${this._renderLabel()}
        <div class=${this._fieldClasses} mono-field>
          <span class=${this._cls("mono-input-prefix", "prefix")} mono-prefix ?mono-empty=${!this._hasPrefixSlot}>
            <slot name="prefix" @slotchange=${(e) => this._onSlotChange("prefix", e)}></slot>
          </span>
          ${this._renderNative()}
          ${this._renderRangeValue("field")}
          ${this._validation.renderIcon()}
          ${this._renderClear()}
          ${this._renderFileIcon()}
          <span class=${this._cls("mono-input-suffix", "suffix")} mono-suffix ?mono-empty=${!this._hasSuffixSlot}>
            <slot name="suffix" @slotchange=${(e) => this._onSlotChange("suffix", e)}></slot>
          </span>
        </div>
        <div id=${this._messageId} class=${this.cssClass?.messageWrap ?? ""} mono-message-wrap>
          ${this._renderHelper()}
        </div>
        ${this._validation.renderFloat()}
    `);
	}
	connectedCallback() {
		super.connectedCallback();
		if (isServer) return;
		flushSsrHydration(this);
	}
};
MonoInputShadow = __decorate([customElement("mono-shadow-input")], MonoInputShadow);

//#endregion
//#region src/components/input/input-utils.ts
function validateInputProps(props) {
	const validTypes = [
		"text",
		"email",
		"password",
		"number",
		"tel",
		"url",
		"date",
		"time",
		"month",
		"week",
		"search"
	];
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
	if (props.type && !validTypes.includes(props.type)) return false;
	if (props.size && !validSizes.includes(props.size)) return false;
	if (props.color && !validColors.includes(props.color)) return false;
	if (props.variant && !validVariants.includes(props.variant)) return false;
	return true;
}
function generateInputAttributes(type, disabled, readonly, required, pattern, min, max, step, placeholder) {
	return {
		type,
		disabled: disabled || void 0,
		readonly: readonly || void 0,
		required: required || void 0,
		pattern: pattern || void 0,
		min,
		max,
		step,
		placeholder: placeholder || void 0
	};
}
function generateInputAriaAttributes(disabled, readonly, required, hasError, label, errorMessage) {
	return {
		"aria-disabled": disabled ? "true" : void 0,
		"aria-readonly": readonly ? "true" : void 0,
		"aria-required": required ? "true" : void 0,
		"aria-invalid": hasError ? "true" : void 0,
		"aria-label": label || void 0,
		"aria-errormessage": hasError ? errorMessage || void 0 : void 0
	};
}
function getInputIcon(type) {
	const iconMap = {
		text: "M4 6h16M4 12h16M4 18h10",
		email: "M4 6h16v12H4z M4 7l8 6 8-6",
		password: "M12 17a2 2 0 1 0 0-4a2 2 0 0 0 0 4zm6-7V8a6 6 0 1 0-12 0v2",
		number: "M8 4v16M16 4v16M5 9h14M5 15h14",
		tel: "M6.6 10.8a15.5 15.5 0 0 0 6.6 6.6l2.2-2.2a1.5 1.5 0 0 1 1.5-.36a10 10 0 0 0 3.1.5a1 1 0 0 1 1 1V20a1 1 0 0 1-1 1A17 17 0 0 1 3 4a1 1 0 0 1 1-1h3.06a1 1 0 0 1 1 1a10 10 0 0 0 .5 3.1a1.5 1.5 0 0 1-.36 1.5z",
		url: "M10 14a5 5 0 0 1 0-7l1-1a5 5 0 0 1 7 7l-1 1M14 10a5 5 0 0 1 0 7l-1 1a5 5 0 0 1-7-7l1-1",
		date: "M7 3v3M17 3v3M4 8h16M5 5h14v16H5z",
		time: "M12 7v5l3 3M12 22a10 10 0 1 0 0-20a10 10 0 0 0 0 20z",
		month: "M7 3v3M17 3v3M5 5h14v14H5zM8 11h8",
		week: "M7 3v3M17 3v3M5 5h14v16H5zM9 11h6M9 15h4",
		search: "M21 21l-4.35-4.35M10.5 18a7.5 7.5 0 1 1 0-15a7.5 7.5 0 0 1 0 15z",
		file: "M12 16V8M8.5 11.5L12 8l3.5 3.5M7 18h10",
		range: "M4 12h16M9 9a3 3 0 1 0 0 6a3 3 0 0 0 0-6z"
	};
	return iconMap[type] ?? iconMap.text;
}

//#endregion
export { MonoInputCore, MonoInputShadow, applyFormat, caretAfterFormat, generateInputAriaAttributes, generateInputAttributes, getInputIcon, localeSeparators, normaliseValue, parseFormat, resolveFormat, significantFor, stripFormat, validateInputProps };