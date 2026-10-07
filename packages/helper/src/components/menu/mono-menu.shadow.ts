// @unocss-include

import { LitElement, html, unsafeCSS, isServer, type TemplateResult } from 'lit'
import { customElement } from '../../composables/mono-element'

import { MonoMenuCore } from './menu-core.js'
import { toShadowCss, withShadowUtilityStyles } from '../../composables/shadow-css'
import { isIconifyClass } from './menu-utils.js'
import type { MenuItem } from './menu-types.js'

import menuCss from './menu.css?raw'
import { flushSsrHydration } from '../../composables/hydration-flush'

/**
 * Shadow-DOM `mono-menu` (SSR build, `@mono-lit/helper/ui/shadow/menu`).
 *
 * Real shadow root + `static styles`, so `@lit-labs/ssr` serializes it to
 * Declarative Shadow DOM. Renders the WHOLE tree (items + nested groups) from
 * the `items` prop inside this single shadow root — so every menu CSS rule
 * applies, and the active item is server-rendered from the reflected
 * `model-value`.
 *
 * Icons: `i-mdi-…` utility classes can't resolve inside a shadow root, so each
 * item's icon is rendered as a native `<slot name="icon-<id>">` (see
 * `renderMenuIcon` + `iconSlot`), and this element creates the matching
 * LIGHT-DOM `<span slot="icon-<id>" class="i-…">` children itself in `updated()`.
 * Those light spans are styled by the page's GLOBAL UnoCSS (exactly like
 * `mono-input`'s slotted prefix icon), so the real glyphs paint — client-side,
 * after hydration (empty on the server). The group chevron is inline SVG.
 *
 * Shares all logic with the light build via `MonoMenuCore`. Both register
 * `mono-menu`, so a document loads only one build.
 */
@customElement('mono-shadow-menu')
export class MonoMenuShadow extends withShadowUtilityStyles(MonoMenuCore(LitElement)) {
  static override styles = [unsafeCSS(toShadowCss(menuCss, { host: 'mono-menu' }))]

  protected override _useIconSlots(): boolean {
    return true
  }

  /** Inline mdi-chevron-right — the UnoCSS icon class can't resolve in shadow. */
  protected override _chevronSvg(): TemplateResult {
    return html`<svg
      viewBox="0 0 24 24"
      width="1em"
      height="1em"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M8.59,16.59L13.17,12L8.59,7.41L10,6L16,12L10,18L8.59,16.59Z"></path>
    </svg>`
  }

  override connectedCallback(): void {
    super.connectedCallback()
    if (isServer) return
    // When nested inside another shadow component's slot (e.g. <mono-sidebar>),
    // nuxt-ssr-lit's hydration trigger (LitWrapper removing `defer-hydration`)
    // does NOT kick off this element's first update — it stays `hasUpdated:false`
    // with updates disabled, so it's non-interactive with no icons. Once the
    // wrapper has removed `defer-hydration` (re-)enabling updates, a
    // `requestUpdate()` flushes the first render. We don't know exactly when that
    // happens, so poll for a few frames until it takes.
    flushSsrHydration(this)
  }

  protected override firstUpdated(changed: Map<string, unknown>): void {
    super.firstUpdated?.(changed)
    if (!isServer) this._syncLightIcons()
  }

  protected override updated(changed: Map<string, unknown>): void {
    super.updated?.(changed)
    // Run every render (idempotent reconcile) — gating on `changed.has('items')`
    // proved unreliable under nuxt-ssr-lit's hydration/property-set ordering.
    if (!isServer) this._syncLightIcons()
  }

  /**
   * Reconcile LIGHT-DOM icon spans (this element's own children) with the items
   * tree. Each becomes a `<span slot="icon-<id>" class="mono-menu-iconify i-…">`
   * that projects into the shadow `<slot name="icon-<id>">` and is styled by the
   * page's global UnoCSS. Client-only — the server has no DOM, so icons paint at
   * hydration (the empty `<slot>` matches the server render → no mismatch).
   */
  private _syncLightIcons(): void {
    const wanted = new Map<string, string>()
    const walk = (list: MenuItem[] | undefined): void => {
      for (const item of list ?? []) {
        if (item.icon && isIconifyClass(item.icon)) wanted.set(item.id, item.icon)
        walk(item.items)
      }
    }
    walk(this.items)

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
        el.className = `mono-menu-iconify ${icon}`
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
      span.setAttribute('mono-glyph', '')
      span.className = `mono-menu-iconify ${icon}`
      this.appendChild(span)
    }
  }
}

// NOTE: the `HTMLElementTagNameMap['mono-menu']` augmentation is owned by the
// light build (mono-menu.ts); redeclaring it here would be a TS2717 conflict.
