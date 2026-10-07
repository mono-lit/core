// Fixture for dropdown-table-infinity.spec.mjs. The picker shape from esw-ui's
// input-transfer-budget.vue: a `<mono-dropdown-table>` whose panel holds a sticky-head table and
// a `<mono-table-paging type="infinity-scroll">`, with the panel height capped so the body region
// scrolls. Scrolling that region to its end must append the next page by itself — "Load more" is
// only the fallback.
//
// The panel is moved into a body-level portal on first open. Panel CSS is scoped under the
// dropdown-table root, so it only applies once the portal carries the root's attributes — and the
// move reconnects everything inside synchronously. Each picker below is one thing that measured
// during that move:
//   #dd-body    pager in the body slot (the esw-ui placement)
//   #dd-footer  pager in slot="footer" — a SIBLING of the scrolling region
//   #dd-loading a load in flight at first open — the spinner freezes the region's height
//   #dd-empty   an empty state showing at first open — its room is released on the move

import '@mono-lit/helper/ui/dropdown-table'
import '@mono-lit/helper/ui/table'
import { controlMonoDataDropdown } from '@mono-lit/helper'

const rowsData = Array.from({ length: 200 }, (_, i) => ({ Id: i + 1, Name: `Row ${i + 1}` }))
const pickers = {
  body: controlMonoDataDropdown(rowsData, { keyExpr: 'Id', displayExpr: 'Name', pageSize: 20 }),
  footer: controlMonoDataDropdown(rowsData, { keyExpr: 'Id', displayExpr: 'Name', pageSize: 20 }),
  loading: controlMonoDataDropdown(rowsData, { keyExpr: 'Id', displayExpr: 'Name', pageSize: 20 }),
  empty: controlMonoDataDropdown([], { keyExpr: 'Id', displayExpr: 'Name', pageSize: 20 }),
}

const tableHtml = (name, extra = '') => `
  <table class="mono-table mono-table-fixed mono-table-sticky-head">
    ${extra}
    <thead><tr><th>Name</th></tr></thead>
    <tbody id="rows-${name}"></tbody>
  </table>`

document.querySelector('#app').innerHTML = `
  <div style="padding: 24px; width: 480px; display: grid; gap: 16px">
    <mono-dropdown-table id="dd-body" label="Body pager">
      ${tableHtml('body')}
      <mono-table-paging id="pg-body" type="infinity-scroll"></mono-table-paging>
    </mono-dropdown-table>
    <mono-dropdown-table id="dd-footer" label="Footer pager">
      ${tableHtml('footer')}
      <mono-table-paging id="pg-footer" slot="footer" type="infinity-scroll"></mono-table-paging>
    </mono-dropdown-table>
    <mono-dropdown-table id="dd-loading" label="Loading at open">
      ${tableHtml('loading', '<caption><mono-table-loading id="ld" data-loading></mono-table-loading></caption>')}
    </mono-dropdown-table>
    <mono-dropdown-table id="dd-empty" label="Empty at open">
      ${tableHtml('empty', '<caption><mono-table-empty id="em"></mono-table-empty></caption>')}
    </mono-dropdown-table>
  </div>
`

for (const [name, dd] of Object.entries(pickers)) {
  const el = document.querySelector(`#dd-${name}`)
  el.dataDropdown = dd
  el.dropdown = { maxHeight: '20rem' }
  const pg = document.querySelector(`#pg-${name}`)
  if (pg) pg.controlTable = dd.table
  const rows = document.querySelector(`#rows-${name}`)
  dd.table.subscribe(() => {
    rows.innerHTML = dd.table.items.map((r) => `<tr data-row-key="${r.Id}"><td>${r.Name}</td></tr>`).join('')
  })
  dd.table.load()
}
document.querySelector('#em').controlTable = pickers.empty.table

const tick = (ms) => new Promise((r) => setTimeout(r, ms))
const bodyOf = (name) => {
  const panel = document.querySelector(`[data-mono-popup-portal] #panel-probe-${name}`)?.closest('[mono-dd-panel]')
  return panel?.querySelector(':scope > [mono-dd-region="body"]') ?? null
}

/**
 * Open a picker, recording the portal's mutations in order: was the panel moved into a portal
 * that ALREADY carried the root's `mono-dropdown-table` attribute?
 */
window.__open = async (name) => {
  const el = document.querySelector(`#dd-${name}`)
  const panel = el.querySelector('[mono-dd-panel]')
  panel.id = `panel-probe-${name}`
  let dressedBeforeMove = null
  const mo = new MutationObserver((records) => {
    for (const r of records) {
      if (r.type === 'childList' && [...r.addedNodes].includes(panel) && dressedBeforeMove === null) {
        // `attributeOldValue` is not needed: the record order says it. An attribute record on
        // the portal BEFORE this childList record means it was dressed first.
        const i = records.indexOf(r)
        dressedBeforeMove = records
          .slice(0, i)
          .some((a) => a.type === 'attributes' && a.target === r.target && a.attributeName === 'mono-dropdown-table')
      }
    }
  })
  mo.observe(document.body, { subtree: true, childList: true, attributes: true })
  el.open()
  await el.updateComplete
  await tick(200)
  mo.disconnect()
  return { dressedBeforeMove }
}
window.__close = async (name) => {
  const el = document.querySelector(`#dd-${name}`)
  el.close?.()
  await el.updateComplete
  await tick(100)
}

window.__state = (name) => {
  const pg = document.querySelector(`#pg-${name}`)
  const sc = pg?._scrollEl
  const b = bodyOf(name)
  return {
    loaded: pickers[name].table.items.length,
    scrollEl: sc ? (sc.getAttribute('mono-dd-region') ? `region:${sc.getAttribute('mono-dd-region')}` : sc.tagName) : null,
    body: b ? { sh: b.scrollHeight, ch: b.clientHeight, ov: getComputedStyle(b).overflowY } : null,
  }
}
window.__scrollBottom = async (name) => {
  const b = bodyOf(name)
  b.scrollTop = b.scrollHeight
  b.dispatchEvent(new Event('scroll'))
  await tick(300)
}
window.__emptyHold = () => {
  const b = bodyOf('empty')
  return {
    hold: b?.style.getPropertyValue('--mono-table-hold-empty') ?? '',
    visible: document.querySelector('#em').hasAttribute('data-mono-empty'),
  }
}
window.__ready = true
