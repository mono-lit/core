// The "+N more" chip panel of `<mono-tag-input>` and `<mono-dropdown-table>` is
// a floating layer of its own.
//
// It used to be a `position: absolute` child of the field, which any ancestor
// with `overflow: hidden` (a card, a table cell, a modal body) clipped — found
// live: the panel cut off by the row below. Now each component runs a second
// `PopupPortalController` for it: the light build relocates the panel into a
// <body> portal and places it `fixed` from its anchor with flip + shift + the
// available-height clamp; the shadow build positions it in place.
//
// Arms, per component and per build: a field inside a 56px-tall
// `overflow: hidden` card (the clipping case), and a field pinned near the
// bottom of the viewport (the flip case).

import '@mono-lit/helper/ui/tag-input'
import '@mono-lit/helper/ui/shadow/tag-input'
import '@mono-lit/helper/ui/dropdown-table'
import '@mono-lit/helper/ui/shadow/dropdown-table'
import { controlMonoDataDropdown } from '@mono-lit/helper'

const host = document.getElementById('app')
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

const TAGS = Array.from({ length: 9 }, (_, i) => `Beban Target & Insentif - 2.6 BRAND ACTIVATION - 2.6.${i + 1} ITEM ${i + 1}`)
const ROWS = Array.from({ length: 9 }, (_, i) => ({ Id: i + 1, Name: `Person ${i + 1} with a long name` }))

const style = document.createElement('style')
style.textContent = `
  .clip { height: 56px; overflow: hidden; border: 1px solid #ccc; margin: 8px 0; width: 640px; }
  .spacer { height: 600px; }
  .bottom { position: fixed; left: 16px; bottom: 8px; width: 640px; }
  #elsewhere { position: fixed; right: 16px; top: 16px; width: 120px; height: 60px; background: #eee; }
`
document.head.appendChild(style)

const ARMS = {}

function tagInput(id, tag, where) {
  const el = document.createElement(tag)
  el.id = id
  el.setAttribute('max-visible', '3')
  el.items = TAGS
  el.modelValue = [...TAGS]
  where.appendChild(el)
  ARMS[id] = { el, kind: 'tag', shadow: tag.startsWith('mono-shadow') }
  return el
}

function dropdownTable(id, tag, where) {
  const dd = controlMonoDataDropdown(ROWS, { keyExpr: 'Id', displayExpr: 'Name', multiple: true })
  dd.setValue([1, 2, 3, 4, 5, 6, 7, 8, 9])
  const el = document.createElement(tag)
  el.id = id
  el.setAttribute('max-visible', '3')
  el.innerHTML = '<table mono-table><tbody></tbody></table>'
  where.appendChild(el)
  el.dataDropdown = dd
  ARMS[id] = { el, kind: 'ddt', shadow: tag.startsWith('mono-shadow'), dd }
  return el
}

const clipCard = (id) => {
  const c = document.createElement('div')
  c.className = 'clip'
  c.id = `clip-${id}`
  host.appendChild(c)
  return c
}

// Clipping arms (light + shadow, both components).
tagInput('tag-clip', 'mono-tag-input', clipCard('tag-clip'))
tagInput('tag-clip-shadow', 'mono-shadow-tag-input', clipCard('tag-clip-shadow'))
dropdownTable('ddt-clip', 'mono-dropdown-table', clipCard('ddt-clip'))
dropdownTable('ddt-clip-shadow', 'mono-shadow-dropdown-table', clipCard('ddt-clip-shadow'))

const spacer = document.createElement('div')
spacer.className = 'spacer'
host.appendChild(spacer)

// Flip arms: pinned to the viewport bottom, light only (that is the portaled path).
const bottom = document.createElement('div')
bottom.className = 'bottom'
host.appendChild(bottom)
tagInput('tag-bottom', 'mono-tag-input', bottom)
dropdownTable('ddt-bottom', 'mono-dropdown-table', bottom)

const elsewhere = document.createElement('div')
elsewhere.id = 'elsewhere'
elsewhere.textContent = 'elsewhere'
host.appendChild(elsewhere)

// ── probes ──────────────────────────────────────────────────────────────────
const fire = (el, type, init = {}) =>
  el.dispatchEvent(new PointerEvent(type, { bubbles: true, composed: true, cancelable: true, pointerType: 'mouse', ...init }))
const press = (el) => {
  fire(el, 'pointerdown')
  fire(el, 'pointerup')
  el.click()
}

const root = (arm) => arm.el.shadowRoot ?? arm.el
const moreChip = (arm) =>
  root(arm).querySelector(arm.kind === 'tag' ? '.mono-tag-input-more [role="button"]' : '.mono-dropdown-table-more-chip [role="button"]')
const panelClass = (arm) => (arm.kind === 'tag' ? '.mono-tag-input-more-panel' : '.mono-dropdown-table-more')
/**
 * The panel wherever it lives now: the host, its shadow root, or a body portal.
 * Each arm's panel is stamped with `data-arm` while it is still in place (see
 * `__tagPanels`), so a portaled one is found by that.
 */
const panel = (arm) =>
  root(arm).querySelector(panelClass(arm)) ?? document.querySelector(`[data-arm="${arm.el.id}"]`)

const state = (arm) => {
  const p = panel(arm)
  if (!p) return { found: false }
  const cs = getComputedStyle(p)
  const r = p.getBoundingClientRect()
  const chips = [...p.querySelectorAll('.chip-label')].map((c) => c.textContent.trim())
  // The panel's anchor: tag-input hangs it off the FIELD (field-wide, as it
  // always was); dropdown-table off the "+N more" CHIP itself.
  const field = (arm.kind === 'tag'
    ? root(arm).querySelector('.mono-tag-input-field')
    : root(arm).querySelector('.mono-dropdown-table-more-chip')).getBoundingClientRect()
  const portal = p.closest('[data-mono-popup-portal]')
  return {
    found: true,
    display: cs.display,
    position: cs.position,
    portaled: !!portal && portal.parentElement === document.body,
    portalClassHasOpen: !!portal && portal.classList.contains('more-open'),
    z: cs.zIndex,
    rect: { top: Math.round(r.top), bottom: Math.round(r.bottom), left: Math.round(r.left), height: Math.round(r.height), width: Math.round(r.width) },
    scrollHeight: p.scrollHeight,
    chips,
    fieldTop: Math.round(field.top),
    fieldBottom: Math.round(field.bottom),
    viewportH: window.innerHeight,
    availVar: p.style.getPropertyValue('--mono-popup-avail-h'),
  }
}

window.__more = {
  async tagPanels() {
    for (const arm of Object.values(ARMS)) {
      await arm.el.updateComplete
      root(arm).querySelector(panelClass(arm))?.setAttribute('data-arm', arm.el.id)
    }
    return Object.keys(ARMS)
  },
  async open(id) {
    const arm = ARMS[id]
    const chip = moreChip(arm)
    if (!chip) return { found: false, reason: 'no more chip' }
    press(chip)
    await arm.el.updateComplete
    await sleep(80)
    return state(arm)
  },
  state: (id) => state(ARMS[id]),
  /** Element at the centre of the panel's first chip — a clipped panel yields the card. */
  hitTest(id) {
    const p = panel(ARMS[id])
    const chip = p?.querySelector('.chip-label')
    if (!chip) return null
    const r = chip.getBoundingClientRect()
    const hit = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2)
    return { hitTag: hit?.tagName?.toLowerCase() ?? null, hitIsChip: !!hit && (hit === chip || chip.contains(hit) || hit.contains(chip)), inClip: !!hit?.closest?.('.clip') }
  },
  async removeFirst(id) {
    const arm = ARMS[id]
    const p = panel(arm)
    const x = p?.querySelector('.chip-close')
    if (!x) return { removed: false }
    const before = arm.kind === 'tag' ? arm.el.modelValue.length : (Array.isArray(arm.dd.value) ? arm.dd.value.length : 0)
    press(x)
    await arm.el.updateComplete
    await sleep(80)
    const after = arm.kind === 'tag' ? arm.el.modelValue.length : (Array.isArray(arm.dd.value) ? arm.dd.value.length : 0)
    return { removed: true, before, after, ...state(arm) }
  },
  async clickInside(id) {
    const arm = ARMS[id]
    const p = panel(arm)
    if (!p) return { found: false }
    press(p)
    await sleep(80)
    return state(arm)
  },
  async clickOutside(id) {
    press(document.getElementById('elsewhere'))
    await sleep(80)
    return state(ARMS[id])
  },
  async escape(id) {
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, composed: true }))
    await sleep(80)
    return state(ARMS[id])
  },
}

window.__fixtureReady = true
