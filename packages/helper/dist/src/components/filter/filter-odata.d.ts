import { MonoFilterExpression, MonoFilterGroup, MonoFilterGroupOperator, MonoFilterNode } from './filter-types.js';
export declare function nextId(prefix?: string): string;
export declare function emptyGroup(operator?: MonoFilterGroupOperator): MonoFilterGroup;
/** Split a comma-separated multi-value entry, trimming and dropping blanks. */
export declare function splitMulti(value: unknown): unknown[];
/** The node tree as a devextreme filter expression, or `null` when empty. */
export declare function treeToArray(node: MonoFilterNode): MonoFilterExpression;
/** Wrap a parsed node so the root is always a group the UI can add rules to. */
export declare function asRootGroup(node: MonoFilterNode | null): MonoFilterGroup;
/** devextreme expression → node tree. Returns `null` for an empty/unusable input. */
export declare function arrayToTree(filter: unknown): MonoFilterNode | null;
/**
 * A devextreme filter expression → an OData `$filter` string. Nested groups get
 * parentheses; `contains`/`startswith`/`endswith` become function calls.
 */
export declare function arrayToODataString(filter: unknown): string;
/**
 * Parse the subset of OData `$filter` the builder itself emits: parentheses,
 * `and` / `or` / `not`, the six comparisons, `contains` / `startswith` /
 * `endswith`, `in (…)`, `null`, and quoted / numeric / boolean literals.
 *
 * Anything outside that subset throws, and the caller (`monoFilterBuilder`) warns
 * once and falls back to an empty tree — a wrong filter is worse than none.
 */
export declare function odataStringToArray(input: string): unknown[] | null;
/** Flatten same-operator nesting so `[[a,'and',b],'and',c]` reads as one group. */
export declare function flattenTree(node: MonoFilterNode): MonoFilterNode;
