import { n as defineMonoElement, t as customElement } from "../mono-element-B0kP_96P.js";
import { a as defineHybridPropAliases, r as booleanStringConverter, t as __decorate } from "../decorate-DEXtNagw.js";
import { t as dispatchMonoEvent } from "../mono-event-Bi1qP9uN.js";
import { n as bucketHasContent, r as captureLightSlots, s as placeSlotNode } from "../light-slots-DW1WgfgT.js";
import { LitElement, html, nothing, unsafeCSS } from "lit";
import { property, query, state } from "lit/decorators.js";
import { ifDefined } from "lit/directives/if-defined.js";
import { when } from "lit/directives/when.js";
//#region src/components/chip/chip-core.ts
/**
* `MonoChipCore` — all render-mode-agnostic logic for `mono-chip`: reactive
* props, hybrid aliases (incl. the `ariaLabel`/`aria-label`/`arialabel` →
* `ariaLabelText` getters), camelCase attribute fallbacks, the `modelValue`↔
* `selected` sync + SSR boolean coercion in `willUpdate`, class computation,
* click/keyboard/close interactivity (`mno-click`/`mno-close`), and the imperative
* `focus/blur/click`. No `render()` — the light build keeps its `[data-mono-slot]`
* capture strategy and the shadow build uses native `<slot>` (mirrors `mono-button`).
*
* SSR-safe: no `document`/`window` access; `_chipElement` (`@query`) is lazy and
* `focus/blur/click` only run client-side.
*/
var MonoChipCore = (superClass) => {
	class MonoChipCoreClass extends superClass {
		constructor(...args) {
			super(...args);
			this.cssClass = {};
			this._hasIcon = false;
			defineHybridPropAliases(this, [
				"modelValue",
				"iconPosition",
				"ariaLabelText",
				"closeLabel",
				"cssClass"
			]);
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
			this.size = "md";
			this.color = "primary";
			this.variant = "soft";
			this.label = void 0;
			this.dot = false;
			this.removable = false;
			this.clickable = false;
			this.disabled = false;
			this.modelValue = false;
			this.selected = false;
			this.href = void 0;
			this.target = void 0;
			this.iconPosition = "left";
			this.ariaLabelText = void 0;
			this.closeLabel = "Remove";
			this._isActive = false;
		}
		static get observedAttributes() {
			return [
				...super.observedAttributes ?? [],
				"modelvalue",
				"iconposition",
				"closelabel",
				"arialabeltext",
				"arialabel"
			];
		}
		attributeChangedCallback(name, oldValue, newValue) {
			super.attributeChangedCallback(name, oldValue, newValue);
			if (oldValue === newValue) return;
			if (name === "modelvalue") {
				this.modelValue = this._toBoolean(newValue);
				return;
			}
			if (name === "iconposition") {
				this.iconPosition = newValue ?? "left";
				return;
			}
			if (name === "closelabel") {
				this.closeLabel = newValue ?? "Remove";
				return;
			}
			if (name === "arialabeltext" || name === "arialabel") this.ariaLabelText = newValue ?? void 0;
		}
		willUpdate(changed) {
			for (const key of [
				"dot",
				"removable",
				"clickable",
				"disabled",
				"modelValue",
				"selected"
			]) if (typeof this[key] === "string") this[key] = this._toBoolean(this[key]);
			if (!this.hasUpdated) {
				const on = this.selected || this.modelValue;
				if (this.selected !== on) this.selected = on;
				if (this.modelValue !== on) this.modelValue = on;
			} else {
				if (changed.has("modelValue") && this.selected !== this.modelValue) this.selected = this.modelValue;
				if (changed.has("selected") && this.modelValue !== this.selected) this.modelValue = this.selected;
			}
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
		get _isInteractive() {
			return this.clickable || Boolean(this.href) || this.removable;
		}
		get _chipClasses() {
			const classes = ["mono-chip"];
			classes.push(this.size);
			if (this.variant === "soft") classes.push(`soft-${this.color}`);
			else if (this.variant === "solid") classes.push(`solid-${this.color}`);
			else if (this.variant === "outline") classes.push(`outline-${this.color}`);
			if (this.dot) classes.push("has-dot");
			if (this.removable) classes.push("removable");
			if (this.clickable || this.href) classes.push("clickable");
			if (this.disabled) classes.push("disabled");
			if (this.selected || this._isActive) classes.push("selected");
			if (this.cssClass?.root) classes.push(this.cssClass.root);
			return classes.join(" ");
		}
		_createModelDetail(args) {
			return {
				modelValue: args.modelValue,
				currentValue: args.modelValue,
				oldValue: args.oldValue,
				value: args.modelValue,
				selected: args.modelValue,
				label: this.label ?? "",
				sourceEvent: args.sourceEvent
			};
		}
		_emitClick(detail) {
			dispatchMonoEvent(this, "click", detail);
		}
		_emitClose(detail) {
			dispatchMonoEvent(this, "close", detail);
		}
		_handleClick(event) {
			if (this.disabled) {
				event.preventDefault();
				event.stopPropagation();
				return;
			}
			const oldValue = this.modelValue;
			let nextValue = this.modelValue;
			if (this.clickable && !this.href) {
				nextValue = !this.modelValue;
				this.modelValue = nextValue;
				this.selected = nextValue;
			}
			const detail = this._createModelDetail({
				modelValue: nextValue,
				oldValue,
				sourceEvent: event
			});
			this._emitClick(detail);
		}
		_handleKeyDown(event) {
			if (this.disabled) return;
			if (event.key === "Enter" || event.key === " ") {
				event.preventDefault();
				this._chipElement?.click();
			}
			if ((event.key === "Backspace" || event.key === "Delete") && this.removable) {
				event.preventDefault();
				const detail = this._createModelDetail({
					modelValue: this.modelValue,
					oldValue: this.modelValue,
					sourceEvent: event
				});
				this._emitClose(detail);
			}
		}
		_handleFocus() {
			this._isActive = true;
		}
		_handleBlur() {
			this._isActive = false;
		}
		_handleClose(event) {
			event.preventDefault();
			event.stopPropagation();
			if (this.disabled) return;
			const detail = this._createModelDetail({
				modelValue: this.modelValue,
				oldValue: this.modelValue,
				sourceEvent: event
			});
			this._emitClose(detail);
		}
		focus() {
			this._chipElement?.focus();
		}
		blur() {
			this._chipElement?.blur();
		}
		click() {
			this._chipElement?.click();
		}
	}
	__decorate([property({ type: String })], MonoChipCoreClass.prototype, "size", void 0);
	__decorate([property({ type: String })], MonoChipCoreClass.prototype, "color", void 0);
	__decorate([property({ type: String })], MonoChipCoreClass.prototype, "variant", void 0);
	__decorate([property({ type: String })], MonoChipCoreClass.prototype, "rounded", void 0);
	__decorate([property({ type: String })], MonoChipCoreClass.prototype, "label", void 0);
	__decorate([property({
		reflect: true,
		converter: booleanStringConverter
	})], MonoChipCoreClass.prototype, "dot", void 0);
	__decorate([property({
		reflect: true,
		converter: booleanStringConverter
	})], MonoChipCoreClass.prototype, "removable", void 0);
	__decorate([property({
		reflect: true,
		converter: booleanStringConverter
	})], MonoChipCoreClass.prototype, "clickable", void 0);
	__decorate([property({
		reflect: true,
		converter: booleanStringConverter
	})], MonoChipCoreClass.prototype, "disabled", void 0);
	__decorate([property({
		attribute: "model-value",
		reflect: true,
		converter: booleanStringConverter
	})], MonoChipCoreClass.prototype, "modelValue", void 0);
	__decorate([property({
		reflect: true,
		converter: booleanStringConverter
	})], MonoChipCoreClass.prototype, "selected", void 0);
	__decorate([property({ type: String })], MonoChipCoreClass.prototype, "href", void 0);
	__decorate([property({ type: String })], MonoChipCoreClass.prototype, "target", void 0);
	__decorate([property({
		type: String,
		attribute: "icon-position"
	})], MonoChipCoreClass.prototype, "iconPosition", void 0);
	__decorate([property({
		type: String,
		attribute: "aria-label"
	})], MonoChipCoreClass.prototype, "ariaLabelText", void 0);
	__decorate([property({
		type: String,
		attribute: "close-label"
	})], MonoChipCoreClass.prototype, "closeLabel", void 0);
	__decorate([property({ attribute: false })], MonoChipCoreClass.prototype, "cssClass", void 0);
	__decorate([state()], MonoChipCoreClass.prototype, "_isActive", void 0);
	__decorate([state()], MonoChipCoreClass.prototype, "_hasIcon", void 0);
	__decorate([query("div > span, div > a")], MonoChipCoreClass.prototype, "_chipElement", void 0);
	return MonoChipCoreClass;
};
//#endregion
//#region src/components/chip/chip.css?raw
var chip_default = "/* =========================================================================\r\n   mono-chip — a port of Basecoat's `.badge` (basecoat-css@1.0.2, vega style).\r\n\r\n   Styled by ATTRIBUTE, like Basecoat — and the attributes mirror the element's\r\n   props one for one, so hand-written markup reads like the Lit / Vue tag:\r\n\r\n     <mono-chip size=\"lg\" color=\"success\" variant=\"solid\" label=\"Active\" dot>\r\n     <span mono-chip mono-size=\"lg\" mono-color=\"success\" mono-variant=\"solid\" mono-has-dot>\r\n       <span mono-main>\r\n         <span mono-content>\r\n           <span mono-dot></span>\r\n           <span mono-label>Active</span>\r\n           <button mono-close><span mono-glyph class=\"i-mdi-close\"></span></button>\r\n         </span>\r\n       </span>\r\n     </span>\r\n\r\n   An absent attribute is the prop's default (`:not([mono-size])` = md,\r\n   `:not([mono-color])` = primary, `:not([mono-variant])` = soft, no\r\n   `mono-rounded` = the pill). The element renders these on its root (both\r\n   builds) plus the states `mono-has-dot` (the dot PART is `mono-dot`, so the state\r\n   spells itself out) / `mono-removable` / `mono-clickable` /\r\n   `mono-disabled` / `mono-selected` and `mono-icon-position=\"right\"`. The old\r\n   classes (`.mono-chip.md.soft-primary`, `.chip-label`, `.chip-close`) are\r\n   still emitted as inert hooks until 2.0 but no rule here reads them — except\r\n   `rounded-<step>`, which is GONE: that is Tailwind/UnoCSS's own utility\r\n   namespace, so on a page shipping those it was never inert (it rounded the\r\n   chip's outer box). Use `mono-rounded` / the `rounded` prop.\r\n\r\n   Selector map (ours ≡ upstream):\r\n     [mono-chip]                   ≡ the layout box only — NOT painted (see below)\r\n     [mono-main]                   ≡ .badge (inline-flex w-fit shrink-0 items-center\r\n                                     justify-center overflow-hidden whitespace-nowrap,\r\n                                     h-5 gap-1 rounded-4xl border border-transparent\r\n                                     px-2 py-0.5 text-xs font-medium transition-all,\r\n                                     focus-visible:border-ring ring-[3px] ring-ring/50)\r\n     [mono-variant=\"solid\"]        ≡ .badge[data-variant='primary'] (bg-c text-c-foreground,\r\n                                     [a]:hover:bg-c/80) — generalised to every hue\r\n     [mono-variant=\"soft\"]         ≡ .badge[data-variant='destructive'] (bg-c/10 text-c,\r\n                                     [a]:hover:bg-c/20, dark bg-c/20) — generalised; the DEFAULT\r\n     [mono-variant=\"outline\"]      ≡ .badge[data-variant='outline'] (border-border text-foreground,\r\n                                     [a]:hover:bg-muted) + the hue on the edge and the ink\r\n     [mono-color=\"secondary\"]      ≡ .badge[data-variant='secondary'] (the muted surface pair)\r\n     [mono-size=\"md\"]              ≡ .badge's own h-5 px-2 text-xs; the other five are EXTENSION\r\n                                     (Basecoat ships one badge size)\r\n     [mono-rounded=\"…\"]            ≡ EXTENSION (the shared corner ladder; unset = rounded-4xl)\r\n     [mono-close]                  ≡ .combobox-chip-remove (opacity-50 hover:opacity-100, svg size-3.5)\r\n     [mono-has-dot] / [mono-dot] / [mono-selected] / [mono-clickable] ≡ EXTENSION\r\n     [mono-disabled]               ≡ .btn disabled:opacity-50\r\n     [mono-status-dot]             ≡ EXTENSION (the standalone status-dot helper)\r\n\r\n   WHY THE ROOT PAINTS NOTHING. `[mono-chip]` is also what a FIELD's internal\r\n   chip carries: `<mono-tag-input>` renders Basecoat combobox chips as\r\n   `[mono-chip] > [mono-chip-main] > …` and paints them in tag-input.css. Those\r\n   rules are `[mono-tag-input] [mono-chip]` = (0,2,0) and win over this sheet,\r\n   but only where they overlap — so this sheet keeps the root to layout plus\r\n   custom properties (which a field's rules simply don't read) and paints the\r\n   badge on `[mono-main]`, a part name a field chip does not have. The two never\r\n   collide, and a real `<mono-chip>` slotted INTO a field keeps its own look.\r\n\r\n   Specificity contract (same as the pre-port class sheet): a part's RESTING\r\n   rule is exactly one attribute strong — `:where([mono-chip]) [mono-label]` =\r\n   (0,1,0) — so a utility class handed in through `cssClass` wins by source\r\n   order, while the prop and state rules stay heavier and win over it.\r\n\r\n   Inner parts: [mono-main] > [mono-content] > [mono-dot] / [data-mono-slot=icon]\r\n   / [mono-label] / [mono-close] > [mono-glyph].\r\n\r\n   FLAVORS set `--mono-chip-{radius,border-width,font-weight,letter-spacing,\r\n   text-transform}` and the VARIANT-scoped paint knobs\r\n   `--mono-chip-{soft,solid,outline}-{bg,color,border-color}` (the shared\r\n   `--mono-chip-bg` / `-color` is the CONSUMER's blanket override and repaints\r\n   all three looks at once)` and the per-size `-height-<size>` /\r\n   `-padding-x-<size>` / `-gap-<size>` / `-font-size-<size>` /\r\n   `-glyph-size-<size>` (the size-agnostic twin of each of those is the\r\n   CONSUMER's override — a flavor writing it would flatten the whole ladder);\r\n   every fallback here is vega's value\r\n   (`node scripts/basecoat-styles.mjs --varying \"^\\.badge\"`).\r\n   ========================================================================= */\r\n\r\nmono-chip {\r\n  display: inline-block;\r\n}\r\n\r\n/* =========================================\r\n   Root — layout and the palette. NOTHING here paints (see the header).\r\n   ========================================= */\r\n\r\n[mono-chip] {\r\n  /* ── the ten roles, each a public knob over a Basecoat token ──────────── */\r\n  --_mono-chip-primary: var(--mono-chip-primary, var(--primary));\r\n  --_mono-chip-primary-foreground: var(--mono-chip-primary-foreground, var(--primary-foreground));\r\n  --_mono-chip-secondary: var(--mono-chip-secondary, var(--secondary));\r\n  --_mono-chip-secondary-foreground: var(--mono-chip-secondary-foreground, var(--secondary-foreground));\r\n  --_mono-chip-success: var(--mono-chip-success, var(--success));\r\n  --_mono-chip-success-foreground: var(--mono-chip-success-foreground, var(--success-foreground));\r\n  --_mono-chip-danger: var(--mono-chip-danger, var(--destructive));\r\n  --_mono-chip-danger-foreground: var(--mono-chip-danger-foreground, var(--destructive-foreground));\r\n  --_mono-chip-warning: var(--mono-chip-warning, var(--warning));\r\n  --_mono-chip-warning-foreground: var(--mono-chip-warning-foreground, var(--warning-foreground));\r\n  --_mono-chip-info: var(--mono-chip-info, var(--info));\r\n  --_mono-chip-info-foreground: var(--mono-chip-info-foreground, var(--info-foreground));\r\n  --_mono-chip-teal: var(--mono-chip-teal, var(--teal));\r\n  --_mono-chip-teal-foreground: var(--mono-chip-teal-foreground, var(--teal-foreground));\r\n  --_mono-chip-purple: var(--mono-chip-purple, var(--purple));\r\n  --_mono-chip-purple-foreground: var(--mono-chip-purple-foreground, var(--purple-foreground));\r\n  --_mono-chip-neutral: var(--mono-chip-neutral, var(--neutral));\r\n  --_mono-chip-neutral-foreground: var(--mono-chip-neutral-foreground, var(--neutral-foreground));\r\n  --_mono-chip-dark: var(--mono-chip-dark, var(--dark));\r\n  --_mono-chip-dark-foreground: var(--mono-chip-dark-foreground, var(--dark-foreground));\r\n\r\n  /* the colour in play — `primary` unless a [mono-color] rule re-points it */\r\n  --_mono-chip-c: var(--_mono-chip-primary);\r\n  --_mono-chip-c-foreground: var(--_mono-chip-primary-foreground);\r\n\r\n  /* ── md metrics live on the unqualified root ON PURPOSE ────────────────────\r\n     basecoat@1.0.2 styles/vega.css .badge — h-5 gap-1 rounded-4xl border\r\n     border-transparent px-2 py-0.5 text-xs font-medium, [&>svg]:size-3 */\r\n  --_mono-chip-height: var(--mono-chip-height, var(--_mono-chip-height-preset, var(--mono-chip-height-md, calc(var(--mono-spacing) * 5))));\r\n  --_mono-chip-padding-x: var(--mono-chip-padding-x, var(--_mono-chip-padding-x-preset, var(--mono-chip-padding-x-md, calc(var(--mono-spacing) * 2))));\r\n  --_mono-chip-gap: var(--mono-chip-gap, var(--_mono-chip-gap-preset, var(--mono-chip-gap-md, var(--mono-spacing))));\r\n  --_mono-chip-font-size: var(--mono-chip-font-size, var(--_mono-chip-font-size-preset, var(--mono-chip-font-size-md, var(--mono-text-xs))));\r\n  --_mono-chip-glyph-size: var(--mono-chip-glyph-size, var(--_mono-chip-glyph-size-preset, var(--mono-chip-glyph-size-md, calc(var(--mono-spacing) * 3))));\r\n  /* `rounded-4xl` is the pill; a `rounded` step writes the preset tier, and an\r\n     explicit --mono-chip-radius still wins over the prop */\r\n  --_mono-chip-radius: var(--mono-chip-radius, var(--_mono-chip-radius-preset, var(--mono-radius-4xl)));\r\n  --_mono-chip-border-width: var(--mono-chip-border-width, var(--mono-border-width));\r\n  --_mono-chip-font-weight: var(--mono-chip-font-weight, var(--mono-font-weight-medium));\r\n\r\n  --_mono-chip-ring-color: var(--mono-chip-ring-color, var(--ring));\r\n  --_mono-chip-ring-width: var(--mono-chip-ring-width, var(--mono-ring-width));\r\n  --_mono-chip-ring-alpha: var(--mono-chip-ring-alpha, var(--mono-ring-alpha));\r\n\r\n  display: inline-flex;\r\n  align-items: center;\r\n  max-width: 100%;\r\n  vertical-align: middle;\r\n  line-height: 1;\r\n}\r\n\r\n/* =========================================\r\n   The badge box — `.badge`\r\n   ========================================= */\r\n\r\n/* basecoat@1.0.2 components/badge.css .badge — inline-flex w-fit shrink-0\r\n   items-center justify-center overflow-hidden whitespace-nowrap\r\n   [&>svg]:pointer-events-none */\r\n:where([mono-chip]) [mono-main] {\r\n  display: inline-flex;\r\n  width: fit-content;\r\n  max-width: 100%;\r\n  flex-shrink: 0;\r\n  align-items: center;\r\n  justify-content: center;\r\n  overflow: hidden;\r\n  white-space: nowrap;\r\n  box-sizing: border-box;\r\n  height: var(--_mono-chip-height);\r\n  gap: var(--_mono-chip-gap);\r\n  padding-inline: var(--_mono-chip-padding-x);\r\n  border: var(--_mono-chip-border-width) solid transparent;\r\n  border-radius: var(--_mono-chip-radius);\r\n  font-family: inherit;\r\n  font-size: var(--_mono-chip-font-size);\r\n  font-weight: var(--_mono-chip-font-weight);\r\n  letter-spacing: var(--mono-chip-letter-spacing, normal);\r\n  text-transform: var(--mono-chip-text-transform, none);\r\n  line-height: 1;\r\n  text-decoration: none;\r\n  user-select: none;\r\n  vertical-align: middle;\r\n  /* `transition-all`, narrowed to what a chip actually animates */\r\n  transition:\r\n    color var(--mono-duration) var(--mono-ease),\r\n    background-color var(--mono-duration) var(--mono-ease),\r\n    border-color var(--mono-duration) var(--mono-ease),\r\n    box-shadow var(--mono-duration) var(--mono-ease),\r\n    opacity var(--mono-duration) var(--mono-ease);\r\n  box-shadow: var(--_mono-chip-ring, 0 0 #0000);\r\n}\r\n\r\n/* A LINK chip is a control, not prose. Host stylesheets routinely paint a bare\r\n   `a` — VitePress's own `.vp-doc a` sets a weight and an underline at (0,1,1) —\r\n   and that out-specifies the (0,1,0) part rule above, so the anchor form\r\n   restates what such a rule hijacks, one attribute heavier. Measured: the docs'\r\n   light link chip came out at weight 500 while the shadow one, beyond that\r\n   sheet's reach, kept the component's own 600. The colour needs no restatement:\r\n   every variant rule is already (0,2,0).\r\n\r\n   DEVIATION from the specificity contract, for this form only — a `cssClass.main`\r\n   utility that sets font-weight or text-decoration on a LINK chip now needs\r\n   `!important` (or the `--mono-chip-font-weight` knob). */\r\n[mono-chip] a[mono-main] {\r\n  font-weight: var(--_mono-chip-font-weight);\r\n  text-decoration: none;\r\n}\r\n\r\n/* basecoat@1.0.2 components/badge.css .badge — focus-visible:border-ring\r\n   focus-visible:ring-[3px] focus-visible:ring-ring/50 */\r\n:where([mono-chip]) [mono-main]:focus-visible {\r\n  outline: none;\r\n  border-color: var(--_mono-chip-ring-color);\r\n  --_mono-chip-ring: 0 0 0 var(--_mono-chip-ring-width)\r\n    color-mix(in oklab, var(--_mono-chip-ring-color) var(--_mono-chip-ring-alpha), transparent);\r\n}\r\n\r\n/* =========================================\r\n   Sizes — EXTENSION: Basecoat ships ONE badge; md is its `.badge`\r\n   ========================================= */\r\n\r\n/* The ladder steps the same way the control heights do: 4px of box and one type\r\n   step per size, with md pinned to vega's h-5 / px-2 / text-xs. */\r\n[mono-chip][mono-size=\"xs\"] {\r\n  --_mono-chip-height-preset: var(--mono-chip-height-xs, calc(var(--mono-spacing) * 4));\r\n  --_mono-chip-padding-x-preset: var(--mono-chip-padding-x-xs, calc(var(--mono-spacing) * 1.5));\r\n  --_mono-chip-gap-preset: var(--mono-chip-gap-xs, calc(var(--mono-spacing) * 0.75));\r\n  --_mono-chip-font-size-preset: var(--mono-chip-font-size-xs, var(--mono-text-xs));\r\n  --_mono-chip-glyph-size-preset: var(--mono-chip-glyph-size-xs, calc(var(--mono-spacing) * 2.5));\r\n}\r\n\r\n[mono-chip][mono-size=\"sm\"] {\r\n  --_mono-chip-height-preset: var(--mono-chip-height-sm, calc(var(--mono-spacing) * 4.5));\r\n  --_mono-chip-padding-x-preset: var(--mono-chip-padding-x-sm, calc(var(--mono-spacing) * 1.75));\r\n  --_mono-chip-gap-preset: var(--mono-chip-gap-sm, calc(var(--mono-spacing) * 0.875));\r\n  --_mono-chip-font-size-preset: var(--mono-chip-font-size-sm, var(--mono-text-xs));\r\n  --_mono-chip-glyph-size-preset: var(--mono-chip-glyph-size-sm, calc(var(--mono-spacing) * 2.75));\r\n}\r\n\r\n[mono-chip][mono-size=\"lg\"] {\r\n  --_mono-chip-height-preset: var(--mono-chip-height-lg, calc(var(--mono-spacing) * 6));\r\n  --_mono-chip-padding-x-preset: var(--mono-chip-padding-x-lg, calc(var(--mono-spacing) * 2.5));\r\n  --_mono-chip-gap-preset: var(--mono-chip-gap-lg, calc(var(--mono-spacing) * 1.25));\r\n  --_mono-chip-font-size-preset: var(--mono-chip-font-size-lg, var(--mono-text-sm));\r\n  --_mono-chip-glyph-size-preset: var(--mono-chip-glyph-size-lg, calc(var(--mono-spacing) * 3.5));\r\n}\r\n\r\n[mono-chip][mono-size=\"xl\"] {\r\n  --_mono-chip-height-preset: var(--mono-chip-height-xl, calc(var(--mono-spacing) * 7));\r\n  --_mono-chip-padding-x-preset: var(--mono-chip-padding-x-xl, calc(var(--mono-spacing) * 3));\r\n  --_mono-chip-gap-preset: var(--mono-chip-gap-xl, calc(var(--mono-spacing) * 1.5));\r\n  --_mono-chip-font-size-preset: var(--mono-chip-font-size-xl, var(--mono-text-sm));\r\n  --_mono-chip-glyph-size-preset: var(--mono-chip-glyph-size-xl, calc(var(--mono-spacing) * 4));\r\n}\r\n\r\n[mono-chip][mono-size=\"xxl\"] {\r\n  --_mono-chip-height-preset: var(--mono-chip-height-xxl, calc(var(--mono-spacing) * 8));\r\n  --_mono-chip-padding-x-preset: var(--mono-chip-padding-x-xxl, calc(var(--mono-spacing) * 3.5));\r\n  --_mono-chip-gap-preset: var(--mono-chip-gap-xxl, calc(var(--mono-spacing) * 1.75));\r\n  --_mono-chip-font-size-preset: var(--mono-chip-font-size-xxl, var(--mono-text-base));\r\n  --_mono-chip-glyph-size-preset: var(--mono-chip-glyph-size-xxl, calc(var(--mono-spacing) * 4.5));\r\n}\r\n\r\n/* =========================================\r\n   Rounded — EXTENSION: the shared corner ladder. Unset is vega's rounded-4xl.\r\n   ========================================= */\r\n\r\n[mono-chip][mono-rounded=\"none\"] { --_mono-chip-radius-preset: 0; }\r\n[mono-chip][mono-rounded=\"xs\"] { --_mono-chip-radius-preset: calc(var(--mono-radius-sm) / 2); }\r\n[mono-chip][mono-rounded=\"sm\"] { --_mono-chip-radius-preset: var(--mono-radius-sm); }\r\n[mono-chip][mono-rounded=\"md\"] { --_mono-chip-radius-preset: var(--mono-radius-md); }\r\n[mono-chip][mono-rounded=\"lg\"] { --_mono-chip-radius-preset: var(--mono-radius-lg); }\r\n[mono-chip][mono-rounded=\"xl\"] { --_mono-chip-radius-preset: var(--mono-radius-xl); }\r\n[mono-chip][mono-rounded=\"xxl\"] { --_mono-chip-radius-preset: var(--mono-radius-2xl); }\r\n[mono-chip][mono-rounded=\"full\"] { --_mono-chip-radius-preset: var(--mono-radius-full); }\r\n\r\n/* =========================================\r\n   Colours — each publishes the pair the variants read\r\n   ========================================= */\r\n\r\n[mono-chip][mono-color=\"primary\"] {\r\n  --_mono-chip-c: var(--_mono-chip-primary);\r\n  --_mono-chip-c-foreground: var(--_mono-chip-primary-foreground);\r\n}\r\n\r\n/* basecoat@1.0.2 styles/vega.css .badge[data-variant='secondary'] —\r\n   bg-secondary text-secondary-foreground: a SURFACE pair, not a hue, so its\r\n   `soft` and `solid` land on the same muted plate (shadcn's meaning). */\r\n[mono-chip][mono-color=\"secondary\"] {\r\n  --_mono-chip-c: var(--_mono-chip-secondary);\r\n  --_mono-chip-c-foreground: var(--_mono-chip-secondary-foreground);\r\n}\r\n\r\n[mono-chip][mono-color=\"success\"] {\r\n  --_mono-chip-c: var(--_mono-chip-success);\r\n  --_mono-chip-c-foreground: var(--_mono-chip-success-foreground);\r\n}\r\n\r\n[mono-chip][mono-color=\"danger\"] {\r\n  --_mono-chip-c: var(--_mono-chip-danger);\r\n  --_mono-chip-c-foreground: var(--_mono-chip-danger-foreground);\r\n}\r\n\r\n[mono-chip][mono-color=\"warning\"] {\r\n  --_mono-chip-c: var(--_mono-chip-warning);\r\n  --_mono-chip-c-foreground: var(--_mono-chip-warning-foreground);\r\n}\r\n\r\n[mono-chip][mono-color=\"info\"] {\r\n  --_mono-chip-c: var(--_mono-chip-info);\r\n  --_mono-chip-c-foreground: var(--_mono-chip-info-foreground);\r\n}\r\n\r\n[mono-chip][mono-color=\"teal\"] {\r\n  --_mono-chip-c: var(--_mono-chip-teal);\r\n  --_mono-chip-c-foreground: var(--_mono-chip-teal-foreground);\r\n}\r\n\r\n[mono-chip][mono-color=\"purple\"] {\r\n  --_mono-chip-c: var(--_mono-chip-purple);\r\n  --_mono-chip-c-foreground: var(--_mono-chip-purple-foreground);\r\n}\r\n\r\n[mono-chip][mono-color=\"neutral\"] {\r\n  --_mono-chip-c: var(--_mono-chip-neutral);\r\n  --_mono-chip-c-foreground: var(--_mono-chip-neutral-foreground);\r\n}\r\n\r\n[mono-chip][mono-color=\"dark\"] {\r\n  --_mono-chip-c: var(--_mono-chip-dark);\r\n  --_mono-chip-c-foreground: var(--_mono-chip-dark-foreground);\r\n}\r\n\r\n/* =========================================\r\n   Variants\r\n   ========================================= */\r\n\r\n/* `soft` is the DEFAULT and is Basecoat's tonal badge.\r\n   basecoat@1.0.2 styles/vega.css .badge[data-variant='destructive'] —\r\n   bg-destructive/10 text-destructive dark:bg-destructive/20 (the alpha pair\r\n   travels as --mono-mode-tint, which is what makes it dark-mode correct). */\r\n[mono-chip]:is(:not([mono-variant]), [mono-variant=\"soft\"]) > [mono-main] {\r\n  background-color: var(--mono-chip-bg, var(--mono-chip-soft-bg, color-mix(in oklab, var(--_mono-chip-c) var(--mono-mode-tint), transparent)));\r\n  color: var(--mono-chip-color, var(--mono-chip-soft-color, var(--_mono-chip-c)));\r\n  border-color: var(--mono-chip-border-color, var(--mono-chip-soft-border-color, transparent));\r\n}\r\n\r\n/* `secondary` is a surface, not a hue: tinting it would wash it out, so the\r\n   soft chip wears the plate itself (`.badge[data-variant='secondary']`). */\r\n[mono-chip][mono-color=\"secondary\"]:is(:not([mono-variant]), [mono-variant=\"soft\"]) > [mono-main] {\r\n  background-color: var(--mono-chip-bg, var(--mono-chip-soft-bg, var(--_mono-chip-secondary)));\r\n  color: var(--mono-chip-color, var(--mono-chip-soft-color, var(--_mono-chip-secondary-foreground)));\r\n}\r\n\r\n/* basecoat@1.0.2 styles/vega.css .badge:not([data-variant]), .badge[data-variant='primary']\r\n   — bg-primary text-primary-foreground */\r\n[mono-chip][mono-variant=\"solid\"] > [mono-main] {\r\n  background-color: var(--mono-chip-bg, var(--mono-chip-solid-bg, var(--_mono-chip-c)));\r\n  color: var(--mono-chip-color, var(--mono-chip-solid-color, var(--_mono-chip-c-foreground)));\r\n  border-color: var(--mono-chip-border-color, var(--mono-chip-solid-border-color, transparent));\r\n}\r\n\r\n/* basecoat@1.0.2 styles/vega.css .badge[data-variant='outline'] — border-border\r\n   text-foreground — EXTENSION: the edge and the ink take the role's colour so\r\n   `outline` reads as the same family as the other two. */\r\n[mono-chip][mono-variant=\"outline\"] > [mono-main] {\r\n  background-color: var(--mono-chip-bg, var(--mono-chip-outline-bg, transparent));\r\n  color: var(--mono-chip-color, var(--mono-chip-outline-color, var(--_mono-chip-c)));\r\n  border-color: var(--mono-chip-border-color, var(--mono-chip-outline-border-color, var(--_mono-chip-c)));\r\n}\r\n\r\n[mono-chip][mono-color=\"secondary\"][mono-variant=\"outline\"] > [mono-main] {\r\n  color: var(--mono-chip-color, var(--foreground));\r\n  border-color: var(--mono-chip-border-color, var(--border));\r\n}\r\n\r\n/* =========================================\r\n   Interactive — a clickable / linked chip\r\n   ========================================= */\r\n\r\n/* basecoat@1.0.2 styles/vega.css .badge:not([data-variant]), .badge[data-variant='primary']\r\n   — [a]:hover:bg-primary/80: only a LINK badge reacts upstream; ours also\r\n   reacts when `clickable` made it a button (same gesture, no href). */\r\n[mono-chip][mono-clickable] > [mono-main] {\r\n  cursor: pointer;\r\n}\r\n\r\n@media (hover: hover) {\r\n  [mono-chip][mono-clickable]:not([mono-disabled])[mono-variant=\"solid\"] > [mono-main]:hover {\r\n    background-color: color-mix(in oklab, var(--_mono-chip-c) 80%, transparent);\r\n  }\r\n\r\n  /* .badge[data-variant='destructive'] — [a]:hover:bg-destructive/20 */\r\n  [mono-chip][mono-clickable]:not([mono-disabled]):is(:not([mono-variant]), [mono-variant=\"soft\"]) > [mono-main]:hover {\r\n    background-color: color-mix(in oklab, var(--_mono-chip-c) var(--mono-mode-tint-hover), transparent);\r\n  }\r\n\r\n  /* `secondary` is a plate, not a tint: darken it the way the secondary button\r\n     does (basecoat@1.0.2 styles/vega.css .btn[data-variant='secondary']). */\r\n  [mono-chip][mono-clickable]:not([mono-disabled])[mono-color=\"secondary\"]:is(:not([mono-variant]), [mono-variant=\"soft\"]) > [mono-main]:hover {\r\n    background-color: color-mix(in oklch, var(--_mono-chip-secondary), var(--foreground) 5%);\r\n  }\r\n\r\n  /* .badge[data-variant='outline'] — [a]:hover:bg-muted */\r\n  [mono-chip][mono-clickable]:not([mono-disabled])[mono-variant=\"outline\"] > [mono-main]:hover {\r\n    background-color: var(--mono-mode-ghost-hover);\r\n  }\r\n}\r\n\r\n/* EXTENSION — `selected` rings the chip in its own colour, the one state\r\n   Basecoat's badge has no equivalent for (it is not a toggle upstream). */\r\n[mono-chip][mono-selected] > [mono-main] {\r\n  --_mono-chip-ring: 0 0 0 var(--_mono-chip-ring-width)\r\n    color-mix(in oklab, var(--_mono-chip-c) var(--_mono-chip-ring-alpha), transparent);\r\n  border-color: var(--_mono-chip-c);\r\n}\r\n\r\n/* basecoat@1.0.2 components/button.css .btn — disabled:pointer-events-none\r\n   disabled:opacity-50 */\r\n[mono-chip][mono-disabled] > [mono-main] {\r\n  opacity: 0.5;\r\n  cursor: not-allowed;\r\n  pointer-events: none;\r\n}\r\n\r\n/* =========================================\r\n   Inner content\r\n   ========================================= */\r\n\r\n:where([mono-chip]) [mono-content] {\r\n  display: inline-flex;\r\n  align-items: center;\r\n  justify-content: center;\r\n  gap: inherit;\r\n  min-width: 0;\r\n  max-width: 100%;\r\n  height: 100%;\r\n  line-height: 1;\r\n}\r\n\r\n:where([mono-chip]) [mono-label] {\r\n  display: inline-flex;\r\n  align-items: center;\r\n  justify-content: center;\r\n  min-width: 0;\r\n  max-width: 100%;\r\n  overflow: hidden;\r\n  text-overflow: ellipsis;\r\n  line-height: 1;\r\n}\r\n\r\n/* EXTENSION — the leading status dot. It is the role's colour at full strength,\r\n   which reads on both the tinted `soft` plate and the solid one (`currentColor`\r\n   there). */\r\n:where([mono-chip]) [mono-dot] {\r\n  flex: 0 0 auto;\r\n  width: var(--mono-chip-dot-size, calc(var(--mono-spacing) * 1.5));\r\n  height: var(--mono-chip-dot-size, calc(var(--mono-spacing) * 1.5));\r\n  border-radius: var(--mono-radius-full);\r\n  background: currentColor;\r\n}\r\n\r\n/* The shadow build renders the icon wrapper on every chip and marks the empty\r\n   one; this hides it so both builds measure the same content box. */\r\n[mono-chip] [data-mono-slot=\"icon\"][mono-empty] {\r\n  display: none;\r\n}\r\n\r\n/* `[&>svg]:size-3!` — our icon is a slotted element or a mask span, sized by\r\n   the same token as the close glyph */\r\n:where([mono-chip]) [data-mono-slot=\"icon\"],\r\n:where([mono-chip]) [mono-main] > svg {\r\n  display: inline-flex;\r\n  flex: 0 0 auto;\r\n  align-items: center;\r\n  justify-content: center;\r\n  width: var(--_mono-chip-glyph-size);\r\n  height: var(--_mono-chip-glyph-size);\r\n  line-height: 1;\r\n  pointer-events: none;\r\n}\r\n\r\n:where([mono-chip]) [data-mono-slot=\"icon\"] > * {\r\n  display: block;\r\n  width: 100%;\r\n  height: 100%;\r\n}\r\n\r\n/* basecoat@1.0.2 styles/vega.css .combobox-chip-remove — -ms-1 opacity-50\r\n   hover:opacity-100, [&>svg]:size-3.5 — the same affordance a field chip uses */\r\n:where([mono-chip]) [mono-close] {\r\n  appearance: none;\r\n  display: inline-flex;\r\n  flex: 0 0 auto;\r\n  align-items: center;\r\n  justify-content: center;\r\n  width: var(--_mono-chip-glyph-size);\r\n  height: var(--_mono-chip-glyph-size);\r\n  margin: 0;\r\n  padding: 0;\r\n  border: 0;\r\n  border-radius: var(--mono-radius-full);\r\n  background: transparent;\r\n  color: inherit;\r\n  font: inherit;\r\n  line-height: 1;\r\n  cursor: pointer;\r\n  opacity: 0.5;\r\n  transition:\r\n    opacity var(--mono-duration) var(--mono-ease),\r\n    box-shadow var(--mono-duration) var(--mono-ease);\r\n  box-shadow: var(--_mono-chip-close-ring, 0 0 #0000);\r\n}\r\n\r\n@media (hover: hover) {\r\n  :where([mono-chip]) [mono-close]:hover {\r\n    opacity: 1;\r\n  }\r\n}\r\n\r\n:where([mono-chip]) [mono-close]:focus-visible {\r\n  outline: none;\r\n  opacity: 1;\r\n  --_mono-chip-close-ring: 0 0 0 var(--_mono-chip-ring-width)\r\n    color-mix(in oklab, currentColor var(--_mono-chip-ring-alpha), transparent);\r\n}\r\n\r\n:where([mono-chip]) [mono-close] :is([mono-glyph], svg) {\r\n  display: block;\r\n  width: 100%;\r\n  height: 100%;\r\n  flex-shrink: 0;\r\n}\r\n\r\n:where([mono-chip]) [mono-close] [mono-glyph] > svg {\r\n  width: 100%;\r\n  height: 100%;\r\n}\r\n\r\n/* =========================================\r\n   Status dot — EXTENSION: `<mono-status-dot>`, a label with a state dot\r\n   ========================================= */\r\n\r\nmono-status-dot {\r\n  display: inline-block;\r\n}\r\n\r\n[mono-status-dot] {\r\n  --_mono-status-dot-c: var(--mono-status-dot-color, var(--success));\r\n  display: inline-flex;\r\n  align-items: center;\r\n  gap: var(--mono-status-dot-gap, calc(var(--mono-spacing) * 1.5));\r\n  font-family: inherit;\r\n  font-size: var(--mono-status-dot-font-size, var(--mono-text-xs));\r\n  font-weight: var(--mono-status-dot-font-weight, var(--mono-font-weight-medium));\r\n  line-height: 1;\r\n  color: var(--_mono-status-dot-c);\r\n}\r\n\r\n[mono-status-dot][mono-status=\"offline\"] { --_mono-status-dot-c: var(--mono-status-dot-color, var(--neutral)); }\r\n[mono-status-dot][mono-status=\"busy\"] { --_mono-status-dot-c: var(--mono-status-dot-color, var(--destructive)); }\r\n[mono-status-dot][mono-status=\"away\"] { --_mono-status-dot-c: var(--mono-status-dot-color, var(--warning)); }\r\n/* `custom` takes the colour from the `color` prop, which the element writes\r\n   inline as --mono-status-dot-color */\r\n[mono-status-dot][mono-status=\"custom\"] { --_mono-status-dot-c: var(--mono-status-dot-color, var(--primary)); }\r\n\r\n:where([mono-status-dot]) [mono-dot] {\r\n  flex: 0 0 auto;\r\n  width: var(--mono-status-dot-size, calc(var(--mono-spacing) * 2));\r\n  height: var(--mono-status-dot-size, calc(var(--mono-spacing) * 2));\r\n  border-radius: var(--mono-radius-full);\r\n  background: currentColor;\r\n}\r\n\r\n[mono-status-dot][mono-pulse] [mono-dot] {\r\n  animation: mono-status-pulse 1.8s var(--mono-ease) infinite;\r\n}\r\n\r\n@keyframes mono-status-pulse {\r\n  0%,\r\n  100% {\r\n    box-shadow: 0 0 0 0 color-mix(in oklab, currentColor 40%, transparent);\r\n  }\r\n\r\n  50% {\r\n    box-shadow: 0 0 0 5px color-mix(in oklab, currentColor 0%, transparent);\r\n  }\r\n}\r\n\r\n@media (prefers-reduced-motion: reduce) {\r\n  :where([mono-chip]) :is([mono-main], [mono-close]) {\r\n    transition: none;\r\n  }\r\n\r\n  [mono-status-dot][mono-pulse] [mono-dot] {\r\n    animation: none;\r\n  }\r\n}\r\n";
//#endregion
//#region src/components/chip/mono-chip.ts
var MonoChip = class MonoChip extends MonoChipCore(LitElement) {
	constructor(..._args) {
		super(..._args);
		this._buckets = /* @__PURE__ */ new Map();
		this._slotsCaptured = false;
	}
	static {
		this.styles = [unsafeCSS(chip_default)];
	}
	createRenderRoot() {
		return this;
	}
	_renderLabel() {
		return html`
      <span class=${this._cls("chip-label", "label")} mono-label data-mono-slot="default">
        ${when(Boolean(this.label), () => this.label, () => nothing)}
      </span>
    `;
	}
	_renderDot() {
		return when(this.dot, () => html`<span class=${this._cls("chip-dot", "dot")} mono-dot aria-hidden="true"></span>`, () => nothing);
	}
	_renderClose() {
		return when(this.removable, () => html`
        <button
          class=${this._cls("chip-close", "close")}
          mono-close
          type="button"
          aria-label=${this.closeLabel}
          ?disabled=${this.disabled}
          data-mono-slot="close"
          @click=${this._handleClose}
        >
          ${bucketHasContent(this._buckets.get("close")) ? nothing : html`<span class="mono-icon i-mdi-close" mono-glyph aria-hidden="true"></span>`}
        </button>
      `, () => nothing);
	}
	_renderContent() {
		const hasIcon = this._hasIcon;
		return html`
      <span class=${this._cls(hasIcon ? this.iconPosition === "right" ? "chip-content icon-right" : "chip-content icon-left" : "chip-content", "content")} mono-content>
        ${this._renderDot()}

        ${when(hasIcon && this.iconPosition === "left", () => html`<span data-mono-slot="icon"></span>`, () => nothing)}

        ${this._renderLabel()}

        ${when(hasIcon && this.iconPosition === "right", () => html`<span data-mono-slot="icon"></span>`, () => nothing)}

        ${this._renderClose()}
      </span>
    `;
	}
	render() {
		const tabIndex = this._isInteractive && !this.disabled ? "0" : void 0;
		const ariaLabel = this.ariaLabelText ?? this.label;
		if (this.href) return html`
        <div
        class=${this._chipClasses}
        mono-chip
        mono-size=${this.size === "md" ? nothing : this.size}
        mono-color=${this.color === "primary" ? nothing : this.color}
        mono-variant=${this.variant === "soft" ? nothing : this.variant}
        mono-rounded=${this.rounded ? this.rounded : nothing}
        mono-icon-position=${this.iconPosition === "right" ? "right" : nothing}
        ?mono-has-dot=${this.dot}
        ?mono-removable=${this.removable}
        ?mono-clickable=${this.clickable || !!this.href}
        ?mono-disabled=${this.disabled}
        ?mono-selected=${this.selected || this._isActive}
      >
          <a
            class=${"mono-chip-native" + (this.cssClass?.main ? " " + this.cssClass.main : "")}
            mono-main
            href=${ifDefined(this.href)}
            target=${ifDefined(this.target)}
            role="button"
            aria-label=${ifDefined(ariaLabel)}
            aria-disabled=${this.disabled ? "true" : "false"}
            @click=${this._handleClick}
            @keydown=${this._handleKeyDown}
            @focus=${this._handleFocus}
            @blur=${this._handleBlur}
          >
            ${this._renderContent()}
          </a>
        </div>
      `;
		return html`
      <div
        class=${this._chipClasses}
        mono-chip
        mono-size=${this.size === "md" ? nothing : this.size}
        mono-color=${this.color === "primary" ? nothing : this.color}
        mono-variant=${this.variant === "soft" ? nothing : this.variant}
        mono-rounded=${this.rounded ? this.rounded : nothing}
        mono-icon-position=${this.iconPosition === "right" ? "right" : nothing}
        ?mono-has-dot=${this.dot}
        ?mono-removable=${this.removable}
        ?mono-clickable=${this.clickable || !!this.href}
        ?mono-disabled=${this.disabled}
        ?mono-selected=${this.selected || this._isActive}
      >
        <span
          class=${ifDefined(this.cssClass?.main)}
          mono-main
          role=${this._isInteractive ? "button" : "status"}
          tabindex=${ifDefined(tabIndex)}
          aria-label=${ifDefined(ariaLabel)}
          aria-disabled=${this.disabled ? "true" : "false"}
          @click=${this._handleClick}
          @keydown=${this._handleKeyDown}
          @focus=${this._handleFocus}
          @blur=${this._handleBlur}
        >
          ${this._renderContent()}
        </span>
      </div>
    `;
	}
	connectedCallback() {
		super.connectedCallback();
		this.setAttribute("role", "status");
		this._captureSlots();
		if (this.isConnected) this.performUpdate();
	}
	/**
	* In light DOM mode, <slot> elements no longer project the host's children.
	* Capture them once before Lit's first render replaces the children, then
	* re-place them in the render template at the right positions. `light-slots`
	* carries comments and zero-length Fragment text nodes with the content they
	* anchor and removes *only* what it buckets — the previous inline logic deleted
	* every original child, dropping Vue's anchors for good.
	*/
	_captureSlots() {
		if (this._slotsCaptured) return;
		this._slotsCaptured = true;
		this._buckets = captureLightSlots(this, { names: ["icon", "close"] });
		this._hasIcon = bucketHasContent(this._buckets.get("icon"));
	}
	updated(changed) {
		super.updated(changed);
		this._placeSlot("icon", this._buckets.get("icon") ?? []);
		this._placeSlot("close", this._buckets.get("close") ?? []);
		if (!this.label) this._placeSlot("default", this._buckets.get("default") ?? []);
	}
	_placeSlot(name, nodes) {
		if (!nodes.length) return;
		const target = this.querySelector(`[data-mono-slot="${name}"]`);
		if (!target) return;
		for (const node of nodes) placeSlotNode(target, node);
	}
};
MonoChip = __decorate([customElement("mono-chip")], MonoChip);
//#endregion
//#region src/components/chip/mono-status-dot.ts
/**
* `mono-status-dot` — a small status indicator. Already a real shadow-DOM
* LitElement (default render root + `static styles`, native `<slot>`), so it is
* SSR-compatible as-is and shared verbatim by BOTH the light (`@mono-lit/helper/ui/chip`)
* and shadow (`@mono-lit/helper/ui/shadow/chip`) chip builds. It lives in its own
* module so the shadow chip build can register it WITHOUT importing the light
* `mono-chip` (which would collide with the shadow `mono-chip` class).
*
* It keeps the SAME `mono-status-dot` tag in both builds (it has no light/shadow
* variant — it is always a shadow-DOM element), so its registration is guarded
* (see bottom of file): whichever chip build loads first wins, and a page that
* loads both light + shadow chip won't throw a "already defined" registry error.
*/
var MonoStatusDot = class extends LitElement {
	static {
		this.styles = [unsafeCSS(chip_default)];
	}
	constructor() {
		super();
		this.state = "online";
		this.pulse = false;
		this.label = void 0;
		this.color = void 0;
	}
	get _statusClasses() {
		const classes = ["mono-status-dot", `sd-${this.state}`];
		if (this.pulse) classes.push("pulse");
		return classes.join(" ");
	}
	get _statusStyle() {
		if (!this.color) return void 0;
		return `--mono-status-dot-color:${this.color};`;
	}
	render() {
		return html`
      <span
        class=${this._statusClasses}
        mono-status-dot
        mono-status=${this.state === "online" ? nothing : this.state}
        ?mono-pulse=${this.pulse}
        style=${ifDefined(this._statusStyle)}
        role="status"
        aria-label=${ifDefined(this.label)}
      >
        <span class="sd-dot" mono-dot aria-hidden="true"></span>
        <span class="sd-label">
          ${when(Boolean(this.label), () => this.label, () => html`<slot></slot>`)}
        </span>
      </span>
    `;
	}
	focus() {
		this._statusElement?.focus();
	}
	blur() {
		this._statusElement?.blur();
	}
};
__decorate([property({ type: String })], MonoStatusDot.prototype, "state", void 0);
__decorate([property({
	reflect: true,
	converter: booleanStringConverter
})], MonoStatusDot.prototype, "pulse", void 0);
__decorate([property({ type: String })], MonoStatusDot.prototype, "label", void 0);
__decorate([property({ type: String })], MonoStatusDot.prototype, "color", void 0);
__decorate([query("span")], MonoStatusDot.prototype, "_statusElement", void 0);
defineMonoElement("mono-status-dot", MonoStatusDot);
//#endregion
//#region src/components/chip/chip-utils.ts
function generateChipRootClasses(props) {
	const classes = ["mono-chip"];
	classes.push(props.size ?? "md");
	if (props.rounded) classes.push(`rounded-${props.rounded}`);
	const variant = props.variant ?? "soft";
	const color = props.color ?? "primary";
	classes.push(`${variant}-${color}`);
	if (props.clickable) classes.push("clickable");
	if (props.removable) classes.push("removable");
	if (props.disabled) classes.push("disabled");
	if (props.selected) classes.push("selected");
	if (props.dot) classes.push("has-dot");
	return classes.join(" ");
}
function isInteractive(props) {
	return Boolean(!props.disabled && (props.clickable || props.href || props.removable));
}
function validateChipProps(props) {
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
		"soft",
		"solid",
		"outline"
	];
	const validRounded = [
		"none",
		"xs",
		"sm",
		"md",
		"lg",
		"xl",
		"xxl",
		"full"
	];
	if (props.size && !validSizes.includes(props.size)) return false;
	if (props.color && !validColors.includes(props.color)) return false;
	if (props.variant && !validVariants.includes(props.variant)) return false;
	if (props.rounded && !validRounded.includes(props.rounded)) return false;
	return true;
}
//#endregion
export { MonoChip, MonoStatusDot, generateChipRootClasses, isInteractive, validateChipProps };
