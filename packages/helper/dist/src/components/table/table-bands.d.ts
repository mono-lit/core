import { MonoGroupedWindow } from "./grouped-bands.js";
//#region src/components/table/table-bands.d.ts
/** What the injector reads off the controller. */
export interface BandHost {
  subscribe(cb: () => void): () => void;
  readonly groupedWindow: MonoGroupedWindow | null;
  /** Every band drawn (the ones under a folded band are not). */
  readonly grouped: readonly unknown[];
  /** Bands + visible rows — equal to `grouped.length` when every band is folded. */
  readonly virtualSlotCount?: number;
  readonly items: unknown[];
  readonly scrollMode: 'off' | 'infinity' | 'virtual';
  readonly virtualRowHeight?: number;
  toggleGrouped(path: string): void;
}
/** The tbody's data rows, in order — see the module comment. */
export declare function dataRowsOf(body: HTMLTableSectionElement): HTMLTableRowElement[];
export declare class BandInjector {
  readonly table: HTMLTableElement;
  private readonly ctrl;
  /** Band rows by path — reused across passes so a band keeps its node (and focus). */
  private readonly rows;
  private body;
  private unsubscribe;
  private mo;
  private ro;
  private queued;
  private stopped;
  /** The last checkbox column found — kept for passes with no row to read it from. */
  private checkCol;
  constructor(ctrl: BandHost, table: HTMLTableElement);
  /** Re-run a pass now-ish (after a config change that may not notify). */
  refresh(): void;
  stop(): void;
  private schedule;
  /** Watch the CURRENT tbody — a framework may swap it. */
  private watch;
  private syncHeadHeight;
  private removeAll;
  /** One placement pass. Public for tests; normally driven by notify / mutations. */
  flush(): void;
  /**
   * The column the band checkboxes go in, or `null` (no band asks for one, or the
   * table has no row checkbox to line up with). See the module comment.
   */
  private findCheckColumn;
  /** The band's row — created on first use, its attributes / text kept current. */
  private rowFor;
  /**
   * The cells in front of the label: the lead cells and the checkbox cell, rebuilt only
   * when the column layout changed; the checkbox's own props kept current.
   */
  private syncCells;
  /**
   * The band's icon, the way every mono icon works: an iconify class
   * (`i-mdi-tag`) is an empty span carrying the class — UnoCSS's preset-icons
   * paints it as a mask, and since the band row is light DOM the page's utility
   * CSS reaches it — anything else (an emoji, a character) is plain text.
   * Rewritten only when the value changed.
   */
  private syncIcon;
}
//#endregion