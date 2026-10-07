/**
 * Sentinel directives — how presentation survives the trip through Markdown.
 *
 * Markdown has nowhere to hang "make this cell bold", "merge it across 4
 * columns", or "this text reads `Rp 1.000.000` but Excel must store the number
 * `1000000`". So the report helpers don't emit styling: they emit an invisible
 * token next to their display text.
 *
 * The token is wrapped in two Unicode **private-use area** codepoints, which
 * means:
 * - remark parses it as ordinary text, so GFM table structure is untouched;
 * - it can never collide with real content (no keyboard produces U+E000);
 * - the Markdown renderer strips it, leaving the human-readable text;
 * - the Excel renderer extracts it and applies the real formatting.
 *
 * The payload is JSON, **base64-encoded**. That is not paranoia: raw JSON does
 * not survive the trip. Markdown unescapes backslash-escaped ASCII punctuation,
 * so a number format like `"$"#,##0.00` — which JSON writes as `\"$\"#,##0.00`
 * — comes back out of remark with the backslashes stripped, and `JSON.parse`
 * then fails. Base64's alphabet (`A-Z a-z 0-9 + / =`) holds nothing Markdown
 * rewrites, so the payload arrives byte-identical.
 */
/** Apply a named style to the cell (or block) the token sits in. */
export interface StyleDirective {
    k: 'style';
    /** Named style, resolved against the merged style map. */
    v: string;
}
/** Apply a named style to the entire row the token sits in. */
export interface RowStyleDirective {
    k: 'rowStyle';
    v: string;
}
/** Merge the token's cell across `cols` columns / `rows` rows. */
export interface MergeDirective {
    k: 'merge';
    cols?: number;
    rows?: number;
}
/**
 * Write an Excel formula into the token's cell. Placeholders are resolved at
 * write time (the template can't know its own row number) — see
 * `resolveFormula` in `excel/nodes.ts`.
 */
export interface FormulaDirective {
    k: 'formula';
    v: string;
}
/** Anchor an image at the token's cell. `v` is a data URL / base64 / http URL. */
export interface ImageDirective {
    k: 'image';
    v: string;
    width?: number;
    height?: number;
}
/**
 * Carry the *raw* value behind formatted display text, so Excel gets a real
 * number/date (summable, sortable, pivotable) while Markdown keeps the pretty
 * string. `f` is an Excel number format.
 */
export interface ValueDirective {
    k: 'val';
    /** Raw numeric value. */
    n?: number;
    /** Raw date as an ISO string (JSON has no Date). */
    d?: string;
    /** Excel number format, e.g. `#,##0.00` or `yyyy-mm-dd`. */
    f?: string;
    /**
     * The display text this value was emitted with. The renderer swaps in the raw
     * value only when it matches the cell's *entire* text — otherwise a sentence
     * like "Rate {{percent 0.155}} this quarter" would collapse to the bare
     * number `0.155`, losing the prose around it.
     */
    t?: string;
}
export type MonoExportDirective = StyleDirective | RowStyleDirective | MergeDirective | FormulaDirective | ImageDirective | ValueDirective;
/** Wrap a directive in its sentinel token, ready to be emitted by a helper. */
export declare function encodeDirective(directive: MonoExportDirective): string;
/** Whether a string contains at least one directive token. */
export declare function hasDirectives(text: string): boolean;
/**
 * Split `text` into its visible text and the directives embedded in it.
 * Malformed payloads are dropped rather than thrown — a broken token should
 * never take down a whole report.
 */
export declare function extractDirectives(text: string): {
    text: string;
    directives: MonoExportDirective[];
};
/** Remove every directive token, leaving only the display text (Markdown output). */
export declare function stripDirectives(text: string): string;
/**
 * Escape a value for safe interpolation into a GFM **table cell**. Directive
 * tokens are skipped — they are base64 and must arrive byte-identical.
 */
export declare function escapeCellText(text: string): string;
