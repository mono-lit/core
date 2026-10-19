import { a as __decorate, f as customElement, i as withShadowUtilityStyles, l as defineHybridPropAliases, r as toShadowCss, s as booleanStringConverter, t as flushSsrHydration, u as numberStringConverter } from "../../hydration-flush-DHrl4_KK.js";
import { t as dispatchMonoEvent } from "../../mono-event-BPku9HpS.js";
import { n as cssPart, r as defineCssClassAliases, t as applyCssClass } from "../../css-class-B6Tc_MAx.js";
import { n as releaseLayoutVar, t as claimLayoutVar } from "../../layout-var-BSBKY49k.js";
import { a as validateColorProp, i as isThemeColorToken, n as colorClassToken, r as customColorStyle, t as CUSTOM_COLOR_CLASS } from "../../color-CEYYtRX-.js";
import { a as setExternalScrollLock } from "../../popup-stack-C64WCuXq.js";
import { LitElement, html, isServer, nothing, unsafeCSS } from "lit";
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
//#region \0raw:C:\Users\VCT-DEV\Desktop\libs\packages\helper\src\components\sidebar\sidebar.css?raw.js
var sidebar_css_raw_default = "/* @unocss-include */\n\n/* =========================================================================\n   mono-sidebar — a port of Basecoat's `.sidebar` (basecoat-css@1.0.2, vega\n   style).\n\n   Styled by ATTRIBUTE, like Basecoat — and the attributes mirror the element's\n   props one for one, so hand-written markup reads like the Lit / Vue tag:\n\n     <mono-sidebar mode=\"rail\" location=\"right\" color=\"primary\" model-value>\n     <div mono-sidebar mono-mode=\"rail\" mono-effective=\"rail\"\n          mono-location=\"right\" mono-color=\"primary\" mono-open role=\"navigation\">\n       <div mono-scrim></div>\n       <aside mono-panel>\n         <div mono-topbar>\n           <div mono-header>…</div>\n           <div mono-rail><button mono-rail-toggle>…</button></div>\n         </div>\n         <div mono-body>…</div>\n         <div mono-footer>…</div>\n       </aside>\n     </div>\n\n   An absent attribute is the prop's default (`:not([mono-density])` =\n   comfortable, `:not([mono-color])` = surface, `:not([mono-variant])` =\n   elevated, `:not([mono-location])` = left). `mono-effective` carries the\n   mode after `auto` resolves, which is what the layout rules key on. The old\n   classes (`[mono-sidebar][mono-mode=\"auto\"][mono-effective=\"permanent\"][mono-location=\"left\"]…`) are\n   still emitted as inert hooks until 2.0 but no rule here reads them.\n\n   Selector map (ours ≡ upstream):\n     [mono-sidebar]     ≡ .sidebar (the overlay wrapper)\n     :where([mono-sidebar]) [mono-panel]       ≡ .sidebar nav (fixed inset-y-0 z-50 flex w-… flex-col\n                          transition-transform duration-300 ease-in-out)\n     :where([mono-sidebar]) [mono-scrim]       ≡ .sidebar:not([aria-hidden]) max-md:bg-black/50\n     :where([mono-sidebar]) [mono-header] / [mono-footer] ≡ .sidebar nav > header, > footer\n                          (flex flex-col, gap-2 p-2)\n     :where([mono-sidebar]) [mono-body]        ≡ .sidebar nav > section (flex min-h-0 flex-1 flex-col\n                          overflow-y-auto, gap-2)\n     [mono-location=…]  ≡ [data-side='left' | 'right'] (border-r / border-l)\n     :not([mono-open])  ≡ [aria-hidden=true] (translate the panel out)\n     :where([mono-sidebar]) [mono-rail] / [mono-rail-toggle] / [mono-topbar] ≡ EXTENSION (upstream has\n                          no rail mode)\n     [mono-mode=…] / [mono-variant=…] / [mono-density=…] / [mono-color=…]\n                        ≡ EXTENSION\n\n   NO GRADIENTS. The painted panel was a two-stop brand gradient with a coloured\n   halo; it is the flat role fill now, inked in that role's `-foreground` the\n   way `.btn[data-variant='primary']` is. The scrim is `--mono-mode-backdrop`.\n\n   DARK MODE comes free — every colour resolves through a Basecoat token that\n   already flips. A selector crosses neither the custom-element host nor the\n   shadow boundary, so no `[mono-color=\"dark\"]` rule can live in component CSS.\n\n   FLAVORS set `--mono-sidebar-{width,radius,shadow,pad-*,gap,scrim-*}` (+ the\n   per-density forms); every fallback here is vega's value\n   (`node scripts/basecoat-styles.mjs --grep \"sidebar\"`).\n   ========================================================================= */\n\nmono-sidebar {\n  display: contents;\n}\n\n[mono-sidebar] {\n  /* ── the ten roles, each a public knob over a Basecoat token ────────────── */\n  --_mono-sidebar-primary: var(--mono-sidebar-primary, var(--primary));\n  --_mono-sidebar-secondary: var(--mono-sidebar-secondary, var(--secondary-foreground));\n  --_mono-sidebar-success: var(--mono-sidebar-success, var(--success));\n  --_mono-sidebar-danger: var(--mono-sidebar-danger, var(--destructive));\n  --_mono-sidebar-warning: var(--mono-sidebar-warning, var(--warning));\n  --_mono-sidebar-info: var(--mono-sidebar-info, var(--info));\n  --_mono-sidebar-teal: var(--mono-sidebar-teal, var(--teal));\n  --_mono-sidebar-purple: var(--mono-sidebar-purple, var(--purple));\n  --_mono-sidebar-neutral: var(--mono-sidebar-neutral, var(--neutral));\n  --_mono-sidebar-dark: var(--mono-sidebar-dark, var(--dark));\n\n  /* ── the chrome surface — upstream's own sidebar tokens ──────────────────\n     basecoat@1.0.2 styles/vega.css .sidebar nav — bg-sidebar text-sidebar-foreground */\n  --_mono-sidebar-surface: var(--mono-sidebar-surface, var(--_mono-sidebar-surface-preset, var(--sidebar)));\n  --_mono-sidebar-surface-soft: var(--mono-sidebar-surface-soft, var(--muted));\n  --_mono-sidebar-text: var(--mono-sidebar-text, var(--_mono-sidebar-text-preset, var(--sidebar-foreground)));\n  --_mono-sidebar-text-soft: var(--mono-sidebar-text-soft, var(--_mono-sidebar-text-soft-preset, color-mix(in oklab, var(--_mono-sidebar-text) 70%, transparent)));\n  /* basecoat@1.0.2 styles/vega.css .sidebar nav [role=separator] — border-sidebar-border mx-2 */\n  --_mono-sidebar-border: var(--mono-sidebar-border, var(--_mono-sidebar-border-preset, var(--sidebar-border)));\n  --_mono-sidebar-border-lite: var(--mono-sidebar-border-lite, var(--_mono-sidebar-border-lite-preset, var(--_mono-sidebar-border)));\n\n  --_mono-sidebar-accent: var(--mono-sidebar-accent, var(--_mono-sidebar-accent-preset, var(--_mono-sidebar-primary)));\n  /* Ink for a panel painted in the accent. Each role points this at its own\n     `-foreground` token, so a light role gets readable ink without a luminance\n     calculation; a literal colour gets one written inline by the component.\n     Every softened tint on a painted panel mixes from THIS, never from a\n     literal white, so the whole treatment flips with the ink. */\n  --_mono-sidebar-on-accent: var(--mono-sidebar-on-accent, var(--_mono-sidebar-on-accent-preset, var(--primary-foreground)));\n\n  --_mono-sidebar-bg: var(--mono-sidebar-bg, var(--_mono-sidebar-bg-preset, var(--_mono-sidebar-surface)));\n  /* upstream's `--sidebar-width` / `--sidebar-mobile-width` are the measure */\n  --_mono-sidebar-width: var(--mono-sidebar-width, var(--sidebar-width));\n  --_mono-sidebar-rail-width: var(--mono-sidebar-rail-width, calc(var(--mono-spacing) * 16));\n  --_mono-sidebar-current-width: var(--_mono-sidebar-width);\n  --_mono-sidebar-z: var(--mono-sidebar-z, 50);\n  /* basecoat@1.0.2 styles/vega.css .sidebar nav > header, .sidebar nav > footer — gap-2 p-2 */\n  --_mono-sidebar-pad-x: var(--mono-sidebar-pad-x, var(--_mono-sidebar-pad-x-preset, var(--mono-sidebar-pad-x-comfortable, calc(var(--mono-spacing) * 2))));\n  --_mono-sidebar-pad-y: var(--mono-sidebar-pad-y, var(--_mono-sidebar-pad-y-preset, var(--mono-sidebar-pad-y-comfortable, calc(var(--mono-spacing) * 2))));\n  /* basecoat@1.0.2 styles/vega.css .sidebar nav > section — gap-2 */\n  --_mono-sidebar-gap: var(--mono-sidebar-gap, var(--_mono-sidebar-gap-preset, var(--mono-sidebar-gap-comfortable, calc(var(--mono-spacing) * 2))));\n  --_mono-sidebar-radius: var(--mono-sidebar-radius, 0);\n  --_mono-sidebar-shadow: var(--mono-sidebar-shadow, var(--mono-shadow-sm));\n  --_mono-sidebar-border-width: var(--mono-sidebar-border-width, var(--mono-border-width));\n  --_mono-sidebar-scrim-bg: var(--mono-sidebar-scrim-bg, var(--mono-mode-backdrop));\n  --_mono-sidebar-duration: var(--mono-sidebar-duration, var(--mono-duration-slow, 300ms));\n\n  /* Hand the panel's resolved palette to any <mono-menu> in the body. These are\n     menu's PUBLIC vars, so they inherit in the light build and pierce the shadow\n     boundary in the shadow one — the same handoff the rail layout uses below.\n\n     Unconditional on purpose. A panel gets painted from three independent places\n     — the `color` prop, a flavor, or a consumer's own `--mono-sidebar-bg` — and\n     only the first is visible to a selector here. Deriving from\n     `--_mono-sidebar-*` means the menu follows the panel whichever one painted\n     it; before this, a navy panel carried menu labels still inked near-black.\n\n     Only the HUE comes from the sidebar; the soft/faint steps keep menu's own\n     ratios rather than the sidebar's, which is tuned for chrome and would wash a\n     menu label out. */\n  --mono-menu-text: var(--_mono-sidebar-text);\n  --mono-menu-text-soft: color-mix(in oklab, var(--_mono-sidebar-text) 72%, transparent);\n  --mono-menu-text-faint: color-mix(in oklab, var(--_mono-sidebar-text) 68%, transparent);\n  --mono-menu-surface: transparent;\n  --mono-menu-border: var(--_mono-sidebar-border);\n  --mono-menu-border-lite: var(--_mono-sidebar-border-lite);\n  --mono-menu-accent: var(--_mono-sidebar-accent);\n  --mono-menu-hover-bg: color-mix(in oklab, var(--_mono-sidebar-text) 8%, transparent);\n  --mono-menu-hover-color: var(--_mono-sidebar-text);\n  --mono-menu-hover-border-color: color-mix(in oklab, var(--_mono-sidebar-text) 14%, transparent);\n  /* The pill is a wash of the menu accent over WHATEVER the panel is, so it has\n     to be mixed with `transparent`, not with the document's `--sidebar-accent`\n     the way menu's own default is. On a navy panel the accent is white, and\n     mixing white into the page's near-white chrome painted a white pill under\n     white ink. */\n  --mono-menu-active-bg: color-mix(in oklab, var(--_mono-sidebar-accent) 18%, transparent);\n  --mono-menu-active-color: var(--_mono-sidebar-accent);\n  --mono-menu-active-shadow: none;\n\n  font-family: inherit;\n  color: var(--_mono-sidebar-text);\n}\n\n[mono-sidebar],\n:where([mono-sidebar]) *,\n:where([mono-sidebar]) *::before,\n:where([mono-sidebar]) *::after {\n  box-sizing: border-box;\n}\n\n\n/* ─────── DENSITY ─────── */\n[mono-sidebar][mono-density=\"compact\"] {\n  --_mono-sidebar-pad-x-preset: 0.6rem;\n  --_mono-sidebar-pad-y-preset: 0.6rem;\n  --_mono-sidebar-gap-preset: 0.3rem;\n}\n\n[mono-sidebar][mono-density=\"comfortable\"] {\n  --_mono-sidebar-pad-x-preset: 0.85rem;\n  --_mono-sidebar-pad-y-preset: 0.85rem;\n  --_mono-sidebar-gap-preset: 0.4rem;\n}\n\n[mono-sidebar][mono-density=\"default\"] {\n  --_mono-sidebar-pad-x-preset: 1.05rem;\n  --_mono-sidebar-pad-y-preset: 1.05rem;\n  --_mono-sidebar-gap-preset: 0.5rem;\n}\n\n/* ─────── COLOR ─────── */\n/* EVERY `-preset` here has to sit on `[mono-sidebar]`, the element that DECLARES the\n   resolvers above — never on the `[mono-panel]` child. A `var()` substitutes on\n   the element that declares it, so `--_mono-sidebar-bg` is already resolved by the time\n   a descendant sets `--_mono-sidebar-bg-preset`; the panel just inherits the finished\n   value and the preset is dead. The painting block below used to be written as\n   `[mono-sidebar][mono-color=\"primary\"] [mono-panel]`, which is exactly why no color ever\n   painted. Same trap as the one documented in checkbox.css's border-width block. */\n[mono-sidebar][mono-color=\"primary\"] {\n  --_mono-sidebar-accent-preset: var(--_mono-sidebar-primary);\n  --_mono-sidebar-on-accent-preset: var(--primary-foreground);\n}\n\n[mono-sidebar][mono-color=\"secondary\"] {\n  --_mono-sidebar-accent-preset: var(--_mono-sidebar-secondary);\n  /* the role IS --secondary-foreground, so the ink on it is --secondary */\n  --_mono-sidebar-on-accent-preset: var(--secondary);\n}\n\n[mono-sidebar][mono-color=\"success\"] {\n  --_mono-sidebar-accent-preset: var(--_mono-sidebar-success);\n  --_mono-sidebar-on-accent-preset: var(--success-foreground);\n}\n\n[mono-sidebar][mono-color=\"danger\"] {\n  --_mono-sidebar-accent-preset: var(--_mono-sidebar-danger);\n  --_mono-sidebar-on-accent-preset: var(--destructive-foreground);\n}\n\n[mono-sidebar][mono-color=\"warning\"] {\n  --_mono-sidebar-accent-preset: var(--_mono-sidebar-warning);\n  --_mono-sidebar-on-accent-preset: var(--warning-foreground);\n}\n\n[mono-sidebar][mono-color=\"info\"] {\n  --_mono-sidebar-accent-preset: var(--_mono-sidebar-info);\n  --_mono-sidebar-on-accent-preset: var(--info-foreground);\n}\n\n[mono-sidebar][mono-color=\"teal\"] {\n  --_mono-sidebar-accent-preset: var(--_mono-sidebar-teal);\n  --_mono-sidebar-on-accent-preset: var(--teal-foreground);\n}\n\n[mono-sidebar][mono-color=\"purple\"] {\n  --_mono-sidebar-accent-preset: var(--_mono-sidebar-purple);\n  --_mono-sidebar-on-accent-preset: var(--purple-foreground);\n}\n\n[mono-sidebar][mono-color=\"neutral\"] {\n  --_mono-sidebar-accent-preset: var(--_mono-sidebar-neutral);\n  --_mono-sidebar-on-accent-preset: var(--neutral-foreground);\n}\n\n[mono-sidebar][mono-color=\"dark\"] {\n  --_mono-sidebar-accent-preset: var(--_mono-sidebar-dark);\n  --_mono-sidebar-on-accent-preset: var(--dark-foreground);\n}\n\n/* `color` given a literal (`#7c3aed`, `rgb(…)`) instead of a token name. The three\n   presets are written INLINE on this same element by `_inlineRootStyle`, because a\n   literal cannot be a class name and cannot be known to a stylesheet; this class only\n   opts the element into the painting treatment below. */\n[mono-sidebar][mono-color=\"custom\"] {\n  /* deliberately empty — the values arrive inline */\n}\n\n/* surface keeps the white-with-themed-border look — never painted.\n   It sets NO accent preset on purpose: the resolver's own fallback is already\n   `--_mono-sidebar-primary`, so declaring it here would add nothing under Mono while\n   overriding a flavor's accent (ONE sets a white one on <body>) for the default color. */\n[mono-sidebar][mono-color=\"surface\"] {\n  /* deliberately empty — see above */\n}\n\n/* Themed colors paint the panel with the accent, and every foreground on it is mixed\n   from `--_mono-sidebar-on-accent` so the treatment works with dark ink as well as\n   white. `color-mix(…, transparent)` rather than `rgba(255,255,255,α)` for the same\n   reason. `-surface-preset` re-tints the rail toggle, which would otherwise stay a\n   white chip carrying white glyphs. */\n[mono-sidebar][mono-color=\"primary\"],\n[mono-sidebar][mono-color=\"secondary\"],\n[mono-sidebar][mono-color=\"success\"],\n[mono-sidebar][mono-color=\"danger\"],\n[mono-sidebar][mono-color=\"warning\"],\n[mono-sidebar][mono-color=\"info\"],\n[mono-sidebar][mono-color=\"teal\"],\n[mono-sidebar][mono-color=\"purple\"],\n[mono-sidebar][mono-color=\"neutral\"],\n[mono-sidebar][mono-color=\"dark\"],\n[mono-sidebar][mono-color=\"custom\"] {\n  --_mono-sidebar-bg-preset: var(--_mono-sidebar-accent);\n  --_mono-sidebar-text-preset: var(--_mono-sidebar-on-accent);\n  --_mono-sidebar-text-soft-preset: color-mix(in oklab, var(--_mono-sidebar-on-accent) 78%, transparent);\n  --_mono-sidebar-border-preset: color-mix(in oklab, var(--_mono-sidebar-on-accent) 18%, transparent);\n  --_mono-sidebar-border-lite-preset: color-mix(in oklab, var(--_mono-sidebar-on-accent) 12%, transparent);\n  --_mono-sidebar-surface-preset: color-mix(in oklab, var(--_mono-sidebar-on-accent) 16%, transparent);\n\n  /* The whole menu palette — pill included — is forwarded unconditionally up in\n     `[mono-sidebar]` and keys off `--_mono-sidebar-accent`. On a PAINTED panel that\n     accent IS the panel colour, so the pill would sit invisibly on it. Re-point\n     the menu's copy at the on-accent ink — and only the menu's copy: the panel's\n     own `--_mono-sidebar-bg-preset` reads `--_mono-sidebar-accent` in this very\n     block, so shadowing it here would repaint the panel white. */\n  --mono-menu-accent: var(--_mono-sidebar-on-accent);\n  --mono-menu-active-bg: color-mix(in oklab, var(--_mono-sidebar-on-accent) 18%, transparent);\n  --mono-menu-active-color: var(--_mono-sidebar-on-accent);\n}\n\n/* ─────── PANEL (the visible container) ─────── */\n:where([mono-sidebar]) [mono-panel] {\n  position: fixed;\n  top: 0;\n  bottom: 0;\n  z-index: var(--_mono-sidebar-z);\n  width: var(--_mono-sidebar-current-width);\n  /* basecoat@1.0.2 styles/vega.css .sidebar nav > header, .sidebar nav > footer — gap-2 p-2\n     maia, luma and rhea set [--radius: var(--radius-xl)] on the shell, sera 0 —\n     the chrome inside a panel follows the flavor, and so does the panel itself\n     wherever its corner shows (a contained sidebar; a full-height one has none). */\n  border-radius: var(--_mono-sidebar-radius);\n  background: var(--_mono-sidebar-bg);\n  color: var(--_mono-sidebar-text);\n  display: flex;\n  flex-direction: column;\n  overflow: hidden;\n  pointer-events: auto;\n  transition:\n    width 0.22s cubic-bezier(0.4, 0, 0.2, 1),\n    transform 0.26s cubic-bezier(0.4, 0, 0.2, 1),\n    visibility 0s linear 0.26s,\n    background-color var(--mono-duration) var(--mono-ease),\n    box-shadow var(--mono-duration) var(--mono-ease),\n    border-color var(--mono-duration) var(--mono-ease);\n}\n\n[mono-sidebar][mono-contained] [mono-panel] {\n  position: absolute;\n}\n\n/* `contained` scopes the sidebar to its own box, so the page-level z ladder is wrong\n   for it: at 50 the panel outranked site chrome and painted OVER a sticky header while\n   the container scrolled past it (VitePress's navbar is z 30). Re-resolving the private\n   var with a LOCAL default keeps the panel above its own scrim and nothing else; an\n   explicit --mono-sidebar-z still wins. Not `isolation: isolate` — a stacking context\n   here would trap a fixed overlay (a modal or drawer opened from inside the sidebar)\n   in the container, which is the trap DemoPreview.vue's stage comment records. */\n[mono-sidebar][mono-contained] {\n  --_mono-sidebar-z: var(--mono-sidebar-z, 2);\n}\n\n/* Location anchor */\n[mono-sidebar]:is(:not([mono-location]), [mono-location=\"left\"]) [mono-panel] {\n  left: 0;\n}\n\n[mono-sidebar][mono-location=\"right\"] [mono-panel] {\n  right: 0;\n}\n\n/* ─────── VARIANT ─────── */\n[mono-sidebar]:is(:not([mono-variant]), [mono-variant=\"elevated\"]):is(:not([mono-location]), [mono-location=\"left\"]) [mono-panel] {\n  box-shadow: var(--_mono-sidebar-shadow);\n}\n\n[mono-sidebar]:is(:not([mono-variant]), [mono-variant=\"elevated\"])[mono-location=\"right\"] [mono-panel] {\n  box-shadow: -4px 0 24px color-mix(in oklab, var(--_mono-sidebar-accent) 8%, transparent);\n}\n\n[mono-sidebar][mono-variant=\"flat\"] [mono-panel] {\n  box-shadow: none;\n}\n\n[mono-sidebar][mono-variant=\"outlined\"]:is(:not([mono-location]), [mono-location=\"left\"]) [mono-panel] {\n  box-shadow: none;\n  border-right: 1px solid var(--_mono-sidebar-border);\n}\n\n[mono-sidebar][mono-variant=\"outlined\"][mono-location=\"right\"] [mono-panel] {\n  box-shadow: none;\n  border-left: 1px solid var(--_mono-sidebar-border);\n}\n\n/* ─────── EFFECTIVE MODE: PERMANENT ─────── */\n/* Set --sidebar-current-width on the ROOT (not the panel) so the rail toggle\n   sibling can read it for its left/right offset. CSS variables only cascade\n   downward — putting the override on a sibling doesn't help the toggle. */\n[mono-sidebar][mono-effective=\"permanent\"] {\n  --_mono-sidebar-current-width: var(--_mono-sidebar-width);\n}\n\n[mono-sidebar][mono-effective=\"permanent\"] [mono-panel] {\n  visibility: visible;\n  transform: none;\n}\n\n/* ─────── EFFECTIVE MODE: RAIL ─────── */\n[mono-sidebar][mono-effective=\"rail\"] {\n  --_mono-sidebar-current-width: var(--_mono-sidebar-rail-width);\n}\n\n[mono-sidebar][mono-effective=\"rail\"] [mono-panel] {\n  visibility: visible;\n  transform: none;\n}\n\n/* In rail mode, when modelValue === true, expand to full width. */\n[mono-sidebar][mono-effective=\"rail\"][mono-open] {\n  --_mono-sidebar-current-width: var(--_mono-sidebar-width);\n}\n\n/* expand-on-hover only applies when rail is collapsed (not user-toggled open).\n   Hover is on the root so both panel and toggle pick up the new width. */\n[mono-sidebar][mono-effective=\"rail\"][mono-expand-on-hover]:not([mono-open]):hover {\n  --_mono-sidebar-current-width: var(--_mono-sidebar-width);\n}\n\n/* ─────── EFFECTIVE MODE: TEMPORARY ─────── */\n[mono-sidebar][mono-effective=\"temporary\"] {\n  --_mono-sidebar-current-width: var(--_mono-sidebar-width);\n}\n\n[mono-sidebar][mono-effective=\"temporary\"] [mono-panel] {\n  visibility: hidden;\n}\n\n[mono-sidebar][mono-effective=\"temporary\"]:is(:not([mono-location]), [mono-location=\"left\"]) [mono-panel] {\n  transform: translateX(-100%);\n}\n\n[mono-sidebar][mono-effective=\"temporary\"][mono-location=\"right\"] [mono-panel] {\n  transform: translateX(100%);\n}\n\n[mono-sidebar][mono-effective=\"temporary\"][mono-open] [mono-panel] {\n  visibility: visible;\n  transform: translateX(0);\n  transition:\n    width 0.22s cubic-bezier(0.4, 0, 0.2, 1),\n    transform 0.26s cubic-bezier(0.4, 0, 0.2, 1),\n    visibility 0s linear 0s,\n    background-color var(--mono-duration) var(--mono-ease),\n    box-shadow var(--mono-duration) var(--mono-ease),\n    border-color var(--mono-duration) var(--mono-ease);\n}\n\n/* ─────── SCRIM (temporary mode only) ─────── */\n:where([mono-sidebar]) [mono-scrim] {\n  position: fixed;\n  inset: 0;\n  z-index: calc(var(--_mono-sidebar-z) - 1);\n  background: var(--_mono-sidebar-scrim-bg);\n  opacity: 0;\n  pointer-events: none;\n  cursor: pointer;\n  transition: opacity 0.24s ease;\n  display: none;\n}\n\n[mono-sidebar][mono-contained] [mono-scrim] {\n  position: absolute;\n}\n\n[mono-sidebar][mono-effective=\"temporary\"]:not([mono-no-scrim]) [mono-scrim] {\n  display: block;\n}\n\n[mono-sidebar][mono-effective=\"temporary\"][mono-open] [mono-scrim] {\n  opacity: 1;\n  pointer-events: auto;\n}\n\n/* ─────── HEADER / BODY / FOOTER ─────── */\n:where([mono-sidebar]) :where([mono-topbar]) > [mono-header] {\n  flex-shrink: 0;\n  padding: var(--_mono-sidebar-pad-y) var(--_mono-sidebar-pad-x);\n  display: flex;\n  align-items: center;\n  gap: 0.6rem;\n  min-height: 0;\n}\n\n:where([mono-sidebar]) :where([mono-topbar]) > [mono-header]:empty {\n  display: none;\n}\n\n:where([mono-sidebar]) :where([mono-panel]) > [mono-body] {\n  flex: 1;\n  min-height: 0;\n  overflow-y: auto;\n  overflow-x: hidden;\n  padding: var(--_mono-sidebar-pad-y) var(--_mono-sidebar-pad-x);\n}\n\n:where([mono-sidebar]) :where([mono-panel]) > [mono-body]:empty {\n  padding: 0;\n}\n\n:where([mono-sidebar]) :where([mono-panel]) > [mono-footer] {\n  flex-shrink: 0;\n  padding: var(--_mono-sidebar-pad-y) var(--_mono-sidebar-pad-x);\n  border-top: 1px solid var(--_mono-sidebar-border-lite);\n}\n\n:where([mono-sidebar]) :where([mono-panel]) > [mono-footer]:empty {\n  display: none;\n}\n\n/* ─────── TOP BAR (header + rail share one row, justify-between) ─────── */\n:where([mono-sidebar]) :where([mono-panel]) > [mono-topbar] {\n  flex-shrink: 0;\n  display: flex;\n  align-items: stretch;\n  min-width: 0;\n  border-bottom: 1px solid var(--_mono-sidebar-border-lite);\n}\n\n/* Hide the border when the topbar would be visually empty\n   (header empty AND no rail bar rendered at all). */\n:where([mono-sidebar]) :where([mono-panel]) > [mono-topbar]:not(:has(> [mono-rail])):has(> [mono-header]:empty) {\n  border-bottom: none;\n}\n\n/* For right-located sidebar, mirror the row so the rail toggle sits on the\n   viewport-edge side and the header sits on the interior side. */\n[mono-sidebar][mono-location=\"right\"] :where([mono-panel]) > [mono-topbar] {\n  flex-direction: row-reverse;\n}\n\n/* When the row contains both header and rail, header takes the available\n   space and rail hugs its content — the visual \"justify-between\" effect. */\n:where([mono-sidebar]) :where([mono-panel]) > [mono-topbar] > [mono-header] {\n  flex: 1 1 auto;\n  min-width: 0;\n}\n\n:where([mono-sidebar]) :where([mono-panel]) > [mono-topbar] > [mono-rail] {\n  flex: 0 0 auto;\n}\n\n/* In collapsed rail (no toggle-open, no hover-expand): show the header (so the\n   user sees their brand/avatar) and HIDE the rail bar (chevron). The chevron\n   only reveals when the user hovers the top row (see swap rule below). */\n[mono-sidebar][mono-effective=\"rail\"]:not([mono-open]) :where([mono-panel]) > [mono-topbar] > [mono-rail] {\n  display: none;\n}\n\n[mono-sidebar][mono-effective=\"rail\"]:not([mono-open]) :where([mono-panel]) > [mono-topbar] > [mono-header] {\n  flex: 1 1 auto;\n}\n\n/* Collapsed rail + topbar hover (no expand-on-hover): swap — hide the header\n   and reveal the chevron in its place. Hover scope is the whole topbar (not\n   just the header) so the swap doesn't flicker when the cursor crosses\n   between the header's slot content and the revealed chevron.\n   Skipped when `expand-on-hover` is set: that path widens the panel instead\n   and shows both header + chevron side-by-side via the rules below.\n   Also gated on `:has(> [mono-rail])` — when the user takes over via\n   the `rail` boolean prop the default chevron isn't rendered, so there's\n   nothing to swap to and we should leave the header alone. */\n[mono-sidebar][mono-effective=\"rail\"]:not([mono-open]):not([mono-expand-on-hover]) :where([mono-panel]) > [mono-topbar]:has(> [mono-rail]):hover > [mono-header] {\n  display: none;\n}\n\n[mono-sidebar][mono-effective=\"rail\"]:not([mono-open]):not([mono-expand-on-hover]) :where([mono-panel]) > [mono-topbar]:has(> [mono-rail]):hover > [mono-rail] {\n  display: flex;\n  flex: 1 1 auto;\n}\n\n/* Toggled-open or hover-expanded via expand-on-hover: header keeps its space,\n   rail hugs its content — both visible side-by-side. */\n[mono-sidebar][mono-effective=\"rail\"][mono-open] :where([mono-panel]) > [mono-topbar] > [mono-rail],\n[mono-sidebar][mono-effective=\"rail\"][mono-expand-on-hover]:hover :where([mono-panel]) > [mono-topbar] > [mono-rail] {\n  display: flex;\n  flex: 0 0 auto;\n}\n\n/* ─────── RAIL BAR (slot host for the chevron / user content) ─────── */\n:where([mono-sidebar]) [mono-rail] {\n  display: flex;\n  align-items: center;\n  gap: 0.4rem;\n  min-height: 44px;\n  padding: var(--_mono-sidebar-pad-y) var(--_mono-sidebar-pad-x);\n}\n\n/* Collapsed rail: zero horizontal padding, center the chevron inside the\n   full-width rail bar (header is hidden so the bar takes the whole panel). */\n[mono-sidebar][mono-effective=\"rail\"]:not([mono-open]) [mono-rail] {\n  padding-left: 0;\n  padding-right: 0;\n  justify-content: center;\n}\n\n/* Expanded (toggled-open or hover-expanded): the rail hugs its content and\n   sits at the trailing edge of the row, so its inside padding only needs to\n   provide the gap between the chevron and the header. */\n[mono-sidebar][mono-effective=\"rail\"][mono-open] [mono-rail],\n[mono-sidebar][mono-effective=\"rail\"][mono-expand-on-hover]:hover [mono-rail] {\n  padding-left: var(--_mono-sidebar-pad-x);\n  padding-right: var(--_mono-sidebar-pad-x);\n  justify-content: center;\n}\n\n/* ─────── DEFAULT RAIL TOGGLE BUTTON ─────── */\n:where([mono-sidebar]) [mono-rail-toggle] {\n  width: 28px;\n  height: 28px;\n  border-radius: var(--mono-sidebar-rail-toggle-radius, var(--mono-radius-md));\n  border: 1px solid var(--_mono-sidebar-border);\n  background: var(--_mono-sidebar-surface);\n  color: var(--_mono-sidebar-text-soft);\n  cursor: pointer;\n  display: inline-flex;\n  align-items: center;\n  justify-content: center;\n  flex-shrink: 0;\n  transition:\n    background-color 0.14s ease,\n    color 0.14s ease,\n    border-color 0.14s ease;\n}\n\n:where([mono-sidebar]) [mono-rail-toggle]:hover {\n  background: var(--_mono-sidebar-surface);\n  color: var(--_mono-sidebar-accent);\n  border-color: var(--_mono-sidebar-accent);\n}\n\n/* On a painted panel the accent IS the surface behind this button, so the default\n   hover above would tint the glyph and its border into the background. Keep the\n   on-accent ink and let only the chip deepen. */\n[mono-sidebar][mono-color=\"primary\"] [mono-rail-toggle]:hover,\n[mono-sidebar][mono-color=\"secondary\"] [mono-rail-toggle]:hover,\n[mono-sidebar][mono-color=\"success\"] [mono-rail-toggle]:hover,\n[mono-sidebar][mono-color=\"danger\"] [mono-rail-toggle]:hover,\n[mono-sidebar][mono-color=\"warning\"] [mono-rail-toggle]:hover,\n[mono-sidebar][mono-color=\"info\"] [mono-rail-toggle]:hover,\n[mono-sidebar][mono-color=\"teal\"] [mono-rail-toggle]:hover,\n[mono-sidebar][mono-color=\"purple\"] [mono-rail-toggle]:hover,\n[mono-sidebar][mono-color=\"neutral\"] [mono-rail-toggle]:hover,\n[mono-sidebar][mono-color=\"dark\"] [mono-rail-toggle]:hover,\n[mono-sidebar][mono-color=\"custom\"] [mono-rail-toggle]:hover {\n  background: color-mix(in oklab, var(--_mono-sidebar-on-accent) 28%, transparent);\n  color: var(--_mono-sidebar-on-accent);\n  border-color: color-mix(in oklab, var(--_mono-sidebar-on-accent) 38%, transparent);\n}\n\n:where([mono-sidebar]) [mono-rail-toggle] > :is(.mono-icon, svg) {\n  display: block;\n  width: var(--mono-icon-md);\n  height: var(--mono-icon-md);\n  transition: transform var(--mono-duration) var(--mono-ease);\n}\n\n/* Arrow direction (set directly on the icon via per-state rules so transitions\n   fire cleanly on every state flip — `var()`-driven transforms have known\n   quirks where some browsers skip the transition):\n   - location-left, collapsed → points right (►) to invite expansion\n   - location-left, expanded  → points left  (◄) to invite collapse\n   - location-right is mirrored\n   \"Expanded\" covers BOTH the toggled-open state (`[mono-open]`, set after click)\n   AND the hover-expanded state (`[mono-expand-on-hover]:hover`). */\n\n/* Default for location-right: mirror the icon so the chevron faces the panel. */\n[mono-sidebar][mono-location=\"right\"] [mono-rail-toggle] > :is(.mono-icon, svg) {\n  transform: scaleX(-1);\n}\n\n/* Toggled open (after click): rotate to point inward. Active in any mode. */\n[mono-sidebar]:is(:not([mono-location]), [mono-location=\"left\"])[mono-open] [mono-rail-toggle] > :is(.mono-icon, svg) {\n  transform: rotate(180deg);\n}\n\n[mono-sidebar][mono-location=\"right\"][mono-open] [mono-rail-toggle] > :is(.mono-icon, svg) {\n  transform: scaleX(-1) rotate(180deg);\n}\n\n/* Hover-expanded via expand-on-hover (panel widens on hover, no click yet).\n   Higher specificity than the [mono-open] rule, so when both apply (cursor still\n   over the panel after a click) the result is identical. */\n[mono-sidebar][mono-effective=\"rail\"][mono-expand-on-hover]:is(:not([mono-location]), [mono-location=\"left\"]):hover [mono-rail-toggle] > :is(.mono-icon, svg) {\n  transform: rotate(180deg);\n}\n\n[mono-sidebar][mono-effective=\"rail\"][mono-expand-on-hover][mono-location=\"right\"]:hover [mono-rail-toggle] > :is(.mono-icon, svg) {\n  transform: scaleX(-1) rotate(180deg);\n}\n\n/* Opt-in label convention (brand text, footer labels, …): display is read from an\n   inherited custom property, so the rail-collapse below can hide it across the\n   shadow boundary (a shadow-scoped descendant selector can't reach a slotted\n   light-DOM label). Unset → the element's natural display. Mirrors the menu's\n   `display: var(--mono-menu-label-display, <natural>)` contract. */\n.mono-sidebar-label {\n  display: var(--mono-sidebar-label-display, revert);\n}\n\n/* ─────── RAIL: COLLAPSE MENU + LABELS ─────── */\n/* When the rail is collapsed (not toggled-open and not hover-expanded), the\n   panel is too narrow to fit icon + text — for both menu rows and header/footer\n   slot content. We:\n   1. Hide text-bearing parts of any descendant `<mono-menu>` and shrink each\n      action to a centered icon-only pill (so the active-state pill hugs the\n      icon instead of stretching across the full panel).\n   2. Zero the header / body / footer horizontal padding so their centered\n      content lines up on the panel's center column, keeping the header\n      avatar visually flush with the menu icons below it.\n   3. Hide any element opted into the `.mono-sidebar-label` convention —\n      the typical wrapper for brand text, footer labels, etc. that should\n      collapse alongside the menu titles.\n   Every rule unwinds under `[mono-open]` or `[mono-expand-on-hover]:hover`, so labels\n   reappear in lockstep with the panel widening. */\n\n/* 1 — the menu interior collapses to icons: text-bearing parts are hidden, the\n   tree loses its indent and guide, and a group folds shut visually even while\n   the menu's own `_openGroups` state still has it marked open — the state\n   survives the round-trip and reappears the moment the panel widens. */\n/* Rail-collapse, entirely through inherited custom properties. Set on the body\n   (the menu's flattened parent) they cross the shadow boundary into a slotted\n   shadow <mono-menu>, whose rows no descendant selector here can reach; menu.css\n   consumes every one of them. Restored to `initial` on open / hover-expand\n   below, so `var(--x, fallback)` falls back to each element's natural value.\n   Pure CSS → works on the server (no-JS) and syncs with `:hover`.\n\n   This used to run alongside a parallel `.mono-menu-*` descendant path that only\n   the light build could see, because only it still emits the old classes. Two\n   paths meant three builds: light centred its rows and closed the tree guide,\n   shadow and hand-written markup did neither. */\n[mono-sidebar][mono-effective=\"rail\"] :where([mono-panel]) > [mono-body] {\n  --mono-menu-label-display: none;\n  --mono-menu-row-display: flex;\n  --mono-menu-row-justify: center;\n  --mono-menu-action-width: auto;\n  --mono-menu-action-justify: center;\n  --mono-menu-action-gap: 0;\n  --mono-menu-group-children-display: none;\n  /* a collapsed rail has no room for the tree's indent or its guide */\n  --mono-menu-indent: 0px;\n  --mono-menu-guide-width: 0px;\n  --mono-menu-guide-offset: 0px;\n}\n\n/* 2 — header / body / footer drop horizontal padding and center their content */\n[mono-sidebar][mono-effective=\"rail\"] :where([mono-topbar]) > [mono-header],\n[mono-sidebar][mono-effective=\"rail\"] :where([mono-panel]) > [mono-footer] {\n  padding-left: 0;\n  padding-right: 0;\n  justify-content: center;\n}\n\n[mono-sidebar][mono-effective=\"rail\"] :where([mono-panel]) > [mono-body] {\n  padding-left: 0;\n  padding-right: 0;\n}\n\n/* 3 — opt-in label convention for slot content (brand text, footer labels, …).\n   Display is driven by an inherited custom property so the rail-collapse reaches\n   slotted labels ACROSS the shadow boundary — the same contract the menu uses\n   (see `--mono-menu-label-display`). Set on the rail root so labels in ANY region\n   (header / body / footer) inherit it; the label consumes it via the base rule\n   below (`display: var(--mono-sidebar-label-display, revert)`). */\n[mono-sidebar][mono-effective=\"rail\"] {\n  --mono-sidebar-label-display: none;\n}\n\n/* ─── Restore on toggled-open or hover-expanded ─── */\n/* When the rail expands, defer to the data-open attribute — open groups\n   reveal their children, closed groups stay closed. */\n/* Restore the cross-shadow rail-collapse vars on toggle-open / hover-expand:\n   `initial` makes the menu's `var(--x, fallback)` resolve to each element's\n   natural value, re-expanding the slotted shadow <mono-menu> in lockstep. */\n[mono-sidebar][mono-effective=\"rail\"][mono-open] :where([mono-panel]) > [mono-body],\n[mono-sidebar][mono-effective=\"rail\"][mono-expand-on-hover]:hover :where([mono-panel]) > [mono-body] {\n  --mono-menu-label-display: initial;\n  --mono-menu-row-display: initial;\n  --mono-menu-row-justify: initial;\n  --mono-menu-action-width: initial;\n  --mono-menu-action-justify: initial;\n  --mono-menu-action-gap: initial;\n  --mono-menu-group-children-display: initial;\n  --mono-menu-indent: initial;\n  --mono-menu-guide-width: initial;\n  --mono-menu-guide-offset: initial;\n}\n\n[mono-sidebar][mono-effective=\"rail\"][mono-open] :where([mono-topbar]) > [mono-header],\n[mono-sidebar][mono-effective=\"rail\"][mono-open] :where([mono-panel]) > [mono-body],\n[mono-sidebar][mono-effective=\"rail\"][mono-open] :where([mono-panel]) > [mono-footer],\n[mono-sidebar][mono-effective=\"rail\"][mono-expand-on-hover]:hover :where([mono-topbar]) > [mono-header],\n[mono-sidebar][mono-effective=\"rail\"][mono-expand-on-hover]:hover :where([mono-panel]) > [mono-body],\n[mono-sidebar][mono-effective=\"rail\"][mono-expand-on-hover]:hover :where([mono-panel]) > [mono-footer] {\n  padding-left: var(--_mono-sidebar-pad-x);\n  padding-right: var(--_mono-sidebar-pad-x);\n}\n\n[mono-sidebar][mono-effective=\"rail\"][mono-open] :where([mono-topbar]) > [mono-header],\n[mono-sidebar][mono-effective=\"rail\"][mono-open] :where([mono-panel]) > [mono-footer],\n[mono-sidebar][mono-effective=\"rail\"][mono-expand-on-hover]:hover :where([mono-topbar]) > [mono-header],\n[mono-sidebar][mono-effective=\"rail\"][mono-expand-on-hover]:hover :where([mono-panel]) > [mono-footer] {\n  justify-content: flex-start;\n}\n\n/* Restore the label on toggle-open / hover-expand: `initial` makes the custom\n   property guaranteed-invalid, so the label's `var(--x, revert)` falls back to\n   its natural display — re-expanding slotted labels (light + shadow) in lockstep\n   with the menu (mirrors the `--mono-menu-*` restore above). */\n[mono-sidebar][mono-effective=\"rail\"][mono-open],\n[mono-sidebar][mono-effective=\"rail\"][mono-expand-on-hover]:hover {\n  --mono-sidebar-label-display: initial;\n}\n\n/* ─────── REDUCED MOTION ─────── */\n@media (prefers-reduced-motion: reduce) {\n  :where([mono-sidebar]) [mono-panel],\n  :where([mono-sidebar]) [mono-scrim],\n  :where([mono-sidebar]) [mono-rail-toggle] {\n    transition: none;\n  }\n}\n";

//#endregion
//#region src/components/sidebar/mono-sidebar.shadow.ts
let MonoSidebarShadow = class MonoSidebarShadow extends withShadowUtilityStyles(MonoSidebarCore(LitElement)) {
	static {
		this.styles = [unsafeCSS(toShadowCss(sidebar_css_raw_default, { host: "mono-sidebar" }))];
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