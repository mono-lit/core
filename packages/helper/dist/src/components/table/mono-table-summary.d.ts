import { LitElement } from 'lit';
declare const MonoTableSummary_base: import('../../composables/hybird-prop').Constructor<import('./mono-table-summary-core.js').MonoTableSummaryCoreInterface> & typeof LitElement;
/**
 * Light-DOM `mono-table-summary` (default build, `@mono-lit/helper/ui/table`). An
 * aggregate footer cell — drop it into a `<tfoot>` cell in the column you want
 * summarized and bind the controller with `:data-grid.prop`. The aggregate is
 * configured centrally in `monoDataGrid(data, { summary: [...] })`; this element
 * only names which one to show. Add `mono-table-sticky-foot` to the `<table>` to
 * keep the footer pinned while the body scrolls.
 *
 * Renders into the host (`createRenderRoot`→`this`, styled by the global
 * `dist/ui/index.css`). All logic lives in `MonoTableSummaryCore`; the shadow
 * build shares the mixin. Both register the same tag, so a document loads one.
 */
export declare class MonoTableSummary extends MonoTableSummary_base {
    static styles: import('lit').CSSResult[];
    protected createRenderRoot(): HTMLElement;
}
declare global {
    interface HTMLElementTagNameMap {
        'mono-table-summary': MonoTableSummary;
    }
}
export {};
