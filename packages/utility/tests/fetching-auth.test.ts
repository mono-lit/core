import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

/**
 * Token refresh, driven from `mono.config.ts` `fetching.auth`.
 *
 * These assert on what actually reaches the core fetch layer (src/core), not on the resolvers in isolation:
 * the whole point of the feature is that `config` + `tokenOptions` land on the core call.
 * The core gates its entire refresh machinery on those two arguments (`ensureFreshToken`
 * returns early without `tokenOptions.fetchParams.url`; `refreshTokenOnce` no-ops without
 * `config`), so "they were computed correctly but never passed" is a silent no-op — which
 * is exactly the bug class these cover.
 */

const coreCalls: Record<string, any[]> = {
    fetchOData: [],
    createFetcher: [],
    createUniqueFetcher: [],
    fetchNormal: [],
}

vi.mock('../src/core', () => ({
    fetchOData: (...args: any[]) => {
        coreCalls.fetchOData.push(args)
        return Promise.resolve({ data: null, dataSource: null, statusCode: 200, error: null })
    },
    createFetcher: (...args: any[]) => {
        coreCalls.createFetcher.push(args)
        return { response: () => Promise.resolve({ data: null, dataSource: null, statusCode: 200, error: null }) }
    },
    createUniqueFetcher: (...args: any[]) => {
        coreCalls.createUniqueFetcher.push(args)
        return Promise.resolve({ data: null, dataSource: null, statusCode: 200, error: null })
    },
    fetchNormal: (...args: any[]) => {
        coreCalls.fetchNormal.push(args)
        return Promise.resolve({ statusCode: 200, data: null, message: null, all: null })
    },
    tryCatchDatasource: vi.fn(),
    MonoCreateStaticDatasource: vi.fn(),
    loadChuckStore: vi.fn(),
}))

/** The live `document.cookie`, as far as these tests are concerned. */
let liveCookies: Record<string, string | undefined> = {}
let hydratedState: { cookie: Record<string, string | undefined> } = { cookie: {} }
let config: any = {}

vi.mock('../pkg/runtime', () => ({
    monoConfig: () => config,
    monoState: () => hydratedState,
    monoStatePatch: (patch: any) => {
        hydratedState = { ...hydratedState, cookie: { ...hydratedState.cookie, ...patch.cookie } }
    },
    monoCookie: () => ({
        get: (name: string) => liveCookies[name],
    }),
}))

const {
    monoOdataFetch,
    monoFetchOdata,
    monoOdataFetchUnique,
    monoFetchOdataUnique,
    monoFetch,
    monoCreateFetcher,
    monoRequestToken,
    monoResetFetchingConfig,
} =
    await import('../pkg/wrapper-fetching')

const API_COOKIE = 'MONO_tokenRefresh'
const REFRESH_COOKIE = 'MONO_token'

/** The shape the user's `mono.config.ts` declares. */
function authConfig(overrides: Record<string, any> = {}) {
    return {
        fetching: {
            api: { main: { type: 'restful', url: 'https://api.test' } },
            auth: {
                use: {
                    apiRequest: API_COOKIE,
                    refreshTokenRequest: REFRESH_COOKIE,
                },
                requestRefreshTokenRequest: {
                    name: API_COOKIE,
                    path: { milis: 'Expired', value: 'RefreshToken' },
                    splitCookie: false,
                    fetchParams: {
                        url: '/Auth/RefreshToken',
                        options: { method: 'POST', baseUrl: 'https://api.test' },
                    },
                },
                ...overrides,
            },
            source: {},
        },
        cookie: [
            { name: REFRESH_COOKIE, split: true },
            { name: API_COOKIE },
        ],
    }
}

beforeEach(() => {
    for (const key of Object.keys(coreCalls)) coreCalls[key] = []
    liveCookies = {}
    hydratedState = { cookie: {} }
    config = authConfig()
    monoResetFetchingConfig()
})

afterEach(() => {
    vi.restoreAllMocks()
})

describe('the OData helpers are exported under both spellings', () => {
    // The docs standardize on monoFetchOdata; the original names stay exported so
    // existing apps keep working. Both must resolve to the SAME function.
    it('monoFetchOdata is monoOdataFetch', () => {
        expect(monoFetchOdata).toBe(monoOdataFetch)
    })

    it('monoFetchOdataUnique is monoOdataFetchUnique', () => {
        expect(monoFetchOdataUnique).toBe(monoOdataFetchUnique)
    })
})

describe('which cookie goes on which request', () => {
    it('sends the `use.apiRequest` cookie on an API call', () => {
        liveCookies[API_COOKIE] = 'api-token'
        liveCookies[REFRESH_COOKIE] = 'refresh-token'

        expect(monoRequestToken()).toBe('api-token')
    })

    it('falls back to the other configured cookie rather than sending nothing', () => {
        liveCookies[REFRESH_COOKIE] = 'refresh-token'

        expect(monoRequestToken()).toBe('refresh-token')
    })

    it('still honours the legacy string `use` (the hosts declare it, and remotes merge onto them)', () => {
        config = {
            fetching: {
                auth: { token: 'H_token', tokenRefresh: 'H_tokenRefresh', use: 'tokenRefresh' },
            },
            cookie: [{ name: 'H_token' }, { name: 'H_tokenRefresh' }],
        }
        liveCookies['H_tokenRefresh'] = 'legacy-api-token'

        expect(monoRequestToken()).toBe('legacy-api-token')
    })

    it('a token passed on the call wins over config', () => {
        liveCookies[API_COOKIE] = 'api-token'

        expect(monoRequestToken('manual')).toBe('manual')
    })
})

describe('the live cookie beats the hydrated state', () => {
    // The regression that makes refresh work at all: the core writes the refreshed token
    // straight to `document.cookie` and touches nothing else. Reading the hydrated state
    // first meant that after the FIRST refresh we kept sending the OLD token forever —
    // the refresh appeared to work once, then everything 401'd.
    it('returns the refreshed cookie, not the token hydrated at boot', () => {
        hydratedState = { cookie: { [API_COOKIE]: 'stale-token' } }
        liveCookies[API_COOKIE] = 'freshly-refreshed-token'

        expect(monoRequestToken()).toBe('freshly-refreshed-token')
    })

    it('patches the state so the rest of the app sees the new token too', () => {
        hydratedState = { cookie: { [API_COOKIE]: 'stale-token' } }
        liveCookies[API_COOKIE] = 'freshly-refreshed-token'

        monoRequestToken()

        expect(hydratedState.cookie[API_COOKIE]).toBe('freshly-refreshed-token')
    })

    it('falls back to the hydrated state when there is no live cookie (SSR)', () => {
        hydratedState = { cookie: { [API_COOKIE]: 'ssr-token' } }

        expect(monoRequestToken()).toBe('ssr-token')
    })
})

describe('what the core receives', () => {
    it('gives fetchOData the cookie names and the refresh request', async () => {
        liveCookies[API_COOKIE] = 'api-token'

        await monoOdataFetch({ url: 'Users', configBaseUrl: 'main' })

        const [props] = coreCalls.fetchOData[0]

        // INVERTED ON PURPOSE — the core sends `jwtRefreshName` on API calls and `jwtName` as
        // the Bearer on the refresh call itself. If someone "fixes" this, refresh breaks.
        expect(props.config).toEqual({
            jwtName: REFRESH_COOKIE,
            jwtRefreshName: API_COOKIE,
        })

        // the switch for the core's entire proactive path: ensureFreshToken bails without it
        expect(props.tokenOptions.fetchParams.url).toBe('/Auth/RefreshToken')
        expect(props.tokenOptions.path).toEqual({ milis: 'Expired', value: 'RefreshToken' })
        expect(props.tokenOptions.name).toBe(API_COOKIE)
    })

    it('hands the core the live api cookie as the call token', async () => {
        // The core tells a cookie-derived token from a caller's own by byte-equality with the
        // live cookie — only the former keeps following the cookie across refreshes for
        // the life of a DataSource. So the value must arrive exactly as read.
        liveCookies[API_COOKIE] = 'api-token'

        await monoOdataFetch({ url: 'Users', configBaseUrl: 'main' })

        const [props] = coreCalls.fetchOData[0]

        expect(props.token).toBe('api-token')
    })

    it('hands the core a caller token untouched', async () => {
        liveCookies[API_COOKIE] = 'api-token'

        await monoOdataFetch({ url: 'Users', configBaseUrl: 'main', token: 'manual' } as any)

        const [props] = coreCalls.fetchOData[0]

        expect(props.token).toBe('manual')
    })

    it('passes `prefetch` through to the core (monoFetch, monoFetchOdata, monoCreateFetcher)', async () => {
        await monoOdataFetch({ url: 'Users', configBaseUrl: 'main', prefetch: true } as any)
        await monoCreateFetcher({ url: 'Users', configBaseUrl: 'main', prefetch: true } as any).response()
        await monoFetch('/me', { configBaseUrl: 'main', prefetch: true } as any)

        expect(coreCalls.fetchOData[0][0].prefetch).toBe(true)
        expect(coreCalls.createFetcher[0][0].prefetch).toBe(true)
        expect(coreCalls.fetchNormal[0][1].prefetch).toBe(true)
    })

    it('gives createFetcher and createUniqueFetcher the same arguments', async () => {
        await monoCreateFetcher({ url: 'Users', configBaseUrl: 'main' }).response()
        await import('../pkg/wrapper-fetching').then(({ monoOdataFetchUnique }) =>
            monoOdataFetchUnique({ url: 'Users', unique: 'u', configBaseUrl: 'main' } as any),
        )

        for (const [props] of [coreCalls.createFetcher[0], coreCalls.createUniqueFetcher[0]]) {
            expect(props.config).toEqual({ jwtName: REFRESH_COOKIE, jwtRefreshName: API_COOKIE })
            expect(props.tokenOptions.fetchParams.url).toBe('/Auth/RefreshToken')
        }
    })

    it('passes `config` to fetchNormal POSITIONALLY, where the core actually reads it', async () => {
        // fetchNormal(url, options, config) — `config` inside the options object is dropped
        // on the floor and refresh stays dormant. This is the test that catches that.
        await monoFetch('/Users', { configBaseUrl: 'main' } as any)

        const [url, options, cfg] = coreCalls.fetchNormal[0]

        expect(url).toBe('/Users')
        expect(cfg).toEqual({ jwtName: REFRESH_COOKIE, jwtRefreshName: API_COOKIE })
        expect(options.tokenOptions.fetchParams.url).toBe('/Auth/RefreshToken')
    })

    it("lets a caller's own config and tokenOptions win", async () => {
        const own = { jwtName: 'own_a', jwtRefreshName: 'own_b' }

        await monoOdataFetch({
            url: 'Users',
            configBaseUrl: 'main',
            config: own,
            tokenOptions: { name: 'own', fetchParams: { url: '/Own/Refresh' } },
        } as any)

        const [props] = coreCalls.fetchOData[0]

        expect(props.config).toEqual(own)
        expect(props.tokenOptions.fetchParams.url).toBe('/Own/Refresh')
    })

    it('sends no refresh request when the app declares none', async () => {
        const bare = authConfig()
        delete (bare.fetching.auth as any).requestRefreshTokenRequest
        config = bare

        await monoOdataFetch({ url: 'Users', configBaseUrl: 'main' })

        const [props] = coreCalls.fetchOData[0]

        // The core's refresh machinery stays dormant — mono's behaviour before this existed
        expect(props.tokenOptions).toBeUndefined()
        expect(props.config).toEqual({ jwtName: REFRESH_COOKIE, jwtRefreshName: API_COOKIE })
    })
})

describe('the refresh request itself', () => {
    it('inherits `splitCookie` and `baseUrl` when they are omitted', async () => {
        const cfg = authConfig()
        const refresh = (cfg.fetching.auth as any).requestRefreshTokenRequest
        refresh.name = REFRESH_COOKIE // declared with `split: true` in cookie[]
        delete refresh.splitCookie
        delete refresh.fetchParams.options.baseUrl
        config = cfg

        await monoOdataFetch({ url: 'Users', configBaseUrl: 'main' })

        const [props] = coreCalls.fetchOData[0]

        // split comes from the cookie[] entry — that's the point of naming cookies in `use`
        expect(props.tokenOptions.splitCookie).toBe(true)
        expect(props.tokenOptions.fetchParams.options.baseUrl).toBe('https://api.test')
    })

    it('falls back to the REST api, not the base of the odata call that triggered it', async () => {
        // The refresh endpoint (`/Auth/RefreshToken`) is a REST route. Defaulting its
        // baseUrl to the triggering call's entry sends it to the `/odata` root — a 404 on
        // every refresh, with the config looking perfectly reasonable.
        const cfg = authConfig()
        cfg.fetching.api = {
            hostRest: { type: 'restful', url: 'https://api.test' },
            hostOdata: { type: 'odata', url: 'https://api.test/odata' },
        } as any
        delete (cfg.fetching.auth as any).requestRefreshTokenRequest.fetchParams.options.baseUrl
        config = cfg

        await monoOdataFetch({ url: 'Users', configBaseUrl: 'hostOdata' })

        const [props] = coreCalls.fetchOData[0]

        expect(props.tokenOptions.fetchParams.options.baseUrl).toBe('https://api.test')
    })

    it('warns when `path` declares no lifetime', async () => {
        const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})

        const cfg = authConfig()
        // no `milis`, no `days` — the token cookie's add() bails, so the refreshed token is never
        // written and the refresh "succeeds" while changing nothing
        ;(cfg.fetching.auth as any).requestRefreshTokenRequest.path = { value: 'RefreshToken' }
        config = cfg

        await monoOdataFetch({ url: 'Users', configBaseUrl: 'main' })

        expect(warn).toHaveBeenCalledWith(expect.stringContaining('neither `milis` nor `days`'))
    })
})

describe('the mock backend', () => {
    it('never triggers a token refresh — it has no auth surface', async () => {
        config = {
            ...authConfig(),
            mockIndexedDB: {
                dbName: 'auth-test-mock',
                schema: {
                    'flow-mock': {
                        nodes: { fields: { Id: 'number|primary', Name: 'string' }, seed: [{ Id: 1, Name: 'a' }] },
                    },
                },
            },
        }

        await monoFetch('/flow-mock/nodes', {} as any)

        expect(coreCalls.fetchNormal).toHaveLength(0)
    })
})

describe('`.prefetch()` twins (described on the server for definePrefetch, nothing sent)', () => {
    const collect = async (descriptor: any) => {
        expect(descriptor[Symbol.for('nuxt-pre-fetch.descriptor')]).toBe(true)
        const emitted: any[] = []
        await descriptor.collect({}, (request: any) => emitted.push(request))
        return emitted
    }

    it('monoFetch.prefetch emits the GET the browser call sends, with the api cookie as auth', async () => {
        const emitted = await collect(monoFetch.prefetch('/me', { configBaseUrl: 'main' } as any))
        expect(emitted).toEqual([{ url: 'https://api.test/me', headers: {}, auth: { cookie: API_COOKIE } }])
        expect(coreCalls.fetchNormal).toEqual([])
        // writes are never prefetched
        expect(await collect(monoFetch.prefetch('/me', { configBaseUrl: 'main', method: 'POST', body: '{}' } as any))).toEqual([])
    })

    /** An OData entry whose stores support describing (what @mono-lit/data's classes are flagged with). */
    const withDataLayer = () => {
        class DataLayerStore {}
        ;(DataLayerStore as any)[Symbol.for('mono.prefetch')] = true
        config = authConfig()
        config.fetching.api.od = { type: 'odata', url: 'https://api.test/odata' }
        config.fetching.source = { oDataStore: DataLayerStore }
    }

    it('monoFetchOdata.prefetch runs the same call in capture mode (no token read, no notif)', async () => {
        withDataLayer()
        const descriptor = monoFetchOdata.prefetch({ url: 'Users', configBaseUrl: 'od', type: 'data', options: { key: 'Id' } } as any)
        await descriptor.collect({}, () => {})
        const [props] = coreCalls.fetchOData[0]
        expect(props.__capture.auth).toEqual({ cookie: API_COOKIE })
        expect(typeof props.__capture.emit).toBe('function')
        expect(props.token).toBe('mono-prefetch-capture')
        expect(props.notif).toBe(false)
        expect(props.url).toBe('Users')
    })

    it('monoCreateFetcher(...).prefetch(option) captures `.response(option)`', async () => {
        withDataLayer()
        const fetcher = monoCreateFetcher({ url: 'Users', configBaseUrl: 'od' })
        expect(coreCalls.createFetcher).toEqual([]) // resolved lazily: describing never reads a token
        await fetcher.prefetch({ options: { pageSize: 25 } } as any).collect({}, () => {})
        const [props] = coreCalls.createFetcher[0]
        expect(props.__capture.auth).toEqual({ cookie: API_COOKIE })
        expect(props.token).toBe('mono-prefetch-capture')
    })

    it('plain DevExtreme (@mono-lit/devextreme): OData twins describe nothing and never throw — no store built; REST twins still work', async () => {
        config.fetching.api.od = { type: 'odata', url: 'https://api.test/odata' }
        expect(await collect(monoFetchOdata.prefetch({ url: 'Users', configBaseUrl: 'od', type: 'data' } as any))).toEqual([])
        expect(await collect(monoCreateFetcher({ url: 'Users', configBaseUrl: 'od' }).prefetch())).toEqual([])
        expect(await collect(monoCreateFetcher({ url: 'Users', configBaseUrl: 'od' }).prefetchLoad({ take: 5 }))).toEqual([])
        expect(coreCalls.fetchOData).toEqual([])
        expect(coreCalls.createFetcher).toEqual([])
        expect(await collect(monoFetch.prefetch('/me', { configBaseUrl: 'main' } as any))).toHaveLength(1)
    })

    it('monoCreateFetcher(...).prefetchLoad(loadOptions, option) captures ONE store load with exactly those options', async () => {
        withDataLayer()
        await monoCreateFetcher({ url: 'Users', configBaseUrl: 'od' })
            .prefetchLoad({ filter: ['Id', '=', 1], take: 1 }, { options: { key: 'Id' } } as any)
            .collect({ learn: false }, () => {})
        const [props] = coreCalls.createFetcher[0]
        expect(props.__capture.load).toEqual({ filter: ['Id', '=', 1], take: 1 })
        expect(props.token).toBe('mono-prefetch-capture')
    })

    it('monoPrefetchContext: the JWT claims the browser state would hold, from the request cookies', async () => {
        const { monoPrefetchContext } = await import('../pkg/wrapper-fetching')
        const payload = btoa(JSON.stringify({ COMPANY_ID: '3', IS_SUPERADMIN: '0' })).replace(/=+$/, '')
        const token = `eyJhbGciOiJIUzI1NiJ9.${payload}.c2lnbmF0dXJl`
        config = { ...authConfig(), jwt: { token: { name: REFRESH_COOKIE, split: true } } }
        const ctx = monoPrefetchContext({ cookies: { [`${REFRESH_COOKIE}_split_1`]: token.slice(20), [`${REFRESH_COOKIE}_split_0`]: token.slice(0, 20), [API_COOKIE]: 'api' } })
        expect(ctx.jwt.token).toMatchObject({ COMPANY_ID: '3', IS_SUPERADMIN: '0' })
        expect(ctx.cookie(API_COOKIE)).toBe('api')
    })
})
