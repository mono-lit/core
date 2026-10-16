import { Constructor } from "../../composables/hybird-prop.js";
import { MonoTablePageSizeCoreInterface } from "./mono-table-page-size-core.js";
import { LitElement } from "lit";
//#region src/components/table/mono-table-page-size.shadow.d.ts
declare const MonoTablePageSizeShadow_base: Constructor<MonoTablePageSizeCoreInterface> & typeof LitElement;
/**
 * Shadow-DOM `mono-table-page-size` (SSR build, `@mono-lit/helper/ui/shadow/table`).
 * Shares all logic with the light build via `MonoTablePageSizeCore`.
 */
export declare class MonoTablePageSizeShadow extends MonoTablePageSizeShadow_base {
  static styles: import("lit").CSSResult[];
  connectedCallback(): void;
}
//#endregion
export {};