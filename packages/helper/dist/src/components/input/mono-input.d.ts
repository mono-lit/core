import { LitElement, TemplateResult } from 'lit';
declare const MonoInput_base: import('../../composables/hybird-prop').Constructor<import('./input-core.js').MonoInputCoreInterface> & typeof LitElement;
/**
 * Light-DOM `mono-input` (default build, `@mono-lit/helper/ui/input`).
 *
 * Renders into the host (`createRenderRoot`→`this`, styled by the global
 * `dist/ui/index.css`) and uses the light-DOM slot strategy: `slot="prefix|…"`
 * children are captured in `connectedCallback`, the template renders empty
 * `[data-mono-slot]` targets, and the captured nodes are appended back in
 * `updated()`. All render-mode-agnostic logic lives in `MonoInputCore`. The
 * shadow build (`@mono-lit/helper/ui/shadow/input`) shares the mixin but uses native
 * `<slot>`. Both register `mono-input`, so a document loads only one.
 */
export declare class MonoInput extends MonoInput_base {
    static styles: import('lit').CSSResult[];
    protected createRenderRoot(): HTMLElement;
    private _slotPrefix;
    private _slotSuffix;
    private _slotLabel;
    private _slotHelper;
    private _slotObserver?;
    /**
     * Capture `slot="…"` light-DOM children into the per-region arrays. Safe to run
     * MORE THAN ONCE: captured nodes have their `slot` attribute removed and are
     * detached from the host, so a re-scan never re-captures them. Re-running lets
     * us pick up children Vue appends AFTER `connectedCallback` (e.g. a client-only
     * `<mono-input>` slotted into the SSR `<mono-nav>`'s shadow `<slot>`, where the
     * `<span slot="prefix">` can arrive late) — the original one-shot capture missed
     * those, so the prefix wrapper was never rendered and the icon never showed.
     */
    private _captureSlots;
    connectedCallback(): void;
    disconnectedCallback(): void;
    protected updated(changed: Map<string, unknown>): void;
    private _placeSlot;
    protected renderIcon(_name: 'close'): TemplateResult;
    private _renderLabel;
    private _renderHelper;
    protected render(): TemplateResult;
}
declare global {
    interface HTMLElementTagNameMap {
        'mono-input': MonoInput;
    }
}
export {};
