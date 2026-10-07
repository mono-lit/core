import '@mono-lit/helper/ui/button-dropdown'

/**
 * `<mono-button-dropdown>` writes its Basecoat styling attributes on the INNER
 * root and flattens each menu row through the button's public custom
 * properties. Both are browser-only: the attributes come from a ref callback,
 * the entries are real elements built with `document.createElement`, and the
 * flattening can only be observed through `getComputedStyle`.
 */
const ENTRIES = [
  { label: 'Approve', icon: 'i-mdi-check', color: 'success' },
  { label: 'Print', icon: 'i-mdi-printer' },
  { label: 'Void', icon: 'i-mdi-close-octagon', color: 'danger' },
]

function mk(id, props = {}) {
  const d = document.createElement('mono-button-dropdown')
  d.id = id
  document.getElementById('app').appendChild(d)
  Object.assign(d, { buttons: ENTRIES, min: 1, ...props })
  return d
}

mk('plain')
mk('props', { size: 'lg', color: 'success', variant: 'outline', placement: 'top-start' })
mk('inline', { min: 5 })
mk('states', { disabled: true })

const root = (el) => el.querySelector('[mono-button-dropdown]')

/**
 * Any CSS colour → real sRGB `[r, g, b, a]`.
 *
 * `getComputedStyle` hands back whatever colour space the value was authored in
 * — a token colour comes out `oklch(…)`, a `color-mix` comes out `oklab(…)` —
 * so string comparison (and any naive rgb() parse) is useless. Painting the
 * value gives the bytes the user actually sees.
 */
const _canvas = document.createElement('canvas')
_canvas.width = _canvas.height = 1
const _ctx = _canvas.getContext('2d', { willReadFrequently: true })
function px(color) {
  _ctx.clearRect(0, 0, 1, 1)
  // a sentinel first: an unparseable value leaves fillStyle untouched, and we
  // want that to show up as an obvious colour rather than the previous read
  _ctx.fillStyle = '#ff00ff'
  _ctx.fillStyle = color
  _ctx.fillRect(0, 0, 1, 1)
  const d = _ctx.getImageData(0, 0, 1, 1).data
  return [d[0], d[1], d[2], Math.round((d[3] / 255) * 100) / 100]
}

/** Every `mono-*` attribute on a root, plus the parts it rendered. */
window.__attrs = async (id) => {
  const el = document.getElementById(id)
  await el.updateComplete
  await new Promise((r) => requestAnimationFrame(r))
  const r = root(el)
  const panel = r?.querySelector('[mono-panel]')
  return {
    attrs: [...(r?.attributes ?? [])]
      .filter((a) => a.name.startsWith('mono-'))
      .map((a) => (a.value ? `${a.name}=${a.value}` : a.name))
      .sort(),
    hasRow: !!r?.querySelector(':scope > [mono-row]'),
    hasTrigger: !!r?.querySelector(':scope > [mono-trigger]'),
    hasPanel: !!panel,
    hasList: !!panel?.querySelector('[mono-list]'),
    itemColors: [...(panel?.querySelectorAll('[mono-item]') ?? [])].map((li) =>
      li.getAttribute('mono-item-color'),
    ),
    ariaHidden: panel?.getAttribute('aria-hidden') ?? null,
    legacyClass: r?.classList.contains('mono-button-dropdown') ?? false,
    legacyItemClass: !!panel?.querySelector('.mono-bd-c-danger'),
    offset: el.offset,
  }
}

/** Open one menu and measure what a row actually paints. */
window.__rows = async (id) => {
  const el = document.getElementById(id)
  // Capture BEFORE opening: the panel is moved into a body portal on first open.
  window.__panels ??= {}
  window.__panels[id] ??= root(el).querySelector('[mono-panel]')
  el.modelValue = true
  await el.updateComplete
  await new Promise((r) => setTimeout(r, 250))
  const panel = window.__panels[id]
  const read = (li) => {
    const control = li.querySelector('button, a')
    const cs = getComputedStyle(control)
    return {
      color: li.getAttribute('mono-item-color'),
      bg: px(cs.backgroundColor),
      borderColor: px(cs.borderTopColor),
      boxShadow: cs.boxShadow,
      radius: cs.borderTopLeftRadius,
      justify: cs.justifyContent,
      // The strip fills the row: the control's border box is the <li>'s content
      // box, so the only slack is the wrapper's own 1px transparent border.
      slack: li.getBoundingClientRect().width - control.getBoundingClientRect().width,
    }
  }
  return {
    panelBg: px(getComputedStyle(panel).backgroundColor),
    panelPadding: getComputedStyle(panel).paddingTop,
    panelShadow: getComputedStyle(panel).boxShadow,
    rows: [...panel.querySelectorAll('[mono-item]')].map(read),
  }
}

/**
 * One row's painted colours, read on demand — the spec calls this AFTER driving
 * a real pointer over the row with Playwright, which is the only way to observe
 * `:hover` (it cannot be forced from script).
 */
window.__measure = (id, color) => {
  const panel = window.__panels[id]
  const li = color
    ? panel.querySelector(`[mono-item][mono-item-color="${color}"]`)
    : panel.querySelector('[mono-item]:not([mono-item-color])')
  const control = li.querySelector('button, a')
  const icon = li.querySelector('.mono-icon')
  return {
    // The wash is an ALPHA colour (`bg-x/10`), so what the eye compares is the
    // wash composited over the panel — not the raw declared colour.
    surface: px(getComputedStyle(panel).backgroundColor),
    bg: px(getComputedStyle(control).backgroundColor),
    ink: px(getComputedStyle(control).color),
    // the glyph is a mask painted with `background-color: currentColor`
    iconInk: icon ? px(getComputedStyle(icon).backgroundColor) : null,
  }
}

/** Where to aim the pointer for `__measure` — a selector Playwright can hover. */
window.__rowSelector = (id, color) => {
  const panel = window.__panels[id]
  panel.setAttribute('data-probe', id)
  return color
    ? `[data-probe="${id}"] [mono-item][mono-item-color="${color}"] button`
    : `[data-probe="${id}"] [mono-item]:not([mono-item-color]) button`
}

window.__ready = true
