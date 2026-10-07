import { LitElement, TemplateResult } from 'lit';
import { SortOrder } from './mono-data-grid.js';
import { MonoTableMenuCoreInterface } from './table-menu-core.js';
import { Constructor } from '../../composables/hybird-prop';
/** Slot regions the sort control lays out. */
export type TableSortSlotName = 'label';
/** Per-build icon hook the sort core delegates to. */
export type TableSortIconName = 'chevron';
/** Public surface added by the sort core mixin. */
export declare class MonoTableSortCoreInterface extends MonoTableMenuCoreInterface {
    field: string;
    caption: string;
    disabled: boolean;
    enable: boolean;
    noClear: boolean;
    showIcon: boolean;
    protected renderSlot(name: TableSortSlotName): TemplateResult;
    protected renderIcon(name: TableSortIconName): TemplateResult;
    /** Active sort direction, or null. Read by the builds' `renderIcon`. */
    protected get _current(): SortOrder;
}
/**
 * `MonoTableSortCore` — render-mode-agnostic logic for `mono-table-sort`: a
 * column-header sort control whose arrow cycles a SINGLE key `asc → desc → none`
 * (or `asc ↔ desc` with `no-clear`), while right-clicking the header cell opens
 * the `Sort ›` menu — the only place a multi-key sort can be built. The header
 * label is delegated to a `renderSlot('label')`
 * hook (light: a `[data-mono-slot]` placeholder filled with captured nodes;
 * shadow: native `<slot>`) and the up/down chevrons to `renderIcon('chevron')`
 * (light: `i-mdi-chevron-*`; shadow: inline SVG).
 *
 * `updated()` reflects the sort state onto the parent `<th>`/`<td>` via
 * `closest()` — guarded by `isServer` (lit) so it never runs during SSR.
 */
export declare const MonoTableSortCore: <T extends Constructor<LitElement>>(superClass: T) => Constructor<MonoTableSortCoreInterface> & T;
