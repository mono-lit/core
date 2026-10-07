import { ButtonSize, ButtonColor, ButtonVariant, ButtonRounded, ButtonBadgeColor } from './button-types.js';
/**
 * Generate badge CSS classes
 */
export declare function generateBadgeClasses(badgeColor?: ButtonBadgeColor): string;
/**
 * Process SVG icon content
 */
export declare function processIconContent(icon: string): string;
/**
 * Validate button props
 */
export declare function validateButtonProps(props: {
    size?: ButtonSize;
    color?: ButtonColor;
    variant?: ButtonVariant;
    rounded?: ButtonRounded;
}): boolean;
