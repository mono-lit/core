import { LitElement } from 'lit';
declare const MonoTablePagingGroup_base: import('../../composables/hybird-prop').Constructor<import('./mono-table-paging-group-core.js').MonoTablePagingGroupCoreInterface> & typeof LitElement;
/**
 * Light-DOM `mono-table-paging-group` (default build, `@mono-lit/helper/ui/table`).
 * Paginates the rows inside a single group. All logic lives in
 * `MonoTablePagingGroupCore`; the shadow build shares the mixin.
 *
 * @example
 * <mono-table-paging-group :data-grid.prop="table" :group.prop="node" page-size="5" />
 */
export declare class MonoTablePagingGroup extends MonoTablePagingGroup_base {
    static styles: import('lit').CSSResult[];
    protected createRenderRoot(): HTMLElement;
}
declare global {
    interface HTMLElementTagNameMap {
        'mono-table-paging-group': MonoTablePagingGroup;
    }
}
export {};
