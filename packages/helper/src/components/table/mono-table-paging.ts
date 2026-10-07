// @unocss-include

import { LitElement, unsafeCSS } from 'lit'
import { customElement } from '../../composables/mono-element'

import { MonoTablePagingCore } from './mono-table-paging-core.js'

import tableCss from './table.css?raw'

/**
 * Light-DOM `mono-table-paging` (default build, `@mono-lit/helper/ui/table`).
 * All logic lives in `MonoTablePagingCore`; the shadow build shares the mixin.
 */
@customElement('mono-table-paging')
export class MonoTablePaging extends MonoTablePagingCore(LitElement) {
  static override styles = [unsafeCSS(tableCss)]

  protected override createRenderRoot(): HTMLElement {
    return this
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'mono-table-paging': MonoTablePaging
  }
}
