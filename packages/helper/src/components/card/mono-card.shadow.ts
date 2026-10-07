// @unocss-include

import { isServer, LitElement, html, nothing, unsafeCSS, type TemplateResult } from 'lit'
import { customElement } from '../../composables/mono-element'
import { ifDefined } from 'lit/directives/if-defined.js'
import { styleMap } from 'lit/directives/style-map.js'

import { MonoCardCore, type CardSlotName } from './card-core.js'
import { toShadowCss, withShadowUtilityStyles } from '../../composables/shadow-css'

import cardCss from './card.css?raw'
import { flushSsrHydration } from '../../composables/hydration-flush'

// Shadow-only: hide a DECORATIVE region whose slot has no assigned content (and
// no prop fallback). Presence is detected after hydration (see firstUpdated);
// default-hidden so the server and the initial client render match. The body /
// default region is deliberately NOT hidden — its main content (projected by
// DSD at parse time) must show server-side without a flash.
// card.css hides [mono-empty] regions itself (the light build never renders
// them), so the shadow build needs no extra rules.
const SHADOW_EXTRA_CSS = ''

/**
 * Shadow-DOM card (the opt-in SSR build, `@mono-lit/helper/ui/shadow/card`).
 *
 * Registered as `<mono-shadow-card>` — a DISTINCT tag from the light build's
 * `<mono-card>` — so the two can be loaded side by side (e.g. the VitePress docs
 * render both live). Like every shadow component, it registers a `mono-shadow-*`
 * tag; consumers of `@mono-lit/helper/ui/shadow/card` write `<mono-shadow-card>`.
 *
 * Real shadow root + `static styles`, so `@lit-labs/ssr` serializes it to
 * Declarative Shadow DOM and styles are scoped (`mono-card`→`:host`). Slotting
 * uses native `<slot>`. During SSR the element has no light children, so every
 * `_has…` defaults `false` (hydration-matching) and the decorative regions render
 * `mono-empty` (hidden by card.css itself); real presence is corrected in
 * `firstUpdated()` (DSD assigns slotted content at parse time → `slotchange`
 * doesn't fire after upgrade → scan `assignedNodes()`; `slotchange` is kept for
 * later dynamic changes). `<slot name="title">${title}</slot>` carries the prop
 * text as native fallback so it shows with no JS. The body/default region is
 * always visible so main content never flashes. Shares all logic with the light
 * build via `MonoCardCore`.
 */
@customElement('mono-shadow-card')
export class MonoCardShadow extends withShadowUtilityStyles(MonoCardCore(LitElement)) {
  static {
    // Slot presence can only be measured after the first render creates the
    // <slot> elements, and hydration requires correcting the default-hidden
    // regions in a follow-up update — the legitimate exception this warning
    // describes. Dev-only suppression (no-op in production Lit).
    ;(this as typeof LitElement).disableWarning?.('change-in-update')
  }

  static override styles = [
    unsafeCSS(toShadowCss(cardCss, { host: 'mono-card', append: SHADOW_EXTRA_CSS })),
  ]

  override firstUpdated(changed: Map<string, unknown>): void {
    super.firstUpdated(changed)
    for (const name of [
      'media',
      'icon',
      'title',
      'subtitle',
      'header',
      'actions',
      'footer',
      'default',
    ] as CardSlotName[]) {
      this._setSlotState(name, this._slotHasContent(this._slotFor(name)))
    }
  }

  private _slotFor(name: CardSlotName): HTMLSlotElement | null {
    const selector = name === 'default' ? 'slot:not([name])' : `slot[name="${name}"]`
    return this.renderRoot.querySelector(selector) as HTMLSlotElement | null
  }

  /**
   * Whether something is ASSIGNED to this slot. Not `flatten: true`: for an
   * empty slot that returns the FALLBACK content, and `<slot name="header">`'s
   * fallback is the title/subtitle markup — every card would look like it had a
   * header slot and hide its icon.
   */
  private _slotHasContent(slot: HTMLSlotElement | null): boolean {
    return (
      !!slot &&
      slot
        .assignedNodes()
        .some((n) => n.nodeType === Node.ELEMENT_NODE || !!(n.textContent ?? '').trim())
    )
  }

  private _setSlotState(name: CardSlotName, has: boolean): void {
    if (name === 'media') this._hasMedia = has
    else if (name === 'icon') this._hasIcon = has
    else if (name === 'title') this._hasTitle = has
    else if (name === 'subtitle') this._hasSubtitle = has
    else if (name === 'header') this._hasHeaderSlot = has
    else if (name === 'actions') this._hasActions = has
    else if (name === 'footer') this._hasFooter = has
    else if (name === 'default') this._hasDefault = has
  }

  private _onSlotChange(name: CardSlotName, event: Event): void {
    this._setSlotState(name, this._slotHasContent(event.target as HTMLSlotElement))
  }

  private _slot(name: CardSlotName): TemplateResult {
    return html`<slot
      name=${name}
      @slotchange=${(e: Event) => this._onSlotChange(name, e)}
    ></slot>`
  }

  private _renderMedia(): TemplateResult {
    return html`
      <div class=${this._cls('mono-card-media', 'media')} mono-media ?mono-empty=${!this._hasMedia}>
        ${this._slot('media')}
      </div>
    `
  }

  private _renderHeader(): TemplateResult {
    return html`
      <div class=${this._cls('mono-card-header', 'header')} mono-header ?mono-empty=${!this._hasHeader}>
        <!-- slot="header" replaces the icon as well as the title/subtitle -->
        <div
          class=${this._cls('card-icon', 'icon')} mono-icon
          ?mono-empty=${!this._hasIcon || this._hasHeaderSlot}
        >
          ${this._slot('icon')}
        </div>

        <div class=${this._cls('mono-card-header-content', 'headerContent')} mono-header-content>
          <!-- slot="header" wins: its fallback is the whole title/subtitle block -->
          <slot name="header" @slotchange=${(e: Event) => this._onSlotChange('header', e)}>
            <div
              class=${this._cls('card-title', 'title')} mono-title
              ?mono-empty=${!this._hasTitle && !this.title}
            >
              <slot name="title" @slotchange=${(e: Event) => this._onSlotChange('title', e)}
                >${this.title || nothing}</slot
              >
            </div>

            <div
              class=${this._cls('card-subtitle', 'subtitle')} mono-subtitle
              ?mono-empty=${!this._hasSubtitle && !this.subtitle}
            >
              <slot name="subtitle" @slotchange=${(e: Event) => this._onSlotChange('subtitle', e)}
                >${this.subtitle || nothing}</slot
              >
            </div>
          </slot>
        </div>
      </div>
    `
  }

  private _renderBody(): TemplateResult {
    // An empty body must collapse, or a card with a header and a footer but no
    // body keeps a zero-height region between them and pays the card's `gap`
    // twice — 24px taller than the light build at md.
    //
    // SERVER-SIDE it always stays visible: the default slot carries the card's
    // main content, which DSD projects at parse time, and `_hasDefault` is only
    // true after `firstUpdated()` has scanned the slots. Hiding it there would
    // blank the content until hydration. On the client that scan runs before
    // paint, so the collapse is never seen.
    return html`
      <div
        class=${this._cls('mono-card-body', 'body')}
        mono-body
        ?mono-empty=${!isServer && !this._hasDefault}
      >
        <slot @slotchange=${(e: Event) => this._onSlotChange('default', e)}></slot>
      </div>
    `
  }

  private _renderActions(): TemplateResult {
    return html`
      <div class=${this._cls('mono-card-actions', 'actions')} mono-actions ?mono-empty=${!this._hasActions}>
        ${this._slot('actions')}
      </div>
    `
  }

  private _renderFooter(): TemplateResult {
    return html`
      <div class=${this._cls('mono-card-footer', 'footer')} mono-footer ?mono-empty=${!this._hasFooter}>
        ${this._slot('footer')}
      </div>
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
    if (isServer) return
    // Under nuxt-ssr-lit the SSR'd element can stay `hasUpdated:false` with
    // updates disabled after the wrapper removes `defer-hydration` — its
    // handlers never bind and follow-up passes (slot scans, controller wiring)
    // never run. Flush the first client update; a no-op once already hydrated.
    flushSsrHydration(this)
  }
}

// The shadow build registers its OWN tag (`mono-shadow-card`), distinct from the
// light build's `mono-card` — so it owns this augmentation outright (no TS2717
// conflict with mono-card.ts, which maps the separate `mono-card` key).
declare global {
  interface HTMLElementTagNameMap {
    'mono-shadow-card': MonoCardShadow
  }
}
