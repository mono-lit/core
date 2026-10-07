/**
 * End-to-end LIGHT vs SHADOW render-parity test for <mono-dropdown-table>.
 *
 * Drives the running docs dev server (default http://127.0.0.1:5174/ui/dropdown-table),
 * captures a battery of computed-style metrics for the LIGHT build, switches every demo
 * to "Vue + Shadow DOM", captures the SHADOW build, and asserts they render identically.
 *
 * Covers the three parity fixes:
 *   1. host-scoped row rules  (cursor / hover / .mono-dd-row-selected apply to the SLOTTED
 *      shadow table via `mono-shadow-dropdown-table table.mono-table tbody tr…`)
 *   2. data-empty region scan (empty <slot> footer/search hidden in shadow, like `:empty`)
 *   3. .vp-doc table.mono-table normalization (VitePress table chrome neutralized so the
 *      in-.vp-doc slotted shadow table matches the body-portaled light table)
 *
 * Usage (dev server must already be running):
 *   node docs/e2e/dropdown-table-parity.mjs [baseUrl]
 * Exit code 0 = full parity, 1 = a diff or console error was found.
 */
import pw from 'file:///C:/Users/VCT-DEV/Desktop/libs/node_modules/playwright/index.js'

const { chromium } = pw
const BASE = process.argv[2] || 'http://127.0.0.1:5174'
const URL = `${BASE}/ui/dropdown-table`

const browser = await chromium.launch()
const page = await browser.newPage()
const errors = []
page.on('pageerror', (e) => errors.push(e.message))
await page.goto(URL, { waitUntil: 'networkidle' }).catch(() => {})
await page.waitForTimeout(2500)

/**
 * Capture field/table/empty-footer metrics off a SINGLE-select, NO-PAGING demo.
 * No-paging → the footer <slot> is empty (tests the `data-empty` region-scan fix).
 * The panel is read WITHOUT clicking a row, so `trBgDefault` is a clean unselected bg.
 */
async function readGeneral(tag) {
  await page.evaluate((tag) => {
    const el = Array.from(document.querySelectorAll(`.mono-demo ${tag}`)).find(
      (e) => !e.dataDropdown?.multiple && !e.querySelector('mono-table-paging'),
    )
    el.setAttribute('data-m', '1')
    ;(el.shadowRoot ?? el).querySelector('.mono-dropdown-table-trigger').click()
  }, tag)
  await page.waitForTimeout(400)
  const out = await page.evaluate(() => {
    const el = document.querySelector('[data-m]')
    const isShadow = !!el.shadowRoot
    const root = el.shadowRoot ?? el
    const trg = root.querySelector('.mono-dropdown-table-trigger')
    const ts = getComputedStyle(trg)
    const panel = root.querySelector('.mono-dropdown-table-panel') ||
      document.querySelector('.mono-dropdown-table-panel')
    const table = isShadow ? el.querySelector('table.mono-table') : panel.querySelector('table.mono-table')
    const tds = getComputedStyle(table.querySelector('tbody td'))
    const trd = getComputedStyle(table.querySelector('tbody tr[data-row-key]'))
    const foot = root.querySelector('.mono-dropdown-table-region.foot')
    return {
      triggerBorderW: ts.borderTopWidth.replace('px', ''),
      triggerPad: `${ts.paddingTop} ${ts.paddingLeft}`.replace(/px/g, ''),
      triggerMinH: Math.round(trg.getBoundingClientRect().height),
      triggerRadius: ts.borderTopLeftRadius.replace('px', ''),
      tableDisplay: getComputedStyle(table).display,
      tdPad: `${tds.paddingTop} ${tds.paddingLeft}`.replace(/px/g, ''),
      tdBorderW: tds.borderTopWidth.replace('px', ''),
      trBgDefault: trd.backgroundColor,
      cursor: trd.cursor,
      footerDisplay: foot ? getComputedStyle(foot).display : 'none',
    }
  }, tag)
  await page.keyboard.press('Escape').catch(() => {})
  await page.evaluate(() => document.querySelector('[data-m]')?.removeAttribute('data-m'))
  return out
}

/** Capture selected-row highlight off the MULTIPLE demo (panel stays open on pick). */
async function readSelection(tag) {
  await page.evaluate((tag) => {
    const el = Array.from(document.querySelectorAll(`.ddt-demo ${tag}`))
      .find((e) => e.dataDropdown?.multiple === true && (e.dataDropdown.grid?.items?.length ?? 0) > 0)
    el.setAttribute('data-m', '1')
    ;(el.shadowRoot ?? el).querySelector('.mono-dropdown-table-trigger').click()
  }, tag)
  await page.waitForTimeout(400)
  const out = await page.evaluate(() => {
    const el = document.querySelector('[data-m]')
    const isShadow = !!el.shadowRoot
    const root = el.shadowRoot ?? el
    const panel = root.querySelector('.mono-dropdown-table-panel.open') ||
      document.querySelector('.mono-dropdown-table-panel.open')
    const table = isShadow ? el.querySelector('table.mono-table') : panel.querySelector('table.mono-table')
    const rowOf = (name) => Array.from(table.querySelectorAll('tbody tr[data-row-key]'))
      .find((r) => r.innerText.includes(name))
    const alan = rowOf('Alan Turing') // 2nd (even) row — preset-selected in the multiple demo
    const ada = rowOf('Ada Lovelace') // 1st (odd) row — NOT selected
    const bg = (n) => getComputedStyle(n).backgroundColor
    return {
      alanSelected: alan.classList.contains('mono-dd-row-selected'),
      alanBg: bg(alan),
      adaSelected: ada.classList.contains('mono-dd-row-selected'),
      alanCursor: getComputedStyle(alan).cursor,
      chipCount: (el.shadowRoot ?? el).querySelectorAll('.mono-dropdown-table-trigger .mono-chip').length,
    }
  })
  await page.keyboard.press('Escape').catch(() => {})
  await page.evaluate(() => document.querySelector('[data-m]')?.removeAttribute('data-m'))
  return out
}

const lightGeneral = await readGeneral('mono-dropdown-table')
const lightSel = await readSelection('mono-dropdown-table')

// Switch every demo tab to "Vue + Shadow DOM".
await page.evaluate(() =>
  document.querySelectorAll('button, [role=tab], label, a, option').forEach((b) => {
    if (/Vue \+ Shadow DOM/i.test(b.textContent || '')) b.click()
  }),
)
await page.waitForTimeout(1500)

const shadowGeneral = await readGeneral('mono-shadow-dropdown-table')
const shadowSel = await readSelection('mono-shadow-dropdown-table')

console.log('LIGHT  general:', JSON.stringify(lightGeneral))
console.log('SHADOW general:', JSON.stringify(shadowGeneral))
console.log('LIGHT  select :', JSON.stringify(lightSel))
console.log('SHADOW select :', JSON.stringify(shadowSel))

const diffs = []
for (const k of Object.keys(lightGeneral)) {
  if (JSON.stringify(lightGeneral[k]) !== JSON.stringify(shadowGeneral[k]))
    diffs.push(`${k}: light=${JSON.stringify(lightGeneral[k])} shadow=${JSON.stringify(shadowGeneral[k])}`)
}
for (const k of Object.keys(lightSel)) {
  if (JSON.stringify(lightSel[k]) !== JSON.stringify(shadowSel[k]))
    diffs.push(`${k}: light=${JSON.stringify(lightSel[k])} shadow=${JSON.stringify(shadowSel[k])}`)
}

console.log('\nDIFFS:', diffs.length ? diffs.join(' ; ') : 'none')
console.log('ERRORS:', errors.length ? errors.slice(0, 4) : 'none')
await browser.close()

const ok = diffs.length === 0 && errors.length === 0
console.log(ok ? '\n✅ PARITY: light and shadow render identically' : '\n❌ PARITY FAILED')
process.exit(ok ? 0 : 1)
