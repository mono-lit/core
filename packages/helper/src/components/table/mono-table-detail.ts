// @unocss-include

import { LitElement, unsafeCSS } from 'lit'
import { customElement } from '../../composables/mono-element'

import { MonoTableDetailCore } from './mono-table-detail-core.js'

import tableCss from './table.css?raw'

/**
 * Light-DOM `mono-table-detail` (default build, `@mono-lit/helper/ui/table`) — the
 * expand/collapse chevron for a table row.
 *
 * Drop it into a `<td>` of the row you want expandable; everything you slot into
 * it becomes the panel, which the element inserts as a full-width `<tr>` right
 * below that row while open. The chevron uses the global UnoCSS icon classes
 * (`i-mdi-chevron-right` → `i-mdi-chevron-down`); all other logic lives in
 * `MonoTableDetailCore`, shared with the shadow build.
 *
 * @example
 * <tr :data-row-key="row.Id">
 *   <td>
 *     <mono-table-detail :control-table.prop="table" @toggle="onToggle">
 *       <p>Notes: {{ row.Note }}</p>
 *     </mono-table-detail>
 *   </td>
 *   <td>{{ row.Name }}</td>
 * </tr>
 */
@customElement('mono-table-detail')
export class MonoTableDetail extends MonoTableDetailCore(LitElement) {
  static override styles = [unsafeCSS(tableCss)]

  protected override createRenderRoot(): HTMLElement {
    return this
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'mono-table-detail': MonoTableDetail
  }
}
