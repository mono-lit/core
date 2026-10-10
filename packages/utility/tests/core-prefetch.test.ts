// @vitest-environment jsdom

// The `prefetch` option. REST: the core reports the GET to the installed prefetch bridge (in a
// Nuxt app: @mono-lit/nuxt-pre-fetch's learned requests) and answers it from the bridge when
// the host prefetched it. OData: handed to store classes that implement it themselves
// (`@mono-lit/data`, flagged `Symbol.for('mono.prefetch')`) with the auth cookie NAME; plain
// DevExtreme stores never see it. Without a bridge nothing changes.

import { afterEach, beforeEach, describe, expect, it, onTestFinished, vi } from 'vitest'

import { useFetchOData, useNormalFetch } from '../src/core/composables/use-fetch-helper'
import { setPrefetchBridge, type MonoPrefetchBridge, type MonoPrefetchRequest } from '../src/core/composables/prefetch-bridge'

;(window as any).helper = { notif() {} }

const key = (url: string, query?: Record<string, unknown> | null) => `${url}|${JSON.stringify(query ?? {})}`

/** A bridge holding `results` (keyed by `key()`), each served once. */
function createBridge(results: Record<string, unknown> = {}) {
    const learned: MonoPrefetchRequest[] = []
    const taken: string[] = []
    const bridge: MonoPrefetchBridge = {
        expects: (_m, url, query) => key(url, query) in results,
        take: async (_m, url, query) => {
            const k = key(url, query)
            if (!(k in results)) return undefined
            taken.push(k)
            const data = results[k]
            delete results[k]
            return { data }
        },
        learn: (request) => { learned.push(request) },
    }
    return { bridge, learned, taken }
}

function fakeSource(supportsPrefetch: boolean) {
    const created: any[] = []
    class FakeODataStore {
        constructor(public cfg: any) { created.push(cfg) }
        load() { return Promise.resolve([]) }
        byKey() { return Promise.resolve(null) }
    }
    class FakeDataSource {
        constructor(public cfg: any) {}
        store() { return this.cfg.store }
        load() { return Promise.resolve([]) }
    }
    if (supportsPrefetch) (FakeODataStore as any)[Symbol.for('mono.prefetch')] = true
    return { source: { DataSource: FakeDataSource, ODataStore: FakeODataStore, CustomStore: FakeODataStore } as any, created }
}

beforeEach(() => {
    document.cookie = 'API_token=tok-1; path=/'
})

afterEach(() => {
    setPrefetchBridge(null)
    vi.unstubAllGlobals()
})

describe('useFetchOData({ prefetch })', () => {
    const build = (source: any, over: Record<string, any> = {}) => useFetchOData<any>({
        url: '/Items', baseUrl: 'https://api.test/odata', type: 'datasource', source, options: {},
        prefetch: true, tokenOptions: { name: 'API_token' }, ...over,
    } as any)

    it('hands a supporting store `prefetch` with the auth COOKIE name (never the token)', async () => {
        const { source, created } = fakeSource(true)
        await build(source)
        expect(created[0].prefetch).toEqual({ auth: { cookie: 'API_token' } })
    })

    it('plain DevExtreme stores, or no `prefetch`, never see the option', async () => {
        const plain = fakeSource(false)
        await build(plain.source)
        expect('prefetch' in plain.created[0]).toBe(false)

        const off = fakeSource(true)
        await build(off.source, { prefetch: false })
        expect('prefetch' in off.created[0]).toBe(false)
    })
})

describe('useNormalFetch({ prefetch })', () => {
    it('answers from the bridge with the success shape, and still reports the request', async () => {
        const fetchSpy = vi.fn()
        vi.stubGlobal('fetch', fetchSpy)
        const { bridge, learned } = createBridge({ [key('https://api.test/rest/me')]: { data: { name: 'A' }, message: 'ok' } })
        setPrefetchBridge(bridge)

        const result = await useNormalFetch<any>('/me', { baseUrl: 'https://api.test/rest', prefetch: true, tokenOptions: { name: 'API_token' } })
        expect(result).toEqual({ data: { name: 'A' }, statusCode: 200, message: 'ok', all: { data: { name: 'A' }, message: 'ok' } })
        expect(fetchSpy).not.toHaveBeenCalled()
        expect(learned).toEqual([{ url: 'https://api.test/rest/me', auth: { cookie: 'API_token' } }])
    })

    it('fetches as usual on a miss, never prefetches writes, and strips the option from fetch', async () => {
        const fetchSpy = vi.fn(async () => new Response(JSON.stringify({ data: [1] }), { status: 200 }))
        vi.stubGlobal('fetch', fetchSpy)
        const { bridge, learned } = createBridge()
        setPrefetchBridge(bridge)

        const result = await useNormalFetch<any>('/items', { baseUrl: 'https://api.test/rest', prefetch: true })
        expect(result.data).toEqual([1])
        expect(fetchSpy).toHaveBeenCalledTimes(1)
        expect((fetchSpy.mock.calls[0] as any[])[1]).not.toHaveProperty('prefetch')
        expect(learned.map(r => r.url)).toEqual(['https://api.test/rest/items'])

        await useNormalFetch<any>('/items', { baseUrl: 'https://api.test/rest', prefetch: true, method: 'POST', body: '{}' })
        expect(learned).toHaveLength(1)
    })

    it('without a bridge nothing is reported or served', async () => {
        const fetchSpy = vi.fn(async () => new Response(JSON.stringify({ data: 1 }), { status: 200 }))
        vi.stubGlobal('fetch', fetchSpy)
        const result = await useNormalFetch<any>('/x', { baseUrl: 'https://api.test/rest', prefetch: true })
        expect(result.data).toBe(1)
        expect(fetchSpy).toHaveBeenCalledTimes(1)
    })
})

describe('serving needs no flag', () => {
    it('REST: a GET the host prefetched is answered without `prefetch: true` (and not reported); `false` opts out', async () => {
        const fetchSpy = vi.fn(async () => new Response(JSON.stringify({ data: 'net' }), { status: 200 }))
        vi.stubGlobal('fetch', fetchSpy)
        const { bridge, learned } = createBridge({ [key('https://api.test/rest/a')]: { data: 'pre' }, [key('https://api.test/rest/b')]: { data: 'pre' } })
        setPrefetchBridge(bridge)

        expect((await useNormalFetch<any>('/a', { baseUrl: 'https://api.test/rest' })).data).toBe('pre')
        expect((await useNormalFetch<any>('/b', { baseUrl: 'https://api.test/rest', prefetch: false })).data).toBe('net')
        expect(learned).toEqual([])
        expect(fetchSpy).toHaveBeenCalledTimes(1)
    })
})

describe('capture (`.prefetch()` twins on the server) with @mono-lit/data stores', async () => {
    const data = await import('../../data/pkg/index')
    const source = { DataSource: data.DataSource, ODataStore: data.ODataStore, CustomStore: data.CustomStore } as any

    const capture = async (over: Record<string, any>, load?: Record<string, unknown>) => {
        const emitted: MonoPrefetchRequest[] = []
        const fetchSpy = vi.fn()
        vi.stubGlobal('fetch', fetchSpy)
        const result = await useFetchOData<any>({
            url: '/Items', baseUrl: 'https://api.test/odata', source, token: 'mono-prefetch-capture',
            __capture: { emit: (r: MonoPrefetchRequest) => emitted.push(r), auth: { cookie: 'API_token' }, ...(load ? { load } : {}) },
            ...over,
        } as any)
        expect(fetchSpy).not.toHaveBeenCalled()
        return { emitted, result }
    }

    it('`data`: emits exactly the request the call sends (raw-string filter quirks included), never the token', async () => {
        const { emitted, result } = await capture({ type: 'data', options: { key: 'Id', pageSize: 0, select: ['Id', 'Name'], filter: ['Aktif eq true'] } })
        expect(result.error).toBeNull()
        expect(emitted).toEqual([{
            url: 'https://api.test/odata/Items',
            query: { $select: 'Id,Name', $filter: 'Aktif eq true eq true' },
            auth: { cookie: 'API_token' },
        }])
    })

    it('`datasource`: emits the first page a bound grid loads', async () => {
        const { emitted } = await capture({ type: 'datasource', options: { key: 'Id', pageSize: 25, paginate: true, requireTotalCount: true } })
        expect(emitted.map(r => r.query)).toEqual([{ $top: 25, $count: 'true' }])
    })

    it('`load` (`.prefetchLoad()`): emits ONE store load with exactly those load options, as a session cache sends it', async () => {
        const load = { select: ['Id', 'CompanyName'], filter: ['Id', '=', 1], skip: 0, take: 5 }
        const { emitted } = await capture({ type: 'datasource', options: { key: 'Id', select: ['Id', 'CompanyName'] } }, load)
        // the same load sent for real (what the browser's cache does)
        const sent: string[] = []
        vi.stubGlobal('fetch', vi.fn(async (url: string) => { sent.push(String(url)); return new Response(JSON.stringify({ value: [] }), { headers: { 'content-type': 'application/json' } }) }))
        const real = await useFetchOData<any>({ url: '/Items', baseUrl: 'https://api.test/odata', source, token: 't', type: 'datasource', options: { key: 'Id', select: ['Id', 'CompanyName'] } } as any)
        await real.dataSource!.store().load(load as any)
        expect(emitted).toHaveLength(1)
        const url = new URL(sent[0]!)
        expect(Object.fromEntries(url.searchParams)).toEqual(Object.fromEntries(Object.entries(emitted[0]!.query ?? {}).map(([k, v]) => [k, String(v)])))
        expect(emitted[0]!.url).toBe(url.origin + url.pathname)
    })

    it('`$apply` in the url and params stay where the browser puts them', async () => {
        const { emitted } = await capture({ type: 'data', url: '/Items?$apply=groupby((A))', options: { key: 'Id', pageSize: 0 } })
        expect(emitted).toEqual([{ url: 'https://api.test/odata/Items?$apply=groupby((A))', auth: { cookie: 'API_token' } }])
    })

    it('concurrent captures never mix (per-store provider, no shared in-flight loads)', async () => {
        const [a, b] = await Promise.all([
            capture({ type: 'data', options: { key: 'Id', pageSize: 0 } }),
            capture({ type: 'data', options: { key: 'Id', pageSize: 0 } }),
        ])
        expect(a.emitted).toHaveLength(1)
        expect(b.emitted).toHaveLength(1)
    })

    it('a plain DevExtreme-like store (no prefetch support) cannot be described', async () => {
        class Plain { constructor(public cfg: any) {} load() { return Promise.resolve([]) } }
        const plain = { DataSource: data.DataSource, ODataStore: Plain, CustomStore: Plain } as any
        const { emitted, result } = await capture({ type: 'data', source: plain, options: { key: 'Id' } })
        expect(emitted).toEqual([])
        expect(result.error?.message).toMatch(/needs a data layer/)
    })
})

describe('plain DevExtreme stores (@mono-lit/devextreme): learned requests', () => {
    const build = (source: any, over: Record<string, any> = {}) => useFetchOData<any>({
        url: '/Items', baseUrl: 'https://api.test/odata', type: 'datasource', source, options: {},
        prefetch: true, tokenOptions: { name: 'API_token' }, ...over,
    } as any)
    const URL_ = 'https://api.test/odata/Items'

    it('reports the FIRST collection load as sent (auth COOKIE name, never the token); not pages, not byKey', async () => {
        const { bridge, learned } = createBridge()
        setPrefetchBridge(bridge)
        const { source, created } = fakeSource(false)
        await build(source, { headers: { 'X-Tenant': 't1' } })
        const beforeSend = created[0].beforeSend
        expect('prefetch' in created[0]).toBe(false) // the plain store never sees the option

        beforeSend({ url: `${URL_}(1)`, method: 'get', params: {}, headers: {} }) // byKey first
        const first = { url: URL_, method: 'get', params: { $top: 25, $count: 'true' }, headers: {} as any }
        beforeSend(first)
        expect(first.headers.Authorization).toBe('Bearer tok-1')
        beforeSend({ url: URL_, method: 'get', params: { $top: 25, $skip: 25 }, headers: {} }) // page 2

        expect(learned).toEqual([{ url: URL_, query: { $top: 25, $count: 'true' }, headers: { 'X-Tenant': 't1' }, auth: { cookie: 'API_token' } }])
    })

    it('reports nothing without `prefetch`', async () => {
        const { bridge, learned } = createBridge()
        setPrefetchBridge(bridge)
        const { source, created } = fakeSource(false)
        await build(source, { prefetch: false })
        created[0].beforeSend({ url: URL_, method: 'get', params: {}, headers: {} })
        expect(learned).toEqual([])
    })

    it('a learned load is answered right where DevExtreme sends it, and parsed like a response; others go to the network', async () => {
        // Answered at the XHR the store's own send opens — no access to DevExtreme's modules needed
        // (in Vite dev the data layer carries its own copy of them).
        const sent: string[] = []
        class FakeXhr {
            withCredentials = false
            readyState = 1
            status = 0
            onreadystatechange: any = null
            url = ''
            open(_method: string, url: string) { this.url = url }
            setRequestHeader() {}
            send() { sent.push(this.url) }
            abort() {}
        }
        const realXhr = window.XMLHttpRequest
        ;(window as any).XMLHttpRequest = FakeXhr // DevExtreme reads it off `window`
        vi.stubGlobal('XMLHttpRequest', FakeXhr)
        onTestFinished(() => { (window as any).XMLHttpRequest = realXhr })
        const { default: DataSource } = await import('devextreme/data/data_source')
        const { default: ODataStore } = await import('devextreme/data/odata/store')
        const stores: any[] = []
        class SpyStore extends (ODataStore as any) { constructor(cfg: any) { super(cfg); stores.push(this) } }
        const source = { DataSource, ODataStore: SpyStore, CustomStore: SpyStore } as any

        const body = { '@odata.count': 2, 'value': [{ Id: 1, At: '2026-01-02T03:04:05Z' }, { Id: 2, At: null }] }
        const { bridge, taken } = createBridge({ [key(URL_, { $top: 2, $count: 'true' })]: body })
        setPrefetchBridge(bridge)

        await build(source, { prefetch: undefined, options: { key: 'Id', version: 4, deserializeDates: true } })
        const store = stores[0]
        const [rows, extra] = await new Promise<any[]>((resolve, reject) => {
            store.load({ take: 2, requireTotalCount: true }).done((data: any, more: any) => resolve([data, more])).fail(reject)
        })
        expect(rows.map((r: any) => r.Id)).toEqual([1, 2])
        expect(rows[0].At).toBeInstanceOf(Date)
        expect(extra).toEqual({ totalCount: 2 })
        expect(taken).toHaveLength(1)
        expect(sent).toEqual([])

        // already taken → not expected any more: the same load goes to the network
        store.load({ take: 2, requireTotalCount: true }).fail(() => {})
        expect(sent).toHaveLength(1)
        expect(sent[0].startsWith(`${URL_}?`)).toBe(true)
        // an unrelated XHR is never touched
        const other = new (window as any).XMLHttpRequest()
        other.open('GET', URL_)
        other.send()
        expect(sent).toHaveLength(2)
    })

    it('`prefetch: false` opts a plain store out of serving', async () => {
        const { bridge } = createBridge({ [key(URL_, {})]: { value: [] } })
        const expects = vi.spyOn(bridge, 'expects')
        setPrefetchBridge(bridge)
        const { source, created } = fakeSource(false)
        await build(source, { prefetch: false })
        created[0].beforeSend({ url: URL_, method: 'get', params: {}, headers: {} })
        expect(expects).not.toHaveBeenCalled()
    })
})
