// The shared reactive state behind `monoState()`: the cookies and decoded JWTs that a
// host and its synced remotes all read from. Hydrated once, from mono.config.ts.

import {
  reactive,
  readonly,
  type App,
  type Plugin,
} from 'vue'

import { monoCookie, monoJwt } from './universal'

import { resolveMonoConfig, resolveEnv } from './create-config'

import type {
  MonoConfig,
  JWTCompleteTokenTypes,
  DefaultJWTTokenTypes,
} from './create-config'

/**
 * `token` and `refreshToken` are always present (they reset to `{}` rather than vanish),
 * so they stay named and typed. Any other key comes from a custom `jwt` entry in
 * mono.config.ts — type those at the call site with `monoState<Override>()`.
 */
type MonoJwtState = {
  token: Partial<JWTCompleteTokenTypes>
  refreshToken: Partial<DefaultJWTTokenTypes>
} & Record<string, Record<string, any>>

type MonoStateShape = {
  config?: MonoConfig

  cookie: Record<string, any>

  jwt: MonoJwtState
}
const _state = reactive<MonoStateShape>({
  config: undefined,

  jwt: {
    token: {},
    refreshToken: {},
  },

  cookie: {},
})

const monoStateReadonly = readonly(_state)

export function monoStatePatch(
  patch: { cookie?: Record<string, any>; jwt?: Partial<MonoJwtState> },
) {
  if (patch.cookie) {
    _state.cookie = {
      ..._state.cookie,
      ...patch.cookie,
    }
  }

  if (!patch.jwt) return

  // Per KEY, not per known-name: a custom jwt entry has to patch like `token` does, or it
  // hydrates once and can never be updated.
  const next: Record<string, Record<string, any>> = { ..._state.jwt }

  for (const [key, claims] of Object.entries(patch.jwt)) {
    if (!claims) continue

    next[key] = {
      ...(next[key] ?? {}),
      ...claims,
    }
  }

  _state.jwt = next as MonoJwtState
}

type DeepMerge<A, B> = {
  [K in keyof (A & B)]: K extends keyof A
    ? K extends keyof B
      ? A[K] extends object
        ? B[K] extends object
          ? DeepMerge<A[K], B[K]>
          : A[K] & B[K]
        : A[K] & B[K]
      : A[K]
    : K extends keyof B
      ? B[K]
      : never
}

export function monoState<Override extends object = {}>(): Readonly<
  Pick<DeepMerge<MonoStateShape, Override>, 'config' | 'cookie' | 'jwt'>
> {
  return monoStateReadonly as any
}

export function monoStateReset() {
  _state.cookie = {}

  // EVERY key, not just the two known ones — a custom jwt entry left behind here is an
  // identity that survives logout and greets the next user.
  _state.jwt = {
    token: {},
    refreshToken: {},
  } as MonoJwtState
}

/**
 * Bridge between mono.config.ts and monoState().
 *
 * This reads:
 * - configured cookies
 * - configured jwt token cookie
 * - configured refresh token cookie
 *
 * Then patches the shared reactive mono state.
 */
export function initMono(option: MonoConfig) {

  // Merge any object-form `extends` layers at runtime (browser-safe).
  option = resolveMonoConfig(option)

   _state.config = option

  for (const item of option.cookie ?? []) {
    try {
      const value = monoCookie().get(item.name, Boolean(item.split))

      if (value != null) {
        monoStatePatch({
          cookie: {
            [item.name]: value,
          },
        })
      }
    } catch {}
  }

  const patch: Record<string, Record<string, any>> = {}

  for (const [key, entry] of Object.entries(option.jwt ?? {})) {
    if (!entry) continue

    warnMisCasedJwtKey(key)

    // The dev-mode form: `name` is already-decoded claims, so take them as they are.
    if (typeof entry.name === 'object' && entry.name) {
      patch[key] = { ...entry.name }
      continue
    }

    if (typeof entry.name !== 'string') continue

    // Don't clobber a key that already holds claims — a route guard may have patched
    // something fresher in than whatever the cookie still says.
    const alreadyHydrated = Object.keys(_state.jwt[key] ?? {}).length > 0
    if (alreadyHydrated) continue

    const claims =
      monoJwt().cookieDecode?.({
        cookie: entry.name,
        splitCookie: Boolean(entry.split),
      }) ?? {}

    patch[key] = { ...claims }
  }

  if (Object.keys(patch).length) {
    monoStatePatch({ jwt: patch })
  }

  return option
}

/** The two keys mono itself reads by name. */
const KNOWN_JWT_KEYS = ['token', 'refreshToken']

/**
 * `jwt` accepts any key, which means TypeScript's excess-property check is off for the
 * block — so `refreshtoken` (lowercase `t`) compiles happily. It then hydrates as its own
 * entry while `monoState().jwt.refreshToken` stays empty, and every guard reading it sees
 * a logged-out user. Nothing else would ever report that, so say it here.
 */
function warnMisCasedJwtKey(key: string) {
  if (KNOWN_JWT_KEYS.includes(key)) return

  const known = KNOWN_JWT_KEYS.find(
    (k) => k.toLowerCase() === key.toLowerCase(),
  )

  if (!known) return

  console.warn(
    `[@mono-lit/utility] jwt key "${key}" looks like a mis-cased "${known}". It will hydrate as its ` +
      `own entry, and monoState().jwt.${known} will stay empty.`,
  )
}
function monoConfig() {
  return monoStateReadonly.config
}

/**
 * The active-environment values from `mono.config.ts`'s `env` block, resolved
 * for the current `NODE_ENV` (see {@link resolveEnv}) and merged across the
 * host+remote `extends` chain.
 *
 * - `monoEnv()` returns the whole flattened object.
 * - `monoEnv('API_BASE')` returns a single value (or `undefined`).
 *
 * Use it for non-secret, environment-specific values (e.g. an API base URL)
 * instead of a `.env` file — e.g. `fetching.api.main.url` can be built from
 * `monoEnv('API_BASE')`.
 */
function monoEnv(): Record<string, string | number | boolean>
function monoEnv<T = string | number | boolean>(key: string): T | undefined
function monoEnv(key?: string) {
  // `monoConfig()` is Vue `readonly()` (deeply frozen); cast to the mutable
  // shape `resolveEnv` expects — it only reads `config.env`, never mutates.
  const resolved = resolveEnv((monoConfig() ?? {}) as Partial<MonoConfig>)
  return key == null ? resolved : (resolved as any)[key]
}

/**
 * Vue plugin version.
 *
 * Usage:
 *
 * createApp(App)
 *   .use(createMono(config))
 *   .mount('#app')
 */
export function createMono(option: MonoConfig): Plugin {
  return {
    install(app: App) {
      initMono(option)

      app.provide('mono:config', option)
      app.provide('mono:state', monoStateReadonly)
    },
  }
}

// `monoState` / `monoStatePatch` / `monoStateReset` / `initMono` are exported at their
// declarations above.
export { monoConfig, monoEnv }