// @unocss-include

import { LitElement, html, isServer, unsafeCSS, type TemplateResult } from 'lit'
import { customElement } from '../../composables/mono-element'

import { MonoDropdownTableCore } from './dropdown-table-core.js'
import { toShadowCss, withShadowUtilityStyles } from '../../composables/shadow-css'

import dropdownTableCss from './dropdown-table.css?raw'
import { flushSsrHydration } from '../../composables/hydration-flush'

/**
 * Shadow-DOM `mono-shadow-dropdown-table` (SSR build, `@mono-lit/helper/ui/shadow/dropdown-table`).
 * The FIELD renders in a real shadow root (chips painted by the component's own sheet);
 * the panel's regions are native `<slot>`s into which the consumer's LIGHT-DOM
 * `<table>` + `mono-table-*` project — so those stay light, exactly as in the light
 * build. The popup controller auto-detects the shadow host and does NOT portal; the
 * core's `_positionPanel` places the fixed panel at the trigger. Shares all logic via
 * `MonoDropdownTableCore`.
 */
@customElement('mono-shadow-dropdown-table')
export class MonoDropdownTableShadow extends withShadowUtilityStyles(
  MonoDropdownTableCore(LitElement),
) {
  static {
    ;(this as typeof LitElement).disableWarning?.('change-in-update')
  }

  // The chips are Basecoat combobox chips painted by dropdown-table.css itself
  // (no chip.css in here any more); the slotted table is painted by the PAGE's
  // table sheet, which also carries this sheet's `mono-shadow-dropdown-table
  // [mono-table]` row rules — a shadow sheet cannot reach a slotted descendant.
  static override styles = [unsafeCSS(toShadowCss(dropdownTableCss, { host: 'mono-dropdown-table' }))]

  override connectedCallback(): void {
    super.connectedCallback()
    if (isServer) return
    // Under nuxt-ssr-lit the SSR'd element can stay `hasUpdated:false` with
    // updates disabled after the wrapper removes `defer-hydration` — its
    // handlers never bind and follow-up passes (slot scans, controller wiring)
    // never run. Flush the first client update; a no-op once already hydrated.
    flushSsrHydration(this)
  }

  private _onSlotChange = (): void => {
    this._scanRegions()
    this.requestUpdate()
  }

  override firstUpdated(changed: Map<string, unknown>): void {
    super.firstUpdated(changed)
    if (!isServer) this._scanRegions()
  }

  /** Mark a region whose `<slot>` has no assigned content `mono-empty` (light uses `:empty`). */
  private _scanRegions(): void {
    if (isServer) return
    this.renderRoot.querySelectorAll('[mono-dd-region]').forEach((region) => {
      const slot = region.querySelector('slot') as HTMLSlotElement | null
      const has =
        !!slot &&
        slot
          .assignedNodes({ flatten: true })
          .some((n) => n.nodeType === Node.ELEMENT_NODE || !!(n.textContent ?? '').trim())
      region.toggleAttribute('mono-empty', !has)
    })
  }

  /** Native `<slot>` per region (body = the default unnamed slot for the `<table>`). */
  protected override _renderRegion(cls: string, name: string): TemplateResult {
    const slot =
      name === 'body'
        ? html`<slot @slotchange=${this._onSlotChange}></slot>`
        : html`<slot name=${name} @slotchange=${this._onSlotChange}></slot>`
    return html`<div class="mono-dropdown-table-region ${cls}" mono-dd-region=${cls}>${slot}</div>`
  }
}

// NOTE: the `HTMLElementTagNameMap` augmentation is owned by the light build
// (mono-dropdown-table.ts); redeclaring it here would be a TS2717 conflict.
