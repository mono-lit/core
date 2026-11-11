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
  if (gate.skip) return null
  if (parseFieldPath(field).hasWildcard) return null
  const selector = isPath(field) ? toODataSelector(field) : field
  if (!selector) return null

  const apply = `groupby((${selector}),aggregate($count as count))`
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
  // Grouped rows are the key plus a numeric `count` and nothing else; entities
  // carry the rest of the record — a server either honoured `$apply` or it did not.
  const first = rows[0]
  if (!first || typeof first !== 'object' || typeof first.count !== 'number') return null
  if (!isRolledUp(rows, [field, 'count'])) return null

  const path = isPath(field)
  return rows.map((r) => ({
    value: path ? getFieldValue(r, field) : r[field],
    count: Number(r.count) || 0,
  }))
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
