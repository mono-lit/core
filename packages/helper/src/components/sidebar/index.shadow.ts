// Shadow-DOM / SSR build entry for sidebar — `@mono-lit/helper/ui/shadow/sidebar`.
// Registers the SAME `mono-sidebar` tag as the light build
// (`@mono-lit/helper/ui/sidebar`), so a document must import only one of the two.
export { MonoSidebarShadow } from './mono-sidebar.shadow.js'

export { MonoSidebarCore } from './sidebar-core.js'
export type { SidebarSlotName } from './sidebar-core.js'

export type {
  SidebarMode,
  SidebarLocation,
  SidebarDensity,
  SidebarColor,
  SidebarVariant,
  SidebarSource,
  SidebarCssClass,
  SidebarChangeEventDetail,
  SidebarChangeEvent,
  SidebarClickEventDetail,
  SidebarClickEvent,
  SidebarOpenEventDetail,
  SidebarOpenEvent,
  SidebarCloseEventDetail,
  SidebarCloseEvent,
  SidebarProps,
  SidebarEvents,
} from './sidebar-types.js'

export {
  SIDEBAR_AUTO_BREAKPOINT,
  isAutoTemporary,
  resolveMode,
  generateSidebarRootClasses,
  validateSidebarProps,
} from './sidebar-utils.js'
