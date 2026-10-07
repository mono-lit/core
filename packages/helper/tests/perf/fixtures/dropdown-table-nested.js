// A popup opened from INSIDE a `<mono-dropdown-table>` panel must not dismiss it.
//
// The panel holds a consumer `<table>` whose `<mono-table-th header-filter>` opens a
// right-click menu and a distinct-values filter popup, plus a `<mono-select>` in the
// search slot. Every one of those is a `PopupPortalController` with a portal of its
// own on `<body>` — so to the dropdown-table's outside-click test, a click in the
// filter's search box (or on a select option) looked like a click on the page, and
// the panel closed under the user's hands. Escape did the same: the filter's own
// listener closed the filter, the dropdown-table's closed the dropdown-table.
//
// The fixture also mounts a second, UNRELATED `<mono-select>` outside the panel: a
// click in ITS option list is a real outside click and must still close the panel —
// ownership, not "anything in any portal".
//
// Everything here is plain arrays; nothing touches the network.

import '@mono-lit/helper/ui/dropdown-table'
import '@mono-lit/helper/ui/table'
import '@mono-lit/helper/ui/select'
import { controlMonoDataDropdown } from '@mono-lit/helper'

const people = Array.from({ length: 6 }, (_, i) => ({
  Id: i + 1,
  Name: `Person ${i + 1}`,
  City: ['Köln', 'Aachen', 'Bonn'][i % 3],
}))

const dd = controlMonoDataDropdown(people, {
  keyExpr: 'Id',
  displayExpr: 'Name',
  pageSize: 10,
  searchValue: ['Name', 'City'],
  props: {
    dropdownTable: { label: 'Owner', placeholder: 'Pick…' },
    th: [
      { field: 'Name', caption: 'Name', headerFilter: true, sort: {} },
      { field: 'City', caption: 'City', headerFilter: true, sort: {} },
    ],
  },
})

document.querySelector('#app').innerHTML = `
  <div class="wrap">
    <div class="card">
      <mono-dropdown-table id="ddt">
        <mono-table-search id="search" slot="search"></mono-table-search>
        <mono-select id="inner" slot="search" key-value="v" display-value="l" placeholder="Inner"></mono-select>
        <table mono-table>
          <thead><tr>
            <th><mono-table-th id="th-name" field="Name"></mono-table-th></th>
            <th><mono-table-th id="th-city" field="City"></mono-table-th></th>
          </tr></thead>
          <tbody id="rows"></tbody>
        </table>
      </mono-dropdown-table>
    </div>
    <div class="card">
      <mono-select id="outer" key-value="v" display-value="l" placeholder="Outer"></mono-select>
    </div>
    <div class="card" id="elsewhere" style="height: 120px">elsewhere</div>
  </div>
`

const ddt = document.querySelector('#ddt')
ddt.dataDropdown = dd
document.querySelector('#search').controlTable = dd.table
for (const id of ['th-name', 'th-city']) document.querySelector(`#${id}`).controlTable = dd.table
const OPTIONS = [{ v: 'a', l: 'Alpha' }, { v: 'b', l: 'Beta' }, { v: 'c', l: 'Gamma' }]
document.querySelector('#inner').items = OPTIONS
document.querySelector('#outer').items = OPTIONS

const body = document.querySelector('#rows')
dd.table.subscribe(() => {
  body.innerHTML = dd.table.items
    .map((r) => `<tr data-row-key="${r.Id}"><td>${r.Name}</td><td>${r.City}</td></tr>`)
    .join('')
})
dd.table.load()

// ── probes ──────────────────────────────────────────────────────────────────
// Real pointer events, bubbling and composed, exactly what the document-level
// capture listeners see from a user; `click()` after so the button semantics run.
const fire = (el, type, init = {}) =>
  el.dispatchEvent(new PointerEvent(type, { bubbles: true, composed: true, cancelable: true, pointerType: 'mouse', ...init }))

window.__pointer = (selector) => {
  const el = document.querySelector(selector)
  if (!el) return false
  fire(el, 'pointerdown')
  fire(el, 'pointerup')
  el.click()
  return true
}

window.__open = async () => {
  ddt.open()
  await ddt.updateComplete
  await new Promise((r) => setTimeout(r, 60))
}
window.__isOpen = () => ddt.isOpen && !!document.querySelector('.mono-dropdown-table-panel.open')

/** Right-click the City header → the th's menu; then its Header Filter row → the filter popup. */
window.__openFilter = async () => {
  const th = document.querySelector('#th-city').closest('th')
  th.dispatchEvent(new MouseEvent('contextmenu', { bubbles: true, composed: true, cancelable: true, button: 2 }))
  await new Promise((r) => setTimeout(r, 60))
  document.querySelector('.mono-th-menu.open [data-menu="filter"]')?.click()
  await new Promise((r) => setTimeout(r, 120))
}
window.__filterOpen = () => !!document.querySelector('.mono-th-filter.open')

/** Same, for any column's header (id of its <mono-table-th>). */
window.__openFilterFor = async (id) => {
  const th = document.querySelector('#' + id).closest('th')
  th.dispatchEvent(new MouseEvent('contextmenu', { bubbles: true, composed: true, cancelable: true, button: 2 }))
  await new Promise((r) => setTimeout(r, 60))
  document.querySelector('.mono-th-menu.open [data-menu="filter"]')?.click()
  await new Promise((r) => setTimeout(r, 120))
}
/** The open panel's footer button labels, in order. */
window.__filterButtons = () =>
  [...document.querySelectorAll('.mono-th-filter.open .mono-th-filter-foot button')].map((b) => b.textContent.trim())
window.__clickFilterButton = (label) => {
  const b = [...document.querySelectorAll('.mono-th-filter.open .mono-th-filter-foot button')].find((x) => x.textContent.trim().startsWith(label))
  if (!b) return false
  b.click()
  return true
}
/** Tick the select-all row (the first check) and Apply — every listed value. */
window.__tickAllAndApply = async () => {
  document.querySelector('.mono-th-filter.open .mono-th-filter-list .mono-th-check')?.click()
  await new Promise((r) => setTimeout(r, 40))
  return window.__clickFilterButton('Apply')
}
window.__columnFilter = (field) => dd.table.columnFilter(field)
/** Tick ONE value row (the last — the first is select-all) and Apply. */
window.__tickFirstAndApply = async () => {
  const checks = document.querySelectorAll('.mono-th-filter.open .mono-th-filter-list .mono-th-check')
  checks[checks.length - 1]?.click()
  await new Promise((r) => setTimeout(r, 40))
  return window.__clickFilterButton('Apply')
}
window.__filteredColumns = () => dd.table.filteredColumns()
window.__sorts = () => dd.table.sorts.map((s) => `${s.field}:${s.order}`)

/** LEFT-click the funnel icon of a column — the single-column path (unless combining). */
window.__funnel = async (id) => {
  document.querySelector('#' + id).querySelector('.mono-th-filter-ind')?.click()
  await new Promise((r) => setTimeout(r, 120))
}
/** LEFT-click a column's sort arrow. */
window.__arrow = async (id) => {
  document.querySelector('#' + id).querySelector('.mono-table-sort-btn')?.click()
  await new Promise((r) => setTimeout(r, 80))
}
/** Right-click a column → Sort › → the labelled row (Ascending / Descending / Clear / Clear all sorting). */
window.__menuSort = async (id, label) => {
  const th = document.querySelector('#' + id).closest('th')
  th.dispatchEvent(new MouseEvent('contextmenu', { bubbles: true, composed: true, cancelable: true, button: 2 }))
  await new Promise((r) => setTimeout(r, 60))
  document.querySelector('.mono-th-menu.open [data-menu="sort"]')?.click()
  await new Promise((r) => setTimeout(r, 60))
  const row = [...document.querySelectorAll('.mono-th-submenu.open .mono-th-menu-item')].find((b) => b.textContent.trim().startsWith(label))
  row?.click()
  await new Promise((r) => setTimeout(r, 80))
  return !!row
}
window.__filterRows = () => document.querySelectorAll('.mono-th-filter.open .mono-th-filter-list .mono-th-check').length

window.__openSelect = async (id) => {
  const el = document.querySelector(`#${id}`)
  el.open()
  await el.updateComplete
  await new Promise((r) => setTimeout(r, 60))
}
/** The select's option list is portaled too — find the one that is open. */
window.__pickOption = (label) => {
  const opt = [...document.querySelectorAll('.mono-select-item')].find((o) => o.textContent.trim() === label)
  if (!opt) return false
  fire(opt, 'pointerdown')
  fire(opt, 'pointerup')
  opt.click()
  return true
}
window.__selectValue = (id) => document.querySelector(`#${id}`).modelValue ?? null

window.__ready = false
Promise.all([ddt.updateComplete, document.querySelector('#inner').updateComplete]).then(() => {
  window.__ready = true
})
