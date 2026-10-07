import { LitElement, TemplateResult } from 'lit';
declare const MonoChart_base: import('../../composables/hybird-prop').Constructor<import('./chart-core.js').MonoChartCoreInterface> & typeof LitElement;
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
export declare class MonoChart extends MonoChart_base {
    static styles: import('lit').CSSResult[];
    protected createRenderRoot(): HTMLElement;
    protected render(): TemplateResult;
}
declare global {
    interface HTMLElementTagNameMap {
        'mono-chart': MonoChart;
    }
}
export {};
