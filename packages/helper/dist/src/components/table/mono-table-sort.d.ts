import { LitElement, TemplateResult } from 'lit';
import { TableSortSlotName, TableSortIconName } from './mono-table-sort-core.js';
declare const MonoTableSort_base: import('../../composables/hybird-prop').Constructor<import('./mono-table-sort-core.js').MonoTableSortCoreInterface> & typeof LitElement;
/**
 * Light-DOM `mono-table-sort` (default build, `@mono-lit/helper/ui/table`). A sort
 * control for a column header — place it inside a native `<th>`.
 *
 * Light-DOM Lit replaces the host's children on render, so the user's label
 * nodes are captured once in `connectedCallback` and re-appended into the
 * `[data-mono-slot="label"]` placeholder after each render (reusing the same
 * nodes instead of re-rendering the text, which would otherwise duplicate it).
 * The sort indicator is a single global UnoCSS icon that swaps with the direction
 * (neutral `i-fluent-arrow-sort-16-filled` → `i-ri-arrow-up-long-fill` /
 * `i-ri-arrow-down-long-fill`). All other logic lives in `MonoTableSortCore`; the
 * shadow build shares the mixin.
 *
 * @example
 * <th><mono-table-sort :data-grid.prop="table" field="Nama">Name</mono-table-sort></th>
 */
export declare class MonoTableSort extends MonoTableSort_base {
    static styles: import('lit').CSSResult[];
    protected createRenderRoot(): HTMLElement;
    /** The captured label nodes (the element's original light-DOM children). */
    private _buckets;
    private _slotsCaptured;
    connectedCallback(): void;
    protected updated(changed: Map<string, unknown>): void;
    protected renderSlot(_name: TableSortSlotName): TemplateResult;
    protected renderIcon(_name: TableSortIconName): TemplateResult;
    private _captureSlots;
    private _placeSlot;
}
declare global {
    interface HTMLElementTagNameMap {
        'mono-table-sort': MonoTableSort;
    }
}
export {};
