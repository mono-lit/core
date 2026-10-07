// Docs accuracy guard: ui/color.md is GENERATED from src/data/theme/presets.json
// by scripts/theme-docs.mjs, so this proves the committed page is what the
// generator produces now — change a preset and the build fails until
// `pnpm theme:build` has been run — and that every colour role a `color` prop
// accepts has a row on it.
//
// Static only — no browser. Takes `{ reporter }` and ignores `page`.

import fs from 'node:fs'
import path from 'node:path'
import { PKG } from './harness.mjs'
import { check, DOC } from '../../scripts/theme-docs.mjs'

const COLOR_TS = path.join(PKG, 'src/composables/color.ts')

/** A `color` prop slot → the token row it paints. */
const ROW_FOR = { danger: 'destructive' }

export async function run({ reporter }) {
  reporter.check('ui/color.md is current (pnpm theme:build)', check(),
    'the page differs from what scripts/theme-docs.mjs renders from presets.json')

  const doc = fs.readFileSync(DOC, 'utf8')
  const tokensSrc = fs.readFileSync(COLOR_TS, 'utf8')
  const declared = [...(tokensSrc.match(/THEME_COLOR_TOKENS\s*=\s*\[([\s\S]*?)\]/)?.[1] ?? '')
    .matchAll(/'([a-z-]+)'/g)].map((m) => m[1])
  const undocumented = declared.filter(
    (s) => !doc.includes(`<div class="color-grid__role">--${ROW_FOR[s] ?? s}</div>`),
  )
  reporter.check(
    `every color slot in THEME_COLOR_TOKENS has a row (${declared.length} slots)`,
    declared.length > 0 && undocumented.length === 0,
    declared.length === 0 ? 'could not read THEME_COLOR_TOKENS' : `missing rows: ${undocumented.join(', ')}`,
  )

  const cells = [...doc.matchAll(
    /<span class="color-chip" style="background:([^"]+)"><\/span>\s*<code>([^<]+)<\/code>/g,
  )]
  const mismatchedChip = cells.filter((m) => m[1].trim() !== m[2].trim())
  reporter.check('every swatch is painted the value printed beside it', mismatchedChip.length === 0,
    mismatchedChip.slice(0, 5).map((m) => `chip=${m[1]} label=${m[2]}`).join(' | '))
  reporter.check(`documented ${cells.length} colour values`, cells.length > 100, `only ${cells.length}`)
}
