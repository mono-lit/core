import { l as monoHostChildNodes } from "../mono-ui-CPV7rrdo.js";
import { t as customElement } from "../mono-element-B0kP_96P.js";
import { a as defineHybridPropAliases, n as arrayHasChanged, r as booleanStringConverter, t as __decorate } from "../decorate-DEXtNagw.js";
import { t as dispatchMonoEvent } from "../mono-event-Bi1qP9uN.js";
import { a as parkDetachedNodes, s as placeSlotNode } from "../light-slots-DW1WgfgT.js";
import { LitElement, html, nothing, unsafeCSS } from "lit";
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
var MonoTabsCore = (superClass) => {
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
//#region src/components/tabs/tabs.css?raw
var tabs_default = "/* @unocss-include */\r\n\r\n/* =========================================================================\r\n   mono-tabs — a port of Basecoat's `.tabs` (basecoat-css@1.0.2, vega style).\r\n\r\n   Styled by ATTRIBUTE, like Basecoat — and the attributes mirror the element's\r\n   props one for one, so hand-written markup reads like the Lit / Vue tag:\r\n\r\n     <mono-tabs size=\"lg\" color=\"success\" variant=\"pill\" model-value=\"a\">\r\n     <div mono-tabs mono-size=\"lg\" mono-color=\"success\" mono-variant=\"pill\"\r\n          role=\"tablist\" aria-orientation=\"horizontal\">\r\n       <button mono-tab type=\"button\" role=\"tab\" aria-selected=\"true\">\r\n         <span mono-icon>…</span>\r\n         <span mono-label>Overview</span>\r\n         <span mono-badge>3</span>\r\n       </button>\r\n     </div>\r\n\r\n   An absent attribute is the prop's default (`:not([mono-size])` = md,\r\n   `:not([mono-color])` = primary, `:not([mono-variant])` = underline). The\r\n   element writes them on its root — the host in the light build, an inner root\r\n   in the shadow one — plus `mono-disabled`. The old classes\r\n   (`.mono-tabs.md.primary.variant-pill`, `.mono-tabs-tab.on`) are still emitted\r\n   as inert hooks until 2.0 but no rule here reads them.\r\n\r\n   Selector map (ours ≡ upstream):\r\n     [mono-tabs]                     ≡ .tabs > [role='tablist'] (inline-flex w-fit\r\n                                       items-center justify-center rounded-lg\r\n                                       p-[3px] h-9, bg-muted unless line)\r\n                                       — DEVIATION: this element renders the STRIP\r\n                                       only, never the panels, so there is no\r\n                                       `.tabs` wrapper. Its job — the flex\r\n                                       direction and the `gap-2` to the panel —\r\n                                       belongs to the consumer's own layout.\r\n     [mono-variant=\"pill\"]           ≡ the DEFAULT tablist (upstream has no name\r\n                                       for it; ours is `pill`)\r\n     [mono-variant=\"underline\"]      ≡ [data-variant='line'] (gap-1 rounded-none\r\n                                       bg-transparent, selected via the ::after bar)\r\n     [mono-variant=\"ghost\"]          ≡ EXTENSION\r\n     [aria-orientation=\"vertical\"]   ≡ [aria-orientation='vertical'] (h-fit\r\n                                       flex-col; tabs w-full justify-start)\r\n     [mono-tab]                      ≡ > [role='tab'] (relative inline-flex flex-1\r\n                                       items-center justify-center whitespace-nowrap\r\n                                       gap-1.5 rounded-md border border-transparent\r\n                                       px-2 py-1 text-sm font-medium, ink\r\n                                       foreground/60 → foreground on hover)\r\n     [mono-tab][aria-selected=true]  ≡ [role='tab'][aria-selected='true'] — the\r\n                                       pill fill (bg-background shadow-sm, dark\r\n                                       border-input bg-input/30) or the line bar\r\n     [mono-tab]::after               ≡ the `after:` bar the line variant reveals\r\n                                       (inset-x-0 bottom-[-5px] h-0.5 bg-foreground)\r\n     [mono-icon]                     ≡ [&_svg:not([class*='size-'])]:size-4, plus\r\n                                       upstream's ps-1.5 / pe-1.5 when a tab leads\r\n                                       or trails with one\r\n     [mono-label]                    ≡ the tab's own text\r\n     [mono-badge]                    ≡ EXTENSION\r\n     [mono-size]/[mono-color]        ≡ EXTENSION (upstream ships one size, no colour)\r\n\r\n   PART NAMES ARE PATH-SCOPED. `[mono-icon]`, `[mono-label]` and `[mono-badge]`\r\n   are also button's, input's and card's part names, so every rule here is\r\n   written as a child path from the root — `:where([mono-tabs] > [mono-tab]) >\r\n   [mono-label]`. The `:where()` keeps that at (0,1,0), the weight a\r\n   one-attribute rule would have, so a `cssClass` utility still wins by source\r\n   order.\r\n\r\n   STATE IS ARIA, not a class. `aria-selected` and `disabled` are what the\r\n   element already renders and what upstream keys on, so the port needs no\r\n   `mono-selected` of its own — and hand-written markup that is accessible is\r\n   styled correctly by construction.\r\n\r\n   FLAVORS set `--mono-tabs-{radius,padding,height,gap,tab-radius,tab-pad-x,\r\n   tab-pad-y,tab-font,tab-gap,tab-font-weight,tab-text-transform,\r\n   tab-letter-spacing,icon-size}`; every fallback here is vega's value\r\n   (`node scripts/basecoat-styles.mjs --varying \"tabs\"` prints the matrix).\r\n   ========================================================================= */\r\n\r\nmono-tabs {\r\n  display: block;\r\n}\r\n\r\n/* =========================================\r\n   Root — the tablist\r\n   ========================================= */\r\n\r\n/* basecoat@1.0.2 components/tabs.css .tabs >> > [role='tablist'] — text-muted-foreground\r\n   inline-flex w-fit items-center justify-center */\r\n/* basecoat@1.0.2 styles/vega.css .tabs > [role='tablist'] — rounded-lg p-[3px] h-9 */\r\n[mono-tabs] {\r\n  /* ── the six roles, each a public knob over a Basecoat token ───────────── */\r\n  --_mono-tabs-primary: var(--mono-tabs-primary, var(--primary));\r\n  --_mono-tabs-secondary: var(--mono-tabs-secondary, var(--secondary-foreground));\r\n  --_mono-tabs-success: var(--mono-tabs-success, var(--success));\r\n  --_mono-tabs-danger: var(--mono-tabs-danger, var(--destructive));\r\n  --_mono-tabs-warning: var(--mono-tabs-warning, var(--warning));\r\n  --_mono-tabs-info: var(--mono-tabs-info, var(--info));\r\n  --_mono-tabs-teal: var(--mono-tabs-teal, var(--teal));\r\n  --_mono-tabs-purple: var(--mono-tabs-purple, var(--purple));\r\n  --_mono-tabs-neutral: var(--mono-tabs-neutral, var(--neutral));\r\n  --_mono-tabs-dark: var(--mono-tabs-dark, var(--dark));\r\n  /* the colour in play — `primary` unless a [mono-color] rule re-points it */\r\n  --_mono-tabs-accent: var(--mono-tabs-accent, var(--_mono-tabs-accent-preset, var(--_mono-tabs-primary)));\r\n\r\n  /* ── inks. `text-foreground/60 → text-foreground`, and the dark-mode pair\r\n        `text-muted-foreground → text-foreground`, ride one mode token. ────── */\r\n  --_mono-tabs-text: var(--mono-tabs-text, var(--foreground));\r\n  --_mono-tabs-muted: var(--mono-tabs-muted, var(--mono-mode-tab-inactive-fg));\r\n  /* `-background` is the pre-port name for the strip's own fill, honoured\r\n     until 2.0; `-surface` named the SELECTED tab's fill and is read there. */\r\n  --_mono-tabs-bg: var(--mono-tabs-bg, var(--mono-tabs-background, var(--muted)));\r\n\r\n  /* ── md metrics live on the unqualified root ON PURPOSE ────────────────── */\r\n  --_mono-tabs-height: var(--mono-tabs-height, var(--_mono-tabs-height-preset, var(--mono-tabs-height-md, var(--mono-control-height-md))));\r\n  --_mono-tabs-radius: var(--mono-tabs-radius, var(--_mono-tabs-radius-preset, var(--mono-tabs-radius-md, var(--mono-radius-lg))));\r\n  --_mono-tabs-padding: var(--mono-tabs-padding, var(--_mono-tabs-padding-preset, var(--mono-tabs-padding-md, 3px)));\r\n  /* `--mono-tabs-gap` named the gap INSIDE a tab before the port and still\r\n     does; the STRIP's own gap — upstream's `gap-1` on the line variant — is a\r\n     new thing and gets a new name. */\r\n  --_mono-tabs-gap: var(--mono-tabs-strip-gap, var(--_mono-tabs-gap-preset, 0px));\r\n\r\n  --_mono-tabs-tab-radius: var(--mono-tabs-tab-radius, var(--_mono-tabs-tab-radius-preset, var(--mono-tabs-tab-radius-md, var(--mono-radius-md))));\r\n  /* `-pad-x` / `-pad-y` / `-gap` without the `tab-` are the pre-port names for\r\n     these three, honoured until 2.0. */\r\n  --_mono-tabs-tab-pad-x: var(--mono-tabs-tab-pad-x, var(--mono-tabs-pad-x, var(--_mono-tabs-tab-pad-x-preset, var(--mono-tabs-tab-pad-x-md, calc(var(--mono-spacing) * 2)))));\r\n  --_mono-tabs-tab-pad-y: var(--mono-tabs-tab-pad-y, var(--mono-tabs-pad-y, var(--_mono-tabs-tab-pad-y-preset, var(--mono-tabs-tab-pad-y-md, var(--mono-spacing)))));\r\n  --_mono-tabs-tab-gap: var(--mono-tabs-tab-gap, var(--mono-tabs-gap, var(--_mono-tabs-tab-gap-preset, var(--mono-tabs-tab-gap-md, calc(var(--mono-spacing) * 1.5)))));\r\n  --_mono-tabs-font: var(--mono-tabs-font, var(--_mono-tabs-font-preset, var(--mono-tabs-tab-font-md, var(--mono-text-sm))));\r\n  --_mono-tabs-line-height: var(--mono-tabs-line-height, var(--_mono-tabs-line-height-preset, var(--mono-text-sm--lh)));\r\n  --_mono-tabs-font-weight: var(--mono-tabs-font-weight, var(--mono-tabs-tab-font-weight, var(--mono-font-weight-medium)));\r\n  --_mono-tabs-text-transform: var(--mono-tabs-text-transform, var(--mono-tabs-tab-text-transform, none));\r\n  --_mono-tabs-letter-spacing: var(--mono-tabs-letter-spacing, var(--mono-tabs-tab-letter-spacing, normal));\r\n  --_mono-tabs-icon-size: var(--mono-tabs-icon-size, var(--_mono-tabs-icon-size-preset, var(--mono-tabs-icon-size-md, calc(var(--mono-spacing) * 4))));\r\n\r\n  /* ── the selected PILL — `bg-background shadow-sm`, dark `border-input\r\n        bg-input/30`, both carried by mode tokens ─────────────────────────── */\r\n  --_mono-tabs-active-bg: var(--mono-tabs-active-bg, var(--mono-tabs-surface, var(--mono-mode-tab-active-bg)));\r\n  --_mono-tabs-active-border: var(--mono-tabs-active-border, var(--mono-mode-tab-active-border));\r\n  --_mono-tabs-active-shadow: var(--mono-tabs-active-shadow, var(--mono-shadow-sm));\r\n  /* EXTENSION: upstream's selected tab is `text-foreground`; ours takes the role,\r\n     which IS the foreground under the Basecoat palette. */\r\n  --_mono-tabs-active-color: var(--mono-tabs-active-color, var(--_mono-tabs-accent));\r\n\r\n  /* ── the LINE bar — `after:bg-foreground h-0.5 bottom-[-5px]` ──────────── */\r\n  --_mono-tabs-line-color: var(--mono-tabs-line-color, var(--_mono-tabs-accent));\r\n  --_mono-tabs-line-size: var(--mono-tabs-line-size, 2px);\r\n  --_mono-tabs-line-offset: var(--mono-tabs-line-offset, -5px);\r\n  /* EXTENSION, off by default: upstream's line variant has no baseline rule\r\n     under the strip, only the bar under the selected tab. A flavor or consumer\r\n     that wants the old full-width rule sets this. */\r\n  --_mono-tabs-line-track-color: var(--mono-tabs-line-track-color, transparent);\r\n  --_mono-tabs-line-track-size: var(--mono-tabs-line-track-size, var(--_mono-tabs-line-size));\r\n\r\n  /* ── focus — `focus-visible:border-ring ring-ring/50 ring-[3px]` ───────── */\r\n  --_mono-tabs-ring-color: var(--mono-tabs-ring-color, var(--ring));\r\n  --_mono-tabs-ring-width: var(--mono-tabs-ring-width, var(--mono-ring-width));\r\n\r\n  display: inline-flex;\r\n  width: fit-content;\r\n  max-width: 100%;\r\n  align-items: center;\r\n  justify-content: center;\r\n  gap: var(--_mono-tabs-gap);\r\n  box-sizing: border-box;\r\n  height: var(--_mono-tabs-height);\r\n  padding: var(--_mono-tabs-padding);\r\n  border-radius: var(--_mono-tabs-radius);\r\n  color: var(--muted-foreground);\r\n  font-family: inherit;\r\n}\r\n\r\n[mono-tabs],\r\n:where([mono-tabs]) *,\r\n:where([mono-tabs]) *::before,\r\n:where([mono-tabs]) *::after {\r\n  box-sizing: border-box;\r\n}\r\n\r\n/* basecoat@1.0.2 components/tabs.css .tabs >> > [role='tablist'] >> &[aria-orientation='vertical']\r\n   — h-fit flex-col */\r\n[mono-tabs][aria-orientation=\"vertical\"] {\r\n  height: fit-content;\r\n  flex-direction: column;\r\n}\r\n\r\n/* =========================================\r\n   Variants — upstream's default tablist and its `[data-variant='line']`\r\n   ========================================= */\r\n\r\n/* basecoat@1.0.2 styles/vega.css .tabs > [role='tablist']:not([data-variant='line']) — bg-muted */\r\n[mono-tabs][mono-variant=\"pill\"] {\r\n  background: var(--_mono-tabs-bg);\r\n}\r\n\r\n/* basecoat@1.0.2 styles/vega.css .tabs > [role='tablist'][data-variant='line']\r\n   — gap-1 rounded-none bg-transparent */\r\n[mono-tabs]:is(:not([mono-variant]), [mono-variant=\"underline\"]) {\r\n  --_mono-tabs-gap: var(--mono-tabs-strip-gap, var(--mono-spacing));\r\n  border-radius: 0;\r\n  background: transparent;\r\n  /* EXTENSION — the baseline rule, off unless a flavor or consumer turns it on. */\r\n  box-shadow: inset 0 calc(-1 * var(--_mono-tabs-line-track-size)) 0 0 var(--_mono-tabs-line-track-color);\r\n}\r\n\r\n/* EXTENSION — a bare strip whose tabs wash on hover and hold a tint when selected. */\r\n[mono-tabs][mono-variant=\"ghost\"] {\r\n  --_mono-tabs-gap: var(--mono-tabs-strip-gap, var(--mono-spacing));\r\n  background: transparent;\r\n}\r\n\r\n/* =========================================\r\n   Sizes — EXTENSION: Basecoat ships ONE tab size; md is its `[role='tablist']`\r\n   ========================================= */\r\n\r\n[mono-tabs][mono-size=\"xs\"] {\r\n  --_mono-tabs-height-preset: var(--mono-control-height-xs);\r\n  --_mono-tabs-radius-preset: var(--mono-tabs-radius-xs, var(--mono-radius-md));\r\n  --_mono-tabs-padding-preset: var(--mono-tabs-padding-xs, 2px);\r\n  --_mono-tabs-tab-radius-preset: var(--mono-tabs-tab-radius-xs, var(--mono-radius-sm));\r\n  --_mono-tabs-tab-pad-x-preset: var(--mono-tabs-tab-pad-x-xs, calc(var(--mono-spacing) * 1.5));\r\n  --_mono-tabs-tab-pad-y-preset: var(--mono-tabs-tab-pad-y-xs, calc(var(--mono-spacing) * 0.25));\r\n  --_mono-tabs-tab-gap-preset: calc(var(--mono-spacing) * 1);\r\n  --_mono-tabs-font-preset: var(--mono-tabs-tab-font-xs, var(--mono-text-xs));\r\n  --_mono-tabs-line-height-preset: var(--mono-text-xs--lh);\r\n  --_mono-tabs-icon-size-preset: var(--mono-tabs-icon-size-xs, calc(var(--mono-spacing) * 3));\r\n}\r\n\r\n[mono-tabs][mono-size=\"sm\"] {\r\n  --_mono-tabs-height-preset: var(--mono-control-height-sm);\r\n  --_mono-tabs-radius-preset: var(--mono-tabs-radius-sm, var(--mono-radius-md));\r\n  --_mono-tabs-padding-preset: var(--mono-tabs-padding-sm, 2px);\r\n  --_mono-tabs-tab-radius-preset: var(--mono-tabs-tab-radius-sm, var(--mono-radius-sm));\r\n  --_mono-tabs-tab-pad-x-preset: var(--mono-tabs-tab-pad-x-sm, calc(var(--mono-spacing) * 1.5));\r\n  --_mono-tabs-tab-pad-y-preset: var(--mono-tabs-tab-pad-y-sm, calc(var(--mono-spacing) * 0.5));\r\n  --_mono-tabs-tab-gap-preset: calc(var(--mono-spacing) * 1.25);\r\n  --_mono-tabs-font-preset: var(--mono-tabs-tab-font-sm, var(--mono-text-xs));\r\n  --_mono-tabs-line-height-preset: var(--mono-text-xs--lh);\r\n  --_mono-tabs-icon-size-preset: var(--mono-tabs-icon-size-sm, calc(var(--mono-spacing) * 3.5));\r\n}\r\n\r\n[mono-tabs][mono-size=\"lg\"] {\r\n  --_mono-tabs-height-preset: var(--mono-control-height-lg);\r\n  --_mono-tabs-radius-preset: var(--mono-tabs-radius-lg, var(--mono-radius-lg));\r\n  --_mono-tabs-padding-preset: var(--mono-tabs-padding-lg, 4px);\r\n  --_mono-tabs-tab-radius-preset: var(--mono-tabs-tab-radius-lg, var(--mono-radius-md));\r\n  --_mono-tabs-tab-pad-x-preset: var(--mono-tabs-tab-pad-x-lg, calc(var(--mono-spacing) * 3));\r\n  --_mono-tabs-tab-pad-y-preset: var(--mono-tabs-tab-pad-y-lg, calc(var(--mono-spacing) * 1.5));\r\n  --_mono-tabs-tab-gap-preset: calc(var(--mono-spacing) * 2);\r\n  --_mono-tabs-font-preset: var(--mono-tabs-tab-font-lg, var(--mono-text-sm));\r\n  --_mono-tabs-icon-size-preset: var(--mono-tabs-icon-size-lg, calc(var(--mono-spacing) * 4.5));\r\n}\r\n\r\n[mono-tabs][mono-size=\"xl\"] {\r\n  --_mono-tabs-height-preset: var(--mono-control-height-xl);\r\n  --_mono-tabs-radius-preset: var(--mono-tabs-radius-xl, var(--mono-radius-xl));\r\n  --_mono-tabs-padding-preset: var(--mono-tabs-padding-xl, 5px);\r\n  --_mono-tabs-tab-radius-preset: var(--mono-tabs-tab-radius-xl, var(--mono-radius-lg));\r\n  --_mono-tabs-tab-pad-x-preset: var(--mono-tabs-tab-pad-x-xl, calc(var(--mono-spacing) * 3.5));\r\n  --_mono-tabs-tab-pad-y-preset: var(--mono-tabs-tab-pad-y-xl, calc(var(--mono-spacing) * 2));\r\n  --_mono-tabs-tab-gap-preset: calc(var(--mono-spacing) * 2.25);\r\n  --_mono-tabs-font-preset: var(--mono-tabs-tab-font-xl, var(--mono-text-base));\r\n  --_mono-tabs-line-height-preset: var(--mono-text-base--lh);\r\n  --_mono-tabs-icon-size-preset: var(--mono-tabs-icon-size-xl, calc(var(--mono-spacing) * 5));\r\n}\r\n\r\n[mono-tabs][mono-size=\"xxl\"] {\r\n  --_mono-tabs-height-preset: var(--mono-control-height-xxl);\r\n  --_mono-tabs-radius-preset: var(--mono-tabs-radius-xxl, var(--mono-radius-xl));\r\n  --_mono-tabs-padding-preset: var(--mono-tabs-padding-xxl, 6px);\r\n  --_mono-tabs-tab-radius-preset: var(--mono-tabs-tab-radius-xxl, var(--mono-radius-lg));\r\n  --_mono-tabs-tab-pad-x-preset: var(--mono-tabs-tab-pad-x-xxl, calc(var(--mono-spacing) * 4));\r\n  --_mono-tabs-tab-pad-y-preset: var(--mono-tabs-tab-pad-y-xxl, calc(var(--mono-spacing) * 2.5));\r\n  --_mono-tabs-tab-gap-preset: calc(var(--mono-spacing) * 2.5);\r\n  --_mono-tabs-font-preset: var(--mono-tabs-tab-font-xxl, var(--mono-text-lg));\r\n  --_mono-tabs-line-height-preset: var(--mono-text-lg--lh);\r\n  --_mono-tabs-icon-size-preset: var(--mono-tabs-icon-size-xxl, calc(var(--mono-spacing) * 5.5));\r\n}\r\n\r\n/* =========================================\r\n   Colours — EXTENSION: the role inks the selected tab and the line bar\r\n   ========================================= */\r\n\r\n[mono-tabs][mono-color=\"primary\"] { --_mono-tabs-accent-preset: var(--_mono-tabs-primary); }\r\n[mono-tabs][mono-color=\"secondary\"] { --_mono-tabs-accent-preset: var(--_mono-tabs-secondary); }\r\n[mono-tabs][mono-color=\"success\"] { --_mono-tabs-accent-preset: var(--_mono-tabs-success); }\r\n[mono-tabs][mono-color=\"danger\"] { --_mono-tabs-accent-preset: var(--_mono-tabs-danger); }\r\n[mono-tabs][mono-color=\"warning\"] { --_mono-tabs-accent-preset: var(--_mono-tabs-warning); }\r\n[mono-tabs][mono-color=\"info\"] { --_mono-tabs-accent-preset: var(--_mono-tabs-info); }\r\n[mono-tabs][mono-color=\"teal\"] { --_mono-tabs-accent-preset: var(--_mono-tabs-teal); }\r\n[mono-tabs][mono-color=\"purple\"] { --_mono-tabs-accent-preset: var(--_mono-tabs-purple); }\r\n[mono-tabs][mono-color=\"neutral\"] { --_mono-tabs-accent-preset: var(--_mono-tabs-neutral); }\r\n[mono-tabs][mono-color=\"dark\"] { --_mono-tabs-accent-preset: var(--_mono-tabs-dark); }\r\n\r\n/* =========================================\r\n   Tab — `> [role='tab']`\r\n   ========================================= */\r\n\r\n/* basecoat@1.0.2 components/tabs.css .tabs >> > [role='tablist'] >> > [role='tab']\r\n   — relative inline-flex flex-1 items-center justify-center whitespace-nowrap\r\n   transition-all outline-none, disabled:pointer-events-none disabled:opacity-50 */\r\n/* basecoat@1.0.2 styles/vega.css .tabs > [role='tablist'] > [role='tab']\r\n   — gap-1.5 rounded-md border border-transparent px-2 py-1 text-sm font-medium,\r\n   text-foreground/60 hover:text-foreground (dark: muted-foreground → foreground),\r\n   focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] */\r\n:where([mono-tabs]) > [mono-tab] {\r\n  position: relative;\r\n  display: inline-flex;\r\n  flex: 1 1 auto;\r\n  align-items: center;\r\n  justify-content: center;\r\n  gap: var(--_mono-tabs-tab-gap);\r\n  padding: var(--_mono-tabs-tab-pad-y) var(--_mono-tabs-tab-pad-x);\r\n  border: var(--mono-border-width) solid transparent;\r\n  border-radius: var(--_mono-tabs-tab-radius);\r\n  background: transparent;\r\n  color: var(--_mono-tabs-muted);\r\n  font-family: inherit;\r\n  font-size: var(--_mono-tabs-font);\r\n  line-height: var(--_mono-tabs-line-height);\r\n  font-weight: var(--_mono-tabs-font-weight);\r\n  text-transform: var(--_mono-tabs-text-transform);\r\n  letter-spacing: var(--_mono-tabs-letter-spacing);\r\n  white-space: nowrap;\r\n  text-decoration: none;\r\n  cursor: pointer;\r\n  user-select: none;\r\n  outline: none;\r\n  appearance: none;\r\n  transition:\r\n    color var(--mono-duration) var(--mono-ease),\r\n    background-color var(--mono-duration) var(--mono-ease),\r\n    border-color var(--mono-duration) var(--mono-ease),\r\n    box-shadow var(--mono-duration) var(--mono-ease);\r\n}\r\n\r\n@media (hover: hover) {\r\n  [mono-tabs] > [mono-tab]:hover:not(:disabled):not([aria-disabled=\"true\"]) {\r\n    color: var(--_mono-tabs-text);\r\n  }\r\n}\r\n\r\n[mono-tabs] > [mono-tab]:focus-visible {\r\n  border-color: var(--_mono-tabs-ring-color);\r\n  box-shadow: 0 0 0 var(--_mono-tabs-ring-width)\r\n    color-mix(in oklab, var(--_mono-tabs-ring-color) var(--mono-ring-alpha), transparent);\r\n}\r\n\r\n/* basecoat@1.0.2 components/tabs.css .tabs >> > [role='tablist'] >> > [role='tab']\r\n   — disabled:pointer-events-none disabled:opacity-50. DEVIATION: 0.45, this\r\n   component's pre-port value. */\r\n[mono-tabs] > [mono-tab]:disabled,\r\n[mono-tabs] > [mono-tab][aria-disabled=\"true\"],\r\n[mono-tabs][mono-disabled] > [mono-tab] {\r\n  opacity: 0.45;\r\n  cursor: not-allowed;\r\n  pointer-events: none;\r\n}\r\n\r\n/* basecoat@1.0.2 styles/vega.css .tabs > [role='tablist'][aria-orientation='vertical'] > [role='tab']\r\n   — w-full justify-start */\r\n[mono-tabs][aria-orientation=\"vertical\"] > [mono-tab] {\r\n  width: 100%;\r\n  justify-content: flex-start;\r\n}\r\n\r\n/* Upstream suppresses the host page's generic anchor decoration the same way a\r\n   button would; tabs render as <button> today, but the rule is kept for a future\r\n   anchor tab (an `href` / RouterLink integration) — and for VitePress, whose\r\n   `.vp-doc a` would otherwise underline one. */\r\n[mono-tabs] a[mono-tab],\r\n[mono-tabs] a[mono-tab]:hover,\r\n[mono-tabs] a[mono-tab]:focus {\r\n  text-decoration: none;\r\n}\r\n\r\n[mono-tabs] a[mono-tab]::after {\r\n  display: none;\r\n}\r\n\r\n/* =========================================\r\n   Selected — `[aria-selected='true']`\r\n   ========================================= */\r\n\r\n/* basecoat@1.0.2 styles/vega.css .tabs > [role='tablist']:not([data-variant='line']) > [role='tab'][aria-selected='true']\r\n   — bg-background text-foreground shadow-sm, dark border-input bg-input/30 */\r\n[mono-tabs][mono-variant=\"pill\"] > [mono-tab][aria-selected=\"true\"] {\r\n  background: var(--_mono-tabs-active-bg);\r\n  border-color: var(--_mono-tabs-active-border);\r\n  box-shadow: var(--_mono-tabs-active-shadow);\r\n  color: var(--_mono-tabs-active-color);\r\n}\r\n\r\n/* EXTENSION — ghost holds a tint instead of a raised pill. */\r\n[mono-tabs][mono-variant=\"ghost\"] > [mono-tab][aria-selected=\"true\"] {\r\n  background: var(--mono-tabs-ghost-active-bg,\r\n    color-mix(in oklab, var(--_mono-tabs-accent) var(--mono-mode-tint), transparent));\r\n  color: var(--_mono-tabs-active-color);\r\n}\r\n\r\n@media (hover: hover) {\r\n  [mono-tabs][mono-variant=\"ghost\"] > [mono-tab]:hover:not(:disabled):not([aria-selected=\"true\"]) {\r\n    background: var(--mono-tabs-ghost-hover-bg, var(--mono-mode-ghost-hover));\r\n  }\r\n}\r\n\r\n/* basecoat@1.0.2 styles/vega.css .tabs > [role='tablist'][data-variant='line'] > [role='tab'][aria-selected='true']\r\n   — bg-transparent text-foreground shadow-none after:opacity-100 */\r\n[mono-tabs]:is(:not([mono-variant]), [mono-variant=\"underline\"]) > [mono-tab][aria-selected=\"true\"] {\r\n  background: transparent;\r\n  box-shadow: none;\r\n  color: var(--_mono-tabs-active-color);\r\n}\r\n\r\n/* =========================================\r\n   The line bar — the `::after` upstream reveals\r\n   ========================================= */\r\n\r\n/* basecoat@1.0.2 styles/vega.css .tabs > [role='tablist'] > [role='tab']\r\n   — after:absolute after:bg-foreground after:opacity-0 after:transition-opacity */\r\n:where([mono-tabs]) > [mono-tab]::after {\r\n  content: '';\r\n  position: absolute;\r\n  background: var(--_mono-tabs-line-color);\r\n  opacity: 0;\r\n  pointer-events: none;\r\n  transition: opacity var(--mono-duration) var(--mono-ease);\r\n}\r\n\r\n/* basecoat@1.0.2 styles/vega.css .tabs > [role='tablist'][data-variant='line'][aria-orientation='horizontal'] > [role='tab']\r\n   — after:inset-x-0 after:bottom-[-5px] after:h-0.5 */\r\n[mono-tabs]:is(:not([mono-variant]), [mono-variant=\"underline\"]):not([aria-orientation=\"vertical\"]) > [mono-tab]::after {\r\n  inset-inline: 0;\r\n  bottom: var(--_mono-tabs-line-offset);\r\n  height: var(--_mono-tabs-line-size);\r\n}\r\n\r\n/* basecoat@1.0.2 styles/vega.css .tabs > [role='tablist'][data-variant='line'][aria-orientation='vertical'] > [role='tab']\r\n   — after:inset-y-0 after:end-[-4px] after:w-0.5 */\r\n[mono-tabs]:is(:not([mono-variant]), [mono-variant=\"underline\"])[aria-orientation=\"vertical\"] > [mono-tab]::after {\r\n  inset-block: 0;\r\n  inset-inline-end: calc(var(--_mono-tabs-line-offset) + 1px);\r\n  width: var(--_mono-tabs-line-size);\r\n}\r\n\r\n[mono-tabs]:is(:not([mono-variant]), [mono-variant=\"underline\"]) > [mono-tab][aria-selected=\"true\"]::after {\r\n  opacity: 1;\r\n}\r\n\r\n/* =========================================\r\n   Icon — `[&_svg:not([class*='size-'])]:size-4`\r\n   ========================================= */\r\n\r\n:where([mono-tabs] > [mono-tab]) > [mono-icon] {\r\n  flex-shrink: 0;\r\n  display: inline-flex;\r\n  align-items: center;\r\n  justify-content: center;\r\n  width: var(--_mono-tabs-icon-size);\r\n  height: var(--_mono-tabs-icon-size);\r\n  color: inherit;\r\n  line-height: 1;\r\n  pointer-events: none;\r\n}\r\n\r\n/* Light: the `[data-mono-slot]` placeholder the svg is moved into. Shadow: the\r\n   projected svg. Either way it fills the box upstream sizes. */\r\n[mono-tabs] > [mono-tab] > [mono-icon] > :is(svg, span, [data-mono-slot]),\r\n[mono-tabs] > [mono-tab] > [mono-icon] > [data-mono-slot] > svg,\r\n[mono-tabs] > [mono-tab] > [mono-icon] slot::slotted(svg) {\r\n  display: block;\r\n  width: 100%;\r\n  height: 100%;\r\n}\r\n\r\n/* basecoat@1.0.2 styles/vega.css .tabs > [role='tablist'] > [role='tab']:has(> svg:first-child)\r\n   — ps-1.5. A tab that LEADS with a glyph tucks in on that side.\r\n\r\n   `:not([mono-empty])` is what keeps the two builds equal: the shadow one\r\n   renders an icon box for every tab (DSD has to have something to project into)\r\n   and marks the empty ones, so a bare `:has()` tucked in EVERY shadow tab. */\r\n[mono-tabs] > [mono-tab]:has(> [mono-icon]:first-child:not([mono-empty])) {\r\n  padding-inline-start: var(--mono-tabs-tab-icon-pad, calc(var(--mono-spacing) * 1.5));\r\n}\r\n\r\n/* basecoat@1.0.2 styles/vega.css .tabs > [role='tablist'] > [role='tab']:has(> svg:last-child)\r\n   — pe-1.5 */\r\n[mono-tabs] > [mono-tab]:has(> [mono-icon]:last-child:not([mono-empty])) {\r\n  padding-inline-end: var(--mono-tabs-tab-icon-pad, calc(var(--mono-spacing) * 1.5));\r\n}\r\n\r\n/* The shadow build renders the icon box for every tab (DSD projects into it) and\r\n   marks the empty ones; the light build renders only what it captured. */\r\n[mono-tabs] > [mono-tab] > [mono-icon][mono-empty] {\r\n  display: none;\r\n}\r\n\r\n/* =========================================\r\n   Label + badge\r\n   ========================================= */\r\n\r\n:where([mono-tabs] > [mono-tab]) > [mono-label] {\r\n  display: inline-block;\r\n  line-height: inherit;\r\n  text-decoration: none;\r\n}\r\n\r\n/* EXTENSION — a count beside the label. Upstream has no badge. */\r\n:where([mono-tabs] > [mono-tab]) > [mono-badge] {\r\n  --_mono-tabs-badge-size: var(--mono-tabs-badge-size, calc(var(--mono-spacing) * 4.5));\r\n  flex-shrink: 0;\r\n  display: inline-flex;\r\n  align-items: center;\r\n  justify-content: center;\r\n  min-width: var(--_mono-tabs-badge-size);\r\n  height: var(--_mono-tabs-badge-size);\r\n  padding-inline: calc(var(--mono-spacing) * 1.25);\r\n  border-radius: var(--mono-radius-full);\r\n  background: var(--mono-tabs-badge-bg, color-mix(in oklab, var(--foreground) 10%, transparent));\r\n  color: var(--mono-tabs-badge-color, var(--_mono-tabs-muted));\r\n  font-size: var(--mono-tabs-badge-font, var(--mono-text-xs));\r\n  font-weight: var(--mono-font-weight-semibold);\r\n  font-variant-numeric: tabular-nums;\r\n  line-height: 1;\r\n}\r\n\r\n[mono-tabs] > [mono-tab][aria-selected=\"true\"] > [mono-badge] {\r\n  background: var(--mono-tabs-badge-active-bg, var(--_mono-tabs-accent));\r\n  color: var(--mono-tabs-badge-active-color, var(--primary-foreground));\r\n}\r\n\r\n@media (prefers-reduced-motion: reduce) {\r\n  [mono-tabs] > [mono-tab],\r\n  [mono-tabs] > [mono-tab]::after {\r\n    transition: none;\r\n  }\r\n}\r\n";
//#endregion
//#region src/components/tabs/mono-tabs.ts
var MonoTabs = class MonoTabs extends MonoTabsCore(LitElement) {
	constructor(..._args) {
		super(..._args);
		this._slotsCaptured = false;
		this._slotIcons = /* @__PURE__ */ new Map();
	}
	static {
		this.styles = [unsafeCSS(tabs_default)];
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
