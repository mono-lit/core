// `<mono-table-empty>` — the message shown over a grid that came back with nothing.
//
// The claim is not "it renders a title" (easy) but *when* it renders one. The
// controller's INITIAL state is `items: [], loading: false`, which is
// indistinguishable from "loaded, and there is genuinely nothing" — so the naive
// `!rows.length && !loading` that every demo hand-rolled announces "No data" on a
// table that has not been asked for any yet. `hasLoaded` is the distinction, and
// the never-loaded arm below is the assertion that it exists.
//
// Also guarded: the two shapes of `icon` (an iconify class must land on `class`,
// an emoji must land in the node — either one rendered as the other is a blank
// box), that `slot="body"` REPLACES the props rather than joining them, and the
// two things a screenshot would otherwise have to catch — that the message has
// room to paint over an empty grid, and that its button is reachable through an
// overlay whose whole job is to be click-through.

import '@mono-lit/helper/ui/table'
import { controlMonoTable } from '@mono-lit/helper'

const ROWS = Array.from({ length: 6 }, (_, i) => ({
  Id: i + 1,
  Name: `Row ${i + 1}`,
}))

/**
 * A DataSource-like stub whose row set is switchable, and whose `load()` only
 * resolves when told to — so "loading" is an observable state and not a
 * microtask nobody can catch.
 */
function makeSource(initial = []) {
  let rows = initial
  let loading = false
  let release
  const listeners = new Map()
  const emit = (name) => {
    for (const fn of listeners.get(name) ?? []) fn()
  }

  const source = {
    load: () => {
      loading = true
      emit('loadingChanged')
      return new Promise((resolve) => {
        const finish = () => {
          loading = false
          emit('loadingChanged')
          emit('changed')
          resolve(rows)
        }
        // `hold()` parks the load so the spec can look at the grid mid-flight.
        if (release === 'hold') release = finish
        else finish()
      })
    },
    items: () => rows,
    totalCount: () => rows.length,
    pageIndex: () => 0,
    pageSize: () => rows.length || 10,
    paginate: () => false,
    filter: () => null,
    sort: () => null,
    on: (name, fn) => {
      if (!listeners.has(name)) listeners.set(name, new Set())
      listeners.get(name).add(fn)
    },
    off: (name, fn) => listeners.get(name)?.delete(fn),
    isLoaded: () => true,
    isLoading: () => loading,
  }

  return {
    source,
    setRows: (next) => {
      rows = next
    },
    hold: () => {
      release = 'hold'
    },
    finish: () => {
      const fn = release
      release = undefined
      if (typeof fn === 'function') fn()
    },
  }
}

const host = document.getElementById('app')

/**
 * One table per arm. The markup is exactly what the docs teach: the element in
 * the `<caption>`, inside a `.mono-table-scroll` wrapper.
 */
function mount(id, { attrs = '', body = '', withLoading = false, scroll = true } = {}) {
  const wrap = document.createElement('div')
  wrap.style.width = '520px'
  wrap.innerHTML = `
    <div class="${scroll ? 'mono-table-scroll' : 'example-plain-host'}" id="${id}-scroll">
      <table mono-table id="${id}-table">
        <caption>${
          withLoading ? `<mono-table-loading id="${id}-loading"></mono-table-loading>` : ''
        }<mono-table-empty id="${id}" ${attrs}>${body}</mono-table-empty></caption>
        <thead><tr><th>Id</th><th>Name</th></tr></thead>
        <tbody id="${id}-body"></tbody>
      </table>
    </div>
  `
  host.appendChild(wrap)
  return document.getElementById(id)
}

/** Paint the controller's rows into the `<tbody>`, the way a consumer's v-for would. */
function renderRows(id, grid) {
  const tbody = document.getElementById(`${id}-body`)
  const keep = [...tbody.children].filter((n) => n.hasAttribute('data-mono-stripe-skip'))
  tbody.replaceChildren(...keep)
  for (const row of grid.items) {
    const tr = document.createElement('tr')
    tr.innerHTML = `<td>${row.Id}</td><td>${row.Name}</td>`
    tbody.appendChild(tr)
  }
}

const ARMS = {}

function arm(id, opts = {}) {
  const el = mount(id, opts)
  const stub = makeSource(opts.rows ?? [])
  const grid = controlMonoTable(null, { keyExpr: 'Id' })
  grid.subscribe(() => renderRows(id, grid))
  if (opts.bind !== false) {
    el.controlTable = grid
    document.getElementById(`${id}-loading`)?.setAttribute('id', `${id}-loading`)
    const loadingEl = document.getElementById(`${id}-loading`)
    if (loadingEl) loadingEl.controlTable = grid
    grid.bind(stub.source)
  }
  opts.configure?.(el)
  ARMS[id] = { el, grid, stub }
  return ARMS[id]
}

// ── the arms ──────────────────────────────────────────────────────────────────

// Bound, and never loaded. The trap: `items: []` + `loading: false` here means
// "not asked yet", and the message must stay away.
arm('fresh', { attrs: 'title="No people found"' })

// Bound, loaded, and genuinely empty.
arm('empty', {
  attrs: 'icon="i-mdi-database-off" title="No people found" subtitle="Try a different search."',
})

// Bound and loaded WITH rows.
arm('filled', { rows: ROWS, attrs: 'title="No people found"' })

// A held load, so the loading state can be observed rather than raced.
arm('busy', { attrs: 'title="No people found"' })

// No controller at all — the `v-if` / `v-show` path. Also the arm that turns
// parts OFF: with defaults in place, `''` is the only way to drop one, and it has
// to actually work or the defaults become unavoidable.
arm('unbound', {
  bind: false,
  attrs: 'icon="" title="Nothing here" subtitle=""',
})

// No props at all — every default has to appear on its own.
arm('defaults', {})

// An emoji icon, which must NOT be treated as a utility class.
arm('emoji', { attrs: 'icon="\u{1F4ED}" title="Empty"' })

// `slot="body"` — must REPLACE the props, not join them.
arm('body', {
  attrs: 'icon="i-mdi-database-off" title="Prop title" subtitle="Prop subtitle"',
  body: '<div slot="body" id="body-custom">Custom body</div>',
})

// The reload button, switched off. As a PROPERTY: `reload` is a boolean prop, so
// `reload="false"` in markup would set it TRUE (presence is the signal).
arm('noreload', { attrs: 'title="No data"', configure: (el) => { el.reload = false } })

// Its own arm for the reload click, which is destructive: it fills the grid, so
// sharing an arm would leave whatever ran afterwards looking at a full table.
arm('reload', { attrs: 'title="No data"' })

// The pairing the docs actually teach: BOTH overlays in one caption, sharing a
// scroll wrapper. They both reserve room on it, and the loading one releases that
// room when its query ends — which is the moment the empty one needs it most.
arm('paired', {
  withLoading: true,
  attrs: 'icon="i-mdi-database-off" title="No people found" subtitle="Try a different search."',
})

// The real sequence from the docs demo, and the only one where the spinner's own
// hold is BIGGER than the message's: a grid full of rows, then a search that
// matches nothing. The spinner freezes the tall height it found; the message
// reserves its own, smaller one; and when the spinner releases, the region
// shrinks underneath an overlay that was sized while it was still tall.
arm('shrink', { withLoading: true, rows: ROWS, attrs: 'title="No matches"' })

// The three size props.
arm('fixed', { attrs: 'title="Fixed" height="18rem"' })
arm('capped', { attrs: 'title="Capped" max-height="8rem"' })
arm('floored', { attrs: 'title="Floored" min-height="20rem"' })

// Its own arm for the unmount check, which is destructive.
arm('gone', { attrs: 'title="No data"' })

// A table with NO `.mono-table-scroll` wrapper — which is what
// `<mono-dropdown-table>` gives it: the consumer's whole table goes straight into
// the panel's body region. The overlay has no scroll region to size itself from
// there, and an overlay with no height is a header-high box that its own `sticky`
// message cannot fit inside, so the message is clamped back onto the column names.
arm('plain', {
  scroll: false,
  attrs: 'icon="🔍" title="No matches" subtitle="Nothing here fits that search."',
})

// An arm for the RE-load case, which is the only one where the `loading` check
// does any work: during a FIRST load `hasLoaded` is still false and already hides
// the message, so a mid-first-load reading proves nothing.
arm('requery', { attrs: 'title="No data"' })

// ── probes ────────────────────────────────────────────────────────────────────

const settle = async (el, ms = 60) => {
  await el.updateComplete
  await new Promise((r) => setTimeout(r, ms))
  await el.updateComplete
}

/**
 * What the element IS, read from the painted DOM rather than from a private
 * field: a flag that is right while the box the user looks at is wrong would be
 * no use to anyone.
 */
window.__read = (id) => {
  const { el } = ARMS[id]
  const box = el.querySelector('.mono-table-empty-box')
  const cs = getComputedStyle(el)
  const rect = el.getBoundingClientRect()
  const iconEl = el.querySelector('.mono-table-empty-icon')

  // Order is part of the contract: icon, title, subtitle, button.
  const order = [...(box?.children ?? [])]
    .map((n) => {
      if (n.classList.contains('mono-table-empty-icon')) return 'icon'
      if (n.classList.contains('mono-table-empty-title')) return 'title'
      if (n.classList.contains('mono-table-empty-sub')) return 'subtitle'
      if (n.classList.contains('mono-table-empty-reload')) return 'reload'
      if (n.classList.contains('mono-table-empty-body')) return 'body'
      return n.tagName.toLowerCase()
    })
    // The body region always renders (it is the placement target); it only counts
    // as a part when it actually holds something.
    .filter((k) => k !== 'body' || !!el.querySelector('.mono-table-empty-body')?.firstElementChild)

  return {
    attr: el.hasAttribute('data-mono-empty'),
    display: cs.display,
    shown: cs.display !== 'none' && rect.height > 0,
    height: Math.round(rect.height),
    order,
    title: el.querySelector('.mono-table-empty-title')?.textContent.trim() ?? '',
    subtitle: el.querySelector('.mono-table-empty-sub')?.textContent.trim() ?? '',
    hasReload: !!el.querySelector('.mono-table-empty-reload'),
    icon: iconEl
      ? { cls: iconEl.className, text: iconEl.textContent.trim() }
      : null,
    bodyText: el.querySelector('.mono-table-empty-body')?.textContent.trim() ?? '',
    rows: document.querySelectorAll(`#${id}-body tr:not([data-mono-stripe-skip])`).length,
    hasLoaded: !!ARMS[id].grid.hasLoaded,
  }
}

/**
 * The paired arrangement the docs teach — a spinner AND an empty state in one
 * caption — driven the way a real remote source drives it: a load slow enough for
 * the spinner to latch, so its hide actually runs.
 */
window.__pairedRun = async (id) => {
  const { el, grid, stub } = ARMS[id]
  stub.hold()
  const p = grid.load()
  await settle(el, 60)
  const midLoad = { ...window.__read(id), scroll: window.__scrollHeight(id) }
  stub.finish()
  await p
  // Past `mono-table-loading`'s `min-duration` (350ms), so its hide has run and
  // released whatever room IT was holding.
  await settle(el, 700)
  return { midLoad, after: { ...window.__read(id), ...window.__visibleInScroll(id) } }
}

/**
 * Fill the grid, then run a query that empties it — with the second load held so
 * the spinner latches and freezes the TALL height.
 *
 * Reports whether the region ends up with anything to scroll. It should not: the
 * table is a header, the message fits the room reserved for it, and a scrollbar
 * on a grid with nothing under it is the visible symptom of an overlay still
 * sized to a height that has since been released.
 */
window.__shrinkRun = async (id) => {
  const { el, grid, stub } = ARMS[id]
  await grid.load()
  await settle(el, 700)
  const tall = window.__scrollHeight(id)

  stub.setRows([])
  stub.hold()
  const p = grid.load()
  await settle(el, 60)
  stub.finish()
  await p
  // Past `mono-table-loading`'s `min-duration`, so its hold is released.
  await settle(el, 700)

  const scroll = document.getElementById(`${id}-scroll`)
  return {
    tall,
    ...window.__read(id),
    ...window.__visibleInScroll(id),
    overflow: Math.max(0, scroll.scrollHeight - scroll.clientHeight),
  }
}

/**
 * Remove the element and report what it left behind on the consumer's wrapper.
 *
 * `disconnectedCallback` runs AFTER the element leaves the tree, so an overlay
 * that cleans up by re-deriving its hosts finds none and cleans up nothing —
 * leaving a permanent reservation on an element it no longer has anything to do
 * with. A `v-if` swapping one of these for another does it on every toggle.
 */
window.__unmount = (id) => {
  const { el } = ARMS[id]
  const scroll = document.getElementById(`${id}-scroll`)
  const before = Math.round(scroll.getBoundingClientRect().height)
  el.remove()
  return {
    before,
    after: Math.round(scroll.getBoundingClientRect().height),
    minHeight: scroll.style.minHeight,
    hold: scroll.style.getPropertyValue('--mono-table-hold-empty'),
  }
}

/** Load an arm to completion. */
window.__load = async (id) => {
  const { el, grid } = ARMS[id]
  await grid.load()
  await settle(el, 80)
  return window.__read(id)
}

/** Start a load and look at the element while it is still in flight. */
window.__loadHeld = async (id) => {
  const { el, grid, stub } = ARMS[id]
  stub.hold()
  const p = grid.load()
  await settle(el, 60)
  const during = window.__read(id)
  stub.finish()
  await p
  await settle(el, 80)
  return { during, after: window.__read(id) }
}

/**
 * Load once (landing empty, so the message is up), then hold a SECOND load and
 * look at the element while that one is in flight.
 *
 * This is the only shape in which the `loading` check is load-bearing. On a first
 * load `hasLoaded` is still false and hides the message on its own, so a
 * mid-first-load reading would pass with the `loading` guard deleted.
 */
window.__requeryHeld = async (id) => {
  const { el, grid, stub } = ARMS[id]
  await grid.load()
  await settle(el, 80)
  const before = window.__read(id)

  stub.hold()
  const p = grid.load()
  await settle(el, 60)
  const during = window.__read(id)
  stub.finish()
  await p
  await settle(el, 80)
  return { before, during, after: window.__read(id) }
}

/** The header's own height, to prove the message got room BELOW it. */
window.__headerHeight = (id) =>
  Math.round(document.querySelector(`#${id}-table thead`).getBoundingClientRect().height)

/**
 * Where the message sits relative to the header, and whether it fits.
 *
 * Two ways to get this wrong, and both put text on the column names:
 *   · the header offset is only published for a STICKY header, so an ordinary one
 *     leaves the box at the table's top — i.e. behind the header;
 *   · the box is `sticky`, so once it is taller than the room reserved for it the
 *     browser clamps it back up until it overlaps the header anyway.
 * `clearsHeader` catches the first. `clamped` catches the second, by comparing
 * where the box IS against where its own CSS says it should be.
 */
window.__placement = (id) => {
  const { el } = ARMS[id]
  const box = el.querySelector('.mono-table-empty-box')
  const thead = document.querySelector(`#${id}-table thead`)
  if (!box || !thead) return null
  const b = box.getBoundingClientRect()
  const h = thead.getBoundingClientRect()
  const o = el.getBoundingClientRect()
  const wanted = parseFloat(getComputedStyle(box).top) || 0
  return {
    belowHeader: Math.round(b.top - h.bottom),
    clearsHeader: b.top >= h.bottom,
    wantedTop: Math.round(wanted),
    actualTop: Math.round(b.top - o.top),
    clamped: Math.abs(b.top - o.top - wanted) > 1,
    fits: Math.round(b.bottom - o.top) <= Math.round(o.height) + 1,
  }
}

window.__scrollHeight = (id) =>
  Math.round(document.getElementById(`${id}-scroll`).getBoundingClientRect().height)

/**
 * Is the message actually VISIBLE, or merely present?
 *
 * `.mono-table-scroll` is an `overflow: auto` box, so a message that overflows it
 * is clipped away with no trace in the DOM: every shape assertion still passes
 * while the user sees a blank grid. This compares the message's painted box
 * against the scroll wrapper's.
 */
window.__visibleInScroll = (id) => {
  const { el } = ARMS[id]
  const box = el.querySelector('.mono-table-empty-box')
  const scroll = document.getElementById(`${id}-scroll`)
  if (!box) return null
  const b = box.getBoundingClientRect()
  const s = scroll.getBoundingClientRect()
  const visible = Math.max(0, Math.min(b.bottom, s.bottom) - Math.max(b.top, s.top))
  return {
    boxHeight: Math.round(b.height),
    visibleHeight: Math.round(visible),
    fullyVisible: Math.round(visible) >= Math.round(b.height) - 1,
    scrollHeight: Math.round(s.height),
    scrollMinH: scroll.style.minHeight,
  }
}

/**
 * Is the reload button actually reachable?
 *
 * The overlay is `pointer-events: none` on purpose — it must not swallow clicks
 * meant for the header or a row beneath it — and the box takes that back for
 * itself. A blanket `none` would leave a button that renders perfectly and
 * cannot be pressed, which no DOM-shape assertion would notice.
 */
window.__hitTest = (id) => {
  const btn = ARMS[id].el.querySelector('.mono-table-empty-reload')
  if (!btn) return { hasButton: false }
  const r = btn.getBoundingClientRect()
  const hit = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2)
  return {
    hasButton: true,
    hitsButton: hit === btn || btn.contains(hit),
    hitTag: hit?.tagName.toLowerCase() ?? '',
    hitClass: typeof hit?.className === 'string' ? hit.className : '',
  }
}

/** …and the inverse: a point on the overlay but OUTSIDE the box stays click-through. */
window.__hitOutsideBox = (id) => {
  const { el } = ARMS[id]
  const r = el.getBoundingClientRect()
  const hit = document.elementFromPoint(r.left + 8, r.bottom - 8)
  return {
    tag: hit?.tagName.toLowerCase() ?? '',
    isOverlay: hit === el || el.contains(hit),
  }
}

/** Click reload, and report what the controller saw. */
window.__clickReload = async (id) => {
  const { el, grid, stub } = ARMS[id]
  let calls = 0
  const realReload = grid.reload.bind(grid)
  grid.reload = (...args) => {
    calls++
    return realReload(...args)
  }
  let events = 0
  const onEvt = () => events++
  el.addEventListener('mno-reload', onEvt)

  stub.setRows(ROWS)
  el.querySelector('.mono-table-empty-reload')?.click()
  await settle(el, 120)

  el.removeEventListener('mno-reload', onEvt)
  grid.reload = realReload
  return { calls, events, ...window.__read(id) }
}

/** Rebinding a different source must forget the first one's history. */
window.__rebind = async (id) => {
  const { el, grid } = ARMS[id]
  const next = makeSource([])
  grid.bind(next.source)
  await settle(el, 60)
  const afterBind = window.__read(id)
  await grid.load()
  await settle(el, 80)
  return { afterBind, afterLoad: window.__read(id) }
}

window.__ready = true
