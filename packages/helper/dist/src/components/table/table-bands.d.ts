import { MonoGroupedWindow } from "./grouped-bands.js";
//#region src/components/table/table-bands.d.ts
/** What the injector reads off the controller. */
export interface BandHost {
  subscribe(cb: () => void): () => void;
  readonly groupedWindow: MonoGroupedWindow | null;
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
  /** The band's row — created on first use, its attributes / text kept current. */
  private rowFor;
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