// `<mono-table-paging type="virtual-scroll" render-all-below>` — stop windowing a SMALL set.
//
// Why it exists: a virtual window swaps rows on every `overscan` step of scrolling, and each swap
// is a notify + re-render + style/layout pass over the table. On a wide table with sticky columns
// (esw's input-post-budget: 19 columns, ~240 rows) Chrome stalled the scroll on every step —
// measured 44 frames over 50ms in a 120-step wheel scroll, against 14 with every row mounted.
// Mounting every row AT ONCE froze the page ~2.5s instead, hence the per-frame fill.
//
// What this guards (DOM state, not timing):
//   1. a small set ends up FULLY mounted, with no spacers;
//   2. it gets there PROGRESSIVELY — the first paint is a viewport's worth, not the whole set;
//   3. scrolling mid-fill to the bottom mounts what the viewport needs at once;
//   4. a new result set (setData) fills again from the top;
//   5. past the limit, the set is windowed exactly as before.

export async function run({ port, page, reporter }) {
  await page.goto(`http://127.0.0.1:${port}/?fixture=render-all-below`, { waitUntil: 'load' })
  await page.waitForFunction(() => window.__ready === true, null, { timeout: 60000 })
  const settle = () => page.waitForFunction(
    () => { const s = window.__state(); return s.loaded > 0 && s.mounted === s.loaded && s.padBottom === 0 },
    null, { timeout: 10000 },
  ).then(() => true, () => false)

  // 1 + 2. 200 rows, limit 300: fills to 200, through more than one paint.
  const filled = await settle()
  const s1 = await page.evaluate(() => window.__state())
  const h1 = await page.evaluate(() => window.__history.filter((n) => n > 0))
  reporter.check('a set under render-all-below ends up fully mounted', filled && s1.mounted === 200, JSON.stringify(s1))
  reporter.check('…with no spacer rows left', s1.padTop === 0 && s1.padBottom === 0, `padTop=${s1.padTop} padBottom=${s1.padBottom}`)
  reporter.check(
    '…and it filled progressively, starting from a viewport\'s worth',
    h1.length >= 3 && h1[0] < 200 && h1[0] >= 10 && h1.every((n, i) => i === 0 || n >= h1[i - 1]),
    `mounted per notify: ${h1.join(' → ')}`,
  )

  // 3. A new set filled 2 rows per frame — slow enough to still be filling — then jump to the bottom.
  await page.evaluate(() => { document.getElementById('pager').fillChunk = 2 })
  await page.evaluate(() => window.__setData(250, 'b'))
  await page.waitForFunction(() => window.__state().mounted > 0, null, { timeout: 5000 })
  await page.evaluate(() => window.__scrollTo(1e6))
  await page.waitForTimeout(100)
  const s3 = await page.evaluate(() => window.__state())
  reporter.check(
    'scrolling to the bottom mid-fill mounts the bottom rows at once',
    s3.last === 'b249' && s3.scrollTop > 0,
    `last mounted=${s3.last} mounted=${s3.mounted} scrollTop=${s3.scrollTop}`,
  )

  // 4. …and the new set still completes, from the top.
  await page.evaluate(() => { document.getElementById('pager').fillChunk = 25 })
  const refilled = await settle()
  const s4 = await page.evaluate(() => window.__state())
  reporter.check('a new result set fills again, completely', refilled && s4.mounted === 250 && s4.first === 'b0', JSON.stringify(s4))

  // 5. Over the limit: windowed as before, and the window follows the scroll.
  await page.evaluate(() => window.__scrollTo(0))
  await page.evaluate(() => window.__setData(1000, 'c'))
  await page.waitForTimeout(150)
  const s5 = await page.evaluate(() => window.__state())
  await page.evaluate(() => window.__scrollTo(15000))
  await page.waitForTimeout(150)
  const s6 = await page.evaluate(() => window.__state())
  reporter.check(
    'a set over the limit stays windowed',
    s5.loaded === 1000 && s5.mounted < 100 && s5.padBottom > 0,
    JSON.stringify(s5),
  )
  reporter.check(
    '…and its window follows the scroll',
    s6.mounted < 100 && s6.padTop > 0 && s6.first !== 'c0',
    JSON.stringify(s6),
  )
}
