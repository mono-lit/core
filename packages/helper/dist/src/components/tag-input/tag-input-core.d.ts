import { LitElement, TemplateResult } from 'lit';
import { TagInputSize, TagInputColor, TagInputVariant, TagInputChipProps, TagInputDropdownOptions, TagInputValidationState, TagInputValue, TagInputItem, TagInputDataSource, TagInputLoadMore, TagInputDisplayValue, TagInputDisplayGroup, TagInputCssClass } from './tag-input-types.js';
import { Constructor } from '../../composables/hybird-prop';
import { CssSizeValue } from '../../composables/css-size';
import { LateSlotWatcher } from '../../composables/light-slots';
import { MonoSearchValue } from '../../search/data-search.js';
/** Named slots projected by `mono-tag-input` (light: captured; shadow: native). */
export type TagInputSlotName = 'label' | 'helper' | 'list';
/**
 * `MonoTagInputCore` — render-mode-agnostic logic for `mono-tag-input` (props,
 * hybrid aliases, array value/model sync, DataSource paging, search, grouping,
 * keyboard, tag chips, the popup controller, and the full `render()`). SSR-safe:
 * every `document`/`window`/focus access is `isServer`-guarded. Each build
 * supplies `createRenderRoot()` + `static styles`, the slot strategy (light
 * captures children into `data-mono-slot` placeholders; shadow uses native
 * `<slot>`), and the `_slotOutlet` / `renderIcon` hooks. Mirrors `select-core`.
 */
export declare const MonoTagInputCore: <T extends Constructor<LitElement>>(superClass: T) => Constructor<MonoTagInputCoreInterface> & T;
/** Public + shared-protected surface added by the core mixin. */
export declare class MonoTagInputCoreInterface {
    /** True once a build has captured a `slot="list"`; swaps the generated rows for the slot. */
    protected _hasListSlotState: boolean;
    protected _lateListSlot: LateSlotWatcher;
    protected _onLateListSlot(): void;
    protected get _listSlotWrapper(): HTMLElement | null;
    protected _watchListChrome(): void;
    protected _stopWatchingListChrome(): void;
    protected _syncListChrome(): void;
    /** Per-build render point for the consumer's list wrapper. */
    protected renderListSlot(): TemplateResult;
    /** Delegated click over the consumer's rows, resolved by `data-mono-item-key`. */
    protected _onListSlotClick: (event: Event) => void;
    /** The list wrapper's parking spot, portal-aware. */
    protected readonly _listSlotTarget: HTMLElement | null;
    size: TagInputSize;
    color: TagInputColor;
    variant: TagInputVariant;
    chip: TagInputChipProps;
    modelValue: TagInputValue[];
    value: TagInputValue[];
    name: string;
    label: string;
    placeholder: string;
    helperText: string;
    validationState: TagInputValidationState;
    validationMessage: string;
    errorMessage: string;
    successMessage: string;
    ariaLabelText?: string;
    disabled: boolean;
    readonly: boolean;
    required: boolean;
    clearable: boolean;
    allowCustom: boolean;
    max?: number;
    min?: number;
    checkable: boolean;
    maxVisible?: number;
    minVisible?: number;
    items: TagInputItem[];
    dataSource: TagInputDataSource | null;
    immediate: boolean;
    loadMore?: TagInputLoadMore | '' | boolean;
    pageSize: number;
    dropdown?: TagInputDropdownOptions;
    dropdownHeight: string | number;
    dropdownMaxHeight: string | number;
    flip: boolean;
    shift: boolean;
    keyValue: string;
    displayValue: TagInputDisplayValue;
    displayGroup: TagInputDisplayGroup;
    groupKey: string;
    groupItems: string;
    group: boolean;
    groupSticky: boolean;
    selectAll: boolean;
    selectAllLabel: string;
    groupSelectAll: boolean;
    searchable: boolean;
    stayOpen: boolean;
    searchValue: MonoSearchValue;
    searchOperation: string;
    searchDebounce: number;
    cssClass: TagInputCssClass;
    cssClassName: string;
    width?: CssSizeValue;
    height?: CssSizeValue;
    minWidth?: CssSizeValue;
    maxWidth?: CssSizeValue;
    minHeight?: CssSizeValue;
    maxHeight?: CssSizeValue;
    focus(): void;
    blur(): void;
    readonly isOpen: boolean;
    open(): void;
    close(): void;
    toggle(): void;
    clearTags(): void;
    addTag(value: TagInputValue): void;
    removeTag(value: TagInputValue): void;
    protected _hasLabelSlotState: boolean;
    protected _hasHelperSlotState: boolean;
    protected get _slotsAlwaysRender(): boolean;
    protected _setSlotState(name: TagInputSlotName, has: boolean): void;
    protected _slotOutlet(name: TagInputSlotName, fallback?: unknown): TemplateResult;
    protected renderIcon(name: 'close'): TemplateResult;
}
