/**
 * Dropdown Component Type Definitions
 */

export type DropdownSide = 'top' | 'bottom' | 'left' | 'right'

export type DropdownAlign = 'start' | 'end' | 'center'

export type DropdownPlacement =
  | 'top'
  | 'top-start'
  | 'top-end'
  | 'bottom'
  | 'bottom-start'
  | 'bottom-end'
  | 'left'
  | 'left-start'
  | 'left-end'
  | 'right'
  | 'right-start'
  | 'right-end'

export type DropdownTrigger = 'click' | 'hover' | 'manual'

export type DropdownSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'xxl'

export type DropdownColor =
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

export type DropdownSource =
  | 'trigger'
  | 'outside'
  | 'escape'
  | 'manual'
  | 'hover'

export interface DropdownCssClass {
  root?: string
  main?: string
  panel?: string
  body?: string
}

export type DropdownClickEventDetail = {
  modelValue: boolean
  currentValue: boolean
  oldValue: boolean
  value: boolean
  source: DropdownSource
  sourceEvent?: Event
  resolvedSide: DropdownSide
}

export type DropdownClickEvent = CustomEvent<DropdownClickEventDetail>

/**
 * `open` and `close` reuse the same detail payload as `toggle`,
 * but fire only on the matching transition. `toggle` always fires too —
 * pick whichever channel reads cleaner in your handler.
 */
export type DropdownOpenEventDetail = DropdownClickEventDetail
export type DropdownCloseEventDetail = DropdownClickEventDetail
export type DropdownOpenEvent = CustomEvent<DropdownOpenEventDetail>
export type DropdownCloseEvent = CustomEvent<DropdownCloseEventDetail>

export interface DropdownProps {
  /** Two-way bound open state of the dropdown. */
  modelValue?: boolean
  'model-value'?: boolean
  modelvalue?: boolean

  /** Panel placement relative to the trigger. */
  placement?: DropdownPlacement
  /** How the dropdown opens: click, hover, or manual. */
  trigger?: DropdownTrigger

  /** Sizing scale of the dropdown panel. */
  size?: DropdownSize
  /** Color theme applied to the dropdown. */
  color?: DropdownColor

  /** Disables interaction and prevents opening. */
  disabled?: boolean

  /**
   * When true, the panel auto-flips to the opposite side when the preferred
   * side does not have enough room in the viewport.
   */
  flip?: boolean

  /**
   * When true, the panel shifts along the cross axis to stay inside the
   * viewport instead of overflowing.
   */
  shift?: boolean

  /**
   * Pixel gap between the activator and the panel.
   */
  offset?: number

  /** Closes the dropdown when clicking outside it. */
  closeOnOutsideClick?: boolean
  'close-on-outside-click'?: boolean
  closeonoutsideclick?: boolean

  /** Closes the dropdown when the Escape key is pressed. */
  closeOnEscape?: boolean
  'close-on-escape'?: boolean
  closeonescape?: boolean

  /** Per-element class overrides for internal parts. */
  cssClass?: DropdownCssClass
  cssclass?: DropdownCssClass
  'css-class'?: DropdownCssClass | string
}

export interface DropdownEvents {
  // The plain names — what a template listens to (`@change`, `@click`, …).
  toggle: DropdownClickEvent
  open: DropdownOpenEvent
  close: DropdownCloseEvent
  // Kept as aliases for existing code: the `mno-` prefix and its camel twin.
  'mno-click': DropdownClickEvent
  mnoClick: DropdownClickEvent
  'mno-open': DropdownOpenEvent
  mnoOpen: DropdownOpenEvent
  'mno-close': DropdownCloseEvent
  mnoClose: DropdownCloseEvent
}
