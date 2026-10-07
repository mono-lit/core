import { LitElement } from 'lit';
declare const MonoFileUpload_base: import('../../composables/hybird-prop').Constructor<import('./file-upload-core.js').MonoFileUploadCoreInterface> & typeof LitElement;
/**
 * Light-DOM `mono-file-upload` (default build, `@mono-lit/helper/ui/file-upload`).
 *
 * Renders into the host (`createRenderRoot`→`this`, styled by the global
 * `dist/ui/index.css`). The `slot="icon"` / `slot="title"` / `slot="subtitle"`
 * dropzone parts use the light-DOM strategy: the child is captured in
 * `connectedCallback`, the template renders an empty `[data-mono-slot="…"]`
 * target, and the node is re-placed in `updated()`.
 * All render-mode-agnostic logic + the default `i-mdi-*` iconify rendering live in
 * `MonoFileUploadCore`. The shadow build (`@mono-lit/helper/ui/shadow/file-upload`)
 * shares the mixin but uses native `<slot>` + inline SVG. Both register
 * `mono-file-upload`, so a document loads only one.
 */
export declare class MonoFileUpload extends MonoFileUpload_base {
    static styles: import('lit').CSSResult[];
    protected createRenderRoot(): HTMLElement;
    private _slotsCaptured;
    private _slots;
    private _parked?;
    connectedCallback(): void;
    protected updated(changed: Map<string, unknown>): void;
    /** Move light-DOM `slot="icon|title|subtitle"` children out for placement into their regions. */
    private _captureSlots;
    private _placeSlot;
}
declare global {
    interface HTMLElementTagNameMap {
        'mono-file-upload': MonoFileUpload;
    }
}
export {};
