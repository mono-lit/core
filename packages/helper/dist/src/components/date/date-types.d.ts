import { VisibilityProps } from "../../composables/visibility.js";
import { MonoTooltipOptions } from "../tooltip/tooltip-types.js";
import { Options } from "flatpickr/dist/types/options";
//#region src/components/date/date-types.d.ts
/** Picker mode — drives flatpickr's calendar/time configuration. */
export type DateType = 'date' | 'datetime' | 'time';
export type DateSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'xxl';
export type DateColor = 'primary' | 'secondary' | 'success' | 'danger' | 'warning' | 'info' | 'teal' | 'purple' | 'neutral' | 'dark';
export type DateVariant = 'outlined' | 'filled' | 'underlined';
/** Where the label sits: above the box (default), notched into its top border (inset for filled / underlined), or beside it. */
export type DateLabelPosition = 'top' | 'notched' | 'left' | 'right';
/** Where the validation message shows: under the box (default), behind a state icon inside it, or floating under it on hover / focus. */
export type DateValidationPosition = 'bottom' | 'icon' | 'float';
/**
 * `error` / `success` are the date's own names; `invalid` / `valid` are accepted as
 * aliases — the names every other control (and `controlMonoForm`) uses.
 */
export type DateValidationState = 'default' | 'error' | 'success' | 'invalid' | 'valid';
/** flatpickr selection mode. */
export type DateMode = 'single' | 'multiple' | 'range';
export interface DateCssClass {
  root?: string;
  label?: string;
  required?: string;
  field?: string;
  icon?: string;
  native?: string;
  clear?: string;
  messageWrap?: string;
  message?: string;
}
/** Emitted on selection change. */
export interface DateChangeEventDetail {
  /** Formatted value string (flatpickr `dateStr`) — mirrors `modelValue`. */
  value: string;
  /** Same as `value`; read this for Vue `v-model` (`$event.detail.modelValue`). */
  modelValue: string;
  /** Raw selected Date objects (one for single, two for range, N for multiple). */
  dates: Date[];
  /** The flatpickr instance, for advanced access. */
  instance: unknown;
  sourceEvent?: Event;
}
export type DateChangeEvent = CustomEvent<DateChangeEventDetail>;
export type DateOpenEvent = CustomEvent<{
  dates: Date[];
  instance: unknown;
}>;
export type DateCloseEvent = CustomEvent<{
  dates: Date[];
  instance: unknown;
}>;
export interface DateEvents {
  change: DateChangeEvent;
  open: DateOpenEvent;
  close: DateCloseEvent;
  'mno-change': DateChangeEvent;
  mnoChange: DateChangeEvent;
  'mno-open': DateOpenEvent;
  mnoOpen: DateOpenEvent;
  'mno-close': DateCloseEvent;
  mnoClose: DateCloseEvent;
}
export interface DateProps extends VisibilityProps {
  /** Picker mode: `date` (default), `datetime`, or `time`. */
  type?: DateType;
  /** Selected value as a formatted string (two-way bound). */
  modelValue?: string;
  'model-value'?: string;
  modelvalue?: string;
  value?: string;
  /** Visual size / color / variant (mirror mono-input). */
  size?: DateSize;
  color?: DateColor;
  variant?: DateVariant;
  /**
   * Where the label sits: `top` (above the box, default), `notched` (on the top
   * border for outlined; inset inside the box for filled / underlined), or
   * `left` / `right` of the box. Knobs: `--mono-date-label-width`, `-label-side-gap`,
   * `-label-notch-font-size`, `-label-notch-bg`.
   */
  labelPosition?: DateLabelPosition;
  'label-position'?: DateLabelPosition;
  labelposition?: DateLabelPosition;
  /**
   * Where the validation message shows. `bottom` (default): the row under the box.
   * `icon`: a state icon inside the box; hover / tap / keyboard focus shows the message in
   * a state-coloured bubble. `float`: the message floats under the box only while the field
   * is hovered or focused. In `icon` / `float` the row under the box keeps the helper text.
   */
  validationPosition?: DateValidationPosition;
  'validation-position'?: DateValidationPosition;
  validationposition?: DateValidationPosition;
  /** Field label + helper / validation messaging. */
  label?: string;
  placeholder?: string;
  helperText?: string;
  'helper-text'?: string;
  /**
   * Info icon at the end of the label; hovering, focusing or tapping it shows this text.
   * Plain text → a small built-in bubble (no dependency). Full tooltip options
   * (`:tooltip.prop="{ content, placement, color }"`) → a `mono-tooltip`, which needs the
   * optional `@floating-ui/dom` + `@floating-ui/core` peers (without them that form renders
   * no icon). Shown only beside a label.
   */
  tooltip?: string | MonoTooltipOptions;
  validationState?: DateValidationState;
  'validation-state'?: DateValidationState;
  validationMessage?: string;
  'validation-message'?: string;
  error?: boolean;
  errorMessage?: string;
  'error-message'?: string;
  success?: boolean;
  successMessage?: string;
  'success-message'?: string;
  /** State flags. */
  disabled?: boolean;
  readonly?: boolean;
  required?: boolean;
  clearable?: boolean;
  ariaLabelText?: string;
  'aria-label-text'?: string;
  /** Output/parsing format, e.g. `"Y-m-d"`, `"d M Y"`, `"H:i"`. */
  dateFormat?: string;
  'date-format'?: string;
  /** Show a second, human-readable input while submitting `dateFormat`. */
  altInput?: boolean;
  'alt-input'?: boolean;
  altFormat?: string;
  'alt-format'?: string;
  /**
   * Let the user type into the input directly. Beyond flatpickr's Enter/blur
   * parsing, mono-date live-parses as you type: the calendar navigates to the
   * value and auto-selects it once a complete date (matching `dateFormat`) is
   * entered. Best used without `altInput`.
   */
  typeable?: boolean;
  /** Open the calendar on input click (default true). */
  clickOpens?: boolean;
  'click-opens'?: boolean;
  defaultDate?: string | number | Date | Array<string | number | Date>;
  'default-date'?: string | number | Date | Array<string | number | Date>;
  minDate?: string | number | Date;
  'min-date'?: string | number | Date;
  maxDate?: string | number | Date;
  'max-date'?: string | number | Date;
  /** Dates to disable (values, ranges, or predicate fns). */
  disable?: Options['disable'];
  /** Whitelist of selectable dates (everything else disabled). */
  enable?: Options['enable'];
  mode?: DateMode;
  enableSeconds?: boolean;
  'enable-seconds'?: boolean;
  /** 24-hour time (flatpickr `time_24hr`). */
  time24hr?: boolean;
  'time-24hr'?: boolean;
  hourIncrement?: number;
  'hour-increment'?: number;
  minuteIncrement?: number;
  'minute-increment'?: number;
  defaultHour?: number;
  'default-hour'?: number;
  defaultMinute?: number;
  'default-minute'?: number;
  /** Render the calendar inline (always visible). */
  inline?: boolean;
  weekNumbers?: boolean;
  'week-numbers'?: boolean;
  monthSelectorType?: 'dropdown' | 'static';
  'month-selector-type'?: 'dropdown' | 'static';
  shorthandCurrentMonth?: boolean;
  'shorthand-current-month'?: boolean;
  position?: Options['position'];
  ariaDateFormat?: string;
  'aria-date-format'?: string;
  /** flatpickr locale key or object. */
  locale?: Options['locale'];
  /**
   * Escape hatch — any other flatpickr option, merged into the config. Lets you
   * use the full flatpickr feature set beyond the named props above.
   */
  options?: Partial<Options>;
  /** Explicit sizing (CSS string or number → px). Use `width="100%"` for full width. */
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
  /** Per-part class overrides. */
  cssClass?: DateCssClass;
  cssclass?: DateCssClass;
  'css-class'?: DateCssClass | string;
}
//#endregion