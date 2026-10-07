import { LitElement } from 'lit';
declare const MonoCheckbox_base: import('../../composables/hybird-prop').Constructor<import('./checkbox-core.js').MonoCheckboxCoreInterface> & typeof LitElement;
/**
 * Light-DOM `mono-checkbox` (default build, `@mono-lit/helper/ui/checkbox`).
 *
 * Renders into the host (`createRenderRoot`→`this`, styled by the global
 * `dist/ui/index.css`) with the light-DOM slot strategy: `slot="icon|
 * indeterminate-icon|label|description"` children are captured in
 * `connectedCallback`, the template renders empty `[data-mono-slot]` targets
 * (via the core's default `_renderCustomIcon`/`_renderLabelBlock`), and the
 * captured nodes are re-placed in `updated()`. All render-mode-agnostic logic
 * lives in `MonoCheckboxCore`. The shadow build (`@mono-lit/helper/ui/shadow/checkbox`)
 * shares the mixin but uses native `<slot>`. Both register `mono-checkbox`, so a
 * document loads only one.
 */
export declare class MonoCheckbox extends MonoCheckbox_base {
    static styles: import('lit').CSSResult[];
    protected createRenderRoot(): HTMLElement;
    private _slotsCaptured;
    private _slotIcon;
    private _slotIndeterminateIcon;
    private _slotLabel;
    private _slotDescription;
    connectedCallback(): void;
    protected updated(changed: Map<string, unknown>): void;
    private _captureSlots;
    private _placeSlot;
}
declare global {
    interface HTMLElementTagNameMap {
        'mono-checkbox': MonoCheckbox;
    }
}
export {};
