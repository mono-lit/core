import '@mono-lit/helper/ui/drawer'
import '@mono-lit/helper/ui/shadow/drawer'

/**
 * `<mono-drawer>` after the Basecoat port. Upstream's drawer is a `bg-popover`
 * sheet pinned to one viewport edge, rounding and bordering ONLY the edge that
 * faces the content, with `p-4` header / section / footer regions and a
 * `bg-black/10 backdrop-blur-xs` scrim. None of that is visible to a unit test:
 * it is computed style — and the panel's paint deliberately lives on a
 * `::before` layer (so the four flavors that float the drawer as an inset card
 * have something to inset), which only a browser can read at all.
 */

// The page ships vega + the basecoat palette (see run.mjs), so what is measured
// here is the port's reference look rather than ONE's identity.
document.documentElement.classList.add('theme-vega', 'theme-color-basecoat')

function mk(tag, props = {}) {
  const el = document.createElement(tag)
  el.title = 'Drawer title'
  const body = document.createElement('div')
  body.textContent = 'Body copy'
  el.appendChild(body)
  const foot = document.createElement('div')
  foot.setAttribute('slot', 'footer')
  foot.innerHTML = '<button>Cancel</button><button>OK</button>'
  el.appendChild(foot)
  document.getElementById('app').appendChild(el)
  Object.assign(el, props)
  return el
}

const els = {
  light: mk('mono-drawer'),
  shadow: mk('mono-shadow-drawer'),
  sized: mk('mono-drawer', { size: 'lg' }),
  left: mk('mono-drawer', { position: 'left' }),
  colored: mk('mono-drawer', { color: 'success' }),
}

/** The root: the `<body>` portal in the light build, an inner div in the shadow one. */
const rootOf = (el) =>
  el.shadowRoot?.querySelector('[mono-drawer]') ??
  [...document.querySelectorAll('[data-mono-drawer-portal]')].find((p) => p.__owner === el) ??
  null

// The light build's portals are anonymous siblings on <body>; tag them as they
// appear so each measurement reads the right one.
const tagPortals = () => {
  const portals = [...document.querySelectorAll('[data-mono-drawer-portal]')]
  const lights = [els.light, els.sized, els.left, els.colored]
  portals.forEach((p, i) => {
    if (!p.__owner) p.__owner = lights[i]
  })
}

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

/** Shadow layers = top-level commas + 1 (commas inside a colour function do not count). */
function shadowLayers(v) {
  if (!v || v === 'none') return 0
  let depth = 0, n = 1
  for (const ch of v) { if (ch === '(') depth++; else if (ch === ')') depth--; else if (ch === ',' && depth === 0) n++ }
  return n
}

/** The first shadow layer (up to the first top-level comma). */
function firstLayer(v) {
  if (!v || v === 'none') return ''
  let depth = 0
  for (let i = 0; i < v.length; i++) {
    const ch = v[i]
    if (ch === '(') depth++
    else if (ch === ')') depth--
    else if (ch === ',' && depth === 0) return v.slice(0, i).trim()
  }
  return v.trim()
}

function metrics(root) {
  const overlay = root.querySelector('[mono-overlay]')
  const panel = root.querySelector('[mono-panel]')
  const head = root.querySelector('[mono-header]')
  const title = root.querySelector('[mono-title]')
  const close = root.querySelector('[mono-close]')
  const body = root.querySelector('[mono-body]')
  const foot = root.querySelector('[mono-footer]')
  const cs = getComputedStyle
  // The panel's PAINT is this layer, not the panel's own box.
  const paint = cs(panel, '::before')
  return {
    attrs: [...root.attributes]
      .filter((a) => a.name.startsWith('mono-'))
      .map((a) => (a.value ? `${a.name}=${a.value}` : a.name))
      .sort(),
    overlay: {
      bg: rgba(cs(overlay).backgroundColor),
      filter: cs(overlay).backdropFilter || cs(overlay).webkitBackdropFilter,
      opacity: Number(cs(overlay).opacity),
    },
    panel: {
      position: cs(panel).position,
      direction: cs(panel).flexDirection,
      padding: px(cs(panel).paddingTop),
      font: px(cs(panel).fontSize),
      // transparent on purpose — every pixel of it comes from ::before
      bg: rgba(cs(panel).backgroundColor),
      width: px(cs(panel).width),
      height: px(cs(panel).height),
      radiusTopLeft: px(cs(panel).borderTopLeftRadius),
      radiusTopRight: px(cs(panel).borderTopRightRadius),
    },
    paint: {
      bg: rgba(paint.backgroundColor),
      inset: [paint.top, paint.right, paint.bottom, paint.left].map(px),
      borderLeft: px(paint.borderLeftWidth),
      borderRight: px(paint.borderRightWidth),
      borderTop: px(paint.borderTopWidth),
      borderBottom: px(paint.borderBottomWidth),
      shadow: paint.boxShadow !== 'none',
      shadowLayers: shadowLayers(paint.boxShadow),
      // the first layer is the glow slot: `0 0 #0000` (nothing) until `color` fills it
      glow: firstLayer(paint.boxShadow),
      borderColor: paint.borderLeftColor,
    },
    head: {
      padding: px(cs(head).paddingTop),
      borderBottom: px(cs(head).borderBottomWidth),
      bg: rgba(cs(head).backgroundColor),
      direction: cs(head).flexDirection,
      justify: cs(head).justifyContent,
      gap: px(cs(head).gap),
    },
    title: {
      font: px(cs(title).fontSize),
      weight: cs(title).fontWeight,
      transform: cs(title).textTransform,
    },
    close: { size: px(cs(close).width), opacity: Number(cs(close).opacity) },
    body: {
      padding: px(cs(body).paddingTop),
      font: px(cs(body).fontSize),
      overflowY: cs(body).overflowY,
      flexGrow: cs(body).flexGrow,
    },
    foot: {
      padding: px(cs(foot).paddingTop),
      borderTop: px(cs(foot).borderTopWidth),
      bg: rgba(cs(foot).backgroundColor),
      direction: cs(foot).flexDirection,
      gap: px(cs(foot).gap),
      marginTop: cs(foot).marginTop,
    },
  }
}

/** Open one drawer and measure it. */
window.__open = async (key) => {
  const el = els[key]
  el.modelValue = true
  await el.updateComplete
  await new Promise((r) => setTimeout(r, 650))
  tagPortals()
  return metrics(rootOf(el))
}

window.__m = (key) => {
  tagPortals()
  return metrics(rootOf(els[key]))
}

window.__ready = true
