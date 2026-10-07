/**
 * `mono-card` `size` — the 6-step CONTENT scale.
 *
 * The two assertions that matter most:
 *   1. `size="md"` computes identically to a bare `class="mono-card"` with no size
 *      token. That is the library-wide invariant (accordion.css:47, modal.css:120)
 *      and is what proves redefining `size` changed nothing for existing users.
 *   2. `size` is NOT a dimension — two cards with the same `width` must measure the
 *      same at `xs` and `xxl`. That is the whole point of the prop.
 *
 * Usage (dev server must already be running):
 *   node docs/e2e/card-size.check.mjs [baseUrl]
 */
import pw from 'file:///C:/Users/VCT-DEV/Desktop/libs/node_modules/playwright/index.js'

const { chromium } = pw
const BASE = process.argv[2] || 'http://127.0.0.1:5173'

const results = []
const ok = (name, pass, detail = '') => {
  results.push({ name, pass })
  console.log(`  ${pass ? 'PASS' : 'FAIL'}  ${name}${detail ? '  →  ' + detail : ''}`)
}

const STEPS = ['xs', 'sm', 'md', 'lg', 'xl', 'xxl']

/** Build a card, read the COMPUTED values (not the vars) off its real elements. */
const MEASURE = (tag, attrs, inlineStyle = '') => `(async () => {
  const wait = (ms) => new Promise((r) => setTimeout(r, ms))
  document.querySelectorAll('[data-probe]').forEach((n) => n.remove())
  const el = document.createElement(${JSON.stringify(tag)})
  el.setAttribute('data-probe', '')
  ${Object.entries(attrs).map(([k, v]) => `el.setAttribute(${JSON.stringify(k)}, ${JSON.stringify(v)})`).join('\n  ')}
  if (${JSON.stringify(inlineStyle)}) el.setAttribute('style', ${JSON.stringify(inlineStyle)})
  el.innerHTML = '<span slot="icon">*</span><h3 slot="title">T</h3><p slot="subtitle">S</p><p>Body</p>'
  document.body.appendChild(el)
  await wait(260)

  const scope = el.shadowRoot ?? el
  const root = scope.querySelector('.mono-card') ?? el
  const px = (n, prop) => n ? parseFloat(getComputedStyle(n)[prop]) : null
  const body = scope.querySelector('.mono-card-body')
  const header = scope.querySelector('.mono-card-header')
  const title = scope.querySelector('.card-title')
  const sub = scope.querySelector('.card-subtitle')
  const icon = scope.querySelector('.card-icon')
  const actions = scope.querySelector('.mono-card-actions')

  const out = {
    padding: px(body, 'paddingTop'),
    headerGap: px(header, 'columnGap'),
    titleFont: px(title, 'fontSize'),
    subFont: px(sub, 'fontSize'),
    subGap: px(sub, 'marginTop'),
    iconSize: px(icon, 'width'),
    radius: px(root, 'borderTopLeftRadius'),
    // Measure the .mono-card ROOT, not the host: width is applied there by
    // buildSizeStyle/styleMap, while the host is a plain block filling its parent.
    // Measuring the host makes this assertion pass trivially at any size.
    boxWidth: Math.round(root.getBoundingClientRect().width),
    rootClass: String(root.className || ''),
  }
  el.remove()
  await wait(40)
  return out
})()`

const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } })
await page.goto(`${BASE}/ui/card`, { waitUntil: 'domcontentloaded', timeout: 120000 })
await page.waitForFunction(() => customElements.get('mono-card'), null, { timeout: 240000 })
await page.waitForTimeout(2500)

for (const tag of ['mono-card', 'mono-shadow-card']) {
  if (tag === 'mono-shadow-card') {
    const tabs = await page.evaluate(`(() => {
      const t = [...document.querySelectorAll('button, [role=tab], .tab, label')]
        .filter((n) => /shadow/i.test(n.textContent || ''))
      t.forEach((n) => n.click())
      return t.length
    })()`)
    await page.waitForTimeout(4000)
    if (!(await page.evaluate(`!!customElements.get('mono-shadow-card')`))) {
      ok('shadow: mono-shadow-card registered', false, `clicked ${tabs} tabs`)
      continue
    }
  }

  console.log(`\n  ${tag}\n`)
  const m = {}
  for (const s of STEPS) m[s] = await page.evaluate(MEASURE(tag, { size: s, width: '320px' }))

  // ── 1. the invariant: md === no size class ────────────────────────────────
  // Rendered WITHOUT the size attribute the element still defaults to md, so to
  // test the CSS fallback we strip the class after render.
  const bare = await page.evaluate(`(async () => {
    const wait = (ms) => new Promise((r) => setTimeout(r, ms))
    const el = document.createElement(${JSON.stringify(tag)})
    el.setAttribute('width', '320px')
    el.innerHTML = '<span slot="icon">*</span><h3 slot="title">T</h3><p slot="subtitle">S</p><p>Body</p>'
    document.body.appendChild(el)
    await wait(260)
    const scope = el.shadowRoot ?? el
    const root = scope.querySelector('.mono-card')
    ;[...root.classList].filter((c) => ${JSON.stringify(STEPS)}.includes(c)).forEach((c) => root.classList.remove(c))
    await wait(120)
    const px = (n, p) => n ? parseFloat(getComputedStyle(n)[p]) : null
    const out = {
      padding: px(scope.querySelector('.mono-card-body'), 'paddingTop'),
      headerGap: px(scope.querySelector('.mono-card-header'), 'columnGap'),
      titleFont: px(scope.querySelector('.card-title'), 'fontSize'),
      subFont: px(scope.querySelector('.card-subtitle'), 'fontSize'),
      subGap: px(scope.querySelector('.card-subtitle'), 'marginTop'),
      iconSize: px(scope.querySelector('.card-icon'), 'width'),
      cls: String(root.className || ''),
    }
    el.remove()
    return out
  })()`)

  const KEYS = ['padding', 'headerGap', 'titleFont', 'subFont', 'subGap', 'iconSize']
  const same = KEYS.every((k) => Math.abs(bare[k] - m.md[k]) < 0.5)
  ok(
    `${tag}: size="md" === class-less base (nothing changed for existing cards)`,
    same,
    KEYS.map((k) => `${k} ${bare[k]}/${m.md[k]}`).join(' '),
  )

  // ── 2. md still equals the historical values ──────────────────────────────
  ok(
    `${tag}: md keeps the shipped values (16px pad, 14.4px title, 12.8px sub, 36px icon)`,
    Math.abs(m.md.padding - 16) < 0.5 && Math.abs(m.md.titleFont - 14.4) < 0.5 &&
      Math.abs(m.md.subFont - 12.8) < 0.5 && Math.abs(m.md.iconSize - 36) < 0.5,
    `pad=${m.md.padding} title=${m.md.titleFont} sub=${m.md.subFont} icon=${m.md.iconSize}`,
  )

  // ── 3. strictly monotonic across the scale ────────────────────────────────
  for (const key of KEYS) {
    const vals = STEPS.map((s) => m[s][key])
    const rising = vals.every((v, i) => i === 0 || v > vals[i - 1])
    ok(`${tag}: ${key} increases xs → xxl`, rising, vals.join(' < '))
  }

  // ── 4. size is NOT a dimension ────────────────────────────────────────────
  ok(
    `${tag}: same width="320px" at xs and xxl (size is not a dimension)`,
    m.xs.boxWidth === m.xxl.boxWidth && m.md.boxWidth === 320,
    `xs ${m.xs.boxWidth}px vs xxl ${m.xxl.boxWidth}px (md ${m.md.boxWidth}px, expected 320)`,
  )

  // ── 5. radius belongs to shape, not size ──────────────────────────────────
  const radii = STEPS.map((s) => m[s].radius)
  ok(`${tag}: radius unchanged across the scale`, new Set(radii).size === 1, radii.join(','))
  const shapes = {}
  for (const sh of ['square', 'soft', 'round']) {
    shapes[sh] = (await page.evaluate(MEASURE(tag, { size: 'xs', shape: sh, width: '320px' }))).radius
  }
  ok(
    `${tag}: shape still drives radius at a non-default size`,
    shapes.square < shapes.soft && shapes.soft < shapes.round,
    `square ${shapes.square} < soft ${shapes.soft} < round ${shapes.round}`,
  )

  // ── 6. a user var still beats the size preset ─────────────────────────────
  const overridden = await page.evaluate(
    MEASURE(tag, { size: 'xxl', width: '320px' }, '--mono-card-padding: 3px'),
  )
  ok(
    `${tag}: --mono-card-padding override beats the size preset`,
    Math.abs(overridden.padding - 3) < 0.5,
    `${overridden.padding}px`,
  )
}

await browser.close()
const failed = results.filter((r) => !r.pass)
console.log(`\n  ${results.length - failed.length}/${results.length} passed\n`)
process.exit(failed.length ? 1 : 0)
