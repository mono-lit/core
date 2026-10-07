import { LitElement, TemplateResult } from 'lit';
declare const MonoDateShadow_base: import('../../composables/hybird-prop').Constructor<import('./date-core.js').MonoDateCoreInterface> & typeof LitElement;
/**
 * Shadow-DOM `mono-date` (the opt-in SSR build, `@mono-lit/helper/ui/shadow/date`).
 *
 * Real shadow root + `static styles`, so `@lit-labs/ssr` serializes it to
 * Declarative Shadow DOM and styles are scoped (`mono-date`→`:host`). The field
 * (label / input / message) renders server-side; flatpickr's calendar is created
 * on the client after hydration (it lives in <body>, styled by the global
 * bundle). Interactivity needs the first client update to flush (so flatpickr
 * inits and `@input` binds) — hence the defer-hydration poll. Shares all logic
 * with the light build via `MonoDateCore`; both register `mono-date`, so a
 * document loads one.
 */
export declare class MonoDateShadow extends MonoDateShadow_base {
    static styles: import('lit').CSSResult[];
    connectedCallback(): void;
    /**
     * Inline SVG — the global `.mono-icon`/`i-mdi-*` UnoCSS icons can't reach a
     * shadow root (the mask rule never applies, so an `i-mdi-*` span renders as a
     * solid "black cube"). The `.mono-icon` class is still applied so the existing
     * `.mono-date-icon > .mono-icon` / `.mono-date-clear > .mono-icon` sizing rules
     * take effect; `fill="currentColor"` follows the `--date-muted` icon color.
     *
     * The paths are the exact `mdi:calendar-outline` / `mdi:clock-outline` /
     * `mdi:close` glyph bodies (same MDI set the light build resolves via
     * `i-mdi-*`), so the shadow icons match the light-DOM date pixel-for-pixel.
     */
    protected renderIcon(name: 'calendar' | 'clock' | 'close'): TemplateResult;
}
export {};
