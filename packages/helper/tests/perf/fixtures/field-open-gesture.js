// The field-click gesture for select / tag-input / dropdown-table.
//
// A field that is NOT searchable (plain select, tag-input `searchable=false`,
// dropdown-table — its search box lives in the panel) TOGGLES on a click of its
// body: nothing to type there, so a second click means "close". A SEARCHABLE field
// (searchable select, tag-input) OPENS on a click in its input — that is how you
// start typing — but a second click while open never closes it (caret placement,
// text selection); the chevron, Escape or an outside click close. The chevron is a
// real control that toggles everywhere it renders. Typing opens with results. Focus
// alone (Tab) opens nothing. With a clearable value the clear button stands in for
// the chevron, open or closed — the value wins: a searchable field with a value
// closes by picking, Escape or an outside click.
//
// Real pointer events on the real elements; the handlers under test are `@click`s
// on the field / input / chevron, so nothing short of a real event path counts.

import '@mono-lit/helper/ui/select'
import '@mono-lit/helper/ui/tag-input'
import '@mono-lit/helper/ui/dropdown-table'
import '@mono-lit/helper/ui/table'
import { controlMonoDataDropdown } from '@mono-lit/helper'

const ITEMS = [{ v: 'a', l: 'Alpha' }, { v: 'b', l: 'Beta' }, { v: 'c', l: 'Gamma' }]

document.querySelector('#app').innerHTML = `
  <div class="wrap">
    <div class="card"><mono-select id="sel-search" searchable clearable key-value="v" display-value="l" placeholder="Searchable"></mono-select></div>
    <div class="card"><mono-select id="sel-plain" key-value="v" display-value="l" placeholder="Plain"></mono-select></div>
    <div class="card"><mono-tag-input id="tag-search" clearable key-value="v" display-value="l" placeholder="Tags"></mono-tag-input></div>
    <div class="card"><mono-tag-input id="tag-plain" searchable="false" key-value="v" display-value="l" placeholder="Tags (no search)"></mono-tag-input></div>
    <div class="card">
      <mono-dropdown-table id="ddt">
        <table mono-table><thead><tr><th>Name</th></tr></thead><tbody id="rows"></tbody></table>
      </mono-dropdown-table>
    </div>
    <div class="card" id="elsewhere" style="height: 80px">elsewhere</div>
    <!-- arm 7: disabled / readonly with a clearable value — neither ✕ nor ⌄ -->
    <div class="card"><mono-select id="sel-disabled" disabled clearable key-value="v" display-value="l"></mono-select></div>
    <div class="card"><mono-select id="sel-readonly" readonly clearable key-value="v" display-value="l"></mono-select></div>
    <div class="card"><mono-tag-input id="tag-disabled" disabled clearable key-value="v" display-value="l"></mono-tag-input></div>
    <div class="card"><mono-tag-input id="tag-readonly" readonly clearable key-value="v" display-value="l"></mono-tag-input></div>
    <div class="card">
      <mono-dropdown-table id="ddt-disabled" disabled clearable>
        <table mono-table><thead><tr><th>Name</th></tr></thead><tbody id="rows-disabled"></tbody></table>
      </mono-dropdown-table>
    </div>
    <div class="card">
      <mono-dropdown-table id="ddt-readonly" readonly clearable>
        <table mono-table><thead><tr><th>Name</th></tr></thead><tbody id="rows-readonly"></tbody></table>
      </mono-dropdown-table>
    </div>
  </div>
`

for (const id of ['sel-search', 'sel-plain', 'tag-search', 'tag-plain', 'sel-disabled', 'sel-readonly', 'tag-disabled', 'tag-readonly']) {
  document.querySelector('#' + id).items = ITEMS
}
document.querySelector('#sel-search').modelValue = 'b'
document.querySelector('#tag-search').modelValue = ['b']
for (const id of ['sel-disabled', 'sel-readonly']) document.querySelector('#' + id).modelValue = 'b'
for (const id of ['tag-disabled', 'tag-readonly']) document.querySelector('#' + id).modelValue = ['b']

const people = [{ Id: 1, Name: 'Ada' }, { Id: 2, Name: 'Alan' }]
function wireDdt(id, rowsId, value) {
  const dd = controlMonoDataDropdown(people, { keyExpr: 'Id', displayExpr: 'Name', pageSize: 10 })
  const ddt = document.querySelector('#' + id)
  ddt.dataDropdown = dd
  dd.table.subscribe(() => {
    document.querySelector('#' + rowsId).innerHTML = dd.table.items
      .map((r) => `<tr data-row-key="${r.Id}"><td>${r.Name}</td></tr>`).join('')
  })
  dd.table.load()
  if (value != null) ddt.modelValue = value
}
wireDdt('ddt', 'rows', null)
wireDdt('ddt-disabled', 'rows-disabled', 1)
wireDdt('ddt-readonly', 'rows-readonly', 1)

// ── probes ──────────────────────────────────────────────────────────────────
const el = (id) => document.querySelector('#' + id)
const fire = (node, type) =>
  node.dispatchEvent(new PointerEvent(type, { bubbles: true, composed: true, cancelable: true, pointerType: 'mouse' }))

/** Real pointer sequence + click on the first match of `sel` INSIDE the element. */
window.__click = async (id, sel) => {
  const target = sel ? el(id).querySelector(sel) : el(id)
  if (!target) return false
  fire(target, 'pointerdown')
  target.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, composed: true, cancelable: true }))
  fire(target, 'pointerup')
  target.dispatchEvent(new MouseEvent('mouseup', { bubbles: true, composed: true, cancelable: true }))
  target.click()
  await new Promise((r) => setTimeout(r, 80))
  return true
}
window.__isOpen = (id) => !!el(id).isOpen
window.__has = (id, sel) => !!el(id).querySelector(sel)
window.__focusInput = async (id, sel) => {
  el(id).querySelector(sel)?.focus()
  await new Promise((r) => setTimeout(r, 60))
}
window.__type = async (id, sel, text) => {
  const input = el(id).querySelector(sel)
  input.focus()
  input.value = text
  input.dispatchEvent(new Event('input', { bubbles: true, composed: true }))
  await new Promise((r) => setTimeout(r, 120))
}
window.__key = async (id, sel, key) => {
  const target = sel ? el(id).querySelector(sel) : el(id)
  target.focus()
  target.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true, composed: true, cancelable: true }))
  await new Promise((r) => setTimeout(r, 80))
}
window.__activeIn = (id, sel) => el(id).querySelector(sel) === document.activeElement
window.__value = (id) => el(id).modelValue ?? null
window.__close = async (id) => {
  el(id).close()
  await new Promise((r) => setTimeout(r, 60))
}

window.__ready = false
Promise.all(
  [
    'sel-search', 'sel-plain', 'tag-search', 'tag-plain', 'ddt',
    'sel-disabled', 'sel-readonly', 'tag-disabled', 'tag-readonly', 'ddt-disabled', 'ddt-readonly',
  ].map((id) => el(id).updateComplete),
).then(() => { window.__ready = true })
