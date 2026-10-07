// @unocss-include

import { LitElement, html, isServer, nothing, type TemplateResult } from 'lit'
import { property, state, query } from 'lit/decorators.js'
import { styleMap } from 'lit/directives/style-map.js'
import type { StyleInfo } from 'lit/directives/style-map.js'

import {
  booleanStringConverter,
  defineHybridPropAlias,
  defineHybridPropAliases,
  numberStringConverter,
  type Constructor,
} from '../../composables/hybird-prop'
import { toCssSize, type CssSizeValue } from '../../composables/css-size'
import { applyProps, detachEventHandlers } from '../../composables/element-props'
import { monoPendingGrace } from '../../composables/mono-skeleton'
import type {
  ChartCssClass,
  MonoChartColor,
  MonoChartController,
  MonoChartData,
  MonoChartType,
} from './chart-types.js'

/**
 * The mono color names a chart accepts wherever a color is expected. They map to
 * the `--_mono-chart-<name>` resolvers in chart.css, which chain through the
 * public `--mono-chart-*` overrides to the Basecoat tokens — `chart-1` … `chart-5`
 * are Basecoat's own chart palette (`--chart-1` … `--chart-5`), the roles are the
 * page's. `surface` is internal: the hairline between slices.
 */
const MONO_COLOR_NAMES = new Set([
  'chart-1',
  'chart-2',
  'chart-3',
  'chart-4',
  'chart-5',
  'primary',
  'secondary',
  'accent',
  'success',
  'warning',
  'danger',
  'info',
  'surface',
])

/** Used before the element is in the DOM (SSR) or if a token resolves empty — ONE, light. */
const MONO_COLOR_FALLBACK: Record<string, string> = {
  'chart-1': 'oklch(0.859 0.069 267.7)',
  'chart-2': 'oklch(0.735 0.12 268.04)',
  'chart-3': 'oklch(0.61 0.12 267.95)',
  'chart-4': 'oklch(0.485 0.119 267.92)',
  'chart-5': 'oklch(0.36 0.12 268.21)',
  primary: 'oklch(0.299 0.119 267.96)',
  secondary: 'oklch(0.554 0.041 257.42)',
  accent: 'oklch(0.735 0.12 268.04)',
  success: 'oklch(0.5239 0.0917 180.004)',
  warning: 'oklch(0.5423 0.1066 70.504)',
  danger: 'oklch(0.561 0.202 26.71)',
  info: 'oklch(0.431 0.163 267.72)',
  surface: 'oklch(0.973 0.007 268.55)',
}

/** The tooltip lines come from the data (labels, formatted values) — never markup. */
function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c] as string)
}

/**
 * Cached loader for the OPTIONAL `chart.js` peer.
 *
 * `chart.js/auto` self-registers every controller/scale/element — the right
 * trade here because the library is externalized, so the consumer's bundler
 * owns the cost and tree-shaking on our side would buy nothing.
 */
let _chartPromise: Promise<any> | null = null
export function loadChartJs(): Promise<any> {
  _chartPromise ??= import('chart.js/auto')
    .then((m: any) => m?.default ?? m)
    .catch((err) => {
      _chartPromise = null // let a later attempt retry
      throw new Error(
        '[mono-chart] needs the optional peer dependency "chart.js". ' +
          'Install it in your app: pnpm add chart.js@4.5.1' +
          (err?.message ? ` (original error: ${err.message})` : ''),
      )
    })
  return _chartPromise
}

/** Public surface added by the chart core mixin. */
export declare class MonoChartCoreInterface {
  dataChart?: MonoChartController
  /** Pull `controlMonoChart({ props })` onto this element. */
  protected _applyControllerProps(): void
  type?: MonoChartType
  /** Set by the presets to lock their type; undefined on the generic element. */
  protected _presetType?: MonoChartType
  /** The shared template — each build calls this from its own `render()`. */
  protected renderChart(): TemplateResult
  data?: MonoChartData
  chartOptions?: Record<string, unknown>
  width?: CssSizeValue
  height?: CssSizeValue
  aspectRatio: number
  legend: boolean | string
  title: string
  stacked: boolean
  color?: MonoChartColor | string
  colors?: string | string[]
  cssClass: ChartCssClass
  cssClassName: string
  /** The live chart.js instance, or null. */
  readonly chart: unknown
  /** Force a full teardown + recreate. */
  rebuild(): void
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
export const MonoChartCore = <T extends Constructor<LitElement>>(superClass: T) => {
  class MonoChartCoreClass extends superClass {
    constructor(...args: any[]) {
      super(...args)
      defineHybridPropAliases(this, ['dataChart', 'chartOptions', 'aspectRatio', 'cssClass'])
      // Renamed controller binding — `:control-chart` / `:controlChart` alias the
      // canonical `dataChart` (no breaking change; both spellings work).
      defineHybridPropAlias(this, 'controlChart', 'dataChart')
      for (const alias of ['css-class', 'cssclass']) {
        Object.defineProperty(this, alias, {
          get: () => this.cssClass,
          set: (value: unknown) => this._setCssClass(value),
          configurable: true,
          enumerable: false,
        })
      }
    }

    /** The chart controller (bind with `.prop`). */
    @property({ attribute: false })
    dataChart?: MonoChartController

    /**
     * Automatic skeleton (`pending`, composables/mono-skeleton.ts): DATA-driven — pending
     * until the bound controller has loaded (or raw `data` was given); without either,
     * one tick of grace for a late binding, then nothing to wait for.
     */
    static monoPendingAuto = 'data' as const

    protected _monoPendingReady(): boolean {
      const ctrl = this.dataChart
      if (!ctrl) return this.data != null || monoPendingGrace(this)
      if (ctrl.loading) return false
      return monoPendingGrace(this) || ctrl.data().datasets.length > 0
    }

    /**
     * Chart type. Left undefined so a bound controller's `type` can win when the
     * consumer doesn't state one; `<mono-chart>` falls back to `'bar'`.
     */
    @property({ type: String })
    type?: MonoChartType

    /** Locked by the presets (`mono-chart-bar` → `'bar'`); unset on the base. */
    protected _presetType?: MonoChartType

    /** Raw chart.js data, for use without a controller. Bind with `.prop`. */
    @property({ attribute: false })
    data?: MonoChartData

    /** Raw chart.js options, merged over the defaults. Bind with `.prop`. */
    @property({ attribute: false })
    chartOptions?: Record<string, unknown>

    @property({ type: String })
    width?: CssSizeValue

    @property({ type: String })
    height?: CssSizeValue

    @property({ attribute: 'aspect-ratio', converter: numberStringConverter })
    aspectRatio = 2

    /** `true` / `false`, or a position: `top` | `bottom` | `left` | `right`. */
    @property()
    legend: boolean | string = true

    @property({ type: String })
    title = ''

    @property({ converter: booleanStringConverter })
    stacked = false

    /**
     * Single accent for every dataset — a mono color name (`primary`,
     * `success`, `danger` …) or any CSS color. `colors` wins when both are set.
     */
    @property({ type: String })
    color?: MonoChartColor | string

    /**
     * Palette. A comma-separated attribute (`colors="success,danger,warning"`)
     * or an array via `.prop`. Entries may be mono color names or CSS colors,
     * mixed freely.
     */
    @property({ attribute: false })
    colors?: string | string[]

    @property({ attribute: false })
    cssClass: ChartCssClass = {}

    @property({ attribute: false })
    cssClassName = ''

    /** Set when the optional peer is missing or chart.js threw. */
    @state()
    protected _error = ''

    @query('canvas')
    protected _canvas?: HTMLCanvasElement

    @query('.mono-chart-tooltip')
    protected _tooltipEl?: HTMLElement

    private _chart: any = null
    private _ro?: ResizeObserver
    protected _off?: () => void
    /** Guards against two in-flight builds racing (rapid type changes). */
    private _buildToken = 0

    /** Props whose change requires destroying and recreating the chart. */
    private static readonly _rebuildKeys = [
      'type',
      'chartOptions',
      'legend',
      'title',
      'stacked',
      'aspectRatio',
    ]

    static get observedAttributes(): string[] {
      // @ts-ignore — `super` statics are untyped through the generic mixin base.
      const base: string[] = super.observedAttributes ?? []
      return [...base, 'aspectratio', 'chartoptions', 'css-class', 'cssclass', 'colors']
    }

    override attributeChangedCallback(
      name: string,
      old: string | null,
      value: string | null,
    ): void {
      super.attributeChangedCallback(name, old, value)
      if (old === value) return
      if (name === 'css-class' || name === 'cssclass') this._setCssClass(value)
      else if (name === 'colors') this.colors = value ?? undefined
    }

    private _setCssClass(value: unknown): void {
      if (value == null) {
        this.cssClass = {}
        this.cssClassName = ''
        return
      }
      if (typeof value === 'object') {
        this.cssClass = value as ChartCssClass
        return
      }
      const trimmed = String(value).trim()
      if (!trimmed) {
        this.cssClass = {}
        this.cssClassName = ''
        return
      }
      if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
        try {
          this.cssClass = JSON.parse(trimmed) as ChartCssClass
          return
        } catch {
          /* fall through to a single root class */
        }
      }
      this.cssClassName = trimmed
    }

    /** The live chart.js instance, or null before it mounts. */
    get chart(): unknown {
      return this._chart
    }

    /* --------------------------- controller wiring -------------------------- */

    override connectedCallback(): void {
      super.connectedCallback()
      this._subscribe()
      if (!isServer) {
        window.addEventListener('theme-changed', this._onThemeChanged)
        this._watchMode()
      }
    }

    override disconnectedCallback(): void {
      this._off?.()
      this._off = undefined
      if (!isServer) {
        window.removeEventListener('theme-changed', this._onThemeChanged)
        this._modeObserver?.disconnect()
        this._modeObserver = undefined
        this._modeQuery?.removeEventListener('change', this._onThemeChanged)
        this._modeQuery = undefined
      }
      // Destroy BEFORE super so the canvas is still in the tree for chart.js.
      this._destroyChart()
      super.disconnectedCallback()
    }

    /**
     * Repaint when the app switches theme or color preset.
     *
     * Every other component follows a theme change for free — the class swap
     * re-cascades and CSS repaints. A chart can't: it's a bitmap painted with
     * values that were resolved once, so it would keep the OLD palette (and old
     * axis/label colors) until something forced a redraw. `applyTheme()` fires
     * `theme-changed` on window; re-resolve and rebuild on the next frame, once
     * the new class is actually on the element and styles have re-cascaded.
     */
    private _modeObserver?: MutationObserver
    private _modeQuery?: MediaQueryList

    /**
     * Dark mode is the same tokens flipped by the `.dark` class on `<html>` /
     * `<body>` (or the OS, under `color-scheme: system`) — and nothing fires
     * `theme-changed` for that: VitePress's appearance toggle and a consumer's
     * own switch just swap the class. Watch the class and the media query and
     * treat a flip exactly like a theme change.
     */
    private _watchMode(): void {
      if (typeof MutationObserver === 'undefined') return
      let dark = document.documentElement.classList.contains('dark') || document.body?.classList.contains('dark')
      this._modeObserver = new MutationObserver(() => {
        const next = document.documentElement.classList.contains('dark') || document.body?.classList.contains('dark')
        if (next === dark) return
        dark = next
        this._onThemeChanged()
      })
      this._modeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] })
      if (document.body) this._modeObserver.observe(document.body, { attributes: true, attributeFilter: ['class'] })
      this._modeQuery = window.matchMedia?.('(prefers-color-scheme: dark)')
      this._modeQuery?.addEventListener?.('change', this._onThemeChanged)
    }

    private _onThemeChanged = (): void => {
      if (isServer || !this._chart) return
      requestAnimationFrame(() => {
        if (!this._chart) return
        const palette = this._colors
        if (palette?.length) this.dataChart?.setColors(palette)
        else this.dataChart?._setColorResolver((c) => this._resolveColor(c))
        // A full rebuild, not `update()`: the axis/legend/title colors live in
        // `options`, which chart.js copies at construction time.
        this.rebuild()
      })
    }

    override willUpdate(changed: Map<string, unknown>): void {
      // @ts-ignore — optional on the generic base
      super.willUpdate?.(changed)
      if (changed.has('dataChart')) this._subscribe()
    }

    protected _subscribe(): void {
      this._off?.()
      detachEventHandlers(this)
      this._off = this.dataChart?.subscribe(() => {
        this._scheduleApplyProps()
        this.requestUpdate()
      })
      // A swapped-in controller needs the resolver too, or its color names go
      // to the canvas unresolved (and paint as transparent).
      if (!isServer) this.dataChart?._setColorResolver((c) => this._resolveColor(c))
      this._scheduleApplyProps()
    }

    /**
     * Drive the apply from `update()` as well as `_subscribe()` — every render
     * reaches here, so a controller that arrives late (or a `setProps` between
     * subscriptions) can't be missed. Same arrangement as
     * `table-controller-core`, which documents why `_subscribe` alone is fragile.
     */
    protected override update(changed: Map<string, unknown>): void {
      this._scheduleApplyProps()
      super.update(changed)
    }

    private _applyQueued = false

    /**
     * Deferred + de-duplicated: the apply writes reactive props, and doing that
     * inside the update cycle would trip Lit's change-in-update warning.
     */
    private _scheduleApplyProps(): void {
      if (isServer) return
      if (this._applyQueued) return
      if (typeof queueMicrotask !== 'function') {
        this._applyControllerProps()
        return
      }
      this._applyQueued = true
      queueMicrotask(() => {
        this._applyQueued = false
        this._applyControllerProps()
      })
    }

    /**
     * Pull `controlMonoChart({ props })` onto this element, so the template needs
     * nothing but the controller binding.
     *
     * The CONTROLLER WINS for keys it declares (matching `controlMonoTable` and
     * `controlMonoForm`); keys it doesn't mention are left to whatever the
     * template set. `applyProps` supplies the skip-undefined, read-only and
     * equality guards. `?.props` is optional-called so a controller built before
     * this option existed simply contributes nothing.
     */
    protected _applyControllerProps(): void {
      applyProps(this, this.dataChart?.props?.())
    }

    /* ------------------------------ resolution ------------------------------ */

    /**
     * Effective type. A preset's locked type wins (a `<mono-chart-pie>` is a pie),
     * then an explicit element `type`, then the controller's, then `'bar'`.
     */
    protected get _type(): MonoChartType {
      return this._presetType ?? this.type ?? this.dataChart?.type ?? 'bar'
    }

    /** Effective data: the element's raw `data` wins, else the controller's. */
    protected get _data(): MonoChartData {
      return this.data ?? this.dataChart?.data() ?? { labels: [], datasets: [] }
    }

    protected get _loading(): boolean {
      return !!this.dataChart?.loading
    }

    protected get _empty(): boolean {
      const d = this._data
      return !d.datasets?.length || d.datasets.every((s) => !s.data?.length)
    }

    /** Palette from the `colors` prop, as an array. */
    /** The raw `colors` prop as a list, before name resolution. */
    protected get _colorList(): string[] | null {
      const c = this.colors
      if (!c) return null
      if (Array.isArray(c)) return c.filter(Boolean)
      return String(c)
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean)
    }

    /**
     * The palette handed to Chart.js: the `colors` list if given, else the single
     * `color` accent, else null (the controller keeps its own default).
     * Mono color NAMES are resolved to real values here — see `_resolveColor`.
     */
    protected get _colors(): string[] | null {
      const list = this._colorList ?? (this.color ? [this.color] : null)
      if (!list?.length) return null
      return list.map((c) => this._resolveColor(c))
    }

    /**
     * The element's own computed style scope.
     *
     * Read from the inner `.mono-chart` wrapper, not the host: in the shadow
     * build the custom properties are declared inside the shadow root, so the
     * host would return empty strings.
     */
    private _styleScope(): Element | null {
      if (isServer) return null
      return (
        ((this.renderRoot as ParentNode)?.querySelector?.('.mono-chart') as Element | null) ??
        (this as unknown as Element)
      )
    }

    /**
     * Turn a mono color NAME into the value the canvas needs.
     *
     * Chart.js paints onto a bitmap and never resolves `var()`, so `success` (or
     * a literal `var(--x)`) would render as transparent. Names map to the
     * component's `--_mono-chart-*` resolvers, which chain through the public
     * `--mono-chart-*` overrides down to the Basecoat tokens — so a consumer
     * who re-themes the app gets re-themed charts for free. Anything that isn't
     * a known name (a hex, `rgb()`, `hsl()`) is passed through untouched.
     */
    protected _resolveColor(value: string): string {
      const name = value.trim()
      if (!MONO_COLOR_NAMES.has(name)) return name
      const scope = this._styleScope()
      if (!scope) return MONO_COLOR_FALLBACK[name] ?? name
      // `chart-1` is `--_mono-chart-1`, not `--_mono-chart-chart-1`
      const prop = name.startsWith('chart-') ? `--_mono-chart-${name.slice(6)}` : `--_mono-chart-${name}`
      const v = getComputedStyle(scope).getPropertyValue(prop).trim()
      return v || MONO_COLOR_FALLBACK[name] || name
    }

    /**
     * The inks and type Chart.js paints the chrome with — read off the element's
     * own box, where chart.css resolved them from the Basecoat tokens: legend
     * and title in `--foreground`, ticks in `--muted-foreground`, the grid in
     * `--border`, the tooltip as a popover, the page font at text-xs.
     */
    protected _themeColors(): {
      text: string
      muted: string
      grid: string
      tooltipBg: string
      tooltipColor: string
      tooltipBorder: string
      fontFamily: string
      fontSize: number
      radius: number
      barRadius: number
    } {
      const fallback = {
        text: 'oklch(0.372 0.039 257.29)',
        muted: 'oklch(0.554 0.041 257.42)',
        grid: 'oklch(0.929 0.013 255.51)',
        tooltipBg: 'oklch(1 0 0)',
        tooltipColor: 'oklch(0.372 0.039 257.29)',
        tooltipBorder: 'oklch(0.929 0.013 255.51)',
        fontFamily: 'ui-sans-serif, system-ui, sans-serif',
        fontSize: 12,
        radius: 8,
        barRadius: 8,
      }
      const scope = this._styleScope()
      if (!scope) return fallback
      const cs = getComputedStyle(scope)
      const read = (name: string, fb: string) => cs.getPropertyValue(name).trim() || fb
      // a font must be > 0; a radius may legitimately be 0 (a pinned knob, lyra / sera)
      const px = (v: string, fb: number, min = 1) => {
        const n = parseFloat(v)
        return Number.isFinite(n) && n >= min ? n : fb
      }
      return {
        text: read('--_mono-chart-text', fallback.text),
        muted: read('--_mono-chart-muted', fallback.muted),
        grid: read('--_mono-chart-grid', fallback.grid),
        tooltipBg: read('--_mono-chart-tooltip-bg', fallback.tooltipBg),
        tooltipColor: read('--_mono-chart-tooltip-color', fallback.tooltipColor),
        tooltipBorder: read('--_mono-chart-tooltip-border', fallback.tooltipBorder),
        // the box carries `font-family` / `font-size` from the chart tokens, so
        // the COMPUTED values are the resolved ones (a var() would not be)
        fontFamily: cs.fontFamily || fallback.fontFamily,
        fontSize: px(cs.fontSize, fallback.fontSize),
        // both radii are painted onto real border-radius properties (the root and
        // the canvas wrap) so they come back in px whatever token they were
        radius: px(cs.borderTopLeftRadius, fallback.radius, 0),
        barRadius: px(
          getComputedStyle(
            ((this.renderRoot as ParentNode)?.querySelector?.('.mono-chart-canvas-wrap') as Element | null) ?? scope,
          ).borderTopLeftRadius,
          fallback.barRadius,
          0,
        ),
      }
    }

    /**
     * The HTML tooltip. Chart.js calls this with the tooltip MODEL (title lines,
     * body lines, a colour per line, the caret position on the canvas); the
     * element fills its own `.mono-chart-tooltip` and places it from the caret —
     * above the point, or below when the point sits under the top edge. The
     * element lives in the render root, so the shadow build styles it too.
     */
    private _externalTooltip = (context: { chart: any; tooltip: any }): void => {
      const el = this._tooltipEl
      if (!el) return
      const tip = context.tooltip
      if (!tip || tip.opacity === 0) {
        el.removeAttribute('data-open')
        el.setAttribute('aria-hidden', 'true')
        return
      }
      const title: string[] = tip.title ?? []
      const bodies: string[][] = (tip.body ?? []).map((b: { lines: string[] }) => b.lines ?? [])
      const colors: Array<{ backgroundColor?: string; borderColor?: string }> = tip.labelColors ?? []
      const parts: string[] = []
      for (const t of title) parts.push(`<div class="mono-chart-tooltip-title">${escapeHtml(String(t))}</div>`)
      bodies.forEach((lines, i) => {
        const swatch = colors[i]?.backgroundColor ?? colors[i]?.borderColor
        for (const line of lines) {
          // "Label: 1,234" → label + value; anything else is one span
          const m = /^(.*?):\s*(.+)$/.exec(String(line))
          const text = m
            ? `<span class="mono-chart-tooltip-label">${escapeHtml(m[1])}</span><span class="mono-chart-tooltip-value">${escapeHtml(m[2])}</span>`
            : `<span class="mono-chart-tooltip-label">${escapeHtml(String(line))}</span>`
          parts.push(
            `<div class="mono-chart-tooltip-row">${
              swatch ? `<span class="mono-chart-tooltip-swatch" style="background:${escapeHtml(String(swatch))}"></span>` : ''
            }${text}</div>`,
          )
        }
      })
      el.innerHTML = parts.join('')
      // place from the caret; measure AFTER filling so the flip sees the real height
      const wrap = el.parentElement
      const width = wrap?.clientWidth ?? context.chart.width
      const gap = 8
      el.setAttribute('data-open', '')
      el.setAttribute('aria-hidden', 'false')
      const h = el.offsetHeight
      const w = el.offsetWidth
      const side = tip.caretY - h - gap < 0 ? 'bottom' : 'top'
      el.setAttribute('data-side', side)
      // keep the box inside the canvas horizontally
      const x = Math.min(Math.max(tip.caretX, w / 2), Math.max(width - w / 2, w / 2))
      el.style.left = `${x}px`
      el.style.top = `${tip.caretY}px`
    }

    /** Merge the element's presentational props with the consumer's raw options. */
    protected _buildOptions(): Record<string, unknown> {
      const theme = this._themeColors()
      const legendOn = this.legend !== false && this.legend !== 'false'
      const legendPos = typeof this.legend === 'string' && this.legend !== 'true' ? this.legend : 'top'
      const scaled = this._type !== 'pie' && this._type !== 'doughnut' && this._type !== 'polarArea'

      const base: Record<string, unknown> = {
        responsive: true,
        // With an explicit height the wrapper controls the box; otherwise fall
        // back to the aspect ratio so the canvas can't collapse to zero.
        maintainAspectRatio: !this.height,
        aspectRatio: this.aspectRatio,
        // Chart.js reads the font per label; the page's own sans at text-xs, like
        // every Basecoat label. `Chart.defaults.font` is global state shared with
        // every other chart on the page, so it is set per instance here instead.
        font: { family: theme.fontFamily, size: theme.fontSize },
        color: theme.text,
        plugins: {
          legend: {
            display: legendOn,
            position: legendPos,
            labels: {
              color: theme.text,
              font: { family: theme.fontFamily, size: theme.fontSize },
              // the swatch is a rounded chip, not a square
              boxWidth: theme.fontSize,
              boxHeight: theme.fontSize,
              useBorderRadius: true,
              borderRadius: Math.round(theme.fontSize / 4),
            },
          },
          title: this.title
            ? {
                display: true,
                text: this.title,
                color: theme.text,
                font: { family: theme.fontFamily, size: theme.fontSize + 2, weight: 500 },
              }
            : { display: false },
          // basecoat@1.0.2 styles/vega.css .combobox [data-popover] — bg-popover text-popover-foreground ring-foreground/10 rounded-md shadow-md ring-1
          // (a tooltip is a popover: the same chrome, at text-xs, px-3 py-1.5).
          // Drawn as an ELEMENT (`external`) so chart.css paints it with the
          // flavour's popover — ring, shadow, corner — which a canvas cannot;
          // the canvas colours below still apply if a consumer turns `enabled`
          // back on through `chart-options`.
          tooltip: {
            enabled: false,
            external: this._externalTooltip,
            backgroundColor: theme.tooltipBg,
            titleColor: theme.tooltipColor,
            bodyColor: theme.tooltipColor,
            borderColor: theme.tooltipBorder,
            borderWidth: 1,
            cornerRadius: theme.radius,
            padding: { x: 12, y: 6 },
            titleFont: { family: theme.fontFamily, size: theme.fontSize, weight: 500 },
            bodyFont: { family: theme.fontFamily, size: theme.fontSize },
            boxPadding: 4,
            usePointStyle: true,
          },
        },
        onClick: (_e: unknown, els: any[]) => {
          const hit = els?.[0]
          if (!hit) return
          const emit = this.dataChart as unknown as
            | { _emitPoint?: (d: number, i: number) => void }
            | undefined
          emit?._emitPoint?.(hit.datasetIndex, hit.index)
        },
      }

      if (scaled) {
        // The bars take the flavour's corner (square in lyra / sera, pills in maia /
        // luma); `borderSkipped` stays 'start', so only the free end rounds, the
        // way a shadcn bar chart does. Chart.js clamps the radius to half a bar.
        base.elements = { bar: { borderRadius: theme.barRadius } }
        // one tooltip per column: every series at that x, the way a dashboard
        // chart reads (Chart.js defaults to the nearest single point)
        base.interaction = { mode: 'index', intersect: false }
        base.scales = {
          // ticks are muted, the grid is the page hairline, the axis line is the grid
          x: {
            stacked: this.stacked,
            ticks: { color: theme.muted, font: { family: theme.fontFamily, size: theme.fontSize } },
            grid: { color: theme.grid },
            border: { color: theme.grid },
          },
          y: {
            stacked: this.stacked,
            ticks: { color: theme.muted, font: { family: theme.fontFamily, size: theme.fontSize } },
            grid: { color: theme.grid },
            border: { color: theme.grid },
          },
        }
      }

      const fromController = this.dataChart?.options() ?? {}
      return deepMerge(deepMerge(base, fromController), this.chartOptions ?? {})
    }

    /* ------------------------------- lifecycle ------------------------------ */

    protected override async firstUpdated(changed: Map<string, unknown>): Promise<void> {
      // @ts-ignore — optional on the generic base
      super.firstUpdated?.(changed)
      if (isServer) return
      // Give the controller a way to resolve mono color NAMES (its own `series[].color`
      // and default palette may use them), then push the element's palette and
      // resolved type — all BEFORE the first paint.
      this.dataChart?._setColorResolver((c) => this._resolveColor(c))
      const palette = this._colors
      if (palette?.length) this.dataChart?.setColors(palette)
      this._syncTypeToController()
      await this._createChart()
    }

    protected override updated(changed: Map<string, unknown>): void {
      // @ts-ignore — optional on the generic base
      super.updated?.(changed)
      if (isServer) return

      if (changed.has('colors') || changed.has('color')) {
        const palette = this._colors
        if (palette?.length) this.dataChart?.setColors(palette)
      }
      this._syncTypeToController()

      if (!this._chart) {
        // Not built yet (e.g. data arrived after an empty first render).
        if (!this._error && !this._empty) void this._createChart()
        return
      }

      if (MonoChartCoreClass._rebuildKeys.some((k) => changed.has(k))) {
        this.rebuild()
        return
      }

      // A controller-driven `setType()` never lands in `changed` (the element's
      // own props didn't move), so compare against what was actually built.
      if (this._chart.config?.type !== this._type) {
        this.rebuild()
        return
      }

      // Cheap path: swap the data on the existing instance. This is what keeps
      // reactive updates from flickering — no teardown, no canvas churn.
      this._applyData()
    }

    /**
     * Tell the controller which type actually won.
     *
     * The projection depends on it: pie-family charts colour every SLICE, bar
     * and line colour each DATASET. A preset (`<mono-chart-pie>`) fixes its type
     * on the element, so without this the controller would still think it was
     * projecting for the default `bar` and every slice would come out the same
     * colour. `setType` early-returns when unchanged, so this settles in one
     * extra update rather than looping.
     *
     * NOTE: the type is controller state, so pointing a bar element and a pie
     * element at ONE shared controller makes them fight — give each its own.
     */
    private _syncTypeToController(): void {
      const grid = this.dataChart
      if (grid && grid.type !== this._type) grid.setType(this._type)
    }

    private async _createChart(): Promise<void> {
      if (isServer || this._chart) return
      const canvas = this._canvas
      if (!canvas) return
      const token = ++this._buildToken
      let Chart: any
      try {
        Chart = await loadChartJs()
      } catch (err) {
        this._error = (err as Error)?.message ?? String(err)
        return
      }
      // Re-check after the await: the element may have been removed, or a newer
      // build started, while the dynamic import was in flight.
      if (token !== this._buildToken || !this.isConnected || !this._canvas) return

      try {
        this._chart = new Chart(this._canvas, {
          type: this._type,
          data: this._cloneData(),
          options: this._buildOptions(),
        })
        this._error = ''
        this.dataChart?._attachInstance(this._chart)
        this._observeResize()
      } catch (err) {
        this._error = (err as Error)?.message ?? String(err)
      }
    }

    /**
     * Hand chart.js its own copy. It mutates `data` in place (adding computed
     * metadata), so sharing the controller's projected object would corrupt it.
     */
    private _cloneData(): MonoChartData {
      const d = this._data
      return {
        labels: [...(d.labels ?? [])],
        datasets: (d.datasets ?? []).map((s) => ({ ...s, data: [...(s.data ?? [])] })),
      }
    }

    private _applyData(): void {
      if (!this._chart) return
      const next = this._cloneData()
      this._chart.data.labels = next.labels
      this._chart.data.datasets = next.datasets
      this._chart.update()
    }

    /** Destroy + recreate. Needed for `type` and structural option changes. */
    rebuild(): void {
      if (isServer) return
      this._destroyChart()
      void this._createChart()
    }

    private _destroyChart(): void {
      this._buildToken++ // invalidate any in-flight build
      this._ro?.disconnect()
      this._ro = undefined
      try {
        this._chart?.destroy()
      } catch {
        /* chart.js can throw if the canvas already left the DOM — ignore */
      }
      this._chart = null
      this.dataChart?._attachInstance(null)
      this._tooltipEl?.removeAttribute('data-open')
    }

    /**
     * Chart.js `responsive` already listens for window resizes, but not for a
     * container that changes size on its own (a sidebar opening, a flex reflow).
     */
    private _observeResize(): void {
      if (this._ro || typeof ResizeObserver === 'undefined') return
      const wrap = (this.renderRoot as ParentNode)?.querySelector?.('.mono-chart-canvas-wrap')
      if (!wrap) return
      this._ro = new ResizeObserver(() => this._chart?.resize())
      this._ro.observe(wrap as Element)
    }

    /* -------------------------------- render -------------------------------- */

    protected _cls(base: string, key: keyof ChartCssClass): string {
      const extra = this.cssClass?.[key]
      return extra ? `${base} ${extra}` : base
    }

    protected get _rootClasses(): string {
      return ['mono-chart', this._loading ? 'loading' : '', this.cssClassName, this.cssClass?.root]
        .filter(Boolean)
        .join(' ')
    }

    protected _wrapStyle(): StyleInfo {
      const s: StyleInfo = {}
      const w = toCssSize(this.width)
      const h = toCssSize(this.height)
      if (w) s.width = w
      if (h) s.height = h
      return s
    }

    protected renderChart(): TemplateResult {
      return html`
        <div class=${this._rootClasses}>
          ${this._error
            ? html`<div class=${this._cls('mono-chart-message error', 'message')} role="alert">
                ${this._error}
              </div>`
            : nothing}
          <div class="mono-chart-canvas-wrap" style=${styleMap(this._wrapStyle())}>
            <canvas class=${this._cls('', 'canvas')} role="img"></canvas>
            <div class="mono-chart-tooltip" role="tooltip" aria-hidden="true"></div>
          </div>
        </div>
      `
    }
  }

  return MonoChartCoreClass as unknown as Constructor<MonoChartCoreInterface> & T
}

/** Shallow-recursive merge; arrays and non-plain values are replaced wholesale. */
function deepMerge(
  base: Record<string, unknown>,
  over: Record<string, unknown>,
): Record<string, unknown> {
  const out: Record<string, unknown> = { ...base }
  for (const [k, v] of Object.entries(over)) {
    const prev = out[k]
    if (
      v &&
      typeof v === 'object' &&
      !Array.isArray(v) &&
      prev &&
      typeof prev === 'object' &&
      !Array.isArray(prev)
    ) {
      out[k] = deepMerge(prev as Record<string, unknown>, v as Record<string, unknown>)
    } else {
      out[k] = v
    }
  }
  return out
}
