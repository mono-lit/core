// @unocss-include

import { isServer, LitElement, html, unsafeCSS, type TemplateResult } from 'lit'
import { customElement } from '../../composables/mono-element'

import { MonoTableCheckboxCore } from './mono-table-checkbox-core.js'
import { toShadowCss } from '../../composables/shadow-css'
import { flushSsrHydration } from '../../composables/hydration-flush'

import tableCss from './table.css?raw'
import checkboxCss from '../checkbox/checkbox.css?raw'

/**
 * Shadow-DOM `mono-shadow-table-checkbox` (SSR build, `@mono-lit/helper/ui/shadow/table`).
 *
 * The element renders `mono-checkbox`'s classes, and a shadow root can't see the
 * page stylesheet, so `checkbox.css` is adopted alongside `table.css` — checkbox
 * first so table rules can still override. `checkbox.css`'s bare
 * `mono-checkbox { }` selector simply never matches in here, which is harmless.
 * (Same arrangement `mono-table-search.shadow` uses for `input.css`.)
 *
 * The selection is client-only, so SSR emits an unchecked shell. All logic is
 * shared via `MonoTableCheckboxCore`.
 */
@customElement('mono-shadow-table-checkbox')
export class MonoTableCheckboxShadow extends MonoTableCheckboxCore(LitElement) {
  static override styles = [
    unsafeCSS(toShadowCss(checkboxCss)),
    unsafeCSS(toShadowCss(tableCss)),
  ]

  override connectedCallback(): void {
    super.connectedCallback()
    if (isServer) return
    // Under nuxt-ssr-lit the SSR'd element can stay `hasUpdated:false` with
    // updates disabled after the wrapper removes `defer-hydration`, so its
    // controller wiring would never run. Flush the first client update; a no-op
    // once already hydrated.
    flushSsrHydration(this)
  }

  /**
   * `mdi:loading` inlined — a shadow root can't reach the page's `i-mdi-*`
   * utility CSS, so the light build's icon class would render nothing here.
   * `fill="currentColor"` keeps it on the box's own icon colour, and the spin
   * comes from the adopted `checkbox.css` (`[mono-spinner]`), like the box itself.
   */
  protected override _renderLoadingIcon(): TemplateResult {
    return html`
      <svg
        class="mono-table-checkbox-spinner"
        mono-spinner
        viewBox="0 0 24 24"
        fill="currentColor"
        aria-hidden="true"
      >
        <path d="M12 4V2A10 10 0 0 0 2 12h2a8 8 0 0 1 8-8" />
      </svg>
    `
  }
}

// NOTE: tag-map augmentation owned by the light build (mono-table-checkbox.ts).
