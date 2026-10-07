// Legacy class contract — the pre-port `.mono-table…` / `.mono-dropdown-table…`
// classes paint EXACTLY like the attribute spelling, because the table markup is
// the consumer's and host apps (esw-ui) carry hundreds of class-spelled tables.
//
// `scripts/legacy-class-alias.mjs` wraps every attribute selector of the two
// sheets as `:is([mono-x],.legacy)`. Three things are asserted:
//   · the sheets are CURRENT (the script's --check) — an attribute-only edit that
//     forgot to re-run it fails here, not in a host app;
//   · every element of a class-spelled table / dropdown-table computes the same
//     paint as its attribute twin (position, colours, borders, spacing, fonts…),
//     including the hovered row;
//   · the control: the class spelling is really styled by the sheet (a th differs
//     from a bare browser th, sticky is sticky, the current page button and the
//     selected row are painted).

import { run as aliasCheck } from '../../scripts/legacy-class-alias.mjs'

export async function run({ port, page, reporter }) {
  const stale = aliasCheck({ check: true })
  reporter.check(
    'table.css and dropdown-table.css carry current legacy class aliases (scripts/legacy-class-alias.mjs --check)',
    stale.length === 0,
    stale.length ? 'stale: ' + stale.join(', ') + ' — run node scripts/legacy-class-alias.mjs' : 'current',
  )

  await page.goto(`http://127.0.0.1:${port}/?fixture=table-legacy-classes`, { waitUntil: 'load' })
  await page.waitForFunction(() => window.__ready === true, null, { timeout: 60000 })
  await page.mouse.move(0, 0)
  await page.waitForTimeout(150)

  for (const [which, label] of [['t', 'table + scroll + foot + paging'], ['d', 'dropdown-table panel + region + rows']]) {
    const r = await page.evaluate((w) => window.__compare(w), which)
    reporter.check(
      `${label}: class-spelled markup computes the same paint as the attribute spelling, element for element (${r.count[0]} elements)`,
      r.count[0] === r.count[1] && r.diffs.length === 0,
      JSON.stringify(r.diffs.slice(0, 6)),
    )
  }

  // hover: the row hover rule must reach the class-spelled rows too. The resting
  // colour is read off the SAME row before the pointer arrives (an even row wears
  // the zebra tint, which a flavor may set to the hover colour).
  const rest = await page.evaluate(() => window.__rowBg('t-cls', 1))
  const pa = await page.evaluate(() => window.__rowPoint('t-attr', 1))
  await page.mouse.move(pa.x, pa.y)
  await page.waitForTimeout(120)
  const hovAttr = await page.evaluate(() => window.__rowBg('t-attr', 1))
  const pc = await page.evaluate(() => window.__rowPoint('t-cls', 1))
  await page.mouse.move(pc.x, pc.y)
  await page.waitForTimeout(120)
  const hovCls = await page.evaluate(() => window.__rowBg('t-cls', 1))
  reporter.check(
    'a hovered class-spelled row paints the same hover as the attribute row (and differs from a resting row)',
    hovAttr === hovCls && hovCls !== rest,
    `attr=${hovAttr} cls=${hovCls} rest=${rest}`,
  )
  await page.mouse.move(0, 0)

  const c = await page.evaluate(() => window.__control())
  reporter.check(
    'control: the class spelling IS styled — th differs from a bare th, sticky-right is sticky, the current page button and the selected row are painted',
    c.differs.length >= 3 && c.stickyPosition === 'sticky' && c.pagingOnDiffers && c.selectedRowDiffers,
    JSON.stringify(c),
  )
}
