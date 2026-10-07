// Logic that keyed on ONE spelling after the class → attribute port (see the fixture for the
// three cases). Real browser: the checks are computed styles and portal attributes.

export async function run({ port, page, reporter }) {
  await page.goto(`http://127.0.0.1:${port}/?fixture=attr-contract`, { waitUntil: 'load' })
  await page.waitForFunction(() => window.__ready === true, null, { timeout: 60000 })
  await page.waitForTimeout(200)

  // ── A. tag-input slot="list" check boxes ────────────────────────────────────
  const boxes = await page.evaluate(() => window.__tagInputBoxes())
  reporter.check(
    'A: every slot="list" row gets a check box carrying the attributes checkbox.css reads',
    boxes.length === 3 && boxes.every((b) => b.box && b.monoCheckbox && b.innerBox),
    JSON.stringify(boxes),
  )
  reporter.check(
    'A: the box is PAINTED (a border), not blank',
    boxes.every((b) => b.borderWidth && b.borderWidth !== '0px'),
    boxes.map((b) => b.borderWidth).join(', '),
  )
  reporter.check(
    'A: the selected row\'s box carries mono-checked, the others do not',
    boxes.map((b) => b.checked).join() === 'false,true,false',
    boxes.map((b) => `${b.text}:${b.checked}`).join(', '),
  )

  // ── B. attribute-only table → header menu portal keeps the table colour ─────
  const menu = await page.evaluate(() => window.__menuPortalColor())
  reporter.check(
    'B: an attribute-only <table mono-table mono-color="success"> lends its colour to the header menu',
    menu.open && menu.portalColor === 'success',
    `menu open ${menu.open}, portal mono-color ${menu.portalColor}`,
  )

  // ── C. sticky flag on the scroll wrapper → loading overlay clears the head ──
  const head = await page.evaluate(() => window.__loadingHead())
  reporter.check(
    'C: mono-sticky-head on the scroll WRAPPER makes the loading overlay measure the header',
    head.head === `${head.theadHeight}px` && head.theadHeight > 0,
    `--mono-table-loading-head ${head.head || '(unset)'}, thead ${head.theadHeight}px`,
  )

  // ── D. sidebar hydration re-assert covers the state attributes ──────────────
  const sb = await page.evaluate(() => window.__sidebarResync())
  reporter.check(
    'D: a stale mono-effective / mono-mode / mono-open is re-asserted on the next update',
    sb.after.effective === sb.before.effective && sb.after.mode === 'temporary' && sb.after.open === sb.before.open && sb.before.open,
    JSON.stringify(sb),
  )
}
