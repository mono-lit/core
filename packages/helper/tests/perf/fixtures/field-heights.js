// Every form control at size N must paint EXACTLY `--mono-control-height-N`.
//
// The bug this locks down: the four text fields express their height as `min-height`
// on a field whose content is free to overflow it, and each one overflowed for a
// different reason —
//   - mono-input     pinned `height: token` on the border-less native INSIDE the
//                    bordered field, so the field painted token + 3px;
//   - mono-select    has a fixed 1.5rem (24px) arrow/clear box and no `line-height`
//                    on its value, so it inherits the host page's line box;
//   - mono-date      declares `font: inherit` on its native (which RESETS
//                    line-height) and carries a 20px calendar icon;
//   - mono-tag-input has no box at all on its clear button — `padding: .2rem`
//                    around a 20px glyph = 26.4px — and hard-coded `sm` chips.
// Only `mono-button` was right: `min-height: token` with content that always fits.
//
// The hostile arm is the point. VitePress sets an ABSOLUTE `line-height: 24px` on
// html/body (`theme-default/styles/base.css:36,59`), and that 24px strut is what no
// font-size step can shrink. `harness.mjs`'s `pageHtml` sets `body { font: 14px
// system-ui }` — the `font` shorthand resets line-height to `normal` — so a
// single-arm fixture would measure a friendly world and pass while the docs site
// stayed broken. Hence three arms: hostile, vacuum, and shadow (inherited
// line-height crosses a shadow boundary, and the shadow sheets are separate copies).
//
// `mono-tag-input` is measured EMPTY on purpose. It keeps `min-height` for real —
// a second chip row is supposed to grow it past the token — so a filled field would
// encode the wrong contract.

import '@mono-lit/helper/ui/input'
import '@mono-lit/helper/ui/select'
import '@mono-lit/helper/ui/date'
import '@mono-lit/helper/ui/tag-input'
import '@mono-lit/helper/ui/button'
import '@mono-lit/helper/ui/checkbox'
import '@mono-lit/helper/ui/switch'
import '@mono-lit/helper/ui/textarea'
import '@mono-lit/helper/ui/shadow/input'
import '@mono-lit/helper/ui/shadow/select'
import '@mono-lit/helper/ui/shadow/date'
import '@mono-lit/helper/ui/shadow/tag-input'
import '@mono-lit/helper/ui/shadow/button'

const SIZES = ['xs', 'sm', 'md', 'lg', 'xl', 'xxl']

// The hostile line box goes on the ARM, never in `pageHtml` — that helper is shared
// by all the other specs and changing it would silently re-baseline them.
const HOSTILE = 'line-height: 24px; font-size: 16px;'

const ARMS = [
  ['vitepress', HOSTILE],
  ['vacuum', ''],
  ['shadow', HOSTILE],
]

/** Light-DOM markup for one size. `label` drives the block-height arm. */
const lightRow = (s) => `
  <div data-size="${s}">
    <div data-kind="bare">
      <mono-input size="${s}" placeholder="p"></mono-input>
      <mono-select size="${s}" placeholder="p"></mono-select>
      <mono-date size="${s}" placeholder="p"></mono-date>
      <mono-tag-input size="${s}" placeholder="p"></mono-tag-input>
      <mono-button size="${s}">B</mono-button>
    </div>

    <div data-kind="clearable">
      <mono-input size="${s}" placeholder="p" clearable model-value="x"></mono-input>
      <mono-select size="${s}" placeholder="p" clearable></mono-select>
      <mono-date size="${s}" placeholder="p" clearable></mono-date>
      <mono-tag-input size="${s}" placeholder="p" clearable></mono-tag-input>
      <mono-button size="${s}">B</mono-button>
    </div>

    <div data-kind="underlined">
      <mono-input size="${s}" placeholder="p" variant="underlined"></mono-input>
      <mono-select size="${s}" placeholder="p" variant="underlined"></mono-select>
      <mono-date size="${s}" placeholder="p" variant="underlined"></mono-date>
      <mono-tag-input size="${s}" placeholder="p" variant="underlined"></mono-tag-input>
      <mono-button size="${s}">B</mono-button>
    </div>

    <div data-kind="labelled">
      <mono-input size="${s}" label="L" placeholder="p"></mono-input>
      <mono-select size="${s}" label="L" placeholder="p"></mono-select>
      <mono-date size="${s}" label="L" placeholder="p"></mono-date>
      <mono-tag-input size="${s}" label="L" placeholder="p"></mono-tag-input>
      <mono-button size="${s}">B</mono-button>
    </div>

    <div data-kind="peer">
      <mono-checkbox size="${s}" label="L"></mono-checkbox>
      <mono-switch size="${s}" label="L"></mono-switch>
      <mono-textarea size="${s}" placeholder="p"></mono-textarea>
    </div>
  </div>`

/** Shadow builds carry their own compiled copy of the same stylesheet. */
const shadowRow = (s) => `
  <div data-size="${s}">
    <div data-kind="bare">
      <mono-shadow-input size="${s}" placeholder="p"></mono-shadow-input>
      <mono-shadow-select size="${s}" placeholder="p"></mono-shadow-select>
      <mono-shadow-date size="${s}" placeholder="p"></mono-shadow-date>
      <mono-shadow-tag-input size="${s}" placeholder="p"></mono-shadow-tag-input>
      <mono-shadow-button size="${s}">B</mono-shadow-button>
    </div>
  </div>`

document.querySelector('#app').innerHTML =
  ARMS.map(
    ([arm, style]) => `
    <div data-arm="${arm}" style="${style}">
      ${SIZES.map(arm === 'shadow' ? shadowRow : lightRow).join('')}
    </div>`,
  ).join('') +
  // Probe for reading a token as a real px length. NEVER `parseFloat(token) * 16` —
  // that would bake the root font-size into the assertion.
  `<div id="probe" style="position:absolute;visibility:hidden;width:1px"></div>`

const px = (el) =>
  el ? Math.round(el.getBoundingClientRect().height * 100) / 100 : null

/** Resolve `--mono-control-height-<size>` to px by measuring, not by parsing. */
window.__tokenPx = (size) => {
  const probe = document.getElementById('probe')
  probe.style.height = `var(--mono-control-height-${size})`
  return px(probe)
}

/** The line box the arm actually imposes — asserted, so a harness change can't
 *  silently neuter the hostile arm. */
window.__armLineHeight = (arm) =>
  getComputedStyle(document.querySelector(`[data-arm="${arm}"]`)).lineHeight

const scope = (arm, size, kind) =>
  document.querySelector(`[data-arm="${arm}"] [data-size="${size}"] [data-kind="${kind}"]`)

const FIELD = {
  input: '.mono-input-field',
  select: '.mono-select-trigger',
  date: '.mono-date-field',
  tag: '.mono-tag-input-field',
  button: '.mono-button > button',
}

/** Reach into a shadow root when the arm is the shadow one. */
function findField(root, sel, isShadow) {
  if (!isShadow) return root.querySelector(sel)
  for (const host of root.children) {
    const hit = host.shadowRoot?.querySelector(sel)
    if (hit) return hit
  }
  return null
}

/** Painted height of each control's FIELD element — never the host, which is a
 *  grid wrapper that also holds the label and message rows. */
window.__fieldHeights = (arm, size, kind = 'bare') => {
  const root = scope(arm, size, kind)
  if (!root) return { error: `no scope ${arm}/${size}/${kind}` }
  const isShadow = arm === 'shadow'
  const out = {}
  for (const [name, sel] of Object.entries(FIELD)) {
    out[name] = px(findField(root, sel, isShadow))
  }
  return out
}

/** Full label+field block, plus the parts, so a failure names its own cause. */
window.__blockHeights = (arm, size) => {
  const root = scope(arm, size, 'labelled')
  if (!root) return { error: `no scope ${arm}/${size}` }
  const of_ = (tag, labelSel) => {
    const host = root.querySelector(tag)
    if (!host) return null
    return {
      block: px(host),
      label: px(host.querySelector(labelSel)),
      gap: getComputedStyle(host.firstElementChild ?? host).rowGap,
    }
  }
  return {
    input: of_('mono-input', '.mono-input-label'),
    select: of_('mono-select', '.mono-select-label'),
    date: of_('mono-date', '.mono-date-label'),
    tag: of_('mono-tag-input', '.mono-tag-input-label'),
  }
}

/** the switch THUMB is the checkbox box at the same size (Basecoat sizes the
 *  track 1.15x the thumb, so the two are peers through the thumb, not the track). */
window.__peerMetrics = (arm, size) => {
  const root = scope(arm, size, 'peer')
  if (!root) return { error: `no scope ${arm}/${size}` }
  const w = (sel) => {
    const el = root.querySelector(sel)
    return el ? Math.round(el.getBoundingClientRect().width * 100) / 100 : null
  }
  const track = root.querySelector('[mono-track]')
  const ta = root.querySelector('.mono-textarea-field')
  const taText = ta ? getComputedStyle(ta) : null
  return {
    checkboxBox: w('[mono-box]'),
    switchTrackH: px(track),
    switchTrackW: w('[mono-track]'),
    switchThumb: w('[mono-thumb]'),
    switchBorder: track ? parseFloat(getComputedStyle(track).borderTopWidth) : null,
    textareaMinHeight: taText?.minHeight ?? null,
    // the two inputs of the textarea derivation: min-height = T + (ROWS - 1) x L
    textareaRows: ta ? parseFloat(taText.getPropertyValue('--_mono-textarea-rows')) : null,
    textareaLine: ta
      ? parseFloat(taText.fontSize) * parseFloat(taText.lineHeight) / parseFloat(taText.fontSize)
      : null,
    textareaLinePx: ta ? parseFloat(taText.lineHeight) : null,
    // First text line centre, measured from the field's border-box top.
    textareaFirstLine: ta
      ? parseFloat(taText.borderTopWidth) +
        parseFloat(taText.paddingTop) +
        parseFloat(taText.lineHeight) / 2
      : null,
  }
}

/**
 * Retune the token at runtime and re-measure. Catches a literal that merely happens
 * to equal today's value — the whole point of having a token.
 */
window.__retune = async (size, value) => {
  document.documentElement.style.setProperty(`--mono-control-height-${size}`, value)
  // Basecoat's `.btn` is `transition-all`, so a retuned height ANIMATES over
  // `--mono-duration` (150ms); measure after it has settled.
  await new Promise((r) => setTimeout(r, 400))
  const out = {}
  for (const [arm] of ARMS) out[arm] = window.__fieldHeights(arm, size)
  return out
}

window.__restore = (size) => {
  document.documentElement.style.removeProperty(`--mono-control-height-${size}`)
}

setTimeout(() => {
  window.__ready = true
}, 400)
