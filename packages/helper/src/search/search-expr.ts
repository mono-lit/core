/**
 * Search-expression entries: the fields a typed term is matched against.
 *
 * One grammar, shared by every component that searches data — `monoDataGrid`'s
 * `searchExpr`, and the `search-value` prop on `mono-select`, `mono-tag-input`
 * and `mono-dropdown-table`. An entry may be:
 *
 * - a plain column name (`'Nama'`)
 * - a **path** (`'Company.Name'`, `'Transaction.[1].Name'`, `'Transaction.[*].Price'`)
 * - a **`*` pattern** (`'*'`, `'Company.*'`, `'*.*'`, `'*.[*].*'`)
 * - a **`{ field, custom }` clause builder**
 *
 * An entry is normally just a column name, and every column is searched the same
 * way — `contains(<col>,'<term>')`. That is wrong for any column whose data isn't
 * free text: a **boolean** can't take `contains` at all, and a **coded** column
 * stores something the user never types (a `Month` of `0..11` can never match the
 * string `"Jan"`).
 *
 * So an entry may instead be `{ field, custom }`, where `custom` receives the live
 * term and returns the clause to use for that column:
 *
 * ```ts
 * const MONTHS = ['Jan', 'Feb', 'Mar', …]
 *
 * searchExpr: [
 *   'Code',
 *   'Nama',
 *   { field: 'Active', custom: ({ field, value }) => `${field} eq ${value}` },
 *   { field: 'Month',  custom: ({ field, value }) => [field, '=', MONTHS.indexOf(value)] },
 * ]
 * ```
 *
 * A custom column takes part in the plain search box like any other, so it runs on
 * every term. **Return `null`/`undefined` to opt out** of one — which is what makes
 * the `Month` example workable: `"Jan"` → `0`, `"zzz"` → `-1` → return `null` and
 * the column simply drops out of that query instead of matching nothing.
 *
 * | `custom` returns | remote (devextreme store) | array / in-memory |
 * | --- | --- | --- |
 * | `[field, op, value]`, or a nested `and`/`or` array | used as-is | compiled to a predicate |
 * | `(row) => boolean` | warn + skip | used as the predicate |
 * | `"Active eq true"` (raw OData) | wrapped as `[raw]` | warn + skip |
 * | `null` / `undefined` / `false` | skipped | skipped |
 *
 * Only the explicit `{ field, custom }` shape is accepted — a `{ Month: fn }` map
 * is not, so there is exactly one form to read and to type.
 *
 * An entry may also be a **`*` pattern**, resolved against the loaded rows so a
 * grid can search everything without listing columns:
 *
 * ```ts
 * searchExpr: ['*']                     // every top-level field
 * searchExpr: ['*', '*.[*].*']          // …plus every field of every array expand
 * searchExpr: ['*', '*.*']              // …plus every field of every object expand
 * searchExpr: ['*', { field: 'Month', custom }]   // the explicit entry wins for Month
 * ```
 *
 * Patterns read literally, segment by segment — `'*.[*].*'` covers the expand ONLY.
 * See {@link expandWildcard} for the type rule that keeps a remote `$filter` valid.
 *
 * This module is pure: types + stateless helpers, no controller state, mirroring
 * `field-path.ts`.
 */

import { compileFilterPredicate } from './filter-eval.js'
import { parseFieldPath } from './field-path.js'

/** What a `custom` builder is handed for the term being applied. */
export interface MonoSearchCustomCtx {
  /** The column this entry declares — echoed so the builder needn't repeat it. */
  field: string
  /** The raw text the user typed, exactly as typed. */
  value: string
  /** The grid's configured `searchOperation` (default `'contains'`). */
  operation: string
}

/**
 * What a `custom` builder may return. `null` / `undefined` / `false` all mean
 * "this column has nothing to say about this term" — skip it.
 */
export type MonoSearchCustomResult =
  | string
  | unknown[]
  | ((row: any) => boolean)
  | null
  | undefined
  | false

/** A `searchExpr` entry that builds its own clause. */
export interface MonoSearchExprCustom {
  /** Column this entry covers — the name a bound `MonoSearchTerm.field` matches. */
  field: string
  /** Build the clause for one term. See {@link MonoSearchCustomResult}. */
  custom: (ctx: MonoSearchCustomCtx) => MonoSearchCustomResult
}

/** One `searchExpr` entry: a plain column name, or a custom builder. */
export type MonoSearchExprEntry = string | MonoSearchExprCustom

/** The `searchExpr` option: one entry or a list. */
export type MonoSearchExpr = MonoSearchExprEntry | MonoSearchExprEntry[]

/** Entries already warned about, so a per-keystroke path can't flood the console. */
const warned = new WeakSet<object>()

function warnOnce(key: object, message: string): void {
  if (warned.has(key)) return
  warned.add(key)
  console.warn(`[@mono-lit/helper] ${message}`)
}

/** Malformed entries are warned about once each, keyed by the object itself. */
function isCustomEntry(entry: unknown): entry is MonoSearchExprCustom {
  if (typeof entry !== 'object' || entry === null) return false
  const e = entry as Partial<MonoSearchExprCustom>
  if (typeof e.field === 'string' && e.field && typeof e.custom === 'function') return true
  warnOnce(
    entry as object,
    `searchExpr: ignoring an entry that is neither a column name nor { field, custom } — ${JSON.stringify(
      Object.keys(entry as object),
    )}. The { Field: fn } shorthand is not supported.`,
  )
  return false
}

/** Every usable entry, in the order written. Strings and customs, malformed dropped. */
export function normalizeSearchExpr(expr: MonoSearchExpr | undefined): MonoSearchExprEntry[] {
  if (expr == null) return []
  const list = Array.isArray(expr) ? expr : [expr]
  const out: MonoSearchExprEntry[] = []
  for (const entry of list) {
    if (typeof entry === 'string') {
      if (entry) out.push(entry)
    } else if (isCustomEntry(entry)) {
      out.push(entry)
    }
  }
  return out
}

/**
 * The plain column names only — no `{ field, custom }` entries, no `*` patterns.
 *
 * This is what a SOURCE may be handed: `monoArraySource`, `storeGroupSource` and
 * devextreme all type `searchExpr` as `string | string[]` and feed it straight to
 * `toODataClause` — an object entry would serialize to garbage and a `'*'` would
 * be searched as a column literally named `*`. Both are resolved by the controller
 * instead.
 */
export function plainSearchColumns(expr: MonoSearchExpr | undefined): string[] {
  return normalizeSearchExpr(expr).filter(
    (e): e is string => typeof e === 'string' && !isWildcardPattern(e),
  )
}

/** The field name an entry covers. */
export function searchEntryField(entry: MonoSearchExprEntry): string {
  return typeof entry === 'string' ? entry : entry.field
}

/** The entry declaring `field`, if any — used to resolve a column-bound term. */
export function searchEntryFor(
  expr: MonoSearchExpr | undefined,
  field: string,
): MonoSearchExprEntry | undefined {
  return normalizeSearchExpr(expr).find((e) => searchEntryField(e) === field)
}

/** Whether any entry brings its own builder (so folding must be bypassed). */
export function hasCustomSearch(expr: MonoSearchExpr | undefined): boolean {
  return normalizeSearchExpr(expr).some((e) => typeof e !== 'string')
}

// ── `*` patterns ─────────────────────────────────────────────────────────────
//
// A `*` SEGMENT means "every key at this level", so the entry is a pattern that
// resolves against the actual data instead of naming one column:
//
//   '*'          every top-level field
//   '*.*'        every field of every nested OBJECT
//   '*.[*].*'    every field of every element of every nested ARRAY
//
// Read literally, position by position — `'*.[*].*'` covers the expand ONLY, so
// pair it with `'*'` to search both levels. `[*]` keeps its existing meaning (fan
// out over an array), which is why `'User.[*].Name'` is a concrete path and not a
// pattern: a pattern needs at least one `*` used as a KEY.

/** Whether `field` is a `*` pattern rather than a concrete column/path. */
export function isWildcardPattern(field: string): boolean {
  if (typeof field !== 'string' || !field.includes('*')) return false
  return parseFieldPath(field).segments.some((s) => s.kind === 'key' && s.name === '*')
}

/** A value that can be searched as-is (anything that isn't a container). */
function isLeaf(value: unknown): boolean {
  return value !== null && typeof value !== 'object'
}

const isPlainObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

/** How many rows to sample when resolving a pattern (row 0 alone may be sparse). */
const SAMPLE_ROWS = 20

/**
 * Resolve a `*` pattern against real rows, returning the concrete field paths it
 * covers — `'*.[*].*'` over `{ Detail: [{ Bulan, Ket }] }` gives
 * `['Detail.[*].Bulan', 'Detail.[*].Ket']`, which the existing path machinery
 * already knows how to match client-side and translate to an OData lambda.
 *
 * `textOnly` drops every leaf that isn't a string. A REMOTE source needs that:
 * `contains(Price,'x')` is not valid OData and would reject the whole request, so
 * a wildcard never emits a clause for a numeric/boolean/date column. Give such a
 * column an explicit `{ field, custom }` entry instead. In-memory sources compare
 * stringified values, so they keep every leaf.
 *
 * A field that is `null`/`undefined` in every sampled row is skipped — there is
 * nothing to type it by.
 */
export function expandWildcard(
  pattern: string,
  rows: readonly unknown[],
  textOnly: boolean,
): string[] {
  const { segments } = parseFieldPath(pattern)
  const found = new Set<string>()

  for (const row of rows.slice(0, SAMPLE_ROWS)) {
    // Each candidate carries the path built so far and the value it points at.
    let candidates: Array<{ path: string[]; value: unknown }> = [{ path: [], value: row }]

    for (const seg of segments) {
      const next: Array<{ path: string[]; value: unknown }> = []
      for (const { path, value } of candidates) {
        if (value == null) continue
        if (seg.kind === 'wildcard') {
          // `[*]` — fan out over the array, the path segment stays literal.
          if (Array.isArray(value)) {
            for (const el of value) next.push({ path: [...path, '[*]'], value: el })
          }
        } else if (seg.kind === 'index') {
          if (Array.isArray(value)) {
            next.push({ path: [...path, `[${seg.index}]`], value: value[seg.index] })
          }
        } else if (seg.name === '*') {
          // `*` — every own key at this level.
          if (isPlainObject(value)) {
            for (const key of Object.keys(value)) {
              next.push({ path: [...path, key], value: value[key] })
            }
          }
        } else if (isPlainObject(value)) {
          next.push({ path: [...path, seg.name], value: value[seg.name] })
        }
      }
      candidates = next
      if (!candidates.length) break
    }

    for (const { path, value } of candidates) {
      if (!path.length || !isLeaf(value)) continue
      if (textOnly && typeof value !== 'string') continue
      found.add(path.join('.'))
    }
  }

  return [...found]
}

/** Options for {@link resolveSearchEntries}. */
export interface ResolveSearchOptions {
  /** Rows to resolve `*` patterns against (the loaded data). */
  rows?: readonly unknown[]
  /** Keep only string-valued leaves — required for a remote OData source. */
  textOnly?: boolean
}

/**
 * The entries a search actually runs over: every `*` pattern replaced by the
 * concrete fields it resolves to, in place.
 *
 * **An explicitly named field always wins.** A field named anywhere in the list —
 * as a plain string or as `{ field, custom }` — is dropped from every pattern
 * expansion regardless of order, so `['*', { field: 'Name', custom }]` and
 * `[{ field: 'Name', custom }, '*']` both search `Name` with the custom, exactly
 * once, at the position it was written.
 */
export function resolveSearchEntries(
  expr: MonoSearchExpr | undefined,
  options: ResolveSearchOptions = {},
): MonoSearchExprEntry[] {
  const entries = normalizeSearchExpr(expr)
  if (!entries.some((e) => typeof e === 'string' && isWildcardPattern(e))) return entries

  const { rows = [], textOnly = false } = options
  const explicit = new Set(
    entries
      .filter((e) => typeof e !== 'string' || !isWildcardPattern(e))
      .map((e) => searchEntryField(e)),
  )

  const out: MonoSearchExprEntry[] = []
  const seen = new Set<string>()
  for (const entry of entries) {
    if (typeof entry === 'string' && isWildcardPattern(entry)) {
      for (const field of expandWildcard(entry, rows, textOnly)) {
        if (explicit.has(field) || seen.has(field)) continue
        seen.add(field)
        out.push(field)
      }
      continue
    }
    const field = searchEntryField(entry)
    if (seen.has(field)) continue
    seen.add(field)
    out.push(entry)
  }
  return out
}

/** Whether any entry is a `*` pattern (so folding must be bypassed). */
export function hasWildcardSearch(expr: MonoSearchExpr | undefined): boolean {
  return normalizeSearchExpr(expr).some((e) => typeof e === 'string' && isWildcardPattern(e))
}

/** Run the builder, guarding against a throw in consumer code. */
function runCustom(
  entry: MonoSearchExprCustom,
  value: string,
  operation: string,
): MonoSearchCustomResult {
  try {
    return entry.custom({ field: entry.field, value, operation })
  } catch (error) {
    warnOnce(entry, `searchExpr custom for "${entry.field}" threw — column skipped. ${error}`)
    return null
  }
}

/**
 * The devextreme filter clause for one custom entry + term, or `null` to skip it.
 *
 * A raw string is wrapped as `[raw]` — the single-member raw-passthrough clause
 * devextreme honours inside a filter array, the same shape `toODataClause` emits
 * for a wildcard lambda, so it slots into the OR/AND groups unchanged.
 */
export function customRemoteClause(
  entry: MonoSearchExprCustom,
  value: string,
  operation: string,
): unknown | null {
  const result = runCustom(entry, value, operation)
  if (result == null || result === false) return null

  if (typeof result === 'string') return result ? [result] : null
  if (Array.isArray(result)) return result.length ? result : null

  if (typeof result === 'function') {
    warnOnce(
      entry,
      `searchExpr custom for "${entry.field}" returned a predicate function, which a remote source can't send — column skipped. Return a filter array or an OData string for remote sources.`,
    )
  }
  return null
}

/**
 * The client-side row predicate for one custom entry + term, or `null` to skip it.
 *
 * Filter arrays go through `compileFilterPredicate`, which already understands
 * nested `and`/`or` groups, `['!', …]` negation and path fields — so the SAME
 * `[field, op, value]` a remote source receives also narrows an array source.
 */
export function customPredicate(
  entry: MonoSearchExprCustom,
  value: string,
  operation: string,
): ((row: any) => boolean) | null {
  const result = runCustom(entry, value, operation)
  if (result == null || result === false) return null

  if (typeof result === 'function') return result as (row: any) => boolean
  if (Array.isArray(result)) return result.length ? compileFilterPredicate(result) : null

  if (typeof result === 'string') {
    warnOnce(
      entry,
      `searchExpr custom for "${entry.field}" returned the raw OData string ${JSON.stringify(
        result,
      )}, which only a remote source can use — column skipped for this in-memory source. Return a filter array to support both.`,
    )
  }
  return null
}
