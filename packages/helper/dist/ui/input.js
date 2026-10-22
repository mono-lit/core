import { d as buildSizeStyle, g as monoHostChildNodes } from "../mono-ui-KOBJcnXk.js";
import { t as customElement } from "../mono-element-Bc9wElPy.js";
import { a as defineHybridPropAliases, r as booleanStringConverter, t as __decorate } from "../decorate-DbYFpi8R.js";
import { t as dispatchMonoEvent } from "../mono-event-BPku9HpS.js";
import { s as placeSlotNode } from "../light-slots-BnBR29E7.js";
import { t as MonoFormControlCore } from "../form-control-core-CRZPZ1ru.js";
import { a as parseFormat, c as stripFormat, i as normaliseValue, n as caretAfterFormat, o as resolveFormat, r as localeSeparators, s as significantFor, t as applyFormat } from "../input-format-GrRCJBqV.js";
import { n as cssPart } from "../css-class-B6Tc_MAx.js";
import { t as FieldTooltipController } from "../field-tooltip-FyMi9vNM.js";
import { t as FieldValidationController } from "../field-validation-CHHQi1zl.js";
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
//#region \0raw:C:\Users\VCT-DEV\Desktop\libs\packages\helper\src\components\input\input.css?raw.js
var input_css_raw_default = "/* =========================================================================\n   mono-input — a port of Basecoat's `.field` / `.input-group` / `.label`\n   (basecoat-css@1.0.2, vega style).\n\n   Styled by ATTRIBUTE, like Basecoat (`.input-group:has([aria-invalid])`) —\n   and the attributes mirror the element's props one for one, so hand-written\n   markup reads like the Lit / Vue tag:\n\n     <mono-input size=\"sm\" color=\"danger\" variant=\"filled\" label=\"Name\">\n     <div mono-input mono-size=\"sm\" mono-color=\"danger\" mono-variant=\"filled\">\n       <label mono-label>Name</label>\n       <div mono-field><input mono-native></div>\n     </div>\n\n   An absent attribute is the prop's default (`:not([mono-size])` = md,\n   `:not([mono-color])` = primary, `:not([mono-variant])` = outlined,\n   `:not([mono-validation-state])` = default). The element renders these\n   attributes on its wrapper (both builds); the old classes\n   (`.mono-input.sm.danger.filled`) are still emitted as inert hooks for\n   consumer CSS until 2.0 but no rule here reads them.\n\n   Selector map (ours ≡ upstream):\n     [mono-input]                                  ≡ .field            (flex column, gap-3)\n     [mono-input] > [mono-label]                   ≡ .field > label / .label\n     [mono-input] > [mono-field]                   ≡ .input-group      (the bordered box: h-9 rounded-md border-input shadow-xs)\n     [mono-field] > [mono-native]                  ≡ .input-group > input (borderless, px-2.5 text-sm; `.input` for the metrics)\n     [mono-field] > [mono-prefix|mono-suffix]      ≡ .input-group > span[data-align='start'|'end']\n     [mono-field] > [mono-clear]                   ≡ .input-group > button[data-align='end']:has(> svg)\n     [mono-input] > [mono-message-wrap]            ≡ .field > p\n     [mono-message=\"helper\"]                       ≡ .field > p        (text-sm text-muted-foreground)\n     [mono-message=\"invalid\"]                      ≡ .field [role='alert']\n     [mono-validation-state=\"invalid\"]             ≡ .input-group:has([aria-invalid=true]) + .field[data-invalid]\n     [mono-validation-state=\"valid|warning\"]       ≡ EXTENSION (the invalid pattern with --success / --warning)\n     [mono-size=\"xs|sm|lg|xl|xxl\"]                 ≡ EXTENSION (Basecoat sizes only the select; the ladder is --mono-control-height-*)\n     [mono-variant=\"filled\"]                       ≡ EXTENSION (luma's .input-group: border-transparent bg-input/50, ring-ring/30)\n     [mono-variant=\"underlined\"]                   ≡ EXTENSION (sera's .input-group: rounded-none border-b-input px-0, no ring)\n     [mono-disabled] / [mono-native]:disabled      ≡ .input-group:has(input:disabled) — opacity-50\n     [mono-readonly]                               ≡ EXTENSION (a muted surface)\n\n   Specificity contract (same as the pre-port class sheet, and as checkbox.css):\n   a part's RESTING rule is written `:where([mono-input]) [mono-part]` = exactly\n   one attribute, (0,1,0) — so a utility class composed onto the markup (the\n   `cssClass` prop, or a hand-written class in a css/ demo) wins by source order,\n   while the prop and state rules ([mono-size], [mono-variant], [mono-disabled],\n   :focus-within, [aria-invalid], …) stay heavier and still win over it.\n\n   Inner parts are attributes too: [mono-label] (+ [mono-required-mark]),\n   [mono-field], [mono-prefix] / [mono-suffix] (+ [mono-empty] in the shadow\n   build for an unassigned slot), [mono-native], [mono-clear] > [mono-icon],\n   [mono-message-wrap] > [mono-message=\"helper|valid|invalid|warning\"].\n\n   Values are copied from the compiled vendor sheet (vendor/basecoat/basecoat-\n   vega.cdn.css) through the token layer: `--spacing` → `--mono-spacing`,\n   `--text-sm` → `--mono-text-sm`, `--radius-md` → `--mono-radius-md`,\n   `--color-x` → `--x`, Tailwind's `--tw-ring-*` stack → the two-slot\n   `box-shadow: ring, shadow` below, and every `dark:` variant → a\n   `--mono-mode-*` token (a selector cannot cross a shadow boundary; an\n   inherited custom property can).\n\n   FLAVORS (Basecoat's other seven styles, src/data/theme/flavors/*.css) set\n   the knobs read below — `--mono-input-radius`, `--mono-input-padding-x-<size>`,\n   `--mono-input-font-<size>`, `--mono-input-line-height`, `--mono-input-ring-width`,\n   `--mono-input-ring-alpha`, `--mono-input-gap`, `--mono-input-affix-*`,\n   `--mono-input-label-*`, `--mono-input-message-*`, `--mono-input-clear-radius`,\n   `--mono-input-disabled-bg`, and the outline-variant set `--mono-input-outline-\n   {bg,border-color,side-border-color,shadow,ring-width,radius,padding-x,affix-padding}`.\n   Every fallback here is vega's value\n   (`node scripts/basecoat-styles.mjs --varying \"^\\.(field|label|input|input-group)\\b\"`).\n\n   The public `--mono-input-*` knobs and the three-tier resolver\n   (`--mono-input-x` → `--_mono-input-x-preset` → base) are unchanged: a\n   colour / variant attribute only ever writes a `*-preset` slot, so a\n   consumer's own `--mono-input-bg` on the host still wins.\n   ========================================================================= */\n\nmono-input {\n  display: block;\n}\n\n[mono-input] {\n  /* ── palette: each slot is a public knob over a Basecoat token ─────────── */\n  --_mono-input-text: var(--mono-input-color, var(--mono-input-text, var(--foreground)));\n  --_mono-input-placeholder: var(--mono-input-placeholder, var(--muted-foreground));\n  --_mono-input-muted: var(--mono-input-muted, var(--muted-foreground));\n  /* the `color` prop picks the FOCUS colour; primary is Basecoat's `--ring` */\n  --_mono-input-primary: var(--mono-input-primary, var(--ring));\n  --_mono-input-secondary: var(--mono-input-secondary, var(--muted-foreground));\n  --_mono-input-success: var(--mono-input-success, var(--success));\n  --_mono-input-danger: var(--mono-input-danger, var(--destructive));\n  --_mono-input-warning: var(--mono-input-warning, var(--warning));\n  --_mono-input-info: var(--mono-input-info, var(--info));\n  --_mono-input-teal: var(--mono-input-teal, var(--teal));\n  --_mono-input-purple: var(--mono-input-purple, var(--purple));\n  --_mono-input-neutral: var(--mono-input-neutral, var(--neutral));\n  --_mono-input-dark: var(--mono-input-dark, var(--dark));\n  --_mono-input-valid: var(--mono-input-valid, var(--success));\n  --_mono-input-invalid: var(--mono-input-invalid, var(--destructive));\n  /* the FILL colour of a range (Basecoat paints the slider with --primary, not\n     --ring); the `color` prop writes the preset, a validation state outranks it */\n  --_mono-input-accent: var(--mono-input-accent, var(--_mono-input-accent-preset, var(--mono-input-primary, var(--primary))));\n\n  /* ── the painted result — three tiers, base = .input-group (vega) ──────── */\n  --_mono-input-ring-color: var(--mono-input-ring-color, var(--mono-input-focus-color, var(--_mono-input-ring-color-preset, var(--_mono-input-primary))));\n  --_mono-input-ring-width: var(--mono-input-ring-width, var(--_mono-input-ring-width-preset, var(--mono-ring-width)));\n  --_mono-input-ring-alpha: var(--mono-input-ring-alpha, var(--mono-ring-alpha));\n  --_mono-input-border-color: var(--mono-input-rest-border, var(--mono-input-border-color, var(--_mono-input-border-color-preset, var(--input))));\n  --_mono-input-bg: var(--mono-input-bg, var(--mono-input-surface, var(--_mono-input-bg-preset, var(--mono-mode-surface))));\n  --_mono-input-shadow: var(--mono-input-shadow, var(--_mono-input-shadow-preset, 0 0 #0000));\n  --_mono-input-affix-padding: var(--mono-input-affix-padding, var(--_mono-input-affix-padding-preset, calc(var(--mono-spacing) * 2)));\n  --_mono-input-affix-icon: var(--mono-input-affix-icon-size, calc(var(--mono-spacing) * 4));\n\n  /* ── md metrics live on the unqualified root ON PURPOSE: hand-written\n        `<div mono-input>` that names no size renders exactly like size=\"md\".\n        basecoat@1.0.2 styles/vega.css .input-group — h-9 rounded-md; > input px-2.5 text-sm ── */\n  --_mono-input-height: var(--mono-input-height-md, var(--mono-control-height-md));\n  --_mono-input-radius: var(--mono-input-radius-md, var(--_mono-input-radius-preset, var(--mono-input-radius, var(--mono-radius-md))));\n  --_mono-input-padding-x: var(--mono-input-padding-x-md, var(--_mono-input-padding-x-preset, calc(var(--mono-spacing) * 2.5)));\n  --_mono-input-font-size: var(--mono-input-font-md, var(--mono-text-sm));\n  --_mono-input-line-height: var(--mono-input-line-height, var(--mono-input-line-height-md, var(--mono-text-sm--lh)));\n  --_mono-input-clear: calc(var(--mono-spacing) * 6);\n  --_mono-input-clear-glyph: calc(var(--mono-spacing) * 3.5);\n\n  /* basecoat@1.0.2 styles/vega.css .field — flex w-full flex-col gap-3 */\n  display: flex;\n  flex-direction: column;\n  gap: var(--mono-input-gap, calc(var(--mono-spacing) * 3));\n  width: 100%;\n  font-family: inherit;\n  color: var(--_mono-input-text);\n}\n\n/* A page-level `* { box-sizing: border-box }` reset does NOT cross a shadow\n   boundary; scoped here so both builds measure the same. */\n[mono-input],\n:where([mono-input]) *,\n:where([mono-input]) *::before,\n:where([mono-input]) *::after {\n  box-sizing: border-box;\n}\n\n/* The shadow build renders every slot wrapper and marks an unassigned one\n   `mono-empty`; the light build simply omits it. Inert in the light build. */\n:where([mono-input]) :is([mono-label], [mono-prefix], [mono-suffix], [mono-message])[mono-empty] {\n  display: none;\n}\n\n/* =========================================\n   Sizes — the field's painted height IS the token (tests/perf/field-heights).\n   EXTENSION: Basecoat sizes only its select (data-size=sm); the ladder is the\n   shared --mono-control-height-* scale and the text follows .btn's steps.\n   ========================================= */\n\n/* `.input` is text-base under 48rem (no iOS zoom) and md:text-sm above it —\n   vendor behaviour, kept for the default size only. */\n@media (width < 48rem) {\n  [mono-input]:is(:not([mono-size]), [mono-size=\"md\"]) {\n    --_mono-input-font-size: var(--mono-input-font-md, var(--mono-text-base));\n    --_mono-input-line-height: var(--mono-input-line-height, var(--mono-input-line-height-md, var(--mono-text-base--lh)));\n  }\n}\n\n[mono-input][mono-size=\"xs\"] {\n  --_mono-input-height: var(--mono-input-height-xs, var(--mono-control-height-xs));\n  --_mono-input-radius: var(--mono-input-radius-xs, var(--_mono-input-radius-preset, var(--mono-input-radius, var(--mono-radius-md))));\n  --_mono-input-padding-x: var(--mono-input-padding-x-xs, var(--_mono-input-padding-x-preset, calc(var(--mono-spacing) * 2)));\n  --_mono-input-font-size: var(--mono-input-font-xs, var(--mono-text-xs));\n  --_mono-input-line-height: var(--mono-input-line-height, var(--mono-input-line-height-xs, var(--mono-text-xs--lh)));\n  --_mono-input-affix-icon: var(--mono-input-affix-icon-size, calc(var(--mono-spacing) * 3.5));\n  --_mono-input-clear: calc(var(--mono-spacing) * 4);\n  --_mono-input-clear-glyph: calc(var(--mono-spacing) * 3);\n}\n\n[mono-input][mono-size=\"sm\"] {\n  --_mono-input-height: var(--mono-input-height-sm, var(--mono-control-height-sm));\n  --_mono-input-radius: var(--mono-input-radius-sm, var(--_mono-input-radius-preset, var(--mono-input-radius, var(--mono-radius-md))));\n  --_mono-input-padding-x: var(--mono-input-padding-x-sm, var(--_mono-input-padding-x-preset, calc(var(--mono-spacing) * 2.5)));\n  --_mono-input-font-size: var(--mono-input-font-sm, var(--mono-input-font-md, var(--mono-text-sm)));\n  --_mono-input-line-height: var(--mono-input-line-height, var(--mono-input-line-height-sm, var(--mono-text-sm--lh)));\n  --_mono-input-clear: calc(var(--mono-spacing) * 5);\n  --_mono-input-clear-glyph: calc(var(--mono-spacing) * 3.5);\n}\n\n[mono-input][mono-size=\"lg\"] {\n  --_mono-input-height: var(--mono-input-height-lg, var(--mono-control-height-lg));\n  --_mono-input-radius: var(--mono-input-radius-lg, var(--_mono-input-radius-preset, var(--mono-input-radius, var(--mono-radius-md))));\n  --_mono-input-padding-x: var(--mono-input-padding-x-lg, var(--_mono-input-padding-x-preset, calc(var(--mono-spacing) * 2.5)));\n  --_mono-input-font-size: var(--mono-input-font-lg, var(--mono-input-font-md, var(--mono-text-sm)));\n  --_mono-input-line-height: var(--mono-input-line-height, var(--mono-input-line-height-lg, var(--mono-text-sm--lh)));\n}\n\n[mono-input][mono-size=\"xl\"] {\n  --_mono-input-height: var(--mono-input-height-xl, var(--mono-control-height-xl));\n  --_mono-input-radius: var(--mono-input-radius-xl, var(--_mono-input-radius-preset, var(--mono-input-radius, var(--mono-radius-md))));\n  --_mono-input-padding-x: var(--mono-input-padding-x-xl, var(--_mono-input-padding-x-preset, calc(var(--mono-spacing) * 3)));\n  --_mono-input-font-size: var(--mono-input-font-xl, var(--mono-text-base));\n  --_mono-input-line-height: var(--mono-input-line-height, var(--mono-input-line-height-xl, var(--mono-text-base--lh)));\n  --_mono-input-affix-icon: var(--mono-input-affix-icon-size, calc(var(--mono-spacing) * 5));\n  --_mono-input-clear: calc(var(--mono-spacing) * 7);\n  --_mono-input-clear-glyph: calc(var(--mono-spacing) * 4);\n}\n\n[mono-input][mono-size=\"xxl\"] {\n  --_mono-input-height: var(--mono-input-height-xxl, var(--mono-control-height-xxl));\n  --_mono-input-radius: var(--mono-input-radius-xxl, var(--_mono-input-radius-preset, var(--mono-input-radius, var(--mono-radius-md))));\n  --_mono-input-padding-x: var(--mono-input-padding-x-xxl, var(--_mono-input-padding-x-preset, calc(var(--mono-spacing) * 4)));\n  --_mono-input-font-size: var(--mono-input-font-xxl, var(--mono-text-lg));\n  --_mono-input-line-height: var(--mono-input-line-height, var(--mono-input-line-height-xxl, var(--mono-text-lg--lh)));\n  --_mono-input-affix-icon: var(--mono-input-affix-icon-size, calc(var(--mono-spacing) * 5));\n  --_mono-input-clear: calc(var(--mono-spacing) * 8);\n  --_mono-input-clear-glyph: calc(var(--mono-spacing) * 4);\n}\n\n/* =========================================\n   Variants — each writes only `*-preset` slots\n   ========================================= */\n\n/* basecoat@1.0.2 styles/vega.css .input-group — rounded-md border border-input\n   shadow-xs, bg-transparent (dark:bg-input/30 via --mono-mode-surface). The\n   `--mono-input-outline-*` knobs are how a flavor restyles THIS variant alone\n   (maia bg-input/30, luma / rhea border-transparent bg-input/50, sera the\n   underline) without touching filled / underlined. */\n[mono-input]:is(:not([mono-variant]), [mono-variant=\"outlined\"]) {\n  --_mono-input-bg-preset: var(--mono-input-outline-bg);\n  --_mono-input-border-color-preset: var(--mono-input-outline-border-color);\n  --_mono-input-side-border-color-preset: var(--mono-input-outline-side-border-color);\n  --_mono-input-shadow-preset: var(--mono-input-outline-shadow, var(--mono-shadow-xs));\n  --_mono-input-ring-width-preset: var(--mono-input-outline-ring-width);\n  --_mono-input-radius-preset: var(--mono-input-outline-radius);\n  --_mono-input-padding-x-preset: var(--mono-input-outline-padding-x);\n  --_mono-input-affix-padding-preset: var(--mono-input-outline-affix-padding);\n}\n\n/* EXTENSION — filled ≡ basecoat@1.0.2 styles/luma.css .input-group:\n   border-transparent bg-input/50, no shadow-xs (the ring stays) */\n[mono-input][mono-variant=\"filled\"] {\n  --_mono-input-bg-preset: var(--mono-input-filled-bg, color-mix(in oklab, var(--input) 50%, transparent));\n  --_mono-input-border-color-preset: transparent;\n  --_mono-input-shadow-preset: 0 0 #0000;\n}\n\n/* EXTENSION — underlined ≡ basecoat@1.0.2 styles/sera.css .input-group:\n   rounded-none border-transparent border-b-input bg-transparent px-0, no\n   shadow, no ring, focus-within:border-b-ring, has-[aria-invalid]:border-b-destructive.\n   Only the bottom edge paints; the sides are transparent in every state. */\n[mono-input][mono-variant=\"underlined\"] {\n  --_mono-input-bg-preset: transparent;\n  --_mono-input-side-border-color-preset: transparent;\n  --_mono-input-shadow-preset: 0 0 #0000;\n  --_mono-input-ring-width-preset: 0px;\n  --_mono-input-radius-preset: 0;\n  --_mono-input-padding-x-preset: 0;\n  --_mono-input-affix-padding-preset: 0;\n}\n\n/* =========================================\n   Colours — the `color` prop is the FOCUS colour (ring + focused border).\n   No resting tint: Basecoat fields rest on --input whatever their role.\n   ========================================= */\n\n[mono-input]:is(:not([mono-color]), [mono-color=\"primary\"]) {\n  --_mono-input-ring-color-preset: var(--_mono-input-primary);\n}\n[mono-input][mono-color=\"secondary\"] {\n  --_mono-input-ring-color-preset: var(--_mono-input-secondary);\n  --_mono-input-accent-preset: var(--_mono-input-secondary);\n}\n[mono-input][mono-color=\"success\"] {\n  --_mono-input-ring-color-preset: var(--_mono-input-success);\n  --_mono-input-accent-preset: var(--_mono-input-success);\n}\n[mono-input][mono-color=\"danger\"] {\n  --_mono-input-ring-color-preset: var(--_mono-input-danger);\n  --_mono-input-accent-preset: var(--_mono-input-danger);\n}\n[mono-input][mono-color=\"warning\"] {\n  --_mono-input-ring-color-preset: var(--_mono-input-warning);\n  --_mono-input-accent-preset: var(--_mono-input-warning);\n}\n[mono-input][mono-color=\"info\"] {\n  --_mono-input-ring-color-preset: var(--_mono-input-info);\n  --_mono-input-accent-preset: var(--_mono-input-info);\n}\n[mono-input][mono-color=\"teal\"] {\n  --_mono-input-ring-color-preset: var(--_mono-input-teal);\n  --_mono-input-accent-preset: var(--_mono-input-teal);\n}\n[mono-input][mono-color=\"purple\"] {\n  --_mono-input-ring-color-preset: var(--_mono-input-purple);\n  --_mono-input-accent-preset: var(--_mono-input-purple);\n}\n[mono-input][mono-color=\"neutral\"] {\n  --_mono-input-ring-color-preset: var(--_mono-input-neutral);\n  --_mono-input-accent-preset: var(--_mono-input-neutral);\n}\n[mono-input][mono-color=\"dark\"] {\n  --_mono-input-ring-color-preset: var(--_mono-input-dark);\n  --_mono-input-accent-preset: var(--_mono-input-dark);\n}\n\n/* =========================================\n   Label\n   ========================================= */\n\n/* basecoat@1.0.2 styles/vega.css .field > label, .label — flex items-center\n   gap-2 text-sm leading-none font-medium select-none w-fit */\n:where([mono-input]) > [mono-label] {\n  display: flex;\n  align-items: center;\n  width: fit-content;\n  gap: var(--mono-input-label-gap, calc(var(--mono-spacing) * 2));\n  font-size: var(--mono-input-label-font-size, var(--mono-text-sm));\n  line-height: var(--mono-input-label-line-height, 1);\n  font-weight: var(--mono-input-label-font-weight, var(--mono-label-font-weight, var(--mono-font-weight-medium)));\n  text-transform: var(--mono-input-label-text-transform, none);\n  letter-spacing: var(--mono-input-label-letter-spacing, normal);\n  color: var(--_mono-input-text);\n  user-select: none;\n}\n\n/* in-data-[disabled=true]:opacity-50 / peer-disabled:opacity-50 */\n[mono-input][mono-disabled] > [mono-label],\n[mono-input]:has(> [mono-field] > [mono-native]:disabled) > [mono-label] {\n  opacity: 0.5;\n  pointer-events: none;\n}\n\n/* basecoat@1.0.2 styles/vega.css .field — data-invalid:text-destructive */\n[mono-input][mono-validation-state=\"invalid\"] > [mono-label],\n[mono-input]:has(> [mono-field] > [mono-native][aria-invalid=\"true\"]) > [mono-label] {\n  color: var(--_mono-input-invalid);\n}\n\n/* EXTENSION — the required asterisk */\n:where([mono-input]) [mono-required-mark] {\n  color: var(--_mono-input-danger);\n}\n\n/* `tooltip` prop — the info icon at the end of the label row (the label's\n   flex gap spaces it). `pointer-events` is restored because a disabled field\n   switches its label's off, and a disabled field is exactly where the reason\n   is worth a hover. Knobs: --mono-input-label-tooltip-size / -color / -opacity. */\n:where([mono-input]) > [mono-label] > [mono-label-tooltip] {\n  display: inline-flex;\n  flex: none;\n  align-items: center;\n  justify-content: center;\n  font-size: var(--mono-input-label-tooltip-size, 1.1em);\n  color: var(--mono-input-label-tooltip-color, currentColor);\n  opacity: var(--mono-input-label-tooltip-opacity, 0.6);\n  border-radius: 9999px;\n  cursor: help;\n  pointer-events: auto;\n  outline: none;\n  transition: opacity 150ms ease;\n}\n\n:where([mono-input]) > [mono-label] > [mono-label-tooltip]:is(:hover, :focus-visible) {\n  opacity: 1;\n}\n\n:where([mono-input]) > [mono-label] > [mono-label-tooltip]:focus-visible {\n  outline: 2px solid currentColor;\n  outline-offset: 2px;\n}\n\n:where([mono-input]) > [mono-label] > [mono-label-tooltip] > [mono-icon] {\n  width: 1em;\n  height: 1em;\n}\n\n/* =========================================\n   The field — the bordered box\n   ========================================= */\n\n/* basecoat@1.0.2 components/input-group.css .input-group */\n/* basecoat@1.0.2 styles/vega.css .input-group — h-9 rounded-md border\n   border-input shadow-xs transition-[color,box-shadow] focus-within:border-ring\n   focus-within:ring-3 focus-within:ring-ring/50; mono: `--tw-ring-*` flattened to\n   the ring + shadow slots, the height is the control token, and the side\n   edges read their own slot so a flavor can keep only the bottom one */\n:where([mono-input]) > [mono-field] {\n  --_mono-input-bc: var(--_mono-input-border-color);\n  --_mono-input-side-bc: var(--mono-input-side-border-color, var(--_mono-input-side-border-color-preset, var(--_mono-input-bc)));\n  /* The focus / state ring slot — `0 0 #0000` until a state sets it. Kept as a\n     slot so a variant can neutralise the resting shadow without ever writing\n     `box-shadow: none` (which would out-specify the ring). */\n  --_mono-input-ring: 0 0 #0000;\n\n  position: relative;\n  display: flex;\n  align-items: center;\n  width: 100%;\n  min-width: 0;\n  min-height: var(--_mono-input-height);\n  outline-style: none;\n  border: var(--mono-border-width) solid var(--_mono-input-bc);\n  border-top-color: var(--_mono-input-side-bc);\n  border-inline-color: var(--_mono-input-side-bc);\n  border-radius: var(--_mono-input-radius);\n  background: var(--_mono-input-bg);\n  color: var(--_mono-input-text);\n  box-shadow: var(--_mono-input-ring), var(--_mono-input-shadow);\n  transition-property: color, box-shadow, border-color, background-color;\n  transition-timing-function: var(--mono-ease);\n  transition-duration: var(--mono-duration);\n\n  /* focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/50 */\n  &:focus-within {\n    --_mono-input-bc: var(--_mono-input-ring-color);\n    --_mono-input-ring: 0 0 0 var(--_mono-input-ring-width) color-mix(in oklab, var(--_mono-input-ring-color) var(--_mono-input-ring-alpha), transparent);\n  }\n}\n\n/* basecoat@1.0.2 styles/vega.css .input-group — has-[[aria-invalid=true]]:border-destructive\n   has-[[aria-invalid=true]]:ring-3 has-[[aria-invalid=true]]:ring-destructive/20\n   (dark: border /50, ring /40 — carried by the mode tokens). The ring is\n   permanent, and it wins over the focus ring — same as the vendor order. */\n[mono-input][mono-validation-state=\"invalid\"] > [mono-field],\n:where([mono-input]) > [mono-field]:has(> [mono-native][aria-invalid=\"true\"]) {\n  --_mono-input-bc: var(--mono-mode-invalid-border);\n  --_mono-input-ring: 0 0 0 var(--_mono-input-ring-width) var(--mono-mode-invalid-ring);\n}\n\n/* EXTENSION — valid / warning are the invalid pattern in the role's colour */\n[mono-input][mono-validation-state=\"valid\"] > [mono-field] {\n  --_mono-input-bc: color-mix(in oklab, var(--_mono-input-valid) var(--mono-mode-state-border-alpha), transparent);\n  --_mono-input-ring: 0 0 0 var(--_mono-input-ring-width) color-mix(in oklab, var(--_mono-input-valid) var(--mono-mode-state-ring-alpha), transparent);\n}\n[mono-input][mono-validation-state=\"warning\"] > [mono-field] {\n  --_mono-input-bc: color-mix(in oklab, var(--_mono-input-warning) var(--mono-mode-state-border-alpha), transparent);\n  --_mono-input-ring: 0 0 0 var(--_mono-input-ring-width) color-mix(in oklab, var(--_mono-input-warning) var(--mono-mode-state-ring-alpha), transparent);\n}\n\n/* EXTENSION — readonly: focusable, on a muted surface */\n[mono-input][mono-readonly] > [mono-field],\n:where([mono-input]) > [mono-field]:has(> [mono-native]:read-only:not(:disabled):not([mono-file]):not([mono-range])) {\n  background: var(--mono-input-readonly-bg, var(--muted));\n}\n\n/* basecoat@1.0.2 styles/vega.css .input-group:has(> :is(input, textarea, select, [data-control]):disabled) — opacity-50\n   (`--mono-input-disabled-bg`: nova / lyra add disabled:bg-input/50) */\n[mono-input][mono-disabled] > [mono-field],\n:where([mono-input]) > [mono-field]:has(> [mono-native]:disabled) {\n  opacity: 0.5;\n  cursor: not-allowed;\n  background: var(--mono-input-disabled-bg, var(--_mono-input-bg));\n}\n\n/* =========================================\n   The native input\n   ========================================= */\n\n/* basecoat@1.0.2 components/input-group.css .input-group > :is(input, textarea, select, [data-control]) —\n   block min-w-0 flex-1 appearance-none rounded-none border-0 bg-transparent\n   text-foreground shadow-none outline-none placeholder:text-muted-foreground */\n/* basecoat@1.0.2 styles/vega.css .input-group > :is(input, select, [data-control])\n   — px-2.5 py-1 text-sm; mono: no block padding — the FIELD owns the height\n   (`min-height: token`) and `align-self: stretch` spans the click target */\n:where([mono-input]) [mono-native] {\n  display: block;\n  flex: 1 1 auto;\n  width: 100%;\n  min-width: 0;\n  align-self: stretch;\n  appearance: none;\n  margin: 0;\n  border: 0;\n  border-radius: 0;\n  outline: none;\n  background: transparent;\n  box-shadow: none;\n  color: var(--_mono-input-text);\n  font-family: inherit;\n  font-size: var(--_mono-input-font-size);\n  line-height: var(--_mono-input-line-height);\n  padding-inline: var(--_mono-input-padding-x);\n  padding-block: 0;\n\n  &::placeholder {\n    color: var(--_mono-input-placeholder);\n  }\n\n  /* .input:disabled — pointer-events-none cursor-not-allowed (the opacity is\n     on the field so the affixes fade with it) */\n  &:disabled {\n    pointer-events: none;\n    cursor: not-allowed;\n  }\n\n  &:read-only {\n    cursor: inherit;\n  }\n\n  /* Kill the native focus outline in host projects; the field draws the ring. */\n  &:focus,\n  &:focus-visible {\n    outline: none !important;\n  }\n\n  &[type='number']::-webkit-outer-spin-button,\n  &[type='number']::-webkit-inner-spin-button {\n    margin: 0;\n  }\n}\n\n/* basecoat@1.0.2 styles/vega.css .input-group:not([data-orientation='vertical']):has(> :is([data-align='start'], [data-align='inline-start'])) > :is(input, select, [data-control]) — ps-1.5\n   (and pe-1.5 for an end affix). The clear button counts as an end affix. */\n:where([mono-input]) > [mono-field]:has(> [mono-prefix]:not([mono-empty])) > [mono-native] {\n  padding-inline-start: var(--mono-input-affix-gap, calc(var(--mono-spacing) * 1.5));\n}\n:where([mono-input]) > [mono-field]:has(> :is([mono-suffix]:not([mono-empty]), [mono-clear])) > [mono-native] {\n  padding-inline-end: var(--mono-input-affix-gap, calc(var(--mono-spacing) * 1.5));\n}\n\n/* =========================================\n   Prefix / suffix\n   ========================================= */\n\n/* basecoat@1.0.2 styles/vega.css .input-group > :is(span, [role='group'], header, footer), .input-group > :is(svg, kbd, .popover, .dropdown-menu) — gap-2 py-1.5\n   text-sm font-medium text-muted-foreground select-none, svg size-4;\n   [data-align='start'] ps-2 / [data-align='end'] pe-2 */\n:where([mono-input]) [mono-prefix],\n:where([mono-input]) [mono-suffix] {\n  flex: 0 0 auto;\n  display: inline-flex;\n  align-items: center;\n  gap: calc(var(--mono-spacing) * 2);\n  font-size: var(--mono-input-affix-font-size, var(--_mono-input-font-size));\n  line-height: var(--_mono-input-line-height);\n  font-weight: var(--mono-font-weight-medium);\n  color: var(--_mono-input-muted);\n  user-select: none;\n}\n\n:where([mono-input]) [mono-prefix] {\n  padding-inline-start: var(--_mono-input-affix-padding);\n}\n\n:where([mono-input]) [mono-suffix] {\n  padding-inline-end: var(--_mono-input-affix-padding);\n}\n\n/* The light build re-appends slotted prefix/suffix content into this\n   `[data-mono-slot]` placeholder, one level below the inline-flex wrapper.\n   Make it a flex container too, so an `display: inline` icon span (e.g. a\n   UnoCSS `i-mdi-*`, which ignores width/height while inline) is blockified\n   into a flex item and actually renders its box. */\n:where([mono-input]) :is([mono-prefix], [mono-suffix]) > [data-mono-slot] {\n  display: inline-flex;\n  align-items: center;\n  gap: inherit;\n}\n\n/* `[&>svg:not([class*='size-'])]:size-4` — our icons are UnoCSS `i-*` mask\n   spans as often as SVGs, so every glyph in an affix takes the affix size. */\n:where([mono-input]) :is([mono-prefix], [mono-suffix]) :is(svg, .mono-icon, [mono-icon]),\n:where([mono-input]) :is([mono-prefix], [mono-suffix]) ::slotted(svg),\n:where([mono-input]) :is([mono-prefix], [mono-suffix]) ::slotted(.mono-icon),\n:where([mono-input]) :is([mono-prefix], [mono-suffix]) ::slotted([mono-icon]) {\n  display: block;\n  width: var(--_mono-input-affix-icon);\n  height: var(--_mono-input-affix-icon);\n  flex-shrink: 0;\n  pointer-events: none;\n}\n\n/* =========================================\n   Clear button — a ghost icon button in the end affix slot\n   ========================================= */\n\n/* basecoat@1.0.2 styles/vega.css .input-group > :is(button, [role='group'] > button, header > button, footer > button):has(> svg):not(:has(> :not(svg)))\n   — size-6 rounded-[calc(var(--radius)-5px)] p-0 shadow-none, svg size-3.5;\n   .input-group > button[data-align='end'] me-1; painted as .btn[data-variant='ghost'] */\n:where([mono-input]) [mono-clear] {\n  flex: 0 0 auto;\n  display: inline-flex;\n  align-items: center;\n  justify-content: center;\n  width: var(--_mono-input-clear);\n  height: var(--_mono-input-clear);\n  padding: 0;\n  margin: 0;\n  margin-inline-end: var(--mono-spacing);\n  border: 0;\n  border-radius: var(--mono-input-clear-radius, calc(var(--radius) - 5px));\n  background: transparent;\n  box-shadow: none;\n  color: var(--_mono-input-muted);\n  font: inherit;\n  line-height: 1;\n  cursor: pointer;\n  outline-style: none;\n  transition-property: color, background-color, box-shadow;\n  transition-timing-function: var(--mono-ease);\n  transition-duration: var(--mono-duration);\n\n  &:focus-visible {\n    box-shadow: 0 0 0 var(--_mono-input-ring-width) color-mix(in oklab, var(--_mono-input-ring-color) var(--_mono-input-ring-alpha), transparent);\n  }\n\n  &:active {\n    translate: 0 1px;\n  }\n}\n\n/* basecoat@1.0.2 styles/vega.css .btn[data-variant='ghost'] — hover:bg-muted\n   hover:text-foreground (dark:hover:bg-muted/50 via --mono-mode-ghost-hover) */\n@media (hover: hover) {\n  :where([mono-input]) [mono-clear]:hover {\n    background: var(--mono-mode-ghost-hover);\n    color: var(--_mono-input-text);\n  }\n}\n\n:where([mono-input]) [mono-clear] > :is(svg, .mono-icon, [mono-icon]) {\n  display: block;\n  width: var(--_mono-input-clear-glyph);\n  height: var(--_mono-input-clear-glyph);\n  pointer-events: none;\n}\n\n/* =========================================\n   EXTENSION — type=\"file\": a read-only name field in front of a hidden native\n   picker, with an upload glyph (`[mono-file-icon]`, a `[mono-suffix]`) at the\n   end. The whole field reads as one button. The `mono-file` native is\n   `readonly` only as a means — it stays off the muted read-only surface above\n   unless `readonly` is actually set.\n   ========================================= */\n\n:where([mono-input][mono-type=\"file\"]) > [mono-field],\n:where([mono-input][mono-type=\"file\"]) [mono-native][mono-file],\n:where([mono-input][mono-type=\"file\"]) [mono-file-icon] {\n  cursor: pointer;\n}\n\n:where([mono-input][mono-type=\"file\"]) [mono-native][mono-file] {\n  text-overflow: ellipsis;\n  white-space: nowrap;\n  overflow: hidden;\n}\n\n:where([mono-input][mono-type=\"file\"][mono-readonly]) :is([mono-field], [mono-native][mono-file], [mono-file-icon]) {\n  cursor: default;\n}\n\n:where([mono-input][mono-type=\"file\"][mono-disabled]) :is([mono-field], [mono-native][mono-file], [mono-file-icon]) {\n  cursor: not-allowed;\n}\n\n:where([mono-input]) [mono-file-input] {\n  display: none !important;\n}\n\n/* =========================================\n   type=\"range\" — a port of Basecoat's components/range.css (`.field > input[type='range']`)\n\n     [mono-input][mono-type=\"range\"]   the root; `> [mono-field]` loses its box (a Basecoat\n                                       range sits straight in the .field, no .input-group)\n     [mono-native][mono-range]         ≡ .field > input[type='range'] (h-5, the track + thumb)\n     [mono-range-value]                EXTENSION — the value readout: end of the label row, or\n                                       after the slider when there is no label (EJI ONE's\n                                       `.eji-range__row`; Basecoat has no readout)\n\n   The fill is upstream's gradient stop: the element writes the position as\n   `--mono-input-range-value` (upstream `--slider-value`) inline on the native,\n   and raw markup sets it itself. The track/thumb paint in currentColor, and the\n   native's `color` is the ACCENT (`--_mono-input-accent`: the `color` prop, or a\n   validation state), so a flavor that wants the accent writes `currentColor`\n   — a flavor block may never read a `--_mono-*` private.\n\n   Knobs (vega fallbacks below; every Basecoat style + ONE writes its own in\n   flavors/*.css, `node scripts/basecoat-styles.mjs --varying \"range\"`):\n   --mono-input-range-{height, gap, track-height, track-radius, track-bg, fill,\n   thumb-size, thumb-width, thumb-radius, thumb-bg, thumb-border-width,\n   thumb-border-color, thumb-shadow, thumb-ring-width, thumb-ring-color,\n   ring-width, hover-ring-width, label-color, label-font-size, label-line-height,\n   label-font-weight, value-color,\n   value-font-family, value-font-size, value-font-weight, value-min-width}.\n   A flavor sets the md geometry only: `size` multiplies it (xs .75 … xxl\n   1.375), so every flavor keeps a whole xs→xxl ladder.\n   ========================================= */\n\n[mono-input][mono-type=\"range\"] {\n  --_mono-input-range-scale: 1;\n  gap: var(--mono-input-range-gap, var(--mono-input-gap, calc(var(--mono-spacing) * 3)));\n}\n[mono-input][mono-type=\"range\"][mono-size=\"xs\"] { --_mono-input-range-scale: 0.75; }\n[mono-input][mono-type=\"range\"][mono-size=\"sm\"] { --_mono-input-range-scale: 0.875; }\n[mono-input][mono-type=\"range\"][mono-size=\"lg\"] { --_mono-input-range-scale: 1.125; }\n[mono-input][mono-type=\"range\"][mono-size=\"xl\"] { --_mono-input-range-scale: 1.25; }\n[mono-input][mono-type=\"range\"][mono-size=\"xxl\"] { --_mono-input-range-scale: 1.375; }\n\n/* a validation state recolours the fill + thumb (after the colour rules, so it wins) */\n[mono-input][mono-type=\"range\"][mono-validation-state=\"invalid\"] { --_mono-input-accent-preset: var(--_mono-input-invalid); }\n[mono-input][mono-type=\"range\"][mono-validation-state=\"valid\"] { --_mono-input-accent-preset: var(--_mono-input-valid); }\n[mono-input][mono-type=\"range\"][mono-validation-state=\"warning\"] { --_mono-input-accent-preset: var(--_mono-input-warning); }\n\n/* No .input-group around a Basecoat range: the field keeps only its flex row\n   (prefix / slider / readout / suffix). Placed after the readonly / disabled\n   field rules, which it ties, so the box stays off in every state; the\n   disabled opacity is kept. */\n[mono-input][mono-type=\"range\"] > [mono-field] {\n  gap: calc(var(--mono-spacing) * 3);\n  min-height: 0;\n  border-width: 0;\n  border-radius: 0;\n  background: transparent;\n  box-shadow: none;\n}\n\n[mono-input][mono-type=\"range\"] :is([mono-prefix], [mono-suffix]) {\n  padding-inline: 0;\n}\n\n/* the label spans the row so the readout can sit at its end (EJI ONE) */\n[mono-input][mono-type=\"range\"] > [mono-label] {\n  width: 100%;\n  font-size: var(--mono-input-range-label-font-size, var(--mono-input-label-font-size, var(--mono-text-sm)));\n  line-height: var(--mono-input-range-label-line-height, var(--mono-input-label-line-height, 1));\n  color: var(--mono-input-range-label-color, var(--_mono-input-text));\n  font-weight: var(--mono-input-range-label-font-weight, var(--mono-input-label-font-weight, var(--mono-label-font-weight, var(--mono-font-weight-medium))));\n}\n\n/* basecoat@1.0.2 components/range.css .field > input[type='range'], .input[type='range'] — flex appearance-none items-center\n   p-0 outline-none disabled:pointer-events-none disabled:opacity-50 (the opacity is the field's) */\n/* basecoat@1.0.2 styles/vega.css .field > input[type='range'], .input[type='range'] — h-5, --slider-track-height: 0.375rem, --slider-thumb-size: 1rem */\n[mono-native][mono-range] {\n  --_mono-input-range-track-h: round(nearest, calc(var(--mono-input-range-track-height, 0.375rem) * var(--_mono-input-range-scale, 1)), 1px);\n  --_mono-input-range-thumb-h: round(nearest, calc(var(--mono-input-range-thumb-size, 1rem) * var(--_mono-input-range-scale, 1)), 1px);\n  --_mono-input-range-thumb-w: round(nearest, calc(var(--mono-input-range-thumb-width, var(--mono-input-range-thumb-size, 1rem)) * var(--_mono-input-range-scale, 1)), 1px);\n  --_mono-input-range-fill: var(--mono-input-range-fill, currentColor);\n  --_mono-input-range-track: var(--mono-input-range-track-bg, var(--muted));\n  --_mono-input-range-dir: to right;\n  --_mono-input-range-ring-w: var(--mono-input-range-ring-width, 4px);\n  --_mono-input-range-hover-ring-w: var(--mono-input-range-hover-ring-width, var(--_mono-input-range-ring-w));\n  --_mono-input-range-ring-c: color-mix(in oklab, var(--_mono-input-ring-color) var(--_mono-input-ring-alpha), transparent);\n  /* the hover / focus halo slot — `0 0 #0000` at rest */\n  --_mono-input-range-halo: 0 0 #0000;\n\n  display: flex;\n  align-items: center;\n  flex: 1 1 auto;\n  width: 100%;\n  min-width: 0;\n  height: max(round(nearest, calc(var(--mono-input-range-height, 1.25rem) * var(--_mono-input-range-scale, 1)), 1px), var(--_mono-input-range-thumb-h));\n  margin: 0;\n  padding: 0;\n  appearance: none;\n  background: transparent;\n  color: var(--_mono-input-accent);\n  cursor: pointer;\n  outline: none;\n\n  &:dir(rtl) {\n    --_mono-input-range-dir: to left;\n  }\n\n  /* basecoat@1.0.2 styles/vega.css :is(.field > input[type='range'], .input[type='range'])::-webkit-slider-runnable-track — bg-muted h-1.5 rounded-full\n     (+ components/range.css: w-full appearance-none, the --primary / --muted gradient stop) */\n  &::-webkit-slider-runnable-track {\n    width: 100%;\n    height: var(--_mono-input-range-track-h);\n    appearance: none;\n    border-radius: var(--mono-input-range-track-radius, 9999px);\n    background: linear-gradient(var(--_mono-input-range-dir), var(--_mono-input-range-fill) var(--mono-input-range-value, 20%), var(--_mono-input-range-track) var(--mono-input-range-value, 20%));\n  }\n\n  &::-moz-range-track {\n    width: 100%;\n    height: var(--_mono-input-range-track-h);\n    appearance: none;\n    border-radius: var(--mono-input-range-track-radius, 9999px);\n    background: linear-gradient(var(--_mono-input-range-dir), var(--_mono-input-range-fill) var(--mono-input-range-value, 20%), var(--_mono-input-range-track) var(--mono-input-range-value, 20%));\n  }\n\n  /* basecoat@1.0.2 styles/vega.css :is(.field > input[type='range'], .input[type='range'])::-webkit-slider-thumb — border-primary ring-ring/50 size-4\n     rounded-full border bg-white shadow-sm transition-[color,box-shadow] hover:ring-4 focus-visible:ring-4\n     -mt-[calc((var(--slider-thumb-size)-var(--slider-track-height))/2)]; mono: border-box, so\n     size-4 is the painted size whatever the border; the ring is three slots — a\n     resting ring (luma / rhea ring-1, ONE's navy rim), the halo, the shadow */\n  &::-webkit-slider-thumb {\n    display: block;\n    flex-shrink: 0;\n    box-sizing: border-box;\n    width: var(--_mono-input-range-thumb-w);\n    height: var(--_mono-input-range-thumb-h);\n    margin-top: calc((var(--_mono-input-range-track-h) - var(--_mono-input-range-thumb-h)) / 2);\n    appearance: none;\n    border: var(--mono-input-range-thumb-border-width, 1px) solid var(--mono-input-range-thumb-border-color, currentColor);\n    border-radius: var(--mono-input-range-thumb-radius, 9999px);\n    background: var(--mono-input-range-thumb-bg, #fff);\n    box-shadow:\n      0 0 0 var(--mono-input-range-thumb-ring-width, 0px) var(--mono-input-range-thumb-ring-color, transparent),\n      var(--_mono-input-range-halo),\n      var(--mono-input-range-thumb-shadow, var(--mono-shadow-sm));\n    transition-property: color, box-shadow, background-color, border-color;\n    transition-timing-function: var(--mono-ease);\n    transition-duration: var(--mono-duration);\n  }\n\n  &::-moz-range-thumb {\n    display: block;\n    flex-shrink: 0;\n    box-sizing: border-box;\n    width: var(--_mono-input-range-thumb-w);\n    height: var(--_mono-input-range-thumb-h);\n    appearance: none;\n    border: var(--mono-input-range-thumb-border-width, 1px) solid var(--mono-input-range-thumb-border-color, currentColor);\n    border-radius: var(--mono-input-range-thumb-radius, 9999px);\n    background: var(--mono-input-range-thumb-bg, #fff);\n    box-shadow:\n      0 0 0 var(--mono-input-range-thumb-ring-width, 0px) var(--mono-input-range-thumb-ring-color, transparent),\n      var(--_mono-input-range-halo),\n      var(--mono-input-range-thumb-shadow, var(--mono-shadow-sm));\n    transition-property: color, box-shadow, background-color, border-color;\n    transition-timing-function: var(--mono-ease);\n    transition-duration: var(--mono-duration);\n  }\n\n  /* focus-visible:ring-4 focus-visible:outline-hidden */\n  &:focus-visible {\n    --_mono-input-range-halo: 0 0 0 var(--_mono-input-range-ring-w) var(--_mono-input-range-ring-c);\n  }\n\n  &:disabled {\n    pointer-events: none;\n  }\n}\n\n/* hover:ring-4 (lyra / mira / nova also active:) */\n@media (hover: hover) {\n  [mono-native][mono-range]:hover:not(:disabled, :focus-visible) {\n    --_mono-input-range-halo: 0 0 0 var(--_mono-input-range-hover-ring-w) var(--_mono-input-range-ring-c);\n  }\n}\n[mono-native][mono-range]:active:not(:disabled, :focus-visible) {\n  --_mono-input-range-halo: 0 0 0 var(--_mono-input-range-hover-ring-w) var(--_mono-input-range-ring-c);\n}\n\n/* readonly: a native range ignores `readonly`, so the element reverts any move;\n   the pointer is switched off so a drag never even starts */\n[mono-input][mono-readonly] [mono-native][mono-range] {\n  pointer-events: none;\n  cursor: default;\n}\n\n/* EXTENSION — the value readout (EJI ONE `.eji-range__val`: the number is always\n   on screen). Tabular figures so the row does not shimmer while dragging. */\n:where([mono-input]) [mono-range-value] {\n  flex: none;\n  margin-inline-start: auto;\n  font-family: var(--mono-input-range-value-font-family, inherit);\n  font-size: var(--mono-input-range-value-font-size, var(--mono-input-range-label-font-size, var(--mono-input-label-font-size, var(--mono-text-sm))));\n  font-weight: var(--mono-input-range-value-font-weight, var(--mono-font-weight-medium));\n  line-height: var(--mono-input-range-label-line-height, var(--mono-input-label-line-height, 1));\n  font-variant-numeric: tabular-nums;\n  color: var(--mono-input-range-value-color, var(--_mono-input-muted));\n  white-space: nowrap;\n  user-select: none;\n}\n\n/* after the slider (no label): a reserved width, so the track does not resize\n   as the number gains a digit */\n:where([mono-input]) > [mono-field] > [mono-range-value] {\n  min-width: var(--mono-input-range-value-min-width, 3ch);\n  text-align: end;\n}\n\n/* =========================================\n   Message — helper / validation text under the field\n   ========================================= */\n\n/* basecoat@1.0.2 styles/vega.css .fieldset legend + p, .field > p, .field section > p — text-sm text-muted-foreground\n   leading-normal font-normal text-start. The wrapper is always rendered\n   (aria-describedby points at it); it takes no space until it holds text. */\n:where([mono-input]) > [mono-message-wrap] {\n  display: block;\n}\n\n:where([mono-input]) > [mono-message-wrap]:not(:has([mono-message]:not([mono-empty]))) {\n  display: none;\n}\n\n:where([mono-input]) [mono-message] {\n  font-size: var(--mono-input-message-font-size, var(--mono-text-sm));\n  line-height: var(--mono-input-message-line-height, var(--mono-leading-normal));\n  font-weight: var(--mono-font-weight-normal);\n  text-align: start;\n  color: var(--_mono-input-muted);\n}\n\n/* basecoat@1.0.2 styles/vega.css .field [role=\"alert\"] — text-destructive text-sm */\n:where([mono-input]) [mono-message=\"invalid\"] {\n  color: var(--_mono-input-invalid);\n}\n\n/* EXTENSION — the other two states in their role colour */\n:where([mono-input]) [mono-message=\"valid\"] {\n  color: var(--_mono-input-valid);\n}\n\n:where([mono-input]) [mono-message=\"warning\"] {\n  color: var(--_mono-input-warning);\n}\n\n@media (prefers-reduced-motion: reduce) {\n  :where([mono-input]) > [mono-field],\n  :where([mono-input]) [mono-clear] {\n    transition: none;\n  }\n}\n\n/* =========================================\n   label-position — the slots form/label-position.css reads\n   (top / notched / left / right; public knobs: --mono-input-label-width,\n   -label-side-gap, -label-notch-font-size, -label-notch-bg)\n   ========================================= */\n\n[mono-input][mono-label-position] {\n  --_mono-lp-width: var(--mono-input-label-width, auto);\n  --_mono-lp-gap: var(--mono-input-label-side-gap, calc(var(--mono-spacing) * 3));\n  --_mono-lp-height: var(--_mono-input-height);\n  --_mono-lp-box-min: var(--_mono-input-height);\n  --_mono-lp-padding-x: var(--_mono-input-padding-x);\n  --_mono-lp-padding-y: 0px;\n  --_mono-lp-font: var(--mono-input-label-notch-font-size, var(--mono-text-xs));\n  --_mono-lp-notch-bg: var(--mono-input-label-notch-bg, var(--background));\n  --_mono-lp-field-bg: var(--_mono-input-bg);\n}\n";

//#endregion
//#region src/components/input/mono-input.ts
let MonoInput = class MonoInput extends MonoInputCore(LitElement) {
	constructor(..._args) {
		super(..._args);
		this._slotPrefix = [];
		this._slotSuffix = [];
		this._slotLabel = [];
		this._slotHelper = [];
	}
	static {
		this.styles = [unsafeCSS(input_css_raw_default)];
	}
	createRenderRoot() {
		return this;
	}
	/**
	* Capture `slot="…"` light-DOM children into the per-region arrays. Safe to run
	* MORE THAN ONCE: captured nodes have their `slot` attribute removed and are
	* detached from the host, so a re-scan never re-captures them. Re-running lets
	* us pick up children Vue appends AFTER `connectedCallback` (e.g. a client-only
	* `<mono-input>` slotted into the SSR `<mono-nav>`'s shadow `<slot>`, where the
	* `<span slot="prefix">` can arrive late) — the original one-shot capture missed
	* those, so the prefix wrapper was never rendered and the icon never showed.
	*/
	_captureSlots() {
		this._slotObserver?.disconnect();
		const captured = monoHostChildNodes(this);
		const capturedSlotNodes = /* @__PURE__ */ new Set();
		for (const node of captured) {
			if (!(node instanceof Element)) continue;
			const slotName = node.getAttribute("slot");
			if (slotName === "prefix") {
				node.removeAttribute("slot");
				this._slotPrefix.push(node);
				capturedSlotNodes.add(node);
			} else if (slotName === "suffix") {
				node.removeAttribute("slot");
				this._slotSuffix.push(node);
				capturedSlotNodes.add(node);
			} else if (slotName === "label") {
				node.removeAttribute("slot");
				this._slotLabel.push(node);
				capturedSlotNodes.add(node);
			} else if (slotName === "helper") {
				node.removeAttribute("slot");
				this._slotHelper.push(node);
				capturedSlotNodes.add(node);
			}
		}
		if (capturedSlotNodes.size) {
			this._hasPrefixSlotState = this._slotPrefix.length > 0;
			this._hasSuffixSlotState = this._slotSuffix.length > 0;
			this._hasLabelSlotState = this._slotLabel.length > 0;
			this._hasHelperSlotState = this._slotHelper.length > 0;
			for (const node of capturedSlotNodes) if (node.parentNode === this) this.removeChild(node);
		}
		if (this._slotObserver && this.isConnected) this._slotObserver.observe(this, { childList: true });
	}
	connectedCallback() {
		super.connectedCallback();
		if (!isServer && !this._slotObserver && typeof MutationObserver !== "undefined") this._slotObserver = new MutationObserver(() => this._captureSlots());
		this._captureSlots();
		if (this.isConnected) this.performUpdate();
	}
	disconnectedCallback() {
		this._slotObserver?.disconnect();
		super.disconnectedCallback();
	}
	updated(changed) {
		super.updated(changed);
		this._placeSlot("prefix", this._slotPrefix);
		this._placeSlot("suffix", this._slotSuffix);
		this._placeSlot("label", this._slotLabel);
		this._placeSlot("helper", this._slotHelper);
	}
	_placeSlot(name, nodes) {
		if (!nodes.length) return;
		const target = this.querySelector(`[data-mono-slot="${name}"]`);
		if (!target) return;
		for (const node of nodes) placeSlotNode(target, node);
	}
	renderIcon(name) {
		if (name === "upload") return html`<span class="mono-icon i-mdi-cloud-upload-outline" mono-icon aria-hidden="true"></span>`;
		return html`<span class="mono-icon i-mdi-close" mono-icon aria-hidden="true"></span>`;
	}
	_renderLabel() {
		if (!this.label && !this._hasLabelSlot) return nothing;
		return html`
      <label class=${this._cls("mono-input-label", "label")} mono-label for=${this._inputId}>
        ${this._hasLabelSlot ? html`<span data-mono-slot="label"></span>` : this.label}
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
		if (this.helperText || this._hasHelperSlot) return html`<div class=${`${base} helper`} mono-message="helper">${this._hasHelperSlot ? html`<span data-mono-slot="helper"></span>` : this.helperText}</div>`;
		return nothing;
	}
	render() {
		return this._renderWrapper(html`
        ${this._renderLabel()}
        <div class=${this._fieldClasses} mono-field>
          ${this._hasPrefixSlot ? html`<span class=${this._cls("mono-input-prefix", "prefix")} mono-prefix><span data-mono-slot="prefix"></span></span>` : nothing}
          ${this._renderNative()}
          ${this._renderRangeValue("field")}
          ${this._validation.renderIcon()}
          ${this._renderClear()}
          ${this._renderFileIcon()}
          ${this._hasSuffixSlot ? html`<span class=${this._cls("mono-input-suffix", "suffix")} mono-suffix><span data-mono-slot="suffix"></span></span>` : nothing}
        </div>
        <div id=${this._messageId} class=${this.cssClass?.messageWrap ?? ""} mono-message-wrap>
          ${this._renderHelper()}
        </div>
        ${this._validation.renderFloat()}
    `);
	}
};
MonoInput = __decorate([customElement("mono-input")], MonoInput);

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
export { MonoInput, applyFormat, caretAfterFormat, generateInputAriaAttributes, generateInputAttributes, getInputIcon, localeSeparators, normaliseValue, parseFormat, resolveFormat, significantFor, stripFormat, validateInputProps };