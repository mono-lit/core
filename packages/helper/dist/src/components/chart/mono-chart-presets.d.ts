import { Constructor } from "../../composables/hybird-prop.js";
import { MonoChartType } from "./chart-types.js";
import { MonoChartCoreInterface } from "./chart-core.js";
import { LitElement, TemplateResult } from "lit";
//#region src/components/chart/mono-chart-presets.d.ts
declare const MonoChartBar_base: Constructor<MonoChartCoreInterface> & typeof LitElement;
/** `<mono-chart-bar>` — vertical bars. */
export declare class MonoChartBar extends MonoChartBar_base {
  static styles: import("lit").CSSResult[];
  protected _presetType: MonoChartType;
  protected createRenderRoot(): HTMLElement;
  protected render(): TemplateResult;
}
declare const MonoChartLine_base: Constructor<MonoChartCoreInterface> & typeof LitElement;
/** `<mono-chart-line>` — a line series. */
export declare class MonoChartLine extends MonoChartLine_base {
  static styles: import("lit").CSSResult[];
  protected _presetType: MonoChartType;
  protected createRenderRoot(): HTMLElement;
  protected render(): TemplateResult;
}
declare const MonoChartPie_base: Constructor<MonoChartCoreInterface> & typeof LitElement;
/** `<mono-chart-pie>` — pie slices. */
export declare class MonoChartPie extends MonoChartPie_base {
  static styles: import("lit").CSSResult[];
  protected _presetType: MonoChartType;
  protected createRenderRoot(): HTMLElement;
  protected render(): TemplateResult;
}
declare const MonoChartDoughnut_base: Constructor<MonoChartCoreInterface> & typeof LitElement;
/** `<mono-chart-doughnut>` — a pie with a hole. */
export declare class MonoChartDoughnut extends MonoChartDoughnut_base {
  static styles: import("lit").CSSResult[];
  protected _presetType: MonoChartType;
  protected createRenderRoot(): HTMLElement;
  protected render(): TemplateResult;
}
declare global {
  interface HTMLElementTagNameMap {
    'mono-chart-bar': MonoChartBar;
    'mono-chart-line': MonoChartLine;
    'mono-chart-pie': MonoChartPie;
    'mono-chart-doughnut': MonoChartDoughnut;
  }
}
//#endregion
export {};