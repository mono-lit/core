// excel-config.ts
import type {
    Worksheet,
    Alignment,
    Font,
    Fill,
    Borders,
    Table,
    Workbook
} from 'exceljs';

// Re-export so callers can use exact ExcelJS types too
export type { Worksheet, Alignment, Font, Fill, Borders, Table };
type KeyOf<T> = Extract<keyof T, string>;
/** Allow real keys AND dot-paths (e.g. "brand.nama") */
export type ColumnKey<T> = KeyOf<T> | string;


// Column spec = only what ExcelJS doesn’t provide (key/title/map),
// while style props reuse ExcelJS types directly.
export type ColumnSpec<T> = {
    key: ColumnKey<T>;
    title?: string;
    width?: Worksheet['columns'][number]['width'];
    numFmt?: string;
    align?: Alignment['horizontal'];
    map?: (value: any, row: T) => any;
    font?: Partial<Font>;
    fill?: Fill;
    alignment?: Partial<Alignment>;
    border?: Partial<Borders>;

};


export type RowspanField = {
    /** Array field to expand; supports dot-paths */
    field: string;
    /** If array elements are objects, which key to show (default: first key) */
    valueKey?: string;
    /** Column header title (default: field) */
    title?: string;
};


export type TotalsEntry =
    | { fn: 'sum' | 'avg' | 'average' | 'min' | 'max' | 'count' | 'counta' }
    | { fn: 'custom'; formula: (F: FormulaUtils & { firstDataRow: number; lastDataRow: number }) => string };


export type TableFormulas = {
    computed?: Array<{
        key: string;
        title?: string;
        at?: 'end' | { before?: string; after?: string };
        value: (row: any, rowIndex: number, F: FormulaUtils) => string | number | { formula: string; result?: number | string };
    }>;
    totalsRow?: boolean;  // (ignored in our manual approach, but keep for compat)
    totals?: Record<string, TotalsEntry>;
};

export type ColumnInput<T> = ColumnKey<T> | ColumnSpec<T>;

export type TableTotalsFn = 'sum' | 'min' | 'max' | 'average' | 'count' | 'countNums' | 'stdDev' | 'var' | 'custom';

export type FormulaValue =
    | string
    | { formula: string; result?: any }; // ExcelJS supports cached result (optional)

export type TableComputedColumn<T> = {
    key: string;                // column key to write (creates if not present in table path)
    title?: string;
    at?: 'end' | { before?: string; after?: string }; // where to insert in table columns
    value: (row: T, rowIndex: number, F: FormulaUtils) => any | FormulaValue;
};

export type TableTotalsSpec = {
    fn?: TableTotalsFn;         // built-in
    formula?: (F: FormulaUtils) => string; // for custom, receives helpers (col letters/ranges)
};

export type RowspanPerRow<T> = {
    key: string;                // extra column to render in rowspan sheet
    title?: string;
    value: (ctx: RowspanCtx<T>) => any | FormulaValue; // computed per visual row
};

export type RowspanPerBlock<T> = {
    title?: string;             // text in col 1 (or leave undefined to only fill a cell)
    place?: 'below' | 'above';  // default 'below'
    write: (ctx: RowspanCtx<T>) => FormulaValue; // one cell formula/value somewhere (choose column via ctx.letter/col)
    column?: string | number;   // key or 1-based index to place the value (default: 2)
};

export type RowspanGrandTotal = {
    title?: string;
    column: string | number;    // key or index
    value: (F: FormulaUtils & { firstDataRow: number; lastDataRow: number }) => FormulaValue;
};

export type FormulaUtils = {
    col: (k: string | number) => number;         // 1-based
    letter: (k: string | number) => string;      // 'A', 'B', ...
    range: (k: string | number, r1: number, r2: number) => string; // 'A2:A10'
};


export type RowspanCtx<T> = {
    row: T;                 // the parent item
    i: number;              // parent index
    vRow: number;           // current visual row index (Excel row number)
    startRow: number;       // block start row
    endRow: number;         // block end row
    el?: any;               // array element if this visual row has one (for a particular field, if you choose)
    col: FormulaUtils['col'];
    letter: FormulaUtils['letter'];
    range: FormulaUtils['range'];
};

type RowStyleHook = (
    ws: ExcelJS.Worksheet,
    rowObj: any,
    vRow: number,
    iInBlock: number
) => void

export type AdvancedRenderResult = {
    headerRows?: number;        // default 1
    firstDataRow?: number;      // default headerRows + 1
    lastDataRow?: number;       // optional
    zebra?: boolean;            // override zebra
    zebraStartRow?: number;     // optional
    moneyCols?: number[];       // 1-based col indexes for money format
    moneyFormat?: string;          // optional override number format
};

export type AdvancedRenderCtx<T> = {
    ws: Worksheet;
    wb: import('exceljs').Workbook;
    items: T[];
    exportTitle: string;
    setCellVal: (r: number, c: number, v: any) => void;
};

export type SortSpec<T> = {
    key: keyof T | string;               // supports dot-path like "user.name"
    dir?: 'asc' | 'desc';
    cmp?: (a: any, b: any, rowA: T, rowB: T) => number; // optional custom compare
    nulls?: 'first' | 'last';            // optional
};

export type ExcelConfig<T> = {
    /** Optional custom sheet name; default: export title */
    sheetName?: string;

    /** Pass native ExcelJS table style (same type used by addTable) */
    table?: Partial<Pick<Table, 'style' | 'totalsRow' | 'headerRow'>> & {
        name?: Table['name'];
    };

    /**
     * Column order/selection. Strings use the key as both field & title.
     * Objects allow full control (title, width, numFmt, map, styles).
     */
    columns?: ColumnInput<T>[];

    /** Optional global number formats by key (native Excel number format strings) */
    numberFormats?: Partial<Record<keyof T, string>>;

    /** Freeze header row */
    freezeHeader?: boolean;

    /** Zebra striping for data rows */
    zebra?: boolean;
    zebraLightArgb?: string;

    /** Header styling using native ExcelJS types */
    headerStyle?: {
        fill?: Fill;
        font?: Partial<Font>;
        alignment?: Partial<Alignment>;
        border?: Partial<Borders>;
    };

    /** Pass-through native worksheet options (no redefinition) */
    worksheet?: Partial<Pick<Worksheet, 'views' | 'pageSetup' | 'properties'>>;

    /** Pre-sort data before writing (Excel can’t store initial sort UI) */
    sortBy?: SortSpec<T> | SortSpec<T>[];
    arrayStrategy?: 'extraSheet' | 'join' | 'stringify' | 'rowspan'; // default: 'extraSheet'
    joinDelimiter?: string;                               // used when arrayStrategy='join'
    parentKeys?: (keyof T)[];                             // columns to carry over to detail sheets
    arraySheetTitle?: (fieldPath: string) => string;      // customize sheet names
    arrayColumns?: Record<string, ColumnInput<any>[]>;    // per-array column override by field path
    rowspan?: {
        /** Which non-array column to use as the anchor (default: first non-array col) */
        anchorKey?: keyof T | string;
        /** Which non-array columns should also be vertically merged (default: [anchorKey]) */
        mergeKeys?: (keyof T | string)[];
        /** Array fields to expand (default: auto-detect ALL array fields on data) */
        fields?: RowspanField[];
        /** Optional: override titles for non-array columns by key */
        nonArrayTitles?: Record<string, string>;
        rowStyle?: RowStyleHook;
    };
    formulas?: {
        // TABLE PATH (addTable)
        table?: {
            totalsRow?: boolean;
            totals?: Partial<Record<string, TableTotalsSpec>>; // by column key
            computed?: TableComputedColumn<T>[];
        };

        // ROWSPAN PATH
        rowspan?: {
            perRow?: RowspanPerRow<T>[];
            perBlock?: RowspanPerBlock<T>[];     // small summaries above/below each brand block
            grand?: RowspanGrandTotal[];         // grand totals at the bottom
        };
    };
    render?: (ctx: AdvancedRenderCtx<T>) => void | AdvancedRenderResult | Promise<void | AdvancedRenderResult>;

};



