import { ReactiveController, ReactiveControllerHost } from 'lit';
export interface ChipStripOptions {
    /** The scrolling strip, or `null` when the host is not rendering one. */
    strip: () => HTMLElement | null;
    /**
     * Whether inline behaviour is active. False means the host renders no strip,
     * so the controller stays completely inert — no observer, no queries, no
     * layout reads. This is what keeps `flex` mode free.
     */
    enabled: () => boolean;
}
export declare class ChipStripController implements ReactiveController {
    private readonly host;
    private readonly opts;
    private _canScrollStart;
    private _canScrollEnd;
    private _observer;
    /** The element the observer is attached to, so a re-render can re-target it. */
    private _observed;
    constructor(host: ReactiveControllerHost, opts: ChipStripOptions);
    /** True once the strip is scrolled away from its start — render `‹`. */
    get canScrollStart(): boolean;
    /** True while content remains past the right edge — render `›`. */
    get canScrollEnd(): boolean;
    /** True when either button should show — i.e. the chips overflow the strip. */
    get overflowing(): boolean;
    hostConnected(): void;
    hostDisconnected(): void;
    /**
     * Only re-target the observer — deliberately does NOT measure. Measuring here
     * would force a layout on every render of every host, and its `requestUpdate`
     * would schedule an update from inside `updated()`. `invalidate()` and the
     * ResizeObserver cover the cases that can actually change the answer.
     */
    hostUpdated(): void;
    /**
     * Re-measure because the CONTENT changed — a chip added, removed or relabelled.
     * The host calls this from `updated()` when such state actually changed, which
     * is far rarer than "every update".
     */
    invalidate(): void;
    /**
     * Recompute both flags from the live geometry and re-render only when one
     * actually flipped.
     */
    sync(): void;
    /**
     * Scroll one "page" toward `dir`, aligned to a chip boundary so a chip is
     * never left half-cut at the leading edge.
     *
     * Forward: the first chip whose right edge passes the visible right edge
     * becomes the new leftmost chip. Backward: the chip that would end at the
     * current left edge becomes the new leftmost chip. If no chip qualifies
     * (one chip wider than the strip), fall back to a plain viewport-width step
     * so the button is never a no-op.
     */
    page(dir: -1 | 1): void;
    /** Pin the strip to its end — used after a chip is added, to reveal it. */
    scrollToEnd(): void;
    /**
     * Move the strip and republish from the CLAMPED TARGET rather than by reading
     * `scrollLeft` back.
     *
     * Scrolling is instant (no `scroll-behavior: smooth`), so the read would agree
     * — but not reading avoids a second forced layout, and more importantly the
     * strip's scroll events are expensive well beyond this controller: the shared
     * popup controller listens for `scroll` on `window` in the CAPTURE phase, so
     * every scroll event the strip emits repositions any open dropdown, forcing a
     * layout and a `getComputedStyle` ancestor walk. One event per click is the
     * budget; a smooth animation's ~30 was what made the page crawl.
     */
    private _scrollTo;
    /**
     * Store the flags and re-render only on a real change.
     *
     * The request is deferred a microtask: `invalidate()` / `scrollToEnd()` are
     * called from the host's `updated()` (a chip landed, a preset value arrived),
     * and a synchronous `requestUpdate()` there is Lit's change-in-update warning
     * on every such edge. The flags are already stored, so the deferred render
     * reads the same answer — it just doesn't get scheduled from inside the
     * render that asked for it.
     */
    private _publish;
    /**
     * Observe the strip so the buttons re-evaluate when the FIELD is resized —
     * a window resize changes `clientWidth` without any render or scroll event.
     *
     * Only the strip is observed, not the chips: a chip add/remove always comes
     * with a host render, and the host calls `invalidate()` for those.
     */
    private _attach;
    private _teardown;
}
