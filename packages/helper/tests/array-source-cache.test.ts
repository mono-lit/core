// `monoArraySource` caches the matched set between `load()`s, so the grid's
// `totalCount()` / `isLastPage()` calls stop re-running filter + search + sort.
// Every query setter that writes must drop it, and so must `setData` / `update`.
import { describe, it, expect } from 'vitest'
import { monoArraySource } from '../src/components/table/array-source'

const rows = () => [
  { Id: 1, Name: 'alpha', N: 3 },
  { Id: 2, Name: 'beta', N: 1 },
  { Id: 3, Name: 'gamma', N: 2 },
]

describe('monoArraySource match-set cache', () => {
  it('counts follow every query setter, before and after load', async () => {
    const src = monoArraySource(rows(), { pageSize: 2 })
    await src.load()
    expect(src.totalCount()).toBe(3)
    expect(src.isLastPage()).toBe(false)

    src.filter((r: { N: number }) => r.N > 1)
    expect(src.totalCount()).toBe(2)
    expect(src.isLastPage()).toBe(true)

    src.searchExpr(['Name'])
    src.searchValue('gam')
    expect(src.totalCount()).toBe(1)

    src.searchValue('')
    src.filter(null)
    src.sort({ selector: 'N', desc: false })
    await src.load()
    expect(src.items().map((r: { Id: number }) => r.Id)).toEqual([2, 3])
    expect(src.totalCount()).toBe(3)
  })

  it('setData and update drop the cache', async () => {
    const src = monoArraySource(rows(), { pageSize: 10, keyExpr: 'Id' })
    await src.load()
    src.filter((r: { N: number }) => r.N >= 3)
    expect(src.totalCount()).toBe(1)

    await src.update(2, { N: 5 })
    expect(src.totalCount()).toBe(2)

    await src.setData([{ Id: 9, Name: 'x', N: 9 }])
    expect(src.totalCount()).toBe(1)
  })
})
