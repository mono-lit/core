// `<mono-filter-builder>` after the Basecoat port. See the fixture for what is
// being claimed; these are the assertions that would catch it regressing.

export async function run({ port, page, reporter }) {
  await page.goto(`http://127.0.0.1:${port}/?fixture=filter-attributes`, { waitUntil: 'load' })
  await page.waitForFunction(() => window.__ready === true, null, { timeout: 60000 })
  const same = (a, b) => JSON.stringify(a) === JSON.stringify(b)

  const light = await page.evaluate(() => window.__m('light'))
  const shadow = await page.evaluate(() => window.__m('shadow'))
  const xs = await page.evaluate(() => window.__m('xs'))
  const ref = await page.evaluate(() => window.__ref())
  const tok = async (n) => page.evaluate((n) => window.__token(n), n)

  reporter.check(
    'default: the root attribute alone — size sm emits nothing',
    same(light.attrs, ['mono-filter-builder']),
    JSON.stringify(light.attrs),
  )
  reporter.check('size="xs" is mirrored on the root', same(xs.attrs, ['mono-filter-builder', 'mono-size']), JSON.stringify(xs.attrs))

  // ── the controls are the flavour's own field ─────────────────────────────
  reporter.check(
    'a control has the same height and corner as a real <mono-input size="sm"> beside it',
    Math.abs(light.ctl.h - ref.h) <= 1 && Math.abs(light.ctl.radius - ref.radius) <= 0.5,
    JSON.stringify({ ctl: light.ctl, ref }),
  )
  reporter.check('size="xs" is a smaller control than sm', xs.ctl.h < light.ctl.h && xs.ctl.font <= light.ctl.font, JSON.stringify({ xs: xs.ctl, sm: light.ctl }))
  reporter.check(
    'the control edge is `border-input`, not a --theme-* bridge',
    same(light.ctl.border, await tok('--input')),
    JSON.stringify({ border: light.ctl.border, input: await tok('--input') }),
  )

  // ── Apply is .btn, Clear is .btn[data-variant=outline], links are text-primary ──
  const primary = await tok('--primary')
  const onPrimary = await tok('--primary-foreground')
  reporter.check('Apply is bg-primary text-primary-foreground', same(light.apply.bg, primary) && same(light.apply.ink, onPrimary), JSON.stringify({ apply: light.apply, primary, onPrimary }))
  reporter.check('Apply stands as tall as a control, at the button corner', Math.abs(light.apply.h - light.ctl.h) <= 1, JSON.stringify({ apply: light.apply.h, ctl: light.ctl.h }))
  reporter.check(
    'Clear is the outline button: bg-background with the input edge, inked foreground',
    same(light.clear.bg, await tok('--background')) && same(light.clear.border, await tok('--input')) && same(light.clear.ink, await tok('--foreground')),
    JSON.stringify(light.clear),
  )
  reporter.check('the add links are text-primary on nothing', same(light.link.ink, primary) && /rgba\(0, 0, 0, 0\)|transparent/.test(light.link.bg), JSON.stringify(light.link))
  reporter.check('an icon button is a square the height of a control, muted at rest', Math.abs(light.icon.w - light.ctl.h) <= 1 && same(light.icon.ink, await tok('--muted-foreground')), JSON.stringify({ icon: light.icon, ctl: light.ctl.h }))
  reporter.check('a nested group hangs off a dashed guide in the page border', light.nested.guide === 'dashed ' + (await tok('--border')) && light.nested.indent === 20, JSON.stringify(light.nested))

  // ── no --theme-* bridge anywhere in the sheet ────────────────────────────
  const reads = await page.evaluate(() => window.__reads())
  reporter.check('no filter rule reads a --theme-* bridge', reads.length === 0, JSON.stringify(reads.slice(0, 4)))

  // ── shadow === light ─────────────────────────────────────────────────────
  const strip = (m) => ({ ...m, attrs: undefined })
  reporter.check('the shadow build paints the same numbers as the light build', same(strip(light), strip(shadow)), JSON.stringify({ light: strip(light), shadow: strip(shadow) }))
}
