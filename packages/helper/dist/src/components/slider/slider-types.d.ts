import { VisibilityProps } from "../../composables/visibility.js";
import { MonoTooltipOptions } from "../tooltip/tooltip-types.js";
import { InputFormat, InputFormatCtx } from "../input/input-format.js";
//#region src/components/slider/slider-types.d.ts
export type SliderSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'xxl';
export type SliderColor = 'primary' | 'secondary' | 'success' | 'danger' | 'warning' | 'info' | 'teal' | 'purple' | 'neutral' | 'dark';
/** Which way the track runs. Vertical puts `min` at the bottom. */
export type SliderType = 'horizontal' | 'vertical';
/**
 * What the coloured part of the track covers.
 * - `auto`: from `min` to the thumb with one thumb; between the first and last thumb with several.
 * - `start`: from `min` to the FIRST thumb.
 * - `end`: from the LAST thumb to `max`.
 * - `none`: no fill.
 */
export type SliderFill = 'auto' | 'start' | 'end' | 'none';
/** When each thumb shows its value bubble. */
export type SliderValueTooltip = 'auto' | 'always' | 'never';
export type SliderValidationState = 'default' | 'valid' | 'invalid' | 'warning';
/** A slider value: one thumb is a number, several thumbs are an array (its length = the thumb count). */
export type SliderValue = number | number[];
/** One tick on the track. A bare number is a tick without a label. */
export type SliderMark = number | {
  value: number;
  label?: string;
};
export type SliderModelEventDetail = {
  /** The value in the shape it came in: a number for a single-number model, an array otherwise. */
  modelValue: SliderValue;
  currentValue: SliderValue;
  oldValue: SliderValue;
  value: SliderValue;
  /** Always an array, whatever the model's shape. */
  values: number[];
  /** The thumb that moved (-1 when the whole value was replaced, e.g. a segment drag moves two). */
  index: number;
  name?: string;
  sourceEvent?: Event;
};
export type SliderModelEvent = CustomEvent<SliderModelEventDetail>;
export interface SliderCssClass {
  root?: string;
  label?: string;
  required?: string;
  value?: string;
  control?: string;
  track?: string;
  fill?: string;
  thumb?: string;
  tooltip?: string;
  marks?: string;
  mark?: string;
  markLabel?: string;
  messageWrap?: string;
  message?: string;
}
export interface SliderProps extends VisibilityProps {
  /**
   * The value: a number for one thumb, an array for several (`[20, 80]` is a range, `[2, 2, 3]`
   * is three thumbs). The shape you pass is the shape you get back. A JSON string is accepted.
   */
  modelValue?: SliderValue | string;
  'model-value'?: SliderValue | string;
  modelvalue?: SliderValue | string;
  /** The same as `modelValue`. */
  value?: SliderValue | string;
  /** Lowest value. Default 0. */
  min?: number | string;
  /** Highest value. Default 100. */
  max?: number | string;
  /** Snap interval. Default 1; `0` slides continuously. Ignored when `stops` is set. */
  step?: number | string;
  /**
   * Discrete snap points: the thumb can only land on these values (`[0, 10, 25, 50, 100]`).
   * Replaces `step`. A JSON string is accepted.
   */
  stops?: number[] | string;
  /** Smallest distance kept between neighbouring thumbs. Default 0 (thumbs may stack). */
  minGap?: number | string;
  'min-gap'?: number | string;
  mingap?: number | string;
  /** `vertical` runs the track bottom (min) to top (max). Give it a `height`. */
  type?: SliderType;
  /**
   * Tick marks: `true` for one at every step (or every stop), or a list of values / `{ value, label }`.
   * Labels render under the track (beside it when vertical), drawn through `format-display` when
   * a mark has no label of its own. A JSON string is accepted.
   */
  marks?: boolean | SliderMark[] | string;
  /** What the coloured part of the track covers. Default `auto`. */
  fill?: SliderFill;
  /** Empty space cut out of the track around each thumb, in px (Material 3 style). Default 0. */
  trackGap?: number | string;
  'track-gap'?: number | string;
  trackgap?: number | string;
  /** When each thumb shows its value bubble. Default `auto` (hover, focus or drag). */
  valueTooltip?: SliderValueTooltip;
  'value-tooltip'?: SliderValueTooltip;
  valuetooltip?: SliderValueTooltip;
  /** Show the value at the end of the label row. Default `true`; `show-value="false"` hides it. */
  showValue?: boolean;
  'show-value'?: boolean;
  showvalue?: boolean;
  /** Joins the values in the label-row readout. Default `" – "`. */
  valueSeparator?: string;
  'value-separator'?: string;
  valueseparator?: string;
  /**
   * How a value is DISPLAYED (readout, bubbles, mark labels, `aria-valuetext`): a pattern
   * (`"{}%"`, `'"Rp "#,##0'`) or a function `({ value }) => string`. The model stays a number.
   */
  formatDisplay?: InputFormat;
  'format-display'?: InputFormat;
  formatdisplay?: InputFormat;
  /** Locale a numeric `format-display` pattern is drawn with. */
  formatLocale?: string;
  'format-locale'?: string;
  formatlocale?: string;
  /** Visual size: scales the track, thumb and type. */
  size?: SliderSize;
  /** Accent colour of the fill and thumb. */
  color?: SliderColor;
  /** Label text above the slider. */
  label?: string;
  /** Helper text under the slider. */
  helperText?: string;
  'helper-text'?: string;
  helpertext?: string;
  /**
   * Info icon at the end of the label; hovering, focusing or tapping it shows this text.
   * Plain text → a small built-in bubble (no dependency). Full tooltip options
   * (`:tooltip.prop="{ content, placement, color }"`) → a `mono-tooltip`, which needs the
   * optional `@floating-ui/dom` + `@floating-ui/core` peers (without them that form renders
   * no icon). Shown only beside a label.
   * This is NOT the thumb's value bubble — that is `value-tooltip`.
   */
  tooltip?: string | MonoTooltipOptions;
  validationState?: SliderValidationState;
  'validation-state'?: SliderValidationState;
  validationstate?: SliderValidationState;
  validationMessage?: string;
  'validation-message'?: string;
  validationmessage?: string;
  error?: boolean;
  errorMessage?: string;
  'error-message'?: string;
  errormessage?: string;
  success?: boolean;
  successMessage?: string;
  'success-message'?: string;
  successmessage?: string;
  /** Disables interaction and dims the slider. */
  disabled?: boolean;
  /** Focusable, but the value cannot be changed. */
  readonly?: boolean;
  /** Marks the field required (asterisk + `aria-required`). */
  required?: boolean;
  /**
   * Form field name. The element writes one hidden `<input>` per thumb, so a native `<form>`
   * submits it (`name` for one thumb, `name[]` repeated for several).
   */
  name?: string;
  /** Accessible label (each thumb adds "minimum" / "maximum" / its position). */
  ariaLabelText?: string;
  ariaLabel?: string;
  'aria-label'?: string;
  arialabel?: string;
  /** Track length when vertical (CSS length or px number). Default 200px. */
  height?: string | number;
  /** Width of the whole field (CSS length or px number). */
  width?: string | number;
  /** Per-part class overrides for internal elements. */
  cssClass?: SliderCssClass;
  /** Simple root class. */
  'css-class'?: string;
}
export interface SliderEvents {
  /** While dragging / on every key press. */
  input: SliderModelEvent;
  /** On release / when keyboard interaction ends. */
  change: SliderModelEvent;
  'mno-input': SliderModelEvent;
  mnoInput: SliderModelEvent;
  'mno-change': SliderModelEvent;
  mnoChange: SliderModelEvent;
}
//#endregion
export type { InputFormat as SliderFormat, InputFormatCtx as SliderFormatCtx };