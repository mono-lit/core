import { LitElement, TemplateResult } from 'lit';
declare const MonoTableEmptyShadow_base: import('../../composables/hybird-prop').Constructor<import('./mono-table-empty-core.js').MonoTableEmptyCoreInterface> & typeof LitElement;
/**
 * Shadow-DOM `mono-shadow-table-empty` (SSR build, `@mono-lit/helper/ui/shadow/table`).
 *
 * Renders the message into a real shadow root; the `host: 'mono-table-empty'`
 * rewrite turns the overlay's element-selector rules into `:host` so the shadow
 * sheet self-contains its styling. Emptiness is client-only state, so SSR emits an
 * inert (hidden) host. Shares all logic via `MonoTableEmptyCore`.
 *
 * Two things this build has to do differently:
 *
 * - **`slot="body"` is a native `<slot>`**, not a captured region, and its
 *   presence is read from `assignedNodes()` (DSD assigns at parse time, so
 *   `slotchange` does not fire on upgrade — `firstUpdated` has to look once).
 * - **An `i-*` icon class cannot paint here.** UnoCSS generates those as a mask
 *   on the PAGE stylesheet, which does not cross the shadow boundary, so the
 *   span would render as a blank box. `adoptIconStyles` copies the page's
 *   generated icon rules into a sheet this root adopts. An emoji or plain-text
 *   icon needs none of that — it is just text — which is exactly why the core's
 *   two-shape branch exists.
 */
export declare class MonoTableEmptyShadow extends MonoTableEmptyShadow_base {
    static styles: import('lit').CSSResult[];
    connectedCallback(): void;
    protected firstUpdated(changed: Map<string, unknown>): void;
    protected updated(changed: Map<string, unknown>): void;
    private _maybeAdoptIcons;
    private _syncBodySlot;
    /**
     * The body region as a real `<slot>`.
     *
     * `data-empty` collapses it while the props are in play rather than dropping it
     * — a `<slot>` that is not in the tree has no assigned nodes, so removing it
     * would make `_syncBodySlot` permanently report "no body" and the override
     * could never turn on.
     */
    protected _renderBodySlot(): TemplateResult;
}
export {};
