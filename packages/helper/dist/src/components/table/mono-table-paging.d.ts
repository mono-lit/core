import { Constructor } from "../../composables/hybird-prop.js";
import { MonoTablePagingCoreInterface } from "./mono-table-paging-core.js";
import { LitElement } from "lit";
//#region src/components/table/mono-table-paging.d.ts
declare const MonoTablePaging_base: Constructor<MonoTablePagingCoreInterface> & typeof LitElement;
/**
 * Light-DOM `mono-table-paging` (default build, `@mono-lit/helper/ui/table`).
 * All logic lives in `MonoTablePagingCore`; the shadow build shares the mixin.
 */
export declare class MonoTablePaging extends MonoTablePaging_base {
  static styles: import("lit").CSSResult[];
  protected createRenderRoot(): HTMLElement;
}
declare global {
  interface HTMLElementTagNameMap {
    'mono-table-paging': MonoTablePaging;
  }
}
//#endregion
export {};