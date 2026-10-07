// @unocss-include

import { LitElement, html, isServer, unsafeCSS, type TemplateResult } from 'lit'
import { customElement } from '../../composables/mono-element'

import { MonoSidebarCore, type SidebarSlotName } from './sidebar-core.js'
import { toShadowCss, withShadowUtilityStyles } from '../../composables/shadow-css'
import { flushSsrHydration } from '../../composables/hydration-flush'

import sidebarCss from './sidebar.css?raw'

/**
 * Shadow-DOM `mono-sidebar` (SSR build, `@mono-lit/helper/ui/shadow/sidebar`).
 *
 * Real shadow root + `static styles` (the `:host`-adapted sheet), so
 * `@lit-labs/ssr` serializes it to Declarative Shadow DOM. Slotting uses native
 * `<slot>`; the chevron icon is inline SVG (the global `.mono-icon`/`i-mdi-*`
 * UnoCSS icon can't reach a shadow root).
 *
 * Caveat: sidebar CSS that targets slotted `<mono-menu>` descendants (the
 * rail-collapse-to-icons rules) cannot reach into slotted light-DOM content from
 * a shadow root — those rules are inert here. The core covers that path instead
 * by publishing `data-rail-collapsed` on the host, which `<mono-menu>` mirrors
 * via MutationObserver (see `menu-core.ts` `_setupRailSync`).
 *
 * Shares all logic with the light build via `MonoSidebarCore`. Both register
 * `mono-sidebar`, so a document loads only one build.
 */
@customElement('mono-shadow-sidebar')
export class MonoSidebarShadow extends withShadowUtilityStyles(MonoSidebarCore(LitElement)) {
  static override styles = [unsafeCSS(toShadowCss(sidebarCss, { host: 'mono-sidebar' }))]

  override connectedCallback(): void {
    super.connectedCallback()
    if (isServer) return
    // Load-bearing beyond interactivity here: the server always renders DESKTOP
    // assumptions (no `matchMedia` → `mode="rail"`, `expand-on-hover`), so an
    // element frozen at `hasUpdated:false` leaves a mobile viewport with a
    // visible rail that CSS still widens on hover, while the JS-driven label
    // restore is gated on the now-false `expandOnHover` prop → icons, no text.
    flushSsrHydration(this)
  }

  protected override renderSlot(name: SidebarSlotName): TemplateResult {
    if (name === 'header') return html`<slot name="header"></slot>`
    if (name === 'footer') return html`<slot name="footer"></slot>`
    // body accepts both `slot="body"` and unslotted content (matches the light
    // build's capture, which treats both as body).
    return html`<slot name="body"></slot><slot></slot>`
  }

  protected override renderIcon(_name: 'chevron'): TemplateResult {
    // Inline SVG (mdi chevron-right) — global icon CSS can't reach a shadow root.
    return html`
      <svg viewBox="0 0 24 24" width="1.1em" height="1.1em" fill="currentColor" aria-hidden="true">
        <path d="M8.59,16.59L13.17,12L8.59,7.41L10,6L16,12L10,18L8.59,16.59Z" />
      </svg>
    `
  }
}

// NOTE: the `HTMLElementTagNameMap['mono-sidebar']` augmentation is owned by the
// light build (mono-sidebar.ts); redeclaring it here would be a TS2717 conflict.
