// Shared plumbing for the three controller-driven table elements —
// `mono-table-loading` and `mono-table-empty`, which paint OVER the grid, and
// `mono-table-error`, which is a row IN it (and only needs the row-host half).
//
// None of them is really about its own markup: a spinner and a message are the
// easy half. The hard half is getting a custom element to sit legally inside a
// `<table>`, cover the right box, and have somewhere to paint when the grid it
// covers has no rows left — and that half is identical for all of them. It lived
// in `mono-table-loading-core` first; it is here so the others cannot drift from
// it, for the same reason `composables/field-icons` exists.
//
// Every function is a no-op without a DOM, so callers only need the `isServer`
// guards they already have around their own lifecycle work.

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
export function overlayHost(el: Element): HTMLElement | null {
  return (el.closest('table') ?? el.closest('.mono-table-scroll, [mono-table-scroll]')) as HTMLElement | null
}

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
export function overlaySizeHost(el: Element): HTMLElement | null {
  const scroll = el.closest('.mono-table-scroll, [mono-table-scroll]') as HTMLElement | null
  if (scroll) return scroll

  const table = el.closest('table')
  if (!table) return overlayHost(el)

  const parent = table.parentElement
  return parent && parent.tagName !== 'TABLE' ? parent : null
}

/**
 * Widest header row, counting `colspan` — the span a generated overlay cell
 * needs.
 *
 * Generated and spacer rows are excluded by `data-mono-stripe-skip` rather than
 * by class name: this has to skip the row the OTHER overlay may have built as
 * well as its own, and both already carry that attribute for the zebra count.
 */
export function columnCount(table: HTMLTableElement): number {
  const widest = Array.from(table.querySelectorAll<HTMLTableRowElement>('thead tr')).reduce(
    (max, tr) => {
      const span = (Array.from(tr.children) as HTMLTableCellElement[]).reduce(
        (sum, c) => sum + (c.colSpan || 1),
        0,
      )
      return Math.max(max, span)
    },
    0,
  )

  if (widest) return widest

  // No header, or it has not rendered yet — fall back to the first real body row.
  const first = table.querySelector<HTMLTableRowElement>('tbody tr:not([data-mono-stripe-skip])')
  return first ? Array.from(first.children).length : 0
}

/**
 * The `<tr>` an overlay lives in, and whether the element built it.
 *
 * `generated` decides what disconnect may do: a row the element created is its
 * own to remove; a row the consumer wrote is theirs, and taking it out from under
 * a framework that still holds a reference to it is how hydration breaks.
 */
export interface RowHost {
  row: HTMLTableRowElement
  generated: boolean
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
export function ensureRowHost(el: HTMLElement, rowClass: string): RowHost | undefined {
  // The legacy class stays as an inert hook until 2.0; the ATTRIBUTE is what the
  // sheet styles, so both go on together wherever the row is marked.
  const rowAttr = rowClass.replace(/^mono-table-/, 'mono-')
  const parent = el.parentElement
  if (!parent) return undefined

  const tag = parent.tagName

  if (tag === 'TD' || tag === 'TH') {
    const row = parent.parentElement
    if (!row || row.tagName !== 'TR') return undefined
    row.classList.add(rowClass)
    row.setAttribute(rowAttr, '')
    row.setAttribute('data-mono-stripe-skip', '')
    return { row: row as HTMLTableRowElement, generated: false }
  }

  if (tag !== 'TABLE' && tag !== 'TBODY' && tag !== 'THEAD' && tag !== 'TFOOT') return undefined

  const table = el.closest('table')

  const row = document.createElement('tr')
  row.className = rowClass
  row.setAttribute(rowAttr, '')
  // Not a data row: keep it out of the zebra parity count, as spacer rows are.
  row.setAttribute('data-mono-stripe-skip', '')

  const cell = document.createElement('td')
  const span = table ? columnCount(table) : 0
  if (span > 0) cell.colSpan = span

  // A `<tr>` cannot be a child of `<table>` itself, so that case needs a section.
  const section =
    tag === 'TABLE'
      ? (table?.querySelector('tbody') ?? table?.appendChild(document.createElement('tbody')))
      : parent

  cell.appendChild(el)
  row.appendChild(cell)
  section?.insertBefore(row, section.firstChild)

  return { row, generated: true }
}

/**
 * Drop a GENERATED row on disconnect. An empty `<tr>` left behind would still
 * draw a border and occupy a slot in the zebra parity count.
 *
 * An adopted row is never touched: it is the consumer's node, still referenced by
 * whatever rendered it, and removing it is exactly the "disrupt future
 * functionality" the Vue warning threatens.
 */
export function releaseRowHost(el: HTMLElement, host: RowHost | undefined): void {
  if (host?.generated && !host.row.contains(el)) host.row.remove()
}

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
export function syncRowSpan(el: HTMLElement, host: RowHost | undefined): void {
  if (!host) return
  const table = el.closest('table')
  if (!table) return

  // The element's own cell — for an adopted row that need not be the first one.
  const cell = (el.closest('td, th') ?? host.row.firstElementChild) as HTMLTableCellElement | null
  if (!cell) return

  const span = columnCount(table)
  if (span > 0 && cell.colSpan !== span) cell.colSpan = span
}

/**
 * Prefix for the per-overlay height reservations parked on the size host.
 *
 * Every overlay reserves room by writing ITS OWN variable here, and the host's
 * `min-height` is then the `max()` of whatever variables are present. A single
 * shared inline `min-height` cannot work once two overlays are in the same table
 * — which is the arrangement the docs teach, a spinner and an empty state in one
 * `<caption>`: the spinner's hide would clear the reservation the empty state had
 * just made, the scroll wrapper would collapse to a header, and the message would
 * be clipped out of existence by the wrapper's own `overflow`. Nothing about the
 * DOM would look wrong; the grid would simply be blank.
 */
const HOLD_PREFIX = '--mono-table-hold-'

/** `max()` over every reservation currently parked on `el`, or `''` if none. */
function holdExpression(el: HTMLElement): string {
  const names: string[] = []
  for (let i = 0; i < el.style.length; i++) {
    const name = el.style.item(i)
    if (name.startsWith(HOLD_PREFIX)) names.push(name)
  }
  if (!names.length) return ''
  const terms = names.map((n) => `var(${n}, 0px)`)
  return terms.length === 1 ? terms[0] : `max(${terms.join(', ')})`
}

export interface OverlayHostOptions {
  /**
   * The custom property the measured sticky-header height is published on, so the
   * overlay's content can sit BELOW a frozen header rather than under it.
   */
  headVar: string
  /**
   * This overlay's own reservation slot on the size host — must start with
   * `--mono-table-hold-`. See {@link HOLD_PREFIX} for why each overlay needs one
   * of its own rather than sharing `min-height`.
   */
  holdVar: string
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
  hold: 'measure' | string | (() => string)
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
  measureHead?: 'sticky' | 'always'
}

/** What an overlay last wrote, and where — so it can be undone after removal. */
interface AppliedOverlay {
  host: HTMLElement
  sizeHost: HTMLElement | null
  headVar: string
  holdVar: string
}

/**
 * The hosts an overlay is currently holding.
 *
 * Remembered rather than re-derived, because the one moment they are most needed
 * is the one moment they cannot be found: `disconnectedCallback` runs AFTER the
 * element leaves the tree, so `closest('table')` returns null and an overlay
 * cleaning up on its way out would silently clean up nothing — leaving a
 * permanent reservation on the consumer's own scroll wrapper, i.e. a gap under
 * their header that nothing on the page explains.
 */
const applied = new WeakMap<HTMLElement, AppliedOverlay>()

/**
 * Give back everything an overlay reserved, from the hosts it remembers.
 *
 * Safe to call on an element that never applied anything, and safe to call after
 * it has been removed from the DOM — which is the point.
 */
export function releaseOverlayHost(el: HTMLElement): void {
  const last = applied.get(el)
  if (!last) return

  if (last.sizeHost) {
    last.sizeHost.style.removeProperty(last.holdVar)
    last.sizeHost.style.minHeight = holdExpression(last.sizeHost)
  }
  el.style.minHeight = ''
  last.host.style.removeProperty(last.headVar)
  applied.delete(el)
}

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
export function applyOverlayHost(el: HTMLElement, on: boolean, opts: OverlayHostOptions): void {
  const host = overlayHost(el)
  if (!host) return

  const sizeHost = overlaySizeHost(el)

  if (!on) {
    // Drop only OUR reservation — `releaseOverlayHost` re-derives the host's
    // `min-height` from whatever other overlays still have one. Clearing it
    // outright is what let a spinner's hide take an empty state's room with it.
    releaseOverlayHost(el)
    return
  }

  // 1. Positioning context for the absolute overlay (idempotent — never reset).
  if (getComputedStyle(host).position === 'static') host.style.position = 'relative'

  // Remember where we are writing, so this can be undone from
  // `disconnectedCallback`, by which time none of it is reachable any more.
  applied.set(el, { host, sizeHost, headVar: opts.headVar, holdVar: opts.holdVar })

  // 2. The header offset, so content can sit BELOW a header rather than on it.
  //    Measured, not assumed: a header runs one row on a list and two banded rows
  //    on a detail, and a caption that wraps at a narrow width changes it again.
  //    The sticky flag may sit on the table OR on its scroll wrapper (table.css
  //    honours both, in both spellings), so look up from the table, not at it.
  const wantsHead =
    opts.measureHead === 'always' || !!host.closest('[mono-sticky-head], .mono-table-sticky-head')
  const head = wantsHead
    ? (host.querySelector(':scope > thead') as HTMLElement | null)?.offsetHeight ?? 0
    : 0
  host.style.setProperty(opts.headVar, `${head}px`)

  // 3. Hold the space, on a BLOCK box (see `overlaySizeHost`) — a table would hand
  //    the surplus to its rows instead of reserving it.
  //
  //    A MEASURED hold is written once and then left alone: re-measuring would
  //    read the height it just froze, or worse the collapsed one it exists to
  //    prevent. A CONFIGURED hold has neither problem — it does not depend on the
  //    height it sets — so it is rewritten every pass, which is what lets a caller
  //    refine it once its content is laid out.
  if (sizeHost) {
    if (opts.hold === 'measure') {
      if (!sizeHost.style.getPropertyValue(opts.holdVar)) {
        sizeHost.style.setProperty(opts.holdVar, `${sizeHost.offsetHeight}px`)
      }
    } else {
      sizeHost.style.setProperty(
        opts.holdVar,
        typeof opts.hold === 'function' ? opts.hold() : opts.hold,
      )
    }
    sizeHost.style.minHeight = holdExpression(sizeHost)
  }

  // 4. Cover the whole reserved REGION, not just the table.
  //
  //    The overlay is sized by the table, and a table with no rows is a header and
  //    nothing else — so without this it is a strip across the top: a spinner's dim
  //    would leave bare white under it, and an empty state's message, which is
  //    `sticky`, would be clamped back inside that strip and printed on the header.
  //
  //    Gated on the SIZE HOST, not on a `.mono-table-scroll`. Requiring the scroll
  //    wrapper meant a table without one was never stretched at all — and the
  //    commonest table without one is the whole point of
  //    `<mono-dropdown-table>`, whose panel takes the consumer's table directly.
  //    There the message was clamped onto the column names every time.
  //
  //    Sized from the same expression as the host, NOT from a measured
  //    `clientHeight`: a measurement taken now goes stale the moment another
  //    overlay releases its own reservation and the host shrinks under it, leaving
  //    this one overflowing a scroll wrapper that clips it. Stretching is free
  //    either way — the overlay is out of flow, so this changes what is covered
  //    and nothing about the layout.
  if (sizeHost && sizeHost !== host) el.style.minHeight = holdExpression(sizeHost)
}
