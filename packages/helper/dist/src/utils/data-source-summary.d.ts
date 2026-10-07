import { arrayToODataString } from '../components/filter/filter-odata';
/** Aggregate kinds a spec may ask for — mirrors `MonoSummaryType` structurally. */
export type MonoAggregateType = 'sum' | 'avg' | 'count' | 'min' | 'max' | 'countDistinct';
/** The part of a summary spec that decides what to ask for. */
export interface MonoAggregateSpec {
    field?: string;
    type?: MonoAggregateType;
    /** Disambiguates two aggregates on the same field; also used as the alias. */
    name?: string;
}
/**
 * A field a server can aggregate.
 *
 * A WILDCARD or INDEX path (`Lines.[*].Total`) is rejected: `getFieldValue`
 * resolves those by walking a collection on a loaded row, and no `$apply`
 * expression means the same thing — the nearest OData construct aggregates the
 * collection per parent rather than across all of them.
 */
export declare const isAggregatableField: (field: string) => boolean;
/**
 * The response key each spec's value comes back under.
 *
 * Plain `field` while that field carries ONE aggregate, which is the ordinary
 * case and keeps the response readable; `field_type` once the same field has
 * two (a `sum` and an `avg` of `Price`), because an `$apply` cannot alias two
 * values to the same name. An explicit `name` always wins, and a bare `count`
 * has no field to name it after.
 */
export declare function summaryAliases(specs: readonly MonoAggregateSpec[]): string[];
/**
 * Build `aggregate(<field> with <agg> as <alias>, …)` for a set of specs.
 *
 * Returns `null` when no spec can be expressed — a caller with nothing to ask
 * for should not make a request.
 */
export declare function buildSummaryApply(specs: readonly MonoAggregateSpec[]): string | null;
/**
 * Compose a filter with an aggregate: `filter(<expr>)/aggregate(…)`.
 *
 * The filter goes INSIDE `$apply` rather than travelling as a sibling `$filter`
 * — that is what makes the two compose, since the filter runs first and the
 * aggregation sees only matching rows.
 */
export declare function composeSummaryApply(apply: string, filter: unknown): string;
/**
 * The predicate a summary must aggregate over — IDENTICAL to what the drain uses.
 *
 * `readAllRows` reads a DataSource as its own `filter()` AND its reconstructed
 * `searchValue`, which is a DataSource-level option the store knows nothing
 * about. Anything less here and a total would quietly count rows the user had
 * searched away, which is worse than being slow.
 */
export declare function summaryFilterOf(source: unknown): unknown;
/** Re-exported so a resolver can convert a devextreme filter itself. */
export { arrayToODataString as summaryODataFilter };
