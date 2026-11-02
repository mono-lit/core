import { g as monoHostChildNodes } from "../mono-ui-CK5wNw-7.js";
import { t as customElement } from "../mono-element-BP0RKeDD.js";
import { r as booleanStringConverter, t as __decorate } from "../decorate-DbYFpi8R.js";
import { i as guardHostTextContent, s as placeSlotNode } from "../light-slots-RAAINrYd.js";
import { n as cssPart, r as defineCssClassAliases, t as applyCssClass } from "../css-class-B6Tc_MAx.js";
import { a as validateColorProp, i as isThemeColorToken, n as colorClassToken, r as customColorStyle, t as CUSTOM_COLOR_CLASS } from "../color-CEYYtRX-.js";
import { n as releaseLayoutVar, t as claimLayoutVar } from "../layout-var-BSBKY49k.js";
import { LitElement, html, nothing } from "lit";
import { property, state } from "lit/decorators.js";

//#region src/components/nav/nav-utils.ts
const DENSITY_HEIGHTS = {
	compact: 48,
	comfortable: 56,
	default: 64
};
function getNavHeight(density) {
	return DENSITY_HEIGHTS[density] ?? DENSITY_HEIGHTS.default;
}
function generateNavRootClasses(props) {
	return [
		"mono-nav",
		props.density,
		colorClassToken(props.color),
		props.variant,
		props.sticky ? "sticky" : "",
		props.extension ? "has-extension" : "",
		props.cssClassName ?? "",
		props.rootExtra ?? ""
	].filter(Boolean).join(" ");
}
function validateNavProps(props) {
	const errors = [];
	if (props.density && ![
		"compact",
		"comfortable",
		"default"
	].includes(props.density)) errors.push(`Invalid density: ${String(props.density)}`);
	const colorError = validateColorProp(props.color);
	if (colorError) errors.push(colorError);
	if (props.variant && ![
		"flat",
		"elevated",
		"outlined"
	].includes(props.variant)) errors.push(`Invalid variant: ${String(props.variant)}`);
	return errors;
}

//#endregion
//#region src/components/nav/nav-core.ts
/**
* `MonoNavCore` — every render-mode-agnostic concern for `mono-nav`:
* reactive props, the `css-class`/`cssclass` hybrid aliases, attribute
* observation, layout-var side effects, and the chrome `render()`.
*
* What it deliberately does NOT decide:
*  - `createRenderRoot()` (light vs shadow) — set by each wrapper.
*  - how styles apply (global sheet vs `static styles`) — set by each wrapper.
*  - the slot strategy — `renderSlot()` is a hook each wrapper overrides
*    (light: empty, nodes are captured/placed; shadow: native `<slot>`).
*/
const MonoNavCore = (superClass) => {
	class MonoNavCoreClass extends superClass {
		constructor(...args) {
			super(...args);
			this.density = "comfortable";
			this.color = "surface";
			this.variant = "elevated";
			this.sticky = true;
			this.extension = false;
			this.cssClass = {};
			this.cssClassName = "";
			defineCssClassAliases(this, (value) => this._setCssClass(value));
		}
		static get observedAttributes() {
			return [
				...super.observedAttributes ?? [],
				"css-class",
				"cssclass"
			];
		}
		attributeChangedCallback(name, oldValue, newValue) {
			super.attributeChangedCallback(name, oldValue, newValue);
			if (oldValue === newValue) return;
			if (name === "css-class" || name === "cssclass") this._setCssClass(newValue);
		}
		connectedCallback() {
			super.connectedCallback();
			this._writeLayoutVar();
		}
		disconnectedCallback() {
			super.disconnectedCallback();
			this._clearLayoutVar();
		}
		willUpdate(changed) {
			if (changed.has("density") && this.isConnected) this._writeLayoutVar();
			super.willUpdate?.(changed);
		}
		_setCssClass(value) {
			applyCssClass(this, value);
		}
		_cls(base, key) {
			return cssPart(this.cssClass, base, key);
		}
		get _rootClasses() {
			return generateNavRootClasses({
				density: this.density,
				color: this.color,
				variant: this.variant,
				sticky: this.sticky,
				extension: this.extension,
				cssClassName: this.cssClassName,
				rootExtra: this.cssClass?.root
			});
		}
		/**
		* Resolved bar height in pixels. Includes the extension row when enabled.
		* Public so consumers can size their main content imperatively if they
		* prefer JS over the `--mono-nav-height` CSS variable.
		*/
		getHeight() {
			const base = getNavHeight(this.density);
			if (!this.extension) return base;
			return base + (this.density === "compact" ? 36 : this.density === "default" ? 48 : 44);
		}
		/**
		* `--mono-nav-height` is a DOCUMENT-level property, so every mounted nav writes
		* the same one. Claiming it through the shared refcount means unmounting one nav
		* no longer blanks the height for a nav that is still on screen — which is what
		* a route transition that mounts the new nav before unmounting the old one does.
		* See `composables/layout-var.ts`; `mono-sidebar` had the identical bug.
		*/
		_writeLayoutVar() {
			if (typeof document === "undefined") return;
			claimLayoutVar("--mono-nav-height", this, `${this.getHeight()}px`);
		}
		_clearLayoutVar() {
			if (typeof document === "undefined") return;
			releaseLayoutVar("--mono-nav-height", this);
		}
		/**
		* Per-region slot content. Overridden by each build:
		*  - light DOM: returns nothing — children are captured and appended into
		*    the `[data-mono-slot]` targets imperatively.
		*  - shadow DOM: returns a native `<slot>` (unnamed for `default`).
		*/
		renderSlot(_slotName) {
			return html``;
		}
		/**
		
		* Carries a literal `color` (`#7c3aed`, `rgb(…)`) that no stylesheet can know about.
		* Empty for a palette slot, which resolves entirely through the `.mono-nav.<token>`
		* rules instead.
		*
		* Must land on the ROOT element, not the host: a class-based `-preset` declared on
		* the root beats an inherited one, so a host-level write would silently lose. If a
		* `_syncRootFromState`-style attribute re-assert is ever added here (sidebar has one),
		* it has to serialize from THIS getter or it will wipe the colour.
		*/
		get _inlineRootStyle() {
			const raw = isThemeColorToken(this.color) || this.color === "surface" ? "" : this.color;
			return customColorStyle(raw, "nav");
		}
		/**
		* The Basecoat styling attributes, mirroring the props one for one. A prop
		* at its DEFAULT emits nothing — `:not([mono-density])` is comfortable,
		* `:not([mono-color])` is surface, `:not([mono-variant])` is elevated —
		* so the rendered DOM is also the shortest hand-written markup that paints
		* the same (see nav.css).
		*
		* `sticky` is the exception: it defaults to TRUE, so it is the negative
		* that carries information and `mono-static` is what a non-sticky bar says.
		*/
		get _densityAttr() {
			return this.density === "comfortable" ? nothing : this.density;
		}
		/** A literal colour cannot be an attribute VALUE any more than it could be a
		*  class token, so it collapses to the same `custom` marker and the colour
		*  itself arrives inline (see `_inlineRootStyle`). */
		get _colorAttr() {
			if (!this.color || this.color === "surface") return nothing;
			return isThemeColorToken(this.color) ? this.color : CUSTOM_COLOR_CLASS;
		}
		get _variantAttr() {
			return this.variant === "elevated" ? nothing : this.variant;
		}
		render() {
			return html`
        <header
          class=${this._rootClasses}
          style=${this._inlineRootStyle}
          role="banner"
          mono-nav
          mono-density=${this._densityAttr}
          mono-color=${this._colorAttr}
          mono-variant=${this._variantAttr}
          ?mono-static=${!this.sticky}
          ?mono-has-extension=${this.extension}
        >
          <div class=${this._cls("mono-nav-inner", "inner")} mono-inner>
            <div class=${this._cls("mono-nav-start", "start")} mono-start data-mono-slot="start">${this.renderSlot("start")}</div>
            <div class=${this._cls("mono-nav-center", "center")} mono-center data-mono-slot="default">${this.renderSlot("default")}</div>
            <div class=${this._cls("mono-nav-end", "end")} mono-end data-mono-slot="end">${this.renderSlot("end")}</div>
          </div>
          <div class=${this._cls("mono-nav-extension", "extension")} mono-extension data-mono-slot="extension">${this.renderSlot("extension")}</div>
        </header>
      `;
		}
	}
	__decorate([property({ type: String })], MonoNavCoreClass.prototype, "density", void 0);
	__decorate([property({ type: String })], MonoNavCoreClass.prototype, "color", void 0);
	__decorate([property({ type: String })], MonoNavCoreClass.prototype, "variant", void 0);
	__decorate([property({
		reflect: true,
		converter: booleanStringConverter
	})], MonoNavCoreClass.prototype, "sticky", void 0);
	__decorate([property({
		reflect: true,
		converter: booleanStringConverter
	})], MonoNavCoreClass.prototype, "extension", void 0);
	__decorate([property({ attribute: false })], MonoNavCoreClass.prototype, "cssClass", void 0);
	__decorate([property({ attribute: false })], MonoNavCoreClass.prototype, "cssClassName", void 0);
	return MonoNavCoreClass;
};

//#endregion
//#region src/components/nav/mono-nav.ts
let MonoNav = class MonoNav extends MonoNavCore(LitElement) {
	constructor(..._args) {
		super(..._args);
		this._slotsCaptured = false;
		this._slotNodes = /* @__PURE__ */ new Map();
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
	/**
	* Pull every direct child into one of four buckets:
	*  - `slot="start"`  → start
	*  - `slot="end"`    → end
	*  - `slot="extension"` → extension
	*  - everything else (no slot attr) → default (center)
	*
	* Captured nodes are removed from the host root and re-inserted into the
	* matching `[data-mono-slot]` target during `updated()`.
	*/
	_captureSlots() {
		if (this._slotsCaptured) return;
		this._slotsCaptured = true;
		const captured = monoHostChildNodes(this);
		const toRemove = /* @__PURE__ */ new Set();
		for (const node of captured) {
			let slotName = "default";
			if (node instanceof Element) {
				const explicit = node.getAttribute("slot");
				if (explicit === "start" || explicit === "end" || explicit === "extension") {
					slotName = explicit;
					node.removeAttribute("slot");
				}
			} else if (node.nodeType === Node.TEXT_NODE) {
				if (!(node.textContent ?? "").trim()) continue;
			} else if (node.nodeType === Node.COMMENT_NODE) continue;
			const list = this._slotNodes.get(slotName) ?? [];
			list.push(node);
			this._slotNodes.set(slotName, list);
			toRemove.add(node);
		}
		for (const node of toRemove) if (node.parentNode === this) this.removeChild(node);
		guardHostTextContent(this, this._slotNodes, { onWrite: () => this.requestUpdate() });
	}
	_placeSlots() {
		if (!this._slotNodes.size) return;
		for (const [slotName, nodes] of this._slotNodes) {
			const target = this.querySelector(`[data-mono-slot="${slotName}"]`);
			if (!target) continue;
			for (const node of nodes) placeSlotNode(target, node);
		}
	}
};
__decorate([state()], MonoNav.prototype, "_slotsCaptured", void 0);
MonoNav = __decorate([customElement("mono-nav")], MonoNav);

//#endregion
export { MonoNav, generateNavRootClasses, getNavHeight, validateNavProps };