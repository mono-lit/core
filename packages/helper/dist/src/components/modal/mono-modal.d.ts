import { LitElement, TemplateResult } from 'lit';
declare const MonoModal_base: import('../../composables/hybird-prop').Constructor<import('./modal-core.js').MonoModalCoreInterface> & typeof LitElement;
/**
 * Light-DOM `mono-modal` (the default build).
 *
 * Renders into a `<div data-mono-modal-portal>` appended to `<body>` (same
 * pattern drawer uses — the only reliable way to escape transformed / filtered
 * ancestors that would otherwise hijack the containing block of a
 * `position: fixed` overlay). The portal div IS the `.mono-modal` root, so the
 * shared markup from `MonoModalCore._renderModalBody()` is rendered straight
 * into it; state classes + `--modal-z` are applied imperatively to the portal,
 * and the head/title/subtitle/body/foot slots are captured from light-DOM children and
 * re-parented into `[data-mono-slot]` placeholders. The SSR build lives in
 * `mono-modal.shadow.ts`; all logic is shared via `MonoModalCore`.
 */
export declare class MonoModal extends MonoModal_base {
    static styles: import('lit').CSSResult[];
    private _portal;
    private _appliedPortalClasses;
    private _slotHead;
    private _slotTitle;
    private _slotSubtitle;
    private _slotBody;
    private _slotFoot;
    /** `slot="header"` / `slot="footer"` — aliases that OUTRANK `head`/`foot`. */
    private _slotHeaderAlias;
    private _slotFooterAlias;
    /** Detached parking for captured nodes that lost the alias contest. */
    private _orphanHolder?;
    protected createRenderRoot(): HTMLElement;
    connectedCallback(): void;
    disconnectedCallback(): void;
    protected updated(changed: Map<string, unknown>): void;
    private _updatePortalClasses;
    private _updatePortalAttributes;
    protected render(): TemplateResult;
    private _captureSlots;
    private _placeSlot;
}
declare global {
    interface HTMLElementTagNameMap {
        'mono-modal': MonoModal;
    }
}
export {};
