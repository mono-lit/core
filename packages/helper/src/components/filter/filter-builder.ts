import { createNotifier } from '../../composables/notifier.js'
import {
  arrayToODataString,
  arrayToTree,
  asRootGroup,
  emptyGroup,
  flattenTree,
  nextId,
  odataStringToArray,
  treeToArray,
} from './filter-odata.js'
import { coerceValue, defaultOperator, resolveTexts } from './filter-operators.js'
import type {
  MonoFilterBuilderOptions,
  MonoFilterController,
  MonoFilterExpression,
  MonoFilterField,
  MonoFilterGroup,
  MonoFilterGroupOperator,
  MonoFilterNode,
  MonoFilterProps,
  MonoFilterReadOptions,
  MonoFilterRule,
} from './filter-types.js'

/**
 * `monoFilterBuilder` — headless controller behind `<mono-filter-builder>`.
 *
 * Owns the editable node tree and converts it to/from the two wire shapes. The
 * element is pure presentation: it reads `tree` / `fields` / `texts` and calls the
 * edit methods, then re-renders on `subscribe`.
 *
 * `filter` is **shape-flexible** — a devextreme array is normalised, an OData
 * `$filter` string is parsed, decided by `typeof`, with no extra option. The output
 * shape is chosen independently when reading (`original`/`changed` + `type`), so a
 * string can go in and an array come out.
 *
 * @example
 * const filter = monoFilterBuilder({
 *   fields: [{ field: 'Name', caption: 'Name', dataType: 'string' }],
 *   filter: "contains(Name,'Andy')",
 * })
 * filter.changed({ type: 'array' })   // [['Name','contains','Andy']]
 */
/** Renamed "control" alias of {@link monoFilterBuilder} (no breaking change — both work). */
export { monoFilterBuilder as controlMonoFilterBuilder }

export function monoFilterBuilder(opts: MonoFilterBuilderOptions = {}): MonoFilterController {
  const texts = resolveTexts(opts.texts)
  const actions = opts.actions !== false
  const serialize = opts.toODataString ?? ((f: MonoFilterExpression) => arrayToODataString(f))

  /** Which shape the caller supplied, so `type`-less reads return the same. */
  const inputType: 'array' | 'string' = typeof opts.filter === 'string' ? 'string' : 'array'
  let warnedUnparseable = false

  /**
   * Normalise either shape into a devextreme expression. A string outside the
   * parser's subset warns ONCE and yields `null` — an empty builder is safer than
   * a filter that silently means something else.
   */
  function toExpression(filter: MonoFilterExpression | string | undefined): MonoFilterExpression {
    if (filter === null || filter === undefined || filter === '') return null
    if (typeof filter !== 'string') return Array.isArray(filter) ? filter : null
    try {
      return odataStringToArray(filter)
    } catch (err) {
      if (!warnedUnparseable) {
        warnedUnparseable = true
        console.warn(
          `[monoFilterBuilder] could not parse the OData filter string — starting empty. ` +
            `Only the subset this builder emits is supported (comparisons, contains/startswith/` +
            `endswith, in, and/or/not, parentheses). Reason: ${(err as Error).message}`,
        )
      }
      return null
    }
  }

  const originalExpression: MonoFilterExpression = toExpression(opts.filter)

  function buildTree(expr: MonoFilterExpression): MonoFilterGroup {
    const node = arrayToTree(expr)
    return asRootGroup(node ? flattenTree(node) : null) as MonoFilterGroup
  }

  let tree: MonoFilterGroup = buildTree(originalExpression)

  const notifier = createNotifier()
  const notify = notifier.notify

  // ── central element props (`opts.props`) ───────────────────────────────────
  // One object, stable identity, mutated in place — same contract as
  // `monoDataGrid`'s `table.props()`, so the bound element keeps seeing updates
  // without being re-bound. The element pulls its own slice on every notify.
  const elementProps: MonoFilterProps = { ...(opts.props ?? {}) }

  // ── fields ────────────────────────────────────────────────────────────────
  /**
   * Explicit `fields` win; a `dataGrid` only contributes columns not already
   * listed, so a table dialog can pass both and override just what it needs.
   */
  function fields(): MonoFilterField[] {
    const explicit = opts.fields ?? []
    const grid = opts.dataGrid
    if (!grid) return explicit
    const seen = new Set(explicit.map((f) => f.field))
    const derived: MonoFilterField[] = []
    for (const col of grid.props?.().th ?? []) {
      if (!col?.field || seen.has(col.field)) continue
      derived.push({ field: col.field, caption: (col.caption as string) ?? col.field })
    }
    return [...explicit, ...derived]
  }

  function fieldDef(field: string): MonoFilterField | undefined {
    return fields().find((f) => f.field === field)
  }

  // ── tree walking ──────────────────────────────────────────────────────────
  function findNode(id: string, node: MonoFilterNode = tree): MonoFilterNode | null {
    if (node.id === id) return node
    if (node.kind !== 'group') return null
    for (const c of node.children) {
      const hit = findNode(id, c)
      if (hit) return hit
    }
    return null
  }

  function findParent(id: string, node: MonoFilterGroup = tree): MonoFilterGroup | null {
    for (const c of node.children) {
      if (c.id === id) return node
      if (c.kind === 'group') {
        const hit = findParent(id, c)
        if (hit) return hit
      }
    }
    return null
  }

  function groupById(id?: string): MonoFilterGroup {
    if (!id) return tree
    const node = findNode(id)
    return node && node.kind === 'group' ? node : tree
  }

  function newRule(): MonoFilterRule {
    const first = fields()[0]
    const dataType = first?.dataType ?? 'string'
    return {
      kind: 'rule',
      id: nextId('r'),
      field: first?.field ?? '',
      operator: defaultOperator(dataType),
      value: '',
    }
  }

  // ── reads ─────────────────────────────────────────────────────────────────
  function read(expr: MonoFilterExpression, options?: MonoFilterReadOptions) {
    const type = options?.type ?? inputType
    return type === 'string' ? serialize(expr) : expr
  }

  const controller: MonoFilterController = {
    get tree() {
      return tree
    },
    get fields() {
      return fields()
    },
    get texts() {
      return texts
    },
    get actions() {
      return actions
    },

    props: () => elementProps,
    /**
     * Merge, not replace — a partial patch leaves everything else alone, matching
     * `updateRule`. `undefined` values are passed straight through: `applyProps`
     * skips them on the write side, so "not declared" can never clobber a value
     * the template set.
     */
    setProps: (patch) => {
      if (!patch) return
      Object.assign(elementProps, patch)
      notify()
    },

    original: (options) => read(originalExpression, options),
    changed: (options) => read(treeToArray(tree), options),

    setFilter: (filter) => {
      tree = buildTree(toExpression(filter))
      notify()
    },
    reset: () => {
      tree = buildTree(originalExpression)
      notify()
    },
    clear: () => {
      tree = emptyGroup(tree.operator)
      notify()
    },

    addRule: (groupId) => {
      groupById(groupId).children.push(newRule())
      notify()
    },
    addGroup: (groupId) => {
      const g = emptyGroup('and')
      g.children.push(newRule())
      groupById(groupId).children.push(g)
      notify()
    },
    /**
     * Nest a rule: replace it in place with a group holding it plus a fresh
     * sibling, which is what the row's nested-rule button means. Nesting a group
     * just adds a child group to it.
     */
    nest: (nodeId) => {
      const node = findNode(nodeId)
      if (!node) return
      if (node.kind === 'group') {
        const g = emptyGroup('and')
        g.children.push(newRule())
        node.children.push(g)
        notify()
        return
      }
      const parent = findParent(nodeId)
      if (!parent) return
      const at = parent.children.indexOf(node)
      const g = emptyGroup(parent.operator === 'or' ? 'and' : 'or')
      g.children.push(node, newRule())
      parent.children.splice(at, 1, g)
      notify()
    },
    remove: (nodeId) => {
      const parent = findParent(nodeId)
      if (!parent) return
      parent.children = parent.children.filter((c) => c.id !== nodeId)
      // A group left with nothing collapses away, so no empty shells linger —
      // except the root, which must survive for the Add-rule button to have a home.
      if (!parent.children.length && parent !== tree) controller.remove(parent.id)
      else notify()
    },
    updateRule: (ruleId, patch) => {
      const node = findNode(ruleId)
      if (!node || node.kind !== 'rule') return
      if (patch.field !== undefined && patch.field !== node.field) {
        node.field = patch.field
        // The new field's type may not offer the current operator — reset it, and
        // drop the value since it belonged to the old field.
        const dt = fieldDef(node.field)?.dataType ?? 'string'
        node.operator = defaultOperator(dt)
        node.value = ''
      }
      if (patch.operator !== undefined) node.operator = patch.operator
      if (patch.value !== undefined) {
        const dt = fieldDef(node.field)?.dataType ?? 'string'
        node.value = Array.isArray(patch.value)
          ? patch.value.map((v) => coerceValue(v, dt))
          : coerceValue(patch.value, dt)
      }
      notify()
    },
    setGroupOperator: (groupId, operator: MonoFilterGroupOperator) => {
      const node = findNode(groupId)
      if (node?.kind === 'group') {
        node.operator = operator
        notify()
      }
    },

    subscribe: (cb) => notifier.subscribe(cb),
    dispose: () => notifier.clear(),
  }

  return controller
}
