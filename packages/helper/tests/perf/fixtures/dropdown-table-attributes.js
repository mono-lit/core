import '@mono-lit/helper/ui/dropdown-table'
import '@mono-lit/helper/ui/shadow/dropdown-table'
import '@mono-lit/helper/ui/table'
import '@mono-lit/helper/ui/tag-input'
import { controlMonoDataDropdown } from '@mono-lit/helper'

/**
 * `<mono-dropdown-table>` after the Basecoat port. The field IS the tag-input's
 * chip box (`.combobox-chips` + `.combobox-chip`) and the panel IS its popover
 * holding a ported `<table mono-table>` — and it reaches those shapes through
 * the tag-input's PUBLIC knobs, so a flavour that retunes the tag-input retunes
 * this field. These measure that claim: the trigger has the same height, corner
 * and edge as a real `<mono-tag-input>` beside it, a chip is the same box as a
 * tag chip, the panel is `bg-popover`, a picked row is the table's `--muted`
 * selected row, nothing reads a `--theme-*` bridge, and the shadow build paints
 * the same numbers.
 */

document.documentElement.classList.add('theme-vega', 'theme-color-basecoat')
// the pointer parks at (0,0); keep the first control out from under it
document.getElementById('app').style.padding = '40px'
document.getElementById('app').style.display = 'grid'
document.getElementById('app').style.gap = '24px'
document.getElementById('app').style.width = '420px'

const PEOPLE = [
  { Id: 1, Name: 'Ada Lovelace', Role: 'Analyst' },
  { Id: 2, Name: 'Alan Turing', Role: 'Engineer' },
  { Id: 3, Name: 'Grace Hopper', Role: 'Admiral' },
]
const TABLE = `<table mono-table><thead><tr><th>Name</th><th>Role</th></tr></thead><tbody>${PEOPLE.map(
  (p) => `<tr data-row-key="${p.Id}"><td>${p.Name}</td><td>${p.Role}</td></tr>`,
).join('')}</tbody></table>`

function mk(tag, props = {}, opts = {}) {
  const el = document.createElement(tag)
  el.innerHTML = TABLE
  document.getElementById('app').appendChild(el)
  const dd = controlMonoDataDropdown(PEOPLE, { keyExpr: 'Id', displayExpr: 'Name', pageSize: 10, multiple: true, ...opts })
  el.dataDropdown = dd
  Object.assign(el, props)
  dd.setValue([2, 3])
  el.__dd = dd
  return el
}
const light = mk('mono-dropdown-table', { clearable: true })
const shadow = mk('mono-shadow-dropdown-table', { clearable: true })
const xs = mk('mono-dropdown-table', { size: 'xs', clearable: true })
const single = mk('mono-dropdown-table', { placeholder: 'Pick' }, { multiple: false })
// the reference field the trigger has to match
const ref = document.createElement('mono-tag-input')
ref.items = PEOPLE.map((p) => ({ value: p.Id, label: p.Name }))
ref.keyValue = 'value'
ref.displayValue = 'label'
ref.modelValue = [2, 3]
document.getElementById('app').appendChild(ref)

const px = (v) => Math.round(parseFloat(v) * 100) / 100
const rootOf = (el) => (el.shadowRoot ?? el).querySelector('[mono-dropdown-table]')
const g = (n, p) => getComputedStyle(n)[p]

window.__token = (name) => getComputedStyle(document.documentElement).getPropertyValue(name).trim()

window.__m = (which) => {
  const host = which === 'shadow' ? shadow : which === 'xs' ? xs : which === 'single' ? single : light
  const root = rootOf(host)
  const trigger = root.querySelector('[mono-dd-trigger]')
  const chip = root.querySelector('[mono-dd-chip] > [mono-dd-chip-main]')
  const clear = root.querySelector('[mono-dd-clear]')
  const value = root.querySelector('[mono-dd-value]')
  return {
    attrs: [...root.attributes].map((a) => a.name).filter((a) => a.startsWith('mono-')).sort(),
    trigger: { h: px(g(trigger, 'height')), radius: px(g(trigger, 'borderTopLeftRadius')), border: g(trigger, 'borderBottomColor'), bg: g(trigger, 'backgroundColor'), padX: px(g(trigger, 'paddingLeft')), font: px(g(trigger, 'fontSize')) },
    chip: chip ? { h: px(g(chip, 'height')), radius: px(g(chip, 'borderTopLeftRadius')), bg: g(chip, 'backgroundColor'), ink: g(chip, 'color'), font: px(g(chip, 'fontSize')) } : null,
    clear: clear ? { w: px(g(clear, 'width')), ink: g(clear, 'color') } : null,
    valueInset: px(g(value, 'paddingLeft')),
  }
}
window.__ref = () => {
  const field = ref.querySelector('[mono-field]')
  const chip = ref.querySelector('[mono-chip] > [mono-chip-main]')
  if (!field || !chip) return { error: 'reference tag-input did not render: field=' + !!field + ' chip=' + !!chip, html: ref.innerHTML.slice(0, 300) }
  return {
    trigger: { h: px(g(field, 'height')), radius: px(g(field, 'borderTopLeftRadius')), border: g(field, 'borderBottomColor') },
    chip: { h: px(g(chip, 'height')), radius: px(g(chip, 'borderTopLeftRadius')), bg: g(chip, 'backgroundColor') },
  }
}
// open the light field and measure its portaled panel + rows
window.__open = async () => {
  light.open()
  await new Promise((r) => setTimeout(r, 300))
  const portal = document.querySelector('[data-mono-popup-portal][mono-dropdown-table]')
  const panel = portal?.querySelector('[mono-dd-panel]')
  const rows = [...(panel?.querySelectorAll('[mono-table] tbody tr[data-row-key]') ?? [])]
  const picked = rows.find((r) => r.hasAttribute('mono-selected'))
  const plain = rows.find((r) => !r.hasAttribute('mono-selected') && !r.hasAttribute('mono-dd-active'))
  const out = {
    portalMirrors: !!portal && portal.hasAttribute('mono-open'),
    panel: panel ? { display: g(panel, 'display'), bg: g(panel, 'backgroundColor'), radius: px(g(panel, 'borderTopLeftRadius')), position: g(panel, 'position') } : null,
    rows: rows.length,
    picked: picked ? { bg: g(picked, 'backgroundColor'), attrs: [...picked.attributes].map((a) => a.name).filter((a) => a.startsWith('mono-')).sort() } : null,
    plain: plain ? { bg: g(plain, 'backgroundColor'), cursor: g(plain, 'cursor') } : null,
  }
  light.close()
  return out
}
// every rule of this sheet that resolves a `--theme-*` bridge
window.__reads = () => {
  const out = []
  for (const sheet of document.styleSheets) {
    let rules; try { rules = sheet.cssRules } catch { continue }
    // this sheet's rules only: the table's seamless-editor rule names <mono-dropdown-table> inside a cell and repoints --theme-* there on purpose
    for (const r of rules) if (r.selectorText && !/:has\(/.test(r.selectorText) && /(^|,\s*)(\[mono-dropdown-table\]|mono-(shadow-)?dropdown-table\b)/.test(r.selectorText) && /--theme-/.test(r.cssText)) out.push(r.selectorText)
  }
  return out
}

requestAnimationFrame(() => requestAnimationFrame(() => setTimeout(() => { window.__ready = true }, 500)))
