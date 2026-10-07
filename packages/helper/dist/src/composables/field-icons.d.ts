import { TemplateResult } from 'lit';
/** Downward caret — the "this opens a panel" affordance. */
export declare function caretIcon(): TemplateResult;
/** The ✕ a clear button and a chip's remove button draw, at the caret's weight. */
export declare function closeIcon(): TemplateResult;
/** Left (`-1`) or right (`1`) chevron, matching {@link caretIcon}'s weight. */
export declare function chevronIcon(dir: -1 | 1): TemplateResult;
