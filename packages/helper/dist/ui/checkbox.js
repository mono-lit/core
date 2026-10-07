import { l as monoHostChildNodes } from "../mono-ui-CPV7rrdo.js";
import { t as customElement } from "../mono-element-B0kP_96P.js";
import { a as defineHybridPropAliases, i as defineHybridPropAlias, r as booleanStringConverter, t as __decorate } from "../decorate-DEXtNagw.js";
import { t as dispatchMonoEvent } from "../mono-event-Bi1qP9uN.js";
import { s as placeSlotNode } from "../light-slots-DW1WgfgT.js";
import { t as MonoFormControlCore } from "../form-control-core-eeRr0zLU.js";
import { LitElement, html, nothing, unsafeCSS } from "lit";
import { property, state } from "lit/decorators.js";
import { ifDefined } from "lit/directives/if-defined.js";
//#region src/components/checkbox/checkbox-core.ts
/**
* `MonoCheckboxCore` — all render-mode-agnostic logic for `mono-checkbox`:
* reactive props (incl. SSR boolean coercion), hybrid aliases, camelCase
* attribute fallbacks, the `modelValue`↔`checked` sync, class computation,
* change interactivity (`mno-change`), `focus`/`blur`, AND the shared `render()`
* skeleton (`<label><input><box></box><labelBlock></label>`). The slot-bearing
* regions are two overridable hooks — `_renderCustomIcon()` / `_renderLabelBlock()`
* — that default to the light build's `[data-mono-slot]` placeholders; the shadow
* build overrides them with native `<slot>` (mirrors `mono-accordion`).
*
* SSR-safe: no `document`/`window` access; `focus`/`blur` query `this.renderRoot`.
*/
var MonoCheckboxCore = (superClass) => {
	class MonoCheckboxCoreClass extends MonoFormControlCore(superClass) {
		constructor(...args) {
			super(...args);
			this.size = "md";
			this.color = "primary";
			this.modelValue = false;
			this.checked = false;
			this.disabled = false;
			this.indeterminate = false;
			this.loading = false;
			this.label = "";
			this.sublabel = "";
			this.value = "";
			this.name = "";
			this.cssClass = {};
			this.cssClassName = "";
			this._hasIcon = false;
			this._hasIndeterminateIcon = false;
			this._hasLabelSlotState = false;
			this._hasDescriptionSlotState = false;
			defineHybridPropAliases(this, [
				"modelValue",
				"ariaLabelText",
				"cssClass"
			]);
			defineHybridPropAlias(this, "description", "sublabel");
		}
		static get observedAttributes() {
			return [
				...super.observedAttributes ?? [],
				"modelvalue",
				"arialabeltext",
				"description",
				"css-class",
				"cssclass"
			];
		}
		attributeChangedCallback(name, oldValue, newValue) {
			super.attributeChangedCallback(name, oldValue, newValue);
			if (oldValue === newValue) return;
			if (name === "modelvalue") {
				this.modelValue = this._toBoolean(newValue);
				return;
			}
			if (name === "arialabeltext") {
				this.ariaLabelText = newValue ?? void 0;
				return;
			}
			if (name === "description") {
				this.sublabel = newValue ?? "";
				return;
			}
			if (name === "css-class" || name === "cssclass") this.cssClassName = newValue ?? "";
		}
		willUpdate(changed) {
			for (const key of [
				"modelValue",
				"checked",
				"disabled",
				"indeterminate"
			]) if (typeof this[key] === "string") this[key] = this._toBoolean(this[key]);
			if (changed.has("modelValue") && this.checked !== this.modelValue) this.checked = this.modelValue;
			if (changed.has("checked") && this.modelValue !== this.checked) this.modelValue = this.checked;
			super.willUpdate?.(changed);
		}
		_toBoolean(value) {
			if (typeof value === "boolean") return value;
			if (typeof value === "string") {
				const normalized = value.toLowerCase().trim();
				return normalized === "" || normalized === "true";
			}
			return Boolean(value);
		}
		_cls(base, key) {
			const extra = this.cssClass?.[key];
			return extra ? `${base} ${extra}` : base;
		}
		get _wrapperClasses() {
			return [
				"mono-checkbox",
				this.size,
				this.color,
				this.disabled ? "disabled" : "",
				this.checked ? "mono-checkbox-checked" : "",
				this.indeterminate ? "mono-checkbox-indeterminate" : "",
				this.cssClassName,
				this.cssClass?.root
			].filter(Boolean).join(" ");
		}
		get _inputClasses() {
			return this._cls("mono-checkbox-input", "input");
		}
		get _boxClasses() {
			return [
				this._cls("mono-checkbox-box", "box"),
				this.size,
				this._hasIcon || this.loading ? "has-custom-icon" : "",
				this._hasIndeterminateIcon || this.loading ? "has-custom-indeterminate-icon" : ""
			].filter(Boolean).join(" ");
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
				checked: args.modelValue,
				value: this.value,
				name: this.name,
				sourceEvent: args.sourceEvent
			};
		}
		_emitChange(detail) {
			dispatchMonoEvent(this, "change", detail);
		}
		_handleChange(event) {
			if (this.disabled) return;
			const input = event.currentTarget;
			const oldValue = this.modelValue;
			const nextValue = input.checked;
			if (this.indeterminate) this.indeterminate = false;
			this.checked = nextValue;
			this.modelValue = nextValue;
			const detail = this._createModelDetail({
				modelValue: nextValue,
				oldValue,
				sourceEvent: event
			});
			this._emitChange(detail);
		}
		/**
		* The `loading` spinner, shown in place of the tick/dash. Light uses the global
		* icon utility class; the shadow build overrides this with inline SVG, which
		* page-level CSS cannot reach.
		*/
		_renderLoadingIcon() {
			return html`<span class="mono-icon i-mdi-loading mono-checkbox-spinner" mono-spinner aria-hidden="true"></span>`;
		}
		/** Light-DOM custom icon (data-mono-slot). Shadow build overrides with `<slot>`. */
		_renderCustomIcon() {
			if (this.indeterminate && this._hasIndeterminateIcon) return html`
          <span
            class=${[this._cls("mono-checkbox-indeterminate-icon", "indeterminateIcon"), this.size].filter(Boolean).join(" ")}
            mono-indeterminate-icon
            data-mono-slot="indeterminate-icon"
          ></span>
        `;
			if (this.checked && this._hasIcon) return html`
          <span
            class=${[this._cls("mono-checkbox-icon", "icon"), this.size].filter(Boolean).join(" ")}
            mono-icon
            data-mono-slot="icon"
          ></span>
        `;
			return nothing;
		}
		/** Light-DOM label block (data-mono-slot). Shadow build overrides with `<slot>`. */
		_renderLabelBlock() {
			if (!this._hasLabelContent() && !this._hasDescriptionContent()) return nothing;
			return html`
        <span class=${this._cls("mono-checkbox-label", "label")} mono-label>
          ${this._hasLabelContent() ? html`
                <span class=${this._cls("mono-checkbox-label-text", "labelText")} mono-label-text>
                  ${this._hasLabelSlotState ? html`<span data-mono-slot="label"></span>` : this.label}
                </span>
              ` : nothing}

          ${this._hasDescriptionContent() ? html`
                <span class=${this._cls("mono-checkbox-label-description", "description")} mono-description>
                  ${this._hasDescriptionSlotState ? html`<span data-mono-slot="description"></span>` : this.sublabel}
                </span>
              ` : nothing}
        </span>
      `;
		}
		render() {
			const ariaLabel = this.ariaLabelText || this.label || (this._hasLabelSlotState ? "Checkbox" : void 0);
			return html`
        <label
          class=${this._wrapperClasses}
          mono-checkbox
          mono-size=${this.size === "md" ? nothing : this.size}
          mono-color=${this.color === "primary" ? nothing : this.color}
          ?mono-checked=${this.checked}
          ?mono-indeterminate=${this.indeterminate}
          ?mono-disabled=${this.disabled}
          ?mono-loading=${this.loading}
        >
          <input
            class=${this._inputClasses}
            mono-input
            type="checkbox"
            .checked=${this.checked}
            .indeterminate=${this.indeterminate}
            .value=${this.value}
            name=${ifDefined(this.name || void 0)}
            ?disabled=${this.disabled || this.loading}
            aria-checked=${this.indeterminate ? "mixed" : String(this.checked)}
            aria-label=${ifDefined(ariaLabel)}
            aria-busy=${this.loading ? "true" : "false"}
            @change=${this._handleChange}
          />

          <span
            class=${this._boxClasses}
            mono-box
            ?mono-custom-icon=${this._hasIcon || this.loading}
            ?mono-custom-indeterminate-icon=${this._hasIndeterminateIcon || this.loading}
            aria-hidden="true"
          >
            ${this.loading ? this._renderLoadingIcon() : this._renderCustomIcon()}
          </span>

          ${this._renderLabelBlock()}
        </label>
      `;
		}
		focus(options) {
			this.renderRoot.querySelector(".mono-checkbox-input")?.focus(options);
		}
		blur() {
			this.renderRoot.querySelector(".mono-checkbox-input")?.blur();
		}
	}
	__decorate([property({ type: String })], MonoCheckboxCoreClass.prototype, "size", void 0);
	__decorate([property({ type: String })], MonoCheckboxCoreClass.prototype, "color", void 0);
	__decorate([property({
		attribute: "model-value",
		reflect: true,
		converter: booleanStringConverter
	})], MonoCheckboxCoreClass.prototype, "modelValue", void 0);
	__decorate([property({
		reflect: true,
		converter: booleanStringConverter
	})], MonoCheckboxCoreClass.prototype, "checked", void 0);
	__decorate([property({
		reflect: true,
		converter: booleanStringConverter
	})], MonoCheckboxCoreClass.prototype, "disabled", void 0);
	__decorate([property({
		reflect: true,
		converter: booleanStringConverter
	})], MonoCheckboxCoreClass.prototype, "indeterminate", void 0);
	__decorate([property({
		reflect: true,
		converter: booleanStringConverter
	})], MonoCheckboxCoreClass.prototype, "loading", void 0);
	__decorate([property({ type: String })], MonoCheckboxCoreClass.prototype, "label", void 0);
	__decorate([property({ type: String })], MonoCheckboxCoreClass.prototype, "sublabel", void 0);
	__decorate([property({ type: String })], MonoCheckboxCoreClass.prototype, "value", void 0);
	__decorate([property({ type: String })], MonoCheckboxCoreClass.prototype, "name", void 0);
	__decorate([property({
		type: String,
		attribute: "aria-label"
	})], MonoCheckboxCoreClass.prototype, "ariaLabelText", void 0);
	__decorate([property({ attribute: false })], MonoCheckboxCoreClass.prototype, "cssClass", void 0);
	__decorate([property({
		type: String,
		attribute: "css-class"
	})], MonoCheckboxCoreClass.prototype, "cssClassName", void 0);
	__decorate([state()], MonoCheckboxCoreClass.prototype, "_hasIcon", void 0);
	__decorate([state()], MonoCheckboxCoreClass.prototype, "_hasIndeterminateIcon", void 0);
	__decorate([state()], MonoCheckboxCoreClass.prototype, "_hasLabelSlotState", void 0);
	__decorate([state()], MonoCheckboxCoreClass.prototype, "_hasDescriptionSlotState", void 0);
	return MonoCheckboxCoreClass;
};
//#endregion
//#region src/components/checkbox/checkbox.css?raw
var checkbox_default = "/* =========================================================================\r\n   mono-checkbox — a port of Basecoat's `.input[type='checkbox']` and the\r\n   `.label` beside it (basecoat-css@1.0.2, vega style).\r\n\r\n   Styled by ATTRIBUTE, like Basecoat — and the attributes mirror the element's\r\n   props one for one, so hand-written markup reads like the Lit / Vue tag:\r\n\r\n     <mono-checkbox size=\"sm\" color=\"danger\" label=\"Agree\" model-value>\r\n     <label mono-checkbox mono-size=\"sm\" mono-color=\"danger\">\r\n       <input mono-input type=\"checkbox\" checked />\r\n       <span mono-box aria-hidden=\"true\"></span>\r\n       <span mono-label><span mono-label-text>Agree</span></span>\r\n     </label>\r\n\r\n   An absent attribute is the prop's default (`:not([mono-size])` = md,\r\n   `:not([mono-color])` = primary). The element renders these attributes on its\r\n   root <label> (both builds) plus the STATES `mono-checked` / `mono-indeterminate`\r\n   / `mono-loading`; hand-written markup may rely on the native input's `:checked`\r\n   / `:indeterminate` instead — every state rule reads both. The old classes\r\n   (`.mono-checkbox.sm.mono-checkbox-checked`) are still emitted as inert hooks\r\n   until 2.0 but no rule here reads them.\r\n\r\n   Selector map (ours ≡ upstream):\r\n     [mono-checkbox]                               ≡ .label (flex gap-2 text-sm font-medium leading-snug select-none)\r\n     :where([mono-checkbox]) > [mono-box]                  ≡ .input[type='checkbox'] (size-4 rounded-[4px] border-input shadow-xs; the real input is visually hidden)\r\n     [mono-checked] / [mono-input]:checked         ≡ :checked (bg-primary border-primary text-primary-foreground + the --check-icon mask)\r\n     [mono-indeterminate] / :indeterminate         ≡ EXTENSION (the same fill, a dash instead of the check)\r\n     [mono-input]:focus-visible + [mono-box]       ≡ focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50\r\n     [mono-invalid] / [mono-input][aria-invalid]   ≡ aria-invalid:border-destructive aria-invalid:ring-destructive/20\r\n     [mono-disabled] / [mono-input]:disabled       ≡ disabled:opacity-50 cursor-not-allowed\r\n     [mono-label-text]                             ≡ .label text\r\n     [mono-description]                            ≡ .field > p (text-sm text-muted-foreground)\r\n     [mono-size=\"xs|sm|lg|xl|xxl\"]                 ≡ EXTENSION — the box is 4/9 of the --mono-control-height-* step\r\n                                                     (16px at vega md), label / description / gap step with it\r\n     [mono-color=\"…\"]                              ≡ EXTENSION (the checked fill in the role's colour)\r\n     [mono-loading]                                ≡ EXTENSION (a spinner on the accent-filled box)\r\n\r\n   Specificity contract (same as the pre-port class sheet): a part's RESTING rule is\r\n   exactly one attribute strong — `:where([mono-checkbox]) [mono-box]` = (0,1,0) —\r\n   so a utility class handed in through `cssClass` (`rounded-3`, `font-800`, …)\r\n   wins by source order, while state rules (checked / indeterminate / focus /\r\n   invalid / disabled, keyed on the root or the native input) stay heavier and\r\n   win over it, as they always did.\r\n\r\n   Inner parts: [mono-input], [mono-box] (+ [mono-custom-icon] / [mono-custom-\r\n   indeterminate-icon] when a custom glyph replaces the default), [mono-icon] /\r\n   [mono-indeterminate-icon] (the custom glyph wrappers), [mono-spinner],\r\n   [mono-label] > [mono-label-text] / [mono-description]. The shadow build marks\r\n   an unassigned slot wrapper [mono-empty].\r\n\r\n   The box sits on the label's CAP BAND (see `--_mono-checkbox-line-offset`):\r\n   mono's own alignment rule, kept — Basecoat centres a lone checkbox on its\r\n   line box with `items-center`, which is the same thing for a one-line label and\r\n   drifts for a described one.\r\n\r\n   FLAVORS set `--mono-checkbox-{radius,shadow,ring-width,ring-alpha,bg,border-color}`\r\n   (the per-style `.input[type='checkbox']` deltas); every fallback here is vega's\r\n   value (`node scripts/basecoat-styles.mjs --varying \"input\\[type='checkbox'\\]\"`).\r\n   ========================================================================= */\r\n\r\nmono-checkbox {\r\n  display: inline-block;\r\n}\r\n\r\n[mono-checkbox] {\r\n  /* ── palette: each slot is a public knob over a Basecoat token ─────────── */\r\n  --_mono-checkbox-text: var(--mono-checkbox-text, var(--foreground));\r\n  --_mono-checkbox-description: var(--mono-checkbox-description, var(--muted-foreground));\r\n  --_mono-checkbox-primary: var(--mono-checkbox-primary, var(--primary));\r\n  --_mono-checkbox-primary-foreground: var(--mono-checkbox-primary-foreground, var(--primary-foreground));\r\n  --_mono-checkbox-accent: var(--mono-checkbox-accent, var(--_mono-checkbox-accent-preset, var(--_mono-checkbox-primary)));\r\n  --_mono-checkbox-icon: var(--mono-checkbox-icon, var(--_mono-checkbox-icon-preset, var(--_mono-checkbox-primary-foreground)));\r\n  --_mono-checkbox-border-color: var(--mono-checkbox-border, var(--mono-checkbox-border-color, var(--input)));\r\n  --_mono-checkbox-bg: var(--mono-checkbox-bg, var(--mono-mode-surface));\r\n  --_mono-checkbox-shadow: var(--mono-checkbox-shadow, var(--mono-shadow-xs));\r\n  --_mono-checkbox-radius: var(--mono-checkbox-radius, 4px);\r\n  --_mono-checkbox-border-width: var(--mono-checkbox-border-width, var(--mono-border-width));\r\n  --_mono-checkbox-ring-color: var(--mono-checkbox-ring-color, var(--ring));\r\n  --_mono-checkbox-ring-width: var(--mono-checkbox-ring-width, var(--mono-ring-width));\r\n  --_mono-checkbox-ring-alpha: var(--mono-checkbox-ring-alpha, var(--mono-ring-alpha));\r\n\r\n  /* ── md metrics live on the unqualified root ON PURPOSE ────────────────────\r\n     basecoat@1.0.2 styles/vega.css .input[type='checkbox'] — size-4 (= 4/9 of the\r\n     h-9 control); .field > label, .label — gap-2 text-sm leading-snug */\r\n  --_mono-checkbox-control: var(--mono-checkbox-size-md, calc(var(--mono-control-height-md) * 4 / 9));\r\n  --_mono-checkbox-gap: var(--mono-checkbox-gap, var(--mono-checkbox-gap-md, calc(var(--mono-spacing) * 2)));\r\n  --_mono-checkbox-label-font: var(--mono-checkbox-label-font-md, var(--mono-text-sm));\r\n  --_mono-checkbox-description-font: var(--mono-checkbox-description-font-md, 0.8125rem);\r\n  --_mono-checkbox-glyph: var(--mono-checkbox-glyph, 87.5%);\r\n\r\n  /* ── whole pixels ────────────────────────────────────────────────────────\r\n     The box is a ratio of the control step, so it lands on a fraction (18.39px,\r\n     17.77px…). A fractional round shape is antialiased on every edge — the\r\n     switch thumb, which parks flush against the track's cap, picked up a dark\r\n     rim that changed with the flavor and the screen's pixel ratio. Snap the\r\n     derived size to 1px; `round()` has the same browser floor as `color-mix()`\r\n     and `:has()`, which this sheet already requires. Snapping happens HERE, at\r\n     one place per value, so the per-size blocks stay plain arithmetic. */\r\n  --_mono-checkbox-control-px: round(nearest, var(--_mono-checkbox-control), 1px);\r\n\r\n  /* ── alignment with the label ────────────────────────────────────────────\r\n     The box is centred on the label's CAP BAND — the ink the eye reads, not the\r\n     line box. `-optical-shift` is the measured correction (the line box carries\r\n     descender space the capitals never fill); `-optical-nudge` absorbs the\r\n     whole-pixel rounding of a font's ascent per size. See the pairing spec. */\r\n  --_mono-checkbox-label-line-height: var(--mono-checkbox-label-line-height, var(--mono-leading-snug));\r\n  --_mono-checkbox-optical-shift: 0.045;\r\n  --_mono-checkbox-optical-nudge: 0px;\r\n  --_mono-checkbox-line-offset: calc(\r\n    (var(--_mono-checkbox-label-font) * var(--_mono-checkbox-label-line-height) - var(--_mono-checkbox-control-px)) / 2 +\r\n      var(--_mono-checkbox-label-font) * var(--_mono-checkbox-optical-shift) + var(--_mono-checkbox-optical-nudge)\r\n  );\r\n\r\n  /* The element build nests this root inside its host, so it is never itself a\r\n     grid or flex item and shrink-wraps its content. Hand-written markup usually\r\n     IS the item (a radio in a `display: grid` list), and an item blockifies —\r\n     `inline-flex` becomes `flex` and the row stretches to the widest sibling,\r\n     wrapping its label at a different point than the element's. `fit-content`\r\n     keeps both shapes shrink-wrapped; a consumer who wants a full-width row\r\n     still sets a width. */\r\n  width: fit-content;\r\n  display: inline-flex;\r\n  align-items: flex-start;\r\n  gap: var(--_mono-checkbox-gap);\r\n  position: relative;\r\n  vertical-align: top;\r\n  cursor: pointer;\r\n  user-select: none;\r\n  font-family: inherit;\r\n  color: var(--_mono-checkbox-text);\r\n}\r\n\r\n[mono-checkbox],\r\n:where([mono-checkbox]) *,\r\n:where([mono-checkbox]) *::before,\r\n:where([mono-checkbox]) *::after {\r\n  box-sizing: border-box;\r\n}\r\n\r\n:where([mono-checkbox]) :is([mono-label], [mono-label-text], [mono-description])[mono-empty] {\r\n  display: none;\r\n}\r\n\r\n/* the box seats on the first line of a label that is actually there; a bare\r\n   box (what mono-table-checkbox emits) stays flush at the top */\r\n[mono-checkbox]:has([mono-label-text]:not([mono-empty])) > [mono-box] {\r\n  margin-top: var(--_mono-checkbox-line-offset, 0px);\r\n}\r\n\r\n/* =========================================\r\n   Sizes — EXTENSION: the box is 4/9 of the control step (vega md: 36 × 4/9 = 16px),\r\n   label, description and gap step with it (md = Basecoat's text-sm / gap-2)\r\n   ========================================= */\r\n\r\n[mono-checkbox][mono-size=\"xs\"] {\r\n  --_mono-checkbox-control: var(--mono-checkbox-size-xs, calc(var(--mono-control-height-xs) * 4 / 9));\r\n  --_mono-checkbox-gap: var(--mono-checkbox-gap, var(--mono-checkbox-gap-xs, calc(var(--mono-spacing) * 1.25)));\r\n  --_mono-checkbox-label-font: var(--mono-checkbox-label-font-xs, var(--mono-text-xs));\r\n  --_mono-checkbox-description-font: var(--mono-checkbox-description-font-xs, 0.6875rem);\r\n}\r\n\r\n[mono-checkbox][mono-size=\"sm\"] {\r\n  --_mono-checkbox-control: var(--mono-checkbox-size-sm, calc(var(--mono-control-height-sm) * 4 / 9));\r\n  --_mono-checkbox-gap: var(--mono-checkbox-gap, var(--mono-checkbox-gap-sm, calc(var(--mono-spacing) * 1.5)));\r\n  --_mono-checkbox-label-font: var(--mono-checkbox-label-font-sm, 0.8125rem);\r\n  --_mono-checkbox-description-font: var(--mono-checkbox-description-font-sm, var(--mono-text-xs));\r\n}\r\n\r\n[mono-checkbox][mono-size=\"lg\"] {\r\n  --_mono-checkbox-control: var(--mono-checkbox-size-lg, calc(var(--mono-control-height-lg) * 4 / 9));\r\n  --_mono-checkbox-gap: var(--mono-checkbox-gap, var(--mono-checkbox-gap-lg, calc(var(--mono-spacing) * 2.5)));\r\n  --_mono-checkbox-label-font: var(--mono-checkbox-label-font-lg, var(--mono-text-base));\r\n  --_mono-checkbox-description-font: var(--mono-checkbox-description-font-lg, var(--mono-text-sm));\r\n  /* 16px text rounds its ascent such that the box lands ~0.35px low */\r\n  --_mono-checkbox-optical-nudge: -0.35px;\r\n}\r\n\r\n[mono-checkbox][mono-size=\"xl\"] {\r\n  --_mono-checkbox-control: var(--mono-checkbox-size-xl, calc(var(--mono-control-height-xl) * 4 / 9));\r\n  --_mono-checkbox-gap: var(--mono-checkbox-gap, var(--mono-checkbox-gap-xl, calc(var(--mono-spacing) * 3)));\r\n  --_mono-checkbox-label-font: var(--mono-checkbox-label-font-xl, var(--mono-text-lg));\r\n  --_mono-checkbox-description-font: var(--mono-checkbox-description-font-xl, var(--mono-text-base));\r\n}\r\n\r\n[mono-checkbox][mono-size=\"xxl\"] {\r\n  --_mono-checkbox-control: var(--mono-checkbox-size-xxl, calc(var(--mono-control-height-xxl) * 4 / 9));\r\n  --_mono-checkbox-gap: var(--mono-checkbox-gap, var(--mono-checkbox-gap-xxl, calc(var(--mono-spacing) * 3.5)));\r\n  --_mono-checkbox-label-font: var(--mono-checkbox-label-font-xxl, var(--mono-text-xl));\r\n  --_mono-checkbox-description-font: var(--mono-checkbox-description-font-xxl, var(--mono-text-lg));\r\n  /* 20px text rounds the other way, leaving the box ~1.1px high */\r\n  --_mono-checkbox-optical-nudge: 1.1px;\r\n}\r\n\r\n/* =========================================\r\n   Colours — EXTENSION: the checked fill in the role's colour\r\n   ========================================= */\r\n\r\n[mono-checkbox]:is(:not([mono-color]), [mono-color=\"primary\"]) {\r\n  --_mono-checkbox-accent-preset: var(--_mono-checkbox-primary);\r\n  --_mono-checkbox-icon-preset: var(--_mono-checkbox-primary-foreground);\r\n}\r\n[mono-checkbox][mono-color=\"secondary\"] {\r\n  --_mono-checkbox-accent-preset: var(--secondary-foreground);\r\n  --_mono-checkbox-icon-preset: var(--secondary);\r\n}\r\n[mono-checkbox][mono-color=\"success\"] {\r\n  --_mono-checkbox-accent-preset: var(--success);\r\n  --_mono-checkbox-icon-preset: var(--success-foreground);\r\n}\r\n[mono-checkbox][mono-color=\"danger\"] {\r\n  --_mono-checkbox-accent-preset: var(--destructive);\r\n  --_mono-checkbox-icon-preset: var(--destructive-foreground);\r\n}\r\n[mono-checkbox][mono-color=\"warning\"] {\r\n  --_mono-checkbox-accent-preset: var(--warning);\r\n  --_mono-checkbox-icon-preset: var(--warning-foreground);\r\n}\r\n[mono-checkbox][mono-color=\"info\"] {\r\n  --_mono-checkbox-accent-preset: var(--info);\r\n  --_mono-checkbox-icon-preset: var(--info-foreground);\r\n}\r\n[mono-checkbox][mono-color=\"teal\"] {\r\n  --_mono-checkbox-accent-preset: var(--teal);\r\n  --_mono-checkbox-icon-preset: var(--teal-foreground);\r\n}\r\n[mono-checkbox][mono-color=\"purple\"] {\r\n  --_mono-checkbox-accent-preset: var(--purple);\r\n  --_mono-checkbox-icon-preset: var(--purple-foreground);\r\n}\r\n[mono-checkbox][mono-color=\"neutral\"] {\r\n  --_mono-checkbox-accent-preset: var(--neutral);\r\n  --_mono-checkbox-icon-preset: var(--neutral-foreground);\r\n}\r\n[mono-checkbox][mono-color=\"dark\"] {\r\n  --_mono-checkbox-accent-preset: var(--dark);\r\n  --_mono-checkbox-icon-preset: var(--dark-foreground);\r\n}\r\n\r\n/* =========================================\r\n   States on the root\r\n   ========================================= */\r\n\r\n/* basecoat@1.0.2 styles/vega.css .field > label, .label — in-data-[disabled=true]:opacity-50\r\n   A BUSY box is exempt: while a select-all drains the server every box on the grid\r\n   is disabled, but the one spinning was acted on — it reads as \"working\", never\r\n   \"unavailable\" */\r\n[mono-checkbox][mono-disabled]:not([mono-loading]),\r\n[mono-checkbox]:not([mono-loading]):has(> [mono-input]:disabled) {\r\n  cursor: not-allowed;\r\n  opacity: 0.5;\r\n  pointer-events: none;\r\n}\r\n\r\n[mono-checkbox][mono-loading] {\r\n  cursor: progress;\r\n}\r\n\r\n/* the native input is the accessible control; the box is its painted twin */\r\n:where([mono-checkbox]) [mono-input] {\r\n  position: absolute;\r\n  opacity: 0;\r\n  pointer-events: none;\r\n  width: 1px;\r\n  height: 1px;\r\n  margin: 0;\r\n  /* the UA gives an <input> its own font; inside a shadow root nothing resets it,\r\n     so the hidden control ended up with a different computed font in the two\r\n     builds. It paints nothing either way — this just keeps them identical. */\r\n  font: inherit;\r\n  color: inherit;\r\n}\r\n\r\n/* =========================================\r\n   The box\r\n   ========================================= */\r\n\r\n/* basecoat@1.0.2 components/checkbox.css .field > input[type='checkbox']:not([role='switch']), .input[type='checkbox']:not([role='switch'])\r\n   — relative shrink-0 appearance-none outline-none */\r\n/* basecoat@1.0.2 styles/vega.css .field > input[type='checkbox']:not([role='switch']), .input[type='checkbox']:not([role='switch'])\r\n   — flex size-4 items-center justify-center rounded-[4px] border border-input\r\n   shadow-xs transition-shadow (dark:bg-input/30 via --mono-mode-surface);\r\n   checked:bg-primary checked:border-primary checked:text-primary-foreground;\r\n   mono: `--tw-ring-*` flattened to the ring + shadow slots */\r\n:where([mono-checkbox]) > [mono-box] {\r\n  --_mono-checkbox-ring: 0 0 #0000;\r\n  position: relative;\r\n  flex: 0 0 auto;\r\n  display: inline-flex;\r\n  align-items: center;\r\n  justify-content: center;\r\n  width: var(--_mono-checkbox-control-px);\r\n  height: var(--_mono-checkbox-control-px);\r\n  border: var(--_mono-checkbox-border-width) solid var(--_mono-checkbox-border-color);\r\n  border-radius: var(--_mono-checkbox-radius);\r\n  background-color: var(--_mono-checkbox-bg);\r\n  box-shadow: var(--_mono-checkbox-ring), var(--_mono-checkbox-shadow);\r\n  color: var(--_mono-checkbox-icon);\r\n  overflow: hidden;\r\n  transition-property: box-shadow, background-color, border-color;\r\n  transition-timing-function: var(--mono-ease);\r\n  transition-duration: var(--mono-duration);\r\n}\r\n\r\n/* focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 */\r\n:where([mono-checkbox]) > [mono-input]:focus-visible + [mono-box] {\r\n  border-color: var(--_mono-checkbox-ring-color);\r\n  --_mono-checkbox-ring: 0 0 0 var(--_mono-checkbox-ring-width) color-mix(in oklab, var(--_mono-checkbox-ring-color) var(--_mono-checkbox-ring-alpha), transparent);\r\n}\r\n\r\n/* aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20\r\n   (dark: /50, /40 via the mode tokens); aria-invalid:checked:border-primary */\r\n[mono-checkbox][mono-invalid] > [mono-box],\r\n:where([mono-checkbox]) > [mono-input][aria-invalid=\"true\"] + [mono-box] {\r\n  border-color: var(--mono-mode-invalid-border);\r\n  --_mono-checkbox-ring: 0 0 0 var(--_mono-checkbox-ring-width) var(--mono-mode-invalid-ring);\r\n}\r\n\r\n/* checked:bg-primary checked:border-primary checked:text-primary-foreground —\r\n   generalised per hue; indeterminate takes the same fill */\r\n[mono-checkbox]:is([mono-checked], [mono-indeterminate]) > [mono-box],\r\n:where([mono-checkbox]) > [mono-input]:is(:checked, :indeterminate) + [mono-box] {\r\n  border-color: var(--_mono-checkbox-accent);\r\n  background-color: var(--_mono-checkbox-accent);\r\n  color: var(--_mono-checkbox-icon);\r\n}\r\n\r\n/* =========================================\r\n   Glyphs — every glyph is out of flow (`inset: 0; margin: auto`) so the box keeps\r\n   a stable synthesised baseline whichever one is showing\r\n   ========================================= */\r\n\r\n/* basecoat@1.0.2 components/checkbox.css .field > input[type='checkbox']:not([role='switch']), .input[type='checkbox']:not([role='switch'])\r\n   — checked:after: block bg-current, mask-image var(--check-icon), mask-size 0.875rem\r\n   (= 87.5% of the 16px box; mono sizes it as that share so it tracks every step) */\r\n:where([mono-checkbox]) > [mono-box]::before {\r\n  content: \"\";\r\n  display: none;\r\n  position: absolute;\r\n  inset: 0;\r\n  margin: auto;\r\n  width: var(--_mono-checkbox-glyph);\r\n  height: var(--_mono-checkbox-glyph);\r\n  background-color: currentColor;\r\n  pointer-events: none;\r\n  mask-image: var(--mono-checkbox-check-icon, var(--check-icon));\r\n  mask-repeat: no-repeat;\r\n  mask-position: center;\r\n  mask-size: contain;\r\n  -webkit-mask-image: var(--mono-checkbox-check-icon, var(--check-icon));\r\n  -webkit-mask-repeat: no-repeat;\r\n  -webkit-mask-position: center;\r\n  -webkit-mask-size: contain;\r\n}\r\n\r\n/* EXTENSION — the indeterminate dash: 60% wide, 14% tall (2px at md), pill-shaped */\r\n:where([mono-checkbox]) > [mono-box]::after {\r\n  content: \"\";\r\n  display: none;\r\n  position: absolute;\r\n  inset: 0;\r\n  margin: auto;\r\n  width: 60%;\r\n  height: max(1.5px, 14%);\r\n  border-radius: 999px;\r\n  background-color: currentColor;\r\n  pointer-events: none;\r\n}\r\n\r\n[mono-checkbox][mono-checked]:not([mono-indeterminate]) > [mono-box]:not([mono-custom-icon])::before,\r\n:where([mono-checkbox]) > [mono-input]:checked:not(:indeterminate) + [mono-box]:not([mono-custom-icon])::before {\r\n  display: block;\r\n}\r\n\r\n[mono-checkbox][mono-indeterminate] > [mono-box]:not([mono-custom-indeterminate-icon])::after,\r\n:where([mono-checkbox]) > [mono-input]:indeterminate + [mono-box]:not([mono-custom-indeterminate-icon])::after {\r\n  display: block;\r\n}\r\n\r\n/* a custom glyph replaces the default one (the box is marked, or holds the wrapper) */\r\n:where([mono-checkbox]) > [mono-box]:has([mono-icon])::before,\r\n:where([mono-checkbox]) > [mono-box]:has([mono-indeterminate-icon])::after {\r\n  display: none !important;\r\n}\r\n\r\n/* custom icon wrappers — fill the box's inner area, out of flow like the pseudo-glyphs */\r\n:where([mono-checkbox]) [mono-icon],\r\n:where([mono-checkbox]) [mono-indeterminate-icon] {\r\n  display: none;\r\n  position: absolute;\r\n  inset: 0;\r\n  margin: auto;\r\n  width: 100%;\r\n  height: 100%;\r\n  color: var(--_mono-checkbox-icon);\r\n  pointer-events: none;\r\n}\r\n\r\n:where([mono-checkbox]) [mono-icon] > *,\r\n:where([mono-checkbox]) [mono-indeterminate-icon] > * {\r\n  display: block;\r\n  width: 100%;\r\n  height: 100%;\r\n}\r\n\r\n[mono-checkbox][mono-checked]:not([mono-indeterminate]) [mono-icon],\r\n:where([mono-checkbox]) > [mono-input]:checked:not(:indeterminate) + [mono-box] [mono-icon],\r\n[mono-checkbox][mono-indeterminate] [mono-indeterminate-icon],\r\n:where([mono-checkbox]) > [mono-input]:indeterminate + [mono-box] [mono-indeterminate-icon] {\r\n  display: inline-block;\r\n}\r\n\r\n/* the shadow build projects the custom glyph through a bare <slot> */\r\n:where([mono-checkbox]) > [mono-box] > slot[name=\"icon\"],\r\n:where([mono-checkbox]) > [mono-box] > slot[name=\"indeterminate-icon\"] {\r\n  display: inline-flex;\r\n  align-items: center;\r\n  justify-content: center;\r\n  position: absolute;\r\n  inset: 0;\r\n  width: 100%;\r\n  height: 100%;\r\n}\r\n\r\n:where([mono-checkbox]) > [mono-box] > slot[name=\"icon\"]::slotted(*),\r\n:where([mono-checkbox]) > [mono-box] > slot[name=\"indeterminate-icon\"]::slotted(*) {\r\n  display: block;\r\n  width: 100%;\r\n  height: 100%;\r\n  color: var(--_mono-checkbox-icon);\r\n  pointer-events: none;\r\n}\r\n\r\n/* =========================================\r\n   Label\r\n   ========================================= */\r\n\r\n:where([mono-checkbox]) > [mono-label] {\r\n  min-width: 0;\r\n}\r\n\r\n/* basecoat@1.0.2 styles/vega.css .field > label, .label — text-sm leading-snug font-medium;\r\n   `block` so the first line box is exactly font × line-height */\r\n:where([mono-checkbox]) [mono-label-text] {\r\n  display: block;\r\n  font-size: var(--_mono-checkbox-label-font);\r\n  line-height: var(--_mono-checkbox-label-line-height);\r\n  font-weight: var(--mono-checkbox-label-font-weight, var(--mono-label-font-weight, var(--mono-font-weight-medium)));\r\n  color: var(--_mono-checkbox-text);\r\n}\r\n\r\n/* basecoat@1.0.2 styles/vega.css .fieldset legend + p, .field > p, .field section > p\r\n   — text-sm text-muted-foreground leading-normal font-normal; EXTENSION: one step\r\n   under the label per size */\r\n:where([mono-checkbox]) [mono-description] {\r\n  display: block;\r\n  margin-top: calc(var(--mono-spacing) * 0.5);\r\n  font-size: var(--_mono-checkbox-description-font);\r\n  line-height: var(--mono-leading-normal);\r\n  font-weight: var(--mono-font-weight-normal);\r\n  color: var(--_mono-checkbox-description);\r\n}\r\n\r\n/* =========================================\r\n   Loading — EXTENSION: a spinner in the box (the select-all drain of\r\n   mono-table-checkbox and mono-tag-input). THE ONLY copy of this look: the two\r\n   hosts emit [mono-checkbox][mono-loading] > [mono-box] > [mono-spinner] and\r\n   restate nothing.\r\n   ========================================= */\r\n\r\n/* the busy box fills with the accent whatever its checked state, so the spinner\r\n   always has the accent behind it and the icon colour in front — never white on\r\n   white; no transition, the state may last 200ms */\r\n[mono-checkbox][mono-loading] > [mono-box] {\r\n  border-color: var(--_mono-checkbox-accent);\r\n  background-color: var(--_mono-checkbox-accent);\r\n  color: var(--_mono-checkbox-icon);\r\n  transition: none;\r\n}\r\n\r\n:where([mono-checkbox]) [mono-spinner] {\r\n  display: block;\r\n  width: 82%;\r\n  height: 82%;\r\n  animation: mono-checkbox-spin 0.7s linear infinite;\r\n}\r\n\r\n@keyframes mono-checkbox-spin {\r\n  to {\r\n    transform: rotate(360deg);\r\n  }\r\n}\r\n\r\n@media (prefers-reduced-motion: reduce) {\r\n  :where([mono-checkbox]) > [mono-box] {\r\n    transition: none;\r\n  }\r\n\r\n  :where([mono-checkbox]) [mono-spinner] {\r\n    animation-duration: 2.4s;\r\n  }\r\n}\r\n";
//#endregion
//#region src/components/checkbox/mono-checkbox.ts
var MonoCheckbox = class MonoCheckbox extends MonoCheckboxCore(LitElement) {
	constructor(..._args) {
		super(..._args);
		this._slotsCaptured = false;
		this._slotIcon = [];
		this._slotIndeterminateIcon = [];
		this._slotLabel = [];
		this._slotDescription = [];
	}
	static {
		this.styles = [unsafeCSS(checkbox_default)];
	}
	createRenderRoot() {
		return this;
	}
	connectedCallback() {
		super.connectedCallback();
		this._captureSlots();
		if (this.isConnected) this.performUpdate();
	}
	updated(changed) {
		super.updated(changed);
		this._placeSlot("icon", this._slotIcon);
		this._placeSlot("indeterminate-icon", this._slotIndeterminateIcon);
		this._placeSlot("label", this._slotLabel);
		this._placeSlot("description", this._slotDescription);
	}
	_captureSlots() {
		if (this._slotsCaptured) return;
		this._slotsCaptured = true;
		const captured = monoHostChildNodes(this);
		const capturedSlotNodes = /* @__PURE__ */ new Set();
		for (const node of captured) {
			if (!(node instanceof Element)) continue;
			const slotName = node.getAttribute("slot");
			if (slotName === "icon") {
				node.removeAttribute("slot");
				this._slotIcon.push(node);
				capturedSlotNodes.add(node);
			}
			if (slotName === "indeterminate-icon") {
				node.removeAttribute("slot");
				this._slotIndeterminateIcon.push(node);
				capturedSlotNodes.add(node);
			}
			if (slotName === "label") {
				node.removeAttribute("slot");
				this._slotLabel.push(node);
				capturedSlotNodes.add(node);
			}
			if (slotName === "sublabel" || slotName === "description") {
				node.removeAttribute("slot");
				this._slotDescription.push(node);
				capturedSlotNodes.add(node);
			}
		}
		this._hasIcon = this._slotIcon.length > 0;
		this._hasIndeterminateIcon = this._slotIndeterminateIcon.length > 0;
		this._hasLabelSlotState = this._slotLabel.length > 0;
		this._hasDescriptionSlotState = this._slotDescription.length > 0;
		for (const node of capturedSlotNodes) if (node.parentNode === this) this.removeChild(node);
	}
	_placeSlot(name, nodes) {
		if (!nodes.length) return;
		const target = this.querySelector(`[data-mono-slot="${name}"]`);
		if (!target) return;
		for (const node of nodes) placeSlotNode(target, node);
	}
};
__decorate([state()], MonoCheckbox.prototype, "_slotsCaptured", void 0);
MonoCheckbox = __decorate([customElement("mono-checkbox")], MonoCheckbox);
//#endregion
//#region src/components/checkbox/checkbox-utils.ts
/**
* Validate checkbox props
*/
function validateCheckboxProps(props) {
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
function generateCheckboxAttributes(disabled, checked, indeterminate, label) {
	return {
		"aria-disabled": disabled ? "true" : void 0,
		"aria-checked": indeterminate ? "mixed" : String(checked),
		"role": "checkbox",
		"aria-label": label || void 0
	};
}
//#endregion
export { MonoCheckbox, generateCheckboxAttributes, validateCheckboxProps };
