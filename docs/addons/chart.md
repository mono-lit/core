# Chart.js

Charts built on [Chart.js](https://www.chartjs.org/). A `controlMonoChart(...)` controller projects your rows into chart data — the same controller-plus-`.prop` shape as `controlMonoTable` — and the `<mono-chart-*>` elements own the canvas.

```ts
import '@mono-lit/helper/ui/chart'
import { controlMonoChart } from '@mono-lit/helper'

const chart = controlMonoChart(rows, {
  labelField: 'month',
  series: [
    { field: 'sales', label: 'Sales' },
    { field: 'costs', label: 'Costs' },
  ],
})
```

```vue
<mono-chart-bar :control-chart.prop="chart" height="320" title="Sales vs costs" />
```

::: tip Install
Chart.js is an **optional peer** — it isn't bundled, so nothing pays for it unless you chart something.

```sh
pnpm add chart.js@4.5.1
```

The version is pinned exact. If it's missing, the element renders an inline message naming the package and the command rather than failing silently.
:::

## Elements

| Element | Type |
| --- | --- |
| `<mono-chart>` | whatever `type` says — `radar`, `polarArea`, `scatter`, `bubble` … |
| `<mono-chart-bar>` | `bar` |
| `<mono-chart-line>` | `line` |
| `<mono-chart-pie>` | `pie` |
| `<mono-chart-doughnut>` | `doughnut` |

The presets are `<mono-chart>` with `type` locked, so the markup states its intent. Everything else — props, controller binding, lifecycle — is identical.

## Basic

`labelField` names the category axis; each `series` entry becomes one dataset. Field names accept the same **path expressions** as the table (`Job.Budget`, `Items.[0].Total`).

<ClientOnly>
<DemoSingle name="chart" id="basic" />
</ClientOnly>

## Chart types

One controller can feed several elements — the projection is shared, only the type differs.

<ClientOnly>
<DemoSingle name="chart" id="types" />
</ClientOnly>

## Aggregating rows

Charts almost always want *summarised* data, but a data source hands you raw rows. `groupBy` buckets them and each series' `agg` collapses a bucket to one number — `sum` (default), `avg`, `count`, `min` or `max`.

```ts
const chart = controlMonoChart(transactions, {
  groupBy: 'region',
  series: [{ field: 'amount', label: 'Revenue', agg: 'sum' }],
})
```

<ClientOnly>
<DemoSingle name="chart" id="aggregation" />
</ClientOnly>

## Reactive data

The controller is a subscribable store, exactly like `controlMonoTable`. When the bound source emits `changed`, it re-syncs, re-projects and notifies — and the element updates the **existing** Chart.js instance instead of recreating the canvas, so the change animates rather than flashing.

Notifications are coalesced on a microtask, so several mutations in one tick produce a single update.

<ClientOnly>
<DemoSingle name="chart" id="reactive" />
</ClientOnly>

## From a DataSource

Bind a devextreme `DataSource` and the controller drains it — a remote source is paged, but a chart wants the whole set, so it reads every row in chunks rather than charting page one. Set `loadAll: false` to chart just the current page.

With `groupBy` and explicit `series`, a remote **OData** store is not drained at all: the controller sends ONE `GET <store url>?$apply=filter(<base ∧ source filter>)/groupby((groupBy),aggregate(…))` through the source's own store — its url, `beforeSend` and auth — and charts the buckets that come back, the same clause the [`odata.aggregate`](#server-side-roll-up-apply) path builds. The clause goes into the url (`urlOverride`), not through devextreme's `customQueryParams` (a quoted literal, and a function call on OData v4). A `CustomStore` gets no such request, a server that answers with plain entities is detected and drained instead, and a backend that rejects the clause (4xx / 501) is remembered and not asked again. `serverApply: false` switches it off; without `series` the fields are unknown up front, so the chart drains as before.

<ClientOnly>
<DemoSingle name="chart" id="datasource" />
</ClientOnly>

## Server-side roll-up (`$apply`)

Draining is the wrong shape for a summary chart: a country-total over 100k rows would be ~1000 paged requests carrying every column, to produce a dozen bars. Point the controller at the endpoint with `odata` and give it an `aggregate` — the server groups with OData's `$apply` and returns one row per bucket, in a single request. A filter folds *inside* the clause, so it's applied before the aggregation.

The demo below runs against the public TripPin service. It is a small dataset, but the shape is the point: one request, one row per bucket. The measure is `$count` because TripPin has no populated numeric column.

<ClientOnly>
<DemoSingle name="chart" id="odata-aggregate" />
</ClientOnly>

::: warning Requires the `@mono-lit/utility` peer
The request goes through `monoFetchOdata`. It's an **optional** peer loaded on demand — a chart that never sets `odata` neither needs nor loads it.
:::

## DataSource options

The chart takes the same base-query options as [`controlMonoTable`](/ui/table#datasource-options):
`dataSourceOptions` (devextreme knobs — `filter`, `select`, `expand`, `sort`,
`customQueryParams`) and `odataOptions` (`$filter`, `$select`, `$expand`, `$orderby`, other
`$params`). Each takes a value, a **getter**, or a `{ value }` box (a Vue `ref` / `computed`)
and is read fresh at every `reload()` — so a getter over reactive state always contributes
its current value, and the demo above no longer needs a hand-written `get options()`.

Where it lands depends on the path:

| Path | What the base does |
| --- | --- |
| bound DataSource, `loadAll: true` (default) | rides on every drain chunk, AND-ed under the filter the source itself carries; `select` / `sort` / `expand` shape the chunk requests |
| bound DataSource, `loadAll: false` | written onto the source before `load()`, adopting whatever filter the consumer set there |
| `odata` | merged into `odata.options`; on the `$apply` path the composed filter folds *inside* the clause |
| array | `filter` is applied as a predicate to the rows |

```ts
const chart = controlMonoChart(null, {
  groupBy: 'Gender',
  series: [{ field: 'Rows', agg: 'count' }],
  odata: { baseUrl, url: '/People', aggregate: ({ apply, filter, withFilter }) => withFilter(apply, filter) },
  odataOptions: () => (onlyA.value ? { $filter: "contains(FirstName,'A')" } : {}),
})
watch(onlyA, () => chart.refresh())
```

`refresh()` is an alias of `reload()` here — a chart has no paging to preserve, so the call
after a state change is the same either way. `setDataSourceOptions()` / `setOdataOptions()`
replace an option and reload; `resolvedDataSourceOptions()` is the merged result of the
last query.

## Raw chart.js data

Skip the mapping entirely: hand the controller a chart.js `{ labels, datasets }` object and it's used verbatim. A per-dataset `type` gives you mixed charts.

<ClientOnly>
<DemoSingle name="chart" id="raw" />
</ClientOnly>

## Theme

Charts are wired to the theme like every other component — and unlike the rest of the library there is **no attribute-styled markup** here: a chart is a canvas, so the port is the bridge into Chart.js. The **default palette is Basecoat's own chart colours**, `--chart-1` … `--chart-5`, resolved by name at paint time; the legend and title take `--foreground`, the ticks `--muted-foreground`, the grid `--border`, the tooltip is the flavour's popover — an HTML element over the canvas, painted with the select panel's corner, ring and shadow — the type is the page font at text-xs, a pie's slice hairline is `--background`, and a bar's corner is the flavour's field corner (square in lyra / sera, pills in maia / luma). So a chart with no `color` or `colors` follows the active [color preset, flavour and mode](../ui/theme) — nothing is fixed hex.

<ClientOnly>
<DemoSingle name="chart" id="theme" />
</ClientOnly>

::: warning A canvas doesn't re-cascade
Switching theme repaints every other component for free: the class swap re-cascades and CSS redraws. A chart can't — it's a bitmap painted from values resolved once, so it would keep the old palette. The elements listen for the `theme-changed` event `applyTheme()` fires, **and watch the `.dark` class** on `<html>` / `<body>` and the OS colour scheme, so a mode toggle that only swaps the class (VitePress's, or your own) repaints too. If you swap the theme classes **by hand** instead of calling `applyTheme()`, dispatch that event yourself:

```ts
window.dispatchEvent(new CustomEvent('theme-changed'))
```
:::

## Colors

Anywhere a colour is accepted you can use a **mono color name** — Basecoat's `chart-1` … `chart-5`, or the roles `primary`, `secondary`, `accent`, `success`, `warning`, `danger`, `info` — or any CSS colour, mixed freely. Use `color` for one accent, `colors` for a palette, or `series[].color` per dataset; the more specific one wins. The default palette is `chart-1` … `chart-5` followed by `success`, `warning`, `danger`, so a sixth series is still its own colour.

<ClientOnly>
<DemoSingle name="chart" id="colors" />
</ClientOnly>

::: tip Why names have to be resolved
A `<canvas>` can't resolve `var()` — raw `var(--success)` paints transparent. The element reads the token off the DOM and hands Chart.js the real value, which is why names work at all.
:::

### CSS variables

Every name resolves through a public `--mono-chart-<name>` override, so a scope can retarget what a name means without touching chart code; the inks and chrome have knobs of the same shape. They inherit, and pierce the shadow boundary.

| Variable | Default | Controls |
| --- | --- | --- |
| `--mono-chart-1` … `--mono-chart-5` | `--chart-1` … `--chart-5` | The default palette, and the `chart-n` names |
| `--mono-chart-primary` / `-secondary` / `-accent` | `--primary` / `--muted-foreground` / `--chart-2` | The role names (Basecoat's `--accent` is a surface, so `accent` is the second chart colour) |
| `--mono-chart-success` / `-warning` / `-danger` / `-info` | `--success` / `--warning` / `--destructive` / `--info` | The state names |
| `--mono-chart-text` / `-muted` / `-grid` | `--foreground` / `--muted-foreground` / `--border` | Legend + title ink, tick ink, grid + axis lines |
| `--mono-chart-surface` | `--background` | The hairline between pie / doughnut slices |
| `--mono-chart-tooltip-bg` / `-tooltip-color` / `-tooltip-radius` / `-tooltip-ring` / `-tooltip-shadow` | the select panel's popover: `--mono-select-dropdown-*` → `--popover` / `--popover-foreground` / `--mono-radius-md` / a 1px `--foreground` 10% ring / `--mono-shadow-md` | The tooltip — an HTML popover placed over the canvas, so the flavour's corner, ring and shadow reach it (luma's 3xl + shadow-lg, lyra's square, maia's 2xl) |
| `--mono-chart-font` / `-font-family` | `--mono-text-xs` / `--font-sans` | Every label's type (read as computed px, so a `rem` works) |
| `--mono-chart-radius` | `--mono-radius-md` | The tooltip's corner and the empty / error message box |
| `--mono-chart-bar-radius` | the field corner: `--mono-input-outline-radius` → `--mono-input-radius` → `--mono-radius-md` | A bar's free-end corner — square in lyra / sera, a pill in maia / luma, with nothing set (Chart.js clamps it to half a bar) |

Deprecated and honoured as no-ops until 2.0: the `--theme-*` bridge (`--theme-primary`, `--theme-text`, `--theme-border` …) — every default reads a Basecoat token now.

## Customising

Every layer is live in one demo: `color` / `colors` on the element, `series[].color` per dataset, `--mono-chart-*` to retarget what a *name* means, and raw Chart.js options for everything else.

Anything Chart.js supports is reachable through `options` on the controller or `chart-options` on the element — both are **deep-merged over** the generated defaults, so you keep the theming and override only what you name.

<ClientOnly>
<DemoSingle name="chart" id="color-custom" />
</ClientOnly>

Overriding the variable is the theme-level lever — every chart that asked for `success` follows, with no chart code touched. The same works for the default palette (`--mono-chart-1` … `-5`) and the chrome:

```css
.sales-dashboard {
  --mono-chart-success: #0f9d58;
  --mono-chart-danger: #d93025;
  --mono-chart-grid: transparent; /* no grid lines on this dashboard */
}
```

<ClientOnly>
<DemoSingle name="chart" id="customized" />
</ClientOnly>

## Controller API

```ts
const chart = controlMonoChart(source, options)
```

`source` is an array, a devextreme `DataSource`, a raw chart.js `data` object, or `null`.

| Option | Purpose |
| --- | --- |
| `type` | Default chart type (`'bar'`) |
| `labelField` | Row field for the category axis |
| `groupBy` | Bucket rows by this field before charting |
| `series[]` | `{ field, label?, agg?, color?, type?, dataset? }` — one dataset each |
| `colors[]` | Palette — mono color names or CSS colors |
| `options` | Raw chart.js options, deep-merged |
| `props` | The element's own props, declared centrally — see [Element props](#element-props) |
| `odata` | Fetch through `monoFetchOdata` (`configBaseUrl` / `baseUrl` / `url` / `method` / `options`). Add `aggregate` to roll up on the server — see [Server-side roll-up](#server-side-roll-up-apply) |
| `loadAll` | Drain a remote source instead of charting one page (default `true`) |
| `serverApply` | Let a bound OData store roll the data up with one `$apply` instead of draining (default `true`; needs `groupBy` + `series`) — see [From a DataSource](#from-a-datasource) |
| `dataSourceOptions` / `odataOptions` | The sticky base every query goes out on — see [DataSource options](#datasource-options) |

| Member | Purpose |
| --- | --- |
| `items` | Rows currently backing the chart |
| `loading` | True while the source loads |
| `data()` / `options()` | The projected chart.js data / merged options |
| `props()` / `setProps(patch)` | Read / merge the central element props |
| `setType` / `setSeries` / `setColors` / `setData` | Reproject |
| `bind(source)` / `reload()` / `refresh()` | Swap or re-read the source (`refresh` is an alias of `reload`) |
| `setDataSourceOptions` / `setOdataOptions` / `resolvedDataSourceOptions` | Replace the base and reload / read the merged base |
| `onPointClick` | Assignable sink — receives the label, value **and the rows that produced the point** |
| `subscribe(cb)` / `dispose()` | Lifecycle |

`onPointClick` reports the underlying rows, which is what makes drill-down work: click a bar and you get back the bucket that built it.

```ts
chart.onPointClick = ({ label, value, rows }) => {
  console.log(label, value, rows) // rows = every record in that bucket
}
```

## Element props

Declare the element's own props in the controller's `props` block and every bound `<mono-chart*>` needs nothing but `:control-chart.prop="chart"` — the same arrangement as [`controlMonoTable({ props })`](/ui/table), minus the per-element nesting, since the presets are one element with `type` fixed.

```ts
const chart = controlMonoChart(rows, {
  groupBy: 'month',
  series: [{ field: 'amount', label: 'Revenue', agg: 'sum' }],
  props: { height: 320, legend: 'bottom', stacked: true },
})

chart.props()                      // { height: 320, legend: 'bottom', stacked: true }
chart.setProps({ legend: 'right' }) // merges, notifies, every bound element re-applies
```

`props()` returns one object with a stable identity, so a controller can drive several charts and keep them in sync. `setProps` is a **merge** — keys you omit keep their current value.

::: tip Setting props on the element still works
Writing `height` / `legend` / `stacked` directly on `<mono-chart-bar>` is still supported. Where both declare the same key, the **controller wins**; keys the controller never mentions are left to the template.
:::

## Server rendering

A chart can't be server-rendered — Chart.js paints onto a canvas at runtime. The SSR build (`@mono-lit/helper/ui/shadow/chart`) emits a correctly-sized empty `<canvas>` and draws on hydration, so layout doesn't shift. `controlMonoChart` itself is a pure factory and is safe to import on the server.

## Props

`controlMonoChart` is also exported as `monoChart`, and `:control-chart` is also accepted as `:data-chart` — the older spellings still work.

<DemoTypes name="chart" />

## Optional dependency

`chart.js` is declared as an optional `peerDependency` pinned to `4.5.1`, and is loaded with a dynamic `import('chart.js/auto')` the first time an element renders. It is **externalized** from the build, so `dist/ui/chart.js` stays around 13 kB and resolves against your app's copy at runtime — install it yourself, and nothing else in @mono-lit/helper is affected if you don't.
