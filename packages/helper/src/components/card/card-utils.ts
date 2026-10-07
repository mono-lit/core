// @unocss-include

/**
 * Card Component Utility Functions
 * Helper functions for card-related operations
 */

import type { CardVariant, CardColor } from './card-types.js'

/**
 * Validate card props
 */
export function validateCardProps(props: {
  variant?: CardVariant
  color?: CardColor
}): boolean {
  const validVariants: CardVariant[] = ['outlined', 'elevated', 'flat', 'tonal']
  const validColors: CardColor[] = ['primary', 'secondary', 'success', 'danger', 'warning', 'info', 'neutral']

  if (props.variant && !validVariants.includes(props.variant)) return false
  if (props.color && !validColors.includes(props.color)) return false

  return true
}

/**
 * Generate root CSS classes for card
 */
export function generateCardRootClasses(props: {
  variant?: CardVariant
  color?: CardColor
  bordered?: boolean
  hoverable?: boolean
  clickable?: boolean
  disabled?: boolean
}): string {
  const classes: string[] = ['mono-card']

  classes.push(props.variant ?? 'elevated')
  classes.push(props.color ?? 'primary')

  if (props.bordered) classes.push('bordered')
  if (props.hoverable) classes.push('hoverable')
  if (props.clickable) classes.push('clickable')
  if (props.disabled) classes.push('disabled')

  return classes.join(' ')
}

/**
 * Generate ARIA attributes for accessibility
 */
export function generateCardAttributes(
  clickable: boolean,
  hoverable: boolean,
  label: string | undefined
): Record<string, string | boolean | undefined> {
  return {
    'role': clickable ? 'button' : 'article',
    'tabindex': clickable ? '0' : undefined,
    'aria-label': label || undefined
  }
}