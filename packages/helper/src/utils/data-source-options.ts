// The universal "base query" options — `dataSourceOptions` / `odataOptions` —
// and the pure helpers that read, normalise and merge them.
//
// Shared by every controller that runs queries against a devextreme DataSource
// or an OData endpoint (`monoDataGrid`, and `monoDataDropdown` through it;
// `monoChart`), so all of them accept the same two shapes with the same
// semantics: a filter that sticks under everything the component itself adds, a
// `$select`, an `$expand`, a base sort, custom query parameters — read fresh at
// query time so a getter over reactive state always contributes its CURRENT
// value.
//
// Nothing here touches a source. What a controller does with the merged result
// (write it to `ds.select()`, AND it under a search, fold it into an `$apply`) is
// the controller's business; this module only agrees on what the options MEAN.

import { odataStringToArray } from '../components/filter/filter-odata.js'
import { andFilters, andPredicates, compileFilterPredicate, type RowPredicate } from '../search/filter-eval.js'
import { resolveMaybeReactive, type MaybeReactive } from '../composables/reactive.js'

/** One sort entry, in devextreme's object form. */
export interface MonoSourceSortEntry {
  selector: string
  desc: boolean
}

/**
 * DataSource-level knobs a controller keeps STICKY — `{ dataSourceOptions }`.
 *
 * These are the devextreme `DataSource` options a consumer would otherwise set on
 * the source itself, and the point of routing them through the controller is that
 * the controller then composes every query it runs on top of them: a search, a
 * header column filter, a sort, a page, a scroll page, a drain, an `$apply` —
 * each one goes out with this `filter` AND-ed in, this `select`, this `expand`.
 *
 * The option is read fresh at every query (see `MaybeReactive`), so hand a getter
 * or a `computed` and the CURRENT reactive value is the one that lands in the
 * request. Changing it does not by itself run a query — that is `refresh()`.
 */
export interface MonoDataSourceOptions {
  /** Base filter, AND-ed under everything the controller adds. Array sources take a predicate too. */
  filter?: unknown
  /** `$select`. */
  select?: string | string[]
  /** `$expand`. Simple navigation names union; a nested `Nav($select=…)` string is kept verbatim. */
  expand?: string | string[]
  /**
   * Base sort. A sort the user picks wins; these follow as tiebreakers (entries
   * whose selector is already sorted are skipped).
   */
  sort?: string | { selector: string; desc?: boolean } | Array<string | { selector: string; desc?: boolean }>
  /** Extra query-string parameters (ODataStore `customQueryParams`). */
  customQueryParams?: Record<string, unknown>
  paginate?: boolean
  /** Source page size. A component's own page-size control still wins. */
  pageSize?: number
  requireTotalCount?: boolean
  /** Source-level search columns/operation — used only when the controller declares none of its own. */
  searchExpr?: string | string[]
  searchOperation?: string
  [key: string]: unknown
}

/**
 * The same thing in raw OData vocabulary — `{ odataOptions }`.
 *
 * Normalised into {@link MonoDataSourceOptions} and merged with it: `$select` →
 * `select`, `$expand` → `expand`, `$orderby` → `sort`, `$filter` → `filter`, and
 * every other key (`$top`, `$count`, a custom parameter) → `customQueryParams`.
 *
 * `$filter` is a string. It is parsed into devextreme's array form so the store
 * compiles it together with whatever the component adds; an expression the
 * parser cannot read (an `any()` lambda, an ISO date literal) is sent as-is and
 * comes out as `(expr) eq true`, which is valid OData — but devextreme rewrites
 * every `.` in that raw text to `/`, so keep decimals and dotted strings out of
 * it, or write the array form under `dataSourceOptions.filter` instead. Array
 * sources cannot evaluate a raw string and ignore it (with one console warning).
 */
export interface MonoOdataOptions {
  $select?: string | string[]
  $expand?: string | string[]
  $orderby?: string
  $filter?: string
  [key: string]: unknown
}

/** The knobs with a meaning of their own; anything else is passed through as a load option. */
export const DATA_SOURCE_KNOBS: ReadonlySet<string> = new Set([
  'filter', 'select', 'expand', 'sort', 'customQueryParams',
  'paginate', 'pageSize', 'requireTotalCount', 'searchExpr', 'searchOperation',
])

/** A comma string or an array → a trimmed string list; `null`/`undefined` → `undefined`. */
export function toList(v: unknown): string[] | undefined {
  if (v == null) return undefined
  if (Array.isArray(v)) return v.map(String)
  return String(v).split(',').map((x) => x.trim()).filter(Boolean)
}

/** devextreme's sort forms (string / object / array / mixed) → an ordered entry list. */
export function normalizeSortList(value: unknown): MonoSourceSortEntry[] {
  const arr = Array.isArray(value) ? value : value == null ? [] : [value]
  const out: MonoSourceSortEntry[] = []
  for (const v of arr) {
    if (!v) continue
    if (typeof v === 'string') out.push({ selector: v, desc: false })
    else if (typeof v === 'object' && (v as MonoSourceSortEntry).selector) {
      out.push({ selector: (v as MonoSourceSortEntry).selector, desc: !!(v as MonoSourceSortEntry).desc })
    }
  }
  return out
}

/** `"A desc, B"` → `[{A, desc}, {B}]`. */
export function parseOrderby(text: string): MonoSourceSortEntry[] {
  return text
    .split(',')
    .map((part) => part.trim())
    .filter(Boolean)
    .map((part) => {
      const [selector, dir] = part.split(/\s+/)
      return { selector, desc: (dir ?? '').toLowerCase() === 'desc' }
    })
}

/**
 * The parser emits OData keyword operators (`eq`, `ge`) — the filter builder's
 * tree reads either — but devextreme's ODataStore compiles ONLY the symbol forms
 * and throws `E4003` on a keyword. Rewritten recursively.
 */
export function toSymbolOps(expr: unknown): unknown {
  if (!Array.isArray(expr)) return expr
  const SYM: Record<string, string> = { eq: '=', ne: '<>', gt: '>', ge: '>=', lt: '<', le: '<=' }
  if (expr.length === 3 && typeof expr[0] === 'string' && typeof expr[1] === 'string' && !Array.isArray(expr[2])) {
    const op = SYM[expr[1].toLowerCase()]
    return op ? [expr[0], op, expr[2]] : expr
  }
  return expr.map((part) => (Array.isArray(part) ? toSymbolOps(part) : part))
}

/**
 * A raw `$filter` → devextreme's array form, so the store compiles it TOGETHER
 * with whatever the component adds. The parser throws on syntax it does not know
 * (lambdas, ISO date literals); those go through as a one-element raw clause,
 * which devextreme emits as `(expr) eq true` — valid OData, with the caveat that
 * it rewrites `.` to `/` inside the text.
 */
export function parseOdataFilter(raw: string): unknown {
  const text = raw.trim()
  if (!text) return null
  try {
    return toSymbolOps(odataStringToArray(text) ?? null)
  } catch {
    return [`(${text})`]
  }
}

/** `{ $select, $expand, $orderby, $filter, …custom }` → the DataSource shape. */
export function normalizeOdataOptions(o: MonoOdataOptions): MonoDataSourceOptions {
  const out: MonoDataSourceOptions = {}
  const custom: Record<string, unknown> = {}
  for (const [k, v] of Object.entries(o)) {
    if (v === undefined) continue
    if (k === '$select') out.select = toList(v)
    else if (k === '$expand') out.expand = Array.isArray(v) ? v.map(String) : String(v)
    else if (k === '$orderby') out.sort = parseOrderby(String(v))
    else if (k === '$filter') {
      const f = parseOdataFilter(String(v))
      if (f != null) out.filter = f
    } else custom[k] = v
  }
  if (Object.keys(custom).length) out.customQueryParams = custom
  return out
}

/**
 * `a` ∧ `b`: filters AND-ed (predicates and arrays each on their own terms),
 * `select`/`expand` unioned, sort de-duplicated by selector with `a` leading,
 * `customQueryParams` merged with `b` winning, scalars `b` if defined else `a`.
 */
export function mergeDataSourceOptions(
  a: MonoDataSourceOptions,
  b: MonoDataSourceOptions,
): MonoDataSourceOptions {
  const out: MonoDataSourceOptions = { ...a, ...b }
  if (a.filter != null && b.filter != null) {
    out.filter =
      typeof a.filter === 'function' || typeof b.filter === 'function'
        ? andPredicates(
            typeof a.filter === 'function' ? (a.filter as RowPredicate) : compileFilterPredicate(a.filter),
            typeof b.filter === 'function' ? (b.filter as RowPredicate) : compileFilterPredicate(b.filter),
          )
        : andFilters(a.filter, b.filter)
  } else out.filter = a.filter ?? b.filter
  const union = (x: unknown, y: unknown): string[] | undefined => {
    const xs = toList(x), ys = toList(y)
    if (!xs && !ys) return undefined
    return [...new Set([...(xs ?? []), ...(ys ?? [])])]
  }
  if (a.select !== undefined || b.select !== undefined) out.select = union(a.select, b.select)
  if (a.expand !== undefined || b.expand !== undefined) {
    // A string expand carrying `Nav($select=…)` cannot be split on commas — it is
    // kept verbatim and `b` wins. Plain names union like `select`.
    const nested = (v: unknown) => typeof v === 'string' && v.includes('(')
    out.expand = nested(a.expand) || nested(b.expand) ? (b.expand ?? a.expand) : union(a.expand, b.expand)
  }
  if (a.sort !== undefined || b.sort !== undefined) {
    const as = normalizeSortList(a.sort)
    const bs = normalizeSortList(b.sort).filter((e) => !as.some((x) => x.selector === e.selector))
    out.sort = [...as, ...bs]
  }
  if (a.customQueryParams || b.customQueryParams) {
    out.customQueryParams = { ...(a.customQueryParams ?? {}), ...(b.customQueryParams ?? {}) }
  }
  return out
}

/**
 * Read both option bags fresh and merge them — the one call a controller makes
 * at the top of every query. Returns a NEW object every time (a getter hands
 * back fresh state), so callers that need change detection compare by content:
 * see {@link dataSourceOptionsKey}.
 */
export function resolveDataSourceOptions(
  dataSourceOptions: MaybeReactive<MonoDataSourceOptions> | undefined,
  odataOptions: MaybeReactive<MonoOdataOptions> | undefined,
): MonoDataSourceOptions {
  const ds = resolveMaybeReactive(dataSourceOptions) ?? {}
  const od = resolveMaybeReactive(odataOptions)
  return od ? mergeDataSourceOptions(ds, normalizeOdataOptions(od)) : { ...ds }
}

/**
 * A content key for change detection. Functions (an array-source predicate) do
 * not stringify, so they are marked and must be compared by reference by the
 * caller; a circular object yields a fresh random key and so always counts as
 * changed.
 */
export function dataSourceOptionsKey(o: MonoDataSourceOptions): string {
  try {
    return JSON.stringify(o, (_k, v) => (typeof v === 'function' ? '[fn]' : v))
  } catch {
    return String(Math.random())
  }
}

/** `expand` / `customQueryParams` / unknown keys — what goes onto a `store.load()` beside the knobs. */
export function extraLoadOptions(o: MonoDataSourceOptions): Record<string, unknown> {
  const out: Record<string, unknown> = {}
  for (const [k, v] of Object.entries(o)) if (!DATA_SOURCE_KNOBS.has(k) && v !== undefined) out[k] = v
  if (o.expand !== undefined) out.expand = o.expand
  if (o.customQueryParams !== undefined) out.customQueryParams = o.customQueryParams
  return out
}
