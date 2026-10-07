// Fixture for attr-contract.spec.mjs — logic that keyed on ONE spelling after the class →
// attribute port. Each block is markup written the way a consumer may now write it.
//
//   A. tag-input `slot="list"` rows: mono builds their check box by hand, and checkbox.css
//      styles by attribute — the box was built with classes only and painted blank.
//   B. an ATTRIBUTE-only `<table mono-table mono-color="success">`: the header menu's portal
//      took its style scope from `closest('.mono-table')`, missed, and lost the colour.
//   C. the sticky-head flag on the SCROLL WRAPPER (`<div mono-table-scroll mono-sticky-head>`),
//      which table.css honours: the loading overlay only looked at the table for it.

import '@mono-lit/helper/ui/tag-input'
import '@mono-lit/helper/ui/table'
import '@mono-lit/helper/ui/sidebar'
import { controlMonoTable } from '@mono-lit/helper'

const people = [
  { Id: 1, Name: 'Ada' },
  { Id: 2, Name: 'Grace' },
  { Id: 3, Name: 'Linus' },
]

const tableData = Array.from({ length: 6 }, (_, i) => ({ Id: i + 1, City: `City ${i + 1}` }))
const table = controlMonoTable(tableData, {
  keyExpr: 'Id',
  pageSize: 10,
  props: { th: [{ field: 'City', caption: 'City', headerFilter: true, sort: {} }] },
})

document.querySelector('#app').innerHTML = `
  <div style="padding: 24px; display: grid; gap: 24px; width: 520px">
    <mono-tag-input id="ti" key-value="Id" display-value="Name" checkable>
      <div slot="list">${people.map((p) => `<div class="ti-row">${p.Name}</div>`).join('')}</div>
    </mono-tag-input>

    <table mono-table mono-color="success" id="attr-table">
      <thead><tr><th><mono-table-th id="th" field="City"></mono-table-th></th></tr></thead>
      <tbody id="rows"></tbody>
    </table>

    <div mono-table-scroll mono-sticky-head style="height: 160px; overflow: auto" id="wrap">
      <table mono-table id="wrapped-table">
        <caption><mono-table-loading id="loading"></mono-table-loading></caption>
        <thead><tr><th>Name</th></tr></thead>
        <tbody>${Array.from({ length: 12 }, (_, i) => `<tr><td>Row ${i + 1}</td></tr>`).join('')}</tbody>
      </table>
    </div>
  </div>
`

const ti = document.querySelector('#ti')
ti.items = people
ti.modelValue = [2]

document.querySelector('#th').controlTable = table
const rows = document.querySelector('#rows')
table.subscribe(() => {
  rows.innerHTML = table.items.map((r) => `<tr data-row-key="${r.Id}"><td>${r.City}</td></tr>`).join('')
})
table.load()

const tick = (ms = 120) => new Promise((r) => setTimeout(r, ms))

/** A: open the tag-input and report the hand-built check boxes. */
window.__tagInputBoxes = async () => {
  ti.open?.()
  await ti.updateComplete
  await tick()
  return Array.from(document.querySelectorAll('.ti-row')).map((row) => {
    const box = row.querySelector('[data-mono-chrome]')
    const inner = box?.querySelector('span')
    return {
      text: row.textContent.trim(),
      box: !!box,
      monoCheckbox: !!box?.hasAttribute('mono-checkbox'),
      checked: !!box?.hasAttribute('mono-checked'),
      innerBox: !!inner?.hasAttribute('mono-box'),
      borderWidth: inner ? getComputedStyle(inner).borderTopWidth : null,
    }
  })
}

/** B: right-click the header → its menu; report the colour carried by the menu's portal. */
window.__menuPortalColor = async () => {
  const th = document.querySelector('#th').closest('th')
  th.dispatchEvent(new MouseEvent('contextmenu', { bubbles: true, composed: true, cancelable: true, button: 2 }))
  await tick()
  const menu = document.querySelector('.mono-th-menu.open, [mono-th-menu][mono-open]')
  const portal = menu?.closest('[data-mono-popup-portal]')
  return { open: !!menu, portalColor: portal?.getAttribute('mono-color') ?? null }
}

/** C: show the spinner and report the header offset it measured. */
window.__loadingHead = async () => {
  document.querySelector('#loading').setAttribute('data-loading', '')
  await tick()
  const t = document.querySelector('#wrapped-table')
  return {
    head: t.style.getPropertyValue('--mono-table-loading-head'),
    theadHeight: t.querySelector('thead').offsetHeight,
  }
}

/**
 * D: `<mono-sidebar>`'s hydration re-assert. SSR hydration leaves DOM attributes stale while Lit
 * believes they are committed; sidebar.css reads the `mono-*` STATE attributes, so the re-assert
 * must restore those, not only class/style/aria-hidden. Simulated: stale them behind Lit's back,
 * then trigger an update in which no binding changes.
 */
window.__sidebarResync = async () => {
  const sb = document.createElement('mono-sidebar')
  sb.mode = 'temporary'
  sb.modelValue = true
  sb.setAttribute('contained', '')
  document.querySelector('#app').appendChild(sb)
  await sb.updateComplete
  const root = sb.querySelector('[mono-sidebar]')
  const before = { effective: root.getAttribute('mono-effective'), open: root.hasAttribute('mono-open') }
  root.setAttribute('mono-effective', 'stale')
  root.removeAttribute('mono-mode')
  root.removeAttribute('mono-open')
  sb.requestUpdate()
  await sb.updateComplete
  const after = {
    effective: root.getAttribute('mono-effective'),
    mode: root.getAttribute('mono-mode'),
    open: root.hasAttribute('mono-open'),
  }
  sb.remove()
  return { before, after }
}

window.__ready = true
