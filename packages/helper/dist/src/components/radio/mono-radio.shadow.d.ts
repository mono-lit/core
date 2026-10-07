import { LitElement, nothing, TemplateResult } from 'lit';
declare const MonoRadioShadow_base: import('../../composables/hybird-prop').Constructor<import('./radio-core.js').MonoRadioCoreInterface> & typeof LitElement;
/**
 * Shadow-DOM `mono-radio` (the opt-in SSR build, `@mono-lit/helper/ui/shadow/radio`).
 *
 * Real shadow root + `static styles`, so `@lit-labs/ssr` serializes it to
 * Declarative Shadow DOM and styles are scoped (`mono-radio`→`:host`). The radio
 * circle + dot are pure CSS, and the selected state is the `mono-radio-checked`
 * wrapper class, so the checked state server-renders from `this.modelValue ===
 * this.value` (no icons, no input-attribute concerns). The `label`/`description`
 * slots carry the prop text as native fallback (shown server-side); slot presence
 * is detected in `firstUpdated()` via `assignedNodes()` (DSD assigns at parse time
 * → no `slotchange` after upgrade). Interactivity needs the first client update to
 * flush (so `@change` binds) — hence the defer-hydration poll. Shares all logic
 * with the light build via `MonoRadioCore`; both register `mono-radio`, so a
 * document loads one.
 */
export declare class MonoRadioShadow extends MonoRadioShadow_base {
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
    private _scanSlots;
    protected _renderLabelBlock(): TemplateResult | typeof nothing;
}
export {};
