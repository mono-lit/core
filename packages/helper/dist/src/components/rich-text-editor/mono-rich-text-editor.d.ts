import { LitElement } from 'lit';
declare const MonoRichTextEditor_base: import('../../composables/hybird-prop').Constructor<import('./rich-text-editor-core.js').MonoRichTextEditorCoreInterface> & typeof LitElement;
/**
 * Light-DOM `mono-rich-text-editor` (default build, `@mono-lit/helper/ui/rich-text-editor`).
 *
 * `createRenderRoot()` returns `this`, so it renders into light DOM and inherits
 * the page's global stylesheet — which is also where SunEditor's own sheet
 * lives. Named slots (label/helper) are captured from the light-DOM children in
 * `connectedCallback` and re-parented into the rendered `data-mono-slot`
 * placeholders in `updated()`; the editor mount is re-homed into the field frame
 * the same way by the core (`_placeMount`). All render-mode-agnostic logic is
 * shared with the shadow build (`@mono-lit/helper/ui/shadow/rich-text-editor`) via
 * `MonoRichTextEditorCore`.
 */
export declare class MonoRichTextEditor extends MonoRichTextEditor_base {
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
        'mono-rich-text-editor': MonoRichTextEditor;
    }
}
export {};
