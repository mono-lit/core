import { TagInputColor, TagInputItem, TagInputSize, TagInputValidationState, TagInputVariant } from "./tag-input-types.js";
//#region src/components/tag-input/tag-input-utils.d.ts
export declare function validateTagInputProps(props: {
  size?: TagInputSize;
  color?: TagInputColor;
  variant?: TagInputVariant;
  validationState?: TagInputValidationState;
}): boolean;
export declare function normalizeSuggestions(items: TagInputItem[]): TagInputItem[];
//#endregion