import { Constructor } from "../../composables/hybird-prop.js";
import { CssSizeValue } from "../../composables/css-size.js";
import { FieldTooltipController, FieldTooltipValue } from "../../composables/field-tooltip.js";
import { OtpColor, OtpCssClass, OtpGroups, OtpLabelPosition, OtpSize, OtpType, OtpValidationPosition, OtpValidationState, OtpVariant } from "./otp-types.js";
import { FieldValidationController } from "../../composables/field-validation.js";
import { LitElement, TemplateResult, nothing } from "lit";
//#region src/components/otp/otp-core.d.ts
export type OtpSlotName = 'prefix' | 'suffix' | 'label' | 'helper';
/** Glyphs the builds draw: only the clear `×`. */
export type OtpIconName = 'close';
/** Public surface added by the core mixin (for typing the wrappers + tag map). */
export declare class MonoOtpCoreInterface {
  cssClass: OtpCssClass;
  cssClassName: string;
  type: OtpType;
  length: number | string;
  groups?: OtpGroups;
  separator: string;
  mask: boolean;
  size: OtpSize;
  color: OtpColor;
  variant: OtpVariant;
  labelPosition: OtpLabelPosition;
  validationPosition: OtpValidationPosition;
  modelValue: string;
  value: string;
  name: string;
  placeholder: string;
  label: string;
  helperText: string;
  tooltip: FieldTooltipValue;
  validationState: OtpValidationState;
  validationMessage: string;
  error: boolean;
  errorMessage: string;
  success: boolean;
  successMessage: string;
  autocomplete: string;
  inputmode: string;
  ariaLabelText?: string;
  disabled: boolean;
  readonly: boolean;
  required: boolean;
  clearable: boolean;
  autofocus: boolean;
  width?: CssSizeValue;
  height?: CssSizeValue;
  minWidth?: CssSizeValue;
  maxWidth?: CssSizeValue;
  minHeight?: CssSizeValue;
  maxHeight?: CssSizeValue;
  /** True once every box holds a character. */
  readonly complete: boolean;
  /** Focus a box — by default the first empty one (or the last when full). */
  focus(index?: number | FocusOptions): void;
  blur(): void;
  /** Empty every box (fires `input`, `change` and `clear`). */
  clear(): void;
  protected readonly _tooltip: FieldTooltipController;
  protected readonly _validation: FieldValidationController;
  protected _hasPrefixSlotState: boolean;
  protected _hasSuffixSlotState: boolean;
  protected _hasLabelSlotState: boolean;
  protected _hasHelperSlotState: boolean;
  protected readonly _otpId: string;
  protected readonly _messageId: string;
  protected readonly _resolvedValidationState: OtpValidationState;
  protected _cls(base: string, key: keyof OtpCssClass): string;
  protected _renderLabel(): TemplateResult | typeof nothing;
  protected _renderLabelText(): TemplateResult | string;
  protected _renderHelperText(base: string): TemplateResult | typeof nothing;
  protected _renderAffix(name: 'prefix' | 'suffix'): TemplateResult | typeof nothing;
  protected renderIcon(name: OtpIconName): TemplateResult;
}
/**
 * `MonoOtpCore` — all render-mode-agnostic logic for `mono-otp`: N single-character boxes that
 * behave as ONE field. The value is a contiguous prefix of the boxes (box i holds `value[i]`), so
 * focus can never land past the first empty box, Backspace / Delete shift the rest left, and a
 * paste or an SMS autofill overwrites from the focused box on (see `otp-utils.ts`).
 *
 * Same prop surface as mono-input (size / color / variant / label-position / validation-position
 * / tooltip / messages / states / sizing), wired to `controlMonoForm` through
 * `MonoFormControlCore`: `input` per edit (live rules), `change` when focus leaves the group
 * (change rules, marks touched), plus `complete` once every box is filled.
 *
 * Each build supplies `createRenderRoot()`, the slot strategy (the `_render*` hooks below) and
 * `renderIcon()` — light captures `slot="…"` children into `[data-mono-slot]` placeholders,
 * shadow uses native `<slot>`s.
 */
export declare const MonoOtpCore: <T extends Constructor<LitElement>>(superClass: T) => Constructor<MonoOtpCoreInterface> & T;
//#endregion