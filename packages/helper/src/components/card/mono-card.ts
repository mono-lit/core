// @unocss-include

import { LitElement, html, nothing, unsafeCSS, type TemplateResult } from 'lit'
import { customElement } from '../../composables/mono-element'
import { ifDefined } from 'lit/directives/if-defined.js'
import { styleMap } from 'lit/directives/style-map.js'

import { MonoCardCore } from './card-core.js'
import {
  bucketHasContent,
  captureLightSlots,
  parkDetachedNodes,
  placeLightSlots,
  type LightSlotBuckets,
} from '../../composables/light-slots'

import cardCss from './card.css?raw'

/** Named regions the card lays out. The unnamed body is the fallback bucket. */
const CARD_NAMED_SLOTS = [
  'media',
  'icon',
  'title',
  'subtitle',
  'header',
  'actions',
  'footer',
] as const

/**
 * Light-DOM `mono-card` (default build, `@mono-lit/helper/ui/card`).
 *
 * Renders into the host (`createRenderRoot`→`this`, styled by the global
 * `dist/ui/index.css`) with the light-DOM slot strategy: `slot="media|icon|…"`
 * children are captured in `connectedCallback`, the template renders empty
 * `[data-mono-slot]` regions, and the captured nodes are re-appended in
 * `updated()`. Capture/placement lives in `composables/light-slots`, which is
 * careful to carry the consumer framework's positional anchors (Vue's
 * `<!--v-if-->` comments and zero-length Fragment text nodes) into the region
 * alongside their siblings — deleting them used to detach Vue's vnode anchors and
 * crash its next patch with `Cannot read properties of null`. The first render is
 * forced **synchronously** from `connectedCallback` (see there) so the detach and
 * re-attach happen in one uninterrupted step, which is what lets cards nest freely.
 *
 * All render-mode-agnostic logic lives in `MonoCardCore`. The shadow build
 * (`@mono-lit/helper/ui/shadow/card`) shares the mixin but uses native `<slot>` and
 * registers a distinct `<mono-shadow-card>` tag, so both builds can load in the
 * same document.
 */
@customElement('mono-card')
export class MonoCard extends MonoCardCore(LitElement) {
  static override styles = [unsafeCSS(cardCss)]

  protected override createRenderRoot(): HTMLElement {
    return this
  }

  private _slotsCaptured = false
  private _buckets: LightSlotBuckets = new Map()

  private _renderMedia(): TemplateResult | typeof nothing {
    if (!this._hasMedia) return nothing

    return html`
      <div class=${this._cls('mono-card-media', 'media')} mono-media data-mono-slot="media"></div>
    `
  }

  private _renderHeader(): TemplateResult | typeof nothing {
    if (!this._hasHeader) return nothing

    return html`
      <div class=${this._cls('mono-card-header', 'header')} mono-header>
        ${this._hasIcon && !this._hasHeaderSlot
          ? // slot="header" replaces the icon too — the whole left side of the header
            html`
              <div class=${this._cls('card-icon', 'icon')} mono-icon data-mono-slot="icon"></div>
            `
          : nothing}

        ${this._hasHeaderSlot
          ? // slot="header" wins over the title/subtitle slots AND props
            html`
              <div
                class=${this._cls('mono-card-header-content', 'headerContent')}
                mono-header-content
                data-mono-slot="header"
              ></div>
            `
          : html`
              <div class=${this._cls('mono-card-header-content', 'headerContent')} mono-header-content>
                ${this._hasTitle
                  ? html`
                      <div class=${this._cls('card-title', 'title')} mono-title data-mono-slot="title"></div>
                    `
                  : this.title
                    ? html`
                        <div class=${this._cls('card-title', 'title')} mono-title>
                          ${this.title}
                        </div>
                      `
                    : nothing}

                ${this._hasSubtitle
                  ? html`
                      <div class=${this._cls('card-subtitle', 'subtitle')} mono-subtitle data-mono-slot="subtitle"></div>
                    `
                  : this.subtitle
                    ? html`
                        <div class=${this._cls('card-subtitle', 'subtitle')} mono-subtitle>
                          ${this.subtitle}
                        </div>
                      `
                    : nothing}
              </div>
            `}
      </div>
    `
  }

  /**
   * The body is the only region rendered unconditionally.
   *
   * It's the home for the fallback bucket, which holds the consumer framework's
   * positional anchors. Those need a live parent even when the card starts with
   * no visible body content — that's what lets a `v-if` flipping on later insert
   * *inside* the card instead of beside it, and it stops Lit from ever destroying
   * a container that holds the consumer's nodes. `.mono-card-body:empty` collapses
   * it while it holds nothing but anchors.
   */
  private _renderBody(): TemplateResult {
    return html`
      <div class=${this._cls('mono-card-body', 'body')} mono-body data-mono-slot="default"></div>
    `
  }

  private _renderActions(): TemplateResult | typeof nothing {
    if (!this._hasActions) return nothing

    return html`
      <div class=${this._cls('mono-card-actions', 'actions')} mono-actions data-mono-slot="actions"></div>
    `
  }

  private _renderFooter(): TemplateResult | typeof nothing {
    if (!this._hasFooter) return nothing

    return html`
      <div class=${this._cls('mono-card-footer', 'footer')} mono-footer data-mono-slot="footer"></div>
    `
  }

  private _renderLoading(): TemplateResult | typeof nothing {
    if (!this.loading) return nothing

    return html`
      <div class=${this._cls('mono-card-loading', 'loading')} mono-loading>
        <span class="mono-card-spinner" mono-spinner></span>
      </div>
    `
  }

  private _renderContent(): TemplateResult {
    const mediaTop = this.mediaPosition === 'top'
    const mediaBottom = this.mediaPosition === 'bottom'

    return html`
      ${mediaTop ? this._renderMedia() : nothing}
      ${this._renderHeader()}
      ${this._renderBody()}
      ${this._renderActions()}
      ${this._renderFooter()}
      ${mediaBottom ? this._renderMedia() : nothing}
      ${this._renderLoading()}
    `
  }

  protected override render(): TemplateResult {
    const role = this._isInteractive ? 'button' : 'article'
    const tabIndex = this._isInteractive && !this._isDisabled ? '0' : undefined

    if (this.href) {
      return html`
        <a
          class=${this._cardClasses}
          mono-card
          mono-size=${this.size === 'md' ? nothing : this.size}
          mono-variant=${this.variant === 'elevated' ? nothing : this.variant}
          mono-color=${this.color === 'neutral' ? nothing : this.color}
          mono-rounded=${this.rounded ? this.rounded : nothing}
          ?mono-bordered=${this.bordered}
          ?mono-hoverable=${this.hoverable}
          ?mono-clickable=${this.clickable || !!this.href}
          ?mono-selected=${this.selected}
          ?mono-disabled=${this._isDisabled}
          ?mono-loading=${this.loading}
          ?mono-no-header-divider=${!this.headerDivider}
          ?mono-no-footer-divider=${!this.footerDivider}
          style=${styleMap(this._sizeStyle())}
          href=${this._isDisabled ? undefined : ifDefined(this.href)}
          target=${ifDefined(this.target)}
          role=${role}
          tabindex=${ifDefined(tabIndex)}
          aria-label=${ifDefined(this.ariaLabelText)}
          aria-disabled=${this._isDisabled ? 'true' : 'false'}
          aria-busy=${this.loading ? 'true' : 'false'}
          title=""
          @click=${this._handleClick}
          @keydown=${this._handleKeyDown}
        >
          ${this._renderContent()}
        </a>
      `
    }

    return html`
      <div
        class=${this._cardClasses}
        mono-card
        mono-size=${this.size === 'md' ? nothing : this.size}
        mono-variant=${this.variant === 'elevated' ? nothing : this.variant}
        mono-color=${this.color === 'neutral' ? nothing : this.color}
        mono-rounded=${this.rounded ? this.rounded : nothing}
        ?mono-bordered=${this.bordered}
        ?mono-hoverable=${this.hoverable}
        ?mono-clickable=${this.clickable || !!this.href}
        ?mono-selected=${this.selected}
        ?mono-disabled=${this._isDisabled}
        ?mono-loading=${this.loading}
        ?mono-no-header-divider=${!this.headerDivider}
        ?mono-no-footer-divider=${!this.footerDivider}
        style=${styleMap(this._sizeStyle())}
        role=${role}
        tabindex=${ifDefined(tabIndex)}
        aria-label=${ifDefined(this.ariaLabelText)}
        aria-disabled=${this._isDisabled ? 'true' : 'false'}
        aria-busy=${this.loading ? 'true' : 'false'}
          title=""
        @click=${this._handleClick}
        @keydown=${this._handleKeyDown}
      >
        ${this._renderContent()}
      </div>
    `
  }

  override connectedCallback(): void {
    super.connectedCallback()
    this._captureSlots()

    // Capture detaches the consumer's children — and any framework positional
    // anchors among them — from the host; `placeLightSlots` (in `updated()`)
    // re-attaches them. Lit renders on a microtask by default, so those anchors
    // sit orphaned (`parentNode === null`) until then. If the consumer patches in
    // that window — a child's `mounted()` flipping a `v-if`, a synchronous store
    // update, a nested card's own connect — Vue walks a null anchor and dies with
    // `Cannot read properties of null (reading 'insertBefore' / 'nextSibling')`.
    // Forcing the first render synchronously makes capture→placement one
    // uninterrupted step inside the consumer's insert, so no anchor is ever
    // observably detached (this is what lets cards nest freely). Later updates
    // still run async and re-place idempotently.
    if (this.isConnected) this.performUpdate()
  }

  private _captureSlots(): void {
    if (this._slotsCaptured) return
    this._slotsCaptured = true

    this._buckets = captureLightSlots(this, { names: CARD_NAMED_SLOTS })

    // `bucketHasContent` rather than a length check: a bucket may hold nothing
    // but framework anchors, which must not force an empty region to render.
    this._hasMedia = bucketHasContent(this._buckets.get('media'))
    this._hasIcon = bucketHasContent(this._buckets.get('icon'))
    this._hasTitle = bucketHasContent(this._buckets.get('title'))
    this._hasSubtitle = bucketHasContent(this._buckets.get('subtitle'))
    this._hasHeaderSlot = bucketHasContent(this._buckets.get('header'))
    this._hasActions = bucketHasContent(this._buckets.get('actions'))
    this._hasFooter = bucketHasContent(this._buckets.get('footer'))
    this._hasDefault = bucketHasContent(this._buckets.get('default'))
  }

  protected override updated(changed: Map<string, unknown>): void {
    super.updated(changed)
    placeLightSlots(this, this._buckets)
    // A `slot="header"` suppresses the title/subtitle regions, so their captured
    // nodes have no target. Keep them parented (a detached node crashes the
    // consumer framework's next patch) and invisible.
    for (const nodes of this._buckets.values()) {
      this._parked = parkDetachedNodes(this._parked, nodes)
    }
  }

  private _parked?: HTMLElement
}

declare global {
  interface HTMLElementTagNameMap {
    'mono-card': MonoCard
  }
}
