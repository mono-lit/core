// @unocss-include

import { LitElement, unsafeCSS, type TemplateResult } from 'lit'
import { customElement } from '../../composables/mono-element'

import { MonoChartCore } from './chart-core.js'
import type { MonoChartType } from './chart-types.js'
import chartCss from './chart.css?raw'

/*
 * The four type presets. Each is `<mono-chart>` with `type` fixed, so the markup
 * states its intent and the type can't drift. Everything else — props,
 * controller binding, the Chart.js lifecycle — comes from the shared core.
 *
 * They are written as explicit decorated classes rather than generated from a
 * factory: the docs type-table extractor walks for `@customElement(...)` on a
 * class DECLARATION, so a factory would silently drop them from the props table.
 */

/** `<mono-chart-bar>` — vertical bars. */
@customElement('mono-chart-bar')
export class MonoChartBar extends MonoChartCore(LitElement) {
  static override styles = [unsafeCSS(chartCss)]
  protected override _presetType: MonoChartType = 'bar'
  protected override createRenderRoot(): HTMLElement {
    return this
  }
  protected override render(): TemplateResult {
    return this.renderChart()
  }
}

/** `<mono-chart-line>` — a line series. */
@customElement('mono-chart-line')
export class MonoChartLine extends MonoChartCore(LitElement) {
  static override styles = [unsafeCSS(chartCss)]
  protected override _presetType: MonoChartType = 'line'
  protected override createRenderRoot(): HTMLElement {
    return this
  }
  protected override render(): TemplateResult {
    return this.renderChart()
  }
}

/** `<mono-chart-pie>` — pie slices. */
@customElement('mono-chart-pie')
export class MonoChartPie extends MonoChartCore(LitElement) {
  static override styles = [unsafeCSS(chartCss)]
  protected override _presetType: MonoChartType = 'pie'
  protected override createRenderRoot(): HTMLElement {
    return this
  }
  protected override render(): TemplateResult {
    return this.renderChart()
  }
}

/** `<mono-chart-doughnut>` — a pie with a hole. */
@customElement('mono-chart-doughnut')
export class MonoChartDoughnut extends MonoChartCore(LitElement) {
  static override styles = [unsafeCSS(chartCss)]
  protected override _presetType: MonoChartType = 'doughnut'
  protected override createRenderRoot(): HTMLElement {
    return this
  }
  protected override render(): TemplateResult {
    return this.renderChart()
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'mono-chart-bar': MonoChartBar
    'mono-chart-line': MonoChartLine
    'mono-chart-pie': MonoChartPie
    'mono-chart-doughnut': MonoChartDoughnut
  }
}
