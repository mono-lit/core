import { LitElement, TemplateResult } from 'lit';
import { TableSortSlotName, TableSortIconName } from './mono-table-sort-core.js';
declare const MonoTableSortShadow_base: import('../../composables/hybird-prop').Constructor<import('./mono-table-sort-core.js').MonoTableSortCoreInterface> & typeof LitElement;
/**
 * Shadow-DOM `mono-table-sort` (SSR build, `@mono-lit/helper/ui/shadow/table`). The
 * header label projects through a native `<slot>`; the sort indicator is a single
 * inline SVG that swaps with the direction (the global `i-*` utility CSS can't
 * reach a shadow root) — the fluent neutral glyph and the ri up/down arrows,
 * matching the light build. Shares all other logic via `MonoTableSortCore`.
 *
 * DSD inside a `<th>` parses fine — the custom element wraps the label, and the
 * projected slot content is inline flow content.
 */
export declare class MonoTableSortShadow extends MonoTableSortShadow_base {
    static styles: import('lit').CSSResult[];
    protected renderSlot(_name: TableSortSlotName): TemplateResult;
    protected renderIcon(_name: TableSortIconName): TemplateResult;
    connectedCallback(): void;
}
export {};
