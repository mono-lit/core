import { a as __decorate, c as defineHybridPropAlias, f as customElement, i as withShadowUtilityStyles, l as defineHybridPropAliases, r as toShadowCss, s as booleanStringConverter, t as flushSsrHydration } from "../../hydration-flush-RB5Tz5nl.js";
import { t as dispatchMonoEvent } from "../../mono-event-Bi1qP9uN.js";
import { t as MonoFormControlCore } from "../../form-control-core-B8d7k6vk.js";
import { LitElement, html, isServer, nothing, unsafeCSS } from "lit";
import { property, state } from "lit/decorators.js";
import { ifDefined } from "lit/directives/if-defined.js";
//#region src/components/switch/switch-core.ts
/**
* `MonoSwitchCore` — all render-mode-agnostic logic for `mono-switch`: reactive
* props (incl. SSR boolean coercion), hybrid aliases, camelCase attribute
* fallbacks, the `modelValue`↔`checked` sync, class computation, change
* interactivity (`mno-change`), `focus`/`blur`, AND the shared `render()`
* skeleton (`<label><input role=switch><track><thumb></track><labelBlock></label>`).
* The slot-bearing label/description region is an overridable hook
* (`_renderLabelBlock()`) that defaults to the light build's `[data-mono-slot]`
* placeholders; the shadow build overrides it with native `<slot>` (mirrors
* `mono-checkbox`). SSR-safe: no `document`/`window`; `focus`/`blur` query
* `this.renderRoot`.
*/
var MonoSwitchCore = (superClass) => {
	class MonoSwitchCoreClass extends MonoFormControlCore(superClass) {
		constructor(...args) {
			super(...args);
			this.size = "md";
			this.color = "primary";
			this.modelValue = false;
			this.checked = false;
			this.disabled = false;
			this.loading = false;
			this.label = "";
			this.sublabel = "";
			this.value = "";
			this.name = "";
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
		}
		static get observedAttributes() {
			return [
				...super.observedAttributes ?? [],
				"modelvalue",
				"arialabeltext",
				"arialabel",
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
			for (const key of [
				"modelValue",
				"checked",
				"disabled",
				"loading"
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
		get _wrapperClasses() {
			return [
				"mono-switch",
				this.size,
				this.color,
				this.disabled ? "disabled" : "",
				this.loading ? "loading" : "",
				this.checked ? "mono-switch-checked" : "",
				this.cssClassName,
				this.cssClass?.root
			].filter(Boolean).join(" ");
		}
		get _inputClasses() {
			return this._cls("mono-switch-input", "input");
		}
		get _trackClasses() {
			return [this._cls("mono-switch-track", "track"), this.size].filter(Boolean).join(" ");
		}
		get _thumbClasses() {
			return [this._cls("mono-switch-thumb", "thumb"), this.size].filter(Boolean).join(" ");
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
			if (this.disabled || this.loading) return;
			const input = event.currentTarget;
			const oldValue = this.modelValue;
			const nextValue = input.checked;
			this.checked = nextValue;
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
        <span class=${this._cls("mono-switch-label", "label")} mono-label>
          ${this._hasLabelContent() ? html`
                <span class=${this._cls("mono-switch-label-text", "labelText")} mono-label-text>
                  ${this._hasLabelSlotState ? html`<span data-mono-slot="label"></span>` : this.label}
                </span>
              ` : nothing}

          ${this._hasDescriptionContent() ? html`
                <span class=${this._cls("mono-switch-label-description", "description")} mono-description>
                  ${this._hasDescriptionSlotState ? html`<span data-mono-slot="description"></span>` : this.sublabel}
                </span>
              ` : nothing}
        </span>
      `;
		}
		render() {
			const ariaLabel = this.ariaLabelText || this.label || (this._hasLabelSlotState ? "Switch" : void 0);
			return html`
        <label
          class=${this._wrapperClasses}
          mono-switch
          mono-size=${this.size === "md" ? nothing : this.size}
          mono-color=${this.color === "primary" ? nothing : this.color}
          ?mono-checked=${this.checked}
          ?mono-disabled=${this.disabled}
          ?mono-loading=${this.loading}
        >
          <input
            class=${this._inputClasses}
            mono-input
            type="checkbox"
            role="switch"
            .checked=${this.checked}
            .value=${this.value}
            name=${ifDefined(this.name || void 0)}
            ?disabled=${this.disabled || this.loading}
            aria-checked=${String(this.checked)}
            aria-label=${ifDefined(ariaLabel)}
            @change=${this._handleChange}
          />

          <span class=${this._trackClasses} mono-track aria-hidden="true">
            <span class=${this._thumbClasses} mono-thumb></span>
          </span>

          ${this._renderLabelBlock()}
        </label>
      `;
		}
		focus(options) {
			this.renderRoot.querySelector(".mono-switch-input")?.focus(options);
		}
		blur() {
			this.renderRoot.querySelector(".mono-switch-input")?.blur();
		}
	}
	__decorate([property({ type: String })], MonoSwitchCoreClass.prototype, "size", void 0);
	__decorate([property({ type: String })], MonoSwitchCoreClass.prototype, "color", void 0);
	__decorate([property({
		attribute: "model-value",
		reflect: true,
		converter: booleanStringConverter
	})], MonoSwitchCoreClass.prototype, "modelValue", void 0);
	__decorate([property({
		reflect: true,
		converter: booleanStringConverter
	})], MonoSwitchCoreClass.prototype, "checked", void 0);
	__decorate([property({
		reflect: true,
		converter: booleanStringConverter
	})], MonoSwitchCoreClass.prototype, "disabled", void 0);
	__decorate([property({
		reflect: true,
		converter: booleanStringConverter
	})], MonoSwitchCoreClass.prototype, "loading", void 0);
	__decorate([property({ type: String })], MonoSwitchCoreClass.prototype, "label", void 0);
	__decorate([property({ type: String })], MonoSwitchCoreClass.prototype, "sublabel", void 0);
	__decorate([property({ type: String })], MonoSwitchCoreClass.prototype, "value", void 0);
	__decorate([property({ type: String })], MonoSwitchCoreClass.prototype, "name", void 0);
	__decorate([property({
		type: String,
		attribute: "aria-label"
	})], MonoSwitchCoreClass.prototype, "ariaLabelText", void 0);
	__decorate([property({ attribute: false })], MonoSwitchCoreClass.prototype, "cssClass", void 0);
	__decorate([property({ attribute: false })], MonoSwitchCoreClass.prototype, "cssClassName", void 0);
	__decorate([state()], MonoSwitchCoreClass.prototype, "_hasLabelSlotState", void 0);
	__decorate([state()], MonoSwitchCoreClass.prototype, "_hasDescriptionSlotState", void 0);
	return MonoSwitchCoreClass;
};
//#endregion
//#region src/components/switch/switch.css?raw
var switch_default = "/* =========================================================================\r\n   mono-switch — a port of Basecoat's `.input[type='checkbox'][role='switch']`\r\n   and the `.label` beside it (basecoat-css@1.0.2, vega style).\r\n\r\n   Styled by ATTRIBUTE, like Basecoat — and the attributes mirror the element's\r\n   props one for one, so hand-written markup reads like the Lit / Vue tag:\r\n\r\n     <mono-switch size=\"sm\" color=\"danger\" label=\"Notifications\" model-value>\r\n     <label mono-switch mono-size=\"sm\" mono-color=\"danger\">\r\n       <input mono-input type=\"checkbox\" role=\"switch\" checked />\r\n       <span mono-track aria-hidden=\"true\"><span mono-thumb></span></span>\r\n       <span mono-label><span mono-label-text>Notifications</span></span>\r\n     </label>\r\n\r\n   An absent attribute is the prop's default (`:not([mono-size])` = md,\r\n   `:not([mono-color])` = primary). The element renders these attributes on its\r\n   root <label> (both builds) plus the STATES `mono-checked` / `mono-loading`;\r\n   hand-written markup may rely on the native input's `:checked` instead — every\r\n   state rule reads both. The old classes (`.mono-switch.sm.mono-switch-checked`)\r\n   are still emitted as inert hooks until 2.0 but no rule here reads them.\r\n\r\n   Selector map (ours ≡ upstream):\r\n     [mono-switch]                                 ≡ .label (flex gap-2 text-sm font-medium leading-snug select-none)\r\n     [mono-switch] > [mono-track]                  ≡ .input[type='checkbox'][role='switch'] (h-[18.4px] w-[32px] rounded-full border border-transparent shadow-xs, not-checked:bg-input)\r\n     [mono-track] > [mono-thumb]                   ≡ :before (size-4 rounded-full bg-background; dark not-checked:bg-foreground, checked:bg-primary-foreground — via --mono-mode-switch-thumb*)\r\n     [mono-checked] / [mono-input]:checked         ≡ :checked (bg-primary) + :before translate-x-[calc(100%-2px)]\r\n     [mono-input]:focus-visible + [mono-track]     ≡ focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50\r\n     [mono-invalid] / [mono-input][aria-invalid]   ≡ aria-invalid:border-destructive aria-invalid:ring-destructive/20\r\n     [mono-disabled] / [mono-input]:disabled       ≡ disabled:cursor-not-allowed disabled:opacity-50\r\n     [mono-label-text]                             ≡ .label text\r\n     [mono-description]                            ≡ .field > p (text-sm text-muted-foreground)\r\n     [mono-size=\"xs|sm|lg|xl|xxl\"]                 ≡ EXTENSION — upstream has two steps (default / data-size='sm');\r\n                                                     mono derives all six from --mono-control-height-*\r\n     [mono-color=\"…\"]                              ≡ EXTENSION (the ON track in the role's colour)\r\n     [mono-loading]                                ≡ EXTENSION (the thumb pulses while a change is in flight)\r\n\r\n   GEOMETRY — one anchor, everything else derived, and it lands exactly on\r\n   Basecoat at md: the THUMB is the checkbox box (--mono-control-height-md × 4/9\r\n   = 16px = upstream's `size-4`), the track is 1.15 × that tall (18.4px =\r\n   `h-[18.4px]`) and 2 × that wide (32px = `w-[32px]`). So a switch, a checkbox\r\n   and a radio in one column share one scale by construction. The thumb travels\r\n   the width of the track's CONTENT box minus its own — which parks it flush\r\n   inside the border at both ends, so there is no inset to tune. (Upstream writes\r\n   that as `calc(100% - 2px)`, the same number at vega's 1px border and 2:1\r\n   track, but wrong for any flavor that changes either.)\r\n\r\n   Specificity contract (same as the pre-port class sheet): a part's RESTING rule\r\n   is exactly one attribute strong — `:where([mono-switch]) [mono-track]` =\r\n   (0,1,0) — so a utility class handed in through `cssClass` wins by source\r\n   order, while state rules (checked / focus / invalid / disabled / loading,\r\n   keyed on the root or the native input) stay heavier and win over it.\r\n\r\n   Inner parts: [mono-input], [mono-track] > [mono-thumb], [mono-label] >\r\n   [mono-label-text] / [mono-description]. The shadow build marks an unassigned\r\n   slot wrapper [mono-empty].\r\n\r\n   The track sits on the label's CAP BAND (see `--_mono-switch-line-offset`) —\r\n   mono's own alignment rule, kept, and the same numbers checkbox.css uses.\r\n\r\n   FLAVORS set `--mono-switch-{radius,shadow,border-width,border-color,\r\n   checked-border-color,ring-width,ring-alpha,track-off,track-height-md,\r\n   track-ratio,thumb-ratio,thumb-width-ratio,thumb-radius,thumb-shadow}` (the per-style `[role='switch']` deltas); every fallback here is\r\n   vega's value (`node scripts/basecoat-styles.mjs --varying \"role='switch'\"`).\r\n   ========================================================================= */\r\n\r\nmono-switch {\r\n  display: inline-block;\r\n}\r\n\r\n[mono-switch] {\r\n  /* ── palette: each slot is a public knob over a Basecoat token ─────────── */\r\n  --_mono-switch-text: var(--mono-switch-text, var(--foreground));\r\n  --_mono-switch-description: var(--mono-switch-description, var(--muted-foreground));\r\n  --_mono-switch-primary: var(--mono-switch-primary, var(--primary));\r\n  --_mono-switch-accent: var(--mono-switch-accent, var(--_mono-switch-accent-preset, var(--_mono-switch-primary)));\r\n  /* not-checked:bg-input (dark: /80 — the mode token carries it) */\r\n  --_mono-switch-track-off: var(--mono-switch-track-off, var(--mono-mode-surface-strong));\r\n  --_mono-switch-thumb: var(--mono-switch-thumb, var(--mono-mode-switch-thumb));\r\n  --_mono-switch-thumb-checked: var(--mono-switch-thumb-checked, var(--mono-mode-switch-thumb-checked));\r\n  --_mono-switch-shadow: var(--mono-switch-shadow, var(--mono-shadow-xs));\r\n  --_mono-switch-thumb-shadow: var(--mono-switch-thumb-shadow, 0 0 #0000);\r\n  --_mono-switch-radius: var(--mono-switch-radius, var(--mono-radius-full));\r\n  --_mono-switch-border-width: var(--mono-switch-border-width, var(--mono-border-width));\r\n  --_mono-switch-border-color: var(--mono-switch-border-color, transparent);\r\n  --_mono-switch-ring-color: var(--mono-switch-ring-color, var(--ring));\r\n  --_mono-switch-ring-width: var(--mono-switch-ring-width, var(--mono-ring-width));\r\n  --_mono-switch-ring-alpha: var(--mono-switch-ring-alpha, var(--mono-ring-alpha));\r\n\r\n  /* ── md metrics live on the unqualified root ON PURPOSE ────────────────────\r\n     basecoat@1.0.2 styles/vega.css [role='switch'] — h-[18.4px] w-[32px] with a\r\n     size-4 thumb; 18.4 = (36 × 4/9) × 1.15 and 32 = (36 × 4/9) × 2 */\r\n  --_mono-switch-track-h: var(--mono-switch-track-height, var(--mono-switch-track-height-md, calc(var(--mono-control-height-md) * 23 / 45)));\r\n  --_mono-switch-track-w: var(--mono-switch-track-width, calc(var(--_mono-switch-track-h) * var(--mono-switch-track-ratio, 1.7391)));\r\n  --_mono-switch-track-inner-h: calc(var(--_mono-switch-track-h) - 2 * var(--_mono-switch-border-width));\r\n  --_mono-switch-track-inner-w: calc(var(--_mono-switch-track-w) - 2 * var(--_mono-switch-border-width));\r\n  /* `min()` so a flavor with a thicker border (luma, rhea: border-2) cannot\r\n     push the thumb past the track content box. The width is its own ratio:\r\n     luma's thumb is a PILL (h-4 w-6), not a circle. */\r\n  --_mono-switch-thumb-size: min(\r\n    calc(var(--_mono-switch-track-h) * var(--mono-switch-thumb-ratio, 0.8696)),\r\n    var(--_mono-switch-track-inner-h)\r\n  );\r\n  --_mono-switch-thumb-w: min(\r\n    calc(var(--_mono-switch-track-h) * var(--mono-switch-thumb-width-ratio, var(--mono-switch-thumb-ratio, 0.8696))),\r\n    var(--_mono-switch-track-inner-w)\r\n  );\r\n  /* ON travel = the content box minus the thumb. Upstream writes it\r\n     `translate-x-[calc(100%-2px)]`, which is the same number at vega's 1px\r\n     border and 2:1 track — and only there: luma's border-2 left the thumb short\r\n     of the end, rhea's narrower track pushed it past. */\r\n  --_mono-switch-travel: calc(var(--_mono-switch-track-inner-w) - var(--_mono-switch-thumb-w));\r\n  /* ── whole pixels ────────────────────────────────────────────────────────\r\n     Every part of the switch is a ratio of the control step, so it lands on a\r\n     fraction (18.39px, 16.34px, 17.77px…). A fractional round shape is\r\n     antialiased on every edge, and the thumb — which parks flush against the\r\n     track's cap — picked up a dark rim that changed with the flavor and the\r\n     screen's pixel ratio.\r\n\r\n     Snap the THUMB and its inset, then build the track height from them, rather\r\n     than rounding each value on its own: rounding independently can leave half a\r\n     pixel above and below the thumb (an odd track around an even thumb), which\r\n     blurs exactly the edge this is meant to sharpen, or stretch the thumb into an\r\n     ellipse. `round()` has the same browser floor as `color-mix()` and `:has()`,\r\n     which this sheet already requires. */\r\n  --_mono-switch-thumb-h-px: round(nearest, var(--_mono-switch-thumb-size), 1px);\r\n  --_mono-switch-thumb-w-px: round(nearest, var(--_mono-switch-thumb-w), 1px);\r\n  --_mono-switch-thumb-inset-y: max(\r\n    0px,\r\n    round(nearest, calc((var(--_mono-switch-track-inner-h) - var(--_mono-switch-thumb-size)) / 2), 1px)\r\n  );\r\n  --_mono-switch-track-h-px: calc(\r\n    var(--_mono-switch-thumb-h-px) + 2 * var(--_mono-switch-border-width) + 2 * var(--_mono-switch-thumb-inset-y)\r\n  );\r\n  --_mono-switch-track-w-px: round(nearest, var(--_mono-switch-track-w), 1px);\r\n  --_mono-switch-travel-px: calc(\r\n    var(--_mono-switch-track-w-px) - 2 * var(--_mono-switch-border-width) - var(--_mono-switch-thumb-w-px)\r\n  );\r\n\r\n  --_mono-switch-gap: var(--mono-switch-gap, var(--mono-switch-gap-md, calc(var(--mono-spacing) * 2)));\r\n  --_mono-switch-label-font: var(--mono-switch-label-font-md, var(--mono-text-sm));\r\n  --_mono-switch-description-font: var(--mono-switch-description-font-md, 0.8125rem);\r\n\r\n  /* ── alignment with the label ────────────────────────────────────────────\r\n     The track is centred on the label's CAP BAND — the ink the eye reads, not\r\n     the line box. Every number is checkbox.css's. */\r\n  --_mono-switch-label-line-height: var(--mono-switch-label-line-height, var(--mono-leading-snug));\r\n  --_mono-switch-optical-shift: 0.045;\r\n  --_mono-switch-optical-nudge: 0px;\r\n  --_mono-switch-line-offset: calc(\r\n    (var(--_mono-switch-label-font) * var(--_mono-switch-label-line-height) - var(--_mono-switch-track-h-px)) / 2 +\r\n      var(--_mono-switch-label-font) * var(--_mono-switch-optical-shift) + var(--_mono-switch-optical-nudge)\r\n  );\r\n\r\n  /* The element build nests this root inside its host, so it is never itself a\r\n     grid or flex item and shrink-wraps its content. Hand-written markup usually\r\n     IS the item (a radio in a `display: grid` list), and an item blockifies —\r\n     `inline-flex` becomes `flex` and the row stretches to the widest sibling,\r\n     wrapping its label at a different point than the element's. `fit-content`\r\n     keeps both shapes shrink-wrapped; a consumer who wants a full-width row\r\n     still sets a width. */\r\n  width: fit-content;\r\n  display: inline-flex;\r\n  align-items: flex-start;\r\n  gap: var(--_mono-switch-gap);\r\n  position: relative;\r\n  vertical-align: top;\r\n  cursor: pointer;\r\n  user-select: none;\r\n  font-family: inherit;\r\n  color: var(--_mono-switch-text);\r\n}\r\n\r\n[mono-switch],\r\n:where([mono-switch]) *,\r\n:where([mono-switch]) *::before,\r\n:where([mono-switch]) *::after {\r\n  box-sizing: border-box;\r\n}\r\n\r\n:where([mono-switch]) :is([mono-label], [mono-label-text], [mono-description])[mono-empty] {\r\n  display: none;\r\n}\r\n\r\n/* the track seats on the first line of a label that is actually there; a bare\r\n   track stays flush at the top */\r\n[mono-switch]:has([mono-label-text]:not([mono-empty])) > [mono-track] {\r\n  margin-top: var(--_mono-switch-line-offset, 0px);\r\n}\r\n\r\n/* =========================================\r\n   Sizes — EXTENSION: upstream has two steps; mono derives six from the control\r\n   ladder, so the thumb is the checkbox box at every one of them\r\n   ========================================= */\r\n\r\n[mono-switch][mono-size=\"xs\"] {\r\n  --_mono-switch-track-h: var(--mono-switch-track-height, var(--mono-switch-track-height-xs, calc(var(--mono-control-height-xs) * 23 / 45)));\r\n  --_mono-switch-gap: var(--mono-switch-gap, var(--mono-switch-gap-xs, calc(var(--mono-spacing) * 1.25)));\r\n  --_mono-switch-label-font: var(--mono-switch-label-font-xs, var(--mono-text-xs));\r\n  --_mono-switch-description-font: var(--mono-switch-description-font-xs, 0.6875rem);\r\n}\r\n\r\n[mono-switch][mono-size=\"sm\"] {\r\n  --_mono-switch-track-h: var(--mono-switch-track-height, var(--mono-switch-track-height-sm, calc(var(--mono-control-height-sm) * 23 / 45)));\r\n  --_mono-switch-gap: var(--mono-switch-gap, var(--mono-switch-gap-sm, calc(var(--mono-spacing) * 1.5)));\r\n  --_mono-switch-label-font: var(--mono-switch-label-font-sm, 0.8125rem);\r\n  --_mono-switch-description-font: var(--mono-switch-description-font-sm, var(--mono-text-xs));\r\n}\r\n\r\n[mono-switch][mono-size=\"lg\"] {\r\n  --_mono-switch-track-h: var(--mono-switch-track-height, var(--mono-switch-track-height-lg, calc(var(--mono-control-height-lg) * 23 / 45)));\r\n  --_mono-switch-gap: var(--mono-switch-gap, var(--mono-switch-gap-lg, calc(var(--mono-spacing) * 2.5)));\r\n  --_mono-switch-label-font: var(--mono-switch-label-font-lg, var(--mono-text-base));\r\n  --_mono-switch-description-font: var(--mono-switch-description-font-lg, var(--mono-text-sm));\r\n  /* 16px text rounds its ascent such that the track lands ~0.35px low */\r\n  --_mono-switch-optical-nudge: -0.35px;\r\n}\r\n\r\n[mono-switch][mono-size=\"xl\"] {\r\n  --_mono-switch-track-h: var(--mono-switch-track-height, var(--mono-switch-track-height-xl, calc(var(--mono-control-height-xl) * 23 / 45)));\r\n  --_mono-switch-gap: var(--mono-switch-gap, var(--mono-switch-gap-xl, calc(var(--mono-spacing) * 3)));\r\n  --_mono-switch-label-font: var(--mono-switch-label-font-xl, var(--mono-text-lg));\r\n  --_mono-switch-description-font: var(--mono-switch-description-font-xl, var(--mono-text-base));\r\n}\r\n\r\n[mono-switch][mono-size=\"xxl\"] {\r\n  --_mono-switch-track-h: var(--mono-switch-track-height, var(--mono-switch-track-height-xxl, calc(var(--mono-control-height-xxl) * 23 / 45)));\r\n  --_mono-switch-gap: var(--mono-switch-gap, var(--mono-switch-gap-xxl, calc(var(--mono-spacing) * 3.5)));\r\n  --_mono-switch-label-font: var(--mono-switch-label-font-xxl, var(--mono-text-xl));\r\n  --_mono-switch-description-font: var(--mono-switch-description-font-xxl, var(--mono-text-lg));\r\n  /* 20px text rounds the other way, leaving the track ~1.1px high */\r\n  --_mono-switch-optical-nudge: 1.1px;\r\n}\r\n\r\n/* =========================================\r\n   Colours — EXTENSION: the ON track in the role's colour\r\n   ========================================= */\r\n\r\n[mono-switch]:is(:not([mono-color]), [mono-color=\"primary\"]) {\r\n  --_mono-switch-accent-preset: var(--_mono-switch-primary);\r\n}\r\n[mono-switch][mono-color=\"secondary\"] {\r\n  --_mono-switch-accent-preset: var(--secondary-foreground);\r\n}\r\n[mono-switch][mono-color=\"success\"] {\r\n  --_mono-switch-accent-preset: var(--success);\r\n}\r\n[mono-switch][mono-color=\"danger\"] {\r\n  --_mono-switch-accent-preset: var(--destructive);\r\n}\r\n[mono-switch][mono-color=\"warning\"] {\r\n  --_mono-switch-accent-preset: var(--warning);\r\n}\r\n[mono-switch][mono-color=\"info\"] {\r\n  --_mono-switch-accent-preset: var(--info);\r\n}\r\n[mono-switch][mono-color=\"teal\"] {\r\n  --_mono-switch-accent-preset: var(--teal);\r\n}\r\n[mono-switch][mono-color=\"purple\"] {\r\n  --_mono-switch-accent-preset: var(--purple);\r\n}\r\n[mono-switch][mono-color=\"neutral\"] {\r\n  --_mono-switch-accent-preset: var(--neutral);\r\n}\r\n[mono-switch][mono-color=\"dark\"] {\r\n  --_mono-switch-accent-preset: var(--dark);\r\n}\r\n\r\n/* =========================================\r\n   States on the root\r\n   ========================================= */\r\n\r\n/* basecoat@1.0.2 components/switch.css .field > input[type='checkbox'][role='switch'], .input[type='checkbox'][role='switch']\r\n   — disabled:cursor-not-allowed disabled:opacity-50.\r\n   A BUSY switch is exempt: the input is disabled so a second click cannot race\r\n   the first, but it reads as \"working\", not \"unavailable\". */\r\n[mono-switch][mono-disabled]:not([mono-loading]),\r\n[mono-switch]:not([mono-loading]):has(> [mono-input]:disabled) {\r\n  cursor: not-allowed;\r\n  opacity: 0.5;\r\n  pointer-events: none;\r\n}\r\n\r\n[mono-switch][mono-loading] {\r\n  cursor: progress;\r\n  pointer-events: none;\r\n}\r\n\r\n/* the native input is the accessible control; the track is its painted twin */\r\n:where([mono-switch]) [mono-input] {\r\n  position: absolute;\r\n  opacity: 0;\r\n  pointer-events: none;\r\n  width: 1px;\r\n  height: 1px;\r\n  margin: 0;\r\n  /* the UA gives an <input> its own font; inside a shadow root nothing resets it,\r\n     so the hidden control ended up with a different computed font in the two\r\n     builds. It paints nothing either way — this just keeps them identical. */\r\n  font: inherit;\r\n  color: inherit;\r\n}\r\n\r\n/* =========================================\r\n   The track\r\n   ========================================= */\r\n\r\n/* basecoat@1.0.2 components/switch.css .field > input[type='checkbox'][role='switch'], .input[type='checkbox'][role='switch']\r\n   — inline-flex shrink-0 appearance-none items-center transition-all outline-none */\r\n/* basecoat@1.0.2 styles/vega.css .field > input[type='checkbox'][role='switch'], .input[type='checkbox'][role='switch']\r\n   — rounded-full border border-transparent shadow-xs; not-checked:bg-input\r\n   (dark /80 via --mono-mode-surface-strong); checked:bg-primary;\r\n   mono: `--tw-ring-*` flattened to the ring + shadow slots */\r\n/* basecoat@1.0.2 styles/vega.css :is(.field > input[type='checkbox'][role='switch'], .input[type='checkbox'][role='switch']):not([data-size='sm'])\r\n   — h-[18.4px] w-[32px] (mono derives both from the control step) */\r\n:where([mono-switch]) > [mono-track] {\r\n  --_mono-switch-ring: 0 0 #0000;\r\n  position: relative;\r\n  flex: 0 0 auto;\r\n  display: inline-flex;\r\n  align-items: center;\r\n  width: var(--_mono-switch-track-w-px);\r\n  height: var(--_mono-switch-track-h-px);\r\n  border: var(--_mono-switch-border-width) solid var(--_mono-switch-border-color);\r\n  border-radius: var(--_mono-switch-radius);\r\n  background-color: var(--_mono-switch-track-off);\r\n  box-shadow: var(--_mono-switch-ring), var(--_mono-switch-shadow);\r\n  /* the track's own ink is the ACCENT, so a flavor that outlines the ON track\r\n     (luma, sera, rhea) says `--mono-switch-checked-border-color: currentColor`\r\n     with public knobs alone */\r\n  color: var(--_mono-switch-accent);\r\n  transition-property: box-shadow, background-color, border-color;\r\n  transition-timing-function: var(--mono-ease);\r\n  transition-duration: var(--mono-duration);\r\n}\r\n\r\n/* focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 */\r\n:where([mono-switch]) > [mono-input]:focus-visible + [mono-track] {\r\n  border-color: var(--_mono-switch-ring-color);\r\n  --_mono-switch-ring: 0 0 0 var(--_mono-switch-ring-width) color-mix(in oklab, var(--_mono-switch-ring-color) var(--_mono-switch-ring-alpha), transparent);\r\n}\r\n\r\n/* aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20\r\n   (dark: /50, /40 via the mode tokens) */\r\n[mono-switch][mono-invalid] > [mono-track],\r\n:where([mono-switch]) > [mono-input][aria-invalid=\"true\"] + [mono-track] {\r\n  border-color: var(--mono-mode-invalid-border);\r\n  --_mono-switch-ring: 0 0 0 var(--_mono-switch-ring-width) var(--mono-mode-invalid-ring);\r\n}\r\n\r\n/* checked:bg-primary — generalised per hue */\r\n[mono-switch][mono-checked] > [mono-track],\r\n:where([mono-switch]) > [mono-input]:checked + [mono-track] {\r\n  background-color: var(--_mono-switch-accent);\r\n  border-color: var(--mono-switch-checked-border-color, var(--_mono-switch-border-color));\r\n}\r\n\r\n/* =========================================\r\n   The thumb — upstream's `:before`\r\n   ========================================= */\r\n\r\n/* basecoat@1.0.2 components/switch.css .field > input[type='checkbox'][role='switch'], .input[type='checkbox'][role='switch']\r\n   — before:pointer-events-none before:block before:content-[''] before:ring-0 before:transition-transform */\r\n/* basecoat@1.0.2 styles/vega.css :is(.field > input[type='checkbox'][role='switch'], .input[type='checkbox'][role='switch']):before\r\n   — bg-background rounded-full (dark: not-checked bg-foreground / checked\r\n   bg-primary-foreground, via --mono-mode-switch-thumb*) */\r\n/* basecoat@1.0.2 styles/vega.css :is(.field > input[type='checkbox'][role='switch'], .input[type='checkbox'][role='switch']):not([data-size='sm']):before\r\n   — size-4 (mono: that share of the track, so it tracks every step) */\r\n:where([mono-switch]) > [mono-track] > [mono-thumb] {\r\n  display: block;\r\n  flex: 0 0 auto;\r\n  pointer-events: none;\r\n  width: var(--_mono-switch-thumb-w-px);\r\n  height: var(--_mono-switch-thumb-h-px);\r\n  border-radius: var(--mono-switch-thumb-radius, var(--mono-radius-full));\r\n  background-color: var(--_mono-switch-thumb);\r\n  box-shadow: var(--_mono-switch-thumb-shadow);\r\n  /* `translate`, not `transform`: the loading pulse owns `transform`, and the\r\n     two are independent properties, so they no longer collide */\r\n  translate: 0;\r\n  transition-property: translate, background-color;\r\n  transition-timing-function: var(--mono-ease);\r\n  transition-duration: var(--mono-duration);\r\n}\r\n\r\n/* :checked:before — translate-x-[calc(100%-2px)]: the thumb parks flush inside\r\n   the track's border at both ends (see --_mono-switch-travel) */\r\n[mono-switch][mono-checked] > [mono-track] > [mono-thumb],\r\n:where([mono-switch]) > [mono-input]:checked + [mono-track] > [mono-thumb] {\r\n  translate: var(--_mono-switch-travel-px);\r\n  background-color: var(--_mono-switch-thumb-checked);\r\n}\r\n\r\n[mono-switch][mono-checked] > [mono-track] > [mono-thumb]:dir(rtl),\r\n:where([mono-switch]) > [mono-input]:checked + [mono-track] > [mono-thumb]:dir(rtl) {\r\n  translate: calc(-1 * var(--_mono-switch-travel-px));\r\n}\r\n\r\n/* EXTENSION — the thumb pulses while a change is in flight */\r\n[mono-switch][mono-loading] > [mono-track] > [mono-thumb] {\r\n  animation: mono-switch-pulse 1s ease-in-out infinite;\r\n}\r\n\r\n@keyframes mono-switch-pulse {\r\n  0%,\r\n  100% {\r\n    transform: scale(1);\r\n  }\r\n  50% {\r\n    transform: scale(0.86);\r\n  }\r\n}\r\n\r\n@media (prefers-reduced-motion: reduce) {\r\n  :where([mono-switch]) > [mono-track],\r\n  :where([mono-switch]) > [mono-track] > [mono-thumb] {\r\n    transition: none;\r\n  }\r\n\r\n  [mono-switch][mono-loading] > [mono-track] > [mono-thumb] {\r\n    animation-duration: 2.4s;\r\n  }\r\n}\r\n\r\n/* =========================================\r\n   Label\r\n   ========================================= */\r\n\r\n:where([mono-switch]) > [mono-label] {\r\n  min-width: 0;\r\n}\r\n\r\n/* basecoat@1.0.2 styles/vega.css .field > label, .label — text-sm leading-snug font-medium;\r\n   `block` so the first line box is exactly font × line-height */\r\n:where([mono-switch]) [mono-label-text] {\r\n  display: block;\r\n  font-size: var(--_mono-switch-label-font);\r\n  line-height: var(--_mono-switch-label-line-height);\r\n  font-weight: var(--mono-switch-label-font-weight, var(--mono-label-font-weight, var(--mono-font-weight-medium)));\r\n  color: var(--_mono-switch-text);\r\n}\r\n\r\n/* basecoat@1.0.2 styles/vega.css .fieldset legend + p, .field > p, .field section > p\r\n   — text-sm text-muted-foreground leading-normal font-normal; EXTENSION: one step\r\n   under the label per size */\r\n:where([mono-switch]) [mono-description] {\r\n  display: block;\r\n  margin-top: calc(var(--mono-spacing) * 0.5);\r\n  font-size: var(--_mono-switch-description-font);\r\n  line-height: var(--mono-leading-normal);\r\n  font-weight: var(--mono-font-weight-normal);\r\n  color: var(--_mono-switch-description);\r\n}\r\n";
//#endregion
//#region src/components/switch/mono-switch.shadow.ts
var SHADOW_EXTRA_CSS = "";
var MonoSwitchShadow = class MonoSwitchShadow extends withShadowUtilityStyles(MonoSwitchCore(LitElement)) {
	static {
		this.disableWarning?.("change-in-update");
	}
	static {
		this.styles = [unsafeCSS(toShadowCss(switch_default, {
			host: "mono-switch",
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
	/** Reconcile the 2 slot-presence flags from their slots' assigned content. */
	_scanSlots() {
		for (const name of ["label", "description"]) {
			const has = name === "description" ? this._sublabelHasContent() : this._slotHasContent(this._slotFor(name));
			if (has !== (name === "label" ? this._hasLabelSlotState : this._hasDescriptionSlotState)) this._setSlotState(name, has);
		}
	}
	_renderLabelBlock() {
		return html`
      <span
        class=${this._cls("mono-switch-label", "label")}
        mono-label
        ?mono-empty=${!this._hasLabelContent() && !this._hasDescriptionContent()}
      >
        <span
          class=${this._cls("mono-switch-label-text", "labelText")}
          mono-label-text
          ?mono-empty=${!this._hasLabelContent()}
        >
          <slot name="label" @slotchange=${(e) => this._onSlotChange("label", e)}
            >${this.label || nothing}</slot
          >
        </span>

        <span
          class=${this._cls("mono-switch-label-description", "description")}
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
MonoSwitchShadow = __decorate([customElement("mono-shadow-switch")], MonoSwitchShadow);
//#endregion
//#region src/components/switch/switch-utils.ts
/**
* Validate switch props
*/
function validateSwitchProps(props) {
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
function generateSwitchAttributes(disabled, loading, checked, label) {
	return {
		"aria-disabled": disabled || loading ? "true" : void 0,
		"aria-busy": loading ? "true" : void 0,
		"aria-checked": String(checked),
		"role": "switch",
		"aria-label": label || void 0
	};
}
//#endregion
export { MonoSwitchCore, MonoSwitchShadow, generateSwitchAttributes, validateSwitchProps };
