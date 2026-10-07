import { PanelSizeProps } from '../../composables/css-size';
import { MonoDataSource, LoadMoreMode } from '../../composables/data-source-controller';
import { VisibilityProps } from '../../composables/visibility';
import { MonoSearchValue } from '../../search/data-search';
/**
 * Sizes the popup PANEL only, independent of the field — the same object
 * `<mono-tag-input>` and `<mono-dropdown-table>` take. `height` is an exact height and
 * `maxHeight` the cap.
 */
export type SelectDropdownOptions = PanelSizeProps;
export type SelectSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'xxl';
export type SelectColor = 'primary' | 'secondary' | 'success' | 'danger' | 'warning' | 'info' | 'teal' | 'purple' | 'neutral' | 'dark';
export type SelectVariant = 'outlined' | 'filled' | 'underlined';
export type SelectValidationState = 'default' | 'valid' | 'invalid' | 'warning';
export type SelectValue = unknown;
export interface SelectItem {
    label?: string;
    value?: unknown;
    disabled?: boolean;
    [key: string]: unknown;
}
/**
 * A field name, or an accessor over the consumer's OWN row type. The parameter is
 * `any` on purpose (matching `monoDataDropdown`'s `displayExpr`): under
 * `strictFunctionTypes` a `(row: User) => string` is not assignable to
 * `(item: SelectItem) => string`, and the row type is the consumer's to know.
 */
export type SelectDisplayValue = string | ((item: any) => string);
/**
 * Per-level accessors for grouped options — one entry per group level. Each
 * resolves a group header's label from a representative leaf row of that group:
 * a string reads `row[field]`; a function receives the row.
 */
export type SelectDisplayGroup = Array<string | ((item: any) => string)>;
/** Re-exported so consumers can type a `search-value` binding without a deep import. */
export type { MonoSearchValue };
/**
 * Structural shape of a devextreme DataSource (duck-typed; no hard dependency).
 * Aliased to the shared {@link MonoDataSource} so select and other components
 * share one definition.
 */
export type SelectDataSource<T = SelectItem> = MonoDataSource<T>;
/**
 * Incremental loading mode. Works with BOTH a paged DataSource and a plain
 * `items` array (the array is revealed one `page-size` chunk at a time):
 * - 'button' → render a "Load more" button at the end of the list.
 * - 'scroll' → load/reveal the next chunk when scrolled near the bottom.
 */
export type SelectLoadMore = LoadMoreMode;
/** @deprecated Use {@link SelectLoadMore}. */
export type SelectDataSourceLoadMore = SelectLoadMore;
export interface SelectCssClass {
    root?: string;
    label?: string;
    required?: string;
    trigger?: string;
    value?: string;
    placeholder?: string;
    searchField?: string;
    actions?: string;
    clear?: string;
    arrow?: string;
    dropdown?: string;
    dropdownBody?: string;
    group?: string;
    item?: string;
    itemActive?: string;
    itemSelected?: string;
    itemDisabled?: string;
    loadMore?: string;
    messageWrap?: string;
    message?: string;
}
export type SelectModelEventDetail<TValue = SelectValue> = {
    modelValue: TValue;
    currentValue: TValue;
    oldValue: TValue;
    value: TValue;
    selectedItem?: SelectItem;
    sourceEvent?: Event;
};
export type SelectModelEvent<TValue = SelectValue> = CustomEvent<SelectModelEventDetail<TValue>>;
export interface SelectProps extends VisibilityProps {
    /** The currently selected value. */
    modelValue?: SelectValue;
    'model-value'?: SelectValue;
    modelvalue?: SelectValue;
    /** Alias for the selected value, kept in sync with modelValue. */
    value?: SelectValue;
    /** List of selectable items, as an array or JSON string. */
    items?: SelectItem[] | string;
    /** DataSource used to drive the item list, taking precedence over items. */
    dataSource?: SelectDataSource;
    'data-source'?: SelectDataSource;
    datasource?: SelectDataSource;
    /** Auto-load the DataSource on attach when it has no items yet. */
    immediate?: boolean;
    /** Incremental loading mode: scroll, button, or off. */
    loadMore?: SelectLoadMore | boolean | '';
    'load-more'?: SelectLoadMore | boolean | '';
    loadmore?: SelectLoadMore | boolean | '';
    /** Chunk size used when paging a plain items array. */
    pageSize?: number;
    'page-size'?: number;
    pagesize?: number;
    /** Item property name used as the model value. */
    keyValue?: string;
    'key-value'?: string;
    keyvalue?: string;
    /** Item property name or function used to derive display text. */
    displayValue?: SelectDisplayValue;
    'display-value'?: SelectDisplayValue;
    displayvalue?: SelectDisplayValue;
    /** Per-level accessors for grouped options (header label per group level). */
    displayGroup?: SelectDisplayGroup;
    'display-group'?: SelectDisplayGroup;
    displaygroup?: SelectDisplayGroup;
    /** Field holding a group node's key (default 'key'). */
    groupKey?: string;
    'group-key'?: string;
    groupkey?: string;
    /** Field holding a group node's child array (default 'items'). */
    groupItems?: string;
    'group-items'?: string;
    groupitems?: string;
    /** Turn the field itself into a search input (combobox); server query when a DataSource is bound. */
    searchable?: boolean;
    /**
     * Field(s) the search matches (server query + client filter target). A comma
     * string or an array; entries may be plain columns, paths (`Company.Name`,
     * `Transaction.[*].Price`), `*` patterns (`'*'`, `'*.[*].*'`) or, in array
     * form, `{ field, custom }` clause builders.
     */
    searchValue?: MonoSearchValue;
    'search-value'?: MonoSearchValue;
    searchvalue?: MonoSearchValue;
    /** devextreme search operation for server search (default 'contains'). */
    searchOperation?: string;
    'search-operation'?: string;
    searchoperation?: string;
    /** Debounce (ms) before a server search fires (default 300). */
    searchDebounce?: number;
    'search-debounce'?: number;
    searchdebounce?: number;
    /** Placeholder shown in the field while it is open/searching (falls back to `placeholder`). */
    searchPlaceholder?: string;
    'search-placeholder'?: string;
    searchplaceholder?: string;
    /** Group a plain, paginated DataSource client-side (keeps scroll/load-more). */
    group?: boolean;
    /** Keep group headers pinned to the top while their rows scroll. */
    groupSticky?: boolean;
    'group-sticky'?: boolean;
    groupsticky?: boolean;
    /**
     * Sizes the popup PANEL only, independent of the field —
     * `:dropdown.prop="{ width: 460, maxHeight: 320 }"`.
     *
     * Without it the panel matches the field's width, which is right for a picker whose options read
     * as continuations of the field, and wrong for a wide one. Setting `width` also stops the panel
     * tracking the field.
     *
     * The widths land on the panel and the heights on its scrolling body, which is why a fixed
     * `height` here still scrolls rather than clipping.
     */
    dropdown?: SelectDropdownOptions;
    /** Fixed height of the scrollable dropdown list. */
    dropdownHeight?: string | number;
    'dropdown-height'?: string | number;
    dropdownheight?: string | number;
    /** Maximum height of the scrollable dropdown list. */
    dropdownMaxHeight?: string | number;
    'dropdown-max-height'?: string | number;
    dropdownmaxheight?: string | number;
    /**
     * Exempt this select from every automatic close — clicking or focusing
     * anything outside it, which includes opening another select. Not a lock: its
     * own trigger, Escape and picking an item still close it. Set it on every
     * select to allow several dropdowns open at once.
     */
    stayOpen?: boolean;
    'stay-open'?: boolean;
    stayopen?: boolean;
    /** Visual size of the select. */
    size?: SelectSize;
    /** Color theme applied to the select. */
    color?: SelectColor;
    /** Visual style variant of the select. */
    variant?: SelectVariant;
    /** Text label shown above the select. */
    label?: string;
    /** Placeholder text shown when no value is selected. */
    placeholder?: string;
    /** Helper text shown below the select. */
    helperText?: string;
    'helper-text'?: string;
    helpertext?: string;
    /** Validation state controlling the select's appearance. */
    validationState?: SelectValidationState;
    'validation-state'?: SelectValidationState;
    validationstate?: SelectValidationState;
    /** Validation message shown below the select. */
    validationMessage?: string;
    'validation-message'?: string;
    validationmessage?: string;
    /** Error message shown below the select. */
    errorMessage?: string;
    'error-message'?: string;
    errormessage?: string;
    /** Success message shown below the select. */
    successMessage?: string;
    'success-message'?: string;
    successmessage?: string;
    /** Form field name submitted with the value. */
    name?: string;
    /** Disables the select, preventing interaction. */
    disabled?: boolean;
    /** Makes the select read-only, blocking value changes. */
    readonly?: boolean;
    /** Marks the select as required and shows a required indicator. */
    required?: boolean;
    /** Shows a clear button to reset the selected value. */
    clearable?: boolean;
    /** Accessible label used when no visible label is present. */
    ariaLabelText?: string;
    ariaLabel?: string;
    'aria-label'?: string;
    'aria-label-text'?: string;
    arialabel?: string;
    arialabeltext?: string;
    /**
     * Explicit sizing of the field. Each accepts a CSS length string (`"320px"`,
     * `"80%"`) or a number (interpreted as px). Use `width="100%"` for full width.
     * (Distinct from `dropdownHeight`/`dropdownMaxHeight`, which size the popup.)
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
    /** Custom CSS classes applied to internal select parts. */
    cssClass?: SelectCssClass;
    cssclass?: SelectCssClass;
    'css-class'?: SelectCssClass | string;
}
export interface SelectEvents {
    change: SelectModelEvent;
    clear: SelectModelEvent;
    'mno-change': SelectModelEvent;
    mnoChange: SelectModelEvent;
    'mno-clear': SelectModelEvent;
    mnoClear: SelectModelEvent;
}
