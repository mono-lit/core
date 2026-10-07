// `rounded` — one corner prop across button, chip and card.
//
// It replaced FOUR overlapping mechanisms on button alone: `shape` (whose
// `square` default emitted a class with no rule behind it, so it could never
// square anything), the `round` and `circle` booleans, and `fab`. The first three
// forced their radius with `!important`, which is why the fix had to start by
// giving button the `--mono-button-radius` resolver every sibling component
// already had — a plain new class would have lost to them.
//
// What is guarded here is mostly the cascade, because that is where this can go
// wrong silently: a step must beat the per-size radius, `none` must beat it too
// (it is the one genuinely new capability), a consumer's own var must still beat
// the step, and none of it may need `!important` to do so.

import '@mono-lit/helper/ui/button'
import '@mono-lit/helper/ui/shadow/button'
import '@mono-lit/helper/ui/chip'
import '@mono-lit/helper/ui/card'
import '@mono-lit/helper/ui/button-dropdown'

const STEPS = ['none', 'xs', 'sm', 'md', 'lg', 'xl', 'xxl', 'full']
const SIZES = ['xs', 'sm', 'md', 'lg', 'xl', 'xxl']

/**
 * What each step should resolve to, read off the live theme rather than
 * hardcoded. The steps sit on Basecoat's radius ladder: xs = radius-sm
 * (`--radius` − 4px), sm = radius-md (− 2px), md = radius-lg (= `--radius`),
 * lg = radius-xl (+ 4px), xl = 2xl (1rem), xxl = 4xl (2rem). The ± steps are
 * `calc()` custom properties, so they are evaluated here from `--radius`.
 */
/** Resolve a custom property to px by MEASURING it (it may be a calc() under vega
 *  or a literal under ONE, the default flavor). */
const measure = (name) => {
  const probe = document.createElement('div')
  probe.style.cssText = `position:absolute;visibility:hidden;width:var(${name})`
  document.body.appendChild(probe)
  const px = probe.getBoundingClientRect().width
  probe.remove()
  return `${px}px`
}
const tokenFor = (step) => {
  if (step === 'none') return '0px'
  if (step === 'full') return '9999px'
  return measure(`--mono-radius-${{ xs: 'sm', sm: 'md', md: 'lg', lg: 'xl', xl: '2xl', xxl: '4xl' }[step]}`)
}
window.__measure = measure

const host = document.getElementById('app')

const add = (html) => {
  const wrap = document.createElement('div')
  wrap.innerHTML = html
  host.appendChild(wrap)
  return wrap
}

// ── the arms ──────────────────────────────────────────────────────────────────

// Every step, on a default-size button.
for (const step of STEPS) {
  add(`<mono-button id="step-${step}" rounded="${step}">${step}</mono-button>`)
}
add('<mono-button id="step-unset">unset</mono-button>')

// `none` against every size — the per-size radius is what it has to beat, and it
// differs at every step, so one size would not prove it.
for (const size of SIZES) {
  add(`<mono-button id="none-${size}" size="${size}" rounded="none">x</mono-button>`)
  add(`<mono-button id="bare-${size}" size="${size}">x</mono-button>`)
}

// A consumer's own var must still win — it sits outside the preset in the chain.
add('<mono-button id="consumer" rounded="full" style="--mono-button-radius: 3px">x</mono-button>')

// The FAB recipe, in a colour the old `fab` could never take.
add(
  '<mono-button id="fab" width="56" height="56" rounded="full" icon-only color="danger" variant="outline">+</mono-button>',
)

// Affix corners follow the same resolver.
add(
  '<mono-button id="affix" rounded="xxl"><span slot="prepend">A</span>Body<span slot="append">B</span></mono-button>',
)

// Chip and card share the scale.
add('<mono-chip id="chip-unset" color="primary" variant="soft">chip</mono-chip>')
add('<mono-chip id="chip-none" color="primary" variant="soft" rounded="none">chip</mono-chip>')
add('<mono-chip id="chip-lg" color="primary" variant="soft" rounded="lg">chip</mono-chip>')
add('<mono-card id="card-unset">card</mono-card>')
add('<mono-card id="card-none" rounded="none">card</mono-card>')
add('<mono-card id="card-full" rounded="full">card</mono-card>')

// The dropdown has two button surfaces and they take `rounded` by different
// routes: the `⋮` TRIGGER via the element's own shorthand (alongside `color` /
// `variant` / `size`), and each ENTRY as an ordinary `ButtonProps`. The trigger
// only renders when `collapsed`, so testing one arm would miss the other.
// `buttons` is a property, not an attribute, and the trigger only appears once
// the list is longer than `min` — so both arms are built in JS.
{
  // Appended BEFORE the properties are set. `buttons` is declared
  // `noAccessor: true`, so the class owns its setter — assigning to an element
  // that has not upgraded yet creates a plain own-property that shadows it, and
  // the dropdown renders empty.
  const trig = document.createElement('mono-button-dropdown')
  trig.id = 'dd-trigger'
  trig.setAttribute('rounded', 'full')
  host.appendChild(trig)
  trig.min = 0
  trig.buttons = [{ label: 'One' }, { label: 'Two' }]

  const entry = document.createElement('mono-button-dropdown')
  entry.id = 'dd-entry'
  host.appendChild(entry)
  entry.min = 99 // never collapses, so the entries render inline as real buttons
  entry.buttons = [{ label: 'One', rounded: 'full' }]
}

// ── probes ────────────────────────────────────────────────────────────────────

const ctrlOf = (id) => {
  const el = document.getElementById(id)
  if (!el) return null
  return (
    el.querySelector('.mono-button > button, .mono-button > a, .mono-button-icon > button, .mono-button-icon > a') ??
    el.querySelector('.mono-chip > span, .mono-chip > a') ??
    el.querySelector('.mono-card') ??
    el
  )
}

const radiusOf = (id) => {
  const ctrl = ctrlOf(id)
  return ctrl ? getComputedStyle(ctrl).borderTopLeftRadius : null
}

window.__expected = () => Object.fromEntries(STEPS.map((s) => [s, tokenFor(s)]))

window.__steps = () => Object.fromEntries(STEPS.map((s) => [s, radiusOf(`step-${s}`)]))

window.__unset = () => radiusOf('step-unset')

/** `none` vs the per-size radius it has to beat, at every size. */
window.__noneVsSize = () =>
  Object.fromEntries(
    SIZES.map((size) => [size, { none: radiusOf(`none-${size}`), bare: radiusOf(`bare-${size}`) }]),
  )

window.__consumerWins = () => radiusOf('consumer')

/**
 * No `!important` anywhere in the rounded scale.
 *
 * This is what makes a consumer's `--mono-button-radius` able to win at all — the
 * old `pill` / `round` / `circle` rules used `!important`, and reintroducing it
 * here would quietly break that override while every radius assertion still
 * passed.
 */
window.__noImportant = () => {
  let bad = []
  for (const sheet of document.styleSheets) {
    let rules
    try {
      rules = sheet.cssRules
    } catch {
      continue
    }
    for (const rule of rules) {
      if (!rule.selectorText || !/\brounded-/.test(rule.selectorText)) continue
      const text = rule.style.cssText || ''
      if (text.includes('!important')) bad.push(rule.selectorText)
    }
  }
  return bad
}

window.__fab = () => {
  const el = document.getElementById('fab')
  const ctrl = ctrlOf('fab')
  const hr = el.getBoundingClientRect()
  const cr = ctrl.getBoundingClientRect()
  const cs = getComputedStyle(ctrl)
  return {
    hostW: Math.round(hr.width),
    hostH: Math.round(hr.height),
    square: Math.round(cr.width) === Math.round(cr.height),
    circle: parseFloat(cs.borderTopLeftRadius) >= cr.height / 2,
    // The thing the old `fab` could not do: be any colour but its fixed gradient.
    background: cs.backgroundColor,
    borderColor: cs.borderTopColor,
  }
}

window.__affix = () => {
  const el = document.getElementById('affix')
  const pre = el.querySelector('.button-prepend')
  const app = el.querySelector('.button-append')
  if (!pre || !app) return null
  const p = getComputedStyle(pre)
  const a = getComputedStyle(app)
  return {
    preOuter: p.borderTopLeftRadius,
    preInner: p.borderTopRightRadius,
    appOuter: a.borderTopRightRadius,
    appInner: a.borderTopLeftRadius,
  }
}

window.__chip = () => ({
  unset: radiusOf('chip-unset'),
  none: radiusOf('chip-none'),
  lg: radiusOf('chip-lg'),
})

window.__card = () => ({
  unset: radiusOf('card-unset'),
  none: radiusOf('card-none'),
  full: radiusOf('card-full'),
})

window.__dropdown = () => {
  const trig = document
    .getElementById('dd-trigger')
    ?.querySelector('.mono-button-dropdown-trigger button, .mono-button-dropdown-trigger a')
  const entry = document
    .getElementById('dd-entry')
    ?.querySelector('mono-button .mono-button > button, mono-button .mono-button > a')
  return {
    trigger: trig ? getComputedStyle(trig).borderTopLeftRadius : null,
    entry: entry ? getComputedStyle(entry).borderTopLeftRadius : null,
  }
}

/** Nothing anywhere should still emit the removed classes. */
window.__removedClasses = () => {
  const found = []
  for (const cls of ['fab', 'pill', 'round', 'circle', 'square', 'soft']) {
    if (document.querySelector(`.mono-button.${cls}, .mono-button-icon.${cls}, .mono-chip.${cls}, .mono-card.${cls}`)) {
      found.push(cls)
    }
  }
  return found
}

// ── light vs shadow, on identical markup ─────────────────────────────────────
//
// The docs derive their Shadow tab from the Vue source by rewriting the tag, so
// the two builds are fed exactly the same markup and any divergence is a bug.
// Two were hiding here, both invisible to a DOM-shape assertion:
//
//   · a slotted `<svg>` kept its authored width/height, because
//     `.button-icon > svg` cannot reach content that lives in the light tree and
//     is only ASSIGNED into a `<slot>`. Icons came out 22px and 26px where the
//     light build made every one 16px.
//   · a page-level `* { box-sizing: border-box }` reset does not cross a shadow
//     boundary, so an explicit width/height gained the border on top. `<button>`
//     is border-box in the UA sheet, so ONLY the `<a>` form showed it — 42px
//     against 40.
const ICON_MARKUP = (tag) =>
  `<${tag} id="par-${tag}" icon-only size="md" color="info" rounded="full" href="https://example.com">` +
  '<svg slot="icon" width="22" height="22" viewBox="0 0 24 24">' +
  '<path fill="currentColor" d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6z" /></svg>' +
  `</${tag}>`

add(ICON_MARKUP('mono-button'))
add(ICON_MARKUP('mono-shadow-button'))

window.__parity = () => {
  const read = (tag) => {
    const host = document.getElementById(`par-${tag}`)
    if (!host) return null
    const root = host.shadowRoot ?? host
    const ctrl = root.querySelector('button, a')
    if (!ctrl) return null
    // The icon is light-DOM in both builds — slotted in shadow, re-placed in light.
    const svg = host.querySelector('svg') ?? root.querySelector('svg')
    const cs = getComputedStyle(ctrl)
    const r = ctrl.getBoundingClientRect()
    const sr = svg ? svg.getBoundingClientRect() : null
    return {
      tag: ctrl.tagName.toLowerCase(),
      box: cs.boxSizing,
      w: Math.round(r.width),
      h: Math.round(r.height),
      radius: cs.borderTopLeftRadius,
      icon: sr ? `${Math.round(sr.width)}x${Math.round(sr.height)}` : 'none',
    }
  }
  return { light: read('mono-button'), shadow: read('mono-shadow-button') }
}

window.__ready = true
