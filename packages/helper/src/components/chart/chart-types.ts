import type { CssSizeValue } from '../../composables/css-size'
import type { MonoGridSource } from '../table/mono-data-grid.js'
import type { MaybeReactive } from '../../composables/reactive.js'
import type { MonoDataSourceOptions, MonoOdataOptions } from '../../utils/data-source-options.js'

/** Chart.js chart types the addon exposes. */
export type MonoChartType =
  | 'bar'
  | 'line'
  | 'pie'
  | 'doughnut'
  | 'radar'
  | 'polarArea'
  | 'scatter'
  | 'bubble'

/** Aggregate applied to a series' values when rows are bucketed by `groupBy`. */
export type MonoChartAgg = 'sum' | 'avg' | 'count' | 'min' | 'max'

/**
 * The mono color names a chart understands: Basecoat's five chart colours
 * (`chart-1` … `chart-5`, the default palette in that order) and the roles the
 * rest of the library's `color` prop takes. They resolve through
 * `--mono-chart-<name>` to the Basecoat tokens, so re-theming the app — a
 * colour preset, a flavour, dark mode — re-themes the charts.
 *
 * Anywhere a color is accepted — `color`, `colors`, a series' `color` — you can
 * use one of these names OR any CSS color (`#2e6bb0`, `rgb(…)`, `oklch(…)`).
 */
export type MonoChartColor =
  | 'chart-1'
  | 'chart-2'
  | 'chart-3'
  | 'chart-4'
  | 'chart-5'
  | 'primary'
  | 'secondary'
  | 'accent'
  | 'success'
  | 'warning'
  | 'danger'
  | 'info'

/** Any source `monoChart` accepts for row data — a devextreme DataSource or an array. */
export type MonoChartSource<T = any> = MonoGridSource<T>

/** A chart.js dataset, loosely typed so consumers can pass anything chart.js accepts. */
export interface MonoChartDataset {
  label?: string
  data: unknown[]
  [key: string]: unknown
}

/** A raw chart.js `data` object — the passthrough shape. */
export interface MonoChartData {
  labels?: unknown[]
  datasets: MonoChartDataset[]
}

/**
 * One dataset, mapped off a row field.
 *
 * @example
 * series: [
 *   { field: 'sales', label: 'Sales', agg: 'sum' },
 *   { field: 'costs', label: 'Costs', agg: 'sum', type: 'line' },
 * ]
 */
export interface MonoChartSeries {
  /**
   * Row field holding this series' value. Accepts a **path expression**
   * (`"Job.Budget"`, `"Items.[0].Total"`) exactly like the table's `field`.
   */
  field: string
  /** Legend label. Defaults to `field`. */
  label?: string
  /**
   * How to combine rows that fall in the same `groupBy` bucket. Defaults to
   * `'sum'` when `groupBy` is set. Ignored when it isn't — one row is one point.
   */
  agg?: MonoChartAgg
  /**
   * Explicit color — a mono color name (`success`, `danger`, …) or any CSS
   * color. Otherwise taken from the palette by index.
   */
  color?: MonoChartColor | string
  /** Per-series type, for mixed charts (e.g. bars with a line overlay). */
  type?: MonoChartType
  /** Extra chart.js dataset properties, merged over the generated ones. */
  dataset?: Record<string, unknown>
}

/** Options for {@link monoChart}. */
/**
 * Context handed to {@link MonoChartOdataOptions.aggregate}. Everything needed to
 * shape the clause is pre-resolved, so the common case is `({ apply }) => apply`.
 */
export interface MonoChartAggregateCtx {
  /**
   * The clause built from the chart's own `groupBy` + `series`, e.g.
   * `groupby((DeptNama),aggregate(TotalBudget with sum as TotalBudget))`.
   */
  apply: string
  /** The devextreme filter in play (`odata.options.filter`), or `undefined`. */
  filter: unknown
  /** devextreme filter array → OData string, for composing your own clause. */
  odataFilter: (filter: unknown) => string
  /** `filter(<expr>)/<apply>` — the standard composition, ready to return. */
  withFilter: (apply: string, filter?: unknown) => string
  groupBy?: string
  series: MonoChartSeries[]
}

/**
 * Point the chart at an OData endpoint and let `monoOdataFetch` do the fetching.
 *
 * **`aggregate` is the switch.** Supply it and the chart issues ONE
 * `$apply` request and charts the rolled-up rows the server returns. Leave it out
 * and the rows are fetched normally — trim the payload with `options.select` /
 * `options.filter` and the roll-up happens client-side as before.
 *
 * Requires the optional peer `@mono-lit/utility` (loaded on demand, only on this path).
 */
export interface MonoChartOdataOptions {
  /**
   * Names an entry in your `fetching.api` config; resolves the base URL (and the
   * odata source constructors) for you, overriding `baseUrl`.
   */
  configBaseUrl?: string
  /** Explicit base URL, when you aren't using `configBaseUrl`. */
  baseUrl?: string
  /** Entity path, e.g. `'/DtoProgramTransfer'`. */
  url: string
  method?: 'GET' | 'POST'
  /**
   * devextreme load options. On the plain path this is how you keep the payload
   * small (`select`, `filter`, `sort`, `take`). On the `$apply` path `filter` is
   * offered to `aggregate()` and `paginate` is forced off, so every bucket comes
   * back rather than just the first page.
   */
  options?: Record<string, unknown>
  /**
   * Shape the `$apply` clause. Receives the prebuilt one and returns the final
   * string — return `apply` unchanged, or compose something richer.
   *
   * @example
   * aggregate: ({ apply, filter, withFilter }) => withFilter(apply, filter)
   */
  aggregate?: (ctx: MonoChartAggregateCtx) => string
}

export interface MonoChartOptions {
  /** Chart type when the element doesn't fix one. Default `'bar'`. */
  type?: MonoChartType
  /**
   * Row field used for the category axis / slice labels. Accepts a path
   * expression. When `groupBy` is set and this is omitted, `groupBy` is used.
   */
  labelField?: string
  /** Bucket rows by this field before charting, then aggregate each series. */
  groupBy?: string
  /** One dataset per entry. */
  series?: MonoChartSeries[]
  /** Palette for datasets (bar/line) or slices (pie/doughnut). */
  colors?: string[]
  /** Raw chart.js options, deep-merged over the generated defaults. */
  options?: Record<string, unknown>
  /**
   * Fetch the chart's rows through `monoOdataFetch` instead of a DataSource you
   * bind yourself. Set `aggregate` to have the server roll the data up with
   * `$apply` and return one row per bucket — see {@link MonoChartOdataOptions}.
   */
  odata?: MonoChartOdataOptions
  /**
   * Props for the bound `<mono-chart*>` element, declared here so the element
   * needs no appearance bindings of its own. Read back with `props()`, changed
   * with `setProps()`. Where both this and the template declare a key, the
   * **controller wins** — same rule as `controlMonoTable({ props })`.
   */
  props?: MonoChartProps
  /**
   * Pull the FULL result set from a remote DataSource rather than just the
   * current page. Default `true` — a chart almost always wants everything.
   */
  loadAll?: boolean
  /**
   * Whether a chart bound to a remote DataSource may ask the SERVER to roll the
   * data up — ONE `$apply=groupby((groupBy),aggregate(…))` through the source's
   * own store (its url, `beforeSend`, auth) — instead of draining every row and
   * bucketing them here. Default `true`; needs `groupBy` and explicit `series`
   * (the clause is built from their `field` / `agg`, exactly as `odata.aggregate`
   * builds it). A backend that rejects it (4xx / 501) turns the path off for this
   * controller and the drain takes over. Set `false` to never try.
   */
  serverApply?: boolean
  /** Chunk size used when draining a remote source. Default `100`. */
  chunkSize?: number
  /**
   * The base every query goes out on — the same option `controlMonoTable` takes.
   * On a bound DataSource its `filter` is AND-ed under the source's own for the
   * drain (and written onto the source for a `loadAll: false` chart), `select` /
   * `sort` / `expand` shape the chunk requests; on the `odata` path it merges into
   * `odata.options` and folds inside `$apply`. A value, a getter, or a `{ value }`
   * box (a Vue `ref` / `computed`), read fresh at every `reload()`.
   */
  dataSourceOptions?: MaybeReactive<MonoDataSourceOptions>
  /** The same in raw OData (`$select`, `$filter`, `$expand`, `$orderby`, custom params). */
  odataOptions?: MaybeReactive<MonoOdataOptions>
}

/** Detail handed to {@link MonoChartController.onPointClick}. */
export interface MonoChartPointEvent<T = any> {
  /** Index of the clicked point within its dataset. */
  index: number
  /** Index of the dataset the point belongs to. */
  datasetIndex: number
  /** The category label at that index. */
  label: unknown
  /** The numeric value at that index. */
  value: unknown
  /** Rows that produced this point (all rows in the bucket when grouped). */
  rows: T[]
}

/**
 * Chart controller — the reactive bridge between a data source and the
 * `mono-chart-*` elements. Create it in your app and bind it with
 * `:data-chart.prop="chart"`.
 */
export interface MonoChartController<T = any> {
  /** Rows currently backing the chart (empty in raw-data mode). */
  readonly items: T[]
  /** True while the bound source is loading. */
  loading: boolean
  /** Current chart type. */
  type: MonoChartType
  /** The bound source, or null. */
  readonly dataSource: MonoChartSource<T> | null
  /** The live chart.js instance, or null before an element mounts it. */
  readonly instance: unknown

  /** The projected chart.js `data` object. */
  data(): MonoChartData
  /** The merged chart.js `options` object. */
  options(): Record<string, unknown>

  /**
   * The central element props (`controlMonoChart({ props })`).
   *
   * One object with a **stable identity, mutated in place** — same contract as
   * `controlMonoTable`'s `table.props()` — so bound elements keep seeing updates
   * without being re-bound.
   */
  props(): MonoChartProps
  /**
   * Merge a patch into `props()` and notify, so every bound element re-applies
   * at once. A merge, not a replace: keys you omit keep their current value.
   */
  setProps(patch: MonoChartProps): void

  setType(type: MonoChartType): void
  setSeries(series: MonoChartSeries[]): void
  setColors(colors: string[]): void
  /** Replace the data — raw chart.js data, or a fresh row array. */
  setData(next: MonoChartData | T[]): void
  /** Attach (or swap) the source — a DataSource, an array, or raw chart data. */
  bind(source: MonoChartSource<T> | T[] | MonoChartData | null): void
  /** Re-read the bound source (or re-fetch through `odata`). Reads the base options fresh. */
  reload(): Promise<void>
  /** Alias of `reload()` — the call to make after the reactive state behind a base getter changed. */
  refresh(): Promise<void>
  /** Replace `dataSourceOptions` and reload. */
  setDataSourceOptions(next: MaybeReactive<MonoDataSourceOptions> | undefined): Promise<void>
  /** Replace `odataOptions` and reload. */
  setOdataOptions(next: MaybeReactive<MonoOdataOptions> | undefined): Promise<void>
  /** The merged, normalised base as of the last query. */
  resolvedDataSourceOptions(): Readonly<MonoDataSourceOptions>

  /** Called when a point/slice is clicked. Assign after creating the controller. */
  onPointClick: ((event: MonoChartPointEvent<T>) => void) | null

  /** Subscribe to state changes; returns an unsubscribe function. */
  subscribe(cb: () => void): () => void
  /** Detach listeners, destroy nothing (the element owns the chart), clear subscribers. */
  dispose(): void

  /** @internal — elements register their chart.js instance here. */
  _attachInstance(instance: unknown): void
  /**
   * @internal — elements install a resolver that turns mono color NAMES into
   * real values. The controller has no DOM, so it can't read the tokens itself.
   */
  _setColorResolver(fn: ((color: string) => string) | null): void
}

/** Per-part class overrides for the chart elements. */
export interface ChartCssClass {
  /** The wrapper. */
  root?: string
  /** The `<canvas>`. */
  canvas?: string
  /** The empty-state / loading text. */
  message?: string
}

/**
 * The chart elements' own props, declared centrally on the controller
 * (`controlMonoChart({ props })`) so every `<mono-chart*>` bound to it is wired
 * with just `:control-chart.prop="chart"`. Read back via `chart.props()` and
 * updated with `chart.setProps()`.
 *
 * Flat rather than keyed by element (the way `controlMonoTable({ props })` is)
 * because the presets are the same element with `type` fixed — `props` IS that
 * element's bag.
 *
 * The controller-binding keys are deliberately absent: they name the controller
 * itself, so setting them *from* the controller would be circular.
 */
export interface MonoChartProps {
  /**
   * Chart type. Ignored by the presets, which fix their own. When a controller
   * is bound this overrides the controller's `type`.
   */
  type?: MonoChartType

  /**
   * Raw chart.js data, for use WITHOUT a controller. Bind with `.prop`:
   * `:data.prop="{ labels, datasets }"`.
   */
  data?: MonoChartData

  /** Raw chart.js options, merged over the defaults. Bind with `.prop`. */
  chartOptions?: Record<string, unknown>
  'chart-options'?: Record<string, unknown>

  /** Canvas box sizing. A CSS length string or a number (px). */
  width?: CssSizeValue
  height?: CssSizeValue

  /** `width / height` when no explicit height is set. Default `2`. */
  aspectRatio?: number
  'aspect-ratio'?: number

  /** Show the legend (default `true`), or place it: `top` / `bottom` / `left` / `right`. */
  legend?: boolean | 'top' | 'bottom' | 'left' | 'right'

  /** Chart title rendered by chart.js. */
  title?: string

  /** Stack bar/line datasets. Default `false`. */
  stacked?: boolean

  /**
   * Single accent for every dataset — a mono color name (`primary`, `success`,
   * `danger`, …) or any CSS color. `colors` wins when both are set.
   */
  color?: MonoChartColor | string

  /**
   * Palette. A comma-separated attribute (`colors="success,danger,warning"`) or
   * an array via `.prop`. Entries may be mono color names or CSS colors, mixed.
   */
  colors?: string | string[]

  /** Per-part class overrides. Object, or a JSON string via the `css-class` attribute. */
  cssClass?: ChartCssClass
  cssclass?: ChartCssClass
  'css-class'?: ChartCssClass | string
  /** A single class added to the root. */
  cssClassName?: string

  /** Anything else the element accepts. */
  [key: string]: unknown
}

/**
 * Props for `<mono-chart>` and its presets (`<mono-chart-bar>`, `-line`, `-pie`,
 * `-doughnut`, which fix `type` and otherwise behave identically).
 */
export interface ChartProps extends MonoChartProps {
  /** The chart controller. Bind with `.prop`: `:control-chart.prop="chart"`. */
  controlChart?: MonoChartController
  'control-chart'?: MonoChartController
  controlchart?: MonoChartController
  /** Renamed — `:data-chart` / `:dataChart` alias `controlChart` (both work). */
  dataChart?: MonoChartController
  'data-chart'?: MonoChartController
  datachart?: MonoChartController
}
