import type { VisibilityProps } from '../../composables/visibility'
import type { MonoTooltipOptions } from '../tooltip/tooltip-types'

/** Which characters a box accepts: digits (default), letters + digits (uppercased), or any non-space character. */
export type OtpType = 'numeric' | 'alphanumeric' | 'text'

export type OtpSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'xxl'
export type OtpVariant = 'outlined' | 'filled' | 'underlined'
/** `notched` is accepted for parity with mono-input but renders as `top` — there is no single box to notch. */
export type OtpLabelPosition = 'top' | 'notched' | 'left' | 'right'
export type OtpValidationPosition = 'bottom' | 'icon' | 'float'

export type OtpColor =
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

export type OtpValidationState = 'default' | 'valid' | 'invalid' | 'warning'

/** `groups`: a group size (`3`), a list (`[3, 3]`), or the same list from markup (`"3,3"`). */
export type OtpGroups = number | number[] | string

export type OtpModelEventDetail = {
  /** The code typed so far — the boxes joined, always a contiguous prefix. */
  modelValue: string
  currentValue: string
  oldValue: string
  value: string
  /** True once every box is filled. */
  complete: boolean
  /** The box the edit happened in (`-1` for a clear or a blur commit). */
  index: number
  name?: string
  sourceEvent?: Event
}
export type OtpModelEvent = CustomEvent<OtpModelEventDetail>

export interface OtpCssClass {
  root?: string
  label?: string
  required?: string
  field?: string
  group?: string
  cell?: string
  separator?: string
  prefix?: string
  suffix?: string
  clear?: string
  messageWrap?: string
  message?: string
}

export interface OtpProps extends VisibilityProps {
  /** Which characters a box accepts: `numeric` (default), `alphanumeric` (uppercased) or `text`. */
  type?: OtpType
  /** Number of boxes (default 6). */
  length?: number | string
  /**
   * Split the boxes into groups with a separator between them: a group size (`3` → 3-3),
   * a list (`[3, 3]`, `[2, 2, 2]`) or the markup form `"3,3"`.
   */
  groups?: OtpGroups
  /** Text drawn between groups (default `-`). An empty string leaves only the gap. */
  separator?: string
  /** Hide the typed characters like a password. */
  mask?: boolean

  /** Visual size of the boxes. */
  size?: OtpSize
  /** Theme color applied to focus. */
  color?: OtpColor
  /** Visual style of each box (outlined, filled, or underlined). */
  variant?: OtpVariant
  /** Where the label sits: `top` (default), `left` or `right`. `notched` renders as `top`. */
  labelPosition?: OtpLabelPosition
  'label-position'?: OtpLabelPosition
  labelposition?: OtpLabelPosition
  /** Where the validation message shows: `bottom` (default), `icon` or `float` (see mono-input). */
  validationPosition?: OtpValidationPosition
  'validation-position'?: OtpValidationPosition
  validationposition?: OtpValidationPosition

  /** A placeholder character drawn in every empty box (e.g. `○` or `-`). */
  placeholder?: string
  /** Current code. */
  value?: string | number
  /** Form field name — a hidden input carries the joined code for a native form submit. */
  name?: string
  /** Two-way bound value. */
  modelValue?: string | number
  'model-value'?: string | number
  modelvalue?: string | number

  /** Disables interaction and dims the boxes. */
  disabled?: boolean
  /** Makes the boxes read-only while still focusable. */
  readonly?: boolean
  /** Shows a clear button when a code has been typed. */
  clearable?: boolean
  /** Marks the field as required and shows a required indicator. */
  required?: boolean
  /** Focuses the first empty box on first render. */
  autofocus?: boolean

  /** Label text displayed above the boxes. */
  label?: string
  /** Helper text shown below the boxes. */
  helperText?: string
  'helper-text'?: string
  helpertext?: string
  /** Info icon at the end of the label (plain text, or full `mono-tooltip` options). */
  tooltip?: string | MonoTooltipOptions

  /** Explicit validation state for styling and messaging. */
  validationState?: OtpValidationState
  'validation-state'?: OtpValidationState
  validationstate?: OtpValidationState
  /** Validation message shown below the boxes. */
  validationMessage?: string
  'validation-message'?: string
  validationmessage?: string
  /** Marks the field in an error state. */
  error?: boolean
  /** Error message shown below the boxes. */
  errorMessage?: string
  'error-message'?: string
  errormessage?: string
  /** Marks the field in a success state. */
  success?: boolean
  /** Success message shown below the boxes. */
  successMessage?: string
  'success-message'?: string
  successmessage?: string

  /** Native autocomplete hint on the first box (default `one-time-code`, which lets phones offer an SMS code). */
  autocomplete?: string
  /** On-screen keyboard hint. Defaults to `numeric` for `type="numeric"`, otherwise `text`. */
  inputmode?: string

  /** Accessible label for the group; each box reads "<label> – character i of n". */
  ariaLabelText?: string
  ariaLabel?: string
  'aria-label'?: string
  'aria-label-text'?: string
  arialabel?: string
  arialabeltext?: string

  /** Explicit sizing of the root (CSS length or px number). */
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
  cssClass?: OtpCssClass
  /** Simple HTML root class only. */
  'css-class'?: string
}

export interface OtpEvents {
  input: OtpModelEvent
  change: OtpModelEvent
  /** Every box is filled. */
  complete: OtpModelEvent
  clear: OtpModelEvent
  'mno-input': OtpModelEvent
  mnoInput: OtpModelEvent
  'mno-change': OtpModelEvent
  mnoChange: OtpModelEvent
  'mno-complete': OtpModelEvent
  mnoComplete: OtpModelEvent
  'mno-clear': OtpModelEvent
  mnoClear: OtpModelEvent
}
