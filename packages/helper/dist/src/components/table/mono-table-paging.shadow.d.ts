import { Constructor } from "../../composables/hybird-prop.js";
import { MonoTablePagingCoreInterface } from "./mono-table-paging-core.js";
import { LitElement } from "lit";
//#region src/components/table/mono-table-paging.shadow.d.ts
declare const MonoTablePagingShadow_base: Constructor<MonoTablePagingCoreInterface> & typeof LitElement;
/**
 * Shadow-DOM `mono-table-paging` (SSR build, `@mono-lit/helper/ui/shadow/table`).
 * Shares all logic with the light build via `MonoTablePagingCore`.
 */
export declare class MonoTablePagingShadow extends MonoTablePagingShadow_base {
  static styles: import("lit").CSSResult[];
  connectedCallback(): void;
}
//#endregion
export {};