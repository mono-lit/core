// Shadow-DOM / SSR build entry for tabs — `@mono-lit/helper/ui/shadow/tabs`.
//
// Registers the SAME `mono-tabs` tag as the light build (`@mono-lit/helper/ui/tabs`),
// so a document must import only one of the two. Drop-in replacement: re-exports
// the identical types as ./index.ts, plus the shadow class + core mixin.
export { MonoTabsShadow } from './mono-tabs.shadow.js'

export { MonoTabsCore, coerceTabItems } from './tabs-core.js'

export type {
  TabsSize,
  TabsColor,
  TabsVariant,
  TabItem,
  TabsCssClass,
  TabsClickEventDetail,
  TabsClickEvent,
  TabsProps,
  TabsEvents,
} from './tabs-types.js'
