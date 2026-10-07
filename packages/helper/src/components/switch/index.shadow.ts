// Shadow-DOM / SSR build entry for switch — `@mono-lit/helper/ui/shadow/switch`.
// Registers the SAME `mono-switch` tag as the light build
// (`@mono-lit/helper/ui/switch`), so a document must import only one of the two.
export { MonoSwitchShadow } from './mono-switch.shadow.js'

export { MonoSwitchCore } from './switch-core.js'

export type {
  SwitchSize,
  SwitchColor,
  SwitchProps,
  SwitchEvents,
} from './switch-types.js'

export {
  validateSwitchProps,
  generateSwitchAttributes,
} from './switch-utils.js'
