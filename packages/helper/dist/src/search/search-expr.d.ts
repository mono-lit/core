/**
 * Search-expression entries: the fields a typed term is matched against.
 *
 * One grammar, shared by every component that searches data — `monoDataGrid`'s
 * `searchExpr`, and the `search-value` prop on `mono-select`, `mono-tag-input`
 * and `mono-dropdown-table`. An entry may be:
 *
 * - a plain column name (`'Nama'`)
 * - a **path** (`'Company.Name'`, `'Transaction.[1].Name'`, `'Transaction.[*].Price'`)
 * - a **`*` pattern** (`'*'`, `'Company.*'`, `'*.*'`, `'*.[*].*'`)
 * - a **`{ field, custom }` clause builder**
 *
 * An entry is normally just a column name, and every column is searched the same
 * way — `contains(<col>,'<term>')`. That is wrong for any column whose data isn't
 * free text: a **boolean** can't take `contains` at all, and a **coded** column
 * stores something the user never types (a `Month` of `0..11` can never match the
 * string `"Jan"`).
 *
 * So an entry may instead be `{ field, custom }`, where `custom` receives the live
 * term and returns the clause to use for that column:
 *
 * ```ts
 * const MONTHS = ['Jan', 'Feb', 'Mar', …]
 *
 * searchExpr: [
 *   'Code',
 *   'Nama',
 *   { field: 'Active', custom: ({ field, value }) => `${field} eq ${value}` },
 *   { field: 'Month',  custom: ({ field, value }) => [field, '=', MONTHS.indexOf(value)] },
 * ]
 * ```
 *
 * A custom column takes part in the plain search box like any other, so it runs on
 * every term. **Return `null`/`undefined` to opt out** of one — which is what makes
 * the `Month` example workable: `"Jan"` → `0`, `"zzz"` → `-1` → return `null` and
 * the column simply drops out of that query instead of matching nothing.
 *
 * | `custom` returns | remote (devextreme store) | array / in-memory |
 * | --- | --- | --- |
 * | `[field, op, value]`, or a nested `and`/`or` array | used as-is | compiled to a predicate |
 * | `(row) => boolean` | warn + skip | used as the predicate |
 * | `"Active eq true"` (raw OData) | wrapped as `[raw]` | warn + skip |
 * | `null` / `undefined` / `false` | skipped | skipped |
 *
 * Only the explicit `{ field, custom }` shape is accepted — a `{ Month: fn }` map
 * is not, so there is exactly one form to read and to type.
 *
 * An entry may also be a **`*` pattern**, resolved against the loaded rows so a
 * grid can search everything without listing columns:
 *
 * ```ts
 * searchExpr: ['*']                     // every top-level field
 * searchExpr: ['*', '*.[*].*']          // …plus every field of every array expand
 * searchExpr: ['*', '*.*']              // …plus every field of every object expand
 * searchExpr: ['*', { field: 'Month', custom }]   // the explicit entry wins for Month
 * ```
 *
 * Patterns read literally, segment by segment — `'*.[*].*'` covers the expand ONLY.
 * See {@link expandWildcard} for the type rule that keeps a remote `$filter` valid.
 *
 * This module is pure: types + stateless helpers, no controller state, mirroring
 * `field-path.ts`.
 */
/** What a `custom` builder is handed for the term being applied. */
export interface MonoSearchCustomCtx {
    /** The column this entry declares — echoed so the builder needn't repeat it. */
    field: string;
    /** The raw text the user typed, exactly as typed. */
    value: string;
    /** The grid's configured `searchOperation` (default `'contains'`). */
    operation: string;
}
/**
 * What a `custom` builder may return. `null` / `undefined` / `false` all mean
 * "this column has nothing to say about this term" — skip it.
 */
export type MonoSearchCustomResult = string | unknown[] | ((row: any) => boolean) | null | undefined | false;
/** A `searchExpr` entry that builds its own clause. */
export interface MonoSearchExprCustom {
    /** Column this entry covers — the name a bound `MonoSearchTerm.field` matches. */
    field: string;
    /** Build the clause for one term. See {@link MonoSearchCustomResult}. */
    custom: (ctx: MonoSearchCustomCtx) => MonoSearchCustomResult;
}
/** One `searchExpr` entry: a plain column name, or a custom builder. */
export type MonoSearchExprEntry = string | MonoSearchExprCustom;
/** The `searchExpr` option: one entry or a list. */
export type MonoSearchExpr = MonoSearchExprEntry | MonoSearchExprEntry[];
/** Every usable entry, in the order written. Strings and customs, malformed dropped. */
export declare function normalizeSearchExpr(expr: MonoSearchExpr | undefined): MonoSearchExprEntry[];
/**
 * The plain column names only — no `{ field, custom }` entries, no `*` patterns.
 *
 * This is what a SOURCE may be handed: `monoArraySource`, `storeGroupSource` and
 * devextreme all type `searchExpr` as `string | string[]` and feed it straight to
 * `toODataClause` — an object entry would serialize to garbage and a `'*'` would
 * be searched as a column literally named `*`. Both are resolved by the controller
 * instead.
 */
export declare function plainSearchColumns(expr: MonoSearchExpr | undefined): string[];
/** The field name an entry covers. */
export declare function searchEntryField(entry: MonoSearchExprEntry): string;
/** The entry declaring `field`, if any — used to resolve a column-bound term. */
export declare function searchEntryFor(expr: MonoSearchExpr | undefined, field: string): MonoSearchExprEntry | undefined;
/** Whether any entry brings its own builder (so folding must be bypassed). */
export declare function hasCustomSearch(expr: MonoSearchExpr | undefined): boolean;
/** Whether `field` is a `*` pattern rather than a concrete column/path. */
export declare function isWildcardPattern(field: string): boolean;
/**
 * Resolve a `*` pattern against real rows, returning the concrete field paths it
 * covers — `'*.[*].*'` over `{ Detail: [{ Bulan, Ket }] }` gives
 * `['Detail.[*].Bulan', 'Detail.[*].Ket']`, which the existing path machinery
 * already knows how to match client-side and translate to an OData lambda.
 *
 * `textOnly` drops every leaf that isn't a string. A REMOTE source needs that:
 * `contains(Price,'x')` is not valid OData and would reject the whole request, so
 * a wildcard never emits a clause for a numeric/boolean/date column. Give such a
 * column an explicit `{ field, custom }` entry instead. In-memory sources compare
 * stringified values, so they keep every leaf.
 *
 * A field that is `null`/`undefined` in every sampled row is skipped — there is
 * nothing to type it by.
 */
export declare function expandWildcard(pattern: string, rows: readonly unknown[], textOnly: boolean): string[];
/** Options for {@link resolveSearchEntries}. */
export interface ResolveSearchOptions {
    /** Rows to resolve `*` patterns against (the loaded data). */
    rows?: readonly unknown[];
    /** Keep only string-valued leaves — required for a remote OData source. */
    textOnly?: boolean;
}
/**
 * The entries a search actually runs over: every `*` pattern replaced by the
 * concrete fields it resolves to, in place.
 *
 * **An explicitly named field always wins.** A field named anywhere in the list —
 * as a plain string or as `{ field, custom }` — is dropped from every pattern
 * expansion regardless of order, so `['*', { field: 'Name', custom }]` and
 * `[{ field: 'Name', custom }, '*']` both search `Name` with the custom, exactly
 * once, at the position it was written.
 */
export declare function resolveSearchEntries(expr: MonoSearchExpr | undefined, options?: ResolveSearchOptions): MonoSearchExprEntry[];
/** Whether any entry is a `*` pattern (so folding must be bypassed). */
export declare function hasWildcardSearch(expr: MonoSearchExpr | undefined): boolean;
/**
 * The devextreme filter clause for one custom entry + term, or `null` to skip it.
 *
 * A raw string is wrapped as `[raw]` — the single-member raw-passthrough clause
 * devextreme honours inside a filter array, the same shape `toODataClause` emits
 * for a wildcard lambda, so it slots into the OR/AND groups unchanged.
 */
export declare function customRemoteClause(entry: MonoSearchExprCustom, value: string, operation: string): unknown | null;
/**
 * The client-side row predicate for one custom entry + term, or `null` to skip it.
 *
 * Filter arrays go through `compileFilterPredicate`, which already understands
 * nested `and`/`or` groups, `['!', …]` negation and path fields — so the SAME
 * `[field, op, value]` a remote source receives also narrows an array source.
 */
export declare function customPredicate(entry: MonoSearchExprCustom, value: string, operation: string): ((row: any) => boolean) | null;
