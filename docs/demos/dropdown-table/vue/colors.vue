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

const variants = ['outlined', 'filled', 'underlined'] as const

// Pick a colour and every variant re-paints with it: the focus ring, the open
// border and (unless `chip.color` pins another hue) the chips take it.
const color = ref('primary')

// One independent dropdown per variant (controlMonoDataDropdown is a plain factory).
const fields = variants.map((variant) => {
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
  return { variant, dd, rows, selected, off }
})

const labels: Record<string, string> = {
  outlined: 'Outlined', filled: 'Filled', underlined: 'Underlined',
}

onBeforeUnmount(() => {
  fields.forEach((f) => {
    f.off()
    f.dd.dispose()
  })
})
</script>

<template>
  <div style="width: 100%;">
    <DemoControls>
      <DemoSelect v-model="color" label="Color" colors="form" />
    </DemoControls>

    <div style="display: grid; gap: 1rem;">
      <mono-dropdown-table v-for="f in fields" :key="f.variant"
        :control-data-dropdown.prop="f.dd" :variant="f.variant" :color="color" :label="labels[f.variant]"
        placeholder="Pick a person…" clearable
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
  </div>
</template>
