import { t as applyProps } from "./element-props-xvw0EB7H.js";
import { a as defineHybridPropAliases, o as numberStringConverter, r as booleanStringConverter, t as __decorate } from "./decorate-DbYFpi8R.js";
import { t as dispatchMonoEvent } from "./mono-event-CAZf0F_k.js";
import { a as rateLimitHasChanged } from "./rate-limit-e9Jlpl5l.js";
import { t as PopupPortalController } from "./popup-portal-CINuVjNY.js";
import { html, isServer, nothing } from "lit";
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
const BUTTON_DROPDOWN_STYLE_VARS = [
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
const MonoButtonDropdownCore = (superClass) => {
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
			this._documentBound = false;
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
			this._syncDocument();
		}
		disconnectedCallback() {
			this._syncDocument(false);
			super.disconnectedCallback();
		}
		/**
		* Outside-click / Escape listeners, bound while OPEN only (select's rule). Both handlers
		* bail when closed, and a grid that puts one of these in every row held two `document`
		* listeners per row — one capture-phase — in the path of every click and keystroke.
		*/
		_syncDocument(want = this.modelValue && this.isConnected) {
			if (isServer || want === this._documentBound) return;
			this._documentBound = want;
			if (want) {
				document.addEventListener("click", this._onDocumentClick, true);
				document.addEventListener("keydown", this._onDocumentKeydown);
			} else {
				document.removeEventListener("click", this._onDocumentClick, true);
				document.removeEventListener("keydown", this._onDocumentKeydown);
			}
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
			this._syncDocument();
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
export { MonoButtonDropdownCore as t };