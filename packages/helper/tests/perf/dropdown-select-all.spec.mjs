// `dd.selectAll()` — the dropdown's server-side select-all.
//
// The claim being guarded is not "it selects everything" (easy) but "it costs the
// DRAIN and nothing else". Setting N keys normally makes `resolveSelected()` fetch
// display text for every uncached key: an `in` filter chunked at 50, with an
// OR-chain fallback at 15 for backends that reject `in`. `selectAll` primes the
// cache from the rows it just drained, so that phase must not run at all.
//
// The store stub records every `load()`; a DRAIN load carries `skip`/`take`, a
// RESOLUTION load carries `filter`. Counting the two apart is the whole test.
//
// The bare-`setValue` arm is the control: it must STILL resolve. Without it, a
// "fix" that simply disabled resolution everywhere would pass unnoticed.

export async function run({ port, page, reporter }) {
  await page.goto(`http://127.0.0.1:${port}/?fixture=dropdown-select-all`, { waitUntil: 'load' })
  await page.waitForFunction(() => window.__ready === true, null, { timeout: 60000 })

  // ── selectAll: drains, selects everything, resolves nothing ─────────────────
  const all = await page.evaluate(() => window.__runSelectAll())

  reporter.check(
    'selectAll selects every row, including ones never rendered',
    all && all.selected === all.total,
    `selected=${all?.selected} of ${all?.total}`,
  )
  reporter.check(
    'selectAll drains the source',
    all && all.drain > 0,
    `drain loads=${all?.drain}`,
  )
  reporter.check(
    'selectAll makes ZERO display-resolution requests',
    all && all.resolution === 0,
    `resolution loads=${all?.resolution} (must be 0 — the drained rows prime the cache)`,
  )
  reporter.check(
    'and the display text is available anyway',
    all && all.firstText.length > 0,
    `first selected item text = ${JSON.stringify(all?.firstText)}`,
  )

  // ── the path <mono-table-checkbox type="all"> actually takes ────────────────
  // The element calls the GRID's `check.selectAll()`, not `dd.selectAll()` — so
  // it misses the one line that primes the display cache, and every chip falls
  // back to `String(key)`. The docs promise the two are interchangeable, so the
  // chips must read `displayExpr` here too, and still without a resolution fetch:
  // the drained rows are already in the grid's check store.
  for (const how of ['all', 'per-page', 'row']) {
    const via = await page.evaluate((h) => window.__viaCheckbox(h), how)

    reporter.check(
      `check.${how === 'row' ? 'toggle' : how === 'per-page' ? 'selectPage' : 'selectAll'}() labels chips with displayExpr, not the key`,
      via && via.keyShapedCount === 0,
      `${via?.keyShapedCount}/${via?.selected} chips showed their key (e.g. ${JSON.stringify(via?.sampleKeyShaped)}); first text = ${JSON.stringify(via?.firstText)}`,
    )
    reporter.check(
      `…and costs ZERO display-resolution requests (${how})`,
      via && via.resolution === 0,
      `resolution loads=${via?.resolution} — the rows are already in check().rows()`,
    )
  }

  // ── control: the same keys WITHOUT rows must still resolve ──────────────────
  const bare = await page.evaluate(() => window.__runSetValueBare())
  reporter.check(
    'setValue(keys) with no rows still resolves — the cost selectAll avoids',
    bare && bare.resolution > 0 && bare.selected === all.total,
    `resolution loads=${bare?.resolution} (expected > 0), selected=${bare?.selected}`,
  )

  // ── the manual form documented for custom scopes ────────────────────────────
  const withRows = await page.evaluate(() => window.__runSetValueWithRows())
  reporter.check(
    'setValue(keys, rows) skips resolution too',
    withRows && withRows.resolution === 0 && withRows.selected === all.total,
    `resolution loads=${withRows?.resolution}, selected=${withRows?.selected}`,
  )

  // ── the two guards ──────────────────────────────────────────────────────────
  const capped = await page.evaluate(() => window.__runCapped())
  reporter.check(
    'selectAll respects max rather than routing around it',
    capped && capped.selected === 10,
    `selected=${capped?.selected} (max=10)`,
  )

  const single = await page.evaluate(() => window.__runSingle())
  reporter.check(
    'selectAll is a no-op on a single-select dropdown',
    single && single.selected === 0,
    `selected=${single?.selected}`,
  )

  // ── the loading flag (this is what a "draining…" chip binds to) ─────────────
  const life = await page.evaluate(() => window.__runPendingLifecycle())
  reporter.check(
    'selectAllPending starts false, and a SUBSCRIBER sees it go true mid-drain',
    life && life.before === false && life.sawPendingTrue === true,
    `before=${life?.before} subscriberSawTrue=${life?.sawPendingTrue}`
      + ' — false here means the flag never notified on the leading edge, so a spinner would never paint',
  )
  reporter.check(
    'selectAllPending returns to false when the drain finishes',
    life && life.after === false,
    `after=${life?.after}`,
  )
  reporter.check(
    'a re-entrant selectAll while one is running is ignored, not doubled',
    life && life.selected === 250,
    `selected=${life?.selected} (expected 250, not a doubled or partial list)`,
  )

  // ── one store: the whole reason mono-table-checkbox works in the panel ──────
  const shared = await page.evaluate(() => window.__checkStoreIsShared())
  reporter.check(
    'the grid check store IS the dropdown selection — a row toggle moves dd.value',
    shared && shared.before === 0 && shared.valueSeesToggle === true,
    `dd.value after check().toggle = ${JSON.stringify(shared?.afterToggle)}`
      + ' — before this, the checkbox drove a second store and the chips never moved',
  )
  reporter.check(
    'check().selectAll fills dd.value, and clear empties it',
    shared && shared.afterAll === shared.total && shared.afterClear === 0,
    `afterAll=${shared?.afterAll} of ${shared?.total}, afterClear=${shared?.afterClear}`,
  )

  const through = await page.evaluate(() => window.__ddWritesThrough())
  reporter.check(
    'and the reverse — dd.toggleRow / dd.clear move the grid selection',
    through && through.checkSees === 1 && through.afterClear === 0,
    `check().count() after dd.toggleRow=${through?.checkSees}, after dd.clear=${through?.afterClear}`,
  )

  // ── the visible half: a spinner IN the box, not just a boolean ──────────────
  const cb = await page.evaluate(() => window.__checkboxLoading())
  reporter.check(
    'mono-checkbox loading paints a spinner inside the box',
    cb && cb.loading.hasSpinner && cb.loading.spinnerPainted,
    `loading=${JSON.stringify(cb?.loading)}`,
  )
  reporter.check(
    'the box suppresses its own tick/dash so the spinner is the only glyph',
    cb && cb.loading.suppressesOwnGlyphs === true,
    `has-custom-icon on the loading box = ${cb?.loading.suppressesOwnGlyphs}`,
  )
  reporter.check(
    'a loading checkbox cannot be clicked, and says so',
    cb && cb.loading.disabled === true && cb.loading.ariaBusy === 'true',
    `disabled=${cb?.loading.disabled} aria-busy=${cb?.loading.ariaBusy}`,
  )
  reporter.check(
    'an idle checkbox has none of that',
    cb
      && cb.idle.hasSpinner === false
      && cb.idle.disabled === false
      && cb.idle.suppressesOwnGlyphs === false,
    `idle=${JSON.stringify(cb?.idle)}`,
  )
}
