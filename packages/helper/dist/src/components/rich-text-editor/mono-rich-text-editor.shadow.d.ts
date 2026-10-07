import { LitElement, TemplateResult } from 'lit';
import { RichTextEditorSlotName } from './rich-text-editor-core.js';
declare const MonoRichTextEditorShadow_base: import('../../composables/hybird-prop').Constructor<import('./rich-text-editor-core.js').MonoRichTextEditorCoreInterface> & typeof LitElement;
/**
 * Shadow-DOM `mono-shadow-rich-text-editor` (the opt-in SSR build,
 * `@mono-lit/helper/ui/shadow/rich-text-editor`).
 *
 * Real shadow root + `static styles` for the CHROME (label, frame, messages),
 * serialised to Declarative Shadow DOM by `@lit-labs/ssr`. The EDITOR itself is
 * never in the shadow root: SunEditor's stylesheet is global and its modals are
 * parked on `<body>`, so the core keeps the mount as a light child of the host
 * and this build projects it through `<slot name="editor">` — the page sheet
 * styles it, and the `--se-*` remap declared on the frame still reaches it
 * through the flat tree. On the server the slot is empty (an editor is client
 * state); the first client update builds it.
 */
export declare class MonoRichTextEditorShadow extends MonoRichTextEditorShadow_base {
    static styles: import('lit').CSSResult[];
    protected get _slotsAlwaysRender(): boolean;
    protected get _useNativeSlots(): boolean;
    connectedCallback(): void;
    firstUpdated(changed: Map<string, unknown>): void;
    protected updated(changed: Map<string, unknown>): void;
    private _slotFor;
    private _slotHasContent;
    private _onSlotChange;
    /** Reconcile the 2 slot-presence flags from their slots' assigned content. */
    private _scanSlots;
    /** Native `<slot>` carrying the prop fallback as native slot content. */
    protected _slotOutlet(name: RichTextEditorSlotName, fallback?: unknown): TemplateResult;
    /** The frame projects the light-DOM mount the core keeps on the host. */
    protected _renderEditorOutlet(fieldClass: string): TemplateResult;
}
export {};
