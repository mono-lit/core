import { arrayToODataString } from '../filter/filter-odata.js';
import { MonoDataSourceOptions } from '../../utils/data-source-options.js';
import { MonoChartAggregateCtx, MonoChartSeries } from './chart-types.js';
/**
 * Build `groupby((<groupBy>),aggregate(<field> with <agg> as <field>, …))`.
 *
 * Each aggregate is aliased back to **its own series field**, which is what lets
 * the result flow through the chart's existing projection untouched: one row per
 * bucket, and re-aggregating a single value is the identity. No special-casing
 * downstream, and a client-side roll-up and a server-side one render identically.
 *
 * `count` has no operand, so it emits `$count as <field>`.
 */
export declare function buildChartApply(groupBy: string, series?: readonly MonoChartSeries[]): string;
/**
 * Compose a filter with a groupby: `filter(<expr>)/groupby(…)`.
 *
 * Filtering INSIDE `$apply` (rather than as a sibling `$filter`) is what keeps the
 * two composable — the filter runs first and the aggregation sees only matching
 * rows, which is the whole point of doing this server-side.
 */
export declare function composeApply(apply: string, filter: unknown): string;
/** Re-exported so an `aggregate()` hook can convert a devextreme filter itself. */
export { arrayToODataString as chartODataFilter };
/** What `buildChartOdataRequest` hands to the transport. */
export interface MonoChartOdataRequest {
    /** devextreme load options for the DataSource `monoOdataFetch` builds. */
    options: Record<string, unknown>;
    /** Raw query-string parameters (`$apply`, custom keys) — sent verbatim. */
    params: Record<string, unknown>;
    /** Whether the rows will come back rolled up (an `$apply` was built). */
    aggregated: boolean;
}
/**
 * Compose the request an `odata` chart sends — pure, so the merge of
 * `odata.options` with the controller's base (`dataSourceOptions` /
 * `odataOptions`) and the `$apply` folding can be asserted without a network.
 *
 * The base's `filter` is AND-ed under `odata.options.filter`; its `select` /
 * `expand` / `sort` / `paginate` become load options; its `customQueryParams`
 * become raw params beside `$apply`. On the `$apply` path the composed filter
 * travels INSIDE the clause (that is what keeps it composable with the grouping)
 * and is removed from the load options so it is not also sent as a sibling
 * `$filter`; `paginate` is forced off so every bucket comes back.
 */
export declare function buildChartOdataRequest(input: {
    options?: Record<string, unknown>;
    base?: MonoDataSourceOptions;
    aggregate?: (ctx: MonoChartAggregateCtx) => string;
    groupBy?: string;
    series: readonly MonoChartSeries[];
}): MonoChartOdataRequest;
