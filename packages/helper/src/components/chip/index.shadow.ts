// Shadow-DOM / SSR build entry for chip — `@mono-lit/helper/ui/shadow/chip`.
//
// Registers the SAME `mono-chip` AND `mono-status-dot` tags as the light build
// (`@mono-lit/helper/ui/chip`), so a document must import only one of the two.
// `mono-status-dot` is already a shadow-DOM element shared verbatim. Drop-in
// replacement: re-exports the identical types/utils as ./index.ts, plus the
// shadow class + core mixin.
export { MonoChipShadow } from './mono-chip.shadow.js'
export { MonoStatusDot } from './mono-status-dot.js'

export { MonoChipCore } from './chip-core.js'

export type {
  ChipSize,
  ChipColor,
  ChipVariant,
  ChipRounded,
  ChipIconPosition,
  ChipCssClass,
  ChipModelEventDetail,
  ChipModelEvent,
  ChipEvents,
  MonoChipProps,
  MonoStatusDotProps,
  StatusDotState,
} from './chip-types.js'

export {
  generateChipRootClasses,
  isInteractive,
  validateChipProps,
} from './chip-utils.js'
