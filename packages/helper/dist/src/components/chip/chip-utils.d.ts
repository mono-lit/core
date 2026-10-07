import { ChipColor, ChipRounded, ChipSize, ChipVariant } from './chip-types.js';
export declare function generateChipRootClasses(props: {
    size?: ChipSize;
    color?: ChipColor;
    variant?: ChipVariant;
    rounded?: ChipRounded;
    clickable?: boolean;
    removable?: boolean;
    disabled?: boolean;
    selected?: boolean;
    dot?: boolean;
}): string;
export declare function isInteractive(props: {
    clickable?: boolean;
    href?: string;
    removable?: boolean;
    disabled?: boolean;
}): boolean;
export declare function validateChipProps(props: {
    size?: ChipSize;
    color?: ChipColor;
    variant?: ChipVariant;
    rounded?: ChipRounded;
}): boolean;
