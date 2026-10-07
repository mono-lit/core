// @unocss-include

import { LitElement, unsafeCSS, isServer } from 'lit'
import { state } from 'lit/decorators.js'
import { customElement } from '../../composables/mono-element'

import { MonoTabsCore } from './tabs-core.js'
import { toShadowCss, withShadowUtilityStyles } from '../../composables/shadow-css'
import type { TabItem } from './tabs-types.js'

import tabsCss from './tabs.css?raw'
import { flushSsrHydration } from '../../composables/hydration-flush'

/**
 * Shadow-DOM `mono-tabs` (the opt-in SSR build, `@mono-lit/helper/ui/shadow/tabs`).
 *
 * Real shadow root + `static styles`, so `@lit-labs/ssr` serializes it to
 * Declarative Shadow DOM and styles are scoped (`mono-tabs`→`:host`). Renders the
 * whole `role="tablist"` from the `items` prop in ONE shadow root; the active tab
 * (`.on` + `aria-selected`) is server-rendered from the reflected `model-value`.
 * Per-tab icons project via native `<slot name="icon-<id>">` (default `mono-empty`
 * → hidden, corrected in `firstUpdated()` by scanning `assignedNodes()`).
 *
 * `:items.prop` is not forwarded to the server and Vue sets the property late, so
 * the defer-hydration poll withholds hydration until the client `items` count
 * matches the server-rendered tab count (avoids "shorter than expected iterable"
 * + double render); `:items="JSON.stringify(...)"` is forwarded as a string and
 * coerced, so the server renders the tabs directly. Shares all logic with the
 * light build via `MonoTabsCore`; both register `mono-tabs`, so a document loads
 * one.
 */
@customElement('mono-shadow-tabs')
export class MonoTabsShadow extends withShadowUtilityStyles(MonoTabsCore(LitElement)) {
  static {
    // Slot presence can only be measured after the first render creates the
    // <slot> elements, and hydration requires correcting the default-hidden
    // regions in a follow-up update — the legitimate exception this warning
    // describes. Dev-only suppression (no-op in production Lit).
    ;(this as typeof LitElement).disableWarning?.('change-in-update')
  }

  // A per-tab icon wrapper whose slot has no assigned content renders
  // `mono-empty` and tabs.css hides it — one rule for both builds, where this
  // used to be a shadow-only `append`. Default-hidden so the server and the
  // first client render match; real presence is detected in `firstUpdated()`.
  static override styles = [unsafeCSS(toShadowCss(tabsCss, { host: 'mono-tabs' }))]

  /** Tab ids whose `icon-<id>` slot has assigned content (detected post-hydration). */
  @state()
  private _iconIds = new Set<string>()

  /** Server-rendered tab count, captured before the first client render mutates the DSD. */
  private _ssrItemCount: number | null = null

  protected override _useIconSlots(): boolean {
    return true
  }

  protected override _iconHasContent(id: string): boolean {
    return this._iconIds.has(id)
  }

  protected override _itemsForRender(): TabItem[] {
    if (!isServer && !this.hasUpdated && this._ssrItemCount !== null) {
      return this.items.slice(0, this._ssrItemCount)
    }
    return this.items
  }

  override connectedCallback(): void {
    super.connectedCallback()
    if (isServer) return
    this._ssrItemCount = this.shadowRoot
      ? this.shadowRoot.querySelectorAll('.mono-tabs-tab').length
      : null
    // Poll `requestUpdate()` for a few frames so the first client update flushes
    // (binds `@click`, paints the active-tab toggle). Withhold hydration until the
    // client `items` count reaches what the server rendered — Vue sets `:items.prop`
    // asynchronously after connect; hydrating fewer tabs than the server markers
    // throws "shorter than expected iterable" + duplicates. (JSON.stringify path is
    // ready immediately.)
    flushSsrHydration(this, {
      gate: () =>
        this._ssrItemCount === null || (this.items?.length ?? 0) >= this._ssrItemCount,
    })
  }

  override firstUpdated(changed: Map<string, unknown>): void {
    // @ts-ignore — super may not declare firstUpdated through the generic base.
    super.firstUpdated?.(changed)
    if (isServer) return
    this._scanIconSlots()
    // The hydration render was capped at the server tab count; repaint so any
    // remaining tabs appear (normally a no-op: client count === server count).
    if (this._ssrItemCount !== null && this._ssrItemCount < (this.items?.length ?? 0)) {
      this.requestUpdate()
    }
  }

  protected override updated(changed: Map<string, unknown>): void {
    // @ts-ignore — super may not declare updated through the generic base.
    super.updated?.(changed)
    if (!isServer) this._scanIconSlots()
  }

  /** Populate `_iconIds` from the per-tab icon slots' assigned content. */
  private _scanIconSlots(): void {
    const next = new Set<string>()
    const slots = this.renderRoot.querySelectorAll('slot[name^="icon-"]')
    for (const slot of Array.from(slots)) {
      const name = (slot as HTMLSlotElement).name
      const id = name.slice('icon-'.length)
      if (!id) continue
      const has = (slot as HTMLSlotElement)
        .assignedNodes({ flatten: true })
        .some((n) => n.nodeType === Node.ELEMENT_NODE || !!(n.textContent ?? '').trim())
      if (has) next.add(id)
    }
    // Only update state when it actually changed (avoid an infinite update loop).
    if (next.size !== this._iconIds.size || [...next].some((id) => !this._iconIds.has(id))) {
      this._iconIds = next
    }
  }
}

// NOTE: the `HTMLElementTagNameMap['mono-tabs']` augmentation is owned by the
// light build (mono-tabs.ts); redeclaring it here would be a TS2717 conflict.
