<script setup lang="ts">
import { ref, computed, onBeforeUnmount } from 'vue'
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
  multiple: true,
  pageSize: 20,
  searchValue: ['Name', 'Role'],
})

const rows = ref<Person[]>([])
const off = dd.table.subscribe(() => {
  rows.value = [...dd.table.items]
})
dd.table.load()

const selected = ref<number[]>([])
const logLines = ref<string[]>([])
const logText = computed(() =>
  logLines.value.length ? logLines.value.join('\n') : 'No events yet — pick or clear rows…',
)

// change fires on every selection change (add / remove / clear). Multi-select
// keeps the panel open so you can watch the log grow.
function onChange(event: CustomEvent) {
  selected.value = event.detail.modelValue ?? []
  const names = (event.detail.selectedItems ?? []).map((i: { text: string }) => i.text)
  logLines.value = [
    `[change] value=${JSON.stringify(event.detail.modelValue)} · [${names.join(', ')}]`,
    ...logLines.value,
  ]
}

onBeforeUnmount(() => {
  off()
  dd.dispose()
})
</script>

<template>
  <div style="width: 100%; max-width: 420px;">
    <mono-dropdown-table :control-data-dropdown.prop="dd" label="Event dropdown" placeholder="Pick, then clear…"
      clearable multiple :model-value.prop="selected" @change="onChange">
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

    <div style="white-space: pre-wrap; font-family: 'DM Mono', ui-monospace, monospace; font-size: 0.78rem; background: var(--muted); padding: 0.75rem 0.9rem; margin-top: 0.75rem; border-radius: 6px; max-height: 130px; overflow: auto;">{{ logText }}</div>
  </div>
</template>
