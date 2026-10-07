// @unocss-include

import { LitElement, isServer, unsafeCSS, type TemplateResult } from 'lit'
import { customElement } from '../../composables/mono-element'

import { MonoChartCore } from './chart-core.js'
import type { MonoChartType } from './chart-types.js'
import { toShadowCss, withShadowUtilityStyles } from '../../composables/shadow-css'
import { flushSsrHydration } from '../../composables/hydration-flush'
import chartCss from './chart.css?raw'

const SHADOW_CHART_CSS = toShadowCss(chartCss, { host: 'mono-chart' })

/* Shadow twins of the four presets. See `mono-chart.shadow.ts` for why
   `flushSsrHydration` is mandatory here, and `mono-chart-presets.ts` for why
   these are explicit decorated classes rather than a factory. */

/** `<mono-shadow-chart-bar>`. */
@customElement('mono-shadow-chart-bar')
export class MonoChartBarShadow extends withShadowUtilityStyles(MonoChartCore(LitElement)) {
  static {
    ;(this as typeof LitElement).disableWarning?.('change-in-update')
  }
  static override styles = [unsafeCSS(SHADOW_CHART_CSS)]
  protected override _presetType: MonoChartType = 'bar'
  override connectedCallback(): void {
    super.connectedCallback()
    if (isServer) return
    flushSsrHydration(this)
  }
  protected override render(): TemplateResult {
    return this.renderChart()
  }
}

/** `<mono-shadow-chart-line>`. */
@customElement('mono-shadow-chart-line')
export class MonoChartLineShadow extends withShadowUtilityStyles(MonoChartCore(LitElement)) {
  static {
    ;(this as typeof LitElement).disableWarning?.('change-in-update')
  }
  static override styles = [unsafeCSS(SHADOW_CHART_CSS)]
  protected override _presetType: MonoChartType = 'line'
  override connectedCallback(): void {
    super.connectedCallback()
    if (isServer) return
    flushSsrHydration(this)
  }
  protected override render(): TemplateResult {
    return this.renderChart()
  }
}

/** `<mono-shadow-chart-pie>`. */
@customElement('mono-shadow-chart-pie')
export class MonoChartPieShadow extends withShadowUtilityStyles(MonoChartCore(LitElement)) {
  static {
    ;(this as typeof LitElement).disableWarning?.('change-in-update')
  }
  static override styles = [unsafeCSS(SHADOW_CHART_CSS)]
  protected override _presetType: MonoChartType = 'pie'
  override connectedCallback(): void {
    super.connectedCallback()
    if (isServer) return
    flushSsrHydration(this)
  }
  protected override render(): TemplateResult {
    return this.renderChart()
  }
}

/** `<mono-shadow-chart-doughnut>`. */
@customElement('mono-shadow-chart-doughnut')
export class MonoChartDoughnutShadow extends withShadowUtilityStyles(MonoChartCore(LitElement)) {
  static {
    ;(this as typeof LitElement).disableWarning?.('change-in-update')
  }
  static override styles = [unsafeCSS(SHADOW_CHART_CSS)]
  protected override _presetType: MonoChartType = 'doughnut'
  override connectedCallback(): void {
    super.connectedCallback()
    if (isServer) return
    flushSsrHydration(this)
  }
  protected override render(): TemplateResult {
    return this.renderChart()
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'mono-shadow-chart-bar': MonoChartBarShadow
    'mono-shadow-chart-line': MonoChartLineShadow
    'mono-shadow-chart-pie': MonoChartPieShadow
    'mono-shadow-chart-doughnut': MonoChartDoughnutShadow
  }
}
