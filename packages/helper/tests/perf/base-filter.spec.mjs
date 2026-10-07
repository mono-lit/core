// The base query: a filter the consumer owns survives everything the grid does.
//
// The shape, from `input-transfer-budget.vue`'s picker panels: the store scopes
// the DataSource itself (`datasource.filter([...])`, `ds.sort(...)`) and hands it
// to `controlMonoDataDropdown`. The user then types in the panel's search box.
//
// The grid had no notion of a base. `applyColumnFilters()` rebuilt `s.filter()`
// from its own column filters and search, starting from `null`, and ran on every
// search branch — the devextreme-folded one and the clear included. So the first
// keystroke wrote `filter(null)` over the scope, clearing wrote `null` again, and
// every sort and page after that loaded unscoped. `setFilter()` was a bare
// replace that dropped the column filters and search too.
//
// Pure controller state — `monoDataGrid` needs no DOM — so, like
// `scroll-paging-race`, this drives the node entry directly against a recording
// stand-in and asserts on what the SOURCE was told.

import { monoDataGrid, monoArraySource } from '@mono-lit/helper'

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

/**
 * A devextreme-DataSource stand-in that records what each `load()` was asked for.
 *
 * Every accessor is a real get/set pair (a getter-only `filter: () => null` is
 * what the OTHER perf fakes do, and that shape is covered by arm A14), and
 * `loadOptions()` hands back the live options object the way devextreme does —
 * it is the only route to `expand` / `customQueryParams`.
 */
function recordingSource({ rows = [], store = null, pageSize = 20 } = {}) {
  const st = {
    filter: null, sort: null, select: null, searchValue: null, searchExpr: undefined,
    searchOperation: 'contains', paginate: true, pageSize, pageIndex: 0, requireTotalCount: false,
  }
  const lo = {} // expand / customQueryParams live here
  const handlers = {}
  const emit = (e) => (handlers[e] ?? []).slice().forEach((h) => h())
  const loads = []
  const acc = (name) => (v) => (v === undefined ? st[name] : ((st[name] = v), v))
  const src = {
    loads,
    filter: (v) => {
      if (v === undefined) return st.filter
      st.filter = v
      st.pageIndex = 0 // devextreme's setter resets the page — the whole reason writes must be sparse
      return v
    },
    sort: acc('sort'),
    select: acc('select'),
    searchValue: acc('searchValue'),
    searchExpr: acc('searchExpr'),
    searchOperation: acc('searchOperation'),
    paginate: acc('paginate'),
    pageSize: acc('pageSize'),
    pageIndex: acc('pageIndex'),
    requireTotalCount: acc('requireTotalCount'),
    loadOptions: () => lo,
    load: async () => {
      loads.push({
        filter: st.filter, sort: st.sort, select: st.select, searchValue: st.searchValue,
        pageIndex: st.pageIndex, pageSize: st.pageSize, paginate: st.paginate,
        expand: lo.expand, customQueryParams: lo.customQueryParams,
      })
      emit('changed')
      return rows
    },
    items: () => rows,
    isLoading: () => false,
    isLastPage: () => true,
    totalCount: () => rows.length,
    on: (e, h) => void (handlers[e] ??= []).push(h),
    off: (e, h) => void (handlers[e] = (handlers[e] ?? []).filter((x) => x !== h)),
  }
  if (store) src.store = () => store
  return src
}

/** A recording store, for the server-group and drain arms. */
function recordingStore(rows = []) {
  const loads = []
  return {
    loads,
    load: async (o) => {
      loads.push(o)
      if (o?.group) return [{ key: 'A', count: rows.length, items: null }]
      return rows.slice(o?.skip ?? 0, (o?.skip ?? 0) + (o?.take ?? rows.length))
    },
  }
}

/**
 * Dress a fake store up as a devextreme `ODataStore`: `version()` and the url
 * the request dispatcher exposes — the two things the `$apply` transport reads.
 */
const ODATA_URL = 'https://x.test/odata/Entity'
const odataStore = (store, version = 4) =>
  Object.assign(store, { version: () => version, _requestDispatcher: { url: ODATA_URL } })
/** The `$apply` clause a load carried (decoded from `urlOverride`), or `null`. */
const applyOf = (o) => {
  const m = /[?&]\$apply=([^&]*)/.exec(o?.urlOverride ?? '')
  return m ? decodeURIComponent(m[1]) : null
}

const last = (src) => src.loads[src.loads.length - 1]
const eq = (a, b) => JSON.stringify(a) === JSON.stringify(b)
const has = (haystack, needle) => JSON.stringify(haystack ?? null).includes(JSON.stringify(needle))

const BASE = ['Dept', '=', 'A']
const LATER = ['Dept', '=', 'B']

export async function run({ reporter }) {
  // ── A1: a filter set at construction survives search and clear ─────────────
  {
    const src = recordingSource({ store: recordingStore() })
    src.filter(BASE)
    const grid = monoDataGrid(src, { keyExpr: 'Id', searchExpr: ['Company.Name'] }) // a PATH: non-foldable
    await grid.load()
    await grid.setSearch('x')
    const searched = last(src).filter
    await grid.setSearch('')
    const cleared = last(src).filter
    reporter.check(
      'A1: a construction-time filter is AND-ed under a search, not replaced by it',
      Array.isArray(searched) && searched[0] === BASE && searched[1] === 'and',
      `after search: ${JSON.stringify(searched)}`,
    )
    reporter.check(
      'A1: …and clearing the search leaves exactly that filter',
      cleared === BASE,
      `after clear: ${JSON.stringify(cleared)} (was null: the reported "no filter change on clear")`,
    )
  }
  // A1 control — no base: search alone, then null.
  {
    const src = recordingSource({ store: recordingStore() })
    const grid = monoDataGrid(src, { keyExpr: 'Id', searchExpr: ['Company.Name'] })
    await grid.load()
    await grid.setSearch('x')
    const searched = last(src).filter
    await grid.setSearch('')
    reporter.check(
      'A1 control: with no base the search expr stands alone and clears to null',
      searched != null && !has(searched, 'Dept') && last(src).filter === null,
      `search: ${JSON.stringify(searched)}, cleared: ${JSON.stringify(last(src).filter)}`,
    )
  }

  // ── A2: a filter set LATER on the same source is adopted ───────────────────
  {
    const src = recordingSource({ store: recordingStore(), rows: Array.from({ length: 20 }, (_, i) => ({ Id: i + 1 })) })
    src.filter(BASE)
    const grid = monoDataGrid(src, { keyExpr: 'Id', searchExpr: ['Company.Name'] })
    await grid.load()
    src.filter(LATER) // the watcher fires
    await grid.setSearch('x')
    const afterSearch = last(src).filter
    await grid.setColumnFilter('C', [1])
    const afterCol = last(src).filter
    await grid.setSort('Name', 'asc')
    const afterSort = last(src).filter
    await grid.setPage(1)
    const pageLoad = last(src)
    reporter.check(
      'A2: a filter set after bind is adopted and survives search, column filter and sort',
      has(afterSearch, LATER) && !has(afterSearch, BASE) &&
        has(afterCol, LATER) && has(afterCol, ['C', '=', 1]) &&
        has(afterSort, LATER),
      `search ${JSON.stringify(afterSearch)}\n        col ${JSON.stringify(afterCol)}\n        sort ${JSON.stringify(afterSort)}`,
    )
    reporter.check(
      'A2: a plain page change keeps the filter reference AND its page',
      pageLoad.filter === afterSort && pageLoad.pageIndex === 1,
      `page load: pageIndex=${pageLoad.pageIndex}, same filter reference=${pageLoad.filter === afterSort} ` +
        '(a rewritten filter resets devextreme to page 0)',
    )
    // Scroll paging: a reset applies the base; an append keeps the current query.
    await grid.setSearch('')
    await grid.setColumnFilter('C', [])
    src.isLastPage = () => false
    src.totalCount = () => 100
    await grid.setScrollPaging('infinity')
    const reset = last(src)
    await grid.loadNext()
    const next = last(src)
    reporter.check(
      'A2: scroll — the reset carries the base, the append reuses the same query at page 1',
      reset.filter === LATER && next.filter === LATER && next.pageIndex === 1,
      `reset ${JSON.stringify(reset.filter)} p${reset.pageIndex}; next ${JSON.stringify(next.filter)} p${next.pageIndex}`,
    )
  }
  // A2c — an append never re-reads the options: page N belongs to the query on screen.
  {
    const state = { dept: 'A' }
    const src = recordingSource({ store: recordingStore(), rows: Array.from({ length: 20 }, (_, i) => ({ Id: i + 1 })) })
    src.isLastPage = () => false
    src.totalCount = () => 100
    const grid = monoDataGrid(src, { keyExpr: 'Id', dataSourceOptions: () => ({ filter: ['Dept', '=', state.dept] }) })
    await grid.setScrollPaging('infinity')
    const reset = last(src)
    state.dept = 'B' // the reactive state moves while the user is mid-scroll
    await grid.loadNext()
    const next = last(src)
    await grid.load() // a RESET is a new query and takes it
    reporter.check(
      'A2c: loadNext() appends page 1 of the query on screen even if the getter changed; the next reset takes the change',
      eq(reset.filter, ['Dept', '=', 'A']) && next.pageIndex === 1 && next.filter === reset.filter &&
        eq(last(src).filter, ['Dept', '=', 'B']) && last(src).pageIndex === 0,
      `reset ${JSON.stringify(reset.filter)}; append p${next.pageIndex} ${JSON.stringify(next.filter)}; ` +
        `re-reset ${JSON.stringify(last(src).filter)} p${last(src).pageIndex} ` +
        '(re-reading mid-scroll would splice rows of a different query under the list)',
    )
  }
  // A2 control — clearing on the source is adopted as "no base".
  {
    const src = recordingSource({ store: recordingStore() })
    src.filter(BASE)
    const grid = monoDataGrid(src, { keyExpr: 'Id', searchExpr: ['Company.Name'] })
    await grid.load()
    await grid.setSearch('x')
    src.filter(null)
    await grid.setSearch('y')
    reporter.check(
      'A2 control: ds.filter(null) after a search is adopted — the next search stands alone',
      !has(last(src).filter, 'Dept') && has(last(src).filter, 'y'),
      `${JSON.stringify(last(src).filter)} (adopting only against "what I wrote" would re-adopt null forever, or never)`,
    )
  }

  // ── A3: setFilter is a layer, not a replacement ────────────────────────────
  {
    const src = recordingSource({ store: recordingStore() })
    src.filter(BASE)
    const grid = monoDataGrid(src, { keyExpr: 'Id' })
    await grid.load()
    await grid.setColumnFilter('C', [1])
    const X = ['Status', '=', 'open']
    await grid.setFilter(X)
    const withX = last(src).filter
    await grid.setFilter(null)
    const without = last(src).filter
    reporter.check(
      'A3: setFilter(X) keeps the base and the column filter',
      has(withX, BASE) && has(withX, X) && has(withX, ['C', '=', 1]),
      JSON.stringify(withX),
    )
    reporter.check(
      'A3: setFilter(null) clears only that layer',
      has(without, BASE) && !has(without, X) && has(without, ['C', '=', 1]) &&
        eq(grid.filteredColumns(), ['C']),
      `${JSON.stringify(without)}; filteredColumns=${JSON.stringify(grid.filteredColumns())} ` +
        '(the filter builder\'s Clear used to wipe the consumer\'s scope)',
    )
  }
  // A3 control — a column filter alone has the shape it always had.
  {
    const src = recordingSource({ store: recordingStore() })
    const grid = monoDataGrid(src, { keyExpr: 'Id' })
    await grid.load()
    await grid.setColumnFilter('C', [1, 2])
    reporter.check(
      'A3 control: a lone column filter is the same OR-clause as before',
      eq(last(src).filter, [['C', '=', 1], 'or', ['C', '=', 2]]),
      JSON.stringify(last(src).filter),
    )
  }

  // ── A4: dataSourceOptions is read fresh per query ──────────────────────────
  {
    const state = { dept: 'A' }
    const src = recordingSource({ store: recordingStore() })
    const grid = monoDataGrid(src, {
      keyExpr: 'Id',
      dataSourceOptions: () => ({ filter: ['Dept', '=', state.dept] }),
    })
    await grid.load()
    const first = last(src).filter
    await grid.setPage(1)
    const paged = last(src)
    state.dept = 'B'
    await grid.setPage(2) // any component-driven query picks the new value up
    const picked = last(src)
    await grid.refresh()
    const refreshed = last(src)
    reporter.check(
      'A4: a getter is read at every query — an unchanged one costs no write and keeps the page',
      eq(first, ['Dept', '=', 'A']) && paged.filter === first && paged.pageIndex === 1,
      `first ${JSON.stringify(first)}; paged p${paged.pageIndex} same ref=${paged.filter === first}`,
    )
    reporter.check(
      'A4: …a changed one lands on the very next query, and refresh() restarts at page 0',
      eq(picked.filter, ['Dept', '=', 'B']) && eq(refreshed.filter, ['Dept', '=', 'B']) && refreshed.pageIndex === 0,
      `next query ${JSON.stringify(picked.filter)}; refresh p${refreshed.pageIndex}`,
    )
  }
  // A4b — a `{ value }` box and setDataSourceOptions
  {
    const box = { value: { filter: ['Dept', '=', 'A'], select: ['Id', 'Name'] } }
    const src = recordingSource({ store: recordingStore() })
    const grid = monoDataGrid(src, { keyExpr: 'Id', dataSourceOptions: box })
    await grid.load()
    const before = last(src)
    box.value = { filter: ['Dept', '=', 'C'] }
    await grid.refresh()
    const after = last(src)
    await grid.setDataSourceOptions({ filter: ['Dept', '=', 'D'], select: ['Id'] })
    const set = last(src)
    reporter.check(
      'A4b: a { value } box works, and setDataSourceOptions replaces it',
      eq(before.filter, ['Dept', '=', 'A']) && eq(before.select, ['Id', 'Name']) &&
        eq(after.filter, ['Dept', '=', 'C']) && after.select === null &&
        eq(set.filter, ['Dept', '=', 'D']) && eq(set.select, ['Id']) &&
        eq(grid.resolvedDataSourceOptions().select, ['Id']),
      `before ${JSON.stringify(before.filter)}/${JSON.stringify(before.select)}; ` +
        `after ${JSON.stringify(after.filter)}/${JSON.stringify(after.select)} (a dropped knob is cleared); ` +
        `set ${JSON.stringify(set.filter)}/${JSON.stringify(set.select)}`,
    )
  }

  // ── A5: odataOptions.$filter is parsed and composed ────────────────────────
  {
    const src = recordingSource({ store: recordingStore() })
    src.filter(BASE)
    const grid = monoDataGrid(src, {
      keyExpr: 'Id',
      searchExpr: ['Company.Name'],
      odataOptions: { $filter: "Status eq 'A' and Year ge 2024" },
    })
    await grid.load()
    await grid.setSearch('x')
    const f = last(src).filter
    reporter.check(
      'A5: a raw $filter is parsed into the array form and AND-ed with the base and the search',
      has(f, ['Status', '=', 'A']) && has(f, ['Year', '>=', 2024]) && has(f, BASE) && has(f, 'x') && !has(f, 'eq'),
      JSON.stringify(f),
    )
  }
  {
    const src = recordingSource({ store: recordingStore() })
    let threw = false
    let f
    try {
      const grid = monoDataGrid(src, { keyExpr: 'Id', odataOptions: { $filter: 'Detail/any(d: d/X eq 1)' } })
      await grid.load()
      f = last(src).filter
    } catch { threw = true }
    reporter.check(
      'A5b: a $filter the parser cannot read falls back to the raw one-element form',
      !threw && eq(f, ['(Detail/any(d: d/X eq 1))']),
      threw ? 'THREW — the parser throws on unsupported syntax' : JSON.stringify(f),
    )
  }

  // ── A6 / A7: select, expand, customQueryParams ─────────────────────────────
  {
    const src = recordingSource({ store: recordingStore() })
    const grid = monoDataGrid(src, {
      keyExpr: 'Id',
      dataSourceOptions: { select: ['Id'], expand: ['Dept'], customQueryParams: { a: 1, $top: 5 } },
      odataOptions: { $select: 'Name, Code', $expand: 'Owner', $count: true, a: 2 },
    })
    await grid.load()
    const l = last(src)
    reporter.check(
      'A6: $select (comma string) and select (array) reach ds.select() as one array',
      eq(l.select, ['Id', 'Name', 'Code']),
      JSON.stringify(l.select),
    )
    reporter.check(
      'A7: expand and customQueryParams land in loadOptions(); the OData bag wins ties, stray $keys go to customQueryParams',
      eq(l.expand, ['Dept', 'Owner']) && eq(l.customQueryParams, { a: 2, $top: 5, $count: true }),
      `expand ${JSON.stringify(l.expand)}, customQueryParams ${JSON.stringify(l.customQueryParams)}`,
    )
  }

  // ── A8: sort precedence ────────────────────────────────────────────────────
  {
    const src = recordingSource({ store: recordingStore() })
    const grid = monoDataGrid(src, { keyExpr: 'Id', dataSourceOptions: { sort: 'Code' } })
    await grid.load()
    await grid.setSort('Name', 'desc')
    const sorted = last(src).sort
    await grid.clearSort()
    const cleared = last(src).sort
    reporter.check(
      'A8: the column sort leads, the base sort follows as a tiebreaker; clearing falls back to the base',
      eq(sorted, [{ selector: 'Name', desc: true }, { selector: 'Code', desc: false }]) &&
        eq(cleared, [{ selector: 'Code', desc: false }]),
      `sorted ${JSON.stringify(sorted)}; cleared ${JSON.stringify(cleared)} (was null)`,
    )
  }
  // A8b — a sort the consumer set on the source is adopted the same way.
  {
    const src = recordingSource({ store: recordingStore() })
    src.sort([{ selector: 'TotalBudget', desc: true }])
    const grid = monoDataGrid(src, { keyExpr: 'Id' })
    await grid.load()
    await grid.setSort('Name', 'asc')
    const sorted = last(src).sort
    await grid.clearSort()
    reporter.check(
      'A8b: ds.sort(...) set by the consumer survives a column sort and its clearing',
      eq(sorted, [{ selector: 'Name', desc: false }, { selector: 'TotalBudget', desc: true }]) &&
        eq(last(src).sort, [{ selector: 'TotalBudget', desc: true }]),
      `sorted ${JSON.stringify(sorted)}; cleared ${JSON.stringify(last(src).sort)}`,
    )
  }

  // ── A9: pageSize precedence ────────────────────────────────────────────────
  {
    const src = recordingSource({ store: recordingStore() })
    const grid = monoDataGrid(src, { keyExpr: 'Id', dataSourceOptions: { pageSize: 25 } })
    await grid.load()
    const base = last(src).pageSize
    await grid.setPreferredPageSize(10)
    const overridden = last(src).pageSize
    await grid.setPreferredPageSize(null)
    const restored = last(src).pageSize
    await grid.setPageSize('all')
    const all = src.loads.filter((l) => l.pageSize === 100).length > 0
    reporter.check(
      'A9: dataSourceOptions.pageSize is the base; the pager override wins and clearing it restores the base',
      base === 25 && overridden === 10 && restored === 25,
      `${base} → ${overridden} → ${restored}`,
    )
    reporter.check(
      'A9: "all" still chunks by chunkSize, not the base page size',
      all,
      `chunked loads seen: ${all}`,
    )
  }

  // ── A10: server-group receives the base ────────────────────────────────────
  {
    const store = recordingStore([{ Id: 1, Dept: 'A' }])
    const src = recordingSource({ store, rows: [{ Id: 1, Dept: 'A' }] })
    src.filter(BASE)
    const grid = monoDataGrid(src, { keyExpr: 'Id', group: 'Dept', searchExpr: ['Name'], dataSourceOptions: { select: ['Id', 'Dept'] } })
    await grid.load()
    await grid.setColumnFilter('C', [1])
    await grid.setSearch('zz')
    const groupLoad = [...store.loads].reverse().find((l) => l.group)
    const rowLoad = [...store.loads].reverse().find((l) => !l.group)
    const searchCount = (l) => (JSON.stringify(l.filter).match(/"zz"/g) ?? []).length
    reporter.check(
      'A10: group AND row loads carry the base, the column filter, and the search folded exactly once',
      groupLoad && rowLoad &&
        has(groupLoad.filter, BASE) && has(groupLoad.filter, ['C', '=', 1]) && searchCount(groupLoad) === 1 &&
        has(rowLoad.filter, BASE) && has(rowLoad.filter, ['C', '=', 1]) && searchCount(rowLoad) === 1,
      `groups ${JSON.stringify(groupLoad?.filter)}\n        rows ${JSON.stringify(rowLoad?.filter)}`,
    )
    reporter.check(
      'A10b: rows fall back to dataSourceOptions.select when the grid has no select of its own',
      rowLoad && eq(rowLoad.select, ['Id', 'Dept']),
      JSON.stringify(rowLoad?.select),
    )
  }

  // ── A11: array source ──────────────────────────────────────────────────────
  {
    const rows = [
      { Id: 1, Dept: 'A', Name: 'ax', Open: true },
      { Id: 2, Dept: 'A', Name: 'ay', Open: false },
      { Id: 3, Dept: 'B', Name: 'ax', Open: true },
    ]
    const src = monoArraySource(rows, { pageSize: 10 })
    src.filter((r) => r.Dept === 'A') // the consumer's own predicate
    let warned = 0
    const origWarn = console.warn
    console.warn = (...a) => { if (String(a[0]).includes('raw OData')) warned++; else origWarn(...a) }
    try {
      const grid = monoDataGrid(src, {
        keyExpr: 'Id',
        searchExpr: ['Name'],
        odataOptions: { $filter: 'Detail/any(d: d/X eq 1)' }, // raw: unusable on an array
      })
      await grid.load()
      await grid.setSearchTerms([{ field: 'Name', value: 'ax' }]) // column-bound → controller-owned
      const ids1 = grid.items.map((r) => r.Id)
      await grid.setFilter([['Open', '=', true]])
      const ids2 = grid.items.map((r) => r.Id)
      await grid.setSearchTerms([])
      const ids3 = grid.items.map((r) => r.Id)
      reporter.check(
        'A11: array source — consumer predicate ∧ search ∧ builder filter, each a layer',
        eq(ids1, [1]) && eq(ids2, [1]) && eq(ids3, [1]),
        `search ${JSON.stringify(ids1)}; +builder ${JSON.stringify(ids2)}; -search ${JSON.stringify(ids3)} (expected [1] each: Dept A, open, "ax")`,
      )
      reporter.check(
        'A11: a raw $filter warns once and is ignored on an array source',
        warned === 1,
        `warned ${warned} time(s)`,
      )
    } finally {
      console.warn = origWarn
    }
  }

  // ── A12: the select-all drain memo survives sort and paging ────────────────
  {
    const rows = [{ Id: 1, Name: 'a' }, { Id: 2, Name: 'b' }]
    const store = recordingStore(rows)
    const src = recordingSource({ store, rows })
    src.filter(BASE)
    const grid = monoDataGrid(src, { keyExpr: 'Id' })
    await grid.load()
    await grid.check().selectAll()
    const drains = store.loads.length
    await grid.setSort('Name', 'asc')
    await grid.setPage(1)
    await grid.check().selectAll()
    reporter.check(
      'A12: a second select-all after a sort and a page change issues no store load (the filter identity held)',
      store.loads.length === drains,
      `${store.loads.length - drains} extra store load(s)`,
    )
  }

  // ── A13: summaries recompute when the base moves ───────────────────────────
  {
    const rows = [{ Id: 1, V: 2 }, { Id: 2, V: 3 }]
    const src = recordingSource({ store: recordingStore(rows), rows })
    // 'searching' opt-in: by design a filter-class change recomputes only then.
    const grid = monoDataGrid(src, {
      keyExpr: 'Id',
      summary: { fields: { V: { type: 'sum' } }, recalculate: { searching: true } },
    })
    await grid.load()
    await sleep(30) // the recompute runs off 'changed', asynchronously
    const before = grid.summary('V', 'sum')
    src.filter(LATER)
    rows.push({ Id: 3, V: 10 })
    await grid.load()
    await sleep(30)
    reporter.check(
      'A13: adopting a consumer filter counts as a filter change for a searching-recalculated summary',
      before === 5 && grid.summary('V', 'sum') === 15,
      `before ${before}, after ${grid.summary('V', 'sum')}`,
    )
  }

  // ── A17: header filter — ONE `$apply` through the store, scan only as fallback ─
  //
  // `headerFilter: true` on a remote source used to mean a `$select=<field>` scan
  // of EVERY row in scope, deduped in the browser — on a 100k-row list that is
  // the whole table for one dropdown. A real ODataStore now gets a single
  // groupby with server counts — the clause INTO the url (`urlOverride`), never
  // `customQueryParams`, which devextreme quotes as a literal and, on v4, turns
  // into `Entity($apply='…')` (a 404, found live). A CustomStore (no
  // `version()`) gets no `$apply` at all, and a backend that rejects it falls
  // back to the scan it always had — and is not asked again.
  {
    // A store that honours `$apply`: answers grouped rows when it sees the clause.
    const honouring = odataStore({
      loads: [],
      load: async (o) => {
        honouring.loads.push(o)
        if (applyOf(o)) return [{ City: 'Köln', count: 3 }, { City: 'Aachen', count: 1 }]
        return [{ Id: 1, City: 'Köln' }, { Id: 2, City: 'Köln' }, { Id: 3, City: 'Aachen' }]
      },
    })
    const src = recordingSource({ store: honouring })
    src.filter(BASE)
    const grid = monoDataGrid(src, { keyExpr: 'Id' })
    await grid.load()
    const values = await grid.distinctValues('City', { take: 50 })
    const req = honouring.loads[honouring.loads.length - 1]
    reporter.check(
      'A17: a real ODataStore gets ONE <url>?$apply=filter(<base>)/groupby request — no $select, no sibling $filter, no customQueryParams',
      honouring.loads.length === 1 &&
        applyOf(req) === "filter(Dept eq 'A')/groupby((City),aggregate($count as count))" &&
        req.urlOverride.startsWith(ODATA_URL + '?$apply=') && req.customQueryParams === undefined &&
        req.take === 50 && req.requireTotalCount === false && req.select === undefined && req.filter === undefined,
      `${honouring.loads.length} request(s): ${JSON.stringify(req)}`,
    )
    reporter.check(
      'A17: …and the panel shows the server counts, in the panel\'s order',
      eq(values, [{ value: 'Aachen', count: 1 }, { value: 'Köln', count: 3 }]),
      JSON.stringify(values),
    )
  }
  {
    // A CustomStore (no `version()`): nothing can carry an `$apply` — straight
    // to the scan, no wasted request.
    const ignoring = {
      loads: [],
      load: async (o) => {
        ignoring.loads.push(o)
        return [{ Id: 1, City: 'Köln' }, { Id: 2, City: 'Köln' }, { Id: 3, City: 'Aachen' }]
      },
    }
    const src = recordingSource({ store: ignoring })
    src.filter(BASE)
    const grid = monoDataGrid(src, { keyExpr: 'Id' })
    await grid.load()
    const values = await grid.distinctValues('City')
    const scan = ignoring.loads[ignoring.loads.length - 1]
    reporter.check(
      'A17 fallback: a CustomStore never gets an $apply — ONE $select scan',
      ignoring.loads.length === 1 && scan.urlOverride === undefined && scan.customQueryParams === undefined &&
        eq(scan.select, ['City']) && has(scan.filter, BASE) &&
        eq(values, [{ value: 'Aachen', count: 1 }, { value: 'Köln', count: 2 }]),
      `${ignoring.loads.length} request(s); scan ${JSON.stringify(scan)}; values ${JSON.stringify(values)}`,
    )
  }
  {
    // An OData store whose server ignores the clause (hands back entities):
    // detected by the response shape, scanned instead.
    const ignoring = odataStore({
      loads: [],
      load: async (o) => {
        ignoring.loads.push(o)
        return [{ Id: 1, City: 'Köln' }, { Id: 2, City: 'Köln' }, { Id: 3, City: 'Aachen' }]
      },
    })
    const src = recordingSource({ store: ignoring })
    const grid = monoDataGrid(src, { keyExpr: 'Id' })
    await grid.load()
    const values = await grid.distinctValues('City')
    reporter.check(
      'A17 fallback: a server that ignores $apply is detected by the response shape and scanned instead',
      ignoring.loads.length === 2 && eq(values, [{ value: 'Aachen', count: 1 }, { value: 'Köln', count: 2 }]),
      `${ignoring.loads.length} request(s); values ${JSON.stringify(values)}`,
    )
  }
  {
    // A backend that rejects `$apply` (Northwind): the request fails, the scan
    // runs — and the rejection is REMEMBERED: the next panel scans straight away.
    const rejecting = odataStore({
      loads: [],
      load: async (o) => {
        rejecting.loads.push(o)
        if (applyOf(o)) throw Object.assign(new Error('501 Not Implemented'), { httpStatus: 501 })
        return [{ Id: 1, City: 'Köln' }]
      },
    })
    const src = recordingSource({ store: rejecting })
    const grid = monoDataGrid(src, { keyExpr: 'Id' })
    await grid.load()
    let threw = false
    let values
    try { values = await grid.distinctValues('City') } catch { threw = true }
    reporter.check(
      'A17 fallback: a backend that rejects $apply falls back to the scan, nothing surfaces',
      !threw && rejecting.loads.length === 2 && eq(values, [{ value: 'Köln', count: 1 }]),
      threw ? 'THREW' : `${rejecting.loads.length} request(s), values ${JSON.stringify(values)}`,
    )
    await grid.distinctValues('City')
    reporter.check(
      'A17 sticky: after a 4xx/501 the next panel goes straight to the scan (no second $apply)',
      rejecting.loads.length === 3 && applyOf(rejecting.loads[2]) === null,
      `${rejecting.loads.length} request(s): ${JSON.stringify(rejecting.loads.slice(1))}`,
    )
  }
  {
    // A TRANSIENT failure (network down: no httpStatus) is not a rejection — the
    // next panel tries `$apply` again.
    let fail = true
    const flaky = odataStore({
      loads: [],
      load: async (o) => {
        flaky.loads.push(o)
        if (applyOf(o)) {
          if (fail) throw new Error('network')
          return [{ City: 'Köln', count: 1 }]
        }
        return [{ Id: 1, City: 'Köln' }]
      },
    })
    const src = recordingSource({ store: flaky })
    const grid = monoDataGrid(src, { keyExpr: 'Id' })
    await grid.load()
    await grid.distinctValues('City')
    fail = false
    const values = await grid.distinctValues('City')
    reporter.check(
      'A17 sticky: a transient failure does NOT switch $apply off — the next panel retries it',
      flaky.loads.length === 3 && applyOf(flaky.loads[2]) !== null && eq(values, [{ value: 'Köln', count: 1 }]),
      `${flaky.loads.length} request(s): ${JSON.stringify(flaky.loads.slice(1))}`,
    )
  }
  {
    // `serverApply: false`: never tried.
    const store = odataStore(recordingStore([{ Id: 1, City: 'Köln' }]))
    const src = recordingSource({ store })
    const grid = monoDataGrid(src, { keyExpr: 'Id', serverApply: false })
    await grid.load()
    await grid.distinctValues('City')
    reporter.check(
      'A17 opt-out: serverApply: false never sends an $apply',
      store.loads.length === 1 && store.loads[0].urlOverride === undefined && eq(store.loads[0].select, ['City']),
      `${store.loads.length} request(s): ${JSON.stringify(store.loads[0])}`,
    )
  }
  {
    // Opened BEFORE the first load: the options must still be resolved. Found
    // live — a panel on a never-loaded grid went out unscoped.
    const store = odataStore(recordingStore([]))
    const src = recordingSource({ store })
    const grid = monoDataGrid(src, { keyExpr: 'Id', dataSourceOptions: { filter: BASE } })
    await grid.distinctValues('City') // no load() first
    reporter.check(
      'A17: a panel opened before the first load still carries dataSourceOptions.filter',
      applyOf(store.loads[0]) === "filter(Dept eq 'A')/groupby((City),aggregate($count as count))",
      JSON.stringify(store.loads[0]),
    )
  }
  {
    // A wildcard path has no selector to group by — straight to the scan, no wasted request.
    const store = odataStore(recordingStore([{ Id: 1, Tags: [{ Name: 'a' }, { Name: 'b' }] }]))
    const src = recordingSource({ store })
    const grid = monoDataGrid(src, { keyExpr: 'Id' })
    await grid.load()
    await grid.distinctValues('Tags.[*].Name')
    reporter.check(
      'A17 control: a wildcard path never attempts $apply',
      store.loads.length === 1 && store.loads[0].urlOverride === undefined && store.loads[0].customQueryParams === undefined,
      `${store.loads.length} request(s): ${JSON.stringify(store.loads[0])}`,
    )
  }

  // ── A15: the header-filter value list is scoped by the base — and CASCADES ──
  //
  // By default the list also carries the OTHER columns' header filters and the
  // search (the rows on screen: Brand = "One" → the Product list holds that
  // brand's products), and never the column's OWN filter (the panel is how that
  // one changes; a value filtered out has to stay tickable). `headerFilterCascade:
  // false` is the old base-only list.
  {
    // Rows with a STRING column, so the default `'*'` search has something to
    // expand to on a remote source (numeric columns are skipped — `contains()`
    // on a number is invalid OData) and the search actually reaches the scan.
    const store = recordingStore([{ Id: 1, City: 'Köln' }])
    const src = recordingSource({ store, rows: [{ Id: 1, City: 'Köln' }] })
    src.filter(BASE)
    const grid = monoDataGrid(src, { keyExpr: 'Id', odataOptions: { $filter: "Year eq 2024" } })
    await grid.load()
    await grid.setColumnFilter('Other', ['x'], { multi: true }) // another column's filter scopes the list
    await grid.setColumnFilter('City', ['Bonn'], { multi: true }) // this column's own does NOT
    await grid.setSearch('zz') // and so does the search
    await grid.distinctValues('City', { take: 50 })
    const scan = last(store)
    reporter.check(
      'A15: the scan carries the base (adopted + options), the OTHER column\'s filter and the search — not the column\'s own',
      has(scan.filter, BASE) && has(scan.filter, ['Year', '=', 2024]) &&
        has(scan.filter, ['Other', '=', 'x']) && has(scan.filter, 'zz') &&
        !has(scan.filter, ['City', '=', 'Bonn']) &&
        eq(scan.select, ['City']) && scan.take === 50,
      `$filter ${JSON.stringify(scan.filter)}, select ${JSON.stringify(scan.select)}, take ${scan.take}`,
    )
    await grid.setColumnFilter('City', [], { multi: true })
    await grid.setSearch('')
  }
  {
    // Opt-out: base only, exactly as before.
    const store = recordingStore([{ Id: 1, City: 'Köln' }])
    const src = recordingSource({ store })
    src.filter(BASE)
    const grid = monoDataGrid(src, { keyExpr: 'Id', headerFilterCascade: false })
    await grid.load()
    await grid.setColumnFilter('Other', ['x'], { multi: true })
    await grid.setSearch('zz')
    await grid.distinctValues('City')
    const scan = last(store)
    reporter.check(
      'A15 opt-out: headerFilterCascade: false scopes the list by the base alone',
      has(scan.filter, BASE) && !has(scan.filter, ['Other', '=', 'x']) && !has(scan.filter, 'zz'),
      `$filter ${JSON.stringify(scan.filter)}`,
    )
  }
  {
    // Array source: the same rule as predicates, values AND counts.
    const rows = [
      { Id: 1, Brand: 'One', Product: 'p2' },
      { Id: 2, Brand: 'One', Product: 'p3' },
      { Id: 3, Brand: 'Two', Product: 'p1' },
      { Id: 4, Brand: 'Two', Product: 'p3' },
    ]
    const grid = monoDataGrid(monoArraySource(rows, { pageSize: 0 }), { keyExpr: 'Id', searchValue: ['Product'] })
    await grid.load()
    await grid.setColumnFilter('Brand', ['One'], { multi: true })
    const products = await grid.distinctValues('Product')
    const brands = await grid.distinctValues('Brand')
    reporter.check(
      'A15 array: Brand = One → the Product list is that brand\'s products with counts; the Brand list still shows every brand',
      eq(products, [{ value: 'p2', count: 1 }, { value: 'p3', count: 1 }]) &&
        eq(brands, [{ value: 'One', count: 2 }, { value: 'Two', count: 2 }]),
      `products ${JSON.stringify(products)}, brands ${JSON.stringify(brands)}`,
    )
    await grid.setSearch('p3')
    const searched = await grid.distinctValues('Product')
    reporter.check(
      'A15 array: the search narrows the list too',
      eq(searched, [{ value: 'p3', count: 1 }]),
      JSON.stringify(searched),
    )
    const plain = monoDataGrid(monoArraySource(rows, { pageSize: 0 }), { keyExpr: 'Id', headerFilterCascade: false })
    await plain.load()
    await plain.setColumnFilter('Brand', ['One'], { multi: true })
    const all = await plain.distinctValues('Product')
    reporter.check(
      'A15 array opt-out: every product listed',
      eq(all.map((v) => v.value), ['p1', 'p2', 'p3']),
      JSON.stringify(all),
    )
  }
  {
    // The consumer resolver's folded options — unchanged contract, on the old base-only shape.
    const store = recordingStore([{ Id: 1, City: 'Köln' }])
    const src = recordingSource({ store })
    src.filter(BASE)
    const grid = monoDataGrid(src, { keyExpr: 'Id', odataOptions: { $filter: "Year eq 2024" } })
    await grid.load()
    // The consumer resolver gets the same folded options.
    let seen
    const grid2 = monoDataGrid(src, {
      keyExpr: 'Id',
      distinctValues: (_field, o) => { seen = o; return [] },
    })
    await grid2.load()
    await grid2.distinctValues('City', { filter: ['City', '<>', ''] })
    reporter.check(
      'A15: a consumer distinctValues resolver receives the base AND-ed with the column\'s own filter',
      seen && has(seen.filter, BASE) && has(seen.filter, ['City', '<>', '']),
      JSON.stringify(seen?.filter),
    )
  }
  // A16 — the two `$apply` builders a consumer writes get the base in OData form.
  {
    // The consumer's scope in the shape the transfer store uses: a raw OData
    // string in a one-element array. `arrayToODataString` used to DROP it — as a
    // "group", a string member that is not `and`/`or` was skipped — so every
    // `$apply` built from `odataFilter` silently lost the scope.
    const RAW = ["DeptKode eq 'MKT' and CompanyId eq 1"]
    const store = recordingStore([{ Id: 1, V: 2 }, { Id: 2, V: 3 }])
    const src = recordingSource({ store, rows: [{ Id: 1, V: 2 }, { Id: 2, V: 3 }] })
    src.filter(RAW)
    let hf, sm
    const grid = monoDataGrid(src, {
      keyExpr: 'Id',
      odataOptions: { $filter: 'Year eq 2024' },
      distinctValues: (_f, _o, ctx) => { hf = ctx; return [] },
      summary: { fields: { V: { type: 'sum' } }, resolve: (ctx) => { sm = ctx; return null } },
    })
    await grid.load()
    await grid.setColumnFilter('Other', ['x'])
    await grid.setSearch('zz')
    await sleep(30)
    await grid.distinctValues('Job.Title')
    reporter.check(
      'A16: the header-filter resolver gets the base as `filter(<raw and options>)/groupby(…)` plus the OTHER column (cascade); no search clause — these rows have no string column for `*` to search',
      hf && hf.odataFilter.includes("(DeptKode eq 'MKT' and CompanyId eq 1)") && hf.odataFilter.includes('Year eq 2024') &&
        hf.odataFilter.includes("Other eq 'x'") && !hf.odataFilter.includes('zz') &&
        hf.apply === 'groupby((Job/Title),aggregate($count as count))' &&
        hf.applyWithFilter === `filter(${hf.odataFilter})/${hf.apply}`,
      hf ? `odataFilter ${hf.odataFilter}\n        applyWithFilter ${hf.applyWithFilter}` : 'resolver never called',
    )
    reporter.check(
      'A16: the summary resolver gets the base too, in `odataFilter` and `applyWithFilter`',
      sm && sm.odataFilter.includes("(DeptKode eq 'MKT' and CompanyId eq 1)") && sm.odataFilter.includes('Year eq 2024') &&
        sm.applyWithFilter.startsWith('filter(') && sm.applyWithFilter.includes('aggregate('),
      sm ? `odataFilter ${sm.odataFilter}\n        applyWithFilter ${sm.applyWithFilter}` : 'resolver never called',
    )
  }
  // A15 control — no base: the request is the bare groupby it always was.
  {
    const store = odataStore(recordingStore([]))
    const src = recordingSource({ store })
    const grid = monoDataGrid(src, { keyExpr: 'Id' })
    await grid.load()
    await grid.distinctValues('City')
    const scan = store.loads[store.loads.length - 1]
    reporter.check(
      'A15 control: with no base the request is the bare groupby — no filter() folded in',
      eq(scan, { urlOverride: `${ODATA_URL}?$apply=${encodeURIComponent('groupby((City),aggregate($count as count))')}`, requireTotalCount: false }),
      JSON.stringify(scan),
    )
  }

  // ── A18: summary footer — ONE `$apply=…/aggregate(…)` through the store ─────
  //
  // No resolver used to mean the drain: every row re-fetched through the pager
  // to add up a footer. An ODataStore now gets ONE aggregate request, the base
  // folded inside the clause; a server that hands back entities (no alias) or
  // rejects the clause falls back to the drain, and a rejection is remembered.
  {
    const rows = [{ Id: 1, V: 2 }, { Id: 2, V: 3 }]
    const aggregating = odataStore({
      loads: [],
      load: async (o) => {
        aggregating.loads.push(o)
        if (applyOf(o)) return [{ V: 42 }]
        return rows.slice(o?.skip ?? 0, (o?.skip ?? 0) + (o?.take ?? rows.length))
      },
    })
    const src = recordingSource({ store: aggregating, rows })
    src.filter(BASE)
    const grid = monoDataGrid(src, { keyExpr: 'Id', summary: { fields: { V: { type: 'sum' } } } })
    await grid.load()
    await sleep(30)
    const req = aggregating.loads.find((o) => applyOf(o))
    reporter.check(
      'A18: the footer is ONE <url>?$apply=filter(<base>)/aggregate(V with sum as V) — no drain',
      grid.summary('V', 'sum') === 42 && aggregating.loads.length === 1 &&
        applyOf(req) === "filter(Dept eq 'A')/aggregate(V with sum as V)" && req.requireTotalCount === false,
      `sum ${grid.summary('V', 'sum')}, ${aggregating.loads.length} store request(s): ${JSON.stringify(aggregating.loads)}`,
    )
  }
  {
    // The consumer resolver still wins: the store is never asked.
    const rows = [{ Id: 1, V: 2 }]
    const store = odataStore(recordingStore(rows))
    const src = recordingSource({ store, rows })
    const grid = monoDataGrid(src, { keyExpr: 'Id', summary: { fields: { V: { type: 'sum' } }, resolve: () => [7] } })
    await grid.load()
    await sleep(30)
    reporter.check(
      'A18: a consumer resolver is asked first and the store path never runs',
      grid.summary('V', 'sum') === 7 && store.loads.every((o) => !applyOf(o)),
      `sum ${grid.summary('V', 'sum')}, store requests ${JSON.stringify(store.loads)}`,
    )
  }
  {
    // A server that ignores the clause (entities come back, no alias): drain.
    const rows = [{ Id: 1, V: 2 }, { Id: 2, V: 3 }]
    const store = odataStore(recordingStore(rows))
    const src = recordingSource({ store, rows })
    const grid = monoDataGrid(src, { keyExpr: 'Id', summary: { fields: { V: { type: 'sum' } } } })
    await grid.load()
    await sleep(30)
    reporter.check(
      'A18 fallback: a server that ignores $apply is detected by the response shape and the footer is drained',
      grid.summary('V', 'sum') === 5 && store.loads.length >= 2 && applyOf(store.loads[0]) !== null,
      `sum ${grid.summary('V', 'sum')}, ${store.loads.length} store request(s)`,
    )
    // ONE entity back is the hard case: the alias `V` is present and the row
    // count is right — only the extra `Id` says it is not an aggregate.
    const one = [{ Id: 1, V: 2 }]
    const store1 = odataStore(recordingStore(one))
    const grid1 = monoDataGrid(recordingSource({ store: store1, rows: one }), { keyExpr: 'Id', summary: { fields: { V: { type: 'count' } } } })
    await grid1.load()
    await sleep(30)
    reporter.check(
      'A18 fallback: a single entity is not mistaken for the aggregate row (the extra key is the tell)',
      grid1.summary('V', 'count') === 1 && store1.loads.length >= 2,
      `count ${grid1.summary('V', 'count')}, ${store1.loads.length} store request(s)`,
    )
  }
  {
    // A backend that rejects it: drain now, and no second `$apply` on the next recompute.
    const rows = [{ Id: 1, V: 2 }]
    const rejecting = odataStore({
      loads: [],
      load: async (o) => {
        rejecting.loads.push(o)
        if (applyOf(o)) throw Object.assign(new Error('400 Bad Request'), { httpStatus: 400 })
        return rows
      },
    })
    const src = recordingSource({ store: rejecting, rows })
    const grid = monoDataGrid(src, { keyExpr: 'Id', summary: { fields: { V: { type: 'sum' } } } })
    await grid.load()
    await sleep(30)
    const first = grid.summary('V', 'sum')
    const applies = () => rejecting.loads.filter((o) => applyOf(o)).length
    const afterFirst = applies()
    await grid.setFilter(['Dept', '=', 'B'])
    await sleep(30)
    reporter.check(
      'A18 sticky: a 4xx falls back to the drain and is not retried on the next recompute — the header filter shares the switch',
      first === 2 && afterFirst === 1 && applies() === 1 && grid.summary('V', 'sum') === 2,
      `sum ${first} → ${grid.summary('V', 'sum')}, $apply requests ${afterFirst} → ${applies()}`,
    )
    await grid.distinctValues('V')
    reporter.check(
      'A18 sticky: …so the header filter goes straight to the scan too',
      applies() === 1,
      `$apply requests ${applies()}`,
    )
  }

  // ── A19: the combine GESTURE is remembered while anything stays sorted/filtered ─
  //
  // `{ multi: true, sticky: true }` is what the right-click menu passes. From then
  // on the arrows / funnels ask `sortCombining()` / `columnFilterCombining()` and
  // pass `multi` themselves, so a user who started a multi-key sort keeps building
  // it with plain clicks. A replace, or the last key going, forgets it. A seeded
  // `{ multi: true }` without `sticky` (a declared default sort) is not a gesture.
  {
    const src = recordingSource({ store: recordingStore() })
    const grid = monoDataGrid(src, { keyExpr: 'Id' })
    await grid.load()
    await grid.setSort('A', 'asc', { multi: true })
    const seeded = grid.sortCombining()
    await grid.setSort('A', 'asc', { multi: true, sticky: true })
    const started = grid.sortCombining()
    await grid.setSort('B', 'asc', { multi: grid.sortCombining() })
    const twoKeys = grid.sorts.map((s) => s.field).join(',')
    await grid.setSort('A', null, { multi: true })
    const stillOn = grid.sortCombining()
    await grid.setSort('B', null, { multi: true })
    const emptied = grid.sortCombining()
    await grid.setSort('A', 'asc', { multi: true, sticky: true })
    await grid.setSort('C', 'asc')
    const replaced = grid.sortCombining()
    reporter.check(
      'A19 sort: sticky starts the memory, a plain multi write keeps it, the last key going or a replace ends it; a seeded multi does not start it',
      !seeded && started && twoKeys === 'A,B' && stillOn && !emptied && !replaced && grid.sorts.length === 1,
      `seeded ${seeded}, started ${started}, keys ${twoKeys}, after one clear ${stillOn}, emptied ${emptied}, after replace ${replaced}`,
    )
    await grid.setSort(null)
    reporter.check('A19 sort: setSort(null) forgets it', !grid.sortCombining(), `${grid.sortCombining()}`)

    await grid.setColumnFilter('A', ['x'], { multi: true })
    const fSeeded = grid.columnFilterCombining()
    await grid.setColumnFilter('A', ['x'], { multi: true, sticky: true })
    const fStarted = grid.columnFilterCombining()
    await grid.setColumnFilter('B', ['y'], { multi: grid.columnFilterCombining() })
    const fTwo = grid.filteredColumns().join(',')
    await grid.setColumnFilter('A', [], { multi: true })
    const fStillOn = grid.columnFilterCombining()
    await grid.setColumnFilter('B', [], { multi: true })
    const fEmptied = grid.columnFilterCombining()
    await grid.setColumnFilter('A', ['x'], { multi: true, sticky: true })
    await grid.setColumnFilter('C', ['z'])
    const fReplaced = grid.columnFilterCombining()
    reporter.check(
      'A19 filter: the same memory for header filters',
      !fSeeded && fStarted && fTwo === 'A,B' && fStillOn && !fEmptied && !fReplaced && grid.filteredColumns().length === 1,
      `seeded ${fSeeded}, started ${fStarted}, cols ${fTwo}, after one clear ${fStillOn}, emptied ${fEmptied}, after replace ${fReplaced}`,
    )
  }

  // ── A20: a date-filter RANGE is a column-filter value like any other ───────
  //
  // The date filter stores `{ from, to }` periods on the column. Remote: each
  // becomes `[[f,'>=',from],'and',[f,'<',to]]` — half-open, OR-ed across ranges,
  // AND-ed with the other columns like every filter. Array: the cell as a Date
  // inside `[from, to)`. Cascade and sticky combine never look inside a value.
  {
    const from = new Date(2026, 2, 1), to = new Date(2026, 3, 1)
    const src = recordingSource({ store: recordingStore() })
    const grid = monoDataGrid(src, { keyExpr: 'Id' })
    await grid.load()
    await grid.setColumnFilter('When', [{ from, to }], { multi: true })
    await grid.setColumnFilter('Brand', ['One'], { multi: true })
    const f = last(src).filter
    reporter.check(
      'A20 remote: a range writes a half-open [>=, <) pair, AND-ed with the other column',
      has(f, ['When', '>=', from]) && has(f, ['When', '<', to]) && has(f, ['Brand', '=', 'One']) &&
        JSON.stringify(f).indexOf('"and"') > 0 && grid.filteredColumns().join(',') === 'When,Brand',
      JSON.stringify(f),
    )
    await grid.setColumnFilter('When', [{ from, to }, { from: new Date(2026, 6, 1), to: new Date(2026, 7, 1) }], { multi: true })
    const two = last(src).filter
    reporter.check('A20 remote: two ranges OR', JSON.stringify(two).includes('"or"'), JSON.stringify(two))

    const rows = [
      { Id: 1, When: '2026-03-05T13:05:09' },
      { Id: 2, When: '2026-03-31T23:59:59' },
      { Id: 3, When: '2026-04-01T00:00:00' },
      { Id: 4, When: null },
    ]
    const arr = monoDataGrid(rows, { keyExpr: 'Id' })
    await arr.load()
    await arr.setColumnFilter('When', [{ from, to }])
    const inMarch = arr.items.map((r) => r.Id)
    await arr.setColumnFilter('When', [{ from, to }, null])
    const withBlank = arr.items.map((r) => r.Id)
    reporter.check(
      'A20 array: [from, to) keeps 23:59:59 of the last day and drops the next 00:00:00; a null value adds the blanks',
      eq(inMarch, [1, 2]) && eq(withBlank, [1, 2, 4]),
      `march ${JSON.stringify(inMarch)}, with blank ${JSON.stringify(withBlank)}`,
    )
  }

  // ── A14: a bare fake without filter/sort/select still works ────────────────
  {
    let threw = null
    try {
      const bare = {
        load: async () => [],
        items: () => [],
        isLoading: () => false,
        on() {},
        off() {},
        paginate: () => true,
        pageSize: () => 20,
        pageIndex: () => 0,
        isLastPage: () => true,
      }
      const grid = monoDataGrid(bare, { keyExpr: 'Id', dataSourceOptions: { select: ['Id'], expand: 'X' } })
      await grid.load()
      await grid.setSearch('x')
      await grid.setPage(1)
    } catch (e) { threw = e }
    reporter.check(
      'A14: a source with no filter/sort/select/loadOptions accessors is left alone, not crashed',
      threw === null,
      threw ? String(threw && threw.message) : 'ok',
    )
  }
}
