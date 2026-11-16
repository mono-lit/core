// hybrid-props.ts

/** Generic constructor type for Lit mixins: `<T extends Constructor<LitElement>>`. */
export type Constructor<T = object> = new (...args: any[]) => T

export function toKebabCase(value: string): string {
  return value.replace(/[A-Z]/g, (match) => `-${match.toLowerCase()}`)
}

export function toLowerCaseProp(value: string): string {
  return value.toLowerCase()
}

/* ── Aliases live on the PROTOTYPE, installed once per class ─────────────────────
   Every helper below is still called with the INSTANCE (`this`, from a constructor) — that is
   the public shape and it stays — but the accessor is defined on the instance's prototype, the
   first time that class constructs.

   They used to be defined on each instance, which cost far more than the ~50 `defineProperty`
   calls it looks like: an element carrying ~85 own accessors drops V8 into dictionary mode, and
   from then on EVERY property read on it — Lit's own reactive getters included — is a hash
   lookup. Measured on a 300×3 table of `mono-input`: constructing 1000 elements 97 → 26ms, and
   Lit's property getter 36 → 6ms of self time during mount.

   Behaviour is the same: an alias is a forwarding accessor that never stores state of its own,
   so sharing it through the prototype is indistinguishable from owning it, `'model-value' in el`
   is still true for Vue, and an own property (none exist today) would still win. */

/** Per prototype: which names each helper has already installed, so later instances skip the work. */
const hybridDone = new WeakMap<object, Set<string>>()
const accessorDone = new WeakMap<object, Set<string>>()

function doneSet(map: WeakMap<object, Set<string>>, proto: object): Set<string> {
  let set = map.get(proto)
  if (!set) map.set(proto, (set = new Set()))
  return set
}

/** Where an instance's aliases go: the prototype of its concrete (registered) class. */
function aliasHome(target: object): object {
  return Object.getPrototypeOf(target) ?? target
}

export function defineHybridPropAliases<T extends object>(
  target: T,
  props: string[],
): void {
  const proto = aliasHome(target)
  const done = doneSet(hybridDone, proto)

  for (const prop of props) {
    if (done.has(prop)) continue
    done.add(prop)

    const kebabProp = toKebabCase(prop)
    const lowerProp = toLowerCaseProp(prop)

    defineAlias(proto, kebabProp, prop)

    if (lowerProp !== prop && lowerProp !== kebabProp) {
      defineAlias(proto, lowerProp, prop)
    }
  }
}

/**
 * A hand-written accessor alias — for the names a plain forward cannot express (`css-class`
 * through a normalizing setter, `aria-label` coercing to a string, `maxlength` → a number).
 *
 * Installed once on the prototype like the hybrid aliases (see above), so `get` / `set` MUST be
 * `function`s that use `this`, never arrows closing over the constructing instance — the first
 * instance's closure would otherwise serve every element of the class.
 *
 * It OVERWRITES a hybrid alias of the same name, exactly as the per-instance
 * `Object.defineProperty` it replaces did (e.g. `cssClass`'s generated `css-class` forward is
 * replaced by the normalizing one).
 */
export function defineAccessorAliases<T extends object>(
  target: T,
  names: readonly string[],
  get: (this: T) => unknown,
  set: (this: T, value: unknown) => void,
): void {
  const proto = aliasHome(target)
  const done = doneSet(accessorDone, proto)

  for (const name of names) {
    if (done.has(name)) continue
    done.add(name)
    Object.defineProperty(proto, name, { get, set, configurable: true, enumerable: false })
  }
}

/**
 * Register a cross-name alias for a controller-binding prop — e.g.
 * `defineHybridPropAlias(el, 'controlTable', 'dataGrid')` makes `controlTable`,
 * `control-table` and `controltable` all read/write the canonical reactive
 * `dataGrid` property (so `.controlTable = …` still triggers Lit's update
 * cycle). Used to rename the controller props without a breaking change: the
 * new `control-*` spellings land here while the old `data-*` ones keep working.
 */
export function defineHybridPropAlias<T extends object>(
  target: T,
  aliasCamel: string,
  realProp: string,
): void {
  const proto = aliasHome(target)
  const done = doneSet(hybridDone, proto)
  const key = `${aliasCamel}\u0000${realProp}`
  if (done.has(key)) return
  done.add(key)

  const kebab = toKebabCase(aliasCamel)
  const lower = toLowerCaseProp(aliasCamel)
  defineAlias(proto, aliasCamel, realProp)
  defineAlias(proto, kebab, realProp)
  if (lower !== aliasCamel && lower !== kebab) defineAlias(proto, lower, realProp)
}

function defineAlias<T extends object>(
  target: T,
  alias: string,
  realProp: string,
): void {
  if (Object.prototype.hasOwnProperty.call(target, alias)) return

  Object.defineProperty(target, alias, {
    get() {
      return (this as any)[realProp]
    },

    set(value: unknown) {
      ;(this as any)[realProp] = value
    },

    configurable: true,
    enumerable: false,
  })
}

/**
 * Lit `hasChanged` for an array prop.
 *
 * **Load-bearing**, for exactly the reason `rateLimitHasChanged` is (see
 * `composables/rate-limit.ts`): `:items="[...]"` in a template allocates a NEW array
 * on every parent re-render. Under Lit's default `!==` the element sees a change
 * each time, so anything gated on `changed.has('items')` — resetting an
 * infinite-scroll page, invalidating a search memo, rebuilding a cache — runs on
 * renders where nothing about the data actually moved.
 *
 * Element-wise identity rather than a deep compare: rows are normally stable objects
 * owned by a store, so this catches the re-created-wrapper case cheaply. If the
 * consumer also rebuilds each row object the arrays are reported as different, which
 * is the safe direction.
 *
 * **Why this needs no "repair" step, unlike `mono-button-dropdown`.** That element
 * compares entries by CONTENT and deliberately ignores function fields, so it reports
 * "same" for entries that really were rebuilt — leaving cached listener state pointing
 * at the previous array (hence `_retargetItemParts()`). `arrayHasChanged` says "same"
 * only when the array holds literally the same objects in the same order, so nothing
 * item-related can have moved and there is nothing to retarget. Reach for the deeper
 * compare only where the callbacks are resolved late, and prove it.
 *
 * **Do NOT add this (or any `hasChanged`) to these — they hang real work off the
 * update cycle, so suppressing an update silently drops it:**
 *   - `chart-core.ts` — `updated()` IS the chart pipeline; its last step `_applyData()`
 *     is the only place chart.js is redrawn. A skipped update freezes the canvas.
 *   - `date-core.ts` — `updated()` drives `_rebuild()` / `_applyModelValue()`, so
 *     flatpickr would be stranded on stale config.
 *   - every `mono-table-*` element — `table-controller-core.ts` overrides `update()` to
 *     pull each element's slice of `monoDataGrid({ props })`.
 *   - every `monoForm`-bound control and `filter-builder-core.ts` — same `update()` hook
 *     (`form-control-core.ts`), used for form binding and visibility.
 *
 * Surveyed 2026-08-17 across all 26 component directories; the guarded props are
 * `select`/`tag-input` `items`, `tag-input` `modelValue`/`value`, `menu` +
 * `mono-menu-list` `items`, `tabs` `items`, both `breadcrumb` `items`, and
 * `file-upload` `modelValue`.
 */
export function arrayHasChanged(value: unknown, old: unknown): boolean {
  if (value === old) return false
  if (!Array.isArray(value) || !Array.isArray(old)) return true
  if (value.length !== old.length) return true

  for (let i = 0; i < value.length; i++) {
    if (value[i] !== old[i]) return true
  }

  return false
}

export const booleanStringConverter = {
  fromAttribute(value: unknown): boolean {
    if (value === null || value === undefined) return false
    // SSR (e.g. nuxt-ssr-lit) can pass the raw prop value — a boolean — into the
    // attribute converter instead of a string, so guard against non-strings.
    if (typeof value === 'boolean') return value

    const normalized = String(value).toLowerCase().trim()

    return normalized === '' || normalized === 'true'
  },

  toAttribute(value: boolean): string | null {
    return value ? '' : null
  },
}

export const numberStringConverter = {
  fromAttribute(value: string | null): number {
    if (value === null || value === '') return 0

    const parsed = Number(value)

    return Number.isFinite(parsed) ? parsed : 0
  },

  toAttribute(value: number): string | null {
    if (value === undefined || value === null) return null

    return String(value)
  },
}

/**
 * Like {@link numberStringConverter}, but an absent/blank attribute stays
 * `undefined` instead of collapsing to `0`.
 *
 * Needed wherever 0 is a meaningful value AND "not set" has to mean "fall back to
 * whatever the component computes" — e.g. `mono-modal` / `mono-drawer`'s `z-index`,
 * where 0 is a legal stacking level and unset means "let the popup stack decide".
 * Using the plain number converter there would pin every dialog to `z-index: 0`.
 */
export const optionalNumberConverter = {
  fromAttribute(value: string | null): number | undefined {
    if (value === null || value === '') return undefined

    const parsed = Number(value)

    return Number.isFinite(parsed) ? parsed : undefined
  },

  toAttribute(value: number | undefined): string | null {
    if (value === undefined || value === null) return null

    return String(value)
  },
}

export const stringConverter = {
  fromAttribute(value: string | null): string {
    return value ?? ''
  },

  toAttribute(value: string): string | null {
    return value ?? null
  },
}


