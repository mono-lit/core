import '@mono-lit/helper/ui/rich-text-editor'
import '@mono-lit/helper/ui/shadow/rich-text-editor'
import '@mono-lit/helper/ui/textarea'

/**
 * `<mono-rich-text-editor>` after the Basecoat port. The chrome is the ported
 * textarea's `.field` and reaches it through the textarea's PUBLIC knobs, so a
 * flavour that retunes the textarea retunes this frame; SunEditor's own tokens
 * are remapped onto the Basecoat tokens and delivered from the page sheet onto
 * the light-DOM mount. These measure that claim: the root attributes, the frame's
 * corner / edge / surface against a real `<mono-textarea>` beside it, the label
 * and message type, the editor's active colour and toolbar band, a dropdown's
 * popover corner, and the shadow build painting the same numbers.
 */

document.documentElement.classList.add('theme-vega', 'theme-color-basecoat')
document.getElementById('app').style.padding = '24px'
document.getElementById('app').style.width = '640px'

function mk(tag, props = {}) {
  const el = document.createElement(tag)
  document.getElementById('app').appendChild(el)
  Object.assign(el, { toolbar: 'basic', minHeight: '5rem', ...props })
  return el
}
const light = mk('mono-rich-text-editor', { label: 'Body', helperText: 'hint', modelValue: '<p>Hello</p>', toolbar: 'standard' })
const shadow = mk('mono-shadow-rich-text-editor', { label: 'Body', helperText: 'hint', modelValue: '<p>Hello</p>', toolbar: 'standard' })
const sized = mk('mono-rich-text-editor', { size: 'lg', color: 'danger', variant: 'filled', errorMessage: 'Bad', required: true, label: 'L' })
const under = mk('mono-rich-text-editor', { variant: 'underlined', label: 'U' })
// the reference field the frame has to match
const ref = document.createElement('mono-textarea')
ref.label = 'Ref'
document.getElementById('app').appendChild(ref)

const px = (v) => Math.round(parseFloat(v) * 100) / 100
const rootOf = (el) => (el.shadowRoot ?? el).querySelector('[mono-rich-text-editor]')
const g = (n, p) => (n ? getComputedStyle(n)[p] : null)

window.__token = (name) => getComputedStyle(document.documentElement).getPropertyValue(name).trim()
window.__ready = false
window.__m = (which) => {
  const host = which === 'shadow' ? shadow : which === 'sized' ? sized : which === 'under' ? under : light
  const root = rootOf(host)
  const field = root.querySelector('[mono-rte-field]')
  const label = root.querySelector('[mono-rte-label]')
  const msg = root.querySelector('[mono-rte-message]')
  // the editor lives in the light DOM of the host, whichever build
  const sun = host.querySelector('.sun-editor')
  const toolbar = host.querySelector('.se-toolbar')
  const probe = document.createElement('span')
  if (sun) {
    sun.appendChild(probe)
    probe.style.color = 'var(--se-active-color)'
    probe.style.backgroundColor = 'var(--se-main-background-color)'
    probe.style.borderRadius = 'var(--se-border-radius-lg)'
    probe.style.fontSize = 'var(--se-main-font-size)'
  }
  const out = {
    attrs: [...root.attributes].map((a) => a.name).filter((a) => a.startsWith('mono-')).sort(),
    field: { radius: px(g(field, 'borderTopLeftRadius')), border: g(field, 'borderBottomColor'), side: g(field, 'borderTopColor'), bg: g(field, 'backgroundColor'), shadow: g(field, 'boxShadow')?.slice(0, 60), bw: g(field, 'borderBottomWidth') },
    label: { font: px(g(label, 'fontSize')), weight: g(label, 'fontWeight'), ink: g(label, 'color') },
    msg: msg ? { font: px(g(msg, 'fontSize')), ink: g(msg, 'color'), state: msg.getAttribute('mono-rte-message'), role: msg.getAttribute('role') } : null,
    mount: !!host.querySelector('[mono-rte-mount]'),
    sun: sun ? { active: g(probe, 'color'), bg: g(probe, 'backgroundColor'), popoverRadius: px(g(probe, 'borderTopLeftRadius')), font: px(g(probe, 'fontSize')), border: g(sun, 'borderTopWidth') } : null,
    toolbar: toolbar ? { bg: g(toolbar, 'backgroundColor') } : null,
    // the Size input's placeholder, and the empty editing area's
    placeholder: (() => { const i = host.querySelector('.se-toolbar [data-command="fontSize"] input'); const p = host.querySelector('.se-wrapper .se-placeholder'); return { input: i ? getComputedStyle(i, '::placeholder').color : null, inputOpacity: i ? getComputedStyle(i, '::placeholder').opacity : null, area: p ? g(p, 'color') : null } })(),
  }
  probe.remove()
  return out
}
window.__ref = () => {
  const native = ref.querySelector('[mono-native]')
  const pp = document.createElement('div')
  pp.style.cssText = 'position:absolute;width:0;height:0;border-radius:var(--mono-select-dropdown-radius, var(--mono-radius-md))'
  document.getElementById('app').appendChild(pp)
  const out = {
    radius: px(g(native, 'borderTopLeftRadius')),
    border: g(native, 'borderBottomColor'),
    bg: g(native, 'backgroundColor'),
    shadow: g(native, 'boxShadow')?.slice(0, 60),
    labelFont: px(g(ref.querySelector('[mono-label]'), 'fontSize')),
    popoverRadius: px(g(pp, 'borderTopLeftRadius')),
  }
  pp.remove()
  return out
}
// the bold button's centre on the page, to hover it; the tooltip it shows
const centre = (el) => { const r = el.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 } }
window.__editablePoint = (which) => {
  const host = which === 'shadow' ? shadow : light
  const r = host.querySelector('.sun-editor-editable').getBoundingClientRect()
  return { x: r.left + 30, y: r.top + 16 }
}
window.__buttonPoint = (which, command = 'bold') => {
  const host = which === 'shadow' ? shadow : light
  const b = host.querySelector(`.se-toolbar [data-command="${command}"]`) ?? host.querySelector('.se-toolbar button')
  const r = b.getBoundingClientRect()
  return { x: r.left + r.width / 2, y: r.top + r.height / 2 }
}
window.__tooltip = (which) => {
  const host = which === 'shadow' ? shadow : light
  const b = host.querySelector('.se-toolbar [data-command="bold"]') ?? host.querySelector('.se-toolbar button')
  const tip = b.closest('.se-tooltip') ?? b
  const inner = tip.querySelector('.se-tooltip-inner')
  const text = tip.querySelector('.se-tooltip-text')
  const pp = document.createElement('div')
  pp.style.cssText = 'position:absolute;width:0;height:0;border-radius:var(--mono-tooltip-radius, var(--mono-radius-md))'
  document.getElementById('app').appendChild(pp)
  const out = {
    shown: !!inner && getComputedStyle(inner).opacity === '1' && getComputedStyle(inner).visibility === 'visible',
    bg: g(text, 'backgroundColor'),
    ink: g(text, 'color'),
    radius: px(g(text, 'borderTopLeftRadius')),
    font: px(g(text, 'fontSize')),
    arrow: g(text, 'borderBottomColor'),
    expectRadius: px(g(pp, 'borderTopLeftRadius')),
    text: text?.textContent?.trim().slice(0, 20),
  }
  pp.remove()
  return out
}
// the dropdown layers live in SunEditor's carrier on <body>; the open one's first swatch
const visible = (el) => el.getClientRects().length > 0 && getComputedStyle(el).display !== 'none'
window.__swatchPoint = () => {
  const sw = [...document.querySelectorAll('.sun-editor-carrier-wrapper .se-list-layer [data-tooltip]')].find(visible)
  return sw ? centre(sw) : null
}
window.__titles = (which) => {
  const host = which === 'shadow' ? shadow : light
  const carriers = [...document.querySelectorAll('.sun-editor-carrier-wrapper')]
  const hovered = [...document.querySelectorAll('.sun-editor-carrier-wrapper .se-list-layer [data-tooltip]')].find((e) => e.matches(':hover'))
  const after = hovered ? getComputedStyle(hovered, '::after') : null
  return {
    titles: host.querySelectorAll('[title]').length + carriers.reduce((n, c) => n + c.querySelectorAll('[title]').length, 0),
    tooltips: carriers.reduce((n, c) => n + c.querySelectorAll('.se-list-layer [data-tooltip]').length, 0),
    labels: carriers.reduce((n, c) => n + c.querySelectorAll('.se-list-layer [aria-label]').length, 0),
    swatch: after ? { content: after.content, bg: after.backgroundColor, ink: after.color, radius: px(after.borderTopLeftRadius), font: px(after.fontSize), family: after.fontFamily, opacity: after.opacity } : null,
    pageFont: getComputedStyle(document.body).fontFamily,
  }
}
// a dropdown list in the carrier, forced open (its ancestors are display:none
// until SunEditor opens it) with one item checked; hands back an item to hover
window.__openList = () => {
  const layer = document.querySelector('.sun-editor-carrier-wrapper .se-list-layer.se-list-font-size')
  if (!layer) return null
  for (let n = layer; n && !n.classList.contains('sun-editor-carrier-wrapper'); n = n.parentElement) { n.style.display = 'block'; n.style.visibility = 'visible' }
  Object.assign(layer.style, { position: 'fixed', left: '300px', top: '300px', zIndex: 9999 })
  const lis = [...layer.querySelectorAll('li')]
  lis[1].classList.add('se-checked')
  return centre(lis[4].querySelector('button'))
}
window.__list = () => {
  const layer = document.querySelector('.sun-editor-carrier-wrapper .se-list-layer.se-list-font-size')
  const hovered = [...layer.querySelectorAll('button')].find((b) => b.matches(':hover'))
  const checked = layer.querySelector('li.se-checked > button')
  const paint = (n) => (n ? { bg: g(n, 'backgroundColor'), ink: g(n, 'color') } : null)
  return { layer: { bg: g(layer, 'backgroundColor'), radius: px(g(layer, 'borderTopLeftRadius')) }, hovered: paint(hovered), checked: paint(checked) }
}
// the link dialog, once opened (a real click on the toolbar's link button)
window.__modal = () => {
  const carrier = [...document.querySelectorAll('.sun-editor-carrier-wrapper')].find((c) => c.querySelector('.se-modal-content') && getComputedStyle(c.querySelector('.se-modal-content')).display !== 'none')
  const content = carrier?.querySelector('.se-modal-content')
  if (!content) return null
  const input = content.querySelector('.se-input-form')
  const submit = content.querySelector('.se-btn-primary')
  const refNative = ref.querySelector('[mono-native]')
  const paint = (n, extra = {}) => (n ? { bg: g(n, 'backgroundColor'), border: g(n, 'borderBottomColor'), radius: px(g(n, 'borderTopLeftRadius')), ink: g(n, 'color'), ...extra } : null)
  return { content: paint(content, { shadow: g(content, 'boxShadow')?.slice(0, 40) }), input: paint(input), refInput: paint(refNative), submit: paint(submit) }
}
// SunEditor autofocuses the first field; blur it so the edge is measured at REST
// (a focused field wears the ring colour, and the edge transitions back)
window.__modalBlur = () => { document.querySelector('.sun-editor-carrier-wrapper .se-modal-content .se-input-form')?.blur() }
window.__codeView = async () => {
  light.codeView()
  await new Promise((r) => setTimeout(r, 300))
  const viewer = light.querySelector('.se-code-viewer')
  const line = light.querySelector('.se-code-view-line')
  const out = viewer ? { bg: g(viewer, 'backgroundColor'), ink: g(viewer, 'color'), font: g(viewer, 'fontFamily').slice(0, 24), lineBg: line ? g(line, 'backgroundColor') : null, fieldBg: g(light.querySelector('[mono-rte-field]'), 'backgroundColor') } : null
  light.codeView()
  return out
}
// full screen: the editor takes the page surface, opaque, and the mount is marked
window.__fullScreen = async (which) => {
  const host = which === 'shadow' ? shadow : light
  host.fullScreen(true)
  await new Promise((r) => setTimeout(r, 300))
  const sun = host.querySelector('.sun-editor')
  const wys = host.querySelector('.sun-editor-editable')
  const out = { marked: host.querySelector('[mono-rte-mount]').hasAttribute('mono-fullscreen'), position: g(sun, 'position'), bg: g(sun, 'backgroundColor'), wysBg: g(wys, 'backgroundColor'), toolbarBg: g(host.querySelector('.se-toolbar'), 'backgroundColor') }
  host.fullScreen(false)
  await new Promise((r) => setTimeout(r, 300))
  out.after = { marked: host.querySelector('[mono-rte-mount]').hasAttribute('mono-fullscreen'), position: g(sun, 'position'), bg: g(sun, 'backgroundColor') }
  return out
}
window.__tablePicker = () => {
  const layer = document.querySelector('.sun-editor-carrier-wrapper .se-selector-table')
  if (!layer) return null
  const un = layer.querySelector('.se-table-size-unhighlighted')
  const hi = layer.querySelector('.se-table-size-highlighted')
  return { un: un ? g(un, 'backgroundColor') : null, hi: hi ? g(hi, 'backgroundColor') : null }
}
// every rule of this sheet that resolves a --theme-* bridge
window.__reads = () => {
  const out = []
  for (const sheet of document.styleSheets) {
    let rules; try { rules = sheet.cssRules } catch { continue }
    for (const r of rules) if (r.selectorText && !/:has\(/.test(r.selectorText) && /(^|,\s*)(\[mono-rich-text-editor\]|:where\(\[mono-rich-text-editor\]\)|\[mono-rte-|mono-(shadow-)?rich-text-editor\b|\.sun-editor\.sun-editor-carrier)/.test(r.selectorText) && /--theme-/.test(r.cssText)) out.push(r.selectorText)
  }
  return out
}

// the editors mount once the optional peer resolves
const wait = () => {
  const ok = [light, shadow, sized, under].every((el) => el.querySelector('.sun-editor'))
  if (ok) { setTimeout(() => { window.__ready = true }, 300); return }
  setTimeout(wait, 100)
}
wait()
