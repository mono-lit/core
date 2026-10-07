import { LitElement } from 'lit';
declare const MonoDropdownTable_base: import('../../composables/hybird-prop').Constructor<import('./dropdown-table-core.js').MonoDropdownTableCoreInterface> & typeof LitElement;
/**
 * Light-DOM `mono-dropdown-table` (default build, `@mono-lit/helper/ui/dropdown-table`).
 * A dropdown whose panel holds a **native `<table>`** for picking row(s), driven by
 * a {@link monoDataDropdown} controller bound with `:data-dropdown.prop`.
 *
 * Light-DOM slot strategy (mirrors `mono-dropdown`): the consumer's children are
 * captured by their `slot` attribute in `connectedCallback` (`search` / `footer` /
 * default → the table body), the template renders empty `[data-mono-slot]` targets,
 * and the captured nodes are re-appended in `updated()` — falling back to the popup
 * portal once the panel is relocated to `<body>`. The captured nodes are MOVED (not
 * cloned), so a Vue-authored `<table>` keeps its reactivity.
 *
 * @example
 * <mono-dropdown-table :data-dropdown.prop="dd" placeholder="Pick a department" clearable>
 *   <mono-table-search :data-grid.prop="dd.grid" slot="search" />
 *   <table mono-table>
 *     <thead>…mono-table-th…</thead>
 *     <tbody>
 *       <tr v-for="r in rows" :key="r.Id" :data-row-key="String(r.Id)">
 *         <td>{{ r.Code }}</td><td>{{ r.Nama }}</td>
 *       </tr>
 *     </tbody>
 *   </table>
 *   <mono-table-paging :data-grid.prop="dd.grid" slot="footer" />
 * </mono-dropdown-table>
 */
export declare class MonoDropdownTable extends MonoDropdownTable_base {
    static styles: import('lit').CSSResult[];
    protected createRenderRoot(): HTMLElement;
    private _slotsCaptured;
    private _slotSearch;
    private _slotBody;
    private _slotFooter;
    connectedCallback(): void;
    protected updated(changed: Map<string, unknown>): void;
    private _captureSlots;
    private _placeSlot;
}
declare global {
    interface HTMLElementTagNameMap {
        'mono-dropdown-table': MonoDropdownTable;
    }
}
export {};
