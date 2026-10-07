// A no-overlay modal / drawer closes on a click OUTSIDE the panel.
//
// With `overlay="false"` the backdrop is `display: none` and the modal's panel
// wrap is `pointer-events: none`, so a page click reaches the page and nothing
// in the dialog's tree ever sees it — the dialog could only be closed by ✕ or
// Escape. Now a document `click` listener stands in for the backdrop while a
// no-overlay dialog is open: it closes the dialog with the same `source:
// 'overlay'`, and the click still goes THROUGH to the page (bubble phase, no
// stopPropagation). Inside stays inside: the panel, and a select's option list
// opened from within it (a body portal, owned by an element inside the panel).
// Topmost only: a dialog under another one, or under that open select, leaves
// the click to the layer above.
import { createApp, ref, defineComponent, nextTick } from 'vue'
import '@mono-lit/helper/ui/modal'
import '@mono-lit/helper/ui/drawer'
import '@mono-lit/helper/ui/shadow/modal'
import '@mono-lit/helper/ui/shadow/drawer'
import '@mono-lit/helper/ui/select'
import '@mono-lit/helper/ui/button'

// Census of document `click` listeners, so "no listener with an overlay" is
// checkable without devtools' getEventListeners.
const docClicks = new Set()
const origAdd = document.addEventListener.bind(document)
const origRemove = document.removeEventListener.bind(document)
document.addEventListener = (type, fn, opts) => {
  if (type === 'click') docClicks.add(fn)
  return origAdd(type, fn, opts)
}
document.removeEventListener = (type, fn, opts) => {
  if (type === 'click') docClicks.delete(fn)
  return origRemove(type, fn, opts)
}
window.__docClickListeners = () => docClicks.size

const OPTIONS = [
  { value: 'a', label: 'Alpha' },
  { value: 'b', label: 'Beta' },
]

const App = defineComponent({
  setup() {
    return {
      modal: ref(false),
      drawer: ref(false),
      shadowModal: ref(false),
      shadowDrawer: ref(false),
      noClose: ref(false),
      persistent: ref(false),
      noDismiss: ref(false),
      overlaid: ref(false),
      stackedTop: ref(false),
      pageClicks: ref(0),
      OPTIONS,
    }
  },
  // Every dialog has ONE stable wrapper child — mono-modal captures its slot
  // children once, on connect.
  template: `
    <div>
      <button id="page-btn" type="button" @click="pageClicks++">page button</button>
      <span id="page-count">{{ pageClicks }}</span>
      <div id="elsewhere" style="width: 200px; height: 80px; background: #eee">elsewhere</div>

      <mono-modal data-t="modal" :overlay="false" title="No overlay" stackable :model-value="modal" @mno-close="modal = false">
        <div>
          <p id="modal-text">inside</p>
          <mono-select data-t="modalSelect" :items.prop="OPTIONS" value-key="value" display-key="label"></mono-select>
        </div>
      </mono-modal>

      <mono-drawer data-t="drawer" :overlay="false" title="No overlay" :model-value="drawer" @mno-close="drawer = false">
        <div><p id="drawer-text">inside</p></div>
      </mono-drawer>

      <mono-shadow-modal data-t="shadowModal" :overlay="false" title="Shadow" :model-value="shadowModal" @mno-close="shadowModal = false">
        <div><p id="shadow-modal-text">inside</p></div>
      </mono-shadow-modal>

      <mono-shadow-drawer data-t="shadowDrawer" :overlay="false" title="Shadow" :model-value="shadowDrawer" @mno-close="shadowDrawer = false">
        <div><p id="shadow-drawer-text">inside</p></div>
      </mono-shadow-drawer>

      <mono-modal data-t="noClose" :overlay="false" :close-on-overlay="false" title="No close" :model-value="noClose" @mno-close="noClose = false">
        <div><p>inside</p></div>
      </mono-modal>
      <mono-modal data-t="persistent" :overlay="false" persistent title="Persistent" :model-value="persistent" @mno-close="persistent = false">
        <div><p>inside</p></div>
      </mono-modal>
      <mono-drawer data-t="noDismiss" :overlay="false" :dismissible="false" title="No dismiss" :model-value="noDismiss" @mno-close="noDismiss = false">
        <div><p>inside</p></div>
      </mono-drawer>

      <mono-modal data-t="overlaid" title="With overlay" :model-value="overlaid" @mno-close="overlaid = false">
        <div><p>inside</p></div>
      </mono-modal>

      <mono-modal data-t="stackedTop" stackable title="Stacked over" :model-value="stackedTop" @mno-close="stackedTop = false">
        <div><p id="stacked-text">inside</p></div>
      </mono-modal>
    </div>`,
})

const app = createApp(App)
app.config.compilerOptions.isCustomElement = (t) => t.startsWith('mono-')
const vm = app.mount('#app')

const settle = (ms = 60) => new Promise((r) => setTimeout(r, ms))
const host = (name) => document.querySelector(`[data-t="${name}"]`)

/** The last `mno-close` per dialog: its `detail.source`. */
const closes = {}
for (const el of document.querySelectorAll('[data-t]')) {
  el.addEventListener('mno-close', (e) => {
    closes[el.dataset.t] = e.detail?.source ?? null
  })
}

window.__setOpen = async (name, value) => {
  vm[name] = value
  await nextTick()
  await settle(80) // past the setTimeout(0) that arms the listener
}
window.__openByClick = async (name) => {
  // Opened by a REAL click on a page element: that click must not close it.
  const btn = document.createElement('button')
  btn.id = 'opener'
  btn.addEventListener('click', () => {
    vm[name] = true
  })
  document.body.appendChild(btn)
  btn.click()
  btn.remove()
  await nextTick()
  await settle(80)
}
window.__isOpen = (name) => !!host(name)?.modelValue
window.__closedWith = (name) => closes[name] ?? null
window.__reset = (name) => {
  delete closes[name]
}
window.__pageClicks = () => vm.pageClicks

const fire = (el, type, init = {}) =>
  el.dispatchEvent(new PointerEvent(type, { bubbles: true, composed: true, cancelable: true, pointerType: 'mouse', ...init }))
window.__pointer = async (selector) => {
  const el = document.querySelector(selector)
  if (!el) return false
  fire(el, 'pointerdown')
  fire(el, 'pointerup')
  el.click()
  await settle(40)
  return true
}
/** A click on the dialog's own body text — inside the panel, whichever build. */
window.__clickInside = async (name) => {
  const h = host(name)
  const root = h?._portal ?? h?.shadowRoot ?? h
  const p = root?.querySelector('p') ?? h?.querySelector('p')
  if (!p) return false
  p.click()
  await settle(40)
  return true
}
/** The overlaid modal's backdrop. */
window.__clickBackdrop = async (name) => {
  const h = host(name)
  const el = (h?._portal ?? h?.shadowRoot)?.querySelector('.mono-modal-overlay')
  if (!el) return false
  el.click()
  await settle(40)
  return true
}
window.__openSelect = async () => {
  const sel = host('modalSelect')
  sel.open()
  await sel.updateComplete
  await settle(80)
  return window.__selectOpen()
}
window.__selectOpen = () => !!host('modalSelect')?._open
window.__pickOption = async (label) => {
  const opt = [...document.querySelectorAll('.mono-select-item')].find((o) => o.textContent.trim() === label)
  if (!opt) return false
  fire(opt, 'pointerdown')
  fire(opt, 'pointerup')
  opt.click()
  await settle(60)
  return true
}
window.__selectValue = () => host('modalSelect')?.modelValue ?? null

window.__ready = true
