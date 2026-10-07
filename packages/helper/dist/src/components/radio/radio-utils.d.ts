import { RadioSize, RadioColor } from './radio-types.js';
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
