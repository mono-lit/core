// Shadow-DOM / SSR build entry for dropdown — `@mono-lit/helper/ui/shadow/dropdown`.
// Registers the SAME `mono-dropdown` tag as the light build
// (`@mono-lit/helper/ui/dropdown`), so a document must import only one of the two.
export { MonoDropdownShadow } from './mono-dropdown.shadow.js'

export { MonoDropdownCore } from './dropdown-core.js'

export type {
  DropdownPlacement,
  DropdownSide,
  DropdownAlign,
  DropdownTrigger,
  DropdownSize,
  DropdownColor,
  DropdownSource,
  DropdownCssClass,
  DropdownClickEventDetail,
  DropdownClickEvent,
  DropdownOpenEventDetail,
  DropdownOpenEvent,
  DropdownCloseEventDetail,
  DropdownCloseEvent,
  DropdownProps,
  DropdownEvents,
} from './dropdown-types.js'
