// The date filter over a REAL devextreme ODataStore (the Northwind shape) — the
// spec answers the requests itself through page.route, so this pins the
// wall-clock contract: devextreme parses `1997-01-01T00:00:00Z` into LOCAL
// midnight and serialises a local-midnight Date back as `…T00:00:00Z`, so the
// default (local) tree files the row under the server's own day and the range it
// sends lands on the same literals the server holds — in any browser timezone.
import '@mono-lit/helper/ui/table'
import { controlMonoTable } from '@mono-lit/helper'
import { ODataStore, DataSource } from '@mono-lit/devextreme'

const store = new ODataStore({ url: 'https://stub.local/odata/Orders', key: 'OrderID', version: 4 })
const ds = new DataSource({
  store,
  select: ['OrderID', 'OrderDate'],
  paginate: true,
  pageSize: 8,
  requireTotalCount: true,
})
const table = controlMonoTable(null, {
  keyExpr: 'OrderID',
  props: { th: [{ field: 'OrderDate', caption: 'Ordered', dateFilter: { depth: 'day' } }] },
})

document.querySelector('#app').innerHTML = `
  <table mono-table><thead><tr>
    <th><mono-table-th id="th-od" field="OrderDate"></mono-table-th></th>
  </tr></thead></table>`
document.querySelector('#th-od').controlTable = table

const panel = () => document.querySelector('.mono-th-filter.open')
window.__treeRows = () =>
  [...(panel()?.querySelectorAll('.mono-th-tree-row') ?? [])].map((r) => ({
    key: r.dataset.key,
    count: Number(r.querySelector('.mono-th-check-count')?.textContent),
  }))
window.__openFunnel = () => document.querySelector('#th-od .mono-th-filter-ind')?.click()
window.__expand = (key) => panel()?.querySelector(`.mono-th-tree-row[data-key="${key}"] .mono-th-tree-toggle`)?.click()
window.__tick = (key) => panel()?.querySelector(`.mono-th-tree-row[data-key="${key}"] .mono-th-check`)?.click()
window.__apply = () => [...(panel()?.querySelectorAll('.mono-th-filter-foot button') ?? [])].find((b) => b.textContent.trim() === 'Apply')?.click()
window.__state = () => ({
  total: table.totalCount,
  days: table.items.map((r) => (r.OrderDate instanceof Date ? r.OrderDate.getDate() : String(r.OrderDate))),
  filter: table.columnFilter('OrderDate').map((r) => (r ? [r.from.getTime(), r.to.getTime()] : null)),
})

window.__ready = false
table.bind(ds)
table.load().then(() => setTimeout(() => (window.__ready = true), 50))
