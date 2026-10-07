import type { BreadcrumbItem, BreadcrumbProps } from './breadcrumb-types.js'

// Re-exported from the shared composable (single source of truth).
export { isIconifyClass } from '../../composables/icon.js'

/**
 * Coerce any `items` input to a `BreadcrumbItem[]`. Accepts an array (pass-through),
 * a JSON string (`items='[...]'` attribute, or a string assigned to the PROPERTY —
 * which is what nuxt-ssr-lit does when forwarding a Vue `:items="<json>"` binding
 * to the SSR renderer), or anything else (→ `[]`).
 */
export function coerceItems(value: unknown): BreadcrumbItem[] {
  if (Array.isArray(value)) return value as BreadcrumbItem[]
  if (typeof value === 'string') {
    if (!value) return []
    try {
      const parsed = JSON.parse(value)
      return Array.isArray(parsed) ? (parsed as BreadcrumbItem[]) : []
    } catch {
      return []
    }
  }
  return []
}

export function findItem(
  items: BreadcrumbItem[],
  id: string,
): BreadcrumbItem | null {
  for (const item of items) {
    if (item.id === id) return item
  }
  return null
}

export function findItemIndex(items: BreadcrumbItem[], id: string): number {
  for (let i = 0; i < items.length; i++) {
    if (items[i].id === id) return i
  }
  return -1
}

/**
 * Resolve which breadcrumb item is the "current" segment.
 * Priority: explicit `modelValue` → first item with `current: true` → last item.
 */
export function resolveCurrentId(
  items: BreadcrumbItem[],
  modelValue: BreadcrumbItem | null,
): string {
  if (modelValue?.id) return modelValue.id

  for (const item of items) {
    if (item.current) return item.id
  }

  if (items.length) return items[items.length - 1].id
  return ''
}

export function generateBreadcrumbRootClasses(props: {
  variant: string
  size: string
  color: string
  truncate: boolean
  disabled: boolean
  cssClassName?: string
  rootExtra?: string
}): string {
  return [
    'mono-breadcrumb',
    props.variant,
    props.size,
    props.color,
    props.truncate ? 'truncate' : '',
    props.disabled ? 'disabled' : '',
    props.cssClassName ?? '',
    props.rootExtra ?? '',
  ]
    .filter(Boolean)
    .join(' ')
}

export function validateBreadcrumbProps(props: BreadcrumbProps): string[] {
  const errors: string[] = []

  if (
    props.variant &&
    !['default', 'contained', 'underlined'].includes(props.variant)
  ) {
    errors.push(`Invalid variant: ${String(props.variant)}`)
  }

  if (props.size && !['xs', 'sm', 'md', 'lg', 'xl', 'xxl'].includes(props.size)) {
    errors.push(`Invalid size: ${String(props.size)}`)
  }

  if (
    props.color &&
    !['primary', 'secondary', 'success', 'danger', 'warning', 'info', 'surface'].includes(
      props.color,
    )
  ) {
    errors.push(`Invalid color: ${String(props.color)}`)
  }

  return errors
}

/**
 * The Basecoat styling attributes for the breadcrumb ROOT, mirroring the props
 * one for one. A prop at its DEFAULT emits nothing — `:not([mono-size])` is md,
 * `:not([mono-color])` is primary, `:not([mono-variant])` is default — so the
 * rendered DOM is also the shortest hand-written markup that paints the same
 * (see breadcrumb.css). Shared so `<mono-breadcrumb>` and a standalone
 * `<mono-breadcrumb-list>` cannot drift apart.
 */
export function breadcrumbRootAttrs(props: {
  variant: string
  size: string
  color: string
}): { size: string | null; color: string | null; variant: string | null } {
  return {
    size: props.size === 'md' ? null : props.size,
    color: props.color === 'primary' ? null : props.color,
    variant: props.variant === 'default' ? null : props.variant,
  }
}
