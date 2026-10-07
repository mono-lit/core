import { LitElement } from 'lit';
declare const MonoRadio_base: import('../../composables/hybird-prop').Constructor<import('./radio-core.js').MonoRadioCoreInterface> & typeof LitElement;
/**
 * Light-DOM `mono-radio` (default build, `@mono-lit/helper/ui/radio`).
 *
 * Renders into the host (`createRenderRoot`→`this`, styled by the global
 * `dist/ui/index.css`). The `slot="label"`/`slot="description"` children use the
 * light-DOM strategy: captured in `connectedCallback`, the template renders empty
 * `[data-mono-slot]` targets (via the core's default `_renderLabelBlock`), and the
 * captured nodes are re-placed in `updated()`. All render-mode-agnostic logic
 * lives in `MonoRadioCore`. The shadow build (`@mono-lit/helper/ui/shadow/radio`)
 * shares the mixin but uses native `<slot>`. Both register `mono-radio`, so a
 * document loads only one.
 */
export declare class MonoRadio extends MonoRadio_base {
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
        'mono-radio': MonoRadio;
    }
}
export {};
