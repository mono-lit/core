/**
 * Worksheet names, which Excel is fussier about than anything else in a
 * workbook — and every rule below is one it enforces by refusing to open the
 * file, not by degrading.
 *
 *   · at most 31 characters
 *   · none of `* ? : \ / [ ]`
 *   · cannot be empty
 *   · cannot start or end with an apostrophe
 *   · unique within the workbook, case-insensitively
 *
 * A name derived from user data — a document number like `TU/2026/001` — breaks
 * three of those at once, so nothing may reach `addWorksheet` unsanitised.
 */
/**
 * One name, made legal. Does NOT make it unique — that is
 * {@link SheetNames.take}'s job, because uniqueness needs the whole workbook.
 */
export declare function sanitizeSheetName(raw: unknown, fallback?: string): string;
/**
 * Escape a name for use inside a reference like `#'Sheet'!A1`.
 *
 * The name is single-quoted there, so a literal apostrophe has to be doubled.
 * {@link sanitizeSheetName} only strips apostrophes at the ends — one in the
 * middle (`Bob's Data`) is legal and has to survive.
 */
export declare function escapeSheetRef(name: string): string;
/** A reference to `A1` of `name`, ready to use as a hyperlink target. */
export declare function sheetRef(name: string, cell?: string): string;
/**
 * The workbook's name registry.
 *
 * Deliberately the ONLY place a name is claimed. The implementation this feature
 * is modelled on reserves a name up front and then dedupes a second time inside
 * its writer against the same set — so the second call always collides with the
 * reservation it just made, and every sheet in that workbook ends up suffixed
 * ` (2)`. One registry, one `take()`, no second opinion.
 */
export declare class SheetNames {
    /** Lower-cased claimed names: Excel's uniqueness is case-insensitive. */
    private readonly used;
    constructor(existing?: Iterable<string>);
    /** Claim a legal, unique name derived from `raw`. */
    take(raw: unknown, fallback?: string): string;
}
