// @vitest-environment node
//
// scripts/split-is-selectors.mjs — the build step that turns `:is([mono-x],.mono-x)` into a
// plain selector list so the browser can bucket each rule (see the script's header for the
// measured style-recalc win). Every case below is about NOT changing what the CSS means.
import { describe, it, expect } from 'vitest'
// @ts-expect-error — a plain .mjs build helper, no declarations
import { splitIsInSelectorList, splitIsSelectors, MAX_SELECTORS } from '../scripts/split-is-selectors.mjs'

const split = (s: string): string[] => splitIsInSelectorList(s)

describe('splitIsInSelectorList', () => {
  it('splits the legacy-alias shape, keeping what surrounds it', () => {
    expect(split(':is([mono-table],.mono-table) td')).toEqual(['[mono-table] td', '.mono-table td'])
    expect(split('.a > :is([mono-x],.mono-x)::before')).toEqual(['.a > [mono-x]::before', '.a > .mono-x::before'])
  })

  it('expands every top-level :is() (cartesian), in source order', () => {
    expect(split(':is([a],.a) :is([b],.b)')).toEqual(['[a] [b]', '[a] .b', '.a [b]', '.a .b'])
  })

  it('keeps the other selectors of the list and their order', () => {
    expect(split('.x, :is([a],.a), .y')).toEqual(['.x', '[a]', '.a', '.y'])
  })

  it('splits compounded tags only where a tag may stand', () => {
    expect(split(':is(button, a) .x')).toEqual(['button .x', 'a .x'])
    expect(split('.p > :is(button, a)')).toEqual(['.p > button', '.p > a'])
    // `[x]button` would be invalid — leave it.
    expect(split('[x]:is(button, a)')).toEqual(['[x]:is(button, a)'])
    // A class arg can attach anywhere.
    expect(split('[x]:is(.a, [b])')).toEqual(['[x].a', '[x][b]'])
  })

  it('never splits when the weights differ (the cascade would change)', () => {
    expect(split(':is(svg, .mono-icon, [mono-icon])')).toEqual([':is(svg, .mono-icon, [mono-icon])'])
    expect(split(':is(.a.b, .c)')).toEqual([':is(.a.b, .c)'])
  })

  it('never splits arguments that are not simple compounds', () => {
    expect(split(':is(.a:hover, .b)')).toEqual([':is(.a:hover, .b)'])
    expect(split(':is(.a .b, .c)')).toEqual([':is(.a .b, .c)'])
    expect(split(':is(#a, #b)')).toEqual([':is(#a, #b)'])
    expect(split(':is(.a\\:b, .c)')).toEqual([':is(.a\\:b, .c)'])
  })

  it('leaves :is() nested inside another function alone (a list there changes the meaning)', () => {
    expect(split('.x:not(:is([a],.a))')).toEqual(['.x:not(:is([a],.a))'])
    expect(split('.x:has(:is([a],.a))')).toEqual(['.x:has(:is([a],.a))'])
  })

  it('still splits a later :is() when an earlier one is not splittable', () => {
    expect(split(':is(svg, .i) :is([a],.a)')).toEqual([':is(svg, .i) [a]', ':is(svg, .i) .a'])
  })

  it('never touches :where()', () => {
    expect(split(':where([a],.a) td')).toEqual([':where([a],.a) td'])
  })

  it('keeps value attributes (with quotes and commas) intact', () => {
    expect(split(':is([mono-dd-region="body"],.mono-dd-body) td')).toEqual([
      '[mono-dd-region="body"] td',
      '.mono-dd-body td',
    ])
    expect(split('[data-x="a,b"] :is([a],.a)')).toEqual(['[data-x="a,b"] [a]', '[data-x="a,b"] .a'])
  })

  it('stops expanding at MAX_SELECTORS', () => {
    const sel = Array.from({ length: 7 }, (_, i) => `:is([a${i}],.a${i})`).join(' ')
    const out = split(sel)
    expect(out.length).toBeLessThanOrEqual(MAX_SELECTORS)
    expect(out.some((s) => s.includes(':is('))).toBe(true)
  })
})

describe('splitIsSelectors (whole sheet)', () => {
  it('rewrites only rule selectors and leaves declarations, at-rules and comments as written', () => {
    const css = `/* keep */
@media (min-width: 1px) {
  :is([mono-table],.mono-table) td { color: red; --x: ":is(a,b)" }
}
.k { content: ":is([a],.a)" }
.n { &:is([a],.a) { color: blue } }
`
    const { css: out, rules } = splitIsSelectors(css)
    expect(rules).toBe(2)
    expect(out).toContain('/* keep */')
    expect(out).toContain('[mono-table] td,.mono-table td { color: red; --x: ":is(a,b)" }')
    expect(out).toContain('.k { content: ":is([a],.a)" }')
    expect(out).toContain('&[a],&.a { color: blue }')
  })
})
