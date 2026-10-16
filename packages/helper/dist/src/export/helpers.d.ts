import { MonoExportFormatOptions, MonoExportHelper } from "./types.js";
//#region src/export/helpers.d.ts
/**
 * Build the built-in helper map for one render. Bound to `formatting` so
 * locale/currency choices apply consistently across every helper.
 */
export declare function createHelpers(formatting?: MonoExportFormatOptions): Record<string, MonoExportHelper>;
//#endregion