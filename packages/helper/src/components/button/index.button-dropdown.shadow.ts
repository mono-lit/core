// `@mono-lit/helper/ui/shadow/button-dropdown` — the shadow/SSR build.
//
// Registers the DISTINCT tag `mono-shadow-button-dropdown` (and, through the
// element module, `mono-shadow-button`), so it can coexist with the light build.
export { MonoButtonDropdownShadow } from './mono-button-dropdown.shadow.js'
export { MonoButtonDropdownCore } from './button-dropdown-core.js'

export type {
  ButtonDropdownItem,
  ButtonDropdownProps,
  ButtonDropdownEvents,
  ButtonDropdownCssClass,
  ButtonDropdownPlacement,
  ButtonDropdownClickEventDetail,
  ButtonDropdownClickEvent,
  ButtonDropdownOpenEvent,
  ButtonDropdownCloseEvent,
} from './button-dropdown-types.js'
