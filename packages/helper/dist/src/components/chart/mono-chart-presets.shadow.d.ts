import { LitElement, TemplateResult } from 'lit';
import { MonoChartType } from './chart-types.js';
declare const MonoChartBarShadow_base: import('../../composables/hybird-prop').Constructor<import('./chart-core.js').MonoChartCoreInterface> & typeof LitElement;
/** `<mono-shadow-chart-bar>`. */
export declare class MonoChartBarShadow extends MonoChartBarShadow_base {
    static styles: import('lit').CSSResult[];
    protected _presetType: MonoChartType;
    connectedCallback(): void;
    protected render(): TemplateResult;
}
declare const MonoChartLineShadow_base: import('../../composables/hybird-prop').Constructor<import('./chart-core.js').MonoChartCoreInterface> & typeof LitElement;
/** `<mono-shadow-chart-line>`. */
export declare class MonoChartLineShadow extends MonoChartLineShadow_base {
    static styles: import('lit').CSSResult[];
    protected _presetType: MonoChartType;
    connectedCallback(): void;
    protected render(): TemplateResult;
}
declare const MonoChartPieShadow_base: import('../../composables/hybird-prop').Constructor<import('./chart-core.js').MonoChartCoreInterface> & typeof LitElement;
/** `<mono-shadow-chart-pie>`. */
export declare class MonoChartPieShadow extends MonoChartPieShadow_base {
    static styles: import('lit').CSSResult[];
    protected _presetType: MonoChartType;
    connectedCallback(): void;
    protected render(): TemplateResult;
}
declare const MonoChartDoughnutShadow_base: import('../../composables/hybird-prop').Constructor<import('./chart-core.js').MonoChartCoreInterface> & typeof LitElement;
/** `<mono-shadow-chart-doughnut>`. */
export declare class MonoChartDoughnutShadow extends MonoChartDoughnutShadow_base {
    static styles: import('lit').CSSResult[];
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
export {};
