import { LitElement, TemplateResult } from 'lit';
declare const MonoChipShadow_base: import('../../composables/hybird-prop').Constructor<import('./chip-core.js').MonoChipCoreInterface> & typeof LitElement;
/**
 * Shadow-DOM `mono-chip` (the opt-in SSR build, `@mono-lit/helper/ui/shadow/chip`).
 *
 * Real shadow root + `static styles`, so `@lit-labs/ssr` serializes it to
 * Declarative Shadow DOM and styles are scoped (`mono-chip`→`:host`). Slotting
 * uses native `<slot>`: the `label` prop wins, else the default slot projects the
 * label (DSD at parse time → no flash); `<slot name="icon">` defaults `data-empty`
 * (hidden) so server and first client render match (corrected in `firstUpdated()`
 * via `assignedNodes()` + `@slotchange`); the close button projects
 * `<slot name="close">` with an inline-SVG fallback (the `i-mdi-close` UnoCSS
 * class can't paint inside a shadow root). The icon side keys off `iconPosition`
 * (not slot presence) so the DOM is hydration-stable. Interactivity needs the
 * first client update to flush (so handlers bind) — hence the defer-hydration
 * poll. Shares all logic with the light build via `MonoChipCore`; both register
 * `mono-chip`, so a document loads only one.
 */
export declare class MonoChipShadow extends MonoChipShadow_base {
    static styles: import('lit').CSSResult[];
    connectedCallback(): void;
    firstUpdated(changed: Map<string, unknown>): void;
    private _iconSlot;
    private _slotHasContent;
    private _onIconSlotChange;
    private _renderDot;
    private _iconSpan;
    private _renderLabel;
    private _renderClose;
    private _renderContent;
    protected render(): TemplateResult;
}
export {};
