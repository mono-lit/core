// @unocss-include

/**
 * Chip / Badge / Tag Component Exports
 */

// Components
export { MonoChip } from './mono-chip.js'
export { MonoStatusDot } from './mono-status-dot.js'

// Types
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

// Utilities
export {
  generateChipRootClasses,
  isInteractive,
  validateChipProps,
} from './chip-utils.js'
