import { MaybeReactive } from '../composables/reactive.js';
/** One sort entry, in devextreme's object form. */
export interface MonoSourceSortEntry {
    selector: string;
    desc: boolean;
}
/**
 * DataSource-level knobs a controller keeps STICKY — `{ dataSourceOptions }`.
 *
 * These are the devextreme `DataSource` options a consumer would otherwise set on
 * the source itself, and the point of routing them through the controller is that
 * the controller then composes every query it runs on top of them: a search, a
 * header column filter, a sort, a page, a scroll page, a drain, an `$apply` —
 * each one goes out with this `filter` AND-ed in, this `select`, this `expand`.
 *
 * The option is read fresh at every query (see `MaybeReactive`), so hand a getter
 * or a `computed` and the CURRENT reactive value is the one that lands in the
 * request. Changing it does not by itself run a query — that is `refresh()`.
 */
export interface MonoDataSourceOptions {
    /** Base filter, AND-ed under everything the controller adds. Array sources take a predicate too. */
    filter?: unknown;
    /** `$select`. */
    select?: string | string[];
    /** `$expand`. Simple navigation names union; a nested `Nav($select=…)` string is kept verbatim. */
    expand?: string | string[];
    /**
     * Base sort. A sort the user picks wins; these follow as tiebreakers (entries
     * whose selector is already sorted are skipped).
     */
    sort?: string | {
        selector: string;
        desc?: boolean;
    } | Array<string | {
        selector: string;
        desc?: boolean;
    }>;
    /** Extra query-string parameters (ODataStore `customQueryParams`). */
    customQueryParams?: Record<string, unknown>;
    paginate?: boolean;
    /** Source page size. A component's own page-size control still wins. */
    pageSize?: number;
    requireTotalCount?: boolean;
    /** Source-level search columns/operation — used only when the controller declares none of its own. */
    searchExpr?: string | string[];
    searchOperation?: string;
    [key: string]: unknown;
}
/**
 * The same thing in raw OData vocabulary — `{ odataOptions }`.
 *
 * Normalised into {@link MonoDataSourceOptions} and merged with it: `$select` →
 * `select`, `$expand` → `expand`, `$orderby` → `sort`, `$filter` → `filter`, and
 * every other key (`$top`, `$count`, a custom parameter) → `customQueryParams`.
 *
 * `$filter` is a string. It is parsed into devextreme's array form so the store
 * compiles it together with whatever the component adds; an expression the
 * parser cannot read (an `any()` lambda, an ISO date literal) is sent as-is and
 * comes out as `(expr) eq true`, which is valid OData — but devextreme rewrites
 * every `.` in that raw text to `/`, so keep decimals and dotted strings out of
 * it, or write the array form under `dataSourceOptions.filter` instead. Array
 * sources cannot evaluate a raw string and ignore it (with one console warning).
 */
export interface MonoOdataOptions {
    $select?: string | string[];
    $expand?: string | string[];
    $orderby?: string;
    $filter?: string;
    [key: string]: unknown;
}
/** The knobs with a meaning of their own; anything else is passed through as a load option. */
export declare const DATA_SOURCE_KNOBS: ReadonlySet<string>;
/** A comma string or an array → a trimmed string list; `null`/`undefined` → `undefined`. */
export declare function toList(v: unknown): string[] | undefined;
/** devextreme's sort forms (string / object / array / mixed) → an ordered entry list. */
export declare function normalizeSortList(value: unknown): MonoSourceSortEntry[];
/** `"A desc, B"` → `[{A, desc}, {B}]`. */
export declare function parseOrderby(text: string): MonoSourceSortEntry[];
/**
 * The parser emits OData keyword operators (`eq`, `ge`) — the filter builder's
 * tree reads either — but devextreme's ODataStore compiles ONLY the symbol forms
 * and throws `E4003` on a keyword. Rewritten recursively.
 */
export declare function toSymbolOps(expr: unknown): unknown;
/**
 * A raw `$filter` → devextreme's array form, so the store compiles it TOGETHER
 * with whatever the component adds. The parser throws on syntax it does not know
 * (lambdas, ISO date literals); those go through as a one-element raw clause,
 * which devextreme emits as `(expr) eq true` — valid OData, with the caveat that
 * it rewrites `.` to `/` inside the text.
 */
export declare function parseOdataFilter(raw: string): unknown;
/** `{ $select, $expand, $orderby, $filter, …custom }` → the DataSource shape. */
export declare function normalizeOdataOptions(o: MonoOdataOptions): MonoDataSourceOptions;
/**
 * `a` ∧ `b`: filters AND-ed (predicates and arrays each on their own terms),
 * `select`/`expand` unioned, sort de-duplicated by selector with `a` leading,
 * `customQueryParams` merged with `b` winning, scalars `b` if defined else `a`.
 */
export declare function mergeDataSourceOptions(a: MonoDataSourceOptions, b: MonoDataSourceOptions): MonoDataSourceOptions;
/**
 * Read both option bags fresh and merge them — the one call a controller makes
 * at the top of every query. Returns a NEW object every time (a getter hands
 * back fresh state), so callers that need change detection compare by content:
 * see {@link dataSourceOptionsKey}.
 */
export declare function resolveDataSourceOptions(dataSourceOptions: MaybeReactive<MonoDataSourceOptions> | undefined, odataOptions: MaybeReactive<MonoOdataOptions> | undefined): MonoDataSourceOptions;
/**
 * A content key for change detection. Functions (an array-source predicate) do
 * not stringify, so they are marked and must be compared by reference by the
 * caller; a circular object yields a fresh random key and so always counts as
 * changed.
 */
export declare function dataSourceOptionsKey(o: MonoDataSourceOptions): string;
/** `expand` / `customQueryParams` / unknown keys — what goes onto a `store.load()` beside the knobs. */
export declare function extraLoadOptions(o: MonoDataSourceOptions): Record<string, unknown>;
