import { MonoImportNumberFormat, MonoImportValueType } from './types';
/**
 * Normalise a header for lookup: NBSP → space, drop dots/underscores (`No. Dok`
 * and `No_Dok` should both find `No Dok`), collapse whitespace, lowercase.
 */
export declare function normalizeHeader(value: unknown): string;
/** Default normalisation for key comparison — forgiving about spacing and case. */
export declare function normalizeKeyValue(value: unknown): string;
/** Read a display string out of whatever ExcelJS put in a cell. */
export declare function cellText(value: unknown): string;
/**
 * Parse a number written in an unknown locale.
 *
 * `'auto'` infers the separators: with both `.` and `,` present the **rightmost**
 * is the decimal point; with only one, its position decides — exactly three
 * trailing digits (or several occurrences) means thousands grouping, otherwise
 * it's a decimal point. So `1.234` is one thousand two hundred, while `1.23` is
 * one and a bit. Returns `null` when the text isn't a number at all.
 */
export declare function parseNumber(raw: unknown, mode?: MonoImportNumberFormat, allowNegative?: boolean): number | null;
/** Parse a date from a Date, an ISO-ish string, or a spreadsheet serial number. */
export declare function parseDate(raw: unknown): Date | null;
/** Parse a boolean from the many things a human types into a yes/no column. */
export declare function parseBoolean(raw: unknown): boolean | null;
/**
 * Coerce one cell for a declared column type. `undefined` means "unparseable —
 * skip this cell" so a stray `-` in a number column can't stage `NaN`.
 */
export declare function coerceValue(raw: unknown, type: MonoImportValueType | undefined, opts?: {
    numberFormat?: MonoImportNumberFormat;
    allowNegative?: boolean;
}): unknown;
/**
 * Whether a staged value would actually change the row. Numbers are compared
 * numerically so a stored `5000` isn't "changed" by a sheet's `"5.000"`, and
 * dates by timestamp so two equal instants don't churn.
 */
export declare function isSameValue(current: unknown, next: unknown, type?: MonoImportValueType): boolean;
