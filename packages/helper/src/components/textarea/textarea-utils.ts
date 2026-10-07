import type {
  TextareaColor,
  TextareaSize,
  TextareaValidationState,
  TextareaVariant,
} from './textarea-types.js'

export function validateTextareaProps(props: {
  size?: TextareaSize
  color?: TextareaColor
  variant?: TextareaVariant
  validationState?: TextareaValidationState
}): boolean {
  const validSizes: TextareaSize[] = ['xs', 'sm', 'md', 'lg', 'xl', 'xxl']
  const validColors: TextareaColor[] = ['primary', 'secondary', 'success', 'danger', 'warning', 'info', 'teal', 'purple', 'neutral', 'dark']
  const validVariants: TextareaVariant[] = ['outlined', 'filled', 'underlined']
  const validStates: TextareaValidationState[] = ['default', 'valid', 'invalid', 'warning']

  if (props.size && !validSizes.includes(props.size)) return false
  if (props.color && !validColors.includes(props.color)) return false
  if (props.variant && !validVariants.includes(props.variant)) return false
  if (props.validationState && !validStates.includes(props.validationState)) return false

  return true
}
