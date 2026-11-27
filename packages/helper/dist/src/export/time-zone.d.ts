//#region src/export/time-zone.d.ts
/**
 * Is `timeZone` a zone this runtime knows? An unknown one warns ONCE per name and reads as
 * "not set", so a typo falls back to the browser's zone instead of failing every export.
 */
export declare function validTimeZone(timeZone: string | undefined): timeZone is string;
/**
 * The Date to hand ExcelJS so the sheet shows the wall-clock time of `date` in `timeZone`
 * (or the browser's zone when that is unset or unknown). The offset is the one in force AT that
 * date, so a DST zone gets each row's own.
 */
export declare function toSheetDate(date: Date, timeZone?: string): Date;
//#endregion