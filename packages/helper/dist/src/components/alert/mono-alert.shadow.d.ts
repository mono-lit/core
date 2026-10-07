import { LitElement, nothing, TemplateResult } from 'lit';
declare const MonoAlertShadow_base: import('../../composables/hybird-prop').Constructor<import('./alert-core.js').MonoAlertCoreInterface> & typeof LitElement;
/**
 * Shadow-DOM alert (the opt-in SSR build, `@mono-lit/helper/ui/shadow/alert`).
 *
 * Registered as `<mono-shadow-alert>` — a distinct tag from the light build's
 * `<mono-alert>` — so both can load side by side. Every region is rendered up
 * front with its prop as the native slot fallback, and the empty ones are marked
 * `[mono-empty]` (alert.css hides them). The body is `slot="body"` AND the
 * unnamed default slot; when either has content it replaces the icon, title and
 * subtitle, exactly as in the light build.
 */
export declare class MonoAlertShadow extends MonoAlertShadow_base {
    static styles: import('lit').CSSResult[];
    firstUpdated(changed: Map<string, unknown>): void;
    protected updated(changed: Map<string, unknown>): void;
    private _slot;
    /**
     * Whether something is ASSIGNED to a slot. Not `flatten: true`: for an empty
     * slot that returns the FALLBACK (the prop text), which would count as content.
     */
    private _assigned;
    private _scanSlots;
    /** Iconify classes are drawn as inline SVG — page utility CSS cannot reach here. */
    protected _renderIconGlyph(): TemplateResult | typeof nothing;
    protected _renderMain(): unknown;
    connectedCallback(): void;
}
declare global {
    interface HTMLElementTagNameMap {
        'mono-shadow-alert': MonoAlertShadow;
    }
}
export {};
