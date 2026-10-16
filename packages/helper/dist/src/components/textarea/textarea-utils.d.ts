import { TextareaColor, TextareaSize, TextareaValidationState, TextareaVariant } from "./textarea-types.js";
//#region src/components/textarea/textarea-utils.d.ts
export declare function validateTextareaProps(props: {
  size?: TextareaSize;
  color?: TextareaColor;
  variant?: TextareaVariant;
  validationState?: TextareaValidationState;
}): boolean;
//#endregion