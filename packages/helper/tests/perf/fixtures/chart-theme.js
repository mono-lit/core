import '@mono-lit/helper/ui/chart'
import '@mono-lit/helper/ui/shadow/chart'
import { controlMonoChart } from '@mono-lit/helper'

/**
 * `<mono-chart>` after the Basecoat port. A canvas resolves no `var()`, so the
 * element reads chart.css's resolvers off its own box and hands Chart.js real
 * values. These measure that bridge: the default palette IS `--chart-1…5`,
 * the legend/title ink is `--foreground`, the ticks `--muted-foreground`, the
 * grid `--border`, the tooltip a `--popover`, the font the page's own sans at
 * text-xs, a slice hairline the page surface; a role name resolves to its
 * token; flipping `.dark` on <html> (nothing fires `theme-changed`) repaints
 * with the dark tokens; and the shadow build paints the same values.
 */

document.documentElement.classList.add('theme-color-basecoat')
document.getElementById('app').style.padding = '24px'
document.getElementById('app').style.width = '640px'

const rows = [
  { m: 'Jan', a: 3, b: 2, c: 1, d: 4, e: 2, f: 1 },
  { m: 'Feb', a: 4, b: 3, c: 2, d: 1, e: 3, f: 2 },
  { m: 'Mar', a: 2, b: 4, c: 3, d: 2, e: 1, f: 3 },
]
const series = ['a', 'b', 'c', 'd', 'e', 'f'].map((f) => ({ field: f, label: f.toUpperCase() }))

function mk(tag, props = {}, opts = {}) {
  const el = document.createElement(tag)
  document.getElementById('app').appendChild(el)
  el.controlChart = controlMonoChart(rows, { labelField: 'm', series, ...opts })
  Object.assign(el, { height: 200, ...props })
  return el
}
const bar = mk('mono-chart-bar', { title: 'Six series' })
const shadow = mk('mono-shadow-chart', { type: 'bar', title: 'Six series' })
const pie = mk('mono-chart-pie', {}, { series: [{ field: 'a', label: 'A' }] })
const roles = mk('mono-chart-bar', { colors: 'success,danger,primary' })
// the bar corner: the flavour's field corner by default, and pinned by the knob
const square = mk('mono-chart-bar', {})
square.style.setProperty('--mono-chart-bar-radius', '0px')
// what the flavour's popover IS on this page — the select panel's chain
const popoverProbe = document.createElement('div')
popoverProbe.style.cssText = 'position:absolute;width:0;height:0;border-radius:var(--mono-select-dropdown-radius, var(--mono-radius-md));box-shadow:var(--mono-select-dropdown-ring, 0 0 0 1px color-mix(in oklab, var(--foreground) 10%, transparent)), var(--mono-select-dropdown-shadow, var(--mono-shadow-md))'
document.getElementById('app').appendChild(popoverProbe)
// what the field corner IS on this page, in px
const probe = document.createElement('div')
probe.style.cssText = 'position:absolute;width:0;height:0;border-radius:var(--mono-input-outline-radius, var(--mono-input-radius, var(--mono-radius-md)))'
document.getElementById('app').appendChild(probe)

// the tokens as the CHART sees them — read off its own box, the scope chart.css resolves in
const scopeOf = (el) => (el.shadowRoot ?? el).querySelector(".mono-chart")
const tok = (name) => getComputedStyle(scopeOf(bar)).getPropertyValue(name).trim()
const tokOn = (node, name) => getComputedStyle(node).getPropertyValue(name).trim()
// Chart.js keeps the colour strings it was handed, so compare STRINGS to the tokens
const norm = (v) => (typeof v === 'string' ? v.replace(/\s+/g, ' ').trim() : v)

window.__token = tok
window.__ready = false
window.__m = (which) => {
  const el = which === 'shadow' ? shadow : which === 'pie' ? pie : which === 'roles' ? roles : which === 'square' ? square : bar
  const chart = el.chart
  if (!chart) return { error: 'no chart instance on ' + which }
  const o = chart.options
  const ds = chart.data.datasets
  return {
    palette: ds.map((d) => (Array.isArray(d.backgroundColor) ? d.backgroundColor.map(norm) : norm(d.backgroundColor))),
    sliceBorder: Array.isArray(ds[0].backgroundColor) ? norm(ds[0].borderColor) : null,
    legendInk: norm(o.plugins.legend.labels.color),
    titleInk: o.plugins.title.display ? norm(o.plugins.title.color) : null,
    tickInk: o.scales?.x ? norm(o.scales.x.ticks.color) : null,
    gridInk: o.scales?.x ? norm(o.scales.x.grid.color) : null,
    tooltip: { bg: norm(o.plugins.tooltip.backgroundColor), ink: norm(o.plugins.tooltip.bodyColor), border: norm(o.plugins.tooltip.borderColor), radius: o.plugins.tooltip.cornerRadius },
    font: { family: o.font?.family, size: o.font?.size },
    barRadius: o.elements?.bar?.borderRadius ?? null,
    fieldRadius: Math.round(parseFloat(getComputedStyle(probe).borderTopLeftRadius) * 100) / 100,
    pageFont: getComputedStyle(document.body).fontFamily,
    // where --chart-1 is declared along the way, for the report
    chain: { html: tokOn(document.documentElement, "--chart-1"), body: tokOn(document.body, "--chart-1"), app: tokOn(document.getElementById("app"), "--chart-1"), box: tokOn(scopeOf(el), "--chart-1") },
  }
}
// the first bar's centre on the page, to hover it
window.__barPoint = () => {
  const meta = bar.chart.getDatasetMeta(0).data[0]
  const r = bar.querySelector('canvas').getBoundingClientRect()
  return { x: r.left + meta.x, y: r.top + meta.y + (meta.height ? meta.height / 2 : 4) }
}
window.__tooltip = () => {
  const el = bar.querySelector('.mono-chart-tooltip')
  const cs = getComputedStyle(el)
  const pp = getComputedStyle(popoverProbe)
  return {
    open: el.hasAttribute('data-open'),
    display: cs.display,
    opacity: cs.opacity,
    bg: cs.backgroundColor,
    ink: cs.color,
    radius: cs.borderTopLeftRadius,
    shadow: cs.boxShadow,
    popover: { bg: tok('--popover'), ink: tok('--popover-foreground'), radius: pp.borderTopLeftRadius, shadow: pp.boxShadow },
    title: el.querySelector('.mono-chart-tooltip-title')?.textContent ?? null,
    rows: [...el.querySelectorAll('.mono-chart-tooltip-row')].map((r) => ({ label: r.querySelector('.mono-chart-tooltip-label')?.textContent, value: r.querySelector('.mono-chart-tooltip-value')?.textContent, swatch: r.querySelector('.mono-chart-tooltip-swatch')?.style.background })),
    inside: (() => { const a = el.getBoundingClientRect(), b = bar.querySelector('.mono-chart-canvas-wrap').getBoundingClientRect(); return a.left >= b.left - 1 && a.right <= b.right + 1 })(),
  }
}
window.__flip = async (dark) => {
  document.documentElement.classList.toggle('dark', dark)
  await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(() => setTimeout(r, 200))))
  return window.__m('bar')
}

// the charts mount once the optional peer resolves
const wait = () => {
  if (bar.chart && shadow.chart && pie.chart && roles.chart && square.chart) { window.__ready = true; return }
  setTimeout(wait, 100)
}
wait()
