// `<mono-button-dropdown>` renders its Basecoat styling ATTRIBUTES on the inner
// root, and flattens each menu row through the BUTTON's public custom
// properties — the only route that also reaches the control in the shadow
// build. Both are browser-only (the attributes come from a ref callback, the
// light build's entries are real `document.createElement` elements), and the
// hover check needs a real pointer, which only this harness has.
//
// Colours arrive as real sRGB `[r, g, b, a]` (the fixture paints them: a token
// colour computes to `oklch(…)` and a `color-mix` to `oklab(…)`, so neither
// string comparison nor an `rgb()` parse would see anything).

/** Euclidean distance in sRGB — enough to say "you cannot see the glyph". */
function distance(a, b) {
  if (!a || !b) return -1
  return Math.sqrt(a.slice(0, 3).reduce((sum, v, i) => sum + (v - b[i]) ** 2, 0))
}

const transparent = (c) => c && c[3] === 0

/** An alpha colour as it actually lands on `surface`. */
function over(color, surface) {
  const a = color[3]
  return color.slice(0, 3).map((v, i) => Math.round(v * a + surface[i] * (1 - a)))
}

/**
 * The button paints `box-shadow: <ring>, <shadow>`, so a row with neither reads
 * as two fully transparent layers rather than `none`.
 */
const shadowless = (value) =>
  value === 'none' || value.replace(/rgba\(0, 0, 0, 0\) 0px 0px 0px 0px,? ?/g, '') === ''

export async function run({ port, page, reporter }) {
  await page.goto(`http://127.0.0.1:${port}/?fixture=button-dropdown-attributes`, {
    waitUntil: 'load',
  })
  await page.waitForFunction(() => window.__ready === true, null, { timeout: 60000 })

  // ── 1. the root attributes ─────────────────────────────────────────────────
  const plain = await page.evaluate(() => window.__attrs('plain'))
  reporter.check(
    'default: only the root attribute, `mono-collapsed` and the `mono-fixed` marker',
    JSON.stringify(plain.attrs) ===
      JSON.stringify(['mono-button-dropdown', 'mono-collapsed', 'mono-fixed']),
    JSON.stringify(plain.attrs),
  )
  reporter.check(
    'the parts render: row, trigger, panel > list > items',
    plain.hasRow && plain.hasTrigger && plain.hasPanel && plain.hasList,
    JSON.stringify(plain),
  )
  reporter.check(
    "each entry's colour rides its <li> as `mono-item-color`",
    JSON.stringify(plain.itemColors) === JSON.stringify(['success', null, 'danger']),
    JSON.stringify(plain.itemColors),
  )
  reporter.check(
    'the pre-Basecoat classes stay as inert hooks',
    plain.legacyClass === true && plain.legacyItemClass === true,
    `root=${plain.legacyClass} item=${plain.legacyItemClass}`,
  )
  reporter.check(
    'the `offset` prop default is Basecoat mt-1 (4px), matching the CSS default',
    plain.offset === 4,
    `offset=${plain.offset}`,
  )

  const props = await page.evaluate(() => window.__attrs('props'))
  const want = [
    'mono-align=start',
    'mono-button-dropdown',
    'mono-collapsed',
    'mono-color=success',
    'mono-fixed',
    'mono-placement=top-start',
    'mono-side=top',
    'mono-size=lg',
    'mono-variant=outline',
  ]
  reporter.check(
    'props mirror onto the root, placement as the side/align pair',
    JSON.stringify(props.attrs) === JSON.stringify(want),
    JSON.stringify(props.attrs),
  )

  const inline = await page.evaluate(() => window.__attrs('inline'))
  reporter.check(
    'while the entries are inline there is no `mono-collapsed` and no trigger',
    !inline.attrs.includes('mono-collapsed') && inline.hasTrigger === false,
    JSON.stringify(inline.attrs),
  )

  const states = await page.evaluate(() => window.__attrs('states'))
  reporter.check(
    '`disabled` mirrors as a state attribute',
    states.attrs.includes('mono-disabled'),
    JSON.stringify(states.attrs),
  )

  // ── 2. the menu flattens every row ─────────────────────────────────────────
  const opened = await page.evaluate(() => window.__rows('plain'))
  const openAttrs = await page.evaluate(() => window.__attrs('plain'))
  reporter.check(
    'open: `mono-open` lands on the root',
    openAttrs.attrs.includes('mono-open'),
    JSON.stringify(openAttrs.attrs),
  )
  const flat = opened.rows.every(
    (r) =>
      transparent(r.bg) &&
      transparent(r.borderColor) &&
      shadowless(r.boxShadow) &&
      r.justify === 'flex-start' &&
      // only the wrapper's own 1px transparent border may stand between them
      r.slack <= 2.5,
  )
  reporter.check(
    'every row is a flat, full-width, start-aligned strip',
    flat,
    JSON.stringify(
      opened.rows.map((r) => [r.color, r.bg, r.borderColor, r.boxShadow, r.justify, r.slack]),
    ),
  )
  reporter.check(
    'the panel is a Basecoat popover: opaque fill, p-1, shadow',
    opened.panelBg[3] === 1 && opened.panelPadding === '4px' && opened.panelShadow !== 'none',
    JSON.stringify({
      bg: opened.panelBg,
      padding: opened.panelPadding,
      shadow: opened.panelShadow,
    }),
  )

  // ── 3. a coloured row stays readable UNDER THE POINTER ─────────────────────
  // The regression: `color: 'success'` painted the row solid green and tinted
  // its check glyph green — the glyph disappeared into its own background.
  for (const color of ['success', 'danger', null]) {
    const selector = await page.evaluate(([id, c]) => window.__rowSelector(id, c), ['plain', color])
    const before = await page.evaluate(([id, c]) => window.__measure(id, c), ['plain', color])
    await page.hover(selector)
    await page.waitForTimeout(250)
    const after = await page.evaluate(([id, c]) => window.__measure(id, c), ['plain', color])
    const label = color ?? 'no colour'

    reporter.check(
      `${label}: resting row has no fill, and the glyph takes the row's ink`,
      transparent(before.bg) && distance(before.ink, before.iconInk) < 2,
      JSON.stringify(before),
    )
    const wash = over(after.bg, after.surface)
    reporter.check(
      `${label}: hover lays down a wash, not the ink itself`,
      !transparent(after.bg) && distance(wash, after.ink) > 90,
      `wash=${wash} ink=${after.ink} Δ=${distance(wash, after.ink).toFixed(1)}`,
    )
    reporter.check(
      `${label}: the glyph stays visible against that wash`,
      distance(wash, after.iconInk) > 90,
      `wash=${wash} glyph=${after.iconInk} Δ=${distance(wash, after.iconInk).toFixed(1)}`,
    )
    // park the pointer away from the menu before the next row
    await page.mouse.move(2, 2)
    await page.waitForTimeout(120)
  }
}
