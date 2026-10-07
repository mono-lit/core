// @unocss-include

import { LitElement, isServer, unsafeCSS, type TemplateResult } from 'lit'
import { customElement } from '../../composables/mono-element'

import { MonoChartCore } from './chart-core.js'
import { toShadowCss, withShadowUtilityStyles } from '../../composables/shadow-css'
import { flushSsrHydration } from '../../composables/hydration-flush'
import chartCss from './chart.css?raw'

const SHADOW_CHART_CSS = toShadowCss(chartCss, { host: 'mono-chart' })

/**
 * Shadow-DOM `<mono-shadow-chart>` (`@mono-lit/helper/ui/shadow/chart`).
 *
 * A chart can't be server-rendered — Chart.js paints onto a canvas at runtime —
 * so SSR emits a deterministic empty `<canvas>` of the right size and the chart
 * is drawn on hydration. `flushSsrHydration` is what makes that happen: under
 * nuxt-ssr-lit an SSR'd element can stay `hasUpdated: false` with updates
 * disabled, so `firstUpdated` would never run and the canvas would stay blank.
 */
@customElement('mono-shadow-chart')
export class MonoChartShadow extends withShadowUtilityStyles(MonoChartCore(LitElement)) {
  static {
    ;(this as typeof LitElement).disableWarning?.('change-in-update')
  }

  static override styles = [unsafeCSS(SHADOW_CHART_CSS)]

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
    'mono-shadow-chart': MonoChartShadow
  }
}
