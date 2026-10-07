// Stacked modal / drawer overlays.
//
// The lower dialog hides its overlay only while an OVERLAY-BEARING dialog sits above
// it. `hasBackdrop` used to return `true` regardless of `overlay`, so a stacked
// `overlay="false"` dialog hid the base's dim and left the page with none at all.

export async function run({ port, page, reporter }) {
  await page.goto(`http://127.0.0.1:${port}/?fixture=dialog-overlay-stack`, { waitUntil: 'load' })
  await page.waitForFunction(() => window.__ready === true, null, { timeout: 60000 })

  const set = (name, value) => page.evaluate(([n, v]) => window.__set(n, v), [name, value])
  const overlayOf = (name) => page.evaluate((n) => window.__overlayOf(n), name)
  const visible = (r) => !r.error && !r.above && r.opacity === 1
  const hidden = (r) => !r.error && r.above && r.opacity === 0

  const pairs = await page.evaluate(() => window.__pairs)
  for (const p of pairs) {
    const base = p + 'Base'
    await set(base, true)

    // 1. a stacked overlay="false" dialog leaves the base dimming the page
    await set(p + 'TopOverlay', false)
    await set(p + 'Top', true)
    let r = await overlayOf(base)
    reporter.check(`${p}: overlay="false" on top keeps the base overlay`, visible(r), JSON.stringify(r))

    // 4. flipping the top's overlay on while open hands the dim over
    await set(p + 'TopOverlay', true)
    r = await overlayOf(base)
    reporter.check(`${p}: top's overlay flipped on while open hides the base overlay`, hidden(r), JSON.stringify(r))

    // …and back off again
    await set(p + 'TopOverlay', false)
    r = await overlayOf(base)
    reporter.check(`${p}: top's overlay flipped off while open restores the base overlay`, visible(r), JSON.stringify(r))
    await set(p + 'Top', false)

    // 2. an overlay-bearing dialog on top: still ONE dim (unchanged behaviour)
    await set(p + 'TopOverlay', true)
    await set(p + 'Top', true)
    r = await overlayOf(base)
    reporter.check(`${p}: an overlay on top still hides the base overlay`, hidden(r), JSON.stringify(r))

    // 3. closing the top brings the base overlay back
    await set(p + 'Top', false)
    r = await overlayOf(base)
    reporter.check(`${p}: closing the top restores the base overlay`, visible(r), JSON.stringify(r))

    await set(base, false)
  }
}
