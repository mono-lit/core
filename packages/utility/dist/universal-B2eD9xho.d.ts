import { a as MonoFetchCookieOptions, i as LocalStorageParams, n as CookieTokenParams, r as JWTPayload, t as CookieParams } from "./types-B6FdB7LJ.js";

//#region src/token/cookie-core.d.ts
interface CookieApi {
  get(name: string, split?: boolean | string): string | null;
  add(params: CookieParams): string | null | undefined;
  remove(name: string, split?: boolean | string): boolean;
}
//#endregion
//#region src/composables/universal.d.ts
/** Minimal shape of an h3/Nuxt request event we rely on (kept loose on purpose). */
type MonoRequestEvent = any;
/**
 * Wire how the SSR cookie utils find the current request event. Call once from a
 * Nuxt plugin: `setMonoEventResolver(() => useRequestEvent())`. Without it (and
 * without an explicit `event` argument) the server utils degrade to empty reads.
 */
declare function setMonoEventResolver(fn: (() => MonoRequestEvent | undefined) | undefined): void;
/** Cookie util. Client: document.cookie. Server: the h3 request event (sync). */
declare function monoCookie(event?: MonoRequestEvent): CookieApi;
/** Token util. Client: document.cookie. Server: the h3 request event (sync). */
declare function monoToken(options?: CookieTokenParams, event?: MonoRequestEvent): {
  decode: <T extends object>(name?: CookieTokenParams["name"], split?: boolean) => JWTPayload<T> | null;
  add: ({
    name,
    value,
    days,
    milis,
    splitCookie
  }: Pick<CookieTokenParams, "name" | "value" | "days" | "milis" | "splitCookie">) => string | null | undefined;
  get: (name?: CookieTokenParams["name"], split?: boolean) => CookieTokenParams["value"] | null;
  replace: ({
    name,
    value,
    days,
    milis,
    splitCookie
  }: Pick<CookieTokenParams, "name" | "value" | "days" | "milis" | "splitCookie">) => boolean;
  fetch: <T = Record<string, any>>({
    fetchParams,
    name,
    path,
    splitCookie
  }?: MonoFetchCookieOptions) => Promise<{
    response: T | null;
    cookie: string | null | undefined;
  }>;
  validate: (name?: CookieTokenParams["name"], split?: boolean) => boolean;
  wrap: <T = any>({
    name,
    fetchParams,
    path,
    splitCookie
  }?: Pick<CookieTokenParams, "name" | "splitCookie" | "fetchParams" | "path">, callback?: (value?: string | null) => T | undefined | Promise<T | undefined>) => Promise<T | undefined>;
};
/** JWT util. `cookieDecode({ cookie })` reads via the isomorphic cookie util. */
declare function monoJwt(event?: MonoRequestEvent): {
  isJwt: (jwt: string) => boolean;
  cookieDecode: <T extends object>({
    cookie,
    token,
    splitCookie
  }: {
    splitCookie?: CookieParams["split"];
    cookie?: CookieParams["name"];
    token?: CookieParams["value"];
  }) => JWTPayload<T> | null;
};
/** Storage util. Client: localStorage/sessionStorage. Server: safe no-op. */
declare function monoStorage(options?: LocalStorageParams): {
  get: (name: LocalStorageParams["name"]) => LocalStorageParams["value"] | LocalStorageParams[] | null;
  add: ({
    name,
    value,
    items
  }: Pick<LocalStorageParams, "name" | "value" | "items">) => string | null;
  remove: (name: LocalStorageParams["name"]) => boolean;
  change: ({
    name,
    value
  }: Pick<LocalStorageParams, "name" | "value">) => string | null;
  pull: (name: LocalStorageParams["name"]) => LocalStorageParams["value"] | null;
  redirect: (url: string, {
    name,
    value,
    items
  }: Pick<LocalStorageParams, "name" | "value" | "items">) => void;
} | {
  get: () => null;
  add: (_: Pick<LocalStorageParams, "name" | "value" | "items">) => null;
  remove: (_?: LocalStorageParams["name"]) => boolean;
  change: (_: Pick<LocalStorageParams, "name" | "value">) => null;
  pull: (_?: LocalStorageParams["name"]) => null;
  redirect: () => void;
};
//#endregion
export { monoToken as a, monoStorage as i, monoCookie as n, setMonoEventResolver as o, monoJwt as r, CookieApi as s, MonoRequestEvent as t };