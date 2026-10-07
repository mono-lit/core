<script setup lang="ts">
import { ref, onBeforeUnmount } from 'vue'
import '@mono-lit/helper/ui/dropdown-table'
import '@mono-lit/helper/ui/table'
import { controlMonoDataDropdown } from '@mono-lit/helper'

type Person = { Id: number; Name: string; Role: string }

const people: Person[] = [
  { Id: 1, Name: 'Ada Lovelace', Role: 'Analyst' },
  { Id: 2, Name: 'Alan Turing', Role: 'Engineer' },
  { Id: 3, Name: 'Grace Hopper', Role: 'Admiral' },
  { Id: 4, Name: 'Katherine Johnson', Role: 'Physicist' },
  { Id: 5, Name: 'Edsger Dijkstra', Role: 'Engineer' },
  { Id: 6, Name: 'Barbara Liskov', Role: 'Professor' },
  { Id: 7, Name: 'Donald Knuth', Role: 'Author' },
  { Id: 8, Name: 'Margaret Hamilton', Role: 'Director' },
]

// The grid writes a props snapshot here on every change — drives the header loop.
const state = ref<Record<string, any>>({})

// All the "magic" (selection, value, display resolution) lives in the composable.
// It wraps a controlMonoTable — exposed as dd.table — so the panel's mono-table-* work.
const dd = controlMonoDataDropdown<Person>(people, {
  keyExpr: 'Id',
  displayExpr: 'Name',
  pageSize: 5,
  searchValue: ['Name', 'Role'],
  state,
  // One place for every element: `dropdownTable` is the FIELD, the rest are the
  // panel's grid slots — the same names controlMonoTable uses.
  props: {
    dropdownTable: {
      label: 'Owner',
      placeholder: 'Pick a person…',
      clearable: true,
      helperText: 'Single-select over a local array.',
    },
    th: [
      { field: 'Name', caption: 'Name', sort: true },
      { field: 'Role', caption: 'Role', sort: true },
    ],
    search: { placeholder: 'Search name or role…' },
    paging: { simple: true },
  },
})

const rows = ref<Person[]>([])
const off = dd.table.subscribe(() => {
  rows.value = [...dd.table.items]
})
dd.table.load()

const selected = ref<number | null>(null)

onBeforeUnmount(() => {
  off()
  dd.dispose()
})
</script>

<template>
  <div class="example-demo" style="width: 100%">
    <!-- Only :control-data-dropdown.prop — label, placeholder, clearable and the helper
         text all come from props.dropdownTable. -->
    <mono-dropdown-table :control-data-dropdown.prop="dd"
      :model-value="selected" @change="selected = $event.detail.modelValue">
      <mono-table-search :control-table.prop="dd.table" slot="search" />

      <table mono-table>
        <thead>
          <tr>
            <!-- looped by hand from the snapshot; the library never renders it -->
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

    <p class="example-value">Selected id: <strong>{{ selected ?? '—' }}</strong></p>
  </div>
</template>

<style scoped>
.example-demo {
  max-width: 360px;
}
.example-value {
  margin-top: 0.75rem;
  font-size: 0.8rem;
  color: var(--foreground);
  opacity: 0.75;
}
</style>
