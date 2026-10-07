// @unocss-include

import { LitElement, html, isServer, nothing, unsafeCSS, type TemplateResult } from 'lit'
import { customElement } from '../../composables/mono-element'
import { ifDefined } from 'lit/directives/if-defined.js'
import { when } from 'lit/directives/when.js'

import { MonoChipCore } from './chip-core.js'
import { toShadowCss, withShadowUtilityStyles } from '../../composables/shadow-css'

import chipCss from './chip.css?raw'
import { flushSsrHydration } from '../../composables/hydration-flush'

// Shadow-only: hide the icon region when its slot has no assigned content. Reuses
// the existing `[data-mono-slot='icon']` rule as the icon-wrapper hook;
// `display:none` also drops its flex gap, so chips without an icon have no phantom
// spacing. Default-hidden so the server and first client render match; real
// presence is corrected in `firstUpdated()`.
const SHADOW_EXTRA_CSS = `
[data-mono-slot='icon'][data-empty] {
  display: none;
}
`

/**
 * Shadow-DOM `mono-chip` (the opt-in SSR build, `@mono-lit/helper/ui/shadow/chip`).
 *
 * Real shadow root + `static styles`, so `@lit-labs/ssr` serializes it to
 * Declarative Shadow DOM and styles are scoped (`mono-chip`→`:host`). Slotting
 * uses native `<slot>`: the `label` prop wins, else the default slot projects the
 * label (DSD at parse time → no flash); `<slot name="icon">` defaults `data-empty`
 * (hidden) so server and first client render match (corrected in `firstUpdated()`
 * via `assignedNodes()` + `@slotchange`); the close button projects
 * `<slot name="close">` with an inline-SVG fallback (the `i-mdi-close` UnoCSS
 * class can't paint inside a shadow root). The icon side keys off `iconPosition`
 * (not slot presence) so the DOM is hydration-stable. Interactivity needs the
 * first client update to flush (so handlers bind) — hence the defer-hydration
 * poll. Shares all logic with the light build via `MonoChipCore`; both register
 * `mono-chip`, so a document loads only one.
 */
@customElement('mono-shadow-chip')
export class MonoChipShadow extends withShadowUtilityStyles(MonoChipCore(LitElement)) {
  static {
    // Slot presence can only be measured after the first render creates the
    // <slot> elements, and hydration requires correcting the default-hidden
    // regions in a follow-up update — the legitimate exception this warning
    // describes. Dev-only suppression (no-op in production Lit).
    ;(this as typeof LitElement).disableWarning?.('change-in-update')
  }

  static override styles = [
    unsafeCSS(toShadowCss(chipCss, { host: 'mono-chip', append: SHADOW_EXTRA_CSS })),
  ]

  override connectedCallback(): void {
    super.connectedCallback()
    if (isServer) return
    // Under nuxt-ssr-lit the SSR'd element can stay `hasUpdated:false` with
    // updates disabled after the wrapper removes `defer-hydration` — so its
    // handlers never bind. Force the first client update to flush by polling
    // `requestUpdate()` for a few frames; a no-op once already hydrated.
    flushSsrHydration(this)
  }

  override firstUpdated(changed: Map<string, unknown>): void {
    // @ts-ignore — super may not declare firstUpdated through the generic base.
    super.firstUpdated?.(changed)
    if (isServer) return
    this._hasIcon = this._slotHasContent(this._iconSlot())
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

  private _onIconSlotChange(event: Event): void {
    this._hasIcon = this._slotHasContent(event.target as HTMLSlotElement)
  }

  private _renderDot(): TemplateResult | typeof nothing {
    return when(
      this.dot,
      () => html`<span class=${this._cls('chip-dot', 'dot')} mono-dot aria-hidden="true"></span>`,
      () => nothing,
    )
  }

  private _iconSpan(): TemplateResult {
    return html`
      <span data-mono-slot="icon" ?mono-empty=${!this._hasIcon}>
        <slot name="icon" @slotchange=${(e: Event) => this._onIconSlotChange(e)}></slot>
      </span>
    `
  }

  private _renderLabel(): TemplateResult {
    // `label` prop wins; otherwise the default slot projects children. The branch
    // keys off the stable `label` prop, so the structure is hydration-stable.
    return html`
      <span class=${this._cls('chip-label', 'label')} mono-label>
        ${this.label ? this.label : html`<slot></slot>`}
      </span>
    `
  }

  private _renderClose(): TemplateResult | typeof nothing {
    return when(
      this.removable,
      () => html`
        <button
          class=${this._cls('chip-close', 'close')}
          mono-close
          type="button"
          aria-label=${this.closeLabel}
          ?disabled=${this.disabled}
          @click=${this._handleClose}
        >
          <slot name="close">
            <svg
              class="mono-icon"
              mono-glyph
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
              aria-hidden="true"
            >
              <path d="M18 6 6 18M6 6l12 12"></path>
            </svg>
          </slot>
        </button>
      `,
      () => nothing,
    )
  }

  private _renderContent(): TemplateResult {
    // Class keys off `iconPosition` (stable prop), NOT icon presence, so the
    // structure is hydration-stable; the empty icon span is hidden via data-empty.
    const contentClass = this._cls(
      this.iconPosition === 'right'
        ? 'chip-content icon-right'
        : 'chip-content icon-left',
      'content',
    )

    return html`
      <span class=${contentClass} mono-content>
        ${this._renderDot()}
        ${this.iconPosition === 'left' ? this._iconSpan() : nothing}
        ${this._renderLabel()}
        ${this.iconPosition === 'right' ? this._iconSpan() : nothing}
        ${this._renderClose()}
      </span>
    `
  }

  protected override render(): TemplateResult {
    const tabIndex = this._isInteractive && !this.disabled ? '0' : undefined
    const ariaLabel = this.ariaLabelText ?? this.label

    if (this.href) {
      return html`
        <div
        class=${this._chipClasses}
        mono-chip
        mono-size=${this.size === 'md' ? nothing : this.size}
        mono-color=${this.color === 'primary' ? nothing : this.color}
        mono-variant=${this.variant === 'soft' ? nothing : this.variant}
        mono-rounded=${this.rounded ? this.rounded : nothing}
        mono-icon-position=${this.iconPosition === 'right' ? 'right' : nothing}
        ?mono-has-dot=${this.dot}
        ?mono-removable=${this.removable}
        ?mono-clickable=${this.clickable || !!this.href}
        ?mono-disabled=${this.disabled}
        ?mono-selected=${this.selected || this._isActive}
      >
          <a
            class=${'mono-chip-native' +
            (this.cssClass?.main ? ' ' + this.cssClass.main : '')}
            mono-main
            href=${ifDefined(this.href)}
            target=${ifDefined(this.target)}
            role="button"
            aria-label=${ifDefined(ariaLabel)}
            aria-disabled=${this.disabled ? 'true' : 'false'}
            @click=${this._handleClick}
            @keydown=${this._handleKeyDown}
            @focus=${this._handleFocus}
            @blur=${this._handleBlur}
          >
            ${this._renderContent()}
          </a>
        </div>
      `
    }

    return html`
      <div
        class=${this._chipClasses}
        mono-chip
        mono-size=${this.size === 'md' ? nothing : this.size}
        mono-color=${this.color === 'primary' ? nothing : this.color}
        mono-variant=${this.variant === 'soft' ? nothing : this.variant}
        mono-rounded=${this.rounded ? this.rounded : nothing}
        mono-icon-position=${this.iconPosition === 'right' ? 'right' : nothing}
        ?mono-has-dot=${this.dot}
        ?mono-removable=${this.removable}
        ?mono-clickable=${this.clickable || !!this.href}
        ?mono-disabled=${this.disabled}
        ?mono-selected=${this.selected || this._isActive}
      >
        <span
          class=${ifDefined(this.cssClass?.main)}
          mono-main
          role=${this._isInteractive ? 'button' : 'status'}
          tabindex=${ifDefined(tabIndex)}
          aria-label=${ifDefined(ariaLabel)}
          aria-disabled=${this.disabled ? 'true' : 'false'}
          @click=${this._handleClick}
          @keydown=${this._handleKeyDown}
          @focus=${this._handleFocus}
          @blur=${this._handleBlur}
        >
          ${this._renderContent()}
        </span>
      </div>
    `
  }
}

// NOTE: the `HTMLElementTagNameMap['mono-chip']` augmentation is owned by the
// light build (mono-chip.ts); redeclaring it here would be a TS2717 conflict.
