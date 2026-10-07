import '@mono-lit/helper/ui/modal'
import '@mono-lit/helper/ui/shadow/modal'

/**
 * `<mono-modal>` after the Basecoat port. Upstream's dialog is ONE padded box —
 * the panel carries `p-6` and `gap-6`, and header / section / footer are
 * unpadded, unbordered, untinted regions inside it — over a `bg-black/10
 * backdrop-blur-xs` scrim. None of that is visible to a unit test: it is
 * computed style, and the shadow build keeps half of it behind a boundary.
 */

// The page ships vega + the basecoat palette (see run.mjs), so what is measured
// here is the port's reference look rather than ONE's identity.
document.documentElement.classList.add('theme-vega', 'theme-color-basecoat')

function mk(tag, props = {}) {
  const el = document.createElement(tag)
  el.title = 'Modal title'
  const body = document.createElement('div')
  body.textContent = 'Body copy'
  el.appendChild(body)
  const foot = document.createElement('div')
  foot.setAttribute('slot', 'foot')
  foot.innerHTML = '<button>Cancel</button><button>OK</button>'
  el.appendChild(foot)
  document.getElementById('app').appendChild(el)
  Object.assign(el, props)
  return el
}

const els = {
  light: mk('mono-modal'),
  shadow: mk('mono-shadow-modal'),
  sized: mk('mono-modal', { size: 'lg' }),
  colored: mk('mono-modal', { color: 'success' }),
}

/** The root: the `<body>` portal in the light build, an inner div in the shadow one. */
const rootOf = (el) =>
  el.shadowRoot?.querySelector('[mono-modal]') ??
  [...document.querySelectorAll('[data-mono-modal-portal]')].find((p) => p.__owner === el) ??
  null

// The light build's portals are anonymous siblings on <body>; tag them as they
// appear so each measurement reads the right one.
const tagPortals = () => {
  const portals = [...document.querySelectorAll('[data-mono-modal-portal]')]
  const lights = [els.light, els.sized, els.colored]
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

function metrics(root) {
  const overlay = root.querySelector('[mono-overlay]')
  const panel = root.querySelector('[mono-panel]')
  const head = root.querySelector('[mono-header]')
  const title = root.querySelector('[mono-title]')
  const close = root.querySelector('[mono-close]')
  const body = root.querySelector('[mono-body]')
  const foot = root.querySelector('[mono-footer]')
  const cs = getComputedStyle
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
      padding: px(cs(panel).paddingTop),
      gap: px(cs(panel).rowGap),
      radius: px(cs(panel).borderTopLeftRadius),
      bg: rgba(cs(panel).backgroundColor),
      font: px(cs(panel).fontSize),
      shadow: cs(panel).boxShadow,
      shadowLayers: shadowLayers(cs(panel).boxShadow),
      width: px(cs(panel).width),
      direction: cs(panel).flexDirection,
    },
    head: {
      padding: px(cs(head).paddingTop),
      borderBottom: px(cs(head).borderBottomWidth),
      bg: rgba(cs(head).backgroundColor),
      direction: cs(head).flexDirection,
      gap: px(cs(head).gap),
    },
    title: { font: px(cs(title).fontSize), weight: cs(title).fontWeight },
    close: { size: px(cs(close).width), opacity: Number(cs(close).opacity) },
    body: { padding: px(cs(body).paddingTop), font: px(cs(body).fontSize) },
    foot: {
      padding: px(cs(foot).paddingTop),
      borderTop: px(cs(foot).borderTopWidth),
      bg: rgba(cs(foot).backgroundColor),
      direction: cs(foot).flexDirection,
      justify: cs(foot).justifyContent,
      gap: px(cs(foot).gap),
    },
  }
}

/** Open one modal and measure it. */
window.__open = async (key) => {
  const el = els[key]
  el.modelValue = true
  await el.updateComplete
  await new Promise((r) => setTimeout(r, 350))
  tagPortals()
  return metrics(rootOf(el))
}

window.__m = (key) => {
  tagPortals()
  return metrics(rootOf(els[key]))
}

window.__ready = true
