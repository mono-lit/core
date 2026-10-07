import { a as __decorate, f as customElement, i as withShadowUtilityStyles, l as defineHybridPropAliases, r as toShadowCss, s as booleanStringConverter, t as flushSsrHydration, u as numberStringConverter } from "../../hydration-flush-RB5Tz5nl.js";
import { t as dispatchMonoEvent } from "../../mono-event-Bi1qP9uN.js";
import { n as cssPart, r as defineCssClassAliases, t as applyCssClass } from "../../css-class-BRKRzHx-.js";
import { n as releaseLayoutVar, t as claimLayoutVar } from "../../layout-var-CZnzMC0s.js";
import { a as validateColorProp, i as isThemeColorToken, n as colorClassToken, r as customColorStyle, t as CUSTOM_COLOR_CLASS } from "../../color-DHYrfXsX.js";
import { i as setExternalScrollLock } from "../../popup-stack-CEEMib__.js";
import { LitElement, html, isServer, nothing, unsafeCSS } from "lit";
import { property, state } from "lit/decorators.js";
//#region src/components/sidebar/sidebar-utils.ts
var SIDEBAR_AUTO_BREAKPOINT = 768;
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
var MonoSidebarCore = (superClass) => {
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
			if (changed.has("modelValue") || changed.has("mode")) if (this._resolvedMode === "temporary" && this.modelValue) this._applyOpenSideEffects();
			else this._releaseSideEffects();
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
			this._autoMql = window.matchMedia(`(max-width: 767px)`);
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
//#region src/components/sidebar/sidebar.css?raw
var sidebar_default = "/* @unocss-include */\r\n\r\n/* =========================================================================\r\n   mono-sidebar — a port of Basecoat's `.sidebar` (basecoat-css@1.0.2, vega\r\n   style).\r\n\r\n   Styled by ATTRIBUTE, like Basecoat — and the attributes mirror the element's\r\n   props one for one, so hand-written markup reads like the Lit / Vue tag:\r\n\r\n     <mono-sidebar mode=\"rail\" location=\"right\" color=\"primary\" model-value>\r\n     <div mono-sidebar mono-mode=\"rail\" mono-effective=\"rail\"\r\n          mono-location=\"right\" mono-color=\"primary\" mono-open role=\"navigation\">\r\n       <div mono-scrim></div>\r\n       <aside mono-panel>\r\n         <div mono-topbar>\r\n           <div mono-header>…</div>\r\n           <div mono-rail><button mono-rail-toggle>…</button></div>\r\n         </div>\r\n         <div mono-body>…</div>\r\n         <div mono-footer>…</div>\r\n       </aside>\r\n     </div>\r\n\r\n   An absent attribute is the prop's default (`:not([mono-density])` =\r\n   comfortable, `:not([mono-color])` = surface, `:not([mono-variant])` =\r\n   elevated, `:not([mono-location])` = left). `mono-effective` carries the\r\n   mode after `auto` resolves, which is what the layout rules key on. The old\r\n   classes (`[mono-sidebar][mono-mode=\"auto\"][mono-effective=\"permanent\"][mono-location=\"left\"]…`) are\r\n   still emitted as inert hooks until 2.0 but no rule here reads them.\r\n\r\n   Selector map (ours ≡ upstream):\r\n     [mono-sidebar]     ≡ .sidebar (the overlay wrapper)\r\n     :where([mono-sidebar]) [mono-panel]       ≡ .sidebar nav (fixed inset-y-0 z-50 flex w-… flex-col\r\n                          transition-transform duration-300 ease-in-out)\r\n     :where([mono-sidebar]) [mono-scrim]       ≡ .sidebar:not([aria-hidden]) max-md:bg-black/50\r\n     :where([mono-sidebar]) [mono-header] / [mono-footer] ≡ .sidebar nav > header, > footer\r\n                          (flex flex-col, gap-2 p-2)\r\n     :where([mono-sidebar]) [mono-body]        ≡ .sidebar nav > section (flex min-h-0 flex-1 flex-col\r\n                          overflow-y-auto, gap-2)\r\n     [mono-location=…]  ≡ [data-side='left' | 'right'] (border-r / border-l)\r\n     :not([mono-open])  ≡ [aria-hidden=true] (translate the panel out)\r\n     :where([mono-sidebar]) [mono-rail] / [mono-rail-toggle] / [mono-topbar] ≡ EXTENSION (upstream has\r\n                          no rail mode)\r\n     [mono-mode=…] / [mono-variant=…] / [mono-density=…] / [mono-color=…]\r\n                        ≡ EXTENSION\r\n\r\n   NO GRADIENTS. The painted panel was a two-stop brand gradient with a coloured\r\n   halo; it is the flat role fill now, inked in that role's `-foreground` the\r\n   way `.btn[data-variant='primary']` is. The scrim is `--mono-mode-backdrop`.\r\n\r\n   DARK MODE comes free — every colour resolves through a Basecoat token that\r\n   already flips. A selector crosses neither the custom-element host nor the\r\n   shadow boundary, so no `[mono-color=\"dark\"]` rule can live in component CSS.\r\n\r\n   FLAVORS set `--mono-sidebar-{width,radius,shadow,pad-*,gap,scrim-*}` (+ the\r\n   per-density forms); every fallback here is vega's value\r\n   (`node scripts/basecoat-styles.mjs --grep \"sidebar\"`).\r\n   ========================================================================= */\r\n\r\nmono-sidebar {\r\n  display: contents;\r\n}\r\n\r\n[mono-sidebar] {\r\n  /* ── the ten roles, each a public knob over a Basecoat token ────────────── */\r\n  --_mono-sidebar-primary: var(--mono-sidebar-primary, var(--primary));\r\n  --_mono-sidebar-secondary: var(--mono-sidebar-secondary, var(--secondary-foreground));\r\n  --_mono-sidebar-success: var(--mono-sidebar-success, var(--success));\r\n  --_mono-sidebar-danger: var(--mono-sidebar-danger, var(--destructive));\r\n  --_mono-sidebar-warning: var(--mono-sidebar-warning, var(--warning));\r\n  --_mono-sidebar-info: var(--mono-sidebar-info, var(--info));\r\n  --_mono-sidebar-teal: var(--mono-sidebar-teal, var(--teal));\r\n  --_mono-sidebar-purple: var(--mono-sidebar-purple, var(--purple));\r\n  --_mono-sidebar-neutral: var(--mono-sidebar-neutral, var(--neutral));\r\n  --_mono-sidebar-dark: var(--mono-sidebar-dark, var(--dark));\r\n\r\n  /* ── the chrome surface — upstream's own sidebar tokens ──────────────────\r\n     basecoat@1.0.2 styles/vega.css .sidebar nav — bg-sidebar text-sidebar-foreground */\r\n  --_mono-sidebar-surface: var(--mono-sidebar-surface, var(--_mono-sidebar-surface-preset, var(--sidebar)));\r\n  --_mono-sidebar-surface-soft: var(--mono-sidebar-surface-soft, var(--muted));\r\n  --_mono-sidebar-text: var(--mono-sidebar-text, var(--_mono-sidebar-text-preset, var(--sidebar-foreground)));\r\n  --_mono-sidebar-text-soft: var(--mono-sidebar-text-soft, var(--_mono-sidebar-text-soft-preset, color-mix(in oklab, var(--_mono-sidebar-text) 70%, transparent)));\r\n  /* basecoat@1.0.2 styles/vega.css .sidebar nav [role=separator] — border-sidebar-border mx-2 */\r\n  --_mono-sidebar-border: var(--mono-sidebar-border, var(--_mono-sidebar-border-preset, var(--sidebar-border)));\r\n  --_mono-sidebar-border-lite: var(--mono-sidebar-border-lite, var(--_mono-sidebar-border-lite-preset, var(--_mono-sidebar-border)));\r\n\r\n  --_mono-sidebar-accent: var(--mono-sidebar-accent, var(--_mono-sidebar-accent-preset, var(--_mono-sidebar-primary)));\r\n  /* Ink for a panel painted in the accent. Each role points this at its own\r\n     `-foreground` token, so a light role gets readable ink without a luminance\r\n     calculation; a literal colour gets one written inline by the component.\r\n     Every softened tint on a painted panel mixes from THIS, never from a\r\n     literal white, so the whole treatment flips with the ink. */\r\n  --_mono-sidebar-on-accent: var(--mono-sidebar-on-accent, var(--_mono-sidebar-on-accent-preset, var(--primary-foreground)));\r\n\r\n  --_mono-sidebar-bg: var(--mono-sidebar-bg, var(--_mono-sidebar-bg-preset, var(--_mono-sidebar-surface)));\r\n  /* upstream's `--sidebar-width` / `--sidebar-mobile-width` are the measure */\r\n  --_mono-sidebar-width: var(--mono-sidebar-width, var(--sidebar-width));\r\n  --_mono-sidebar-rail-width: var(--mono-sidebar-rail-width, calc(var(--mono-spacing) * 16));\r\n  --_mono-sidebar-current-width: var(--_mono-sidebar-width);\r\n  --_mono-sidebar-z: var(--mono-sidebar-z, 50);\r\n  /* basecoat@1.0.2 styles/vega.css .sidebar nav > header, .sidebar nav > footer — gap-2 p-2 */\r\n  --_mono-sidebar-pad-x: var(--mono-sidebar-pad-x, var(--_mono-sidebar-pad-x-preset, var(--mono-sidebar-pad-x-comfortable, calc(var(--mono-spacing) * 2))));\r\n  --_mono-sidebar-pad-y: var(--mono-sidebar-pad-y, var(--_mono-sidebar-pad-y-preset, var(--mono-sidebar-pad-y-comfortable, calc(var(--mono-spacing) * 2))));\r\n  /* basecoat@1.0.2 styles/vega.css .sidebar nav > section — gap-2 */\r\n  --_mono-sidebar-gap: var(--mono-sidebar-gap, var(--_mono-sidebar-gap-preset, var(--mono-sidebar-gap-comfortable, calc(var(--mono-spacing) * 2))));\r\n  --_mono-sidebar-radius: var(--mono-sidebar-radius, 0);\r\n  --_mono-sidebar-shadow: var(--mono-sidebar-shadow, var(--mono-shadow-sm));\r\n  --_mono-sidebar-border-width: var(--mono-sidebar-border-width, var(--mono-border-width));\r\n  --_mono-sidebar-scrim-bg: var(--mono-sidebar-scrim-bg, var(--mono-mode-backdrop));\r\n  --_mono-sidebar-duration: var(--mono-sidebar-duration, var(--mono-duration-slow, 300ms));\r\n\r\n  /* Hand the panel's resolved palette to any <mono-menu> in the body. These are\r\n     menu's PUBLIC vars, so they inherit in the light build and pierce the shadow\r\n     boundary in the shadow one — the same handoff the rail layout uses below.\r\n\r\n     Unconditional on purpose. A panel gets painted from three independent places\r\n     — the `color` prop, a flavor, or a consumer's own `--mono-sidebar-bg` — and\r\n     only the first is visible to a selector here. Deriving from\r\n     `--_mono-sidebar-*` means the menu follows the panel whichever one painted\r\n     it; before this, a navy panel carried menu labels still inked near-black.\r\n\r\n     Only the HUE comes from the sidebar; the soft/faint steps keep menu's own\r\n     ratios rather than the sidebar's, which is tuned for chrome and would wash a\r\n     menu label out. */\r\n  --mono-menu-text: var(--_mono-sidebar-text);\r\n  --mono-menu-text-soft: color-mix(in oklab, var(--_mono-sidebar-text) 72%, transparent);\r\n  --mono-menu-text-faint: color-mix(in oklab, var(--_mono-sidebar-text) 68%, transparent);\r\n  --mono-menu-surface: transparent;\r\n  --mono-menu-border: var(--_mono-sidebar-border);\r\n  --mono-menu-border-lite: var(--_mono-sidebar-border-lite);\r\n  --mono-menu-accent: var(--_mono-sidebar-accent);\r\n  --mono-menu-hover-bg: color-mix(in oklab, var(--_mono-sidebar-text) 8%, transparent);\r\n  --mono-menu-hover-color: var(--_mono-sidebar-text);\r\n  --mono-menu-hover-border-color: color-mix(in oklab, var(--_mono-sidebar-text) 14%, transparent);\r\n  /* The pill is a wash of the menu accent over WHATEVER the panel is, so it has\r\n     to be mixed with `transparent`, not with the document's `--sidebar-accent`\r\n     the way menu's own default is. On a navy panel the accent is white, and\r\n     mixing white into the page's near-white chrome painted a white pill under\r\n     white ink. */\r\n  --mono-menu-active-bg: color-mix(in oklab, var(--_mono-sidebar-accent) 18%, transparent);\r\n  --mono-menu-active-color: var(--_mono-sidebar-accent);\r\n  --mono-menu-active-shadow: none;\r\n\r\n  font-family: inherit;\r\n  color: var(--_mono-sidebar-text);\r\n}\r\n\r\n[mono-sidebar],\r\n:where([mono-sidebar]) *,\r\n:where([mono-sidebar]) *::before,\r\n:where([mono-sidebar]) *::after {\r\n  box-sizing: border-box;\r\n}\r\n\r\n\r\n/* ─────── DENSITY ─────── */\r\n[mono-sidebar][mono-density=\"compact\"] {\r\n  --_mono-sidebar-pad-x-preset: 0.6rem;\r\n  --_mono-sidebar-pad-y-preset: 0.6rem;\r\n  --_mono-sidebar-gap-preset: 0.3rem;\r\n}\r\n\r\n[mono-sidebar][mono-density=\"comfortable\"] {\r\n  --_mono-sidebar-pad-x-preset: 0.85rem;\r\n  --_mono-sidebar-pad-y-preset: 0.85rem;\r\n  --_mono-sidebar-gap-preset: 0.4rem;\r\n}\r\n\r\n[mono-sidebar][mono-density=\"default\"] {\r\n  --_mono-sidebar-pad-x-preset: 1.05rem;\r\n  --_mono-sidebar-pad-y-preset: 1.05rem;\r\n  --_mono-sidebar-gap-preset: 0.5rem;\r\n}\r\n\r\n/* ─────── COLOR ─────── */\r\n/* EVERY `-preset` here has to sit on `[mono-sidebar]`, the element that DECLARES the\r\n   resolvers above — never on the `[mono-panel]` child. A `var()` substitutes on\r\n   the element that declares it, so `--_mono-sidebar-bg` is already resolved by the time\r\n   a descendant sets `--_mono-sidebar-bg-preset`; the panel just inherits the finished\r\n   value and the preset is dead. The painting block below used to be written as\r\n   `[mono-sidebar][mono-color=\"primary\"] [mono-panel]`, which is exactly why no color ever\r\n   painted. Same trap as the one documented in checkbox.css's border-width block. */\r\n[mono-sidebar][mono-color=\"primary\"] {\r\n  --_mono-sidebar-accent-preset: var(--_mono-sidebar-primary);\r\n  --_mono-sidebar-on-accent-preset: var(--primary-foreground);\r\n}\r\n\r\n[mono-sidebar][mono-color=\"secondary\"] {\r\n  --_mono-sidebar-accent-preset: var(--_mono-sidebar-secondary);\r\n  /* the role IS --secondary-foreground, so the ink on it is --secondary */\r\n  --_mono-sidebar-on-accent-preset: var(--secondary);\r\n}\r\n\r\n[mono-sidebar][mono-color=\"success\"] {\r\n  --_mono-sidebar-accent-preset: var(--_mono-sidebar-success);\r\n  --_mono-sidebar-on-accent-preset: var(--success-foreground);\r\n}\r\n\r\n[mono-sidebar][mono-color=\"danger\"] {\r\n  --_mono-sidebar-accent-preset: var(--_mono-sidebar-danger);\r\n  --_mono-sidebar-on-accent-preset: var(--destructive-foreground);\r\n}\r\n\r\n[mono-sidebar][mono-color=\"warning\"] {\r\n  --_mono-sidebar-accent-preset: var(--_mono-sidebar-warning);\r\n  --_mono-sidebar-on-accent-preset: var(--warning-foreground);\r\n}\r\n\r\n[mono-sidebar][mono-color=\"info\"] {\r\n  --_mono-sidebar-accent-preset: var(--_mono-sidebar-info);\r\n  --_mono-sidebar-on-accent-preset: var(--info-foreground);\r\n}\r\n\r\n[mono-sidebar][mono-color=\"teal\"] {\r\n  --_mono-sidebar-accent-preset: var(--_mono-sidebar-teal);\r\n  --_mono-sidebar-on-accent-preset: var(--teal-foreground);\r\n}\r\n\r\n[mono-sidebar][mono-color=\"purple\"] {\r\n  --_mono-sidebar-accent-preset: var(--_mono-sidebar-purple);\r\n  --_mono-sidebar-on-accent-preset: var(--purple-foreground);\r\n}\r\n\r\n[mono-sidebar][mono-color=\"neutral\"] {\r\n  --_mono-sidebar-accent-preset: var(--_mono-sidebar-neutral);\r\n  --_mono-sidebar-on-accent-preset: var(--neutral-foreground);\r\n}\r\n\r\n[mono-sidebar][mono-color=\"dark\"] {\r\n  --_mono-sidebar-accent-preset: var(--_mono-sidebar-dark);\r\n  --_mono-sidebar-on-accent-preset: var(--dark-foreground);\r\n}\r\n\r\n/* `color` given a literal (`#7c3aed`, `rgb(…)`) instead of a token name. The three\r\n   presets are written INLINE on this same element by `_inlineRootStyle`, because a\r\n   literal cannot be a class name and cannot be known to a stylesheet; this class only\r\n   opts the element into the painting treatment below. */\r\n[mono-sidebar][mono-color=\"custom\"] {\r\n  /* deliberately empty — the values arrive inline */\r\n}\r\n\r\n/* surface keeps the white-with-themed-border look — never painted.\r\n   It sets NO accent preset on purpose: the resolver's own fallback is already\r\n   `--_mono-sidebar-primary`, so declaring it here would add nothing under Mono while\r\n   overriding a flavor's accent (ONE sets a white one on <body>) for the default color. */\r\n[mono-sidebar][mono-color=\"surface\"] {\r\n  /* deliberately empty — see above */\r\n}\r\n\r\n/* Themed colors paint the panel with the accent, and every foreground on it is mixed\r\n   from `--_mono-sidebar-on-accent` so the treatment works with dark ink as well as\r\n   white. `color-mix(…, transparent)` rather than `rgba(255,255,255,α)` for the same\r\n   reason. `-surface-preset` re-tints the rail toggle, which would otherwise stay a\r\n   white chip carrying white glyphs. */\r\n[mono-sidebar][mono-color=\"primary\"],\r\n[mono-sidebar][mono-color=\"secondary\"],\r\n[mono-sidebar][mono-color=\"success\"],\r\n[mono-sidebar][mono-color=\"danger\"],\r\n[mono-sidebar][mono-color=\"warning\"],\r\n[mono-sidebar][mono-color=\"info\"],\r\n[mono-sidebar][mono-color=\"teal\"],\r\n[mono-sidebar][mono-color=\"purple\"],\r\n[mono-sidebar][mono-color=\"neutral\"],\r\n[mono-sidebar][mono-color=\"dark\"],\r\n[mono-sidebar][mono-color=\"custom\"] {\r\n  --_mono-sidebar-bg-preset: var(--_mono-sidebar-accent);\r\n  --_mono-sidebar-text-preset: var(--_mono-sidebar-on-accent);\r\n  --_mono-sidebar-text-soft-preset: color-mix(in oklab, var(--_mono-sidebar-on-accent) 78%, transparent);\r\n  --_mono-sidebar-border-preset: color-mix(in oklab, var(--_mono-sidebar-on-accent) 18%, transparent);\r\n  --_mono-sidebar-border-lite-preset: color-mix(in oklab, var(--_mono-sidebar-on-accent) 12%, transparent);\r\n  --_mono-sidebar-surface-preset: color-mix(in oklab, var(--_mono-sidebar-on-accent) 16%, transparent);\r\n\r\n  /* The whole menu palette — pill included — is forwarded unconditionally up in\r\n     `[mono-sidebar]` and keys off `--_mono-sidebar-accent`. On a PAINTED panel that\r\n     accent IS the panel colour, so the pill would sit invisibly on it. Re-point\r\n     the menu's copy at the on-accent ink — and only the menu's copy: the panel's\r\n     own `--_mono-sidebar-bg-preset` reads `--_mono-sidebar-accent` in this very\r\n     block, so shadowing it here would repaint the panel white. */\r\n  --mono-menu-accent: var(--_mono-sidebar-on-accent);\r\n  --mono-menu-active-bg: color-mix(in oklab, var(--_mono-sidebar-on-accent) 18%, transparent);\r\n  --mono-menu-active-color: var(--_mono-sidebar-on-accent);\r\n}\r\n\r\n/* ─────── PANEL (the visible container) ─────── */\r\n:where([mono-sidebar]) [mono-panel] {\r\n  position: fixed;\r\n  top: 0;\r\n  bottom: 0;\r\n  z-index: var(--_mono-sidebar-z);\r\n  width: var(--_mono-sidebar-current-width);\r\n  /* basecoat@1.0.2 styles/vega.css .sidebar nav > header, .sidebar nav > footer — gap-2 p-2\r\n     maia, luma and rhea set [--radius: var(--radius-xl)] on the shell, sera 0 —\r\n     the chrome inside a panel follows the flavor, and so does the panel itself\r\n     wherever its corner shows (a contained sidebar; a full-height one has none). */\r\n  border-radius: var(--_mono-sidebar-radius);\r\n  background: var(--_mono-sidebar-bg);\r\n  color: var(--_mono-sidebar-text);\r\n  display: flex;\r\n  flex-direction: column;\r\n  overflow: hidden;\r\n  pointer-events: auto;\r\n  transition:\r\n    width 0.22s cubic-bezier(0.4, 0, 0.2, 1),\r\n    transform 0.26s cubic-bezier(0.4, 0, 0.2, 1),\r\n    visibility 0s linear 0.26s,\r\n    background-color var(--mono-duration) var(--mono-ease),\r\n    box-shadow var(--mono-duration) var(--mono-ease),\r\n    border-color var(--mono-duration) var(--mono-ease);\r\n}\r\n\r\n[mono-sidebar][mono-contained] [mono-panel] {\r\n  position: absolute;\r\n}\r\n\r\n/* `contained` scopes the sidebar to its own box, so the page-level z ladder is wrong\r\n   for it: at 50 the panel outranked site chrome and painted OVER a sticky header while\r\n   the container scrolled past it (VitePress's navbar is z 30). Re-resolving the private\r\n   var with a LOCAL default keeps the panel above its own scrim and nothing else; an\r\n   explicit --mono-sidebar-z still wins. Not `isolation: isolate` — a stacking context\r\n   here would trap a fixed overlay (a modal or drawer opened from inside the sidebar)\r\n   in the container, which is the trap DemoPreview.vue's stage comment records. */\r\n[mono-sidebar][mono-contained] {\r\n  --_mono-sidebar-z: var(--mono-sidebar-z, 2);\r\n}\r\n\r\n/* Location anchor */\r\n[mono-sidebar][mono-location=\"left\"] [mono-panel] {\r\n  left: 0;\r\n}\r\n\r\n[mono-sidebar][mono-location=\"right\"] [mono-panel] {\r\n  right: 0;\r\n}\r\n\r\n/* ─────── VARIANT ─────── */\r\n[mono-sidebar][mono-variant=\"elevated\"][mono-location=\"left\"] [mono-panel] {\r\n  box-shadow: var(--_mono-sidebar-shadow);\r\n}\r\n\r\n[mono-sidebar][mono-variant=\"elevated\"][mono-location=\"right\"] [mono-panel] {\r\n  box-shadow: -4px 0 24px color-mix(in oklab, var(--_mono-sidebar-accent) 8%, transparent);\r\n}\r\n\r\n[mono-sidebar][mono-variant=\"flat\"] [mono-panel] {\r\n  box-shadow: none;\r\n}\r\n\r\n[mono-sidebar][mono-variant=\"outlined\"][mono-location=\"left\"] [mono-panel] {\r\n  box-shadow: none;\r\n  border-right: 1px solid var(--_mono-sidebar-border);\r\n}\r\n\r\n[mono-sidebar][mono-variant=\"outlined\"][mono-location=\"right\"] [mono-panel] {\r\n  box-shadow: none;\r\n  border-left: 1px solid var(--_mono-sidebar-border);\r\n}\r\n\r\n/* ─────── EFFECTIVE MODE: PERMANENT ─────── */\r\n/* Set --sidebar-current-width on the ROOT (not the panel) so the rail toggle\r\n   sibling can read it for its left/right offset. CSS variables only cascade\r\n   downward — putting the override on a sibling doesn't help the toggle. */\r\n[mono-sidebar][mono-effective=\"permanent\"] {\r\n  --_mono-sidebar-current-width: var(--_mono-sidebar-width);\r\n}\r\n\r\n[mono-sidebar][mono-effective=\"permanent\"] [mono-panel] {\r\n  visibility: visible;\r\n  transform: none;\r\n}\r\n\r\n/* ─────── EFFECTIVE MODE: RAIL ─────── */\r\n[mono-sidebar][mono-effective=\"rail\"] {\r\n  --_mono-sidebar-current-width: var(--_mono-sidebar-rail-width);\r\n}\r\n\r\n[mono-sidebar][mono-effective=\"rail\"] [mono-panel] {\r\n  visibility: visible;\r\n  transform: none;\r\n}\r\n\r\n/* In rail mode, when modelValue === true, expand to full width. */\r\n[mono-sidebar][mono-effective=\"rail\"][mono-open] {\r\n  --_mono-sidebar-current-width: var(--_mono-sidebar-width);\r\n}\r\n\r\n/* expand-on-hover only applies when rail is collapsed (not user-toggled open).\r\n   Hover is on the root so both panel and toggle pick up the new width. */\r\n[mono-sidebar][mono-effective=\"rail\"][mono-expand-on-hover]:not([mono-open]):hover {\r\n  --_mono-sidebar-current-width: var(--_mono-sidebar-width);\r\n}\r\n\r\n/* ─────── EFFECTIVE MODE: TEMPORARY ─────── */\r\n[mono-sidebar][mono-effective=\"temporary\"] {\r\n  --_mono-sidebar-current-width: var(--_mono-sidebar-width);\r\n}\r\n\r\n[mono-sidebar][mono-effective=\"temporary\"] [mono-panel] {\r\n  visibility: hidden;\r\n}\r\n\r\n[mono-sidebar][mono-effective=\"temporary\"][mono-location=\"left\"] [mono-panel] {\r\n  transform: translateX(-100%);\r\n}\r\n\r\n[mono-sidebar][mono-effective=\"temporary\"][mono-location=\"right\"] [mono-panel] {\r\n  transform: translateX(100%);\r\n}\r\n\r\n[mono-sidebar][mono-effective=\"temporary\"][mono-open] [mono-panel] {\r\n  visibility: visible;\r\n  transform: translateX(0);\r\n  transition:\r\n    width 0.22s cubic-bezier(0.4, 0, 0.2, 1),\r\n    transform 0.26s cubic-bezier(0.4, 0, 0.2, 1),\r\n    visibility 0s linear 0s,\r\n    background-color var(--mono-duration) var(--mono-ease),\r\n    box-shadow var(--mono-duration) var(--mono-ease),\r\n    border-color var(--mono-duration) var(--mono-ease);\r\n}\r\n\r\n/* ─────── SCRIM (temporary mode only) ─────── */\r\n:where([mono-sidebar]) [mono-scrim] {\r\n  position: fixed;\r\n  inset: 0;\r\n  z-index: calc(var(--_mono-sidebar-z) - 1);\r\n  background: var(--_mono-sidebar-scrim-bg);\r\n  opacity: 0;\r\n  pointer-events: none;\r\n  cursor: pointer;\r\n  transition: opacity 0.24s ease;\r\n  display: none;\r\n}\r\n\r\n[mono-sidebar][mono-contained] [mono-scrim] {\r\n  position: absolute;\r\n}\r\n\r\n[mono-sidebar][mono-effective=\"temporary\"]:not([mono-no-scrim]) [mono-scrim] {\r\n  display: block;\r\n}\r\n\r\n[mono-sidebar][mono-effective=\"temporary\"][mono-open] [mono-scrim] {\r\n  opacity: 1;\r\n  pointer-events: auto;\r\n}\r\n\r\n/* ─────── HEADER / BODY / FOOTER ─────── */\r\n:where([mono-sidebar]) :where([mono-topbar]) > [mono-header] {\r\n  flex-shrink: 0;\r\n  padding: var(--_mono-sidebar-pad-y) var(--_mono-sidebar-pad-x);\r\n  display: flex;\r\n  align-items: center;\r\n  gap: 0.6rem;\r\n  min-height: 0;\r\n}\r\n\r\n:where([mono-sidebar]) :where([mono-topbar]) > [mono-header]:empty {\r\n  display: none;\r\n}\r\n\r\n:where([mono-sidebar]) :where([mono-panel]) > [mono-body] {\r\n  flex: 1;\r\n  min-height: 0;\r\n  overflow-y: auto;\r\n  overflow-x: hidden;\r\n  padding: var(--_mono-sidebar-pad-y) var(--_mono-sidebar-pad-x);\r\n}\r\n\r\n:where([mono-sidebar]) :where([mono-panel]) > [mono-body]:empty {\r\n  padding: 0;\r\n}\r\n\r\n:where([mono-sidebar]) :where([mono-panel]) > [mono-footer] {\r\n  flex-shrink: 0;\r\n  padding: var(--_mono-sidebar-pad-y) var(--_mono-sidebar-pad-x);\r\n  border-top: 1px solid var(--_mono-sidebar-border-lite);\r\n}\r\n\r\n:where([mono-sidebar]) :where([mono-panel]) > [mono-footer]:empty {\r\n  display: none;\r\n}\r\n\r\n/* ─────── TOP BAR (header + rail share one row, justify-between) ─────── */\r\n:where([mono-sidebar]) :where([mono-panel]) > [mono-topbar] {\r\n  flex-shrink: 0;\r\n  display: flex;\r\n  align-items: stretch;\r\n  min-width: 0;\r\n  border-bottom: 1px solid var(--_mono-sidebar-border-lite);\r\n}\r\n\r\n/* Hide the border when the topbar would be visually empty\r\n   (header empty AND no rail bar rendered at all). */\r\n:where([mono-sidebar]) :where([mono-panel]) > [mono-topbar]:not(:has(> [mono-rail])):has(> [mono-header]:empty) {\r\n  border-bottom: none;\r\n}\r\n\r\n/* For right-located sidebar, mirror the row so the rail toggle sits on the\r\n   viewport-edge side and the header sits on the interior side. */\r\n[mono-sidebar][mono-location=\"right\"] :where([mono-panel]) > [mono-topbar] {\r\n  flex-direction: row-reverse;\r\n}\r\n\r\n/* When the row contains both header and rail, header takes the available\r\n   space and rail hugs its content — the visual \"justify-between\" effect. */\r\n:where([mono-sidebar]) :where([mono-panel]) > [mono-topbar] > [mono-header] {\r\n  flex: 1 1 auto;\r\n  min-width: 0;\r\n}\r\n\r\n:where([mono-sidebar]) :where([mono-panel]) > [mono-topbar] > [mono-rail] {\r\n  flex: 0 0 auto;\r\n}\r\n\r\n/* In collapsed rail (no toggle-open, no hover-expand): show the header (so the\r\n   user sees their brand/avatar) and HIDE the rail bar (chevron). The chevron\r\n   only reveals when the user hovers the top row (see swap rule below). */\r\n[mono-sidebar][mono-effective=\"rail\"]:not([mono-open]) :where([mono-panel]) > [mono-topbar] > [mono-rail] {\r\n  display: none;\r\n}\r\n\r\n[mono-sidebar][mono-effective=\"rail\"]:not([mono-open]) :where([mono-panel]) > [mono-topbar] > [mono-header] {\r\n  flex: 1 1 auto;\r\n}\r\n\r\n/* Collapsed rail + topbar hover (no expand-on-hover): swap — hide the header\r\n   and reveal the chevron in its place. Hover scope is the whole topbar (not\r\n   just the header) so the swap doesn't flicker when the cursor crosses\r\n   between the header's slot content and the revealed chevron.\r\n   Skipped when `expand-on-hover` is set: that path widens the panel instead\r\n   and shows both header + chevron side-by-side via the rules below.\r\n   Also gated on `:has(> [mono-rail])` — when the user takes over via\r\n   the `rail` boolean prop the default chevron isn't rendered, so there's\r\n   nothing to swap to and we should leave the header alone. */\r\n[mono-sidebar][mono-effective=\"rail\"]:not([mono-open]):not([mono-expand-on-hover]) :where([mono-panel]) > [mono-topbar]:has(> [mono-rail]):hover > [mono-header] {\r\n  display: none;\r\n}\r\n\r\n[mono-sidebar][mono-effective=\"rail\"]:not([mono-open]):not([mono-expand-on-hover]) :where([mono-panel]) > [mono-topbar]:has(> [mono-rail]):hover > [mono-rail] {\r\n  display: flex;\r\n  flex: 1 1 auto;\r\n}\r\n\r\n/* Toggled-open or hover-expanded via expand-on-hover: header keeps its space,\r\n   rail hugs its content — both visible side-by-side. */\r\n[mono-sidebar][mono-effective=\"rail\"][mono-open] :where([mono-panel]) > [mono-topbar] > [mono-rail],\r\n[mono-sidebar][mono-effective=\"rail\"][mono-expand-on-hover]:hover :where([mono-panel]) > [mono-topbar] > [mono-rail] {\r\n  display: flex;\r\n  flex: 0 0 auto;\r\n}\r\n\r\n/* ─────── RAIL BAR (slot host for the chevron / user content) ─────── */\r\n:where([mono-sidebar]) [mono-rail] {\r\n  display: flex;\r\n  align-items: center;\r\n  gap: 0.4rem;\r\n  min-height: 44px;\r\n  padding: var(--_mono-sidebar-pad-y) var(--_mono-sidebar-pad-x);\r\n}\r\n\r\n/* Collapsed rail: zero horizontal padding, center the chevron inside the\r\n   full-width rail bar (header is hidden so the bar takes the whole panel). */\r\n[mono-sidebar][mono-effective=\"rail\"]:not([mono-open]) [mono-rail] {\r\n  padding-left: 0;\r\n  padding-right: 0;\r\n  justify-content: center;\r\n}\r\n\r\n/* Expanded (toggled-open or hover-expanded): the rail hugs its content and\r\n   sits at the trailing edge of the row, so its inside padding only needs to\r\n   provide the gap between the chevron and the header. */\r\n[mono-sidebar][mono-effective=\"rail\"][mono-open] [mono-rail],\r\n[mono-sidebar][mono-effective=\"rail\"][mono-expand-on-hover]:hover [mono-rail] {\r\n  padding-left: var(--_mono-sidebar-pad-x);\r\n  padding-right: var(--_mono-sidebar-pad-x);\r\n  justify-content: center;\r\n}\r\n\r\n/* ─────── DEFAULT RAIL TOGGLE BUTTON ─────── */\r\n:where([mono-sidebar]) [mono-rail-toggle] {\r\n  width: 28px;\r\n  height: 28px;\r\n  border-radius: var(--mono-sidebar-rail-toggle-radius, var(--mono-radius-md));\r\n  border: 1px solid var(--_mono-sidebar-border);\r\n  background: var(--_mono-sidebar-surface);\r\n  color: var(--_mono-sidebar-text-soft);\r\n  cursor: pointer;\r\n  display: inline-flex;\r\n  align-items: center;\r\n  justify-content: center;\r\n  flex-shrink: 0;\r\n  transition:\r\n    background-color 0.14s ease,\r\n    color 0.14s ease,\r\n    border-color 0.14s ease;\r\n}\r\n\r\n:where([mono-sidebar]) [mono-rail-toggle]:hover {\r\n  background: var(--_mono-sidebar-surface);\r\n  color: var(--_mono-sidebar-accent);\r\n  border-color: var(--_mono-sidebar-accent);\r\n}\r\n\r\n/* On a painted panel the accent IS the surface behind this button, so the default\r\n   hover above would tint the glyph and its border into the background. Keep the\r\n   on-accent ink and let only the chip deepen. */\r\n[mono-sidebar][mono-color=\"primary\"] [mono-rail-toggle]:hover,\r\n[mono-sidebar][mono-color=\"secondary\"] [mono-rail-toggle]:hover,\r\n[mono-sidebar][mono-color=\"success\"] [mono-rail-toggle]:hover,\r\n[mono-sidebar][mono-color=\"danger\"] [mono-rail-toggle]:hover,\r\n[mono-sidebar][mono-color=\"warning\"] [mono-rail-toggle]:hover,\r\n[mono-sidebar][mono-color=\"info\"] [mono-rail-toggle]:hover,\r\n[mono-sidebar][mono-color=\"teal\"] [mono-rail-toggle]:hover,\r\n[mono-sidebar][mono-color=\"purple\"] [mono-rail-toggle]:hover,\r\n[mono-sidebar][mono-color=\"neutral\"] [mono-rail-toggle]:hover,\r\n[mono-sidebar][mono-color=\"dark\"] [mono-rail-toggle]:hover,\r\n[mono-sidebar][mono-color=\"custom\"] [mono-rail-toggle]:hover {\r\n  background: color-mix(in oklab, var(--_mono-sidebar-on-accent) 28%, transparent);\r\n  color: var(--_mono-sidebar-on-accent);\r\n  border-color: color-mix(in oklab, var(--_mono-sidebar-on-accent) 38%, transparent);\r\n}\r\n\r\n:where([mono-sidebar]) [mono-rail-toggle] > .mono-icon {\r\n  display: block;\r\n  width: var(--mono-icon-md);\r\n  height: var(--mono-icon-md);\r\n  transition: transform var(--mono-duration) var(--mono-ease);\r\n}\r\n\r\n/* Arrow direction (set directly on the icon via per-state rules so transitions\r\n   fire cleanly on every state flip — `var()`-driven transforms have known\r\n   quirks where some browsers skip the transition):\r\n   - location-left, collapsed → points right (►) to invite expansion\r\n   - location-left, expanded  → points left  (◄) to invite collapse\r\n   - location-right is mirrored\r\n   \"Expanded\" covers BOTH the toggled-open state (`[mono-open]`, set after click)\r\n   AND the hover-expanded state (`[mono-expand-on-hover]:hover`). */\r\n\r\n/* Default for location-right: mirror the icon so the chevron faces the panel. */\r\n[mono-sidebar][mono-location=\"right\"] [mono-rail-toggle] > .mono-icon {\r\n  transform: scaleX(-1);\r\n}\r\n\r\n/* Toggled open (after click): rotate to point inward. Active in any mode. */\r\n[mono-sidebar][mono-location=\"left\"][mono-open] [mono-rail-toggle] > .mono-icon {\r\n  transform: rotate(180deg);\r\n}\r\n\r\n[mono-sidebar][mono-location=\"right\"][mono-open] [mono-rail-toggle] > .mono-icon {\r\n  transform: scaleX(-1) rotate(180deg);\r\n}\r\n\r\n/* Hover-expanded via expand-on-hover (panel widens on hover, no click yet).\r\n   Higher specificity than the [mono-open] rule, so when both apply (cursor still\r\n   over the panel after a click) the result is identical. */\r\n[mono-sidebar][mono-effective=\"rail\"][mono-expand-on-hover][mono-location=\"left\"]:hover [mono-rail-toggle] > .mono-icon {\r\n  transform: rotate(180deg);\r\n}\r\n\r\n[mono-sidebar][mono-effective=\"rail\"][mono-expand-on-hover][mono-location=\"right\"]:hover [mono-rail-toggle] > .mono-icon {\r\n  transform: scaleX(-1) rotate(180deg);\r\n}\r\n\r\n/* Opt-in label convention (brand text, footer labels, …): display is read from an\r\n   inherited custom property, so the rail-collapse below can hide it across the\r\n   shadow boundary (a shadow-scoped descendant selector can't reach a slotted\r\n   light-DOM label). Unset → the element's natural display. Mirrors the menu's\r\n   `display: var(--mono-menu-label-display, <natural>)` contract. */\r\n.mono-sidebar-label {\r\n  display: var(--mono-sidebar-label-display, revert);\r\n}\r\n\r\n/* ─────── RAIL: COLLAPSE MENU + LABELS ─────── */\r\n/* When the rail is collapsed (not toggled-open and not hover-expanded), the\r\n   panel is too narrow to fit icon + text — for both menu rows and header/footer\r\n   slot content. We:\r\n   1. Hide text-bearing parts of any descendant `<mono-menu>` and shrink each\r\n      action to a centered icon-only pill (so the active-state pill hugs the\r\n      icon instead of stretching across the full panel).\r\n   2. Zero the header / body / footer horizontal padding so their centered\r\n      content lines up on the panel's center column, keeping the header\r\n      avatar visually flush with the menu icons below it.\r\n   3. Hide any element opted into the `.mono-sidebar-label` convention —\r\n      the typical wrapper for brand text, footer labels, etc. that should\r\n      collapse alongside the menu titles.\r\n   Every rule unwinds under `[mono-open]` or `[mono-expand-on-hover]:hover`, so labels\r\n   reappear in lockstep with the panel widening. */\r\n\r\n/* 1 — the menu interior collapses to icons: text-bearing parts are hidden, the\r\n   tree loses its indent and guide, and a group folds shut visually even while\r\n   the menu's own `_openGroups` state still has it marked open — the state\r\n   survives the round-trip and reappears the moment the panel widens. */\r\n/* Rail-collapse, entirely through inherited custom properties. Set on the body\r\n   (the menu's flattened parent) they cross the shadow boundary into a slotted\r\n   shadow <mono-menu>, whose rows no descendant selector here can reach; menu.css\r\n   consumes every one of them. Restored to `initial` on open / hover-expand\r\n   below, so `var(--x, fallback)` falls back to each element's natural value.\r\n   Pure CSS → works on the server (no-JS) and syncs with `:hover`.\r\n\r\n   This used to run alongside a parallel `.mono-menu-*` descendant path that only\r\n   the light build could see, because only it still emits the old classes. Two\r\n   paths meant three builds: light centred its rows and closed the tree guide,\r\n   shadow and hand-written markup did neither. */\r\n[mono-sidebar][mono-effective=\"rail\"] :where([mono-panel]) > [mono-body] {\r\n  --mono-menu-label-display: none;\r\n  --mono-menu-row-display: flex;\r\n  --mono-menu-row-justify: center;\r\n  --mono-menu-action-width: auto;\r\n  --mono-menu-action-justify: center;\r\n  --mono-menu-action-gap: 0;\r\n  --mono-menu-group-children-display: none;\r\n  /* a collapsed rail has no room for the tree's indent or its guide */\r\n  --mono-menu-indent: 0px;\r\n  --mono-menu-guide-width: 0px;\r\n  --mono-menu-guide-offset: 0px;\r\n}\r\n\r\n/* 2 — header / body / footer drop horizontal padding and center their content */\r\n[mono-sidebar][mono-effective=\"rail\"] :where([mono-topbar]) > [mono-header],\r\n[mono-sidebar][mono-effective=\"rail\"] :where([mono-panel]) > [mono-footer] {\r\n  padding-left: 0;\r\n  padding-right: 0;\r\n  justify-content: center;\r\n}\r\n\r\n[mono-sidebar][mono-effective=\"rail\"] :where([mono-panel]) > [mono-body] {\r\n  padding-left: 0;\r\n  padding-right: 0;\r\n}\r\n\r\n/* 3 — opt-in label convention for slot content (brand text, footer labels, …).\r\n   Display is driven by an inherited custom property so the rail-collapse reaches\r\n   slotted labels ACROSS the shadow boundary — the same contract the menu uses\r\n   (see `--mono-menu-label-display`). Set on the rail root so labels in ANY region\r\n   (header / body / footer) inherit it; the label consumes it via the base rule\r\n   below (`display: var(--mono-sidebar-label-display, revert)`). */\r\n[mono-sidebar][mono-effective=\"rail\"] {\r\n  --mono-sidebar-label-display: none;\r\n}\r\n\r\n/* ─── Restore on toggled-open or hover-expanded ─── */\r\n/* When the rail expands, defer to the data-open attribute — open groups\r\n   reveal their children, closed groups stay closed. */\r\n/* Restore the cross-shadow rail-collapse vars on toggle-open / hover-expand:\r\n   `initial` makes the menu's `var(--x, fallback)` resolve to each element's\r\n   natural value, re-expanding the slotted shadow <mono-menu> in lockstep. */\r\n[mono-sidebar][mono-effective=\"rail\"][mono-open] :where([mono-panel]) > [mono-body],\r\n[mono-sidebar][mono-effective=\"rail\"][mono-expand-on-hover]:hover :where([mono-panel]) > [mono-body] {\r\n  --mono-menu-label-display: initial;\r\n  --mono-menu-row-display: initial;\r\n  --mono-menu-row-justify: initial;\r\n  --mono-menu-action-width: initial;\r\n  --mono-menu-action-justify: initial;\r\n  --mono-menu-action-gap: initial;\r\n  --mono-menu-group-children-display: initial;\r\n  --mono-menu-indent: initial;\r\n  --mono-menu-guide-width: initial;\r\n  --mono-menu-guide-offset: initial;\r\n}\r\n\r\n[mono-sidebar][mono-effective=\"rail\"][mono-open] :where([mono-topbar]) > [mono-header],\r\n[mono-sidebar][mono-effective=\"rail\"][mono-open] :where([mono-panel]) > [mono-body],\r\n[mono-sidebar][mono-effective=\"rail\"][mono-open] :where([mono-panel]) > [mono-footer],\r\n[mono-sidebar][mono-effective=\"rail\"][mono-expand-on-hover]:hover :where([mono-topbar]) > [mono-header],\r\n[mono-sidebar][mono-effective=\"rail\"][mono-expand-on-hover]:hover :where([mono-panel]) > [mono-body],\r\n[mono-sidebar][mono-effective=\"rail\"][mono-expand-on-hover]:hover :where([mono-panel]) > [mono-footer] {\r\n  padding-left: var(--_mono-sidebar-pad-x);\r\n  padding-right: var(--_mono-sidebar-pad-x);\r\n}\r\n\r\n[mono-sidebar][mono-effective=\"rail\"][mono-open] :where([mono-topbar]) > [mono-header],\r\n[mono-sidebar][mono-effective=\"rail\"][mono-open] :where([mono-panel]) > [mono-footer],\r\n[mono-sidebar][mono-effective=\"rail\"][mono-expand-on-hover]:hover :where([mono-topbar]) > [mono-header],\r\n[mono-sidebar][mono-effective=\"rail\"][mono-expand-on-hover]:hover :where([mono-panel]) > [mono-footer] {\r\n  justify-content: flex-start;\r\n}\r\n\r\n/* Restore the label on toggle-open / hover-expand: `initial` makes the custom\r\n   property guaranteed-invalid, so the label's `var(--x, revert)` falls back to\r\n   its natural display — re-expanding slotted labels (light + shadow) in lockstep\r\n   with the menu (mirrors the `--mono-menu-*` restore above). */\r\n[mono-sidebar][mono-effective=\"rail\"][mono-open],\r\n[mono-sidebar][mono-effective=\"rail\"][mono-expand-on-hover]:hover {\r\n  --mono-sidebar-label-display: initial;\r\n}\r\n\r\n/* ─────── REDUCED MOTION ─────── */\r\n@media (prefers-reduced-motion: reduce) {\r\n  :where([mono-sidebar]) [mono-panel],\r\n  :where([mono-sidebar]) [mono-scrim],\r\n  :where([mono-sidebar]) [mono-rail-toggle] {\r\n    transition: none;\r\n  }\r\n}\r\n";
//#endregion
//#region src/components/sidebar/mono-sidebar.shadow.ts
var MonoSidebarShadow = class MonoSidebarShadow extends withShadowUtilityStyles(MonoSidebarCore(LitElement)) {
	static {
		this.styles = [unsafeCSS(toShadowCss(sidebar_default, { host: "mono-sidebar" }))];
	}
	connectedCallback() {
		super.connectedCallback();
		if (isServer) return;
		flushSsrHydration(this);
	}
	renderSlot(name) {
		if (name === "header") return html`<slot name="header"></slot>`;
		if (name === "footer") return html`<slot name="footer"></slot>`;
		return html`<slot name="body"></slot><slot></slot>`;
	}
	renderIcon(_name) {
		return html`
      <svg viewBox="0 0 24 24" width="1.1em" height="1.1em" fill="currentColor" aria-hidden="true">
        <path d="M8.59,16.59L13.17,12L8.59,7.41L10,6L16,12L10,18L8.59,16.59Z" />
      </svg>
    `;
	}
};
MonoSidebarShadow = __decorate([customElement("mono-shadow-sidebar")], MonoSidebarShadow);
//#endregion
export { MonoSidebarCore, MonoSidebarShadow, SIDEBAR_AUTO_BREAKPOINT, generateSidebarRootClasses, isAutoTemporary, resolveMode, validateSidebarProps };
