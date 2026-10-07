import { LitElement, TemplateResult } from 'lit';
import { SelectSize, SelectColor, SelectVariant, SelectValidationState, SelectValue, SelectItem, SelectDataSource, SelectLoadMore, SelectDisplayValue, SelectDisplayGroup, SelectCssClass, SelectDropdownOptions } from './select-types.js';
import { Constructor } from '../../composables/hybird-prop';
import { CssSizeValue } from '../../composables/css-size';
import { LateSlotWatcher } from '../../composables/light-slots';
import { MonoSearchValue } from '../../search/data-search.js';
/** Named slots projected by `mono-select` (light: captured; shadow: native). */
export type SelectSlotName = 'label' | 'helper' | 'prefix' | 'suffix' | 'list';
/**
 * `MonoSelectCore` — render-mode-agnostic logic for `mono-select` (props, hybrid
 * aliases, value/model sync, DataSource paging, search, grouping, keyboard nav,
 * the popup controller, and the full `render()`). SSR-safe: every `document` /
 * `window` / focus access is `isServer`-guarded.
 *
 * Each build supplies `createRenderRoot()` + `static styles`, the slot strategy
 * (light captures children into `data-mono-slot` placeholders; shadow uses native
 * `<slot>` + a `firstUpdated` scan), and the `_slotOutlet` / `renderIcon` hooks.
 * The shared `_has*SlotState` `@state` fields back both strategies.
 */
export declare const MonoSelectCore: <T extends Constructor<LitElement>>(superClass: T) => Constructor<MonoSelectCoreInterface> & T;
/** Public + shared-protected surface added by the core mixin (types the wrappers
 *  + the `HTMLElementTagNameMap` augmentation in the light build). */
export declare class MonoSelectCoreInterface {
    size: SelectSize;
    color: SelectColor;
    variant: SelectVariant;
    modelValue: SelectValue;
    value: SelectValue;
    name: string;
    label: string;
    placeholder: string;
    helperText: string;
    validationState: SelectValidationState;
    validationMessage: string;
    errorMessage: string;
    successMessage: string;
    ariaLabelText?: string;
    disabled: boolean;
    readonly: boolean;
    required: boolean;
    clearable: boolean;
    items: SelectItem[];
    dataSource: SelectDataSource | null;
    immediate: boolean;
    loadMore?: SelectLoadMore | '' | boolean;
    pageSize: number;
    dropdown?: SelectDropdownOptions;
    dropdownHeight: string | number;
    dropdownMaxHeight: string | number;
    flip: boolean;
    shift: boolean;
    keyValue: string;
    displayValue: SelectDisplayValue;
    displayGroup: SelectDisplayGroup;
    groupKey: string;
    groupItems: string;
    group: boolean;
    groupSticky: boolean;
    searchable: boolean;
    stayOpen: boolean;
    searchValue: MonoSearchValue;
    searchOperation: string;
    searchDebounce: number;
    searchPlaceholder: string;
    cssClass: SelectCssClass;
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
    protected _hasLabelSlotState: boolean;
    protected _hasHelperSlotState: boolean;
    protected _hasPrefixSlotState: boolean;
    protected _hasSuffixSlotState: boolean;
    protected _hasListSlotState: boolean;
    protected _lateListSlot: LateSlotWatcher;
    protected _onLateListSlot(): void;
    protected get _listSlotWrapper(): HTMLElement | null;
    protected _watchListChrome(): void;
    protected _stopWatchingListChrome(): void;
    protected _syncListChrome(): void;
    protected renderListSlot(): TemplateResult;
    protected _onListSlotClick: (event: Event) => void;
    protected readonly _listSlotTarget: HTMLElement | null;
    protected get _slotsAlwaysRender(): boolean;
    protected _toBoolean(value: unknown): boolean;
    protected _setSlotState(name: SelectSlotName, has: boolean): void;
    protected _slotOutlet(name: SelectSlotName, fallback?: unknown): TemplateResult;
    protected renderIcon(name: 'close' | 'chevron'): TemplateResult;
}
