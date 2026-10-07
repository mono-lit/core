import { MonoSearchExpr, MonoSearchExprEntry } from './search-expr.js';
export type { MonoSearchExpr, MonoSearchExprEntry };
/**
 * A `search-value` prop as authored: the comma-separated string form, or the
 * array form (which additionally allows `{ field, custom }` entries).
 */
export type MonoSearchValue = string | MonoSearchExprEntry[];
/** The default devextreme search operation. */
export declare const DEFAULT_SEARCH_OPERATION = "contains";
/**
 * Split the string form of `search-value` on commas.
 *
 * Kept separate from {@link resolveSearchFields} so a component can show a user
 * what its raw prop parsed to without also resolving `*` patterns against data.
 */
export declare function parseSearchValue(value: MonoSearchValue | undefined | null): MonoSearchExprEntry[];
/**
 * The four accepted spellings of "which fields does a typed term match".
 *
 * The data grid shipped this option as `searchExpr`; select and tag-input named
 * the same idea `search-value`. Rather than pick a winner and break one of them,
 * every surface accepts all four names for one concept — `searchExpr` is kept
 * purely for back-compat.
 */
export interface MonoSearchFieldsAliases {
    searchExpr?: MonoSearchValue | null;
    'search-expr'?: MonoSearchValue | null;
    searchValue?: MonoSearchValue | null;
    'search-value'?: MonoSearchValue | null;
}
/** The spellings, in the order a merge reads them. */
export declare const SEARCH_FIELDS_KEYS: readonly ["searchExpr", "search-expr", "searchValue", "search-value"];
/**
 * Merge every spelling present into one entry list, de-duplicated by field name.
 *
 * They all mean the same thing, so passing two of them means the union rather
 * than one silently shadowing the other. Order only decides *position* among
 * equal field names — first occurrence wins, so a `{ field, custom }` entry
 * written under one spelling isn't displaced by a plain column under another.
 *
 * Returns **`undefined` when none of the keys is present**, which callers rely on
 * to mean "not configured at all" — distinctly different from `[]` ("configured,
 * but empty"). The grid uses that difference to decide whether to leave a data
 * source's own `searchExpr` alone.
 */
export declare function mergeSearchFields(src: MonoSearchFieldsAliases | undefined | null): MonoSearchExprEntry[] | undefined;
/** Inputs to {@link resolveSearchFields}. */
export interface ResolveSearchFieldsOptions {
    /** The component's `search-value` prop, in either form. */
    searchValue?: MonoSearchValue | null;
    /**
     * Fields to search when `search-value` is empty — a component's natural
     * defaults (`display-value` when it's a string, then `key-value`).
     */
    fallbackFields?: Array<string | undefined | null>;
    /** Loaded rows, sampled to resolve `*` patterns. */
    rows?: readonly unknown[];
    /**
     * Whether the source is remote (store-backed). A remote `$filter` can only
     * `contains` a **string** column, so a `*` pattern expands to string leaves
     * only — `contains(Price,'x')` is invalid OData and would reject the request.
     */
    remote?: boolean;
    /**
     * Search **everything** when `search-value` is empty: `'*'` is prepended ahead
     * of {@link fallbackFields} rather than the fallbacks being used alone.
     *
     * The fallbacks are kept as a safety net rather than replaced, for two reasons:
     * a `'*'` resolves against `rows`, so before a remote source's first page has
     * landed it expands to NOTHING and the query would silently match everything;
     * and `textOnly` drops non-string leaves on a remote source, which would stop a
     * numeric `key-value` being searchable. A concrete fallback entry is exempt from
     * both — `resolveSearchEntries` treats an explicitly named field as explicit, so
     * it survives expansion and appears exactly once.
     */
    defaultToWildcard?: boolean;
}
/** The default when nothing is configured: every top-level field. */
export declare const DEFAULT_SEARCH_FIELDS: readonly string[];
/**
 * The entries a search actually runs over: the prop parsed, the fallbacks applied
 * when it's empty, and every `*` pattern expanded against `rows`.
 *
 * Call this **once per query**, never per row — a pattern samples up to 20 rows,
 * so resolving inside a row loop is O(rows × fields) on every keystroke.
 */
export declare function resolveSearchFields(options?: ResolveSearchFieldsOptions): MonoSearchExprEntry[];
/**
 * Whether a source's own `searchValue`/`searchExpr` folding can express these
 * entries — true only for plain top-level column names.
 *
 * A path needs a nav selector or an `any()` lambda and a custom brings its own
 * clause; folding would silently search either with a flat `contains` instead.
 */
export declare function isFoldableSearch(entries: readonly MonoSearchExprEntry[]): boolean;
/** The plain column names among `entries` — what a source may safely be handed. */
export declare function plainSearchFields(entries: readonly MonoSearchExprEntry[]): string[];
/**
 * Read a field off a row, path-aware. A wildcard path resolves to an array of
 * every match, so the caller matches if ANY element hits.
 */
export declare function readSearchField(row: unknown, field: string): unknown[];
/**
 * The client-side row test for one query, or `null` when there is nothing to
 * match on.
 *
 * `null` means "no opinion" — the caller should keep every row rather than filter
 * them all away, which is what a component with no configured fields wants.
 */
export declare function searchRowPredicate(entries: readonly MonoSearchExprEntry[], query: string, operation?: string): ((row: any) => boolean) | null;
/**
 * The devextreme `$filter` expression for one query — an OR across every entry —
 * or `null` when there is nothing to send.
 */
export declare function searchRemoteFilter(entries: readonly MonoSearchExprEntry[], query: string, operation?: string): unknown;
/** The structural slice of a devextreme DataSource a search touches. */
export interface SearchableSource {
    searchOperation?: (op?: string) => unknown;
    searchExpr?: (expr?: unknown) => unknown;
    searchValue?: (v?: unknown) => unknown;
    filter?: (v?: unknown) => unknown;
    pageIndex?: (n?: number) => unknown;
    load?: () => PromiseLike<unknown> | unknown;
}
/** Inputs to {@link MonoSourceSearch.apply}. */
export interface ApplySourceSearchOptions extends ResolveSearchFieldsOptions {
    /** The text the user typed. */
    query: string;
    /** devextreme search operation (default `'contains'`). */
    operation?: string;
}
/**
 * Applies a search to a bound DataSource, choosing between the source's own
 * folding and a controller-built `$filter`.
 *
 * The reason this needs to be an object rather than a function is the **base
 * filter**: when the search can't be folded it has to live in `source.filter()`,
 * which is also where the consumer's own filter lives. So the consumer's filter is
 * captured and every search re-composes from that snapshot — otherwise each
 * keystroke would AND another search clause onto the previous one and the filter
 * would grow without bound.
 *
 * The snapshot is not taken once and kept. Before every apply (and every clear)
 * the live `filter()` is compared against what this instance last WROTE: if it
 * differs, the consumer changed the filter in the meantime — a watcher scoping
 * the source — and that becomes the new base. Snapshotting only at `bind()` made
 * the next keystroke overwrite such a filter with the stale one, and "restored"
 * the stale one on clear.
 *
 * ```ts
 * private _search = new MonoSourceSearch()
 * // on `dataSource` change:
 * this._search.bind(this.dataSource)
 * // on a (debounced) query:
 * await this._search.apply(this.dataSource, {
 *   query, searchValue: this.searchValue, fallbackFields: [...], rows, remote: true,
 * })
 * ```
 */
export declare class MonoSourceSearch {
    /** The source the captured base filter belongs to. */
    private _source;
    /** The consumer's own `filter()`, as it was before any search touched it. */
    private _baseFilter;
    /** Whether the last apply wrote a search clause into `filter()`. */
    private _wroteFilter;
    /** What the source HELD after this instance's last `filter()` write (read back). */
    private _lastWritten;
    /**
     * Snapshot a source's own filter. Safe to call repeatedly — the snapshot is
     * only (re)taken when the source identity actually changes, so it can be driven
     * straight from a `willUpdate` branch. A change on the SAME source is picked up
     * by `_syncBase` at the next apply/clear instead.
     */
    bind(source: unknown): void;
    /**
     * Adopt a filter the consumer set on the source since the last write —
     * anything the source holds that is not what this instance last put there.
     * `_writeFilter` records what the source HOLDS after a write (read back), so a
     * source that ignores writes reads back as its own last write and is never
     * re-adopted, and one that normalises compares against its normalised value.
     */
    private _syncBase;
    /** Write `filter()` and remember what the source holds afterwards. */
    private _writeFilter;
    /**
     * Undo whatever this instance wrote onto the source, then forget it.
     *
     * `reset()` alone is not enough at teardown. With `defaultToWildcard`, a `'*'`
     * entry is never foldable, so the search is AND-ed into `source.filter()` — the
     * same slot the CONSUMER's own filter lives in. Only `apply()` ever restores the
     * captured base (and only when the next apply happens to be foldable), so an
     * element torn down mid-query used to leave its clause behind on a DataSource
     * the app still owns and shares.
     *
     * Deliberately does NOT `load()`: teardown must not issue a request. The next
     * consumer of the source reloads on its own terms.
     */
    clear(source?: unknown): void;
    /** Forget the captured state without touching the source. */
    reset(): void;
    /**
     * Push `query` onto `source` and reload it. Returns the resolved entries so a
     * caller can reuse them for its own client-side rendering without re-resolving.
     */
    apply(source: unknown, options: ApplySourceSearchOptions): Promise<MonoSearchExprEntry[]>;
}
