// @unocss-include

import { isServer, LitElement, html, nothing, unsafeCSS, type TemplateResult } from 'lit'
import { customElement } from '../../composables/mono-element'

import { MonoInputCore, type InputIconName, type InputSlotName } from './input-core.js'
import { toShadowCss, withShadowUtilityStyles } from '../../composables/shadow-css'

import inputCss from './input.css?raw'
import labelPositionCss from '../form/label-position.css?raw'
import fieldTooltipCss from '../form/field-tooltip.css?raw'
import fieldValidationCss from '../form/field-validation.css?raw'
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
    unsafeCSS(toShadowCss(inputCss + labelPositionCss + fieldTooltipCss + fieldValidationCss, { host: 'mono-input', append: SHADOW_EXTRA_CSS })),
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

  protected override renderIcon(name: InputIconName): TemplateResult {
    // Inline SVG — global `.mono-icon`/`i-mdi-*` (UnoCSS) can't reach a shadow root.
    if (name === 'upload') {
      // mdi `cloud-upload-outline`
      return html`
        <svg viewBox="0 0 24 24" mono-icon fill="currentColor" aria-hidden="true">
          <path d="M6.5 20q-2.28 0-3.89-1.57Q1 16.85 1 14.58q0-1.95 1.17-3.48q1.18-1.53 3.08-1.95q.63-2.3 2.5-3.72Q9.63 4 12 4q2.93 0 4.96 2.04Q19 8.07 19 11q1.73.2 2.86 1.5q1.14 1.28 1.14 3q0 1.88-1.31 3.19T18.5 20H13q-.82 0-1.41-.59Q11 18.83 11 18v-5.15L9.4 14.4L8 13l4-4l4 4l-1.4 1.4l-1.6-1.55V18h5.5q1.05 0 1.77-.73q.73-.72.73-1.77t-.73-1.77Q19.55 13 18.5 13H17v-2q0-2.07-1.46-3.54Q14.08 6 12 6Q9.93 6 8.46 7.46Q7 8.93 7 11h-.5q-1.45 0-2.47 1.03Q3 13.05 3 14.5T4.03 17q1.02 1 2.47 1H9v2m3-7" />
        </svg>
      `
    }
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
        ${this._tooltip.render()}
        ${this._renderRangeValue('label')}
      </label>
    `
  }

  private _renderHelper(): TemplateResult {
    const base = this._cls('mono-input-message', 'message')
    // validation-position icon / float: the row keeps the helper; the message moved.
    if (this._validation.moved) return html`${this._renderHelperText(base)}${this._renderMovedMessage()}`
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
    return this._renderHelperText(base)
  }

  private _renderHelperText(base: string): TemplateResult {
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
          ${this._renderRangeValue('field')}
          ${this._validation.renderIcon()}
          ${this._renderClear()}
          ${this._renderFileIcon()}
          <span class=${this._cls('mono-input-suffix', 'suffix')} mono-suffix ?mono-empty=${!this._hasSuffixSlot}>
            <slot name="suffix" @slotchange=${(e: Event) => this._onSlotChange('suffix', e)}></slot>
          </span>
        </div>
        <div id=${this._messageId} class=${this.cssClass?.messageWrap ?? ''} mono-message-wrap>
          ${this._renderHelper()}
        </div>
        ${this._validation.renderFloat()}
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
