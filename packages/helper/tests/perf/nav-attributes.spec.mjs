// `<mono-nav>` after the Basecoat port. Basecoat ships no nav component, so
// there is no upstream selector to diff against — what this spec pins is that
// the EXTENSION resolves entirely through the Basecoat token layer, which is
// the whole point of the port: an unpainted bar is `--sidebar` on
// `--sidebar-foreground` (upstream's own chrome tokens), a coloured one is the
// role on the role's `-foreground` the way `.btn[data-variant='primary']` is,
// and the density ladder is `--mono-spacing` multiples rather than magic px.
//
// The pre-port sheet reached all of this through `--theme-*` and a parallel set
// of `--*-rgb` triples with hand-rolled contrast; none of that survives, so
// these are the assertions that would catch it coming back.

export async function run({ port, page, reporter }) {
  await page.goto(`http://127.0.0.1:${port}/?fixture=nav-attributes`, { waitUntil: 'load' })
  await page.waitForFunction(() => window.__ready === true, null, { timeout: 60000 })

  const same = (a, b) => JSON.stringify(a) === JSON.stringify(b)

  // ── 1. the default bar says only what it is ────────────────────────────────
  const light = await page.evaluate(() => window.__m('light'))
  reporter.check(
    'default: the root attribute plus `mono-static` — every other prop is at its default',
    JSON.stringify(light.attrs) === JSON.stringify(['mono-nav', 'mono-static']),
    JSON.stringify(light.attrs),
  )

  // ── 2. the unpainted bar IS upstream's chrome surface ──────────────────────
  const sidebar = await page.evaluate(() => window.__token('--sidebar'))
  const sidebarFg = await page.evaluate(() => window.__token('--sidebar-foreground'))
  reporter.check(
    '`surface` takes `--sidebar` / `--sidebar-foreground`, not a `--theme-*` bridge',
    same(light.bar.bg, sidebar) && same(light.bar.color, sidebarFg),
    JSON.stringify({ bar: light.bar.bg, sidebar, ink: light.bar.color, sidebarFg }),
  )
  reporter.check(
    'no gradient and no blur: the bar is one opaque fill',
    light.bar.bg[3] === 1 && (light.bar.backdrop === 'none' || !light.bar.backdrop),
    JSON.stringify({ alpha: light.bar.bg[3], backdrop: light.bar.backdrop }),
  )
  reporter.check(
    '`elevated` is the default variant, so the unqualified bar carries the shadow',
    light.bar.shadow === 'yes',
    light.bar.shadow,
  )

  // ── 2b. the bar's chrome IS the card's ────────────────────────────────────
  // Basecoat has no nav, so the card is the reference surface: a wide rectangle
  // with an edge and an elevation. Before this, all eight styles painted the
  // same bar — the flavors only moved its gutter and its type.
  const card = await page.evaluate(() => window.__card())
  reporter.check(
    'the bar takes the CARD\'s radius, elevation, gutter and type — not its own',
    light.bar.radius === card.radius &&
      light.inner.padX === card.padX &&
      light.bar.font === card.font,
    JSON.stringify({ nav: { radius: light.bar.radius, padX: light.inner.padX, font: light.bar.font }, card }),
  )
  reporter.check(
    'and the card\'s ring: an INSET edge, so nothing clips it away',
    light.bar.shadowValue.includes('inset'),
    light.bar.shadowValue,
  )

  // ── 3. the row and its three regions ───────────────────────────────────────
  reporter.check(
    'the row is 56px tall with the card\'s 24px gutter and a 12px gap (comfortable)',
    light.inner.height === 56 &&
      light.inner.padX === 24 &&
      light.inner.gap === 12 &&
      light.inner.align === 'center',
    JSON.stringify(light.inner),
  )
  reporter.check(
    'the center region takes the slack; all three regions are flex rows',
    light.center.grow === '1' &&
      light.start.display === 'flex' &&
      light.center.display === 'flex' &&
      light.end.display === 'flex',
    JSON.stringify({ center: light.center, end: light.end }),
  )
  reporter.check(
    'the extension row is hidden until `extension` turns it on',
    light.ext.display === 'none',
    light.ext.display,
  )

  const ext = await page.evaluate(() => window.__m('ext'))
  reporter.check(
    '`extension` shows a 44px second row with the bar\'s gutter and a hairline above it',
    ext.attrs.includes('mono-has-extension') &&
      ext.ext.display === 'flex' &&
      ext.ext.minHeight === 44 &&
      ext.ext.padX === 24 &&
      ext.ext.borderTopWidth === 1,
    JSON.stringify(ext.ext),
  )

  // ── 4. density is a spacing ladder ─────────────────────────────────────────
  const compact = await page.evaluate(() => window.__m('compact'))
  const roomy = await page.evaluate(() => window.__m('roomy'))
  reporter.check(
    'the three densities are 48 / 56 / 64 on the 4px grid, gutters and gaps in step',
    compact.inner.height === 48 &&
      light.inner.height === 56 &&
      roomy.inner.height === 64 &&
      compact.inner.padX === 16 &&
      roomy.inner.padX === 32 &&
      compact.inner.gap < light.inner.gap &&
      light.inner.gap < roomy.inner.gap,
    JSON.stringify({ compact: compact.inner, comfortable: light.inner, default: roomy.inner }),
  )

  // ── 5. a coloured bar is the role on the role's own ink ────────────────────
  const painted = await page.evaluate(() => window.__m('painted'))
  const destructive = await page.evaluate(() => window.__token('--destructive'))
  const destructiveFg = await page.evaluate(() => window.__token('--destructive-foreground'))
  reporter.check(
    '`color="danger"` paints the bar `--destructive` and inks it `--destructive-foreground`',
    same(painted.bar.bg, destructive) && same(painted.bar.color, destructiveFg),
    JSON.stringify({ bg: painted.bar.bg, destructive, ink: painted.bar.color, destructiveFg }),
  )

  const custom = await page.evaluate(() => window.__m('custom'))
  reporter.check(
    'a literal colour paints through the `custom` marker, ink derived by the component',
    custom.attrs.includes('mono-color=custom') &&
      same(custom.bar.bg, [124, 58, 237, 1]) &&
      custom.bar.color[0] > 200,
    JSON.stringify({ attrs: custom.attrs, bg: custom.bar.bg, ink: custom.bar.color }),
  )

  // ── 6. variants ────────────────────────────────────────────────────────────
  const flat = await page.evaluate(() => window.__m('flat'))
  const outlined = await page.evaluate(() => window.__m('outlined'))
  reporter.check(
    '`flat` drops the ring and the elevation; `outlined` keeps the ring and adds the rule',
    flat.bar.shadow === 'none' &&
      flat.bar.borderBottomColor[3] === 0 &&
      outlined.bar.shadowValue.includes('inset') &&
      outlined.bar.borderBottomColor[3] > 0,
    JSON.stringify({ flat: flat.bar, outlined: outlined.bar }),
  )

  // ── 7. sticky is the default, `mono-static` the opt-out ────────────────────
  const stickyBar = await page.evaluate(() => window.__m('sticky'))
  reporter.check(
    'a bar with no `mono-static` sticks; one with it does not',
    stickyBar.bar.position === 'sticky' && light.bar.position === 'static',
    JSON.stringify({ sticky: stickyBar.bar.position, static: light.bar.position }),
  )

  // ── 8. the two builds agree ────────────────────────────────────────────────
  const shadow = await page.evaluate(() => window.__m('shadow'))
  reporter.check(
    'the shadow build renders exactly like the light one',
    same(
      [shadow.bar, shadow.inner, shadow.start, shadow.center, shadow.end, shadow.ext],
      [light.bar, light.inner, light.start, light.center, light.end, light.ext],
    ),
    JSON.stringify({ shadow, light }),
  )
}
