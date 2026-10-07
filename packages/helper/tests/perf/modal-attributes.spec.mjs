// `<mono-modal>` after the Basecoat port. Upstream's dialog is ONE padded box,
// which is the whole point of this spec: the panel pads and gaps, and the head /
// body / foot regions carry nothing of their own — no padding, no divider, no
// tint. That is a structural claim about computed style, and the shadow build
// keeps half of it behind a boundary, so only a browser can check it.

export async function run({ port, page, reporter }) {
  await page.goto(`http://127.0.0.1:${port}/?fixture=modal-attributes`, { waitUntil: 'load' })
  await page.waitForFunction(() => window.__ready === true, null, { timeout: 60000 })

  const transparent = (c) => c && c[3] === 0

  // ── 1. the closed root says only what it is ────────────────────────────────
  const closed = await page.evaluate(() => window.__m('light'))
  reporter.check(
    'closed: the root attribute alone — every prop is at its default',
    JSON.stringify(closed.attrs) === JSON.stringify(['mono-modal']),
    JSON.stringify(closed.attrs),
  )

  // ── 2. open: upstream's panel ──────────────────────────────────────────────
  const open = await page.evaluate(() => window.__open('light'))
  reporter.check(
    'open: `mono-open` lands on the root',
    open.attrs.includes('mono-open'),
    JSON.stringify(open.attrs),
  )
  reporter.check(
    'the panel is `p-6 gap-6 rounded-xl text-sm` on an opaque `bg-popover`',
    open.panel.padding === 24 &&
      open.panel.gap === 24 &&
      open.panel.radius === 14 &&
      open.panel.font === 14 &&
      open.panel.bg[3] === 1 &&
      open.panel.direction === 'column',
    JSON.stringify(open.panel),
  )
  reporter.check(
    'the panel defaults to upstream\'s `sm:max-w-md` container',
    open.panel.width === 448,
    `${open.panel.width}px, expected 448 (--mono-container-md)`,
  )
  reporter.check(
    'the backdrop is `bg-black/10 backdrop-blur-xs`',
    open.overlay.opacity === 1 &&
      open.overlay.bg[3] > 0 &&
      open.overlay.bg[3] < 0.2 &&
      open.overlay.filter.includes('blur'),
    JSON.stringify(open.overlay),
  )

  // ── 3. the regions carry NOTHING — the panel is the box ────────────────────
  reporter.check(
    'the head has no padding, no divider and no tint (the gradient bar is gone)',
    open.head.padding === 0 &&
      open.head.borderBottom === 0 &&
      transparent(open.head.bg),
    JSON.stringify(open.head),
  )
  reporter.check(
    'the body has no padding of its own',
    open.body.padding === 0 && open.body.font === 14,
    JSON.stringify(open.body),
  )
  reporter.check(
    'the foot has no padding, no divider and no tint',
    open.foot.padding === 0 && open.foot.borderTop === 0 && transparent(open.foot.bg),
    JSON.stringify(open.foot),
  )
  reporter.check(
    'the foot is upstream\'s action row — `sm:flex-row sm:justify-end gap-2`',
    open.foot.direction === 'row' && open.foot.justify === 'flex-end' && open.foot.gap === 8,
    JSON.stringify(open.foot),
  )
  reporter.check(
    'the title is `font-medium` at the panel\'s own size, and the ✕ is faded',
    open.title.weight === '500' && open.title.font === 14 && open.close.opacity === 0.7,
    JSON.stringify({ title: open.title, close: open.close }),
  )

  // ── 4. `size` is the DENSITY, never the width ──────────────────────────────
  const sized = await page.evaluate(() => window.__open('sized'))
  reporter.check(
    '`size="lg"` scales the padding and the type but leaves the measure alone',
    sized.panel.padding > open.panel.padding &&
      sized.title.font > open.title.font &&
      sized.panel.width === open.panel.width,
    JSON.stringify({ lg: sized.panel, md: open.panel }),
  )

  // ── 4b. `color` shows on the panel: a thin accent line on the ring + a halo ──
  const colored = await page.evaluate(() => window.__open('colored'))
  reporter.check(
    '`color="success"` adds a thin line of the accent and a faint halo under the elevation (the empty glow slot becomes two layers); no `color` adds nothing',
    colored.attrs.includes('mono-color=success') &&
      colored.panel.shadowLayers === open.panel.shadowLayers + 1 &&
      colored.panel.shadow !== open.panel.shadow,
    JSON.stringify({ colored: colored.panel.shadow, plain: open.panel.shadow }),
  )

  // ── 5. the two builds agree ────────────────────────────────────────────────
  const shadow = await page.evaluate(() => window.__open('shadow'))
  const same = (a, b) =>
    JSON.stringify([a.panel, a.head, a.title, a.body, a.foot, a.close]) ===
    JSON.stringify([b.panel, b.head, b.title, b.body, b.foot, b.close])
  reporter.check(
    'the shadow build renders exactly like the light one',
    same(shadow, open),
    JSON.stringify({ shadow, light: open }),
  )
}
