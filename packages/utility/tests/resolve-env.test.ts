import { describe, it, expect } from 'vitest'
import { resolveEnv, type MonoConfig } from '../src/composables/create-config'

/**
 * `resolveEnv` — how a `mono.config.ts` `env` block collapses to the values
 * `monoEnv()` hands to app code.
 *
 * Background: `detectMode()` (resolveEnv's default `mode`) used to alias
 * `import.meta` before reading `.env`, which defeated Vite's static replacement.
 * Inside a browser bundle it therefore returned `undefined` — and `process` does
 * not exist there either — so a production build silently resolved `env.default`,
 * i.e. the DEV base URLs. The apps' fix is to pass an already-resolved single
 * `default` block; these cover both halves of that contract.
 */

const DEV = 'https://dev-api.example.com'
const PROD = 'https://api.example.com'

/** A raw per-mode map, the shape that used to be passed straight through. */
const perModeConfig = {
    env: {
        default: { VITE_API_BASE_URL: DEV },
        development: { VITE_API_BASE_URL: DEV },
        production: { VITE_API_BASE_URL: PROD },
    },
} as Partial<MonoConfig>

/** The shape the apps now pass: already resolved for the active mode. */
const resolvedConfig = {
    env: { default: { VITE_API_BASE_URL: PROD } },
} as Partial<MonoConfig>

describe('resolveEnv', () => {
    it('returns {} when there is no env block', () => {
        expect(resolveEnv({}, 'production')).toEqual({})
    })

    it('merges env.default with the active block, active wins', () => {
        const config = {
            env: {
                default: { VITE_API_BASE_URL: DEV, SHARED: 'keep' },
                production: { VITE_API_BASE_URL: PROD },
            },
        } as Partial<MonoConfig>

        expect(resolveEnv(config, 'production')).toEqual({
            VITE_API_BASE_URL: PROD,
            SHARED: 'keep',
        })
    })

    it('picks the production block for mode "production"', () => {
        expect(resolveEnv(perModeConfig, 'production').VITE_API_BASE_URL).toBe(PROD)
    })

    it('picks the development block for mode "development"', () => {
        expect(resolveEnv(perModeConfig, 'development').VITE_API_BASE_URL).toBe(DEV)
    })

    it('falls back to env.default for an unknown mode', () => {
        expect(resolveEnv(perModeConfig, 'staging').VITE_API_BASE_URL).toBe(DEV)
    })

    /**
     * The exact failure this bug was: no detectable mode collapses a per-mode map
     * to its `default` block, which every app uses for DEV URLs. Asserted so the
     * hazard stays visible rather than being rediscovered from a built bundle.
     */
    it('collapses a per-mode map to the dev default when the mode is undetectable', () => {
        expect(resolveEnv(perModeConfig, undefined).VITE_API_BASE_URL).toBe(DEV)
    })

    /**
     * ...and why the apps pass a pre-resolved single block: it survives an
     * undetectable mode, so `monoEnv()` cannot silently downgrade to dev URLs.
     */
    it('a default-only block resolves identically for every mode', () => {
        for (const mode of ['production', 'development', 'staging', undefined]) {
            expect(resolveEnv(resolvedConfig, mode).VITE_API_BASE_URL).toBe(PROD)
        }
    })
})
