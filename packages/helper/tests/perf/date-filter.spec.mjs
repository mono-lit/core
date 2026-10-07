// The date filter's panel, driven end to end in a real browser: the menu row,
// the tree (years → months → … → seconds, only what exists, with counts), the
// tri-state ticks, what Apply stores on the column and what it does to the rows,
// reopening (seeded ticks), cascading with a plain header filter, and the
// exclusivity rule. The model itself is pinned in vitest (date-filter-tree.test.ts).

export async function run({ port, page, reporter }) {
  await page.goto(`http://127.0.0.1:${port}/?fixture=date-filter`, { waitUntil: 'load' })
  await page.waitForFunction(() => window.__ready === true, null, { timeout: 60000 })

  const rows = () => page.evaluate(() => window.__treeRows())
  const cf = (f) => page.evaluate((x) => window.__columnFilter(x), f)
  const ids = () => page.evaluate(() => window.__rowIds())
  const local = (y, m, d = 1, h = 0, mi = 0, s = 0) =>
    page.evaluate(([y, m, d, h, mi, s]) => new Date(y, m - 1, d, h, mi, s).toISOString(), [y, m, d, h, mi, s])

  // ── 1. the menu row and the panel ───────────────────────────────────────────
  const label = await page.evaluate(() => window.__openMenuFilter('th-when'))
  await page.waitForFunction(() => window.__isDatePanel(), null, { timeout: 10000 })
  let t = await rows()
  reporter.check(
    'D1: right-click → "Date Filter" row → a date panel: years only, blanks first, with counts, no search box',
    label === 'Date Filter' && !(await page.evaluate(() => window.__hasSearchBox())) &&
      t.map((r) => r.label).join('|') === '(Blanks)|2025|2026' && t.map((r) => r.count).join(',') === '1,1,4' &&
      t[0].leaf === true && t[2].leaf === false,
    `row ${label}; ${JSON.stringify(t)}`,
  )

  // ── 2. drill down: only periods that exist ─────────────────────────────────
  await page.evaluate(() => window.__expand('2026'))
  t = await rows()
  const months = t.filter((r) => r.level === 1).map((r) => `${r.label}:${r.count}`)
  reporter.check('D2: expanding 2026 lists its months only (March ×3, July ×1)', months.join('|') === 'March:3|July:1', months.join('|'))
  await page.evaluate(() => window.__expand('2026-3'))
  await page.evaluate(() => window.__expand('2026-3-5'))
  await page.evaluate(() => window.__expand('2026-3-5-13'))
  await page.evaluate(() => window.__expand('2026-3-5-13-5'))
  t = await rows()
  const seconds = t.filter((r) => r.level === 5).map((r) => r.label)
  reporter.check('D2: …down to the seconds present on 5 March 13:05', seconds.join('|') === '13:05:09|13:05:30', seconds.join('|'))

  // ── 3. tick March → Apply: one month range, rows narrowed, funnel active ────
  await page.evaluate(() => window.__tick('2026-3'))
  t = await rows()
  const marchState = t.find((r) => r.key === '2026-3')?.state
  const yearState = t.find((r) => r.key === '2026')?.state
  const dayState = t.find((r) => r.key === '2026-3-5')?.state
  reporter.check('D3: ticking March ticks its days and makes 2026 mixed', marchState === 'on' && dayState === 'on' && yearState === 'mixed', `${marchState} / ${dayState} / ${yearState}`)
  await page.evaluate(() => window.__button('Apply'))
  const applied = await cf('When')
  const expectFrom = await local(2026, 3)
  const expectTo = await local(2026, 4)
  reporter.check(
    'D3: Apply stores ONE {from,to} range for the month and the rows are March only',
    applied.length === 1 && applied[0].from === expectFrom && applied[0].to === expectTo && (await ids()).join(',') === '1,2,3',
    `filter ${JSON.stringify(applied)}, rows ${JSON.stringify(await ids())}`,
  )

  // ── 4. reopen: seeded from the applied range ───────────────────────────────
  await page.evaluate(() => window.__openFunnel('th-when'))
  await page.waitForFunction(() => window.__isDatePanel(), null, { timeout: 10000 })
  await page.evaluate(() => window.__expand('2026'))
  t = await rows()
  reporter.check(
    'D4: reopening shows March ticked, July off, 2026 mixed (and the tree still holds every date — its own filter is not applied to its list)',
    t.find((r) => r.key === '2026-3')?.state === 'on' && t.find((r) => r.key === '2026-7')?.state === 'off' &&
      t.find((r) => r.key === '2026')?.state === 'mixed' && t.find((r) => r.key === '2025')?.state === 'off',
    JSON.stringify(t.map((r) => `${r.key}:${r.state}`)),
  )
  // tick the whole year → one range for the year
  await page.evaluate(() => window.__tick('2026'))
  await page.evaluate(() => window.__button('Apply'))
  const year = await cf('When')
  reporter.check(
    'D4: ticking 2026 → Apply stores one range for the whole year',
    year.length === 1 && year[0].from === (await local(2026, 1)) && year[0].to === (await local(2027, 1)) && (await ids()).join(',') === '1,2,3,4',
    JSON.stringify(year),
  )

  // ── 5. cascade with the plain header filter ────────────────────────────────
  await page.evaluate(() => window.__openMenuFilter('th-brand'))
  await page.waitForFunction(() => !window.__isDatePanel() && document.querySelector('.mono-th-filter.open'), null, { timeout: 10000 })
  const brands = await page.evaluate(() => window.__plainRows())
  await page.evaluate(() => window.__tickPlain('One'))
  await page.evaluate(() => window.__button('Apply'))
  await page.evaluate(() => window.__openMenuFilter('th-when'))
  await page.waitForFunction(() => window.__isDatePanel(), null, { timeout: 10000 })
  t = await rows()
  reporter.check(
    'D5: with the year applied, the Brand list is scoped to 2026 brands; with Brand = One applied, the date tree is scoped to One\'s dates',
    brands.join('|') === 'One|Two' && t.map((r) => `${r.label}:${r.count}`).join('|') === '2025:1|2026:2' && (await ids()).join(',') === '1,2',
    `brands ${brands.join('|')}; tree ${JSON.stringify(t.map((r) => `${r.label}:${r.count}`))}; rows ${JSON.stringify(await ids())}`,
  )
  await page.evaluate(() => window.__button('Clear all columns'))
  reporter.check('D5: Clear all columns drops both', (await page.evaluate(() => window.__filteredColumns())).length === 0 && (await ids()).length === 6, JSON.stringify(await ids()))

  // ── 6. blanks, and exclusivity ─────────────────────────────────────────────
  await page.evaluate(() => window.__openFunnel('th-when'))
  await page.waitForFunction(() => window.__isDatePanel(), null, { timeout: 10000 })
  await page.evaluate(() => window.__tick('blank'))
  await page.evaluate(() => window.__button('Apply'))
  reporter.check('D6: ticking (Blanks) filters to the rows with no date', (await ids()).join(',') === '6' && (await cf('When')).length === 1, JSON.stringify(await ids()))
  await page.evaluate(() => window.__openFunnel('th-when'))
  await page.evaluate(() => window.__button('Clear'))

  const bothLabel = await page.evaluate(() => window.__openMenuFilter('th-both'))
  await page.waitForFunction(() => document.querySelector('.mono-th-filter.open'), null, { timeout: 10000 })
  const warned = await page.evaluate(() => window.__warnings.some((w) => w.includes('exclusive')))
  reporter.check(
    'D6: a column with BOTH headerFilter and dateFilter warns once and shows the date tree',
    bothLabel === 'Date Filter' && warned && (await page.evaluate(() => window.__isDatePanel())),
    `row ${bothLabel}, warned ${warned}, date panel ${await page.evaluate(() => window.__isDatePanel())}`,
  )

  // ── 7. a REAL ODataStore: the wall-clock round trip ────────────────────────
  //
  // devextreme parses `…T00:00:00Z` into LOCAL midnight and serialises a
  // local-midnight Date back as `…T00:00:00Z`. So with `utc` OFF (the default)
  // the tree buckets the rows under the server's own days and the range Apply
  // sends is the server's own literal — whatever timezone the browser is in.
  // `utc: true` on such a source would read the UTC parts of that local Date
  // and shift every day east of Greenwich to the one before. The stub also
  // rejects `$apply` (400), so the tree comes from the `$select` scan.
  {
    const rows = [
      { OrderID: 1, OrderDate: '1997-01-01T00:00:00Z' },
      { OrderID: 2, OrderDate: '1997-01-01T00:00:00Z' },
      { OrderID: 3, OrderDate: '1997-01-31T00:00:00Z' },
      { OrderID: 4, OrderDate: '1997-02-01T00:00:00Z' },
      { OrderID: 5, OrderDate: null },
    ]
    const urls = []
    await page.route('https://stub.local/**', (route) => {
      const url = decodeURIComponent(route.request().url())
      urls.push(url)
      if (url.includes('$apply')) return route.fulfill({ status: 400, contentType: 'application/json', body: '{"error":{"message":"$apply not supported"}}' })
      let out = rows
      const m = /OrderDate ge (\S+)\) and \(OrderDate lt (\S+)\)/.exec(url)
      if (m) out = rows.filter((r) => r.OrderDate !== null && r.OrderDate >= m[1] && r.OrderDate < m[2])
      else if (/OrderDate eq null/.test(url)) out = rows.filter((r) => r.OrderDate === null)
      const body = { '@odata.count': out.length, value: out }
      return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(body) })
    })
    await page.goto(`http://127.0.0.1:${port}/?fixture=date-filter-odata`, { waitUntil: 'load' })
    await page.waitForFunction(() => window.__ready === true, null, { timeout: 60000 })

    await page.evaluate(() => window.__openFunnel())
    await page.waitForFunction(() => window.__treeRows().length > 0, null, { timeout: 10000 })
    await page.evaluate(() => window.__expand('1997'))
    const tree = await page.evaluate(() => window.__treeRows())
    const keys = tree.map((r) => `${r.key}:${r.count}`).join('|')
    reporter.check(
      'D7 odata: the tree files each row under the server’s own day (1997 → Jan ×3, Feb ×1, blanks ×1) from the $select scan after $apply is refused',
      keys === 'blank:1|1997:4|1997-1:3|1997-2:1' && urls.some((u) => u.includes('$apply')) && urls.some((u) => /\$select=OrderDate(&|$)/.test(u)),
      `tree ${keys}; urls ${JSON.stringify(urls)}`,
    )

    await page.evaluate(() => window.__tick('1997-1'))
    await page.evaluate(() => window.__apply())
    await page.waitForFunction(() => window.__state().total === 3, null, { timeout: 10000 }).catch(() => {})
    const st = await page.evaluate(() => window.__state())
    const sent = urls.filter((u) => u.includes('$filter')).pop() ?? ''
    reporter.check(
      'D7 odata: ticking January sends the server’s own literals (ge 1997-01-01T00:00:00Z and lt 1997-02-01T00:00:00Z) and the rows are the three January orders',
      sent.includes('OrderDate ge 1997-01-01T00:00:00Z') && sent.includes('OrderDate lt 1997-02-01T00:00:00Z') && st.total === 3 && st.days.join(',') === '1,1,31',
      `sent ${sent}; state ${JSON.stringify(st)}`,
    )
    await page.unroute('https://stub.local/**')
  }
}
