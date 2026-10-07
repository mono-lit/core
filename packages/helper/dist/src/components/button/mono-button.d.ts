import { LitElement, TemplateResult } from 'lit';
declare const MonoButton_base: import('../../composables/hybird-prop').Constructor<import('./button-core.js').MonoButtonCoreInterface> & typeof LitElement;
/**
 * Light-DOM `mono-button` (default build, `@mono-lit/helper/ui/button`).
 *
 * Renders into the host (`createRenderRoot`→`this`, styled by the global
 * `dist/ui/index.css`) with the light-DOM slot strategy: `slot="icon"` + default
 * text children are captured in `connectedCallback`, the template renders empty
 * `[data-mono-slot]` targets, and the captured nodes are re-placed in `updated()`.
 * Capture goes through `composables/light-slots`, which carries the consumer
 * framework's positional anchors (Vue's `<!--v-if-->` comments and zero-length
 * Fragment text nodes) instead of deleting them, and the first render is forced
 * **synchronously** from `connectedCallback` so capture→placement is one
 * uninterrupted step — together that's what lets buttons nest freely without
 * crashing the consumer's next patch on a null anchor.
 * Host sizing is applied imperatively in `updated()`. All render-mode-agnostic
 * logic lives in `MonoButtonCore`. The shadow build (`@mono-lit/helper/ui/shadow/button`)
 * shares the mixin but uses native `<slot>`. Both register `mono-button`, so a
 * document loads only one.
 */
export declare class MonoButton extends MonoButton_base {
    static styles: import('lit').CSSResult[];
    protected createRenderRoot(): HTMLElement;
    private _buckets;
    private _slotsCaptured;
    private _guardedAffixes;
    /**
     * Capture is one-shot, so a `slot="prepend"` child the consumer appends AFTER
     * connect would never be seen. These re-run it when one turns up — the icon
     * slot never needed it because an icon is written inline with the button, but
     * an affix is exactly the kind of thing a `v-if` reveals later.
     */
    private _lateAffix;
    /**
     * Light-DOM refinement: `rounded="full"` auto-icon-only only when the default slot is
     * empty. `bucketHasContent` (not a length check) so a bucket holding nothing but
     * framework anchors still counts as empty.
     */
    protected _defaultIsEmpty(): boolean;
    private _renderBadge;
    /**
     * The `[data-mono-slot]` targets must be **structurally stable** across every
     * re-render.
     *
     * These are light-DOM elements holding nodes the *consumer's* framework
     * created and still tracks. Toggling `loading` used to swap between two
     * template branches, so Lit destroyed the target `<span>` — taking the
     * consumer's nodes with it — and `updated()` re-appended them into a brand-new
     * one. Vue's vnodes then referenced detached nodes, and the next patch died
     * with `TypeError: can't access property "__vnode", el is null`.
     *
     * So visibility is expressed with the existing `.button-icon.hidden` class
     * (`display: none !important`), never by adding or removing the target. With
     * the span stable, `_placeSlot` finds its nodes already in place and mutates
     * nothing at all on a loading toggle.
     */
    private _renderIconOnlyContent;
    /**
     * Icon slot class, hidden in place while loading rather than unmounted — but
     * only in overlay mode. Inline loading keeps the icon, so the button doesn't
     * reshuffle its contents just to show progress.
     */
    /**
     * The icon box, which is also where the spinner is drawn.
     *
     * `spinning` paints the ring and hides whatever is slotted inside; `empty` collapses the box
     * when there is neither. The span itself is ALWAYS rendered — see `_renderNormalContent`.
     */
    private _iconClass;
    private _renderNormalContent;
    private _renderContent;
    protected render(): TemplateResult;
    connectedCallback(): void;
    disconnectedCallback(): void;
    /**
     * Claim a `slot="prepend"` / `slot="append"` child that arrived after connect.
     *
     * Deliberately NOT `captureLightSlots` a second time. This build renders into
     * the host (`createRenderRoot` → `this`), so by now the host's children include
     * Lit's own `<div class="mono-button">` — a re-capture would bucket that as
     * default content and detach it, wiping the rendered button. `LateSlotWatcher`
     * hands back only the direct child carrying the slot name, which is all that is
     * wanted here.
     */
    private _recaptureAffix;
    /**
     * Stop a nested control's click at the affix boundary — the plain `click`
     * and the `mno-click` / `mnoClick` aliases alike.
     *
     * An affix can hold a whole `<mono-button>` or a dropdown caret. Sibling
     * placement keeps its clicks out of `_handleClick`, but they would still
     * bubble to the HOST, where a consumer's `@click` is this button's action —
     * a split button's caret would run the button's handler. So an affix's click
     * ends here: its own handlers (deeper) and any document-level CAPTURE
     * listener have already run. Same guard `mono-button-dropdown` puts on its
     * embedded buttons.
     */
    private _guardAffixEvents;
    private _captureSlots;
    /**
     * An affix zone renders only when its slot has content, so an affix-free button
     * keeps byte-identical markup. That conditional is safe here — unlike the icon
     * span, whose target must never unmount — because capture runs BEFORE the
     * synchronous first render in `connectedCallback`, and because the flags only
     * ever go false→true: captured nodes stay captured, so a target that exists
     * once is never taken away from under the consumer's nodes.
     */
    private _renderAffix;
    /**
     * Apply sizing to the HOST (`mono-button` is inline-block). The `.sized` class
     * makes the wrapper + inner control fill the host, so width/height set here
     * cascade down. Props that aren't set are removed so they don't linger.
     */
    private _applyHostSize;
    protected updated(changed: Map<string, unknown>): void;
    private _placeSlot;
}
declare global {
    interface HTMLElementTagNameMap {
        'mono-button': MonoButton;
    }
}
export {};
