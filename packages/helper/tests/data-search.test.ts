// `MonoSourceSearch` — the base-filter snapshot that select and tag-input search
// through.
//
// The snapshot used to be taken once, at `bind()`, and kept for the life of the
// source. A consumer who scopes the SAME DataSource later — a Vue watcher doing
// `ds.filter([...])` when a parent field changes — was therefore never seen: the
// next keystroke recomposed `and(staleBase, search)` over their filter, and
// clearing "restored" the stale base. Now the live filter is compared against
// what this instance last wrote before every apply and clear, and a difference
// is adopted as the new base.
//
// Asserts on what the SOURCE was told, not on any component state. Two traps,
// per the tag-input suite: a plain column list folds into `searchValue` and never
// exercises `filter()`, so the non-foldable arms use a dotted PATH; and the
// foldable arm is the control, proving the base is left alone there.

import { describe, it, expect } from 'vitest'
import { MonoSourceSearch } from '../src/search/data-search'

const ROWS = [
  { Id: 1, Name: 'Marketing', Company: { Name: 'EJI' } },
  { Id: 2, Name: 'Maintenance', Company: { Name: 'EJI' } },
]

/** A DataSource stand-in that records every `filter()` write. */
function recordingSource(initialFilter: unknown = null) {
  let filter: unknown = initialFilter
  let searchValue: unknown = null
  const writes: unknown[] = []
  let loads = 0
  return {
    get writes() { return writes },
    get loads() { return loads },
    filter: (v?: unknown) => {
      if (v === undefined) return filter
      filter = v
      writes.push(v)
      return v
    },
    searchValue: (v?: unknown) => (v === undefined ? searchValue : (searchValue = v)),
    searchExpr: () => {},
    searchOperation: () => {},
    pageIndex: () => {},
    load: () => { loads++; return Promise.resolve(ROWS) },
  }
}

const BASE = ['Dept', '=', 'A']
const LATER = ['Dept', '=', 'B']

const nonFoldable = (query: string) => ({
  query,
  searchValue: ['Company.Name'],
  rows: ROWS,
  remote: true,
})

describe('MonoSourceSearch base filter', () => {
  it('composes on the filter the source had at bind', async () => {
    const ds = recordingSource(BASE)
    const search = new MonoSourceSearch()
    search.bind(ds)

    await search.apply(ds, nonFoldable('MPE'))
    expect(ds.filter()).toEqual([BASE, 'and', expect.anything()])
    expect((ds.filter() as unknown[])[0]).toBe(BASE)
  })

  it('adopts a filter the consumer set on the SAME source after bind', async () => {
    const ds = recordingSource(BASE)
    const search = new MonoSourceSearch()
    search.bind(ds)
    await search.apply(ds, nonFoldable('MPE'))

    // The watcher fires: a new scope on the same DataSource instance.
    ds.filter(LATER)

    await search.apply(ds, nonFoldable('MK'))
    const written = ds.filter() as unknown[]
    expect(written[0]).toBe(LATER) // ← was BASE: the stale snapshot
    expect(written[1]).toBe('and')
  })

  it('…and clearing restores THAT filter, not the one from bind', async () => {
    const ds = recordingSource(BASE)
    const search = new MonoSourceSearch()
    search.bind(ds)
    await search.apply(ds, nonFoldable('MPE'))
    ds.filter(LATER)
    await search.apply(ds, nonFoldable('MK'))

    const loadsBefore = ds.loads
    search.clear(ds)

    expect(ds.filter()).toBe(LATER) // ← was BASE
    expect(ds.loads).toBe(loadsBefore) // teardown never loads
  })

  it('a consumer clearing the filter to null is adopted too', async () => {
    const ds = recordingSource(BASE)
    const search = new MonoSourceSearch()
    search.bind(ds)
    await search.apply(ds, nonFoldable('MPE'))

    ds.filter(null)
    await search.apply(ds, nonFoldable('MK'))

    // Search clause alone — no BASE resurrected from the snapshot.
    const written = ds.filter() as unknown[]
    expect(JSON.stringify(written)).not.toContain('"Dept"')
  })

  it('control: its own write is not mistaken for a consumer change', async () => {
    const ds = recordingSource(BASE)
    const search = new MonoSourceSearch()
    search.bind(ds)
    await search.apply(ds, nonFoldable('M'))
    await search.apply(ds, nonFoldable('MP'))
    await search.apply(ds, nonFoldable('MPE'))

    // Three keystrokes, still ONE base and ONE clause — not a chain growing by
    // one `and` per keystroke, which is what adopting its own write would do.
    const written = ds.filter() as unknown[]
    expect(written.length).toBe(3)
    expect(written[0]).toBe(BASE)
  })

  it('control: a foldable search leaves the filter untouched', async () => {
    const ds = recordingSource(BASE)
    const search = new MonoSourceSearch()
    search.bind(ds)

    await search.apply(ds, { query: 'MPE', searchValue: ['Name'], rows: ROWS, remote: true })

    expect(ds.filter()).toBe(BASE)
    expect(ds.writes.length).toBe(0)
    expect(ds.searchValue()).toBe('MPE')
  })
})
