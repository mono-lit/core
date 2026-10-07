// createMonoUI — app-wide default props for every mono component.
//
//   createMonoUI({
//     'mono-button': { size: 'xs', variant: 'outline' },
//     'mono-input':  { size: 'sm', clearable: true },
//   })
//
// PRECEDENCE: built-in default < createMonoUI < the element's own attributes /
// props / controller. The defaults are written at the END of each element's
// construction (see `mono-element.ts`) — after every built-in default, before any
// attribute the parser or a framework applies — so an explicit value always wins,
// and the default is already in place for the first (synchronous, in the light
// build) render and for any logic that reads the prop on connect.
//
// One key covers both builds: `mono-button` also applies to `mono-shadow-button`.
// An explicit `mono-shadow-*` key, if given, is merged on top for the shadow build.
//
// Call it FIRST — in main.ts before `app.mount()`, or through Nuxt's
// `mono.helper.ui`. Elements created before the call keep their built-in
// defaults; the call warns when that has happened (`getMonoUIStatus()`).
//
// Server-safe: no DOM access. The store is process-wide module state, which is
// fine for what it holds — static configuration, identical for every request.
import {
  MONO_PENDING_TAG_DEFAULT,
  resetMonoSkeleton,
  setMonoSkeletonDefaults,
  type MonoSkeletonDefaults,
} from './mono-skeleton'

/**
 * Tag → props map for typed configs. `scripts/gen-vue-types.mjs` augments it in
 * the published types (`'mono-button': ButtonProps`, …); it is empty in source.
 */
// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface MonoUIComponents {}

type KnownConfig = { [K in keyof MonoUIComponents]?: Partial<MonoUIComponents[K]> }

/**
 * Per-component default props. Keys are tags (`mono-button`); props are camelCase or kebab-case.
 * The reserved `skeleton` key holds the global defaults of the automatic skeleton
 * (`pending`, see ./mono-skeleton.ts) and its `ssr` flag; `false` disables it.
 */
export type MonoUIConfig = KnownConfig & {
  skeleton?: MonoSkeletonDefaults | false
} & { [tag: `mono-${string}`]: Record<string, unknown> | undefined }

export interface MonoUI {
  readonly config: Readonly<MonoUIConfig>
  /** Vue plugin hook — a no-op; the call already applied the config. */
  install(app?: unknown): void
}

export interface MonoUIStatus {
  /** `createMonoUI` has been called (and not reset). */
  configured: boolean
  /** Mono elements constructed BEFORE the current config was set — they kept built-in defaults. */
  createdBefore: number
  /** Their tags, first occurrence order. */
  createdBeforeTags: string[]
}

/**
 * ONE store per realm, on `globalThis`. This module is bundled more than once:
 * the light and shadow builds are separate Vite builds, so `@mono-lit/helper` (which
 * `createMonoUI` is imported from) and `@mono-lit/helper/ui/shadow/*` each carry their
 * own copy — and a pnpm peer fork can install two copies of the whole package.
 * Module-local state would give every copy its own config, and shadow elements
 * would silently ignore the app's. `Symbol.for` resolves to the same key in all
 * of them.
 */
interface MonoUIState {
  store: Record<string, Record<string, unknown>> | null
  createdTotal: number
  createdTags: string[]
  createdBeforeConfig: number
  createdBeforeConfigTags: string[]
  warned: Set<string>
}

const STATE_KEY = Symbol.for('mono-helper.ui')
const state: MonoUIState = ((globalThis as Record<symbol, unknown>)[STATE_KEY] ??= {
  store: null,
  createdTotal: 0,
  createdTags: [],
  createdBeforeConfig: 0,
  createdBeforeConfigTags: [],
  warned: new Set<string>(),
} satisfies MonoUIState) as MonoUIState

const SHADOW_PREFIX = 'mono-shadow-'

function warnOnce(key: string, message: string): void {
  if (state.warned.has(key)) return
  state.warned.add(key)
  console.warn(`[mono-ui] ${message}`)
}

const camel = (name: string): string => name.replace(/-([a-z0-9])/g, (_m, c: string) => c.toUpperCase())

/** Arrays and plain objects are copied per element, so one element cannot mutate the shared config. */
function fresh(value: unknown): unknown {
  if (Array.isArray(value)) return [...value]
  if (value && typeof value === 'object' && Object.getPrototypeOf(value) === Object.prototype) {
    return { ...(value as Record<string, unknown>) }
  }
  return value
}

/**
 * Set the app-wide default props. Call once, first — usually in `main.ts`:
 *
 * ```ts
 * app.use(createMonoUI({ 'mono-button': { size: 'xs' } }))
 * // or simply
 * createMonoUI({ 'mono-button': { size: 'xs' } })
 * ```
 *
 * A later call replaces the previous config for elements created afterwards.
 */
export function createMonoUI(config: MonoUIConfig = {}): MonoUI {
  const next: Record<string, Record<string, unknown>> = {}
  // The skeleton's global defaults + ssr flag live in their own store (shared the same way).
  setMonoSkeletonDefaults(config.skeleton)
  for (const [tag, props] of Object.entries(config as Record<string, unknown>)) {
    if (tag === 'skeleton') continue
    if (!/^mono-[a-z0-9-]+$/.test(tag)) {
      warnOnce(`tag:${tag}`, `"${tag}" is not a mono component tag — expected "mono-<name>". Ignored.`)
      continue
    }
    if (!props || typeof props !== 'object') continue
    next[tag] = { ...(props as Record<string, unknown>) }
  }

  // The "must run first" check: anything constructed before now kept its
  // built-in defaults. Browser only — on a server the store is process-wide, so the
  // elements counted here belong to EARLIER requests (the Nuxt plugin calls this once
  // per request, before that request renders anything), not to a late call.
  state.createdBeforeConfig = state.createdTotal
  state.createdBeforeConfigTags = [...state.createdTags]
  if (state.createdTotal > 0 && typeof document !== 'undefined') {
    const tags = state.createdTags.slice(0, 5).join(', ') + (state.createdTags.length > 5 ? ', …' : '')
    console.warn(
      `[mono-ui] createMonoUI() ran after ${state.createdTotal} mono element${state.createdTotal === 1 ? ' was' : 's were'} ` +
        `created (${tags}); ${state.createdTotal === 1 ? 'it keeps its' : 'those keep their'} built-in defaults. ` +
        'Call createMonoUI() first in main.ts, before app.mount().',
    )
  }

  state.store = next
  const snapshot = { ...next } as MonoUIConfig
  return {
    config: snapshot,
    install() {
      /* the call already applied it; `app.use` is only a convenience */
    },
  }
}

/** The current config, or `null` when `createMonoUI` has not been called. */
export function getMonoUI(): Readonly<MonoUIConfig> | null {
  return state.store as MonoUIConfig | null
}

/** Whether the config is set, and how many elements were created before it was. */
export function getMonoUIStatus(): MonoUIStatus {
  return {
    configured: state.store !== null,
    createdBefore: state.store ? state.createdBeforeConfig : state.createdTotal,
    createdBeforeTags: state.store ? [...state.createdBeforeConfigTags] : [...state.createdTags],
  }
}

/** Drop the config (tests, or reconfiguring before mount). Elements created afterwards get built-in defaults. */
export function resetMonoUI(): void {
  resetMonoSkeleton()
  state.store = null
  state.createdTotal = 0
  state.createdTags.length = 0
  state.createdBeforeConfig = 0
  state.createdBeforeConfigTags = []
  state.warned.clear()
}

/**
 * Apply the configured defaults to a freshly constructed element. Called by the
 * mono `customElement` decorator at the end of construction — not public API.
 * @internal
 */
export function applyMonoUIDefaults(el: HTMLElement, tag: string): void {
  state.createdTotal++
  if (!state.createdTags.includes(tag)) state.createdTags.push(tag)
  if (!state.store) return

  const base = tag.startsWith(SHADOW_PREFIX) ? `mono-${tag.slice(SHADOW_PREFIX.length)}` : tag
  const props = { ...(state.store[base] ?? {}), ...(base !== tag ? (state.store[tag] ?? {}) : {}) }

  for (const [key, value] of Object.entries(props)) {
    if (value === undefined) continue
    const prop = camel(key)
    // A tag's `pending` default is PARKED, not assigned: the element's own object form
    // still has to merge over it (and `undefined` on the prop must keep meaning "auto").
    if (prop === 'pending') {
      ;(el as unknown as Record<symbol, unknown>)[MONO_PENDING_TAG_DEFAULT] = fresh(value)
      continue
    }
    if (!(prop in el)) {
      warnOnce(`prop:${base}:${prop}`, `<${base}> has no prop "${key}". Ignored.`)
      continue
    }
    ;(el as unknown as Record<string, unknown>)[prop] = fresh(value)
  }
}
