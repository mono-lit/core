/**
 * Path field expressions.
 *
 * Any field a component addresses — a `mono-table-th` `field`, a `searchExpr` /
 * `search-value` entry on the grid, select, tag-input or dropdown-table — may be
 * a **path** into nested / collection data instead of a flat top-level key:
 *
 * - `"Job.Name"`       — nested property (dot path)
 * - `"User.[1].Id"`    — array index
 * - `"User.[*].Name"`  — wildcard (all elements of a collection)
 *
 * Client (array) sources resolve these against plain JS objects; remote OData
 * sources translate them to navigation (`Job.Name` → `Job/Name`) and, for a
 * wildcard search/filter, a lambda (`User.[*].Name` + `'x'` + `contains` →
 * `User/any(d: contains(d/Name,'x'))`).
 *
 * `.` and `[` are RESERVED — a literal top-level key containing them is not
 * addressable here. Brackets must be their own dot-segment (`User.[1].Id`, not
 * `User[1].Id`). Every consumer gates on {@link isPath} first and falls through
 * to plain `row[field]` when it returns false, so plain fields are unchanged.
 */
export type FieldSegment = {
    kind: 'key';
    name: string;
} | {
    kind: 'index';
    index: number;
} | {
    kind: 'wildcard';
};
export interface ParsedFieldPath {
    segments: FieldSegment[];
    hasWildcard: boolean;
    raw: string;
}
/** Whether `field` is a path expression (contains `.` or `[`) vs a plain key. */
export declare function isPath(field: string): boolean;
/** Parse a path field into ordered segments (cached). Plain keys → one `key` segment. */
export declare function parseFieldPath(field: string): ParsedFieldPath;
/**
 * Resolve a path field against a row. Returns a **scalar** when the path has no
 * wildcard, or a flattened **array** of matches when it does (`User.[*].Name` →
 * `string[]`). Missing links yield `undefined` (scalar) / are skipped (wildcard).
 */
export declare function getFieldValue(row: unknown, field: string): unknown;
/**
 * Write `value` into `obj` at a dot/index path, creating intermediate `{}`/`[]`
 * as needed. Wildcard paths are ambiguous to write — a `console.warn` + no-op.
 */
export declare function setFieldValue(obj: Record<string, unknown>, field: string, value: unknown): void;
/**
 * Project a row down to the given key paths, **rebuilding the nested shape**.
 *
 * This is what `<mono-table-checkbox>`'s `key-value` produces, so a selection can
 * be handed to an API in the shape the API expects rather than as flat values:
 *
 * ```ts
 * projectFields(row, ['Id'])                            // { Id: 8 }
 * projectFields(row, ['Company.Name'])                  // { Company: { Name: 'Hey' } }
 * projectFields(row, ['Transaction.[*].Id'])            // { Transaction: [{ Id: 4 }] }
 * projectFields(row, ['Company.Name', 'Transaction.[*].Id'])
 * //                → { Company: { Name: 'Hey' }, Transaction: [{ Id: 4 }] }
 * ```
 *
 * Separate from {@link setFieldValue}, which deliberately refuses wildcard paths
 * (there is no single place to write to). Here a wildcard is not ambiguous at all:
 * it MAPS over the source array, emitting one projected element per entry — so the
 * result mirrors the source's own cardinality. Several paths merge into one object,
 * and an empty key list means "the row itself".
 */
export declare function projectFields(row: unknown, keys: string[]): unknown;
/**
 * Merge a staged `patch` (keys may be path fields) into a **clone** of `row`.
 * Path keys nest via {@link setFieldValue}; plain keys are set directly. The
 * original row is never mutated. Used by the client (array/optimistic) save path.
 */
export declare function mergePatch<T>(row: T, patch: Record<string, unknown>): T;
/**
 * OData selector for `$orderby` / `$select` / nav column filters — dotted path
 * with `.` → `/` (`Job.Name` → `Job/Name`). Returns `null` when the path has any
 * index/wildcard segment (not expressible as a plain selector); the caller warns
 * and skips.
 */
export declare function toODataSelector(field: string): string | null;
/** A devextreme filter clause: a `[selector, op, value]` triple or a wrapped raw lambda `[string]`. */
export type ODataClause = [selector: string, op: string, value: unknown] | [raw: string];
/**
 * Quote/serialize a value as an OData literal (numbers/bools bare, strings quoted
 * with `''` escaping). Exported so `mono-filter-builder` shares one set of quoting
 * rules instead of restating them.
 */
export declare function odataLiteral(value: unknown): string;
/** Map a devextreme operator token to its OData comparison keyword. */
export declare function odataComparison(op: string): string | null;
/**
 * Build a devextreme filter clause for a (possibly path) field.
 *
 * - plain / dotted-nav → a `[selector, op, value]` triple (`['Job/Name','contains','x']`),
 *   which devextreme serializes to a nav filter.
 * - wildcard → a single wrapped raw lambda clause
 *   (`["User/any(d: contains(d/Name,'x'))"]`) — the raw-string passthrough devextreme
 *   filter arrays honor. Slots into OR/AND groups as one group member.
 *
 * Returns `null` when the field can't be expressed (a second wildcard, or an
 * index segment mixed into a remote path); the caller warns + skips.
 */
export declare function toODataClause(field: string, op: string, value: unknown): ODataClause | null;
