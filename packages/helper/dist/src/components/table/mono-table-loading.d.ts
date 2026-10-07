import { LitElement } from 'lit';
declare const MonoTableLoading_base: import('../../composables/hybird-prop').Constructor<import('./mono-table-loading-core.js').MonoTableLoadingCoreInterface> & typeof LitElement;
/**
 * Light-DOM `mono-table-loading` (default build, `@mono-lit/helper/ui/table`). A
 * drop-in loading overlay — place it inside your `<table>` (or `.mono-table-scroll`)
 * and bind the controller with `:data-grid.prop`; it auto-shows a spinner over
 * the rows region whenever the controller is fetching and freezes the grid height
 * so it can't collapse mid-query. Renders into the host
 * (`createRenderRoot`→`this`, styled by the global `dist/ui/index.css`); all logic
 * lives in `MonoTableLoadingCore`, shared with the shadow build.
 *
 * Place it in the `.mono-table-scroll` wrapper, or INSIDE the `<table>` wrapped in
 * a row section — drop it straight into `<tbody>`.
 *
 * `<table>`'s content model permits only `caption`/`colgroup`/`thead`/`tbody`/`tfoot`,
 * and a row section permits only `<tr>`, so a bare custom-element child of either is
 * invalid: Vue's compiler warns, and the HTML parser foster-parents it out of the
 * table on hydration. The element handles that itself — on connect it wraps itself in
 * a zero-height `<tr class="mono-table-loading-row" mono-loading-row><td colspan>`, so the markup you
 * write stays one line and the overlay stays inside the table.
 *
 * It covers the `<table>`, NOT the scroll wrapper, and that is what makes it survive
 * scrolling: an absolutely positioned descendant of a scroll container scrolls WITH
 * the content, so covering the wrapper would pin the dim to the scroll origin at the
 * scrollport's size and let rows show through beside it. The spinner is
 * `position: sticky`, so it stays in view on a table far wider or longer than its
 * region.
 *
 * A `<caption>` or a `<td>` you wrote yourself is left alone — both are valid hosts,
 * so existing markup keeps working unchanged.
 *
 * @example
 * <div class="mono-table-scroll" mono-table-scroll>
 *   <table class="mono-table" mono-table>
 *     <caption><mono-table-loading :data-grid.prop="table" /></caption>
 *     <thead>…</thead>
 *     <tbody>…rows…</tbody>
 *   </table>
 * </div>
 */
export declare class MonoTableLoading extends MonoTableLoading_base {
    static styles: import('lit').CSSResult[];
    protected createRenderRoot(): HTMLElement;
}
declare global {
    interface HTMLElementTagNameMap {
        'mono-table-loading': MonoTableLoading;
    }
}
export {};
