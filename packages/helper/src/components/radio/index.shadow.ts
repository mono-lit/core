// Shadow-DOM / SSR build entry for radio — `@mono-lit/helper/ui/shadow/radio`.
//
// Registers the SAME `mono-radio` tag as the light build (`@mono-lit/helper/ui/radio`),
// so a document must import only one of the two. Drop-in replacement: re-exports
// the identical types/utils as ./index.ts, plus the shadow class + core mixin.
export { MonoRadioShadow } from './mono-radio.shadow.js'

export { MonoRadioCore } from './radio-core.js'

export type {
  RadioSize,
  RadioColor,
  RadioProps,
  RadioEvents,
} from './radio-types.js'

export {
  validateRadioProps,
  generateRadioAttributes,
} from './radio-utils.js'
