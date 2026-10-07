// @unocss-include

import { html, isServer, LitElement, unsafeCSS, type TemplateResult } from 'lit'
import { customElement } from '../../composables/mono-element'

import { MonoTableErrorCore } from './mono-table-error-core.js'
import { toShadowCss } from '../../composables/shadow-css'
import { flushSsrHydration } from '../../composables/hydration-flush'

import tableCss from './table.css?raw'

/**
 * Shadow-DOM `mono-shadow-table-error` (SSR build, `@mono-lit/helper/ui/shadow/table`).
 *
 * Renders the bar into a real shadow root; the `host: 'mono-table-error'` rewrite
 * turns the element-selector rules into `:host` so the shadow sheet self-contains
 * its styling. A load error is client-only state, so SSR emits an inert host.
 * Shares all logic via `MonoTableErrorCore`.
 */
@customElement('mono-shadow-table-error')
export class MonoTableErrorShadow extends MonoTableErrorCore(LitElement) {
  static override styles = [unsafeCSS(toShadowCss(tableCss, { host: 'mono-table-error' }))]

  override connectedCallback(): void {
    super.connectedCallback()
    if (isServer) return
    // Under nuxt-ssr-lit the SSR'd element can stay `hasUpdated:false` with
    // updates disabled after the wrapper removes `defer-hydration` — its handlers
    // never bind and follow-up passes never run. Flush the first client update;
    // a no-op once already hydrated.
    flushSsrHydration(this)
  }

  /**
   * Inline SVG — the global `.mono-icon` / `i-mdi-close` UnoCSS rule cannot reach
   * a shadow root, so the class the light build uses would paint a blank box
   * here. Same glyph, same split as `mono-modal` / `mono-drawer`.
   */
  protected override renderIcon(name: 'close' | 'refresh'): TemplateResult {
    if (name === 'refresh') {
      return html`<svg
        class="mono-icon"
        viewBox="0 0 24 24"
        width="1em"
        height="1em"
        fill="currentColor"
        aria-hidden="true"
      >
        <path
          d="M17.65 6.35A8 8 0 1 0 19.73 14h-2.08A6 6 0 1 1 12 6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z"
        ></path>
      </svg>`
    }
    return html`<svg
      class="mono-icon"
      viewBox="0 0 24 24"
      width="1em"
      height="1em"
      fill="currentColor"
      aria-hidden="true"
    >
      <path
        d="M19 6.41 17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"
      ></path>
    </svg>`
  }
}

// NOTE: tag-map augmentation owned by the light build (mono-table-error.ts).
