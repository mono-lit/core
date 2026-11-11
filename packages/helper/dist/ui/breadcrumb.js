import { g as monoHostChildNodes } from "../mono-ui-kvLVIf1V.js";
import { t as customElement } from "../mono-element-CKcT0rwv.js";
import { a as defineHybridPropAliases, n as arrayHasChanged, r as booleanStringConverter, t as __decorate } from "../decorate-DbYFpi8R.js";
import { t as dispatchMonoEvent } from "../mono-event-CAZf0F_k.js";
import { t as isIconifyClass } from "../icon-ClxnYhBG.js";
import { a as parkDetachedNodes, s as placeSlotNode } from "../light-slots-B5Ck0t_E.js";
import { LitElement, html, isServer, nothing } from "lit";
import { property, state } from "lit/decorators.js";

//#region src/components/breadcrumb/breadcrumb-utils.ts
/**
* Coerce any `items` input to a `BreadcrumbItem[]`. Accepts an array (pass-through),
* a JSON string (`items='[...]'` attribute, or a string assigned to the PROPERTY —
* which is what nuxt-ssr-lit does when forwarding a Vue `:items="<json>"` binding
* to the SSR renderer), or anything else (→ `[]`).
*/
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
function findItem(items, id) {
	for (const item of items) if (item.id === id) return item;
	return null;
}
function findItemIndex(items, id) {
	for (let i = 0; i < items.length; i++) if (items[i].id === id) return i;
	return -1;
}
/**
* Resolve which breadcrumb item is the "current" segment.
* Priority: explicit `modelValue` → first item with `current: true` → last item.
*/
function resolveCurrentId(items, modelValue) {
	if (modelValue?.id) return modelValue.id;
	for (const item of items) if (item.current) return item.id;
	if (items.length) return items[items.length - 1].id;
	return "";
}
function generateBreadcrumbRootClasses(props) {
	return [
		"mono-breadcrumb",
		props.variant,
		props.size,
		props.color,
		props.truncate ? "truncate" : "",
		props.disabled ? "disabled" : "",
		props.cssClassName ?? "",
		props.rootExtra ?? ""
	].filter(Boolean).join(" ");
}
function validateBreadcrumbProps(props) {
	const errors = [];
	if (props.variant && ![
		"default",
		"contained",
		"underlined"
	].includes(props.variant)) errors.push(`Invalid variant: ${String(props.variant)}`);
	if (props.size && ![
		"xs",
		"sm",
		"md",
		"lg",
		"xl",
		"xxl"
	].includes(props.size)) errors.push(`Invalid size: ${String(props.size)}`);
	if (props.color && ![
		"primary",
		"secondary",
		"success",
		"danger",
		"warning",
		"info",
		"surface"
	].includes(props.color)) errors.push(`Invalid color: ${String(props.color)}`);
	return errors;
}
/**
* The Basecoat styling attributes for the breadcrumb ROOT, mirroring the props
* one for one. A prop at its DEFAULT emits nothing — `:not([mono-size])` is md,
* `:not([mono-color])` is primary, `:not([mono-variant])` is default — so the
* rendered DOM is also the shortest hand-written markup that paints the same
* (see breadcrumb.css). Shared so `<mono-breadcrumb>` and a standalone
* `<mono-breadcrumb-list>` cannot drift apart.
*/
function breadcrumbRootAttrs(props) {
	return {
		size: props.size === "md" ? null : props.size,
		color: props.color === "primary" ? null : props.color,
		variant: props.variant === "default" ? null : props.variant
	};
}

//#endregion
//#region src/components/breadcrumb/breadcrumb-render.ts
function clsFor(base, key, cssClass) {
	const extra = cssClass?.[key];
	return extra ? `${base} ${extra}` : base;
}
function renderBreadcrumbIcon(item, ctx) {
	const slotNodes = ctx.getSlotIconNodes(item.id);
	const hasSlot = !!(slotNodes && slotNodes.length);
	if (!hasSlot && !item.icon) return nothing;
	if (ctx.iconSlot && (hasSlot || isIconifyClass(item.icon))) return html`
      <span
        class=${clsFor("mono-breadcrumb-icon", "icon", ctx.cssClass)}
        mono-icon
        aria-hidden="true"
      >
        <slot name=${`icon-${item.id}`}></slot>
      </span>
    `;
	if (hasSlot) return html`
      <span
        class=${clsFor("mono-breadcrumb-icon", "icon", ctx.cssClass)}
        mono-icon
        aria-hidden="true"
      >
        <span data-mono-slot=${`icon-${item.id}`}></span>
      </span>
    `;
	if (isIconifyClass(item.icon)) return html`
      <span
        class=${clsFor("mono-breadcrumb-icon", "icon", ctx.cssClass)}
        mono-icon
        aria-hidden="true"
      >
        <span class=${`mono-breadcrumb-iconify ${item.icon}`} mono-glyph></span>
      </span>
    `;
	return html`
    <span
      class=${clsFor("mono-breadcrumb-icon", "icon", ctx.cssClass)}
      mono-icon
      aria-hidden="true"
    >
      ${item.icon}
    </span>
  `;
}
function renderBreadcrumbBadge(item, ctx) {
	if (item.badge === void 0 || item.badge === null || item.badge === "") return nothing;
	const colorClass = item.badgeColor && item.badgeColor !== "default" ? item.badgeColor : "";
	return html`
    <span
      class=${`${clsFor("mono-breadcrumb-badge", "badge", ctx.cssClass)} ${colorClass}`.trim()}
      mono-badge=${colorClass}
    >
      ${item.badge}
    </span>
  `;
}
function renderBreadcrumbItemRow(item, index, ctx) {
	const current = ctx.isCurrent(item.id);
	const itemClasses = [
		clsFor("mono-breadcrumb-item", "item", ctx.cssClass),
		current ? "current" : "",
		current && ctx.cssClass?.itemCurrent ? ctx.cssClass.itemCurrent : "",
		item.disabled ? "disabled" : "",
		item.disabled && ctx.cssClass?.itemDisabled ? ctx.cssClass.itemDisabled : ""
	].filter(Boolean).join(" ");
	const itemAttrs = {
		current,
		disabled: !!item.disabled
	};
	const inner = html`
    ${renderBreadcrumbIcon(item, ctx)}
    <span class=${clsFor("mono-breadcrumb-content", "content", ctx.cssClass)} mono-content>
      <span class=${clsFor("mono-breadcrumb-title", "title", ctx.cssClass)} mono-title>
        ${item.title ?? item.id}
      </span>
    </span>
    ${renderBreadcrumbBadge(item, ctx)}
  `;
	if (current) return html`
      <li
        class=${itemClasses}
        mono-item
        ?mono-current=${itemAttrs.current}
        ?mono-disabled=${itemAttrs.disabled}
        aria-current="page"
      >
        <span
          class=${clsFor("mono-breadcrumb-action", "action", ctx.cssClass)}
          mono-action
          aria-disabled=${item.disabled ? "true" : "false"}
        >
          ${inner}
        </span>
      </li>
    `;
	if (item.href) return html`
      <li class=${itemClasses} mono-item ?mono-disabled=${itemAttrs.disabled}>
        <a
          class=${clsFor("mono-breadcrumb-action", "action", ctx.cssClass)}
          mono-action
          href=${item.href}
          aria-disabled=${item.disabled ? "true" : "false"}
          @click=${(e) => ctx.onItemClick(item, index, e)}
        >
          ${inner}
        </a>
      </li>
    `;
	return html`
    <li class=${itemClasses} mono-item ?mono-disabled=${itemAttrs.disabled}>
      <button
        type="button"
        class=${clsFor("mono-breadcrumb-action", "action", ctx.cssClass)}
        mono-action
        aria-disabled=${item.disabled ? "true" : "false"}
        ?disabled=${item.disabled || ctx.disabled}
        @click=${(e) => ctx.onItemClick(item, index, e)}
      >
        ${inner}
      </button>
    </li>
  `;
}
function renderBreadcrumbSeparator(ctx, index) {
	if (ctx.hasSeparatorSlot) return html`
      <li
        class=${clsFor("mono-breadcrumb-sep", "separator", ctx.cssClass)}
        mono-separator
        aria-hidden="true"
      >
        <span data-mono-slot=${`separator-${index}`}></span>
      </li>
    `;
	return html`
    <li
      class=${clsFor("mono-breadcrumb-sep", "separator", ctx.cssClass)}
      mono-separator
      aria-hidden="true"
    >
      ${ctx.separator}
    </li>
  `;
}
function renderBreadcrumbList(items, ctx) {
	const out = [];
	items.forEach((item, index) => {
		if (index > 0) out.push(renderBreadcrumbSeparator(ctx, index));
		out.push(renderBreadcrumbItemRow(item, index, ctx));
	});
	return out;
}
/**
* Render items with a leading separator BEFORE each item — used when the child
* `<mono-breadcrumb-list>` is composed inside a parent `<mono-breadcrumb>` and
* we don't know whether this child is the first sibling. The very first
* separator is hidden via CSS:
*   `.mono-breadcrumb-list > mono-breadcrumb-list:first-child > .mono-breadcrumb-sep:first-child { display: none; }`
*/
function renderBreadcrumbItemsLeadingSep(items, ctx, startIndex = 0) {
	const out = [];
	items.forEach((item, i) => {
		const index = startIndex + i;
		out.push(renderBreadcrumbSeparator(ctx, index));
		out.push(renderBreadcrumbItemRow(item, index, ctx));
	});
	return out;
}

//#endregion
//#region src/components/breadcrumb/breadcrumb-core.ts
/**
* `MonoBreadcrumbCore` — all render-mode-agnostic logic for `mono-breadcrumb`:
* reactive props (incl. the SSR `items` string→array coercion), hybrid aliases,
* camelCase attribute fallbacks, the child-list registry + state propagation,
* item activation + events, and the `<nav>` chrome `render()`. The light build
* keeps its `[data-mono-slot]` capture (`slot="body"`/`separator`/`icon-*`) and
* overrides `_renderBody()`; the shadow build renders the whole list from `items`
* in one shadow root and overrides `_useIconSlots()` (mirrors `mono-menu`).
*
* SSR-safe: no `document`/`window` access except `focus()` (guarded by isServer).
*/
const MonoBreadcrumbCore = (superClass) => {
	class MonoBreadcrumbCoreClass extends superClass {
		constructor(...args) {
			super(...args);
			this.items = [];
			this.modelValue = null;
			this.variant = "default";
			this.size = "md";
			this.color = "primary";
			this.separator = "›";
			this.truncate = false;
			this.disabled = false;
			this.ariaLabel = "Breadcrumb";
			this.cssClass = {};
			this.cssClassName = "";
			this._slotIcons = /* @__PURE__ */ new Map();
			this._slotSeparator = [];
			this._listChildren = /* @__PURE__ */ new Set();
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
				"model-value",
				"css-class",
				"cssclass"
			];
		}
		attributeChangedCallback(name, oldValue, newValue) {
			super.attributeChangedCallback(name, oldValue, newValue);
			if (oldValue === newValue) return;
			if (name === "modelvalue" || name === "model-value") {
				this._setModelValueFromAttribute(newValue);
				return;
			}
			if (name === "css-class" || name === "cssclass") this._setCssClass(newValue);
		}
		willUpdate(changed) {
			if (typeof this.items === "string") this.items = coerceItems(this.items);
			if (typeof this.modelValue === "string") this._setModelValueFromAttribute(this.modelValue);
			super.willUpdate(changed);
		}
		_setModelValueFromAttribute(value) {
			if (value == null || value === "") {
				this.modelValue = null;
				return;
			}
			const trimmed = value.trim();
			if (trimmed.startsWith("{") && trimmed.endsWith("}")) try {
				this.modelValue = JSON.parse(trimmed);
				return;
			} catch {}
			const found = findItem(this.items, trimmed);
			this.modelValue = found ?? { id: trimmed };
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
			return generateBreadcrumbRootClasses({
				variant: this.variant,
				size: this.size,
				color: this.color,
				truncate: this.truncate,
				disabled: this.disabled,
				cssClassName: this.cssClassName,
				rootExtra: this.cssClass?.root
			});
		}
		_resolvedCurrentId() {
			return resolveCurrentId(this.items, this.modelValue);
		}
		_isCurrent(id) {
			if (this._listChildren.size && !this.items.length) {
				if (this.modelValue?.id) return this.modelValue.id === id;
				return resolveCurrentId(this._registeredItems(), null) === id;
			}
			return this._resolvedCurrentId() === id;
		}
		/** Every child list's items, in registration (DOM) order. */
		_registeredItems() {
			const out = [];
			for (const child of this._listChildren) out.push(...child.getBreadcrumbItems?.() ?? []);
			return out;
		}
		_findRegisteredItem(id) {
			for (const child of this._listChildren) {
				const items = child.getBreadcrumbItems?.() ?? [];
				const found = findItem(items, id);
				if (found) return found;
			}
			return null;
		}
		_findAnyItem(id) {
			return findItem(this.items, id) ?? this._findRegisteredItem(id);
		}
		/** Programmatic select. Updates modelValue and emits `change`. */
		select(id) {
			const item = this._findAnyItem(id);
			if (!item) return;
			this._handleItemActivation(item, findItemIndex(this.items, id));
		}
		focus() {
			if (isServer) return;
			this.renderRoot.querySelector("a.mono-breadcrumb-action, button.mono-breadcrumb-action")?.focus();
		}
		/**
		* Public hooks consumed by descendant `<mono-breadcrumb-list>` instances
		* rendered inside `slot="body"` (light build).
		*/
		requestItemActivation(item, index, event) {
			this._handleItemActivation(item, index, event);
		}
		isItemCurrent(id) {
			return this._isCurrent(id);
		}
		getSlotIconNodes(id) {
			return this._slotIcons.get(id);
		}
		hasSeparatorSlot() {
			return this._slotSeparator.length > 0;
		}
		getSeparatorString() {
			return this.separator;
		}
		/** @internal called by `<mono-breadcrumb-list>` from its connectedCallback. */
		_registerListChild(child) {
			this._listChildren.add(child);
		}
		/** @internal called by `<mono-breadcrumb-list>` from its disconnectedCallback. */
		_unregisterListChild(child) {
			this._listChildren.delete(child);
		}
		_handleItemActivation(item, index, event) {
			if (item.disabled || this.disabled) return;
			dispatchMonoEvent(this, "click", {
				value: item.id,
				item,
				index,
				sourceEvent: event
			});
			const oldValue = this.modelValue;
			if (oldValue?.id === item.id) return;
			this.modelValue = item;
			const detail = {
				modelValue: item,
				currentValue: item,
				oldValue,
				sourceEvent: event
			};
			dispatchMonoEvent(this, "change", detail);
		}
		_notifyListChildren(changed) {
			if (!this._listChildren.size) return;
			if (![
				"modelValue",
				"variant",
				"size",
				"color",
				"separator",
				"truncate",
				"disabled",
				"cssClass",
				"cssClassName"
			].some((k) => changed.has(k))) return;
			for (const child of this._listChildren) child.requestUpdate();
		}
		/** Build the shared render context. */
		_renderContext() {
			return {
				cssClass: this.cssClass,
				separator: this.separator,
				hasSeparatorSlot: this._slotSeparator.length > 0,
				iconSlot: this._useIconSlots(),
				disabled: this.disabled,
				isCurrent: (id) => this._isCurrent(id),
				getSlotIconNodes: (id) => this._slotIcons.get(id),
				onItemClick: (item, index, e) => this._handleItemActivation(item, index, e)
			};
		}
		/**
		* Whether per-item icons render through a native `<slot>` (shadow build) vs
		* the light-DOM `data-mono-slot` + inline `i-…` span (light build).
		*/
		_useIconSlots() {
			return false;
		}
		/**
		* The items to render for THIS render pass. Defaults to the full `items`.
		* The shadow build overrides this to slice down to the server-rendered crumb
		* count during the hydration render, so the first client render matches the
		* SSR'd DOM exactly (avoids "shorter than expected iterable" + double render
		* when `items` arrives via `.prop`, which @lit-labs/ssr does not forward).
		*/
		_itemsForRender() {
			return this.items;
		}
		/** The list body. Light build overrides this to support `slot="body"`. */
		_renderBody() {
			return html`
        <ol class=${this._cls("mono-breadcrumb-list", "list")} mono-list>
          ${renderBreadcrumbList(this._itemsForRender(), this._renderContext())}
        </ol>
      `;
		}
		render() {
			const attrs = breadcrumbRootAttrs(this);
			return html`
        <nav
          class=${this._rootClasses}
          aria-label=${this.ariaLabel ?? "Breadcrumb"}
          mono-breadcrumb
          mono-size=${attrs.size ?? nothing}
          mono-color=${attrs.color ?? nothing}
          mono-variant=${attrs.variant ?? nothing}
          ?mono-truncate=${this.truncate}
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
	})], MonoBreadcrumbCoreClass.prototype, "items", void 0);
	__decorate([property({ attribute: false })], MonoBreadcrumbCoreClass.prototype, "modelValue", void 0);
	__decorate([property({ type: String })], MonoBreadcrumbCoreClass.prototype, "variant", void 0);
	__decorate([property({ type: String })], MonoBreadcrumbCoreClass.prototype, "size", void 0);
	__decorate([property({ type: String })], MonoBreadcrumbCoreClass.prototype, "color", void 0);
	__decorate([property({ type: String })], MonoBreadcrumbCoreClass.prototype, "separator", void 0);
	__decorate([property({
		reflect: true,
		converter: booleanStringConverter
	})], MonoBreadcrumbCoreClass.prototype, "truncate", void 0);
	__decorate([property({
		reflect: true,
		converter: booleanStringConverter
	})], MonoBreadcrumbCoreClass.prototype, "disabled", void 0);
	__decorate([property({ attribute: "aria-label" })], MonoBreadcrumbCoreClass.prototype, "ariaLabel", void 0);
	__decorate([property({ attribute: false })], MonoBreadcrumbCoreClass.prototype, "cssClass", void 0);
	__decorate([property({ attribute: false })], MonoBreadcrumbCoreClass.prototype, "cssClassName", void 0);
	__decorate([state()], MonoBreadcrumbCoreClass.prototype, "_slotIcons", void 0);
	return MonoBreadcrumbCoreClass;
};

//#endregion
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
//#region src/components/breadcrumb/breadcrumb-list-core.ts
let autoBreadcrumbListId = 0;
/**
* `MonoBreadcrumbListCore` — render-mode-agnostic logic for the STANDALONE
* `mono-breadcrumb-list`: reactive props (incl. the SSR `items` string→array
* coercion), item resolution (`items` array / single `item` / direct single-row
* props), the self-contained `<nav><ol>` render, and the `_useIconSlots()` /
* `_itemsForRender()` hooks.
*
* The light build (`mono-breadcrumb-list.ts`) extends this and layers the
* light-only CHILD composition (registering with a parent `<mono-breadcrumb>`
* via `closest()` and rendering bare items). The shadow build
* (`mono-breadcrumb-list.shadow.ts`) extends this for `@lit-labs/ssr`, rendering
* standalone in one shadow root and overriding `_useIconSlots()`. Child mode is
* a light-only feature (cross-element `closest()` can't work under SSR).
*
* SSR-safe: no `document`/`window` access.
*/
const MonoBreadcrumbListCore = (superClass) => {
	class MonoBreadcrumbListCoreClass extends superClass {
		constructor(..._args) {
			super(..._args);
			this.items = [];
			this.title = "";
			this.href = "";
			this.icon = "";
			this.current = false;
			this.disabled = false;
			this.variant = "default";
			this.size = "md";
			this.color = "primary";
			this.separator = "›";
			this.truncate = false;
			this._autoId = `mono-breadcrumb-list-item-${++autoBreadcrumbListId}`;
		}
		willUpdate(changed) {
			if (typeof this.items === "string") this.items = coerceItems(this.items);
			super.willUpdate?.(changed);
		}
		getBreadcrumbItems() {
			return this._getEffectiveItems();
		}
		_hasDirectItemProps() {
			return !!(this.id || this.title || this.href || this.icon || this.badge !== void 0 || this.current || this.disabled);
		}
		_normalizeItem(item) {
			const title = item.title ?? "";
			const fallbackId = this.id || item.id || item.href || title.toLowerCase().trim().replace(/\s+/g, "-") || this._autoId;
			const normalized = { id: String(item.id ?? fallbackId) };
			if (item.title !== void 0) normalized.title = item.title;
			if (item.icon !== void 0) normalized.icon = item.icon;
			if (item.badge !== void 0) normalized.badge = item.badge;
			if (item.badgeColor !== void 0) normalized.badgeColor = item.badgeColor;
			if (item.href !== void 0) normalized.href = item.href;
			if (item.current !== void 0) normalized.current = item.current;
			if (item.disabled !== void 0) normalized.disabled = item.disabled;
			return normalized;
		}
		_buildDirectItem() {
			return this._normalizeItem({
				id: this.id || void 0,
				title: this.title || void 0,
				href: this.href || void 0,
				icon: this.icon || void 0,
				badge: this.badge,
				badgeColor: this.badgeColor,
				current: this.current,
				disabled: this.disabled
			});
		}
		_getEffectiveItems() {
			if (this.item) return [this._normalizeItem(this.item)];
			if (this._hasDirectItemProps()) return [this._buildDirectItem()];
			if (Array.isArray(this.items) && this.items.length) return this.items;
			return [];
		}
		/**
		* The items to render for THIS render pass. Defaults to the effective items.
		* The shadow build overrides this to cap the hydration render at the
		* server-rendered count.
		*/
		_itemsForRender() {
			return this._getEffectiveItems();
		}
		/**
		* Whether per-item icons render through a native `<slot>` (shadow build) vs
		* the light-DOM inline `i-…` span (light build).
		*/
		_useIconSlots() {
			return false;
		}
		_standaloneContext() {
			return {
				cssClass: {},
				separator: this.separator,
				hasSeparatorSlot: false,
				disabled: this.disabled,
				iconSlot: this._useIconSlots(),
				isCurrent: (id) => {
					const items = this._getEffectiveItems();
					for (const it of items) if (it.current && it.id === id) return true;
					if (items.length && items.every((it) => !it.current)) return items[items.length - 1].id === id;
					return false;
				},
				getSlotIconNodes: () => void 0,
				onItemClick: () => {}
			};
		}
		/** Light build overrides this to return a parent-aware context. */
		_buildContext() {
			return this._standaloneContext();
		}
		_standaloneRootClasses() {
			return generateBreadcrumbRootClasses({
				variant: this.variant,
				size: this.size,
				color: this.color,
				truncate: this.truncate,
				disabled: this.disabled
			});
		}
		render() {
			const ctx = this._buildContext();
			const listClass = ctx.cssClass?.list ? `mono-breadcrumb-list ${ctx.cssClass.list}` : "mono-breadcrumb-list";
			const attrs = breadcrumbRootAttrs(this);
			return html`
        <nav
          class=${this._standaloneRootClasses()}
          aria-label="Breadcrumb"
          mono-breadcrumb
          mono-size=${attrs.size ?? nothing}
          mono-color=${attrs.color ?? nothing}
          mono-variant=${attrs.variant ?? nothing}
          ?mono-truncate=${this.truncate}
          ?mono-disabled=${this.disabled}
        >
          <ol class=${listClass} mono-list>
            ${renderBreadcrumbList(this._itemsForRender(), ctx)}
          </ol>
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
	})], MonoBreadcrumbListCoreClass.prototype, "items", void 0);
	__decorate([property({ attribute: false })], MonoBreadcrumbListCoreClass.prototype, "item", void 0);
	__decorate([property({ type: String })], MonoBreadcrumbListCoreClass.prototype, "title", void 0);
	__decorate([property({ type: String })], MonoBreadcrumbListCoreClass.prototype, "href", void 0);
	__decorate([property({ type: String })], MonoBreadcrumbListCoreClass.prototype, "icon", void 0);
	__decorate([property()], MonoBreadcrumbListCoreClass.prototype, "badge", void 0);
	__decorate([property({ attribute: "badge-color" })], MonoBreadcrumbListCoreClass.prototype, "badgeColor", void 0);
	__decorate([property({
		type: Boolean,
		reflect: true
	})], MonoBreadcrumbListCoreClass.prototype, "current", void 0);
	__decorate([property({
		type: Boolean,
		reflect: true
	})], MonoBreadcrumbListCoreClass.prototype, "disabled", void 0);
	__decorate([property({ type: String })], MonoBreadcrumbListCoreClass.prototype, "variant", void 0);
	__decorate([property({ type: String })], MonoBreadcrumbListCoreClass.prototype, "size", void 0);
	__decorate([property({ type: String })], MonoBreadcrumbListCoreClass.prototype, "color", void 0);
	__decorate([property({ type: String })], MonoBreadcrumbListCoreClass.prototype, "separator", void 0);
	__decorate([property({ type: Boolean })], MonoBreadcrumbListCoreClass.prototype, "truncate", void 0);
	return MonoBreadcrumbListCoreClass;
};

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