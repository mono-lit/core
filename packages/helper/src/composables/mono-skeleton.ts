// mono-skeleton — the universal `pending` prop and the automatic skeleton behind it.
//
// Every mono element (light `<mono-*>` AND shadow `<mono-shadow-*>`) gets a `pending`
// property through the mono `customElement` decorator (see ./mono-element.ts). While it
// resolves to true, the element's content is rendered inside `<phantom-ui loading>` —
// the structure-aware shimmer web component from the OPTIONAL peer
// `@aejkatappaja/phantom-ui` — so the skeleton is measured from the element's real DOM
// instead of being drawn by hand.
//
// ZERO-IMPORT ACTIVATION. This module never imports the peer: it watches the custom
// element registry and switches on the moment `phantom-ui` is defined, however it got
// there (the app's `main.ts`, the Nuxt plugin `@mono-lit/helper/nuxt` generates when the
// peer resolves, a CDN script). Without it `pending` is a complete no-op — no wrapper,
// no attribute on the DOM, no error — so the prop can ship on every element.
//
// THE VALUE. `pending` is tri-state:
//   - `undefined` (no attribute, or `pending="auto"`) — AUTO, see below
//   - `true` / `false` (attribute `pending`, `pending="true"`, `pending="false"`, or the
//     property) — manual, always wins
//   - an OBJECT (property only, `:pending.prop="{ active: true, count: 6 }"`):
//     `active` plays the boolean's part (omitted = auto) and the other keys are phantom-ui
//     options in camelCase, applied to the wrapper as attributes.
//
// AUTO. In an SSR app a LIGHT element starts pending on its first connect and releases
// itself. Data-driven elements (table helpers, select / tag-input with a dataSource, chart,
// dropdown-table) release when their first load has finished — see `monoPendingAuto` /
// `_monoPendingReady` below — and while any of them is still waiting the PAGE is loading:
// every render-driven element (button, input, card, …) holds its skeleton too, so the page
// swaps in as one. A page with no data-driven element releases them within the same
// microtask, before the first paint — nothing flashes. Shadow elements always default to
// false (their job is the server-rendered shell), and in a plain SPA everything defaults
// to false; manual `pending` works everywhere.
//
// THE WRAPPER exists only WHILE pending: `render()` returns `<phantom-ui loading>…</phantom-ui>`
// around the element's template while `pending` resolves true, and the bare template
// otherwise — so an idle element's DOM is exactly what it is without the skeleton (light
// builds rely on direct-child selectors from the host and on scanning the host's children).
// A flip re-renders the inner DOM once; the light-slot placement that runs on every update
// re-homes the consumer's nodes. A hydrating shadow render never wraps (the server never
// activates, and @lit-labs/ssr hydration needs the client's first template to match).
//
// DEFAULTS flow through `createMonoUI`: a reserved `skeleton` key for the global phantom
// options + the `ssr` flag, and `pending` inside a tag's config for per-tag defaults
// (`createMonoUI({ 'mono-table-loading': { pending: { count: 6 } } })`). Merge order for
// every phantom option: element object > tag default > global default > phantom's own.
//
// Server-safe: everything that touches the DOM is behind `isServer`, and on the server
// nothing is ever pending.

import type { ReactiveElement } from 'lit'

/**
 * "Is there a DOM to render into?" — deliberately NOT lit's `isServer`. That flag is a
 * build-time constant of lit's node entry, so it is `true` wherever Node's export
 * conditions pick that build — including a jsdom test run, where this feature must work.
 * On a real server (`@lit-labs/ssr` + its dom shim) there is a `customElements` but no
 * `document`, which is exactly the distinction that matters here.
 */
const hasDom = typeof document !== 'undefined' && typeof customElements !== 'undefined'

/** phantom-ui's options, camelCase (applied to the wrapper as kebab-case attributes). */
export interface MonoPhantomProps {
  /** `shimmer` (default) | `pulse` | `breathe` | `solid`. */
  animation?: 'shimmer' | 'pulse' | 'breathe' | 'solid' | (string & {})
  /** `skeleton` (default, hides the content) | `overlay` (dims it and sweeps). */
  mode?: 'skeleton' | 'overlay' | (string & {})
  shimmerDirection?: 'ltr' | 'rtl' | 'ttb' | 'btt' | (string & {})
  /** Sweep colour. Unset = the mono theme's (`--mono-skeleton-color`). */
  shimmerColor?: string
  /** Block colour. Unset = the mono theme's (`--mono-skeleton-bg`). */
  backgroundColor?: string
  /** Animation cycle, seconds (default 1.5). */
  duration?: number
  /** Delay between blocks, seconds. */
  stagger?: number
  /** Fade-out when loading ends, seconds. */
  reveal?: number
  /** Repeat the measured row set N times (table placeholders). */
  count?: number
  /** Gap between repeated rows, px. */
  countGap?: number
  /** Radius for flat elements, px (default 4). */
  fallbackRadius?: number
  /** Screen-reader announcement (default "Loading"). */
  loadingLabel?: string
  /** Measure inside open shadow roots of slotted components. */
  pierceShadow?: boolean
  /** Outline the measured blocks. */
  debug?: boolean
}

/** The object form of `pending`: `active` plays the boolean's part (omitted = auto). */
export type MonoPendingOptions = { active?: boolean } & Partial<MonoPhantomProps>

/** `pending` — `true` / `false`, or an object with phantom-ui options. `undefined` = auto. */
export type MonoPending = boolean | MonoPendingOptions

/** `createMonoUI({ skeleton: {...} })` — global phantom defaults + the SSR flag. */
export interface MonoSkeletonDefaults extends Partial<MonoPhantomProps> {
  /**
   * Whether the app renders on the server. Decides the AUTO default of light elements:
   * `true` → pending on first connect, `false` → never pending unless asked. The Nuxt
   * module sets it from `nuxt.options.ssr`; unset, a Nuxt payload marker is sniffed.
   */
  ssr?: boolean
  /**
   * Safety net for an automatic pending that never gets its "loaded" signal: released
   * after this many ms (default 15000; `0` disables).
   */
  maxWait?: number
}

export interface MonoSkeletonStatus {
  /** `phantom-ui` is defined in this realm (and the skeleton is not disabled). */
  active: boolean
  /** The configured SSR flag (`null` = not set, the sniffed value is used). */
  ssr: boolean | null
  /** Elements whose first render happened BEFORE activation (no skeleton on that first paint). */
  createdBeforeActive: number
  createdBeforeActiveTags: string[]
}

/** Which "loaded" signal an element's AUTO pending waits for. */
export type MonoPendingAuto = 'render' | 'data' | 'never'

/** Statics a Core may declare to tune the automatic behaviour. */
export interface MonoPendingStatics {
  /**
   * `'render'` (default) — released in the element's first update, before first paint.
   * `'data'` — released when `_monoPendingReady()` first returns true (re-checked on
   * every update; the Cores request one on each controller / source notify).
   * `'never'` — never automatic (overlays like modal / drawer); manual still works.
   */
  monoPendingAuto?: MonoPendingAuto
  /**
   * `'wrap'` (default) — the mixin wraps `render()` in `<phantom-ui>`.
   * `'custom'` — the element draws its own placeholder from `monoPendingActive(this)`
   * (e.g. `mono-table-loading`); the mixin only resolves the state.
   */
  monoPendingMode?: 'wrap' | 'custom'
  /**
   * How the element's own pending is drawn. `'phantom'` (default) — phantom-ui measures the
   * content (a wrapper, one re-render per flip). `'css'` — only the `mono-pending` host
   * attribute, i.e. the CSS-only block: no wrapper, no re-render, right for small elements
   * whose measured skeleton would be one bar anyway (the table helpers). Render-driven
   * elements held by a loading page draw through phantom like everything else; the CSS lane
   * is their fallback while phantom-ui is not (yet) defined.
   */
  monoPendingDraw?: 'phantom' | 'css'
}

/** A render-driven element held by the page (internal). */
export interface MonoHeldElement {
  _monoReleaseHeld(): void
}

// ─── shared state ───────────────────────────────────────────────────────────

interface MonoSkeletonState {
  active: boolean
  disabled: boolean
  ssr: boolean | null
  ssrSniffed: boolean | null
  defaults: MonoSkeletonDefaults
  watching: boolean
  createdBeforeActive: number
  createdBeforeActiveTags: string[]
  warnedLate: boolean
  /** Data-driven elements still waiting for their first load (the page is "loading"). */
  waiting: Set<object>
  /** Render-driven elements held pending until `waiting` empties. */
  holders: Set<MonoHeldElement>
}

/**
 * ONE store per realm, on `globalThis` (same reasoning as `mono-ui.ts`): the light and
 * shadow builds are separate bundles and a pnpm peer fork can install two copies of the
 * package, yet all of them must agree on "active" and on the defaults.
 */
const STATE_KEY = Symbol.for('mono-helper.skeleton')
const state: MonoSkeletonState = ((globalThis as Record<symbol, unknown>)[STATE_KEY] ??= {
  active: false,
  disabled: false,
  ssr: null,
  ssrSniffed: null,
  defaults: {},
  watching: false,
  createdBeforeActive: 0,
  createdBeforeActiveTags: [],
  warnedLate: false,
  waiting: new Set<object>(),
  holders: new Set<MonoHeldElement>(),
} satisfies MonoSkeletonState) as MonoSkeletonState

const PHANTOM_TAG = 'phantom-ui'
const DEFAULT_MAX_WAIT = 15000

/** Per-element slots the Cores can read without depending on the mixin's class shape. */
const TAG_DEFAULT = Symbol.for('mono-helper.skeleton.tagDefault')
const PENDING_ACTIVE = Symbol.for('mono-helper.skeleton.active')
const PENDING_GRACE = Symbol.for('mono-helper.skeleton.grace')
const PENDING_PHANTOM = Symbol.for('mono-helper.skeleton.phantom')

/** Where `applyMonoUIDefaults` parks a tag's `pending` default (not assigned to the prop). */
export const MONO_PENDING_TAG_DEFAULT: unique symbol = TAG_DEFAULT as never

function isActive(): boolean {
  return state.active && !state.disabled
}

/**
 * Start following the registry. Idempotent; a no-op on the server. Called by the mono
 * `customElement` decorator, so the watcher exists before any element constructs.
 */
export function watchSkeletonActivation(): void {
  if (!hasDom || state.watching) return
  state.watching = true
  const activate = (): void => {
    state.active = true
    if (state.createdBeforeActive > 0 && !state.warnedLate) {
      state.warnedLate = true
      const tags = state.createdBeforeActiveTags.slice(0, 5).join(', ')
      console.warn(
        `[mono-skeleton] phantom-ui was defined after ${state.createdBeforeActive} mono element(s) had rendered (${tags}); ` +
          'their first paint had no skeleton. Load "@aejkatappaja/phantom-ui" before the app mounts (main.ts import, or let @mono-lit/helper/nuxt do it).',
      )
    }
  }
  if (customElements.get(PHANTOM_TAG)) {
    activate()
    return
  }
  void customElements.whenDefined(PHANTOM_TAG).then(activate, () => {})
}

/**
 * Is this an SSR app? The explicit flag (`createMonoUI({ skeleton: { ssr } })`, which the
 * Nuxt module sets from `nuxt.options.ssr`) wins; otherwise the Nuxt payload marker is
 * sniffed once (`<script id="__NUXT_DATA__" data-ssr="true">`).
 */
export function isMonoSsrApp(): boolean {
  if (state.ssr !== null) return state.ssr
  if (state.ssrSniffed === null) {
    state.ssrSniffed =
      hasDom && document.getElementById('__NUXT_DATA__')?.getAttribute('data-ssr') === 'true'
  }
  return state.ssrSniffed
}

/** Set the global defaults (`createMonoUI`'s `skeleton` key routes here). `false` disables the skeleton. */
export function setMonoSkeletonDefaults(defaults: MonoSkeletonDefaults | false | undefined): void {
  if (defaults === false) {
    state.disabled = true
    return
  }
  state.disabled = false
  const { ssr, ...rest } = defaults ?? {}
  state.ssr = typeof ssr === 'boolean' ? ssr : null
  state.defaults = { ...rest }
}

export function getMonoSkeletonStatus(): MonoSkeletonStatus {
  return {
    active: isActive(),
    ssr: state.ssr,
    createdBeforeActive: state.createdBeforeActive,
    createdBeforeActiveTags: [...state.createdBeforeActiveTags],
  }
}

/** Drop defaults / flag / counters (tests). `active` stays — an element cannot be undefined. */
export function resetMonoSkeleton(): void {
  state.disabled = false
  state.ssr = null
  state.ssrSniffed = null
  state.defaults = {}
  state.createdBeforeActive = 0
  state.createdBeforeActiveTags = []
  state.warnedLate = false
  state.waiting.clear()
  state.holders.clear()
}

// ─── value helpers ──────────────────────────────────────────────────────────

const PHANTOM_KEYS: ReadonlyArray<keyof MonoPhantomProps> = [
  'animation',
  'mode',
  'shimmerDirection',
  'shimmerColor',
  'backgroundColor',
  'duration',
  'stagger',
  'reveal',
  'count',
  'countGap',
  'fallbackRadius',
  'loadingLabel',
  'pierceShadow',
  'debug',
]

const kebab = (name: string): string => name.replace(/[A-Z]/g, (m) => `-${m.toLowerCase()}`)

function isPendingObject(value: unknown): value is MonoPendingOptions {
  return !!value && typeof value === 'object'
}

/** The boolean a `pending` value carries (`undefined` = auto). */
function activeOf(value: MonoPending | undefined): boolean | undefined {
  if (typeof value === 'boolean') return value
  if (isPendingObject(value)) return typeof value.active === 'boolean' ? value.active : undefined
  return undefined
}

/** Only the phantom options of a value (an object), as a plain record. */
function phantomOf(value: unknown): Record<string, unknown> {
  const out: Record<string, unknown> = {}
  if (!isPendingObject(value)) return out
  for (const key of PHANTOM_KEYS) {
    const v = (value as Record<string, unknown>)[key]
    if (v !== undefined) out[key] = v
  }
  return out
}

function shallowEqual(a: Record<string, unknown>, b: Record<string, unknown>): boolean {
  const ka = Object.keys(a)
  const kb = Object.keys(b)
  if (ka.length !== kb.length) return false
  for (const k of ka) if (a[k] !== b[k]) return false
  return true
}

/** `hasChanged` for the property: booleans by value, objects shallowly. */
export function pendingChanged(next: unknown, prev: unknown): boolean {
  if (isPendingObject(next) && isPendingObject(prev)) {
    return !shallowEqual(next as Record<string, unknown>, prev as Record<string, unknown>)
  }
  return next !== prev
}

/**
 * The attribute converter. The attribute form is boolean-only: `pending`,
 * `pending="true"` → true; `pending="false"` → false; absent or `pending="auto"` → auto.
 * A real boolean is accepted too (what a server renderer hands over).
 */
export const pendingConverter = {
  fromAttribute(value: unknown): MonoPending | undefined {
    if (value === null || value === undefined) return undefined
    if (typeof value === 'boolean') return value
    const s = String(value).trim().toLowerCase()
    if (s === 'auto') return undefined
    return s === '' || s === 'true'
  },
  toAttribute(): null {
    return null
  },
}

/**
 * Register the `pending` property on a registered element class. Called by the mono
 * `customElement` decorator BEFORE `customElements.define`, so the attribute lands in
 * Lit's attribute map when `observedAttributes` is read.
 */
export function registerPendingProperty(cls: unknown): void {
  ;(cls as typeof ReactiveElement).createProperty('pending', {
    attribute: 'pending',
    reflect: false,
    converter: pendingConverter,
    hasChanged: pendingChanged,
  })
}

// ─── reading the resolved state from a Core ─────────────────────────────────

/** Whether `pending` currently resolves to true for `el` (set before each render). */
export function monoPendingActive(el: object): boolean {
  return !!(el as Record<symbol, unknown>)[PENDING_ACTIVE]
}

/**
 * True once one macrotask has passed since the element first resolved pending — lets a
 * `'data'` Core say "no controller / source after one tick → nothing to wait for" without
 * releasing before a binding made in the consumer's `onMounted`.
 */
export function monoPendingGrace(el: object): boolean {
  return !!(el as Record<symbol, unknown>)[PENDING_GRACE]
}

/**
 * The phantom options resolved for `el` while pending (element object over tag default
 * over global default), camelCase keys. Empty while not pending. For `'custom'` Cores
 * that render their own `<phantom-ui>` and want a value in the template (e.g. `count`).
 */
export function monoPhantomOptions(el: object): Readonly<Record<string, unknown>> {
  return ((el as Record<symbol, unknown>)[PENDING_PHANTOM] ?? {}) as Record<string, unknown>
}

/**
 * Apply the resolved phantom options to a `<phantom-ui>` element as attributes (used by
 * the mixin for its wrapper, and by `'custom'` Cores for the phantom they render).
 * Diffed against what was last applied to that element, so unchanged values cost nothing.
 */
export function monoApplyPhantomOptions(el: object, target: Element | null | undefined): void {
  if (!target) return
  const next = ((el as Record<symbol, unknown>)[PENDING_PHANTOM] ?? {}) as Record<string, unknown>
  const store = target as unknown as Record<symbol, Record<string, unknown> | undefined>
  const prev = store[PENDING_PHANTOM] ?? {}
  if (shallowEqual(next, prev)) return
  for (const key of new Set([...Object.keys(prev), ...Object.keys(next)])) {
    const value = next[key]
    const attr = kebab(key)
    if (value === undefined || value === null || value === false) target.removeAttribute(attr)
    else if (value === true) target.setAttribute(attr, '')
    else target.setAttribute(attr, String(value))
  }
  store[PENDING_PHANTOM] = { ...next }
}

// ─── internals shared with the mixin (./mono-pending.ts) ────────────────────
//
// The mixin needs `lit` (`html` for the wrapper template) and therefore lives in its own
// module: THIS module must stay lit-free, because `mono-ui.ts` (reached from the pure
// `@mono-lit/helper` root entry, i.e. from an early Nuxt plugin) imports it — and evaluating
// `lit-element` before nuxt-ssr-lit installs its hydrate-support hook silently disables
// `defer-hydration` for every server-rendered shadow element.
/** @internal */
export const monoSkeletonInternals = {
  hasDom,
  isActive,
  state,
  slots: {
    TAG_DEFAULT,
    PENDING_ACTIVE,
    PENDING_GRACE,
    PENDING_PHANTOM,
  },
  activeOf,
  phantomOf,
  PHANTOM_TAG,
  DEFAULT_MAX_WAIT,
} as const

// ─── host-children helpers for the light builds ─────────────────────────────
//
// A light element that (re)captures its slotted children enumerates `this.childNodes` and
// moves what it finds into its regions, skipping its own render root by class / position.
// With the skeleton on, the host's first child is the `<phantom-ui mono-skeleton>` WRAPPER
// around that root — not a consumer node — so every such enumeration goes through these,
// which leave the wrapper out. (Without the skeleton they are plain `Array.from`.)

/** The `<phantom-ui>` wrapper the skeleton mixin renders around an element's content. */
export function isMonoSkeletonWrapper(node: Node | null | undefined): boolean {
  return (
    !!node &&
    node.nodeType === 1 &&
    (node as Element).localName === PHANTOM_TAG &&
    (node as Element).hasAttribute('mono-skeleton')
  )
}

/** `Array.from(host.childNodes)` minus the skeleton wrapper. */
export function monoHostChildNodes(host: Node): Node[] {
  return Array.from(host.childNodes).filter((n) => !isMonoSkeletonWrapper(n))
}

/** `Array.from(host.children)` minus the skeleton wrapper. */
export function monoHostChildren(host: Element): Element[] {
  return Array.from(host.children).filter((n) => !isMonoSkeletonWrapper(n))
}
