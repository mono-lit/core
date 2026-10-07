// `date-filter-tree` — the date filter's data model, pure and DOM-free.
//
// The panel renders what `buildDateTree` builds and hands `minimize()`'s ranges to
// `setColumnFilter`; everything the user sees (which periods exist, their counts,
// what a tick means, what reopening the panel shows ticked) is decided here.

import { describe, expect, it } from 'vitest'
import {
  BLANK_KEY,
  buildDateTree,
  checkState,
  inRange,
  isDateRange,
  minimize,
  parseDateValue,
  periodOf,
  seedFromRanges,
  setAllChecked,
  setChecked,
} from '../src/components/table/date-filter-tree'

const V = (value: unknown, count = 1) => ({ value, count })

describe('parseDateValue', () => {
  it('accepts Date, epoch, ISO, and a bare YYYY-MM-DD as a LOCAL date', () => {
    expect(parseDateValue(new Date(2026, 2, 5))?.getTime()).toBe(new Date(2026, 2, 5).getTime())
    expect(parseDateValue(1_700_000_000_000)?.getTime()).toBe(1_700_000_000_000)
    expect(parseDateValue('2026-03-05T13:05:09')?.getSeconds()).toBe(9)
    const d = parseDateValue('2026-03-05')!
    expect([d.getFullYear(), d.getMonth(), d.getDate(), d.getHours()]).toEqual([2026, 2, 5, 0])
  })
  it('blanks and junk are null', () => {
    expect(parseDateValue(null)).toBeNull()
    expect(parseDateValue('')).toBeNull()
    expect(parseDateValue('not a date')).toBeNull()
    expect(parseDateValue({})).toBeNull()
  })
})

describe('periodOf', () => {
  it('is half-open and rolls over month / year ends', () => {
    const dec = periodOf([2026, 12], 'month')
    expect(dec.from.getTime()).toBe(new Date(2026, 11, 1).getTime())
    expect(dec.to.getTime()).toBe(new Date(2027, 0, 1).getTime())
    const lastSec = periodOf([2026, 12, 31, 23, 59, 59], 'second')
    expect(lastSec.to.getTime()).toBe(new Date(2027, 0, 1).getTime())
  })
})

describe('buildDateTree', () => {
  const values = [
    V('2026-03-05T13:05:09', 2),
    V('2026-03-05T13:05:30', 1),
    V('2026-03-20T08:00:00', 4),
    V('2026-07-01', 3),
    V('2025-12-31T23:59:59', 5),
    V(null, 7),
  ]

  it('folds timestamps into years → months → … with summed counts, chronological, blanks first', () => {
    const tree = buildDateTree(values, { depth: 'second' })
    expect(tree.map((n) => n.key)).toEqual([BLANK_KEY, '2025', '2026'])
    expect(tree[0].count).toBe(7)
    expect(tree[0].children).toEqual([])
    const y26 = tree[2]
    expect(y26.count).toBe(10)
    expect(y26.children.map((m) => m.label)).toEqual(['March', 'July'])
    const mar = y26.children[0]
    expect(mar.count).toBe(7)
    expect(mar.children.map((d) => d.parts[2])).toEqual([5, 20])
    const d5 = mar.children[0]
    // 13:05:09 ×2 and 13:05:30 ×1 → one hour, one minute, two seconds
    expect(d5.children.length).toBe(1)
    expect(d5.children[0].children.length).toBe(1)
    expect(d5.children[0].children[0].children.map((s) => s.label)).toEqual(['13:05:09', '13:05:30'])
    expect(d5.children[0].children[0].children[0].count).toBe(2)
  })

  it('stops at month by default', () => {
    const tree = buildDateTree(values)
    expect(tree[2].children.map((m) => m.label)).toEqual(['March', 'July'])
    expect(tree[2].children[0].children).toEqual([])
  })

  it('stops at `depth`', () => {
    const tree = buildDateTree(values, { depth: 'day' })
    const d5 = tree[2].children[0].children[0]
    expect(d5.level).toBe('day')
    expect(d5.children).toEqual([])
    expect(d5.count).toBe(3)
  })

  it('a node period is its whole span', () => {
    const tree = buildDateTree(values, { depth: 'month' })
    const mar = tree[2].children[0]
    expect(mar.from!.getTime()).toBe(new Date(2026, 2, 1).getTime())
    expect(mar.to!.getTime()).toBe(new Date(2026, 3, 1).getTime())
  })

  it('utc reads the parts in UTC', () => {
    const t = buildDateTree([V('2026-01-01T00:30:00Z')], { depth: 'day', utc: true })
    expect(t[0].children[0].children[0].parts).toEqual([2026, 1, 1])
  })
})

describe('tri-state ticks', () => {
  const tree = buildDateTree([
    V('2026-03-05', 1),
    V('2026-03-20', 1),
    V('2026-07-01', 1),
  ], { depth: 'day' })
  const y = tree[0]
  const mar = y.children[0]
  const jul = y.children[1]
  const d5 = mar.children[0]
  const d20 = mar.children[1]

  it('ticking a parent ticks the whole subtree; a fully ticked set collapses upward', () => {
    let c = setChecked(mar, true, new Set(), tree)
    expect(checkState(mar, c)).toBe('on')
    expect(checkState(d5, c)).toBe('off') // no ancestor context…
    expect(checkState(d5, c, tree)).toBe('on') // …with it, the ticked month covers the day
    expect(checkState(y, c)).toBe('mixed')
    c = setChecked(jul, true, c, tree)
    expect(checkState(y, c)).toBe('on')
    expect(c.has(y.key)).toBe(true) // collapsed to the year
  })

  it('unticking one child of a ticked parent keeps the siblings', () => {
    let c = setChecked(y, true, new Set(), tree)
    c = setChecked(d5, false, c, tree)
    expect(checkState(d5, c)).toBe('off')
    expect(checkState(d20, c, tree)).toBe('on')
    expect(checkState(mar, c)).toBe('mixed')
    expect(checkState(jul, c)).toBe('on')
    expect(checkState(y, c)).toBe('mixed')
  })

  it('setAllChecked ticks every root or nothing', () => {
    expect(checkState(y, setAllChecked(tree, true))).toBe('on')
    expect(checkState(y, setAllChecked(tree, false))).toBe('off')
  })

  it('minimize emits one range per fully ticked node, walking down only where partial', () => {
    const whole = minimize(tree, setChecked(y, true, new Set(), tree))
    expect(whole).toHaveLength(1)
    expect(whole[0]!.from.getTime()).toBe(new Date(2026, 0, 1).getTime())
    expect(whole[0]!.to.getTime()).toBe(new Date(2027, 0, 1).getTime())

    let c = setChecked(d5, true, new Set(), tree)
    c = setChecked(jul, true, c, tree)
    const partial = minimize(tree, c)
    expect(partial.map((r) => [r!.from.getDate(), r!.from.getMonth()])).toEqual([[5, 2], [1, 6]])
    // day 5 → one day; July → the whole month
    expect(partial[1]!.to.getTime()).toBe(new Date(2026, 7, 1).getTime())
  })

  it('seedFromRanges round-trips minimize, and ticks blanks for a null value', () => {
    const t2 = buildDateTree([V('2026-03-05'), V('2026-03-20'), V(null, 2)], { depth: 'day' })
    let c = setChecked(t2[1].children[0].children[0], true, new Set(), t2)
    c = setChecked(t2[0], true, c, t2) // blanks
    const ranges = minimize(t2, c)
    expect(ranges).toContainEqual(null)
    const seeded = seedFromRanges(t2, ranges)
    expect(seeded.has(BLANK_KEY)).toBe(true)
    expect(checkState(t2[1].children[0].children[0], seeded)).toBe('on')
    expect(checkState(t2[1].children[0].children[1], seeded)).toBe('off')
    // A range covering the whole month seeds the month, not its days.
    const monthOnly = seedFromRanges(t2, [{ from: new Date(2026, 2, 1), to: new Date(2026, 3, 1) }])
    expect(monthOnly.has('2026-3')).toBe(true)
  })
})

describe('range helpers', () => {
  it('isDateRange / inRange', () => {
    expect(isDateRange({ from: new Date(), to: new Date() })).toBe(true)
    expect(isDateRange({ from: '2026-01-01', to: '2026-02-01' })).toBe(true)
    expect(isDateRange('2026-01-01')).toBe(false)
    expect(isDateRange({ from: 1, to: 2 })).toBe(false)
    const r = { from: new Date(2026, 2, 1), to: new Date(2026, 3, 1) }
    expect(inRange(new Date(2026, 2, 31, 23, 59, 59), r)).toBe(true)
    expect(inRange(new Date(2026, 3, 1), r)).toBe(false)
  })
})
