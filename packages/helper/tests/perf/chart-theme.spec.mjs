// `<mono-chart>` after the Basecoat port. See the fixture for what is being
// claimed; these are the assertions that would catch it regressing.

export async function run({ port, page, reporter }) {
  await page.goto(`http://127.0.0.1:${port}/?fixture=chart-theme`, { waitUntil: 'load' })
  await page.waitForFunction(() => window.__ready === true, null, { timeout: 60000 })
  const same = (a, b) => JSON.stringify(a) === JSON.stringify(b)
  const tok = async (n) => page.evaluate((n) => window.__token(n), n)

  const bar = await page.evaluate(() => window.__m('bar'))
  const shadow = await page.evaluate(() => window.__m('shadow'))
  const pie = await page.evaluate(() => window.__m('pie'))
  const roles = await page.evaluate(() => window.__m('roles'))
  const square = await page.evaluate(() => window.__m('square'))
  const chartTokens = []
  for (const n of [1, 2, 3, 4, 5]) chartTokens.push(await tok(`--chart-${n}`))

  reporter.check(
    'the default palette is --chart-1 … --chart-5, in order, then the roles',
    same(bar.palette.slice(0, 5), chartTokens) && same(bar.palette[5], await tok('--success')),
    JSON.stringify({ palette: bar.palette, chartTokens, chain: bar.chain }),
  )
  reporter.check('a role name resolves to its Basecoat token', same(roles.palette.slice(0, 3), [await tok('--success'), await tok('--destructive'), await tok('--primary')]), JSON.stringify(roles.palette))
  reporter.check('legend and title are inked --foreground', same(bar.legendInk, await tok('--foreground')) && same(bar.titleInk, await tok('--foreground')), JSON.stringify({ legend: bar.legendInk, title: bar.titleInk }))
  reporter.check('ticks are --muted-foreground, the grid is --border', same(bar.tickInk, await tok('--muted-foreground')) && same(bar.gridInk, await tok('--border')), JSON.stringify({ tick: bar.tickInk, grid: bar.gridInk }))
  reporter.check(
    'the tooltip is a popover: bg-popover, popover-foreground ink, a --border ring',
    same(bar.tooltip.bg, await tok('--popover')) && same(bar.tooltip.ink, await tok('--popover-foreground')) && same(bar.tooltip.border, await tok('--border')) && bar.tooltip.radius > 0,
    JSON.stringify(bar.tooltip),
  )
  reporter.check('the chart type is the page font at text-xs (12px)', bar.font.size === 12 && !!bar.font.family && bar.pageFont.includes(bar.font.family.split(',')[0].replace(/"/g, '').trim()), JSON.stringify({ font: bar.font, page: bar.pageFont }))
  reporter.check('a pie slice hairline is the page surface, not white', same(pie.sliceBorder, await tok('--background')), JSON.stringify({ border: pie.sliceBorder, background: await tok('--background') }))
  reporter.check(
    "a bar's corner is the flavour's field corner (px), and --mono-chart-bar-radius pins it",
    bar.barRadius === bar.fieldRadius && bar.fieldRadius > 0 && square.barRadius === 0,
    JSON.stringify({ bar: bar.barRadius, field: bar.fieldRadius, pinned: square.barRadius }),
  )
  const strip = (m) => ({ ...m, chain: undefined })
  reporter.check('the shadow build hands Chart.js the same values', same(strip(shadow), strip(bar)), JSON.stringify({ shadow: strip(shadow), bar: strip(bar) }))

  // ── the tooltip is the flavour's popover, as an element ──────────────────
  const pt = await page.evaluate(() => window.__barPoint())
  await page.mouse.move(pt.x, pt.y)
  await page.waitForTimeout(250)
  const tip = await page.evaluate(() => window.__tooltip())
  reporter.check('hovering a bar opens the HTML tooltip over the canvas', tip.open && tip.display === 'flex' && tip.opacity === '1' && tip.inside, JSON.stringify({ open: tip.open, display: tip.display, opacity: tip.opacity, inside: tip.inside }))
  reporter.check(
    "the tooltip is painted as the flavour's popover: bg, ink, corner, ring + shadow all equal the select panel's",
    same(tip.bg, tip.popover.bg) && same(tip.ink, tip.popover.ink) && same(tip.radius, tip.popover.radius) && same(tip.shadow, tip.popover.shadow) && tip.shadow !== 'none',
    JSON.stringify({ tip: { bg: tip.bg, ink: tip.ink, radius: tip.radius, shadow: tip.shadow }, popover: tip.popover }),
  )
  reporter.check('it carries the title, one row per series with its swatch, and the value split out', tip.title === 'Jan' && tip.rows.length === 6 && tip.rows.every((r) => r.swatch && r.label && r.value), JSON.stringify({ title: tip.title, rows: tip.rows.slice(0, 2) }))
  await page.mouse.move(0, 0)
  await page.waitForTimeout(250)
  const closed = await page.evaluate(() => window.__tooltip())
  reporter.check('leaving the canvas closes it', !closed.open && closed.opacity === '0', JSON.stringify({ open: closed.open, opacity: closed.opacity }))

  // ── dark mode without theme-changed ──────────────────────────────────────
  const dark = await page.evaluate(() => window.__flip(true))
  const darkFg = await tok('--foreground')
  const darkChart1 = await tok('--chart-1')
  reporter.check(
    'flipping .dark on <html> repaints with the dark tokens (no theme-changed fired)',
    same(dark.legendInk, darkFg) && same(dark.palette[0], darkChart1) && !same(dark.legendInk, bar.legendInk),
    JSON.stringify({ dark: { legend: dark.legendInk, first: dark.palette[0] }, tokens: { fg: darkFg, chart1: darkChart1 }, light: bar.legendInk }),
  )
  await page.evaluate(() => window.__flip(false))
}
