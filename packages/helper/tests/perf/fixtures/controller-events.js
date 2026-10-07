// Event handlers through a controller's `props` — `onChange`, `onToggle`,
// `onOpen`, … wired from the same place the props come from.
//
// The contract under test (see `src/composables/element-props.ts`): every
// controller pushes its `props` through ONE writer, `applyProps`, and that
// writer turns an `on<Event>` key into a DOM listener on the element instead
// of an inert `el.onClick = fn` expando. So the same object a store already
// owns for a control's configuration can carry its behaviour — and it has to
// hold under the controller's real rhythm: the props are re-applied on EVERY
// notify and every render, the form hands over a fresh merged object each
// time, and an element can be re-bound to another controller.
//
// Arms: the form (light + shadow input), the table (two row details and an
// error bar sharing one grid), the bound modal (light + shadow twins on one
// controller), the dialog buttons (their `onClick(event, ctx)` contract must
// survive), and the button-dropdown item (its `onClick(item)` is the item
// callback, not a listener).

import '@mono-lit/helper/ui/input'
import '@mono-lit/helper/ui/shadow/input'
import '@mono-lit/helper/ui/table'
import '@mono-lit/helper/ui/modal'
import '@mono-lit/helper/ui/shadow/modal'
import '@mono-lit/helper/ui/button'
import '@mono-lit/helper/ui/button-dropdown'
import { controlMonoForm, controlMonoModal, controlMonoTable } from '@mono-lit/helper'

const host = document.getElementById('app')
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

/** Every handler call, by arm → name, with what a consumer would read. */
const log = {}
const record = (arm, name) => (event) => {
  ;(log[arm] ??= {})[name] ??= []
  log[arm][name].push({
    type: event?.type,
    ctor: event?.constructor?.name,
    detail: event?.detail && typeof event.detail === 'object' ? { ...event.detail, sourceEvent: undefined } : event?.detail,
    target: event?.target?.tagName?.toLowerCase() ?? null,
  })
}
const calls = (arm, name) => log[arm]?.[name] ?? []

function el(tag, attrs = {}, props = {}) {
  const e = document.createElement(tag)
  for (const [k, v] of Object.entries(attrs)) e.setAttribute(k, v)
  Object.assign(e, props)
  host.appendChild(e)
  return e
}

const typeInto = (input, value) => {
  input.value = value
  input.dispatchEvent(new InputEvent('input', { bubbles: true, composed: true, inputType: 'insertText', data: value }))
  input.dispatchEvent(new Event('change', { bubbles: true }))
}

// ── form ─────────────────────────────────────────────────────────────────────
// `Name` declares its handlers statically; `Note` gets them through `setProp`
// so the swap / `null` paths run on the dynamic layer (static wins over it).

const form = controlMonoForm({
  inputs: {
    Name: {
      component: 'mono-input',
      value: '',
      props: { label: 'Name', onChange: record('form', 'Name.change'), onInput: record('form', 'Name.input') },
    },
    Note: { component: 'mono-input', value: '', props: { label: 'Note' } },
  },
})
const formLight = el('mono-input', { id: 'form-name-light', 'key-form': 'Name' }, { controlForm: form })
const formShadow = el('mono-shadow-input', { id: 'form-name-shadow', 'key-form': 'Name' }, { controlForm: form })
const noteLight = el('mono-input', { id: 'form-note-light', 'key-form': 'Note' }, { controlForm: form })

// A second form the `Name` element gets re-bound to.
const form2 = controlMonoForm({
  inputs: { Name: { component: 'mono-input', value: '', props: { onChange: record('form', 'Name.change@form2') } } },
})

window.__form = {
  async drive() {
    await sleep(20)
    for (const e of [formLight, formShadow]) {
      const native = (e.shadowRoot ?? e).querySelector('.mono-input-native')
      typeInto(native, 'ab')
      await e.updateComplete
    }
    return {
      change: calls('form', 'Name.change'),
      input: calls('form', 'Name.input'),
      onChangeProp: typeof formLight.onChange,
    }
  },
  /** Many notifies with the same static props: still one listener per element. */
  async churn() {
    const before = calls('form', 'Name.change').length
    for (let i = 0; i < 5; i++) {
      form.setProp({ key: 'Name', props: { placeholder: `p${i}` } })
      await sleep(0)
    }
    await sleep(20)
    typeInto(formLight.querySelector('.mono-input-native'), 'churn')
    await formLight.updateComplete
    return { firedPerType: calls('form', 'Name.change').length - before, placeholder: formLight.placeholder }
  },
  /** `setProp` adds, swaps, then removes a dynamic handler on `Note`. */
  async dynamic() {
    const native = noteLight.querySelector('.mono-input-native')
    form.setProp({ key: 'Note', props: { onChange: record('form', 'Note.a') } })
    await sleep(20)
    typeInto(native, '1')
    form.setProp({ key: 'Note', props: { onChange: record('form', 'Note.b') } })
    await sleep(20)
    typeInto(native, '2')
    form.setProp({ key: 'Note', props: { onChange: null } })
    await sleep(20)
    typeInto(native, '3')
    return { a: calls('form', 'Note.a').length, b: calls('form', 'Note.b').length }
  },
  /** Re-binding the element to another form drops the first form's handler. */
  async rebind() {
    const before = calls('form', 'Name.change').length
    formLight.controlForm = form2
    await sleep(20)
    typeInto(formLight.querySelector('.mono-input-native'), 'rebound')
    await formLight.updateComplete
    return {
      form1Fired: calls('form', 'Name.change').length - before,
      form2Fired: calls('form', 'Name.change@form2').length,
    }
  },
}

// ── table: two row details + the error bar on one grid ───────────────────────

function makeSource(rows) {
  let failure = null
  const listeners = new Map()
  const emit = (name, ...args) => {
    for (const fn of listeners.get(name) ?? []) fn(...args)
  }
  const source = {
    load: () =>
      new Promise((resolve, reject) => {
        setTimeout(() => {
          if (failure !== null) {
            emit('loadError', failure)
            reject(failure)
            return
          }
          emit('changed')
          resolve(rows)
        }, 4)
      }),
    items: () => (failure !== null ? [] : rows),
    totalCount: () => (failure !== null ? 0 : rows.length),
    pageIndex: () => 0,
    pageSize: () => 10,
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
    isLoading: () => false,
  }
  return { source, fail: (v) => (failure = v), succeed: () => (failure = null) }
}

const grid = controlMonoTable(null, {
  keyExpr: 'Id',
  props: {
    detail: {
      icon: 'i-mdi-plus',
      onToggle: record('table', 'detail.toggle'),
      onOpen: record('table', 'detail.open'),
      onClose: record('table', 'detail.close'),
    },
    error: { onReload: record('table', 'error.reload'), onClose: record('table', 'error.close') },
  },
})
const tableWrap = document.createElement('div')
tableWrap.innerHTML = `
  <table mono-table id="grid">
    <thead><tr><th></th><th>Name</th></tr></thead>
    <tbody id="grid-body">
      <tr data-row-key="1"><td id="d1"></td><td>One</td></tr>
      <tr data-row-key="2"><td id="d2"></td><td>Two</td></tr>
    </tbody>
  </table>
`
host.appendChild(tableWrap)
const details = ['d1', 'd2'].map((cell) => {
  const d = document.createElement('mono-table-detail')
  d.innerHTML = '<p>panel</p>'
  d.controlTable = grid
  tableWrap.querySelector(`#${cell}`).appendChild(d)
  return d
})
const errorEl = document.createElement('mono-table-error')
errorEl.setAttribute('dismissible', '')
errorEl.controlTable = grid
tableWrap.querySelector('#grid-body').appendChild(errorEl)
const stub = makeSource([{ Id: 1, Name: 'One' }, { Id: 2, Name: 'Two' }])
grid.bind(stub.source)

window.__table = {
  async drive() {
    await sleep(40)
    for (const d of details) {
      d.querySelector('button').click()
      await d.updateComplete
      await sleep(10)
    }
    // Row 2 opening closed row 1 through the accordion (`collapseOthers` writes
    // `open` directly — silent, as any `open` write is). Row 1 opens again, then
    // its own chevron closes it: the one `close` a consumer hears.
    details[0].querySelector('button').click()
    await sleep(10)
    details[0].querySelector('button').click()
    await sleep(10)
    return {
      icon: details.map((d) => d.icon),
      toggle: calls('table', 'detail.toggle'),
      open: calls('table', 'detail.open'),
      close: calls('table', 'detail.close'),
    }
  },
  async error() {
    stub.fail({ status: 500 })
    await grid.load().catch(() => {})
    await sleep(40)
    const bar = errorEl.querySelector('.mono-table-error-bar')
    errorEl.querySelector('.mono-table-error-reload')?.click()
    await sleep(40)
    errorEl.querySelector('.mono-table-error-close')?.click()
    await sleep(10)
    return { barShown: !!bar, reload: calls('table', 'error.reload'), close: calls('table', 'error.close') }
  },
}

// ── modal: one controller, light + shadow twins ──────────────────────────────

const modal = controlMonoModal({
  props: {
    title: 'CTRL',
    onOpen: record('modal', 'open'),
    onClose: record('modal', 'close'),
    onToggle: record('modal', 'toggle'),
  },
})
const modalLight = el('mono-modal', { id: 'modal-light' }, { controlModal: modal })
modalLight.textContent = 'light body'
const modalShadow = el('mono-shadow-modal', { id: 'modal-shadow' }, { controlModal: modal })
modalShadow.textContent = 'shadow body'

window.__modal = {
  async drive() {
    await sleep(20)
    modal.open()
    await sleep(60)
    modal.close()
    await sleep(60)
    return {
      titles: [modalLight.title, modalShadow.title],
      open: calls('modal', 'open'),
      close: calls('modal', 'close'),
      toggle: calls('modal', 'toggle'),
    }
  },
}

// ── dialog buttons: the `onClick(event, ctx)` contract ───────────────────────

const dlg = controlMonoModal({
  dialog: {
    title: 'Sure?',
    body: 'Body',
    buttons: [
      {
        label: 'Go',
        value: true,
        onClick: (event, ctx) => {
          ;(log.dialog ??= {}).onClick = [{
            eventType: event?.type,
            ctxKeys: Object.keys(ctx ?? {}).sort(),
            sameDialog: ctx?.dialog === dlg.dialog,
            closeIsFn: typeof ctx?.dialog?.close === 'function',
            buttonIsEl: ctx?.button instanceof HTMLElement,
          }]
        },
        onLoadingChange: record('dialog', 'loading-change'),
      },
    ],
  },
})

window.__dialog = {
  async drive() {
    const pending = dlg.dialog.show()
    await sleep(60)
    const btn = document.querySelector('[data-mono-dialog-button]')
    btn.click()
    const value = await pending
    await sleep(30)
    return { value, onClick: log.dialog?.onClick ?? [], onClickProp: typeof btn.onClick }
  },
}

// ── button-dropdown item ─────────────────────────────────────────────────────

const bd = el('mono-button-dropdown')
bd.buttons = [
  {
    label: 'Edit',
    onClick: (event) => {
      ;(log.bd ??= {}).item = [{ eventType: event?.type }]
      log.bd.itemCalls = (log.bd.itemCalls ?? 0) + 1
    },
    onLoadingChange: record('bd', 'loading-change'),
  },
]

window.__buttonDropdown = {
  async drive() {
    await bd.updateComplete
    await sleep(20)
    const btn = bd.querySelector('.mono-button-dropdown-row-btn')
    btn.querySelector('button').click()
    await sleep(10)
    return { itemCalls: log.bd?.itemCalls ?? 0, eventType: log.bd?.item?.[0]?.eventType, onClickProp: typeof btn.onClick }
  },
}

window.__fixtureReady = true
