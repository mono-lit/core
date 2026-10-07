// @unocss-include

import { LitElement, html, isServer, nothing, unsafeCSS, type TemplateResult } from 'lit'
import { customElement } from '../../composables/mono-element'

import { MonoRadioCore } from './radio-core.js'
import { toShadowCss, withShadowUtilityStyles } from '../../composables/shadow-css'

import radioCss from './radio.css?raw'
import { flushSsrHydration } from '../../composables/hydration-flush'

// radio.css hides [mono-empty] regions itself (the light build never renders
// them), so the shadow build needs no extra rules.
const SHADOW_EXTRA_CSS = ''

type RadioSlotName = 'label' | 'description'

/**
 * Shadow-DOM `mono-radio` (the opt-in SSR build, `@mono-lit/helper/ui/shadow/radio`).
 *
 * Real shadow root + `static styles`, so `@lit-labs/ssr` serializes it to
 * Declarative Shadow DOM and styles are scoped (`mono-radio`→`:host`). The radio
 * circle + dot are pure CSS, and the selected state is the `mono-radio-checked`
 * wrapper class, so the checked state server-renders from `this.modelValue ===
 * this.value` (no icons, no input-attribute concerns). The `label`/`description`
 * slots carry the prop text as native fallback (shown server-side); slot presence
 * is detected in `firstUpdated()` via `assignedNodes()` (DSD assigns at parse time
 * → no `slotchange` after upgrade). Interactivity needs the first client update to
 * flush (so `@change` binds) — hence the defer-hydration poll. Shares all logic
 * with the light build via `MonoRadioCore`; both register `mono-radio`, so a
 * document loads one.
 */
@customElement('mono-shadow-radio')
export class MonoRadioShadow extends withShadowUtilityStyles(MonoRadioCore(LitElement)) {
  static {
    // Slot presence can only be measured after the first render creates the
    // <slot> elements, and hydration requires correcting the default-hidden
    // regions in a follow-up update — the legitimate exception this warning
    // describes. Dev-only suppression (no-op in production Lit).
    ;(this as typeof LitElement).disableWarning?.('change-in-update')
  }

  static override styles = [
    unsafeCSS(toShadowCss(radioCss, { host: 'mono-radio', append: SHADOW_EXTRA_CSS })),
  ]

  override connectedCallback(): void {
    super.connectedCallback()
    if (isServer) return
    flushSsrHydration(this)
  }

  override firstUpdated(changed: Map<string, unknown>): void {
    // @ts-ignore — super may not declare firstUpdated through the generic base.
    super.firstUpdated?.(changed)
    if (isServer) return
    this._scanSlots()
  }

  protected override updated(changed: Map<string, unknown>): void {
    // @ts-ignore — super may not declare updated through the generic base.
    super.updated?.(changed)
    if (!isServer) this._scanSlots()
  }

  private _slotFor(name: RadioSlotName): HTMLSlotElement | null {
    return this.renderRoot.querySelector(`slot[name="${name}"]`) as HTMLSlotElement | null
  }

  private _slotHasContent(slot: HTMLSlotElement | null): boolean {
    return (
      !!slot &&
      slot
        .assignedNodes()
        .some((n) => n.nodeType === Node.ELEMENT_NODE || !!(n.textContent ?? '').trim())
    )
  }

  private _onSlotChange(name: RadioSlotName, event: Event): void {
    this._setSlotState(
      name,
      name === 'description'
        ? this._sublabelHasContent()
        : this._slotHasContent(event.target as HTMLSlotElement),
    )
  }

  /**
   * The sublabel region answers to `slot="sublabel"` and to the older
   * `slot="description"` (nested inside it), so its presence is the union.
   */
  private _sublabelHasContent(): boolean {
    const byName = (n: string) =>
      this.renderRoot.querySelector(`slot[name="${n}"]`) as HTMLSlotElement | null
    return this._slotHasContent(byName('sublabel')) || this._slotHasContent(byName('description'))
  }

  private _setSlotState(name: RadioSlotName, has: boolean): void {
    if (name === 'label') this._hasLabelSlotState = has
    else this._hasDescriptionSlotState = has
  }

  private _scanSlots(): void {
    for (const name of ['label', 'description'] as RadioSlotName[]) {
      const has =
        name === 'description' ? this._sublabelHasContent() : this._slotHasContent(this._slotFor(name))
      const current = name === 'label' ? this._hasLabelSlotState : this._hasDescriptionSlotState
      if (has !== current) this._setSlotState(name, has)
    }
  }

  protected override _renderLabelBlock(): TemplateResult | typeof nothing {
    // Always render the regions (hidden via `mono-empty` when no content) so the
    // label/description slots project DSD content server-side and the prop text
    // shows as native slot fallback with no JS.
    return html`
      <span
        class=${this._cls('mono-radio-label', 'label')}
        mono-label
        ?mono-empty=${!this._hasLabelContent() && !this._hasDescriptionContent()}
      >
        <span
          class=${this._cls('mono-radio-label-text', 'labelText')}
          mono-label-text
          ?mono-empty=${!this._hasLabelContent()}
        >
          <slot name="label" @slotchange=${(e: Event) => this._onSlotChange('label', e)}
            >${this.label || nothing}</slot
          >
        </span>

        <span
          class=${this._cls('mono-radio-label-description', 'description')}
          mono-description
          ?mono-empty=${!this._hasDescriptionContent()}
        >
          <slot name="sublabel" @slotchange=${(e: Event) => this._onSlotChange('description', e)}
            ><slot
              name="description"
              @slotchange=${(e: Event) => this._onSlotChange('description', e)}
              >${this.sublabel || nothing}</slot
            ></slot
          >
        </span>
      </span>
    `
  }
}

// NOTE: the `HTMLElementTagNameMap['mono-radio']` augmentation is owned by the
// light build (mono-radio.ts); redeclaring it here would be a TS2717 conflict.
