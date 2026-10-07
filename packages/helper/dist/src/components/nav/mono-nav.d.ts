import { LitElement } from 'lit';
declare const MonoNav_base: import('../../composables/hybird-prop').Constructor<import('./nav-core.js').MonoNavCoreInterface> & typeof LitElement;
/**
 * Light-DOM `mono-nav` (the default build, `@mono-lit/helper/ui/nav`).
 *
 * Renders into the host itself (`createRenderRoot` → `this`) so the global
 * `dist/ui/index.css` styles it, and uses the light-DOM slot strategy: direct
 * children are captured in `connectedCallback`, the chrome renders empty
 * `[data-mono-slot]` targets, and the captured nodes are appended back in
 * `updated()`. All render-mode-agnostic logic lives in `MonoNavCore`.
 *
 * The shadow-DOM build (`@mono-lit/helper/ui/shadow/nav`) shares `MonoNavCore` but
 * uses a real shadow root + native `<slot>`. Both register the SAME tag, so a
 * given document must load only one of the two builds.
 */
export declare class MonoNav extends MonoNav_base {
    static styles: import('lit').CSSResult[];
    protected createRenderRoot(): HTMLElement;
    private _slotsCaptured;
    private _slotNodes;
    connectedCallback(): void;
    protected updated(changed: Map<string, unknown>): void;
    /**
     * Pull every direct child into one of four buckets:
     *  - `slot="start"`  → start
     *  - `slot="end"`    → end
     *  - `slot="extension"` → extension
     *  - everything else (no slot attr) → default (center)
     *
     * Captured nodes are removed from the host root and re-inserted into the
     * matching `[data-mono-slot]` target during `updated()`.
     */
    private _captureSlots;
    private _placeSlots;
}
declare global {
    interface HTMLElementTagNameMap {
        'mono-nav': MonoNav;
    }
}
export {};
