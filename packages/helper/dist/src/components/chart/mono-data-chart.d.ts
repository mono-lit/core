import { MonoChartController, MonoChartData, MonoChartOptions, MonoChartSource } from "./chart-types.js";
//#region src/components/chart/mono-data-chart.d.ts
export declare function monoChart<T = any>(source?: MonoChartSource<T> | T[] | MonoChartData | null, opts?: MonoChartOptions): MonoChartController<T>;
//#endregion
export { monoChart as controlMonoChart };