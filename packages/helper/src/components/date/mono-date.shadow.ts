// @unocss-include

import { LitElement, html, isServer, unsafeCSS, type TemplateResult } from 'lit'
import { customElement } from '../../composables/mono-element'

import { MonoDateCore } from './date-core.js'
import { toShadowCss } from '../../composables/shadow-css'

import dateCss from './date.css?raw'
import { flushSsrHydration } from '../../composables/hydration-flush'

// flatpickr's base + `.mono-flatpickr` calendar rules aren't needed in the shadow
// root: the calendar renders into <body> and is styled by the global bundle. Also,
// the leading `@import 'flatpickr/dist/flatpickr.css'` is invalid inside a
// constructed/adopted stylesheet, so strip it before scoping. The regex matches
// only a real `@import` at-rule (whitespace + quoted specifier) — NOT a loose
// `@import…;` span, which would also swallow the preceding comment that mentions
// "@imported from…" (deleting its closing `*/`) and runaway-comment out the whole
// `.mono-date` variable block.
const SHADOW_DATE_CSS = dateCss.replace(/@import\s+['"][^'"]+['"][^;]*;/g, '')

/**
 * Shadow-DOM `mono-date` (the opt-in SSR build, `@mono-lit/helper/ui/shadow/date`).
 *
 * Real shadow root + `static styles`, so `@lit-labs/ssr` serializes it to
 * Declarative Shadow DOM and styles are scoped (`mono-date`→`:host`). The field
 * (label / input / message) renders server-side; flatpickr's calendar is created
 * on the client after hydration (it lives in <body>, styled by the global
 * bundle). Interactivity needs the first client update to flush (so flatpickr
 * inits and `@input` binds) — hence the defer-hydration poll. Shares all logic
 * with the light build via `MonoDateCore`; both register `mono-date`, so a
 * document loads one.
 */
@customElement('mono-shadow-date')
export class MonoDateShadow extends MonoDateCore(LitElement) {
  static {
    // The `_hasValue` state flips after flatpickr inits in the first client
    // update — the legitimate exception this dev-only warning describes.
    ;(this as typeof LitElement).disableWarning?.('change-in-update')
  }

  static override styles = [unsafeCSS(toShadowCss(SHADOW_DATE_CSS, { host: 'mono-date' }))]

  override connectedCallback(): void {
    super.connectedCallback()
    if (isServer) return
    // Under nuxt-ssr-lit the SSR'd element can stay `hasUpdated:false` with
    // updates disabled after the wrapper removes `defer-hydration` — so flatpickr
    // never inits and handlers never bind. Force the first client update to flush
    // by polling `requestUpdate()` for a few frames; a no-op once hydrated.
    flushSsrHydration(this)
  }

  /**
   * Inline SVG — the global `.mono-icon`/`i-mdi-*` UnoCSS icons can't reach a
   * shadow root (the mask rule never applies, so an `i-mdi-*` span renders as a
   * solid "black cube"). The `.mono-icon` class is still applied so the existing
   * `.mono-date-icon > .mono-icon` / `.mono-date-clear > .mono-icon` sizing rules
   * take effect; `fill="currentColor"` follows the `--date-muted` icon color.
   *
   * The paths are the exact `mdi:calendar-outline` / `mdi:clock-outline` /
   * `mdi:close` glyph bodies (same MDI set the light build resolves via
   * `i-mdi-*`), so the shadow icons match the light-DOM date pixel-for-pixel.
   */
  protected override renderIcon(name: 'calendar' | 'clock' | 'close'): TemplateResult {
    const path =
      name === 'calendar'
        ? 'M12 12h5v5h-5zm7-9h-1V1h-2v2H8V1H6v2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2m0 2v2H5V5zM5 19V9h14v10z'
        : name === 'clock'
          ? 'M12 20a8 8 0 0 0 8-8a8 8 0 0 0-8-8a8 8 0 0 0-8 8a8 8 0 0 0 8 8m0-18a10 10 0 0 1 10 10a10 10 0 0 1-10 10C6.47 22 2 17.5 2 12A10 10 0 0 1 12 2m.5 5v5.25l4.5 2.67l-.75 1.23L11 13V7z'
          : 'M19 6.41L17.59 5L12 10.59L6.41 5L5 6.41L10.59 12L5 17.59L6.41 19L12 13.41L17.59 19L19 17.59L13.41 12z'
    return html`<svg
      class="mono-icon"
      mono-icon
      viewBox="0 0 24 24"
      width="1em"
      height="1em"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d=${path}></path>
    </svg>`
  }
}

// NOTE: the `HTMLElementTagNameMap['mono-date']` augmentation is owned by the
// light build (mono-date.ts); redeclaring it here would be a TS2717 conflict.
