// The DATE filter: a header filter whose panel is a year → … → second tree.
//
// An array-backed grid with a datetime column spanning two years, a plain
// header-filter column beside it (so cascading between the two is exercised),
// and a third column that sets BOTH — the exclusivity warning. Everything here is
// local; nothing touches the network.

import '@mono-lit/helper/ui/table'
import { controlMonoTable } from '@mono-lit/helper'

const rows = [
  { Id: 1, Brand: 'One', When: '2026-03-05T13:05:09' },
  { Id: 2, Brand: 'One', When: '2026-03-05T13:05:30' },
  { Id: 3, Brand: 'Two', When: '2026-03-20T08:00:00' },
  { Id: 4, Brand: 'Two', When: '2026-07-01T00:00:00' },
  { Id: 5, Brand: 'One', When: '2025-12-31T23:59:59' },
  { Id: 6, Brand: 'Two', When: null },
]

window.__warnings = []
const rawWarn = console.warn.bind(console)
console.warn = (...args) => { window.__warnings.push(args.map(String).join(' ')); rawWarn(...args) }

const table = controlMonoTable(rows, {
  keyExpr: 'Id',
  pageSize: 50,
  props: {
    th: [
      { field: 'Brand', caption: 'Brand', headerFilter: true },
      { field: 'When', caption: 'When', dateFilter: { depth: 'second' } },
      { field: 'Id', caption: 'Id', headerFilter: true, dateFilter: { depth: 'day' } },
    ],
  },
})

document.querySelector('#app').innerHTML = `
  <div class="card">
    <table mono-table>
      <thead><tr>
        <th><mono-table-th id="th-brand" field="Brand"></mono-table-th></th>
        <th><mono-table-th id="th-when" field="When"></mono-table-th></th>
        <th><mono-table-th id="th-both" field="Id"></mono-table-th></th>
      </tr></thead>
      <tbody id="rows"></tbody>
    </table>
  </div>
`
for (const id of ['th-brand', 'th-when', 'th-both']) document.querySelector('#' + id).controlTable = table
table.subscribe(() => {
  document.querySelector('#rows').innerHTML = table.items
    .map((r) => `<tr data-row-key="${r.Id}"><td>${r.Brand}</td><td>${r.When ?? ''}</td><td>${r.Id}</td></tr>`).join('')
})
table.load()

// ── probes ──────────────────────────────────────────────────────────────────
const wait = (ms) => new Promise((r) => setTimeout(r, ms))
const panel = () => document.querySelector('.mono-th-filter.open')

/** Right-click a header → its filter row (Header Filter / Date Filter) → the panel. Returns the row label. */
window.__openMenuFilter = async (id) => {
  const th = document.querySelector('#' + id).closest('th')
  th.dispatchEvent(new MouseEvent('contextmenu', { bubbles: true, composed: true, cancelable: true, button: 2 }))
  await wait(60)
  const row = document.querySelector('.mono-th-menu.open [data-menu="filter"]')
  const label = row?.querySelector('.mono-th-menu-label')?.textContent?.trim() ?? null
  row?.click()
  await wait(150)
  return label
}
window.__openFunnel = async (id) => {
  document.querySelector('#' + id).querySelector('.mono-th-filter-ind')?.click()
  await wait(150)
}
window.__isDatePanel = () => !!panel()?.classList.contains('is-date')
/** Visible tree rows as `{ key, level, label, count, state, expanded }`. */
window.__treeRows = () =>
  [...(panel()?.querySelectorAll('.mono-th-tree-row') ?? [])].map((r) => {
    const input = r.querySelector('input')
    return {
      key: r.dataset.key,
      level: Number(r.dataset.level),
      label: r.querySelector('.mono-th-check-label')?.textContent?.trim(),
      count: Number(r.querySelector('.mono-th-check-count')?.textContent),
      state: input.indeterminate ? 'mixed' : input.checked ? 'on' : 'off',
      expanded: r.querySelector('.mono-th-tree-toggle')?.classList.contains('open') ?? false,
      leaf: r.querySelector('.mono-th-tree-toggle')?.hidden ?? true,
    }
  })
window.__expand = async (key) => {
  panel()?.querySelector(`.mono-th-tree-row[data-key="${key}"] .mono-th-tree-toggle`)?.click()
  await wait(60)
}
window.__tick = async (key) => {
  panel()?.querySelector(`.mono-th-tree-row[data-key="${key}"] .mono-th-check`)?.click()
  await wait(60)
}
window.__button = async (label) => {
  const b = [...(panel()?.querySelectorAll('.mono-th-filter-foot button') ?? [])].find((x) => x.textContent.trim().startsWith(label))
  b?.click()
  await wait(120)
  return !!b
}
window.__hasSearchBox = () => !!panel()?.querySelector('.mono-th-filter-input')
window.__columnFilter = (field) => (table.columnFilter(field) ?? []).map((v) => (v && typeof v === 'object' ? { from: v.from.toISOString(), to: v.to.toISOString() } : v))
window.__rowIds = () => table.items.map((r) => r.Id)
window.__filteredColumns = () => table.filteredColumns()
window.__tickPlain = async (label) => {
  const row = [...(panel()?.querySelectorAll('.mono-th-check') ?? [])].find((c) => c.querySelector('.mono-th-check-label')?.textContent?.trim() === label)
  row?.click()
  await wait(60)
  return !!row
}
window.__plainRows = () => [...(panel()?.querySelectorAll('.mono-th-filter-list .mono-th-check:not(.mono-th-check-all)') ?? [])].map((c) => c.querySelector('.mono-th-check-label')?.textContent?.trim())

window.__ready = false
Promise.all(['th-brand', 'th-when', 'th-both'].map((id) => document.querySelector('#' + id).updateComplete)).then(() => {
  window.__ready = true
})
