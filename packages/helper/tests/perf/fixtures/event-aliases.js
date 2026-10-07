// Plain event names beside the `mno-*` aliases — across the LIGHT and SHADOW
// builds of every kind of component.
//
// The contract under test (see `src/composables/mono-event.ts`): for each thing
// a component reports, a consumer listening to the PLAIN name (`@change`,
// `@input`, `@click`, `@toggle`, …) hears it exactly ONCE with the same `detail`
// the `mno-*` event carries — in both builds — and nothing extra appears
// anywhere: no second `click` per press, no `error` reaching the page, no
// synthesized device event for a document-level closer to misread.
//
// Every case mounts the light tag and its `mono-shadow-*` twin, records both
// spellings of every event it may emit, drives the SAME interaction on each,
// and reports the counts side by side.

import '@mono-lit/helper/ui/input'
import '@mono-lit/helper/ui/shadow/input'
import '@mono-lit/helper/ui/textarea'
import '@mono-lit/helper/ui/shadow/textarea'
import '@mono-lit/helper/ui/checkbox'
import '@mono-lit/helper/ui/shadow/checkbox'
import '@mono-lit/helper/ui/switch'
import '@mono-lit/helper/ui/shadow/switch'
import '@mono-lit/helper/ui/radio'
import '@mono-lit/helper/ui/shadow/radio'
import '@mono-lit/helper/ui/select'
import '@mono-lit/helper/ui/shadow/select'
import '@mono-lit/helper/ui/button'
import '@mono-lit/helper/ui/shadow/button'
import '@mono-lit/helper/ui/chip'
import '@mono-lit/helper/ui/shadow/chip'
import '@mono-lit/helper/ui/card'
import '@mono-lit/helper/ui/shadow/card'
import '@mono-lit/helper/ui/tabs'
import '@mono-lit/helper/ui/shadow/tabs'
import '@mono-lit/helper/ui/accordion'
import '@mono-lit/helper/ui/shadow/accordion'
import '@mono-lit/helper/ui/modal'
import '@mono-lit/helper/ui/shadow/modal'
import '@mono-lit/helper/ui/drawer'
import '@mono-lit/helper/ui/shadow/drawer'
import '@mono-lit/helper/ui/dropdown'
import '@mono-lit/helper/ui/shadow/dropdown'
import '@mono-lit/helper/ui/menu'
import '@mono-lit/helper/ui/shadow/menu'
import '@mono-lit/helper/ui/breadcrumb'
import '@mono-lit/helper/ui/shadow/breadcrumb'
import '@mono-lit/helper/ui/file-upload'
import '@mono-lit/helper/ui/shadow/file-upload'
import '@mono-lit/helper/ui/date'
import '@mono-lit/helper/ui/shadow/date'

const host = document.getElementById('app')
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

/** Real clicks reaching the document — a synthesized `click` would show up here. */
let documentClicks = 0
document.addEventListener('click', () => documentClicks++, true)
/** A plain `error` must never bubble out of its element. */
let wrapperErrors = 0

/**
 * Mount one element (light or shadow), record every spelling of the events it
 * may emit, and return { el, root, counts } where `root` is where its inner
 * controls live (the element itself, or its shadow root).
 */
function mount(tag, { attrs = {}, props = {}, inner = '' } = {}, events) {
  const wrap = document.createElement('div')
  wrap.className = 'wrap'
  wrap.addEventListener('error', () => wrapperErrors++)
  const el = document.createElement(tag)
  for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, v)
  if (inner) el.innerHTML = inner
  Object.assign(el, props)
  wrap.appendChild(el)
  host.appendChild(wrap)

  const counts = {}
  const seen = {}
  const listen = (name) => {
    counts[name] = 0
    el.addEventListener(name, (e) => {
      counts[name]++
      // First occurrence wins: what a consumer sees for the interaction itself.
      if (seen[name]) return
      seen[name] = {
        detail: e.detail,
        native: !(e instanceof CustomEvent) || e.constructor.name !== 'CustomEvent',
        ctor: e.constructor.name,
        target: e.target === el ? 'host' : e.target?.tagName?.toLowerCase() ?? '?',
        bubbles: e.bubbles,
        nativeDetail: e.nativeDetail,
      }
    })
  }
  for (const [mno, plain] of events) {
    listen(mno)
    listen(plain)
  }
  // Wrapper-level counters for bubbling checks.
  const wrapCounts = {}
  for (const [, plain] of events) {
    wrapCounts[plain] = 0
    wrap.addEventListener(plain, () => wrapCounts[plain]++)
  }
  const root = () => el.shadowRoot ?? el
  return { el, root, counts, seen, wrapCounts, events }
}

/** Per case: `[mnoName, plainName]` pairs + a `drive(el, root)` that performs the interaction. */
const CASES = {
  input: {
    events: [['mno-input', 'input'], ['mno-change', 'change'], ['mno-clear', 'clear']],
    attrs: { label: 'Name', clearable: '' },
    drive: async (el, root) => {
      const i = root().querySelector('.mono-input-native')
      i.focus()
      i.value = 'ab'
      i.dispatchEvent(new InputEvent('input', { bubbles: true, composed: true, inputType: 'insertText', data: 'b' }))
      i.dispatchEvent(new Event('change', { bubbles: true }))
      await el.updateComplete
      root().querySelector('.mono-input-clear')?.click()
      await el.updateComplete
    },
  },
  textarea: {
    events: [['mno-input', 'input'], ['mno-change', 'change']],
    attrs: { label: 'Note' },
    drive: async (el, root) => {
      const t = root().querySelector('.mono-textarea-field')
      t.value = 'x'
      t.dispatchEvent(new InputEvent('input', { bubbles: true, composed: true, inputType: 'insertText', data: 'x' }))
      t.dispatchEvent(new Event('change', { bubbles: true }))
    },
  },
  checkbox: {
    events: [['mno-change', 'change']],
    attrs: { label: 'Agree' },
    drive: async (el, root) => root().querySelector('input').click(),
  },
  switch: {
    events: [['mno-change', 'change']],
    attrs: { label: 'On' },
    drive: async (el, root) => root().querySelector('input').click(),
  },
  radio: {
    events: [['mno-change', 'change']],
    attrs: { label: 'Pick', value: 'a', name: 'r' },
    drive: async (el, root) => root().querySelector('input').click(),
  },
  select: {
    events: [['mno-change', 'change'], ['mno-clear', 'clear']],
    attrs: { label: 'Fruit', clearable: '' },
    props: { items: [{ label: 'Apple', value: 'a' }, { label: 'Pear', value: 'p' }] },
    drive: async (el, root) => {
      el.open()
      await el.updateComplete
      await sleep(30)
      const opt = document.querySelector('.mono-select-item') ?? root().querySelector('.mono-select-item')
      opt.click()
      await el.updateComplete
      await sleep(30)
      const clear = root().querySelector('.mono-select-clear')
      clear?.click()
      await el.updateComplete
    },
  },
  button: {
    events: [['mno-click', 'click']],
    inner: 'Save',
    drive: async (el, root) => root().querySelector('button').click(),
  },
  // A split button: the affix holds another control. Its click must NOT surface
  // as the outer button's `click` (light: the affix is a light child of the host).
  'button-affix': {
    tag: 'button',
    events: [['mno-click', 'click']],
    inner: 'Export<button slot="append" class="caret">▾</button>',
    drive: async (el, root) => {
      // Light: the slotted caret is a light child; shadow: it stays a light child too (slot).
      el.querySelector('.caret').click()
    },
  },
  chip: {
    events: [['mno-click', 'click'], ['mno-close', 'close']],
    attrs: { label: 'Tag', removable: '', clickable: '' },
    drive: async (el, root) => {
      root().querySelector('.mono-chip [role="button"], .mono-chip a').click()
      await el.updateComplete
      root().querySelector('.chip-close, .mono-chip-close').click()
    },
  },
  card: {
    events: [['mno-click', 'click']],
    attrs: { clickable: '', title: 'Card' },
    inner: 'body',
    drive: async (el, root) => {
      const c = root().querySelector('.mono-card')
      c.click()
      // Keyboard activation must come through as ONE real click too.
      c.focus()
      c.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, composed: true }))
    },
  },
  tabs: {
    // A selection change: plain `change`; the native `click` bubbles UNdecorated.
    events: [['mno-click', 'change'], ['native-click', 'click']],
    props: { items: [{ id: 'a', label: 'A' }, { id: 'b', label: 'B' }], modelValue: 'a' },
    drive: async (el, root) => {
      await el.updateComplete
      root().querySelectorAll('.mono-tabs-tab')[1].click()
    },
  },
  accordion: {
    events: [['mno-click', 'toggle'], ['mno-open', 'open'], ['mno-close', 'close'], ['native-click', 'click']],
    attrs: { label: 'Section' },
    inner: 'content',
    drive: async (el, root) => {
      root().querySelector('.mono-accordion-head').click()
      await el.updateComplete
      root().querySelector('.mono-accordion-head').click()
    },
  },
  modal: {
    events: [['mno-click', 'toggle'], ['mno-open', 'open'], ['mno-close', 'close'], ['native-click', 'click']],
    attrs: { title: 'Dialog' },
    inner: 'body',
    drive: async (el) => {
      el.show()
      await el.updateComplete
      await sleep(30)
      el.hide()
      await el.updateComplete
    },
  },
  drawer: {
    events: [['mno-click', 'toggle'], ['mno-open', 'open'], ['mno-close', 'close'], ['native-click', 'click']],
    inner: 'body',
    drive: async (el) => {
      el.show()
      await el.updateComplete
      await sleep(30)
      el.hide()
      await el.updateComplete
    },
  },
  dropdown: {
    events: [['mno-click', 'toggle'], ['mno-open', 'open'], ['mno-close', 'close'], ['native-click', 'click']],
    inner: '<button slot="main">Open</button><div>panel</div>',
    drive: async (el) => {
      el.show()
      await el.updateComplete
      await sleep(30)
      el.hide()
      await el.updateComplete
    },
  },
  menu: {
    events: [['mno-click', 'click'], ['mno-change', 'change']],
    props: { items: [{ id: 'a', label: 'Alpha' }, { id: 'b', label: 'Beta' }] },
    drive: async (el, root) => {
      await el.updateComplete
      root().querySelector('.mono-menu-action').click()
    },
  },
  breadcrumb: {
    events: [['mno-click', 'click'], ['mno-change', 'change']],
    props: { items: [{ id: 'home', label: 'Home' }, { id: 'docs', label: 'Docs' }] },
    drive: async (el, root) => {
      await el.updateComplete
      root().querySelector('.mono-breadcrumb-action').click()
    },
  },
  'file-upload': {
    events: [['mno-change', 'change'], ['mno-error', 'error']],
    attrs: { label: 'Files', 'max-file-size': '5' },
    drive: async (el, root) => {
      const input = root().querySelector('input[type="file"]')
      const ok = new DataTransfer()
      ok.items.add(new File(['abc'], 'ok.txt', { type: 'text/plain' }))
      input.files = ok.files
      input.dispatchEvent(new Event('change', { bubbles: true }))
      await el.updateComplete
      const big = new DataTransfer()
      big.items.add(new File(['0123456789'], 'big.txt', { type: 'text/plain' }))
      input.files = big.files
      input.dispatchEvent(new Event('change', { bubbles: true }))
      await el.updateComplete
    },
  },
  date: {
    events: [['mno-change', 'change']],
    attrs: { label: 'When' },
    drive: async (el) => {
      // flatpickr loads lazily; its onChange is what mono reports.
      for (let i = 0; i < 100 && !el._fp; i++) await sleep(20)
      el._fp.setDate('2026-01-15', true)
      await el.updateComplete
    },
  },
}

const ARMS = {}
for (const [id, spec] of Object.entries(CASES)) {
  const tag = spec.tag ?? id
  ARMS[id] = {
    light: mount(`mono-${tag}`, spec, spec.events),
    shadow: mount(`mono-shadow-${tag}`, spec, spec.events),
  }
}

/** Drive one case on both builds and report every count + what the plain event looked like. */
window.__drive = async (id) => {
  const spec = CASES[id]
  const out = {}
  for (const build of ['light', 'shadow']) {
    const arm = ARMS[id][build]
    await arm.el.updateComplete
    const clicksBefore = documentClicks
    await spec.drive(arm.el, arm.root)
    await arm.el.updateComplete
    await sleep(60)
    out[build] = {
      counts: { ...arm.counts },
      wrap: { ...arm.wrapCounts },
      seen: Object.fromEntries(
        Object.entries(arm.seen).map(([k, v]) => [
          k,
          {
            ctor: v.ctor,
            target: v.target,
            bubbles: v.bubbles,
            hasDetail: v.detail !== null && typeof v.detail === 'object',
            detailKeys: v.detail && typeof v.detail === 'object' ? Object.keys(v.detail).slice(0, 8) : typeof v.detail,
            nativeDetail: v.nativeDetail,
          },
        ]),
      ),
      // Same detail OBJECT on the plain and the mno event?
      sameDetail: Object.fromEntries(
        spec.events
          .filter(([mno]) => !mno.startsWith('native-'))
          .map(([mno, plain]) => [plain, !!arm.seen[mno] && !!arm.seen[plain] && arm.seen[mno].detail === arm.seen[plain].detail]),
      ),
      documentClicks: documentClicks - clicksBefore,
      wrapperErrors,
    }
  }
  return out
}

window.__fixtureReady = true
