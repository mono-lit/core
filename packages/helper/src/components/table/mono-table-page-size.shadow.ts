// @unocss-include

import { isServer, LitElement, unsafeCSS } from 'lit'
import { customElement } from '../../composables/mono-element'

import { MonoTablePageSizeCore } from './mono-table-page-size-core.js'
import { toShadowCss } from '../../composables/shadow-css'

import tableCss from './table.css?raw'
import { flushSsrHydration } from '../../composables/hydration-flush'

/**
 * Shadow-DOM `mono-table-page-size` (SSR build, `@mono-lit/helper/ui/shadow/table`).
 * Shares all logic with the light build via `MonoTablePageSizeCore`.
 */
@customElement('mono-shadow-table-page-size')
export class MonoTablePageSizeShadow extends MonoTablePageSizeCore(LitElement) {
  static override styles = [unsafeCSS(toShadowCss(tableCss, { hostDisplay: 'inline-flex' }))]

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

// NOTE: tag-map augmentation owned by the light build (mono-table-page-size.ts).
