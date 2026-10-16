/// <reference path="../../vue.d.ts" />
import { MonoExportColumn, MonoExportFormat, MonoExportFormatOptions, MonoExportHelper, MonoExportOptions, MonoExportResult, MonoExportStyle, MonoExportStyles } from "./types.js";
import { DEFAULT_STYLES } from "./styles.js";
import { MonoExportDirective } from "./sentinel.js";
//#region src/export/index.d.ts
/**
 * Render a Markdown report template.
 *
 * When `fileName` is given its extension selects the renderer and the file
 * downloads automatically (pass `download: false` to suppress that). Without
 * one, nothing is written — you just get the result object.
 */
export declare function exportTable(options: MonoExportOptions): Promise<MonoExportResult>;
//#endregion
export { DEFAULT_STYLES, type MonoExportColumn, type MonoExportDirective, type MonoExportFormat, type MonoExportFormatOptions, type MonoExportHelper, type MonoExportOptions, type MonoExportResult, type MonoExportStyle, type MonoExportStyles };