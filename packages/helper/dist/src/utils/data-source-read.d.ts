import { andFilters } from '../search/filter-eval';
import { unwrapReactive } from '../composables/reactive';
/** The structural surface of a devextreme DataSource this module touches. */
export interface ReadableDataSource<T = any> {
    load(): PromiseLike<T[]> | T[];
    items(): T[];
    store?(): ReadableStore | undefined;
    filter?(value?: unknown): unknown;
    /** The source's own `$select`, inherited by a drain unless overridden. */
    select?(value?: unknown): unknown;
    sort?(value?: unknown): unknown;
    searchValue?(value?: unknown): unknown;
    searchExpr?(value?: unknown): unknown;
    searchOperation?(value?: string): string;
    paginate?(value?: boolean): boolean;
    pageIndex?(value?: number): number;
    totalCount?(): number;
}
/** The structural surface of a devextreme store. */
export interface ReadableStore {
    load(options?: unknown): PromiseLike<unknown> | unknown;
    key?(): unknown;
    byKey?(key: unknown): unknown;
    /** OData protocol version (a devextreme `ODataStore`); absent on a CustomStore. */
    version?(): number;
}
export interface ReadAllRowsOptions {
    /**
     * Rows per request (default `100`). The total is unknowable up front for a
     * remote source, so the read walks in fixed chunks until one comes back short.
     */
    chunkSize?: number;
    /** Restrict the columns fetched (remote sources only). */
    select?: string[];
    /** Sort override. Defaults to whatever the source itself carries. */
    sort?: unknown;
    /**
     * An extra filter AND-ed onto the source's own (and its search) — a controller's
     * base, which is not written on the source when the read goes to the STORE.
     * Remote sources only; an array source is filtered by what it holds.
     */
    filter?: unknown;
    /** Extra load options spread into every chunk request (`expand`, `customQueryParams`, …). */
    loadOptions?: Record<string, unknown>;
}
/**
 * Unwrap Vue reactivity. A `ref(dataSource)` renders as nothing (the template
 * sees the wrapper, not the source), and a *reactive proxy* around a DataSource
 * can break its internals — devextreme stores identity-sensitive state that
 * doesn't survive being proxied.
 *
 * Re-exported (not redefined) from `composables/reactive` so the components that
 * need the same unwrap for value identity share one implementation.
 */
export { unwrapReactive };
/** A devextreme DataSource: it both loads and holds a current page. */
export declare function isDataSourceLike(value: unknown): value is ReadableDataSource;
/** A bare store (ODataStore / CustomStore / ArrayStore) — loads, but has no page. */
export declare function isStoreLike(value: unknown): value is ReadableStore;
/** Anything this module can drain into an array. */
export declare function isReadableSource(value: unknown): boolean;
/**
 * Build a devextreme filter expression for a DataSource's **active search**.
 *
 * This is the subtle one. `searchValue` / `searchExpr` are DataSource-level
 * options: the DataSource folds them into the request it sends to its store.
 * Reading the store directly bypasses them entirely — so an export would
 * silently include rows the user filtered away with `<mono-table-search>`.
 * Reconstructing the filter here keeps the store path faithful to the grid.
 */
export declare function searchFilterOf(source: ReadableDataSource): unknown;
/**
 * AND-combine two optional devextreme filter expressions.
 *
 * Re-exported (not redefined) from the shared search module so the grid's filter
 * composition and a drain's composition can never disagree.
 */
export { andFilters };
/**
 * Read every row a source can produce, in chunks.
 *
 * A plain array passes straight through, so callers can accept
 * "array or DataSource" without branching.
 */
export declare function readAllRows<T = any>(source: unknown, options?: ReadAllRowsOptions): Promise<T[]>;
