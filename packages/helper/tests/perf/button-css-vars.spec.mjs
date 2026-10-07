// A documented `--mono-button-*` knob must beat the component's own colour class.
//
// See the fixture for the mechanism. In short: the colour classes used to write
// the public names themselves, on the wrapper, one level BELOW where a consumer
// sets them — so `--mono-button-bg` on a `<mono-button>` was silently ignored
// unless the button carried no colour class at all.
//
// The three tiers this pins are `public → preset → base`. Arms 1, 2 and 4 prove
// public beats preset; arm 3 is the control proving preset still beats base.

/** Chromium serializes an oklch-specified colour as oklch(); white is one of these. */
const isWhite = (c) => c === 'rgb(255, 255, 255)' || c === 'oklch(1 0 0)'

export async function run({ port, page, reporter }) {
  await page.goto(`http://127.0.0.1:${port}/?fixture=button-css-vars`, { waitUntil: 'load' })
  await page.waitForFunction(() => window.__ready === true, null, { timeout: 60000 })

  const read = (id) => page.evaluate((i) => window.__paint(i), id)

  const TEAL = 'rgb(13, 148, 136)'
  const PLUM = 'rgb(124, 58, 237)'

  // 1 ── the reported case, in both builds.
  for (const build of ['light', 'shadow']) {
    const p = await read(`bg-${build}`)
    reporter.check(
      `${build}: --mono-button-bg beats the .primary class`,
      p !== null && p.bg === TEAL && p.bgImage === 'none',
      p === null
        ? 'element not found'
        : `painted ${p.bg} / ${p.bgImage.slice(0, 60)} — the class re-declared the ` +
          'public name on the wrapper, below where the consumer set it',
    )
  }

  // 2 ── three knobs at once against a variant class that writes all three.
  for (const build of ['light', 'shadow']) {
    const p = await read(`outline-${build}`)
    reporter.check(
      `${build}: bg + color + border-color all beat .outline-danger`,
      p !== null && p.bg === TEAL && p.color === PLUM && p.borderColor === PLUM,
      p === null ? 'element not found' : `bg ${p.bg}, color ${p.color}, border ${p.borderColor}`,
    )
  }

  // 3 ── THE CONTROL. With no override the class must still paint. This is what
  //      refuses to move if the chain is ever inverted. Solid = the flat
  //      `--destructive` fill (basecoat .btn[data-variant='primary'] with the hue
  //      swapped) with its foreground ink — no background-image any more.
  for (const build of ['light', 'shadow']) {
    const p = await read(`ctl-${build}`)
    reporter.check(
      `${build}: control — .danger still paints when nothing overrides it`,
      p !== null && p.bgImage === 'none' && p.bg !== 'rgba(0, 0, 0, 0)' && p.bg !== TEAL && isWhite(p.color),
      p === null
        ? 'element not found'
        : `bg ${p.bg} / ${p.bgImage.slice(0, 60)}, color ${p.color} ` +
          '(the preset must still beat the base)',
    )
  }

  // 4 ── the hand-written CSS form, var and class on the SAME element.
  const raw = await read('raw-wrap')
  reporter.check(
    'hand-written markup: the var wins on the wrapper that carries the class too',
    raw !== null && raw.bg === TEAL && raw.bgImage === 'none',
    raw === null ? 'element not found' : `painted ${raw.bg} / ${raw.bgImage.slice(0, 60)}`,
  )

  // 5 ── light and shadow must agree, which is the whole premise of the docs
  //      deriving the Shadow tab from the Vue source.
  for (const arm of ['bg', 'outline', 'ctl']) {
    const l = await read(`${arm}-light`)
    const s = await read(`${arm}-shadow`)
    reporter.check(
      `${arm}: light === shadow`,
      l !== null && s !== null && JSON.stringify(l) === JSON.stringify(s),
      `light ${JSON.stringify(l)} vs shadow ${JSON.stringify(s)}`,
    )
  }

  // ── the palette tier ───────────────────────────────────────────────────────
  //
  // Same defect, one level up: the colour class must paint the PUBLIC palette
  // knob (`--mono-button-primary`), not the theme token it defaults to. (This
  // used to be a gradient, which hid the failure behind background-IMAGE; the
  // fill is flat now, so `backgroundColor` is the whole story.)

  const PLUM_HEX = ['124', '58', '237']

  for (const build of ['light', 'shadow']) {
    const p = await read(`pal-${build}`)
    reporter.check(
      `${build}: --mono-button-primary re-tints the default fill`,
      p !== null && p.bgImage === 'none' && p.bg === `rgb(${PLUM_HEX.join(', ')})`,
      p === null
        ? 'element not found'
        : `painted ${p.bg} / ${p.bgImage.slice(0, 60)} — expected the authored purple, ` +
          'not the theme primary',
    )
  }

  // The derived tonal tint must follow the palette override too — a `color-mix`
  // of the RESOLVED colour, not of the theme token.
  for (const build of ['light', 'shadow']) {
    const p = await read(`tonal-${build}`)
    reporter.check(
      `${build}: the tonal tint follows an overridden --mono-button-danger`,
      p !== null && p.color === `rgb(${PLUM_HEX.join(', ')})` && p.bg !== 'rgba(0, 0, 0, 0)',
      p === null ? 'element not found' : `color ${p.color}, bg ${p.bg}`,
    )
  }

  for (const arm of ['pal', 'tonal']) {
    const l = await read(`${arm}-light`)
    const s = await read(`${arm}-shadow`)
    reporter.check(
      `${arm}: light === shadow`,
      l !== null && s !== null && JSON.stringify(l) === JSON.stringify(s),
      `light ${JSON.stringify(l)} vs shadow ${JSON.stringify(s)}`,
    )
  }
}
