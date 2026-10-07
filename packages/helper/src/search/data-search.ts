/**
 * The shared search engine — one implementation of "match a typed term against
 * a set of fields", used by every component that searches data.
 *
 * `monoDataGrid` grew this pipeline first (paths, `*` patterns, `{ field, custom }`
 * clause builders); this module lifts the reusable half out of the grid so
 * `mono-select`, `mono-tag-input` and `mono-dropdown-table` share it verbatim
 * rather than each re-deriving a weaker version.
 *
 * ## The `search-value` grammar
 *
 * A component's `search-value` prop accepts either form, interchangeably:
 *
 * ```ts
 * // array — the full grammar, including custom clause builders
 * :search-value.prop="['Company.Name', 'Transaction.[*].Price', '*.[*].*']"
 *
 * // comma-separated string — the same thing from plain HTML
 * search-value="Company.Name,Transaction.[*].Price,*.[*].*"
 * ```
 *
 * Whitespace around a comma is trimmed, so `'a, b, c'` and `'a,b,c'` are equal.
 * A comma is never part of a path or a pattern, so splitting on it is lossless —
 * only `{ field, custom }` entries need the array form.
 *
 * ## The two output shapes
 *
 * A search has to be expressed twice, because the two source kinds evaluate it in
 * different places:
 *
 * - **remote** (a devextreme store): a `$filter` expression → {@link searchRemoteFilter}
 * - **array / in-memory**: a `(row) => boolean` → {@link searchRowPredicate}
 *
 * Both are built from the SAME resolved entry list, so the two paths can't drift.
 *
 * ## Why a source can't always do it itself
 *
 * devextreme folds `searchValue` + `searchExpr` into the request on its own, which
 * is cheaper and is kept for the common case. But folding emits exactly
 * `contains(<col>,'<term>')` per column, so it cannot express a nav path
 * (`Job/Name`), a collection lambda (`Nav/any(...)`) or a custom clause.
 * {@link isFoldableSearch} decides; {@link MonoSourceSearch} routes.
 */

import { andFilters, joinFilters } from './filter-eval.js'
import { getFieldValue, isPath, toODataClause } from './field-path.js'
import {
  customPredicate,
  customRemoteClause,
  isWildcardPattern,
  normalizeSearchExpr,
  resolveSearchEntries,
  searchEntryField,
  type MonoSearchExpr,
  type MonoSearchExprEntry,
} from './search-expr.js'

// Re-exported so a component can type its resolved entries from this one module
// rather than reaching into `search-expr` as well.
export type { MonoSearchExpr, MonoSearchExprEntry }

/**
 * A `search-value` prop as authored: the comma-separated string form, or the
 * array form (which additionally allows `{ field, custom }` entries).
 */
export type MonoSearchValue = string | MonoSearchExprEntry[]

/** The default devextreme search operation. */
export const DEFAULT_SEARCH_OPERATION = 'contains'

/**
 * Split the string form of `search-value` on commas.
 *
 * Kept separate from {@link resolveSearchFields} so a component can show a user
 * what its raw prop parsed to without also resolving `*` patterns against data.
 */
export function parseSearchValue(value: MonoSearchValue | undefined | null): MonoSearchExprEntry[] {
  if (value == null) return []
  if (Array.isArray(value)) return normalizeSearchExpr(value as MonoSearchExpr)
  if (typeof value !== 'string') return []
  // A comma can't appear inside a path (`.`/`[]`) or a pattern (`*`), so this
  // split is lossless for every string-expressible entry.
  return normalizeSearchExpr(
    value
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean) as MonoSearchExpr,
  )
}

/**
 * The four accepted spellings of "which fields does a typed term match".
 *
 * The data grid shipped this option as `searchExpr`; select and tag-input named
 * the same idea `search-value`. Rather than pick a winner and break one of them,
 * every surface accepts all four names for one concept — `searchExpr` is kept
 * purely for back-compat.
 */
export interface MonoSearchFieldsAliases {
  searchExpr?: MonoSearchValue | null
  'search-expr'?: MonoSearchValue | null
  searchValue?: MonoSearchValue | null
  'search-value'?: MonoSearchValue | null
}

/** The spellings, in the order a merge reads them. */
export const SEARCH_FIELDS_KEYS = [
  'searchExpr',
  'search-expr',
  'searchValue',
  'search-value',
] as const satisfies readonly (keyof MonoSearchFieldsAliases)[]

/**
 * Merge every spelling present into one entry list, de-duplicated by field name.
 *
 * They all mean the same thing, so passing two of them means the union rather
 * than one silently shadowing the other. Order only decides *position* among
 * equal field names — first occurrence wins, so a `{ field, custom }` entry
 * written under one spelling isn't displaced by a plain column under another.
 *
 * Returns **`undefined` when none of the keys is present**, which callers rely on
 * to mean "not configured at all" — distinctly different from `[]` ("configured,
 * but empty"). The grid uses that difference to decide whether to leave a data
 * source's own `searchExpr` alone.
 */
export function mergeSearchFields(
  src: MonoSearchFieldsAliases | undefined | null,
): MonoSearchExprEntry[] | undefined {
  if (!src) return undefined

  let present = false
  const out: MonoSearchExprEntry[] = []
  const seen = new Set<string>()

  for (const key of SEARCH_FIELDS_KEYS) {
    const raw = src[key]
    // `null` counts as "declared" — a consumer clearing one spelling shouldn't
    // fall back to a source's own columns any more than `[]` would.
    if (raw === undefined) continue
    present = true
    for (const entry of parseSearchValue(raw)) {
      const field = searchEntryField(entry)
      if (seen.has(field)) continue
      seen.add(field)
      out.push(entry)
    }
  }

  return present ? out : undefined
}

/** Inputs to {@link resolveSearchFields}. */
export interface ResolveSearchFieldsOptions {
  /** The component's `search-value` prop, in either form. */
  searchValue?: MonoSearchValue | null
  /**
   * Fields to search when `search-value` is empty — a component's natural
   * defaults (`display-value` when it's a string, then `key-value`).
   */
  fallbackFields?: Array<string | undefined | null>
  /** Loaded rows, sampled to resolve `*` patterns. */
  rows?: readonly unknown[]
  /**
   * Whether the source is remote (store-backed). A remote `$filter` can only
   * `contains` a **string** column, so a `*` pattern expands to string leaves
   * only — `contains(Price,'x')` is invalid OData and would reject the request.
   */
  remote?: boolean
  /**
   * Search **everything** when `search-value` is empty: `'*'` is prepended ahead
   * of {@link fallbackFields} rather than the fallbacks being used alone.
   *
   * The fallbacks are kept as a safety net rather than replaced, for two reasons:
   * a `'*'` resolves against `rows`, so before a remote source's first page has
   * landed it expands to NOTHING and the query would silently match everything;
   * and `textOnly` drops non-string leaves on a remote source, which would stop a
   * numeric `key-value` being searchable. A concrete fallback entry is exempt from
   * both — `resolveSearchEntries` treats an explicitly named field as explicit, so
   * it survives expansion and appears exactly once.
   */
  defaultToWildcard?: boolean
}

/** The default when nothing is configured: every top-level field. */
export const DEFAULT_SEARCH_FIELDS: readonly string[] = ['*']

/**
 * The entries a search actually runs over: the prop parsed, the fallbacks applied
 * when it's empty, and every `*` pattern expanded against `rows`.
 *
 * Call this **once per query**, never per row — a pattern samples up to 20 rows,
 * so resolving inside a row loop is O(rows × fields) on every keystroke.
 */
export function resolveSearchFields(
  options: ResolveSearchFieldsOptions = {},
): MonoSearchExprEntry[] {
  const {
    searchValue,
    fallbackFields = [],
    rows = [],
    remote = false,
    defaultToWildcard = false,
  } = options

  let entries = parseSearchValue(searchValue)
  if (!entries.length) {
    const fallbacks = fallbackFields.filter((f): f is string => typeof f === 'string' && !!f)
    // `'*'` first so the natural fields keep the position they had before, and so
    // a de-dupe inside `resolveSearchEntries` resolves in the pattern's favour.
    entries = defaultToWildcard ? [...DEFAULT_SEARCH_FIELDS, ...fallbacks] : fallbacks
  }
  if (!entries.length) return []

  return resolveSearchEntries(entries as MonoSearchExpr, { rows, textOnly: remote })
}

/**
 * Whether a source's own `searchValue`/`searchExpr` folding can express these
 * entries — true only for plain top-level column names.
 *
 * A path needs a nav selector or an `any()` lambda and a custom brings its own
 * clause; folding would silently search either with a flat `contains` instead.
 */
export function isFoldableSearch(entries: readonly MonoSearchExprEntry[]): boolean {
  return entries.every(
    (e) => typeof e === 'string' && !isPath(e) && !isWildcardPattern(e),
  )
}

/** The plain column names among `entries` — what a source may safely be handed. */
export function plainSearchFields(entries: readonly MonoSearchExprEntry[]): string[] {
  return entries.filter(
    (e): e is string => typeof e === 'string' && !isWildcardPattern(e),
  )
}

/** Compare one resolved value against the needle using a devextreme operation. */
function matchesValue(value: unknown, needle: string, operation: string): boolean {
  const s = String(value ?? '').toLowerCase()
  const n = needle.toLowerCase()
  if (operation === 'startswith') return s.startsWith(n)
  if (operation === 'endswith') return s.endsWith(n)
  if (operation === '=' || operation === 'equals') return s === n
  if (operation === 'notcontains') return !s.includes(n)
  return s.includes(n)
}

/**
 * Read a field off a row, path-aware. A wildcard path resolves to an array of
 * every match, so the caller matches if ANY element hits.
 */
export function readSearchField(row: unknown, field: string): unknown[] {
  const raw = isPath(field) ? getFieldValue(row, field) : (row as Record<string, unknown>)?.[field]
  return Array.isArray(raw) ? raw : [raw]
}

/**
 * The client-side row test for one query, or `null` when there is nothing to
 * match on.
 *
 * `null` means "no opinion" — the caller should keep every row rather than filter
 * them all away, which is what a component with no configured fields wants.
 */
export function searchRowPredicate(
  entries: readonly MonoSearchExprEntry[],
  query: string,
  operation: string = DEFAULT_SEARCH_OPERATION,
): ((row: any) => boolean) | null {
  const needle = String(query ?? '').trim()
  if (!needle || !entries.length) return null

  return (row: any) =>
    entries.some((entry) => {
      if (typeof entry === 'string') {
        return readSearchField(row, entry).some((v) => matchesValue(v, needle, operation))
      }
      // A custom entry compiles its own clause; declining this term (null) just
      // means its column has nothing to say about it.
      const pred = customPredicate(entry, needle, operation)
      return pred ? pred(row) : false
    })
}

/**
 * The devextreme `$filter` expression for one query — an OR across every entry —
 * or `null` when there is nothing to send.
 */
export function searchRemoteFilter(
  entries: readonly MonoSearchExprEntry[],
  query: string,
  operation: string = DEFAULT_SEARCH_OPERATION,
): unknown {
  const needle = String(query ?? '').trim()
  if (!needle || !entries.length) return null

  const clauses = entries
    .map((entry) =>
      typeof entry === 'string'
        ? (toODataClause(entry, operation, needle) as unknown)
        : customRemoteClause(entry, needle, operation),
    )
    .filter((c) => c != null)

  return joinFilters(clauses, 'or')
}

// ── Applying a search to a bound DataSource ──────────────────────────────────

/** The structural slice of a devextreme DataSource a search touches. */
export interface SearchableSource {
  searchOperation?: (op?: string) => unknown
  searchExpr?: (expr?: unknown) => unknown
  searchValue?: (v?: unknown) => unknown
  filter?: (v?: unknown) => unknown
  pageIndex?: (n?: number) => unknown
  load?: () => PromiseLike<unknown> | unknown
}

/** Inputs to {@link MonoSourceSearch.apply}. */
export interface ApplySourceSearchOptions extends ResolveSearchFieldsOptions {
  /** The text the user typed. */
  query: string
  /** devextreme search operation (default `'contains'`). */
  operation?: string
}

/**
 * Applies a search to a bound DataSource, choosing between the source's own
 * folding and a controller-built `$filter`.
 *
 * The reason this needs to be an object rather than a function is the **base
 * filter**: when the search can't be folded it has to live in `source.filter()`,
 * which is also where the consumer's own filter lives. So the consumer's filter is
 * captured and every search re-composes from that snapshot — otherwise each
 * keystroke would AND another search clause onto the previous one and the filter
 * would grow without bound.
 *
 * The snapshot is not taken once and kept. Before every apply (and every clear)
 * the live `filter()` is compared against what this instance last WROTE: if it
 * differs, the consumer changed the filter in the meantime — a watcher scoping
 * the source — and that becomes the new base. Snapshotting only at `bind()` made
 * the next keystroke overwrite such a filter with the stale one, and "restored"
 * the stale one on clear.
 *
 * ```ts
 * private _search = new MonoSourceSearch()
 * // on `dataSource` change:
 * this._search.bind(this.dataSource)
 * // on a (debounced) query:
 * await this._search.apply(this.dataSource, {
 *   query, searchValue: this.searchValue, fallbackFields: [...], rows, remote: true,
 * })
 * ```
 */
export class MonoSourceSearch {
  /** The source the captured base filter belongs to. */
  private _source: unknown = null
  /** The consumer's own `filter()`, as it was before any search touched it. */
  private _baseFilter: unknown = null
  /** Whether the last apply wrote a search clause into `filter()`. */
  private _wroteFilter = false
  /** What the source HELD after this instance's last `filter()` write (read back). */
  private _lastWritten: unknown = null

  /**
   * Snapshot a source's own filter. Safe to call repeatedly — the snapshot is
   * only (re)taken when the source identity actually changes, so it can be driven
   * straight from a `willUpdate` branch. A change on the SAME source is picked up
   * by `_syncBase` at the next apply/clear instead.
   */
  bind(source: unknown): void {
    if (source === this._source) return
    this._source = source ?? null
    this._baseFilter = (source as SearchableSource | null)?.filter?.() ?? null
    this._lastWritten = this._baseFilter
    this._wroteFilter = false
  }

  /**
   * Adopt a filter the consumer set on the source since the last write —
   * anything the source holds that is not what this instance last put there.
   * `_writeFilter` records what the source HOLDS after a write (read back), so a
   * source that ignores writes reads back as its own last write and is never
   * re-adopted, and one that normalises compares against its normalised value.
   */
  private _syncBase(s: SearchableSource): void {
    if (typeof s.filter !== 'function') return
    const live = s.filter() ?? null
    if (live === this._lastWritten) return
    this._baseFilter = live
    // Whatever clause this instance had written is gone with the old filter.
    this._wroteFilter = false
  }

  /** Write `filter()` and remember what the source holds afterwards. */
  private _writeFilter(s: SearchableSource, value: unknown): void {
    s.filter?.(value)
    this._lastWritten = s.filter?.() ?? null
  }

  /**
   * Undo whatever this instance wrote onto the source, then forget it.
   *
   * `reset()` alone is not enough at teardown. With `defaultToWildcard`, a `'*'`
   * entry is never foldable, so the search is AND-ed into `source.filter()` — the
   * same slot the CONSUMER's own filter lives in. Only `apply()` ever restores the
   * captured base (and only when the next apply happens to be foldable), so an
   * element torn down mid-query used to leave its clause behind on a DataSource
   * the app still owns and shares.
   *
   * Deliberately does NOT `load()`: teardown must not issue a request. The next
   * consumer of the source reloads on its own terms.
   */
  clear(source?: unknown): void {
    const s = (source ?? this._source) as SearchableSource | null
    if (s) {
      this._syncBase(s)
      s.searchValue?.(null)
      if (this._wroteFilter) this._writeFilter(s, this._baseFilter ?? null)
    }
    this.reset()
  }

  /** Forget the captured state without touching the source. */
  reset(): void {
    this._source = null
    this._baseFilter = null
    this._lastWritten = null
    this._wroteFilter = false
  }

  /**
   * Push `query` onto `source` and reload it. Returns the resolved entries so a
   * caller can reuse them for its own client-side rendering without re-resolving.
   */
  async apply(
    source: unknown,
    options: ApplySourceSearchOptions,
  ): Promise<MonoSearchExprEntry[]> {
    const s = source as SearchableSource | null
    if (!s) return []
    this.bind(source)
    this._syncBase(s)

    const operation = options.operation || DEFAULT_SEARCH_OPERATION
    const entries = resolveSearchFields({ ...options, remote: options.remote ?? true })
    const query = String(options.query ?? '').trim()

    if (isFoldableSearch(entries)) {
      // The common case — let devextreme build the `$filter` itself.
      s.searchOperation?.(operation)
      s.searchExpr?.(plainSearchFields(entries))
      s.searchValue?.(query || null)
      // Undo a previous non-foldable search so its clause doesn't linger.
      if (this._wroteFilter) {
        this._writeFilter(s, this._baseFilter ?? null)
        this._wroteFilter = false
      }
    } else {
      // Paths, `*` patterns or customs: folding can't express it. Disable the
      // source's own search and fold OUR expression into `filter()` instead.
      s.searchValue?.(null)
      const expr = searchRemoteFilter(entries, query, operation)
      this._writeFilter(s, andFilters(this._baseFilter ?? null, expr))
      this._wroteFilter = expr != null
    }

    s.pageIndex?.(0)
    await Promise.resolve(s.load?.())
    return entries
  }
}
