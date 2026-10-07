import type { SortOrder } from './mono-data-grid.js'

/**
 * Pure sort-cycle helpers shared by `mono-table-sort` and `mono-table-th` so the
 * two header controls behave identically. Kept dependency-free (no Lit/DOM) so
 * both cores can import them.
 */

/**
 * The next direction when a sortable header is clicked.
 * - default cycle: `null → asc → desc → null`
 * - `noClear`: `asc ↔ desc` (never returns to `null`)
 */
export function nextOrder(current: SortOrder, noClear = false): SortOrder {
  if (current === 'asc') return 'desc'
  if (current === 'desc') return noClear ? 'asc' : null
  return 'asc'
}

/** `aria-sort` value for the parent header cell. */
export function ariaSort(current: SortOrder): string {
  return current === 'asc' ? 'ascending' : current === 'desc' ? 'descending' : 'none'
}

/** `1 → '1st'`, `2 → '2nd'` … used in the sort button's tooltip. */
function ordinal(n: number): string {
  const rem100 = n % 100
  if (rem100 >= 11 && rem100 <= 13) return `${n}th`
  return `${n}${['th', 'st', 'nd', 'rd'][n % 10] ?? 'th'}`
}

/**
 * Native tooltip text shown on hover — reflects the current sort direction and,
 * when more than one column is sorted, this column's precedence (which the
 * `<sup>` badge shows visually).
 */
export function sortTitle(current: SortOrder, seq = 0, total = 0): string {
  const base =
    current === 'asc' ? 'Sorted ascending' : current === 'desc' ? 'Sorted descending' : 'Click to sort'
  if (!current || total < 2 || seq < 1) return base
  return `${base} (${ordinal(seq)} of ${total})`
}
