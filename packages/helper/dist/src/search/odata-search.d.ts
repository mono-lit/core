import { MonoSearchExpr } from './search-expr.js';
/** Metadata and selected properties used to compile a safe remote OData search. */
export interface MonoODataSearchOptions {
    /** CSDL returned by the service's `$metadata` endpoint. */
    metadata: string | XMLDocument;
    /** Fully qualified EDM type (`Default.Customer`) or its short name (`Customer`). */
    entityType: string;
    /** Properties made available to the search box, in display order. */
    fields: readonly string[];
}
/**
 * Compile selected CSDL properties into the grid's existing `searchExpr` contract.
 *
 * Strings retain case-insensitive matching unless the service annotates the property
 * with `Mono.Search.CaseFold=false`; numeric EDM properties accept a complete numeric
 * input as equality. Unsupported EDM types do not generate invalid text predicates.
 */
export declare function odataSearchExpr(options: MonoODataSearchOptions): MonoSearchExpr;
