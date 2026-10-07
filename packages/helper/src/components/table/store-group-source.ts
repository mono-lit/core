import type {
  MonoGridSource,
  MonoServerGroupSource,
  MonoGroupMeta,
  MonoServerGroupCtx,
} from './mono-data-grid.js'
import { searchFilterOf } from '../../utils/data-source-read.js'
import { joinFilters } from '../../search/filter-eval.js'

type SummaryType = 'sum' | 'avg' | 'min' | 'max' | 'count'

export interface StoreGroupSourceConfig {
  /** The single field to group by. */
  groupField: string
  /** Columns to fetch for a group's rows (omit = all). */
  select?: string[]
  /** Columns matched by search. */
  searchExpr?: string | string[]
  /** Search operation (default `'contains'`). */
  searchOperation?: string
  /** Per-group aggregates, e.g. `{ TotalBudget: 'sum' }`. */
  groupSummary?: Record<string, SummaryType>
}

/**
 * Build a {@link MonoServerGroupSource} that drives **server-side** group paging
 * straight from a devextreme `DataSource`'s store — no extra fetcher, no custom
 * callbacks. `loadGroups` issues one cheap grouped query (group keys + counts +
 * optional summaries, no rows); `loadRows` fetches a single group's page with
 * `$filter` + `$skip`/`$top`. Returns `null` if the source has no usable store
 * (e.g. a plain in-memory array), so the caller can fall back to client grouping.
 */
export function storeGroupSource<T = any>(
  source: MonoGridSource<T>,
  config: StoreGroupSourceConfig,
): MonoServerGroupSource<T> | null {
  const store = source.store?.()
  if (!store || typeof store.load !== 'function') return null

  const { groupField, select, searchExpr, searchOperation, groupSummary } = config
  const summaryDesc = groupSummary
    ? Object.entries(groupSummary).map(([selector, summaryType]) => ({ selector, summaryType }))
    : undefined

  /**
   * Build a devextreme filter expression for the active search (or undefined).
   * Delegates to the shared builder, which takes the search state off a source;
   * here the search arrives per-call via `ctx`, so a minimal stand-in carries it.
   */
  function searchFilter(search: string | null): unknown {
    if (!search || !searchExpr) return undefined
    return searchFilterOf({
      load: () => [],
      items: () => [],
      searchValue: () => search,
      searchExpr: () => searchExpr,
      searchOperation: () => searchOperation ?? 'contains',
    })
  }

  /** devextreme `store.load` returns either an array or `{ data, … }`. */
  const rows = (res: unknown): any[] =>
    Array.isArray(res) ? res : ((res as { data?: any[] })?.data ?? [])

  return {
    async loadGroups(ctx: MonoServerGroupCtx): Promise<MonoGroupMeta[]> {
      // The grid's base (its options, whatever the consumer set on the source,
      // the explicit and column filters) comes in as `ctx.filter`. It has to be
      // AND-ed here explicitly: this talks to the STORE, and the DataSource's own
      // filter never reaches a `store.load()`. The search is folded from
      // `ctx.search`, so it is deliberately not part of `ctx.filter`.
      const filter = joinFilters([ctx.filter, searchFilter(ctx.search)], 'and')
      const res = await store.load({
        group: [{ selector: groupField, isExpanded: false }],
        ...(summaryDesc ? { groupSummary: summaryDesc } : {}),
        requireGroupCount: true,
        ...(filter ? { filter } : {}),
        sort: ctx.sort ?? [{ selector: groupField }],
        ...(ctx.loadOptions ?? {}),
      })
      return rows(res).map((g: any) => ({
        key: g.key,
        count: Number(g.count ?? (Array.isArray(g.items) ? g.items.length : 0)) || 0,
        aggregates:
          summaryDesc && Array.isArray(g.summary)
            ? Object.fromEntries(summaryDesc.map((s, i) => [s.selector, Number(g.summary[i]) || 0]))
            : undefined,
      }))
    },

    async loadRows(key, ctx) {
      const groupFilter = [groupField, '=', key] as unknown
      const rowSelect = select ?? ctx.select
      const res = await store.load({
        filter: joinFilters([groupFilter, ctx.filter, searchFilter(ctx.search)], 'and'),
        ...(rowSelect ? { select: rowSelect } : {}),
        ...(ctx.sort ? { sort: ctx.sort } : {}),
        skip: ctx.skip,
        take: ctx.take,
        requireTotalCount: false,
        ...(ctx.loadOptions ?? {}),
      })
      return rows(res) as T[]
    },
  }
}
