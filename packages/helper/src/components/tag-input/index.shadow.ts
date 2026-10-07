// Shadow-DOM / SSR build entry for tag-input — `@mono-lit/helper/ui/shadow/tag-input`.
// Registers the SAME `mono-tag-input` tag as the light build
// (`@mono-lit/helper/ui/tag-input`), so a document must import only one of the two.
export { MonoTagInputShadow } from './mono-tag-input.shadow.js'

export { MonoTagInputCore, type TagInputSlotName } from './tag-input-core.js'

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
  TagInputModelEventDetail,
  TagInputModelEvent,
  TagInputProps,
  TagInputEvents,
  TagInputChipProps,
  ChipBehaviour,
} from './tag-input-types.js'

export {
  validateTagInputProps,
  normalizeSuggestions,
} from './tag-input-utils.js'
