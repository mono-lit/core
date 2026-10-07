/**
 * Undoing framework reactivity, structurally.
 *
 * Vue wraps objects handed to a `ref()` / `reactive()` in a **Proxy**, and a proxy
 * is a different object identity from the row it wraps. That matters here because
 * `mono-select` / `mono-tag-input` use the **whole item as the model value** when
 * no `key-value` is given, and identity is what decides "is this option already
 * selected". The round trip is asymmetric:
 *
 * 1. the element emits the RAW item from its `items` array;
 * 2. the consumer assigns it into a `ref`, and Vue wraps it;
 * 3. Vue writes it back through `:model-value.prop` as a PROXY;
 * 4. `proxy === rawItem` is `false`, and every comparison after that misses.
 *
 * Unwrapping both sides before comparing restores the identity the components
 * rely on. Done by duck-typing Vue's own internal flags so this package still
 * never imports Vue — the same trick `unwrapReactive` already used for
 * DataSources, which is why that function now lives here.
 */
/**
 * Unwrap a `ref()` / `computed()` wrapper and a `reactive()` proxy to the raw
 * target underneath. Returns the value unchanged when it isn't reactive.
 */
export declare function unwrapReactive<T = unknown>(value: T): T;
/**
 * An option a controller re-reads at query time: the value itself, a getter, or
 * a `{ value }` box — which is what a Vue `ref()` / `computed()` is, and what a
 * plain `{ value }` a consumer keeps by hand is too.
 *
 * Framework-neutral on purpose. A controller cannot subscribe to a consumer's
 * reactive state without importing their framework, but it does not need to:
 * every query the components run (search, sort, page, header filter, scroll)
 * goes through the controller, and reading the option fresh at that moment is
 * what makes the CURRENT reactive value the one that lands in the request.
 */
export type MaybeReactive<T> = T | (() => T) | {
    value: T;
};
/**
 * Read a {@link MaybeReactive} option: call a getter, unwrap a ref/computed or a
 * reactive proxy, unbox a plain `{ value }`. Never caches — the caller decides
 * when "now" is.
 */
export declare function resolveMaybeReactive<T>(option: MaybeReactive<T> | undefined): T | undefined;
/**
 * {@link unwrapReactive}, then — for an **array** — unwrap each element too.
 *
 * Reading an index off a deep-reactive array yields a proxy of that element, so
 * unwrapping only the container still leaves proxies inside. One level of
 * elements is all the value models here need; this deliberately does not recurse
 * into nested objects, which would rewrite data the consumer owns.
 */
export declare function unwrapReactiveDeep<T = unknown>(value: T): T;
