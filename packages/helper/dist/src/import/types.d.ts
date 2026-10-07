/**
 * Public types for `table.import()` — reading an edited spreadsheet back into
 * the grid as *staged* changes.
 */
/** Where the sheet data comes from. Inferred from `data` when omitted. */
export type MonoImportType = 'excel' | 'copy-paste';
/** How a column's raw text is interpreted. */
export type MonoImportValueType = 'string' | 'number' | 'date' | 'boolean';
/** Decimal/grouping convention for `number` columns. */
export type MonoImportNumberFormat = 'auto' | 'us' | 'eu';
/** One leg of the composite key that pairs a sheet row with a table row. */
export interface MonoImportMatch<T = any> {
    /** Header text in the sheet. */
    excel: string;
    /** Field on the table row. */
    field: string;
    /**
     * Normalise this key part before comparing — applied to **both** sides, so a
     * sheet's `"  PT  Mono "` can match a row's `"PT Mono"`. Runs on top of the
     * default normalisation (trim, collapse whitespace, lowercase).
     */
    transform?: (value: unknown, side: 'excel' | 'table') => unknown;
}
/** A column the sheet is allowed to write into a matched row. */
export interface MonoImportColumn<T = any> {
    /** Header text in the sheet. */
    excel: string;
    /** Field on the table row to stage. */
    field: string;
    /** How to interpret the cell (default `'string'`). */
    type?: MonoImportValueType;
    /** Post-process the parsed value; return `undefined` to skip the cell. */
    transform?: (value: unknown, ctx: {
        row: T;
        field: string;
        raw: unknown;
    }) => unknown;
}
/** A sheet row that produced no staged change, and why. */
export interface MonoImportRejection {
    /** Zero-based index within the sheet's data rows. */
    index: number;
    /** The sheet row as `{ header: value }`. */
    row: Record<string, unknown>;
    /** Human-readable cause. */
    reason?: string;
}
/** A sheet row that matched more than one table row. */
export interface MonoImportAmbiguity extends MonoImportRejection {
    /** How many table rows the strongest usable key resolved to. */
    candidates: number;
}
/** One row's staged patch. */
export interface MonoImportChange<T = any> {
    /** The controller's string row key. */
    rowKey: string;
    /** The row's `keyExpr` value, for a store update. */
    key: unknown;
    /** The matched table row (pre-change). */
    row: T;
    /** field → new value. */
    patch: Record<string, unknown>;
}
export interface MonoImportOptions<T = any> {
    /** The spreadsheet file, or the text pasted out of one. */
    data: File | Blob | ArrayBuffer | Uint8Array | string;
    /** Force the reader; inferred from `data` when omitted. */
    type?: MonoImportType;
    /** Worksheet name or zero-based index (`'excel'` only; default: the first). */
    sheet?: string | number;
    /** 1-based row holding the headers (default `1`). */
    headerRow?: number;
    /** Column delimiter for pasted text. Auto-detects tab / `;` / `,`. */
    delimiter?: string;
    /**
     * Composite key pairing a sheet row with a table row. Required — an import
     * with no key would have nowhere to put its values.
     */
    match: Array<MonoImportMatch<T>>;
    /** The columns the sheet may write. Required. */
    columns: Array<MonoImportColumn<T>>;
    /** Extra header spellings to accept, e.g. `{ 'JAN': ['Januari', 'Jan-26'] }`. */
    headerAliases?: Record<string, string[]>;
    /**
     * Smallest number of key fields allowed to identify a row (default `2`).
     * Raise it when a single shared field would produce false matches.
     */
    minKeyFields?: number;
    /** Override key normalisation (applied to both sides). */
    normalizeKey?: (value: unknown) => string;
    /**
     * Rows to match against. Defaults to every row the grid can produce
     * (`table.getData()`), not just the visible page.
     */
    target?: T[];
    /** Skip sheet rows — summary/total lines, blank separators, … */
    rowFilter?: (sheetRow: Record<string, unknown>, index: number) => boolean;
    /** Restrict which table rows may be written at all. */
    targetFilter?: (row: T) => boolean;
    /**
     * Veto a write. Return `true` (or a string reason) to refuse. The reason is
     * surfaced in `skippedRows`, so the user can be told *which* rows were
     * ignored and why instead of silently losing them.
     */
    readOnly?: (row: T, field: string) => boolean | string;
    /**
     * `'stage'` (default) writes the changes into the grid's staged buffer.
     * `'none'` computes everything and hands back `result.apply()`, so the result
     * can be validated — and the import abandoned — before anything is staged.
     */
    apply?: 'stage' | 'none';
    /** Decimal/grouping convention for `number` columns (default `'auto'`). */
    numberFormat?: MonoImportNumberFormat;
    /** Accept negative numbers, including `(1.234)` (default `true`). */
    allowNegative?: boolean;
    /** Sheet rows processed between yields (default `300`). */
    chunkSize?: number;
    /** Milliseconds to yield between chunks so the UI stays responsive (default `0`). */
    yieldMs?: number;
    /** Progress across the sheet's data rows. */
    onProgress?: (done: number, total: number) => void;
    /** Log matching decisions to the console. */
    debug?: boolean;
}
export interface MonoImportResult<T = any> {
    /** Every considered sheet row matched exactly one table row. */
    ok: boolean;
    /** Sheet rows considered (after `rowFilter`). */
    total: number;
    /** Rows that resolved to exactly one table row. */
    matched: number;
    /** Rows that resolved to none. */
    unmatched: number;
    /** Rows whose strongest usable key hit several table rows. */
    ambiguous: number;
    /** Matched rows that actually produced a change. */
    changed: number;
    /** Cells refused by `targetFilter` / `readOnly`. */
    skipped: number;
    /** Headers found in the sheet. */
    headers: string[];
    /** Headers named in `match` / `columns` that the sheet doesn't have. */
    missingHeaders: string[];
    /** The staged (or stageable) patches. */
    changes: Array<MonoImportChange<T>>;
    unmatchedRows: MonoImportRejection[];
    ambiguousRows: MonoImportAmbiguity[];
    skippedRows: MonoImportRejection[];
    /** `target` with every patch applied — for validating before committing. */
    merged: T[];
    /** Stage the changes now. A no-op when they were already staged. */
    apply: () => void;
}
