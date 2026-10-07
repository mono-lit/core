// @unocss-include

import { LitElement, html, isServer, nothing, unsafeCSS, type TemplateResult } from 'lit'
import { customElement } from '../../composables/mono-element'

import { MonoTextareaCore, type TextareaSlotName } from './textarea-core.js'
import { toShadowCss, withShadowUtilityStyles } from '../../composables/shadow-css'

import textareaCss from './textarea.css?raw'
import { flushSsrHydration } from '../../composables/hydration-flush'

// Shadow-only: hide the label / helper / footer regions when they carry no
// content. They always render (so the native `<slot>`s exist to project DSD
// content and be scanned), then collapse when empty.
// textarea.css hides [mono-empty] regions itself (the light build never renders
// them), so the shadow build needs no extra rules.
const SHADOW_EXTRA_CSS = ''

/**
 * Shadow-DOM `mono-textarea` (the opt-in SSR build, `@mono-lit/helper/ui/shadow/textarea`).
 *
 * Real shadow root + `static styles`, so `@lit-labs/ssr` serializes it to
 * Declarative Shadow DOM and styles are scoped (`mono-textarea`→`:host`). The
 * `<textarea>` + label/message/counter render server-side (no icons). The
 * `label`/`helper` slots carry the prop text as native fallback (shown
 * server-side); presence is detected in `firstUpdated()` via `assignedNodes()`
 * (DSD assigns at parse time → no `slotchange` after upgrade) plus `@slotchange`.
 * Interactivity needs the first client update to flush (so `@input` binds) —
 * hence the defer-hydration poll. Shares all logic with the light build via
 * `MonoTextareaCore`; both register `mono-textarea`, so a document loads one.
 */
@customElement('mono-shadow-textarea')
export class MonoTextareaShadow extends withShadowUtilityStyles(MonoTextareaCore(LitElement)) {
  static {
    // Slot presence is measured after the first render creates the <slot>
    // elements, and hydration corrects the default-empty regions in a follow-up
    // update — the legitimate exception this warning describes. Dev-only.
    ;(this as typeof LitElement).disableWarning?.('change-in-update')
  }

  static override styles = [
    unsafeCSS(toShadowCss(textareaCss, { host: 'mono-textarea', append: SHADOW_EXTRA_CSS })),
  ]

  protected override get _slotsAlwaysRender(): boolean {
    return true
  }

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
    // @ts-ignore — core's firstUpdated takes no args; LitElement's is typed with 1.
    super.firstUpdated?.(changed)
    if (isServer) return
    this._scanSlots()
  }

  protected override updated(changed: Map<string, unknown>): void {
    super.updated(changed)
    if (!isServer) this._scanSlots()
  }

  private _slotFor(name: TextareaSlotName): HTMLSlotElement | null {
    return this.renderRoot.querySelector(`slot[name="${name}"]`) as HTMLSlotElement | null
  }

  private _slotHasContent(slot: HTMLSlotElement | null): boolean {
    return (
      !!slot &&
      slot
        .assignedNodes({ flatten: true })
        .some((n) => n.nodeType === Node.ELEMENT_NODE || !!(n.textContent ?? '').trim())
    )
  }

  private _onSlotChange(name: TextareaSlotName, event: Event): void {
    this._setSlotState(name, this._slotHasContent(event.target as HTMLSlotElement))
  }

  /** Reconcile the 2 slot-presence flags from their slots' assigned content. */
  private _scanSlots(): void {
    for (const name of ['label', 'helper'] as TextareaSlotName[]) {
      const has = this._slotHasContent(this._slotFor(name))
      const current = name === 'label' ? this._hasLabelSlotState : this._hasHelperSlotState
      // Guard: only assign on change so we don't loop (updated → state → updated).
      if (has !== current) this._setSlotState(name, has)
    }
  }

  /** Native `<slot>` carrying the prop fallback as native slot content. */
  protected override _slotOutlet(
    name: TextareaSlotName,
    fallback: unknown = nothing,
  ): TemplateResult {
    return html`<slot
      name=${name}
      @slotchange=${(e: Event) => this._onSlotChange(name, e)}
      >${fallback}</slot
    >`
  }
}

// NOTE: the `HTMLElementTagNameMap['mono-textarea']` augmentation is owned by the
// light build (mono-textarea.ts); redeclaring it here would be a TS2717 conflict.
