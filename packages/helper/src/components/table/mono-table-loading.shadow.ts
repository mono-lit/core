// @unocss-include

import { isServer, LitElement, unsafeCSS } from 'lit'
import { customElement } from '../../composables/mono-element'

import { MonoTableLoadingCore } from './mono-table-loading-core.js'
import { toShadowCss } from '../../composables/shadow-css'

import tableCss from './table.css?raw'
import { flushSsrHydration } from '../../composables/hydration-flush'

/**
 * Shadow-DOM `mono-shadow-table-loading` (SSR build, `@mono-lit/helper/ui/shadow/table`).
 * Renders the spinner into a real shadow root; the `host: 'mono-table-loading'`
 * rewrite turns the overlay's element-selector rules into `:host` so the shadow
 * sheet self-contains the overlay styling. The `loading` state is client-only, so
 * SSR emits an inert (hidden) host. Shares all logic via `MonoTableLoadingCore`.
 */
@customElement('mono-shadow-table-loading')
export class MonoTableLoadingShadow extends MonoTableLoadingCore(LitElement) {
  static override styles = [unsafeCSS(toShadowCss(tableCss, { host: 'mono-table-loading' }))]

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

// NOTE: tag-map augmentation owned by the light build (mono-table-loading.ts).
