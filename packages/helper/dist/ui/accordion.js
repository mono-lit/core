import { g as monoHostChildNodes } from "../mono-ui-kvLVIf1V.js";
import { t as customElement } from "../mono-element-CKcT0rwv.js";
import { t as __decorate } from "../decorate-DbYFpi8R.js";
import { t as MonoAccordionCore } from "../accordion-core-DaNyPWRr.js";
import { a as parkDetachedNodes, i as guardHostTextContent, s as placeSlotNode } from "../light-slots-B5Ck0t_E.js";
import { LitElement, html, isServer, nothing } from "lit";
import { ref } from "lit/directives/ref.js";

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