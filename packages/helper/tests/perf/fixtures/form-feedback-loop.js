// A form-bound select must not start an endless notify loop when it opens.
//
// Opening a select re-renders it and publishes its list (`active` moves), which notifies the form.
// Three paths used to turn that ONE notify into an endless microtask chain, freezing the tab:
//   · `flush()` handed every bound `state` ref a brand-new snapshot even when nothing moved, so a
//     watcher on that ref fired on every notify — and one that wrote back (`setProp` of the same
//     label) notified again;
//   · `setProp()` notified even when every value was already there;
//   · `_syncFromForm()` re-rendered every bound control on every notify, so a select whose list
//     entries are fresh each render (primitive rows are re-wrapped) re-published forever.
// Each arm uses its own form, so the deliberate runaway in arm C cannot affect the others.
//
//   A — a Vue-like `state` ref whose "watcher" pushes the SAME props back on every change.
//   B — a select with PRIMITIVE items.
//   C — a writer that pushes a NEW value on every change: a real loop, which the notifier's
//       breaker must stop (one console.error, the page stays responsive).

import '@mono-lit/helper/ui/select'
import { controlMonoForm } from '@mono-lit/helper'

window.__errors = []
const origError = console.error.bind(console)
console.error = (...args) => {
  window.__errors.push(args.map(String).join(' '))
  origError(...args)
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

/** A stand-in for a Vue ref + `watch(ref, cb)`: `cb` runs only when a DIFFERENT object lands. */
function watchedRef(onChange) {
  let current
  return {
    get value() {
      return current
    },
    set value(v) {
      if (v === current) return
      current = v
      queueMicrotask(() => onChange(v))
    },
  }
}

function makeArm(id, { items, onState }) {
  let form
  const state = watchedRef(() => onState?.(form))
  form = controlMonoForm({
    state,
    inputs: {
      Pick: {
        component: 'mono-select',
        value: null,
        props: { items, keyValue: 'value', displayValue: 'label', placeholder: 'Pilih...' },
      },
    },
  })
  let flushes = 0
  form.subscribe(() => {
    flushes++
  })
  const sel = document.createElement('mono-select')
  sel.id = id
  sel.setAttribute('key-form', 'Pick')
  sel.controlForm = form
  document.querySelector('#app').appendChild(sel)
  return {
    form,
    sel,
    flushes: () => flushes,
  }
}

const objectItems = [2024, 2025, 2026].map((y) => ({ label: String(y), value: y }))

const arms = {
  // A: the "watcher" re-pushes identical props on every state change.
  a: makeArm('arm-a', {
    items: objectItems,
    onState: (form) => form.setProp({ key: 'Pick', props: { label: 'Tahun', visible: true } }),
  }),
  // B: primitive rows, no watcher.
  b: makeArm('arm-b', { items: [2024, 2025, 2026] }),
  // C: a genuine loop — a NEW label every time. Armed only when the spec opens it, so its
  // deliberate runaway cannot land before A and B are read.
  c: makeArm('arm-c', {
    items: objectItems,
    onState: (form) => {
      if (window.__armC) form.setProp({ key: 'Pick', props: { label: `L${Math.random()}` } })
    },
  }),
}

/** Open the arm's select, then count the flushes that follow. */
window.__open = async (name, windowMs = 400) => {
  const arm = arms[name]
  await sleep(50)
  const before = arm.flushes()
  if (name === 'c') window.__armC = true
  arm.sel._open = true
  arm.sel.requestUpdate()
  await sleep(windowMs)
  const mid = arm.flushes()
  await sleep(windowMs)
  return {
    flushesFirstWindow: mid - before,
    flushesSecondWindow: arm.flushes() - mid,
    open: !!arm.sel._open,
  }
}

/** Did a 0ms timer fire promptly? (A microtask loop starves timers.) */
window.__responsive = async () => {
  const t0 = performance.now()
  await sleep(0)
  return performance.now() - t0
}

setTimeout(() => {
  window.__ready = true
}, 100)
