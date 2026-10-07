import { LitElement, TemplateResult } from 'lit';
import { TableSearchIconName } from './mono-table-search-core.js';
declare const MonoTableSearch_base: import('../../composables/hybird-prop').Constructor<import('./mono-table-search-core.js').MonoTableSearchCoreInterface> & typeof LitElement;
/**
 * Light-DOM `mono-table-search` (default build, `@mono-lit/helper/ui/table`).
 * The icons use the global UnoCSS `.mono-icon i-mdi-*`. All other logic lives in
 * `MonoTableSearchCore`; the shadow build shares the mixin.
 *
 * The element renders `mono-input`'s classes, whose rules ship in the same global
 * `dist/ui/index.css` — so no extra stylesheet is needed for the light build.
 */
export declare class MonoTableSearch extends MonoTableSearch_base {
    static styles: import('lit').CSSResult[];
    protected createRenderRoot(): HTMLElement;
    /**
     * Light-DOM slot capture (mirrors `mono-dropdown-table`): a real `<slot>` can't
     * project when the render root IS the host, so the `slot="filter-builder"`
     * child is captured here, lifted out of the host, and re-appended into the
     * `[data-mono-slot]` placeholder the core renders. The node is MOVED (not
     * cloned), so a Vue-authored `<mono-filter-builder>` keeps its reactivity.
     */
    private _slotsCaptured;
    private _filterSlots;
    connectedCallback(): void;
    private _captureFilterSlot;
    protected updated(changed: Map<string, unknown>): void;
    protected renderIcon(name: TableSearchIconName): TemplateResult;
}
declare global {
    interface HTMLElementTagNameMap {
        'mono-table-search': MonoTableSearch;
    }
}
export {};
