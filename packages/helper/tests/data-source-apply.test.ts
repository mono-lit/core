// `utils/data-source-apply` — ONE `$apply` request through a devextreme OData
// store, the transport behind the header filter, the summary footer and a bound
// chart's roll-up.
//
// The bug this guards: devextreme turns `customQueryParams` on an OData v4 store
// into a FUNCTION-INVOCATION url — `Entity($apply='filter(...)')`, `'` doubled —
// which every entity set answers with 404. The pure half pins what load options
// each store version gets; the second half runs a REAL `ODataStore` and asserts
// the url devextreme actually sends.

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ODataStore } from '@mono-lit/devextreme'
import {
  applyLoadOptions,
  applyRequestUrl,
  createApplyGate,
  isApplyRejected,
  isRolledUp,
  loadApply,
  odataStoreUrl,
  odataStoreVersion,
} from '../src/utils/data-source-apply'

const CLAUSE = "filter((CompanyId eq 1 and Jenis eq 'TRANSFER'))/groupby((CompanyName),aggregate($count as count))"

describe('applyRequestUrl', () => {
  it('appends ?$apply= to a bare url, encoded', () => {
    expect(applyRequestUrl('https://x.test/odata/DTO', "filter(A eq 'B')/groupby((C))")).toBe(
      "https://x.test/odata/DTO?$apply=filter(A%20eq%20'B')%2Fgroupby((C))",
    )
  })

  it('joins with & when the url already carries a query string', () => {
    expect(applyRequestUrl('https://x.test/odata/DTO?foo=1', 'groupby((C))')).toBe(
      'https://x.test/odata/DTO?foo=1&$apply=groupby((C))',
    )
  })
})

describe('applyLoadOptions', () => {
  const v4 = { load: () => [], version: () => 4, _requestDispatcher: { url: 'https://x.test/odata/DTO' } }

  it('v4: puts the clause INTO the url (urlOverride), never into customQueryParams', () => {
    const out = applyLoadOptions(v4, CLAUSE, { top: 5 })!
    expect(out.urlOverride).toBe(applyRequestUrl('https://x.test/odata/DTO', CLAUSE))
    expect(out.customQueryParams).toBeUndefined()
    expect(out.requireTotalCount).toBe(false)
    // `$top` rides devextreme's own `take`, appended behind the clause with `&`.
    expect(out.take).toBe(5)
  })

  it('v4: no take → no $top', () => {
    expect(applyLoadOptions(v4, CLAUSE)).not.toHaveProperty('take')
  })

  it('v4: reads the url off the older `_url` slot too', () => {
    const out = applyLoadOptions({ load: () => [], version: () => 4, _url: 'https://x.test/odata/DTO' }, CLAUSE)!
    expect(out.urlOverride).toContain('https://x.test/odata/DTO?$apply=')
  })

  it('without a readable url → null (nothing to request)', () => {
    expect(applyLoadOptions({ load: () => [], version: () => 4 }, CLAUSE)).toBeNull()
  })

  it('v2 / v3: the same urlOverride — customQueryParams is quoted as a literal there too', () => {
    for (const version of [2, 3]) {
      const out = applyLoadOptions({ load: () => [], version: () => version, _url: 'https://x.test/odata/DTO' }, CLAUSE, { top: 3 })!
      expect(out.urlOverride).toBe(applyRequestUrl('https://x.test/odata/DTO', CLAUSE))
      expect(out.customQueryParams).toBeUndefined()
      expect(out.take).toBe(3)
    }
  })

  it('a store without version() (CustomStore / array) → null', () => {
    expect(applyLoadOptions({ load: () => [] }, CLAUSE)).toBeNull()
    expect(applyLoadOptions(null, CLAUSE)).toBeNull()
  })

  it('odataStoreVersion / odataStoreUrl duck-type the store', () => {
    expect(odataStoreVersion(v4)).toBe(4)
    expect(odataStoreVersion({ load: () => [] })).toBeNull()
    expect(odataStoreUrl(v4)).toBe('https://x.test/odata/DTO')
    expect(odataStoreUrl({})).toBeNull()
  })
})

describe('loadApply', () => {
  it('sends the load options and unwraps { data } as well as a bare array', async () => {
    const seen: unknown[] = []
    const store = {
      version: () => 4,
      _requestDispatcher: { url: 'https://x.test/odata/DTO' },
      load: (o: unknown) => {
        seen.push(o)
        return Promise.resolve({ data: [{ CompanyName: 'A', count: 2 }] })
      },
    }
    expect(await loadApply(store, CLAUSE)).toEqual([{ CompanyName: 'A', count: 2 }])
    expect(seen).toHaveLength(1)
    expect((seen[0] as { urlOverride: string }).urlOverride).toContain('?$apply=')

    const bare = { version: () => 2, _url: 'https://x.test/odata/DTO', load: () => Promise.resolve([{ count: 1 }]) }
    expect(await loadApply(bare, CLAUSE)).toEqual([{ count: 1 }])
  })

  it('returns null without loading when the store cannot carry an $apply', async () => {
    const load = vi.fn()
    expect(await loadApply({ load }, CLAUSE)).toBeNull()
    expect(load).not.toHaveBeenCalled()
  })

  it('lets a failed request throw', async () => {
    const store = {
      version: () => 4,
      _url: 'https://x.test/odata/DTO',
      load: () => Promise.reject(Object.assign(new Error('404'), { httpStatus: 404 })),
    }
    await expect(loadApply(store, CLAUSE)).rejects.toMatchObject({ httpStatus: 404 })
  })
})

describe('isRolledUp', () => {
  it('buckets carry only the key and the aliases; an entity carries more', () => {
    expect(isRolledUp([{ Dept: 'A', Total: 15 }, { Dept: 'B', Total: 7 }], ['Dept', 'Total'])).toBe(true)
    // The alias IS the field name, so a presence check would pass this — `Id` is the tell.
    expect(isRolledUp([{ Id: 1, Dept: 'A', Total: 10 }], ['Dept', 'Total'])).toBe(false)
  })

  it('tolerates @odata annotations and matches path keys on their root segment', () => {
    expect(isRolledUp([{ '@odata.id': 'x', Job: { Title: 'T' }, count: 2 }], ['Job/Title', 'count'])).toBe(true)
    expect(isRolledUp([{ Job: { Title: 'T' }, count: 2 }], ['Job.Title', 'count'])).toBe(true)
  })

  it('an empty result is rolled up (nothing in scope); a non-object row is not', () => {
    expect(isRolledUp([], ['a'])).toBe(true)
    expect(isRolledUp([null], ['a'])).toBe(false)
  })
})

describe('isApplyRejected / createApplyGate', () => {
  it('a 4xx or 501 is a definite rejection; a network fault or 5xx is not', () => {
    expect(isApplyRejected({ httpStatus: 400 })).toBe(true)
    expect(isApplyRejected({ httpStatus: 404 })).toBe(true)
    expect(isApplyRejected({ httpStatus: 501 })).toBe(true)
    expect(isApplyRejected({ httpStatus: 0 })).toBe(false)
    expect(isApplyRejected({ httpStatus: 500 })).toBe(false)
    expect(isApplyRejected(new Error('x'))).toBe(false)
    expect(isApplyRejected(null)).toBe(false)
  })

  it('remembers the first definite rejection; transient failures keep it open', () => {
    const gate = createApplyGate(true)
    expect(gate.skip).toBe(false)
    gate.reject({ httpStatus: 0 })
    expect(gate.skip).toBe(false)
    gate.reject({ httpStatus: 404 })
    expect(gate.skip).toBe(true)
  })

  it('serverApply: false is off from the start', () => {
    expect(createApplyGate(false).skip).toBe(true)
  })
})

/**
 * The real thing: a devextreme `ODataStore`, its `beforeSend` capturing the
 * request devextreme composed, the XHR itself stubbed so nothing leaves jsdom.
 * `beforeSend` runs synchronously inside `store.load()`, so the capture is
 * ready without awaiting the (never-settling) load.
 */
describe('loadApply through a real ODataStore', () => {
  const URL = 'https://x.test/odata/DTO_BudgetTransfer'
  let captured: { url: string; params: Record<string, unknown> } | null
  let send: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    captured = null
    send = vi.spyOn(XMLHttpRequest.prototype, 'send').mockImplementation(() => {})
  })
  afterEach(() => {
    send.mockRestore()
  })

  const make = (version: 2 | 4) =>
    new ODataStore({
      url: URL,
      version,
      key: 'Id',
      beforeSend: (req: { url: string; params: Record<string, unknown> }) => {
        captured = { url: req.url, params: { ...req.params } }
      },
    })

  it('v4: GET <url>?$apply=<clause> — not <entity>($apply=...)', () => {
    void loadApply(make(4), CLAUSE, { top: 5 }).catch(() => {})
    expect(captured).not.toBeNull()
    expect(captured!.url).toBe(`${URL}?$apply=${encodeURIComponent(CLAUSE)}`)
    expect(captured!.url).not.toContain('DTO_BudgetTransfer(')
    expect(captured!.params.$top).toBe(5)
    expect(captured!.params.$apply).toBeUndefined()
    expect(captured!.params.$count).toBeUndefined()
    expect(captured!.params.$filter).toBeUndefined()
  })

  it('v2: the same url — a v2 store sends the clause exactly like a v4 one', () => {
    void loadApply(make(2), CLAUSE, { top: 5 }).catch(() => {})
    expect(captured).not.toBeNull()
    expect(captured!.url).toBe(`${URL}?$apply=${encodeURIComponent(CLAUSE)}`)
    expect(captured!.params.$apply).toBeUndefined()
    expect(captured!.params.$top).toBe(5)
  })

  it('the regression: customQueryParams is a quoted literal on v2 and a function call on v4', () => {
    // Pinned so a future devextreme that changes this shows up here first.
    void Promise.resolve(make(4).load({ customQueryParams: { $apply: "filter(A eq 'B')" } })).catch(() => {})
    expect(captured!.url).toBe(`${URL}($apply='filter(A eq ''B'')')`)
    void Promise.resolve(make(2).load({ customQueryParams: { $apply: "filter(A eq 'B')" } })).catch(() => {})
    expect(captured!.url).toBe(URL)
    expect(captured!.params.$apply).toBe("'filter(A eq ''B'')'")
  })
})
