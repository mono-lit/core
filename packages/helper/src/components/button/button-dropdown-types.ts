/**
 * `mono-button-dropdown` type definitions.
 *
 * A row of actions that stays flat while it is short and collapses behind a
 * single trigger once it isn't — button plus dropdown in one element.
 */

import type { DropdownPlacement, DropdownSource } from '../dropdown/dropdown-types.js'
import type { ButtonEvents, ButtonProps } from './button-types.js'
import type { MonoEventProps } from '../../composables/element-props.js'

export type { DropdownPlacement as ButtonDropdownPlacement }

/**
 * One entry in `buttons`.
 *
 * Extends the full `<mono-button>` prop surface, because that is exactly what
 * each entry renders — `loading`, `disabled`, `throttle`, `badge`, `variant` and
 * everything else behave as they would on a standalone button.
 */
export interface ButtonDropdownItem
  extends ButtonProps,
    Omit<MonoEventProps<ButtonEvents>, 'onClick'> {
  /** Text of the button (and of its row in the menu). */
  label?: string
  /**
   * Icon class placed in the button's icon slot, e.g. `'i-mdi-pencil'`.
   * `iconPosition` (inherited from `ButtonProps`) decides which side it sits on.
   */
  icon?: string
  /**
   * Runs when this entry is clicked, before the element's own `click`.
   * Bind the array with `.prop` — a function can't survive an attribute.
   */
  onClick?: (event: MouseEvent) => void
  /** Extra class on this entry's button. */
  className?: string
}

/** Detail shared by `click` / `open` / `close`. */
export interface ButtonDropdownClickEventDetail {
  /** The entry that was activated (absent for open/close). */
  item?: ButtonDropdownItem
  /** Its index in `buttons` (absent for open/close). */
  index?: number
  /** Whether the menu is open after this event. */
  modelValue: boolean
  /** Whether the entries are currently collapsed behind the trigger. */
  collapsed: boolean
  source: DropdownSource
  sourceEvent?: Event
}

export type ButtonDropdownClickEvent = CustomEvent<ButtonDropdownClickEventDetail>
export type ButtonDropdownOpenEvent = CustomEvent<ButtonDropdownClickEventDetail>
export type ButtonDropdownCloseEvent = CustomEvent<ButtonDropdownClickEventDetail>

/**
 * Events emitted by `<mono-button-dropdown>`. Each name is listed twice — kebab
 * and camel — because `dispatchMonoEvent` emits both spellings.
 */
export interface ButtonDropdownEvents {
  // The plain names — what a template listens to (`@change`, `@click`, …).
  click: ButtonDropdownClickEvent
  open: ButtonDropdownOpenEvent
  close: ButtonDropdownCloseEvent
  // Kept as aliases for existing code: the `mno-` prefix and its camel twin.
  'mno-click': ButtonDropdownClickEvent
  mnoClick: ButtonDropdownClickEvent
  'mno-open': ButtonDropdownOpenEvent
  mnoOpen: ButtonDropdownOpenEvent
  'mno-close': ButtonDropdownCloseEvent
  mnoClose: ButtonDropdownCloseEvent
}

/** Per-part class overrides. */
export interface ButtonDropdownCssClass {
  root?: string
  /** The inline row rendered when the entries are NOT collapsed. */
  row?: string
  /** The `⋮` trigger button. */
  trigger?: string
  /** The floating panel. */
  panel?: string
  /** The `<ul>` inside the panel. */
  list?: string
  /** Each `<li>`. */
  item?: string
}

/**
 * Props for `<mono-button-dropdown>`.
 *
 * `buttons`, `trigger` and `cssClass` are objects/arrays, so bind them with the
 * `.prop` modifier (`:buttons.prop="actions"`); a plain attribute would only ever
 * carry a stringified value.
 */
export interface ButtonDropdownProps {
  /** The actions. Each entry takes every `<mono-button>` prop. */
  buttons?: ButtonDropdownItem[]
  /**
   * How many entries may render inline. While `buttons.length <= min` they are
   * all shown as plain buttons; past that, ALL of them move into the dropdown and
   * only the trigger remains. Default `1`.
   */
  min?: number
  /**
   * Colors the `⋮` trigger. Entries are deliberately NOT colored inside the menu
   * — an entry's own `color` tints its ICON there instead, since a list of
   * differently-coloured buttons reads as noise. Outside the menu (inline, when
   * the list is short enough) entries keep their real button styling.
   */
  color?: ButtonProps['color']
  /** Visual style of the `⋮` trigger — same values `<mono-button>` takes. */
  variant?: ButtonProps['variant']
  /** Size of the `⋮` trigger. */
  size?: ButtonProps['size']
  /** Corner radius of the `⋮` trigger — the same scale `<mono-button>` takes. */
  rounded?: ButtonProps['rounded']
  /** Where the panel opens relative to the trigger. Default `'bottom-end'`. */
  placement?: DropdownPlacement
  /** Gap in px between trigger and panel. Default `4`. */
  offset?: number
  /**
   * Props for the `⋮` trigger button — same shape as an entry, minus the click.
   * The button's events are accepted as `on<Event>` keys (`onLoadingChange`, …).
   */
  trigger?: ButtonProps & MonoEventProps<ButtonEvents> & { label?: string; icon?: string }
  /** Open state. Two-way is opt-in: listen for `open` / `close`. */
  modelValue?: boolean
  'model-value'?: boolean
  /** Disables the trigger and every entry. */
  disabled?: boolean
  /** Close when a menu entry is clicked. Default `true`. */
  closeOnSelect?: boolean
  'close-on-select'?: boolean
  closeOnOutsideClick?: boolean
  'close-on-outside-click'?: boolean
  closeOnEscape?: boolean
  'close-on-escape'?: boolean
  cssClass?: ButtonDropdownCssClass
  'css-class'?: ButtonDropdownCssClass | string
  cssClassName?: string
}
