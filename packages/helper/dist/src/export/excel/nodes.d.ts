import { Root } from 'mdast';
import { ExcelCellStyle } from '../styles';
import { MonoExportColumn, MonoExportStyles } from '../types';
/** A pending image to place once the sheet is written. */
interface PendingImage {
    src: string;
    row: number;
    col: number;
    width: number;
    height: number;
}
/** A block that should span the sheet's full width (headings, paragraphs). */
interface PendingSpan {
    row: number;
    from: number;
}
export interface WriterContext {
    styles: MonoExportStyles;
    columns?: MonoExportColumn[];
}
/** Everything the walk produces, handed back to the ExcelJS driver. */
export interface WorksheetPlan {
    rows: PlannedRow[];
    images: PendingImage[];
    /** Rows to merge across the sheet width (heading / paragraph blocks). */
    spans: PendingSpan[];
    /** Explicit merges requested with `{{merge}}`: `[row, col, rowEnd, colEnd]`. */
    merges: Array<[number, number, number, number]>;
    /** Widest row, i.e. how many columns the sheet has. */
    width: number;
    /** Longest rendered text per column, for auto-fit. */
    widths: number[];
}
export interface PlannedCell {
    /** The value written into the cell (already typed). */
    value: string | number | Date | null;
    /** An Excel formula, replacing `value` when present. */
    formula?: string;
    style: ExcelCellStyle;
    /** Number format from a value directive, layered over the style's. */
    numFmt?: string;
    /**
     * A hyperlink target, straight from the Markdown link the template wrote.
     *
     * `sheet:<key>` is resolved to an in-workbook reference once every sheet
     * exists and its final (sanitised, deduped) name is known — a template cannot
     * know that name, so it references the key instead. Anything else is passed
     * through as an external URL.
     */
    hyperlink?: string;
    /**
     * How wide the cell *displays*, in characters — used for auto-fit. Kept
     * separate from `value` because a Date's `toString()` is ~55 characters while
     * the cell shows 10, which would blow the column out.
     */
    width: number;
}
export interface PlannedRow {
    cells: PlannedCell[];
    height?: number;
}
/**
 * Walks an mdast tree and plans a worksheet. Planning (rather than writing
 * ExcelJS objects directly) keeps this file free of any ExcelJS import, so the
 * mapping stays testable and a future renderer can reuse the same walk.
 */
export declare class WorksheetWriter {
    private readonly ctx;
    private readonly plan;
    /** Header captions of the table currently being written, for `{col:Field}`. */
    private tableColumns;
    /** 1-based row index of the current table's first body row. */
    private tableFirstRow;
    /** 1-based row index of the current table's last body row. */
    private tableLastRow;
    constructor(ctx: WriterContext);
    /** Resolve a named style, or an empty style when the name is unknown. */
    private named;
    write(root: Root): WorksheetPlan;
    private writeBlocks;
    private writeBlock;
    private writeBlockquote;
    /** A one-cell row that will later be merged across the sheet's full width. */
    private appendSpanningRow;
    private writeTable;
    /** Per-column `numFmt` override from `options.columns`. */
    private columnStyle;
    /** Collect `{{style}}` directives into one style object. */
    private styleFrom;
    /** Collect `{{rowStyle}}` directives into one style object. */
    private rowStyleFrom;
    /** Build one planned cell from flattened inline content plus its style. */
    private toCell;
    /**
     * Substitute the placeholders a template couldn't resolve on its own:
     * `{row}` (the row about to be written), `{prevRow}` (the one above it),
     * `{firstRow}` / `{lastRow}` (the current table's body range) and
     * `{col:Caption}` (that header's column letter).
     *
     * `{lastRow}` includes *every* body row — so a total row that lives inside
     * the same Markdown table must sum `{firstRow}:{prevRow}` to avoid a circular
     * reference to itself.
     */
    private resolveFormula;
    private placeImages;
    private applyMerge;
    /**
     * Append a row and return its 1-based index. `spanning` rows (headings,
     * paragraphs) are excluded from auto-fit: they get merged across the whole
     * sheet, so letting a long title set column A's width would leave a 60-wide
     * first column next to four narrow ones.
     */
    private pushRow;
}
/**
 * Give a plain cell string its most useful type. Text that merely *looks*
 * numeric (`"00123"`, `"1,234"`) is left alone — coercing it would silently
 * mangle invoice numbers and phone numbers.
 */
export declare function coerceValue(text: string): string | number | Date | null;
/** 1-based column index → spreadsheet letter (1 → A, 27 → AA). */
export declare function columnLetter(index: number): string;
export {};
