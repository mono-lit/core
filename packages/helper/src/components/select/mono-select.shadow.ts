// @unocss-include

import { LitElement, html, isServer, nothing, unsafeCSS, type TemplateResult } from 'lit'
import { customElement } from '../../composables/mono-element'

import { MonoSelectCore, type SelectSlotName } from './select-core.js'
import { toShadowCss, withShadowUtilityStyles } from '../../composables/shadow-css'

import selectCss from './select.css?raw'
import { flushSsrHydration } from '../../composables/hydration-flush'

// Shadow-only: hide the label / helper regions when they carry no content
// (slot empty + no prop fallback). They always render (so the native `<slot>`s
// exist to project DSD content and be scanned), then collapse when empty.
const SHADOW_EXTRA_CSS = `
[mono-value] > slot[name='prefix'],
[mono-value] > slot[name='suffix'] {
  display: contents;
}
`

/**
 * Shadow-DOM `mono-select` (the opt-in SSR build, `@mono-lit/helper/ui/shadow/select`).
 *
 * Real shadow root + `static styles`, so `@lit-labs/ssr` serializes it to
 * Declarative Shadow DOM and styles are scoped (`mono-select`→`:host`). The
 * collapsed control (label + trigger + placeholder + message) server-renders;
 * the dropdown panel is closed server-side and the DataSource (async) is
 * client-only — options populate after hydration. The panel stays in the shadow
 * root (the shared `PopupPortalController` skips the body portal for a shadow
 * host and CSS positions it under the `position:relative` `.mono-select`).
 *
 * Slotting uses native `<slot>`: `label`/`helper` carry the prop text as native
 * fallback (shown server-side); presence is detected in `firstUpdated()` via
 * `assignedNodes()` (DSD assigns at parse time → no `slotchange` after upgrade)
 * plus `@slotchange` for later changes. Interactivity needs the first client
 * update to flush — hence the defer-hydration poll. Shares all logic with the
 * light build via `MonoSelectCore`; both register `mono-select`, so a document
 * loads only one build.
 */
@customElement('mono-shadow-select')
export class MonoSelectShadow extends withShadowUtilityStyles(MonoSelectCore(LitElement)) {
  static {
    // Slot presence is measured after the first render creates the <slot>
    // elements, and hydration corrects the default-empty regions in a follow-up
    // update — the legitimate exception this warning describes. Dev-only.
    ;(this as typeof LitElement).disableWarning?.('change-in-update')
  }

  static override styles = [
    unsafeCSS(toShadowCss(selectCss, { host: 'mono-select', append: SHADOW_EXTRA_CSS })),
  ]

  protected override get _slotsAlwaysRender(): boolean {
    return true
  }

  override connectedCallback(): void {
    super.connectedCallback()
    // Before the first render, so the very first open already renders the <slot> — and above the
    // isServer guard, so an SSR pass emits it too rather than leaving the wrapper unprojected.
    this._onLateListSlot()

    if (isServer) return
    // Under nuxt-ssr-lit the SSR'd element can stay `hasUpdated:false` with
    // updates disabled after the wrapper removes `defer-hydration` — so its
    // handlers never bind. Force the first client update to flush by polling
    // `requestUpdate()` for a few frames; a no-op once already hydrated.
    flushSsrHydration(this)
  }

  override firstUpdated(changed: Map<string, unknown>): void {
    super.firstUpdated(changed)
    if (isServer) return
    this._scanSlots()
  }

  protected override updated(changed: Map<string, unknown>): void {
    super.updated(changed)
    if (isServer) return

    // Projection leaves the rows in the light DOM, so decorating them is the same job here as in
    // the light build — only the wrapper's whereabouts differ, which `_listSlotWrapper` settles.
    this._watchListChrome()
    this._syncListChrome()
  }

  /** A wrapper appeared after connect — the flag is all this build needs, projection does the rest. */
  protected override _onLateListSlot(): void {
    const has = !!this._lateListSlot.find()
    if (has !== this._hasListSlotState) this._setSlotState('list', has)
  }

  private _scanSlots(): void {
    for (const name of ['label', 'helper', 'prefix', 'suffix'] as SelectSlotName[]) {
      const slot = this.renderRoot.querySelector(
        `slot[name="${name}"]`,
      ) as HTMLSlotElement | null
      this._setSlotState(name, this._slotHasContent(slot))
    }

    // The list slot is measured differently, and has to be. Its <slot> lives inside the dropdown
    // AND behind the very flag this sets, so it does not exist until the flag is already on —
    // scanning for it would keep the feature switched off forever. The light child carrying
    // `slot="list"` is the honest signal, and it is readable from the moment it is appended.
    this._onLateListSlot()
  }

  private _slotHasContent(slot: HTMLSlotElement | null): boolean {
    return (
      !!slot &&
      slot
        .assignedNodes({ flatten: true })
        .some((n) => n.nodeType === Node.ELEMENT_NODE || !!(n.textContent ?? '').trim())
    )
  }

  private _onSlotChange(name: SelectSlotName, event: Event): void {
    this._setSlotState(name, this._slotHasContent(event.target as HTMLSlotElement))
  }

  /**
   * The consumer's list wrapper, PROJECTED rather than moved.
   *
   * Projection is what makes this work in a shadow root at all: slotted content stays in the light
   * DOM, so the app's own stylesheet still reaches it. Moving those nodes inside the shadow root
   * would cut them off from it — the same reason this build inlines SVGs instead of icon classes.
   */
  protected override renderListSlot(): TemplateResult {
    return html`<div class="mono-select-list-slot" mono-list-slot @click=${this._onListSlotClick}>
      <slot name="list" @slotchange=${() => this._scanSlots()}></slot>
    </div>`
  }

  /** Native `<slot>` carrying the prop fallback as native slot content. */
  protected override _slotOutlet(
    name: SelectSlotName,
    fallback: unknown = nothing,
  ): TemplateResult {
    return html`<slot
      name=${name}
      @slotchange=${(e: Event) => this._onSlotChange(name, e)}
      >${fallback}</slot
    >`
  }

  /** Inline SVG — the global `.mono-icon`/`i-mdi-*` UnoCSS icons can't reach a
   *  shadow root. */
  protected override renderIcon(name: 'close' | 'chevron'): TemplateResult {
    const path =
      name === 'close'
        ? 'M19 6.41 17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z'
        : 'M7.41 8.58 12 13.17l4.59-4.59L18 10l-6 6-6-6z'
    return html`<svg
      class="mono-icon"
      mono-icon
      viewBox="0 0 24 24"
      width="1em"
      height="1em"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d=${path}></path>
    </svg>`
  }
}

// NOTE: the `HTMLElementTagNameMap['mono-select']` augmentation is owned by the
// light build (mono-select.ts); redeclaring it here would be a TS2717 conflict.
