import { describe, it, expect, vi, beforeEach } from 'vitest'

/**
 * `tanstack` on the fetch helpers is opt-in AND feature-detected:
 *   - monoOdataFetch / monoFetchOdata forward it to the core's `fetchOData`, which hands it only to
 *     store classes flagged with `Symbol.for('mono.tanstack')` (covered in the core-* tests);
 *   - monoFetch runs through the installed `@mono-lit/devextreme`'s `tanstackRun` export when there is
 *     one, and is a plain `fetchNormal` call when there isn't (the DevExtreme re-export).
 */

type FetchResult = { statusCode: number; data: any; message: string | null; all: any }

const calls = { fetchOData: [] as any[][], fetchNormal: [] as any[][], runner: [] as any[] }
let normalResults: FetchResult[] = []

const ok = (data: any = [{ id: 1 }]): FetchResult => ({ statusCode: 200, data, message: null, all: null })
const failed = (statusCode: number): FetchResult => ({ statusCode, data: null, message: 'nope', all: null })

/** Minimal stand-in for a TanStack-backed runner: retries thrown failures up to `tanstack.retry`. */
async function fakeRunner(options: any) {
    calls.runner.push(options)
    const max = typeof options.tanstack?.retry === 'number' ? options.tanstack.retry : 0
    for (let attempt = 0; ; attempt++) {
        try {
            return await options.task(new AbortController().signal)
        } catch (error: any) {
            const status = error?.statusCode
            const retryable = status === 0 || status === 408 || status === 429 || status >= 500
            if (attempt >= max || !retryable) throw error
        }
    }
}

async function loadFetching(withRunner: boolean) {
    vi.resetModules()
    vi.doMock('@mono-lit/devextreme', () => ({
        DataSource: class {},
        ODataStore: class {},
        CustomStore: class {},
        // the plain DevExtreme re-export has no runner (vitest mocks need the key declared)
        tanstackRun: withRunner ? fakeRunner : undefined,
    }))
    vi.doMock('../src/core', () => ({
        fetchOData: (...args: any[]) => {
            calls.fetchOData.push(args)
            return Promise.resolve({ data: null, dataSource: null, statusCode: 200, error: null })
        },
        fetchNormal: (...args: any[]) => {
            calls.fetchNormal.push(args)
            return Promise.resolve(normalResults.shift() ?? ok())
        },
        createFetcher: vi.fn(),
        createUniqueFetcher: vi.fn(),
        tryCatchDatasource: vi.fn(),
        MonoCreateStaticDatasource: vi.fn(),
        loadChuckStore: vi.fn(),
    }))
    vi.doMock('../pkg/runtime', () => ({
        monoConfig: () => ({}),
        monoState: () => ({ cookie: {} }),
        monoStatePatch: () => {},
        monoCookie: () => ({ get: () => undefined }),
    }))
    return await import('../pkg/wrapper-fetching')
}

beforeEach(() => {
    calls.fetchOData = []
    calls.fetchNormal = []
    calls.runner = []
    normalResults = []
})

describe('monoOdataFetch({ tanstack })', () => {
    it('forwards the option to the core fetchOData (both export names)', async () => {
        const { monoOdataFetch, monoFetchOdata } = await loadFetching(true)
        const tanstack = { retry: 2, networkMode: 'online' as const }
        await monoOdataFetch({ url: '/Items', baseUrl: 'https://api.test/odata', tanstack } as any)
        await monoFetchOdata({ url: '/Items', baseUrl: 'https://api.test/odata', tanstack } as any)
        expect(calls.fetchOData.map((args) => args[0].tanstack)).toEqual([tanstack, tanstack])
    })
})

describe('monoFetch(url, { tanstack }) — runner available', () => {
    it('runs a GET as a query with a stable key; signal reaches fetchNormal; tanstack is not sent', async () => {
        const { monoFetch } = await loadFetching(true)
        const tanstack = { dedupe: true, staleTime: 5_000 }
        const result = await monoFetch('/users', { baseUrl: 'https://api.test', tanstack } as any)
        expect(result.statusCode).toBe(200)
        expect(calls.runner).toHaveLength(1)
        expect(calls.runner[0]).toMatchObject({ kind: 'query', tanstack, key: ['mono-fetch', 'GET', 'https://api.test/users', null] })
        const [, init] = calls.fetchNormal[0]
        expect(init.signal).toBeInstanceOf(AbortSignal)
        expect('tanstack' in init).toBe(false)
    })

    it('runs other methods as a mutation', async () => {
        const { monoFetch } = await loadFetching(true)
        await monoFetch('/users', { baseUrl: 'https://api.test', method: 'POST', body: '{"a":1}', tanstack: { networkMode: 'online' } } as any)
        expect(calls.runner[0].kind).toBe('mutation')
    })

    it('retries a 5xx result and returns the success', async () => {
        const { monoFetch } = await loadFetching(true)
        normalResults = [failed(503), failed(502), ok(['third time'])]
        const result = await monoFetch('/flaky', { baseUrl: 'https://api.test', tanstack: { retry: 3 } } as any)
        expect(result.data).toEqual(['third time'])
        expect(calls.fetchNormal).toHaveLength(3)
    })

    it('a 4xx is returned as-is (not retried, not thrown)', async () => {
        const { monoFetch } = await loadFetching(true)
        normalResults = [failed(404)]
        const result = await monoFetch('/missing', { baseUrl: 'https://api.test', tanstack: { retry: 3 } } as any)
        expect(result).toEqual(failed(404))
        expect(calls.fetchNormal).toHaveLength(1)
    })

    it('out of retries: the last failure result comes back unchanged', async () => {
        const { monoFetch } = await loadFetching(true)
        normalResults = [failed(500), failed(500)]
        const result = await monoFetch('/down', { baseUrl: 'https://api.test', tanstack: { retry: 1 } } as any)
        expect(result).toEqual(failed(500))
        expect(calls.fetchNormal).toHaveLength(2)
    })

    it('without `tanstack` the runner is not used', async () => {
        const { monoFetch } = await loadFetching(true)
        await monoFetch('/users', { baseUrl: 'https://api.test' } as any)
        expect(calls.runner).toHaveLength(0)
        expect(calls.fetchNormal).toHaveLength(1)
    })
})

describe('monoFetch(url, { tanstack }) — plain DevExtreme (no runner)', () => {
    it('tanstack is a silent no-op: one direct fetchNormal call, option not sent', async () => {
        const { monoFetch } = await loadFetching(false)
        normalResults = [failed(503)]
        const result = await monoFetch('/users', { baseUrl: 'https://api.test', tanstack: { retry: 3 } } as any)
        expect(result).toEqual(failed(503))
        expect(calls.fetchNormal).toHaveLength(1)
        const [, init] = calls.fetchNormal[0]
        expect('tanstack' in init).toBe(false)
        expect('signal' in init).toBe(false)
    })
})
