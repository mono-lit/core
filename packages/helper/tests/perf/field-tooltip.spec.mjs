// The `tooltip` prop of the form controls, in a real browser.
//
// jsdom covers wiring (field-tooltip.test.ts); this covers what only layout can
// show: the ⓘ sits AFTER the label text and required mark on the same row, its
// glyph actually paints (UnoCSS mask in light, inline SVG in shadow), a real
// mouse hover opens the bubble — including on a DISABLED field, whose label has
// `pointer-events: none` — and clicking it leaves the field unfocused.

export async function run({ port, page, reporter }) {
  await page.goto(`http://127.0.0.1:${port}/?fixture=field-tooltip`, { waitUntil: 'load' })
  await page.waitForFunction(() => window.__ready === true, null, { timeout: 60000 })

  const cases = await page.evaluate(() => window.__cases)
  for (const c of cases) {
    const name = `${c.tag}${c.disabled ? ' (disabled)' : ''}`
    await page.waitForFunction((i) => !window.__measure(i).error, c.i, { timeout: 10000 }).catch(() => {})
    const m = await page.evaluate((i) => window.__measure(i), c.i)
    if (m.error) {
      reporter.check(`${name}: renders the info icon`, false, m.error)
      continue
    }
    const [w, h] = m.glyphSize
    reporter.check(
      `${name}: icon after the label text + *, on the label row, painted at ~1em`,
      m.afterPrev && m.centred && m.painted && w >= 12 && w <= 20 && h === w,
      JSON.stringify(m),
    )
    reporter.check(`${name}: the icon is the hit target at its centre`, m.hitIsIcon, JSON.stringify(m))

    await page.mouse.move(0, 0)
    await page.mouse.move(m.cx, m.cy)
    const text = await page
      .waitForFunction(
        (t) => {
          const b = document.querySelector('[mono-tooltip][role="tooltip"]')
          return b && b.textContent === t && b.getBoundingClientRect().height > 0 ? b.textContent : false
        },
        `Tip for ${c.tag}`,
        { timeout: 3000 },
      )
      .then((h) => h.jsonValue())
      .catch(() => null)
    reporter.check(`${name}: a real hover opens the bubble`, text === `Tip for ${c.tag}`, `got ${text}`)

    if (!c.disabled) {
      await page.mouse.click(m.cx, m.cy)
      const focused = await page.evaluate((i) => window.__activeIsNative(i), c.i)
      reporter.check(`${name}: clicking the icon does not focus the field`, !focused, '')
    }
    await page.mouse.move(0, 0)
  }
}
