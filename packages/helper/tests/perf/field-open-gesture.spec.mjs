// The field-click gesture: a non-searchable field's body TOGGLES (open, then
// close) and so does the chevron; a searchable field's input OPENS (never closes
// — the user is there to type) and so does typing, the chevron closes; focus alone
// opens nothing; with a clearable value the clear button stands in for the chevron,
// open or closed — the value wins. See fixtures/field-open-gesture.js for the why.

export async function run({ port, page, reporter }) {
  await page.goto(`http://127.0.0.1:${port}/?fixture=field-open-gesture`, { waitUntil: 'load' })
  await page.waitForFunction(() => window.__ready === true, null, { timeout: 60000 })

  const click = (id, sel) => page.evaluate(([i, s]) => window.__click(i, s), [id, sel])
  const isOpen = (id) => page.evaluate((i) => window.__isOpen(i), id)
  const has = (id, sel) => page.evaluate(([i, s]) => window.__has(i, s), [id, sel])
  const close = (id) => page.evaluate((i) => window.__close(i), id)

  // ── arm 1: non-searchable fields — the body toggles, the chevron toggles ───
  for (const [id, body, arrow, label] of [
    ['sel-plain', '.mono-select-trigger', '.mono-select-arrow', 'plain select'],
    ['tag-plain', '.mono-tag-input-native', '.mono-tag-input-arrow', 'non-searchable tag-input'],
    ['ddt', '.mono-dropdown-table-value', '.mono-dropdown-table-arrow', 'dropdown-table'],
  ]) {
    await click(id, body)
    const afterBody = await isOpen(id)
    await click(id, body)
    const afterBody2 = await isOpen(id)
    await click(id, arrow)
    const afterArrow = await isOpen(id)
    await click(id, arrow)
    const afterArrow2 = await isOpen(id)
    reporter.check(
      `A1 ${label}: body click opens; body click again closes; chevron opens; chevron again closes`,
      afterBody && !afterBody2 && afterArrow && !afterArrow2,
      `body → ${afterBody}, body → ${afterBody2}, chevron → ${afterArrow}, chevron → ${afterArrow2}`,
    )
  }

  // ── arm 2: searchable fields — the input opens (never closes); Escape closes ──
  // Both carry a clearable value from the fixture, so there is NO chevron on them
  // at all (arm 5 checks the swap itself): with a value the field closes by
  // picking, Escape or an outside click. The chevron toggle on an EMPTY searchable
  // field is exercised after arm 5 has cleared them (arm 2b).
  for (const [id, input, label] of [
    ['sel-search', '.mono-select-search-field', 'searchable select'],
    ['tag-search', '.mono-tag-input-native', 'searchable tag-input'],
  ]) {
    await click(id, input)
    const afterInput = await isOpen(id)
    const focused = await page.evaluate(([i, s]) => window.__activeIn(i, s), [id, input])
    await click(id, input)
    const afterInput2 = await isOpen(id)
    await page.evaluate(([i, s]) => window.__key(i, s, 'Escape'), [id, input])
    const afterEscape = await isOpen(id)
    reporter.check(
      `A2 ${label}: input click opens + focuses; a second input click keeps it open; Escape closes`,
      afterInput && focused && afterInput2 && !afterEscape,
      `input → ${afterInput} (focused ${focused}), input → ${afterInput2}, Escape → ${afterEscape}`,
    )
    await close(id)
  }

  // ── arm 3: focus alone opens nothing ────────────────────────────────────────
  for (const [id, input, label] of [
    ['sel-search', '.mono-select-search-field', 'searchable select'],
    ['tag-search', '.mono-tag-input-native', 'searchable tag-input'],
  ]) {
    await page.evaluate(() => document.querySelector('#elsewhere').focus?.())
    await page.evaluate(([i, s]) => window.__focusInput(i, s), [id, input])
    reporter.check(`A3 ${label}: programmatic / Tab focus does not open`, !(await isOpen(id)), `open ${await isOpen(id)}`)
  }

  // ── arm 4: typing opens with results ────────────────────────────────────────
  for (const [id, input, label] of [
    ['sel-search', '.mono-select-search-field', 'searchable select'],
    ['tag-search', '.mono-tag-input-native', 'searchable tag-input'],
  ]) {
    await page.evaluate(([i, s]) => window.__type(i, s, 'Ga'), [id, input])
    reporter.check(`A4 ${label}: typing opens the list`, await isOpen(id), `open ${await isOpen(id)}`)
    await close(id)
  }

  // ── arm 5: ✕ stands in for the chevron while there is a value, open or closed ─
  for (const [id, input, clear, arrow, label] of [
    ['sel-search', '.mono-select-search-field', '.mono-select-clear', '.mono-select-arrow', 'select'],
    ['tag-search', '.mono-tag-input-native', '.mono-tag-input-clear', '.mono-tag-input-arrow', 'tag-input'],
  ]) {
    // Closed, with a value: ✕ only.
    const closedClear = await has(id, clear)
    const closedArrow = await has(id, arrow)
    // Open, with a value: still ✕ only — the value wins over the open state.
    await click(id, input)
    const openClear = await has(id, clear)
    const openArrow = await has(id, arrow)
    await close(id)
    // ✕ clears without opening, and with nothing left to clear the chevron returns.
    await click(id, clear)
    const value = await page.evaluate((i) => window.__value(i), id)
    const openAfterClear = await isOpen(id)
    const cleared = value == null || value === '' || (Array.isArray(value) && value.length === 0)
    const arrowAfterClear = await has(id, arrow)
    reporter.check(
      `A5 ${label}: with a value ✕ only, closed AND open; ✕ clears without opening and the chevron returns`,
      closedClear && !closedArrow && openClear && !openArrow && cleared && !openAfterClear && arrowAfterClear,
      `closed ✕ ${closedClear} ⌄ ${closedArrow}; open ✕ ${openClear} ⌄ ${openArrow}; value after clear ${JSON.stringify(value)}, open ${openAfterClear}, ⌄ after ${arrowAfterClear}`,
    )
  }

  // ── arm 2b: empty searchable fields — the chevron toggles ───────────────────
  // Only reachable now that arm 5 has cleared them: with a value there is no
  // chevron to click.
  for (const [id, arrow, label] of [
    ['sel-search', '.mono-select-arrow', 'searchable select'],
    ['tag-search', '.mono-tag-input-arrow', 'searchable tag-input'],
  ]) {
    await click(id, arrow)
    const afterArrow = await isOpen(id)
    await click(id, arrow)
    const afterArrow2 = await isOpen(id)
    reporter.check(
      `A2b ${label} (empty): chevron opens; chevron again closes`,
      afterArrow && !afterArrow2,
      `chevron → ${afterArrow}, chevron → ${afterArrow2}`,
    )
    await close(id)
  }

  // ── arm 6: keyboard openers ─────────────────────────────────────────────────
  await page.evaluate(() => window.__key('ddt', '.mono-dropdown-table-trigger', 'Enter'))
  const ddtEnter = await isOpen('ddt')
  await page.evaluate(() => window.__key('ddt', '.mono-dropdown-table-trigger', 'Escape'))
  const ddtEsc = await isOpen('ddt')
  reporter.check('A6 dropdown-table: Enter on the trigger opens, Escape closes', ddtEnter && !ddtEsc, `Enter → ${ddtEnter}, Escape → ${ddtEsc}`)

  await page.evaluate(() => window.__key('sel-plain', '.mono-select-trigger', 'ArrowDown'))
  reporter.check('A6 plain select: ArrowDown on the trigger opens', await isOpen('sel-plain'), `open ${await isOpen('sel-plain')}`)

  // ── arm 7: disabled / readonly — neither ✕ nor ⌄, and the gutter stays ──────
  // The field refuses every gesture, so a chevron would promise an open it never
  // delivers; the actions container still renders so the text beside it does
  // not shift when the state toggles.
  for (const [prefix, actions, clear, arrow, label] of [
    ['sel', '.mono-select-actions', '.mono-select-clear', '.mono-select-arrow', 'select'],
    ['tag', '.mono-tag-input-actions', '.mono-tag-input-clear', '.mono-tag-input-arrow', 'tag-input'],
    ['ddt', '.mono-dropdown-table-actions', '.mono-dropdown-table-clear', '.mono-dropdown-table-arrow', 'dropdown-table'],
  ]) {
    for (const state of ['disabled', 'readonly']) {
      const id = `${prefix}-${state}`
      const hasValue = await page.evaluate((i) => {
        const v = window.__value(i)
        return v != null && v !== '' && !(Array.isArray(v) && v.length === 0)
      }, id)
      const gutter = await has(id, actions)
      const clearShown = await has(id, clear)
      const arrowShown = await has(id, arrow)
      reporter.check(
        `A7 ${label} ${state}: has a value, neither ✕ nor ⌄ renders, the actions gutter stays`,
        hasValue && gutter && !clearShown && !arrowShown,
        `value ${hasValue}, gutter ${gutter}, ✕ ${clearShown}, ⌄ ${arrowShown}`,
      )
    }
  }
}
