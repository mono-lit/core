import { LitElement } from 'lit';
declare const MonoTabs_base: import('../../composables/hybird-prop').Constructor<import('./tabs-core.js').MonoTabsCoreInterface> & typeof LitElement;
/**
 * Light-DOM `mono-tabs` (default build, `@mono-lit/helper/ui/tabs`).
 *
 * Renders into the host (`createRenderRoot`→`this`, styled by the global
 * `dist/ui/index.css`). Per-tab icons use the light-DOM slot strategy: `slot=
 * "icon-<id>"` children are captured in `connectedCallback`, the template renders
 * empty `[data-mono-slot="icon-<id>"]` targets, and the captured nodes are
 * re-placed in `updated()`. All render-mode-agnostic logic lives in `MonoTabsCore`.
 * The shadow build (`@mono-lit/helper/ui/shadow/tabs`) shares the mixin but renders the
 * whole tablist in one shadow root with native `<slot>`. Both register `mono-tabs`,
 * so a document loads only one.
 */
export declare class MonoTabs extends MonoTabs_base {
    static styles: import('lit').CSSResult[];
    protected createRenderRoot(): HTMLElement;
    private _slotsCaptured;
    private _slotIcons;
    private _orphanHolder?;
    /** Light-DOM: a tab has an icon when a `slot="icon-<id>"` child was captured. */
    protected _iconHasContent(id: string): boolean;
    connectedCallback(): void;
    protected updated(changed: Map<string, unknown>): void;
    private _captureSlots;
    private _placeIconSlots;
}
declare global {
    interface HTMLElementTagNameMap {
        'mono-tabs': MonoTabs;
    }
}
export {};
