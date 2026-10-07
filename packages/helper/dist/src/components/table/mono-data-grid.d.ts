import { MonoDataSource } from '../../composables/data-source-controller';
import { MonoErrorMessages } from '../../utils/normalize-error';
import { MonoGroupNode } from './grouping';
import { MonoDateLevel } from './date-filter-tree';
import { MonoExportOptions, MonoExportResult } from '../../export/types';
import { MonoImportOptions, MonoImportResult } from '../../import/types';
import { MonoEventProps } from '../../composables/element-props';
import { TableDetailEvents } from './mono-table-detail-core';
import { TableCheckboxEvents } from './mono-table-checkbox-core';
import { TableEmptyEvents } from './mono-table-empty-core';
import { TableErrorEvents } from './mono-table-error-core';
import { MaybeReactive } from '../../composables/reactive';
import { MonoDataSourceOptions, MonoOdataOptions } from '../../utils/data-source-options';
import { MonoSearchExprEntry } from '../../search/search-expr.js';
import { MonoSearchFieldsAliases, MonoSearchValue } from '../../search/data-search.js';
import { MonoFilterBuilderOptions, MonoFilterController } from '../filter/filter-types';
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
    load(options?: unknown): PromiseLike<unknown>;
    update?(key: unknown, values: Record<string, unknown>): PromiseLike<unknown> | unknown;
    insert?(values: Record<string, unknown>): PromiseLike<unknown> | unknown;
    remove?(key: unknown): PromiseLike<unknown> | unknown;
    byKey?(key: unknown): PromiseLike<unknown> | unknown;
    key?(): string | string[] | undefined;
    /** OData protocol version (a devextreme `ODataStore`); absent on a CustomStore. */
    version?(): number;
    /** Optimistic client-side change notification (real devextreme store). */
    push?(changes: MonoStorePush[]): void;
}
export interface MonoGridSource<T = any> extends MonoDataSource<T> {
    reload?: () => PromiseLike<T[]> | T[];
    filter?(value?: unknown): unknown;
    searchValue?(value?: unknown): unknown;
    searchOperation?(op?: string): string;
    searchExpr?(expr?: unknown): unknown;
    sort?(value?: unknown): unknown;
    /** `$select` — devextreme's accessor (`undefined` READS; clear with `null`). */
    select?(value?: unknown): unknown;
    requireTotalCount?(value?: boolean): unknown;
    /**
     * devextreme's live `_storeLoadOptions` object. `expand` and `customQueryParams`
     * have no accessor of their own — an ODataStore declares them as custom load
     * options — so this is the only way to set them after construction.
     */
    loadOptions?(): Record<string, unknown>;
    pageCount?: () => number;
    /** devextreme DataSource's underlying store — server-side group paging + writes. */
    store?(): MonoGridStore | undefined;
    /** Full backing array (array sources only) — used to derive header-filter values client-side. */
    data?(): T[];
}
/** Sort direction (`null` = unsorted). */
export type SortOrder = 'asc' | 'desc' | null;
/** Per-column sort config declared on a `mono-table-th` (`:sort.prop`). */
/**
 * One key in the grid's active sort. The controller keeps these in **precedence
 * order** (`sorts[0]` is primary), which is the order they reach the source and,
 * for a remote store, the order of the emitted `$orderby`.
 */
export interface MonoSortEntry {
    field: string;
    order: 'asc' | 'desc';
}
/** Per-call mode for {@link MonoTableController.setColumnFilter}. */
export interface MonoSetColumnFilterOptions {
    /**
     * Keep the other columns' filters. `false` *(default)* — this column becomes the
     * ONLY filtered one, which is what the funnel icon does. `true` combines across
     * columns (AND between them, OR within one) — what the header's right-click
     * `Header Filter ›` row does, and the only way to filter two columns at once.
     */
    multi?: boolean;
    /**
     * This write is the COMBINE GESTURE (the right-click `Header Filter ›` row):
     * remember it, so that until nothing is filtered any more the funnel icon
     * combines too — a user who started combining means to keep combining. A
     * replace (`multi: false`) or an emptied filter forgets it. Read back with
     * `columnFilterCombining()`. Only meaningful with `multi: true`.
     */
    sticky?: boolean;
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
    multi?: boolean;
    /**
     * This write is the COMBINE GESTURE (the right-click `Sort ›` menu): remember
     * it, so that until nothing is sorted any more the sort arrow appends too. A
     * replace (`multi: false`) or an emptied sort forgets it. Read back with
     * `sortCombining()`. Only meaningful with `multi: true` — a seeded default
     * sort passes `multi` without it, since it is not a gesture.
     */
    sticky?: boolean;
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
    enable?: boolean;
    /**
     * Initial direction, seeded once when the column registers. Omit = unsorted.
     * Several columns may each seed one — they combine, in registration order
     * unless `index` pins them.
     */
    order?: 'asc' | 'desc';
    /**
     * **1-based** sort precedence. `index: 1` makes this column the primary key,
     * `index: 2` the secondary, and so on — whenever it is part of the sort, whether
     * it got there from `order` or from a click.
     *
     * Columns without an `index` keep their click order and fill the slots after
     * every indexed one. Gaps and duplicates are fine: the numbers only decide
     * relative order, so `index: 10` simply sorts after `index: 2`.
     */
    index?: number;
    /** Cycle `asc ↔ desc` only (never clears). */
    noClear?: boolean;
    /** Sortable UI is shown but inert. */
    disabled?: boolean;
    /**
     * Show the sort arrow beside the caption. Default `true`.
     *
     * The arrow is the single-sort click target, so hiding it moves that trigger
     * back onto the **caption** — the column stays sortable, it just loses the
     * glyph. Right-click still opens the header menu either way, and the `<sup>`
     * precedence badge renders either way.
     */
    showIcon?: boolean;
}
/** Devextreme load options for a header filter's DISTINCT-values request. */
export interface MonoHeaderFilterLoadOptions {
    /** Columns to fetch. Defaults to `[field]`; pass `null`/`[]` to send none. */
    select?: string | string[] | null;
    /** Extra devextreme filter expression. Default: none. */
    filter?: unknown;
    sort?: unknown;
    /** `$top`. Default: **none** — the request is uncapped. */
    take?: number | null;
    /** `$skip`. Default: none. */
    skip?: number | null;
    requireTotalCount?: boolean;
    [key: string]: unknown;
}
/**
 * Header-filter config for a column. `headerFilter: true` is shorthand for all of
 * these defaults.
 */
export interface MonoHeaderFilter {
    /** Whether the filter is active. Defaults to `true` when an object is given. */
    enable?: boolean;
    /** Panel heading. Default `Filter: <caption or field>`. */
    title?: string;
    /**
     * Show the funnel icon left of the caption. Default `true`. The funnel opens the
     * value panel directly; right-click the header reaches it via the menu's
     * `Header Filter ›` row either way, so hiding the icon never strands it.
     */
    showIcon?: boolean;
    /**
     * Shapes the DISTINCT-values request. Defaults to `{ select: [field] }` only —
     * no `$filter`, no `$top`, no `$skip`, so an uncapped column scan. Set `take`
     * to cap it on a large table.
     */
    dataSourceOptions?: MonoHeaderFilterLoadOptions;
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
    enable?: boolean;
    /** Panel heading. Default `Filter: <caption or field>`. */
    title?: string;
    /** Show the funnel icon left of the caption. Default `true`. */
    showIcon?: boolean;
    /** Deepest tree level. Default `'month'`; `'day'` for a date-only column, `'second'` for the full drill-down. */
    depth?: MonoDateLevel;
    /** Read the year/month/… parts in UTC rather than local time. Default `false`. */
    utc?: boolean;
    /** BCP-47 tag for the month and weekday names. Default: the browser's. */
    locale?: string;
    /**
     * Shapes the DISTINCT-values request, exactly as `headerFilter.dataSourceOptions`
     * — set `take` to cap a huge datetime column (one value per distinct timestamp).
     */
    dataSourceOptions?: MonoHeaderFilterLoadOptions;
}
export type { MonoDateLevel, MonoDateRange } from './date-filter-tree';
export { isDateRange } from './date-filter-tree';
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
    filter: unknown;
    /** `filter` as an OData string, or `''` when there is none. */
    odataFilter: string;
    /** `groupby((<field>),aggregate($count as count))` — no filter applied. */
    apply: string;
    /** `filter(<odataFilter>)/groupby(…)` — or just the groupby when there is no filter. */
    applyWithFilter: string;
    /** The bound source, for a resolver that needs its store or url. */
    source: unknown;
}
export type { MonoDataSourceOptions, MonoOdataOptions, MonoSourceSortEntry, } from '../../utils/data-source-options';
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
    field: string;
    caption?: string;
    /**
     * Sortable config for both the `th` and a `<mono-table-sort field=…>`.
     * `true` = sortable with every default (the same as `{}`, which still works);
     * an object tunes it — see {@link MonoColumnSort}. `false` / omitted = not sortable.
     */
    sort?: boolean | (MonoColumnSort & {
        disabled?: boolean;
        noClear?: boolean;
        caption?: string;
    });
    /** Aggregate for a `<mono-table-summary field=…>`; also registered as a spec. */
    summary?: Omit<MonoSummarySpec, 'field'>;
    editable?: boolean;
    editableTrigger?: MonoEditableTrigger;
    /**
     * Draw a red `*` after this column's caption, so a user can see which columns
     * want input. Presentation only: `editable` is what opens an editor.
     */
    required?: boolean;
    /** `true` for the defaults, or an object to set the title / icon / query. */
    headerFilter?: boolean | MonoHeaderFilter;
    /**
     * A header filter for a DATE column: the panel is a year → … → second tree.
     * `true` for the defaults, or an object — see {@link MonoDateFilter}. Not
     * together with `headerFilter`.
     */
    dateFilter?: boolean | MonoDateFilter;
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
    map?: (value: any, row: any, index: number) => unknown;
    width?: string | number;
    height?: string | number;
    /**
     * Header alignment: `'left' | 'center' | 'right'`. Applied to the column's `<th>`.
     *
     * The body cells are the consumer's own markup, so mono cannot align them — but this is the
     * one place the intent is declared, and a `<td>` loop reading the same column entry keeps the
     * two sides in step.
     */
    align?: 'left' | 'center' | 'right';
    /** Anything else the element accepts. */
    [key: string]: unknown;
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
    th?: MonoTableColumnProps[];
    search?: Record<string, unknown>;
    info?: Record<string, unknown>;
    paging?: Record<string, unknown>;
    loading?: Record<string, unknown>;
    /**
     * Shared defaults for every `<mono-table-empty>` bound to this grid — one place
     * to set the `icon` / `title` / `subtitle` / `reload` an app uses everywhere,
     * instead of restating them on each table.
     */
    empty?: Record<string, unknown> & MonoEventProps<TableEmptyEvents>;
    /**
     * Shared defaults for every `<mono-table-error>` bound to this grid — one place
     * to set `dismissible` / `closeLabel` for the whole app.
     */
    error?: Record<string, unknown> & MonoEventProps<TableErrorEvents>;
    pageSize?: Record<string, unknown>;
    pagingGroup?: Record<string, unknown>;
    /**
     * Shared defaults for EVERY `<mono-table-detail>` bound to this grid — the
     * icons, `disabled`, `stay-open`. `open` is deliberately ignored here: it is
     * per-row state the user toggles, so re-applying it centrally would undo every
     * click. Open/close from code with {@link MonoTableController.detail}.
     */
    detail?: Record<string, unknown> & MonoEventProps<TableDetailEvents>;
    /**
     * Shared defaults for every `<mono-table-checkbox>` bound to this grid — the
     * natural home for `keyValue` / `mode` / `chunk`, so the header and the row
     * checkboxes can't disagree.
     */
    checkbox?: Record<string, unknown> & MonoEventProps<TableCheckboxEvents>;
}
/**
 * A registered `<mono-table-detail>`, as the controller sees it. Only the two
 * pieces of state `table.detail()` drives are part of the contract.
 */
export interface MonoDetailEl {
    /** Whether the row's panel is showing. */
    open: boolean;
    /**
     * Exempt from every AUTOMATIC close — both the accordion
     * ({@link MonoDetailHandle.collapseOthers}) and {@link MonoDetailHandle.collapseAll}.
     * Not a lock: the row's own chevron still closes it.
     */
    stayOpen?: boolean;
    /** Present on real elements; used to return `getAll()` in DOM order. */
    compareDocumentPosition?(other: Node): number;
}
/** The handle returned by `table.detail()`. */
export interface MonoDetailHandle {
    /** Open every registered detail (never auto-closes anything). */
    expandAll(): void;
    /**
     * Close every registered detail EXCEPT those marked `stay-open`. Those keep
     * their panel; their own chevron still closes them by hand.
     */
    collapseAll(): void;
    /**
     * Close every registered detail except `except` and the `stay-open` ones.
     *
     * This is the **accordion**: `<mono-table-detail>` calls it on itself whenever
     * the user opens it, so opening one row closes the row that was open. Details
     * registered on a DIFFERENT controller (a nested grid's) are untouched, which
     * is what lets a nested table run its own accordion.
     */
    collapseOthers(except?: MonoDetailEl): void;
    /** How many panels are open right now. */
    openCount(): number;
    /** Every registered `<mono-table-detail>`, in DOM (visual) order. */
    getAll(): MonoDetailEl[];
}
/**
 * How a `type="all"` `<mono-table-checkbox>` selects.
 *
 * - `'all'` — drains the SOURCE in `chunk`-sized requests and selects every row
 *   the active search/filter matches, including rows never fetched for display.
 * - `'per-page'` — selects the loaded page only. No request.
 */
export type MonoCheckMode = 'all' | 'per-page';
/** Shared config for the checkboxes bound to one grid. */
export interface MonoCheckConfig {
    /**
     * Field(s) `getAll()` projects each selected row down to. Path-aware and
     * shape-preserving: `['Company.Name', 'Transaction.[*].Id']` yields
     * `{ Company: { Name }, Transaction: [{ Id }] }`. Omit for the whole row.
     */
    keyValue?: string | string[];
    mode?: MonoCheckMode;
    /** Rows per request while draining in `mode: 'all'` (default 100). */
    chunk?: number;
    /**
     * Most rows the USER can have selected (unset = unlimited). A pick past the cap
     * is rejected — the store does not change and notifies so a bound checkbox
     * un-ticks itself; a bulk select (`selectPage` / `selectAll`) fills only the
     * room left. `replace()` is not capped: a value the developer pushes in is theirs.
     */
    max?: number | null;
    /**
     * Fewest rows the USER can leave selected (unset = 0). Un-ticking at the floor
     * is rejected the same way; `clear()` keeps the first `min` rows. Only guards
     * removals — an empty store starts empty regardless.
     */
    min?: number | null;
}
/** The user-facing selection limits, resolved to numbers. */
export interface MonoCheckLimits {
    max?: number;
    min?: number;
}
/** The handle returned by `table.check()`. */
export interface MonoCheckHandle<T = any> {
    /**
     * The selection, each row projected through `keyValue`. **Synchronous** — it
     * returns what is selected right now, so a template can read it directly; a
     * `mode: 'all'` drain fills it in and notifies when it lands.
     */
    getAll(): T[];
    /** How many rows are selected. */
    count(): number;
    /**
     * The selected rows themselves, in selection order and UNPROJECTED — unlike
     * {@link getAll}, which narrows each row to `keyValue`. For callers that need the
     * whole row back (the dropdown derives its `modelValue` and chip text from these).
     */
    rows(): T[];
    /** Whether a row (or its `rowKey`) is selected. */
    isChecked(row: T | string): boolean;
    /** Select / deselect one row. Omit `checked` to flip it. */
    toggle(item: T, checked?: boolean): void;
    /** Select every row of the loaded page. */
    selectPage(): void;
    /**
     * Replace the whole selection in ONE update. The bulk primitive: setting N rows
     * through {@link toggle} would notify N times, which is the difference between
     * one render and 830 of them.
     */
    replace(rows: readonly T[]): void;
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
    selectAll(): Promise<void>;
    /** Empty the selection. */
    clear(): void;
    /** Whether a `selectAll()` drain is in flight. */
    readonly pending: boolean;
    /** Every loaded row is selected (and there is at least one). */
    readonly allChecked: boolean;
    /** Some — but not all — loaded rows are selected (the indeterminate state). */
    readonly someChecked: boolean;
    /** The configured `max` / `min` (see {@link MonoCheckConfig}), sanitised. */
    limits(): MonoCheckLimits;
    /** `max` is set and the selection has reached it — the next pick is rejected. */
    readonly atMax: boolean;
    /** `min` is set and the selection is at (or under) it — the next removal is rejected. */
    readonly atMin: boolean;
    /** Set the shared config. Called by the elements from their own props. */
    configure(config: MonoCheckConfig): void;
}
/** A resolved column definition, as read from a registered `mono-table-th`. */
export interface MonoColumn {
    /**
     * Column field. May be a **path expression** into nested / collection data —
     * `"Job.Name"` (nested), `"User.[1].Id"` (index), `"User.[*].Name"` (wildcard).
     * `.`/`[` are reserved. See {@link getFieldValue} / {@link toODataClause}.
     */
    field: string;
    caption?: string;
    /** `true` = sortable with defaults; an object tunes it; `false` / omitted = not sortable. */
    sort?: boolean | MonoColumnSort;
    /** Whether the column's cells can be edited (`mono-table-th` `editable`). */
    editable?: boolean;
    /** The column's header-filter config (`mono-table-th` `header-filter`), if any. */
    headerFilter?: boolean | MonoHeaderFilter;
    /** The column's date-filter config (`mono-table-th` `date-filter`), if any. */
    dateFilter?: boolean | MonoDateFilter;
}
/**
 * One search term. `field` binds it to a single column (a "context"); omit it to
 * search every `searchExpr` column, which is the classic single-box behaviour.
 *
 * Terms group by `field`: **OR within a field, AND across fields** — so two terms
 * on `Nama` widen, while a term on `Code` narrows.
 */
export interface MonoSearchTerm {
    value: string;
    field?: string;
}
/** One distinct value of a column, with its occurrence count — for the header filter list. */
export interface MonoColumnValue {
    value: unknown;
    count: number;
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
    field: string;
    caption?: string;
    [key: string]: unknown;
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
export type MonoEditableTrigger = 'click' | 'double-click';
/**
 * What happens to the PUBLISHED rows when a load fails. `'clear-list'` (default)
 * empties `items` / `totalCount` so the table never shows the previous scope's
 * rows under the error bar; `'keep-list'` leaves them as they were. A failed
 * select-all drain never clears — it is not the row set.
 */
export type MonoErrorBehaviour = 'clear-list' | 'keep-list';
/**
 * How the keyboard moves between inline editors — `'tab-arrows'` (default; tap
 * `Tab` for the next column, hold `Tab` + an arrow to move one cell that way) or
 * `'native'` (the browser's own Tab order, the pre-existing behaviour).
 * See {@link MonoDataGridOptions.editorNavKeys}.
 */
export type MonoEditorNavKeys = 'tab-arrows' | 'native';
/** A direction for {@link MonoDataGridController.moveEditor}. */
export type MonoEditorDirection = 'left' | 'right' | 'up' | 'down';
/** The iterable handle returned by `table.columns()` (mirrors {@link MonoSummaryHandle}). */
export interface MonoColumnHandle {
    /** The column def for `field`, or `null` when it isn't in the config. */
    get(field: string): MonoColumnDef | null;
    /** Every configured column def, in declaration order — loop to render / inspect. */
    getAll(): MonoColumnDef[];
}
/**
 * A registered header-cell element (`mono-table-th`). Structural so the
 * controller stays free of a Lit/DOM import — the element supplies the live
 * column props plus `compareDocumentPosition` for DOM-order sorting.
 */
export interface MonoColumnEl extends MonoColumn {
    compareDocumentPosition?(other: Node): number;
}
/** Payload emitted by `commitCell` / consumed via `controller.onCellChange`. */
export interface MonoCellChange<T = any> {
    rowKey: string;
    field: string;
    value: unknown;
    row: T | undefined;
}
/** One staged row edit, as returned by `controller.changes()`. */
export interface MonoStagedChange<T = any> {
    /** The controller's string row key (`rowKeyOf`). */
    rowKey: string;
    /** The server/entity key value (`row[keyExpr]`), for a store `update`. */
    key: unknown;
    /** The accumulated field→value patch for this row. */
    patch: Record<string, unknown>;
    row: T | undefined;
}
/** Optional config for {@link MonoTableController.form}. */
export interface MonoFormConfig<T = any> {
    /** Match field for edit/delete + dedupe on add (default: the grid's keyExpr). */
    key?: keyof T & string;
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
    showForm?: boolean;
}
/** One staged row op in the {@link MonoTableController.form} buffer. */
export type MonoFormOp<T = any> = {
    op: 'add';
    rows: T[];
} | {
    op: 'edit';
    key: unknown;
    row: Partial<T>;
} | {
    op: 'delete';
    key: unknown;
};
/** One entry for a devextreme store `push()` batch. */
export interface MonoStorePush {
    type: 'insert' | 'update' | 'remove';
    key?: unknown;
    data?: Record<string, unknown>;
}
/**
 * Chainable handle for optimistic, row-level CRUD staging. `add`/`edit`/`delete`
 * buffer ops; `apply()` commits them into the rendered data **locally** — it does
 * NOT call the server (the caller already ran their change API). Works for both an
 * array source and a remote DataSource. Repeated `form()` calls share one buffer.
 */
export interface MonoFormHandle<T = any> {
    /** Stage an insert: no arg = one empty row (shape inferred from existing data), one row, or many. */
    add(row?: Partial<T> | Array<Partial<T>>): MonoFormHandle<T>;
    /** Stage an update of the row whose key field == `key`. No-op if the key is not found. */
    edit(key: unknown, row: Partial<T>): MonoFormHandle<T>;
    /** Stage removal of the row whose key field == `key`. No-op if the key is not found. */
    delete(key: unknown): MonoFormHandle<T>;
    /**
     * Commit all staged ops into the rendered data. Local only, and **final** —
     * there is no undo of a committed apply (the intended flow saves to your API
     * first, then applies to reflect the persisted result). Use {@link discard} to
     * cancel everything *before* apply, or {@link revert} to drop ONE staged row.
     */
    apply(): Promise<void>;
    /**
     * Cancel a single **un-applied** row by its `table.rowKey(row)` — removes the
     * inline `showForm` row from the grid and drops its staged `add` from the buffer.
     * Per-row counterpart to {@link revertAll}. No-op for a key that isn't a staged
     * inline row; never removes already-committed data.
     */
    revert(key: unknown): MonoFormHandle<T>;
    /**
     * Cancel **all** un-applied inline (`showForm`) rows at once — the bulk form of
     * {@link revert}. Removes every inline row from the grid and its staged `add`,
     * but leaves staged `edit`/`delete` ops for existing rows untouched.
     */
    revertAll(): MonoFormHandle<T>;
    /** Snapshot copy of the staged ops. */
    changes(): Array<MonoFormOp<T>>;
    /**
     * Drop staged ops. With **no arg**, clears the whole `form()` buffer (all
     * `add`/`edit`/`delete`) and removes un-applied inline rows. With a **key**, drops
     * only the staged ops for that key — any `edit`/`delete` op with that key, plus an
     * inline `add` row whose `table.rowKey(row)` matches (removing it from the grid).
     * Does not touch the inline **cell**-edit buffer (`stageCell`) or edit mode — use
     * {@link discardAll} for a complete reset.
     */
    discard(key?: unknown): MonoFormHandle<T>;
    /**
     * Full reset: everything {@link discard} does **plus** clearing the cell-edit
     * buffer (`discardChanges`) and leaving edit mode (`cancelEdit`) — one call to
     * cancel every pending change across both editing systems.
     */
    discardAll(): MonoFormHandle<T>;
}
/** Column aggregate kinds supported by {@link MonoTableController.summary}. */
export type MonoSummaryType = 'sum' | 'avg' | 'count' | 'min' | 'max' | 'countDistinct';
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
    field?: string;
    /** Aggregate kind. Default `'sum'`. */
    type?: MonoSummaryType;
    /**
     * Disambiguates two summaries on the SAME field (e.g. a `sum` and an `avg` of
     * `Price`) so `summary('Price', type)` / a `name`-keyed element can pick one.
     */
    name?: string;
    /** Decimal places for the formatted value (`summaryText`). */
    precision?: number;
    /** Leading / trailing text on the formatted value (e.g. `prefix: '$'`). */
    prefix?: string;
    suffix?: string;
    /** Text shown when the value is `null` (no numeric data). Default `'—'`. */
    emptyText?: string;
    /** Full formatter override — wins over `precision`/`prefix`/`suffix`. */
    format?: (value: number | null, rows: unknown[]) => string;
}
/** A per-field summary spec — {@link MonoSummarySpec} minus `field` (the key supplies it). */
export type MonoSummaryFieldSpec = Omit<MonoSummarySpec, 'field'>;
/** When the aggregates are recomputed. */
export interface MonoSummaryRecalculate {
    /**
     * Recompute when the view is narrowed by search / filters. Default `false` —
     * so a total shows the WHOLE dataset regardless of the current search box or
     * header filters. Set `true` to make it track what's on screen.
     */
    searching?: boolean;
    /**
     * Recompute when the underlying data changes (rows added / removed / reloaded /
     * `setData`). Default `true`. (The first computation always runs regardless.)
     */
    changedData?: boolean;
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
    recalculate?: MonoSummaryRecalculate;
    /**
     * One spec (or several) per field. Optional: when the aggregates are declared
     * per column in `props.th[].summary`, this form is still the only place to set
     * `recalculate`, so `{ recalculate }` on its own is valid.
     */
    fields?: Record<string, MonoSummaryFieldSpec | MonoSummaryFieldSpec[]>;
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
    resolve?: MonoSummaryResolver;
}
/**
 * What a {@link MonoSummaryResolver} is handed — everything needed to ask a
 * server for the totals, with the OData clause already built.
 */
export interface MonoSummaryResolveContext {
    /** The aggregates to compute, in order. A positional result must match this. */
    specs: readonly MonoSummarySpec[];
    /** Response key per spec, parallel to `specs` — what an object result is read by. */
    aliases: readonly string[];
    /**
     * The predicate to aggregate over: the source's own filter AND its active
     * search, as a devextreme expression. The SAME one the drain would use.
     */
    filter: unknown;
    /** `filter` as an OData string, or `''` when there is none. */
    odataFilter: string;
    /** `aggregate(Price with sum as Price, …)` — no filter applied. */
    apply: string;
    /** `filter(<expr>)/aggregate(…)` — what an `$apply` parameter usually wants. */
    applyWithFilter: string;
    /** The bound source, for a resolver that needs its store or url. */
    source: unknown;
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
export type MonoSummaryResolver = (ctx: MonoSummaryResolveContext) => Promise<(number | null)[] | Record<string, number | null> | null> | (number | null)[] | Record<string, number | null> | null;
/** A computed summary — what `table.summary().get/getAll` return, for rendering anywhere. */
export interface MonoSummaryResult {
    field?: string;
    type: MonoSummaryType;
    name?: string;
    /** The numeric aggregate, or `null` when there's no numeric data. */
    value: number | null;
    /** The formatted value per the spec (`format`/`prefix`/`precision`/`suffix`). */
    text: string;
}
/** The iterable handle returned by `table.summary()` (no args). */
export interface MonoSummaryHandle {
    /** One result by field (and optional type), or `null` if there's no such spec. */
    get(field: string, type?: MonoSummaryType): MonoSummaryResult | null;
    /** Every computed summary — loop this to render totals outside the footer. */
    getAll(): MonoSummaryResult[];
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
    searchExpr?: MonoSearchValue;
    /** Search operation (default `'contains'`). */
    searchOperation?: string;
    /** Rows per page when wrapping a plain array (forwarded to `monoArraySource`). */
    pageSize?: number;
    /**
     * Group-by field(s), outermost first (e.g. `['Nama', 'Code']`). When set, the
     * controller groups the full result set and the main paging (`pageSize` /
     * `totalCount` / `pageCount`) operates on the **top-level groups** — so
     * `<mono-table-paging>` / `-info` / `-page-size` page and count groups. Rows
     * inside a group can be paged independently with `<mono-table-paging-group>`
     * (otherwise all rows in the group are shown). Works for a plain array and a
     * remote grouped DataSource alike.
     */
    group?: string | string[];
    /**
     * Default rows-per-page **inside** each group. When set, every group is paged
     * by this size from the first render (so a huge group never renders all its
     * rows at once); a `<mono-table-paging-group>` then just navigates/overrides
     * it. Leave unset to show all rows in a group until a `<mono-table-paging-group>`
     * is attached.
     */
    groupRowPageSize?: number;
    /**
     * Per-group aggregates for **server-side** grouping, e.g. `{ TotalBudget: 'sum' }`.
     * Computed by the groupby query (no rows loaded) and surfaced on each group node
     * as `node.meta.aggregates` — handy for a subtotal in the group header.
     */
    groupSummary?: Record<string, 'sum' | 'avg' | 'min' | 'max' | 'count'>;
    /**
     * Column summaries (aggregate footers). Either a plain array of specs, or the
     * richer object form ({@link MonoSummaryConfig}) with `recalculate` controls
     * and field-keyed specs. Read via `<mono-table-summary>`, `table.summary(field)`,
     * or `table.summary().getAll()`.
     */
    summary?: MonoSummarySpec[] | MonoSummaryConfig;
    /**
     * Central column config, read via `table.columns().get(field)` /
     * `table.columns().getAll()`. Entries only need `field` (plus optional `caption`)
     * today; the type is extensible for per-column props later. Separate from the
     * registered `<mono-table-th>` elements (see `table.registeredColumns()`).
     */
    columns?: MonoColumnDef[];
    /**
     * Props for the `mono-table-*` elements, declared centrally so each element is
     * wired with just `:data-grid.prop="table"`. Read back via `table.props()`.
     *
     * `props.th` is merged OVER `columns` by field, and each `th[].summary` is
     * folded into the same spec list `summary` feeds — so both styles coexist and
     * `table.summary()` sees one reconciled set.
     */
    props?: MonoTableProps;
    /**
     * A ref the grid writes a `props()` snapshot into on every change, so a Vue
     * template can drive its header loop from `state.th` with no manual
     * subscription. Mirrors `monoForm({ state })`.
     */
    state?: {
        value: MonoTableProps | undefined;
    };
    /** Columns fetched for a group's rows in server mode (omit = `dataSourceOptions.select`, else all columns). */
    select?: string[];
    /**
     * DataSource-level knobs the grid keeps under every query it runs — see
     * {@link MonoDataSourceOptions}. A value, a getter, or a `{ value }` box
     * (a Vue `ref` / `computed`), read fresh at query time.
     *
     * Not needed just to keep a filter: whatever a consumer sets on the source
     * directly (`ds.filter(...)`) is adopted as the base too. This is for the case
     * where the base is DERIVED from reactive state and should follow it.
     */
    dataSourceOptions?: MaybeReactive<MonoDataSourceOptions>;
    /** The same, in raw OData (`$select`, `$filter`, …) — see {@link MonoOdataOptions}. */
    odataOptions?: MaybeReactive<MonoOdataOptions>;
    /** Row key field used to build stable `displayRows` keys (default `'Id'`). */
    keyExpr?: string;
    /**
     * Max rows fetched per server request. When the page size is set to **"all"**,
     * the controller loads everything in chunks of this size (so a backend capped
     * at e.g. 100 rows/request still returns the full set). Default `100`.
     */
    chunkSize?: number;
    /**
     * Advanced override for server-side grouping. Normally you don't set this:
     * passing a single-field `group` plus a remote devextreme `DataSource` makes
     * the controller drive server group paging automatically from the source's
     * store. Provide this only to supply custom group/row fetching.
     */
    serverGroup?: MonoServerGroupSource<any>;
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
    serverApply?: boolean;
    /**
     * Whether a header filter's value list CASCADES: scoped by the other columns'
     * active header filters and by the grid search, so after Brand = "One" the
     * Product panel lists only that brand's products (with counts to match).
     * Default `true`. The column's OWN filter is never applied to its list, so a
     * value you filtered out can be ticked back. The panel's search box still
     * narrows the list on top. `false` scopes the list by the base filter alone.
     */
    headerFilterCascade?: boolean;
    /**
     * What a failed load does to the rows already on screen. Default
     * `'clear-list'`: they are emptied (see `MonoErrorBehaviour`), so a filter that
     * the backend rejected never leaves the previous filter's rows showing under
     * the error bar. `<mono-table-error behaviour>` writes the same setting.
     */
    onError?: MonoErrorBehaviour;
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
    errorMessages?: MonoErrorMessages;
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
    distinctValues?: (field: string, 
    /**
     * The column's `headerFilter.dataSourceOptions`, with the grid's base filter
     * AND-ed into `filter`, so a resolver that goes through `store.load(options)`
     * is scoped without doing anything.
     */
    options?: MonoHeaderFilterLoadOptions, 
    /** The same, in OData form — for a resolver that builds its own `$apply`. */
    ctx?: MonoDistinctValuesContext) => Promise<Array<MonoColumnValue | unknown>> | Array<MonoColumnValue | unknown>;
    /**
     * How a row's inline editor opens — `'click'` (default) or `'double-click'`.
     * The grid binds one delegated listener on the `<table>`; rows only need
     * `data-row-key`. A `<mono-table-th editable-trigger="…">` overrides this.
     *
     * Clicks on an editor or on an interactive control (button / link / form
     * field) never open the editor, so per-row action buttons keep working.
     */
    editableTrigger?: MonoEditableTrigger;
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
    editorNavKeys?: MonoEditorNavKeys;
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
    map?: (row: any, index: number) => unknown;
    /**
     * Creates a `monoFilterBuilder()` controller owned by the grid and exposed as
     * `table.filterBuilder`, so a `<mono-filter-builder :data-filter.prop="table.filterBuilder">`
     * slotted into a `<mono-table-search>` joins without a standalone controller.
     * Accepts the same options as `monoFilterBuilder()`; `dataGrid` is wired
     * automatically (its field list is derived from the registered columns).
     */
    filterBuilder?: MonoFilterBuilderOptions;
}
/** A top-level group's metadata, returned by {@link MonoServerGroupSource.loadGroups}. */
export interface MonoGroupMeta {
    /** The group's key (its value for the group field). */
    key: unknown;
    /** Total rows in the group (from the groupby `$count`). */
    count: number;
    /** Optional per-group aggregates (e.g. a `Sum`) from the groupby query. */
    aggregates?: Record<string, number>;
}
/** Shared search/sort context passed to a {@link MonoServerGroupSource}. */
export interface MonoServerGroupCtx {
    /** Current search value (or null). */
    search: string | null;
    /** Active multi-key sort (group fields first), or null. */
    sort: Array<{
        selector: string;
        desc: boolean;
    }> | null;
    /**
     * The grid's composed base filter — `dataSourceOptions.filter`, whatever the
     * consumer set on the source, `setFilter()`, and the header column filters —
     * WITHOUT the search, which the source folds from `search` itself. A server
     * group source must AND this into both requests; the DataSource's own filter
     * never reaches a `store.load()`.
     */
    filter?: unknown;
    /** `dataSourceOptions.select`, when the grid's own `select` option is unset. */
    select?: string[];
    /** `expand` / `customQueryParams` from `dataSourceOptions`, to spread into `store.load()`. */
    loadOptions?: Record<string, unknown>;
}
/**
 * Consumer-supplied data access for server-side group paging. The controller
 * calls these; @mono-lit/helper never imports a fetcher, so any backend works.
 */
export interface MonoServerGroupSource<T = any> {
    /** Fetch the group list + per-group counts/aggregates (one cheap groupby). */
    loadGroups(ctx: MonoServerGroupCtx): Promise<MonoGroupMeta[]>;
    /** Fetch one page of rows for a single group (`$filter` + `$skip`/`$top`). */
    loadRows(key: unknown, ctx: MonoServerGroupCtx & {
        skip: number;
        take: number;
    }): Promise<T[]>;
}
/**
 * A flattened, ready-to-render row for the table body — read `controller.displayRows`
 * and `v-for` over it (use `key` for the row key). Removes the need to walk the
 * group tree, test `isGroupNode`, or build keys in the consumer.
 */
export interface MonoDisplayRow<T = any> {
    /** Stable, unique key for the framework's keyed list. */
    key: string;
    /** What to render: a group header, a data row, or a per-group pager slot. */
    kind: 'group' | 'row' | 'footer';
    /** Nesting depth (0 = top level) — use for indentation. */
    level: number;
    /** The group node (set for `group` / `footer`). */
    node?: MonoGroupNode<T>;
    /** The data row (set for `row`) — always the RAW row. */
    row?: T;
    /**
     * The row after `map` / per-column `map` (set for `row`). Identical to `row`
     * when no map is configured, so a template can read `mapped` unconditionally.
     */
    mapped?: any;
}
/** Per-group row paging snapshot, returned by {@link MonoTableController.groupPageInfo}. */
export interface GroupPageInfo {
    /** Zero-based current page within the group. */
    pageIndex: number;
    /** Total pages for the group's rows. */
    pageCount: number;
    /** Rows per group-page. */
    pageSize: number;
    /** Total rows (or sub-groups) directly under the group. */
    total: number;
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
    message: string;
    /** The HTTP status the error carried, `0` for a network failure, absent when it had none. */
    status?: number;
    /**
     * What the server said beyond the status — an OData error body's message, a
     * JSON `message` — or the error's own text when a preset took the headline.
     * Never a bare reason phrase like "Forbidden".
     */
    detail?: string;
    /** Exactly what was thrown — an `Error`, a string, an HTTP payload, anything. */
    raw: unknown;
    /** Which operation failed, so a consumer can word it ("Reload failed"). */
    source: 'load' | 'reload' | 'group' | 'groupRows' | 'selectAll';
    /** `Date.now()` at capture. */
    at: number;
}
export interface MonoTableController<T = any> {
    /** Current page rows (mirror of `dataSource.items()`) — always RAW. */
    items: T[];
    /**
     * `items` after `map` / per-column `map`, ready to render. Identical to `items`
     * when neither is configured, so it is always safe to read.
     */
    mapped: any[];
    /**
     * Flattened, keyed rows ready to render (group headers, data rows, per-group
     * pager footers). `v-for` over this and switch on `kind` — no tree walking.
     */
    displayRows: Array<MonoDisplayRow<T>>;
    /** Whether the source is loading. */
    loading: boolean;
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
    hasLoaded: boolean;
    /**
     * The last operation that failed, or `null`.
     *
     * A fresh object per failure, so two identical errors are still distinguishable
     * — `<mono-table-error>` dismisses per failure by remembering the object it
     * dismissed. Cleared by the next successful settle and when a new source is
     * bound.
     */
    error: MonoTableError | null;
    /** Total row count (needs `requireTotalCount: true`; else falls back). */
    totalCount: number;
    /** Zero-based current page index. */
    pageIndex: number;
    /** Rows per page. */
    pageSize: number;
    /** Whether the "all" page size is active (no pagination — everything shown). */
    pageSizeAll: boolean;
    /** Total number of pages. */
    pageCount: number;
    /**
     * Active sort keys, **in precedence order** — `sorts[0]` is the primary. A
     * column's sort arrow is single-key, so clicking one leaves exactly this entry;
     * the header's right-click `Sort ›` menu appends instead, which is how a
     * multi-key sort is built (and what the `<sup>` precedence badges reflect).
     */
    sorts: MonoSortEntry[];
    /**
     * Primary sort field (`sorts[0]`), or null. Kept for back-compat — read `sorts`
     * to see every active key.
     */
    sortField: string | null;
    /** Primary sort direction (`sorts[0]`), or null when unsorted. */
    sortOrder: SortOrder;
    /** Whether grouping is active (one or more group fields configured). */
    grouped: boolean;
    /** Active scroll-paging mode. `'off'` = classic numbered paging. */
    scrollMode: 'off' | 'infinity' | 'virtual';
    /** Whether more unloaded rows exist beyond `loadedCount` (scroll modes). */
    hasMore: boolean;
    /** Total rows currently accumulated (loaded) in a scroll mode. */
    loadedCount: number;
    /** Virtual window: first accumulated index rendered (`items[0]`). */
    virtualStart: number;
    /** Virtual window: one-past-last accumulated index rendered. */
    virtualEnd: number;
    /** Virtual top spacer height in px (rows scrolled above the window). */
    virtualPadTop: number;
    /** Virtual bottom spacer height in px (rows below the window). */
    virtualPadBottom: number;
    /** The bound source (or null). */
    readonly dataSource: MonoGridSource<T> | null;
    load(): Promise<void>;
    reload(): Promise<void>;
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
    clear(): void;
    setPage(pageIndex: number): Promise<void>;
    /**
     * Enable a scroll-paging mode (flat tables only — grouped/server grids warn
     * and stay on classic paging). Driven by `<mono-table-paging type="…">`.
     *
     * Pass `{ reload: false }` when the mode change is BOOKKEEPING rather than a request for
     * different rows — a pager element being disconnected, most of all. Nothing consumes a fetch
     * issued on the way out, and the accumulator is kept so a reconnect can resume from it.
     */
    setScrollPaging(mode: 'off' | 'infinity' | 'virtual', opts?: {
        reload?: boolean;
    }): Promise<void>;
    /** Load & append the next page onto the scroll accumulator (no-op if `!hasMore`). */
    loadNext(): Promise<void>;
    /** Set the virtual render window (indices into the accumulator) + spacer px. */
    setVirtualWindow(start: number, end: number, padTop: number, padBottom: number): void;
    /**
     * Override the page size (rows fetched per page / scroll chunk), winning over
     * the bound source's configured `pageSize`. `null` clears the override.
     * Applied order-independently: stored + re-applied on every `bind`.
     */
    setPreferredPageSize(pageSize: number | null): Promise<void>;
    /** Set rows/groups per page, or `'all'` to load & show everything (chunked). */
    setPageSize(pageSize: number | 'all'): Promise<void>;
    setSearch(value: string): Promise<void>;
    /**
     * Multi-term search. Terms group by `field`: **OR within a field, AND across
     * fields**, so `[{Nama,'a'},{Nama,'b'},{Code,'x'}]` becomes
     * `(contains(Nama,'a') or contains(Nama,'b')) and contains(Code,'x')`.
     *
     * A term with no `field` searches every `searchExpr` column (ORed), which is
     * exactly what {@link setSearch} does — `setSearch(v)` is shorthand for
     * `setSearchTerms([{ value: v }])`.
     */
    setSearchTerms(terms: MonoSearchTerm[]): Promise<void>;
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
    setSearchValue(expr: MonoSearchValue | undefined | null): Promise<void>;
    /** Alias of {@link setSearchValue}, under the option's older name. */
    setSearchExpr(expr: MonoSearchValue | undefined | null): Promise<void>;
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
    searchValue(): MonoSearchExprEntry[] | undefined;
    /** Alias of {@link searchValue}, under the option's older name. */
    searchExpr(): MonoSearchExprEntry[] | undefined;
    /** The live search terms (empty when unsearched). */
    searchTerms: MonoSearchTerm[];
    /**
     * An explicit filter of the grid's own — what the slotted filter builder
     * writes. One LAYER of the query, not the whole of it: it is AND-ed with the
     * base (`dataSourceOptions.filter` + whatever the consumer set on the source),
     * the header column filters and the search, and clearing it (`null`) clears
     * only this layer. Array sources take an array (compiled) or a predicate.
     */
    setFilter(filter: unknown): Promise<void>;
    /**
     * Replace `dataSourceOptions` after construction and run the query. Pass the
     * same shapes the option takes (a value, a getter, a `{ value }` box).
     */
    setDataSourceOptions(next: MaybeReactive<MonoDataSourceOptions> | undefined): Promise<void>;
    /** Replace `odataOptions` after construction and run the query. */
    setOdataOptions(next: MaybeReactive<MonoOdataOptions> | undefined): Promise<void>;
    /**
     * Re-read `dataSourceOptions` / `odataOptions` and the source's own filter,
     * then load. The call to make after the reactive state behind a getter
     * changed. Goes back to page 0 only when something actually changed — unlike
     * `reload()`, which always restarts and drops the store cache.
     */
    refresh(): Promise<void>;
    /** The merged, normalised options as of the last query (read-only snapshot). */
    resolvedDataSourceOptions(): Readonly<MonoDataSourceOptions>;
    /**
     * The grid-owned filter-builder controller, when `monoDataGrid({ filterBuilder })
     * is set. Bind it with `<mono-filter-builder :data-filter.prop="table.filterBuilder">`;
     * `undefined` when no `filterBuilder` option was passed.
     */
    filterBuilder?: MonoFilterController;
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
    setSort(field: string | null, order?: SortOrder, options?: MonoSetSortOptions): Promise<void>;
    /**
     * Whether the user has started a combined sort from the menu and something is
     * still sorted — the header arrows read this to append instead of replace.
     */
    sortCombining(): boolean;
    /** This column's direction, or null when it isn't part of the sort. */
    sortOf(field: string): SortOrder;
    /** 1-based precedence of a column in `sorts`; `0` when it isn't sorted. */
    sortIndex(field: string): number;
    /** Drop every sort key. */
    clearSort(): Promise<void>;
    /**
     * A column's `map` from `props.th`, if it declares one. Used by the header filter
     * to relabel its value list; returns `undefined` for an unmapped column.
     */
    columnMap(field: string): ((value: any, row: any, index: number) => unknown) | undefined;
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
    setColumnFilter(field: string, values: unknown[] | null, options?: MonoSetColumnFilterOptions): Promise<void>;
    /**
     * Whether the user has started combining filters from the menu and something
     * is still filtered — the funnel reads this to combine instead of replace.
     */
    columnFilterCombining(): boolean;
    /** What a failed load does to the published rows (`onError`). */
    errorBehaviour(): MonoErrorBehaviour;
    /** Change it after construction — `<mono-table-error behaviour>` calls this. */
    setErrorBehaviour(next: MonoErrorBehaviour): void;
    /** The values currently selected for a column's header filter (empty = none). */
    columnFilter(field: string): unknown[];
    /**
     * Every field with an active header filter, in insertion order. The right-click
     * `Header Filter ›` row is what pushes this past one entry (and, once it has,
     * the funnel keeps adding — see `columnFilterCombining`).
     */
    filteredColumns(): string[];
    /**
     * The column's DISTINCT values with counts, for the header-filter list. Uses an
     * OData `$apply=groupby((field))` request for a remote store, else derives them
     * client-side from the array source's full data.
     */
    distinctValues(field: string, options?: MonoHeaderFilterLoadOptions): Promise<MonoColumnValue[]>;
    /**
     * Replace the backing rows. Effective only for array-backed tables (a plain
     * array passed to `monoDataGrid`, or a `monoArraySource`); ignored for a
     * remote DataSource.
     */
    setData(next: T[]): Promise<void>;
    /**
     * Change the group-by field(s) at runtime (pass `null`/`[]` to ungroup).
     * Re-applies the group-contiguous sort, resets to page 0 and reloads.
     */
    setGroup(group: string | string[] | null): Promise<void>;
    /** Collapse/expand a group by its node or `path`. */
    toggleGroup(target: MonoGroupNode<T> | string): void;
    /** Whether the group at `path` is currently collapsed. */
    isGroupCollapsed(path: string): boolean;
    /** Expand every group. */
    expandAllGroups(): void;
    /** Collapse every group. */
    collapseAllGroups(): void;
    /**
     * Register/replace the per-group row page size for the group at `path` —
     * called by `<mono-table-paging-group>` on connect. While registered, that
     * group's rows are sliced to one page; otherwise all rows show.
     */
    setGroupPageSize(path: string, pageSize: number): void;
    /** Set the current page within the group at `path`. */
    setGroupPage(path: string, pageIndex: number): void;
    /** Stop paging the group at `path` (show all its rows again). */
    clearGroupPaging(path: string): void;
    /** Current row-paging state for the group at `path`. */
    groupPageInfo(path: string): GroupPageInfo;
    /**
     * The full (un-paged) group node at `path` for the current data — use its
     * `items` for aggregates (e.g. a subtotal) even when the displayed rows are
     * sliced by a `<mono-table-paging-group>`. `undefined` if not found.
     */
    groupNode(path: string): MonoGroupNode<T> | undefined;
    /**
     * Every row matching the current search / filters / sort — not just the page
     * on screen — without disturbing what's displayed.
     *
     * A remote source is read straight off its store, so the bound DataSource's
     * paging is never touched; an array source is read with paging temporarily
     * off and restored afterwards. Either way `items` / `pageIndex` are the same
     * when the promise resolves as they were before it.
     */
    getData(): Promise<T[]>;
    /**
     * The full group tree for `rows`, using the group field(s) already configured
     * on this grid. Omit `rows` to group everything {@link getData} returns.
     * Empty when the grid isn't grouped.
     *
     * To group by something other than the grid's own fields, use the exported
     * `buildGroups(rows, fields)` helper directly.
     */
    buildGroups(rows?: T[]): Promise<Array<MonoGroupNode<T>>>;
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
    export(options: MonoExportOptions): Promise<MonoExportResult>;
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
    import(options: MonoImportOptions<T>): Promise<MonoImportResult<T>>;
    /** Whether a cell's staged value came from an import rather than a hand edit. */
    isCellImported(rowKey: string, field: string): boolean;
    /** Whether any of a row's staged values came from an import. */
    isRowImported(rowKey: string): boolean;
    /**
     * With no args, an iterable handle over every computed summary — loop
     * `table.summary().getAll()` (each `{ field, type, value, text }`) to render
     * totals anywhere, or `table.summary().get(field)` for one.
     */
    summary(): MonoSummaryHandle;
    /**
     * The computed aggregate for a column, or `null` when there's no numeric data
     * (or it hasn't been computed yet). Reads the summary cache; if no spec matches
     * `field`(+`type`), a default one (`{ field, type: type ?? 'sum' }`) is
     * registered on the fly, so a bare `table.summary('Price')` works with no
     * central config. Computed over the full filtered set — not just the page.
     */
    summary(field: string, type?: MonoSummaryType): number | null;
    /**
     * Attach (or clear, with `null`) the server-side summary resolver after the
     * grid is built — see {@link MonoSummaryConfig.resolve}. The aggregates are
     * recomputed immediately, so a footer already on screen updates itself.
     */
    setSummaryResolver(resolve: MonoSummaryResolver | null): void;
    /**
     * The formatted summary string for a column, per its spec's
     * `format`/`prefix`/`precision`/`suffix` (`emptyText` when null). This is what
     * `<mono-table-summary>` renders.
     */
    summaryText(field: string, type?: MonoSummaryType): string;
    /** Register/replace a summary spec (called by `<mono-table-summary>` on connect). */
    registerSummary(spec: MonoSummarySpec): void;
    /** Remove a summary spec (called on disconnect). */
    unregisterSummary(spec: MonoSummarySpec): void;
    /** The currently registered summary specs. */
    summaries(): ReadonlyArray<MonoSummarySpec>;
    /** Attach (or swap) the source — a devextreme DataSource or a plain array. */
    bind(ds: MonoGridSource<T> | T[] | null): void;
    /** Subscribe to state changes; returns an unsubscribe function. */
    subscribe(cb: () => void): () => void;
    /** Detach listeners and clear subscribers. */
    dispose(): void;
    /** Row key of the row currently in edit mode, or `null`. */
    editingKey: string | null;
    /**
     * Optional sink for inline edits. `commitCell` invokes this with the change so
     * the consumer can update its own full data array and call `setData`. Assign
     * after creating the controller (`table.onCellChange = …`).
     */
    onCellChange: ((change: MonoCellChange<T>) => void) | null;
    /**
     * How a row click opens its inline editor — `'click'` (default) or
     * `'double-click'`. Set it via `monoDataGrid(data, { editableTrigger })`, or
     * per table by putting `editable-trigger` on a `<mono-table-th>` (a th only
     * writes when its own prop is set).
     */
    editableTrigger: MonoEditableTrigger;
    /**
     * How the keyboard moves between inline editors — `'tab-arrows'` (default) or
     * `'native'`. Set it via `monoDataGrid(data, { editorNavKeys })`.
     */
    editorNavKeys: MonoEditorNavKeys;
    /**
     * Move the inline editor one cell in `dir` and focus it, scrolling it into
     * view. Returns `false` when the move is blocked by an edge (and nothing
     * moved) — the arrow directions never wrap. Normally driven by the keyboard,
     * but public so a consumer can wire its own buttons.
     */
    moveEditor(dir: MonoEditorDirection, fromEl?: EventTarget | null): boolean;
    /**
     * Bind the row trigger to the `<table>` holding this grid's rows. Called by
     * `mono-table-th` on update — idempotent, so the repeated calls from every
     * header cell collapse to a single listener.
     */
    bindRowTrigger(tableEl: HTMLElement | null): void;
    /** Register/replace a header-cell element — called by `mono-table-th` on connect. */
    registerColumn(el: MonoColumnEl): void;
    /** Remove a header-cell element — called on disconnect. */
    unregisterColumn(el: MonoColumnEl): void;
    /**
     * The central column config (from `monoDataGrid(data, { columns })`) as an
     * iterable handle: `table.columns().get(field)` / `.getAll()`. For the live
     * registered `<mono-table-th>` list, use {@link registeredColumns}.
     */
    columns(): MonoColumnHandle;
    /**
     * The central element props (`monoDataGrid({ props })`), merged with `columns`.
     * A stable object mutated in place — read it after `subscribe`, or drive a
     * template from the `state` ref. `props().th` is the per-column list you loop
     * yourself to render the header.
     */
    props(): MonoTableProps;
    /**
     * Row-detail handle — `table.detail().expandAll()` / `.collapseAll()` /
     * `.openCount()` / `.getAll()` over every `<mono-table-detail>` bound to this
     * grid. `collapseAll()` skips the ones marked `stay-open`.
     */
    detail(): MonoDetailHandle;
    /**
     * Row-selection handle — what `<mono-table-checkbox>` drives and
     * `table.check().getAll()` reads back. The selection is keyed by
     * {@link rowKey}, so it survives paging, sorting, searching and filtering;
     * only `clear()` (or unchecking) empties it.
     */
    check(): MonoCheckHandle<T>;
    /** Register a `<mono-table-detail>` — called by the element on connect. */
    registerDetail(el: MonoDetailEl): void;
    /** Remove a `<mono-table-detail>` — called on disconnect. */
    unregisterDetail(el: MonoDetailEl): void;
    /** Registered `<mono-table-th>` elements in DOM (visual) order. */
    registeredColumns(): MonoColumn[];
    /** Registered columns that declare an `editable` config, in DOM order. */
    editableColumns(): MonoColumn[];
    /**
     * Put a row into edit mode (all its editable cells). Pass the triggering DOM
     * event (the row click / dblclick) to auto-focus the row's first editor, so a
     * later click/tab away reliably exits via `editorBlur`.
     */
    beginEditRow(rowKey: string, event?: Event): void;
    /** Leave edit mode. */
    cancelEdit(): void;
    /** Whether `rowKey` is the row currently being edited. */
    isEditingRow(rowKey: string): boolean;
    /** Whether `rowKey`'s `field` cell should render an editor right now. */
    isEditingCell(rowKey: string, field: string): boolean;
    /** Emit a cell change immediately (funnels to `onCellChange`). */
    commitCell(rowKey: string, field: string, value: unknown): void;
    /** Buffer an edit (shown optimistically; not sent). */
    stageCell(rowKey: string, field: string, value: unknown): void;
    /** Staged value for a cell, or `fallback` when it isn't staged. */
    cellValue(rowKey: string, field: string, fallback: unknown): unknown;
    /** Whether a specific cell has a staged edit. */
    isCellDirty(rowKey: string, field: string): boolean;
    /** Whether a row has any staged edit. */
    isRowDirty(rowKey: string): boolean;
    /** Number of rows with staged edits. */
    pendingCount(): number;
    /** Whether any edit is staged. */
    hasChanges(): boolean;
    /** The staged change set — for sending your own (bulk) request. */
    changes(): Array<MonoStagedChange<T>>;
    /** Drop all staged edits (reverts the optimistic display). */
    discardChanges(): void;
    /**
     * Flush staged edits to the bound source: a DataSource store `update` (OData
     * PATCH) per row + `reload()`, an array source per-row `update`, or a `setData`
     * merge. Keeps the buffer on error so the save is retryable.
     */
    saveChanges(): Promise<void>;
    /**
     * Keyboard handler an inline editor forwards its `keydown` to. Tab wraps to the
     * next/previous row's editor at a row boundary; Enter/Escape leave edit mode.
     * Rows must carry `data-row-key` and editors `data-edit-cell` for focus to move.
     */
    editorKeydown(event: KeyboardEvent, rowKey: string, field: string): void;
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
    form(config?: MonoFormConfig<T>): MonoFormHandle<T>;
    /** The live row-level staging buffer (readable) — what `form()` has staged but not yet applied. */
    pendingData: Array<MonoFormOp<T>>;
    /**
     * Stable string key for a row — use it as the `data-row-key` / editing key
     * (e.g. `const rk = (row) => table.rowKey(row)`). For a `form({ showForm: true })`
     * row it returns an internal stable id that survives edits to the key field;
     * otherwise it's `String(row[keyExpr])`.
     */
    rowKey(row: T): string;
}
/**
 * Create a table controller around a devextreme DataSource.
 *
 * @example
 * const table = monoDataGrid(dataSource, { searchExpr: ['Name', 'Email'] })
 * table.subscribe(() => rows.value = [...table.items]) // Vue mirror
 */
/** Renamed "control" alias of {@link monoDataGrid} (no breaking change — both work). */
export { monoDataGrid as controlMonoTable };
export declare function monoDataGrid<T = any>(ds?: MonoGridSource<T> | T[] | null, opts?: MonoDataGridOptions): MonoTableController<T>;
