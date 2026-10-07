// The documented public knobs must actually reach the paint.
//
// `ui/button.md` lists `--mono-button-bg` as "Resolved background" and the
// CSS Variables demo sets it on a `<mono-button>`. It did nothing. Every colour
// class — `.primary`, `.outline-danger`, `.grad-ocean`, all thirty of them —
// re-declared `--mono-button-bg` (and `-color`, `-border-color`, `-shadow`, plus
// the four hover twins) on the `.mono-button` WRAPPER. A consumer's value lands
// on the element host, one level up; a declaration on the wrapper beats a value
// inherited into it, so the class always won and the knob was inert.
//
// It only ever appeared to work in the hand-written CSS tab, where the demo's
// twin markup happened to name no colour class at all — so the wrapper had no
// competing declaration. Naming `primary` there, which is what the element
// actually emits, reproduced the bug in that tab too.
//
// The fix puts these eight on the same three tiers as the radius: classes write
// `--_mono-button-<x>-preset`, the wrapper resolves
// `--_mono-button-<x>` = public → preset → base. What is guarded here is that
// order, in both builds, against a button that DOES carry a colour class —
// because a button without one passes either way.

import '@mono-lit/helper/ui/button'
import '@mono-lit/helper/ui/shadow/button'

const host = document.getElementById('app')

const add = (html) => {
  const wrap = document.createElement('div')
  wrap.innerHTML = html
  host.appendChild(wrap)
  return wrap
}

const TEAL = 'rgb(13, 148, 136)'
const PLUM = 'rgb(124, 58, 237)'
const MAGENTA = 'rgb(192, 38, 211)'

// ── the arms ──────────────────────────────────────────────────────────────────
//
// Each pair is the SAME markup in both builds. `color="primary"` is stated
// explicitly even though it is the default: the whole point is that a colour
// class is present on the wrapper, competing with the override.

// 1. The reported case: override the resolved background on a coloured button.
add(`<mono-button id="bg-light" color="primary" style="--mono-button-bg: ${TEAL}">x</mono-button>`)
add(`<mono-shadow-button id="bg-shadow" color="primary" style="--mono-button-bg: ${TEAL}">x</mono-shadow-button>`)

// 2. A non-default colour class, so this cannot pass by `.primary` happening to
//    be weak. `outline-danger` sets bg, colour AND border-colour.
add(`<mono-button id="outline-light" color="danger" variant="outline" style="--mono-button-bg: ${TEAL}; --mono-button-color: ${PLUM}; --mono-button-border-color: ${PLUM}">x</mono-button>`)
add(`<mono-shadow-button id="outline-shadow" color="danger" variant="outline" style="--mono-button-bg: ${TEAL}; --mono-button-color: ${PLUM}; --mono-button-border-color: ${PLUM}">x</mono-shadow-button>`)

// 3. THE CONTROL. No override — the colour class must still win over the base.
//    If a "fix" ever inverts the chain (preset below the base instead of above),
//    arms 1 and 2 keep passing and only this one moves.
add('<mono-button id="ctl-light" color="danger">x</mono-button>')
add('<mono-shadow-button id="ctl-shadow" color="danger">x</mono-shadow-button>')

// 4. The hand-written form the CSS demo tab documents, with the colour class the
//    element really emits. Deliberately the WEAK arm: the var sits on the same
//    element as the class, where an inline style beats a stylesheet declaration
//    outright, so this passes even with the bug present. That asymmetry IS the
//    finding — it is why the CSS tab looked correct while the Vue tab did not —
//    and it is here so the pair is documented, not because it guards anything.
add(`<div id="raw-wrap" mono-button mono-size="md" mono-color="primary" style="--mono-button-bg: ${TEAL}"><button>x</button></div>`)

// 5. The PALETTE tier, which has the same shape and shipped the same bug. These
//    are documented as "apply them on the element / inline" too, and the
//    CSS Variables demo leads with exactly this: re-tint the default gradient.
//    It rendered the theme navy on `<mono-button>` and the authored purple in
//    the hand-written tab. A gradient paints via background-IMAGE, so a spec that
//    only reads backgroundColor sees `rgba(0, 0, 0, 0)` either way and passes
//    while the button is visibly wrong — which is what happened. __paint reports
//    bgImage for this reason.
add(`<mono-button id="pal-light" color="primary" style="--mono-button-primary: ${PLUM}; --mono-button-secondary: ${MAGENTA}">x</mono-button>`)
add(`<mono-shadow-button id="pal-shadow" color="primary" style="--mono-button-primary: ${PLUM}; --mono-button-secondary: ${MAGENTA}">x</mono-shadow-button>`)

// 6. The tonal tint is DERIVED from the palette by color-mix. Its comment always
//    said overriding a colour moves its tonal tint along with its solid; that was
//    only true for a var set on the wrapper itself.
add(`<mono-button id="tonal-light" color="danger" variant="tonal" style="--mono-button-danger: ${PLUM}">x</mono-button>`)
add(`<mono-shadow-button id="tonal-shadow" color="danger" variant="tonal" style="--mono-button-danger: ${PLUM}">x</mono-shadow-button>`)

// ── readout ───────────────────────────────────────────────────────────────────

/** The painted control inside either build. */
const ctrlOf = (id) => {
  const el = document.getElementById(id)
  if (!el) return null
  if (el.tagName.toLowerCase() === 'div') return el.querySelector(':scope > button')
  const root = el.shadowRoot ?? el
  const wrap = root.querySelector('.mono-button, .mono-button-icon')
  return wrap ? wrap.querySelector(':scope > button, :scope > a') : null
}

window.__paint = (id) => {
  const ctrl = ctrlOf(id)
  if (!ctrl) return null
  const cs = getComputedStyle(ctrl)
  return {
    bg: cs.backgroundColor,
    bgImage: cs.backgroundImage,
    color: cs.color,
    borderColor: cs.borderTopColor,
  }
}

window.__ready = true
