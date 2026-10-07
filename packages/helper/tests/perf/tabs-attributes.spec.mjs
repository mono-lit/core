// `<mono-tabs>` after the Basecoat port. The strip IS upstream's
// `[role='tablist']`, so the checks here are against upstream's own numbers —
// `h-9 rounded-lg p-[3px] bg-muted` with a `text-sm font-medium` tab, the
// selected pill at `bg-background shadow-sm`, and the line variant's `::after`
// bar. A pseudo-element, a shadow root and a `color-mix` ink are all things only
// a browser can report.

export async function run({ port, page, reporter }) {
  await page.goto(`http://127.0.0.1:${port}/?fixture=tabs-attributes`, { waitUntil: 'load' })
  await page.waitForFunction(() => window.__ready === true, null, { timeout: 60000 })

  // ── 1. the default strip is upstream's line variant ────────────────────────
  const line = await page.evaluate(() => window.__m('light-underline'))
  reporter.check(
    'default: the root attribute and the tablist ARIA, nothing else',
    JSON.stringify(line.attrs) === JSON.stringify(['aria-orientation=horizontal', 'mono-tabs']),
    JSON.stringify(line.attrs),
  )
  reporter.check(
    'the tab is `text-sm font-medium` with `px-2 py-1` and `rounded-md`',
    line.tab.font === 14 && line.tab.weight === '500' &&
      line.tab.padding[0] === 4 && line.tab.padding[1] === 8 && line.tab.radius === 8,
    JSON.stringify(line.tab),
  )
  reporter.check(
    'line: a bare strip — transparent, no radius (upstream `rounded-none bg-transparent`)',
    line.strip.bg[3] === 0 && line.strip.radius === 0 && line.strip.gap === 4,
    JSON.stringify(line.strip),
  )
  reporter.check(
    'line: the selected tab is revealed by the ::after bar, not a fill',
    line.selected.bg[3] === 0 &&
      line.selected.barOpacity === 1 &&
      line.selected.barHeight === 2 &&
      line.idle.barOpacity === 0,
    JSON.stringify({ selected: line.selected, idle: line.idle }),
  )
  reporter.check(
    'an idle tab is inked at `foreground/60`, not full strength',
    line.idle.ink[3] > 0 && line.idle.ink[3] < 1,
    JSON.stringify(line.idle.ink),
  )

  // ── 2. pill — upstream's DEFAULT tablist ───────────────────────────────────
  const pill = await page.evaluate(() => window.__m('light-pill'))
  reporter.check(
    'pill: `h-9 rounded-lg p-[3px] bg-muted` — upstream\'s own tablist',
    pill.strip.height === 36 &&
      pill.strip.radius === 10 &&
      pill.strip.padding === 3 &&
      pill.strip.bg[3] === 1,
    JSON.stringify(pill.strip),
  )
  reporter.check(
    'pill: the selected tab is `bg-background shadow-sm`, and no bar shows',
    pill.selected.bg[3] === 1 &&
      pill.selected.shadow !== 'none' &&
      pill.selected.barOpacity === 0 &&
      pill.idle.bg[3] === 0,
    JSON.stringify({ selected: pill.selected, idle: pill.idle }),
  )

  // ── 3. ghost — our extension: a tint, not a raised pill ────────────────────
  const ghost = await page.evaluate(() => window.__m('light-ghost'))
  reporter.check(
    'ghost: a bare strip whose selected tab holds a tint',
    ghost.strip.bg[3] === 0 &&
      ghost.selected.bg[3] > 0 &&
      ghost.selected.bg[3] < 1 &&
      ghost.selected.shadow === 'none',
    JSON.stringify({ strip: ghost.strip, selected: ghost.selected }),
  )

  // ── 4. vertical — upstream's `aria-orientation` axis ───────────────────────
  const vertical = await page.evaluate(() => window.__m('light-vertical'))
  reporter.check(
    'vertical: the strip stacks and its tabs fill the width, left-aligned',
    vertical.attrs.includes('aria-orientation=vertical') &&
      vertical.strip.direction === 'column' &&
      vertical.tab.justify === 'flex-start',
    JSON.stringify({ attrs: vertical.attrs, strip: vertical.strip, tab: vertical.tab }),
  )
  reporter.check(
    'vertical: the bar moves to the inline edge',
    vertical.selected.barHeight !== 2 && vertical.selected.barOpacity === 1,
    JSON.stringify(vertical.selected),
  )

  // ── 5. selection follows the ARIA state ────────────────────────────────────
  const moved = await page.evaluate(() => window.__select('light-underline', 'c'))
  reporter.check(
    'selecting a tab moves `aria-selected` and the bar with it',
    JSON.stringify(moved.map((t) => [t.selected, t.barOpacity])) ===
      JSON.stringify([['false', 0], ['false', 0], ['true', 1]]),
    JSON.stringify(moved),
  )

  // ── 6. the three renderings agree ──────────────────────────────────────────
  const raw = await page.evaluate(() => window.__raw())
  const shadowPill = await page.evaluate(() => window.__m('shadow-pill'))
  const shadowLine = await page.evaluate(() => window.__m('shadow-underline'))
  const same = (a, b) =>
    JSON.stringify([a.strip, a.tab, a.selected]) === JSON.stringify([b.strip, b.tab, b.selected])
  reporter.check(
    'the hand-written pill strip renders exactly like the element one',
    same(raw, pill),
    JSON.stringify({ raw, element: pill }),
  )
  reporter.check(
    'the shadow build renders exactly like the light one (pill)',
    same(shadowPill, pill),
    JSON.stringify({ shadow: shadowPill, light: pill }),
  )
  reporter.check(
    'the shadow build renders exactly like the light one (line)',
    same(shadowLine, line),
    JSON.stringify({ shadow: shadowLine, light: line }),
  )
}
