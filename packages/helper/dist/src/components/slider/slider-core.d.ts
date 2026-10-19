import { Constructor } from "../../composables/hybird-prop.js";
import { CssSizeValue } from "../../composables/css-size.js";
import { FieldTooltipController, FieldTooltipValue } from "../../composables/field-tooltip.js";
import { InputFormat } from "../input/input-format.js";
import { SliderColor, SliderCssClass, SliderFill, SliderSize, SliderType, SliderValidationState, SliderValue, SliderValueTooltip } from "./slider-types.js";
import { LitElement, TemplateResult, nothing } from "lit";
//#region src/components/slider/slider-core.d.ts
export type SliderSlotName = 'label' | 'helper';
/** A model that holds the same numbers in the same shape is not a change (Vue re-sends arrays). */
export declare function sliderValueHasChanged(value: unknown, old: unknown): boolean;
/** Public surface added by the core mixin (for typing the wrappers + tag map). */
export declare class MonoSliderCoreInterface {
  modelValue: SliderValue | string;
  value: SliderValue | string;
  min: number | string;
  max: number | string;
  step: number | string;
  stops?: number[] | string;
  minGap: number | string;
  type: SliderType;
  marks: boolean | unknown[] | string;
  fill: SliderFill;
  trackGap: number | string;
  valueTooltip: SliderValueTooltip;
  showValue: boolean;
  valueSeparator: string;
  formatDisplay?: InputFormat;
  formatLocale?: string;
  size: SliderSize;
  color: SliderColor;
  label: string;
  helperText: string;
  tooltip: FieldTooltipValue;
  validationState: SliderValidationState;
  validationMessage: string;
  error: boolean;
  errorMessage: string;
  success: boolean;
  successMessage: string;
  disabled: boolean;
  readonly: boolean;
  required: boolean;
  name: string;
  ariaLabelText?: string;
  width?: CssSizeValue;
  height?: CssSizeValue;
  cssClass: SliderCssClass;
  cssClassName: string;
  /** The thumb positions, always as a sorted array. */
  readonly values: number[];
  focus(options?: FocusOptions): void;
  blur(): void;
  protected _hasLabelSlotState: boolean;
  protected _hasHelperSlotState: boolean;
  protected readonly _sliderId: string;
  protected readonly _messageId: string;
  protected readonly _tooltip: FieldTooltipController;
  protected readonly _resolvedValidationState: SliderValidationState;
  protected readonly _hasLabel: boolean;
  protected _cls(base: string, key: keyof SliderCssClass): string;
  protected _renderLabel(): TemplateResult | typeof nothing;
  protected _renderLabelText(): TemplateResult | string;
  protected _renderMessage(): TemplateResult | typeof nothing;
  protected _renderReadout(): TemplateResult;
}
/**
 * `MonoSliderCore` — everything `mono-slider` does that does not depend on light vs shadow DOM:
 * props + hybrid aliases, the value maths (slider-math.ts), pointer + keyboard interaction,
 * events, form binding, and the shared `render()`. The label / message regions are hooks the
 * shadow build overrides with native `<slot>`s (the light build captures `slot="label|helper"`
 * children and drops them into `[data-mono-slot]` placeholders, like mono-input).
 *
 * Thumbs are `role="slider"` elements, not native range inputs: N thumbs on one track, blocking,
 * stops, gaps and segment drags are all beyond `<input type="range">`.
 */
export declare const MonoSliderCore: <T extends Constructor<LitElement>>(superClass: T) => Constructor<MonoSliderCoreInterface> & T;
//#endregion