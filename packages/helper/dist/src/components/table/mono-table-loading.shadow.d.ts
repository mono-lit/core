import { LitElement } from 'lit';
declare const MonoTableLoadingShadow_base: import('../../composables/hybird-prop').Constructor<import('./mono-table-loading-core.js').MonoTableLoadingCoreInterface> & typeof LitElement;
/**
 * Shadow-DOM `mono-shadow-table-loading` (SSR build, `@mono-lit/helper/ui/shadow/table`).
 * Renders the spinner into a real shadow root; the `host: 'mono-table-loading'`
 * rewrite turns the overlay's element-selector rules into `:host` so the shadow
 * sheet self-contains the overlay styling. The `loading` state is client-only, so
 * SSR emits an inert (hidden) host. Shares all logic via `MonoTableLoadingCore`.
 */
export declare class MonoTableLoadingShadow extends MonoTableLoadingShadow_base {
    static styles: import('lit').CSSResult[];
    connectedCallback(): void;
}
export {};
