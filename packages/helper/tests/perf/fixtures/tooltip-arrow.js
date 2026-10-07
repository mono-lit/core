// Fixture for the tooltip arrow against rounded bubbles.
//
// Every flavor (plus a forced pill, the worst case) × all 12 placements. The
// bubble copies its anchor's `theme-*` classes, so each flavor gets a wrapper.

// `@mono-lit/helper/tooltip` is not a `ui/*` entry, so the harness has no alias for it.
import { controlMonoTooltip } from '../../../dist/tooltip.js'

const FLAVORS = ['one', 'vega', 'luma', 'lyra', 'maia', 'mira', 'nova', 'rhea', 'sera', 'pill']
const PLACEMENTS = ['top', 'bottom', 'left', 'right']
  .flatMap((s) => [s + '-start', s, s + '-end'])

const app = document.getElementById('app')
const anchors = {}
for (const f of FLAVORS) {
  const wrap = document.createElement('div')
  wrap.className = f === 'pill' ? 'theme-mira' : `theme-${f}`
  // pill: see the `tip-pill` class below — the bubble lives on <body>, so a
  // variable set on this wrapper would never reach it
  wrap.style.cssText += ';padding:80px 160px;display:inline-block'
  const btn = document.createElement('button')
  btn.textContent = 'left-end'
  btn.style.cssText = 'padding:6px 14px;border-radius:999px'
  wrap.append(btn)
  app.append(wrap)
  anchors[f] = btn
}

// a radius far past half the bubble's height, so CSS clamps it to a capsule
const pillSheet = document.createElement('style')
pillSheet.textContent = '[mono-tooltip].tip-pill { --mono-tooltip-radius: 9999px; }'
document.head.append(pillSheet)

window.__flavors = FLAVORS
window.__placements = PLACEMENTS

/** Open one tooltip and measure where its arrow meets the bubble edge. */
window.__measure = async (flavor, placement) => {
  const anchor = anchors[flavor]
  anchor.scrollIntoView({ block: 'center', inline: 'center' })
  const tip = controlMonoTooltip(anchor, {
    content: placement, placement, delay: 0, class: flavor === 'pill' ? 'tip-pill' : undefined,
  })
  await tip.show(anchor)
  await new Promise((r) => setTimeout(r, 150))

  const el = [...document.querySelectorAll('[mono-tooltip][data-open]')].pop()
  if (!el) {
    tip.destroy()
    return { error: 'tooltip not open' }
  }
  const arrow = el.querySelector('[mono-tooltip-arrow]')
  const b = el.getBoundingClientRect()
  const a = arrow.getBoundingClientRect()
  const t = anchor.getBoundingClientRect()
  const side = el.getAttribute('data-side')
  const vertical = side === 'left' || side === 'right' // the arrow runs along the y axis

  const cs = getComputedStyle(el)
  const half = Math.min(b.width, b.height) / 2
  const radius = Math.min(half, Math.max(...[
    cs.borderTopLeftRadius, cs.borderTopRightRadius,
    cs.borderBottomRightRadius, cs.borderBottomLeftRadius,
  ].map((v) => parseFloat(v) || 0)))

  const start = vertical ? b.top : b.left
  const end = vertical ? b.bottom : b.right
  const centre = vertical ? a.top + a.height / 2 : a.left + a.width / 2
  // the rotated square's bounding box IS the diamond's extent along the edge
  const halfDiamond = (vertical ? a.height : a.width) / 2
  const straight = end - start - 2 * radius

  const out = {
    side,
    radius: Math.round(radius * 10) / 10,
    // room between the diamond and the start / end of the straight edge (≥ 0 = on it)
    roomStart: Math.round((centre - halfDiamond - (start + radius)) * 10) / 10,
    roomEnd: Math.round((end - radius - (centre + halfDiamond)) * 10) / 10,
    // a capsule too short for the diamond: then it must sit dead centre
    tooShort: straight < halfDiamond * 2,
    offCentre: Math.round(Math.abs(centre - (start + end) / 2) * 10) / 10,
    // still pointing at its trigger
    onTrigger: vertical
      ? centre >= t.top - 0.5 && centre <= t.bottom + 0.5
      : centre >= t.left - 0.5 && centre <= t.right + 0.5,
  }
  tip.destroy()
  await new Promise((r) => setTimeout(r, 30))
  return out
}

window.__ready = true
