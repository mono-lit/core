// `<mono-breadcrumb>` after the Basecoat port. Upstream's breadcrumb is a row
// of muted BARE links — `m-0 p-0 list-none flex gap-1.5 text-sm
// text-muted-foreground`, an `<a>` with nothing but `rounded-sm` for the focus
// ring, and a current crumb that is `font-normal text-foreground`. The pre-port
// sheet padded every segment into a 5px chip, bolded the current one and inked
// it in the brand — and reached `--theme-*` plus a parallel set of `--*-rgb`
// triples to do it. These are the assertions that catch any of that returning.

export async function run({ port, page, reporter }) {
  await page.goto(`http://127.0.0.1:${port}/?fixture=breadcrumb-attributes`, { waitUntil: 'load' })
  await page.waitForFunction(() => window.__ready === true, null, { timeout: 60000 })

  const same = (a, b) => JSON.stringify(a) === JSON.stringify(b)

  // ── 1. the default root says only what it is ───────────────────────────────
  const light = await page.evaluate(() => window.__m('light'))
  reporter.check(
    'default: the root attribute alone — every prop is at its default',
    JSON.stringify(light.attrs) === JSON.stringify(['mono-breadcrumb']),
    JSON.stringify(light.attrs),
  )

  // ── 2. the list is upstream's flex row, stripped of every <ol> default ─────
  const muted = await page.evaluate(() => window.__token('--muted-foreground'))
  reporter.check(
    'the <ol> is `m-0 p-0 list-none flex flex-wrap items-center` at `text-sm`',
    light.list.display === 'flex' &&
      light.list.wrap === 'wrap' &&
      light.list.padLeft === 0 &&
      light.list.margin === '0px' &&
      light.list.listStyle === 'none' &&
      light.list.font === 14,
    JSON.stringify(light.list),
  )
  reporter.check(
    'the row is inked `text-muted-foreground`, not a `--theme-*` bridge',
    same(light.list.color, muted),
    JSON.stringify({ list: light.list.color, muted }),
  )
  reporter.check(
    // `inline-flex` blockifies to `flex` on a flex ITEM — the <li>s are children
    // of the flex <ol> — so that is what upstream's `inline-flex` computes to here.
    'the gap is `sm:gap-2.5` at this width, and each <li> is `inline-flex gap-1.5`',
    light.list.gap === 10 && light.item.display === 'flex' && light.item.gap === 6,
    JSON.stringify({ list: light.list.gap, item: light.item }),
  )

  // ── 3. the action is BARE — the port's headline change ────────────────────
  reporter.check(
    'a segment is a bare link: no padding, no fill, and only the focus ring\'s radius',
    light.action.tag === 'A' &&
      light.action.padX === 0 &&
      light.action.padY === 0 &&
      light.action.bg[3] === 0 &&
      light.action.radius > 0 &&
      light.action.radius <= 6,
    JSON.stringify(light.action),
  )
  reporter.check(
    'and it is not underlined, whatever the host page does to links',
    light.action.decoration === 'none',
    light.action.decoration,
  )

  // ── 4. the current crumb ──────────────────────────────────────────────────
  const primary = await page.evaluate(() => window.__token('--primary'))
  const foreground = await page.evaluate(() => window.__token('--foreground'))
  reporter.check(
    'the current crumb is a <span>, `font-normal`, not a button, cursor default',
    light.current.tag === 'SPAN' &&
      light.current.weight === '400' &&
      light.current.cursor === 'default',
    JSON.stringify(light.current),
  )
  reporter.check(
    'DEVIATION: it takes the colour ROLE, and `color="surface"` gives upstream\'s `--foreground`',
    same(light.current.color, primary) &&
      same((await page.evaluate(() => window.__m('surface'))).current.color, foreground),
    JSON.stringify({ primary: light.current.color, expected: primary }),
  )

  // ── 5. the separator and the badge ────────────────────────────────────────
  reporter.check(
    'the separator is a muted inline-flex <li> at the row\'s own size',
    light.sep.display === 'flex' && light.sep.font === 14 && same(light.sep.color, muted),
    JSON.stringify(light.sep),
  )
  const info = await page.evaluate(() => window.__token('--info'))
  reporter.check(
    'the badge borrows `.badge` — h-5 rounded-4xl text-xs — and inks tonally in its role',
    light.badge.height === 20 &&
      light.badge.radius === 32 &&
      light.badge.font === 12 &&
      same(light.badge.color, info) &&
      light.badge.bg[3] > 0 &&
      light.badge.bg[3] < 1,
    JSON.stringify({ badge: light.badge, info }),
  )

  // ── 6. the two EXTENSION variants ─────────────────────────────────────────
  const contained = await page.evaluate(() => window.__m('contained'))
  const success = await page.evaluate(() => window.__token('--success'))
  reporter.check(
    '`contained` is where the pre-port chip lives now — padded, filled, bordered',
    contained.action.padX > 0 && contained.action.padY > 0 && contained.action.bg[3] === 1,
    JSON.stringify(contained.action),
  )
  reporter.check(
    'and its current crumb is a FLAT role fill, not the old gradient + glow',
    same(contained.current.bg, success),
    JSON.stringify({ bg: contained.current.bg, success }),
  )

  const underlined = await page.evaluate(() => window.__m('underlined'))
  reporter.check(
    '`underlined` squares the segment off and rules the current one',
    underlined.action.radius === 0,
    JSON.stringify(underlined.action),
  )

  // ── 7. size is the type scale; truncate clamps the label ──────────────────
  const sized = await page.evaluate(() => window.__m('sized'))
  reporter.check(
    '`size="lg"` scales the row\'s type and its gap together',
    sized.list.font > light.list.font && sized.list.gap > light.list.gap,
    JSON.stringify({ lg: sized.list, md: light.list }),
  )
  const truncated = await page.evaluate(() => window.__m('truncated'))
  reporter.check(
    // It CLAMPS; it does not force one line. Forcing `nowrap` either overflowed
    // the container or squeezed short labels that had room.
    '`truncate` clamps the label to a ceiling and still wraps',
    truncated.title.overflow === 'hidden' &&
      truncated.title.maxWidth !== 'none' &&
      truncated.list.wrap === 'wrap',
    JSON.stringify({ title: truncated.title, wrap: truncated.list.wrap }),
  )

  // ── 8. the two builds agree ───────────────────────────────────────────────
  const shadow = await page.evaluate(() => window.__m('shadow'))
  reporter.check(
    'the shadow build renders exactly like the light one',
    same(
      [shadow.list, shadow.item, shadow.action, shadow.current, shadow.sep, shadow.badge],
      [light.list, light.item, light.action, light.current, light.sep, light.badge],
    ),
    JSON.stringify({ shadow, light }),
  )
}
