import { t as applyProps } from "../element-props-CLB6yvbm.js";
import { t as customElement } from "../mono-element-B0kP_96P.js";
import { a as defineHybridPropAliases, o as numberStringConverter, r as booleanStringConverter, t as __decorate } from "../decorate-DEXtNagw.js";
import { t as dispatchMonoEvent } from "../mono-event-Bi1qP9uN.js";
import { a as rateLimitHasChanged } from "../rate-limit-BBa2PO79.js";
import { n as button_default } from "../mono-button-CoVnBLav.js";
import { t as PopupPortalController } from "../popup-portal-BziRX1yG.js";
import { LitElement, html, isServer, nothing, unsafeCSS } from "lit";
import { ref } from "lit/directives/ref.js";
import { property, state } from "lit/decorators.js";
import { repeat } from "lit/directives/repeat.js";
//#region src/components/button/button-dropdown-core.ts
/**
* Would these two entry lists RENDER identically?
*
* Function-valued fields are skipped: a consumer rebuilds `onClick` on every render
* so it closes over the current row, and those handlers are resolved at click time
* rather than baked into the DOM, so they cannot make the output differ. Everything
* else — label, icon, size, color, variant, disabled — is compared strictly, and any
* non-primitive field (a fresh `cssClass` object, say) simply compares unequal and
* falls back to a normal update. Conservative by construction: a false "same" would
* show stale markup, a false "different" only costs the render we have today.
*/
function sameButtonItems(a, b) {
	if (a === b) return true;
	if (!Array.isArray(a) || !Array.isArray(b) || a.length !== b.length) return false;
	for (let i = 0; i < a.length; i++) {
		const x = a[i];
		const y = b[i];
		if (x === y) continue;
		if (!x || !y || typeof x !== "object" || typeof y !== "object") return false;
		const keys = Object.keys(x);
		if (keys.length !== Object.keys(y).length) return false;
		for (const key of keys) {
			const xv = x[key];
			const yv = y[key];
			if (typeof xv === "function" && typeof yv === "function") continue;
			if (xv !== yv) return false;
		}
	}
	return true;
}
/**
* `MonoButtonDropdownCore` — everything render-mode-agnostic for
* `mono-button-dropdown`.
*
* The behaviour in one line: **while `buttons.length <= min` the entries render
* as plain buttons; past that they ALL move into a dropdown and only the trigger
* is left.** That all-or-nothing rule is deliberate (it mirrors the Vuetify
* `ButtonMenu` this replaces) — a partial split would leave the row's width
* jumping around as the action list changes.
*
* Two pieces are borrowed rather than rebuilt:
* - **`PopupPortalController`** does the positioning, flipping and z-index
*   stacking, exactly as `mono-dropdown` uses it, so this panel ranks correctly
*   against modals and other popups.
* - **Each entry is a real `<mono-button>`**, so every `ButtonProps` — `loading`,
*   `throttle`, `handler`, `badge` — keeps working with nothing re-implemented.
*   Props are pushed on with `applyProps` rather than a fixed attribute list, so
*   a prop added to the button later flows through without touching this file.
*/
/**
* The component's PUBLIC custom properties, handed to the popup portal so a
* relocated panel keeps overrides an ancestor of the host set — a portaled panel
* is a child of `<body>`, so it inherits none of them, and `getComputedStyle`
* cannot enumerate custom properties for the portal to copy them blindly.
*
* Kept in step with button-dropdown.css by tests/button-dropdown-attributes.test.ts.
*/
var BUTTON_DROPDOWN_STYLE_VARS = [
	"--mono-button-dropdown-bg",
	"--mono-button-dropdown-border",
	"--mono-button-dropdown-dark",
	"--mono-button-dropdown-danger",
	"--mono-button-dropdown-gap",
	"--mono-button-dropdown-info",
	"--mono-button-dropdown-item-base-color",
	"--mono-button-dropdown-item-base-hover-bg",
	"--mono-button-dropdown-item-base-hover-color",
	"--mono-button-dropdown-item-color",
	"--mono-button-dropdown-item-font-weight",
	"--mono-button-dropdown-item-hover",
	"--mono-button-dropdown-item-hover-bg",
	"--mono-button-dropdown-item-hover-color",
	"--mono-button-dropdown-item-radius",
	"--mono-button-dropdown-item-radius-lg",
	"--mono-button-dropdown-item-radius-xl",
	"--mono-button-dropdown-item-radius-xxl",
	"--mono-button-dropdown-light",
	"--mono-button-dropdown-list-gap",
	"--mono-button-dropdown-min-width",
	"--mono-button-dropdown-min-width-lg",
	"--mono-button-dropdown-min-width-md",
	"--mono-button-dropdown-min-width-sm",
	"--mono-button-dropdown-min-width-xl",
	"--mono-button-dropdown-min-width-xs",
	"--mono-button-dropdown-min-width-xxl",
	"--mono-button-dropdown-offset",
	"--mono-button-dropdown-offset-lg",
	"--mono-button-dropdown-offset-md",
	"--mono-button-dropdown-offset-sm",
	"--mono-button-dropdown-offset-xl",
	"--mono-button-dropdown-offset-xs",
	"--mono-button-dropdown-offset-xxl",
	"--mono-button-dropdown-padding",
	"--mono-button-dropdown-padding-lg",
	"--mono-button-dropdown-padding-md",
	"--mono-button-dropdown-padding-sm",
	"--mono-button-dropdown-padding-xl",
	"--mono-button-dropdown-padding-xs",
	"--mono-button-dropdown-padding-xxl",
	"--mono-button-dropdown-primary",
	"--mono-button-dropdown-purple",
	"--mono-button-dropdown-radius",
	"--mono-button-dropdown-radius-lg",
	"--mono-button-dropdown-radius-md",
	"--mono-button-dropdown-radius-sm",
	"--mono-button-dropdown-radius-xl",
	"--mono-button-dropdown-radius-xs",
	"--mono-button-dropdown-radius-xxl",
	"--mono-button-dropdown-ring-color",
	"--mono-button-dropdown-ring-width",
	"--mono-button-dropdown-secondary",
	"--mono-button-dropdown-shadow",
	"--mono-button-dropdown-success",
	"--mono-button-dropdown-surface",
	"--mono-button-dropdown-teal",
	"--mono-button-dropdown-text",
	"--mono-button-dropdown-warning"
];
var MonoButtonDropdownCore = (superClass) => {
	class MonoButtonDropdownCoreClass extends superClass {
		constructor(...args) {
			super(...args);
			this._panelEl = null;
			this._triggerEl = null;
			this._popup = new PopupPortalController(this, {
				getPanel: () => this._panelEl,
				getAnchor: () => this._triggerEl,
				/**
				* The INNER wrapper, not the host — it's what carries
				* `.mono-button-dropdown`, and therefore the `--_mono-button-dropdown-*`
				* variables every panel rule reads. The portal mirrors this element's class
				* onto itself, so the relocated panel keeps inheriting them; pointing at the
				* host (which has no class) left the panel transparent and border-less,
				* since each value resolved to an undefined var.
				*/
				getStyleScope: () => this.renderRoot?.querySelector?.(".mono-button-dropdown"),
				isOpen: () => this.modelValue,
				side: () => this._side(),
				align: () => this._align(),
				offset: () => this.offset,
				styleVars: () => BUTTON_DROPDOWN_STYLE_VARS,
				flip: () => true,
				shift: () => true,
				onSideResolved: (side) => {
					if (this._resolvedSide !== side) this._resolvedSide = side;
				}
			});
			this._buttons = [];
			this.min = 1;
			this.placement = "bottom-end";
			this.offset = 4;
			this.modelValue = false;
			this.disabled = false;
			this.closeOnSelect = true;
			this.closeOnOutsideClick = true;
			this.closeOnEscape = true;
			this.cssClass = {};
			this._resolvedSide = "bottom";
			this._onDocumentClick = (event) => {
				if (!this.modelValue || !this.closeOnOutsideClick) return;
				const path = event.composedPath();
				if (path.includes(this) || this._popup.containsInPath(path)) return;
				this._setOpen(false, "outside", event);
			};
			this._onDocumentKeydown = (event) => {
				if (!this.modelValue) return;
				if (event.key === "Escape" && this.closeOnEscape) {
					this._setOpen(false, "escape", event);
					this._focusTrigger();
					return;
				}
				if (event.key === "ArrowDown" || event.key === "ArrowUp") {
					const rows = this._menuButtons();
					if (!rows.length) return;
					event.preventDefault();
					rows[(rows.findIndex((b) => b === document.activeElement || b.contains(document.activeElement)) + (event.key === "ArrowDown" ? 1 : -1) + rows.length) % rows.length]?.focus?.();
				}
			};
			this._itemEls = /* @__PURE__ */ new Map();
			this._itemParts = /* @__PURE__ */ new Map();
			this.bindPanel = (el) => {
				this._panelEl = el ?? null;
			};
			this._rootEl = null;
			this.bindRoot = (el) => {
				this._rootEl = el ?? null;
				this._applyRootAttrs(this._rootEl);
			};
			defineHybridPropAliases(this, [
				"modelValue",
				"closeOnSelect",
				"closeOnOutsideClick",
				"closeOnEscape",
				"cssClass",
				"cssClassName"
			]);
		}
		/**
		* Entries for this dropdown.
		*
		* `noAccessor` because assignment does two things, only one of which is an
		* update. Building a fresh array on every render is the NORMAL shape whenever an
		* entry's `onClick` closes over the current row — and with one dropdown per table
		* row that means an unrelated re-render (a filter panel opening, say) hands N
		* dropdowns a brand-new array and re-renders all of them. Measured on a 2000-row
		* table: 737ms of blocked main thread per toggle, against 60ms when the array
		* identity happened to be stable. Nothing about the RENDER differed.
		*
		* So: compare by content and skip the update when it is equivalent. Handlers are
		* excluded from that comparison deliberately — they are rebuilt every render by
		* design and are resolved at CLICK time from `_itemParts`, never captured in the
		* listener closure (see `_itemElement`). That is also why `_retargetItemParts()`
		* has to run on EVERY assignment including a skipped one: `_itemParts` is
		* normally refreshed during render, so without it a suppressed update would
		* leave the cached entries pointing at the previous array's closures and a click
		* would fire the wrong row's handler.
		*/
		get buttons() {
			return this._buttons;
		}
		set buttons(next) {
			const previous = this._buttons;
			this._buttons = next ?? [];
			this._retargetItemParts();
			if (!sameButtonItems(previous, this._buttons)) this.requestUpdate("buttons", previous);
		}
		/**
		* Point the cached entry elements at the CURRENT array without rendering, so a
		* click resolves this render's `item`/`index` even when the update was skipped.
		*/
		_retargetItemParts() {
			if (!this._itemParts?.size) return;
			for (const [key, state] of this._itemParts) {
				const index = Number(key.slice(2));
				const item = this._buttons[index];
				if (item) this._itemParts.set(key, {
					...state,
					item,
					index
				});
			}
		}
		connectedCallback() {
			super.connectedCallback();
			if (isServer) return;
			document.addEventListener("click", this._onDocumentClick, true);
			document.addEventListener("keydown", this._onDocumentKeydown);
		}
		disconnectedCallback() {
			if (!isServer) {
				document.removeEventListener("click", this._onDocumentClick, true);
				document.removeEventListener("keydown", this._onDocumentKeydown);
			}
			super.disconnectedCallback();
		}
		/** Entries are behind the trigger once there are more of them than `min`. */
		get collapsed() {
			return (this.buttons?.length ?? 0) > Math.max(0, this.min ?? 1);
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
		_setOpen(next, source, sourceEvent) {
			if (this.disabled && next) return;
			if (this.modelValue === next) return;
			this.modelValue = next;
			const detail = {
				modelValue: next,
				collapsed: this.collapsed,
				source,
				sourceEvent
			};
			dispatchMonoEvent(this, next ? "open" : "close", detail);
		}
		/** The rendered entry buttons inside the open panel, in order. */
		_menuButtons() {
			return this._panelEl ? Array.from(this._panelEl.querySelectorAll("[data-mono-bd-item]")) : [];
		}
		_focusTrigger() {
			this._triggerEl?.focus?.();
		}
		_side() {
			return this.placement?.split("-")[0] ?? "bottom";
		}
		_align() {
			const part = this.placement?.split("-")[1];
			return part === "start" || part === "end" ? part : "center";
		}
		/** Light renders `mono-button`; the shadow build overrides with its own tag. */
		_buttonTag() {
			return "mono-button";
		}
		/**
		* Whether entry content can be written as a Lit template.
		*
		* **It can't for the light build.** A light `<mono-button>` CAPTURES its
		* children in `connectedCallback` and relocates them into its own
		* `[data-mono-slot]` targets — including nodes our template rendered into it.
		* That ejects this element's part markers, and the next render dies with
		* "this `ChildPart` has no `parentNode`". So the light build hands Lit a
		* fully-built element instead (see `_itemElement`), leaving Lit no parts
		* inside the button to lose.
		*
		* The shadow build has no such problem: it projects through a native
		* `<slot>`, moves nothing, and stays SSR-safe.
		*/
		_declarativeItems() {
			return false;
		}
		updated(changed) {
			super.updated?.(changed);
			this._applyRootAttrs(this._rootEl);
		}
		willUpdate(changed) {
			if (changed.has("buttons")) this._pruneItemCache();
			super.willUpdate?.(changed);
		}
		/** Forget cached entries whose index no longer exists in `buttons`. */
		_pruneItemCache() {
			const len = this.buttons?.length ?? 0;
			for (const key of [...this._itemEls.keys()]) {
				const index = Number(key.slice(2));
				if (!Number.isFinite(index) || index >= len) {
					this._itemEls.delete(key);
					this._itemParts.delete(key);
				}
			}
		}
		/** Build (or update) the real element for one entry. */
		_itemElement(item, index, inMenu, opts) {
			const key = `${inMenu ? "m" : "r"}:${index}`;
			let el = this._itemEls.get(key);
			const prev = this._itemParts.get(key);
			if (el && prev && (prev.label !== item.label || prev.icon !== item.icon)) {
				this._itemEls.delete(key);
				el = void 0;
			}
			if (!el) {
				el = document.createElement(this._buttonTag());
				el.setAttribute("data-mono-bd-item", "");
				if (item.icon) {
					const icon = document.createElement("span");
					icon.setAttribute("slot", "icon");
					icon.className = `mono-icon ${item.icon}`;
					el.appendChild(icon);
				}
				if (item.label) el.appendChild(document.createTextNode(item.label));
				el.addEventListener("click", ((event) => {
					const state = this._itemParts.get(key);
					if (state) this._onItemClick(state.item, state.index, event);
				}));
				el.addEventListener("mno-click", (e) => e.stopPropagation());
				el.addEventListener("mnoClick", (e) => e.stopPropagation());
				this._itemEls.set(key, el);
			}
			this._itemParts.set(key, {
				label: item.label,
				icon: item.icon,
				item,
				index
			});
			el.className = opts.cls;
			this._applyItem(el, item);
			return el;
		}
		_cls(base, key) {
			const extra = this.cssClass?.[key];
			return extra ? `${base} ${extra}` : base;
		}
		/**
		* Push an entry's props onto its rendered `<mono-button>`.
		*
		* Done imperatively via a Lit ref callback rather than as template
		* attributes: object/function props (`handler`, `cssClass`, `throttle`) can't
		* cross as attributes, and going through `applyProps` means any prop the
		* button gains later works here with no change.
		*/
		_applyItem(el, item) {
			if (!el) return;
			const { label: _l, icon: _i, onClick: _c, className: _n, ...rest } = item;
			applyProps(el, rest);
			if (this.disabled) el.disabled = true;
		}
		_onItemClick(item, index, event) {
			if (item.disabled || this.disabled) return;
			item.onClick?.(event);
			dispatchMonoEvent(this, "click", {
				item,
				index,
				modelValue: this.modelValue,
				collapsed: this.collapsed,
				source: "trigger",
				sourceEvent: event
			});
			if (this.collapsed && this.closeOnSelect) this._setOpen(false, "manual", event);
		}
		/** One entry, as a real button element carrying its own props. */
		renderItem(item, index, inMenu) {
			const tag = this._buttonTag();
			const cls = [
				inMenu ? "mono-button-dropdown-item-btn" : "mono-button-dropdown-row-btn",
				inMenu && item.color ? `mono-bd-c-${item.color}` : "",
				item.className ?? ""
			].filter(Boolean).join(" ");
			const content = html`
        ${item.icon ? html`<span slot="icon" class="mono-icon ${item.icon}"></span>` : nothing}
        ${item.label ?? nothing}
      `;
			const onClick = (e) => this._onItemClick(item, index, e);
			if (!this._declarativeItems()) return this._itemElement(item, index, inMenu, {
				cls,
				onClick
			});
			const bind = (el) => this._applyItem(el, item);
			const stop = (e) => e.stopPropagation();
			return tag === "mono-button" ? html`<mono-button
            class=${cls}
            data-mono-bd-item
            ${ref(bind)}
            @click=${onClick}
            @mno-click=${stop}
            @mnoClick=${stop}
            >${content}</mono-button
          >` : html`<mono-shadow-button
            class=${cls}
            data-mono-bd-item
            ${ref(bind)}
            @click=${onClick}
            @mno-click=${stop}
            @mnoClick=${stop}
            >${content}</mono-shadow-button
          >`;
		}
		/** The inline row — every entry as a plain button, no dropdown involved. */
		renderRow() {
			return html`
        <div class=${this._cls("mono-button-dropdown-row", "row")} mono-row ?hidden=${this.collapsed}>
          ${this.collapsed ? nothing : repeat(this.buttons ?? [], (_item, i) => i, (item, i) => this.renderItem(item, i, false))}
        </div>
      `;
		}
		/** Class + state for the panel, which each build writes into its own template. */
		get panelClass() {
			return this._cls("mono-button-dropdown-panel", "panel");
		}
		get panelHidden() {
			return !this.collapsed || !this.modelValue;
		}
		/**
		* The prop mirrors, each omitted at its default so `:not([mono-size])` means
		* "md" for hand-written markup exactly as it does for the element.
		*/
		_computeRootAttrs() {
			const align = this._align();
			const side = this.modelValue ? this._resolvedSide : this._side();
			return {
				"mono-size": !this.size || this.size === "md" ? null : this.size,
				"mono-color": !this.color || this.color === "primary" ? null : this.color,
				"mono-variant": !this.variant || this.variant === "solid" ? null : this.variant,
				"mono-rounded": this.rounded ?? null,
				"mono-placement": this.placement === "bottom-end" ? null : this.placement,
				"mono-side": side === "bottom" ? null : side,
				"mono-align": align === "end" ? null : align,
				"mono-open": this.modelValue ? "" : null,
				"mono-collapsed": this.collapsed ? "" : null,
				"mono-disabled": this.disabled ? "" : null,
				"mono-fixed": this._positionsPanel() ? "" : null
			};
		}
		/** Does this build measure and place the panel itself? (light only — see above.) */
		_positionsPanel() {
			return !isServer && this.renderRoot === this;
		}
		_applyRootAttrs(root) {
			if (!root) return;
			if (!root.hasAttribute("mono-button-dropdown")) root.setAttribute("mono-button-dropdown", "");
			for (const [name, value] of Object.entries(this._computeRootAttrs())) if (value === null) root.removeAttribute(name);
			else if (root.getAttribute(name) !== value) root.setAttribute(name, value);
		}
		/**
		* An entry's `color` inside the menu.
		*
		* It is NOT a button colour in there (see button-dropdown.css): the row takes
		* the role as its INK and a 10%/20% wash of it on hover, the way Basecoat
		* treats `[data-variant='destructive']`. `primary` is written out rather
		* than dropped as a default, because the panel's own ink is the popover
		* foreground, not the primary role.
		*/
		_itemColorAttr(item) {
			return item.color ?? null;
		}
		/** The menu rows. Lives INSIDE the panel, so these parts travel with it. */
		renderMenuList() {
			return html`
        <ul class=${this._cls("mono-button-dropdown-list", "list")} mono-list>
          ${this.collapsed ? repeat(this.buttons ?? [], (_item, i) => i, (item, i) => html`
                  <li
                    class=${this._cls("mono-button-dropdown-item", "item")}
                    mono-item
                    mono-item-color=${this._itemColorAttr(item) ?? nothing}
                    role="none"
                  >
                    ${this.renderItem(item, i, true)}
                  </li>
                `) : nothing}
        </ul>
      `;
		}
		/** The `⋮` trigger. `nothing` while the entries are inline. */
		renderTrigger() {
			if (!this.collapsed) return nothing;
			return this._renderTriggerButton();
		}
		_renderTriggerButton() {
			const t = {
				...this.color ? { color: this.color } : {},
				...this.variant ? { variant: this.variant } : {},
				...this.size ? { size: this.size } : {},
				...this.rounded ? { rounded: this.rounded } : {},
				...this.trigger ?? {}
			};
			const tag = this._buttonTag();
			const triggerCls = this._cls("mono-button-dropdown-trigger", "trigger");
			const bindTrigger = (el) => {
				this._triggerEl = el ?? null;
				if (!el) return;
				const { label: _l, icon: _i, ...rest } = t;
				applyProps(el, rest);
				if (this.disabled) el.disabled = true;
			};
			const stop = (e) => e.stopPropagation();
			const onTrigger = (e) => {
				e.stopPropagation();
				this.toggle("trigger");
			};
			if (!this._declarativeItems()) {
				let el = this._itemEls.get("trigger");
				if (!el) {
					el = document.createElement(tag);
					el.setAttribute("mono-trigger", "");
					const icon = document.createElement("span");
					icon.setAttribute("slot", "icon");
					icon.className = `mono-icon ${t.icon ?? "i-mdi-dots-vertical"}`;
					el.appendChild(icon);
					if (t.label) el.appendChild(document.createTextNode(t.label));
					if (!t.label) el.setAttribute("icon-only", "true");
					el.addEventListener("click", onTrigger);
					el.addEventListener("mno-click", stop);
					el.addEventListener("mnoClick", stop);
					this._itemEls.set("trigger", el);
				}
				el.className = triggerCls;
				bindTrigger(el);
				return el;
			}
			const triggerContent = html`
        <span slot="icon" class="mono-icon ${t.icon ?? "i-mdi-dots-vertical"}"></span>
        ${t.label ?? nothing}
      `;
			return tag === "mono-button" ? html`<mono-button
              class=${triggerCls}
              mono-trigger
              icon-only=${t.label ? nothing : "true"}
              ${ref(bindTrigger)}
              @click=${onTrigger}
              @mno-click=${stop}
              @mnoClick=${stop}
              >${triggerContent}</mono-button
            >` : html`<mono-shadow-button
              class=${triggerCls}
              mono-trigger
              icon-only=${t.label ? nothing : "true"}
              ${ref(bindTrigger)}
              @click=${onTrigger}
              @mno-click=${stop}
              @mnoClick=${stop}
              >${triggerContent}</mono-shadow-button
            >`;
		}
	}
	__decorate([property({
		attribute: false,
		noAccessor: true
	})], MonoButtonDropdownCoreClass.prototype, "buttons", null);
	__decorate([property({ converter: numberStringConverter })], MonoButtonDropdownCoreClass.prototype, "min", void 0);
	__decorate([property({ type: String })], MonoButtonDropdownCoreClass.prototype, "placement", void 0);
	__decorate([property({ converter: numberStringConverter })], MonoButtonDropdownCoreClass.prototype, "offset", void 0);
	__decorate([property({ type: String })], MonoButtonDropdownCoreClass.prototype, "color", void 0);
	__decorate([property({ type: String })], MonoButtonDropdownCoreClass.prototype, "variant", void 0);
	__decorate([property({ type: String })], MonoButtonDropdownCoreClass.prototype, "size", void 0);
	__decorate([property({ type: String })], MonoButtonDropdownCoreClass.prototype, "rounded", void 0);
	__decorate([property({
		attribute: false,
		hasChanged: rateLimitHasChanged
	})], MonoButtonDropdownCoreClass.prototype, "trigger", void 0);
	__decorate([property({
		attribute: "model-value",
		reflect: true,
		converter: booleanStringConverter
	})], MonoButtonDropdownCoreClass.prototype, "modelValue", void 0);
	__decorate([property({
		reflect: true,
		converter: booleanStringConverter
	})], MonoButtonDropdownCoreClass.prototype, "disabled", void 0);
	__decorate([property({
		attribute: "close-on-select",
		converter: booleanStringConverter
	})], MonoButtonDropdownCoreClass.prototype, "closeOnSelect", void 0);
	__decorate([property({
		attribute: "close-on-outside-click",
		converter: booleanStringConverter
	})], MonoButtonDropdownCoreClass.prototype, "closeOnOutsideClick", void 0);
	__decorate([property({
		attribute: "close-on-escape",
		converter: booleanStringConverter
	})], MonoButtonDropdownCoreClass.prototype, "closeOnEscape", void 0);
	__decorate([property({ attribute: false })], MonoButtonDropdownCoreClass.prototype, "cssClass", void 0);
	__decorate([state()], MonoButtonDropdownCoreClass.prototype, "_resolvedSide", void 0);
	return MonoButtonDropdownCoreClass;
};
//#endregion
//#region src/components/button/button-dropdown.css?raw
var button_dropdown_default = "/* =========================================================================\r\n   mono-button-dropdown — a port of Basecoat's `.dropdown-menu`\r\n   (basecoat-css@1.0.2, vega style).\r\n\r\n   Styled by ATTRIBUTE, like Basecoat — and the attributes mirror the element's\r\n   props one for one, so hand-written markup reads like the Lit / Vue tag:\r\n\r\n     <mono-button-dropdown size=\"sm\" placement=\"bottom-end\" model-value>\r\n     <div mono-button-dropdown mono-size=\"sm\" mono-side=\"bottom\" mono-align=\"end\" mono-open>\r\n       <div mono-row hidden></div>\r\n       <div mono-button mono-trigger mono-icon-only>…the ⋮ button…</div>\r\n       <div mono-panel role=\"menu\" aria-hidden=\"false\">\r\n         <ul mono-list>\r\n           <li mono-item role=\"none\" mono-item-color=\"success\">\r\n             <div mono-button>…a real button…</div>\r\n           </li>\r\n         </ul>\r\n       </div>\r\n     </div>\r\n\r\n   An absent attribute is the prop's default (`:not([mono-size])` = md, no\r\n   `mono-side` = bottom, no `mono-align` = start, no `mono-item-color` = the\r\n   panel's own ink). The element writes them on the inner root in BOTH builds;\r\n   the old classes (`.mono-button-dropdown-panel`, `.mono-bd-c-danger`) are still\r\n   emitted as inert hooks until 2.0 but no rule here reads them.\r\n\r\n   Selector map (ours ≡ upstream):\r\n     [mono-button-dropdown]          ≡ .dropdown-menu (relative inline-flex)\r\n     [mono-row]                      ≡ EXTENSION (the INLINE row — upstream has\r\n                                       no \"stay flat while short\" mode)\r\n     [mono-trigger]                  ≡ .dropdown-menu > button (a real mono-button,\r\n                                       styled by button.css — nothing to add here)\r\n     [mono-panel]                    ≡ .dropdown-menu > [data-popover]\r\n                                       (bg-popover text-popover-foreground\r\n                                        ring-1 ring-foreground/10 gap-0 rounded-md\r\n                                        p-1 shadow-md overflow-x-hidden\r\n                                        overflow-y-auto duration-100)\r\n     [mono-list]                     ≡ [role='menu'] (outline-hidden)\r\n     [mono-item]                     ≡ [role='menuitem'] (gap-2 rounded-sm px-2\r\n                                       py-1.5 text-sm, hover bg-accent\r\n                                       text-accent-foreground)\r\n     [mono-item][mono-item-color=…]  ≡ .dropdown-menu [data-variant='destructive']\r\n                                       (text-destructive, hover bg-destructive/10,\r\n                                        dark /20) — generalised to all ten roles\r\n     [mono-side] / [mono-align]      ≡ [data-popover][data-side] / [data-align]\r\n     [mono-size=\"…\"]                 ≡ EXTENSION (upstream ships one menu size)\r\n\r\n   THE ROW IS A REAL BUTTON. Each entry renders as a `<mono-button>`, so the\r\n   menu cannot paint it with a selector — in the shadow build the control sits\r\n   behind a boundary. It is flattened with the button's own PUBLIC knobs, set on\r\n   the `<li mono-item>`: custom properties inherit, so one declaration reaches\r\n   both builds. `--mono-button-width` / `-justify` exist for exactly this.\r\n\r\n   COLOUR: an entry's `color` is NOT a button colour in here — a row of solid,\r\n   outlined and tonal buttons reads as noise rather than a list. It is the\r\n   Basecoat `[data-variant='destructive']` treatment generalised: the row's INK\r\n   (label and glyph alike, the glyph being a `currentColor` mask) becomes the\r\n   role, and hover lays that role down at `--mono-mode-tint` (10% light / 20%\r\n   dark). Never the role as a solid fill — a full-strength background under a\r\n   full-strength glyph is the one combination that makes the glyph vanish.\r\n\r\n   THE PANEL IS PORTALED in the light build: `composables/popup-portal` moves it\r\n   into a `<body>` portal and mirrors the root's class AND `mono-*` attributes\r\n   onto that portal, so `[mono-button-dropdown] > [mono-panel]` keeps matching.\r\n   Every panel rule is therefore written as a CHILD of the root, and every public\r\n   knob it reads is listed in `BUTTON_DROPDOWN_STYLE_VARS` (button-dropdown-core)\r\n   so an ancestor's override travels with it.\r\n\r\n   Specificity contract: a part's RESTING rule is exactly one attribute strong —\r\n   `:where([mono-button-dropdown]) > [mono-panel]` = (0,1,0) — so a utility class\r\n   handed in through `cssClass` wins by source order, while the prop and state\r\n   rules stay heavier.\r\n\r\n   FLAVORS set `--mono-button-dropdown-{radius,padding,min-width,offset,shadow,\r\n   ring-*,item-radius,item-font-weight}` (+ the per-size forms); every fallback\r\n   here is vega's value\r\n   (`node scripts/basecoat-styles.mjs --varying \"dropdown-menu\"`).\r\n   ========================================================================= */\r\n\r\nmono-button-dropdown {\r\n  display: inline-flex;\r\n}\r\n\r\n/* =========================================\r\n   Root — layout and the palette\r\n   ========================================= */\r\n\r\n/* basecoat@1.0.2 components/dropdown-menu.css .dropdown-menu — relative inline-flex */\r\n[mono-button-dropdown] {\r\n  /* ── the ten entry roles, each a public knob over a Basecoat token ───────\r\n     `secondary`, `light` and `dark` are SURFACES upstream, and a surface makes\r\n     no ink: `--dark` is a near-black in light mode and STILL a dark grey in dark\r\n     mode (the role is a fill, paired with `--dark-foreground`), so inking a row\r\n     with it turns that row invisible on a dark popover. The three resolve to a\r\n     foreground instead, which flips with the mode. */\r\n  --_mono-bd-primary: var(--mono-button-dropdown-primary, var(--primary));\r\n  --_mono-bd-secondary: var(--mono-button-dropdown-secondary, var(--secondary-foreground));\r\n  --_mono-bd-success: var(--mono-button-dropdown-success, var(--success));\r\n  --_mono-bd-danger: var(--mono-button-dropdown-danger, var(--destructive));\r\n  --_mono-bd-warning: var(--mono-button-dropdown-warning, var(--warning));\r\n  --_mono-bd-info: var(--mono-button-dropdown-info, var(--info));\r\n  --_mono-bd-teal: var(--mono-button-dropdown-teal, var(--teal));\r\n  --_mono-bd-purple: var(--mono-button-dropdown-purple, var(--purple));\r\n  --_mono-bd-dark: var(--mono-button-dropdown-dark, var(--foreground));\r\n  --_mono-bd-light: var(--mono-button-dropdown-light, var(--foreground));\r\n\r\n  /* ── panel paint — `bg-popover text-popover-foreground ring-foreground/10` ── */\r\n  --_mono-bd-bg: var(--mono-button-dropdown-bg, var(--mono-button-dropdown-surface, var(--popover)));\r\n  --_mono-bd-text: var(--mono-button-dropdown-text, var(--popover-foreground));\r\n  --_mono-bd-ring-width: var(--mono-button-dropdown-ring-width, var(--mono-border-width));\r\n  --_mono-bd-ring-color: var(--mono-button-dropdown-ring-color, var(--mono-button-dropdown-border,\r\n    color-mix(in oklab, var(--foreground) 10%, transparent)));\r\n  --_mono-bd-shadow: var(--mono-button-dropdown-shadow, var(--mono-shadow-md));\r\n\r\n  /* ── md metrics live on the unqualified root ON PURPOSE ────────────────────\r\n     basecoat@1.0.2 styles/vega.css .dropdown-menu > [data-popover] — rounded-md p-1 gap-0 */\r\n  --_mono-bd-radius: var(--mono-button-dropdown-radius, var(--_mono-bd-radius-preset, var(--mono-button-dropdown-radius-md, var(--mono-radius-md))));\r\n  --_mono-bd-padding: var(--mono-button-dropdown-padding, var(--_mono-bd-padding-preset, var(--mono-button-dropdown-padding-md, var(--mono-spacing))));\r\n  --_mono-bd-list-gap: var(--mono-button-dropdown-list-gap, var(--_mono-bd-list-gap-preset, 0px));\r\n  /* DEVIATION: upstream is `min-width: anchor-size(width)` — the panel is at\r\n     least as wide as its trigger. Anchor positioning is not the mechanism here\r\n     (the panel is portaled and placed from measurements), so the floor is a\r\n     plain length; maia/luma/sera's `min-w-48` is the per-size knob. */\r\n  --_mono-bd-min-width: var(--mono-button-dropdown-min-width, var(--_mono-bd-min-width-preset, var(--mono-button-dropdown-min-width-md, 9rem)));\r\n  /* The static offset — the JS path uses the `offset` PROP; keep them in step. */\r\n  --_mono-bd-offset: var(--mono-button-dropdown-offset, var(--_mono-bd-offset-preset, var(--mono-button-dropdown-offset-md, var(--mono-spacing))));\r\n\r\n  /* ── the inline row (NOT the menu): the gap between loose buttons ───────── */\r\n  --_mono-bd-gap: var(--mono-button-dropdown-gap, calc(var(--mono-spacing) * 1.5));\r\n\r\n  position: relative;\r\n  display: inline-flex;\r\n  align-items: center;\r\n  box-sizing: border-box;\r\n  font-family: inherit;\r\n}\r\n\r\n[mono-button-dropdown] *,\r\n[mono-button-dropdown] *::before,\r\n[mono-button-dropdown] *::after {\r\n  box-sizing: border-box;\r\n}\r\n\r\n/* =========================================\r\n   Sizes — EXTENSION: Basecoat ships ONE menu; md is its `[data-popover]`\r\n   ========================================= */\r\n\r\n[mono-button-dropdown][mono-size=\"xs\"] {\r\n  --_mono-bd-radius-preset: var(--mono-button-dropdown-radius-xs, var(--mono-radius-sm));\r\n  --_mono-bd-padding-preset: var(--mono-button-dropdown-padding-xs, calc(var(--mono-spacing) * 0.5));\r\n  --_mono-bd-min-width-preset: var(--mono-button-dropdown-min-width-xs, 7rem);\r\n  --_mono-bd-offset-preset: var(--mono-button-dropdown-offset-xs, calc(var(--mono-spacing) * 0.75));\r\n}\r\n\r\n[mono-button-dropdown][mono-size=\"sm\"] {\r\n  --_mono-bd-radius-preset: var(--mono-button-dropdown-radius-sm, var(--mono-radius-md));\r\n  --_mono-bd-padding-preset: var(--mono-button-dropdown-padding-sm, calc(var(--mono-spacing) * 0.75));\r\n  --_mono-bd-min-width-preset: var(--mono-button-dropdown-min-width-sm, 8rem);\r\n  --_mono-bd-offset-preset: var(--mono-button-dropdown-offset-sm, var(--mono-spacing));\r\n}\r\n\r\n[mono-button-dropdown][mono-size=\"lg\"] {\r\n  --_mono-bd-radius-preset: var(--mono-button-dropdown-radius-lg, var(--mono-radius-lg));\r\n  --_mono-bd-padding-preset: var(--mono-button-dropdown-padding-lg, calc(var(--mono-spacing) * 1.5));\r\n  --_mono-bd-min-width-preset: var(--mono-button-dropdown-min-width-lg, 11rem);\r\n  --_mono-bd-offset-preset: var(--mono-button-dropdown-offset-lg, calc(var(--mono-spacing) * 1.5));\r\n  --_mono-bd-item-radius-preset: var(--mono-button-dropdown-item-radius-lg, var(--mono-radius-md));\r\n}\r\n\r\n[mono-button-dropdown][mono-size=\"xl\"] {\r\n  --_mono-bd-radius-preset: var(--mono-button-dropdown-radius-xl, var(--mono-radius-xl));\r\n  --_mono-bd-padding-preset: var(--mono-button-dropdown-padding-xl, calc(var(--mono-spacing) * 2));\r\n  --_mono-bd-min-width-preset: var(--mono-button-dropdown-min-width-xl, 13rem);\r\n  --_mono-bd-offset-preset: var(--mono-button-dropdown-offset-xl, calc(var(--mono-spacing) * 2));\r\n  --_mono-bd-item-radius-preset: var(--mono-button-dropdown-item-radius-xl, var(--mono-radius-md));\r\n}\r\n\r\n[mono-button-dropdown][mono-size=\"xxl\"] {\r\n  --_mono-bd-radius-preset: var(--mono-button-dropdown-radius-xxl, var(--mono-radius-xl));\r\n  --_mono-bd-padding-preset: var(--mono-button-dropdown-padding-xxl, calc(var(--mono-spacing) * 2.5));\r\n  --_mono-bd-min-width-preset: var(--mono-button-dropdown-min-width-xxl, 15rem);\r\n  --_mono-bd-offset-preset: var(--mono-button-dropdown-offset-xxl, calc(var(--mono-spacing) * 2.5));\r\n  --_mono-bd-item-radius-preset: var(--mono-button-dropdown-item-radius-xxl, var(--mono-radius-lg));\r\n}\r\n\r\n/* =========================================\r\n   Inline row — EXTENSION: the entries before they collapse\r\n   ========================================= */\r\n\r\n:where([mono-button-dropdown]) > [mono-row] {\r\n  display: inline-flex;\r\n  flex-wrap: wrap;\r\n  align-items: center;\r\n  gap: var(--_mono-bd-gap);\r\n}\r\n\r\n/* `hidden` is a UA rule, and an author `display` beats it whatever the\r\n   specificity — so the hidden state has to be stated here. */\r\n[mono-button-dropdown] > [mono-row][hidden] {\r\n  display: none;\r\n}\r\n\r\n/* =========================================\r\n   Panel — `.dropdown-menu > [data-popover]`\r\n   ========================================= */\r\n\r\n/* basecoat@1.0.2 components/popover.css [data-popover] — absolute z-50 w-max\r\n   overflow-x-hidden overflow-y-auto outline-hidden\r\n   basecoat@1.0.2 styles/vega.css .dropdown-menu > [data-popover] — bg-popover\r\n   text-popover-foreground ring-foreground/10 gap-0 rounded-md p-1 shadow-md ring-1\r\n   — DEVIATIONS: the z-index is the shared popup stack's `--mono-popup-z` rather\r\n   than a flat z-50, and the height cap is the room the portal measured. */\r\n:where([mono-button-dropdown]) > [mono-panel] {\r\n  position: absolute;\r\n  z-index: var(--mono-popup-z, 1000);\r\n  display: flex;\r\n  flex-direction: column;\r\n  gap: var(--_mono-bd-list-gap);\r\n  width: max-content;\r\n  min-width: var(--_mono-bd-min-width);\r\n  max-height: var(--mono-popup-avail-h, none);\r\n  overflow-x: hidden;\r\n  overflow-y: auto;\r\n  outline: none;\r\n  padding: var(--_mono-bd-padding);\r\n  border-radius: var(--_mono-bd-radius);\r\n  background: var(--_mono-bd-bg);\r\n  color: var(--_mono-bd-text);\r\n  box-shadow:\r\n    0 0 0 var(--_mono-bd-ring-width) var(--_mono-bd-ring-color),\r\n    var(--_mono-bd-shadow);\r\n}\r\n\r\n/* Same UA-`hidden` story as the row, and it has to out-specify the rule above\r\n   even once the panel has been portaled (where it is still a `>` child). */\r\n[mono-button-dropdown] > [mono-panel][hidden] {\r\n  display: none;\r\n}\r\n\r\n/* Once the element takes over it measures and writes inline top/left, so the\r\n   static placement rules below must stand aside. */\r\n[mono-button-dropdown][mono-fixed] > [mono-panel] {\r\n  position: fixed;\r\n}\r\n\r\n/* =========================================\r\n   Static placement — `[data-side]` / `[data-align]`, verbatim\r\n   -----------------------------------------------------------------------------\r\n   What hand-written markup positions with (and SSR, before hydration). The\r\n   element overrides all of it with inline top/left once it has measured.\r\n   ========================================= */\r\n\r\n/* basecoat@1.0.2 components/popover.css [data-popover] >> &:not([data-side]), &[data-side='bottom'] — mt-1 top-full */\r\n[mono-button-dropdown]:not([mono-side]):not([mono-fixed]) > [mono-panel],\r\n[mono-button-dropdown][mono-side=\"bottom\"]:not([mono-fixed]) > [mono-panel] {\r\n  top: 100%;\r\n  margin-top: var(--_mono-bd-offset);\r\n}\r\n\r\n/* basecoat@1.0.2 components/popover.css [data-popover] >> &[data-side='top'] — mb-1 bottom-full */\r\n[mono-button-dropdown][mono-side=\"top\"]:not([mono-fixed]) > [mono-panel] {\r\n  bottom: 100%;\r\n  margin-bottom: var(--_mono-bd-offset);\r\n}\r\n\r\n/* basecoat@1.0.2 components/popover.css [data-popover] >> &[data-side='left'] — me-1 end-full */\r\n[mono-button-dropdown][mono-side=\"left\"]:not([mono-fixed]) > [mono-panel] {\r\n  inset-inline-end: 100%;\r\n  margin-inline-end: var(--_mono-bd-offset);\r\n}\r\n\r\n/* basecoat@1.0.2 components/popover.css [data-popover] >> &[data-side='right'] — ms-1 start-full */\r\n[mono-button-dropdown][mono-side=\"right\"]:not([mono-fixed]) > [mono-panel] {\r\n  inset-inline-start: 100%;\r\n  margin-inline-start: var(--_mono-bd-offset);\r\n}\r\n\r\n/* The top/bottom pair aligns on the inline axis: start-0 / end-0 / start-1/2 -translate-x-1/2.\r\n   DEVIATION from `mono-dropdown`: the default here is `end`, matching the\r\n   `placement=\"bottom-end\"` default — a row of actions hangs off the right. */\r\n[mono-button-dropdown]:is(:not([mono-side]), [mono-side=\"top\"], [mono-side=\"bottom\"])[mono-align=\"start\"]:not([mono-fixed]) > [mono-panel] {\r\n  inset-inline-start: 0;\r\n}\r\n\r\n[mono-button-dropdown]:is(:not([mono-side]), [mono-side=\"top\"], [mono-side=\"bottom\"]):is(:not([mono-align]), [mono-align=\"end\"]):not([mono-fixed]) > [mono-panel] {\r\n  inset-inline-end: 0;\r\n}\r\n\r\n[mono-button-dropdown]:is(:not([mono-side]), [mono-side=\"top\"], [mono-side=\"bottom\"])[mono-align=\"center\"]:not([mono-fixed]) > [mono-panel] {\r\n  inset-inline-start: 50%;\r\n  translate: -50% 0;\r\n}\r\n\r\n/* …and the left/right pair on the block axis: top-0 / bottom-0 / top-1/2 -translate-y-1/2 */\r\n[mono-button-dropdown]:is([mono-side=\"left\"], [mono-side=\"right\"]):is(:not([mono-align]), [mono-align=\"start\"]):not([mono-fixed]) > [mono-panel] {\r\n  top: 0;\r\n}\r\n\r\n[mono-button-dropdown]:is([mono-side=\"left\"], [mono-side=\"right\"])[mono-align=\"end\"]:not([mono-fixed]) > [mono-panel] {\r\n  bottom: 0;\r\n}\r\n\r\n[mono-button-dropdown]:is([mono-side=\"left\"], [mono-side=\"right\"])[mono-align=\"center\"]:not([mono-fixed]) > [mono-panel] {\r\n  top: 50%;\r\n  translate: 0 -50%;\r\n}\r\n\r\n/* =========================================\r\n   List — `[role='menu']`\r\n   ========================================= */\r\n\r\n/* basecoat@1.0.2 components/dropdown-menu.css .dropdown-menu [role='menu'] — outline-hidden */\r\n:where([mono-button-dropdown]) [mono-list] {\r\n  display: flex;\r\n  flex-direction: column;\r\n  gap: var(--_mono-bd-list-gap);\r\n  margin: 0;\r\n  padding: 0;\r\n  list-style: none;\r\n  outline: none;\r\n}\r\n\r\n/* =========================================\r\n   Item — `[role='menuitem']`\r\n   -----------------------------------------------------------------------------\r\n   The `<li>` paints nothing itself: it hands the entry button a flattened\r\n   palette through the button's PUBLIC knobs, which is the only route that\r\n   reaches the control in BOTH builds (the shadow one keeps it behind a\r\n   boundary). The entry's own `variant` and `color` presets are overridden by\r\n   construction — inside the menu every row is one flat strip.\r\n   ========================================= */\r\n\r\n:where([mono-button-dropdown]) [mono-item] {\r\n  /* ── the row's ink and its hover wash ──────────────────────────────────────\r\n     FOUR tiers, not three, because the middle one belongs to a PER-ENTRY prop:\r\n\r\n       --mono-button-dropdown-item-<x>       consumer, wins over everything\r\n       --_mono-bd-item-<x>-preset            the entry's `color` (mono-item-color)\r\n       --mono-button-dropdown-item-base-<x>  a FLAVOR's neutral row\r\n       the Basecoat value\r\n\r\n     A flavor must write the `-base-` tier: writing the consumer knob would\r\n     out-rank every role and freeze all ten colours at one ink. */\r\n  --_mono-bd-item-color: var(--mono-button-dropdown-item-color, var(--_mono-bd-item-color-preset, var(--mono-button-dropdown-item-base-color, var(--_mono-bd-text))));\r\n  /* basecoat@1.0.2 styles/vega.css .dropdown-menu :is([role='menuitem'], [role='menuitemcheckbox'], [role='menuitemradio']) — focus-visible:bg-accent */\r\n  --_mono-bd-item-hover-bg: var(--mono-button-dropdown-item-hover-bg, var(--_mono-bd-item-hover-bg-preset, var(--mono-button-dropdown-item-base-hover-bg, var(--mono-button-dropdown-item-hover, var(--accent)))));\r\n  --_mono-bd-item-hover-color: var(--mono-button-dropdown-item-hover-color, var(--_mono-bd-item-hover-color-preset, var(--mono-button-dropdown-item-base-hover-color, var(--accent-foreground))));\r\n  /* basecoat@1.0.2 styles/vega.css .dropdown-menu :is([role='menuitem'], [role='menuitemcheckbox'], [role='menuitemradio']) — rounded-sm */\r\n  --_mono-bd-item-radius: var(--mono-button-dropdown-item-radius, var(--_mono-bd-item-radius-preset, var(--mono-radius-sm)));\r\n\r\n  /* ── flatten the entry: the button's own public knobs, set on its ancestor ─ */\r\n  --mono-button-bg: transparent;\r\n  --mono-button-color: var(--_mono-bd-item-color);\r\n  --mono-button-border-color: transparent;\r\n  --mono-button-shadow: 0 0 #0000;\r\n  --mono-button-hover-bg: var(--_mono-bd-item-hover-bg);\r\n  --mono-button-hover-color: var(--_mono-bd-item-hover-color);\r\n  --mono-button-hover-border-color: transparent;\r\n  --mono-button-hover-shadow: 0 0 #0000;\r\n  --mono-button-radius: var(--_mono-bd-item-radius);\r\n  /* A menu row is a strip, not a chip: full width, label against the start edge. */\r\n  --mono-button-width: 100%;\r\n  --mono-button-justify: flex-start;\r\n  /* No press twitch in a list — right for a standalone button, wrong for a row. */\r\n  --mono-button-press-translate: 0 0;\r\n  --mono-button-font-weight: var(--mono-button-dropdown-item-font-weight, var(--mono-font-weight-medium));\r\n\r\n  display: block;\r\n  min-width: 0;\r\n}\r\n\r\n/* The entry element itself — `<mono-button>` / `<mono-shadow-button>`, both\r\n   `display: inline-block` hosts — has to fill the row for the whole strip to be\r\n   clickable rather than just the label's width. */\r\n:where([mono-button-dropdown]) [mono-item] > * {\r\n  display: block;\r\n  width: 100%;\r\n}\r\n\r\n/* basecoat@1.0.2 styles/vega.css .dropdown-menu [data-variant='destructive'] —\r\n   `text-destructive`, and `:is(:focus-visible, .active)` lays the same colour\r\n   down at `bg-destructive/10` (dark `/20`, carried by `--mono-mode-tint`).\r\n   EXTENSION: generalised from destructive to all ten roles. The tint is the\r\n   whole point — a solid role fill under a role-coloured glyph erases it. */\r\n[mono-button-dropdown] [mono-item][mono-item-color=\"primary\"] {\r\n  --_mono-bd-item-color-preset: var(--_mono-bd-primary);\r\n  --_mono-bd-item-hover-bg-preset: color-mix(in oklab, var(--_mono-bd-primary) var(--mono-mode-tint), transparent);\r\n  --_mono-bd-item-hover-color-preset: var(--_mono-bd-primary);\r\n}\r\n\r\n[mono-button-dropdown] [mono-item][mono-item-color=\"success\"] {\r\n  --_mono-bd-item-color-preset: var(--_mono-bd-success);\r\n  --_mono-bd-item-hover-bg-preset: color-mix(in oklab, var(--_mono-bd-success) var(--mono-mode-tint), transparent);\r\n  --_mono-bd-item-hover-color-preset: var(--_mono-bd-success);\r\n}\r\n\r\n[mono-button-dropdown] [mono-item][mono-item-color=\"danger\"] {\r\n  --_mono-bd-item-color-preset: var(--_mono-bd-danger);\r\n  --_mono-bd-item-hover-bg-preset: color-mix(in oklab, var(--_mono-bd-danger) var(--mono-mode-tint), transparent);\r\n  --_mono-bd-item-hover-color-preset: var(--_mono-bd-danger);\r\n}\r\n\r\n[mono-button-dropdown] [mono-item][mono-item-color=\"warning\"] {\r\n  --_mono-bd-item-color-preset: var(--_mono-bd-warning);\r\n  --_mono-bd-item-hover-bg-preset: color-mix(in oklab, var(--_mono-bd-warning) var(--mono-mode-tint), transparent);\r\n  --_mono-bd-item-hover-color-preset: var(--_mono-bd-warning);\r\n}\r\n\r\n[mono-button-dropdown] [mono-item][mono-item-color=\"info\"] {\r\n  --_mono-bd-item-color-preset: var(--_mono-bd-info);\r\n  --_mono-bd-item-hover-bg-preset: color-mix(in oklab, var(--_mono-bd-info) var(--mono-mode-tint), transparent);\r\n  --_mono-bd-item-hover-color-preset: var(--_mono-bd-info);\r\n}\r\n\r\n[mono-button-dropdown] [mono-item][mono-item-color=\"teal\"] {\r\n  --_mono-bd-item-color-preset: var(--_mono-bd-teal);\r\n  --_mono-bd-item-hover-bg-preset: color-mix(in oklab, var(--_mono-bd-teal) var(--mono-mode-tint), transparent);\r\n  --_mono-bd-item-hover-color-preset: var(--_mono-bd-teal);\r\n}\r\n\r\n[mono-button-dropdown] [mono-item][mono-item-color=\"purple\"] {\r\n  --_mono-bd-item-color-preset: var(--_mono-bd-purple);\r\n  --_mono-bd-item-hover-bg-preset: color-mix(in oklab, var(--_mono-bd-purple) var(--mono-mode-tint), transparent);\r\n  --_mono-bd-item-hover-color-preset: var(--_mono-bd-purple);\r\n}\r\n\r\n/* The three surface roles: their ink is a foreground, and a 10% wash of a\r\n   near-background colour is invisible — so they hover on `--accent`, the\r\n   neutral row wash, exactly like an uncoloured entry. */\r\n[mono-button-dropdown] [mono-item][mono-item-color=\"dark\"] {\r\n  --_mono-bd-item-color-preset: var(--_mono-bd-dark);\r\n  --_mono-bd-item-hover-color-preset: var(--_mono-bd-dark);\r\n}\r\n\r\n[mono-button-dropdown] [mono-item][mono-item-color=\"secondary\"] {\r\n  --_mono-bd-item-color-preset: var(--_mono-bd-secondary);\r\n  --_mono-bd-item-hover-color-preset: var(--_mono-bd-secondary);\r\n}\r\n\r\n[mono-button-dropdown] [mono-item][mono-item-color=\"light\"] {\r\n  --_mono-bd-item-color-preset: var(--_mono-bd-light);\r\n  --_mono-bd-item-hover-color-preset: var(--_mono-bd-light);\r\n}\r\n\r\n/**\r\n * Icon glyphs inside a shadow root.\r\n *\r\n * `adoptIconStyles` copies the page's `.i-mdi-…` rules through CSSOM `cssText`,\r\n * and that read-back DROPS the mask declarations — `mask-image: ;` comes back\r\n * empty whenever the value is a `var()`. What survives is `--un-icon`, the data\r\n * URI itself. So the copy leaves `background-color: currentColor` with no mask,\r\n * painting a solid square: the \"black cube\".\r\n *\r\n * Re-declaring the mask here fixes it, because this sheet is authored source\r\n * rather than a CSSOM copy — it consumes the custom property that DID survive.\r\n * Harmless in the light build, where it merely restates what the page already\r\n * says. The glyph's BOX is left to `[mono-button] [mono-icon]` (Basecoat's\r\n * `size-4`): sizing it here as well used to out-specify that and hand every\r\n * menu icon a 1.1em box the button never asked for.\r\n */\r\n[mono-button-dropdown] [class*='i-'].mono-icon {\r\n  -webkit-mask: var(--un-icon) no-repeat;\r\n  mask: var(--un-icon) no-repeat;\r\n  -webkit-mask-size: 100% 100%;\r\n  mask-size: 100% 100%;\r\n  background-color: currentColor;\r\n  display: inline-block;\r\n}\r\n";
//#endregion
//#region src/components/button/mono-button-dropdown.ts
var MonoButtonDropdown = class MonoButtonDropdown extends MonoButtonDropdownCore(LitElement) {
	static {
		this.styles = [unsafeCSS(button_default), unsafeCSS(button_dropdown_default)];
	}
	createRenderRoot() {
		return this;
	}
	/**
	* The panel is a STATIC element here, not something a helper returns.
	*
	* `PopupPortalController` moves it into a `<body>` portal on open and never
	* moves it back. A node produced inside a `${}` expression sits in a
	* `ChildPart` range, and ejecting it from that range breaks Lit on the next
	* render ("this `ChildPart` has no `parentNode`"). As a fixed template node it
	* has no range to leave — which is exactly why `mono-dropdown` is shaped this
	* way too.
	*/
	render() {
		return html`<div class=${this._cls("mono-button-dropdown", "root")} mono-button-dropdown ${ref(this.bindRoot)}>
      ${this.renderRow()}${this.renderTrigger()}
      <div
        class=${this.panelClass}
        mono-panel
        role="menu"
        aria-hidden=${this.modelValue ? "false" : "true"}
        ?hidden=${this.panelHidden}
        ${ref(this.bindPanel)}
      >
        ${this.renderMenuList()}
      </div>
    </div>`;
	}
};
MonoButtonDropdown = __decorate([customElement("mono-button-dropdown")], MonoButtonDropdown);
//#endregion
export { MonoButtonDropdown, MonoButtonDropdownCore };
