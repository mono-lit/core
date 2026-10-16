import { Constructor } from "../../composables/hybird-prop.js";
import { MonoTableInfoCoreInterface } from "./mono-table-info-core.js";
import { LitElement } from "lit";
//#region src/components/table/mono-table-info.shadow.d.ts
declare const MonoTableInfoShadow_base: Constructor<MonoTableInfoCoreInterface> & typeof LitElement;
/**
 * Shadow-DOM `mono-shadow-table-info` (the opt-in SSR build,
 * `@mono-lit/helper/ui/shadow/table`). Renders into a real shadow root so
 * `@lit-labs/ssr` can serialize it to Declarative Shadow DOM. Shares all logic
 * with the light build via `MonoTableInfoCore`. Registers the `mono-shadow-*`
 * tag — DISTINCT from the light `<mono-table-info>` — so both can coexist.
 */
export declare class MonoTableInfoShadow extends MonoTableInfoShadow_base {
  static styles: import("lit").CSSResult[];
  connectedCallback(): void;
}
//#endregion
export {};