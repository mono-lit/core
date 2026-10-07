import { CheckboxSize, CheckboxColor } from './checkbox-types.js';
/**
 * Validate checkbox props
 */
export declare function validateCheckboxProps(props: {
    size?: CheckboxSize;
    color?: CheckboxColor;
}): boolean;
/**
 * Generate ARIA attributes for accessibility
 */
export declare function generateCheckboxAttributes(disabled: boolean, checked: boolean, indeterminate: boolean, label: string | undefined): Record<string, string | boolean | undefined>;
/**
 * Generate root CSS classes for checkbox
 */
export declare function generateCheckboxRootClasses(props: {
    size?: CheckboxSize;
    color?: CheckboxColor;
    checked?: boolean;
    indeterminate?: boolean;
    disabled?: boolean;
}): string;
/**
 * Generate CSS classes for checkbox box element
 */
export declare function generateCheckboxBoxClasses(props: {
    size?: CheckboxSize;
}): string;
/**
 * Generate CSS classes for checkbox icon element
 */
export declare function generateCheckboxIconClasses(props: {
    size?: CheckboxSize;
    type?: 'check' | 'indeterminate';
}): string;
