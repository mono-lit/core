import { MonoImportOptions, MonoImportType } from './types';
/** A parsed sheet: the header row plus the data rows beneath it. */
export interface ParsedSheet {
    headers: string[];
    rows: unknown[][];
}
/** Decide how to read `data` when the caller didn't say. */
export declare function inferType(data: MonoImportOptions['data']): MonoImportType;
/**
 * Parse the caller's `data` into headers + rows.
 *
 * Rows above `headerRow` are dropped, which is what lets a sheet carry a title
 * block above its table.
 */
export declare function parseSheet(options: MonoImportOptions): Promise<ParsedSheet>;
