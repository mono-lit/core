// Regression: entering/leaving a scroll-paging mode issued HTTP requests nobody consumed.
//
// `<mono-table-paging>` drives the mode from its lifecycle: connectedCallback →
// setScrollPaging(type), disconnectedCallback → setScrollPaging('off'). Both reached a load.
//
// That is expensive in exactly the place it is least expected. A `mono-dropdown-table` panel is
// portaled into <body> the FIRST time it opens (popup-portal: "Move the panel into the body portal
// on first open; keep it there after"), and moving a subtree disconnects and reconnects everything
// in it — so opening a picker cost one request on the way out and another on the way back in, for
// rows the grid was already holding.
//
// The fix: `setScrollPaging(mode, { reload: false })` for bookkeeping mode changes, and re-entering
// a scroll mode adopts a non-empty accumulator instead of re-seeding page 0.
//
// Controller-only — `monoDataGrid` needs no DOM — so this counts `source.load()` calls, which map
// 1:1 to requests on the wire.

import { monoDataGrid } from '@mono-lit/helper'

const PAGE = 25
const TOTAL = 300

function countingSource() {
  let page = 0
  let size = PAGE
  let paginate = false
  let items = []
  const calls = []
  return {
    calls,
    load() {
      calls.push({ page, size })
      const start = page * size
      items = []
      for (let i = start; i < Math.min(start + size, TOTAL); i++) items.push({ Id: i + 1 })
      return Promise.resolve(items)
    },
    items: () => items,
    isLoading: () => false,
    on() {}, off() {},
    paginate: (v) => (v === undefined ? paginate : (paginate = v)),
    pageSize: (v) => (v === undefined ? size : (size = v)),
    pageIndex: (v) => (v === undefined ? page : (page = v)),
    isLastPage: () => (page + 1) * size >= TOTAL,
  }
}

export async function run({ reporter }) {
  const src = countingSource()
  const grid = monoDataGrid(src, { keyExpr: 'Id' })

  // 1. The pager connects. Nothing is loaded yet, so this SHOULD fetch page 0.
  const before1 = src.calls.length
  await grid.setScrollPaging('infinity')
  const onConnect = src.calls.length - before1
  reporter.check(
    'entering a scroll mode with an empty buffer still seeds page 0',
    onConnect === 1 && grid.loadedCount === PAGE,
    `requests=${onConnect} loadedCount=${grid.loadedCount} — the initial seed must NOT be optimised away`,
  )

  // 2. The user scrolls a page, so the buffer holds two pages.
  await grid.loadNext()
  const buffered = grid.loadedCount
  reporter.check(
    'a scrolled page accumulates',
    buffered === PAGE * 2,
    `loadedCount=${buffered}, expected ${PAGE * 2}`,
  )

  // 3. The panel is portaled: disconnect then reconnect, back to back.
  const before3 = src.calls.length
  await grid.setScrollPaging('off', { reload: false })
  const onDisconnect = src.calls.length - before3
  reporter.check(
    'a pager leaving does NOT fetch',
    onDisconnect === 0,
    `requests=${onDisconnect} — a load issued on the way out is read by nobody`,
  )

  const before4 = src.calls.length
  await grid.setScrollPaging('infinity')
  const onReconnect = src.calls.length - before4
  reporter.check(
    'a pager returning re-adopts the buffer instead of re-fetching',
    onReconnect === 0,
    `requests=${onReconnect} — the rows were still in the accumulator`,
  )

  reporter.check(
    'the portal move preserves every accumulated row',
    grid.loadedCount === buffered && grid.items.length === buffered,
    `loadedCount=${grid.loadedCount} items=${grid.items.length}, expected ${buffered} — a silent reset here would blank the panel`,
  )

  reporter.check(
    'one open/close cycle costs nothing',
    onDisconnect + onReconnect === 0,
    `${onDisconnect + onReconnect} request(s) per portal move (was 2)`,
  )

  // 4. A real scope change must still reload — the guard above must not have frozen the grid.
  const before5 = src.calls.length
  await grid.load()
  const onFilter = src.calls.length - before5
  reporter.check(
    'a filter change still resets and refetches',
    onFilter === 1 && grid.loadedCount === PAGE,
    `requests=${onFilter} loadedCount=${grid.loadedCount} — load() must still reset the accumulator`,
  )

  // 5. And a genuine switch back to classic paging (not a teardown) still reloads.
  const before6 = src.calls.length
  await grid.setScrollPaging('off')
  const onOff = src.calls.length - before6
  reporter.check(
    'an explicit switch to classic paging still reloads',
    onOff === 1,
    `requests=${onOff} — omitting reload:false must keep the old behaviour`,
  )
}
