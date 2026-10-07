import { LitElement } from 'lit';
import { BreadcrumbItem } from './breadcrumb-types.js';
declare const MonoBreadcrumbShadow_base: import('../../composables/hybird-prop').Constructor<import('./breadcrumb-core.js').MonoBreadcrumbCoreInterface> & typeof LitElement;
/**
 * Shadow-DOM `mono-breadcrumb` (SSR build, `@mono-lit/helper/ui/shadow/breadcrumb`).
 *
 * Real shadow root + `static styles`, so `@lit-labs/ssr` serializes it to
 * Declarative Shadow DOM. Renders the WHOLE breadcrumb list from the `items`
 * prop inside this single shadow root — so every breadcrumb CSS rule applies and
 * the current crumb is server-rendered. The declarative `<mono-breadcrumb-list>`
 * composition is a light-only feature (SSR consumers drive it via `items`).
 *
 * Icons: `i-…` utility classes can't resolve inside a shadow root, so each item's
 * icon is rendered as a native `<slot name="icon-<id>">` (see `renderBreadcrumbIcon`
 * + `iconSlot`), and this element creates the matching LIGHT-DOM
 * `<span slot="icon-<id>" class="i-…">` children itself in `updated()`. Those light
 * spans are styled by the page's GLOBAL UnoCSS, so real glyphs paint client-side
 * after hydration (empty on the server → the empty `<slot>` matches → no mismatch).
 * A user-provided `<… slot="icon-<id>">` light child projects through the same slot.
 *
 * Shares all logic with the light build via `MonoBreadcrumbCore`. Both register
 * `mono-breadcrumb`, so a document loads only one build.
 */
export declare class MonoBreadcrumbShadow extends MonoBreadcrumbShadow_base {
    static styles: import('lit').CSSResult[];
    /**
     * Number of crumbs the SERVER actually rendered into the SSR'd shadow root,
     * captured at `connectedCallback` before hydration replaces the DOM. `null`
     * when there's no SSR'd shadow root (pure client render).
     *
     * @lit-labs/ssr does NOT forward `.prop` array bindings to the server, so for
     * `:items.prop="arr"` the server renders 0 crumbs while the client `items` has
     * N. Gating the first (hydration) render on this count makes the client's
     * first render match the server exactly → no "shorter than expected iterable"
     * and no double render. `:items="JSON.stringify(arr)"` forwards the string, so
     * the server renders N and this is N → unchanged.
     */
    private _ssrItemCount;
    protected _useIconSlots(): boolean;
    /**
     * Cap the HYDRATION render at exactly the server-rendered crumb count so the
     * client's first render reproduces the SSR'd DOM structure. After hydration
     * (`hasUpdated`) render the full list. Safety net for the rare case where the
     * client `items` ends up longer than what the server emitted. On the server,
     * always render the real `items`.
     */
    protected _itemsForRender(): BreadcrumbItem[];
    connectedCallback(): void;
    protected firstUpdated(changed: Map<string, unknown>): void;
    protected updated(changed: Map<string, unknown>): void;
    /**
     * Register the consumer's own `slot="icon-<id>"` light children.
     *
     * `renderBreadcrumbIcon` only emits the wrapper (and therefore the `<slot>`) when
     * the item has an `icon` OR `getSlotIconNodes(id)` reports something. That map is
     * filled by the LIGHT build's capture pass, which never runs here — so a
     * user-slotted `<svg slot="icon-home">` produced no wrapper, no slot, and no icon
     * at all. Register them before render so the slot exists for them to project into.
     *
     * Must run in `willUpdate`, not `updated`: by `updated` the render that needed the
     * information has already happened.
     */
    protected willUpdate(changed: Map<string, unknown>): void;
    private _captureUserIconSlots;
    /**
     * Reconcile LIGHT-DOM icon spans (this element's own children) with `items`.
     * Each becomes a `<span slot="icon-<id>" class="mono-breadcrumb-iconify i-…">`
     * that projects into the shadow `<slot name="icon-<id>">` and is styled by the
     * page's global UnoCSS. Client-only; icons paint at hydration.
     */
    private _syncLightIcons;
}
export {};
