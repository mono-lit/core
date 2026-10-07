// @unocss-include

/**
 * Radio Component Utility Functions
 * Helper functions for radio-related operations
 */

import type { RadioSize, RadioColor } from './radio-types.js'

/**
 * Validate radio props
 */
export function validateRadioProps(props: {
  size?: RadioSize
  color?: RadioColor
}): boolean {
  const validSizes: RadioSize[] = ['xs', 'sm', 'md', 'lg', 'xl', 'xxl']
  const validColors: RadioColor[] = ['primary', 'secondary', 'success', 'danger', 'warning', 'info', 'teal', 'purple', 'neutral', 'dark']

  if (props.size && !validSizes.includes(props.size)) return false
  if (props.color && !validColors.includes(props.color)) return false

  return true
}

/**
 * Generate ARIA attributes for accessibility
 */
export function generateRadioAttributes(
  disabled: boolean,
  checked: boolean,
  label: string | undefined
): Record<string, string | boolean | undefined> {
  return {
    'aria-disabled': disabled ? 'true' : undefined,
    'aria-checked': String(checked),
    'role': 'radio',
    'aria-label': label || undefined
  }
}