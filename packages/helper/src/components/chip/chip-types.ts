/**
 * Chip Component Type Definitions
 */

export type ChipSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'xxl'

export type ChipColor =
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

export type ChipVariant = 'soft' | 'solid' | 'outline'
export type ChipRounded =
  | 'none'
  | 'xs'
  | 'sm'
  | 'md'
  | 'lg'
  | 'xl'
  | 'xxl'
  | 'full'
export type ChipIconPosition = 'left' | 'right'

/**
 * How a field that holds many chips (`mono-tag-input`, `mono-dropdown-table`)
 * lays them out.
 *
 * - `flex` (default) — the chips wrap onto new lines, so the field grows taller
 *   as more are selected. This is the historical behaviour.
 * - `inline` — the chips stay on ONE line in a horizontally scrolling strip, so
 *   the field keeps its height no matter how many are selected. The strip is
 *   scrolled only by the `‹` / `›` buttons the field renders next to its clear
 *   button: there is no scrollbar, and wheel / drag / arrow-key scrolling are
 *   all deliberately inert.
 *
 * `inline` also turns OFF the `max` "+N more" overflow chip — scrolling is the
 * overflow mechanism, and running both would hide chips the strip could reach.
 */
export type ChipBehaviour = 'flex' | 'inline'

/**
 * Per-element class overrides. Each key maps to one of the rendered internal
 * elements; the supplied class string is appended to the element's base class.
 */
export interface ChipCssClass {
  root?: string
  main?: string
  content?: string
  label?: string
  dot?: string
  close?: string
}

export interface MonoChipProps {
  /** Sizing scale of the chip. */
  size?: ChipSize
  /** Color theme applied to the chip. */
  color?: ChipColor
  /** Visual style: soft, solid, or outline. */
  variant?: ChipVariant
  /** Corner style: pill, rounded, or square. */
  rounded?: ChipRounded

  /** Text content shown inside the chip. */
  label?: string

  /** Shows a status dot before the label. */
  dot?: boolean
  /** Adds a close button to remove the chip. */
  removable?: boolean
  /** Disables interaction and dims the chip. */
  disabled?: boolean
  /** Makes the chip clickable and toggleable. */
  clickable?: boolean

  /** Two-way bound selected state of the chip. */
  modelValue?: boolean
  'model-value'?: boolean
  modelvalue?: boolean

  /** Whether the chip is in the selected state. */
  selected?: boolean

  /** Renders the chip as a link to this URL. */
  href?: string
  /** Link target when an href is set. */
  target?: string

  /**
   * Recommended JS/TS prop.
   */
  iconPosition?: ChipIconPosition

  /**
   * Kebab-case alias.
   */
  'icon-position'?: ChipIconPosition

  /**
   * Lowercase fallback for static camelCase HTML.
   */
  iconposition?: ChipIconPosition

  /**
   * Recommended JS/TS prop.
   */
  ariaLabelText?: string

  /**
   * Shorter alias.
   */
  ariaLabel?: string

  /**
   * Native/kebab aliases.
   */
  'aria-label'?: string
  'aria-label-text'?: string

  /**
   * Lowercase fallback for static camelCase HTML.
   */
  arialabel?: string
  arialabeltext?: string

  /**
   * Recommended JS/TS prop.
   */
  closeLabel?: string

  /**
   * Kebab-case alias.
   */
  'close-label'?: string

  /**
   * Lowercase fallback for static camelCase HTML.
   */
  closelabel?: string

  /** Per-element class overrides for internal parts. */
  cssClass?: ChipCssClass
  'css-class'?: ChipCssClass
}

export type StatusDotState = 'online' | 'offline' | 'busy' | 'away' | 'custom'

export interface MonoStatusDotProps {
  /** Status state controlling the dot's preset color. */
  status?: StatusDotState
  /** Status state controlling the dot's preset color. */
  state?: StatusDotState
  /** Adds a pulsing animation to the dot. */
  pulse?: boolean
  /** Text label shown next to the dot. */
  label?: string
  /** Custom dot color for the custom state. */
  color?: string
}

export interface ChipModelEventDetail {
  modelValue: boolean
  currentValue: boolean
  oldValue: boolean
  value: boolean
  selected: boolean
  label: string
  sourceEvent?: Event
}

export type ChipModelEvent = CustomEvent<ChipModelEventDetail>

export interface ChipEvents {
  // The plain names — what a template listens to (`@change`, `@click`, …).
  click: ChipModelEvent
  close: ChipModelEvent
  // Kept as aliases for existing code: the `mno-` prefix and its camel twin.
  'mno-click': ChipModelEvent
  mnoClick: ChipModelEvent
  'mno-close': ChipModelEvent
  mnoClose: ChipModelEvent
}
