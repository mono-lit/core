/**
 * Per-value row counts for ONE field, as `{ value, count }` rows.
 *
 * Two consumers share this: the grid's header filter (`distinctValues`) and the
 * table search's filter suggestion (`components/table/filter-suggestion.ts`),
 * which asks "how many rows match this search under each OTHER value of Dept".
 *
 * Remote: one `$apply=filter(…)/groupby((field),aggregate($count as count))`
 * through the store (see `data-source-apply.ts` for why it rides `urlOverride`).
 * Array: a plain tally over the rows.
 */
import { getFieldValue, isPath, parseFieldPath, toODataSelector } from '../search/field-path'
import { isRolledUp, loadApply, type ApplyGate } from './data-source-apply'
import { summaryODataFilter } from './data-source-summary'

export interface MonoValueCount {
  value: unknown
  count: number
}

/**
 * Group-count `field` through `store` with ONE `$apply`, or `null` when that path
 * is not available — the gate is off, a wildcard path (nothing to group by), a
 * store that cannot carry an `$apply` (a CustomStore), a failed request (reported
 * to the gate), or a response that is not rolled up (a server that ignored the
 * clause). An EMPTY grouped result is a real answer and comes back as `[]`.
 *
 * The rows are returned in server order — the caller sorts.
 */
export async function groupCountViaApply(
  store: unknown,
  field: string,
  filter: unknown,
  gate: ApplyGate,
  options: { top?: number } = {},
): Promise<MonoValueCount[] | null> {
  const rows = await groupCountsViaApply(store, [field], filter, gate, options)
  return rows ? rows.map((r) => ({ value: r.values[field], count: r.count })) : null
}

/** One row of a multi-field group count: the value of each grouped field, and how many rows. */
export interface MonoTupleCount {
  values: Record<string, unknown>
  count: number
}

/**
 * {@link groupCountViaApply} over SEVERAL fields at once — one
 * `groupby((A,B),aggregate($count as count))` request, one row per combination
 * that exists. Same `null` contract.
 */
export async function groupCountsViaApply(
  store: unknown,
  fields: readonly string[],
  filter: unknown,
  gate: ApplyGate,
  options: { top?: number } = {},
): Promise<MonoTupleCount[] | null> {
  if (gate.skip || !fields.length) return null
  const selectors: string[] = []
  for (const field of fields) {
    if (parseFieldPath(field).hasWildcard) return null
    const selector = isPath(field) ? toODataSelector(field) : field
    if (!selector) return null
    selectors.push(selector)
  }

  const apply = `groupby((${selectors.join(',')}),aggregate($count as count))`
  const odataFilter = filter != null ? summaryODataFilter(filter) : ''
  const clause = odataFilter ? `filter(${odataFilter})/${apply}` : apply
  const top = typeof options.top === 'number' && options.top >= 0 ? options.top : undefined

  let rows: Array<Record<string, unknown>> | null
  try {
    rows = await loadApply(store, clause, { top })
  } catch (err) {
    gate.reject(err)
    return null
  }
  if (!rows) return null
  if (!rows.length) return []
  // Grouped rows are the key(s) plus a numeric `count` and nothing else; entities
  // carry the rest of the record — a server either honoured `$apply` or it did not.
  // The count may arrive as a numeric STRING (an Int64 / Decimal aggregate under
  // ASP.NET OData's IEEE754-compatible serialisation), which is still a count.
  const first = rows[0]
  if (!first || typeof first !== 'object' || !isCount(first.count)) return null
  if (!isRolledUp(rows, [...fields, 'count'])) return null

  return rows.map((r) => ({ values: pickValues(r, fields), count: Number(r.count) || 0 }))
}

/** Each field's value off a row, path-aware. */
function pickValues(row: unknown, fields: readonly string[]): Record<string, unknown> {
  const out: Record<string, unknown> = {}
  for (const f of fields) {
    out[f] = isPath(f) ? getFieldValue(row, f) : (row as Record<string, unknown> | null)?.[f]
  }
  return out
}

/** {@link countValues} over several fields: one tuple per combination, with its row count. */
export function countTuples(rows: readonly unknown[], fields: readonly string[]): MonoTupleCount[] {
  const by = new Map<string, MonoTupleCount>()
  for (const r of rows) {
    const values = pickValues(r, fields)
    const key = JSON.stringify(fields.map((f) => values[f] ?? null))
    const hit = by.get(key)
    if (hit) hit.count++
    else by.set(key, { values, count: 1 })
  }
  return [...by.values()]
}

/** A number, or a string that is one (`"12"`). */
function isCount(v: unknown): boolean {
  if (typeof v === 'number') return Number.isFinite(v)
  return typeof v === 'string' && v.trim() !== '' && Number.isFinite(Number(v))
}

/** Count occurrences of `field` across `rows` (path-aware; a wildcard path flattens). */
export function countValues(rows: readonly unknown[], field: string): MonoValueCount[] {
  const counts = new Map<unknown, number>()
  const bump = (v: unknown): void => {
    counts.set(v, (counts.get(v) ?? 0) + 1)
  }
  const path = isPath(field)
  for (const r of rows) {
    if (path) {
      const v = getFieldValue(r, field)
      if (Array.isArray(v)) v.forEach(bump)
      else bump(v)
    } else {
      bump((r as Record<string, unknown> | null)?.[field])
    }
  }
  return [...counts.entries()].map(([value, count]) => ({ value, count }))
}
