/**
 * Sidebar (navigation drawer) Component Type Definitions
 */

export type SidebarMode = 'permanent' | 'temporary' | 'rail' | 'auto'

export type SidebarLocation = 'left' | 'right'

export type SidebarDensity = 'compact' | 'comfortable' | 'default'

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
export type SidebarColorToken =
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

export type SidebarColor = SidebarColorToken | (string & {})
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

export type SidebarVariant = 'flat' | 'elevated' | 'outlined'

export type SidebarSource =
  | 'scrim'
  | 'escape'
  | 'rail-toggle'
  | 'rail-hover'
  | 'manual'

export interface SidebarCssClass {
  root?: string
  panel?: string
  scrim?: string
  rail?: string
  header?: string
  body?: string
  footer?: string
  railToggle?: string
}

export type SidebarChangeEventDetail = {
  modelValue: boolean
  currentValue: boolean
  oldValue: boolean
  value: boolean
  source: SidebarSource
  sourceEvent?: Event
}

export type SidebarChangeEvent = CustomEvent<SidebarChangeEventDetail>

/**
 * Back-compat alias. The sidebar's state-change event was previously named
 * `mno-click`; it has been renamed to `mno-change` (plain `change`) to match the v-model
 * convention used by other components and to avoid bubble-collisions with
 * `<mono-menu>`'s per-item `click` event.
 */
export type SidebarClickEventDetail = SidebarChangeEventDetail
export type SidebarClickEvent = SidebarChangeEvent

/** Emitted on the false → true transition only. */
export type SidebarOpenEventDetail = SidebarChangeEventDetail
export type SidebarOpenEvent = CustomEvent<SidebarOpenEventDetail>

/** Emitted on the true → false transition only. */
export type SidebarCloseEventDetail = SidebarChangeEventDetail
export type SidebarCloseEvent = CustomEvent<SidebarCloseEventDetail>

export interface SidebarProps {
  /** Controls whether the sidebar is open. */
  modelValue?: boolean
  'model-value'?: boolean
  modelvalue?: boolean

  /** Display mode: permanent, temporary, rail, or auto. */
  mode?: SidebarMode
  /** Side of the viewport the sidebar is anchored to. */
  location?: SidebarLocation
  /** Spacing density of the sidebar contents. */
  density?: SidebarDensity
  /** Color theme applied to the sidebar. */
  color?: SidebarColor
  /** Visual style variant of the sidebar. */
  variant?: SidebarVariant

  /** Expanded width of the sidebar in pixels. */
  width?: number
  /** Collapsed rail width of the sidebar in pixels. */
  railWidth?: number
  'rail-width'?: number

  /** Expand the rail on hover while collapsed. */
  expandOnHover?: boolean
  'expand-on-hover'?: boolean
  /**
   * External rail-state binding. Provide a boolean to take over the rail's
   * expanded/collapsed state — clicking any external button you wire up can
   * mutate the bound value to flip the sidebar. Setting this prop also
   * **hides the default chevron toggle**, since you're controlling the state.
   * Omit (the default `null`) to keep the built-in chevron toggle.
   */
  rail?: boolean | null
  /** Keep the sidebar within its parent rather than the viewport. */
  contained?: boolean
  /** Prevent the sidebar from closing on scrim click or Escape. */
  persistent?: boolean
  /** Close the sidebar when the Escape key is pressed. */
  closeOnEscape?: boolean
  'close-on-escape'?: boolean
  /** Close the sidebar when the scrim is clicked. */
  closeOnScrim?: boolean
  'close-on-scrim'?: boolean
  /** Lock page scroll while a temporary sidebar is open. */
  lockScroll?: boolean
  'lock-scroll'?: boolean
  /** Show the dimming scrim behind a temporary sidebar. */
  showScrim?: boolean
  'show-scrim'?: boolean

  /** Custom CSS classes applied to internal sidebar parts. */
  cssClass?: SidebarCssClass
  cssclass?: SidebarCssClass
  'css-class'?: SidebarCssClass | string
  /** Root-level class name applied to the sidebar. */
  cssClassName?: string
}

export interface SidebarEvents {
  // The plain names — what a template listens to (`@change`, `@click`, …).
  change: SidebarChangeEvent
  open: SidebarOpenEvent
  close: SidebarCloseEvent
  // Kept as aliases for existing code: the `mno-` prefix and its camel twin.
  'mno-change': SidebarChangeEvent
  mnoChange: SidebarChangeEvent
  'mno-open': SidebarOpenEvent
  mnoOpen: SidebarOpenEvent
  'mno-close': SidebarCloseEvent
  mnoClose: SidebarCloseEvent
}
