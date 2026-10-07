import { InputType, InputSize, InputColor, InputVariant } from './input-types.js';
export declare function validateInputProps(props: {
    type?: InputType;
    size?: InputSize;
    color?: InputColor;
    variant?: InputVariant;
}): boolean;
export declare function generateInputAttributes(type: InputType, disabled: boolean, readonly: boolean, required: boolean, pattern?: string, min?: number | string, max?: number | string, step?: number | string, placeholder?: string): Record<string, string | number | boolean | undefined>;
export declare function generateInputAriaAttributes(disabled: boolean, readonly: boolean, required: boolean, hasError: boolean, label?: string, errorMessage?: string): Record<string, string | undefined>;
export declare function getInputIcon(type: InputType): string;
