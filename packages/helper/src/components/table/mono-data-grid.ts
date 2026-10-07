import type { MonoDataSource } from '../../composables/data-source-controller'
import { monoArraySource } from './array-source'
import { describeError, type MonoErrorMessages } from '../../utils/normalize-error'
import {
  buildGroups,
  collectGroupPaths,
  flattenLeaves,
  isGroupNode,
  type MonoGroupNode,
} from './grouping'
import { storeGroupSource } from './store-group-source'
import {
  getFieldValue,
  isPath,
  mergePatch,
  parseFieldPath,
  projectFields,
  setFieldValue,
  toODataClause,
  toODataSelector,
} from '../../search/field-path'
import { andFilters, readAllRows, searchFilterOf, type ReadableDataSource } from '../../utils/data-source-read'
import { inRange, isDateRange, parseDateValue, type MonoDateLevel, type MonoDateRange } from './date-filter-tree'
import { createApplyGate, isRolledUp, loadApply, storeRows } from '../../utils/data-source-apply'
import {
  buildSummaryApply,
  composeSummaryApply,
  summaryAliases,
  summaryFilterOf,
  summaryODataFilter,
} from '../../utils/data-source-summary'
import type { MonoExportOptions, MonoExportResult } from '../../export/types'
import type { MonoImportOptions, MonoImportResult } from '../../import/types'
import { createNotifier } from '../../composables/notifier'
import type { MonoEventProps } from '../../composables/element-props'
import type { TableDetailEvents } from './mono-table-detail-core'
import type { TableCheckboxEvents } from './mono-table-checkbox-core'
import type { TableEmptyEvents } from './mono-table-empty-core'
import type { TableErrorEvents } from './mono-table-error-core'
import { unwrapReactive, type MaybeReactive } from '../../composables/reactive'
import { monoFilterBuilder } from '../filter/filter-builder'
import {
  dataSourceOptionsKey,
  extraLoadOptions,
  normalizeSortList,
  resolveDataSourceOptions,
  toList,
  type MonoDataSourceOptions,
  type MonoOdataOptions,
  type MonoSourceSortEntry,
} from '../../utils/data-source-options'
import {
  andPredicates,
  compileFilterPredicate,
  type RowPredicate,
} from '../../search/filter-eval'
import {
  customPredicate,
  customRemoteClause,
  hasCustomSearch,
  hasWildcardSearch,
  plainSearchColumns,
  resolveSearchEntries,
  searchEntryFor,
  type MonoSearchExpr,
  type MonoSearchExprEntry,
} from '../../search/search-expr.js'
import {
  DEFAULT_SEARCH_FIELDS,
  mergeSearchFields,
  type MonoSearchFieldsAliases,
  type MonoSearchValue,
} from '../../search/data-search.js'
import type {
  MonoFilterBuilderOptions,
  MonoFilterController,
} from '../filter/filter-types'

/**
 * Structural shape of a devextreme DataSource as used by the table controller.
 * Extends the shared {@link MonoDataSource} with the extra methods devextreme
 * exposes for paging / search / filtering. All optional/duck-typed so
 * @mono-lit/helper stays dependency-free; a real devextreme DataSource satisfies it.
 */
/**
 * The subset of a devextreme store (ODataStore/CustomStore/mock store) the table
 * uses. `load` is required (server-side group paging); the write methods are
 * optional so a read-only store still satisfies the shape. A real devextreme
 * store — and the mono IndexedDB mock — supply the writes at runtime.
 */
export interface MonoGridStore {
  load(options?: unknown): PromiseLike<unknown>
  update?(key: unknown, values: Record<string, unknown>): PromiseLike<unknown> | unknown
  insert?(values: Record<string, unknown>): PromiseLike<unknown> | unknown
  remove?(key: unknown): PromiseLike<unknown> | unknown
  byKey?(key: unknown): PromiseLike<unknown> | unknown
  key?(): string | string[] | undefined
  /** OData protocol version (a devextreme `ODataStore`); absent on a CustomStore. */
  version?(): number
  /** Optimistic client-side change notification (real devextreme store). */
  push?(changes: MonoStorePush[]): void
}

export interface MonoGridSource<T = any> extends MonoDataSource<T> {
  reload?: () => PromiseLike<T[]> | T[]
  // Method syntax (bivariant params) so a real, overloaded devextreme DataSource
  // satisfies these — see the note on MonoDataSource.on.
  filter?(value?: unknown): unknown
  searchValue?(value?: unknown): unknown
  searchOperation?(op?: string): string
  searchExpr?(expr?: unknown): unknown
  sort?(value?: unknown): unknown
  /** `$select` — devextreme's accessor (`undefined` READS; clear with `null`). */
  select?(value?: unknown): unknown
  requireTotalCount?(value?: boolean): unknown
  /**
   * devextreme's live `_storeLoadOptions` object. `expand` and `customQueryParams`
   * have no accessor of their own — an ODataStore declares them as custom load
   * options — so this is the only way to set them after construction.
   */
  loadOptions?(): Record<string, unknown>
  pageCount?: () => number
  /** devextreme DataSource's underlying store — server-side group paging + writes. */
  store?(): MonoGridStore | undefined
  /** Full backing array (array sources only) — used to derive header-filter values client-side. */
  data?(): T[]
}

/** Sort direction (`null` = unsorted). */
export type SortOrder = 'asc' | 'desc' | null

/** Per-column sort config declared on a `mono-table-th` (`:sort.prop`). */
/**
 * One key in the grid's active sort. The controller keeps these in **precedence
 * order** (`sorts[0]` is primary), which is the order they reach the source and,
 * for a remote store, the order of the emitted `$orderby`.
 */
export interface MonoSortEntry {
  field: string
  order: 'asc' | 'desc'
}

/** Per-call mode for {@link MonoTableController.setColumnFilter}. */
export interface MonoSetColumnFilterOptions {
  /**
   * Keep the other columns' filters. `false` *(default)* — this column becomes the
   * ONLY filtered one, which is what the funnel icon does. `true` combines across
   * columns (AND between them, OR within one) — what the header's right-click
   * `Header Filter ›` row does, and the only way to filter two columns at once.
   */
  multi?: boolean
  /**
   * This write is the COMBINE GESTURE (the right-click `Header Filter ›` row):
   * remember it, so that until nothing is filtered any more the funnel icon
   * combines too — a user who started combining means to keep combining. A
   * replace (`multi: false`) or an emptied filter forgets it. Read back with
   * `columnFilterCombining()`. Only meaningful with `multi: true`.
   */
  sticky?: boolean
}

/** Per-call mode for {@link MonoTableController.setSort}. */
export interface MonoSetSortOptions {
  /**
   * Accumulate instead of replacing. `false` *(default)* — the field becomes the
   * ENTIRE sort, which is what a column's sort arrow does. `true` appends an
   * unsorted field (pick order = precedence), changes an already-sorted one in
   * place, and drops just that field on `null` — what the header's right-click
   * `Sort ›` menu does.
   */
  multi?: boolean
  /**
   * This write is the COMBINE GESTURE (the right-click `Sort ›` menu): remember
   * it, so that until nothing is sorted any more the sort arrow appends too. A
   * replace (`multi: false`) or an emptied sort forgets it. Read back with
   * `sortCombining()`. Only meaningful with `multi: true` — a seeded default
   * sort passes `multi` without it, since it is not a gesture.
   */
  sticky?: boolean
}

export interface MonoColumnSort {
  /**
   * Whether the column is sortable at all. Defaults to `true` when a `sort` object
   * is given — `sort: true` is the shorthand for "sortable with defaults" (`{}`
   * still means the same).
   *
   * `enable: false` removes the sort UI entirely (identical to omitting `sort`) —
   * unlike `disabled`, which still renders the affordance but ignores clicks.
   */
  enable?: boolean
  /**
   * Initial direction, seeded once when the column registers. Omit = unsorted.
   * Several columns may each seed one — they combine, in registration order
   * unless `index` pins them.
   */
  order?: 'asc' | 'desc'
  /**
   * **1-based** sort precedence. `index: 1` makes this column the primary key,
   * `index: 2` the secondary, and so on — whenever it is part of the sort, whether
   * it got there from `order` or from a click.
   *
   * Columns without an `index` keep their click order and fill the slots after
   * every indexed one. Gaps and duplicates are fine: the numbers only decide
   * relative order, so `index: 10` simply sorts after `index: 2`.
   */
  index?: number
  /** Cycle `asc ↔ desc` only (never clears). */
  noClear?: boolean
  /** Sortable UI is shown but inert. */
  disabled?: boolean
  /**
   * Show the sort arrow beside the caption. Default `true`.
   *
   * The arrow is the single-sort click target, so hiding it moves that trigger
   * back onto the **caption** — the column stays sortable, it just loses the
   * glyph. Right-click still opens the header menu either way, and the `<sup>`
   * precedence badge renders either way.
   */
  showIcon?: boolean
}

/** Devextreme load options for a header filter's DISTINCT-values request. */
export interface MonoHeaderFilterLoadOptions {
  /** Columns to fetch. Defaults to `[field]`; pass `null`/`[]` to send none. */
  select?: string | string[] | null
  /** Extra devextreme filter expression. Default: none. */
  filter?: unknown
  sort?: unknown
  /** `$top`. Default: **none** — the request is uncapped. */
  take?: number | null
  /** `$skip`. Default: none. */
  skip?: number | null
  requireTotalCount?: boolean
  [key: string]: unknown
}

/**
 * Header-filter config for a column. `headerFilter: true` is shorthand for all of
 * these defaults.
 */
export interface MonoHeaderFilter {
  /** Whether the filter is active. Defaults to `true` when an object is given. */
  enable?: boolean
  /** Panel heading. Default `Filter: <caption or field>`. */
  title?: string
  /**
   * Show the funnel icon left of the caption. Default `true`. The funnel opens the
   * value panel directly; right-click the header reaches it via the menu's
   * `Header Filter ›` row either way, so hiding the icon never strands it.
   */
  showIcon?: boolean
  /**
   * Shapes the DISTINCT-values request. Defaults to `{ select: [field] }` only —
   * no `$filter`, no `$top`, no `$skip`, so an uncapped column scan. Set `take`
   * to cap it on a large table.
   */
  dataSourceOptions?: MonoHeaderFilterLoadOptions
}

/**
 * Date-filter config for a column — the header filter's sibling for date /
 * datetime columns. `dateFilter: true` is shorthand for all of these defaults.
 *
 * The panel is a TREE: years, each expandable to the months, days, hours,
 * minutes and seconds that occur in the data (down to `depth`), with row counts.
 * Ticking a node filters to that whole period; the applied filter is a list of
 * `{ from, to }` ranges (`table.columnFilter(field)`), OR-ed. Exclusive with
 * `headerFilter` on the same column — both set, this one wins with a warning.
 * The values come from the SAME `distinctValues` request the header filter
 * makes (cascade, resolver, `$apply` → scan fallback included): every distinct
 * timestamp in scope, once per open, and the tree is built client-side.
 */
export interface MonoDateFilter {
  /** Whether the filter is active. Defaults to `true` when an object is given. */
  enable?: boolean
  /** Panel heading. Default `Filter: <caption or field>`. */
  title?: string
  /** Show the funnel icon left of the caption. Default `true`. */
  showIcon?: boolean
  /** Deepest tree level. Default `'month'`; `'day'` for a date-only column, `'second'` for the full drill-down. */
  depth?: MonoDateLevel
  /** Read the year/month/… parts in UTC rather than local time. Default `false`. */
  utc?: boolean
  /** BCP-47 tag for the month and weekday names. Default: the browser's. */
  locale?: string
  /**
   * Shapes the DISTINCT-values request, exactly as `headerFilter.dataSourceOptions`
   * — set `take` to cap a huge datetime column (one value per distinct timestamp).
   */
  dataSourceOptions?: MonoHeaderFilterLoadOptions
}

export type { MonoDateLevel, MonoDateRange } from './date-filter-tree'
export { isDateRange } from './date-filter-tree'

/**
 * What a `distinctValues` resolver is handed, beside the load options — the
 * grid's base filter in the forms an `$apply` builder needs. Mirrors
 * {@link MonoSummaryResolveContext}, which is the other consumer-built `$apply`.
 */
export interface MonoDistinctValuesContext {
  /**
   * The grid's base — `dataSourceOptions` / `odataOptions`, whatever the consumer
   * set on the source, `setFilter()` — AND-ed with the column's own
   * `headerFilter.dataSourceOptions.filter`. NOT the other columns' filters
   * (this panel is how those change) and not the search. Devextreme array form.
   */
  filter: unknown
  /** `filter` as an OData string, or `''` when there is none. */
  odataFilter: string
  /** `groupby((<field>),aggregate($count as count))` — no filter applied. */
  apply: string
  /** `filter(<odataFilter>)/groupby(…)` — or just the groupby when there is no filter. */
  applyWithFilter: string
  /** The bound source, for a resolver that needs its store or url. */
  source: unknown
}

// The universal base-query options live in `utils/data-source-options` and are
// shared with the chart controller; re-exported here so the table entry keeps
// its public path.
export type {
  MonoDataSourceOptions,
  MonoOdataOptions,
  MonoSourceSortEntry,
} from '../../utils/data-source-options'

/**
 * One column in `monoDataGrid({ props: { th } })` — everything that column needs,
 * declared once: its `mono-table-th` props, plus the `sort` and `summary` config
 * its `<mono-table-sort field>` / `<mono-table-summary field>` siblings read.
 *
 * The consumer loops this list themselves (`state.th`) — the library never renders
 * the header for you.
 */
export interface MonoTableColumnProps {
  /** Column field — also the identity every element matches on. Path-aware. */
  field: string
  caption?: string
  /**
   * Sortable config for both the `th` and a `<mono-table-sort field=…>`.
   * `true` = sortable with every default (the same as `{}`, which still works);
   * an object tunes it — see {@link MonoColumnSort}. `false` / omitted = not sortable.
   */
  sort?: boolean | (MonoColumnSort & { disabled?: boolean; noClear?: boolean; caption?: string })
  /** Aggregate for a `<mono-table-summary field=…>`; also registered as a spec. */
  summary?: Omit<MonoSummarySpec, 'field'>
  editable?: boolean
  editableTrigger?: MonoEditableTrigger
  /**
   * Draw a red `*` after this column's caption, so a user can see which columns
   * want input. Presentation only: `editable` is what opens an editor.
   */
  required?: boolean
  /** `true` for the defaults, or an object to set the title / icon / query. */
  headerFilter?: boolean | MonoHeaderFilter
  /**
   * A header filter for a DATE column: the panel is a year → … → second tree.
   * `true` for the defaults, or an object — see {@link MonoDateFilter}. Not
   * together with `headerFilter`.
   */
  dateFilter?: boolean | MonoDateFilter
  /**
   * Presentation value for THIS column, written onto the mapped row under `field`
   * (`table.mapped` / `displayRows[].mapped`) — the raw row in `items` is untouched.
   *
   * It always receives the **raw** field value (and the raw row), never the
   * grid-level map's output — that is what keeps the body and the header-filter
   * list in agreement, since the filter can only feed it a raw distinct value.
   * It is applied last, so it overwrites whatever
   * {@link MonoDataGridOptions.map} put in this field.
   *
   * It also relabels this column's **header-filter** list, while the checkboxes
   * keep sending the RAW value, so filtering still matches the real data.
   *
   * Display only: search, sort, filters and summaries all read the raw value —
   * sorting a formatted date string would order it as text.
   *
   * @example map: (v) => formatDateTime(v)
   */
  map?: (value: any, row: any, index: number) => unknown
  width?: string | number
  height?: string | number
  /**
   * Header alignment: `'left' | 'center' | 'right'`. Applied to the column's `<th>`.
   *
   * The body cells are the consumer's own markup, so mono cannot align them — but this is the
   * one place the intent is declared, and a `<td>` loop reading the same column entry keeps the
   * two sides in step.
   */
  align?: 'left' | 'center' | 'right'
  /** Anything else the element accepts. */
  [key: string]: unknown
}

/**
 * Central props for the `mono-table-*` elements, so each is wired with just
 * `:data-grid.prop="table"`. Keys declared here WIN over the same attribute
 * written on the element (matching `monoForm`'s `setProp`); keys absent here are
 * left entirely to the element.
 *
 * A slot also takes its element's events as `on<Event>` keys — `detail: {
 * onToggle }`, `error: { onReload }` — attached as listeners on EVERY element
 * of that slot bound to this grid, so a row detail's `event.detail.rowKey` says
 * which one fired.
 */
export interface MonoTableProps {
  /** Per-column config — `th`, `sort` and `summary` all resolve from this list. */
  th?: MonoTableColumnProps[]
  search?: Record<string, unknown>
  info?: Record<string, unknown>
  paging?: Record<string, unknown>
  loading?: Record<string, unknown>
  /**
   * Shared defaults for every `<mono-table-empty>` bound to this grid — one place
   * to set the `icon` / `title` / `subtitle` / `reload` an app uses everywhere,
   * instead of restating them on each table.
   */
  empty?: Record<string, unknown> & MonoEventProps<TableEmptyEvents>
  /**
   * Shared defaults for every `<mono-table-error>` bound to this grid — one place
   * to set `dismissible` / `closeLabel` for the whole app.
   */
  error?: Record<string, unknown> & MonoEventProps<TableErrorEvents>
  pageSize?: Record<string, unknown>
  pagingGroup?: Record<string, unknown>
  /**
   * Shared defaults for EVERY `<mono-table-detail>` bound to this grid — the
   * icons, `disabled`, `stay-open`. `open` is deliberately ignored here: it is
   * per-row state the user toggles, so re-applying it centrally would undo every
   * click. Open/close from code with {@link MonoTableController.detail}.
   */
  detail?: Record<string, unknown> & MonoEventProps<TableDetailEvents>
  /**
   * Shared defaults for every `<mono-table-checkbox>` bound to this grid — the
   * natural home for `keyValue` / `mode` / `chunk`, so the header and the row
   * checkboxes can't disagree.
   */
  checkbox?: Record<string, unknown> & MonoEventProps<TableCheckboxEvents>
}

/**
 * A registered `<mono-table-detail>`, as the controller sees it. Only the two
 * pieces of state `table.detail()` drives are part of the contract.
 */
export interface MonoDetailEl {
  /** Whether the row's panel is showing. */
  open: boolean
  /**
   * Exempt from every AUTOMATIC close — both the accordion
   * ({@link MonoDetailHandle.collapseOthers}) and {@link MonoDetailHandle.collapseAll}.
   * Not a lock: the row's own chevron still closes it.
   */
  stayOpen?: boolean
  /** Present on real elements; used to return `getAll()` in DOM order. */
  compareDocumentPosition?(other: Node): number
}

/** The handle returned by `table.detail()`. */
export interface MonoDetailHandle {
  /** Open every registered detail (never auto-closes anything). */
  expandAll(): void
  /**
   * Close every registered detail EXCEPT those marked `stay-open`. Those keep
   * their panel; their own chevron still closes them by hand.
   */
  collapseAll(): void
  /**
   * Close every registered detail except `except` and the `stay-open` ones.
   *
   * This is the **accordion**: `<mono-table-detail>` calls it on itself whenever
   * the user opens it, so opening one row closes the row that was open. Details
   * registered on a DIFFERENT controller (a nested grid's) are untouched, which
   * is what lets a nested table run its own accordion.
   */
  collapseOthers(except?: MonoDetailEl): void
  /** How many panels are open right now. */
  openCount(): number
  /** Every registered `<mono-table-detail>`, in DOM (visual) order. */
  getAll(): MonoDetailEl[]
}

/**
 * How a `type="all"` `<mono-table-checkbox>` selects.
 *
 * - `'all'` — drains the SOURCE in `chunk`-sized requests and selects every row
 *   the active search/filter matches, including rows never fetched for display.
 * - `'per-page'` — selects the loaded page only. No request.
 */
export type MonoCheckMode = 'all' | 'per-page'

/** Shared config for the checkboxes bound to one grid. */
export interface MonoCheckConfig {
  /**
   * Field(s) `getAll()` projects each selected row down to. Path-aware and
   * shape-preserving: `['Company.Name', 'Transaction.[*].Id']` yields
   * `{ Company: { Name }, Transaction: [{ Id }] }`. Omit for the whole row.
   */
  keyValue?: string | string[]
  mode?: MonoCheckMode
  /** Rows per request while draining in `mode: 'all'` (default 100). */
  chunk?: number
  /**
   * Most rows the USER can have selected (unset = unlimited). A pick past the cap
   * is rejected — the store does not change and notifies so a bound checkbox
   * un-ticks itself; a bulk select (`selectPage` / `selectAll`) fills only the
   * room left. `replace()` is not capped: a value the developer pushes in is theirs.
   */
  max?: number | null
  /**
   * Fewest rows the USER can leave selected (unset = 0). Un-ticking at the floor
   * is rejected the same way; `clear()` keeps the first `min` rows. Only guards
   * removals — an empty store starts empty regardless.
   */
  min?: number | null
}

/** The user-facing selection limits, resolved to numbers. */
export interface MonoCheckLimits {
  max?: number
  min?: number
}

/** The handle returned by `table.check()`. */
export interface MonoCheckHandle<T = any> {
  /**
   * The selection, each row projected through `keyValue`. **Synchronous** — it
   * returns what is selected right now, so a template can read it directly; a
   * `mode: 'all'` drain fills it in and notifies when it lands.
   */
  getAll(): T[]
  /** How many rows are selected. */
  count(): number
  /**
   * The selected rows themselves, in selection order and UNPROJECTED — unlike
   * {@link getAll}, which narrows each row to `keyValue`. For callers that need the
   * whole row back (the dropdown derives its `modelValue` and chip text from these).
   */
  rows(): T[]
  /** Whether a row (or its `rowKey`) is selected. */
  isChecked(row: T | string): boolean
  /** Select / deselect one row. Omit `checked` to flip it. */
  toggle(item: T, checked?: boolean): void
  /** Select every row of the loaded page. */
  selectPage(): void
  /**
   * Replace the whole selection in ONE update. The bulk primitive: setting N rows
   * through {@link toggle} would notify N times, which is the difference between
   * one render and 830 of them.
   */
  replace(rows: readonly T[]): void
  /**
   * Select everything the current search/filter matches, draining the source in
   * `chunk`-sized requests. Resolves when the drain finishes; the selection is
   * also readable (and notified) as it lands.
   *
   * The last drain is remembered, so calling this again over the **same row set**
   * — the "select all, untick one, select all again" loop — re-selects instantly
   * and issues no request. Any change to the filter, search, `keyValue`
   * projection or the data itself walks the source afresh.
   */
  selectAll(): Promise<void>
  /** Empty the selection. */
  clear(): void
  /** Whether a `selectAll()` drain is in flight. */
  readonly pending: boolean
  /** Every loaded row is selected (and there is at least one). */
  readonly allChecked: boolean
  /** Some — but not all — loaded rows are selected (the indeterminate state). */
  readonly someChecked: boolean
  /** The configured `max` / `min` (see {@link MonoCheckConfig}), sanitised. */
  limits(): MonoCheckLimits
  /** `max` is set and the selection has reached it — the next pick is rejected. */
  readonly atMax: boolean
  /** `min` is set and the selection is at (or under) it — the next removal is rejected. */
  readonly atMin: boolean
  /** Set the shared config. Called by the elements from their own props. */
  configure(config: MonoCheckConfig): void
}

/** A resolved column definition, as read from a registered `mono-table-th`. */
export interface MonoColumn {
  /**
   * Column field. May be a **path expression** into nested / collection data —
   * `"Job.Name"` (nested), `"User.[1].Id"` (index), `"User.[*].Name"` (wildcard).
   * `.`/`[` are reserved. See {@link getFieldValue} / {@link toODataClause}.
   */
  field: string
  caption?: string
  /** `true` = sortable with defaults; an object tunes it; `false` / omitted = not sortable. */
  sort?: boolean | MonoColumnSort
  /** Whether the column's cells can be edited (`mono-table-th` `editable`). */
  editable?: boolean
  /** The column's header-filter config (`mono-table-th` `header-filter`), if any. */
  headerFilter?: boolean | MonoHeaderFilter
  /** The column's date-filter config (`mono-table-th` `date-filter`), if any. */
  dateFilter?: boolean | MonoDateFilter
}

/**
 * One search term. `field` binds it to a single column (a "context"); omit it to
 * search every `searchExpr` column, which is the classic single-box behaviour.
 *
 * Terms group by `field`: **OR within a field, AND across fields** — so two terms
 * on `Nama` widen, while a term on `Code` narrows.
 */
export interface MonoSearchTerm {
  value: string
  field?: string
}

/** One distinct value of a column, with its occurrence count — for the header filter list. */
export interface MonoColumnValue {
  value: unknown
  count: number
}

/**
 * One entry of the central `columns` config passed to `monoDataGrid(data, { columns })`.
 * Extensible on purpose — only `field` (and optionally `caption`) are used today; add
 * per-column props here later without changing the API. Read via `table.columns()`.
 *
 * Distinct from {@link MonoColumn} (the live props of a registered `<mono-table-th>`,
 * read via `table.registeredColumns()`).
 */
export interface MonoColumnDef {
  field: string
  caption?: string
  [key: string]: unknown
}

/**
 * How a row's inline editor is opened. `'click'` (the default) opens on a single
 * click anywhere in the row; `'double-click'` requires a double-click, leaving
 * single clicks free for row selection or other interactions.
 *
 * Clicks that land on an editor (`[data-edit-cell]`) or on an interactive control
 * (button / link / form field) never open the editor under either setting, so a
 * row's own Edit / Delete buttons keep working.
 */
export type MonoEditableTrigger = 'click' | 'double-click'

/**
 * What happens to the PUBLISHED rows when a load fails. `'clear-list'` (default)
 * empties `items` / `totalCount` so the table never shows the previous scope's
 * rows under the error bar; `'keep-list'` leaves them as they were. A failed
 * select-all drain never clears — it is not the row set.
 */
export type MonoErrorBehaviour = 'clear-list' | 'keep-list'

/**
 * How the keyboard moves between inline editors — `'tab-arrows'` (default; tap
 * `Tab` for the next column, hold `Tab` + an arrow to move one cell that way) or
 * `'native'` (the browser's own Tab order, the pre-existing behaviour).
 * See {@link MonoDataGridOptions.editorNavKeys}.
 */
export type MonoEditorNavKeys = 'tab-arrows' | 'native'

/** A direction for {@link MonoDataGridController.moveEditor}. */
export type MonoEditorDirection = 'left' | 'right' | 'up' | 'down'

/** The iterable handle returned by `table.columns()` (mirrors {@link MonoSummaryHandle}). */
export interface MonoColumnHandle {
  /** The column def for `field`, or `null` when it isn't in the config. */
  get(field: string): MonoColumnDef | null
  /** Every configured column def, in declaration order — loop to render / inspect. */
  getAll(): MonoColumnDef[]
}

/**
 * A registered header-cell element (`mono-table-th`). Structural so the
 * controller stays free of a Lit/DOM import — the element supplies the live
 * column props plus `compareDocumentPosition` for DOM-order sorting.
 */
export interface MonoColumnEl extends MonoColumn {
  compareDocumentPosition?(other: Node): number
}

/** Payload emitted by `commitCell` / consumed via `controller.onCellChange`. */
export interface MonoCellChange<T = any> {
  rowKey: string
  field: string
  value: unknown
  row: T | undefined
}

/** One staged row edit, as returned by `controller.changes()`. */
export interface MonoStagedChange<T = any> {
  /** The controller's string row key (`rowKeyOf`). */
  rowKey: string
  /** The server/entity key value (`row[keyExpr]`), for a store `update`. */
  key: unknown
  /** The accumulated field→value patch for this row. */
  patch: Record<string, unknown>
  row: T | undefined
}

/** Optional config for {@link MonoTableController.form}. */
export interface MonoFormConfig<T = any> {
  /** Match field for edit/delete + dedupe on add (default: the grid's keyExpr). */
  key?: keyof T & string
  /**
   * Inline-add mode. When `true`, `add()` inserts the new row into the grid
   * **immediately** (not just the buffer), tagged `_Type: 'Editable'`, and marks
   * it so `isEditingCell(rowKey, field)` returns `true` for its editable columns —
   * so you can render inline editors with `v-show="table.isEditingCell(...)"` and
   * let the user fill the row in place. `apply()` then commits it (stripping the
   * `_Type` marker); `discard()` removes it from the grid again. Filling a cell of
   * such a row writes straight through to the row object (not the cell buffer), so
   * the value the user types is what `apply()` commits. Use `table.rowKey(row)` for
   * the row's key — it stays stable even if the user edits the key field.
   */
  showForm?: boolean
}

/** One staged row op in the {@link MonoTableController.form} buffer. */
export type MonoFormOp<T = any> =
  | { op: 'add'; rows: T[] }
  | { op: 'edit'; key: unknown; row: Partial<T> }
  | { op: 'delete'; key: unknown }

/** One entry for a devextreme store `push()` batch. */
export interface MonoStorePush {
  type: 'insert' | 'update' | 'remove'
  key?: unknown
  data?: Record<string, unknown>
}

/**
 * Chainable handle for optimistic, row-level CRUD staging. `add`/`edit`/`delete`
 * buffer ops; `apply()` commits them into the rendered data **locally** — it does
 * NOT call the server (the caller already ran their change API). Works for both an
 * array source and a remote DataSource. Repeated `form()` calls share one buffer.
 */
export interface MonoFormHandle<T = any> {
  /** Stage an insert: no arg = one empty row (shape inferred from existing data), one row, or many. */
  add(row?: Partial<T> | Array<Partial<T>>): MonoFormHandle<T>
  /** Stage an update of the row whose key field == `key`. No-op if the key is not found. */
  edit(key: unknown, row: Partial<T>): MonoFormHandle<T>
  /** Stage removal of the row whose key field == `key`. No-op if the key is not found. */
  delete(key: unknown): MonoFormHandle<T>
  /**
   * Commit all staged ops into the rendered data. Local only, and **final** —
   * there is no undo of a committed apply (the intended flow saves to your API
   * first, then applies to reflect the persisted result). Use {@link discard} to
   * cancel everything *before* apply, or {@link revert} to drop ONE staged row.
   */
  apply(): Promise<void>
  /**
   * Cancel a single **un-applied** row by its `table.rowKey(row)` — removes the
   * inline `showForm` row from the grid and drops its staged `add` from the buffer.
   * Per-row counterpart to {@link revertAll}. No-op for a key that isn't a staged
   * inline row; never removes already-committed data.
   */
  revert(key: unknown): MonoFormHandle<T>
  /**
   * Cancel **all** un-applied inline (`showForm`) rows at once — the bulk form of
   * {@link revert}. Removes every inline row from the grid and its staged `add`,
   * but leaves staged `edit`/`delete` ops for existing rows untouched.
   */
  revertAll(): MonoFormHandle<T>
  /** Snapshot copy of the staged ops. */
  changes(): Array<MonoFormOp<T>>
  /**
   * Drop staged ops. With **no arg**, clears the whole `form()` buffer (all
   * `add`/`edit`/`delete`) and removes un-applied inline rows. With a **key**, drops
   * only the staged ops for that key — any `edit`/`delete` op with that key, plus an
   * inline `add` row whose `table.rowKey(row)` matches (removing it from the grid).
   * Does not touch the inline **cell**-edit buffer (`stageCell`) or edit mode — use
   * {@link discardAll} for a complete reset.
   */
  discard(key?: unknown): MonoFormHandle<T>
  /**
   * Full reset: everything {@link discard} does **plus** clearing the cell-edit
   * buffer (`discardChanges`) and leaving edit mode (`cancelEdit`) — one call to
   * cancel every pending change across both editing systems.
   */
  discardAll(): MonoFormHandle<T>
}

/** Column aggregate kinds supported by {@link MonoTableController.summary}. */
export type MonoSummaryType =
  | 'sum'
  | 'avg'
  | 'count'
  | 'min'
  | 'max'
  | 'countDistinct'

/**
 * One column-summary spec. Declared centrally (see {@link MonoSummaryConfig} or
 * the array form); a `<mono-table-summary>` footer cell, `table.summary(field)`,
 * or `table.summary().getAll()` then reads the result.
 */
export interface MonoSummarySpec {
  /**
   * Data field to aggregate — path-aware (`"Job.Salary"`, `"User.[0].Age"`),
   * resolved with `getFieldValue`. Optional for `type: 'count'` (counts rows).
   */
  field?: string
  /** Aggregate kind. Default `'sum'`. */
  type?: MonoSummaryType
  /**
   * Disambiguates two summaries on the SAME field (e.g. a `sum` and an `avg` of
   * `Price`) so `summary('Price', type)` / a `name`-keyed element can pick one.
   */
  name?: string
  /** Decimal places for the formatted value (`summaryText`). */
  precision?: number
  /** Leading / trailing text on the formatted value (e.g. `prefix: '$'`). */
  prefix?: string
  suffix?: string
  /** Text shown when the value is `null` (no numeric data). Default `'—'`. */
  emptyText?: string
  /** Full formatter override — wins over `precision`/`prefix`/`suffix`. */
  format?: (value: number | null, rows: unknown[]) => string
}

/** A per-field summary spec — {@link MonoSummarySpec} minus `field` (the key supplies it). */
export type MonoSummaryFieldSpec = Omit<MonoSummarySpec, 'field'>

/** When the aggregates are recomputed. */
export interface MonoSummaryRecalculate {
  /**
   * Recompute when the view is narrowed by search / filters. Default `false` —
   * so a total shows the WHOLE dataset regardless of the current search box or
   * header filters. Set `true` to make it track what's on screen.
   */
  searching?: boolean
  /**
   * Recompute when the underlying data changes (rows added / removed / reloaded /
   * `setData`). Default `true`. (The first computation always runs regardless.)
   */
  changedData?: boolean
}

/**
 * Object form of the `summary` option — keyed by field, with recompute controls.
 *
 * @example
 * monoDataGrid(data, {
 *   summary: {
 *     recalculate: { searching: false, changedData: true },
 *     fields: {
 *       Price: { type: 'sum', prefix: '$', precision: 2 },
 *       Qty:   [{ type: 'sum' }, { type: 'avg', name: 'average', precision: 1 }],
 *     },
 *   },
 * })
 */
export interface MonoSummaryConfig {
  recalculate?: MonoSummaryRecalculate
  /**
   * One spec (or several) per field. Optional: when the aggregates are declared
   * per column in `props.th[].summary`, this form is still the only place to set
   * `recalculate`, so `{ recalculate }` on its own is valid.
   */
  fields?: Record<string, MonoSummaryFieldSpec | MonoSummaryFieldSpec[]>
  /**
   * Compute the totals on the SERVER instead of draining every row for them.
   *
   * A total covers the whole filtered set rather than the current page, so
   * without this the grid reads every matching row in `take: 100` chunks and
   * adds them up here. Over an array that is free. Over a **server-paged** table
   * it is the pathological case: opening a grid that shows ten rows fires a
   * burst of `$skip`/`$top` requests for every row the pager exists to avoid.
   *
   * It is a hook rather than something automatic because it has to be.
   * devextreme's OData store has NO aggregate support — `totalSummary`,
   * `groupSummary` and `$apply` are absent from it, and an unknown load option
   * is dropped in silence — so there is nothing for the library to ask. Only the
   * consumer knows the source's url and fetcher. The context arrives with the
   * clause already built, so a resolver is usually three lines:
   *
   * ```ts
   * summary: {
   *   fields: { Price: { type: 'sum' } },
   *   resolve: async ({ applyWithFilter }) => {
   *     const { data } = await myFetch({ url: '/Orders', params: { \$apply: applyWithFilter } })
   *     return data?.[0] ?? null   // keyed by alias — or `null` to fall back
   *   },
   * }
   * ```
   *
   * Also settable after construction with
   * {@link MonoTableController.setSummaryResolver}, for a grid built by a
   * factory that does not forward this option.
   */
  resolve?: MonoSummaryResolver
}

/**
 * What a {@link MonoSummaryResolver} is handed — everything needed to ask a
 * server for the totals, with the OData clause already built.
 */
export interface MonoSummaryResolveContext {
  /** The aggregates to compute, in order. A positional result must match this. */
  specs: readonly MonoSummarySpec[]
  /** Response key per spec, parallel to `specs` — what an object result is read by. */
  aliases: readonly string[]
  /**
   * The predicate to aggregate over: the source's own filter AND its active
   * search, as a devextreme expression. The SAME one the drain would use.
   */
  filter: unknown
  /** `filter` as an OData string, or `''` when there is none. */
  odataFilter: string
  /** `aggregate(Price with sum as Price, …)` — no filter applied. */
  apply: string
  /** `filter(<expr>)/aggregate(…)` — what an `$apply` parameter usually wants. */
  applyWithFilter: string
  /** The bound source, for a resolver that needs its store or url. */
  source: unknown
}

/**
 * Compute the registered summaries somewhere other than the browser.
 *
 * Return one value per spec — positionally, or keyed by {@link
 * MonoSummaryResolveContext.aliases} (or plain field name) — and the grid uses
 * them as-is. Return `null` to decline, and it drains and aggregates locally
 * exactly as it would without a resolver, so declining is always safe: a
 * resolver that cannot answer for this source, or whose request failed, should
 * return `null` rather than guess.
 *
 * THROWING also falls back, and is reported once; prefer `null` for the
 * expected cases so a real fault stays visible.
 */
export type MonoSummaryResolver = (
  ctx: MonoSummaryResolveContext,
) => Promise<(number | null)[] | Record<string, number | null> | null> | (number | null)[] | Record<string, number | null> | null

/** A computed summary — what `table.summary().get/getAll` return, for rendering anywhere. */
export interface MonoSummaryResult {
  field?: string
  type: MonoSummaryType
  name?: string
  /** The numeric aggregate, or `null` when there's no numeric data. */
  value: number | null
  /** The formatted value per the spec (`format`/`prefix`/`precision`/`suffix`). */
  text: string
}

/** The iterable handle returned by `table.summary()` (no args). */
export interface MonoSummaryHandle {
  /** One result by field (and optional type), or `null` if there's no such spec. */
  get(field: string, type?: MonoSummaryType): MonoSummaryResult | null
  /** Every computed summary — loop this to render totals outside the footer. */
  getAll(): MonoSummaryResult[]
}

export interface MonoDataGridOptions extends MonoSearchFieldsAliases {
  /**
   * Columns searched by `setSearch`. Each entry may be a **path expression** —
   * `"Job.Name"` (nested), `"User.[1].Id"` (index) or `"User.[*].Name"` (wildcard).
   * Array sources resolve paths client-side; a remote OData source translates a
   * wildcard column to a lambda (`Detail.[*].Bulan` → `Detail/any(d: …)`).
   *
   * An entry may also be `{ field, custom }` to build its own clause, for a column
   * `contains` can't search — a boolean, or a code the user never types:
   *
   * ```ts
   * searchExpr: [
   *   'Code',
   *   { field: 'Active', custom: ({ field, value }) => `${field} eq ${value}` },
   *   { field: 'Month',  custom: ({ field, value }) => [field, '=', MONTHS.indexOf(value)] },
   * ]
   * ```
   *
   * The custom runs for every term (return `null` to opt out of one).
   *
   * An entry may also be a **`*` pattern**, resolved against the loaded rows, so a
   * grid can search everything without listing columns. Patterns read literally,
   * segment by segment:
   *
   * ```ts
   * searchExpr: ['*']                    // every top-level field
   * searchExpr: ['*', '*.*']             // …plus every field of a nested OBJECT
   * searchExpr: ['*', '*.[*].*']         // …plus every field of a nested ARRAY
   * searchExpr: ['*', { field: 'Month', custom }]  // explicit entries always win
   * ```
   *
   * A remote source only gets clauses for **string** columns (`contains(Price,'x')`
   * is not valid OData); give a non-text column an explicit entry.
   *
   * Neither customs nor patterns are honoured in server-group mode (`serverGroup` /
   * an auto server-grouped store), which keeps plain columns.
   *
   * **Four interchangeable spellings.** `searchExpr`, `search-expr`, `searchValue`
   * and `search-value` all name this same option — `search-value` is what
   * `mono-select` / `mono-tag-input` call it, and the grid accepts it so one
   * expression is portable between them. Passing more than one **merges** them
   * (de-duplicated by field); `searchExpr` is kept for back-compat.
   *
   * Each also accepts a **comma-separated string** instead of an array — a comma
   * can't appear in a path or a pattern, so the two forms are equivalent:
   *
   * ```ts
   * searchExpr: ['Company.Name', 'Transaction.[*].Price', '*.[*].*']
   * 'search-value': 'Company.Name,Transaction.[*].Price,*.[*].*'
   * ```
   */
  searchExpr?: MonoSearchValue
  /** Search operation (default `'contains'`). */
  searchOperation?: string
  /** Rows per page when wrapping a plain array (forwarded to `monoArraySource`). */
  pageSize?: number
  /**
   * Group-by field(s), outermost first (e.g. `['Nama', 'Code']`). When set, the
   * controller groups the full result set and the main paging (`pageSize` /
   * `totalCount` / `pageCount`) operates on the **top-level groups** — so
   * `<mono-table-paging>` / `-info` / `-page-size` page and count groups. Rows
   * inside a group can be paged independently with `<mono-table-paging-group>`
   * (otherwise all rows in the group are shown). Works for a plain array and a
   * remote grouped DataSource alike.
   */
  group?: string | string[]
  /**
   * Default rows-per-page **inside** each group. When set, every group is paged
   * by this size from the first render (so a huge group never renders all its
   * rows at once); a `<mono-table-paging-group>` then just navigates/overrides
   * it. Leave unset to show all rows in a group until a `<mono-table-paging-group>`
   * is attached.
   */
  groupRowPageSize?: number
  /**
   * Per-group aggregates for **server-side** grouping, e.g. `{ TotalBudget: 'sum' }`.
   * Computed by the groupby query (no rows loaded) and surfaced on each group node
   * as `node.meta.aggregates` — handy for a subtotal in the group header.
   */
  groupSummary?: Record<string, 'sum' | 'avg' | 'min' | 'max' | 'count'>
  /**
   * Column summaries (aggregate footers). Either a plain array of specs, or the
   * richer object form ({@link MonoSummaryConfig}) with `recalculate` controls
   * and field-keyed specs. Read via `<mono-table-summary>`, `table.summary(field)`,
   * or `table.summary().getAll()`.
   */
  summary?: MonoSummarySpec[] | MonoSummaryConfig

  /**
   * Central column config, read via `table.columns().get(field)` /
   * `table.columns().getAll()`. Entries only need `field` (plus optional `caption`)
   * today; the type is extensible for per-column props later. Separate from the
   * registered `<mono-table-th>` elements (see `table.registeredColumns()`).
   */
  columns?: MonoColumnDef[]

  /**
   * Props for the `mono-table-*` elements, declared centrally so each element is
   * wired with just `:data-grid.prop="table"`. Read back via `table.props()`.
   *
   * `props.th` is merged OVER `columns` by field, and each `th[].summary` is
   * folded into the same spec list `summary` feeds — so both styles coexist and
   * `table.summary()` sees one reconciled set.
   */
  props?: MonoTableProps
  /**
   * A ref the grid writes a `props()` snapshot into on every change, so a Vue
   * template can drive its header loop from `state.th` with no manual
   * subscription. Mirrors `monoForm({ state })`.
   */
  state?: { value: MonoTableProps | undefined }

  /** Columns fetched for a group's rows in server mode (omit = `dataSourceOptions.select`, else all columns). */
  select?: string[]
  /**
   * DataSource-level knobs the grid keeps under every query it runs — see
   * {@link MonoDataSourceOptions}. A value, a getter, or a `{ value }` box
   * (a Vue `ref` / `computed`), read fresh at query time.
   *
   * Not needed just to keep a filter: whatever a consumer sets on the source
   * directly (`ds.filter(...)`) is adopted as the base too. This is for the case
   * where the base is DERIVED from reactive state and should follow it.
   */
  dataSourceOptions?: MaybeReactive<MonoDataSourceOptions>
  /** The same, in raw OData (`$select`, `$filter`, …) — see {@link MonoOdataOptions}. */
  odataOptions?: MaybeReactive<MonoOdataOptions>
  /** Row key field used to build stable `displayRows` keys (default `'Id'`). */
  keyExpr?: string
  /**
   * Max rows fetched per server request. When the page size is set to **"all"**,
   * the controller loads everything in chunks of this size (so a backend capped
   * at e.g. 100 rows/request still returns the full set). Default `100`.
   */
  chunkSize?: number
  /**
   * Advanced override for server-side grouping. Normally you don't set this:
   * passing a single-field `group` plus a remote devextreme `DataSource` makes
   * the controller drive server group paging automatically from the source's
   * store. Provide this only to supply custom group/row fetching.
   */
  serverGroup?: MonoServerGroupSource<any>
  /**
   * Whether the grid may send OData `$apply` requests through the bound
   * source's own store — ONE `groupby` for a header filter's distinct values,
   * ONE `aggregate` for the summary footer — instead of scanning or draining
   * rows. Default `true`. The request goes out on the store's url, `beforeSend`
   * and auth (the clause goes into the url via `urlOverride` — never through
   * `customQueryParams`, which devextreme quotes as a literal — and never to a
   * CustomStore). A backend that rejects it (4xx / 501) turns the path off for
   * this controller and the client-side fallback takes over. Set `false` to
   * never try — a backend you know has no `$apply`.
   */
  serverApply?: boolean
  /**
   * Whether a header filter's value list CASCADES: scoped by the other columns'
   * active header filters and by the grid search, so after Brand = "One" the
   * Product panel lists only that brand's products (with counts to match).
   * Default `true`. The column's OWN filter is never applied to its list, so a
   * value you filtered out can be ticked back. The panel's search box still
   * narrows the list on top. `false` scopes the list by the base filter alone.
   */
  headerFilterCascade?: boolean
  /**
   * What a failed load does to the rows already on screen. Default
   * `'clear-list'`: they are emptied (see `MonoErrorBehaviour`), so a filter that
   * the backend rejected never leaves the previous filter's rows showing under
   * the error bar. `<mono-table-error behaviour>` writes the same setting.
   */
  onError?: MonoErrorBehaviour
  /**
   * Wording for the error bar, by HTTP status (`401`, `403`, `500`, …), plus
   * `'network'` (no answer at all) and `'default'`. A status with a preset shows
   * the preset rather than the transport's reason phrase — "You do not have
   * permission to view this data." instead of "Forbidden" (or, over HTTP/2,
   * where the statusText is blank, instead of the bare word "Error"). Anything
   * the SERVER said beyond the status is kept as `error.detail`. Merged over the
   * app-wide `setErrorMessages()` and the English defaults
   * (`DEFAULT_ERROR_MESSAGES`), so this only needs the keys that differ.
   */
  errorMessages?: MonoErrorMessages
  /**
   * How a `header-filter` column fetches its DISTINCT values. Array-backed tables
   * derive them client-side automatically; a **remote** devextreme source gets
   * ONE `$apply=groupby((field))` request through its own store (see
   * `serverApply`). Supply this to take over — a non-devextreme fetcher, a custom
   * dialect, a cached lookup. Return the distinct values, optionally with counts.
   * Example (public endpoint → a plain request; route it through your own client
   * for an authenticated backend):
   * ```ts
   * monoDataGrid(null, {
   *   distinctValues: async (field, _options, ctx) => {
   *     // `ctx.applyWithFilter` already folds the grid's base filter in front of
   *     // the groupby, so a scoped grid lists only values in scope.
   *     const apply = encodeURIComponent(ctx.applyWithFilter)
   *     const res = await fetch(`${base}/DTO_Departmen?$apply=${apply}&$orderby=${field} asc`)
   *     if (!res.ok) throw new Error(`HTTP ${res.status}`)
   *     const json = await res.json()
   *     return (json.value ?? []).map((r) => ({ value: r[field], count: Number(r.count ?? 0) }))
   *   },
   * })
   * ```
   */
  distinctValues?: (
    field: string,
    /**
     * The column's `headerFilter.dataSourceOptions`, with the grid's base filter
     * AND-ed into `filter`, so a resolver that goes through `store.load(options)`
     * is scoped without doing anything.
     */
    options?: MonoHeaderFilterLoadOptions,
    /** The same, in OData form — for a resolver that builds its own `$apply`. */
    ctx?: MonoDistinctValuesContext,
  ) => Promise<Array<MonoColumnValue | unknown>> | Array<MonoColumnValue | unknown>

  /**
   * How a row's inline editor opens — `'click'` (default) or `'double-click'`.
   * The grid binds one delegated listener on the `<table>`; rows only need
   * `data-row-key`. A `<mono-table-th editable-trigger="…">` overrides this.
   *
   * Clicks on an editor or on an interactive control (button / link / form
   * field) never open the editor, so per-row action buttons keep working.
   */
  editableTrigger?: MonoEditableTrigger

  /**
   * How the keyboard moves between inline editors.
   *
   * - `'tab-arrows'` *(default)* — tap `Tab` for the next column (rolling into
   *   the next row at the row's end, `Shift+Tab` mirrors it), or **hold `Tab`
   *   and press an arrow** to move one cell in that direction: `←`/`→` within
   *   the row, `↑`/`↓` to the same column of the previous/next row. Arrows never
   *   wrap — at an edge the key is swallowed and nothing moves. Plain arrows are
   *   left alone, so they still move the caret, change `mono-textarea` lines and
   *   walk an open `mono-select` / `mono-date` list.
   * - `'native'` — no interception inside a row: the browser's own `Tab` order
   *   applies (which also steps into a cell's sub-controls) and the grid only
   *   rolls over at the row's edges.
   *
   * With `'tab-arrows'`, `Tab` acts on key*up* — it has to be swallowed on
   * keydown so a following arrow isn't preceded by a stray move.
   */
  editorNavKeys?: MonoEditorNavKeys

  /**
   * Turn each raw row into a presentation row, so a consumer stops hand-rolling a
   * `computed` that re-maps `items` on every notify. The result lands in
   * `table.mapped` and on `displayRows[].mapped`; **`items` stays raw**, because
   * editing, row keys, summaries, search, sort and filters all read it.
   *
   * Per-column {@link MonoTableColumnProps.map} entries are applied afterwards and
   * overwrite their own field. They read the RAW value, not this map's output, so
   * don't rely on chaining the two on the same field — pick one per field.
   *
   * @example
   * monoDataGrid(null, {
   *   map: (row) => ({
   *     ...row,
   *     _status: renderStatus(row.Status),
   *     _date: formatDateTime(row.DibuatTanggal),
   *   }),
   * })
   * // then: rows.value = [...table.mapped]   // in your subscribe callback
   */
  map?: (row: any, index: number) => unknown

  /**
   * Creates a `monoFilterBuilder()` controller owned by the grid and exposed as
   * `table.filterBuilder`, so a `<mono-filter-builder :data-filter.prop="table.filterBuilder">`
   * slotted into a `<mono-table-search>` joins without a standalone controller.
   * Accepts the same options as `monoFilterBuilder()`; `dataGrid` is wired
   * automatically (its field list is derived from the registered columns).
   */
  filterBuilder?: MonoFilterBuilderOptions
}

/** A top-level group's metadata, returned by {@link MonoServerGroupSource.loadGroups}. */
export interface MonoGroupMeta {
  /** The group's key (its value for the group field). */
  key: unknown
  /** Total rows in the group (from the groupby `$count`). */
  count: number
  /** Optional per-group aggregates (e.g. a `Sum`) from the groupby query. */
  aggregates?: Record<string, number>
}

/** Shared search/sort context passed to a {@link MonoServerGroupSource}. */
export interface MonoServerGroupCtx {
  /** Current search value (or null). */
  search: string | null
  /** Active multi-key sort (group fields first), or null. */
  sort: Array<{ selector: string; desc: boolean }> | null
  /**
   * The grid's composed base filter — `dataSourceOptions.filter`, whatever the
   * consumer set on the source, `setFilter()`, and the header column filters —
   * WITHOUT the search, which the source folds from `search` itself. A server
   * group source must AND this into both requests; the DataSource's own filter
   * never reaches a `store.load()`.
   */
  filter?: unknown
  /** `dataSourceOptions.select`, when the grid's own `select` option is unset. */
  select?: string[]
  /** `expand` / `customQueryParams` from `dataSourceOptions`, to spread into `store.load()`. */
  loadOptions?: Record<string, unknown>
}

/**
 * Consumer-supplied data access for server-side group paging. The controller
 * calls these; @mono-lit/helper never imports a fetcher, so any backend works.
 */
export interface MonoServerGroupSource<T = any> {
  /** Fetch the group list + per-group counts/aggregates (one cheap groupby). */
  loadGroups(ctx: MonoServerGroupCtx): Promise<MonoGroupMeta[]>
  /** Fetch one page of rows for a single group (`$filter` + `$skip`/`$top`). */
  loadRows(
    key: unknown,
    ctx: MonoServerGroupCtx & { skip: number; take: number },
  ): Promise<T[]>
}

/**
 * A flattened, ready-to-render row for the table body — read `controller.displayRows`
 * and `v-for` over it (use `key` for the row key). Removes the need to walk the
 * group tree, test `isGroupNode`, or build keys in the consumer.
 */
export interface MonoDisplayRow<T = any> {
  /** Stable, unique key for the framework's keyed list. */
  key: string
  /** What to render: a group header, a data row, or a per-group pager slot. */
  kind: 'group' | 'row' | 'footer'
  /** Nesting depth (0 = top level) — use for indentation. */
  level: number
  /** The group node (set for `group` / `footer`). */
  node?: MonoGroupNode<T>
  /** The data row (set for `row`) — always the RAW row. */
  row?: T
  /**
   * The row after `map` / per-column `map` (set for `row`). Identical to `row`
   * when no map is configured, so a template can read `mapped` unconditionally.
   */
  mapped?: any
}

/** Per-group row paging snapshot, returned by {@link MonoTableController.groupPageInfo}. */
export interface GroupPageInfo {
  /** Zero-based current page within the group. */
  pageIndex: number
  /** Total pages for the group's rows. */
  pageCount: number
  /** Rows per group-page. */
  pageSize: number
  /** Total rows (or sub-groups) directly under the group. */
  total: number
}

/**
 * Simplified, framework-agnostic view over a devextreme DataSource. Keeps its
 * own snapshot of `items / loading / totalCount / pageIndex / pageSize /
 * pageCount`, stays in sync from the source's `changed` / `loadingChanged`
 * events, and notifies subscribers so any UI (Lit components, a Vue ref, …)
 * can re-render.
 */
/**
 * A controller operation that failed.
 *
 * `raw` is kept alongside the message because the message is a best-effort read
 * of something the store chose the shape of — a consumer logging to Sentry wants
 * the original, not a rendering of it.
 */
export interface MonoTableError {
  /**
   * The line to show. The preset for the HTTP status when there is one
   * (`errorMessages` / `setErrorMessages()`), else the error's own text — see
   * `describeError`.
   */
  message: string
  /** The HTTP status the error carried, `0` for a network failure, absent when it had none. */
  status?: number
  /**
   * What the server said beyond the status — an OData error body's message, a
   * JSON `message` — or the error's own text when a preset took the headline.
   * Never a bare reason phrase like "Forbidden".
   */
  detail?: string
  /** Exactly what was thrown — an `Error`, a string, an HTTP payload, anything. */
  raw: unknown
  /** Which operation failed, so a consumer can word it ("Reload failed"). */
  source: 'load' | 'reload' | 'group' | 'groupRows' | 'selectAll'
  /** `Date.now()` at capture. */
  at: number
}

export interface MonoTableController<T = any> {
  /** Current page rows (mirror of `dataSource.items()`) — always RAW. */
  items: T[]
  /**
   * `items` after `map` / per-column `map`, ready to render. Identical to `items`
   * when neither is configured, so it is always safe to read.
   */
  mapped: any[]
  /**
   * Flattened, keyed rows ready to render (group headers, data rows, per-group
   * pager footers). `v-for` over this and switch on `kind` — no tree walking.
   */
  displayRows: Array<MonoDisplayRow<T>>
  /** Whether the source is loading. */
  loading: boolean
  /**
   * Whether the bound source has settled at least once.
   *
   * `items: []` with `loading: false` is the controller's INITIAL state as well as
   * "loaded, and there is genuinely nothing" — the two are otherwise
   * indistinguishable, so anything that reacts to emptiness (`mono-table-empty`)
   * would announce "no data" on a table that has not been asked for any yet.
   * Latched on the first `changed` the source emits and reset when a different
   * source is bound.
   */
  hasLoaded: boolean
  /**
   * The last operation that failed, or `null`.
   *
   * A fresh object per failure, so two identical errors are still distinguishable
   * — `<mono-table-error>` dismisses per failure by remembering the object it
   * dismissed. Cleared by the next successful settle and when a new source is
   * bound.
   */
  error: MonoTableError | null
  /** Total row count (needs `requireTotalCount: true`; else falls back). */
  totalCount: number
  /** Zero-based current page index. */
  pageIndex: number
  /** Rows per page. */
  pageSize: number
  /** Whether the "all" page size is active (no pagination — everything shown). */
  pageSizeAll: boolean
  /** Total number of pages. */
  pageCount: number

  /**
   * Active sort keys, **in precedence order** — `sorts[0]` is the primary. A
   * column's sort arrow is single-key, so clicking one leaves exactly this entry;
   * the header's right-click `Sort ›` menu appends instead, which is how a
   * multi-key sort is built (and what the `<sup>` precedence badges reflect).
   */
  sorts: MonoSortEntry[]
  /**
   * Primary sort field (`sorts[0]`), or null. Kept for back-compat — read `sorts`
   * to see every active key.
   */
  sortField: string | null
  /** Primary sort direction (`sorts[0]`), or null when unsorted. */
  sortOrder: SortOrder

  /** Whether grouping is active (one or more group fields configured). */
  grouped: boolean

  // --- Scroll paging (infinity / virtual) — flat tables only -----------------
  /** Active scroll-paging mode. `'off'` = classic numbered paging. */
  scrollMode: 'off' | 'infinity' | 'virtual'
  /** Whether more unloaded rows exist beyond `loadedCount` (scroll modes). */
  hasMore: boolean
  /** Total rows currently accumulated (loaded) in a scroll mode. */
  loadedCount: number
  /** Virtual window: first accumulated index rendered (`items[0]`). */
  virtualStart: number
  /** Virtual window: one-past-last accumulated index rendered. */
  virtualEnd: number
  /** Virtual top spacer height in px (rows scrolled above the window). */
  virtualPadTop: number
  /** Virtual bottom spacer height in px (rows below the window). */
  virtualPadBottom: number

  /** The bound source (or null). */
  readonly dataSource: MonoGridSource<T> | null

  load(): Promise<void>
  reload(): Promise<void>
  /**
   * Empty the PUBLISHED rows without a request — `items`, the scroll accumulator, the
   * "all" buffer — and notify. The bound source and its filter / sort are untouched, so
   * the next `load()` refills under whatever scope is set by then.
   *
   * For a consumer whose scope changed while nobody was looking (a dropdown panel that
   * is shut): the list must not keep showing the previous scope's rows until someone
   * opens it and pays for the fetch. A load in flight when this runs is superseded — its
   * rows will not land on the cleared list.
   */
  clear(): void
  setPage(pageIndex: number): Promise<void>
  /**
   * Enable a scroll-paging mode (flat tables only — grouped/server grids warn
   * and stay on classic paging). Driven by `<mono-table-paging type="…">`.
   *
   * Pass `{ reload: false }` when the mode change is BOOKKEEPING rather than a request for
   * different rows — a pager element being disconnected, most of all. Nothing consumes a fetch
   * issued on the way out, and the accumulator is kept so a reconnect can resume from it.
   */
  setScrollPaging(mode: 'off' | 'infinity' | 'virtual', opts?: { reload?: boolean }): Promise<void>
  /** Load & append the next page onto the scroll accumulator (no-op if `!hasMore`). */
  loadNext(): Promise<void>
  /** Set the virtual render window (indices into the accumulator) + spacer px. */
  setVirtualWindow(start: number, end: number, padTop: number, padBottom: number): void
  /**
   * Override the page size (rows fetched per page / scroll chunk), winning over
   * the bound source's configured `pageSize`. `null` clears the override.
   * Applied order-independently: stored + re-applied on every `bind`.
   */
  setPreferredPageSize(pageSize: number | null): Promise<void>
  /** Set rows/groups per page, or `'all'` to load & show everything (chunked). */
  setPageSize(pageSize: number | 'all'): Promise<void>
  setSearch(value: string): Promise<void>
  /**
   * Multi-term search. Terms group by `field`: **OR within a field, AND across
   * fields**, so `[{Nama,'a'},{Nama,'b'},{Code,'x'}]` becomes
   * `(contains(Nama,'a') or contains(Nama,'b')) and contains(Code,'x')`.
   *
   * A term with no `field` searches every `searchExpr` column (ORed), which is
   * exactly what {@link setSearch} does — `setSearch(v)` is shorthand for
   * `setSearchTerms([{ value: v }])`.
   */
  setSearchTerms(terms: MonoSearchTerm[]): Promise<void>
  /**
   * Replace the searched fields after construction — the same value
   * `monoDataGrid({ searchValue })` takes (array or comma string, paths, `*`
   * patterns and `{ field, custom }` entries all allowed).
   *
   * This is what `<mono-table-search search-value="…">` calls, so a template can
   * declare the fields next to the search box instead of in the options. It
   * **replaces** the configured option rather than merging with it; pass
   * `undefined` to drop the override and fall back to the options.
   *
   * Re-runs the active search so the grid reflects the new fields at once.
   */
  setSearchValue(expr: MonoSearchValue | undefined | null): Promise<void>
  /** Alias of {@link setSearchValue}, under the option's older name. */
  setSearchExpr(expr: MonoSearchValue | undefined | null): Promise<void>
  /**
   * The fields currently searched, resolved from the options + any override.
   *
   * Returns `['*']` (every top-level field) when nothing was configured — that is
   * the default — and `undefined` only when the bound **source** carries its own
   * `searchExpr` and is therefore left to fold the search itself.
   *
   * NOTE this returns the **fields**, not the typed term — the live query text is
   * {@link searchTerms}. (A devextreme DataSource uses `searchValue` for the text;
   * here the whole family — the option, the element prop and this reader — names
   * the fields, matching `mono-select` and `mono-tag-input`.)
   */
  searchValue(): MonoSearchExprEntry[] | undefined
  /** Alias of {@link searchValue}, under the option's older name. */
  searchExpr(): MonoSearchExprEntry[] | undefined
  /** The live search terms (empty when unsearched). */
  searchTerms: MonoSearchTerm[]
  /**
   * An explicit filter of the grid's own — what the slotted filter builder
   * writes. One LAYER of the query, not the whole of it: it is AND-ed with the
   * base (`dataSourceOptions.filter` + whatever the consumer set on the source),
   * the header column filters and the search, and clearing it (`null`) clears
   * only this layer. Array sources take an array (compiled) or a predicate.
   */
  setFilter(filter: unknown): Promise<void>
  /**
   * Replace `dataSourceOptions` after construction and run the query. Pass the
   * same shapes the option takes (a value, a getter, a `{ value }` box).
   */
  setDataSourceOptions(next: MaybeReactive<MonoDataSourceOptions> | undefined): Promise<void>
  /** Replace `odataOptions` after construction and run the query. */
  setOdataOptions(next: MaybeReactive<MonoOdataOptions> | undefined): Promise<void>
  /**
   * Re-read `dataSourceOptions` / `odataOptions` and the source's own filter,
   * then load. The call to make after the reactive state behind a getter
   * changed. Goes back to page 0 only when something actually changed — unlike
   * `reload()`, which always restarts and drops the store cache.
   */
  refresh(): Promise<void>
  /** The merged, normalised options as of the last query (read-only snapshot). */
  resolvedDataSourceOptions(): Readonly<MonoDataSourceOptions>
  /**
   * The grid-owned filter-builder controller, when `monoDataGrid({ filterBuilder })
   * is set. Bind it with `<mono-filter-builder :data-filter.prop="table.filterBuilder">`;
   * `undefined` when no `filterBuilder` option was passed.
   */
  filterBuilder?: MonoFilterController
  /**
   * Sort by a column. With no `order`, cycles `asc → desc → null` for that field;
   * pass an explicit `order` (including `null` to drop the column) to set it.
   * `field: null` clears every key.
   *
   * **Single-key by default** — the call REPLACES the whole sort, so clearing a key
   * empties `sorts` rather than renumbering it. That is what a column's sort arrow
   * does. Pass `{ multi: true }` to accumulate instead: an unsorted field is
   * appended (pick order = precedence), an already-sorted one changes direction in
   * place, and `null` drops just that field and renumbers the rest. That is what
   * the header's right-click `Sort ›` menu does. Add `sticky: true` to that and
   * the grid REMEMBERS the gesture: the arrows append too, until nothing is
   * sorted any more (see `sortCombining`).
   */
  setSort(field: string | null, order?: SortOrder, options?: MonoSetSortOptions): Promise<void>
  /**
   * Whether the user has started a combined sort from the menu and something is
   * still sorted — the header arrows read this to append instead of replace.
   */
  sortCombining(): boolean
  /** This column's direction, or null when it isn't part of the sort. */
  sortOf(field: string): SortOrder
  /** 1-based precedence of a column in `sorts`; `0` when it isn't sorted. */
  sortIndex(field: string): number
  /** Drop every sort key. */
  clearSort(): Promise<void>

  /**
   * A column's `map` from `props.th`, if it declares one. Used by the header filter
   * to relabel its value list; returns `undefined` for an unmapped column.
   */
  columnMap(field: string): ((value: any, row: any, index: number) => unknown) | undefined

  // --- Per-column header filters (declared via `mono-table-th` `header-filter`) ---
  /**
   * Restrict a column to the given values (empty/`null` clears it) and reload.
   * Works for both a remote DataSource (devextreme `$filter`) and an array source
   * (client-side predicate).
   *
   * **Single-column by default** — the call REPLACES every active column filter, so
   * clearing empties them all. That is what the funnel icon does. Pass
   * `{ multi: true }` to combine instead (AND across columns, OR within one),
   * leaving the other columns alone and clearing only this one on empty. That is
   * what the header's right-click `Header Filter ›` row does. Add `sticky: true`
   * to that and the grid REMEMBERS the gesture: the funnel combines too, until
   * nothing is filtered any more (see `columnFilterCombining`).
   */
  setColumnFilter(
    field: string,
    values: unknown[] | null,
    options?: MonoSetColumnFilterOptions,
  ): Promise<void>
  /**
   * Whether the user has started combining filters from the menu and something
   * is still filtered — the funnel reads this to combine instead of replace.
   */
  columnFilterCombining(): boolean
  /** What a failed load does to the published rows (`onError`). */
  errorBehaviour(): MonoErrorBehaviour
  /** Change it after construction — `<mono-table-error behaviour>` calls this. */
  setErrorBehaviour(next: MonoErrorBehaviour): void
  /** The values currently selected for a column's header filter (empty = none). */
  columnFilter(field: string): unknown[]
  /**
   * Every field with an active header filter, in insertion order. The right-click
   * `Header Filter ›` row is what pushes this past one entry (and, once it has,
   * the funnel keeps adding — see `columnFilterCombining`).
   */
  filteredColumns(): string[]
  /**
   * The column's DISTINCT values with counts, for the header-filter list. Uses an
   * OData `$apply=groupby((field))` request for a remote store, else derives them
   * client-side from the array source's full data.
   */
  distinctValues(field: string, options?: MonoHeaderFilterLoadOptions): Promise<MonoColumnValue[]>

  /**
   * Replace the backing rows. Effective only for array-backed tables (a plain
   * array passed to `monoDataGrid`, or a `monoArraySource`); ignored for a
   * remote DataSource.
   */
  setData(next: T[]): Promise<void>

  /**
   * Change the group-by field(s) at runtime (pass `null`/`[]` to ungroup).
   * Re-applies the group-contiguous sort, resets to page 0 and reloads.
   */
  setGroup(group: string | string[] | null): Promise<void>

  /** Collapse/expand a group by its node or `path`. */
  toggleGroup(target: MonoGroupNode<T> | string): void
  /** Whether the group at `path` is currently collapsed. */
  isGroupCollapsed(path: string): boolean
  /** Expand every group. */
  expandAllGroups(): void
  /** Collapse every group. */
  collapseAllGroups(): void

  /**
   * Register/replace the per-group row page size for the group at `path` —
   * called by `<mono-table-paging-group>` on connect. While registered, that
   * group's rows are sliced to one page; otherwise all rows show.
   */
  setGroupPageSize(path: string, pageSize: number): void
  /** Set the current page within the group at `path`. */
  setGroupPage(path: string, pageIndex: number): void
  /** Stop paging the group at `path` (show all its rows again). */
  clearGroupPaging(path: string): void
  /** Current row-paging state for the group at `path`. */
  groupPageInfo(path: string): GroupPageInfo
  /**
   * The full (un-paged) group node at `path` for the current data — use its
   * `items` for aggregates (e.g. a subtotal) even when the displayed rows are
   * sliced by a `<mono-table-paging-group>`. `undefined` if not found.
   */
  groupNode(path: string): MonoGroupNode<T> | undefined

  /**
   * Every row matching the current search / filters / sort — not just the page
   * on screen — without disturbing what's displayed.
   *
   * A remote source is read straight off its store, so the bound DataSource's
   * paging is never touched; an array source is read with paging temporarily
   * off and restored afterwards. Either way `items` / `pageIndex` are the same
   * when the promise resolves as they were before it.
   */
  getData(): Promise<T[]>

  /**
   * The full group tree for `rows`, using the group field(s) already configured
   * on this grid. Omit `rows` to group everything {@link getData} returns.
   * Empty when the grid isn't grouped.
   *
   * To group by something other than the grid's own fields, use the exported
   * `buildGroups(rows, fields)` helper directly.
   */
  buildGroups(rows?: T[]): Promise<Array<MonoGroupNode<T>>>

  /**
   * Render a Markdown report template.
   *
   * The template is authored in Markdown (Handlebars for loops/conditions, Jexl
   * for `{{= … }}` expressions) and rendered to Markdown or `.xlsx`. The
   * template sees **exactly** what you put in `data` — nothing is injected — so
   * pass the grid's rows explicitly when a report needs them.
   *
   * The engine (and the optional `exceljs` peer) is loaded on first use, so
   * importing `monoDataGrid` costs nothing if you never export.
   *
   * @example
   * const report = await table.export({
   *   md: template,                 // import md from './payroll.md?raw'
   *   fileName: 'payroll.xlsx',     // extension picks the renderer + downloads
   *   data: { rows: await table.getData(), company },
   *   styles: { header: { bg: '#1F2937' } },
   * })
   */
  export(options: MonoExportOptions): Promise<MonoExportResult>

  /**
   * Read an edited spreadsheet back into the grid as **staged** changes.
   *
   * Pairs each sheet row with a table row by composite key, coerces the declared
   * columns, and stages only the cells that actually differ. The underlying data
   * is untouched until `saveChanges()` — so an import can be reviewed, and
   * `discardChanges()` undoes the whole thing.
   *
   * Imported cells are marked (see {@link isCellImported}) so they can be tinted
   * differently from hand edits.
   *
   * @example
   * const result = await table.import({
   *   type: 'excel',                       // or 'copy-paste'; inferred from `data`
   *   data: file,
   *   match: [{ excel: 'Brand', field: 'BrandNama' }],
   *   columns: [{ excel: 'JAN', field: 'Jan', type: 'number' }],
   * })
   * if (!result.ok) warn(`${result.unmatched} rows didn't match`)
   */
  import(options: MonoImportOptions<T>): Promise<MonoImportResult<T>>

  /** Whether a cell's staged value came from an import rather than a hand edit. */
  isCellImported(rowKey: string, field: string): boolean
  /** Whether any of a row's staged values came from an import. */
  isRowImported(rowKey: string): boolean

  // --- Column summaries (aggregate footers) ----------------------------------

  /**
   * With no args, an iterable handle over every computed summary — loop
   * `table.summary().getAll()` (each `{ field, type, value, text }`) to render
   * totals anywhere, or `table.summary().get(field)` for one.
   */
  summary(): MonoSummaryHandle
  /**
   * The computed aggregate for a column, or `null` when there's no numeric data
   * (or it hasn't been computed yet). Reads the summary cache; if no spec matches
   * `field`(+`type`), a default one (`{ field, type: type ?? 'sum' }`) is
   * registered on the fly, so a bare `table.summary('Price')` works with no
   * central config. Computed over the full filtered set — not just the page.
   */
  summary(field: string, type?: MonoSummaryType): number | null
  /**
   * Attach (or clear, with `null`) the server-side summary resolver after the
   * grid is built — see {@link MonoSummaryConfig.resolve}. The aggregates are
   * recomputed immediately, so a footer already on screen updates itself.
   */
  setSummaryResolver(resolve: MonoSummaryResolver | null): void
  /**
   * The formatted summary string for a column, per its spec's
   * `format`/`prefix`/`precision`/`suffix` (`emptyText` when null). This is what
   * `<mono-table-summary>` renders.
   */
  summaryText(field: string, type?: MonoSummaryType): string
  /** Register/replace a summary spec (called by `<mono-table-summary>` on connect). */
  registerSummary(spec: MonoSummarySpec): void
  /** Remove a summary spec (called on disconnect). */
  unregisterSummary(spec: MonoSummarySpec): void
  /** The currently registered summary specs. */
  summaries(): ReadonlyArray<MonoSummarySpec>

  /** Attach (or swap) the source — a devextreme DataSource or a plain array. */
  bind(ds: MonoGridSource<T> | T[] | null): void
  /** Subscribe to state changes; returns an unsubscribe function. */
  subscribe(cb: () => void): () => void
  /** Detach listeners and clear subscribers. */
  dispose(): void

  // --- Columns + inline row editing (declared via `mono-table-th`) -----------

  /** Row key of the row currently in edit mode, or `null`. */
  editingKey: string | null
  /**
   * Optional sink for inline edits. `commitCell` invokes this with the change so
   * the consumer can update its own full data array and call `setData`. Assign
   * after creating the controller (`table.onCellChange = …`).
   */
  onCellChange: ((change: MonoCellChange<T>) => void) | null

  /**
   * How a row click opens its inline editor — `'click'` (default) or
   * `'double-click'`. Set it via `monoDataGrid(data, { editableTrigger })`, or
   * per table by putting `editable-trigger` on a `<mono-table-th>` (a th only
   * writes when its own prop is set).
   */
  editableTrigger: MonoEditableTrigger
  /**
   * How the keyboard moves between inline editors — `'tab-arrows'` (default) or
   * `'native'`. Set it via `monoDataGrid(data, { editorNavKeys })`.
   */
  editorNavKeys: MonoEditorNavKeys
  /**
   * Move the inline editor one cell in `dir` and focus it, scrolling it into
   * view. Returns `false` when the move is blocked by an edge (and nothing
   * moved) — the arrow directions never wrap. Normally driven by the keyboard,
   * but public so a consumer can wire its own buttons.
   */
  moveEditor(dir: MonoEditorDirection, fromEl?: EventTarget | null): boolean
  /**
   * Bind the row trigger to the `<table>` holding this grid's rows. Called by
   * `mono-table-th` on update — idempotent, so the repeated calls from every
   * header cell collapse to a single listener.
   */
  bindRowTrigger(tableEl: HTMLElement | null): void

  /** Register/replace a header-cell element — called by `mono-table-th` on connect. */
  registerColumn(el: MonoColumnEl): void
  /** Remove a header-cell element — called on disconnect. */
  unregisterColumn(el: MonoColumnEl): void
  /**
   * The central column config (from `monoDataGrid(data, { columns })`) as an
   * iterable handle: `table.columns().get(field)` / `.getAll()`. For the live
   * registered `<mono-table-th>` list, use {@link registeredColumns}.
   */
  columns(): MonoColumnHandle
  /**
   * The central element props (`monoDataGrid({ props })`), merged with `columns`.
   * A stable object mutated in place — read it after `subscribe`, or drive a
   * template from the `state` ref. `props().th` is the per-column list you loop
   * yourself to render the header.
   */
  props(): MonoTableProps
  /**
   * Row-detail handle — `table.detail().expandAll()` / `.collapseAll()` /
   * `.openCount()` / `.getAll()` over every `<mono-table-detail>` bound to this
   * grid. `collapseAll()` skips the ones marked `stay-open`.
   */
  detail(): MonoDetailHandle
  /**
   * Row-selection handle — what `<mono-table-checkbox>` drives and
   * `table.check().getAll()` reads back. The selection is keyed by
   * {@link rowKey}, so it survives paging, sorting, searching and filtering;
   * only `clear()` (or unchecking) empties it.
   */
  check(): MonoCheckHandle<T>
  /** Register a `<mono-table-detail>` — called by the element on connect. */
  registerDetail(el: MonoDetailEl): void
  /** Remove a `<mono-table-detail>` — called on disconnect. */
  unregisterDetail(el: MonoDetailEl): void

  /** Registered `<mono-table-th>` elements in DOM (visual) order. */
  registeredColumns(): MonoColumn[]
  /** Registered columns that declare an `editable` config, in DOM order. */
  editableColumns(): MonoColumn[]

  /**
   * Put a row into edit mode (all its editable cells). Pass the triggering DOM
   * event (the row click / dblclick) to auto-focus the row's first editor, so a
   * later click/tab away reliably exits via `editorBlur`.
   */
  beginEditRow(rowKey: string, event?: Event): void
  /** Leave edit mode. */
  cancelEdit(): void
  /** Whether `rowKey` is the row currently being edited. */
  isEditingRow(rowKey: string): boolean
  /** Whether `rowKey`'s `field` cell should render an editor right now. */
  isEditingCell(rowKey: string, field: string): boolean
  /** Emit a cell change immediately (funnels to `onCellChange`). */
  commitCell(rowKey: string, field: string, value: unknown): void

  // --- Staged (batch) editing: buffer edits, flush on manual Save ------------

  /** Buffer an edit (shown optimistically; not sent). */
  stageCell(rowKey: string, field: string, value: unknown): void
  /** Staged value for a cell, or `fallback` when it isn't staged. */
  cellValue(rowKey: string, field: string, fallback: unknown): unknown
  /** Whether a specific cell has a staged edit. */
  isCellDirty(rowKey: string, field: string): boolean
  /** Whether a row has any staged edit. */
  isRowDirty(rowKey: string): boolean
  /** Number of rows with staged edits. */
  pendingCount(): number
  /** Whether any edit is staged. */
  hasChanges(): boolean
  /** The staged change set — for sending your own (bulk) request. */
  changes(): Array<MonoStagedChange<T>>
  /** Drop all staged edits (reverts the optimistic display). */
  discardChanges(): void
  /**
   * Flush staged edits to the bound source: a DataSource store `update` (OData
   * PATCH) per row + `reload()`, an array source per-row `update`, or a `setData`
   * merge. Keeps the buffer on error so the save is retryable.
   */
  saveChanges(): Promise<void>
  /**
   * Keyboard handler an inline editor forwards its `keydown` to. Tab wraps to the
   * next/previous row's editor at a row boundary; Enter/Escape leave edit mode.
   * Rows must carry `data-row-key` and editors `data-edit-cell` for focus to move.
   */
  editorKeydown(event: KeyboardEvent, rowKey: string, field: string): void

  // --- Row-level CRUD staging (form) -----------------------------------------

  /**
   * Row-level CRUD staging for **optimistic** updates after your own change API
   * succeeds — insert/update/delete whole rows without a full reload. Returns a
   * chainable handle that shares one buffer across calls; `apply()` commits the
   * staged ops into the rendered data locally (no server call).
   *
   * @example
   * table.form({ key: 'Id' }).edit(1, updatedRow).apply()
   * table.form().add().apply()            // append one auto-shaped empty row
   */
  form(config?: MonoFormConfig<T>): MonoFormHandle<T>
  /** The live row-level staging buffer (readable) — what `form()` has staged but not yet applied. */
  pendingData: Array<MonoFormOp<T>>
  /**
   * Stable string key for a row — use it as the `data-row-key` / editing key
   * (e.g. `const rk = (row) => table.rowKey(row)`). For a `form({ showForm: true })`
   * row it returns an internal stable id that survives edits to the key field;
   * otherwise it's `String(row[keyExpr])`.
   */
  rowKey(row: T): string
}

function isCanceled(err: any): boolean {
  if (!err) return false
  return (
    err === 'canceled' ||
    err.name === 'canceled' ||
    err.message === 'canceled' ||
    err.__id === 'canceled'
  )
}

/**
 * Create a table controller around a devextreme DataSource.
 *
 * @example
 * const table = monoDataGrid(dataSource, { searchExpr: ['Name', 'Email'] })
 * table.subscribe(() => rows.value = [...table.items]) // Vue mirror
 */
/** Renamed "control" alias of {@link monoDataGrid} (no breaking change — both work). */
export { monoDataGrid as controlMonoTable }

export function monoDataGrid<T = any>(
  ds: MonoGridSource<T> | T[] | null = null,
  opts: MonoDataGridOptions = {},
): MonoTableController<T> {
  let bound: MonoGridSource<T> | null = null

  // --- Searched fields -------------------------------------------------------
  // `searchExpr` / `search-expr` / `searchValue` / `search-value` are one option
  // under four names, each taking an array or a comma string. They are merged
  // rather than snapshotted, because `opts` is held by reference: `bind()` re-reads
  // on every rebind, and a consumer mutating the object late is observed today.
  //
  // NOTE: deliberately not named `searchValue` — line ~1457 already owns that
  // identifier in this closure, and THERE it means the query *text* (as it does on
  // `MonoGridSource.searchValue`). Crossing the two meanings is the hazard here.
  let searchFieldsOverride: MonoSearchExprEntry[] | undefined
  let searchFieldsCache:
    | { keys: readonly unknown[]; entries: MonoSearchExprEntry[] | undefined }
    | null = null

  /**
   * The configured search fields, or `undefined` when none of the four spellings
   * was given. `undefined` is load-bearing: it means "not configured", which lets
   * a data source keep using its own `searchExpr` instead of being handed `[]`.
   *
   * An override set through {@link setSearchExpr} (i.e. by `<mono-table-search>`)
   * wins over the options — the element is the more specific declaration.
   */
  function searchFields(): MonoSearchExprEntry[] | undefined {
    if (searchFieldsOverride !== undefined) return searchFieldsOverride
    // Identity-cached so a per-keystroke path doesn't re-parse the option.
    const keys = [
      opts.searchExpr,
      opts['search-expr'],
      opts.searchValue,
      opts['search-value'],
    ] as const
    if (
      searchFieldsCache &&
      searchFieldsCache.keys.length === keys.length &&
      searchFieldsCache.keys.every((k, i) => k === keys[i])
    ) {
      return searchFieldsCache.entries
    }
    const entries = mergeSearchFields(opts)
    searchFieldsCache = { keys, entries }
    return entries
  }

  /** Whether the CONSUMER declared fields (any spelling, or via `setSearchValue`). */
  function searchFieldsConfigured(): boolean {
    return searchFields() !== undefined
  }

  /**
   * Whether the bound SOURCE carries its own column list.
   *
   * A devextreme DataSource can be built with `searchExpr` of its own, and a grid
   * that declares nothing relies on that source folding the search itself. The
   * `'*'` default must not take that over — it would replace a correct server-side
   * search with one derived from the loaded page.
   */
  function sourceDeclaresSearchFields(): boolean {
    const e = bound?.searchExpr?.()
    return Array.isArray(e) ? e.length > 0 : !!e
  }

  /**
   * The fields actually searched: what the consumer configured, else what the
   * source declares (left to the source — see above), else the **default `'*'`**,
   * meaning every top-level field.
   *
   * `'*'` is resolved against real rows by `searchEntries()` and never leaves the
   * client as a literal — it expands to concrete column names first.
   */
  function effectiveSearchFields(): MonoSearchExprEntry[] | undefined {
    const configured = searchFields()
    if (configured !== undefined) return configured
    if (sourceDeclaresSearchFields()) return undefined
    return [...DEFAULT_SEARCH_FIELDS]
  }

  // Active group-by fields and the set of collapsed group paths.
  let groupFields: string[] = toFields(opts.group)
  const collapsed = new Set<string>()

  // Level-1 (top-level group) paging, owned by the controller in group mode.
  let groupPageSize = Math.max(1, opts.pageSize ?? 10)
  let groupPageIndex = 0

  // "All" page size: show everything (no pagination), loading remote rows in
  // `chunkSize` chunks so a capped backend still returns the full set.
  let pageSizeAll = false
  const chunkSize = Math.max(1, opts.chunkSize ?? 100)
  let suppressSync = false // ignore source `changed` while accumulating "all"
  let allRows: T[] = [] // accumulated rows for ungrouped "all"

  // --- Scroll paging (infinity / virtual), flat tables only ------------------
  let scrollMode: 'off' | 'infinity' | 'virtual' = 'off'
  let accumulated: T[] = [] // rows accumulated across scrolled pages
  let scrollNextPage = 0 // next source page index to fetch/append
  let scrollHasMore = false // more unloaded rows beyond `accumulated`
  let scrollLoading = false // guard against overlapping loadNext() calls
  // Monotonic ticket for loadScrollPage(). Every entry claims a new one, so a call still
  // awaiting its page can tell it was superseded and must not touch shared state.
  let scrollToken = 0
  // Page-size override (from `<mono-table-paging :size>`); wins over the source's
  // configured pageSize. Re-applied on every bind so connect/bind order is moot.
  // `sourcePageSize` remembers the source's own size so clearing the override restores it.
  let preferredPageSize: number | null = null
  let sourcePageSize: number | null = null
  // Virtual render window (indices into `accumulated`) + spacer px.
  let vStart = 0
  let vEnd = 0
  let vPadTop = 0
  let vPadBottom = 0
  // Per-group row paging, keyed by group path (registered by paging-group).
  const groupRowPaging = new Map<string, { pageIndex: number; pageSize: number }>()
  // Optional default rows-per-group so big groups never render all rows at once.
  const defaultGroupRowPageSize =
    opts.groupRowPageSize && opts.groupRowPageSize > 0
      ? Math.floor(opts.groupRowPageSize)
      : 0

  /** Effective row paging for a group: explicit registration, else the default. */
  function groupRowPagingFor(path: string): { pageIndex: number; pageSize: number } | null {
    const explicit = groupRowPaging.get(path)
    if (explicit) return explicit
    return defaultGroupRowPageSize ? { pageIndex: 0, pageSize: defaultGroupRowPageSize } : null
  }
  // Full (unsliced) group node per path for the current data — for page info.
  const pathIndex = new Map<string, MonoGroupNode<T>>()

  // --- Server-side group paging (opt-in via `serverGroup`, single-level) -----
  // Explicit `serverGroup` wins; otherwise it's auto-built in `bind` from a
  // single-field group + a remote DataSource that exposes a `.store()`.
  let serverGroup = (opts.serverGroup ?? null) as MonoServerGroupSource<T> | null
  let serverGroups: MonoGroupMeta[] = [] // small: the full group list + counts
  const groupRows = new Map<string, T[]>() // path -> currently-loaded row page
  const groupRowsKey = new Map<string, string>() // path -> "pageIndex:pageSize" loaded
  const groupRowLoading = new Set<string>() // paths with an in-flight row fetch
  let searchValue: string | null = null // current search (server ctx)
  let groupSeq = 0 // stale-guard for loadGroups results

  const isGrouped = (): boolean => groupFields.length > 0
  /** Server mode requires a single group field + a `serverGroup` provider. */
  const serverMode = (): boolean => !!serverGroup && groupFields.length === 1

  function clearRowCaches(): void {
    groupRows.clear()
    groupRowsKey.clear()
    groupRowLoading.clear()
  }

  // Row-level staged CRUD (separate from the `pending` cell buffer below). Ops
  // accumulate here via `table.form().add/edit/delete` and are replayed into the
  // data by `apply()`. This array IS `ctrl.pendingData` (same reference, so reads
  // are live). `formKey` resolves to `keyExpr` on first use (keyExpr is declared
  // later in this factory).
  const formOps: Array<MonoFormOp<T>> = []
  let formKey: string | null = null
  let formShowForm = false
  let formTempSeq = 0
  let formHandle: MonoFormHandle<T> | null = null
  // Stable, non-enumerable row identity for `showForm` rows — survives edits to the
  // key field and is dropped from committed data (spread doesn't copy it).
  const MONO_ROW_KEY = Symbol('monoFormRowKey')
  const EDITABLE_MARK = 'Editable'

  const ctrl: MonoTableController<T> = {
    items: [],
    mapped: [],
    displayRows: [],
    loading: false,
    hasLoaded: false,
    error: null,
    totalCount: 0,
    pageIndex: 0,
    pageSize: 0,
    pageSizeAll: false,
    pageCount: 0,
    searchTerms: [],
    sorts: [],
    sortField: null,
    sortOrder: null,
    grouped: groupFields.length > 0,
    scrollMode: 'off',
    hasMore: false,
    loadedCount: 0,
    virtualStart: 0,
    virtualEnd: 0,
    virtualPadTop: 0,
    virtualPadBottom: 0,
    dataSource: null,
    editingKey: null,
    editableTrigger: opts.editableTrigger ?? 'click',
    editorNavKeys: opts.editorNavKeys ?? 'tab-arrows',
    onCellChange: null,
    pendingData: formOps,
    load,
    reload,
    clear,
    setPage,
    setScrollPaging,
    loadNext,
    setVirtualWindow,
    setPreferredPageSize,
    setPageSize,
    setSearch,
    setSearchTerms,
    // One implementation, both names — `searchValue` is the canonical spelling,
    // `searchExpr` the older one kept working. The reader reports what is actually
    // searched, so it shows the `['*']` default when nothing was configured.
    setSearchValue: setSearchExpr,
    setSearchExpr,
    searchValue: effectiveSearchFields,
    searchExpr: effectiveSearchFields,
    setFilter,
    setDataSourceOptions,
    setOdataOptions,
    refresh,
    resolvedDataSourceOptions,
    setColumnFilter,
    columnFilterCombining,
    errorBehaviour,
    setErrorBehaviour,
    columnFilter,
    filteredColumns,
    distinctValues,
    setSort,
    sortCombining,
    sortOf,
    sortIndex,
    clearSort,
    columnMap,
    setData,
    setGroup,
    toggleGroup,
    isGroupCollapsed,
    expandAllGroups,
    collapseAllGroups,
    setGroupPageSize,
    setGroupPage,
    clearGroupPaging,
    groupPageInfo,
    groupNode,
    getData,
    summary,
    summaryText,
    setSummaryResolver,
    registerSummary,
    unregisterSummary,
    summaries,
    buildGroups: buildGroupTree,
    export: exportReport,
    import: importSheet,
    isCellImported,
    isRowImported,
    bind,
    subscribe,
    dispose,
    registerColumn,
    unregisterColumn,
    detail,
    check,
    registerDetail,
    unregisterDetail,
    columns,
    props,
    registeredColumns,
    editableColumns,
    moveEditor,
    bindRowTrigger,
    beginEditRow,
    cancelEdit,
    isEditingRow,
    isEditingCell,
    commitCell,
    editorKeydown,
    stageCell,
    cellValue,
    isCellDirty,
    isRowDirty,
    pendingCount,
    hasChanges,
    changes,
    discardChanges,
    saveChanges,
    form,
    rowKey,
  }

  // --- Grid-owned filter builder ---------------------------------------------
  // Created AFTER `ctrl` so `dataGrid: ctrl` can be wired in (the controller
  // reads `grid.props().th` lazily, so columns registered later are picked up).
  // Assigned onto `ctrl` for consumers as `table.filterBuilder`.
  if (opts.filterBuilder) {
    ctrl.filterBuilder = monoFilterBuilder({ ...opts.filterBuilder, dataGrid: ctrl })
  }

  // --- Column registry + inline row editing ----------------------------------
  // `mono-table-th` elements register themselves here; the controller reads
  // their live props on demand and keeps them in visual (DOM) order for Tab nav.
  const columnEls = new Set<MonoColumnEl>()

  // Staged (buffered) edits: rowKey -> partial patch. Edits accumulate here and
  // are shown optimistically; nothing is sent until `saveChanges()`.
  const pending = new Map<string, Record<string, unknown>>()

  // --- Column summaries -------------------------------------------------------
  // Specs are declared centrally (`opts.summary`, array or object form) and/or by
  // `<mono-table-summary>` elements. Results are computed over the FULL filtered
  // set (page-independent), cached, and read synchronously by the footer / handle.
  function normalizeSummary(cfg: MonoDataGridOptions['summary']): {
    specs: MonoSummarySpec[]
    recalcSearching: boolean
    recalcChangedData: boolean
    resolve: MonoSummaryResolver | null
  } {
    if (!cfg) {
      return { specs: [], recalcSearching: false, recalcChangedData: true, resolve: null }
    }
    if (Array.isArray(cfg)) {
      return { specs: [...cfg], recalcSearching: false, recalcChangedData: true, resolve: null }
    }
    const specs: MonoSummarySpec[] = []
    for (const [field, spec] of Object.entries(cfg.fields ?? {})) {
      const list = Array.isArray(spec) ? spec : [spec]
      for (const s of list) specs.push({ field, ...s })
    }
    return {
      specs,
      recalcSearching: cfg.recalculate?.searching ?? false,
      recalcChangedData: cfg.recalculate?.changedData ?? true,
      resolve: cfg.resolve ?? null,
    }
  }

  const _summaryCfg = normalizeSummary(opts.summary)
  const summarySpecs: MonoSummarySpec[] = _summaryCfg.specs
  // Fold `props.th[].summary` into the SAME spec list `opts.summary` feeds, so
  // `table.summary()` and `<mono-table-summary field>` see one reconciled set
  // however the aggregate was declared. A field already specced by `opts.summary`
  // is left alone — declaring it twice shouldn't double-count it.
  for (const col of opts.props?.th ?? []) {
    if (!col?.field || !col.summary) continue
    const spec: MonoSummarySpec = { field: col.field, ...col.summary }
    const dup = summarySpecs.some(
      (s) => s.field === spec.field && (s.type ?? 'sum') === (spec.type ?? 'sum') && s.name === spec.name,
    )
    if (!dup) summarySpecs.push(spec)
  }
  const recalcSearching = _summaryCfg.recalcSearching
  const recalcChangedData = _summaryCfg.recalcChangedData
  let summaryResolve: MonoSummaryResolver | null = _summaryCfg.resolve
  const summaryCache = new Map<string, number | null>()
  /**
   * The `$apply`-through-the-store switch, shared by the summary footer and the
   * header filter: off by option, or off for good once the backend rejected one.
   */
  const applyGate = createApplyGate(opts.serverApply !== false)

  let errorMode: MonoErrorBehaviour = opts.onError === 'keep-list' ? 'keep-list' : 'clear-list'
  function errorBehaviour(): MonoErrorBehaviour {
    return errorMode
  }
  function setErrorBehaviour(next: MonoErrorBehaviour): void {
    errorMode = next === 'keep-list' ? 'keep-list' : 'clear-list'
  }

  const summaryKey = (spec: MonoSummarySpec): string =>
    `${spec.field ?? '*'}|${spec.type ?? 'sum'}|${spec.name ?? ''}`

  /** Find the spec that a `(field, type)` read refers to. Type is matched only when given. */
  function findSummarySpec(field: string, type?: MonoSummaryType): MonoSummarySpec | undefined {
    return summarySpecs.find(
      (s) => (s.field ?? '') === field && (type === undefined || (s.type ?? 'sum') === type),
    )
  }

  /**
   * How many elements currently want each spec.
   *
   * Registration is REFCOUNTED because several `<mono-table-summary>` cells can
   * declare the same field (a footer total and a toolbar total, say). Only the
   * first pushes the spec; previously the first to unmount removed the shared spec
   * out from under the others, and since nothing re-runs their registration they
   * rendered an empty value forever.
   */
  const summaryRefs = new Map<string, number>()

  function registerSummary(spec: MonoSummarySpec): void {
    const key = summaryKey(spec)
    summaryRefs.set(key, (summaryRefs.get(key) ?? 0) + 1)
    if (summarySpecs.some((s) => summaryKey(s) === key)) return
    summarySpecs.push(spec)
    void recomputeSummaries(true) // a new spec has no cached value — force
  }

  function unregisterSummary(spec: MonoSummarySpec): void {
    const key = summaryKey(spec)
    const refs = (summaryRefs.get(key) ?? 1) - 1

    if (refs > 0) {
      summaryRefs.set(key, refs)
      return // another element still needs it
    }

    summaryRefs.delete(key)
    const i = summarySpecs.findIndex((s) => summaryKey(s) === key)
    if (i >= 0) summarySpecs.splice(i, 1)
  }

  function summaries(): ReadonlyArray<MonoSummarySpec> {
    return summarySpecs
  }

  /** Build the public result object for one spec from the cache. */
  function summaryResult(spec: MonoSummarySpec): MonoSummaryResult {
    const value = summaryCache.get(summaryKey(spec)) ?? null
    return {
      field: spec.field,
      type: spec.type ?? 'sum',
      name: spec.name,
      value,
      text: formatSummary(value, spec),
    }
  }

  const summaryHandle: MonoSummaryHandle = {
    get(field: string, type?: MonoSummaryType): MonoSummaryResult | null {
      const spec = findSummarySpec(field, type)
      return spec ? summaryResult(spec) : null
    },
    getAll(): MonoSummaryResult[] {
      return summarySpecs.map(summaryResult)
    },
  }

  function summary(): MonoSummaryHandle
  function summary(field: string, type?: MonoSummaryType): number | null
  function summary(field?: string, type?: MonoSummaryType): MonoSummaryHandle | number | null {
    // No args → the iterable handle (`getAll()` / `get(field)`).
    if (field === undefined) return summaryHandle

    let spec = findSummarySpec(field, type)
    if (!spec) {
      // Zero-config: register a default spec so a bare `summary('Price')` works.
      spec = { field, type: type ?? 'sum' }
      registerSummary(spec)
    }
    return summaryCache.get(summaryKey(spec)) ?? null
  }

  // Bumped when the aggregated ROW SET changes, so the gated recompute in
  // `onChanged` runs then but SKIPS pure sort / paging (which funnel through the
  // same `load()`). Which changes count is governed by `recalculate`:
  //   • 'search' (search / filters)      → only if `recalcSearching` (default off)
  //   • 'data'   (bind / reload / setData) → only if `recalcChangedData` (default on),
  //     except the FIRST computation, which always runs.
  let summaryVersion = 0
  let summaryComputed = -1
  /**
   * Bumped on EVERY row-set change, unconditionally — `summaryVersion` is gated
   * by the `recalculate` config, so it can't be used to answer "is the row set
   * still the one I last read?". `check().selectAll()` uses this to know whether
   * its cached drain is still valid.
   */
  let rowSetVersion = 0
  const bumpSummary = (reason: 'search' | 'data'): void => {
    rowSetVersion++
    if (reason === 'search' && !recalcSearching) return
    if (reason === 'data' && !recalcChangedData && summaryComputed >= 0) return
    summaryVersion++
  }

  function summaryText(field: string, type?: MonoSummaryType): string {
    const spec = findSummarySpec(field, type) ?? { field, type: type ?? 'sum' }
    const value = summary(field, type)
    return formatSummary(value, spec)
  }

  function formatSummary(value: number | null, spec: MonoSummarySpec): string {
    if (spec.format) return spec.format(value, ctrl.items)
    if (value === null || Number.isNaN(value)) return spec.emptyText ?? '—'
    const body =
      spec.precision != null
        ? value.toLocaleString(undefined, {
            minimumFractionDigits: spec.precision,
            maximumFractionDigits: spec.precision,
          })
        : value.toLocaleString()
    return `${spec.prefix ?? ''}${body}${spec.suffix ?? ''}`
  }

  /** Aggregate one spec over `rows`. Non-numeric values are skipped. */
  function aggregate(spec: MonoSummarySpec, rows: T[]): number | null {
    const type = spec.type ?? 'sum'
    if (type === 'count') return rows.length

    const field = spec.field
    if (!field) return null

    // A path field may resolve to a single value OR — for a wildcard like
    // `Budgets.[*].Price` — an array; flatten either into the value pool so the
    // aggregate spans every matched leaf across every row.
    const valuesOf = (row: T): unknown[] => {
      const raw = getFieldValue(row, field)
      return Array.isArray(raw) ? raw : [raw]
    }

    if (type === 'countDistinct') {
      const seen = new Set<unknown>()
      for (const row of rows) {
        for (const v of valuesOf(row)) if (v != null && v !== '') seen.add(v)
      }
      return seen.size
    }

    const nums: number[] = []
    for (const row of rows) {
      for (const raw of valuesOf(row)) {
        if (raw == null || raw === '') continue
        const n = Number(raw)
        if (Number.isFinite(n)) nums.push(n)
      }
    }
    if (!nums.length) return null

    switch (type) {
      case 'sum':
        return nums.reduce((a, b) => a + b, 0)
      case 'avg':
        return nums.reduce((a, b) => a + b, 0) / nums.length
      case 'min':
        return Math.min(...nums)
      case 'max':
        return Math.max(...nums)
      default:
        return null
    }
  }

  /**
   * Run the consumer's resolver, normalised to one value per spec.
   *
   * Declines (`null`) for every case the caller should not have to think about:
   * no resolver, no bound source, an ARRAY source (already in memory — a network
   * round trip for rows we hold would be absurd), a spec set no `$apply` can
   * express, or a resolver that returned the wrong shape.
   *
   * A THROW is caught and reported once rather than propagated: a failed totals
   * request should degrade to a slower total, not break the grid. It is warned
   * about exactly once per grid so a persistent fault is visible without
   * flooding the console on every reload.
   */
  let _summaryResolveWarned = false

  /**
   * Swap the resolver after construction.
   *
   * The option form covers a grid you build yourself. This covers the other
   * case, which is at least as common: a grid built by a shared factory or
   * composable that does not forward `summary` — the consumer still owns the
   * fetcher, and needs somewhere to hand it over.
   *
   * Forces a recompute rather than waiting for the next data change, so a footer
   * already on screen with a locally-drained total corrects itself, and clears
   * the one-shot warning so a newly attached resolver gets a fair hearing.
   */
  function setSummaryResolver(resolve: MonoSummaryResolver | null): void {
    summaryResolve = resolve ?? null
    _summaryResolveWarned = false
    void recomputeSummaries(true)
  }

  /**
   * A resolver's (or the server's) answer → one value per spec, in spec order.
   * Positional, or keyed by alias — falling back to the plain field name, which
   * is what an `$apply` aliases to whenever a field carries one aggregate (the
   * ordinary case). `null` when the shape cannot be read.
   */
  function summaryOutToValues(out: unknown): (number | null)[] | null {
    const num = (v: unknown): number | null => {
      const n = Number(v)
      return Number.isFinite(n) ? n : null
    }
    if (Array.isArray(out)) {
      return out.length === summarySpecs.length ? out.map(num) : null
    }
    if (!out || typeof out !== 'object') return null
    const row = out as Record<string, unknown>
    const aliases = summaryAliases(summarySpecs)
    return summarySpecs.map((spec, i) => {
      const key = aliases[i]
      if (key in row) return num(row[key])
      if (spec.field && spec.field in row) return num(row[spec.field])
      return null
    })
  }

  async function resolveSummaries(): Promise<(number | null)[] | null> {
    if (!summaryResolve || !bound || Array.isArray(bound)) return null

    const apply = buildSummaryApply(summarySpecs)
    if (!apply) return null

    const filter = summaryFilterOf(bound)
    const aliases = summaryAliases(summarySpecs)

    try {
      const out = await summaryResolve({
        specs: summarySpecs,
        aliases,
        filter,
        odataFilter: summaryODataFilter(filter) ?? '',
        apply,
        applyWithFilter: composeSummaryApply(apply, filter),
        source: bound,
      })
      if (!out) return null
      return summaryOutToValues(out)
    } catch (err) {
      if (!_summaryResolveWarned) {
        _summaryResolveWarned = true
        console.warn(
          '[mono-table] summary resolver failed; falling back to reading every row. ' +
            'Return "null" from the resolver to fall back without this warning.',
          err,
        )
      }
      return null
    }
  }

  /**
   * The totals as ONE `$apply=filter(…)/aggregate(…)` request through the bound
   * source's own store — the same clause the consumer resolver is offered, sent
   * by the grid itself when there is no resolver (or it declined).
   *
   * `null` is the decline: no store, the path switched off, a store that cannot
   * carry an `$apply` (`loadApply`), a response that is not one aggregated row
   * (a server that ignored the clause hands back entities, which carry none of
   * the aliases), or a failed request — which also reports to the gate, so a
   * backend that rejects `$apply` is asked exactly once.
   */
  async function resolveSummariesViaStore(): Promise<(number | null)[] | null> {
    if (applyGate.skip || !bound || Array.isArray(bound) || !hasStore()) return null
    const apply = buildSummaryApply(summarySpecs)
    if (!apply) return null

    let rows: Array<Record<string, unknown>> | null
    try {
      rows = await loadApply(bound.store!()!, composeSummaryApply(apply, summaryFilterOf(bound)))
    } catch (err) {
      applyGate.reject(err)
      return null
    }
    // One row, carrying the aliases and nothing else — an entity carries the
    // rest of the record, and that is the tell that the clause was ignored.
    if (!rows || rows.length !== 1 || !isRolledUp(rows, summaryAliases(summarySpecs))) return null
    return summaryOutToValues(rows[0])
  }

  let _summaryRun = 0
  /**
   * Recompute every registered summary over the full filtered set and notify.
   * No-op when nothing is registered (an unused grid never fetches) or — unless
   * `force`d — when the set hasn't changed since the last compute (so sort/paging
   * don't refetch). A run token guards against overlapping async reads landing
   * out of order.
   *
   * BURST COALESCING: a footer mounts many `<mono-table-summary>` elements and each
   * registration forces a recompute — Lit elements upgrade across separate tasks, so a
   * 48-column footer used to fire one resolver request PER element, each carrying only
   * the specs registered so far (the `$apply` aggregate list visibly grew 1 → 2 → N).
   * While one recompute is in flight, later ones only mark `_summaryQueued` and return;
   * a single trailing recompute then runs with the FULL spec set. A mount burst is
   * capped at leading + trailing requests whatever N is, and the trailing run's cache
   * write is what the footer finally shows.
   */
  let _summaryInFlight = false
  let _summaryQueued = false

  async function recomputeSummaries(force = false): Promise<void> {
    if (!summarySpecs.length) return
    if (!force && summaryComputed === summaryVersion) return

    if (_summaryInFlight) {
      _summaryQueued = true
      return
    }
    _summaryInFlight = true

    const run = ++_summaryRun
    const captured = summaryVersion

    try {
      // Ask the consumer's resolver first, then the source's own store (ONE
      // `$apply` request). Each declines with `null` — no resolver, an array
      // source, a backend without `$apply`, a request that failed — and the drain
      // below is still the definition of the result, so both are pure
      // optimisations and an array-backed grid never leaves the local path.
      //
      // The win is on a server-paged table, where the drain re-fetches through the
      // pager every row the pager exists to avoid, purely to add up a footer.
      let resolved = await resolveSummaries()
      if (run !== _summaryRun) return // a newer recompute superseded this one
      if (!resolved) {
        resolved = await resolveSummariesViaStore()
        if (run !== _summaryRun) return
      }
      if (resolved) {
        summarySpecs.forEach((spec, i) => {
          summaryCache.set(summaryKey(spec), resolved[i] ?? null)
        })
        summaryComputed = captured
        notify()
        return
      }

      const rows = await getData()
      if (run !== _summaryRun) return // a newer recompute superseded this one
      for (const spec of summarySpecs) {
        summaryCache.set(summaryKey(spec), aggregate(spec, rows))
      }
      summaryComputed = captured
      notify()
    } finally {
      _summaryInFlight = false
      // Whatever queued while this run was aloft runs ONCE more, with every spec
      // registered by then. Superseded runs (run !== _summaryRun) leave the flag set
      // for their replacer, which is already inside this same gate.
      if (_summaryQueued) {
        _summaryQueued = false
        void recomputeSummaries(true)
      }
    }
  }

  function registerColumn(el: MonoColumnEl): void {
    columnEls.add(el)
  }

  function unregisterColumn(el: MonoColumnEl): void {
    columnEls.delete(el)
    // Last header cell gone → the table this grid was driving is being torn
    // down, so drop the row-trigger listener with it.
    if (columnEls.size === 0) unbindRowTrigger()
  }

  // --- row details (`<mono-table-detail>`) -----------------------------------
  // A registry only: each element owns its own `open` state (and its panel row),
  // the controller just drives them in bulk.
  const detailEls = new Set<MonoDetailEl>()

  function registerDetail(el: MonoDetailEl): void {
    detailEls.add(el)
  }

  function unregisterDetail(el: MonoDetailEl): void {
    detailEls.delete(el)
  }

  const detailHandle: MonoDetailHandle = {
    expandAll(): void {
      for (const el of detailEls) el.open = true
      notify()
    },
    collapseAll(): void {
      for (const el of detailEls) if (!el.stayOpen) el.open = false
      notify()
    },
    collapseOthers(except?: MonoDetailEl): void {
      // `stayOpen` means "exempt from automatic closes", so it is honoured by
      // the accordion exactly as it is by `collapseAll`.
      let changed = false
      for (const el of detailEls) {
        if (el === except || el.stayOpen || !el.open) continue
        el.open = false
        changed = true
      }
      if (changed) notify()
    },
    openCount(): number {
      let open = 0
      for (const el of detailEls) if (el.open) open++
      return open
    },
    getAll: () => domOrdered(Array.from(detailEls)),
  }

  function detail(): MonoDetailHandle {
    return detailHandle
  }

  // --- row selection (`<mono-table-checkbox>`) --------------------------------
  // Keyed by `rowKeyOf`, NOT by `keyValue`: the projection may be multi-field,
  // wildcard or absent, while the row key is always one stable string. That is
  // what lets a drained row and a loaded row recognise each other.
  const checkedRows = new Map<string, T>()
  let checkConfig: MonoCheckConfig = {}
  let checkPending = false

  /** `keyValue` as a list (empty = project nothing, i.e. keep the whole row). */
  function checkKeys(): string[] {
    const k = checkConfig.keyValue
    if (!k) return []
    return (Array.isArray(k) ? k : [k]).filter(Boolean)
  }

  /**
   * Columns to fetch while draining, or `null` for "everything".
   *
   * `keyExpr` is normally included, even when the consumer only asked for other
   * fields: `rowKeyOf` reads `row[keyExpr]` and falls back to the array INDEX
   * when it's missing, so a drain without it would key every row by its position
   * and collide with the loaded page. A `[*]` path can't be expressed as
   * `$select` at all (it needs an expand), so any wildcard drops the optimisation.
   *
   * EXCEPT when `keyExpr` names a field the rows do not have — a misconfigured
   * (or defaulted) key would otherwise put a non-existent column on the wire and
   * the server rejects the whole drain: OData answers `$select=Id` on an entity
   * without `Id` with a 400. A wrong key should cost a wider fetch, not a failed
   * one, so drop the optimisation and read whole rows instead.
   */
  function checkSelect(): string[] | null {
    const keys = checkKeys()
    if (!keys.length) return null
    const cols: string[] = []
    for (const key of keys) {
      if (parseFieldPath(key).hasWildcard) return null
      const selector = toODataSelector(key)
      if (!selector) return null
      cols.push(selector)
    }
    if (!cols.includes(keyExpr)) {
      if (!rowsHaveKeyExpr()) {
        warnMissingKeyExpr()
        return null
      }
      cols.push(keyExpr)
    }
    return cols
  }

  /** A positive integer limit, or undefined when the config has none. */
  function limitOf(value: number | null | undefined): number | undefined {
    if (value == null) return undefined
    const n = Math.floor(Number(value))
    return Number.isFinite(n) && n >= 0 ? n : undefined
  }
  function checkLimits(): MonoCheckLimits {
    const max = limitOf(checkConfig.max)
    const min = limitOf(checkConfig.min)
    return { ...(max !== undefined ? { max } : {}), ...(min !== undefined ? { min } : {}) }
  }

  /**
   * Add rows up to the cap. Rows already selected never count against the room
   * left — re-selecting a drained set the user has partly unticked must still be
   * a no-op for what is there. When `capped` is false (`replace`) the cap is
   * ignored: a value the developer pushes in is theirs.
   */
  function addChecked(rows: readonly T[], capped = true): void {
    const max = capped ? checkLimits().max : undefined
    rows.forEach((row, i) => {
      const key = rowKeyOf(row, i)
      // An already-selected row only refreshes its data — it takes no room.
      if (!checkedRows.has(key) && max !== undefined && checkedRows.size >= max) return
      checkedRows.set(key, row)
    })
  }

  /**
   * The last completed drain, so "select all → untick one → select all again"
   * costs nothing instead of walking the whole source a second time.
   *
   * Deliberately NOT an OData `not in (…)` query over the already-selected keys:
   * the exclusion list is largest exactly when the selection is largest, so
   * re-selecting after unticking one of 1,085 rows would mean putting 1,084 ids
   * in a URL — past every practical URL limit, and slower than the paged drain it
   * replaces. Remembering the drain is the cheap direction.
   *
   * One entry, invalidated whenever the ROW SET could differ: a different
   * filter/search (compared by reference, since the controller builds a fresh
   * expression for every real change), a different `$select` projection, or any
   * `bumpSummary` (bind / reload / setData / search / filter). Sorting and paging
   * deliberately do NOT invalidate — they reorder or window the same set.
   */
  let drainedRows: T[] | null = null
  let drainedFilter: unknown = null
  let drainedSearch: unknown = null
  let drainedTerms = ''
  let drainedSelect = ''
  let drainedVersion = -1

  function drainIsReusable(): boolean {
    if (!drainedRows) return false
    return (
      Object.is(drainedFilter, bound?.filter?.() ?? null) &&
      Object.is(drainedSearch, bound?.searchValue?.() ?? null) &&
      drainedTerms === JSON.stringify(ctrl.searchTerms) &&
      drainedSelect === JSON.stringify(checkSelect()) &&
      drainedVersion === rowSetVersion
    )
  }

  function rememberDrain(rows: T[]): void {
    drainedRows = rows
    drainedFilter = bound?.filter?.() ?? null
    drainedSearch = bound?.searchValue?.() ?? null
    drainedTerms = JSON.stringify(ctrl.searchTerms)
    drainedSelect = JSON.stringify(checkSelect())
    drainedVersion = rowSetVersion
  }

  const checkHandle: MonoCheckHandle<T> = {
    getAll(): T[] {
      const keys = checkKeys()
      return [...checkedRows.values()].map((row) => projectFields(row, keys) as T)
    },
    count: () => checkedRows.size,
    rows: () => [...checkedRows.values()],
    isChecked(row: T | string): boolean {
      return checkedRows.has(typeof row === 'string' ? row : rowKey(row))
    },
    toggle(item: T, checked?: boolean): void {
      if (item == null) return
      const key = rowKey(item)
      const has = checkedRows.has(key)
      const next = checked === undefined ? !has : checked
      // At a limit the store stays as it is but STILL notifies: a native checkbox
      // has already flipped itself by the time its `change` fires, and the
      // subscribers repaint from the store — that repaint is the "revert".
      const { max, min } = checkLimits()
      const rejected =
        (next && !has && max !== undefined && checkedRows.size >= max) ||
        (!next && has && min !== undefined && checkedRows.size <= min)
      if (!rejected) {
        if (next) checkedRows.set(key, item)
        else checkedRows.delete(key)
      }
      notify()
    },
    selectPage(): void {
      addChecked(ctrl.items as T[])
      notify()
    },
    replace(rows: readonly T[]): void {
      checkedRows.clear()
      addChecked(rows, false)
      notify()
    },
    async selectAll(): Promise<void> {
      if (checkPending) return

      // Already walked this exact row set — re-select from the remembered drain
      // instead of asking the server for the same 1,085 rows again. This is the
      // "untick one, then select all again" path, and it issues NO request.
      if (drainIsReusable()) {
        addChecked(drainedRows!)
        notify()
        return
      }

      checkPending = true
      notify()
      try {
        // `readAllRows` walks the store in chunks AND rebuilds the source's live
        // `filter` + `searchValue` (see `searchFilterOf`), so "select all" means
        // every row matching what the user is currently looking at. An array
        // source drains in memory through the same call — no branch here.
        const select = checkSelect()
        const rows = await readAllRows<T>(bound, {
          chunkSize: Math.max(1, Math.floor(checkConfig.chunk ?? 100)),
          ...(select ? { select } : {}),
          sort: mergedSort(),
        })
        rememberDrain(rows)
        addChecked(rows)
        clearError()
      } catch (err) {
        // `readAllRows` has no catch of its own, so a failed drain used to leave
        // through here as a bare rejection with nothing to show for it.
        captureError(err, 'selectAll')
        throw err
      } finally {
        checkPending = false
        notify()
      }
    },
    clear(): void {
      if (!checkedRows.size) return
      // A floor keeps the FIRST `min` rows (selection order) — "clear" then means
      // "down to the minimum", which is the most a user gesture may do.
      const min = checkLimits().min ?? 0
      if (min > 0) {
        if (checkedRows.size <= min) {
          notify()
          return
        }
        const keep = [...checkedRows.entries()].slice(0, min)
        checkedRows.clear()
        for (const [key, row] of keep) checkedRows.set(key, row)
      } else {
        checkedRows.clear()
      }
      notify()
    },
    limits: checkLimits,
    get atMax(): boolean {
      const max = checkLimits().max
      return max !== undefined && checkedRows.size >= max
    },
    get atMin(): boolean {
      const min = checkLimits().min
      return min !== undefined && checkedRows.size <= min
    },
    get pending(): boolean {
      return checkPending
    },
    get allChecked(): boolean {
      const rows = ctrl.items as T[]
      return rows.length > 0 && rows.every((row, i) => checkedRows.has(rowKeyOf(row, i)))
    },
    get someChecked(): boolean {
      const rows = ctrl.items as T[]
      if (!rows.length || !checkedRows.size) return false
      return !rows.every((row, i) => checkedRows.has(rowKeyOf(row, i)))
    },
    configure(config: MonoCheckConfig): void {
      // Merge, skipping undefined: several elements declare into one config and a
      // row checkbox that omits `keyValue` must not wipe the header's. `null` is
      // the explicit "unset" (a `max` / `min` the dropdown lifts again).
      for (const [k, v] of Object.entries(config)) {
        if (v === null) delete (checkConfig as Record<string, unknown>)[k]
        else if (v !== undefined) (checkConfig as Record<string, unknown>)[k] = v
      }
    },
  }

  function check(): MonoCheckHandle<T> {
    return checkHandle
  }

  /**
   * Sort elements by document order so a handle reads left→right / top→bottom as
   * displayed. Falls back to insertion order where `compareDocumentPosition` is
   * unavailable (SSR / no DOM).
   */
  function domOrdered<E extends { compareDocumentPosition?(other: Node): number }>(els: E[]): E[] {
    return els.sort((a, b) => {
      if (typeof a.compareDocumentPosition !== 'function') return 0
      const pos = a.compareDocumentPosition(b as unknown as Node)
      if (pos & 0x04 /* DOCUMENT_POSITION_FOLLOWING */) return -1
      if (pos & 0x02 /* DOCUMENT_POSITION_PRECEDING */) return 1
      return 0
    })
  }

  function orderedColumnEls(): MonoColumnEl[] {
    const els = Array.from(columnEls)
    // Sort by document order so Tab moves left→right as displayed. Falls back to
    // insertion order when compareDocumentPosition is unavailable (SSR/no DOM).
    return els.sort((a, b) => {
      if (typeof a.compareDocumentPosition !== 'function') return 0
      const pos = a.compareDocumentPosition(b as unknown as Node)
      if (pos & 0x04 /* DOCUMENT_POSITION_FOLLOWING */) return -1
      if (pos & 0x02 /* DOCUMENT_POSITION_PRECEDING */) return 1
      return 0
    })
  }

  function registeredColumns(): MonoColumn[] {
    return orderedColumnEls().map((el) => ({
      field: el.field,
      caption: el.caption,
      sort: el.sort,
      editable: el.editable,
      headerFilter: el.headerFilter,
      dateFilter: el.dateFilter,
    }))
  }

  function editableColumns(): MonoColumn[] {
    return registeredColumns().filter((c) => !!c.editable && !!c.field)
  }

  // Central column config (from `opts.columns`), read via the `columns()` handle.
  // Purely a declarative store — separate from the registered `<th>` elements.
  const columnDefs: MonoColumnDef[] = [...(opts.columns ?? [])]
  const columnsHandle: MonoColumnHandle = {
    get: (field: string) => columnDefs.find((c) => c.field === field) ?? null,
    getAll: () => columnDefs,
  }

  // --- central element props (`opts.props`) ----------------------------------
  // One object, stable identity, mutated in place — same contract as `items`.
  // `th` is `opts.columns` with `props.th` merged OVER it per field, so a field
  // declared in both keeps the `props` value and the two styles can coexist.
  const elementProps: MonoTableProps = { ...(opts.props ?? {}) }
  {
    const declared = opts.props?.th ?? []
    const byField = new Map<string, MonoTableColumnProps>()
    for (const c of columnDefs) {
      if (c?.field) byField.set(c.field, { ...(c as MonoTableColumnProps) })
    }
    for (const c of declared) {
      if (!c?.field) continue
      byField.set(c.field, { ...(byField.get(c.field) ?? {}), ...c })
    }
    // Declared order first (that's the header order the consumer wrote), then
    // any `columns`-only field that `props.th` never mentioned.
    const ordered: MonoTableColumnProps[] = []
    for (const c of declared) if (c?.field && byField.has(c.field)) ordered.push(byField.get(c.field)!)
    for (const [field, c] of byField) if (!ordered.some((o) => o.field === field)) ordered.push(c)
    elementProps.th = ordered
  }

  function props(): MonoTableProps {
    return elementProps
  }

  /** Snapshot written into `opts.state` on every notify (see `notify`). */
  function propsSnapshot(): MonoTableProps {
    return {
      ...elementProps,
      th: (elementProps.th ?? []).map((c) => ({ ...c })),
    }
  }
  function columns(): MonoColumnHandle {
    return columnsHandle
  }

  function indexOfRowKey(rowKey: string): number {
    return (ctrl.items as T[]).findIndex((row, i) => rowKeyOf(row, i) === rowKey)
  }

  function rowByKey(rowKey: string): T | undefined {
    const i = indexOfRowKey(rowKey)
    return i >= 0 ? (ctrl.items as T[])[i] : undefined
  }

  function _cssEscape(value: string): string {
    return typeof CSS !== 'undefined' && CSS.escape ? CSS.escape(value) : value
  }

  /**
   * Is this pointer event a press on `el`'s scrollbar rather than on its content?
   *
   * Overlay scrollbars are painted over the content box, so the event target is
   * the element underneath and only the coordinates can tell the two apart. A
   * band is live only on an axis that actually overflows, which keeps a genuine
   * click on the last row from being mistaken for a scrollbar grab.
   */
  function _inScrollbarBand(el: HTMLElement, e: Event): boolean {
    const { clientX: x, clientY: y } = e as MouseEvent
    if (typeof x !== 'number' || typeof y !== 'number') return false
    // Chrome's overlay scrollbar hit area; classic scrollbars are ~15-17px too.
    const BAND = 17
    const r = el.getBoundingClientRect()
    const inX = x >= r.left && x <= r.right
    const inY = y >= r.top && y <= r.bottom
    if (el.scrollWidth > el.clientWidth + 1 && inX && y >= r.bottom - BAND && y <= r.bottom)
      return true
    if (el.scrollHeight > el.clientHeight + 1 && inY && x >= r.right - BAND && x <= r.right)
      return true
    return false
  }

  // Leave edit mode on a pointer-down OUTSIDE the editing row. A `pointerdown`
  // (installed only while editing) reads the click LOCATION, so it correctly
  // keeps editing for in-row clicks — including toggling a `mono-switch`, whose
  // inner input isn't focused on click (so a `focusout`/`relatedTarget` approach
  // wrongly reads "focus left the row" and would close the editor). Deferred so
  // an in-flight `mno-change`→`stageCell` commit lands first; re-checked so a
  // click that moves editing to another row doesn't cancel the new one.
  let _outsidePointer: ((e: Event) => void) | null = null

  function installOutsideExit(): void {
    if (typeof document === 'undefined' || _outsidePointer) return
    _outsidePointer = (e: Event) => {
      const key = ctrl.editingKey
      if (key == null) return
      const target = e.target as Element | null
      if (!target?.closest) return
      // Keep editing when the click is in the row, OR inside an editor's
      // portaled popup — a mono select/dropdown/tag-input panel
      // (`[data-mono-popup-portal]`) or a `mono-date` flatpickr calendar
      // (`.flatpickr-calendar`), both rendered to `<body>` outside the row.
      if (
        target.closest(`[data-row-key="${_cssEscape(key)}"]`) ||
        target.closest('[data-mono-popup-portal], .flatpickr-calendar')
      )
        return
      // Grabbing a scrollbar must NOT close the editor — with the action column
      // pinned, scrolling to reach the other columns is a normal part of editing.
      // Two shapes to cover:
      //  - classic scrollbars sit outside the content box, so the press targets
      //    the scroll container itself;
      //  - OVERLAY scrollbars (Chrome on Windows 11 / macOS) are drawn *inside*
      //    it, so the press reports whatever is underneath — typically a `<td>`
      //    of a different row — and an identity check never fires. Hence the
      //    geometric band test, restricted to an axis that actually overflows.
      // Walk up from the PRESS ITSELF. Locating the scroller from the editing
      // row instead would need a document-wide `[data-row-key]` lookup, which
      // picks the first match on the page — the wrong table whenever two grids
      // share a row key.
      let node: HTMLElement | null = target as HTMLElement
      while (node) {
        const s = getComputedStyle(node)
        if (/(auto|scroll)/.test(s.overflowX + s.overflowY) && _inScrollbarBand(node, e)) return
        node = node.parentElement
      }
      setTimeout(() => {
        if (ctrl.editingKey === key) cancelEdit()
      }, 0)
    }
    document.addEventListener('pointerdown', _outsidePointer, true)
  }

  function removeOutsideExit(): void {
    if (!_outsidePointer || typeof document === 'undefined') return
    document.removeEventListener('pointerdown', _outsidePointer, true)
    _outsidePointer = null
  }

  // --- Row trigger (click / double-click opens the inline editor) -------------
  // The grid is headless — the consumer authors the `<tr>` — so the controller
  // binds ONE delegated listener on the `<table>` a `mono-table-th` reports via
  // `bindRowTrigger`. Every header cell calls in, hence the identity checks below
  // (re-binding only on a real change is what dedupes them).
  let _triggerEl: HTMLElement | null = null
  let _triggerHandler: ((e: Event) => void) | null = null
  let _triggerType: 'click' | 'dblclick' | null = null

  const _onRowTrigger = (e: Event): void => {
    const target = e.target as Element | null
    if (!target?.closest) return
    // Never hijack an interaction meant for an editor or an action control —
    // otherwise a plain `click` trigger fires on the row's own Edit/Delete/Save
    // buttons and on every keystroke target inside an open editor.
    if (target.closest('[data-edit-cell]')) return
    if (target.closest('button, a, input, select, textarea, label, [contenteditable="true"]'))
      return

    const rowEl = target.closest('[data-row-key]') as HTMLElement | null
    if (!rowEl) return
    const key = rowEl.getAttribute('data-row-key')
    if (key == null || ctrl.editingKey === key) return
    if (!editableColumns().length) return
    // `form({ showForm: true })` rows already render their editors with no
    // trigger (see `isEditingCell`); taking `editingKey` would only disable the
    // consumer's Add buttons, which gate on `editingKey == null`.
    if (isEditableRow(rowByKey(key))) return

    beginEditRow(key, e)
  }

  /**
   * Point the row trigger at the `<table>` that owns this grid's rows. Called by
   * every `mono-table-th` on update; idempotent, so only a changed table element
   * or a changed `editableTrigger` actually re-binds.
   */
  function bindRowTrigger(tableEl: HTMLElement | null): void {
    if (typeof document === 'undefined') return
    const type = ctrl.editableTrigger === 'double-click' ? 'dblclick' : 'click'
    if (tableEl === _triggerEl && type === _triggerType) return
    unbindRowTrigger()
    if (!tableEl) return
    _triggerHandler = _onRowTrigger
    _triggerType = type
    _triggerEl = tableEl
    tableEl.addEventListener(type, _triggerHandler)
  }

  function unbindRowTrigger(): void {
    if (_triggerEl && _triggerHandler && _triggerType) {
      _triggerEl.removeEventListener(_triggerType, _triggerHandler)
    }
    _triggerEl = null
    _triggerHandler = null
    _triggerType = null
  }

  function beginEditRow(rowKey: string, event?: Event): void {
    if (ctrl.editingKey === rowKey) return
    ctrl.editingKey = rowKey
    installOutsideExit()
    installEditorKeys()
    notify()
    // Focus the editor in the cell that was clicked so you can type immediately
    // in the column you aimed at — falling back to the row's first editable cell
    // for a non-editable (ID / actions) cell or a programmatic call. Pass the
    // triggering event (the row click / dblclick) so the query is scoped to the
    // table that raised it.
    if (event) focusRowCell(event.target, rowKey, 'first', { preferClicked: true })
  }

  function cancelEdit(): void {
    removeOutsideExit()
    removeEditorKeys()
    if (ctrl.editingKey === null) return
    ctrl.editingKey = null
    notify()
  }

  function isEditingRow(rowKey: string): boolean {
    return ctrl.editingKey === rowKey
  }

  /** A `form({ showForm: true })` row inserted for inline data entry. */
  function isEditableRow(row: T | undefined): boolean {
    return !!row && (row as Record<string, unknown>)._Type === EDITABLE_MARK
  }

  function isEditingCell(rowKeyStr: string, field: string): boolean {
    const editableCol = registeredColumns().some((c) => c.field === field && !!c.editable)
    if (!editableCol) return false
    // The row being inline-edited (via the row trigger or `beginEditRow`), OR any
    // `showForm` add row — its editors show with no trigger at all so the user
    // can fill it straight away.
    return ctrl.editingKey === rowKeyStr || isEditableRow(rowByKey(rowKeyStr))
  }

  function commitCell(rowKey: string, field: string, value: unknown): void {
    ctrl.onCellChange?.({ rowKey, field, value, row: rowByKey(rowKey) })
  }

  // --- Staged (batch) editing -------------------------------------------------
  // `stageCell` buffers an edit; the grid shows it optimistically via
  // `cellValue`. `saveChanges()` flushes every staged row to the bound source
  // (a DataSource store `update`, an array source `update`, or `setData`);
  // `discardChanges()` drops the buffer. No request is sent per keystroke.

  function serverKeyOf(rowKey: string): unknown {
    const row = rowByKey(rowKey)
    return row ? (row as Record<string, unknown>)[keyExpr] ?? rowKey : rowKey
  }

  function stageCell(rowKey: string, field: string, value: unknown): void {
    // A `showForm` row is a live object in `items` (and in the form buffer) — write
    // the value straight through so `apply()` commits exactly what the user typed;
    // the staged cell buffer isn't involved for these rows.
    const row = rowByKey(rowKey)
    if (isEditableRow(row)) {
      if (isPath(field)) setFieldValue(row as Record<string, unknown>, field, value)
      else (row as Record<string, unknown>)[field] = value
      notify()
      return
    }
    const patch = pending.get(rowKey) ?? {}
    patch[field] = value
    pending.set(rowKey, patch)
    // A hand edit supersedes whatever an import put here, so the cell stops
    // being "imported" — otherwise it would keep the import tint after the user
    // has typed over it.
    clearImported(rowKey, field)
    notify()
  }

  // --- Imported-cell marks ----------------------------------------------------
  // Which staged cells came from `table.import()` rather than a hand edit, so a
  // consumer can tint them differently. Lives alongside `pending` and shares its
  // lifetime: cleared per-cell on a manual edit, wholesale on save/discard.
  const importedCells = new Map<string, Set<string>>()

  function markImported(rowKey: string, fields: Iterable<string>): void {
    const set = importedCells.get(rowKey) ?? new Set<string>()
    for (const f of fields) set.add(f)
    importedCells.set(rowKey, set)
  }

  function clearImported(rowKey: string, field: string): void {
    const set = importedCells.get(rowKey)
    if (!set) return
    set.delete(field)
    if (!set.size) importedCells.delete(rowKey)
  }

  function isCellImported(rowKey: string, field: string): boolean {
    return !!importedCells.get(rowKey)?.has(field)
  }

  function isRowImported(rowKey: string): boolean {
    return !!importedCells.get(rowKey)?.size
  }

  /** Staged value for a cell, or `fallback` when the cell isn't staged. */
  function cellValue(rowKey: string, field: string, fallback: unknown): unknown {
    // `showForm` rows carry their own live values (edited in place).
    const row = rowByKey(rowKey)
    if (isEditableRow(row)) {
      const v = isPath(field)
        ? getFieldValue(row, field)
        : (row as Record<string, unknown>)[field]
      return v === undefined ? fallback : v
    }
    const patch = pending.get(rowKey)
    return patch && field in patch ? patch[field] : fallback
  }

  function isCellDirty(rowKey: string, field: string): boolean {
    const patch = pending.get(rowKey)
    return !!patch && field in patch
  }

  function isRowDirty(rowKey: string): boolean {
    return pending.has(rowKey)
  }

  function pendingCount(): number {
    return pending.size
  }

  function hasChanges(): boolean {
    return pending.size > 0
  }

  /** The staged change set — for a consumer that sends its own (bulk) request. */
  function changes(): Array<MonoStagedChange<T>> {
    return Array.from(pending.entries()).map(([rowKey, patch]) => ({
      rowKey,
      key: serverKeyOf(rowKey),
      patch: { ...patch },
      row: rowByKey(rowKey),
    }))
  }

  /** Drop the staged buffer and the import marks that shadow it. */
  function clearPending(): void {
    pending.clear()
    importedCells.clear()
  }

  function discardChanges(): void {
    if (pending.size === 0) return
    clearPending()
    notify()
  }

  /**
   * Flush every staged row to the bound source, then clear + reflect. Remote
   * DataSource → `store.update(key, patch)` per row + `reload()`; array source →
   * per-row `update`; else a `setData` merge of the current page. On error the
   * buffer is KEPT so the save can be retried.
   */
  async function saveChanges(): Promise<void> {
    if (pending.size === 0) return
    const entries = Array.from(pending.entries())
    const s = bound as
      | (MonoGridSource<T> & {
          update?: (k: unknown, v: Record<string, unknown>) => PromiseLike<unknown> | unknown
          setData?: (n: T[]) => PromiseLike<T[]> | T[]
        })
      | null
    const store = s?.store?.()

    if (store && typeof store.update === 'function') {
      // Remote store.update sends the patch as-is: a nested/path key (`Job.Name`)
      // is NOT auto-transformed into a nested PATCH body — that's the backend's
      // contract. Path fields are client-merge-only (see setData branch below).
      for (const [rowKey, patch] of entries) {
        if (Object.keys(patch).some(isPath)) {
          console.warn(
            '[monoDataGrid] saveChanges: a remote store.update patch contains a path key; ' +
              'nested PATCH bodies are not auto-built — send the nested shape your backend expects.',
          )
        }
        await store.update(serverKeyOf(rowKey), patch)
      }
      clearPending()
      await reload()
      return
    }
    if (s && typeof s.update === 'function') {
      for (const [rowKey, patch] of entries) await s.update(serverKeyOf(rowKey), patch)
      clearPending()
      notify()
      return
    }
    if (s && typeof s.setData === 'function') {
      // Merge against the FULL backing array, not `ctrl.items`. Staged edits can
      // reach rows that aren't on the visible page — an import stages across the
      // whole dataset — and merging only the page would silently drop them.
      const all = ((s.data?.() ?? ctrl.items) as T[]) ?? []
      const next = all.map((row, i) => {
        const patch = pending.get(rowKeyOf(row, i))
        // mergePatch clones + applies path keys (`Job.Name`) as nested writes.
        return patch ? mergePatch(row, patch) : row
      })
      clearPending()
      await setData(next)
      return
    }
    // Nothing writable — the optimistic values are already shown; just drop the buffer.
    clearPending()
    notify()
  }

  // --- Row-level CRUD staging (form) -----------------------------------------
  // Modelled on the @mono-lit/utility core `replacerData` (not imported): optimistic local row
  // insert/update/delete used to reflect your own change API without a reload.

  /** First existing row to infer an empty-row shape from (array backing → page → items). */
  function formSample(): Record<string, unknown> | undefined {
    const fromData = (bound?.data?.() as T[] | undefined)?.[0] // array source: full list
    const fromItems = (bound?.items?.() as T[] | undefined)?.[0] // current page (flat rows)
    return (fromData ?? fromItems ?? (ctrl.items as T[])[0]) as
      | Record<string, unknown>
      | undefined
  }

  /** Build a typed-empty row from a sample: number→0, string→'', bool→false, array→[], Date→null, object→{}. */
  function emptyLike(sample: Record<string, unknown>): Record<string, unknown> {
    const out: Record<string, unknown> = {}
    for (const k in sample) {
      const v = sample[k]
      if (v == null) out[k] = null
      else if (typeof v === 'number') out[k] = 0
      else if (typeof v === 'string') out[k] = ''
      else if (typeof v === 'boolean') out[k] = false
      else if (Array.isArray(v)) out[k] = []
      else if (v instanceof Date) out[k] = null
      else if (typeof v === 'object') out[k] = {}
      else out[k] = null
    }
    return out
  }

  /** Strip OData response metadata off a staged row before it enters the data. */
  function cleanRow(row: unknown): unknown {
    if (row && typeof row === 'object') {
      const r = row as Record<string, unknown>
      if ('@odata.context' in r) delete r['@odata.context']
      if ('@odata.url' in r) delete r['@odata.url']
    }
    return row
  }

  /**
   * The row to actually commit: OData metadata stripped, and — for a `showForm`
   * row — the `_Type` marker removed (the non-enumerable identity symbol is dropped
   * by the spread). Returns a clean object; never carries the editable marker.
   */
  function commitRow(row: T): T {
    cleanRow(row)
    if (isEditableRow(row)) {
      const { _Type, ...rest } = row as Record<string, unknown>
      void _Type
      return rest as T
    }
    return row
  }

  const looseEq = (a: unknown, b: unknown): boolean => a == b // loose, like replacerData

  /** Replay one op into a full array (array source path). */
  function replayArray(arr: T[], op: MonoFormOp<T>, key: string): void {
    const idxOf = (k: unknown): number =>
      arr.findIndex((e) => looseEq((e as Record<string, unknown>)?.[key], k))
    if (op.op === 'add') {
      for (const src of op.rows) {
        const row = commitRow(src)
        const i = idxOf((row as Record<string, unknown>)?.[key])
        if (i >= 0) arr.splice(i, 1, row) // dedupe: replace existing same-key row
        else arr.unshift(row)
      }
    } else if (op.op === 'edit') {
      const i = idxOf(op.key)
      if (i >= 0) arr.splice(i, 1, { ...(arr[i] as object), ...(op.row as object) } as T)
      // key not found → strict no-op
    } else {
      const i = idxOf(op.key)
      if (i >= 0) arr.splice(i, 1) // not found → no-op
    }
  }

  /** Replay one op into the live page collection (remote source path). Returns the totalCount delta. */
  function replayDs(coll: T[], op: MonoFormOp<T>, key: string, pushes: MonoStorePush[]): number {
    const idxOf = (k: unknown): number =>
      coll.findIndex((e) => looseEq((e as Record<string, unknown>)?.[key], k))
    if (op.op === 'add') {
      let delta = 0
      for (const src of op.rows) {
        const row = commitRow(src)
        const k = (row as Record<string, unknown>)?.[key]
        const i = idxOf(k)
        if (i >= 0) {
          Object.assign(coll[i] as object, row as object) // dedupe
        } else {
          coll.unshift(row)
          pushes.push({ type: 'insert', data: row as Record<string, unknown>, key: k })
          delta++
        }
      }
      return delta
    }
    if (op.op === 'edit') {
      const i = idxOf(op.key)
      if (i >= 0) {
        Object.assign(coll[i] as object, op.row as object) // keeps reference, like replacerData
        pushes.push({ type: 'update', key: op.key, data: op.row as Record<string, unknown> })
      }
      return 0
    }
    const i = idxOf(op.key)
    if (i >= 0) {
      coll.splice(i, 1)
      pushes.push({ type: 'remove', key: op.key })
      return -1
    }
    return 0
  }

  /** Commit all staged form ops into the rendered data. Local only — no server call. Final: no undo. */
  async function applyForm(): Promise<void> {
    if (formOps.length === 0) return
    const key = formKey ?? keyExpr
    const ops = formOps.splice(0, formOps.length) // clear the buffer atomically
    const s = bound as
      | (MonoGridSource<T> & { setData?: (n: T[]) => PromiseLike<T[]> | T[] })
      | null

    // ARRAY source: rebuild the FULL backing array, then setData. `setData` resets
    // to page 0 and fires `changed → sync`, so totalCount/paging/scroll/grouped all
    // recompute automatically.
    if (s && typeof s.setData === 'function') {
      // Backing array — never the optimistic `showForm` rows in `ctrl.items` (those
      // are re-inserted from the buffer by replayArray, so including them dupes).
      const base = (s.data?.() as T[]) ?? (ctrl.items as T[]).filter((r) => !isEditableRow(r))
      const next = [...(base ?? [])]
      for (const op of ops) replayArray(next, op, key)
      await setData(next)
      return
    }

    // REMOTE DataSource: optimistic in-place mutation of the live page + optional
    // store.push. Flat-only (server totalCount can't see local inserts/deletes, so
    // adjust ctrl.totalCount by the net delta directly and render — no sync()).
    const store = s?.store?.()
    if (s && store) {
      if (isGrouped() || serverMode()) {
        console.warn(
          '[monoDataGrid] form().apply() on a grouped/server grid updates only the flat page; reload to refresh groups.',
        )
      }
      const coll = (s.items?.() as T[]) ?? []
      const pushes: MonoStorePush[] = []
      let delta = 0
      for (const op of ops) delta += replayDs(coll, op, key, pushes)
      if (typeof store.push === 'function' && pushes.length) store.push(pushes)
      ctrl.items = [...coll]
      ctrl.totalCount = Math.max(0, ctrl.totalCount + delta)
      render()
      return
    }

    // No writable source — nothing to render against; just re-notify.
    notify()
  }

  /** Tag a `showForm` row: visible marker + stable non-enumerable identity. */
  function tagEditable(row: T): T {
    ;(row as Record<string, unknown>)._Type = EDITABLE_MARK
    Object.defineProperty(row, MONO_ROW_KEY, {
      value: `__form_${++formTempSeq}`,
      enumerable: false,
      configurable: true,
      writable: true,
    })
    return row
  }

  /** {@link MonoTableController.form} — memoized, chainable handle over one shared buffer. */
  function form(config?: MonoFormConfig<T>): MonoFormHandle<T> {
    if (config?.key) formKey = config.key as string
    // showForm reflects THIS call's intent (not sticky): a later plain form() add
    // buffers normally rather than inheriting a previous inline-add mode.
    formShowForm = !!config?.showForm
    if (formHandle) return formHandle
    const handle: MonoFormHandle<T> = {
      add(row) {
        let rows: T[]
        if (row === undefined) {
          const sample = formSample()
          rows = [(sample ? emptyLike(sample) : {}) as T]
        } else {
          rows = (Array.isArray(row) ? row : [row]) as T[]
        }
        if (formShowForm) {
          // Inline-add: show the row in the grid right now (tagged Editable) so its
          // editors render via isEditingCell; apply() commits it, discard() drops it.
          rows.forEach(tagEditable)
          ;(ctrl.items as T[]).unshift(...rows)
          ctrl.totalCount += rows.length
          render()
        }
        formOps.push({ op: 'add', rows })
        return handle
      },
      edit(k, row) {
        formOps.push({ op: 'edit', key: k, row })
        return handle
      },
      delete(k) {
        formOps.push({ op: 'delete', key: k })
        return handle
      },
      apply: applyForm,
      revert(key) {
        const k = String(key)
        const items = ctrl.items as T[]
        // Remove the inline (showForm) row shown for this key — only ever an
        // un-applied Editable row, so committed data is never touched.
        const idx = items.findIndex((r, i) => rowKeyOf(r, i) === k)
        if (idx >= 0 && isEditableRow(items[idx])) {
          items.splice(idx, 1)
          ctrl.totalCount = Math.max(0, ctrl.totalCount - 1)
        }
        // Drop this row from the staged add ops (matched by the same key).
        for (let i = formOps.length - 1; i >= 0; i--) {
          const op = formOps[i]
          if (op.op !== 'add') continue
          op.rows = op.rows.filter((r) => rowKeyOf(r, -1) !== k)
          if (op.rows.length === 0) formOps.splice(i, 1)
        }
        render()
        return handle
      },
      revertAll() {
        // Remove every inline (showForm) row from the grid…
        const shown = (ctrl.items as T[]).filter((r) => isEditableRow(r)).length
        if (shown) {
          ctrl.items = (ctrl.items as T[]).filter((r) => !isEditableRow(r))
          ctrl.totalCount = Math.max(0, ctrl.totalCount - shown)
        }
        // …and drop those rows from the staged add ops (leave edit/delete ops).
        for (let i = formOps.length - 1; i >= 0; i--) {
          const op = formOps[i]
          if (op.op !== 'add') continue
          op.rows = op.rows.filter((r) => !isEditableRow(r))
          if (op.rows.length === 0) formOps.splice(i, 1)
        }
        render()
        return handle
      },
      changes: () => formOps.map((o) => ({ ...o })),
      discard(key) {
        if (key === undefined) {
          // Clear the whole buffer + remove any optimistic showForm rows.
          formOps.length = 0
          const shown = (ctrl.items as T[]).filter((r) => isEditableRow(r)).length
          if (shown) {
            ctrl.items = (ctrl.items as T[]).filter((r) => !isEditableRow(r))
            ctrl.totalCount = Math.max(0, ctrl.totalCount - shown)
            render()
          }
          return handle
        }
        // Targeted: drop this key's staged ops (+ a matching inline row).
        const k = String(key)
        const items = ctrl.items as T[]
        const idx = items.findIndex((r, i) => rowKeyOf(r, i) === k)
        if (idx >= 0 && isEditableRow(items[idx])) {
          items.splice(idx, 1)
          ctrl.totalCount = Math.max(0, ctrl.totalCount - 1)
        }
        for (let i = formOps.length - 1; i >= 0; i--) {
          const op = formOps[i]
          if (op.op === 'add') {
            op.rows = op.rows.filter((r) => rowKeyOf(r, -1) !== k)
            if (op.rows.length === 0) formOps.splice(i, 1)
          } else if (String(op.key) === k) {
            formOps.splice(i, 1)
          }
        }
        render()
        return handle
      },
      discardAll() {
        handle.discard() // form buffer + inline rows
        clearPending() // cell-edit buffer + import marks
        cancelEdit() // leave edit mode
        render()
        return handle
      },
    }
    formHandle = handle
    return handle
  }

  /**
   * Focus an editor in `rowKey`.
   *
   * `preventScroll` is the important part: a bare `.focus()` scrolls the element
   * into view, and this runs inside a `requestAnimationFrame` — one frame AFTER
   * the row re-rendered — so the browser scrolls `.mono-table-scroll`
   * (`overflow-x: auto`) or the page a moment after the click lands. That
   * delayed nudge is what reads as the editor "jumping".
   *
   * `reveal` opts back into a MINIMAL scroll for the cross-row Tab, where the
   * next row genuinely may be off screen. `block: 'nearest'` moves the least
   * possible amount and does nothing when the row is already visible — unlike
   * the default focus scroll, which can centre it.
   *
   * `preferClicked` focuses the editor in the cell the user actually clicked
   * (falling back to `edge` when that cell has none — an ID or actions column,
   * or a click on the row's padding). Without it, opening a row by clicking its
   * Job cell would drop the caret in Name, and the user has to Tab back across
   * the row to reach the field they aimed at.
   */
  function focusRowCell(
    fromEl: EventTarget | null,
    rowKey: string,
    edge: 'first' | 'last',
    opts: { reveal?: boolean; preferClicked?: boolean; field?: string } = {},
  ): void {
    const from = fromEl as HTMLElement | null
    const table = from?.closest?.('table')
    if (!table || typeof requestAnimationFrame === 'undefined') return
    // Resolve the clicked CELL synchronously: the click target itself is often a
    // static-text node that the re-render swaps out (`v-if`) or hides, but its
    // `<td>` is part of the row template and survives.
    const clickedCell = opts.preferClicked ? (from?.closest?.('td') as HTMLElement | null) : null
    requestAnimationFrame(() => {
      const escaped = typeof CSS !== 'undefined' && CSS.escape ? CSS.escape(rowKey) : rowKey
      const cells = table.querySelectorAll<HTMLElement>(
        `[data-row-key="${escaped}"] [data-edit-cell]`,
      )
      // Only honour the clicked cell while it's still in the row being edited —
      // a re-render can detach it, and a detached editor can't take focus.
      const clicked =
        clickedCell?.closest(`[data-row-key="${escaped}"]`) && table.contains(clickedCell)
          ? (clickedCell.querySelector('[data-edit-cell]') as HTMLElement | null)
          : null
      // An explicit field wins: it's how keyboard navigation lands on a column
      // rather than an edge of the row.
      const byField = opts.field
        ? (table.querySelector(
            `[data-row-key="${escaped}"] [data-edit-cell="${_cssEscape(opts.field)}"]`,
          ) as HTMLElement | null)
        : null
      const target = byField ?? clicked ?? (edge === 'first' ? cells[0] : cells[cells.length - 1])
      // Where the caret goes, in order:
      //  1. the marked node is itself a native field;
      //  2. it's a mono control that defines its own `focus()` — every one of them
      //     does, and it knows its real entry point. Trust it over a descendant
      //     scan, which picks the first `button` in DOM order: a chip's remove
      //     button in `mono-tag-input`, or a pager button inside the (not yet
      //     portaled) panel of `mono-dropdown-table` — the latter is hidden, so
      //     focusing it silently does nothing at all;
      //  3. plain consumer markup — scan for a native field inside it.
      const definesOwnFocus =
        typeof target?.focus === 'function' &&
        typeof HTMLElement !== 'undefined' &&
        target.focus !== HTMLElement.prototype.focus
      const focusable = target?.matches?.('input, textarea, select, button')
        ? target
        : definesOwnFocus
          ? target
          : ((target?.querySelector?.('input, textarea, select, button') as HTMLElement | null) ??
            target)
      if (opts.reveal) revealCell(target)
      focusable?.focus?.({ preventScroll: true })
    })
  }

  /** The nearest scrollable ancestor of `el` — the table's own scroll region first. */
  function scrollParentOf(el: HTMLElement): HTMLElement | null {
    const region = el.closest('.mono-table-scroll, [mono-table-scroll]') as HTMLElement | null
    if (region) return region
    let node: HTMLElement | null = el.parentElement
    while (node) {
      const s = getComputedStyle(node)
      if (/(auto|scroll)/.test(s.overflowX + s.overflowY)) return node
      node = node.parentElement
    }
    return null
  }

  /**
   * Scroll `cell` into view by the SMALLEST delta that works — and no further.
   *
   * `scrollIntoView({ block: 'nearest', inline: 'nearest' })` looks like the
   * answer but isn't: it knows nothing about pinned columns, so on a wide grid
   * it happily parks the cell *underneath* a `.mono-table-sticky-left` column or
   * the sticky header, leaving the user typing into something they can't see.
   * So compute the genuinely visible band from the pinned elements' own rects
   * and scroll only as far as that band requires. Each axis is handled
   * independently, so stepping sideways never nudges the page vertically.
   *
   * This has to be explicit now: the keyboard path focuses with
   * `preventScroll: true`, which is what stopped the browser from revealing the
   * editor for us.
   */
  function revealCell(cell: HTMLElement | null | undefined): void {
    if (!cell || typeof getComputedStyle === 'undefined') return
    const scroller = scrollParentOf(cell)
    if (!scroller) return

    const cellBox = cell.getBoundingClientRect()
    const view = scroller.getBoundingClientRect()
    const row = cell.closest('tr')
    const table = cell.closest('table')
    const MARGIN = 8 // a sliver of context, not a flush edge

    // Narrow the band by anything pinned OVER the scroll content. Measuring the
    // pinned elements' rects (rather than the --mono-table-sticky-* vars) keeps
    // this correct for multi-column pins without re-deriving their bookkeeping.
    const edgeOf = (sel: string, side: 'left' | 'right' | 'top' | 'bottom'): number | null => {
      const nodes = Array.from((row ?? table)?.querySelectorAll<HTMLElement>(sel) ?? [])
      const rects = nodes.filter((n) => !n.contains(cell)).map((n) => n.getBoundingClientRect())
      if (!rects.length) return null
      if (side === 'left') return Math.max(...rects.map((r) => r.right))
      if (side === 'right') return Math.min(...rects.map((r) => r.left))
      if (side === 'top') return Math.max(...rects.map((r) => r.bottom))
      return Math.min(...rects.map((r) => r.top))
    }

    const left = Math.max(view.left, edgeOf('.mono-table-sticky-left, [mono-sticky-left]', 'left') ?? -Infinity)
    const right = Math.min(view.right, edgeOf('.mono-table-sticky-right, [mono-sticky-right]', 'right') ?? Infinity)
    if (cellBox.left < left + MARGIN) scroller.scrollLeft -= left + MARGIN - cellBox.left
    else if (cellBox.right > right - MARGIN) scroller.scrollLeft += cellBox.right - (right - MARGIN)

    // Vertical only matters when the region actually scrolls that way.
    if (scroller.scrollHeight <= scroller.clientHeight + 1) return
    const heads = Array.from(
      table?.querySelectorAll<HTMLElement>('.mono-table-sticky-head thead th, [mono-sticky-head] thead th, thead th') ?? [],
    ).map((n) => n.getBoundingClientRect())
    const foots = Array.from(
      table?.querySelectorAll<HTMLElement>('.mono-table-sticky-foot tfoot th, .mono-table-sticky-foot tfoot td, [mono-sticky-foot] tfoot th, [mono-sticky-foot] tfoot td') ?? [],
    ).map((n) => n.getBoundingClientRect())
    const top = Math.max(view.top, ...heads.map((r) => r.bottom).filter((v) => v <= view.bottom))
    const bottom = Math.min(view.bottom, ...foots.map((r) => r.top).filter((v) => v >= view.top))
    if (cellBox.top < top + MARGIN) scroller.scrollTop -= top + MARGIN - cellBox.top
    else if (cellBox.bottom > bottom - MARGIN) scroller.scrollTop += cellBox.bottom - (bottom - MARGIN)
  }

  /** Which `[data-edit-cell]` holds the caret right now. */
  function activeEditorCell(fromEl?: EventTarget | null): HTMLElement | null {
    const from = fromEl as HTMLElement | null
    const byEvent = from?.closest?.('[data-edit-cell]') as HTMLElement | null
    if (byEvent) return byEvent
    const active = typeof document !== 'undefined' ? (document.activeElement as HTMLElement) : null
    return (active?.closest?.('[data-edit-cell]') as HTMLElement | null) ?? null
  }

  /**
   * Move the editor one cell and focus it. Clamps on both axes and returns
   * `false` when the move is blocked, so the caller can swallow the key without
   * anything happening — arrow navigation must NOT wrap around an edge. Only the
   * plain Tab tap passes `wrap`, which lets left/right cross into the
   * previous/next row in reading order (the long-standing Tab behaviour).
   */
  function moveEditor(
    dir: MonoEditorDirection,
    fromEl?: EventTarget | null,
    opts: { wrap?: boolean } = {},
  ): boolean {
    const rowKey = ctrl.editingKey
    if (rowKey == null) return false
    const cell = activeEditorCell(fromEl)
    const field = cell?.getAttribute('data-edit-cell')
    const cols = editableColumns()
    const colIdx = field ? cols.findIndex((c) => c.field === field) : -1
    const rowIdx = indexOfRowKey(rowKey)
    if (colIdx === -1 || rowIdx === -1 || !cols.length) return false

    const rows = ctrl.items as T[]
    const anchor = (cell ?? fromEl) as EventTarget | null

    if (dir === 'up' || dir === 'down') {
      const nextIdx = rowIdx + (dir === 'down' ? 1 : -1)
      const next = rows[nextIdx]
      if (!next) return false // first/last row — hard stop, never wraps
      const nextKey = rowKeyOf(next, nextIdx)
      beginEditRow(nextKey)
      // Same column: that's the whole point of the vertical move.
      focusRowCell(anchor, nextKey, 'first', { reveal: true, field: cols[colIdx].field })
      return true
    }

    const nextCol = colIdx + (dir === 'right' ? 1 : -1)
    if (nextCol >= 0 && nextCol < cols.length) {
      focusRowCell(anchor, rowKey, 'first', { reveal: true, field: cols[nextCol].field })
      return true
    }
    if (!opts.wrap) return false // row edge — arrows stop here

    const nextIdx = rowIdx + (dir === 'right' ? 1 : -1)
    const next = rows[nextIdx]
    if (!next) return false
    const nextKey = rowKeyOf(next, nextIdx)
    beginEditRow(nextKey)
    focusRowCell(anchor, nextKey, dir === 'right' ? 'first' : 'last', { reveal: true })
    return true
  }

  // --- Tab / Tab+Arrow navigation --------------------------------------------
  // Tab fires its move on KEYDOWN, so it has to be swallowed there — otherwise
  // focus has already jumped a cell right before the arrow that was meant to
  // redirect it even arrives. The plain-Tab move therefore runs on keyup, and
  // only when no arrow was pressed while Tab was held (`_tabConsumed`).
  //
  // This lives on `document` rather than in `editorKeydown` for two reasons: the
  // editors are consumer-authored and bind only `@keydown` (there is no keyup to
  // hook), and Tab's keyup can land on a different element than its keydown.
  // Lifecycle mirrors `installOutsideExit` / `removeOutsideExit`.
  const ARROW_DIRS: Record<string, MonoEditorDirection> = {
    ArrowLeft: 'left',
    ArrowRight: 'right',
    ArrowUp: 'up',
    ArrowDown: 'down',
  }
  let _editorKeys: { down: (e: Event) => void; up: (e: Event) => void } | null = null
  let _tabHeld = false
  let _tabConsumed = false
  let _tabShift = false

  /**
   * `Enter` opens the focused editor's popup — a `mono-select` list, a
   * `mono-dropdown-table` grid, a `mono-date` calendar, a `mono-tag-input`
   * suggestion panel. They all expose the same `open()`, so this stays generic
   * rather than switching on tag names; a plain `mono-input` simply has nothing
   * to open and the key does nothing. `Escape` is what leaves edit mode.
   *
   * Returns whether the key was handled here.
   */
  type MonoPopupEditor = HTMLElement & {
    open: () => void
    close?: () => void
    isOpen?: boolean
  }

  /**
   * The control inside `cell` that owns a popup. `data-edit-cell` usually sits on
   * the control itself, but allow a wrapper. Custom elements only, and `open`
   * must be a METHOD — `<details>` and `<dialog>` both carry a boolean `open`
   * property that isn't callable.
   */
  function popupEditorOf(cell: HTMLElement | null): MonoPopupEditor | null {
    if (!cell) return null
    const candidates: Element[] = [cell, ...Array.from(cell.querySelectorAll('*'))]
    return (
      (candidates.find(
        (el) =>
          el.tagName.includes('-') &&
          typeof (el as unknown as { open?: unknown }).open === 'function',
      ) as MonoPopupEditor | undefined) ?? null
    )
  }

  function openEditorPopup(cell: HTMLElement | null): boolean {
    const host = popupEditorOf(cell)
    if (!host) return false
    host.open()
    return true
  }

  /**
   * `Enter` / `Escape`, shared by the document-level machine and the per-editor
   * `editorKeydown` so the two modes behave identically. Returns whether the key
   * belonged to us.
   */
  function handleEditorActionKey(e: KeyboardEvent, cell: HTMLElement | null): boolean {
    if (e.key === 'Escape') {
      // Layered: close an open popup first, leave edit mode on the next press.
      // Without this the same key does different things per editor — a
      // mono-dropdown-table moves focus into its portaled panel (so the grid
      // never sees that Escape and only the panel closes), while a mono-select
      // keeps focus on the trigger and would close the panel AND end the edit.
      const host = popupEditorOf(cell)
      if (host?.isOpen && typeof host.close === 'function') {
        e.preventDefault()
        e.stopPropagation()
        host.close()
        return true
      }
      cancelEdit()
      return true
    }
    if (e.key !== 'Enter') return false
    // A textarea owns Enter — it's how you get a second line. Never swallow it.
    const active = e.target as HTMLElement | null
    if (active?.tagName === 'TEXTAREA' || active?.isContentEditable) return false

    const host = popupEditorOf(cell)
    // Already open? Then Enter belongs to the editor: it picks whatever its own
    // ↑/↓ highlighted. Enter only OPENS a closed popup.
    if (host?.isOpen) return false

    // Swallowed either way, so a grid inside a <form> can't be submitted by an
    // Enter meant for the editor (the behaviour before Enter opened popups).
    e.preventDefault()
    if (host) {
      // Stop it reaching the editor: `open()` flips the panel open synchronously,
      // so this very keypress would arrive at an editor that now considers itself
      // open and would immediately select its highlighted row — opening and
      // closing again in one press.
      e.stopPropagation()
      host.open()
    }
    return true
  }

  /**
   * The very last cell in the grid (or the very first, going back). Tab is left
   * alone there so a keyboard user can still leave the table — trapping focus in
   * the grid would be worse than losing Tab+Arrow from that one cell.
   */
  function atGridEdge(cell: HTMLElement, back: boolean): boolean {
    const cols = editableColumns()
    const colIdx = cols.findIndex((c) => c.field === cell.getAttribute('data-edit-cell'))
    const rowIdx = ctrl.editingKey != null ? indexOfRowKey(ctrl.editingKey) : -1
    if (colIdx === -1 || rowIdx === -1) return true // can't reason about it — don't trap
    return back
      ? colIdx === 0 && rowIdx === 0
      : colIdx === cols.length - 1 && rowIdx === (ctrl.items as T[]).length - 1
  }

  function installEditorKeys(): void {
    if (typeof document === 'undefined' || _editorKeys) return
    if (ctrl.editorNavKeys !== 'tab-arrows') return

    // Only act on keys raised from an editor in the row being edited — never on
    // a Tab inside a portaled popup (a mono-dropdown-table panel) or elsewhere.
    const editingCell = (e: KeyboardEvent): HTMLElement | null => {
      const key = ctrl.editingKey
      if (key == null) return null
      const cell = (e.target as HTMLElement | null)?.closest?.(
        '[data-edit-cell]',
      ) as HTMLElement | null
      return cell?.closest(`[data-row-key="${_cssEscape(key)}"]`) ? cell : null
    }

    const down = (evt: Event): void => {
      const e = evt as KeyboardEvent
      const cell = editingCell(e)
      if (!cell) return

      // Enter / Escape. Note the `editingCell` guard above means a key pressed
      // INSIDE an editor's portaled popup never reaches here — so Escape closes
      // just the popup (the component's own handler), and only a second Escape,
      // back on the cell, leaves edit mode.
      if (handleEditorActionKey(e, cell)) return

      if (e.key === 'Tab') {
        if (atGridEdge(cell, e.shiftKey)) {
          _tabHeld = false
          return // let native Tab carry focus out of the grid
        }
        e.preventDefault()
        // Auto-repeat while held is swallowed, so holding Tab yields exactly one
        // move on release rather than skating across the row.
        if (!e.repeat) {
          _tabHeld = true
          _tabConsumed = false
          _tabShift = e.shiftKey
        }
        return
      }

      if (!_tabHeld) return // plain arrows stay with the editor (caret / list / lines)
      const dir = ARROW_DIRS[e.key]
      if (!dir) return
      // Swallowed even when the move is blocked by an edge, so the caret doesn't
      // jump inside the editor as a consolation prize.
      e.preventDefault()
      _tabConsumed = true
      moveEditor(dir, e.target)
    }

    const up = (evt: Event): void => {
      const e = evt as KeyboardEvent
      if (e.key !== 'Tab' || !_tabHeld) return
      _tabHeld = false
      if (_tabConsumed) return // an arrow already redirected this press
      moveEditor(_tabShift ? 'left' : 'right', e.target, { wrap: true })
    }

    document.addEventListener('keydown', down, true)
    document.addEventListener('keyup', up, true)
    _editorKeys = { down, up }
  }

  function removeEditorKeys(): void {
    _tabHeld = false
    _tabConsumed = false
    if (!_editorKeys || typeof document === 'undefined') return
    document.removeEventListener('keydown', _editorKeys.down, true)
    document.removeEventListener('keyup', _editorKeys.up, true)
    _editorKeys = null
  }

  function editorKeydown(event: KeyboardEvent, rowKey: string, field: string): void {
    // In `tab-arrows` mode the document-level machine owns every key it handles
    // (Tab, the arrows, Enter and Escape) — acting here too would fire twice for
    // one press. Editors that don't bind this handler at all still get the full
    // behaviour from that machine.
    if (ctrl.editorNavKeys === 'tab-arrows') return

    if (event.key === 'Escape' || event.key === 'Enter') {
      const cell = (event.target as HTMLElement | null)?.closest?.(
        '[data-edit-cell]',
      ) as HTMLElement | null
      handleEditorActionKey(event, cell)
      return
    }
    if (event.key !== 'Tab') return

    const cols = editableColumns()
    const idx = cols.findIndex((c) => c.field === field)
    if (idx === -1) return
    const rowIdx = indexOfRowKey(rowKey)
    if (rowIdx === -1) return

    if (event.shiftKey) {
      if (idx > 0) return // native Tab moves to the previous editor in this row
      const prev = (ctrl.items as T[])[rowIdx - 1]
      if (!prev) return
      event.preventDefault()
      const prevKey = rowKeyOf(prev, rowIdx - 1)
      beginEditRow(prevKey)
      focusRowCell(event.target, prevKey, 'last', { reveal: true })
    } else {
      if (idx < cols.length - 1) return // native Tab moves to the next editor in this row
      const nextRow = (ctrl.items as T[])[rowIdx + 1]
      if (!nextRow) return
      event.preventDefault()
      const nextKey = rowKeyOf(nextRow, rowIdx + 1)
      beginEditRow(nextKey)
      focusRowCell(event.target, nextKey, 'first', { reveal: true })
    }
  }

  function toFields(group: string | string[] | null | undefined): string[] {
    if (!group) return []
    return (Array.isArray(group) ? group : [group]).filter(Boolean)
  }

  /**
   * Sort descriptor sent to the source. When grouping, the group fields lead
   * (so each fetched/sliced page holds contiguous, ordered groups); the active
   * column sort follows — applied to the group field itself if it is one.
   */
  function effectiveSort(): Array<{ selector: string; desc: boolean }> | null {
    // Every active key, in precedence order — `sorts[0]` first.
    const keys = ctrl.sorts.map((s) => ({ selector: s.field, desc: s.order === 'desc' }))

    if (!groupFields.length) {
      return keys.length ? keys : null
    }

    // Grouped: the group fields must LEAD so each fetched/sliced page holds
    // contiguous groups. A group field that is also sorted takes its direction
    // from the sort list; the remaining keys follow, still in precedence order.
    const list = groupFields.map((f) => ({
      selector: f,
      desc: keys.find((k) => k.selector === f)?.desc ?? false,
    }))
    for (const k of keys) {
      if (!groupFields.includes(k.selector)) list.push(k)
    }
    return list
  }

  /**
   * Push the merged sort onto the bound source — the column sort plus the base
   * sort as tiebreakers (see `mergedSort`). Remembers what it wrote so a sort the
   * consumer sets on the source afterwards can be told apart and adopted.
   */
  function applySourceSort(): void {
    const s = bound
    if (!s || typeof s.sort !== 'function') return
    s.sort(mergedSort())
    // Read BACK rather than remember the argument: `monoArraySource` stores a
    // normalised copy, and comparing against the argument would make the grid
    // mistake its own write for the consumer's on the next load.
    lastWrittenSort = s.sort() ?? null
  }

  // Notify subscribers on a microtask, coalescing multiple state changes in the
  // same tick into ONE callback. This is essential when an edit is triggered from
  // inside a web component's own event (e.g. `mono-input`'s change dispatched mid
  // Lit-render): a synchronous subscriber that re-renders the consumer's Vue tree
  // would reenter the in-flight patch and corrupt the DOM ("insertBefore, parent
  // is null"). Deferring past the current stack avoids the reentrancy.
  // The scheduling lives in `createNotifier`; `onFlush` runs inside the same
  // flush, before subscribers, so a template reading `state.th` re-renders in
  // the same tick the elements sync.
  const notifier = createNotifier({
    onFlush: () => {
      // `items` can be replaced by paths that notify WITHOUT rebuilding
      // displayRows, so re-derive the mapped view here — this is the one choke
      // point every notify passes through.
      syncMapped()
      if (opts.state) opts.state.value = propsSnapshot()
    },
  })
  const notify = notifier.notify

  const keyExpr = opts.keyExpr ?? 'Id'
  const rowKeyOf = (row: T, i: number): string =>
    String(
      (row as Record<symbol, unknown>)?.[MONO_ROW_KEY] ??
        (row as Record<string, unknown>)?.[keyExpr] ??
        i,
    )

  /**
   * Last-resort identity for a row we cannot place: stable per object, and never
   * equal to another row's. See `rowKey` for why "-1 for everyone" is not an option.
   */
  const orphanKeys = new WeakMap<object, string>()
  let orphanSeq = 0

  /**
   * Does the loaded row set actually carry `keyExpr`? Drives the drain + the warning.
   *
   * `ctrl.items` is not always rows. Once grouping is on it holds group NODES
   * (`{ key, items, count, level, path, … }`), and a node has none of the row's fields — so
   * sampling it would report every correctly-configured grouped table as misconfigured. Dig one
   * level down to the first group that actually has rows loaded instead; in server-group mode a
   * group's rows arrive only when it is on screen, so "no rows yet" means not-yet-known, not
   * missing, and takes the same benefit of the doubt as an empty ungrouped table.
   */
  function rowsHaveKeyExpr(): boolean {
    /** A group node, not a row — the shape `syncGrouped` / `renderServer` put in `ctrl.items`. */
    const isNode = (x: unknown): x is MonoGroupNode<T> =>
      !!x && typeof x === 'object' && Array.isArray((x as MonoGroupNode<T>).items)
        && 'path' in (x as object)

    /** First real row under `list`, descending as many group levels as there are. */
    const firstRow = (list: unknown[], depth = 0): unknown => {
      if (depth > 8) return undefined
      for (const entry of list) {
        if (!isNode(entry)) return entry
        const found = firstRow(entry.items ?? [], depth + 1)
        if (found != null) return found
      }
      return undefined
    }

    const sample = firstRow(ctrl.items as unknown[])

    if (sample == null || typeof sample !== 'object') return true // nothing loaded yet — assume ok
    return keyExpr in (sample as Record<string, unknown>)
  }

  let keyExprWarned = false
  /** Dev-only, once per controller: a wrong `keyExpr` otherwise fails completely silently. */
  function warnMissingKeyExpr(): void {
    if (keyExprWarned || ctrl.items.length === 0 || rowsHaveKeyExpr()) return
    keyExprWarned = true
    console.warn(
      `[mono-table] keyExpr "${keyExpr}" is not a property of the loaded rows`
        + `${opts.keyExpr ? '' : ' (nothing set one, so it defaulted to "Id")'}.`
        + ' Row keys fall back to identity, and a remote drain cannot $select it.'
        + ' Set `keyExpr` to the row key field.',
    )
  }

  /**
   * Public stable row key — prefers the `showForm` identity, else `keyExpr`.
   *
   * `unwrapReactive` first: Vue hands components a reactive PROXY of the row while
   * `ctrl.items` holds the raw object, so a bare `indexOf(proxy)` is always `-1`.
   * With `keyExpr` also missing that made EVERY row key `"-1"` — tick one row and
   * the whole grid reads as ticked. A row we still cannot place gets its own
   * WeakMap id rather than a shared sentinel, so two rows can never collide
   * whatever the config. A row with a real index keeps its index-derived key, so
   * array grids with no `keyExpr` are untouched.
   */
  function rowKey(row: T): string {
    const raw = unwrapReactive(row) as T
    const i = (ctrl.items as T[]).indexOf(raw)
    if (i >= 0) return rowKeyOf(raw, i)

    const direct = rowKeyOf(raw, Number.NaN)
    if (direct !== 'NaN') return direct

    warnMissingKeyExpr()
    const obj = raw as unknown as object
    if (obj == null || typeof obj !== 'object') return String(raw)
    let id = orphanKeys.get(obj)
    if (!id) {
      id = `mono-orphan:${(orphanSeq += 1)}`
      orphanKeys.set(obj, id)
    }
    return id
  }

  /** Columns that declare a per-column `map`, resolved once per mapping pass. */
  function mapColumns(): Array<{ field: string; map: (v: any, row: any, i: number) => unknown }> {
    const out: Array<{ field: string; map: (v: any, row: any, i: number) => unknown }> = []
    for (const c of elementProps.th ?? []) {
      if (c?.field && typeof c.map === 'function') out.push({ field: c.field, map: c.map })
    }
    return out
  }

  /** True when anything at all would transform a row (lets the fast path skip). */
  function hasMap(): boolean {
    return typeof opts.map === 'function' || mapColumns().length > 0
  }

  /** One column's `map`, for the header filter's value labels. */
  function columnMap(field: string): ((v: any, row: any, i: number) => unknown) | undefined {
    return mapColumns().find((c) => c.field === field)?.map
  }

  /**
   * Raw row → presentation row. The grid-level `map` builds the row, then each
   * column's `map` overwrites its own field — reading the RAW value, deliberately
   * not the grid map's output, so a column map behaves identically here and in the
   * header-filter list (which can only hand it a raw distinct value).
   *
   * Returns the SAME object when nothing is configured, so no-map tables allocate
   * nothing and `mapped === items` holds by reference.
   */
  function mapRow(row: T, index: number, cols = mapColumns()): any {
    const rowMap = typeof opts.map === 'function' ? opts.map : null
    if (!rowMap && cols.length === 0) return row
    let out: any = rowMap ? rowMap(row, index) : { ...(row as object) }
    // A row map returning a primitive/null can't carry column fields — respect it.
    if (cols.length && out && typeof out === 'object') {
      for (const c of cols) out[c.field] = c.map((row as any)?.[c.field], row, index)
    }
    return out
  }

  /** Recompute `ctrl.mapped` from `ctrl.items`. Cheap no-op without a map. */
  function syncMapped(): void {
    if (!hasMap()) {
      ctrl.mapped = ctrl.items as unknown as any[]
      return
    }
    const cols = mapColumns()
    ctrl.mapped = (ctrl.items as T[]).map((row, i) => mapRow(row, i, cols))
  }

  /** Flatten `ctrl.items` into the ready-to-render, keyed `displayRows` list. */
  function buildDisplayRows(): Array<MonoDisplayRow<T>> {
    const out: Array<MonoDisplayRow<T>> = []
    const cols = mapColumns()
    if (!isGrouped()) {
      ;(ctrl.items as T[]).forEach((row, i) =>
        out.push({
          key: `r:${rowKeyOf(row, i)}`,
          kind: 'row',
          level: 0,
          row,
          mapped: mapRow(row, i, cols),
        }),
      )
      return out
    }
    // A footer (per-group pager slot) only makes sense when rows are paged —
    // never in "all" mode (everything is already shown).
    const footerOn =
      !pageSizeAll && (serverMode() || defaultGroupRowPageSize > 0 || groupRowPaging.size > 0)
    const walk = (nodes: Array<MonoGroupNode<T>>): void => {
      for (const node of nodes) {
        out.push({ key: `g:${node.path}`, kind: 'group', level: node.level, node })
        if (node.collapsed) continue
        const children = node.items
        if (children.length > 0 && isGroupNode(children[0])) {
          walk(children as Array<MonoGroupNode<T>>)
        } else {
          ;(children as T[]).forEach((row, i) =>
            out.push({
              key: `r:${node.path}:${rowKeyOf(row, i)}`,
              kind: 'row',
              level: node.level + 1,
              row,
              mapped: mapRow(row, i, cols),
            }),
          )
          if (footerOn) out.push({ key: `f:${node.path}`, kind: 'footer', level: node.level, node })
        }
      }
    }
    walk(ctrl.items as unknown as Array<MonoGroupNode<T>>)
    return out
  }

  /** Rebuild `displayRows` from the current `items`, then notify subscribers. */
  function render(): void {
    ctrl.displayRows = buildDisplayRows()
    notify()
  }

  /** Build the full group tree from every matched row the source holds. */
  function fullGroups(): Array<MonoGroupNode<T>> {
    const raw = bound ? [...(bound.items?.() ?? [])] : []
    return buildGroups<T>(flattenLeaves<T>(raw), groupFields, collapsed)
  }

  /** Index every group node by path (full, unsliced) for `groupPageInfo`. */
  function indexPaths(nodes: Array<MonoGroupNode<T>>): void {
    for (const node of nodes) {
      pathIndex.set(node.path, node)
      if (node.items.length && isGroupNode(node.items[0])) {
        indexPaths(node.items as Array<MonoGroupNode<T>>)
      }
    }
  }

  /** Clone nodes, slicing each group's items to its registered group-page. */
  function toDisplay(nodes: Array<MonoGroupNode<T>>): Array<MonoGroupNode<T>> {
    return nodes.map((node) => {
      const childrenAreGroups = node.items.length > 0 && isGroupNode(node.items[0])
      let items: MonoGroupNode<T>['items'] = childrenAreGroups
        ? toDisplay(node.items as Array<MonoGroupNode<T>>)
        : node.items
      const pg = pageSizeAll ? null : groupRowPagingFor(node.path)
      if (pg) {
        const start = pg.pageIndex * pg.pageSize
        items = items.slice(start, start + pg.pageSize)
      }
      return { ...node, items }
    })
  }

  function syncGrouped(): void {
    const all = fullGroups()
    pathIndex.clear()
    indexPaths(all)

    const total = all.length
    const size = pageSizeAll ? Math.max(1, total) : Math.max(1, groupPageSize)
    const pageCount = Math.max(1, Math.ceil(total / size))
    if (groupPageIndex > pageCount - 1) groupPageIndex = pageCount - 1
    if (groupPageIndex < 0) groupPageIndex = 0

    const start = groupPageIndex * size
    ctrl.grouped = true
    ctrl.items = toDisplay(all.slice(start, start + size)) as unknown as T[]
    ctrl.totalCount = total
    ctrl.pageSize = size
    ctrl.pageSizeAll = pageSizeAll
    ctrl.pageIndex = groupPageIndex
    ctrl.pageCount = pageCount

    render()
  }

  // --- Server-side group paging ---------------------------------------------

  /** Effective row paging for a group in server mode (always has a size). */
  function serverRowPaging(path: string): { pageIndex: number; pageSize: number } {
    return (
      groupRowPagingFor(path) ?? {
        pageIndex: 0,
        pageSize: defaultGroupRowPageSize || groupPageSize,
      }
    )
  }

  /** Re-render from the in-memory group list + loaded row pages (no fetch). */
  function renderServer(): void {
    pathIndex.clear()
    const total = serverGroups.length
    const size = pageSizeAll ? Math.max(1, total) : Math.max(1, groupPageSize)
    const pageCount = Math.max(1, Math.ceil(total / size))
    if (groupPageIndex > pageCount - 1) groupPageIndex = pageCount - 1
    if (groupPageIndex < 0) groupPageIndex = 0

    const start = groupPageIndex * size
    const nodes = serverGroups.slice(start, start + size).map((meta) => {
      const path = String(meta.key)
      const node: MonoGroupNode<T> = {
        key: meta.key,
        items: collapsed.has(path) ? [] : groupRows.get(path) ?? [],
        count: meta.count,
        level: 0,
        path,
        collapsed: collapsed.has(path),
        meta,
      }
      pathIndex.set(path, node)
      return node
    })

    ctrl.grouped = true
    ctrl.items = nodes as unknown as T[]
    ctrl.totalCount = total
    ctrl.pageSize = size
    ctrl.pageSizeAll = pageSizeAll
    ctrl.pageIndex = groupPageIndex
    ctrl.pageCount = pageCount
    ctrl.loading = groupRowLoading.size > 0
    render()
  }

  /** Fetch a group's current page — or, in "all" mode, every row (chunked). */
  async function loadGroupRows(
    meta: MonoGroupMeta,
    pg: { pageIndex: number; pageSize: number },
    want: string,
  ): Promise<void> {
    if (!serverGroup) return
    const path = String(meta.key)
    groupRowLoading.add(path)
    renderServer()
    try {
      if (pageSizeAll) {
        // "All": pull the whole group in `chunkSize` chunks (capped backend OK).
        const acc: T[] = []
        for (let skip = 0; ; skip += chunkSize) {
          const chunk = await serverGroup.loadRows(meta.key, {
            skip,
            take: chunkSize,
            search: searchValue,
            ...serverCtx(),
          })
          acc.push(...((chunk ?? []) as T[]))
          if (!chunk || chunk.length < chunkSize || acc.length >= meta.count) break
          if (skip > 1e7) break // safety valve
        }
        groupRows.set(path, acc)
      } else {
        const rows = await serverGroup.loadRows(meta.key, {
          skip: pg.pageIndex * pg.pageSize,
          take: pg.pageSize,
          search: searchValue,
          ...serverCtx(),
        })
        groupRows.set(path, (rows ?? []) as T[])
      }
      groupRowsKey.set(path, want)
    } catch (err) {
      // Still swallowed — this runs under a `Promise.all` over every visible
      // group, so rethrowing would abandon the siblings too. But it is no longer
      // SILENT: until now a failed group page was indistinguishable from a group
      // that legitimately has no rows.
      captureError(err, 'groupRows')
    } finally {
      groupRowLoading.delete(path)
      renderServer()
    }
  }

  /** Fetch rows for every visible, expanded group missing its current page. */
  async function fetchVisibleRows(): Promise<void> {
    if (!serverGroup) return
    const size = pageSizeAll ? Math.max(1, serverGroups.length) : Math.max(1, groupPageSize)
    const start = groupPageIndex * size
    const visible = serverGroups.slice(start, start + size)
    const jobs: Array<Promise<void>> = []
    for (const meta of visible) {
      const path = String(meta.key)
      if (collapsed.has(path)) continue
      const pg = serverRowPaging(path)
      const want = pageSizeAll ? 'all' : `${pg.pageIndex}:${pg.pageSize}`
      if (groupRowsKey.get(path) === want || groupRowLoading.has(path)) continue
      jobs.push(loadGroupRows(meta, pg, want))
    }
    if (jobs.length) await Promise.all(jobs)
  }

  /** Reload the group list (cheap groupby), then the visible groups' rows. */
  async function loadGroupsServer(): Promise<void> {
    if (!serverGroup) return
    // Reached directly from the search / group setters as well as from `load()`,
    // so the base goes on here too (a no-op when `load()` already did it).
    if (bound) applyBase(bound)
    const seq = ++groupSeq
    ctrl.loading = true
    notify()
    let metas: MonoGroupMeta[] = []
    try {
      metas = (await serverGroup.loadGroups({ search: searchValue, ...serverCtx() })) ?? []
      clearError()
    } catch (err) {
      // Keep the empty list — `load()`/`reload()` resolve in server-group mode
      // and changing that would break every caller. Record it, though: an empty
      // group list and a failed one used to look exactly the same.
      captureError(err, 'group')
      metas = []
    }
    if (seq !== groupSeq) return // a newer reload superseded this one
    serverGroups = metas
    clearRowCaches()
    renderServer()
    await fetchVisibleRows()
  }

  /**
   * Republish `ctrl` from the bound source.
   *
   * `initial` marks the one call `bind()` makes for itself. Every OTHER call
   * happens because the source produced a result — a load, a search, a filter, a
   * sort, a page — so this is the funnel where `hasLoaded` latches, rather than
   * the `changed` handler: a source that resolves `load()` without emitting still
   * reaches here, and `bind()`'s own pass must NOT count, because reflecting
   * whatever a source already holds is not the same as having asked it for
   * anything.
   */
  function sync(initial = false): void {
    if (!initial) ctrl.hasLoaded = true
    // Cheap after the first call (latched) and the earliest point a real row set
    // exists — a wrong `keyExpr` is otherwise completely silent.
    warnMissingKeyExpr()
    if (serverMode()) {
      renderServer()
      return
    }
    if (isGrouped()) {
      syncGrouped()
      return
    }

    // Scroll paging (infinity / virtual): map the accumulator (+ window) → ctrl.
    if (scrollMode !== 'off') {
      syncScroll()
      return
    }

    // Ungrouped "all": show every accumulated row on a single page.
    if (pageSizeAll) {
      ctrl.grouped = false
      ctrl.items = allRows
      ctrl.pageIndex = 0
      ctrl.pageSize = allRows.length || 1
      ctrl.pageSizeAll = true
      ctrl.totalCount = allRows.length
      ctrl.pageCount = 1
      render()
      return
    }

    const s = bound
    const rawItems = s ? [...(s.items?.() ?? [])] : []
    const total = s?.totalCount?.()
    const pageSize = s?.pageSize?.() ?? rawItems.length
    const pageIndex = s?.pageIndex?.() ?? 0

    // devextreme returns -1 from totalCount() when `requireTotalCount` is off.
    const hasTotal = typeof total === 'number' && total >= 0

    ctrl.grouped = false
    ctrl.items = rawItems
    ctrl.pageIndex = pageIndex
    ctrl.pageSize = pageSize
    ctrl.pageSizeAll = false
    ctrl.totalCount = hasTotal ? total : rawItems.length

    if (hasTotal && pageSize > 0) {
      ctrl.pageCount = Math.max(1, Math.ceil(total / pageSize))
    } else if (s?.isLastPage?.()) {
      ctrl.pageCount = pageIndex + 1
    } else {
      ctrl.pageCount = pageIndex + 2
    }

    render()
  }

  function syncLoading(): void {
    ctrl.loading = bound?.isLoading?.() ?? false
    notify()
  }

  const onChanged = (): void => {
    if (suppressSync) return // accumulating "all" — ignore per-chunk echoes
    sync()
    // Data settled (load / search / filter / sort / page). The version gate makes
    // this a no-op on pure sort/paging and recomputes only when the set changed.
    void recomputeSummaries()
  }
  const onLoadingChanged = (): void => syncLoading()

  function detach(): void {
    if (!bound) return
    bound.off('changed', onChanged)
    bound.off('loadingChanged', onLoadingChanged)
    bound.off('loadError', onLoadingChanged)
    bound = null
    // A different source has its own history. Carrying the latch across would
    // report the NEXT source as loaded before it has been asked for anything.
    ctrl.hasLoaded = false
    // Same reasoning for the error: it belongs to the source that produced it.
    ctrl.error = null
  }

  function bind(next: MonoGridSource<T> | T[] | null): void {
    // A plain array is wrapped in an in-memory source so paging / search /
    // sort / filter all work client-side — no separate monoArraySource call.
    const source: MonoGridSource<T> | null = Array.isArray(next)
      ? monoArraySource<T>(next, {
          pageSize: opts.pageSize,
          keyExpr: opts.keyExpr,
          // Plain columns only: a source types `searchExpr` as `string | string[]`
          // and feeds it straight to `toODataClause`. Custom entries never leave
          // the controller — `controllerOwnsArraySearch()` keeps the search here.
          searchExpr: plainSearchColumns(searchFields()),
          group: groupFields,
        })
      : next

    if (bound === source) return
    detach()
    bound = source
    ;(ctrl as { dataSource: MonoGridSource<T> | null }).dataSource = source
    bumpSummary('data') // new source → new row set

    // The base starts as whatever the source already carries — the filter and
    // sort a consumer set at construction. Both are "the grid's last write" too,
    // so the first load does not adopt them a second time. The options key is
    // reset so the (possibly new) source gets the knobs pushed again; the grid's
    // own layers (explicit filter, column filters, search) are grid state and
    // survive a rebind, exactly as `columnFilters` always has.
    externalBase = source?.filter?.() ?? null
    lastWrittenFilter = externalBase
    lastComposed = undefined
    composeMemo = null
    lastWrittenSort = source?.sort?.() ?? null
    externalSort = normalizeSortList(lastWrittenSort)
    resolvedKey = null
    appliedKnobs.clear()

    if (!source) {
      sync(true)
      return
    }

    // The grid's own layers are typed by the source — an array source takes
    // predicates, a store takes arrays — so rebuild them for this one. Cheap when
    // nothing is active (no terms → no search expr).
    rebuildGridExpr()

    // Auto server-side grouping: a single-field group + a remote DataSource with
    // a `.store()` → lazily page groups & rows from the store (no callbacks).
    if (!opts.serverGroup && groupFields.length === 1 && typeof source.store === 'function') {
      serverGroup = storeGroupSource<T>(source, {
        groupField: groupFields[0],
        select: opts.select,
        // Server-group mode issues its own grouped query and never routes through
        // `remoteSearchExpr()`, so it takes the plain columns and IGNORES customs.
        searchExpr: plainSearchColumns(searchFields()),
        searchOperation: opts.searchOperation,
        groupSummary: opts.groupSummary,
      })
    }

    source.on('changed', onChanged)
    source.on('loadingChanged', onLoadingChanged)
    source.on('loadError', onLoadingChanged)
    // A page-size override (from `<mono-table-paging :size>`) set before bind wins
    // over the source's own pageSize (remember the source's own size to restore later).
    if (preferredPageSize != null) {
      const cur = source.pageSize?.()
      if (typeof cur === 'number' && cur > 0) sourcePageSize = cur
      source.pageSize?.(preferredPageSize)
    }
    // Order rows by the group fields so each page holds contiguous groups
    // (client mode). Server mode drives ordering through its own load options.
    if (groupFields.length && !serverMode()) applySourceSort()
    sync(true)
  }

  /**
   * Record a failed operation so something can render it.
   *
   * A FRESH object every time, never a reused one. `<mono-table-error>` dismisses
   * per failure rather than per message — it remembers the object it dismissed
   * and re-shows when a different one arrives — so two identical failures have to
   * be distinguishable, and object identity is the only thing that reliably is
   * (a store rejecting with the plain string `'Network error'` gives `===` values
   * for two entirely unrelated attempts).
   */
  function captureError(raw: unknown, source: MonoTableError['source']): void {
    const { message, status, detail } = describeError(raw, opts.errorMessages)
    ctrl.error = { raw, message, status, detail, source, at: Date.now() }
    // The rows on screen belong to the query that last SUCCEEDED — after a
    // rejected filter that is the previous scope, which is a lie under the error
    // bar. `clear()` empties them (and publishes); a select-all drain is not the
    // row set, so its failure leaves the table alone.
    if (errorMode === 'clear-list' && source !== 'selectAll') {
      clear()
      return
    }
    notify()
  }

  /**
   * Drop a recorded error because an operation just succeeded.
   *
   * Called at each operation's own success point rather than from the render
   * funnels (`sync` / `renderServer`), and that is not a stylistic choice:
   * `loadGroupsServer` calls `renderServer()` immediately AFTER its catch, so a
   * clear there would wipe the error it had just captured, every time.
   *
   * Guarded, so a table that has never failed does not publish a notify on every
   * successful load for a field nobody changed.
   */
  function clearError(): void {
    if (!ctrl.error) return
    ctrl.error = null
    notify()
  }

  async function runLoad(
    fn: () => PromiseLike<unknown> | unknown,
    source: MonoTableError['source'] = 'load',
  ): Promise<void> {
    if (!bound) return
    try {
      await Promise.resolve(fn())
      clearError()
    } catch (err) {
      // devextreme rejects a load that a newer load superseded — ignore those.
      // Deliberately BEFORE the capture: a superseded load is not a failure, and
      // reporting it would put an error bar over a table that is loading fine.
      if (isCanceled(err)) return
      captureError(err, source)
      // Still thrown. This only adds observation — a caller that awaits
      // `table.load()` keeps getting the rejection it has always got.
      throw err
    }
  }

  /**
   * Whether the source pages. Client group mode pages the groups in memory, so
   * it loads everything; otherwise `dataSourceOptions.paginate` decides, and the
   * default is to page — a flat table always did.
   */
  function sourcePaginate(): boolean {
    if (isGrouped()) return false
    return resolvedOpts.paginate ?? true
  }

  async function load(): Promise<void> {
    const s = bound
    // First, always: the base (options, an adopted consumer filter/sort) goes on
    // before ANY of the branches below reads the source, server-group included.
    // (A custom `serverGroup` can run with no bound source at all.)
    if (s) applyBase(s)
    if (serverMode()) {
      await loadGroupsServer()
      return
    }
    // Scroll modes re-seed the accumulator from page 0 (covers every setter that
    // funnels through load(): search / sort / filter / column-filter).
    if (scrollActive()) {
      await loadScrollPage(true)
      return
    }
    if (pageSizeAll && !isGrouped()) {
      await loadAllChunked()
      return
    }
    if (!s) return
    s.paginate?.(sourcePaginate())
    await runLoad(() => s.load())
  }

  async function reload(): Promise<void> {
    bumpSummary('data') // underlying data may have changed on the server
    const s = bound
    if (s) applyBase(s)
    if (serverMode()) {
      clearRowCaches()
      await loadGroupsServer()
      return
    }
    if (scrollActive()) {
      await loadScrollPage(true)
      return
    }
    if (pageSizeAll && !isGrouped()) {
      await loadAllChunked()
      return
    }
    if (!s) return
    s.paginate?.(sourcePaginate())
    await runLoad(() => (s.reload ? s.reload() : s.load()), 'reload')
  }

  function clear(): void {
    // Supersede whatever is on the wire: a loader that wakes up to a bumped token returns
    // without appending (see `loadScrollPage`), so a stale response cannot refill this.
    scrollToken++
    suppressSync = false
    accumulated = []
    allRows = []
    scrollNextPage = 0
    scrollHasMore = false
    vStart = vEnd = vPadTop = vPadBottom = 0
    serverGroups = []
    clearRowCaches()

    ctrl.items = []
    ctrl.loading = false
    ctrl.totalCount = 0
    ctrl.pageIndex = 0
    ctrl.pageCount = 1
    ctrl.loadedCount = 0
    ctrl.hasMore = false
    ctrl.virtualStart = ctrl.virtualEnd = 0
    ctrl.virtualPadTop = ctrl.virtualPadBottom = 0
    render()
  }

  async function setPage(pageIndex: number): Promise<void> {
    if (isGrouped()) {
      // Page the top-level groups — no full reload.
      groupPageIndex = Math.max(0, pageIndex)
      sync()
      if (serverMode()) await fetchVisibleRows() // lazily fetch the new groups' rows
      return
    }
    const s = bound
    if (!s) return
    s.pageIndex?.(Math.max(0, pageIndex))
    await load()
  }

  async function setPageSize(pageSize: number | 'all'): Promise<void> {
    const all = pageSize === 'all'
    pageSizeAll = all

    if (isGrouped()) {
      // "all" → one page of all groups; else N groups per page.
      if (!all) groupPageSize = Math.max(1, pageSize as number)
      groupPageIndex = 0
      sync()
      if (serverMode()) await fetchVisibleRows()
      return
    }

    const s = bound
    if (!s) return
    if (all) {
      await loadAllChunked()
      return
    }
    s.pageSize?.(pageSize as number)
    s.pageIndex?.(0)
    await load()
  }

  /**
   * Ungrouped "all": pull every row, in `chunkSize` requests, accumulate, and
   * show on one page. Works with a capped backend (e.g. 100 rows/request).
   */
  async function loadAllChunked(): Promise<void> {
    const s = bound
    if (!s) {
      allRows = []
      sync()
      return
    }
    suppressSync = true
    ctrl.loading = true
    notify()
    const acc: T[] = []
    try {
      // Base first, chunking after — `dataSourceOptions.pageSize` must not win
      // over the chunk size that makes "all" work against a capped backend.
      applyBase(s)
      s.paginate?.(true)
      s.pageSize?.(chunkSize)
      let page = 0
      for (;;) {
        s.pageIndex?.(page)
        await runLoad(() => s.load())
        const items = [...(s.items?.() ?? [])]
        acc.push(...items)
        const total = s.totalCount?.()
        const reachedTotal = typeof total === 'number' && total >= 0 && acc.length >= total
        const isLast = s.isLastPage?.() ?? items.length < chunkSize
        if (isLast || reachedTotal || items.length === 0) break
        page += 1
        if (page > 100000) break // safety valve
      }
    } finally {
      suppressSync = false
    }
    allRows = acc
    ctrl.loading = bound?.isLoading?.() ?? false
    sync()
  }

  // --- Scroll paging (infinity / virtual) ------------------------------------
  /** Scroll modes only apply to a flat (ungrouped, non-server) grid. */
  function scrollActive(): boolean {
    return scrollMode !== 'off' && !isGrouped() && !serverMode()
  }

  /** Map the accumulator (+ virtual window) onto `ctrl` and render. */
  function syncScroll(): void {
    const s = bound
    const total = s?.totalCount?.()
    const hasTotal = typeof total === 'number' && total >= 0
    ctrl.grouped = false
    ctrl.pageSizeAll = false
    ctrl.scrollMode = scrollMode
    ctrl.loading = s?.isLoading?.() ?? false
    ctrl.loadedCount = accumulated.length
    ctrl.hasMore = scrollHasMore
    ctrl.totalCount = hasTotal ? total : accumulated.length
    ctrl.pageIndex = 0
    ctrl.pageSize = accumulated.length || 1
    ctrl.pageCount = 1
    if (scrollMode === 'virtual') {
      const end = Math.min(Math.max(vStart, vEnd), accumulated.length)
      const start = Math.min(Math.max(0, vStart), end)
      ctrl.items = accumulated.slice(start, end)
      ctrl.virtualStart = start
      ctrl.virtualEnd = end
      ctrl.virtualPadTop = Math.max(0, vPadTop)
      ctrl.virtualPadBottom = Math.max(0, vPadBottom)
    } else {
      ctrl.items = accumulated
      ctrl.virtualStart = 0
      ctrl.virtualEnd = accumulated.length
      ctrl.virtualPadTop = 0
      ctrl.virtualPadBottom = 0
    }
    render()
  }

  /**
   * Load one source page and append it to the accumulator. `reset` clears the
   * accumulator and starts from page 0 (a fresh query / mode enable).
   *
   * Concurrency: every entry claims a `scrollToken`. Only the holder of the newest one may
   * append, advance the page counter or release the shared load flags -- a reset (filter change,
   * search, rebind) routinely lands while a `loadNext()` is still awaiting its page, and
   * `runLoad` swallows the cancellation that would otherwise stop the loser.
   */
  async function loadScrollPage(reset: boolean): Promise<void> {
    const s = bound
    if (!s) {
      accumulated = []
      scrollNextPage = 0
      scrollHasMore = false
      syncScroll()
      return
    }
    // Supersede whatever is in flight. Claimed BEFORE the reset below, so a loader that is
    // mid-await learns its accumulator was thrown away underneath it.
    const token = ++scrollToken
    const mine = () => token === scrollToken
    if (reset) {
      // A reset is a new query, so it takes the current base. An APPEND does not:
      // `loadNext()` fetches page N of the query already on screen, and reading a
      // changed getter here would splice rows of a different query under it.
      applyBase(s)
      accumulated = []
      scrollNextPage = 0
      vStart = vEnd = vPadTop = vPadBottom = 0
      // A reset is a NEW query: the previous query's rows must not sit on screen —
      // scrollable, pickable — while this one is on the wire. Publish the empty buffer
      // now; the `notify()` below carries it, together with `loading: true`. An APPEND
      // (`loadNext()`) is untouched: its rows are the query already on screen.
      ctrl.items = []
      ctrl.loadedCount = 0
      ctrl.hasMore = false
      ctrl.virtualStart = ctrl.virtualEnd = 0
      ctrl.virtualPadTop = ctrl.virtualPadBottom = 0
    }
    suppressSync = true
    ctrl.loading = true
    notify()
    try {
      s.paginate?.(true)
      // Remember the page we asked for: a reset can rewind scrollNextPage while we await.
      const page = scrollNextPage
      s.pageIndex?.(page)
      await runLoad(() => s.load())
      // runLoad SWALLOWS devextreme cancellation, so a superseded load resolves normally and
      // would fall through to the push below -- except s.items() now holds the WINNING load's
      // rows, so that push would duplicate them. This guard is the only thing preventing it.
      if (!mine()) return
      const rows = [...(s.items?.() ?? [])]
      accumulated.push(...rows)
      const total = s.totalCount?.()
      const size = s.pageSize?.() ?? rows.length
      const reachedTotal = typeof total === 'number' && total >= 0 && accumulated.length >= total
      const isLast = s.isLastPage?.() ?? rows.length < (size || 1)
      scrollHasMore = !(reachedTotal || isLast || rows.length === 0)
      scrollNextPage = page + 1
    } finally {
      // suppressSync and ctrl.loading are shared booleans: a superseded loader releasing them
      // would un-suppress and un-flag a load that is still running, and the pagers
      // !grid.loading guard would open mid-load.
      if (mine()) suppressSync = false
    }
    if (!mine()) return
    ctrl.loading = bound?.isLoading?.() ?? false
    syncScroll()
  }

  async function setScrollPaging(
    mode: 'off' | 'infinity' | 'virtual',
    opts: { reload?: boolean } = {},
  ): Promise<void> {
    const reload = opts.reload !== false
    if (mode !== 'off' && (isGrouped() || serverMode())) {
      if (typeof console !== 'undefined') {
        console.warn(
          `[mono-table] scroll paging ("${mode}") requires a flat (ungrouped) table; keeping standard paging.`,
        )
      }
      if (scrollMode !== 'off') {
        scrollMode = 'off'
        ctrl.scrollMode = 'off'
      }
      return
    }
    if (scrollMode === mode) return
    scrollMode = mode
    ctrl.scrollMode = mode

    if (mode === 'off') {
      // Teardown (`reload: false`): the caller is going away, so a fetch here is pure waste —
      // nothing will read the result. KEEP the accumulator: the commonest disconnect is not a
      // teardown at all but a MOVE (a dropdown panel being portaled into <body> on first open
      // disconnects and immediately reconnects its pager), and holding the rows lets the
      // reconnect below resume without touching the network.
      if (!reload) {
        syncScroll()
        return
      }
      accumulated = []
      await load() // back to classic paging (page 0)
      return
    }

    if (!bound) {
      syncScroll()
      return
    }

    // Re-entering a scroll mode with rows already buffered — the other half of the move described
    // above. The buffer is still valid (same bound source; a filter change routes through
    // `load()`, which resets it), so adopt it instead of re-fetching page 0.
    if (accumulated.length) {
      syncScroll()
      return
    }

    await loadScrollPage(true)
  }

  async function loadNext(): Promise<void> {
    if (!scrollActive() || !scrollHasMore || scrollLoading) return
    scrollLoading = true
    try {
      await loadScrollPage(false)
    } finally {
      scrollLoading = false
    }
  }

  function setVirtualWindow(start: number, end: number, padTop: number, padBottom: number): void {
    if (scrollMode !== 'virtual') return
    const ns = Math.max(0, Math.floor(start))
    const ne = Math.max(ns, Math.floor(end))
    const nt = Math.max(0, Math.round(padTop))
    const nb = Math.max(0, Math.round(padBottom))
    // Skip when unchanged — the element recomputes on every grid notify, so a
    // no-op setter must NOT re-notify (that would loop: notify→recompute→setter).
    if (ns === vStart && ne === vEnd && nt === vPadTop && nb === vPadBottom) return
    vStart = ns
    vEnd = ne
    vPadTop = nt
    vPadBottom = nb
    syncScroll()
  }

  async function setPreferredPageSize(pageSize: number | null): Promise<void> {
    const v = typeof pageSize === 'number' && pageSize > 0 ? Math.floor(pageSize) : null
    if (v === preferredPageSize) return
    const wasOverriding = preferredPageSize != null
    preferredPageSize = v
    const s = bound
    if (!s) return // stored; bind() re-applies it to the next source
    if (v != null) {
      // Remember the source's own size before the first override, to restore later.
      if (!wasOverriding) {
        const cur = s.pageSize?.()
        sourcePageSize = typeof cur === 'number' && cur > 0 ? cur : null
      }
      s.pageSize?.(v)
    } else {
      // Clearing the override restores the base: `dataSourceOptions.pageSize` when
      // one is set (it was the source's size before the override, by construction),
      // else whatever the source had of its own.
      const base = resolvedOpts.pageSize
      if (typeof base === 'number' && base > 0) s.pageSize?.(base)
      else if (sourcePageSize != null) s.pageSize?.(sourcePageSize)
      sourcePageSize = null
    }
    s.pageIndex?.(0)
    await load() // routes correctly: scroll → re-seed page 0, else classic reload
  }

  /**
   * Rows a `*` pattern resolves against. The full backing array when the source
   * has one (an in-memory source exposes `data()`), else the loaded page — which
   * is all a remote source can offer, and is enough to read the shape.
   */
  function searchSampleRows(): readonly unknown[] {
    return (bound?.data?.() as unknown[] | undefined) ?? (ctrl.items as unknown[]) ?? []
  }

  /**
   * searchExpr as a list of entries — plain column names, `{ field, custom }` and
   * `*` patterns resolved against the data. `textOnly` for a remote source, whose
   * `$filter` can only `contains` a string column.
   */
  function searchEntries(): MonoSearchExprEntry[] {
    return resolveSearchEntries(effectiveSearchFields(), {
      rows: searchSampleRows(),
      textOnly: hasStore(),
    })
  }
  /**
   * The entries an unbound term fans out over, or the single entry a
   * column-bound term targets. A bound field with no `searchExpr` entry keeps the
   * old behaviour and is treated as a plain column.
   */
  function entriesForTerm(
    field: string | undefined,
    all: MonoSearchExprEntry[],
  ): MonoSearchExprEntry[] {
    if (!field) return all
    return [searchEntryFor(searchFields(), field) ?? field]
  }
  /** Whether a remote search must bypass devextreme folding (a path/wildcard column). */
  function searchIsPath(): boolean {
    // Only a plain column can BE a path; a custom entry builds its own clause.
    return hasStore() && plainSearchColumns(searchFields()).some(isPath)
  }
  /** Current live search string, held when the controller owns the search filter (path mode). */
  let searchTerm: string | null = null

  /**
   * Remote OData search filter expr, built by the controller when a searchExpr
   * column is a path/wildcard (devextreme's own search folding can't emit `Job/Name`
   * navigation or `Nav/any(...)` lambdas). Returns `null` when folding handles it.
   */
  /** Join expressions with `and` / `or`, returning the lone one unwrapped. */
  function joinExprs(parts: unknown[], join: 'and' | 'or'): unknown {
    const kept = parts.filter((p) => p != null)
    if (!kept.length) return null
    if (kept.length === 1) return kept[0]
    const out: unknown[] = []
    kept.forEach((p, i) => {
      if (i) out.push(join)
      out.push(p)
    })
    return out
  }

  /**
   * Group the live terms by `field` — a term with no field covers every
   * `searchExpr` column. Preserves first-seen order so the emitted filter is
   * stable and diffable.
   */
  function groupedSearchTerms(): Array<{ field: string | undefined; values: string[] }> {
    const order: Array<string | undefined> = []
    const byField = new Map<string | undefined, string[]>()
    for (const t of ctrl.searchTerms) {
      const v = String(t?.value ?? '')
      if (!v) continue
      const key = t.field || undefined
      if (!byField.has(key)) {
        byField.set(key, [])
        order.push(key)
      }
      byField.get(key)!.push(v)
    }
    return order.map((field) => ({ field, values: byField.get(field)! }))
  }

  /**
   * Remote OData search filter built by the controller rather than devextreme's
   * own `searchValue` folding. Used when folding CAN'T express the search:
   *  - a `searchExpr` column is a path/wildcard (`Job/Name`, `Nav/any(...)`), or
   *  - there is more than one term, or any term is bound to a single column —
   *    devextreme's `searchValue` holds exactly one string across one column set.
   *
   * Shape: OR within a field, AND across fields.
   */
  function remoteSearchExpr(): unknown {
    const groups = groupedSearchTerms()
    if (!groups.length || !controllerOwnsSearch()) return null
    const op = (opts.searchOperation ?? 'contains') as string

    // Resolved once, not per group: a `*` pattern walks the sample rows.
    const all = searchEntries()

    const perGroup = groups.map((g) => {
      // A field-bound term searches only that column; an unbound one ORs across all.
      const entries = entriesForTerm(g.field, all)
      const clauses: unknown[] = []
      for (const value of g.values) {
        // A `custom` entry builds its own clause and may decline this term
        // (returning null), in which case its column simply drops out of the OR.
        const forValue = entries
          .map((e) =>
            typeof e === 'string'
              ? (toODataClause(e, op, value) as unknown)
              : customRemoteClause(e, value, op),
          )
          .filter((c) => c != null)
        const expr = joinExprs(forValue, 'or')
        if (expr != null) clauses.push(expr)
      }
      return joinExprs(clauses, 'or')
    })

    return joinExprs(perGroup, 'and')
  }

  /**
   * Whether the controller (not devextreme) must build the search filter. One
   * plain unbound term over plain columns can still ride devextreme's folding.
   */
  function controllerOwnsSearch(): boolean {
    const groups = groupedSearchTerms()
    if (!groups.length) return false
    if (!hasStore()) return false
    if (searchIsPath()) return true
    // A `custom` entry is unrepresentable as `searchValue` + `searchExpr`, so the
    // folding shortcut below must never be taken while one is configured — it
    // would silently search the custom column with `contains` instead.
    if (hasCustomSearch(effectiveSearchFields()) || hasWildcardSearch(effectiveSearchFields())) return true
    const single = groups.length === 1 && groups[0].values.length === 1
    return !(single && !groups[0].field)
  }

  /** Client-side equivalent: OR within a field, AND across fields. */
  function searchPredicate(): ((row: T) => boolean) | null {
    const groups = groupedSearchTerms()
    if (!groups.length) return null
    const op = (opts.searchOperation ?? 'contains') as string
    const matches = (row: T, col: string, needle: string): boolean => {
      const raw = isPath(col) ? getFieldValue(row, col) : (row as Record<string, unknown>)?.[col]
      const vals = Array.isArray(raw) ? raw : [raw]
      return vals.some((v) => {
        const s = String(v ?? '').toLowerCase()
        const n = needle.toLowerCase()
        if (op === 'startswith') return s.startsWith(n)
        if (op === 'endswith') return s.endsWith(n)
        if (op === '=' || op === 'equals') return s === n
        return s.includes(n)
      })
    }
    // Resolve ONCE, outside the row predicate: a `*` pattern samples the rows, and
    // doing that per row would be O(rows × fields) on every keystroke.
    const all = searchEntries()
    const perGroup = groups.map((g) => entriesForTerm(g.field, all))

    return (row: T) =>
      groups.every((g, i) => {
        const entries = perGroup[i]
        // An unbound term with no configured `searchExpr` has nothing to match
        // against — treat it as "no opinion" rather than filtering every row away.
        if (!entries.length) return true
        return g.values.some((needle) =>
          entries.some((e) => {
            if (typeof e === 'string') return matches(row, e, needle)
            // A custom entry compiles its clause to a predicate; declining this
            // term (null) just means its column doesn't match it.
            const pred = customPredicate(e, needle, op)
            return pred ? pred(row) : false
          }),
        )
      })
  }

  /**
   * Whether an ARRAY source needs the controller's predicate. One plain unbound
   * term can stay on the source's own `searchValue`/`searchExpr` — which matters
   * when `searchExpr` was configured on `monoArraySource` and not on the grid.
   */
  function controllerOwnsArraySearch(): boolean {
    const groups = groupedSearchTerms()
    if (!groups.length) return false
    // Same reason as `controllerOwnsSearch`: `monoArraySource`'s own search is a
    // plain `contains` over string columns and can't run a custom builder.
    if (hasCustomSearch(effectiveSearchFields()) || hasWildcardSearch(effectiveSearchFields())) return true
    const single = groups.length === 1 && groups[0].values.length === 1
    if (single && !groups[0].field) return false
    return true
  }

  /** Single-term shorthand — the classic search box. */
  async function setSearch(value: string): Promise<void> {
    await setSearchTerms(value ? [{ value }] : [])
  }

  /**
   * Replace the searched fields. `undefined`/`null` drops the override so the
   * `searchExpr` / `search-value` option takes over again.
   *
   * Only re-runs the query when a search is actually live — changing the fields
   * with an empty box has nothing to re-filter, and a needless `load()` would
   * make `<mono-table-search>` refetch on every connect.
   */
  async function setSearchExpr(expr: MonoSearchValue | undefined | null): Promise<void> {
    searchFieldsOverride = expr == null ? undefined : mergeSearchFields({ searchExpr: expr })
    if (!ctrl.searchTerms.length) {
      notify()
      return
    }
    await setSearchTerms(ctrl.searchTerms)
  }

  async function setSearchTerms(terms: MonoSearchTerm[]): Promise<void> {
    ctrl.searchTerms = (terms ?? []).filter((t) => t && String(t.value ?? '') !== '')
    groupPageIndex = 0 // jump back to the first group page on a new search
    bumpSummary('search') // search narrows the row set

    // Server-group mode keeps its single-string contract; join the terms so a
    // multi-term search at least degrades to a sensible query.
    if (serverMode()) {
      searchValue = ctrl.searchTerms.map((t) => t.value).join(' ') || null
      notify()
      await loadGroupsServer()
      return
    }

    const s = bound
    if (!s) return
    searchTerm = ctrl.searchTerms[0]?.value ?? null

    if (!hasStore()) {
      // Array source. Keep the source's own single-term search for the simple case
      // — a consumer may have configured `searchExpr` on `monoArraySource` and not
      // on the grid, and the controller's predicate would have nothing to match on.
      if (controllerOwnsArraySearch()) {
        s.searchValue?.(null)
      } else {
        s.searchOperation?.(opts.searchOperation ?? 'contains')
        if (searchFieldsConfigured()) s.searchExpr?.(plainSearchColumns(searchFields()))
        s.searchValue?.(searchTerm)
      }
      applyFilter()
    } else if (controllerOwnsSearch()) {
      // Paths/wildcards, several terms, or a column-bound term: devextreme's
      // `searchValue` can't express it, so disable folding and let
      // applyColumnFilters fold `remoteSearchExpr()` into `s.filter`.
      s.searchValue?.(null)
      applyFilter()
    } else {
      // One plain unbound term over plain columns — devextreme folds it itself.
      s.searchOperation?.(opts.searchOperation ?? 'contains')
      if (searchFieldsConfigured()) s.searchExpr?.(plainSearchColumns(searchFields()))
      s.searchValue?.(searchTerm)
      applyFilter()
    }

    s.pageIndex?.(0)
    notify()
    await load()
  }

  /**
   * The grid's explicit filter — ONE layer, not a replacement.
   *
   * This is what the slotted filter builder writes, and it used to be a bare
   * `s.filter(x)`: it replaced the consumer's own source filter, the column
   * filters and the search in one go, and the next keystroke then replaced IT
   * with the search alone. It is now composed like everything else — under the
   * base, beside the columns and the search — and `null` clears only this layer.
   * That is also why it is NOT the adopted external base: the builder's *Clear*
   * would otherwise wipe the scope the consumer set on the source.
   */
  async function setFilter(filter: unknown): Promise<void> {
    const s = bound
    if (!s) return
    bumpSummary('search') // filter narrows the row set
    // Array / client sources take a `(row) => boolean`, but a filter-builder emits
    // a devextreme array expression — compile it to a predicate for those sources.
    // Remote devextreme stores read the array directly.
    explicitFilter = hasStore() ? (filter ?? null) : compileOrPredicate(filter)
    applyFilter()
    groupPageIndex = 0
    await load()
  }

  // --- Per-column header filters ---------------------------------------------
  // Active selections per field. Combined into one source filter: OR within a
  // column's values, AND across columns. Only the right-click `Header Filter ›`
  // row lets more than one field in here — the funnel is single-column.
  const columnFilters = new Map<string, unknown[]>()
  /** The combine gesture, remembered — see `MonoSetColumnFilterOptions.sticky`. */
  let filterCombining = false

  /** Whether the bound source is a remote DataSource (has a devextreme store). */
  function hasStore(): boolean {
    return typeof bound?.store === 'function' && !!bound.store()
  }

  /**
   * OR-join a column's value clauses into a devextreme filter expression (path-aware).
   *
   * A value is normally a plain equality; a `{ from, to }` range (what the DATE
   * filter stores) becomes `[[f,'>=',from],'and',[f,'<',to]]` — half-open, so
   * a "March" range never touches April 1st 00:00:00.
   */
  function orClauses(field: string, values: unknown[]): unknown {
    // Each value → a devextreme triple (`['Job/Name','=',v]`) or, for a wildcard
    // path, a wrapped lambda group (`["Nav/any(d: d/Prop eq v)"]`).
    const clauses = values
      .map((v) => {
        if (isDateRange(v)) {
          const ge = toODataClause(field, '>=', v.from) as unknown
          const lt = toODataClause(field, '<', v.to) as unknown
          return ge && lt ? [ge, 'and', lt] : null
        }
        return toODataClause(field, '=', v) as unknown
      })
      .filter((c) => c != null)
    if (!clauses.length) return null
    if (clauses.length === 1) return clauses[0]
    const out: unknown[] = []
    clauses.forEach((c, i) => {
      if (i) out.push('or')
      out.push(c)
    })
    return out
  }

  /**
   * Rebuild the grid's OWN filter layers from the column filters and the
   * controller-owned search — `columnExpr` (columns only, what a server-group
   * source gets) and `gridExpr` (columns AND search, what the source gets).
   *
   * Only builds; it writes nothing. Until this was split out, the write was here
   * too, and it wrote THIS expression alone — so a filter the consumer had put on
   * the source was gone on the first search keystroke and "restored" to nothing
   * on clear. The write now goes through `writeFilter()`, which composes these on
   * top of the base.
   */
  /** The active column filters, optionally leaving one column out (its own panel). */
  function activeColumnFilters(except?: string): Array<[string, unknown[]]> {
    return [...columnFilters.entries()].filter(([f, v]) => v.length && f !== except)
  }

  /** Remote: the column filters as ONE devextreme expression — AND across columns, OR within. */
  function columnFilterExpr(except?: string): unknown {
    const cols = activeColumnFilters(except)
      .map(([f, v]) => orClauses(f, v))
      .filter((c) => c != null)
    if (!cols.length) return null
    if (cols.length === 1) return cols[0]
    const out: unknown[] = []
    cols.forEach((c, i) => {
      if (i) out.push('and')
      out.push(c)
    })
    return out
  }

  /**
   * Array / client: the same as a predicate. Path fields resolve nested/wildcard
   * values (wildcard = match any element).
   */
  function columnFilterPredicate(except?: string): RowPredicate | null {
    const active = activeColumnFilters(except)
    if (!active.length) return null
    return (row: T) =>
      active.every(([f, vals]) => {
        const raw = isPath(f) ? getFieldValue(row, f) : (row as Record<string, unknown>)?.[f]
        const rvals = Array.isArray(raw) ? raw : [raw]
        return rvals.some((rv) =>
          vals.some((v) => {
            if (isDateRange(v)) {
              // A date-filter range: the cell as a Date inside `[from, to)`.
              const d = parseDateValue(rv)
              if (!d) return false
              const from = v.from instanceof Date ? v.from : new Date(v.from)
              const to = v.to instanceof Date ? v.to : new Date(v.to)
              return inRange(d, { from, to })
            }
            return String(rv) === String(v)
          }),
        )
      })
  }

  function rebuildGridExpr(): void {
    if (hasStore()) {
      const expr = columnFilterExpr()
      columnExpr = expr
      // Fold in the controller-owned search filter (path/wildcard search) so column
      // filters AND the search combine into the single `s.filter` the store reads.
      gridExpr = andFilters(expr, remoteSearchExpr())
    } else {
      const colPred = columnFilterPredicate()
      // Only when the controller owns it (multi-term / column-bound); otherwise the
      // source's own `searchValue` is still doing the searching and adding the
      // predicate here would filter twice.
      const sPred = controllerOwnsArraySearch() ? (searchPredicate() as RowPredicate | null) : null
      columnExpr = colPred
      gridExpr = andPredicates(colPred, sPred)
    }
  }

  /**
   * A grid-driven filter change: search, column filter, `setFilter`. Adopts
   * anything the consumer changed on the source in the meantime, rebuilds the
   * grid's layers, writes the composed filter and goes back to page 0.
   */
  function applyFilter(): void {
    const s = bound
    if (!s) return
    syncExternalFilter(s)
    rebuildGridExpr()
    writeFilter(s)
    s.pageIndex?.(0)
  }

  async function setColumnFilter(
    field: string,
    values: unknown[] | null,
    options?: MonoSetColumnFilterOptions,
  ): Promise<void> {
    if (!field) return
    // Combine-vs-replace is decided PER CALL: the funnel icon replaces, the
    // right-click `Header Filter ›` row accumulates. Omitting it replaces,
    // mirroring `setSort`. The one thing the grid keeps is the GESTURE: a
    // `sticky` combine is remembered while anything stays filtered, and the
    // funnel asks for it (`columnFilterCombining`) — so a user who started
    // combining from the menu keeps combining with plain clicks.
    const multi = options?.multi === true
    if (!multi) columnFilters.clear()
    if (!values || !values.length) columnFilters.delete(field)
    else columnFilters.set(field, [...values])
    filterCombining = columnFilters.size > 0 && multi && (options?.sticky === true || filterCombining)
    groupPageIndex = 0
    bumpSummary('search') // column filter narrows the row set
    notify() // flip the header's active indicator immediately
    applyFilter()
    await load()
  }

  function columnFilter(field: string): unknown[] {
    return [...(columnFilters.get(field) ?? [])]
  }

  function columnFilterCombining(): boolean {
    return filterCombining
  }

  function filteredColumns(): string[] {
    return [...columnFilters.entries()].filter(([, v]) => v.length).map(([f]) => f)
  }

  // --- The base query -------------------------------------------------------
  //
  // Everything the grid sends is composed on top of a BASE it does not own:
  //
  //   optionsFilter   `dataSourceOptions` / `odataOptions` (read fresh per query)
  //   externalBase    whatever the consumer set on the source itself, `ds.filter(x)`
  //   explicitFilter  `setFilter()` — the slotted filter builder
  //   columnExpr      header column filters
  //   search          `remoteSearchExpr()` / `searchPredicate()`
  //
  // and the source's filter is ALWAYS `and(...)` of these, written through one
  // function that remembers what it wrote. That memory is what makes the second
  // layer work: before a write, the source's live filter is read, and if it is
  // not the reference the grid last wrote, the consumer changed it — it becomes
  // the new base. So the plain `ds.filter([...]); table.load()` a consumer has
  // always written keeps working, and now survives a search.
  //
  // Reference-stability is load-bearing, not tidiness. devextreme's `filter()`
  // setter resets `pageIndex` to 0, and the select-all drain memoises on the
  // filter's identity — so a load that rewrote an unchanged filter would send
  // `setPage(3)` back to page 0 and re-drain on every sort. `composeFilter()` is
  // memoised on the layer references and `writeFilter()` skips when the result
  // is what the source already holds.

  let dsOptionsSource: MaybeReactive<MonoDataSourceOptions> | undefined = opts.dataSourceOptions
  let odataOptionsSource: MaybeReactive<MonoOdataOptions> | undefined = opts.odataOptions
  /** The merged, normalised options as of the last resolve. */
  let resolvedOpts: MonoDataSourceOptions = {}
  /** Change key of `resolvedOpts` — `null` until the first resolve, which always counts. */
  let resolvedKey: string | null = null
  /** A function-valued `filter` cannot go through the key; compared by reference instead. */
  let optionsFilterRef: unknown = undefined
  let optionsFilter: unknown = null
  let optionsSort: MonoSourceSortEntry[] = []
  /** Knobs `applyBaseOptions` has written, so a knob that DISAPPEARS is cleared, not left behind. */
  const appliedKnobs = new Set<string>()
  let externalBase: unknown = null
  let explicitFilter: unknown = null
  let columnExpr: unknown = null
  let gridExpr: unknown = null
  /** What the source HELD after the grid's last write (read back — a source may normalise). */
  let lastWrittenFilter: unknown = null
  /** What the grid last composed and handed to the source. */
  let lastComposed: unknown = undefined
  let composeMemo: { o: unknown; e: unknown; x: unknown; g: unknown; out: unknown } | null = null
  let externalSort: MonoSourceSortEntry[] = []
  let lastWrittenSort: unknown = null
  let rawFilterWarned = false

  /** Array-source filter layer: a predicate as given, an array compiled, a raw OData string dropped. */
  function compileOrPredicate(filter: unknown): RowPredicate | null {
    if (filter == null) return null
    if (typeof filter === 'function') return filter as RowPredicate
    if (Array.isArray(filter) && filter.length === 1 && typeof filter[0] === 'string') {
      if (!rawFilterWarned) {
        rawFilterWarned = true
        console.warn('[monoDataGrid] a raw OData $filter string cannot filter an array source — ignored.')
      }
      return null
    }
    return compileFilterPredicate(filter)
  }

  /**
   * Re-read the two option bags. Returns whether anything changed since the last
   * resolve — the getters hand back a fresh object every time, so the comparison
   * is by content, not identity.
   */
  function resolveDsOptions(): boolean {
    const merged = resolveDataSourceOptions(dsOptionsSource, odataOptionsSource)
    const fnFilter = typeof merged.filter === 'function' ? merged.filter : undefined
    const key = dataSourceOptionsKey(merged)
    if (key === resolvedKey && fnFilter === optionsFilterRef) return false
    resolvedKey = key
    optionsFilterRef = fnFilter
    resolvedOpts = merged
    optionsFilter = hasStore() ? (merged.filter ?? null) : compileOrPredicate(merged.filter)
    optionsSort = normalizeSortList(merged.sort)
    return true
  }

  /**
   * Adopt a filter the consumer set on the source directly: anything the source
   * holds that is not what the grid last put there. One comparison is enough
   * because `writeFilter` records what the source HOLDS after a write, not what
   * was passed — so a source that ignores writes (a getter-only fake) reads back
   * as its own last write and is never adopted, and a source that normalises
   * compares against its normalised value.
   */
  function syncExternalFilter(s: MonoGridSource<T>): boolean {
    if (typeof s.filter !== 'function') return false
    const live = s.filter() ?? null
    if (live === lastWrittenFilter) return false
    externalBase = live
    return true
  }

  /** The same for `ds.sort(...)`. */
  function syncExternalSort(s: MonoGridSource<T>): boolean {
    if (typeof s.sort !== 'function') return false
    const live = s.sort() ?? null
    if (live === lastWrittenSort) return false
    lastWrittenSort = live
    externalSort = normalizeSortList(live)
    return true
  }

  /** options ∧ external ∧ explicit — everything under the grid's own layers. */
  function baseFilter(): unknown {
    return hasStore()
      ? andFilters(andFilters(optionsFilter, externalBase), explicitFilter)
      : andPredicates(
          optionsFilter as RowPredicate | null,
          externalBase as RowPredicate | null,
          explicitFilter as RowPredicate | null,
        )
  }

  /** What a server-group source gets: the base plus the column filters, NOT the search (it folds that itself). */
  function baseFilterWithColumns(): unknown {
    return hasStore()
      ? andFilters(baseFilter(), columnExpr)
      : andPredicates(baseFilter() as RowPredicate | null, columnExpr as RowPredicate | null)
  }

  function composeFilter(): unknown {
    const m = composeMemo
    if (m && m.o === optionsFilter && m.e === externalBase && m.x === explicitFilter && m.g === gridExpr) {
      return m.out
    }
    const out = hasStore()
      ? andFilters(baseFilter(), gridExpr)
      : andPredicates(baseFilter() as RowPredicate | null, gridExpr as RowPredicate | null)
    composeMemo = { o: optionsFilter, e: externalBase, x: explicitFilter, g: gridExpr, out }
    return out
  }

  /** Write the composed filter — only when it is not what the source already holds. */
  function writeFilter(s: MonoGridSource<T>): boolean {
    if (typeof s.filter !== 'function') return false
    const next = composeFilter()
    if (next === lastComposed && (s.filter() ?? null) === lastWrittenFilter) return false
    s.filter(next)
    lastComposed = next
    // Read back, as `applySourceSort` does — a source is free to normalise, and
    // what it HOLDS is what a later read has to be compared against.
    lastWrittenFilter = s.filter() ?? null
    return true
  }

  /**
   * The sort actually sent: the user's column sort first (it wins), then the
   * options' sort, then whatever the consumer set on the source — later entries
   * only for selectors not already sorted, so they act as tiebreakers. Clearing
   * the column sort therefore falls back to the base instead of to nothing.
   */
  function mergedSort(): MonoSourceSortEntry[] | null {
    let keys: MonoSourceSortEntry[] = effectiveSort() ?? []
    // Remote (OData) needs `Job/Name` navigation selectors; a wildcard/index path
    // can't be an `$orderby` selector, so drop it (with a warn) rather than emit
    // garbage. Array sources keep the logical path — `compareBy` resolves it.
    if (hasStore()) {
      keys = keys
        .map((s) => {
          if (!isPath(s.selector)) return s
          const selector = toODataSelector(s.selector)
          if (selector) return { ...s, selector }
          console.warn(`[monoDataGrid] sort: path "${s.selector}" is not an OData selector — skipped.`)
          return null
        })
        .filter((s): s is MonoSourceSortEntry => !!s)
    }
    const out = [...keys]
    for (const e of [...optionsSort, ...externalSort]) {
      if (!out.some((k) => k.selector === e.selector)) out.push({ selector: e.selector, desc: !!e.desc })
    }
    return out.length ? out : null
  }

  /** Push the non-filter knobs of `resolvedOpts` onto the source. Only called when they changed. */
  function applyBaseOptions(s: MonoGridSource<T>): void {
    const o = resolvedOpts
    const knob = (name: string, present: boolean, write: (clear: boolean) => void): void => {
      if (present) {
        write(false)
        appliedKnobs.add(name)
      } else if (appliedKnobs.has(name)) {
        write(true)
        appliedKnobs.delete(name)
      }
    }
    knob('select', o.select !== undefined, (clear) => s.select?.(clear ? null : toList(o.select) ?? null))
    knob('requireTotalCount', typeof o.requireTotalCount === 'boolean', (clear) =>
      s.requireTotalCount?.(clear ? false : !!o.requireTotalCount),
    )
    // Source-level search columns: only when the grid declares none of its own —
    // the grid's `searchExpr` is what `setSearchTerms` writes, and it must not be
    // fought over. Once written, `sourceDeclaresSearchFields()` sees it and leaves
    // the folding to the source.
    if (!searchFieldsConfigured()) {
      knob('searchExpr', o.searchExpr !== undefined, (clear) => s.searchExpr?.(clear ? null : o.searchExpr))
      knob('searchOperation', typeof o.searchOperation === 'string', (clear) =>
        s.searchOperation?.(clear ? 'contains' : String(o.searchOperation)),
      )
    }
    // `<mono-table-paging :size>` / `setPreferredPageSize` still win.
    if (preferredPageSize == null && typeof o.pageSize === 'number' && o.pageSize > 0) {
      s.pageSize?.(o.pageSize)
    }
    // `expand`, `customQueryParams` and any extra key have no accessor — they
    // live on devextreme's `_storeLoadOptions`, which `loadOptions()` hands back.
    const lo = typeof s.loadOptions === 'function' ? s.loadOptions() : null
    if (lo && typeof lo === 'object') {
      const extras = extraLoadOptions(o)
      for (const k of Object.keys(extras)) {
        knob(`lo:${k}`, extras[k] !== undefined, (clear) => {
          if (clear) delete lo[k]
          else lo[k] = extras[k]
        })
      }
      // Keys written on an earlier resolve that are gone now.
      for (const name of [...appliedKnobs]) {
        if (name.startsWith('lo:') && !(name.slice(3) in extras)) {
          delete lo[name.slice(3)]
          appliedKnobs.delete(name)
        }
      }
    }
    if (optionsSort.length || appliedKnobs.has('sort')) {
      applySourceSort()
      if (optionsSort.length) appliedKnobs.add('sort')
      else appliedKnobs.delete('sort')
    }
  }

  /**
   * The one call every load funnel makes first: re-read the options, adopt what
   * the consumer changed on the source, push the knobs, write the composed
   * filter. Never loads — the funnel does that — and writes nothing when nothing
   * moved, so a plain `setPage(n)` costs no filter write and keeps its page.
   */
  function applyBase(s: MonoGridSource<T>): boolean {
    const optChanged = resolveDsOptions()
    const extChanged = syncExternalFilter(s)
    const sortAdopted = syncExternalSort(s)
    if (optChanged) applyBaseOptions(s)
    else if (sortAdopted && (ctrl.sorts.length || optionsSort.length)) applySourceSort()
    if (optChanged || extChanged) {
      bumpSummary('search') // the row set is a different one
      groupPageIndex = 0
    }
    writeFilter(s)
    return optChanged || extChanged
  }

  /** The `MonoServerGroupCtx` for the current query. */
  function serverCtx(): Omit<MonoServerGroupCtx, 'search'> {
    const loadOptions: Record<string, unknown> = {}
    if (resolvedOpts.expand !== undefined) loadOptions.expand = resolvedOpts.expand
    if (resolvedOpts.customQueryParams !== undefined) loadOptions.customQueryParams = resolvedOpts.customQueryParams
    const filter = baseFilterWithColumns()
    const select = opts.select ?? toList(resolvedOpts.select)
    return {
      sort: mergedSort(),
      ...(filter != null ? { filter } : {}),
      ...(select ? { select } : {}),
      ...(Object.keys(loadOptions).length ? { loadOptions } : {}),
    }
  }

  async function setDataSourceOptions(next: MaybeReactive<MonoDataSourceOptions> | undefined): Promise<void> {
    dsOptionsSource = next
    await refresh()
  }

  async function setOdataOptions(next: MaybeReactive<MonoOdataOptions> | undefined): Promise<void> {
    odataOptionsSource = next
    await refresh()
  }

  async function refresh(): Promise<void> {
    const s = bound
    if (!s) return
    // `load()` runs `applyBase` itself (a no-op the second time); running it here
    // first is what lets this decide about the page — a changed base means a
    // different row set, and page 3 of the old one is nowhere to go.
    if (applyBase(s)) s.pageIndex?.(0)
    await load()
  }

  function resolvedDataSourceOptions(): Readonly<MonoDataSourceOptions> {
    return resolvedOpts
  }

  /** The panel's order: nulls first, numeric before lexical. Shared by both distinct paths. */
  function sortColumnValues(values: MonoColumnValue[]): MonoColumnValue[] {
    return values.sort((a, b) => {
      const av = a.value, bv = b.value
      if (av == null) return bv == null ? 0 : -1
      if (bv == null) return 1
      const an = Number(av), bn = Number(bv)
      if (!Number.isNaN(an) && !Number.isNaN(bn)) return an - bn
      return String(av).localeCompare(String(bv))
    })
  }

  /**
   * Distinct values as ONE `$apply=groupby((field),aggregate($count as count))`
   * request through the store, or `null` when that is not on.
   *
   * `null` — not `[]` — is the fallback signal, and it comes from four places:
   * the path switched off (`serverApply: false`, or a backend that already
   * rejected an `$apply` — the gate remembers), a wildcard path (there is no
   * selector to group by), a store that cannot carry an `$apply` at all (a
   * CustomStore — `loadApply` sends nothing) or a request that failed, and a
   * response that is not grouped (a server that ignored the clause hands back
   * plain entities, which have no `count`). An EMPTY grouped result is a real
   * answer (nothing in scope) and is returned as such.
   *
   * The request carries `$apply` and nothing else: `$select` beside `$apply` is
   * rejected by most servers, a sibling `$filter` would be applied a second time
   * (the base folds INSIDE the clause), and `$top` only if the column asked for
   * a cap. `loadApply` puts the clause INTO the url (`urlOverride` —
   * `customQueryParams` is quoted as a literal by devextreme and becomes a
   * function call on v4), so this rides the store's URL, `beforeSend` and auth
   * exactly as every other request does.
   */
  async function distinctViaApply(
    store: MonoGridStore,
    field: string,
    options: MonoHeaderFilterLoadOptions | undefined,
  ): Promise<MonoColumnValue[] | null> {
    if (applyGate.skip) return null
    if (parseFieldPath(field).hasWildcard) return null
    const selector = isPath(field) ? toODataSelector(field) : field
    if (!selector) return null

    const apply = `groupby((${selector}),aggregate($count as count))`
    const odataFilter = options?.filter != null ? summaryODataFilter(options.filter) : ''
    const clause = odataFilter ? `filter(${odataFilter})/${apply}` : apply
    const top = typeof options?.take === 'number' && options.take >= 0 ? options.take : undefined

    let rows: Array<Record<string, unknown>> | null
    try {
      rows = await loadApply(store, clause, { top })
    } catch (err) {
      applyGate.reject(err)
      return null
    }
    if (!rows) return null
    if (!rows.length) return []
    // Grouped rows are the key plus a numeric `count` and nothing else; entities
    // carry the rest of the record — a server either honoured `$apply` or it did not.
    const first = rows[0]
    if (!first || typeof first !== 'object' || typeof first.count !== 'number') return null
    if (!isRolledUp(rows, [field, 'count'])) return null

    const path = isPath(field)
    return sortColumnValues(
      rows.map((r) => ({
        value: path ? getFieldValue(r, field) : r[field],
        count: Number(r.count) || 0,
      })),
    )
  }

  /** Count occurrences of `field` across `rows` into a sorted `{value,count}[]`. */
  function distinctFromRows(rows: Array<Record<string, unknown>>, field: string): MonoColumnValue[] {
    const counts = new Map<unknown, number>()
    const bump = (v: unknown): void => {
      counts.set(v, (counts.get(v) ?? 0) + 1)
    }
    const path = isPath(field)
    for (const r of rows) {
      if (path) {
        const v = getFieldValue(r, field)
        if (Array.isArray(v)) v.forEach(bump) // wildcard path → flatten each element
        else bump(v)
      } else {
        bump(r?.[field])
      }
    }
    return sortColumnValues([...counts.entries()].map(([value, count]) => ({ value, count })))
  }

  async function distinctValues(
    field: string,
    options?: MonoHeaderFilterLoadOptions,
  ): Promise<MonoColumnValue[]> {
    if (!field) return []

    // The list is scoped by the BASE — the options, whatever the consumer set on
    // the source, `setFilter()` — because those are the only rows the user can
    // ever see, and a scoped grid offering values from outside its scope is
    // offering a filter that matches nothing. A column's own
    // `dataSourceOptions.filter` ANDs onto the base rather than replacing it.
    // Resolve here, not only in the load funnels: a panel opened before the
    // first load (or after the options changed) must see the current base.
    //
    // And, unless `headerFilterCascade: false`, by the OTHER columns' header
    // filters and the search — the rows on screen, so after Brand = "One" the
    // Product list holds that brand's products and nothing else (Excel's rule).
    // Never by this column's OWN filter: the panel is how that one changes, and
    // a value filtered out has to stay tickable. Both live here, in the one
    // `filter` every path downstream reads — the consumer resolver, the
    // `$apply` clause and the `$select` scan all inherit the scope.
    resolveDsOptions()
    if (bound) syncExternalFilter(bound)
    const base = baseFilter()
    const cascade = opts.headerFilterCascade !== false
    let filter: unknown
    if (hasStore()) {
      filter = andFilters(base, options?.filter ?? null)
      if (cascade) {
        // Controller-owned search is an expression of its own; a search the
        // source runs itself lives in its `searchValue`, read back as a filter.
        const search =
          remoteSearchExpr() ?? searchFilterOf(bound as unknown as ReadableDataSource) ?? null
        filter = andFilters(filter, andFilters(columnFilterExpr(field), search))
      }
    } else {
      filter = andPredicates(
        base as RowPredicate | null,
        typeof options?.filter === 'function' ? (options.filter as RowPredicate) : null,
      )
      if (cascade) {
        // `searchPredicate` is the client search whoever owns it; the list is
        // derived from the FULL backing data, so nothing is filtered twice.
        filter = andPredicates(
          andPredicates(filter as RowPredicate | null, columnFilterPredicate(field)),
          searchPredicate() as RowPredicate | null,
        )
      }
    }
    const scoped: MonoHeaderFilterLoadOptions | undefined =
      filter == null ? options : { ...(options ?? {}), filter }

    // 1. Consumer-supplied resolver — a fetcher of the consumer's own, a custom
    //    dialect, a cached lookup; it wins over the store path below. It receives the column's `dataSourceOptions` with the base folded in,
    //    plus the same in OData form: a resolver builds its own `$apply`, and an
    //    `$apply` never sees the DataSource's filter unless it is put in front.
    if (typeof opts.distinctValues === 'function') {
      const filter = hasStore() ? (scoped?.filter ?? null) : null
      const odataFilter = filter != null ? summaryODataFilter(filter) : ''
      const selector = isPath(field) ? (toODataSelector(field) ?? field) : field
      const apply = `groupby((${selector}),aggregate($count as count))`
      const ctx: MonoDistinctValuesContext = {
        filter,
        odataFilter,
        apply,
        applyWithFilter: odataFilter ? `filter(${odataFilter})/${apply}` : apply,
        source: bound,
      }
      const raw = (await opts.distinctValues(field, scoped, ctx)) ?? []
      return raw.map((r) => {
        const o = r as { value?: unknown; count?: unknown }
        return o && typeof o === 'object' && 'value' in o
          ? { value: o.value, count: Number(o.count ?? 0) || 0 }
          : { value: r, count: 0 }
      })
    }

    const s = bound

    // 2. Array / client source: derive from the full backing data. `select` is
    //    meaningless here (whole rows are already in memory), but a `filter`
    //    PREDICATE and `take` are cheap to honour.
    if (!hasStore()) {
      let rows = (s?.data?.() ?? ctrl.items) as Array<Record<string, unknown>>
      if (typeof scoped?.filter === 'function') {
        rows = rows.filter(scoped.filter as (row: Record<string, unknown>) => boolean)
      }
      if (typeof scoped?.take === 'number' && scoped.take >= 0) rows = rows.slice(0, scoped.take)
      return distinctFromRows(rows, field)
    }

    // 3. Remote store, no resolver: ONE `$apply=groupby` request through the
    //    source's own store — so it rides the store's URL, `beforeSend` and auth
    //    — and the server hands back a row per value with a real count. The
    //    base filter folds inside the clause.
    const store = s!.store!()!
    const grouped = await distinctViaApply(store, field, scoped)
    if (grouped) return grouped

    // 4. Fallback: a store that cannot carry `$apply` (a CustomStore), a backend
    //    that rejected it (remembered — the next panel comes straight here), or
    //    `serverApply: false`. Scan the column and derive distinct values
    //    client-side (counts reflect the scanned rows only). The request is
    //    `$select=<field>` plus the base `$filter` and NOTHING else by default —
    //    no `$top`/`$skip` — so it sees every row in scope; pass
    //    `dataSourceOptions.take` to cap a big table.
    const loadOpts: Record<string, unknown> = {}
    // For a path field, fetch full rows (a nav `$select` is unreliable / a wildcard
    // has no selector) and resolve values client-side via distinctFromRows.
    if (!isPath(field)) loadOpts.select = [field]
    // Consumer options win; `null`/`undefined` REMOVES a key rather than sending it.
    for (const [key, value] of Object.entries(scoped ?? {})) {
      if (value == null) delete loadOpts[key]
      else loadOpts[key] = value
    }
    const res = await store!.load(loadOpts)
    return distinctFromRows(storeRows(res) as Array<Record<string, unknown>>, field)
  }

  async function setData(next: T[]): Promise<void> {
    const s = bound as
      | (MonoGridSource<T> & { setData?: (n: T[]) => PromiseLike<T[]> | T[] })
      | null
    // Only array-backed sources can swap their rows; a remote DataSource has no
    // setData, so this is a no-op there. The source's reload fires `changed`,
    // which syncs the controller state.
    if (typeof s?.setData !== 'function') return
    bumpSummary('data') // rows replaced
    await runLoad(() => s.setData!(next))
    // Re-seed the scroll accumulator from the swapped-in rows.
    if (scrollActive()) await loadScrollPage(true)
  }

  /** The combine gesture, remembered — see `MonoSetSortOptions.sticky`. */
  let sortCombineMode = false

  function sortCombining(): boolean {
    return sortCombineMode
  }

  /** This column's direction, or null when it isn't part of the sort. */
  function sortOf(field: string): SortOrder {
    return ctrl.sorts.find((s) => s.field === field)?.order ?? null
  }

  /** 1-based precedence in `sorts`; `0` when the column isn't sorted. */
  function sortIndex(field: string): number {
    return ctrl.sorts.findIndex((s) => s.field === field) + 1
  }

  /**
   * The 1-based precedence a column DECLARED via `sort.index`, if any. Central
   * `props.th` config wins over the element's own `:sort.prop`, matching how every
   * other key resolves.
   */
  function declaredSortIndex(field: string): number | undefined {
    // `sort: true` is "sortable with defaults" — it carries no index.
    const fromProps = (elementProps.th ?? []).find((c) => c?.field === field)?.sort
    if (typeof fromProps === 'object' && typeof fromProps?.index === 'number') return fromProps.index
    for (const el of columnEls) {
      if (el.field === field && typeof el.sort === 'object' && typeof el.sort?.index === 'number') {
        return el.sort.index
      }
    }
    return undefined
  }

  /**
   * Re-order `sorts` so any column declaring `sort.index` sits at that slot.
   * Unindexed columns keep their click order and fill the remaining slots — the
   * comparator falls back to the current position, so the sort is stable.
   * No-ops (and allocates nothing) when no column declares an index.
   */
  function applyDeclaredSortOrder(): void {
    if (ctrl.sorts.length < 2) return
    const marked = ctrl.sorts.map((s, i) => ({ s, i, hint: declaredSortIndex(s.field) }))
    if (!marked.some((m) => typeof m.hint === 'number')) return
    marked.sort((a, b) => {
      const ah = a.hint ?? Number.POSITIVE_INFINITY
      const bh = b.hint ?? Number.POSITIVE_INFINITY
      return ah === bh ? a.i - b.i : ah - bh
    })
    ctrl.sorts = marked.map((m) => m.s)
  }

  /** Keep the single-value mirrors pointing at the primary key. */
  function syncPrimarySort(): void {
    ctrl.sortField = ctrl.sorts[0]?.field ?? null
    ctrl.sortOrder = ctrl.sorts[0]?.order ?? null
  }

  function clearSort(): Promise<void> {
    return setSort(null)
  }

  async function setSort(
    field: string | null,
    order?: SortOrder,
    options?: MonoSetSortOptions,
  ): Promise<void> {
    if (!field) {
      // `setSort(null)` clears everything.
      ctrl.sorts = []
      sortCombineMode = false
    } else {
      // Append-vs-replace is decided PER CALL: a column's sort arrow replaces, the
      // right-click `Sort ›` menu accumulates. Omitting it replaces — what every
      // pre-existing consumer call expects. The one thing the grid keeps is the
      // GESTURE: a `sticky` combine is remembered while anything stays sorted,
      // and the arrows ask for it (`sortCombining`).
      const multi = options?.multi === true
      const current = sortOf(field)
      // Resolve the next direction: explicit `order` wins (the header controls
      // pass one, already resolved through `nextOrder`); otherwise cycle
      // asc → desc → off for THIS column alone.
      const next: SortOrder =
        order !== undefined ? order : current === 'asc' ? 'desc' : current === 'desc' ? null : 'asc'

      if (!next) {
        // Cleared. Multi drops just this key and lets the rest renumber; single
        // owns the whole list, so cycling an arrow past `desc` empties the sort.
        ctrl.sorts = multi ? ctrl.sorts.filter((s) => s.field !== field) : []
      } else if (multi) {
        const at = ctrl.sorts.findIndex((s) => s.field === field)
        ctrl.sorts =
          at >= 0
            ? // Already sorted: change direction IN PLACE so precedence is stable
              // (re-picking a column must not promote it past the others).
              ctrl.sorts.map((s) => (s.field === field ? { field, order: next } : s))
            : // New column: append, so pick order is precedence order.
              [...ctrl.sorts, { field, order: next }]
      } else {
        // Single-key — this column becomes the entire sort.
        ctrl.sorts = [{ field, order: next }]
      }
      sortCombineMode = ctrl.sorts.length > 0 && multi && (options?.sticky === true || sortCombineMode)
    }

    applyDeclaredSortOrder() // honour any `sort.index` before deriving the primary
    syncPrimarySort()
    notify() // flip the header indicator immediately, before the load resolves
    groupPageIndex = 0

    if (serverMode()) {
      // Re-fetch each visible group's rows in the new order (groups stay by key).
      await loadGroupsServer()
      return
    }

    const s = bound
    if (!s) return
    // effectiveSort() keeps the group fields leading so grouped pages stay
    // contiguous; ungrouped, it's every active key in precedence order.
    applySourceSort()
    s.pageIndex?.(0)
    await load()
  }

  async function setGroup(group: string | string[] | null): Promise<void> {
    groupFields = toFields(group)
    ctrl.grouped = groupFields.length > 0
    collapsed.clear()
    groupRowPaging.clear() // paths change with the grouping — drop stale row paging
    groupPageIndex = 0

    if (serverMode()) {
      clearRowCaches()
      await loadGroupsServer()
      return
    }

    const s = bound
    if (!s) {
      sync()
      return
    }
    applySourceSort()
    s.pageIndex?.(0)
    await load()
  }

  function toggleGroup(target: MonoGroupNode<T> | string): void {
    const path = typeof target === 'string' ? target : target?.path
    if (!path) return
    if (collapsed.has(path)) collapsed.delete(path)
    else collapsed.add(path)
    sync() // rebuild with the new collapse state (no reload)
    if (serverMode()) void fetchVisibleRows() // an expanded group may need its rows
  }

  function isGroupCollapsed(path: string): boolean {
    return collapsed.has(path)
  }

  function expandAllGroups(): void {
    if (!collapsed.size) return
    collapsed.clear()
    sync()
    if (serverMode()) void fetchVisibleRows()
  }

  function collapseAllGroups(): void {
    if (!groupFields.length) return
    if (serverMode()) {
      for (const meta of serverGroups) collapsed.add(String(meta.key))
      sync()
      return
    }
    const raw = bound ? [...(bound.items?.() ?? [])] : []
    const tree = buildGroups(flattenLeaves(raw), groupFields)
    for (const path of collectGroupPaths(tree)) collapsed.add(path)
    sync()
  }

  function setGroupPageSize(path: string, pageSize: number): void {
    if (!path) return
    const size = Math.max(1, Math.floor(pageSize) || 1)
    const cur = groupRowPaging.get(path)
    // Re-registering with the same size is a no-op (avoids render loops).
    if (cur && cur.pageSize === size) return
    groupRowPaging.set(path, { pageIndex: 0, pageSize: size })
    if (serverMode()) {
      groupRowsKey.delete(path) // size changed → its loaded page is stale
      sync()
      void fetchVisibleRows()
      return
    }
    sync()
  }

  function setGroupPage(path: string, pageIndex: number): void {
    if (!path) return
    const cur = groupRowPaging.get(path)
    const pageSize = cur?.pageSize ?? (defaultGroupRowPageSize || groupPageSize)
    groupRowPaging.set(path, { pageIndex: Math.max(0, pageIndex), pageSize })
    if (serverMode()) {
      groupRowsKey.delete(path) // page changed → fetch the new slice
      sync()
      void fetchVisibleRows()
      return
    }
    sync()
  }

  function clearGroupPaging(path: string): void {
    if (groupRowPaging.delete(path)) {
      if (serverMode()) {
        groupRowsKey.delete(path)
        sync()
        void fetchVisibleRows()
      } else {
        sync()
      }
    }
  }

  function groupPageInfo(path: string): GroupPageInfo {
    if (pageSizeAll) {
      // Everything is shown — one page, no per-group pager.
      const node = pathIndex.get(path)
      const total = serverMode()
        ? serverGroups.find((g) => String(g.key) === path)?.count ?? 0
        : node?.items.length ?? 0
      return { pageIndex: 0, pageCount: 1, pageSize: Math.max(1, total), total }
    }
    if (serverMode()) {
      const meta = serverGroups.find((g) => String(g.key) === path)
      const total = meta?.count ?? 0
      const pg = groupRowPagingFor(path)
      const pageSize = Math.max(1, pg?.pageSize ?? (defaultGroupRowPageSize || total || 1))
      const pageCount = Math.max(1, Math.ceil(total / pageSize))
      const pageIndex = Math.min(Math.max(0, pg?.pageIndex ?? 0), pageCount - 1)
      return { pageIndex, pageCount, pageSize, total }
    }
    const node = pathIndex.get(path)
    const total = node ? node.items.length : 0
    const pg = groupRowPagingFor(path)
    const pageSize = Math.max(1, pg?.pageSize ?? total ?? 1)
    const pageCount = Math.max(1, Math.ceil(total / pageSize))
    const pageIndex = Math.min(Math.max(0, pg?.pageIndex ?? 0), pageCount - 1)
    return { pageIndex, pageCount, pageSize, total }
  }

  function groupNode(path: string): MonoGroupNode<T> | undefined {
    return pathIndex.get(path)
  }

  // --- Reading the full result set + report export ----------------------------

  /**
   * Every row matching the current query, without disturbing what's on screen.
   *
   * The chunked read itself lives in `readAllRows` (shared with the report
   * engine's `data` resolver), which also reconstructs the DataSource's active
   * **search** — `searchValue` is a DataSource-level option the store knows
   * nothing about, so reading the store directly would otherwise hand back rows
   * the user filtered away.
   *
   * `suppressSync` wraps the call because an array-backed source has to be
   * re-paged to be read: the detour fires `changed`, and subscribers must not
   * see the intermediate full-list state.
   */
  async function getData(): Promise<T[]> {
    const s = bound
    if (!s) return []
    suppressSync = true
    try {
      return await readAllRows<T>(s, {
        chunkSize,
        select: opts.select ?? toList(resolvedOpts.select),
        // Passed explicitly: in server-group mode the controller never pushes
        // the sort onto the source, so `source.sort()` would be empty and the
        // export would come back unordered.
        sort: mergedSort(),
      })
    } finally {
      suppressSync = false
    }
  }

  /**
   * Group `rows` (or everything {@link getData} returns) by the grid's own
   * group fields. Named `buildGroupTree` internally so it doesn't shadow the
   * imported `buildGroups` helper that `syncGrouped` and friends rely on.
   */
  async function buildGroupTree(rows?: T[]): Promise<Array<MonoGroupNode<T>>> {
    if (!groupFields.length) return []
    const source = rows ?? (await getData())
    return buildGroups<T>(source, groupFields)
  }

  async function importSheet(options: MonoImportOptions<T>): Promise<MonoImportResult<T>> {
    // Lazy, like the report engine: keeps the parser (and exceljs) out of the
    // main bundle and off the SSR path.
    const { importTable } = await import('../../import/index')
    return importTable<T>(options, {
      getData,
      rowKeyOf,
      serverKeyOf: (row) =>
        (row as Record<string, unknown>)?.[keyExpr] ?? rowKeyOf(row, -1),
      // Written straight into `pending` rather than through `stageCell` per
      // cell: a sheet can carry thousands of changes, and `stageCell` also
      // clears the import mark it is about to set.
      stageImported: (changes) => {
        for (const change of changes) {
          const patch = pending.get(change.rowKey) ?? {}
          Object.assign(patch, change.patch)
          pending.set(change.rowKey, patch)
          markImported(change.rowKey, Object.keys(change.patch))
        }
        notify()
      },
    })
  }

  async function exportReport(options: MonoExportOptions): Promise<MonoExportResult> {
    // Loaded on demand: this is what keeps handlebars/remark/exceljs out of the
    // main bundle and off the SSR path. The template context is exactly
    // `options.data` — the grid injects nothing.
    const { exportTable } = await import('../../export/index')
    return exportTable(options)
  }

  // A function declaration, not a const: the controller object literal above
  // references it before this point and relies on hoisting.
  function subscribe(cb: () => void): () => void {
    return notifier.subscribe(cb)
  }

  function dispose(): void {
    detach()
    removeOutsideExit()
    unbindRowTrigger()
    clearRowCaches()
    formOps.length = 0
    formHandle = null
    ctrl.filterBuilder?.dispose()
    notifier.clear()
  }

  if (ds) bind(ds)

  return ctrl
}
