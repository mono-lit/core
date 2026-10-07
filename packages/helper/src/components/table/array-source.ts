import type { MonoGridSource } from './mono-data-grid'
import { flattenLeaves } from './grouping'
import { getFieldValue, isPath, mergePatch } from '../../search/field-path'
import { mergeSearchFields, type MonoSearchValue } from '../../search/data-search'

export interface MonoArraySourceOptions {
  /** Rows per page (default 10). */
  pageSize?: number
  /** Row key field for per-row `update` (default `'Id'`). */
  keyExpr?: string
  /**
   * Columns matched by `setSearch`, as an array or a comma-separated string.
   *
   * Same four interchangeable names as {@link monoDataGrid} — `searchValue`,
   * `search-value`, `searchExpr`, `search-expr` — so a demo or app can spell it
   * one way throughout. Plain column names and path expressions only: `*`
   * patterns and `{ field, custom }` entries are resolved by the CONTROLLER, and
   * it hands this source only `plainSearchColumns(...)`.
   */
  searchValue?: MonoSearchValue
  'search-value'?: MonoSearchValue
  /** Alias of {@link searchValue}, under devextreme's name. */
  searchExpr?: MonoSearchValue
  'search-expr'?: MonoSearchValue
  /**
   * Group-by field(s). When set, a grouped input payload (devextreme
   * `type:'data'` shape) is flattened to its leaf records, so paging / search /
   * sort all run over the underlying rows; {@link monoDataGrid} rebuilds the
   * group tree per page.
   */
  group?: string | string[]
}

/** Normalise a possibly-grouped input array to flat leaf rows when grouping. */
function normalizeInput<T>(data: T[], group?: string | string[]): T[] {
  const hasGroup = Array.isArray(group) ? group.length > 0 : !!group
  return hasGroup ? flattenLeaves<T>(data) : [...data]
}

/**
 * Wrap a plain array in the structural {@link MonoGridSource} shape so
 * {@link monoDataGrid} can drive it with no devextreme DataSource — paging,
 * search and filtering all run client-side, in memory.
 *
 * @example
 * const source = monoArraySource(rows, { pageSize: 10, searchValue: ['name'] })
 * const table = monoDataGrid(source)
 * await table.load()
 * // later: source.setData(nextRows)  // swap the underlying array
 */
export function monoArraySource<T = any>(
  data: T[] = [],
  opts: MonoArraySourceOptions = {},
): MonoGridSource<T> & {
  setData: (next: T[]) => Promise<T[]>
  update: (key: unknown, values: Record<string, unknown>) => Promise<T[]>
} {
  const handlers: Record<string, Array<(...args: unknown[]) => void>> = {
    changed: [],
    loadingChanged: [],
    loadError: [],
  }

  let all: T[] = normalizeInput(data, opts.group)
  let pageIndex = 0
  let pageSize = opts.pageSize ?? 10
  let paginate = true
  let search: string | null = null
  // Only plain column names reach the matcher — the controller resolves patterns
  // and custom entries itself, so anything non-string here is dropped.
  let searchExpr: string | string[] | null =
    mergeSearchFields(opts)?.filter((e): e is string => typeof e === 'string') ?? null
  let searchOperation = 'contains'
  let filter: ((row: T, index: number) => boolean) | null = null
  let sortList: Array<{ selector: string; desc: boolean }> = []
  let page: T[] = []

  const emit = (event: string, arg?: unknown): void =>
    (handlers[event] ?? []).slice().forEach((h) => h(arg))

  /** Normalise a single devextreme sort entry into `{ selector, desc }`. */
  function normalizeSortEntry(value: unknown): { selector: string; desc: boolean } | null {
    if (!value) return null
    if (typeof value === 'string') return { selector: value, desc: false }
    const o = value as { selector?: string; desc?: boolean }
    return o.selector ? { selector: o.selector, desc: !!o.desc } : null
  }

  /** Normalise the devextreme sort forms into an ordered multi-key list. */
  function normalizeSortList(value: unknown): Array<{ selector: string; desc: boolean }> {
    const arr = Array.isArray(value) ? value : value == null ? [] : [value]
    return arr.map(normalizeSortEntry).filter((e): e is { selector: string; desc: boolean } => !!e)
  }

  /** Read a sort/compare value; a wildcard path sorts best-effort by its first match. */
  function sortValue(row: T, selector: string): unknown {
    if (!isPath(selector)) return (row as Record<string, unknown>)[selector]
    const v = getFieldValue(row, selector)
    return Array.isArray(v) ? v[0] : v
  }

  /** Compare two rows by one selector (numeric when both sides parse). */
  function compareBy(a: T, b: T, selector: string, desc: boolean): number {
    const av = sortValue(a, selector)
    const bv = sortValue(b, selector)
    const dir = desc ? -1 : 1
    if (av == null && bv == null) return 0
    if (av == null) return -dir
    if (bv == null) return dir
    const an = Number(av)
    const bn = Number(bv)
    const numeric = !Number.isNaN(an) && !Number.isNaN(bn)
    const cmp = numeric ? an - bn : String(av).localeCompare(String(bv))
    return cmp === 0 ? 0 : (cmp < 0 ? -1 : 1) * dir
  }

  /** Apply filter + search + sort, returning the matching rows. */
  function applied(): T[] {
    let rows = all
    if (typeof filter === 'function') rows = rows.filter(filter)
    const cols = searchExpr == null ? [] : Array.isArray(searchExpr) ? searchExpr : [searchExpr]
    // An EMPTY column list means "nothing configured to match on" — keep every
    // row rather than filtering them all away. `monoDataGrid` hands this source
    // `plainSearchColumns(...)`, which is `[]` whenever no `searchValue` was set,
    // and an empty array is truthy — so without this a search on an unconfigured
    // grid silently emptied the table. Same "no opinion" rule the controller's own
    // `searchPredicate()` uses.
    if (search && cols.length) {
      const needle = String(search).toLowerCase()
      const matches = (row: T, c: string): boolean => {
        // A path field may resolve to a scalar or (wildcard) an array — match if ANY.
        const raw = isPath(c) ? getFieldValue(row, c) : (row as Record<string, unknown>)[c]
        const vals = Array.isArray(raw) ? raw : [raw]
        return vals.some((v) => String(v ?? '').toLowerCase().includes(needle))
      }
      rows = rows.filter((row) => cols.some((c) => matches(row, c)))
    }
    if (sortList.length) {
      rows = [...rows].sort((a, b) => {
        for (const { selector, desc } of sortList) {
          const cmp = compareBy(a, b, selector, desc)
          if (cmp !== 0) return cmp
        }
        return 0
      })
    }
    return rows
  }

  const source: MonoGridSource<T> & {
    setData: (next: T[]) => Promise<T[]>
    update: (key: unknown, values: Record<string, unknown>) => Promise<T[]>
  } = {
    on: (event, handler) => void (handlers[event] ??= []).push(handler),
    off: (event, handler) => {
      handlers[event] = (handlers[event] ?? []).filter((h) => h !== handler)
    },

    items: () => page,
    /** Full backing array (unfiltered) — lets the grid derive header-filter values. */
    data: () => [...all],
    isLoading: () => false,
    totalCount: () => applied().length,
    isLastPage: () => (pageIndex + 1) * pageSize >= applied().length,

    paginate: (value) => (value === undefined ? paginate : (paginate = value)),
    pageSize: (value) => (value === undefined ? pageSize : (pageSize = value)),
    pageIndex: (value) => (value === undefined ? pageIndex : (pageIndex = value)),

    searchValue: (value) =>
      value === undefined ? search : (search = (value as string) || null),
    searchExpr: (value) =>
      value === undefined ? searchExpr : (searchExpr = (value as string | string[]) ?? null),
    searchOperation: (op) => (op === undefined ? searchOperation : (searchOperation = op)),
    filter: (value) =>
      value === undefined
        ? filter
        : (filter = typeof value === 'function' ? (value as (row: T, i: number) => boolean) : null),
    sort: (value) => (value === undefined ? sortList : (sortList = normalizeSortList(value))),

    load: () => {
      emit('loadingChanged', true)
      const rows = applied()
      const start = pageIndex * pageSize
      page = paginate ? rows.slice(start, start + pageSize) : rows.slice()
      emit('changed')
      emit('loadingChanged', false)
      return Promise.resolve(page)
    },
    reload: () => source.load(),

    /** Replace the backing array and reload from page 0. */
    setData: (next) => {
      all = normalizeInput(next, opts.group)
      pageIndex = 0
      return Promise.resolve(source.load())
    },

    /**
     * Merge `values` into the row whose `keyExpr` field equals `key`, then reload
     * — the per-row write path used by `monoDataGrid.saveChanges()` for an
     * array-backed table (correct across pages, unlike a whole-array `setData`).
     */
    update: (key, values) => {
      const keyExpr = opts.keyExpr ?? 'Id'
      const idx = all.findIndex(
        (row) => String((row as Record<string, unknown>)?.[keyExpr]) === String(key),
      )
      if (idx >= 0) all[idx] = mergePatch(all[idx], values as Record<string, unknown>)
      return Promise.resolve(source.load())
    },
  }

  return source
}
