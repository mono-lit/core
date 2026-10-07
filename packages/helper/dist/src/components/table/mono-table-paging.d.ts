import { LitElement } from 'lit';
declare const MonoTablePaging_base: import('../../composables/hybird-prop').Constructor<import('./mono-table-paging-core.js').MonoTablePagingCoreInterface> & typeof LitElement;
/**
 * Light-DOM `mono-table-paging` (default build, `@mono-lit/helper/ui/table`).
 * All logic lives in `MonoTablePagingCore`; the shadow build shares the mixin.
 */
export declare class MonoTablePaging extends MonoTablePaging_base {
    static styles: import('lit').CSSResult[];
    protected createRenderRoot(): HTMLElement;
}
declare global {
    interface HTMLElementTagNameMap {
        'mono-table-paging': MonoTablePaging;
    }
}
export {};
