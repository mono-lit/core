import { MonoTableController, MonoGridSource, MonoGridStore, MonoDataGridOptions, MonoDataSourceOptions, MonoOdataOptions, MonoColumn, MonoColumnSort, MonoColumnValue, MonoEditableTrigger, MonoSearchTerm, MonoHeaderFilter, MonoHeaderFilterLoadOptions, MonoDistinctValuesContext, MonoEditorNavKeys, MonoEditorDirection, MonoCellChange, MonoStagedChange, MonoFormConfig, MonoFormOp, MonoFormHandle, MonoStorePush, MonoSummaryType, MonoSummarySpec, MonoSummaryFieldSpec, MonoSummaryConfig, MonoSummaryRecalculate, MonoSummaryResult, MonoSummaryHandle, MonoColumnDef, MonoColumnHandle, MonoTableProps, MonoTableColumnProps, MonoCheckMode, MonoCheckConfig, MonoCheckHandle } from './mono-data-grid.js';
import { MonoGroupNode } from './grouping.js';
import { MonoSearchCustomCtx, MonoSearchCustomResult, MonoSearchExpr, MonoSearchExprCustom, MonoSearchExprEntry } from '../../search/search-expr.js';
import { MonoSearchValue, MonoSearchFieldsAliases } from '../../search/data-search.js';
import { InputCssClass, InputColor, InputSize, InputValidationState, InputVariant } from '../input/input-types.js';
import { CheckboxColor, CheckboxCssClass, CheckboxSize } from '../checkbox/checkbox-types.js';
export type { MonoTableController, MonoGridSource, MonoGridStore, MonoDataGridOptions, MonoGroupNode };
export type { MonoDataSourceOptions, MonoOdataOptions };
export type { MonoColumn, MonoColumnSort, MonoColumnValue, MonoCellChange, MonoStagedChange };
export type { MonoSearchTerm };
export type { MonoSearchCustomCtx, MonoSearchCustomResult, MonoSearchExpr, MonoSearchExprCustom, MonoSearchExprEntry, MonoSearchValue, MonoSearchFieldsAliases, };
export type { MonoHeaderFilter, MonoHeaderFilterLoadOptions, MonoDistinctValuesContext };
export type { MonoFormConfig, MonoFormOp, MonoFormHandle, MonoStorePush };
export type { MonoSummaryType, MonoSummarySpec, MonoSummaryFieldSpec, MonoSummaryConfig };
export type { MonoSummaryRecalculate, MonoSummaryResult, MonoSummaryHandle };
export type { MonoColumnDef, MonoColumnHandle };
export type { MonoTableProps, MonoTableColumnProps };
export type { MonoCheckMode, MonoCheckConfig, MonoCheckHandle };
export type { MonoEditableTrigger, MonoEditorNavKeys, MonoEditorDirection };
/** `:sort.prop` object on `mono-table-th`. */
export type TableThSort = MonoColumnSort;
/** Bind the controller with `.prop` (object props can't be string attributes). */
interface TableControlBase {
    dataGrid?: MonoTableController;
    'data-grid'?: MonoTableController;
    datagrid?: MonoTableController;
    /** Renamed — `:control-table` / `:controlTable` alias `dataGrid`. */
    controlTable?: MonoTableController;
    'control-table'?: MonoTableController;
    controltable?: MonoTableController;
}
/**
 * `mono-table-search` renders `mono-input`'s markup, so it accepts the same
 * appearance / sizing / state props — a search box and a `<mono-input>` beside it
 * in a toolbar look identical. Not included (no meaning for a filter): `type`
 * (pinned to `search`), `required` / `pattern` / `min` / `max` / `step`, and
 * `value` / `modelValue` (the debounce + the controller own the search term).
 */
export interface TableSearchProps extends TableControlBase {
    placeholder?: string;
    disabled?: boolean;
    debounce?: number;
    /** Hide the leading search icon. */
    noIcon?: boolean;
    'no-icon'?: boolean;
    /**
     * Which fields a term matches — a comma string or an array, over the same
     * grammar as `monoDataGrid({ searchExpr })` (paths, `*` patterns,
     * `{ field, custom }`). Replaces the controller's own option.
     * `searchExpr` / `search-expr` is the same prop under the grid's older name.
     */
    searchValue?: MonoSearchValue;
    'search-value'?: MonoSearchValue;
    searchvalue?: MonoSearchValue;
    searchExpr?: MonoSearchValue;
    'search-expr'?: MonoSearchValue;
    searchexpr?: MonoSearchValue;
    /**
     * Show a suggestion dropdown under the field — an "all fields" row plus one per
     * registered `mono-table-th` (a plain native `<th>` contributes nothing).
     * While it is open, Enter always applies the ACTIVE suggestion.
     */
    suggestion?: boolean;
    /**
     * Turn each accepted suggestion into a removable chip so several terms stack.
     * Terms group by column: **OR within a column, AND across columns**.
     */
    multiContext?: boolean;
    'multi-context'?: boolean;
    /** Suggestion wording; `{caption}` and `{term}` are substituted. */
    suggestionTemplate?: string;
    'suggestion-template'?: string;
    /** Label of the leading "every column" suggestion row. */
    allFieldsLabel?: string;
    'all-fields-label'?: string;
    /**
     * Max context chips shown inline inside the field; the rest collapse into a
     * `${moreLabel}` chip that opens a panel listing them. `0` shows none inline
     * (just the trigger chip); a large value disables the collapse.
     */
    maxChips?: number;
    'max-chips'?: number;
    /** Label of the chip that opens the overflow panel (default `See All`). */
    moreLabel?: string;
    'more-label'?: string;
    /**
     * Label of the filter chip rendered when a slotted
     * `<mono-filter-builder slot="filter-builder">` applies its filter with
     * `multi-context` on (default `Filter`).
     */
    filterLabel?: string;
    'filter-label'?: string;
    /** Visual size of the field. */
    size?: InputSize;
    /** Theme color applied to focus, borders and accents. */
    color?: InputColor;
    /** Visual style of the field (outlined, filled or underlined). */
    variant?: InputVariant;
    /** Read-only while still focusable. */
    readonly?: boolean;
    /** Show a clear button once there is a search term (clears without waiting for the debounce). */
    clearable?: boolean;
    /** Focus the field on first render. */
    autofocus?: boolean;
    /** Label text displayed above the field. */
    label?: string;
    /** Helper text shown below the field. */
    helperText?: string;
    'helper-text'?: string;
    helpertext?: string;
    /** Explicit validation state for styling and messaging. */
    validationState?: InputValidationState;
    'validation-state'?: InputValidationState;
    validationstate?: InputValidationState;
    /** Validation message shown below the field. */
    validationMessage?: string;
    'validation-message'?: string;
    validationmessage?: string;
    /** Marks the field in an error state. */
    error?: boolean;
    errorMessage?: string;
    'error-message'?: string;
    errormessage?: string;
    /** Marks the field in a success state. */
    success?: boolean;
    successMessage?: string;
    'success-message'?: string;
    successmessage?: string;
    /** Form field name on the inner input. */
    name?: string;
    /** Native autocomplete hint. */
    autocomplete?: string;
    /** Native inputmode hint for the on-screen keyboard. */
    inputmode?: string;
    minLength?: number;
    'min-length'?: number;
    minlength?: number;
    maxLength?: number;
    'max-length'?: number;
    maxlength?: number;
    /** Accessible label for the inner input. */
    ariaLabelText?: string;
    'aria-label'?: string;
    /**
     * Explicit sizing. Each accepts a CSS length string (`"420px"`, `"80%"`) or a
     * number (px). The field defaults to `width: 100%` with a `180px` floor.
     */
    width?: string | number;
    height?: string | number;
    minWidth?: string | number;
    'min-width'?: string | number;
    maxWidth?: string | number;
    'max-width'?: string | number;
    minHeight?: string | number;
    'min-height'?: string | number;
    maxHeight?: string | number;
    'max-height'?: string | number;
    /** Per-part class overrides — same keys as `mono-input`'s `cssClass`. */
    cssClass?: InputCssClass;
    /** Root class only. */
    'css-class'?: string;
}
export interface TablePagingProps extends TableControlBase {
    /**
     * Paging mode (flat tables only):
     * - `standard` (default) — numbered buttons + prev/next arrows.
     * - `infinity-scroll` — scrolling to the end auto-loads & appends the next page.
     * - `virtual-scroll` — like infinity, but only the height-visible rows render
     *   (windowed slice + spacer rows) so huge datasets stay light.
     */
    type?: 'standard' | 'infinity-scroll' | 'virtual-scroll';
    /** How many numbered buttons to show around the current page (default 1). standard only. */
    siblings?: number;
    /** Hide the numbered buttons, keep only Prev / Next. standard only. */
    simple?: boolean;
    /**
     * Icon class for the previous-page arrow (default `i-mdi-chevron-left`). A global
     * utility class, resolved by your icon tooling — the shadow build inlines an SVG
     * for the defaults instead, since page CSS cannot cross a shadow boundary.
     */
    prevIcon?: string;
    'prev-icon'?: string;
    previcon?: string;
    /** Icon class for the next-page arrow (default `i-mdi-chevron-right`). */
    nextIcon?: string;
    'next-icon'?: string;
    nexticon?: string;
    /**
     * Page size (rows per page / scroll chunk). Set it to OVERRIDE the bound
     * DataSource's configured `pageSize`; omit to use the DataSource's own pageSize.
     */
    size?: number;
    /** Fixed row height in px used to size the virtual window + spacers (default 44). */
    rowHeight?: number;
    'row-height'?: number;
    /** CSS selector for the scroll container; defaults to the nearest `.mono-table-scroll`. */
    scrollTarget?: string;
    'scroll-target'?: string;
    /** Px from the end at which the next page auto-loads (default 200). */
    threshold?: number;
    /** Extra rows rendered above/below the virtual window (default 6). */
    overscan?: number;
}
/**
 * `mono-table-paging-group` — pages the rows inside ONE group. Distinct from
 * {@link TablePagingProps}: it targets a single group (`group`) and carries its
 * own per-group page size, rather than paging the grid.
 */
export interface TablePagingGroupProps extends TableControlBase {
    /** The group to paginate — its node (bind with `.prop`) or its `path` string. */
    group?: MonoGroupNode | string;
    /** Rows per group-page (default 5). */
    pageSize?: number;
    'page-size'?: number;
    /** Numbered buttons shown around the current page, each side (default 1). */
    siblings?: number;
    /** Only Prev / "X / Y" / Next — no numbered buttons. */
    simple?: boolean;
}
export interface TablePageSizeProps extends TableControlBase {
    /** Options for the select (default [10, 20, 50, 100]). */
    sizes?: number[] | string;
    label?: string;
}
export interface TableInfoProps extends TableControlBase {
    /** Override the "Showing {from}–{to} of {total}" template. */
    template?: string;
}
/**
 * `mono-table-summary` — an aggregate footer cell. Drop it into a `<tfoot>` cell
 * in the column you want summarized and bind the controller with `:data-grid.prop`.
 * The aggregate (type, formatting) is configured centrally in
 * `monoDataGrid(data, { summary: [...] })`; the element only names which one to
 * show. A `field` with no central spec falls back to a `sum`.
 */
export interface TableSummaryProps extends TableControlBase {
    /** Data field to summarize (path-aware). */
    field?: string;
    /** Pick a specific aggregate when the field has several specs. */
    type?: MonoSummaryType;
    /** Pick a specific spec by its `name` when the field has several. */
    name?: string;
}
export interface TableSortProps extends TableControlBase {
    /** Column to sort by. Omit for a plain, non-sortable label. */
    field?: string;
    /** Header text (falls back to the element's text content). */
    caption?: string;
    disabled?: boolean;
    /**
     * Whether the control is sortable at all (default `true`). `enable="false"`
     * renders a plain label — the counterpart of `sort: { enable: false }`.
     */
    enable?: boolean;
    /** Cycle asc ↔ desc only, never clearing. */
    noClear?: boolean;
    'no-clear'?: boolean;
    /**
     * Show the sort arrow (default `true`). The arrow is the single-sort click
     * target, so hiding it moves that trigger onto the **label**. Right-click always
     * opens the `Sort ›` menu either way — the only way to build a multi-key sort.
     */
    showIcon?: boolean;
    'show-icon'?: boolean;
}
/**
 * `mono-table-th` — the unified header cell. Declares a column's `field`/`caption`,
 * folds sorting into `:sort.prop`, and marks a column editable with `editable`.
 * (`mono-table-sort` remains supported for sort-only headers.)
 */
export interface TableThProps extends TableControlBase {
    /**
     * Column field — a plain key or a **path expression** into nested / collection
     * data: `"Job.Name"` (nested), `"User.[1].Id"` (index), `"User.[*].Name"`
     * (wildcard). `.`/`[` are reserved.
     */
    field?: string;
    caption?: string;
    /** Bind with `.prop`: `{ order?: 'asc' | 'desc'; noClear?: boolean; disabled?: boolean }`. */
    sort?: MonoColumnSort;
    /** Whether the column's cells are editable (default `false`). */
    editable?: boolean;
    /**
     * How a row's inline editor opens — `'click'` (default) or `'double-click'`.
     * Opening a row is a table-wide behaviour, so this writes through to the shared
     * controller and applies to every row; leave it unset to inherit
     * `monoDataGrid(data, { editableTrigger })`. Rows need only `data-row-key` —
     * the grid binds the listener. Clicks on an editor or on an interactive control
     * (button / link / form field) never open the editor.
     */
    editableTrigger?: MonoEditableTrigger;
    'editable-trigger'?: MonoEditableTrigger;
    /**
     * Draw a red `*` after the caption, so the column reads as one that wants input
     * (default `false`) — the same marker the form controls draw for their own
     * `required`. Presentation only: `editable` is what makes a column editable, and
     * this enforces nothing.
     */
    required?: boolean;
    /**
     * Header filter for this column (default `false`). `true` takes every default:
     * a funnel icon left of the caption which opens a checkbox list of the column's
     * distinct values → Apply. Right-clicking the header reaches the same panel via
     * the menu's `Header Filter ›` row. Pass an object to set the panel `title`,
     * hide the icon (`showIcon`) or shape the distinct-values query
     * (`dataSourceOptions`). See {@link MonoHeaderFilter}.
     *
     * An object form needs `.prop` binding (or `props.th`) — an attribute can only
     * carry the boolean.
     */
    headerFilter?: boolean | MonoHeaderFilter;
    'header-filter'?: boolean | MonoHeaderFilter;
    /**
     * Header alignment — `'left' | 'center' | 'right'`, applied to the parent `<th>`.
     * The body cells are your own markup; read the same column entry back in your
     * `<td>` loop so the two sides cannot drift.
     */
    align?: 'left' | 'center' | 'right';
    /** Column width, applied to the parent `<th>`. Number → px; string used as-is (`'10rem'`, `'40%'`). */
    width?: string | number;
    /** Header-cell height, applied to the parent `<th>`. Number → px; string used as-is. */
    height?: string | number;
}
/**
 * `mono-table-loading` — a drop-in spinner overlay. Place it inside your
 * `<table>` (or `.mono-table-scroll`) and bind the controller with
 * `:data-grid.prop`; it auto-shows over the rows whenever the controller is
 * fetching (sort / search / paging / reload / save) and freezes the grid height
 * so it can't collapse mid-query.
 */
/**
 * `mono-table-checkbox` — row selection that knows about the grid. Put one in a
 * `<th>` as the select-all (`type="all"`) and one per row (`:item.prop="row"`);
 * read the result with `table.check().getAll()`. Takes `mono-checkbox`'s
 * appearance props, which it renders with the same classes.
 */
export interface TableCheckboxProps extends TableControlBase {
    /** `'single'` (a row, the default) or `'all'` (the select-all). */
    type?: 'all' | 'single';
    /** The row this checkbox represents — `type="single"`. Bind with `.prop`. */
    item?: unknown;
    /**
     * Field(s) `check().getAll()` projects each selected row down to. Path-aware
     * and shape-preserving — `['Company.Name', 'Transaction.[*].Id']` yields
     * `{ Company: { Name }, Transaction: [{ Id }] }`. Omit for whole rows.
     */
    keyValue?: string | string[];
    'key-value'?: string | string[];
    keyvalue?: string | string[];
    /**
     * `'all'` (default) drains the source in `chunk`-sized requests and selects
     * every row the active search/filter matches; `'per-page'` selects the loaded
     * page with no request.
     */
    mode?: MonoCheckMode;
    /** Rows per request while draining in `mode="all"` (default 100). */
    chunk?: number;
    /** Visual size of the box. */
    size?: CheckboxSize;
    /** Theme color of the box. */
    color?: CheckboxColor;
    disabled?: boolean;
    /** Label text shown next to the box. */
    label?: string;
    /** Secondary line under the label. `slot="sublabel"` replaces it. */
    sublabel?: string;
    /** The same as `sublabel` — still accepted, both names share one value. */
    description?: string;
    ariaLabelText?: string;
    'aria-label-text'?: string;
    arialabeltext?: string;
    /** Per-part class overrides — same keys as `mono-checkbox`'s `cssClass`. */
    cssClass?: CheckboxCssClass;
    /** Root class only. */
    'css-class'?: string;
}
/**
 * `mono-table-detail` — the expand/collapse chevron for a row. Put it in a `<td>`
 * of the row and slot the panel content into it; the element inserts that content
 * as a full-width `<tr>` right below the row while open. Bind the controller with
 * `:control-table.prop` (or `:data-grid.prop`) to pick up `props: { detail }` and
 * to take part in `table.detail().collapseAll()`.
 */
export interface TableDetailProps extends TableControlBase {
    /** Icon class shown while collapsed (default `i-mdi-chevron-right`). */
    icon?: string;
    /** Icon class shown while expanded (default `i-mdi-chevron-down`). */
    iconExpanded?: string;
    'icon-expanded'?: string;
    iconexpanded?: string;
    /** Whether the panel is showing (reflected as the `open` attribute). */
    open?: boolean;
    /**
     * Exempt this row from every automatic close — the accordion (opening another
     * row) and `table.detail().collapseAll()`. Not a lock: its own chevron still
     * closes it. Set it on every row to allow many panels open at once.
     */
    stayOpen?: boolean;
    'stay-open'?: boolean;
    stayopen?: boolean;
    /** Disable the toggle. */
    disabled?: boolean;
    /** Accessible label for the toggle button (default `Toggle details`). */
    label?: string;
}
export interface TableErrorProps extends TableControlBase {
    /**
     * Show this instead of whatever the controller caught. Wins while set; clear it
     * and a caught error shows through again.
     */
    message?: string;
    /** Offer the `×` at the right edge (default `true`). */
    dismissible?: boolean;
    /** Its `aria-label` (default `'Dismiss'`). */
    closeLabel?: string;
    'close-label'?: string;
    /**
     * What a failure does to the rows on screen: `'clear-list'` (default) empties
     * them so a rejected query never shows the previous one's rows; `'keep-list'`
     * leaves them. Written through to the controller.
     */
    behaviour?: 'clear-list' | 'keep-list';
    /** Offer the ↻ that re-runs the failed query (default `true`). */
    reload?: boolean;
    /** Its `aria-label` (default `'Reload'`). */
    reloadLabel?: string;
    'reload-label'?: string;
}
export interface TableEmptyProps extends TableControlBase {
    /**
     * Glyph above the title — an iconify class (`i-mdi-database-off`) or anything
     * else (an emoji, a letter), which renders as text.
     * Default `'i-mdi-help-circle-outline'`; `''` drops it.
     */
    icon?: string;
    /** Headline. Default `'No Data found'`; `''` drops it. */
    title?: string;
    /**
     * Supporting line under it. Default `'Try adjusting your search or filters.'`;
     * `''` drops it.
     */
    subtitle?: string;
    /**
     * Offer a reload button under the subtitle (default `true`). Only rendered when
     * a controller is bound — there is nothing for it to reload otherwise.
     */
    reload?: boolean;
    /** Label on that button (default `'Reload'`). */
    reloadLabel?: string;
    'reload-label'?: string;
    /**
     * Fixed height for the reserved area — any CSS length. Wins over `minHeight`,
     * `maxHeight` and the auto-grow.
     */
    height?: string;
    /** Floor for it (default `--mono-table-empty-min-h`, `12rem`). */
    minHeight?: string;
    'min-height'?: string;
    /** Ceiling for it — caps the auto-grow on a tall message. */
    maxHeight?: string;
    'max-height'?: string;
}
export interface TableLoadingProps extends TableControlBase {
    /**
     * Minimum time (ms) to keep the overlay up once shown, so a fast query still
     * flashes a perceptible spinner (default `350`). `0` disables the hold.
     */
    minDuration?: number;
    'min-duration'?: number;
    /**
     * Manual control. Omitted / `null` = automatic (shown while the bound controller is fetching).
     * `true` / `false` = shown / hidden by you, the controller ignored — `:loading="isBusy"`.
     */
    loading?: boolean | null;
}
