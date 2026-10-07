import { LitElement, TemplateResult } from 'lit';
import { Constructor } from '../../composables/hybird-prop';
import { CssSizeValue } from '../../composables/css-size';
import { ChartCssClass, MonoChartColor, MonoChartController, MonoChartData, MonoChartType } from './chart-types.js';
export declare function loadChartJs(): Promise<any>;
/** Public surface added by the chart core mixin. */
export declare class MonoChartCoreInterface {
    dataChart?: MonoChartController;
    /** Pull `controlMonoChart({ props })` onto this element. */
    protected _applyControllerProps(): void;
    type?: MonoChartType;
    /** Set by the presets to lock their type; undefined on the generic element. */
    protected _presetType?: MonoChartType;
    /** The shared template — each build calls this from its own `render()`. */
    protected renderChart(): TemplateResult;
    data?: MonoChartData;
    chartOptions?: Record<string, unknown>;
    width?: CssSizeValue;
    height?: CssSizeValue;
    aspectRatio: number;
    legend: boolean | string;
    title: string;
    stacked: boolean;
    color?: MonoChartColor | string;
    colors?: string | string[];
    cssClass: ChartCssClass;
    cssClassName: string;
    /** The live chart.js instance, or null. */
    readonly chart: unknown;
    /** Force a full teardown + recreate. */
    rebuild(): void;
}
/**
 * `MonoChartCore` — render-mode-agnostic logic for the chart elements.
 *
 * It owns the imperative Chart.js lifecycle, following the same shape as the
 * flatpickr wrapper in `date-core.ts`: create in `firstUpdated` behind an
 * `isServer` guard and a dynamic import, split `updated()` into a cheap data
 * update vs a full rebuild, and destroy in `disconnectedCallback` BEFORE
 * `super`. A `ResizeObserver` is added on top because, unlike flatpickr, a
 * canvas needs to be told when its box changes.
 */
export declare const MonoChartCore: <T extends Constructor<LitElement>>(superClass: T) => Constructor<MonoChartCoreInterface> & T;
