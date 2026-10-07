// @unocss-include

import { LitElement, unsafeCSS, isServer } from 'lit'
import { customElement } from '../../composables/mono-element'

import { MonoBreadcrumbListCore } from './breadcrumb-list-core.js'
import { toShadowCss, withShadowUtilityStyles } from '../../composables/shadow-css'
import { isIconifyClass } from './breadcrumb-utils.js'
import type { BreadcrumbItem } from './breadcrumb-types.js'

import breadcrumbCss from './breadcrumb.css?raw'
import { flushSsrHydration } from '../../composables/hydration-flush'

/**
 * Shadow-DOM `mono-breadcrumb-list` (SSR build, `@mono-lit/helper/ui/shadow/breadcrumb`).
 *
 * Real shadow root + `static styles`, so `@lit-labs/ssr` serializes it to
 * Declarative Shadow DOM. Renders the STANDALONE breadcrumb nav (from `items`,
 * a single `item`, or direct single-row props) inside one shadow root. The
 * child-of-`<mono-breadcrumb>` composition is a light-only feature (cross-element
 * `closest()` can't work under SSR), so this build is standalone only.
 *
 * Icons: `i-…` utility classes can't resolve inside a shadow root, so each item's
 * icon renders as a native `<slot name="icon-<id>">` (see `iconSlot`), and this
 * element creates the matching LIGHT-DOM `<span slot="icon-<id>" class="i-…">`
 * children itself (client-only; empty on the server → the empty `<slot>` matches).
 *
 * Shares all standalone logic with the light build via `MonoBreadcrumbListCore`.
 * Both register `mono-breadcrumb-list`, so a document loads only one build.
 */
@customElement('mono-shadow-breadcrumb-list')
export class MonoBreadcrumbListShadow extends withShadowUtilityStyles(MonoBreadcrumbListCore(LitElement)) {
  static override styles = [
    unsafeCSS(
      toShadowCss(breadcrumbCss, {
        host: 'mono-breadcrumb-list',
        hostDisplay: 'block',
      }),
    ),
  ]

  /**
   * Number of crumbs the SERVER rendered into the SSR'd shadow root, captured at
   * `connectedCallback` before hydration. `null` when there's no SSR'd shadow
   * root (pure client render). See `mono-breadcrumb.shadow.ts` for the full
   * rationale — `:items.prop` is forwarded to the server but Vue sets the client
   * property late, so we must gate hydration on the EFFECTIVE item count.
   */
  private _ssrItemCount: number | null = null

  protected override _useIconSlots(): boolean {
    return true
  }

  /**
   * Cap the HYDRATION render at exactly the server-rendered crumb count so the
   * client's first render reproduces the SSR'd DOM structure; full list after.
   */
  protected override _itemsForRender(): BreadcrumbItem[] {
    const effective = this._getEffectiveItems()
    if (!isServer && !this.hasUpdated && this._ssrItemCount !== null) {
      return effective.slice(0, this._ssrItemCount)
    }
    return effective
  }

  override connectedCallback(): void {
    super.connectedCallback()
    if (isServer) return
    // Capture the server-rendered crumb count from the SSR'd Declarative Shadow
    // DOM BEFORE the first client render mutates it.
    this._ssrItemCount = this.shadowRoot
      ? this.shadowRoot.querySelectorAll('.mono-breadcrumb-item').length
      : null
    // Poll `requestUpdate()` for a few frames to flush the first client update
    // under nuxt-ssr-lit. CRITICAL for `:items.prop`: Vue assigns the items
    // PROPERTY asynchronously AFTER connect, while the server already rendered N
    // crumbs from that prop. Withhold hydration until the client's EFFECTIVE item
    // count (which also covers single-row direct-prop mode, where `items` stays
    // empty) has caught up to what the server rendered — else the client renders
    // fewer crumbs than the server markers → "Unhandled shorter than expected
    // iterable" + a duplicate render.
    flushSsrHydration(this, {
      gate: () =>
        this._ssrItemCount === null ||
        this._getEffectiveItems().length >= this._ssrItemCount,
    })
  }

  protected override firstUpdated(changed: Map<string, unknown>): void {
    // @ts-ignore — super may not declare firstUpdated through the generic base.
    super.firstUpdated?.(changed)
    if (isServer) return
    this._syncLightIcons()
    // The hydration render was capped at the server's crumb count. Now that
    // hydration is done, repaint so any remaining crumbs appear (normally a
    // no-op: client count === server count).
    const effectiveLen = this._getEffectiveItems().length
    if (this._ssrItemCount !== null && this._ssrItemCount < effectiveLen) {
      this.requestUpdate()
    }
  }

  protected override updated(changed: Map<string, unknown>): void {
    // @ts-ignore — super may not declare updated through the generic base.
    super.updated?.(changed)
    // Idempotent reconcile every render (gating on `changed` proved unreliable
    // under nuxt-ssr-lit's hydration/property-set ordering).
    if (!isServer) this._syncLightIcons()
  }

  /**
   * Reconcile LIGHT-DOM icon spans (this element's own children) with the
   * effective items. Each becomes a `<span slot="icon-<id>" class="i-…">` that
   * projects into the shadow `<slot name="icon-<id>">`, styled by the page's
   * global UnoCSS. Client-only; icons paint at hydration.
   */
  private _syncLightIcons(): void {
    const wanted = new Map<string, string>()
    for (const item of this._getEffectiveItems()) {
      if (item.icon && isIconifyClass(item.icon)) wanted.set(item.id, item.icon)
    }

    const existing = new Map<string, HTMLElement>()
    for (const el of Array.from(
      this.querySelectorAll(':scope > [data-mono-icon-slot]'),
    )) {
      existing.set(
        (el as HTMLElement).dataset.monoIconSlot || '',
        el as HTMLElement,
      )
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

// NOTE: the `HTMLElementTagNameMap['mono-breadcrumb-list']` augmentation is owned
// by the light build (mono-breadcrumb-list.ts); redeclaring it here is a TS2717.
