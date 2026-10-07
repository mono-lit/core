/**
 * Client-side grouping helpers shared by {@link monoArraySource} and
 * {@link monoDataGrid}. Dependency-free so @mono-lit/helper stays standalone; the
 * tree shape mirrors what a devextreme DataSource produces for `group`, so a
 * consumer can read `row.key` / `row.items[i].key` / … exactly as before.
 */
/**
 * A node in the grouped tree. `key` / `items` match devextreme's grouped shape
 * (leaf-level `items` are the raw records). The remaining fields are additive
 * metadata for rendering and collapse state — they never shadow `key`/`items`.
 */
export interface MonoGroupNode<T = any> {
    /** The group's key value (the row's value for this level's group field). */
    key: unknown;
    /** Child groups (deeper levels) or, at the innermost level, the leaf records. */
    items: Array<MonoGroupNode<T> | T>;
    /** Number of leaf records under this node. */
    count: number;
    /** Zero-based grouping depth. */
    level: number;
    /** Stable path key (e.g. `"Sales/CD001"`) — survives page/tree rebuilds. */
    path: string;
    /** Whether this node is currently collapsed in the UI. */
    collapsed: boolean;
    /**
     * Server-side group metadata (only set in `serverGroup` mode): the group's
     * total row `count` and any `aggregates` (e.g. a subtotal) from the groupby
     * query — available without loading the group's rows.
     */
    meta?: {
        key: unknown;
        count: number;
        aggregates?: Record<string, number>;
    };
}
/** Duck-type a grouped node: `{ key, items: [...] }`. */
export declare function isGroupNode(x: unknown): x is MonoGroupNode;
/**
 * Recursively collect the leaf records from a possibly-grouped array. Already
 * flat rows pass straight through, so this safely normalises both a grouped
 * payload (devextreme `type:'data'` with `group`) and a plain array.
 */
export declare function flattenLeaves<T = any>(rows: ReadonlyArray<MonoGroupNode<T> | T>): T[];
/**
 * Bucket flat leaf records into the nested {@link MonoGroupNode} tree by
 * `fields` (in order). Group order follows first appearance in `rows` — the
 * source group-orders the rows, so a paged slice renders contiguous headers.
 *
 * @param rows     Flat leaf records (already group-ordered for nice paging).
 * @param fields   Group-by field names, outermost first.
 * @param collapsed Set of collapsed `path`s; matching nodes get `collapsed:true`.
 */
export declare function buildGroups<T = any>(rows: ReadonlyArray<T>, fields: ReadonlyArray<string>, collapsed?: ReadonlySet<string>): Array<MonoGroupNode<T>>;
/** Collect every group node's `path` from a built tree (for collapse-all). */
export declare function collectGroupPaths<T = any>(nodes: ReadonlyArray<MonoGroupNode<T>>): string[];
