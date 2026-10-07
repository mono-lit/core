import { l as monoHostChildNodes } from "../mono-ui-CPV7rrdo.js";
import { t as customElement } from "../mono-element-B0kP_96P.js";
import { a as defineHybridPropAliases, o as numberStringConverter, r as booleanStringConverter, t as __decorate } from "../decorate-DEXtNagw.js";
import { t as dispatchMonoEvent } from "../mono-event-Bi1qP9uN.js";
import { i as guardHostTextContent, s as placeSlotNode } from "../light-slots-DW1WgfgT.js";
import { n as applyPopupPlacement, r as computePopupPlacement, t as PopupPortalController } from "../popup-portal-BziRX1yG.js";
import { n as cssPart, r as defineCssClassAliases, t as applyCssClass } from "../css-class-BRKRzHx-.js";
import { LitElement, html, isServer, nothing, unsafeCSS } from "lit";
import { property, state } from "lit/decorators.js";
//#region src/components/dropdown/dropdown-core.ts
/**
* `MonoDropdownCore` — all render-mode-agnostic logic for `mono-dropdown`:
* reactive props, hybrid aliases, host-class management, open/close state +
* events, trigger listeners, outside-click/escape, and `position: fixed` panel
* positioning (with containing-block compensation).
*
* SSR-safe: every `document`/`window`/layout-measuring path is guarded by
* `isServer` (lit) so `@lit-labs/ssr` can render it on the server.
*
* Leaves to each build: `createRenderRoot()`, the slot strategy + `render()`,
* and `_activeMainNodes()` (light: captured nodes; shadow: main slot's
* assigned elements). Panel/queries use `this.renderRoot`, which is `this` for
* the light build and the shadow root for the shadow build.
*/
/**
* The dropdown's PUBLIC custom properties, handed to the popup portal so a
* relocated panel keeps overrides an ancestor of the host set — a portaled panel
* is a child of `<body>`, so it inherits none of them, and `getComputedStyle`
* cannot enumerate custom properties for the portal to copy them blindly.
*
* Kept in step with dropdown.css by tests/dropdown-attributes.test.ts.
*/
var DROPDOWN_STYLE_VARS = [
	"--mono-dropdown-accent",
	"--mono-dropdown-bg",
	"--mono-dropdown-border",
	"--mono-dropdown-danger",
	"--mono-dropdown-font",
	"--mono-dropdown-font-lg",
	"--mono-dropdown-font-md",
	"--mono-dropdown-font-sm",
	"--mono-dropdown-font-xl",
	"--mono-dropdown-font-xs",
	"--mono-dropdown-font-xxl",
	"--mono-dropdown-gap",
	"--mono-dropdown-gap-lg",
	"--mono-dropdown-gap-md",
	"--mono-dropdown-gap-sm",
	"--mono-dropdown-gap-xl",
	"--mono-dropdown-gap-xs",
	"--mono-dropdown-gap-xxl",
	"--mono-dropdown-info",
	"--mono-dropdown-line-height",
	"--mono-dropdown-max-width",
	"--mono-dropdown-max-width-lg",
	"--mono-dropdown-max-width-md",
	"--mono-dropdown-max-width-sm",
	"--mono-dropdown-max-width-xl",
	"--mono-dropdown-max-width-xs",
	"--mono-dropdown-max-width-xxl",
	"--mono-dropdown-min-width",
	"--mono-dropdown-min-width-lg",
	"--mono-dropdown-min-width-md",
	"--mono-dropdown-min-width-sm",
	"--mono-dropdown-min-width-xl",
	"--mono-dropdown-min-width-xs",
	"--mono-dropdown-min-width-xxl",
	"--mono-dropdown-offset",
	"--mono-dropdown-offset-lg",
	"--mono-dropdown-offset-md",
	"--mono-dropdown-offset-sm",
	"--mono-dropdown-offset-xl",
	"--mono-dropdown-offset-xs",
	"--mono-dropdown-offset-xxl",
	"--mono-dropdown-pad-x",
	"--mono-dropdown-pad-x-lg",
	"--mono-dropdown-pad-x-md",
	"--mono-dropdown-pad-x-sm",
	"--mono-dropdown-pad-x-xl",
	"--mono-dropdown-pad-x-xs",
	"--mono-dropdown-pad-x-xxl",
	"--mono-dropdown-pad-y",
	"--mono-dropdown-pad-y-lg",
	"--mono-dropdown-pad-y-md",
	"--mono-dropdown-pad-y-sm",
	"--mono-dropdown-pad-y-xl",
	"--mono-dropdown-pad-y-xs",
	"--mono-dropdown-pad-y-xxl",
	"--mono-dropdown-primary",
	"--mono-dropdown-radius",
	"--mono-dropdown-radius-lg",
	"--mono-dropdown-radius-md",
	"--mono-dropdown-radius-sm",
	"--mono-dropdown-radius-xl",
	"--mono-dropdown-radius-xs",
	"--mono-dropdown-radius-xxl",
	"--mono-dropdown-ring-base",
	"--mono-dropdown-ring-color",
	"--mono-dropdown-ring-width",
	"--mono-dropdown-secondary",
	"--mono-dropdown-shadow",
	"--mono-dropdown-success",
	"--mono-dropdown-surface",
	"--mono-dropdown-text",
	"--mono-dropdown-warning",
	"--mono-dropdown-teal",
	"--mono-dropdown-purple",
	"--mono-dropdown-neutral",
	"--mono-dropdown-dark"
];
var MonoDropdownCore = (superClass) => {
	class MonoDropdownCoreClass extends superClass {
		constructor(...args) {
			super(...args);
			this._popup = new PopupPortalController(this, {
				getPanel: () => this.renderRoot.querySelector(".mono-dropdown-panel"),
				getAnchor: () => this._firstMainElement(),
				getStyleScope: () => this,
				isOpen: () => this.modelValue,
				side: () => this._sideFromPlacement(this.placement),
				align: () => this._alignFromPlacement(this.placement),
				offset: () => this.offset,
				styleVars: () => DROPDOWN_STYLE_VARS,
				flip: () => this.flip,
				shift: () => this.shift,
				onSideResolved: (side) => {
					if (this._resolvedSide !== side) {
						this._resolvedSide = side;
						this._updateHostClasses();
					}
				}
			});
			this.placement = "bottom-start";
			this.trigger = "click";
			this.size = "md";
			this.color = "primary";
			this.modelValue = false;
			this.disabled = false;
			this.flip = true;
			this.shift = true;
			this.offset = 4;
			this.closeOnOutsideClick = true;
			this.closeOnEscape = true;
			this.cssClass = {};
			this.cssClassName = "";
			this._resolvedSide = "bottom";
			this._triggerListenersAttached = false;
			this._attachedTriggerNodes = [];
			this._appliedHostClasses = /* @__PURE__ */ new Set();
			this._viewportBound = false;
			this._viewportFrame = 0;
			this._handleTriggerClick = (event) => {
				if (this.disabled || this.trigger !== "click") return;
				event.stopPropagation();
				this._setOpen(!this.modelValue, "trigger", event);
			};
			this._handleTriggerHoverIn = (event) => {
				if (this.disabled || this.trigger !== "hover" || this.modelValue) return;
				this._setOpen(true, "hover", event);
			};
			this._handleTriggerHoverOut = (event) => {
				if (this.disabled || this.trigger !== "hover" || !this.modelValue) return;
				this._setOpen(false, "hover", event);
			};
			this._handleTriggerKeydown = (event) => {
				if (this.disabled || this.trigger !== "click") return;
				if (event.key === "Enter" || event.key === " ") {
					event.preventDefault();
					this._setOpen(!this.modelValue, "trigger", event);
				}
			};
			this._handleDocumentClick = (event) => {
				if (!this.modelValue || !this.closeOnOutsideClick) return;
				const path = event.composedPath();
				if (path.includes(this) || this._popup.containsInPath(path)) return;
				this._setOpen(false, "outside", event);
			};
			this._handleDocumentKeydown = (event) => {
				if (!this.modelValue || !this.closeOnEscape || event.key !== "Escape") return;
				if (this._popup.ownsNestedInPath(event.composedPath())) return;
				event.preventDefault();
				this._setOpen(false, "escape", event);
			};
			this._handleViewportChange = () => {
				if (!this.modelValue || this._viewportFrame) return;
				this._viewportFrame = requestAnimationFrame(() => {
					this._viewportFrame = 0;
					if (this.modelValue) this._positionPanel();
				});
			};
			defineHybridPropAliases(this, [
				"modelValue",
				"closeOnOutsideClick",
				"closeOnEscape"
			]);
			defineCssClassAliases(this, (value) => this._setCssClass(value));
		}
		static get observedAttributes() {
			return [
				...super.observedAttributes ?? [],
				"modelvalue",
				"closeonoutsideclick",
				"closeonescape",
				"css-class",
				"cssclass"
			];
		}
		attributeChangedCallback(name, oldValue, newValue) {
			super.attributeChangedCallback(name, oldValue, newValue);
			if (oldValue === newValue) return;
			if (name === "modelvalue") this.modelValue = this._toBoolean(newValue);
			else if (name === "closeonoutsideclick") this.closeOnOutsideClick = this._toBoolean(newValue);
			else if (name === "closeonescape") this.closeOnEscape = this._toBoolean(newValue);
			else if (name === "css-class" || name === "cssclass") this._setCssClass(newValue);
		}
		connectedCallback() {
			super.connectedCallback();
			this._resolvedSide = this._sideFromPlacement(this.placement);
			this._updateHostClasses();
			if (isServer) return;
			document.addEventListener("click", this._handleDocumentClick, true);
			document.addEventListener("keydown", this._handleDocumentKeydown);
			if (this.modelValue) this._bindViewport();
		}
		disconnectedCallback() {
			if (!isServer) {
				document.removeEventListener("click", this._handleDocumentClick, true);
				document.removeEventListener("keydown", this._handleDocumentKeydown);
			}
			this._unbindViewport();
			this._detachTriggerListeners();
			super.disconnectedCallback();
		}
		updated(changed) {
			super.updated(changed);
			this._updateHostClasses();
			this._syncTriggerListeners();
			if (this.modelValue) {
				this._bindViewport();
				this._popup.reposition();
				this._positionPanel();
			} else this._unbindViewport();
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
			applyCssClass(this, value);
		}
		_cls(base, key) {
			return cssPart(this.cssClass, base, key);
		}
		_sideFromPlacement(p) {
			if (p.startsWith("top")) return "top";
			if (p.startsWith("left")) return "left";
			if (p.startsWith("right")) return "right";
			return "bottom";
		}
		_alignFromPlacement(p) {
			if (p.endsWith("-start")) return "start";
			if (p.endsWith("-end")) return "end";
			return "center";
		}
		/**
		* The Basecoat styling attributes for the ROOT, mirroring the props one for
		* one. `side` and `align` are the RESOLVED pair (upstream splits placement
		* that way, and flip/shift can move the side at runtime) while
		* `mono-placement` keeps the prop itself visible for a consumer's own CSS.
		* A value at its default emits nothing, so `:not([mono-size])` is md.
		*/
		_computeRootAttrs() {
			const align = this._alignFromPlacement(this.placement);
			const side = this.modelValue ? this._resolvedSide : this._sideFromPlacement(this.placement);
			return {
				"mono-size": this.size === "md" ? null : this.size,
				"mono-color": this.color === "primary" ? null : this.color,
				"mono-placement": this.placement === "bottom-start" ? null : this.placement,
				"mono-side": side === "bottom" ? null : side,
				"mono-align": align === "start" ? null : align,
				"mono-trigger": this.trigger === "click" ? null : this.trigger,
				"mono-open": this.modelValue ? "" : null,
				"mono-disabled": this.disabled ? "" : null,
				"mono-fixed": ""
			};
		}
		/** Write {@link _computeRootAttrs} onto whichever element carries the root. */
		_applyRootAttrs(root) {
			if (!root) return;
			if (!root.hasAttribute("mono-dropdown")) root.setAttribute("mono-dropdown", "");
			for (const [name, value] of Object.entries(this._computeRootAttrs())) if (value === null) root.removeAttribute(name);
			else if (root.getAttribute(name) !== value) root.setAttribute(name, value);
		}
		_computeHostClasses() {
			return [
				"mono-dropdown",
				this.size,
				this.color,
				this.placement,
				`is-${this._resolvedSide}`,
				"is-fixed",
				this.modelValue ? "open" : null,
				this.disabled ? "disabled" : null,
				this.cssClassName || null,
				this.cssClass?.root || null
			].filter((c) => Boolean(c));
		}
		/**
		* Apply the computed state classes. The LIGHT build renders into `this`, so
		* the classes go on the host element (imperatively). The SHADOW build
		* overrides this to a no-op and instead renders the classes onto an inner
		* `.mono-dropdown` root in `render()` — the host's `class` is controlled by
		* the framework (Vue) and would otherwise wipe imperatively-added classes
		* (e.g. `open`) on every re-render.
		*/
		_updateHostClasses() {
			if (isServer) return;
			this._applyRootAttrs(this);
			const next = new Set(this._computeHostClasses());
			for (const cls of this._appliedHostClasses) if (!next.has(cls)) this.classList.remove(cls);
			for (const cls of next) if (!this._appliedHostClasses.has(cls)) this.classList.add(cls);
			this._appliedHostClasses = next;
		}
		_setOpen(next, source, sourceEvent) {
			if (this.disabled && next) return;
			if (this.modelValue === next) return;
			const oldValue = this.modelValue;
			this.modelValue = next;
			const detail = {
				modelValue: next,
				currentValue: next,
				oldValue,
				value: next,
				source,
				sourceEvent,
				resolvedSide: this._resolvedSide
			};
			dispatchMonoEvent(this, "click", detail, { alias: "toggle" });
			dispatchMonoEvent(this, next ? "open" : "close", detail);
		}
		show(source = "manual") {
			this._setOpen(true, source);
		}
		hide(source = "manual") {
			this._setOpen(false, source);
		}
		toggle(source = "manual") {
			this._setOpen(!this.modelValue, source);
		}
		focus() {
			this._firstMainElement()?.focus();
		}
		blur() {
			this._firstMainElement()?.blur();
		}
		_firstMainElement() {
			for (const node of this._activeMainNodes()) return node;
			return null;
		}
		/**
		* The activator element(s) projected into the `main` slot. Overridden per
		* build (light: captured nodes; shadow: main slot's assignedElements).
		*/
		_activeMainNodes() {
			return [];
		}
		_syncTriggerListeners() {
			if (isServer) return;
			const next = this._activeMainNodes();
			if (next.length === this._attachedTriggerNodes.length && next.every((n, i) => n === this._attachedTriggerNodes[i]) && this._triggerListenersAttached) return;
			this._detachTriggerListeners();
			for (const node of next) {
				node.addEventListener("click", this._handleTriggerClick);
				node.addEventListener("keydown", this._handleTriggerKeydown);
				node.addEventListener("mouseenter", this._handleTriggerHoverIn);
				node.addEventListener("mouseleave", this._handleTriggerHoverOut);
			}
			this._attachedTriggerNodes = next;
			this._triggerListenersAttached = next.length > 0;
		}
		_detachTriggerListeners() {
			for (const node of this._attachedTriggerNodes) {
				node.removeEventListener("click", this._handleTriggerClick);
				node.removeEventListener("keydown", this._handleTriggerKeydown);
				node.removeEventListener("mouseenter", this._handleTriggerHoverIn);
				node.removeEventListener("mouseleave", this._handleTriggerHoverOut);
			}
			this._attachedTriggerNodes = [];
			this._triggerListenersAttached = false;
		}
		/**
		* Listen for viewport movement — but ONLY while this dropdown is open.
		*
		* These used to be bound in `connectedCallback`, so every dropdown on the page
		* held a capture-phase `scroll` listener on `window` whether or not it was open,
		* and each one ran a forced layout per scroll event. A non-passive capture
		* listener on `window` also disqualifies the whole page's scrolling from running
		* off the compositor thread; nothing here calls `preventDefault`, so `passive`.
		*/
		_bindViewport() {
			if (isServer || this._viewportBound) return;
			window.addEventListener("scroll", this._handleViewportChange, {
				capture: true,
				passive: true
			});
			window.addEventListener("resize", this._handleViewportChange, { passive: true });
			this._viewportBound = true;
		}
		_unbindViewport() {
			if (isServer) return;
			if (this._viewportFrame) {
				cancelAnimationFrame(this._viewportFrame);
				this._viewportFrame = 0;
			}
			if (!this._viewportBound) return;
			window.removeEventListener("scroll", this._handleViewportChange, true);
			window.removeEventListener("resize", this._handleViewportChange);
			this._viewportBound = false;
		}
		/**
		* Place the panel against its trigger.
		*
		* SHADOW build in practice: the light build's panel is relocated into a body
		* portal and `PopupPortalController` positions it there (from its
		* `hostUpdated`, and again from `updated()` once the activator is placed). Both
		* paths therefore run the SAME shared math — main-axis flip, cross-axis align
		* flip, shift, and painted-extent measurement. This method used to carry its
		* own copy of that algorithm, which is precisely how it came to be missing
		* all of the above; `dropdown-table-core` already delegates the same way.
		*/
		_positionPanel() {
			if (isServer) return;
			const panel = this.renderRoot.querySelector(".mono-dropdown-panel");
			if (!panel) return;
			const main = this._firstMainElement();
			if (!main) {
				panel.style.top = "";
				panel.style.left = "";
				panel.style.right = "";
				panel.style.bottom = "";
				return;
			}
			const placement = computePopupPlacement(main, panel, {
				side: this._sideFromPlacement(this.placement),
				align: this._alignFromPlacement(this.placement),
				offset: this.offset,
				flip: this.flip,
				shift: this.shift
			});
			applyPopupPlacement(panel, placement);
			if (this._resolvedSide !== placement.side) {
				this._resolvedSide = placement.side;
				this._updateHostClasses();
			}
		}
	}
	__decorate([property({ type: String })], MonoDropdownCoreClass.prototype, "placement", void 0);
	__decorate([property({ type: String })], MonoDropdownCoreClass.prototype, "trigger", void 0);
	__decorate([property({ type: String })], MonoDropdownCoreClass.prototype, "size", void 0);
	__decorate([property({ type: String })], MonoDropdownCoreClass.prototype, "color", void 0);
	__decorate([property({
		attribute: "model-value",
		reflect: true,
		converter: booleanStringConverter
	})], MonoDropdownCoreClass.prototype, "modelValue", void 0);
	__decorate([property({
		reflect: true,
		converter: booleanStringConverter
	})], MonoDropdownCoreClass.prototype, "disabled", void 0);
	__decorate([property({ converter: booleanStringConverter })], MonoDropdownCoreClass.prototype, "flip", void 0);
	__decorate([property({ converter: booleanStringConverter })], MonoDropdownCoreClass.prototype, "shift", void 0);
	__decorate([property({ converter: numberStringConverter })], MonoDropdownCoreClass.prototype, "offset", void 0);
	__decorate([property({
		attribute: "close-on-outside-click",
		converter: booleanStringConverter
	})], MonoDropdownCoreClass.prototype, "closeOnOutsideClick", void 0);
	__decorate([property({
		attribute: "close-on-escape",
		converter: booleanStringConverter
	})], MonoDropdownCoreClass.prototype, "closeOnEscape", void 0);
	__decorate([property({ attribute: false })], MonoDropdownCoreClass.prototype, "cssClass", void 0);
	__decorate([property({ attribute: false })], MonoDropdownCoreClass.prototype, "cssClassName", void 0);
	__decorate([state()], MonoDropdownCoreClass.prototype, "_resolvedSide", void 0);
	return MonoDropdownCoreClass;
};
//#endregion
//#region src/components/dropdown/dropdown.css?raw
var dropdown_default = "/* =========================================================================\r\n   mono-dropdown — a port of Basecoat's `.popover` + `[data-popover]`\r\n   (basecoat-css@1.0.2, vega style).\r\n\r\n   Styled by ATTRIBUTE, like Basecoat — and the attributes mirror the element's\r\n   props one for one, so hand-written markup reads like the Lit / Vue tag:\r\n\r\n     <mono-dropdown size=\"lg\" color=\"success\" placement=\"bottom-start\">\r\n     <div mono-dropdown mono-size=\"lg\" mono-color=\"success\"\r\n          mono-placement=\"bottom-start\" mono-side=\"bottom\" mono-align=\"start\">\r\n       <span mono-activator><button>Click me</button></span>\r\n       <div mono-panel role=\"dialog\" aria-hidden=\"false\">\r\n         <div mono-body>Any HTML goes here.</div>\r\n       </div>\r\n     </div>\r\n\r\n   An absent attribute is the prop's default (`:not([mono-size])` = md,\r\n   `:not([mono-color])` = primary, no `mono-side` = bottom, no `mono-align` =\r\n   start). The element writes these on its ROOT — the host in the light build,\r\n   an inner root `<div>` in the shadow one — plus the states `mono-open`,\r\n   `mono-disabled` and `mono-fixed` (set once the element takes over positioning\r\n   and writes inline top/left). The old classes (`.mono-dropdown.md.primary.open`)\r\n   are still emitted as inert hooks until 2.0 but no rule here reads them.\r\n\r\n   Selector map (ours ≡ upstream):\r\n     [mono-dropdown]                ≡ .popover (relative inline-flex) — DEVIATION:\r\n                                      inline-BLOCK, because the activator wrapper is\r\n                                      `display: contents` and must not become a flex item\r\n     [mono-activator]               ≡ EXTENSION (upstream's trigger is a sibling <button>;\r\n                                      ours wraps a slotted one and stays out of layout)\r\n     [mono-panel]                   ≡ [data-popover] (absolute z-50 min-w-full w-max\r\n                                      overflow-x-hidden overflow-y-auto visible opacity-100\r\n                                      scale-100 transition-all outline-hidden, and\r\n                                      bg-popover text-popover-foreground ring-1\r\n                                      ring-foreground/10 flex flex-col gap-4 rounded-md\r\n                                      p-4 text-sm shadow-md duration-100)\r\n     [mono-panel][aria-hidden=true] ≡ [data-popover][aria-hidden='true'] (invisible\r\n                                      opacity-0 scale-95 + a 2-unit translate away from\r\n                                      the side it opens from)\r\n     [mono-side=\"…\"]                ≡ [data-popover][data-side='…'] (mt-1 top-full,\r\n                                      mb-1 bottom-full, me-1 end-full, ms-1 start-full)\r\n                                      — DEVIATION: the 1-unit margin is\r\n                                      `--mono-dropdown-offset`, a prop (`offset`)\r\n     [mono-align=\"…\"]               ≡ [data-popover][data-align='…'] (start-0 / end-0 /\r\n                                      start-1/2 -translate-x-1/2, and the top/bottom pair\r\n                                      for the two side placements)\r\n     [mono-body]                    ≡ EXTENSION (the panel's width floor, see below)\r\n     [mono-size=\"…\"]                ≡ EXTENSION (upstream ships one popover size)\r\n     [mono-color=\"…\"]               ≡ EXTENSION (the role tints the ring)\r\n     [mono-disabled]                ≡ .btn disabled:opacity-50 — DEVIATION: 0.55, the\r\n                                      pre-port value, because the activator is a\r\n                                      consumer's own control and dimming it twice reads\r\n                                      as broken\r\n\r\n   THE PANEL IS PORTALED. While open, the light build moves [mono-panel] into a\r\n   body portal; `composables/popup-portal` mirrors the root's class AND its\r\n   `mono-*` attributes onto that portal, so `[mono-dropdown] > [mono-panel]`\r\n   keeps matching there. Every panel rule is written as a CHILD of the root for\r\n   exactly that reason — and because `>` also stops these rules reaching a\r\n   `[mono-body]` that belongs to a card slotted inside the panel.\r\n\r\n   `[mono-dropdown]` IS ALSO A PART NAME: select, tag-input, date and\r\n   dropdown-table all call their popup panel `[mono-dropdown]`, scoped\r\n   `[mono-<field>] > [mono-dropdown]` = (0,2,0). This root rule is (0,1,0), so it\r\n   loses everywhere they set a property — and it deliberately sets NO paint (no\r\n   colour, no background), only layout and custom properties, so nothing it does\r\n   set can reach a field's panel visibly. Same contract as chip's root.\r\n\r\n   Specificity contract (same as the pre-port class sheet): a part's RESTING rule\r\n   is exactly one attribute strong — `:where([mono-dropdown]) > [mono-panel]` =\r\n   (0,1,0) — so a utility class handed in through `cssClass` wins by source\r\n   order, while the prop and state rules stay heavier.\r\n\r\n   FLAVORS set `--mono-dropdown-{radius,ring-color,ring-width,shadow,gap,\r\n   padding-<size>,font-<size>,min-width-<size>,max-width-<size>,offset-<size>}`;\r\n   every fallback here is vega's value\r\n   (`node scripts/basecoat-styles.mjs --varying \"popover\"`).\r\n   ========================================================================= */\r\n\r\nmono-dropdown {\r\n  display: inline-block;\r\n}\r\n\r\n/* =========================================\r\n   Root — layout and the palette. NOTHING here paints (see the header).\r\n   ========================================= */\r\n\r\n[mono-dropdown] {\r\n  /* ── the six roles, each a public knob over a Basecoat token ───────────── */\r\n  --_mono-dropdown-primary: var(--mono-dropdown-primary, var(--primary));\r\n  --_mono-dropdown-secondary: var(--mono-dropdown-secondary, var(--secondary-foreground));\r\n  --_mono-dropdown-success: var(--mono-dropdown-success, var(--success));\r\n  --_mono-dropdown-danger: var(--mono-dropdown-danger, var(--destructive));\r\n  --_mono-dropdown-warning: var(--mono-dropdown-warning, var(--warning));\r\n  --_mono-dropdown-info: var(--mono-dropdown-info, var(--info));\r\n  --_mono-dropdown-teal: var(--mono-dropdown-teal, var(--teal));\r\n  --_mono-dropdown-purple: var(--mono-dropdown-purple, var(--purple));\r\n  --_mono-dropdown-neutral: var(--mono-dropdown-neutral, var(--neutral));\r\n  --_mono-dropdown-dark: var(--mono-dropdown-dark, var(--dark));\r\n  /* the colour in play — `primary` unless a [mono-color] rule re-points it */\r\n  --_mono-dropdown-accent: var(--mono-dropdown-accent, var(--_mono-dropdown-accent-preset, var(--_mono-dropdown-primary)));\r\n\r\n  --_mono-dropdown-bg: var(--mono-dropdown-bg, var(--mono-dropdown-surface, var(--popover)));\r\n  --_mono-dropdown-text: var(--mono-dropdown-text, var(--popover-foreground));\r\n  /* `ring-1 ring-foreground/10`, with the role mixed in so `color` is visible on\r\n     an otherwise neutral surface (EXTENSION — upstream's popover has no colour) */\r\n  --_mono-dropdown-ring-width: var(--mono-dropdown-ring-width, var(--mono-border-width));\r\n  /* the neutral half of the ring is its own knob: a flavor that wants\r\n     `ring-foreground/5` sets THAT, and the role stays mixed in on top */\r\n  --_mono-dropdown-ring-base: var(--mono-dropdown-ring-base, color-mix(in oklab, var(--foreground) 10%, transparent));\r\n  --_mono-dropdown-ring-color: var(--mono-dropdown-ring-color, var(--mono-dropdown-border,\r\n    color-mix(in oklab, var(--_mono-dropdown-accent) 18%, var(--_mono-dropdown-ring-base))));\r\n  --_mono-dropdown-shadow: var(--mono-dropdown-shadow, var(--mono-shadow-md));\r\n\r\n  /* ── md metrics live on the unqualified root ON PURPOSE ────────────────────\r\n     basecoat@1.0.2 styles/vega.css [data-popover] — gap-4 rounded-md p-4 text-sm */\r\n  --_mono-dropdown-radius: var(--mono-dropdown-radius, var(--_mono-dropdown-radius-preset, var(--mono-dropdown-radius-md, var(--mono-radius-md))));\r\n  --_mono-dropdown-pad-x: var(--mono-dropdown-pad-x, var(--_mono-dropdown-pad-x-preset, var(--mono-dropdown-pad-x-md, calc(var(--mono-spacing) * 4))));\r\n  --_mono-dropdown-pad-y: var(--mono-dropdown-pad-y, var(--_mono-dropdown-pad-y-preset, var(--mono-dropdown-pad-y-md, calc(var(--mono-spacing) * 4))));\r\n  --_mono-dropdown-gap: var(--mono-dropdown-gap, var(--_mono-dropdown-gap-preset, var(--mono-dropdown-gap-md, calc(var(--mono-spacing) * 4))));\r\n  --_mono-dropdown-font: var(--mono-dropdown-font, var(--_mono-dropdown-font-preset, var(--mono-dropdown-font-md, var(--mono-text-sm))));\r\n  --_mono-dropdown-line-height: var(--mono-dropdown-line-height, var(--_mono-dropdown-line-height-preset, var(--mono-text-sm--lh)));\r\n  --_mono-dropdown-min-width: var(--mono-dropdown-min-width, var(--_mono-dropdown-min-width-preset, var(--mono-dropdown-min-width-md, 200px)));\r\n  --_mono-dropdown-max-width: var(--mono-dropdown-max-width, var(--_mono-dropdown-max-width-preset, var(--mono-dropdown-max-width-md, 280px)));\r\n  /* `mt-1` and friends — a prop here (`offset`), so it is one knob per size */\r\n  --_mono-dropdown-offset: var(--mono-dropdown-offset, var(--_mono-dropdown-offset-preset, var(--mono-dropdown-offset-md, var(--mono-spacing))));\r\n\r\n  /* basecoat@1.0.2 components/popover.css .popover — relative inline-flex */\r\n  position: relative;\r\n  display: inline-block;\r\n  box-sizing: border-box;\r\n  font-family: inherit;\r\n}\r\n\r\n[mono-dropdown] *,\r\n[mono-dropdown] *::before,\r\n[mono-dropdown] *::after {\r\n  box-sizing: border-box;\r\n}\r\n\r\n/* =========================================\r\n   Sizes — EXTENSION: Basecoat ships ONE popover; md is its `[data-popover]`\r\n   ========================================= */\r\n\r\n[mono-dropdown][mono-size=\"xs\"] {\r\n  --_mono-dropdown-radius-preset: var(--mono-dropdown-radius-xs, var(--mono-radius-sm));\r\n  --_mono-dropdown-pad-x-preset: var(--mono-dropdown-pad-x-xs, calc(var(--mono-spacing) * 2));\r\n  --_mono-dropdown-pad-y-preset: var(--mono-dropdown-pad-y-xs, calc(var(--mono-spacing) * 2));\r\n  --_mono-dropdown-gap-preset: var(--mono-dropdown-gap-xs, calc(var(--mono-spacing) * 1.5));\r\n  --_mono-dropdown-font-preset: var(--mono-dropdown-font-xs, var(--mono-text-xs));\r\n  --_mono-dropdown-line-height-preset: var(--mono-text-xs--lh);\r\n  --_mono-dropdown-min-width-preset: var(--mono-dropdown-min-width-xs, 150px);\r\n  --_mono-dropdown-max-width-preset: var(--mono-dropdown-max-width-xs, 220px);\r\n  --_mono-dropdown-offset-preset: var(--mono-dropdown-offset-xs, calc(var(--mono-spacing) * 0.75));\r\n}\r\n\r\n[mono-dropdown][mono-size=\"sm\"] {\r\n  --_mono-dropdown-radius-preset: var(--mono-dropdown-radius-sm, var(--mono-radius-md));\r\n  --_mono-dropdown-pad-x-preset: var(--mono-dropdown-pad-x-sm, calc(var(--mono-spacing) * 3));\r\n  --_mono-dropdown-pad-y-preset: var(--mono-dropdown-pad-y-sm, calc(var(--mono-spacing) * 3));\r\n  --_mono-dropdown-gap-preset: var(--mono-dropdown-gap-sm, calc(var(--mono-spacing) * 2.5));\r\n  --_mono-dropdown-font-preset: var(--mono-dropdown-font-sm, var(--mono-text-xs));\r\n  --_mono-dropdown-line-height-preset: var(--mono-text-xs--lh);\r\n  --_mono-dropdown-min-width-preset: var(--mono-dropdown-min-width-sm, 170px);\r\n  --_mono-dropdown-max-width-preset: var(--mono-dropdown-max-width-sm, 240px);\r\n  --_mono-dropdown-offset-preset: var(--mono-dropdown-offset-sm, var(--mono-spacing));\r\n}\r\n\r\n[mono-dropdown][mono-size=\"lg\"] {\r\n  --_mono-dropdown-radius-preset: var(--mono-dropdown-radius-lg, var(--mono-radius-lg));\r\n  --_mono-dropdown-pad-x-preset: var(--mono-dropdown-pad-x-lg, calc(var(--mono-spacing) * 5));\r\n  --_mono-dropdown-pad-y-preset: var(--mono-dropdown-pad-y-lg, calc(var(--mono-spacing) * 5));\r\n  --_mono-dropdown-gap-preset: var(--mono-dropdown-gap-lg, calc(var(--mono-spacing) * 5));\r\n  --_mono-dropdown-font-preset: var(--mono-dropdown-font-lg, var(--mono-text-sm));\r\n  --_mono-dropdown-line-height-preset: var(--mono-text-sm--lh);\r\n  --_mono-dropdown-min-width-preset: var(--mono-dropdown-min-width-lg, 240px);\r\n  --_mono-dropdown-max-width-preset: var(--mono-dropdown-max-width-lg, 340px);\r\n  --_mono-dropdown-offset-preset: var(--mono-dropdown-offset-lg, calc(var(--mono-spacing) * 1.5));\r\n}\r\n\r\n[mono-dropdown][mono-size=\"xl\"] {\r\n  --_mono-dropdown-radius-preset: var(--mono-dropdown-radius-xl, var(--mono-radius-xl));\r\n  --_mono-dropdown-pad-x-preset: var(--mono-dropdown-pad-x-xl, calc(var(--mono-spacing) * 6));\r\n  --_mono-dropdown-pad-y-preset: var(--mono-dropdown-pad-y-xl, calc(var(--mono-spacing) * 6));\r\n  --_mono-dropdown-gap-preset: var(--mono-dropdown-gap-xl, calc(var(--mono-spacing) * 5));\r\n  --_mono-dropdown-font-preset: var(--mono-dropdown-font-xl, var(--mono-text-base));\r\n  --_mono-dropdown-line-height-preset: var(--mono-text-base--lh);\r\n  --_mono-dropdown-min-width-preset: var(--mono-dropdown-min-width-xl, 280px);\r\n  --_mono-dropdown-max-width-preset: var(--mono-dropdown-max-width-xl, 420px);\r\n  --_mono-dropdown-offset-preset: var(--mono-dropdown-offset-xl, calc(var(--mono-spacing) * 2));\r\n}\r\n\r\n[mono-dropdown][mono-size=\"xxl\"] {\r\n  --_mono-dropdown-radius-preset: var(--mono-dropdown-radius-xxl, var(--mono-radius-xl));\r\n  --_mono-dropdown-pad-x-preset: var(--mono-dropdown-pad-x-xxl, calc(var(--mono-spacing) * 7));\r\n  --_mono-dropdown-pad-y-preset: var(--mono-dropdown-pad-y-xxl, calc(var(--mono-spacing) * 7));\r\n  --_mono-dropdown-gap-preset: var(--mono-dropdown-gap-xxl, calc(var(--mono-spacing) * 6));\r\n  --_mono-dropdown-font-preset: var(--mono-dropdown-font-xxl, var(--mono-text-lg));\r\n  --_mono-dropdown-line-height-preset: var(--mono-text-lg--lh);\r\n  --_mono-dropdown-min-width-preset: var(--mono-dropdown-min-width-xxl, 320px);\r\n  --_mono-dropdown-max-width-preset: var(--mono-dropdown-max-width-xxl, 480px);\r\n  --_mono-dropdown-offset-preset: var(--mono-dropdown-offset-xxl, calc(var(--mono-spacing) * 2.5));\r\n}\r\n\r\n/* =========================================\r\n   Colours — EXTENSION: the role tints the panel's ring\r\n   ========================================= */\r\n\r\n[mono-dropdown][mono-color=\"primary\"] { --_mono-dropdown-accent-preset: var(--_mono-dropdown-primary); }\r\n[mono-dropdown][mono-color=\"secondary\"] { --_mono-dropdown-accent-preset: var(--_mono-dropdown-secondary); }\r\n[mono-dropdown][mono-color=\"success\"] { --_mono-dropdown-accent-preset: var(--_mono-dropdown-success); }\r\n[mono-dropdown][mono-color=\"danger\"] { --_mono-dropdown-accent-preset: var(--_mono-dropdown-danger); }\r\n[mono-dropdown][mono-color=\"warning\"] { --_mono-dropdown-accent-preset: var(--_mono-dropdown-warning); }\r\n[mono-dropdown][mono-color=\"info\"] { --_mono-dropdown-accent-preset: var(--_mono-dropdown-info); }\r\n[mono-dropdown][mono-color=\"teal\"] { --_mono-dropdown-accent-preset: var(--_mono-dropdown-teal); }\r\n[mono-dropdown][mono-color=\"purple\"] { --_mono-dropdown-accent-preset: var(--_mono-dropdown-purple); }\r\n[mono-dropdown][mono-color=\"neutral\"] { --_mono-dropdown-accent-preset: var(--_mono-dropdown-neutral); }\r\n[mono-dropdown][mono-color=\"dark\"] { --_mono-dropdown-accent-preset: var(--_mono-dropdown-dark); }\r\n\r\n/* =========================================\r\n   Activator — EXTENSION: a wrapper that stays out of layout\r\n   ========================================= */\r\n\r\n:where([mono-dropdown]) > [mono-activator] {\r\n  display: contents;\r\n}\r\n\r\n/* The activator is the consumer's own control, so it is dimmed once and gently:\r\n   0.55 is the pre-port value, kept so a disabled dropdown reads the same. */\r\n[mono-dropdown][mono-disabled] > [mono-activator] {\r\n  opacity: 0.55;\r\n  cursor: not-allowed;\r\n}\r\n\r\n/* =========================================\r\n   Panel — `[data-popover]`\r\n   ========================================= */\r\n\r\n/* basecoat@1.0.2 components/popover.css [data-popover] — absolute z-50 min-w-full\r\n   w-max overflow-x-hidden overflow-y-auto visible opacity-100 scale-100\r\n   transition-all outline-hidden\r\n   — DEVIATIONS: `min-w-full` is the BODY's floor here (see [mono-body]) so a\r\n   body that cannot shrink sizes the panel instead of spilling out of it, and the\r\n   z-index is the shared popup stack's `--mono-popup-z` rather than a flat z-50. */\r\n:where([mono-dropdown]) > [mono-panel] {\r\n  position: absolute;\r\n  z-index: var(--mono-popup-z, 200);\r\n  width: max-content;\r\n  min-width: min-content;\r\n  max-width: var(--_mono-dropdown-max-width);\r\n  max-height: var(--mono-popup-avail-h, none);\r\n  overflow-x: hidden;\r\n  overflow-y: auto;\r\n  visibility: visible;\r\n  opacity: 1;\r\n  scale: 1;\r\n  outline: none;\r\n  transition:\r\n    opacity var(--mono-duration) var(--mono-ease),\r\n    scale var(--mono-duration) var(--mono-ease),\r\n    translate var(--mono-duration) var(--mono-ease),\r\n    visibility var(--mono-duration) var(--mono-ease);\r\n\r\n  /* basecoat@1.0.2 styles/vega.css [data-popover] — bg-popover\r\n     text-popover-foreground ring-foreground/10 flex flex-col gap-4 rounded-md p-4\r\n     text-sm shadow-md ring-1 duration-100 */\r\n  display: flex;\r\n  flex-direction: column;\r\n  gap: var(--_mono-dropdown-gap);\r\n  padding: var(--_mono-dropdown-pad-y) var(--_mono-dropdown-pad-x);\r\n  border-radius: var(--_mono-dropdown-radius);\r\n  background: var(--_mono-dropdown-bg);\r\n  color: var(--_mono-dropdown-text);\r\n  font-size: var(--_mono-dropdown-font);\r\n  line-height: var(--_mono-dropdown-line-height);\r\n  box-shadow:\r\n    0 0 0 var(--_mono-dropdown-ring-width) var(--_mono-dropdown-ring-color),\r\n    var(--_mono-dropdown-shadow);\r\n}\r\n\r\n/* basecoat@1.0.2 components/popover.css [data-popover] >> &[aria-hidden='true']\r\n   — invisible opacity-0 scale-95, and a 2-unit translate away from the side it\r\n   opens from. The element writes `aria-hidden` on the panel already, so the\r\n   closed state needs no class of its own. */\r\n[mono-dropdown] > [mono-panel][aria-hidden=\"true\"] {\r\n  visibility: hidden;\r\n  opacity: 0;\r\n  scale: 0.95;\r\n  pointer-events: none;\r\n}\r\n\r\n[mono-dropdown][mono-side=\"top\"] > [mono-panel][aria-hidden=\"true\"] {\r\n  translate: 0 calc(var(--mono-spacing) * 2);\r\n}\r\n\r\n[mono-dropdown]:not([mono-side]) > [mono-panel][aria-hidden=\"true\"],\r\n[mono-dropdown][mono-side=\"bottom\"] > [mono-panel][aria-hidden=\"true\"] {\r\n  translate: 0 calc(var(--mono-spacing) * -2);\r\n}\r\n\r\n[mono-dropdown][mono-side=\"left\"] > [mono-panel][aria-hidden=\"true\"] {\r\n  translate: calc(var(--mono-spacing) * 2) 0;\r\n}\r\n\r\n[mono-dropdown][mono-side=\"right\"] > [mono-panel][aria-hidden=\"true\"] {\r\n  translate: calc(var(--mono-spacing) * -2) 0;\r\n}\r\n\r\n/* Once the element takes over, it positions the panel in the viewport and writes\r\n   inline top/left — so the static placement rules below must not fight it. */\r\n[mono-dropdown][mono-fixed] > [mono-panel] {\r\n  position: fixed;\r\n}\r\n\r\n/* =========================================\r\n   Static placement — `[data-side]` / `[data-align]`, verbatim\r\n   -----------------------------------------------------------------------------\r\n   These are what hand-written markup (and SSR, before the element hydrates)\r\n   positions with. The element overrides them with inline top/left once it has\r\n   measured, which is why every rule here uses only the four edges.\r\n   ========================================= */\r\n\r\n/* basecoat@1.0.2 components/popover.css [data-popover] >> &:not([data-side]), &[data-side='bottom']\r\n   — mt-1 top-full */\r\n[mono-dropdown]:not([mono-side]):not([mono-fixed]) > [mono-panel],\r\n[mono-dropdown][mono-side=\"bottom\"]:not([mono-fixed]) > [mono-panel] {\r\n  top: 100%;\r\n  margin-top: var(--_mono-dropdown-offset);\r\n}\r\n\r\n/* basecoat@1.0.2 components/popover.css [data-popover] >> &[data-side='top'] — mb-1 bottom-full */\r\n[mono-dropdown][mono-side=\"top\"]:not([mono-fixed]) > [mono-panel] {\r\n  bottom: 100%;\r\n  margin-bottom: var(--_mono-dropdown-offset);\r\n}\r\n\r\n/* basecoat@1.0.2 components/popover.css [data-popover] >> &[data-side='left'] — me-1 end-full */\r\n[mono-dropdown][mono-side=\"left\"]:not([mono-fixed]) > [mono-panel] {\r\n  inset-inline-end: 100%;\r\n  margin-inline-end: var(--_mono-dropdown-offset);\r\n}\r\n\r\n/* basecoat@1.0.2 components/popover.css [data-popover] >> &[data-side='right'] — ms-1 start-full */\r\n[mono-dropdown][mono-side=\"right\"]:not([mono-fixed]) > [mono-panel] {\r\n  inset-inline-start: 100%;\r\n  margin-inline-start: var(--_mono-dropdown-offset);\r\n}\r\n\r\n/* The top/bottom pair aligns on the inline axis: start-0 / end-0 / start-1/2 -translate-x-1/2 */\r\n[mono-dropdown]:is(:not([mono-side]), [mono-side=\"top\"], [mono-side=\"bottom\"]):is(:not([mono-align]), [mono-align=\"start\"]):not([mono-fixed]) > [mono-panel] {\r\n  inset-inline-start: 0;\r\n}\r\n\r\n[mono-dropdown]:is(:not([mono-side]), [mono-side=\"top\"], [mono-side=\"bottom\"])[mono-align=\"end\"]:not([mono-fixed]) > [mono-panel] {\r\n  inset-inline-end: 0;\r\n}\r\n\r\n[mono-dropdown]:is(:not([mono-side]), [mono-side=\"top\"], [mono-side=\"bottom\"])[mono-align=\"center\"]:not([mono-fixed]) > [mono-panel] {\r\n  inset-inline-start: 50%;\r\n  translate: -50% 0;\r\n}\r\n\r\n/* …and the left/right pair on the block axis: top-0 / bottom-0 / top-1/2 -translate-y-1/2 */\r\n[mono-dropdown]:is([mono-side=\"left\"], [mono-side=\"right\"]):is(:not([mono-align]), [mono-align=\"start\"]):not([mono-fixed]) > [mono-panel] {\r\n  top: 0;\r\n}\r\n\r\n[mono-dropdown]:is([mono-side=\"left\"], [mono-side=\"right\"])[mono-align=\"end\"]:not([mono-fixed]) > [mono-panel] {\r\n  bottom: 0;\r\n}\r\n\r\n[mono-dropdown]:is([mono-side=\"left\"], [mono-side=\"right\"])[mono-align=\"center\"]:not([mono-fixed]) > [mono-panel] {\r\n  top: 50%;\r\n  translate: 0 -50%;\r\n}\r\n\r\n/* A centred panel keeps its centring translate while closed, and adds the\r\n   directional one — `translate` is a single property, so both go in one value. */\r\n[mono-dropdown]:is(:not([mono-side]), [mono-side=\"bottom\"])[mono-align=\"center\"]:not([mono-fixed]) > [mono-panel][aria-hidden=\"true\"] {\r\n  translate: -50% calc(var(--mono-spacing) * -2);\r\n}\r\n\r\n[mono-dropdown][mono-side=\"top\"][mono-align=\"center\"]:not([mono-fixed]) > [mono-panel][aria-hidden=\"true\"] {\r\n  translate: -50% calc(var(--mono-spacing) * 2);\r\n}\r\n\r\n[mono-dropdown][mono-side=\"left\"][mono-align=\"center\"]:not([mono-fixed]) > [mono-panel][aria-hidden=\"true\"] {\r\n  translate: calc(var(--mono-spacing) * 2) -50%;\r\n}\r\n\r\n[mono-dropdown][mono-side=\"right\"][mono-align=\"center\"]:not([mono-fixed]) > [mono-panel][aria-hidden=\"true\"] {\r\n  translate: calc(var(--mono-spacing) * -2) -50%;\r\n}\r\n\r\n/* =========================================\r\n   Body — EXTENSION: the panel's width floor\r\n   ========================================= */\r\n\r\n/* The floor lives HERE, not on the panel, so it reaches the panel as a\r\n   min-content contribution rather than as a competing `min-width` — which is\r\n   what lets slotted content that cannot shrink (a body with its own width) size\r\n   the panel instead of spilling out of it. Only the padding is subtracted\r\n   so the panel's border box lands on exactly --_mono-dropdown-min-width.\r\n   Only the padding is subtracted: the edge is Basecoat's `ring-1`, a\r\n   box-shadow, which takes no layout space (subtracting it left every panel 2px\r\n   under its preset). */\r\n:where([mono-dropdown]) > [mono-panel] > [mono-body] {\r\n  min-width: calc(var(--_mono-dropdown-min-width) - 2 * var(--_mono-dropdown-pad-x));\r\n}\r\n\r\n@media (prefers-reduced-motion: reduce) {\r\n  :where([mono-dropdown]) > [mono-panel] {\r\n    transition: none;\r\n  }\r\n}\r\n";
//#endregion
//#region src/components/dropdown/mono-dropdown.ts
var MonoDropdown = class MonoDropdown extends MonoDropdownCore(LitElement) {
	constructor(..._args) {
		super(..._args);
		this._hasBodySlotState = false;
		this._slotsCaptured = false;
		this._slotMain = [];
		this._slotBody = [];
	}
	static {
		this.styles = [unsafeCSS(dropdown_default)];
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
		this._placeSlot("main", this._slotMain);
		this._placeSlot("body", this._slotBody);
		super.updated(changed);
	}
	_activeMainNodes() {
		return this._slotMain.filter((n) => n instanceof HTMLElement);
	}
	_captureSlots() {
		if (this._slotsCaptured) return;
		this._slotsCaptured = true;
		const captured = monoHostChildNodes(this);
		const capturedSlotNodes = /* @__PURE__ */ new Set();
		let unslottedSeen = false;
		for (const node of captured) {
			if (!(node instanceof Element)) {
				if (node.nodeType === Node.TEXT_NODE && node.textContent?.trim()) unslottedSeen = true;
				continue;
			}
			const slotName = node.getAttribute("slot");
			if (slotName === "main") {
				node.removeAttribute("slot");
				this._slotMain.push(node);
				capturedSlotNodes.add(node);
				continue;
			}
			if (slotName === "body" || slotName === null) {
				if (slotName === "body") node.removeAttribute("slot");
				this._slotBody.push(node);
				capturedSlotNodes.add(node);
				unslottedSeen = true;
				continue;
			}
		}
		this._hasBodySlotState = unslottedSeen && this._slotBody.length > 0;
		for (const node of capturedSlotNodes) if (node.parentNode === this) this.removeChild(node);
		guardHostTextContent(this, new Map([["main", this._slotMain], ["body", this._slotBody]]), {
			fallback: "body",
			onWrite: () => {
				this._hasBodySlotState = this._slotBody.length > 0;
				this.requestUpdate();
			}
		});
	}
	_placeSlot(name, nodes) {
		if (!nodes.length) return;
		const sel = `[data-mono-slot="${name}"]`;
		const target = this.querySelector(sel) ?? this._popup.panelRoot.querySelector(sel);
		if (!target) return;
		for (const node of nodes) placeSlotNode(target, node);
	}
	_renderBody() {
		if (!this._hasBodySlotState) return nothing;
		return html`<div class=${this._cls("mono-dropdown-body", "body")} mono-body data-mono-slot="body"></div>`;
	}
	render() {
		return html`
      <span class=${this._cls("mono-dropdown-main", "main")} mono-activator data-mono-slot="main"></span>
      <div
        class=${this._cls("mono-dropdown-panel", "panel")}
        mono-panel
        role="dialog"
        aria-hidden=${this.modelValue ? "false" : "true"}
      >
        ${this._renderBody()}
      </div>
    `;
	}
};
__decorate([state()], MonoDropdown.prototype, "_hasBodySlotState", void 0);
MonoDropdown = __decorate([customElement("mono-dropdown")], MonoDropdown);
//#endregion
export { MonoDropdown };
