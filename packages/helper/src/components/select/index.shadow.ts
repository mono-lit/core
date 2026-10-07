// Shadow-DOM / SSR build entry for select — `@mono-lit/helper/ui/shadow/select`.
// Registers the SAME `mono-select` tag as the light build
// (`@mono-lit/helper/ui/select`), so a document must import only one of the two.
export { MonoSelectShadow } from './mono-select.shadow.js'

export { MonoSelectCore, type SelectSlotName } from './select-core.js'

export type {
  SelectSize,
  SelectColor,
  SelectVariant,
  SelectValidationState,
  SelectValue,
  SelectItem,
  SelectDisplayValue,
  SelectDisplayGroup,
  SelectDataSource,
  SelectDataSourceLoadMore,
  SelectCssClass,
  SelectModelEventDetail,
  SelectModelEvent,
  SelectProps,
  SelectEvents,
} from './select-types.js'

export { validateSelectProps } from './select-utils.js'
