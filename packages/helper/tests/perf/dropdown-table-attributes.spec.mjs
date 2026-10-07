// `<mono-dropdown-table>` after the Basecoat port. See the fixture for what is
// being claimed; these are the assertions that would catch it regressing.

export async function run({ port, page, reporter }) {
  await page.goto(`http://127.0.0.1:${port}/?fixture=dropdown-table-attributes`, { waitUntil: 'load' })
  await page.waitForFunction(() => window.__ready === true, null, { timeout: 60000 })
  const same = (a, b) => JSON.stringify(a) === JSON.stringify(b)

  const light = await page.evaluate(() => window.__m('light'))
  const shadow = await page.evaluate(() => window.__m('shadow'))
  const xs = await page.evaluate(() => window.__m('xs'))
  const single = await page.evaluate(() => window.__m('single'))
  const ref = await page.evaluate(() => window.__ref())
  const tok = async (n) => page.evaluate((n) => window.__token(n), n)

  reporter.check(
    'default: the root attribute, the states, and nothing for default-valued props',
    same(light.attrs, ['mono-clearable', 'mono-dropdown-table', 'mono-has-value', 'mono-multiple', 'mono-side']),
    JSON.stringify(light.attrs),
  )
  reporter.check('size="xs" is mirrored on the root', xs.attrs.includes('mono-size'), JSON.stringify(xs.attrs))

  // ── the trigger is the tag-input's chip box ──────────────────────────────
  reporter.check(
    'the trigger has the same height, corner and edge as a real <mono-tag-input> beside it',
    Math.abs(light.trigger.h - ref.trigger.h) <= 1 && Math.abs(light.trigger.radius - ref.trigger.radius) <= 0.5 && same(light.trigger.border, ref.trigger.border),
    JSON.stringify({ trigger: light.trigger, ref: ref.trigger }),
  )
  reporter.check(
    'the trigger edge is `border-input`, not a --theme-* bridge',
    same(light.trigger.border, await tok('--input')),
    JSON.stringify({ border: light.trigger.border, input: await tok('--input') }),
  )
  reporter.check('size="xs" is a smaller field than md', xs.trigger.h < light.trigger.h && xs.chip.h < light.chip.h, JSON.stringify({ xs: xs.trigger, md: light.trigger }))
  reporter.check(
    'a text value sits at the select inset (px-3), the chips at the chip-box inset (px-1.5)',
    single.valueInset > light.valueInset && Math.abs(single.trigger.padX + single.valueInset - 12) <= 0.5,
    JSON.stringify({ single: { padX: single.trigger.padX, inset: single.valueInset }, multi: { padX: light.trigger.padX, inset: light.valueInset } }),
  )

  // ── a chip is a tag chip ─────────────────────────────────────────────────
  reporter.check(
    'a selection chip is the same box as a tag-input chip: h-5.5 rounded-sm bg-muted',
    Math.abs(light.chip.h - ref.chip.h) <= 0.5 && Math.abs(light.chip.radius - ref.chip.radius) <= 0.5 && same(light.chip.bg, ref.chip.bg) && same(light.chip.bg, await tok('--muted')),
    JSON.stringify({ chip: light.chip, ref: ref.chip, muted: await tok('--muted') }),
  )
  reporter.check('the clear glyph is a size-6 ghost button, muted at rest', Math.abs(light.clear.w - 24) <= 0.5 && same(light.clear.ink, await tok('--muted-foreground')), JSON.stringify(light.clear))

  // ── the panel and its rows ───────────────────────────────────────────────
  const open = await page.evaluate(() => window.__open())
  reporter.check('the portal mirrors the wrapper attributes and the panel is a fixed flex column', open.portalMirrors && open.panel?.display === 'flex' && open.panel?.position === 'fixed', JSON.stringify(open))
  reporter.check('the panel is bg-popover', same(open.panel?.bg, await tok('--popover')), JSON.stringify({ panel: open.panel, popover: await tok('--popover') }))
  reporter.check(
    "a picked row is the table's own selected row — mono-selected, bg-muted",
    open.rows === 3 && !!open.picked && open.picked.attrs.includes('mono-selected') && same(open.picked.bg, await tok('--muted')),
    JSON.stringify({ picked: open.picked, muted: await tok('--muted') }),
  )
  reporter.check('an unpicked row is a pointer on the row surface', open.plain?.cursor === 'pointer' && same(open.plain?.bg, await tok('--background')), JSON.stringify({ plain: open.plain, background: await tok('--background') }))

  // ── no --theme-* bridge anywhere in the sheet ────────────────────────────
  const reads = await page.evaluate(() => window.__reads())
  reporter.check('no dropdown-table rule reads a --theme-* bridge', reads.length === 0, JSON.stringify(reads.slice(0, 4)))

  // ── shadow === light ─────────────────────────────────────────────────────
  const strip = (m) => ({ ...m, attrs: undefined })
  reporter.check('the shadow build paints the same numbers as the light build', same(strip(light), strip(shadow)), JSON.stringify({ light: strip(light), shadow: strip(shadow) }))
}
