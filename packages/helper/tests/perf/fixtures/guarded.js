// Fixture for the `hasChanged: arrayHasChanged` guards.
//
// The guard's failure mode is the opposite of the perf bug: a wrongly-suppressed
// update leaves a STALE render that no later pass repairs. So every assertion here
// is "a real change still reaches the DOM". Each component is driven by a plain Vue
// ref bound with `.prop`, which is exactly how a consumer drives it.

import { createApp, ref, defineComponent, nextTick } from 'vue'
import '@mono-lit/helper/ui/menu'
import '@mono-lit/helper/ui/tabs'
import '@mono-lit/helper/ui/breadcrumb'
import '@mono-lit/helper/ui/tag-input'
import '@mono-lit/helper/ui/file-upload'

const App = defineComponent({
  setup() {
    // `title` is the display field for MenuItem / BreadcrumbItem (menu-types.ts,
    // breadcrumb-types.ts); TabItem uses `label`. FileUploadItem needs id/name/size/type.
    return {
      menuItems: ref([{ id: 'a', title: 'Alpha' }, { id: 'b', title: 'Bravo' }]),
      listItems: ref([{ id: 'x', title: 'Xray' }]),
      tabItems: ref([{ value: 't1', label: 'One' }, { value: 't2', label: 'Two' }]),
      crumbItems: ref([{ id: 'h', title: 'Home' }, { id: 'd', title: 'Docs' }]),
      crumbListItems: ref([{ id: 'r', title: 'Root' }]),
      tags: ref(['red', 'green']),
      files: ref([{ id: 'f1', name: 'alpha.txt', size: 10, type: 'text/plain' }]),
    }
  },
  template: `
    <div class="wrap">
      <mono-menu data-t="menu" :items.prop="menuItems"></mono-menu>

      <!-- Plain LIST mode: no type/title attributes, so _isDeclarativeMode() is false
           and items renders directly. The hook is data-t, NOT id — an id counts as a
           direct item prop and flips this element into single-row mode, where it
           renders one row titled after the id. Same trap on mono-breadcrumb-list. -->
      <mono-menu-list data-t="menuList" :items.prop="listItems"></mono-menu-list>

      <mono-tabs data-t="tabs" :items.prop="tabItems" model-value="t1"></mono-tabs>
      <mono-breadcrumb data-t="crumb" :items.prop="crumbItems"></mono-breadcrumb>
      <mono-breadcrumb data-t="crumbHost">
        <mono-breadcrumb-list data-t="crumbList" slot="body" :items.prop="crumbListItems"></mono-breadcrumb-list>
      </mono-breadcrumb>
      <mono-tag-input data-t="tags" :model-value.prop="tags"></mono-tag-input>
      <mono-file-upload data-t="files" :model-value.prop="files"></mono-file-upload>
    </div>`,
})

const app = createApp(App)
app.config.compilerOptions.isCustomElement = (t) => t.startsWith('mono-')
const vm = app.mount('#app')

/** Replace a ref's array, wait for Vue + Lit, and hand back the element's text. */
window.__setAndRead = async (refName, nextValue, elId) => {
  vm[refName] = nextValue
  await nextTick()
  const el = document.querySelector(`[data-t="${elId}"]`)
  if (el?.updateComplete) await el.updateComplete
  await new Promise((r) => setTimeout(r, 60))
  return (el?.textContent || '').replace(/\s+/g, ' ').trim()
}

window.__read = async (elId) => {
  const el = document.querySelector(`[data-t="${elId}"]`)
  if (el?.updateComplete) await el.updateComplete
  return (el?.textContent || '').replace(/\s+/g, ' ').trim()
}

window.__ready = true
