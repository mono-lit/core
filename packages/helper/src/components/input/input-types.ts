import type { VisibilityProps } from '../../composables/visibility'

import type { InputFormat, InputFormatCtx, InputFormatOn } from './input-format.js'

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

export type InputSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'xxl'
export type InputVariant = 'outlined' | 'filled' | 'underlined'

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

export type InputModelEventDetail = {
  modelValue: string
  currentValue: string
  oldValue: string
  value: string
  name?: string
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
  messageWrap?: string
  message?: string
}
export type InputModelEvent = CustomEvent<InputModelEventDetail>

export interface InputProps extends VisibilityProps {
  /** Native input type controlling the field's behavior and keyboard. */
  type?: InputType
  /** Visual size of the input field. */
  size?: InputSize
  /** Theme color applied to focus, borders, and accents. */
  color?: InputColor
  /** Visual style of the field (outlined, filled, or underlined). */
  variant?: InputVariant

  /** Placeholder text shown when the field is empty. */
  placeholder?: string
  /** Current input value. */
  value?: string | number
  /** Form field name submitted with the input. */
  name?: string

  /** Two-way bound value for v-model-style usage. */
  modelValue?: string
  'model-value'?: string
  modelvalue?: string

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
  // Kept as aliases for existing code: the `mno-` prefix and its camel twin.
  'mno-input': InputModelEvent
  mnoInput: InputModelEvent
  'mno-change': InputModelEvent
  mnoChange: InputModelEvent
  'mno-clear': InputModelEvent
  mnoClear: InputModelEvent
}