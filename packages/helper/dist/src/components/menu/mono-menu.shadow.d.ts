import { LitElement, TemplateResult } from 'lit';
declare const MonoMenuShadow_base: import('../../composables/hybird-prop').Constructor<import('./menu-core.js').MonoMenuCoreInterface> & typeof LitElement;
/**
 * Shadow-DOM `mono-menu` (SSR build, `@mono-lit/helper/ui/shadow/menu`).
 *
 * Real shadow root + `static styles`, so `@lit-labs/ssr` serializes it to
 * Declarative Shadow DOM. Renders the WHOLE tree (items + nested groups) from
 * the `items` prop inside this single shadow root — so every menu CSS rule
 * applies, and the active item is server-rendered from the reflected
 * `model-value`.
 *
 * Icons: `i-mdi-…` utility classes can't resolve inside a shadow root, so each
 * item's icon is rendered as a native `<slot name="icon-<id>">` (see
 * `renderMenuIcon` + `iconSlot`), and this element creates the matching
 * LIGHT-DOM `<span slot="icon-<id>" class="i-…">` children itself in `updated()`.
 * Those light spans are styled by the page's GLOBAL UnoCSS (exactly like
 * `mono-input`'s slotted prefix icon), so the real glyphs paint — client-side,
 * after hydration (empty on the server). The group chevron is inline SVG.
 *
 * Shares all logic with the light build via `MonoMenuCore`. Both register
 * `mono-menu`, so a document loads only one build.
 */
export declare class MonoMenuShadow extends MonoMenuShadow_base {
    static styles: import('lit').CSSResult[];
    protected _useIconSlots(): boolean;
    /** Inline mdi-chevron-right — the UnoCSS icon class can't resolve in shadow. */
    protected _chevronSvg(): TemplateResult;
    connectedCallback(): void;
    protected firstUpdated(changed: Map<string, unknown>): void;
    protected updated(changed: Map<string, unknown>): void;
    /**
     * Reconcile LIGHT-DOM icon spans (this element's own children) with the items
     * tree. Each becomes a `<span slot="icon-<id>" class="mono-menu-iconify i-…">`
     * that projects into the shadow `<slot name="icon-<id>">` and is styled by the
     * page's global UnoCSS. Client-only — the server has no DOM, so icons paint at
     * hydration (the empty `<slot>` matches the server render → no mismatch).
     */
    private _syncLightIcons;
}
export {};
