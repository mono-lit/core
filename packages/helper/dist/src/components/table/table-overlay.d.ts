/**
 * The element an overlay covers: the `<table>` first, the scroll wrapper only as
 * a fallback.
 *
 * The order is the whole point. An absolutely positioned descendant of a SCROLL
 * CONTAINER scrolls with the content, so covering the wrapper pins the overlay to
 * the scroll origin at only the scrollport's size — scroll a wide or long table
 * and the overlay slides away, leaving live rows showing through beside it. The
 * table's box IS the content, so covering that keeps every column and row under
 * the overlay at any scroll offset.
 */
export declare function overlayHost(el: Element): HTMLElement | null;
/**
 * The element whose height is reserved while an overlay is up — NEVER the
 * `<table>`.
 *
 * A `<table>` does not treat a height as "reserve this much space": CSS table
 * layout DISTRIBUTES any surplus over the rows. Freeze a table at the height it
 * had when it was full, then let the source clear its rows, and the surplus lands
 * on the only row left — the header — which stretches into a band hundreds of
 * pixels tall with its captions floating in the middle of it. That is the
 * opposite of the collapse this guard exists to prevent.
 *
 * A block box just reserves the space, so the hold goes on the scroll wrapper, or
 * failing that on the table's own parent. If the table has no block ancestor to
 * hold the space the hold is SKIPPED — a grid that briefly goes short is a
 * smaller problem than a deformed one.
 */
export declare function overlaySizeHost(el: Element): HTMLElement | null;
/**
 * Widest header row, counting `colspan` — the span a generated overlay cell
 * needs.
 *
 * Generated and spacer rows are excluded by `data-mono-stripe-skip` rather than
 * by class name: this has to skip the row the OTHER overlay may have built as
 * well as its own, and both already carry that attribute for the zebra count.
 */
export declare function columnCount(table: HTMLTableElement): number;
/**
 * The `<tr>` an overlay lives in, and whether the element built it.
 *
 * `generated` decides what disconnect may do: a row the element created is its
 * own to remove; a row the consumer wrote is theirs, and taking it out from under
 * a framework that still holds a reference to it is how hydration breaks.
 */
export interface RowHost {
    row: HTMLTableRowElement;
    generated: boolean;
}
/**
 * Give an overlay a spec-valid home inside the table, and make that home carry
 * what the styling keys on.
 *
 * `<table>`'s content model permits only `caption` / `colgroup` / `thead` /
 * `tbody` / `tfoot`, and a row section permits only `<tr>` — so a bare custom
 * element in either is invalid HTML. Vue's compiler warns about it on every
 * consumer build, and the HTML PARSER foster-parents it out of the table: a
 * server-rendered `<mono-shadow-table-error>` written straight into `<tbody>`
 * has left the table before hydration starts, at which point it is not a row and
 * covers nothing.
 *
 * So the form the docs teach is the valid one — `<tr><td colspan>` written by the
 * consumer — and this function has two jobs:
 *
 * 1. **Adopt** a hand-written cell. A row the consumer wrote lacks the three
 *    things the generated one has: the `rowClass` (which is the ONLY thing the
 *    padding/border reset in `table.css` keys on — without it a docs-style
 *    `td { padding }` puts a 14px gutter around the bar), `data-mono-stripe-skip`
 *    (zebra parity), and a `colspan` that `syncRowSpan` keeps in step with the
 *    columns. Asking a consumer to remember all three is a trap, so the element
 *    stamps them on the row it finds itself in. The class is ADDED, never
 *    replaced — a framework does not patch an attribute it did not bind, so what
 *    is written here survives their re-renders, and what they wrote survives us.
 *
 * 2. **Generate** a row when the element is dropped bare into a table or a row
 *    section anyway — the client-only fallback that makes an imperative
 *    `body.appendChild(el)` keep working. Not the taught form, for the reasons
 *    above.
 *
 * A `<caption>` host is left alone: it is valid HTML and its CSS is honoured as
 * written. Anything else (`undefined`) is not a table position at all.
 */
export declare function ensureRowHost(el: HTMLElement, rowClass: string): RowHost | undefined;
/**
 * Drop a GENERATED row on disconnect. An empty `<tr>` left behind would still
 * draw a border and occupy a slot in the zebra parity count.
 *
 * An adopted row is never touched: it is the consumer's node, still referenced by
 * whatever rendered it, and removing it is exactly the "disrupt future
 * functionality" the Vue warning threatens.
 */
export declare function releaseRowHost(el: HTMLElement, host: RowHost | undefined): void;
/**
 * Re-widen the row's cell after a column change — generated or adopted.
 *
 * `ensureRowHost` sets `colspan` once on a generated cell, from the header as it
 * stood on connect; a hand-written cell has whatever the consumer typed, which
 * may be nothing. A grid whose columns are driven by data — a `v-for` over a
 * props snapshot, a column toggled off — changes that count later, and a stale
 * span leaves the row short of the table or overflowing it.
 * `mono-table-detail-core` recomputes for the same reason.
 *
 * Only writes when the number actually moved, so this is safe to call from every
 * `updated()` — and a consumer's correct `colspan` is never rewritten.
 */
export declare function syncRowSpan(el: HTMLElement, host: RowHost | undefined): void;
export interface OverlayHostOptions {
    /**
     * The custom property the measured sticky-header height is published on, so the
     * overlay's content can sit BELOW a frozen header rather than under it.
     */
    headVar: string;
    /**
     * This overlay's own reservation slot on the size host — must start with
     * `--mono-table-hold-`. See {@link HOLD_PREFIX} for why each overlay needs one
     * of its own rather than sharing `min-height`.
     */
    holdVar: string;
    /**
     * How much room to reserve on the size host while the overlay is up.
     *
     * `'measure'` freezes whatever height it currently has — right for an overlay
     * that appears over a grid which is ABOUT to lose its rows. A length string
     * sets that height outright, which is what an overlay shown over an already
     * empty grid needs: there is nothing left to measure but a header.
     *
     * A FUNCTION is called after `headVar` has been published, for a caller whose
     * answer depends on it. Passing the string it would have returned instead reads
     * the header offset from the PREVIOUS pass — zero on the first one — which is
     * a whole header's worth of room short.
     */
    hold: 'measure' | string | (() => string);
    /**
     * When to measure the header into `headVar`.
     *
     * `'sticky'` publishes it only for a frozen header, and `0` otherwise — right
     * for a small glyph that may sit over rows quite happily, and only has to clear
     * a header that refuses to scroll away.
     *
     * `'always'` publishes it whatever the header does. An overlay whose content is
     * a block of text has to clear the header at rest as well as while scrolling:
     * with `0` it starts at the table's top and the first line lands ON the header
     * row. Costs a slightly generous offset once a non-sticky header has scrolled
     * away, which is invisible; the alternative is text over the column names.
     */
    measureHead?: 'sticky' | 'always';
}
/**
 * Give back everything an overlay reserved, from the hosts it remembers.
 *
 * Safe to call on an element that never applied anything, and safe to call after
 * it has been removed from the DOM — which is the point.
 */
export declare function releaseOverlayHost(el: HTMLElement): void;
/**
 * Make the host a positioning context, publish the header offset, reserve the
 * space and stretch the overlay — or undo all four.
 *
 * **The order is load-bearing, and each step feeds the next.** The header offset
 * goes first because a configured hold may be a function of it. The hold goes
 * next because the stretch measures the scroll region the hold has just resized —
 * do it the other way round and the overlay is stretched to the height the table
 * had before any room was made, which on an empty grid is a header-high strip.
 */
export declare function applyOverlayHost(el: HTMLElement, on: boolean, opts: OverlayHostOptions): void;
