// @unocss-include

import { LitElement, unsafeCSS } from 'lit'
import { customElement } from '../../composables/mono-element'

import { MonoTableSummaryCore } from './mono-table-summary-core.js'

import tableCss from './table.css?raw'

/**
 * Light-DOM `mono-table-summary` (default build, `@mono-lit/helper/ui/table`). An
 * aggregate footer cell — drop it into a `<tfoot>` cell in the column you want
 * summarized and bind the controller with `:data-grid.prop`. The aggregate is
 * configured centrally in `monoDataGrid(data, { summary: [...] })`; this element
 * only names which one to show. Add `mono-table-sticky-foot` to the `<table>` to
 * keep the footer pinned while the body scrolls.
 *
 * Renders into the host (`createRenderRoot`→`this`, styled by the global
 * `dist/ui/index.css`). All logic lives in `MonoTableSummaryCore`; the shadow
 * build shares the mixin. Both register the same tag, so a document loads one.
 */
@customElement('mono-table-summary')
export class MonoTableSummary extends MonoTableSummaryCore(LitElement) {
  static override styles = [unsafeCSS(tableCss)]

  protected override createRenderRoot(): HTMLElement {
    return this
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'mono-table-summary': MonoTableSummary
  }
}
