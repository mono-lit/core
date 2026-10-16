import { Constructor } from "../../composables/hybird-prop.js";
import { MonoTableSummaryCoreInterface } from "./mono-table-summary-core.js";
import { LitElement } from "lit";
//#region src/components/table/mono-table-summary.shadow.d.ts
declare const MonoTableSummaryShadow_base: Constructor<MonoTableSummaryCoreInterface> & typeof LitElement;
/**
 * Shadow-DOM `mono-shadow-table-summary` (the opt-in SSR build,
 * `@mono-lit/helper/ui/shadow/table`). Renders into a real shadow root so
 * `@lit-labs/ssr` can serialize it to Declarative Shadow DOM. Shares all logic
 * with the light build via `MonoTableSummaryCore`. Registers the `mono-shadow-*`
 * tag — DISTINCT from the light `<mono-table-summary>` — so both can coexist.
 */
export declare class MonoTableSummaryShadow extends MonoTableSummaryShadow_base {
  static styles: import("lit").CSSResult[];
  connectedCallback(): void;
}
//#endregion
export {};