// Shadow-DOM / SSR build entry for input — `@mono-lit/helper/ui/shadow/input`.
// Registers the SAME `mono-input` tag as the light build (`@mono-lit/helper/ui/input`),
// so a document must import only one of the two.
export { MonoInputShadow } from './mono-input.shadow.js'

export { MonoInputCore } from './input-core.js'
export type { InputSlotName } from './input-core.js'

export type {
  InputType,
  InputSize,
  InputVariant,
  InputColor,
  InputProps,
  InputEvents,
} from './input-types.js'

export {
  applyFormat,
  caretAfterFormat,
  localeSeparators,
  normaliseValue,
  parseFormat,
  resolveFormat,
  significantFor,
  stripFormat,
} from './input-format.js'

export type {
  InputFormat,
  InputFormatCtx,
  InputFormatDescriptor,
  InputFormatOn,
} from './input-format.js'

export {
  validateInputProps,
  generateInputAttributes,
  generateInputAriaAttributes,
  getInputIcon,
} from './input-utils.js'
