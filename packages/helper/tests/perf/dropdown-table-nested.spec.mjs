// A popup opened from INSIDE a `<mono-dropdown-table>` panel is "inside" it.
//
// Every popup in the library portals its panel to `<body>`, so a header filter
// opened from a `<mono-table-th>` in the dropdown-table's panel — or a select's
// option list — is nowhere near the dropdown-table in the DOM. The dropdown-table's
// outside-click and Escape listeners used to read that as "outside" and close the
// panel the moment the user clicked into the filter's search box. Found live.
//
// The fix is ownership: `PopupPortalController` remembers which element opened each
// portal, and `containsInPath` walks a nested portal back to its owner. These arms
// are the contract — and the last one guards the other direction: a popup that is
// NOT ours (an unrelated select on the page) must still count as outside.
//
// Real `pointerdown` / `click` events (bubbling, composed) on the real portaled
// elements, in a real browser: the document-level capture listeners are the thing
// under test, and nothing short of a real event path exercises them.

export async function run({ port, page, reporter }) {
  await page.goto(`http://127.0.0.1:${port}/?fixture=dropdown-table-nested`, { waitUntil: 'load' })
  await page.waitForFunction(() => window.__ready === true, null, { timeout: 60000 })

  const settle = (ms = 120) => page.waitForTimeout(ms)
  const isOpen = () => page.evaluate(() => window.__isOpen())
  const filterOpen = () => page.evaluate(() => window.__filterOpen())

  // ── arm 1: click INTO the header filter's search box ────────────────────────
  await page.evaluate(() => window.__open())
  reporter.check('the dropdown-table opens', await isOpen(), 'open() did not open the panel')

  await page.evaluate(() => window.__openFilter())
  await page.waitForFunction(() => window.__filterOpen(), null, { timeout: 10000 })
  reporter.check(
    'right-click → Header Filter opens the filter popup while the dropdown-table stays open',
    (await filterOpen()) && (await isOpen()),
    `filter ${await filterOpen()}, dropdown ${await isOpen()}`,
  )

  await page.evaluate(() => window.__pointer('.mono-th-filter.open .mono-th-filter-input'))
  await settle()
  reporter.check(
    'A1: a pointerdown in the filter search box keeps the dropdown-table OPEN',
    (await isOpen()) && (await filterOpen()),
    `dropdown ${await isOpen()}, filter ${await filterOpen()} — the filter portal is not the dropdown-table\'s, so it read as outside`,
  )

  // ── arm 2: type in it, tick a value ─────────────────────────────────────────
  const before = await page.evaluate(() => window.__filterRows())
  await page.focus('.mono-th-filter.open .mono-th-filter-input')
  await page.keyboard.type('Aa')
  await settle()
  const rows = await page.evaluate(() => window.__filterRows())
  reporter.check(
    'A2: typing in the filter search filters its list, dropdown-table still open',
    (await isOpen()) && rows > 0 && rows < before,
    `dropdown ${await isOpen()}, ${before} → ${rows} value row(s) for "Aa"`,
  )
  await page.evaluate(() => window.__pointer('.mono-th-filter.open .mono-th-filter-list .mono-th-check'))
  await settle()
  reporter.check(
    'A2: ticking a value row keeps the dropdown-table open',
    await isOpen(),
    `dropdown ${await isOpen()}`,
  )

  // ── arm 3: Escape closes the FILTER only; a second Escape closes the panel ──
  await page.keyboard.press('Escape')
  await settle()
  reporter.check(
    'A3: Escape inside the filter closes the filter and NOT the dropdown-table',
    !(await filterOpen()) && (await isOpen()),
    `filter ${await filterOpen()}, dropdown ${await isOpen()}`,
  )
  await page.evaluate(() => document.querySelector('.mono-dropdown-table-panel .mono-input-native')?.focus())
  await page.keyboard.press('Escape')
  await settle()
  reporter.check(
    'A3: Escape from the panel itself closes the dropdown-table',
    !(await isOpen()),
    `dropdown ${await isOpen()}`,
  )

  // ── arm 4: a nested <mono-select> in the search slot ────────────────────────
  await page.evaluate(() => window.__open())
  await page.evaluate(() => window.__openSelect('inner'))
  const picked = await page.evaluate(() => window.__pickOption('Beta'))
  await settle()
  const innerValue = await page.evaluate(() => window.__selectValue('inner'))
  reporter.check(
    'A4: picking an option in a nested select keeps the dropdown-table open (and picks it)',
    picked && (await isOpen()) && innerValue === 'b',
    `picked ${picked}, dropdown ${await isOpen()}, value ${JSON.stringify(innerValue)}`,
  )

  // ── arm 5: controls — real outside clicks still close ───────────────────────
  await page.evaluate(() => window.__pointer('#elsewhere'))
  await settle()
  reporter.check('A5 control: a click elsewhere on the page closes it', !(await isOpen()), `dropdown ${await isOpen()}`)

  await page.evaluate(() => window.__open())
  await page.evaluate(() => window.__openSelect('outer'))
  const pickedOuter = await page.evaluate(() => window.__pickOption('Gamma'))
  await settle()
  reporter.check(
    'A5 control: an UNRELATED select\'s option list is still outside — ownership, not "any portal"',
    pickedOuter && !(await isOpen()),
    `picked ${pickedOuter}, dropdown ${await isOpen()}`,
  )

  // ── arm 6: "Clear all columns" shows only when it does something ────────────
  //
  // It drops EVERY column's combined filter. It used to be rendered on every
  // menu-opened panel and merely disabled, which beside an empty value list read
  // as a statement about the ticks. Now: absent until ANOTHER column is filtered
  // (with this one the only filtered column, "Clear" already does the job), and
  // named for its scope with the count.
  const buttons = () => page.evaluate(() => window.__filterButtons())
  const openFor = async (id) => {
    await page.evaluate((i) => window.__openFilterFor(i), id)
    await page.waitForFunction(() => window.__filterOpen(), null, { timeout: 10000 })
  }
  await page.evaluate(() => window.__open())
  await openFor('th-city')
  let b = await buttons()
  reporter.check(
    'A6: with no filter anywhere the footer is Clear / Cancel / Apply — no Clear all',
    b.join('|') === 'Clear|Cancel|Apply',
    b.join(' | '),
  )
  await page.evaluate(() => window.__tickFirstAndApply())
  await settle()
  await openFor('th-city')
  b = await buttons()
  reporter.check(
    'A6: with only THIS column filtered there is still no Clear all (Clear covers it)',
    b.join('|') === 'Clear|Cancel|Apply' && (await page.evaluate(() => window.__filteredColumns())).length === 1,
    b.join(' | '),
  )
  await page.keyboard.press('Escape')
  await settle()
  await openFor('th-name')
  b = await buttons()
  reporter.check(
    'A6: another column filtered → "Clear all columns (1)" appears in this column\'s panel',
    b.includes('Clear all columns (1)'),
    b.join(' | '),
  )
  await page.evaluate(() => window.__tickFirstAndApply())
  await settle()
  await openFor('th-city')
  b = await buttons()
  const cleared = await page.evaluate(() => window.__clickFilterButton('Clear all columns'))
  await settle()
  const left = await page.evaluate(() => window.__filteredColumns())
  reporter.check(
    'A6: two columns filtered → "Clear all columns (2)", and clicking it drops both',
    b.includes('Clear all columns (2)') && cleared && left.length === 0,
    `${b.join(' | ')} → clicked ${cleared}, filtered columns left: ${JSON.stringify(left)}`,
  )

  // ── arm 7: the combine gesture carries over to the icons ────────────────────
  //
  // Start a filter from the MENU (right-click) and the next FUNNEL click on another
  // column combines instead of replacing — a user who began combining means to keep
  // combining. Start from the funnel and funnels stay single. Same for the sort
  // arrow after a menu `Sort ›`. The memory ends when nothing is filtered / sorted.
  const filtered = () => page.evaluate(() => window.__filteredColumns())
  const funnel = (id) => page.evaluate((i) => window.__funnel(i), id)
  // City first (3 values → 2 people left), so the cascaded Name list still has 2
  // values and ticking the last is one of them, not both.
  // menu path on City
  await openFor('th-city')
  await page.evaluate(() => window.__tickFirstAndApply())
  await settle()
  // funnel path on Name — must now COMBINE
  await funnel('th-name')
  await page.waitForFunction(() => window.__filterOpen(), null, { timeout: 10000 })
  const funnelButtons = await buttons()
  await page.evaluate(() => window.__tickFirstAndApply())
  await settle()
  const combined = await filtered()
  reporter.check(
    'A7 filter: menu-filter City, then the Name FUNNEL combines (its panel already offers "Clear all columns (1)")',
    combined.length === 2 && funnelButtons.includes('Clear all columns (1)'),
    `filtered ${JSON.stringify(combined)}; funnel panel buttons ${funnelButtons.join(' | ')}`,
  )
  // clear everything → the memory is gone → funnels are single again
  await funnel('th-name')
  await page.waitForFunction(() => window.__filterOpen(), null, { timeout: 10000 })
  await page.evaluate(() => window.__clickFilterButton('Clear all columns'))
  await settle()
  await funnel('th-city')
  await page.waitForFunction(() => window.__filterOpen(), null, { timeout: 10000 })
  await page.evaluate(() => window.__tickFirstAndApply())
  await settle()
  await funnel('th-name')
  await page.waitForFunction(() => window.__filterOpen(), null, { timeout: 10000 })
  await page.evaluate(() => window.__tickFirstAndApply())
  await settle()
  const single = await filtered()
  reporter.check(
    'A7 filter: after Clear all, funnel-first stays single — the second funnel REPLACES',
    single.length === 1 && single[0] === 'Name',
    `filtered ${JSON.stringify(single)}`,
  )
  await funnel('th-name')
  await page.waitForFunction(() => window.__filterOpen(), null, { timeout: 10000 })
  await page.evaluate(() => window.__clickFilterButton('Clear'))
  await settle()

  // sort
  const sorts = () => page.evaluate(() => window.__sorts())
  const arrow = (id) => page.evaluate((i) => window.__arrow(i), id)
  const pickedSort = await page.evaluate(() => window.__menuSort('th-name', 'Ascending'))
  await arrow('th-city')
  const twoSorts = await sorts()
  reporter.check(
    'A7 sort: menu Sort › Ascending on Name, then the City ARROW appends',
    pickedSort && twoSorts.join(',') === 'Name:asc,City:asc',
    `picked ${pickedSort}, sorts ${JSON.stringify(twoSorts)}`,
  )
  await page.evaluate(() => window.__menuSort('th-city', 'Clear all'))
  await arrow('th-name')
  await arrow('th-city')
  const singleSort = await sorts()
  reporter.check(
    'A7 sort: after Clear all sorting, arrow-first stays single — the second arrow REPLACES',
    singleSort.join(',') === 'City:asc',
    `sorts ${JSON.stringify(singleSort)}`,
  )

  // ── arm 8: ticking EVERY listed value is a filter, not a reset ──────────────
  //
  // "All ticked = no filter" was the rule, and with a cascaded list it silently
  // wiped every column: after City the Name list holds the two names of that
  // city; select-all + Apply meant "those two", and the grid read it as "clear".
  await openFor('th-city')
  await page.evaluate(() => window.__tickFirstAndApply())
  await settle()
  const cityValues = await page.evaluate(() => window.__columnFilter('City'))
  await openFor('th-name')
  const namesListed = await page.evaluate(() => window.__filterRows())
  await page.evaluate(() => window.__tickAllAndApply())
  await settle()
  const afterAll = await filtered()
  const nameValues = await page.evaluate(() => window.__columnFilter('Name'))
  reporter.check(
    'A8: select-all on a cascaded (narrowed) list applies exactly those values and keeps the other column filter',
    afterAll.length === 2 && cityValues.length === 1 && nameValues.length === namesListed - 1 && nameValues.length > 0,
    `filtered ${JSON.stringify(afterAll)}; City ${JSON.stringify(cityValues)}; Name ${JSON.stringify(nameValues)} of ${namesListed - 1} listed`,
  )
  await openFor('th-name')
  await page.evaluate(() => window.__clickFilterButton('Clear all columns'))
  await settle()
  await openFor('th-city')
  await page.evaluate(() => window.__tickAllAndApply())
  await settle()
  const fullAll = await page.evaluate(() => window.__columnFilter('City'))
  reporter.check(
    'A8: select-all on a FULL list is a filter too (every value, shown as active), never a reset',
    fullAll.length === 3 && (await filtered()).join(',') === 'City',
    `City ${JSON.stringify(fullAll)}, filtered ${JSON.stringify(await filtered())}`,
  )
}
