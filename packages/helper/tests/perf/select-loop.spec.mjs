// `<mono-select searchable>` rendered once per row — the shape a grid with an inline
// select editor produces, especially behind `v-show` (every row mounts one).
//
// `searchable` turned out NOT to be the cause. It is measured here anyway, as the
// `not-searchable` arm, precisely so that stays visible: it swaps a <button> for an
// <input> and nothing else, and the two arms mount the same.
//
// Two measurement lessons are baked into the assertions below, and both were learned
// the hard way while writing them:
//
// 1. ABSOLUTE MILLISECONDS ARE NOT EVIDENCE ON THIS BOX. The same build measured
//    120ms and 220ms for the same thing minutes apart. Every budget here is therefore
//    a RATIO taken inside ONE run — mount at 60 options/select against mount at 1 —
//    which does not care how fast the machine is that day.
//
// 2. A TIMING ASSERTION COULD NOT SEE A REMOVED GUARD. The `hasChanged` checks were
//    first written as "churn stays near baseline". Once the option list was deferred,
//    a spurious render of a CLOSED select became too cheap to measure, and the timing
//    version PASSED with the guard deliberately deleted. They are now exact RENDER
//    COUNTS (`__renderCountOnChurn` wraps each instance's `performUpdate`): zero
//    selects may re-render for a prop that was rebuilt but did not change. Sabotage
//    now reports a clean `200/200 selects re-rendered`.
//
//    General rule: when the thing being asserted is "this did NOT happen", count it,
//    do not time it.
//
// The rest follows `button-dropdown.spec.mjs`, the house anti-flake conventions:
// `Math.min(...)` of several samples (scheduler noise only ever ADDS to a duration),
// a cooldown between samples, a warm-up after `__ready`, and every raw number logged
// on each run so drift shows up long before it trips a budget.

const ROWS = 200
const OPTIONS = 30

export async function run({ port, page, reporter }) {
  const load = async (arm = 'baseline', rows = ROWS, options = OPTIONS) => {
    await page.goto(
      `http://127.0.0.1:${port}/?fixture=select-loop&arm=${arm}&rows=${rows}&options=${options}`,
      { waitUntil: 'load' },
    )
    await page.waitForFunction(() => window.__ready === true, null, { timeout: 60000 })
    await page.waitForTimeout(600)
  }

  /**
   * Mount can only be sampled once per page load, so take the best of a few RELOADS.
   * A single sample swings ~2x on a shared machine (measured 232ms and 427ms for the
   * same build), which is more than most of the fixes are worth — an unreplicated
   * mount number is not evidence.
   */
  const mountBest = async (arm = 'baseline', rows = ROWS, options = OPTIONS, n = 3) => {
    const samples = []
    for (let i = 0; i < n; i++) {
      await load(arm, rows, options)
      samples.push(await page.evaluate(() => window.__mountMs))
    }
    return Math.min(...samples)
  }

  /** Min of 7, with a cooldown so one sample's GC does not land in the next. */
  const best = async (probe) => {
    const samples = []
    for (let i = 0; i < 7; i++) {
      samples.push(await page.evaluate(probe))
      await page.waitForTimeout(400)
    }
    return Math.min(...samples.filter((s) => typeof s === 'number'))
  }

  // ── counters: what N selects cost just by existing ───────────────────────────
  // `mountBest` navigates, so take it FIRST and read every counter off the page it
  // leaves behind — otherwise the counters describe a page that has been replaced.
  const mountMs = await mountBest('baseline')

  const dom = await page.evaluate(() => window.__closedOptionCount())
  const listeners = await page.evaluate(() => window.__docListenerCount())

  reporter.check(
    `${ROWS} selects mounted`,
    dom.selects === ROWS,
    `found ${dom.selects}, expected ${ROWS} — fixture did not render`,
  )
  reporter.check(
    'no dropdown is open at rest',
    dom.open === 0,
    `${dom.open} selects report .open without anything being clicked`,
  )

  // The deferred-option contract, as counters rather than timings — no threshold to
  // tune, and it fails loudly if the list ever renders eagerly again.
  const lazy = await page.evaluate(() => window.__openOptionCount(1))

  reporter.check(
    'a closed select renders NO options',
    dom.options === 0,
    `${dom.options} option elements with every select closed — the list is rendering eagerly again`,
  )
  reporter.check(
    'opening one select renders its options',
    lazy.open === OPTIONS,
    `opened select shows ${lazy.open} options, expected ${OPTIONS}`,
  )
  reporter.check(
    'closing it removes them again',
    lazy.closed === 0,
    `${lazy.closed} options survive the close`,
  )
  // The panel HOST must stay rendered: the portal controller moves it to <body> and
  // can never move it back, so a conditional host strands one and duplicates it on
  // re-open. One panel per select, before and after opening.
  reporter.check(
    'one panel per select, and opening does not add another',
    lazy.panels === ROWS,
    `${lazy.panels} .mono-select-dropdown nodes for ${ROWS} selects — stranded or duplicated panel`,
  )

  // Outside-dismiss listeners are bound on open, not on connect. Counters again,
  // and the "comes back" arm matters as much as the "0 at rest" one.
  const lis = await page.evaluate(() => window.__listenersAroundOpen(1))

  reporter.check(
    'closed selects hold NO document listeners',
    lis.rest === 0,
    `${lis.rest} document listeners with every select closed ` +
    `(was 3 per instance = ${ROWS * 3} before they moved to the open path)`,
  )
  // 4, not 3: the select's own click + focusin + keydown, PLUS the popup stack's
  // shared Escape listener (`popup-stack.ts` `ensureEscapeListener`), which is bound
  // once for the whole page when the stack becomes non-empty and released when it
  // empties. That one does not scale with instance count, which is the whole point.
  reporter.check(
    'opening one select binds its dismiss listeners',
    lis.open === 4,
    `${lis.open} listeners while one select is open, expected 4 ` +
    `(3 from the select + 1 shared popup-stack Escape) — ` +
    `an outside click may not dismiss it`,
  )
  reporter.check(
    'closing it unbinds them again',
    lis.closed === 0,
    `${lis.closed} listeners survive the close`,
  )

  console.log(`  mount:            ${mountMs.toFixed(1)}ms for ${ROWS} selects`)
  console.log(`  closed-panel DOM: ${dom.options} option elements (${ROWS} x ${OPTIONS})`)
  console.log(
    `  doc listeners:    ${listeners.total} ` +
    `(click ${listeners.click} / focusin ${listeners.focusin} / keydown ${listeners.keydown})`,
  )

  // ── the four timings ─────────────────────────────────────────────────────────
  const churn = await best(() => window.__churn())
  const open = await best(() => window.__open(1))
  const type = await best(() => window.__type(1, 'Option 1'))

  console.log(`  unrelated re-render: ${churn.toFixed(1)}ms`)

  // Control: with only guarded/stable props bound, an unrelated re-render must not
  // reach a single select.
  const baseRenders = await page.evaluate(() => window.__renderCountOnChurn())
  reporter.check(
    'an unrelated re-render reaches NO select',
    baseRenders.renders === 0,
    `${baseRenders.renders}/${baseRenders.selects} selects re-rendered`,
  )
  console.log(`  open one dropdown:   ${open.toFixed(1)}ms`)
  console.log(`  one keystroke:       ${type.toFixed(1)}ms`)

  reporter.check(
    'every probe returned a number',
    [churn, open, type].every((n) => Number.isFinite(n)),
    `churn=${churn} open=${open} type=${type}`,
  )

  // Opening a select that has a value seeds the keyboard cursor on its row. That
  // write used to happen in `updated()` — a second render per open, and Lit's
  // change-in-update warning in every consumer's dev console. Exact count: one
  // state change, one render, and the cursor still lands on the selected row.
  const oc = await page.evaluate(() => window.__updatesOnOpenClose(2))
  reporter.check(
    'open() and close() each render exactly ONCE (no change-in-update re-render)',
    oc.open === 1 && oc.close === 1,
    `open=${oc.open} close=${oc.close} — a reactive write from updated() schedules a second render`,
  )
  reporter.check(
    '…and that one render put the cursor on the selected row',
    oc.active != null && oc.active === `Option ${String(oc.value).slice(1)}`,
    `active=${JSON.stringify(oc.active)} value=${JSON.stringify(oc.value)}`,
  )

  // ── isolate the unguarded-prop cost ──────────────────────────────────────────
  // `items` is the one select prop that already has an `arrayHasChanged` guard, and
  // the baseline arm binds a module-level array — so baseline churn is the floor.
  // These arms add ONE unguarded prop each, bound to a function call (a hoisted
  // literal would never reach the element), and the delta is that prop's cost.
  for (const arm of ['fresh-css', 'fresh-search']) {
    await load(arm)
    const armChurn = await best(() => window.__churn())
    console.log(
      `  unrelated re-render [${arm}]: ${armChurn.toFixed(1)}ms ` +
      `(baseline ${churn.toFixed(1)}ms)`,
    )
    // Counted, not timed. The timing version of this assertion passed with the
    // guard deliberately removed — deferring the option list made a spurious render
    // of a closed select too cheap to see. `renders` is exact: 0 selects should
    // re-render for a prop that was rebuilt but did not change.
    const { renders, selects } = await page.evaluate(() => window.__renderCountOnChurn())
    reporter.check(
      `a rebuilt ${arm.replace('fresh-', '')} prop re-renders NO selects`,
      renders === 0,
      `${renders}/${selects} selects re-rendered for an unchanged ${arm.replace('fresh-', '')} ` +
      `— has the hasChanged guard been removed?`,
    )
  }

  // ── mount must not scale with the option count ───────────────────────────────
  //
  // Asserted as a RATIO inside one run, not as absolute milliseconds. This box
  // measured the same build at 120ms and again at 220ms minutes apart, so an
  // absolute budget would encode the machine, not the code. The slope does not care
  // how fast the box is.
  //
  // Before the option list was deferred, mount grew with every option because all of
  // them were rendered into a panel nobody had opened (measured 1 -> 60 options:
  // 73 -> 205ms in one run, 115 -> 376ms in another). After, it is flat.
  const sweep = {}
  for (const opts of [1, 10, 30, 60]) {
    const ms = await mountBest('baseline', ROWS, opts)
    const count = await page.evaluate(() => window.__closedOptionCount())
    sweep[opts] = ms
    console.log(
      `  mount [${String(opts).padStart(2)} options/select]: ${ms.toFixed(1)}ms, ` +
      `${count.options} option elements`,
    )
  }

  const slope = sweep[60] / sweep[1]
  reporter.check(
    'mount does not scale with the option count',
    slope < 1.5,
    `60 options/select costs ${slope.toFixed(2)}x the 1-option mount ` +
    `(${sweep[1].toFixed(0)}ms -> ${sweep[60].toFixed(0)}ms). Before the list was ` +
    `deferred this ratio was 2.8x-3.3x; flat is ~1.0x.`,
  )
  console.log(`  mount slope (60 vs 1 option): ${slope.toFixed(2)}x`)

  // ── is `searchable` itself the cost? ─────────────────────────────────────────
  const plainMount = await mountBest('not-searchable')
  const plainChurn = await best(() => window.__churn())
  console.log(
    `  not-searchable: mount ${plainMount.toFixed(1)}ms, ` +
    `re-render ${plainChurn.toFixed(1)}ms ` +
    `(searchable: ${mountMs.toFixed(1)}ms / ${churn.toFixed(1)}ms)`,
  )
}
