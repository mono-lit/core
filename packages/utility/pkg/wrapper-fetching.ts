import type DataSource from 'devextreme/data/data_source'
import type ODataStore from 'devextreme/data/odata/store'
import type CustomStore from 'devextreme/data/custom_store'

import {
    DataSource as DataSourceFetch,
    ODataStore as ODataStoreFetch,
    CustomStore as CustomStoreFetch
} from '@mono-lit/devextreme'
// The whole module, to feature-detect an optional `tanstackRun` export (see `useMyFetch`).
import * as monoDevextremeModule from '@mono-lit/devextreme'

import {
    type MonoNormalFetchTypes,
    type MonoTanstackFetchTypes,
    type MonoUseOdataStaticTypes,
    type MonoOdataFetchUniqueTypes,
    type MonoOdataFetchTypes,
    type MonoTryCatchDatasourceTypes,
    type MonoStoreChunkTypes,
} from '../src/core'

import {
    createFetcher,
    tryCatchDatasource,
    MonoCreateStaticDatasource,
    fetchOData,
    createUniqueFetcher,
    fetchNormal,
    loadChuckStore
} from '../src/core'

import {
    monoConfig,
    monoState,
    monoStatePatch,
    monoCookie,
} from './runtime'

import { monoMockDb, matchMockRoute, parseQuery, type ODataQuery } from './mock-db'
import { createMockDataSource, loadOptionsToQuery } from './mock-db/devextreme'
import type { MonoAuthConfig, MonoMockDbConfig } from '../src/composables/create-config'

type FetchError = {
    message: string
    stack: string
    response: any
}

type FetchResult<T> = Promise<{
    data: T | null
    dataSource: DataSource<T> | null
    statusCode: number
    error: FetchError | null
}>

/**
 * `configBaseUrl` names an entry in `fetching.api`. When set, the call's base
 * url (and, for odata, its source constructors) is resolved from that entry,
 * overriding the call's own `baseUrl`. This prop is mono-only and is stripped
 * before delegating to the core fetch layer fetch functions.
 */
type MonoOdataFetchParams = Omit<MonoOdataFetchTypes, 'source'> & { source?: MonoOdataFetchTypes['source'] } & { configBaseUrl?: string }
type MonoOdataUniqueParams<T> = Omit<MonoOdataFetchUniqueTypes<T>, 'source'> & { source?: MonoOdataFetchUniqueTypes<T>['source'] } & { configBaseUrl?: string }
/** The core's `ConfigType`: the two cookie names its token machinery reads. */
type MonoTokenConfig = { jwtName: string; jwtRefreshName: string }

/**
 * `fetchNormal` takes `config` positionally, so the core's own options type has no room for
 * it. Accept it as a prop here and forward it to the right place — a caller shouldn't
 * have to know about that asymmetry.
 */
type MonoNormalFetchParams = MonoNormalFetchTypes & {
    configBaseUrl?: string
    config?: MonoTokenConfig
    /**
     * Opt-in TanStack Query behaviour (dedupe, cache, retries, offline pause). Applied only when the
     * installed `@mono-lit/devextreme` provides a `tanstackRun` export; otherwise ignored.
     */
    tanstack?: MonoTanstackFetchTypes
}

/** Options for `monoFetch(url, { tanstack })` / `monoOdataFetch({ tanstack })`. */
export type MonoTanstackFetchOptions = MonoTanstackFetchTypes

/** The optional TanStack runner, when the installed data layer provides one. */
type TanstackRunner = <R>(options: {
    kind?: 'query' | 'mutation'
    key: unknown
    tanstack?: MonoTanstackFetchTypes
    task: (signal: AbortSignal) => Promise<R>
}) => Promise<R>

function tanstackRunner(): TanstackRunner | undefined {
    // Looked up dynamically: the plain DevExtreme re-export has no such member, and a static
    // `ns.tanstackRun` would make bundlers warn about (or test mocks throw on) a missing export.
    try {
        const runner = Reflect.get(monoDevextremeModule, 'tanstackRun')
        return typeof runner === 'function' ? runner : undefined
    } catch {
        return undefined
    }
}

/** A non-2xx `fetchNormal` result, thrown so TanStack neither caches it nor skips its retry policy. */
class FailedFetchResult {
    constructor(readonly result: { statusCode: number }) {}
    get statusCode() { return this.result.statusCode }
}
type MonoCreateFetcherParams = Omit<MonoOdataFetchTypes, 'source'> & { source?: MonoOdataFetchTypes['source'] } & { configBaseUrl?: string }

type MonoFetchingRuntimeOptions = {
    /**
     * Your app notification object/function.
     * Example from your old code:
     * const { notif } = useHelperMonoVue()
     */
    notif?: any

    /**
     * Override token directly.
     */
    token?: string

    /**
     * Override REST base URL.
     */
    restBaseUrl?: string

    /**
     * Override OData base URL.
     */
    odataBaseUrl?: string

    /**
     * Called when a request is unauthorized and no refresh could save it — typically
     * `() => router.push('/login')`. It lives here rather than in `mono.config.ts`
     * because it needs the router.
     *
     * NOTE: registering it SHORT-CIRCUITS `auth.expiredBehaviour` — the core calls this and
     * returns rather than attempting the reload.
     */
    unauthCall?: () => void
}

let runtimeOptions: MonoFetchingRuntimeOptions = {}

const wrapperDefaults = {
    notif: false,
    selfProxy: '',
    method: 'GET',
    type: 'datasource',
    allowZero: false,
    cache: false,
} as const

function configureFetching(options: MonoFetchingRuntimeOptions = {}) {
    runtimeOptions = {
        ...runtimeOptions,
        ...options,
    }
}

function resetFetchingConfig() {
    runtimeOptions = {}
}

function getFetchingConfig() {
    const config = monoConfig()

    if (!config) {
        throw new Error(
            '[@mono-lit/utility/fetching] mono config is missing. Make sure you call app.use(createMono(monoConfig)) before using fetching helpers.',
        )
    }

    if (!config.fetching) {
        throw new Error(
            '[@mono-lit/utility/fetching] config.fetching is missing in mono.config.ts.',
        )
    }

    return config.fetching
}

type ODataServiceCtor = new (...args: any[]) => any

/**
 * The capitalized source-ctor shape the core fetch layer expects. A partial source is fine
 * — `mapSharedSource` fills every field from the `@mono-lit/devextreme` defaults — but
 * a fully-absent source must NOT reach the core fetch layer: it `import type`s DevExtreme and
 * calls `new source.ODataStore(...)` with no fallback of its own, so a missing
 * ctor crashes with "ods is not a constructor". `getSharedSource` guarantees the
 * three store ctors are always present; `OdataService` stays per-entry.
 */
type ResolvedODataSource = {
    DataSource?: typeof DataSource
    ODataStore?: typeof ODataStore
    CustomStore?: typeof CustomStore
    OdataService?: ODataServiceCtor
}

type ResolvedApiEntry = {
    type: 'restful' | 'odata'
    url: string
    source?: ResolvedODataSource
}

/**
 * Map the shared `fetching.source` ctors to the capitalized shape the core fetch layer
 * expects. Never throws — any missing ctor is left `undefined` and the core fetch layer
 * fills it from its built-in DevExtreme classes.
 */
function mapSharedSource(shared: any): ResolvedODataSource {
    return {
        DataSource: shared?.dataSource || DataSourceFetch,
        ODataStore: shared?.oDataStore || ODataStoreFetch,
        CustomStore: shared?.customStore || CustomStoreFetch,
    }
}

/**
 * Resolve the source for a named odata entry: the shared `fetching.source`
 * ctors plus this entry's own `oDataService` (which differs per API).
 */
function mapEntrySource(entry: any, shared: any): ResolvedODataSource {
    return {
        ...mapSharedSource(shared),
        OdataService: entry.oDataService,
    }
}

/**
 * Merge a base source with an override, letting `override` win — but only on
 * its *defined* keys, so a partial inline source can't clobber a shared ctor
 * with `undefined`. Returns whichever side is present when the other is absent.
 */
function mergeSource(
    base?: ResolvedODataSource,
    override?: ResolvedODataSource,
): ResolvedODataSource | undefined {
    if (!base) return override
    if (!override) return base

    const out: ResolvedODataSource = { ...base }
    for (const key of Object.keys(override) as (keyof ResolvedODataSource)[]) {
        if (override[key] !== undefined) {
            out[key] = override[key] as any
        }
    }
    return out
}

/**
 * The shared OData source ctors: the `@mono-lit/devextreme` defaults baked into
 * `mapSharedSource`, with any `fetching.source` overrides on top. Tolerant of a
 * missing/uninitialized config (`monoConfig()` returns `undefined` → pure
 * defaults), so fully-manual (baseUrl-only) calls still get real constructors.
 *
 * Never returns `undefined`: the core fetch layer does NOT fall back to its own DevExtreme
 * classes (it `import type`s them and calls `new source.ODataStore(...)` with no
 * fallback), so a fully-absent source would crash with "ods is not a constructor".
 */
function getSharedSource(): ResolvedODataSource {
    return mapSharedSource(monoConfig()?.fetching?.source)
}

/**
 * True for a url that is effectively missing. Guards against the common
 * `url: String(import.meta.env.SOME_VAR)` pattern: when the env var is undefined
 * at the moment Vite starts, `String(undefined)` yields the *truthy* literal
 * `"undefined"`, which would otherwise sail past a plain `!entry.url` check and
 * make the fetcher silently request `undefined/<path>` with no error.
 */
function isMissingUrl(url: unknown): boolean {
    if (!url) return true

    const trimmed = String(url).trim()
    return trimmed === '' || trimmed === 'undefined' || trimmed === 'null'
}

/* ------------------------------- mock backend ------------------------------ */

/**
 * The page-wide mock, or null when the app declares no `mockIndexedDB`.
 * Cached inside `monoMockDb()`, so this is cheap to call per request.
 *
 * `monoConfig()` returns a DEEPLY READONLY view of the reactive mono config,
 * so `schema[...].seed` arrives as `readonly T[]` and will not assign to the
 * mutable engine types. Widen it here instead of threading `readonly` through the
 * whole mock-db surface: nothing downstream mutates the config — `generateSeed`
 * copies every seed row (`entity.seed.map(row => ({ ...row }))`) precisely so the
 * config object can never be written through.
 */
function getMockDb() {
    const config = monoConfig()?.mockIndexedDB as MonoMockDbConfig | undefined
    return monoMockDb(config)
}

/**
 * Resolve a call to a mock route, if it is one.
 *
 * Checks BOTH the entry's base url and the call's own `url`, because either can
 * carry the schema's base-url (`fetching.api.x.url = 'my-mock'` + `url: '/users'`,
 * or a plain `url: '/my-mock/users'`).
 *
 * Deliberately tolerant of a missing/`"undefined"` entry url: an app running
 * purely on the mock has no real backend to point at, so this must resolve
 * BEFORE `resolveApiEntry`'s `isMissingUrl` throws.
 */
function resolveMockRoute(configBaseUrl?: string, url?: string) {
    const mock = getMockDb()
    if (!mock) return null

    const entryUrl = (() => {
        if (!configBaseUrl) return ''
        const entry = monoConfig()?.fetching?.api?.[configBaseUrl] as any
        return typeof entry?.url === 'string' ? entry.url : ''
    })()

    for (const candidate of [joinUrl(entryUrl, url), url, entryUrl]) {
        if (!candidate) continue
        const route = matchMockRoute(mock.schemas, candidate)
        if (route) return { mock, route, url: candidate }
    }

    return null
}

function joinUrl(base?: string, path?: string): string {
    const left = String(base ?? '').replace(/\/+$/, '')
    const right = String(path ?? '').replace(/^\/+/, '')
    if (!left) return right
    if (!right) return left
    return `${left}/${right}`
}

/**
 * Serve a fetch call from IndexedDB, shaped exactly like the core fetch layer result so
 * callers cannot tell the difference.
 *
 * `datasource`/`fakedatasource` hand back a real DevExtreme DataSource (over a
 * CustomStore), so grids keep their server-style paging/filtering.
 */
async function serveFromMock<T>(
    hit: NonNullable<ReturnType<typeof resolveMockRoute>>,
    call: {
        type?: string
        method?: string
        params?: any
        payload?: any
        /** The core's DataSourceOptions (`options` on the fetch call). */
        options?: any
    },
): FetchResult<T> {
    const { mock, route, url } = hit
    const wantsDataSource = String(call.type ?? '').toLowerCase().includes('datasource')

    /**
     * The query, from BOTH sources the caller can use:
     *  - `options` — the core's DataSourceOptions (select/filter/sort/expand/pageSize).
     *    the core applies these even for `type: 'data'` (it builds a DataSource from them
     *    and `.load()`s it), so ignoring them here would make the mock return every
     *    row while production returned a filtered set.
     *  - `params`  — raw `$`-params. Explicit, so they win on conflict.
     */
    const query: ODataQuery = {
        ...(call.options ? loadOptionsToQuery(call.options) : {}),
        ...(call.params ? parseQuery(call.params) : {}),
    }

    if (wantsDataSource) {
        const shared = getSharedSource()
        const dataSource = createMockDataSource({
            mock,
            baseUrl: route.schema.baseUrl,
            entity: route.entity,
            DataSource: shared.DataSource,
            CustomStore: shared.CustomStore,
            options: call.options,
        })

        // A write still has to happen even in `datasource` mode — the core's fake*
        // types are used for both reading a grid and POST/PUT-ing a row.
        const method = String(call.method ?? 'GET').toUpperCase()
        if (method !== 'GET') {
            const response = await mock.request<T>({
                url,
                method,
                query,
                // The core's payload envelope is `{ data, keyValue, keyName }` and it writes
                // with `store.update(payload.keyValue, payload.data)` — so the key must
                // be forwarded, not thrown away with the rest of the envelope.
                key: call.payload?.keyValue,
                payload: call.payload?.data ?? call.payload,
            })
            return {
                data: response.data,
                dataSource: dataSource as any,
                statusCode: response.statusCode,
                error: response.error,
            }
        }

        return { data: null, dataSource: dataSource as any, statusCode: 200, error: null }
    }

    const response = await mock.request<T>({
        url,
        method: call.method,
        query,
        key: call.payload?.keyValue,
        payload: call.payload?.data ?? call.payload,
    })

    // `data`/`fakedata` callers expect the rows, not the OData envelope. The core does the
    // same: it builds a DataSource from `options`, `.load()`s it, and hands back the
    // resulting array rather than the DataSource itself.
    const payload: any = response.data
    const data = payload && Array.isArray(payload.value) ? payload.value : payload

    return {
        data: data as T,
        dataSource: null,
        statusCode: response.statusCode,
        error: response.error,
    }
}

/**
 * Look up a named entry in `fetching.api` and resolve its url (+ source for odata).
 */
function resolveApiEntry(name: string): ResolvedApiEntry {
    const fetching = getFetchingConfig()
    const entry = fetching.api?.[name] as any

    if (!entry) {
        throw new Error(
            `[@mono-lit/utility/fetching] fetching.api["${name}"] is not defined in mono.config.ts.`,
        )
    }

    if (isMissingUrl(entry.url)) {
        throw new Error(
            `[@mono-lit/utility/fetching] fetching.api["${name}"].url is missing (got ${JSON.stringify(
                entry.url,
            )}). The backing env var was likely undefined when Vite started — check that mono-env loaded the right .env file (including any synced under .mono/apps/) and restart the dev server.`,
        )
    }

    return {
        type: entry.type,
        url: entry.url,
        source: entry.type === 'odata' ? mapEntrySource(entry, fetching.source) : undefined,
    }
}

function getRestBaseUrl(configBaseUrl?: string, explicitBaseUrl?: string) {
    const url =
        (configBaseUrl ? resolveApiEntry(configBaseUrl).url : '') ||
        explicitBaseUrl ||
        runtimeOptions.restBaseUrl

    if (!url) {
        throw new Error(
            '[@mono-lit/utility/fetching] no base url. Pass `configBaseUrl: "<entryName>"` or `baseUrl`.',
        )
    }

    return url
}

function getODataBaseUrl(configBaseUrl?: string, explicitBaseUrl?: string) {
    const url =
        (configBaseUrl ? resolveApiEntry(configBaseUrl).url : '') ||
        explicitBaseUrl ||
        runtimeOptions.odataBaseUrl

    if (!url) {
        throw new Error(
            '[@mono-lit/utility/fetching] no odata base url. Pass `configBaseUrl: "<entryName>"` or `baseUrl`.',
        )
    }

    return url
}

/**
 * Resolve the OData source ctors. Never throws — when nothing is configured it
 * returns `undefined` and the core fetch layer falls back to its built-in DevExtreme
 * classes.
 *
 * With `configBaseUrl`, the named entry's resolved source wins (already the
 * shared `fetching.source` ctors merged with that entry's `oDataService`).
 * Without it, the shared `fetching.source` is the base, with any inline
 * per-call `source` overriding it per defined field.
 */
function getODataSource(
    configBaseUrl?: string,
    inlineSource?: ResolvedODataSource,
): ResolvedODataSource | undefined {
    if (configBaseUrl) {
        return resolveApiEntry(configBaseUrl).source
    }

    return mergeSource(getSharedSource(), inlineSource)
}

/** The `split` flag a cookie declares in the top-level `cookie[]` array. */
function cookieSplit(name?: string): boolean {
    if (!name) return false
    return Boolean(monoConfig()?.cookie?.find((c) => c.name === name)?.split)
}

/**
 * Read a token cookie.
 *
 * The LIVE cookie wins over the hydrated state, and state is patched when they differ.
 * That order is load-bearing: a token refresh writes the new value straight to
 * `document.cookie` and touches nothing else. Reading the hydrated state first — which
 * is what this used to do — meant that after the very first refresh we kept sending the
 * OLD token forever, so the refresh "worked" once and then everything 401'd.
 *
 * State remains the fallback for SSR, where `monoCookie()` resolves from the h3 event.
 */
function readCookieValue(name: string) {
    const state = monoState<{
        cookie: Record<string, string | undefined>
    }>()

    try {
        const live = monoCookie?.().get(name, cookieSplit(name)) ?? undefined

        if (live) {
            if (state.cookie?.[name] !== live) {
                // keep the reactive state in step with what we're actually sending
                monoStatePatch({ cookie: { [name]: live } })
            }
            return live
        }
    } catch {
        // no document/event — fall through to the hydrated state
    }

    return state.cookie?.[name]
}

/* --------------------------------- auth ----------------------------------- */

/**
 * Which cookie goes on which request.
 *
 * The object form of `use` names cookies directly. The legacy string form
 * (`'token'` / `'tokenRefresh'`) selects between the deprecated `auth.token` /
 * `auth.tokenRefresh` names, and still works — the hosts continue to use it, and a
 * remote's `auth` deep-merges onto the host's, so both shapes can appear at once.
 */
function resolveAuthCookies(): { apiCookie?: string; refreshCookie?: string } {
    const auth = monoConfig()?.fetching?.auth as MonoAuthConfig | undefined
    if (!auth) return {}

    const use = auth.use

    if (use && typeof use === 'object') {
        return {
            apiCookie: use.apiRequest ?? auth.tokenRefresh,
            refreshCookie: use.refreshTokenRequest ?? auth.token,
        }
    }

    // legacy: `use` picks which name is sent on API requests; the refresh request always
    // authenticates with the main token
    const apiCookie = use === 'token' ? auth.token : (auth.tokenRefresh ?? auth.token)

    return { apiCookie, refreshCookie: auth.token }
}

/**
 * The core's `ConfigType`, built from our cookie names.
 *
 * The mapping looks inverted. It is not — the core hardcodes both sides:
 *   - it sends `jwtRefreshName` on ordinary API requests   (getRequestToken)
 *   - it sends `jwtName` as the Bearer ON the refresh call (refetchRefreshToken)
 *
 * So `use.apiRequest` -> `jwtRefreshName`, and `use.refreshTokenRequest` -> `jwtName`.
 * Please don't "fix" this.
 */
function getMonoTokenConfig(): MonoTokenConfig | undefined {
    const { apiCookie, refreshCookie } = resolveAuthCookies()
    if (!apiCookie && !refreshCookie) return undefined

    return {
        jwtName: refreshCookie ?? '',
        jwtRefreshName: apiCookie ?? '',
    }
}

/**
 * The refresh request, in the shape the core and `src/token` expect (`MonoFetchCookieOptions`).
 *
 * Returns `undefined` when the app declares no `requestRefreshTokenRequest`, which
 * leaves the core's refresh machinery dormant — the behaviour mono had before this existed.
 */
function getRefreshRequestOptions(configBaseUrl?: string): Record<string, any> | undefined {
    const auth = monoConfig()?.fetching?.auth as MonoAuthConfig | undefined
    const refresh = auth?.requestRefreshTokenRequest
    if (!refresh?.fetchParams?.url) return undefined

    const { apiCookie } = resolveAuthCookies()
    const name = refresh.name ?? apiCookie

    // A cookie with no lifetime is never written: the token cookie's `add()` bails when both
    // `milis` and `days` are absent, so the refresh silently succeeds and changes nothing.
    if (!refresh.path?.milis && !refresh.path?.days) {
        console.warn(
            '[@mono-lit/utility/fetching] auth.requestRefreshTokenRequest.path has neither `milis` nor `days`. ' +
            'That is the cookie lifetime — without it the refreshed token is never stored, and the refresh ' +
            'will appear to succeed while changing nothing.',
        )
    }

    const options = refresh.fetchParams.options ?? {}

    return {
        name,
        path: refresh.path,
        splitCookie: refresh.splitCookie ?? cookieSplit(name),
        fetchParams: {
            url: refresh.fetchParams.url,
            options: {
                ...options,
                baseUrl: options.baseUrl ?? refreshBaseUrl(configBaseUrl),
            },
        },
    }
}

/**
 * Where `/Auth/RefreshToken` lives when the app doesn't say.
 *
 * A refresh endpoint is a REST route, so the base of the call that TRIGGERED the refresh
 * is the wrong default whenever that call was OData: it would POST the refresh at the
 * `/odata` root and 404 on every attempt, with a config that looks entirely reasonable.
 * Prefer a `restful` entry — the triggering one if it is REST, else the first declared.
 */
function refreshBaseUrl(configBaseUrl?: string): string | undefined {
    const api = (monoConfig()?.fetching?.api ?? {}) as Record<string, any>

    const own = configBaseUrl ? api[configBaseUrl] : undefined
    if (own?.type === 'restful' && own.url) return own.url

    const firstRest = Object.values(api).find((e) => e?.type === 'restful' && e?.url)

    return firstRest?.url ?? runtimeOptions.restBaseUrl
}

/**
 * Everything the core needs to refresh a token on its own: the cookie names, the refresh
 * request, and what to do when it can't be saved. Spread into every core call.
 */
function authArgs(configBaseUrl?: string) {
    const auth = monoConfig()?.fetching?.auth as MonoAuthConfig | undefined

    return {
        config: getMonoTokenConfig(),
        tokenOptions: getRefreshRequestOptions(configBaseUrl),
        expiredBehaviour: auth?.expiredBehaviour,
        unauthCall: runtimeOptions.unauthCall,
    }
}

/**
 * The token that goes on this call.
 *
 * Hand the core the RAW cookie value, untouched: the core decides whether a passed token is
 * "the cookie" or "the caller's own" by byte-equality with the live cookie, and only a
 * cookie-derived token keeps following the cookie across refreshes for the life of a
 * DataSource. Anything that transforms the value here turns every store into one that
 * sends the token it was built with forever.
 */
function getRequestToken(manualToken?: string) {
    // A token passed on the call wins: "I passed a token, ignore config."
    if (manualToken) {
        return manualToken
    }

    if (runtimeOptions.token) {
        return runtimeOptions.token
    }

    // Tolerate a missing fetching config — fully-manual (baseUrl + token) calls
    // shouldn't require a `fetching` block. No config → no token, no throw.
    const fetching = monoConfig()?.fetching
    if (!fetching) {
        return undefined
    }

    // whichever cookie `use` says goes on an API request
    const { apiCookie, refreshCookie } = resolveAuthCookies()

    const chosenName = apiCookie ?? 'MONO_tokenRefresh'
    const fallbackName = refreshCookie ?? 'MONO_token'

    let value = readCookieValue(chosenName)

    // If the selected token cookie is missing (e.g. only the access token is present),
    // fall back to the other configured cookie rather than sending an empty token.
    if (!value && fallbackName && fallbackName !== chosenName) {
        value = readCookieValue(fallbackName)
    }

    // Only warn when auth was actually configured (a token was expected). For
    // public/token-less APIs an empty token is normal, so stay quiet.
    if (!value && (apiCookie || refreshCookie)) {
        const state = monoState<{
            cookie: Record<string, string | undefined>
        }>()

        console.warn('[@mono-lit/utility/fetching] request token is empty', {
            apiCookie,
            refreshCookie,
            configuredCookies: monoConfig()?.cookie?.map((c) => c.name) ?? [],
            availableCookieKeys: Object.keys(state.cookie ?? {}),
            cookieState: state.cookie,
        })
    }

    return value
}

function resolveNotif(enabled?: boolean) {
    if (!enabled) {
        return false
    }

    return runtimeOptions.notif || false
}

function mergeHeaders(
    baseHeaders?: Record<string, any>,
    overrideHeaders?: Record<string, any>,
) {
    return {
        ...(baseHeaders ?? {}),
        ...(overrideHeaders ?? {}),
    }
}

function getGlobalHeaders() {
    // Tolerate a missing fetching config so fully-manual (baseUrl + token) calls
    // work without a `fetching` block.
    const fetching = monoConfig()?.fetching as any

    return fetching?.headers ?? {}
}

/**
 * Optional helper if you want to manually refresh state before fetching.
 *
 * Usually unnecessary if createMono(monoConfig) already runs once.
 */
function getFetchingRuntime(configBaseUrl?: string) {
    const safe = <T>(fn: () => T): T | undefined => {
        try {
            return fn()
        } catch {
            return undefined
        }
    }

    return {
        config: getFetchingConfig(),
        restBaseUrl: safe(() => getRestBaseUrl(configBaseUrl)),
        odataBaseUrl: safe(() => getODataBaseUrl(configBaseUrl)),
        source: safe(() => getODataSource(configBaseUrl)),
        token: getRequestToken(),
    }
}


const useCreateFetcher = <T>(base: MonoCreateFetcherParams) => {
    const { configBaseUrl, ...rest } = base

    // Mock-first — same rule as monoOdataFetch. `.response()` keeps its shape, so
    // callers (`const { dataSource } = await monoCreateFetcher(...).response()`)
    // are unchanged.
    const mockRoute = resolveMockRoute(configBaseUrl, base.url)
    if (mockRoute) {
        return {
            async response(option?: any): FetchResult<T> {
                return await serveFromMock<T>(mockRoute, {
                    type: option?.type ?? base.type ?? 'datasource',
                    method: option?.method ?? base.method,
                    params: option?.params ?? base.params,
                    payload: option?.payload ?? base.payload,
                    // `.response({ options })` overrides the fetcher's own options,
                    // matching the core's MonoFetchOverrides contract
                    options: option?.options ?? base.options,
                })
            },
        }
    }

    return createFetcher<T>({
        // token refresh comes from `fetching.auth`; a caller's own config/tokenOptions wins
        ...authArgs(configBaseUrl),
        ...rest,
        token: getRequestToken(base.token),
        // @ts-ignore
        notif: resolveNotif(Boolean(base.notif)),
        baseUrl: getODataBaseUrl(configBaseUrl, base.baseUrl),
        // @mono-lit/utility always supplies @mono-lit/devextreme ctors here (see getSharedSource);
        // config/inline source overrides them per field.
        source: getODataSource(configBaseUrl, base.source) as any,
    })
}

function useTryCatchDatasource<T>(opt: MonoTryCatchDatasourceTypes<T>) {
    return tryCatchDatasource({
        ...opt,
        // @ts-ignore
        notif: runtimeOptions.notif || false,
    })
}



const createStaticDataSource = async <T extends Record<string, any>>(
    opt: MonoUseOdataStaticTypes<T>,
) => {
    return await MonoCreateStaticDatasource(opt)
}

const useMyFetchOData = async <T = any>({
    url,
    options,
    type = wrapperDefaults.type,
    params,
    notif = wrapperDefaults.notif,
    headers,
    selfProxy = wrapperDefaults.selfProxy,
    method = wrapperDefaults.method,
    force,
    allowZero = wrapperDefaults.allowZero,
    cache = wrapperDefaults.cache,
    override,
    baseUrl,
    configBaseUrl,
    source,
    token,
    payload = { data: null, keyValue: null, keyName: '', keyType: '' },
    ...rest
}: MonoOdataFetchParams): FetchResult<T> => {
    // Mock-first: when the url belongs to a `mockIndexedDB` schema this never
    // touches the network, in dev and in a static production build alike. No token,
    // no refresh — the mock has no auth surface at all.
    const mockRoute = resolveMockRoute(configBaseUrl, url)
    if (mockRoute) {
        return await serveFromMock<T>(mockRoute, { type, method, params, payload, options })
    }

    return await fetchOData({
        // token refresh comes from `fetching.auth`; a caller's own config/tokenOptions wins
        ...authArgs(configBaseUrl),
        ...rest,
        // @mono-lit/utility always supplies @mono-lit/devextreme ctors here (see getSharedSource);
        // config/inline source overrides them per field.
        source: getODataSource(configBaseUrl, source) as any,
        url,
        options,
        override,
        cache,
        type,
        force,
        token: getRequestToken(token),
        // @ts-ignore
        notif: resolveNotif(Boolean(notif)),
        allowZero,
        params,
        headers: mergeHeaders(getGlobalHeaders(), headers),
        selfProxy,
        method,
        baseUrl: getODataBaseUrl(configBaseUrl, baseUrl),
        payload,
    })
}

const useFetchOdataUnique = async <T = any>({
    url,
    options,
    type = wrapperDefaults.type,
    params,
    notif = wrapperDefaults.notif,
    headers,
    selfProxy = wrapperDefaults.selfProxy,
    method = wrapperDefaults.method,
    force,
    allowZero = wrapperDefaults.allowZero,
    cache = wrapperDefaults.cache,
    override,
    baseUrl,
    configBaseUrl,
    source,
    token,
    unique,
    payload = { data: null, keyValue: null, keyName: '', keyType: '' },
    ...rest
}: MonoOdataUniqueParams<T>): FetchResult<T> => {
    return await createUniqueFetcher({
        // token refresh comes from `fetching.auth`; a caller's own config/tokenOptions wins
        ...authArgs(configBaseUrl),
        ...rest,
        // @mono-lit/utility always supplies @mono-lit/devextreme ctors here (see getSharedSource);
        // config/inline source overrides them per field.
        source: getODataSource(configBaseUrl, source) as any,
        url,
        unique,
        options,
        override,
        cache,
        type,
        force,
        token: getRequestToken(token),
        // @ts-ignore
        notif: resolveNotif(Boolean(notif)),
        allowZero,
        params,
        headers: mergeHeaders(getGlobalHeaders(), headers),
        selfProxy,
        method,
        baseUrl: getODataBaseUrl(configBaseUrl, baseUrl),
        payload,
    })
}

async function useMyFetch<T = any>(
    url: string,
    opt: MonoNormalFetchParams,
) {
    const { configBaseUrl, ...rest } = opt

    // Mock-first, same as the odata path.
    const mockRoute = resolveMockRoute(configBaseUrl, url)
    if (mockRoute) {
        const response = await mockRoute.mock.request<T>({
            url: mockRoute.url,
            method: (opt as any)?.method,
            params: (opt as any)?.params,
            // `monoFetch` takes RequestInit, so `body` is normally JSON.stringify(obj)
            // — a STRING. The mock engine parses it (see normalizePayload); passing it
            // through raw used to spread it character-by-character into a garbage row.
            payload: (opt as any)?.body ?? (opt as any)?.payload,
            // REST carries the key in the url path (`/users/1`), which the engine already
            // resolves — there is no payload envelope on this path.
        })

        const payload: any = response.data
        // a REST caller expects a plain array, not the OData envelope
        const data = payload && Array.isArray(payload.value) ? payload.value : payload

        // Match `fetchNormal` exactly: NormalFetchResult<T> = { statusCode, data, message, all }.
        // Returning a different shape (the old `{ data, statusCode, error }`) means code
        // reading `message` silently gets undefined on the mock and works in production.
        return {
            statusCode: response.statusCode,
            data: (data ?? null) as T | null,
            message: response.error?.message ?? null,
            all: response.data,
        } as any
    }

    const { config, tokenOptions, expiredBehaviour, unauthCall } = authArgs(configBaseUrl)
    const { config: _ownConfig, tanstack, ...restOptions } = rest as typeof rest & {
        config?: MonoTokenConfig
    }

    const send = (signal?: AbortSignal) => fetchNormal<T>(
        url,
        {
            ...(signal ? { signal } : {}),
            // token refresh comes from `fetching.auth`; a caller's own options win
            tokenOptions,
            expiredBehaviour,
            unauthCall,
            ...restOptions,
            token: getRequestToken(opt.token),
            baseUrl: getRestBaseUrl(configBaseUrl, opt.baseUrl),
            // @ts-ignore
            notif: resolveNotif(Boolean(opt?.notif)),
            headers: mergeHeaders(getGlobalHeaders(), opt.headers),
        },
        // `config` is a positional argument here, not a prop — passing it inside the
        // options object (as the OData path does) drops it, and the core's refresh stays dormant.
        (_ownConfig ?? config) as any,
    )

    // Opt-in TanStack behaviour: only when asked for AND the installed data layer provides the
    // runner. Reads (GET) run as queries — dedupe / cache / retries / offline pause; other
    // methods run as mutations — offline pause only, never retried.
    const runner = tanstack ? tanstackRunner() : undefined
    if (!runner) return await send()

    const method = String((restOptions as any).method ?? 'GET').toUpperCase()
    try {
        return await runner({
            kind: method === 'GET' ? 'query' : 'mutation',
            key: ['mono-fetch', method, getRestBaseUrl(configBaseUrl, opt.baseUrl) + url, (restOptions as any).body ?? null],
            tanstack,
            task: async (signal) => {
                const result = await send(signal)
                // fetchNormal resolves even on failure ({ statusCode }); surface it as an error
                if (!result || result.statusCode === 0 || result.statusCode >= 400) throw new FailedFetchResult(result)
                return result
            },
        })
    } catch (error) {
        // out of retries (or not retryable): hand back fetchNormal's own failure result, unchanged
        if (error instanceof FailedFetchResult) return error.result as Awaited<ReturnType<typeof send>>
        throw error
    }
}

const loadChuckStores = async <T>(opt: MonoStoreChunkTypes<T>) => {
    return await loadChuckStore(opt)
}

export {
    useMyFetch as monoFetch,
    // Each OData helper is exported under TWO names for the same function: the
    // original `mono...Fetch` spelling, kept so existing apps keep working, and
    // the `monoFetch...` spelling the docs standardize on. Neither is deprecated
    // -- they are aliases, not a migration.
    useMyFetchOData as monoOdataFetch,
    useMyFetchOData as monoFetchOdata,
    useFetchOdataUnique as monoOdataFetchUnique,
    useFetchOdataUnique as monoFetchOdataUnique,
    useCreateFetcher as monoCreateFetcher,
    useTryCatchDatasource as monoTryCatchDatasource,
    createStaticDataSource as monoStaticDataSource,
    loadChuckStores as monoLoadChuckStores,
    configureFetching as monoConfigureFetching,
    resetFetchingConfig as monoResetFetchingConfig,
    getFetchingRuntime as monoFetchingRuntime,
    getRestBaseUrl as monoRestBaseUrl,
    getODataBaseUrl as monoOdataBaseUrl,
    getODataSource as monoOdataSource,
    getRequestToken as monoRequestToken,
}

// The mock backend's own surface: `monoMockDb()` for lifecycle + escape hatches
// (reset / export / import). A Node CLI cannot reach the browser's IndexedDB, so
// these are the only way to manage the store at runtime.
export { monoMockDb, resetMonoMockDb } from './mock-db'
export type { MonoMockDb, MonoMockRequest, MonoMockResponse } from './mock-db'

// Raw core fetch utils, re-exposed for direct use:
// `import { promiseWrapper, createFetcher } from '@mono-lit/utility/fetching'`.
// `createFetcher` here is the unwrapped one (no `fetching` config resolution);
// use `monoCreateFetcher` for that.
export { promiseWrapper, createFetcher } from '../src/core'
