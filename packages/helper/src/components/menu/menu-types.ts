/**
 * Menu (recursive nav list) Component Type Definitions
 */

export type MenuDensity = 'compact' | 'comfortable' | 'default'

/**
 * A theme palette slot, `surface` for the unpainted default, or any CSS color —
 * `#7c3aed`, `rgb(124 58 237)`, `hsl(258 90% 66%)`.
 *
 * A slot name follows the active `.theme-color-*` preset automatically; a literal is
 * carried inline and its ink is derived from its own luminance. Note `teal` and
 * `purple` are CSS keywords too — the slot list is matched first, so they always mean
 * the theme colour.
 *
 * The `(string & {})` arm keeps the slot names in editor autocomplete.
 */
export type MenuColorToken =
  | 'primary'
  | 'secondary'
  | 'success'
  | 'danger'
  | 'warning'
  | 'info'
  | 'teal'
  | 'purple'
  | 'neutral'
  | 'dark'
  | 'surface'

export type MenuColor = MenuColorToken | (string & {})
| 'primary'
  | 'secondary'
  | 'success'
  | 'danger'
  | 'warning'
  | 'info'
  | 'teal'
  | 'purple'
  | 'neutral'
  | 'dark'
  | 'surface'

export type MenuBadgeColor =
  | 'default'
  | 'primary'
  | 'success'
  | 'danger'
  | 'warning'
  | 'info'

/**
 * Menu items are a discriminated union by `type`.
 * - `type` omitted or `'item'` — clickable nav row, may have `children` (auto-nested with indent).
 * - `'group'` — collapsible header + children list.
 * - `'divider'` — thin horizontal rule.
 * - `'subheader'` — small label heading for the section beneath.
 */
export interface MenuItemBase {
  id: string
  type?: 'item' | 'group' | 'divider' | 'subheader'
  title?: string
  subtitle?: string
  icon?: string
  appendIcon?: string
  badge?: string | number
  badgeColor?: MenuBadgeColor
  href?: string
  disabled?: boolean

  /**
   * Nested menu rows.
   * Used by both normal items and group items.
   */
  items?: MenuItem[]

  /** Group items only — initial expansion state. */
  defaultOpen?: boolean
}
export type MenuItem = MenuItemBase

export interface MenuCssClass {
  root?: string
  list?: string
  item?: string
  itemActive?: string
  itemDisabled?: string
  action?: string
  icon?: string
  appendIcon?: string
  content?: string
  title?: string
  subtitle?: string
  badge?: string
  group?: string
  groupHeader?: string
  groupBody?: string
  groupChevron?: string
  divider?: string
  subheader?: string
}

export type MenuChangeEventDetail = {
  modelValue: string | string[]
  oldValue: string | string[]
  value: string
  item: MenuItem
  selected: boolean
  sourceEvent?: Event
}

export type MenuChangeEvent = CustomEvent<MenuChangeEventDetail>

export type MenuClickEventDetail = {
  value: string
  item: MenuItem
  sourceEvent?: Event
}

export type MenuClickEvent = CustomEvent<MenuClickEventDetail>

export type MenuToggleGroupEventDetail = {
  groupId: string
  open: boolean
  oldOpen: boolean
  group: MenuItem
  sourceEvent?: Event
}

export type MenuToggleGroupEvent = CustomEvent<MenuToggleGroupEventDetail>

export interface MenuProps {
  /** Menu items rendered as a recursive list. */
  items?: MenuItem[]

  /** Selected item id, or array of ids when multiple. */
  modelValue?: string | string[]
  'model-value'?: string | string[]
  modelvalue?: string | string[]

  /** Allows selecting multiple items at once. */
  multiple?: boolean
  /** Vertical spacing density of menu rows. */
  density?: MenuDensity
  /** Theme color applied to active and accent states. */
  color?: MenuColor
  /** Renders rows as navigation links. */
  nav?: boolean
  /** Enables item selection and listbox semantics. */
  selectable?: boolean
  /** Disables interaction across the whole menu. */
  disabled?: boolean

  /**
   * Controlled mode — the parent owns `modelValue` (e.g. bound to the current
   * route). Clicks emit `click` but the highlight doesn't move until
   * `modelValue` updates. Use with Vue Router so the active item can't jump
   * ahead of an async navigation.
   */
  controlled?: boolean

  /** Per-part class overrides for internal elements. */
  cssClass?: MenuCssClass
  cssclass?: MenuCssClass
  'css-class'?: MenuCssClass | string
  /** Plain root class string applied to the menu. */
  cssClassName?: string
}

export interface MenuEvents {
  // The plain names — what a template listens to (`@change`, `@click`, …).
  change: MenuChangeEvent
  click: MenuClickEvent
  'toggle-group': MenuToggleGroupEvent
  toggleGroup: MenuToggleGroupEvent
  // Kept as aliases for existing code: the `mno-` prefix and its camel twin.
  'mno-change': MenuChangeEvent
  mnoChange: MenuChangeEvent
  'mno-click': MenuClickEvent
  mnoClick: MenuClickEvent
  'mno-toggle-group': MenuToggleGroupEvent
  mnoToggleGroup: MenuToggleGroupEvent
}

/**
 * `<mono-menu-list>` `type` semantics:
 *
 * 1. **Items-array mode** (`type` interpreted as renderer mode):
 *    - `"children"` — full recursive renderer (items, dividers, subheaders, nested groups).
 *    - `"group"` — render every top-level entry as a collapsible group; non-group items are
 *      skipped silently.
 *
 * 2. **Direct/declarative mode** (`type` interpreted as the synthesised `MenuItem.type`):
 *    Used when the element has direct attribute props (`title`, `icon`, `href`, …) **or**
 *    declarative `<mono-menu-list>` children.
 *    - `"children"` (default) / `"item"` — regular menu row; child elements compose its
 *      sub-list (auto-indent + guide rail).
 *    - `"group"` — collapsible group; child elements compose the group body.
 *    - `"divider"` / `"subheader"` — leaf rows; children are ignored.
 *
 * Disambiguation: if the element has **only** an `items` array (no direct props, no child
 * elements), the renderer-mode meaning applies. Otherwise the `MenuItem.type` meaning applies.
 */
export type MonoMenuListType = 'children' | 'item' | 'group' | 'divider' | 'subheader'

export interface MenuListProps {
  /**
   * In list mode:
   *   <mono-menu-list :items.prop="items" />
   *
   * In direct single-row mode:
   *   <mono-menu-list type="group" title="Sales" :items.prop="children" />
   * Here, `items` becomes the built item's `children`.
   *
   * In declarative mode, child `<mono-menu-list>` elements (or any other HTML)
   * compose the row's body — arbitrary depth supported.
   */
  items?: MenuItem[]

  /** Render one full item object, useful with Vue `v-for`. */
  item?: MenuItem

  /** Render mode, or the synthesised item's type in direct mode. */
  type?: MonoMenuListType

  /** Direct single-row props. `item-type` is a legacy alias for `type` in declarative mode. */
  itemType?: MenuItem['type']
  'item-type'?: MenuItem['type']
  /** Row title text. */
  title?: string
  /** Secondary text shown beneath the title. */
  subtitle?: string
  /** Leading icon shown before the title. */
  icon?: string
  /** Trailing icon shown after the title. */
  appendIcon?: string
  'append-icon'?: string
  /** Badge content shown on the row. */
  badge?: string | number
  /** Color theme of the badge. */
  badgeColor?: MenuBadgeColor
  'badge-color'?: MenuBadgeColor
  /** Link target for navigation rows. */
  href?: string
  /** Disables interaction with the row. */
  disabled?: boolean
  /** Initial expansion state for group rows. */
  defaultOpen?: boolean
  'default-open'?: boolean
}
