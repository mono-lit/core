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

const specs = [
  { key: 'disabled', label: 'Disabled', placeholder: 'Cannot open', helper: '', preset: 2 },
  { key: 'readonly', label: 'Readonly', placeholder: 'Display only', helper: '', preset: 3 },
  { key: 'required', label: 'Required', placeholder: 'Pick a person…', helper: 'The asterisk marks a required field.', preset: null },
] as const

const fields = specs.map((spec) => {
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
  const selected = ref<number | null>(spec.preset)
  return { ...spec, dd, rows, selected, off }
})

onBeforeUnmount(() => {
  fields.forEach((f) => {
    f.off()
    f.dd.dispose()
  })
})
</script>

<template>
  <div style="width: 100%; display: grid; gap: 1rem;">
    <mono-dropdown-table v-for="f in fields" :key="f.key"
      :control-data-dropdown.prop="f.dd" :label="f.label" :placeholder="f.placeholder"
      :helper-text="f.helper" :disabled="f.key === 'disabled'"
      :readonly="f.key === 'readonly'" :required="f.key === 'required'"
      :clearable="f.key !== 'required'"
      :model-value="f.selected.value" @change="f.selected.value = $event.detail.modelValue">
      <mono-table-search :control-table.prop="f.dd.table" slot="search" placeholder="Search…" />

      <table mono-table>
        <thead>
          <tr>
            <th>
              <mono-table-th :control-table.prop="f.dd.table" field="Name" caption="Name" sort>Name</mono-table-th>
            </th>
            <th>
              <mono-table-th :control-table.prop="f.dd.table" field="Role" caption="Role" sort>Role</mono-table-th>
            </th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="r in f.rows.value" :key="r.Id" :data-row-key="String(r.Id)">
            <td>{{ r.Name }}</td>
            <td>{{ r.Role }}</td>
          </tr>
        </tbody>
      </table>
    </mono-dropdown-table>
  </div>
</template>
