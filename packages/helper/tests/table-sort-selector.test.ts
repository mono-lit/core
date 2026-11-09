// `sort.selector` — a column that sorts its SOURCE by something other than its `field`.
//
// A column's `field` is its identity (arrow, precedence badge, `sorts`, `setSort(field)`), and it
// used to be the sort selector handed to the source too. A derived column (`_Total`, summed in the
// browser) then sent `$orderby=_Total`, which an OData server rejects. `sort.selector` keeps the
// identity and swaps only what the source receives — read from `props.th` like `sort.index`.
import { describe, it, expect } from 'vitest'
import { monoDataGrid } from '../src/components/table/mono-data-grid'
import { monoArraySource } from '../src/components/table/array-source'

const rows = () => [
  { Id: 1, Total: 5, Nama: 'b' },
  { Id: 2, Total: 9, Nama: 'c' },
  { Id: 3, Total: 1, Nama: 'a' },
]

/** The first sort entry the source holds, whatever shape it normalised to. */
const firstSort = (src: { sort: () => unknown }) => {
  const s = src.sort() as unknown
  return (Array.isArray(s) ? s[0] : s) as { selector: unknown; desc?: boolean } | undefined
}

describe('mono-table sort.selector', () => {
  it('sends the declared selector to the source and keeps the column field as the identity', async () => {
    const src = monoArraySource(rows(), { keyExpr: 'Id', pageSize: 10 })
    const grid = monoDataGrid(src, {
      keyExpr: 'Id',
      props: { th: [{ field: '_Total', sort: { selector: 'Total' } }, { field: 'Nama', sort: true }] },
    })
    await grid.load()

    await grid.setSort('_Total', 'desc')
    expect(grid.sorts.map((s) => s.field)).toEqual(['_Total'])
    expect(firstSort(src)).toMatchObject({ selector: 'Total', desc: true })
    expect(grid.items.map((r) => r.Id)).toEqual([2, 1, 3])

    await grid.setSort('_Total', 'asc')
    expect(grid.items.map((r) => r.Id)).toEqual([3, 1, 2])
  })

  it('a [*] selector sorts IN THE BROWSER by the sum of the matches, and pages in memory', async () => {
    const docs = [
      { Id: 1, Lines: [{ Amount: 10 }, { Amount: 5 }] }, // 15
      { Id: 2, Lines: [{ Amount: 100 }] }, // 100
      { Id: 3, Lines: [] }, // 0
      { Id: 4, Lines: [{ Amount: 20 }, { Amount: 20 }, { Amount: 1 }] }, // 41
    ]
    const src = monoArraySource(docs, { keyExpr: 'Id', pageSize: 2 })
    const grid = monoDataGrid(src, {
      keyExpr: 'Id',
      props: { th: [{ field: '_Total', sort: { selector: 'Lines.[*].Amount' } }] },
    })
    await grid.load()

    await grid.setSort('_Total', 'desc')
    expect(grid.sorts.map((s) => s.field)).toEqual(['_Total'])
    // The source never receives the wildcard selector — it can't order by it.
    const held = firstSort(src)
    expect(held?.selector).not.toBe('Lines.[*].Amount')
    expect(grid.totalCount).toBe(4)
    expect(grid.pageCount).toBe(2)
    expect(grid.items.map((r) => r.Id)).toEqual([2, 4])

    await grid.setPage(1)
    expect(grid.items.map((r) => r.Id)).toEqual([1, 3])

    await grid.setSort('_Total', 'asc')
    expect(grid.items.map((r) => r.Id)).toEqual([3, 1])

    // Leaving the browser-sorted column returns to normal source paging.
    await grid.clearSort()
    expect(grid.items.map((r) => r.Id)).toEqual([1, 2])
  })

  it('aggregate: count sorts by how many matches a row has', async () => {
    const docs = [
      { Id: 1, Lines: [{ A: 1 }, { A: 1 }] },
      { Id: 2, Lines: [{ A: 1 }, { A: 1 }, { A: 1 }] },
      { Id: 3, Lines: [{ A: 1 }] },
    ]
    const src = monoArraySource(docs, { keyExpr: 'Id', pageSize: 10 })
    const grid = monoDataGrid(src, {
      keyExpr: 'Id',
      props: { th: [{ field: '_Lines', sort: { selector: 'Lines.[*].A', aggregate: 'count' } }] },
    })
    await grid.load()
    await grid.setSort('_Lines', 'desc')
    expect(grid.items.map((r) => r.Id)).toEqual([2, 1, 3])
  })

  it('maxRows refuses the browser sort (cleared, warned) instead of reading too many rows', async () => {
    const docs = [1, 2, 3].map((Id) => ({ Id, Lines: [{ Amount: Id }] }))
    const src = monoArraySource(docs, { keyExpr: 'Id', pageSize: 10 })
    const grid = monoDataGrid(src, {
      keyExpr: 'Id',
      props: { th: [{ field: '_Total', sort: { selector: 'Lines.[*].Amount', maxRows: 2 } }] },
    })
    await grid.load()
    const warn = console.warn
    const warned: string[] = []
    console.warn = (...a: unknown[]) => { warned.push(String(a[0])) }
    try {
      await grid.setSort('_Total', 'desc')
    } finally {
      console.warn = warn
    }
    expect(grid.sorts).toEqual([])
    expect(warned.some((w) => w.includes('maxRows 2'))).toBe(true)
    expect(grid.items.map((r) => r.Id)).toEqual([1, 2, 3])
  })

  it('remote source: reads every row through the STORE (expand kept, no [*] $orderby), refuses above maxRows', async () => {
    const docs = Array.from({ length: 7 }, (_, i) => ({ Id: i + 1, Lines: [{ Amount: (i * 37) % 11 }] }))
    const storeCalls: Array<Record<string, unknown>> = []
    // A devextreme-shaped remote DataSource: the grid pages it; `readAllRows` drains its store.
    const makeRemote = () => {
      const handlers: Record<string, Array<() => void>> = {}
      let pageIndex = 0
      let pageSize = 3
      let sort: unknown = null
      let items: unknown[] = []
      const store = {
        key: () => 'Id',
        load: async (o: Record<string, unknown>) => {
          storeCalls.push(o)
          const skip = Number(o.skip ?? 0)
          const take = Number(o.take ?? docs.length)
          return docs.slice(skip, skip + take)
        },
      }
      const ds = {
        store: () => store,
        loadOptions: () => ({ expand: ['Lines($select=Amount)'] }),
        load: async () => {
          items = docs.slice(pageIndex * pageSize, pageIndex * pageSize + pageSize)
          handlers.changed?.forEach((h) => h())
          return items
        },
        reload: async () => ds.load(),
        items: () => items,
        totalCount: () => docs.length,
        isLastPage: () => (pageIndex + 1) * pageSize >= docs.length,
        isLoading: () => false,
        paginate: () => true,
        pageSize: (v?: number) => (v === undefined ? pageSize : void (pageSize = v)),
        pageIndex: (v?: number) => (v === undefined ? pageIndex : void (pageIndex = v)),
        sort: (v?: unknown) => (v === undefined ? sort : void (sort = v)),
        filter: (v?: unknown) => (v === undefined ? null : undefined),
        on: (e: string, h: () => void) => { (handlers[e] ??= []).push(h) },
        off: (e: string, h: () => void) => { handlers[e] = (handlers[e] ?? []).filter((x) => x !== h) },
      }
      return ds
    }

    const ds = makeRemote()
    const grid = monoDataGrid(ds as any, {
      keyExpr: 'Id',
      props: { th: [{ field: '_Total', sort: { selector: 'Lines.[*].Amount' } }] },
    })
    await grid.load()
    storeCalls.length = 0
    await grid.setSort('_Total', 'desc')

    // Drained through the store, with the DataSource's expand; never ordered by the wildcard.
    expect(storeCalls.length).toBeGreaterThan(0)
    expect(storeCalls.every((c) => JSON.stringify(c.expand) === JSON.stringify(['Lines($select=Amount)']))).toBe(true)
    expect(JSON.stringify(storeCalls)).not.toContain('[*]')
    const sums = docs.map((d) => ({ Id: d.Id, v: d.Lines[0]!.Amount })).sort((a, b) => b.v - a.v || a.Id - b.Id)
    expect(grid.totalCount).toBe(7)
    expect(grid.items.map((r) => r.Id)).toEqual(sums.slice(0, 3).map((s) => s.Id))

    // Too many rows for the cap: refused from the KNOWN count, before any drain.
    const ds2 = makeRemote()
    const grid2 = monoDataGrid(ds2 as any, {
      keyExpr: 'Id',
      props: { th: [{ field: '_Total', sort: { selector: 'Lines.[*].Amount', maxRows: 5 } }] },
    })
    await grid2.load()
    storeCalls.length = 0
    const warn = console.warn
    console.warn = () => {}
    try {
      await grid2.setSort('_Total', 'desc')
    } finally {
      console.warn = warn
    }
    expect(grid2.sorts).toEqual([])
    expect(storeCalls.length).toBe(0)
  })

  it('without a selector the field is what the source sorts by (unchanged)', async () => {
    const src = monoArraySource(rows(), { keyExpr: 'Id', pageSize: 10 })
    const grid = monoDataGrid(src, { keyExpr: 'Id', props: { th: [{ field: 'Nama', sort: { selector: '  ' } }] } })
    await grid.load()

    await grid.setSort('Nama', 'asc')
    // A blank selector counts as not declared.
    expect(firstSort(src)).toMatchObject({ selector: 'Nama', desc: false })
    expect(grid.items.map((r) => r.Id)).toEqual([3, 1, 2])
  })
})
