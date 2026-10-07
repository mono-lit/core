import type { ReactiveController, ReactiveControllerHost } from 'lit'

/**
 * Minimal structural shape of a devextreme DataSource. Declared locally so
 * @mono-lit/helper stays dependency-free; a real devextreme DataSource satisfies it.
 */
export interface MonoDataSource<T = unknown> {
  load: () => PromiseLike<T[]> | T[]
  items: () => T[]
  isLoading?: () => boolean
  // Method syntax (not arrow properties) so parameters are checked bivariantly
  // — a real devextreme DataSource has narrower, overloaded signatures (e.g.
  // `on(eventName: DataSourceEventName, …)`) that must still satisfy this shape.
  on(event: string, handler: (...args: unknown[]) => void): void
  off(event: string, handler: (...args: unknown[]) => void): void
  // Paging (used by load-more in DataSource mode). All optional/structural.
  paginate?(value?: boolean): boolean
  pageSize?(value?: number): number
  pageIndex?(value?: number): number
  isLastPage?: () => boolean
  totalCount?: () => number
}

/**
 * Incremental loading mode. Works with BOTH a paged DataSource and a plain
 * `items` array (the array is revealed one `pageSize` chunk at a time):
 * - 'button' → render a "Load more" button at the end of the list.
 * - 'scroll' → load/reveal the next chunk when scrolled near the bottom.
 */
export type LoadMoreMode = 'button' | 'scroll'

export interface DataSourceControllerOptions<T> {
  /** Current bound DataSource (or null) — read live from the host property. */
  getDataSource: () => MonoDataSource<T> | null
  /** The raw plain `items` array, used when no DataSource is bound. */
  getItems: () => T[]
  /** Auto-load the source on attach when it has no items yet. */
  getImmediate: () => boolean
  /** Effective load-more mode, or undefined when disabled. */
  getLoadMoreMode: () => LoadMoreMode | undefined
  /** Sanitized chunk size (>= 1) for array-mode paging. */
  getPageSize: () => number
}

/**
 * Encapsulates the generic DataSource + incremental-loading logic shared by
 * `mono-select`, `mono-tag-input`, etc. The host owns the rendering and any
 * scroll/height ergonomics; this controller owns binding, event wiring, page
 * accumulation, and array-mode chunking.
 *
 * Every state mutation calls `host.requestUpdate()` so the host re-renders.
 */
export class DataSourceController<T = unknown> implements ReactiveController {
  private readonly host: ReactiveControllerHost
  private readonly opts: DataSourceControllerOptions<T>

  // Snapshot of the bound source's items (accumulated across pages).
  private _dsItems: T[] = []
  private _dsLoading = false
  private _loadingMore = false
  private _isLastPage = false

  // Array-mode paging: how many of `items` are currently revealed.
  private _visibleCount: number

  // True while the controller is driving a paged load(), so the source's own
  // 'changed' event doesn't clobber the accumulated list.
  private _internalLoad = false

  // The dataSource we currently have listeners attached to.
  private _bound: MonoDataSource<T> | null = null

  constructor(
    host: ReactiveControllerHost,
    opts: DataSourceControllerOptions<T>,
  ) {
    this.host = host
    this.opts = opts
    this._visibleCount = opts.getPageSize()
    host.addController(this)
  }

  // --- lifecycle -----------------------------------------------------------

  hostConnected(): void {
    // Re-attach after a DOM move (disconnect detaches listeners).
    const ds = this.opts.getDataSource()
    if (ds && this._bound !== ds) this.bind(ds)
  }

  hostDisconnected(): void {
    this._detach()
  }

  // --- host hooks (call these from the component's willUpdate) --------------

  /** Attach/detach listeners for a (possibly new) DataSource and seed state. */
  bind(ds: MonoDataSource<T> | null): void {
    if (this._bound === ds) return

    this._detach()
    this._bound = ds

    if (!ds) {
      this._dsItems = []
      this._dsLoading = false
      this._isLastPage = false
      this._changed()
      return
    }

    ds.on('changed', this._onChanged)
    ds.on('loadingChanged', this._onLoadingChanged)
    ds.on('loadError', this._onLoadingChanged)

    this._sync() // seed from any already-loaded items
    this.maybeImmediateLoad()
  }

  maybeImmediateLoad(): void {
    const ds = this._bound
    if (!ds || !this.opts.getImmediate()) return

    const hasItems = (ds.items?.() ?? []).length > 0
    const loading = ds.isLoading?.() ?? false
    if (hasItems || loading) return

    void this._loadFirstPage()
  }

  /** Call when the load-more mode changes; refreshes paging assumptions. */
  onLoadMoreModeChange(): void {
    if (!this.opts.getLoadMoreMode()) return
    this._bound?.paginate?.(true)
    this._isLastPage = this._bound?.isLastPage?.() ?? false
    this._changed()
  }

  /** Reset array-mode paging to the first chunk. */
  resetVisible(): void {
    this._visibleCount = this.opts.getPageSize()
    this._changed()
  }

  // --- actions -------------------------------------------------------------

  /** Load/reveal the next page and append it to the accumulated list. */
  async loadMore(): Promise<void> {
    const mode = this.opts.getLoadMoreMode()
    if (!mode || this.atLastPage) return

    // Array mode: reveal the next chunk synchronously (no fetching).
    if (this.isArrayLoadMore) {
      this._visibleCount = Math.min(
        this.opts.getItems().length,
        this._visibleCount + this.opts.getPageSize(),
      )
      this._changed()
      return
    }

    // DataSource mode: fetch and append the next page.
    const ds = this._bound
    // Not while the FIRST page is still loading either: a scroll then would run `pageIndex + 1`
    // alongside it on the same DataSource, and the two share `_internalLoad`.
    if (!ds || this._loadingMore || this._dsLoading) return
    if (typeof ds.pageIndex !== 'function') return

    const current = ds.pageIndex() ?? 0
    this._internalLoad = true
    this._loadingMore = true
    this._changed()
    try {
      ds.paginate?.(true)
      ds.pageIndex(current + 1)
      await Promise.resolve(ds.load())
      this._dsItems = [...this._dsItems, ...(ds.items?.() ?? [])]
      this._isLastPage = ds.isLastPage?.() ?? false
    } catch {
      ds.pageIndex(current) // roll back on failure
    } finally {
      this._loadingMore = false
      this._internalLoad = false
      this._changed()
    }
  }

  // --- reactive reads ------------------------------------------------------

  /** Raw source array: accumulated DataSource items, or the plain `items`. */
  get sourceItems(): T[] {
    return this._bound ? this._dsItems : this.opts.getItems()
  }

  /** Rows to actually render (array-mode reveals a slice; else everything). */
  get visibleItems(): T[] {
    if (this.isArrayLoadMore) {
      return this.opts.getItems().slice(0, this._visibleCount)
    }
    return this.sourceItems
  }

  get loading(): boolean {
    return this._dsLoading
  }

  get loadingMore(): boolean {
    return this._loadingMore
  }

  /** load-more is driving a plain `items` array (no DataSource bound). */
  get isArrayLoadMore(): boolean {
    return !this.opts.getDataSource() && !!this.opts.getLoadMoreMode()
  }

  /** Whether there's nothing left to load/reveal. */
  get atLastPage(): boolean {
    if (this.isArrayLoadMore) {
      return this._visibleCount >= this.opts.getItems().length
    }
    return this._isLastPage
  }

  // --- internals -----------------------------------------------------------

  private readonly _onChanged = (): void => {
    // Our own paged loads handle accumulation inline; ignore their echo.
    if (this._internalLoad) return

    if (this.opts.getLoadMoreMode()) {
      // External reload (e.g. consumer changed the filter) → restart paging
      // from whatever page the source now holds.
      const ds = this._bound
      this._dsItems = ds ? [...(ds.items?.() ?? [])] : []
      this._isLastPage = ds?.isLastPage?.() ?? false
      this._dsLoading = ds?.isLoading?.() ?? false
      this._changed()
      return
    }

    this._sync()
  }

  private readonly _onLoadingChanged = (): void => {
    this._dsLoading = this._bound?.isLoading?.() ?? false
    this._changed()
  }

  private _sync(): void {
    const ds = this._bound
    this._dsItems = ds ? [...(ds.items?.() ?? [])] : []
    this._dsLoading = ds?.isLoading?.() ?? false
    this._isLastPage = ds?.isLastPage?.() ?? false
    this._changed()
  }

  /** Load the first page, replacing the accumulated list. */
  private async _loadFirstPage(): Promise<void> {
    const ds = this._bound
    if (!ds) return

    this._internalLoad = true
    this._dsLoading = true
    this._changed()
    try {
      if (this.opts.getLoadMoreMode()) {
        ds.paginate?.(true)
        ds.pageIndex?.(0)
      }
      await Promise.resolve(ds.load())
      this._dsItems = [...(ds.items?.() ?? [])]
      this._isLastPage = ds.isLastPage?.() ?? false
    } catch {
      // keep whatever was already shown
    } finally {
      this._dsLoading = ds.isLoading?.() ?? false
      this._internalLoad = false
      this._changed()
    }
  }

  private _detach(): void {
    const ds = this._bound
    if (!ds) return
    ds.off('changed', this._onChanged)
    ds.off('loadingChanged', this._onLoadingChanged)
    ds.off('loadError', this._onLoadingChanged)
    this._bound = null
  }

  private _changed(): void {
    this.host.requestUpdate()
  }
}
