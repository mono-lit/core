import { g as monoHostChildNodes } from "../mono-ui-kvLVIf1V.js";
import { t as customElement } from "../mono-element-CKcT0rwv.js";
import { t as __decorate } from "../decorate-DbYFpi8R.js";
import { a as parkDetachedNodes, s as placeSlotNode } from "../light-slots-B5Ck0t_E.js";
import { a as renderBreadcrumbItemRow, c as renderBreadcrumbSeparator, d as generateBreadcrumbRootClasses, f as resolveCurrentId, i as renderBreadcrumbIcon, n as MonoBreadcrumbCore, o as renderBreadcrumbItemsLeadingSep, p as validateBreadcrumbProps, r as renderBreadcrumbBadge, s as renderBreadcrumbList, t as MonoBreadcrumbListCore, u as findItemIndex } from "../breadcrumb-list-core-Dh68T8Cf.js";
import { LitElement, html } from "lit";
import { state } from "lit/decorators.js";

//#region src/components/breadcrumb/mono-breadcrumb.ts
let MonoBreadcrumb = class MonoBreadcrumb extends MonoBreadcrumbCore(LitElement) {
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
		if (this.isConnected) this.performUpdate();
	}
	updated(changed) {
		super.updated(changed);
		this._placeIconSlots();
		this._placeBodySlot();
		this._placeSeparatorSlots();
		this._notifyListChildren(changed);
		this._orphanHolder = parkDetachedNodes(this._orphanHolder, [
			...[...this._slotIcons.values()].flat(),
			...this._slotBody,
			...this._slotSeparator
		]);
	}
	_renderBody() {
		if (this._hasBodySlot) return html`<ol
        class=${this._cls("mono-breadcrumb-list", "list")}
        mono-list
        data-mono-slot="body"
      ></ol>`;
		return super._renderBody();
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
				this._slotBody.push(node);
				toRemove.add(node);
				continue;
			}
			if (slotName === "separator") {
				node.removeAttribute("slot");
				this._slotSeparator.push(node);
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
	_placeSeparatorSlots() {
		if (!this._slotSeparator.length) return;
		const targets = this.querySelectorAll("[data-mono-slot^=\"separator-\"]");
		if (!targets.length) return;
		targets.forEach((target, ti) => {
			for (const stale of Array.from(target.querySelectorAll(":scope > [data-mono-sep-clone]"))) stale.remove();
			this._slotSeparator.forEach((node, ni) => {
				if (ti === 0 && ni === 0) placeSlotNode(target, node);
				else {
					const clone = node.cloneNode(true);
					if (clone instanceof Element) clone.setAttribute("data-mono-sep-clone", "");
					target.appendChild(clone);
				}
			});
		});
	}
};
__decorate([state()], MonoBreadcrumb.prototype, "_slotsCaptured", void 0);
__decorate([state()], MonoBreadcrumb.prototype, "_hasBodySlot", void 0);
MonoBreadcrumb = __decorate([customElement("mono-breadcrumb")], MonoBreadcrumb);

//#endregion
//#region src/components/breadcrumb/mono-breadcrumb-list.ts
let MonoBreadcrumbList = class MonoBreadcrumbList extends MonoBreadcrumbListCore(LitElement) {
	constructor(..._args) {
		super(..._args);
		this._parent = null;
	}
	createRenderRoot() {
		return this;
	}
	connectedCallback() {
		super.connectedCallback();
		this._parent = this.closest("mono-breadcrumb");
		if (this._parent) this._parent._registerListChild(this);
	}
	disconnectedCallback() {
		super.disconnectedCallback();
		if (this._parent) {
			this._parent._unregisterListChild(this);
			this._parent = null;
		}
	}
	_buildContext() {
		const parent = this._parent;
		if (parent) return {
			cssClass: parent.cssClass ?? {},
			separator: parent.getSeparatorString(),
			hasSeparatorSlot: parent.hasSeparatorSlot(),
			disabled: parent.disabled,
			isCurrent: (id) => parent.isItemCurrent(id),
			getSlotIconNodes: (id) => parent.getSlotIconNodes(id),
			onItemClick: (item, index, e) => parent.requestItemActivation(item, index, e)
		};
		return super._buildContext();
	}
	render() {
		if (this._parent) {
			const ctx = this._buildContext();
			const effectiveItems = this._getEffectiveItems();
			return html`${renderBreadcrumbItemsLeadingSep(effectiveItems, ctx)}`;
		}
		return super.render();
	}
};
MonoBreadcrumbList = __decorate([customElement("mono-breadcrumb-list")], MonoBreadcrumbList);

//#endregion
export { MonoBreadcrumb, MonoBreadcrumbList, findItemIndex, generateBreadcrumbRootClasses, renderBreadcrumbBadge, renderBreadcrumbIcon, renderBreadcrumbItemRow, renderBreadcrumbItemsLeadingSep, renderBreadcrumbList, renderBreadcrumbSeparator, resolveCurrentId, validateBreadcrumbProps };