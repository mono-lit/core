import { Constructor } from "../../composables/hybird-prop.js";
import { MonoChartType } from "./chart-types.js";
import { MonoChartCoreInterface } from "./chart-core.js";
import { LitElement, TemplateResult } from "lit";
//#region src/components/chart/mono-chart-presets.shadow.d.ts
declare const MonoChartBarShadow_base: Constructor<MonoChartCoreInterface> & typeof LitElement;
/** `<mono-shadow-chart-bar>`. */
export declare class MonoChartBarShadow extends MonoChartBarShadow_base {
  static styles: import("lit").CSSResult[];
  protected _presetType: MonoChartType;
  connectedCallback(): void;
  protected render(): TemplateResult;
}
declare const MonoChartLineShadow_base: Constructor<MonoChartCoreInterface> & typeof LitElement;
/** `<mono-shadow-chart-line>`. */
export declare class MonoChartLineShadow extends MonoChartLineShadow_base {
  static styles: import("lit").CSSResult[];
  protected _presetType: MonoChartType;
  connectedCallback(): void;
  protected render(): TemplateResult;
}
declare const MonoChartPieShadow_base: Constructor<MonoChartCoreInterface> & typeof LitElement;
/** `<mono-shadow-chart-pie>`. */
export declare class MonoChartPieShadow extends MonoChartPieShadow_base {
  static styles: import("lit").CSSResult[];
  protected _presetType: MonoChartType;
  connectedCallback(): void;
  protected render(): TemplateResult;
}
declare const MonoChartDoughnutShadow_base: Constructor<MonoChartCoreInterface> & typeof LitElement;
/** `<mono-shadow-chart-doughnut>`. */
export declare class MonoChartDoughnutShadow extends MonoChartDoughnutShadow_base {
  static styles: import("lit").CSSResult[];
  protected _presetType: MonoChartType;
  connectedCallback(): void;
  protected render(): TemplateResult;
}
declare global {
  interface HTMLElementTagNameMap {
    'mono-shadow-chart-bar': MonoChartBarShadow;
    'mono-shadow-chart-line': MonoChartLineShadow;
    'mono-shadow-chart-pie': MonoChartPieShadow;
    'mono-shadow-chart-doughnut': MonoChartDoughnutShadow;
  }
}
//#endregion
export {};