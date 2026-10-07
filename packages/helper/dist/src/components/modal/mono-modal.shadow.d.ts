import { LitElement, TemplateResult } from 'lit';
import { ModalSlotName } from './modal-core.js';
declare const MonoModalShadow_base: import('../../composables/hybird-prop').Constructor<import('./modal-core.js').MonoModalCoreInterface> & typeof LitElement;
/**
 * Shadow-DOM `mono-modal` (the opt-in SSR build, `@mono-lit/helper/ui/shadow/modal`).
 *
 * Real shadow root + `static styles`, so `@lit-labs/ssr` serializes it to
 * Declarative Shadow DOM. Unlike the light build (which renders into a `<body>`
 * portal that IS the `.mono-modal` root), the shadow build can't portal — so it
 * renders an inner `.mono-modal` root inside the shadow tree and carries the
 * state classes + `--modal-z` there (mirrors `mono-dropdown.shadow.ts`'s inner
 * root). The overlay/panel stay `position: fixed`; z-stacking / scroll-lock /
 * Escape all flow through the SSR-safe `popup-stack`. Slots are native `<slot>`s
 * (default = body), scanned in `firstUpdated`/`updated`. Shares all logic with
 * the light build via `MonoModalCore`; both register `mono-modal`.
 */
export declare class MonoModalShadow extends MonoModalShadow_base {
    static styles: import('lit').CSSResult[];
    protected get _slotsAlwaysRender(): boolean;
    connectedCallback(): void;
    firstUpdated(changed: Map<string, unknown>): void;
    protected updated(changed: Map<string, unknown>): void;
    /** `string`, not `ModalSlotName` — this also resolves the alias names. */
    private _slotFor;
    private _defaultSlot;
    private _slotHasContent;
    private _onSlotChange;
    /**
     * Does this region have content under EITHER of its names? `head`/`foot` each
     * also answer to an alias (`header`/`footer`), so presence is the union.
     */
    private _regionHasContent;
    /** Reconcile the 4 slot-presence flags from their slots' assigned content.
     *  Body is the default (unnamed) slot OR an explicit `slot="body"`. */
    private _scanSlots;
    /**
     * Native `<slot>`. Body accepts both the default (unnamed) slot and an
     * explicit `slot="body"` — matching the light build's capture, which treats
     * unslotted children and `slot="body"` alike.
     */
    protected _slotOutlet(name: ModalSlotName, fallback?: unknown): TemplateResult;
    /** Inline SVG — the global `.mono-icon`/`i-mdi-close` UnoCSS icon can't reach
     *  a shadow root. */
    protected renderIcon(_name: 'close'): TemplateResult;
    /** Ids are scoped to this shadow root, so a constant is unique enough — and,
     *  unlike a counter, the same on the server and the client. */
    protected get _headingIdBase(): string;
    protected render(): TemplateResult;
}
export {};
