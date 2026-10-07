// @unocss-include

import { isServer, LitElement, html, unsafeCSS, type TemplateResult } from 'lit'
import { customElement } from '../../composables/mono-element'

import {
  MonoTableSortCore,
  type TableSortSlotName,
  type TableSortIconName,
} from './mono-table-sort-core.js'
import { toShadowCss } from '../../composables/shadow-css'
import { sortIndicatorSvg } from './table-sort-icons.js'

import tableCss from './table.css?raw'
import { flushSsrHydration } from '../../composables/hydration-flush'

/**
 * Shadow-DOM `mono-table-sort` (SSR build, `@mono-lit/helper/ui/shadow/table`). The
 * header label projects through a native `<slot>`; the sort indicator is a single
 * inline SVG that swaps with the direction (the global `i-*` utility CSS can't
 * reach a shadow root) — the fluent neutral glyph and the ri up/down arrows,
 * matching the light build. Shares all other logic via `MonoTableSortCore`.
 *
 * DSD inside a `<th>` parses fine — the custom element wraps the label, and the
 * projected slot content is inline flow content.
 */
@customElement('mono-shadow-table-sort')
export class MonoTableSortShadow extends MonoTableSortCore(LitElement) {
  static override styles = [unsafeCSS(toShadowCss(tableCss, { hostDisplay: 'inline-flex' }))]

  protected override renderSlot(_name: TableSortSlotName): TemplateResult {
    return html`<slot></slot>`
  }

  protected override renderIcon(_name: TableSortIconName): TemplateResult {
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

// NOTE: tag-map augmentation owned by the light build (mono-table-sort.ts).
