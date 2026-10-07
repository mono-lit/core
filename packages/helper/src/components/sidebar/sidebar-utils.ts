import { isServer } from 'lit'

import type { SidebarMode, SidebarProps } from './sidebar-types.js'
import { CUSTOM_COLOR_CLASS, colorClassToken, isThemeColorToken, validateColorProp } from '../../composables/color.js'

export const SIDEBAR_AUTO_BREAKPOINT = 768

/**
 * `typeof window === 'undefined'` alone is NOT a safe server guard: a DOM shim
 * can define `window` without `matchMedia` (the @lit-labs/ssr v3 shim happens
 * to leave `window` undefined, but that is an implementation detail). Check
 * lit's `isServer` first, then feature-detect `matchMedia`.
 */
export function isAutoTemporary(): boolean {
  if (isServer || typeof window === 'undefined') return false
  if (typeof window.matchMedia !== 'function') return false
  return window.matchMedia(`(max-width: ${SIDEBAR_AUTO_BREAKPOINT - 1}px)`).matches
}

/**
 * Resolves the effective mode for `auto`. Other modes pass through.
 */
export function resolveMode(mode: SidebarMode): Exclude<SidebarMode, 'auto'> {
  if (mode !== 'auto') return mode
  return isAutoTemporary() ? 'temporary' : 'permanent'
}

export function generateSidebarRootClasses(props: {
  mode: SidebarMode
  resolvedMode: Exclude<SidebarMode, 'auto'>
  location: string
  density: string
  color: string
  variant: string
  open: boolean
  expandOnHover: boolean
  contained: boolean
  persistent: boolean
  showScrim: boolean
  cssClassName?: string
  rootExtra?: string
}): string {
  return [
    'mono-sidebar',
    `mode-${props.mode}`,
    `effective-${props.resolvedMode}`,
    `location-${props.location}`,
    props.density,
    // A literal colour must not become a class token — see colorClassToken.
    colorClassToken(props.color),
    props.variant,
    props.open ? 'open' : 'closed',
    props.expandOnHover ? 'expand-on-hover' : '',
    props.contained ? 'contained' : '',
    props.persistent ? 'persistent' : '',
    props.showScrim ? '' : 'no-scrim',
    props.cssClassName ?? '',
    props.rootExtra ?? '',
  ]
    .filter(Boolean)
    .join(' ')
}

export function validateSidebarProps(props: SidebarProps): string[] {
  const errors: string[] = []

  if (props.mode && !['permanent', 'temporary', 'rail', 'auto'].includes(props.mode)) {
    errors.push(`Invalid mode: ${String(props.mode)}`)
  }

  if (props.location && !['left', 'right'].includes(props.location)) {
    errors.push(`Invalid location: ${String(props.location)}`)
  }

  if (props.density && !['compact', 'comfortable', 'default'].includes(props.density)) {
    errors.push(`Invalid density: ${String(props.density)}`)
  }

  if (props.variant && !['flat', 'elevated', 'outlined'].includes(props.variant)) {
    errors.push(`Invalid variant: ${String(props.variant)}`)
  }

  const colorError = validateColorProp(props.color)
  if (colorError) errors.push(colorError)

  if (typeof props.width === 'number' && props.width < 0) {
    errors.push(`width must be non-negative`)
  }

  if (typeof props.railWidth === 'number' && props.railWidth < 0) {
    errors.push(`railWidth must be non-negative`)
  }

  return errors
}

/**
 * The Basecoat styling attributes for the sidebar ROOT, mirroring the props one
 * for one. A prop at its DEFAULT emits nothing — `:not([mono-density])` is
 * comfortable, `:not([mono-color])` is surface, `:not([mono-variant])` is
 * elevated and `:not([mono-location])` is left — so the rendered DOM is also
 * the shortest hand-written markup that paints the same (see sidebar.css).
 *
 * `mono-effective` is always written: it carries the mode AFTER `auto`
 * resolves, and it is what every layout rule keys on. A literal `color`
 * collapses to `custom`, with the colour itself arriving inline.
 */
export function sidebarRootAttrs(props: {
  mode: string
  resolvedMode: string
  location: string
  density: string
  color: string
  variant: string
}): {
  mode: string | null
  effective: string
  location: string | null
  density: string | null
  color: string | null
  variant: string | null
} {
  return {
    mode: props.mode === 'auto' ? null : props.mode,
    effective: props.resolvedMode,
    location: props.location === 'left' ? null : props.location,
    density: props.density === 'comfortable' ? null : props.density,
    variant: props.variant === 'elevated' ? null : props.variant,
    color:
      !props.color || props.color === 'surface'
        ? null
        : isThemeColorToken(props.color)
          ? props.color
          : CUSTOM_COLOR_CLASS,
  }
}
