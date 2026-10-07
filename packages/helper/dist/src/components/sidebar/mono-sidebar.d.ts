import { LitElement, TemplateResult } from 'lit';
declare const MonoSidebar_base: import('../../composables/hybird-prop').Constructor<import('./sidebar-core.js').MonoSidebarCoreInterface> & typeof LitElement;
/**
 * Light-DOM `mono-sidebar` (default build, `@mono-lit/helper/ui/sidebar`).
 *
 * Renders into the host (`createRenderRoot`→`this`, styled by the global
 * `dist/ui/index.css`) with the light-DOM slot strategy: `slot="header"`/
 * `"footer"`/`"body"` (or unslotted) children are captured in
 * `connectedCallback`, the template renders empty `[data-mono-slot]` targets,
 * and the captured nodes are re-appended in `updated()`. All render-mode-agnostic
 * logic lives in `MonoSidebarCore`. The shadow build
 * (`@mono-lit/helper/ui/shadow/sidebar`) shares the mixin but uses native `<slot>`.
 * Both register `mono-sidebar`, so a document loads only one.
 */
export declare class MonoSidebar extends MonoSidebar_base {
    static styles: import('lit').CSSResult[];
    protected createRenderRoot(): HTMLElement;
    private _slotsCaptured;
    private _slotHeader;
    private _slotBody;
    private _slotFooter;
    connectedCallback(): void;
    protected updated(changed: Map<string, unknown>): void;
    protected renderIcon(_name: 'chevron'): TemplateResult;
    private _captureSlots;
    private _placeSlots;
    private _placeSlot;
}
declare global {
    interface HTMLElementTagNameMap {
        'mono-sidebar': MonoSidebar;
    }
}
export {};
