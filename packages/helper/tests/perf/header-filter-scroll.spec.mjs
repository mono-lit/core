// Regression: the header-filter panel went BLANK when you scrolled its value list
// and then ticked any checkbox.
//
// It was never a data bug — `_values` is intact the whole time. Every value row
// hides its real <input> with `position: absolute`, and `.mono-th-check` carried no
// `position`, so the input resolved against `.mono-th-filter` (the panel) instead of
// against its row. It therefore did not move when the list scrolled, ended up far
// below the panel's box, and clicking the label focused it — so the browser scrolled
// the panel (an `overflow: hidden` box IS programmatically scrollable) to reach it,
// carrying head, search, list and footer out of view. Fix: `position: relative` on
// `.mono-th-check`, plus `overflow: clip` on the panel so nothing can scroll it again.
//
// This asserts DOM STATE, not timing — per the house rule in `select-loop.spec.mjs`,
// "when the thing being asserted is 'this did NOT happen', count it, do not time it."
//
// THE SECOND ARM IS THE POINT. "(Select all)" is `position: sticky`, which already
// established a containing block, so it never reproduced the bug and still passes
// with the fix reverted — which is what shows the deep-row arm is measuring the
// containing block and not something incidental.
//
// WHAT THIS TEST DOES AND DOES NOT GUARD (measured, not assumed). The two fixes are
// independent: either one alone makes the deep-row arm pass, so this fails only when
// BOTH are gone. Reverting both reproduces it exactly — `scrollTop=447`,
// `headVisible:false`, and `checked:1`, i.e. the value ticked and the panel was
// simply scrolled off. Do not read a green run as proof that `position: relative` is
// still on `.mono-th-check`; read it as proof that the panel cannot scroll away.

export async function run({ port, page, reporter }) {
  await page.goto(`http://127.0.0.1:${port}/?fixture=header-filter-scroll`, {
    waitUntil: 'load',
  })
  await page.waitForFunction(() => window.__ready === true, null, { timeout: 60000 })

  const open = async () => {
    await page.evaluate(() => window.__openFilter())
    await page.waitForFunction(() => !!document.querySelector('.mono-th-filter-list .mono-th-check'), null, {
      timeout: 10000,
    })
    await page.waitForTimeout(120)
  }

  const close = async () => {
    await page.keyboard.press('Escape')
    await page.waitForTimeout(120)
  }

  // ── arm 1: scroll to the bottom, tick the DEEPEST value row ─────────────────
  await open()
  const scrolled = await page.evaluate(() => window.__scrollListToEnd())
  await page.waitForTimeout(60)

  reporter.check(
    'the value list actually scrolls (25 values past a 224px cap)',
    scrolled > 0,
    `list scrollTop after scrolling to end = ${scrolled}`,
  )

  const clicked = await page.evaluate(() => window.__clickRow('last'))
  await page.waitForTimeout(120)
  const deep = await page.evaluate(() => window.__panelState())

  reporter.check(
    'clicking a deep row after scrolling does NOT scroll the panel away',
    deep && deep.scrollTop === 0,
    `panel scrollTop=${deep?.scrollTop} (must be 0) — clicked ${JSON.stringify(clicked)}`,
  )
  reporter.check(
    'the panel head is still inside the panel box after the click',
    deep && deep.headVisible === true,
    JSON.stringify(deep),
  )
  reporter.check(
    'and the click still ticked the value',
    deep && deep.checked >= 1,
    `checked=${deep?.checked}`,
  )
  await close()

  // ── arm 2: the sticky "(Select all)" row — the control ──────────────────────
  await open()
  await page.evaluate(() => window.__scrollListToEnd())
  await page.waitForTimeout(60)
  await page.evaluate(() => window.__clickRow('all'))
  await page.waitForTimeout(120)
  const all = await page.evaluate(() => window.__panelState())

  reporter.check(
    '(Select all) never scrolls the panel — it is sticky, so it was always contained',
    all && all.scrollTop === 0,
    `panel scrollTop=${all?.scrollTop} — this arm passes even without the fix`,
  )
  await close()
}
