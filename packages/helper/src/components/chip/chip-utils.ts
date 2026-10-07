// @unocss-include

/**
 * Chip Utility Functions
 */

import type {
  ChipColor,
  ChipRounded,
  ChipSize,
  ChipVariant,
} from './chip-types.js'

export function generateChipRootClasses(props: {
  size?: ChipSize
  color?: ChipColor
  variant?: ChipVariant
  rounded?: ChipRounded
  clickable?: boolean
  removable?: boolean
  disabled?: boolean
  selected?: boolean
  dot?: boolean
}): string {
  const classes: string[] = ['mono-chip']

  classes.push(props.size ?? 'md')
  if (props.rounded) classes.push(`rounded-${props.rounded}`)

  const variant = props.variant ?? 'soft'
  const color = props.color ?? 'primary'
  classes.push(`${variant}-${color}`)

  if (props.clickable) classes.push('clickable')
  if (props.removable) classes.push('removable')
  if (props.disabled) classes.push('disabled')
  if (props.selected) classes.push('selected')
  if (props.dot) classes.push('has-dot')

  return classes.join(' ')
}

export function isInteractive(props: {
  clickable?: boolean
  href?: string
  removable?: boolean
  disabled?: boolean
}): boolean {
  return Boolean(
    !props.disabled && (props.clickable || props.href || props.removable),
  )
}

export function validateChipProps(props: {
  size?: ChipSize
  color?: ChipColor
  variant?: ChipVariant
  rounded?: ChipRounded
}): boolean {
  const validSizes: ChipSize[] = ['xs', 'sm', 'md', 'lg', 'xl', 'xxl']
  const validColors: ChipColor[] = [
    'primary',
    'success',
    'danger',
    'warning',
    'info',
    'teal',
    'purple',
    'neutral',
    'dark',
  ]
  const validVariants: ChipVariant[] = ['soft', 'solid', 'outline']
  const validRounded: ChipRounded[] = ['none', 'xs', 'sm', 'md', 'lg', 'xl', 'xxl', 'full']

  if (props.size && !validSizes.includes(props.size)) return false
  if (props.color && !validColors.includes(props.color)) return false
  if (props.variant && !validVariants.includes(props.variant)) return false
  if (props.rounded && !validRounded.includes(props.rounded)) return false

  return true
}
