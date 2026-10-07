// Shadow-DOM / SSR build entry for button — `@mono-lit/helper/ui/shadow/button`.
//
// Registers the SAME `mono-button` tag as the light build (`@mono-lit/helper/ui/button`),
// so a document must import only one of the two. Drop-in replacement: re-exports
// the identical types/utils as ./index.ts, plus the shadow class + core mixin.
export { MonoButtonShadow } from './mono-button.shadow.js'

export { MonoButtonCore } from './button-core.js'

export type {
  ButtonSize,
  ButtonColor,
  ButtonVariant,
  ButtonRounded,
  ButtonIconPosition,
  ButtonBadgeColor,
  ButtonProps,
  // `prepend-config` / `append-config` are public props, so their shape has to
  // be nameable — without this a consumer cannot type the object they bind.
  ButtonAffixProps,
  ButtonEvents,
  IconProps,
} from './button-types.js'

export {
  generateBadgeClasses,
  processIconContent,
  validateButtonProps,
} from './button-utils.js'
