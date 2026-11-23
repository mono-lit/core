//#region src/components/table/grouped-bands.d.ts
/**
 * `grouped` — sticky group BANDS over a flat, ordered row list.
 *
 * Unlike `group` (a tree: `displayRows` with group headers, per-group pagers, no
 * virtual scroll) a band is a single header row placed in front of the first row
 * of each run of equal keys. The rows themselves stay a flat list, so every flat
 * feature keeps working — virtual / infinity scroll, paging, search, summaries.
 *
 * Pure and dependency-free: the controller (`mono-data-grid.ts`) owns the rows,
 * the injector (`table-bands.ts`) owns the DOM; this module only does the maths.
 *
 * Coordinates:
 * - **row** — an index into `visible` (the ordered rows minus those under a
 *   collapsed band). `band.at` is the row the band is drawn in front of.
 * - **slot** — one per drawn thing, band or row, in display order. A virtual
 *   scroller measures in slots (each one `rowHeight` tall).
 */
/** Band look — the same four variants as `mono-button`. */
export type MonoGroupedVariant = 'solid' | 'outline' | 'tonal' | 'text';
/** One band level. A bare string is `{ field }` with every default. */
export interface MonoGroupedFieldConfig<T = any> {
  /** The key: consecutive rows with an equal value at this field (and every outer one) form one band. Paths (`Brand/Name`) work. */
  field: string;
  /** The band's label, from the band's FIRST row. Default: the field's value. */
  custom?: (row: T) => string;
  /** Show the band's row count `(n)`. Default `true`. */
  count?: boolean;
  /** `'solid' | 'outline' | 'tonal' | 'text'` — or per band, from its first row. Default `'tonal'`. */
  variant?: MonoGroupedVariant | ((row: T) => MonoGroupedVariant);
  /** A theme token (`primary`, `danger`, `success`, …) or any CSS colour — or per band. Default `'primary'`. */
  color?: string | ((row: T) => string);
  /** Nesting position, lower = outer. Unset → the field's position in `fields`. */
  order?: number;
  /** Whether a click folds this level's bands. Default: the table-level `collapsible`. */
  collapsible?: boolean;
  /** Whether this level's bands START open. Default: the table-level `open` (`true`). Ignored when not collapsible. */
  open?: boolean;
  /** `false` = an accordion: opening one of this level's bands closes its open siblings (same parent). Default: the table-level `stayOpen` (`true`). */
  stayOpen?: boolean;
  /**
   * An icon in front of this level's labels — an iconify class (`'i-mdi-tag'`, drawn as a masked span
   * like every mono icon) or any text such as an emoji (`'🏷️'`). A function picks one per band from
   * its first row. Default: the table-level `icon` (none). `''` turns an inherited icon off.
   */
  icon?: string | ((row: T) => string);
}
export type MonoGroupedField<T = any> = string | MonoGroupedFieldConfig<T>;
/** The `grouped` config — `<mono-table-th :grouped.prop>` / `monoDataGrid(data, { grouped })`. */
export interface MonoGrouped<T = any> {
  /** Band levels, outermost first (`['Brand', 'Code']`), or ordered by each entry's `order`. */
  fields: Array<MonoGroupedField<T>>;
  /**
   * Rows per request while the grid reads EVERY matching row (bands need the whole
   * set to know their boundaries and counts). The first request also asks for the
   * total count, which says how many more chunks to fetch. Default `100`.
   */
  chunk?: number;
  /** Whether bands fold on click. Default `true`; a field entry can override it. */
  collapsible?: boolean;
  /** Whether every band STARTS open. Default `true`; a field entry can override it. */
  open?: boolean;
  /** `false` = opening a band closes its open siblings (same level, same parent) — an accordion. Default `true`; a field entry can override it. */
  stayOpen?: boolean;
  /** An icon for EVERY band — iconify class or emoji (or a function of the first row). A field entry can override it. */
  icon?: string | ((row: T) => string);
}
/** A band level with every default resolved. */
export interface MonoGroupedLevel<T = any> {
  field: string;
  level: number;
  custom?: (row: T) => string;
  count: boolean;
  variant: MonoGroupedVariant | ((row: T) => MonoGroupedVariant);
  color: string | ((row: T) => string);
  collapsible: boolean;
  /** The level's initial state — `false` = its bands start folded. */
  open: boolean;
  /** `false` = opening a band closes its open siblings. */
  stayOpen: boolean;
  /** `''` = no icon. */
  icon: string | ((row: T) => string);
}
export interface MonoGroupedResolved<T = any> {
  fields: Array<MonoGroupedLevel<T>>;
  chunk: number;
  collapsible: boolean;
  open: boolean;
  stayOpen: boolean;
  icon: string | ((row: T) => string);
}
/**
 * A band's fold state for {@link buildGrouped}: a set of COLLAPSED paths (on top of
 * each level's `open` default), or a function deciding per band.
 */
export type MonoGroupedFoldState = ReadonlySet<string> | ((path: string, field: MonoGroupedLevel<any>) => boolean);
/** One band as the controller publishes it (`table.grouped`). */
export interface MonoGroupedItem<T = any> {
  /** Stable identity across rebuilds — the encoded keys, outer to inner. Collapse state is keyed by it. */
  path: string;
  /** Nesting depth, 0 = outermost. */
  level: number;
  field: string;
  /** The raw key value. */
  key: unknown;
  label: string;
  /** Rows under the band (collapsed ones included — it is what the band stands for). */
  count: number;
  showCount: boolean;
  /** The band's first row (what `custom` / a function `variant` / `color` read). */
  row: T;
  variant: MonoGroupedVariant;
  color: string;
  /** Iconify class or text (emoji); `''` = none. */
  icon: string;
  collapsible: boolean;
  collapsed: boolean;
  /** Row coordinate: drawn in front of `visible[at]` (`at === visible.length` → after the last row). */
  at: number;
  /** Slot coordinate. */
  slot: number;
}
export interface MonoGroupedLayout<T = any> {
  grouped: Array<MonoGroupedItem<T>>;
  /** The rows still shown — everything not under a collapsed band. */
  visible: T[];
  /** `visible.length + grouped.length`. */
  slotCount: number;
}
/** What a row window `[rowStart, rowEnd)` draws. */
export interface MonoGroupedWindow<T = any> {
  /** Window offset (index into the window's rows) → bands drawn in front of that row, outer first. Offset `rowEnd - rowStart` = after the last row. */
  before: Map<number, Array<MonoGroupedItem<T>>>;
  /** Bands whose own row lies above the window but whose rows continue into it — re-drawn at the top so they stay pinned. Outer first. */
  leads: Array<MonoGroupedItem<T>>;
  /** Slots above the window that are not drawn (rows + bands, leads excluded). */
  slotsAbove: number;
  /** Slots below the window that are not drawn. */
  slotsBelow: number;
}
/** Resolve a config; `null` when there is nothing to band by. */
export declare function normalizeGrouped<T = any>(cfg: MonoGrouped<T> | null | undefined): MonoGroupedResolved<T> | null;
/**
 * A config's identity for "did it change?". Functions count by presence only: a
 * template's inline `:grouped.prop="{ … custom: (r) => … }"` is a NEW object with
 * new closures on every render, and must not re-band (or re-render) each time.
 */
export declare function groupedSignature(cfg: MonoGrouped<any> | null | undefined): string;
/** A row's raw key at `field` (path-aware, like `grouping.ts`). */
export declare function bandKeyOf(row: unknown, field: string): unknown;
/**
 * Walk the ORDERED rows once and cut them into bands.
 *
 * A band opens at level L whenever the key at L — or at any outer level — differs
 * from the previous row's. The caller must keep each band contiguous (the band
 * fields lead the sort); a key that reappears later simply opens a second band.
 */
export declare function buildGrouped<T = any>(rows: ReadonlyArray<T>, fields: ReadonlyArray<MonoGroupedLevel<T>>, collapsed?: MonoGroupedFoldState): MonoGroupedLayout<T>;
/** Number of visible rows in front of `slot` — the row a slot window starts at. */
export declare function slotToRow<T>(layout: MonoGroupedLayout<T>, slot: number): number;
/** The slot of visible row `row`. */
export declare function rowToSlot<T>(layout: MonoGroupedLayout<T>, row: number): number;
/**
 * The bands a row window draws, and the slots it leaves to the spacers.
 *
 * The heights always add up: `slotsAbove + leads + drawn bands + rows + slotsBelow
 * === slotCount`, so a band entering or leaving the window never makes the content
 * jump.
 */
export declare function groupedWindow<T>(layout: MonoGroupedLayout<T>, rowStart: number, rowEnd: number): MonoGroupedWindow<T>;
/** Every collapsible band path — for collapse-all. */
export declare function collapsiblePaths<T>(rows: ReadonlyArray<T>, fields: ReadonlyArray<MonoGroupedLevel<T>>): string[];
//#endregion