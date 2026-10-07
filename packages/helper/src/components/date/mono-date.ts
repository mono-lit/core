// @unocss-include

import { LitElement, unsafeCSS } from 'lit'
import { customElement } from '../../composables/mono-element'

import { MonoDateCore } from './date-core.js'

import dateCss from './date.css?raw'

/**
 * Light-DOM `mono-date` (default build, `@mono-lit/helper/ui/date`).
 *
 * `createRenderRoot()` returns `this`, so it renders into light DOM and inherits
 * the page's global stylesheet (`dist/ui/index.css`, which includes flatpickr's
 * base + the `.mono-flatpickr` calendar theme). All render-mode-agnostic logic —
 * props, hybrid aliases, flatpickr lifecycle, render — is shared with the shadow
 * build (`@mono-lit/helper/ui/shadow/date`) via `MonoDateCore`; both register
 * `mono-date`, so a document loads one.
 */
@customElement('mono-date')
export class MonoDate extends MonoDateCore(LitElement) {
  static override styles = [unsafeCSS(dateCss)] // inert in light DOM; kept for parity

  protected override createRenderRoot(): HTMLElement {
    return this
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'mono-date': MonoDate
  }
}
