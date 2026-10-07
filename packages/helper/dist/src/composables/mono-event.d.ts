/** Options for {@link dispatchMonoEvent}. */
export interface MonoEventOptions {
    /**
     * The native DOM event this mono event was derived from, if any. Defaults to
     * `detail.sourceEvent` when that is an `Event` — which is what every model
     * detail already carries.
     */
    sourceEvent?: Event | null;
    /**
     * The plain (unprefixed) name to emit. Defaults to `name`. Give a different
     * one when the mono name is not what the plain event means — `mno-click` on
     * a modal is an open-state change, so its plain name is `toggle`. `false`
     * emits no plain event at all.
     */
    alias?: string | false;
}
/**
 * Device-originated event names — decorated when native, never synthesized.
 * See the header for why.
 */
export declare const MONO_DEVICE_EVENTS: ReadonlySet<string>;
/**
 * Plain names dispatched WITHOUT bubbling when synthesized: their native
 * namesakes do not bubble either, and something above the element (a form, the
 * window's error reporting, a focus trap) would act on a stray one.
 */
export declare const MONO_NON_BUBBLING_ALIASES: ReadonlySet<string>;
/** `loading-change` → `loadingChange`; a single word is unchanged. */
export declare function toCamelEventName(name: string): string;
/**
 * Whether `event`, dispatched where it was, will arrive at `host` on its own.
 *
 * At the host itself: yes. From inside the host's shadow tree: only if it is
 * composed (`input`, `click`, `focus` are; `change` is not). From a light-DOM
 * descendant: only if it bubbles (`focus` / `blur` do not). From anywhere else
 * (a document-level listener's event, say): no.
 */
export declare function reachesHost(event: Event, host: EventTarget): boolean;
/**
 * Attach the mono payload to a native event as its `detail`, keeping the
 * browser's own value (a click count, an input's `detail` of 0) as `nativeDetail`.
 */
export declare function decorateEvent<T>(event: Event, detail: T): void;
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
export declare function dispatchMonoEvent<T>(target: EventTarget, name: string, detail: T, options?: MonoEventOptions): void;
