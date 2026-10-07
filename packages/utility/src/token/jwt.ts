// src/jwt.ts — pure JWT utilities (no DOM/cookie dependency at the core).
//
// `isJwt` and `decodeJwt` are pure and are the pieces reused by the SSR backend.
// `useMyJwt().cookieDecode` keeps the original convenience that reads a *client*
// cookie (document.cookie) when given a `cookie` name — preserved for backward compat.

import { jwtDecode } from "jwt-decode";
import type { CookieParams, JWTPayload } from './types'
import { useMyCookie } from './client'

/** Pure: is this string shaped like a JWT? */
export const isJwt = (jwt: string): boolean =>
    /^([A-Za-z0-9-_]+)\.([A-Za-z0-9-_]+)\.([A-Za-z0-9-_.+/=]+)$/.test(jwt)

/** Pure: decode a JWT string into its payload, or null when not a JWT. */
export function decodeJwt<T extends object>(token: string | null | undefined): JWTPayload<T> | null {
    if (token && isJwt(token)) {
        return jwtDecode(token) as JWTPayload<T>
    }
    return null
}

export const useMyJwt = () => {

    /**
     * Jwt decode untuk mengambil payload informasi user.
     * @param cookie nama cookie jwt yang ingin didecode (read via client document.cookie)
     */
    const cookieDecode = <T extends object>({ cookie, token, splitCookie }: { splitCookie?: CookieParams['split'], cookie?: CookieParams['name'], token?: CookieParams['value'] }): JWTPayload<T> | null => {

        if (cookie) {
            const cookies = useMyCookie()
            const tok = cookies.get(cookie, Boolean(splitCookie))

            const decoded = decodeJwt<T>(tok)
            if (decoded) return decoded
        }

        return decodeJwt<T>(token)
    }

    return {
        isJwt,
        cookieDecode
    }
}
