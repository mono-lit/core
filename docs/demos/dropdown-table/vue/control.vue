<script setup lang="ts">
import { ref, onBeforeUnmount } from 'vue'
import '@mono-lit/helper/ui/dropdown-table'
import '@mono-lit/helper/ui/table'
import { controlMonoDataDropdown } from '@mono-lit/helper'

type Row = { Id: number; Name: string; Role: string }

const ROWS: Row[] = [
  { Id: 1, Name: 'Ada Lovelace', Role: 'Analyst' },
  { Id: 2, Name: 'Alan Turing', Role: 'Engineer' },
  { Id: 3, Name: 'Grace Hopper', Role: 'Admiral' },
  { Id: 4, Name: 'Katherine Johnson', Role: 'Physicist' },
  { Id: 5, Name: 'Edsger Dijkstra', Role: 'Author' },
  { Id: 6, Name: 'Margaret Hamilton', Role: 'Director' },
]

// `controlMonoDataDropdown` owns selection/value; bind the field with
// `:control-data-dropdown`. The inner table is exposed as `dd.table` — bind the
// panel's mono-table-* to it, and read `dd.modelValue` from outside.
const state = ref<Record<string, any>>({})

const dd = controlMonoDataDropdown<Row>(ROWS, {
  keyExpr: 'Id',
  displayExpr: 'Name',
  pageSize: 5,
  searchValue: ['Name', 'Role'],
  state,
  props: {
    dropdownTable: { placeholder: 'Pick a person…', clearable: true },
    th: [
      { field: 'Name', caption: 'Name', sort: true },
      { field: 'Role', caption: 'Role', sort: true },
    ],
    search: { placeholder: 'Search name or role…' },
    paging: { simple: true },
  },
})

const rows = ref<Row[]>([])
const picked = ref<string>('—')
// `dd.subscribe` fires on selection AND grid changes (search/page); read the
// selection via `displayText()` (or `dd.value` for the raw key).
const off = dd.subscribe(() => {
  rows.value = [...dd.table.items]
  picked.value = dd.displayText() || '—'
})
dd.table.load()

onBeforeUnmount(() => {
  off()
  dd.dispose()
})
</script>

<template>
  <div class="example-demo" style="width: 100%">
    <mono-dropdown-table :control-data-dropdown.prop="dd">
      <mono-table-search :control-table.prop="dd.table" slot="search" />

      <table mono-table>
        <thead>
          <tr>
            <th v-for="c in state.th" :key="c.field">
              <mono-table-th :control-table.prop="dd.table" :field="c.field" />
            </th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="r in rows" :key="r.Id" :data-row-key="String(r.Id)">
            <td>{{ r.Name }}</td>
            <td>{{ r.Role }}</td>
          </tr>
        </tbody>
      </table>

      <mono-table-paging :control-table.prop="dd.table" slot="footer" />
    </mono-dropdown-table>

    <p class="example-picked">Picked: <strong>{{ picked }}</strong></p>
  </div>
</template>

<style scoped>
.example-demo {
  max-width: 360px;
}
.example-picked {
  margin-top: 0.75rem;
  font-size: 0.8rem;
  color: var(--foreground);
  opacity: 0.75;
}
</style>
