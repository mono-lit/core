// Shadow-DOM / SSR build entry for accordion — `@mono-lit/helper/ui/shadow/accordion`.
//
// Registers the SAME `mono-accordion` tag as the light build
// (`@mono-lit/helper/ui/accordion`), so a document must import only one of the two.
// Drop-in replacement: re-exports the identical types as ./index.ts, plus the
// shadow class + core mixin.
export { MonoAccordionShadow } from './mono-accordion.shadow.js'

export { MonoAccordionCore } from './accordion-core.js'
export type { AccordionSlotName } from './accordion-core.js'

export type {
  AccordionSize,
  AccordionColor,
  AccordionCssClass,
  AccordionClickEventDetail,
  AccordionClickEvent,
  AccordionProps,
  AccordionEvents,
} from './accordion-types.js'
