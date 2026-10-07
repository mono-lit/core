// `<mono-table-loading :loading>` — the manual override.
//
// `loading` is tri-state: unset follows the controller, `true` / `false` override it. The arms
// that matter are the overrides holding AGAINST the controller (forced stays up while the
// controller is idle, off stays down while it fetches), the hand-back (`null` returns to
// automatic), and the attribute spelling `loading="false"` meaning OFF rather than "present".

export async function run({ port, page, reporter }) {
  await page.goto(`http://127.0.0.1:${port}/?fixture=table-loading-manual`, { waitUntil: 'load' })
  await page.waitForFunction(() => window.__ready === true, null, { timeout: 60000 })

  const idle = await page.evaluate(() => window.__read())
  reporter.check(
    'controller idle: auto hidden, loading=true shown, loading=false hidden',
    idle && !idle.auto && idle.forced && !idle.off,
    JSON.stringify(idle),
  )

  const busy = await page.evaluate(() => window.__setController(true))
  reporter.check(
    'controller fetching: auto shown, loading=true shown, loading=false STAYS hidden',
    busy && busy.auto && busy.forced && !busy.off,
    JSON.stringify(busy),
  )

  const done = await page.evaluate(() => window.__setController(false))
  reporter.check(
    'controller done: auto hides, loading=true STAYS shown',
    done && !done.auto && done.forced,
    JSON.stringify(done),
  )

  const bareOn = await page.evaluate(() => window.__setProp('bare', true))
  const bareOff = await page.evaluate(() => window.__setProp('bare', false))
  reporter.check(
    'no controller at all: the prop alone shows and hides it',
    bareOn?.bare === true && bareOff?.bare === false,
    `on=${bareOn?.bare}, off=${bareOff?.bare}`,
  )

  await page.evaluate(() => window.__setController(true))
  const handBack = await page.evaluate(() => window.__setProp('off', null))
  reporter.check(
    'loading=null hands control back to the controller (now fetching → shown)',
    handBack?.off === true,
    `off=${handBack?.off}`,
  )

  const attrValue = await page.evaluate(() => window.__attrValue())
  reporter.check(
    'attribute loading="false" parses to false and keeps it hidden while the controller fetches',
    attrValue === false && handBack?.attr === false,
    `value=${attrValue}, shown=${handBack?.attr}`,
  )
  await page.evaluate(() => window.__setController(false))
}
