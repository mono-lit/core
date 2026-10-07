// The light and shadow builds must paint identically from identical markup.
//
// The docs derive their "Vue + Shadow DOM" tab from the Vue source by rewriting
// the tag and the import — nothing else — so the two tabs are fed byte-identical
// markup and any visual difference between them is a library bug.
//
// One shipped: the light build omits an empty prepend/append span, the shadow
// build always renders it (its `<slot>` must stay in the tree for
// `assignedNodes()` to work) and marks it `data-empty`. `:has()` matches on
// PRESENCE — `display: none` does not undo that — so
// `.mono-button:has(> .button-prepend)` fired on every shadow button, squaring
// both corners and dropping both side borders. Nine of ten button demos rendered
// differently, and it had been that way since affixes landed.
//
// `theme-parity.spec.mjs` already compared these two builds and missed it: its
// button entry listed typography only, while card / accordion / chip / file-upload
// all check `borderRadius`. That list is now fixed too; this spec is the breadth.

export async function run({ port, page, reporter }) {
  await page.goto(`http://127.0.0.1:${port}/?fixture=button-shadow-parity`, { waitUntil: 'load' })
  await page.waitForFunction(() => window.__ready === true, null, { timeout: 60000 })

  // ── the affix matrix: the mechanism, pinned ────────────────────────────────

  const m = await page.evaluate(() => window.__affixMatrix())

  const fmt = (v) => (v ? `${v.tl}/${v.tr} borders ${v.blw}/${v.brw}` : 'null')

  // A button with NO affix must keep all four corners in both builds. This is the
  // case that was broken for every text button in the shadow tab.
  reporter.check(
    'no affix: both builds keep the corners and the side borders',
    m.plain.light && m.plain.shadow &&
      m.plain.light.tl === m.plain.shadow.tl &&
      m.plain.light.tr === m.plain.shadow.tr &&
      m.plain.light.blw === m.plain.shadow.blw &&
      m.plain.light.brw === m.plain.shadow.brw &&
      m.plain.shadow.tl !== '0px',
    `light ${fmt(m.plain.light)} vs shadow ${fmt(m.plain.shadow)} ` +
      '(the shadow build renders an empty affix span; `:has()` sees it anyway)',
  )

  // One affix squares ONE side. The shadow build used to square both, because the
  // opposite span was present-but-empty.
  for (const [key, squared, kept] of [
    ['prepend-only', 'tl', 'tr'],
    ['append-only', 'tr', 'tl'],
  ]) {
    const v = m[key]
    reporter.check(
      `${key}: squares only that side, identically in both builds`,
      v.light && v.shadow &&
        v.light[squared] === '0px' && v.shadow[squared] === '0px' &&
        v.light[kept] !== '0px' && v.shadow[kept] === v.light[kept],
      `light ${fmt(v.light)} vs shadow ${fmt(v.shadow)}`,
    )
  }

  // The control. `both` agreed even while the bug was live — it is the one case
  // where the spans genuinely exist in each build — so if a "fix" ever inverts
  // the rule, this is what refuses to move.
  reporter.check(
    'both affixes: still squares both sides, in both builds',
    m.both.light && m.both.shadow &&
      m.both.light.tl === '0px' && m.both.light.tr === '0px' &&
      m.both.shadow.tl === '0px' && m.both.shadow.tr === '0px',
    `light ${fmt(m.both.light)} vs shadow ${fmt(m.both.shadow)} ` +
      '(the control: this agreed even while the bug was live)',
  )

  // ── the sweep: breadth across every demo shape ─────────────────────────────

  const sweep = await page.evaluate(() => window.__sweep())

  // A sweep that renders nothing passes every diff it does not run. Assert the
  // count first so an empty one cannot look like a clean one.
  reporter.check(
    'the sweep actually rendered a meaningful number of buttons',
    sweep.rendered >= 30,
    `rendered ${sweep.rendered} light/shadow pairs`,
  )

  const diverged = []
  let pairs = 0
  for (const [demo, rows] of Object.entries(sweep.demos)) {
    for (const row of rows) {
      pairs++
      if (row.light !== row.shadow) {
        diverged.push(`${demo}#${row.i}\n         light = ${row.light}\n        shadow = ${row.shadow}`)
      }
    }
  }

  reporter.check(
    `light === shadow across all ${pairs} demo shapes`,
    diverged.length === 0,
    `${diverged.length} diverge:\n        ${diverged.slice(0, 4).join('\n        ')}`,
  )

  // Called out separately because it is the arm the bug spared, and therefore the
  // one that would still pass if someone reintroduced the fault: these rules are
  // scoped to `.mono-button`, so `.mono-button-icon` was never affected.
  const iconRows = sweep.demos['icon-only'] ?? []
  reporter.check(
    'icon-only agrees too — the shape the affix rules never named',
    iconRows.length > 0 && iconRows.every((r) => r.light === r.shadow),
    `${iconRows.filter((r) => r.light !== r.shadow).length}/${iconRows.length} differ`,
  )

  // ── under a page reset ─────────────────────────────────────────────────────
  //
  // The arms above run on a bare page, where a UA default both builds inherit
  // reads as agreement. This one supplies the reset a real page has. See the
  // fixture — `<button>`'s UA `1px 6px` was overwritten for the text button and
  // never for the icon-only one, so the shadow icon buttons carried 6px of side
  // padding that their light twins, zeroed by the page, did not.

  const zone = await page.evaluate(() => window.__resetZone())

  const iconDiff = zone.icon.filter((r) => r.light !== r.shadow)
  reporter.check(
    'icon-only: light === shadow under a page reset, at every size',
    zone.icon.length === 6 && iconDiff.length === 0,
    `${iconDiff.length}/${zone.icon.length} differ:\n        ` +
      iconDiff.slice(0, 3).map((r) => `${r.size}: light ${r.light} vs shadow ${r.shadow}`).join('\n        ') +
      '\n        (a page reset does not cross a shadow boundary — the component must set its own)',
  )

  // The control: the text button always set its own padding, so it was never
  // affected. If a "fix" ever zeroes padding somewhere too broad, this moves.
  const textDiff = zone.text.filter((r) => r.light !== r.shadow)
  reporter.check(
    'text button: control — already immune, and still is',
    zone.text.length === 6 && textDiff.length === 0,
    `${textDiff.length}/${zone.text.length} differ:\n        ` +
      textDiff.slice(0, 3).map((r) => `${r.size}: light ${r.light} vs shadow ${r.shadow}`).join('\n        '),
  )

  // And the reset must genuinely be reaching the light build, or both halves are
  // simply untouched and the arm proves nothing.
  reporter.check(
    'the reset arm is live: the light icon button really is zeroed',
    zone.icon.length > 0 && zone.icon.every((r) => r.light.startsWith('0px | 0px | 0px | 0px')),
    `light padding read: ${zone.icon[0] ? zone.icon[0].light : '(none)'}`,
  )
}
