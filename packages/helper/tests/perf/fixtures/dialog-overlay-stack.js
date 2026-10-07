// Fixture for stacked dialogs and their overlays.
//
// A lower dialog hides its own overlay while another OVERLAY-BEARING dialog sits
// above it (one dim, not two). A stacked `overlay="false"` dialog must not count:
// it used to, because `hasBackdrop` was hard-wired to `true`, and the page ended up
// with no dim at all.
//
// Each pair is one base dialog (overlay on) plus one top dialog whose `overlay` is
// bound, so the spec can also flip it while open. Both are `stackable`, so opening
// the top one does not close the base.

import { createApp, ref, defineComponent, nextTick } from 'vue'
import '@mono-lit/helper/ui/modal'
import '@mono-lit/helper/ui/drawer'
import '@mono-lit/helper/ui/shadow/modal'
import '@mono-lit/helper/ui/shadow/drawer'

const PAIRS = ['modal', 'drawer', 'shadowModal', 'shadowDrawer', 'mixed']

const App = defineComponent({
  setup() {
    const state = {}
    for (const p of PAIRS) {
      state[p + 'Base'] = ref(false)
      state[p + 'Top'] = ref(false)
      state[p + 'TopOverlay'] = ref(false)
    }
    return state
  },
  template: `
    <div>
      <mono-modal data-t="modalBase" title="base" stackable :model-value="modalBase" @mno-close="modalBase = false">base</mono-modal>
      <mono-modal data-t="modalTop" title="top" stackable :overlay="modalTopOverlay" :model-value="modalTop" @mno-close="modalTop = false">top</mono-modal>

      <mono-drawer data-t="drawerBase" title="base" stackable :model-value="drawerBase" @mno-close="drawerBase = false">base</mono-drawer>
      <mono-drawer data-t="drawerTop" title="top" stackable :overlay="drawerTopOverlay" :model-value="drawerTop" @mno-close="drawerTop = false">top</mono-drawer>

      <mono-shadow-modal data-t="shadowModalBase" title="base" stackable :model-value="shadowModalBase" @mno-close="shadowModalBase = false">base</mono-shadow-modal>
      <mono-shadow-modal data-t="shadowModalTop" title="top" stackable :overlay="shadowModalTopOverlay" :model-value="shadowModalTop" @mno-close="shadowModalTop = false">top</mono-shadow-modal>

      <mono-shadow-drawer data-t="shadowDrawerBase" title="base" stackable :model-value="shadowDrawerBase" @mno-close="shadowDrawerBase = false">base</mono-shadow-drawer>
      <mono-shadow-drawer data-t="shadowDrawerTop" title="top" stackable :overlay="shadowDrawerTopOverlay" :model-value="shadowDrawerTop" @mno-close="shadowDrawerTop = false">top</mono-shadow-drawer>

      <!-- mixed: a drawer stacked over a modal -->
      <mono-modal data-t="mixedBase" title="base" stackable :model-value="mixedBase" @mno-close="mixedBase = false">base</mono-modal>
      <mono-drawer data-t="mixedTop" title="top" stackable :overlay="mixedTopOverlay" :model-value="mixedTop" @mno-close="mixedTop = false">top</mono-drawer>
    </div>`,
})

const app = createApp(App)
app.config.compilerOptions.isCustomElement = (t) => t.startsWith('mono-')
const vm = app.mount('#app')

// Longer than either overlay fade (modal: --mono-duration-slow, drawer: 500ms).
const settle = () => new Promise((r) => setTimeout(r, 650))

window.__set = async (name, value) => {
  vm[name] = value
  await nextTick()
  await settle()
}

/** The base dialog's overlay as the user sees it: painted opacity + the stack flag. */
window.__overlayOf = (name) => {
  const host = document.querySelector(`[data-t="${name}"]`)
  if (!host) return { error: 'host not found' }
  const kind = host.localName.includes('drawer') ? 'drawer' : 'modal'
  // Light builds portal the `.mono-<kind>` root to <body> (`_portal`, private in TS);
  // shadow builds render it inside the shadow root.
  const root = host._portal ?? host.shadowRoot?.querySelector(`.mono-${kind}`) ?? null
  if (!root) return { error: 'root not found' }
  const overlay = root.querySelector(`.mono-${kind}-overlay`)
  if (!overlay) return { error: 'overlay not found' }
  return {
    opacity: Number(getComputedStyle(overlay).opacity),
    above: root.hasAttribute(`mono-has-${kind}-above`),
  }
}

window.__pairs = PAIRS
window.__ready = true
