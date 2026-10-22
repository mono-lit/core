import { CssSizeValue } from "../../composables/css-size.js";
//#region src/components/table/column-autosize.d.ts
/**
 * Content-sized columns — what `mono-table-th`'s `width="auto"` drives.
 *
 * Under `mono-table-fixed` (`table-layout: fixed`) CSS cannot do this: an `auto` column takes
 * the WHOLE surplus instead of fitting its content, and `min-width` / `max-width` on a cell are
 * ignored by the table algorithm. So the column is measured here and handed a concrete px width,
 * clamped to `minWidth` / `maxWidth`, written to its `<col>` (which wins under fixed layout) and
 * to the header cell.
 *
 * Text is measured with a canvas, not read back from the cell: reading the cell's own width would
 * return the width last written, and a column could then never shrink. Measuring text also keeps
 * the pass free of layout reads, so re-running it on every change is cheap.
 *
 * What is measured: the header (caption + its icons), every body cell and every FOOTER cell of
 * the column. The footer matters — a `<mono-table-summary>` total covers the whole set, so a
 * virtual-scroll window that only shows small figures still sizes for the largest one.
 *
 * Cell content is treated as one line (what a money column is). An editor (`<input>`, including
 * the one inside `mono-input`) counts with its value and its own padding / border.
 */
/** The text measurer — swappable so tests can run where there is no canvas (jsdom). */
export declare const autosizeEnv: {
  measure: (text: string, font: string) => number;
};
/**
 * A size prop as px: a number / bare numeric string / `px` → px, `rem` → × the root font size,
 * `em` → × `el`'s font size. Anything else (`%`, `auto`, a var) → `undefined`: not a bound.
 */
export declare function cssLengthToPx(value: CssSizeValue | null, el?: Element): number | undefined;
/** `w` clamped to `[min, max]`; an unset bound does not clamp. `min` wins over a smaller `max`. */
export declare function clampWidth(w: number, min?: number, max?: number): number;
/**
 * The grid column a header cell STARTS at — a walk over its section's rows honouring `rowspan`
 * and `colspan`, so a leaf header under a band row (`<th colspan>` above it) maps to its real
 * column. `cellIndex` alone would count only the cells of its own row.
 */
export declare function headerColumnIndex(cell: HTMLTableCellElement): number;
/** The one-line width a cell's content needs, padding included. */
export declare function contentWidth(cell: HTMLElement): number;
/**
 * One auto-sized column, owned by its `mono-table-th`. `schedule()` coalesces every trigger (a
 * controller notify, a body mutation, typing in an editor) into one measurement per frame.
 */
export declare class ColumnAutoSize {
  private readonly host;
  min?: number;
  max?: number;
  private _raf;
  private _table?;
  private _observer?;
  private _wrote?;
  private readonly _onInput;
  constructor(host: HTMLElement);
  schedule(): void;
  /** Stop watching, and hand the column back to whatever width it is given next. */
  stop(clear?: boolean): void;
  private _watch;
  private _unwatch;
  private _run;
}
//#endregion