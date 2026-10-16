import { RadioColor, RadioSize } from "./radio-types.js";
//#region src/components/radio/radio-utils.d.ts
/**
 * Validate radio props
 */
export declare function validateRadioProps(props: {
  size?: RadioSize;
  color?: RadioColor;
}): boolean;
/**
 * Generate ARIA attributes for accessibility
 */
export declare function generateRadioAttributes(disabled: boolean, checked: boolean, label: string | undefined): Record<string, string | boolean | undefined>;
//#endregion