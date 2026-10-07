import { LitElement } from 'lit';
declare const MonoTablePageSize_base: import('../../composables/hybird-prop').Constructor<import('./mono-table-page-size-core.js').MonoTablePageSizeCoreInterface> & typeof LitElement;
/**
 * Light-DOM `mono-table-page-size` (default build, `@mono-lit/helper/ui/table`).
 * All logic lives in `MonoTablePageSizeCore`; the shadow build shares the mixin.
 */
export declare class MonoTablePageSize extends MonoTablePageSize_base {
    static styles: import('lit').CSSResult[];
    protected createRenderRoot(): HTMLElement;
}
declare global {
    interface HTMLElementTagNameMap {
        'mono-table-page-size': MonoTablePageSize;
    }
}
export {};
