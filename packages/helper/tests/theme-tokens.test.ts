// @vitest-environment node
//
// The generated token layer's invariants.
//
// `scripts/theme-build.mjs` turns presets.json + the vendored Basecoat base.css
// into generated/{tokens,presets,legacy}.css. This spec pins the rules that make
// the layer safe to consume from both the light and the shadow build:
//   - the committed output is what the generator produces now;
//   - every Basecoat token exists in our :root AND .dark (TweakCN themes drop in);
//   - every colour role carries a `-foreground` in every preset x both modes;
//   - a token whose value contains var() lives on the SCOPES rule, never only
//     on :root (it would go stale under a .theme-color-* / .dark class);
//   - legacy.css still declares every pre-Basecoat --theme-* name (until 3.0);
//   - no component sheet declares a bare token or a dark-mode SELECTOR.
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import postcss from 'postcss'
import { describe, expect, it } from 'vitest'
import { build, check } from '../scripts/theme-build.mjs'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const THEME = path.join(root, 'src', 'data', 'theme')
const read = (rel: string) => fs.readFileSync(path.join(THEME, rel), 'utf8')

/** `{ selector: { prop: value } }` for every rule, nested at-rules flattened. */
function rules(css: string): Record<string, Record<string, string>> {
  const out: Record<string, Record<string, string>> = {}
  postcss.parse(css).walkRules((r) => {
    const sel = r.selector.replace(/\s+/g, ' ').trim()
    out[sel] ??= {}
    r.each((d) => { if (d.type === 'decl') out[sel][d.prop] = d.value })
  })
  return out
}

const DARK_ROOT = ':is(html, body, .mono-theme).dark'
const SCOPES = `:where(:root, ${DARK_ROOT}, [class*="theme-"], .mono-theme)`
const DARK_SCOPES = `:where(${DARK_ROOT}, ${DARK_ROOT} [class*="theme-"], ${DARK_ROOT} .mono-theme)`
const ROLES = ['primary', 'destructive', 'success', 'warning', 'info', 'teal', 'purple', 'neutral', 'dark']

describe('generated token layer', () => {
  it('committed generated/*.css is current', () => {
    expect(check()).toEqual([])
  })

  const tokens = rules(read('generated/tokens.css'))
  const presets = rules(read('generated/presets.css'))
  const legacy = rules(read('generated/legacy.css'))
  const vendor = rules(read('vendor/basecoat/base/base.css'))

  it('every Basecoat :root token exists in our :root and .dark', () => {
    const ours = { ...tokens[':root'], ...tokens[SCOPES] }
    const dark = { ...tokens[DARK_ROOT], ...tokens[SCOPES], ...tokens[DARK_SCOPES] }
    const missingLight = Object.keys(vendor[':root']).filter((k) => !(k in ours))
    const missingDark = Object.keys(vendor['.dark']).filter((k) => !(k in dark) && !(k in tokens[':root']))
    expect(missingLight).toEqual([])
    expect(missingDark).toEqual([])
  })

  it('every colour role has a -foreground in every preset, both modes', () => {
    const { names } = build()
    const problems: string[] = []
    for (const name of names) {
      for (const sel of [`.theme-color-${name}`, `.theme-color-${name}:is(${DARK_ROOT}, ${DARK_ROOT} *)`]) {
        const block = presets[sel]
        expect(block, sel).toBeTruthy()
        for (const role of ROLES) {
          if (!block[`--${role}`]) problems.push(`${sel} lacks --${role}`)
          if (!block[`--${role}-foreground`]) problems.push(`${sel} lacks --${role}-foreground`)
        }
      }
    }
    expect(problems).toEqual([])
  })

  it('var()-bearing tokens never live only on :root / .dark', () => {
    const stale: string[] = []
    for (const [sel, decls] of Object.entries({ ...tokens, ...legacy })) {
      if (sel !== ':root' && sel !== DARK_ROOT) continue
      for (const [prop, value] of Object.entries(decls)) {
        if (/var\(|color-mix\(/.test(value)) stale.push(`${sel} ${prop}`)
      }
    }
    expect(stale).toEqual([])
  })

  it('legacy.css still declares every pre-Basecoat --theme-* name', () => {
    const snapshot: string[] = JSON.parse(
      fs.readFileSync(path.join(root, 'tests', 'fixtures', 'theme-legacy-tokens.json'), 'utf8'),
    )
    // `--mono-icon-*` were never legacy — they moved to tokens.css and stay.
    const declared = new Set<string>()
    for (const sheet of [legacy, tokens]) {
      for (const decls of Object.values(sheet)) for (const prop of Object.keys(decls)) declared.add(prop)
    }
    const missing = snapshot.filter((name) => !declared.has(name))
    expect(missing).toEqual([])
  })

  it('component sheets declare no bare tokens and no dark-mode selectors', () => {
    const dir = path.join(root, 'src', 'components')
    const problems: string[] = []
    const walk = (d: string) => {
      for (const e of fs.readdirSync(d, { withFileTypes: true })) {
        const full = path.join(d, e.name)
        if (e.isDirectory()) walk(full)
        else if (e.name.endsWith('.css')) {
          const css = fs.readFileSync(full, 'utf8')
          const rel = path.relative(root, full)
          postcss.parse(css).walkRules((r) => {
            // `.dark` as a MODE selector: `html.dark …`, `body.dark …`, or a bare
            // `.dark` with descendants. `.mono-card.dark` / `:is(…, .dark)` are the
            // colour class and are fine.
            if (/(html|body)\.dark\b|(^|[\s,(>])\.dark\s+[^,)]/.test(r.selector)) {
              problems.push(`${rel}: dark-mode selector "${r.selector}" (use --mono-mode-* tokens)`)
            }
            r.each((decl) => {
              if (decl.type !== 'decl') return
              if (/^--(primary|secondary|background|foreground|card|popover|muted|accent|destructive|border|input|ring|radius|mono-spacing|mono-text-|mono-radius-|mono-shadow-|mono-mode-)/.test(decl.prop)) {
                problems.push(`${rel}: declares token ${decl.prop} (token layer only)`)
              }
            })
          })
        }
      }
    }
    walk(dir)
    expect(problems).toEqual([])
  })
})
