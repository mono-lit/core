import { a as __decorate, c as defineHybridPropAlias, f as customElement, i as withShadowUtilityStyles, l as defineHybridPropAliases, r as toShadowCss, s as booleanStringConverter, t as flushSsrHydration } from "../../hydration-flush-RB5Tz5nl.js";
import { t as dispatchMonoEvent } from "../../mono-event-Bi1qP9uN.js";
import { t as MonoFormControlCore } from "../../form-control-core-B8d7k6vk.js";
import { LitElement, html, isServer, nothing, unsafeCSS } from "lit";
import { property, state } from "lit/decorators.js";
import { ifDefined } from "lit/directives/if-defined.js";
//#region src/components/radio/radio-core.ts
/**
* `MonoRadioCore` — all render-mode-agnostic logic for `mono-radio`: reactive
* props (incl. SSR `disabled` coercion), hybrid aliases (incl. the
* `ariaLabel`/`aria-label`/`arialabel` → `ariaLabelText` getters), camelCase
* attribute fallbacks, class computation, the `mno-change` interactivity, and the
* shared `<label><input><circle><dot></circle><labelBlock></label>` `render()`
* (the radio dot is pure CSS — no icons). Only the label/description region is a
* hook (`_renderLabelBlock`) — the light build uses `data-mono-slot`, the shadow
* build native `<slot>` (mirrors `mono-checkbox`).
*
* SSR-safe: no `document`/`window` access; `focus`/`blur` query `this.renderRoot`.
*/
var MonoRadioCore = (superClass) => {
	class MonoRadioCoreClass extends MonoFormControlCore(superClass) {
		constructor(...args) {
			super(...args);
			this.size = "md";
			this.color = "primary";
			this.value = "";
			this.modelValue = "";
			this.disabled = false;
			this.label = "";
			this.sublabel = "";
			this.cssClass = {};
			this.cssClassName = "";
			this._hasLabelSlotState = false;
			this._hasDescriptionSlotState = false;
			defineHybridPropAliases(this, [
				"modelValue",
				"ariaLabelText",
				"cssClass"
			]);
			defineHybridPropAlias(this, "description", "sublabel");
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
			for (const name of [
				"ariaLabel",
				"aria-label",
				"arialabel"
			]) Object.defineProperty(this, name, {
				get: () => this.ariaLabelText,
				set: (value) => {
					this.ariaLabelText = value == null ? void 0 : String(value);
				},
				configurable: true,
				enumerable: false
			});
		}
		static get observedAttributes() {
			return [
				...super.observedAttributes ?? [],
				"modelvalue",
				"arialabeltext",
				"description",
				"arialabel",
				"css-class",
				"cssclass"
			];
		}
		attributeChangedCallback(name, oldValue, newValue) {
			super.attributeChangedCallback(name, oldValue, newValue);
			if (oldValue === newValue) return;
			if (name === "modelvalue") {
				this.modelValue = this._toRadioValue(newValue);
				return;
			}
			if (name === "arialabeltext" || name === "arialabel") {
				this.ariaLabelText = newValue ?? void 0;
				return;
			}
			if (name === "description") {
				this.sublabel = newValue ?? "";
				return;
			}
			if (name === "css-class" || name === "cssclass") this._setCssClass(newValue);
		}
		willUpdate(changed) {
			if (typeof this.disabled === "string") {
				const normalized = this.disabled.toLowerCase().trim();
				this.disabled = normalized === "" || normalized === "true";
			}
			super.willUpdate?.(changed);
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
		_toRadioValue(value) {
			if (value === void 0 || value === null) return "";
			if (typeof value === "boolean") return value;
			if (typeof value === "number") return value;
			return String(value);
		}
		_cls(base, key) {
			const extra = this.cssClass?.[key];
			return extra ? `${base} ${extra}` : base;
		}
		get _checked() {
			return this.modelValue === this.value;
		}
		get _wrapperClasses() {
			return [
				"mono-radio",
				this.size,
				this.color,
				this.disabled ? "disabled" : "",
				this._checked ? "mono-radio-checked" : "",
				this.cssClassName,
				this.cssClass?.root
			].filter(Boolean).join(" ");
		}
		get _inputClasses() {
			return this._cls("mono-radio-input", "input");
		}
		get _circleClasses() {
			return [this._cls("mono-radio-circle", "circle"), this.size].filter(Boolean).join(" ");
		}
		get _dotClasses() {
			return [this._cls("mono-radio-dot", "dot"), this.size].filter(Boolean).join(" ");
		}
		_hasLabelContent() {
			return Boolean(this.label) || this._hasLabelSlotState;
		}
		_hasDescriptionContent() {
			return Boolean(this.sublabel) || this._hasDescriptionSlotState;
		}
		_createModelDetail(args) {
			return {
				modelValue: args.modelValue,
				currentValue: args.modelValue,
				oldValue: args.oldValue,
				value: this.value,
				checked: args.modelValue === this.value,
				sourceEvent: args.sourceEvent
			};
		}
		_emitChange(detail) {
			dispatchMonoEvent(this, "change", detail);
		}
		_handleChange(event) {
			if (this.disabled) return;
			if (!event.currentTarget.checked) return;
			const oldValue = this.modelValue;
			const nextValue = this.value;
			this.modelValue = nextValue;
			const detail = this._createModelDetail({
				modelValue: nextValue,
				oldValue,
				sourceEvent: event
			});
			this._emitChange(detail);
		}
		/** Light-DOM label block (data-mono-slot). Shadow build overrides with `<slot>`. */
		_renderLabelBlock() {
			if (!this._hasLabelContent() && !this._hasDescriptionContent()) return nothing;
			return html`
        <span class=${this._cls("mono-radio-label", "label")} mono-label>
          ${this._hasLabelContent() ? html`
                <span class=${this._cls("mono-radio-label-text", "labelText")} mono-label-text>
                  ${this._hasLabelSlotState ? html`<span data-mono-slot="label"></span>` : this.label}
                </span>
              ` : nothing}

          ${this._hasDescriptionContent() ? html`
                <span class=${this._cls("mono-radio-label-description", "description")} mono-description>
                  ${this._hasDescriptionSlotState ? html`<span data-mono-slot="description"></span>` : this.sublabel}
                </span>
              ` : nothing}
        </span>
      `;
		}
		render() {
			const ariaLabel = this.ariaLabelText || this.label || (this._hasLabelSlotState ? "Radio option" : void 0);
			return html`
        <label
          class=${this._wrapperClasses}
          mono-radio
          mono-size=${this.size === "md" ? nothing : this.size}
          mono-color=${this.color === "primary" ? nothing : this.color}
          ?mono-checked=${this._checked}
          ?mono-disabled=${this.disabled}
        >
          <input
            class=${this._inputClasses}
            mono-input
            type="radio"
            .checked=${this._checked}
            .value=${String(this.value ?? "")}
            ?disabled=${this.disabled}
            aria-checked=${String(this._checked)}
            aria-label=${ifDefined(ariaLabel)}
            @change=${this._handleChange}
          />

          <span class=${this._circleClasses} mono-circle aria-hidden="true">
            <span class=${this._dotClasses} mono-dot></span>
          </span>

          ${this._renderLabelBlock()}
        </label>
      `;
		}
		focus(options) {
			this.renderRoot.querySelector(".mono-radio-input")?.focus(options);
		}
		blur() {
			this.renderRoot.querySelector(".mono-radio-input")?.blur();
		}
	}
	__decorate([property({ type: String })], MonoRadioCoreClass.prototype, "size", void 0);
	__decorate([property({ type: String })], MonoRadioCoreClass.prototype, "color", void 0);
	__decorate([property({ type: String })], MonoRadioCoreClass.prototype, "value", void 0);
	__decorate([property({
		type: String,
		attribute: "model-value",
		reflect: true
	})], MonoRadioCoreClass.prototype, "modelValue", void 0);
	__decorate([property({
		reflect: true,
		converter: booleanStringConverter
	})], MonoRadioCoreClass.prototype, "disabled", void 0);
	__decorate([property({ type: String })], MonoRadioCoreClass.prototype, "label", void 0);
	__decorate([property({ type: String })], MonoRadioCoreClass.prototype, "sublabel", void 0);
	__decorate([property({
		type: String,
		attribute: "aria-label"
	})], MonoRadioCoreClass.prototype, "ariaLabelText", void 0);
	__decorate([property({ attribute: false })], MonoRadioCoreClass.prototype, "cssClass", void 0);
	__decorate([property({
		type: String,
		attribute: false
	})], MonoRadioCoreClass.prototype, "cssClassName", void 0);
	__decorate([state()], MonoRadioCoreClass.prototype, "_hasLabelSlotState", void 0);
	__decorate([state()], MonoRadioCoreClass.prototype, "_hasDescriptionSlotState", void 0);
	return MonoRadioCoreClass;
};
//#endregion
//#region src/components/radio/radio.css?raw
var radio_default = "/* =========================================================================\r\n   mono-radio — a port of Basecoat's `.input[type='radio']` and the `.label`\r\n   beside it (basecoat-css@1.0.2, vega style).\r\n\r\n   Styled by ATTRIBUTE, like Basecoat — and the attributes mirror the element's\r\n   props one for one, so hand-written markup reads like the Lit / Vue tag:\r\n\r\n     <mono-radio size=\"sm\" color=\"danger\" label=\"Email\" value=\"email\" model-value=\"email\">\r\n     <label mono-radio mono-size=\"sm\" mono-color=\"danger\">\r\n       <input mono-input type=\"radio\" name=\"contact\" value=\"email\" checked />\r\n       <span mono-circle aria-hidden=\"true\"></span>\r\n       <span mono-label><span mono-label-text>Email</span></span>\r\n     </label>\r\n\r\n   An absent attribute is the prop's default (`:not([mono-size])` = md,\r\n   `:not([mono-color])` = primary). The element renders these attributes on its\r\n   root <label> (both builds) plus the STATE `mono-checked`; hand-written markup\r\n   may rely on the native input's `:checked` instead — every state rule reads\r\n   both. The old classes (`.mono-radio.sm.mono-radio-checked`) are still emitted\r\n   as inert hooks until 2.0 but no rule here reads them.\r\n\r\n   Selector map (ours ≡ upstream):\r\n     [mono-radio]                                  ≡ .label (flex gap-2 text-sm font-medium leading-snug select-none)\r\n     [mono-radio] > [mono-circle]                  ≡ .input[type='radio'] (size-4 rounded-full border-input; the real input is visually hidden)\r\n     [mono-checked] / [mono-input]:checked         ≡ :checked (bg-primary border-primary) + :checked:before (size-2 bg-primary-foreground)\r\n     [mono-circle] > [mono-dot] / ::before         ≡ :checked:before — the element renders the dot, raw markup may omit it\r\n     [mono-input]:focus-visible + [mono-circle]    ≡ focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50\r\n     [mono-invalid] / [mono-input][aria-invalid]   ≡ aria-invalid:border-destructive aria-invalid:ring-destructive/20\r\n     [mono-disabled] / [mono-input]:disabled       ≡ disabled:cursor-not-allowed disabled:opacity-50\r\n     [mono-label-text]                             ≡ .label text\r\n     [mono-description]                            ≡ .field > p (text-sm text-muted-foreground)\r\n     [mono-size=\"xs|sm|lg|xl|xxl\"]                 ≡ EXTENSION — the circle is 4/9 of the --mono-control-height-* step\r\n                                                     (16px at vega md), label / description / gap step with it\r\n     [mono-color=\"…\"]                              ≡ EXTENSION (the checked fill in the role's colour)\r\n\r\n   Every metric here is checkbox.css's: the two controls sit side by side in a\r\n   form, so circle ≡ box, gap ≡ gap, label ≡ label at every step, and the\r\n   pairing spec asserts it.\r\n\r\n   Specificity contract (same as the pre-port class sheet): a part's RESTING rule\r\n   is exactly one attribute strong — `:where([mono-radio]) [mono-circle]` =\r\n   (0,1,0) — so a utility class handed in through `cssClass` wins by source\r\n   order, while state rules (checked / focus / invalid / disabled, keyed on the\r\n   root or the native input) stay heavier and win over it, as they always did.\r\n\r\n   Inner parts: [mono-input], [mono-circle] > [mono-dot], [mono-label] >\r\n   [mono-label-text] / [mono-description]. The shadow build marks an unassigned\r\n   slot wrapper [mono-empty].\r\n\r\n   The circle sits on the label's CAP BAND (see `--_mono-radio-line-offset`):\r\n   mono's own alignment rule, kept — Basecoat centres a lone radio on its line\r\n   box with `items-center`, which is the same thing for a one-line label and\r\n   drifts for a described one.\r\n\r\n   FLAVORS set `--mono-radio-{radius,shadow,ring-width,ring-alpha,bg,border-color,\r\n   checked-bg,dot-color,size-md}` (the per-style `.input[type='radio']` deltas); every\r\n   fallback here is vega's value (`node scripts/basecoat-styles.mjs --varying\r\n   \"input\\[type='radio'\\]\"`).\r\n   ========================================================================= */\r\n\r\nmono-radio {\r\n  display: inline-block;\r\n}\r\n\r\n[mono-radio] {\r\n  /* ── palette: each slot is a public knob over a Basecoat token ─────────── */\r\n  --_mono-radio-text: var(--mono-radio-text, var(--foreground));\r\n  --_mono-radio-description: var(--mono-radio-description, var(--muted-foreground));\r\n  --_mono-radio-primary: var(--mono-radio-primary, var(--primary));\r\n  --_mono-radio-primary-foreground: var(--mono-radio-primary-foreground, var(--primary-foreground));\r\n  --_mono-radio-accent: var(--mono-radio-accent, var(--_mono-radio-accent-preset, var(--_mono-radio-primary)));\r\n  --_mono-radio-dot-color: var(--mono-radio-dot-color, var(--_mono-radio-dot-preset, var(--_mono-radio-primary-foreground)));\r\n  --_mono-radio-border-color: var(--mono-radio-border, var(--mono-radio-border-color, var(--input)));\r\n  --_mono-radio-bg: var(--mono-radio-bg, var(--mono-mode-surface));\r\n  /* the radio is the one control Basecoat leaves shadowless (the checkbox has\r\n     shadow-xs) — the slot stays so a flavor or a consumer can put one back */\r\n  --_mono-radio-shadow: var(--mono-radio-shadow, 0 0 #0000);\r\n  --_mono-radio-radius: var(--mono-radio-radius, var(--mono-radius-full));\r\n  --_mono-radio-border-width: var(--mono-radio-border-width, var(--mono-border-width));\r\n  --_mono-radio-ring-color: var(--mono-radio-ring-color, var(--ring));\r\n  --_mono-radio-ring-width: var(--mono-radio-ring-width, var(--mono-ring-width));\r\n  --_mono-radio-ring-alpha: var(--mono-radio-ring-alpha, var(--mono-ring-alpha));\r\n\r\n  /* ── md metrics live on the unqualified root ON PURPOSE ────────────────────\r\n     basecoat@1.0.2 styles/vega.css .input[type='radio'] — size-4 (= 4/9 of the\r\n     h-9 control); .field > label, .label — gap-2 text-sm leading-snug */\r\n  --_mono-radio-control: var(--mono-radio-size-md, calc(var(--mono-control-height-md) * 4 / 9));\r\n  --_mono-radio-gap: var(--mono-radio-gap, var(--mono-radio-gap-md, calc(var(--mono-spacing) * 2)));\r\n  --_mono-radio-label-font: var(--mono-radio-label-font-md, var(--mono-text-sm));\r\n  --_mono-radio-description-font: var(--mono-radio-description-font-md, 0.8125rem);\r\n  /* :checked:before — size-2 on a size-4 circle */\r\n  --_mono-radio-dot: var(--mono-radio-dot, 50%);\r\n\r\n  /* ── whole pixels ────────────────────────────────────────────────────────\r\n     The circle is a ratio of the control step, so it lands on a fraction (18.39px,\r\n     17.77px…). A fractional round shape is antialiased on every edge — the\r\n     switch thumb, which parks flush against the track's cap, picked up a dark\r\n     rim that changed with the flavor and the screen's pixel ratio. Snap the\r\n     derived size to 1px; `round()` has the same browser floor as `color-mix()`\r\n     and `:has()`, which this sheet already requires. Snapping happens HERE, at\r\n     one place per value, so the per-size blocks stay plain arithmetic. */\r\n  --_mono-radio-control-px: round(nearest, var(--_mono-radio-control), 1px);\r\n\r\n  /* ── alignment with the label ────────────────────────────────────────────\r\n     The circle is centred on the label's CAP BAND — the ink the eye reads, not\r\n     the line box. Every number is checkbox.css's; the two controls sit side by\r\n     side in a form and any divergence shows. */\r\n  --_mono-radio-label-line-height: var(--mono-radio-label-line-height, var(--mono-leading-snug));\r\n  --_mono-radio-optical-shift: 0.045;\r\n  --_mono-radio-optical-nudge: 0px;\r\n  --_mono-radio-line-offset: calc(\r\n    (var(--_mono-radio-label-font) * var(--_mono-radio-label-line-height) - var(--_mono-radio-control-px)) / 2 +\r\n      var(--_mono-radio-label-font) * var(--_mono-radio-optical-shift) + var(--_mono-radio-optical-nudge)\r\n  );\r\n\r\n  /* The element build nests this root inside its host, so it is never itself a\r\n     grid or flex item and shrink-wraps its content. Hand-written markup usually\r\n     IS the item (a radio in a `display: grid` list), and an item blockifies —\r\n     `inline-flex` becomes `flex` and the row stretches to the widest sibling,\r\n     wrapping its label at a different point than the element's. `fit-content`\r\n     keeps both shapes shrink-wrapped; a consumer who wants a full-width row\r\n     still sets a width. */\r\n  width: fit-content;\r\n  display: inline-flex;\r\n  align-items: flex-start;\r\n  gap: var(--_mono-radio-gap);\r\n  position: relative;\r\n  vertical-align: top;\r\n  cursor: pointer;\r\n  user-select: none;\r\n  font-family: inherit;\r\n  color: var(--_mono-radio-text);\r\n}\r\n\r\n[mono-radio],\r\n:where([mono-radio]) *,\r\n:where([mono-radio]) *::before,\r\n:where([mono-radio]) *::after {\r\n  box-sizing: border-box;\r\n}\r\n\r\n:where([mono-radio]) :is([mono-label], [mono-label-text], [mono-description])[mono-empty] {\r\n  display: none;\r\n}\r\n\r\n/* the circle seats on the first line of a label that is actually there; a bare\r\n   circle stays flush at the top */\r\n[mono-radio]:has([mono-label-text]:not([mono-empty])) > [mono-circle] {\r\n  margin-top: var(--_mono-radio-line-offset, 0px);\r\n}\r\n\r\n/* =========================================\r\n   Sizes — EXTENSION: the circle is 4/9 of the control step (vega md: 36 × 4/9 =\r\n   16px), label, description and gap step with it (md = Basecoat's text-sm / gap-2)\r\n   ========================================= */\r\n\r\n[mono-radio][mono-size=\"xs\"] {\r\n  --_mono-radio-control: var(--mono-radio-size-xs, calc(var(--mono-control-height-xs) * 4 / 9));\r\n  --_mono-radio-gap: var(--mono-radio-gap, var(--mono-radio-gap-xs, calc(var(--mono-spacing) * 1.25)));\r\n  --_mono-radio-label-font: var(--mono-radio-label-font-xs, var(--mono-text-xs));\r\n  --_mono-radio-description-font: var(--mono-radio-description-font-xs, 0.6875rem);\r\n}\r\n\r\n[mono-radio][mono-size=\"sm\"] {\r\n  --_mono-radio-control: var(--mono-radio-size-sm, calc(var(--mono-control-height-sm) * 4 / 9));\r\n  --_mono-radio-gap: var(--mono-radio-gap, var(--mono-radio-gap-sm, calc(var(--mono-spacing) * 1.5)));\r\n  --_mono-radio-label-font: var(--mono-radio-label-font-sm, 0.8125rem);\r\n  --_mono-radio-description-font: var(--mono-radio-description-font-sm, var(--mono-text-xs));\r\n}\r\n\r\n[mono-radio][mono-size=\"lg\"] {\r\n  --_mono-radio-control: var(--mono-radio-size-lg, calc(var(--mono-control-height-lg) * 4 / 9));\r\n  --_mono-radio-gap: var(--mono-radio-gap, var(--mono-radio-gap-lg, calc(var(--mono-spacing) * 2.5)));\r\n  --_mono-radio-label-font: var(--mono-radio-label-font-lg, var(--mono-text-base));\r\n  --_mono-radio-description-font: var(--mono-radio-description-font-lg, var(--mono-text-sm));\r\n  /* 16px text rounds its ascent such that the circle lands ~0.35px low */\r\n  --_mono-radio-optical-nudge: -0.35px;\r\n}\r\n\r\n[mono-radio][mono-size=\"xl\"] {\r\n  --_mono-radio-control: var(--mono-radio-size-xl, calc(var(--mono-control-height-xl) * 4 / 9));\r\n  --_mono-radio-gap: var(--mono-radio-gap, var(--mono-radio-gap-xl, calc(var(--mono-spacing) * 3)));\r\n  --_mono-radio-label-font: var(--mono-radio-label-font-xl, var(--mono-text-lg));\r\n  --_mono-radio-description-font: var(--mono-radio-description-font-xl, var(--mono-text-base));\r\n}\r\n\r\n[mono-radio][mono-size=\"xxl\"] {\r\n  --_mono-radio-control: var(--mono-radio-size-xxl, calc(var(--mono-control-height-xxl) * 4 / 9));\r\n  --_mono-radio-gap: var(--mono-radio-gap, var(--mono-radio-gap-xxl, calc(var(--mono-spacing) * 3.5)));\r\n  --_mono-radio-label-font: var(--mono-radio-label-font-xxl, var(--mono-text-xl));\r\n  --_mono-radio-description-font: var(--mono-radio-description-font-xxl, var(--mono-text-lg));\r\n  /* 20px text rounds the other way, leaving the circle ~1.1px high */\r\n  --_mono-radio-optical-nudge: 1.1px;\r\n}\r\n\r\n/* =========================================\r\n   Colours — EXTENSION: the checked fill in the role's colour\r\n   ========================================= */\r\n\r\n[mono-radio]:is(:not([mono-color]), [mono-color=\"primary\"]) {\r\n  --_mono-radio-accent-preset: var(--_mono-radio-primary);\r\n  --_mono-radio-dot-preset: var(--_mono-radio-primary-foreground);\r\n}\r\n[mono-radio][mono-color=\"secondary\"] {\r\n  --_mono-radio-accent-preset: var(--secondary-foreground);\r\n  --_mono-radio-dot-preset: var(--secondary);\r\n}\r\n[mono-radio][mono-color=\"success\"] {\r\n  --_mono-radio-accent-preset: var(--success);\r\n  --_mono-radio-dot-preset: var(--success-foreground);\r\n}\r\n[mono-radio][mono-color=\"danger\"] {\r\n  --_mono-radio-accent-preset: var(--destructive);\r\n  --_mono-radio-dot-preset: var(--destructive-foreground);\r\n}\r\n[mono-radio][mono-color=\"warning\"] {\r\n  --_mono-radio-accent-preset: var(--warning);\r\n  --_mono-radio-dot-preset: var(--warning-foreground);\r\n}\r\n[mono-radio][mono-color=\"info\"] {\r\n  --_mono-radio-accent-preset: var(--info);\r\n  --_mono-radio-dot-preset: var(--info-foreground);\r\n}\r\n[mono-radio][mono-color=\"teal\"] {\r\n  --_mono-radio-accent-preset: var(--teal);\r\n  --_mono-radio-dot-preset: var(--teal-foreground);\r\n}\r\n[mono-radio][mono-color=\"purple\"] {\r\n  --_mono-radio-accent-preset: var(--purple);\r\n  --_mono-radio-dot-preset: var(--purple-foreground);\r\n}\r\n[mono-radio][mono-color=\"neutral\"] {\r\n  --_mono-radio-accent-preset: var(--neutral);\r\n  --_mono-radio-dot-preset: var(--neutral-foreground);\r\n}\r\n[mono-radio][mono-color=\"dark\"] {\r\n  --_mono-radio-accent-preset: var(--dark);\r\n  --_mono-radio-dot-preset: var(--dark-foreground);\r\n}\r\n\r\n/* =========================================\r\n   States on the root\r\n   ========================================= */\r\n\r\n/* basecoat@1.0.2 components/radio.css .field > input[type='radio'], .input[type='radio']\r\n   — disabled:cursor-not-allowed disabled:opacity-50 */\r\n[mono-radio][mono-disabled],\r\n[mono-radio]:has(> [mono-input]:disabled) {\r\n  cursor: not-allowed;\r\n  opacity: 0.5;\r\n  pointer-events: none;\r\n}\r\n\r\n/* the native input is the accessible control; the circle is its painted twin */\r\n:where([mono-radio]) [mono-input] {\r\n  position: absolute;\r\n  opacity: 0;\r\n  pointer-events: none;\r\n  width: 1px;\r\n  height: 1px;\r\n  margin: 0;\r\n  /* the UA gives an <input> its own font; inside a shadow root nothing resets it,\r\n     so the hidden control ended up with a different computed font in the two\r\n     builds. It paints nothing either way — this just keeps them identical. */\r\n  font: inherit;\r\n  color: inherit;\r\n}\r\n\r\n/* =========================================\r\n   The circle\r\n   ========================================= */\r\n\r\n/* basecoat@1.0.2 components/radio.css .field > input[type='radio'], .input[type='radio']\r\n   — relative shrink-0 appearance-none border outline-none */\r\n/* basecoat@1.0.2 styles/vega.css .field > input[type='radio'], .input[type='radio']\r\n   — flex size-4 rounded-full border-input (dark:bg-input/30 via --mono-mode-surface);\r\n   checked:bg-primary checked:border-primary checked:text-primary-foreground;\r\n   mono: `--tw-ring-*` flattened to the ring + shadow slots */\r\n:where([mono-radio]) > [mono-circle] {\r\n  --_mono-radio-ring: 0 0 #0000;\r\n  position: relative;\r\n  flex: 0 0 auto;\r\n  display: inline-flex;\r\n  align-items: center;\r\n  justify-content: center;\r\n  width: var(--_mono-radio-control-px);\r\n  height: var(--_mono-radio-control-px);\r\n  border: var(--_mono-radio-border-width) solid var(--_mono-radio-border-color);\r\n  border-radius: var(--_mono-radio-radius);\r\n  background-color: var(--_mono-radio-bg);\r\n  box-shadow: var(--_mono-radio-ring), var(--_mono-radio-shadow);\r\n  /* the circle's own ink is the ACCENT — a flavor that leaves the checked circle\r\n     hollow (sera) then sets `--mono-radio-dot-color: currentColor` to paint the\r\n     dot in the role colour, using public knobs alone */\r\n  color: var(--_mono-radio-accent);\r\n  transition-property: box-shadow, background-color, border-color;\r\n  transition-timing-function: var(--mono-ease);\r\n  transition-duration: var(--mono-duration);\r\n}\r\n\r\n/* focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 */\r\n:where([mono-radio]) > [mono-input]:focus-visible + [mono-circle] {\r\n  border-color: var(--_mono-radio-ring-color);\r\n  --_mono-radio-ring: 0 0 0 var(--_mono-radio-ring-width) color-mix(in oklab, var(--_mono-radio-ring-color) var(--_mono-radio-ring-alpha), transparent);\r\n}\r\n\r\n/* aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20\r\n   (dark: /50, /40 via the mode tokens) */\r\n[mono-radio][mono-invalid] > [mono-circle],\r\n:where([mono-radio]) > [mono-input][aria-invalid=\"true\"] + [mono-circle] {\r\n  border-color: var(--mono-mode-invalid-border);\r\n  --_mono-radio-ring: 0 0 0 var(--_mono-radio-ring-width) var(--mono-mode-invalid-ring);\r\n}\r\n\r\n/* checked:bg-primary checked:border-primary — generalised per hue.\r\n   `--mono-radio-checked-bg` is the flavor slot: sera keeps the circle hollow. */\r\n[mono-radio][mono-checked] > [mono-circle],\r\n:where([mono-radio]) > [mono-input]:checked + [mono-circle] {\r\n  border-color: var(--_mono-radio-accent);\r\n  background-color: var(--mono-radio-checked-bg, var(--_mono-radio-accent));\r\n}\r\n\r\n/* aria-invalid:checked:border-primary — a chosen option is not the error */\r\n[mono-radio][mono-invalid][mono-checked] > [mono-circle],\r\n:where([mono-radio]) > [mono-input][aria-invalid=\"true\"]:checked + [mono-circle] {\r\n  border-color: var(--_mono-radio-accent);\r\n}\r\n\r\n/* =========================================\r\n   The dot — `:checked:before` upstream. The element renders [mono-dot] (it is a\r\n   `cssClass` slot); hand-written markup may leave the circle empty and take the\r\n   pseudo-element instead. Both are out of flow (`inset: 0; margin: auto`) so the\r\n   circle keeps a stable synthesised baseline.\r\n   ========================================= */\r\n\r\n/* basecoat@1.0.2 components/radio.css .field > input[type='radio'], .input[type='radio'] >> &:checked:before\r\n   — absolute top-1/2 left-1/2 content-[''] -translate-x/y-1/2 rounded-full */\r\n/* basecoat@1.0.2 styles/vega.css :is(.field > input[type='radio'], .input[type='radio']):checked:before\r\n   — size-2 bg-primary-foreground (mono: that share of the box, so it tracks every step) */\r\n:where([mono-radio]) > [mono-circle] > [mono-dot],\r\n:where([mono-radio]) > [mono-circle]:not(:has([mono-dot]))::before {\r\n  content: \"\";\r\n  position: absolute;\r\n  inset: 0;\r\n  margin: auto;\r\n  width: var(--_mono-radio-dot);\r\n  height: var(--_mono-radio-dot);\r\n  border-radius: var(--mono-radio-dot-radius, var(--mono-radius-full));\r\n  background-color: var(--_mono-radio-dot-color);\r\n  transform: scale(0);\r\n  opacity: 0;\r\n  transition-property: transform, opacity, background-color;\r\n  transition-timing-function: var(--mono-ease);\r\n  transition-duration: var(--mono-duration);\r\n}\r\n\r\n[mono-radio][mono-checked] > [mono-circle] > [mono-dot],\r\n[mono-radio][mono-checked] > [mono-circle]:not(:has([mono-dot]))::before,\r\n:where([mono-radio]) > [mono-input]:checked + [mono-circle] > [mono-dot],\r\n:where([mono-radio]) > [mono-input]:checked + [mono-circle]:not(:has([mono-dot]))::before {\r\n  transform: scale(1);\r\n  opacity: 1;\r\n}\r\n\r\n@media (prefers-reduced-motion: reduce) {\r\n  :where([mono-radio]) > [mono-circle],\r\n  :where([mono-radio]) > [mono-circle] > [mono-dot],\r\n  :where([mono-radio]) > [mono-circle]::before {\r\n    transition: none;\r\n  }\r\n}\r\n\r\n/* =========================================\r\n   Label\r\n   ========================================= */\r\n\r\n:where([mono-radio]) > [mono-label] {\r\n  min-width: 0;\r\n}\r\n\r\n/* basecoat@1.0.2 styles/vega.css .field > label, .label — text-sm leading-snug font-medium;\r\n   `block` so the first line box is exactly font × line-height */\r\n:where([mono-radio]) [mono-label-text] {\r\n  display: block;\r\n  font-size: var(--_mono-radio-label-font);\r\n  line-height: var(--_mono-radio-label-line-height);\r\n  font-weight: var(--mono-radio-label-font-weight, var(--mono-label-font-weight, var(--mono-font-weight-medium)));\r\n  color: var(--_mono-radio-text);\r\n}\r\n\r\n/* basecoat@1.0.2 styles/vega.css .fieldset legend + p, .field > p, .field section > p\r\n   — text-sm text-muted-foreground leading-normal font-normal; EXTENSION: one step\r\n   under the label per size */\r\n:where([mono-radio]) [mono-description] {\r\n  display: block;\r\n  margin-top: calc(var(--mono-spacing) * 0.5);\r\n  font-size: var(--_mono-radio-description-font);\r\n  line-height: var(--mono-leading-normal);\r\n  font-weight: var(--mono-font-weight-normal);\r\n  color: var(--_mono-radio-description);\r\n}\r\n";
//#endregion
//#region src/components/radio/mono-radio.shadow.ts
var SHADOW_EXTRA_CSS = "";
var MonoRadioShadow = class MonoRadioShadow extends withShadowUtilityStyles(MonoRadioCore(LitElement)) {
	static {
		this.disableWarning?.("change-in-update");
	}
	static {
		this.styles = [unsafeCSS(toShadowCss(radio_default, {
			host: "mono-radio",
			append: SHADOW_EXTRA_CSS
		}))];
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
		super.updated?.(changed);
		if (!isServer) this._scanSlots();
	}
	_slotFor(name) {
		return this.renderRoot.querySelector(`slot[name="${name}"]`);
	}
	_slotHasContent(slot) {
		return !!slot && slot.assignedNodes().some((n) => n.nodeType === Node.ELEMENT_NODE || !!(n.textContent ?? "").trim());
	}
	_onSlotChange(name, event) {
		this._setSlotState(name, name === "description" ? this._sublabelHasContent() : this._slotHasContent(event.target));
	}
	/**
	* The sublabel region answers to `slot="sublabel"` and to the older
	* `slot="description"` (nested inside it), so its presence is the union.
	*/
	_sublabelHasContent() {
		const byName = (n) => this.renderRoot.querySelector(`slot[name="${n}"]`);
		return this._slotHasContent(byName("sublabel")) || this._slotHasContent(byName("description"));
	}
	_setSlotState(name, has) {
		if (name === "label") this._hasLabelSlotState = has;
		else this._hasDescriptionSlotState = has;
	}
	_scanSlots() {
		for (const name of ["label", "description"]) {
			const has = name === "description" ? this._sublabelHasContent() : this._slotHasContent(this._slotFor(name));
			if (has !== (name === "label" ? this._hasLabelSlotState : this._hasDescriptionSlotState)) this._setSlotState(name, has);
		}
	}
	_renderLabelBlock() {
		return html`
      <span
        class=${this._cls("mono-radio-label", "label")}
        mono-label
        ?mono-empty=${!this._hasLabelContent() && !this._hasDescriptionContent()}
      >
        <span
          class=${this._cls("mono-radio-label-text", "labelText")}
          mono-label-text
          ?mono-empty=${!this._hasLabelContent()}
        >
          <slot name="label" @slotchange=${(e) => this._onSlotChange("label", e)}
            >${this.label || nothing}</slot
          >
        </span>

        <span
          class=${this._cls("mono-radio-label-description", "description")}
          mono-description
          ?mono-empty=${!this._hasDescriptionContent()}
        >
          <slot name="sublabel" @slotchange=${(e) => this._onSlotChange("description", e)}
            ><slot
              name="description"
              @slotchange=${(e) => this._onSlotChange("description", e)}
              >${this.sublabel || nothing}</slot
            ></slot
          >
        </span>
      </span>
    `;
	}
};
MonoRadioShadow = __decorate([customElement("mono-shadow-radio")], MonoRadioShadow);
//#endregion
//#region src/components/radio/radio-utils.ts
/**
* Validate radio props
*/
function validateRadioProps(props) {
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
	if (props.size && !validSizes.includes(props.size)) return false;
	if (props.color && !validColors.includes(props.color)) return false;
	return true;
}
/**
* Generate ARIA attributes for accessibility
*/
function generateRadioAttributes(disabled, checked, label) {
	return {
		"aria-disabled": disabled ? "true" : void 0,
		"aria-checked": String(checked),
		"role": "radio",
		"aria-label": label || void 0
	};
}
//#endregion
export { MonoRadioCore, MonoRadioShadow, generateRadioAttributes, validateRadioProps };
