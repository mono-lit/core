import { Root } from 'mdast';
import { MonoExportOptions } from '../types';
/** What a template writes to link at a sheet it cannot yet name. */
export declare const SHEET_LINK_PREFIX = "sheet:";
/** One extra worksheet: a parsed detail report plus the key that links to it. */
export interface RenderExcelSheet {
    /** The value the master template linked to, i.e. `sheet:<key>`. */
    key: string;
    /** Preferred name. Sanitised and de-duplicated before use. */
    name: string;
    ast: Root;
}
/**
 * Options the driver reads.
 *
 * Spelled out rather than `Pick<>`-ed from a list that has to be kept in step:
 * an option added to `MonoExportOptions` and not here silently never reaches
 * the driver, and nothing fails to compile.
 */
export interface RenderExcelOptions extends Pick<MonoExportOptions, 'styles' | 'columns' | 'sheetName' | 'freezeRows'> {
    /** Extra sheets, rendered after the master and linked from it. */
    sheets?: RenderExcelSheet[];
    /** Add a `← Back` link to `A1` of every extra sheet. */
    back?: boolean;
}
/** Build the ExcelJS workbook for a parsed report. */
export declare function renderExcel(ast: Root, options?: RenderExcelOptions): Promise<any>;
