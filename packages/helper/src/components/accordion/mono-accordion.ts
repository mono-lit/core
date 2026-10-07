// @unocss-include

import { LitElement, html, isServer, nothing, unsafeCSS, type TemplateResult } from 'lit'
import { customElement } from '../../composables/mono-element'
import { ref } from 'lit/directives/ref.js'

import { MonoAccordionCore } from './accordion-core.js'
import {
  guardHostTextContent,
  parkDetachedNodes,
  placeSlotNode,
} from '../../composables/light-slots'

import accordionCss from './accordion.css?raw'
import { monoHostChildNodes } from '../../composables/mono-skeleton'

/**
 * Light-DOM `mono-accordion` (default build, `@mono-lit/helper/ui/accordion`).
 *
 * Renders into the host (`createRenderRoot`→`this`, styled by the global
 * `dist/ui/index.css`) with the light-DOM slot strategy: `slot="…"` children are
 * captured in `connectedCallback`, the template renders empty `[data-mono-slot]`
 * targets, and the captured nodes are re-appended in `updated()`. All
 * render-mode-agnostic logic lives in `MonoAccordionCore`. The shadow build
 * (`@mono-lit/helper/ui/shadow/accordion`) shares the mixin but uses native `<slot>`.
 * Both register `mono-accordion`, so a document loads only one.
 */
@customElement('mono-accordion')
export class MonoAccordion extends MonoAccordionCore(LitElement) {
  static override styles = [unsafeCSS(accordionCss)]

  protected override createRenderRoot(): HTMLElement {
    return this
  }

  private _slotObserver?: MutationObserver

  // `title` / `subtitle` are canonical; `label` / `description` are their old
  // names, captured separately so the canonical one can win when both are given.
  private _slotTitle: Node[] = []
  private _slotLabel: Node[] = []
  private _slotSubtitle: Node[] = []
  private _slotDescription: Node[] = []
  private _slotHeader: Node[] = []
  private _slotIcon: Node[] = []
  private _slotActions: Node[] = []
  private _slotBody: Node[] = []

  /** Hidden detached holder for captured nodes that have no rendered target. */
  private _parked?: HTMLElement

  /** The title nodes that render: `slot="title"` beats its alias `slot="label"`. */
  private get _titleNodes(): Node[] {
    return this._slotTitle.length ? this._slotTitle : this._slotLabel
  }

  /** The subtitle nodes that render: `slot="subtitle"` beats `slot="description"`. */
  private get _subtitleNodes(): Node[] {
    return this._slotSubtitle.length ? this._slotSubtitle : this._slotDescription
  }

  override connectedCallback(): void {
    super.connectedCallback()
    // Vue (e.g. under `<ClientOnly>`) often appends the slotted children AFTER
    // connectedCallback, so a one-shot capture misses them and the body text /
    // `slot="icon"` stay stranded outside the accordion. Watch for late children
    // and re-capture (mirrors mono-input).
    if (!isServer && !this._slotObserver && typeof MutationObserver !== 'undefined') {
      this._slotObserver = new MutationObserver(() => this._captureSlots())
    }
    this._captureSlots()

    // Render synchronously so the captured body/named content — and the consumer's
    // Vue anchors that travel with it — is re-placed within this insert rather than
    // a microtask later; otherwise a patch in that window (e.g. a child's
    // `mounted()` flipping a v-if) hits a detached node and crashes Vue. The
    // MutationObserver above still handles genuinely-late children asynchronously.
    if (this.isConnected) this.performUpdate()
  }

  override disconnectedCallback(): void {
    this._slotObserver?.disconnect()
    super.disconnectedCallback()
  }

  protected override updated(changed: Map<string, unknown>): void {
    super.updated(changed)

    if (this._hasHeaderSlotState) {
      this._placeSlot('header', this._slotHeader)
    } else {
      this._placeSlot('title', this._titleNodes)
      this._placeSlot('subtitle', this._subtitleNodes)
      this._placeSlot('icon', this._slotIcon)
    }
    this._placeSlot('actions', this._slotActions)
    this._placeSlot('body', this._slotBody)

    // Captured nodes that lost (an alias beaten by its canonical name, or
    // icon/title/subtitle suppressed by `slot="header"`) have no target. Keep
    // them parented — a detached node crashes the consumer framework's next
    // patch — and invisible.
    for (const nodes of [
      this._slotTitle,
      this._slotLabel,
      this._slotSubtitle,
      this._slotDescription,
      this._slotHeader,
      this._slotIcon,
    ]) {
      this._parked = parkDetachedNodes(this._parked, nodes)
    }
  }

  private _renderIcon(): TemplateResult | typeof nothing {
    // slot="header" replaces the icon too — the whole left side of the toggle
    if (!this._hasIconContent || this._hasHeaderSlotState) return nothing

    // The icon goes in an inner `[data-mono-slot="icon"]` placeholder (NOT on the
    // `.mono-accordion-icon` box itself — that would make the box match chip.css's
    // global `[data-mono-slot='icon']` rules and lose its own sizing). The
    // placeholder is sized by accordion CSS; the svg fills it (chip's global
    // `[data-mono-slot='icon'] > svg { width: 100% }`).
    return html`
      <span class=${this._cls('mono-accordion-icon', 'icon')} mono-glyph aria-hidden="true">
        <span data-mono-slot="icon"></span>
      </span>
    `
  }

  private _renderText(): TemplateResult | typeof nothing {
    // slot="header" wins over the icon and the title/subtitle slots AND props;
    // actions and the chevron stay, and the head is still the toggle.
    if (this._hasHeaderSlotState) {
      return html`<span class="mono-accordion-text" mono-heading data-mono-slot="header"></span>`
    }

    if (!this._hasTitleContent && !this._hasSubtitleContent) return nothing

    return html`
      <span class="mono-accordion-text" mono-heading>
        ${this._hasTitleContent
        ? html`
              <span class=${this._cls('mono-accordion-title', 'title')} mono-title>
                ${this._hasTitleSlotState
            ? html`<span data-mono-slot="title"></span>`
            : this.title}
              </span>
            `
        : nothing}

        ${this._hasSubtitleContent
        ? html`
              <span
                class=${this._cls('mono-accordion-description', 'description')}
                mono-subtitle
                mono-description
              >
                ${this._hasSubtitleSlotState
            ? html`<span data-mono-slot="subtitle"></span>`
            : this.subtitle}
              </span>
            `
        : nothing}
      </span>
    `
  }

  private _renderActions(): TemplateResult | typeof nothing {
    if (!this._hasActionsSlotState) return nothing

    return html`
      <span class=${this._cls('mono-accordion-actions', 'actions')} mono-actions>
        <span data-mono-slot="actions"></span>
      </span>
    `
  }

  private _renderBody(): TemplateResult {
    return html`
      <div class=${this._cls('mono-accordion-body', 'body')} mono-body role="region">
        ${this._hasBodySlotState
        ? html`<span data-mono-slot="body"></span>`
        : html`<slot></slot>`}
      </div>
    `
  }

  protected override render(): TemplateResult {
    return html`
      <div class=${this._wrapperClasses} mono-accordion title="" ${ref(this.bindRoot)}>
        <button
          type="button"
          class=${this._cls('mono-accordion-head', 'head')}
          mono-head
          aria-expanded=${this.modelValue ? 'true' : 'false'}
          ?disabled=${this.disabled}
          @click=${this._handleClick}
        >
          ${this._renderIcon()}
          ${this._renderText()}
          ${this._renderActions()}
          <span class=${this._cls('mono-accordion-arrow', 'arrow')} mono-arrow aria-hidden="true">
            <span class="mono-icon i-mdi-chevron-down" aria-hidden="true"></span>
          </span>
        </button>

        ${this._renderBody()}
      </div>
    `
  }

  /**
   * Capture `slot="…"` named children + the unnamed/default body content into the
   * per-region arrays. Safe to run MORE THAN ONCE: captured nodes are detached
   * from the host (and named ones lose their `slot` attribute), so a re-scan never
   * re-captures them — and the Lit-rendered wrapper (`.mono-accordion`) is skipped.
   * Re-running lets the MutationObserver pick up children Vue appends after connect.
   */
  private _captureSlots(): void {
    // Pause our own observer so the removeChild() calls below don't re-enter.
    this._slotObserver?.disconnect()

    const captured = monoHostChildNodes(this)
    const capturedNodes = new Set<Node>()

    for (const node of captured) {
      if (node instanceof Element) {
        // Never re-capture our own rendered output.
        if (node.classList.contains('mono-accordion')) continue

        const slotName = node.getAttribute('slot')

        const named =
          slotName === 'title' ? this._slotTitle
          : slotName === 'label' ? this._slotLabel
          : slotName === 'subtitle' ? this._slotSubtitle
          : slotName === 'description' ? this._slotDescription
          : slotName === 'header' ? this._slotHeader
          : null

        if (named) {
          node.removeAttribute('slot')
          named.push(node)
          capturedNodes.add(node)
        } else if (slotName === 'icon') {
          node.removeAttribute('slot')
          this._slotIcon.push(node)
          capturedNodes.add(node)
        } else if (slotName === 'actions') {
          node.removeAttribute('slot')
          this._slotActions.push(node)
          capturedNodes.add(node)
        } else {
          // Unslotted element or explicit slot="body" → the default body region.
          if (slotName === 'body') node.removeAttribute('slot')
          this._slotBody.push(node)
          capturedNodes.add(node)
        }
      } else if (node.nodeType === Node.TEXT_NODE && node.textContent?.trim()) {
        // Plain-text body content, e.g. `<mono-accordion>some text</mono-accordion>`.
        this._slotBody.push(node)
        capturedNodes.add(node)
      }
    }

    if (capturedNodes.size) {
      // Reactive `@state` writes → re-render → the region wrappers appear, and
      // `updated()` → `_placeSlot()` moves the captured nodes into them.
      this._hasTitleSlotState = this._titleNodes.length > 0
      this._hasSubtitleSlotState = this._subtitleNodes.length > 0
      this._hasHeaderSlotState = this._slotHeader.length > 0
      this._hasIconSlotState = this._slotIcon.length > 0
      this._hasActionsSlotState = this._slotActions.length > 0
      this._hasBodySlotState = this._slotBody.length > 0

      for (const node of capturedNodes) {
        if (node.parentNode === this) this.removeChild(node)
      }
    }

    // Vue patches a lone interpolation with `host.textContent = next`, which in a
    // light build would wipe this element's whole render. Send those writes to the
    // body region instead. Idempotent, so the observer may re-enter here freely.
    guardHostTextContent(
      this,
      new Map([
        ['title', this._slotTitle],
        ['label', this._slotLabel],
        ['subtitle', this._slotSubtitle],
        ['description', this._slotDescription],
        ['header', this._slotHeader],
        ['icon', this._slotIcon],
        ['actions', this._slotActions],
        ['body', this._slotBody],
      ]),
      {
        fallback: 'body',
        onWrite: () => {
          this._hasBodySlotState = this._slotBody.length > 0
          this.requestUpdate()
        },
      },
    )

    // Resume watching for any further late/dynamic slot children.
    if (this._slotObserver && this.isConnected) {
      this._slotObserver.observe(this, { childList: true })
    }
  }

  private _placeSlot(name: string, nodes: Node[]): void {
    if (!nodes.length) return

    const target = this.querySelector(`[data-mono-slot="${name}"]`)
    if (!target) return

    for (const node of nodes) {
      placeSlotNode(target, node)
    }
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'mono-accordion': MonoAccordion
  }
}
