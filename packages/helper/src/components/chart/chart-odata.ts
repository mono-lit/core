// chart-odata.ts
//
// Server-side roll-up for the chart: turn its own `groupBy` + `series` config into
// an OData `$apply` clause, so the backend returns one row per bucket instead of
// the chart draining every row and summing them in the browser.
//
// A department-totals chart over 100k rows is ~1000 paged requests carrying every
// column, versus a single `$apply=groupby((Dept),aggregate(Budget with sum as
// Budget))` that returns a handful of rows.
//
// Kept separate from `mono-data-chart.ts` (and free of any transport) so the clause
// can be built and asserted on without a network.

import { arrayToODataString } from '../filter/filter-odata.js'
import { mergeDataSourceOptions, type MonoDataSourceOptions } from '../../utils/data-source-options.js'
import type { MonoChartAgg, MonoChartAggregateCtx, MonoChartSeries } from './chart-types.js'

/**
 * `MonoChartAgg` → the OData aggregate keyword. Every value the chart supports has
 * an exact equivalent, so the server path never has to fall back to draining.
 */
const ODATA_AGG: Record<MonoChartAgg, string> = {
  sum: 'sum',
  avg: 'average',
  min: 'min',
  max: 'max',
  count: '$count',
}

/** A dotted path (`Job.Budget`) addresses a nav property as `Job/Budget` in OData. */
const toODataPath = (field: string): string => field.replaceAll('.', '/')

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
export function buildChartApply(
  groupBy: string,
  series: readonly MonoChartSeries[] = [],
): string {
  const key = toODataPath(groupBy)

  const aggregates = series
    .filter((s) => s?.field)
    .map((s) => {
      const agg = ODATA_AGG[s.agg ?? 'sum'] ?? 'sum'
      return agg === '$count'
        ? `$count as ${s.field}`
        : `${toODataPath(s.field)} with ${agg} as ${s.field}`
    })

  return aggregates.length
    ? `groupby((${key}),aggregate(${aggregates.join(',')}))`
    : `groupby((${key}))`
}

/**
 * Compose a filter with a groupby: `filter(<expr>)/groupby(…)`.
 *
 * Filtering INSIDE `$apply` (rather than as a sibling `$filter`) is what keeps the
 * two composable — the filter runs first and the aggregation sees only matching
 * rows, which is the whole point of doing this server-side.
 */
export function composeApply(apply: string, filter: unknown): string {
  const expr = arrayToODataString(filter)
  return expr ? `filter(${expr})/${apply}` : apply
}

/** Re-exported so an `aggregate()` hook can convert a devextreme filter itself. */
export { arrayToODataString as chartODataFilter }

/** What `buildChartOdataRequest` hands to the transport. */
export interface MonoChartOdataRequest {
  /** devextreme load options for the DataSource `monoOdataFetch` builds. */
  options: Record<string, unknown>
  /** Raw query-string parameters (`$apply`, custom keys) — sent verbatim. */
  params: Record<string, unknown>
  /** Whether the rows will come back rolled up (an `$apply` was built). */
  aggregated: boolean
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
export function buildChartOdataRequest(input: {
  options?: Record<string, unknown>
  base?: MonoDataSourceOptions
  aggregate?: (ctx: MonoChartAggregateCtx) => string
  groupBy?: string
  series: readonly MonoChartSeries[]
}): MonoChartOdataRequest {
  const base = input.base ?? {}
  const merged = mergeDataSourceOptions((input.options ?? {}) as MonoDataSourceOptions, base)
  const { customQueryParams, ...rest } = merged
  const options: Record<string, unknown> = { ...rest }
  // A raw `$filter` the parser could not read arrives as a one-element string
  // array; devextreme compiles that as `(expr) eq true`, which is fine as a
  // sibling `$filter` and inside `$apply` alike — nothing to special-case.
  const params: Record<string, unknown> = { ...(customQueryParams ?? {}) }

  if (typeof input.aggregate === 'function') {
    const groupBy = input.groupBy
    if (!groupBy) {
      throw new Error('[mono-chart] `odata.aggregate` needs a `groupBy` — there is nothing to group by.')
    }
    const apply = buildChartApply(groupBy, input.series)
    const filter = options.filter
    params.$apply = input.aggregate({
      apply,
      filter,
      odataFilter: arrayToODataString,
      withFilter: (a, f) => composeApply(a, f === undefined ? filter : f),
      groupBy,
      series: [...input.series],
    })
    delete options.filter
    // devextreme otherwise attaches its default `$top=20`, which would silently
    // drop every bucket past the twentieth. Verified against a live endpoint.
    options.paginate = false
  }

  return { options, params, aggregated: params.$apply !== undefined }
}
