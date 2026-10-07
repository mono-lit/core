import { LitElement, TemplateResult } from 'lit';
import { BreadcrumbRenderContext } from './breadcrumb-render.js';
declare const MonoBreadcrumbList_base: import('../../composables/hybird-prop').Constructor<import('./breadcrumb-list-core.js').MonoBreadcrumbListCoreInterface> & typeof LitElement;
/**
 * Light-DOM `mono-breadcrumb-list` (default build, `@mono-lit/helper/ui/breadcrumb`).
 *
 * Two modes:
 *   - Standalone (no parent) — a self-contained breadcrumb nav. All of that logic
 *     lives in `MonoBreadcrumbListCore`.
 *   - Child (inside `<mono-breadcrumb>`) — registers with the parent via
 *     `closest()` and renders BARE items + leading separators (the parent owns
 *     the `<ol>`/`<nav>` chrome). This composition is light-only; the shadow build
 *     (`@mono-lit/helper/ui/shadow/breadcrumb`) supports standalone only.
 */
export declare class MonoBreadcrumbList extends MonoBreadcrumbList_base {
    static styles: import('lit').CSSResult[];
    protected createRenderRoot(): HTMLElement;
    private _parent;
    connectedCallback(): void;
    disconnectedCallback(): void;
    protected _buildContext(): BreadcrumbRenderContext;
    protected render(): TemplateResult;
}
declare global {
    interface HTMLElementTagNameMap {
        'mono-breadcrumb-list': MonoBreadcrumbList;
    }
}
export {};
