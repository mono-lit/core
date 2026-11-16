// `<mono-table-paging type="virtual-scroll" render-all-below>` — a small set is mounted whole
// (progressively), a large one stays windowed.
//
// Fed exactly like esw's `useMonoArrayTable`: `controlMonoTable(null, { pageSize })` →
// `bind(array)` → `load()`, then `setData()` for a new result set. The body is painted by hand
// from `table.items` + the two spacer heights — what a Vue `v-for` page does.

import '@mono-lit/helper/ui/table'
import { controlMonoTable } from '@mono-lit/helper'

const ROW_H = 30
const rowsOf = (n, tag = 'r') => Array.from({ length: n }, (_, i) => ({ Id: `${tag}${i}`, Name: `${tag} ${i}` }))

document.body.innerHTML = `
  <div class="mono-table-scroll" id="box" style="height: 300px; overflow: auto">
    <table class="mono-table">
      <thead><tr><th>Name</th></tr></thead>
      <tbody id="body"></tbody>
    </table>
    <mono-table-paging id="pager" type="virtual-scroll" row-height="${ROW_H}" overscan="10"
      render-all-below="300" fill-chunk="25"></mono-table-paging>
  </div>`

const table = controlMonoTable(null, { keyExpr: 'Id', pageSize: 100000 })
const body = document.getElementById('body')

/** Every notify: how many rows were mounted, so the spec can see the fill grow frame by frame. */
window.__history = []
function paint() {
  const top = table.virtualPadTop, bottom = table.virtualPadBottom
  body.innerHTML =
    (top ? `<tr class="pad"><td style="height:${top}px;padding:0"></td></tr>` : '') +
    table.items.map((r) => `<tr data-row-key="${r.Id}"><td style="height:${ROW_H}px;padding:0;box-sizing:border-box">${r.Name}</td></tr>`).join('') +
    (bottom ? `<tr class="pad"><td style="height:${bottom}px;padding:0"></td></tr>` : '')
  window.__history.push(table.items.length)
}
table.subscribe(paint)

document.getElementById('pager').dataGrid = table

window.__state = () => {
  const box = document.getElementById('box')
  const keys = [...body.querySelectorAll('tr[data-row-key]')].map((r) => r.dataset.rowKey)
  return {
    mounted: keys.length, first: keys[0], last: keys.at(-1),
    padTop: table.virtualPadTop, padBottom: table.virtualPadBottom,
    loaded: table.loadedCount, scrollTop: box.scrollTop, scrollHeight: box.scrollHeight,
  }
}
window.__scrollTo = (y) => { document.getElementById('box').scrollTop = y }
window.__setData = async (n, tag) => {
  window.__history = []
  await table.setData(rowsOf(n, tag))
}

table.bind(rowsOf(200))
table.load().then(() => { window.__ready = true })
