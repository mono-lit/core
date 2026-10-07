import { LitElement } from 'lit';
declare const MonoDate_base: import('../../composables/hybird-prop').Constructor<import('./date-core.js').MonoDateCoreInterface> & typeof LitElement;
/**
 * Light-DOM `mono-date` (default build, `@mono-lit/helper/ui/date`).
 *
 * `createRenderRoot()` returns `this`, so it renders into light DOM and inherits
 * the page's global stylesheet (`dist/ui/index.css`, which includes flatpickr's
 * base + the `.mono-flatpickr` calendar theme). All render-mode-agnostic logic —
 * props, hybrid aliases, flatpickr lifecycle, render — is shared with the shadow
 * build (`@mono-lit/helper/ui/shadow/date`) via `MonoDateCore`; both register
 * `mono-date`, so a document loads one.
 */
export declare class MonoDate extends MonoDate_base {
    static styles: import('lit').CSSResult[];
    protected createRenderRoot(): HTMLElement;
}
declare global {
    interface HTMLElementTagNameMap {
        'mono-date': MonoDate;
    }
}
export {};
