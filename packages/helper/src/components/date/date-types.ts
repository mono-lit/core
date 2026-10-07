/**
 * mono-date — flatpickr-based date / datetime / time picker type definitions.
 */

import type { Options as FlatpickrOptions } from 'flatpickr/dist/types/options'
import type { VisibilityProps } from '../../composables/visibility'

/** Picker mode — drives flatpickr's calendar/time configuration. */
export type DateType = 'date' | 'datetime' | 'time'

export type DateSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'xxl'

export type DateColor =
  | 'primary'
  | 'secondary'
  | 'success'
  | 'danger'
  | 'warning'
  | 'info'
  | 'teal'
  | 'purple'
  | 'neutral'
  | 'dark'

export type DateVariant = 'outlined' | 'filled' | 'underlined'

export type DateValidationState = 'default' | 'error' | 'success'

/** flatpickr selection mode. */
export type DateMode = 'single' | 'multiple' | 'range'

export interface DateCssClass {
  root?: string
  label?: string
  required?: string
  field?: string
  icon?: string
  native?: string
  clear?: string
  messageWrap?: string
  message?: string
}

/** Emitted on selection change. */
export interface DateChangeEventDetail {
  /** Formatted value string (flatpickr `dateStr`) — mirrors `modelValue`. */
  value: string
  /** Same as `value`; read this for Vue `v-model` (`$event.detail.modelValue`). */
  modelValue: string
  /** Raw selected Date objects (one for single, two for range, N for multiple). */
  dates: Date[]
  /** The flatpickr instance, for advanced access. */
  instance: unknown
  sourceEvent?: Event
}

export type DateChangeEvent = CustomEvent<DateChangeEventDetail>
export type DateOpenEvent = CustomEvent<{ dates: Date[]; instance: unknown }>
export type DateCloseEvent = CustomEvent<{ dates: Date[]; instance: unknown }>

export interface DateEvents {
  // The plain names — what a template listens to (`@change`, `@click`, …).
  change: DateChangeEvent
  open: DateOpenEvent
  close: DateCloseEvent
  // Kept as aliases for existing code: the `mno-` prefix and its camel twin.
  'mno-change': DateChangeEvent
  mnoChange: DateChangeEvent
  'mno-open': DateOpenEvent
  mnoOpen: DateOpenEvent
  'mno-close': DateCloseEvent
  mnoClose: DateCloseEvent
}

export interface DateProps extends VisibilityProps {
  /** Picker mode: `date` (default), `datetime`, or `time`. */
  type?: DateType

  /** Selected value as a formatted string (two-way bound). */
  modelValue?: string
  'model-value'?: string
  modelvalue?: string
  value?: string

  /** Visual size / color / variant (mirror mono-input). */
  size?: DateSize
  color?: DateColor
  variant?: DateVariant

  /** Field label + helper / validation messaging. */
  label?: string
  placeholder?: string
  helperText?: string
  'helper-text'?: string
  validationState?: DateValidationState
  'validation-state'?: DateValidationState
  validationMessage?: string
  'validation-message'?: string
  error?: boolean
  errorMessage?: string
  'error-message'?: string
  success?: boolean
  successMessage?: string
  'success-message'?: string

  /** State flags. */
  disabled?: boolean
  readonly?: boolean
  required?: boolean
  clearable?: boolean

  ariaLabelText?: string
  'aria-label-text'?: string

  /* ----- flatpickr named options (the common ones) ----- */
  /** Output/parsing format, e.g. `"Y-m-d"`, `"d M Y"`, `"H:i"`. */
  dateFormat?: string
  'date-format'?: string
  /** Show a second, human-readable input while submitting `dateFormat`. */
  altInput?: boolean
  'alt-input'?: boolean
  altFormat?: string
  'alt-format'?: string
  /**
   * Let the user type into the input directly. Beyond flatpickr's Enter/blur
   * parsing, mono-date live-parses as you type: the calendar navigates to the
   * value and auto-selects it once a complete date (matching `dateFormat`) is
   * entered. Best used without `altInput`.
   */
  typeable?: boolean
  /** Open the calendar on input click (default true). */
  clickOpens?: boolean
  'click-opens'?: boolean
  defaultDate?: string | number | Date | Array<string | number | Date>
  'default-date'?: string | number | Date | Array<string | number | Date>
  minDate?: string | number | Date
  'min-date'?: string | number | Date
  maxDate?: string | number | Date
  'max-date'?: string | number | Date
  /** Dates to disable (values, ranges, or predicate fns). */
  disable?: FlatpickrOptions['disable']
  /** Whitelist of selectable dates (everything else disabled). */
  enable?: FlatpickrOptions['enable']
  mode?: DateMode
  enableSeconds?: boolean
  'enable-seconds'?: boolean
  /** 24-hour time (flatpickr `time_24hr`). */
  time24hr?: boolean
  'time-24hr'?: boolean
  hourIncrement?: number
  'hour-increment'?: number
  minuteIncrement?: number
  'minute-increment'?: number
  defaultHour?: number
  'default-hour'?: number
  defaultMinute?: number
  'default-minute'?: number
  /** Render the calendar inline (always visible). */
  inline?: boolean
  weekNumbers?: boolean
  'week-numbers'?: boolean
  monthSelectorType?: 'dropdown' | 'static'
  'month-selector-type'?: 'dropdown' | 'static'
  shorthandCurrentMonth?: boolean
  'shorthand-current-month'?: boolean
  position?: FlatpickrOptions['position']
  ariaDateFormat?: string
  'aria-date-format'?: string
  /** flatpickr locale key or object. */
  locale?: FlatpickrOptions['locale']

  /**
   * Escape hatch — any other flatpickr option, merged into the config. Lets you
   * use the full flatpickr feature set beyond the named props above.
   */
  options?: Partial<FlatpickrOptions>

  /** Explicit sizing (CSS string or number → px). Use `width="100%"` for full width. */
  width?: string | number
  height?: string | number
  minWidth?: string | number
  'min-width'?: string | number
  maxWidth?: string | number
  'max-width'?: string | number
  minHeight?: string | number
  'min-height'?: string | number
  maxHeight?: string | number
  'max-height'?: string | number

  /** Per-part class overrides. */
  cssClass?: DateCssClass
  cssclass?: DateCssClass
  'css-class'?: DateCssClass | string
}
