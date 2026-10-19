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

// `validation-position`: bottom (default) · icon (a state icon in the box, hover
// it for the message) · float (the message floats under the box while the field
// is hovered or focused). In icon / float the row keeps the helper text.
const state = ref('invalid')
const messages: Record<string, string> = { invalid: 'Pick an approver.', warning: 'This person is on leave.', valid: 'Looks good!' }

const positions = [
  { position: 'bottom', label: 'Bottom (default)' },
  { position: 'icon', label: 'Icon — hover the icon' },
  { position: 'float', label: 'Float — hover or focus the field' },
] as const

const fields = positions.map(({ position, label }) => {
  const state = ref<Record<string, any>>({})
  const dd = controlMonoDataDropdown<Person>(people, {
    keyExpr: 'Id',
    displayExpr: 'Name',
    pageSize: 5,
    state,
    props: {
      dropdownTable: { label, placeholder: 'Pick a person…', helperText: 'Helper text' },
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
      <DemoSelect v-model="state" label="State" :options="['invalid', 'warning', 'valid']" />
    </DemoControls>

    <div style="display: grid; gap: 1.25rem;">
      <mono-dropdown-table v-for="f in fields" :key="f.position" :validation-position="f.position" :validation-state="state" :validation-message="messages[state]"
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
