import { LitElement, TemplateResult } from 'lit';
declare const MonoDropdownShadow_base: import('../../composables/hybird-prop').Constructor<import('./dropdown-core.js').MonoDropdownCoreInterface> & typeof LitElement;
/**
 * Shadow-DOM `mono-dropdown` (SSR build, `@mono-lit/helper/ui/shadow/dropdown`).
 *
 * Real shadow root + `static styles`, so `@lit-labs/ssr` serializes it to
 * Declarative Shadow DOM. Slotting uses native `<slot>` (named `main` for the
 * activator, default for the panel body). Trigger listeners attach to the main
 * slot's assigned elements, re-synced on `slotchange`.
 *
 * Shares all logic with the light build via `MonoDropdownCore`. Both register
 * `mono-dropdown`, so a document loads only one build.
 */
export declare class MonoDropdownShadow extends MonoDropdownShadow_base {
    static styles: import('lit').CSSResult[];
    protected _activeMainNodes(): HTMLElement[];
    /**
     * No-op: the shadow build carries state classes on an inner `.mono-dropdown`
     * root rendered in `render()` (see below), NOT the host. The host's `class` is
     * controlled by the framework (Vue), which would wipe host classes — including
     * `open` — on every re-render, so the panel could never stay open.
     */
    protected _updateHostClasses(): void;
    private _onMainSlotChange;
    protected render(): TemplateResult;
    connectedCallback(): void;
}
export {};
