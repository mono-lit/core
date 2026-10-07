import { a as __decorate, f as customElement, i as withShadowUtilityStyles, l as defineHybridPropAliases, r as toShadowCss, s as booleanStringConverter, t as flushSsrHydration } from "../../hydration-flush-RB5Tz5nl.js";
import { t as dispatchMonoEvent } from "../../mono-event-Bi1qP9uN.js";
import { n as cssPart } from "../../css-class-BRKRzHx-.js";
import { t as buildSizeStyle } from "../../css-size-DhHSVZJK.js";
import { t as MonoFormControlCore } from "../../form-control-core-B8d7k6vk.js";
import { t as input_default } from "../../input-zGOULADt.js";
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
//#region src/components/input/mono-input.shadow.ts
var SHADOW_EXTRA_CSS = "";
var MonoInputShadow = class MonoInputShadow extends withShadowUtilityStyles(MonoInputCore(LitElement)) {
	static {
		this.disableWarning?.("change-in-update");
	}
	static {
		this.styles = [unsafeCSS(toShadowCss(input_default, {
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
	renderIcon(_name) {
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
          ${this._renderClear()}
          <span class=${this._cls("mono-input-suffix", "suffix")} mono-suffix ?mono-empty=${!this._hasSuffixSlot}>
            <slot name="suffix" @slotchange=${(e) => this._onSlotChange("suffix", e)}></slot>
          </span>
        </div>
        <div id=${this._messageId} class=${this.cssClass?.messageWrap ?? ""} mono-message-wrap>
          ${this._renderHelper()}
        </div>
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
		search: "M21 21l-4.35-4.35M10.5 18a7.5 7.5 0 1 1 0-15a7.5 7.5 0 0 1 0 15z"
	};
	return iconMap[type] ?? iconMap.text;
}
//#endregion
export { MonoInputCore, MonoInputShadow, applyFormat, caretAfterFormat, generateInputAriaAttributes, generateInputAttributes, getInputIcon, localeSeparators, normaliseValue, parseFormat, resolveFormat, significantFor, stripFormat, validateInputProps };
