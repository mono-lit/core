import { LitElement, TemplateResult } from 'lit';
import { TableThSlotName, TableThIconName } from './mono-table-th-core.js';
declare const MonoTableThShadow_base: import('../../composables/hybird-prop').Constructor<import('./mono-table-th-core.js').MonoTableThCoreInterface> & typeof LitElement;
/**
 * Shadow-DOM `mono-table-th` (SSR build, `@mono-lit/helper/ui/shadow/table`). The
 * header label projects through a native `<slot>`; the sort indicator and the
 * header-filter funnel are single inline SVGs that swap with their state (the
 * global `i-*` utility CSS can't reach a shadow root) — the fluent neutral glyph
 * and the ri up/down arrows, and the mdi outlined/filled funnels, matching the
 * light build's `i-fluent-*` / `i-ri-*` / `i-mdi-filter*` icons. Shares all other
 * logic via `MonoTableThCore`.
 */
export declare class MonoTableThShadow extends MonoTableThShadow_base {
    static styles: import('lit').CSSResult[];
    protected renderSlot(_name: TableThSlotName): TemplateResult;
    protected renderIcon(name: TableThIconName): TemplateResult;
    connectedCallback(): void;
}
export {};
