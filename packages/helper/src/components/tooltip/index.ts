// `@mono-lit/helper/tooltip` — the tooltip addon. Pure functions only: nothing here
// registers a custom element, and `@floating-ui/dom` (optional peer) is imported
// lazily on the first show. Styles ship in the global `@mono-lit/helper/ui/index.css`.
export { controlMonoTooltip, monoTooltip } from './control-tooltip'
export {
  createMonoTooltip,
  resetMonoTooltip,
  destroyAllMonoTooltips,
  readTooltipAttributes,
  TOOLTIP_ATTRIBUTE_SELECTOR,
} from './tooltip-declarative'
export { getMonoTooltipGlobal, resolveTooltipOptions, DEFAULT_TOOLTIP_OPTIONS } from './tooltip-config'
export { loadFloatingUi } from './tooltip-loader'
export type {
  MonoTooltipOptions,
  MonoTooltipGlobalOptions,
  MonoTooltipGlobal,
  MonoTooltipController,
  MonoTooltipTarget,
  MonoTooltipTargetValue,
  MonoTooltipContent,
  MonoTooltipPlacement,
  MonoTooltipTrigger,
  MonoTooltipVariant,
  MonoTooltipColor,
  MonoTooltipSize,
} from './tooltip-types'
