// checkbox / radio must stay proportional to `mono-input` at the same `size`.
//
// The bug this locks down: box, label, description and gap were all standalone
// literals with no relationship to the input. The box/field ratio wandered
// 0.43 / 0.44 / 0.42 / 0.48 / 0.50 / 0.52 — not even monotonic, `md` the low point —
// while the label sat at a fixed 14.4px and the gap at a fixed 12px at EVERY step.
// So `xs` put an 11.2px box beside 14.4px text next to a 26px field, and read as a
// speck; `xxl` was the opposite.
//
// The fix ties the box to `--theme-control-height-*` and scales label/description/gap
// per step. These checks fail if anyone pins any of it back to a literal.

const SIZES = ['xs', 'sm', 'md', 'lg', 'xl', 'xxl']

// `md` is the default and was deliberately left untouched by the re-scale — if it
// moves, every existing consumer's forms shift.
// The Basecoat port: the checkbox is ported (box = 4/9 of the control step — size-4
// at vega's h-9 — label text-sm leading-snug, gap-2, a text-sm-minus description);
// the radio is not yet. Every check that PAIRS the two is held until both are on
// the same sheet; flip `radio` here when it lands and the pairing checks return.
const PORTED = { checkbox: true, radio: true }
const PAIRED = PORTED.checkbox === PORTED.radio
const BOX_RATIO = { checkbox: PORTED.checkbox ? 4 / 9 : 0.5, radio: PORTED.radio ? 4 / 9 : 0.5 }
const MD_UNCHANGED = PORTED.checkbox
  ? { rawLabel: '14px', rawDescription: '13px', rawGap: '8px' }
  : { rawLabel: '14.4px', rawDescription: '11.84px', rawGap: '12px' }

const px = (v) => parseFloat(v)

export async function run({ port, page, reporter }) {
  await page.goto(`http://127.0.0.1:${port}/?fixture=control-pairing`, { waitUntil: 'load' })
  await page.waitForFunction(() => window.__ready === true, null, { timeout: 60000 })

  const all = {}
  for (const size of SIZES) {
    all[size] = await page.evaluate((s) => window.__pairMetrics(s), size)
  }

  for (const size of SIZES) {
    const m = all[size]

    // 1. The box is a fixed share of the shared control height — the whole point of
    //    the fix — SNAPPED to a whole pixel, because a fractional round shape is
    //    antialiased on every edge (see the "whole pixels" note in checkbox.css).
    const raw = px(m.controlHeight) * 16 * BOX_RATIO.checkbox
    const want = Math.round(raw)
    reporter.check(
      `${size}: box is ${BOX_RATIO.checkbox === 0.5 ? 'half' : '4/9 of'} the control height, to the pixel`,
      Math.abs(m.litBox - want) < 0.02,
      `box ${m.litBox}px, expected round(${raw.toFixed(2)}) = ${want}px (--mono-control-height-${size} = ${m.controlHeight})`,
    )

    // 2. Checkbox and radio sit side by side in real forms; any drift shows.
    if (PAIRED) {
      reporter.check(
        `${size}: checkbox box === radio circle`,
        m.litBox === m.litCircle,
        `box ${m.litBox} vs circle ${m.litCircle}`,
      )
    }

    // 3. All three markup shapes must agree — they reach the same CSS by different
    //    routes (Lit root+box classes, raw classes, a separate shadow stylesheet).
    reporter.check(
      `${size}: Lit / raw / shadow box agree`,
      m.litBox === m.rawBox && m.litBox === m.shadowBox,
      `Lit ${m.litBox}, raw ${m.rawBox}, shadow ${m.shadowBox}`,
    )
    reporter.check(
      `${size}: Lit / raw / shadow circle agree`,
      m.litCircle === m.rawCircle && m.litCircle === m.shadowCircle,
      `Lit ${m.litCircle}, raw ${m.rawCircle}, shadow ${m.shadowCircle}`,
    )
    reporter.check(
      `${size}: label + gap agree across markup shapes`,
      m.litLabel === m.rawLabel && m.litLabel === m.shadowLabel && (!PAIRED || m.litLabel === m.radioLabel) &&
        m.litGap === m.rawGap && m.litGap === m.shadowGap && (!PAIRED || m.litGap === m.radioGap),
      `labels ${m.litLabel}/${m.rawLabel}/${m.shadowLabel}/${m.radioLabel}, ` +
        `gaps ${m.litGap}/${m.rawGap}/${m.shadowGap}/${m.radioGap}`,
    )

    // 4. The custom icon used to be a rem literal that OVERFLOWED the inner box at
    //    `xs` (107% of it) and was silently clipped by the box's `overflow: hidden`.
    reporter.check(
      `${size}: custom icon fits inside the box`,
      m.icon <= m.innerBox + 0.01,
      `icon ${m.icon}px in a ${m.innerBox}px inner box`,
    )

    // 5. The dot is half the inner circle; `xs`/`sm` were the off-curve ones (44%/40%).
    //    (measured against the CHECKBOX's inner box, so only meaningful while paired)
    if (PAIRED) {
      reporter.check(
        `${size}: radio dot is half the inner circle`,
        Math.abs(m.dot - m.innerBox * 0.5) < 0.6,
        `dot ${m.dot}px vs inner ${m.innerBox}px`,
      )
    }

    // 6. The indeterminate dash was a hard 2px at every step.
    reporter.check(
      `${size}: indeterminate dash scales`,
      px(m.dashHeight) >= 1.4 && px(m.dashHeight) <= m.innerBox * 0.2,
      `dash ${m.dashHeight} against a ${m.innerBox}px inner box`,
    )

    // 7. The control sits at the SAME height with or without a description, in
    //    every markup shape. This used to be an `align-items: center` / `flex-start`
    //    switch, and the two branches landed 5px apart at `xs` — so a plain control
    //    beside a described one in the same row looked ragged.
    const shapes = PAIRED ? m.ctrlOffset : m.ctrlOffset.filter((o) => / cb /.test(o.who))
    const offsets = shapes.map((o) => o.offset)
    reporter.check(
      `${size}: control sits at the same height with or without a description`,
      Math.max(...offsets) - Math.min(...offsets) < 0.75,
      shapes.map((o) => `${o.who}=${o.offset}`).join(' / '),
    )

    // 8. Every markup shape agrees on where that height is — Lit, raw markup and
    //    both shadow builds read the same stylesheet by different routes.
    const fromLine = shapes.map((o) => o.fromFirstLine)
    reporter.check(
      `${size}: all markup shapes place the control identically vs the first line`,
      fromLine.every((v) => v !== null) && Math.max(...fromLine) - Math.min(...fromLine) < 0.75,
      shapes.map((o) => `${o.who}=${o.fromFirstLine}`).join(' / '),
    )

    // 8. The description is a <span>; without `display: block` it runs on the same
    //    line as the label. Radio shipped without it, so every radio description
    //    rendered inline while checkbox stacked correctly.
    reporter.check(
      `${size}: description stacks under its label (both components, all builds)`,
      m.descStacked.every((v) => v.endsWith(':stacked')),
      m.descStacked.join(' / '),
    )
  }

  // 7. Nothing may be pinned flat again: label, description and gap must all move
  //    at every step, and the box/field ratio must stay tight and monotonic.
  for (const key of ['rawLabel', 'rawDescription', 'rawGap']) {
    const series = SIZES.map((s) => px(all[s][key]))
    reporter.check(
      `${key} increases at every step`,
      series.every((v, i) => i === 0 || v > series[i - 1]),
      `got ${series.join(' / ')} — a flat run means it was pinned to one value again`,
    )
  }

  // The offset that seats the control on the label's cap band, asserted against the
  // documented formula rather than against rendered ink: the browser rounds each
  // font's ascent/descent to whole pixels, so ink-based measurement is noisy at the
  // sub-pixel level even when the CSS is exactly right.
  //
  //   (labelFont × lineHeight − control) / 2   centre on the first line box
  //   + labelFont × opticalShift              drop onto the cap band
  //   + nudge                                 per-size font-rounding residual
  // Basecoat's `leading-snug` (1.375) for a ported control, mono's 1.35 otherwise.
  const LINE_HEIGHT = { checkbox: PORTED.checkbox ? 1.375 : 1.35, radio: PORTED.radio ? 1.375 : 1.35 }
  const OPTICAL_SHIFT = 0.045
  const NUDGE = { xs: 0, sm: 0, md: 0, lg: -0.35, xl: 0, xxl: 1.1 }

  for (const size of SIZES) {
    const m = all[size]
    const expected =
      (m.labelFontPx * LINE_HEIGHT.checkbox - m.litBox) / 2 + m.labelFontPx * OPTICAL_SHIFT + NUDGE[size]
    const circleExpected = PAIRED
      ? expected
      : (m.radioLabelFontPx * LINE_HEIGHT.radio - m.litCircle) / 2 + m.radioLabelFontPx * OPTICAL_SHIFT + NUDGE[size]
    reporter.check(
      `${size}: offset matches the documented cap-band formula`,
      Math.abs(m.boxMarginTop - expected) < 0.02 && Math.abs(m.circleMarginTop - circleExpected) < 0.02,
      `box ${m.boxMarginTop}px / circle ${m.circleMarginTop}px, formula gives ${expected.toFixed(3)}px / ${circleExpected.toFixed(3)}px`,
    )
  }

  // The DESIGN ratio, not the painted one: the box is snapped to a whole pixel
  // (a fractional round shape is antialiased on every edge — see the "whole
  // pixels" note in checkbox.css), so the painted ratio wobbles by up to half a
  // pixel per step even when the ladder behind it is perfectly monotonic. The
  // band check below still reads what is actually painted.
  const designRatios = SIZES.map(
    (s) => (px(all[s].controlHeight) * 16 * BOX_RATIO.checkbox) / all[s].field,
  )
  const ratios = SIZES.map((s) => all[s].litBox / all[s].field)
  reporter.check(
    'box/field ratio is monotonic (by design, before pixel snapping)',
    designRatios.every((v, i) => i === 0 || v >= designRatios[i - 1] - 0.001),
    `got ${designRatios.map((r) => r.toFixed(3)).join(' / ')} (painted ${ratios.map((r) => r.toFixed(3)).join(' / ')})`,
  )
  reporter.check(
    'box/field ratio stays within a 0.04 band',
    Math.max(...ratios) - Math.min(...ratios) <= 0.04,
    `spread ${(Math.max(...ratios) - Math.min(...ratios)).toFixed(3)} over ${ratios.map((r) => r.toFixed(3)).join(' / ')}`,
  )

  for (const [key, want] of Object.entries(MD_UNCHANGED)) {
    reporter.check(
      `md ${key} unchanged by the re-scale`,
      all.md[key] === want,
      `got ${all.md[key]}, expected ${want}`,
    )
  }
}
