import { LitElement, TemplateResult } from 'lit';
import { TextareaSlotName } from './textarea-core.js';
declare const MonoTextareaShadow_base: import('../../composables/hybird-prop').Constructor<import('./textarea-core.js').MonoTextareaCoreInterface> & typeof LitElement;
/**
 * Shadow-DOM `mono-textarea` (the opt-in SSR build, `@mono-lit/helper/ui/shadow/textarea`).
 *
 * Real shadow root + `static styles`, so `@lit-labs/ssr` serializes it to
 * Declarative Shadow DOM and styles are scoped (`mono-textarea`→`:host`). The
 * `<textarea>` + label/message/counter render server-side (no icons). The
 * `label`/`helper` slots carry the prop text as native fallback (shown
 * server-side); presence is detected in `firstUpdated()` via `assignedNodes()`
 * (DSD assigns at parse time → no `slotchange` after upgrade) plus `@slotchange`.
 * Interactivity needs the first client update to flush (so `@input` binds) —
 * hence the defer-hydration poll. Shares all logic with the light build via
 * `MonoTextareaCore`; both register `mono-textarea`, so a document loads one.
 */
export declare class MonoTextareaShadow extends MonoTextareaShadow_base {
    static styles: import('lit').CSSResult[];
    protected get _slotsAlwaysRender(): boolean;
    connectedCallback(): void;
    firstUpdated(changed: Map<string, unknown>): void;
    protected updated(changed: Map<string, unknown>): void;
    private _slotFor;
    private _slotHasContent;
    private _onSlotChange;
    /** Reconcile the 2 slot-presence flags from their slots' assigned content. */
    private _scanSlots;
    /** Native `<slot>` carrying the prop fallback as native slot content. */
    protected _slotOutlet(name: TextareaSlotName, fallback?: unknown): TemplateResult;
}
export {};
