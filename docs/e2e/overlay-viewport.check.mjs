/**
 * Modal / drawer viewport coverage across emulated viewports.
 *
 * The bug this guards, as MEASURED (not assumed — the first theory was backwards):
 * on a page that overflows horizontally, mobile emulation widens the initial
 * containing block, so on a 390x844 screen
 *
 *     position: fixed; inset: 0   ->  481 x 1041   (the ICB — wrong)
 *     width/height: 100%          ->  481 x 1041   (same ICB — wrong)
 *     100vw / 100vh               ->  390 x  844   (right)
 *     100dvw / 100dvh             ->  390 x  844   (right)
 *
 * The overlay and panel-wrap used `inset: 0`, so they stretched to 481x1041 while the
 * panel sized itself correctly with `100vw/100vh` — and then centred inside that
 * oversized wrap, landing at (46, 99) instead of (0, 0). Hence "it does not cover the
 * screen". The fix pins every fixed container in viewport units. Desktop is a CONTROL
 * row: there the two agree, so it must stay passing before AND after.
 *
 * The probe runs on the REAL docs page, deliberately: that page overflows
 * horizontally (scrollWidth 481 on a 390 screen), and under mobile emulation Chrome
 * widens the initial containing block to match — which is precisely what broke
 * `inset: 0`. A wiped body has no overflow and therefore cannot reproduce the bug.
 * Measurements go through `el.renderRoot` (the light build's own <body> portal), not
 * `document.querySelector`, because the page already holds ~15 closed demo modals
 * whose panels measure ~2px tall thanks to `content-visibility`.
 *
 * Usage (dev server must already be running):
 *   node docs/e2e/overlay-viewport.check.mjs [baseUrl]
 */
import pw from 'file:///C:/Users/VCT-DEV/Desktop/libs/node_modules/playwright/index.js'

const { chromium } = pw
const BASE = process.argv[2] || 'http://127.0.0.1:5174'

const results = []
const ok = (name, pass, detail = '') => {
  results.push({ name, pass })
  console.log(`  ${pass ? 'PASS' : 'FAIL'}  ${name}${detail ? '  →  ' + detail : ''}`)
}

const VIEWPORTS = [
  { label: 'iPhone 14 (390x844)', width: 390, height: 844, mobile: true },
  { label: 'small (360x640)', width: 360, height: 640, mobile: true },
  { label: 'Pixel 7 (412x915)', width: 412, height: 915, mobile: true },
  { label: 'desktop CONTROL (1440x900)', width: 1440, height: 900, mobile: false },
]

const MEASURE = (tag, panelSel, attrs) => `(async () => {
  const wait = (ms) => new Promise((r) => setTimeout(r, ms))
  // Baseline BEFORE our overlay exists. The docs page already overflows to ~481px
  // on its own (pre-existing demo content, unrelated to these components), so the
  // meaningful question is a DELTA: does opening the overlay make it worse?
  const scrollWBefore = document.documentElement.scrollWidth
  const el = document.createElement(${JSON.stringify(tag)})
  ${Object.entries(attrs).map(([k, v]) => `el.setAttribute(${JSON.stringify(k)}, ${JSON.stringify(v)})`).join('\n  ')}
  el.innerHTML = '<span slot="header">H</span><div style="height:40px">B</div><span slot="footer" data-foot>F</span>'
  document.body.appendChild(el)
  await wait(150)
  el.modelValue = true
  await wait(700)

  // renderRoot IS the portal for the light build; shadow build has a shadowRoot.
  const scope = el.shadowRoot ?? el.renderRoot ?? el
  const panel = scope.querySelector(${JSON.stringify(panelSel)})
  if (!panel) { el.remove(); return { error: 'no panel in scope for ' + ${JSON.stringify(tag)} } }

  const r = panel.getBoundingClientRect()
  const vv = window.visualViewport
  const out = {
    // the visible area
    vw: Math.round(vv ? vv.width : window.innerWidth),
    vh: Math.round(vv ? vv.height : window.innerHeight),
    // the ICB that position:fixed insets resolve against
    icbW: document.documentElement.clientWidth,
    icbH: document.documentElement.clientHeight,
    x: Math.round(r.x), y: Math.round(r.y),
    w: Math.round(r.width), h: Math.round(r.height),
    bottom: Math.round(r.bottom), right: Math.round(r.right),
    fullscreenClass: !!scope.querySelector('.fullscreen') ||
      (scope.classList ? scope.classList.contains('fullscreen') : false),
    bodyOverflow: document.body.style.overflow,
    // Guard the trade-off this fix makes: 100vw INCLUDES a classic desktop
    // scrollbar where the old "inset: 0" (the ICB) excluded it. Fixed-position
    // boxes must not extend the document scrollable area - an overflowing page is
    // what inflated the ICB and caused the original bug, so do not re-create it.
    scrollWBefore,
    scrollWAfter: document.documentElement.scrollWidth,
    clientW: document.documentElement.clientWidth,
  }
  const foot = scope.querySelector('[data-foot]')
  out.footBottom = foot ? Math.round(foot.getBoundingClientRect().bottom) : null

  el.modelValue = false
  await wait(250)
  el.remove()
  await wait(80)
  return out
})()`

const browser = await chromium.launch()

for (const vp of VIEWPORTS) {
  const page = await browser.newPage({
    viewport: { width: vp.width, height: vp.height },
    isMobile: vp.mobile,
    hasTouch: vp.mobile,
    deviceScaleFactor: vp.mobile ? 3 : 1,
  })
  await page.goto(`${BASE}/ui/modal`, { waitUntil: 'domcontentloaded', timeout: 120000 })
  await page.waitForFunction(
    () => customElements.get('mono-modal') && customElements.get('mono-drawer'),
    null,
    { timeout: 240000 },
  )
  await page.waitForTimeout(2500)

  console.log(`\n  ${vp.label}\n`)

  const m = await page.evaluate(MEASURE('mono-modal', '.mono-modal-panel', { width: '100%', height: '100%' }))
  if (m.error) ok(`modal built`, false, m.error)
  else {
    const geom = `panel ${m.w}x${m.h} @(${m.x},${m.y}) · visible ${m.vw}x${m.vh} · icb ${m.icbW}x${m.icbH}`
    ok(`modal 100%: fits the visible viewport`, m.w <= m.vw + 1 && m.h <= m.vh + 1, geom)
    ok(
      `modal 100%: covers all four edges`,
      m.x <= 1 && m.y <= 1 && m.right >= m.vw - 1 && m.bottom >= m.vh - 1 && m.bottom <= m.vh + 1,
      `x=${m.x} y=${m.y} right=${m.right} bottom=${m.bottom} vs ${m.vw}x${m.vh}`,
    )
    ok(`modal 100%: footer on screen`, m.footBottom === null || m.footBottom <= m.vh + 1, `foot=${m.footBottom} vh=${m.vh}`)
    ok(`modal: scroll locked while open`, m.bodyOverflow === 'hidden', `body.overflow="${m.bodyOverflow}"`)
    ok(
      `modal: open overlay adds no horizontal overflow`,
      m.scrollWAfter <= m.scrollWBefore,
      `scrollWidth ${m.scrollWBefore} -> ${m.scrollWAfter} (page's own overflow, clientWidth=${m.clientW})`,
    )
  }

  const d = await page.evaluate(MEASURE('mono-modal', '.mono-modal-panel', {}))
  if (!d.error) {
    ok(`modal default: fits the visible viewport`, d.h <= d.vh + 1, `h=${d.h} vh=${d.vh} icbH=${d.icbH}`)
  }

  for (const pos of ['right', 'left', 'top', 'bottom']) {
    const dr = await page.evaluate(
      MEASURE('mono-drawer', '.mono-drawer-panel', { position: pos, width: '100%', height: '100%' }),
    )
    if (dr.error) {
      ok(`drawer ${pos}: built`, false, dr.error)
      continue
    }
    ok(
      `drawer ${pos} 100%: fits the visible viewport`,
      dr.h <= dr.vh + 1 && dr.w <= dr.vw + 1,
      `panel ${dr.w}x${dr.h} vs ${dr.vw}x${dr.vh} · icb ${dr.icbW}x${dr.icbH}`,
    )
  }

  // ── shadow builds ────────────────────────────────────────────────────────
  // Same CSS file, adopted into a shadow root instead of the page, so the fix has
  // to hold there too. The tags only register once a demo's Shadow tab is opened.
  const tabs = await page.evaluate(`(() => {
    const t = [...document.querySelectorAll('button, [role=tab], .tab, label')]
      .filter((n) => /shadow/i.test(n.textContent || ''))
    t.forEach((n) => n.click())
    return t.length
  })()`)
  if (tabs > 0) {
    await page.waitForTimeout(4000)
    const ready = await page.evaluate(`!!customElements.get('mono-shadow-modal')`)
    if (!ready) ok('shadow: mono-shadow-modal registered', false, `clicked ${tabs} shadow tabs`)
    else {
      const sm = await page.evaluate(
        MEASURE('mono-shadow-modal', '.mono-modal-panel', { width: '100%', height: '100%' }),
      )
      if (sm.error) ok('shadow modal built', false, sm.error)
      else
        ok(
          `SHADOW modal 100%: covers the visible viewport`,
          sm.x <= 1 && sm.y <= 1 && sm.w <= sm.vw + 1 && sm.h <= sm.vh + 1 && sm.bottom >= sm.vh - 1,
          `panel ${sm.w}x${sm.h} @(${sm.x},${sm.y}) vs ${sm.vw}x${sm.vh}`,
        )
      const sd = await page.evaluate(
        MEASURE('mono-shadow-drawer', '.mono-drawer-panel', { position: 'right', width: '100%', height: '100%' }),
      )
      if (!sd.error)
        ok(
          `SHADOW drawer right 100%: fits the visible viewport`,
          sd.h <= sd.vh + 1 && sd.w <= sd.vw + 1,
          `panel ${sd.w}x${sd.h} vs ${sd.vw}x${sd.vh}`,
        )
    }
  }

  await page.close()
}

await browser.close()

const failed = results.filter((r) => !r.pass)
console.log(`\n  ${results.length - failed.length}/${results.length} passed\n`)
process.exit(failed.length ? 1 : 0)
