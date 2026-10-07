/**
 * Verifies the header-filter gesture model mirrors sorting:
 *   funnel click              → SINGLE column (replaces every other column filter)
 *   right-click → Header Filter → COMBINES across columns (+ a "Clear all")
 *
 * Usage (dev server must already be running):
 *   node docs/e2e/filter-gestures.check.mjs [baseUrl]
 */
import pw from 'file:///C:/Users/VCT-DEV/Desktop/libs/node_modules/playwright/index.js'

const { chromium } = pw
const BASE = process.argv[2] || 'http://127.0.0.1:5173'

const results = []
const ok = (name, pass, detail = '') => {
  results.push({ name, pass })
  console.log(`  ${pass ? 'PASS' : 'FAIL'}  ${name}${detail ? '  →  ' + detail : ''}`)
}

const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 1400, height: 1000 } })
const errors = []
page.on('console', (m) => {
  if (m.type() === 'error') errors.push(m.text())
})

await page.goto(`${BASE}/ui/table`, { waitUntil: 'domcontentloaded', timeout: 120000 })
await page.waitForFunction(() => document.querySelectorAll('.mono-th-filter-ind').length > 1, null, {
  timeout: 240000,
})
await page.waitForTimeout(6000) // let the OData loads settle

// The header-filter demo is the grid whose columns carry `headerFilter`.
const PICK = (field) =>
  `[...document.querySelectorAll('mono-table-th')].find((t) => t.field === '${field}' && t.headerFilter && t.dataGrid)`

const filtered = () =>
  page.evaluate(`(() => {
    const th = ${PICK('Code')}
    return th?.dataGrid?.filteredColumns?.() ?? null
  })()`)

const found = await page.evaluate(`!!(${PICK('Code')})?.dataGrid`)
ok('located the header-filter demo grid', found)
if (!found) {
  await browser.close()
  process.exit(1)
}

const centreOf = async (field, sel) => {
  await page.evaluate(`(() => { const el = ${PICK(field)}; el?.closest('th')?.scrollIntoView({ block: 'center' }) })()`)
  await page.waitForTimeout(350)
  return page.evaluate(`(() => {
    const el = ${PICK(field)}
    const target = ${sel}
    const b = target?.getBoundingClientRect()
    return b && { x: b.x + b.width / 2, y: b.y + b.height / 2 }
  })()`)
}

const panelBtn = (label) =>
  page.evaluate(`(() => {
    const p = document.querySelector('[data-mono-popup-portal] .mono-th-filter.open')
    const b = p && [...p.querySelectorAll('.mono-th-filter-btn')].find((n) => n.textContent.trim() === ${JSON.stringify(label)})
    if (!b) return null
    const r = b.getBoundingClientRect()
    return { x: r.x + r.width / 2, y: r.y + r.height / 2, disabled: b.disabled }
  })()`)

/** Tick the Nth non-"(Select all)" value in the open panel. */
const tickValue = (n = 0) =>
  page.evaluate(`(() => {
    const p = document.querySelector('[data-mono-popup-portal] .mono-th-filter.open')
    const rows = p ? [...p.querySelectorAll('.mono-th-check:not(.mono-th-check-all)')] : []
    const row = rows[${n}]
    if (!row) return null
    row.querySelector('input').click()
    return row.querySelector('.mono-th-check-label')?.textContent ?? null
  })()`)

const openViaFunnel = async (field) => {
  const b = await centreOf(field, `el?.querySelector('.mono-th-filter-ind')`)
  await page.mouse.click(b.x, b.y)
  await page.waitForTimeout(1800) // distinct-values fetch
}

const openViaMenu = async (field) => {
  const c = await centreOf(field, `el?.closest('th')`)
  await page.mouse.click(c.x, c.y, { button: 'right' })
  await page.waitForTimeout(500)
  const row = await page.evaluate(`(() => {
    const r = [...document.querySelectorAll('[data-mono-popup-portal] .mono-th-menu.open .mono-th-menu-item')]
      .find((n) => n.textContent.trim() === 'Header Filter')
    if (!r) return null
    const b = r.getBoundingClientRect()
    return { x: b.x + b.width / 2, y: b.y + b.height / 2 }
  })()`)
  if (!row) return false
  await page.mouse.click(row.x, row.y)
  await page.waitForTimeout(1800)
  return true
}

const apply = async () => {
  const b = await panelBtn('Apply')
  await page.mouse.click(b.x, b.y)
  await page.waitForTimeout(1600)
}

const eq = (a, b) => JSON.stringify(a) === b

console.log('\n  Header-filter demo (Code / Name)\n')

// ── 1. funnel = single column ───────────────────────────────────────────────
await openViaFunnel('Code')
const v1 = await tickValue(0)
ok('funnel opened a value list', v1 != null, String(v1))
await apply()
let f = await filtered()
ok('funnel filter applies to its column', eq(f, '["Code"]'), JSON.stringify(f))

await openViaFunnel('Nama')
await tickValue(0)
await apply()
f = await filtered()
ok('a second FUNNEL filter REPLACES the first', eq(f, '["Nama"]'), JSON.stringify(f))

// ── 2. menu = combines ──────────────────────────────────────────────────────
const viaMenu = await openViaMenu('Code')
ok('right-click → Header Filter opens the panel', viaMenu)
await tickValue(0)
await apply()
f = await filtered()
ok('MENU filter COMBINES with the existing one', f?.length === 2 && f.includes('Code') && f.includes('Nama'), JSON.stringify(f))

// ── 3. Clear all only in menu mode ──────────────────────────────────────────
await openViaFunnel('Code')
const clearAllOnFunnel = await panelBtn('Clear all')
ok('funnel panel has NO "Clear all"', clearAllOnFunnel === null, String(clearAllOnFunnel))
await page.keyboard.press('Escape')
await page.waitForTimeout(400)

await openViaMenu('Code')
const clearAllOnMenu = await panelBtn('Clear all')
ok('menu panel HAS "Clear all"', clearAllOnMenu !== null && clearAllOnMenu.disabled === false, JSON.stringify(clearAllOnMenu))
if (clearAllOnMenu) {
  await page.mouse.click(clearAllOnMenu.x, clearAllOnMenu.y)
  await page.waitForTimeout(1600)
}
f = await filtered()
ok('"Clear all" drops every column filter', eq(f, '[]'), JSON.stringify(f))

await openViaMenu('Code')
const disabledNow = await panelBtn('Clear all')
ok('"Clear all" is disabled with nothing filtered', disabledNow?.disabled === true, JSON.stringify(disabledNow))
await page.keyboard.press('Escape')
await page.waitForTimeout(400)

// ── 4. funnel Clear wipes everything (single-column mode) ───────────────────
await openViaMenu('Code')
await tickValue(0)
await apply()
await openViaMenu('Nama')
await tickValue(0)
await apply()
f = await filtered()
ok('rebuilt a 2-column filter from the menu', f?.length === 2, JSON.stringify(f))

await openViaFunnel('Code')
const clearBtn = await panelBtn('Clear')
await page.mouse.click(clearBtn.x, clearBtn.y)
await page.waitForTimeout(1600)
f = await filtered()
ok('funnel "Clear" empties every column (single mode)', eq(f, '[]'), JSON.stringify(f))

const real = errors.filter((e) => !/favicon|net::|404/i.test(e))
ok('no console errors', real.length === 0, real.slice(0, 2).join(' | '))

await browser.close()
const failed = results.filter((r) => !r.pass)
console.log(`\n  ${results.length - failed.length}/${results.length} passed\n`)
process.exit(failed.length ? 1 : 0)
