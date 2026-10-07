/**
 * Public types for the Markdown report engine.
 *
 * The engine deliberately exposes a *semantic* style vocabulary rather than raw
 * ExcelJS objects: templates stay renderer-independent, so the same report can
 * later be rendered to PDF/HTML/CSV by writing a new renderer instead of
 * rewriting every template.
 */
/** Output formats the engine can render a template into. */
export type MonoExportFormat = 'md' | 'xlsx';
/**
 * A named, renderer-independent style. Referenced from a template as
 * `{{style "header"}}` and resolved against the merged style map.
 */
export interface MonoExportStyle {
    bold?: boolean;
    italic?: boolean;
    underline?: boolean;
    /** Font size in points. */
    size?: number;
    /** Font family (defaults to the workbook font). */
    font?: string;
    /** Text colour — `#rrggbb` or `#aarrggbb`. */
    color?: string;
    /** Solid background fill — `#rrggbb` or `#aarrggbb`. */
    bg?: string;
    align?: 'left' | 'center' | 'right';
    valign?: 'top' | 'middle' | 'bottom';
    /** Cell borders. `'bottom'` is handy for a header underline. */
    border?: 'all' | 'bottom' | 'top' | 'outline' | 'none';
    /** Border colour (defaults to a mid grey). */
    borderColor?: string;
    /** Excel number format, e.g. `#,##0.00`, `0.00%`, `yyyy-mm-dd`. */
    numFmt?: string;
    /** Wrap long text inside the cell. */
    wrap?: boolean;
    /** Indent level (each step ≈ 3 characters in Excel). */
    indent?: number;
    /** Row height in points, applied when the style lands on a whole row. */
    height?: number;
}
/** The named-style map: `{ header: { bold: true }, … }`. */
export type MonoExportStyles = Record<string, MonoExportStyle>;
/** Per-column overrides for the generated worksheet. */
export interface MonoExportColumn {
    /** Column width in characters. Omit to auto-fit from content. */
    width?: number;
    /** Default number format for every cell in the column. */
    numFmt?: string;
}
/** How `{{currency}}` / `{{number}}` / `{{date}}` format their display text. */
export interface MonoExportFormatOptions {
    /** BCP-47 locale for the display text (default: the runtime's locale). */
    locale?: string;
    /** ISO 4217 code used by `{{currency}}` (default `'USD'`). */
    currency?: string;
    /** Excel number format for `{{currency}}` (default: derived from `currency`). */
    currencyFormat?: string;
    /** Excel number format for `{{number}}` (default `'#,##0'`). */
    numberFormat?: string;
    /** Excel number format for `{{date}}` (default `'yyyy-mm-dd'`). */
    dateFormat?: string;
    /** Excel number format for `{{percent}}` (default `'0.00%'`). */
    percentFormat?: string;
}
/** A Handlebars helper, as accepted by `options.helpers`. */
export type MonoExportHelper = (...args: any[]) => unknown;
/** Per-document detail sheets. See {@link MonoExportOptions.detail}. */
/** One chunk of master rows, handed to {@link MonoExportDetail.load}. */
export interface MonoExportDetailBatch {
    /** The master rows in this chunk. */
    data: Record<string, unknown>[];
    /** Their key values, in `data` order, with duplicates removed. */
    keys: unknown[];
    /** The name of the master key field — what a filter needs to name. */
    key: string;
}
export interface MonoExportDetail {
    /**
     * Field on the master row identifying the document. Its value is the link
     * target the master template writes (`sheet:{{no}}`) and the basis of the
     * sheet name. Dotted paths are accepted.
     */
    key: string;
    /** Template for one detail sheet. Its context is `{ row, rows }`. */
    md: string;
    /**
     * Key of `data` holding the master rows (default `'rows'`).
     *
     * `data` is whatever the caller passes, so the exporter cannot guess which of
     * its keys the master template iterates.
     */
    from?: string;
    /** Field holding the already-nested detail rows. Use this OR `load`. */
    field?: string;
    /**
     * Fetch detail rows for a BATCH of master rows. Use this OR `field`.
     *
     * It is handed a chunk of master rows and their keys, and returns the detail
     * rows for all of them in one array — the exporter groups them back per
     * document using {@link groupBy}. One request serves a whole chunk, so a
     * 1000-row master costs 10 requests at the default {@link loadChunk}, not
     * 1000.
     *
     * ```ts
     * load: ({ keys, key }) =>
     *   api.lines({ filter: keys.map((id) => [key, '=', id]) })
     * ```
     *
     * For an endpoint that genuinely only serves one document at a time, set
     * `loadChunk: 1` and read `data[0]`.
     */
    load?: (batch: MonoExportDetailBatch) => unknown[] | Promise<unknown[]>;
    /**
     * How many master keys to send per `load` call (default 100).
     *
     * Lower it when the backend caps how many values a filter may carry, or when
     * the generated URL would outgrow the server's limit.
     */
    loadChunk?: number;
    /**
     * How many `load` CHUNKS to have in flight at once (default 4). With the
     * default `loadChunk` that is up to 400 documents being fetched in parallel.
     * Ignored with `field`.
     */
    concurrency?: number;
    /**
     * Which field on a RETURNED row says which master row it belongs to.
     * Defaults to {@link key}, which is right whenever both sides name the
     * foreign key the same way. Dotted paths are accepted, or pass a function.
     *
     * Returned rows that match no master key are ignored.
     */
    groupBy?: string | ((row: Record<string, unknown>) => unknown);
    /**
     * Sheet name for a document. Defaults to the key. The result is sanitised and
     * de-duplicated regardless, so this need not worry about Excel's rules.
     */
    sheetName?: (row: Record<string, unknown>) => string;
    /** Put a `← Back` link in `A1` of each detail sheet (default `true`). */
    back?: boolean;
}
export interface MonoExportOptions {
    /** The Markdown template source (e.g. `import md from './payroll.md?raw'`). */
    md: string;
    /**
     * Everything here is addressable at the top level of the template — an array
     * loops (`{{#each company}}`), an object drills in (`{{header.Name.Full}}`).
     *
     * A **devextreme DataSource** (or store) may be passed in place of an array:
     * it is drained to its rows before rendering, honouring the filter, search and
     * sort it already carries. Only top-level values are resolved this way.
     */
    data?: Record<string, unknown>;
    /**
     * Rows per request when draining a DataSource passed in {@link data}
     * (default `100`). A remote source can't report its size up front, so the
     * read walks in fixed chunks until one comes back short.
     */
    chunkSize?: number;
    /**
     * Output file name. Its extension picks the renderer (`.xlsx` → Excel,
     * `.md` → Markdown) and, unless `download` is `false`, triggers a browser
     * download. Omit to just get the result object back.
     */
    fileName?: string;
    /** Force the renderer instead of inferring it from `fileName`. */
    format?: MonoExportFormat;
    /** Auto-download when `fileName` is set (default `true`). */
    download?: boolean;
    /** Named styles, shallow-merged per name over the built-in defaults. */
    styles?: MonoExportStyles;
    /** Per-column width / number-format overrides, left to right. */
    columns?: MonoExportColumn[];
    /** Worksheet name (default `'Sheet1'`). */
    sheetName?: string;
    /**
     * Give each row of the master sheet its own worksheet, reached from a link.
     *
     * The master template links by KEY, not by sheet name, because the final name
     * is only known at write time (it is sanitised for Excel and de-duplicated
     * against the workbook):
     *
     * ```md
     * | [{{no}}](sheet:{{no}}) | {{total}} |
     * ```
     *
     * In `.md` output that stays an ordinary Markdown link, so the same template
     * serves both formats.
     */
    detail?: MonoExportDetail;
    /** Number/date formatting used by the built-in format helpers. */
    formatting?: MonoExportFormatOptions;
    /**
     * Last-mile access to the populated ExcelJS workbook, **before** anything is
     * written — so it works even when `fileName` triggers an auto-download.
     *
     * Use it for what a Markdown template can't express: a second worksheet,
     * `autoFilter`, conditional formatting, cell notes, sheet protection, print
     * setup. Runs exactly once no matter how many times the workbook is
     * requested, and only for `xlsx` output.
     *
     * @example
     * onWorkbook: (wb) => {
     *   const ws = wb.getWorksheet('Report')
     *   ws.autoFilter = 'A2:D2'
     *   ws.getCell('A1').note = 'Draft'
     * }
     */
    onWorkbook?: (workbook: any) => void | Promise<void>;
    /** Extra Handlebars helpers, merged over the built-ins. */
    helpers?: Record<string, MonoExportHelper>;
    /** Handlebars partials available as `{{> name}}`. */
    partials?: Record<string, string>;
    /**
     * Freeze the worksheet's first N rows (default `0`). Set it to the number of
     * rows above your table header for a sticky header in Excel.
     */
    freezeRows?: number;
}
/** What `exportTable()` / `table.export()` hand back. */
export interface MonoExportResult {
    /**
     * The rendered Markdown, with every directive token stripped — safe to show
     * in a preview pane, diff, or write to a `.md` file.
     */
    markdown: string;
    /** The resolved output format (`null` when neither `fileName` nor `format` was given). */
    format: MonoExportFormat | null;
    /** The resolved file name, if any. */
    fileName: string | null;
    /**
     * Every worksheet in the workbook, master first, in creation order — the
     * names as Excel received them, after sanitising and de-duplication.
     * Empty until an `xlsx` render has happened.
     */
    sheets: string[];
    /**
     * Documents that got no sheet. Without this a caller cannot tell "12 of 400
     * had no lines" from "it all worked", which is exactly the blind spot in the
     * implementation this feature replaces.
     */
    skipped: Array<{
        key: string;
        reason: 'empty' | 'failed';
        error?: unknown;
    }>;
    /** Render to a `Blob` (defaults to the resolved format, else `'md'`). */
    toBlob(format?: MonoExportFormat): Promise<Blob>;
    /** Render to an `ArrayBuffer` — for uploading instead of downloading. */
    toBuffer(format?: MonoExportFormat): Promise<ArrayBuffer>;
    /**
     * The populated ExcelJS workbook, for last-mile tweaks the template can't
     * express. Requires the optional `exceljs` peer.
     */
    workbook(): Promise<any>;
    /** Trigger a browser download (browser only). */
    download(fileName?: string): Promise<void>;
}
