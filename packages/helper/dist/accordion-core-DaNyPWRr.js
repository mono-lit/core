import { a as defineHybridPropAliases, i as defineHybridPropAlias, r as booleanStringConverter, t as __decorate } from "./decorate-DbYFpi8R.js";
import { t as dispatchMonoEvent } from "./mono-event-CAZf0F_k.js";
import { t as isIconifyClass } from "./icon-BM9N-jOt.js";
import { html, nothing } from "lit";
import { property, query, state } from "lit/decorators.js";

//#region src/components/accordion/accordion-core.ts
/**
* `MonoAccordionCore` — all render-mode-agnostic logic for `mono-accordion`:
* reactive props, hybrid aliases, the camelCase attribute fallbacks, slot-presence
* `@state`, class/getter computation, click/toggle interactivity, and the
* imperative `focus/blur`. No `render()` — the light build keeps its
* `[data-mono-slot]` capture strategy and the shadow build uses native `<slot>`
* (each ships its own `render()`, mirroring `mono-card`).
*
* SSR-safe: no `document`/`window` access. `_headEl` (`@query`) is lazy and
* `focus/blur` only run client-side.
*/
const MonoAccordionCore = (superClass) => {
	class MonoAccordionCoreClass extends superClass {
		constructor(...args) {
			super(...args);
			this.size = "md";
			this.color = "primary";
			this.modelValue = false;
			this.disabled = false;
			this.cssClass = {};
			this.cssClassName = "";
			this._hasTitleSlotState = false;
			this._hasSubtitleSlotState = false;
			this._hasHeaderSlotState = false;
			this._hasIconSlotState = false;
			this._hasActionsSlotState = false;
			this._hasBodySlotState = false;
			this._rootEl = null;
			this.bindRoot = (el) => {
				this._rootEl = el ?? null;
				this._applyRootAttrs(this._rootEl);
			};
			defineHybridPropAliases(this, ["modelValue", "cssClass"]);
			defineHybridPropAlias(this, "label", "title");
			defineHybridPropAlias(this, "description", "subtitle");
			this.title = "";
			this.subtitle = "";
			this.icon = "";
			/**
			* Vue support:
			*
			* <mono-accordion :cssClass="{}" />
			* <mono-accordion :css-class="{}" />
			* <mono-accordion :cssclass="{}" />
			*/
			Object.defineProperty(this, "css-class", {
				get: () => this.cssClass,
				set: (value) => {
					this._setCssClass(value);
				},
				configurable: true,
				enumerable: false
			});
			Object.defineProperty(this, "cssclass", {
				get: () => this.cssClass,
				set: (value) => {
					this._setCssClass(value);
				},
				configurable: true,
				enumerable: false
			});
		}
		static get observedAttributes() {
			return [
				...super.observedAttributes ?? [],
				"modelvalue",
				"css-class",
				"cssclass",
				"label",
				"description"
			];
		}
		attributeChangedCallback(name, oldValue, newValue) {
			super.attributeChangedCallback(name, oldValue, newValue);
			if (oldValue === newValue) return;
			if (name === "modelvalue") {
				this.modelValue = this._toBoolean(newValue);
				return;
			}
			if (name === "css-class" || name === "cssclass") {
				this._setCssClass(newValue);
				return;
			}
			if (name === "label") {
				this.title = newValue ?? "";
				return;
			}
			if (name === "description") this.subtitle = newValue ?? "";
		}
		_toBoolean(value) {
			if (typeof value === "boolean") return value;
			if (typeof value === "string") {
				const normalized = value.toLowerCase().trim();
				return normalized === "" || normalized === "true";
			}
			return Boolean(value);
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
		*/
		_computeRootAttrs() {
			return {
				"mono-size": this.size === "md" ? null : this.size,
				"mono-color": this.color === "primary" ? null : this.color,
				"mono-open": this.modelValue ? "" : null,
				"mono-disabled": this.disabled ? "" : null,
				"mono-grouped": this._inGroup() ? "" : null
			};
		}
		/**
		* Is this item inside an accordion group?
		*
		* The CSS can see that for hand-written markup — `[mono-accordion-group] >
		* [mono-accordion]` — but not for the ELEMENT: the light build puts the
		* custom-element host between the group and the root, and the shadow build
		* puts a boundary there, and a selector crosses neither. So the element
		* detects its own group and writes it as an attribute, which is the one thing
		* that reaches the root in both builds.
		*
		* Only MEMBERSHIP, never position: "am I the last one?" would be answered
		* from however many siblings existed at this render, and appending a fourth
		* item does not re-render the third. The divider is the group's business and
		* rides its own `:last-child` (see accordion.css).
		*
		* `closest()` on the HOST, not the root: the group is the consumer's wrapper
		* around `<mono-accordion>`, so the host is what sits inside it.
		*/
		_inGroup() {
			if (typeof this.closest !== "function") return false;
			return Boolean(this.closest("[mono-accordion-group], .mono-accordion-group"));
		}
		_applyRootAttrs(root) {
			if (!root) return;
			if (!root.hasAttribute("mono-accordion")) root.setAttribute("mono-accordion", "");
			for (const [name, value] of Object.entries(this._computeRootAttrs())) if (value === null) root.removeAttribute(name);
			else if (root.getAttribute(name) !== value) root.setAttribute(name, value);
		}
		updated(changed) {
			super.updated?.(changed);
			this._applyRootAttrs(this._rootEl);
		}
		get _wrapperClasses() {
			return [
				"mono-accordion",
				this.size,
				this.color,
				this.modelValue ? "open" : "",
				this.disabled ? "disabled" : "",
				this.cssClassName,
				this.cssClass?.root
			].filter(Boolean).join(" ");
		}
		get _hasTitleContent() {
			return Boolean(this.title) || this._hasTitleSlotState;
		}
		get _hasSubtitleContent() {
			return Boolean(this.subtitle) || this._hasSubtitleSlotState;
		}
		get _hasIconContent() {
			return this._hasIconSlotState || Boolean(this.icon);
		}
		/**
		* The `icon` prop: an iconify class becomes an empty masked span, anything
		* else is text. The shadow build overrides this with inline SVG (a page
		* utility class cannot reach inside a shadow root).
		*/
		_renderIconGlyph() {
			if (!this.icon) return nothing;
			if (isIconifyClass(this.icon)) return html`<span class=${`mono-accordion-iconify ${this.icon}`}></span>`;
			return html`${this.icon}`;
		}
		/**
		* The open state changed. `mno-click` is the historical name; the plain
		* event is `toggle`, and the transition also fires `open` / `close`
		* (+ `mno-open` / `mno-close`) — the same trio modal and drawer emit.
		*/
		_emitClick(detail) {
			dispatchMonoEvent(this, "click", detail, { alias: "toggle" });
			dispatchMonoEvent(this, detail.modelValue ? "open" : "close", detail);
		}
		_setOpen(next, sourceEvent) {
			if (this.disabled) return;
			if (this.modelValue === next) return;
			const oldValue = this.modelValue;
			this.modelValue = next;
			this._emitClick({
				modelValue: next,
				currentValue: next,
				oldValue,
				value: next,
				sourceEvent
			});
		}
		_handleClick(event) {
			if (this.disabled) return;
			this._setOpen(!this.modelValue, event);
		}
		toggle() {
			this._setOpen(!this.modelValue);
		}
		expand() {
			this._setOpen(true);
		}
		collapse() {
			this._setOpen(false);
		}
		focus() {
			this._headEl?.focus();
		}
		blur() {
			this._headEl?.blur();
		}
	}
	__decorate([property({ type: String })], MonoAccordionCoreClass.prototype, "size", void 0);
	__decorate([property({ type: String })], MonoAccordionCoreClass.prototype, "color", void 0);
	__decorate([property({ type: String })], MonoAccordionCoreClass.prototype, "title", void 0);
	__decorate([property({ type: String })], MonoAccordionCoreClass.prototype, "subtitle", void 0);
	__decorate([property({ type: String })], MonoAccordionCoreClass.prototype, "icon", void 0);
	__decorate([property({
		attribute: "model-value",
		reflect: true,
		converter: booleanStringConverter
	})], MonoAccordionCoreClass.prototype, "modelValue", void 0);
	__decorate([property({
		reflect: true,
		converter: booleanStringConverter
	})], MonoAccordionCoreClass.prototype, "disabled", void 0);
	__decorate([property({ attribute: false })], MonoAccordionCoreClass.prototype, "cssClass", void 0);
	__decorate([property({ attribute: false })], MonoAccordionCoreClass.prototype, "cssClassName", void 0);
	__decorate([state()], MonoAccordionCoreClass.prototype, "_hasTitleSlotState", void 0);
	__decorate([state()], MonoAccordionCoreClass.prototype, "_hasSubtitleSlotState", void 0);
	__decorate([state()], MonoAccordionCoreClass.prototype, "_hasHeaderSlotState", void 0);
	__decorate([state()], MonoAccordionCoreClass.prototype, "_hasIconSlotState", void 0);
	__decorate([state()], MonoAccordionCoreClass.prototype, "_hasActionsSlotState", void 0);
	__decorate([state()], MonoAccordionCoreClass.prototype, "_hasBodySlotState", void 0);
	__decorate([query(".mono-accordion-head")], MonoAccordionCoreClass.prototype, "_headEl", void 0);
	return MonoAccordionCoreClass;
};

//#endregion
export { MonoAccordionCore as t };