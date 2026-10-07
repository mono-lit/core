import { LitElement } from 'lit';
declare const MonoSwitch_base: import('../../composables/hybird-prop').Constructor<import('./switch-core.js').MonoSwitchCoreInterface> & typeof LitElement;
/**
 * Light-DOM `mono-switch` (default build, `@mono-lit/helper/ui/switch`).
 *
 * Renders into the host (`createRenderRoot`→`this`, styled by the global
 * `dist/ui/index.css`) with the light-DOM slot strategy: `slot="label|
 * description"` children are captured in `connectedCallback`, the template
 * renders empty `[data-mono-slot]` targets (via the core's default
 * `_renderLabelBlock`), and the captured nodes are re-placed in `updated()`. All
 * render-mode-agnostic logic lives in `MonoSwitchCore`. The shadow build
 * (`@mono-lit/helper/ui/shadow/switch`) shares the mixin but uses native `<slot>`.
 * Both register `mono-switch`, so a document loads only one.
 */
export declare class MonoSwitch extends MonoSwitch_base {
    static styles: import('lit').CSSResult[];
    protected createRenderRoot(): HTMLElement;
    private _slotsCaptured;
    private _slotLabel;
    private _slotDescription;
    connectedCallback(): void;
    protected updated(changed: Map<string, unknown>): void;
    private _captureSlots;
    private _placeSlot;
}
declare global {
    interface HTMLElementTagNameMap {
        'mono-switch': MonoSwitch;
    }
}
export {};
