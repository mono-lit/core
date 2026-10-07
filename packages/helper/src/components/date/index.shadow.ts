// Shadow-DOM / SSR build entry for date — `@mono-lit/helper/ui/shadow/date`.
// Registers the SAME `mono-date` tag as the light build (`@mono-lit/helper/ui/date`),
// so a document must import only one of the two.
export { MonoDateShadow } from './mono-date.shadow.js'

export { MonoDateCore } from './date-core.js'

export type {
  DateType,
  DateSize,
  DateColor,
  DateVariant,
  DateValidationState,
  DateMode,
  DateCssClass,
  DateProps,
  DateEvents,
  DateChangeEventDetail,
} from './date-types.js'
