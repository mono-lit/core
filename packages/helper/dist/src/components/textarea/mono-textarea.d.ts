import { LitElement } from 'lit';
declare const MonoTextarea_base: import('../../composables/hybird-prop').Constructor<import('./textarea-core.js').MonoTextareaCoreInterface> & typeof LitElement;
/**
 * Light-DOM `mono-textarea` (default build, `@mono-lit/helper/ui/textarea`).
 *
 * `createRenderRoot()` returns `this`, so it renders into light DOM and inherits
 * the page's global stylesheet. Named slots (label/helper) are captured from the
 * light-DOM children in `connectedCallback` and re-parented into the rendered
 * `data-mono-slot` placeholders in `updated()`. All render-mode-agnostic logic is
 * shared with the shadow build (`@mono-lit/helper/ui/shadow/textarea`) via
 * `MonoTextareaCore`; both register `mono-textarea`, so a document loads one.
 */
export declare class MonoTextarea extends MonoTextarea_base {
    static styles: import('lit').CSSResult[];
    protected createRenderRoot(): HTMLElement;
    private _slotsCaptured;
    private _slotLabel;
    private _slotHelper;
    connectedCallback(): void;
    protected updated(changed: Map<string, unknown>): void;
    private _captureSlots;
    private _placeSlot;
}
declare global {
    interface HTMLElementTagNameMap {
        'mono-textarea': MonoTextarea;
    }
}
export {};
