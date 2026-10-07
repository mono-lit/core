import { SortOrder } from './mono-data-grid.js';
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
export declare function nextOrder(current: SortOrder, noClear?: boolean): SortOrder;
/** `aria-sort` value for the parent header cell. */
export declare function ariaSort(current: SortOrder): string;
/**
 * Native tooltip text shown on hover — reflects the current sort direction and,
 * when more than one column is sorted, this column's precedence (which the
 * `<sup>` badge shows visually).
 */
export declare function sortTitle(current: SortOrder, seq?: number, total?: number): string;
