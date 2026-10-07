// @unocss-include

import { LitElement, html, isServer, nothing, unsafeCSS, type TemplateResult } from 'lit'
import { customElement } from '../../composables/mono-element'
import { ifDefined } from 'lit/directives/if-defined.js'
import { styleMap } from 'lit/directives/style-map.js'
import { when } from 'lit/directives/when.js'

import { MonoButtonCore } from './button-core.js'
import { toShadowCss, withShadowUtilityStyles } from '../../composables/shadow-css'
import { buildSizeStyle } from '../../composables/css-size'

import buttonCss from './button.css?raw'
import { flushSsrHydration } from '../../composables/hydration-flush'

// Shadow-only: hide the icon region when its slot has no assigned content. The
// icon is the only decorative region; `display:none` also drops its flex gap, so
// text / text+icon buttons have no phantom spacing. Default-hidden so the server
// and the initial client render match; real presence is corrected in
// `firstUpdated()`. The default (text) region is NOT hidden — its content is
// projected by DSD at parse time and must show server-side without a flash.
// (button.css already collapses `[mono-icon][mono-empty]` / `[mono-affix][mono-empty]`.)
const SHADOW_EXTRA_CSS = ''

/**
 * Shadow-DOM `mono-button` (the opt-in SSR build, `@mono-lit/helper/ui/shadow/button`).
 *
 * Real shadow root + `static styles`, so `@lit-labs/ssr` serializes it to
 * Declarative Shadow DOM and styles are scoped (`mono-button`→`:host`). Slotting
 * uses native `<slot>`: the default text slot is always visible (DSD projects the
 * label at parse time), and `<slot name="icon">` defaults `data-empty` (hidden)
 * so the server and the first client render match; real icon presence is detected
 * in `firstUpdated()` via `assignedNodes()` (+ `@slotchange` for later changes).
 * The icon side keys off the `iconPosition` prop (not slot presence) so the DOM
 * structure is hydration-stable. Interactivity needs the first client update to
 * flush (so `@click` binds) — hence the defer-hydration poll. Host sizing is
 * applied client-side in `updated()` (progressive; most buttons set none). Shares
 * all logic with the light build via `MonoButtonCore`; both register
 * `mono-button`, so a document loads only one.
 */
@customElement('mono-shadow-button')
export class MonoButtonShadow extends withShadowUtilityStyles(MonoButtonCore(LitElement)) {
  static {
    // Slot presence can only be measured after the first render creates the
    // <slot> elements, and hydration requires correcting the default-hidden
    // regions in a follow-up update — the legitimate exception this warning
    // describes. Dev-only suppression (no-op in production Lit).
    ;(this as typeof LitElement).disableWarning?.('change-in-update')
  }

  static override styles = [
    unsafeCSS(
      toShadowCss(buttonCss, { host: 'mono-button', append: SHADOW_EXTRA_CSS }),
    ),
  ]

  override connectedCallback(): void {
    super.connectedCallback()
    if (isServer) return
    // Under nuxt-ssr-lit the SSR'd element can stay `hasUpdated:false` with
    // updates disabled after the wrapper removes `defer-hydration` — so its
    // `@click` is never bound. Force the first client update to flush by polling
    // `requestUpdate()` for a few frames; a no-op once already hydrated.
    flushSsrHydration(this)
  }

  override firstUpdated(changed: Map<string, unknown>): void {
    // @ts-ignore — super may not declare firstUpdated through the generic base.
    super.firstUpdated?.(changed)
    if (isServer) return
    this._hasIcon = this._slotHasContent(this._iconSlot())
    this._hasPrepend = this._slotHasContent(this._affixSlot('prepend'))
    this._hasAppend = this._slotHasContent(this._affixSlot('append'))
  }

  protected override updated(changed: Map<string, unknown>): void {
    // @ts-ignore — super may not declare updated through the generic base.
    super.updated?.(changed)
    if (!isServer) this._applyHostSize()
  }

  private _iconSlot(): HTMLSlotElement | null {
    return this.renderRoot.querySelector('slot[name="icon"]') as HTMLSlotElement | null
  }

  private _slotHasContent(slot: HTMLSlotElement | null): boolean {
    return (
      !!slot &&
      slot
        .assignedNodes({ flatten: true })
        .some((n) => n.nodeType === Node.ELEMENT_NODE || !!(n.textContent ?? '').trim())
    )
  }

  /**
   * An affix zone. Unlike the light build's conditional target, the wrapper is
   * ALWAYS rendered here: the native `<slot>` has to exist for DSD to project
   * into it and for the scan to see it, so emptiness is a `?data-empty`
   * attribute the shadow-only CSS hides — the same shape the icon region uses.
   *
   * `stopPropagation` on `click` / `mno-click` keeps a nested control's own
   * click from surfacing as this button's action (a split button's caret must
   * not run the button's `@click`); see the light build's `_guardAffixEvents`.
   */
  private _renderAffix(name: 'prepend' | 'append'): TemplateResult {
    const has = name === 'prepend' ? this._hasPrepend : this._hasAppend
    const cls = [
      `button-${name}`,
      this._affix(name).divider ? 'has-divider' : '',
      this._affixDisabled(name) ? 'disabled' : '',
      this.cssClass?.[name] ?? '',
    ]
      .filter(Boolean)
      .join(' ')

    return html`<span
      class=${cls}
      mono-affix=${name}
      ?mono-divider=${Boolean(this._affix(name).divider)}
      ?mono-disabled=${this._affixDisabled(name)}
      ?mono-empty=${!has}
      @click=${(e: Event) => e.stopPropagation()}
      @mno-click=${(e: Event) => e.stopPropagation()}
      @mnoClick=${(e: Event) => e.stopPropagation()}
    >
      <slot
        name=${name}
        @slotchange=${(e: Event) => this._onAffixSlotChange(name, e)}
      ></slot>
    </span>`
  }

  private _affixSlot(name: 'prepend' | 'append'): HTMLSlotElement | null {
    return this.renderRoot.querySelector(
      'slot[name="' + name + '"]',
    ) as HTMLSlotElement | null
  }

  private _onAffixSlotChange(name: 'prepend' | 'append', event: Event): void {
    const has = this._slotHasContent(event.target as HTMLSlotElement)
    if (name === 'prepend') this._hasPrepend = has
    else this._hasAppend = has
  }

  private _onIconSlotChange(event: Event): void {
    this._hasIcon = this._slotHasContent(event.target as HTMLSlotElement)
  }

  /** Host sizing (client-only; mirrors the light build's `_applyHostSize`). */
  private _applyHostSize(): void {
    const style = buildSizeStyle(this) as Record<string, string>
    for (const prop of ['width', 'height', 'min-width', 'max-width', 'min-height', 'max-height']) {
      const value = style[prop]
      if (value) this.style.setProperty(prop, value)
      else this.style.removeProperty(prop)
    }
  }

  private _renderBadge(): TemplateResult | typeof nothing {
    if (!this.badge) return nothing
    return html`<span class=${this._badgeClass} mono-badge=${this._badgeColor}>${this.badge}</span>`
  }

  /**
   * The icon box, which is also where the spinner is drawn.
   *
   * `spinning` paints the ring and hides the slotted icon; `data-empty` collapses the box when
   * there is neither. Matches the light build exactly — the two used to differ here, with light
   * keeping the span and shadow unmounting it.
   */
  private _iconSpan(): TemplateResult {
    const cls = [
      this._cls('button-icon', 'icon'),
      this._showsSpinner ? 'spinning' : '',
    ].filter(Boolean).join(' ')

    return html`
      <span class=${cls} mono-icon ?mono-spinning=${this._showsSpinner} ?mono-empty=${!this._hasIcon && !this._showsSpinner}>
        <slot name="icon" @slotchange=${(e: Event) => this._onIconSlotChange(e)}></slot>
      </span>
    `
  }

  private _renderIconOnlyContent(): TemplateResult {
    return html`
      ${this._iconSpan()}
      ${this._renderBadge()}
    `
  }

  private _renderNormalContent(): TemplateResult {
    // Class keys off `iconPosition` (a stable prop), NOT icon presence, so the
    // structure is hydration-stable; the empty icon span is hidden via data-empty.
    const contentBase =
      this.iconPosition === 'right'
        ? 'button-content icon-right'
        : 'button-content icon-left'
    const contentClass = this._cls(contentBase, 'content')
    const textClass = this._cls('button-text', 'text')

    return html`
      <div class=${contentClass} mono-content>
        ${this.iconPosition === 'left' ? this._iconSpan() : nothing}
        <span class=${textClass} mono-text><slot></slot></span>
        ${this.iconPosition === 'right' ? this._iconSpan() : nothing}
      </div>

      ${this._renderBadge()}
    `
  }

  private _renderContent(): TemplateResult {
    return this._isIconOnlyLike
      ? this._renderIconOnlyContent()
      : this._renderNormalContent()
  }

  protected override render(): TemplateResult {
    // Spinning implies disabled — in every phase, waiting included. But only
    // the *running* phase is natively `disabled`: a disabled control fires no
    // click at all, and the wait needs to keep hearing clicks to re-arm the
    // debounce timer (they're swallowed in `_handleClick`).
    const isDisabled = this._isBlocked
    const isInert = this._isInert
    const sizeStyle = styleMap(this._sizeStyle())

    if (this.href) {
      return this._renderWrapper(html`
          ${this._renderAffix('prepend')}
          <a
            class=${'mono-button-native' +
            (this.cssClass?.main ? ' ' + this.cssClass.main : '')}
            mono-native
            href=${ifDefined(this.href)}
            target=${ifDefined(this.target)}
            title=${ifDefined(this.tooltip)}
            aria-label=${ifDefined(this._ariaLabel)}
            role="button"
            aria-disabled=${isDisabled ? 'true' : 'false'}
            aria-busy=${this._effectiveLoading ? 'true' : 'false'}
            @click=${this._handleClick}
            @keydown=${this._handleKeyDown}
            @focus=${this._handleFocus}
            @blur=${this._handleBlur}
          >
            ${this._renderContent()}
          </a>
          ${this._renderAffix('append')}
        `, sizeStyle)
    }

    return this._renderWrapper(html`
        ${this._renderAffix('prepend')}
        <button
          class=${ifDefined(this.cssClass?.main)}
          mono-native
          type=${this.type}
          title=${ifDefined(this.tooltip)}
          aria-label=${ifDefined(this._ariaLabel)}
          ?disabled=${isInert}
          aria-disabled=${isDisabled ? 'true' : 'false'}
          aria-busy=${this._effectiveLoading ? 'true' : 'false'}
          @click=${this._handleClick}
          @keydown=${this._handleKeyDown}
          @focus=${this._handleFocus}
          @blur=${this._handleBlur}
        >
          ${this._renderContent()}
        </button>
        ${this._renderAffix('append')}
      `, sizeStyle)
  }
}

// NOTE: the `HTMLElementTagNameMap['mono-button']` augmentation is owned by the
// light build (mono-button.ts); redeclaring it here would be a TS2717 conflict.
