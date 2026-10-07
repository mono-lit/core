import { LitElement, TemplateResult } from 'lit';
declare const MonoBreadcrumb_base: import('../../composables/hybird-prop').Constructor<import('./breadcrumb-core.js').MonoBreadcrumbCoreInterface> & typeof LitElement;
/**
 * Light-DOM `mono-breadcrumb` (default build, `@mono-lit/helper/ui/breadcrumb`).
 *
 * Renders into the host (`createRenderRoot`→`this`, styled by the global
 * `dist/ui/index.css`). Supports declarative composition with
 * `<mono-breadcrumb-list>` children and the light-DOM slot strategy: `slot="body"`
 * / `slot="separator"` / `slot="icon-<id>"` children are captured in
 * `connectedCallback`, the template renders empty `[data-mono-slot]` targets, and
 * the captured nodes are re-placed in `updated()`. All render-mode-agnostic logic
 * lives in `MonoBreadcrumbCore`. The shadow build
 * (`@mono-lit/helper/ui/shadow/breadcrumb`) shares the mixin but renders the whole list
 * from the `items` prop in a single shadow root. Both register `mono-breadcrumb`,
 * so a document loads only one.
 */
export declare class MonoBreadcrumb extends MonoBreadcrumb_base {
    static styles: import('lit').CSSResult[];
    protected createRenderRoot(): HTMLElement;
    private _slotsCaptured;
    private _hasBodySlot;
    /** Captured nodes for the whole-body slot — `slot="body"`. */
    private _slotBody;
    private _orphanHolder?;
    connectedCallback(): void;
    protected updated(changed: Map<string, unknown>): void;
    protected _renderBody(): TemplateResult;
    private _captureSlots;
    private _placeIconSlots;
    private _placeBodySlot;
    private _placeSeparatorSlots;
}
declare global {
    interface HTMLElementTagNameMap {
        'mono-breadcrumb': MonoBreadcrumb;
    }
}
export {};
