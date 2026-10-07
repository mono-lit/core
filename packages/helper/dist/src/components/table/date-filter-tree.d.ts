import { MonoColumnValue } from './mono-data-grid.js';
/** The levels of the tree, outermost first. */
export type MonoDateLevel = 'year' | 'month' | 'day' | 'hour' | 'minute' | 'second';
export declare const DATE_LEVELS: readonly MonoDateLevel[];
/**
 * A half-open period, `from` inclusive, `to` exclusive — the value shape a date
 * filter stores on the column (`table.columnFilter(field)` returns these).
 */
export interface MonoDateRange {
    from: Date;
    to: Date;
}
/** A `{ from, to }` pair of Dates (or ISO strings, which `setColumnFilter` also accepts). */
export declare function isDateRange(v: unknown): v is MonoDateRange | {
    from: string;
    to: string;
};
export interface DateNode {
    /** Unique within the tree: the parts joined — `2026`, `2026-3`, `2026-3-5-13`… or `blank`. */
    key: string;
    level: MonoDateLevel;
    /** `[year, month(1-12), day, hour, minute, second]` down to this level. */
    parts: number[];
    label: string;
    /** Rows inside this period (summed from the timestamps it contains). */
    count: number;
    /** The period, `[from, to)`. `null` on the blanks node. */
    from: Date | null;
    to: Date | null;
    children: DateNode[];
}
export interface DateTreeOptions {
    /** Deepest level built. Default `'month'`. */
    depth?: MonoDateLevel;
    /** Read the parts in UTC instead of local time. Default `false`. */
    utc?: boolean;
    /** BCP-47 tag for the month / weekday names. Default: the browser's. */
    locale?: string;
}
export declare const BLANK_KEY = "blank";
/**
 * A column value as a Date, or `null` for a blank / unparsable one. Accepts a
 * `Date`, a number (epoch ms), an ISO string, and a bare `YYYY-MM-DD` — the
 * last is parsed as a LOCAL date on purpose (`new Date('2026-03-05')` would be
 * UTC midnight and shift a day west of Greenwich).
 */
export declare function parseDateValue(v: unknown): Date | null;
/** `[year, month(1-12), day, hour, minute, second]` of a Date, local or UTC. */
export declare function datePartsOf(d: Date, utc?: boolean): number[];
/** The period `[from, to)` of a node at `level` with these parts. */
export declare function periodOf(parts: number[], level: MonoDateLevel, utc?: boolean): MonoDateRange;
/**
 * Fold distinct timestamps into the tree. Only periods that occur are built,
 * counts are summed up the branches, siblings are in chronological order, and
 * a blank value becomes one `(Blanks)` node at the top (never expandable).
 */
export declare function buildDateTree(values: readonly MonoColumnValue[], options?: DateTreeOptions): DateNode[];
export type CheckState = 'on' | 'off' | 'mixed';
/**
 * A node's tick state from the set of ticked keys. A key in the set means the
 * WHOLE node is ticked (so every descendant is on too); otherwise the children
 * decide — all on → on, none → off, some (or a partly-ticked child) → mixed.
 *
 * Pass `roots` to have a ticked ANCESTOR count (the node is then on) — the
 * renderer walks top-down and passes `inheritedOn` instead, which is the same
 * answer without a path lookup per row.
 */
export declare function checkState(node: DateNode, checked: ReadonlySet<string>, roots?: readonly DateNode[], inheritedOn?: boolean): CheckState;
/**
 * Tick or untick a node: the node's own key goes in (and every descendant key
 * comes out — the node covers them) or the node and every descendant come out.
 * Ticking a child of a fully-ticked parent first expands the parent's tick to its
 * siblings, so unticking one day of a ticked month leaves the other days ticked.
 */
export declare function setChecked(node: DateNode, on: boolean, checked: ReadonlySet<string>, roots: readonly DateNode[]): Set<string>;
/** Tick everything (every root) or nothing. */
export declare function setAllChecked(roots: readonly DateNode[], on: boolean): Set<string>;
/**
 * The ticked periods as filter values — one `{ from, to }` per fully-ticked node,
 * walking down only where a node is partly ticked. `(Blanks)` ticked adds a
 * `null` value (the column filter's "is blank"), matching what the plain header
 * filter sends for a blank.
 */
export declare function minimize(roots: readonly DateNode[], checked: ReadonlySet<string>): Array<MonoDateRange | null>;
/**
 * The tick set that reproduces an applied filter (`table.columnFilter(field)`):
 * a node is ticked when one of the ranges covers its whole period; a blank value
 * ticks `(Blanks)`. A range that only partly covers a node ticks the children it
 * covers instead.
 */
export declare function seedFromRanges(roots: readonly DateNode[], values: readonly unknown[]): Set<string>;
/** Whether a Date falls in `[from, to)`. */
export declare function inRange(d: Date, r: MonoDateRange): boolean;
