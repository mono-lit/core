import { g as monoHostChildNodes } from "../mono-ui-kvLVIf1V.js";
import { t as customElement } from "../mono-element-CKcT0rwv.js";
import { n as arrayHasChanged, t as __decorate } from "../decorate-DbYFpi8R.js";
import { t as isIconifyClass } from "../icon-BM9N-jOt.js";
import { a as parkDetachedNodes, s as placeSlotNode } from "../light-slots-B5Ck0t_E.js";
import { _ as isGroup, a as renderMenuGroup, b as validateMenuProps, c as renderMenuItemRow, d as collectDefaultOpenGroups, f as findActivePath, g as isDivider, h as getMenuAlias, i as renderMenuDivider, l as renderMenuList, m as generateMenuRootClasses, n as renderMenuAppend, o as renderMenuGroupsOnly, p as findItem, r as renderMenuBadge, s as renderMenuIcon, t as MonoMenuCore, u as renderMenuSubheader, v as isItem, y as isSubheader } from "../menu-core-DkAYuCZ2.js";
import { LitElement, html } from "lit";
import { property, state } from "lit/decorators.js";

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