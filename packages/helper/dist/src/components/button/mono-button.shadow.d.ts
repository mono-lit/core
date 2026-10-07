import { LitElement, TemplateResult } from 'lit';
declare const MonoButtonShadow_base: import('../../composables/hybird-prop').Constructor<import('./button-core.js').MonoButtonCoreInterface> & typeof LitElement;
/**
 * Shadow-DOM `mono-button` (the opt-in SSR build, `@mono-lit/helper/ui/shadow/button`).
 *
 * Real shadow root + `static styles`, so `@lit-labs/ssr` serializes it to
 * Declarative Shadow DOM and styles are scoped (`mono-button`→`:host`). Slotting
 * uses native `<slot>`: the default text slot is always visible (DSD projects the
 * label at parse time), and `<slot name="icon">` defaults `data-empty` (hidden)
 * so the server and the first client render match; real icon presence is detected
 * in `firstUpdated()` via `assignedNodes()` (+ `@slotchange` for later changes).
 * The icon side keys off the `iconPosition` prop (not slot presence) so the DOM
 * structure is hydration-stable. Interactivity needs the first client update to
 * flush (so `@click` binds) — hence the defer-hydration poll. Host sizing is
 * applied client-side in `updated()` (progressive; most buttons set none). Shares
 * all logic with the light build via `MonoButtonCore`; both register
 * `mono-button`, so a document loads only one.
 */
export declare class MonoButtonShadow extends MonoButtonShadow_base {
    static styles: import('lit').CSSResult[];
    connectedCallback(): void;
    firstUpdated(changed: Map<string, unknown>): void;
    protected updated(changed: Map<string, unknown>): void;
    private _iconSlot;
    private _slotHasContent;
    /**
     * An affix zone. Unlike the light build's conditional target, the wrapper is
     * ALWAYS rendered here: the native `<slot>` has to exist for DSD to project
     * into it and for the scan to see it, so emptiness is a `?data-empty`
     * attribute the shadow-only CSS hides — the same shape the icon region uses.
     *
     * `stopPropagation` on `click` / `mno-click` keeps a nested control's own
     * click from surfacing as this button's action (a split button's caret must
     * not run the button's `@click`); see the light build's `_guardAffixEvents`.
     */
    private _renderAffix;
    private _affixSlot;
    private _onAffixSlotChange;
    private _onIconSlotChange;
    /** Host sizing (client-only; mirrors the light build's `_applyHostSize`). */
    private _applyHostSize;
    private _renderBadge;
    /**
     * The icon box, which is also where the spinner is drawn.
     *
     * `spinning` paints the ring and hides the slotted icon; `data-empty` collapses the box when
     * there is neither. Matches the light build exactly — the two used to differ here, with light
     * keeping the span and shadow unmounting it.
     */
    private _iconSpan;
    private _renderIconOnlyContent;
    private _renderNormalContent;
    private _renderContent;
    protected render(): TemplateResult;
}
export {};
