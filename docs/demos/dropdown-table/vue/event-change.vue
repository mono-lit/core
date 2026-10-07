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

const dd = controlMonoDataDropdown<Person>(people, {
  keyExpr: 'Id',
  displayExpr: 'Name',
  pageSize: 20,
  searchValue: ['Name', 'Role'],
})

const rows = ref<Person[]>([])
const off = dd.table.subscribe(() => {
  rows.value = [...dd.table.items]
})
dd.table.load()

const selected = ref<number | null>(null)
const lastName = ref('—')
const lastRole = ref('—')

// change carries { modelValue, value, selectedItems } — selectedItems are the
// resolved { key, text, data } for the picked row(s).
function onChange(event: CustomEvent) {
  selected.value = event.detail.modelValue
  const row = event.detail.selectedItems?.[0]?.data as Person | undefined
  lastName.value = row?.Name ?? '—'
  lastRole.value = row?.Role ?? '—'
}

onBeforeUnmount(() => {
  off()
  dd.dispose()
})
</script>

<template>
  <div style="width: 100%; display: grid; gap: 0.6rem; max-width: 360px;">
    <mono-dropdown-table :control-data-dropdown.prop="dd" label="Owner" placeholder="Pick a person…"
      clearable :model-value="selected" @change="onChange">
      <mono-table-search :control-table.prop="dd.table" slot="search" placeholder="Search…" />

      <table mono-table>
        <thead>
          <tr>
            <th>
              <mono-table-th :control-table.prop="dd.table" field="Name" caption="Name" sort>Name</mono-table-th>
            </th>
            <th>
              <mono-table-th :control-table.prop="dd.table" field="Role" caption="Role" sort>Role</mono-table-th>
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
    </mono-dropdown-table>

    <div style="font-family: 'DM Mono', ui-monospace, monospace; font-size: 0.82rem; color: var(--muted-foreground); opacity: 0.8;">
      modelValue = {{ JSON.stringify(selected) }} · {{ lastName }} ({{ lastRole }})
    </div>
  </div>
</template>
