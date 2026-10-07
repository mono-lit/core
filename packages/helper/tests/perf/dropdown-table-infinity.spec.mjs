// Regression: `<mono-table-paging type="infinity-scroll">` inside a `<mono-dropdown-table>` panel
// stopped auto-loading once the panel opened — only the "Load more" fallback button worked.
// Found live in esw-ui's input-transfer-budget.vue pickers.
//
// The panel is portaled into <body> on first open, which disconnects and reconnects everything in
// it. Panel CSS is scoped under the dropdown-table root since the attribute port, and the portal
// used to receive the root's attributes only AFTER the move — so for that synchronous moment the
// body region had no `overflow: auto`, no bounded height, nothing. The pager resolved no scroll
// container; a spinner froze the unbounded height; an empty state lost its reserved room.
//
// Fixed at the source: `PopupPortalController._adopt()` dresses the portal before the panel
// enters it. The pager also resolves its scroller structurally (body slot AND footer slot, light
// and shadow), and the empty/error overlays re-apply on reconnect.

export async function run({ port, page, reporter }) {
  await page.goto(`http://127.0.0.1:${port}/?fixture=dropdown-table-infinity`, { waitUntil: 'load' })
  await page.waitForFunction(() => window.__ready === true, null, { timeout: 60000 })
  await page.waitForTimeout(300)
  const state = (name) => page.evaluate((n) => window.__state(n), name)

  // ── the portal is dressed BEFORE the panel moves in ─────────────────────────
  const closed = await state('body')
  reporter.check('a CLOSED panel prefetches nothing past page 0', closed.loaded === 20, `loaded ${closed.loaded}`)

  const { dressedBeforeMove } = await page.evaluate(() => window.__open('body'))
  reporter.check(
    'the portal carries the root\'s attributes before the panel is moved into it',
    dressedBeforeMove === true,
    `dressed before move: ${dressedBeforeMove}`,
  )

  // ── pager in the body slot ──────────────────────────────────────────────────
  const opened = await state('body')
  reporter.check(
    'body-slot pager: after the portal move it listens to the panel body region',
    opened.scrollEl === 'region:body',
    `scroll container: ${opened.scrollEl}`,
  )
  await page.evaluate(() => window.__scrollBottom('body'))
  const one = await state('body')
  reporter.check('body-slot pager: scrolling to the end appends the next page', one.loaded === 40, `loaded ${one.loaded}`)
  await page.evaluate(() => window.__scrollBottom('body'))
  const two = await state('body')
  reporter.check('body-slot pager: …and again (one page per end-of-scroll)', two.loaded === 60, `loaded ${two.loaded}`)
  await page.evaluate(() => window.__close('body'))

  // ── pager in slot="footer" ──────────────────────────────────────────────────
  await page.evaluate(() => window.__open('footer'))
  const foot = await state('footer')
  reporter.check(
    'footer-slot pager: resolves the panel body region (a sibling, not an ancestor)',
    foot.scrollEl === 'region:body',
    `scroll container: ${foot.scrollEl}`,
  )
  await page.evaluate(() => window.__scrollBottom('footer'))
  const footOne = await state('footer')
  reporter.check('footer-slot pager: scrolling the body appends the next page', footOne.loaded === 40, `loaded ${footOne.loaded}`)
  await page.evaluate(() => window.__close('footer'))

  // ── a load in flight at first open ──────────────────────────────────────────
  await page.evaluate(() => window.__open('loading'))
  const ld = await state('loading')
  reporter.check(
    'spinner up at first open: the body region stays bounded and scrollable',
    !!ld.body && ld.body.ch <= 320 && ld.body.sh > ld.body.ch && ld.body.ov === 'auto',
    JSON.stringify(ld.body),
  )
  await page.evaluate(() => window.__close('loading'))

  // ── an empty state at first open ────────────────────────────────────────────
  await page.evaluate(() => window.__open('empty'))
  const em = await page.evaluate(() => window.__emptyHold())
  reporter.check(
    'empty state at first open keeps its reserved room after the portal move',
    em.visible && /^\d+(\.\d+)?(px|rem)|calc|max/.test(em.hold),
    `visible ${em.visible}, --mono-table-hold-empty "${em.hold}"`,
  )
}
