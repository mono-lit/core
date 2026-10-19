// @unocss-include

import { isServer, LitElement, html, nothing, unsafeCSS, type TemplateResult } from 'lit'
import { customElement } from '../../composables/mono-element'

import { MonoOtpCore, type OtpIconName, type OtpSlotName } from './otp-core.js'
import { toShadowCss, withShadowUtilityStyles } from '../../composables/shadow-css'
import { flushSsrHydration } from '../../composables/hydration-flush'

import otpCss from './otp.css?raw'
import labelPositionCss from '../form/label-position.css?raw'
import fieldTooltipCss from '../form/field-tooltip.css?raw'
import fieldValidationCss from '../form/field-validation.css?raw'

/**
 * Shadow-DOM `mono-otp` (SSR build, `@mono-lit/helper/ui/shadow/otp`, tag `mono-shadow-otp`).
 *
 * Shares every behaviour with the light build through `MonoOtpCore`; only the slot regions
 * differ: native `<slot name="prefix|suffix|label|helper">` (label / helper carry the prop text as
 * fallback). Slot presence is unknown during SSR, so both sides default to "empty" and
 * `firstUpdated()` scans the assigned nodes (Declarative Shadow DOM assigns slotted content at
 * parse time, so `slotchange` never fires after hydration — same as mono-input).
 */
@customElement('mono-shadow-otp')
export class MonoOtpShadow extends withShadowUtilityStyles(MonoOtpCore(LitElement)) {
  static {
    ;(this as typeof LitElement).disableWarning?.('change-in-update')
  }

  static override styles = [
    unsafeCSS(toShadowCss(otpCss + labelPositionCss + fieldTooltipCss + fieldValidationCss, { host: 'mono-otp' })),
  ]

  override connectedCallback(): void {
    super.connectedCallback()
    if (isServer) return
    flushSsrHydration(this)
  }

  override firstUpdated(changed: Map<string, unknown>): void {
    super.firstUpdated(changed)
    for (const name of ['prefix', 'suffix', 'label', 'helper'] as OtpSlotName[]) {
      const slot = this.renderRoot.querySelector(`slot[name="${name}"]`) as HTMLSlotElement | null
      this._setSlotState(name, this._slotHasContent(slot))
    }
  }

  private _slotHasContent(slot: HTMLSlotElement | null): boolean {
    return !!slot && slot.assignedNodes({ flatten: true }).some((n) => n.nodeType === Node.ELEMENT_NODE || !!(n.textContent ?? '').trim())
  }

  private _setSlotState(name: OtpSlotName, has: boolean): void {
    if (name === 'prefix' && this._hasPrefixSlotState !== has) this._hasPrefixSlotState = has
    else if (name === 'suffix' && this._hasSuffixSlotState !== has) this._hasSuffixSlotState = has
    else if (name === 'label' && this._hasLabelSlotState !== has) this._hasLabelSlotState = has
    else if (name === 'helper' && this._hasHelperSlotState !== has) this._hasHelperSlotState = has
  }

  private _onSlotChange(name: OtpSlotName, event: Event): void {
    this._setSlotState(name, this._slotHasContent(event.target as HTMLSlotElement))
  }

  protected override _renderLabelText(): TemplateResult {
    return html`<slot name="label" @slotchange=${(e: Event) => this._onSlotChange('label', e)}>${this.label}</slot>`
  }

  /** Always rendered (the slot must exist to be scanned); hidden with `mono-empty` when empty. */
  protected override _renderLabel(): TemplateResult {
    return html`
      <label
        class=${this._cls('mono-otp-label', 'label')}
        mono-label
        id=${`${this._otpId}-label`}
        for=${`${this._otpId}-0`}
        ?mono-empty=${!this.label && !this._hasLabelSlotState}
      >
        ${this._renderLabelText()}
        ${this.required ? html`<span class=${this._cls('mono-otp-required', 'required')} mono-required-mark>*</span>` : nothing}
        ${this._tooltip.render()}
      </label>
    `
  }

  protected override _renderHelperText(base: string): TemplateResult {
    return html`
      <div class=${`${base} helper`} mono-message="helper" ?mono-empty=${!this.helperText && !this._hasHelperSlotState}>
        <slot name="helper" @slotchange=${(e: Event) => this._onSlotChange('helper', e)}>${this.helperText}</slot>
      </div>
    `
  }

  protected override _renderAffix(name: 'prefix' | 'suffix'): TemplateResult {
    const has = name === 'prefix' ? this._hasPrefixSlotState : this._hasSuffixSlotState
    return html`<span class=${this._cls(`mono-otp-${name}`, name)} mono-otp-affix=${name} ?mono-empty=${!has}>
      <slot name=${name} @slotchange=${(e: Event) => this._onSlotChange(name, e)}></slot>
    </span>`
  }

  protected override renderIcon(_name: OtpIconName): TemplateResult {
    // Inline SVG — global `.mono-icon`/`i-mdi-*` (UnoCSS) can't reach a shadow root.
    return html`
      <svg viewBox="0 0 24 24" mono-icon fill="currentColor" aria-hidden="true">
        <path d="M19,6.41L17.59,5L12,10.59L6.41,5L5,6.41L10.59,12L5,17.59L6.41,19L12,13.41L17.59,19L19,17.59L13.41,12L19,6.41Z" />
      </svg>
    `
  }
}
