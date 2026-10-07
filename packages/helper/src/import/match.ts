/**
 * Pairing a sheet row with a table row.
 *
 * Real spreadsheets are lossy: a column gets deleted, a code is blank on some
 * rows, a name is spelled differently. So instead of demanding one exact
 * composite key, every non-empty **subset** of the declared key fields is
 * indexed, and a row is matched on the strongest subset that resolves to
 * exactly one candidate. A weaker subset is only consulted when the stronger
 * ones can't be built (a blank cell) or find nothing.
 *
 * When a subset resolves to *several* rows the match is reported **ambiguous**
 * rather than guessed at — quietly picking the first would corrupt data in a
 * way nobody notices until much later.
 *
 * Ported from `use-import-excel.ts` (`buildAllSubsets` / `buildIndexForScheme`).
 */

import { normalizeKeyValue } from './coerce'
import type { MonoImportMatch } from './types'

/** One key subset: the match legs it uses. */
export type MatchScheme<T = any> = Array<MonoImportMatch<T>>

/** A candidate table row plus its position in the target array. */
export interface TargetEntry<T = any> {
  row: T
  index: number
}

/** key string → the rows that share it (>1 means ambiguous). */
export type SchemeIndex<T = any> = Map<string, Array<TargetEntry<T>>>

/**
 * Every non-empty subset of `match` with at least `minFields` legs, ordered
 * strongest (most legs) first.
 *
 * Bit-counting rather than recursion: with `n` legs there are `2^n - 1`
 * subsets, and `n` is a handful of key columns in practice.
 */
export function buildAllSubsets<T>(match: MatchScheme<T>, minFields = 2): Array<MatchScheme<T>> {
  const out: Array<MatchScheme<T>> = []
  const n = match.length
  // A single declared key can only ever produce one-field subsets, so don't let
  // `minFields` rule out every scheme and make matching impossible.
  const min = Math.max(1, Math.min(minFields, n))

  for (let mask = (1 << n) - 1; mask >= 1; mask -= 1) {
    const subset: MatchScheme<T> = []
    for (let i = 0; i < n; i += 1) if (mask & (1 << i)) subset.push(match[i])
    if (subset.length >= min) out.push(subset)
  }

  out.sort((a, b) => b.length - a.length)
  return out
}

/** Build the composite key for one side, or `null` when a leg is missing. */
function keyOf<T>(
  scheme: MatchScheme<T>,
  read: (leg: MonoImportMatch<T>) => unknown,
  side: 'excel' | 'table',
  normalize: (v: unknown) => string,
): string | null {
  const parts: string[] = []
  for (const leg of scheme) {
    let raw = read(leg)
    if (raw === undefined || raw === null || String(raw).trim() === '') return null
    if (leg.transform) raw = leg.transform(raw, side)
    parts.push(`${leg.field}=${normalize(raw)}`)
  }
  return parts.join('|')
}

/** Index the target rows by one scheme's key. Collisions are kept, not dropped. */
export function buildSchemeIndex<T>(
  scheme: MatchScheme<T>,
  target: readonly T[],
  opts: { targetFilter?: (row: T) => boolean; normalize?: (v: unknown) => string } = {},
): SchemeIndex<T> {
  const normalize = opts.normalize ?? normalizeKeyValue
  const index: SchemeIndex<T> = new Map()

  for (let i = 0; i < target.length; i += 1) {
    const row = target[i]
    if (opts.targetFilter && !opts.targetFilter(row)) continue

    const key = keyOf(scheme, (leg) => (row as Record<string, unknown>)?.[leg.field], 'table', normalize)
    if (key === null) continue

    const bucket = index.get(key)
    if (bucket) bucket.push({ row, index: i })
    else index.set(key, [{ row, index: i }])
  }

  return index
}

/** A prepared matcher: schemes plus their indexes, reused across every sheet row. */
export interface Matcher<T = any> {
  schemes: Array<MatchScheme<T>>
  indexes: Array<SchemeIndex<T>>
  normalize: (v: unknown) => string
}

export function createMatcher<T>(
  match: MatchScheme<T>,
  target: readonly T[],
  opts: {
    minKeyFields?: number
    targetFilter?: (row: T) => boolean
    normalize?: (v: unknown) => string
  } = {},
): Matcher<T> {
  const normalize = opts.normalize ?? normalizeKeyValue
  const schemes = buildAllSubsets(match, opts.minKeyFields ?? 2)
  const indexes = schemes.map((s) =>
    buildSchemeIndex(s, target, { targetFilter: opts.targetFilter, normalize }),
  )
  return { schemes, indexes, normalize }
}

/** What a lookup produced. */
export type MatchOutcome<T = any> =
  | { kind: 'hit'; entry: TargetEntry<T>; scheme: MatchScheme<T> }
  | { kind: 'ambiguous'; candidates: number; scheme: MatchScheme<T> }
  | { kind: 'miss' }

/**
 * Find the table row for one sheet row, strongest scheme first.
 *
 * An ambiguous hit is remembered but doesn't stop the search — a weaker scheme
 * can't disambiguate, but a *different* subset of the same size might, and only
 * if nothing unique is ever found is the ambiguity reported.
 */
export function findMatch<T>(
  matcher: Matcher<T>,
  readExcel: (leg: MonoImportMatch<T>) => unknown,
): MatchOutcome<T> {
  let ambiguous: { candidates: number; scheme: MatchScheme<T> } | null = null

  for (let i = 0; i < matcher.schemes.length; i += 1) {
    const scheme = matcher.schemes[i]
    const key = keyOf(scheme, readExcel, 'excel', matcher.normalize)
    if (key === null) continue

    const bucket = matcher.indexes[i].get(key)
    if (!bucket || !bucket.length) continue

    if (bucket.length === 1) return { kind: 'hit', entry: bucket[0], scheme }
    if (!ambiguous) ambiguous = { candidates: bucket.length, scheme }
  }

  if (ambiguous) return { kind: 'ambiguous', ...ambiguous }
  return { kind: 'miss' }
}
