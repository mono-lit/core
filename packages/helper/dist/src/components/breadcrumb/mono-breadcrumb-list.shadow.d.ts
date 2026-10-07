import { LitElement } from 'lit';
import { BreadcrumbItem } from './breadcrumb-types.js';
declare const MonoBreadcrumbListShadow_base: import('../../composables/hybird-prop').Constructor<import('./breadcrumb-list-core.js').MonoBreadcrumbListCoreInterface> & typeof LitElement;
/**
 * Shadow-DOM `mono-breadcrumb-list` (SSR build, `@mono-lit/helper/ui/shadow/breadcrumb`).
 *
 * Real shadow root + `static styles`, so `@lit-labs/ssr` serializes it to
 * Declarative Shadow DOM. Renders the STANDALONE breadcrumb nav (from `items`,
 * a single `item`, or direct single-row props) inside one shadow root. The
 * child-of-`<mono-breadcrumb>` composition is a light-only feature (cross-element
 * `closest()` can't work under SSR), so this build is standalone only.
 *
 * Icons: `i-…` utility classes can't resolve inside a shadow root, so each item's
 * icon renders as a native `<slot name="icon-<id>">` (see `iconSlot`), and this
 * element creates the matching LIGHT-DOM `<span slot="icon-<id>" class="i-…">`
 * children itself (client-only; empty on the server → the empty `<slot>` matches).
 *
 * Shares all standalone logic with the light build via `MonoBreadcrumbListCore`.
 * Both register `mono-breadcrumb-list`, so a document loads only one build.
 */
export declare class MonoBreadcrumbListShadow extends MonoBreadcrumbListShadow_base {
    static styles: import('lit').CSSResult[];
    /**
     * Number of crumbs the SERVER rendered into the SSR'd shadow root, captured at
     * `connectedCallback` before hydration. `null` when there's no SSR'd shadow
     * root (pure client render). See `mono-breadcrumb.shadow.ts` for the full
     * rationale — `:items.prop` is forwarded to the server but Vue sets the client
     * property late, so we must gate hydration on the EFFECTIVE item count.
     */
    private _ssrItemCount;
    protected _useIconSlots(): boolean;
    /**
     * Cap the HYDRATION render at exactly the server-rendered crumb count so the
     * client's first render reproduces the SSR'd DOM structure; full list after.
     */
    protected _itemsForRender(): BreadcrumbItem[];
    connectedCallback(): void;
    protected firstUpdated(changed: Map<string, unknown>): void;
    protected updated(changed: Map<string, unknown>): void;
    /**
     * Reconcile LIGHT-DOM icon spans (this element's own children) with the
     * effective items. Each becomes a `<span slot="icon-<id>" class="i-…">` that
     * projects into the shadow `<slot name="icon-<id>">`, styled by the page's
     * global UnoCSS. Client-only; icons paint at hydration.
     */
    private _syncLightIcons;
}
export {};
