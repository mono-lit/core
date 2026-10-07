import { ReactiveController, ReactiveControllerHost } from 'lit';
/**
 * Minimal structural shape of a devextreme DataSource. Declared locally so
 * @mono-lit/helper stays dependency-free; a real devextreme DataSource satisfies it.
 */
export interface MonoDataSource<T = unknown> {
    load: () => PromiseLike<T[]> | T[];
    items: () => T[];
    isLoading?: () => boolean;
    on(event: string, handler: (...args: unknown[]) => void): void;
    off(event: string, handler: (...args: unknown[]) => void): void;
    paginate?(value?: boolean): boolean;
    pageSize?(value?: number): number;
    pageIndex?(value?: number): number;
    isLastPage?: () => boolean;
    totalCount?: () => number;
}
/**
 * Incremental loading mode. Works with BOTH a paged DataSource and a plain
 * `items` array (the array is revealed one `pageSize` chunk at a time):
 * - 'button' → render a "Load more" button at the end of the list.
 * - 'scroll' → load/reveal the next chunk when scrolled near the bottom.
 */
export type LoadMoreMode = 'button' | 'scroll';
export interface DataSourceControllerOptions<T> {
    /** Current bound DataSource (or null) — read live from the host property. */
    getDataSource: () => MonoDataSource<T> | null;
    /** The raw plain `items` array, used when no DataSource is bound. */
    getItems: () => T[];
    /** Auto-load the source on attach when it has no items yet. */
    getImmediate: () => boolean;
    /** Effective load-more mode, or undefined when disabled. */
    getLoadMoreMode: () => LoadMoreMode | undefined;
    /** Sanitized chunk size (>= 1) for array-mode paging. */
    getPageSize: () => number;
}
/**
 * Encapsulates the generic DataSource + incremental-loading logic shared by
 * `mono-select`, `mono-tag-input`, etc. The host owns the rendering and any
 * scroll/height ergonomics; this controller owns binding, event wiring, page
 * accumulation, and array-mode chunking.
 *
 * Every state mutation calls `host.requestUpdate()` so the host re-renders.
 */
export declare class DataSourceController<T = unknown> implements ReactiveController {
    private readonly host;
    private readonly opts;
    private _dsItems;
    private _dsLoading;
    private _loadingMore;
    private _isLastPage;
    private _visibleCount;
    private _internalLoad;
    private _bound;
    constructor(host: ReactiveControllerHost, opts: DataSourceControllerOptions<T>);
    hostConnected(): void;
    hostDisconnected(): void;
    /** Attach/detach listeners for a (possibly new) DataSource and seed state. */
    bind(ds: MonoDataSource<T> | null): void;
    maybeImmediateLoad(): void;
    /** Call when the load-more mode changes; refreshes paging assumptions. */
    onLoadMoreModeChange(): void;
    /** Reset array-mode paging to the first chunk. */
    resetVisible(): void;
    /** Load/reveal the next page and append it to the accumulated list. */
    loadMore(): Promise<void>;
    /** Raw source array: accumulated DataSource items, or the plain `items`. */
    get sourceItems(): T[];
    /** Rows to actually render (array-mode reveals a slice; else everything). */
    get visibleItems(): T[];
    get loading(): boolean;
    get loadingMore(): boolean;
    /** load-more is driving a plain `items` array (no DataSource bound). */
    get isArrayLoadMore(): boolean;
    /** Whether there's nothing left to load/reveal. */
    get atLastPage(): boolean;
    private readonly _onChanged;
    private readonly _onLoadingChanged;
    private _sync;
    /** Load the first page, replacing the accumulated list. */
    private _loadFirstPage;
    private _detach;
    private _changed;
}
