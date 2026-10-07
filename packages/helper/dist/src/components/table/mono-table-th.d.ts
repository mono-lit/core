import { LitElement, TemplateResult } from 'lit';
import { TableThSlotName, TableThIconName } from './mono-table-th-core.js';
declare const MonoTableTh_base: import('../../composables/hybird-prop').Constructor<import('./mono-table-th-core.js').MonoTableThCoreInterface> & typeof LitElement;
/**
 * Light-DOM `mono-table-th` (default build, `@mono-lit/helper/ui/table`). The unified
 * column-header cell — place it inside a native `<th>`. Declares the column's
 * `field`/`caption`, folds sorting into `:sort.prop="{ order?, noClear?, disabled? }"`,
 * and marks the column editable with `:editable.prop="{ type, editor }"`. The
 * standalone `mono-table-sort` remains supported.
 *
 * Light-DOM Lit replaces the host's children on render, so the user's label nodes
 * are captured once in `connectedCallback` and re-appended into the
 * `[data-mono-slot="label"]` placeholder after each render. The sort indicator is
 * a single global UnoCSS icon that swaps with the direction (neutral
 * `i-fluent-arrow-sort-16-filled` → `i-ri-arrow-up-long-fill` /
 * `i-ri-arrow-down-long-fill`); all other logic lives in `MonoTableThCore`.
 *
 * @example
 * <th><mono-table-th :data-grid.prop="table" field="Nama" caption="Name"
 *      :sort.prop="{ order: 'asc' }"
 *      :editable.prop="{ type: 'string', editor: 'input-text' }">Name</mono-table-th></th>
 */
export declare class MonoTableTh extends MonoTableTh_base {
    static styles: import('lit').CSSResult[];
    protected createRenderRoot(): HTMLElement;
    /** The captured label nodes (the element's original light-DOM children). */
    private _buckets;
    private _slotsCaptured;
    connectedCallback(): void;
    protected updated(changed: Map<string, unknown>): void;
    protected renderSlot(_name: TableThSlotName): TemplateResult;
    protected renderIcon(name: TableThIconName): TemplateResult;
    private _captureSlots;
    private _placeSlot;
}
declare global {
    interface HTMLElementTagNameMap {
        'mono-table-th': MonoTableTh;
    }
}
export {};
