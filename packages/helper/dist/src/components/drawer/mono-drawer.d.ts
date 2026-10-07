import { LitElement, TemplateResult } from 'lit';
declare const MonoDrawer_base: import('../../composables/hybird-prop').Constructor<import('./drawer-core.js').MonoDrawerCoreInterface> & typeof LitElement;
/**
 * Light-DOM `mono-drawer` (the default build).
 *
 * Renders into a `<div data-mono-drawer-portal>` appended to `<body>` — the only
 * reliable way to escape transformed / filtered ancestors that would otherwise
 * hijack the containing block of the `position: fixed` overlay + panel. The
 * portal div IS the `.mono-drawer` root, so the shared markup from
 * `MonoDrawerCore._renderDrawerBody()` is rendered straight into it; state
 * classes + `--drawer-z`/resize size-vars are applied imperatively to the portal,
 * and the header/title/subtitle/body/footer slots are captured from light-DOM children and
 * re-parented into `[data-mono-slot]` placeholders. The SSR build lives in
 * `mono-drawer.shadow.ts`; all logic is shared via `MonoDrawerCore`.
 */
export declare class MonoDrawer extends MonoDrawer_base {
    static styles: import('lit').CSSResult[];
    private _portal;
    private _appliedPortalClasses;
    private _slotHeader;
    private _slotTitle;
    private _slotSubtitle;
    private _slotBody;
    private _slotFooter;
    /** Parking for captured title/subtitle nodes a `slot="header"` displaced. */
    private _orphanHolder?;
    protected createRenderRoot(): HTMLElement;
    connectedCallback(): void;
    disconnectedCallback(): void;
    protected updated(changed: Map<string, unknown>): void;
    /** Light build: the size-vars live on the portal (the `.mono-drawer` root). */
    protected _setDrawerSizeVar(name: string, value: string): void;
    protected _removeDrawerSizeVar(name: string): void;
    private _updatePortalClasses;
    private _updatePortalAttributes;
    protected render(): TemplateResult;
    private _captureSlots;
    private _placeSlot;
}
declare global {
    interface HTMLElementTagNameMap {
        'mono-drawer': MonoDrawer;
    }
}
export {};
