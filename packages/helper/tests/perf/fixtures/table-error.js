// `<mono-table-error>` — the red bar under the header when a request fails.
//
// The interesting half is the controller, not the markup. Before this, a failed
// table request left NO state at all: `loadError` was wired in three places and
// every one discarded the error argument, the server-group paths turned a failure
// into `metas = []`, and the select-all drain had no catch whatsoever. A grid
// could fail and look like a perfectly ordinary empty table — with
// `<mono-table-empty>` reporting "No Data found", which is a lie about what
// happened.
//
// So most of what is guarded here is capture and clearing: that every operation
// reports, that a devextreme "superseded load" rejection does NOT, that awaiting
// callers still get their rejection, and that one failure produces one bar
// (hooking `loadError` as well as the catch would double-report, since devextreme
// fires the event synchronously inside the same rejection).

import '@mono-lit/helper/ui/table'
import { controlMonoTable, setErrorMessages } from '@mono-lit/helper'

window.__setErrorMessages = setErrorMessages

const ROWS = Array.from({ length: 4 }, (_, i) => ({ Id: i + 1, Name: `Row ${i + 1}` }))

/**
 * A DataSource-like stub that can be told to fail, and with what.
 *
 * `failWith` takes the raw value to reject with — an `Error`, a string, an
 * HTTP-ish object — because the message the bar shows has to come from the error
 * itself. The header-filter panel (`mono-table-th-core.ts`) is the cautionary
 * example: it catches, throws the error away and hardcodes one sentence.
 */
function makeSource(rows = ROWS, { keepItems = false } = {}) {
  let failure = null
  let loading = false
  const listeners = new Map()
  const emit = (name, ...args) => {
    for (const fn of listeners.get(name) ?? []) fn(...args)
  }

  const source = {
    load: () => {
      loading = true
      emit('loadingChanged')
      return new Promise((resolve, reject) => {
        setTimeout(() => {
          loading = false
          emit('loadingChanged')
          if (failure !== null) {
            // devextreme fires `loadError` synchronously inside the rejection,
            // with the SAME value. Reproduced so the "one failure, one bar"
            // assertion is measuring the real shape.
            emit('loadError', failure)
            reject(failure)
            return
          }
          emit('changed')
          resolve(rows)
        }, 4)
      })
    },
    // `keepItems` is the devextreme shape: a rejected load leaves `items()` at the
    // LAST SUCCESSFUL page, so clearing them is the controller's job, not the source's.
    items: () => (failure !== null && !keepItems ? [] : rows),
    totalCount: () => (failure !== null && !keepItems ? 0 : rows.length),
    pageIndex: () => 0,
    pageSize: () => rows.length || 10,
    paginate: () => false,
    filter: () => null,
    sort: () => null,
    searchValue: () => null,
    searchExpr: () => null,
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
    fail: (value) => {
      failure = value
    },
    succeed: () => {
      failure = null
    },
  }
}

const host = document.getElementById('app')

/**
 * Build the table, then INSERT the element into `<tbody>` programmatically.
 *
 * Not `innerHTML`, and the difference is the whole reason `ensureRowHost` exists.
 * `<tbody>`'s content model is `<tr>` and nothing else, so the HTML PARSER
 * foster-parents a custom element written there straight out of the table —
 * before it upgrades, before `connectedCallback` can wrap it in a row. A
 * framework never hits that: Vue and React build the tree with
 * `createElement`/`insertBefore`, which is DOM manipulation and not parsing, and
 * leaves the element where it was put. Writing the fixture with `innerHTML` would
 * be testing the one shape no consumer actually produces.
 *
 * `handwritten` is the OTHER shape — the one the docs now teach. The consumer
 * writes `<tr><td>` themselves (here via `innerHTML`, which is fine: a `<tr>` is
 * valid in `<tbody>` and a custom element is valid in `<td>`, so the parser keeps
 * it) and the element is inserted into that cell. `handwritten` may be `true` or
 * `{ colspan }` to stamp a consumer-authored span on the cell.
 */
function mount(id, { attrs = '', cols = 2, second = false, handwritten = false } = {}) {
  const wrap = document.createElement('div')
  wrap.style.width = '520px'
  const heads = Array.from({ length: cols }, (_, i) => `<th>Col ${i + 1}</th>`).join('')
  const ownRow = handwritten
    ? `<tr id="${id}-row"><td id="${id}-cell"${
        handwritten.colspan ? ` colspan="${handwritten.colspan}"` : ''
      }></td></tr>`
    : ''
  wrap.innerHTML = `
    <div mono-table-scroll id="${id}-scroll">
      <table mono-table  id="${id}-table">
        <thead><tr id="${id}-head">${heads}</tr></thead>
        <tbody id="${id}-body">${ownRow}</tbody>
      </table>
    </div>
  `
  host.appendChild(wrap)

  const body = wrap.querySelector(`#${id}-body`)
  const target = handwritten ? wrap.querySelector(`#${id}-cell`) : body
  const make = (elementId) => {
    const el = document.createElement('mono-table-error')
    el.id = elementId
    for (const pair of attrs.split(/\s+(?=[a-z-]+=)/).filter(Boolean)) {
      const eq = pair.indexOf('=')
      if (eq < 0) continue
      el.setAttribute(pair.slice(0, eq), pair.slice(eq + 1).replace(/^"|"$/g, ''))
    }
    target.appendChild(el)
    return el
  }

  const el = make(id)
  if (second) make(`${id}-b`)
  return el
}

const ARMS = {}

function arm(id, opts = {}) {
  const el = mount(id, opts)
  const stub = makeSource(opts.rows ?? ROWS, { keepItems: !!opts.keepItems })
  const grid = controlMonoTable(null, { keyExpr: 'Id', ...(opts.grid ?? {}) })
  if (opts.bind !== false) {
    el.controlTable = grid
    const b = document.getElementById(`${id}-b`)
    if (b) b.controlTable = grid
    grid.bind(stub.source)
  }
  ARMS[id] = { el, grid, stub, second: document.getElementById(`${id}-b`) }
  return ARMS[id]
}

// ── the arms ──────────────────────────────────────────────────────────────────

arm('basic')
arm('shapes')
// Wording: one grid with its own map, one without (the app-wide layer's subject).
arm('wording')
arm('wording-own', { grid: { errorMessages: { 403: 'This grid says no.' } } })
arm('canceled')
arm('dismiss', { second: true })
arm('manual', { attrs: 'message="Something you wrote"' })
arm('unbound', { bind: false, attrs: 'message="No controller at all"' })
arm('nodismiss', { attrs: 'dismissible=""' })
arm('cols', { cols: 3 })
arm('empty-pair')
arm('drain')
// Generated-row control for the disconnect check in the hand-written arms.
arm('detach')

/**
 * A HOSTILE host stylesheet.
 *
 * Without this arm the placement assertions pass in a vacuum: nothing else on
 * this page styles `td`, so a reset that loses every cascade fight still looks
 * perfect. Real pages are not like that — these very docs ship
 * `.vp-doc table.mono-table td { padding: … }` to undo VitePress's own table
 * styling, and at (0,2,2) it beat the generated row's (0,1,1) reset and wrapped
 * the error bar in a 14px gutter. Reproduced verbatim, specificity and all.
 */
{
  const style = document.createElement('style')
  style.id = 'hostile-sheet'
  // Scoped to `td` only. Bordering `th` as well would widen the table by the
  // header's borders and put a pixel into the measurement that has nothing to do
  // with what is under test.
  style.textContent = `
    .vp-doc table.mono-table td { display: table-cell; border: 1px solid #ccc; padding: 0.65rem 0.9rem; }
  `
  document.head.appendChild(style)

  const el = mount('hostile')
  el.closest('div[style]').classList.add('vp-doc')
  const grid = controlMonoTable(null, { keyExpr: 'Id' })
  const stub = makeSource()
  el.controlTable = grid
  grid.bind(stub.source)
  ARMS.hostile = { el, grid, stub, second: null }
}

/**
 * The HAND-WRITTEN row — the taught form.
 *
 * A bare element in `<tbody>` is invalid HTML: Vue warns on every consumer
 * build, and the HTML parser foster-parents a server-rendered one out of the
 * table before hydration. So the docs teach `<tr><td colspan><mono-table-error>`,
 * and the element must ADOPT that row — it lacks the three things the generated
 * one carries: the row class (the only hook the `padding: 0` reset has), the
 * zebra-skip marker, and a live `colspan`. Before adoption, a hand-written row
 * was "left exactly as written", which under the hostile stylesheet above means
 * the 14px gutter the generated row had already been fixed for.
 *
 * All three arms sit under the same hostile `.vp-doc` stylesheet, because that
 * is where the difference between "adopted" and "left alone" is visible.
 */
for (const [id, opts] of [
  // No colspan at all — the element has to supply one.
  ['handwritten', { handwritten: true }],
  // A stale one — the element has to correct it.
  ['handwritten-stale', { cols: 3, handwritten: { colspan: 1 } }],
  // A correct one — the element must leave it alone (counted, not inferred).
  ['handwritten-right', { cols: 3, handwritten: { colspan: 3 } }],
]) {
  const el = mount(id, opts)
  el.closest('div[style]').classList.add('vp-doc')
  const grid = controlMonoTable(null, { keyExpr: 'Id' })
  const stub = makeSource()
  el.controlTable = grid
  grid.bind(stub.source)
  ARMS[id] = { el, grid, stub, second: null }
}

/**
 * Server-side grouping, whose two catches used to swallow outright: a failed
 * group list became `metas = []` and a failed group page became "keep whatever
 * was shown". Both are indistinguishable from an honest empty result, which is
 * why they need their own arm — the `load()` promise still RESOLVES on this path,
 * so nothing the other arms do would ever notice.
 */
{
  const el = mount('grouped')
  const grid = controlMonoTable(null, {
    keyExpr: 'Id',
    group: ['Name'],
    serverGroup: {
      loadGroups: () => {
        if (groupFailure) return Promise.reject(groupFailure)
        return Promise.resolve([{ key: 'A', count: 1 }])
      },
      loadRows: () => {
        if (rowFailure) return Promise.reject(rowFailure)
        return Promise.resolve(ROWS.slice(0, 1))
      },
    },
  })
  el.controlTable = grid
  grid.bind(makeSource().source)
  ARMS.grouped = { el, grid, stub: null, second: null }
}

let groupFailure = null
let rowFailure = null

window.__failGroups = async (raw) => {
  const { el, grid } = ARMS.grouped
  groupFailure = raw
  // NOTE: resolves. That is the point — the swallow is preserved, only the
  // silence is not.
  let rejected = false
  await grid.load().catch(() => {
    rejected = true
  })
  await settle(el, 120)
  groupFailure = null
  return { rejected, ...window.__read('grouped') }
}

window.__failGroupRows = async (raw) => {
  const { el, grid } = ARMS.grouped
  rowFailure = raw
  await grid.load().catch(() => {})
  await settle(el, 150)
  rowFailure = null
  return window.__read('grouped')
}

/**
 * The empty-state arm needs an actual `<mono-table-empty>` beside the error one —
 * and, less obviously, a source that SUCCEEDS with zero rows.
 *
 * `<mono-table-empty>` only shows once `hasLoaded` has latched, and that latches
 * in `sync()`, which a failed load never reaches. So if this arm's source simply
 * failed, the empty message would stay hidden for that reason alone and the
 * coupling under test would never be exercised. It has to be genuinely showing
 * first, and then yield.
 */
{
  const caption = document.createElement('caption')
  caption.innerHTML = '<mono-table-empty title="No Data found"></mono-table-empty>'
  const table = document.getElementById('empty-pair-table')
  table.insertBefore(caption, table.firstChild)
  ARMS['empty-pair'].empty = caption.querySelector('mono-table-empty')
  ARMS['empty-pair'].empty.controlTable = ARMS['empty-pair'].grid
  ARMS['empty-pair'].stub = makeSource([])
  ARMS['empty-pair'].grid.bind(ARMS['empty-pair'].stub.source)
}

// `dismissible=""` is an EMPTY attribute, which a boolean prop reads as true —
// switch it off as a property, the way a consumer would with `:dismissible`.
ARMS.nodismiss.el.dismissible = false

/**
 * The PINNED arm: a table wider and taller than its scroll box, with a frozen
 * two-row header — the esw shape (a banded header plus a `mono-table-sticky-right`
 * action column, so the table is that wide by design).
 *
 * The bar is a table-wide row, and that is what went wrong: on this table its
 * text sat at the far left and the ✕ / ↻ past the right edge, invisible until
 * you scrolled for them, and the row itself scrolled away under the pinned
 * header. So the bar is now the SCROLLPORT's width, pinned to its left edge, and
 * under a frozen header its cell is pinned below the `<thead>`.
 */
{
  const wrap = document.createElement('div')
  wrap.style.width = '600px'
  const cols = 8
  const heads = Array.from({ length: cols }, (_, i) => `<th>Col ${i + 1}</th>`).join('')
  const bands = `<th colspan="4">Band A</th><th colspan="4">Band B</th>`
  const rows = Array.from(
    { length: 40 },
    (_, r) =>
      `<tr>${Array.from({ length: cols }, (_, c) => `<td${c === cols - 1 ? ' mono-sticky-right' : ''}>r${r + 1}c${c + 1}</td>`).join('')}</tr>`,
  ).join('')
  wrap.innerHTML = `
    <div mono-table-scroll class="scroll-y" id="pinned-scroll" style="height: 300px">
      <table mono-table mono-sticky-head id="pinned-table" style="min-width: 2000px">
        <thead>
          <tr id="pinned-band">${bands}</tr>
          <tr id="pinned-head">${heads}</tr>
        </thead>
        <tbody id="pinned-body">
          <tr id="pinned-row"><td id="pinned-cell" colspan="${cols}"></td></tr>
          ${rows}
        </tbody>
      </table>
    </div>
  `
  host.appendChild(wrap)
  const el = document.createElement('mono-table-error')
  el.id = 'pinned'
  wrap.querySelector('#pinned-cell').appendChild(el)
  const grid = controlMonoTable(null, { keyExpr: 'Id' })
  const stub = makeSource()
  el.controlTable = grid
  grid.bind(stub.source)
  ARMS.pinned = { el, grid, stub, second: null }
}

// The clear-on-failure arms, over the devextreme-shaped stub (rows survive a
// rejection at the source, so what the grid publishes is the controller's call).
arm('clear', { keepItems: true })
arm('keep', { keepItems: true, attrs: 'behaviour="keep-list"' })
arm('noreload', { keepItems: true })
ARMS.noreload.el.reload = false
arm('drain-rows', { keepItems: true })

const settle = async (el, ms = 80) => {
  await el.updateComplete
  await new Promise((r) => setTimeout(r, ms))
  await el.updateComplete
}

// ── probes ────────────────────────────────────────────────────────────────────

/** What the bar looks like, read from the DOM rather than from a private field. */
window.__read = (id) => {
  const { el, grid } = ARMS[id]
  const bar = el.querySelector('.mono-table-error-bar')
  const close = el.querySelector('.mono-table-error-close')
  const row = el.closest('tr')
  const rect = bar?.getBoundingClientRect()

  const textEl = el.querySelector('.mono-table-error-text')
  const detailEl = el.querySelector('.mono-table-error-detail')

  return {
    shown: !!bar && !!rect && rect.height > 0,
    text: textEl?.textContent.trim() ?? '',
    // The headline alone — the text node(s) before the detail span — and the
    // detail on its own, so a preset + server text can be asserted separately.
    headline: textEl
      ? Array.from(textEl.childNodes)
          .filter((n) => n.nodeType === Node.TEXT_NODE)
          .map((n) => n.textContent)
          .join('')
          .trim()
      : '',
    detail: detailEl?.textContent.trim() ?? '',
    detailTitle: textEl?.getAttribute('title') ?? '',
    bars: el.querySelectorAll('.mono-table-error-bar').length,
    hasClose: !!close,
    closeLabel: close?.getAttribute('aria-label') ?? '',
    // The generated row: real height, spanning the table, out of the zebra count.
    rowClass: row?.className ?? '',
    rowSpan: row?.querySelector('td')?.colSpan ?? 0,
    stripeSkip: !!row?.hasAttribute('data-mono-stripe-skip'),
    // Controller state, so "dismiss hides only this element" is checkable.
    gridError: grid?.error
      ? {
          message: grid.error.message,
          source: grid.error.source,
          status: grid.error.status,
          detail: grid.error.detail,
        }
      : null,
    secondShown: !!ARMS[id].second?.querySelector('.mono-table-error-bar'),
  }
}

/** Run a load that fails with `value`, and report what came of it. */
window.__failWith = async (id, value) => {
  const { el, grid, stub } = ARMS[id]
  stub.fail(value)
  let rejected = false
  let rejectedWith = ''
  await grid.load().catch((err) => {
    rejected = true
    rejectedWith = err instanceof Error ? err.message : String(err)
  })
  await settle(el)
  return { rejected, rejectedWith, ...window.__read(id) }
}

/** …with the message shapes the normalizer has to cope with. */
window.__failShapes = async (id) => {
  const pick = ({ headline, detail, gridError }) => ({
    headline,
    detail,
    status: gridError?.status,
  })
  // devextreme's ODataStore shape: `extend(Error(xhr.statusText), { httpStatus, … })`.
  const dx = (message, extra) => Object.assign(new Error(message), extra)

  const out = {}
  out.error = pick(await window.__failWith(id, new Error('Boom from an Error')))
  out.string = pick(await window.__failWith(id, 'Boom from a string'))
  out.http = pick(await window.__failWith(id, { status: 503 }))
  out.statusText = pick(await window.__failWith(id, { status: 500, statusText: 'Server exploded' }))
  out.axios = pick(await window.__failWith(id, { response: { statusText: 'Bad Gateway' } }))
  out.opaque = pick(await window.__failWith(id, {}))
  // The bug as reported: a 403 over HTTP/2, where `statusText` is '' — the bar
  // read "Error", the Error constructor's name, all the normalizer could find.
  out.forbiddenBlank = pick(await window.__failWith(id, dx('', { httpStatus: 403, requestOptions: {} })))
  out.forbidden = pick(await window.__failWith(id, dx('Forbidden', { httpStatus: 403 })))
  out.unauthorized = pick(await window.__failWith(id, dx('', { httpStatus: 401 })))
  // A body the server wrote — that part is worth showing, the phrase is not.
  out.serverBody = pick(
    await window.__failWith(
      id,
      dx('Internal Server Error', {
        httpStatus: 500,
        errorDetails: { message: 'Object reference not set to an instance of an object' },
      }),
    ),
  )
  out.network = pick(await window.__failWith(id, new TypeError('Failed to fetch')))
  return out
}

/**
 * Wording overrides — per grid and app-wide — and that clearing the app-wide
 * layer restores the defaults for every grid that did not say otherwise.
 */
window.__failWording = async (id, ownId) => {
  const dx = (message, extra) => Object.assign(new Error(message), extra)
  const forbidden = () => dx('', { httpStatus: 403 })
  const out = {}
  out.perGrid = (await window.__failWith(ownId, forbidden())).headline
  window.__setErrorMessages({ 403: 'Anda tidak memiliki akses ke data ini.' })
  out.global = (await window.__failWith(id, forbidden())).headline
  // The per-grid map still wins over the app-wide one.
  out.perGridOverGlobal = (await window.__failWith(ownId, forbidden())).headline
  window.__setErrorMessages(null)
  out.restored = (await window.__failWith(id, forbidden())).headline
  return out
}

/** A devextreme "superseded load" rejection must NOT be an error. */
window.__failCanceled = async (id) => {
  const { el, grid, stub } = ARMS[id]
  const canceled = new Error('canceled')
  canceled.name = 'canceled'
  stub.fail(canceled)
  let rejected = false
  await grid.load().catch(() => {
    rejected = true
  })
  await settle(el)
  return { rejected, ...window.__read(id) }
}

window.__succeed = async (id) => {
  const { el, grid, stub } = ARMS[id]
  stub.succeed()
  await grid.load().catch(() => {})
  await settle(el)
  return window.__read(id)
}

/** Click the ×, then report — including whether the OTHER element still shows. */
window.__dismiss = async (id) => {
  const { el } = ARMS[id]
  let events = 0
  const onEvt = () => events++
  el.addEventListener('mno-close', onEvt)
  el.querySelector('.mono-table-error-close')?.click()
  await settle(el)
  el.removeEventListener('mno-close', onEvt)
  return { events, ...window.__read(id) }
}

window.__setMessage = async (id, message) => {
  const { el } = ARMS[id]
  el.message = message
  await settle(el)
  return window.__read(id)
}

/** Add a column after mount — the generated row's colspan must follow. */
window.__addColumn = async (id) => {
  const { el } = ARMS[id]
  const th = document.createElement('th')
  th.textContent = 'Added'
  document.getElementById(`${id}-head`).appendChild(th)
  await settle(el)
  el.requestUpdate()
  await settle(el)
  return window.__read(id)
}

/**
 * The row structure around the element: how many rows the body holds, whether
 * the element's row is the consumer's own (by id) or one the element built, and
 * what that row carries.
 */
window.__rowHost = (id) => {
  const { el } = ARMS[id]
  const body = document.getElementById(`${id}-body`)
  const row = el.closest('tr')
  const cell = el.closest('td')
  return {
    rows: body ? body.querySelectorAll(':scope > tr').length : -1,
    isConsumerRow: !!row && row.id === `${id}-row`,
    rowClass: row?.className ?? '',
    stripeSkip: !!row?.hasAttribute('data-mono-stripe-skip'),
    colspanAttr: cell?.getAttribute('colspan') ?? null,
    colSpan: cell?.colSpan ?? 0,
  }
}

/**
 * Count `colspan` WRITES on the element's cell across one update cycle. A
 * correct consumer value must not be rewritten — and the value alone cannot show
 * that, since rewriting `3` as `3` leaves the same attribute behind.
 */
window.__colspanWrites = async (id) => {
  const { el } = ARMS[id]
  const cell = el.closest('td')
  let writes = 0
  const mo = new MutationObserver((recs) => {
    writes += recs.filter((r) => r.attributeName === 'colspan').length
  })
  mo.observe(cell, { attributes: true })
  el.requestUpdate()
  await settle(el)
  el.requestUpdate()
  await settle(el)
  mo.disconnect()
  return { writes, colSpan: cell.colSpan }
}

/**
 * Remove the element and report what happened to its row. A generated row must
 * go with it; a consumer's row must stay — it is their node, and pulling it out
 * from under a framework that still holds it is the hydration break the Vue
 * warning is about.
 */
window.__detach = async (id) => {
  const { el } = ARMS[id]
  const body = document.getElementById(`${id}-body`)
  const row = el.closest('tr')
  el.remove()
  await new Promise((r) => setTimeout(r, 30))
  return {
    rowStillInBody: !!row && row.parentElement === body,
    rows: body.querySelectorAll(':scope > tr').length,
  }
}

/**
 * The idle host: with no error the element renders nothing, but its row stays.
 * That row must take no space — a consumer's hand-written `<tr>` is never
 * removed, so a 1px border of its own would push every data row down for as
 * long as the table is healthy. (It did: the `<tr>` carries the base row rule's
 * border-bottom, and only its `> td` was reset.)
 *
 * Measured as a DIFFERENCE — the table's height with the row versus without it —
 * and in two regimes. With the hostile sheet OFF, cells have no borders and the
 * host must cost exactly 0. With it ON, every data cell has a 1px border, and
 * under `border-collapse` a zero-height row still owns two collapsed EDGES: half
 * of each neighbour's border lands in it. That one pixel belongs to the
 * neighbours, not the row, is inherent to the collapse model, and is the same for
 * a generated row; the assertion allows exactly that and nothing more.
 */
window.__idleRow = async (id) => {
  const { el } = ARMS[id]
  await window.__succeed(id)
  const row = el.closest('tr')
  const table = document.getElementById(`${id}-table`)
  const body = document.getElementById(`${id}-body`)
  const sheet = document.getElementById('hostile-sheet')

  // The data rows live in the demo; here the body holds only the host row, so
  // add one to have something to measure against.
  let data = body.querySelector(':scope > tr:not([data-mono-stripe-skip])')
  if (!data) {
    data = document.createElement('tr')
    data.innerHTML = '<td>a</td><td>b</td><td>c</td>'
    body.appendChild(data)
  }

  const measure = () => {
    const withHost = table.getBoundingClientRect().height
    const next = row.nextSibling
    row.remove()
    const without = table.getBoundingClientRect().height
    body.insertBefore(row, next)
    return Math.round((withHost - without) * 100) / 100
  }

  sheet.disabled = true
  const plain = measure()
  sheet.disabled = false
  const bordered = measure()
  return { plain, bordered }
}

/** Is the bar directly under the header, and full width? */
window.__placement = (id) => {
  const { el } = ARMS[id]
  const bar = el.querySelector('.mono-table-error-bar')
  const thead = document.querySelector(`#${id}-table thead`)
  const table = document.getElementById(`${id}-table`)
  if (!bar) return null
  const b = bar.getBoundingClientRect()
  const h = thead.getBoundingClientRect()
  const t = table.getBoundingClientRect()
  // Flush means flush with the table's CONTENT edge: the table paints its own
  // hairline (`--mono-table-outer-border`) outside the cells, and the bar has
  // no business covering it.
  const cs = getComputedStyle(table)
  const bl = parseFloat(cs.borderLeftWidth) || 0
  const br = parseFloat(cs.borderRightWidth) || 0
  const td = el.closest('td')
  return {
    belowHeader: Math.round(b.top - h.bottom),
    height: Math.round(b.height),
    widthShortfall: Math.round(t.width - bl - br - b.width),
    gapLeft: Math.round(b.left - (t.left + bl)),
    gapRight: Math.round(t.right - br - b.right),
    tdPadding: td ? getComputedStyle(td).padding : '',
  }
}

/**
 * Where the bar sits relative to the SCROLLPORT after scrolling the pinned arm
 * to `{ left, top }`. Everything is in viewport coordinates, rounded, so the
 * assertions read as "bar left == scroll left" rather than as pixel arithmetic.
 */
window.__pinned = async (left, top) => {
  const { el } = ARMS.pinned
  const scroll = document.getElementById('pinned-scroll')
  const table = document.getElementById('pinned-table')
  scroll.scrollLeft = left
  scroll.scrollTop = top
  await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)))
  const bar = el.querySelector('.mono-table-error-bar')
  const close = el.querySelector('.mono-table-error-close')
  if (!bar) return null
  const s = scroll.getBoundingClientRect()
  const b = bar.getBoundingClientRect()
  const c = close?.getBoundingClientRect()
  const thead = table.querySelector(':scope > thead').getBoundingClientRect()
  // The `<thead>` box itself is never sticky — only its `th` are — so after a
  // scroll its rect is the FLOW position. The pinned header is where its first
  // cell is.
  const firstTh = table.querySelector(':scope > thead th').getBoundingClientRect()
  const r = (n) => Math.round(n)
  return {
    firstThTop: r(firstTh.top),
    scrollLeft: scroll.scrollLeft,
    scrollTop: scroll.scrollTop,
    // The scrollport's content box: `clientWidth` excludes the vertical scrollbar.
    viewLeft: r(s.left + scroll.clientLeft),
    viewRight: r(s.left + scroll.clientLeft + scroll.clientWidth),
    viewTop: r(s.top + scroll.clientTop),
    barLeft: r(b.left),
    barRight: r(b.right),
    barTop: r(b.top),
    barWidth: r(b.width),
    theadBottom: r(thead.bottom),
    theadHeight: r(thead.height),
    headVar: table.style.getPropertyValue('--mono-table-error-head'),
    closeVisible: !!c && c.left >= s.left && c.right <= s.left + scroll.clientWidth && c.top >= s.top,
    tdPosition: getComputedStyle(el.closest('td')).position,
    barPosition: getComputedStyle(bar).position,
  }
}

/** The close glyph, for the build-parity check. */
window.__closeGlyph = (id) => {
  const { el } = ARMS[id]
  const btn = el.querySelector('.mono-table-error-close')
  const glyph = btn?.firstElementChild
  if (!glyph) return null
  const r = glyph.getBoundingClientRect()
  return {
    tag: glyph.tagName.toLowerCase(),
    cls: typeof glyph.className === 'string' ? glyph.className : '',
    painted: r.width > 0 && r.height > 0,
  }
}

/** Does `<mono-table-empty>` stand down while an error is set? */
window.__emptyBeside = (id) => {
  const empty = ARMS[id].empty
  const cs = empty ? getComputedStyle(empty) : null
  return {
    emptyShown: !!cs && cs.display !== 'none',
    errorShown: window.__read(id).shown,
    hasLoaded: !!ARMS[id].grid.hasLoaded,
  }
}

/**
 * Get the empty state genuinely SHOWING first: a load that succeeds with no rows.
 * Without this the next assertion proves nothing — `hasLoaded` would be false and
 * the empty message hidden for a reason that has nothing to do with the error.
 */
window.__emptyFirst = async (id) => {
  const { el, grid } = ARMS[id]
  await grid.load().catch(() => {})
  await settle(el, 120)
  return window.__emptyBeside(id)
}

/** The stub behind an arm, so a spec can flip it without a dedicated probe. */
window.__stub = (id) => ARMS[id].stub

/** What the grid publishes: the rows, the total, the error mode. */
window.__rows = (id) => {
  const { grid, el } = ARMS[id]
  return {
    items: grid.items.length,
    total: grid.totalCount,
    mode: grid.errorBehaviour(),
    hasReload: !!el.querySelector('.mono-table-error-reload'),
    reloadLabel: el.querySelector('.mono-table-error-reload')?.getAttribute('aria-label') ?? '',
    reloadDisabled: !!el.querySelector('.mono-table-error-reload')?.disabled,
    ...window.__read(id),
  }
}

/** Click ↻ and report what came of it — the bar, the rows, the event. */
window.__reloadClick = async (id) => {
  const { el, grid } = ARMS[id]
  let events = 0
  const onReload = () => {
    events += 1
  }
  el.addEventListener('mno-reload', onReload)
  const btn = el.querySelector('.mono-table-error-reload')
  btn?.click()
  // Read the disabled state while the retry is on the wire, then let it land.
  await new Promise((r) => queueMicrotask(r))
  await el.updateComplete
  const disabledWhileLoading = !!el.querySelector('.mono-table-error-reload')?.disabled
  await new Promise((r) => setTimeout(r, 40))
  await settle(el)
  el.removeEventListener('mno-reload', onReload)
  return { events, disabledWhileLoading, loading: grid.loading, ...window.__rows(id) }
}

/** The ↻ glyph, for the build-parity check. */
window.__reloadGlyph = (id) => {
  const glyph = ARMS[id].el.querySelector('.mono-table-error-reload')?.firstElementChild
  if (!glyph) return null
  const r = glyph.getBoundingClientRect()
  return {
    tag: glyph.tagName.toLowerCase(),
    cls: typeof glyph.className === 'string' ? glyph.className : '',
    painted: r.width > 0 && r.height > 0,
  }
}

/** `check().selectAll()` — the drain that had no catch at all. */
window.__failSelectAll = async (id) => {
  const { el, grid, stub } = ARMS[id]
  await grid.load().catch(() => {})
  await settle(el)
  stub.fail(new Error('Drain refused'))
  let rejected = false
  await grid
    .check()
    .selectAll()
    .catch(() => {
      rejected = true
    })
  await settle(el)
  return { rejected, ...window.__read(id) }
}

window.__ready = true
