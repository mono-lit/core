import { LitElement, TemplateResult } from 'lit';
import { DrawerSlotName } from './drawer-core.js';
declare const MonoDrawerShadow_base: import('../../composables/hybird-prop').Constructor<import('./drawer-core.js').MonoDrawerCoreInterface> & typeof LitElement;
/**
 * Shadow-DOM `mono-drawer` (the opt-in SSR build, `@mono-lit/helper/ui/shadow/drawer`).
 *
 * Real shadow root + `static styles`, so `@lit-labs/ssr` serializes it to
 * Declarative Shadow DOM. Unlike the light build (which renders into a `<body>`
 * portal that IS the `.mono-drawer` root), the shadow build can't portal — so it
 * renders an inner `.mono-drawer` root inside the shadow tree and carries the
 * state classes + `--drawer-z` there (mirrors `mono-modal.shadow.ts`). The
 * overlay/panel stay `position: fixed`; z-stacking / scroll-lock / Escape all
 * flow through the SSR-safe `popup-stack`. Slots are native `<slot>`s (default =
 * body), scanned in `firstUpdated`/`updated`. Shares all logic with the light
 * build via `MonoDrawerCore`; both register `mono-drawer`.
 */
export declare class MonoDrawerShadow extends MonoDrawerShadow_base {
    static styles: import('lit').CSSResult[];
    protected get _slotsAlwaysRender(): boolean;
    /** Shadow build: the size-vars live on the inner `.mono-drawer` root. */
    protected _setDrawerSizeVar(name: string, value: string): void;
    connectedCallback(): void;
    firstUpdated(changed: Map<string, unknown>): void;
    protected updated(changed: Map<string, unknown>): void;
    private _slotFor;
    private _defaultSlot;
    private _slotHasContent;
    private _onSlotChange;
    /** Reconcile the 3 slot-presence flags from their slots' assigned content.
     *  Body is the default (unnamed) slot OR an explicit `slot="body"`. */
    private _scanSlots;
    /**
     * Native `<slot>`. Body accepts both the default (unnamed) slot and an
     * explicit `slot="body"` — matching the light build's capture, which treats
     * unslotted children and `slot="body"` alike.
     */
    protected _slotOutlet(name: DrawerSlotName, fallback?: unknown): TemplateResult;
    /** Inline SVG — the global `.mono-icon`/`i-mdi-close` UnoCSS icon can't reach
     *  a shadow root. */
    protected renderIcon(_name: 'close'): TemplateResult;
    /** Ids are scoped to this shadow root, so a constant is unique enough — and,
     *  unlike a counter, the same on the server and the client. */
    protected get _headingIdBase(): string;
    protected render(): TemplateResult;
}
export {};
