import { g as monoHostChildNodes } from "../mono-ui-jtBvJ9d5.js";
import { a as setExternalScrollLock } from "../popup-stack-C64WCuXq.js";
import { t as customElement } from "../mono-element-9uQRbp5X.js";
import { a as defineHybridPropAliases, o as numberStringConverter, r as booleanStringConverter, t as __decorate } from "../decorate-DbYFpi8R.js";
import { t as dispatchMonoEvent } from "../mono-event-BPku9HpS.js";
import { i as guardHostTextContent, s as placeSlotNode } from "../light-slots-B980aknU.js";
import { n as cssPart, r as defineCssClassAliases, t as applyCssClass } from "../css-class-B6Tc_MAx.js";
import { a as validateColorProp, i as isThemeColorToken, n as colorClassToken, r as customColorStyle, t as CUSTOM_COLOR_CLASS } from "../color-CEYYtRX-.js";
import { n as releaseLayoutVar, t as claimLayoutVar } from "../layout-var-BSBKY49k.js";
import { LitElement, html, isServer, nothing } from "lit";
import { property, state } from "lit/decorators.js";

//#region src/components/sidebar/sidebar-utils.ts
const SIDEBAR_AUTO_BREAKPOINT = 768;
/**
* `typeof window === 'undefined'` alone is NOT a safe server guard: a DOM shim
* can define `window` without `matchMedia` (the @lit-labs/ssr v3 shim happens
* to leave `window` undefined, but that is an implementation detail). Check
* lit's `isServer` first, then feature-detect `matchMedia`.
*/
function isAutoTemporary() {
	if (isServer || typeof window === "undefined") return false;
	if (typeof window.matchMedia !== "function") return false;
	return window.matchMedia(`(max-width: 767px)`).matches;
}
/**
* Resolves the effective mode for `auto`. Other modes pass through.
*/
function resolveMode(mode) {
	if (mode !== "auto") return mode;
	return isAutoTemporary() ? "temporary" : "permanent";
}
function generateSidebarRootClasses(props) {
	return [
		"mono-sidebar",
		`mode-${props.mode}`,
		`effective-${props.resolvedMode}`,
		`location-${props.location}`,
		props.density,
		colorClassToken(props.color),
		props.variant,
		props.open ? "open" : "closed",
		props.expandOnHover ? "expand-on-hover" : "",
		props.contained ? "contained" : "",
		props.persistent ? "persistent" : "",
		props.showScrim ? "" : "no-scrim",
		props.cssClassName ?? "",
		props.rootExtra ?? ""
	].filter(Boolean).join(" ");
}
function validateSidebarProps(props) {
	const errors = [];
	if (props.mode && ![
		"permanent",
		"temporary",
		"rail",
		"auto"
	].includes(props.mode)) errors.push(`Invalid mode: ${String(props.mode)}`);
	if (props.location && !["left", "right"].includes(props.location)) errors.push(`Invalid location: ${String(props.location)}`);
	if (props.density && ![
		"compact",
		"comfortable",
		"default"
	].includes(props.density)) errors.push(`Invalid density: ${String(props.density)}`);
	if (props.variant && ![
		"flat",
		"elevated",
		"outlined"
	].includes(props.variant)) errors.push(`Invalid variant: ${String(props.variant)}`);
	const colorError = validateColorProp(props.color);
	if (colorError) errors.push(colorError);
	if (typeof props.width === "number" && props.width < 0) errors.push(`width must be non-negative`);
	if (typeof props.railWidth === "number" && props.railWidth < 0) errors.push(`railWidth must be non-negative`);
	return errors;
}
/**
* The Basecoat styling attributes for the sidebar ROOT, mirroring the props one
* for one. A prop at its DEFAULT emits nothing — `:not([mono-density])` is
* comfortable, `:not([mono-color])` is surface, `:not([mono-variant])` is
* elevated and `:not([mono-location])` is left — so the rendered DOM is also
* the shortest hand-written markup that paints the same (see sidebar.css).
*
* `mono-effective` is always written: it carries the mode AFTER `auto`
* resolves, and it is what every layout rule keys on. A literal `color`
* collapses to `custom`, with the colour itself arriving inline.
*/
function sidebarRootAttrs(props) {
	return {
		mode: props.mode === "auto" ? null : props.mode,
		effective: props.resolvedMode,
		location: props.location === "left" ? null : props.location,
		density: props.density === "comfortable" ? null : props.density,
		variant: props.variant === "elevated" ? null : props.variant,
		color: !props.color || props.color === "surface" ? null : isThemeColorToken(props.color) ? props.color : CUSTOM_COLOR_CLASS
	};
}

//#endregion
//#region src/components/sidebar/sidebar-core.ts
/**
* `MonoSidebarCore` — all render-mode-agnostic logic for `mono-sidebar`:
* reactive props, hybrid aliases, mode resolution (auto→permanent/temporary via
* the breakpoint), layout-var side effects, scroll-lock/escape side effects,
* open/close state + events, and the chrome `render()`.
*
* SSR-safe: every `document`/`window` path is guarded by `isServer` (lit) — NOT
* `typeof document/window`, which is unreliable under @lit-labs/ssr (it defines
* both on the server).
*
* Leaves to each build: `createRenderRoot()`, the slot strategy, `renderSlot()`
* (light: empty + capture into `[data-mono-slot]`; shadow: native `<slot>`), and
* `renderIcon()` (light: `.mono-icon` UnoCSS icon; shadow: inline SVG).
*/
const MonoSidebarCore = (superClass) => {
	class MonoSidebarCoreClass extends superClass {
		constructor(...args) {
			super(...args);
			this.modelValue = false;
			this.mode = "auto";
			this.location = "left";
			this.density = "comfortable";
			this.color = "surface";
			this.variant = "elevated";
			this.width = 264;
			this.railWidth = 64;
			this.expandOnHover = false;
			this.rail = null;
			this.contained = false;
			this.persistent = false;
			this.closeOnEscape = true;
			this.closeOnScrim = true;
			this.lockScroll = true;
			this.showScrim = true;
			this.cssClass = {};
			this.cssClassName = "";
			this._resolvedMode = "permanent";
			this._escapeListener = null;
			this._autoMql = null;
			this._autoMqlListener = null;
			this._railHovered = false;
			this._railPointerEnter = null;
			this._railPointerLeave = null;
			this._writtenVar = null;
			defineHybridPropAliases(this, [
				"modelValue",
				"railWidth",
				"expandOnHover",
				"closeOnEscape",
				"closeOnScrim",
				"lockScroll",
				"showScrim"
			]);
			defineCssClassAliases(this, (value) => this._setCssClass(value));
		}
		static get observedAttributes() {
			return [
				...super.observedAttributes ?? [],
				"modelvalue",
				"css-class",
				"cssclass"
			];
		}
		attributeChangedCallback(name, oldValue, newValue) {
			super.attributeChangedCallback(name, oldValue, newValue);
			if (oldValue === newValue) return;
			if (name === "modelvalue") this.modelValue = booleanStringConverter.fromAttribute(newValue);
			else if (name === "css-class" || name === "cssclass") this._setCssClass(newValue);
		}
		connectedCallback() {
			super.connectedCallback();
			this._recomputeResolvedMode();
			this._recomputeRailCollapsedAttr();
			if (isServer) return;
			this._setupAutoModeListener();
			this._setupRailHoverListeners();
			this._writeLayoutVar();
			if (this._resolvedMode === "temporary" && this.modelValue) this._applyOpenSideEffects();
		}
		disconnectedCallback() {
			if (!isServer) {
				this._releaseSideEffects();
				this._teardownAutoModeListener();
				this._teardownRailHoverListeners();
				this._clearLayoutVar();
			}
			super.disconnectedCallback();
		}
		willUpdate(changed) {
			if (changed.has("rail") && this.rail !== null && this.modelValue !== this.rail) this.modelValue = this.rail;
			if (changed.has("mode")) this._recomputeResolvedMode();
			if (changed.has("mode") || changed.has("_resolvedMode") || changed.has("modelValue") || changed.has("rail") || changed.has("expandOnHover")) this._recomputeRailCollapsedAttr();
			if (isServer) return;
			if (changed.has("modelValue") || changed.has("mode")) {
				if (this._resolvedMode === "temporary" && this.modelValue) this._applyOpenSideEffects();
				else this._releaseSideEffects();
			}
			if (changed.has("mode") || changed.has("width") || changed.has("railWidth") || changed.has("location") || changed.has("modelValue") || changed.has("contained")) this._writeLayoutVar();
		}
		/**
		* `connectedCallback` computes `_resolvedMode` / `data-rail-collapsed` /
		* the layout var against SERVER assumptions (no `matchMedia`, no
		* `localStorage` → always "desktop, rail, collapsed"). Under SSR the host's
		* viewport-derived props only settle after Vue mounts, and nothing else
		* re-runs these if no prop happens to change afterwards. Re-run them once
		* after the first real client render so the viewport wins.
		*/
		firstUpdated(changed) {
			super.firstUpdated?.(changed);
			if (isServer) return;
			this._recomputeResolvedMode();
			this._recomputeRailCollapsedAttr();
			this._writeLayoutVar();
			this._syncRootFromState();
		}
		updated(changed) {
			super.updated?.(changed);
			if (isServer) return;
			this._syncRootFromState();
		}
		/**
		* Re-assert the root element's class / style / aria-hidden from live state.
		*
		* `@lit-labs/ssr-client`'s hydration records the values it is handed as
		* ALREADY COMMITTED without writing them to the DOM — it assumes the server
		* markup already matches. Under nuxt-ssr-lit that assumption is routinely
		* false: the server has no viewport (no `matchMedia`, no `localStorage`) so
		* it always emits desktop assumptions, and Vue has since set the real
		* mobile props. Lit then sees "no change" and never commits, freezing the
		* rail visible on a phone while `mode` already reads `temporary`.
		*
		* These three attributes carry every viewport-derived decision, so writing
		* them imperatively after each update keeps the DOM honest. Idempotent —
		* a no-op whenever lit's own bindings are working.
		*/
		_syncRootFromState() {
			const root = this.renderRoot?.querySelector?.("[mono-sidebar], .mono-sidebar");
			if (!root) return;
			const classes = this._rootClasses;
			if (root.getAttribute("class") !== classes) root.setAttribute("class", classes);
			const style = this._inlineRootStyle;
			if (root.getAttribute("style") !== style) root.setAttribute("style", style);
			const aria = this._rootAriaHidden;
			if (root.getAttribute("aria-hidden") !== aria) root.setAttribute("aria-hidden", aria);
			const attrs = sidebarRootAttrs({
				mode: this.mode,
				resolvedMode: this._resolvedMode,
				location: this.location,
				density: this.density,
				color: this.color,
				variant: this.variant
			});
			const wanted = {
				"mono-effective": attrs.effective,
				"mono-mode": attrs.mode ?? null,
				"mono-location": attrs.location ?? null,
				"mono-density": attrs.density ?? null,
				"mono-color": attrs.color ?? null,
				"mono-variant": attrs.variant ?? null,
				"mono-open": this.modelValue ? "" : null,
				"mono-expand-on-hover": this.expandOnHover ? "" : null,
				"mono-contained": this.contained ? "" : null,
				"mono-persistent": this.persistent ? "" : null,
				"mono-no-scrim": this.showScrim ? null : ""
			};
			for (const [name, value] of Object.entries(wanted)) if (value === null) {
				if (root.hasAttribute(name)) root.removeAttribute(name);
			} else if (root.getAttribute(name) !== value) root.setAttribute(name, value);
		}
		_setupAutoModeListener() {
			if (typeof window === "undefined" || !window.matchMedia) return;
			this._autoMql = window.matchMedia(`(max-width: ${768 - 1}px)`);
			this._autoMqlListener = () => {
				if (this.mode === "auto") {
					this._recomputeResolvedMode();
					this._writeLayoutVar();
					this.requestUpdate();
				}
			};
			this._autoMql.addEventListener("change", this._autoMqlListener);
		}
		_teardownAutoModeListener() {
			if (this._autoMql && this._autoMqlListener) this._autoMql.removeEventListener("change", this._autoMqlListener);
			this._autoMql = null;
			this._autoMqlListener = null;
		}
		_recomputeResolvedMode() {
			this._resolvedMode = resolveMode(this.mode);
		}
		/**
		* Publish the rail-collapsed state as a host attribute (`data-rail-collapsed`).
		* Cross-shadow CSS (descendant selectors + inherited custom properties on the
		* shadow `.mono-sidebar-body`) cannot reach a slotted *light* `<mono-menu>`, so
		* the menu mirrors this attribute and collapses itself. Collapsed = rail mode,
		* not toggled-open, and not hover-expanded. Pure attribute toggle → SSR-safe.
		*/
		_recomputeRailCollapsedAttr() {
			if (this._resolvedMode === "rail" && !this.modelValue && !(this.expandOnHover && this._railHovered)) this.setAttribute("data-rail-collapsed", "");
			else this.removeAttribute("data-rail-collapsed");
		}
		_setupRailHoverListeners() {
			if (this._railPointerEnter) return;
			this._railPointerEnter = () => {
				if (this.expandOnHover) this._railHovered = true;
				this._recomputeRailCollapsedAttr();
			};
			this._railPointerLeave = () => {
				this._railHovered = false;
				this._recomputeRailCollapsedAttr();
			};
			this.addEventListener("pointerenter", this._railPointerEnter);
			this.addEventListener("pointerleave", this._railPointerLeave);
		}
		_teardownRailHoverListeners() {
			if (this._railPointerEnter) this.removeEventListener("pointerenter", this._railPointerEnter);
			if (this._railPointerLeave) this.removeEventListener("pointerleave", this._railPointerLeave);
			this._railPointerEnter = null;
			this._railPointerLeave = null;
			this._railHovered = false;
		}
		_writeLayoutVar() {
			if (isServer) return;
			if (this.contained) {
				if (this._writtenVar) releaseLayoutVar(this._writtenVar, this);
				this._writtenVar = null;
				return;
			}
			const myVar = this.location === "right" ? "--mono-sidebar-right-width" : "--mono-sidebar-left-width";
			if (this._writtenVar && this._writtenVar !== myVar) releaseLayoutVar(this._writtenVar, this);
			let pushPx = 0;
			if (this._resolvedMode === "permanent") pushPx = this.width;
			else if (this._resolvedMode === "rail") pushPx = this.modelValue ? this.width : this.railWidth;
			else pushPx = 0;
			this._writtenVar = myVar;
			claimLayoutVar(myVar, this, `${pushPx}px`);
		}
		_clearLayoutVar() {
			if (isServer) return;
			if (this._writtenVar) releaseLayoutVar(this._writtenVar, this);
			this._writtenVar = null;
		}
		_setCssClass(value) {
			applyCssClass(this, value);
		}
		_cls(base, key) {
			return cssPart(this.cssClass, base, key);
		}
		get _rootClasses() {
			return generateSidebarRootClasses({
				mode: this.mode,
				resolvedMode: this._resolvedMode,
				location: this.location,
				density: this.density,
				color: this.color,
				variant: this.variant,
				open: this.modelValue,
				expandOnHover: this.expandOnHover,
				contained: this.contained,
				persistent: this.persistent,
				showScrim: this.showScrim,
				cssClassName: this.cssClassName,
				rootExtra: this.cssClass?.root
			});
		}
		_applyOpenSideEffects() {
			if (isServer || this.contained) return;
			setExternalScrollLock(this, this.lockScroll);
			if (this.closeOnEscape && !this._escapeListener) {
				const listener = (event) => {
					if (event.key === "Escape" && this.modelValue && !this.persistent && this._resolvedMode === "temporary") this.hide("escape", event);
				};
				this._escapeListener = listener;
				document.addEventListener("keydown", listener);
			}
		}
		_releaseSideEffects() {
			if (isServer) return;
			setExternalScrollLock(this, false);
			if (this._escapeListener) {
				document.removeEventListener("keydown", this._escapeListener);
				this._escapeListener = null;
			}
		}
		_emitChange(detail) {
			dispatchMonoEvent(this, "change", detail);
			if (detail.value && !detail.oldValue) dispatchMonoEvent(this, "open", detail);
			else if (!detail.value && detail.oldValue) dispatchMonoEvent(this, "close", detail);
		}
		open(source = "manual", sourceEvent) {
			if (this.modelValue) return;
			const oldValue = this.modelValue;
			this.modelValue = true;
			this._emitChange({
				modelValue: true,
				currentValue: true,
				oldValue,
				value: true,
				source,
				sourceEvent
			});
		}
		hide(source = "manual", sourceEvent) {
			if (!this.modelValue) return;
			const oldValue = this.modelValue;
			this.modelValue = false;
			this._emitChange({
				modelValue: false,
				currentValue: false,
				oldValue,
				value: false,
				source,
				sourceEvent
			});
		}
		close(source = "manual", sourceEvent) {
			this.hide(source, sourceEvent);
		}
		toggle(source = "manual", sourceEvent) {
			if (this.modelValue) this.hide(source, sourceEvent);
			else this.open(source, sourceEvent);
		}
		expandRail() {
			if (this._resolvedMode !== "rail") return;
			this.open("rail-toggle");
		}
		collapseRail() {
			if (this._resolvedMode !== "rail") return;
			this.hide("rail-toggle");
		}
		_handleScrimClick(event) {
			if (!this.closeOnScrim || this.persistent) return;
			if (this._resolvedMode !== "temporary") return;
			this.hide("scrim", event);
		}
		_handleRailToggle(event) {
			if (this._resolvedMode !== "rail") return;
			this.toggle("rail-toggle", event);
		}
		/** Per-region slot content — overridden per build. */
		renderSlot(_name) {
			return html``;
		}
		/** Internal icon — light: UnoCSS `.mono-icon`; shadow: inline SVG. */
		renderIcon(_name) {
			return html``;
		}
		/**
		* The root's inline style. This getter is the ONLY safe place to put an inline
		* custom property on the root: `_syncRootFromState()` re-asserts the whole `style`
		* attribute after every update, so anything written out-of-band is wiped.
		*
		* `customColorStyle` returns '' unless `color` is a literal rather than a palette
		* slot; on the root it outranks the class-based `.mono-sidebar.<token>` presets,
		* which is exactly the precedence we want (flavor < prop).
		*/
		get _inlineRootStyle() {
			return `--mono-sidebar-width: ${this.width}px; --mono-sidebar-rail-width: ${this.railWidth}px;` + customColorStyle(isThemeColorToken(this.color) || this.color === "surface" ? "" : this.color, "sidebar");
		}
		get _rootAriaHidden() {
			return this._resolvedMode === "temporary" && !this.modelValue ? "true" : "false";
		}
		render() {
			const inlineStyle = this._inlineRootStyle;
			const showDefaultRailToggle = this._resolvedMode === "rail" && this.rail === null;
			const attrs = sidebarRootAttrs({
				mode: this.mode,
				resolvedMode: this._resolvedMode,
				location: this.location,
				density: this.density,
				color: this.color,
				variant: this.variant
			});
			return html`
        <div
          class=${this._rootClasses}
          style=${inlineStyle}
          role="navigation"
          aria-hidden=${this._resolvedMode === "temporary" && !this.modelValue ? "true" : "false"}
          mono-sidebar
          mono-effective=${attrs.effective}
          mono-mode=${attrs.mode ?? nothing}
          mono-location=${attrs.location ?? nothing}
          mono-density=${attrs.density ?? nothing}
          mono-color=${attrs.color ?? nothing}
          mono-variant=${attrs.variant ?? nothing}
          ?mono-open=${this.modelValue}
          ?mono-expand-on-hover=${this.expandOnHover}
          ?mono-contained=${this.contained}
          ?mono-persistent=${this.persistent}
          ?mono-no-scrim=${!this.showScrim}
        >
          <div class=${this._cls("mono-sidebar-scrim", "scrim")} mono-scrim @click=${this._handleScrimClick}></div>

          <aside class=${this._cls("mono-sidebar-panel", "panel")} mono-panel>
            <div class="mono-sidebar-topbar" mono-topbar>
              <div class=${this._cls("mono-sidebar-header", "header")} mono-header data-mono-slot="header">
                ${this.renderSlot("header")}
              </div>
              ${showDefaultRailToggle ? html`
                    <div class=${this._cls("mono-sidebar-rail", "rail")} mono-rail>
                      <button
                        type="button"
                        class=${this._cls("mono-sidebar-rail-toggle", "railToggle")}
                        mono-rail-toggle
                        aria-label=${this.modelValue ? "Collapse sidebar" : "Expand sidebar"}
                        @click=${this._handleRailToggle}
                      >
                        ${this.renderIcon("chevron")}
                      </button>
                    </div>
                  ` : nothing}
            </div>
            <div class=${this._cls("mono-sidebar-body", "body")} mono-body data-mono-slot="body">
              ${this.renderSlot("body")}
            </div>
            <div class=${this._cls("mono-sidebar-footer", "footer")} mono-footer data-mono-slot="footer">
              ${this.renderSlot("footer")}
            </div>
          </aside>
        </div>
      `;
		}
	}
	__decorate([property({
		attribute: "model-value",
		reflect: true,
		converter: booleanStringConverter
	})], MonoSidebarCoreClass.prototype, "modelValue", void 0);
	__decorate([property({ type: String })], MonoSidebarCoreClass.prototype, "mode", void 0);
	__decorate([property({ type: String })], MonoSidebarCoreClass.prototype, "location", void 0);
	__decorate([property({ type: String })], MonoSidebarCoreClass.prototype, "density", void 0);
	__decorate([property({ type: String })], MonoSidebarCoreClass.prototype, "color", void 0);
	__decorate([property({ type: String })], MonoSidebarCoreClass.prototype, "variant", void 0);
	__decorate([property({ converter: numberStringConverter })], MonoSidebarCoreClass.prototype, "width", void 0);
	__decorate([property({
		attribute: "rail-width",
		converter: numberStringConverter
	})], MonoSidebarCoreClass.prototype, "railWidth", void 0);
	__decorate([property({
		attribute: "expand-on-hover",
		converter: booleanStringConverter
	})], MonoSidebarCoreClass.prototype, "expandOnHover", void 0);
	__decorate([property({
		attribute: "rail",
		converter: {
			fromAttribute(value) {
				if (value === null) return null;
				const normalized = value.toLowerCase().trim();
				return normalized === "" || normalized === "true";
			},
			toAttribute() {
				return null;
			}
		}
	})], MonoSidebarCoreClass.prototype, "rail", void 0);
	__decorate([property({
		reflect: true,
		converter: booleanStringConverter
	})], MonoSidebarCoreClass.prototype, "contained", void 0);
	__decorate([property({
		reflect: true,
		converter: booleanStringConverter
	})], MonoSidebarCoreClass.prototype, "persistent", void 0);
	__decorate([property({
		attribute: "close-on-escape",
		converter: booleanStringConverter
	})], MonoSidebarCoreClass.prototype, "closeOnEscape", void 0);
	__decorate([property({
		attribute: "close-on-scrim",
		converter: booleanStringConverter
	})], MonoSidebarCoreClass.prototype, "closeOnScrim", void 0);
	__decorate([property({
		attribute: "lock-scroll",
		converter: booleanStringConverter
	})], MonoSidebarCoreClass.prototype, "lockScroll", void 0);
	__decorate([property({
		attribute: "show-scrim",
		converter: booleanStringConverter
	})], MonoSidebarCoreClass.prototype, "showScrim", void 0);
	__decorate([property({ attribute: false })], MonoSidebarCoreClass.prototype, "cssClass", void 0);
	__decorate([property({ attribute: false })], MonoSidebarCoreClass.prototype, "cssClassName", void 0);
	__decorate([state()], MonoSidebarCoreClass.prototype, "_resolvedMode", void 0);
	return MonoSidebarCoreClass;
};

//#endregion
//#region src/components/sidebar/mono-sidebar.ts
let MonoSidebar = class MonoSidebar extends MonoSidebarCore(LitElement) {
	constructor(..._args) {
		super(..._args);
		this._slotsCaptured = false;
		this._slotHeader = [];
		this._slotBody = [];
		this._slotFooter = [];
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
		this._placeSlots();
	}
	renderIcon(_name) {
		return html`<span class="mono-icon i-mdi-chevron-right" aria-hidden="true"></span>`;
	}
	_captureSlots() {
		if (this._slotsCaptured) return;
		this._slotsCaptured = true;
		const captured = monoHostChildNodes(this);
		const toRemove = /* @__PURE__ */ new Set();
		for (const node of captured) {
			let bucket = "body";
			if (node instanceof Element) {
				const explicit = node.getAttribute("slot");
				if (explicit === "header" || explicit === "footer") {
					bucket = explicit;
					node.removeAttribute("slot");
				} else if (explicit === "body" || explicit === null) {
					bucket = "body";
					if (explicit === "body") node.removeAttribute("slot");
				}
			} else if (node.nodeType === Node.TEXT_NODE) {
				if (!(node.textContent ?? "").trim()) continue;
			} else if (node.nodeType === Node.COMMENT_NODE) continue;
			if (bucket === "header") this._slotHeader.push(node);
			else if (bucket === "footer") this._slotFooter.push(node);
			else this._slotBody.push(node);
			toRemove.add(node);
		}
		for (const node of toRemove) if (node.parentNode === this) this.removeChild(node);
		guardHostTextContent(this, /* @__PURE__ */ new Map([
			["header", this._slotHeader],
			["body", this._slotBody],
			["footer", this._slotFooter]
		]), {
			fallback: "body",
			onWrite: () => this.requestUpdate()
		});
	}
	_placeSlots() {
		this._placeSlot("header", this._slotHeader);
		this._placeSlot("body", this._slotBody);
		this._placeSlot("footer", this._slotFooter);
	}
	_placeSlot(name, nodes) {
		if (!nodes.length) return;
		const target = this.querySelector(`[data-mono-slot="${name}"]`);
		if (!target) return;
		for (const node of nodes) placeSlotNode(target, node);
	}
};
MonoSidebar = __decorate([customElement("mono-sidebar")], MonoSidebar);

//#endregion
export { MonoSidebar, SIDEBAR_AUTO_BREAKPOINT, generateSidebarRootClasses, isAutoTemporary, resolveMode, validateSidebarProps };