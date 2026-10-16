/// <reference path="../../../vue.d.ts" />
import { ChipBehaviour } from "../chip/chip-types.js";
import { TagInputChipProps, TagInputColor, TagInputCssClass, TagInputDataSource, TagInputDisplayGroup, TagInputDisplayValue, TagInputEvents, TagInputItem, TagInputLoadMore, TagInputModelEvent, TagInputModelEventDetail, TagInputProps, TagInputSize, TagInputValidationState, TagInputValue, TagInputVariant } from "./tag-input-types.js";
import { MonoTagInputCore, TagInputSlotName } from "./tag-input-core.js";
import { normalizeSuggestions, validateTagInputProps } from "./tag-input-utils.js";
import { MonoTagInputShadow } from "./mono-tag-input.shadow.js";
export { type ChipBehaviour, MonoTagInputCore, MonoTagInputShadow, type TagInputChipProps, type TagInputColor, type TagInputCssClass, type TagInputDataSource, type TagInputDisplayGroup, type TagInputDisplayValue, type TagInputEvents, type TagInputItem, type TagInputLoadMore, type TagInputModelEvent, type TagInputModelEventDetail, type TagInputProps, type TagInputSize, type TagInputSlotName, type TagInputValidationState, type TagInputValue, type TagInputVariant, normalizeSuggestions, validateTagInputProps };