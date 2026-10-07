import { LitElement } from 'lit';
import { TabItem } from './tabs-types.js';
declare const MonoTabsShadow_base: import('../../composables/hybird-prop').Constructor<import('./tabs-core.js').MonoTabsCoreInterface> & typeof LitElement;
/**
 * Shadow-DOM `mono-tabs` (the opt-in SSR build, `@mono-lit/helper/ui/shadow/tabs`).
 *
 * Real shadow root + `static styles`, so `@lit-labs/ssr` serializes it to
 * Declarative Shadow DOM and styles are scoped (`mono-tabs`→`:host`). Renders the
 * whole `role="tablist"` from the `items` prop in ONE shadow root; the active tab
 * (`.on` + `aria-selected`) is server-rendered from the reflected `model-value`.
 * Per-tab icons project via native `<slot name="icon-<id>">` (default `mono-empty`
 * → hidden, corrected in `firstUpdated()` by scanning `assignedNodes()`).
 *
 * `:items.prop` is not forwarded to the server and Vue sets the property late, so
 * the defer-hydration poll withholds hydration until the client `items` count
 * matches the server-rendered tab count (avoids "shorter than expected iterable"
 * + double render); `:items="JSON.stringify(...)"` is forwarded as a string and
 * coerced, so the server renders the tabs directly. Shares all logic with the
 * light build via `MonoTabsCore`; both register `mono-tabs`, so a document loads
 * one.
 */
export declare class MonoTabsShadow extends MonoTabsShadow_base {
    static styles: import('lit').CSSResult[];
    /** Tab ids whose `icon-<id>` slot has assigned content (detected post-hydration). */
    private _iconIds;
    /** Server-rendered tab count, captured before the first client render mutates the DSD. */
    private _ssrItemCount;
    protected _useIconSlots(): boolean;
    protected _iconHasContent(id: string): boolean;
    protected _itemsForRender(): TabItem[];
    connectedCallback(): void;
    firstUpdated(changed: Map<string, unknown>): void;
    protected updated(changed: Map<string, unknown>): void;
    /** Populate `_iconIds` from the per-tab icon slots' assigned content. */
    private _scanIconSlots;
}
export {};
