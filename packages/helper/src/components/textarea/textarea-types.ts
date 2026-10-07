import type { VisibilityProps } from '../../composables/visibility'

export type TextareaSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'xxl'

export type TextareaColor =
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

export type TextareaVariant = 'outlined' | 'filled' | 'underlined'

export type TextareaValidationState =
  | 'default'
  | 'valid'
  | 'invalid'
  | 'warning'

export interface TextareaCssClass {
  root?: string
  label?: string
  required?: string
  field?: string
  footer?: string
  messageWrap?: string
  message?: string
  counter?: string
}

export type TextareaModelEventDetail = {
  modelValue: string
  currentValue: string
  oldValue: string
  value: string
  name?: string
  sourceEvent?: Event
}

export type TextareaModelEvent = CustomEvent<TextareaModelEventDetail>

export interface TextareaProps extends VisibilityProps {
  /** Two-way bound text value of the textarea. */
  modelValue?: string
  'model-value'?: string
  modelvalue?: string

  /** Text value (kept in sync with modelValue). */
  value?: string
  /** Form field name for the underlying textarea. */
  name?: string
  /** Placeholder text shown when empty. */
  placeholder?: string
  /** Text label shown above the textarea. */
  label?: string

  /** Helper text shown below the textarea. */
  helperText?: string
  'helper-text'?: string
  helpertext?: string

  /** Validation state controlling field styling. */
  validationState?: TextareaValidationState
  'validation-state'?: TextareaValidationState
  validationstate?: TextareaValidationState

  /** Message shown for the current validation state. */
  validationMessage?: string
  'validation-message'?: string
  validationmessage?: string

  /** Error message that forces the invalid state. */
  errorMessage?: string
  'error-message'?: string
  errormessage?: string

  /** Success message that forces the valid state. */
  successMessage?: string
  'success-message'?: string
  successmessage?: string

  /** Size of the textarea. */
  size?: TextareaSize
  /** Color theme of the textarea. */
  color?: TextareaColor
  /** Visual style of the textarea. */
  variant?: TextareaVariant

  /** Disables interaction with the textarea. */
  disabled?: boolean
  /** Makes the textarea read-only. */
  readonly?: boolean
  /** Marks the field as required. */
  required?: boolean
  /** Focuses the textarea on first render. */
  autofocus?: boolean
  /** Automatically grows the height to fit content. */
  autoResize?: boolean
  'auto-resize'?: boolean
  autoresize?: boolean

  /** Initial number of visible text rows. */
  rows?: number
  /** Minimum number of rows when auto-resizing. */
  minRows?: number
  'min-rows'?: number
  minrows?: number
  /** Maximum number of rows when auto-resizing. */
  maxRows?: number
  'max-rows'?: number
  maxrows?: number

  /** Minimum allowed character length. */
  minLength?: number
  'min-length'?: number
  minlength?: number
  /** Maximum allowed character length. */
  maxLength?: number
  'max-length'?: number
  maxlength?: number

  /** Shows a character counter below the field. */
  showCounter?: boolean
  'show-counter'?: boolean
  showcounter?: boolean

  /** Accessible label for screen readers. */
  ariaLabelText?: string
  ariaLabel?: string
  'aria-label'?: string
  'aria-label-text'?: string
  arialabel?: string
  arialabeltext?: string

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

  /** Per-part class overrides for styling internal elements. */
  cssClass?: TextareaCssClass
  cssclass?: TextareaCssClass
  'css-class'?: TextareaCssClass | string
}

export interface TextareaEvents {
  // The plain names — what a template listens to (`@change`, `@click`, …).
  input: TextareaModelEvent
  change: TextareaModelEvent
  // Kept as aliases for existing code: the `mno-` prefix and its camel twin.
  'mno-input': TextareaModelEvent
  mnoInput: TextareaModelEvent
  'mno-change': TextareaModelEvent
  mnoChange: TextareaModelEvent
}