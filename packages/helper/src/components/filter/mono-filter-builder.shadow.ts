// @unocss-include

import { isServer, LitElement, html, unsafeCSS, type TemplateResult } from 'lit'
import { customElement } from '../../composables/mono-element'

import { MonoFilterBuilderCore, type FilterIconName } from './filter-builder-core.js'
import { adoptIconStyles, toShadowCss } from '../../composables/shadow-css'
import { flushSsrHydration } from '../../composables/hydration-flush'

import filterCss from './filter.css?raw'

/**
 * Shadow-DOM `mono-filter-builder` (SSR build, `@mono-lit/helper/ui/shadow/filter`).
 * Registers the DISTINCT `mono-shadow-filter-builder` tag; the light element
 * coexists.
 *
 * `filter.css` alone is enough: this component styles its own controls rather than
 * borrowing `input.css`'s inner classes, so there is no second sheet to adopt.
 */
@customElement('mono-shadow-filter-builder')
export class MonoFilterBuilderShadow extends MonoFilterBuilderCore(LitElement) {
  static override styles = [unsafeCSS(toShadowCss(filterCss, { hostDisplay: 'block' }))]

  protected override renderIcon(name: FilterIconName): TemplateResult {
    // The SAME spans the light build renders. A page-level `i-*` class cannot
    // reach a shadow root on its own, so the generated icon rules are adopted
    // into this root below — and that sheet restates the mask that
    // `cssText` drops, which is what lets a masked glyph paint in here at all.
    if (name === 'trash') return html`<span class="mono-icon i-mdi-trash-can-outline" aria-hidden="true"></span>`
    if (name === 'plus') return html`<span class="mono-icon i-mdi-plus" aria-hidden="true"></span>`
    return html`<span class="mono-icon i-mdi-file-tree-outline" aria-hidden="true"></span>`
  }

  override connectedCallback(): void {
    super.connectedCallback()
    if (isServer) return
    adoptIconStyles(this.renderRoot as ShadowRoot)
    // Under nuxt-ssr-lit an SSR'd element can stay `hasUpdated:false` with updates
    // disabled after the wrapper removes `defer-hydration`, so its handlers never
    // bind. Flush the first client update; a no-op once already hydrated.
    flushSsrHydration(this)
  }
}

// NOTE: tag-map augmentation owned by the light build (mono-filter-builder.ts).
