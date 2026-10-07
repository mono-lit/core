// `<mono-tag-input>`'s "All" row must reach the SERVER, not just the loaded page.
//
// With a bound DataSource in `load-more` mode the list is a window onto something
// bigger: ticking "All" after one page used to select 10 of 250. Worse, the box
// painted `'all'` the moment that page was ticked, so the NEXT click cleared — the
// rest of the table was unreachable through the control that claims to select it.
//
// The store stub records every `load()`, and the arms below count DRAIN loads —
// the chunked walk `readAllRows` makes — the way `dropdown-select-all.js` does.
//
// The `items` arm is the control: a plain array is static and wholly in memory, so
// it must behave EXACTLY as before — no drain, loaded-scope tri-state, `max`
// still capping.

import '@mono-lit/helper/ui/tag-input'

const ROWS = Array.from({ length: 250 }, (_, i) => ({
  Id: `k${i + 1}`,
  Name: `Row ${i + 1}`,
}))

const PAGE = 10

/**
 * A DataSource-like stub over `ROWS`.
 *
 * `filter` is the live filter the search sets; `readAllRows` composes it into the
 * drain, which is the whole reason "All" means "everything the search matches"
 * rather than "the whole table".
 */
/**
 * Evaluate one of the tiny clause trees this fixture can produce:
 * `[field, op, value]`, or several of those joined by `'or'` / `'and'`.
 *
 * `contains` is the only operator a `searchable` tag-input asks for by default,
 * which is all that is needed here — the point of the stub is the SHAPE of the
 * request, not a filter engine.
 */
function evalClause(row, clause) {
  if (!Array.isArray(clause) || !clause.length) return true

  if (Array.isArray(clause[0])) {
    let acc = evalClause(row, clause[0])
    for (let i = 1; i < clause.length; i += 2) {
      const joiner = clause[i]
      const next = evalClause(row, clause[i + 1])
      acc = joiner === 'or' ? acc || next : acc && next
    }
    return acc
  }

  const [field, op, value] = clause
  const cell = String(row[field] ?? '').toLowerCase()
  const needle = String(value ?? '').toLowerCase()
  if (op === 'contains') return cell.includes(needle)
  if (op === 'startswith') return cell.startsWith(needle)
  return cell === needle
}

/**
 * A DataSource-like stub over `ROWS`, with the two channels a real remote source
 * has and the drain has to reunite:
 *
 *   · `filter()`      — the consumer's own live filter;
 *   · `searchValue()` + `searchExpr()` — what a `searchable` field folds a typed
 *     query into, which is NOT a filter and is invisible to `source.filter()`.
 *
 * `readAllRows` composes both (`andFilters(src.filter(), searchFilterOf(src))`)
 * and hands the result to the STORE, which — like a real one — knows only what it
 * is passed. That split is exactly why the search-scoping assertions are worth
 * having: a drain that read only `filter()` would quietly select the whole table.
 */
function makeSource() {
  const calls = []
  let filter = null
  let searchValue = null
  let searchExpr = null
  let searchOperation = 'contains'

  /** What the source itself considers visible: its filter AND its folded search. */
  const visible = () => {
    const cols = Array.isArray(searchExpr) ? searchExpr : searchExpr ? [searchExpr] : []
    return ROWS.filter((row) => {
      if (filter && !evalClause(row, filter)) return false
      if (!searchValue || !cols.length) return true
      return cols.some((c) => evalClause(row, [c, searchOperation, searchValue]))
    })
  }

  const store = {
    load: (opts) => {
      calls.push(opts ?? {})
      // A store only ever knows the filter it is handed — never the source's.
      const rows = opts?.filter ? ROWS.filter((r) => evalClause(r, opts.filter)) : ROWS
      const skip = opts?.skip ?? 0
      const take = opts?.take ?? rows.length
      // A real chunk costs a round trip. Resolving synchronously would let the
      // whole drain finish inside one microtask queue, so the spinner could never
      // be observed and the mid-flight assertions would be measuring nothing.
      return new Promise((resolve) => {
        setTimeout(
          () => resolve({ data: rows.slice(skip, skip + take), totalCount: rows.length }),
          4,
        )
      })
    },
  }

  const accessor = (get, set) => (...args) => {
    if (args.length) {
      set(args[0])
      return undefined
    }
    return get()
  }

  // `DataSourceController` reads `items()` once and then trusts `changed` to tell
  // it when to look again. A stub that never emits leaves the element showing the
  // FIRST page it ever saw, so a search would look like it had done nothing even
  // though the source itself was correctly filtered.
  const listeners = new Map()
  const emit = (name) => {
    for (const fn of listeners.get(name) ?? []) fn()
  }

  const source = {
    store: () => store,
    load: () => {
      const rows = visible().slice(0, PAGE)
      emit('changed')
      return Promise.resolve(rows)
    },
    items: () => visible().slice(0, PAGE),
    totalCount: () => visible().length,
    pageIndex: () => 0,
    pageSize: () => PAGE,
    paginate: () => true,
    filter: accessor(() => filter, (v) => { filter = v ?? null }),
    searchValue: accessor(() => searchValue, (v) => { searchValue = v ?? null }),
    searchExpr: accessor(() => searchExpr, (v) => { searchExpr = v ?? null }),
    searchOperation: accessor(() => searchOperation, (v) => { searchOperation = v || 'contains' }),
    sort: () => null,
    on: (name, fn) => {
      if (!listeners.has(name)) listeners.set(name, new Set())
      listeners.get(name).add(fn)
    },
    off: (name, fn) => listeners.get(name)?.delete(fn),
    isLoaded: () => true,
    isLoading: () => false,
  }

  return { calls, source }
}

/** Drain loads only — a chunked walk carries `skip`/`take`. */
const drains = (calls) => calls.filter((c) => c.take != null || c.skip != null).length

const host = document.getElementById('app')

function mount(id, configure) {
  const wrap = document.createElement('div')
  wrap.style.width = '420px'
  wrap.innerHTML = `<mono-tag-input id="${id}" checkable searchable select-all></mono-tag-input>`
  host.appendChild(wrap)
  const el = wrap.querySelector('mono-tag-input')
  el.keyValue = 'Id'
  el.displayValue = 'Name'
  el.searchValue = ['Name']
  el.pageSize = PAGE
  configure(el)
  return el
}

const server = makeSource()
const elServer = mount('ti-server', (el) => {
  el.dataSource = server.source
  el.loadMore = 'button'
})

const elArray = mount('ti-array', (el) => {
  el.items = ROWS
  el.loadMore = false
})

const capped = makeSource()
const elCapped = mount('ti-capped', (el) => {
  el.dataSource = capped.source
  el.loadMore = 'button'
  el.max = 5
})

const arrCapped = mount('ti-array-capped', (el) => {
  el.items = ROWS
  el.loadMore = false
  el.max = 5
})

const searched = makeSource()
const elSearched = mount('ti-search', (el) => {
  el.dataSource = searched.source
  el.loadMore = 'button'
})

// A field nothing has been ticked in, kept aside for the one measurement that
// needs it: the spinner's contrast. Every other arm has a selection by the time
// it drains, so the box is ALREADY accent-filled by checkbox.css's own checked /
// indeterminate rule — and a contrast reading there would pass with the loading
// fill deleted. From `none` the box is white and the spinner's stroke defaults to
// white, which is the case worth guarding.
const fresh = makeSource()
const elFresh = mount('ti-fresh', (el) => {
  el.dataSource = fresh.source
  el.loadMore = 'button'
})

// A source that is already at its last page — its whole result fit the first
// page, or the user paged to the end. A drain here would re-fetch rows the
// element is holding; "All" must select the loaded rows with NO request.
const loaded = makeSource()
loaded.source.isLastPage = () => true
const elLoaded = mount('ti-loaded', (el) => {
  el.dataSource = loaded.source
  el.loadMore = 'button'
})

const ELS = {
  server: [elServer, server],
  array: [elArray, null],
  capped: [elCapped, capped],
  'array-capped': [arrCapped, null],
  search: [elSearched, searched],
  fresh: [elFresh, fresh],
  loaded: [elLoaded, loaded],
}

const pick = (name) => ELS[name][0]
const src = (name) => ELS[name][1]

// ── the DOM the assertions read ───────────────────────────────────────────────

/**
 * The open panel, which is NOT inside the element: the shared popup controller
 * portals it to `document.body`. With five fields on this page a bare
 * `document.querySelector` would read whichever panel happens to be first, so
 * every lookup goes through the listbox the field's own input points at.
 */
const listOf = (el) => {
  const id = el.querySelector('.mono-tag-input-native')?.getAttribute('aria-controls')
  return id ? document.getElementById(id) : null
}

const rowsOf = (el) => [
  ...(listOf(el)?.querySelectorAll('.mono-tag-input-item:not(.mono-tag-input-select-all)') ?? []),
]

const rowOf = (el) => listOf(el)?.querySelector('.mono-tag-input-select-all') ?? null

/**
 * The tri-state as PAINTED, not as computed. A private getter could be right while
 * the box the user looks at is wrong, and the box is the thing being changed.
 */
function boxState(el) {
  const box = rowOf(el)?.querySelector('.mono-checkbox')
  if (!box) return 'absent'
  if (box.classList.contains('mono-checkbox-checked')) return 'all'
  if (box.classList.contains('mono-checkbox-indeterminate')) return 'some'
  return 'none'
}

/**
 * Chips, counted from the DOM.
 *
 * This is the assertion that catches the failure mode worth fearing: an
 * unresolvable value renders NO chip in tag-input (`_resolvedValues` filters the
 * strip AND the "+N more" counter), so a drain that forgets to seed the label
 * cache leaves `value` full and the field visibly EMPTY. A `value.length` check
 * alone would sail past that.
 */
function chips(el) {
  const nodes = [...el.querySelectorAll('.mono-tag-input-chip')]
  const text = nodes.map((n) => n.textContent.trim()).filter(Boolean)
  const more = el.querySelector('.mono-tag-input-more')
  const n = more ? Number(String(more.textContent).replace(/\D+/g, '')) : 0
  return {
    rendered: nodes.length,
    hidden: Number.isFinite(n) ? n : 0,
    firstText: text[0] ?? '',
    // A chip whose text is its own key never resolved a label.
    keyShaped: text.filter((t) => /^k\d+$/.test(t)).length,
  }
}

const rgb = (s) => (String(s).match(/[\d.]+/g) ?? []).slice(0, 3).map(Number)

/**
 * How far apart two painted colours are, 0..1.
 *
 * The spinner is stroked with `--mono-checkbox-icon`, which defaults to WHITE,
 * and an unticked box is white too — so "the spinner has a size" and "the spinner
 * is visible" are different claims, and only the second one is the feature. This
 * also catches the subtler version: `.mono-checkbox-box` eases its background
 * over `--theme-duration-slow`, so without `transition: none` the box spends the
 * whole drain part-way to the accent and the contrast never arrives in time.
 */
const contrast = (a, b) => {
  const [r1, g1, b1] = rgb(a)
  const [r2, g2, b2] = rgb(b)
  if ([r1, g1, b1, r2, g2, b2].some((n) => !Number.isFinite(n))) return 0
  return (Math.abs(r1 - r2) + Math.abs(g1 - g2) + Math.abs(b1 - b2)) / (255 * 3)
}

const settle = async (el, ms = 60) => {
  await el.updateComplete
  await new Promise((r) => setTimeout(r, ms))
  await el.updateComplete
}

window.__open = async (name) => {
  const el = pick(name)
  el._open = true
  await settle(el, 150)
  return {
    rows: rowsOf(el).length,
    hasRow: !!rowOf(el),
  }
}

window.__state = (name) => {
  const el = pick(name)
  return {
    box: boxState(el),
    selected: (el.value ?? []).length,
    chips: chips(el),
    hasRow: !!rowOf(el),
    disabled: !!rowOf(el)?.disabled,
  }
}

/** Tick every LOADED row, the way a user filling page one would. */
window.__tickLoadedRows = async (name) => {
  const el = pick(name)
  const rows = rowsOf(el)
  for (const row of rows) row.click()
  await settle(el)
  return { clicked: rows.length, selected: (el.value ?? []).length, box: boxState(el) }
}

/**
 * Click "All" and report what the row looked like MID-FLIGHT.
 *
 * The spinner and the re-entrancy guard are the visible half of the feature, and
 * both only work if `pending` is published BEFORE the first request — a flag
 * flipped after the await is a loading state nobody can observe. So this reads the
 * DOM one render in, while the drain is still running.
 */
window.__clickAll = async (name, { twice = true } = {}) => {
  const el = pick(name)
  const s = src(name)
  if (s) s.calls.length = 0

  const before = { box: boxState(el), selected: (el.value ?? []).length }

  rowOf(el).click()
  await el.updateComplete

  const row = rowOf(el)
  const spinner = row?.querySelector('.mono-checkbox-spinner')
  const r = spinner?.getBoundingClientRect()
  const drainsAtMid = s ? drains(s.calls) : 0
  // A second click while one is in flight must be ignored, not queued. Skipped
  // for the arms that measure a settled result: on a plain array the toggle is
  // synchronous, so a second click just undoes the first.
  if (twice) row?.click()

  const boxEl = row?.querySelector('.mono-checkbox-box')
  const boxCs = boxEl ? getComputedStyle(boxEl) : null
  const spinnerCs = spinner ? getComputedStyle(spinner) : null

  const during = {
    disabled: !!row?.disabled,
    loadingClass: !!row?.classList.contains('is-loading'),
    spinner: !!spinner,
    spinnerPainted: !!r && r.width > 0 && r.height > 0,
    // The box must opt out of its own tick/dash so the spinner is the only glyph.
    suppressesOwnGlyphs: !!boxEl?.classList.contains('has-custom-icon'),
    // Busy, not unavailable: `disabled` dims the row to 0.5 and gives it a blocked
    // cursor, which is the wrong thing to say about work in progress.
    rowOpacity: row ? Number(getComputedStyle(row).opacity) : 0,
    rowCursor: row ? getComputedStyle(row).cursor : '',
    // …and the spinner has to be legible against the box it spins in, NOW —
    // measured mid-drain, so a colour that merely eases in over 300ms fails.
    spinnerContrast:
      boxCs && spinnerCs ? contrast(spinnerCs.stroke, boxCs.backgroundColor) : 0,
    drainsAtMid,
    secondClickDrained: twice && s ? drains(s.calls) > drainsAtMid : false,
  }

  await settle(el, 800)

  return {
    before,
    during,
    after: {
      box: boxState(el),
      selected: (el.value ?? []).length,
      chips: chips(el),
      disabled: !!rowOf(el)?.disabled,
      loadingClass: !!rowOf(el)?.classList.contains('is-loading'),
      spinner: !!rowOf(el)?.querySelector('.mono-checkbox-spinner'),
    },
    drains: s ? drains(s.calls) : 0,
    total: ROWS.length,
  }
}

window.__clearValue = async (name) => {
  const el = pick(name)
  el.modelValue = []
  await settle(el, 60)
  return { selected: (el.value ?? []).length }
}

/**
 * The state a narrowing search puts the box in: a big selection, a small total.
 *
 * Held rows and matched rows are different sets, so comparing their SIZES says
 * nothing — `111 >= 11` is true while not one of the eleven is selected. The box
 * must read `'some'` here, or the click clears a selection the user was trying to
 * add to.
 */
window.__searchWithForeignSelection = async (name, text) => {
  const el = pick(name)
  const input = el.querySelector('.mono-tag-input-native')
  input.focus()
  input.value = text
  input.dispatchEvent(new Event('input', { bubbles: true }))
  await settle(el, 600)

  const rows = rowsOf(el)
  return {
    box: boxState(el),
    held: (el.value ?? []).length,
    shown: rows.length,
    // How many of the rows now on screen are actually part of that selection.
    shownSelected: rows.filter((r) => r.classList.contains('selected')).length,
  }
}

/** Type a query, let the debounce land, then tick "All". */
window.__searchThenAll = async (name, text, flushFirst = true) => {
  const el = pick(name)
  const s = src(name)
  const input = el.querySelector('.mono-tag-input-native')
  input.focus()
  input.value = text
  input.dispatchEvent(new Event('input', { bubbles: true }))

  // `flushFirst: false` clicks INSIDE the debounce window, which is the race the
  // drain has to handle: it must apply the pending query before reading the
  // source's filter, or it drains the PREVIOUS search.
  if (flushFirst) await settle(el, 600)

  s.calls.length = 0
  rowOf(el)?.click()
  await settle(el, 800)

  const values = el.value ?? []
  const hit = (r) => r.Name.toLowerCase().includes(text.toLowerCase())
  const named = values.map((v) => ROWS.find((r) => r.Id === v)?.Name ?? String(v))
  return {
    selected: values.length,
    allMatch: named.every((n) => n.toLowerCase().includes(text.toLowerCase())),
    expected: ROWS.filter(hit).length,
    sample: named.slice(0, 4),
    drains: drains(s.calls),
  }
}

window.__ready = true
