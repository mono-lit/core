import { SelectColor, SelectSize, SelectValidationState, SelectVariant } from './select-types.js';
export declare function validateSelectProps(props: {
    size?: SelectSize;
    color?: SelectColor;
    variant?: SelectVariant;
    validationState?: SelectValidationState;
}): boolean;
