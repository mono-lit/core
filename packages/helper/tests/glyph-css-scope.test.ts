// Static guards on the global stylesheet (`dist/ui/index.css`) and the flavor
// size ladders.
//
// 1. `[mono-glyph]` is a part name several components share (accordion, chip,
//    breadcrumb, menu, file-upload). breadcrumb.css and menu.css once shipped a
//    BARE `[mono-glyph][mono-glyph] { width: 100%; height: 100% }` — doubled on
//    purpose to beat UnoCSS icons — which matched every component's glyph and
//    stretched the accordion's icon chip over its whole header.
// 2. A flavor that retunes ONLY `--mono-accordion-*-md` leaves the component's
//    default xs/sm/lg around it, and md came out shorter than sm with a cliff up
//    to lg. A flavor that sets an md accordion padding must set the whole ladder.
import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const css = readFileSync(resolve(__dirname, '../dist/ui/index.css'), 'utf8')

describe('global stylesheet scoping', () => {
  it('no rule targets a bare [mono-glyph][mono-glyph]', () => {
    // any selector list entry that is exactly the doubled attribute
    const bare = /(^|[,{}]\s*)\[mono-glyph\]\[mono-glyph\]\s*[,{]/m
    expect(bare.test(css)).toBe(false)
  })
})

describe('flavor accordion size ladders', () => {
  const flavors = ['one', 'mira', 'lyra', 'nova']
  const SIZES = ['xs', 'sm', 'lg', 'xl', 'xxl']

  for (const flavor of flavors) {
    it(`${flavor}: an md padding override comes with the rest of the ladder`, () => {
      const src = readFileSync(resolve(__dirname, `../src/data/theme/flavors/${flavor}.css`), 'utf8')
      for (const axis of ['x', 'y']) {
        if (!src.includes(`--mono-accordion-pad-${axis}-md:`)) continue
        for (const size of SIZES) {
          expect(src, `${flavor} --mono-accordion-pad-${axis}-${size}`).toContain(
            `--mono-accordion-pad-${axis}-${size}:`,
          )
        }
      }
    })
  }
})
