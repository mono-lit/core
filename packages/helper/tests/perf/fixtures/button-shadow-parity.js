// Light vs shadow, on identical markup.
//
// The bug this exists for: the light build omits an empty prepend/append span
// (`_renderAffix` returns `nothing`), while the shadow build always renders it —
// its `<slot>` has to stay in the tree for `assignedNodes()` to see anything — and
// marks it `data-empty`. `:has()` matches on PRESENCE, and `display: none` does
// not undo that, so `.mono-button:has(> .button-prepend)` fired on every shadow
// button and squared both corners plus dropped both side borders. Nine of ten
// button demos rendered differently in the two tabs, and `.mono-button-icon`
// escaped only because those rules never named it.
//
// Two arms, because they fail differently:
//   · the AFFIX MATRIX pins the mechanism — and `both` is a control that must
//     keep agreeing, or a "fix" has merely inverted the bug;
//   · the DEMO SWEEP is the breadth check, rendering each demo's real markup.

import '@mono-lit/helper/ui/button'
import '@mono-lit/helper/ui/shadow/button'

const host = document.getElementById('app')

const add = (html) => {
  const wrap = document.createElement('div')
  wrap.innerHTML = html
  host.appendChild(wrap)
  return wrap
}

// ── arm 1: the affix matrix ───────────────────────────────────────────────────

const AFFIX_CASES = [
  ['plain', ''],
  ['prepend-only', '<span slot="prepend">A</span>'],
  ['append-only', '<span slot="append">B</span>'],
  ['both', '<span slot="prepend">A</span><span slot="append">B</span>'],
]

for (const [key, inner] of AFFIX_CASES) {
  for (const tag of ['mono-button', 'mono-shadow-button']) {
    add(`<${tag} data-affix="${key}" data-build="${tag}">Body${inner}</${tag}>`)
  }
}

// ── arm 2: the demo sweep ─────────────────────────────────────────────────────
//
// The markup below is lifted from `docs/demos/button/vue/*.vue` (repo root),
// reduced to what renders without Vue. Kept here rather than read off disk so the
// spec has no build-order dependency on the docs — the trade is that a new demo
// does not appear automatically, which the count assertion makes visible.
const DEMOS = {
  size: ['xs', 'sm', 'md', 'lg', 'xl', 'xxl'].map((s) => `size="${s}"`),
  variant: ['solid', 'outline', 'tonal', 'text'].map((v) => `variant="${v}"`),
  color: ['primary', 'secondary', 'success', 'danger', 'warning'].map((c) => `color="${c}"`),
  rounded: ['none', 'xs', 'sm', 'md', 'lg', 'xl', 'xxl', 'full'].map((r) => `rounded="${r}"`),
  state: ['disabled', 'loading', ''],
  type: ['type="button"', 'type="submit"', 'type="reset"'],
  link: ['href="https://example.com"', 'href="#" target="_blank"'],
  badge: ['badge="3"', 'badge="9" badge-color="green"'],
  dimensions: ['width="200"', 'height="48"', 'width="120" height="48"'],
  'icon-only': [
    'icon-only size="sm"',
    'icon-only size="md" rounded="full"',
    'icon-only width="56" height="56" rounded="full"',
  ],
}

for (const [demo, variants] of Object.entries(DEMOS)) {
  variants.forEach((attrs, i) => {
    for (const tag of ['mono-button', 'mono-shadow-button']) {
      add(`<${tag} data-demo="${demo}" data-i="${i}" data-build="${tag}" ${attrs}>Label</${tag}>`)
    }
  })
}

// ── probes ────────────────────────────────────────────────────────────────────

/** The painted facts, from whichever tree the build put them in. */
const readOne = (el) => {
  const root = el.shadowRoot ?? el
  const wrap = root.querySelector('.mono-button, .mono-button-icon')
  const ctrl = wrap ? wrap.querySelector(':scope > button, :scope > a') : null
  if (!ctrl) return 'MISSING'
  const cs = getComputedStyle(ctrl)
  const r = ctrl.getBoundingClientRect()
  return [
    cs.borderTopLeftRadius,
    cs.borderTopRightRadius,
    cs.borderBottomRightRadius,
    cs.borderBottomLeftRadius,
    cs.borderLeftWidth,
    cs.borderRightWidth,
    Math.round(r.width) + 'x' + Math.round(r.height),
    cs.paddingLeft,
    cs.backgroundColor,
    ctrl.tagName.toLowerCase(),
  ].join(' | ')
}

const pick = (selector) => [...document.querySelectorAll(selector)]

window.__affixMatrix = () => {
  const out = {}
  for (const [key] of AFFIX_CASES) {
    const light = pick(`mono-button[data-affix="${key}"]`)[0]
    const shadow = pick(`mono-shadow-button[data-affix="${key}"]`)[0]
    const corners = (el) => {
      const root = el.shadowRoot ?? el
      const ctrl = root.querySelector('.mono-button > button, .mono-button > a')
      if (!ctrl) return null
      const cs = getComputedStyle(ctrl)
      return {
        tl: cs.borderTopLeftRadius,
        tr: cs.borderTopRightRadius,
        blw: cs.borderLeftWidth,
        brw: cs.borderRightWidth,
      }
    }
    out[key] = { light: corners(light), shadow: corners(shadow) }
  }
  return out
}

window.__sweep = () => {
  const out = { rendered: 0, demos: {} }
  for (const demo of Object.keys(DEMOS)) {
    const rows = []
    const lights = pick(`mono-button[data-demo="${demo}"]`)
    for (const l of lights) {
      const s = document.querySelector(
        `mono-shadow-button[data-demo="${demo}"][data-i="${l.dataset.i}"]`,
      )
      out.rendered++
      rows.push({ i: l.dataset.i, light: readOne(l), shadow: s ? readOne(s) : 'NO-SHADOW' })
    }
    out.demos[demo] = rows
  }
  return out
}

// ── the hostile-reset arm ─────────────────────────────────────────────────────
//
// Everything above renders on a bare page, and that is a blind spot: a UA default
// that BOTH builds inherit looks like agreement. Real pages are not bare. The
// docs (and Tailwind/UnoCSS preflight, and most app resets) zero padding
// globally — and a page rule does not cross a shadow boundary, so the light
// build gets zeroed and the shadow build keeps the UA value. Agreement here is
// the only kind that means anything.
//
// This shipped: `<button>` carries `1px 6px` from the UA sheet. The TEXT button
// overwrites it a few rules into button.css; the ICON-ONLY button never did. So
// every shadow icon-only button had 6px of side padding that its light twin did
// not — invisible on this fixture, visible on any real page.
//
// The reset is scoped to a container rather than `*` so the arms above keep
// their bare-page baseline. A descendant selector cannot pierce a shadow root
// either, which is exactly the property under test.
{
  const style = document.createElement('style')
  // `:where()` contributes NOTHING to specificity, so this lands at (0,1,0) —
  // exactly what Tailwind/UnoCSS preflight and the docs reset weigh. Scoping it
  // with a plain `#reset-zone` instead would weigh (1,1,0) and out-specify the
  // component's own padding, zeroing the text button too and testing a page that
  // does not exist.
  style.textContent = ':where(#reset-zone) * { padding: 0; margin: 0 }'
  document.head.appendChild(style)

  const zone = document.createElement('div')
  zone.id = 'reset-zone'
  document.getElementById('app').appendChild(zone)

  // Icon-only in both builds, at every size — the size classes set width/height
  // but never padding, so one size would not prove the rule reaches them all.
  const SIZES = ['xs', 'sm', 'md', 'lg', 'xl', 'xxl']
  const glyph = '<span slot="icon" class="mono-icon i-mdi-plus"></span>'
  let html = ''
  for (const size of SIZES) {
    html += `<mono-button data-reset="${size}" icon-only size="${size}">${glyph}</mono-button>`
    html += `<mono-shadow-button data-reset="${size}" icon-only size="${size}">${glyph}</mono-shadow-button>`
    // The text button is the control: it sets its own padding, so it was correct
    // all along and must stay correct.
    html += `<mono-button data-reset-text="${size}" size="${size}">x</mono-button>`
    html += `<mono-shadow-button data-reset-text="${size}" size="${size}">x</mono-shadow-button>`
  }
  zone.innerHTML = html
}

window.__resetZone = () => {
  const box = (el) => {
    const root = el.shadowRoot ?? el
    const wrap = root.querySelector('.mono-button, .mono-button-icon')
    const ctrl = wrap && wrap.querySelector(':scope > button, :scope > a')
    if (!ctrl) return null
    const cs = getComputedStyle(ctrl)
    const r = ctrl.getBoundingClientRect()
    return [
      cs.paddingTop, cs.paddingRight, cs.paddingBottom, cs.paddingLeft,
      Math.round(r.width) + 'x' + Math.round(r.height),
    ].join(' | ')
  }
  const out = { icon: [], text: [] }
  for (const [key, attr] of [['icon', 'data-reset'], ['text', 'data-reset-text']]) {
    for (const l of document.querySelectorAll(`mono-button[${attr}]`)) {
      const size = l.getAttribute(attr)
      const s = document.querySelector(`mono-shadow-button[${attr}="${size}"]`)
      out[key].push({ size, light: box(l), shadow: s ? box(s) : 'NO-SHADOW' })
    }
  }
  return out
}

window.__ready = true
