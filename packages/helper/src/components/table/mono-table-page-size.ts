// @unocss-include

import { LitElement, unsafeCSS } from 'lit'
import { customElement } from '../../composables/mono-element'

import { MonoTablePageSizeCore } from './mono-table-page-size-core.js'

import tableCss from './table.css?raw'

/**
 * Light-DOM `mono-table-page-size` (default build, `@mono-lit/helper/ui/table`).
 * All logic lives in `MonoTablePageSizeCore`; the shadow build shares the mixin.
 */
@customElement('mono-table-page-size')
export class MonoTablePageSize extends MonoTablePageSizeCore(LitElement) {
  static override styles = [unsafeCSS(tableCss)]

  protected override createRenderRoot(): HTMLElement {
    return this
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'mono-table-page-size': MonoTablePageSize
  }
}
