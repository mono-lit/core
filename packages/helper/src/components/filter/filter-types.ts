import type { MonoTableController } from '../table/mono-data-grid.js'
import type { MonoEventProps } from '../../composables/element-props.js'

/** Value types a field can hold — drives which operators are offered. */
export type MonoFilterDataType = 'string' | 'number' | 'date' | 'datetime' | 'boolean'

/** One selectable field in the builder's field dropdown. */
export interface MonoFilterField {
  /** Data field. Dotted nav paths (`Job.Name`) are allowed. */
  field: string
  /** Label shown in the dropdown. Defaults to `field`. */
  caption?: string
  /** Defaults to `'string'`. */
  dataType?: MonoFilterDataType
  /** Fixed choices for the value editor — renders a select instead of a text input. */
  values?: Array<{ value: unknown; label?: string }>
}

/**
 * Operator tokens. These are the OData-expressible set: six comparisons, the three
 * string functions plus a negated `contains`, `in`, `between`, and the two null
 * checks (`eq null` / `ne null`).
 */
export type MonoFilterOperator =
  | 'eq'
  | 'ne'
  | 'gt'
  | 'ge'
  | 'lt'
  | 'le'
  | 'contains'
  | 'notcontains'
  | 'startswith'
  | 'endswith'
  | 'in'
  | 'between'
  | 'isblank'
  | 'isnotblank'

/** Visual size of the builder's inner controls — maps to the same theme tokens
 * (`--theme-control-height-<size>`, `--theme-control-font-<size>`,
 * `--theme-radius-<size>`) `mono-input` / `mono-button` use, so a builder sized
 * `xs` matches an `xs` field beside it. */
export type MonoFilterSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'xxl'

/** How members of a group combine. `notAnd`/`notOr` wrap the group in `not (…)`. */
export type MonoFilterGroupOperator = 'and' | 'or' | 'notAnd' | 'notOr'

/** A single condition row. */
export interface MonoFilterRule {
  kind: 'rule'
  /** Stable id for keyed rendering and edit addressing. */
  id: string
  field: string
  operator: MonoFilterOperator
  /** One value; `in` holds several; `between` holds exactly two. */
  value: unknown
}

/** A group of rules and/or nested groups. */
export interface MonoFilterGroup {
  kind: 'group'
  id: string
  operator: MonoFilterGroupOperator
  children: MonoFilterNode[]
}

export type MonoFilterNode = MonoFilterRule | MonoFilterGroup

/** Which representation to read a filter back as. */
export type MonoFilterOutput = 'array' | 'string'

/**
 * A devextreme filter expression: a `[field, op, value]` triple, a nested array of
 * those joined by `'and'` / `'or'`, or `['!', expr]` for negation.
 */
export type MonoFilterExpression = unknown[] | null

/** Every user-facing string, so the UI can be localised without forking it. */
export interface MonoFilterTexts {
  // chrome
  matchPrefix?: string
  matchSuffix?: string
  addRule?: string
  addGroup?: string
  addNested?: string
  remove?: string
  apply?: string
  clear?: string
  valuePlaceholder?: string
  multiValuePlaceholder?: string
  emptyHint?: string
  // group operators
  and?: string
  or?: string
  notAnd?: string
  notOr?: string
  // operators
  eq?: string
  ne?: string
  gt?: string
  ge?: string
  lt?: string
  le?: string
  contains?: string
  notcontains?: string
  startswith?: string
  endswith?: string
  in?: string
  between?: string
  isblank?: string
  isnotblank?: string
}

/**
 * Props for `<mono-filter-builder>`, declared centrally on the controller
 * (`controlMonoFilterBuilder({ props })`) so the element is wired with just
 * `:control-filter-builder.prop="filter"`. Read back via `filter.props()` and
 * updated with `filter.setProps()`.
 *
 * Flat rather than keyed by element (the way `monoDataGrid({ props })` is) because
 * this family has a single element — `props` IS that element's bag.
 *
 * The controller-binding keys are deliberately absent: they name the controller
 * itself, so setting them *from* the controller would be circular.
 */
export interface MonoFilterProps {
  /** Visual size of the inner controls (default `sm`). */
  size?: MonoFilterSize
  /** Fixed builder width (CSS length or px number). */
  width?: string | number
  /**
   * Fixed builder height — when set, the rules scroll between the pinned
   * Apply/Clear row and the Add rule/group row.
   */
  height?: string | number
  minWidth?: string | number
  'min-width'?: string | number
  maxWidth?: string | number
  'max-width'?: string | number
  minHeight?: string | number
  'min-height'?: string | number
  /** Caps the builder height so a long rule list scrolls instead of growing. */
  maxHeight?: string | number
  'max-height'?: string | number
  /** Anything else the element accepts. */
  [key: string]: unknown
}

export interface MonoFilterBuilderOptions {
  /**
   * Selectable fields. The source of truth — when `dataGrid` is also given, these
   * win and the grid only fills in fields not listed here.
   */
  fields?: MonoFilterField[]
  /**
   * Props for `<mono-filter-builder>`, declared here so the element needs no
   * appearance bindings of its own. Read back with `props()`, changed with
   * `setProps()`. Where both this and the template declare a key, the
   * **controller wins** — same rule as `monoDataGrid({ props })`. The builder's
   * events are accepted as `on<Event>` keys (`onChange`, `onApply`, …) and
   * attached to the element as listeners.
   */
  props?: MonoFilterProps & MonoEventProps<FilterBuilderEvents>
  /**
   * Derive the field list from a table's `props.th` (`field` + `caption`), so a
   * table filter dialog needs no duplicate list.
   */
  dataGrid?: MonoTableController
  /**
   * Starting filter. **Shape-flexible**: a devextreme array is normalised, an OData
   * `$filter` string is parsed — decided by `typeof`, no extra flag. A string
   * outside the builder's expressible subset warns once and yields an empty tree
   * rather than a wrong filter.
   */
  filter?: MonoFilterExpression | string
  /** Localised labels; anything omitted falls back to the English default. */
  texts?: MonoFilterTexts
  /** Render the Apply / Clear row above the rules. Default `true`. */
  actions?: boolean
  /**
   * Replace the built-in array→string serializer — e.g. hand it
   * `dxFilterToString` from `@mono-lit/utility`. Must be synchronous.
   */
  toODataString?: (filter: MonoFilterExpression) => string
}

/** Read options for {@link MonoFilterController.original} / `.changed`. */
export interface MonoFilterReadOptions {
  /** Output shape. Omit to get the shape the filter was originally given in. */
  type?: MonoFilterOutput
}

export interface MonoFilterController {
  /** The live node tree the UI edits. */
  readonly tree: MonoFilterGroup
  /** Fields offered in the field dropdown (explicit + any derived from `dataGrid`). */
  readonly fields: MonoFilterField[]
  /** Resolved labels, defaults merged with `texts`. */
  readonly texts: Required<MonoFilterTexts>
  /** Whether the Apply / Clear row shows. */
  readonly actions: boolean

  /**
   * The central element props (`controlMonoFilterBuilder({ props })`).
   *
   * One object with a **stable identity, mutated in place** — same contract as
   * `monoDataGrid`'s `table.props()` — so the element keeps seeing updates without
   * being re-bound.
   */
  props(): MonoFilterProps
  /**
   * Merge a patch into `props()` and notify, so the bound element re-applies at
   * once. A merge, not a replace: keys you omit keep their current value.
   */
  setProps(patch: MonoFilterProps): void

  /** The filter as first supplied, unaffected by UI edits. */
  original(options?: MonoFilterReadOptions): MonoFilterExpression | string
  /** The filter as currently edited in the UI. */
  changed(options?: MonoFilterReadOptions): MonoFilterExpression | string

  /** Replace the whole filter (either shape) and re-render. */
  setFilter(filter: MonoFilterExpression | string): void
  /** Restore the originally supplied filter. */
  reset(): void
  /** Empty the builder. */
  clear(): void

  // --- tree edits, used by the element ---
  addRule(groupId?: string): void
  addGroup(groupId?: string): void
  /** Turn a rule into a group containing it, i.e. nest one level deeper. */
  nest(nodeId: string): void
  remove(nodeId: string): void
  updateRule(ruleId: string, patch: Partial<Omit<MonoFilterRule, 'kind' | 'id'>>): void
  setGroupOperator(groupId: string, operator: MonoFilterGroupOperator): void

  /** Subscribe to any change; returns an unsubscribe. */
  subscribe(cb: () => void): () => void
  dispose(): void
}

/**
 * `<mono-filter-builder>` element props. `data-filter` is the controller (from
 * `monoFilterBuilder()` or `table.filterBuilder`); `size` scales the inner
 * controls; the width/height props size the builder (and, when slotted into a
 * `mono-table-search` filter panel, the floating panel that hosts it).
 */
/**
 * Detail carried by `change` / `apply`. The filter is given in every shape
 * so a listener doesn't have to re-read the controller: `filter` is whichever shape
 * was passed in, `array` the devextreme expression, `string` the OData `$filter`.
 */
export interface MonoFilterChangeEventDetail {
  filter: MonoFilterExpression | string
  array: MonoFilterExpression | string
  string: MonoFilterExpression | string
}

/** Detail carried by `clear` — the filter is emptied, so there is nothing to report. */
export interface MonoFilterClearEventDetail {
  filter: null
}

export type MonoFilterChangeEvent = CustomEvent<MonoFilterChangeEventDetail>
export type MonoFilterApplyEvent = CustomEvent<MonoFilterChangeEventDetail>
export type MonoFilterClearEvent = CustomEvent<MonoFilterClearEventDetail>

/**
 * Events emitted by `<mono-filter-builder>`. Each name is listed twice — kebab and
 * camel — because `dispatchMonoEvent` emits both spellings.
 */
export interface FilterBuilderEvents {
  // The plain names — what a template listens to (`@change`, `@click`, …).
  change: MonoFilterChangeEvent
  apply: MonoFilterApplyEvent
  clear: MonoFilterClearEvent
  // Kept as aliases for existing code: the `mno-` prefix and its camel twin.
  'mno-change': MonoFilterChangeEvent
  mnoChange: MonoFilterChangeEvent
  'mno-apply': MonoFilterApplyEvent
  mnoApply: MonoFilterApplyEvent
  'mno-clear': MonoFilterClearEvent
  mnoClear: MonoFilterClearEvent
}

export interface MonoFilterBuilderProps extends MonoFilterProps {
  /** The controller, bound with `:data-filter.prop` / `:dataFilter`. */
  dataFilter?: MonoFilterController
  'data-filter'?: MonoFilterController
  /** Renamed — `:control-filter-builder` / `:controlFilterBuilder` alias `dataFilter`. */
  controlFilterBuilder?: MonoFilterController
  'control-filter-builder'?: MonoFilterController
}
