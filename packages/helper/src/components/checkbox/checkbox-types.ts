/**
 * Checkbox Component Type Definitions
 */

import type { VisibilityProps } from '../../composables/visibility'

export type CheckboxSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'xxl'

export type CheckboxColor =
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

export interface CheckboxCssClass {
  root?: string
  input?: string
  box?: string
  icon?: string
  indeterminateIcon?: string
  label?: string
  labelText?: string
  description?: string
}

export type MonoModelEventDetail<TValue = unknown, TNativeValue = unknown> = {
  modelValue: TValue
  currentValue: TValue
  oldValue: TValue
  value?: TNativeValue
  checked?: boolean
  name?: string
  sourceEvent?: Event
}

export type CheckboxModelEventDetail = MonoModelEventDetail<boolean, string>

export type CheckboxModelEvent = CustomEvent<CheckboxModelEventDetail>

export interface CheckboxProps extends VisibilityProps {
  /** Bound checked state of the checkbox. */
  modelValue?: boolean
  'model-value'?: boolean
  modelvalue?: boolean

  /** Whether the checkbox is checked. */
  checked?: boolean
  /** Color theme of the checkbox. */
  color?: CheckboxColor
  /** Visual size of the checkbox. */
  size?: CheckboxSize
  /** Disables interaction and dims the checkbox. */
  disabled?: boolean
  /** Shows the indeterminate (mixed) state. */
  indeterminate?: boolean
  /** Label text shown next to the checkbox. */
  label?: string
  /** Secondary line under the label. `slot="sublabel"` replaces it. */
  sublabel?: string
  /** The same as `sublabel` — still accepted, both names share one value. */
  description?: string
  /** Form value submitted when checked. */
  value?: string
  /** Form field name of the checkbox. */
  name?: string

  /** Accessible label text for screen readers. */
  ariaLabelText?: string
  'aria-label-text'?: string
  arialabeltext?: string

  /** Per-element class overrides. */
  cssClass?: CheckboxCssClass

  /**
   * Simple HTML attribute.
   * This applies to root only.
   *
   * Example:
   * <mono-checkbox css-class="my-checkbox"></mono-checkbox>
   */
  'css-class'?: string
}

export interface CheckboxEvents {
  // The plain names — what a template listens to (`@change`, `@click`, …).
  change: CheckboxModelEvent
  // Kept as aliases for existing code: the `mno-` prefix and its camel twin.
  'mno-change': CheckboxModelEvent
  mnoChange: CheckboxModelEvent
}