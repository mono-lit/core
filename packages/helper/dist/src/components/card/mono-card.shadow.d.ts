import { LitElement, TemplateResult } from 'lit';
declare const MonoCardShadow_base: import('../../composables/hybird-prop').Constructor<import('./card-core.js').MonoCardCoreInterface> & typeof LitElement;
/**
 * Shadow-DOM card (the opt-in SSR build, `@mono-lit/helper/ui/shadow/card`).
 *
 * Registered as `<mono-shadow-card>` — a DISTINCT tag from the light build's
 * `<mono-card>` — so the two can be loaded side by side (e.g. the VitePress docs
 * render both live). Like every shadow component, it registers a `mono-shadow-*`
 * tag; consumers of `@mono-lit/helper/ui/shadow/card` write `<mono-shadow-card>`.
 *
 * Real shadow root + `static styles`, so `@lit-labs/ssr` serializes it to
 * Declarative Shadow DOM and styles are scoped (`mono-card`→`:host`). Slotting
 * uses native `<slot>`. During SSR the element has no light children, so every
 * `_has…` defaults `false` (hydration-matching) and the decorative regions render
 * `mono-empty` (hidden by card.css itself); real presence is corrected in
 * `firstUpdated()` (DSD assigns slotted content at parse time → `slotchange`
 * doesn't fire after upgrade → scan `assignedNodes()`; `slotchange` is kept for
 * later dynamic changes). `<slot name="title">${title}</slot>` carries the prop
 * text as native fallback so it shows with no JS. The body/default region is
 * always visible so main content never flashes. Shares all logic with the light
 * build via `MonoCardCore`.
 */
export declare class MonoCardShadow extends MonoCardShadow_base {
    static styles: import('lit').CSSResult[];
    firstUpdated(changed: Map<string, unknown>): void;
    private _slotFor;
    /**
     * Whether something is ASSIGNED to this slot. Not `flatten: true`: for an
     * empty slot that returns the FALLBACK content, and `<slot name="header">`'s
     * fallback is the title/subtitle markup — every card would look like it had a
     * header slot and hide its icon.
     */
    private _slotHasContent;
    private _setSlotState;
    private _onSlotChange;
    private _slot;
    private _renderMedia;
    private _renderHeader;
    private _renderBody;
    private _renderActions;
    private _renderFooter;
    private _renderLoading;
    private _renderContent;
    protected render(): TemplateResult;
    connectedCallback(): void;
}
declare global {
    interface HTMLElementTagNameMap {
        'mono-shadow-card': MonoCardShadow;
    }
}
export {};
