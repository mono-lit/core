// Row selection must survive a `keyExpr` that does not match the rows.
//
// Two failures came from one missing option (the grid's `keyExpr` defaults to 'Id'):
//
//  (a) the select-all DRAIN appended `keyExpr` to its `$select`, so a grid whose
//      rows have no `Id` put a non-existent column on the wire and OData 400'd the
//      whole drain.
//  (b) `rowKey()` did `ctrl.items.indexOf(row)`, but Vue hands components a reactive
//      PROXY while `items` holds the raw object — so `indexOf` was -1, and with the
//      key field missing too EVERY row keyed to the string "-1". Tick one row and
//      the whole grid read as ticked.
//
// Rows here deliberately have NO `Id` (key is `OrderID`), mirroring Northwind.
// The proxy is built with a bare `new Proxy(row, {})` plus Vue's `__v_raw` flag,
// which is exactly what `unwrapReactive` duck-types — no Vue needed.

import '@mono-lit/helper/ui/table'
import { controlMonoTable } from '@mono-lit/helper'

const ROWS = Array.from({ length: 12 }, (_, i) => ({
  OrderID: 10248 + i,
  ShipName: `Ship ${i + 1}`,
}))

/** What Vue's `reactive()` hands a component: a proxy that reports its raw target. */
const asVueProxy = (row) =>
  new Proxy(row, {
    get: (t, p, r) => (p === '__v_raw' ? t : Reflect.get(t, p, r)),
  })

/** A DataSource stub with a `store()`, so the grid takes the REMOTE drain path. */
function makeSource() {
  const calls = []
  const store = {
    load: (opts) => {
      calls.push(opts)
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
      pageSize: () => ROWS.length,
      paginate: () => false,
      filter: () => null,
      sort: () => null,
      on: () => {},
      off: () => {},
      isLoaded: () => true,
      isLoading: () => false,
    },
  }
}

/** Build a grid; `keyExpr` omitted reproduces the bug's configuration. */
function build(keyExpr) {
  const { calls, source } = makeSource()
  const table = controlMonoTable(null, {
    ...(keyExpr ? { keyExpr } : {}),
  })
  // `props.checkbox` is applied BY a <mono-table-checkbox> element; there is none
  // here, so configure the handle directly — otherwise `keyValue` stays unset,
  // `checkSelect()` returns null and the drain assertions pass vacuously.
  table.check().configure({ keyValue: 'OrderID', chunk: 5 })
  table.bind(source)
  return { table, calls }
}

const broken = build(null) // no keyExpr → defaults to 'Id', which ROWS lack
const fixed = build('OrderID') // the control arm

window.__ready = false
Promise.all([broken.table.load(), fixed.table.load()]).then(() => {
  window.__ready = true
})

/**
 * Symptom (b): tick ONE row (handed over as a Vue-style proxy, as a template does)
 * and count how many rows the grid then reports as checked.
 */
window.__checkedAfterTickingOne = (which) => {
  const { table } = which === 'fixed' ? fixed : broken
  const check = table.check()
  check.clear()
  const rows = table.items.map(asVueProxy)
  check.toggle(rows[0], true)
  return {
    reportedChecked: check.count(),
    // How many of the OTHER rows now claim to be checked — must be 0.
    othersChecked: rows.slice(1).filter((r) => check.isChecked(r)).length,
    total: rows.length,
  }
}

/** Symptom (a): what column list did the drain actually put on the wire? */
window.__drainSelect = async (which) => {
  const target = which === 'fixed' ? fixed : broken
  target.calls.length = 0
  await target.table.check().selectAll(true)
  const selects = target.calls.filter((c) => c && c.select).map((c) => c.select)
  const flat = [...new Set(selects.flat())]
  return {
    selects: flat,
    // The whole point: never ask the server for a field the rows do not have.
    asksForMissingField: flat.some((f) => !(f in ROWS[0])),
    checked: target.table.check().count(),
  }
}
