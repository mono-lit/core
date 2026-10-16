import { a as describeError, l as isCanceled } from "./reactive-Di3mTMnV.js";
//#region src/composables/data-source-controller.ts
/**
* Encapsulates the generic DataSource + incremental-loading logic shared by
* `mono-select`, `mono-tag-input`, etc. The host owns the rendering and any
* scroll/height ergonomics; this controller owns binding, event wiring, page
* accumulation, and array-mode chunking.
*
* Every state mutation calls `host.requestUpdate()` so the host re-renders.
*/
var DataSourceController = class {
	constructor(host, opts) {
		this._dsItems = [];
		this._dsLoading = false;
		this._loadingMore = false;
		this._isLastPage = false;
		this._error = null;
		this._hasLoaded = false;
		this._retrying = false;
		this._internalLoad = false;
		this._bound = null;
		this._onChanged = () => {
			if (this._internalLoad) return;
			this._markLoaded();
			if (this.opts.getLoadMoreMode()) {
				const ds = this._bound;
				this._dsItems = ds ? [...ds.items?.() ?? []] : [];
				this._isLastPage = ds?.isLastPage?.() ?? false;
				this._dsLoading = ds?.isLoading?.() ?? false;
				this._changed();
				return;
			}
			this._sync();
		};
		this._onLoadingChanged = () => {
			this._dsLoading = this._bound?.isLoading?.() ?? false;
			this._changed();
		};
		this._onLoadError = (err) => {
			this._dsLoading = this._bound?.isLoading?.() ?? false;
			this.setError(err ?? /* @__PURE__ */ new Error("Request failed"));
		};
		this.host = host;
		this.opts = opts;
		this._visibleCount = opts.getPageSize();
		host.addController(this);
	}
	hostConnected() {
		const ds = this.opts.getDataSource();
		if (ds && this._bound !== ds) this.bind(ds);
	}
	hostDisconnected() {
		this._detach();
	}
	/** Attach/detach listeners for a (possibly new) DataSource and seed state. */
	bind(ds) {
		if (this._bound === ds) return;
		this._detach();
		this._bound = ds;
		this._error = null;
		this._retrying = false;
		this._hasLoaded = !!ds && (ds.items?.() ?? []).length > 0;
		if (!ds) {
			this._dsItems = [];
			this._dsLoading = false;
			this._isLastPage = false;
			this._changed();
			return;
		}
		ds.on("changed", this._onChanged);
		ds.on("loadingChanged", this._onLoadingChanged);
		ds.on("loadError", this._onLoadError);
		this._sync();
		this.maybeImmediateLoad();
	}
	maybeImmediateLoad() {
		const ds = this._bound;
		if (!ds || !this.opts.getImmediate()) return;
		const hasItems = (ds.items?.() ?? []).length > 0;
		const loading = ds.isLoading?.() ?? false;
		if (hasItems || loading) return;
		this._loadFirstPage();
	}
	/** Call when the load-more mode changes; refreshes paging assumptions. */
	onLoadMoreModeChange() {
		if (!this.opts.getLoadMoreMode()) return;
		this._bound?.paginate?.(true);
		this._isLastPage = this._bound?.isLastPage?.() ?? false;
		this._changed();
	}
	/** Reset array-mode paging to the first chunk. */
	resetVisible() {
		this._visibleCount = this.opts.getPageSize();
		this._changed();
	}
	/** Load/reveal the next page and append it to the accumulated list. */
	async loadMore() {
		if (!this.opts.getLoadMoreMode() || this.atLastPage) return;
		if (this.isArrayLoadMore) {
			this._visibleCount = Math.min(this.opts.getItems().length, this._visibleCount + this.opts.getPageSize());
			this._changed();
			return;
		}
		const ds = this._bound;
		if (!ds || this._loadingMore || this._dsLoading) return;
		if (typeof ds.pageIndex !== "function") return;
		const current = ds.pageIndex() ?? 0;
		this._internalLoad = true;
		this._loadingMore = true;
		this._changed();
		try {
			ds.paginate?.(true);
			ds.pageIndex(current + 1);
			await Promise.resolve(ds.load());
			this._dsItems = [...this._dsItems, ...ds.items?.() ?? []];
			this._isLastPage = ds.isLastPage?.() ?? false;
			this._error = null;
		} catch (err) {
			ds.pageIndex(current);
			this.setError(err);
		} finally {
			this._loadingMore = false;
			this._internalLoad = false;
			this._changed();
		}
	}
	/**
	* Re-run the request after a failure. Reloads the source as it stands, so a
	* failed search is retried with the same query. While it runs the field is
	* {@link busy} again.
	*
	* `load` replaces the plain `ds.load()` — a host whose failed request was a
	* search passes one that clears the query on the source and reloads.
	*/
	async retry(load) {
		if (!this._bound) return;
		this._error = null;
		this._retrying = true;
		this._changed();
		try {
			await this._loadFirstPage(load);
		} finally {
			this._retrying = false;
			this._changed();
		}
	}
	/**
	* Record a failure from a request the host drove itself (e.g. a server
	* select-all drain). Cancelled loads are ignored.
	*/
	setError(raw) {
		if (isCanceled(raw)) return;
		this._error = describeError(raw);
		this._changed();
	}
	/** Raw source array: accumulated DataSource items, or the plain `items`. */
	get sourceItems() {
		return this._bound ? this._dsItems : this.opts.getItems();
	}
	/** Rows to actually render (array-mode reveals a slice; else everything). */
	get visibleItems() {
		if (this.isArrayLoadMore) return this.opts.getItems().slice(0, this._visibleCount);
		return this.sourceItems;
	}
	get loading() {
		return this._dsLoading;
	}
	get loadingMore() {
		return this._loadingMore;
	}
	/**
	* The field must be locked: the FIRST load (or a retry) is in flight. A
	* search / filter reload after the source has answered once does not count —
	* the person is typing into the field and it must stay usable.
	*/
	get busy() {
		return !!this._bound && (this._dsLoading && !this._hasLoaded || this._retrying);
	}
	/** The last load failure, described for a person; null once a load succeeds. */
	get error() {
		return this._error;
	}
	/** load-more is driving a plain `items` array (no DataSource bound). */
	get isArrayLoadMore() {
		return !this.opts.getDataSource() && !!this.opts.getLoadMoreMode();
	}
	/** Whether there's nothing left to load/reveal. */
	get atLastPage() {
		if (this.isArrayLoadMore) return this._visibleCount >= this.opts.getItems().length;
		return this._isLastPage;
	}
	/** A load answered: the source is usable and any earlier failure is over. */
	_markLoaded() {
		this._hasLoaded = true;
		this._error = null;
	}
	_sync() {
		const ds = this._bound;
		this._dsItems = ds ? [...ds.items?.() ?? []] : [];
		this._dsLoading = ds?.isLoading?.() ?? false;
		this._isLastPage = ds?.isLastPage?.() ?? false;
		this._changed();
	}
	/** Load the first page, replacing the accumulated list. */
	async _loadFirstPage(load) {
		const ds = this._bound;
		if (!ds) return;
		this._internalLoad = true;
		this._dsLoading = true;
		this._changed();
		try {
			if (this.opts.getLoadMoreMode()) {
				ds.paginate?.(true);
				ds.pageIndex?.(0);
			}
			await Promise.resolve(load ? load() : ds.load());
			this._dsItems = [...ds.items?.() ?? []];
			this._isLastPage = ds.isLastPage?.() ?? false;
			this._markLoaded();
		} catch (err) {
			this.setError(err);
		} finally {
			this._dsLoading = ds.isLoading?.() ?? false;
			this._internalLoad = false;
			this._changed();
		}
	}
	_detach() {
		const ds = this._bound;
		if (!ds) return;
		ds.off("changed", this._onChanged);
		ds.off("loadingChanged", this._onLoadingChanged);
		ds.off("loadError", this._onLoadError);
		this._bound = null;
	}
	_changed() {
		this.host.requestUpdate();
	}
};
//#endregion
export { DataSourceController as t };
