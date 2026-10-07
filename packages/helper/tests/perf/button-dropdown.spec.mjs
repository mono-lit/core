// Regression tests for `mono-button-dropdown`'s `buttons` update-skipping.
//
// Two things must not rot:
//
// 1. CORRECTNESS. `buttons` compares entries by content and IGNORES function fields,
//    so it reports "same" for an array whose closures were all rebuilt. That is only
//    safe because the click listener resolves its entry from `_itemParts` at click
//    time AND `_retargetItemParts()` re-points that map on every assignment, skipped
//    or not. Break either half and a click fires another row's handler — silently.
//
// 2. COST. The fix took an unrelated parent re-render on a 2000-row table from 737ms
//    of blocked main thread to ~48ms. Without a guard here, any future change that
//    re-introduces a per-row re-render would look fine in every demo and only show up
//    on a customer's full grid.

export async function run({ port, page, reporter }) {
  const clickEntry = async (rowId, entryLabel) =>
    page.evaluate(
      async ([id, label]) => {
        window.__lastClick = null
        const tr = document.querySelector(`tr[data-row-key="${id}"]`)
        if (!tr) return { error: `row ${id} not rendered` }
        const dd = tr.querySelector('mono-button-dropdown')
        const trigger = dd.querySelector('button, [data-mono-bd-trigger], mono-button')
        trigger.click()
        await new Promise((r) => setTimeout(r, 150))

        // Panels are portaled to <body>, so EVERY row's entries are in the document.
        // Only the one just opened is visible — scope to that, or this matches row 1
        // every time and the whole suite passes while asserting nothing.
        const items = [...document.querySelectorAll('[data-mono-bd-item]')].filter((el) =>
          typeof el.checkVisibility === 'function' ? el.checkVisibility() : el.offsetParent !== null,
        )
        const target = items.find((el) => (el.textContent || '').trim().includes(label))
        if (!target) {
          return { error: 'entry not found', visible: items.map((e) => e.textContent.trim()) }
        }
        target.click()
        await new Promise((r) => setTimeout(r, 150))
        return window.__lastClick
      },
      [rowId, entryLabel],
    )

  // ── correctness, on a small grid ────────────────────────────────────────────
  await page.goto(`http://127.0.0.1:${port}/?arm=baseline&rows=60`, { waitUntil: 'load' })
  await page.waitForFunction(() => window.__ready === true, null, { timeout: 60000 })
  await page.waitForTimeout(500)

  let r = await clickEntry(7, 'Edit')
  reporter.check('fresh page: row 7 Edit', r?.id === 7 && r.action === 'Edit', JSON.stringify(r))

  // Each toggle hands every dropdown a NEW array with NEW closures; the content is
  // equivalent, so every one of these updates is suppressed.
  for (let i = 0; i < 6; i++) await page.evaluate(() => window.__toggle())
  await page.waitForTimeout(300)

  r = await clickEntry(23, 'Edit')
  reporter.check('after 6 suppressed updates: row 23 Edit', r?.id === 23 && r.action === 'Edit', JSON.stringify(r))

  r = await clickEntry(41, 'Delete')
  reporter.check('after 6 suppressed updates: row 41 Delete', r?.id === 41 && r.action === 'Delete', JSON.stringify(r))

  // The sharp case, and the only one that exercises `_retargetItemParts()`: rows are
  // replaced by NEW objects of identical *rendered* content, so the comparator says
  // "same" and the update is suppressed. `Gen` is bumped but never rendered, so a
  // handler still closed over the previous row object reports the OLD generation.
  // Asserting on `id` alone is not enough here — the stale object has the same id.
  await page.evaluate(() => {
    const ref = window.__rows()
    ref.value = ref.value.map((row) => ({ ...row, Gen: row.Gen + 1 }))
  })
  await page.waitForTimeout(300)
  r = await clickEntry(12, 'Edit')
  reporter.check(
    'after rows replaced by equal copies: row 12 handler sees the CURRENT row',
    r?.id === 12 && r.gen === 1 && r.action === 'Edit',
    `${JSON.stringify(r)} — gen 0 means the click fired a closure over the stale row object`,
  )

  // The case `_retargetItemParts()` actually exists for: the panel is ALREADY OPEN
  // when the parent re-renders. Opening a panel is itself a render, which refreshes
  // `_itemParts` from the live `buttons` — so every closed-then-opened path self-heals
  // and cannot detect a missing retarget. Here nothing re-renders between the row
  // swap and the click, so the cached entry is the only thing standing.
  r = await page.evaluate(async () => {
    window.__lastClick = null
    const tr = document.querySelector('tr[data-row-key="18"]')
    const dd = tr.querySelector('mono-button-dropdown')
    dd.querySelector('button, [data-mono-bd-trigger], mono-button').click()
    await new Promise((res) => setTimeout(res, 150))

    // Swap the rows WHILE the panel is open: equal rendered content, new objects.
    const ref = window.__rows()
    ref.value = ref.value.map((row) => ({ ...row, Gen: row.Gen + 1 }))
    await new Promise((res) => setTimeout(res, 200))

    const items = [...document.querySelectorAll('[data-mono-bd-item]')].filter((el) =>
      typeof el.checkVisibility === 'function' ? el.checkVisibility() : el.offsetParent !== null,
    )
    const target = items.find((el) => (el.textContent || '').trim().includes('Edit'))
    if (!target) return { error: 'entry not found' }
    target.click()
    await new Promise((res) => setTimeout(res, 150))
    return window.__lastClick
  })
  reporter.check(
    'rows swapped while panel OPEN: row 18 handler sees the CURRENT row',
    r?.id === 18 && r.gen === 2,
    `${JSON.stringify(r)} — expected gen 2; a lower gen means _retargetItemParts() did not run`,
  )

  // A real content change must still re-render — `label` is not a function field.
  await page.evaluate(() => {
    const ref = window.__rows()
    ref.value = ref.value.map((row) => (row.Id === 30 ? { ...row, EditLabel: 'Ubah' } : row))
  })
  await page.waitForTimeout(300)
  r = await clickEntry(30, 'Ubah')
  reporter.check('content change still re-renders: row 30 relabelled', r?.id === 30, JSON.stringify(r))

  // ── cost, on a grid big enough for a regression to show ─────────────────────
  const measure = async (arm, rows) => {
    await page.goto(`http://127.0.0.1:${port}/?arm=${arm}&rows=${rows}`, { waitUntil: 'load' })
    await page.waitForFunction(() => window.__ready === true, null, { timeout: 60000 })
    await page.waitForTimeout(600)
    const samples = []
    for (let i = 0; i < 7; i++) {
      samples.push(await page.evaluate(() => window.__toggle()))
      await page.waitForTimeout(400)
    }
    // Min: scheduler noise only ever ADDS to a duration.
    return Math.min(...samples)
  }

  // Threshold sits well above the ~48ms measured after the fix and far below the
  // 737ms before it, so it catches a real regression without flaking on a slow box.
  const BUDGET_MS = 250
  const blocked = await measure('baseline', 2000)
  reporter.check(
    `2000-row parent re-render stays under ${BUDGET_MS}ms`,
    blocked < BUDGET_MS,
    `blocked ${blocked.toFixed(1)}ms (was 737ms before the buttons guard, ~48ms after)`,
  )
  console.log(`  ...measured ${blocked.toFixed(1)}ms blocked per re-render at 2000 rows`)
}
