import { LitElement } from 'lit';
declare const MonoAlert_base: import('../../composables/hybird-prop').Constructor<import('./alert-core.js').MonoAlertCoreInterface> & typeof LitElement;
/**
 * Light-DOM `mono-alert` (default build, `@mono-lit/helper/ui/alert`).
 *
 * Renders into the host (`createRenderRoot`→`this`, styled by the global
 * `dist/ui/index.css`) with the light-DOM slot strategy of `mono-card`:
 * `slot="icon|title|subtitle|body"` children — and unslotted ones, which are the
 * body — are captured in `connectedCallback`, the template renders empty
 * `[data-mono-slot]` regions, and the captured nodes are re-appended in
 * `updated()`. The first render is forced SYNCHRONOUSLY so a framework's
 * positional anchors are never observably detached (see mono-card).
 *
 * The body wins: when it has content the icon / title / subtitle regions are not
 * rendered, and their captured nodes are parked (kept parented, invisible).
 */
export declare class MonoAlert extends MonoAlert_base {
    static styles: import('lit').CSSResult[];
    protected createRenderRoot(): HTMLElement;
    private _slotsCaptured;
    private _buckets;
    private _parked?;
    /**
     * The body region is ALWAYS rendered (like the card's): it is also the home
     * of the consumer framework's positional anchors (`<!--v-if-->`), which must
     * keep a live, visible parent — content a `v-if` inserts there later has to
     * show up. It is `mono-empty` while it holds nothing but anchors, and a
     * MutationObserver flips `_hasBodySlot` when real content arrives or leaves.
     */
    protected _renderMain(): unknown;
    private _bodyObserver?;
    /** Re-read body presence from the placed region (late `v-if` content). */
    private _watchBody;
    disconnectedCallback(): void;
    connectedCallback(): void;
    private _captureSlots;
    protected updated(changed: Map<string, unknown>): void;
}
declare global {
    interface HTMLElementTagNameMap {
        'mono-alert': MonoAlert;
    }
}
export {};
