import { LitElement, TemplateResult } from 'lit';
import { TextareaSize, TextareaColor, TextareaVariant, TextareaValidationState, TextareaCssClass } from './textarea-types.js';
import { Constructor } from '../../composables/hybird-prop';
import { CssSizeValue } from '../../composables/css-size';
/** Named slots projected by `mono-textarea` (light: captured; shadow: native). */
export type TextareaSlotName = 'label' | 'helper';
/**
 * `MonoTextareaCore` — render-mode-agnostic logic for `mono-textarea` (props,
 * hybrid aliases, value/model sync, validation, char counter, auto-resize, and
 * the full `render()`). SSR-safe: the only DOM/`window` access (`_syncAutoResize`)
 * is `isServer`-guarded. Each build supplies `createRenderRoot()` + `static styles`
 * and the slot strategy via the `_slotOutlet` hook (light: `data-mono-slot`
 * placeholders; shadow: native `<slot>`). Mirrors `switch-core`/`select-core`.
 */
export declare const MonoTextareaCore: <T extends Constructor<LitElement>>(superClass: T) => Constructor<MonoTextareaCoreInterface> & T;
/** Public + shared-protected surface added by the core mixin. */
export declare class MonoTextareaCoreInterface {
    size: TextareaSize;
    color: TextareaColor;
    variant: TextareaVariant;
    modelValue: string;
    value: string;
    name: string;
    placeholder: string;
    label: string;
    helperText: string;
    validationState: TextareaValidationState;
    validationMessage: string;
    errorMessage: string;
    successMessage: string;
    ariaLabelText?: string;
    disabled: boolean;
    readonly: boolean;
    required: boolean;
    autofocus: boolean;
    autoResize: boolean;
    showCounter: boolean;
    rows?: number;
    minRows?: number;
    maxRows?: number;
    minLength?: number;
    maxLength?: number;
    cssClass: TextareaCssClass;
    cssClassName: string;
    width?: CssSizeValue;
    height?: CssSizeValue;
    minWidth?: CssSizeValue;
    maxWidth?: CssSizeValue;
    minHeight?: CssSizeValue;
    maxHeight?: CssSizeValue;
    focus(): void;
    blur(): void;
    select(): void;
    setSelectionRange(start: number, end: number, direction?: 'forward' | 'backward' | 'none'): void;
    protected _hasLabelSlotState: boolean;
    protected _hasHelperSlotState: boolean;
    protected get _slotsAlwaysRender(): boolean;
    protected _setSlotState(name: TextareaSlotName, has: boolean): void;
    protected _slotOutlet(name: TextareaSlotName, fallback?: unknown): TemplateResult;
}
