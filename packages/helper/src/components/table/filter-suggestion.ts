/**
 * Filter suggestion — "this search matches nothing HERE, but N rows under a
 * different filter value".
 *
 * `<mono-table-search :control-form :suggestion-filter>` runs {@link probeFilterSuggestion}
 * after a search came back empty and publishes the result on the grid
 * (`grid.setFilterSuggestion`); `<mono-table-empty :control-form>` renders it as
 * an **Adjust Filter** offer and writes `values` into the form.
 *
 * ── How a probe is built ──
 *
 * The form IS the filter, and `keys` maps row fields onto form keys
 * (`{ CodeDept: 'Dept' }`). So for each mapped field F the probe is:
 *
 *   search ∧ (every OTHER mapped field pinned to its form value) ∧ `filter`
 *
 * grouped-and-counted by F. It is built from the mapping, NOT by stripping F out
 * of the grid's own filter: a raw OData string can't be un-parsed, and an
 * array source's filter is already compiled to a predicate.
 *
 * ── Never suggest what the user can't pick ──
 *
 * Option lists are per-user (JWT depts / channels) and cascade (company → dept),
 * and that logic lives in the form control's OWN option source. So candidates are
 * checked against that source — its `filter()` carries the restriction — rather
 * than re-implementing it here. A field whose control is `readonly` / `disabled`
 * is never relaxed. `sources[field]` overrides the source when the control's own
 * isn't the right one (or isn't rendered).
 */
import type { MonoFormController } from '../form/form-types'
import type { MonoSearchExprEntry } from '../../search/search-expr.js'
import { customRemoteClause, hasWildcardSearch, searchEntryFor } from '../../search/search-expr.js'
import { isPath, odataLiteral, toODataClause, toODataSelector } from '../../search/field-path'
import { summaryODataFilter } from '../../utils/data-source-summary'
import {
  DEFAULT_SEARCH_OPERATION,
  parseSearchValue,
  resolveSearchFields,
  searchRowPredicate,
  type MonoSearchValue,
} from '../../search/data-search.js'
import {
  andFilters,
  andPredicates,
  compileFilterPredicate,
  joinFilters,
  type RowPredicate,
} from '../../search/filter-eval'
import {
  odataStoreUrl,
  odataStoreVersion,
  storeRows,
  type ApplyGate,
} from '../../utils/data-source-apply'
import {
  countTuples,
  groupCountsViaApply,
  type MonoTupleCount,
  type MonoValueCount,
} from '../../utils/group-count'

/** Where a field's ALLOWED values come from — a DataSource, a store, an array, or with an explicit key. */
export type MonoSuggestionValueSource =
  | unknown
  | {
      source: unknown
      /** The option row field holding the value (default: the form control's `keyValue`, then the row field). */
      keyValue?: string
    }

/** `<mono-table-search :suggestion-filter.prop="…">`. */
export interface MonoSuggestionFilter {
  /** Row field → form key, e.g. `{ CodeDept: 'Dept' }`. Required. */
  keys: Record<string, string>
  /**
   * Allowed values per ROW field. Default: the option source of the form control
   * bound under that key (`dataSource`, else `items`).
   */
  sources?: Record<string, MonoSuggestionValueSource>
  /**
   * Where rows are COUNTED — a DataSource, a store or an array. Default: the
   * grid's bound source. Its own `filter()` is NOT applied (it usually holds the
   * very form clause being relaxed); put a fixed base in {@link filter}.
   */
  source?: unknown
  /** Search fields on {@link source}. Default: the grid's `searchValue()`. */
  searchValue?: MonoSearchValue
  /**
   * A fixed base for the probe, ANDed in — a devextreme filter array, or a
   * getter returning one (a function taking NO arguments). For an array source a
   * row predicate `(row) => boolean` works too.
   */
  filter?: unknown
  /** Search operation (default `contains`). */
  searchOperation?: string
  /**
   * How the rows are counted on a remote source.
   * - `'apply'` (default): ONE `$apply=groupby((…),aggregate($count as count))` request
   *   for every field — every value that has matches comes back with its count. Falls
   *   back to a `$select` scan when the server rejects `$apply`.
   * - `'count'`: one `$count` request PER allowed option of each field (`$top=0&$count=true`,
   *   a bare number back). For servers without `$apply` and short option lists — no rows
   *   are downloaded. Needs an OData store; capped by {@link maxCountRequests}.
   */
  requestType?: 'apply' | 'count'
  /** `requestType: 'count'` only — most `$count` requests per field (default 30). */
  maxCountRequests?: number
  /**
   * Log every probe step to the console — the search sent, the per-value counts,
   * which candidates the field allows — and the reason when nothing is offered
   * (a readonly field, an empty "all values" field, no candidates, none allowed).
   */
  debug?: boolean
}

/** What a probe found — published on the grid, rendered by `<mono-table-empty>`. */
export interface MonoFilterSuggestion {
  /** Form key to change (`Dept`). */
  key: string
  /** Row field it filters (`CodeDept`). */
  field: string
  /** The suggested value (single), or the values being ADDED (array field). */
  value: unknown
  /** Display text for {@link value}, from the control's `displayValue` when known. */
  caption: string
  /**
   * The field's label — `inputs[key].props.label` from `controlMonoForm`, else the
   * bound control's `label`, else the form key. For wording: "… in another {label}".
   */
  label: string
  /** Rows that would match the search after adjusting. */
  count: number
  /** The form value right now. */
  current: unknown
  /** What Adjust writes: `form.setValues(values)`. */
  values: Record<string, unknown>
}

/** The slice of the grid a probe reads — public `MonoTableController` members only. */
export interface ProbeGrid {
  searchTerms: Array<{ value: string; field?: string }>
  dataSource: unknown
  searchValue(): MonoSearchExprEntry[] | undefined
}

export interface ProbeContext {
  grid: ProbeGrid
  form: MonoFormController
  /** Remembers a backend that rejected `$apply` (see `createApplyGate`). */
  gate: ApplyGate
}

/** Most candidates verified against an option source in one request (keeps the URL sane). */
const MAX_CANDIDATES = 50

// ── small helpers ───────────────────────────────────────────────────────────

type Loadable = { load(options?: unknown): PromiseLike<unknown> | unknown }
type DataSourceLike = { store(): unknown; filter?: () => unknown }

const isEmptyValue = (v: unknown): boolean =>
  v == null || v === '' || (Array.isArray(v) && v.length === 0)

const sameValue = (a: unknown, b: unknown): boolean => a === b || String(a) === String(b)

function asDataSource(x: unknown): DataSourceLike | null {
  return x && typeof (x as DataSourceLike).store === 'function' ? (x as DataSourceLike) : null
}

function asStore(x: unknown): Loadable | null {
  return x && typeof (x as Loadable).load === 'function' ? (x as Loadable) : null
}

/** `field = v`, or an OR of them for several values. */
export function equalsAny(field: string, values: readonly unknown[]): unknown {
  return joinFilters(
    values.map((v) => [field, '=', v]),
    'or',
  )
}

/** A filter value or a zero-arg getter → its value. */
function resolveBase(filter: unknown): unknown {
  if (typeof filter === 'function' && (filter as () => unknown).length === 0) {
    return (filter as () => unknown)()
  }
  return filter ?? null
}

/** Group search terms by field — OR within a field, AND across (the grid's own shape). */
function groupTerms(
  terms: ProbeGrid['searchTerms'],
): Array<{ field: string | undefined; values: string[] }> {
  const order: Array<string | undefined> = []
  const by = new Map<string | undefined, string[]>()
  for (const t of terms ?? []) {
    const v = String(t?.value ?? '').trim()
    if (!v) continue
    const key = t.field || undefined
    if (!by.has(key)) {
      by.set(key, [])
      order.push(key)
    }
    by.get(key)!.push(v)
  }
  return order.map((field) => ({ field, values: by.get(field)! }))
}

const STRING_OPS = new Set(['contains', 'notcontains', 'startswith', 'endswith'])

/**
 * One case-insensitive search clause for a plain / path field.
 *
 * The probe's filter reaches the server as TEXT — inside an `$apply`, or a `$filter`
 * written into the url — never through devextreme's compiler, so its usual
 * `tolower` (`oDataFilterToLower`) never happens. It is written here instead:
 * `contains(tolower(CompanyName),'shopee')`, as a raw one-element clause.
 * A wildcard path comes back from `toODataClause` as an `any()` lambda that is
 * already lowercased.
 */
export function lowerSearchClause(field: string, op: string, value: string): unknown {
  const v = String(value ?? '').toLowerCase()
  const clause = toODataClause(field, op === 'notcontains' ? 'contains' : op, v) as unknown
  if (!clause) return null
  if (Array.isArray(clause) && clause.length === 1) {
    // `Nav/any(d: contains(tolower(d/X),'v'))` — negate it for `notcontains`.
    return op === 'notcontains' ? [`not (${clause[0]})`] : clause
  }
  if (!STRING_OPS.has(op)) return clause
  const selector = isPath(field) ? (toODataSelector(field) ?? field) : field
  const call = `${op === 'notcontains' ? 'contains' : op}(tolower(${selector}),${odataLiteral(v)})`
  return [op === 'notcontains' ? `not ${call}` : call]
}

/** The search as a filter array (remote) — `null` when there is nothing to search. */
export function searchFilterFor(
  terms: ProbeGrid['searchTerms'],
  entries: readonly MonoSearchExprEntry[],
  operation = DEFAULT_SEARCH_OPERATION,
): unknown {
  const groups = groupTerms(terms)
  if (!groups.length || !entries.length) return null
  const perGroup = groups.map((g) => {
    const list = g.field ? [searchEntryFor(entries as MonoSearchExprEntry[], g.field) ?? g.field] : entries
    const perValue = g.values.map((value) =>
      joinFilters(
        list.map((e) =>
          typeof e === 'string' ? lowerSearchClause(e, operation, value) : customRemoteClause(e, value, operation),
        ),
        'or',
      ),
    )
    return joinFilters(perValue, 'or')
  })
  return joinFilters(perGroup, 'and')
}

/** The search as a row predicate (array) — `null` when there is nothing to search. */
export function searchPredicateFor(
  terms: ProbeGrid['searchTerms'],
  entries: readonly MonoSearchExprEntry[],
  operation = DEFAULT_SEARCH_OPERATION,
): RowPredicate | null {
  const groups = groupTerms(terms)
  if (!groups.length || !entries.length) return null
  const perGroup = groups.map((g) => {
    const list = g.field ? [searchEntryFor(entries as MonoSearchExprEntry[], g.field) ?? g.field] : entries
    const preds = g.values
      .map((v) => searchRowPredicate(list, v, operation))
      .filter((p): p is (row: any) => boolean => !!p)
    return preds.length ? ((row: any) => preds.some((p) => p(row))) as RowPredicate : null
  })
  return andPredicates(...perGroup)
}

/**
 * The probe filter for relaxing `field`: every OTHER mapped field pinned to its
 * current form value (an empty value means "all" and pins nothing), ANDed with
 * the search and the fixed base. `field` itself stays free.
 */
export function buildProbeFilter(
  field: string,
  keys: Record<string, string>,
  values: Record<string, unknown>,
  search: unknown,
  base: unknown,
): unknown {
  const pins = Object.entries(keys)
    .filter(([f]) => f !== field)
    .map(([f, key]) => {
      const v = values[key]
      if (isEmptyValue(v)) return null
      return equalsAny(f, Array.isArray(v) ? v : [v])
    })
  return joinFilters([search, ...pins, base], 'and')
}

// ── the count target ────────────────────────────────────────────────────────

type CountTarget = { kind: 'store'; store: Loadable } | { kind: 'array'; rows: unknown[] }

function countTarget(source: unknown): CountTarget | null {
  if (Array.isArray(source)) return { kind: 'array', rows: source }
  const ds = asDataSource(source)
  if (ds) {
    const store = asStore(ds.store())
    if (store) return { kind: 'store', store }
  }
  // `monoArraySource` (the grid's array wrapper) has `data()` and no `store()`.
  const data = (source as { data?: () => unknown } | null)?.data
  if (typeof data === 'function') {
    const rows = data.call(source)
    if (Array.isArray(rows)) return { kind: 'array', rows }
  }
  const store = asStore(source)
  return store ? { kind: 'store', store } : null
}

type ProbeLog = ((step: string, data?: unknown) => void) | undefined

/**
 * ONE count over every relaxed field at once: `groupby((A,B))` → a row per
 * combination that exists. The caller slices it per field. Falls back to one
 * `$select=A,B` scan (and to a tally of the rows for an array source).
 */
async function countCombos(
  target: CountTarget,
  fields: readonly string[],
  filter: unknown,
  predicate: RowPredicate | null,
  gate: ApplyGate,
  log?: ProbeLog,
): Promise<MonoTupleCount[]> {
  if (target.kind === 'array') {
    const rows = predicate ? target.rows.filter((r, i) => predicate(r, i)) : target.rows
    return countTuples(rows, fields)
  }
  const grouped = await groupCountsViaApply(target.store, fields, filter, gate)
  if (grouped) {
    log?.('counted with $apply', grouped)
    return grouped
  }
  // A store that can't `$apply` (CustomStore, ArrayStore, a backend that rejected
  // it): scan the columns under the same filter and tally client-side.
  const url = odataStoreVersion(target.store) != null ? odataStoreUrl(target.store) : null
  let res: unknown
  if (url) {
    // An OData store gets the filter as TEXT in the url, like the `$apply` above —
    // devextreme's compiler would rewrite every `.` inside a raw clause to `/` (so a
    // search for "PT.A" would break). No take/skip: devextreme then follows
    // `@odata.nextLink` to the last page, so a server page cap can't cut the count.
    const odata = filter != null ? summaryODataFilter(filter) : ''
    // A path field can't be `$select`ed reliably — then fetch whole rows.
    const selectors = fields.every((f) => !isPath(f)) ? fields.join(',') : ''
    const params = [
      odata ? `$filter=${encodeURIComponent(odata)}` : '',
      selectors ? `$select=${encodeURIComponent(selectors)}` : '',
    ].filter(Boolean)
    const urlOverride = params.length ? `${url}${url.includes('?') ? '&' : '?'}${params.join('&')}` : url
    log?.('$apply unavailable — scanning', urlOverride)
    res = await target.store.load({ urlOverride, requireTotalCount: false })
  } else {
    res = await target.store.load({
      filter: filter ?? undefined,
      ...(fields.every((f) => !isPath(f)) ? { select: [...fields] } : {}),
    })
  }
  const counted = countTuples(storeRows(res), fields)
  log?.('counted by scan', counted)
  return counted
}

/** Does a row's `value` match the form's `current` (a scalar, or any of an array)? */
function matchesCurrent(value: unknown, current: unknown): boolean {
  if (isEmptyValue(current)) return true // empty = every value
  return (Array.isArray(current) ? current : [current]).some((c) => sameValue(c, value))
}

/**
 * Per-value counts for relaxing `field` alone: the combos where every OTHER relaxed
 * field still equals its form value, summed by `field`'s value.
 */
export function sliceForField(
  combos: readonly MonoTupleCount[],
  field: string,
  others: ReadonlyArray<{ field: string; current: unknown }>,
): MonoValueCount[] {
  const by = new Map<string, MonoValueCount>()
  for (const c of combos) {
    if (!others.every((o) => matchesCurrent(c.values[o.field], o.current))) continue
    const v = c.values[field]
    const k = JSON.stringify(v ?? null)
    const hit = by.get(k)
    if (hit) hit.count += c.count
    else by.set(k, { value: v, count: c.count })
  }
  return [...by.values()]
}

// ── requestType: 'count' ────────────────────────────────────────────────────

/** A devextreme store's count entry point (`$top=0&$count=true` on an ODataStore). */
interface CountableStore {
  totalCount?(options?: unknown): PromiseLike<unknown> | unknown
}

/** Per-field cap on `$count` requests when the option list is long. */
const DEFAULT_MAX_COUNT_REQUESTS = 30
/** How many `$count` requests run at once. */
const COUNT_CONCURRENCY = 4

/**
 * Rows matching `filter`, as ONE `…?$filter=<text>&$top=0&$count=true` through the
 * store (its url, `beforeSend` and auth). The filter goes as url TEXT for the same
 * reason the scan does — devextreme's compiler would mangle a raw clause. A failed
 * count counts as 0 (logged), so one bad value can't sink the rest.
 */
async function countWhere(store: CountableStore, url: string, filter: unknown, log?: ProbeLog): Promise<number> {
  const odata = filter != null ? summaryODataFilter(filter) : ''
  const urlOverride = odata ? `${url}${url.includes('?') ? '&' : '?'}$filter=${encodeURIComponent(odata)}` : url
  try {
    const n = await store.totalCount!({ urlOverride })
    return Number(n) || 0
  } catch (err) {
    log?.('a $count request failed — counted as 0', err)
    return 0
  }
}

/** `Promise.all` over `items`, at most `limit` in flight at a time, results in input order. */
async function mapLimit<T, R>(items: readonly T[], limit: number, fn: (item: T) => Promise<R>): Promise<R[]> {
  const out: R[] = new Array(items.length)
  let next = 0
  const worker = async (): Promise<void> => {
    while (next < items.length) {
      const i = next++
      out[i] = await fn(items[i])
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker))
  return out
}

// ── allowed values ──────────────────────────────────────────────────────────

/** The bound form control's surface the probe reads (select / tag-input / dropdown-table). */
interface FormControlLike {
  readonly?: boolean
  disabled?: boolean
  dataSource?: unknown
  items?: unknown[]
  keyValue?: string
  displayValue?: string | ((item: any) => string)
  label?: string
}

function controlOf(form: MonoFormController, key: string): FormControlLike | null {
  const els = typeof form._elements === 'function' ? form._elements(key) : []
  return (els[0] as FormControlLike | undefined) ?? null
}

/**
 * The field's human name: `controlMonoForm({ inputs: { [key]: { props: { label } } } })`
 * first (the form's own declaration), then the rendered control's `label`, then the key.
 */
function labelOf(form: MonoFormController, key: string, control: FormControlLike | null): string {
  let declared: unknown
  try {
    declared = typeof form._propsFor === 'function' ? form._propsFor(key)?.label : undefined
  } catch {
    declared = undefined
  }
  const label = (typeof declared === 'string' && declared) || control?.label || key
  return String(label)
}

function captionOf(row: unknown, display: FormControlLike['displayValue'], fallback: unknown): string {
  if (row != null && typeof row === 'object') {
    if (typeof display === 'function') {
      try {
        return String(display(row) ?? fallback)
      } catch {
        /* a display function that throws on a partial row — fall through */
      }
    }
    if (typeof display === 'string' && display) {
      const v = (row as Record<string, unknown>)[display]
      if (v != null) return String(v)
    }
  }
  return String(fallback ?? '')
}

/**
 * Which `candidates` the field allows, each with its caption. `null` when there is
 * NO source to check against (nothing bound, nothing configured) — the caller
 * then trusts the counts.
 */
export async function allowedValues(
  spec: MonoSuggestionValueSource | undefined,
  control: FormControlLike | null,
  field: string,
  candidates: readonly unknown[],
  log?: ProbeLog,
): Promise<Map<string, { value: unknown; caption: string }> | null> {
  const explicit =
    spec && typeof spec === 'object' && !Array.isArray(spec) && 'source' in (spec as object)
      ? (spec as { source: unknown; keyValue?: string })
      : null
  const source = explicit ? explicit.source : (spec ?? control?.dataSource ?? control?.items ?? null)
  if (source == null) return null

  const keyValue = explicit?.keyValue || control?.keyValue || field
  const display = control?.displayValue
  const out = new Map<string, { value: unknown; caption: string }>()
  const take = (row: unknown): void => {
    const v = row != null && typeof row === 'object' ? (row as Record<string, unknown>)[keyValue] : row
    const hit = candidates.find((c) => sameValue(c, v))
    if (hit === undefined || out.has(String(hit))) return
    // Write the OPTION's own value back, so the form gets the type it expects.
    out.set(String(hit), { value: v, caption: captionOf(row, display, v) })
  }

  if (Array.isArray(source)) {
    source.forEach(take)
    return out
  }

  // A DataSource: its `filter()` is where the per-user / cascading restriction
  // lives, so it rides along with the candidate OR-in.
  const ds = asDataSource(source)
  const store = ds ? asStore(ds.store()) : asStore(source)
  if (!store) return null
  const base = ds?.filter?.() ?? null
  const filter = andFilters(base, equalsAny(keyValue, candidates))
  try {
    const res = await store.load({ filter })
    storeRows(res).forEach(take)
  } catch (err) {
    // Unverifiable → suggest nothing rather than something the user can't pick.
    log?.(`the allowed-values request for ${field} failed — nothing is offered`, err)
    return out
  }
  return out
}

/**
 * EVERY option the field offers (keyed by `String(value)`, with its caption) — the
 * candidate list for `requestType: 'count'`. Same source resolution as
 * {@link allowedValues}; a DataSource is read with its own `filter()`, so the
 * per-user restriction applies. `null` when there is no option source at all.
 */
export async function optionValues(
  spec: MonoSuggestionValueSource | undefined,
  control: FormControlLike | null,
  field: string,
  log?: ProbeLog,
): Promise<Map<string, { value: unknown; caption: string }> | null> {
  const explicit =
    spec && typeof spec === 'object' && !Array.isArray(spec) && 'source' in (spec as object)
      ? (spec as { source: unknown; keyValue?: string })
      : null
  const source = explicit ? explicit.source : (spec ?? control?.dataSource ?? control?.items ?? null)
  if (source == null) return null

  const keyValue = explicit?.keyValue || control?.keyValue || field
  const display = control?.displayValue
  const out = new Map<string, { value: unknown; caption: string }>()
  const take = (row: unknown): void => {
    const v = row != null && typeof row === 'object' ? (row as Record<string, unknown>)[keyValue] : row
    if (isEmptyValue(v) || out.has(String(v))) return
    out.set(String(v), { value: v, caption: captionOf(row, display, v) })
  }

  if (Array.isArray(source)) {
    source.forEach(take)
    return out
  }
  const ds = asDataSource(source)
  const store = ds ? asStore(ds.store()) : asStore(source)
  if (!store) return null
  try {
    const filter = ds?.filter?.() ?? null
    storeRows(await store.load(filter != null ? { filter } : {})).forEach(take)
  } catch (err) {
    log?.(`the option list for ${field} failed to load — nothing is offered`, err)
  }
  return out
}

// ── the runner ──────────────────────────────────────────────────────────────

/** Rows to expand a `*` search pattern against. */
async function sampleRows(target: CountTarget): Promise<unknown[]> {
  if (target.kind === 'array') return target.rows.slice(0, 20)
  try {
    return storeRows(await target.store.load({ take: 20 }))
  } catch {
    return []
  }
}

/**
 * Probe every mapped field and return the best single-field adjustment, or `null`
 * when nothing allowed would bring rows back.
 */
export async function probeFilterSuggestion(
  cfg: MonoSuggestionFilter,
  ctx: ProbeContext,
): Promise<MonoFilterSuggestion | null> {
  const log: ProbeLog = cfg?.debug
    ? (step, data) => console.info(`[mono-table-search suggestion] ${step}`, ...(data === undefined ? [] : [data]))
    : undefined
  const keys = cfg?.keys ?? {}
  if (!Object.keys(keys).length) {
    log?.('stop: no `keys`')
    return null
  }
  const terms = ctx.grid.searchTerms ?? []
  if (!terms.some((t) => String(t?.value ?? '').trim())) {
    log?.('stop: no search term')
    return null
  }

  const target = countTarget(cfg.source ?? ctx.grid.dataSource)
  if (!target) {
    log?.('stop: no source to count on (set `source`)')
    return null
  }

  const op = cfg.searchOperation ?? DEFAULT_SEARCH_OPERATION
  let entries: MonoSearchExprEntry[] = cfg.searchValue != null
    ? parseSearchValue(cfg.searchValue)
    : [...(ctx.grid.searchValue() ?? [])]
  if (hasWildcardSearch(entries)) {
    entries = resolveSearchFields({
      searchValue: entries,
      rows: await sampleRows(target),
      remote: target.kind === 'store',
    })
  }
  if (!entries.length) {
    log?.('stop: no search fields (set `searchValue`)')
    return null
  }

  const remote = target.kind === 'store'
  const search = remote ? searchFilterFor(terms, entries, op) : null
  const searchPred = remote ? null : searchPredicateFor(terms, entries, op)
  const base = resolveBase(cfg.filter)
  const values = ctx.form.values()
  log?.('start', { terms, fields: entries, target: target.kind, formValues: values })

  // Sort the mapped fields. RELAXED: the user can change it and it is set — these are
  // grouped by and sliced below. PINNED: set but locked (readonly / disabled) — held in
  // the filter. An EMPTY field already means "every value": neither.
  const mapped = Object.entries(keys).map(([field, key]) => {
    const control = controlOf(ctx.form, key)
    return { field, key, control, current: values[key], label: labelOf(ctx.form, key, control) }
  })
  const relaxed: typeof mapped = []
  const pinned: typeof mapped = []
  for (const m of mapped) {
    if (isEmptyValue(m.current)) {
      log?.(`skip ${m.field} (form "${m.key}"): empty = already every value`)
    } else if (m.control?.readonly || m.control?.disabled) {
      log?.(`skip ${m.field} (form "${m.key}"): its control is readonly/disabled — held at ${JSON.stringify(m.current)}`)
      pinned.push(m)
    } else {
      relaxed.push(m)
    }
  }
  if (!relaxed.length) {
    log?.('nothing to suggest: no field the user can change')
    return null
  }

  // ONE request for every relaxed field: no pin on any of them, grouped by all of them
  // (`groupby((DeptKode,CompanyId))`), then each field's counts are sliced out of the
  // combinations below — rather than one request per field.
  const pinClauses = pinned.map((m) => equalsAny(m.field, Array.isArray(m.current) ? m.current : [m.current]))
  const filter = remote ? joinFilters([search, ...pinClauses, base], 'and') : null
  let predicate: RowPredicate | null = null
  if (!remote) {
    const basePred = typeof base === 'function' ? (base as RowPredicate) : compileFilterPredicate(base)
    predicate = andPredicates(searchPred, compileFilterPredicate(joinFilters(pinClauses, 'and')), basePred)
  }

  // `requestType: 'count'` — one `$count` per allowed option instead of one `$apply`.
  // Needs an OData store (it rides `store.totalCount` with the filter as url text).
  const countStore = target.kind === 'store' ? (target.store as Loadable & CountableStore) : null
  const countUrl =
    countStore && typeof countStore.totalCount === 'function' && odataStoreVersion(countStore) != null
      ? odataStoreUrl(countStore)
      : null
  const byCount = cfg.requestType === 'count' && !!countUrl
  if (cfg.requestType === 'count' && !byCount) {
    log?.('requestType "count" needs an OData store — counting with $apply / a scan instead')
  }

  let combos: MonoTupleCount[] = []
  if (!byCount) {
    try {
      combos = await countCombos(target, relaxed.map((m) => m.field), filter, predicate, ctx.gate, log)
    } catch (err) {
      log?.('stop: the count request failed', err)
      return null
    }
  }

  let best: MonoFilterSuggestion | null = null
  for (const { field, key, control, current, label } of relaxed) {
    const currentList = Array.isArray(current) ? current : [current]
    let counts: MonoValueCount[]
    let allowed: Map<string, { value: unknown; caption: string }> | null = null

    if (byCount) {
      // The candidates are the field's own options — so only values the user can pick
      // are ever counted, and no separate "allowed" check is needed afterwards.
      allowed = await optionValues(cfg.sources?.[field], control, field, log)
      if (!allowed) {
        log?.(`skip ${field}: requestType "count" needs the field's option list (a control or \`sources\`)`)
        continue
      }
      const limit = Math.max(1, Math.floor(Number(cfg.maxCountRequests ?? DEFAULT_MAX_COUNT_REQUESTS)))
      const options = [...allowed.values()].filter((o) => !currentList.some((c) => sameValue(c, o.value)))
      if (options.length > limit) {
        log?.(`${field}: ${options.length} options, counting only the first ${limit} (maxCountRequests)`)
      }
      // Every OTHER relaxed field stays at its form value (the $apply path slices the same way).
      const others = relaxed
        .filter((o) => o.field !== field)
        .map((o) => equalsAny(o.field, Array.isArray(o.current) ? o.current : [o.current]))
      counts = await mapLimit(options.slice(0, limit), COUNT_CONCURRENCY, async (o) => ({
        value: o.value,
        count: await countWhere(
          countStore!,
          countUrl!,
          joinFilters([search, ...pinClauses, ...others, base, [field, '=', o.value]], 'and'),
          log,
        ),
      }))
      log?.(`${field} counted with $count`, counts.map((c) => `${String(c.value)} (${c.count})`))
    } else {
      // Relaxing THIS field alone: every other relaxed field stays at its form value.
      counts = sliceForField(
        combos,
        field,
        relaxed.filter((o) => o.field !== field).map((o) => ({ field: o.field, current: o.current })),
      )
    }

    const candidates = counts
      .filter((c) => c.count > 0 && !isEmptyValue(c.value) && !currentList.some((v) => sameValue(v, c.value)))
      .sort((a, b) => b.count - a.count)
      .slice(0, MAX_CANDIDATES)
    if (!candidates.length) {
      log?.(`skip ${field}: no matches under any OTHER value than ${JSON.stringify(current)}`)
      continue
    }

    if (!byCount) {
      allowed = await allowedValues(
        cfg.sources?.[field],
        control,
        field,
        candidates.map((c) => c.value),
        log,
      )
    }
    const kept = allowed
      ? candidates.filter((c) => allowed.has(String(c.value)))
      : candidates
    log?.(`${field} candidates → allowed`, {
      candidates: candidates.map((c) => `${String(c.value)} (${c.count})`),
      allowed: allowed ? [...allowed.keys()] : '(no option source to check — all kept)',
    })
    if (!kept.length) {
      log?.(`skip ${field}: none of the candidates are in the user's options for "${key}"`)
      continue
    }

    let found: MonoFilterSuggestion
    if (Array.isArray(current)) {
      // Multi-value field: ADD every allowed value — all of their rows come back.
      const add = kept.map((c) => allowed?.get(String(c.value))?.value ?? c.value)
      found = {
        key,
        field,
        value: add,
        caption: kept.map((c) => allowed?.get(String(c.value))?.caption ?? String(c.value)).join(', '),
        label,
        count: kept.reduce((n, c) => n + c.count, 0),
        current,
        values: { [key]: [...current, ...add] },
      }
    } else {
      // Single-value field: switch to the value with the most rows.
      const top = kept[0]
      const hit = allowed?.get(String(top.value))
      const value = hit?.value ?? top.value
      found = {
        key,
        field,
        value,
        caption: hit?.caption ?? String(top.value),
        label,
        count: top.count,
        current,
        values: { [key]: value },
      }
    }
    if (!best || found.count > best.count) best = found
  }
  log?.(best ? 'suggest' : 'nothing to suggest', best ?? undefined)
  return best
}
