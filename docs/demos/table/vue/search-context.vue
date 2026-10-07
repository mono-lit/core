<script setup lang="ts">
import { ref, computed, onBeforeUnmount } from 'vue'
import '@mono-lit/helper/ui/table'
import '@mono-lit/helper/ui/card'
import { controlMonoTable, monoArraySource } from '@mono-lit/helper'
import type { MonoSearchTerm } from '@mono-lit/helper'

type Row = { Id: number; Code: string; Nama: string; Kota: string }

const ROWS: Row[] = [
  { Id: 1, Code: 'TMM', Nama: 'Andy Wijaya', Kota: 'Jakarta' },
  { Id: 2, Code: 'SLS', Nama: 'Budi Santoso', Kota: 'Bandung' },
  { Id: 3, Code: 'MKT', Nama: 'Citra Dewi', Kota: 'Jakarta' },
  { Id: 4, Code: 'MPE', Nama: 'Andy Kurnia', Kota: 'Surabaya' },
  { Id: 5, Code: 'MRS', Nama: 'Dewi Lestari', Kota: 'Bandung' },
  { Id: 6, Code: 'DSC', Nama: 'Budi Rahardjo', Kota: 'Jakarta' },
]

// Toggle the two props live so the difference is visible: with multiContext off,
// a suggestion REPLACES the search; with it on, each one becomes a chip.
const suggestion = ref(true)
const multiContext = ref(true)
// How many chips render inline before the rest collapse into a "See All" chip
// (999 ≈ show all inline).
const maxChips = ref(0)

const table = controlMonoTable<Row>(null, {
  // Only these three are searchable — Id is a plain <th> below, so it contributes
  // no suggestion row at all.
  searchValue: ['Code', 'Nama', 'Kota'],
  pageSize: 10,
})

const rows = ref<Row[]>([])
const terms = ref<MonoSearchTerm[]>([])

const off = table.subscribe(() => {
  rows.value = [...table.items]
  terms.value = [...table.searchTerms]
})
table.bind(monoArraySource(ROWS, { pageSize: 10, searchValue: ['Code', 'Nama', 'Kota'] }))
void table.load()

// What the same terms would send to an OData endpoint — OR within a column,
// AND across columns.
const odata = computed(() => {
  const groups = new Map<string, string[]>()
  for (const t of terms.value) {
    const key = t.field ?? '*'
    const cols = t.field ? [t.field] : ['Code', 'Nama', 'Kota']
    const ors = cols.map((c) => `contains(${c},'${t.value}')`)
    groups.set(key, [...(groups.get(key) ?? []), ...ors])
  }
  const parts = [...groups.values()].map((ors) =>
    ors.length > 1 ? `(${ors.join(' or ')})` : ors[0],
  )
  return parts.length ? `$filter=${parts.join(' and ')}` : '(no search filter)'
})

onBeforeUnmount(() => { off(); table.dispose() })
</script>

<template>
  <div style="width: 100%;">
    <DemoControls>
      <DemoCheck v-model="suggestion" label="suggestion" data-suggestion-picker />
      <DemoCheck v-model="multiContext" label="multi-context" data-multicontext-picker />
      <DemoSelect v-model="maxChips" label="max-chips:" :options="[0, 1, 2, { value: 999, label: 'all' }]" number data-maxchips-picker />
    </DemoControls>

    <mono-card bordered width="100%" class="example-card">
      <mono-table-search
        :control-table.prop="table"
        :suggestion="suggestion"
        :multi-context="multiContext"
        :max-chips="maxChips"
        placeholder="Type, then Enter to pin the column…"
        helper-text="Tab moves into the list, ↑ ↓ pick a column, Enter applies"
        data-search />

      <div class="example-odata" data-odata>{{ odata }}</div>

      <div mono-table-scroll>
        <table mono-table>
          <thead>
            <tr>
              <!-- A native cell: no field is registered, so it suggests nothing. -->
              <th>Id</th>
              <th><mono-table-th :control-table.prop="table" field="Code" caption="Code" /></th>
              <th><mono-table-th :control-table.prop="table" field="Nama" caption="Name" /></th>
              <th><mono-table-th :control-table.prop="table" field="Kota" caption="City" /></th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="row in rows" :key="row.Id">
              <td>{{ row.Id }}</td>
              <td>{{ row.Code }}</td>
              <td>{{ row.Nama }}</td>
              <td>{{ row.Kota }}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div v-if="!rows.length" mono-table-empty>
        <div mono-empty-title>No matches</div>
        <div class="mono-table-empty-text">Remove a chip to widen the search.</div>
      </div>
    </mono-card>
  </div>
</template>

<style scoped>
.example-card {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}
.example-odata {
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: 0.75rem;
  line-height: 1.5;
  word-break: break-all;
  padding: 0.5rem 0.65rem;
  border-radius: 0.4rem;
  background: var(--muted);
  color: var(--muted-foreground);
}
</style>
