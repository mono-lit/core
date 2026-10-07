import type { NavDensity, NavProps } from './nav-types.js'
import { colorClassToken, validateColorProp } from '../../composables/color.js'

const DENSITY_HEIGHTS: Record<NavDensity, number> = {
  compact: 48,
  comfortable: 56,
  default: 64,
}

export function getNavHeight(density: NavDensity): number {
  return DENSITY_HEIGHTS[density] ?? DENSITY_HEIGHTS.default
}

export function generateNavRootClasses(props: {
  density: NavDensity
  color: string
  variant: string
  sticky: boolean
  extension: boolean
  rootExtra?: string
  cssClassName?: string
}): string {
  return [
    'mono-nav',
    props.density,
    // A literal colour must not become a class token — see colorClassToken.
    colorClassToken(props.color),
    props.variant,
    props.sticky ? 'sticky' : '',
    props.extension ? 'has-extension' : '',
    props.cssClassName ?? '',
    props.rootExtra ?? '',
  ]
    .filter(Boolean)
    .join(' ')
}

export function validateNavProps(props: NavProps): string[] {
  const errors: string[] = []

  if (props.density && !['compact', 'comfortable', 'default'].includes(props.density)) {
    errors.push(`Invalid density: ${String(props.density)}`)
  }

  const colorError = validateColorProp(props.color)
  if (colorError) errors.push(colorError)

  if (props.variant && !['flat', 'elevated', 'outlined'].includes(props.variant)) {
    errors.push(`Invalid variant: ${String(props.variant)}`)
  }

  return errors
}
