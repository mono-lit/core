// @unocss-include

import { isServer, LitElement, html, unsafeCSS, type TemplateResult } from 'lit'
import { customElement } from '../../composables/mono-element'

import { MonoTableSearchCore, type TableSearchIconName } from './mono-table-search-core.js'
import { toShadowCss } from '../../composables/shadow-css'

import tableCss from './table.css?raw'
import inputCss from '../input/input.css?raw'
import { flushSsrHydration } from '../../composables/hydration-flush'

/**
 * Shadow-DOM `mono-table-search` (SSR build, `@mono-lit/helper/ui/shadow/table`).
 * The icons are inline SVG — the global `.mono-icon`/`i-mdi-*` utility CSS can't
 * reach a shadow root. Shares all other logic via `MonoTableSearchCore`.
 *
 * The element renders `mono-input`'s classes, and a shadow root can't see the
 * page stylesheet, so `input.css` is adopted alongside `table.css` — input first
 * so table rules can still override. `input.css`'s bare `mono-input { }` selector
 * simply never matches in here, which is harmless.
 */
@customElement('mono-shadow-table-search')
export class MonoTableSearchShadow extends MonoTableSearchCore(LitElement) {
  static override styles = [
    unsafeCSS(toShadowCss(inputCss)),
    unsafeCSS(toShadowCss(tableCss, { hostDisplay: 'block' })),
  ]

  protected override renderIcon(name: TableSearchIconName): TemplateResult {
    if (name === 'close') {
      return html`
        <svg viewBox="0 0 24 24" width="1.1em" height="1.1em" fill="currentColor" aria-hidden="true">
          <path
            d="M19,6.41L17.59,5L12,10.59L6.41,5L5,6.41L10.59,12L5,17.59L6.41,19L12,13.41L17.59,19L19,17.59L13.41,12L19,6.41Z"
          />
        </svg>
      `
    }
    if (name === 'chevron') {
      return html`
        <svg viewBox="0 0 24 24" width="1.1em" height="1.1em" fill="currentColor" aria-hidden="true">
          <path d="M7.41,8.58L12,13.17L16.59,8.58L18,10L12,16L6,10L7.41,8.58Z" />
        </svg>
      `
    }
    return html`
      <svg viewBox="0 0 24 24" width="1.1em" height="1.1em" fill="currentColor" aria-hidden="true">
        <path
          d="M9.5,3A6.5,6.5 0 0,1 16,9.5C16,11.11 15.41,12.59 14.44,13.73L14.71,14H15.5L20.5,19L19,20.5L14,15.5V14.71L13.73,14.44C12.59,15.41 11.11,16 9.5,16A6.5,6.5 0 0,1 3,9.5A6.5,6.5 0 0,1 9.5,3M9.5,5C7,5 5,7 5,9.5C5,12 7,14 9.5,14C12,14 14,12 14,9.5C14,7 12,5 9.5,5Z"
        />
      </svg>
    `
  }

  /** Shadow build projects the slotted filter-builder through a native `<slot>`. */
  protected override _renderFilterSlotContent(): TemplateResult {
    return html`<slot name="filter-builder" @slotchange=${this._onFilterSlotChange}></slot>`
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

// NOTE: tag-map augmentation owned by the light build (mono-table-search.ts).
