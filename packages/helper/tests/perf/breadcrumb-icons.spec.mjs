// Breadcrumb icons must actually render, at the wrapper's size, in every build.
//
// All four element paths were broken at once:
//   - iconify (`item.icon`) overflowed in BOTH builds — UnoCSS's `i-…` sets
//     `width/height: 1.2em` at (0,1,0) and its sheet loads after mono's, so mono's
//     `width: 100%` lost on source order. Measured 15.36px in a 12.8px wrapper.
//   - light + user `slot="icon-<id>"` SVG was INVISIBLE: the capture pass parks the
//     child inside a `[data-mono-slot]` placeholder, making the SVG a grandchild
//     that the `> svg` rule never matched, sized against a 0-width flex item.
//   - shadow + user `slot="icon-<id>"` SVG rendered NOTHING: the icon wrapper is
//     only emitted when the item has an `icon` or a registered slot node, and the
//     shadow build never registered the consumer's light children.
//
// The UnoCSS sheet is generated here with the docs' own preset config, so the
// specificity fight under test is the real one, not an approximation.

import { createRequire } from 'node:module'
import path from 'node:path'
import { PKG } from './harness.mjs'

const ICONS = ['i-mdi-view-dashboard', 'i-mdi-account-group', 'i-mdi-account-circle']

async function iconCss() {
  const require_ = createRequire(path.join(PKG, 'package.json'))
  const uno = await import(
    new URL(`file:///${require_.resolve('unocss').replace(/\\/g, '/')}`)
  )
  const { createGenerator, presetIcons, presetWind4 } = uno.default ?? uno
  const generator = await createGenerator({
    presets: [
      presetWind4({ preflights: { reset: false } }),
      // Mirrors docs/uno.config.ts (repo root).
      presetIcons({
        scale: 1.2,
        extraProperties: { display: 'inline-block', 'vertical-align': 'middle' },
      }),
    ],
  })
  const { css } = await generator.generate(ICONS.join(' '), { preflights: false })
  return css
}

export async function run({ port, page, reporter }) {
  const css = await iconCss()

  reporter.check(
    'UnoCSS actually produced the i-mdi-* rules',
    ICONS.every((c) => css.includes(c)),
    `generated sheet is missing icon rules — the rest of this spec would pass vacuously:\n${css.slice(0, 300)}`,
  )

  await page.goto(`http://127.0.0.1:${port}/?fixture=breadcrumb-icons`, { waitUntil: 'load' })
  // Injected AFTER mono's sheet, exactly as the docs load `virtual:uno.css`.
  await page.addStyleTag({ content: css })
  await page.waitForFunction(() => window.__ready === true, null, { timeout: 60000 })
  await page.waitForTimeout(200)

  const CASES = [
    ['light + item.icon (iconify)', 'l-icon', 3],
    ['light + slotted <svg>', 'l-slot', 2],
    ['shadow + item.icon (iconify)', 's-icon', 3],
    ['shadow + slotted <svg>', 's-slot', 2],
    ['raw CSS markup', 'raw', 2],
  ]

  for (const [name, id, expected] of CASES) {
    const icons = await page.evaluate((i) => window.__iconReport(i), id)

    reporter.check(
      `${name}: renders ${expected} icon wrapper(s)`,
      icons.length === expected,
      `got ${icons.length} — ${JSON.stringify(icons)}`,
    )
    if (icons.length !== expected) continue

    const painted = icons.every((i) => i.tag !== 'NONE' && i.innerW > 0 && i.innerH > 0)
    reporter.check(
      `${name}: every icon paints something with a box`,
      painted,
      JSON.stringify(icons),
    )

    // Fills the wrapper: neither collapsed nor spilling out of its slot.
    const fits = icons.every(
      (i) => Math.abs(i.innerW - i.wrapW) < 0.5 && Math.abs(i.innerH - i.wrapH) < 0.5,
    )
    reporter.check(
      `${name}: every icon fills its wrapper exactly`,
      fits,
      JSON.stringify(icons),
    )
  }
}
