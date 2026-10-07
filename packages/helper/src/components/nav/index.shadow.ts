// Shadow-DOM / SSR build entry for nav — `@mono-lit/helper/ui/shadow/nav`.
//
// Registers the SAME `mono-nav` tag as the light build (`@mono-lit/helper/ui/nav`),
// so a document must import only one of the two. See
// plan/2026-06-23-shadow-dom-ssr-mixin-spike.md.
export { MonoNavShadow } from './mono-nav.shadow.js'

export { MonoNavCore } from './nav-core.js'
export type { NavSlotName } from './nav-core.js'

export type {
  NavDensity,
  NavColor,
  NavVariant,
  NavCssClass,
  NavProps,
  NavEvents,
} from './nav-types.js'

export {
  getNavHeight,
  generateNavRootClasses,
  validateNavProps,
} from './nav-utils.js'
