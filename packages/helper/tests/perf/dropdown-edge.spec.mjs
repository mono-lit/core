// Viewport-edge behaviour for `mono-dropdown`.
//
// Two defects, one symptom — a profile menu in the top-right corner painting off
// the right side of the screen:
//
//   1. `computePopupPlacement` measured the panel's own box. A slotted body forced
//      wider than the panel's `max-width` preset (`w-72` = 288px vs md's 280px)
//      overflows a `overflow: visible` panel, so the box under-reported the painted
//      width by ~22px and every clamp solved for the wrong rectangle.
//   2. `flip` only ever covered the MAIN axis (bottom<->top). A `bottom-start` panel
//      with no room to its right stayed start-aligned; `shift` alone slid it along
//      the viewport edge instead of re-anchoring it to the trigger's other edge.
//
// So both halves are asserted: nothing paints outside the viewport, AND the panel
// re-anchors to the trigger rather than merely sticking to the edge.

export async function run({ port, page, reporter }) {
  await page.goto(`http://127.0.0.1:${port}/?fixture=dropdown-edge`, { waitUntil: 'load' })
  await page.waitForFunction(() => window.__ready === true, null, { timeout: 60000 })

  const open = async (id) => {
    const r = await page.evaluate((i) => window.__open(i, true), id)
    await page.evaluate((i) => window.__open(i, false), id)
    return r
  }

  // ── 1. content wider than the panel preset still fits the viewport ──────────
  let r = await open('right')
  reporter.check(
    'bottom-start at the right edge: nothing paints past the viewport',
    r.overflowRight <= 0,
    `overflows right by ${r.overflowRight}px — ${JSON.stringify(r)}`,
  )
  reporter.check(
    'bottom-start at the right edge: re-anchors to the trigger (opens leftwards)',
    Math.abs(r.panelRight - r.triggerRight) <= 2,
    `panel right ${r.panelRight} vs trigger right ${r.triggerRight} — ${JSON.stringify(r)}`,
  )

  // ── 2. the mirror case ──────────────────────────────────────────────────────
  r = await open('left')
  reporter.check(
    'bottom-end at the left edge: nothing paints past the viewport',
    r.overflowLeft <= 0,
    `overflows left by ${r.overflowLeft}px — ${JSON.stringify(r)}`,
  )
  reporter.check(
    'bottom-end at the left edge: re-anchors to the trigger (opens rightwards)',
    Math.abs(r.panelLeft - r.triggerLeft) <= 2,
    `panel left ${r.panelLeft} vs trigger left ${r.triggerLeft} — ${JSON.stringify(r)}`,
  )

  // ── 3. a trigger with room on both sides must not move ──────────────────────
  r = await open('mid')
  reporter.check(
    'away from any edge: stays start-aligned to its trigger',
    Math.abs(r.panelLeft - r.triggerLeft) <= 2,
    `panel left ${r.panelLeft} vs trigger left ${r.triggerLeft} — ${JSON.stringify(r)}`,
  )

  // ── 4. the panel's own box must wrap content it cannot shrink ───────────────
  // `max-width` capped the panel at the md preset's 280px while a `w-80` body
  // painted 320px, so the white background / border / rounded corner stopped short
  // and the body hung over the right edge of its own panel.
  for (const id of ['right', 'left', 'mid']) {
    r = await open(id)
    reporter.check(
      `${id}: the panel box wraps its over-wide body`,
      r.escapesPanel <= 0 && r.panelWidth >= r.contentWidth,
      `content escapes the panel by ${r.escapesPanel}px (panel ${r.panelWidth}, content ${r.contentWidth}) — ${JSON.stringify(r)}`,
    )
  }

  // ── 5. and none of that moves an ordinary dropdown ──────────────────────────
  r = await open('narrow')
  // +/-1: the floor is re-derived by subtracting the panel's padding and border from
  // the preset, and `--theme-border-width` is 1.5px in the default theme, so the
  // border box lands on 200 with a sub-pixel remainder that rounds either way.
  reporter.check(
    'tiny content still sits on the min-width preset (200px)',
    Math.abs(r.panelWidth - 200) <= 1,
    `panel width ${r.panelWidth}, expected 200 — ${JSON.stringify(r)}`,
  )

  r = await open('prose')
  reporter.check(
    'long prose still wraps at the max-width preset (280px)',
    r.panelWidth === 280,
    `panel width ${r.panelWidth}, expected 280 — ${JSON.stringify(r)}`,
  )

  // ── 6. a dropdown mounted ALREADY OPEN sits under its trigger ───────────────
  // Lit runs controllers' `hostUpdated` BEFORE `updated()`, and the light build
  // re-places its captured activator in `updated()` — so the first (open) render
  // measured a detached anchor (all-zero rect) and pinned the panel top-left.
  // Read without re-setting modelValue: it must already be right.
  r = await page.evaluate(() => window.__open('initial', true))
  reporter.check(
    'mounted open: the panel sits under its trigger, not at the top-left corner',
    Math.abs(r.panelLeft - r.triggerLeft) <= 2 && r.panelLeft > 100,
    `panel left ${r.panelLeft} vs trigger left ${r.triggerLeft} — ${JSON.stringify(r)}`,
  )
}
