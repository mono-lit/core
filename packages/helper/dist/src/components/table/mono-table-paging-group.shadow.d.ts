import { LitElement } from 'lit';
declare const MonoTablePagingGroupShadow_base: import('../../composables/hybird-prop').Constructor<import('./mono-table-paging-group-core.js').MonoTablePagingGroupCoreInterface> & typeof LitElement;
/**
 * Shadow-DOM `mono-table-paging-group` (SSR build, `@mono-lit/helper/ui/shadow/table`).
 * Shares all logic with the light build via `MonoTablePagingGroupCore`. Renders
 * `nothing` server-side (no controller), so its host SSRs empty and only
 * materializes after hydration binds the controller + group.
 */
export declare class MonoTablePagingGroupShadow extends MonoTablePagingGroupShadow_base {
    static styles: import('lit').CSSResult[];
    connectedCallback(): void;
}
export {};
