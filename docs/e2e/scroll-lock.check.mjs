/**
 * mono-modal / mono-drawer scroll lock — does the PAGE actually stop scrolling?
 *
 * Two bugs are guarded here, both of which passed every style-based assertion while the page
 * happily scrolled behind an open modal:
 *
 *  1. The lock wrote `overflow: hidden` to `document.body` only. A body's overflow reaches the
 *     viewport ONLY while the ROOT element's computed overflow is `visible` (CSS Overflow §3.5).
 *     Vuetify's reset ships `html { overflow-y: scroll }`; ress and sanitize.css do the same.
 *
 *  2. The lock then wrote the root inline — and lost the cascade to a consumer stylesheet that
 *     claims the root's overflow with `!important` (an app driving `<html class>` from its layout,
 *     `.overflow-auto { overflow: auto !important }`). `documentElement.style.overflow` read
 *     "hidden" the whole time; the COMPUTED value stayed `auto`.
 *
 * So: assert the COMPUTED overflow, and assert a real wheel gesture — never the inline string.
 *
 * Usage (docs dev server must be running):
 *   node scroll-lock.check.mjs [baseUrl]
 */
import pw from 'file:///C:/Users/VCT-DEV/Desktop/libs/node_modules/playwright/index.js'

const { chromium } = pw
const BASE = process.argv[2] || 'http://127.0.0.1:5173'

const results = []
const ok = (name, pass, detail = '') => {
  results.push({ name, pass })
  console.log(`  ${pass ? 'PASS' : 'FAIL'}  ${name}${detail ? '  →  ' + detail : ''}`)
}

/** The consumer conditions each scenario puts the page in before anything opens. */
const SCENARIOS = [
  {
    name: 'vuetify reset',
    css: 'html { overflow-y: scroll }',
    apply: null,
  },
  {
    name: '!important html class',
    css: 'html { overflow-y: scroll } .overflow-auto { overflow: auto !important }',
    apply: () => document.documentElement.classList.add('overflow-auto'),
  },
]

const state = (page) => page.evaluate(() => ({
  top: document.scrollingElement.scrollTop,
  computed: getComputedStyle(document.documentElement).overflowY,
  rootInline: document.documentElement.style.overflow,
  rootGutter: document.documentElement.style.scrollbarGutter,
  bodyInline: document.body.style.overflow,
  edge: Math.round(document.body.getBoundingClientRect().right),
}))

const wheel = async (page) => {
  await page.mouse.move(400, 300)
  await page.mouse.wheel(0, 400)
  await page.waitForTimeout(150)
}

const runScenario = async (browser, scenario) => {
  console.log(`\n— ${scenario.name} —`)
  const page = await browser.newPage({ viewport: { width: 1200, height: 800 } })
  await page.goto(`${BASE}/ui/modal`, { waitUntil: 'domcontentloaded', timeout: 120000 })
  await page.waitForFunction(() => customElements.get('mono-modal'), null, { timeout: 120000 })
  await page.waitForTimeout(1200)

  await page.addStyleTag({ content: scenario.css })
  if (scenario.apply) await page.evaluate(scenario.apply)
  await page.evaluate(() => { document.scrollingElement.scrollTop = 0 })

  const before = await state(page)
  await wheel(page)
  ok(`${scenario.name}: control — the page scrolls with nothing open`, (await state(page)).top > 0)
  await page.evaluate(() => { document.scrollingElement.scrollTop = 0 })

  const missing = await page.evaluate(() => {
    const el = document.querySelector('mono-modal')
    if (!el) return 'no mono-modal on the page'
    el.modelValue = true
    return null
  })
  if (missing) { ok(`${scenario.name}: found a modal to open`, false, missing); await page.close(); return }
  await page.waitForTimeout(400)

  const open = await state(page)
  // The COMPUTED value — the inline one read "hidden" all through bug 2.
  ok(`${scenario.name}: root computes to hidden`, open.computed === 'hidden', `overflowY="${open.computed}" (inline "${open.rootInline}")`)
  ok(`${scenario.name}: body locked too`, open.bodyInline === 'hidden')
  // A reserved gutter would keep Chrome painting an empty scrollbar track, so the page would
  // still LOOK unlocked — the compensation goes on the body as padding instead.
  ok(`${scenario.name}: no scrollbar track left behind`, open.rootGutter === '', `scrollbarGutter="${open.rootGutter}"`)

  await wheel(page)
  const after = await state(page)
  ok(`${scenario.name}: a wheel gesture does not move the page`, after.top === 0, `top=${after.top}`)
  ok(`${scenario.name}: no sideways shift`, Math.abs(after.edge - before.edge) <= 1, `${before.edge} -> ${after.edge}`)

  await page.evaluate(() => { document.querySelector('mono-modal').modelValue = false })
  await page.waitForTimeout(400)
  const closed = await state(page)
  ok(`${scenario.name}: root handed back`, closed.computed === before.computed && closed.rootInline === '', `overflowY="${closed.computed}" inline="${closed.rootInline}"`)
  await wheel(page)
  ok(`${scenario.name}: the page scrolls again`, (await state(page)).top > 0)

  await page.close()
}

const run = async () => {
  const browser = await chromium.launch()
  for (const scenario of SCENARIOS) await runScenario(browser, scenario)
  await browser.close()

  const failed = results.filter((r) => !r.pass).length
  console.log(`\n${results.length - failed}/${results.length} passed`)
  process.exit(failed ? 1 : 0)
}

run().catch((e) => { console.error(e); process.exit(1) })
