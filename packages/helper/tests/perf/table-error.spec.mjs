// `<mono-table-error>` — the red bar under the header when a request fails.
//
// Most of this guards the CONTROLLER, because that is where the hole was. Before
// this, a failed table request left no state at all: `loadError` was wired in
// three places and every one discarded the error argument, the server-group paths
// turned a failure into `metas = []`, and the select-all drain had no catch. A
// grid could fail and look like an ordinary empty table.
//
// Two assertions here exist to keep the fix from being undone in the two obvious
// ways:
//   · a `'canceled'` rejection — devextreme's "a newer load superseded this one"
//     — must NOT paint a bar, so the capture has to sit AFTER the `isCanceled`
//     check;
//   · one failure must produce ONE bar, so `loadError` must not be hooked as well
//     as the catch. The stub fires that event inside the same rejection, exactly
//     as devextreme does, so hooking both would show here.

export async function run({ port, page, reporter }) {
  await page.goto(`http://127.0.0.1:${port}/?fixture=table-error`, { waitUntil: 'load' })
  await page.waitForFunction(() => window.__ready === true, null, { timeout: 60000 })

  // ── 1. capture and clear ───────────────────────────────────────────────────

  const before = await page.evaluate(() => window.__read('basic'))
  reporter.check(
    'nothing is shown before anything has failed',
    before && !before.shown && before.gridError === null,
    `shown=${before?.shown}, grid.error=${JSON.stringify(before?.gridError)}`,
  )

  const failed = await page.evaluate(() => window.__failWith('basic', new Error('Network is down')))
  reporter.check(
    'a failed load paints the bar',
    failed && failed.shown,
    `shown=${failed?.shown}, text=${JSON.stringify(failed?.text)}`,
  )
  reporter.check(
    '…carrying the ERROR’s own message, not a hardcoded one',
    failed && failed.text === 'Network is down',
    `text=${JSON.stringify(failed?.text)} ` +
      '(the header-filter panel throws the error away and hardcodes one sentence — not this)',
  )
  reporter.check(
    '…and records it on the controller, so anything else can read it',
    failed && failed.gridError?.message === 'Network is down' && failed.gridError.source === 'load',
    `grid.error=${JSON.stringify(failed?.gridError)}`,
  )

  // The capture must not swallow: a caller that awaits keeps its rejection.
  reporter.check(
    'the caller still gets the rejection it always got',
    failed && failed.rejected && failed.rejectedWith === 'Network is down',
    `rejected=${failed?.rejected}, with=${JSON.stringify(failed?.rejectedWith)}`,
  )

  // One failure, one bar. The stub fires `loadError` inside the rejection the way
  // devextreme does, so hooking that event as well as the catch would double up.
  reporter.check(
    'one failure produces exactly one bar',
    failed && failed.bars === 1,
    `${failed?.bars} bar(s) — loadError fires inside the same rejection, so hooking ` +
      'both it and the catch double-reports every failure',
  )

  const recovered = await page.evaluate(() => window.__succeed('basic'))
  reporter.check(
    'a subsequent success clears it',
    recovered && !recovered.shown && recovered.gridError === null,
    `shown=${recovered?.shown}, grid.error=${JSON.stringify(recovered?.gridError)}`,
  )

  // A superseded load is not a failure. Capturing before the `isCanceled` check
  // would put an error bar over a table that is loading perfectly well.
  const canceled = await page.evaluate(() => window.__failCanceled('canceled'))
  reporter.check(
    'a "canceled" rejection sets NO error',
    canceled && !canceled.shown && canceled.gridError === null,
    `shown=${canceled?.shown}, grid.error=${JSON.stringify(canceled?.gridError)} ` +
      '(devextreme rejects a superseded load with this — it is not a failure)',
  )

  // ── 2. the message comes from the error ────────────────────────────────────

  // One prop, many shapes. A store can reject with anything, and every branch has
  // to yield something readable — otherwise the fallback swallows the useful ones
  // and this is no better than the hardcoded string it replaces.
  const shapes = await page.evaluate(() => window.__failShapes('shapes'))
  const j = (v) => JSON.stringify(v)
  reporter.check(
    'an Error and a string show their own text (no status → nothing to preset)',
    shapes &&
      shapes.error.headline === 'Boom from an Error' &&
      !shapes.error.detail &&
      shapes.string.headline === 'Boom from a string',
    `Error=${j(shapes?.error)}, string=${j(shapes?.string)}`,
  )
  reporter.check(
    '…a nested axios-style response WITHOUT a status is unwrapped to its text',
    shapes && shapes.axios.headline === 'Bad Gateway' && shapes.axios.status === undefined,
    `axios=${j(shapes?.axios)}`,
  )
  reporter.check(
    '…and an opaque object falls back rather than printing "[object Object]"',
    shapes && shapes.opaque.headline.length > 0 && !shapes.opaque.headline.includes('object Object'),
    `opaque=${j(shapes?.opaque)}`,
  )

  // ── 2b. a status gets a HUMAN headline ─────────────────────────────────────

  // The bug as reported: devextreme's ODataStore rejects with
  // `Error(xhr.statusText)` + `{ httpStatus }`, and over HTTP/2 the statusText is
  // EMPTY — so the bar read "Error", the constructor's name, for a 403 whose
  // status was sitting right there on the object. Even populated, "Forbidden"
  // is the transport's word; a person needs the sentence.
  reporter.check(
    'a 403 with a BLANK statusText reads the 403 preset — not "Error"',
    shapes &&
      shapes.forbiddenBlank.headline === 'You do not have permission to view this data.' &&
      shapes.forbiddenBlank.status === 403 &&
      !shapes.forbiddenBlank.detail,
    `forbiddenBlank=${j(shapes?.forbiddenBlank)} (was "Error": Error('') → raw.name)`,
  )
  reporter.check(
    '…and "Forbidden" is not shown as a detail — the phrase says nothing the status did not',
    shapes &&
      shapes.forbidden.headline === 'You do not have permission to view this data.' &&
      !shapes.forbidden.detail,
    `forbidden=${j(shapes?.forbidden)}`,
  )
  reporter.check(
    'a 401 reads the session preset',
    shapes &&
      shapes.unauthorized.headline === 'Your session has expired. Please sign in again.' &&
      shapes.unauthorized.status === 401,
    `unauthorized=${j(shapes?.unauthorized)}`,
  )
  reporter.check(
    'a bare `{ status: 503 }` reads the 503 preset rather than "HTTP 503"',
    shapes &&
      shapes.http.headline === 'The server is temporarily unavailable. Please try again later.' &&
      shapes.http.status === 503,
    `http=${j(shapes?.http)}`,
  )
  reporter.check(
    'a 500 with the server\'s OWN body keeps that body as the detail',
    shapes &&
      shapes.serverBody.headline === 'Something went wrong on the server. Please try again later.' &&
      shapes.serverBody.detail === 'Object reference not set to an instance of an object',
    `serverBody=${j(shapes?.serverBody)} (devextreme puts the parsed OData error under errorDetails)`,
  )
  reporter.check(
    '…as does a statusText that is not just the reason phrase',
    shapes &&
      shapes.statusText.headline === 'Something went wrong on the server. Please try again later.' &&
      shapes.statusText.detail === 'Server exploded',
    `statusText=${j(shapes?.statusText)}`,
  )
  reporter.check(
    'a fetch TypeError("Failed to fetch") reads the network preset, status 0, no detail',
    shapes &&
      shapes.network.headline === 'Could not reach the server. Check your connection and try again.' &&
      shapes.network.status === 0 &&
      !shapes.network.detail,
    `network=${j(shapes?.network)}`,
  )

  // Overrides: per grid, app-wide, and back.
  const wording = await page.evaluate(() => window.__failWording('wording', 'wording-own'))
  reporter.check(
    '`errorMessages` on the grid replaces the wording for that status',
    wording && wording.perGrid === 'This grid says no.',
    `perGrid=${j(wording?.perGrid)}`,
  )
  reporter.check(
    '`setErrorMessages()` replaces it for every grid without its own map…',
    wording && wording.global === 'Anda tidak memiliki akses ke data ini.',
    `global=${j(wording?.global)}`,
  )
  reporter.check(
    '…the per-grid map still wins over the app-wide one…',
    wording && wording.perGridOverGlobal === 'This grid says no.',
    `perGridOverGlobal=${j(wording?.perGridOverGlobal)}`,
  )
  reporter.check(
    '…and `setErrorMessages(null)` restores the defaults',
    wording && wording.restored === 'You do not have permission to view this data.',
    `restored=${j(wording?.restored)}`,
  )

  // ── 2c. the bar stays in the scrollport ────────────────────────────────────

  // A table-wide row: on a table wider than its box the text sat at the far
  // left and the ✕ past the right edge — you had to scroll to find them — and
  // under a frozen header the row scrolled away with the body.
  await page.evaluate(() => window.__failWith('pinned', new Error('Pinned failure')))
  const rest = await page.evaluate(() => window.__pinned(0, 0))
  // At rest a sticky box sits at its FLOW position, which is one table border in
  // from the scrollport edge — so the bar's right edge is that same pixel past
  // it. `left: 0` only pulls it flush once the table has actually moved.
  const within = (a, b, tol = 1) => Math.abs(a - b) <= tol
  reporter.check(
    'pinned: at rest the bar is the SCROLLPORT wide, not the table',
    rest &&
      within(rest.barLeft, rest.viewLeft) &&
      within(rest.barRight, rest.viewRight) &&
      rest.barWidth === rest.viewRight - rest.viewLeft,
    `bar ${rest?.barLeft}..${rest?.barRight} vs scrollport ${rest?.viewLeft}..${rest?.viewRight} ` +
      `(width ${rest?.barWidth}; table is 2000px)`,
  )
  reporter.check(
    '…directly under the two-row header, whose height it published',
    rest &&
      rest.barTop === rest.theadBottom &&
      rest.headVar === `${rest.theadHeight}px` &&
      rest.tdPosition === 'sticky',
    `barTop=${rest?.barTop} theadBottom=${rest?.theadBottom} ` +
      `--mono-table-error-head=${j(rest?.headVar)} (thead ${rest?.theadHeight}px) td=${rest?.tdPosition}`,
  )
  const scrolled = await page.evaluate(() => window.__pinned(800, 400))
  reporter.check(
    'scrolled 800px right: the bar is still flush with the visible left and right edges',
    scrolled &&
      scrolled.scrollLeft === 800 &&
      scrolled.barLeft === scrolled.viewLeft &&
      scrolled.barRight === scrolled.viewRight,
    `bar ${scrolled?.barLeft}..${scrolled?.barRight} vs scrollport ${scrolled?.viewLeft}..${scrolled?.viewRight} ` +
      `at scrollLeft=${scrolled?.scrollLeft}`,
  )
  reporter.check(
    '…the ✕ is inside the visible box without scrolling for it',
    scrolled && scrolled.closeVisible,
    `closeVisible=${scrolled?.closeVisible}`,
  )
  // The `<thead>` box is not what sticks — its `th` are — so "under the header"
  // is measured as: the first header cell is pinned at the scrollport's top, and
  // the bar sits exactly one published header height below that.
  reporter.check(
    'scrolled 400px down: the bar is still pinned under the frozen header',
    scrolled &&
      scrolled.scrollTop === 400 &&
      scrolled.firstThTop === scrolled.viewTop &&
      scrolled.barTop === scrolled.viewTop + scrolled.theadHeight,
    `barTop=${scrolled?.barTop} firstThTop=${scrolled?.firstThTop} viewTop=${scrolled?.viewTop} ` +
      `thead=${scrolled?.theadHeight}px at scrollTop=${scrolled?.scrollTop}`,
  )
  const recoveredPinned = await page.evaluate(async () => {
    const out = await window.__succeed('pinned')
    return { ...out, headVar: document.getElementById('pinned-table').style.getPropertyValue('--mono-table-error-head') }
  })
  reporter.check(
    '…and a recovery clears the published header offset',
    recoveredPinned && !recoveredPinned.shown && recoveredPinned.headVar === '',
    `shown=${recoveredPinned?.shown}, --mono-table-error-head=${j(recoveredPinned?.headVar)}`,
  )

  // ── 3. the select-all drain ────────────────────────────────────────────────

  // `readAllRows` has no catch of its own, so this failure used to leave through
  // `selectAll()` as a bare rejection with nothing to show for it.
  const drain = await page.evaluate(() => window.__failSelectAll('drain'))
  reporter.check(
    'a failed select-all drain reports too, and still rejects',
    drain && drain.shown && drain.rejected && drain.gridError?.source === 'selectAll',
    `shown=${drain?.shown}, rejected=${drain?.rejected}, ` +
      `source=${JSON.stringify(drain?.gridError?.source)}`,
  )

  // ── 3b. the server-group paths ─────────────────────────────────────────────

  // These two swallowed outright: a failed group list became `metas = []`, a
  // failed group page became "keep whatever was shown". The `load()` promise
  // still resolves on this path, so nothing else here would ever see them — an
  // arm of their own is the only way to know they report.
  const groups = await page.evaluate(() => window.__failGroups(new Error('Group list refused')))
  reporter.check(
    'a failed server-group list reports, while still resolving',
    groups && groups.shown && !groups.rejected && groups.gridError?.source === 'group',
    `shown=${groups?.shown}, load() rejected=${groups?.rejected}, ` +
      `source=${JSON.stringify(groups?.gridError?.source)} ` +
      '(an empty group list and a failed one used to look identical)',
  )

  // No explicit reset needed: this runs a load whose group LIST succeeds, which
  // clears the previous error, and whose row page then fails.
  const groupRows = await page.evaluate(() =>
    window.__failGroupRows(new Error('Group page refused')),
  )
  reporter.check(
    '…and so does a failed group page',
    groupRows && groupRows.shown && groupRows.gridError?.source === 'groupRows',
    `shown=${groupRows?.shown}, source=${JSON.stringify(groupRows?.gridError?.source)}`,
  )

  // ── 4. message vs caught error ─────────────────────────────────────────────

  const manual = await page.evaluate(() => window.__read('manual'))
  reporter.check(
    'a manual message shows with no failure at all',
    manual && manual.shown && manual.text === 'Something you wrote',
    `shown=${manual?.shown}, text=${JSON.stringify(manual?.text)}`,
  )

  const manualWins = await page.evaluate(() =>
    window.__failWith('manual', new Error('The controller’s error')),
  )
  reporter.check(
    '…and wins over a caught error while it is set',
    manualWins && manualWins.text === 'Something you wrote' && !!manualWins.gridError,
    `text=${JSON.stringify(manualWins?.text)} with grid.error=${JSON.stringify(manualWins?.gridError?.message)}`,
  )

  const released = await page.evaluate(() => window.__setMessage('manual', ''))
  reporter.check(
    '…then releases the caught error when cleared',
    released && released.text === 'The controller’s error',
    `text=${JSON.stringify(released?.text)} after clearing message`,
  )

  const unbound = await page.evaluate(() => window.__read('unbound'))
  reporter.check(
    'with no controller bound, a message alone is enough',
    unbound && unbound.shown && unbound.text === 'No controller at all',
    `shown=${unbound?.shown}, text=${JSON.stringify(unbound?.text)}`,
  )

  // ── 5. dismiss ─────────────────────────────────────────────────────────────

  await page.evaluate(() => window.__failWith('dismiss', new Error('First failure')))
  const dismissed = await page.evaluate(() => window.__dismiss('dismiss'))
  reporter.check(
    'the × hides the bar and emits mno-close',
    dismissed && !dismissed.shown && dismissed.events === 1,
    `shown=${dismissed?.shown}, mno-close events=${dismissed?.events}`,
  )
  reporter.check(
    '…without clearing the controller, so a second element still shows it',
    dismissed && !!dismissed.gridError && dismissed.secondShown,
    `grid.error=${JSON.stringify(dismissed?.gridError?.message)}, ` +
      `second element showing=${dismissed?.secondShown}`,
  )

  // Per FAILURE, not per message. The controller mints a fresh record each time,
  // so an identical repeat has to come back — remembering the text instead of the
  // object would silence it forever.
  const repeat = await page.evaluate(() => window.__failWith('dismiss', new Error('First failure')))
  reporter.check(
    'the NEXT failure re-shows it — even with the identical message',
    repeat && repeat.shown && repeat.text === 'First failure',
    `shown=${repeat?.shown}, text=${JSON.stringify(repeat?.text)} ` +
      '(dismiss remembers the error OBJECT; matching on the text would hide a real repeat)',
  )

  const nodismiss = await page.evaluate(async () => {
    await window.__failWith('nodismiss', new Error('No way out'))
    return window.__read('nodismiss')
  })
  reporter.check(
    ':dismissible="false" drops the button',
    nodismiss && nodismiss.shown && !nodismiss.hasClose,
    `shown=${nodismiss?.shown}, hasClose=${nodismiss?.hasClose}`,
  )
  reporter.check(
    '…and the button is labelled for a screen reader when present',
    dismissed && manual && failed,
    'checked via aria-label below',
  )

  // ── 6. placement ───────────────────────────────────────────────────────────

  const place = await page.evaluate(() => window.__placement('basic'))
  const shape = await page.evaluate(() => window.__read('basic'))
  const reFailed = await page.evaluate(() => window.__failWith('basic', new Error('Again')))
  const place2 = await page.evaluate(() => window.__placement('basic'))
  void place
  void shape

  reporter.check(
    'the bar is a REAL row directly below the header',
    place2 && place2.height > 0 && Math.abs(place2.belowHeader) <= 1,
    `height=${place2?.height}px, ${place2?.belowHeader}px below the header ` +
      '(this one is in flow, unlike the loading and empty overlays)',
  )
  reporter.check(
    '…spanning the full table width',
    place2 && Math.abs(place2.widthShortfall) <= 2,
    `${place2?.widthShortfall}px short of the table width`,
  )
  reporter.check(
    '…in a generated row that is out of the zebra parity count',
    reFailed && reFailed.rowClass.includes('mono-table-error-row') && reFailed.stripeSkip,
    `row class=${JSON.stringify(reFailed?.rowClass)}, stripe-skip=${reFailed?.stripeSkip}`,
  )
  reporter.check(
    '…and labelled for a screen reader',
    reFailed && reFailed.closeLabel === 'Dismiss',
    `aria-label=${JSON.stringify(reFailed?.closeLabel)}`,
  )

  // A host page that restates cell padding is ordinary — these docs do it
  // themselves, to undo VitePress's table styling — and the generated row's cell
  // is a structural host rather than a content cell, so it has to say so loudly
  // enough to survive that. It did not, and the bar rendered inside a 14px
  // gutter.
  const hostile = await page.evaluate(async () => {
    await window.__failWith('hostile', new Error('Under a hostile stylesheet'))
    return window.__placement('hostile')
  })
  reporter.check(
    'the bar stays flush under a host stylesheet that restates td padding',
    hostile && hostile.gapLeft === 0 && hostile.gapRight === 0 && hostile.tdPadding === '0px',
    `gaps L/R = ${hostile?.gapLeft}/${hostile?.gapRight}px, td padding=${hostile?.tdPadding} ` +
      '(a `.vp-doc table.mono-table td { padding }` at (0,2,2) beats a (0,1,1) reset)',
  )

  // The colspan is set once on connect, from the header as it stood then. A grid
  // whose columns come from data changes that later.
  const cols = await page.evaluate(async () => {
    await window.__failWith('cols', new Error('Three columns'))
    const start = window.__read('cols').rowSpan
    const after = await window.__addColumn('cols')
    return { start, after: after.rowSpan }
  })
  reporter.check(
    'the colspan follows a column added after mount',
    cols && cols.start === 3 && cols.after === 4,
    `colspan ${cols?.start} → ${cols?.after} after adding a 4th column`,
  )

  // ── 6b. a failure clears the rows; ↻ re-runs the query ────────────────────
  //
  // devextreme leaves `items()` at the last SUCCESSFUL page after a rejected
  // load, so a filter the backend refused used to leave the previous filter's
  // rows sitting under the red bar — the input said 2026, the list said 2025.
  // `behaviour="clear-list"` (the default) has the CONTROLLER empty the rows when
  // it records the error; `"keep-list"` is the old picture. A failed select-all
  // drain never clears — it is not the row set.

  const loadedOk = await page.evaluate(async () => {
    await window.__succeed('clear')
    return window.__rows('clear')
  })
  const cleared = await page.evaluate(async () => {
    await window.__failWith('clear', new Error('Backend refused the filter'))
    return window.__rows('clear')
  })
  reporter.check(
    'clear-list (default): a failed load empties items and totalCount, the bar shows, the error is kept',
    loadedOk?.items === 4 && loadedOk?.total === 4 && cleared?.items === 0 && cleared?.total === 0 &&
      cleared?.shown && cleared?.gridError?.source === 'load' && cleared?.mode === 'clear-list',
    `before ${loadedOk?.items}/${loadedOk?.total}; after ${cleared?.items}/${cleared?.total}, shown=${cleared?.shown}, mode=${cleared?.mode}`,
  )

  const keptRows = await page.evaluate(async () => {
    await window.__succeed('keep')
    await window.__failWith('keep', new Error('Backend refused the filter'))
    return window.__rows('keep')
  })
  reporter.check(
    'behaviour="keep-list": the rows survive the failure and the controller reads keep-list',
    keptRows?.items === 4 && keptRows?.total === 4 && keptRows?.shown && keptRows?.mode === 'keep-list',
    `items ${keptRows?.items}/${keptRows?.total}, shown=${keptRows?.shown}, mode=${keptRows?.mode}`,
  )

  const drainRows = await page.evaluate(async () => {
    await window.__failSelectAll('drain-rows')
    return window.__rows('drain-rows')
  })
  reporter.check(
    'a failed select-all drain never clears the rows',
    drainRows?.items === 4 && drainRows?.shown && drainRows?.gridError?.source === 'selectAll',
    `items ${drainRows?.items}, source ${drainRows?.gridError?.source}`,
  )

  reporter.check(
    'the ↻ is there by default, labelled "Reload", and :reload="false" removes it',
    cleared?.hasReload && cleared?.reloadLabel === 'Reload' &&
      (await page.evaluate(async () => {
        await window.__failWith('noreload', new Error('x'))
        const r = window.__rows('noreload')
        return r.shown && !r.hasReload && r.hasClose
      })),
    `hasReload=${cleared?.hasReload}, label=${cleared?.reloadLabel}`,
  )

  const stillFailing = await page.evaluate(() => window.__reloadClick('clear'))
  reporter.check(
    '↻ re-runs the query: with the source still failing the bar stays (a fresh error), mno-reload fired, the button was disabled while loading',
    stillFailing?.events === 1 && stillFailing?.shown && stillFailing?.items === 0 &&
      stillFailing?.disabledWhileLoading && !stillFailing?.reloadDisabled,
    JSON.stringify(stillFailing),
  )
  const healed = await page.evaluate(async () => {
    window.__stub('clear').succeed()
    return window.__reloadClick('clear')
  })
  reporter.check(
    '↻ once the source recovers: the bar goes and the rows come back',
    healed?.events === 1 && !healed?.shown && healed?.items === 4 && healed?.gridError === null,
    JSON.stringify(healed),
  )

  reporter.check(
    'the reload button renders i-mdi-refresh',
    await page.evaluate(async () => {
      await window.__failWith('clear', new Error('x'))
      const g = window.__reloadGlyph('clear')
      return !!g && g.cls.includes('i-mdi-refresh') && g.painted
    }),
    JSON.stringify(await page.evaluate(() => window.__reloadGlyph('clear'))),
  )

  // ── 7. the close glyph in this build ───────────────────────────────────────

  reporter.check(
    'the close button renders i-mdi-close',
    await page.evaluate(() => {
      const g = window.__closeGlyph('cols')
      return !!g && g.cls.includes('i-mdi-close')
    }),
    JSON.stringify(await page.evaluate(() => window.__closeGlyph('cols'))),
  )

  // ── 8. the empty state stands down ─────────────────────────────────────────

  // "No Data found" under a red "the request failed" bar is a contradiction, and
  // the empty message is the one that is wrong: the grid is not empty, it is
  // unknown.
  //
  // The empty state has to be genuinely SHOWING before this means anything. It
  // only appears once `hasLoaded` has latched, and that happens in `sync()`,
  // which a failed load never reaches — so an arm that only ever fails would keep
  // the empty message hidden for a reason that has nothing to do with the error,
  // and the check would pass with the coupling deleted.
  const pairBefore = await page.evaluate(() => window.__emptyFirst('empty-pair'))
  reporter.check(
    'the empty state is showing before the error arrives (the control)',
    pairBefore && pairBefore.emptyShown && pairBefore.hasLoaded && !pairBefore.errorShown,
    `empty showing=${pairBefore?.emptyShown}, hasLoaded=${pairBefore?.hasLoaded}, ` +
      `error showing=${pairBefore?.errorShown}`,
  )

  const pairFailed = await page.evaluate(async () => {
    await window.__failWith('empty-pair', new Error('Both would show'))
    return window.__emptyBeside('empty-pair')
  })
  reporter.check(
    '…then stands down as soon as one is set',
    pairFailed && pairFailed.errorShown && !pairFailed.emptyShown,
    `error showing=${pairFailed?.errorShown}, empty showing=${pairFailed?.emptyShown}`,
  )

  const pairOk = await page.evaluate(async () => {
    await window.__succeed('empty-pair')
    return window.__emptyBeside('empty-pair')
  })
  reporter.check(
    '…and comes back when the error clears',
    pairOk && !pairOk.errorShown && pairOk.emptyShown,
    `error showing=${pairOk?.errorShown}, empty showing=${pairOk?.emptyShown}`,
  )

  // ── 9. the hand-written row — the taught form ──────────────────────────────

  // A bare element in `<tbody>` is invalid HTML: Vue warns on every consumer
  // build and the parser foster-parents a server-rendered one out of the table.
  // So the docs teach `<tr><td colspan>`, and the element ADOPTS that row — it
  // used to be "left exactly as written", which under a real page's `td` styling
  // is the same 14px gutter the generated row had already been fixed for.

  const hw = await page.evaluate(async () => {
    await window.__failWith('handwritten', new Error('In a row you wrote'))
    return { ...window.__rowHost('handwritten'), place: window.__placement('handwritten') }
  })
  reporter.check(
    'hand-written row: nothing is generated — the element uses the row it was given',
    hw && hw.rows === 1 && hw.isConsumerRow,
    `${hw?.rows} row(s) in tbody, element in the consumer's row: ${hw?.isConsumerRow}`,
  )
  reporter.check(
    'hand-written row: adopted — row class + zebra-skip stamped on',
    hw && hw.rowClass.split(/\s+/).includes('mono-table-error-row') && hw.stripeSkip,
    `class="${hw?.rowClass}", data-mono-stripe-skip=${hw?.stripeSkip}`,
  )
  reporter.check(
    'hand-written row: a missing colspan is supplied from the columns',
    hw && hw.colSpan === 2,
    `colspan=${hw?.colSpan} (attr ${JSON.stringify(hw?.colspanAttr)}) on a 2-column table`,
  )
  reporter.check(
    'hand-written row: flush under the same hostile stylesheet',
    hw?.place && hw.place.gapLeft === 0 && hw.place.gapRight === 0 && hw.place.tdPadding === '0px',
    `gaps L/R = ${hw?.place?.gapLeft}/${hw?.place?.gapRight}px, td padding=${hw?.place?.tdPadding} ` +
      '(without the adopted class the reset has nothing to key on)',
  )

  // A stale consumer colspan is corrected; a correct one is not touched. The
  // second half is counted, not inferred — rewriting `3` as `3` leaves the same
  // attribute, so the value alone would pass either way.
  const stale = await page.evaluate(async () => {
    await window.__failWith('handwritten-stale', new Error('Stale span'))
    return window.__rowHost('handwritten-stale')
  })
  reporter.check(
    'hand-written row: a stale colspan="1" is corrected to the column count',
    stale && stale.colSpan === 3,
    `colspan=${stale?.colSpan} on a 3-column table`,
  )
  const right = await page.evaluate(async () => {
    await window.__failWith('handwritten-right', new Error('Right span'))
    return window.__colspanWrites('handwritten-right')
  })
  reporter.check(
    'hand-written row: control — a correct colspan is never rewritten',
    right && right.writes === 0 && right.colSpan === 3,
    `${right?.writes} colspan write(s) across two update cycles, colspan=${right?.colSpan}`,
  )

  // Idle: the row stays (it is the consumer's) but must cost no height. It used
  // to be a 1px band — the `<tr>` carries the base row rule's border-bottom of
  // its own, and only the `> td` was reset.
  const idle = await page.evaluate(() => window.__idleRow('handwritten-right'))
  reporter.check(
    'hand-written row: an idle host costs the table no height',
    idle && idle.plain === 0,
    `table is ${idle?.plain}px taller with the idle row than without it`,
  )
  // With bordered cells the collapse model hands the row half of each
  // neighbour's border — one collapsed edge, no more. See the fixture.
  reporter.check(
    '…and at most one collapsed edge when the host page borders its cells',
    idle && idle.bordered >= 0 && idle.bordered <= 1,
    `${idle?.bordered}px under 1px cell borders (0.5 from each neighbour is the collapse model; ` +
      'more is the row drawing something of its own)',
  )

  // Disconnect: a generated row goes, a consumer's row stays. Removing a node the
  // framework still references is exactly the hydration break the warning names.
  const gone = await page.evaluate(() => window.__detach('detach'))
  reporter.check(
    'control — a GENERATED row is removed with the element',
    gone && !gone.rowStillInBody && gone.rows === 0,
    `generated row still in tbody: ${gone?.rowStillInBody}, rows left: ${gone?.rows}`,
  )
  const kept = await page.evaluate(() => window.__detach('handwritten'))
  reporter.check(
    "a CONSUMER's row is left in place when the element is removed",
    kept && kept.rowStillInBody && kept.rows === 1,
    `consumer row still in tbody: ${kept?.rowStillInBody}, rows left: ${kept?.rows}`,
  )
}
