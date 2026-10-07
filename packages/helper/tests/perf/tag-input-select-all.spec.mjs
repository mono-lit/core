// `<mono-tag-input>`'s "All" row against a paged DataSource.
//
// The claim being guarded has two halves, and the second is the one that used to
// be silently broken:
//
//   1. it drains — "All" over a `load-more` DataSource selects every row on the
//      server, not the ten that happen to be loaded;
//   2. the drain is REACHABLE — the box is judged against `totalCount()`, so a
//      fully-ticked first page reads `'some'`. Judged against the loaded rows it
//      reads `'all'`, and the next click CLEARS: the control that claims to select
//      everything can never select more than a page.
//
// And the failure mode designed against: tag-input DROPS a chip whose value it
// cannot resolve (`_resolvedValues` filters the strip and the "+N more" counter
// alike), so a drain that forgets to seed the label cache leaves `value` full and
// the field visibly empty. Every arm therefore counts CHIPS, not values.
//
// The `items` arms are the control. A plain array is static and wholly in memory,
// so it must behave exactly as it did before — no drain, loaded-scope tri-state,
// `max` still capping. Without them a "fix" that drained unconditionally, or
// that judged every select-all against a server total it does not have, would pass.

export async function run({ port, page, reporter }) {
  await page.goto(`http://127.0.0.1:${port}/?fixture=tag-input-select-all`, { waitUntil: 'load' })
  await page.waitForFunction(() => window.__ready === true, null, { timeout: 60000 })

  // ── 1. a paged DataSource drains ───────────────────────────────────────────
  const opened = await page.evaluate(() => window.__open('server'))
  reporter.check(
    'a paged DataSource shows one page and the "All" row',
    opened && opened.hasRow && opened.rows > 0 && opened.rows < 250,
    `rows=${opened?.rows} (expected a partial page), hasRow=${opened?.hasRow}`,
  )

  // The trap, first: tick every loaded row. Judged against the loaded set this
  // paints `'all'` and the drain becomes unreachable.
  const ticked = await page.evaluate(() => window.__tickLoadedRows('server'))
  reporter.check(
    'a fully-ticked first page reads "some", not "all" — the drain stays reachable',
    ticked && ticked.box === 'some',
    `box=${ticked?.box} after ticking ${ticked?.clicked} loaded row(s) of 250 on the server`,
  )

  const all = await page.evaluate(() => window.__clickAll('server'))

  reporter.check(
    '"All" selects every row on the server, including ones never rendered',
    all && all.after.selected === all.total,
    `selected=${all?.after.selected} of ${all?.total}`,
  )
  reporter.check(
    '…by draining the store in chunks',
    all && all.drains > 1,
    `drain loads=${all?.drains} (one page-sized chunk each)`,
  )
  reporter.check(
    '…and every selected value renders a chip with its LABEL',
    all && all.after.chips.rendered + all.after.chips.hidden === all.total,
    `chips rendered=${all?.after.chips.rendered} + hidden=${all?.after.chips.hidden} ` +
      `= ${(all?.after.chips.rendered ?? 0) + (all?.after.chips.hidden ?? 0)}, want ${all?.total}`,
  )
  reporter.check(
    '…not its key',
    all && all.after.chips.keyShaped === 0 && all.after.chips.firstText.length > 0,
    `${all?.after.chips.keyShaped} chip(s) showed a raw key; first text = ${JSON.stringify(all?.after.chips.firstText)}`,
  )

  // ── 1b. a source at its last page has nothing left to drain ────────────────
  // The drain is for the rows NOT yet here. Once `isLastPage()` is true every row
  // the query matches is loaded, and "All" must select those outright — the
  // whole point of the complaint this guards: a fully-loaded list that still
  // fired a chunked walk of the store on every click.
  const loadedOpen = await page.evaluate(() => window.__open('loaded'))
  const loadedAll = await page.evaluate(() => window.__clickAll('loaded', { twice: false }))
  reporter.check(
    'a source already at its last page selects its loaded rows without a drain',
    loadedOpen && loadedOpen.rows > 0 && loadedAll && loadedAll.drains === 0
      && loadedAll.after.selected === loadedOpen.rows,
    `drain loads=${loadedAll?.drains} (want 0), selected=${loadedAll?.after.selected} of ${loadedOpen?.rows} loaded`,
  )

  // ── 2. the box is judged against the server total ──────────────────────────
  reporter.check(
    'after the drain the box reads "all"',
    all && all.after.box === 'all',
    `box=${all?.after.box} with ${all?.after.selected}/${all?.total} selected`,
  )

  const cleared = await page.evaluate(() => window.__clickAll('server', { twice: false }))
  reporter.check(
    'and the next click clears the WHOLE selection, not just the loaded page',
    cleared && cleared.after.selected === 0,
    `selected=${cleared?.after.selected} after clicking a full "All" (a page-scoped clear leaves ~240)`,
  )

  // ── 3. `pending` brackets the drain, visibly ───────────────────────────────
  reporter.check(
    'the row spins WHILE the drain runs',
    all && all.during.spinner && all.during.spinnerPainted,
    `spinner=${all?.during.spinner}, painted=${all?.during.spinnerPainted}`,
  )
  // The bug this rules out is the one called out at `mono-data-chart.ts:386` —
  // setting the flag AFTER the await, so it is only ever true once there is
  // nothing left to wait for. The row must already be busy on the very first
  // render after the click, with the drain barely started.
  reporter.check(
    '…published on the first render after the click, not after the last chunk',
    all && all.during.drainsAtMid < all.drains,
    `${all?.during.drainsAtMid} of ${all?.drains} chunk(s) had been requested when the row first rendered busy`,
  )
  reporter.check(
    '…the box drops its own tick/dash so the spinner is the only glyph',
    all && all.during.suppressesOwnGlyphs,
    `has-custom-icon=${all?.during.suppressesOwnGlyphs}`,
  )
  reporter.check(
    '…the row is disabled and marked is-loading',
    all && all.during.disabled && all.during.loadingClass,
    `disabled=${all?.during.disabled}, is-loading=${all?.during.loadingClass}`,
  )
  // `disabled` is how the second click is refused, but it also makes the row read
  // as UNAVAILABLE — dimmed to 0.5 with a blocked cursor. It is busy, not broken.
  reporter.check(
    '…but it reads as busy, not unavailable — undimmed, with a progress cursor',
    all && all.during.rowOpacity === 1 && all.during.rowCursor === 'progress',
    `opacity=${all?.during.rowOpacity}, cursor=${all?.during.rowCursor}`,
  )
  // Contrast has to be measured on a field where NOTHING is ticked. Everywhere
  // else the box is already accent-filled by checkbox.css's own checked /
  // indeterminate rule, and the reading would pass with the loading fill deleted.
  // From `none` the box is white and the spinner's stroke defaults to white.
  // Measured mid-drain, so a fill that merely EASES in over
  // `--theme-duration-slow` — the box's own background transition — fails too.
  await page.evaluate(() => window.__open('fresh'))
  const freshDrain = await page.evaluate(() => window.__clickAll('fresh'))
  reporter.check(
    '…and, starting from an empty box, the spinner is legible the moment it appears',
    freshDrain && freshDrain.during.spinnerContrast > 0.25,
    `spinner/box contrast=${freshDrain?.during.spinnerContrast?.toFixed(3)} mid-drain from "none" ` +
      '(white-on-white, or a fill still easing in, lands near 0)',
  )
  reporter.check(
    '…and that drain selected everything too',
    freshDrain && freshDrain.after.selected === freshDrain.total,
    `selected=${freshDrain?.after.selected} of ${freshDrain?.total}`,
  )
  reporter.check(
    '…a second click while it runs starts no second drain',
    all && all.during.secondClickDrained === false,
    `second click ${all?.during.secondClickDrained ? 'DID' : 'did not'} add a drain load`,
  )
  reporter.check(
    '…and every trace of it is gone afterwards',
    all && !all.after.spinner && !all.after.disabled && !all.after.loadingClass,
    `spinner=${all?.after.spinner}, disabled=${all?.after.disabled}, is-loading=${all?.after.loadingClass}`,
  )

  // ── 4. the search scopes the drain ─────────────────────────────────────────
  await page.evaluate(() => window.__open('search'))
  const searched = await page.evaluate(() => window.__searchThenAll('search', 'Row 1', true))
  reporter.check(
    '"All" under a search selects only rows the query matches',
    searched && searched.allMatch && searched.selected === searched.expected,
    `selected=${searched?.selected}, expected=${searched?.expected}, allMatch=${searched?.allMatch}`,
  )
  reporter.check(
    '…and it did drain to get them',
    searched && searched.drains > 0,
    `drain loads=${searched?.drains}`,
  )

  // A narrowing search leaves a big selection over a small total. Sizes alone say
  // `111 >= 11` — a finished box over eleven rows none of which are selected, and
  // a next click that clears instead of selecting them.
  const foreign = await page.evaluate(() => window.__searchWithForeignSelection('search', 'Row 24'))
  reporter.check(
    'a big selection over a narrowed search still reads "some", not "all"',
    foreign && foreign.box === 'some' && foreign.shownSelected === 0,
    `box=${foreign?.box} holding ${foreign?.held} value(s) over ${foreign?.shown} matched row(s), ` +
      `${foreign?.shownSelected} of which are selected`,
  )

  // Clicking inside the 300ms debounce: the drain has to flush the pending query
  // first, or it reads the source's PREVIOUS filter and selects the wrong rows.
  //
  // The query has to DIFFER from the one already on the source ('Row 24', left
  // there by the arm above) or the race is unobservable — a stale filter and a
  // fresh one would be the same filter, and the check would pass no matter what.
  // 'Row 3' also matches exactly as many rows (11), so only `allMatch` separates
  // the two; a count alone would not.
  await page.evaluate(() => window.__clearValue('search'))
  const raced = await page.evaluate(() => window.__searchThenAll('search', 'Row 3', false))
  reporter.check(
    'a click inside the search debounce flushes it before draining',
    raced && raced.allMatch && raced.selected === raced.expected,
    `selected=${raced?.selected}, expected=${raced?.expected}, allMatch=${raced?.allMatch} ` +
      `(a stale filter selects the previous query’s rows; sample = ${JSON.stringify(raced?.sample)})`,
  )

  // ── 5. the control: a plain `items` array must NOT drain ───────────────────
  const arrOpen = await page.evaluate(() => window.__open('array'))
  reporter.check(
    'a plain items array shows its "All" row too',
    arrOpen && arrOpen.hasRow,
    `hasRow=${arrOpen?.hasRow}`,
  )

  const arr = await page.evaluate(() => window.__clickAll('array', { twice: false }))
  reporter.check(
    'an items array selects its visible rows, unchanged',
    arr && arr.after.selected > 0,
    `selected=${arr?.after.selected}`,
  )
  reporter.check(
    '…without ever painting a drain spinner',
    arr && !arr.during.spinner && !arr.during.disabled && !arr.during.loadingClass,
    `spinner=${arr?.during.spinner}, disabled=${arr?.during.disabled}, is-loading=${arr?.during.loadingClass} ` +
      '(nothing to wait for — the rows are already in memory)',
  )
  reporter.check(
    '…and its box goes straight to "all" (loaded scope IS the whole scope)',
    arr && arr.after.box === 'all',
    `box=${arr?.after.box}`,
  )

  // ── 6. max is a hard cap: the drain fills the room left and stops ──────────
  await page.evaluate(() => window.__open('capped'))
  const cappedServer = await page.evaluate(() => window.__clickAll('capped'))
  reporter.check(
    'max caps a server drain too — "select all" under max=5 selects five',
    cappedServer && cappedServer.after.selected === 5 && cappedServer.total > 5,
    `selected=${cappedServer?.after.selected} of ${cappedServer?.total} with max=5`,
  )

  await page.evaluate(() => window.__open('array-capped'))
  const cappedArray = await page.evaluate(() => window.__clickAll('array-capped', { twice: false }))
  reporter.check(
    '…but it still caps an ordinary items select-all',
    cappedArray && cappedArray.after.selected === 5,
    `selected=${cappedArray?.after.selected}, want 5`,
  )
}
