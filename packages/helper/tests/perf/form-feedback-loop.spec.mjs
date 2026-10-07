// controlMonoForm + an opened mono-select: no endless notify loop (a frozen tab).
// See fixtures/form-feedback-loop.js for the three arms and why each used to loop.

export async function run({ port, page, reporter }) {
  await page.goto(`http://127.0.0.1:${port}/?fixture=form-feedback-loop`, { waitUntil: 'load' })
  await page.waitForFunction(() => window.__ready === true, null, { timeout: 60000 })

  // Each read is bounded: if the page is stuck in a microtask loop, evaluate never returns.
  const withTimeout = (p, ms = 8000) =>
    Promise.race([p, new Promise((_, rej) => setTimeout(() => rej(new Error('page did not respond — frozen')), ms))])

  let a
  try {
    a = await withTimeout(page.evaluate(() => window.__open('a')))
  } catch (e) {
    a = { error: String(e) }
  }
  reporter.check(
    'A: a state watcher that re-pushes the SAME props settles after the select opens',
    a && !a.error && a.flushesSecondWindow === 0 && a.flushesFirstWindow < 10,
    JSON.stringify(a),
  )

  let b
  try {
    b = await withTimeout(page.evaluate(() => window.__open('b')))
  } catch (e) {
    b = { error: String(e) }
  }
  reporter.check(
    'B: a select with PRIMITIVE items settles after it opens',
    b && !b.error && b.flushesSecondWindow === 0 && b.flushesFirstWindow < 10,
    JSON.stringify(b),
  )

  const errorsBeforeC = await page.evaluate(() => window.__errors.length)
  reporter.check(
    'A and B never tripped the runaway breaker',
    errorsBeforeC === 0,
    `${errorsBeforeC} console.error(s)`,
  )

  let c
  try {
    c = await withTimeout(page.evaluate(() => window.__open('c', 300)))
  } catch (e) {
    c = { error: String(e) }
  }
  const lag = await withTimeout(page.evaluate(() => window.__responsive())).catch(() => Infinity)
  const errors = await page.evaluate(() => window.__errors.filter((m) => m.includes('without yielding')))
  reporter.check(
    'C: a genuine write-back loop is stopped by the breaker — the page stays responsive',
    c && !c.error && lag < 500,
    `open=${JSON.stringify(c)}, 0ms timer fired after ${Math.round(lag)}ms`,
  )
  reporter.check(
    'C: …and it is reported ONCE, naming the controller',
    errors.length === 1 && errors[0].includes('controlMonoForm'),
    errors.length ? errors[0].slice(0, 160) : 'no error logged',
  )
}
