// Fixture for the modal/drawer `z-index` prop.
//
// Covers all three binding spellings Vue can produce, both the light and shadow
// builds, the unset case (which must still defer to the shared popup stack), and —
// the point of the whole feature — that popups opened INSIDE a pinned dialog still
// stack above it.

import { createApp, ref, defineComponent, nextTick } from 'vue'
import '@mono-lit/helper/ui/modal'
import '@mono-lit/helper/ui/drawer'
import '@mono-lit/helper/ui/shadow/modal'
import '@mono-lit/helper/ui/shadow/drawer'
import '@mono-lit/helper/ui/select'
import '@mono-lit/helper/ui/button-dropdown'
import '@mono-lit/helper/ui/button'

// ── window scroll-listener census ───────────────────────────────────────────
// Installed before the app mounts. The imports above only DEFINE the elements;
// nothing binds a listener until an element connects, so this sees every
// registration the components make. It proves a popup that has never been opened
// costs the page no scroll listener — before the fix each popup-capable element
// held one capture-phase listener from `connectedCallback` onward, which on a grid
// with a menu per row meant thousands of them.
const scrollListeners = new Set()
const rawAdd = window.addEventListener.bind(window)
const rawRemove = window.removeEventListener.bind(window)
window.addEventListener = function (type, fn, opts) {
  if (type === 'scroll') scrollListeners.add(fn)
  return rawAdd(type, fn, opts)
}
window.removeEventListener = function (type, fn, opts) {
  if (type === 'scroll') scrollListeners.delete(fn)
  return rawRemove(type, fn, opts)
}
window.__scrollListenerCount = () => scrollListeners.size

const OPTIONS = [
  { value: 'a', label: 'Alpha' },
  { value: 'b', label: 'Beta' },
]
const MENU = [{ label: 'One' }, { label: 'Two' }]

const App = defineComponent({
  setup() {
    return {
      openA: ref(false),
      openB: ref(false),
      openC: ref(false),
      openD: ref(false),
      openE: ref(false),
      openF: ref(false),
      openG: ref(false),
      openH: ref(false),
      openI: ref(false),
      openJ: ref(false),
      openK: ref(false),
      showDropdowns: ref(false),
      dynamicZ: ref(1400),
      OPTIONS,
      MENU,
    }
  },
  // `:z-index` (kebab → attribute → converter), `:zIndex` (camel → property), and
  // a plain static attribute all have to land on the same CSS var.
  //
  // The dialogs carrying a nested popup hold it inside ONE stable wrapper —
  // mono-modal captures its slot children once, on connect, so a `v-if` on a direct
  // child would append to the emptied host and never reach the portal.
  template: `
    <div>
      <mono-modal data-t="modalKebab" title="kebab" :z-index="1600" :model-value="openA" @mno-close="openA = false">
        <div>
          kebab
          <mono-select data-t="selInPinnedModal" :items.prop="OPTIONS" />
          <mono-button-dropdown data-t="ddInPinnedModal" :min="0" :buttons.prop="MENU" />
        </div>
      </mono-modal>
      <mono-modal data-t="modalCamel" title="camel" :zIndex="1700" :model-value="openB" @mno-close="openB = false">camel</mono-modal>
      <mono-modal data-t="modalStatic" title="static" z-index="1800" :model-value="openC" @mno-close="openC = false">static</mono-modal>
      <mono-modal data-t="modalUnset" title="unset" :model-value="openD" @mno-close="openD = false">
        <div>
          unset
          <mono-button-dropdown data-t="ddInUnsetModal" :min="0" :buttons.prop="MENU" />
        </div>
      </mono-modal>
      <mono-modal data-t="modalDynamic" title="dynamic" :z-index="dynamicZ" :model-value="openE" @mno-close="openE = false">dynamic</mono-modal>

      <mono-drawer data-t="drawerKebab" title="kebab" :z-index="1650" :model-value="openA" @mno-close="openA = false">kebab</mono-drawer>
      <mono-drawer data-t="drawerUnset" title="unset" :model-value="openD" @mno-close="openD = false">unset</mono-drawer>

      <mono-shadow-modal data-t="shadowModal" title="shadow" :z-index="1900" :model-value="openF" @mno-close="openF = false">shadow</mono-shadow-modal>
      <mono-shadow-drawer data-t="shadowDrawer" title="shadow" :z-index="1950" :model-value="openF" @mno-close="openF = false">shadow</mono-shadow-drawer>

      <mono-drawer data-t="drawerPinned" title="pinned" :z-index="1650" :model-value="openG" @mno-close="openG = false">
        <div>
          pinned
          <mono-button-dropdown data-t="ddInPinnedDrawer" :min="0" :buttons.prop="MENU" />
        </div>
      </mono-drawer>

      <!-- Both stackable, so opening the second does not close the first: an
           UNPINNED dialog opened over a pinned one has to land above it too. -->
      <mono-modal data-t="modalPinnedBase" title="pinned base" :z-index="1600" stackable :model-value="openH" @mno-close="openH = false">base</mono-modal>
      <mono-modal data-t="modalStackedOver" title="stacked over" stackable :model-value="openI" @mno-close="openI = false">over</mono-modal>

      <!-- null and '' must mean UNSET. Both are Number()-finite zeros, so before the
           guard they pinned the dialog to z-index 0 and dropped it behind the page.
           Only the ATTRIBUTE path was ever safe (optionalNumberConverter maps them
           to undefined); these go through the property, which is what Vue uses.

           One ref EACH, and not openD's: modals are exclusive unless stackable, so
           several sharing a ref would close one another — and each close writes the
           shared ref back to false, taking the rest down with it. -->
      <mono-modal data-t="modalNullZ" title="null z" :z-index="null" :model-value="openJ" @mno-close="openJ = false">null</mono-modal>
      <mono-modal data-t="modalEmptyZ" title="empty z" :z-index="''" :model-value="openK" @mno-close="openK = false">empty</mono-modal>

      <!-- Stands in for the per-row menus of a data grid: mounted, never opened. -->
      <div v-if="showDropdowns">
        <mono-button-dropdown v-for="n in 12" :key="n" :data-t="'ddIdle' + n" :min="0" :buttons.prop="MENU" />
      </div>
    </div>`,
})

const app = createApp(App)
app.config.compilerOptions.isCustomElement = (t) => t.startsWith('mono-')
const vm = app.mount('#app')

window.__setOpen = async (name, value) => {
  vm[name] = value
  await nextTick()
  await new Promise((r) => setTimeout(r, 120))
}

window.__setZ = async (value) => {
  vm.dynamicZ = value
  await nextTick()
  await new Promise((r) => setTimeout(r, 120))
}

/**
 * The resolved stacking level of a dialog, read the way the browser sees it.
 *
 * Light builds portal to `<body>` and set the var there; shadow builds set it on an
 * inner root. Rather than encode either, find the element that actually carries the
 * `.mono-modal` / `.mono-drawer` scope and read its computed z-index.
 */
window.__zOf = (name) => {
  const host = document.querySelector(`[data-t="${name}"]`)
  if (!host) return { error: 'host not found' }

  const kind = name.toLowerCase().includes('drawer') ? 'drawer' : 'modal'
  // Light builds keep their <body> portal on `_portal` (private in TS, a plain
  // property at runtime); shadow builds render the scope inside their shadow root.
  const scope =
    host._portal ??
    host.shadowRoot?.querySelector(`.mono-${kind}`) ??
    host.querySelector(`.mono-${kind}`) ??
    null

  if (!scope) return { error: 'scope not found' }

  // Where the level is DECLARED differs by component: modal.css puts `z-index` on
  // the `.mono-modal` root (the overlay inherits the stacking context), drawer.css
  // puts it on `.mono-drawer-overlay` and leaves the root `auto`. Read whichever
  // actually resolves to a number — that is the overlay's effective level either way.
  const overlay = scope.querySelector(`.mono-${kind}-overlay`)
  const overlayZ = overlay ? getComputedStyle(overlay).zIndex : 'auto'
  const rootZ = getComputedStyle(scope).zIndex

  return {
    z: overlayZ !== 'auto' ? overlayZ : rootZ,
    rootZ,
    overlayZ,
    varValue: scope.style.getPropertyValue('--mono-' + kind + '-z'),
  }
}

/**
 * Open (or close) a popup nested inside a dialog and report the level it paints at.
 *
 * `mono-button-dropdown` and `mono-select` are light-DOM and portal their panel into
 * a `div[data-mono-popup-portal]` on `<body>` — the ROOT stacking context — so the
 * only thing keeping them above a pinned dialog is the number the shared popup stack
 * hands them. That number is what this returns.
 */
window.__openPopup = async (name, value) => {
  const el = document.querySelector(`[data-t="${name}"]`)
  if (!el) return { error: 'popup host not found' }

  if (typeof el.show === 'function') {
    if (value) el.show('manual')
    else el.hide('manual')
  } else {
    // mono-select has no public show(); `_open` is `private` in TS and a plain
    // reactive property at runtime.
    el._open = value
  }

  await nextTick()
  await new Promise((r) => setTimeout(r, 150))

  if (!value) return { z: null }

  // The panel is NOT under `el` once the popup controller has adopted it — it lives
  // in an anonymous `div[data-mono-popup-portal]` on <body>, and every popup that has
  // been opened once keeps its portal (and its last `--mono-popup-z`) forever. So
  // "first portal panel in the document" reads a STALE neighbour. Filter to the one
  // actually being displayed instead; these helpers only ever open one at a time.
  const panels = Array.from(
    document.querySelectorAll('.mono-button-dropdown-panel, .mono-select-dropdown'),
  )
  const panel = panels.find((p) => getComputedStyle(p).display !== 'none')

  if (!panel) return { error: 'no visible panel', candidates: panels.length }

  return {
    z: getComputedStyle(panel).zIndex,
    portaled: !!panel.closest('[data-mono-popup-portal]'),
  }
}

window.__setDropdowns = async (value) => {
  vm.showDropdowns = value
  await nextTick()
  await new Promise((r) => setTimeout(r, 120))
}

window.__ready = true
