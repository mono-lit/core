import { CardVariant, CardColor } from './card-types.js';
/**
 * Validate card props
 */
export declare function validateCardProps(props: {
    variant?: CardVariant;
    color?: CardColor;
}): boolean;
/**
 * Generate root CSS classes for card
 */
export declare function generateCardRootClasses(props: {
    variant?: CardVariant;
    color?: CardColor;
    bordered?: boolean;
    hoverable?: boolean;
    clickable?: boolean;
    disabled?: boolean;
}): string;
/**
 * Generate ARIA attributes for accessibility
 */
export declare function generateCardAttributes(clickable: boolean, hoverable: boolean, label: string | undefined): Record<string, string | boolean | undefined>;
