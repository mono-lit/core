import { LitElement, TemplateResult } from 'lit';
import { MonoChartType } from './chart-types.js';
declare const MonoChartBar_base: import('../../composables/hybird-prop').Constructor<import('./chart-core.js').MonoChartCoreInterface> & typeof LitElement;
/** `<mono-chart-bar>` — vertical bars. */
export declare class MonoChartBar extends MonoChartBar_base {
    static styles: import('lit').CSSResult[];
    protected _presetType: MonoChartType;
    protected createRenderRoot(): HTMLElement;
    protected render(): TemplateResult;
}
declare const MonoChartLine_base: import('../../composables/hybird-prop').Constructor<import('./chart-core.js').MonoChartCoreInterface> & typeof LitElement;
/** `<mono-chart-line>` — a line series. */
export declare class MonoChartLine extends MonoChartLine_base {
    static styles: import('lit').CSSResult[];
    protected _presetType: MonoChartType;
    protected createRenderRoot(): HTMLElement;
    protected render(): TemplateResult;
}
declare const MonoChartPie_base: import('../../composables/hybird-prop').Constructor<import('./chart-core.js').MonoChartCoreInterface> & typeof LitElement;
/** `<mono-chart-pie>` — pie slices. */
export declare class MonoChartPie extends MonoChartPie_base {
    static styles: import('lit').CSSResult[];
    protected _presetType: MonoChartType;
    protected createRenderRoot(): HTMLElement;
    protected render(): TemplateResult;
}
declare const MonoChartDoughnut_base: import('../../composables/hybird-prop').Constructor<import('./chart-core.js').MonoChartCoreInterface> & typeof LitElement;
/** `<mono-chart-doughnut>` — a pie with a hole. */
export declare class MonoChartDoughnut extends MonoChartDoughnut_base {
    static styles: import('lit').CSSResult[];
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
export {};
