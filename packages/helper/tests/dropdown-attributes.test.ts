// The two source-level invariants of the dropdown port. The attribute emission
// itself is asserted in tests/perf/dropdown-attributes.spec.mjs — the light build
// applies the root's class and attributes imperatively behind an `isServer`
// guard, and lit's `isServer` is TRUE under vitest's jsdom (it resolves lit's
// node build), so nothing would be applied here.
import { describe, it, expect } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const PKG = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const css = fs.readFileSync(path.join(PKG, 'src/components/dropdown/dropdown.css'), 'utf8')

describe('mono-dropdown port invariants', () => {
  it('the root rule paints nothing — [mono-dropdown] is also a field panel part', () => {
    // select / tag-input / date / dropdown-table all name their popup panel
    // `[mono-dropdown]`, scoped `[mono-<field>] > [mono-dropdown]` = (0,2,0).
    // This rule is (0,1,0), so it loses wherever they set a property — and it
    // must set NO paint, so nothing it does set can reach their panels visibly.
    const block = /\n\[mono-dropdown\] \{\n([\s\S]*?)\n\}/.exec(css)
    expect(block, 'the unqualified root block exists').not.toBeNull()
    const props = (block as RegExpExecArray)[1]
      .replace(/\/\*[\s\S]*?\*\//g, '')
      .split(';')
      .map((d) => d.trim())
      .filter(Boolean)
      .map((d) => d.slice(0, d.indexOf(':')).trim())
      .filter((p) => p && !p.startsWith('--'))
    expect(props.sort()).toEqual(['box-sizing', 'display', 'font-family', 'position'])
  })

  it('the CSS offset default is the same 4px the `offset` prop defaults to', () => {
    // One gap, two routes: the element positions from the prop, hand-written
    // markup from the custom property. They drifted (8px vs 4px) and the two
    // builds sat at different distances from the trigger.
    expect(css).toContain('--mono-dropdown-offset-md, var(--mono-spacing)')
    const core = fs.readFileSync(path.join(PKG, 'src/components/dropdown/dropdown-core.ts'), 'utf8')
    expect(core).toMatch(/\n\s*offset = 4\b/)
  })

  it('DROPDOWN_STYLE_VARS lists every public knob the sheet reads', () => {
    // A portaled panel is a child of <body>, so it inherits none of the
    // component's custom properties, and getComputedStyle cannot enumerate
    // them for the portal to copy blindly — the core names them instead. A knob
    // added to the sheet and not to that list silently stops working when the
    // panel is portaled (the light build's default).
    const core = fs.readFileSync(path.join(PKG, 'src/components/dropdown/dropdown-core.ts'), 'utf8')
    const listed = new Set(
      [...(core.match(/'--mono-dropdown-[a-z0-9-]+'/g) ?? [])].map((q) => q.slice(1, -1)),
    )
    const used = new Set(css.match(/--mono-dropdown-[a-z0-9-]+/g) ?? [])
    const missing = [...used].filter((n) => !listed.has(n)).sort()
    expect(missing, 'add these to DROPDOWN_STYLE_VARS').toEqual([])
  })
})
