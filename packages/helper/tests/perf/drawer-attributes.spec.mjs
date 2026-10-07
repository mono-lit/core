// `<mono-drawer>` after the Basecoat port. Upstream's drawer is a `bg-popover`
// sheet pinned to one viewport edge: it rounds and borders ONLY the edge facing
// the content, its header / section / footer each bring `p-4`, and its footer is
// a COLUMN (the mobile-sheet idiom), not the right-aligned row the pre-port
// drawer had. The panel's paint lives on a `::before` layer so the four flavors
// that float it as an inset card have something to inset — which no unit test
// can see, and the shadow build keeps half of behind a boundary.

export async function run({ port, page, reporter }) {
  await page.goto(`http://127.0.0.1:${port}/?fixture=drawer-attributes`, { waitUntil: 'load' })
  await page.waitForFunction(() => window.__ready === true, null, { timeout: 60000 })

  const transparent = (c) => c && c[3] === 0

  // ── 1. the closed root says only what it is ────────────────────────────────
  const closed = await page.evaluate(() => window.__m('light'))
  reporter.check(
    'closed: the root attribute alone — every prop is at its default',
    JSON.stringify(closed.attrs) === JSON.stringify(['mono-drawer']),
    JSON.stringify(closed.attrs),
  )

  // ── 2. open: upstream's sheet ──────────────────────────────────────────────
  const open = await page.evaluate(() => window.__open('light'))
  reporter.check(
    'open: `mono-open` lands on the root, and `right` still emits no side',
    open.attrs.includes('mono-open') && !open.attrs.some((a) => a.startsWith('mono-position')),
    JSON.stringify(open.attrs),
  )
  reporter.check(
    'the panel is a fixed `flex-col` column at `text-sm`, and paints NOTHING itself',
    open.panel.position === 'fixed' &&
      open.panel.direction === 'column' &&
      open.panel.font === 14 &&
      open.panel.padding === 0 &&
      transparent(open.panel.bg),
    JSON.stringify(open.panel),
  )
  reporter.check(
    'the paint layer is the opaque `bg-popover` card, flush with the panel (inset 0)',
    open.paint.bg[3] === 1 && open.paint.inset.every((v) => v === 0),
    JSON.stringify(open.paint),
  )
  reporter.check(
    'a `right` drawer rounds and borders ONLY the edge facing the content',
    open.panel.radiusTopLeft === 14 &&
      open.panel.radiusTopRight === 0 &&
      open.paint.borderLeft === 1 &&
      open.paint.borderRight === 0 &&
      open.paint.borderTop === 0 &&
      open.paint.borderBottom === 0,
    JSON.stringify({ radius: open.panel, border: open.paint }),
  )
  reporter.check(
    'it takes upstream\'s `w-3/4 max-w-sm` measure, full viewport height',
    open.panel.width === 384 && open.panel.height > 400,
    JSON.stringify({ width: open.panel.width, height: open.panel.height }),
  )
  reporter.check(
    'the backdrop is `bg-black/10 backdrop-blur-xs`',
    open.overlay.opacity === 1 &&
      open.overlay.bg[3] > 0 &&
      open.overlay.bg[3] < 0.2 &&
      open.overlay.filter.includes('blur'),
    JSON.stringify(open.overlay),
  )

  // ── 3. the regions each bring `p-4`, and no bar is tinted any more ─────────
  reporter.check(
    'the header is `p-4` with no divider and no tint (the gradient bar is gone)',
    open.head.padding === 16 && open.head.borderBottom === 0 && transparent(open.head.bg),
    JSON.stringify(open.head),
  )
  reporter.check(
    'the header is a ROW — the ✕ lives in it (upstream\'s drawer has no close button)',
    open.head.direction === 'row' && open.head.justify === 'space-between' && open.head.gap === 6,
    JSON.stringify(open.head),
  )
  reporter.check(
    'the body is the scroller and is padded — the port\'s one deviation from `> section`',
    open.body.padding === 16 &&
      open.body.font === 14 &&
      open.body.overflowY === 'auto' &&
      open.body.flexGrow === '1',
    JSON.stringify(open.body),
  )
  reporter.check(
    'the footer is upstream\'s STACKED sheet — `mt-auto flex-col gap-2 p-4`, untinted',
    open.foot.padding === 16 &&
      open.foot.direction === 'column' &&
      open.foot.gap === 8 &&
      open.foot.borderTop === 0 &&
      transparent(open.foot.bg),
    JSON.stringify(open.foot),
  )
  reporter.check(
    'the title is `text-lg font-semibold` in its own case, and the ✕ is faded',
    open.title.font === 18 &&
      open.title.weight === '600' &&
      open.title.transform === 'none' &&
      open.close.opacity === 0.7,
    JSON.stringify({ title: open.title, close: open.close }),
  )

  // ── 4. `size` is the DENSITY, never the measure ────────────────────────────
  const sized = await page.evaluate(() => window.__open('sized'))
  reporter.check(
    '`size="lg"` scales the padding and the type but leaves the measure alone',
    sized.head.padding > open.head.padding &&
      sized.title.font > open.title.font &&
      sized.panel.width === open.panel.width,
    JSON.stringify({ lg: { pad: sized.head.padding, title: sized.title.font, w: sized.panel.width }, md: { pad: open.head.padding, title: open.title.font, w: open.panel.width } }),
  )

  // ── 5. the side is the mirror image ────────────────────────────────────────
  const left = await page.evaluate(() => window.__open('left'))
  reporter.check(
    '`position="left"` moves the rounded, bordered edge to the RIGHT',
    left.attrs.includes('mono-position=left') &&
      left.panel.radiusTopRight === 14 &&
      left.panel.radiusTopLeft === 0 &&
      left.paint.borderRight === 1 &&
      left.paint.borderLeft === 0,
    JSON.stringify({ attrs: left.attrs, radius: left.panel, border: left.paint }),
  )

  // ── 5b. `color` shows on the panel: the edge takes the accent + a halo ────
  const colored = await page.evaluate(() => window.__open('colored'))
  reporter.check(
    '`color="success"` tints the edge with the accent and fills the glow slot with a faint halo; no `color` keeps --border and an empty slot',
    colored.attrs.includes('mono-color=success') &&
      colored.paint.borderColor !== open.paint.borderColor &&
      open.paint.glow === 'rgba(0, 0, 0, 0) 0px 0px 0px 0px' &&
      colored.paint.glow.includes('24px') &&
      colored.paint.shadowLayers === open.paint.shadowLayers,
    JSON.stringify({ colored: colored.paint, plain: open.paint }),
  )

  // ── 6. the two builds agree ────────────────────────────────────────────────
  const shadow = await page.evaluate(() => window.__open('shadow'))
  const same = (a, b) =>
    JSON.stringify([a.panel, a.paint, a.head, a.title, a.body, a.foot, a.close, a.overlay]) ===
    JSON.stringify([b.panel, b.paint, b.head, b.title, b.body, b.foot, b.close, b.overlay])
  reporter.check(
    'the shadow build renders exactly like the light one',
    same(shadow, open),
    JSON.stringify({ shadow, light: open }),
  )
}
