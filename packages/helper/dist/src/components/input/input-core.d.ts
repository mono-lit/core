import { LitElement, nothing, TemplateResult } from 'lit';
import { InputType, InputSize, InputColor, InputVariant, InputValidationState, InputCssClass } from './input-types.js';
import { InputFormat, InputFormatOn } from './input-format.js';
import { Constructor } from '../../composables/hybird-prop';
import { buildSizeStyle, CssSizeValue } from '../../composables/css-size';
export declare const numberStringConverter: {
    fromAttribute(value: string | null): number | undefined;
    toAttribute(value: number | undefined): string | null;
};
export type InputSlotName = 'prefix' | 'suffix' | 'label' | 'helper';
/** Public surface added by the core mixin (for typing the wrappers + tag map). */
export declare class MonoInputCoreInterface {
    cssClass: InputCssClass;
    cssClassName: string;
    type: InputType;
    size: InputSize;
    color: InputColor;
    variant: InputVariant;
    modelValue: string;
    formatDisplay?: InputFormat;
    formatValue?: InputFormat;
    formatOn: InputFormatOn;
    formatLocale?: string;
    value: string;
    name: string;
    placeholder: string;
    label: string;
    helperText: string;
    validationState: InputValidationState;
    validationMessage: string;
    error: boolean;
    errorMessage: string;
    success: boolean;
    successMessage: string;
    pattern: string;
    autocomplete: string;
    inputmode: string;
    ariaLabelText?: string;
    minLength?: number;
    maxLength?: number;
    min?: number;
    max?: number;
    step?: number;
    disabled: boolean;
    readonly: boolean;
    required: boolean;
    clearable: boolean;
    autofocus: boolean;
    width?: CssSizeValue;
    height?: CssSizeValue;
    minWidth?: CssSizeValue;
    maxWidth?: CssSizeValue;
    minHeight?: CssSizeValue;
    maxHeight?: CssSizeValue;
    focus(): void;
    blur(): void;
    select(): void;
    protected _hasPrefixSlotState: boolean;
    protected _hasSuffixSlotState: boolean;
    protected _hasLabelSlotState: boolean;
    protected _hasHelperSlotState: boolean;
    protected readonly _hasPrefixSlot: boolean;
    protected readonly _hasSuffixSlot: boolean;
    protected readonly _hasLabelSlot: boolean;
    protected readonly _hasHelperSlot: boolean;
    protected readonly _inputId: string;
    protected readonly _messageId: string;
    protected readonly _resolvedValidationState: InputValidationState;
    protected readonly _wrapperClasses: string;
    protected readonly _fieldClasses: string;
    protected _cls(base: string, key: keyof InputCssClass): string;
    protected _sizeStyle(): ReturnType<typeof buildSizeStyle>;
    protected _renderWrapper(inner: TemplateResult): TemplateResult;
    protected _renderNative(): TemplateResult;
    protected _renderClear(): TemplateResult | typeof nothing;
    protected renderIcon(name: 'close'): TemplateResult;
}
/**
 * `MonoInputCore` — all render-mode-agnostic logic for `mono-input`: reactive
 * props, hybrid prop aliases (camelCase ↔ kebab ↔ lowercase), attribute
 * observation, value/model two-way sync, events, validation/class computation,
 * sizing, and imperative focus/blur/select.
 *
 * It deliberately leaves out:
 *  - `createRenderRoot()` (light vs shadow) — set by each wrapper.
 *  - the slot strategy + `render()` — light uses a capture/`data-mono-slot`
 *    hack; shadow uses native `<slot>` with slotchange-driven presence. The
 *    shared `_hasXxxSlotState` `@state` fields back both strategies and feed the
 *    class getters.
 */
export declare const MonoInputCore: <T extends Constructor<LitElement>>(superClass: T) => Constructor<MonoInputCoreInterface> & T;
