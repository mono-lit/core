import { SelectColor, SelectSize, SelectValidationState, SelectVariant } from "./select-types.js";
//#region src/components/select/select-utils.d.ts
export declare function validateSelectProps(props: {
  size?: SelectSize;
  color?: SelectColor;
  variant?: SelectVariant;
  validationState?: SelectValidationState;
}): boolean;
//#endregion