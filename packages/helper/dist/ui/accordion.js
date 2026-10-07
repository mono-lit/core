import { l as monoHostChildNodes } from "../mono-ui-CPV7rrdo.js";
import { t as customElement } from "../mono-element-B0kP_96P.js";
import { a as defineHybridPropAliases, i as defineHybridPropAlias, r as booleanStringConverter, t as __decorate } from "../decorate-DEXtNagw.js";
import { t as dispatchMonoEvent } from "../mono-event-Bi1qP9uN.js";
import { a as parkDetachedNodes, i as guardHostTextContent, s as placeSlotNode } from "../light-slots-DW1WgfgT.js";
import { LitElement, html, isServer, nothing, unsafeCSS } from "lit";
import { ref } from "lit/directives/ref.js";
import { property, query, state } from "lit/decorators.js";
//#region src/components/accordion/accordion-core.ts
/**
* `MonoAccordionCore` — all render-mode-agnostic logic for `mono-accordion`:
* reactive props, hybrid aliases, the camelCase attribute fallbacks, slot-presence
* `@state`, class/getter computation, click/toggle interactivity, and the
* imperative `focus/blur`. No `render()` — the light build keeps its
* `[data-mono-slot]` capture strategy and the shadow build uses native `<slot>`
* (each ships its own `render()`, mirroring `mono-card`).
*
* SSR-safe: no `document`/`window` access. `_headEl` (`@query`) is lazy and
* `focus/blur` only run client-side.
*/
var MonoAccordionCore = (superClass) => {
	class MonoAccordionCoreClass extends superClass {
		constructor(...args) {
			super(...args);
			this.size = "md";
			this.color = "primary";
			this.modelValue = false;
			this.disabled = false;
			this.cssClass = {};
			this.cssClassName = "";
			this._hasTitleSlotState = false;
			this._hasSubtitleSlotState = false;
			this._hasHeaderSlotState = false;
			this._hasIconSlotState = false;
			this._hasActionsSlotState = false;
			this._hasBodySlotState = false;
			this._rootEl = null;
			this.bindRoot = (el) => {
				this._rootEl = el ?? null;
				this._applyRootAttrs(this._rootEl);
			};
			defineHybridPropAliases(this, ["modelValue", "cssClass"]);
			defineHybridPropAlias(this, "label", "title");
			defineHybridPropAlias(this, "description", "subtitle");
			this.title = "";
			this.subtitle = "";
			/**
			* Vue support:
			*
			* <mono-accordion :cssClass="{}" />
			* <mono-accordion :css-class="{}" />
			* <mono-accordion :cssclass="{}" />
			*/
			Object.defineProperty(this, "css-class", {
				get: () => this.cssClass,
				set: (value) => {
					this._setCssClass(value);
				},
				configurable: true,
				enumerable: false
			});
			Object.defineProperty(this, "cssclass", {
				get: () => this.cssClass,
				set: (value) => {
					this._setCssClass(value);
				},
				configurable: true,
				enumerable: false
			});
		}
		static get observedAttributes() {
			return [
				...super.observedAttributes ?? [],
				"modelvalue",
				"css-class",
				"cssclass",
				"label",
				"description"
			];
		}
		attributeChangedCallback(name, oldValue, newValue) {
			super.attributeChangedCallback(name, oldValue, newValue);
			if (oldValue === newValue) return;
			if (name === "modelvalue") {
				this.modelValue = this._toBoolean(newValue);
				return;
			}
			if (name === "css-class" || name === "cssclass") {
				this._setCssClass(newValue);
				return;
			}
			if (name === "label") {
				this.title = newValue ?? "";
				return;
			}
			if (name === "description") this.subtitle = newValue ?? "";
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
		/**
		* The prop mirrors, each omitted at its default so `:not([mono-size])` means
		* "md" for hand-written markup exactly as it does for the element.
		*/
		_computeRootAttrs() {
			return {
				"mono-size": this.size === "md" ? null : this.size,
				"mono-color": this.color === "primary" ? null : this.color,
				"mono-open": this.modelValue ? "" : null,
				"mono-disabled": this.disabled ? "" : null,
				"mono-grouped": this._inGroup() ? "" : null
			};
		}
		/**
		* Is this item inside an accordion group?
		*
		* The CSS can see that for hand-written markup — `[mono-accordion-group] >
		* [mono-accordion]` — but not for the ELEMENT: the light build puts the
		* custom-element host between the group and the root, and the shadow build
		* puts a boundary there, and a selector crosses neither. So the element
		* detects its own group and writes it as an attribute, which is the one thing
		* that reaches the root in both builds.
		*
		* Only MEMBERSHIP, never position: "am I the last one?" would be answered
		* from however many siblings existed at this render, and appending a fourth
		* item does not re-render the third. The divider is the group's business and
		* rides its own `:last-child` (see accordion.css).
		*
		* `closest()` on the HOST, not the root: the group is the consumer's wrapper
		* around `<mono-accordion>`, so the host is what sits inside it.
		*/
		_inGroup() {
			if (typeof this.closest !== "function") return false;
			return Boolean(this.closest("[mono-accordion-group], .mono-accordion-group"));
		}
		_applyRootAttrs(root) {
			if (!root) return;
			if (!root.hasAttribute("mono-accordion")) root.setAttribute("mono-accordion", "");
			for (const [name, value] of Object.entries(this._computeRootAttrs())) if (value === null) root.removeAttribute(name);
			else if (root.getAttribute(name) !== value) root.setAttribute(name, value);
		}
		updated(changed) {
			super.updated?.(changed);
			this._applyRootAttrs(this._rootEl);
		}
		get _wrapperClasses() {
			return [
				"mono-accordion",
				this.size,
				this.color,
				this.modelValue ? "open" : "",
				this.disabled ? "disabled" : "",
				this.cssClassName,
				this.cssClass?.root
			].filter(Boolean).join(" ");
		}
		get _hasTitleContent() {
			return Boolean(this.title) || this._hasTitleSlotState;
		}
		get _hasSubtitleContent() {
			return Boolean(this.subtitle) || this._hasSubtitleSlotState;
		}
		get _hasIconContent() {
			return this._hasIconSlotState;
		}
		/**
		* The open state changed. `mno-click` is the historical name; the plain
		* event is `toggle`, and the transition also fires `open` / `close`
		* (+ `mno-open` / `mno-close`) — the same trio modal and drawer emit.
		*/
		_emitClick(detail) {
			dispatchMonoEvent(this, "click", detail, { alias: "toggle" });
			dispatchMonoEvent(this, detail.modelValue ? "open" : "close", detail);
		}
		_setOpen(next, sourceEvent) {
			if (this.disabled) return;
			if (this.modelValue === next) return;
			const oldValue = this.modelValue;
			this.modelValue = next;
			this._emitClick({
				modelValue: next,
				currentValue: next,
				oldValue,
				value: next,
				sourceEvent
			});
		}
		_handleClick(event) {
			if (this.disabled) return;
			this._setOpen(!this.modelValue, event);
		}
		toggle() {
			this._setOpen(!this.modelValue);
		}
		expand() {
			this._setOpen(true);
		}
		collapse() {
			this._setOpen(false);
		}
		focus() {
			this._headEl?.focus();
		}
		blur() {
			this._headEl?.blur();
		}
	}
	__decorate([property({ type: String })], MonoAccordionCoreClass.prototype, "size", void 0);
	__decorate([property({ type: String })], MonoAccordionCoreClass.prototype, "color", void 0);
	__decorate([property({ type: String })], MonoAccordionCoreClass.prototype, "title", void 0);
	__decorate([property({ type: String })], MonoAccordionCoreClass.prototype, "subtitle", void 0);
	__decorate([property({
		attribute: "model-value",
		reflect: true,
		converter: booleanStringConverter
	})], MonoAccordionCoreClass.prototype, "modelValue", void 0);
	__decorate([property({
		reflect: true,
		converter: booleanStringConverter
	})], MonoAccordionCoreClass.prototype, "disabled", void 0);
	__decorate([property({ attribute: false })], MonoAccordionCoreClass.prototype, "cssClass", void 0);
	__decorate([property({ attribute: false })], MonoAccordionCoreClass.prototype, "cssClassName", void 0);
	__decorate([state()], MonoAccordionCoreClass.prototype, "_hasTitleSlotState", void 0);
	__decorate([state()], MonoAccordionCoreClass.prototype, "_hasSubtitleSlotState", void 0);
	__decorate([state()], MonoAccordionCoreClass.prototype, "_hasHeaderSlotState", void 0);
	__decorate([state()], MonoAccordionCoreClass.prototype, "_hasIconSlotState", void 0);
	__decorate([state()], MonoAccordionCoreClass.prototype, "_hasActionsSlotState", void 0);
	__decorate([state()], MonoAccordionCoreClass.prototype, "_hasBodySlotState", void 0);
	__decorate([query(".mono-accordion-head")], MonoAccordionCoreClass.prototype, "_headEl", void 0);
	return MonoAccordionCoreClass;
};
//#endregion
//#region src/components/accordion/accordion.css?raw
var accordion_default = "/* @unocss-include */\r\n\r\n/* =========================================================================\r\n   mono-accordion — a port of Basecoat's `.accordion`\r\n   (basecoat-css@1.0.2, vega style).\r\n\r\n   Styled by ATTRIBUTE, like Basecoat — and the attributes mirror the element's\r\n   props one for one, so hand-written markup reads like the Lit / Vue tag:\r\n\r\n     <mono-accordion size=\"lg\" color=\"success\" model-value>\r\n     <div mono-accordion mono-size=\"lg\" mono-color=\"success\" mono-open>\r\n       <button mono-head type=\"button\" aria-expanded=\"true\">\r\n         <span mono-glyph>…</span>\r\n         <span mono-heading>\r\n           <span mono-title>Question</span>\r\n           <span mono-subtitle>Sub-text</span>\r\n         </span>\r\n         <span mono-actions>…</span>\r\n         <span mono-arrow><svg …></svg></span>\r\n       </button>\r\n       <div mono-body role=\"region\"><div>…</div></div>\r\n     </div>\r\n\r\n   An absent attribute is the prop's default (`:not([mono-size])` = md,\r\n   `:not([mono-color])` = primary). The element writes them on its root — the\r\n   host in the light build, an inner root `<div>` in the shadow one — plus the\r\n   states `mono-open` and `mono-disabled`. The old classes\r\n   (`.mono-accordion.md.primary.open`) are still emitted as inert hooks until\r\n   2.0 but no rule here reads them.\r\n\r\n   Selector map (ours ≡ upstream):\r\n     [mono-accordion-group]        ≡ .accordion (flex w-full flex-col; maia /\r\n                                     mira / luma / rhea add the frame, which is\r\n                                     the `-group-*` knobs below)\r\n     [mono-accordion]              ≡ .accordion > details (not-last:border-b, and\r\n                                     `open:bg-muted/50` on four flavors)\r\n                                     — EXTENSION when standalone: upstream has no\r\n                                     accordion outside a group, so on its own it\r\n                                     keeps this component's frame (border, radius,\r\n                                     shadow-xs). Inside a group the frame moves to\r\n                                     the group and the item flattens to a divider.\r\n     [mono-head]                   ≡ > summary (relative flex w-full items-start\r\n                                     justify-between border border-transparent\r\n                                     cursor-pointer outline-none, rounded-md py-4\r\n                                     text-left text-sm font-medium hover:underline,\r\n                                     focus-visible:ring-3 ring-ring/50 border-ring)\r\n                                     — DEVIATION: a real <button>, so the row is a\r\n                                     button for a11y rather than a <summary> whose\r\n                                     open state the element would have to fight\r\n     [mono-glyph]                  ≡ EXTENSION (the leading icon chip)\r\n     [mono-heading] > [mono-title] ≡ the summary's own text\r\n     [mono-subtitle]               ≡ EXTENSION (a second line under the title;\r\n                                     `[mono-description]` is its old name, and the\r\n                                     element still renders both)\r\n     [mono-actions]                ≡ EXTENSION (trailing controls in the row)\r\n     [mono-arrow]                  ≡ summary > svg:last-child (text-muted-foreground\r\n                                     ms-auto size-4, rotate-180 while open)\r\n     [mono-body]                   ≡ details > :not(summary) (overflow-hidden,\r\n                                     pt-0 pb-4 text-sm) — plus the animated\r\n                                     collapse, which upstream's <details> gets free\r\n     [mono-size]/[mono-color]      ≡ EXTENSION (upstream ships one size, no colour)\r\n     [mono-disabled]               ≡ details[aria-disabled] > summary\r\n                                     (pointer-events-none opacity-50)\r\n\r\n   PART NAMES ARE PATH-SCOPED. `[mono-title]`, `[mono-body]`, `[mono-actions]`\r\n   and `[mono-icon]` are also card's, dropdown's and button's part names, and an\r\n   accordion BODY is a place consumers put cards and buttons. Every rule here is\r\n   therefore written as an explicit child path from the root — `:where([mono-accordion]\r\n   > [mono-head] > [mono-heading]) > [mono-title]` — so a nested component's parts\r\n   are never reached. The `:where()` keeps that path at (0,1,0), the same weight a\r\n   one-attribute rule would have, so a `cssClass` utility still wins by source order.\r\n\r\n   FLAVORS set `--mono-accordion-{radius,shadow,pad-x-<size>,pad-y-<size>,\r\n   title-font-<size>,body-font-<size>,open-bg,group-radius,group-border-width,\r\n   arrow-size,ring-width}`; every fallback here is vega's value\r\n   (`node scripts/basecoat-styles.mjs --varying \"accordion\"` prints the matrix).\r\n   ========================================================================= */\r\n\r\nmono-accordion {\r\n  display: block;\r\n}\r\n\r\n/* =========================================\r\n   Root — the item\r\n   ========================================= */\r\n\r\n/* basecoat@1.0.2 styles/vega.css .accordion > details — not-last:border-b */\r\n[mono-accordion] {\r\n  /* ── the six roles, each a public knob over a Basecoat token ───────────── */\r\n  --_mono-accordion-primary: var(--mono-accordion-primary, var(--primary));\r\n  --_mono-accordion-secondary: var(--mono-accordion-secondary, var(--secondary-foreground));\r\n  --_mono-accordion-success: var(--mono-accordion-success, var(--success));\r\n  --_mono-accordion-danger: var(--mono-accordion-danger, var(--destructive));\r\n  --_mono-accordion-warning: var(--mono-accordion-warning, var(--warning));\r\n  --_mono-accordion-info: var(--mono-accordion-info, var(--info));\r\n  --_mono-accordion-teal: var(--mono-accordion-teal, var(--teal));\r\n  --_mono-accordion-purple: var(--mono-accordion-purple, var(--purple));\r\n  --_mono-accordion-neutral: var(--mono-accordion-neutral, var(--neutral));\r\n  --_mono-accordion-dark: var(--mono-accordion-dark, var(--dark));\r\n  /* the colour in play — `primary` unless a [mono-color] rule re-points it */\r\n  --_mono-accordion-accent: var(--mono-accordion-accent, var(--_mono-accordion-accent-preset, var(--_mono-accordion-primary)));\r\n\r\n  /* ── surfaces ──────────────────────────────────────────────────────────── */\r\n  --_mono-accordion-bg: var(--mono-accordion-bg, var(--mono-accordion-surface, var(--card)));\r\n  --_mono-accordion-text: var(--mono-accordion-text, var(--card-foreground));\r\n  --_mono-accordion-border: var(--mono-accordion-border, var(--border));\r\n  --_mono-accordion-shadow: var(--mono-accordion-shadow, var(--mono-shadow-xs));\r\n  /* `open:bg-muted/50` — vega does NOT tint an open item; maia, mira, luma and\r\n     rhea do, and set this knob. `--mono-accordion-head-bg` is the pre-port name,\r\n     honoured until 2.0: it tinted the open HEAD, where this tints the open item\r\n     (head and body alike), which is what upstream's `open:` variant does. */\r\n  /* An OPAQUE fill, not an overlay: it replaces the item's own surface while\r\n     open, so a flavor's `bg-muted/50` is written as that mix OVER `--card`.\r\n     Defaulting to the item's surface is what makes vega's \"no tint\" a no-op. */\r\n  --_mono-accordion-open-bg: var(--mono-accordion-open-bg, var(--mono-accordion-head-bg, var(--_mono-accordion-bg)));\r\n  --_mono-accordion-open-border-color: var(--mono-accordion-open-border-color,\r\n    color-mix(in oklab, var(--_mono-accordion-accent) 32%, var(--_mono-accordion-border)));\r\n  --_mono-accordion-open-shadow: var(--mono-accordion-open-shadow,\r\n    0 3px 14px color-mix(in oklab, var(--_mono-accordion-accent) 9%, transparent));\r\n\r\n  /* ── md metrics live on the unqualified root ON PURPOSE ────────────────────\r\n     basecoat@1.0.2 styles/vega.css .accordion > details > summary — py-4 text-sm\r\n     — DEVIATION: the inline padding is ours. Upstream's summary has none because\r\n     its group is edge-to-edge in the page; this item can stand alone inside its\r\n     own frame, where text flush against the border reads as a bug. maia / luma /\r\n     rhea say `p-4`, which is exactly the value used here. */\r\n  --_mono-accordion-pad-x: var(--mono-accordion-pad-x, var(--_mono-accordion-pad-x-preset, var(--mono-accordion-pad-x-md, calc(var(--mono-spacing) * 4))));\r\n  --_mono-accordion-pad-y: var(--mono-accordion-pad-y, var(--_mono-accordion-pad-y-preset, var(--mono-accordion-pad-y-md, calc(var(--mono-spacing) * 4))));\r\n  --_mono-accordion-radius: var(--mono-accordion-radius, var(--_mono-accordion-radius-preset, var(--mono-accordion-radius-md, var(--mono-radius-md))));\r\n  --_mono-accordion-gap: var(--mono-accordion-gap, var(--_mono-accordion-gap-preset, calc(var(--mono-spacing) * 3)));\r\n\r\n  /* ── type ──────────────────────────────────────────────────────────────── */\r\n  --_mono-accordion-title-font: var(--mono-accordion-title-font, var(--_mono-accordion-title-font-preset, var(--mono-accordion-title-font-md, var(--mono-text-sm))));\r\n  --_mono-accordion-title-line-height: var(--mono-accordion-title-line-height, var(--_mono-accordion-title-line-height-preset, var(--mono-text-sm--lh)));\r\n  --_mono-accordion-title-weight: var(--mono-accordion-title-weight, var(--mono-font-weight-medium));\r\n  /* `hover:underline` — the whole row is the control, so the hover cue is on its\r\n     label. A flavor (or a consumer) sets `none` to drop it. */\r\n  --_mono-accordion-title-hover-decoration: var(--mono-accordion-title-hover-decoration, underline);\r\n  --_mono-accordion-description-font: var(--mono-accordion-description-font, var(--_mono-accordion-description-font-preset, var(--mono-text-xs)));\r\n  --_mono-accordion-description-color: var(--mono-accordion-description-color, var(--muted-foreground));\r\n  --_mono-accordion-body-font: var(--mono-accordion-body-font, var(--_mono-accordion-body-font-preset, var(--mono-accordion-body-font-md, var(--mono-text-sm))));\r\n  --_mono-accordion-body-line-height: var(--mono-accordion-body-line-height, var(--_mono-accordion-body-line-height-preset, var(--mono-text-sm--lh)));\r\n  --_mono-accordion-body-color: var(--mono-accordion-body-color, inherit);\r\n\r\n  /* ── the chevron — `text-muted-foreground size-4` ──────────────────────── */\r\n  --_mono-accordion-arrow-size: var(--mono-accordion-arrow-size, var(--_mono-accordion-arrow-size-preset, calc(var(--mono-spacing) * 4)));\r\n  --_mono-accordion-arrow-color: var(--mono-accordion-arrow-color, var(--muted-foreground));\r\n  /* EXTENSION: the role reads the open state at a glance. Set it to\r\n     `--muted-foreground` for upstream's single-colour chevron. */\r\n  --_mono-accordion-arrow-open-color: var(--mono-accordion-arrow-open-color, var(--_mono-accordion-accent));\r\n\r\n  /* ── the leading chip (EXTENSION) ──────────────────────────────────────── */\r\n  --_mono-accordion-glyph-size: var(--mono-accordion-glyph-size, var(--_mono-accordion-glyph-size-preset, calc(var(--mono-spacing) * 7)));\r\n  --_mono-accordion-glyph-radius: var(--mono-accordion-glyph-radius, var(--_mono-accordion-glyph-radius-preset, var(--mono-radius-sm)));\r\n  --_mono-accordion-glyph-bg: var(--mono-accordion-glyph-bg, color-mix(in oklab, var(--_mono-accordion-accent) 14%, transparent));\r\n  --_mono-accordion-glyph-color: var(--mono-accordion-glyph-color, var(--_mono-accordion-accent));\r\n\r\n  /* ── focus — `focus-visible:ring-3 ring-ring/50 border-ring` ───────────── */\r\n  --_mono-accordion-ring-color: var(--mono-accordion-ring-color, var(--_mono-accordion-accent));\r\n\r\n  /* The head's hover fill. Upstream has none — it underlines the label instead —\r\n     so the tint is 0% on vega. A flavor sets the ALPHA (`-head-hover-tint`) and\r\n     the wash is built HERE: a flavor writing the colour itself would have to\r\n     reference `--_mono-accordion-accent`, which is declared on this element, and\r\n     a `:root` declaration that references it is invalid at computed-value time. */\r\n  --_mono-accordion-head-hover-bg: var(--mono-accordion-head-hover-bg,\r\n    color-mix(in oklab, var(--_mono-accordion-accent) var(--mono-accordion-head-hover-tint, 0%), transparent));\r\n  --_mono-accordion-ring-width: var(--mono-accordion-ring-width, var(--mono-ring-width));\r\n  /* A slot, so a state can neutralise the resting shadow without `box-shadow: none`. */\r\n  --_mono-accordion-ring: 0 0 #0000;\r\n\r\n  /* Open/close animation duration, shared by the body collapse and the chevron so\r\n     `--mono-accordion-duration: 0s` means a fully instant toggle.\r\n\r\n     This is THE lever for a slow open/close. `grid-template-rows: 0fr → 1fr` is the\r\n     only animated LAYOUT property in the library, and it re-lays-out the whole slotted\r\n     subtree on every frame of the transition, so its cost scales with what is inside\r\n     the body — and, because the panel's own height changes, with whatever follows it\r\n     in the document too. Measured with ~320-node bodies (Chromium, median of 3), one\r\n     open+close cycle: 24.8ms animated vs 3.6ms at `0s` — the animation is ~85% of the\r\n     toggle's cost. Set this to `0s` on accordions whose bodies (or whose pages) are\r\n     heavy.\r\n\r\n     THREE approaches that look like fixes and are NOT. All were built and measured\r\n     (Chromium, LayoutDuration + RecalcStyleDuration, min of 9 toggles, two scenarios:\r\n     40 panels with ~320-node bodies, and one small panel above a 2000-row sticky\r\n     table). Recorded so nobody spends the afternoon on them again:\r\n\r\n       1. Pin the track to a measured PIXEL height for the transition, so the `fr`\r\n          never has to be resolved against content. Landed inside the noise across\r\n          three runs (+11%, -2%, -17%) and cost two extra forced layouts per toggle to\r\n          measure and release. The per-frame cost is NOT the `fr` resolution — it is\r\n          that the row's block size changes at all, which re-lays-out the grid item\r\n          however the target size was expressed.\r\n       2. Also give the inner region a definite `height`, so its own constraint space\r\n          stops changing and its subtree layout can be cached. No effect either.\r\n       3. Don't animate a layout property at all: snap the box to its final size and\r\n          slide the content in on `transform`/`opacity`. A quick CSS prototype looked\r\n          like a 50% win, but only because it had no `content-visibility` transition\r\n          and so dropped the subtree instantly on close — the close animation was\r\n          simply invisible. Made to actually work, it measured 14.6/18.3ms vs\r\n          collapse's 20.0/18.4ms on heavy bodies (i.e. unreliable), and 17.4/19.6ms vs\r\n          12.6/12.8ms on the heavy-page scenario — reliably WORSE, because the\r\n          transform/opacity pass costs more than the box animation it replaced.\r\n\r\n     So `--mono-accordion-duration: 0s` really is the lever, and there is no cleverer\r\n     one. Measured against it: heavy bodies 7.0/10.8ms vs 20.0/18.4ms (~45-65% off);\r\n     heavy page 11.1/11.7ms vs 12.6/12.8ms (~10% off — on a page like that the\r\n     accordion is nearly irrelevant and the page's own weight is the cost). */\r\n  --_mono-accordion-duration: var(--mono-accordion-duration, var(--mono-duration));\r\n\r\n  display: block;\r\n  width: 100%;\r\n  font-family: inherit;\r\n  color: var(--_mono-accordion-text);\r\n\r\n  /* EXTENSION — the standalone frame. Inside a group this is flattened below and\r\n     the frame moves to the group, which is upstream's arrangement. */\r\n  border: var(--mono-border-width) solid var(--_mono-accordion-border);\r\n  border-radius: var(--_mono-accordion-radius);\r\n  background: var(--_mono-accordion-bg);\r\n  box-shadow: var(--_mono-accordion-shadow);\r\n  overflow: hidden;\r\n  transition:\r\n    border-color var(--mono-duration) var(--mono-ease),\r\n    box-shadow var(--mono-duration) var(--mono-ease),\r\n    background-color var(--mono-duration) var(--mono-ease);\r\n}\r\n\r\n[mono-accordion],\r\n:where([mono-accordion]) *,\r\n:where([mono-accordion]) *::before,\r\n:where([mono-accordion]) *::after {\r\n  box-sizing: border-box;\r\n}\r\n\r\n/* The shadow build renders EVERY region up front (so DSD can project into them\r\n   server-side) and marks the ones with nothing in them; the light build renders\r\n   only what exists. Hiding them here is what keeps the two builds identical.\r\n\r\n   NOT wrapped in `:where()`, unlike the other parts: a region rule is two\r\n   attributes strong, so a zero-weight hide would tie and lose on source order. */\r\n[mono-accordion] :is(\r\n  [mono-glyph],\r\n  [mono-heading],\r\n  [mono-title],\r\n  [mono-subtitle],\r\n  [mono-description],\r\n  [mono-actions]\r\n)[mono-empty] {\r\n  display: none;\r\n}\r\n\r\n/* =========================================\r\n   Group — `.accordion`\r\n   ========================================= */\r\n\r\n/* basecoat@1.0.2 components/accordion.css .accordion — flex w-full flex-col\r\n   The GROUP is consumer markup — the element renders one item, not the list — so\r\n   unlike every part below, its pre-port CLASS is public API and keeps working\r\n   beside the attribute until 2.0.\r\n   The frame knobs are inert on vega (0 width, no radius) and set by the four\r\n   flavors whose `.accordion` says `overflow-hidden rounded-2xl border`. */\r\n:is([mono-accordion-group], .mono-accordion-group) {\r\n  --_mono-accordion-group-gap: var(--mono-accordion-group-gap, 0px);\r\n  --_mono-accordion-group-radius: var(--mono-accordion-group-radius, 0px);\r\n  --_mono-accordion-group-border-width: var(--mono-accordion-group-border-width, 0px);\r\n  --_mono-accordion-group-border-color: var(--mono-accordion-group-border-color, var(--border));\r\n\r\n  display: flex;\r\n  width: 100%;\r\n  flex-direction: column;\r\n  gap: var(--_mono-accordion-group-gap);\r\n  box-sizing: border-box;\r\n  border: var(--_mono-accordion-group-border-width) solid var(--_mono-accordion-group-border-color);\r\n  border-radius: var(--_mono-accordion-group-radius);\r\n  overflow: hidden;\r\n}\r\n\r\n/* basecoat@1.0.2 styles/vega.css .accordion > details — not-last:border-b\r\n   In a group the ITEM stops being a card: the frame is the group's, and all an\r\n   item carries is the hairline to the next one.\r\n\r\n   TWO selectors for one rule, because the item is not always a child of the\r\n   group. Hand-written markup nests `[mono-accordion]` directly, so the `>`\r\n   path matches; the ELEMENT puts a custom-element host in between (light) or a\r\n   shadow boundary (shadow), which no selector crosses — so it detects the group\r\n   itself and writes `mono-grouped` / `mono-last` on its root. */\r\n:where([mono-accordion-group], .mono-accordion-group) > [mono-accordion],\r\n[mono-accordion][mono-grouped] {\r\n  border-width: 0;\r\n  border-radius: 0;\r\n  box-shadow: none;\r\n}\r\n\r\n/* The divider rides the group's own CHILD, whatever that is — the item itself in\r\n   hand-written markup, the custom-element host when the element renders it. That\r\n   is what makes `:last-child` reliable: the host is a child of the group in both\r\n   builds, where the ITEM is one only in raw markup, and an item that asked \"am I\r\n   last?\" itself would answer from however many siblings existed when it rendered. */\r\n:where([mono-accordion-group], .mono-accordion-group)\r\n  > :is([mono-accordion], mono-accordion, mono-shadow-accordion) {\r\n  border-bottom: var(--mono-border-width) solid var(--mono-accordion-border, var(--border));\r\n}\r\n\r\n:where([mono-accordion-group], .mono-accordion-group)\r\n  > :is([mono-accordion], mono-accordion, mono-shadow-accordion):last-child {\r\n  border-bottom-width: 0;\r\n}\r\n\r\n/* A group with a GAP has separate boxes again, and a divider would float in the\r\n   space between them — so a gap is a consumer's own arrangement, not upstream's,\r\n   and they set `--mono-accordion-group-gap` knowing the dividers go with it. */\r\n\r\n/* =========================================\r\n   Sizes — EXTENSION: Basecoat ships ONE accordion size; md is its `summary`\r\n   ========================================= */\r\n\r\n[mono-accordion][mono-size=\"xs\"] {\r\n  --_mono-accordion-pad-x-preset: var(--mono-accordion-pad-x-xs, calc(var(--mono-spacing) * 2.5));\r\n  --_mono-accordion-pad-y-preset: var(--mono-accordion-pad-y-xs, calc(var(--mono-spacing) * 2));\r\n  --_mono-accordion-radius-preset: var(--mono-accordion-radius-xs, var(--mono-radius-sm));\r\n  --_mono-accordion-gap-preset: calc(var(--mono-spacing) * 1.5);\r\n  --_mono-accordion-title-font-preset: var(--mono-accordion-title-font-xs, var(--mono-text-xs));\r\n  --_mono-accordion-title-line-height-preset: var(--mono-text-xs--lh);\r\n  --_mono-accordion-description-font-preset: var(--mono-text-xs);\r\n  --_mono-accordion-body-font-preset: var(--mono-accordion-body-font-xs, var(--mono-text-xs));\r\n  --_mono-accordion-body-line-height-preset: var(--mono-text-xs--lh);\r\n  --_mono-accordion-arrow-size-preset: calc(var(--mono-spacing) * 3);\r\n  --_mono-accordion-glyph-size-preset: calc(var(--mono-spacing) * 4.5);\r\n  --_mono-accordion-glyph-radius-preset: var(--mono-radius-sm);\r\n}\r\n\r\n[mono-accordion][mono-size=\"sm\"] {\r\n  --_mono-accordion-pad-x-preset: var(--mono-accordion-pad-x-sm, calc(var(--mono-spacing) * 3));\r\n  --_mono-accordion-pad-y-preset: var(--mono-accordion-pad-y-sm, calc(var(--mono-spacing) * 3));\r\n  --_mono-accordion-radius-preset: var(--mono-accordion-radius-sm, var(--mono-radius-md));\r\n  --_mono-accordion-gap-preset: calc(var(--mono-spacing) * 2);\r\n  --_mono-accordion-title-font-preset: var(--mono-accordion-title-font-sm, var(--mono-text-xs));\r\n  --_mono-accordion-title-line-height-preset: var(--mono-text-xs--lh);\r\n  --_mono-accordion-description-font-preset: var(--mono-text-xs);\r\n  --_mono-accordion-body-font-preset: var(--mono-accordion-body-font-sm, var(--mono-text-xs));\r\n  --_mono-accordion-body-line-height-preset: var(--mono-text-xs--lh);\r\n  --_mono-accordion-arrow-size-preset: calc(var(--mono-spacing) * 3.5);\r\n  --_mono-accordion-glyph-size-preset: calc(var(--mono-spacing) * 6);\r\n}\r\n\r\n[mono-accordion][mono-size=\"lg\"] {\r\n  --_mono-accordion-pad-x-preset: var(--mono-accordion-pad-x-lg, calc(var(--mono-spacing) * 5));\r\n  --_mono-accordion-pad-y-preset: var(--mono-accordion-pad-y-lg, calc(var(--mono-spacing) * 5));\r\n  --_mono-accordion-radius-preset: var(--mono-accordion-radius-lg, var(--mono-radius-lg));\r\n  --_mono-accordion-gap-preset: calc(var(--mono-spacing) * 3.5);\r\n  --_mono-accordion-title-font-preset: var(--mono-accordion-title-font-lg, var(--mono-text-base));\r\n  --_mono-accordion-title-line-height-preset: var(--mono-text-base--lh);\r\n  --_mono-accordion-body-font-preset: var(--mono-accordion-body-font-lg, var(--mono-text-sm));\r\n  --_mono-accordion-arrow-size-preset: calc(var(--mono-spacing) * 5);\r\n  --_mono-accordion-glyph-size-preset: calc(var(--mono-spacing) * 8);\r\n  --_mono-accordion-glyph-radius-preset: var(--mono-radius-md);\r\n}\r\n\r\n[mono-accordion][mono-size=\"xl\"] {\r\n  --_mono-accordion-pad-x-preset: var(--mono-accordion-pad-x-xl, calc(var(--mono-spacing) * 6));\r\n  --_mono-accordion-pad-y-preset: var(--mono-accordion-pad-y-xl, calc(var(--mono-spacing) * 6));\r\n  --_mono-accordion-radius-preset: var(--mono-accordion-radius-xl, var(--mono-radius-xl));\r\n  --_mono-accordion-gap-preset: calc(var(--mono-spacing) * 4);\r\n  --_mono-accordion-title-font-preset: var(--mono-accordion-title-font-xl, var(--mono-text-lg));\r\n  --_mono-accordion-title-line-height-preset: var(--mono-text-lg--lh);\r\n  --_mono-accordion-description-font-preset: var(--mono-text-sm);\r\n  --_mono-accordion-body-font-preset: var(--mono-accordion-body-font-xl, var(--mono-text-base));\r\n  --_mono-accordion-body-line-height-preset: var(--mono-text-base--lh);\r\n  --_mono-accordion-arrow-size-preset: calc(var(--mono-spacing) * 5.5);\r\n  --_mono-accordion-glyph-size-preset: calc(var(--mono-spacing) * 9);\r\n  --_mono-accordion-glyph-radius-preset: var(--mono-radius-lg);\r\n}\r\n\r\n[mono-accordion][mono-size=\"xxl\"] {\r\n  --_mono-accordion-pad-x-preset: var(--mono-accordion-pad-x-xxl, calc(var(--mono-spacing) * 7));\r\n  --_mono-accordion-pad-y-preset: var(--mono-accordion-pad-y-xxl, calc(var(--mono-spacing) * 7));\r\n  --_mono-accordion-radius-preset: var(--mono-accordion-radius-xxl, var(--mono-radius-xl));\r\n  --_mono-accordion-gap-preset: calc(var(--mono-spacing) * 4.5);\r\n  --_mono-accordion-title-font-preset: var(--mono-accordion-title-font-xxl, var(--mono-text-xl));\r\n  --_mono-accordion-title-line-height-preset: var(--mono-text-xl--lh);\r\n  --_mono-accordion-description-font-preset: var(--mono-text-sm);\r\n  --_mono-accordion-body-font-preset: var(--mono-accordion-body-font-xxl, var(--mono-text-lg));\r\n  --_mono-accordion-body-line-height-preset: var(--mono-text-lg--lh);\r\n  --_mono-accordion-arrow-size-preset: calc(var(--mono-spacing) * 6);\r\n  --_mono-accordion-glyph-size-preset: calc(var(--mono-spacing) * 10);\r\n  --_mono-accordion-glyph-radius-preset: var(--mono-radius-lg);\r\n}\r\n\r\n/* =========================================\r\n   Colours — EXTENSION: the role tints the chevron, the ring and the open edge\r\n   ========================================= */\r\n\r\n[mono-accordion][mono-color=\"primary\"] { --_mono-accordion-accent-preset: var(--_mono-accordion-primary); }\r\n[mono-accordion][mono-color=\"secondary\"] { --_mono-accordion-accent-preset: var(--_mono-accordion-secondary); }\r\n[mono-accordion][mono-color=\"success\"] { --_mono-accordion-accent-preset: var(--_mono-accordion-success); }\r\n[mono-accordion][mono-color=\"danger\"] { --_mono-accordion-accent-preset: var(--_mono-accordion-danger); }\r\n[mono-accordion][mono-color=\"warning\"] { --_mono-accordion-accent-preset: var(--_mono-accordion-warning); }\r\n[mono-accordion][mono-color=\"info\"] { --_mono-accordion-accent-preset: var(--_mono-accordion-info); }\r\n[mono-accordion][mono-color=\"teal\"] { --_mono-accordion-accent-preset: var(--_mono-accordion-teal); }\r\n[mono-accordion][mono-color=\"purple\"] { --_mono-accordion-accent-preset: var(--_mono-accordion-purple); }\r\n[mono-accordion][mono-color=\"neutral\"] { --_mono-accordion-accent-preset: var(--_mono-accordion-neutral); }\r\n[mono-accordion][mono-color=\"dark\"] { --_mono-accordion-accent-preset: var(--_mono-accordion-dark); }\r\n\r\n/* =========================================\r\n   States\r\n   ========================================= */\r\n\r\n[mono-accordion][mono-open] {\r\n  border-color: var(--_mono-accordion-open-border-color);\r\n  box-shadow: var(--_mono-accordion-open-shadow);\r\n  background: var(--_mono-accordion-open-bg);\r\n}\r\n\r\n/* In a group the item has no frame to tint — only the open wash survives. */\r\n:where([mono-accordion-group], .mono-accordion-group) > [mono-accordion][mono-open],\r\n[mono-accordion][mono-grouped][mono-open] {\r\n  border-color: var(--_mono-accordion-border);\r\n  box-shadow: none;\r\n}\r\n\r\n/* basecoat@1.0.2 components/accordion.css .accordion > details[aria-disabled='true'] > summary, .accordion > details > summary[aria-disabled='true']\r\n   — pointer-events-none opacity-50. DEVIATION: 0.6, this component's pre-port\r\n   value, and on the whole item rather than the summary alone (the body is\r\n   equally unusable). */\r\n[mono-accordion][mono-disabled] {\r\n  opacity: 0.6;\r\n  pointer-events: none;\r\n  cursor: not-allowed;\r\n}\r\n\r\n/* =========================================\r\n   Head — `> summary`\r\n   ========================================= */\r\n\r\n/* basecoat@1.0.2 components/accordion.css .accordion > details > summary —\r\n   relative flex w-full flex-1 cursor-pointer list-none items-start\r\n   justify-between border border-transparent transition-all outline-none */\r\n/* basecoat@1.0.2 styles/vega.css .accordion > details > summary — rounded-md py-4\r\n   text-left text-sm font-medium hover:underline focus-visible:ring-3\r\n   focus-visible:ring-ring/50 focus-visible:border-ring\r\n   — DEVIATIONS: a real <button> (so it needs the UA button reset), and\r\n   `items-center` rather than `items-start`: this row can carry a glyph chip and\r\n   trailing actions, which upstream's text-only summary never does. */\r\n:where([mono-accordion]) > [mono-head] {\r\n  position: relative;\r\n  display: flex;\r\n  width: 100%;\r\n  align-items: center;\r\n  justify-content: space-between;\r\n  gap: var(--_mono-accordion-gap);\r\n  padding: var(--_mono-accordion-pad-y) var(--_mono-accordion-pad-x);\r\n  border: var(--mono-border-width) solid transparent;\r\n  border-radius: var(--_mono-accordion-radius);\r\n  background: none;\r\n  color: inherit;\r\n  font: inherit;\r\n  text-align: left;\r\n  cursor: pointer;\r\n  user-select: none;\r\n  outline: none;\r\n  appearance: none;\r\n  box-shadow: var(--_mono-accordion-ring);\r\n  transition:\r\n    background-color var(--mono-duration) var(--mono-ease),\r\n    border-color var(--mono-duration) var(--mono-ease),\r\n    box-shadow var(--mono-duration) var(--mono-ease);\r\n}\r\n\r\n[mono-accordion] > [mono-head]:focus-visible {\r\n  border-color: var(--_mono-accordion-ring-color);\r\n  --_mono-accordion-ring: 0 0 0 var(--_mono-accordion-ring-width)\r\n    color-mix(in oklab, var(--_mono-accordion-ring-color) var(--mono-ring-alpha), transparent);\r\n}\r\n\r\n/* `hover:underline` — on the label, which is the only text in upstream's summary. */\r\n@media (hover: hover) {\r\n  [mono-accordion] > [mono-head]:hover:not(:disabled) {\r\n    background: var(--_mono-accordion-head-hover-bg);\r\n  }\r\n\r\n  [mono-accordion] > [mono-head]:hover:not(:disabled) [mono-title] {\r\n    text-decoration-line: var(--_mono-accordion-title-hover-decoration);\r\n  }\r\n}\r\n\r\n[mono-accordion] > [mono-head]:disabled {\r\n  pointer-events: none;\r\n  cursor: not-allowed;\r\n}\r\n\r\n/* =========================================\r\n   Leading chip — EXTENSION\r\n   ========================================= */\r\n\r\n:where([mono-accordion] > [mono-head]) > [mono-glyph] {\r\n  flex-shrink: 0;\r\n  display: inline-flex;\r\n  align-items: center;\r\n  justify-content: center;\r\n  width: var(--_mono-accordion-glyph-size);\r\n  height: var(--_mono-accordion-glyph-size);\r\n  border-radius: var(--_mono-accordion-glyph-radius);\r\n  background: var(--_mono-accordion-glyph-bg);\r\n  color: var(--_mono-accordion-glyph-color);\r\n  line-height: 1;\r\n}\r\n\r\n/* The glyph itself fills the chip at 62% — light: the `[data-mono-slot]`\r\n   placeholder the svg is moved into; shadow: the projected svg. */\r\n[mono-accordion] > [mono-head] > [mono-glyph] > [data-mono-slot=\"icon\"],\r\n[mono-accordion] > [mono-head] > [mono-glyph] > svg,\r\n[mono-accordion] > [mono-head] > [mono-glyph] slot[name=\"icon\"]::slotted(svg) {\r\n  display: block;\r\n  width: 62%;\r\n  height: 62%;\r\n}\r\n\r\n/* …and the light build's svg fills that placeholder. It used to lean on a global\r\n   `[data-mono-slot='icon'] > svg` rule in chip.css; since the Basecoat port that\r\n   rule is scoped to chips, and an unsized inline svg falls back to 300×150. */\r\n[mono-accordion] > [mono-head] > [mono-glyph] > [data-mono-slot=\"icon\"] > svg {\r\n  display: block;\r\n  width: 100%;\r\n  height: 100%;\r\n}\r\n\r\n/* =========================================\r\n   Title + description\r\n   ========================================= */\r\n\r\n:where([mono-accordion] > [mono-head]) > [mono-heading] {\r\n  flex: 1;\r\n  min-width: 0;\r\n  display: flex;\r\n  flex-direction: column;\r\n  gap: calc(var(--mono-spacing) * 0.25);\r\n}\r\n\r\n/* `> slot[name=\"header\"]`: in the shadow build the title/subtitle are the\r\n   FALLBACK content of `<slot name=\"header\">`, so they sit one element deeper. */\r\n:where(\r\n  [mono-accordion] > [mono-head] > [mono-heading],\r\n  [mono-accordion] > [mono-head] > [mono-heading] > slot[name=\"header\"]\r\n) > [mono-title] {\r\n  font-size: var(--_mono-accordion-title-font);\r\n  line-height: var(--_mono-accordion-title-line-height);\r\n  font-weight: var(--_mono-accordion-title-weight);\r\n  color: var(--_mono-accordion-text);\r\n}\r\n\r\n:where(\r\n  [mono-accordion] > [mono-head] > [mono-heading],\r\n  [mono-accordion] > [mono-head] > [mono-heading] > slot[name=\"header\"]\r\n) > :is([mono-subtitle], [mono-description]) {\r\n  font-size: var(--_mono-accordion-description-font);\r\n  line-height: var(--mono-leading-normal);\r\n  color: var(--_mono-accordion-description-color);\r\n}\r\n\r\n:where([mono-accordion] > [mono-head]) > [mono-actions] {\r\n  flex-shrink: 0;\r\n  display: inline-flex;\r\n  align-items: center;\r\n  gap: calc(var(--mono-spacing) * 1.5);\r\n}\r\n\r\n/* =========================================\r\n   Chevron — `summary > svg:last-child`\r\n   ========================================= */\r\n\r\n/* basecoat@1.0.2 styles/vega.css .accordion > details > summary > svg:last-child\r\n   — text-muted-foreground ms-auto size-4 */\r\n/* basecoat@1.0.2 components/accordion.css .accordion > details > summary > svg:last-child\r\n   — pointer-events-none shrink-0 transition-transform */\r\n:where([mono-accordion] > [mono-head]) > [mono-arrow] {\r\n  flex-shrink: 0;\r\n  margin-inline-start: auto;\r\n  display: inline-flex;\r\n  align-items: center;\r\n  justify-content: center;\r\n  width: var(--_mono-accordion-arrow-size);\r\n  height: var(--_mono-accordion-arrow-size);\r\n  color: var(--_mono-accordion-arrow-color);\r\n  pointer-events: none;\r\n  transition:\r\n    rotate var(--_mono-accordion-duration) var(--mono-ease),\r\n    color var(--mono-duration) var(--mono-ease);\r\n}\r\n\r\n[mono-accordion] > [mono-head] > [mono-arrow] > :is(svg, span) {\r\n  display: block;\r\n  width: 100%;\r\n  height: 100%;\r\n}\r\n\r\n/* basecoat@1.0.2 components/accordion.css .accordion > details[open] > summary > svg:last-child\r\n   — rotate-180 */\r\n[mono-accordion][mono-open] > [mono-head] > [mono-arrow] {\r\n  rotate: 180deg;\r\n  color: var(--_mono-accordion-arrow-open-color);\r\n}\r\n\r\n/* =========================================\r\n   Body — `details > :not(summary)`\r\n   ========================================= */\r\n\r\n/* basecoat@1.0.2 components/accordion.css .accordion > details > :not(summary) — overflow-hidden */\r\n/* basecoat@1.0.2 styles/vega.css .accordion > details > :not(summary) — pt-0 pb-4 text-sm\r\n   A <details> collapses for free; a div has to be animated. The\r\n   `grid-template-rows: 0fr → 1fr` trick measures the content's natural height\r\n   through the grid track and interpolates the row size, with the vertical padding\r\n   and the top border collapsing in lockstep so the entrance feels of-a-piece.\r\n   `> * { min-height: 0 }` lets grid items shrink below their intrinsic height when\r\n   the row is 0fr — without it the body would refuse to collapse. */\r\n:where([mono-accordion]) > [mono-body] {\r\n  display: grid;\r\n  grid-template-rows: 0fr;\r\n  overflow: hidden;\r\n  padding: 0 var(--_mono-accordion-pad-x);\r\n  font-size: var(--_mono-accordion-body-font);\r\n  line-height: var(--_mono-accordion-body-line-height);\r\n  color: var(--_mono-accordion-body-color);\r\n  border-top: var(--mono-border-width) solid transparent;\r\n\r\n  /* Scope this body's layout/paint work to its own box. Measured effect: neutral on\r\n     toggle cost, a modest win on the initial layout of a long list of accordions.\r\n     (It is NOT what fixes sibling cost — Chrome already does not re-lay-out sibling\r\n     subtrees when one accordion animates; that was measured, not assumed.)\r\n     `paint` adds no new clipping — `overflow: hidden` above already clips. `layout`\r\n     does make this a containing block + stacking context for absolutely positioned\r\n     descendants, which is safe here because that same `overflow: hidden` already\r\n     confined them, and mono's own popups are moved to a <body> portal. */\r\n  contain: layout paint;\r\n\r\n  transition:\r\n    grid-template-rows var(--_mono-accordion-duration) var(--mono-ease),\r\n    padding-top var(--_mono-accordion-duration) var(--mono-ease),\r\n    padding-bottom var(--_mono-accordion-duration) var(--mono-ease),\r\n    border-top-color var(--mono-duration) var(--mono-ease);\r\n}\r\n\r\n[mono-accordion] > [mono-body] > * {\r\n  min-width: 0;\r\n  min-height: 0;\r\n}\r\n\r\n/* Shadow build: the body's native <slot>s (`body` + the default one) default to\r\n   `display: contents` and so have no box — slotted content would become the grid\r\n   items directly (un-targetable by `> * { min-height: 0 }`) and keep the\r\n   `grid-template-rows: 0fr → 1fr` track from ever collapsing. They sit in ONE\r\n   `[mono-body-slots]` block, the single grid item (like the light build's\r\n   <span data-mono-slot=\"body\">), so the open/close collapse works. A bare `slot`\r\n   child is kept for markup that still renders one. */\r\n[mono-accordion] > [mono-body] > :is(slot, [mono-body-slots]) {\r\n  display: block;\r\n  min-width: 0;\r\n  min-height: 0;\r\n}\r\n\r\n/* Standalone, the item IS the frame, so the open body is separated from the head\r\n   by a hairline the way a card's footer is — EXTENSION, and the reason the top\r\n   padding is not upstream's `pt-0` here. */\r\n[mono-accordion][mono-open] > [mono-body] {\r\n  grid-template-rows: 1fr;\r\n  padding-top: var(--_mono-accordion-pad-y);\r\n  padding-bottom: var(--_mono-accordion-pad-y);\r\n  border-top-color: var(--_mono-accordion-border);\r\n}\r\n\r\n/* basecoat@1.0.2 styles/vega.css .accordion > details > :not(summary) — pt-0.\r\n   In a group the head and its body are one run of text between two dividers,\r\n   exactly as upstream renders it, so the top gap and the hairline both go. */\r\n:where([mono-accordion-group], .mono-accordion-group) > [mono-accordion][mono-open] > [mono-body],\r\n[mono-accordion][mono-grouped][mono-open] > [mono-body] {\r\n  padding-top: 0;\r\n  border-top-color: transparent;\r\n}\r\n\r\n/* A collapsed body is still fully rendered — the `0fr` track only hides it — so\r\n   without this every closed accordion keeps its whole slotted subtree in the style,\r\n   layout and paint trees. `content-visibility: hidden` drops it entirely.\r\n\r\n   What this buys, measured with ~320-node bodies (Chromium, median of 3):\r\n     initial layout, 40 panels: 157ms → 18ms, and flat in the panel count\r\n     (5 panels: 52ms → 23ms). That is the cost of putting a long list of heavy\r\n     accordions on screen at all — e.g. opening a modal that builds N entry forms.\r\n   What it does NOT buy: a cheaper toggle. Skipping the subtree means an opening\r\n   panel is laid out from scratch, so one open+close costs slightly MORE\r\n   (23ms → 31ms at 40 panels). The toggle's real cost is the animation above —\r\n   see `--mono-accordion-duration`.\r\n\r\n   `allow-discrete` is what makes it safe to animate. Opening flips the property to\r\n   `visible` at 0%, so the grid can still measure the content it is expanding to;\r\n   closing holds it `visible` until 100%, so the collapse plays out before the content\r\n   is dropped. Get that backwards and a closing body vanishes instantly instead of\r\n   collapsing.\r\n\r\n   Gated behind @supports deliberately. `content-visibility … allow-discrete` inside\r\n   the `transition` SHORTHAND is a parse error to a browser without the feature, and a\r\n   single bad entry drops the WHOLE declaration — which would take every accordion\r\n   transition with it. Inside the guard the shorthand is known to parse, so the list is\r\n   restated in full rather than patched with the `transition-behavior` longhand.\r\n   Browsers without support keep exactly the previous behaviour.\r\n\r\n   Must stay ABOVE the reduced-motion block: @supports adds no specificity, so source\r\n   order is the only thing keeping `transition: none` the winner down there. */\r\n@supports (transition-behavior: allow-discrete) {\r\n  :where([mono-accordion]) > [mono-body] {\r\n    content-visibility: hidden;\r\n    /* Must stay `0`, NOT `auto 0`. `content-visibility: hidden` skips this element's\r\n       own contents, so its size comes from HERE — and the `auto` keyword's remembered\r\n       size is the panel's last OPEN height, which leaves a closed accordion holding\r\n       full height with nothing in it. Tried, measured, reverted: a closed body read\r\n       656px instead of collapsing. The scrollbar-stability that `auto` normally buys\r\n       does not apply to an element that is itself the skipped one. */\r\n    contain-intrinsic-size: 0;\r\n    transition:\r\n      grid-template-rows var(--_mono-accordion-duration) var(--mono-ease),\r\n      padding-top var(--_mono-accordion-duration) var(--mono-ease),\r\n      padding-bottom var(--_mono-accordion-duration) var(--mono-ease),\r\n      border-top-color var(--mono-duration) var(--mono-ease),\r\n      content-visibility var(--_mono-accordion-duration) allow-discrete;\r\n  }\r\n\r\n  [mono-accordion][mono-open] > [mono-body] {\r\n    content-visibility: visible;\r\n  }\r\n}\r\n\r\n@media (prefers-reduced-motion: reduce) {\r\n  [mono-accordion],\r\n  [mono-accordion] > [mono-head],\r\n  [mono-accordion] > [mono-head] > [mono-arrow],\r\n  [mono-accordion] > [mono-body] {\r\n    transition: none;\r\n  }\r\n}\r\n";
//#endregion
//#region src/components/accordion/mono-accordion.ts
var MonoAccordion = class MonoAccordion extends MonoAccordionCore(LitElement) {
	constructor(..._args) {
		super(..._args);
		this._slotTitle = [];
		this._slotLabel = [];
		this._slotSubtitle = [];
		this._slotDescription = [];
		this._slotHeader = [];
		this._slotIcon = [];
		this._slotActions = [];
		this._slotBody = [];
	}
	static {
		this.styles = [unsafeCSS(accordion_default)];
	}
	createRenderRoot() {
		return this;
	}
	/** The title nodes that render: `slot="title"` beats its alias `slot="label"`. */
	get _titleNodes() {
		return this._slotTitle.length ? this._slotTitle : this._slotLabel;
	}
	/** The subtitle nodes that render: `slot="subtitle"` beats `slot="description"`. */
	get _subtitleNodes() {
		return this._slotSubtitle.length ? this._slotSubtitle : this._slotDescription;
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
		if (this._hasHeaderSlotState) this._placeSlot("header", this._slotHeader);
		else {
			this._placeSlot("title", this._titleNodes);
			this._placeSlot("subtitle", this._subtitleNodes);
			this._placeSlot("icon", this._slotIcon);
		}
		this._placeSlot("actions", this._slotActions);
		this._placeSlot("body", this._slotBody);
		for (const nodes of [
			this._slotTitle,
			this._slotLabel,
			this._slotSubtitle,
			this._slotDescription,
			this._slotHeader,
			this._slotIcon
		]) this._parked = parkDetachedNodes(this._parked, nodes);
	}
	_renderIcon() {
		if (!this._hasIconContent || this._hasHeaderSlotState) return nothing;
		return html`
      <span class=${this._cls("mono-accordion-icon", "icon")} mono-glyph aria-hidden="true">
        <span data-mono-slot="icon"></span>
      </span>
    `;
	}
	_renderText() {
		if (this._hasHeaderSlotState) return html`<span class="mono-accordion-text" mono-heading data-mono-slot="header"></span>`;
		if (!this._hasTitleContent && !this._hasSubtitleContent) return nothing;
		return html`
      <span class="mono-accordion-text" mono-heading>
        ${this._hasTitleContent ? html`
              <span class=${this._cls("mono-accordion-title", "title")} mono-title>
                ${this._hasTitleSlotState ? html`<span data-mono-slot="title"></span>` : this.title}
              </span>
            ` : nothing}

        ${this._hasSubtitleContent ? html`
              <span
                class=${this._cls("mono-accordion-description", "description")}
                mono-subtitle
                mono-description
              >
                ${this._hasSubtitleSlotState ? html`<span data-mono-slot="subtitle"></span>` : this.subtitle}
              </span>
            ` : nothing}
      </span>
    `;
	}
	_renderActions() {
		if (!this._hasActionsSlotState) return nothing;
		return html`
      <span class=${this._cls("mono-accordion-actions", "actions")} mono-actions>
        <span data-mono-slot="actions"></span>
      </span>
    `;
	}
	_renderBody() {
		return html`
      <div class=${this._cls("mono-accordion-body", "body")} mono-body role="region">
        ${this._hasBodySlotState ? html`<span data-mono-slot="body"></span>` : html`<slot></slot>`}
      </div>
    `;
	}
	render() {
		return html`
      <div class=${this._wrapperClasses} mono-accordion title="" ${ref(this.bindRoot)}>
        <button
          type="button"
          class=${this._cls("mono-accordion-head", "head")}
          mono-head
          aria-expanded=${this.modelValue ? "true" : "false"}
          ?disabled=${this.disabled}
          @click=${this._handleClick}
        >
          ${this._renderIcon()}
          ${this._renderText()}
          ${this._renderActions()}
          <span class=${this._cls("mono-accordion-arrow", "arrow")} mono-arrow aria-hidden="true">
            <span class="mono-icon i-mdi-chevron-down" aria-hidden="true"></span>
          </span>
        </button>

        ${this._renderBody()}
      </div>
    `;
	}
	/**
	* Capture `slot="…"` named children + the unnamed/default body content into the
	* per-region arrays. Safe to run MORE THAN ONCE: captured nodes are detached
	* from the host (and named ones lose their `slot` attribute), so a re-scan never
	* re-captures them — and the Lit-rendered wrapper (`.mono-accordion`) is skipped.
	* Re-running lets the MutationObserver pick up children Vue appends after connect.
	*/
	_captureSlots() {
		this._slotObserver?.disconnect();
		const captured = monoHostChildNodes(this);
		const capturedNodes = /* @__PURE__ */ new Set();
		for (const node of captured) if (node instanceof Element) {
			if (node.classList.contains("mono-accordion")) continue;
			const slotName = node.getAttribute("slot");
			const named = slotName === "title" ? this._slotTitle : slotName === "label" ? this._slotLabel : slotName === "subtitle" ? this._slotSubtitle : slotName === "description" ? this._slotDescription : slotName === "header" ? this._slotHeader : null;
			if (named) {
				node.removeAttribute("slot");
				named.push(node);
				capturedNodes.add(node);
			} else if (slotName === "icon") {
				node.removeAttribute("slot");
				this._slotIcon.push(node);
				capturedNodes.add(node);
			} else if (slotName === "actions") {
				node.removeAttribute("slot");
				this._slotActions.push(node);
				capturedNodes.add(node);
			} else {
				if (slotName === "body") node.removeAttribute("slot");
				this._slotBody.push(node);
				capturedNodes.add(node);
			}
		} else if (node.nodeType === Node.TEXT_NODE && node.textContent?.trim()) {
			this._slotBody.push(node);
			capturedNodes.add(node);
		}
		if (capturedNodes.size) {
			this._hasTitleSlotState = this._titleNodes.length > 0;
			this._hasSubtitleSlotState = this._subtitleNodes.length > 0;
			this._hasHeaderSlotState = this._slotHeader.length > 0;
			this._hasIconSlotState = this._slotIcon.length > 0;
			this._hasActionsSlotState = this._slotActions.length > 0;
			this._hasBodySlotState = this._slotBody.length > 0;
			for (const node of capturedNodes) if (node.parentNode === this) this.removeChild(node);
		}
		guardHostTextContent(this, new Map([
			["title", this._slotTitle],
			["label", this._slotLabel],
			["subtitle", this._slotSubtitle],
			["description", this._slotDescription],
			["header", this._slotHeader],
			["icon", this._slotIcon],
			["actions", this._slotActions],
			["body", this._slotBody]
		]), {
			fallback: "body",
			onWrite: () => {
				this._hasBodySlotState = this._slotBody.length > 0;
				this.requestUpdate();
			}
		});
		if (this._slotObserver && this.isConnected) this._slotObserver.observe(this, { childList: true });
	}
	_placeSlot(name, nodes) {
		if (!nodes.length) return;
		const target = this.querySelector(`[data-mono-slot="${name}"]`);
		if (!target) return;
		for (const node of nodes) placeSlotNode(target, node);
	}
};
MonoAccordion = __decorate([customElement("mono-accordion")], MonoAccordion);
//#endregion
export { MonoAccordion };
