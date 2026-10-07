// @unocss-include

import { isServer, LitElement, unsafeCSS } from 'lit'
import { customElement } from '../../composables/mono-element'

import { MonoTableInfoCore } from './mono-table-info-core.js'
import { toShadowCss } from '../../composables/shadow-css'

import tableCss from './table.css?raw'
import { flushSsrHydration } from '../../composables/hydration-flush'

/**
 * Shadow-DOM `mono-shadow-table-info` (the opt-in SSR build,
 * `@mono-lit/helper/ui/shadow/table`). Renders into a real shadow root so
 * `@lit-labs/ssr` can serialize it to Declarative Shadow DOM. Shares all logic
 * with the light build via `MonoTableInfoCore`. Registers the `mono-shadow-*`
 * tag — DISTINCT from the light `<mono-table-info>` — so both can coexist.
 */
@customElement('mono-shadow-table-info')
export class MonoTableInfoShadow extends MonoTableInfoCore(LitElement) {
  static override styles = [unsafeCSS(toShadowCss(tableCss, { hostDisplay: 'inline' }))]

  override connectedCallback(): void {
    super.connectedCallback()
    if (isServer) return
    // Under nuxt-ssr-lit the SSR'd element can stay `hasUpdated:false` with
    // updates disabled after the wrapper removes `defer-hydration` — its
    // handlers never bind and follow-up passes (slot scans, controller wiring)
    // never run. Flush the first client update; a no-op once already hydrated.
    flushSsrHydration(this)
  }
}

// NOTE: the `HTMLElementTagNameMap` augmentation is owned by the light build
// (mono-table-info.ts) only — redeclaring it here would be a TS2717 conflict.
