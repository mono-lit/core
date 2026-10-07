// `dd.selectAll()` must cost the DRAIN and nothing else.
//
// Setting N keys makes `resolveSelected()` fetch display text for every key it has
// not cached — an `in` filter chunked at 50, i.e. 17 requests for 830 rows, and on a
// backend that rejects `in` it falls back to OR-chains at 15 (56 more). `selectAll`
// primes the cache from the rows it just drained, so that whole second phase must
// not happen at all.
//
// The store stub records every `load()`, and the arms below tell the two kinds
// apart: a DRAIN load carries `skip`/`take`, a RESOLUTION load carries `filter`.

import '@mono-lit/helper/ui/dropdown-table'
import '@mono-lit/helper/ui/table'
import '@mono-lit/helper/ui/checkbox'
import { controlMonoDataDropdown } from '@mono-lit/helper'

// The visible half of the feature: `loading` must put a spinner INSIDE the box and
// stop it being clickable, the way mono-table-checkbox does for its select-all.
// A flag nothing renders is not a loading state.
document.querySelector('#app').innerHTML = `
  <div id="cb-idle"><mono-checkbox size="sm" aria-label="idle"></mono-checkbox></div>
  <div id="cb-loading"><mono-checkbox size="sm" loading aria-label="busy"></mono-checkbox></div>
`

/**
 * The point of routing multi-select through the grid: `<mono-table-checkbox>` bound
 * to `dd.table` must move `dd.value`. Before, it drove a second store and the
 * dropdown never noticed — it ticked, and the chips stayed put.
 */
window.__checkStoreIsShared = async () => {
  const { dd } = build()
  await dd.table.load()
  const before = (dd.value ?? []).length

  // What the ELEMENT does when you click a row checkbox.
  dd.table.check().toggle(ROWS[0], true)
  const afterToggle = [...(dd.value ?? [])]

  // …and what `type="all"` does.
  await dd.table.check().selectAll()
  const afterAll = (dd.value ?? []).length

  dd.table.check().clear()
  const afterClear = (dd.value ?? []).length

  return {
    before,
    afterToggle,
    valueSeesToggle: afterToggle.length === 1 && afterToggle[0] === ROWS[0].OrderID,
    afterAll,
    afterClear,
    total: ROWS.length,
  }
}

/** …and the reverse: the dropdown's own API must move the grid's selection. */
window.__ddWritesThrough = async () => {
  const { dd } = build()
  await dd.table.load()
  dd.toggleRow(ROWS[1].OrderID, ROWS[1])
  const checkSees = dd.table.check().count()
  dd.clear()
  return { checkSees, afterClear: dd.table.check().count() }
}

window.__checkboxLoading = () => {
  const read = (sel) => {
    const host = document.querySelector(sel)
    const box = host?.querySelector('.mono-checkbox-box')
    const input = host?.querySelector('.mono-checkbox-input')
    const spinner = host?.querySelector('.mono-checkbox-spinner')
    const r = spinner?.getBoundingClientRect()
    return {
      hasSpinner: !!spinner,
      spinnerPainted: !!r && r.width > 0 && r.height > 0,
      // The box must opt out of its own tick/dash so the spinner is the only glyph.
      suppressesOwnGlyphs: !!box?.classList.contains('has-custom-icon'),
      disabled: !!input?.disabled,
      ariaBusy: input?.getAttribute('aria-busy') ?? '',
    }
  }
  return { idle: read('#cb-idle'), loading: read('#cb-loading') }
}

const ROWS = Array.from({ length: 250 }, (_, i) => ({
  OrderID: 10248 + i,
  ShipName: `Ship ${i + 1}`,
}))

/** A DataSource-like stub whose store records what it was asked for. */
function makeSource() {
  const calls = []
  const store = {
    load: (opts) => {
      calls.push(opts ?? {})
      if (opts?.filter) {
        // Resolution path — return whatever the filter asked for. Shape does not
        // matter here; that this ran AT ALL is what the test is about.
        return Promise.resolve({ data: ROWS.slice(0, 50) })
      }
      const skip = opts?.skip ?? 0
      const take = opts?.take ?? ROWS.length
      return Promise.resolve({ data: ROWS.slice(skip, skip + take), totalCount: ROWS.length })
    },
  }
  return {
    calls,
    source: {
      store: () => store,
      load: () => Promise.resolve(ROWS),
      items: () => ROWS,
      totalCount: () => ROWS.length,
      pageIndex: () => 0,
      pageSize: () => 25,
      paginate: () => true,
      filter: () => null,
      sort: () => null,
      on: () => {},
      off: () => {},
      isLoaded: () => true,
      isLoading: () => false,
    },
  }
}

function build(opts) {
  const { calls, source } = makeSource()
  const dd = controlMonoDataDropdown(null, {
    keyExpr: 'OrderID',
    displayExpr: 'ShipName',
    multiple: true,
    pageSize: 25,
    ...opts,
  })
  dd.bind(source)
  return { dd, calls }
}

const viaSelectAll = build()
const viaSetValue = build()
const capped = build({ max: 10 })
const single = build({ multiple: false })

window.__ready = false
Promise.all([
  viaSelectAll.dd.table.load(),
  viaSetValue.dd.table.load(),
  capped.dd.table.load(),
  single.dd.table.load(),
]).then(() => {
  window.__ready = true
})

const split = (calls) => ({
  drain: calls.filter((c) => !c.filter && (c.take != null || c.skip != null)).length,
  resolution: calls.filter((c) => !!c.filter).length,
})

/**
 * `selectAllPending` must be observable BY A SUBSCRIBER while the drain runs — not
 * merely true if you poll the getter. The table's `check().pending` drives a
 * "draining…" chip the same way, and that only works because the flag notifies on
 * the leading edge, before the first request blocks.
 */
window.__runPendingLifecycle = async () => {
  const { dd } = build()
  await dd.table.load()
  const seen = []
  const off = dd.subscribe(() => seen.push(dd.selectAllPending))
  const before = dd.selectAllPending
  const p = dd.selectAll()
  // Re-entrant call while one is in flight must be ignored, not queued.
  const reentrant = dd.selectAll()
  await Promise.all([p, reentrant])
  off()
  return {
    before,
    sawPendingTrue: seen.includes(true), // a subscriber observed the busy state
    after: dd.selectAllPending,
    selected: (dd.value ?? []).length,
  }
}

/** selectAll: drains, then must never ask for display text. */
window.__runSelectAll = async () => {
  viaSelectAll.calls.length = 0
  await viaSelectAll.dd.selectAll()
  await new Promise((r) => setTimeout(r, 250)) // let any stray resolveSelected land
  return {
    ...split(viaSelectAll.calls),
    selected: (viaSelectAll.dd.value ?? []).length,
    total: ROWS.length,
    // Display text must be available WITHOUT having fetched it.
    firstText: viaSelectAll.dd.selectedItems()[0]?.text ?? '',
  }
}

/**
 * The path `<mono-table-checkbox type="all">` actually takes.
 *
 * The element calls the GRID's `check.selectAll()` directly — it never goes
 * through `dd.selectAll()`, which is where the display cache gets primed. The
 * chips must still read `displayExpr`, and still without a resolution fetch: the
 * drained rows are sitting in the grid's own check store.
 *
 * `mode` picks the drain (`'all'`) or the loaded page (`'per-page'`); a per-row
 * tick is the third way in. All three must label the same.
 */
window.__viaCheckbox = async (how) => {
  const { dd, calls } = build()
  await dd.table.load()
  calls.length = 0

  if (how === 'per-page') dd.table.check().selectPage()
  else if (how === 'row') dd.table.check().toggle(ROWS[0], true)
  else await dd.table.check().selectAll()

  await new Promise((r) => setTimeout(r, 250)) // let any stray resolveSelected land

  const items = dd.selectedItems()
  const keyed = items.filter((i) => i.text === String(i.key))
  return {
    ...split(calls),
    selected: items.length,
    firstText: items[0]?.text ?? '',
    // The symptom, counted: a chip whose text IS its key never resolved.
    keyShapedCount: keyed.length,
    sampleKeyShaped: keyed[0]?.text ?? '',
  }
}

/** The contrast: the same keys with no rows handed over DOES resolve. */
window.__runSetValueBare = async () => {
  viaSetValue.calls.length = 0
  viaSetValue.dd.setValue(ROWS.map((r) => r.OrderID))
  await new Promise((r) => setTimeout(r, 250))
  return { ...split(viaSetValue.calls), selected: (viaSetValue.dd.value ?? []).length }
}

/** `setValue` with rows is the manual form of the same trick. */
window.__runSetValueWithRows = async () => {
  const { dd, calls } = build()
  await dd.table.load()
  calls.length = 0
  dd.setValue(ROWS.map((r) => r.OrderID), ROWS)
  await new Promise((r) => setTimeout(r, 250))
  return { ...split(calls), selected: (dd.value ?? []).length }
}

window.__runCapped = async () => {
  await capped.dd.selectAll()
  return { selected: (capped.dd.value ?? []).length }
}

window.__runSingle = async () => {
  await single.dd.selectAll()
  const v = single.dd.value
  return { selected: Array.isArray(v) ? v.length : v == null ? 0 : 1 }
}
