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
 * `text` as the element renders it: its `text-transform`, its `letter-spacing` (canvas ignores
 * both) and its `font-variant-numeric: tabular-nums` (every digit at the widest digit's advance —
 * a safe upper bound; tabular figures are wider than the proportional ones canvas measures).
 */
export declare function measureStyled(text: string, style: CSSStyleDeclaration): number;
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
 * What a batch of body mutations touched: the rows that were added or changed inside, and whether
 * anything changed OUTSIDE a row (a section swapped in, a `<tfoot>` from `v-if`) — that is `full`.
 * Removed rows are not tracked: a grow-only column cannot narrow, every other column re-measures
 * in full on any change.
 */
interface BodyChange {
  rows: Set<HTMLTableRowElement>;
  full: boolean;
}
/**
 * One auto-sized column, owned by its `mono-table-th`. `schedule()` coalesces every trigger (a
 * controller notify, a body mutation, typing in an editor) into one measurement per frame.
 */
export declare class ColumnAutoSize {
  private readonly host;
  min?: number;
  max?: number;
  /**
   * Never shrink — for a virtual-scroll table, whose body holds only the WINDOW of the rows: each
   * window shift measured a different slice, so the column grew and shrank as the list scrolled and
   * every change relaid the whole table. The column settles at the widest value seen instead, until
   * `resetFloor()` (a new result set).
   *
   * It also makes body changes INCREMENTAL: a column that can only grow needs to look at nothing
   * but the rows that came in or changed — everything else is already in the floor. A window shift
   * then measures the few rows that scrolled in, not the whole window plus the header.
   */
  growOnly: boolean;
  private _floor;
  private _raf;
  /** The next measurement must walk header + every row (vs. only `_dirty`). */
  private _full;
  private _dirty;
  private _watch?;
  private _wrote?;
  constructor(host: HTMLElement);
  /**
   * Every sizer on the page shares ONE frame callback (`_flush`), which measures all of them
   * first and writes all of them after.
   *
   * Each used to run in its own frame callback, measure-then-write: column A wrote its width,
   * so column B's measurement (`getBoundingClientRect` on header icons, an SVG) forced a
   * synchronous layout of the whole table — one per auto column, per frame.
   */
  private static _queued;
  private static _frame;
  private static _flush;
  /** Re-measure everything — header, body and footer — on the next frame. */
  schedule(): void;
  /**
   * @internal — from the table's shared watcher. A grow-only column with a floor already set only
   * needs the rows that came in or changed (a removed row cannot make it wider); anything else
   * measures in full.
   */
  _bodyChanged(change: BodyChange): void;
  private _queue;
  /** Forget the grow-only floor (new rows) and re-measure. */
  resetFloor(): void;
  /** Stop watching, and hand the column back to whatever width it is given next. */
  stop(clear?: boolean): void;
  private _watchTable;
  private _unwatch;
  /** Measure now (reads only); returns the write to apply after every sizer has measured. */
  private _measure;
}
//#endregion
export {};