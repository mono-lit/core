// Shadow-DOM / SSR build entry for card — `@mono-lit/helper/ui/shadow/card`.
//
// Registers `<mono-shadow-card>` — a DISTINCT tag from the light build's
// `<mono-card>` (`@mono-lit/helper/ui/card`) — so both builds can be loaded in the
// same document (e.g. the docs render light + shadow demos side by side).
// Re-exports the identical types/utils as ./index.ts, plus the shadow class +
// core mixin.
export { MonoCardShadow } from './mono-card.shadow.js'

export { MonoCardCore } from './card-core.js'
export type { CardSlotName } from './card-core.js'

export type {
  CardSize,
  CardRounded,
  CardVariant,
  CardColor,
  CardCssClass,
  CardMediaPosition,
  CardProps,
  CardEvents,
} from './card-types.js'

export {
  validateCardProps,
  generateCardAttributes,
} from './card-utils.js'
