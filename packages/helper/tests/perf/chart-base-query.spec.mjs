// The chart's base query: `dataSourceOptions` / `odataOptions` on `monoChart`,
// the same option `controlMonoTable` takes.
//
// The chart never adds a search or a column filter of its own, so unlike the
// grid it had no "wipe" bug — but it had no reactive base either, and its two
// data paths carry one differently:
//   · a DRAIN (`loadAll: true`, the default) reads the STORE, which never sees
//     the DataSource's own load options — the base rides along on each chunk;
//   · a PAGE chart (`loadAll: false`) renders the source's own `items()`, so the
//     base has to be written ONTO the source before `load()` — adopted, composed
//     and written the way the grid does it.
// The `odata` path is pure (`buildChartOdataRequest`) and pinned in vitest.
//
// Controller-only, like `base-filter.spec.mjs`: the node entry against
// recording stand-ins, asserting on what the source / store were asked for.

import { monoChart } from '@mono-lit/helper'

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

/** A recording store: every `load()` is kept; rows are served by `filter`-blind slicing. */
function recordingStore(rows = []) {
  const loads = []
  return {
    loads,
    load: async (o) => {
      loads.push(o)
      return rows.slice(o?.skip ?? 0, (o?.skip ?? 0) + (o?.take ?? rows.length))
    },
  }
}

/** A DataSource stand-in over a store, with real get/set accessors and a live `loadOptions()`. */
function recordingSource({ rows = [], store }) {
  const st = { filter: null, sort: null, select: null, paginate: true, pageIndex: 0, pageSize: 50, searchValue: null }
  const lo = {}
  const loads = []
  const handlers = {}
  const acc = (k) => (v) => (v === undefined ? st[k] : ((st[k] = v), v))
  return {
    loads,
    filter: acc('filter'), sort: acc('sort'), select: acc('select'), paginate: acc('paginate'),
    pageIndex: acc('pageIndex'), pageSize: acc('pageSize'), searchValue: acc('searchValue'),
    searchExpr: () => undefined, searchOperation: () => 'contains',
    loadOptions: () => lo,
    load: async () => { loads.push({ filter: st.filter, select: st.select, sort: st.sort }); return rows },
    items: () => rows,
    isLoading: () => false,
    isLastPage: () => true,
    on: (e, h) => void (handlers[e] ??= []).push(h),
    off: () => {},
    store: () => store,
  }
}

const settle = () => sleep(40)
const eq = (a, b) => JSON.stringify(a) === JSON.stringify(b)
const has = (h, n) => JSON.stringify(h ?? null).includes(JSON.stringify(n))
const lastChunk = (store) => store.loads[store.loads.length - 1]

const ROWS = [
  { Id: 1, Dept: 'A', Total: 10 },
  { Id: 2, Dept: 'A', Total: 5 },
  { Id: 3, Dept: 'B', Total: 7 },
]
const SERIES = [{ field: 'Total', agg: 'sum' }]

export async function run({ reporter }) {
  // ── C1: drain — the base rides on every chunk, under the source's own filter ─
  {
    const store = recordingStore(ROWS)
    const src = recordingSource({ rows: ROWS, store })
    src.filter(['Year', '=', 2024]) // the consumer's own scope
    const state = { dept: 'A' }
    const chart = monoChart(src, {
      groupBy: 'Dept',
      series: SERIES,
      dataSourceOptions: () => ({ filter: ['Dept', '=', state.dept], select: ['Dept', 'Total'], sort: 'Dept', expand: 'Owner' }),
      odataOptions: { $count: true },
    })
    await settle()
    const chunk = lastChunk(store)
    reporter.check(
      'C1: a drain chunk carries the consumer\'s filter AND the base, plus select/sort/expand/params',
      chunk && has(chunk.filter, ['Year', '=', 2024]) && has(chunk.filter, ['Dept', '=', 'A']) &&
        eq(chunk.select, ['Dept', 'Total']) && eq(chunk.sort, [{ selector: 'Dept', desc: false }]) &&
        eq(chunk.expand, ['Owner']) && eq(chunk.customQueryParams, { $count: true }),
      JSON.stringify(chunk),
    )
    state.dept = 'B'
    await chart.refresh()
    reporter.check(
      'C1: the getter is read fresh on refresh()',
      has(lastChunk(store).filter, ['Dept', '=', 'B']) && !has(lastChunk(store).filter, ['Dept', '=', 'A']),
      JSON.stringify(lastChunk(store).filter),
    )
    src.filter(['Year', '=', 2025]) // the consumer moves the scope on the source itself
    await chart.reload()
    reporter.check(
      'C1: a filter the consumer sets on the source later is honoured by the next drain too',
      has(lastChunk(store).filter, ['Year', '=', 2025]) && has(lastChunk(store).filter, ['Dept', '=', 'B']),
      JSON.stringify(lastChunk(store).filter),
    )
  }
  // C1 control — no base: the chunk carries the source's own filter and nothing else.
  {
    const store = recordingStore(ROWS)
    const src = recordingSource({ rows: ROWS, store })
    src.filter(['Year', '=', 2024])
    monoChart(src, { groupBy: 'Dept', series: SERIES })
    await settle()
    const chunk = lastChunk(store)
    reporter.check(
      'C1 control: without a base the chunk is the source\'s own filter, no select/expand',
      chunk && eq(chunk.filter, ['Year', '=', 2024]) && chunk.select === undefined && chunk.expand === undefined,
      JSON.stringify(chunk),
    )
  }

  // ── C2: page chart — the base is written ONTO the source, adopting the consumer's ─
  {
    const store = recordingStore(ROWS)
    const src = recordingSource({ rows: ROWS, store })
    src.filter(['Year', '=', 2024])
    const chart = monoChart(src, {
      loadAll: false,
      groupBy: 'Dept',
      series: SERIES,
      dataSourceOptions: { filter: ['Dept', '=', 'A'], select: ['Dept', 'Total'] },
    })
    await settle()
    await chart.reload()
    const first = src.loads[src.loads.length - 1]
    reporter.check(
      'C2: a page chart writes base ∧ consumer filter (and select) onto the source before load()',
      first && has(first.filter, ['Year', '=', 2024]) && has(first.filter, ['Dept', '=', 'A']) && eq(first.select, ['Dept', 'Total']),
      JSON.stringify(first),
    )
    src.filter(['Year', '=', 2025]) // the consumer's watcher fires on the same source
    await chart.reload()
    const second = src.loads[src.loads.length - 1]
    reporter.check(
      'C2: a filter the consumer sets later is adopted, not overwritten by the stale composition',
      has(second.filter, ['Year', '=', 2025]) && !has(second.filter, ['Year', '=', 2024]) && has(second.filter, ['Dept', '=', 'A']),
      JSON.stringify(second.filter),
    )
    await chart.reload()
    const third = src.loads[src.loads.length - 1]
    reporter.check(
      'C2 control: an unchanged composition is not rewritten (same reference, no growth)',
      third.filter === second.filter,
      `same reference: ${third.filter === second.filter}`,
    )
  }

  // ── C3: array source — the base predicate filters the drained rows ───────────
  {
    const state = { dept: 'A' }
    const chart = monoChart(ROWS, {
      groupBy: 'Dept',
      series: SERIES,
      dataSourceOptions: () => ({ filter: ['Dept', '=', state.dept] }),
    })
    await settle()
    const a = chart.data()
    state.dept = 'B'
    await chart.refresh()
    const b = chart.data()
    reporter.check(
      'C3: an array chart applies the base as a predicate, re-read on refresh()',
      eq(a.labels, ['A']) && eq(a.datasets[0].data, [15]) && eq(b.labels, ['B']) && eq(b.datasets[0].data, [7]),
      `A: ${JSON.stringify(a.labels)}/${JSON.stringify(a.datasets[0]?.data)}; B: ${JSON.stringify(b.labels)}/${JSON.stringify(b.datasets[0]?.data)}`,
    )
  }

  // ── C4: setDataSourceOptions / setOdataOptions / resolvedDataSourceOptions ──
  {
    const store = recordingStore(ROWS)
    const src = recordingSource({ rows: ROWS, store })
    const chart = monoChart(src, { groupBy: 'Dept', series: SERIES })
    await settle()
    await chart.setOdataOptions({ $filter: "Dept eq 'A'", $select: 'Dept,Total' })
    const chunk = lastChunk(store)
    reporter.check(
      'C4: setOdataOptions parses $filter into the array form, unions $select, and reloads',
      has(chunk.filter, ['Dept', '=', 'A']) && eq(chunk.select, ['Dept', 'Total']) &&
        eq(chart.resolvedDataSourceOptions().select, ['Dept', 'Total']),
      JSON.stringify(chunk),
    )
    await chart.setDataSourceOptions(undefined)
    await chart.setOdataOptions(undefined)
    reporter.check(
      'C4: clearing both options drops the base again',
      lastChunk(store).filter === undefined && lastChunk(store).select === undefined,
      JSON.stringify(lastChunk(store)),
    )
  }

  // ── C5: a bound ODataStore is rolled up by the SERVER — ONE `$apply` ────────
  //
  // `groupBy` + `series` on a remote source used to mean draining every row in
  // chunks and bucketing them here. A devextreme ODataStore (`version()`) now
  // gets ONE `<url>?$apply=filter(<base ∧ source>)/groupby((Dept),aggregate(…))`
  // — the clause INTO the url, never `customQueryParams` — and the rolled-up rows
  // project without re-aggregating. A CustomStore, a server that hands back
  // entities, a rejection (remembered) or `serverApply: false` drain as before.
  const ODATA_URL = 'https://x.test/odata/Entity'
  const odataStore = (store) => Object.assign(store, { version: () => 4, _requestDispatcher: { url: ODATA_URL } })
  const applyOf = (o) => {
    const m = /[?&]\$apply=([^&]*)/.exec(o?.urlOverride ?? '')
    return m ? decodeURIComponent(m[1]) : null
  }
  {
    const store = odataStore({
      loads: [],
      load: async (o) => {
        store.loads.push(o)
        if (applyOf(o)) return [{ Dept: 'A', Total: 15 }, { Dept: 'B', Total: 7 }]
        return ROWS.slice(o?.skip ?? 0, (o?.skip ?? 0) + (o?.take ?? ROWS.length))
      },
    })
    const src = recordingSource({ rows: ROWS, store })
    src.filter(['Year', '=', 2024])
    const chart = monoChart(src, { groupBy: 'Dept', series: SERIES, dataSourceOptions: { filter: ['Dept', '<>', 'C'] } })
    await settle()
    const d = chart.data()
    const req = store.loads[0]
    reporter.check(
      'C5: ONE <url>?$apply=filter(<base ∧ source filter>)/groupby((Dept),aggregate(Total with sum as Total)), no drain',
      store.loads.length === 1 && req.urlOverride?.startsWith(`${ODATA_URL}?$apply=`) && req.customQueryParams === undefined &&
        applyOf(req) === "filter(Dept ne 'C' and Year eq 2024)/groupby((Dept),aggregate(Total with sum as Total))" &&
        req.requireTotalCount === false,
      `${store.loads.length} request(s): ${JSON.stringify(store.loads)}`,
    )
    reporter.check(
      'C5: the rolled-up rows project as-is — one bucket per row, the value read, not re-summed',
      eq(d.labels, ['A', 'B']) && eq(d.datasets[0].data, [15, 7]),
      `${JSON.stringify(d.labels)} / ${JSON.stringify(d.datasets[0]?.data)}`,
    )
  }
  {
    // A server that hands back entities (ignored the clause): drain, same picture.
    const store = odataStore(recordingStore(ROWS))
    const src = recordingSource({ rows: ROWS, store })
    const chart = monoChart(src, { groupBy: 'Dept', series: SERIES })
    await settle()
    const d = chart.data()
    reporter.check(
      'C5 fallback: entities instead of buckets → the drain runs and the client rolls up',
      applyOf(store.loads[0]) !== null && store.loads.length >= 2 && eq(d.labels, ['A', 'B']) && eq(d.datasets[0].data, [15, 7]),
      `${store.loads.length} request(s); ${JSON.stringify(d.labels)} / ${JSON.stringify(d.datasets[0]?.data)}`,
    )
  }
  {
    // A backend that rejects `$apply`: drain, and the next reload never asks again.
    const store = odataStore({
      loads: [],
      load: async (o) => {
        store.loads.push(o)
        if (applyOf(o)) throw Object.assign(new Error('404'), { httpStatus: 404 })
        return ROWS.slice(o?.skip ?? 0, (o?.skip ?? 0) + (o?.take ?? ROWS.length))
      },
    })
    const src = recordingSource({ rows: ROWS, store })
    const chart = monoChart(src, { groupBy: 'Dept', series: SERIES })
    await settle()
    const applies = () => store.loads.filter((o) => applyOf(o)).length
    const first = applies()
    await chart.reload()
    await settle()
    reporter.check(
      'C5 sticky: a 4xx drains now and is not retried on reload()',
      first === 1 && applies() === 1 && eq(chart.data().datasets[0].data, [15, 7]),
      `$apply requests ${first} → ${applies()}; ${JSON.stringify(chart.data().datasets[0]?.data)}`,
    )
  }
  {
    // `serverApply: false` and a CustomStore (no `version()`): never tried.
    const off = odataStore(recordingStore(ROWS))
    const chartOff = monoChart(recordingSource({ rows: ROWS, store: off }), { groupBy: 'Dept', series: SERIES, serverApply: false })
    const custom = recordingStore(ROWS)
    const chartCustom = monoChart(recordingSource({ rows: ROWS, store: custom }), { groupBy: 'Dept', series: SERIES })
    await settle()
    reporter.check(
      'C5 opt-out: serverApply: false and a CustomStore never send an $apply',
      off.loads.every((o) => !applyOf(o)) && custom.loads.every((o) => o.urlOverride === undefined) &&
        eq(chartOff.data().datasets[0].data, [15, 7]) && eq(chartCustom.data().datasets[0].data, [15, 7]),
      `off ${JSON.stringify(off.loads[0])}; custom ${JSON.stringify(custom.loads[0])}`,
    )
  }
}
