import { LitElement, nothing, TemplateResult } from 'lit';
declare const MonoSwitchShadow_base: import('../../composables/hybird-prop').Constructor<import('./switch-core.js').MonoSwitchCoreInterface> & typeof LitElement;
/**
 * Shadow-DOM `mono-switch` (the opt-in SSR build, `@mono-lit/helper/ui/shadow/switch`).
 *
 * Real shadow root + `static styles`, so `@lit-labs/ssr` serializes it to
 * Declarative Shadow DOM and styles are scoped (`mono-switch`→`:host`). The
 * track + thumb are pure CSS and the checked state is the `mono-switch-checked`
 * wrapper class, so it server-renders from `this.checked` (no icons). The
 * `label`/`description` slots carry the prop text as native fallback (shown
 * server-side); presence is detected in `firstUpdated()` via `assignedNodes()`
 * (DSD assigns at parse time → no `slotchange` after upgrade) + `@slotchange`
 * for later changes. Interactivity needs the first client update to flush (so
 * `@change` binds) — hence the defer-hydration poll. Shares all logic with the
 * light build via `MonoSwitchCore`; both register `mono-switch`, so a document
 * loads only one build.
 */
export declare class MonoSwitchShadow extends MonoSwitchShadow_base {
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
    /** Reconcile the 2 slot-presence flags from their slots' assigned content. */
    private _scanSlots;
    protected _renderLabelBlock(): TemplateResult | typeof nothing;
}
export {};
