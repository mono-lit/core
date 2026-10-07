import { LitElement, TemplateResult } from 'lit';
import { MonoColumnSort, MonoDateFilter, MonoEditableTrigger, MonoHeaderFilter, SortOrder } from './mono-data-grid.js';
import { MonoTableMenuCoreInterface } from './table-menu-core.js';
import { Constructor } from '../../composables/hybird-prop';
/** Slot regions the header cell lays out. */
export type TableThSlotName = 'label';
/** Per-build icon hook the header core delegates to. */
export type TableThIconName = 'chevron' | 'funnel';
/**
 * Horizontal alignment for a column's HEADER cell.
 *
 * Numeric columns are the reason this exists: their bodies are right-aligned by the consumer
 * while the caption stayed left, so every money column read as misaligned.
 */
export type TableThAlign = 'left' | 'center' | 'right';
/** Public surface added by the header-cell core mixin. */
export declare class MonoTableThCoreInterface extends MonoTableMenuCoreInterface {
    field: string;
    caption: string;
    sort?: boolean | MonoColumnSort;
    editable: boolean;
    editableTrigger?: MonoEditableTrigger;
    required: boolean;
    headerFilter: boolean | MonoHeaderFilter;
    dateFilter: boolean | MonoDateFilter;
    align?: TableThAlign;
    width?: string | number;
    height?: string | number;
    protected renderSlot(name: TableThSlotName): TemplateResult;
    protected renderIcon(name: TableThIconName): TemplateResult;
    /** Active sort direction for this column, or null. Read by the builds' `renderIcon`. */
    protected get _current(): SortOrder;
    /** Whether this column has an active header filter. Read by the builds' `renderIcon`. */
    protected get _filtered(): boolean;
}
/**
 * `MonoTableThCore` — render-mode-agnostic logic for `mono-table-th`, the unified
 * column-header cell. It declares a column's `field`/`caption`, folds the sort
 * behavior into a single `:sort.prop` object (`{ order?, noClear?, disabled? }`),
 * marks a column editable (`editable`), and — with `header-filter` — adds a
 * DevExtreme-style **header filter**: a funnel icon (or the header's right-click
 * menu → "Header Filter") opens a panel of the column's distinct values (fetched
 * via the controller's `distinctValues`, i.e. an OData `$apply=groupby`) with
 * checkboxes; checking some + Apply calls `dataGrid.setColumnFilter(field, values)`.
 *
 * Gestures are fixed, not configurable, and both features split the same way: the
 * ICON (sort arrow / filter funnel) acts on ONE column, replacing whatever else
 * was sorted or filtered, while RIGHT-CLICK always opens the menu, whose `Sort ›`
 * / `Header Filter ›` rows combine columns. One carry-over: once the menu has
 * started a combination and something is still sorted / filtered, the icons
 * combine too — the grid remembers the gesture (`sortCombining` /
 * `columnFilterCombining`) until the last key / filter is gone.
 *
 * The standalone `mono-table-sort` element is unchanged and still supported.
 */
export declare const MonoTableThCore: <T extends Constructor<LitElement>>(superClass: T) => Constructor<MonoTableThCoreInterface> & T;
