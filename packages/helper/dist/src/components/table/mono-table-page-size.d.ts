import { Constructor } from "../../composables/hybird-prop.js";
import { MonoTablePageSizeCoreInterface } from "./mono-table-page-size-core.js";
import { LitElement } from "lit";
//#region src/components/table/mono-table-page-size.d.ts
declare const MonoTablePageSize_base: Constructor<MonoTablePageSizeCoreInterface> & typeof LitElement;
/**
 * Light-DOM `mono-table-page-size` (default build, `@mono-lit/helper/ui/table`).
 * All logic lives in `MonoTablePageSizeCore`; the shadow build shares the mixin.
 */
export declare class MonoTablePageSize extends MonoTablePageSize_base {
  static styles: import("lit").CSSResult[];
  protected createRenderRoot(): HTMLElement;
}
declare global {
  interface HTMLElementTagNameMap {
    'mono-table-page-size': MonoTablePageSize;
  }
}
//#endregion
export {};