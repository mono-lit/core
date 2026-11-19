import { describe, expect, it } from 'vitest'
import { createHelpers } from '../src/export/helpers'
import { extractDirectives } from '../src/export/sentinel'

// Regression: 0.1.2 named the `formatting.numberFormat` string `numberFormat`, shadowing the
// intl-cache `numberFormat()` — every `{{number}}` / `{{currency}}` / `{{percent}}` threw
// "numberFormat is not a function" (minified: "a is not a function").
describe('export formatting helpers', () => {
  const helpers = createHelpers({ locale: 'id-ID', currency: 'IDR', numberFormat: '#,##0;[Red]-#,##0;0' })

  it('{{number}} renders with Intl and carries the Excel numberFormat', () => {
    const out = String(helpers.number!(1234567, { hash: {} }))
    const { text, directives } = extractDirectives(out)
    expect(text).toBe((1234567).toLocaleString('id-ID'))
    expect(directives[0]).toMatchObject({ k: 'val', n: 1234567, f: '#,##0;[Red]-#,##0;0' })
  })

  it('{{number decimals=2}} derives its own format', () => {
    const { directives } = extractDirectives(String(helpers.number!(1.5, { hash: { decimals: 2 } })))
    expect(directives[0]).toMatchObject({ n: 1.5, f: '#,##0.00' })
  })

  it('{{currency}} and {{percent}} do not throw', () => {
    expect(() => helpers.currency!(1000, { hash: {} })).not.toThrow()
    expect(() => helpers.percent!(0.155, { hash: {} })).not.toThrow()
  })
})
