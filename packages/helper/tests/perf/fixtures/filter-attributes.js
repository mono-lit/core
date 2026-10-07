import '@mono-lit/helper/ui/filter'
import '@mono-lit/helper/ui/shadow/filter'
import '@mono-lit/helper/ui/input'
import '@mono-lit/helper/ui/button'
import { controlMonoFilterBuilder } from '@mono-lit/helper'

/**
 * `<mono-filter-builder>` after the Basecoat port. The builder is an EXTENSION
 * whose controls borrow `.field > select` / `.input`, whose Apply is `.btn` and
 * whose Clear is `.btn[data-variant='outline']` — and it reaches those shapes
 * through the input's, select's and button's PUBLIC knobs, so a flavour that
 * retunes a field retunes the builder. These measure that claim: a control here
 * has the same corner and height as a real `<mono-input>` beside it, Apply is
 * inked `text-primary-foreground` on `bg-primary`, nothing reads a `--theme-*`
 * bridge, and the shadow build paints the same numbers.
 */

document.documentElement.classList.add('theme-vega', 'theme-color-basecoat')
// the pointer parks at (0,0); keep the first control out from under it
document.getElementById('app').style.padding = '40px'

const FIELDS = [
  { field: 'Nama', caption: 'Display Name', dataType: 'string' },
  { field: 'Jumlah', caption: 'Payment', dataType: 'number' },
]
const TREE = [['Nama', 'contains', 'Andy'], 'and', [['Jumlah', '>', 100], 'or', ['Jumlah', '=', 1]]]

function mk(tag, props = {}) {
  const el = document.createElement(tag)
  document.getElementById('app').appendChild(el)
  el.controlFilterBuilder = controlMonoFilterBuilder({ fields: FIELDS, filter: TREE })
  Object.assign(el, props)
  return el
}
const light = mk('mono-filter-builder')
const shadow = mk('mono-shadow-filter-builder')
const xs = mk('mono-filter-builder', { size: 'xs' })
// the reference field the builder's control has to match
const ref = document.createElement('mono-input')
ref.size = 'sm'
document.getElementById('app').appendChild(ref)

const px = (v) => Math.round(parseFloat(v) * 100) / 100
const rootOf = (el) => (el.shadowRoot ?? el).querySelector('[mono-filter-builder]')

window.__token = (name) => getComputedStyle(document.documentElement).getPropertyValue(name).trim()

window.__m = (which) => {
  const host = which === 'shadow' ? shadow : which === 'xs' ? xs : light
  const root = rootOf(host)
  const ctl = root.querySelector('select[mono-filter-control][mono-filter-field]')
  const apply = root.querySelector('[mono-filter-btn]:not([mono-variant])')
  const clear = root.querySelector('[mono-filter-btn][mono-variant="ghost"]')
  const link = root.querySelector('[mono-filter-link]')
  const icon = root.querySelector('[mono-filter-icon-btn]')
  const nested = root.querySelector('[mono-filter-children] [mono-filter-group]')
  const g = (n, p) => getComputedStyle(n)[p]
  return {
    attrs: [...root.attributes].map((a) => a.name).filter((a) => a.startsWith('mono-')),
    ctl: { h: px(g(ctl, 'height')), radius: px(g(ctl, 'borderTopLeftRadius')), border: g(ctl, 'borderTopColor'), bg: g(ctl, 'backgroundColor'), font: px(g(ctl, 'fontSize')) },
    apply: { bg: g(apply, 'backgroundColor'), ink: g(apply, 'color'), h: px(g(apply, 'height')), radius: px(g(apply, 'borderTopLeftRadius')) },
    clear: { bg: g(clear, 'backgroundColor'), border: g(clear, 'borderTopColor'), ink: g(clear, 'color') },
    link: { ink: g(link, 'color'), bg: g(link, 'backgroundColor') },
    icon: { w: px(g(icon, 'width')), ink: g(icon, 'color') },
    nested: { guide: g(nested, 'borderLeftStyle') + ' ' + g(nested, 'borderLeftColor'), indent: px(g(nested, 'paddingLeft')) },
  }
}
window.__ref = () => {
  const native = ref.querySelector('[mono-native]')
  const field = ref.querySelector('[mono-field]') ?? native
  return { h: px(getComputedStyle(field).height), radius: px(getComputedStyle(field).borderTopLeftRadius) }
}
// every custom property the light root resolves, so a `--theme-*` read shows
window.__reads = () => {
  const out = []
  for (const sheet of document.styleSheets) {
    let rules; try { rules = sheet.cssRules } catch { continue }
    for (const r of rules) if (r.selectorText && /mono-filter/.test(r.selectorText) && /--theme-/.test(r.cssText)) out.push(r.selectorText)
  }
  return out
}

requestAnimationFrame(() => requestAnimationFrame(() => setTimeout(() => { window.__ready = true }, 400)))
