// Regression: scrolled pages were appended to the accumulator by loads that had already been
// SUPERSEDED, so rows appeared twice in the list.
//
// The shape, straight from `input-transfer-budget.vue`'s picker panels: the user scrolls (a
// `loadNext()` for page 1 goes out), then changes a filter, which runs
// `datasource.filter(...)` → `table.load()`. In a scroll mode `load()` is `loadScrollPage(true)` —
// a RESET — so it wipes the accumulator and fetches page 0.
//
// devextreme cancels the older load, but `runLoad` deliberately swallows cancellation
// ("devextreme rejects a load that a newer load superseded — ignore those"). The loser therefore
// resolved NORMALLY and ran on to `accumulated.push(...[...s.items()])` — and by then `items()`
// held the WINNER's page 0. Page 0 landed twice, `scrollNextPage` over-advanced past page 1, and
// the inflated `accumulated.length` kept `hasMore` truthy.
//
// This is pure controller state — `monoDataGrid` needs no DOM — so unlike its neighbours here this
// spec drives the node entry directly and asserts counts, never timings.
//
// BOTH scroll modes are covered on purpose: `scrollActive()` is `scrollMode !== 'off'`, and
// infinity and virtual share one accumulator, one `loadScrollPage()` and one `syncScroll()`.
// Virtual only HID the bug behind `accumulated.slice(start, end)`.

import { monoDataGrid } from '@mono-lit/helper'

const PAGE_SIZE = 20
const TOTAL = 100

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

/**
 * A minimal devextreme-DataSource stand-in.
 *
 * The one behaviour that matters is cancellation: a load superseded by a newer one REJECTS with
 * `'canceled'` and never commits its rows, exactly as devextreme does. `items()` therefore always
 * reflects the newest COMPLETED load — which is what made the loser's push duplicate rows.
 */
function fakeSource({ pageSize = PAGE_SIZE, total = TOTAL } = {}) {
  let page = 0
  let paginate = true
  let items = []
  let token = 0
  let loads = 0
  const delays = []

  const rowsFor = (p) => {
    const start = p * pageSize
    const out = []
    for (let i = start; i < Math.min(start + pageSize, total); i++) out.push({ Id: i + 1, Name: `row ${i + 1}` })
    return out
  }

  return {
    /** Queue the delay (ms) each subsequent `load()` waits before settling. */
    queueDelays: (...ms) => { delays.push(...ms) },
    get loadCount() { return loads },
    rowsFor,

    load() {
      const mine = ++token
      const p = page
      const wait = delays.length ? delays.shift() : 0
      loads++
      return sleep(wait).then(() => {
        if (mine !== token) {
          // Superseded. devextreme rejects, and never updates `items()`.
          const err = new Error('canceled')
          err.name = 'canceled'
          throw err
        }
        items = rowsFor(p)
        return items
      })
    },
    items: () => items,
    isLoading: () => false,
    on() {},
    off() {},
    paginate: (v) => (v === undefined ? paginate : (paginate = v)),
    pageSize: () => pageSize,
    pageIndex: (v) => (v === undefined ? page : (page = v)),
    isLastPage: () => (page + 1) * pageSize >= total,
    // Deliberately no `totalCount()`: the picker runs without `requireTotalCount`, which is the
    // configuration in which `accumulated.length` becomes the fallback total.
  }
}

const keysOf = (rows) => rows.map((r) => r.Id)
const dupesIn = (rows) => {
  const seen = new Set()
  const dupes = []
  for (const k of keysOf(rows)) {
    if (seen.has(k)) dupes.push(k)
    seen.add(k)
  }
  return dupes
}

/**
 * Every row currently in the accumulator.
 *
 * In VIRTUAL mode `items` is deliberately a WINDOW — `accumulated.slice(vStart, vEnd)` — and that
 * window is opened by the scrolling element, which does not exist here. Opening it by hand is
 * exactly what the element does; without this the virtual arms would read an empty list and prove
 * nothing. Infinity mode ignores the call (it is guarded on `scrollMode === 'virtual'`).
 */
function reveal(grid) {
  grid.setVirtualWindow(0, Math.max(grid.loadedCount, 1), 0, 0)
  return [...grid.items]
}

/**
 * The race, run for one scroll mode.
 *
 * `loadNext()` (page 1, slow) is started and deliberately NOT awaited; `load()` (reset → page 0,
 * fast) is fired underneath it, which is exactly the interleaving `applyPickerFilter` produces.
 */
async function raceOnce(mode) {
  const src = fakeSource()
  const grid = monoDataGrid(src, { keyExpr: 'Id' })

  await grid.setScrollPaging(mode)
  await grid.load()

  const afterFirst = reveal(grid)

  // Page 1 goes out slowly; the reset overtakes it.
  src.queueDelays(60, 5)
  const slow = grid.loadNext()
  await sleep(1) // let loadNext() reach its await, so the reset genuinely lands mid-flight
  const reset = grid.load()

  await Promise.all([slow, reset])
  await sleep(120) // outlast the superseded load, so a late push would still be caught

  return {
    afterFirst,
    rows: reveal(grid),
    loadedCount: grid.loadedCount,
    hasMore: grid.hasMore,
  }
}

export async function run({ reporter }) {
  for (const mode of ['infinity', 'virtual']) {
    const r = await raceOnce(mode)

    reporter.check(
      `${mode}: the first page loads exactly one page of rows`,
      r.afterFirst.length === PAGE_SIZE,
      `got ${r.afterFirst.length}, expected ${PAGE_SIZE}`,
    )

    const dupes = dupesIn(r.rows)
    reporter.check(
      `${mode}: a reset that overtakes loadNext() leaves no duplicated rows`,
      dupes.length === 0,
      `duplicated keys: ${JSON.stringify(dupes.slice(0, 8))} (the superseded page-1 load pushed the winner's page 0 a second time)`,
    )

    reporter.check(
      `${mode}: the accumulator holds only the reset's page`,
      r.loadedCount === PAGE_SIZE,
      `loadedCount=${r.loadedCount}, expected ${PAGE_SIZE}`,
    )

    reporter.check(
      `${mode}: the rows are page 0, not a page-0/page-0 concatenation`,
      JSON.stringify(keysOf(r.rows.slice(0, PAGE_SIZE))) === JSON.stringify(keysOf(fakeSource().rowsFor(0))),
      `keys=${JSON.stringify(keysOf(r.rows).slice(0, 25))}`,
    )

    reporter.check(
      `${mode}: more rows remain after the reset`,
      r.hasMore === true,
      `hasMore=${r.hasMore} — page 0 of ${TOTAL / PAGE_SIZE} is not the last page`,
    )
  }

  // The control: with no race, paging still accumulates normally. A "fix" that simply stopped
  // appending would fail here.
  const src = fakeSource()
  const grid = monoDataGrid(src, { keyExpr: 'Id' })
  await grid.setScrollPaging('infinity')
  await grid.load()
  await grid.loadNext()
  await grid.loadNext()

  reporter.check(
    'control: three sequential pages accumulate to three pages of rows',
    grid.loadedCount === PAGE_SIZE * 3,
    `loadedCount=${grid.loadedCount}, expected ${PAGE_SIZE * 3}`,
  )
  reporter.check(
    'control: sequential paging produces no duplicates either',
    dupesIn([...grid.items]).length === 0,
    `duplicated keys: ${JSON.stringify(dupesIn([...grid.items]).slice(0, 8))}`,
  )
}
