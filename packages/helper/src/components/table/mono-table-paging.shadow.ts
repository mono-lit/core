// @unocss-include

import { isServer, LitElement, unsafeCSS } from 'lit'
import { customElement } from '../../composables/mono-element'

import { MonoTablePagingCore } from './mono-table-paging-core.js'
import { adoptIconStyles, toShadowCss } from '../../composables/shadow-css'

import tableCss from './table.css?raw'
import { flushSsrHydration } from '../../composables/hydration-flush'

/**
 * Shadow-DOM `mono-table-paging` (SSR build, `@mono-lit/helper/ui/shadow/table`).
 * Shares all logic with the light build via `MonoTablePagingCore`.
 */
@customElement('mono-shadow-table-paging')
export class MonoTablePagingShadow extends MonoTablePagingCore(LitElement) {
  static override styles = [unsafeCSS(toShadowCss(tableCss, { hostDisplay: 'inline-flex' }))]

  override connectedCallback(): void {
    super.connectedCallback()
    // a consumer `icon` class on the prev/next buttons needs the generated
    // icon rules inside this root to paint at all
    if (!isServer) adoptIconStyles(this.renderRoot as ShadowRoot)
    if (isServer) return
    // Under nuxt-ssr-lit the SSR'd element can stay `hasUpdated:false` with
    // updates disabled after the wrapper removes `defer-hydration` — its
    // handlers never bind and follow-up passes (slot scans, controller wiring)
    // never run. Flush the first client update; a no-op once already hydrated.
    flushSsrHydration(this)
  }
}

// NOTE: no `_renderIcon` override here, unlike `mono-table-detail.shadow.ts`. The core
// already inlines its SVG for both builds, precisely so neither one depends on the
// consumer's icon tooling — see the note there.

// NOTE: tag-map augmentation owned by the light build (mono-table-paging.ts).
