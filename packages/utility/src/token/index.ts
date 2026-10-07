// src/token — client cookie/token/jwt/storage/fetch helpers.
//
// The cookie/token *concept and technique* live as backend-agnostic utils here
// (cookie-core, token-core, jwt, fetch). This barrel exposes the client-facing
// API (document.cookie based) AND the util primitives, so other layers (e.g. the
// SSR backend in `src/composables/universal.ts`) can reuse them with a different store.

// --- Client API ------------------------------------------------------------
export { useMyCookie, useMyToken } from './client'
export { useMyJwt } from './jwt'
export { useMyStorage } from './storage'
export { useMyFetch } from './fetch'

// --- Reusable util primitives (the extracted "utils") ------------------------
export {
    createCookie,
    chunkPattern,
    parseChunks,
    chunkIndexes,
    splitValue,
    computeExpiry,
    type CookieStore,
    type CookieApi,
} from './cookie-core'

export {
    createToken,
    getByPath,
    type TokenDeps,
} from './token-core'

export { isJwt, decodeJwt } from './jwt'

// --- Shared types ------------------------------------------------------------
export type {
    CookieParams,
    CookieTokenParams,
    JWTPayload,
    FetchParam,
    RequestParam,
    LocalStorageParams,
    NormalFetchOptions,
    NormalFetchResult,
    MonoFetchCookieOptions,
} from './types'
