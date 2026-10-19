import { OtpGroups, OtpType } from "./otp-types.js";
//#region src/components/otp/otp-utils.d.ts
/**
 * Pure helpers behind `mono-otp`. The value is always a CONTIGUOUS prefix of the boxes — box i
 * holds `value[i]` — so every edit is a string operation and the boxes are just its characters.
 */
export declare const OTP_DEFAULT_LENGTH = 6;
/** One character cleaned for `type`; `''` when it is not accepted. */
export declare function sanitizeOtpChar(ch: string, type?: OtpType): string;
/** A whole string cleaned for `type` — rejected characters are dropped, not kept as holes. */
export declare function sanitizeOtpText(text: unknown, type?: OtpType): string;
/** `length` from a prop or attribute: a whole number ≥ 1, else the default. */
export declare function resolveOtpLength(length: unknown): number;
/** The model for `length` boxes: cleaned and cut to fit. */
export declare function normaliseOtpValue(value: unknown, length: number, type?: OtpType): string;
/**
 * Group sizes → the box indexes a separator goes BEFORE. `3` repeats (6 boxes → 3-3, 8 → 3-3-2);
 * a list is taken as given and any boxes past it form one last group.
 */
export declare function parseOtpGroups(groups: OtpGroups | null | undefined, length: number): number[];
export interface OtpEdit {
  value: string;
  /** The box to focus next. */
  caret: number;
}
/**
 * Put `text` at box `index`. One character replaces that box; several (a paste, an SMS
 * autofill) overwrite from `index` onwards. Rejected characters are dropped first, so pasting
 * `"123-456"` into a numeric field fills six boxes.
 */
export declare function spliceOtpValue(value: string, index: number, text: string, length: number, type?: OtpType): OtpEdit;
/** Remove the character in box `index`; the boxes after it move left. */
export declare function removeOtpChar(value: string, index: number, length: number): OtpEdit;
/**
 * Backspace in box `index`: clear it when it holds a character, otherwise step back and clear
 * the one before.
 */
export declare function backspaceOtp(value: string, index: number, length: number): OtpEdit;
/** The furthest box that can take focus: the first empty one, or the last box when full. */
export declare function clampCaret(index: number, filled: number, length: number): number;
//#endregion