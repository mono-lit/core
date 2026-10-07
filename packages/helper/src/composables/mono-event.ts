// mono-event.ts — the one place a mono component dispatches an event from.
//
// Every component event goes out under THREE names:
//
//   dispatchMonoEvent(this, 'change', detail)
//     → 'change'      the plain name — what a template listens to: `@change`
//     → 'mno-change'  the prefixed alias every existing consumer already uses
//     → 'mnoChange'   the camel twin of the prefixed one
//
// The plain name is the convention; `mno-*` is kept so nothing written against
// it breaks. Both carry the SAME `detail` object.
//
// The plain name is the interesting half, because it can collide with a native
// event the browser is already sending. A text field's `mno-input` is emitted
// from the inner `<input>`'s native `input` handler — and that native `input`
// ALSO bubbles up to the host, where a consumer's `@input` already receives it.
// Dispatching a second `input` there would fire their handler twice. So:
//
//  DECORATE  when the mono event was derived from a native event of the SAME
//            name that will reach the host by itself: define `detail` on that
//            native event and let it go. The consumer gets the one event they
//            get today, now with `$event.detail.modelValue`. Whether it reaches
//            the host depends on the build — a light-DOM child's event must
//            bubble, a shadow child's must be composed (`change` is not, `focus`
//            bubbles nowhere) — so `reachesHost` decides per event, per build.
//  SYNTHESIZE otherwise: a CustomEvent under the plain name from the host.
//
//  NEVER synthesize a DEVICE event (`click`, `pointerdown`, `keydown`, …). A
//  synthetic `click` bubbling out of a component would reach every
//  document-level outside-click closer and every delegated row trigger in the
//  library, and could double a real click on the way. A device name is only
//  ever the decorated native event; a component that wants keyboard activation
//  to count as a click calls `.click()` on its native control, as a `<button>`
//  does on Enter.
//
//  Names that global handlers hook (`error` → window error reporting, `submit`
//  → an enclosing `<form>`, `focus`/`blur` → focus traps) are synthesized
//  NON-bubbling: `@error` on the element still fires, nothing beyond it does.

/** Options for {@link dispatchMonoEvent}. */
export interface MonoEventOptions {
  /**
   * The native DOM event this mono event was derived from, if any. Defaults to
   * `detail.sourceEvent` when that is an `Event` — which is what every model
   * detail already carries.
   */
  sourceEvent?: Event | null
  /**
   * The plain (unprefixed) name to emit. Defaults to `name`. Give a different
   * one when the mono name is not what the plain event means — `mno-click` on
   * a modal is an open-state change, so its plain name is `toggle`. `false`
   * emits no plain event at all.
   */
  alias?: string | false
}

/**
 * Device-originated event names — decorated when native, never synthesized.
 * See the header for why.
 */
export const MONO_DEVICE_EVENTS: ReadonlySet<string> = new Set([
  'click',
  'dblclick',
  'auxclick',
  'contextmenu',
  'mousedown',
  'mouseup',
  'mousemove',
  'mouseenter',
  'mouseleave',
  'mouseover',
  'mouseout',
  'pointerdown',
  'pointerup',
  'pointermove',
  'pointerenter',
  'pointerleave',
  'pointerover',
  'pointerout',
  'pointercancel',
  'keydown',
  'keyup',
  'keypress',
  'touchstart',
  'touchend',
  'touchmove',
  'touchcancel',
  'wheel',
])

/**
 * Plain names dispatched WITHOUT bubbling when synthesized: their native
 * namesakes do not bubble either, and something above the element (a form, the
 * window's error reporting, a focus trap) would act on a stray one.
 */
export const MONO_NON_BUBBLING_ALIASES: ReadonlySet<string> = new Set([
  'focus',
  'blur',
  'submit',
  'reset',
  'error',
  'load',
  'abort',
  'scroll',
  'resize',
  'invalid',
])

/** `loading-change` → `loadingChange`; a single word is unchanged. */
export function toCamelEventName(name: string): string {
  return name
    .split('-')
    .map((part, i) => (i === 0 ? part : part.charAt(0).toUpperCase() + part.slice(1)))
    .join('')
}

/**
 * Whether `event`, dispatched where it was, will arrive at `host` on its own.
 *
 * At the host itself: yes. From inside the host's shadow tree: only if it is
 * composed (`input`, `click`, `focus` are; `change` is not). From a light-DOM
 * descendant: only if it bubbles (`focus` / `blur` do not). From anywhere else
 * (a document-level listener's event, say): no.
 */
export function reachesHost(event: Event, host: EventTarget): boolean {
  const target = event.target
  if (!target || !(host instanceof Node)) return false
  if (target === host) return true
  if (!(target instanceof Node)) return false

  const shadow = (host as Element).shadowRoot
  if (shadow && shadow.contains(target)) return event.composed
  if (host.contains(target)) return event.bubbles
  return false
}

/**
 * Attach the mono payload to a native event as its `detail`, keeping the
 * browser's own value (a click count, an input's `detail` of 0) as `nativeDetail`.
 */
export function decorateEvent<T>(event: Event, detail: T): void {
  const own = Object.getOwnPropertyDescriptor(event, 'detail')
  if (!own && !('nativeDetail' in event)) {
    Object.defineProperty(event, 'nativeDetail', {
      value: (event as CustomEvent).detail,
      configurable: true,
      enumerable: false,
    })
  }
  Object.defineProperty(event, 'detail', { value: detail, configurable: true, enumerable: true })
}

/**
 * Dispatch a mono component event: the plain name (`change`), plus the
 * `mno-change` / `mnoChange` aliases. Bubbling + composed, so every form crosses
 * the shadow boundary. See the header for the plain name's decorate /
 * synthesize rule.
 *
 *   dispatchMonoEvent(this, 'change', detail)                          // change + mno-change + mnoChange
 *   dispatchMonoEvent(this, 'click', detail, { sourceEvent: event })   // decorates the native click; mno-click + mnoClick
 *   dispatchMonoEvent(this, 'click', detail, { alias: 'toggle' })      // toggle + mno-click + mnoClick
 *   dispatchMonoEvent(this, 'loading-change', detail)                  // loading-change + loadingChange + mno-loading-change + mnoLoadingChange
 */
export function dispatchMonoEvent<T>(
  target: EventTarget,
  name: string,
  detail: T,
  options: MonoEventOptions = {},
): void {
  const init: CustomEventInit<T> = { detail, bubbles: true, composed: true }

  // 1. The prefixed pair — unchanged from the day the components were written.
  const camel = toCamelEventName(`mno-${name}`)
  target.dispatchEvent(new CustomEvent(`mno-${name}`, init))
  target.dispatchEvent(new CustomEvent(camel, init))

  // 2. The plain name.
  const alias = options.alias === false ? null : (options.alias ?? name)
  if (!alias) return

  const fromDetail = (detail as { sourceEvent?: unknown } | null)?.sourceEvent
  const source =
    options.sourceEvent !== undefined
      ? options.sourceEvent
      : fromDetail instanceof Event
        ? fromDetail
        : null

  if (source && source.type === alias && reachesHost(source, target)) {
    decorateEvent(source, detail)
    return
  }

  if (MONO_DEVICE_EVENTS.has(alias)) return

  const plainInit: CustomEventInit<T> = {
    detail,
    bubbles: !MONO_NON_BUBBLING_ALIASES.has(alias),
    composed: true,
  }
  target.dispatchEvent(new CustomEvent(alias, plainInit))
  const plainCamel = toCamelEventName(alias)
  if (plainCamel !== alias) target.dispatchEvent(new CustomEvent(plainCamel, plainInit))
}
