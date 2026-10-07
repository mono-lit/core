// src/client.ts — the CLIENT binding. Reuses the backend-agnostic utils but stays
// on `document.cookie` (synchronous), preserving the original public API exactly.

import { createCookie, type CookieStore } from './cookie-core'
import { createToken } from './token-core'
import { isJwt, decodeJwt } from './jwt'
import { useMyFetch } from './fetch'
import type { CookieTokenParams } from './types'

/** Synchronous `CookieStore` over `document.cookie` (original encoding preserved). */
const documentCookieStore: CookieStore = {
    read(name: string): string | null {
        const nameEQ = encodeURIComponent(name) + "="
        const cookies = document.cookie.split(';').map(s => s.trim())
        for (const cookie of cookies) {
            if (cookie.startsWith(nameEQ)) {
                return decodeURIComponent(cookie.substring(nameEQ.length))
            }
        }
        return null
    },
    readAll(): string[] {
        return document.cookie.split(';').map(s => s.trim()).filter(Boolean)
    },
    write(name: string, value: string, expires?: Date): void {
        const parts = [
            `${encodeURIComponent(name)}=${encodeURIComponent(value)}`,
            expires ? `expires=${expires.toUTCString()}` : '',
            'path=/',
        ].filter(Boolean)
        document.cookie = parts.join('; ')
    },
    delete(name: string): void {
        document.cookie = `${encodeURIComponent(name)}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`
    },
}

/** Client cookie util — `document.cookie` backed (unchanged public shape). */
export const useMyCookie = () => createCookie(documentCookieStore)

/** Client token util — `document.cookie` backed (unchanged public shape). */
export const useMyToken = (options?: CookieTokenParams) =>
    createToken({ cookie: useMyCookie(), isJwt, decode: decodeJwt, fetch: useMyFetch }, options)
