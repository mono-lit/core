// @unocss-include

import { isServer, LitElement, html, nothing, unsafeCSS, type TemplateResult } from 'lit'
import { customElement } from '../../composables/mono-element'

import { MonoSliderCore, type SliderSlotName } from './slider-core.js'
import { toShadowCss, withShadowUtilityStyles } from '../../composables/shadow-css'
import { flushSsrHydration } from '../../composables/hydration-flush'

import sliderCss from './slider.css?raw'
import fieldTooltipCss from '../form/field-tooltip.css?raw'

/**
 * Shadow-DOM `mono-slider` (SSR build, `@mono-lit/helper/ui/shadow/slider`, tag
 * `mono-shadow-slider`).
 *
 * Shares every behaviour with the light build through `MonoSliderCore`; only the label and helper
 * regions differ: native `<slot name="label|helper">` with the prop text as fallback. Slot
 * presence is unknown during SSR, so both sides default to "empty" and `firstUpdated()` scans the
 * assigned nodes (Declarative Shadow DOM assigns slotted content at parse time, so `slotchange`
 * never fires after hydration — same as mono-input / mono-switch).
 */
@customElement('mono-shadow-slider')
export class MonoSliderShadow extends withShadowUtilityStyles(MonoSliderCore(LitElement)) {
  static {
    ;(this as typeof LitElement).disableWarning?.('change-in-update')
  }

  static override styles = [unsafeCSS(toShadowCss(sliderCss + fieldTooltipCss, { host: 'mono-slider' }))]

  override connectedCallback(): void {
    super.connectedCallback()
    if (isServer) return
    flushSsrHydration(this)
  }

  override firstUpdated(changed: Map<string, unknown>): void {
    super.firstUpdated?.(changed)
    for (const name of ['label', 'helper'] as SliderSlotName[]) {
      const slot = this.renderRoot.querySelector(`slot[name="${name}"]`) as HTMLSlotElement | null
      this._setSlotState(name, this._slotHasContent(slot))
    }
  }

  private _slotHasContent(slot: HTMLSlotElement | null): boolean {
    return !!slot && slot.assignedNodes({ flatten: true }).some((n) => n.nodeType === Node.ELEMENT_NODE || !!(n.textContent ?? '').trim())
  }

  private _setSlotState(name: SliderSlotName, has: boolean): void {
    if (name === 'label' && this._hasLabelSlotState !== has) this._hasLabelSlotState = has
    else if (name === 'helper' && this._hasHelperSlotState !== has) this._hasHelperSlotState = has
  }

  private _onSlotChange(name: SliderSlotName, event: Event): void {
    this._setSlotState(name, this._slotHasContent(event.target as HTMLSlotElement))
  }

  protected override _renderLabelText(): TemplateResult {
    return html`<slot name="label" @slotchange=${(e: Event) => this._onSlotChange('label', e)}>${this.label}</slot>`
  }

  /** Always rendered (the slot must exist to be scanned); hidden with `mono-empty` when empty. */
  protected override _renderLabel(): TemplateResult {
    return html`
      <div mono-label-row ?mono-empty=${!this._hasLabel}>
        <label class=${this._cls('mono-slider-label', 'label')} mono-label id=${`${this._sliderId}-label`}>
          ${this._renderLabelText()}
          ${this.required ? html`<span class=${this._cls('mono-slider-required', 'required')} mono-required-mark>*</span>` : nothing}
          ${this._tooltip.render()}
        </label>
        ${this.showValue && this._hasLabel ? this._renderReadout() : nothing}
      </div>
    `
  }

  protected override _renderMessage(): TemplateResult {
    const base = this._cls('mono-slider-message', 'message')
    if (this.validationMessage) {
      const s = this._resolvedValidationState
      return html`<div class=${`${base} ${s}`} mono-message=${s} role=${s === 'invalid' ? 'alert' : nothing}>${this.validationMessage}</div>`
    }
    if (this.errorMessage) return html`<div class=${`${base} invalid`} mono-message="invalid" role="alert">${this.errorMessage}</div>`
    if (this.successMessage) return html`<div class=${`${base} valid`} mono-message="valid">${this.successMessage}</div>`
    return html`
      <div class=${`${base} helper`} mono-message="helper" ?mono-empty=${!this.helperText && !this._hasHelperSlotState}>
        <slot name="helper" @slotchange=${(e: Event) => this._onSlotChange('helper', e)}>${this.helperText}</slot>
      </div>
    `
  }
}

// NOTE: the `HTMLElementTagNameMap['mono-slider']` augmentation is owned by the light build.
