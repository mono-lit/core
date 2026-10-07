// Shadow-DOM / SSR build entry for alert — `@mono-lit/helper/ui/shadow/alert`.
//
// Registers `<mono-shadow-alert>` — a DISTINCT tag from the light build's
// `<mono-alert>` — so both builds can load in the same document.
export { MonoAlertShadow } from './mono-alert.shadow.js'

export { MonoAlertCore } from './alert-core.js'
export type { AlertSlotName } from './alert-core.js'

export type {
  AlertSize,
  AlertVariant,
  AlertColor,
  AlertCssClass,
  AlertProps,
} from './alert-types.js'
