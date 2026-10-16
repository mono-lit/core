import { ButtonBadgeColor, ButtonColor, ButtonRounded, ButtonSize, ButtonVariant } from "./button-types.js";
//#region src/components/button/button-utils.d.ts
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
//#endregion