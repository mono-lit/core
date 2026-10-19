// The sidebar root writes an attribute only when a prop differs from its default
// (`sidebarRootAttrs`), so every sidebar.css rule that styles a DEFAULT value must
// also match the ABSENT attribute. Writing `[mono-location="left"]` alone silently
// skipped every default sidebar — the rail chevron never rotated on open, the left
// drawer lost its slide, and the default `elevated` panel drew no shadow.
import { describe, it, expect } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { sidebarRootAttrs } from '../src/components/sidebar/sidebar-utils'

const PKG = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const css = fs.readFileSync(path.join(PKG, 'src/components/sidebar/sidebar.css'), 'utf8')

/** Rule selectors only — comments stripped, declarations dropped. */
const selectors = css
  .replace(/\/\*[\s\S]*?\*\//g, '')
  .split('{')
  .slice(0, -1)
  .map((chunk) => chunk.split('}').pop()!.trim())
  .flatMap((sel) => sel.split(/,(?![^(]*\))/).map((s) => s.trim()))

describe('mono-sidebar default attributes', () => {
  it('a default sidebar writes no mono-location / mono-variant', () => {
    const attrs = sidebarRootAttrs({ mode: 'rail', resolvedMode: 'rail', location: 'left', density: 'comfortable', color: 'surface', variant: 'elevated' })
    expect(attrs.location).toBeNull()
    expect(attrs.variant).toBeNull()
    expect(sidebarRootAttrs({ mode: 'rail', resolvedMode: 'rail', location: 'right', density: 'comfortable', color: 'surface', variant: 'flat' })).toMatchObject({ location: 'right', variant: 'flat' })
  })

  for (const [attr, value] of [['mono-location', 'left'], ['mono-variant', 'elevated']] as const) {
    it(`every [${attr}="${value}"] rule also matches the absent attribute`, () => {
      const explicit = selectors.filter((s) => s.includes(`[${attr}="${value}"]`))
      expect(explicit.length).toBeGreaterThan(0)
      for (const sel of explicit) {
        expect(sel, sel).toContain(`:is(:not([${attr}]), [${attr}="${value}"])`)
      }
    })
  }

  it('the rail chevron rotates on open for the default (left) location', () => {
    const rotate = selectors.filter((s) => s.includes('[mono-open]') && s.includes('[mono-rail-toggle] > :is(.mono-icon, svg)'))
    expect(rotate.some((s) => s.includes(':not([mono-location])'))).toBe(true)
  })
})
