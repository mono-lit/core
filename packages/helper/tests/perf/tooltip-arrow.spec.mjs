// Tooltip arrow on rounded bubbles.
//
// Floating UI kept the arrow a fixed 4px from the bubble's corner, so on a
// `-start` / `-end` placement it landed on the CURVE of a well-rounded flavor (a
// pill in the extreme), where the edge has already pulled away and the diamond
// hung off the corner. The arrow must sit on the straight part of the edge —
// or, on a capsule too short to have one, dead centre — and still point at its
// trigger, for every flavor and placement.

export async function run({ port, page, reporter }) {
  await page.goto(`http://127.0.0.1:${port}/?fixture=tooltip-arrow`, { waitUntil: 'load' })
  await page.waitForFunction(() => window.__ready === true, null, { timeout: 60000 })

  const flavors = await page.evaluate(() => window.__flavors)
  const placements = await page.evaluate(() => window.__placements)

  for (const f of flavors) {
    const bad = []
    for (const p of placements) {
      const r = await page.evaluate(([fl, pl]) => window.__measure(fl, pl), [f, p])
      const onEdge = r.tooShort ? r.offCentre <= 1.25 : r.roomStart >= -0.5 && r.roomEnd >= -0.5
      if (r.error || !onEdge || !r.onTrigger) bad.push(`${p} ${JSON.stringify(r)}`)
    }
    reporter.check(
      `${f}: the arrow sits on the straight edge and points at its trigger (12 placements)`,
      bad.length === 0,
      bad.join('\n          '),
    )
  }
}
