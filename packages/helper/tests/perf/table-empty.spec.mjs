// `<mono-table-empty>` — the controller-driven empty state.
//
// The interesting half is *when* it shows, not what it shows. `items: []` with
// `loading: false` is the controller's INITIAL state as well as "loaded, and
// there is genuinely nothing", so the `!rows.length && !loading` condition every
// demo hand-rolled announces "No data" on a table that has not been asked for any
// yet. `MonoTableController.hasLoaded` is what separates the two, and the
// never-loaded arm is the reason it exists — remove the flag and that one
// assertion is the only thing that fails.
//
// Two of these guard things a DOM-shape assertion cannot see:
//   · the button is reachable — the overlay is `pointer-events: none` on purpose,
//     so a blanket rule leaves a button that renders perfectly and cannot be
//     pressed;
//   · the message has room — an empty grid is a header over nothing, and without
//     the reserved height the overlay is a ~40px strip with the text clipped out
//     of it.
// Both were caught by a screenshot on the previous two features. They are
// assertions now.

export async function run({ port, page, reporter }) {
  await page.goto(`http://127.0.0.1:${port}/?fixture=table-empty`, { waitUntil: 'load' })
  await page.waitForFunction(() => window.__ready === true, null, { timeout: 60000 })

  // ── 1. when it shows ───────────────────────────────────────────────────────

  // The trap. A bound-but-never-loaded controller looks exactly like an empty
  // one, and this is the arm that says the difference is honoured.
  const fresh = await page.evaluate(() => window.__read('fresh'))
  reporter.check(
    'a bound controller that has never loaded shows NOTHING',
    fresh && !fresh.shown && !fresh.hasLoaded,
    `shown=${fresh?.shown}, hasLoaded=${fresh?.hasLoaded} ` +
      '(items:[] + loading:false is also the initial state — "not asked yet", not "nothing")',
  )

  const empty = await page.evaluate(() => window.__load('empty'))
  reporter.check(
    'once it HAS loaded and came back with no rows, the message appears',
    empty && empty.shown && empty.hasLoaded && empty.rows === 0,
    `shown=${empty?.shown}, hasLoaded=${empty?.hasLoaded}, rows=${empty?.rows}`,
  )

  const filled = await page.evaluate(() => window.__load('filled'))
  reporter.check(
    'a grid that loaded rows shows nothing',
    filled && !filled.shown && filled.rows > 0,
    `shown=${filled?.shown} over ${filled?.rows} row(s)`,
  )

  const busy = await page.evaluate(() => window.__loadHeld('busy'))
  reporter.check(
    'it stays away while the FIRST query runs',
    busy && !busy.during.shown,
    `shown=${busy?.during.shown} mid-load (hasLoaded=${busy?.during.hasLoaded})`,
  )
  reporter.check(
    '…then appears when that query lands empty',
    busy && busy.after.shown,
    `shown=${busy?.after.shown} after the load resolved`,
  )

  // The case where the `loading` check is the ONLY thing doing any work. During a
  // first load `hasLoaded` is still false and hides the message by itself, so a
  // mid-first-load reading passes with the loading guard deleted. Re-querying an
  // already-empty grid is the real shape of this: the user hits reload, and the
  // message has to yield to the spinner rather than sit under it.
  const requery = await page.evaluate(() => window.__requeryHeld('requery'))
  reporter.check(
    'an already-empty grid HIDES the message again while it re-queries',
    requery && requery.before.shown && !requery.during.shown && requery.after.shown,
    `before=${requery?.before.shown}, during=${requery?.during.shown}, after=${requery?.after.shown} ` +
      '(that moment belongs to mono-table-loading)',
  )

  // The manual path the docs promise: no controller, so the consumer's own
  // `v-if` decides. An element that hid itself here would simply never be seen.
  const unbound = await page.evaluate(() => window.__read('unbound'))
  reporter.check(
    'with NO controller bound it shows unconditionally, so v-if / v-show works',
    unbound && unbound.shown,
    `shown=${unbound?.shown} (nothing to auto-detect — the consumer is driving)`,
  )

  // Binding a different source must forget the first one's history.
  const rebound = await page.evaluate(() => window.__rebind('empty'))
  reporter.check(
    'rebinding a new source hides it again until THAT source has loaded',
    rebound && !rebound.afterBind.shown && rebound.afterLoad.shown,
    `afterBind=${rebound?.afterBind.shown}, afterLoad=${rebound?.afterLoad.shown}`,
  )

  // ── 2. what it shows ───────────────────────────────────────────────────────

  const parts = await page.evaluate(() => window.__read('empty'))
  reporter.check(
    'the parts render in order: icon, title, subtitle, reload',
    parts && parts.order.join(',') === 'icon,title,subtitle,reload',
    `order = [${parts?.order.join(', ')}]`,
  )
  reporter.check(
    '…carrying the props they were given',
    parts &&
      parts.title === 'No people found' &&
      parts.subtitle === 'Try a different search.',
    `title=${JSON.stringify(parts?.title)}, subtitle=${JSON.stringify(parts?.subtitle)}`,
  )

  // With no props at all the element still says something useful. This is the
  // whole point of the defaults: `<mono-table-empty :control-table.prop="t" />`
  // is a complete, sensible empty state.
  const defaults = await page.evaluate(() => window.__load('defaults'))
  reporter.check(
    'with no props at all it renders the default icon, title and subtitle',
    defaults &&
      defaults.order.join(',') === 'icon,title,subtitle,reload' &&
      defaults.title === 'No Data found' &&
      defaults.subtitle.length > 0 &&
      defaults.icon?.cls.includes('i-mdi-help-circle-outline'),
    `order=[${defaults?.order.join(', ')}], title=${JSON.stringify(defaults?.title)}, ` +
      `subtitle=${JSON.stringify(defaults?.subtitle)}, icon=${JSON.stringify(defaults?.icon?.cls)}`,
  )

  // …and the defaults must still be escapable. `''` is the only way to drop a part
  // once it has a default, so if that does not work they are not defaults, they
  // are mandatory.
  const bare = await page.evaluate(() => window.__read('unbound'))
  reporter.check(
    'an explicitly empty prop drops that part — and no reload without a controller',
    bare && bare.order.join(',') === 'title' && !bare.hasReload,
    `order = [${bare?.order.join(', ')}] with icon="" and subtitle="" ` +
      `(hasReload=${bare?.hasReload} — a reload button with nothing to reload is worse than none)`,
  )

  // `icon` is one prop with two shapes, and each has to land somewhere different:
  // an iconify class paints as a mask on an EMPTY span, an emoji is text in the
  // node. Either rendered as the other is a blank box, so one "renders something"
  // assertion would pass for both — hence two arms.
  reporter.check(
    'an iconify icon goes on the class, with no text in the node',
    parts?.icon && parts.icon.cls.includes('i-mdi-database-off') && parts.icon.text === '',
    `class=${JSON.stringify(parts?.icon?.cls)}, text=${JSON.stringify(parts?.icon?.text)}`,
  )

  const emoji = await page.evaluate(() => window.__load('emoji'))
  reporter.check(
    '…and an emoji goes in the node, never onto the class',
    emoji?.icon && emoji.icon.text === '\u{1F4ED}' && !/\bi-[a-z]/.test(emoji.icon.cls),
    `text=${JSON.stringify(emoji?.icon?.text)}, class=${JSON.stringify(emoji?.icon?.cls)}`,
  )

  // The body slot REPLACES the props. A consumer who filled it has said what the
  // box holds; a leftover title above their markup would be a bug they could not
  // turn off without also clearing a prop they never set.
  const body = await page.evaluate(() => window.__load('body'))
  reporter.check(
    'slot="body" replaces icon / title / subtitle entirely',
    body && body.order.join(',') === 'body' && body.title === '' && body.subtitle === '',
    `order = [${body?.order.join(', ')}], title=${JSON.stringify(body?.title)} ` +
      '(the prop nodes must be GONE, not merely hidden)',
  )
  reporter.check(
    '…and the consumer’s own markup is what renders',
    body && body.bodyText === 'Custom body',
    `body text = ${JSON.stringify(body?.bodyText)}`,
  )

  // ── 3. the reload button ───────────────────────────────────────────────────

  const noreload = await page.evaluate(() => window.__load('noreload'))
  reporter.check(
    ':reload="false" drops the button',
    noreload && noreload.shown && !noreload.hasReload,
    `shown=${noreload?.shown}, hasReload=${noreload?.hasReload}`,
  )

  const hit = await page.evaluate(() => window.__hitTest('empty'))
  reporter.check(
    'the reload button is actually clickable through the overlay',
    hit && hit.hasButton && hit.hitsButton,
    `elementFromPoint at the button’s centre = <${hit?.hitTag} class="${hit?.hitClass}"> ` +
      '(the overlay is pointer-events:none by design; the box has to take it back)',
  )

  const through = await page.evaluate(() => window.__hitOutsideBox('empty'))
  reporter.check(
    '…while the rest of the overlay stays click-through',
    through && !through.isOverlay,
    `elementFromPoint outside the box = <${through?.tag}> ` +
      '(the message is not a modal — the header and rows beneath must still answer)',
  )

  await page.evaluate(() => window.__load('reload'))
  const clicked = await page.evaluate(() => window.__clickReload('reload'))
  reporter.check(
    'clicking it reloads the controller exactly once and emits mno-reload',
    clicked && clicked.calls === 1 && clicked.events === 1,
    `reload() calls=${clicked?.calls}, mno-reload events=${clicked?.events}`,
  )
  reporter.check(
    '…and the message goes away when that reload finds rows',
    clicked && !clicked.shown && clicked.rows > 0,
    `shown=${clicked?.shown} over ${clicked?.rows} row(s)`,
  )

  // ── 4. it has somewhere to paint ───────────────────────────────────────────

  // An empty grid is a header over nothing, so `inset: 0` on the table is a ~40px
  // strip. Without the reserved height the message is clipped out of existence —
  // and every assertion above would still pass, because the nodes are all there.
  const room = await page.evaluate(() => {
    const read = window.__read('busy')
    return { ...read, head: window.__headerHeight('busy'), scroll: window.__scrollHeight('busy') }
  })
  reporter.check(
    'the message reserves room below the header instead of being clipped to a strip',
    room && room.height > room.head * 2 && room.height >= 150,
    `overlay=${room?.height}px vs header=${room?.head}px (want well clear of the header, >=150px)`,
  )
  reporter.check(
    '…by holding the SCROLL WRAPPER open, never the table',
    room && room.scroll >= 150,
    `scroll wrapper=${room?.scroll}px ` +
      '(a height on the <table> is distributed over its rows and stretches the header instead)',
  )

  // The arrangement the docs teach — a spinner AND an empty state in one caption.
  // Both reserve room on the same scroll wrapper, and the spinner RELEASES its
  // room at exactly the moment the message needs its own: when the query that
  // came back empty finishes. A single shared inline `min-height` meant the
  // release took the message's reservation with it, the wrapper collapsed to a
  // header, and the wrapper's own `overflow` clipped the message away — with the
  // element still reporting itself as shown, so nothing else here noticed.
  const paired = await page.evaluate(() => window.__pairedRun('paired'))
  reporter.check(
    'paired with a loading overlay, it yields while the query runs',
    paired && !paired.midLoad.shown,
    `shown=${paired?.midLoad.shown} mid-load`,
  )
  reporter.check(
    '…and is still VISIBLE after the spinner releases its own height hold',
    paired && paired.after.shown && paired.after.fullyVisible,
    `shown=${paired?.after.shown}, ${paired?.after.visibleHeight}px of a ` +
      `${paired?.after.boxHeight}px message visible inside a ${paired?.after.scrollHeight}px ` +
      'scroll wrapper (0 = clipped away, which no DOM assertion can see)',
  )

  // The same pairing, but where the spinner's hold is BIGGER than the message's:
  // a full grid, then a search that matches nothing. The spinner freezes the tall
  // height it found and releases it 350ms later, so anything the message sized
  // from a measurement taken in that window is left overhanging a region that has
  // since shrunk — a scrollbar on a grid with nothing to scroll.
  const shrink = await page.evaluate(() => window.__shrinkRun('shrink'))
  reporter.check(
    'after a full grid is searched down to nothing, the message is visible',
    shrink && shrink.shown && shrink.fullyVisible,
    `shown=${shrink?.shown}, ${shrink?.visibleHeight}/${shrink?.boxHeight}px visible ` +
      `(region went ${shrink?.tall}px → ${shrink?.scrollHeight}px)`,
  )
  reporter.check(
    '…and leaves nothing overhanging the region it shrank into',
    shrink && shrink.overflow <= 1,
    `${shrink?.overflow}px of scrollable overflow on a table that is just a header ` +
      '(a stale height measured while the spinner was still holding the tall one)',
  )

  // ── 5. sizing ──────────────────────────────────────────────────────────────

  const fixed = await page.evaluate(async () => {
    await window.__load('fixed')
    return window.__visibleInScroll('fixed')
  })
  reporter.check(
    'height="18rem" reserves exactly that',
    fixed && Math.abs(fixed.scrollHeight - 288) <= 2,
    `scroll wrapper=${fixed?.scrollHeight}px, want 288 (18rem)`,
  )

  const floored = await page.evaluate(async () => {
    await window.__load('floored')
    return window.__visibleInScroll('floored')
  })
  reporter.check(
    'min-height="20rem" raises the floor above the default 12rem',
    floored && floored.scrollHeight >= 318,
    `scroll wrapper=${floored?.scrollHeight}px, want >= 320 (20rem)`,
  )

  // The cap has to beat the floor, or it cannot do the job it exists for: a screen
  // too short for the default is exactly when someone reaches for it.
  const capped = await page.evaluate(async () => {
    await window.__load('capped')
    return window.__visibleInScroll('capped')
  })
  reporter.check(
    'max-height="8rem" caps it BELOW the 12rem default floor',
    capped && Math.abs(capped.scrollHeight - 128) <= 2,
    `scroll wrapper=${capped?.scrollHeight}px, want 128 (8rem) — a cap that loses to the ` +
      'floor is a cap that never applies',
  )

  // Unmounting has to give the room back. The scroll wrapper belongs to the
  // consumer and outlives the element, so a reservation left on it is a gap under
  // their header with nothing on the page left to explain it — and a `v-if` that
  // swaps one of these for another does it on every toggle.
  const gone = await page.evaluate(async () => {
    await window.__load('gone')
    return window.__unmount('gone')
  })
  reporter.check(
    'removing the element gives the reserved room back',
    gone && gone.after < gone.before && !gone.hold && !gone.minHeight,
    `wrapper ${gone?.before}px → ${gone?.after}px, leftover hold=${JSON.stringify(gone?.hold)}, ` +
      `min-height=${JSON.stringify(gone?.minHeight)}`,
  )

  // Two ways the message ends up written across the column names, neither of
  // which any DOM-shape assertion sees. A screenshot found both.
  // `plain` is the arm with NO `.mono-table-scroll` wrapper, which is what
  // `<mono-dropdown-table>` hands its table. Two separate things went wrong there
  // and both put the message on the column names: the overlay was never stretched
  // (its stretch was gated on a scroll wrapper that does not exist), and the
  // resting offset came from `sticky`, which does nothing without a scrollport to
  // stick within.
  await page.evaluate(() => window.__load('plain'))
  for (const id of ['empty', 'body', 'plain']) {
    const place = await page.evaluate((i) => window.__placement(i), id)
    reporter.check(
      `the message clears the header rather than starting on it (${id})`,
      place && place.clearsHeader,
      `box starts ${place?.belowHeader}px below the header’s bottom edge ` +
        '(negative = printed over the column names — the offset is only measured for a ' +
        'STICKY header unless asked for always)',
    )
    reporter.check(
      `…and is not clamped back up into it by its own sticky (${id})`,
      place && !place.clamped && place.fits,
      `top: wanted ${place?.wantedTop}px, painted at ${place?.actualTop}px, fits=${place?.fits} ` +
        '(a sticky box cannot leave its containing block, so too little reserved height ' +
        'drags it back onto the header)',
    )
  }
}
