import { d as buildSizeStyle } from "./mono-ui-kvLVIf1V.js";
import { a as defineHybridPropAliases, i as defineHybridPropAlias, r as booleanStringConverter, t as __decorate } from "./decorate-DbYFpi8R.js";
import { t as dispatchMonoEvent } from "./mono-event-CAZf0F_k.js";
import { t as MonoFormControlCore } from "./form-control-core-CRZPZ1ru.js";
import { n as cssPart } from "./css-class-B6Tc_MAx.js";
import { t as FieldTooltipController } from "./field-tooltip-Csk4s2ve.js";
import { t as FieldValidationController } from "./field-validation-CFmUmuDx.js";
import { html, nothing } from "lit";
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
export { normaliseOtpValue as a, resolveOtpLength as c, spliceOtpValue as d, clampCaret as i, sanitizeOtpChar as l, OTP_DEFAULT_LENGTH as n, parseOtpGroups as o, backspaceOtp as r, removeOtpChar as s, MonoOtpCore as t, sanitizeOtpText as u };