import { LitElement, nothing, TemplateResult } from 'lit';
declare const MonoCheckboxShadow_base: import('../../composables/hybird-prop').Constructor<import('./checkbox-core.js').MonoCheckboxCoreInterface> & typeof LitElement;
/**
 * Shadow-DOM `mono-checkbox` (the opt-in SSR build, `@mono-lit/helper/ui/shadow/checkbox`).
 *
 * Real shadow root + `static styles`, so `@lit-labs/ssr` serializes it to
 * Declarative Shadow DOM and styles are scoped (`:host{display:inline-block}` —
 * the `.mono-checkbox` class lives on the inner `<label>`). The checked/
 * indeterminate visual state is the wrapper class (CSS `::before`/`::after`), so
 * it server-renders from `this.checked`/`this.indeterminate`. Slots use native
 * `<slot>`: the `label`/`description` slots carry the prop text as native fallback
 * (shown server-side); custom icon slots are bare `<slot name="icon">` gated on
 * `checked`/`indeterminate`; slot presence is detected in `firstUpdated()` via
 * `assignedNodes()` (DSD assigns at parse time → no `slotchange` after upgrade).
 * Interactivity needs the first client update to flush (so `@change` binds) —
 * hence the defer-hydration poll. Shares all logic with the light build via
 * `MonoCheckboxCore`; both register `mono-checkbox`, so a document loads one.
 */
export declare class MonoCheckboxShadow extends MonoCheckboxShadow_base {
    static styles: import('lit').CSSResult[];
    connectedCallback(): void;
    firstUpdated(changed: Map<string, unknown>): void;
    protected updated(changed: Map<string, unknown>): void;
    private _slotFor;
    private _slotHasContent;
    private _onSlotChange;
    /**
     * The sublabel region answers to `slot="sublabel"` and to the older
     * `slot="description"` (nested inside it), so its presence is the union.
     */
    private _sublabelHasContent;
    private _setSlotState;
    /** Reconcile the 4 slot-presence flags from their slots' assigned content. */
    private _scanSlots;
    /**
     * Inline SVG, not the `i-mdi-loading` utility class: a shadow root cannot see the
     * page's utility CSS, so the light build's icon class would render nothing here.
     * `fill="currentColor"` keeps it on the box's icon colour; the spin comes from the
     * adopted `checkbox.css`.
     */
    protected _renderLoadingIcon(): TemplateResult;
    protected _renderCustomIcon(): TemplateResult | typeof nothing;
    protected _renderLabelBlock(): TemplateResult | typeof nothing;
}
export {};
