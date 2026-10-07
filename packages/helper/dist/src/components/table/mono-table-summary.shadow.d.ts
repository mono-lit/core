import { LitElement } from 'lit';
declare const MonoTableSummaryShadow_base: import('../../composables/hybird-prop').Constructor<import('./mono-table-summary-core.js').MonoTableSummaryCoreInterface> & typeof LitElement;
/**
 * Shadow-DOM `mono-shadow-table-summary` (the opt-in SSR build,
 * `@mono-lit/helper/ui/shadow/table`). Renders into a real shadow root so
 * `@lit-labs/ssr` can serialize it to Declarative Shadow DOM. Shares all logic
 * with the light build via `MonoTableSummaryCore`. Registers the `mono-shadow-*`
 * tag — DISTINCT from the light `<mono-table-summary>` — so both can coexist.
 */
export declare class MonoTableSummaryShadow extends MonoTableSummaryShadow_base {
    static styles: import('lit').CSSResult[];
    connectedCallback(): void;
}
export {};
