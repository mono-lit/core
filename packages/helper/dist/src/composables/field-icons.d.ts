import { TemplateResult } from "lit";
//#region src/composables/field-icons.d.ts
/** Downward caret — the "this opens a panel" affordance. */
export declare function caretIcon(): TemplateResult;
/** The ✕ a clear button and a chip's remove button draw, at the caret's weight. */
export declare function closeIcon(): TemplateResult;
/** Left (`-1`) or right (`1`) chevron, matching {@link caretIcon}'s weight. */
export declare function chevronIcon(dir: -1 | 1): TemplateResult;
/**
 * Busy arc for a field whose data source is still answering. Spun by the
 * component's own CSS (`[mono-ds-spinner] > svg`) so a reduced-motion rule can
 * stop it.
 */
export declare function spinnerIcon(): TemplateResult;
/** ↻ — the retry affordance a field shows after its data source failed. */
export declare function refreshIcon(): TemplateResult;
//#endregion