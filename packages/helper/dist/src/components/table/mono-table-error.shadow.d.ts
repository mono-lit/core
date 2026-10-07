import { LitElement, TemplateResult } from 'lit';
declare const MonoTableErrorShadow_base: import('../../composables/hybird-prop').Constructor<import('./mono-table-error-core.js').MonoTableErrorCoreInterface> & typeof LitElement;
/**
 * Shadow-DOM `mono-shadow-table-error` (SSR build, `@mono-lit/helper/ui/shadow/table`).
 *
 * Renders the bar into a real shadow root; the `host: 'mono-table-error'` rewrite
 * turns the element-selector rules into `:host` so the shadow sheet self-contains
 * its styling. A load error is client-only state, so SSR emits an inert host.
 * Shares all logic via `MonoTableErrorCore`.
 */
export declare class MonoTableErrorShadow extends MonoTableErrorShadow_base {
    static styles: import('lit').CSSResult[];
    connectedCallback(): void;
    /**
     * Inline SVG — the global `.mono-icon` / `i-mdi-close` UnoCSS rule cannot reach
     * a shadow root, so the class the light build uses would paint a blank box
     * here. Same glyph, same split as `mono-modal` / `mono-drawer`.
     */
    protected renderIcon(name: 'close' | 'refresh'): TemplateResult;
}
export {};
