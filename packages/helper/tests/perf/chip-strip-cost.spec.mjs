// `chip.behaviour: 'inline'` — the COST guard, not the behaviour guard.
//
// The behaviour of the strip (buttons appear, paging aligns to a chip, the wheel
// is inert) is exercised elsewhere. What broke a real screen was the price:
// measuring on every render, and animating the scroll.
//
// Three regressions, one assertion each, all counters:
//
//   1. A `flex` field must be COMPLETELY inert. The controller used to run
//      `hostUpdated()` on every instance regardless of mode, so every tag-input
//      and dropdown-table on the page paid a querySelector + forced layout per
//      render for a feature it wasn't using.
//   2. Nothing may schedule an update from `updated()`. `sync()` called
//      `host.requestUpdate()` from `hostUpdated`, which is exactly what Lit's
//      `change-in-update` warning reports; with the dropdown open and a
//      `searchable` field re-rendering constantly, the extra passes compounded
//      into "This page is slowing down".
//   3. Paging must emit ~1 scroll event. `scroll-behavior: smooth` emitted one
//      per frame, and `PopupPortalController` listens for `scroll` on `window` in
//      the CAPTURE phase — so each one repositioned the open dropdown, forcing a
//      layout and a `getComputedStyle` ancestor walk.
//
// Plus the gap contract, which is a design rule that kept regressing: merely
// OPENING the dropdown focuses the input, so keying the typing area off `:focus`
// re-opened a ~110px void for the entire time the field was in use.

const settle = (page, ms) => page.waitForTimeout(ms)

export async function run({ port, page, reporter }) {
  await page.goto(`http://127.0.0.1:${port}/?fixture=chip-strip`, { waitUntil: 'load' })
  await page.waitForFunction(() => window.__ready === true, null, { timeout: 60000 })
  await settle(page, 500)

  // ── 1. flex mode is inert ──────────────────────────────────────────────────
  // Driven by real re-renders, and asserted on the STRIP LOOKUP rather than on an
  // update count: with no strip in the DOM the measurement finds nothing and flips
  // no flag, so an update counter stays flat even while the controller runs on
  // every single render. The lookup is the thing that must not happen.
  await page.evaluate(() => window.__setInline(false))
  await settle(page, 400)
  await page.evaluate(() => window.__reset())
  await page.evaluate(() => window.__churn(10))
  await settle(page, 400)
  const flex = await page.evaluate(() => window.__stats())

  reporter.check(
    'flex mode never even looks for the strip',
    flex.stripQueries === 0,
    `strip lookups=${flex.stripQueries} across 10 renders (must be 0 — every field on the page pays this)`,
  )
  reporter.check(
    'flex mode drives ZERO updates of its own',
    flex.updates === 10,
    `updates=${flex.updates} for 10 forced renders (extra ones are the controller re-rendering)`,
  )

  // ── 2. inline settles, idle and with the panel open ────────────────────────
  await page.evaluate(() => window.__setInline(true))
  await settle(page, 600)
  await page.evaluate(() => window.__reset())
  await settle(page, 1000)
  const inlineIdle = await page.evaluate(() => window.__stats())

  reporter.check(
    'inline mode settles when idle',
    inlineIdle.updates === 0,
    `updates=${inlineIdle.updates} in 1s of doing nothing`,
  )

  await page.evaluate(() => window.__open())
  await settle(page, 700)
  await page.evaluate(() => window.__reset())
  await settle(page, 1200)
  const openIdle = await page.evaluate(() => window.__stats())

  reporter.check(
    'inline mode settles with the dropdown OPEN',
    openIdle.updates === 0,
    `updates=${openIdle.updates} in 1.2s with the panel open`,
  )
  // NOTE: there is deliberately no `change-in-update` assertion here. The harness
  // bundles with `NODE_ENV=production` (harness.mjs), which compiles Lit's dev
  // warnings out entirely — `warns` can only ever be 0, so asserting on it would
  // pass whatever the code did. The counters below are what actually bite.

  // ── 3. paging is cheap ─────────────────────────────────────────────────────
  const hasNext = await page.evaluate(() => window.__hasNext())
  reporter.check('the forward button renders (the strip overflows)', hasNext, `hasNext=${hasNext}`)

  if (hasNext) {
    await page.evaluate(() => window.__reset())
    await page.evaluate(() => window.__pageNext())
    await settle(page, 800)
    const paged = await page.evaluate(() => window.__stats())

    reporter.check(
      'paging costs a bounded number of updates',
      paged.updates > 0 && paged.updates <= 4,
      `updates=${paged.updates} for one click`,
    )
    reporter.check(
      'paging emits ~1 capture-phase scroll, not one per frame',
      paged.scrolls <= 3,
      `window capture scrolls=${paged.scrolls} (smooth scrolling made this ~30, each repositioning the open popup)`,
    )
    reporter.check(
      'paging does not re-query the strip once per frame',
      paged.stripQueries <= 6,
      `strip lookups=${paged.stripQueries} for one click`,
    )
  }

  // ── 3b. selecting a row: the path that actually flips the flags ────────────
  // This is where measuring from `hostUpdated()` shows itself — adding a chip
  // changes the overflow, so the flags flip, so `requestUpdate()` is called from
  // inside `updated()`. Idle assertions cannot catch that; only a real mutation can.
  await page.evaluate(() => window.__reset())
  const rowCount = await page.evaluate(() => window.__toggleRow(0))
  await settle(page, 800)
  const picked = await page.evaluate(() => window.__stats())

  reporter.check('the option list rendered rows to tick', rowCount > 0, `rows=${rowCount}`)
  reporter.check(
    'ticking a row costs a bounded number of renders',
    picked.updates > 0 && picked.updates <= 8,
    `updates=${picked.updates} for one tick`,
  )
  reporter.check(
    'ticking a row measures the strip once, not once per render',
    picked.stripQueries <= 6,
    `strip lookups=${picked.stripQueries} for one tick`,
  )

  // ── 3c. paging must not move the layout ───────────────────────────────────
  // The glitch this guards: the scroll buttons sit in the same flex row as the
  // strip, so showing or hiding one changes the strip's `clientWidth` by ~25px
  // (a 1.375rem button plus the row's 0.2rem gap at md). `_scrollTo` sets
  // `scrollLeft` against the width measured BEFORE that re-render, so when the
  // width moves the browser silently re-clamps and the chips slide sideways.
  //
  // Asserted on GEOMETRY, not on which buttons exist — a button-count assertion
  // passes throughout this bug.
  const walk = await page.evaluate(async () => {
    const steps = []
    // Back to the start first, so the walk covers both ends of the range.
    for (let i = 0; i < 20 && window.__hasPrev(); i++) {
      window.__pagePrev()
      await new Promise((r) => setTimeout(r, 60))
    }
    for (let i = 0; i < 20 && window.__hasNext(); i++) {
      const before = window.__geom()
      window.__pageNext()
      const justAfter = window.__geom() // synchronous: what the click asked for
      await new Promise((r) => setTimeout(r, 120)) // let render + observers settle
      const settled = window.__geom()
      steps.push({ before, justAfter, settled })
    }
    return steps
  })

  reporter.check('the walk actually paged', walk.length >= 2, `steps=${walk.length}`)

  const widthMoved = walk.filter((s) => s.before.clientWidth !== s.settled.clientWidth)
  reporter.check(
    'paging never changes the strip width',
    widthMoved.length === 0,
    widthMoved.length
      ? `${widthMoved.length}/${walk.length} clicks resized the strip, e.g. ${widthMoved[0].before.clientWidth}px -> ${widthMoved[0].settled.clientWidth}px`
      : `${walk.length} clicks, width steady at ${walk[0]?.settled.clientWidth}px`,
  )

  const actionsMoved = walk.filter((s) => s.before.actionsWidth !== s.settled.actionsWidth)
  reporter.check(
    'paging never changes the actions row width',
    actionsMoved.length === 0,
    actionsMoved.length
      ? `${actionsMoved.length}/${walk.length} clicks resized the row, e.g. ${actionsMoved[0].before.actionsWidth}px -> ${actionsMoved[0].settled.actionsWidth}px`
      : `steady at ${walk[0]?.settled.actionsWidth}px`,
  )

  // The jump itself: where the click landed vs where it ended up.
  const slid = walk
    .map((s) => ({ ...s, drift: Math.abs(s.justAfter.scrollLeft - s.settled.scrollLeft) }))
    .filter((s) => s.drift > 1)
  reporter.check(
    'the chips stay where the click put them (no re-clamp)',
    slid.length === 0,
    slid.length
      ? `${slid.length}/${walk.length} clicks slid afterwards, worst ${Math.max(...slid.map((s) => s.drift))}px`
      : `${walk.length} clicks, no drift`,
  )

  // ── 4. typing settles ──────────────────────────────────────────────────────
  await page.evaluate(() => window.__reset())
  await page.evaluate(() => window.__type('Mark'))
  await settle(page, 800)
  const typed = await page.evaluate(() => window.__stats())

  reporter.check(
    'typing settles instead of churning',
    typed.updates < 40,
    `updates=${typed.updates}`,
  )

  // ── 5. the gap contract ────────────────────────────────────────────────────
  await page.evaluate(() => window.__type(''))
  await page.evaluate(() => window.__focusInput())
  await settle(page, 300)
  const focused = await page.evaluate(() => window.__gap())

  reporter.check(
    'focused + empty reserves only a caret slot',
    focused && focused.focused && focused.inputW <= 24,
    `inputW=${focused?.inputW} gap=${focused?.gap} (a full typing area here is the ~110px void)`,
  )

  await page.evaluate(() => window.__blurInput())
  await settle(page, 300)
  const blurred = await page.evaluate(() => window.__gap())

  reporter.check(
    'blurred collapses the input entirely',
    blurred && blurred.inputW <= 1,
    `inputW=${blurred?.inputW} gap=${blurred?.gap}`,
  )

  await page.evaluate(() => window.__type('Mark'))
  await settle(page, 300)
  const typing = await page.evaluate(() => window.__gap())

  reporter.check(
    'typing opens a real typing area',
    typing && typing.inputW >= 90,
    `inputW=${typing?.inputW}`,
  )
}
