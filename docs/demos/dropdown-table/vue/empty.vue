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
]

const state = ref<Record<string, any>>({})

// `dd.table` IS a controlMonoTable — the same object `dd.grid` returns — so every
// mono-table-* element works inside the panel exactly as it does in a plain
// table, `<mono-table-empty>` included. Nothing dropdown-specific is needed.
const dd = controlMonoDataDropdown<Person>(people, {
  keyExpr: 'Id',
  displayExpr: 'Name',
  pageSize: 5,
  searchValue: ['Name', 'Role'],
  state,
  props: {
    dropdownTable: {
      label: 'Owner',
      placeholder: 'Pick a person…',
      clearable: true,
      helperText: 'Search for something that does not exist to see the empty state.',
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
    <mono-dropdown-table
      :control-data-dropdown.prop="dd"
      :model-value="selected"
      @change="selected = $event.detail.modelValue"
    >
      <mono-table-search :control-table.prop="dd.table" slot="search" />

      <table mono-table>
        <caption>
          <mono-table-empty
            :control-table.prop="dd.table"
            icon="i-mdi-magnify"
            title="No matches"
            subtitle="Nothing here fits that search."
          ></mono-table-empty>
        </caption>

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
