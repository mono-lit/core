// The mono `customElement` decorator — Lit's, plus the app-wide defaults of
// `createMonoUI` (see ./mono-ui.ts) and the universal `pending` skeleton prop
// (see ./mono-skeleton.ts).
//
// It registers a thin SUBCLASS of the decorated class whose constructor applies
// the configured defaults AFTER the whole original constructor has run: after
// the core mixin's defaults and the element class's own field initializers,
// and before any attribute the parser or a framework applies (those arrive only
// once construction is over, so an explicit value still wins).
//
// Lit's `addInitializer` cannot do this — its initializers run at the START of
// the base constructor, before any mixin sets its defaults, which would then
// overwrite the global ones.
//
// The same subclass carries `pending`: the property is registered on it with
// Lit's `createProperty` BEFORE `customElements.define` reads `observedAttributes`,
// and `withMonoPending` gives it the resolve / wrap / sync lifecycle. One place,
// every element — light and shadow — without a shared base class.
//
// The decorator returns the subclass, which (legacy `experimentalDecorators`)
// replaces the class binding: `export class MonoButton` IS the registered class,
// so `instanceof`, statics and Lit's finalization behave exactly as before. It
// keeps Lit's export name so element files only change their import path — and
// so `scripts/gen-vue-types.mjs`, which scans `@customElement('…')`, is unaffected.
import type { LitElement } from 'lit'
import { applyMonoUIDefaults } from './mono-ui'
import { registerPendingProperty, watchSkeletonActivation } from './mono-skeleton'
import { withMonoPending } from './mono-pending'

type ElementClass = CustomElementConstructor

/** Wrap `cls` so each instance gets the `createMonoUI` defaults at the end of construction, and `pending`. */
function withMonoUI<T extends ElementClass>(tag: string, cls: T): T {
  const Base = withMonoPending(cls as unknown as new (...args: any[]) => LitElement, tag)
  const Mono = class extends Base {
    constructor(...args: any[]) {
      super(...args)
      applyMonoUIDefaults(this as unknown as HTMLElement, tag)
    }
  }
  Object.defineProperty(Mono, 'name', { value: cls.name })
  registerPendingProperty(Mono)
  watchSkeletonActivation()
  return Mono as unknown as T
}

/** Register `cls` as `tag` with the app-wide defaults applied. Returns the registered class. */
export function defineMonoElement<T extends ElementClass>(tag: string, cls: T): T {
  const existing = customElements.get(tag)
  if (existing) return existing as T
  const Mono = withMonoUI(tag, cls)
  customElements.define(tag, Mono)
  return Mono
}

/**
 * Drop-in for Lit's `@customElement(tag)`: registers the class (wrapped so
 * `createMonoUI` defaults apply and `pending` exists) and replaces the class binding with it.
 */
export function customElement(tag: string) {
  return <T extends ElementClass>(cls: T): T => {
    const Mono = withMonoUI(tag, cls)
    customElements.define(tag, Mono)
    return Mono
  }
}
