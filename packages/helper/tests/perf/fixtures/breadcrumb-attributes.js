import '@mono-lit/helper/ui/breadcrumb'
import '@mono-lit/helper/ui/shadow/breadcrumb'

/**
 * `<mono-breadcrumb>` after the Basecoat port. Upstream's breadcrumb is muted
 * text with bare links — no padding, no chip, and a current crumb that is
 * `font-normal text-foreground`, not bold and not branded. The pre-port sheet
 * padded every segment and reached for `--theme-*` and a parallel set of
 * `--*-rgb` triples; none of that survives, so these are the assertions that
 * would catch it coming back. Computed style only a browser can read, and the
 * shadow build keeps half of it behind a boundary.
 */

// The page ships vega + the basecoat palette (see run.mjs), so what is measured
// here is the port's reference look rather than ONE's identity.
document.documentElement.classList.add('theme-vega', 'theme-color-basecoat')

// Pointer parks at (0, 0), which without this lands on the FIRST breadcrumb's
// first link — and measures it hovered (the accent) instead of at rest.
document.getElementById('app').style.padding = '40px'

const ITEMS = [
  { id: 'home', title: 'Home', href: '#' },
  { id: 'docs', title: 'Docs', href: '#', badge: 3, badgeColor: 'info' },
  { id: 'now', title: 'Now' },
]

function mk(tag, props = {}) {
  const el = document.createElement(tag)
  document.getElementById('app').appendChild(el)
  el.items = ITEMS
  Object.assign(el, props)
  return el
}

const els = {
  light: mk('mono-breadcrumb'),
  shadow: mk('mono-shadow-breadcrumb'),
  sized: mk('mono-breadcrumb', { size: 'lg' }),
  contained: mk('mono-breadcrumb', { variant: 'contained', color: 'success' }),
  underlined: mk('mono-breadcrumb', { variant: 'underlined' }),
  surface: mk('mono-breadcrumb', { color: 'surface' }),
  truncated: mk('mono-breadcrumb', { truncate: true }),
}

const rootOf = (el) => (el.shadowRoot ?? el).querySelector('[mono-breadcrumb]')

const px = (v) => Math.round((parseFloat(v) || 0) * 100) / 100

const _canvas = document.createElement('canvas')
_canvas.width = _canvas.height = 1
const _ctx = _canvas.getContext('2d', { willReadFrequently: true })
/** Any CSS colour → real sRGB `[r, g, b, a]` (tokens compute to `oklch()`). */
const rgba = (value) => {
  _ctx.clearRect(0, 0, 1, 1)
  _ctx.fillStyle = '#ff00ff'
  _ctx.fillStyle = value
  _ctx.fillRect(0, 0, 1, 1)
  const d = _ctx.getImageData(0, 0, 1, 1).data
  return [d[0], d[1], d[2], Math.round((d[3] / 255) * 100) / 100]
}

/** What `--x` computes to on the document root, painted so oklch() resolves. */
const token = (name) => rgba(getComputedStyle(document.documentElement).getPropertyValue(name))

function metrics(root) {
  const cs = getComputedStyle
  const list = root.querySelector('[mono-list]')
  const items = [...root.querySelectorAll('[mono-item]')]
  const first = items[0]
  const current = items[items.length - 1]
  const firstAction = first.querySelector('[mono-action]')
  const currentAction = current.querySelector('[mono-action]')
  const sep = root.querySelector('[mono-separator]')
  const badge = root.querySelector('[mono-badge]')
  const title = root.querySelector('[mono-title]')
  return {
    attrs: [...root.attributes]
      .filter((a) => a.name.startsWith('mono-'))
      .map((a) => (a.value ? `${a.name}=${a.value}` : a.name))
      .sort(),
    list: {
      display: cs(list).display,
      wrap: cs(list).flexWrap,
      gap: px(cs(list).columnGap),
      padLeft: px(cs(list).paddingLeft),
      margin: cs(list).margin,
      listStyle: cs(list).listStyleType,
      font: px(cs(list).fontSize),
      color: rgba(cs(list).color),
    },
    item: { display: cs(first).display, gap: px(cs(first).columnGap) },
    action: {
      tag: firstAction.tagName,
      display: cs(firstAction).display,
      padX: px(cs(firstAction).paddingLeft),
      padY: px(cs(firstAction).paddingTop),
      radius: px(cs(firstAction).borderTopLeftRadius),
      bg: rgba(cs(firstAction).backgroundColor),
      color: rgba(cs(firstAction).color),
      rawColor: cs(firstAction).color,
      weight: cs(firstAction).fontWeight,
      decoration: cs(firstAction).textDecorationLine,
    },
    current: {
      tag: currentAction.tagName,
      color: rgba(cs(currentAction).color),
      weight: cs(currentAction).fontWeight,
      bg: rgba(cs(currentAction).backgroundColor),
      cursor: cs(currentAction).cursor,
    },
    sep: { display: cs(sep).display, font: px(cs(sep).fontSize), color: rgba(cs(sep).color) },
    badge: badge && {
      value: badge.getAttribute('mono-badge'),
      height: px(cs(badge).height),
      radius: px(cs(badge).borderTopLeftRadius),
      font: px(cs(badge).fontSize),
      bg: rgba(cs(badge).backgroundColor),
      color: rgba(cs(badge).color),
    },
    title: { overflow: cs(title).overflow, maxWidth: cs(title).maxWidth },
  }
}

window.__m = (key) => metrics(rootOf(els[key]))
window.__token = (name) => token(name)

// The action carries a colour transition, and the light build renders its DOM
// a tick later than the shadow one — measured at frame 0 its link is still
// interpolating away from the UA link colour (112,112,112 instead of 115).
requestAnimationFrame(() => setTimeout(() => (window.__ready = true), 400))
