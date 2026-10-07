import { monoArraySource } from '../table/array-source.js'
import { getFieldValue, isPath } from '../../search/field-path.js'
import { readAllRows } from '../../utils/data-source-read.js'
import {
  extraLoadOptions,
  normalizeSortList,
  resolveDataSourceOptions,
  toList,
  type MonoDataSourceOptions,
  type MonoOdataOptions,
} from '../../utils/data-source-options.js'
import type { MaybeReactive } from '../../composables/reactive.js'
import {
  andFilters,
  andPredicates,
  compileFilterPredicate,
  type RowPredicate,
} from '../../search/filter-eval.js'
import type {
  MonoChartAgg,
  MonoChartController,
  MonoChartData,
  MonoChartDataset,
  MonoChartOptions,
  MonoChartPointEvent,
  MonoChartProps,
  MonoChartSeries,
  MonoChartSource,
  MonoChartType,
} from './chart-types.js'
import { createNotifier } from '../../composables/notifier'
import { buildChartApply, buildChartOdataRequest, composeApply } from './chart-odata.js'
import { createApplyGate, isRolledUp, loadApply } from '../../utils/data-source-apply.js'
import { summaryFilterOf } from '../../utils/data-source-summary.js'

/**
 * Default palette, expressed as mono color NAMES rather than literals so a chart
 * follows the active theme out of the box — exactly like every other component.
 * These are Basecoat's own chart colours: the element resolves each name through
 * `--_mono-chart-<name>` → `--mono-chart-*` → `--chart-1` … `--chart-5` at paint
 * time, so a colour preset, a flavour or dark mode recolours charts too. Past
 * five series the roles follow, so a sixth dataset is still its own colour.
 */
const DEFAULT_COLORS = [
  'chart-1',
  'chart-2',
  'chart-3',
  'chart-4',
  'chart-5',
  'success',
  'warning',
  'danger',
]

/**
 * Values used when nobody has resolved a name yet — a controller used headlessly
 * (reading `data()` in Node), or before an element mounts. ONE's light tokens,
 * so the shape is right even without a DOM.
 */
const NAME_FALLBACK: Record<string, string> = {
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

/** Read a row field, honouring path expressions (`Job.Name`, `Items.[*].Total`). */
function fieldValue(row: unknown, field: string): unknown {
  if (row == null) return undefined
  if (!isPath(field)) return (row as Record<string, unknown>)[field]
  const v = getFieldValue(row, field)
  return Array.isArray(v) ? v[0] : v
}

/** Coerce to a finite number, or null when the value isn't numeric. */
function num(value: unknown): number | null {
  if (value == null || value === '') return null
  const n = typeof value === 'number' ? value : Number(value)
  return Number.isFinite(n) ? n : null
}

/** Apply an aggregate to a bucket of raw values. */
function aggregate(values: unknown[], agg: MonoChartAgg): number | null {
  if (agg === 'count') return values.length
  const nums = values.map(num).filter((n): n is number => n != null)
  if (!nums.length) return agg === 'sum' ? 0 : null
  switch (agg) {
    case 'sum':
      return nums.reduce((a, b) => a + b, 0)
    case 'avg':
      return nums.reduce((a, b) => a + b, 0) / nums.length
    case 'min':
      return Math.min(...nums)
    case 'max':
      return Math.max(...nums)
    default:
      return null
  }
}

/** Parse `#rgb` / `#rrggbb` / `rgb(r,g,b)` to channels; null if unrecognised. */
function toRgb(color: string): [number, number, number] | null {
  const s = color.trim()
  const hex = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(s)
  if (hex) {
    const h = hex[1].length === 3 ? hex[1].replace(/./g, (c) => c + c) : hex[1]
    const n = parseInt(h, 16)
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255]
  }
  const rgb = /^rgba?\(\s*([\d.]+)[\s,]+([\d.]+)[\s,]+([\d.]+)/i.exec(s)
  if (rgb) return [Number(rgb[1]), Number(rgb[2]), Number(rgb[3])]
  return null
}

/** Shift a color's lightness by `delta` (-1…1), preserving hue and saturation. */
function shiftLightness(color: string, delta: number): string {
  const rgb = toRgb(color)
  if (!rgb) return color
  const [r, g, b] = rgb.map((v) => v / 255)
  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  const l = (max + min) / 2
  const d = max - min
  const s = d === 0 ? 0 : d / (1 - Math.abs(2 * l - 1))
  let h = 0
  if (d !== 0) {
    if (max === r) h = ((g - b) / d) % 6
    else if (max === g) h = (b - r) / d + 2
    else h = (r - g) / d + 4
    h *= 60
    if (h < 0) h += 360
  }
  const nl = Math.min(0.92, Math.max(0.08, l + delta))
  const c = (1 - Math.abs(2 * nl - 1)) * s
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1))
  const m = nl - c / 2
  const [r1, g1, b1] =
    h < 60 ? [c, x, 0] : h < 120 ? [x, c, 0] : h < 180 ? [0, c, x]
    : h < 240 ? [0, x, c] : h < 300 ? [x, 0, c] : [c, 0, x]
  const out = [r1, g1, b1].map((v) => Math.round((v + m) * 255))
  return `rgb(${out[0]}, ${out[1]}, ${out[2]})`
}

/**
 * Make every entry visually distinct.
 *
 * A token set may ALIAS roles — in ONE, `--success` and `--teal` are the same
 * colour, and a consumer's own preset can fold two more. That's fine for UI (a chip is either "info" or
 * "secondary"), but a chart drawing two series in the same colour is unreadable.
 * On a collision, step the lightness until the colour is unused.
 *
 * Only applied to the DEFAULT palette — an explicit `colors` list is honoured
 * exactly as written, duplicates included.
 */
function distinctColors(list: string[]): string[] {
  const seen = new Set<string>()
  return list.map((color) => {
    let candidate = color
    for (let i = 1; seen.has(candidate.toLowerCase()) && i <= 6; i++) {
      // Alternate lighter/darker so a long run stays spread out.
      candidate = shiftLightness(color, (i % 2 ? 1 : -1) * 0.14 * Math.ceil(i / 2))
    }
    seen.add(candidate.toLowerCase())
    return candidate
  })
}

/** True for a raw chart.js `data` object (as opposed to a row array / DataSource). */
function isRawData(value: unknown): value is MonoChartData {
  return (
    !!value &&
    typeof value === 'object' &&
    !Array.isArray(value) &&
    Array.isArray((value as MonoChartData).datasets)
  )
}

/** Types that colour each POINT rather than each dataset. */
function isPerPointType(type: MonoChartType): boolean {
  return type === 'pie' || type === 'doughnut' || type === 'polarArea'
}

/**
 * Create a chart controller.
 *
 * Two data modes:
 * - **field-mapped** — pass rows (an array or a devextreme DataSource) plus
 *   `labelField` / `series`; optionally bucket them with `groupBy` + per-series
 *   `agg`. Field names accept path expressions.
 * - **raw** — pass a chart.js `{ labels, datasets }` object and it is used
 *   verbatim; no mapping, no aggregation.
 *
 * @example
 * const chart = controlMonoChart(rows, {
 *   type: 'bar',
 *   groupBy: 'month',
 *   series: [{ field: 'amount', label: 'Revenue', agg: 'sum' }],
 *   props: { height: 320, legend: 'bottom' },
 * })
 * chart.subscribe(() => { /* re-render *\/ })
 *
 * @example
 * // raw passthrough
 * const chart = controlMonoChart({ labels: ['A', 'B'], datasets: [{ label: 'x', data: [1, 2] }] })
 */
/** Renamed "control" alias of {@link monoChart} (no breaking change — both work). */
export { monoChart as controlMonoChart }

export function monoChart<T = any>(
  source: MonoChartSource<T> | T[] | MonoChartData | null = null,
  opts: MonoChartOptions = {},
): MonoChartController<T> {
  let bound: MonoChartSource<T> | null = null
  let raw: MonoChartData | null = null
  let rows: T[] = []
  /** Rows per label index, so a click can report what produced the point. */
  let buckets: T[][] = []
  let projected: MonoChartData = { labels: [], datasets: [] }
  let instance: unknown = null
  /**
   * How many drains are in flight. A COUNTER, not a flag: `bind()` starts one
   * sync and a following `reload()` starts another, so two drains overlap — with
   * a boolean the first one to finish cleared it and the chart reported "done"
   * while the second was still fetching chunks.
   *
   * Also guards the re-entrant `changed` echo while a drain is running.
   */
  let drainDepth = 0
  /**
   * Whether `rows` came back already rolled up by the server (`odata.aggregate`).
   * Read by `project()`, which must not re-apply each series' `agg` to a bucket
   * that is already a single aggregated row.
   */
  let preAggregated = false
  /**
   * The `$apply`-through-the-store switch for a bound source: off by option
   * (`serverApply: false`), or off for good once the backend rejected one.
   */
  const applyGate = createApplyGate(opts.serverApply !== false)

  let series: MonoChartSeries[] = opts.series ? [...opts.series] : []
  let colors: string[] = opts.colors?.length ? [...opts.colors] : [...DEFAULT_COLORS]
  /** Only the DEFAULT palette gets de-duplicated; an explicit list is honoured as written. */
  let paletteIsDefault = !opts.colors?.length
  /**
   * Turns a mono color NAME into a real value. Falls back to the static token
   * values until an element installs the DOM-aware version — the controller has
   * no DOM, and only the element can read the `--_mono-chart-*` tokens (which is
   * also what makes the palette follow a live theme change).
   */
  let resolveColor: (color: string) => string = (c) => NAME_FALLBACK[c] ?? c

  // Notify on a microtask, coalescing several state changes in one tick into a
  // single callback — the same reentrancy guard `monoDataGrid` documents: a
  // synchronous subscriber that re-renders the consumer's Vue tree would reenter
  // an in-flight patch and corrupt the DOM.
  const notifier = createNotifier()
  const notify = notifier.notify

  // Central element props (`opts.props`) — one object, stable identity, mutated
  // in place, exactly like `controlMonoTable`'s `table.props()`. Every bound
  // `<mono-chart*>` pulls it on each notify, so one controller can drive several.
  const elementProps: MonoChartProps = { ...(opts.props ?? {}) }

  /* ----------------------------- projection ------------------------------ */

  /** Build `{ labels, datasets }` from the current rows + series config. */
  function project(): void {
    if (raw) {
      projected = raw
      buckets = []
      return
    }

    const groupBy = opts.groupBy
    const labelField = opts.labelField ?? groupBy
    const specs = series.length ? series : inferSeries()

    let labels: unknown[]
    let groups: T[][]

    if (groupBy) {
      // Bucket rows by the group value, preserving first-seen order.
      const order: unknown[] = []
      const map = new Map<string, { label: unknown; rows: T[] }>()
      for (const row of rows) {
        const value = fieldValue(row, groupBy)
        const key = String(value)
        let entry = map.get(key)
        if (!entry) {
          entry = { label: value, rows: [] }
          map.set(key, entry)
          order.push(key)
        }
        entry.rows.push(row)
      }
      labels = order.map((k) => map.get(String(k))!.label)
      groups = order.map((k) => map.get(String(k))!.rows)
    } else {
      // One row is one point.
      labels = labelField ? rows.map((r) => fieldValue(r, labelField)) : rows.map((_, i) => i + 1)
      groups = rows.map((r) => [r])
    }

    const perPoint = isPerPointType(ctrl.type)
    const resolved = colors.map(resolveColor)
    const palette = paletteIsDefault ? distinctColors(resolved) : resolved
    const datasets: MonoChartDataset[] = specs.map((spec, i) => {
      /**
       * Rows that arrived pre-aggregated (`odata.aggregate`) are already one per
       * bucket, so the series' own `agg` must NOT run again — it would re-reduce a
       * single value. `sum` is the identity there for `sum`/`min`/`max`/`avg`, but
       * `count` is not: counting one rolled-up row yields 1 and throws away the
       * server's `$count`. Reading the value covers every agg uniformly.
       */
      const agg: MonoChartAgg = preAggregated ? 'sum' : (spec.agg ?? 'sum')
      const data = groups.map((bucket) => {
        const values = bucket.map((row) => fieldValue(row, spec.field))
        // Single-row buckets shouldn't be summed — read the value.
        if ((preAggregated || !groupBy) && bucket.length === 1 && agg === 'sum') {
          return num(values[0])
        }
        return aggregate(values, agg)
      })
      const color = spec.color ? resolveColor(spec.color) : palette[i % palette.length]
      const base: MonoChartDataset = {
        label: spec.label ?? spec.field,
        data,
        // Pie-family charts want one colour per SLICE; bar/line one per dataset.
        backgroundColor: perPoint ? labels.map((_, j) => palette[j % palette.length]) : color,
        // the hairline between slices is the page surface — white on a dark page
        // read as a grid of cracks
        borderColor: perPoint ? resolveColor('surface') : color,
      }
      if (spec.type) base.type = spec.type
      return spec.dataset ? { ...base, ...spec.dataset } : base
    })

    projected = { labels, datasets }
    buckets = groups
  }

  /**
   * With no `series`, chart every numeric field on the first row except the
   * label/group field — so `monoChart(rows, { labelField: 'month' })` just works.
   */
  function inferSeries(): MonoChartSeries[] {
    const first = rows[0] as Record<string, unknown> | undefined
    if (!first) return []
    const skip = new Set([opts.labelField, opts.groupBy].filter(Boolean) as string[])
    return Object.keys(first)
      .filter((k) => !skip.has(k) && num(first[k]) != null)
      .map((field) => ({ field }))
  }

  /* -------------------------------- source ------------------------------- */

  const onChanged = (): void => {
    if (drainDepth > 0) return
    void sync()
  }
  /**
   * Publish the loading state, notifying only on a real change.
   *
   * The DataSource's own `isLoading()` is NOT enough: a draining chart reads the
   * STORE directly (`readAllRows`), which never goes through the DataSource and so
   * never flips its loading flag. Reporting only `isLoading()` made the chart look
   * finished while chunk after chunk was still in flight — `draining` is the half
   * that covers it.
   */
  function setLoading(next: boolean): void {
    if (ctrl.loading === next) return
    ctrl.loading = next
    notify()
  }

  const syncLoading = (): void => {
    setLoading(drainDepth > 0 || (bound?.isLoading?.() ?? false))
  }

  const onLoadingChanged = (): void => {
    syncLoading()
    notify()
  }

  function detach(): void {
    if (!bound) return
    bound.off('changed', onChanged)
    bound.off('loadingChanged', onLoadingChanged)
    bound.off('loadError', onLoadingChanged)
    bound = null
  }

  // --- The base query -------------------------------------------------------
  //
  // `dataSourceOptions` / `odataOptions`, read fresh at every query. The chart
  // never adds a search or a column filter of its own, so the composition is
  // simpler than the grid's: base ∧ whatever the consumer set on the source.
  //
  // Where it lands depends on the path. A DRAIN reads the STORE, which never
  // sees the DataSource's own load options — so the base is handed to
  // `readAllRows` (which also reads the source's live `filter()`, so a
  // `ds.filter(x)` a consumer set is honoured there with no adoption needed).
  // A `loadAll: false` chart renders the source's own page, so the base has to
  // be ON the source before `load()` — written the way the grid writes: adopt
  // what the consumer put there, compose, write only when it changed.

  let dsOptionsSource: MaybeReactive<MonoDataSourceOptions> | undefined = opts.dataSourceOptions
  let odataOptionsSource: MaybeReactive<MonoOdataOptions> | undefined = opts.odataOptions
  let resolvedOpts: MonoDataSourceOptions = {}
  /** The consumer's own `ds.filter(...)`, adopted (page path only). */
  let externalBase: unknown = null
  /** What the source HELD after this controller's last `filter()` write (read back). */
  let lastWrittenFilter: unknown = null
  let lastComposed: unknown = undefined
  let composeMemo: { own: unknown; ext: unknown; out: unknown } | null = null

  function resolveBase(): MonoDataSourceOptions {
    resolvedOpts = resolveDataSourceOptions(dsOptionsSource, odataOptionsSource)
    return resolvedOpts
  }

  /** A base `filter` for the source at hand: arrays and predicates as-is, a raw OData string dropped for an array source. */
  function baseFilterFor(s: MonoChartSource<T> | null): unknown {
    const f = resolvedOpts.filter
    if (f == null) return null
    const remote = typeof s?.store === 'function' && !!s.store()
    if (remote) return f
    if (typeof f === 'function') return f
    if (Array.isArray(f) && f.length === 1 && typeof f[0] === 'string') return null
    return compileFilterPredicate(f)
  }

  /**
   * `loadAll: false` — the source's own page is what renders, so the base goes
   * onto the source. Adoption rule as in the grid: what the source holds that is
   * not this controller's last write is the consumer's, and becomes the base.
   */
  function applyBaseToSource(s: MonoChartSource<T>): void {
    if (typeof s.filter === 'function') {
      const live = s.filter() ?? null
      if (live !== lastWrittenFilter) externalBase = live
      const own = baseFilterFor(s)
      const remote = typeof s.store === 'function' && !!s.store()
      // Memoised on the two inputs: `andFilters` builds a fresh array, and a
      // fresh array is a "changed" filter to devextreme (whose setter resets the
      // page) — a reload that changed nothing must write nothing.
      let next: unknown
      if (composeMemo && composeMemo.own === own && composeMemo.ext === externalBase) {
        next = composeMemo.out
      } else {
        next = remote
          ? andFilters(own, externalBase)
          : andPredicates(own as RowPredicate | null, externalBase as RowPredicate | null)
        composeMemo = { own, ext: externalBase, out: next }
      }
      if (next !== lastComposed || (s.filter() ?? null) !== lastWrittenFilter) {
        s.filter(next)
        lastComposed = next
        lastWrittenFilter = s.filter() ?? null
      }
    }
    if (resolvedOpts.select !== undefined && typeof s.select === 'function') s.select(toList(resolvedOpts.select) ?? null)
    if (resolvedOpts.sort !== undefined && typeof s.sort === 'function') s.sort(normalizeSortList(resolvedOpts.sort))
    const lo = typeof s.loadOptions === 'function' ? s.loadOptions() : null
    if (lo && typeof lo === 'object') Object.assign(lo, extraLoadOptions(resolvedOpts))
  }

  /**
   * The bound source rolled up by the SERVER: ONE
   * `$apply=filter(…)/groupby((groupBy),aggregate(…))` through the source's own
   * store, one row per bucket, instead of draining every row to bucket them
   * here. Same clause `odata.aggregate` builds, same transport the grid's header
   * filter and summary use (`utils/data-source-apply`).
   *
   * `null` is the decline, and the drain is still the definition of the result:
   * the path switched off (`serverApply: false`, or a backend that already
   * rejected an `$apply` — the gate remembers), no `groupBy`, no explicit
   * `series` (the clause needs the fields; `inferSeries` reads them off rows
   * that are not there yet), a store that cannot carry an `$apply` (a
   * CustomStore), a failed request, or rows that are not buckets (a server that
   * ignored the clause hands back entities — `isRolledUp`).
   *
   * The filter is what the drain would see: the base ∧ the source's live
   * `filter()` ∧ its search, folded INSIDE the clause.
   */
  async function rollUpViaStore(s: MonoChartSource<T>): Promise<T[] | null> {
    if (applyGate.skip || !opts.groupBy) return null
    const specs = series.filter((sp) => sp?.field)
    if (!specs.length) return null
    const store = typeof s.store === 'function' ? s.store() : null
    if (!store) return null

    const apply = buildChartApply(opts.groupBy, specs)
    const filter = andFilters(baseFilterFor(s), summaryFilterOf(s))
    let rolled: Array<Record<string, unknown>> | null
    try {
      rolled = await loadApply(store, composeApply(apply, filter))
    } catch (err) {
      applyGate.reject(err)
      return null
    }
    if (!rolled) return null
    // A bucket carries the group key and the aliases and nothing else; an
    // entity carries the rest of the record — the tell that the clause was ignored.
    return isRolledUp(rolled, [opts.groupBy, ...specs.map((sp) => sp.field)]) ? (rolled as T[]) : null
  }

  /** Mirror the source's rows onto `ctrl`, re-project, then notify. */
  async function sync(): Promise<void> {
    // Rows from a bound source are RAW — each series' `agg` must run — unless
    // the server rolled them up below.
    preAggregated = false
    resolveBase()
    if (!bound) {
      rows = []
    } else if (opts.loadAll === false) {
      rows = [...(bound.items?.() ?? [])]
    } else {
      // A chart wants the whole set, not the current page. `readAllRows` passes
      // an array source straight through and drains a remote one in chunks.
      drainDepth++
      // Publish BEFORE awaiting: the old code flipped `draining` without telling
      // anyone, so the only notify came after the last chunk and a subscriber
      // never observed the load at all.
      syncLoading()
      try {
        const rolled = await rollUpViaStore(bound)
        if (rolled) {
          rows = rolled
          preAggregated = true
        } else {
          const base = resolvedOpts
          const filter = baseFilterFor(bound)
          const loadOptions = extraLoadOptions(base)
          const isArray = !(typeof bound.store === 'function' && bound.store())
          // An array source is filtered here — `readAllRows` passes arrays through
          // untouched, and the base predicate is the only filter it would miss.
          const drained = await readAllRows<T>(bound, {
            chunkSize: opts.chunkSize ?? 100,
            ...(filter != null && !isArray ? { filter } : {}),
            ...(base.select !== undefined ? { select: toList(base.select) } : {}),
            ...(base.sort !== undefined ? { sort: normalizeSortList(base.sort) } : {}),
            ...(Object.keys(loadOptions).length ? { loadOptions } : {}),
          })
          rows = isArray && typeof filter === 'function' ? drained.filter(filter as RowPredicate) : drained
        }
      } finally {
        drainDepth--
        syncLoading()
      }
    }
    ;(ctrl as { items: T[] }).items = rows
    project()
    notify()
  }

  function bind(next: MonoChartSource<T> | T[] | MonoChartData | null): void {
    if (isRawData(next)) {
      detach()
      raw = next
      rows = []
      ;(ctrl as { items: T[] }).items = rows
      ;(ctrl as { dataSource: MonoChartSource<T> | null }).dataSource = null
      project()
      notify()
      return
    }

    raw = null
    // A plain array is wrapped so everything downstream talks to one shape.
    const src: MonoChartSource<T> | null = Array.isArray(next)
      ? (monoArraySource<T>(next, { pageSize: 0 }) as MonoChartSource<T>)
      : next

    if (bound === src) return
    detach()
    bound = src
    ;(ctrl as { dataSource: MonoChartSource<T> | null }).dataSource = src
    if (!src) {
      void sync()
      return
    }
    src.on('changed', onChanged)
    src.on('loadingChanged', onLoadingChanged)
    src.on('loadError', onLoadingChanged)
    void sync()
  }

  /**
   * Load through `monoOdataFetch`.
   *
   * With `odata.aggregate` this is ONE request: the server rolls the data up with
   * `$apply` and returns a row per bucket, instead of the chart draining every row
   * to sum them locally. Without it, rows are fetched normally and `options`
   * (`select` / `filter` / `take`) is what keeps the payload small.
   *
   * `@mono-lit/utility` is imported on demand — it is an OPTIONAL peer, so a consumer that
   * never sets `odata` neither installs nor loads it (same arrangement as
   * `chart.js` itself).
   */
  async function loadOdata(): Promise<void> {
    const od = opts.odata
    if (!od?.url) return

    let fetching: any
    try {
      fetching = await import('@mono-lit/utility/fetching')
    } catch (err: any) {
      throw new Error(
        '[mono-chart] `odata` needs the optional peer dependency "@mono-lit/utility". ' +
          'Install it in your app: pnpm add @mono-lit/utility' +
          (err?.message ? ` (original error: ${err.message})` : ''),
      )
    }

    // `odata.options` ∧ the base (`dataSourceOptions` / `odataOptions`, read
    // fresh): the base filter is AND-ed under the static one and, on the `$apply`
    // path, folded inside the clause with it. Pure, so it is asserted on in tests
    // without a network.
    const request = buildChartOdataRequest({
      options: od.options,
      base: resolveBase(),
      aggregate: od.aggregate,
      groupBy: opts.groupBy,
      series,
    })

    setLoading(true)
    try {
      const res = await fetching.monoOdataFetch({
        baseUrl: od.baseUrl,
        configBaseUrl: od.configBaseUrl,
        url: od.url,
        method: od.method,
        type: 'data',
        notif: false,
        options: request.options,
        ...(Object.keys(request.params).length ? { params: request.params } : {}),
      })
      if (res?.error) throw new Error(res.error.message ?? 'odata request failed')
      rows = (res?.data ?? []) as T[]
      // Only the `$apply` path returns rolled-up rows; a plain fetch is raw.
      preAggregated = request.aggregated
    } finally {
      // `setLoading` notifies, so a failed request clears the spinner too — the
      // bare assignment here left it stuck on when the fetch threw.
      setLoading(false)
    }

    // Aggregates are aliased back to their series field, so rolled-up rows go
    // through the SAME projection as raw ones — nothing here needs to know which.
    ;(ctrl as { items: T[] }).items = rows
    project()
    notify()
  }

  async function reload(): Promise<void> {
    if (opts.odata?.url) {
      await loadOdata()
      return
    }

    // Hold the busy state across the WHOLE reload. Previously the DataSource's own
    // `load()` ran first and its loading cycle completed on its own — so the chart
    // flashed done, and only then began draining: one load "look", then a second.
    // Counting the whole operation makes it read as the single load it is.
    //
    // The same counter suppresses `onChanged`, which is the other half: the
    // `changed` event from that load used to kick off its own `sync()`, so a
    // reload drained twice over.
    drainDepth++
    syncLoading()
    try {
      // In draining mode `readAllRows` re-reads every row from the store anyway,
      // so the source's own page fetch is pure duplication — only a `loadAll:
      // false` chart renders `items()` and actually needs it — and that page is
      // what has to carry the base, so it goes onto the source first.
      if (opts.loadAll === false && bound?.load) {
        resolveBase()
        applyBaseToSource(bound)
        await bound.load()
      }
      await sync()
    } finally {
      drainDepth--
      syncLoading()
    }
  }

  async function setDataSourceOptions(next: MaybeReactive<MonoDataSourceOptions> | undefined): Promise<void> {
    dsOptionsSource = next
    await reload()
  }

  async function setOdataOptions(next: MaybeReactive<MonoOdataOptions> | undefined): Promise<void> {
    odataOptionsSource = next
    await reload()
  }

  function resolvedDataSourceOptions(): Readonly<MonoDataSourceOptions> {
    return resolvedOpts
  }

  /* ------------------------------- mutators ------------------------------ */

  function setType(next: MonoChartType): void {
    if (ctrl.type === next) return
    ctrl.type = next
    project() // pie-family recolours per point, so the projection depends on type
    notify()
  }

  function setSeries(next: MonoChartSeries[]): void {
    series = [...next]
    project()
    notify()
  }

  function setColors(next: string[]): void {
    colors = next.length ? [...next] : [...DEFAULT_COLORS]
    paletteIsDefault = !next.length
    project()
    notify()
  }

  function setData(next: MonoChartData | T[]): void {
    preAggregated = false
    bind(next as MonoChartData | T[])
  }

  /** Resolve a clicked point back to the rows that produced it. */
  function pointEvent(datasetIndex: number, index: number): MonoChartPointEvent<T> {
    return {
      index,
      datasetIndex,
      label: projected.labels?.[index],
      value: projected.datasets[datasetIndex]?.data?.[index],
      rows: buckets[index] ?? [],
    }
  }

  const ctrl: MonoChartController<T> = {
    items: rows,
    loading: false,
    type: opts.type ?? 'bar',
    dataSource: null,
    get instance() {
      return instance
    },
    data: () => projected,
    options: () => opts.options ?? {},
    props: () => elementProps,
    /**
     * Merge, not replace — a partial patch leaves everything else alone.
     * `undefined` values pass straight through: `applyProps` skips them on the
     * write side, so "not declared" can never clobber a value the template set.
     */
    setProps(patch) {
      if (!patch) return
      Object.assign(elementProps, patch)
      notify()
    },
    setType,
    setSeries,
    setColors,
    setData,
    bind,
    reload,
    refresh: reload,
    setDataSourceOptions,
    setOdataOptions,
    resolvedDataSourceOptions,
    onPointClick: null,
    subscribe: notifier.subscribe,
    dispose() {
      detach()
      notifier.clear()
      instance = null
    },
    _attachInstance(next) {
      instance = next
    },
    _setColorResolver(fn) {
      resolveColor = fn ?? ((c: string) => NAME_FALLBACK[c] ?? c)
      project()
      notify()
    },
  }

  /** @internal — the element calls this from chart.js' onClick. */
  ;(ctrl as unknown as { _emitPoint: (d: number, i: number) => void })._emitPoint = (d, i) => {
    ctrl.onPointClick?.(pointEvent(d, i))
  }

  if (source) bind(source)
  else project()

  // An `odata` chart owns its own fetching, so it loads itself — matching how
  // passing a source auto-syncs. `reload()` re-runs it on demand.
  if (!source && opts.odata?.url) {
    void loadOdata().catch((err) => {
      console.error('[mono-chart] odata load failed:', err)
    })
  }

  return ctrl
}
