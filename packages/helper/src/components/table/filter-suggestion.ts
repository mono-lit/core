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
import { toODataClause } from '../../search/field-path'
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
import { storeRows, type ApplyGate } from '../../utils/data-source-apply'
import { countValues, groupCountViaApply, type MonoValueCount } from '../../utils/group-count'

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

/** The search as a devextreme filter array (remote) — `null` when there is nothing to search. */
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
          typeof e === 'string' ? (toODataClause(e, operation, value) as unknown) : customRemoteClause(e, value, operation),
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

async function countByField(
  target: CountTarget,
  field: string,
  filter: unknown,
  predicate: RowPredicate | null,
  gate: ApplyGate,
): Promise<MonoValueCount[]> {
  if (target.kind === 'array') {
    const rows = predicate ? target.rows.filter((r, i) => predicate(r, i)) : target.rows
    return countValues(rows, field)
  }
  const grouped = await groupCountViaApply(target.store, field, filter, gate)
  if (grouped) return grouped
  // A store that can't `$apply` (CustomStore, ArrayStore, a backend that rejected
  // it): scan the one column under the same filter and tally client-side.
  const res = await target.store.load({ filter: filter ?? undefined, select: [field] })
  return countValues(storeRows(res), field)
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
}

function controlOf(form: MonoFormController, key: string): FormControlLike | null {
  const els = typeof form._elements === 'function' ? form._elements(key) : []
  return (els[0] as FormControlLike | undefined) ?? null
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
  } catch {
    // Unverifiable → suggest nothing rather than something the user can't pick.
    return out
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
  const keys = cfg?.keys ?? {}
  if (!Object.keys(keys).length) return null
  const terms = ctx.grid.searchTerms ?? []
  if (!terms.some((t) => String(t?.value ?? '').trim())) return null

  const target = countTarget(cfg.source ?? ctx.grid.dataSource)
  if (!target) return null

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
  if (!entries.length) return null

  const remote = target.kind === 'store'
  const search = remote ? searchFilterFor(terms, entries, op) : null
  const searchPred = remote ? null : searchPredicateFor(terms, entries, op)
  const base = resolveBase(cfg.filter)
  const values = ctx.form.values()

  let best: MonoFilterSuggestion | null = null
  for (const [field, key] of Object.entries(keys)) {
    const control = controlOf(ctx.form, key)
    // The user can't change this one — never offer to.
    if (control?.readonly || control?.disabled) continue
    const current = values[key]
    // Empty = "all values" already: there is nothing to relax.
    if (isEmptyValue(current)) continue

    const filter = buildProbeFilter(field, keys, values, search, remote ? base : null)
    let predicate: RowPredicate | null = null
    if (!remote) {
      const pins = buildProbeFilter(field, keys, values, null, null)
      const basePred = typeof base === 'function' ? (base as RowPredicate) : compileFilterPredicate(base)
      predicate = andPredicates(searchPred, compileFilterPredicate(pins), basePred)
    }

    let counts: MonoValueCount[]
    try {
      counts = await countByField(target, field, filter, predicate, ctx.gate)
    } catch {
      continue
    }

    const currentList = Array.isArray(current) ? current : [current]
    const candidates = counts
      .filter((c) => c.count > 0 && !isEmptyValue(c.value) && !currentList.some((v) => sameValue(v, c.value)))
      .sort((a, b) => b.count - a.count)
      .slice(0, MAX_CANDIDATES)
    if (!candidates.length) continue

    const allowed = await allowedValues(cfg.sources?.[field], control, field, candidates.map((c) => c.value))
    const kept = allowed
      ? candidates.filter((c) => allowed.has(String(c.value)))
      : candidates
    if (!kept.length) continue

    let found: MonoFilterSuggestion
    if (Array.isArray(current)) {
      // Multi-value field: ADD every allowed value — all of their rows come back.
      const add = kept.map((c) => allowed?.get(String(c.value))?.value ?? c.value)
      found = {
        key,
        field,
        value: add,
        caption: kept.map((c) => allowed?.get(String(c.value))?.caption ?? String(c.value)).join(', '),
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
        count: top.count,
        current,
        values: { [key]: value },
      }
    }
    if (!best || found.count > best.count) best = found
  }
  return best
}
