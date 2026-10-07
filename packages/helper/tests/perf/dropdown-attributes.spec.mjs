// `<mono-dropdown>` renders its Basecoat styling ATTRIBUTES on the ROOT — the
// host in the light build — mirroring the props one for one, plus the states
// `mono-open` / `mono-disabled` and the `mono-fixed` marker that says the
// element positions the panel itself.
//
// This lives in the browser harness rather than a unit test on purpose: the
// light build applies the root's class AND attributes imperatively behind an
// `isServer` guard, and lit's `isServer` is TRUE under vitest's jsdom (it
// resolves lit's node build), so nothing would be applied there.

export async function run({ port, page, reporter }) {
  await page.goto(`http://127.0.0.1:${port}/?fixture=dropdown-attributes`, { waitUntil: 'load' })
  await page.waitForFunction(() => window.__ready === true, null, { timeout: 60000 })

  // ── 1. a default dropdown: the root attribute, and nothing for defaults ─────
  const plain = await page.evaluate(() => window.__attrs('plain'))
  reporter.check(
    'default: only `mono-dropdown` and the `mono-fixed` marker',
    JSON.stringify(plain.attrs) === JSON.stringify(['mono-dropdown', 'mono-fixed']),
    JSON.stringify(plain.attrs),
  )
  reporter.check(
    'default: the parts render (activator / panel / body), panel closed',
    plain.hasActivator && plain.hasPanel && plain.hasBody && plain.ariaHidden === 'true',
    JSON.stringify(plain),
  )
  reporter.check(
    'the pre-Basecoat class stays as an inert hook',
    plain.legacyClass === true,
    `legacyClass=${plain.legacyClass}`,
  )
  reporter.check(
    'the `offset` prop default is Basecoat mt-1 (4px), matching the CSS default',
    plain.offset === 4,
    `offset=${plain.offset}`,
  )

  // ── 2. props mirror, placement splits into the side/align pair ──────────────
  const props = await page.evaluate(() => window.__attrs('props'))
  const want = [
    'mono-align=end',
    'mono-color=success',
    'mono-dropdown',
    'mono-fixed',
    'mono-placement=top-end',
    'mono-side=top',
    'mono-size=lg',
    'mono-trigger=hover',
  ]
  reporter.check(
    'props mirror onto the root, placement as the side/align pair',
    JSON.stringify(props.attrs) === JSON.stringify(want),
    JSON.stringify(props.attrs),
  )

  const centre = await page.evaluate(() => window.__attrs('centre'))
  reporter.check(
    'a bare side placement is centre-aligned (floating-ui convention)',
    centre.attrs.includes('mono-side=left') && centre.attrs.includes('mono-align=center'),
    JSON.stringify(centre.attrs),
  )

  const states = await page.evaluate(() => window.__attrs('states'))
  reporter.check(
    '`disabled` mirrors as a state attribute',
    states.attrs.includes('mono-disabled'),
    JSON.stringify(states.attrs),
  )

  // ── 3. open / close drives BOTH the root state and the panel's aria-hidden ──
  const opened = await page.evaluate(() => window.__setOpen('plain', true))
  reporter.check(
    'open: `mono-open` on the root AND aria-hidden="false" on the panel',
    opened.rootOpen === true && opened.ariaHidden === 'false',
    JSON.stringify(opened),
  )
  reporter.check(
    'open: the panel is actually visible',
    opened.visibility === 'visible' && opened.opacity === '1',
    JSON.stringify(opened),
  )

  const closed = await page.evaluate(() => window.__setOpen('plain', false))
  reporter.check(
    'close: both flip back, and the panel hides',
    closed.rootOpen === false && closed.ariaHidden === 'true' && closed.visibility === 'hidden',
    JSON.stringify(closed),
  )
}
