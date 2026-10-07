// A checkbox / radio at size N must read as a peer of an input at size N.
//
// Three markup shapes per size, because they take different paths to the same CSS:
//   - the Lit elements (size lands on the root AND the box/circle)
//   - raw class markup, as the css/ demo twins and mono-table-checkbox write it
//   - the shadow builds, whose stylesheet is a separate copy
// Plus an indeterminate checkbox, since its dash is sized off the inner box.

import '@mono-lit/helper/ui/input'
import '@mono-lit/helper/ui/checkbox'
import '@mono-lit/helper/ui/radio'
import '@mono-lit/helper/ui/shadow/checkbox'
import '@mono-lit/helper/ui/shadow/radio'

const SIZES = ['xs', 'sm', 'md', 'lg', 'xl', 'xxl']

document.querySelector('#app').innerHTML = SIZES.map(
  (s) => `
  <div data-pair="${s}">
    <mono-input size="${s}" placeholder="i"></mono-input>
    <mono-checkbox size="${s}" label="L" description="D" model-value></mono-checkbox>
    <mono-checkbox data-ind size="${s}" label="L" indeterminate></mono-checkbox>
    <mono-radio size="${s}" label="L" description="D" model-value></mono-radio>
    <mono-shadow-checkbox size="${s}" label="L" model-value></mono-shadow-checkbox>
    <mono-shadow-radio size="${s}" label="L" model-value></mono-shadow-radio>
    <mono-shadow-checkbox data-desc size="${s}" label="L" description="D" model-value></mono-shadow-checkbox>
    <mono-shadow-radio data-desc size="${s}" label="L" description="D" model-value></mono-shadow-radio>

    <label mono-checkbox ${s === 'md' ? '' : `mono-size="${s}"`} data-raw-checkbox>
      <input mono-input type="checkbox" checked>
      <span mono-box aria-hidden="true">
        <span mono-icon><svg viewBox="0 0 20 20"><path d="M5 10.5L8.5 14L15 7" fill="none" stroke="currentColor" stroke-width="2.4"/></svg></span>
      </span>
      <span mono-label>
        <span mono-label-text>L</span>
        <span mono-description>D</span>
      </span>
    </label>

    <label mono-radio ${s === 'md' ? '' : `mono-size="${s}"`} data-raw-radio>
      <input mono-input type="radio" name="r-${s}" checked>
      <span mono-circle aria-hidden="true"></span>
      <span mono-label>
        <span mono-label-text>L</span>
        <span mono-description>D</span>
      </span>
    </label>
  </div>`,
).join('')

const w = (el) => (el ? Math.round(el.getBoundingClientRect().width * 100) / 100 : null)
const fs_ = (el) => (el ? getComputedStyle(el).fontSize : null)

/** Every measurement the pairing spec asserts on, for one size. */
window.__pairMetrics = (size) => {
  const scope = document.querySelector(`[data-pair="${size}"]`)
  if (!scope) return { error: 'no scope' }

  const litCb = scope.querySelector('mono-checkbox:not([data-ind]) [mono-checkbox]')
  const shCbDesc = scope.querySelector('mono-shadow-checkbox[data-desc]').shadowRoot
  const shRdDesc = scope.querySelector('mono-shadow-radio[data-desc]').shadowRoot
  const rawCb = scope.querySelector('[data-raw-checkbox]')
  const rawRd = scope.querySelector('[data-raw-radio]')
  const litRd = scope.querySelector('mono-radio [mono-radio]')
  const indBox = scope.querySelector('mono-checkbox[data-ind] [mono-box]')
  const shCb = scope.querySelector('mono-shadow-checkbox').shadowRoot
  const shRd = scope.querySelector('mono-shadow-radio').shadowRoot
  const rawBox = rawCb.querySelector('[mono-box]')

  return {
    // The input's own painted box — control-height plus its borders. `.mono-input-field`
    // only sets min-height, so read the box, never the token.
    field: w(scope.querySelector('.mono-input-field'))
      ? Math.round(scope.querySelector('.mono-input-field').getBoundingClientRect().height * 100) / 100
      : null,
    controlHeight: getComputedStyle(document.documentElement).getPropertyValue(`--mono-control-height-${size}`).trim(),

    litBox: w(litCb.querySelector('[mono-box]')),
    rawBox: w(rawBox),
    shadowBox: w(shCb.querySelector('[mono-box]')),
    litCircle: w(litRd.querySelector('[mono-circle]')),
    rawCircle: w(rawRd.querySelector('[mono-circle]')),
    shadowCircle: w(shRd.querySelector('[mono-circle]')),

    // The real inner area the glyphs size against: the rect minus both borders.
    // (NOT clientWidth — that is an integer, and a 4/9 box is fractional.)
    innerBox: (() => {
      const cs = getComputedStyle(rawBox)
      return Math.round((rawBox.getBoundingClientRect().width - parseFloat(cs.borderLeftWidth) - parseFloat(cs.borderRightWidth)) * 100) / 100
    })(),
    icon: w(rawCb.querySelector('[mono-icon]')),
    // the raw markup leaves the circle empty, so the dot is its ::before
    dot: parseFloat(getComputedStyle(rawRd.querySelector('[mono-circle]'), '::before').width),
    dashHeight: getComputedStyle(indBox, '::after').height,

    litLabel: fs_(litCb.querySelector('[mono-label-text]')),
    rawLabel: fs_(rawCb.querySelector('[mono-label-text]')),
    shadowLabel: fs_(shCb.querySelector('[mono-label-text]')),
    radioLabel: fs_(rawRd.querySelector('[mono-label-text]')),
    rawDescription: fs_(rawCb.querySelector('[mono-description]')),

    // Cross-axis alignment. The control must sit at the SAME height whether or not
    // a description follows — otherwise a plain control and a described one in the
    // same row are visibly ragged. Measured as the control's offset from the top of
    // its own root, so it is comparable between separate elements.
    //
    // `[who, offsetFromRootTop, centredOnFirstLine]` per markup shape.
    ctrlOffset: [
      ['lit cb plain', scope.querySelector('mono-checkbox[data-ind] [mono-checkbox]'), '[mono-box]', '[mono-label-text]'],
      ['lit cb desc', litCb, '[mono-box]', '[mono-label-text]'],
      ['raw cb desc', rawCb, '[mono-box]', '[mono-label-text]'],
      ['raw rd desc', rawRd, '[mono-circle]', '[mono-label-text]'],
      ['sh cb plain', shCb.querySelector('[mono-checkbox]'), '[mono-box]', '[mono-label-text]'],
      ['sh cb desc', shCbDesc.querySelector('[mono-checkbox]'), '[mono-box]', '[mono-label-text]'],
      ['sh rd plain', shRd.querySelector('[mono-radio]'), '[mono-circle]', '[mono-label-text]'],
      ['sh rd desc', shRdDesc.querySelector('[mono-radio]'), '[mono-circle]', '[mono-label-text]'],
    ].map(([who, root, ctrlSel, textSel]) => {
      const ctrl = root.querySelector(ctrlSel)
      const text = root.querySelector(textSel)
      const rb = root.getBoundingClientRect()
      const cb = ctrl.getBoundingClientRect()
      // Real rendered first line, via a Range — not an assumption about line-height.
      const rng = document.createRange()
      rng.selectNodeContents(text)
      const lines = [...rng.getClientRects()].filter((x) => x.height > 0)
      const lineMid = lines.length ? lines[0].top + lines[0].height / 2 : null
      return {
        who,
        offset: Math.round((cb.top - rb.top) * 100) / 100,
        fromFirstLine: lineMid === null ? null : Math.round((cb.top + cb.height / 2 - lineMid) * 100) / 100,
      }
    }),

    // A description must STACK under its label, never run on the same line. The
    // radio's description element is a <span> and lacked `display: block`, so every
    // radio description rendered inline while checkbox's stacked correctly.
    descStacked: [
      ['lit checkbox', litCb],
      ['raw checkbox', rawCb],
      ['raw radio', rawRd],
      ['shadow checkbox', shCbDesc.querySelector('[mono-checkbox]')],
      ['shadow radio', shRdDesc.querySelector('[mono-radio]')],
    ].map(([who, root]) => {
      const l = root.querySelector('[mono-label-text], [class$="-label-text"]')
      const d = root.querySelector('[mono-description], [class$="-label-description"]')
      if (!l || !d) return `${who}:MISSING`
      const stacked = d.getBoundingClientRect().top >= l.getBoundingClientRect().bottom - 1
      return `${who}:${stacked ? 'stacked' : 'INLINE'}`
    }),

    labelFontPx: parseFloat(getComputedStyle(litCb.querySelector('[mono-label-text]')).fontSize),
    radioLabelFontPx: parseFloat(getComputedStyle(litRd.querySelector('[mono-label-text]')).fontSize),
    // The resolved offset itself, so the formula can be asserted exactly instead of
    // via rendered ink (which the browser's per-size font rounding makes noisy).
    boxMarginTop: parseFloat(getComputedStyle(litCb.querySelector('[mono-box]')).marginTop),
    circleMarginTop: parseFloat(getComputedStyle(litRd.querySelector('[mono-circle]')).marginTop),

    litGap: getComputedStyle(litCb).columnGap,
    rawGap: getComputedStyle(rawCb).columnGap,
    shadowGap: getComputedStyle(shCb.querySelector('[mono-checkbox]')).columnGap,
    radioGap: getComputedStyle(rawRd).columnGap,
  }
}

setTimeout(() => {
  window.__ready = true
}, 400)
