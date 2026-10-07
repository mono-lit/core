import { LitElement, TemplateResult } from 'lit';
import { SelectSlotName } from './select-core.js';
declare const MonoSelectShadow_base: import('../../composables/hybird-prop').Constructor<import('./select-core.js').MonoSelectCoreInterface> & typeof LitElement;
/**
 * Shadow-DOM `mono-select` (the opt-in SSR build, `@mono-lit/helper/ui/shadow/select`).
 *
 * Real shadow root + `static styles`, so `@lit-labs/ssr` serializes it to
 * Declarative Shadow DOM and styles are scoped (`mono-select`→`:host`). The
 * collapsed control (label + trigger + placeholder + message) server-renders;
 * the dropdown panel is closed server-side and the DataSource (async) is
 * client-only — options populate after hydration. The panel stays in the shadow
 * root (the shared `PopupPortalController` skips the body portal for a shadow
 * host and CSS positions it under the `position:relative` `.mono-select`).
 *
 * Slotting uses native `<slot>`: `label`/`helper` carry the prop text as native
 * fallback (shown server-side); presence is detected in `firstUpdated()` via
 * `assignedNodes()` (DSD assigns at parse time → no `slotchange` after upgrade)
 * plus `@slotchange` for later changes. Interactivity needs the first client
 * update to flush — hence the defer-hydration poll. Shares all logic with the
 * light build via `MonoSelectCore`; both register `mono-select`, so a document
 * loads only one build.
 */
export declare class MonoSelectShadow extends MonoSelectShadow_base {
    static styles: import('lit').CSSResult[];
    protected get _slotsAlwaysRender(): boolean;
    connectedCallback(): void;
    firstUpdated(changed: Map<string, unknown>): void;
    protected updated(changed: Map<string, unknown>): void;
    /** A wrapper appeared after connect — the flag is all this build needs, projection does the rest. */
    protected _onLateListSlot(): void;
    private _scanSlots;
    private _slotHasContent;
    private _onSlotChange;
    /**
     * The consumer's list wrapper, PROJECTED rather than moved.
     *
     * Projection is what makes this work in a shadow root at all: slotted content stays in the light
     * DOM, so the app's own stylesheet still reaches it. Moving those nodes inside the shadow root
     * would cut them off from it — the same reason this build inlines SVGs instead of icon classes.
     */
    protected renderListSlot(): TemplateResult;
    /** Native `<slot>` carrying the prop fallback as native slot content. */
    protected _slotOutlet(name: SelectSlotName, fallback?: unknown): TemplateResult;
    /** Inline SVG — the global `.mono-icon`/`i-mdi-*` UnoCSS icons can't reach a
     *  shadow root. */
    protected renderIcon(name: 'close' | 'chevron'): TemplateResult;
}
export {};
