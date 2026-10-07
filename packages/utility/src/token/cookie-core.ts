// src/cookie-core.ts — the cookie util, made backend-agnostic.
//
// The browser-specific bits (document.cookie) are abstracted behind a tiny
// `CookieStore` primitive. The split-chunk logic lives in pure helpers so both
// the synchronous client binding (`client.ts`) and the asynchronous SSR
// binding (`src/composables/universal.ts`) reuse exactly the same encoding/decoding.

import type { CookieParams } from './types'

/**
 * Primitive cookie IO. The client implements this synchronously over
 * `document.cookie`; the SSR backend implements an async sibling over h3/unstorage.
 *
 * - `read(name)`   -> decoded value of the exact cookie, or null
 * - `readAll()`    -> raw "encName=encValue" entries (used for split-chunk scanning)
 * - `write(name,value,expires)` -> encodes + persists
 * - `delete(name)` -> expires/removes the cookie
 */
export interface CookieStore {
    read(name: string): string | null
    readAll(): string[]
    write(name: string, value: string, expires?: Date): void
    delete(name: string): void
}

// --- Pure split helpers (shared by client + SSR) -----------------------------

/** Regex matching a split chunk cookie: `<encName>_split_<idx>=`. */
export function chunkPattern(name: string): RegExp {
    return new RegExp(`^${encodeURIComponent(name)}_split_(\\d+)=`)
}

/** From raw "encName=encValue" entries, return this name's chunk values, index-ordered + decoded. */
export function parseChunks(rawEntries: string[], name: string): string {
    const pattern = chunkPattern(name)
    const hits: { idx: number; raw: string }[] = []
    for (const c of rawEntries) {
        const m = c.match(pattern)
        if (m) hits.push({ idx: Number(m[1]), raw: c })
    }
    hits.sort((a, b) => a.idx - b.idx)

    let combined = ''
    for (const { raw } of hits) {
        const eqPos = raw.indexOf('=')
        if (eqPos >= 0) combined += decodeURIComponent(raw.substring(eqPos + 1))
    }
    return combined
}

/** Indexes of this name's existing chunks (for cleanup before a rewrite). */
export function chunkIndexes(rawEntries: string[], name: string): number[] {
    const pattern = chunkPattern(name)
    const idx: number[] = []
    for (const c of rawEntries) {
        const m = c.match(pattern)
        if (m) idx.push(Number(m[1]))
    }
    return idx.sort((a, b) => a - b)
}

/** Slice a value into ~`every`-char parts. */
export function splitValue(value: string, every: number): string[] {
    const parts: string[] = []
    let i = 0
    while (i * every < value.length) {
        parts.push(value.slice(i * every, (i + 1) * every))
        i++
    }
    return parts
}

/** Compute an expiry Date from `days`/`milis` (returns undefined when neither given). */
export function computeExpiry(days?: number, milis?: number): Date | undefined {
    if (!days && !milis) return undefined
    const expires = new Date()
    if (milis) expires.setTime(expires.getTime() + milis)
    if (days) expires.setTime(expires.getTime() + days * 24 * 60 * 60 * 1000)
    return expires
}

// --- Backend-agnostic cookie util (synchronous over a sync store) ------------

export interface CookieApi {
    get(name: string, split?: boolean | string): string | null
    add(params: CookieParams): string | null | undefined
    remove(name: string, split?: boolean | string): boolean
}

/**
 * Build a `{ get, add, remove }` cookie util over any synchronous `CookieStore`.
 * Carries the exact original semantics: split handling, days/milis expiry, and a
 * write-verify (re-read after write) before reporting success.
 */
export function createCookie(store: CookieStore): CookieApi {

    const get = (name: string, split: boolean | string = false): string | null => {
        if (split) {
            const combined = parseChunks(store.readAll(), name)
            if (combined) return combined
            // fall through to base cookie if no chunks exist
        }
        return store.read(name)
    }

    const add = ({ name, value, days, milis, split = false, splitEvery = 2000 }: CookieParams): string | null | undefined => {
        if (!days && !milis) return null

        try {
            const expires = computeExpiry(days, milis)

            if (split) {
                // wipe previous chunks & base
                for (const idx of chunkIndexes(store.readAll(), name)) store.delete(`${name}_split_${idx}`)
                store.delete(name)

                // write new chunks + verify
                const parts = splitValue(value, splitEvery)
                let ok = true
                parts.forEach((part, i) => {
                    store.write(`${name}_split_${i}`, part, expires)
                    ok &&= store.read(`${name}_split_${i}`) === part
                })

                if (ok) return value || get(name, true)
            } else {
                store.write(name, value, expires)
                if (store.read(name) === value) return value || get(name)
            }
        } catch {
            return null
        }
    }

    const remove = (name: string, split: boolean | string = false): boolean => {
        if (split) {
            for (const idx of chunkIndexes(store.readAll(), name)) store.delete(`${name}_split_${idx}`)
            store.delete(name)
            return true
        }

        if (get(name) !== null) {
            store.delete(name)
            return true
        }
        return false
    }

    return { add, get, remove }
}
