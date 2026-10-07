// @unocss-include

import { isServer, LitElement, html, unsafeCSS, type TemplateResult } from 'lit'
import { customElement } from '../../composables/mono-element'

import {
  MonoTableThCore,
  type TableThSlotName,
  type TableThIconName,
} from './mono-table-th-core.js'
import { toShadowCss } from '../../composables/shadow-css'
import { sortIndicatorSvg } from './table-sort-icons.js'
import { filterIndicatorSvg } from './table-filter-icons.js'

import tableCss from './table.css?raw'
import { flushSsrHydration } from '../../composables/hydration-flush'

/**
 * Shadow-DOM `mono-table-th` (SSR build, `@mono-lit/helper/ui/shadow/table`). The
 * header label projects through a native `<slot>`; the sort indicator and the
 * header-filter funnel are single inline SVGs that swap with their state (the
 * global `i-*` utility CSS can't reach a shadow root) — the fluent neutral glyph
 * and the ri up/down arrows, and the mdi outlined/filled funnels, matching the
 * light build's `i-fluent-*` / `i-ri-*` / `i-mdi-filter*` icons. Shares all other
 * logic via `MonoTableThCore`.
 */
@customElement('mono-shadow-table-th')
export class MonoTableThShadow extends MonoTableThCore(LitElement) {
  static override styles = [unsafeCSS(toShadowCss(tableCss, { hostDisplay: 'inline-flex' }))]

  protected override renderSlot(_name: TableThSlotName): TemplateResult {
    return html`<slot></slot>`
  }

  protected override renderIcon(name: TableThIconName): TemplateResult {
    if (name === 'funnel') return filterIndicatorSvg(this._filtered)
    return sortIndicatorSvg(this._current)
  }

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

// NOTE: tag-map augmentation owned by the light build (mono-table-th.ts).
