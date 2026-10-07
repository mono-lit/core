import '@mono-lit/helper/ui/tabs'
import '@mono-lit/helper/ui/shadow/tabs'

/**
 * `<mono-tabs>` after the Basecoat port. The strip IS upstream's
 * `[role='tablist']`: the pill variant is its default (`bg-muted rounded-lg
 * p-[3px] h-9`, selected `bg-background shadow-sm`) and `underline` is its
 * `[data-variant='line']` (bare strip, selected revealed through the `::after`
 * bar). None of that is visible to a unit test — it is computed style, and half
 * of it lives behind a shadow boundary or in a pseudo-element.
 */

// The page ships vega + the basecoat palette (see run.mjs), so what is measured
// here is the port's reference look rather than ONE's identity.
document.documentElement.classList.add('theme-vega', 'theme-color-basecoat')

const ITEMS = [
  { id: 'a', label: 'Overview' },
  { id: 'b', label: 'Details' },
  { id: 'c', label: 'History' },
]

function mk(tag, props = {}) {
  const el = document.createElement(tag)
  el.items = ITEMS
  el.modelValue = 'a'
  for (const [k, v] of Object.entries(props)) el[k] = v
  document.getElementById('app').appendChild(el)
  return el
}

const els = {
  'light-underline': mk('mono-tabs'),
  'light-pill': mk('mono-tabs', { variant: 'pill' }),
  'light-ghost': mk('mono-tabs', { variant: 'ghost' }),
  'light-vertical': mk('mono-tabs', { orientation: 'vertical' }),
  'shadow-underline': mk('mono-shadow-tabs'),
  'shadow-pill': mk('mono-shadow-tabs', { variant: 'pill' }),
}

// the hand-written twin of the pill strip, in raw attribute markup
const raw = document.createElement('div')
raw.id = 'raw'
raw.innerHTML = `
  <div mono-tabs mono-variant="pill" role="tablist" aria-orientation="horizontal">
    ${ITEMS.map(
      (i, n) => `<button mono-tab type="button" role="tab" aria-selected="${n === 0}">
        <span mono-label>${i.label}</span>
      </button>`,
    ).join('')}
  </div>`
document.getElementById('app').appendChild(raw)

const rootOf = (el) =>
  el.shadowRoot?.querySelector('[mono-tabs]') ?? el.querySelector('[mono-tabs]')

const px = (v) => Math.round(parseFloat(v) || 0)

/**
 * Any CSS colour → real sRGB `[r, g, b, a]`.
 *
 * `getComputedStyle` hands back whatever colour space the value was authored in
 * — a token ink comes out `oklch(…)` and a `color-mix` `oklab(…)` — so an
 * `rgb()` parse sees nothing at all. Painting the value gives the bytes.
 */
const _canvas = document.createElement('canvas')
_canvas.width = _canvas.height = 1
const _ctx = _canvas.getContext('2d', { willReadFrequently: true })
const rgba = (value) => {
  _ctx.clearRect(0, 0, 1, 1)
  _ctx.fillStyle = '#ff00ff'
  _ctx.fillStyle = value
  _ctx.fillRect(0, 0, 1, 1)
  const d = _ctx.getImageData(0, 0, 1, 1).data
  return [d[0], d[1], d[2], Math.round((d[3] / 255) * 100) / 100]
}

function metrics(root) {
  const tabs = [...root.querySelectorAll('[mono-tab]')]
  const selected = tabs.find((t) => t.getAttribute('aria-selected') === 'true') ?? tabs[0]
  const other = tabs.find((t) => t !== selected)
  const cs = getComputedStyle
  const bar = cs(selected, '::after')
  return {
    attrs: [...root.attributes]
      .filter((a) => a.name.startsWith('mono-') || a.name === 'aria-orientation')
      .map((a) => (a.value ? `${a.name}=${a.value}` : a.name))
      .sort(),
    strip: {
      display: cs(root).display,
      direction: cs(root).flexDirection,
      height: px(cs(root).height),
      padding: px(cs(root).paddingTop),
      radius: px(cs(root).borderTopLeftRadius),
      bg: rgba(cs(root).backgroundColor),
      gap: px(cs(root).gap),
    },
    tab: {
      padding: [px(cs(selected).paddingTop), px(cs(selected).paddingLeft)],
      radius: px(cs(selected).borderTopLeftRadius),
      font: px(cs(selected).fontSize),
      weight: cs(selected).fontWeight,
      gap: px(cs(selected).gap),
      justify: cs(selected).justifyContent,
      width: px(cs(selected).width),
    },
    selected: {
      bg: rgba(cs(selected).backgroundColor),
      shadow: cs(selected).boxShadow,
      barOpacity: Number(bar.opacity),
      barHeight: px(bar.height),
      barBottom: bar.bottom,
    },
    idle: {
      bg: rgba(cs(other).backgroundColor),
      barOpacity: Number(cs(other, '::after').opacity),
      ink: rgba(cs(other).color),
    },
  }
}

window.__m = (key) => metrics(rootOf(els[key]))
window.__raw = () => metrics(raw.querySelector('[mono-tabs]'))

/** Move the selection and report that the bar followed. */
window.__select = async (key, id) => {
  const el = els[key]
  el.select(id)
  await el.updateComplete
  await new Promise((r) => setTimeout(r, 250))
  const root = rootOf(el)
  return [...root.querySelectorAll('[mono-tab]')].map((t) => ({
    selected: t.getAttribute('aria-selected'),
    barOpacity: Number(getComputedStyle(t, '::after').opacity),
  }))
}

window.__ready = true
