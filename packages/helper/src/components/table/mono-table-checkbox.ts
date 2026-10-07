// @unocss-include

import { LitElement, unsafeCSS } from 'lit'
import { customElement } from '../../composables/mono-element'

import { MonoTableCheckboxCore } from './mono-table-checkbox-core.js'

import tableCss from './table.css?raw'

/**
 * Light-DOM `mono-table-checkbox` (default build, `@mono-lit/helper/ui/table`) — row
 * selection that knows about the grid.
 *
 * The element renders `mono-checkbox`'s classes, whose rules ship in the same
 * global `dist/ui/index.css` — so `size` / `color` / `disabled` / `label` behave
 * exactly as they do on a plain `<mono-checkbox>`, with no extra stylesheet. All
 * logic lives in `MonoTableCheckboxCore`, shared with the shadow build.
 *
 * @example
 * <thead><tr>
 *   <th><mono-table-checkbox type="all" :control-table.prop="table" key-value="Id" /></th>
 * </tr></thead>
 * <tbody>
 *   <tr v-for="row in rows" :key="row.Id" :data-row-key="row.Id">
 *     <td><mono-table-checkbox :control-table.prop="table" :item.prop="row" /></td>
 *   </tr>
 * </tbody>
 *
 * @example
 * table.check().getAll()   // [{ Id: 8 }, { Id: 12 }, … ]
 */
@customElement('mono-table-checkbox')
export class MonoTableCheckbox extends MonoTableCheckboxCore(LitElement) {
  static override styles = [unsafeCSS(tableCss)]

  protected override createRenderRoot(): HTMLElement {
    return this
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'mono-table-checkbox': MonoTableCheckbox
  }
}
