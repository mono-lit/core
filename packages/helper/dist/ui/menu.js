import { l as monoHostChildNodes } from "../mono-ui-CPV7rrdo.js";
import { t as customElement } from "../mono-element-B0kP_96P.js";
import { a as defineHybridPropAliases, n as arrayHasChanged, r as booleanStringConverter, t as __decorate } from "../decorate-DEXtNagw.js";
import { t as dispatchMonoEvent } from "../mono-event-Bi1qP9uN.js";
import { a as parkDetachedNodes, s as placeSlotNode } from "../light-slots-DW1WgfgT.js";
import { t as isIconifyClass } from "../icon-dVhYJUIH.js";
import { a as validateColorProp, i as isThemeColorToken, n as colorClassToken, r as customColorStyle, t as CUSTOM_COLOR_CLASS } from "../color-DHYrfXsX.js";
import { LitElement, html, isServer, nothing, unsafeCSS } from "lit";
import { property, state } from "lit/decorators.js";
//#region src/components/menu/menu-utils.ts
function isItem(node) {
	return !node.type || node.type === "item";
}
function isGroup(node) {
	return node.type === "group";
}
function isDivider(node) {
	return node.type === "divider";
}
function isSubheader(node) {
	return node.type === "subheader";
}
/**
* Walk the tree and collect the chain (root → leaf) leading to the item with
* the given id. Returns an empty array if not found.
*/
function findActivePath(items, id) {
	for (const node of items) {
		if (node.id === id) return [node];
		if (node.items?.length) {
			const sub = findActivePath(node.items, id);
			if (sub.length) return [node, ...sub];
		}
	}
	return [];
}
function findItem(items, id) {
	for (const node of items) {
		if (node.id === id) return node;
		if (node.items?.length) {
			const sub = findItem(node.items, id);
			if (sub) return sub;
		}
	}
	return null;
}
/**
* Generate a 1–2 character alias from a menu item's title for the icon
* fallback (used by `renderMenuIcon` when no `item.icon` and no slot icon are
* provided). Each space-delimited word contributes its first character; output
* is uppercased and capped at `max` characters.
*
* Examples:
*   getMenuAlias('Dashboard')           → 'D'
*   getMenuAlias('Post Budget')         → 'PB'
*   getMenuAlias('Sales Order Report')  → 'SO'
*   getMenuAlias('logbook')             → 'L'
*   getMenuAlias('')                    → ''
*/
function getMenuAlias(input, max = 2) {
	if (!input || typeof input !== "string") return "";
	const words = input.trim().split(/\s+/).filter(Boolean);
	if (!words.length) return "";
	return words.slice(0, max).map((w) => w.charAt(0)).join("").toUpperCase();
}
function collectDefaultOpenGroups(items) {
	const out = [];
	const visit = (list) => {
		for (const node of list) {
			if (isGroup(node) && node.defaultOpen) out.push(node.id);
			if (node.items?.length) visit(node.items);
		}
	};
	visit(items);
	return out;
}
function generateMenuRootClasses(props) {
	return [
		"mono-menu",
		props.density,
		colorClassToken(props.color),
		props.nav ? "nav" : "plain",
		props.selectable ? "" : "not-selectable",
		props.disabled ? "disabled" : "",
		props.cssClassName ?? "",
		props.rootExtra ?? ""
	].filter(Boolean).join(" ");
}
function validateMenuProps(props) {
	const errors = [];
	if (props.density && ![
		"compact",
		"comfortable",
		"default"
	].includes(props.density)) errors.push(`Invalid density: ${String(props.density)}`);
	const colorError = validateColorProp(props.color);
	if (colorError) errors.push(colorError);
	return errors;
}
/**
* The Basecoat styling attributes for the menu ROOT, mirroring the props one
* for one. A prop at its DEFAULT emits nothing — `:not([mono-density])` is
* comfortable and `:not([mono-color])` is primary — so the rendered DOM is
* also the shortest hand-written markup that paints the same (see menu.css).
* `nav` defaults to TRUE, so `mono-plain` is the attribute that says
* something. Shared so `<mono-menu>` and a standalone `<mono-menu-list>`
* cannot drift apart.
*/
function menuRootAttrs(props) {
	return {
		density: props.density === "comfortable" ? null : props.density,
		color: isThemeColorToken(props.color) || props.color === "surface" ? props.color === "primary" ? null : props.color : CUSTOM_COLOR_CLASS
	};
}
//#endregion
//#region src/components/menu/menu-render.ts
function clsFor(base, key, cssClass) {
	const extra = cssClass?.[key];
	return extra ? `${base} ${extra}` : base;
}
function renderMenuIcon(item, ctx) {
	const slotNodes = ctx.getSlotIconNodes(item.id);
	if (!!(slotNodes && slotNodes.length)) return html`
      <span
        class=${clsFor("mono-menu-icon", "icon", ctx.cssClass)}
        mono-icon
        aria-hidden="true"
      >
        <span data-mono-slot=${`icon-${item.id}`}></span>
      </span>
    `;
	if (ctx.iconSlot && item.icon && isIconifyClass(item.icon)) return html`
      <span
        class=${clsFor("mono-menu-icon", "icon", ctx.cssClass)}
        mono-icon
        aria-hidden="true"
      >
        <slot name=${`icon-${item.id}`}></slot>
      </span>
    `;
	if (item.icon && isIconifyClass(item.icon)) return html`
      <span
        class=${clsFor("mono-menu-icon", "icon", ctx.cssClass)}
        mono-icon
        aria-hidden="true"
      >
        <span class=${`mono-menu-iconify ${item.icon}`} mono-glyph></span>
      </span>
    `;
	if (item.icon) return html`
      <span
        class=${clsFor("mono-menu-icon", "icon", ctx.cssClass)}
        mono-icon
        aria-hidden="true"
      >
        ${item.icon}
      </span>
    `;
	const alias = getMenuAlias(item.title || item.id);
	if (alias) return html`
      <span
        class=${`${clsFor("mono-menu-icon", "icon", ctx.cssClass)} alias`}
        mono-icon
        mono-alias
        aria-hidden="true"
        data-mono-alias=${alias}
      >
        ${alias}
      </span>
    `;
	return nothing;
}
function renderMenuBadge(item, ctx) {
	if (item.badge === void 0 || item.badge === null || item.badge === "") return nothing;
	const colorClass = item.badgeColor && item.badgeColor !== "default" ? item.badgeColor : "";
	return html`
    <span
      class=${`${clsFor("mono-menu-badge", "badge", ctx.cssClass)} ${colorClass}`.trim()}
      mono-badge=${colorClass}
    >
      ${item.badge}
    </span>
  `;
}
function renderMenuAppend(item, ctx) {
	if (item.badge !== void 0 && item.badge !== null && item.badge !== "") return renderMenuBadge(item, ctx);
	if (!item.appendIcon) return nothing;
	return html`
    <span
      class=${clsFor("mono-menu-append", "appendIcon", ctx.cssClass)}
      mono-append
      aria-hidden="true"
    >
      ${item.appendIcon}
    </span>
  `;
}
function renderMenuItemRow(item, ctx) {
	const active = ctx.isSelected(item.id);
	const itemClasses = [
		clsFor("mono-menu-item", "item", ctx.cssClass),
		active ? "active" : "",
		active && ctx.cssClass?.itemActive ? ctx.cssClass.itemActive : "",
		item.disabled ? "disabled" : "",
		item.disabled && ctx.cssClass?.itemDisabled ? ctx.cssClass.itemDisabled : ""
	].filter(Boolean).join(" ");
	const tag = item.href ? "a" : "button";
	const actionInner = html`
    ${renderMenuIcon(item, ctx)}
    <span class=${clsFor("mono-menu-content", "content", ctx.cssClass)} mono-content>
      <span class=${clsFor("mono-menu-title", "title", ctx.cssClass)} mono-title>
        ${item.title ?? item.id}
      </span>
      ${item.subtitle ? html`<span
            class=${clsFor("mono-menu-subtitle", "subtitle", ctx.cssClass)}
            mono-subtitle
            >${item.subtitle}</span
          >` : nothing}
    </span>
    ${renderMenuAppend(item, ctx)}
  `;
	return html`
    <li class=${itemClasses} mono-item ?mono-active=${active} ?mono-disabled=${!!item.disabled}>
      ${tag === "a" ? html`
            <a
              class=${clsFor("mono-menu-action", "action", ctx.cssClass)}
              mono-action
              href=${item.href}
              role=${ctx.selectable ? "option" : "link"}
              aria-current=${active ? "page" : "false"}
              aria-disabled=${item.disabled ? "true" : "false"}
              @click=${(e) => ctx.onItemClick(item, e)}
            >
              ${actionInner}
            </a>
          ` : html`
            <button
              type="button"
              class=${clsFor("mono-menu-action", "action", ctx.cssClass)}
              mono-action
              role=${ctx.selectable ? "option" : "menuitem"}
              aria-selected=${ctx.selectable ? active ? "true" : "false" : nothing}
              aria-disabled=${item.disabled ? "true" : "false"}
              ?disabled=${item.disabled || ctx.disabled}
              @click=${(e) => ctx.onItemClick(item, e)}
            >
              ${actionInner}
            </button>
          `}
      ${ctx.bodySlot && !isGroup(item) ? html`<ul
            class=${clsFor("mono-menu-list", "list", ctx.cssClass)}
            mono-list
            data-mono-slot="body"
          ></ul>` : item.items?.length && !isGroup(item) ? html`<ul class=${clsFor("mono-menu-list", "list", ctx.cssClass)} mono-list>
              ${renderMenuList(item.items, ctx)}
            </ul>` : nothing}
    </li>
  `;
}
function renderMenuGroup(group, ctx) {
	const open = ctx.isGroupOpen(group.id);
	const ancestorActive = ctx.isGroupActive?.(group) ?? false;
	return html`
    <li
      class=${[clsFor("mono-menu-group", "group", ctx.cssClass), ancestorActive ? "active" : ""].filter(Boolean).join(" ")}
      mono-item
      mono-group
      ?mono-open=${open}
      ?mono-active=${ancestorActive}
      ?mono-disabled=${!!group.disabled}
      data-open=${open ? "true" : "false"}
    >
      <button
        type="button"
        class=${clsFor("mono-menu-group-header", "groupHeader", ctx.cssClass)}
        mono-group-header
        aria-expanded=${open ? "true" : "false"}
        ?disabled=${group.disabled || ctx.disabled}
        @click=${(e) => ctx.onGroupToggle(group, e)}
      >
        ${renderMenuIcon(group, ctx)}
        <span class=${clsFor("mono-menu-content", "content", ctx.cssClass)} mono-content>
          <span class=${clsFor("mono-menu-title", "title", ctx.cssClass)} mono-title>
            ${group.title ?? group.id}
          </span>
          ${group.subtitle ? html`<span
                class=${clsFor("mono-menu-subtitle", "subtitle", ctx.cssClass)}
                mono-subtitle
                >${group.subtitle}</span
              >` : nothing}
        </span>
        <span
          class=${clsFor("mono-menu-chevron", "groupChevron", ctx.cssClass)}
          mono-chevron
          aria-hidden="true"
        >
          ${ctx.chevronSvg ?? html`<span class="mono-icon i-mdi-chevron-right" aria-hidden="true"></span>`}
        </span>
      </button>
      ${ctx.bodySlot ? html`<ul
            class=${clsFor("mono-menu-list", "groupBody", ctx.cssClass)}
            mono-list
            mono-group-body
            data-mono-slot="body"
          ></ul>` : group.items?.length ? html`<ul
              class=${clsFor("mono-menu-list", "groupBody", ctx.cssClass)}
              mono-list
              mono-group-body
            >
              ${renderMenuList(group.items, ctx)}
            </ul>` : nothing}
    </li>
  `;
}
function renderMenuDivider(item, ctx) {
	return html`<li
    class=${clsFor("mono-menu-divider", "divider", ctx.cssClass)}
    mono-divider
    role="separator"
    data-id=${item.id}
  ></li>`;
}
function renderMenuSubheader(item, ctx) {
	return html`<li
    class=${clsFor("mono-menu-subheader", "subheader", ctx.cssClass)}
    mono-subheader
    data-id=${item.id}
  >
    ${item.title ?? ""}
  </li>`;
}
function renderMenuList(list, ctx) {
	return list.map((item) => {
		if (isDivider(item)) return renderMenuDivider(item, ctx);
		if (isSubheader(item)) return renderMenuSubheader(item, ctx);
		if (isGroup(item)) return renderMenuGroup(item, ctx);
		return renderMenuItemRow(item, ctx);
	});
}
/**
* Render only the group rows from `list` — non-group items are skipped.
* Used by `<mono-menu-list type="group">`.
*/
function renderMenuGroupsOnly(list, ctx) {
	const out = [];
	for (const item of list) if (isGroup(item)) out.push(renderMenuGroup(item, ctx));
	return out;
}
//#endregion
//#region src/components/menu/menu-core.ts
/** Coerce any `items` input (array, JSON string, or other) to a MenuItem array. */
function coerceItems(value) {
	if (Array.isArray(value)) return value;
	if (typeof value === "string") {
		if (!value) return [];
		try {
			const parsed = JSON.parse(value);
			return Array.isArray(parsed) ? parsed : [];
		} catch {
			return [];
		}
	}
	return [];
}
/**
* `MonoMenuCore` — all render-mode-agnostic logic for `mono-menu`: reactive
* props, hybrid aliases, css-class interop, selection + open-group state,
* default-open seeding, the click/toggle/change events, the full public API, and
* the chrome `render()` (which delegates the body to a `_renderBody()` hook).
*
* Leaves to each build: `createRenderRoot()`, the body strategy (light: slot
* capture / declarative `slot="body"`; shadow: items-driven only), and
* `_chevronSvg()` (light: undefined → UnoCSS icon span; shadow: inline SVG).
*/
var MonoMenuCore = (superClass) => {
	class MonoMenuCoreClass extends superClass {
		constructor(...args) {
			super(...args);
			this.items = [];
			this.modelValue = "";
			this.multiple = false;
			this.density = "comfortable";
			this.color = "primary";
			this.nav = true;
			this.selectable = true;
			this.disabled = false;
			this.controlled = false;
			this.cssClass = {};
			this.cssClassName = "";
			this._openGroups = /* @__PURE__ */ new Set();
			this._seededGroups = /* @__PURE__ */ new Set();
			this._slotIcons = /* @__PURE__ */ new Map();
			this._listChildren = /* @__PURE__ */ new Set();
			this._railSidebar = null;
			this._railObserver = null;
			this._railRetryRaf = null;
			this._railRetryTimer = null;
			defineHybridPropAliases(this, ["modelValue", "cssClass"]);
			Object.defineProperty(this, "css-class", {
				get: () => this.cssClass,
				set: (value) => this._setCssClass(value),
				configurable: true,
				enumerable: false
			});
			Object.defineProperty(this, "cssclass", {
				get: () => this.cssClass,
				set: (value) => this._setCssClass(value),
				configurable: true,
				enumerable: false
			});
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
			if (name === "modelvalue") {
				this.modelValue = newValue ?? "";
				return;
			}
			if (name === "css-class" || name === "cssclass") this._setCssClass(newValue);
		}
		connectedCallback() {
			super.connectedCallback();
			if (isServer) return;
			this._setupRailSync();
		}
		disconnectedCallback() {
			if (!isServer) this._teardownRailSync();
			super.disconnectedCallback();
		}
		willUpdate(changed) {
			if (typeof this.items === "string") this.items = coerceItems(this.items);
			super.willUpdate?.(changed);
			if (changed.has("items")) this._seedDefaultOpenGroups();
		}
		_seedDefaultOpenGroups() {
			const existing = new Set(this._openGroups);
			let changed = false;
			for (const id of collectDefaultOpenGroups(this.items)) {
				if (this._seededGroups.has(id)) continue;
				this._seededGroups.add(id);
				if (!existing.has(id)) {
					existing.add(id);
					changed = true;
				}
			}
			if (!changed) return;
			this._openGroups = existing;
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
		get _rootClasses() {
			return generateMenuRootClasses({
				density: this.density,
				color: this.color,
				nav: this.nav,
				selectable: this.selectable,
				disabled: this.disabled,
				cssClassName: this.cssClassName,
				rootExtra: this.cssClass?.root
			});
		}
		_isSelected(id) {
			if (this.multiple) return Array.isArray(this.modelValue) && this.modelValue.includes(id);
			return !this.multiple && this.modelValue === id;
		}
		_isGroupOpen(id) {
			return this._openGroups.has(id);
		}
		/** A group is "active" when the currently-selected item is a descendant. */
		_isGroupActive(group) {
			const selected = this.multiple ? Array.isArray(this.modelValue) ? this.modelValue : [] : [this.modelValue];
			const ids = new Set(selected.filter(Boolean));
			if (!ids.size) return false;
			const contains = (node) => !!node.items?.some((child) => ids.has(child.id) || contains(child));
			return contains(group);
		}
		_findRegisteredItem(id) {
			for (const child of this._listChildren) {
				const found = findItem(child.getMenuItems?.() ?? [], id);
				if (found) return found;
			}
			return null;
		}
		_findAnyItem(id) {
			return findItem(this.items, id) ?? this._findRegisteredItem(id);
		}
		_getRegisteredActivePath(id) {
			for (const child of this._listChildren) {
				const path = findActivePath(child.getMenuItems?.() ?? [], id);
				if (path.length) return path;
			}
			return [];
		}
		select(id) {
			const item = this._findAnyItem(id);
			if (!item || !isItem(item)) return;
			this._handleItemActivation(item);
		}
		deselect(id) {
			if (!this.multiple) {
				if (this.modelValue === id) {
					const oldValue = this.modelValue;
					this.modelValue = "";
					this._emitChange(id, this._findAnyItem(id) ?? { id }, false, oldValue);
				}
				return;
			}
			if (Array.isArray(this.modelValue) && this.modelValue.includes(id)) {
				const oldValue = [...this.modelValue];
				this.modelValue = this.modelValue.filter((v) => v !== id);
				this._emitChange(id, this._findAnyItem(id) ?? { id }, false, oldValue);
			}
		}
		toggleGroup(id) {
			const item = this._findAnyItem(id);
			if (!item || !isGroup(item)) return;
			this._handleGroupToggle(item);
		}
		expandGroup(id) {
			if (this._openGroups.has(id)) return;
			const next = new Set(this._openGroups);
			next.add(id);
			this._openGroups = next;
		}
		collapseGroup(id) {
			if (!this._openGroups.has(id)) return;
			const next = new Set(this._openGroups);
			next.delete(id);
			this._openGroups = next;
		}
		focus() {
			this.querySelector(".mono-menu-action, .mono-menu-group-header")?.focus();
		}
		getActivePath() {
			const id = !this.multiple ? this.modelValue : Array.isArray(this.modelValue) && this.modelValue.length ? this.modelValue[this.modelValue.length - 1] : "";
			if (!id) return [];
			const ownPath = findActivePath(this.items, id);
			if (ownPath.length) return ownPath;
			return this._getRegisteredActivePath(id);
		}
		requestItemActivation(item, event) {
			this._handleItemActivation(item, event);
		}
		requestGroupToggle(group, event) {
			this._handleGroupToggle(group, event);
		}
		isItemSelected(id) {
			return this._isSelected(id);
		}
		isGroupOpenPublic(id) {
			return this._isGroupOpen(id);
		}
		getSlotIconNodes(id) {
			return this._slotIcons.get(id);
		}
		/** @internal called by `<mono-menu-list>` from its connectedCallback. */
		_registerListChild(child) {
			this._listChildren.add(child);
		}
		/** @internal called by `<mono-menu-list>` from its disconnectedCallback. */
		_unregisterListChild(child) {
			this._listChildren.delete(child);
		}
		/** Walk up across slot + shadow boundaries to the host `<mono-sidebar>`, if any. */
		_findAncestorSidebar() {
			let node = this.assignedSlot ?? this.parentNode;
			while (node) {
				if (node instanceof Element && (node.localName === "mono-sidebar" || node.localName === "mono-shadow-sidebar")) return node;
				node = node.assignedSlot ?? (node instanceof ShadowRoot ? node.host : node.parentNode);
			}
			return null;
		}
		_setupRailSync(retries = 30) {
			if (this._railObserver) this._teardownRailSync();
			const sidebar = this._findAncestorSidebar();
			if (!sidebar) {
				if (retries <= 0 || isServer) return;
				let fired = false;
				const retry = () => {
					if (fired) return;
					fired = true;
					this._railRetryRaf = null;
					this._railRetryTimer = null;
					if (this.isConnected) this._setupRailSync(retries - 1);
				};
				this._cancelRailRetry();
				if (typeof requestAnimationFrame !== "undefined") this._railRetryRaf = requestAnimationFrame(retry);
				this._railRetryTimer = setTimeout(retry, 32);
				return;
			}
			this._railSidebar = sidebar;
			this._applyRailCollapsed(sidebar.hasAttribute("data-rail-collapsed"));
			this._railObserver = new MutationObserver(() => {
				this._applyRailCollapsed(sidebar.hasAttribute("data-rail-collapsed"));
			});
			this._railObserver.observe(sidebar, {
				attributes: true,
				attributeFilter: ["data-rail-collapsed"]
			});
		}
		_cancelRailRetry() {
			if (this._railRetryRaf !== null && typeof cancelAnimationFrame !== "undefined") cancelAnimationFrame(this._railRetryRaf);
			if (this._railRetryTimer !== null) clearTimeout(this._railRetryTimer);
			this._railRetryRaf = null;
			this._railRetryTimer = null;
		}
		_teardownRailSync() {
			this._cancelRailRetry();
			this._railObserver?.disconnect();
			this._railObserver = null;
			this._railSidebar = null;
		}
		static {
			this._RAIL_COLLAPSE_VARS = [
				["--mono-menu-label-display", "none"],
				["--mono-menu-row-display", "flex"],
				["--mono-menu-row-justify", "center"],
				["--mono-menu-action-width", "auto"],
				["--mono-menu-action-justify", "center"],
				["--mono-menu-action-gap", "0"],
				["--mono-menu-group-children-display", "none"]
			];
		}
		_applyRailCollapsed(collapsed) {
			this.toggleAttribute("rail-collapsed", collapsed);
			const vars = MonoMenuCoreClass._RAIL_COLLAPSE_VARS;
			if (collapsed) for (const [name, value] of vars) this.style.setProperty(name, value);
			else for (const [name] of vars) this.style.removeProperty(name);
		}
		_handleItemActivation(item, event) {
			if (item.disabled || this.disabled) return;
			dispatchMonoEvent(this, "click", {
				value: item.id,
				item,
				sourceEvent: event
			});
			if (this.controlled) return;
			if (!this.selectable) return;
			if (this.multiple) {
				const oldArr = Array.isArray(this.modelValue) ? [...this.modelValue] : [];
				let nextArr;
				let selected;
				if (oldArr.includes(item.id)) {
					nextArr = oldArr.filter((v) => v !== item.id);
					selected = false;
				} else {
					nextArr = [...oldArr, item.id];
					selected = true;
				}
				this.modelValue = nextArr;
				this._emitChange(item.id, item, selected, oldArr, event);
				return;
			}
			const oldValue = this.modelValue;
			if (oldValue === item.id) return;
			this.modelValue = item.id;
			this._emitChange(item.id, item, true, oldValue, event);
		}
		_emitChange(value, item, selected, oldValue, event) {
			const detail = {
				modelValue: this.modelValue,
				oldValue,
				value,
				item,
				selected,
				sourceEvent: event
			};
			dispatchMonoEvent(this, "change", detail);
		}
		_handleGroupToggle(group, event) {
			if (group.disabled || this.disabled) return;
			const oldOpen = this._openGroups.has(group.id);
			const next = new Set(this._openGroups);
			if (oldOpen) next.delete(group.id);
			else next.add(group.id);
			this._openGroups = next;
			const detail = {
				groupId: group.id,
				open: !oldOpen,
				oldOpen,
				group,
				sourceEvent: event
			};
			dispatchMonoEvent(this, "toggle-group", detail);
		}
		/** Inline chevron — light: undefined (UnoCSS span); shadow: inline SVG. */
		_chevronSvg() {}
		/** Whether to project icons via native `<slot>` — light: false; shadow: true. */
		_useIconSlots() {
			return false;
		}
		_renderContext() {
			return {
				multiple: this.multiple,
				selectable: this.selectable,
				disabled: this.disabled,
				cssClass: this.cssClass,
				chevronSvg: this._chevronSvg(),
				iconSlot: this._useIconSlots(),
				isSelected: (id) => this._isSelected(id),
				isGroupOpen: (id) => this._isGroupOpen(id),
				isGroupActive: (group) => this._isGroupActive(group),
				getSlotIconNodes: (id) => this._slotIcons.get(id),
				onItemClick: (item, e) => this._handleItemActivation(item, e),
				onGroupToggle: (group, e) => this._handleGroupToggle(group, e)
			};
		}
		/** Default body — items-driven. Light overrides to add the slot="body" path. */
		_renderBody() {
			return html`
        <ul
          class=${this._cls("mono-menu-list", "list")}
          mono-list
          role=${this.selectable ? "listbox" : "menu"}
        >
          ${renderMenuList(this.items, this._renderContext())}
        </ul>
      `;
		}
		/**
		
		* Carries a literal `color` (`#7c3aed`, `rgb(…)`) that no stylesheet can know about.
		* Empty for a palette slot, which resolves entirely through the `.mono-menu.<token>`
		* rules instead.
		*
		* Must land on the ROOT element, not the host: a class-based `-preset` declared on
		* the root beats an inherited one, so a host-level write would silently lose. If a
		* `_syncRootFromState`-style attribute re-assert is ever added here (sidebar has one),
		* it has to serialize from THIS getter or it will wipe the colour.
		*/
		get _inlineRootStyle() {
			return customColorStyle(isThemeColorToken(this.color) || this.color === "surface" ? "" : this.color, "menu");
		}
		render() {
			const attrs = menuRootAttrs(this);
			return html`
        <nav
          class=${this._rootClasses}
          style=${this._inlineRootStyle}
          role="navigation"
          mono-menu
          mono-density=${attrs.density ?? nothing}
          mono-color=${attrs.color ?? nothing}
          ?mono-plain=${!this.nav}
          ?mono-disabled=${this.disabled}
        >
          ${this._renderBody()}
        </nav>
      `;
		}
	}
	__decorate([property({
		attribute: "items",
		converter: {
			fromAttribute: (value) => coerceItems(value),
			toAttribute: () => null
		},
		hasChanged: arrayHasChanged
	})], MonoMenuCoreClass.prototype, "items", void 0);
	__decorate([property({
		attribute: "model-value",
		reflect: true
	})], MonoMenuCoreClass.prototype, "modelValue", void 0);
	__decorate([property({
		reflect: true,
		converter: booleanStringConverter
	})], MonoMenuCoreClass.prototype, "multiple", void 0);
	__decorate([property({ type: String })], MonoMenuCoreClass.prototype, "density", void 0);
	__decorate([property({ type: String })], MonoMenuCoreClass.prototype, "color", void 0);
	__decorate([property({
		reflect: true,
		converter: booleanStringConverter
	})], MonoMenuCoreClass.prototype, "nav", void 0);
	__decorate([property({
		reflect: true,
		converter: booleanStringConverter
	})], MonoMenuCoreClass.prototype, "selectable", void 0);
	__decorate([property({
		reflect: true,
		converter: booleanStringConverter
	})], MonoMenuCoreClass.prototype, "disabled", void 0);
	__decorate([property({
		reflect: true,
		converter: booleanStringConverter
	})], MonoMenuCoreClass.prototype, "controlled", void 0);
	__decorate([property({ attribute: false })], MonoMenuCoreClass.prototype, "cssClass", void 0);
	__decorate([property({ attribute: false })], MonoMenuCoreClass.prototype, "cssClassName", void 0);
	__decorate([state()], MonoMenuCoreClass.prototype, "_openGroups", void 0);
	return MonoMenuCoreClass;
};
//#endregion
//#region src/components/menu/menu.css?raw
var menu_default = "/* @unocss-include */\r\n\r\n/* =========================================================================\r\n   mono-menu — a port of Basecoat's sidebar NAVIGATION (basecoat-css@1.0.2,\r\n   vega style).\r\n\r\n   Basecoat has no standalone menu, but it has the thing a menu is: the list\r\n   inside `.sidebar nav` — a group, its rows, its headings and its separators.\r\n   That block is also the richest per-flavor surface in the whole vendor sheet,\r\n   so this port is where a flavor finally gets to say what a nav row looks like.\r\n\r\n   Styled by ATTRIBUTE, and the attributes mirror the element's props one for\r\n   one, so hand-written markup reads like the Lit / Vue tag:\r\n\r\n     <mono-menu density=\"compact\" color=\"success\" :nav=\"false\">\r\n     <nav mono-menu mono-density=\"compact\" mono-color=\"success\" mono-plain\r\n          role=\"navigation\">\r\n       <ul mono-list>\r\n         <li mono-item mono-active>\r\n           <a mono-action href=\"/\" aria-current=\"page\">\r\n             <span mono-icon>…</span>\r\n             <span mono-content>\r\n               <span mono-title>Dashboard</span>\r\n               <span mono-subtitle>Overview</span>\r\n             </span>\r\n             <span mono-badge=\"info\">3</span>\r\n           </a>\r\n         </li>\r\n         <li mono-divider role=\"separator\"></li>\r\n         <li mono-subheader>Section</li>\r\n       </ul>\r\n     </nav>\r\n\r\n   An absent attribute is the prop's default (`:not([mono-density])` =\r\n   comfortable, `:not([mono-color])` = primary, and `nav` defaults to TRUE so\r\n   `mono-plain` is what the other mode says). The old classes\r\n   (`.mono-menu.comfortable.primary.nav`) are still emitted as inert hooks\r\n   until 2.0 but no rule here reads them.\r\n\r\n   Selector map (ours ≡ upstream):\r\n     [mono-menu]        ≡ .sidebar nav > section > [role=group]\r\n                          (relative flex w-full min-w-0 flex-col, p-2 text-sm)\r\n     :where([mono-menu]) [mono-list]        ≡ .sidebar nav ul (flex w-full min-w-0 flex-col, gap-1)\r\n     :where([mono-menu]) [mono-item]        ≡ .sidebar nav li (relative)\r\n     :where([mono-menu]) [mono-action]      ≡ .sidebar nav li > :is(a, button) — the row\r\n     [mono-active]      ≡ [aria-current=page], [data-active=true]\r\n                          (bg-sidebar-accent text-sidebar-accent-foreground font-medium)\r\n     :where([mono-menu]) [mono-subheader]   ≡ .sidebar nav h3\r\n     :where([mono-menu]) [mono-divider]     ≡ .sidebar nav [role=separator] (border-sidebar-border mx-2 w-auto)\r\n     :where([mono-menu]) [mono-group-header]≡ details > summary — the same row, plus the chevron\r\n     [mono-density=…]   ≡ [data-size='sm' | default | 'lg'] (h-7 / h-8 / h-12)\r\n     :where([mono-menu]) [mono-badge]       ≡ .badge — EXTENSION (upstream's rows carry none)\r\n     :where([mono-menu]) [mono-subtitle]    ≡ EXTENSION ([&>span:last-child]:truncate is upstream's\r\n                          only nod to a second line)\r\n     [mono-color=…]     ≡ EXTENSION (upstream has one accent)\r\n\r\n   THE ACTIVE ROW IS A NEUTRAL WASH, not a brand gradient. Upstream paints it\r\n   `bg-sidebar-accent text-sidebar-accent-foreground font-medium` — a flat\r\n   surface tint. The pre-port sheet filled it with a two-stop brand gradient and\r\n   a coloured shadow; both are gone. `color` still tints hover and the active\r\n   row through `--mono-menu-accent`, and `color=\"surface\"` leaves it upstream's\r\n   plain `--sidebar-accent`.\r\n\r\n   DARK MODE comes free — every colour resolves through a Basecoat token that\r\n   already flips. A selector crosses neither the custom-element host nor the\r\n   shadow boundary, so no `.dark` rule can live in component CSS.\r\n\r\n   FLAVORS set `--mono-menu-{radius,pad-x,pad-y,height,font,gap,icon-size,\r\n   subheader-*,badge-*}` (+ the per-density forms); every fallback here is\r\n   vega's value (`node scripts/basecoat-styles.mjs --grep \"sidebar nav\"`).\r\n   ========================================================================= */\r\n\r\nmono-menu,\r\nmono-menu-list {\r\n  display: block;\r\n}\r\n\r\n/* =========================================\r\n   Root — the group\r\n   ========================================= */\r\n\r\n/* basecoat@1.0.2 components/sidebar.css .sidebar >> nav >> > section >> > [role=group] — relative flex w-full min-w-0 flex-col */\r\n/* basecoat@1.0.2 styles/vega.css .sidebar nav > section > [role=group] — p-2 text-sm */\r\n[mono-menu] {\r\n  /* ── the roles, each a public knob over a Basecoat token ────────────────── */\r\n  --_mono-menu-primary: var(--mono-menu-primary, var(--primary));\r\n  --_mono-menu-secondary: var(--mono-menu-secondary, var(--secondary-foreground));\r\n  --_mono-menu-success: var(--mono-menu-success, var(--success));\r\n  --_mono-menu-danger: var(--mono-menu-danger, var(--destructive));\r\n  --_mono-menu-warning: var(--mono-menu-warning, var(--warning));\r\n  --_mono-menu-info: var(--mono-menu-info, var(--info));\r\n  --_mono-menu-teal: var(--mono-menu-teal, var(--teal));\r\n  --_mono-menu-purple: var(--mono-menu-purple, var(--purple));\r\n  --_mono-menu-neutral: var(--mono-menu-neutral, var(--neutral));\r\n  --_mono-menu-dark: var(--mono-menu-dark, var(--dark));\r\n\r\n  --_mono-menu-accent: var(--mono-menu-accent, var(--_mono-menu-accent-preset, var(--_mono-menu-primary)));\r\n  --_mono-menu-on-accent: var(--mono-menu-on-accent, var(--_mono-menu-on-accent-preset, var(--primary-foreground)));\r\n\r\n  /* ── ink and surface — upstream's own chrome tokens ──────────────────────\r\n     basecoat@1.0.2 styles/vega.css .sidebar nav — bg-sidebar text-sidebar-foreground */\r\n  --_mono-menu-surface: var(--mono-menu-surface, transparent);\r\n  --_mono-menu-text: var(--mono-menu-text, var(--sidebar-foreground));\r\n  /* basecoat@1.0.2 styles/vega.css .sidebar nav h3 — text-sidebar-foreground/70 …:\r\n     upstream's muted chrome ink is the row ink at 70%. */\r\n  --_mono-menu-text-soft: var(--mono-menu-text-soft, color-mix(in oklab, var(--_mono-menu-text) 70%, transparent));\r\n  --_mono-menu-text-faint: var(--mono-menu-text-faint, color-mix(in oklab, var(--_mono-menu-text) 50%, transparent));\r\n  /* basecoat@1.0.2 styles/vega.css .sidebar nav [role=separator] — border-sidebar-border mx-2 */\r\n  --_mono-menu-border: var(--mono-menu-border, var(--sidebar-border));\r\n  --_mono-menu-border-lite: var(--mono-menu-border-lite, var(--_mono-menu-border));\r\n\r\n  /* ── the row's resting / hover / active paint ────────────────────────────\r\n     basecoat@1.0.2 styles/vega.css .sidebar nav li > :is(a, button), .sidebar nav li > details > summary — ring-sidebar-ring hover:bg-sidebar-accent hover:text-sidebar-accent-foreground active:bg-sidebar-accent active:text-sidebar-accent-foreground gap-2 rounded-md p-2 text-sm focus-visible:ring-2 text-left focus-visible:outline-hidden data-[open]:hover:bg-sidebar-accent data-[open]:hover:text-sidebar-accent-foreground [&>svg]:shrink-0 [&>svg]:size-4\r\n     Hover is a SURFACE wash upstream, not the brand — so the role only tints\r\n     it, at `--mono-mode-tint`, and `color=\"surface\"` leaves it exactly\r\n     `--sidebar-accent`. */\r\n  --_mono-menu-hover-tint: var(--mono-menu-hover-tint, var(--_mono-menu-hover-tint-preset, var(--mono-mode-tint)));\r\n  --_mono-menu-hover-bg: var(--mono-menu-hover-bg, color-mix(in oklab, var(--_mono-menu-accent) var(--_mono-menu-hover-tint), var(--sidebar-accent)));\r\n  --_mono-menu-hover-color: var(--mono-menu-hover-color, var(--sidebar-accent-foreground));\r\n  --_mono-menu-hover-border-color: var(--mono-menu-hover-border-color, transparent);\r\n\r\n  /* basecoat@1.0.2 styles/vega.css .sidebar nav li > :is(a, button):is([aria-current=page], [data-active=true]), .sidebar nav li > details > summary:is([aria-current=page], [data-active=true]) — bg-sidebar-accent text-sidebar-accent-foreground font-medium */\r\n  --_mono-menu-active-tint: var(--mono-menu-active-tint, var(--_mono-menu-active-tint-preset, var(--mono-mode-tint-hover)));\r\n  --_mono-menu-active-bg: var(--mono-menu-active-bg, color-mix(in oklab, var(--_mono-menu-accent) var(--_mono-menu-active-tint), var(--sidebar-accent)));\r\n  --_mono-menu-active-color: var(--mono-menu-active-color, var(--_mono-menu-active-color-preset, var(--_mono-menu-accent)));\r\n  --_mono-menu-active-weight: var(--mono-menu-active-weight, var(--mono-font-weight-medium));\r\n  /* the pre-port glow; upstream has none, so it starts at nothing */\r\n  --_mono-menu-active-shadow: var(--mono-menu-active-shadow, none);\r\n\r\n  /* ── comfortable metrics live on the unqualified root ON PURPOSE ─────────\r\n     basecoat@1.0.2 styles/vega.css .sidebar nav li > :is(a, button):not([data-size]), .sidebar nav li > details > summary:not([data-size]), .sidebar nav li > :is(a, button)[data-size=default], .sidebar nav li > details > summary[data-size=default] — h-8 text-sm */\r\n  --_mono-menu-height: var(--mono-menu-height, var(--_mono-menu-height-preset, var(--mono-menu-height-comfortable, calc(var(--mono-spacing) * 8))));\r\n  --_mono-menu-pad-x: var(--mono-menu-pad-x, var(--_mono-menu-pad-x-preset, var(--mono-menu-pad-x-comfortable, calc(var(--mono-spacing) * 2))));\r\n  --_mono-menu-pad-y: var(--mono-menu-pad-y, var(--_mono-menu-pad-y-preset, var(--mono-menu-pad-y-comfortable, calc(var(--mono-spacing) * 2))));\r\n  --_mono-menu-font: var(--mono-menu-font, var(--_mono-menu-font-preset, var(--mono-menu-font-comfortable, var(--mono-text-sm))));\r\n  --_mono-menu-line-height: var(--mono-menu-line-height, var(--_mono-menu-line-height-preset, var(--mono-text-sm--lh)));\r\n  /* basecoat@1.0.2 styles/vega.css .sidebar nav > section > [role=group] > ul — gap-1 */\r\n  --_mono-menu-gap: var(--mono-menu-gap, var(--_mono-menu-gap-preset, var(--mono-menu-gap-comfortable, var(--mono-spacing))));\r\n  /* the row's own gap — `gap-2` between icon, label and append */\r\n  --_mono-menu-row-gap: var(--mono-menu-row-gap, calc(var(--mono-spacing) * 2));\r\n  --_mono-menu-radius: var(--mono-menu-radius, var(--_mono-menu-radius-preset, var(--mono-menu-radius-comfortable, var(--mono-radius-md))));\r\n  /* `[&>svg]:size-4` */\r\n  --_mono-menu-icon-size: var(--mono-menu-icon-size, var(--_mono-menu-icon-size-preset, var(--mono-menu-icon-size-comfortable, calc(var(--mono-spacing) * 4))));\r\n  /* the group's own padding — `p-2` */\r\n  --_mono-menu-group-pad: var(--mono-menu-group-pad, var(--_mono-menu-group-pad-preset, var(--mono-menu-group-pad-comfortable, calc(var(--mono-spacing) * 2))));\r\n  /* ── the nested tree — EXTENSION ─────────────────────────────────────────\r\n     Upstream nests a list and leaves it flush — `.sidebar nav … ul > ul` is only\r\n     `flex min-w-0 flex-col` — so a child list reads as one straight column with\r\n     its parent. mono keeps its pre-port tree affordance instead: a child list\r\n     steps in by one gutter and hangs off a guide rule drawn under the centre of\r\n     the parent row's icon, so depth is legible without reading the labels. */\r\n  --_mono-menu-indent: var(--mono-menu-indent, var(--_mono-menu-indent-preset, var(--mono-menu-indent-comfortable, calc(var(--mono-spacing) * 4))));\r\n  --_mono-menu-guide-width: var(--mono-menu-guide-width, var(--mono-border-width));\r\n  --_mono-menu-guide-color: var(--mono-menu-guide-color, var(--_mono-menu-border-lite));\r\n  /* the guide lines up with the middle of the parent row's icon */\r\n  --_mono-menu-guide-offset: var(--mono-menu-guide-offset, calc(var(--_mono-menu-pad-x) + (var(--_mono-menu-icon-size) / 2)));\r\n\r\n  /* ── the subheader — `.sidebar nav h3` ───────────────────────────────────\r\n     basecoat@1.0.2 styles/vega.css .sidebar nav h3 — text-sidebar-foreground/70 ring-sidebar-ring h-8 rounded-md px-2 text-xs font-medium focus-visible:ring-2 [&>svg]:size-4 transition-[margin,opacity] duration-200 ease-linear */\r\n  --_mono-menu-subheader-height: var(--mono-menu-subheader-height, calc(var(--mono-spacing) * 8));\r\n  --_mono-menu-subheader-pad-x: var(--mono-menu-subheader-pad-x, var(--_mono-menu-subheader-pad-x-preset, calc(var(--mono-spacing) * 2)));\r\n  --_mono-menu-subheader-font: var(--mono-menu-subheader-font, var(--mono-text-xs));\r\n  --_mono-menu-subheader-weight: var(--mono-menu-subheader-weight, var(--mono-font-weight-medium));\r\n  --_mono-menu-subheader-transform: var(--mono-menu-subheader-transform, none);\r\n  --_mono-menu-subheader-tracking: var(--mono-menu-subheader-tracking, normal);\r\n  --_mono-menu-subheader-radius: var(--mono-menu-subheader-radius, var(--_mono-menu-subheader-radius-preset, var(--mono-radius-md)));\r\n\r\n  /* ── the badge — EXTENSION, borrowing `.badge`'s shape ───────────────────\r\n     basecoat@1.0.2 styles/vega.css .badge — h-5 gap-1 rounded-4xl border border-transparent px-2 py-0.5 text-xs font-medium transition-all [&>svg]:size-3! */\r\n  --_mono-menu-badge-height: var(--mono-menu-badge-height, calc(var(--mono-spacing) * 5));\r\n  --_mono-menu-badge-pad-x: var(--mono-menu-badge-pad-x, calc(var(--mono-spacing) * 2));\r\n  --_mono-menu-badge-radius: var(--mono-menu-badge-radius, var(--mono-radius-4xl));\r\n  --_mono-menu-badge-font: var(--mono-menu-badge-font, var(--mono-text-xs));\r\n  --_mono-menu-badge-weight: var(--mono-menu-badge-weight, var(--mono-font-weight-medium));\r\n  --_mono-menu-badge-bg: var(--mono-menu-badge-bg, var(--secondary));\r\n  --_mono-menu-badge-color: var(--mono-menu-badge-color, var(--secondary-foreground));\r\n\r\n  /* the two knobs a rail collapses with — the sidebar writes them */\r\n  /* ── the rail-collapse contract ──────────────────────────────────────────\r\n     A sidebar in collapsed rail mode hands these down as inherited custom\r\n     properties, because a descendant selector cannot reach a slotted SHADOW\r\n     menu's rows. Every one of them has to be consumed here or the collapse\r\n     only happens in the build the sidebar's own legacy class rules could\r\n     reach — which is exactly how the light build ended up centring its rows\r\n     while the shadow build and the hand-written twins did not. */\r\n  --_mono-menu-label-display: var(--mono-menu-label-display, inline-flex);\r\n  /* the same switch, for the parts whose natural display is block-level */\r\n  --_mono-menu-block-display: var(--mono-menu-label-display, list-item);\r\n  --_mono-menu-row-display: var(--mono-menu-row-display, list-item);\r\n  --_mono-menu-row-justify: var(--mono-menu-row-justify, normal);\r\n  --_mono-menu-action-width: var(--mono-menu-action-width, 100%);\r\n  --_mono-menu-action-justify: var(--mono-menu-action-justify, flex-start);\r\n  --_mono-menu-action-gap: var(--mono-menu-action-gap, var(--_mono-menu-row-gap));\r\n\r\n  position: relative;\r\n  display: flex;\r\n  flex-direction: column;\r\n  width: 100%;\r\n  min-width: 0;\r\n  padding: var(--_mono-menu-group-pad);\r\n  font-family: inherit;\r\n  font-size: var(--_mono-menu-font);\r\n  color: var(--_mono-menu-text);\r\n  background: var(--_mono-menu-surface);\r\n}\r\n\r\n[mono-menu],\r\n:where([mono-menu]) *,\r\n:where([mono-menu]) *::before,\r\n:where([mono-menu]) *::after {\r\n  box-sizing: border-box;\r\n}\r\n\r\n/* =========================================\r\n   Density — upstream's `data-size` ladder\r\n   ========================================= */\r\n\r\n/* basecoat@1.0.2 styles/vega.css .sidebar nav li > :is(a, button)[data-size=sm], .sidebar nav li > details > summary[data-size=sm] — h-7 text-xs */\r\n[mono-menu][mono-density=\"compact\"] {\r\n  --_mono-menu-height-preset: var(--mono-menu-height-compact, calc(var(--mono-spacing) * 7));\r\n  --_mono-menu-pad-x-preset: var(--mono-menu-pad-x-compact, calc(var(--mono-spacing) * 2));\r\n  --_mono-menu-pad-y-preset: var(--mono-menu-pad-y-compact, calc(var(--mono-spacing) * 1));\r\n  --_mono-menu-font-preset: var(--mono-menu-font-compact, var(--mono-text-xs));\r\n  --_mono-menu-line-height-preset: var(--mono-text-xs--lh);\r\n  --_mono-menu-gap-preset: var(--mono-menu-gap-compact, calc(var(--mono-spacing) * 0.5));\r\n  --_mono-menu-icon-size-preset: var(--mono-menu-icon-size-compact, calc(var(--mono-spacing) * 3.5));\r\n  --_mono-menu-group-pad-preset: var(--mono-menu-group-pad-compact, calc(var(--mono-spacing) * 1.5));\r\n  --_mono-menu-indent-preset: var(--mono-menu-indent-compact, calc(var(--mono-spacing) * 3.5));\r\n}\r\n\r\n/* basecoat@1.0.2 styles/vega.css .sidebar nav li > :is(a, button)[data-size=lg], .sidebar nav li > details > summary[data-size=lg] — h-12 text-sm */\r\n[mono-menu][mono-density=\"default\"] {\r\n  --_mono-menu-height-preset: var(--mono-menu-height-default, calc(var(--mono-spacing) * 12));\r\n  --_mono-menu-pad-x-preset: var(--mono-menu-pad-x-default, calc(var(--mono-spacing) * 2));\r\n  --_mono-menu-pad-y-preset: var(--mono-menu-pad-y-default, calc(var(--mono-spacing) * 2));\r\n  --_mono-menu-font-preset: var(--mono-menu-font-default, var(--mono-text-sm));\r\n  --_mono-menu-gap-preset: var(--mono-menu-gap-default, calc(var(--mono-spacing) * 1.5));\r\n  --_mono-menu-icon-size-preset: var(--mono-menu-icon-size-default, calc(var(--mono-spacing) * 5));\r\n  --_mono-menu-group-pad-preset: var(--mono-menu-group-pad-default, calc(var(--mono-spacing) * 3));\r\n  --_mono-menu-indent-preset: var(--mono-menu-indent-default, calc(var(--mono-spacing) * 4.5));\r\n}\r\n\r\n/* =========================================\r\n   Colours — EXTENSION: the role TINTS upstream's neutral wash\r\n   ========================================= */\r\n\r\n[mono-menu][mono-color=\"primary\"] {\r\n  --_mono-menu-accent-preset: var(--_mono-menu-primary);\r\n  --_mono-menu-on-accent-preset: var(--primary-foreground);\r\n}\r\n[mono-menu][mono-color=\"secondary\"] {\r\n  --_mono-menu-accent-preset: var(--_mono-menu-secondary);\r\n  --_mono-menu-on-accent-preset: var(--secondary);\r\n}\r\n[mono-menu][mono-color=\"success\"] {\r\n  --_mono-menu-accent-preset: var(--_mono-menu-success);\r\n  --_mono-menu-on-accent-preset: var(--success-foreground);\r\n}\r\n[mono-menu][mono-color=\"danger\"] {\r\n  --_mono-menu-accent-preset: var(--_mono-menu-danger);\r\n  --_mono-menu-on-accent-preset: var(--destructive-foreground);\r\n}\r\n[mono-menu][mono-color=\"warning\"] {\r\n  --_mono-menu-accent-preset: var(--_mono-menu-warning);\r\n  --_mono-menu-on-accent-preset: var(--warning-foreground);\r\n}\r\n[mono-menu][mono-color=\"info\"] {\r\n  --_mono-menu-accent-preset: var(--_mono-menu-info);\r\n  --_mono-menu-on-accent-preset: var(--info-foreground);\r\n}\r\n[mono-menu][mono-color=\"teal\"] {\r\n  --_mono-menu-accent-preset: var(--_mono-menu-teal);\r\n  --_mono-menu-on-accent-preset: var(--teal-foreground);\r\n}\r\n[mono-menu][mono-color=\"purple\"] {\r\n  --_mono-menu-accent-preset: var(--_mono-menu-purple);\r\n  --_mono-menu-on-accent-preset: var(--purple-foreground);\r\n}\r\n[mono-menu][mono-color=\"neutral\"] {\r\n  --_mono-menu-accent-preset: var(--_mono-menu-neutral);\r\n  --_mono-menu-on-accent-preset: var(--neutral-foreground);\r\n}\r\n[mono-menu][mono-color=\"dark\"] {\r\n  --_mono-menu-accent-preset: var(--_mono-menu-dark);\r\n  --_mono-menu-on-accent-preset: var(--dark-foreground);\r\n}\r\n\r\n/* `surface` is upstream exactly: the wash is `--sidebar-accent`, untinted, and\r\n   the active row is inked `--sidebar-accent-foreground` rather than a role. */\r\n[mono-menu][mono-color=\"surface\"] {\r\n  --_mono-menu-hover-tint-preset: 0%;\r\n  --_mono-menu-active-tint-preset: 0%;\r\n  --_mono-menu-active-color-preset: var(--sidebar-accent-foreground);\r\n}\r\n\r\n/* =========================================\r\n   The list\r\n   ========================================= */\r\n\r\n/* basecoat@1.0.2 components/sidebar.css .sidebar >> nav >> > section >> ul — flex w-full min-w-0 flex-col */\r\n/* basecoat@1.0.2 styles/vega.css .sidebar nav > section > [role=group] > ul — gap-1\r\n   The root is in the selector so `.vp-doc ul, .vp-doc ol` (0,1,1) cannot inject\r\n   the left padding that would break a flush menu. */\r\n:where([mono-menu]) [mono-list] {\r\n  display: flex;\r\n  flex-direction: column;\r\n  width: 100%;\r\n  min-width: 0;\r\n  gap: var(--_mono-menu-gap);\r\n  margin: 0;\r\n  padding: 0;\r\n  list-style: none;\r\n}\r\n\r\n/* basecoat@1.0.2 components/sidebar.css .sidebar >> nav >> > section >> ul >> ul — flex min-w-0 flex-col\r\n   Upstream stops at the flex column. The rest is mono's own tree affordance:\r\n   the child list is pushed in under the parent row's icon, hangs off a guide\r\n   rule, and clears the row above it by one list gap — a nested `ul` is a block\r\n   child of its `li`, so the parent list's `gap` never reaches it.\r\n\r\n   `:has(> *)` because a declarative row always renders its children list, even\r\n   with no children in it: an empty one would otherwise hang a guide off every\r\n   leaf row and push the next row down by a gap. */\r\n:where([mono-menu]) [mono-list] [mono-list]:has(> *) {\r\n  width: auto;\r\n  margin-top: var(--_mono-menu-gap);\r\n  margin-inline-start: var(--_mono-menu-guide-offset);\r\n  padding-inline-start: var(--_mono-menu-indent);\r\n  border-inline-start: var(--_mono-menu-guide-width) solid var(--_mono-menu-guide-color);\r\n}\r\n\r\n/* The DECLARATIVE body (`slot=\"body\"` + `<mono-menu-list>`). Each top-level\r\n   row renders its own `<ul mono-list>`, so they are siblings of one another\r\n   rather than `li`s of one list — nothing was left to carry the row gap, and a\r\n   declarative menu's top-level rows sat flush while an items-driven one (and\r\n   every hand-written twin) spaced them. Lay the body out as the list would, and\r\n   dissolve the element the author hung `slot=\"body\"` on so the rows become its\r\n   own children. */\r\n:where([mono-menu]) [mono-body] {\r\n  display: flex;\r\n  flex-direction: column;\r\n  width: 100%;\r\n  min-width: 0;\r\n  gap: var(--_mono-menu-gap);\r\n}\r\n\r\n:where([mono-menu]) [mono-body] > [mono-slotted] {\r\n  display: contents;\r\n}\r\n\r\n/* basecoat@1.0.2 components/sidebar.css .sidebar >> nav >> > section >> ul >> li — relative */\r\n:where([mono-menu]) [mono-item] {\r\n  position: relative;\r\n  display: var(--_mono-menu-row-display);\r\n  justify-content: var(--_mono-menu-row-justify);\r\n  margin: 0;\r\n  padding: 0;\r\n  list-style: none;\r\n}\r\n\r\n/* =========================================\r\n   The row\r\n   ========================================= */\r\n\r\n/* basecoat@1.0.2 components/sidebar.css .sidebar >> nav >> > section >> ul >> li >> > a, > button, > details > summary — flex w-full items-center overflow-hidden text-left outline-hidden transition-[width,height,padding] disabled:pointer-events-none disabled:opacity-50 aria-disabled:pointer-events-none aria-disabled:opacity-50 [&>span:last-child]:truncate [&>svg]:shrink-0 */\r\n/* basecoat@1.0.2 styles/vega.css .sidebar nav li > :is(a, button), .sidebar nav li > details > summary — ring-sidebar-ring hover:bg-sidebar-accent hover:text-sidebar-accent-foreground active:bg-sidebar-accent active:text-sidebar-accent-foreground gap-2 rounded-md p-2 text-sm focus-visible:ring-2 text-left focus-visible:outline-hidden data-[open]:hover:bg-sidebar-accent data-[open]:hover:text-sidebar-accent-foreground [&>svg]:shrink-0 [&>svg]:size-4 */\r\n:where([mono-menu]) :is([mono-action], [mono-group-header]) {\r\n  display: flex;\r\n  align-items: center;\r\n  justify-content: var(--_mono-menu-action-justify);\r\n  gap: var(--_mono-menu-action-gap);\r\n  width: var(--_mono-menu-action-width);\r\n  min-height: var(--_mono-menu-height);\r\n  padding: var(--_mono-menu-pad-y) var(--_mono-menu-pad-x);\r\n  border: var(--mono-border-width) solid transparent;\r\n  border-radius: var(--_mono-menu-radius);\r\n  background: transparent;\r\n  color: inherit;\r\n  font: inherit;\r\n  font-size: var(--_mono-menu-font);\r\n  line-height: var(--_mono-menu-line-height);\r\n  text-align: left;\r\n  text-decoration: none;\r\n  overflow: hidden;\r\n  cursor: pointer;\r\n  outline: none;\r\n  transition:\r\n    background-color var(--mono-duration) var(--mono-ease),\r\n    color var(--mono-duration) var(--mono-ease),\r\n    border-color var(--mono-duration) var(--mono-ease);\r\n}\r\n\r\n/* VitePress's `.vp-doc a` (0,1,1) underlines and re-inks every link. */\r\n[mono-menu] a[mono-action] {\r\n  text-decoration: none;\r\n  color: inherit;\r\n}\r\n\r\n[mono-menu] a[mono-action]::after {\r\n  display: none !important;\r\n}\r\n\r\n@media (hover: hover) {\r\n  [mono-menu] :is([mono-action], [mono-group-header]):hover {\r\n    background: var(--_mono-menu-hover-bg);\r\n    color: var(--_mono-menu-hover-color);\r\n    border-color: var(--_mono-menu-hover-border-color);\r\n  }\r\n}\r\n\r\n/* `focus-visible:ring-2` on `ring-sidebar-ring` */\r\n[mono-menu] :is([mono-action], [mono-group-header]):focus-visible {\r\n  outline: none;\r\n  box-shadow: 0 0 0 var(--mono-ring-width)\r\n    color-mix(in oklab, var(--sidebar-ring, var(--ring)) var(--mono-ring-alpha), transparent);\r\n}\r\n\r\n/* basecoat@1.0.2 styles/vega.css .sidebar nav li > :is(a, button):is([aria-current=page], [data-active=true]), .sidebar nav li > details > summary:is([aria-current=page], [data-active=true]) — bg-sidebar-accent text-sidebar-accent-foreground font-medium\r\n   A flat wash and a weight step — NOT the pre-port brand gradient and glow. */\r\n[mono-menu] [mono-item][mono-active] > :is([mono-action], [mono-group-header]) {\r\n  background: var(--_mono-menu-active-bg);\r\n  color: var(--_mono-menu-active-color);\r\n  font-weight: var(--_mono-menu-active-weight);\r\n  box-shadow: var(--_mono-menu-active-shadow);\r\n}\r\n\r\n/* `disabled:pointer-events-none disabled:opacity-50 aria-disabled:…` */\r\n[mono-menu] [mono-item][mono-disabled] > :is([mono-action], [mono-group-header]),\r\n[mono-menu] :is([mono-action], [mono-group-header]):disabled,\r\n[mono-menu][mono-disabled] :is([mono-action], [mono-group-header]) {\r\n  opacity: var(--mono-disabled-opacity, 0.5);\r\n  pointer-events: none;\r\n  cursor: not-allowed;\r\n}\r\n\r\n/* `plain` — the non-`nav` mode: rows read as list entries, not links. */\r\n[mono-menu][mono-plain] :is([mono-action], [mono-group-header]) {\r\n  border-radius: 0;\r\n}\r\n\r\n/* =========================================\r\n   Row content\r\n   ========================================= */\r\n\r\n/* `[&>svg]:shrink-0 [&>svg]:size-4` */\r\n:where([mono-menu]) [mono-icon] {\r\n  flex-shrink: 0;\r\n  display: inline-flex;\r\n  align-items: center;\r\n  justify-content: center;\r\n  width: var(--_mono-menu-icon-size);\r\n  height: var(--_mono-menu-icon-size);\r\n  font-size: var(--_mono-menu-icon-size);\r\n  line-height: 1;\r\n}\r\n\r\n/* Three shapes end up inside the box and all must fill it:\r\n     shadow build, user-slotted → <slot> → ::slotted(svg)\r\n     light build, user-slotted  → <span data-mono-slot=\"icon-<id>\"> → svg\r\n     inline `item.icon` markup  → a direct child svg\r\n   The light placeholder parks the captured child, so the SVG is a GRANDchild\r\n   and a `> svg` rule misses it entirely. */\r\n[mono-menu] [mono-icon] > svg,\r\n[mono-menu] [mono-icon] > [data-mono-slot] > svg,\r\n[mono-menu] [mono-icon] slot::slotted(svg) {\r\n  display: block;\r\n  width: 100%;\r\n  height: 100%;\r\n}\r\n\r\n[mono-menu] [mono-icon] > [data-mono-slot] {\r\n  display: contents;\r\n}\r\n\r\n/* Class + attribute = specificity (0,2,0), deliberately. UnoCSS's `i-…`\r\n   utilities set `width`/`height: 1.2em` (presetIcons `scale: 1.2`) at (0,1,0)\r\n   and their sheet loads AFTER this one, so a single selector loses and the\r\n   glyph overflows its box. Two selectors win regardless of sheet order — and it\r\n   is the only thing that works for the SHADOW build, where this span is a\r\n   LIGHT-DOM child of the host that no shadow-scoped selector can reach.\r\n   Scoped to the menu: its OWN class (every build sets it on the span — the shadow\r\n   build's span is a light-DOM child of the host, outside [mono-menu]) OR anything\r\n   inside a [mono-menu] root (raw CSS markup writes a bare\r\n   `<span mono-glyph class=\"i-…\">`). Still (0,2,0): `:is()` weighs its heaviest\r\n   argument. A bare `[mono-glyph][mono-glyph]` is global and stretched every other\r\n   component's `[mono-glyph]` to 100% — the accordion's icon chip filled its header. */\r\n:is(.mono-menu-iconify, [mono-menu] *)[mono-glyph] {\r\n  display: inline-block;\r\n  width: 100%;\r\n  height: 100%;\r\n  flex-shrink: 0;\r\n  color: inherit;\r\n}\r\n\r\n/* An `alias` icon is the placeholder a row shows when it has no glyph of its\r\n   own — a dimmed dot rather than a hole in the column. */\r\n[mono-menu] [mono-icon][mono-alias] {\r\n  opacity: 0.55;\r\n}\r\n\r\n/* `[&>span:last-child]:truncate` */\r\n:where([mono-menu]) [mono-content] {\r\n  display: var(--_mono-menu-label-display);\r\n  flex-direction: column;\r\n  justify-content: center;\r\n  min-width: 0;\r\n  flex: 1;\r\n  overflow: hidden;\r\n}\r\n\r\n:where([mono-menu]) [mono-title] {\r\n  overflow: hidden;\r\n  text-overflow: ellipsis;\r\n  white-space: nowrap;\r\n  font-size: inherit;\r\n  color: inherit;\r\n}\r\n\r\n:where([mono-menu]) [mono-subtitle] {\r\n  overflow: hidden;\r\n  text-overflow: ellipsis;\r\n  white-space: nowrap;\r\n  font-size: var(--mono-text-xs);\r\n  line-height: var(--mono-text-xs--lh);\r\n  color: var(--_mono-menu-text-soft);\r\n}\r\n\r\n:where([mono-menu]) [mono-append] {\r\n  flex-shrink: 0;\r\n  display: var(--_mono-menu-label-display);\r\n  align-items: center;\r\n  justify-content: center;\r\n  width: var(--_mono-menu-icon-size);\r\n  height: var(--_mono-menu-icon-size);\r\n  color: var(--_mono-menu-text-faint);\r\n}\r\n\r\n/* =========================================\r\n   Group — upstream's `<details><summary>`\r\n   ========================================= */\r\n\r\n/* basecoat@1.0.2 components/sidebar.css .sidebar >> nav >> > section >> ul >> li >> > details >> > summary >> &::after — ms-auto block size-3.5 bg-current content-[''] transition-transform ease-linear */\r\n:where([mono-menu]) [mono-chevron] {\r\n  flex-shrink: 0;\r\n  display: var(--_mono-menu-label-display);\r\n  align-items: center;\r\n  justify-content: center;\r\n  margin-inline-start: auto;\r\n  width: calc(var(--mono-spacing) * 3.5);\r\n  height: calc(var(--mono-spacing) * 3.5);\r\n  color: var(--_mono-menu-text-faint);\r\n  transition: rotate var(--mono-duration) linear;\r\n}\r\n\r\n/* basecoat@1.0.2 components/sidebar.css .sidebar >> nav >> > section >> ul >> li >> > details >> &:not([open]) >> > summary >> &::after — -rotate-90 rtl:rotate-90\r\n   Upstream's marker is a chevron-DOWN, so it rotates the CLOSED state a quarter\r\n   turn back to point along the reading direction. mono's marker is a\r\n   chevron-RIGHT, which already points that way at rest — so the rotation\r\n   belongs on the OPEN state instead. Taking upstream's rule literally left an\r\n   open group pointing right and a closed one pointing up. */\r\n[mono-menu] [mono-group][mono-open] > [mono-group-header] > [mono-chevron] {\r\n  rotate: 90deg;\r\n}\r\n\r\n[dir=\"rtl\"] [mono-menu] [mono-group]:not([mono-open]) > [mono-group-header] > [mono-chevron] {\r\n  rotate: 180deg;\r\n}\r\n\r\n[mono-menu] [mono-group]:not([mono-open]) > [mono-group-body] {\r\n  display: none;\r\n}\r\n\r\n[mono-menu] [mono-group] > [mono-group-body] {\r\n  display: var(--mono-menu-group-children-display, flex);\r\n}\r\n\r\n/* =========================================\r\n   Subheader and divider\r\n   ========================================= */\r\n\r\n/* basecoat@1.0.2 components/sidebar.css .sidebar >> nav >> > section >> h3 — flex shrink-0 items-center outline-hidden transition-[margin,opacity] duration-200 ease-linear [&>svg]:shrink-0 */\r\n/* basecoat@1.0.2 styles/vega.css .sidebar nav h3 — text-sidebar-foreground/70 ring-sidebar-ring h-8 rounded-md px-2 text-xs font-medium focus-visible:ring-2 [&>svg]:size-4 transition-[margin,opacity] duration-200 ease-linear */\r\n:where([mono-menu]) [mono-subheader] {\r\n  flex-shrink: 0;\r\n  display: var(--_mono-menu-label-display);\r\n  align-items: center;\r\n  height: var(--_mono-menu-subheader-height);\r\n  padding: 0 var(--_mono-menu-subheader-pad-x);\r\n  margin: 0;\r\n  border-radius: var(--_mono-menu-subheader-radius);\r\n  list-style: none;\r\n  font-size: var(--_mono-menu-subheader-font);\r\n  font-weight: var(--_mono-menu-subheader-weight);\r\n  text-transform: var(--_mono-menu-subheader-transform);\r\n  letter-spacing: var(--_mono-menu-subheader-tracking);\r\n  color: var(--_mono-menu-text-soft);\r\n}\r\n\r\n/* basecoat@1.0.2 components/sidebar.css .sidebar >> nav >> [role=separator] — w-auto */\r\n/* basecoat@1.0.2 styles/vega.css .sidebar nav [role=separator] — border-sidebar-border mx-2 */\r\n:where([mono-menu]) [mono-divider] {\r\n  display: var(--_mono-menu-block-display);\r\n  width: auto;\r\n  height: 0;\r\n  /* `mx-2` and nothing else: upstream gives the separator no block margin at\r\n     all, because it is a flex item of the list and the list's own `gap` already\r\n     spaces it from the rows either side. Adding a block margin on top double-\r\n     spaced it — and put the one property on this row that `.vp-doc li + li`\r\n     (0,1,2) could out-specify. */\r\n  margin-inline: calc(var(--mono-spacing) * 2);\r\n  padding: 0;\r\n  border: 0;\r\n  border-top: var(--mono-border-width) solid var(--_mono-menu-border-lite);\r\n  list-style: none;\r\n}\r\n\r\n/* =========================================\r\n   Badge — EXTENSION, borrowing `.badge`'s shape\r\n   ========================================= */\r\n\r\n/* basecoat@1.0.2 styles/vega.css .badge — h-5 gap-1 rounded-4xl border border-transparent px-2 py-0.5 text-xs font-medium transition-all [&>svg]:size-3! */\r\n:where([mono-menu]) [mono-badge] {\r\n  flex-shrink: 0;\r\n  display: var(--_mono-menu-label-display);\r\n  align-items: center;\r\n  justify-content: center;\r\n  gap: var(--mono-spacing);\r\n  margin-inline-start: auto;\r\n  height: var(--_mono-menu-badge-height);\r\n  padding: 0 var(--_mono-menu-badge-pad-x);\r\n  border: var(--mono-border-width) solid transparent;\r\n  border-radius: var(--_mono-menu-badge-radius);\r\n  font-size: var(--_mono-menu-badge-font);\r\n  font-weight: var(--_mono-menu-badge-weight);\r\n  line-height: 1;\r\n  background: var(--_mono-menu-badge-bg);\r\n  color: var(--_mono-menu-badge-color);\r\n}\r\n\r\n[mono-menu] [mono-badge=\"primary\"] {\r\n  background: color-mix(in oklab, var(--_mono-menu-primary) var(--mono-mode-tint), transparent);\r\n  color: var(--_mono-menu-primary);\r\n}\r\n[mono-menu] [mono-badge=\"success\"] {\r\n  background: color-mix(in oklab, var(--_mono-menu-success) var(--mono-mode-tint), transparent);\r\n  color: var(--_mono-menu-success);\r\n}\r\n[mono-menu] [mono-badge=\"danger\"] {\r\n  background: color-mix(in oklab, var(--_mono-menu-danger) var(--mono-mode-tint), transparent);\r\n  color: var(--_mono-menu-danger);\r\n}\r\n[mono-menu] [mono-badge=\"warning\"] {\r\n  background: color-mix(in oklab, var(--_mono-menu-warning) var(--mono-mode-tint), transparent);\r\n  color: var(--_mono-menu-warning);\r\n}\r\n[mono-menu] [mono-badge=\"info\"] {\r\n  background: color-mix(in oklab, var(--_mono-menu-info) var(--mono-mode-tint), transparent);\r\n  color: var(--_mono-menu-info);\r\n}\r\n\r\n/* =========================================\r\n   Reduced motion\r\n   ========================================= */\r\n\r\n@media (prefers-reduced-motion: reduce) {\r\n  [mono-menu] :is([mono-action], [mono-group-header], [mono-chevron]) {\r\n    transition: none;\r\n  }\r\n}\r\n";
//#endregion
//#region src/components/menu/mono-menu.ts
var MonoMenu = class MonoMenu extends MonoMenuCore(LitElement) {
	constructor(..._args) {
		super(..._args);
		this._slotsCaptured = false;
		this._hasBodySlot = false;
		this._slotBody = [];
	}
	static {
		this.styles = [unsafeCSS(menu_default)];
	}
	createRenderRoot() {
		return this;
	}
	connectedCallback() {
		super.connectedCallback();
		this._captureSlots();
		this._seedDefaultOpenGroups();
		if (this.isConnected) this.performUpdate();
	}
	_captureSlots() {
		if (this._slotsCaptured) return;
		this._slotsCaptured = true;
		const captured = monoHostChildNodes(this);
		const toRemove = /* @__PURE__ */ new Set();
		for (const node of captured) {
			if (!(node instanceof Element)) continue;
			const slotName = node.getAttribute("slot");
			if (!slotName) continue;
			if (slotName === "body") {
				node.removeAttribute("slot");
				node.setAttribute("mono-slotted", "");
				this._slotBody.push(node);
				toRemove.add(node);
				continue;
			}
			if (slotName.startsWith("icon-")) {
				const id = slotName.slice(5);
				if (!id) continue;
				node.removeAttribute("slot");
				const list = this._slotIcons.get(id) ?? [];
				list.push(node);
				this._slotIcons.set(id, list);
				toRemove.add(node);
			}
		}
		this._hasBodySlot = this._slotBody.length > 0;
		for (const node of toRemove) if (node.parentNode === this) this.removeChild(node);
	}
	updated(changed) {
		super.updated(changed);
		this._placeIconSlots();
		this._placeBodySlot();
		this._notifyListChildren(changed);
		this._orphanHolder = parkDetachedNodes(this._orphanHolder, [...[...this._slotIcons.values()].flat(), ...this._slotBody]);
	}
	_placeIconSlots() {
		if (!this._slotIcons.size) return;
		for (const [id, nodes] of this._slotIcons) {
			const target = this.querySelector(`[data-mono-slot="icon-${id}"]`);
			if (!target) continue;
			for (const node of nodes) placeSlotNode(target, node);
		}
	}
	_placeBodySlot() {
		if (!this._slotBody.length) return;
		const target = this.querySelector("[data-mono-slot=\"body\"]");
		if (!target) return;
		for (const node of this._slotBody) placeSlotNode(target, node);
	}
	/**
	* When any prop that influences the rendered content of descendant
	* `<mono-menu-list>` instances changes, ask each registered child to
	* re-render so they stay in lockstep with the parent.
	*/
	_notifyListChildren(changed) {
		if (!this._listChildren.size) return;
		if (![
			"modelValue",
			"_openGroups",
			"multiple",
			"density",
			"color",
			"cssClass",
			"cssClassName",
			"disabled",
			"selectable",
			"nav"
		].some((k) => changed.has(k))) return;
		for (const child of this._listChildren) child.requestUpdate();
	}
	/** Light body — declarative `slot="body"` placeholder, else items-driven. */
	_renderBody() {
		if (this._hasBodySlot) return html`<div class="mono-menu-body" mono-body data-mono-slot="body"></div>`;
		return super._renderBody();
	}
};
__decorate([state()], MonoMenu.prototype, "_slotsCaptured", void 0);
__decorate([state()], MonoMenu.prototype, "_hasBodySlot", void 0);
MonoMenu = __decorate([customElement("mono-menu")], MonoMenu);
//#endregion
//#region src/components/menu/mono-menu-list.ts
var autoMenuListId = 0;
var MonoMenuList = class MonoMenuList extends LitElement {
	constructor(..._args) {
		super(..._args);
		this.items = [];
		this.type = "children";
		this.title = "";
		this.subtitle = "";
		this.icon = "";
		this.appendIcon = "";
		this.href = "";
		this.disabled = false;
		this.defaultOpen = false;
		this._parent = null;
		this._parentList = null;
		this._rootList = null;
		this._nestedChildren = /* @__PURE__ */ new Set();
		this._capturedChildren = [];
		this._childrenCaptured = false;
		this._standaloneOpen = /* @__PURE__ */ new Set();
		this._childObserver = null;
		this._autoId = `mono-menu-list-item-${++autoMenuListId}`;
	}
	createRenderRoot() {
		return this;
	}
	connectedCallback() {
		super.connectedCallback();
		this._parent = this.closest("mono-menu");
		this._parentList = this.parentElement?.closest("mono-menu-list") ?? null;
		this._rootList = this._findRootList();
		if (this._parent) this._parent._registerListChild(this);
		if (this._parentList) this._parentList._registerNestedChild(this);
		this._captureInitialChildren();
		this._setupChildObserver();
		this._seedDefaultOpenIntoParent();
	}
	disconnectedCallback() {
		super.disconnectedCallback();
		if (this._parent) {
			this._parent._unregisterListChild(this);
			this._parent = null;
		}
		if (this._parentList) {
			this._parentList._unregisterNestedChild(this);
			this._parentList = null;
		}
		this._rootList = null;
		if (this._childObserver) {
			this._childObserver.disconnect();
			this._childObserver = null;
		}
		this._capturedChildren = this._capturedChildren.filter((node) => !node.parentNode || this.contains(node));
	}
	willUpdate(changed) {
		if ([
			"items",
			"item",
			"itemType",
			"type",
			"title",
			"subtitle",
			"icon",
			"appendIcon",
			"badge",
			"badgeColor",
			"href",
			"disabled",
			"defaultOpen"
		].some((key) => changed.has(key)) && this._parent) this._seedDefaultOpenIntoParent();
	}
	updated(_changed) {
		this._captureExternalSiblings();
		this._placeBodySlot();
	}
	getMenuItems() {
		return this._getEffectiveItems();
	}
	/** @internal called by a nested `<mono-menu-list>` from its connectedCallback. */
	_registerNestedChild(child) {
		this._nestedChildren.add(child);
	}
	/** @internal */
	_unregisterNestedChild(child) {
		this._nestedChildren.delete(child);
	}
	/** Standalone (no `<mono-menu>`) group-open queries — root-most list owns the set. */
	isGroupOpenStandalone(id) {
		return this._standaloneOpen.has(id);
	}
	/** Seed a default-open id into the standalone state set. */
	seedStandaloneOpen(id) {
		this._standaloneOpen.add(id);
	}
	toggleGroupStandalone(id) {
		if (this._standaloneOpen.has(id)) this._standaloneOpen.delete(id);
		else this._standaloneOpen.add(id);
		this.requestUpdate();
		for (const child of this._nestedChildren) child.requestUpdate();
	}
	_findRootList() {
		if (!this._parentList) return null;
		let cur = this._parentList;
		while (cur._parentList) cur = cur._parentList;
		return cur;
	}
	_captureInitialChildren() {
		if (this._childrenCaptured) return;
		this._childrenCaptured = true;
		for (const node of monoHostChildNodes(this)) {
			this._capturedChildren.push(node);
			if (node.parentNode === this) this.removeChild(node);
		}
	}
	/**
	* Capture external Element children that landed on the host AFTER Lit's
	* most recent render — typically because a framework (Vue/React) inserted
	* nodes via `v-for`, `v-if`, etc. We deliberately skip non-Element nodes
	* (text / comment) because Lit places its own marker comments around the
	* rendered region and stealing those breaks the part graph.
	*/
	_captureExternalSiblings() {
		const root = this.firstElementChild;
		let captured = false;
		for (const node of monoHostChildNodes(this)) {
			if (node === root) continue;
			if (node.nodeType !== Node.ELEMENT_NODE) continue;
			if (!this._capturedChildren.includes(node)) this._capturedChildren.push(node);
			if (node.parentNode === this) this.removeChild(node);
			captured = true;
		}
		return captured;
	}
	_setupChildObserver() {
		if (this._childObserver) return;
		this._childObserver = new MutationObserver(() => {
			const root = this.firstElementChild;
			for (const node of monoHostChildNodes(this)) {
				if (node === root) continue;
				if (node.nodeType !== Node.ELEMENT_NODE) continue;
				this.requestUpdate();
				return;
			}
		});
		this._childObserver.observe(this, {
			childList: true,
			subtree: false
		});
	}
	_placeBodySlot() {
		if (!this._capturedChildren.length) return;
		const target = this.querySelector("[data-mono-slot=\"body\"]");
		if (!target) return;
		for (const node of this._capturedChildren) placeSlotNode(target, node);
	}
	_hasCapturedChildren() {
		return this._capturedChildren.length > 0;
	}
	_hasDirectItemProps() {
		return !!(this.id || this.title || this.subtitle || this.icon || this.appendIcon || this.badge !== void 0 || this.href || this.itemType || this.type && this.type !== "children" || this.defaultOpen || this.disabled);
	}
	/**
	* Declarative mode: `type` describes MenuItem.type and the body is composed
	* from captured DOM children instead of `items`.
	*
	* The order of the checks is the contract. Captured children win outright —
	* they ARE the body. An explicit `items` array comes next, and specifically
	* BEATS direct props: the previous order returned `true` as soon as any direct
	* prop was set, so `<mono-menu-list type="group" title="Sales" :items.prop="kids">`
	* — the single-row form documented in the class header and in `MenuListProps` —
	* landed in declarative mode. `_buildDeclarativeItem()` drops `items` on
	* purpose, so that row rendered an empty `[data-mono-slot="body"]` nothing was
	* ever placed into, and `_buildDirectItem()` (the one branch that does carry
	* `items`) was unreachable.
	*
	* It doubles as a safety net for the element form: a group whose DOM children
	* never made it into `_capturedChildren` now falls back to its `items` array
	* rather than rendering a chevron over an empty body.
	*/
	_isDeclarativeMode() {
		if (this.item) return false;
		if (this._hasCapturedChildren()) return true;
		if (this.items.length) return false;
		return this._hasDirectItemProps();
	}
	_typeAsMenuItemType() {
		if (this.itemType) return this.itemType;
		switch (this.type) {
			case "item":
			case "children": return "item";
			case "group": return "group";
			case "divider": return "divider";
			case "subheader": return "subheader";
			default: return;
		}
	}
	_normalizeItem(item) {
		const title = item.title ?? "";
		const fallbackId = this.id || item.id || item.href || title.toLowerCase().trim().replace(/\s+/g, "-") || this._autoId;
		const normalized = { id: String(item.id ?? fallbackId) };
		if (item.type !== void 0) normalized.type = item.type;
		if (item.title !== void 0) normalized.title = item.title;
		if (item.subtitle !== void 0) normalized.subtitle = item.subtitle;
		if (item.icon !== void 0) normalized.icon = item.icon;
		if (item.appendIcon !== void 0) normalized.appendIcon = item.appendIcon;
		if (item.badge !== void 0) normalized.badge = item.badge;
		if (item.badgeColor !== void 0) normalized.badgeColor = item.badgeColor;
		if (item.href !== void 0) normalized.href = item.href;
		if (item.disabled !== void 0) normalized.disabled = item.disabled;
		if (item.items !== void 0) normalized.items = item.items;
		if (item.defaultOpen !== void 0) normalized.defaultOpen = item.defaultOpen;
		return normalized;
	}
	_buildDirectItem() {
		return this._normalizeItem({
			id: this.id || void 0,
			type: this._typeAsMenuItemType(),
			title: this.title || void 0,
			subtitle: this.subtitle || void 0,
			icon: this.icon || void 0,
			appendIcon: this.appendIcon || void 0,
			badge: this.badge,
			badgeColor: this.badgeColor,
			href: this.href || void 0,
			disabled: this.disabled,
			items: this.items.length ? this.items : void 0,
			defaultOpen: this.defaultOpen
		});
	}
	_buildDeclarativeItem() {
		return this._normalizeItem({
			id: this.id || void 0,
			type: this._typeAsMenuItemType(),
			title: this.title || void 0,
			subtitle: this.subtitle || void 0,
			icon: this.icon || void 0,
			appendIcon: this.appendIcon || void 0,
			badge: this.badge,
			badgeColor: this.badgeColor,
			href: this.href || void 0,
			disabled: this.disabled,
			defaultOpen: this.defaultOpen
		});
	}
	_getEffectiveItems() {
		if (this.item) {
			const normalized = this._normalizeItem(this.item);
			if (this.items.length) normalized.items = this.items;
			return [normalized];
		}
		if (this._isDeclarativeMode()) return [this._buildDeclarativeItem()];
		if (this._hasDirectItemProps()) return [this._buildDirectItem()];
		if (Array.isArray(this.items) && this.items.length) return this.items;
		return [];
	}
	_seedDefaultOpenIntoParent() {
		if (!this._parent) return;
		for (const id of collectDefaultOpenGroups(this._getEffectiveItems())) this._parent.expandGroup(id);
	}
	/**
	* A group is "active" while any descendant row is the selected one.
	* `renderMenuGroup` puts `.mono-menu-group.active` on such a header and
	* menu.css already styles it — the class simply never appeared, because
	* nothing supplied this callback.
	*/
	_hasSelectedDescendant(group, isSelected) {
		return (group.items ?? []).some((child) => isSelected(child.id) || this._hasSelectedDescendant(child, isSelected));
	}
	_buildContext(declarative) {
		const parent = this._parent;
		if (parent) return {
			multiple: parent.multiple,
			selectable: parent.selectable,
			disabled: parent.disabled,
			cssClass: parent.cssClass ?? {},
			bodySlot: declarative,
			isSelected: (id) => parent.isItemSelected(id),
			isGroupActive: (group) => this._hasSelectedDescendant(group, (id) => parent.isItemSelected(id)),
			isGroupOpen: (id) => parent.isGroupOpenPublic(id),
			getSlotIconNodes: (id) => parent.getSlotIconNodes(id),
			onItemClick: (item, e) => parent.requestItemActivation(item, e),
			onGroupToggle: (group, e) => parent.requestGroupToggle(group, e)
		};
		const stateOwner = this._rootList ?? this;
		return {
			multiple: false,
			selectable: true,
			disabled: false,
			cssClass: {},
			bodySlot: declarative,
			isSelected: () => false,
			isGroupActive: () => false,
			isGroupOpen: (id) => stateOwner.isGroupOpenStandalone(id),
			getSlotIconNodes: () => void 0,
			onItemClick: () => {},
			onGroupToggle: (group) => {
				stateOwner.toggleGroupStandalone(group.id);
			}
		};
	}
	_renderSingleRow(item, ctx) {
		if (item.type === "divider") return renderMenuDivider(item, ctx);
		if (item.type === "subheader") return renderMenuSubheader(item, ctx);
		if (item.type === "group") return renderMenuGroup(item, ctx);
		return renderMenuItemRow(item, ctx);
	}
	_seedDefaultOpenIntoStandalone(item) {
		if (this._parent) return;
		if (!isGroup(item) || !item.defaultOpen) return;
		(this._rootList ?? this).seedStandaloneOpen(item.id);
	}
	render() {
		if (this._isDeclarativeMode()) {
			const ctx = this._buildContext(true);
			const item = this._buildDeclarativeItem();
			this._seedDefaultOpenIntoStandalone(item);
			const row = this._renderSingleRow(item, ctx);
			if (this._parentList) return html`${row}`;
			return html`<ul class=${ctx.cssClass?.list ? `mono-menu-list ${ctx.cssClass.list}` : "mono-menu-list"} mono-list>${row}</ul>`;
		}
		const ctx = this._buildContext(false);
		const effectiveItems = this._getEffectiveItems();
		const listClass = ctx.cssClass?.list ? `mono-menu-list ${ctx.cssClass.list}` : "mono-menu-list";
		if (this.type === "group") {
			const groupItems = effectiveItems.filter((it) => isGroup(it));
			if (!this._parent) {
				for (const group of groupItems) if (group.defaultOpen) (this._rootList ?? this).seedStandaloneOpen(group.id);
			}
			return html`<ul class=${listClass} mono-list>${renderMenuGroupsOnly(groupItems, ctx)}</ul>`;
		}
		if (!this._parent) {
			const owner = this._rootList ?? this;
			for (const id of collectDefaultOpenGroups(effectiveItems)) owner.seedStandaloneOpen(id);
		}
		return html`<ul class=${listClass} mono-list>${renderMenuList(effectiveItems, ctx)}</ul>`;
	}
};
__decorate([property({
	attribute: false,
	hasChanged: arrayHasChanged
})], MonoMenuList.prototype, "items", void 0);
__decorate([property({ attribute: false })], MonoMenuList.prototype, "item", void 0);
__decorate([property({ type: String })], MonoMenuList.prototype, "type", void 0);
__decorate([property({ attribute: "item-type" })], MonoMenuList.prototype, "itemType", void 0);
__decorate([property({ type: String })], MonoMenuList.prototype, "title", void 0);
__decorate([property({ type: String })], MonoMenuList.prototype, "subtitle", void 0);
__decorate([property({ type: String })], MonoMenuList.prototype, "icon", void 0);
__decorate([property({ attribute: "append-icon" })], MonoMenuList.prototype, "appendIcon", void 0);
__decorate([property()], MonoMenuList.prototype, "badge", void 0);
__decorate([property({ attribute: "badge-color" })], MonoMenuList.prototype, "badgeColor", void 0);
__decorate([property({ type: String })], MonoMenuList.prototype, "href", void 0);
__decorate([property({ type: Boolean })], MonoMenuList.prototype, "disabled", void 0);
__decorate([property({
	attribute: "default-open",
	type: Boolean
})], MonoMenuList.prototype, "defaultOpen", void 0);
MonoMenuList = __decorate([customElement("mono-menu-list")], MonoMenuList);
//#endregion
export { MonoMenu, MonoMenuList, collectDefaultOpenGroups, findActivePath, findItem, generateMenuRootClasses, getMenuAlias, isDivider, isGroup, isIconifyClass, isItem, isSubheader, renderMenuAppend, renderMenuBadge, renderMenuDivider, renderMenuGroup, renderMenuGroupsOnly, renderMenuIcon, renderMenuItemRow, renderMenuList, renderMenuSubheader, validateMenuProps };
