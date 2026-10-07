import { MonoGridSource, MonoServerGroupSource } from './mono-data-grid.js';
type SummaryType = 'sum' | 'avg' | 'min' | 'max' | 'count';
export interface StoreGroupSourceConfig {
    /** The single field to group by. */
    groupField: string;
    /** Columns to fetch for a group's rows (omit = all). */
    select?: string[];
    /** Columns matched by search. */
    searchExpr?: string | string[];
    /** Search operation (default `'contains'`). */
    searchOperation?: string;
    /** Per-group aggregates, e.g. `{ TotalBudget: 'sum' }`. */
    groupSummary?: Record<string, SummaryType>;
}
/**
 * Build a {@link MonoServerGroupSource} that drives **server-side** group paging
 * straight from a devextreme `DataSource`'s store — no extra fetcher, no custom
 * callbacks. `loadGroups` issues one cheap grouped query (group keys + counts +
 * optional summaries, no rows); `loadRows` fetches a single group's page with
 * `$filter` + `$skip`/`$top`. Returns `null` if the source has no usable store
 * (e.g. a plain in-memory array), so the caller can fall back to client grouping.
 */
export declare function storeGroupSource<T = any>(source: MonoGridSource<T>, config: StoreGroupSourceConfig): MonoServerGroupSource<T> | null;
export {};
