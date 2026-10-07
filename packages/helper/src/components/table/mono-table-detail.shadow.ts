// @unocss-include

import { isServer, LitElement, html, unsafeCSS, type TemplateResult } from 'lit'
import { customElement } from '../../composables/mono-element'

import { MonoTableDetailCore } from './mono-table-detail-core.js'
import { adoptIconStyles, toShadowCss } from '../../composables/shadow-css'
import { flushSsrHydration } from '../../composables/hydration-flush'

import tableCss from './table.css?raw'

/** Whether a prop still holds the value the core defaults it to. */
const DEFAULT_ICON = 'i-mdi-chevron-right'
const DEFAULT_ICON_EXPANDED = 'i-mdi-chevron-down'

/**
 * Shadow-DOM `mono-shadow-table-detail` (SSR build, `@mono-lit/helper/ui/shadow/table`).
 *
 * The toggle renders into a real shadow root, with the two chevrons inlined as SVG
 * (`mdi:chevron-right` / `mdi:chevron-down`) because a shadow root can't reach the
 * page-level icon utility CSS — the same trade the sort/search shadow builds make.
 * A consumer who sets a custom `icon` / `icon-expanded` class gets the class span
 * from the core — and the generated icon rules are adopted into this root so the
 * class actually paints, the same way `mono-table-empty` does it. Without that
 * the span is there and empty, which is what a `+` / `−` toggle looked like in
 * the shadow tab beside a light tab that showed both glyphs.
 *
 * The **panel row is light DOM by construction**: it is inserted into the
 * consumer's own `<tbody>`, outside this element's shadow root, so it is styled by
 * the global `dist/ui/index.css` in both builds. That is already true of the
 * `<table class="mono-table" mono-table>` around it, so nothing extra is asked of the
 * consumer here.
 *
 * Shares all behaviour via `MonoTableDetailCore`.
 */
@customElement('mono-shadow-table-detail')
export class MonoTableDetailShadow extends MonoTableDetailCore(LitElement) {
  static override styles = [unsafeCSS(toShadowCss(tableCss, { host: 'mono-table-detail' }))]

  override connectedCallback(): void {
    super.connectedCallback()
    if (isServer) return
    // Under nuxt-ssr-lit the SSR'd element can stay `hasUpdated:false` with
    // updates disabled after the wrapper removes `defer-hydration`, so its first
    // client update — which is what builds and attaches the panel row — never
    // runs. Flush it; a no-op once already hydrated.
    flushSsrHydration(this)
    this._maybeAdoptIcons()
  }

  protected override updated(changed: Map<string, unknown>): void {
    super.updated(changed)
    if (!isServer && (changed.has('icon') || changed.has('iconExpanded'))) {
      this._maybeAdoptIcons()
    }
  }

  /** Only when a CUSTOM class is in play — the defaults are inlined SVG. */
  private _maybeAdoptIcons(): void {
    if (isServer) return
    if (this.icon === DEFAULT_ICON && this.iconExpanded === DEFAULT_ICON_EXPANDED) return
    adoptIconStyles(this.renderRoot as ShadowRoot)
  }

  protected override _renderIcon(): TemplateResult {
    if (this.icon !== DEFAULT_ICON || this.iconExpanded !== DEFAULT_ICON_EXPANDED) {
      return super._renderIcon()
    }

    return this.open
      ? // mdi:chevron-down
        html`
          <svg
            class="mono-table-detail-caret" mono-detail-caret
            viewBox="0 0 24 24"
            fill="currentColor"
            aria-hidden="true"
          >
            <path d="M7.41 8.58L12 13.17l4.59-4.59L18 10l-6 6l-6-6z" />
          </svg>
        `
      : // mdi:chevron-right
        html`
          <svg
            class="mono-table-detail-caret" mono-detail-caret
            viewBox="0 0 24 24"
            fill="currentColor"
            aria-hidden="true"
          >
            <path d="M8.59 16.58L13.17 12L8.59 7.41L10 6l6 6l-6 6z" />
          </svg>
        `
  }
}

// NOTE: tag-map augmentation owned by the light build (mono-table-detail.ts).
