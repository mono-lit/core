/**
 * `autoFullscreen` on mono-modal / mono-drawer.
 *
 * Fill the screen at a Tailwind breakpoint and below, opt-in, keeping the drawer's
 * `position`. All sizing is done by `@media` blocks (no viewport measured in JS), so
 * this test is the only thing that can prove the CSS actually wins the cascade.
 *
 * The load-bearing assertion is the "authored size" one: `_panelSizeStyle()` writes
 * INLINE width/height whenever a sizing prop is set, so without `!important` in the
 * media block a `<mono-modal auto-fullscreen width="720">` stays 720px on a phone.
 *
 * Usage (dev server must already be running):
 *   node docs/e2e/auto-fullscreen.check.mjs [baseUrl]
 */
import pw from 'file:///C:/Users/VCT-DEV/Desktop/libs/node_modules/playwright/index.js'

const { chromium } = pw
const BASE = process.argv[2] || 'http://127.0.0.1:5174'

const results = []
const ok = (name, pass, detail = '') => {
  results.push({ name, pass })
  console.log(`  ${pass ? 'PASS' : 'FAIL'}  ${name}${detail ? '  →  ' + detail : ''}`)
}

/** Build one overlay with the given attributes, open it, measure its panel. */
const MEASURE = (tag, panelSel, attrs) => `(async () => {
  const wait = (ms) => new Promise((r) => setTimeout(r, ms))
  const el = document.createElement(${JSON.stringify(tag)})
  ${Object.entries(attrs).map(([k, v]) => `el.setAttribute(${JSON.stringify(k)}, ${JSON.stringify(v)})`).join('\n  ')}
  el.innerHTML = '<span slot="header">H</span><div style="height:40px">B</div>'
  document.body.appendChild(el)
  await wait(150)
  el.modelValue = true
  await wait(700)

  const scope = el.shadowRoot ?? el.renderRoot ?? el
  const panel = scope.querySelector(${JSON.stringify(panelSel)})
  if (!panel) { el.remove(); return { error: 'no panel for ' + ${JSON.stringify(tag)} } }
  const r = panel.getBoundingClientRect()
  const vv = window.visualViewport
  const resizer = scope.querySelector('.mono-drawer-resizer')
  const out = {
    vw: Math.round(vv ? vv.width : window.innerWidth),
    vh: Math.round(vv ? vv.height : window.innerHeight),
    x: Math.round(r.x), y: Math.round(r.y),
    w: Math.round(r.width), h: Math.round(r.height),
    right: Math.round(r.right), bottom: Math.round(r.bottom),
    rootClass: (scope.className && String(scope.className)) || '',
    resizerDisplay: resizer ? getComputedStyle(resizer).display : null,
    transform: getComputedStyle(panel).transform,
  }
  el.modelValue = false
  await wait(220)
  el.remove()
  await wait(60)
  return out
})()`

const browser = await chromium.launch()

const open = async (width, height = 900) => {
  const page = await browser.newPage({
    viewport: { width, height },
    isMobile: width <= 640, hasTouch: width <= 640, deviceScaleFactor: 1,
  })
  await page.goto(`${BASE}/ui/modal`, { waitUntil: 'domcontentloaded', timeout: 120000 })
  await page.waitForFunction(
    () => customElements.get('mono-modal') && customElements.get('mono-drawer'),
    null, { timeout: 240000 },
  )
  await page.waitForTimeout(2200)
  return page
}

const fills = (m) => m.x <= 1 && m.y <= 1 && m.w >= m.vw - 1 && m.h >= m.vh - 1

// ── 1. sm default: fullscreen under 640, authored size above ────────────────
console.log('\n  auto-fullscreen (default = sm)\n')
{
  const page = await open(390)
  const m = await page.evaluate(MEASURE('mono-modal', '.mono-modal-panel', { 'auto-fullscreen': '' }))
  ok('390: bare `auto-fullscreen` fills the screen', fills(m), `${m.w}x${m.h} @(${m.x},${m.y}) vs ${m.vw}x${m.vh}`)
  ok('390: emits the auto-fullscreen-sm class', /auto-fullscreen-sm/.test(m.rootClass), m.rootClass)
  await page.close()
}
{
  const page = await open(1280)
  const m = await page.evaluate(MEASURE('mono-modal', '.mono-modal-panel', { 'auto-fullscreen': '' }))
  ok('1280: stays its authored size (CONTROL)', !fills(m) && m.w < m.vw, `${m.w}x${m.h} vs ${m.vw}x${m.vh}`)
  await page.close()
}

// ── 2. the !important case ──────────────────────────────────────────────────
console.log('\n  explicit sizing props (the `!important` case)\n')
{
  const page = await open(390)
  const m = await page.evaluate(
    MEASURE('mono-modal', '.mono-modal-panel', { 'auto-fullscreen': '', width: '720px', 'min-width': '600px', height: '500px' }),
  )
  ok('390: inline width/min-width/height are overridden', fills(m), `${m.w}x${m.h} vs ${m.vw}x${m.vh} (authored 720x500, min-w 600)`)
  await page.close()
}
{
  const page = await open(1280)
  const m = await page.evaluate(
    MEASURE('mono-modal', '.mono-modal-panel', { 'auto-fullscreen': '', width: '720px', height: '500px' }),
  )
  ok('1280: authored size still honoured above the breakpoint', m.w === 720 && m.h === 500, `${m.w}x${m.h}`)
  await page.close()
}

// ── 3. breakpoint token + boundary ──────────────────────────────────────────
console.log('\n  auto-fullscreen="lg" (1024)\n')
for (const [w, want] of [[1000, true], [1024, false], [1100, false]]) {
  const page = await open(w)
  const m = await page.evaluate(MEASURE('mono-modal', '.mono-modal-panel', { 'auto-fullscreen': 'lg' }))
  ok(`${w}: ${want ? 'fills' : 'does NOT fill'} (lg = 1024, Tailwind-exclusive)`, fills(m) === want, `${m.w}x${m.h} vs ${m.vw}x${m.vh}`)
  await page.close()
}
{
  const page = await open(390)
  const m = await page.evaluate(MEASURE('mono-modal', '.mono-modal-panel', { 'auto-fullscreen': 'nonsense' }))
  ok('390: unknown token falls back to sm (still fills)', fills(m), m.rootClass)
  await page.close()
}

// ── 4. drawer, every position ───────────────────────────────────────────────
console.log('\n  drawer positions\n')
{
  const page = await open(390)
  for (const pos of ['right', 'left', 'top', 'bottom']) {
    const m = await page.evaluate(
      MEASURE('mono-drawer', '.mono-drawer-panel', { position: pos, 'auto-fullscreen': '', resizeable: '', width: '420px' }),
    )
    ok(`390 drawer ${pos}: fills the screen`, fills(m), `${m.w}x${m.h} @(${m.x},${m.y}) vs ${m.vw}x${m.vh}`)
    ok(`390 drawer ${pos}: resizer hidden`, m.resizerDisplay === 'none', `display=${m.resizerDisplay}`)
  }
  await page.close()
}
{
  const page = await open(1280)
  const m = await page.evaluate(
    MEASURE('mono-drawer', '.mono-drawer-panel', { position: 'right', 'auto-fullscreen': '', resizeable: '', width: '420px' }),
  )
  ok('1280 drawer: authored 420px width kept (CONTROL)', m.w === 420, `${m.w}px`)
  ok('1280 drawer: resizer visible again', m.resizerDisplay !== 'none', `display=${m.resizerDisplay}`)
  await page.close()
}

// ── 5. shadow builds ────────────────────────────────────────────────────────
console.log('\n  shadow builds\n')
{
  const page = await open(390)
  const tabs = await page.evaluate(`(() => {
    const t = [...document.querySelectorAll('button, [role=tab], .tab, label')]
      .filter((n) => /shadow/i.test(n.textContent || ''))
    t.forEach((n) => n.click())
    return t.length
  })()`)
  if (tabs > 0) {
    await page.waitForTimeout(4000)
    if (await page.evaluate(`!!customElements.get('mono-shadow-modal')`)) {
      const sm = await page.evaluate(MEASURE('mono-shadow-modal', '.mono-modal-panel', { 'auto-fullscreen': '', width: '720px' }))
      ok('390 SHADOW modal: fills the screen', fills(sm), `${sm.w}x${sm.h} vs ${sm.vw}x${sm.vh}`)
      const sd = await page.evaluate(MEASURE('mono-shadow-drawer', '.mono-drawer-panel', { position: 'right', 'auto-fullscreen': '', width: '420px' }))
      ok('390 SHADOW drawer: fills the screen', fills(sd), `${sd.w}x${sd.h} vs ${sd.vw}x${sd.vh}`)
    } else ok('shadow tags registered', false, `clicked ${tabs} tabs`)
  }
  await page.close()
}

await browser.close()
const failed = results.filter((r) => !r.pass)
console.log(`\n  ${results.length - failed.length}/${results.length} passed\n`)
process.exit(failed.length ? 1 : 0)
