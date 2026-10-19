// Shadow-DOM build of mono-slider (`@mono-lit/helper/ui/shadow/slider`): registers `mono-shadow-slider`.
export { MonoSliderShadow } from './mono-slider.shadow.js'
export { MonoSliderCore } from './slider-core.js'

export type {
  SliderSize,
  SliderColor,
  SliderType,
  SliderFill,
  SliderValueTooltip,
  SliderValidationState,
  SliderValue,
  SliderMark,
  SliderCssClass,
  SliderModelEventDetail,
  SliderModelEvent,
  SliderProps,
  SliderEvents,
} from './slider-types.js'

export {
  coerceNumbers,
  resolveScale,
  snap,
  normalise,
  moveThumb,
  moveRun,
  nearestThumb,
  thumbBounds,
  toPercent,
  fromRatio,
  trackPieces,
  markPoints,
  stepFrom,
} from './slider-math.js'

export type { SliderScale, SliderPiece, SliderMarkPoint } from './slider-math.js'
