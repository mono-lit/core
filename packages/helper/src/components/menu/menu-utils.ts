import type { MenuItem, MenuProps } from './menu-types.js'
import { CUSTOM_COLOR_CLASS, colorClassToken, isThemeColorToken, validateColorProp } from '../../composables/color.js'

// Re-exported from the shared composable (single source of truth).
export { isIconifyClass } from '../../composables/icon.js'

export function isItem(node: MenuItem): boolean {
  return !node.type || node.type === 'item'
}

export function isGroup(node: MenuItem): boolean {
  return node.type === 'group'
}

export function isDivider(node: MenuItem): boolean {
  return node.type === 'divider'
}

export function isSubheader(node: MenuItem): boolean {
  return node.type === 'subheader'
}

/**
 * Walk the tree and collect the chain (root → leaf) leading to the item with
 * the given id. Returns an empty array if not found.
 */
export function findActivePath(items: MenuItem[], id: string): MenuItem[] {
  for (const node of items) {
    if (node.id === id) return [node]

    if (node.items?.length) {
      const sub = findActivePath(node.items, id)
      if (sub.length) return [node, ...sub]
    }
  }

  return []
}

export function findItem(items: MenuItem[], id: string): MenuItem | null {
  for (const node of items) {
    if (node.id === id) return node

    if (node.items?.length) {
      const sub = findItem(node.items, id)
      if (sub) return sub
    }
  }

  return null
}

/**
 * Generate a 1–2 character alias from a menu item's title for the icon
 * fallback (used by `renderMenuIcon` when no `item.icon` and no slot icon are
 * provided). Each space-delimited word contributes its first character; output
 * is uppercased and capped at `max` characters.
 *
 * Examples:
 *   getMenuAlias('Dashboard')           → 'D'
 *   getMenuAlias('Post Budget')         → 'PB'
 *   getMenuAlias('Sales Order Report')  → 'SO'
 *   getMenuAlias('logbook')             → 'L'
 *   getMenuAlias('')                    → ''
 */
export function getMenuAlias(
  input: string | undefined | null,
  max = 2,
): string {
  if (!input || typeof input !== 'string') return ''
  const words = input.trim().split(/\s+/).filter(Boolean)
  if (!words.length) return ''
  return words
    .slice(0, max)
    .map((w) => w.charAt(0))
    .join('')
    .toUpperCase()
}

export function collectDefaultOpenGroups(items: MenuItem[]): string[] {
  const out: string[] = []

  const visit = (list: MenuItem[]) => {
    for (const node of list) {
      if (isGroup(node) && node.defaultOpen) out.push(node.id)

      if (node.items?.length) {
        visit(node.items)
      }
    }
  }

  visit(items)
  return out
}

export function generateMenuRootClasses(props: {
  density: string
  color: string
  nav: boolean
  selectable: boolean
  disabled: boolean
  cssClassName?: string
  rootExtra?: string
}): string {
  return [
    'mono-menu',
    props.density,
    // A literal colour must not become a class token — see colorClassToken.
    colorClassToken(props.color),
    props.nav ? 'nav' : 'plain',
    props.selectable ? '' : 'not-selectable',
    props.disabled ? 'disabled' : '',
    props.cssClassName ?? '',
    props.rootExtra ?? '',
  ]
    .filter(Boolean)
    .join(' ')
}

export function validateMenuProps(props: MenuProps): string[] {
  const errors: string[] = []

  if (props.density && !['compact', 'comfortable', 'default'].includes(props.density)) {
    errors.push(`Invalid density: ${String(props.density)}`)
  }

  const colorError = validateColorProp(props.color)
  if (colorError) errors.push(colorError)

  return errors
}

/**
 * The Basecoat styling attributes for the menu ROOT, mirroring the props one
 * for one. A prop at its DEFAULT emits nothing — `:not([mono-density])` is
 * comfortable and `:not([mono-color])` is primary — so the rendered DOM is
 * also the shortest hand-written markup that paints the same (see menu.css).
 * `nav` defaults to TRUE, so `mono-plain` is the attribute that says
 * something. Shared so `<mono-menu>` and a standalone `<mono-menu-list>`
 * cannot drift apart.
 */
export function menuRootAttrs(props: {
  density: string
  color: string
}): { density: string | null; color: string | null } {
  return {
    density: props.density === 'comfortable' ? null : props.density,
    color: isThemeColorToken(props.color) || props.color === 'surface'
      ? props.color === 'primary'
        ? null
        : props.color
      : CUSTOM_COLOR_CLASS,
  }
}
