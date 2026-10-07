// The "+N more" chip panel is a floating layer: never clipped by an ancestor,
// flips at the viewport edge, ranks in the popup stack, closes like a popup.
//
// Light build: the panel is portaled to <body> and placed `fixed` from its
// anchor. Shadow build: positioned in place. Both: it opens with the collapsed
// chips, a chip removed inside it updates the value, a click inside keeps it,
// an outside click or Escape closes it.

export async function run({ port, page, reporter }) {
  await page.goto(`http://127.0.0.1:${port}/?fixture=more-panel`, { waitUntil: 'load' })
  await page.waitForFunction(() => window.__fixtureReady === true, null, { timeout: 60000 })
  await page.evaluate(() => window.__more.tagPanels())
  const j = (v) => JSON.stringify(v)

  const inViewport = (s) => s.rect.top >= 0 && s.rect.bottom <= s.viewportH
  const fullyDrawn = (s) => s.rect.height >= Math.min(s.scrollHeight, 40) // not squashed by a 56px card

  // ── clipping arms ───────────────────────────────────────────────────────────
  for (const id of ['tag-clip', 'ddt-clip']) {
    const s = await page.evaluate((id) => window.__more.open(id), id)
    reporter.check(`${id}: "+N more" opens the panel with the 6 collapsed chips`, s.found && s.display !== 'none' && s.chips.length === 6, j({ found: s.found, display: s.display, chips: s.chips?.length }))
    reporter.check(`${id}: the panel is portaled to <body> and placed fixed`, s.portaled && s.position === 'fixed' && s.portalClassHasOpen, j({ portaled: s.portaled, position: s.position, cls: s.portalClassHasOpen }))
    reporter.check(`${id}: inside a 56px overflow:hidden card the panel is NOT clipped (fully inside the viewport, full height)`, inViewport(s) && fullyDrawn(s), j(s.rect) + ` scrollH=${s.scrollHeight}`)
    const hit = await page.evaluate((id) => window.__more.hitTest(id), id)
    reporter.check(`${id}: the panel's first chip is what the pointer would hit (nothing paints over it)`, !!hit && hit.hitIsChip && !hit.inClip, j(hit))
    reporter.check(`${id}: it joined the popup stack (z from --mono-popup-z)`, Number(s.z) >= 1000, `z=${s.z}`)

    const inside = await page.evaluate((id) => window.__more.clickInside(id), id)
    reporter.check(`${id}: a click inside the panel does not close it`, inside.display !== 'none', `display=${inside.display}`)

    const rm = await page.evaluate((id) => window.__more.removeFirst(id), id)
    reporter.check(`${id}: removing a chip inside the panel updates the value and the panel`, rm.removed && rm.after === rm.before - 1 && rm.chips.length === 5, j({ removed: rm.removed, before: rm.before, after: rm.after, chips: rm.chips?.length }))

    const out = await page.evaluate((id) => window.__more.clickOutside(id), id)
    reporter.check(`${id}: an outside click closes it`, out.display === 'none', `display=${out.display}`)

    const again = await page.evaluate((id) => window.__more.open(id), id)
    const esc = await page.evaluate((id) => window.__more.escape(id), id)
    reporter.check(`${id}: it reopens, and Escape closes it`, again.display !== 'none' && esc.display === 'none', `reopen=${again.display} afterEsc=${esc.display}`)
  }

  // ── flip arms (near the viewport bottom) ────────────────────────────────────
  for (const id of ['tag-bottom', 'ddt-bottom']) {
    const s = await page.evaluate((id) => window.__more.open(id), id)
    reporter.check(`${id}: pinned to the viewport bottom the panel flips ABOVE its anchor and stays inside the viewport`, s.found && s.rect.bottom <= s.fieldTop + 1 && inViewport(s), j({ rect: s.rect, anchorTop: s.fieldTop, vh: s.viewportH }))
    await page.evaluate((id) => window.__more.clickOutside(id), id)
  }

  // ── shadow arms: in place, visible, same closers ────────────────────────────
  for (const id of ['tag-clip-shadow', 'ddt-clip-shadow']) {
    const s = await page.evaluate((id) => window.__more.open(id), id)
    reporter.check(`${id} [shadow]: the panel opens in the shadow root with the 6 collapsed chips`, s.found && !s.portaled && s.display !== 'none' && s.chips.length === 6, j({ found: s.found, portaled: s.portaled, display: s.display, chips: s.chips?.length }))
    const out = await page.evaluate((id) => window.__more.clickOutside(id), id)
    reporter.check(`${id} [shadow]: an outside click closes it`, out.display === 'none', `display=${out.display}`)
  }
}
