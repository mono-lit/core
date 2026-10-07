/**
 * Server-side column aggregates: the pieces a consumer needs to answer
 * "what are the totals?" without the grid draining every row to add them up.
 *
 * ── Resolver → store → drain ──
 *
 * A registered summary covers the FULL filtered set, not the current page, so
 * something has to see every matching row. Left to itself the grid drains the
 * bound source in `take: 100` chunks — free over an array, and pathological over
 * a server-paged table, where it re-fetches through the pager exactly the rows
 * the pager exists to avoid.
 *
 * The fix is to ask the server for the totals, and there are two ways in. The
 * grid's own: ONE `$apply=filter(…)/aggregate(…)` through the bound source's
 * STORE (`utils/data-source-apply`), which rides its url, `beforeSend` and auth.
 * That needs a devextreme `ODataStore` — a CustomStore has nothing to carry the
 * clause on, and **devextreme itself has no aggregate support**: `totalSummary`,
 * `groupSummary` and `$apply` appear nowhere in it, an unknown load option is
 * dropped in silence rather than refused (a `store.load({ totalSummary })` comes
 * back as ordinary rows), and `customQueryParams` are service-operation
 * parameters — quoted as literals, and on OData v4 a FUNCTION-INVOCATION url,
 * `Entity($apply='…')` — so the clause has to go into the url (`urlOverride`),
 * which is what `loadApply` does.
 *
 * The consumer's: a resolver. It is asked FIRST and covers what the store path
 * cannot — a fetcher of the consumer's own, a custom dialect, a cached answer.
 * The library builds the clause and hands it over; the consumer performs the
 * request with whatever it already uses. Declining (`null`) falls through to the
 * store path, and that declining falls through to the drain.
 */

import { andFilters, isDataSourceLike, searchFilterOf } from './data-source-read'
import type { ReadableDataSource } from './data-source-read'
import { arrayToODataString } from '../components/filter/filter-odata'

/** Aggregate kinds a spec may ask for — mirrors `MonoSummaryType` structurally. */
export type MonoAggregateType = 'sum' | 'avg' | 'count' | 'min' | 'max' | 'countDistinct'

/** The part of a summary spec that decides what to ask for. */
export interface MonoAggregateSpec {
  field?: string
  type?: MonoAggregateType
  /** Disambiguates two aggregates on the same field; also used as the alias. */
  name?: string
}

/**
 * mono's aggregate kinds → the OData v4 aggregation keyword.
 *
 * `countDistinct` maps to `countdistinct`, which OData does define — unlike the
 * devextreme summary descriptor, which has no equivalent at all. Building the
 * clause is free; whether a given backend implements it is the consumer's
 * problem, and declining is always safe.
 */
const ODATA_AGG: Record<MonoAggregateType, string> = {
  sum: 'sum',
  avg: 'average',
  min: 'min',
  max: 'max',
  count: '$count',
  countDistinct: 'countdistinct',
}

/** A dotted path (`Job.Budget`) addresses a nav property as `Job/Budget` in OData. */
const toODataPath = (field: string): string => field.replaceAll('.', '/')

/**
 * A field a server can aggregate.
 *
 * A WILDCARD or INDEX path (`Lines.[*].Total`) is rejected: `getFieldValue`
 * resolves those by walking a collection on a loaded row, and no `$apply`
 * expression means the same thing — the nearest OData construct aggregates the
 * collection per parent rather than across all of them.
 */
export const isAggregatableField = (field: string): boolean =>
  !!field && !field.includes('[') && !field.includes('*')

/**
 * The response key each spec's value comes back under.
 *
 * Plain `field` while that field carries ONE aggregate, which is the ordinary
 * case and keeps the response readable; `field_type` once the same field has
 * two (a `sum` and an `avg` of `Price`), because an `$apply` cannot alias two
 * values to the same name. An explicit `name` always wins, and a bare `count`
 * has no field to name it after.
 */
export function summaryAliases(specs: readonly MonoAggregateSpec[]): string[] {
  const seen = new Map<string, number>()
  for (const s of specs) {
    if (!s.field) continue
    seen.set(s.field, (seen.get(s.field) ?? 0) + 1)
  }

  return specs.map((s, i) => {
    if (s.name) return s.name
    if (!s.field) return `count_${i}`
    return (seen.get(s.field) ?? 0) > 1 ? `${s.field}_${s.type ?? 'sum'}` : s.field
  })
}

/**
 * Build `aggregate(<field> with <agg> as <alias>, …)` for a set of specs.
 *
 * Returns `null` when no spec can be expressed — a caller with nothing to ask
 * for should not make a request.
 */
export function buildSummaryApply(specs: readonly MonoAggregateSpec[]): string | null {
  const aliases = summaryAliases(specs)

  const parts = specs
    .map((spec, i) => {
      const agg = ODATA_AGG[spec.type ?? 'sum']
      if (!agg) return null

      // `$count` has no operand — it counts rows.
      if (agg === '$count') return `$count as ${aliases[i]}`
      if (!spec.field || !isAggregatableField(spec.field)) return null

      return `${toODataPath(spec.field)} with ${agg} as ${aliases[i]}`
    })
    .filter((p): p is string => !!p)

  return parts.length ? `aggregate(${parts.join(',')})` : null
}

/**
 * Compose a filter with an aggregate: `filter(<expr>)/aggregate(…)`.
 *
 * The filter goes INSIDE `$apply` rather than travelling as a sibling `$filter`
 * — that is what makes the two compose, since the filter runs first and the
 * aggregation sees only matching rows.
 */
export function composeSummaryApply(apply: string, filter: unknown): string {
  const expr = arrayToODataString(filter)
  return expr ? `filter(${expr})/${apply}` : apply
}

/**
 * The predicate a summary must aggregate over — IDENTICAL to what the drain uses.
 *
 * `readAllRows` reads a DataSource as its own `filter()` AND its reconstructed
 * `searchValue`, which is a DataSource-level option the store knows nothing
 * about. Anything less here and a total would quietly count rows the user had
 * searched away, which is worse than being slow.
 */
export function summaryFilterOf(source: unknown): unknown {
  if (!isDataSourceLike(source)) return null
  const ds = source as ReadableDataSource
  return andFilters(ds.filter?.() ?? null, searchFilterOf(ds) ?? null)
}

/** Re-exported so a resolver can convert a devextreme filter itself. */
export { arrayToODataString as summaryODataFilter }
