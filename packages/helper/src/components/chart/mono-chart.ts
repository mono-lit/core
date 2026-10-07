// @unocss-include

import { LitElement, unsafeCSS, type TemplateResult } from 'lit'
import { customElement } from '../../composables/mono-element'

import { MonoChartCore } from './chart-core.js'
import chartCss from './chart.css?raw'

/**
 * `<mono-chart>` — a Chart.js canvas, light DOM.
 *
 * Bind a controller and let it project the data, or hand it a raw chart.js
 * `data` object. `chart.js` is an OPTIONAL peer, loaded on first render.
 *
 * @example
 * ```vue
 * <script setup>
 * import '@mono-lit/helper/ui/chart'
 * import { monoChart } from '@mono-lit/helper'
 * const chart = monoChart(rows, { groupBy: 'month', series: [{ field: 'amount' }] })
 * </script>
 *
 * <mono-chart :data-chart.prop="chart" type="bar" height="320" />
 * ```
 */
@customElement('mono-chart')
export class MonoChart extends MonoChartCore(LitElement) {
  static override styles = [unsafeCSS(chartCss)]

  protected override createRenderRoot(): HTMLElement {
    return this
  }

  protected override render(): TemplateResult {
    return this.renderChart()
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'mono-chart': MonoChart
  }
}
