// Source-level invariants of the button-dropdown port. The attribute emission
// itself is asserted in tests/perf/button-dropdown-attributes.spec.mjs — the
// root's attributes are applied imperatively from a ref, and the light build's
// entries are real elements built with `document.createElement`, neither of
// which happens under vitest's jsdom (lit resolves its node build, `isServer`).
import { describe, it, expect } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const PKG = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const dir = path.join(PKG, 'src/components/button')
const css = fs.readFileSync(path.join(dir, 'button-dropdown.css'), 'utf8')
const buttonCss = fs.readFileSync(path.join(dir, 'button.css'), 'utf8')
const core = fs.readFileSync(path.join(dir, 'button-dropdown-core.ts'), 'utf8')

/** The ten roles an entry's `color` can take. */
const ROLES = [
  'primary',
  'secondary',
  'success',
  'danger',
  'warning',
  'info',
  'teal',
  'purple',
  'dark',
  'light',
]

describe('mono-button-dropdown port invariants', () => {
  it('every entry role has a mono-item-color rule', () => {
    for (const role of ROLES) {
      expect(css, `[mono-item-color="${role}"] is styled`).toContain(
        `[mono-item][mono-item-color="${role}"]`,
      )
    }
  })

  it('the surface roles ink with a foreground, so they flip with the mode', () => {
    // `--dark` is a fill paired with `--dark-foreground`: a near-black in light
    // mode and still a dark grey in dark mode. Inking a row with it made that row
    // invisible on a dark popover.
    expect(css).toContain('--_mono-bd-dark: var(--mono-button-dropdown-dark, var(--foreground))')
    expect(css).toContain('--_mono-bd-light: var(--mono-button-dropdown-light, var(--foreground))')
    expect(css).toContain(
      '--_mono-bd-secondary: var(--mono-button-dropdown-secondary, var(--secondary-foreground))',
    )
  })

  it('a coloured row never gets the role as a solid fill', () => {
    // The bug this rule exists for: `color: 'success'` used to paint the row
    // solid green AND tint its check glyph green — the glyph vanished. Every
    // role's hover background must be a `color-mix` wash of the role, never the
    // role itself, and the ink must stay the role at full strength.
    for (const role of ROLES) {
      const block = new RegExp(
        `\\[mono-item\\]\\[mono-item-color="${role}"\\] \\{\\n([\\s\\S]*?)\\n\\}`,
      ).exec(css)
      expect(block, `${role} has a block`).not.toBeNull()
      const body = (block as RegExpExecArray)[1]
      const hover = /--_mono-bd-item-hover-bg-preset:\s*([^;]+);/.exec(body)
      // secondary / light / dark are surfaces: no hue to wash with, so they
      // inherit the neutral `--accent` hover and only re-point the ink.
      if (role === 'secondary' || role === 'light' || role === 'dark') {
        expect(hover, `${role} keeps the neutral wash`).toBeNull()
      } else {
        expect(hover, `${role} sets a hover wash`).not.toBeNull()
        expect((hover as RegExpExecArray)[1]).toContain('color-mix(in oklab')
        expect((hover as RegExpExecArray)[1]).toContain('var(--mono-mode-tint)')
      }
      expect(body).toContain(`--_mono-bd-item-color-preset: var(--_mono-bd-${role})`)
    }
  })

  it('the menu flattens the entry through the button PUBLIC knobs', () => {
    // A selector cannot reach the control in the shadow build; an inherited
    // custom property can. Reaching for `--_mono-button-*` (the resolved
    // private) is what silently stopped working when button.css was ported.
    const block = /:where\(\[mono-button-dropdown\]\) \[mono-item\] \{\n([\s\S]*?)\n\}/.exec(css)
    expect(block, 'the item block exists').not.toBeNull()
    const body = (block as RegExpExecArray)[1]
    for (const knob of [
      '--mono-button-bg',
      '--mono-button-color',
      '--mono-button-border-color',
      '--mono-button-shadow',
      '--mono-button-hover-bg',
      '--mono-button-hover-color',
      '--mono-button-radius',
      '--mono-button-width',
      '--mono-button-justify',
      '--mono-button-press-translate',
    ]) {
      expect(body, `${knob} is set on the row`).toContain(`${knob}:`)
    }
    expect(body, 'never the resolved private').not.toContain('--_mono-button-')
  })

  it('button.css reads the three knobs the menu row drives', () => {
    // They exist FOR this component; a rename there would flatten nothing here.
    expect(buttonCss).toContain('--_mono-button-width: var(--mono-button-width, auto)')
    expect(buttonCss).toContain('--_mono-button-justify: var(--mono-button-justify, center)')
    expect(buttonCss).toContain(
      '--_mono-button-press-translate: var(--mono-button-press-translate, 0 1px)',
    )
    expect(buttonCss).toContain('width: var(--_mono-button-width)')
    expect(buttonCss).toContain('justify-content: var(--_mono-button-justify)')
    expect(buttonCss).toContain('translate: var(--_mono-button-press-translate)')
  })

  it('the CSS offset default is the same 4px the `offset` prop defaults to', () => {
    expect(css).toContain('--mono-button-dropdown-offset-md, var(--mono-spacing)')
    expect(core).toMatch(/\n\s*offset = 4\b/)
  })

  it('the static placement default matches the `placement` default', () => {
    // `bottom-end`, unlike mono-dropdown's `bottom-start`: a row of actions
    // hangs off the right. The `:not([mono-align])` arm must be the `end` one.
    expect(core).toMatch(/placement: DropdownPlacement = 'bottom-end'/)
    expect(css).toContain(
      ':is(:not([mono-align]), [mono-align="end"]):not([mono-fixed]) > [mono-panel]',
    )
  })

  it('BUTTON_DROPDOWN_STYLE_VARS lists every public knob the sheet reads', () => {
    // A portaled panel is a child of <body>, so it inherits none of the
    // component's custom properties, and getComputedStyle cannot enumerate them
    // for the portal to copy blindly — the core names them instead.
    const listed = new Set(
      [...(core.match(/'--mono-button-dropdown-[a-z0-9-]+'/g) ?? [])].map((q) => q.slice(1, -1)),
    )
    // comments out first: the header writes knob FAMILIES (`-item-<x>`), which
    // are prose, not names
    const declarations = css.replace(/\/\*[\s\S]*?\*\//g, '')
    const used = new Set(declarations.match(/--mono-button-dropdown-[a-z0-9-]+/g) ?? [])
    const missing = [...used].filter((n) => !listed.has(n)).sort()
    expect(missing, 'add these to BUTTON_DROPDOWN_STYLE_VARS').toEqual([])
  })

  it('the panel joins the shared scrollbar design', () => {
    // It caps at the room the portal measured and scrolls; without this it would
    // wear the platform scrollbar while every other popup wears ours.
    const scrollbar = fs.readFileSync(path.join(PKG, 'src/data/theme/scrollbar.css'), 'utf8')
    const lists = scrollbar.match(/:where\(\[mono-dropdown\]\) > \[mono-panel\]/g) ?? []
    const ours = scrollbar.match(/:where\(\[mono-button-dropdown\]\) > \[mono-panel\]/g) ?? []
    expect(ours.length, 'one entry per selector list').toBe(lists.length)
  })
})
