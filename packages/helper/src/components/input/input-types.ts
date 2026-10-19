import type { VisibilityProps } from '../../composables/visibility'

import type { InputFormat, InputFormatCtx, InputFormatOn } from './input-format.js'
import type { MonoTooltipOptions } from '../tooltip/tooltip-types'

export type { InputFormat, InputFormatCtx, InputFormatOn }

export type InputType =
  | 'text'
  | 'email'
  | 'password'
  | 'number'
  | 'tel'
  | 'url'
  | 'date'
  | 'time'
  | 'month'
  | 'week'
  | 'search'
  | 'file'
  | 'range'

export type InputSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'xxl'
export type InputVariant = 'outlined' | 'filled' | 'underlined'
/** Where the label sits: above the box (default), notched into its top border (inset for filled / underlined), or beside it. */
export type InputLabelPosition = 'top' | 'notched' | 'left' | 'right'
/** Where the validation message shows: under the box (default), behind a state icon inside it, or floating under it on hover / focus. */
export type InputValidationPosition = 'bottom' | 'icon' | 'float'

export type InputColor =
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

export type InputValidationState = 'default' | 'valid' | 'invalid' | 'warning'

/**
 * What `modelValue` holds: the text for every text-like type; for `type="file"` the picked
 * `File` (`null` when empty), or `File[]` with `multiple`.
 */
export type InputModelValue = string | File | File[] | null

export type InputModelEventDetail = {
  modelValue: InputModelValue
  currentValue: InputModelValue
  oldValue: InputModelValue
  value: InputModelValue
  name?: string
  /** `type="file"` only — the picked files, always as an array. */
  files?: File[]
  sourceEvent?: Event
  /** What the field is SHOWING — differs from `value` once a `format-display` is set. */
  displayValue?: string
}

export interface InputCssClass {
  root?: string
  label?: string
  required?: string
  field?: string
  prefix?: string
  native?: string
  clear?: string
  suffix?: string
  /** `type="file"` — the upload icon at the end of the field. */
  fileIcon?: string
  /** `type="range"` — the value readout (end of the label row, or after the slider). */
  rangeValue?: string
  messageWrap?: string
  message?: string
}
export type InputModelEvent = CustomEvent<InputModelEventDetail>

/** `type="file"` — a picked file was rejected (same shape as `mono-file-upload`'s `error`). */
export type InputFileErrorEventDetail = {
  message: string
  reason: 'max-file-size'
  file?: File
  maxFileSize?: number
  sourceEvent?: Event
}
export type InputFileErrorEvent = CustomEvent<InputFileErrorEventDetail>

export interface InputProps extends VisibilityProps {
  /** Native input type controlling the field's behavior and keyboard. */
  type?: InputType
  /** Visual size of the input field. */
  size?: InputSize
  /** Theme color applied to focus, borders, and accents. */
  color?: InputColor
  /** Visual style of the field (outlined, filled, or underlined). */
  variant?: InputVariant
  /**
   * Where the label sits: `top` (above the box, default), `notched` (on the top
   * border for outlined; inset inside the box for filled / underlined), or
   * `left` / `right` of the box. Knobs: `--mono-input-label-width`, `-label-side-gap`,
   * `-label-notch-font-size`, `-label-notch-bg`.
   */
  labelPosition?: InputLabelPosition
  'label-position'?: InputLabelPosition
  labelposition?: InputLabelPosition
  /**
   * Where the validation message shows. `bottom` (default): the row under the box.
   * `icon`: a state icon inside the box; hover / tap / keyboard focus shows the message in
   * a state-coloured bubble. `float`: the message floats under the box only while the field
   * is hovered or focused. In `icon` / `float` the row under the box keeps the helper text.
   */
  validationPosition?: InputValidationPosition
  'validation-position'?: InputValidationPosition
  validationposition?: InputValidationPosition

  /** Placeholder text shown when the field is empty. */
  placeholder?: string
  /** Current input value. */
  value?: string | number
  /** Form field name submitted with the input. */
  name?: string

  /**
   * Two-way bound value for v-model-style usage. For `type="file"` it is the picked `File`
   * (`null` when empty), or `File[]` with `multiple`.
   */
  modelValue?: InputModelValue
  'model-value'?: InputModelValue
  modelvalue?: InputModelValue

  /** `type="file"` — the native `accept` filter (`"image/*,.pdf"`). */
  accept?: string
  /** `type="file"` — allow picking several files; `modelValue` becomes `File[]`. */
  multiple?: boolean
  /** `type="file"` — reject files larger than this many bytes (emits `error`). */
  maxFileSize?: number
  'max-file-size'?: number
  maxfilesize?: number

  /**
   * `type="range"` — show the current value beside the slider (default `true`): at the end of
   * the label row, or after the slider when there is no label. It is drawn through
   * `format-display`, so `format-display="Rp {}"` or a function shapes it. `show-value="false"`
   * hides it.
   */
  showValue?: boolean
  'show-value'?: boolean
  showvalue?: boolean

  /**
   * How the field is DISPLAYED — a pattern (`#,##0.##`, `{}@gmail.com`) or a function.
   * Never changes the value. A numeric pattern requires `type="text"`.
   */
  formatDisplay?: InputFormat
  'format-display'?: InputFormat
  formatdisplay?: InputFormat

  /**
   * How the VALUE is shaped. A numeric pattern normalises to a plain numeric string
   * (`"10000000.25"`); a template assembles the full string.
   */
  formatValue?: InputFormat
  'format-value'?: InputFormat
  formatvalue?: InputFormat

  /** When the display reformats: `'input'` (default) or `'blur'`. */
  formatOn?: InputFormatOn
  'format-on'?: InputFormatOn
  formaton?: InputFormatOn

  /** Locale a numeric pattern is drawn with — the pattern is a shape, the locale the characters. */
  formatLocale?: string
  'format-locale'?: string
  formatlocale?: string

  /** Disables interaction and dims the field. */
  disabled?: boolean
  /** Makes the field read-only while still focusable. */
  readonly?: boolean
  /** Shows a clear button when the field has a value. */
  clearable?: boolean
  /** Marks the field as required and shows a required indicator. */
  required?: boolean
  /** Focuses the field automatically on first render. */
  autofocus?: boolean

  /** Label text displayed above the field. */
  label?: string

  /** Helper text shown below the field. */
  helperText?: string
  'helper-text'?: string
  helpertext?: string
  /**
   * Info icon at the end of the label; hovering, focusing or tapping it shows this text.
   * Plain text → a small built-in bubble (no dependency). Full tooltip options
   * (`:tooltip.prop="{ content, placement, color }"`) → a `mono-tooltip`, which needs the
   * optional `@floating-ui/dom` + `@floating-ui/core` peers (without them that form renders
   * no icon). Shown only beside a label.
   */
  tooltip?: string | MonoTooltipOptions

  /** Explicit validation state for styling and messaging. */
  validationState?: InputValidationState
  'validation-state'?: InputValidationState
  validationstate?: InputValidationState

  /** Validation message shown below the field. */
  validationMessage?: string
  'validation-message'?: string
  validationmessage?: string

  /** Marks the field in an error state. */
  error?: boolean

  /** Error message shown below the field. */
  errorMessage?: string
  'error-message'?: string
  errormessage?: string

  /** Marks the field in a success state. */
  success?: boolean

  /** Success message shown below the field. */
  successMessage?: string
  'success-message'?: string
  successmessage?: string

  /** Accessible label for the input element. */
  ariaLabelText?: string
  /** Shorter alias for the accessible label. */
  ariaLabel?: string
  'aria-label'?: string
  'aria-label-text'?: string
  arialabel?: string
  arialabeltext?: string

  /** Minimum allowed input length. */
  minLength?: number
  'min-length'?: number
  minlength?: number

  /** Maximum allowed input length. */
  maxLength?: number
  'max-length'?: number
  maxlength?: number

  /**
   * Minimum value. On a field with a NUMBER `format` this clamps the typed value on commit
   * (never while typing — a lower bound is crossed on the way to most legal values). On every
   * other type it is the native attribute.
   */
  min?: number | string
  /**
   * Maximum value. On a field with a NUMBER `format` this clamps the typed value AS YOU TYPE, so
   * the field cannot be pushed past it. On every other type it is the native attribute — note the
   * platform ignores it on `type="text"`, which a numeric format requires.
   */
  max?: number | string
  /** Step increment for numeric or date inputs. */
  step?: number | string
  /** Validation pattern the value must match. */
  pattern?: string
  /** Native autocomplete hint for the field. */
  autocomplete?: string
  /** Native inputmode hint for the on-screen keyboard. */
  inputmode?: string

  /**
   * Explicit sizing. Each accepts a CSS length string (`"320px"`, `"80%"`) or a
   * number (interpreted as px). Use `width="100%"` for a full-width field.
   */
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

  /** Per-part class overrides for internal elements. */
  cssClass?: InputCssClass

  /**
   * Simple HTML root class only.
   *
   * Example:
   * <mono-input css-class="premium-input"></mono-input>
   */
  'css-class'?: string
}

export interface InputEvents {
  // The plain names — what a template listens to (`@change`, `@click`, …).
  input: InputModelEvent
  change: InputModelEvent
  clear: InputModelEvent
  /** `type="file"` — a picked file was rejected. */
  error: InputFileErrorEvent
  // Kept as aliases for existing code: the `mno-` prefix and its camel twin.
  'mno-input': InputModelEvent
  mnoInput: InputModelEvent
  'mno-change': InputModelEvent
  mnoChange: InputModelEvent
  'mno-clear': InputModelEvent
  mnoClear: InputModelEvent
  'mno-error': InputFileErrorEvent
  mnoError: InputFileErrorEvent
}