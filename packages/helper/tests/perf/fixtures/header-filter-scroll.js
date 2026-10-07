// The header-filter panel must not scroll itself away when you tick a value.
//
// Each value row hides its real <input> with `position: absolute`. If the row is
// not itself positioned, that input resolves against the PANEL instead — so it
// stays put while the list scrolls, ends up outside the panel's box, and clicking
// the label focuses it. The browser then scrolls the panel to bring the input into
// view, taking the head, search box, list and footer with it: the panel is still
// open and fully populated, but renders as an empty card.
//
// 25 values so the 224px list scrolls well past a screenful, and a plain array so
// nothing here touches the network.

import '@mono-lit/helper/ui/table'
import { controlMonoTable } from '@mono-lit/helper'

const data = Array.from({ length: 25 }, (_, i) => ({
  Id: i + 1,
  City: `City ${String(i + 1).padStart(2, '0')}`,
}))

const table = controlMonoTable(data, {
  keyExpr: 'Id',
  pageSize: 5,
  props: {
    th: [{ field: 'City', caption: 'City', headerFilter: true }],
  },
})

document.querySelector('#app').innerHTML = `
  <table mono-table>
    <thead>
      <tr><th><mono-table-th id="th" field="City"></mono-table-th></th></tr>
    </thead>
    <tbody id="rows"></tbody>
  </table>
`

const th = document.querySelector('#th')
th.controlTable = table

const body = document.querySelector('#rows')
table.subscribe(() => {
  body.innerHTML = table.items.map((r) => `<tr><td>${r.City}</td></tr>`).join('')
})
table.load()

/** The portaled panel (it is moved out of the table, so query from the document). */
const panel = () => document.querySelector('.mono-th-filter')
const list = () => document.querySelector('.mono-th-filter-list')

window.__openFilter = () => {
  document.querySelector('.mono-th-filter-ind')?.click()
}

/** Scroll the value list to the bottom. */
window.__scrollListToEnd = () => {
  const el = list()
  if (!el) return -1
  el.scrollTop = el.scrollHeight
  el.dispatchEvent(new Event('scroll', { bubbles: false }))
  return el.scrollTop
}

/**
 * Click a value row's <label> by its index among the value rows, exactly as a
 * user would (the <input> itself is `pointer-events: none`).
 * `which: 'last'` picks the deepest row; `which: 'all'` picks "(Select all)".
 */
window.__clickRow = (which) => {
  const rows = [...document.querySelectorAll('.mono-th-filter-list .mono-th-check')]
  const all = rows.find((r) => r.classList.contains('mono-th-check-all'))
  const values = rows.filter((r) => !r.classList.contains('mono-th-check-all'))
  const target = which === 'all' ? all : values[values.length - 1]
  target?.click()
  return { rows: rows.length, values: values.length, clicked: !!target }
}

/**
 * The evidence. `scrollTop` is the mechanism; `headVisible` is what the user
 * actually reports — both are read AFTER the click.
 */
window.__panelState = () => {
  const p = panel()
  if (!p) return null
  const head = p.querySelector('.mono-th-filter-head')
  const pr = p.getBoundingClientRect()
  const hr = head?.getBoundingClientRect()
  return {
    scrollTop: p.scrollTop,
    open: p.classList.contains('open'),
    // The head must still sit inside the panel's painted box.
    headVisible: !!hr && hr.top >= pr.top - 1 && hr.bottom <= pr.bottom + 1,
    checked: p.querySelectorAll('.mono-th-filter-list input:checked').length,
  }
}

setTimeout(() => {
  window.__ready = true
}, 400)
