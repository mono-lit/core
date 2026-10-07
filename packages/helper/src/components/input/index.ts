export { MonoInput } from './mono-input.js'

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