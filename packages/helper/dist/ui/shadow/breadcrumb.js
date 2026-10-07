import { a as __decorate, f as customElement, i as withShadowUtilityStyles, l as defineHybridPropAliases, o as arrayHasChanged, r as toShadowCss, s as booleanStringConverter, t as flushSsrHydration } from "../../hydration-flush-RB5Tz5nl.js";
import { t as dispatchMonoEvent } from "../../mono-event-Bi1qP9uN.js";
import { t as isIconifyClass } from "../../icon-CJkTlmTb.js";
import { LitElement, html, isServer, nothing, unsafeCSS } from "lit";
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
var MonoBreadcrumbCore = (superClass) => {
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
				const found = findItem(child.getBreadcrumbItems?.() ?? [], id);
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
//#region src/components/breadcrumb/breadcrumb.css?raw
var breadcrumb_default = "/* @unocss-include */\r\n\r\n/* =========================================================================\r\n   mono-breadcrumb — a port of Basecoat's `.breadcrumb` (basecoat-css@1.0.2,\r\n   vega style).\r\n\r\n   Styled by ATTRIBUTE, like Basecoat — and the attributes mirror the element's\r\n   props one for one, so hand-written markup reads like the Lit / Vue tag:\r\n\r\n     <mono-breadcrumb size=\"lg\" color=\"success\" variant=\"contained\" truncate>\r\n     <nav mono-breadcrumb mono-size=\"lg\" mono-color=\"success\"\r\n          mono-variant=\"contained\" mono-truncate aria-label=\"Breadcrumb\">\r\n       <ol mono-list>\r\n         <li mono-item>\r\n           <a mono-action href=\"/\">\r\n             <span mono-icon>…</span>\r\n             <span mono-content><span mono-title>Home</span></span>\r\n             <span mono-badge=\"info\">3</span>\r\n           </a>\r\n         </li>\r\n         <li mono-separator aria-hidden=\"true\">›</li>\r\n         <li mono-item mono-current aria-current=\"page\">\r\n           <span mono-action><span mono-content><span mono-title>Now</span></span></span>\r\n         </li>\r\n       </ol>\r\n     </nav>\r\n\r\n   An absent attribute is the prop's default (`:not([mono-size])` = md,\r\n   `:not([mono-color])` = primary, `:not([mono-variant])` = default). The old\r\n   classes (`.mono-breadcrumb.md.primary.default`) are still emitted as inert\r\n   hooks until 2.0 but no rule here reads them.\r\n\r\n   Selector map (ours ≡ upstream):\r\n     [mono-breadcrumb]      ≡ .breadcrumb (the <nav>) — a var scope\r\n     [mono-list]            ≡ .breadcrumb > ol (m-0 flex list-none flex-wrap\r\n                              items-center p-0 break-words, text-muted-foreground\r\n                              gap-1.5 text-sm sm:gap-2.5)\r\n     [mono-item]            ≡ .breadcrumb li (inline-flex items-center gap-1.5)\r\n     [mono-separator]       ≡ .breadcrumb li[aria-hidden='true'] (select-none),\r\n                              its glyph ≡ li[aria-hidden='true'] > svg (size-3.5)\r\n     [mono-action]          ≡ .breadcrumb a (rounded-sm outline-none\r\n                              focus-visible:ring-[3px] focus-visible:ring-ring/50,\r\n                              transition-colors hover:text-foreground)\r\n     [mono-current]         ≡ .breadcrumb [aria-current='page'] (font-normal\r\n                              text-foreground, cursor-default)\r\n     [mono-icon]            ≡ .breadcrumb li > span[aria-hidden='true']\r\n                              (flex items-center justify-center size-5,\r\n                              [&>svg]:size-4)\r\n     [mono-badge]           ≡ .badge — EXTENSION here (upstream's breadcrumb has\r\n                              none), so it borrows the badge's own shape\r\n     [mono-content]/[mono-title]   ≡ EXTENSION (upstream puts the label straight\r\n                              in the <a>; mono wraps it so `truncate` has\r\n                              something to clamp)\r\n     [mono-variant=…]       ≡ EXTENSION (upstream ships one breadcrumb)\r\n\r\n   THE DEFAULT VARIANT IS NOW BARE TEXT. Upstream's breadcrumb links carry no\r\n   padding, no background and no border — `rounded-sm` exists only so the focus\r\n   ring has a shape. The pre-port default padded every segment into a 5px-radius\r\n   chip. `contained` is where that look lives now; `--mono-breadcrumb-pad-x`/`-y`\r\n   are still the knobs, they just start at 0.\r\n\r\n   COLOUR IS A DEVIATION. Upstream inks hover and the current segment in\r\n   `--foreground`. mono's breadcrumb has a `color` prop, so it inks them in the\r\n   ROLE instead — and `color=\"surface\"` resolves the accent back to\r\n   `--foreground`, which is upstream exactly.\r\n\r\n   NO GRADIENTS. The contained variant's current segment was a two-stop gradient\r\n   with a coloured glow; it is now the flat role fill on the role's own\r\n   `-foreground`, the way `.btn[data-variant='primary']` is.\r\n\r\n   DARK MODE comes free — every colour resolves through a Basecoat token that\r\n   already flips. A selector crosses neither the custom-element host nor the\r\n   shadow boundary, so no `.dark` rule can live in component CSS.\r\n\r\n   FLAVORS set `--mono-breadcrumb-{gap,font,icon-size,sep-*,radius,badge-*}`\r\n   (+ the per-size forms); every fallback here is vega's value\r\n   (`node scripts/basecoat-styles.mjs --varying \".breadcrumb > ol\"`).\r\n   ========================================================================= */\r\n\r\nmono-breadcrumb {\r\n  display: block;\r\n}\r\n\r\n/* A composed child list renders its <li>s straight into the parent's <ol>. */\r\nmono-breadcrumb-list {\r\n  display: contents;\r\n}\r\n\r\n/* =========================================\r\n   Root — the var scope\r\n   ========================================= */\r\n\r\n[mono-breadcrumb] {\r\n  /* ── the roles, each a public knob over a Basecoat token ────────────────── */\r\n  --_mono-breadcrumb-primary: var(--mono-breadcrumb-primary, var(--primary));\r\n  --_mono-breadcrumb-secondary: var(--mono-breadcrumb-secondary, var(--secondary-foreground));\r\n  --_mono-breadcrumb-success: var(--mono-breadcrumb-success, var(--success));\r\n  --_mono-breadcrumb-danger: var(--mono-breadcrumb-danger, var(--destructive));\r\n  --_mono-breadcrumb-warning: var(--mono-breadcrumb-warning, var(--warning));\r\n  --_mono-breadcrumb-info: var(--mono-breadcrumb-info, var(--info));\r\n  --_mono-breadcrumb-teal: var(--mono-breadcrumb-teal, var(--teal));\r\n  --_mono-breadcrumb-purple: var(--mono-breadcrumb-purple, var(--purple));\r\n  --_mono-breadcrumb-neutral: var(--mono-breadcrumb-neutral, var(--neutral));\r\n  --_mono-breadcrumb-dark: var(--mono-breadcrumb-dark, var(--dark));\r\n\r\n  /* The colour in play. DEVIATION: upstream inks hover and the current segment\r\n     in `--foreground`; `color=\"surface\"` is that exactly. */\r\n  --_mono-breadcrumb-accent: var(--mono-breadcrumb-accent, var(--_mono-breadcrumb-accent-preset, var(--_mono-breadcrumb-primary)));\r\n  --_mono-breadcrumb-on-accent: var(--mono-breadcrumb-on-accent, var(--_mono-breadcrumb-on-accent-preset, var(--primary-foreground)));\r\n\r\n  /* ── ink ────────────────────────────────────────────────────────────────\r\n     basecoat@1.0.2 styles/vega.css .breadcrumb > ol — text-muted-foreground gap-1.5 text-sm sm:gap-2.5\r\n     basecoat@1.0.2 styles/vega.css .breadcrumb [aria-current='page'] — font-normal text-foreground */\r\n  --_mono-breadcrumb-text: var(--mono-breadcrumb-text, var(--muted-foreground));\r\n  --_mono-breadcrumb-text-strong: var(--mono-breadcrumb-text-strong, var(--foreground));\r\n  --_mono-breadcrumb-sep-color: var(--mono-breadcrumb-sep-color, var(--_mono-breadcrumb-text));\r\n  --_mono-breadcrumb-surface: var(--mono-breadcrumb-surface, var(--background));\r\n  --_mono-breadcrumb-border: var(--mono-breadcrumb-border, var(--border));\r\n\r\n  /* ── md metrics live on the unqualified root ON PURPOSE ──────────────────\r\n     `gap-1.5` is the mobile step; `sm:gap-2.5` widens it (see the @media below). */\r\n  --_mono-breadcrumb-gap: var(--mono-breadcrumb-gap, var(--_mono-breadcrumb-gap-preset, var(--mono-breadcrumb-gap-md, calc(var(--mono-spacing) * 1.5))));\r\n  --_mono-breadcrumb-gap-wide: var(--mono-breadcrumb-gap-wide, var(--_mono-breadcrumb-gap-wide-preset, var(--mono-breadcrumb-gap-wide-md, calc(var(--mono-spacing) * 2.5))));\r\n  --_mono-breadcrumb-font: var(--mono-breadcrumb-font, var(--_mono-breadcrumb-font-preset, var(--mono-breadcrumb-font-md, var(--mono-text-sm))));\r\n  --_mono-breadcrumb-line-height: var(--mono-breadcrumb-line-height, var(--_mono-breadcrumb-line-height-preset, var(--mono-breadcrumb-line-height-md, var(--mono-text-sm--lh))));\r\n  --_mono-breadcrumb-font-weight: var(--mono-breadcrumb-font-weight, var(--mono-font-weight-normal));\r\n  /* basecoat@1.0.2 styles/vega.css .breadcrumb [aria-current='page'] — font-normal text-foreground:\r\n     upstream does NOT bold the current segment. ONE restores the bold it had. */\r\n  --_mono-breadcrumb-current-weight: var(--mono-breadcrumb-current-weight, var(--mono-font-weight-normal));\r\n  /* basecoat@1.0.2 styles/vega.css .sidebar nav h3 — text-sidebar-foreground/70 ring-sidebar-ring h-8 rounded-md px-2 text-xs font-medium focus-visible:ring-2 [&>svg]:size-4 transition-[margin,opacity] duration-200 ease-linear\r\n     A breadcrumb's current crumb is the page's own label, and each flavor has a\r\n     house style for one — sera sets its chrome headings uppercase +\r\n     tracking-wider + semibold, and this is what lets it say so. */\r\n  --_mono-breadcrumb-current-transform: var(--mono-breadcrumb-current-transform, none);\r\n  --_mono-breadcrumb-current-tracking: var(--mono-breadcrumb-current-tracking, normal);\r\n  /* basecoat@1.0.2 styles/vega.css .breadcrumb li > span[aria-hidden='true'] — size-5 [&>svg]:size-4 */\r\n  --_mono-breadcrumb-icon-size: var(--mono-breadcrumb-icon-size, var(--_mono-breadcrumb-icon-size-preset, var(--mono-breadcrumb-icon-size-md, calc(var(--mono-spacing) * 4))));\r\n  /* basecoat@1.0.2 styles/vega.css .breadcrumb li[aria-hidden='true'] > svg — size-3.5 */\r\n  --_mono-breadcrumb-sep-size: var(--mono-breadcrumb-sep-size, var(--_mono-breadcrumb-sep-size-preset, var(--mono-breadcrumb-sep-size-md, calc(var(--mono-spacing) * 3.5))));\r\n  --_mono-breadcrumb-sep-font: var(--mono-breadcrumb-sep-font, var(--_mono-breadcrumb-sep-font-preset, var(--mono-breadcrumb-sep-font-md, var(--mono-text-sm))));\r\n\r\n  /* ── the action box. Upstream's <a> is BARE — `rounded-sm` is only there to\r\n     shape the focus ring — so the padding starts at 0 and `contained` /\r\n     `underlined` are what turn it into a chip. ───────────────────────────── */\r\n  --_mono-breadcrumb-pad-x: var(--mono-breadcrumb-pad-x, var(--_mono-breadcrumb-pad-x-preset, 0px));\r\n  --_mono-breadcrumb-pad-y: var(--mono-breadcrumb-pad-y, var(--_mono-breadcrumb-pad-y-preset, 0px));\r\n  --_mono-breadcrumb-radius: var(--mono-breadcrumb-radius, var(--_mono-breadcrumb-radius-preset, var(--mono-breadcrumb-radius-md, var(--mono-radius-sm))));\r\n  --_mono-breadcrumb-border-width: var(--mono-breadcrumb-border-width, var(--mono-border-width));\r\n\r\n  /* ── the badge — EXTENSION, borrowing `.badge`'s shape ───────────────────\r\n     basecoat@1.0.2 styles/vega.css .badge — h-5 gap-1 rounded-4xl border border-transparent px-2 py-0.5 text-xs font-medium transition-all [&>svg]:size-3! */\r\n  --_mono-breadcrumb-badge-height: var(--mono-breadcrumb-badge-height, calc(var(--mono-spacing) * 5));\r\n  --_mono-breadcrumb-badge-pad-x: var(--mono-breadcrumb-badge-pad-x, calc(var(--mono-spacing) * 2));\r\n  --_mono-breadcrumb-badge-radius: var(--mono-breadcrumb-badge-radius, var(--mono-radius-4xl));\r\n  --_mono-breadcrumb-badge-font: var(--mono-breadcrumb-badge-font, var(--mono-text-xs));\r\n  --_mono-breadcrumb-badge-weight: var(--mono-breadcrumb-badge-weight, var(--mono-font-weight-medium));\r\n  --_mono-breadcrumb-badge-bg: var(--mono-breadcrumb-badge-bg, var(--secondary));\r\n  --_mono-breadcrumb-badge-color: var(--mono-breadcrumb-badge-color, var(--secondary-foreground));\r\n\r\n  display: block;\r\n  width: 100%;\r\n  font-family: inherit;\r\n  color: var(--_mono-breadcrumb-text);\r\n}\r\n\r\n[mono-breadcrumb],\r\n:where([mono-breadcrumb]) *,\r\n:where([mono-breadcrumb]) *::before,\r\n:where([mono-breadcrumb]) *::after {\r\n  box-sizing: border-box;\r\n}\r\n\r\n/* =========================================\r\n   Sizes — EXTENSION: upstream ships one breadcrumb\r\n   ========================================= */\r\n\r\n[mono-breadcrumb][mono-size=\"xs\"] {\r\n  --_mono-breadcrumb-gap-preset: var(--mono-breadcrumb-gap-xs, var(--mono-spacing));\r\n  --_mono-breadcrumb-gap-wide-preset: var(--mono-breadcrumb-gap-wide-xs, calc(var(--mono-spacing) * 1.5));\r\n  --_mono-breadcrumb-font-preset: var(--mono-breadcrumb-font-xs, var(--mono-text-xs));\r\n  --_mono-breadcrumb-line-height-preset: var(--mono-text-xs--lh);\r\n  --_mono-breadcrumb-icon-size-preset: var(--mono-breadcrumb-icon-size-xs, calc(var(--mono-spacing) * 3));\r\n  --_mono-breadcrumb-sep-size-preset: var(--mono-breadcrumb-sep-size-xs, calc(var(--mono-spacing) * 2.5));\r\n  --_mono-breadcrumb-sep-font-preset: var(--mono-breadcrumb-sep-font-xs, var(--mono-text-xs));\r\n  --_mono-breadcrumb-radius-preset: var(--mono-breadcrumb-radius-xs, var(--mono-radius-sm));\r\n}\r\n\r\n[mono-breadcrumb][mono-size=\"sm\"] {\r\n  --_mono-breadcrumb-gap-preset: var(--mono-breadcrumb-gap-sm, var(--mono-spacing));\r\n  --_mono-breadcrumb-gap-wide-preset: var(--mono-breadcrumb-gap-wide-sm, calc(var(--mono-spacing) * 2));\r\n  --_mono-breadcrumb-font-preset: var(--mono-breadcrumb-font-sm, var(--mono-text-xs));\r\n  --_mono-breadcrumb-line-height-preset: var(--mono-text-xs--lh);\r\n  --_mono-breadcrumb-icon-size-preset: var(--mono-breadcrumb-icon-size-sm, calc(var(--mono-spacing) * 3.5));\r\n  --_mono-breadcrumb-sep-size-preset: var(--mono-breadcrumb-sep-size-sm, calc(var(--mono-spacing) * 3));\r\n  --_mono-breadcrumb-sep-font-preset: var(--mono-breadcrumb-sep-font-sm, var(--mono-text-xs));\r\n  --_mono-breadcrumb-radius-preset: var(--mono-breadcrumb-radius-sm, var(--mono-radius-sm));\r\n}\r\n\r\n[mono-breadcrumb][mono-size=\"lg\"] {\r\n  --_mono-breadcrumb-gap-preset: var(--mono-breadcrumb-gap-lg, calc(var(--mono-spacing) * 2));\r\n  --_mono-breadcrumb-gap-wide-preset: var(--mono-breadcrumb-gap-wide-lg, calc(var(--mono-spacing) * 3));\r\n  --_mono-breadcrumb-font-preset: var(--mono-breadcrumb-font-lg, var(--mono-text-base));\r\n  --_mono-breadcrumb-line-height-preset: var(--mono-text-base--lh);\r\n  --_mono-breadcrumb-icon-size-preset: var(--mono-breadcrumb-icon-size-lg, calc(var(--mono-spacing) * 4.5));\r\n  --_mono-breadcrumb-sep-size-preset: var(--mono-breadcrumb-sep-size-lg, calc(var(--mono-spacing) * 4));\r\n  --_mono-breadcrumb-sep-font-preset: var(--mono-breadcrumb-sep-font-lg, var(--mono-text-base));\r\n  --_mono-breadcrumb-radius-preset: var(--mono-breadcrumb-radius-lg, var(--mono-radius-md));\r\n}\r\n\r\n[mono-breadcrumb][mono-size=\"xl\"] {\r\n  --_mono-breadcrumb-gap-preset: var(--mono-breadcrumb-gap-xl, calc(var(--mono-spacing) * 2.5));\r\n  --_mono-breadcrumb-gap-wide-preset: var(--mono-breadcrumb-gap-wide-xl, calc(var(--mono-spacing) * 3.5));\r\n  --_mono-breadcrumb-font-preset: var(--mono-breadcrumb-font-xl, var(--mono-text-lg));\r\n  --_mono-breadcrumb-line-height-preset: var(--mono-text-lg--lh);\r\n  --_mono-breadcrumb-icon-size-preset: var(--mono-breadcrumb-icon-size-xl, calc(var(--mono-spacing) * 5));\r\n  --_mono-breadcrumb-sep-size-preset: var(--mono-breadcrumb-sep-size-xl, calc(var(--mono-spacing) * 4.5));\r\n  --_mono-breadcrumb-sep-font-preset: var(--mono-breadcrumb-sep-font-xl, var(--mono-text-lg));\r\n  --_mono-breadcrumb-radius-preset: var(--mono-breadcrumb-radius-xl, var(--mono-radius-md));\r\n}\r\n\r\n[mono-breadcrumb][mono-size=\"xxl\"] {\r\n  --_mono-breadcrumb-gap-preset: var(--mono-breadcrumb-gap-xxl, calc(var(--mono-spacing) * 3));\r\n  --_mono-breadcrumb-gap-wide-preset: var(--mono-breadcrumb-gap-wide-xxl, calc(var(--mono-spacing) * 4));\r\n  --_mono-breadcrumb-font-preset: var(--mono-breadcrumb-font-xxl, var(--mono-text-xl));\r\n  --_mono-breadcrumb-line-height-preset: var(--mono-text-xl--lh);\r\n  --_mono-breadcrumb-icon-size-preset: var(--mono-breadcrumb-icon-size-xxl, calc(var(--mono-spacing) * 6));\r\n  --_mono-breadcrumb-sep-size-preset: var(--mono-breadcrumb-sep-size-xxl, calc(var(--mono-spacing) * 5));\r\n  --_mono-breadcrumb-sep-font-preset: var(--mono-breadcrumb-sep-font-xxl, var(--mono-text-xl));\r\n  --_mono-breadcrumb-radius-preset: var(--mono-breadcrumb-radius-xxl, var(--mono-radius-lg));\r\n}\r\n\r\n/* =========================================\r\n   Colours — EXTENSION, and the one deviation from upstream's ink\r\n   ========================================= */\r\n\r\n[mono-breadcrumb][mono-color=\"primary\"] {\r\n  --_mono-breadcrumb-accent-preset: var(--_mono-breadcrumb-primary);\r\n  --_mono-breadcrumb-on-accent-preset: var(--primary-foreground);\r\n}\r\n\r\n[mono-breadcrumb][mono-color=\"secondary\"] {\r\n  --_mono-breadcrumb-accent-preset: var(--_mono-breadcrumb-secondary);\r\n  --_mono-breadcrumb-on-accent-preset: var(--secondary);\r\n}\r\n\r\n[mono-breadcrumb][mono-color=\"success\"] {\r\n  --_mono-breadcrumb-accent-preset: var(--_mono-breadcrumb-success);\r\n  --_mono-breadcrumb-on-accent-preset: var(--success-foreground);\r\n}\r\n\r\n[mono-breadcrumb][mono-color=\"danger\"] {\r\n  --_mono-breadcrumb-accent-preset: var(--_mono-breadcrumb-danger);\r\n  --_mono-breadcrumb-on-accent-preset: var(--destructive-foreground);\r\n}\r\n\r\n[mono-breadcrumb][mono-color=\"warning\"] {\r\n  --_mono-breadcrumb-accent-preset: var(--_mono-breadcrumb-warning);\r\n  --_mono-breadcrumb-on-accent-preset: var(--warning-foreground);\r\n}\r\n\r\n[mono-breadcrumb][mono-color=\"info\"] {\r\n  --_mono-breadcrumb-accent-preset: var(--_mono-breadcrumb-info);\r\n  --_mono-breadcrumb-on-accent-preset: var(--info-foreground);\r\n}\r\n[mono-breadcrumb][mono-color=\"teal\"] {\r\n  --_mono-breadcrumb-accent-preset: var(--_mono-breadcrumb-teal);\r\n  --_mono-breadcrumb-on-accent-preset: var(--teal-foreground);\r\n}\r\n[mono-breadcrumb][mono-color=\"purple\"] {\r\n  --_mono-breadcrumb-accent-preset: var(--_mono-breadcrumb-purple);\r\n  --_mono-breadcrumb-on-accent-preset: var(--purple-foreground);\r\n}\r\n[mono-breadcrumb][mono-color=\"neutral\"] {\r\n  --_mono-breadcrumb-accent-preset: var(--_mono-breadcrumb-neutral);\r\n  --_mono-breadcrumb-on-accent-preset: var(--neutral-foreground);\r\n}\r\n[mono-breadcrumb][mono-color=\"dark\"] {\r\n  --_mono-breadcrumb-accent-preset: var(--_mono-breadcrumb-dark);\r\n  --_mono-breadcrumb-on-accent-preset: var(--dark-foreground);\r\n}\r\n\r\n/* `surface` is upstream's own ink: hover and the current segment go to\r\n   `--foreground` and nothing is branded. */\r\n[mono-breadcrumb][mono-color=\"surface\"] {\r\n  --_mono-breadcrumb-accent-preset: var(--_mono-breadcrumb-text-strong);\r\n  --_mono-breadcrumb-on-accent-preset: var(--background);\r\n}\r\n\r\n/* =========================================\r\n   The list\r\n   ========================================= */\r\n\r\n/* basecoat@1.0.2 components/breadcrumb.css .breadcrumb > ol — m-0 flex list-none flex-wrap items-center p-0 break-words */\r\n/* basecoat@1.0.2 styles/vega.css .breadcrumb > ol — text-muted-foreground gap-1.5 text-sm sm:gap-2.5\r\n   The selector carries the root on purpose: `.vp-doc ul, .vp-doc ol` is (0,1,1)\r\n   and would otherwise inject the left padding that breaks a flush breadcrumb. */\r\n:where([mono-breadcrumb]) [mono-list] {\r\n  display: flex;\r\n  flex-wrap: wrap;\r\n  align-items: center;\r\n  gap: var(--_mono-breadcrumb-gap);\r\n  margin: 0;\r\n  padding: 0;\r\n  list-style: none;\r\n  min-width: 0;\r\n  overflow-wrap: break-word;\r\n  font-size: var(--_mono-breadcrumb-font);\r\n  line-height: var(--_mono-breadcrumb-line-height);\r\n}\r\n\r\n/* `sm:gap-2.5` — the row breathes once there is room for it. */\r\n@media (min-width: 640px) {\r\n  :where([mono-breadcrumb]) [mono-list] {\r\n    gap: var(--_mono-breadcrumb-gap-wide);\r\n  }\r\n}\r\n\r\n/* `truncate` CLAMPS, it does not force one line. Forcing `nowrap` meant the\r\n   row either overflowed its container or — once the crumbs were allowed to\r\n   shrink — squeezed short labels that had room, so `Dashboard` came out as\r\n   `Dash…` next to a half-empty row. Wrapping keeps every label at its clamp and\r\n   breaks the line instead. */\r\n\r\n/* VitePress puts `margin-top: 8px` on `li + li` and `margin-bottom: .5em` on\r\n   every `li`; either one stops the separators centring with the actions. */\r\n:where([mono-breadcrumb]) [mono-list] :is([mono-item], [mono-separator]) {\r\n  margin: 0;\r\n  padding: 0;\r\n  list-style: none;\r\n}\r\n\r\n/* A composed child list renders a separator BEFORE each of its items, since it\r\n   cannot know whether it is the first sibling. The very first one is dropped. */\r\n[mono-list] > mono-breadcrumb-list:first-child > [mono-separator]:first-child {\r\n  display: none;\r\n}\r\n\r\n/* =========================================\r\n   Item\r\n   ========================================= */\r\n\r\n/* basecoat@1.0.2 styles/vega.css .breadcrumb li — gap-1.5 */\r\n/* basecoat@1.0.2 components/breadcrumb.css .breadcrumb li — inline-flex items-center */\r\n:where([mono-breadcrumb]) [mono-item] {\r\n  display: inline-flex;\r\n  align-items: center;\r\n  align-self: center;\r\n  gap: var(--_mono-breadcrumb-gap);\r\n  min-width: 0;\r\n}\r\n\r\n/* =========================================\r\n   Action — the segment itself\r\n   ========================================= */\r\n\r\n/* basecoat@1.0.2 components/breadcrumb.css .breadcrumb a — rounded-sm outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 */\r\n/* basecoat@1.0.2 styles/vega.css .breadcrumb a — transition-colors hover:text-foreground\r\n   DEVIATION: upstream's <a> is bare text. The padding and the border are kept as\r\n   knobs at 0 so `contained` / `underlined` — and a consumer — can turn the\r\n   segment into a chip without a second rule. */\r\n:where([mono-breadcrumb]) [mono-action] {\r\n  display: inline-flex;\r\n  align-items: center;\r\n  gap: var(--_mono-breadcrumb-gap);\r\n  padding: var(--_mono-breadcrumb-pad-y) var(--_mono-breadcrumb-pad-x);\r\n  border: var(--_mono-breadcrumb-border-width) solid transparent;\r\n  border-radius: var(--_mono-breadcrumb-radius);\r\n  background: transparent;\r\n  color: inherit;\r\n  font: inherit;\r\n  font-weight: var(--_mono-breadcrumb-font-weight);\r\n  text-align: left;\r\n  text-decoration: none;\r\n  white-space: nowrap;\r\n  user-select: none;\r\n  outline: none;\r\n  transition:\r\n    color var(--mono-duration) var(--mono-ease),\r\n    background-color var(--mono-duration) var(--mono-ease),\r\n    border-color var(--mono-duration) var(--mono-ease);\r\n}\r\n\r\n:where([mono-breadcrumb]) :is(a, button)[mono-action] {\r\n  cursor: pointer;\r\n}\r\n\r\n:where([mono-breadcrumb]) span[mono-action] {\r\n  cursor: default;\r\n}\r\n\r\n/* VitePress's `.vp-doc a` (0,1,1) underlines and re-inks every link, and adds an\r\n   external-link glyph on `target=\"_blank\"`. The current segment renders as a\r\n   <span>, so it is never reached. */\r\n[mono-breadcrumb] a[mono-action] {\r\n  text-decoration: none;\r\n  color: inherit;\r\n  font-weight: var(--_mono-breadcrumb-font-weight);\r\n}\r\n\r\n[mono-breadcrumb] a[mono-action]::after {\r\n  display: none !important;\r\n}\r\n\r\n@media (hover: hover) {\r\n  [mono-breadcrumb] :is(a, button)[mono-action]:hover {\r\n    color: var(--_mono-breadcrumb-accent);\r\n  }\r\n}\r\n\r\n/* `focus-visible:ring-[3px] focus-visible:ring-ring/50` */\r\n[mono-breadcrumb] [mono-action]:focus-visible {\r\n  outline: none;\r\n  box-shadow: 0 0 0 var(--mono-ring-width-lg, 3px)\r\n    color-mix(in oklab, var(--ring) 50%, transparent);\r\n}\r\n\r\n/* basecoat@1.0.2 styles/vega.css .breadcrumb [aria-current='page'] — font-normal text-foreground */\r\n/* basecoat@1.0.2 components/breadcrumb.css .breadcrumb [aria-current='page'] — cursor-default */\r\n[mono-breadcrumb] [mono-item][mono-current] > [mono-action] {\r\n  color: var(--_mono-breadcrumb-accent);\r\n  font-weight: var(--_mono-breadcrumb-current-weight);\r\n  text-transform: var(--_mono-breadcrumb-current-transform);\r\n  letter-spacing: var(--_mono-breadcrumb-current-tracking);\r\n  cursor: default;\r\n}\r\n\r\n[mono-breadcrumb] [mono-item][mono-disabled] > [mono-action],\r\n[mono-breadcrumb] [mono-action]:disabled,\r\n[mono-breadcrumb][mono-disabled] [mono-action] {\r\n  opacity: var(--mono-disabled-opacity, 0.5);\r\n  cursor: not-allowed;\r\n  pointer-events: none;\r\n}\r\n\r\n/* =========================================\r\n   Variant: contained — EXTENSION, the pre-port chip\r\n   ========================================= */\r\n\r\n[mono-breadcrumb][mono-variant=\"contained\"] {\r\n  --_mono-breadcrumb-pad-x-preset: var(--mono-breadcrumb-contained-pad-x, calc(var(--mono-spacing) * 2));\r\n  --_mono-breadcrumb-pad-y-preset: var(--mono-breadcrumb-contained-pad-y, calc(var(--mono-spacing) * 1));\r\n}\r\n\r\n[mono-breadcrumb][mono-variant=\"contained\"] [mono-action] {\r\n  background: var(--_mono-breadcrumb-surface);\r\n  border-color: var(--_mono-breadcrumb-border);\r\n}\r\n\r\n@media (hover: hover) {\r\n  [mono-breadcrumb][mono-variant=\"contained\"] :is(a, button)[mono-action]:hover {\r\n    background: color-mix(in oklab, var(--_mono-breadcrumb-accent) var(--mono-mode-tint), transparent);\r\n    border-color: color-mix(in oklab, var(--_mono-breadcrumb-accent) var(--mono-mode-checked-border), transparent);\r\n  }\r\n}\r\n\r\n/* The flat role fill, not the old gradient-and-glow. */\r\n[mono-breadcrumb][mono-variant=\"contained\"] [mono-item][mono-current] > [mono-action] {\r\n  background: var(--_mono-breadcrumb-accent);\r\n  border-color: transparent;\r\n  color: var(--_mono-breadcrumb-on-accent);\r\n}\r\n\r\n[mono-breadcrumb][mono-variant=\"contained\"] [mono-item][mono-current] > [mono-action] [mono-badge] {\r\n  background: color-mix(in oklab, var(--_mono-breadcrumb-on-accent) 22%, transparent);\r\n  color: var(--_mono-breadcrumb-on-accent);\r\n}\r\n\r\n/* =========================================\r\n   Variant: underlined — EXTENSION\r\n   ========================================= */\r\n\r\n[mono-breadcrumb][mono-variant=\"underlined\"] [mono-action] {\r\n  border-radius: 0;\r\n  border-bottom-color: transparent;\r\n}\r\n\r\n@media (hover: hover) {\r\n  [mono-breadcrumb][mono-variant=\"underlined\"] :is(a, button)[mono-action]:hover {\r\n    border-bottom-color: color-mix(in oklab, var(--_mono-breadcrumb-accent) var(--mono-mode-checked-border), transparent);\r\n  }\r\n}\r\n\r\n[mono-breadcrumb][mono-variant=\"underlined\"] [mono-item][mono-current] > [mono-action] {\r\n  border-bottom-color: var(--_mono-breadcrumb-accent);\r\n}\r\n\r\n/* =========================================\r\n   Icon\r\n   ========================================= */\r\n\r\n/* basecoat@1.0.2 components/breadcrumb.css .breadcrumb li > span[aria-hidden='true'] — flex items-center justify-center */\r\n/* basecoat@1.0.2 styles/vega.css .breadcrumb li > span[aria-hidden='true'] — size-5 [&>svg]:size-4 */\r\n:where([mono-breadcrumb]) [mono-icon] {\r\n  flex-shrink: 0;\r\n  display: inline-flex;\r\n  align-items: center;\r\n  justify-content: center;\r\n  width: var(--_mono-breadcrumb-icon-size);\r\n  height: var(--_mono-breadcrumb-icon-size);\r\n  font-size: var(--_mono-breadcrumb-icon-size);\r\n  line-height: 1;\r\n}\r\n\r\n/* Three shapes end up inside the box and all must fill it:\r\n     shadow build, user-slotted → <slot> → ::slotted(svg)\r\n     light build, user-slotted  → <span data-mono-slot=\"icon-<id>\"> → svg\r\n     inline `item.icon` markup  → a direct child svg\r\n   The light placeholder is the subtle one: it parks the captured child, so the\r\n   SVG is a GRANDchild and a `> svg` rule misses it entirely. */\r\n[mono-icon] > svg,\r\n[mono-icon] > [data-mono-slot] > svg,\r\n[mono-icon] slot::slotted(svg) {\r\n  display: block;\r\n  width: 100%;\r\n  height: 100%;\r\n}\r\n\r\n/* The placeholder must not become a 0-width flex item between the box and the\r\n   SVG — `display: contents` drops it from layout so the SVG sizes against the\r\n   box instead of against a zero-width parent. */\r\n[mono-icon] > [data-mono-slot] {\r\n  display: contents;\r\n}\r\n\r\n/* Class + attribute = specificity (0,2,0), deliberately. UnoCSS's `i-…`\r\n   utilities set `width`/`height: 1.2em` (presetIcons `scale: 1.2`) at (0,1,0)\r\n   and their sheet loads AFTER this one, so a single selector loses and the glyph\r\n   overflows its box. Two selectors win regardless of sheet order — and it is the\r\n   only thing that works for the SHADOW build, where this span is a LIGHT-DOM\r\n   child of the host that no shadow-scoped selector can reach.\r\n   Scoped to the breadcrumb: its OWN class (every build sets it on the span — the\r\n   shadow build's span is a light-DOM child of the host, outside [mono-breadcrumb])\r\n   OR anything inside a [mono-breadcrumb] root (raw CSS markup writes a bare\r\n   `<span mono-glyph class=\"i-…\">`). Still (0,2,0): `:is()` weighs its heaviest\r\n   argument. A bare `[mono-glyph][mono-glyph]` is global and stretched every other\r\n   component's `[mono-glyph]` to 100% — the accordion's icon chip filled its header. */\r\n:is(.mono-breadcrumb-iconify, [mono-breadcrumb] *)[mono-glyph] {\r\n  display: inline-block;\r\n  width: 100%;\r\n  height: 100%;\r\n  flex-shrink: 0;\r\n  color: inherit;\r\n}\r\n\r\n/* =========================================\r\n   Content / title\r\n   ========================================= */\r\n\r\n:where([mono-breadcrumb]) [mono-content] {\r\n  display: inline-flex;\r\n  align-items: center;\r\n  min-width: 0;\r\n}\r\n\r\n:where([mono-breadcrumb]) [mono-title] {\r\n  font-size: inherit;\r\n  font-weight: inherit;\r\n  color: inherit;\r\n  line-height: inherit;\r\n}\r\n\r\n/* A flex item's `min-width` is `auto` — its content — so without this the\r\n   crumbs could not shrink past their clamp and the row simply overflowed its\r\n   container (measured: 543px of crumbs in a 512px box). Letting the chain go to\r\n   zero turns the clamp into a CEILING: a crumb takes at most `truncate-width`,\r\n   and less when the row is tight. */\r\n[mono-breadcrumb][mono-truncate] :is([mono-item], [mono-action], [mono-content]) {\r\n  min-width: 0;\r\n}\r\n\r\n[mono-breadcrumb][mono-truncate] [mono-title] {\r\n  display: block;\r\n  max-width: var(--mono-breadcrumb-truncate-width, 12ch);\r\n  overflow: hidden;\r\n  text-overflow: ellipsis;\r\n  white-space: nowrap;\r\n}\r\n\r\n[mono-breadcrumb][mono-truncate] [mono-item][mono-current] [mono-title] {\r\n  max-width: var(--mono-breadcrumb-truncate-width-current, 18ch);\r\n}\r\n\r\n/* =========================================\r\n   Badge — EXTENSION, borrowing `.badge`'s shape\r\n   ========================================= */\r\n\r\n/* basecoat@1.0.2 styles/vega.css .badge — h-5 gap-1 rounded-4xl border border-transparent px-2 py-0.5 text-xs font-medium transition-all [&>svg]:size-3! */\r\n:where([mono-breadcrumb]) [mono-badge] {\r\n  flex-shrink: 0;\r\n  display: inline-flex;\r\n  align-items: center;\r\n  justify-content: center;\r\n  gap: var(--mono-spacing);\r\n  height: var(--_mono-breadcrumb-badge-height);\r\n  padding: 0 var(--_mono-breadcrumb-badge-pad-x);\r\n  border: var(--mono-border-width) solid transparent;\r\n  border-radius: var(--_mono-breadcrumb-badge-radius);\r\n  font-size: var(--_mono-breadcrumb-badge-font);\r\n  font-weight: var(--_mono-breadcrumb-badge-weight);\r\n  line-height: 1;\r\n  background: var(--_mono-breadcrumb-badge-bg);\r\n  color: var(--_mono-breadcrumb-badge-color);\r\n}\r\n\r\n/* The roles ink the pill tonally — the same wash the ported chip and menu use. */\r\n[mono-breadcrumb] [mono-badge=\"primary\"] {\r\n  background: color-mix(in oklab, var(--_mono-breadcrumb-primary) var(--mono-mode-tint), transparent);\r\n  color: var(--_mono-breadcrumb-primary);\r\n}\r\n\r\n[mono-breadcrumb] [mono-badge=\"success\"] {\r\n  background: color-mix(in oklab, var(--_mono-breadcrumb-success) var(--mono-mode-tint), transparent);\r\n  color: var(--_mono-breadcrumb-success);\r\n}\r\n\r\n[mono-breadcrumb] [mono-badge=\"danger\"] {\r\n  background: color-mix(in oklab, var(--_mono-breadcrumb-danger) var(--mono-mode-tint), transparent);\r\n  color: var(--_mono-breadcrumb-danger);\r\n}\r\n\r\n[mono-breadcrumb] [mono-badge=\"warning\"] {\r\n  background: color-mix(in oklab, var(--_mono-breadcrumb-warning) var(--mono-mode-tint), transparent);\r\n  color: var(--_mono-breadcrumb-warning);\r\n}\r\n\r\n[mono-breadcrumb] [mono-badge=\"info\"] {\r\n  background: color-mix(in oklab, var(--_mono-breadcrumb-info) var(--mono-mode-tint), transparent);\r\n  color: var(--_mono-breadcrumb-info);\r\n}\r\n\r\n/* =========================================\r\n   Separator\r\n   ========================================= */\r\n\r\n/* basecoat@1.0.2 components/breadcrumb.css .breadcrumb li[aria-hidden='true'] — select-none */\r\n:where([mono-breadcrumb]) [mono-separator] {\r\n  flex-shrink: 0;\r\n  display: inline-flex;\r\n  align-items: center;\r\n  justify-content: center;\r\n  align-self: center;\r\n  /* Upstream's separator is an SVG at `size-3.5`, so the slot between two\r\n     crumbs is 14px wide whatever is in it. A text glyph like `›` is barely 4px,\r\n     which — on a flavor with a tight gap — left the labels all but touching.\r\n     Reserving the same box is what keeps the row legible either way. */\r\n  min-width: var(--_mono-breadcrumb-sep-size);\r\n  font-size: var(--_mono-breadcrumb-sep-font);\r\n  line-height: 1;\r\n  color: var(--_mono-breadcrumb-sep-color);\r\n  user-select: none;\r\n}\r\n\r\n/* basecoat@1.0.2 styles/vega.css .breadcrumb li[aria-hidden='true'] > svg — size-3.5 */\r\n[mono-separator] > svg,\r\n[mono-separator] > [data-mono-slot] > svg,\r\n[mono-separator] slot::slotted(svg) {\r\n  display: block;\r\n  width: var(--_mono-breadcrumb-sep-size);\r\n  height: var(--_mono-breadcrumb-sep-size);\r\n}\r\n\r\n[mono-separator] > [data-mono-slot] {\r\n  display: contents;\r\n}\r\n\r\n/* basecoat@1.0.2 components/breadcrumb.css .breadcrumb [data-rtl-flip] — rtl:rotate-180 */\r\n[dir=\"rtl\"] [mono-breadcrumb] [mono-separator] > svg {\r\n  rotate: 180deg;\r\n}\r\n\r\n/* =========================================\r\n   Reduced motion\r\n   ========================================= */\r\n\r\n@media (prefers-reduced-motion: reduce) {\r\n  [mono-breadcrumb] [mono-action] {\r\n    transition: none;\r\n  }\r\n}\r\n";
//#endregion
//#region src/components/breadcrumb/mono-breadcrumb.shadow.ts
var MonoBreadcrumbShadow = class MonoBreadcrumbShadow extends withShadowUtilityStyles(MonoBreadcrumbCore(LitElement)) {
	constructor(..._args) {
		super(..._args);
		this._ssrItemCount = null;
	}
	static {
		this.styles = [unsafeCSS(toShadowCss(breadcrumb_default, {
			host: "mono-breadcrumb",
			hostDisplay: "block"
		}))];
	}
	_useIconSlots() {
		return true;
	}
	/**
	* Cap the HYDRATION render at exactly the server-rendered crumb count so the
	* client's first render reproduces the SSR'd DOM structure. After hydration
	* (`hasUpdated`) render the full list. Safety net for the rare case where the
	* client `items` ends up longer than what the server emitted. On the server,
	* always render the real `items`.
	*/
	_itemsForRender() {
		if (!isServer && !this.hasUpdated && this._ssrItemCount !== null) return this.items.slice(0, this._ssrItemCount);
		return this.items;
	}
	connectedCallback() {
		super.connectedCallback();
		if (isServer) return;
		this._ssrItemCount = this.shadowRoot ? this.shadowRoot.querySelectorAll(".mono-breadcrumb-item").length : null;
		flushSsrHydration(this, { gate: () => this._ssrItemCount === null || (this.items?.length ?? 0) >= this._ssrItemCount });
	}
	firstUpdated(changed) {
		super.firstUpdated?.(changed);
		if (isServer) return;
		this._syncLightIcons();
		if (this._ssrItemCount !== null && this._ssrItemCount < (this.items?.length ?? 0)) this.requestUpdate();
	}
	updated(changed) {
		super.updated?.(changed);
		if (!isServer) this._syncLightIcons();
	}
	/**
	* Register the consumer's own `slot="icon-<id>"` light children.
	*
	* `renderBreadcrumbIcon` only emits the wrapper (and therefore the `<slot>`) when
	* the item has an `icon` OR `getSlotIconNodes(id)` reports something. That map is
	* filled by the LIGHT build's capture pass, which never runs here — so a
	* user-slotted `<svg slot="icon-home">` produced no wrapper, no slot, and no icon
	* at all. Register them before render so the slot exists for them to project into.
	*
	* Must run in `willUpdate`, not `updated`: by `updated` the render that needed the
	* information has already happened.
	*/
	willUpdate(changed) {
		if (!isServer) this._captureUserIconSlots();
		super.willUpdate?.(changed);
	}
	_captureUserIconSlots() {
		for (const el of Array.from(this.querySelectorAll(":scope > [slot^=\"icon-\"]"))) {
			if (el.dataset.monoIconSlot !== void 0) continue;
			const id = (el.getAttribute("slot") ?? "").slice(5);
			if (!id) continue;
			const known = this._slotIcons.get(id);
			if (known?.includes(el)) continue;
			this._slotIcons.set(id, [...known ?? [], el]);
		}
	}
	/**
	* Reconcile LIGHT-DOM icon spans (this element's own children) with `items`.
	* Each becomes a `<span slot="icon-<id>" class="mono-breadcrumb-iconify i-…">`
	* that projects into the shadow `<slot name="icon-<id>">` and is styled by the
	* page's global UnoCSS. Client-only; icons paint at hydration.
	*/
	_syncLightIcons() {
		const wanted = /* @__PURE__ */ new Map();
		for (const item of this.items ?? []) if (item.icon && isIconifyClass(item.icon)) wanted.set(item.id, item.icon);
		const existing = /* @__PURE__ */ new Map();
		for (const el of Array.from(this.querySelectorAll(":scope > [data-mono-icon-slot]"))) existing.set(el.dataset.monoIconSlot || "", el);
		for (const [id, el] of existing) {
			const icon = wanted.get(id);
			if (icon === void 0) el.remove();
			else {
				el.className = `mono-breadcrumb-iconify ${icon}`;
				el.setAttribute("mono-glyph", "");
				wanted.delete(id);
			}
		}
		for (const [id, icon] of wanted) {
			const span = document.createElement("span");
			span.dataset.monoIconSlot = id;
			span.setAttribute("slot", `icon-${id}`);
			span.setAttribute("aria-hidden", "true");
			span.className = `mono-breadcrumb-iconify ${icon}`;
			span.setAttribute("mono-glyph", "");
			this.appendChild(span);
		}
	}
};
MonoBreadcrumbShadow = __decorate([customElement("mono-shadow-breadcrumb")], MonoBreadcrumbShadow);
//#endregion
//#region src/components/breadcrumb/breadcrumb-list-core.ts
var autoBreadcrumbListId = 0;
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
var MonoBreadcrumbListCore = (superClass) => {
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
//#region src/components/breadcrumb/mono-breadcrumb-list.shadow.ts
var MonoBreadcrumbListShadow = class MonoBreadcrumbListShadow extends withShadowUtilityStyles(MonoBreadcrumbListCore(LitElement)) {
	constructor(..._args) {
		super(..._args);
		this._ssrItemCount = null;
	}
	static {
		this.styles = [unsafeCSS(toShadowCss(breadcrumb_default, {
			host: "mono-breadcrumb-list",
			hostDisplay: "block"
		}))];
	}
	_useIconSlots() {
		return true;
	}
	/**
	* Cap the HYDRATION render at exactly the server-rendered crumb count so the
	* client's first render reproduces the SSR'd DOM structure; full list after.
	*/
	_itemsForRender() {
		const effective = this._getEffectiveItems();
		if (!isServer && !this.hasUpdated && this._ssrItemCount !== null) return effective.slice(0, this._ssrItemCount);
		return effective;
	}
	connectedCallback() {
		super.connectedCallback();
		if (isServer) return;
		this._ssrItemCount = this.shadowRoot ? this.shadowRoot.querySelectorAll(".mono-breadcrumb-item").length : null;
		flushSsrHydration(this, { gate: () => this._ssrItemCount === null || this._getEffectiveItems().length >= this._ssrItemCount });
	}
	firstUpdated(changed) {
		super.firstUpdated?.(changed);
		if (isServer) return;
		this._syncLightIcons();
		const effectiveLen = this._getEffectiveItems().length;
		if (this._ssrItemCount !== null && this._ssrItemCount < effectiveLen) this.requestUpdate();
	}
	updated(changed) {
		super.updated?.(changed);
		if (!isServer) this._syncLightIcons();
	}
	/**
	* Reconcile LIGHT-DOM icon spans (this element's own children) with the
	* effective items. Each becomes a `<span slot="icon-<id>" class="i-…">` that
	* projects into the shadow `<slot name="icon-<id>">`, styled by the page's
	* global UnoCSS. Client-only; icons paint at hydration.
	*/
	_syncLightIcons() {
		const wanted = /* @__PURE__ */ new Map();
		for (const item of this._getEffectiveItems()) if (item.icon && isIconifyClass(item.icon)) wanted.set(item.id, item.icon);
		const existing = /* @__PURE__ */ new Map();
		for (const el of Array.from(this.querySelectorAll(":scope > [data-mono-icon-slot]"))) existing.set(el.dataset.monoIconSlot || "", el);
		for (const [id, el] of existing) {
			const icon = wanted.get(id);
			if (icon === void 0) el.remove();
			else {
				el.className = `mono-breadcrumb-iconify ${icon}`;
				el.setAttribute("mono-glyph", "");
				wanted.delete(id);
			}
		}
		for (const [id, icon] of wanted) {
			const span = document.createElement("span");
			span.dataset.monoIconSlot = id;
			span.setAttribute("slot", `icon-${id}`);
			span.setAttribute("aria-hidden", "true");
			span.className = `mono-breadcrumb-iconify ${icon}`;
			span.setAttribute("mono-glyph", "");
			this.appendChild(span);
		}
	}
};
MonoBreadcrumbListShadow = __decorate([customElement("mono-shadow-breadcrumb-list")], MonoBreadcrumbListShadow);
//#endregion
export { MonoBreadcrumbCore, MonoBreadcrumbListShadow, MonoBreadcrumbShadow, coerceItems, findItemIndex, generateBreadcrumbRootClasses, renderBreadcrumbBadge, renderBreadcrumbIcon, renderBreadcrumbItemRow, renderBreadcrumbItemsLeadingSep, renderBreadcrumbList, renderBreadcrumbSeparator, resolveCurrentId, validateBreadcrumbProps };
