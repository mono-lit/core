import { TagInputColor, TagInputSize, TagInputValidationState, TagInputVariant, TagInputItem } from './tag-input-types.js';
export declare function validateTagInputProps(props: {
    size?: TagInputSize;
    color?: TagInputColor;
    variant?: TagInputVariant;
    validationState?: TagInputValidationState;
}): boolean;
export declare function normalizeSuggestions(items: TagInputItem[]): TagInputItem[];
