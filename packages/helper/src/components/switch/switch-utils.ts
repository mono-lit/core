// @unocss-include

/**
 * Switch Component Utility Functions
 * Helper functions for switch-related operations
 */

import type { SwitchSize, SwitchColor } from './switch-types.js'

/**
 * Validate switch props
 */
export function validateSwitchProps(props: {
  size?: SwitchSize
  color?: SwitchColor
}): boolean {
  const validSizes: SwitchSize[] = ['xs', 'sm', 'md', 'lg', 'xl', 'xxl']
  const validColors: SwitchColor[] = ['primary', 'secondary', 'success', 'danger', 'warning', 'info', 'teal', 'purple', 'neutral', 'dark']

  if (props.size && !validSizes.includes(props.size)) return false
  if (props.color && !validColors.includes(props.color)) return false

  return true
}

/**
 * Generate ARIA attributes for accessibility
 */
export function generateSwitchAttributes(
  disabled: boolean,
  loading: boolean,
  checked: boolean,
  label: string | undefined
): Record<string, string | boolean | undefined> {
  return {
    'aria-disabled': disabled || loading ? 'true' : undefined,
    'aria-busy': loading ? 'true' : undefined,
    'aria-checked': String(checked),
    'role': 'switch',
    'aria-label': label || undefined
  }
}