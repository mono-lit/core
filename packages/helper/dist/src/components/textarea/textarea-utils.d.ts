import { TextareaColor, TextareaSize, TextareaValidationState, TextareaVariant } from './textarea-types.js';
export declare function validateTextareaProps(props: {
    size?: TextareaSize;
    color?: TextareaColor;
    variant?: TextareaVariant;
    validationState?: TextareaValidationState;
}): boolean;
