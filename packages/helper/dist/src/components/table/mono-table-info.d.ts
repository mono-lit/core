import { Constructor } from "../../composables/hybird-prop.js";
import { MonoTableInfoCoreInterface } from "./mono-table-info-core.js";
import { LitElement } from "lit";
//#region src/components/table/mono-table-info.d.ts
declare const MonoTableInfo_base: Constructor<MonoTableInfoCoreInterface> & typeof LitElement;
/**
 * Light-DOM `mono-table-info` (default build, `@mono-lit/helper/ui/table`). Renders
 * into the host (`createRenderRoot`→`this`, styled by the global
 * `dist/ui/index.css`). All logic lives in `MonoTableInfoCore`; the shadow build
 * (`@mono-lit/helper/ui/shadow/table`) shares the mixin. Both register the same tag,
 * so a document loads only one.
 */
export declare class MonoTableInfo extends MonoTableInfo_base {
  static styles: import("lit").CSSResult[];
  protected createRenderRoot(): HTMLElement;
}
declare global {
  interface HTMLElementTagNameMap {
    'mono-table-info': MonoTableInfo;
  }
}
//#endregion
export {};