import { SwitchSize, SwitchColor } from './switch-types.js';
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
