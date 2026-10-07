import type {
  TagInputColor,
  TagInputSize,
  TagInputValidationState,
  TagInputVariant,
  TagInputItem,
} from './tag-input-types.js'

export function validateTagInputProps(props: {
  size?: TagInputSize
  color?: TagInputColor
  variant?: TagInputVariant
  validationState?: TagInputValidationState
}): boolean {
  const validSizes: TagInputSize[] = ['xs', 'sm', 'md', 'lg', 'xl', 'xxl']
  const validColors: TagInputColor[] = ['primary', 'secondary', 'success', 'danger', 'warning', 'info', 'teal', 'purple', 'neutral', 'dark']
  const validVariants: TagInputVariant[] = ['outlined', 'filled', 'underlined']
  const validStates: TagInputValidationState[] = ['default', 'valid', 'invalid', 'warning']

  if (props.size && !validSizes.includes(props.size)) return false
  if (props.color && !validColors.includes(props.color)) return false
  if (props.variant && !validVariants.includes(props.variant)) return false
  if (props.validationState && !validStates.includes(props.validationState)) return false

  return true
}

export function normalizeSuggestions(items: TagInputItem[]): TagInputItem[] {
  return items.map((item) => ({
    ...item,
    value: item.value ?? item.label,
  }))
}
