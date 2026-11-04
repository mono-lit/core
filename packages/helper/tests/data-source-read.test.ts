// `utils/data-source-read` — `readAllRows`, the chunked drain behind `table.getData()`
// and the report engine's DataSource resolver.
//
// The bug this guards: the drain talks to the STORE and rebuilt filter / search / sort /
// select by hand, but never carried the DataSource's `expand` (or `customQueryParams`).
// A list built with `expand: ['Lines($select=Brand)']` therefore showed the nested
// collection on screen while every exported row came back without it.
//
// A real `ODataStore` is required: devextreme only keeps `expand` / `customQueryParams`
// on a DataSource whose store declares them as custom load options — a `CustomStore`
// drops them, so a CustomStore-backed test would pass for the wrong reason.

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { DataSource, ODataStore } from '@mono-lit/devextreme'
import { readAllRows } from '../src/utils/data-source-read'

const URL = 'https://x.test/odata/DTO_BudgetTransfer'

/** A real ODataStore whose `load` is replaced by a recorder serving `total` rows. */
function recordingODataStore(total: number) {
  const calls: any[] = []
  const rows = Array.from({ length: total }, (_, i) => ({ Id: i + 1 }))
  const store = new ODataStore({ url: URL, version: 4, key: 'Id' })
  vi.spyOn(store, 'load').mockImplementation(((lo: any) => {
    calls.push(lo)
    const skip = lo?.skip ?? 0
    const take = lo?.take ?? rows.length
    return Promise.resolve(rows.slice(skip, skip + take))
  }) as any)
  return { store, calls }
}

describe('readAllRows — DataSource load options', () => {
  it('inherits the source `expand` and `customQueryParams` on every chunk', async () => {
    const { store, calls } = recordingODataStore(5)
    const ds = new DataSource({
      store,
      select: ['Id', 'Lines'],
      expand: ['Lines($select=Brand)'],
      customQueryParams: { tenant: 'a' },
    } as any)

    const out = await readAllRows(ds, { chunkSize: 2 })

    expect(out).toHaveLength(5)
    expect(calls).toHaveLength(3)
    for (const lo of calls) {
      expect(lo.expand).toEqual(['Lines($select=Brand)'])
      expect(lo.customQueryParams).toEqual({ tenant: 'a' })
      expect(lo.select).toEqual(['Id', 'Lines'])
      expect(lo.requireTotalCount).toBe(false)
    }
  })

  it('lets explicit `loadOptions` override the inherited keys', async () => {
    const { store, calls } = recordingODataStore(1)
    const ds = new DataSource({ store, expand: ['Old'] } as any)

    await readAllRows(ds, { loadOptions: { expand: ['New'] } })

    expect(calls[0].expand).toEqual(['New'])
  })

  it('does not inherit paging / group state from the source', async () => {
    const { store, calls } = recordingODataStore(3)
    const ds = new DataSource({ store, paginate: true, pageSize: 1, expand: ['Lines'] } as any)

    const out = await readAllRows(ds, { chunkSize: 10 })

    expect(out).toHaveLength(3)
    expect(calls[0].take).toBe(10)
    expect(calls[0].group).toBeUndefined()
  })

  it('sends no expand when the source declares none', async () => {
    const { store, calls } = recordingODataStore(1)
    await readAllRows(new DataSource({ store } as any))
    expect(calls[0].expand).toBeUndefined()
  })
})

/**
 * End to end through devextreme's own URL builder: `beforeSend` captures the request,
 * the XHR is stubbed so nothing leaves jsdom. `store.load()` runs synchronously inside
 * the first drain step, so the capture is ready without awaiting the (never-settling) load.
 */
describe('readAllRows — the request a real ODataStore sends', () => {
  let captured: Record<string, unknown> | null
  let send: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    captured = null
    send = vi.spyOn(XMLHttpRequest.prototype, 'send').mockImplementation(() => {})
  })
  afterEach(() => {
    send.mockRestore()
  })

  it('carries $expand and $select like the live grid', () => {
    const store = new ODataStore({
      url: URL,
      version: 4,
      key: 'Id',
      beforeSend: (req: { params: Record<string, unknown> }) => {
        captured = { ...req.params }
      },
    })
    const ds = new DataSource({
      store,
      select: ['Id', 'Draft', 'BudgetTransferDetail'],
      expand: ['BudgetTransferDetail($select=Brand)'],
    } as any)

    void readAllRows(ds, { chunkSize: 100 }).catch(() => {})

    expect(captured).not.toBeNull()
    expect(captured!.$expand).toBe('BudgetTransferDetail($select=Brand)')
    expect(String(captured!.$select)).toContain('Draft')
    expect(captured!.$top).toBe(100)
  })
})
