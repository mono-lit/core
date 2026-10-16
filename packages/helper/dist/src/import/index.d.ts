/// <reference path="../../vue.d.ts" />
import { MonoImportAmbiguity, MonoImportChange, MonoImportColumn, MonoImportMatch, MonoImportNumberFormat, MonoImportOptions, MonoImportRejection, MonoImportResult, MonoImportType, MonoImportValueType } from "./types.js";
//#region src/import/index.d.ts
/** What the controller supplies so this module never reaches into it. */
export interface TableImportBridge<T = any> {
  /** Every row the grid can produce — the default match target. */
  getData: () => Promise<T[]>;
  /** The controller's stable string key for a row. */
  rowKeyOf: (row: T, index: number) => string;
  /** The row's `keyExpr` value, for a later store update. */
  serverKeyOf: (row: T) => unknown;
  /** Write the patches into the staged buffer, marking them as imported. */
  stageImported: (changes: Array<MonoImportChange<T>>) => void;
}
/** Run an import against a grid. The implementation behind `table.import()`. */
export declare function importTable<T = any>(options: MonoImportOptions<T>, bridge: TableImportBridge<T>): Promise<MonoImportResult<T>>;
//#endregion
export type { MonoImportAmbiguity, MonoImportChange, MonoImportColumn, MonoImportMatch, MonoImportNumberFormat, MonoImportOptions, MonoImportRejection, MonoImportResult, MonoImportType, MonoImportValueType };