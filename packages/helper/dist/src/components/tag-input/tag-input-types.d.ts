import { MonoDataSource, LoadMoreMode } from '../../composables/data-source-controller';
import { PanelSizeProps } from '../../composables/css-size';
import { VisibilityProps } from '../../composables/visibility';
import { MonoSearchValue } from '../../search/data-search';
import { ChipBehaviour, ChipColor, ChipCssClass, ChipRounded, ChipSize, ChipVariant } from '../chip/chip-types';
import { ChipLimitProps } from '../../composables/chip-limits';
/** Re-exported so consumers can type a `search-value` binding without a deep import. */
export type { MonoSearchValue };
/** The `max` / `min` / `maxVisible` / `minVisible` keys the `chip` object accepts. */
export type { ChipLimitProps };
/** Re-exported so consumers can type a `chip.behaviour` without a deep import. */
export type { ChipBehaviour };
export type TagInputSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'xxl';
export type TagInputColor = 'primary' | 'secondary' | 'success' | 'danger' | 'warning' | 'info' | 'teal' | 'purple' | 'neutral' | 'dark';
export type TagInputVariant = 'outlined' | 'filled' | 'underlined';
/**
 * Configuration for the tag chips inside the field, passed as one object:
 * `<mono-tag-input :chip.prop="{ size: 'md', shape: 'rounded', dot: true }">`.
 *
 * The tags are rendered as `mono-chip` markup and painted by `chip.css`, so
 * every key here is the corresponding {@link MonoChipProps} prop and takes the
 * same values. Anything left unset follows the control instead of a fixed
 * default:
 *
 * - `color` — defaults to the control's `color`. Setting it pins the chips to a
 *   hue of their own, and they stop tracking `--mono-tag-input-focus-color`.
 * - `variant` — defaults to a skin matching the control's `variant`
 *   (`outlined` → `soft`, `filled` → `solid`, `underlined` → `outline`).
 * - `size` — defaults to `sm`. The chip scale is independent of the control
 *   height scale, so pick the step that sits well in your field.
 * - `shape` — defaults to `pill`.
 *
 * Props the control owns are deliberately absent: the label comes from the tag
 * value, `removable` follows `disabled`/`readonly`, and `href`/`selected` have
 * no meaning for a tag.
 */
export interface TagInputChipProps extends ChipLimitProps {
    /**
     * How the chips are laid out in the field. Default `flex` — they wrap onto
     * new lines and the field grows taller.
     *
     * `inline` keeps them on ONE line in a horizontally scrolling strip, so the
     * field never changes height. The strip is moved ONLY by the `‹` / `›`
     * buttons rendered before the clear button / caret: no scrollbar is painted,
     * and wheel, click-drag and arrow-key scrolling are all inert.
     *
     * {@link TagInputProps.maxVisible} applies in both layouts: past it the rest
     * collapse into a "+N more" chip (in the strip, when inline) whose panel
     * lists them.
     */
    behaviour?: ChipBehaviour;
    /** Chip scale. Default `sm`. */
    size?: ChipSize;
    /** Chip hue. Defaults to the control's `color`; setting it pins the chips. */
    color?: ChipColor;
    /** Chip skin. Defaults to the skin matching the control's `variant`. */
    variant?: ChipVariant;
    /** Corner radius. Unset keeps the pill a chip has by default. */
    rounded?: ChipRounded;
    /** Show a status dot before each tag label. */
    dot?: boolean;
    /** Accessible label for the remove button. Default `Remove <tag>`. */
    closeLabel?: string;
    /** Per-part class overrides, same keys as `mono-chip`'s `cssClass`. */
    cssClass?: ChipCssClass;
}
export type TagInputValidationState = 'default' | 'valid' | 'invalid' | 'warning';
export type TagInputValue = unknown;
export interface TagInputItem {
    label?: string;
    value?: unknown;
    description?: string;
    disabled?: boolean;
    [key: string]: unknown;
}
/** A field name or an accessor over the consumer's own row type — see `SelectDisplayValue`. */
export type TagInputDisplayValue = string | ((item: any) => string);
/**
 * Per-level accessors for grouped options — one entry per group level. Each
 * resolves a group header's label from a representative leaf row: a string reads
 * `row[field]`; a function receives the row.
 */
export type TagInputDisplayGroup = Array<string | ((item: any) => string)>;
/**
 * Structural shape of a devextreme DataSource (duck-typed; no hard dependency).
 * Aliased to the shared {@link MonoDataSource}.
 */
export type TagInputDataSource<T = TagInputItem> = MonoDataSource<T>;
/**
 * Incremental loading mode. Works with BOTH a paged DataSource and a plain
 * `items` array (revealed one `page-size` chunk at a time):
 * - 'button' → render a "Load more" button at the end of the suggestions.
 * - 'scroll' → load/reveal the next chunk when scrolled near the bottom.
 */
export type TagInputLoadMore = LoadMoreMode;
export interface TagInputCssClass {
    root?: string;
    label?: string;
    required?: string;
    field?: string;
    chip?: string;
    chipLabel?: string;
    chipRemove?: string;
    /** The one-line scrolling chip strip (`chip.behaviour: 'inline'` only). */
    chipStrip?: string;
    native?: string;
    /** The trailing actions row holding the scroll buttons and clear / caret. */
    actions?: string;
    clear?: string;
    /** The caret — shown in place of `clear` while the field has nothing to clear. */
    arrow?: string;
    /** The `‹` scroll-back button (inline only). */
    scrollPrev?: string;
    /** The `›` scroll-forward button (inline only). */
    scrollNext?: string;
    dropdown?: string;
    group?: string;
    /** The group header's label, when the header is a select-all button. */
    groupLabel?: string;
    /** The leading "All" row. Sits alongside `item`, which it also carries. */
    selectAll?: string;
    item?: string;
    itemActive?: string;
    itemSelected?: string;
    itemDisabled?: string;
    check?: string;
    itemText?: string;
    itemTitle?: string;
    itemSub?: string;
    empty?: string;
    loadMore?: string;
    moreChip?: string;
    morePanel?: string;
    messageWrap?: string;
    message?: string;
}
/**
 * Popup-panel sizing for {@link TagInputProps.dropdown}. Each key takes a CSS length string
 * (`"38rem"`, `"80%"`) or a number, read as px.
 *
 * `height` is an EXACT height and `maxHeight` the cap — the same split this component's
 * `dropdown-height` / `dropdown-max-height` attributes already carry.
 */
export type TagInputDropdownOptions = PanelSizeProps;
export type TagInputModelEventDetail<TValue = TagInputValue[]> = {
    modelValue: TValue;
    currentValue: TValue;
    oldValue: TValue;
    value: TValue;
    addedValue?: TagInputValue;
    removedValue?: TagInputValue;
    selectedItem?: TagInputItem;
    sourceEvent?: Event;
};
export type TagInputModelEvent<TValue = TagInputValue[]> = CustomEvent<TagInputModelEventDetail<TValue>>;
export interface TagInputProps extends VisibilityProps {
    /** Two-way bound array of selected tag values. */
    modelValue?: TagInputValue[];
    'model-value'?: TagInputValue[];
    modelvalue?: TagInputValue[] | string;
    /** Selected tag values (kept in sync with modelValue). */
    value?: TagInputValue[];
    /** Suggestion items to choose from. */
    items?: TagInputItem[] | string;
    /** DataSource driving the suggestions; takes precedence over items. */
    dataSource?: TagInputDataSource;
    'data-source'?: TagInputDataSource;
    datasource?: TagInputDataSource;
    /** DataSource-only: auto-load the source on attach when it has no items yet. */
    immediate?: boolean;
    /** Incremental loading mode; enabling defaults to scroll, button opts into a button. */
    loadMore?: TagInputLoadMore | boolean | '';
    'load-more'?: TagInputLoadMore | boolean | '';
    loadmore?: TagInputLoadMore | boolean | '';
    /** Chunk size used when paging a plain items array (default 10). */
    pageSize?: number;
    'page-size'?: number;
    pagesize?: number;
    /**
     * Sizes the popup PANEL only, independent of the field. Bind with `.prop`:
     * `:dropdown.prop="{ width: 460, maxHeight: 320 }"`.
     *
     * Without it the panel matches the field's width, which is the right default for a picker whose
     * options read as continuations of what was typed — and the wrong one for a full-width field,
     * where it leaves the option rows running the width of the page.
     *
     * `height` is an exact height and `maxHeight` the cap — the same split the `dropdown-height` /
     * `dropdown-max-height` attributes carry, and the same object `<mono-select>` and
     * `<mono-dropdown-table>` take.
     */
    dropdown?: TagInputDropdownOptions;
    /** Fixed height of the scrollable suggestions list. */
    dropdownHeight?: string | number;
    'dropdown-height'?: string | number;
    dropdownheight?: string | number;
    /** Max height of the scrollable suggestions list. */
    dropdownMaxHeight?: string | number;
    'dropdown-max-height'?: string | number;
    dropdownmaxheight?: string | number;
    /**
     * Exempt this tag-input from every automatic close — clicking or focusing
     * anything outside it, which includes opening another one. Not a lock: its own
     * trigger, Escape and picking an item still close it.
     */
    stayOpen?: boolean;
    'stay-open'?: boolean;
    stayopen?: boolean;
    /** Property name on each item used as the stored tag value. */
    keyValue?: string;
    'key-value'?: string;
    keyvalue?: string;
    /** Property name or selector function deriving each item's display text. */
    displayValue?: TagInputDisplayValue;
    'display-value'?: TagInputDisplayValue;
    displayvalue?: TagInputDisplayValue;
    /** Per-level accessors for grouped options (header label per group level). */
    displayGroup?: TagInputDisplayGroup;
    'display-group'?: TagInputDisplayGroup;
    displaygroup?: TagInputDisplayGroup;
    /** Field holding a group node's key (default 'key'). */
    groupKey?: string;
    'group-key'?: string;
    groupkey?: string;
    /** Field holding a group node's child array (default 'items'). */
    groupItems?: string;
    'group-items'?: string;
    groupitems?: string;
    /** Group a plain, paginated DataSource (or flat array) client-side. */
    group?: boolean;
    /** Keep group headers pinned to the top while their rows scroll. */
    groupSticky?: boolean;
    'group-sticky'?: boolean;
    groupsticky?: boolean;
    /**
     * Show a leading "All" row that selects / clears every option the current search
     * leaves visible (default `true`).
     */
    selectAll?: boolean;
    'select-all'?: boolean;
    selectall?: boolean;
    /** Label of the select-all row (default `'All'`). */
    selectAllLabel?: string;
    'select-all-label'?: string;
    selectalllabel?: string;
    /**
     * Turn every group header into its own select-all over that group's rows
     * (default `true`). Only rendered while the list is grouped.
     */
    groupSelectAll?: boolean;
    'group-select-all'?: boolean;
    groupselectall?: boolean;
    /** Whether typing in the field searches (default `true`; `false` = read-only input). */
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
    /** Size of the tag input. */
    size?: TagInputSize;
    /** Color theme of the tag input. */
    color?: TagInputColor;
    /** Visual style of the tag input. */
    variant?: TagInputVariant;
    /**
     * Tag chip configuration — the `mono-chip` props to apply to every tag.
     * Bind it as a real property (`:chip.prop="{ size: 'md' }"`); a plain
     * `chip='{"size":"md"}'` JSON attribute also works for static HTML.
     */
    chip?: TagInputChipProps | string;
    /** Text label shown above the field. */
    label?: string;
    /** Placeholder text shown when the input is empty. */
    placeholder?: string;
    /** Helper text shown below the field. */
    helperText?: string;
    'helper-text'?: string;
    helpertext?: string;
    /** Validation state controlling field styling. */
    validationState?: TagInputValidationState;
    'validation-state'?: TagInputValidationState;
    validationstate?: TagInputValidationState;
    /** Message shown for the current validation state. */
    validationMessage?: string;
    'validation-message'?: string;
    validationmessage?: string;
    /** Error message that forces the invalid state. */
    errorMessage?: string;
    'error-message'?: string;
    errormessage?: string;
    /** Success message that forces the valid state. */
    successMessage?: string;
    'success-message'?: string;
    successmessage?: string;
    /** Form field name for the underlying input. */
    name?: string;
    /** Disables interaction with the tag input. */
    disabled?: boolean;
    /** Makes the tag input read-only. */
    readonly?: boolean;
    /** Marks the field as required. */
    required?: boolean;
    /** Shows a clear button to remove all tags. */
    clearable?: boolean;
    /** Allows adding custom tags not present in the items. */
    allowCustom?: boolean;
    'allow-custom'?: boolean;
    allowcustom?: boolean;
    /** Allows duplicate tag values. */
    duplicate?: boolean;
    /**
     * Most tags the user can select; unset = unlimited. A pick past it is
     * rejected — nothing is disabled, the pick just does not land (a typed tag is
     * dropped, the query reset); bulk adds fill only the room left. `chip.max`
     * pins over it. A `model-value` pushed in is never trimmed.
     */
    max?: number;
    /**
     * Fewest tags the user can leave; unset = 0. At the floor the chips lose their
     * ✕, a deselect / Backspace is rejected, the clear button hides and a bulk
     * deselect keeps the first `min`. `chip.min` pins over it.
     */
    min?: number;
    /** Checkbox multi-select mode (selected rows stay checked, dropdown stays open). */
    checkable?: boolean;
    /**
     * Chips drawn before the rest collapse into a clickable "+N more" chip whose
     * panel lists them. Display-only. Applies in `flex` AND `inline` — in the
     * strip the "+N more" chip sits after the visible chips. `chip.maxVisible`
     * pins over it.
     */
    maxVisible?: number;
    'max-visible'?: number;
    maxvisible?: number;
    /**
     * Collapse floor: while the selection is at or under this, every chip is drawn
     * regardless of `max-visible`. `chip.minVisible` pins over it.
     */
    minVisible?: number;
    'min-visible'?: number;
    minvisible?: number;
    /** Accessible label for screen readers. */
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
    /** Per-part class overrides for styling internal elements. */
    cssClass?: TagInputCssClass;
    cssclass?: TagInputCssClass;
    'css-class'?: TagInputCssClass | string;
}
export interface TagInputEvents {
    change: TagInputModelEvent;
    add: TagInputModelEvent;
    remove: TagInputModelEvent;
    clear: TagInputModelEvent;
    'mno-change': TagInputModelEvent;
    mnoChange: TagInputModelEvent;
    'mno-add': TagInputModelEvent;
    mnoAdd: TagInputModelEvent;
    'mno-remove': TagInputModelEvent;
    mnoRemove: TagInputModelEvent;
    'mno-clear': TagInputModelEvent;
    mnoClear: TagInputModelEvent;
}
