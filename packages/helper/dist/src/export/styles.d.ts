import { MonoExportStyle, MonoExportStyles } from './types';
/**
 * Built-in styles. Consumers override individual keys via `options.styles`
 * without having to redefine a whole style.
 */
export declare const DEFAULT_STYLES: MonoExportStyles;
/** Merge user styles over the defaults, per style name (shallow, key by key). */
export declare function mergeStyles(overrides?: MonoExportStyles): MonoExportStyles;
/** Later styles win, key by key — used to layer row style → cell style. */
export declare function combineStyles(...styles: Array<MonoExportStyle | undefined>): MonoExportStyle;
/**
 * ExcelJS wants `ARGB` without the `#`. Accepts `#rgb`, `#rrggbb` and
 * `#aarrggbb`; anything already 8 hex digits is passed through.
 */
export declare function toArgb(color: string | undefined): string | undefined;
/** One ExcelJS border edge. */
interface ExcelBorderEdge {
    style: 'thin';
    color: {
        argb: string;
    };
}
/** The subset of ExcelJS cell style options this engine produces. */
export interface ExcelCellStyle {
    font?: Record<string, unknown>;
    fill?: Record<string, unknown>;
    alignment?: Record<string, unknown>;
    border?: Record<string, ExcelBorderEdge>;
    numFmt?: string;
}
/** Translate a semantic style into ExcelJS cell options. */
export declare function toExcelStyle(style: MonoExportStyle): ExcelCellStyle;
export {};
