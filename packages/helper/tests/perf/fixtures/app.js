// Fixture app for the button-dropdown regression tests.
//
// Reproduces the shape that made `master-post-budget.vue` unusable: ONE Vue
// component holding both an accordion's open ref AND a large `v-for` table, with a
// `<mono-button-dropdown>` per row whose `buttons` array is rebuilt on every render
// (necessary in real code — each entry's `onClick` must close over its own row).
//
// Query params: ?rows=<n>&arm=baseline|stable-actions|child-component

import { createApp, ref, shallowRef, defineComponent, nextTick } from 'vue'
import '@mono-lit/helper/ui/accordion'
import '@mono-lit/helper/ui/chip'
import '@mono-lit/helper/ui/button-dropdown'

const q = new URLSearchParams(location.search)
const ROWS = Number(q.get('rows') ?? 2000)
const ARM = q.get('arm') ?? 'baseline'

const makeRows = (n) =>
  Array.from({ length: n }, (_, i) => ({
    Id: i + 1,
    Channel: ['TikTok', 'Shopee', 'Offline'][i % 3],
    Kategori: 'K' + (i % 7),
    BrandNama: 'Brand ' + (i % 11),
    CoaKode: '5-' + (1000 + i),
    CoaNama: 'COA name ' + i,
    _ParentNama: 'Parent ' + (i % 23),
    Nama: 'Activity ' + i,
    Departemen: 'DEPT' + (i % 5),
    Year: 2026,
    IsComfirm: i % 2 === 0,
    // Bumped when a test replaces the rows; see `freshActions`. Deliberately NOT
    // rendered anywhere, so it cannot make the entries compare unequal.
    Gen: 0,
  }))

// A fresh array of fresh objects with fresh closures, every call — the real shape.
// `EditLabel` lets a test change menu CONTENT and assert that still re-renders.
//
// The handler reports `Gen` as well as `Id`. That is what makes a stale closure
// detectable: when a test swaps the rows for equal copies, the id is unchanged (so an
// id-only assertion would pass against the OLD captured row) but `Gen` is bumped, so
// only a handler closed over the CURRENT row object reports the current generation.
const freshActions = (row) => [
  {
    label: row.EditLabel ?? 'Edit',
    icon: 'i-mdi-pencil',
    size: 'xs',
    color: 'warning',
    variant: 'tonal',
    onClick: () => {
      window.__lastClick = { id: row.Id, gen: row.Gen, action: 'Edit' }
    },
  },
  {
    label: 'Delete',
    icon: 'i-mdi-trash-can',
    size: 'xs',
    color: 'danger',
    variant: 'tonal',
    onClick: () => {
      window.__lastClick = { id: row.Id, gen: row.Gen, action: 'Delete' }
    },
  },
]

// Same content, memoised per row so the array identity never changes. The control
// arm: what the numbers look like when a consumer hand-solves the problem.
const cache = new WeakMap()
const stableActions = (row) => {
  let a = cache.get(row)
  if (!a) {
    a = freshActions(row)
    cache.set(row, a)
  }
  return a
}

const TABLE_TPL = `
  <div mono-table-scroll class="scroll-y" style="height:600px">
    <table mono-table mono-sticky-head>
      <thead><tr>
        <th mono-sticky-left>Sel</th><th>Channel</th><th>Kategori</th><th>Brand</th>
        <th>Kode</th><th>COA</th><th>Parent</th><th>Nama</th><th>Dept</th><th>Year</th>
        <th>Confirm</th><th mono-sticky-right>Act</th>
      </tr></thead>
      <tbody>
        <tr v-for="r in rows" :key="String(r.Id)" :data-row-key="String(r.Id)">
          <td mono-sticky-left><input type="checkbox" /></td>
          <td><mono-chip size="xs" variant="soft" color="primary" :label="r.Channel" /></td>
          <td>{{ r.Kategori }}</td>
          <td>{{ r.BrandNama }}</td>
          <td>{{ r.CoaKode }}</td>
          <td>{{ r.CoaNama }}</td>
          <td>{{ r._ParentNama }}</td>
          <td>{{ r.Nama }}</td>
          <td>{{ r.Departemen }}</td>
          <td>{{ r.Year }}</td>
          <td><mono-chip size="xs" variant="soft" :color="r.IsComfirm ? 'success' : 'danger'"
                         :label="r.IsComfirm ? 'Ya' : 'Tidak'" /></td>
          <td mono-sticky-right>
            <mono-button-dropdown placement="bottom-end" size="xs" :min="1"
              :buttons.prop="actions(r)"
              :trigger.prop="{ size: 'xs', variant: 'tonal', color: 'secondary' }" />
          </td>
        </tr>
      </tbody>
    </table>
  </div>`

// The table as its own component: the parent's re-render stops at unchanged props.
const TableChild = defineComponent({
  props: { rows: { type: Array, required: true }, actions: { type: Function, required: true } },
  template: TABLE_TPL,
})

const App = defineComponent({
  components: { TableChild },
  setup() {
    const openFilter = ref(true)
    const rows = shallowRef(makeRows(ROWS))
    const actions = ARM === 'stable-actions' ? stableActions : freshActions
    // Exposed so a test can swap the row objects out from under the dropdowns.
    document.__rowsRef = rows
    return { openFilter, rows, actions, isChild: ARM === 'child-component' }
  },
  template: `
    <div class="wrap">
      <mono-accordion id="acc0" title="Filter" size="sm" color="primary"
        :model-value.prop="openFilter" @mno-click="openFilter = $event.detail.modelValue">
        <div slot="body" class="grid">
          <div class="cell" v-for="i in 8" :key="i">filter {{ i }}</div>
        </div>
      </mono-accordion>

      <div class="card">
        <TableChild v-if="isChild" :rows="rows" :actions="actions" />
        <template v-else>${TABLE_TPL}</template>
      </div>
    </div>`,
})

const app = createApp(App)
app.config.compilerOptions.isCustomElement = (t) => t.startsWith('mono-')
app.mount('#app')

/**
 * Toggle the accordion and resolve once Vue has patched and layout has settled —
 * i.e. how long the main thread was blocked before the user could see anything move.
 */
window.__toggle = async () => {
  const el = document.querySelector('#acc0')
  const t0 = performance.now()
  el.toggle()
  await nextTick()
  await el.updateComplete
  void document.body.offsetHeight
  return performance.now() - t0
}

window.__rows = () => document.__rowsRef
window.__ready = true
