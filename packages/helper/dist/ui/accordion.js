import { g as monoHostChildNodes } from "../mono-ui-jtBvJ9d5.js";
import { t as customElement } from "../mono-element-9uQRbp5X.js";
import { a as defineHybridPropAliases, i as defineHybridPropAlias, r as booleanStringConverter, t as __decorate } from "../decorate-DbYFpi8R.js";
import { t as dispatchMonoEvent } from "../mono-event-BPku9HpS.js";
import { t as isIconifyClass } from "../icon-ClxnYhBG.js";
import { a as parkDetachedNodes, i as guardHostTextContent, s as placeSlotNode } from "../light-slots-B980aknU.js";
import { LitElement, html, isServer, nothing } from "lit";
import { ref } from "lit/directives/ref.js";
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
//#region src/components/accordion/mono-accordion.ts
let MonoAccordion = class MonoAccordion extends MonoAccordionCore(LitElement) {
	constructor(..._args) {
		super(..._args);
		this._slotTitle = [];
		this._slotLabel = [];
		this._slotSubtitle = [];
		this._slotDescription = [];
		this._slotHeader = [];
		this._slotIcon = [];
		this._slotActions = [];
		this._slotBody = [];
	}
	createRenderRoot() {
		return this;
	}
	/** The title nodes that render: `slot="title"` beats its alias `slot="label"`. */
	get _titleNodes() {
		return this._slotTitle.length ? this._slotTitle : this._slotLabel;
	}
	/** The subtitle nodes that render: `slot="subtitle"` beats `slot="description"`. */
	get _subtitleNodes() {
		return this._slotSubtitle.length ? this._slotSubtitle : this._slotDescription;
	}
	connectedCallback() {
		super.connectedCallback();
		if (!isServer && !this._slotObserver && typeof MutationObserver !== "undefined") this._slotObserver = new MutationObserver(() => this._captureSlots());
		this._captureSlots();
		if (this.isConnected) this.performUpdate();
	}
	disconnectedCallback() {
		this._slotObserver?.disconnect();
		super.disconnectedCallback();
	}
	updated(changed) {
		super.updated(changed);
		if (this._hasHeaderSlotState) this._placeSlot("header", this._slotHeader);
		else {
			this._placeSlot("title", this._titleNodes);
			this._placeSlot("subtitle", this._subtitleNodes);
			this._placeSlot("icon", this._slotIcon);
		}
		this._placeSlot("actions", this._slotActions);
		this._placeSlot("body", this._slotBody);
		for (const nodes of [
			this._slotTitle,
			this._slotLabel,
			this._slotSubtitle,
			this._slotDescription,
			this._slotHeader,
			this._slotIcon
		]) this._parked = parkDetachedNodes(this._parked, nodes);
	}
	_renderIcon() {
		if (!this._hasIconContent || this._hasHeaderSlotState) return nothing;
		return html`
      <span class=${this._cls("mono-accordion-icon", "icon")} mono-glyph aria-hidden="true">
        ${this._hasIconSlotState ? html`<span data-mono-slot="icon"></span>` : this._renderIconGlyph()}
      </span>
    `;
	}
	_renderText() {
		if (this._hasHeaderSlotState) return html`<span class="mono-accordion-text" mono-heading data-mono-slot="header"></span>`;
		if (!this._hasTitleContent && !this._hasSubtitleContent) return nothing;
		return html`
      <span class="mono-accordion-text" mono-heading>
        ${this._hasTitleContent ? html`
              <span class=${this._cls("mono-accordion-title", "title")} mono-title>
                ${this._hasTitleSlotState ? html`<span data-mono-slot="title"></span>` : this.title}
              </span>
            ` : nothing}

        ${this._hasSubtitleContent ? html`
              <span
                class=${this._cls("mono-accordion-description", "description")}
                mono-subtitle
                mono-description
              >
                ${this._hasSubtitleSlotState ? html`<span data-mono-slot="subtitle"></span>` : this.subtitle}
              </span>
            ` : nothing}
      </span>
    `;
	}
	_renderActions() {
		if (!this._hasActionsSlotState) return nothing;
		return html`
      <span class=${this._cls("mono-accordion-actions", "actions")} mono-actions>
        <span data-mono-slot="actions"></span>
      </span>
    `;
	}
	_renderBody() {
		return html`
      <div class=${this._cls("mono-accordion-body", "body")} mono-body role="region">
        ${this._hasBodySlotState ? html`<span data-mono-slot="body"></span>` : html`<slot></slot>`}
      </div>
    `;
	}
	render() {
		return html`
      <div class=${this._wrapperClasses} mono-accordion title="" ${ref(this.bindRoot)}>
        <button
          type="button"
          class=${this._cls("mono-accordion-head", "head")}
          mono-head
          aria-expanded=${this.modelValue ? "true" : "false"}
          ?disabled=${this.disabled}
          @click=${this._handleClick}
        >
          ${this._renderIcon()}
          ${this._renderText()}
          ${this._renderActions()}
          <span class=${this._cls("mono-accordion-arrow", "arrow")} mono-arrow aria-hidden="true">
            <span class="mono-icon i-mdi-chevron-down" aria-hidden="true"></span>
          </span>
        </button>

        ${this._renderBody()}
      </div>
    `;
	}
	/**
	* Capture `slot="…"` named children + the unnamed/default body content into the
	* per-region arrays. Safe to run MORE THAN ONCE: captured nodes are detached
	* from the host (and named ones lose their `slot` attribute), so a re-scan never
	* re-captures them — and the Lit-rendered wrapper (`.mono-accordion`) is skipped.
	* Re-running lets the MutationObserver pick up children Vue appends after connect.
	*/
	_captureSlots() {
		this._slotObserver?.disconnect();
		const captured = monoHostChildNodes(this);
		const capturedNodes = /* @__PURE__ */ new Set();
		for (const node of captured) if (node instanceof Element) {
			if (node.classList.contains("mono-accordion")) continue;
			const slotName = node.getAttribute("slot");
			const named = slotName === "title" ? this._slotTitle : slotName === "label" ? this._slotLabel : slotName === "subtitle" ? this._slotSubtitle : slotName === "description" ? this._slotDescription : slotName === "header" ? this._slotHeader : null;
			if (named) {
				node.removeAttribute("slot");
				named.push(node);
				capturedNodes.add(node);
			} else if (slotName === "icon") {
				node.removeAttribute("slot");
				this._slotIcon.push(node);
				capturedNodes.add(node);
			} else if (slotName === "actions") {
				node.removeAttribute("slot");
				this._slotActions.push(node);
				capturedNodes.add(node);
			} else {
				if (slotName === "body") node.removeAttribute("slot");
				this._slotBody.push(node);
				capturedNodes.add(node);
			}
		} else if (node.nodeType === Node.TEXT_NODE && node.textContent?.trim()) {
			this._slotBody.push(node);
			capturedNodes.add(node);
		}
		if (capturedNodes.size) {
			this._hasTitleSlotState = this._titleNodes.length > 0;
			this._hasSubtitleSlotState = this._subtitleNodes.length > 0;
			this._hasHeaderSlotState = this._slotHeader.length > 0;
			this._hasIconSlotState = this._slotIcon.length > 0;
			this._hasActionsSlotState = this._slotActions.length > 0;
			this._hasBodySlotState = this._slotBody.length > 0;
			for (const node of capturedNodes) if (node.parentNode === this) this.removeChild(node);
		}
		guardHostTextContent(this, /* @__PURE__ */ new Map([
			["title", this._slotTitle],
			["label", this._slotLabel],
			["subtitle", this._slotSubtitle],
			["description", this._slotDescription],
			["header", this._slotHeader],
			["icon", this._slotIcon],
			["actions", this._slotActions],
			["body", this._slotBody]
		]), {
			fallback: "body",
			onWrite: () => {
				this._hasBodySlotState = this._slotBody.length > 0;
				this.requestUpdate();
			}
		});
		if (this._slotObserver && this.isConnected) this._slotObserver.observe(this, { childList: true });
	}
	_placeSlot(name, nodes) {
		if (!nodes.length) return;
		const target = this.querySelector(`[data-mono-slot="${name}"]`);
		if (!target) return;
		for (const node of nodes) placeSlotNode(target, node);
	}
};
MonoAccordion = __decorate([customElement("mono-accordion")], MonoAccordion);

//#endregion
export { MonoAccordion };