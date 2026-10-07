/**
 * ONE `$apply` request through a devextreme OData store.
 *
 * The header filter, the summary footer and a bound chart all want the same
 * thing — the server rolls the data up (`groupby` / `aggregate`) and hands back
 * a handful of rows — and all of them want to send it through the SOURCE'S OWN
 * STORE, so the request rides its url, `beforeSend`, auth and credentials
 * exactly as every ordinary load does. This module is the one place that knows
 * how to get an `$apply` into that request.
 *
 * ── Why not `customQueryParams` ──
 *
 * It is the option that looks right, and it is wrong on every OData version.
 * devextreme treats `customQueryParams` as SERVICE-OPERATION parameters: each
 * value goes through its literal serializer, so a string is quoted and every
 * `'` doubled — `$apply='filter(A eq ''B'')'` — and on **v4 the whole thing
 * becomes a FUNCTION-INVOCATION url**, `Entity($apply='…')`, which any entity
 * set answers with 404. (`ODataStore.createQuery`: `escapeServiceOperationParams`
 * always; v4 → `formatFunctionInvocationUrl`, v2/v3 → `queryOptions.params`.)
 *
 * The hatch that works is `loadOptions.urlOverride`: the store requests exactly
 * that url, and devextreme's ajax appends its own parameters (`$top`, `$filter`,
 * `$count`) with `&` when the url already carries a `?`. So the clause goes
 * INTO the url, pre-encoded. A store without `version()` — a CustomStore, an
 * array — never honoured `$apply` at all, and gets no request.
 *
 * @mono-lit/helper never imports devextreme, so everything here is duck-typed on the
 * store: `version()` is public API, the url is read off `_requestDispatcher.url`
 * (25.x) with `_url` (older builds) as the fallback.
 */
/** The slice of a devextreme store this module touches. */
export interface ApplyStore {
    load(options?: unknown): PromiseLike<unknown> | unknown;
    /** OData protocol version (`ODataStore` only). */
    version?(): number;
}
export interface ApplyLoadOptions {
    /** Cap the rolled-up rows (`$top`). */
    top?: number;
}
/** The store's OData version, or `null` for anything that is not an OData store. */
export declare function odataStoreVersion(store: unknown): number | null;
/** The store's base url, or `null` when it cannot be read. */
export declare function odataStoreUrl(store: unknown): string | null;
/** `<url>?$apply=<encoded clause>` — `&` when the url already has a query string. */
export declare function applyRequestUrl(url: string, apply: string): string;
/**
 * The `store.load()` options that carry `apply`, or `null` when this store
 * cannot carry one (no request should be made).
 *
 * `requireTotalCount: false` keeps `$count` off — a rolled-up result has no
 * meaningful total, and `$count` beside `$apply` is rejected by some servers.
 */
export declare function applyLoadOptions(store: unknown, apply: string, options?: ApplyLoadOptions): Record<string, unknown> | null;
/** Normalise a devextreme store `load` result into a plain rows array. */
export declare function storeRows(res: unknown): any[];
/**
 * Send `apply` through `store` and return the rolled-up rows, or `null` when
 * the store cannot carry an `$apply` (nothing was requested). A request that
 * FAILS throws — the caller decides whether that disables the path for good
 * (see {@link createApplyGate}).
 */
export declare function loadApply(store: unknown, apply: string, options?: ApplyLoadOptions): Promise<Array<Record<string, unknown>> | null>;
/**
 * Whether `rows` are what an honoured `$apply` returns — each row carrying
 * ONLY the grouping key(s) and the aggregate aliases in `keys` (plus OData
 * `@odata.*` annotations) — as opposed to plain entities from a server that
 * ignored the clause. The distinction matters because an alias is usually the
 * field's own name: an entity `{ Id, Dept, Total }` has the alias `Total` too,
 * and would be mistaken for a bucket by a presence check. The extra `Id` is
 * what gives it away. `keys` are matched on their ROOT segment (`Job/Title`
 * comes back as `{ Job: { Title } }`).
 */
export declare function isRolledUp(rows: readonly unknown[], keys: readonly string[]): boolean;
/**
 * Whether a failed `$apply` request means the BACKEND does not do `$apply` —
 * a 4xx (`400 Bad Request`, `404`) or `501 Not Implemented` — as opposed to a
 * transient fault (network down: `httpStatus` 0 / absent, a 5xx). devextreme
 * puts the status on the error as `httpStatus`.
 */
export declare function isApplyRejected(err: unknown): boolean;
export interface ApplyGate {
    /** `true` once the path is off — disabled by option, or rejected by the backend. */
    readonly skip: boolean;
    /** Report a failed request; a definite rejection turns the gate off for good. */
    reject(err: unknown): void;
}
/**
 * Per-controller "is the `$apply` path still worth trying?" switch.
 *
 * A backend without `$apply` answers every attempt with the same 4xx, and a
 * grid that retried on every panel open / recompute would pay one failed
 * request each time before falling back. So the FIRST definite rejection is
 * remembered for the controller's lifetime; a transient failure is not, and
 * the next attempt goes out normally.
 */
export declare function createApplyGate(enabled: boolean): ApplyGate;
