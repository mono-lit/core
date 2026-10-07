/**
 * Whether `key` can actually be assigned on `obj` — a plain expando, or an
 * accessor/data property that isn't read-only.
 *
 * This matters because a controller's `props` object legitimately carries keys
 * that are NOT element props: `monoDataGrid`'s `th[].summary` includes `prefix`
 * and `precision`, which the controller consumes for formatting. `prefix`
 * collides with the read-only native `Element.prefix`, and assigning it throws —
 * which took down the whole docs page render until this check existed.
 */
export function isSettable(obj: object, key: string): boolean {
  let o: object | null = obj
  while (o) {
    const d = Object.getOwnPropertyDescriptor(o, key)
    if (d) return !!(d.set || d.writable)
    o = Object.getPrototypeOf(o)
  }
  return true // never declared → a new expando, safe to set
}

/* ── event handlers in props ──────────────────────────────────────────────────
   A controller's `props` may carry listeners under the spelling a Vue template
   uses: `onClick`, `onToggle`, `onLoadingChange`, `onMnoChange`. They are the
   one kind of key that is NOT a property: writing `el.onClick = fn` would make
   an inert expando and nothing would ever fire. So they become DOM listeners,
   bookkept per element so a controller re-applying the same `props` object on
   every notify (the normal case) registers each handler exactly once, a
   changed function replaces the old listener, and `null` removes it. */

/** `{ onChange, onToggle, onLoadingChange, … }` typed from a component's `*Events` interface. */
export type MonoEventProps<E> = {
  [K in Extract<keyof E, string> as K extends `${string}-${string}`
    ? never
    : `on${Capitalize<K>}`]?: (event: E[K]) => void
}

const HANDLER_KEY = /^on[A-Z]/

/** Whether a props key names an event handler (`onClick`, `onLoadingChange`). */
export function isEventHandlerKey(key: string): boolean {
  return HANDLER_KEY.test(key)
}

/**
 * `onClick` → `click`, `onLoadingChange` → `loading-change`, `onMnoChange` →
 * `mno-change` — the same rule Vue applies to an `on*` listener prop, so a key
 * that works in a template works here.
 */
export function eventNameFromHandlerKey(key: string): string {
  const rest = key.slice(2)
  return rest.charAt(0).toLowerCase() + rest.slice(1).replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`)
}

type Handler = (event: Event) => void
interface Registered {
  fn: Handler
  listener: EventListener
}

/** Per element: event name → the handler currently attached through `props`. */
const attached = new WeakMap<object, Map<string, Registered>>()

function applyHandler(el: object, key: string, value: unknown): void {
  if (typeof value !== 'function' && value !== null) return
  const target = el as EventTarget
  if (typeof target.addEventListener !== 'function') return

  const name = eventNameFromHandlerKey(key)
  let map = attached.get(el)
  const current = map?.get(name)

  if (value === null) {
    if (current) {
      target.removeEventListener(name, current.listener)
      map!.delete(name)
    }
    return
  }

  const fn = value as Handler
  if (current?.fn === fn) return
  if (current) target.removeEventListener(name, current.listener)

  const listener: EventListener = (event) => {
    fn(event)
  }
  target.addEventListener(name, listener)
  if (!map) {
    map = new Map()
    attached.set(el, map)
  }
  map.set(name, { fn, listener })
}

/**
 * Remove every handler `applyProps` attached to `el`. Call it where an element
 * leaves its controller (an unbind, a re-bind to a different one) so the old
 * controller's handlers do not keep firing beside the new one's.
 */
export function detachEventHandlers(el: object): void {
  const map = attached.get(el)
  if (!map) return
  const target = el as EventTarget
  for (const [name, { listener }] of map) target.removeEventListener(name, listener)
  attached.delete(el)
}

/**
 * Write a controller's props onto an element.
 *
 * Two guards, both load-bearing:
 * - `undefined` values are skipped, so "not declared" never clobbers a value the
 *   template set;
 * - each write is equality-checked, so a sync can't schedule another update and
 *   loop.
 *
 * Handler keys (`onClick`, `onToggle`, …) become event listeners — see the
 * block above — never properties.
 *
 * Shared by `table-controller-core` (`monoDataGrid`/`monoDataDropdown` elements)
 * and `form-control-core` (`monoForm` controls) — the write loop is identical
 * and its failure modes are subtle enough to be worth having in one place.
 */
export function applyProps(el: object, patch: Record<string, unknown> | undefined): boolean {
  if (!patch) return false
  const self = el as Record<string, unknown>
  // Whether any PROPERTY was written — callers use it to skip a re-render when nothing moved.
  let changed = false
  for (const [k, v] of Object.entries(patch)) {
    if (v === undefined) continue
    if (isEventHandlerKey(k)) {
      applyHandler(el, k, v)
      continue
    }
    if (!isSettable(self, k)) continue
    if (!Object.is(self[k], v)) {
      self[k] = v
      changed = true
    }
  }
  return changed
}
