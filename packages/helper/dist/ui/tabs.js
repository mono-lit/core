import { g as monoHostChildNodes } from "../mono-ui-kvLVIf1V.js";
import { t as customElement } from "../mono-element-CKcT0rwv.js";
import { a as defineHybridPropAliases, n as arrayHasChanged, r as booleanStringConverter, t as __decorate } from "../decorate-DbYFpi8R.js";
import { t as dispatchMonoEvent } from "../mono-event-CAZf0F_k.js";
import { a as parkDetachedNodes, s as placeSlotNode } from "../light-slots-B5Ck0t_E.js";
import { LitElement, html, nothing } from "lit";
import { ref } from "lit/directives/ref.js";
import { property, state } from "lit/decorators.js";

//#region src/components/tabs/tabs-core.ts
/**
* Coerce any `items` input to a `TabItem[]`. Accepts an array (pass-through), a
* JSON string (`items='[...]'` attribute, OR a string assigned to the PROPERTY —
* which is what nuxt-ssr-lit does forwarding a Vue `:items="<json>"` binding to
* the SSR renderer), or anything else (→ `[]`).
*/
function coerceTabItems(value) {
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
* `MonoTabsCore` — all render-mode-agnostic logic for `mono-tabs`: reactive props
* (incl. the SSR `items` string→array coercion and `disabled` string→bool
* coercion), hybrid aliases, camelCase attribute fallbacks, the `modelValue`↔
* `value` sync, class computation, tab selection + `mno-click` events, keyboard
* navigation, and the `role="tablist"` `render()`. Per-tab icons render through a
* `_renderIcon()` hook: the light build uses `data-mono-slot` placeholders, the
* shadow build native `<slot name="icon-<id>">` (mirrors `mono-breadcrumb`).
*
* SSR-safe: no `document`/`window` access; `focus`/`blur` query `this.renderRoot`
* (the host in light, the shadow root in shadow) and only matter client-side.
*/
const MonoTabsCore = (superClass) => {
	class MonoTabsCoreClass extends superClass {
		constructor(...args) {
			super(...args);
			this.items = [];
			this.modelValue = "";
			this.value = "";
			this.size = "md";
			this.color = "primary";
			this.variant = "underline";
			this.orientation = "horizontal";
			this.disabled = false;
			this.cssClass = {};
			this.cssClassName = "";
			this._rootEl = null;
			this.bindRoot = (el) => {
				this._rootEl = el ?? null;
				this._applyRootAttrs(this._rootEl);
			};
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
		willUpdate(changed) {
			if (typeof this.items === "string") this.items = coerceTabItems(this.items);
			if (typeof this.disabled === "string") {
				const normalized = this.disabled.toLowerCase().trim();
				this.disabled = normalized === "" || normalized === "true";
			}
			if (changed.has("modelValue") && this.value !== this.modelValue) this.value = this.modelValue;
			if (changed.has("value") && this.modelValue !== this.value) this.modelValue = this.value;
			super.willUpdate?.(changed);
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
		/**
		* The prop mirrors, each omitted at its default so `:not([mono-size])` means
		* "md" for hand-written markup exactly as it does for the element.
		*
		* `aria-orientation` is ALWAYS written, and is not a `mono-` attribute:
		* upstream styles the vertical strip from the ARIA state, and a tablist is
		* supposed to carry it either way.
		*/
		_computeRootAttrs() {
			return {
				"mono-size": this.size === "md" ? null : this.size,
				"mono-color": this.color === "primary" ? null : this.color,
				"mono-variant": this.variant === "underline" ? null : this.variant,
				"mono-disabled": this.disabled ? "" : null,
				"aria-orientation": this.orientation === "vertical" ? "vertical" : "horizontal"
			};
		}
		_applyRootAttrs(root) {
			if (!root) return;
			if (!root.hasAttribute("mono-tabs")) root.setAttribute("mono-tabs", "");
			for (const [name, value] of Object.entries(this._computeRootAttrs())) if (value === null) root.removeAttribute(name);
			else if (root.getAttribute(name) !== value) root.setAttribute(name, value);
		}
		updated(changed) {
			super.updated?.(changed);
			this._applyRootAttrs(this._rootEl);
		}
		get _wrapperClasses() {
			return [
				"mono-tabs",
				this.size,
				this.color,
				`variant-${this.variant}`,
				this.disabled ? "disabled" : "",
				this.cssClassName,
				this.cssClass?.root
			].filter(Boolean).join(" ");
		}
		_isActive(item) {
			return item.id === this.modelValue;
		}
		_tabClasses(item) {
			const active = this._isActive(item);
			return [
				this._cls("mono-tabs-tab", "tab"),
				active ? "on" : "",
				active && this.cssClass?.tabActive ? this.cssClass.tabActive : "",
				item.disabled ? "disabled" : "",
				item.disabled && this.cssClass?.tabDisabled ? this.cssClass.tabDisabled : ""
			].filter(Boolean).join(" ");
		}
		_emitClick(detail) {
			dispatchMonoEvent(this, "click", detail, { alias: "change" });
		}
		_selectItem(item, sourceEvent) {
			if (this.disabled || item.disabled) return;
			if (this.modelValue === item.id) return;
			const oldValue = this.modelValue;
			this.modelValue = item.id;
			this.value = item.id;
			this._emitClick({
				modelValue: item.id,
				currentValue: item.id,
				oldValue,
				value: item.id,
				item,
				sourceEvent
			});
		}
		_handleClick(item, event) {
			this._selectItem(item, event);
		}
		select(id) {
			const item = this.items.find((entry) => entry.id === id);
			if (item) this._selectItem(item);
		}
		next() {
			this._step(1);
		}
		previous() {
			this._step(-1);
		}
		_step(delta) {
			if (this.disabled || !this.items.length) return;
			const enabled = this.items.filter((item) => !item.disabled);
			if (!enabled.length) return;
			const currentIndex = enabled.findIndex((item) => item.id === this.modelValue);
			const nextIndex = currentIndex < 0 ? 0 : (currentIndex + delta + enabled.length) % enabled.length;
			this._selectItem(enabled[nextIndex]);
		}
		focus() {
			const root = this.renderRoot;
			const tab = root.querySelector(".mono-tabs-tab.on");
			const fallback = root.querySelector(".mono-tabs-tab");
			(tab ?? fallback)?.focus();
		}
		blur() {
			this.renderRoot.querySelector(".mono-tabs-tab:focus")?.blur();
		}
		/** The items to render for THIS pass. Shadow overrides for the hydration gate. */
		_itemsForRender() {
			return this.items;
		}
		/** Whether per-tab icons render through a native `<slot>` (shadow) vs `data-mono-slot` (light). */
		_useIconSlots() {
			return false;
		}
		/** Whether tab `id` has a slotted icon. Light reads its capture map; shadow its scanned set. */
		_iconHasContent(_id) {
			return false;
		}
		_renderIcon(item) {
			if (this._useIconSlots()) return html`
          <span
            class=${this._cls("mono-tabs-tab-icon", "icon")}
            mono-icon
            aria-hidden="true"
            ?mono-empty=${!this._iconHasContent(item.id)}
          >
            <slot name=${`icon-${item.id}`}></slot>
          </span>
        `;
			if (!this._iconHasContent(item.id)) return nothing;
			return html`
        <span class=${this._cls("mono-tabs-tab-icon", "icon")} mono-icon aria-hidden="true">
          <span data-mono-slot=${`icon-${item.id}`}></span>
        </span>
      `;
		}
		_renderBadge(item) {
			if (item.badge === void 0 || item.badge === null || item.badge === "") return nothing;
			return html`
        <span class=${this._cls("mono-tabs-tab-badge", "badge")} mono-badge>
          ${item.badge}
        </span>
      `;
		}
		render() {
			return html`
        <div class=${this._wrapperClasses} mono-tabs role="tablist" ${ref(this.bindRoot)}>
          ${this._itemsForRender().map((item) => html`
              <button
                type="button"
                class=${this._tabClasses(item)}
                mono-tab
                role="tab"
                aria-selected=${this._isActive(item) ? "true" : "false"}
                ?disabled=${this.disabled || item.disabled}
                data-tab-id=${item.id}
                @click=${(event) => this._handleClick(item, event)}
              >
                ${this._renderIcon(item)}
                <span class=${this._cls("mono-tabs-tab-label", "label")} mono-label>
                  ${item.label}
                </span>
                ${this._renderBadge(item)}
              </button>
            `)}
        </div>
      `;
		}
	}
	__decorate([property({
		attribute: "items",
		converter: {
			fromAttribute: (value) => coerceTabItems(value),
			toAttribute: () => null
		},
		hasChanged: arrayHasChanged
	})], MonoTabsCoreClass.prototype, "items", void 0);
	__decorate([property({
		type: String,
		attribute: "model-value",
		reflect: true
	})], MonoTabsCoreClass.prototype, "modelValue", void 0);
	__decorate([property({ type: String })], MonoTabsCoreClass.prototype, "value", void 0);
	__decorate([property({ type: String })], MonoTabsCoreClass.prototype, "size", void 0);
	__decorate([property({ type: String })], MonoTabsCoreClass.prototype, "color", void 0);
	__decorate([property({ type: String })], MonoTabsCoreClass.prototype, "variant", void 0);
	__decorate([property({ type: String })], MonoTabsCoreClass.prototype, "orientation", void 0);
	__decorate([property({
		reflect: true,
		converter: booleanStringConverter
	})], MonoTabsCoreClass.prototype, "disabled", void 0);
	__decorate([property({ attribute: false })], MonoTabsCoreClass.prototype, "cssClass", void 0);
	__decorate([property({ attribute: false })], MonoTabsCoreClass.prototype, "cssClassName", void 0);
	return MonoTabsCoreClass;
};

//#endregion
//#region src/components/tabs/mono-tabs.ts
let MonoTabs = class MonoTabs extends MonoTabsCore(LitElement) {
	constructor(..._args) {
		super(..._args);
		this._slotsCaptured = false;
		this._slotIcons = /* @__PURE__ */ new Map();
	}
	createRenderRoot() {
		return this;
	}
	/** Light-DOM: a tab has an icon when a `slot="icon-<id>"` child was captured. */
	_iconHasContent(id) {
		return this._slotIcons.has(id);
	}
	connectedCallback() {
		super.connectedCallback();
		this._captureSlots();
		if (this.isConnected) this.performUpdate();
	}
	updated(changed) {
		super.updated(changed);
		this._placeIconSlots();
		this._orphanHolder = parkDetachedNodes(this._orphanHolder, [...this._slotIcons.values()].flat());
	}
	_captureSlots() {
		if (this._slotsCaptured) return;
		this._slotsCaptured = true;
		const captured = monoHostChildNodes(this);
		const capturedSlotNodes = /* @__PURE__ */ new Set();
		for (const node of captured) {
			if (!(node instanceof Element)) continue;
			const slotName = node.getAttribute("slot");
			if (!slotName || !slotName.startsWith("icon-")) continue;
			const id = slotName.slice(5);
			if (!id) continue;
			node.removeAttribute("slot");
			const list = this._slotIcons.get(id) ?? [];
			list.push(node);
			this._slotIcons.set(id, list);
			capturedSlotNodes.add(node);
		}
		for (const node of capturedSlotNodes) if (node.parentNode === this) this.removeChild(node);
	}
	_placeIconSlots() {
		if (!this._slotIcons.size) return;
		for (const [id, nodes] of this._slotIcons) {
			const target = this.querySelector(`[data-mono-slot="icon-${id}"]`);
			if (!target) continue;
			for (const node of nodes) placeSlotNode(target, node);
		}
	}
};
__decorate([state()], MonoTabs.prototype, "_slotsCaptured", void 0);
MonoTabs = __decorate([customElement("mono-tabs")], MonoTabs);

//#endregion
export { MonoTabs };