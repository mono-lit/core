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

// Per-part class overrides via the cssClass prop (mirrors mono-select). Each key is
// appended to that field part's built-in class — width, label weight, value font and
// the message style are overridden with utility classes.
const cssClass = {
  root: 'max-w-md',
  label: 'font-bold text-base',
  value: 'text-base',
  message: 'italic',
}

onBeforeUnmount(() => {
  off()
  dd.dispose()
})
</script>

<template>
  <div style="width: 100%;">
    <mono-dropdown-table :control-data-dropdown.prop="dd" label="Customized via cssClass"
      placeholder="Wider, bolder, italic message" clearable
      helper-text="Width, label weight, value font and message style overridden via cssClass."
      :css-class.prop="cssClass"
      :model-value="selected" @change="selected = $event.detail.modelValue">
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
  </div>
</template>
