import { MonoChartController, MonoChartData, MonoChartOptions, MonoChartSource } from './chart-types.js';
/**
 * Create a chart controller.
 *
 * Two data modes:
 * - **field-mapped** — pass rows (an array or a devextreme DataSource) plus
 *   `labelField` / `series`; optionally bucket them with `groupBy` + per-series
 *   `agg`. Field names accept path expressions.
 * - **raw** — pass a chart.js `{ labels, datasets }` object and it is used
 *   verbatim; no mapping, no aggregation.
 *
 * @example
 * const chart = controlMonoChart(rows, {
 *   type: 'bar',
 *   groupBy: 'month',
 *   series: [{ field: 'amount', label: 'Revenue', agg: 'sum' }],
 *   props: { height: 320, legend: 'bottom' },
 * })
 * chart.subscribe(() => { /* re-render *\/ })
 *
 * @example
 * // raw passthrough
 * const chart = controlMonoChart({ labels: ['A', 'B'], datasets: [{ label: 'x', data: [1, 2] }] })
 */
/** Renamed "control" alias of {@link monoChart} (no breaking change — both work). */
export { monoChart as controlMonoChart };
export declare function monoChart<T = any>(source?: MonoChartSource<T> | T[] | MonoChartData | null, opts?: MonoChartOptions): MonoChartController<T>;
