import { LitElement, TemplateResult } from 'lit';
declare const MonoChip_base: import('../../composables/hybird-prop').Constructor<import('./chip-core.js').MonoChipCoreInterface> & typeof LitElement;
/**
 * Light-DOM `mono-chip` (default build, `@mono-lit/helper/ui/chip`).
 *
 * Renders into the host (`createRenderRoot`→`this`, styled by the global
 * `dist/ui/index.css`) with the light-DOM slot strategy: `slot="icon"`/`"close"`
 * + default text children are captured in `connectedCallback`, the template
 * renders empty `[data-mono-slot]` targets, and the captured nodes are re-placed
 * in `updated()`. Capture goes through `composables/light-slots`, which carries the
 * consumer framework's positional anchors (Vue's `<!--v-if-->` comments and
 * zero-length Fragment text nodes) instead of deleting them, and the first render
 * is forced **synchronously** from `connectedCallback` so capture→placement is one
 * uninterrupted step — together that's what lets chips nest freely without crashing
 * the consumer's next patch on a null anchor. All render-mode-agnostic logic lives
 * in `MonoChipCore`. The shadow build (`@mono-lit/helper/ui/shadow/chip`) shares the
 * mixin but uses native `<slot>`. Both register `mono-chip`, so a document loads
 * only one.
 */
export declare class MonoChip extends MonoChip_base {
    static styles: import('lit').CSSResult[];
    protected createRenderRoot(): HTMLElement;
    private _buckets;
    private _slotsCaptured;
    private _renderLabel;
    private _renderDot;
    private _renderClose;
    private _renderContent;
    protected render(): TemplateResult;
    connectedCallback(): void;
    /**
     * In light DOM mode, <slot> elements no longer project the host's children.
     * Capture them once before Lit's first render replaces the children, then
     * re-place them in the render template at the right positions. `light-slots`
     * carries comments and zero-length Fragment text nodes with the content they
     * anchor and removes *only* what it buckets — the previous inline logic deleted
     * every original child, dropping Vue's anchors for good.
     */
    private _captureSlots;
    protected updated(changed: Map<string, unknown>): void;
    private _placeSlot;
}
declare global {
    interface HTMLElementTagNameMap {
        'mono-chip': MonoChip;
    }
}
export {};
