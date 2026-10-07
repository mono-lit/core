// Shadow-DOM / SSR build entry for drawer — `@mono-lit/helper/ui/shadow/drawer`.
// Registers the SAME `mono-drawer` tag as the light build
// (`@mono-lit/helper/ui/drawer`), so a document must import only one of the two.
export { MonoDrawerShadow } from './mono-drawer.shadow.js'

export { MonoDrawerCore, type DrawerSlotName } from './drawer-core.js'

export type {
  DrawerPosition,
  DrawerSize,
  DrawerDimensionPreset,
  DrawerDimension,
  DrawerColor,
  DrawerSource,
  DrawerCssClass,
  DrawerClickEventDetail,
  DrawerClickEvent,
  DrawerOpenEventDetail,
  DrawerOpenEvent,
  DrawerCloseEventDetail,
  DrawerCloseEvent,
  DrawerProps,
  DrawerEvents,
} from './drawer-types.js'
