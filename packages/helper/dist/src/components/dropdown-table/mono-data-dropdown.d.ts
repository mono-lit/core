import { MonoTableController, MonoGridSource, MonoDataGridOptions, MonoTableProps, MonoCheckLimits } from '../table/mono-data-grid.js';
import { MonoEventProps } from '../../composables/element-props';
import { DropdownTableEvents } from './dropdown-table-types';
/** One resolved selection (key + display text + the row it came from). */
export interface MonoDropdownItem<T = any> {
    key: unknown;
    text: string;
    data: T | undefined;
}
/**
 * Central props for a dropdown-table, in the same shape as
 * `monoDataGrid({ props })`.
 *
 * Everything except `dropdownTable` targets the PANEL and is forwarded verbatim
 * to the wrapped grid, so `th` / `search` / `paging` behave exactly as they do
 * on a plain table. `dropdownTable` is the extra slot: the closed field itself.
 */
export interface MonoDropdownProps extends MonoTableProps {
    /**
     * Props for the `<mono-dropdown-table>` field element, plus its events as
     * `on<Event>` keys (`onChange`, `onOpen`, `onClose`, …) attached as listeners.
     */
    dropdownTable?: Record<string, unknown> & MonoEventProps<DropdownTableEvents>;
}
export interface MonoDataDropdownOptions extends MonoDataGridOptions {
    /** Row key field (default `'Id'`). Also forwarded to the inner grid. */
    keyExpr?: string;
    /** Display text — a field name or a `(row) => string`. Defaults to `keyExpr`. */
    displayExpr?: string | ((row: any) => string);
    /** Multi-select (array value) vs single (scalar). */
    multiple?: boolean;
    /**
     * Most rows the user can select in multi mode (unset = unlimited). Enforced by
     * the grid's check store, so a row click, the keyboard, `<mono-table-checkbox>`
     * (row and `type="all"`) and `selectAll()` all stop at it — a pick past the cap
     * is rejected and the checkbox un-ticks itself. `setValue()` is not capped.
     * The element's own `max` / `chip.max`, when set, override this.
     */
    max?: number;
    /**
     * Fewest rows the user can leave selected (unset = 0). Un-ticking at the floor
     * is rejected; `clear()` keeps the first `min`. Overridden by the element's
     * `min` / `chip.min` when set.
     */
    min?: number;
    /** Central element props — the grid slots plus `dropdownTable`. */
    props?: MonoDropdownProps;
    /**
     * A ref the dropdown writes a `props()` snapshot into on every change. The
     * DROPDOWN owns this, not the inner grid — the snapshot has to carry
     * `dropdownTable` alongside the grid slots, so a template can drive both the
     * field and its header loop from one object.
     */
    state?: {
        value: MonoDropdownProps | undefined;
    };
}
/**
 * The dropdown controller — wraps a {@link monoDataGrid} (`.grid`, bind the panel's
 * `mono-table-*` to it) and adds selection, `value`, and key→label display
 * resolution. Mutated in place; read after `subscribe` fires (coalesced).
 */
export interface MonoDropdownController<T = any> {
    /** The inner table controller. Bind `mono-table-*` with `:control-table.prop="dd.table"`
     *  (alias `:data-grid.prop="dd.grid"`). */
    readonly grid: MonoTableController<T>;
    /** Alias of {@link grid} — the inner `controlMonoTable`. Preferred in new code. */
    readonly table: MonoTableController<T>;
    /**
     * Central element props — the grid's slots plus `dropdownTable` (the field
     * itself). Mirrors `table.props()`; a stable read, mutated in place.
     */
    props(): MonoDropdownProps;
    readonly multiple: boolean;
    /** Selected value: scalar (single) or array (multi). Setting resolves display. */
    value: unknown;
    /** Whether the dropdown panel is open. */
    open: boolean;
    /** Assignable sink fired on INTERNAL value changes (toggle/remove/clear), not `setValue`. */
    onValueChange: ((value: unknown) => void) | null;
    isSelected(key: unknown): boolean;
    /**
     * The selection limits in force — the element's `max` / `min` when it set
     * them, else the controller options'. Read `atMax` / `atMin` from
     * `table.check()` for the live state.
     */
    limits(): MonoCheckLimits;
    /**
     * The element pushes its effective `max` / `min` here. `undefined` for a key
     * means "the element has no opinion" and the controller option applies again.
     */
    setLimits(limits: MonoCheckLimits): void;
    toggleRow(key: unknown, rowData?: T): void;
    removeKey(key: unknown): void;
    clear(): void;
    /**
     * Select every row the source returns for the CURRENT filter + search — the
     * dropdown's counterpart to the table's `<mono-table-checkbox type="all">`.
     * Drains through `table.getData()` and primes the display cache from the drained
     * rows, so it costs the drain and no resolution requests. Fills only the room
     * `max` leaves.
     * No-op unless `multiple`, and re-entrant calls are ignored while one is running.
     * `clear()` is the inverse.
     *
     * Read {@link selectAllPending} to show a loading state while it runs.
     */
    selectAll(): Promise<void>;
    /**
     * Whether a {@link selectAll} drain is in flight — the dropdown's equivalent of
     * the table's `check().pending`. Flips true (with a notify) BEFORE the first
     * request, so a subscriber can render the spinner before the network blocks.
     *
     * Unlike the table, a repeat `selectAll()` re-drains: the table memoises its last
     * drain, but that memo is invalidated against grid internals (row-set version,
     * search terms) this controller does not own, and a stale selection is a worse
     * failure than a redundant fetch.
     */
    readonly selectAllPending: boolean;
    /** The selected items (ordered), resolved to `{ key, text, data }`. */
    selectedItems(): Array<MonoDropdownItem<T>>;
    /** Joined display text of the current selection. */
    displayText(): string;
    /**
     * Replace the selection. Pass `rows` when you already hold the matching row
     * objects (a drain, a paged read) to seed the display cache and skip the
     * `in`-filter round trips `resolveSelected` would otherwise make.
     *
     * Does NOT emit — this is the inbound path the element pushes `modelValue` down.
     * Use {@link selectAll} or {@link toggleRow} for a change that should notify.
     */
    setValue(next: unknown, rows?: readonly T[]): void;
    setOpen(next: boolean): void;
    /** Fetch + cache display text for any selected keys not yet resolved. */
    resolveSelected(): Promise<void>;
    subscribe(cb: () => void): () => void;
    bind(source: MonoGridSource<T> | T[] | null): void;
    dispose(): void;
}
/**
 * `monoDataDropdown` — the composable that owns all the grid-dropdown "magic":
 * selection (single/multi), the bound `value`, and resolving a selected KEY to its
 * display TEXT. The options table is the reused headless {@link monoDataGrid}
 * exposed as `.grid`, so search / sort / paging / header-filter all work by binding
 * the panel's `mono-table-*` helpers to it. Pair with `<mono-dropdown-table>`.
 *
 * Display resolution uses `store.load({ filter })` ONLY — never `byKey` (which
 * caches per key and would hide updated rows) — with an `in`-filter (+ OR-chain
 * fallback) for a remote source, or the array source's `data()` for a local one.
 */
/** Renamed "control" alias of {@link monoDataDropdown} (no breaking change — both work). */
export { monoDataDropdown as controlMonoDataDropdown };
export declare function monoDataDropdown<T = any>(source?: MonoGridSource<T> | T[] | null, opts?: MonoDataDropdownOptions): MonoDropdownController<T>;
