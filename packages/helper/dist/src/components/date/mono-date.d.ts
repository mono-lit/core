import { Constructor } from "../../composables/hybird-prop.js";
import { MonoDateCoreInterface } from "./date-core.js";
import { LitElement } from "lit";
//#region src/components/date/mono-date.d.ts
declare const MonoDate_base: Constructor<MonoDateCoreInterface> & typeof LitElement;
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
  static styles: import("lit").CSSResult[];
  protected createRenderRoot(): HTMLElement;
}
declare global {
  interface HTMLElementTagNameMap {
    'mono-date': MonoDate;
  }
}
//#endregion
export {};