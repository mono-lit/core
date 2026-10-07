import { LitElement, TemplateResult } from 'lit';
declare const MonoCard_base: import('../../composables/hybird-prop').Constructor<import('./card-core.js').MonoCardCoreInterface> & typeof LitElement;
/**
 * Light-DOM `mono-card` (default build, `@mono-lit/helper/ui/card`).
 *
 * Renders into the host (`createRenderRoot`→`this`, styled by the global
 * `dist/ui/index.css`) with the light-DOM slot strategy: `slot="media|icon|…"`
 * children are captured in `connectedCallback`, the template renders empty
 * `[data-mono-slot]` regions, and the captured nodes are re-appended in
 * `updated()`. Capture/placement lives in `composables/light-slots`, which is
 * careful to carry the consumer framework's positional anchors (Vue's
 * `<!--v-if-->` comments and zero-length Fragment text nodes) into the region
 * alongside their siblings — deleting them used to detach Vue's vnode anchors and
 * crash its next patch with `Cannot read properties of null`. The first render is
 * forced **synchronously** from `connectedCallback` (see there) so the detach and
 * re-attach happen in one uninterrupted step, which is what lets cards nest freely.
 *
 * All render-mode-agnostic logic lives in `MonoCardCore`. The shadow build
 * (`@mono-lit/helper/ui/shadow/card`) shares the mixin but uses native `<slot>` and
 * registers a distinct `<mono-shadow-card>` tag, so both builds can load in the
 * same document.
 */
export declare class MonoCard extends MonoCard_base {
    static styles: import('lit').CSSResult[];
    protected createRenderRoot(): HTMLElement;
    private _slotsCaptured;
    private _buckets;
    private _renderMedia;
    private _renderHeader;
    /**
     * The body is the only region rendered unconditionally.
     *
     * It's the home for the fallback bucket, which holds the consumer framework's
     * positional anchors. Those need a live parent even when the card starts with
     * no visible body content — that's what lets a `v-if` flipping on later insert
     * *inside* the card instead of beside it, and it stops Lit from ever destroying
     * a container that holds the consumer's nodes. `.mono-card-body:empty` collapses
     * it while it holds nothing but anchors.
     */
    private _renderBody;
    private _renderActions;
    private _renderFooter;
    private _renderLoading;
    private _renderContent;
    protected render(): TemplateResult;
    connectedCallback(): void;
    private _captureSlots;
    protected updated(changed: Map<string, unknown>): void;
    private _parked?;
}
declare global {
    interface HTMLElementTagNameMap {
        'mono-card': MonoCard;
    }
}
export {};
