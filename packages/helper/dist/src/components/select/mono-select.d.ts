import { LitElement, TemplateResult } from 'lit';
declare const MonoSelect_base: import('../../composables/hybird-prop').Constructor<import('./select-core.js').MonoSelectCoreInterface> & typeof LitElement;
/**
 * Light-DOM `mono-select` (default build, `@mono-lit/helper/ui/select`).
 *
 * `createRenderRoot()` returns `this`, so the component renders into light DOM
 * and inherits the page's global stylesheet (UnoCSS icons, theme variables).
 * Named slots (label/helper/prefix/suffix) are captured from the light-DOM
 * children in `connectedCallback` and re-parented into the rendered
 * `data-mono-slot` placeholders in `updated()`. All behavior is shared with the
 * shadow build (`@mono-lit/helper/ui/shadow/select`) via `MonoSelectCore`; both
 * register `mono-select`, so a document loads only one build.
 */
export declare class MonoSelect extends MonoSelect_base {
    static styles: import('lit').CSSResult[];
    protected createRenderRoot(): HTMLElement;
    private _slotsCaptured;
    private _slotLabel;
    private _slotHelper;
    private _slotPrefix;
    private _slotSuffix;
    /**
     * The consumer's `slot="list"` wrapper — ONE element holding their own `v-for`.
     *
     * Held as a single node and never opened: mono places the wrapper and leaves its children alone.
     * Relocating them would break the consumer's next insert, since Vue positions a new row with
     * `insertBefore(node, anchor)` against the sibling that mono had moved away.
     */
    private _slotList;
    connectedCallback(): void;
    protected updated(changed: Map<string, unknown>): void;
    /**
     * The captured wrapper, which is the truth for this build at every moment: parked out of the
     * host before the panel exists, and inside the panel after. The core's default (a light child of
     * the host) is the SHADOW build's answer and would find nothing here.
     */
    protected get _listSlotWrapper(): HTMLElement | null;
    /** Light-DOM target for the list wrapper; the shadow build projects instead. */
    protected renderListSlot(): TemplateResult;
    /**
     * Move the wrapper into the panel, once it exists.
     *
     * The panel is relocated into a body portal while open, so the target is queried through the
     * core's portal-aware root rather than the host. Idempotent: once the wrapper is inside the
     * target it is left alone, which matters because re-appending it on every render would blow away
     * the consumer's scroll position and focus.
     */
    private _placeListSlot;
    /**
     * Adopt a wrapper that appeared after `connectedCallback` — see `LateSlotWatcher`.
     *
     * Two things have to happen and the order matters. It is PARKED first, out of the host, because
     * until it is placed it would otherwise paint in the host's own flow, under the field rather
     * than inside the panel — that is the bug this exists for. Only then is the flag flipped, which
     * schedules the render that creates the target `_placeListSlot` needs.
     *
     * Parking detached is safe for the subtree inside it: the consumer's `v-for` inserts against
     * anchors that are its OWN children, and those move with it.
     */
    protected _onLateListSlot(): void;
    private _captureSlots;
    private _placeSlot;
}
declare global {
    interface HTMLElementTagNameMap {
        'mono-select': MonoSelect;
    }
}
export {};
