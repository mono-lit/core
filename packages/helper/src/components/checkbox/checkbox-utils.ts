// @unocss-include

/**
 * Checkbox Component Utility Functions
 * Helper functions for checkbox-related operations
 */

import type { CheckboxSize, CheckboxColor } from './checkbox-types.js'

/**
 * Validate checkbox props
 */
export function validateCheckboxProps(props: {
  size?: CheckboxSize
  color?: CheckboxColor
}): boolean {
  const validSizes: CheckboxSize[] = ['xs', 'sm', 'md', 'lg', 'xl', 'xxl']
  const validColors: CheckboxColor[] = ['primary', 'secondary', 'success', 'danger', 'warning', 'info', 'teal', 'purple', 'neutral', 'dark']

  if (props.size && !validSizes.includes(props.size)) return false
  if (props.color && !validColors.includes(props.color)) return false

  return true
}

/**
 * Generate ARIA attributes for accessibility
 */
export function generateCheckboxAttributes(
  disabled: boolean,
  checked: boolean,
  indeterminate: boolean,
  label: string | undefined
): Record<string, string | boolean | undefined> {
  return {
    'aria-disabled': disabled ? 'true' : undefined,
    'aria-checked': indeterminate ? 'mixed' : String(checked),
    'role': 'checkbox',
    'aria-label': label || undefined
  }
}

/**
 * Generate root CSS classes for checkbox
 */
export function generateCheckboxRootClasses(props: {
  size?: CheckboxSize
  color?: CheckboxColor
  checked?: boolean
  indeterminate?: boolean
  disabled?: boolean
}): string {
  const classes: string[] = ['mono-checkbox']

  // Gap, label and description scale per size and are styled off the root, so the
  // size has to land here as well as on the box.
  classes.push(props.size ?? 'md')
  classes.push(props.color ?? 'primary')

  if (props.checked) classes.push('mono-checkbox-checked')
  if (props.indeterminate) classes.push('mono-checkbox-indeterminate')
  if (props.disabled) classes.push('disabled')

  return classes.join(' ')
}

/**
 * Generate CSS classes for checkbox box element
 */
export function generateCheckboxBoxClasses(props: {
  size?: CheckboxSize
}): string {
  const classes: string[] = ['mono-checkbox-box']
  classes.push(props.size ?? 'md')
  return classes.join(' ')
}

/**
 * Generate CSS classes for checkbox icon element
 */
export function generateCheckboxIconClasses(props: {
  size?: CheckboxSize
  type?: 'check' | 'indeterminate'
}): string {
  const classes: string[] = []

  if (props.type === 'indeterminate') {
    classes.push('mono-checkbox-indeterminate-icon')
  } else {
    classes.push('mono-checkbox-icon')
  }

  classes.push(props.size ?? 'md')
  return classes.join(' ')
}