import { SwitchColor, SwitchSize } from "./switch-types.js";
//#region src/components/switch/switch-utils.d.ts
/**
 * Validate switch props
 */
export declare function validateSwitchProps(props: {
  size?: SwitchSize;
  color?: SwitchColor;
}): boolean;
/**
 * Generate ARIA attributes for accessibility
 */
export declare function generateSwitchAttributes(disabled: boolean, loading: boolean, checked: boolean, label: string | undefined): Record<string, string | boolean | undefined>;
//#endregion