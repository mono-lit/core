// @unocss-include

import { isServer, LitElement, unsafeCSS } from 'lit'
import { customElement } from '../../composables/mono-element'

import { MonoTablePagingGroupCore } from './mono-table-paging-group-core.js'
import { toShadowCss } from '../../composables/shadow-css'

import tableCss from './table.css?raw'
import { flushSsrHydration } from '../../composables/hydration-flush'

/**
 * Shadow-DOM `mono-table-paging-group` (SSR build, `@mono-lit/helper/ui/shadow/table`).
 * Shares all logic with the light build via `MonoTablePagingGroupCore`. Renders
 * `nothing` server-side (no controller), so its host SSRs empty and only
 * materializes after hydration binds the controller + group.
 */
@customElement('mono-shadow-table-paging-group')
export class MonoTablePagingGroupShadow extends MonoTablePagingGroupCore(LitElement) {
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

// NOTE: tag-map augmentation owned by the light build (mono-table-paging-group.ts).
