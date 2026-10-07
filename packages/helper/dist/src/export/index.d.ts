/// <reference path="../../vue.d.ts" />
import { MonoExportOptions, MonoExportResult } from './types';
export type { MonoExportColumn, MonoExportFormat, MonoExportFormatOptions, MonoExportHelper, MonoExportOptions, MonoExportResult, MonoExportStyle, MonoExportStyles, } from './types';
export { DEFAULT_STYLES } from './styles';
export type { MonoExportDirective } from './sentinel';
/**
 * Render a Markdown report template.
 *
 * When `fileName` is given its extension selects the renderer and the file
 * downloads automatically (pass `download: false` to suppress that). Without
 * one, nothing is written — you just get the result object.
 */
export declare function exportTable(options: MonoExportOptions): Promise<MonoExportResult>;
