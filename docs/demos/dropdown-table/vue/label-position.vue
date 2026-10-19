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
]

// `label-position`: top (default) · notched (on the border for outlined, inset
// for filled / underlined) · left · right. It is a plain element prop, so it
// works next to the controller (it could also ride in `props.dropdownTable`).
const variant = ref('outlined')
const size = ref('md')

const positions = [
  { position: 'top', label: 'Top (default)' },
  { position: 'notched', label: 'Notched' },
  { position: 'left', label: 'Left' },
  { position: 'right', label: 'Right' },
] as const

const fields = positions.map(({ position, label }) => {
  const state = ref<Record<string, any>>({})
  const dd = controlMonoDataDropdown<Person>(people, {
    keyExpr: 'Id',
    displayExpr: 'Name',
    pageSize: 5,
    state,
    props: {
      dropdownTable: { label, placeholder: 'Pick a person…' },
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
  return { position, dd, state, rows, off, selected: ref<number | null>(null) }
})

onBeforeUnmount(() => {
  for (const f of fields) {
    f.off()
    f.dd.dispose()
  }
})
</script>

<template>
  <div style="width: 100%;">
    <DemoControls>
      <DemoSelect v-model="variant" label="Variant" :options="['outlined', 'filled', 'underlined']" />
      <DemoSelect v-model="size" label="Size" :options="['xs', 'sm', 'md', 'lg', 'xl', 'xxl']" />
    </DemoControls>

    <div style="display: grid; gap: 1.25rem;">
      <mono-dropdown-table v-for="f in fields" :key="f.position" :label-position="f.position" :variant="variant" :size="size"
        :control-data-dropdown.prop="f.dd" :model-value="f.selected.value" @change="f.selected.value = $event.detail.modelValue">
        <table mono-table>
          <thead>
            <tr>
              <th v-for="c in f.state.value.th" :key="c.field">
                <mono-table-th :control-table.prop="f.dd.table" :field="c.field" />
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
