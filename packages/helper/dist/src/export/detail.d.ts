import { MonoExportDetail } from './types';
/** One document's resolved rows, plus the key that names its sheet. */
export interface ResolvedDetail {
    /** The master row it came from. */
    row: Record<string, unknown>;
    /** The value of `detail.key` on that row, as a string. */
    key: string;
    rows: unknown[];
}
/** A document that will get no sheet, and why. */
export interface SkippedDetail {
    key: string;
    reason: 'empty' | 'failed';
    /** Present when `reason` is `failed`. */
    error?: unknown;
}
export interface ResolveDetailResult {
    details: ResolvedDetail[];
    skipped: SkippedDetail[];
}
/**
 * Turn master rows into per-document detail rows.
 *
 * A document with no rows is reported in `skipped` rather than given an empty
 * sheet — an empty worksheet behind a link is worse than no link, and the
 * caller gets told which documents those were instead of having to diff the
 * tab list.
 */
export declare function resolveDetails(masterRows: unknown[], detail: MonoExportDetail): Promise<ResolveDetailResult>;
