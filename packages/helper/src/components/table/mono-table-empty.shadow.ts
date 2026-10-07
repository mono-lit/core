// @unocss-include

import { html, isServer, LitElement, unsafeCSS, type TemplateResult } from 'lit'
import { customElement } from '../../composables/mono-element'

import { MonoTableEmptyCore } from './mono-table-empty-core.js'
import { adoptIconStyles, toShadowCss } from '../../composables/shadow-css'
import { flushSsrHydration } from '../../composables/hydration-flush'
import { isIconifyClass } from '../../composables/icon.js'

import tableCss from './table.css?raw'

/**
 * Shadow-DOM `mono-shadow-table-empty` (SSR build, `@mono-lit/helper/ui/shadow/table`).
 *
 * Renders the message into a real shadow root; the `host: 'mono-table-empty'`
 * rewrite turns the overlay's element-selector rules into `:host` so the shadow
 * sheet self-contains its styling. Emptiness is client-only state, so SSR emits an
 * inert (hidden) host. Shares all logic via `MonoTableEmptyCore`.
 *
 * Two things this build has to do differently:
 *
 * - **`slot="body"` is a native `<slot>`**, not a captured region, and its
 *   presence is read from `assignedNodes()` (DSD assigns at parse time, so
 *   `slotchange` does not fire on upgrade — `firstUpdated` has to look once).
 * - **An `i-*` icon class cannot paint here.** UnoCSS generates those as a mask
 *   on the PAGE stylesheet, which does not cross the shadow boundary, so the
 *   span would render as a blank box. `adoptIconStyles` copies the page's
 *   generated icon rules into a sheet this root adopts. An emoji or plain-text
 *   icon needs none of that — it is just text — which is exactly why the core's
 *   two-shape branch exists.
 */
@customElement('mono-shadow-table-empty')
export class MonoTableEmptyShadow extends MonoTableEmptyCore(LitElement) {
  static override styles = [unsafeCSS(toShadowCss(tableCss, { host: 'mono-table-empty' }))]

  static {
    // Reading slot assignment after the first render is a legitimate `@state`
    // write inside an update — the same allowance every shadow build with slots
    // makes.
    ;(this as unknown as typeof LitElement).disableWarning?.('change-in-update')
  }

  override connectedCallback(): void {
    super.connectedCallback()
    if (isServer) return
    // Under nuxt-ssr-lit the SSR'd element can stay `hasUpdated:false` with
    // updates disabled after the wrapper removes `defer-hydration` — its handlers
    // never bind and follow-up passes never run. Flush the first client update;
    // a no-op once already hydrated.
    flushSsrHydration(this)
  }

  protected override firstUpdated(changed: Map<string, unknown>): void {
    super.firstUpdated?.(changed)
    if (isServer) return
    // Declarative Shadow DOM assigns nodes at parse time, so `slotchange` has
    // already fired (or never will) by the time this element upgrades.
    this._syncBodySlot()
  }

  protected override updated(changed: Map<string, unknown>): void {
    super.updated(changed)
    if (!isServer && changed.has('icon')) this._maybeAdoptIcons()
  }

  private _maybeAdoptIcons(): void {
    if (isIconifyClass(this.icon)) adoptIconStyles(this.renderRoot as ShadowRoot)
  }

  private _syncBodySlot(): void {
    const slot = this.renderRoot.querySelector('slot[name="body"]') as HTMLSlotElement | null
    this._hasBodySlot =
      !!slot &&
      slot
        .assignedNodes({ flatten: true })
        .some((n) => n.nodeType === Node.ELEMENT_NODE || !!(n.textContent ?? '').trim())
  }

  /**
   * The body region as a real `<slot>`.
   *
   * `data-empty` collapses it while the props are in play rather than dropping it
   * — a `<slot>` that is not in the tree has no assigned nodes, so removing it
   * would make `_syncBodySlot` permanently report "no body" and the override
   * could never turn on.
   */
  protected override _renderBodySlot(): TemplateResult {
    return html`<div class="mono-table-empty-body" mono-empty-body ?data-empty=${!this._hasBodySlot}>
      <slot name="body" @slotchange=${() => this._syncBodySlot()}></slot>
    </div>`
  }
}

// NOTE: tag-map augmentation owned by the light build (mono-table-empty.ts).
