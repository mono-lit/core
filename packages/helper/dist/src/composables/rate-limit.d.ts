import { ComplexAttributeConverter } from 'lit';
/** `p-throttle` options we expose. Mirrors the upstream option names. */
export interface ThrottleConfig {
    /** Maximum number of calls within `interval`. Default 1. */
    limit?: number;
    /** Timespan for `limit`, in ms. Default 1000. */
    interval?: number;
    /** Throttle each call individually instead of using a window. Default false. */
    strict?: boolean;
}
/** `p-debounce` options we expose. Mirrors the upstream option names. */
export interface DebounceConfig {
    /** Milliseconds to wait after the last call. Default 300. */
    wait?: number;
    /** Run on the leading edge instead of the trailing edge. Default false. */
    before?: boolean;
}
/**
 * What a rate-limit prop accepts: the config object, a bare number shorthand, a
 * numeric/JSON string (the attribute form), or a falsy value meaning "off".
 */
export type RateLimitOption<C> = C | number | string | boolean | null | undefined;
export type ResolvedThrottleConfig = Required<ThrottleConfig>;
export type ResolvedDebounceConfig = Required<DebounceConfig>;
/**
 * Normalize a `throttle` prop. A bare number is the *interval*
 * (`throttle="1000"` → at most one call per second), which is the reading
 * people expect from `throttle={1000}` elsewhere. Returns `null` when
 * throttling is off.
 */
export declare function normalizeThrottle(value: RateLimitOption<ThrottleConfig>): ResolvedThrottleConfig | null;
/**
 * Normalize a `debounce` prop. A bare number is the *wait*
 * (`debounce="300"` → 300ms). Returns `null` when debouncing is off.
 */
export declare function normalizeDebounce(value: RateLimitOption<DebounceConfig>): ResolvedDebounceConfig | null;
/**
 * Lit `hasChanged` for a rate-limit prop.
 *
 * **This is load-bearing.** In a template, `:throttle.prop="{ limit: 1 }"`
 * allocates a NEW object on every parent re-render. With Lit's default `!==`
 * check the element would see a change each time, rebuild the wrapper, and
 * restart the timer — so on a frequently re-rendering parent a debounced call
 * could be postponed forever and never fire at all. Comparing by value makes a
 * re-created but equivalent config a no-op.
 */
export declare function rateLimitHasChanged(value: unknown, old: unknown): boolean;
/**
 * Lit attribute converter for a rate-limit prop, so the shorthand attribute
 * forms (`debounce="300"`, `throttle`, `debounce='{"wait":300}'`) work in plain
 * HTML and SSR without a `.prop` binding.
 */
export declare const rateLimitConverter: ComplexAttributeConverter<unknown>;
/**
 * Lifecycle of a call through a limiter. `pending` covers the wait — the
 * debounce timer or the throttle queue — and `running` covers the actual
 * execution. Consumers typically paint a spinner for both but only block
 * interaction for `running`, otherwise the first click locks the control and
 * there is no burst left to collapse.
 */
export type RateLimitPhase = 'pending' | 'running' | 'idle';
export interface RateLimiter {
    /** Put a call through the limiter. Never rejects on cancellation. */
    call(...args: unknown[]): Promise<unknown>;
    /** Drop everything pending. The wrapper is rebuilt on the next `call()`. */
    cancel(): void;
    /** Cancel and release the wrapper (use on disconnect). */
    dispose(): void;
    /** Calls accepted but not yet settled (waiting *or* executing). */
    readonly pending: number;
    /** Calls currently executing `run`. */
    readonly running: number;
    /** Derived phase, for reporting. */
    readonly phase: RateLimitPhase;
    /** Calls waiting in the throttle queue (always 0 for a debouncer). */
    readonly queueSize: number;
}
export interface CreateRateLimiterOptions {
    kind: 'throttle' | 'debounce';
    config: ResolvedThrottleConfig | ResolvedDebounceConfig;
    /** The work to rate-limit. Its promise defines the `running` phase. */
    run: (...args: unknown[]) => unknown | Promise<unknown>;
    /** Called whenever `pending` / `running` change, so the host can re-render. */
    onChange?: () => void;
}
/**
 * Build a limiter around `run`.
 *
 * The wrapper is created lazily on the first `call()`, so nothing schedules a
 * timer at construction time — important for SSR, where a limiter may be
 * constructed but never called.
 *
 * `pending` counts calls that are still *waiting* — not merely unsettled. The
 * distinction matters because a debounced burst collapses N calls into one
 * execution and the losers only settle after it finishes: counting them as
 * waiting would make the limiter report a phantom `pending` tail once the work
 * was already done. So waiting is cleared when an execution starts (all of it
 * for a debounce, one call for a throttle, whose queue really does keep
 * waiting), and force-cleared whenever no call is outstanding at all — an
 * invariant that also covers leading-edge debounces, where a trailing call
 * settles without ever reaching `run`.
 *
 * Cancellation goes through an `AbortController`: both libraries take a
 * `signal` and reject their pending promises when it fires. A signal is
 * one-shot, so `cancel()` also drops the wrapper and the next `call()` rebuilds
 * it with a fresh controller.
 */
export declare function createRateLimiter(options: CreateRateLimiterOptions): RateLimiter;
