// `grouped` — the pure band maths (`components/table/grouped-bands.ts`): config
// resolution, cutting ordered rows into nested bands, collapse, and the virtual
// window's slot ↔ row bookkeeping (whose heights must always add up, or the rows
// jump when a band enters / leaves the window).

import { describe, expect, it } from 'vitest'
import {
  groupedWindow,
  buildGrouped,
  groupedSignature,
  normalizeGrouped,
  rowToSlot,
  slotToRow,
} from '../src/components/table/grouped-bands'

type Row = { Id: number; Brand: string | null; Code: string }
const rows: Row[] = [
  { Id: 1, Brand: 'A', Code: 'x' },
  { Id: 2, Brand: 'A', Code: 'x' },
  { Id: 3, Brand: 'A', Code: 'y' },
  { Id: 4, Brand: 'B', Code: 'y' },
  { Id: 5, Brand: 'B', Code: 'y' },
  { Id: 6, Brand: null, Code: 'z' },
]
const fields = normalizeGrouped<Row>({ fields: ['Brand', 'Code'] })!.fields

describe('normalizeGrouped', () => {
  it('resolves strings, defaults and `order`', () => {
    const cfg = normalizeGrouped({
      fields: [{ field: 'Code', order: 2, count: false }, 'Brand', { field: 'Dept', order: 0 }],
    })!
    expect(cfg.fields.map((f) => f.field)).toEqual(['Dept', 'Brand', 'Code'])
    expect(cfg.fields.map((f) => f.level)).toEqual([0, 1, 2])
    expect(cfg.chunk).toBe(100)
    expect(cfg.collapsible).toBe(true)
    const code = cfg.fields[2]!
    expect(code.count).toBe(false)
    expect(code.variant).toBe('tonal')
    expect(code.color).toBe('primary')
  })

  it('takes a per-field collapsible over the table-level one, and a chunk', () => {
    const cfg = normalizeGrouped({ fields: ['A', { field: 'B', collapsible: true }], collapsible: false, chunk: 250 })!
    expect(cfg.fields.map((f) => f.collapsible)).toEqual([false, true])
    expect(cfg.chunk).toBe(250)
  })

  it('resolves `selectable`: off by default, inherited, per-field off / merged', () => {
    expect(normalizeGrouped({ fields: ['A'] })!.fields[0]!.selectable).toBeNull()
    const filter = (r: any) => !!r.ok
    const cfg = normalizeGrouped({
      selectable: { filter, checkbox: { size: 'sm' } },
      fields: [
        'A',
        { field: 'B', selectable: false },
        { field: 'C', selectable: { checkbox: { color: 'danger' } } },
        { field: 'D', selectable: true },
      ],
    })!
    const [a, b, c, d] = cfg.fields
    expect(a!.selectable).toEqual({ filter, field: undefined, checkbox: { size: 'sm' } })
    expect(b!.selectable).toBeNull()
    // A field's `checkbox` props merge over the table-level ones, key by key.
    expect(c!.selectable).toEqual({ filter, field: undefined, checkbox: { size: 'sm', color: 'danger' } })
    expect(d!.selectable).toEqual({ filter, field: undefined, checkbox: { size: 'sm' } })
    // `true` alone, at the table level.
    expect(normalizeGrouped({ selectable: true, fields: ['A'] })!.fields[0]!.selectable).toEqual({ checkbox: {} })
  })

  it('is null without fields', () => {
    expect(normalizeGrouped(null)).toBeNull()
    expect(normalizeGrouped({ fields: [] })).toBeNull()
    expect(normalizeGrouped({ fields: [''] })).toBeNull()
  })
})

describe('groupedSignature', () => {
  it('ignores closure identity (an inline template object) but not shape', () => {
    const a = groupedSignature({ fields: [{ field: 'A', custom: (r: any) => r.A, color: () => 'red' }] })
    const b = groupedSignature({ fields: [{ field: 'A', custom: (r: any) => `${r.A}!`, color: () => 'blue' }] })
    expect(a).toBe(b)
    expect(groupedSignature({ fields: [{ field: 'A', color: 'red' }] })).not.toBe(groupedSignature({ fields: [{ field: 'A', color: 'blue' }] }))
  })

  it('sees `selectable` (its filter by presence only)', () => {
    const base = groupedSignature({ fields: ['A'] })
    expect(groupedSignature({ selectable: true, fields: ['A'] })).not.toBe(base)
    expect(groupedSignature({ fields: [{ field: 'A', selectable: { filter: () => true } }] })).toBe(
      groupedSignature({ fields: [{ field: 'A', selectable: { filter: () => false } }] }),
    )
    expect(groupedSignature({ selectable: { checkbox: { size: 'sm' } }, fields: ['A'] })).not.toBe(
      groupedSignature({ selectable: { checkbox: { size: 'lg' } }, fields: ['A'] }),
    )
  })
})

describe('buildGrouped — band row ranges', () => {
  it('gives every band `from` + `count` over the ordered rows, folded ones included', () => {
    const { grouped } = buildGrouped(rows, fields, new Set([encodeURIComponent('s:A')]))
    const a = grouped.find((b) => b.level === 0 && b.key === 'A')!
    expect([a.from, a.count]).toEqual([0, 3])
    const bY = grouped.find((b) => b.path === `${encodeURIComponent('s:B')}/${encodeURIComponent('s:y')}`)!
    expect(rows.slice(bY.from, bY.from + bY.count).map((r) => r.Id)).toEqual([4, 5])
  })
})

describe('buildGrouped', () => {
  it('opens a band at every key change, inner levels restarting under a new outer key', () => {
    const { grouped: bands, visible, slotCount } = buildGrouped(rows, fields)
    expect(bands.map((b) => [b.level, b.label, b.count, b.at, b.slot])).toEqual([
      [0, 'A', 3, 0, 0],
      [1, 'x', 2, 0, 1],
      [1, 'y', 1, 2, 4],
      [0, 'B', 2, 3, 6],
      [1, 'y', 2, 3, 7],
      [0, '(blank)', 1, 5, 10],
      [1, 'z', 1, 5, 11],
    ])
    expect(visible).toHaveLength(6)
    expect(slotCount).toBe(13)
  })

  it('uses custom labels and per-band function colours from the first row', () => {
    const cfg = normalizeGrouped<Row>({
      fields: [
        {
          field: 'Brand',
          custom: (r) => `Brand ${r.Brand ?? '-'} #${r.Id}`,
          color: (r) => (r.Brand === 'A' ? 'danger' : '#123456'),
          variant: (r) => (r.Brand === 'A' ? 'solid' : 'outline'),
        },
      ],
    })!
    const { grouped: bands } = buildGrouped(rows, cfg.fields)
    expect(bands.map((b) => [b.label, b.color, b.variant])).toEqual([
      ['Brand A #1', 'danger', 'solid'],
      ['Brand B #4', '#123456', 'outline'],
      ['Brand - #6', '#123456', 'outline'],
    ])
  })

  it('collapsing a band hides its rows and its inner bands, keeps its count', () => {
    const { grouped: bands } = buildGrouped(rows, fields)
    const a = bands[0]!.path
    const out = buildGrouped(rows, fields, new Set([a]))
    expect(out.grouped.map((b) => [b.label, b.collapsed, b.at])).toEqual([
      ['A', true, 0],
      ['B', false, 0],
      ['y', false, 0],
      ['(blank)', false, 2],
      ['z', false, 2],
    ])
    expect(out.grouped[0]!.count).toBe(3)
    expect(out.visible.map((r) => r.Id)).toEqual([4, 5, 6])
    expect(out.slotCount).toBe(3 + 5)
  })

  it('collapsing an inner band only hides its own rows', () => {
    const { grouped: bands } = buildGrouped(rows, fields)
    const ax = bands[1]!.path
    const out = buildGrouped(rows, fields, new Set([ax]))
    expect(out.visible.map((r) => r.Id)).toEqual([3, 4, 5, 6])
    expect(out.grouped.map((b) => b.label)).toEqual(['A', 'x', 'y', 'B', 'y', '(blank)', 'z'])
  })

  it('ignores a collapsed path on a non-collapsible level', () => {
    const cfg = normalizeGrouped<Row>({ fields: ['Brand'], collapsible: false })!
    const { grouped: bands } = buildGrouped(rows, cfg.fields)
    const out = buildGrouped(rows, cfg.fields, new Set([bands[0]!.path]))
    expect(out.visible).toHaveLength(6)
    expect(out.grouped[0]!.collapsed).toBe(false)
  })
})

describe('slot ↔ row', () => {
  const layout = buildGrouped(rows, fields)
  it('maps both ways', () => {
    // slots: [A][x] r0 r1 [y] r2 [B][y] r3 r4 [blank][z] r5
    expect(rowToSlot(layout, 0)).toBe(2)
    expect(rowToSlot(layout, 2)).toBe(5)
    expect(rowToSlot(layout, 3)).toBe(8)
    expect(slotToRow(layout, 0)).toBe(0)
    expect(slotToRow(layout, 2)).toBe(0)
    expect(slotToRow(layout, 3)).toBe(1)
    expect(slotToRow(layout, 6)).toBe(3)
    expect(slotToRow(layout, 13)).toBe(6)
  })
})

describe('groupedWindow', () => {
  const layout = buildGrouped(rows, fields)
  const total = (w: ReturnType<typeof groupedWindow>, a: number, b: number) =>
    w.slotsAbove + w.leads.length + [...w.before.values()].reduce((n, l) => n + l.length, 0) + (b - a) + w.slotsBelow

  it('draws the bands in front of their rows, outer first', () => {
    const w = groupedWindow(layout, 0, 6)
    expect(w.leads).toEqual([])
    expect([...w.before.entries()].map(([k, v]) => [k, v.map((b) => b.label)])).toEqual([
      [0, ['A', 'x']],
      [2, ['y']],
      [3, ['B', 'y']],
      [5, ['(blank)', 'z']],
    ])
    expect(w.slotsAbove).toBe(0)
    expect(w.slotsBelow).toBe(0)
    expect(total(w, 0, 6)).toBe(layout.slotCount)
  })

  it('re-draws the bands the window starts under as leads, and the heights add up', () => {
    const w = groupedWindow(layout, 1, 4) // rows 1..3: inside A›x, then A›y, then B›y
    expect(w.leads.map((b) => b.label)).toEqual(['A', 'x'])
    expect([...w.before.entries()].map(([k, v]) => [k, v.map((b) => b.label)])).toEqual([
      [1, ['y']],
      [2, ['B', 'y']],
    ])
    expect(total(w, 1, 4)).toBe(layout.slotCount)
  })

  it('a window starting on a new inner band keeps only the outer lead', () => {
    const w = groupedWindow(layout, 2, 3) // row 2 opens A›y
    expect(w.leads.map((b) => b.label)).toEqual(['A'])
    expect(w.before.get(0)!.map((b) => b.label)).toEqual(['y'])
    expect(total(w, 2, 3)).toBe(layout.slotCount)
  })

  it('every window adds up', () => {
    for (let a = 0; a <= 6; a++) {
      for (let b = a; b <= 6; b++) expect(total(groupedWindow(layout, a, b), a, b)).toBe(layout.slotCount)
    }
  })

  it('draws trailing folded bands after the last row', () => {
    const blank = layout.grouped.find((b) => b.label === '(blank)')!
    const folded = buildGrouped(rows, fields, new Set([blank.path]))
    const w = groupedWindow(folded, 0, folded.visible.length)
    expect(w.before.get(folded.visible.length)!.map((b) => b.label)).toEqual(['(blank)'])
    expect(total(w, 0, folded.visible.length)).toBe(folded.slotCount)
  })
})
