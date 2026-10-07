// @unocss-include

import { LitElement, unsafeCSS } from 'lit'
import { customElement } from '../../composables/mono-element'

import { MonoTablePagingGroupCore } from './mono-table-paging-group-core.js'

import tableCss from './table.css?raw'

/**
 * Light-DOM `mono-table-paging-group` (default build, `@mono-lit/helper/ui/table`).
 * Paginates the rows inside a single group. All logic lives in
 * `MonoTablePagingGroupCore`; the shadow build shares the mixin.
 *
 * @example
 * <mono-table-paging-group :data-grid.prop="table" :group.prop="node" page-size="5" />
 */
@customElement('mono-table-paging-group')
export class MonoTablePagingGroup extends MonoTablePagingGroupCore(LitElement) {
  static override styles = [unsafeCSS(tableCss)]

  protected override createRenderRoot(): HTMLElement {
    return this
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'mono-table-paging-group': MonoTablePagingGroup
  }
}
