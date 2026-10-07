// A portaled select panel must paint exactly like the shadow build's in-place one:
// the portal mirrors the wrapper's `mono-*` attributes (select.css scopes every
// option rule under `[mono-select]`), including `mono-open` coming and going.
// See fixtures/select-portal.js.

export async function run({ port, page, reporter }) {
  await page.goto(`http://127.0.0.1:${port}/?fixture=select-portal`, { waitUntil: 'load' })
  await page.waitForFunction(() => window.__ready === true, null, { timeout: 60000 })

  await page.evaluate(() => window.__open('light'))
  await page.evaluate(() => window.__open('shadow'))

  const portal = await page.evaluate(() => window.__portal())
  reporter.check(
    'the light panel is portaled and the portal carries the wrapper attributes',
    !!portal && portal.holdsPanel && portal.attrs.join(' ') === 'mono-color=danger mono-open mono-select mono-size=sm',
    JSON.stringify(portal),
  )

  const light = await page.evaluate(() => window.__panelMetrics('light'))
  const shadow = await page.evaluate(() => window.__panelMetrics('shadow'))
  reporter.check(
    'the portaled panel is open and painted like the shadow one',
    light.panelDisplay === 'flex' && light.panelDisplay === shadow.panelDisplay && light.panelRadius === shadow.panelRadius && light.panelBg === shadow.panelBg,
    `light ${light.panelDisplay} ${light.panelRadius} ${light.panelBg} | shadow ${shadow.panelDisplay} ${shadow.panelRadius} ${shadow.panelBg}`,
  )
  reporter.check(
    'option rows match across builds (height, radius, inset, selected check)',
    light.rows.length === 3 && JSON.stringify(light.rows) === JSON.stringify(shadow.rows),
    `light ${JSON.stringify(light.rows)} | shadow ${JSON.stringify(shadow.rows)}`,
  )
  reporter.check(
    'the selected row shows the check icon, the others do not',
    light.rows.map((r) => r.hasCheck).join() === 'false,true,false',
    light.rows.map((r) => r.hasCheck).join(),
  )

  await page.evaluate(() => window.__close('light'))
  const after = await page.evaluate(() => ({ portal: window.__portal(), m: window.__panelMetrics('light') }))
  reporter.check(
    'closing drops mono-open from the portal and hides the panel',
    !!after.portal && !after.portal.attrs.includes('mono-open') && after.m.panelDisplay === 'none',
    JSON.stringify(after.portal) + ' display ' + after.m.panelDisplay,
  )
}
