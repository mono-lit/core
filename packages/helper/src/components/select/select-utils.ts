import type {
  SelectColor,
  SelectSize,
  SelectValidationState,
  SelectVariant,
} from './select-types.js'

export function validateSelectProps(props: {
  size?: SelectSize
  color?: SelectColor
  variant?: SelectVariant
  validationState?: SelectValidationState
}): boolean {
  const validSizes: SelectSize[] = ['xs', 'sm', 'md', 'lg', 'xl', 'xxl']
  const validColors: SelectColor[] = ['primary', 'secondary', 'success', 'danger', 'warning', 'info', 'teal', 'purple', 'neutral', 'dark']
  const validVariants: SelectVariant[] = ['outlined', 'filled', 'underlined']
  const validStates: SelectValidationState[] = ['default', 'valid', 'invalid', 'warning']

  if (props.size && !validSizes.includes(props.size)) return false
  if (props.color && !validColors.includes(props.color)) return false
  if (props.variant && !validVariants.includes(props.variant)) return false
  if (props.validationState && !validStates.includes(props.validationState)) return false

  return true
}