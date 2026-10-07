export { MonoTagInput } from './mono-tag-input.js'

export type {
  TagInputSize,
  TagInputColor,
  TagInputVariant,
  TagInputValidationState,
  TagInputValue,
  TagInputItem,
  TagInputDisplayValue,
  TagInputDisplayGroup,
  TagInputDataSource,
  TagInputLoadMore,
  TagInputCssClass,
  TagInputDropdownOptions,
  TagInputModelEventDetail,
  TagInputModelEvent,
  TagInputProps,
  TagInputEvents,
  // `chip` is a public prop, so its shape has to be nameable — without this a
  // consumer cannot type the object they pass to `:chip.prop`.
  TagInputChipProps,
  ChipBehaviour,
} from './tag-input-types.js'

export {
  validateTagInputProps,
  normalizeSuggestions,
} from './tag-input-utils.js'
