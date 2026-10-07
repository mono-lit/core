// The font override contract (scripts/font-sheets.mjs header):
//   - every theme declares its family THROUGH --mono-font-sans / --mono-font-mono,
//   - no theme or component ever SETS those hooks (only a font sheet does, on :root),
//   - every font sheet sets the hook of its kind.
// Break any of the three and an imported font sheet stops winning over a theme.
import { readdirSync, readFileSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import { FONT_SHEETS, fontOverrideRule } from '../scripts/font-sheets.mjs'

const root = path.resolve(__dirname, '..')
const read = (p: string) => readFileSync(path.join(root, p), 'utf8')

function cssFiles(dir: string): string[] {
  const out: string[] = []
  for (const e of readdirSync(path.join(root, dir), { withFileTypes: true })) {
    const p = path.join(dir, e.name)
    if (e.isDirectory()) {
      if (e.name !== 'vendor') out.push(...cssFiles(p))
    } else if (e.name.endsWith('.css')) out.push(p)
  }
  return out
}

/** Every `--font-sans:` / `--font-mono:` declaration value in a sheet (comments stripped). */
function familyDecls(css: string, prop: 'sans' | 'mono'): string[] {
  const clean = css.replace(/\/\*[\s\S]*?\*\//g, '')
  return [...clean.matchAll(new RegExp(`--font-${prop}\\s*:\\s*([^;]+);`, 'g'))].map((m) => m[1].trim())
}

describe('font override hooks', () => {
  const themeSheets = ['src/data/theme/flavors/one.css', 'src/data/theme/flavors/_vega-base.css', 'src/data/theme/generated/tokens.css']

  it('every theme family reads the hook first', () => {
    for (const f of themeSheets) {
      const css = read(f)
      for (const v of familyDecls(css, 'sans')) expect(v, f).toMatch(/^var\(--mono-font-sans,/)
      for (const v of familyDecls(css, 'mono')) expect(v, f).toMatch(/^var\(--mono-font-mono,/)
    }
    expect(familyDecls(read('src/data/theme/flavors/one.css'), 'sans')[0]).toContain('"Poppins"')
  })

  it('no theme or component sets the hooks itself', () => {
    for (const f of [...cssFiles('src/data/theme'), ...cssFiles('src/components')]) {
      const clean = read(f).replace(/\/\*[\s\S]*?\*\//g, '')
      expect(clean, f).not.toMatch(/--mono-font-(sans|mono)\s*:/)
    }
  })

  it('ships Poppins, Geist, Inter and Geist Mono, and every sheet sets the hook of its kind', () => {
    expect(FONT_SHEETS.inter).toEqual({ spec: 'Inter:400;500;600;700', kind: 'sans' })
    expect(FONT_SHEETS.geist).toEqual({ spec: 'Geist:400;500;600;700', kind: 'sans' })
    expect(FONT_SHEETS['geist-mono']).toEqual({ spec: 'Geist Mono:400;500', kind: 'mono' })
    // DM Mono is a docs-only font (the VitePress demos load it themselves) — never shipped.
    expect(Object.keys(FONT_SHEETS)).not.toContain('dm-mono')
    for (const [name, { spec, kind }] of Object.entries(FONT_SHEETS)) {
      const rule = fontOverrideRule(spec.split(':')[0], kind)
      expect(rule, name).toMatch(new RegExp(`^:root \\{\\n  --mono-font-${kind}: "${spec.split(':')[0]}", `))
    }
  })
})
