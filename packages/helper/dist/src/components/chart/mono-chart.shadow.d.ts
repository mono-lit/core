import { Constructor } from "../../composables/hybird-prop.js";
import { MonoChartCoreInterface } from "./chart-core.js";
import { LitElement, TemplateResult } from "lit";
//#region src/components/chart/mono-chart.shadow.d.ts
declare const MonoChartShadow_base: Constructor<MonoChartCoreInterface> & typeof LitElement;
/**
 * Shadow-DOM `<mono-shadow-chart>` (`@mono-lit/helper/ui/shadow/chart`).
 *
 * A chart can't be server-rendered — Chart.js paints onto a canvas at runtime —
 * so SSR emits a deterministic empty `<canvas>` of the right size and the chart
 * is drawn on hydration. `flushSsrHydration` is what makes that happen: under
 * nuxt-ssr-lit an SSR'd element can stay `hasUpdated: false` with updates
 * disabled, so `firstUpdated` would never run and the canvas would stay blank.
 */
export declare class MonoChartShadow extends MonoChartShadow_base {
  static styles: import("lit").CSSResult[];
  connectedCallback(): void;
  protected render(): TemplateResult;
}
declare global {
  interface HTMLElementTagNameMap {
    'mono-shadow-chart': MonoChartShadow;
  }
}
//#endregion
export {};