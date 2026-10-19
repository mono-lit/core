// Fixture for the form controls' `tooltip` prop: every control, light and shadow,
// with a label + required mark + tooltip — and a disabled input, whose label
// switches `pointer-events` off.

import '@mono-lit/helper/ui/input'
import '@mono-lit/helper/ui/date'
import '@mono-lit/helper/ui/textarea'
import '@mono-lit/helper/ui/select'
import '@mono-lit/helper/ui/tag-input'
import '@mono-lit/helper/ui/dropdown-table'
import '@mono-lit/helper/ui/shadow/input'
import '@mono-lit/helper/ui/shadow/select'
import '@mono-lit/helper/ui/shadow/textarea'

const CASES = [
  ['mono-input', {}],
  ['mono-date', {}],
  ['mono-textarea', {}],
  ['mono-select', {}],
  ['mono-tag-input', {}],
  ['mono-dropdown-table', {}],
  ['mono-shadow-input', {}],
  ['mono-shadow-select', {}],
  ['mono-shadow-textarea', {}],
  ['mono-input', { disabled: true, id: 'disabled-input' }],
]

const app = document.getElementById('app')
app.className = 'wrap'
app.style.maxWidth = '420px'
const els = []
for (const [tag, extra] of CASES) {
  const el = document.createElement(tag)
  const { id, ...props } = extra
  if (id) el.id = id
  Object.assign(el, { label: 'Field label', required: true, tooltip: { content: `Tip for ${tag}`, delay: 0 }, ...props })
  app.append(el)
  els.push(el)
}

window.__cases = CASES.map(([tag, extra], i) => ({ i, tag, disabled: !!extra.disabled }))

const rootOf = (el) => el.shadowRoot ?? el
const iconOf = (el) => rootOf(el).querySelector('[mono-label] > [mono-label-tooltip], [mono-dd-label] > [mono-label-tooltip]')

/** Where the icon sits relative to the rest of its label row. */
window.__measure = (i) => {
  const el = els[i]
  const icon = iconOf(el)
  if (!icon) return { error: 'no icon' }
  const label = icon.parentElement
  const r = icon.getBoundingClientRect()
  const l = label.getBoundingClientRect()
  const prev = icon.previousElementSibling?.getBoundingClientRect()
  const glyph = icon.firstElementChild
  const g = glyph.getBoundingClientRect()
  const cs = getComputedStyle(glyph)
  const cx = r.left + r.width / 2
  const cy = r.top + r.height / 2
  // the topmost element at the icon's centre must be the icon (or its glyph) — a
  // disabled label's `pointer-events: none` would make it the field underneath
  let hit = document.elementFromPoint(cx, cy)
  while (hit?.shadowRoot) {
    const inner = hit.shadowRoot.elementFromPoint(cx, cy)
    if (!inner || inner === hit) break
    hit = inner
  }
  return {
    afterPrev: prev ? r.left >= prev.right - 0.5 : false,
    centred: Math.abs(cy - (l.top + l.height / 2)) <= 1.5,
    glyphSize: [Math.round(g.width), Math.round(g.height)],
    painted: glyph.tagName === 'svg' || (cs.maskImage || cs.webkitMaskImage || 'none') !== 'none',
    hitIsIcon: !!hit && (hit === icon || icon.contains(hit)),
    cx,
    cy,
  }
}

window.__native = (i) => rootOf(els[i]).querySelector('input, textarea, [mono-native], [role="combobox"]')
window.__activeIsNative = (i) => {
  const native = window.__native(i)
  let a = document.activeElement
  while (a?.shadowRoot?.activeElement) a = a.shadowRoot.activeElement
  return !!native && a === native
}

setTimeout(() => {
  window.__ready = true
}, 300)
