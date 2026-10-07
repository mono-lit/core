import { LitElement, TemplateResult } from 'lit';
import { TagInputSlotName } from './tag-input-core.js';
declare const MonoTagInputShadow_base: import('../../composables/hybird-prop').Constructor<import('./tag-input-core.js').MonoTagInputCoreInterface> & typeof LitElement;
export declare class MonoTagInputShadow extends MonoTagInputShadow_base {
    static styles: import('lit').CSSResult[];
    protected get _slotsAlwaysRender(): boolean;
    connectedCallback(): void;
    firstUpdated(changed: Map<string, unknown>): void;
    protected updated(changed: Map<string, unknown>): void;
    /**
     * Slotted content stays in the LIGHT DOM, so the checkbox mono injects into it is out of reach
     * of this build's scoped styles — the one place where projection's virtue (the page's CSS still
     * applies) turns into a cost. The rules it needs are added to the document once, under an id, and
     * only when a list slot actually asks for chrome; `checkboxCss` is already bundled here for the
     * shadow root's own copy, so this costs no extra bytes.
     */
    protected _syncListChrome(): void;
    private _slotFor;
    private _slotHasContent;
    private _onSlotChange;
    /** A wrapper appeared after connect — the flag is all this build needs, projection does the rest. */
    protected _onLateListSlot(): void;
    /** Reconcile the 3 slot-presence flags from their slots' assigned content. */
    private _scanSlots;
    /**
     * The consumer's list wrapper, PROJECTED rather than moved.
     *
     * Projection is what makes this work in a shadow root at all: slotted content stays in the light
     * DOM, so the app's own stylesheet still reaches it. Moving those nodes inside the shadow root
     * would cut them off from it — the same reason this build inlines SVGs instead of icon classes.
     */
    protected renderListSlot(): TemplateResult;
    /** Native `<slot>` carrying the prop fallback as native slot content. */
    protected _slotOutlet(name: TagInputSlotName, fallback?: unknown): TemplateResult;
    /** Inline SVG — the global `.mono-icon`/`i-mdi-close` UnoCSS icon can't reach a
     *  shadow root. (The caret and scroll chevrons are already inline SVG from
     *  `composables/field-icons`, so they need no override.) */
    protected renderIcon(_name: 'close'): TemplateResult;
}
export {};
