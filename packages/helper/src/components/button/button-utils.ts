// @unocss-include

/**
 * Button Component Utility Functions
 * Helper functions for button-related operations
 */

import type { ButtonSize, ButtonColor, ButtonVariant, ButtonRounded, ButtonIconPosition, ButtonBadgeColor } from './button-types.js';

/**
 * Generate badge CSS classes
 */
export function generateBadgeClasses(badgeColor: ButtonBadgeColor = 'red'): string {
  return `btn-badge bb-${badgeColor}`;
}

/**
 * Process SVG icon content
 */
export function processIconContent(icon: string): string {
  // If it's already an SVG, return as-is
  if (icon.startsWith('<svg')) {
    return icon;
  }

  // If it's a simple emoji or text, return as-is
  return icon;
}

/**
 * Validate button props
 */
export function validateButtonProps(props: {
  size?: ButtonSize;
  color?: ButtonColor;
  variant?: ButtonVariant;
  rounded?: ButtonRounded;
}): boolean {
  const validSizes: ButtonSize[] = ['xs', 'sm', 'md', 'lg', 'xl', 'xxl'];
  const validColors: ButtonColor[] = ['primary', 'secondary', 'success', 'danger', 'warning', 'info', 'teal', 'purple', 'dark', 'light'];
  const validVariants: ButtonVariant[] = ['solid', 'outline', 'tonal', 'text'];
  const validRounded: ButtonRounded[] = ['none', 'xs', 'sm', 'md', 'lg', 'xl', 'xxl', 'full'];

  if (props.size && !validSizes.includes(props.size)) return false;
  if (props.color && !validColors.includes(props.color)) return false;
  if (props.variant && !validVariants.includes(props.variant)) return false;
  if (props.rounded && !validRounded.includes(props.rounded)) return false;

  return true;
}
