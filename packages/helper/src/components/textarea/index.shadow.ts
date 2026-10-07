// Shadow-DOM / SSR build entry for textarea — `@mono-lit/helper/ui/shadow/textarea`.
// Registers the SAME `mono-textarea` tag as the light build
// (`@mono-lit/helper/ui/textarea`), so a document must import only one of the two.
export { MonoTextareaShadow } from './mono-textarea.shadow.js'

export { MonoTextareaCore, type TextareaSlotName } from './textarea-core.js'

export type {
  TextareaSize,
  TextareaColor,
  TextareaVariant,
  TextareaValidationState,
  TextareaProps,
  TextareaEvents,
} from './textarea-types.js'

export {
  validateTextareaProps,
} from './textarea-utils.js'
