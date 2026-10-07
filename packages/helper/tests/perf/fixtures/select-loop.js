// Fixture for "`<mono-select searchable>` is slow inside a loop".
//
// Reproduces the shape the library's own editable-table demo produces: one
// `<mono-select>` per row, mounted for EVERY row rather than only the row being
// edited. `demos/table/vue/editable.vue` puts the editor behind `v-show`, so a
// 200-row grid holds 200 live selects — each with its own controllers, its own
// document listeners, and (before this work) its entire option list in the DOM while
// closed.
//
// TIMINGS, one per reported symptom:
//   __mountMs   mounting N selects at all
//   __churn()   an UNRELATED parent re-render
//   __open()    opening one dropdown
//   __type()    one keystroke in one search box
//
// COUNTERS, which are what the assertions actually use. They have no threshold to
// tune and do not flake under machine load — and one of them exists because the
// timing equivalent silently stopped working (see the spec's header):
//   __closedOptionCount()    option elements in the document while everything is closed
//   __openOptionCount()      ...and that they come back on open
//   __docListenerCount()     document listeners held by the mounted selects
//   __listenersAroundOpen()  ...and that those come back on open too
//   __renderCountOnChurn()   how many selects re-render for an unchanged prop
//
// Query params: ?rows=<n>&options=<n>&arm=baseline|fresh-css|fresh-search|not-searchable

import { createApp, ref, shallowRef, defineComponent, nextTick } from 'vue'
import '@mono-lit/helper/ui/select'

const q = new URLSearchParams(location.search)
const ROWS = Number(q.get('rows') ?? 200)
const OPTION_COUNT = Number(q.get('options') ?? 30)
const ARM = q.get('arm') ?? 'baseline'

// ── listener census ─────────────────────────────────────────────────────────────
// Wrapped BEFORE the app mounts, so it sees every listener the elements add in
// `connectedCallback`. Same technique as `fixtures/dialog-z.js`, pointed at
// `document` instead of `window`: select binds click/focusin/keydown there
// (`select-core.ts:643-648`), two of them capture-phase, and at 200 instances every
// click in the page then walks 400 handlers.
const docListeners = { click: new Set(), focusin: new Set(), keydown: new Set() }
const rawAdd = document.addEventListener.bind(document)
const rawRemove = document.removeEventListener.bind(document)
document.addEventListener = function (type, fn, opts) {
  docListeners[type]?.add(fn)
  return rawAdd(type, fn, opts)
}
document.removeEventListener = function (type, fn, opts) {
  docListeners[type]?.delete(fn)
  return rawRemove(type, fn, opts)
}
window.__docListenerCount = () => ({
  click: docListeners.click.size,
  focusin: docListeners.focusin.size,
  keydown: docListeners.keydown.size,
  total: docListeners.click.size + docListeners.focusin.size + docListeners.keydown.size,
})

// ── data ────────────────────────────────────────────────────────────────────────
// One shared, module-level options array: the BEST case for `items`, which is the
// one select prop that already has an `arrayHasChanged` guard. Any cost measured
// here is therefore not the `items` identity problem.
const OPTIONS = Array.from({ length: OPTION_COUNT }, (_, i) => ({
  value: `v${i}`,
  label: `Option ${i}`,
}))

const makeRows = (n) =>
  Array.from({ length: n }, (_, i) => ({
    Id: i + 1,
    Nama: `Activity ${i}`,
    Team: `v${i % OPTION_COUNT}`,
  }))

// A fresh object/array on every call — the shape that dirties an unguarded prop.
//
// It must be a FUNCTION CALL, not an inline literal: Vue only re-assigns a `.prop`
// when the expression is in `dynamicProps` AND `prev !== next`, and the compiler
// hoists a constant literal out of the render entirely. `:css-class.prop="{root:'x'}"`
// would therefore never reach the element and would measure nothing.
const freshCss = (row) => ({ root: `row-${row.Id % 3}` })
const freshSearch = () => ['label', 'value']

// ── template ────────────────────────────────────────────────────────────────────
// `tick` is rendered in a cell of its own and is NOT passed to any select — so a
// bump re-renders the whole table without changing anything a select displays.
// That is exactly the "unrelated re-render" the user reports.
const SELECT_ATTRS = {
  baseline: '',
  'fresh-css': ':css-class.prop="cssFor(r)"',
  'fresh-search': ':search-value.prop="searchFor(r)"',
  'not-searchable': '',
}

const App = defineComponent({
  setup() {
    const tick = ref(0)
    const rows = shallowRef(makeRows(ROWS))
    document.__tickRef = tick
    return {
      tick,
      rows,
      OPTIONS,
      cssFor: freshCss,
      searchFor: freshSearch,
    }
  },
  template: `
    <div class="wrap">
      <div class="card">unrelated: {{ tick }}</div>
      <div mono-table-scroll class="scroll-y" style="height:600px">
        <table mono-table>
          <thead><tr><th>Id</th><th>Nama</th><th>Team</th></tr></thead>
          <tbody>
            <tr v-for="r in rows" :key="String(r.Id)" :data-row-key="String(r.Id)">
              <td>{{ r.Id }}</td>
              <td>{{ r.Nama }}</td>
              <td>
                <mono-select
                  :data-t="'sel-' + r.Id"
                  size="sm"
                  ${ARM === 'not-searchable' ? '' : 'searchable'}
                  key-value="value"
                  display-value="label"
                  :items.prop="OPTIONS"
                  :model-value="r.Team"
                  ${SELECT_ATTRS[ARM] ?? ''} />
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>`,
})

// ── probes ──────────────────────────────────────────────────────────────────────

const allSelects = () => [...document.querySelectorAll('mono-select')]

/** Every mounted select has finished its Lit render AND layout has settled. */
const settle = async () => {
  await nextTick()
  await Promise.all(allSelects().map((el) => el.updateComplete))
  // Awaiting ONE element would time one element; the reflow is what makes the
  // number "blocked main thread until the user could see it".
  void document.body.offsetHeight
}

/**
 * Count how many selects actually RE-RENDER on an unrelated parent re-render.
 *
 * This is the honest test for the `hasChanged` guards, and it replaces a timing
 * ratio that stopped working: once the option list is only rendered while open, a
 * spurious render of a CLOSED select is cheap enough to vanish into the noise. The
 * timing said "fine" with the guard deliberately removed. A counter cannot.
 *
 * `performUpdate` is Lit's single entry point for an update that actually runs, so
 * wrapping it per instance counts renders exactly — 0 means every select correctly
 * decided nothing had changed.
 */
window.__renderCountOnChurn = async () => {
  let renders = 0
  const els = allSelects()
  const restore = els.map((el) => {
    const original = el.performUpdate.bind(el)
    el.performUpdate = () => {
      renders++
      return original()
    }
    return () => { delete el.performUpdate }
  })

  document.__tickRef.value++
  await settle()
  restore.forEach((fn) => fn())
  return { renders, selects: els.length }
}

/** Bump a ref no select reads, and time until everything has re-rendered. */
window.__churn = async () => {
  const t0 = performance.now()
  document.__tickRef.value++
  await settle()
  return performance.now() - t0
}

/**
 * Open ONE dropdown. `mono-select` has no public `show()`; `_open` is a TS-private
 * reactive prop, i.e. a plain property at runtime (`fixtures/dialog-z.js:194-196`
 * drives it the same way).
 */
window.__open = async (id = 1) => {
  const el = document.querySelector(`[data-t="sel-${id}"]`)
  const t0 = performance.now()
  el._open = true
  await el.updateComplete
  void document.body.offsetHeight
  const ms = performance.now() - t0
  el._open = false
  await el.updateComplete
  return ms
}

/**
 * Exact render counts for ONE open and ONE close of a select that HAS a value
 * (every row binds `:model-value="r.Team"`).
 *
 * Opening seeds the keyboard cursor on the selected row — `_activeIndex`, a
 * reactive state. Written from `updated()` that was a second render per open
 * (Lit's change-in-update warning in every consumer's dev console); written
 * from `willUpdate` it folds into the one render. `performUpdate` is wrapped
 * like `__renderCountOnChurn`, and a `settle()` after each edge lets any
 * deferred (microtask) re-render land before the count is read.
 */
window.__updatesOnOpenClose = async (id = 1) => {
  const el = document.querySelector(`[data-t="sel-${id}"]`)
  let renders = 0
  const original = el.performUpdate.bind(el)
  el.performUpdate = () => {
    renders++
    return original()
  }
  try {
    el._open = true
    await el.updateComplete
    await settle()
    const open = renders
    const active = document.querySelector('.mono-select-item.active')?.textContent?.trim() ?? null
    el._open = false
    await el.updateComplete
    await settle()
    return { open, close: renders - open, active, value: el.modelValue }
  } finally {
    delete el.performUpdate
  }
}

/**
 * One keystroke in one search box. `_onSearchInput` reads `event.target.value` and
 * calls `requestUpdate()` for the instant client filter, so this times the filter +
 * re-render, not the debounced server path.
 */
window.__type = async (id = 1, text = 'Option 1') => {
  const el = document.querySelector(`[data-t="sel-${id}"]`)
  el._open = true
  await el.updateComplete
  const input = el.querySelector('.mono-select-search-field')
  if (!input) return { error: 'no search field' }
  input.value = text
  const t0 = performance.now()
  input.dispatchEvent(new Event('input', { bubbles: true }))
  await el.updateComplete
  void document.body.offsetHeight
  const ms = performance.now() - t0
  el._open = false
  await el.updateComplete
  return ms
}

/**
 * Option elements in the document while EVERY select is closed.
 *
 * Today this is rows x options, because the panel and its list render
 * unconditionally and closing is CSS-only (`select.css:333` `display:none`).
 * Counted document-wide, not per element: an opened panel is portaled to `<body>`
 * and never moved back, so a host-scoped query would miss it.
 */
window.__closedOptionCount = () => ({
  open: document.querySelectorAll('.mono-select.open').length,
  options: document.querySelectorAll('.mono-select-item').length,
  selects: allSelects().length,
})

/**
 * Open one select and count the options that appear, then close it and count again.
 *
 * The counterpart to `__closedOptionCount`: proves the closed count is 0 because the
 * list is DEFERRED, not because it is broken. Counted document-wide — an open panel
 * is portaled to <body>, so a host-scoped query would miss it.
 */
window.__openOptionCount = async (id = 1) => {
  const el = document.querySelector(`[data-t="sel-${id}"]`)
  el._open = true
  await el.updateComplete
  await new Promise((r) => requestAnimationFrame(r))
  const open = document.querySelectorAll('.mono-select-item').length
  el._open = false
  await el.updateComplete
  await new Promise((r) => requestAnimationFrame(r))
  const closed = document.querySelectorAll('.mono-select-item').length
  return { open, closed, panels: document.querySelectorAll('.mono-select-dropdown').length }
}

/**
 * Listener census around one open/close cycle.
 *
 * The listeners are bound on OPEN now, so "0 at rest" is only half the contract —
 * the other half is that they come BACK, since they are what dismisses the panel on
 * an outside click. A select you cannot click away from would otherwise look like a
 * pass.
 */
window.__listenersAroundOpen = async (id = 1) => {
  const el = document.querySelector(`[data-t="sel-${id}"]`)
  const rest = window.__docListenerCount().total
  el._open = true
  await el.updateComplete
  const open = window.__docListenerCount().total
  el._open = false
  await el.updateComplete
  const closed = window.__docListenerCount().total
  return { rest, open, closed }
}

window.__ready = false

const boot = async () => {
  const app = createApp(App)
  app.config.compilerOptions.isCustomElement = (t) => t.startsWith('mono-')
  const t0 = performance.now()
  app.mount('#app')
  await settle()
  window.__mountMs = performance.now() - t0
  window.__ready = true
}

void boot()
