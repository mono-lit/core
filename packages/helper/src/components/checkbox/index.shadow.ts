// Shadow-DOM / SSR build entry for checkbox — `@mono-lit/helper/ui/shadow/checkbox`.
//
// Registers the SAME `mono-checkbox` tag as the light build
// (`@mono-lit/helper/ui/checkbox`), so a document must import only one of the two.
// Drop-in replacement: re-exports the identical types/utils as ./index.ts, plus
// the shadow class + core mixin.
export { MonoCheckboxShadow } from './mono-checkbox.shadow.js'

export { MonoCheckboxCore } from './checkbox-core.js'

export type {
  CheckboxSize,
  CheckboxColor,
  CheckboxProps,
  CheckboxEvents,
} from './checkbox-types.js'

export {
  validateCheckboxProps,
  generateCheckboxAttributes,
} from './checkbox-utils.js'
