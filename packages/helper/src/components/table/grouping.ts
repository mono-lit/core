/**
 * Client-side grouping helpers shared by {@link monoArraySource} and
 * {@link monoDataGrid}. Dependency-free so @mono-lit/helper stays standalone; the
 * tree shape mirrors what a devextreme DataSource produces for `group`, so a
 * consumer can read `row.key` / `row.items[i].key` / … exactly as before.
 */

import { getFieldValue, isPath } from '../../search/field-path'

/**
 * A node in the grouped tree. `key` / `items` match devextreme's grouped shape
 * (leaf-level `items` are the raw records). The remaining fields are additive
 * metadata for rendering and collapse state — they never shadow `key`/`items`.
 */
export interface MonoGroupNode<T = any> {
  /** The group's key value (the row's value for this level's group field). */
  key: unknown
  /** Child groups (deeper levels) or, at the innermost level, the leaf records. */
  items: Array<MonoGroupNode<T> | T>
  /** Number of leaf records under this node. */
  count: number
  /** Zero-based grouping depth. */
  level: number
  /** Stable path key (e.g. `"Sales/CD001"`) — survives page/tree rebuilds. */
  path: string
  /** Whether this node is currently collapsed in the UI. */
  collapsed: boolean
  /**
   * Server-side group metadata (only set in `serverGroup` mode): the group's
   * total row `count` and any `aggregates` (e.g. a subtotal) from the groupby
   * query — available without loading the group's rows.
   */
  meta?: { key: unknown; count: number; aggregates?: Record<string, number> }
}

/** Duck-type a grouped node: `{ key, items: [...] }`. */
export function isGroupNode(x: unknown): x is MonoGroupNode {
  return (
    !!x &&
    typeof x === 'object' &&
    'key' in (x as object) &&
    Array.isArray((x as { items?: unknown }).items)
  )
}

/**
 * Recursively collect the leaf records from a possibly-grouped array. Already
 * flat rows pass straight through, so this safely normalises both a grouped
 * payload (devextreme `type:'data'` with `group`) and a plain array.
 */
export function flattenLeaves<T = any>(rows: ReadonlyArray<MonoGroupNode<T> | T>): T[] {
  const out: T[] = []
  for (const row of rows) {
    if (isGroupNode(row)) {
      out.push(...flattenLeaves<T>(row.items as Array<MonoGroupNode<T> | T>))
    } else {
      out.push(row as T)
    }
  }
  return out
}

/**
 * Bucket flat leaf records into the nested {@link MonoGroupNode} tree by
 * `fields` (in order). Group order follows first appearance in `rows` — the
 * source group-orders the rows, so a paged slice renders contiguous headers.
 *
 * @param rows     Flat leaf records (already group-ordered for nice paging).
 * @param fields   Group-by field names, outermost first.
 * @param collapsed Set of collapsed `path`s; matching nodes get `collapsed:true`.
 */
export function buildGroups<T = any>(
  rows: ReadonlyArray<T>,
  fields: ReadonlyArray<string>,
  collapsed: ReadonlySet<string> = new Set(),
): Array<MonoGroupNode<T>> {
  const build = (
    items: ReadonlyArray<T>,
    level: number,
    parentPath: string,
  ): Array<MonoGroupNode<T>> => {
    const field = fields[level]
    // Preserve first-appearance order while bucketing by key.
    const buckets = new Map<string, { key: unknown; rows: T[] }>()
    for (const row of items) {
      // Grouping by a path field resolves nested/index values; a wildcard path
      // is not a single bucket key (it fans out) — getFieldValue returns the
      // array and it buckets by its String(...) form (best-effort, documented).
      const key = isPath(field)
        ? getFieldValue(row, field)
        : (row as Record<string, unknown>)?.[field]
      const keyStr = String(key)
      let bucket = buckets.get(keyStr)
      if (!bucket) {
        bucket = { key, rows: [] }
        buckets.set(keyStr, bucket)
      }
      bucket.rows.push(row)
    }

    const nodes: Array<MonoGroupNode<T>> = []
    for (const [keyStr, bucket] of buckets) {
      const path = parentPath ? `${parentPath}/${keyStr}` : keyStr
      const isLast = level >= fields.length - 1
      nodes.push({
        key: bucket.key,
        items: isLast ? bucket.rows : build(bucket.rows, level + 1, path),
        count: bucket.rows.length,
        level,
        path,
        collapsed: collapsed.has(path),
      })
    }
    return nodes
  }

  return fields.length ? build(rows, 0, '') : []
}

/** Collect every group node's `path` from a built tree (for collapse-all). */
export function collectGroupPaths<T = any>(nodes: ReadonlyArray<MonoGroupNode<T>>): string[] {
  const out: string[] = []
  const walk = (list: ReadonlyArray<MonoGroupNode<T>>): void => {
    for (const node of list) {
      out.push(node.path)
      const children = node.items
      if (children.length && isGroupNode(children[0])) {
        walk(children as Array<MonoGroupNode<T>>)
      }
    }
  }
  walk(nodes)
  return out
}
