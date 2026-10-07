// `<mono-accordion>` after the Basecoat port. Three things only a browser can
// answer: the computed metrics against upstream's `summary` / `:not(summary)`,
// the group flattening (which reaches the element through `mono-grouped`, not a
// selector), and whether the light and shadow builds agree — the shadow root is
// invisible to a unit test.

export async function run({ port, page, reporter }) {
  await page.goto(`http://127.0.0.1:${port}/?fixture=accordion-attributes`, { waitUntil: 'load' })
  await page.waitForFunction(() => window.__ready === true, null, { timeout: 60000 })

  // ── 1. a standalone item: upstream's metrics, our frame ────────────────────
  const solo = await page.evaluate(() => window.__solo('light'))
  reporter.check(
    'default: the root attribute alone — every prop is at its default',
    JSON.stringify(solo.attrs) === JSON.stringify(['mono-accordion']),
    JSON.stringify(solo.attrs),
  )
  reporter.check(
    'the head is upstream `p-4` with a `text-sm font-medium` label',
    solo.headPadding[0] === 16 &&
      solo.headPadding[1] === 16 &&
      solo.titleFont === 14 &&
      solo.titleLineHeight === 20 &&
      solo.titleWeight === '500',
    JSON.stringify({
      padding: solo.headPadding,
      font: solo.titleFont,
      lh: solo.titleLineHeight,
      weight: solo.titleWeight,
    }),
  )
  reporter.check(
    'the chevron is `size-4` and the body `text-sm`',
    solo.arrow === 16 && solo.bodyFont === 14,
    JSON.stringify({ arrow: solo.arrow, body: solo.bodyFont }),
  )
  reporter.check(
    'standalone, the item keeps its own frame (EXTENSION: upstream has no standalone item)',
    solo.radius > 0 && solo.borderTop === 1 && solo.shadow !== 'none',
    JSON.stringify({ radius: solo.radius, border: solo.borderTop, shadow: solo.shadow.slice(0, 30) }),
  )
  reporter.check(
    'closed: the body track is collapsed',
    solo.bodyRows === '0px',
    `grid-template-rows=${solo.bodyRows}`,
  )

  // ── 2. open ────────────────────────────────────────────────────────────────
  const open = await page.evaluate(() => window.__open('light'))
  reporter.check(
    'open: `mono-open` on the root, the track expanded, the chevron rotated',
    open.attrs.includes('mono-open') &&
      open.bodyRows !== '0px' &&
      open.arrowRotate.startsWith('180') &&
      // `pb-4`, which only an OPEN body has — the collapsed one has no padding
      open.bodyPaddingBottom === 16,
    JSON.stringify({ attrs: open.attrs, rows: open.bodyRows, rotate: open.arrowRotate }),
  )

  // ── 3. the group flattens, and the last item drops its divider ─────────────
  for (const build of ['light', 'shadow']) {
    const items = await page.evaluate((b) => window.__group(b), build)
    const flat = items.every((i) => i.radius === 0 && i.shadow === 'none' && i.attrs.includes('mono-grouped'))
    reporter.check(
      `${build}: every item in a group is flattened (no radius, no shadow, mono-grouped)`,
      flat,
      JSON.stringify(items.map((i) => [i.radius, i.shadow.slice(0, 12), i.attrs.join(' ')])),
    )
    reporter.check(
      `${build}: a hairline between items, none after the last`,
      items.slice(0, -1).every((i) => i.divider === 1) && items[items.length - 1].divider === 0,
      JSON.stringify(items.map((i) => i.divider)),
    )
  }

  // ── 4. hand-written markup matches the element, and so does the shadow build ─
  const raw = await page.evaluate(() => window.__raw())
  const lightGroup = await page.evaluate(() => window.__group('light'))
  const shadowSolo = await page.evaluate(() => window.__solo('shadow'))
  const compare = (a, b, keys) => keys.every((k) => JSON.stringify(a[k]) === JSON.stringify(b[k]))
  const METRICS = [
    'radius',
    'borderTop',
    'divider',
    'headPadding',
    'titleFont',
    'titleLineHeight',
    'titleWeight',
    'arrow',
    'bodyFont',
    'bodyPaddingBottom',
  ]
  reporter.check(
    'the hand-written group renders exactly like the element one',
    raw.length === lightGroup.length && raw.every((r, i) => compare(r, lightGroup[i], METRICS)),
    JSON.stringify({ raw: raw[0], element: lightGroup[0] }),
  )
  reporter.check(
    'the shadow build renders exactly like the light one',
    compare(shadowSolo, solo, METRICS),
    JSON.stringify({ shadow: shadowSolo, light: solo }),
  )
}
