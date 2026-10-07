/**
 * Verifies the fixed sort / header-filter gesture model on the live docs page:
 *   arrow click   → SINGLE key (replaces the whole sort)
 *   right-click   → menu with Sort › (and Header Filter › where enabled)
 *   Sort › pick   → APPENDS a key (the only multi-sort path)
 *   Clear all     → empties the sort, disabled while nothing is sorted
 *
 * Usage (dev server must already be running):
 *   node docs/e2e/sort-gestures.check.mjs [baseUrl]
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
const warnings = []
page.on('console', (m) => {
  if (m.type() === 'warning' || m.type() === 'error') warnings.push(m.text())
})

await page.goto(`${BASE}/ui/table`, { waitUntil: 'domcontentloaded', timeout: 120000 })
// Cold transform of this page is slow; wait for the sorting demo to actually mount.
await page.waitForFunction(
  () => document.querySelectorAll('mono-table-th .mono-table-sort-btn').length > 3,
  null,
  { timeout: 240000 },
)
await page.waitForTimeout(5000) // let the OData loads settle

// Scope everything to the Sorting demo — the page hosts ~20 grids.
const PICK = (field) =>
  `[...document.querySelectorAll('mono-table-th')].find((t) => t.field === '${field}' && t.dataGrid && t.dataGrid.props()?.th?.length === 3)`

const sorts = () =>
  page.evaluate(`(() => {
    const th = ${PICK('Code')}
    return th?.dataGrid ? th.dataGrid.sorts.map((s) => s.field + ':' + s.order) : null
  })()`)

const found = await page.evaluate(`!!(${PICK('Code')})?.dataGrid`)
ok('located the Sorting demo grid', found)
if (!found) {
  await browser.close()
  process.exit(1)
}

// The page is long, so measure only AFTER scrolling the cell into view — a
// rect from off-screen puts page.mouse.click() somewhere else entirely.
const centreOf = async (field, sel) => {
  await page.evaluate(`(() => {
    const el = ${PICK(field)}
    el?.closest('th')?.scrollIntoView({ block: 'center' })
  })()`)
  await page.waitForTimeout(350)
  return page.evaluate(`(() => {
    const el = ${PICK(field)}
    const target = ${sel}
    const b = target?.getBoundingClientRect()
    return b && { x: b.x + b.width / 2, y: b.y + b.height / 2 }
  })()`)
}

const arrowBox = (f) => centreOf(f, `el?.querySelector('.mono-table-sort-btn')`)
const cellBox = (f) => centreOf(f, `el?.closest('th')`)

const clickArrow = async (field) => {
  const b = await arrowBox(field)
  await page.mouse.click(b.x, b.y)
  await page.waitForTimeout(900)
}

const rowIn = (container, label) =>
  page.evaluate(`(() => {
    const row = [...document.querySelectorAll('[data-mono-popup-portal] ${container} .mono-th-menu-item')]
      .find((n) => n.textContent.trim() === ${JSON.stringify(label)})
    if (!row) return null
    const b = row.getBoundingClientRect()
    return { x: b.x + b.width / 2, y: b.y + b.height / 2, disabled: row.disabled, aria: row.getAttribute('aria-disabled') }
  })()`)

/** Right-click a header cell, then walk Sort › <label> in the portaled menu. */
const menuPick = async (field, label) => {
  const c = await cellBox(field)
  await page.mouse.click(c.x, c.y, { button: 'right' })
  await page.waitForTimeout(500)
  const sortRow = await rowIn('.mono-th-menu.open', 'Sort')
  if (!sortRow) return { missing: 'Sort' }
  await page.mouse.click(sortRow.x, sortRow.y)
  await page.waitForTimeout(450)
  const pick = await rowIn('.mono-th-submenu.open', label)
  if (!pick) return { missing: label }
  await page.mouse.click(pick.x, pick.y)
  await page.waitForTimeout(900)
  return {}
}

const menuLabels = async (field) => {
  const c = await cellBox(field)
  await page.mouse.click(c.x, c.y, { button: 'right' })
  await page.waitForTimeout(500)
  const out = await page.evaluate(
    `[...document.querySelectorAll('[data-mono-popup-portal] .mono-th-menu.open .mono-th-menu-item')].map((n) => n.textContent.trim())`,
  )
  await page.keyboard.press('Escape')
  await page.waitForTimeout(300)
  return out
}

const eq = (a, b) => JSON.stringify(a) === b

console.log('\n  Sorting demo (Id / Code / Nama)\n')

// ── 0. baseline: the demo seeds Nama asc ────────────────────────────────────
let s = await sorts()
ok('seeded sort from sort.order', eq(s, '["Nama:asc"]'), JSON.stringify(s))

// ── 1. the arrow is single-key ──────────────────────────────────────────────
await clickArrow('Id')
s = await sorts()
ok('arrow click REPLACES the seeded key', eq(s, '["Id:asc"]'), JSON.stringify(s))

await clickArrow('Id')
s = await sorts()
ok('arrow click cycles asc → desc', eq(s, '["Id:desc"]'), JSON.stringify(s))

await clickArrow('Id')
s = await sorts()
ok('arrow click cycles desc → none (empties)', eq(s, '[]'), JSON.stringify(s))

// ── 2. the right-click menu is the multi-sort path ──────────────────────────
const labels = await menuLabels('Code')
ok('right-click opens the menu with Sort ›', labels.includes('Sort'), JSON.stringify(labels))

let miss = await menuPick('Id', 'Descending')
s = await sorts()
ok('menu pick sets the first key', !miss.missing && eq(s, '["Id:desc"]'), miss.missing ?? JSON.stringify(s))

miss = await menuPick('Nama', 'Ascending')
s = await sorts()
ok(
  'menu pick APPENDS a second key',
  !miss.missing && eq(s, '["Id:desc","Nama:asc"]'),
  miss.missing ?? JSON.stringify(s),
)

const sup = await page.evaluate(`(() => {
  const grid = (${PICK('Code')})?.dataGrid
  return [...document.querySelectorAll('mono-table-th')]
    .filter((t) => t.dataGrid === grid)
    .map((t) => t.field + '=' + (t.querySelector('.mono-table-sort-seq')?.textContent ?? '-'))
    .join(',')
})()`)
ok('<sup> precedence badges reflect the stack', sup.includes('Id=1') && sup.includes('Nama=2'), sup)

// ── 3. the arrow FOLLOWS a menu-started sort, and is single-key on its own ──
// Once the menu started combining, the arrows append until nothing is sorted;
// start with an arrow and arrows replace.
await clickArrow('Code')
s = await sorts()
ok('arrow APPENDS after a menu-started 2-key sort', eq(s, '["Id:desc","Nama:asc","Code:asc"]'), JSON.stringify(s))
await menuPick('Id', 'Clear all sorting')
await clickArrow('Id')
await clickArrow('Nama')
s = await sorts()
ok('after Clear all, arrow-first stays single: the second arrow REPLACES', eq(s, '["Nama:asc"]'), JSON.stringify(s))

// ── 4. Clear all sorting ────────────────────────────────────────────────────
await menuPick('Id', 'Ascending')
await menuPick('Nama', 'Descending')
s = await sorts()
ok('rebuilt a multi-key sort from the menu', s.length >= 2, JSON.stringify(s))

miss = await menuPick('Id', 'Clear all sorting')
s = await sorts()
ok('Clear all sorting empties the stack', !miss.missing && eq(s, '[]'), miss.missing ?? JSON.stringify(s))

const c = await cellBox('Id')
await page.mouse.click(c.x, c.y, { button: 'right' })
await page.waitForTimeout(450)
const sortRow = await rowIn('.mono-th-menu.open', 'Sort')
await page.mouse.click(sortRow.x, sortRow.y)
await page.waitForTimeout(450)
const clearAll = await rowIn('.mono-th-submenu.open', 'Clear all sorting')
ok(
  'Clear all is disabled while nothing is sorted',
  clearAll?.disabled === true && clearAll?.aria === 'true',
  JSON.stringify(clearAll),
)
await page.keyboard.press('Escape')
await page.waitForTimeout(300)

// ── 5. header filter still reachable both ways ──────────────────────────────
console.log('\n  Header-filter demo\n')
const hfLabels = await page.evaluate(`(async () => {
  const th = [...document.querySelectorAll('mono-table-th')].find((t) => t.field === 'Code' && t.headerFilter)
  if (!th) return null
  th.closest('th').dispatchEvent(new MouseEvent('contextmenu', { bubbles: true, cancelable: true }))
  await new Promise((r) => setTimeout(r, 500))
  const rows = [...document.querySelectorAll('[data-mono-popup-portal] .mono-th-menu.open .mono-th-menu-item')]
    .map((n) => n.textContent.trim())
  document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))
  return rows
})()`)
ok(
  'a sortable + filterable header shows BOTH sections',
  !!hfLabels && hfLabels.includes('Sort') && hfLabels.includes('Header Filter'),
  JSON.stringify(hfLabels),
)

const funnels = await page.evaluate(`document.querySelectorAll('.mono-th-filter-ind').length`)
ok('funnel icons still render', funnels > 0, String(funnels))

const stray = warnings.filter((w) => /showIcon:false|no way to open it/.test(w))
ok('no "unreachable header filter" warning', stray.length === 0, stray.join(' | '))

await browser.close()

const failed = results.filter((r) => !r.pass)
console.log(`\n  ${results.length - failed.length}/${results.length} passed\n`)
process.exit(failed.length ? 1 : 0)
