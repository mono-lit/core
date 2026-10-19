import { a as __decorate, c as defineHybridPropAlias, f as customElement, i as withShadowUtilityStyles, l as defineHybridPropAliases, r as toShadowCss, s as booleanStringConverter, t as flushSsrHydration } from "../../hydration-flush-DHrl4_KK.js";
import { t as dispatchMonoEvent } from "../../mono-event-BPku9HpS.js";
import { n as cssPart } from "../../css-class-B6Tc_MAx.js";
import { t as buildSizeStyle } from "../../css-size-DWAPgQdT.js";
import { t as MonoFormControlCore } from "../../form-control-core-CIdMLXMo.js";
import { n as FieldTooltipController, t as field_tooltip_css_raw_default } from "../../field-tooltip.css_raw-DEctHXKm.js";
import { n as label_position_css_raw_default, r as FieldValidationController, t as field_validation_css_raw_default } from "../../field-validation.css_raw-B3Iu33rS.js";
import { LitElement, html, isServer, nothing, unsafeCSS } from "lit";
import { property, state } from "lit/decorators.js";
import { ifDefined } from "lit/directives/if-defined.js";
import { styleMap } from "lit/directives/style-map.js";
import { live } from "lit/directives/live.js";

//#region src/components/otp/otp-utils.ts
/**
* Pure helpers behind `mono-otp`. The value is always a CONTIGUOUS prefix of the boxes — box i
* holds `value[i]` — so every edit is a string operation and the boxes are just its characters.
*/
const OTP_DEFAULT_LENGTH = 6;
/** One character cleaned for `type`; `''` when it is not accepted. */
function sanitizeOtpChar(ch, type = "numeric") {
	if (!ch) return "";
	if (type === "numeric") return /^[0-9]$/.test(ch) ? ch : "";
	if (type === "alphanumeric") return /^[A-Za-z0-9]$/.test(ch) ? ch.toUpperCase() : "";
	return /^\S$/u.test(ch) ? ch : "";
}
/** A whole string cleaned for `type` — rejected characters are dropped, not kept as holes. */
function sanitizeOtpText(text, type = "numeric") {
	if (text == null) return "";
	let out = "";
	for (const ch of Array.from(String(text))) out += sanitizeOtpChar(ch, type);
	return out;
}
/** `length` from a prop or attribute: a whole number ≥ 1, else the default. */
function resolveOtpLength(length) {
	const n = Math.floor(Number(length));
	return Number.isFinite(n) && n >= 1 ? n : 6;
}
/** The model for `length` boxes: cleaned and cut to fit. */
function normaliseOtpValue(value, length, type = "numeric") {
	return Array.from(sanitizeOtpText(value, type)).slice(0, length).join("");
}
/**
* Group sizes → the box indexes a separator goes BEFORE. `3` repeats (6 boxes → 3-3, 8 → 3-3-2);
* a list is taken as given and any boxes past it form one last group.
*/
function parseOtpGroups(groups, length) {
	if (groups == null || groups === "") return [];
	let sizes;
	if (typeof groups === "number") sizes = [groups];
	else if (Array.isArray(groups)) sizes = groups.map(Number);
	else sizes = String(groups).replace(/[[\]\s]/g, "").split(/[,\-|]/).filter(Boolean).map(Number);
	sizes = sizes.filter((n) => Number.isFinite(n) && n >= 1).map(Math.floor);
	if (!sizes.length) return [];
	const repeat = sizes.length === 1;
	const breaks = [];
	let at = 0;
	for (let k = 0;; k++) {
		const size = repeat ? sizes[0] : sizes[k];
		if (size == null) break;
		at += size;
		if (at >= length) break;
		breaks.push(at);
	}
	return breaks;
}
/**
* Put `text` at box `index`. One character replaces that box; several (a paste, an SMS
* autofill) overwrite from `index` onwards. Rejected characters are dropped first, so pasting
* `"123-456"` into a numeric field fills six boxes.
*/
function spliceOtpValue(value, index, text, length, type = "numeric") {
	const chars = Array.from(value);
	const clean = Array.from(sanitizeOtpText(text, type));
	if (!clean.length) return {
		value,
		caret: clampCaret(index, chars.length, length)
	};
	const at = Math.min(Math.max(0, index), chars.length);
	let next;
	if (clean.length === 1) {
		next = chars.slice();
		next[at] = clean[0];
	} else next = chars.slice(0, at).concat(clean);
	next = next.slice(0, length);
	return {
		value: next.join(""),
		caret: clampCaret(at + clean.length, next.length, length)
	};
}
/** Remove the character in box `index`; the boxes after it move left. */
function removeOtpChar(value, index, length) {
	const chars = Array.from(value);
	if (index < 0 || index >= chars.length) return {
		value,
		caret: clampCaret(index, chars.length, length)
	};
	chars.splice(index, 1);
	return {
		value: chars.join(""),
		caret: clampCaret(index, chars.length, length)
	};
}
/**
* Backspace in box `index`: clear it when it holds a character, otherwise step back and clear
* the one before.
*/
function backspaceOtp(value, index, length) {
	const filled = Array.from(value).length;
	if (index < filled) return removeOtpChar(value, index, length);
	if (filled === 0) return {
		value,
		caret: 0
	};
	return removeOtpChar(value, filled - 1, length);
}
/** The furthest box that can take focus: the first empty one, or the last box when full. */
function clampCaret(index, filled, length) {
	return Math.max(0, Math.min(index, filled, length - 1));
}

//#endregion
//#region src/components/otp/otp-core.ts
/**
* `MonoOtpCore` — all render-mode-agnostic logic for `mono-otp`: N single-character boxes that
* behave as ONE field. The value is a contiguous prefix of the boxes (box i holds `value[i]`), so
* focus can never land past the first empty box, Backspace / Delete shift the rest left, and a
* paste or an SMS autofill overwrites from the focused box on (see `otp-utils.ts`).
*
* Same prop surface as mono-input (size / color / variant / label-position / validation-position
* / tooltip / messages / states / sizing), wired to `controlMonoForm` through
* `MonoFormControlCore`: `input` per edit (live rules), `change` when focus leaves the group
* (change rules, marks touched), plus `complete` once every box is filled.
*
* Each build supplies `createRenderRoot()`, the slot strategy (the `_render*` hooks below) and
* `renderIcon()` — light captures `slot="…"` children into `[data-mono-slot]` placeholders,
* shadow uses native `<slot>`s.
*/
const MonoOtpCore = (superClass) => {
	class MonoOtpCoreClass extends MonoFormControlCore(superClass) {
		constructor(...args) {
			super(...args);
			this.cssClass = {};
			this.cssClassName = "";
			this.type = "numeric";
			this.length = 6;
			this.separator = "-";
			this.mask = false;
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
				}
			}), () => this.renderRoot?.querySelector?.("[mono-otp] > [mono-field]"));
			this.validationState = "default";
			this.validationMessage = "";
			this.error = false;
			this.errorMessage = "";
			this.success = false;
			this.successMessage = "";
			this.autocomplete = "one-time-code";
			this.inputmode = "";
			this.disabled = false;
			this.readonly = false;
			this.required = false;
			this.clearable = false;
			this.autofocus = false;
			this._code = "";
			this._focusIndex = -1;
			this._hasPrefixSlotState = false;
			this._hasSuffixSlotState = false;
			this._hasLabelSlotState = false;
			this._hasHelperSlotState = false;
			this._committed = null;
			this._otpId = `mono-otp-${Math.random().toString(36).slice(2)}`;
			this._messageId = `${this._otpId}-message`;
			this._onCellInput = (event) => {
				const el = event.currentTarget;
				const i = this._indexOf(event);
				const old = Array.from(this._code)[i] ?? "";
				const raw = el.value;
				if (!this._editable) {
					el.value = old;
					event.stopPropagation();
					return;
				}
				if (raw === "") {
					el.value = old;
					const edit = removeOtpChar(this._code, i, this._length);
					if (edit.value === this._code) event.stopPropagation();
					this._apply(edit, i, event);
					return;
				}
				let text = raw;
				if (old && Array.from(raw).length === 2 && raw.includes(old)) text = raw.startsWith(old) ? raw.slice(old.length) : raw.slice(0, raw.length - old.length);
				const edit = spliceOtpValue(this._code, i, text, this._length, this.type);
				el.value = Array.from(edit.value)[i] ?? "";
				if (edit.value === this._code) event.stopPropagation();
				this._apply(edit, i, event);
			};
			this._onCellKeydown = (event) => {
				const i = this._indexOf(event);
				const n = this._length;
				const last = clampCaret(n, this._filled, n);
				switch (event.key) {
					case "Backspace":
						event.preventDefault();
						if (this._editable) this._apply(backspaceOtp(this._code, i, n), i, event);
						return;
					case "Delete":
						event.preventDefault();
						if (this._editable) this._apply(removeOtpChar(this._code, i, n), i, event);
						return;
					case "ArrowLeft":
					case "ArrowUp":
						event.preventDefault();
						this._focusCell(Math.max(0, i - 1));
						return;
					case "ArrowRight":
					case "ArrowDown":
						event.preventDefault();
						this._focusCell(Math.min(last, i + 1));
						return;
					case "Home":
						event.preventDefault();
						this._focusCell(0);
						return;
					case "End":
						event.preventDefault();
						this._focusCell(last);
						return;
				}
				if (this._editable && event.key.length === 1 && !event.ctrlKey && !event.metaKey && !event.altKey) {
					const edit = spliceOtpValue(this._code, i, event.key, n, this.type);
					if (edit.value === this._code && i < this._filled && sanitizeOtpChar(event.key, this.type)) {
						event.preventDefault();
						this._focusCell(edit.caret);
					}
				}
			};
			this._onCellPaste = (event) => {
				event.preventDefault();
				if (!this._editable) return;
				const text = event.clipboardData?.getData("text") ?? "";
				this._apply(spliceOtpValue(this._code, this._indexOf(event), text, this._length, this.type), this._indexOf(event), event);
			};
			this._onCellFocus = (event) => {
				const i = this._indexOf(event);
				const allowed = clampCaret(i, this._filled, this._length);
				if (allowed !== i) {
					this._focusCell(allowed);
					return;
				}
				this._focusIndex = i;
				event.currentTarget.select?.();
			};
			this._onCellClick = (event) => {
				event.currentTarget.select?.();
			};
			this._onFieldFocusIn = () => {
				if (this._committed === null) this._committed = this._code;
			};
			this._onFieldFocusOut = (event) => {
				const next = event.relatedTarget;
				if (next && this.renderRoot.contains(next)) return;
				this._focusIndex = -1;
				const before = this._committed;
				this._committed = null;
				if (before !== null && before !== this._code) dispatchMonoEvent(this, "change", this._detail(before, -1, event));
			};
			this._swallow = (event) => {
				event.stopPropagation();
			};
			this._onClear = () => {
				if (!this._editable) return;
				this.clear();
				this._focusCell(0);
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
			defineHybridPropAlias(this, "maxlength", "length");
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
				"maxlength",
				"css-class",
				"cssclass"
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
				case "maxlength":
					if (newValue != null) this.length = newValue;
					return;
			}
		}
		get complete() {
			return Array.from(this._code).length === this._length;
		}
		get _length() {
			return resolveOtpLength(this.length);
		}
		get _filled() {
			return Array.from(this._code).length;
		}
		willUpdate(changed) {
			if (changed.has("value") && !changed.has("modelValue") && String(this.value ?? "") !== this._code) this.modelValue = String(this.value ?? "");
			if (changed.has("modelValue") || changed.has("length") || changed.has("type")) {
				this._code = normaliseOtpValue(this.modelValue, this._length, this.type);
				if (this.value !== this._code) this.value = this._code;
			}
			super.willUpdate?.(changed);
		}
		firstUpdated(changed) {
			super.firstUpdated?.(changed);
			if (this.autofocus) this.focus();
		}
		_cellEl(i) {
			return this.renderRoot?.querySelector?.(`[mono-otp-cell][data-index="${i}"]`) ?? null;
		}
		_indexOf(event) {
			return Number(event.currentTarget.dataset.index ?? 0);
		}
		get _editable() {
			return !this.disabled && !this.readonly;
		}
		_focusCell(i) {
			const el = this._cellEl(i);
			if (!el) return;
			el.focus();
			el.select?.();
		}
		_detail(oldValue, index, sourceEvent) {
			return {
				modelValue: this._code,
				currentValue: this._code,
				oldValue,
				value: this._code,
				complete: this.complete,
				index,
				name: this.name,
				sourceEvent
			};
		}
		/** Commit an edit: write the model, fire `input` (+ `complete`), then move the caret. */
		_apply(edit, index, event) {
			const old = this._code;
			if (edit.value !== old) {
				this._code = edit.value;
				this.value = edit.value;
				this.modelValue = edit.value;
				dispatchMonoEvent(this, "input", this._detail(old, index, event));
				if (this.complete) dispatchMonoEvent(this, "complete", this._detail(old, index));
			}
			this._focusCell(edit.caret);
			this.updateComplete.then(() => {
				const el = this._cellEl(edit.caret);
				if (el && this._focusIndex === edit.caret) el.select?.();
			});
		}
		clear() {
			if (!this._code) return;
			const old = this._code;
			this._code = "";
			this.value = "";
			this.modelValue = "";
			const detail = this._detail(old, -1);
			dispatchMonoEvent(this, "input", detail);
			dispatchMonoEvent(this, "change", detail);
			dispatchMonoEvent(this, "clear", detail);
			if (this._committed !== null) this._committed = "";
		}
		focus(index) {
			const i = typeof index === "number" ? index : clampCaret(this._length, this._filled, this._length);
			this._focusCell(clampCaret(i, this._filled, this._length));
		}
		blur() {
			this._cellEl(this._focusIndex)?.blur();
		}
		get _resolvedValidationState() {
			if (this.validationState && this.validationState !== "default") return this.validationState;
			if (this.error || this.errorMessage) return "invalid";
			if (this.success || this.successMessage) return "valid";
			return "default";
		}
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
		_cls(base, key) {
			return cssPart(this.cssClass, base, key);
		}
		get _hasLabel() {
			return !!(this.label || this._hasLabelSlotState);
		}
		get _describedBy() {
			return this.validationMessage || this.errorMessage || this.successMessage || this.helperText || this._hasHelperSlotState ? this._messageId : void 0;
		}
		get _inputMode() {
			return this.inputmode || (this.type === "numeric" ? "numeric" : "text");
		}
		_placeholderAt(i) {
			const chars = Array.from(this.placeholder ?? "");
			if (!chars.length) return void 0;
			return chars.length === this._length ? chars[i] : chars[0];
		}
		_cellLabel(i) {
			const base = this.ariaLabelText || this.label;
			const own = `${this.type === "numeric" ? "Digit" : "Character"} ${i + 1} of ${this._length}`;
			return base ? `${base} – ${own}` : own;
		}
		/** Label text — light: placeholder for the captured slot; shadow overrides with `<slot>`. */
		_renderLabelText() {
			return this._hasLabelSlotState ? html`<span data-mono-slot="label"></span>` : this.label;
		}
		_renderLabel() {
			if (!this._hasLabel) return nothing;
			return html`
        <label class=${this._cls("mono-otp-label", "label")} mono-label id=${`${this._otpId}-label`} for=${`${this._otpId}-0`}>
          ${this._renderLabelText()}
          ${this.required ? html`<span class=${this._cls("mono-otp-required", "required")} mono-required-mark>*</span>` : nothing}
          ${this._tooltip.render()}
        </label>
      `;
		}
		_renderHelperText(base) {
			if (!this.helperText && !this._hasHelperSlotState) return nothing;
			return html`<div class=${`${base} helper`} mono-message="helper">${this._hasHelperSlotState ? html`<span data-mono-slot="helper"></span>` : this.helperText}</div>`;
		}
		_renderMessage() {
			const base = this._cls("mono-otp-message", "message");
			if (this._validation.moved) {
				const notice = this._validationNotice;
				return html`${this._renderHelperText(base)}<div
          class=${`${base} ${notice.state}`}
          mono-message=${notice.state}
          mono-sr-only
          role=${notice.state === "invalid" ? "alert" : nothing}
        >${notice.text}</div>`;
			}
			if (this.validationMessage) {
				const s = this._resolvedValidationState;
				return html`<div class=${`${base} ${s}`} mono-message=${s} role=${s === "invalid" ? "alert" : nothing}>${this.validationMessage}</div>`;
			}
			if (this.errorMessage) return html`<div class=${`${base} invalid`} mono-message="invalid" role="alert">${this.errorMessage}</div>`;
			if (this.successMessage) return html`<div class=${`${base} valid`} mono-message="valid">${this.successMessage}</div>`;
			return this._renderHelperText(base);
		}
		/** Prefix / suffix inside the row — light: captured-slot placeholder; shadow overrides with `<slot>`. */
		_renderAffix(name) {
			if (!(name === "prefix" ? this._hasPrefixSlotState : this._hasSuffixSlotState)) return nothing;
			return html`<span class=${this._cls(`mono-otp-${name}`, name)} mono-otp-affix=${name}><span data-mono-slot=${name}></span></span>`;
		}
		_renderCell(i, chars, invalid) {
			return html`<input
        id=${`${this._otpId}-${i}`}
        class=${this._cls("mono-otp-cell", "cell")}
        mono-otp-cell
        data-index=${i}
        type=${this.mask ? "password" : "text"}
        .value=${live(chars[i] ?? "")}
        inputmode=${this._inputMode}
        pattern=${ifDefined(this.type === "numeric" ? "[0-9]*" : void 0)}
        autocomplete=${i === 0 ? this.autocomplete || "one-time-code" : "off"}
        autocapitalize=${this.type === "alphanumeric" ? "characters" : "off"}
        autocorrect="off"
        spellcheck="false"
        placeholder=${ifDefined(this._placeholderAt(i))}
        ?disabled=${this.disabled}
        ?readonly=${this.readonly}
        ?mono-filled=${i < chars.length}
        ?mono-active=${i === this._focusIndex}
        aria-label=${this._cellLabel(i)}
        aria-invalid=${invalid ? "true" : "false"}
        aria-describedby=${ifDefined(this._describedBy)}
        @input=${this._onCellInput}
        @change=${this._swallow}
        @keydown=${this._onCellKeydown}
        @paste=${this._onCellPaste}
        @focus=${this._onCellFocus}
        @click=${this._onCellClick}
      />`;
		}
		_renderCells() {
			const n = this._length;
			const chars = Array.from(this._code);
			const breaks = new Set(parseOtpGroups(this.groups, n));
			const invalid = this._resolvedValidationState === "invalid";
			const groups = [[]];
			for (let i = 0; i < n; i++) {
				if (breaks.has(i)) groups.push([]);
				groups[groups.length - 1].push(i);
			}
			return html`${groups.map((group, g) => html`${g > 0 ? html`<span class=${this._cls("mono-otp-separator", "separator")} mono-otp-separator aria-hidden="true">${this.separator}</span>` : nothing}<div class=${this._cls("mono-otp-group", "group")} mono-otp-group>${group.map((i) => this._renderCell(i, chars, invalid))}</div>`)}`;
		}
		_renderClear() {
			if (!(this.clearable && this._code && this._editable)) return nothing;
			return html`<button type="button" class=${this._cls("mono-otp-clear", "clear")} mono-clear aria-label="Clear code" @click=${this._onClear}>
        ${this.renderIcon("close")}
      </button>`;
		}
		/** Icon hook — light: UnoCSS `i-mdi-*`; shadow: inline SVG. */
		renderIcon(_name) {
			return html``;
		}
		render() {
			const state = this._resolvedValidationState;
			const lp = this.labelPosition === "left" || this.labelPosition === "right" ? this.labelPosition : nothing;
			return html`<div
        class=${[
				"mono-otp",
				this.size,
				this.color,
				this.variant,
				this.disabled ? "disabled" : "",
				this.cssClassName,
				this.cssClass?.root
			].filter(Boolean).join(" ")}
        style=${styleMap(buildSizeStyle(this))}
        mono-otp
        mono-size=${this.size === "md" ? nothing : this.size}
        mono-color=${this.color === "primary" ? nothing : this.color}
        mono-variant=${this.variant === "outlined" ? nothing : this.variant}
        mono-label-position=${lp}
        mono-validation-position=${this.validationPosition === "bottom" ? nothing : this.validationPosition}
        mono-validation-state=${state === "default" ? nothing : state}
        mono-type=${this.type === "numeric" ? nothing : this.type}
        ?mono-mask=${this.mask}
        ?mono-complete=${this.complete}
        ?mono-disabled=${this.disabled}
        ?mono-readonly=${this.readonly}
        ?mono-required=${this.required}
        ?mono-clearable=${this.clearable}
      >
        ${this._renderLabel()}
        <div
          class=${this._cls("mono-otp-field", "field")}
          mono-field
          role="group"
          aria-labelledby=${ifDefined(!this.ariaLabelText && this._hasLabel ? `${this._otpId}-label` : void 0)}
          aria-label=${ifDefined(this.ariaLabelText || (!this._hasLabel ? "One-time code" : void 0))}
          aria-required=${ifDefined(this.required ? "true" : void 0)}
          @focusin=${this._onFieldFocusIn}
          @focusout=${this._onFieldFocusOut}
        >
          ${this._renderAffix("prefix")}
          ${this._renderCells()}
          ${this._validation.renderIcon()}
          ${this._renderClear()}
          ${this._renderAffix("suffix")}
        </div>
        ${this.name ? html`<input type="hidden" mono-otp-hidden name=${this.name} .value=${this._code} ?disabled=${this.disabled} />` : nothing}
        <div id=${this._messageId} class=${this.cssClass?.messageWrap ?? ""} mono-message-wrap>${this._renderMessage()}</div>
        ${this._validation.renderFloat()}
      </div>`;
		}
	}
	__decorate([property({ attribute: false })], MonoOtpCoreClass.prototype, "cssClass", void 0);
	__decorate([property({
		type: String,
		attribute: "css-class"
	})], MonoOtpCoreClass.prototype, "cssClassName", void 0);
	__decorate([property({ type: String })], MonoOtpCoreClass.prototype, "type", void 0);
	__decorate([property()], MonoOtpCoreClass.prototype, "length", void 0);
	__decorate([property()], MonoOtpCoreClass.prototype, "groups", void 0);
	__decorate([property({ type: String })], MonoOtpCoreClass.prototype, "separator", void 0);
	__decorate([property({
		reflect: true,
		converter: booleanStringConverter
	})], MonoOtpCoreClass.prototype, "mask", void 0);
	__decorate([property({ type: String })], MonoOtpCoreClass.prototype, "size", void 0);
	__decorate([property({ type: String })], MonoOtpCoreClass.prototype, "color", void 0);
	__decorate([property({ type: String })], MonoOtpCoreClass.prototype, "variant", void 0);
	__decorate([property({
		type: String,
		attribute: "label-position"
	})], MonoOtpCoreClass.prototype, "labelPosition", void 0);
	__decorate([property({
		type: String,
		attribute: "validation-position"
	})], MonoOtpCoreClass.prototype, "validationPosition", void 0);
	__decorate([property({ attribute: "model-value" })], MonoOtpCoreClass.prototype, "modelValue", void 0);
	__decorate([property({ type: String })], MonoOtpCoreClass.prototype, "value", void 0);
	__decorate([property({ type: String })], MonoOtpCoreClass.prototype, "name", void 0);
	__decorate([property({ type: String })], MonoOtpCoreClass.prototype, "placeholder", void 0);
	__decorate([property({ type: String })], MonoOtpCoreClass.prototype, "label", void 0);
	__decorate([property({
		type: String,
		attribute: "helper-text"
	})], MonoOtpCoreClass.prototype, "helperText", void 0);
	__decorate([property()], MonoOtpCoreClass.prototype, "tooltip", void 0);
	__decorate([property({
		type: String,
		attribute: "validation-state"
	})], MonoOtpCoreClass.prototype, "validationState", void 0);
	__decorate([property({
		type: String,
		attribute: "validation-message"
	})], MonoOtpCoreClass.prototype, "validationMessage", void 0);
	__decorate([property({
		reflect: true,
		converter: booleanStringConverter
	})], MonoOtpCoreClass.prototype, "error", void 0);
	__decorate([property({
		type: String,
		attribute: "error-message"
	})], MonoOtpCoreClass.prototype, "errorMessage", void 0);
	__decorate([property({
		reflect: true,
		converter: booleanStringConverter
	})], MonoOtpCoreClass.prototype, "success", void 0);
	__decorate([property({
		type: String,
		attribute: "success-message"
	})], MonoOtpCoreClass.prototype, "successMessage", void 0);
	__decorate([property({ type: String })], MonoOtpCoreClass.prototype, "autocomplete", void 0);
	__decorate([property({ type: String })], MonoOtpCoreClass.prototype, "inputmode", void 0);
	__decorate([property({
		type: String,
		attribute: "aria-label"
	})], MonoOtpCoreClass.prototype, "ariaLabelText", void 0);
	__decorate([property({
		reflect: true,
		converter: booleanStringConverter
	})], MonoOtpCoreClass.prototype, "disabled", void 0);
	__decorate([property({
		reflect: true,
		converter: booleanStringConverter
	})], MonoOtpCoreClass.prototype, "readonly", void 0);
	__decorate([property({
		reflect: true,
		converter: booleanStringConverter
	})], MonoOtpCoreClass.prototype, "required", void 0);
	__decorate([property({
		reflect: true,
		converter: booleanStringConverter
	})], MonoOtpCoreClass.prototype, "clearable", void 0);
	__decorate([property({
		reflect: true,
		converter: booleanStringConverter
	})], MonoOtpCoreClass.prototype, "autofocus", void 0);
	__decorate([property({ type: String })], MonoOtpCoreClass.prototype, "width", void 0);
	__decorate([property({ type: String })], MonoOtpCoreClass.prototype, "height", void 0);
	__decorate([property({
		type: String,
		attribute: "min-width"
	})], MonoOtpCoreClass.prototype, "minWidth", void 0);
	__decorate([property({
		type: String,
		attribute: "max-width"
	})], MonoOtpCoreClass.prototype, "maxWidth", void 0);
	__decorate([property({
		type: String,
		attribute: "min-height"
	})], MonoOtpCoreClass.prototype, "minHeight", void 0);
	__decorate([property({
		type: String,
		attribute: "max-height"
	})], MonoOtpCoreClass.prototype, "maxHeight", void 0);
	__decorate([state()], MonoOtpCoreClass.prototype, "_code", void 0);
	__decorate([state()], MonoOtpCoreClass.prototype, "_focusIndex", void 0);
	__decorate([state()], MonoOtpCoreClass.prototype, "_hasPrefixSlotState", void 0);
	__decorate([state()], MonoOtpCoreClass.prototype, "_hasSuffixSlotState", void 0);
	__decorate([state()], MonoOtpCoreClass.prototype, "_hasLabelSlotState", void 0);
	__decorate([state()], MonoOtpCoreClass.prototype, "_hasHelperSlotState", void 0);
	return MonoOtpCoreClass;
};

//#endregion
//#region \0raw:C:\Users\VCT-DEV\Desktop\libs\packages\helper\src\components\otp\otp.css?raw.js
var otp_css_raw_default = "/* =========================================================================\n   mono-otp — a one-time-code field: N single-character boxes that act as one\n   input. Same look as mono-input (Basecoat `.input-group`, vega) applied to\n   EACH box, and the same attribute contract:\n\n     <mono-otp length=\"6\" groups=\"3\" size=\"sm\" color=\"success\" label=\"Code\">\n     <div mono-otp mono-size=\"sm\" mono-color=\"success\">\n       <label mono-label>Code</label>\n       <div mono-field>\n         <div mono-otp-group><input mono-otp-cell>…</div>\n         <span mono-otp-separator>-</span>\n         <div mono-otp-group><input mono-otp-cell>…</div>\n       </div>\n       <div mono-message-wrap><div mono-message=\"helper\">…</div></div>\n     </div>\n\n   An absent attribute is the prop's default (md / primary / outlined /\n   default state). Parts:\n     [mono-field]            the ROW (no border — every box is its own field)\n     [mono-otp-group]        one run of boxes\n     [mono-otp-cell]         a box (a native <input>); [mono-filled] holds a char,\n                             [mono-active] has focus (the element sets both;\n                             hand-written markup gets :focus / :placeholder-shown)\n     [mono-otp-separator]    the text between groups\n     [mono-otp-affix]        prefix / suffix (=\"prefix\" | \"suffix\")\n     [mono-clear]            the clear button\n\n   Knobs — every one falls back to the matching mono-input knob, so a theme\n   flavor that restyles the input restyles the code field too:\n     --mono-otp-cell-size-<size> / --mono-otp-cell-width   box height / width\n     --mono-otp-font-<size>, --mono-otp-font-weight        character type\n     --mono-otp-gap, --mono-otp-group-gap                  spacing\n     --mono-otp-radius, --mono-otp-bg, --mono-otp-border-color, --mono-otp-shadow\n     --mono-otp-ring-color, --mono-otp-ring-width, --mono-otp-ring-alpha\n     --mono-otp-filled-bg, --mono-otp-separator-color, --mono-otp-placeholder\n     --mono-otp-<color> (primary … dark, valid, invalid)\n     --mono-otp-label-width / -label-side-gap              label-position left/right\n\n   Specificity contract as input.css: a part's resting rule is\n   `:where([mono-otp]) [mono-part]` (0,1,0) so `cssClass` utilities win;\n   state rules stay heavier.\n   ========================================================================= */\n\nmono-otp {\n  display: block;\n}\n\n[mono-otp] {\n  /* ── palette ── */\n  --_mono-otp-text: var(--mono-otp-color, var(--mono-input-color, var(--mono-input-text, var(--foreground))));\n  --_mono-otp-placeholder: var(--mono-otp-placeholder, var(--mono-input-placeholder, var(--muted-foreground)));\n  --_mono-otp-muted: var(--mono-otp-muted, var(--mono-input-muted, var(--muted-foreground)));\n  --_mono-otp-primary: var(--mono-otp-primary, var(--mono-input-primary, var(--ring)));\n  --_mono-otp-secondary: var(--mono-otp-secondary, var(--mono-input-secondary, var(--muted-foreground)));\n  --_mono-otp-success: var(--mono-otp-success, var(--mono-input-success, var(--success)));\n  --_mono-otp-danger: var(--mono-otp-danger, var(--mono-input-danger, var(--destructive)));\n  --_mono-otp-warning: var(--mono-otp-warning, var(--mono-input-warning, var(--warning)));\n  --_mono-otp-info: var(--mono-otp-info, var(--mono-input-info, var(--info)));\n  --_mono-otp-teal: var(--mono-otp-teal, var(--mono-input-teal, var(--teal)));\n  --_mono-otp-purple: var(--mono-otp-purple, var(--mono-input-purple, var(--purple)));\n  --_mono-otp-neutral: var(--mono-otp-neutral, var(--mono-input-neutral, var(--neutral)));\n  --_mono-otp-dark: var(--mono-otp-dark, var(--mono-input-dark, var(--dark)));\n  --_mono-otp-valid: var(--mono-otp-valid, var(--mono-input-valid, var(--success)));\n  --_mono-otp-invalid: var(--mono-otp-invalid, var(--mono-input-invalid, var(--destructive)));\n\n  /* ── the painted box — public knob → variant preset → input knob → token ── */\n  --_mono-otp-ring-color: var(--mono-otp-ring-color, var(--mono-otp-focus-color, var(--_mono-otp-ring-color-preset, var(--_mono-otp-primary))));\n  --_mono-otp-ring-width: var(--mono-otp-ring-width, var(--_mono-otp-ring-width-preset, var(--mono-input-ring-width, var(--mono-ring-width))));\n  --_mono-otp-ring-alpha: var(--mono-otp-ring-alpha, var(--mono-input-ring-alpha, var(--mono-ring-alpha)));\n  --_mono-otp-border-color: var(--mono-otp-border-color, var(--_mono-otp-border-color-preset, var(--mono-input-rest-border, var(--mono-input-border-color, var(--input)))));\n  --_mono-otp-bg: var(--mono-otp-bg, var(--_mono-otp-bg-preset, var(--mono-input-bg, var(--mono-input-surface, var(--mono-mode-surface)))));\n  --_mono-otp-shadow: var(--mono-otp-shadow, var(--_mono-otp-shadow-preset, 0 0 #0000));\n  --_mono-otp-radius: var(--mono-otp-radius, var(--_mono-otp-radius-preset, var(--mono-input-radius, var(--mono-radius-md))));\n\n  /* ── md metrics on the unqualified root (hand-written markup = md) ── */\n  --_mono-otp-size: var(--mono-otp-cell-size-md, var(--mono-input-height-md, var(--mono-control-height-md)));\n  --_mono-otp-font-size: var(--mono-otp-font-md, var(--mono-text-base));\n  --_mono-otp-clear: calc(var(--mono-spacing) * 6);\n  --_mono-otp-clear-glyph: calc(var(--mono-spacing) * 3.5);\n\n  display: flex;\n  flex-direction: column;\n  gap: var(--mono-otp-label-gap, var(--mono-input-gap, calc(var(--mono-spacing) * 3)));\n  width: 100%;\n  font-family: inherit;\n  color: var(--_mono-otp-text);\n}\n\n[mono-otp],\n:where([mono-otp]) *,\n:where([mono-otp]) *::before,\n:where([mono-otp]) *::after {\n  box-sizing: border-box;\n}\n\n/* shadow build: unassigned slot wrappers carry `mono-empty` */\n:where([mono-otp]) :is([mono-label], [mono-otp-affix], [mono-message])[mono-empty] {\n  display: none;\n}\n\n/* =========================================\n   Sizes — box height IS the control token\n   ========================================= */\n\n[mono-otp][mono-size=\"xs\"] {\n  --_mono-otp-size: var(--mono-otp-cell-size-xs, var(--mono-input-height-xs, var(--mono-control-height-xs)));\n  --_mono-otp-font-size: var(--mono-otp-font-xs, var(--mono-text-xs));\n  --_mono-otp-clear: calc(var(--mono-spacing) * 4);\n  --_mono-otp-clear-glyph: calc(var(--mono-spacing) * 3);\n}\n[mono-otp][mono-size=\"sm\"] {\n  --_mono-otp-size: var(--mono-otp-cell-size-sm, var(--mono-input-height-sm, var(--mono-control-height-sm)));\n  --_mono-otp-font-size: var(--mono-otp-font-sm, var(--mono-text-sm));\n  --_mono-otp-clear: calc(var(--mono-spacing) * 5);\n}\n[mono-otp][mono-size=\"lg\"] {\n  --_mono-otp-size: var(--mono-otp-cell-size-lg, var(--mono-input-height-lg, var(--mono-control-height-lg)));\n  --_mono-otp-font-size: var(--mono-otp-font-lg, var(--mono-text-lg));\n}\n[mono-otp][mono-size=\"xl\"] {\n  --_mono-otp-size: var(--mono-otp-cell-size-xl, var(--mono-input-height-xl, var(--mono-control-height-xl)));\n  --_mono-otp-font-size: var(--mono-otp-font-xl, var(--mono-text-xl));\n  --_mono-otp-clear: calc(var(--mono-spacing) * 7);\n  --_mono-otp-clear-glyph: calc(var(--mono-spacing) * 4);\n}\n[mono-otp][mono-size=\"xxl\"] {\n  --_mono-otp-size: var(--mono-otp-cell-size-xxl, var(--mono-input-height-xxl, var(--mono-control-height-xxl)));\n  --_mono-otp-font-size: var(--mono-otp-font-xxl, calc(var(--mono-text-xl) * 1.25));\n  --_mono-otp-clear: calc(var(--mono-spacing) * 8);\n  --_mono-otp-clear-glyph: calc(var(--mono-spacing) * 4);\n}\n\n/* =========================================\n   Variants — write `*-preset` slots only (same as input.css)\n   ========================================= */\n\n[mono-otp]:is(:not([mono-variant]), [mono-variant=\"outlined\"]) {\n  --_mono-otp-bg-preset: var(--mono-input-outline-bg);\n  --_mono-otp-border-color-preset: var(--mono-input-outline-border-color);\n  --_mono-otp-side-border-color-preset: var(--mono-input-outline-side-border-color);\n  --_mono-otp-shadow-preset: var(--mono-input-outline-shadow, var(--mono-shadow-xs));\n  --_mono-otp-ring-width-preset: var(--mono-input-outline-ring-width);\n  --_mono-otp-radius-preset: var(--mono-input-outline-radius);\n}\n\n[mono-otp][mono-variant=\"filled\"] {\n  --_mono-otp-bg-preset: var(--mono-otp-filled-bg, var(--mono-input-filled-bg, color-mix(in oklab, var(--input) 50%, transparent)));\n  --_mono-otp-border-color-preset: transparent;\n  --_mono-otp-shadow-preset: 0 0 #0000;\n}\n\n[mono-otp][mono-variant=\"underlined\"] {\n  --_mono-otp-bg-preset: transparent;\n  --_mono-otp-side-border-color-preset: transparent;\n  --_mono-otp-shadow-preset: 0 0 #0000;\n  --_mono-otp-ring-width-preset: 0px;\n  --_mono-otp-radius-preset: 0;\n}\n\n/* =========================================\n   Colours — the focus colour\n   ========================================= */\n\n[mono-otp]:is(:not([mono-color]), [mono-color=\"primary\"]) { --_mono-otp-ring-color-preset: var(--_mono-otp-primary); }\n[mono-otp][mono-color=\"secondary\"] { --_mono-otp-ring-color-preset: var(--_mono-otp-secondary); }\n[mono-otp][mono-color=\"success\"] { --_mono-otp-ring-color-preset: var(--_mono-otp-success); }\n[mono-otp][mono-color=\"danger\"] { --_mono-otp-ring-color-preset: var(--_mono-otp-danger); }\n[mono-otp][mono-color=\"warning\"] { --_mono-otp-ring-color-preset: var(--_mono-otp-warning); }\n[mono-otp][mono-color=\"info\"] { --_mono-otp-ring-color-preset: var(--_mono-otp-info); }\n[mono-otp][mono-color=\"teal\"] { --_mono-otp-ring-color-preset: var(--_mono-otp-teal); }\n[mono-otp][mono-color=\"purple\"] { --_mono-otp-ring-color-preset: var(--_mono-otp-purple); }\n[mono-otp][mono-color=\"neutral\"] { --_mono-otp-ring-color-preset: var(--_mono-otp-neutral); }\n[mono-otp][mono-color=\"dark\"] { --_mono-otp-ring-color-preset: var(--_mono-otp-dark); }\n\n/* =========================================\n   Label (same rules as input's)\n   ========================================= */\n\n:where([mono-otp]) > [mono-label] {\n  display: flex;\n  align-items: center;\n  width: fit-content;\n  gap: var(--mono-otp-label-gap, var(--mono-input-label-gap, calc(var(--mono-spacing) * 2)));\n  font-size: var(--mono-otp-label-font-size, var(--mono-input-label-font-size, var(--mono-text-sm)));\n  line-height: var(--mono-otp-label-line-height, var(--mono-input-label-line-height, 1));\n  font-weight: var(--mono-otp-label-font-weight, var(--mono-input-label-font-weight, var(--mono-label-font-weight, var(--mono-font-weight-medium))));\n  text-transform: var(--mono-otp-label-text-transform, var(--mono-input-label-text-transform, none));\n  letter-spacing: var(--mono-otp-label-letter-spacing, var(--mono-input-label-letter-spacing, normal));\n  color: var(--_mono-otp-text);\n  user-select: none;\n}\n\n[mono-otp][mono-disabled] > [mono-label] {\n  opacity: 0.5;\n  pointer-events: none;\n}\n\n[mono-otp][mono-validation-state=\"invalid\"] > [mono-label] {\n  color: var(--_mono-otp-invalid);\n}\n\n:where([mono-otp]) [mono-required-mark] {\n  color: var(--_mono-otp-danger);\n}\n\n:where([mono-otp]) > [mono-label] > [mono-label-tooltip] {\n  display: inline-flex;\n  flex: none;\n  align-items: center;\n  justify-content: center;\n  font-size: var(--mono-otp-label-tooltip-size, var(--mono-input-label-tooltip-size, 1.1em));\n  color: var(--mono-otp-label-tooltip-color, var(--mono-input-label-tooltip-color, currentColor));\n  opacity: var(--mono-otp-label-tooltip-opacity, var(--mono-input-label-tooltip-opacity, 0.6));\n  border-radius: 9999px;\n  cursor: help;\n  pointer-events: auto;\n  outline: none;\n  transition: opacity 150ms ease;\n}\n:where([mono-otp]) > [mono-label] > [mono-label-tooltip]:is(:hover, :focus-visible) {\n  opacity: 1;\n}\n:where([mono-otp]) > [mono-label] > [mono-label-tooltip]:focus-visible {\n  outline: 2px solid currentColor;\n  outline-offset: 2px;\n}\n:where([mono-otp]) > [mono-label] > [mono-label-tooltip] > [mono-icon] {\n  width: 1em;\n  height: 1em;\n}\n\n/* =========================================\n   The row, groups and separators\n   ========================================= */\n\n:where([mono-otp]) > [mono-field] {\n  position: relative;\n  display: flex;\n  flex-wrap: wrap;\n  align-items: center;\n  gap: var(--mono-otp-group-gap, calc(var(--mono-spacing) * 2));\n  min-width: 0;\n}\n\n:where([mono-otp]) [mono-otp-group] {\n  display: flex;\n  align-items: center;\n  gap: var(--mono-otp-gap, calc(var(--mono-spacing) * 2));\n}\n\n:where([mono-otp]) [mono-otp-separator] {\n  flex: none;\n  display: inline-flex;\n  align-items: center;\n  justify-content: center;\n  font-size: var(--_mono-otp-font-size);\n  line-height: 1;\n  color: var(--mono-otp-separator-color, var(--_mono-otp-muted));\n  user-select: none;\n}\n\n/* =========================================\n   The box — input.css's [mono-field], per character\n   ========================================= */\n\n:where([mono-otp]) [mono-otp-cell] {\n  --_mono-otp-bc: var(--_mono-otp-border-color);\n  --_mono-otp-side-bc: var(--mono-otp-side-border-color, var(--_mono-otp-side-border-color-preset, var(--_mono-otp-bc)));\n  --_mono-otp-ring: 0 0 #0000;\n\n  display: block;\n  flex: none;\n  width: var(--mono-otp-cell-width, var(--_mono-otp-size));\n  height: var(--_mono-otp-size);\n  min-width: 0;\n  margin: 0;\n  padding: 0;\n  appearance: none;\n  outline: none;\n  border: var(--mono-border-width) solid var(--_mono-otp-bc);\n  border-top-color: var(--_mono-otp-side-bc);\n  border-inline-color: var(--_mono-otp-side-bc);\n  border-radius: var(--_mono-otp-radius);\n  background: var(--_mono-otp-bg);\n  box-shadow: var(--_mono-otp-ring), var(--_mono-otp-shadow);\n  color: var(--_mono-otp-text);\n  caret-color: var(--_mono-otp-ring-color);\n  font-family: inherit;\n  font-size: var(--_mono-otp-font-size);\n  font-weight: var(--mono-otp-font-weight, var(--mono-font-weight-semibold));\n  font-variant-numeric: tabular-nums;\n  line-height: 1;\n  text-align: center;\n  transition-property: color, box-shadow, border-color, background-color;\n  transition-timing-function: var(--mono-ease);\n  transition-duration: var(--mono-duration);\n\n  &::placeholder {\n    color: var(--_mono-otp-placeholder);\n    font-weight: var(--mono-font-weight-normal);\n  }\n\n  /* The box is selected on focus so a keystroke replaces it; the ring already\n     marks the active box, so the selection highlight would only be noise. */\n  &::selection {\n    background: transparent;\n    color: inherit;\n  }\n\n  &:focus,\n  &:focus-visible {\n    outline: none !important;\n  }\n\n  /* focus:border-ring focus:ring-3 focus:ring-ring/50 — the box with the caret */\n  &:focus,\n  &[mono-active] {\n    --_mono-otp-bc: var(--_mono-otp-ring-color);\n    --_mono-otp-side-bc: var(--mono-otp-side-border-color, var(--_mono-otp-side-border-color-preset, var(--_mono-otp-ring-color)));\n    --_mono-otp-ring: 0 0 0 var(--_mono-otp-ring-width) color-mix(in oklab, var(--_mono-otp-ring-color) var(--_mono-otp-ring-alpha), transparent);\n  }\n\n  &:disabled {\n    cursor: not-allowed;\n  }\n\n  &:read-only {\n    cursor: default;\n  }\n}\n\n/* ── validation states (same tokens as input's box) ── */\n[mono-otp][mono-validation-state=\"invalid\"] [mono-otp-cell],\n:where([mono-otp]) [mono-otp-cell][aria-invalid=\"true\"] {\n  --_mono-otp-bc: var(--mono-mode-invalid-border);\n  --_mono-otp-ring: 0 0 0 var(--_mono-otp-ring-width) var(--mono-mode-invalid-ring);\n}\n[mono-otp][mono-validation-state=\"valid\"] [mono-otp-cell] {\n  --_mono-otp-bc: color-mix(in oklab, var(--_mono-otp-valid) var(--mono-mode-state-border-alpha), transparent);\n  --_mono-otp-ring: 0 0 0 var(--_mono-otp-ring-width) color-mix(in oklab, var(--_mono-otp-valid) var(--mono-mode-state-ring-alpha), transparent);\n}\n[mono-otp][mono-validation-state=\"warning\"] [mono-otp-cell] {\n  --_mono-otp-bc: color-mix(in oklab, var(--_mono-otp-warning) var(--mono-mode-state-border-alpha), transparent);\n  --_mono-otp-ring: 0 0 0 var(--_mono-otp-ring-width) color-mix(in oklab, var(--_mono-otp-warning) var(--mono-mode-state-ring-alpha), transparent);\n}\n\n/* ── readonly / disabled ── */\n[mono-otp][mono-readonly] [mono-otp-cell] {\n  background: var(--mono-otp-readonly-bg, var(--mono-input-readonly-bg, var(--muted)));\n}\n\n[mono-otp][mono-disabled] > [mono-field],\n:where([mono-otp]) > [mono-field]:has([mono-otp-cell]:disabled) {\n  opacity: 0.5;\n  cursor: not-allowed;\n}\n[mono-otp][mono-disabled] [mono-otp-cell] {\n  background: var(--mono-otp-disabled-bg, var(--mono-input-disabled-bg, var(--_mono-otp-bg)));\n}\n\n/* =========================================\n   Prefix / suffix / clear\n   ========================================= */\n\n:where([mono-otp]) [mono-otp-affix] {\n  flex: 0 0 auto;\n  display: inline-flex;\n  align-items: center;\n  gap: calc(var(--mono-spacing) * 2);\n  font-size: var(--mono-text-sm);\n  font-weight: var(--mono-font-weight-medium);\n  color: var(--_mono-otp-muted);\n  user-select: none;\n}\n\n:where([mono-otp]) [mono-otp-affix] > [data-mono-slot] {\n  display: inline-flex;\n  align-items: center;\n  gap: inherit;\n}\n\n:where([mono-otp]) [mono-otp-affix] :is(svg, .mono-icon, [mono-icon]),\n:where([mono-otp]) [mono-otp-affix] ::slotted(svg),\n:where([mono-otp]) [mono-otp-affix] ::slotted(.mono-icon),\n:where([mono-otp]) [mono-otp-affix] ::slotted([mono-icon]) {\n  display: block;\n  width: var(--mono-input-affix-icon-size, calc(var(--mono-spacing) * 4));\n  height: var(--mono-input-affix-icon-size, calc(var(--mono-spacing) * 4));\n  flex-shrink: 0;\n  pointer-events: none;\n}\n\n:where([mono-otp]) [mono-clear] {\n  flex: 0 0 auto;\n  display: inline-flex;\n  align-items: center;\n  justify-content: center;\n  width: var(--_mono-otp-clear);\n  height: var(--_mono-otp-clear);\n  padding: 0;\n  margin: 0;\n  border: 0;\n  border-radius: var(--mono-otp-clear-radius, var(--mono-input-clear-radius, calc(var(--radius) - 5px)));\n  background: transparent;\n  box-shadow: none;\n  color: var(--_mono-otp-muted);\n  font: inherit;\n  line-height: 1;\n  cursor: pointer;\n  outline-style: none;\n  transition-property: color, background-color, box-shadow;\n  transition-timing-function: var(--mono-ease);\n  transition-duration: var(--mono-duration);\n\n  &:focus-visible {\n    box-shadow: 0 0 0 var(--_mono-otp-ring-width) color-mix(in oklab, var(--_mono-otp-ring-color) var(--_mono-otp-ring-alpha), transparent);\n  }\n}\n\n@media (hover: hover) {\n  :where([mono-otp]) [mono-clear]:hover {\n    background: var(--mono-mode-ghost-hover);\n    color: var(--_mono-otp-text);\n  }\n}\n\n:where([mono-otp]) [mono-clear] > :is(svg, .mono-icon, [mono-icon]) {\n  display: block;\n  width: var(--_mono-otp-clear-glyph);\n  height: var(--_mono-otp-clear-glyph);\n  pointer-events: none;\n}\n\n/* =========================================\n   Message\n   ========================================= */\n\n:where([mono-otp]) > [mono-message-wrap] {\n  display: block;\n}\n:where([mono-otp]) > [mono-message-wrap]:not(:has([mono-message]:not([mono-empty]))) {\n  display: none;\n}\n\n:where([mono-otp]) [mono-message] {\n  font-size: var(--mono-otp-message-font-size, var(--mono-input-message-font-size, var(--mono-text-sm)));\n  line-height: var(--mono-otp-message-line-height, var(--mono-input-message-line-height, var(--mono-leading-normal)));\n  font-weight: var(--mono-font-weight-normal);\n  text-align: start;\n  color: var(--_mono-otp-muted);\n}\n:where([mono-otp]) [mono-message=\"invalid\"] { color: var(--_mono-otp-invalid); }\n:where([mono-otp]) [mono-message=\"valid\"] { color: var(--_mono-otp-valid); }\n:where([mono-otp]) [mono-message=\"warning\"] { color: var(--_mono-otp-warning); }\n\n/* hidden form value */\n:where([mono-otp]) [mono-otp-hidden] {\n  display: none;\n}\n\n@media (prefers-reduced-motion: reduce) {\n  :where([mono-otp]) :is([mono-otp-cell], [mono-clear]) {\n    transition: none;\n  }\n}\n\n/* =========================================\n   label-position — left / right (form/label-position.css).\n   `notched` renders as top: there is no single box to notch.\n   ========================================= */\n\n[mono-otp][mono-label-position] {\n  --_mono-lp-width: var(--mono-otp-label-width, var(--mono-input-label-width, auto));\n  --_mono-lp-gap: var(--mono-otp-label-side-gap, var(--mono-input-label-side-gap, calc(var(--mono-spacing) * 3)));\n  --_mono-lp-height: var(--_mono-otp-size);\n  --_mono-lp-box-min: var(--_mono-otp-size);\n  --_mono-lp-padding-x: 0px;\n  --_mono-lp-padding-y: 0px;\n  --_mono-lp-font: var(--mono-text-xs);\n  --_mono-lp-notch-bg: var(--background);\n  --_mono-lp-field-bg: var(--_mono-otp-bg);\n}\n";

//#endregion
//#region src/components/otp/mono-otp.shadow.ts
let MonoOtpShadow = class MonoOtpShadow extends withShadowUtilityStyles(MonoOtpCore(LitElement)) {
	static {
		this.disableWarning?.("change-in-update");
	}
	static {
		this.styles = [unsafeCSS(toShadowCss(otp_css_raw_default + label_position_css_raw_default + field_tooltip_css_raw_default + field_validation_css_raw_default, { host: "mono-otp" }))];
	}
	connectedCallback() {
		super.connectedCallback();
		if (isServer) return;
		flushSsrHydration(this);
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
		if (name === "prefix" && this._hasPrefixSlotState !== has) this._hasPrefixSlotState = has;
		else if (name === "suffix" && this._hasSuffixSlotState !== has) this._hasSuffixSlotState = has;
		else if (name === "label" && this._hasLabelSlotState !== has) this._hasLabelSlotState = has;
		else if (name === "helper" && this._hasHelperSlotState !== has) this._hasHelperSlotState = has;
	}
	_onSlotChange(name, event) {
		this._setSlotState(name, this._slotHasContent(event.target));
	}
	_renderLabelText() {
		return html`<slot name="label" @slotchange=${(e) => this._onSlotChange("label", e)}>${this.label}</slot>`;
	}
	/** Always rendered (the slot must exist to be scanned); hidden with `mono-empty` when empty. */
	_renderLabel() {
		return html`
      <label
        class=${this._cls("mono-otp-label", "label")}
        mono-label
        id=${`${this._otpId}-label`}
        for=${`${this._otpId}-0`}
        ?mono-empty=${!this.label && !this._hasLabelSlotState}
      >
        ${this._renderLabelText()}
        ${this.required ? html`<span class=${this._cls("mono-otp-required", "required")} mono-required-mark>*</span>` : nothing}
        ${this._tooltip.render()}
      </label>
    `;
	}
	_renderHelperText(base) {
		return html`
      <div class=${`${base} helper`} mono-message="helper" ?mono-empty=${!this.helperText && !this._hasHelperSlotState}>
        <slot name="helper" @slotchange=${(e) => this._onSlotChange("helper", e)}>${this.helperText}</slot>
      </div>
    `;
	}
	_renderAffix(name) {
		const has = name === "prefix" ? this._hasPrefixSlotState : this._hasSuffixSlotState;
		return html`<span class=${this._cls(`mono-otp-${name}`, name)} mono-otp-affix=${name} ?mono-empty=${!has}>
      <slot name=${name} @slotchange=${(e) => this._onSlotChange(name, e)}></slot>
    </span>`;
	}
	renderIcon(_name) {
		return html`
      <svg viewBox="0 0 24 24" mono-icon fill="currentColor" aria-hidden="true">
        <path d="M19,6.41L17.59,5L12,10.59L6.41,5L5,6.41L10.59,12L5,17.59L6.41,19L12,13.41L17.59,19L19,17.59L13.41,12L19,6.41Z" />
      </svg>
    `;
	}
};
MonoOtpShadow = __decorate([customElement("mono-shadow-otp")], MonoOtpShadow);

//#endregion
export { MonoOtpCore, MonoOtpShadow, OTP_DEFAULT_LENGTH, backspaceOtp, clampCaret, normaliseOtpValue, parseOtpGroups, removeOtpChar, resolveOtpLength, sanitizeOtpChar, sanitizeOtpText, spliceOtpValue };