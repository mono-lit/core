// @unocss-include

import { isServer, LitElement, html, nothing, unsafeCSS, type TemplateResult } from 'lit'
import { customElement } from '../../composables/mono-element'

import { MonoInputCore, type InputSlotName } from './input-core.js'
import { toShadowCss, withShadowUtilityStyles } from '../../composables/shadow-css'

import inputCss from './input.css?raw'
import { flushSsrHydration } from '../../composables/hydration-flush'

// Shadow-only: a slot wrapper whose slot has no assigned content carries
// `mono-empty` (input.css hides it). Presence is detected after hydration (see
// firstUpdated); default-empty so the server and the initial client render match.
const SHADOW_EXTRA_CSS = ''

/**
 * Shadow-DOM `mono-input` (SSR build, `@mono-lit/helper/ui/shadow/input`).
 *
 * Real shadow root + `static styles`, so `@lit-labs/ssr` serializes it to
 * Declarative Shadow DOM and styles are scoped. Slotting uses native `<slot>`.
 *
 * Slot-presence note: during SSR the element has no light children, so it can't
 * know which slots are filled. Both server and client therefore DEFAULT every
 * `_has…SlotState` to `false` (so hydration matches), render the slot wrappers
 * with `mono-empty` (hidden by input.css), then correct presence
 * after hydration in `firstUpdated()` (Declarative Shadow DOM assigns slotted
 * content at parse time, so `slotchange` does NOT fire after upgrade — we scan
 * `assignedNodes()` directly; `slotchange` is kept for later dynamic changes).
 * `<slot name="label|helper">` carries the prop text (`label`/`helperText`) as
 * native fallback so it shows with no JS.
 *
 * Shares all logic with the light build via `MonoInputCore`. Both register
 * `mono-input`, so a document loads only one build.
 */
@customElement('mono-shadow-input')
export class MonoInputShadow extends withShadowUtilityStyles(MonoInputCore(LitElement)) {
  static {
    // Slot presence can only be measured after the first render creates the
    // <slot> elements, and hydration requires correcting the default-hidden
    // regions in a follow-up update — the legitimate exception this warning
    // describes. Dev-only suppression (no-op in production Lit).
    ;(this as typeof LitElement).disableWarning?.('change-in-update')
  }

  static override styles = [
    unsafeCSS(toShadowCss(inputCss, { host: 'mono-input', append: SHADOW_EXTRA_CSS })),
  ]

  override firstUpdated(changed: Map<string, unknown>): void {
    super.firstUpdated(changed)
    // Declarative Shadow DOM assigns slotted content at HTML-parse time, so
    // `slotchange` does NOT fire after the element upgrades/hydrates. Detect the
    // initially-assigned content directly here (client-only — @lit-labs/ssr never
    // calls firstUpdated, so the server keeps the wrappers `mono-empty` and the
    // hydration render still matches; this runs as a post-hydration update).
    for (const name of ['prefix', 'suffix', 'label', 'helper'] as InputSlotName[]) {
      const slot = this.renderRoot.querySelector(
        `slot[name="${name}"]`,
      ) as HTMLSlotElement | null
      this._setSlotState(name, this._slotHasContent(slot))
    }
  }

  private _slotHasContent(slot: HTMLSlotElement | null): boolean {
    return (
      !!slot &&
      slot
        .assignedNodes({ flatten: true })
        .some((n) => n.nodeType === Node.ELEMENT_NODE || !!(n.textContent ?? '').trim())
    )
  }

  private _setSlotState(name: InputSlotName, has: boolean): void {
    if (name === 'prefix') this._hasPrefixSlotState = has
    else if (name === 'suffix') this._hasSuffixSlotState = has
    else if (name === 'label') this._hasLabelSlotState = has
    else if (name === 'helper') this._hasHelperSlotState = has
  }

  private _onSlotChange(name: InputSlotName, event: Event): void {
    this._setSlotState(name, this._slotHasContent(event.target as HTMLSlotElement))
  }

  protected override renderIcon(_name: 'close'): TemplateResult {
    // Inline SVG — global `.mono-icon`/`i-mdi-close` (UnoCSS) can't reach a shadow root.
    return html`
      <svg viewBox="0 0 24 24" mono-icon fill="currentColor" aria-hidden="true">
        <path d="M19,6.41L17.59,5L12,10.59L6.41,5L5,6.41L10.59,12L5,17.59L6.41,19L12,13.41L17.59,19L19,17.59L13.41,12L19,6.41Z" />
      </svg>
    `
  }

  private _renderLabel(): TemplateResult {
    return html`
      <label
        class=${this._cls('mono-input-label', 'label')}
        mono-label
        for=${this._inputId}
        ?mono-empty=${!this.label && !this._hasLabelSlot}
      >
        <slot name="label" @slotchange=${(e: Event) => this._onSlotChange('label', e)}>${this.label}</slot>
        ${this.required
          ? html`<span class=${this._cls('mono-input-required', 'required')} mono-required-mark>*</span>`
          : nothing}
      </label>
    `
  }

  private _renderHelper(): TemplateResult {
    const base = this._cls('mono-input-message', 'message')
    if (this.validationMessage) {
      const state = this._resolvedValidationState
      return html`<div class=${`${base} ${state}`} mono-message=${state} role=${state === 'invalid' ? 'alert' : nothing}>${this.validationMessage}</div>`
    }
    if (this.errorMessage) {
      return html`<div class=${`${base} invalid`} mono-message="invalid" role="alert">${this.errorMessage}</div>`
    }
    if (this.successMessage) {
      return html`<div class=${`${base} valid`} mono-message="valid">${this.successMessage}</div>`
    }
    return html`
      <div
        class=${`${base} helper`}
        mono-message="helper"
        ?mono-empty=${!this.helperText && !this._hasHelperSlot}
      >
        <slot name="helper" @slotchange=${(e: Event) => this._onSlotChange('helper', e)}>${this.helperText}</slot>
      </div>
    `
  }

  protected override render(): TemplateResult {
    return this._renderWrapper(html`
        ${this._renderLabel()}
        <div class=${this._fieldClasses} mono-field>
          <span class=${this._cls('mono-input-prefix', 'prefix')} mono-prefix ?mono-empty=${!this._hasPrefixSlot}>
            <slot name="prefix" @slotchange=${(e: Event) => this._onSlotChange('prefix', e)}></slot>
          </span>
          ${this._renderNative()}
          ${this._renderClear()}
          <span class=${this._cls('mono-input-suffix', 'suffix')} mono-suffix ?mono-empty=${!this._hasSuffixSlot}>
            <slot name="suffix" @slotchange=${(e: Event) => this._onSlotChange('suffix', e)}></slot>
          </span>
        </div>
        <div id=${this._messageId} class=${this.cssClass?.messageWrap ?? ''} mono-message-wrap>
          ${this._renderHelper()}
        </div>
    `)
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

// NOTE: the `HTMLElementTagNameMap['mono-input']` augmentation is owned by the
// light build (mono-input.ts); redeclaring it here would be a TS2717 conflict.
