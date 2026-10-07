// @unocss-include

import type { InputType, InputSize, InputColor, InputVariant } from './input-types.js'

export function validateInputProps(props: {
  type?: InputType
  size?: InputSize
  color?: InputColor
  variant?: InputVariant
}): boolean {
  const validTypes: InputType[] = [
    'text',
    'email',
    'password',
    'number',
    'tel',
    'url',
    'date',
    'time',
    'month',
    'week',
    'search',
  ]

  const validSizes: InputSize[] = ['xs', 'sm', 'md', 'lg', 'xl', 'xxl']
  const validColors: InputColor[] = ['primary', 'secondary', 'success', 'danger', 'warning', 'info', 'teal', 'purple', 'neutral', 'dark']
  const validVariants: InputVariant[] = ['outlined', 'filled', 'underlined']

  if (props.type && !validTypes.includes(props.type)) return false
  if (props.size && !validSizes.includes(props.size)) return false
  if (props.color && !validColors.includes(props.color)) return false
  if (props.variant && !validVariants.includes(props.variant)) return false

  return true
}

export function generateInputAttributes(
  type: InputType,
  disabled: boolean,
  readonly: boolean,
  required: boolean,
  pattern?: string,
  min?: number | string,
  max?: number | string,
  step?: number | string,
  placeholder?: string,
): Record<string, string | number | boolean | undefined> {
  return {
    type,
    disabled: disabled || undefined,
    readonly: readonly || undefined,
    required: required || undefined,
    pattern: pattern || undefined,
    min,
    max,
    step,
    placeholder: placeholder || undefined,
  }
}

export function generateInputAriaAttributes(
  disabled: boolean,
  readonly: boolean,
  required: boolean,
  hasError: boolean,
  label?: string,
  errorMessage?: string,
): Record<string, string | undefined> {
  return {
    'aria-disabled': disabled ? 'true' : undefined,
    'aria-readonly': readonly ? 'true' : undefined,
    'aria-required': required ? 'true' : undefined,
    'aria-invalid': hasError ? 'true' : undefined,
    'aria-label': label || undefined,
    'aria-errormessage': hasError ? errorMessage || undefined : undefined,
  }
}

export function getInputIcon(type: InputType): string {
  const iconMap: Record<InputType, string> = {
    text: 'M4 6h16M4 12h16M4 18h10',
    email: 'M4 6h16v12H4z M4 7l8 6 8-6',
    password: 'M12 17a2 2 0 1 0 0-4a2 2 0 0 0 0 4zm6-7V8a6 6 0 1 0-12 0v2',
    number: 'M8 4v16M16 4v16M5 9h14M5 15h14',
    tel: 'M6.6 10.8a15.5 15.5 0 0 0 6.6 6.6l2.2-2.2a1.5 1.5 0 0 1 1.5-.36a10 10 0 0 0 3.1.5a1 1 0 0 1 1 1V20a1 1 0 0 1-1 1A17 17 0 0 1 3 4a1 1 0 0 1 1-1h3.06a1 1 0 0 1 1 1a10 10 0 0 0 .5 3.1a1.5 1.5 0 0 1-.36 1.5z',
    url: 'M10 14a5 5 0 0 1 0-7l1-1a5 5 0 0 1 7 7l-1 1M14 10a5 5 0 0 1 0 7l-1 1a5 5 0 0 1-7-7l1-1',
    date: 'M7 3v3M17 3v3M4 8h16M5 5h14v16H5z',
    time: 'M12 7v5l3 3M12 22a10 10 0 1 0 0-20a10 10 0 0 0 0 20z',
    month: 'M7 3v3M17 3v3M5 5h14v14H5zM8 11h8',
    week: 'M7 3v3M17 3v3M5 5h14v16H5zM9 11h6M9 15h4',
    search: 'M21 21l-4.35-4.35M10.5 18a7.5 7.5 0 1 1 0-15a7.5 7.5 0 0 1 0 15z',
  }

  return iconMap[type] ?? iconMap.text
}