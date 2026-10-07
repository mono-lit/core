/** A subscriber callback. */
export type MonoNotifyFn = () => void;
export interface MonoNotifier {
    /** Register a subscriber; returns its unsubscribe handle. */
    subscribe(cb: MonoNotifyFn): () => void;
    /** Schedule a coalesced notification. */
    notify(): void;
    /** Drop every subscriber (controller `dispose`). */
    clear(): void;
    /** How many subscribers are attached — handy for tests / diagnostics. */
    readonly size: number;
}
export interface MonoNotifierOptions {
    /**
     * Runs immediately before the subscribers, inside the same flush. Use it to
     * recompute derived state that subscribers are about to read (e.g. the grid
     * refreshes its merged element props and writes its `state` snapshot here).
     */
    onFlush?: () => void;
    /** Names the controller in the runaway-loop error (`'form'`, `'grid'` …). */
    name?: string;
    /** Extra context for that error — e.g. the form keys that notified last. Called only on a trip. */
    detail?: () => string;
}
/**
 * Flushes allowed back-to-back without the event loop getting a turn. Real work never comes close:
 * notifies in one tick coalesce into ONE flush, and a chain of awaited watchers adds a handful. A
 * count in the hundreds is a feedback loop — a subscriber (a Vue `watch` on the `state` ref, a
 * `subscribe` callback) writing back into the controller on every flush — and as microtasks it
 * starves rendering, input and timers: the tab freezes with no error at all.
 */
export declare const MONO_NOTIFY_RUNAWAY_LIMIT = 200;
/**
 * The coalesced notifier every mono controller uses.
 *
 * Notifications are queued on a microtask and de-duplicated, so several state
 * changes in one tick produce a single callback. That coalescing is not a
 * nicety: a synchronous subscriber that re-renders the consumer's Vue tree would
 * reenter an in-flight patch and corrupt the DOM. When `queueMicrotask` is
 * unavailable (older SSR runtimes) it degrades to a synchronous flush.
 *
 * This was copy-pasted into `monoDataGrid`, `monoDataDropdown`, `monoForm` and
 * `monoChart` — identical logic and, in two of them, identical comments. One
 * implementation means one place to fix if the scheduling ever needs to change.
 */
export declare function createNotifier(options?: MonoNotifierOptions): MonoNotifier;
