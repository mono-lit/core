// @unocss-include

import { LitElement, unsafeCSS, isServer } from 'lit'
import { customElement } from '../../composables/mono-element'

import { MonoBreadcrumbCore } from './breadcrumb-core.js'
import { toShadowCss, withShadowUtilityStyles } from '../../composables/shadow-css'
import { isIconifyClass } from './breadcrumb-utils.js'
import type { BreadcrumbItem } from './breadcrumb-types.js'

import breadcrumbCss from './breadcrumb.css?raw'
import { flushSsrHydration } from '../../composables/hydration-flush'

/**
 * Shadow-DOM `mono-breadcrumb` (SSR build, `@mono-lit/helper/ui/shadow/breadcrumb`).
 *
 * Real shadow root + `static styles`, so `@lit-labs/ssr` serializes it to
 * Declarative Shadow DOM. Renders the WHOLE breadcrumb list from the `items`
 * prop inside this single shadow root — so every breadcrumb CSS rule applies and
 * the current crumb is server-rendered. The declarative `<mono-breadcrumb-list>`
 * composition is a light-only feature (SSR consumers drive it via `items`).
 *
 * Icons: `i-…` utility classes can't resolve inside a shadow root, so each item's
 * icon is rendered as a native `<slot name="icon-<id>">` (see `renderBreadcrumbIcon`
 * + `iconSlot`), and this element creates the matching LIGHT-DOM
 * `<span slot="icon-<id>" class="i-…">` children itself in `updated()`. Those light
 * spans are styled by the page's GLOBAL UnoCSS, so real glyphs paint client-side
 * after hydration (empty on the server → the empty `<slot>` matches → no mismatch).
 * A user-provided `<… slot="icon-<id>">` light child projects through the same slot.
 *
 * Shares all logic with the light build via `MonoBreadcrumbCore`. Both register
 * `mono-breadcrumb`, so a document loads only one build.
 */
@customElement('mono-shadow-breadcrumb')
export class MonoBreadcrumbShadow extends withShadowUtilityStyles(MonoBreadcrumbCore(LitElement)) {
  static override styles = [
    unsafeCSS(toShadowCss(breadcrumbCss, { host: 'mono-breadcrumb', hostDisplay: 'block' })),
  ]

  /**
   * Number of crumbs the SERVER actually rendered into the SSR'd shadow root,
   * captured at `connectedCallback` before hydration replaces the DOM. `null`
   * when there's no SSR'd shadow root (pure client render).
   *
   * @lit-labs/ssr does NOT forward `.prop` array bindings to the server, so for
   * `:items.prop="arr"` the server renders 0 crumbs while the client `items` has
   * N. Gating the first (hydration) render on this count makes the client's
   * first render match the server exactly → no "shorter than expected iterable"
   * and no double render. `:items="JSON.stringify(arr)"` forwards the string, so
   * the server renders N and this is N → unchanged.
   */
  private _ssrItemCount: number | null = null

  protected override _useIconSlots(): boolean {
    return true
  }

  /**
   * Cap the HYDRATION render at exactly the server-rendered crumb count so the
   * client's first render reproduces the SSR'd DOM structure. After hydration
   * (`hasUpdated`) render the full list. Safety net for the rare case where the
   * client `items` ends up longer than what the server emitted. On the server,
   * always render the real `items`.
   */
  protected override _itemsForRender(): BreadcrumbItem[] {
    if (!isServer && !this.hasUpdated && this._ssrItemCount !== null) {
      return this.items.slice(0, this._ssrItemCount)
    }
    return this.items
  }

  override connectedCallback(): void {
    super.connectedCallback()
    if (isServer) return
    // Capture the server-rendered crumb count from the SSR'd Declarative Shadow
    // DOM BEFORE the first client render mutates it. Used by `_itemsForRender`
    // and to gate hydration below.
    this._ssrItemCount = this.shadowRoot
      ? this.shadowRoot.querySelectorAll('.mono-breadcrumb-item').length
      : null
    // Under nuxt-ssr-lit the SSR'd element can stay `hasUpdated:false` with
    // updates disabled after the wrapper removes `defer-hydration` — poll
    // `requestUpdate()` for a few frames to flush the first client update (same
    // remedy mono-menu/mono-accordion use; no-op once already hydrated).
    //
    // CRITICAL for `:items.prop`: Vue assigns the `items` PROPERTY asynchronously
    // AFTER connect, whereas the server already rendered N crumbs from that same
    // prop. If we trigger hydration before Vue sets the prop, the client renders
    // 0 crumbs against N server markers → "Unhandled shorter than expected
    // iterable" + a duplicate render. So withhold hydration until the client
    // `items` count has caught up to what the server rendered. (The JSON path
    // sets `items` synchronously from the attribute, so it's ready immediately.)
    flushSsrHydration(this, {
      gate: () =>
        this._ssrItemCount === null || (this.items?.length ?? 0) >= this._ssrItemCount,
    })
  }

  protected override firstUpdated(changed: Map<string, unknown>): void {
    super.firstUpdated?.(changed)
    if (isServer) return
    this._syncLightIcons()
    // The hydration render was capped at the server's crumb count (see
    // `_itemsForRender`). Now that hydration is done (`hasUpdated` is true),
    // request one more render so any remaining crumbs paint. Normally a no-op
    // (client count === server count); only matters if the client ended up with
    // more crumbs than the server rendered.
    if (this._ssrItemCount !== null && this._ssrItemCount < (this.items?.length ?? 0)) {
      this.requestUpdate()
    }
  }

  protected override updated(changed: Map<string, unknown>): void {
    super.updated?.(changed)
    // Run every render (idempotent reconcile) — gating on `changed.has('items')`
    // proved unreliable under nuxt-ssr-lit's hydration/property-set ordering.
    if (!isServer) this._syncLightIcons()
  }

  /**
   * Register the consumer's own `slot="icon-<id>"` light children.
   *
   * `renderBreadcrumbIcon` only emits the wrapper (and therefore the `<slot>`) when
   * the item has an `icon` OR `getSlotIconNodes(id)` reports something. That map is
   * filled by the LIGHT build's capture pass, which never runs here — so a
   * user-slotted `<svg slot="icon-home">` produced no wrapper, no slot, and no icon
   * at all. Register them before render so the slot exists for them to project into.
   *
   * Must run in `willUpdate`, not `updated`: by `updated` the render that needed the
   * information has already happened.
   */
  protected override willUpdate(changed: Map<string, unknown>): void {
    if (!isServer) this._captureUserIconSlots()
    super.willUpdate?.(changed)
  }

  private _captureUserIconSlots(): void {
    for (const el of Array.from(this.querySelectorAll(':scope > [slot^="icon-"]'))) {
      // Skip the spans `_syncLightIcons` creates for `item.icon` — those already
      // render through the iconify branch and must not masquerade as a user slot.
      if ((el as HTMLElement).dataset.monoIconSlot !== undefined) continue

      const id = (el.getAttribute('slot') ?? '').slice('icon-'.length)
      if (!id) continue

      const known = this._slotIcons.get(id)
      if (known?.includes(el)) continue
      this._slotIcons.set(id, [...(known ?? []), el])
    }
  }

  /**
   * Reconcile LIGHT-DOM icon spans (this element's own children) with `items`.
   * Each becomes a `<span slot="icon-<id>" class="mono-breadcrumb-iconify i-…">`
   * that projects into the shadow `<slot name="icon-<id>">` and is styled by the
   * page's global UnoCSS. Client-only; icons paint at hydration.
   */
  private _syncLightIcons(): void {
    const wanted = new Map<string, string>()
    for (const item of this.items ?? []) {
      if (item.icon && isIconifyClass(item.icon)) wanted.set(item.id, item.icon)
    }

    const existing = new Map<string, HTMLElement>()
    for (const el of Array.from(
      this.querySelectorAll(':scope > [data-mono-icon-slot]'),
    )) {
      existing.set((el as HTMLElement).dataset.monoIconSlot || '', el as HTMLElement)
    }

    // Remove stale, update changed.
    for (const [id, el] of existing) {
      const icon = wanted.get(id)
      if (icon === undefined) {
        el.remove()
      } else {
        el.className = `mono-breadcrumb-iconify ${icon}`
        el.setAttribute('mono-glyph', '')
        wanted.delete(id)
      }
    }

    // Add new.
    for (const [id, icon] of wanted) {
      const span = document.createElement('span')
      span.dataset.monoIconSlot = id
      span.setAttribute('slot', `icon-${id}`)
      span.setAttribute('aria-hidden', 'true')
      span.className = `mono-breadcrumb-iconify ${icon}`
      span.setAttribute('mono-glyph', '')
      this.appendChild(span)
    }
  }
}

// NOTE: the `HTMLElementTagNameMap['mono-breadcrumb']` augmentation is owned by
// the light build (mono-breadcrumb.ts); redeclaring it here would be a TS2717.
