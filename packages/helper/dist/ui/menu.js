import { g as monoHostChildNodes } from "../mono-ui-kvLVIf1V.js";
import { t as customElement } from "../mono-element-CKcT0rwv.js";
import { a as defineHybridPropAliases, n as arrayHasChanged, r as booleanStringConverter, t as __decorate } from "../decorate-DbYFpi8R.js";
import { t as dispatchMonoEvent } from "../mono-event-CAZf0F_k.js";
import { t as isIconifyClass } from "../icon-ClxnYhBG.js";
import { a as parkDetachedNodes, s as placeSlotNode } from "../light-slots-B5Ck0t_E.js";
import { a as validateColorProp, i as isThemeColorToken, n as colorClassToken, r as customColorStyle, t as CUSTOM_COLOR_CLASS } from "../color-CEYYtRX-.js";
import { LitElement, html, isServer, nothing } from "lit";
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
	const groupClasses = [clsFor("mono-menu-group", "group", ctx.cssClass), ancestorActive ? "active" : ""].filter(Boolean).join(" ");
	return html`
    <li
      class=${groupClasses}
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
const MonoMenuCore = (superClass) => {
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
				const items = child.getMenuItems?.() ?? [];
				const found = findItem(items, id);
				if (found) return found;
			}
			return null;
		}
		_findAnyItem(id) {
			return findItem(this.items, id) ?? this._findRegisteredItem(id);
		}
		_getRegisteredActivePath(id) {
			for (const child of this._listChildren) {
				const items = child.getMenuItems?.() ?? [];
				const path = findActivePath(items, id);
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
			const raw = isThemeColorToken(this.color) || this.color === "surface" ? "" : this.color;
			return customColorStyle(raw, "menu");
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
//#region src/components/menu/mono-menu.ts
let MonoMenu = class MonoMenu extends MonoMenuCore(LitElement) {
	constructor(..._args) {
		super(..._args);
		this._slotsCaptured = false;
		this._hasBodySlot = false;
		this._slotBody = [];
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
let autoMenuListId = 0;
let MonoMenuList = class MonoMenuList extends LitElement {
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
			const listClass = ctx.cssClass?.list ? `mono-menu-list ${ctx.cssClass.list}` : "mono-menu-list";
			return html`<ul class=${listClass} mono-list>${row}</ul>`;
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