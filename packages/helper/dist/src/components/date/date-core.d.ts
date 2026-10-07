import { LitElement, TemplateResult } from 'lit';
import { DateType, DateSize, DateColor, DateVariant, DateValidationState, DateMode, DateCssClass } from './date-types.js';
import { Options as FlatpickrOptions } from 'flatpickr/dist/types/options';
import { Constructor } from '../../composables/hybird-prop';
import { CssSizeValue } from '../../composables/css-size';
/**
 * `MonoDateCore` — render-mode-agnostic logic for `mono-date` (props, hybrid
 * aliases, flatpickr instance lifecycle, validation/state, and the full
 * `render()`). SSR-safe: all DOM/`window` access (flatpickr init in
 * `firstUpdated`, the accent read in `_onReady`) is `isServer`-guarded, so the
 * server emits only the field markup and flatpickr is created on the client after
 * hydration. Each build supplies `createRenderRoot()` + `static styles`. Mirrors
 * `textarea-core`/`switch-core`.
 *
 * `mono-date` has no named slots — all content comes from props — so there is no
 * slot capture/scan machinery here. The calendar popup is owned by flatpickr
 * (appended to `<body>`, client-only, styled by the global bundle), so this needs
 * no `PopupPortalController`/`popup-stack`.
 */
export declare const MonoDateCore: <T extends Constructor<LitElement>>(superClass: T) => Constructor<MonoDateCoreInterface> & T;
/** Public surface added by the core mixin. */
export declare class MonoDateCoreInterface {
    type: DateType;
    modelValue: string;
    size: DateSize;
    color: DateColor;
    variant: DateVariant;
    label?: string;
    placeholder?: string;
    helperText?: string;
    validationState?: DateValidationState;
    validationMessage?: string;
    error: boolean;
    errorMessage?: string;
    success: boolean;
    successMessage?: string;
    disabled: boolean;
    readonly: boolean;
    required: boolean;
    clearable: boolean;
    ariaLabelText?: string;
    dateFormat?: string;
    altInput?: boolean;
    altFormat?: string;
    typeable?: boolean;
    clickOpens?: boolean;
    defaultDate?: FlatpickrOptions['defaultDate'];
    minDate?: FlatpickrOptions['minDate'];
    maxDate?: FlatpickrOptions['maxDate'];
    disable?: FlatpickrOptions['disable'];
    enable?: FlatpickrOptions['enable'];
    mode?: DateMode;
    enableSeconds?: boolean;
    time24hr?: boolean;
    hourIncrement?: number;
    minuteIncrement?: number;
    defaultHour?: number;
    defaultMinute?: number;
    inline?: boolean;
    weekNumbers?: boolean;
    monthSelectorType?: 'dropdown' | 'static';
    shorthandCurrentMonth?: boolean;
    position?: FlatpickrOptions['position'];
    ariaDateFormat?: string;
    locale?: FlatpickrOptions['locale'];
    options?: Partial<FlatpickrOptions>;
    width?: CssSizeValue;
    height?: CssSizeValue;
    minWidth?: CssSizeValue;
    maxWidth?: CssSizeValue;
    minHeight?: CssSizeValue;
    maxHeight?: CssSizeValue;
    cssClass: DateCssClass;
    cssClassName: string;
    readonly isOpen: boolean;
    open(): void;
    close(): void;
    toggle(): void;
    protected renderIcon(name: 'calendar' | 'clock' | 'close'): TemplateResult;
}
