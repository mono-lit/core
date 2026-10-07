import '@mono-lit/helper/ui/nav'
import '@mono-lit/helper/ui/shadow/nav'
// the reference surface: the bar's chrome has to track a real card's, not a
// copy of one flavor's numbers
import '@mono-lit/helper/ui/card'

/**
 * `<mono-nav>` after the Basecoat port. Basecoat ships no nav, so what this
 * checks is that the EXTENSION resolves entirely through the Basecoat token
 * layer: an unpainted bar is `--sidebar` on `--sidebar-foreground`, a coloured
 * one is the role on the role's own `-foreground` (the `.btn` pattern), and the
 * density ladder is spacing multiples. None of that is visible to a unit test —
 * it is computed style, and the shadow build keeps half of it behind a boundary.
 */

// The page ships vega + the basecoat palette (see run.mjs), so what is measured
// here is the port's reference look rather than ONE's identity.
document.documentElement.classList.add('theme-vega', 'theme-color-basecoat')

function mk(tag, props = {}) {
  const el = document.createElement(tag)
  el.innerHTML =
    '<span slot="start">Brand</span><span>Center</span>' +
    '<span slot="end">Me</span><span slot="extension">Tabs</span>'
  document.getElementById('app').appendChild(el)
  Object.assign(el, props)
  return el
}

const els = {
  light: mk('mono-nav', { sticky: false }),
  shadow: mk('mono-shadow-nav', { sticky: false }),
  compact: mk('mono-nav', { sticky: false, density: 'compact' }),
  roomy: mk('mono-nav', { sticky: false, density: 'default' }),
  painted: mk('mono-nav', { sticky: false, color: 'danger' }),
  flat: mk('mono-nav', { sticky: false, variant: 'flat' }),
  outlined: mk('mono-nav', { sticky: false, variant: 'outlined' }),
  ext: mk('mono-nav', { sticky: false, extension: true }),
  custom: mk('mono-nav', { sticky: false, color: '#7c3aed' }),
  sticky: mk('mono-nav'),
}

/** The root: the `<header>` the element renders, in either build. */
const rootOf = (el) =>
  (el.shadowRoot ?? el).querySelector('[mono-nav]')

const px = (v) => Math.round(parseFloat(v) || 0)

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
  const inner = root.querySelector('[mono-inner]')
  const start = root.querySelector('[mono-start]')
  const center = root.querySelector('[mono-center]')
  const end = root.querySelector('[mono-end]')
  const ext = root.querySelector('[mono-extension]')
  const cs = getComputedStyle
  return {
    attrs: [...root.attributes]
      .filter((a) => a.name.startsWith('mono-'))
      .map((a) => (a.value ? `${a.name}=${a.value}` : a.name))
      .sort(),
    bar: {
      display: cs(root).display,
      bg: rgba(cs(root).backgroundColor),
      color: rgba(cs(root).color),
      font: px(cs(root).fontSize),
      radius: px(cs(root).borderTopLeftRadius),
      shadow: cs(root).boxShadow === 'none' ? 'none' : 'yes',
      shadowValue: cs(root).boxShadow,
      borderBottomWidth: px(cs(root).borderBottomWidth),
      borderBottomColor: rgba(cs(root).borderBottomColor),
      position: cs(root).position,
      backdrop: cs(root).backdropFilter || cs(root).webkitBackdropFilter,
    },
    inner: {
      display: cs(inner).display,
      height: px(cs(inner).height),
      padX: px(cs(inner).paddingLeft),
      gap: px(cs(inner).columnGap),
      align: cs(inner).alignItems,
    },
    start: { display: cs(start).display, gap: px(cs(start).columnGap) },
    center: { display: cs(center).display, grow: cs(center).flexGrow },
    end: { display: cs(end).display, marginLeft: cs(end).marginLeft, gap: px(cs(end).columnGap) },
    ext: {
      display: cs(ext).display,
      minHeight: px(cs(ext).minHeight),
      padX: px(cs(ext).paddingLeft),
      font: px(cs(ext).fontSize),
      borderTopWidth: px(cs(ext).borderTopWidth),
    },
  }
}

const card = document.createElement('mono-card')
card.innerHTML = '<span slot="title">Card</span><p>Body</p>'
document.getElementById('app').appendChild(card)

/** The card's own chrome, read off the element the flavor actually styles. */
window.__card = () => {
  const root = card.querySelector('[mono-card]') ?? card
  const body = root.querySelector('[mono-body]') ?? root
  const cs = getComputedStyle(root)
  return {
    radius: px(cs.borderTopLeftRadius),
    shadow: cs.boxShadow === 'none' ? 'none' : cs.boxShadow,
    font: px(cs.fontSize),
    padX: px(getComputedStyle(body).paddingLeft),
  }
}

window.__m = (key) => metrics(rootOf(els[key]))
window.__token = (name) => token(name)

window.__ready = true
