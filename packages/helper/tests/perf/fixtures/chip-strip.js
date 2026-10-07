// Fixture for "`chip.behaviour: 'inline'` must not cost anything it doesn't have to".
//
// Reproduces the field that melted a real screen: a `<mono-tag-input>` that is
// `checkable`, `searchable`, GROUPED and full-width, holding several chips, with
// the dropdown open. The first release measured the chip strip from
// `hostUpdated()` — a forced layout on every render of every tag-input on the
// page, whose `requestUpdate()` then scheduled a further render from inside
// `updated()` (Lit's `change-in-update`). Paging also scrolled smoothly, and the
// shared popup controller listens for `scroll` on `window` in the CAPTURE phase,
// so each animation frame repositioned the open dropdown — a forced layout plus a
// `getComputedStyle` ancestor walk, ~30 times per click.
//
// COUNTERS, not timings — nothing here has a threshold to tune or flakes under
// machine load:
//   __updates()   how many times Lit actually re-rendered the element
//   __warns()     `change-in-update` warnings seen
//   __scrolls()   capture-phase scroll events reaching `window`
//
// The `flex` arm is the control: it must be COMPLETELY inert, because the
// regression billed every field on the page, not just the inline ones.

import '@mono-lit/helper/ui/tag-input'

const DEPTS = []
for (const co of ['EJI', 'IEG', 'MPE']) {
  for (const d of [
    'Marketing',
    'Sales',
    'Demand Supply Customer Operation',
    'Market Research',
    'Community Demand & Beauty',
    'Finance',
  ]) {
    DEPTS.push({ _DeptKey: `${co}|${d}`, Nama: d, Code: d.slice(0, 3).toUpperCase(), CompanyName: co })
  }
}

const host = document.getElementById('app')
host.innerHTML = '<div style="width:420px"><mono-tag-input id="ti" clearable label="Departemen"></mono-tag-input></div>'
const el = document.getElementById('ti')

el.items = DEPTS
el.keyValue = '_DeptKey'
el.displayValue = 'Nama'
el.searchValue = ['Nama', 'Code', 'CompanyName']
el.displayGroup = ['CompanyName']
el.groupSticky = true
el.checkable = true
el.searchable = true
// No display cap: the strip must OVERFLOW for the paging arms to mean anything,
// and `max-visible` would fold six chips into two plus "+4 more".
el.width = '100%'
el.modelValue = DEPTS.slice(0, 6).map((r) => r._DeptKey)

let updates = 0
const origUpdate = el.update.bind(el)
el.update = function (changed) {
  updates++
  return origUpdate(changed)
}

// In `flex` mode the controller's cost is not an extra RENDER — with no strip in
// the DOM its measurement finds nothing and changes no flag, so an update counter
// stays flat while it still runs on every render. What it actually spends is a
// lookup for the strip (and, once found, a forced layout). Count the lookup.
let stripQueries = 0
const origQuery = el.querySelector.bind(el)
el.querySelector = function (selector) {
  if (typeof selector === 'string' && selector.includes('chip-strip')) stripQueries++
  return origQuery(selector)
}

let warns = 0
const origWarn = console.warn.bind(console)
console.warn = (...args) => {
  if (String(args[0] ?? '').includes('change-in-update')) warns++
  origWarn(...args)
}

let scrolls = 0
window.addEventListener('scroll', () => { scrolls++ }, { capture: true, passive: true })

window.__setInline = (on) => { el.chip = on ? { behaviour: 'inline' } : {} }
window.__open = () => { el._open = true }
window.__reset = () => { updates = 0; warns = 0; scrolls = 0; stripQueries = 0 }
window.__stats = () => ({ updates, warns, scrolls, stripQueries })

/** Force N real re-renders, the way a parent re-render or a keystroke would. */
window.__churn = async (n) => {
  for (let i = 0; i < n; i++) {
    el.label = `Departemen ${i}`
    await el.updateComplete
  }
}

/** Tick a row in the open list — the checkable path that adds a chip. */
window.__toggleRow = (index) => {
  const rows = [...document.querySelectorAll('.mono-tag-input-item')].filter(
    (r) => !r.classList.contains('mono-tag-input-select-all'),
  )
  rows[index]?.click()
  return rows.length
}
const visible = (node) => !!node && getComputedStyle(node).visibility !== 'hidden'

window.__hasNext = () => visible(el.querySelector('.mono-tag-input-scroll-next'))
window.__hasPrev = () => visible(el.querySelector('.mono-tag-input-scroll-prev'))
window.__pageNext = () => el.querySelector('.mono-tag-input-scroll-next')?.click()
window.__pagePrev = () => el.querySelector('.mono-tag-input-scroll-prev')?.click()

/**
 * The geometry the paging jump lives in. `clientWidth` must not move when a
 * button appears or disappears — if it does, the browser re-clamps `scrollLeft`
 * and the chips visibly slide.
 */
window.__geom = () => {
  const strip = el.querySelector('.mono-tag-input-chip-strip')
  const actions = el.querySelector('.mono-tag-input-actions')
  if (!strip || !actions) return null
  return {
    clientWidth: strip.clientWidth,
    actionsWidth: Math.round(actions.getBoundingClientRect().width),
    scrollLeft: Math.round(strip.scrollLeft),
    maxScroll: strip.scrollWidth - strip.clientWidth,
  }
}

/** Strip → buttons distance, and the input width driving it. */
window.__gap = () => {
  const strip = el.querySelector('.mono-tag-input-chip-strip')
  const actions = el.querySelector('.mono-tag-input-actions')
  const input = el.querySelector('.mono-tag-input-native')
  if (!strip || !actions || !input) return null
  return {
    focused: document.activeElement === input,
    inputW: Math.round(input.getBoundingClientRect().width),
    gap: Math.round(actions.getBoundingClientRect().left - strip.getBoundingClientRect().right),
  }
}
window.__focusInput = () => el.querySelector('.mono-tag-input-native')?.focus()
window.__blurInput = () => el.querySelector('.mono-tag-input-native')?.blur()
window.__type = (text) => {
  const input = el.querySelector('.mono-tag-input-native')
  input.focus()
  input.value = text
  input.dispatchEvent(new Event('input', { bubbles: true }))
}

window.__ready = true
