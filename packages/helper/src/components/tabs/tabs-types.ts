/**
 * Tabs Component Type Definitions
 */

export type TabsSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'xxl'

export type TabsColor =
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

export type TabsVariant = 'underline' | 'pill' | 'ghost'

/** Which way the strip runs. Written to the tablist's own `aria-orientation`. */
export type TabsOrientation = 'horizontal' | 'vertical'

export interface TabItem {
  id: string
  label: string
  badge?: string | number
  disabled?: boolean
}

export interface TabsCssClass {
  root?: string
  tab?: string
  tabActive?: string
  tabDisabled?: string
  icon?: string
  label?: string
  badge?: string
  indicator?: string
}

export type TabsClickEventDetail = {
  modelValue: string
  currentValue: string
  oldValue: string
  value: string
  item: TabItem
  sourceEvent?: Event
}

export type TabsClickEvent = CustomEvent<TabsClickEventDetail>

export interface TabsProps {
  /** List of tabs to render. */
  items?: TabItem[]

  /** Two-way bound id of the active tab. */
  modelValue?: string
  'model-value'?: string
  modelvalue?: string

  /** Id of the active tab (kept in sync with modelValue). */
  value?: string

  /** Size of the tabs. */
  size?: TabsSize
  /** Color theme of the tabs. */
  color?: TabsColor
  /** Visual style of the tabs. */
  variant?: TabsVariant
  /**
   * Which way the strip runs (default `horizontal`). Sets the tablist's
   * `aria-orientation`, which is what the vertical styling keys on.
   */
  orientation?: TabsOrientation
  /** Disables interaction with all tabs. */
  disabled?: boolean

  /** Per-part class overrides for styling internal elements. */
  cssClass?: TabsCssClass
  cssclass?: TabsCssClass
  'css-class'?: TabsCssClass | string
}

export interface TabsEvents {
  // The plain names — what a template listens to (`@change`, `@click`, …).
  change: TabsClickEvent
  // Kept as aliases for existing code: the `mno-` prefix and its camel twin.
  'mno-click': TabsClickEvent
  mnoClick: TabsClickEvent
}
