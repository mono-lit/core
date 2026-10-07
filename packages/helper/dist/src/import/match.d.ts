import { MonoImportMatch } from './types';
/** One key subset: the match legs it uses. */
export type MatchScheme<T = any> = Array<MonoImportMatch<T>>;
/** A candidate table row plus its position in the target array. */
export interface TargetEntry<T = any> {
    row: T;
    index: number;
}
/** key string → the rows that share it (>1 means ambiguous). */
export type SchemeIndex<T = any> = Map<string, Array<TargetEntry<T>>>;
/**
 * Every non-empty subset of `match` with at least `minFields` legs, ordered
 * strongest (most legs) first.
 *
 * Bit-counting rather than recursion: with `n` legs there are `2^n - 1`
 * subsets, and `n` is a handful of key columns in practice.
 */
export declare function buildAllSubsets<T>(match: MatchScheme<T>, minFields?: number): Array<MatchScheme<T>>;
/** Index the target rows by one scheme's key. Collisions are kept, not dropped. */
export declare function buildSchemeIndex<T>(scheme: MatchScheme<T>, target: readonly T[], opts?: {
    targetFilter?: (row: T) => boolean;
    normalize?: (v: unknown) => string;
}): SchemeIndex<T>;
/** A prepared matcher: schemes plus their indexes, reused across every sheet row. */
export interface Matcher<T = any> {
    schemes: Array<MatchScheme<T>>;
    indexes: Array<SchemeIndex<T>>;
    normalize: (v: unknown) => string;
}
export declare function createMatcher<T>(match: MatchScheme<T>, target: readonly T[], opts?: {
    minKeyFields?: number;
    targetFilter?: (row: T) => boolean;
    normalize?: (v: unknown) => string;
}): Matcher<T>;
/** What a lookup produced. */
export type MatchOutcome<T = any> = {
    kind: 'hit';
    entry: TargetEntry<T>;
    scheme: MatchScheme<T>;
} | {
    kind: 'ambiguous';
    candidates: number;
    scheme: MatchScheme<T>;
} | {
    kind: 'miss';
};
/**
 * Find the table row for one sheet row, strongest scheme first.
 *
 * An ambiguous hit is remembered but doesn't stop the search — a weaker scheme
 * can't disambiguate, but a *different* subset of the same size might, and only
 * if nothing unique is ever found is the ambiguity reported.
 */
export declare function findMatch<T>(matcher: Matcher<T>, readExcel: (leg: MonoImportMatch<T>) => unknown): MatchOutcome<T>;
