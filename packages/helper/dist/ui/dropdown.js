import { g as monoHostChildNodes } from "../mono-ui-jtBvJ9d5.js";
import { t as customElement } from "../mono-element-9uQRbp5X.js";
import { a as defineHybridPropAliases, o as numberStringConverter, r as booleanStringConverter, t as __decorate } from "../decorate-DbYFpi8R.js";
import { t as dispatchMonoEvent } from "../mono-event-BPku9HpS.js";
import { i as guardHostTextContent, s as placeSlotNode } from "../light-slots-B980aknU.js";
import { n as applyPopupPlacement, r as computePopupPlacement, t as PopupPortalController } from "../popup-portal-CINuVjNY.js";
import { n as cssPart, r as defineCssClassAliases, t as applyCssClass } from "../css-class-B6Tc_MAx.js";
import { LitElement, html, isServer, nothing } from "lit";
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
const DROPDOWN_STYLE_VARS = [
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
const MonoDropdownCore = (superClass) => {
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
				const path = event.composedPath();
				if (this._popup.ownsNestedInPath(path) || this._popup.inLayerAbove(path)) return;
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
				if (changed.has("modelValue")) this._popup.reposition();
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
//#region src/components/dropdown/mono-dropdown.ts
let MonoDropdown = class MonoDropdown extends MonoDropdownCore(LitElement) {
	constructor(..._args) {
		super(..._args);
		this._hasBodySlotState = false;
		this._slotsCaptured = false;
		this._slotMain = [];
		this._slotBody = [];
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
		guardHostTextContent(this, /* @__PURE__ */ new Map([["main", this._slotMain], ["body", this._slotBody]]), {
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