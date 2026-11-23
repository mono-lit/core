// `grouped` end to end on the controller: every row is read (store drains ask for
// `$count` with the FIRST chunk, then fetch the rest knowing where it ends), the band
// keys lead the sort so the bands stay contiguous, a header sort stays inside each
// band without a reload, collapse is in memory, and under virtual scroll the window
// is measured in slots (rows + bands) with spacers that always add up.

import { describe, expect, it, vi } from 'vitest'
import { DataSource, ODataStore } from '@mono-lit/devextreme'
import { monoDataGrid } from '../src/components/table/mono-data-grid'
import { readAllRows } from '../src/utils/data-source-read'

type Row = { Id: number; Brand: string; Code: string; Amount: number }
const rows = (): Row[] => [
  { Id: 1, Brand: 'B', Code: 'y', Amount: 5 },
  { Id: 2, Brand: 'A', Code: 'x', Amount: 9 },
  { Id: 3, Brand: 'B', Code: 'x', Amount: 1 },
  { Id: 4, Brand: 'A', Code: 'y', Amount: 3 },
  { Id: 5, Brand: 'A', Code: 'x', Amount: 7 },
]

describe('readAllRows — countFirst', () => {
  function countingStore(total: number) {
    const calls: any[] = []
    const data = Array.from({ length: total }, (_, i) => ({ Id: i + 1 }))
    const store = new ODataStore({ url: 'https://x.test/odata/Rows', version: 4, key: 'Id' })
    vi.spyOn(store, 'load').mockImplementation(((lo: any) => {
      calls.push(lo)
      const page = data.slice(lo.skip ?? 0, (lo.skip ?? 0) + (lo.take ?? total))
      // devextreme hands the count over as the Deferred's SECOND argument.
      return {
        done(cb: (d: unknown, extra: unknown) => void) {
          queueMicrotask(() => cb(page, lo.requireTotalCount ? { totalCount: total } : {}))
          return this
        },
        fail() {
          return this
        },
        then(res: (d: unknown) => unknown) {
          return Promise.resolve(page).then(res)
        },
      }
    }) as any)
    return { store, calls }
  }

  it('asks for the count on the first chunk only, then fetches exactly the remaining chunks', async () => {
    const { store, calls } = countingStore(950)
    const ds = new DataSource({ store } as any)
    const out = await readAllRows(ds, { chunkSize: 100, countFirst: true })
    expect(out).toHaveLength(950)
    expect(out.map((r: any) => r.Id)).toEqual(Array.from({ length: 950 }, (_, i) => i + 1))
    expect(calls).toHaveLength(10)
    expect(calls[0]).toMatchObject({ skip: 0, take: 100, requireTotalCount: true })
    expect(calls.slice(1).every((c) => c.requireTotalCount === false)).toBe(true)
    expect(calls.map((c) => c.skip).sort((a, b) => a - b)).toEqual([0, 100, 200, 300, 400, 500, 600, 700, 800, 900])
  })

  it('stops after the first chunk when it is short', async () => {
    const { store, calls } = countingStore(40)
    const out = await readAllRows(new DataSource({ store } as any), { chunkSize: 100, countFirst: true })
    expect(out).toHaveLength(40)
    expect(calls).toHaveLength(1)
  })
})

describe('monoDataGrid({ grouped })', () => {
  it('reads every row and leads the sort with the band keys', async () => {
    const grid = monoDataGrid<Row>(rows(), { keyExpr: 'Id', pageSize: 2, grouped: { fields: ['Brand', 'Code'] } })
    await grid.load()
    expect(grid.totalCount).toBe(5)
    expect(grid.grouped.map((b) => `${b.level}:${b.label}(${b.count})`)).toEqual([
      '0:A(3)',
      '1:x(2)',
      '1:y(1)',
      '0:B(2)',
      '1:x(1)',
      '1:y(1)',
    ])
    // Classic paging pages the banded rows in memory.
    expect(grid.pageCount).toBe(3)
    expect(grid.items.map((r) => r.Id)).toEqual([2, 5])
    await grid.setPage(1)
    expect(grid.items.map((r) => r.Id)).toEqual([4, 3])
    // The page starts inside "A" → re-drawn as a lead; "y" opens at row 0 of the page.
    expect(grid.groupedWindow!.leads.map((b) => b.label)).toEqual(['A'])
    expect(grid.groupedWindow!.before.get(0)!.map((b) => b.label)).toEqual(['y'])
    expect(grid.groupedWindow!.before.get(1)!.map((b) => b.label)).toEqual(['B', 'x'])
  })

  it('sorts inside each band in memory, and a band key keeps the user direction', async () => {
    const grid = monoDataGrid<Row>(rows(), { keyExpr: 'Id', pageSize: 10, grouped: { fields: ['Brand'] } })
    await grid.load()
    await grid.setSort('Amount', 'desc')
    expect(grid.items.map((r) => r.Id)).toEqual([2, 5, 4, 1, 3])
    await grid.setSort('Brand', 'desc')
    expect(grid.items.map((r) => r.Brand)).toEqual(['B', 'B', 'A', 'A', 'A'])
  })

  it('collapses a band without a reload', async () => {
    const grid = monoDataGrid<Row>(rows(), { keyExpr: 'Id', pageSize: 10, grouped: { fields: ['Brand'] } })
    await grid.load()
    const a = grid.grouped[0]!
    grid.toggleGrouped(a.path)
    expect(grid.isGroupedCollapsed(a.path)).toBe(true)
    expect(grid.items.map((r) => r.Brand)).toEqual(['B', 'B'])
    expect(grid.grouped[0]!.count).toBe(3)
    grid.collapseAllGrouped()
    expect(grid.items).toEqual([])
    grid.expandAllGrouped()
    expect(grid.items).toHaveLength(5)
  })

  it('`open: false` starts folded (table-wide or per field); clicks and expand-all override it', async () => {
    const grid = monoDataGrid<Row>(rows(), {
      keyExpr: 'Id',
      pageSize: 10,
      grouped: { open: false, fields: ['Brand', { field: 'Code', open: true }] },
    })
    await grid.load()
    // Brand bands folded → only the two Brand bands, no rows.
    expect(grid.grouped.map((b) => `${b.label}:${b.collapsed}`)).toEqual(['A:true', 'B:true'])
    expect(grid.items).toEqual([])
    grid.openGrouped(grid.grouped[0]!.path)
    // A opens; its Code bands are open (per-field `open: true`).
    expect(grid.grouped.map((b) => `${b.label}:${b.collapsed}`)).toEqual(['A:false', 'x:false', 'y:false', 'B:true'])
    expect(grid.items.map((r) => r.Id)).toEqual([2, 5, 4])
    grid.expandAllGrouped()
    expect(grid.items).toHaveLength(5)
    grid.collapseAllGrouped()
    expect(grid.items).toEqual([])
    expect(grid.isGroupedCollapsed(grid.grouped[1]!.path)).toBe(true)
  })

  it('`stayOpen: false` is an accordion — opening a band closes its open siblings', async () => {
    const grid = monoDataGrid<Row>(rows(), {
      keyExpr: 'Id',
      pageSize: 10,
      grouped: { open: false, stayOpen: false, fields: ['Brand', { field: 'Code', stayOpen: true }] },
    })
    await grid.load()
    const [a, b] = grid.grouped.map((g) => g.path)
    grid.openGrouped(a!)
    expect(grid.isGroupedCollapsed(a!)).toBe(false)
    grid.openGrouped(b!)
    expect(grid.isGroupedCollapsed(b!)).toBe(false)
    expect(grid.isGroupedCollapsed(a!)).toBe(true) // A closed by opening B
    // Code (stayOpen: true) under B: opening one leaves the other alone.
    const codes = grid.grouped.filter((g) => g.level === 1).map((g) => g.path)
    for (const p of codes) grid.openGrouped(p)
    expect(codes.length).toBe(2)
    expect(codes.every((p) => !grid.isGroupedCollapsed(p))).toBe(true)
    // toggle obeys the accordion too.
    grid.toggleGrouped(a!)
    expect(grid.isGroupedCollapsed(b!)).toBe(true)
  })

  it('a non-collapsible level never starts folded', async () => {
    const grid = monoDataGrid<Row>(rows(), {
      keyExpr: 'Id',
      grouped: { fields: [{ field: 'Brand', open: false, collapsible: false }] },
    })
    await grid.load()
    expect(grid.items).toHaveLength(5)
  })

  it('measures the virtual window in slots and pads for the bands outside it', async () => {
    const grid = monoDataGrid<Row>(rows(), { keyExpr: 'Id', grouped: { fields: ['Brand'] } })
    await grid.setScrollPaging('virtual')
    await grid.load()
    // slots: [A] r r r [B] r r  → 7
    expect(grid.virtualSlotCount).toBe(7)
    grid.setVirtualWindow(2, 5, 0, 0, 10) // slot 2..4 → rows 1..2 (+ B band at slot 4 heads row 3)
    expect(grid.virtualStart).toBe(1)
    expect(grid.virtualEnd).toBe(3)
    expect(grid.groupedWindow!.leads.map((b) => b.label)).toEqual(['A'])
    const drawn = grid.groupedWindow!.leads.length + [...grid.groupedWindow!.before.values()].flat().length
    expect(grid.virtualPadTop / 10 + drawn + grid.items.length + grid.virtualPadBottom / 10).toBe(7)
  })

  it('turns off with setGrouped(null) and ignores an equal config', async () => {
    const grid = monoDataGrid<Row>(rows(), { keyExpr: 'Id', pageSize: 10 })
    await grid.load()
    expect(grid.grouped).toEqual([])
    await grid.setGrouped({ fields: ['Code'] })
    expect(grid.grouped.map((b) => b.label)).toEqual(['x', 'y'])
    const notified = vi.fn()
    const off = grid.subscribe(notified)
    await grid.setGrouped({ fields: ['Code'] }) // a template's fresh literal
    await Promise.resolve()
    expect(notified).not.toHaveBeenCalled()
    off()
    await grid.setGrouped(null)
    expect(grid.grouped).toEqual([])
    expect(grid.groupedWindow).toBeNull()
    expect(grid.items).toHaveLength(5)
  })
})
