// @unocss-include

import { LitElement, unsafeCSS } from 'lit'
import { customElement } from '../../composables/mono-element'

import { MonoTableErrorCore } from './mono-table-error-core.js'

import tableCss from './table.css?raw'

/**
 * Light-DOM `mono-table-error` (default build, `@mono-lit/helper/ui/table`).
 *
 * The red bar shown under the header when a request fails:
 *
 * ```html
 * <tbody>
 *   <tr><td colspan="3"><mono-table-error :control-table.prop="table" /></td></tr>
 *   <tr v-for="…">…</tr>
 * </tbody>
 * ```
 *
 * All the logic is in `MonoTableErrorCore`. This build adds nothing but the tag
 * and the stylesheet — the close glyph is the global `i-mdi-close` utility class,
 * which is exactly what a light build can use and a shadow one cannot.
 */
@customElement('mono-table-error')
export class MonoTableError extends MonoTableErrorCore(LitElement) {
  static override styles = [unsafeCSS(tableCss)]

  protected override createRenderRoot(): HTMLElement {
    return this
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'mono-table-error': MonoTableError
  }
}
