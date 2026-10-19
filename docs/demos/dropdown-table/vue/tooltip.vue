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
  { Id: 5, Name: 'Barbara Liskov', Role: 'Professor' },
]

const state = ref<Record<string, any>>({})

// `tooltip` rides along with the rest of the field's props — a string or full
// tooltip options, exactly as on the element.
const dd = controlMonoDataDropdown<Person>(people, {
  keyExpr: 'Id',
  displayExpr: 'Name',
  pageSize: 5,
  state,
  props: {
    dropdownTable: {
      label: 'Approver',
      placeholder: 'Pick a person…',
      helperText: 'Signs off the request.',
      tooltip: { content: 'Only people with the Approver role can sign off. The list follows your department.', placement: 'right' },
    },
    th: [
      { field: 'Name', caption: 'Name' },
      { field: 'Role', caption: 'Role' },
    ],
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
  <div style="width: 100%; max-width: 360px">
    <mono-dropdown-table :control-data-dropdown.prop="dd"
      :model-value="selected" @change="selected = $event.detail.modelValue">
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
    </mono-dropdown-table>
  </div>
</template>
