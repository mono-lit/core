import { Constructor } from "../../composables/hybird-prop.js";
import { CssSizeValue } from "../../composables/css-size.js";
import { DateColor, DateCssClass, DateMode, DateSize, DateType, DateValidationState, DateVariant } from "./date-types.js";
import { FieldTooltipController, FieldTooltipValue } from "../../composables/field-tooltip.js";
import { LitElement, TemplateResult } from "lit";
import { Options } from "flatpickr/dist/types/options";
//#region src/components/date/date-core.d.ts
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
  tooltip: FieldTooltipValue;
  protected readonly _tooltip: FieldTooltipController;
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
  defaultDate?: Options['defaultDate'];
  minDate?: Options['minDate'];
  maxDate?: Options['maxDate'];
  disable?: Options['disable'];
  enable?: Options['enable'];
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
  position?: Options['position'];
  ariaDateFormat?: string;
  locale?: Options['locale'];
  options?: Partial<Options>;
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
//#endregion