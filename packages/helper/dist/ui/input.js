import { l as monoHostChildNodes } from "../mono-ui-CPV7rrdo.js";
import { t as customElement } from "../mono-element-B0kP_96P.js";
import { a as defineHybridPropAliases, r as booleanStringConverter, t as __decorate } from "../decorate-DEXtNagw.js";
import { t as dispatchMonoEvent } from "../mono-event-Bi1qP9uN.js";
import { s as placeSlotNode } from "../light-slots-DW1WgfgT.js";
import { t as buildSizeStyle } from "../css-size-DhHSVZJK.js";
import { t as MonoFormControlCore } from "../form-control-core-eeRr0zLU.js";
import { n as cssPart } from "../css-class-BRKRzHx-.js";
import { LitElement, html, isServer, nothing, unsafeCSS } from "lit";
import { property, query, state } from "lit/decorators.js";
import { ifDefined } from "lit/directives/if-defined.js";
import { styleMap } from "lit/directives/style-map.js";
//#region src/components/input/input-format.ts
var SEPARATOR_CACHE = /* @__PURE__ */ new Map();
/**
* Ask `Intl` which characters this locale uses, rather than assuming `,` and `.`.
*
* Several locales use neither — `fr-FR` groups with a narrow no-break space, `de-CH` with an
* apostrophe — and a hardcoded pair would silently mangle them.
*/
function localeSeparators(locale) {
	const key = locale ?? "";
	const cached = SEPARATOR_CACHE.get(key);
	if (cached) return cached;
	let separators = {
		group: ",",
		decimal: "."
	};
	try {
		const parts = new Intl.NumberFormat(locale || void 0, {
			useGrouping: true,
			minimumFractionDigits: 1
		}).formatToParts(12345.6);
		separators = {
			group: parts.find((p) => p.type === "group")?.value ?? ",",
			decimal: parts.find((p) => p.type === "decimal")?.value ?? "."
		};
	} catch {}
	SEPARATOR_CACHE.set(key, separators);
	return separators;
}
/**
* Parse a pattern string into a descriptor, or `null` when it is not a pattern we understand.
*
* `null` is deliberately not an error: an unparseable pattern leaves the field an ordinary
* unformatted input rather than blanking it or throwing mid-keystroke.
*/
function parseFormat(pattern) {
	const raw = String(pattern ?? "");
	if (!raw) return null;
	const hole = raw.indexOf("{}");
	if (hole !== -1) return {
		kind: "template",
		before: raw.slice(0, hole),
		after: raw.slice(hole + 2)
	};
	let body = raw;
	let prefix = "";
	let suffix = "";
	const leading = body.match(/^"([^"]*)"/);
	if (leading) {
		prefix = leading[1] ?? "";
		body = body.slice(leading[0].length);
	}
	const trailing = body.match(/"([^"]*)"$/);
	if (trailing) {
		suffix = trailing[1] ?? "";
		body = body.slice(0, body.length - trailing[0].length);
	}
	if (!body || !/^[#0,]*(?:\.[#0]*)?$/.test(body)) return null;
	if (!/[#0]/.test(body)) return null;
	const [intPart = "", fracPart] = body.split(".");
	return {
		kind: "number",
		grouping: intPart.includes(","),
		minFraction: fracPart ? (fracPart.match(/0/g) ?? []).length : 0,
		maxFraction: fracPart ? fracPart.length : 0,
		prefix,
		suffix
	};
}
/**
* Strip a formatted string back to its raw value.
*
* For numbers the result is always canonical — digits, an optional leading `-`, and `.` as the
* decimal point — whatever the locale draws with, so it is safe to hand to `Number()`.
*/
/**
* Decide whether a GROUP character in the text is really the decimal point the user typed.
*
* It exists because the two roles collide: in `id-ID` the grouping character is `.`, so typing
* `0.9` produced `09` — the strip deleted the point before anything could read it as one. Yet
* `1.000` typed in the same field must keep meaning a thousand, and that is not a matter of
* guessing intent: the field re-strips its OWN formatted text on every keystroke, and
* `addGrouping` only ever emits runs of exactly three digits.
*
* So a group character is the decimal point when
*   · the pattern has a fraction at all,
*   · the locale's real decimal character is nowhere in the text (an explicit `1.000,5` wins), and
*   · the digits after the LAST group character number at most `maxFraction` and are not exactly 3.
*
* A run of length ZERO qualifies deliberately: a trailing `0.` must survive, or the point is
* deleted the instant it is typed and `0.9` can never be reached left to right — `applyFormat`
* carries the matching rule that keeps a lone trailing point on screen.
*
* The consequence, and it is documented rather than worked around: under a dot-grouping locale a
* THREE-digit fraction (`0.123`) is unreachable by dot and has to be typed `0,123`.
*
* Returns the split, or `null` when every group character is grouping. Works for either locale
* shape — under `en-US` the roles are simply swapped and a typed `,` is promoted the same way.
*/
function decimalGroupSplit(text, descriptor, group, decimal) {
	if (descriptor.maxFraction <= 0) return null;
	if (!group || group === decimal) return null;
	if (text.includes(decimal)) return null;
	const at = text.lastIndexOf(group);
	if (at === -1) return null;
	const tail = text.slice(at + group.length);
	if (tail.length > descriptor.maxFraction || tail.length === 3) return null;
	if (tail && !/^\d+$/.test(tail)) return null;
	return {
		head: text.slice(0, at),
		tail
	};
}
function stripFormat(text, descriptor, locale) {
	const value = String(text ?? "");
	if (!descriptor) return value;
	if (descriptor.kind === "template") {
		let out = value;
		if (descriptor.before && out.startsWith(descriptor.before)) out = out.slice(descriptor.before.length);
		if (descriptor.after && out.endsWith(descriptor.after)) out = out.slice(0, out.length - descriptor.after.length);
		return out;
	}
	const { group, decimal } = localeSeparators(locale);
	let out = value;
	if (descriptor.prefix) out = out.split(descriptor.prefix).join("");
	if (descriptor.suffix) out = out.split(descriptor.suffix).join("");
	const promoted = decimalGroupSplit(out, descriptor, group, decimal);
	if (promoted) out = `${promoted.head.split(group).join("")}.${promoted.tail}`;
	else {
		out = out.split(group).join("");
		if (decimal !== ".") out = out.split(decimal).join(".");
	}
	const negative = out.trimStart().startsWith("-");
	out = out.replace(/[^\d.]/g, "");
	const first = out.indexOf(".");
	if (first !== -1) out = out.slice(0, first + 1) + out.slice(first + 1).replace(/\./g, "");
	if (descriptor.maxFraction === 0) out = out.split(".")[0] ?? "";
	return negative && out ? `-${out}` : out;
}
/**
* Render a raw value for DISPLAY.
*
* The number branch deliberately does NOT hand the whole string to `Intl`: a value being typed is
* usually not yet a finished number, and `Intl` would tidy away exactly the characters the user is
* in the middle of writing — a trailing decimal point (`10000.`) and trailing fraction zeros
* (`10.50`) both vanish, which makes the field fight the person using it. Only the INTEGER part is
* grouped; the fraction is carried through verbatim, clamped to the pattern's ceiling.
*/
function applyFormat(raw, descriptor, locale, opts = {}) {
	const value = String(raw ?? "");
	if (!descriptor) return value;
	if (descriptor.kind === "template") {
		if (!value) return "";
		return `${descriptor.before}${value}${descriptor.after}`;
	}
	if (!value || value === "-") return value;
	const negative = value.startsWith("-");
	const unsigned = negative ? value.slice(1) : value;
	const [intRaw = "", fracRaw] = unsigned.split(".");
	const hasPoint = unsigned.includes(".");
	const { group, decimal } = localeSeparators(locale);
	const digits = intRaw.replace(/\D/g, "").replace(/^0+(?=\d)/, "");
	const grouped = descriptor.grouping ? addGrouping(digits, group) : digits;
	let fraction = (fracRaw ?? "").replace(/\D/g, "").slice(0, descriptor.maxFraction);
	if (opts.pad && descriptor.minFraction > 0) fraction = fraction.padEnd(descriptor.minFraction, "0");
	let out = grouped || (hasPoint ? "0" : "");
	if (fraction) out += decimal + fraction;
	else if (hasPoint && descriptor.maxFraction > 0 && !opts.pad) out += decimal;
	if (!out) return "";
	return `${descriptor.prefix}${negative ? "-" : ""}${out}${descriptor.suffix}`;
}
/** Group a digit string from the right. */
function addGrouping(digits, separator) {
	if (digits.length < 4) return digits;
	let out = "";
	for (let i = 0; i < digits.length; i++) {
		if (i > 0 && (digits.length - i) % 3 === 0) out += separator;
		out += digits[i];
	}
	return out;
}
/**
* Normalise a raw value for the VALUE side.
*
* A number pattern yields a canonical numeric string (`"10000000.25"`) rather than the formatted
* text, so `Number(v)` works and a store that does arithmetic on it does not have to know a format
* was ever involved. A template yields the assembled string, because there the decoration IS the
* value — an email is not an email without its domain.
*/
function normaliseValue(raw, descriptor) {
	const value = String(raw ?? "");
	if (!descriptor) return value;
	if (descriptor.kind === "template") return value ? `${descriptor.before}${value}${descriptor.after}` : "";
	if (!value || value === "-") return "";
	const negative = value.startsWith("-");
	const [intRaw = "", fracRaw] = (negative ? value.slice(1) : value).split(".");
	const digits = intRaw.replace(/\D/g, "");
	const fraction = (fracRaw ?? "").replace(/\D/g, "").slice(0, descriptor.maxFraction);
	let out = digits.replace(/^0+(?=\d)/, "");
	if (!out) out = digits ? "0" : "";
	if (!out && !fraction) return "";
	if (fraction) out = `${out || "0"}.${fraction}`;
	return negative && out ? `-${out}` : out;
}
/**
* Where the caret belongs after the text was reformatted.
*
* Reformatting rewrites the whole field, and the browser then parks the caret at the end — so
* inserting a digit in the middle of a number would throw you to the end on every keystroke. The
* fix is to count in SIGNIFICANT characters (the ones the user actually typed) rather than in
* string offsets: count how many sit left of the caret before, then walk the new text until the
* same number have gone by.
*/
function caretAfterFormat(next, caretInPrev, prev, isSignificant) {
	let typed = 0;
	for (let i = 0; i < Math.min(caretInPrev, prev.length); i++) if (isSignificant(prev[i])) typed++;
	if (typed === 0) {
		let i = 0;
		while (i < next.length && !isSignificant(next[i])) i++;
		return i;
	}
	let seen = 0;
	for (let i = 0; i < next.length; i++) if (isSignificant(next[i])) {
		seen++;
		if (seen === typed) return i + 1;
	}
	return next.length;
}
/**
* Which characters count as "typed" for caret purposes — everything the format did NOT insert.
*/
function significantFor(descriptor, locale) {
	if (!descriptor || descriptor.kind === "template") return () => true;
	const { decimal } = localeSeparators(locale);
	return (ch) => /\d/.test(ch) || ch === decimal || ch === "-";
}
/** Resolve either form of a format prop to its finished text. */
function resolveFormat(format, raw, ctx, mode) {
	if (format == null || format === "") return null;
	if (typeof format === "function") return String(format({
		value: raw,
		type: ctx.type,
		locale: ctx.locale
	}) ?? "");
	const descriptor = parseFormat(format);
	if (!descriptor) return null;
	return mode === "display" ? applyFormat(raw, descriptor, ctx.locale) : normaliseValue(raw, descriptor);
}
//#endregion
//#region src/components/input/input-core.ts
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
var MonoInputCore = (superClass) => {
	class MonoInputCoreClass extends MonoFormControlCore(superClass) {
		constructor(...args) {
			super(...args);
			this.cssClass = {};
			this.cssClassName = "";
			this.type = "text";
			this.size = "md";
			this.color = "primary";
			this.variant = "outlined";
			this.modelValue = "";
			this.value = "";
			this.formatOn = "input";
			this.name = "";
			this.placeholder = "";
			this.label = "";
			this.helperText = "";
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
			}
		}
		willUpdate(changed) {
			if (changed.has("modelValue") && this.value !== this.modelValue) this.value = this.modelValue ?? "";
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
				this._hasSuffixSlot || this.clearable ? "has-suffix" : "",
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
				this._hasSuffixSlot || this.clearable ? "has-suffix" : "",
				this.value ? "has-value" : ""
			].filter(Boolean).join(" ");
		}
		_createModelDetail(args) {
			return {
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
			const caret = caretAfterFormat(next, caretBefore, prev, significantFor(this._displayDescriptor, this.formatLocale));
			try {
				input.setSelectionRange(caret, caret);
			} catch {}
		}
		_handleInput(event) {
			if (this.disabled || this.readonly) return;
			this._internalWrite = true;
			const input = event.currentTarget;
			const oldValue = this.modelValue;
			if (!this._hasFormat) {
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
			if (this.disabled || this.readonly) return;
			this._internalWrite = true;
			const input = event.currentTarget;
			const oldValue = this.modelValue;
			if (!this._hasFormat) {
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
        mono-validation-state=${state === "default" ? nothing : state}
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
		/** The native <input>, shared by both builds' render(). */
		_renderNative() {
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
			if (!(this.clearable && this.value && !this.disabled && !this.readonly)) return nothing;
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
		attribute: "model-value",
		reflect: true
	})], MonoInputCoreClass.prototype, "modelValue", void 0);
	__decorate([property({ type: String })], MonoInputCoreClass.prototype, "value", void 0);
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
	__decorate([state()], MonoInputCoreClass.prototype, "_display", void 0);
	__decorate([state()], MonoInputCoreClass.prototype, "_focused", void 0);
	__decorate([state()], MonoInputCoreClass.prototype, "_hasPrefixSlotState", void 0);
	__decorate([state()], MonoInputCoreClass.prototype, "_hasSuffixSlotState", void 0);
	__decorate([state()], MonoInputCoreClass.prototype, "_hasLabelSlotState", void 0);
	__decorate([state()], MonoInputCoreClass.prototype, "_hasHelperSlotState", void 0);
	return MonoInputCoreClass;
};
//#endregion
//#region src/components/input/input.css?raw
var input_default = "/* =========================================================================\r\n   mono-input — a port of Basecoat's `.field` / `.input-group` / `.label`\r\n   (basecoat-css@1.0.2, vega style).\r\n\r\n   Styled by ATTRIBUTE, like Basecoat (`.input-group:has([aria-invalid])`) —\r\n   and the attributes mirror the element's props one for one, so hand-written\r\n   markup reads like the Lit / Vue tag:\r\n\r\n     <mono-input size=\"sm\" color=\"danger\" variant=\"filled\" label=\"Name\">\r\n     <div mono-input mono-size=\"sm\" mono-color=\"danger\" mono-variant=\"filled\">\r\n       <label mono-label>Name</label>\r\n       <div mono-field><input mono-native></div>\r\n     </div>\r\n\r\n   An absent attribute is the prop's default (`:not([mono-size])` = md,\r\n   `:not([mono-color])` = primary, `:not([mono-variant])` = outlined,\r\n   `:not([mono-validation-state])` = default). The element renders these\r\n   attributes on its wrapper (both builds); the old classes\r\n   (`.mono-input.sm.danger.filled`) are still emitted as inert hooks for\r\n   consumer CSS until 2.0 but no rule here reads them.\r\n\r\n   Selector map (ours ≡ upstream):\r\n     [mono-input]                                  ≡ .field            (flex column, gap-3)\r\n     [mono-input] > [mono-label]                   ≡ .field > label / .label\r\n     [mono-input] > [mono-field]                   ≡ .input-group      (the bordered box: h-9 rounded-md border-input shadow-xs)\r\n     [mono-field] > [mono-native]                  ≡ .input-group > input (borderless, px-2.5 text-sm; `.input` for the metrics)\r\n     [mono-field] > [mono-prefix|mono-suffix]      ≡ .input-group > span[data-align='start'|'end']\r\n     [mono-field] > [mono-clear]                   ≡ .input-group > button[data-align='end']:has(> svg)\r\n     [mono-input] > [mono-message-wrap]            ≡ .field > p\r\n     [mono-message=\"helper\"]                       ≡ .field > p        (text-sm text-muted-foreground)\r\n     [mono-message=\"invalid\"]                      ≡ .field [role='alert']\r\n     [mono-validation-state=\"invalid\"]             ≡ .input-group:has([aria-invalid=true]) + .field[data-invalid]\r\n     [mono-validation-state=\"valid|warning\"]       ≡ EXTENSION (the invalid pattern with --success / --warning)\r\n     [mono-size=\"xs|sm|lg|xl|xxl\"]                 ≡ EXTENSION (Basecoat sizes only the select; the ladder is --mono-control-height-*)\r\n     [mono-variant=\"filled\"]                       ≡ EXTENSION (luma's .input-group: border-transparent bg-input/50, ring-ring/30)\r\n     [mono-variant=\"underlined\"]                   ≡ EXTENSION (sera's .input-group: rounded-none border-b-input px-0, no ring)\r\n     [mono-disabled] / [mono-native]:disabled      ≡ .input-group:has(input:disabled) — opacity-50\r\n     [mono-readonly]                               ≡ EXTENSION (a muted surface)\r\n\r\n   Specificity contract (same as the pre-port class sheet, and as checkbox.css):\r\n   a part's RESTING rule is written `:where([mono-input]) [mono-part]` = exactly\r\n   one attribute, (0,1,0) — so a utility class composed onto the markup (the\r\n   `cssClass` prop, or a hand-written class in a css/ demo) wins by source order,\r\n   while the prop and state rules ([mono-size], [mono-variant], [mono-disabled],\r\n   :focus-within, [aria-invalid], …) stay heavier and still win over it.\r\n\r\n   Inner parts are attributes too: [mono-label] (+ [mono-required-mark]),\r\n   [mono-field], [mono-prefix] / [mono-suffix] (+ [mono-empty] in the shadow\r\n   build for an unassigned slot), [mono-native], [mono-clear] > [mono-icon],\r\n   [mono-message-wrap] > [mono-message=\"helper|valid|invalid|warning\"].\r\n\r\n   Values are copied from the compiled vendor sheet (vendor/basecoat/basecoat-\r\n   vega.cdn.css) through the token layer: `--spacing` → `--mono-spacing`,\r\n   `--text-sm` → `--mono-text-sm`, `--radius-md` → `--mono-radius-md`,\r\n   `--color-x` → `--x`, Tailwind's `--tw-ring-*` stack → the two-slot\r\n   `box-shadow: ring, shadow` below, and every `dark:` variant → a\r\n   `--mono-mode-*` token (a selector cannot cross a shadow boundary; an\r\n   inherited custom property can).\r\n\r\n   FLAVORS (Basecoat's other seven styles, src/data/theme/flavors/*.css) set\r\n   the knobs read below — `--mono-input-radius`, `--mono-input-padding-x-<size>`,\r\n   `--mono-input-font-<size>`, `--mono-input-line-height`, `--mono-input-ring-width`,\r\n   `--mono-input-ring-alpha`, `--mono-input-gap`, `--mono-input-affix-*`,\r\n   `--mono-input-label-*`, `--mono-input-message-*`, `--mono-input-clear-radius`,\r\n   `--mono-input-disabled-bg`, and the outline-variant set `--mono-input-outline-\r\n   {bg,border-color,side-border-color,shadow,ring-width,radius,padding-x,affix-padding}`.\r\n   Every fallback here is vega's value\r\n   (`node scripts/basecoat-styles.mjs --varying \"^\\.(field|label|input|input-group)\\b\"`).\r\n\r\n   The public `--mono-input-*` knobs and the three-tier resolver\r\n   (`--mono-input-x` → `--_mono-input-x-preset` → base) are unchanged: a\r\n   colour / variant attribute only ever writes a `*-preset` slot, so a\r\n   consumer's own `--mono-input-bg` on the host still wins.\r\n   ========================================================================= */\r\n\r\nmono-input {\r\n  display: block;\r\n}\r\n\r\n[mono-input] {\r\n  /* ── palette: each slot is a public knob over a Basecoat token ─────────── */\r\n  --_mono-input-text: var(--mono-input-color, var(--mono-input-text, var(--foreground)));\r\n  --_mono-input-placeholder: var(--mono-input-placeholder, var(--muted-foreground));\r\n  --_mono-input-muted: var(--mono-input-muted, var(--muted-foreground));\r\n  /* the `color` prop picks the FOCUS colour; primary is Basecoat's `--ring` */\r\n  --_mono-input-primary: var(--mono-input-primary, var(--ring));\r\n  --_mono-input-secondary: var(--mono-input-secondary, var(--muted-foreground));\r\n  --_mono-input-success: var(--mono-input-success, var(--success));\r\n  --_mono-input-danger: var(--mono-input-danger, var(--destructive));\r\n  --_mono-input-warning: var(--mono-input-warning, var(--warning));\r\n  --_mono-input-info: var(--mono-input-info, var(--info));\r\n  --_mono-input-teal: var(--mono-input-teal, var(--teal));\r\n  --_mono-input-purple: var(--mono-input-purple, var(--purple));\r\n  --_mono-input-neutral: var(--mono-input-neutral, var(--neutral));\r\n  --_mono-input-dark: var(--mono-input-dark, var(--dark));\r\n  --_mono-input-valid: var(--mono-input-valid, var(--success));\r\n  --_mono-input-invalid: var(--mono-input-invalid, var(--destructive));\r\n\r\n  /* ── the painted result — three tiers, base = .input-group (vega) ──────── */\r\n  --_mono-input-ring-color: var(--mono-input-ring-color, var(--mono-input-focus-color, var(--_mono-input-ring-color-preset, var(--_mono-input-primary))));\r\n  --_mono-input-ring-width: var(--mono-input-ring-width, var(--_mono-input-ring-width-preset, var(--mono-ring-width)));\r\n  --_mono-input-ring-alpha: var(--mono-input-ring-alpha, var(--mono-ring-alpha));\r\n  --_mono-input-border-color: var(--mono-input-rest-border, var(--mono-input-border-color, var(--_mono-input-border-color-preset, var(--input))));\r\n  --_mono-input-bg: var(--mono-input-bg, var(--mono-input-surface, var(--_mono-input-bg-preset, var(--mono-mode-surface))));\r\n  --_mono-input-shadow: var(--mono-input-shadow, var(--_mono-input-shadow-preset, 0 0 #0000));\r\n  --_mono-input-affix-padding: var(--mono-input-affix-padding, var(--_mono-input-affix-padding-preset, calc(var(--mono-spacing) * 2)));\r\n  --_mono-input-affix-icon: var(--mono-input-affix-icon-size, calc(var(--mono-spacing) * 4));\r\n\r\n  /* ── md metrics live on the unqualified root ON PURPOSE: hand-written\r\n        `<div mono-input>` that names no size renders exactly like size=\"md\".\r\n        basecoat@1.0.2 styles/vega.css .input-group — h-9 rounded-md; > input px-2.5 text-sm ── */\r\n  --_mono-input-height: var(--mono-input-height-md, var(--mono-control-height-md));\r\n  --_mono-input-radius: var(--mono-input-radius-md, var(--_mono-input-radius-preset, var(--mono-input-radius, var(--mono-radius-md))));\r\n  --_mono-input-padding-x: var(--mono-input-padding-x-md, var(--_mono-input-padding-x-preset, calc(var(--mono-spacing) * 2.5)));\r\n  --_mono-input-font-size: var(--mono-input-font-md, var(--mono-text-sm));\r\n  --_mono-input-line-height: var(--mono-input-line-height, var(--mono-input-line-height-md, var(--mono-text-sm--lh)));\r\n  --_mono-input-clear: calc(var(--mono-spacing) * 6);\r\n  --_mono-input-clear-glyph: calc(var(--mono-spacing) * 3.5);\r\n\r\n  /* basecoat@1.0.2 styles/vega.css .field — flex w-full flex-col gap-3 */\r\n  display: flex;\r\n  flex-direction: column;\r\n  gap: var(--mono-input-gap, calc(var(--mono-spacing) * 3));\r\n  width: 100%;\r\n  font-family: inherit;\r\n  color: var(--_mono-input-text);\r\n}\r\n\r\n/* A page-level `* { box-sizing: border-box }` reset does NOT cross a shadow\r\n   boundary; scoped here so both builds measure the same. */\r\n[mono-input],\r\n:where([mono-input]) *,\r\n:where([mono-input]) *::before,\r\n:where([mono-input]) *::after {\r\n  box-sizing: border-box;\r\n}\r\n\r\n/* The shadow build renders every slot wrapper and marks an unassigned one\r\n   `mono-empty`; the light build simply omits it. Inert in the light build. */\r\n:where([mono-input]) :is([mono-label], [mono-prefix], [mono-suffix], [mono-message])[mono-empty] {\r\n  display: none;\r\n}\r\n\r\n/* =========================================\r\n   Sizes — the field's painted height IS the token (tests/perf/field-heights).\r\n   EXTENSION: Basecoat sizes only its select (data-size=sm); the ladder is the\r\n   shared --mono-control-height-* scale and the text follows .btn's steps.\r\n   ========================================= */\r\n\r\n/* `.input` is text-base under 48rem (no iOS zoom) and md:text-sm above it —\r\n   vendor behaviour, kept for the default size only. */\r\n@media (width < 48rem) {\r\n  [mono-input]:is(:not([mono-size]), [mono-size=\"md\"]) {\r\n    --_mono-input-font-size: var(--mono-input-font-md, var(--mono-text-base));\r\n    --_mono-input-line-height: var(--mono-input-line-height, var(--mono-input-line-height-md, var(--mono-text-base--lh)));\r\n  }\r\n}\r\n\r\n[mono-input][mono-size=\"xs\"] {\r\n  --_mono-input-height: var(--mono-input-height-xs, var(--mono-control-height-xs));\r\n  --_mono-input-radius: var(--mono-input-radius-xs, var(--_mono-input-radius-preset, var(--mono-input-radius, var(--mono-radius-md))));\r\n  --_mono-input-padding-x: var(--mono-input-padding-x-xs, var(--_mono-input-padding-x-preset, calc(var(--mono-spacing) * 2)));\r\n  --_mono-input-font-size: var(--mono-input-font-xs, var(--mono-text-xs));\r\n  --_mono-input-line-height: var(--mono-input-line-height, var(--mono-input-line-height-xs, var(--mono-text-xs--lh)));\r\n  --_mono-input-affix-icon: var(--mono-input-affix-icon-size, calc(var(--mono-spacing) * 3.5));\r\n  --_mono-input-clear: calc(var(--mono-spacing) * 4);\r\n  --_mono-input-clear-glyph: calc(var(--mono-spacing) * 3);\r\n}\r\n\r\n[mono-input][mono-size=\"sm\"] {\r\n  --_mono-input-height: var(--mono-input-height-sm, var(--mono-control-height-sm));\r\n  --_mono-input-radius: var(--mono-input-radius-sm, var(--_mono-input-radius-preset, var(--mono-input-radius, var(--mono-radius-md))));\r\n  --_mono-input-padding-x: var(--mono-input-padding-x-sm, var(--_mono-input-padding-x-preset, calc(var(--mono-spacing) * 2.5)));\r\n  --_mono-input-font-size: var(--mono-input-font-sm, var(--mono-input-font-md, var(--mono-text-sm)));\r\n  --_mono-input-line-height: var(--mono-input-line-height, var(--mono-input-line-height-sm, var(--mono-text-sm--lh)));\r\n  --_mono-input-clear: calc(var(--mono-spacing) * 5);\r\n  --_mono-input-clear-glyph: calc(var(--mono-spacing) * 3.5);\r\n}\r\n\r\n[mono-input][mono-size=\"lg\"] {\r\n  --_mono-input-height: var(--mono-input-height-lg, var(--mono-control-height-lg));\r\n  --_mono-input-radius: var(--mono-input-radius-lg, var(--_mono-input-radius-preset, var(--mono-input-radius, var(--mono-radius-md))));\r\n  --_mono-input-padding-x: var(--mono-input-padding-x-lg, var(--_mono-input-padding-x-preset, calc(var(--mono-spacing) * 2.5)));\r\n  --_mono-input-font-size: var(--mono-input-font-lg, var(--mono-input-font-md, var(--mono-text-sm)));\r\n  --_mono-input-line-height: var(--mono-input-line-height, var(--mono-input-line-height-lg, var(--mono-text-sm--lh)));\r\n}\r\n\r\n[mono-input][mono-size=\"xl\"] {\r\n  --_mono-input-height: var(--mono-input-height-xl, var(--mono-control-height-xl));\r\n  --_mono-input-radius: var(--mono-input-radius-xl, var(--_mono-input-radius-preset, var(--mono-input-radius, var(--mono-radius-md))));\r\n  --_mono-input-padding-x: var(--mono-input-padding-x-xl, var(--_mono-input-padding-x-preset, calc(var(--mono-spacing) * 3)));\r\n  --_mono-input-font-size: var(--mono-input-font-xl, var(--mono-text-base));\r\n  --_mono-input-line-height: var(--mono-input-line-height, var(--mono-input-line-height-xl, var(--mono-text-base--lh)));\r\n  --_mono-input-affix-icon: var(--mono-input-affix-icon-size, calc(var(--mono-spacing) * 5));\r\n  --_mono-input-clear: calc(var(--mono-spacing) * 7);\r\n  --_mono-input-clear-glyph: calc(var(--mono-spacing) * 4);\r\n}\r\n\r\n[mono-input][mono-size=\"xxl\"] {\r\n  --_mono-input-height: var(--mono-input-height-xxl, var(--mono-control-height-xxl));\r\n  --_mono-input-radius: var(--mono-input-radius-xxl, var(--_mono-input-radius-preset, var(--mono-input-radius, var(--mono-radius-md))));\r\n  --_mono-input-padding-x: var(--mono-input-padding-x-xxl, var(--_mono-input-padding-x-preset, calc(var(--mono-spacing) * 4)));\r\n  --_mono-input-font-size: var(--mono-input-font-xxl, var(--mono-text-lg));\r\n  --_mono-input-line-height: var(--mono-input-line-height, var(--mono-input-line-height-xxl, var(--mono-text-lg--lh)));\r\n  --_mono-input-affix-icon: var(--mono-input-affix-icon-size, calc(var(--mono-spacing) * 5));\r\n  --_mono-input-clear: calc(var(--mono-spacing) * 8);\r\n  --_mono-input-clear-glyph: calc(var(--mono-spacing) * 4);\r\n}\r\n\r\n/* =========================================\r\n   Variants — each writes only `*-preset` slots\r\n   ========================================= */\r\n\r\n/* basecoat@1.0.2 styles/vega.css .input-group — rounded-md border border-input\r\n   shadow-xs, bg-transparent (dark:bg-input/30 via --mono-mode-surface). The\r\n   `--mono-input-outline-*` knobs are how a flavor restyles THIS variant alone\r\n   (maia bg-input/30, luma / rhea border-transparent bg-input/50, sera the\r\n   underline) without touching filled / underlined. */\r\n[mono-input]:is(:not([mono-variant]), [mono-variant=\"outlined\"]) {\r\n  --_mono-input-bg-preset: var(--mono-input-outline-bg);\r\n  --_mono-input-border-color-preset: var(--mono-input-outline-border-color);\r\n  --_mono-input-side-border-color-preset: var(--mono-input-outline-side-border-color);\r\n  --_mono-input-shadow-preset: var(--mono-input-outline-shadow, var(--mono-shadow-xs));\r\n  --_mono-input-ring-width-preset: var(--mono-input-outline-ring-width);\r\n  --_mono-input-radius-preset: var(--mono-input-outline-radius);\r\n  --_mono-input-padding-x-preset: var(--mono-input-outline-padding-x);\r\n  --_mono-input-affix-padding-preset: var(--mono-input-outline-affix-padding);\r\n}\r\n\r\n/* EXTENSION — filled ≡ basecoat@1.0.2 styles/luma.css .input-group:\r\n   border-transparent bg-input/50, no shadow-xs (the ring stays) */\r\n[mono-input][mono-variant=\"filled\"] {\r\n  --_mono-input-bg-preset: var(--mono-input-filled-bg, color-mix(in oklab, var(--input) 50%, transparent));\r\n  --_mono-input-border-color-preset: transparent;\r\n  --_mono-input-shadow-preset: 0 0 #0000;\r\n}\r\n\r\n/* EXTENSION — underlined ≡ basecoat@1.0.2 styles/sera.css .input-group:\r\n   rounded-none border-transparent border-b-input bg-transparent px-0, no\r\n   shadow, no ring, focus-within:border-b-ring, has-[aria-invalid]:border-b-destructive.\r\n   Only the bottom edge paints; the sides are transparent in every state. */\r\n[mono-input][mono-variant=\"underlined\"] {\r\n  --_mono-input-bg-preset: transparent;\r\n  --_mono-input-side-border-color-preset: transparent;\r\n  --_mono-input-shadow-preset: 0 0 #0000;\r\n  --_mono-input-ring-width-preset: 0px;\r\n  --_mono-input-radius-preset: 0;\r\n  --_mono-input-padding-x-preset: 0;\r\n  --_mono-input-affix-padding-preset: 0;\r\n}\r\n\r\n/* =========================================\r\n   Colours — the `color` prop is the FOCUS colour (ring + focused border).\r\n   No resting tint: Basecoat fields rest on --input whatever their role.\r\n   ========================================= */\r\n\r\n[mono-input]:is(:not([mono-color]), [mono-color=\"primary\"]) {\r\n  --_mono-input-ring-color-preset: var(--_mono-input-primary);\r\n}\r\n[mono-input][mono-color=\"secondary\"] {\r\n  --_mono-input-ring-color-preset: var(--_mono-input-secondary);\r\n}\r\n[mono-input][mono-color=\"success\"] {\r\n  --_mono-input-ring-color-preset: var(--_mono-input-success);\r\n}\r\n[mono-input][mono-color=\"danger\"] {\r\n  --_mono-input-ring-color-preset: var(--_mono-input-danger);\r\n}\r\n[mono-input][mono-color=\"warning\"] {\r\n  --_mono-input-ring-color-preset: var(--_mono-input-warning);\r\n}\r\n[mono-input][mono-color=\"info\"] {\r\n  --_mono-input-ring-color-preset: var(--_mono-input-info);\r\n}\r\n[mono-input][mono-color=\"teal\"] {\r\n  --_mono-input-ring-color-preset: var(--_mono-input-teal);\r\n}\r\n[mono-input][mono-color=\"purple\"] {\r\n  --_mono-input-ring-color-preset: var(--_mono-input-purple);\r\n}\r\n[mono-input][mono-color=\"neutral\"] {\r\n  --_mono-input-ring-color-preset: var(--_mono-input-neutral);\r\n}\r\n[mono-input][mono-color=\"dark\"] {\r\n  --_mono-input-ring-color-preset: var(--_mono-input-dark);\r\n}\r\n\r\n/* =========================================\r\n   Label\r\n   ========================================= */\r\n\r\n/* basecoat@1.0.2 styles/vega.css .field > label, .label — flex items-center\r\n   gap-2 text-sm leading-none font-medium select-none w-fit */\r\n:where([mono-input]) > [mono-label] {\r\n  display: flex;\r\n  align-items: center;\r\n  width: fit-content;\r\n  gap: var(--mono-input-label-gap, calc(var(--mono-spacing) * 2));\r\n  font-size: var(--mono-input-label-font-size, var(--mono-text-sm));\r\n  line-height: var(--mono-input-label-line-height, 1);\r\n  font-weight: var(--mono-input-label-font-weight, var(--mono-label-font-weight, var(--mono-font-weight-medium)));\r\n  text-transform: var(--mono-input-label-text-transform, none);\r\n  letter-spacing: var(--mono-input-label-letter-spacing, normal);\r\n  color: var(--_mono-input-text);\r\n  user-select: none;\r\n}\r\n\r\n/* in-data-[disabled=true]:opacity-50 / peer-disabled:opacity-50 */\r\n[mono-input][mono-disabled] > [mono-label],\r\n[mono-input]:has(> [mono-field] > [mono-native]:disabled) > [mono-label] {\r\n  opacity: 0.5;\r\n  pointer-events: none;\r\n}\r\n\r\n/* basecoat@1.0.2 styles/vega.css .field — data-invalid:text-destructive */\r\n[mono-input][mono-validation-state=\"invalid\"] > [mono-label],\r\n[mono-input]:has(> [mono-field] > [mono-native][aria-invalid=\"true\"]) > [mono-label] {\r\n  color: var(--_mono-input-invalid);\r\n}\r\n\r\n/* EXTENSION — the required asterisk */\r\n:where([mono-input]) [mono-required-mark] {\r\n  color: var(--_mono-input-danger);\r\n}\r\n\r\n/* =========================================\r\n   The field — the bordered box\r\n   ========================================= */\r\n\r\n/* basecoat@1.0.2 components/input-group.css .input-group */\r\n/* basecoat@1.0.2 styles/vega.css .input-group — h-9 rounded-md border\r\n   border-input shadow-xs transition-[color,box-shadow] focus-within:border-ring\r\n   focus-within:ring-3 focus-within:ring-ring/50; mono: `--tw-ring-*` flattened to\r\n   the ring + shadow slots, the height is the control token, and the side\r\n   edges read their own slot so a flavor can keep only the bottom one */\r\n:where([mono-input]) > [mono-field] {\r\n  --_mono-input-bc: var(--_mono-input-border-color);\r\n  --_mono-input-side-bc: var(--mono-input-side-border-color, var(--_mono-input-side-border-color-preset, var(--_mono-input-bc)));\r\n  /* The focus / state ring slot — `0 0 #0000` until a state sets it. Kept as a\r\n     slot so a variant can neutralise the resting shadow without ever writing\r\n     `box-shadow: none` (which would out-specify the ring). */\r\n  --_mono-input-ring: 0 0 #0000;\r\n\r\n  position: relative;\r\n  display: flex;\r\n  align-items: center;\r\n  width: 100%;\r\n  min-width: 0;\r\n  min-height: var(--_mono-input-height);\r\n  outline-style: none;\r\n  border: var(--mono-border-width) solid var(--_mono-input-bc);\r\n  border-top-color: var(--_mono-input-side-bc);\r\n  border-inline-color: var(--_mono-input-side-bc);\r\n  border-radius: var(--_mono-input-radius);\r\n  background: var(--_mono-input-bg);\r\n  color: var(--_mono-input-text);\r\n  box-shadow: var(--_mono-input-ring), var(--_mono-input-shadow);\r\n  transition-property: color, box-shadow, border-color, background-color;\r\n  transition-timing-function: var(--mono-ease);\r\n  transition-duration: var(--mono-duration);\r\n\r\n  /* focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/50 */\r\n  &:focus-within {\r\n    --_mono-input-bc: var(--_mono-input-ring-color);\r\n    --_mono-input-ring: 0 0 0 var(--_mono-input-ring-width) color-mix(in oklab, var(--_mono-input-ring-color) var(--_mono-input-ring-alpha), transparent);\r\n  }\r\n}\r\n\r\n/* basecoat@1.0.2 styles/vega.css .input-group — has-[[aria-invalid=true]]:border-destructive\r\n   has-[[aria-invalid=true]]:ring-3 has-[[aria-invalid=true]]:ring-destructive/20\r\n   (dark: border /50, ring /40 — carried by the mode tokens). The ring is\r\n   permanent, and it wins over the focus ring — same as the vendor order. */\r\n[mono-input][mono-validation-state=\"invalid\"] > [mono-field],\r\n:where([mono-input]) > [mono-field]:has(> [mono-native][aria-invalid=\"true\"]) {\r\n  --_mono-input-bc: var(--mono-mode-invalid-border);\r\n  --_mono-input-ring: 0 0 0 var(--_mono-input-ring-width) var(--mono-mode-invalid-ring);\r\n}\r\n\r\n/* EXTENSION — valid / warning are the invalid pattern in the role's colour */\r\n[mono-input][mono-validation-state=\"valid\"] > [mono-field] {\r\n  --_mono-input-bc: color-mix(in oklab, var(--_mono-input-valid) var(--mono-mode-state-border-alpha), transparent);\r\n  --_mono-input-ring: 0 0 0 var(--_mono-input-ring-width) color-mix(in oklab, var(--_mono-input-valid) var(--mono-mode-state-ring-alpha), transparent);\r\n}\r\n[mono-input][mono-validation-state=\"warning\"] > [mono-field] {\r\n  --_mono-input-bc: color-mix(in oklab, var(--_mono-input-warning) var(--mono-mode-state-border-alpha), transparent);\r\n  --_mono-input-ring: 0 0 0 var(--_mono-input-ring-width) color-mix(in oklab, var(--_mono-input-warning) var(--mono-mode-state-ring-alpha), transparent);\r\n}\r\n\r\n/* EXTENSION — readonly: focusable, on a muted surface */\r\n[mono-input][mono-readonly] > [mono-field],\r\n:where([mono-input]) > [mono-field]:has(> [mono-native]:read-only:not(:disabled)) {\r\n  background: var(--mono-input-readonly-bg, var(--muted));\r\n}\r\n\r\n/* basecoat@1.0.2 styles/vega.css .input-group:has(> :is(input, textarea, select, [data-control]):disabled) — opacity-50\r\n   (`--mono-input-disabled-bg`: nova / lyra add disabled:bg-input/50) */\r\n[mono-input][mono-disabled] > [mono-field],\r\n:where([mono-input]) > [mono-field]:has(> [mono-native]:disabled) {\r\n  opacity: 0.5;\r\n  cursor: not-allowed;\r\n  background: var(--mono-input-disabled-bg, var(--_mono-input-bg));\r\n}\r\n\r\n/* =========================================\r\n   The native input\r\n   ========================================= */\r\n\r\n/* basecoat@1.0.2 components/input-group.css .input-group > :is(input, textarea, select, [data-control]) —\r\n   block min-w-0 flex-1 appearance-none rounded-none border-0 bg-transparent\r\n   text-foreground shadow-none outline-none placeholder:text-muted-foreground */\r\n/* basecoat@1.0.2 styles/vega.css .input-group > :is(input, select, [data-control])\r\n   — px-2.5 py-1 text-sm; mono: no block padding — the FIELD owns the height\r\n   (`min-height: token`) and `align-self: stretch` spans the click target */\r\n:where([mono-input]) [mono-native] {\r\n  display: block;\r\n  flex: 1 1 auto;\r\n  width: 100%;\r\n  min-width: 0;\r\n  align-self: stretch;\r\n  appearance: none;\r\n  margin: 0;\r\n  border: 0;\r\n  border-radius: 0;\r\n  outline: none;\r\n  background: transparent;\r\n  box-shadow: none;\r\n  color: var(--_mono-input-text);\r\n  font-family: inherit;\r\n  font-size: var(--_mono-input-font-size);\r\n  line-height: var(--_mono-input-line-height);\r\n  padding-inline: var(--_mono-input-padding-x);\r\n  padding-block: 0;\r\n\r\n  &::placeholder {\r\n    color: var(--_mono-input-placeholder);\r\n  }\r\n\r\n  /* .input:disabled — pointer-events-none cursor-not-allowed (the opacity is\r\n     on the field so the affixes fade with it) */\r\n  &:disabled {\r\n    pointer-events: none;\r\n    cursor: not-allowed;\r\n  }\r\n\r\n  &:read-only {\r\n    cursor: inherit;\r\n  }\r\n\r\n  /* Kill the native focus outline in host projects; the field draws the ring. */\r\n  &:focus,\r\n  &:focus-visible {\r\n    outline: none !important;\r\n  }\r\n\r\n  &[type='number']::-webkit-outer-spin-button,\r\n  &[type='number']::-webkit-inner-spin-button {\r\n    margin: 0;\r\n  }\r\n}\r\n\r\n/* basecoat@1.0.2 styles/vega.css .input-group:not([data-orientation='vertical']):has(> :is([data-align='start'], [data-align='inline-start'])) > :is(input, select, [data-control]) — ps-1.5\r\n   (and pe-1.5 for an end affix). The clear button counts as an end affix. */\r\n:where([mono-input]) > [mono-field]:has(> [mono-prefix]:not([mono-empty])) > [mono-native] {\r\n  padding-inline-start: var(--mono-input-affix-gap, calc(var(--mono-spacing) * 1.5));\r\n}\r\n:where([mono-input]) > [mono-field]:has(> :is([mono-suffix]:not([mono-empty]), [mono-clear])) > [mono-native] {\r\n  padding-inline-end: var(--mono-input-affix-gap, calc(var(--mono-spacing) * 1.5));\r\n}\r\n\r\n/* =========================================\r\n   Prefix / suffix\r\n   ========================================= */\r\n\r\n/* basecoat@1.0.2 styles/vega.css .input-group > :is(span, [role='group'], header, footer), .input-group > :is(svg, kbd, .popover, .dropdown-menu) — gap-2 py-1.5\r\n   text-sm font-medium text-muted-foreground select-none, svg size-4;\r\n   [data-align='start'] ps-2 / [data-align='end'] pe-2 */\r\n:where([mono-input]) [mono-prefix],\r\n:where([mono-input]) [mono-suffix] {\r\n  flex: 0 0 auto;\r\n  display: inline-flex;\r\n  align-items: center;\r\n  gap: calc(var(--mono-spacing) * 2);\r\n  font-size: var(--mono-input-affix-font-size, var(--_mono-input-font-size));\r\n  line-height: var(--_mono-input-line-height);\r\n  font-weight: var(--mono-font-weight-medium);\r\n  color: var(--_mono-input-muted);\r\n  user-select: none;\r\n}\r\n\r\n:where([mono-input]) [mono-prefix] {\r\n  padding-inline-start: var(--_mono-input-affix-padding);\r\n}\r\n\r\n:where([mono-input]) [mono-suffix] {\r\n  padding-inline-end: var(--_mono-input-affix-padding);\r\n}\r\n\r\n/* The light build re-appends slotted prefix/suffix content into this\r\n   `[data-mono-slot]` placeholder, one level below the inline-flex wrapper.\r\n   Make it a flex container too, so an `display: inline` icon span (e.g. a\r\n   UnoCSS `i-mdi-*`, which ignores width/height while inline) is blockified\r\n   into a flex item and actually renders its box. */\r\n:where([mono-input]) :is([mono-prefix], [mono-suffix]) > [data-mono-slot] {\r\n  display: inline-flex;\r\n  align-items: center;\r\n  gap: inherit;\r\n}\r\n\r\n/* `[&>svg:not([class*='size-'])]:size-4` — our icons are UnoCSS `i-*` mask\r\n   spans as often as SVGs, so every glyph in an affix takes the affix size. */\r\n:where([mono-input]) :is([mono-prefix], [mono-suffix]) :is(svg, .mono-icon, [mono-icon]),\r\n:where([mono-input]) :is([mono-prefix], [mono-suffix]) ::slotted(svg),\r\n:where([mono-input]) :is([mono-prefix], [mono-suffix]) ::slotted(.mono-icon),\r\n:where([mono-input]) :is([mono-prefix], [mono-suffix]) ::slotted([mono-icon]) {\r\n  display: block;\r\n  width: var(--_mono-input-affix-icon);\r\n  height: var(--_mono-input-affix-icon);\r\n  flex-shrink: 0;\r\n  pointer-events: none;\r\n}\r\n\r\n/* =========================================\r\n   Clear button — a ghost icon button in the end affix slot\r\n   ========================================= */\r\n\r\n/* basecoat@1.0.2 styles/vega.css .input-group > :is(button, [role='group'] > button, header > button, footer > button):has(> svg):not(:has(> :not(svg)))\r\n   — size-6 rounded-[calc(var(--radius)-5px)] p-0 shadow-none, svg size-3.5;\r\n   .input-group > button[data-align='end'] me-1; painted as .btn[data-variant='ghost'] */\r\n:where([mono-input]) [mono-clear] {\r\n  flex: 0 0 auto;\r\n  display: inline-flex;\r\n  align-items: center;\r\n  justify-content: center;\r\n  width: var(--_mono-input-clear);\r\n  height: var(--_mono-input-clear);\r\n  padding: 0;\r\n  margin: 0;\r\n  margin-inline-end: var(--mono-spacing);\r\n  border: 0;\r\n  border-radius: var(--mono-input-clear-radius, calc(var(--radius) - 5px));\r\n  background: transparent;\r\n  box-shadow: none;\r\n  color: var(--_mono-input-muted);\r\n  font: inherit;\r\n  line-height: 1;\r\n  cursor: pointer;\r\n  outline-style: none;\r\n  transition-property: color, background-color, box-shadow;\r\n  transition-timing-function: var(--mono-ease);\r\n  transition-duration: var(--mono-duration);\r\n\r\n  &:focus-visible {\r\n    box-shadow: 0 0 0 var(--_mono-input-ring-width) color-mix(in oklab, var(--_mono-input-ring-color) var(--_mono-input-ring-alpha), transparent);\r\n  }\r\n\r\n  &:active {\r\n    translate: 0 1px;\r\n  }\r\n}\r\n\r\n/* basecoat@1.0.2 styles/vega.css .btn[data-variant='ghost'] — hover:bg-muted\r\n   hover:text-foreground (dark:hover:bg-muted/50 via --mono-mode-ghost-hover) */\r\n@media (hover: hover) {\r\n  :where([mono-input]) [mono-clear]:hover {\r\n    background: var(--mono-mode-ghost-hover);\r\n    color: var(--_mono-input-text);\r\n  }\r\n}\r\n\r\n:where([mono-input]) [mono-clear] > :is(svg, .mono-icon, [mono-icon]) {\r\n  display: block;\r\n  width: var(--_mono-input-clear-glyph);\r\n  height: var(--_mono-input-clear-glyph);\r\n  pointer-events: none;\r\n}\r\n\r\n/* =========================================\r\n   Message — helper / validation text under the field\r\n   ========================================= */\r\n\r\n/* basecoat@1.0.2 styles/vega.css .fieldset legend + p, .field > p, .field section > p — text-sm text-muted-foreground\r\n   leading-normal font-normal text-start. The wrapper is always rendered\r\n   (aria-describedby points at it); it takes no space until it holds text. */\r\n:where([mono-input]) > [mono-message-wrap] {\r\n  display: block;\r\n}\r\n\r\n:where([mono-input]) > [mono-message-wrap]:not(:has([mono-message]:not([mono-empty]))) {\r\n  display: none;\r\n}\r\n\r\n:where([mono-input]) [mono-message] {\r\n  font-size: var(--mono-input-message-font-size, var(--mono-text-sm));\r\n  line-height: var(--mono-input-message-line-height, var(--mono-leading-normal));\r\n  font-weight: var(--mono-font-weight-normal);\r\n  text-align: start;\r\n  color: var(--_mono-input-muted);\r\n}\r\n\r\n/* basecoat@1.0.2 styles/vega.css .field [role=\"alert\"] — text-destructive text-sm */\r\n:where([mono-input]) [mono-message=\"invalid\"] {\r\n  color: var(--_mono-input-invalid);\r\n}\r\n\r\n/* EXTENSION — the other two states in their role colour */\r\n:where([mono-input]) [mono-message=\"valid\"] {\r\n  color: var(--_mono-input-valid);\r\n}\r\n\r\n:where([mono-input]) [mono-message=\"warning\"] {\r\n  color: var(--_mono-input-warning);\r\n}\r\n\r\n@media (prefers-reduced-motion: reduce) {\r\n  :where([mono-input]) > [mono-field],\r\n  :where([mono-input]) [mono-clear] {\r\n    transition: none;\r\n  }\r\n}\r\n";
//#endregion
//#region src/components/input/mono-input.ts
var MonoInput = class MonoInput extends MonoInputCore(LitElement) {
	constructor(..._args) {
		super(..._args);
		this._slotPrefix = [];
		this._slotSuffix = [];
		this._slotLabel = [];
		this._slotHelper = [];
	}
	static {
		this.styles = [unsafeCSS(input_default)];
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
	renderIcon(_name) {
		return html`<span class="mono-icon i-mdi-close" mono-icon aria-hidden="true"></span>`;
	}
	_renderLabel() {
		if (!this.label && !this._hasLabelSlot) return nothing;
		return html`
      <label class=${this._cls("mono-input-label", "label")} mono-label for=${this._inputId}>
        ${this._hasLabelSlot ? html`<span data-mono-slot="label"></span>` : this.label}
        ${this.required ? html`<span class=${this._cls("mono-input-required", "required")} mono-required-mark>*</span>` : nothing}
      </label>
    `;
	}
	_renderHelper() {
		const base = this._cls("mono-input-message", "message");
		if (this.validationMessage) {
			const state = this._resolvedValidationState;
			return html`<div class=${`${base} ${state}`} mono-message=${state} role=${state === "invalid" ? "alert" : nothing}>${this.validationMessage}</div>`;
		}
		if (this.errorMessage) return html`<div class=${`${base} invalid`} mono-message="invalid" role="alert">${this.errorMessage}</div>`;
		if (this.successMessage) return html`<div class=${`${base} valid`} mono-message="valid">${this.successMessage}</div>`;
		if (this.helperText || this._hasHelperSlot) return html`<div class=${`${base} helper`} mono-message="helper">${this._hasHelperSlot ? html`<span data-mono-slot="helper"></span>` : this.helperText}</div>`;
		return nothing;
	}
	render() {
		return this._renderWrapper(html`
        ${this._renderLabel()}
        <div class=${this._fieldClasses} mono-field>
          ${this._hasPrefixSlot ? html`<span class=${this._cls("mono-input-prefix", "prefix")} mono-prefix><span data-mono-slot="prefix"></span></span>` : nothing}
          ${this._renderNative()}
          ${this._renderClear()}
          ${this._hasSuffixSlot ? html`<span class=${this._cls("mono-input-suffix", "suffix")} mono-suffix><span data-mono-slot="suffix"></span></span>` : nothing}
        </div>
        <div id=${this._messageId} class=${this.cssClass?.messageWrap ?? ""} mono-message-wrap>
          ${this._renderHelper()}
        </div>
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
		search: "M21 21l-4.35-4.35M10.5 18a7.5 7.5 0 1 1 0-15a7.5 7.5 0 0 1 0 15z"
	};
	return iconMap[type] ?? iconMap.text;
}
//#endregion
export { MonoInput, applyFormat, caretAfterFormat, generateInputAriaAttributes, generateInputAttributes, getInputIcon, localeSeparators, normaliseValue, parseFormat, resolveFormat, significantFor, stripFormat, validateInputProps };
