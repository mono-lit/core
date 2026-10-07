import { LitElement, TemplateResult } from 'lit';
declare const MonoAccordion_base: import('../../composables/hybird-prop').Constructor<import('./accordion-core.js').MonoAccordionCoreInterface> & typeof LitElement;
/**
 * Light-DOM `mono-accordion` (default build, `@mono-lit/helper/ui/accordion`).
 *
 * Renders into the host (`createRenderRoot`→`this`, styled by the global
 * `dist/ui/index.css`) with the light-DOM slot strategy: `slot="…"` children are
 * captured in `connectedCallback`, the template renders empty `[data-mono-slot]`
 * targets, and the captured nodes are re-appended in `updated()`. All
 * render-mode-agnostic logic lives in `MonoAccordionCore`. The shadow build
 * (`@mono-lit/helper/ui/shadow/accordion`) shares the mixin but uses native `<slot>`.
 * Both register `mono-accordion`, so a document loads only one.
 */
export declare class MonoAccordion extends MonoAccordion_base {
    static styles: import('lit').CSSResult[];
    protected createRenderRoot(): HTMLElement;
    private _slotObserver?;
    private _slotTitle;
    private _slotLabel;
    private _slotSubtitle;
    private _slotDescription;
    private _slotHeader;
    private _slotIcon;
    private _slotActions;
    private _slotBody;
    /** Hidden detached holder for captured nodes that have no rendered target. */
    private _parked?;
    /** The title nodes that render: `slot="title"` beats its alias `slot="label"`. */
    private get _titleNodes();
    /** The subtitle nodes that render: `slot="subtitle"` beats `slot="description"`. */
    private get _subtitleNodes();
    connectedCallback(): void;
    disconnectedCallback(): void;
    protected updated(changed: Map<string, unknown>): void;
    private _renderIcon;
    private _renderText;
    private _renderActions;
    private _renderBody;
    protected render(): TemplateResult;
    /**
     * Capture `slot="…"` named children + the unnamed/default body content into the
     * per-region arrays. Safe to run MORE THAN ONCE: captured nodes are detached
     * from the host (and named ones lose their `slot` attribute), so a re-scan never
     * re-captures them — and the Lit-rendered wrapper (`.mono-accordion`) is skipped.
     * Re-running lets the MutationObserver pick up children Vue appends after connect.
     */
    private _captureSlots;
    private _placeSlot;
}
declare global {
    interface HTMLElementTagNameMap {
        'mono-accordion': MonoAccordion;
    }
}
export {};
