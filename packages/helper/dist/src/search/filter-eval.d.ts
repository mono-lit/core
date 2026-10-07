/**
 * Compile a devextreme filter expression (the array form `monoFilterBuilder`
 * emits via `changed({ type: 'array' })`) into a client-side row predicate, so a
 * built filter can narrow an array-backed grid the same way a remote store would
 * narrow from a `$filter`. Remote devextreme stores read the array directly; this
 * is the client-side mirror for sources that only accept a `(row) => boolean`.
 *
 * The grammar handled is exactly the subset `treeToArray` produces: `[field, op,
 * value]` triples, `'and'` / `'or'` joined groups, `['!', expr]` negation, with
 * `between` / `in` / blank checks already expanded to those primitives.
 */
export declare function compileFilterPredicate(expr: unknown): ((row: any) => boolean) | null;
/** AND-combine two optional devextreme filter expressions (either may be null). */
export declare function andFilters(a: unknown, b: unknown): unknown;
/** A client-side row filter, as `monoArraySource.filter()` stores it. */
export type RowPredicate = (row: any, index: number) => boolean;
/**
 * AND-combine optional row predicates — the array-source twin of `andFilters`.
 *
 * Returns the lone member UNWRAPPED when only one is present, so a caller that
 * compares the result by reference (the grid's compose memo) sees the same
 * function back and does not treat "nothing changed" as a change.
 */
export declare function andPredicates(...fns: Array<RowPredicate | null | undefined>): RowPredicate | null;
/**
 * Join expressions with `and` / `or`, dropping nulls and returning a lone member
 * unwrapped — devextreme's filter arrays interleave the join token between
 * members (`[a, 'or', b, 'or', c]`) rather than nesting pairs.
 */
export declare function joinFilters(parts: unknown[], join: 'and' | 'or'): unknown;
