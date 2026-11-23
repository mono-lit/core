/**
 * Draining a devextreme DataSource (or store) to a flat array.
 *
 * The single place that knows how to read *everything* out of a source, shared
 * by `monoDataGrid.getData()` and the report engine's `data` resolver. Kept
 * duck-typed and dependency-free — @mono-lit/helper never imports devextreme, and a
 * real DataSource satisfies these shapes structurally.
 *
 * The hard part isn't the loop, it's reading a source **without disturbing it**:
 * the same DataSource is usually bound to a live grid, so paging state must
 * either be left alone (the store path) or restored exactly (the array path).
 */

import { toODataClause } from '../search/field-path'
import { andFilters } from '../search/filter-eval'
import { unwrapReactive } from '../composables/reactive'

import { flattenLeaves } from '../components/table/grouping'

/** The structural surface of a devextreme DataSource this module touches. */
export interface ReadableDataSource<T = any> {
  load(): PromiseLike<T[]> | T[]
  items(): T[]
  store?(): ReadableStore | undefined
  filter?(value?: unknown): unknown
  /** The source's own `$select`, inherited by a drain unless overridden. */
  select?(value?: unknown): unknown
  sort?(value?: unknown): unknown
  searchValue?(value?: unknown): unknown
  searchExpr?(value?: unknown): unknown
  searchOperation?(value?: string): string
  paginate?(value?: boolean): boolean
  pageIndex?(value?: number): number
  totalCount?(): number
  /**
   * devextreme's live `_storeLoadOptions`. Where `expand` / `customQueryParams` live — they
   * have no accessor of their own, and the DataSource spreads them into every store request.
   */
  loadOptions?(): Record<string, unknown> | null | undefined
}

/**
 * Store-level load options a DataSource sends on every request that have no accessor and are not
 * composed by the drain itself (filter / search / sort / select are). Whitelisted, not copied
 * wholesale: `_storeLoadOptions` also carries `group`, paging and total-count state, which would
 * turn a flat chunked read into something else.
 */
const INHERITED_LOAD_OPTIONS = ['expand', 'customQueryParams'] as const

/** The {@link INHERITED_LOAD_OPTIONS} the source currently carries. */
function inheritedLoadOptionsOf(source: ReadableDataSource): Record<string, unknown> {
  const lo = typeof source.loadOptions === 'function' ? source.loadOptions() : null
  const out: Record<string, unknown> = {}
  if (!lo || typeof lo !== 'object') return out
  for (const k of INHERITED_LOAD_OPTIONS) if (lo[k] !== undefined && lo[k] !== null) out[k] = lo[k]
  return out
}

/** The structural surface of a devextreme store. */
export interface ReadableStore {
  load(options?: unknown): PromiseLike<unknown> | unknown
  key?(): unknown
  byKey?(key: unknown): unknown
  /** OData protocol version (a devextreme `ODataStore`); absent on a CustomStore. */
  version?(): number
}

export interface ReadAllRowsOptions {
  /**
   * Rows per request (default `100`). The total is unknowable up front for a
   * remote source, so the read walks in fixed chunks until one comes back short.
   */
  chunkSize?: number
  /** Restrict the columns fetched (remote sources only). */
  select?: string[]
  /** Sort override. Defaults to whatever the source itself carries. */
  sort?: unknown
  /**
   * An extra filter AND-ed onto the source's own (and its search) — a controller's
   * base, which is not written on the source when the read goes to the STORE.
   * Remote sources only; an array source is filtered by what it holds.
   */
  filter?: unknown
  /**
   * Extra load options spread into every chunk request (`expand`, `customQueryParams`, …).
   * A DataSource's own `expand` / `customQueryParams` are inherited automatically; keys given
   * here override them.
   */
  loadOptions?: Record<string, unknown>
  /**
   * Ask for the total count with the FIRST chunk (`requireTotalCount` → OData
   * `$count=true`), then fetch the remaining chunks — known up front — in parallel
   * (at most {@link COUNT_FIRST_PARALLEL} in flight), assembled in order. A store
   * that reports no count falls back to the "stop at the first short chunk" walk.
   * Store reads only; an array source has nothing to count.
   */
  countFirst?: boolean
}

/** Chunks in flight at once on a `countFirst` drain. */
export const COUNT_FIRST_PARALLEL = 4

/** Stop runaway loops if a backend keeps returning full chunks forever. */
const MAX_SKIP = 1e7

/**
 * Unwrap Vue reactivity. A `ref(dataSource)` renders as nothing (the template
 * sees the wrapper, not the source), and a *reactive proxy* around a DataSource
 * can break its internals — devextreme stores identity-sensitive state that
 * doesn't survive being proxied.
 *
 * Re-exported (not redefined) from `composables/reactive` so the components that
 * need the same unwrap for value identity share one implementation.
 */
export { unwrapReactive }

/** A devextreme DataSource: it both loads and holds a current page. */
export function isDataSourceLike(value: unknown): value is ReadableDataSource {
  const v = value as any
  return !!v && typeof v === 'object' && typeof v.load === 'function' && typeof v.items === 'function'
}

/** A bare store (ODataStore / CustomStore / ArrayStore) — loads, but has no page. */
export function isStoreLike(value: unknown): value is ReadableStore {
  const v = value as any
  return (
    !!v &&
    typeof v === 'object' &&
    typeof v.load === 'function' &&
    typeof v.items !== 'function' &&
    (typeof v.key === 'function' || typeof v.byKey === 'function')
  )
}

/** Anything this module can drain into an array. */
export function isReadableSource(value: unknown): boolean {
  return isDataSourceLike(value) || isStoreLike(value)
}

/** devextreme `store.load` resolves to either an array or `{ data, … }`. */
function rowsOf(res: unknown): any[] {
  return Array.isArray(res) ? res : ((res as { data?: any[] })?.data ?? [])
}

/**
 * Build a devextreme filter expression for a DataSource's **active search**.
 *
 * This is the subtle one. `searchValue` / `searchExpr` are DataSource-level
 * options: the DataSource folds them into the request it sends to its store.
 * Reading the store directly bypasses them entirely — so an export would
 * silently include rows the user filtered away with `<mono-table-search>`.
 * Reconstructing the filter here keeps the store path faithful to the grid.
 */
export function searchFilterOf(source: ReadableDataSource): unknown {
  const value = source.searchValue?.()
  const search = value == null || value === '' ? null : String(value)
  if (!search) return undefined

  const expr = source.searchExpr?.()
  const cols = (Array.isArray(expr) ? expr : expr ? [expr] : []) as string[]
  if (!cols.length) return undefined

  const op = source.searchOperation?.() || 'contains'
  // Path/wildcard columns build a nav triple or a `Nav/any(...)` lambda so a drained
  // export matches the live grid (field-path is a zero-dependency leaf module).
  const clauses = cols
    .map((c) => toODataClause(c, op, search) as unknown)
    .filter((c) => c != null)
  if (!clauses.length) return undefined
  if (clauses.length === 1) return clauses[0]

  const out: unknown[] = []
  clauses.forEach((c, i) => {
    if (i) out.push('or')
    out.push(c)
  })
  return out
}

/**
 * AND-combine two optional devextreme filter expressions.
 *
 * Re-exported (not redefined) from the shared search module so the grid's filter
 * composition and a drain's composition can never disagree.
 */
export { andFilters }

/**
 * Read every row a source can produce, in chunks.
 *
 * A plain array passes straight through, so callers can accept
 * "array or DataSource" without branching.
 */
export async function readAllRows<T = any>(
  source: unknown,
  options: ReadAllRowsOptions = {},
): Promise<T[]> {
  const src = unwrapReactive(source)
  if (Array.isArray(src)) return flattenLeaves<T>(src)
  if (!src) return []

  const chunkSize = Math.max(1, Math.floor(options.chunkSize ?? 100))

  if (isDataSourceLike(src)) {
    const store = src.store?.()
    if (store && typeof store.load === 'function') {
      const filter = andFilters(
        andFilters(src.filter?.() ?? null, searchFilterOf(src) ?? null),
        options.filter ?? null,
      )
      const sort = options.sort ?? src.sort?.() ?? null
      // The drain talks to the STORE, which knows nothing of the DataSource's own
      // load options — so anything the source was configured with has to be
      // carried across explicitly. `filter` and `sort` always were; `select` was
      // not, which meant a source built with `select: ['A','B']` still fetched
      // every column on every chunk after the first. Same rule as the other two:
      // an explicit option wins, otherwise inherit what the source declares.
      const select = options.select ?? src.select?.() ?? null
      // `expand` / `customQueryParams` follow the same inherit-unless-overridden rule. Without
      // them a source built with `expand: ['Lines($select=Brand)']` drained every chunk with
      // no `$expand`, so the nested collection the live grid showed was simply absent from an
      // export. The caller's `loadOptions` win key by key.
      const loadOptions = { ...inheritedLoadOptionsOf(src), ...(options.loadOptions ?? {}) }
      return drainStore<T>(store, {
        chunkSize,
        countFirst: options.countFirst === true,
        ...(select ? { select: select as string[] } : {}),
        ...(filter ? { filter } : {}),
        ...(sort ? { sort } : {}),
        ...(Object.keys(loadOptions).length ? { loadOptions } : {}),
      })
    }
    return readArrayDataSource<T>(src)
  }

  if (isStoreLike(src)) {
    return drainStore<T>(src, {
      chunkSize,
      countFirst: options.countFirst === true,
      select: options.select,
      sort: options.sort,
      ...(options.filter ? { filter: options.filter } : {}),
      ...(options.loadOptions ? { loadOptions: options.loadOptions } : {}),
    })
  }

  return []
}

/**
 * One `store.load`, keeping the total count when the store reports one.
 *
 * devextreme resolves `load()` with the rows only — the count travels as the SECOND
 * argument of its Deferred (`.done((data, extra) => extra.totalCount)`), which a
 * plain `await` drops. A CustomStore may instead resolve `{ data, totalCount }`.
 */
function loadWithCount(store: ReadableStore, options: unknown): Promise<{ rows: any[]; total: number | null }> {
  const num = (v: unknown): number | null =>
    typeof v === 'number' && Number.isFinite(v) && v >= 0 ? v : null
  const res = store.load(options) as any
  if (res && typeof res.done === 'function') {
    return new Promise((resolve, reject) => {
      res.done((data: unknown, extra?: { totalCount?: unknown }) =>
        resolve({ rows: rowsOf(data), total: num(extra?.totalCount ?? (data as any)?.totalCount) }),
      )
      if (typeof res.fail === 'function') res.fail(reject)
      else if (typeof res.catch === 'function') res.catch(reject)
    })
  }
  return Promise.resolve(res).then((data: unknown) => ({
    rows: rowsOf(data),
    total: num((data as any)?.totalCount),
  }))
}

/** Loop `store.load` until a short chunk comes back — or, `countFirst`, up to the counted total. */
async function drainStore<T>(
  store: ReadableStore,
  opts: {
    chunkSize: number
    countFirst?: boolean
    select?: string[]
    filter?: unknown
    sort?: unknown
    loadOptions?: Record<string, unknown>
  },
): Promise<T[]> {
  const request = (skip: number, requireTotalCount: boolean) => ({
    ...(opts.loadOptions ?? {}),
    ...(opts.filter ? { filter: opts.filter } : {}),
    ...(opts.sort ? { sort: opts.sort } : {}),
    ...(opts.select ? { select: opts.select } : {}),
    skip,
    take: opts.chunkSize,
    requireTotalCount,
  })

  // Rows are pushed one by one: spreading a large chunk into `push` can overflow the stack.
  const append = (acc: T[], rows: any[]): void => {
    for (const row of flattenLeaves<T>(rows)) acc.push(row)
  }

  const walk = async (from: number, acc: T[]): Promise<T[]> => {
    for (let skip = from; ; skip += opts.chunkSize) {
      const rows = rowsOf(await store.load(request(skip, false)))
      append(acc, rows)
      if (rows.length < opts.chunkSize) break
      if (skip > MAX_SKIP) break
    }
    return acc
  }

  if (!opts.countFirst) return walk(0, [])

  const first = await loadWithCount(store, request(0, true))
  const acc: T[] = []
  append(acc, first.rows)
  if (first.rows.length < opts.chunkSize) return acc
  // No count reported: carry on the classic way from the second chunk.
  if (first.total == null) return walk(opts.chunkSize, acc)

  // The rest is known: every remaining skip, a few in flight at once, kept in order.
  const skips: number[] = []
  for (let skip = opts.chunkSize; skip < first.total && skip <= MAX_SKIP; skip += opts.chunkSize) skips.push(skip)
  const chunks: any[][] = new Array(skips.length)
  let next = 0
  const worker = async (): Promise<void> => {
    while (next < skips.length) {
      const i = next++
      chunks[i] = rowsOf(await store.load(request(skips[i]!, false)))
    }
  }
  await Promise.all(Array.from({ length: Math.min(COUNT_FIRST_PARALLEL, skips.length) }, worker))
  for (const rows of chunks) append(acc, rows ?? [])
  return acc
}

/**
 * An array-backed DataSource has no separate read channel, so its paging has to
 * be switched off, read, and put back exactly as it was — subscribers must not
 * observe the detour.
 */
async function readArrayDataSource<T>(src: ReadableDataSource<T>): Promise<T[]> {
  const paginate = src.paginate?.()
  const pageIndex = src.pageIndex?.()
  try {
    src.paginate?.(false)
    await src.load()
    return flattenLeaves<T>([...(src.items?.() ?? [])])
  } finally {
    if (typeof paginate === 'boolean') src.paginate?.(paginate)
    if (typeof pageIndex === 'number') src.pageIndex?.(pageIndex)
    await src.load()
  }
}
