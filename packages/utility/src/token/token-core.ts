// src/token-core.ts — the token technique, made backend-agnostic.
//
// The original `useMyToken` was hard-wired to the client `document.cookie`. Here
// the cookie/jwt/fetch dependencies are injected, so the exact same technique runs
// against the synchronous client store OR the asynchronous SSR store.

import type { CookieApi } from './cookie-core'
import type { CookieTokenParams, JWTPayload, MonoFetchCookieOptions } from './types'
import type { useMyFetch } from './fetch'

/** Pure: read `a.b.c` off an object. */
export function getByPath(obj: any, path: string): any | null {
    if (path) return path?.split('.').reduce((acc, key) => acc?.[key], obj)
    return null
}

export interface TokenDeps {
    cookie: CookieApi
    isJwt: (s: string) => boolean
    decode: <T extends object>(token: string | null | undefined) => JWTPayload<T> | null
    fetch: typeof useMyFetch
}

/**
 * Build the token util ({ get, add, decode, validate, replace, fetch, wrap }) over
 * injected cookie/jwt/fetch dependencies. Behavior matches the original `useMyToken`.
 */
export function createToken(deps: TokenDeps, options?: CookieTokenParams) {
    const { cookie, isJwt, decode, fetch } = deps

    const get = (name?: CookieTokenParams['name'], split?: boolean): CookieTokenParams['value'] | null => {
        const token = cookie.get(String(name || options?.name), Boolean(split) || Boolean(options?.splitCookie))
        if (token) return token
        return null
    }

    const add = ({ name, value, days, milis, splitCookie }: Pick<CookieTokenParams, 'name' | 'value' | 'days' | 'milis' | 'splitCookie'>) => {
        return cookie.add({
            name: String(name || options?.name),
            value: String(value || options?.value),
            days: Number(days || options?.days),
            milis: Number(milis || options?.milis),
            split: Boolean(splitCookie || options?.splitCookie)
        })
    }

    const decodeToken = <T extends object>(name?: CookieTokenParams['name'], split?: boolean): JWTPayload<T> | null => {
        const token = cookie.get(String(name || options?.name), split || Boolean(options?.splitCookie))
        if (token && isJwt(token)) return decode<T>(token)
        return null
    }

    const validate = (name?: CookieTokenParams['name'], split?: boolean): boolean => {
        const getToken = get(String(name || options?.name), Boolean(split) || Boolean(options?.splitCookie))

        if (getToken && !['', 'undefined'].includes(String(getToken))) {
            const decoded = decodeToken<{ exp?: string | number }>(String(name || options?.name), Boolean(split) || Boolean(options?.splitCookie))
            if (decoded) {
                const currentTime = Math.floor(Date.now() / 1000)
                if (decoded.exp && Number(decoded.exp) > currentTime) return true
            }
        }
        return false
    }

    const replace = ({ name, value, days, milis, splitCookie }: Pick<CookieTokenParams, 'name' | 'value' | 'days' | 'milis' | 'splitCookie'>) => {
        const addCookie = cookie.add({
            name: String(name || options?.name),
            value: String(value || options?.value),
            days: Number(days || options?.days),
            milis: Number(milis || options?.milis),
            split: Boolean(splitCookie) || Boolean(options?.splitCookie)
        })
        return Boolean(addCookie)
    }

    const fetchToken = async <T = Record<string, any>>({
        fetchParams, name, path, splitCookie
    }: MonoFetchCookieOptions = {}
    ): Promise<{ response: T | null, cookie: string | null | undefined }> => {

        const valid = validate(String(name || options?.name))

        if (!valid) {
            const { all } = await fetch(
                String(fetchParams?.url || options?.fetchParams?.url),
                {
                    ...fetchParams?.options,
                    ...options?.fetchParams?.options
                },
            )

            if (all) {
                const res = add({
                    name: String(name || options?.name) || getByPath(all, String(path?.name || options?.path?.name)),
                    value: getByPath(all, String(path?.value || options?.path?.value)),
                    milis: getByPath(all, String(path?.milis || options?.path?.milis)),
                    days: getByPath(all, String(path?.days || options?.path?.days)),
                    splitCookie: Boolean(splitCookie) || Boolean(options?.splitCookie)
                })

                return { response: all, cookie: res }
            }
        }

        return { response: null, cookie: null }
    }

    const wrap = async <T = any>(
        { name, fetchParams, path, splitCookie }: Pick<CookieTokenParams, 'name' | 'splitCookie' | 'fetchParams' | 'path'> = {},
        callback?: (value?: string | null) => T | undefined | Promise<T | undefined>
    ): Promise<T | undefined> => {
        await fetchToken({
            fetchParams: { ...fetchParams, ...options?.fetchParams },
            name: String(name || options?.name),
            path: { ...path, ...options?.path }
        })

        const getStoredToken = cookie.get(String(name || options?.name), Boolean(splitCookie) || Boolean(options?.splitCookie))
        if (getStoredToken && callback) return callback(getStoredToken as string) as T | undefined | Promise<T | undefined>
    }

    return {
        decode: decodeToken, add, get, replace, fetch: fetchToken, validate, wrap
    }
}
