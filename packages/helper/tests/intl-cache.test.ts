import { describe, expect, it } from 'vitest'
import { collator, dateTimeFormat, numberFormat } from '../src/utils/intl-cache'

describe('intl-cache', () => {
  it('reuses one instance per (locale, options)', () => {
    expect(numberFormat('id-ID')).toBe(numberFormat('id-ID'))
    expect(numberFormat(undefined, { maximumFractionDigits: 2 })).toBe(numberFormat(undefined, { maximumFractionDigits: 2 }))
    expect(numberFormat('id-ID')).not.toBe(numberFormat('en-US'))
    expect(numberFormat(undefined, { maximumFractionDigits: 2 })).not.toBe(numberFormat(undefined, { maximumFractionDigits: 1 }))
    expect(collator(undefined, { numeric: true })).toBe(collator(undefined, { numeric: true }))
    expect(dateTimeFormat('en-US', { month: 'long' })).toBe(dateTimeFormat('en-US', { month: 'long' }))
  })

  it('formats exactly as the uncached calls', () => {
    for (const n of [0, -1, 1234567.891, 0.5, 1e12]) {
      expect(numberFormat().format(n)).toBe(n.toLocaleString())
      expect(numberFormat('id-ID').format(n)).toBe(n.toLocaleString('id-ID'))
      const opts = { minimumFractionDigits: 2, maximumFractionDigits: 2 }
      expect(numberFormat(undefined, opts).format(n)).toBe(n.toLocaleString(undefined, opts))
    }
    const words = ['item 10', 'item 9', 'Item 2', 'b', 'a']
    const viaCollator = [...words].sort(collator(undefined, { numeric: true }).compare)
    const viaLocaleCompare = [...words].sort((a, b) => a.localeCompare(b, undefined, { numeric: true }))
    expect(viaCollator).toEqual(viaLocaleCompare)
    const d = new Date(Date.UTC(2026, 10, 18))
    const o = { month: 'long', timeZone: 'UTC' } as const
    expect(dateTimeFormat('en-US', o).format(d)).toBe(new Intl.DateTimeFormat('en-US', o).format(d))
  })

  it('throws like the constructor for bad options', () => {
    expect(() => numberFormat('en-US', { style: 'currency' } as Intl.NumberFormatOptions)).toThrow(TypeError)
  })
})
