import { MonoGridSource } from './mono-data-grid';
import { MonoSearchValue } from '../../search/data-search';
export interface MonoArraySourceOptions {
    /** Rows per page (default 10). */
    pageSize?: number;
    /** Row key field for per-row `update` (default `'Id'`). */
    keyExpr?: string;
    /**
     * Columns matched by `setSearch`, as an array or a comma-separated string.
     *
     * Same four interchangeable names as {@link monoDataGrid} — `searchValue`,
     * `search-value`, `searchExpr`, `search-expr` — so a demo or app can spell it
     * one way throughout. Plain column names and path expressions only: `*`
     * patterns and `{ field, custom }` entries are resolved by the CONTROLLER, and
     * it hands this source only `plainSearchColumns(...)`.
     */
    searchValue?: MonoSearchValue;
    'search-value'?: MonoSearchValue;
    /** Alias of {@link searchValue}, under devextreme's name. */
    searchExpr?: MonoSearchValue;
    'search-expr'?: MonoSearchValue;
    /**
     * Group-by field(s). When set, a grouped input payload (devextreme
     * `type:'data'` shape) is flattened to its leaf records, so paging / search /
     * sort all run over the underlying rows; {@link monoDataGrid} rebuilds the
     * group tree per page.
     */
    group?: string | string[];
}
/**
 * Wrap a plain array in the structural {@link MonoGridSource} shape so
 * {@link monoDataGrid} can drive it with no devextreme DataSource — paging,
 * search and filtering all run client-side, in memory.
 *
 * @example
 * const source = monoArraySource(rows, { pageSize: 10, searchValue: ['name'] })
 * const table = monoDataGrid(source)
 * await table.load()
 * // later: source.setData(nextRows)  // swap the underlying array
 */
export declare function monoArraySource<T = any>(data?: T[], opts?: MonoArraySourceOptions): MonoGridSource<T> & {
    setData: (next: T[]) => Promise<T[]>;
    update: (key: unknown, values: Record<string, unknown>) => Promise<T[]>;
};
