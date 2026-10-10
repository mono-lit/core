import { a as monoMockDb, n as MonoMockRequest, o as resetMonoMockDb, r as MonoMockResponse, t as MonoMockDb } from "./index-C2hZeNkq.js";
import { B as NormalFetchOptions, H as OdataFetchTypes, U as TanstackFetchOptions, Y as UseOdataStaticOpts, _ as getPrefetchBridge, a as TryCatchDatasourceParams, d as promiseWrapper, g as MonoPrefetchRequest, h as MonoPrefetchBridge, i as OdataFetchUniqueTypes, n as FetchOverrides, o as createFetcher, r as LoadChunkStoreArgs } from "./index-D70EYjBS.js";
import DataSource from "devextreme/data/data_source";
import CustomStore from "devextreme/data/custom_store";
import ODataStore from "devextreme/data/odata/store";

//#region pkg/wrapper-fetching.d.ts
type FetchError = {
  message: string;
  stack: string;
  response: any;
};
type FetchResult<T> = Promise<{
  data: T | null;
  dataSource: DataSource<T> | null;
  statusCode: number;
  error: FetchError | null;
}>;
/**
 * `configBaseUrl` names an entry in `fetching.api`. When set, the call's base
 * url (and, for odata, its source constructors) is resolved from that entry,
 * overriding the call's own `baseUrl`. This prop is mono-only and is stripped
 * before delegating to the core fetch layer fetch functions.
 */
type MonoOdataFetchParams = Omit<OdataFetchTypes, 'source'> & {
  source?: OdataFetchTypes['source'];
} & {
  configBaseUrl?: string;
};
type MonoOdataUniqueParams<T> = Omit<OdataFetchUniqueTypes<T>, 'source'> & {
  source?: OdataFetchUniqueTypes<T>['source'];
} & {
  configBaseUrl?: string;
};
/** The core's `ConfigType`: the two cookie names its token machinery reads. */
type MonoTokenConfig = {
  jwtName: string;
  jwtRefreshName: string;
};
/**
 * `fetchNormal` takes `config` positionally, so the core's own options type has no room for
 * it. Accept it as a prop here and forward it to the right place — a caller shouldn't
 * have to know about that asymmetry.
 */
type MonoNormalFetchParams = NormalFetchOptions & {
  configBaseUrl?: string;
  config?: MonoTokenConfig;
  /**
   * Opt-in TanStack Query behaviour (dedupe, cache, retries, offline pause). Applied only when the
   * installed `@mono-lit/devextreme` provides a `tanstackRun` export; otherwise ignored.
   */
  tanstack?: TanstackFetchOptions;
};
/** Options for `monoFetch(url, { tanstack })` / `monoOdataFetch({ tanstack })`. */
type MonoTanstackFetchOptions = TanstackFetchOptions;
type MonoCreateFetcherParams = Omit<OdataFetchTypes, 'source'> & {
  source?: OdataFetchTypes['source'];
} & {
  configBaseUrl?: string;
};
type MonoFetchingRuntimeOptions = {
  /**
   * Your app notification object/function.
   * Example from your old code:
   * const { notif } = useHelperMonoVue()
   */
  notif?: any;
  /**
   * Override token directly.
   */
  token?: string;
  /**
   * Override REST base URL.
   */
  restBaseUrl?: string;
  /**
   * Override OData base URL.
   */
  odataBaseUrl?: string;
  /**
   * Called when a request is unauthorized and no refresh could save it — typically
   * `() => router.push('/login')`. It lives here rather than in `mono.config.ts`
   * because it needs the router.
   *
   * NOTE: registering it SHORT-CIRCUITS `auth.expiredBehaviour` — the core calls this and
   * returns rather than attempting the reload.
   */
  unauthCall?: () => void;
};
declare function configureFetching(options?: MonoFetchingRuntimeOptions): void;
declare function resetFetchingConfig(): void;
type ODataServiceCtor = new (...args: any[]) => any;
/**
 * The capitalized source-ctor shape the core fetch layer expects. A partial source is fine
 * — `mapSharedSource` fills every field from the `@mono-lit/devextreme` defaults — but
 * a fully-absent source must NOT reach the core fetch layer: it `import type`s DevExtreme and
 * calls `new source.ODataStore(...)` with no fallback of its own, so a missing
 * ctor crashes with "ods is not a constructor". `getSharedSource` guarantees the
 * three store ctors are always present; `OdataService` stays per-entry.
 */
type ResolvedODataSource = {
  DataSource?: typeof DataSource;
  ODataStore?: typeof ODataStore;
  CustomStore?: typeof CustomStore;
  OdataService?: ODataServiceCtor;
};
declare function getRestBaseUrl(configBaseUrl?: string, explicitBaseUrl?: string): string;
declare function getODataBaseUrl(configBaseUrl?: string, explicitBaseUrl?: string): string;
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
declare function getODataSource(configBaseUrl?: string, inlineSource?: ResolvedODataSource): ResolvedODataSource | undefined;
/**
 * The token that goes on this call.
 *
 * Hand the core the RAW cookie value, untouched: the core decides whether a passed token is
 * "the cookie" or "the caller's own" by byte-equality with the live cookie, and only a
 * cookie-derived token keeps following the cookie across refreshes for the life of a
 * DataSource. Anything that transforms the value here turns every store into one that
 * sends the token it was built with forever.
 */
declare function getRequestToken(manualToken?: string): any;
/**
 * Optional helper if you want to manually refresh state before fetching.
 *
 * Usually unnecessary if createMono(monoConfig) already runs once.
 */
declare function getFetchingRuntime(configBaseUrl?: string): {
  config: {
    readonly api?: {
      readonly [x: string]: {
        readonly type: "restful" | "odata";
        readonly url: string;
        readonly oDataService?: any;
      };
    } | undefined;
    readonly source?: {
      readonly dataSource?: any;
      readonly oDataStore?: any;
      readonly customStore?: any;
    } | undefined;
    readonly auth?: {
      readonly token?: string | undefined;
      readonly tokenRefresh?: string | undefined;
      readonly use?: "token" | "tokenRefresh" | {
        readonly apiRequest?: string | undefined;
        readonly refreshTokenRequest?: string | undefined;
      } | undefined;
      readonly requestRefreshTokenRequest?: {
        readonly name?: string | undefined;
        readonly path: {
          readonly milis?: string | undefined;
          readonly days?: string | undefined;
          readonly value?: string | undefined;
          readonly name?: string | undefined;
        };
        readonly splitCookie?: boolean | undefined;
        readonly fetchParams: {
          readonly url: string;
          readonly options?: {
            readonly [x: string]: any;
            readonly baseUrl?: string | undefined;
          } | undefined;
        };
      } | undefined;
      readonly expiredBehaviour?: "refresh" | undefined;
    } | undefined;
  };
  restBaseUrl: string | undefined;
  odataBaseUrl: string | undefined;
  source: ResolvedODataSource | undefined;
  token: any;
};
declare const useCreateFetcher: <T>(base: MonoCreateFetcherParams) => {
  prefetch: (_option?: FetchOverrides) => MonoPrefetchDescriptor;
  prefetchLoad: (_loadOptions?: Record<string, unknown>, _option?: FetchOverrides) => MonoPrefetchDescriptor;
  response(option?: any): FetchResult<T>;
};
declare function useTryCatchDatasource<T>(opt: TryCatchDatasourceParams<T>): Promise<T>;
declare const createStaticDataSource: <T extends Record<string, any>>(opt: UseOdataStaticOpts<T>) => Promise<{
  dataSource: DataSource<T, any>;
  data: T[] | null;
  statusCode: number;
  error: null | {
    message: string;
    stack: string;
    response: any;
  };
}>;
declare const useFetchOdataUnique: <T = any>({
  url,
  options,
  type,
  params,
  notif,
  headers,
  selfProxy,
  method,
  force,
  allowZero,
  cache,
  override,
  baseUrl,
  configBaseUrl,
  source,
  token,
  unique,
  payload,
  ...rest
}: MonoOdataUniqueParams<T>) => FetchResult<T>;
declare function useMyFetch<T = any>(url: string, opt: MonoNormalFetchParams): Promise<any>;
declare const loadChuckStores: <T>(opt: LoadChunkStoreArgs<T>) => Promise<T[]>;
/** Marks a `definePrefetch` descriptor (@mono-lit/nuxt-pre-fetch's protocol; no import needed). */
declare const PREFETCH_DESCRIPTOR: unique symbol;
/** A call described for `definePrefetch` (`monoFetch.prefetch`, …): emits the request(s) it would send. */
interface MonoPrefetchDescriptor {
  readonly [PREFETCH_DESCRIPTOR]: true;
  collect: (context: unknown, emit: (request: MonoPrefetchRequest) => void) => Promise<void>;
}
/**
 * `definePrefetch` twin of `monoFetch(url, opt)`: the same arguments, nothing sent — describes
 * the GET the browser's call will send (base url, headers and auth from `fetching` config).
 */
declare function prefetchMonoFetch(url: string, opt?: MonoNormalFetchParams): MonoPrefetchDescriptor;
/**
 * `definePrefetch` twin of `monoFetchOdata(params)`: runs the same call in capture mode —
 * the store builds exactly the request the browser will send (`data`: what the call loads;
 * `datasource`: the first page a bound widget loads), nothing is fetched.
 */
declare function prefetchMonoFetchOdata(params: MonoOdataFetchParams): MonoPrefetchDescriptor;
/** `monoFetch` with its `definePrefetch` twin: `monoFetch.prefetch(url, opt)`. */
declare const monoFetch: typeof useMyFetch & {
  prefetch: typeof prefetchMonoFetch;
};
/** `monoFetchOdata` / `monoOdataFetch` with `.prefetch(params)`. */
declare const monoFetchOdata: (<T = any>({
  url,
  options,
  type,
  params,
  notif,
  headers,
  selfProxy,
  method,
  force,
  allowZero,
  cache,
  override,
  baseUrl,
  configBaseUrl,
  source,
  token,
  payload,
  ...rest
}: MonoOdataFetchParams) => FetchResult<T>) & {
  prefetch: typeof prefetchMonoFetchOdata;
};
/**
 * Installs the `prefetch` host (e.g. `useNuxtApp().$nuxtPreFetch` from @mono-lit/nuxt-pre-fetch;
 * `@mono-lit/utility/nuxt` does it for you). REST calls use it here; OData stores use it through
 * the data layer when it supports it (`@mono-lit/data`'s `setPrefetchProvider`, detected like
 * `tanstackRun`). `null` removes it.
 */
declare function monoSetPrefetchBridge(next: MonoPrefetchBridge | null): void;
/**
 * Inside `definePrefetch(pattern, ctx => …)`: what the browser's `monoState()` would hold for
 * this request — the claims of every `jwt` entry of `mono.config` (decoded from the page
 * request's cookies; split cookies joined) and a cookie reader that understands `split`.
 */
declare function monoPrefetchContext(context: {
  cookies?: Record<string, string>;
}): {
  jwt: Record<string, Record<string, any>>;
  cookie: (name: string, split?: boolean) => string | undefined;
};
//#endregion
export { type MonoMockDb, type MonoMockRequest, type MonoMockResponse, type MonoPrefetchBridge, MonoPrefetchDescriptor, type MonoPrefetchRequest, MonoTanstackFetchOptions, createFetcher, configureFetching as monoConfigureFetching, useCreateFetcher as monoCreateFetcher, monoFetch, monoFetchOdata, monoFetchOdata as monoOdataFetch, useFetchOdataUnique as monoFetchOdataUnique, useFetchOdataUnique as monoOdataFetchUnique, getFetchingRuntime as monoFetchingRuntime, loadChuckStores as monoLoadChuckStores, monoMockDb, getODataBaseUrl as monoOdataBaseUrl, getODataSource as monoOdataSource, getPrefetchBridge as monoPrefetchBridge, monoPrefetchContext, getRequestToken as monoRequestToken, resetFetchingConfig as monoResetFetchingConfig, getRestBaseUrl as monoRestBaseUrl, monoSetPrefetchBridge, createStaticDataSource as monoStaticDataSource, useTryCatchDatasource as monoTryCatchDatasource, promiseWrapper, resetMonoMockDb };