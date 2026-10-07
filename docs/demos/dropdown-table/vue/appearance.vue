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
  pageSize: 20,
  searchValue: ['Name', 'Role'],
})
const rows = ref<Person[]>([])
const off = dd.table.subscribe(() => {
  rows.value = [...dd.table.items]
})
dd.table.load()

const selected = ref<number | null>(null)

// The same presentation props as mono-select.
const size = ref('md')
const variant = ref('outlined')
const color = ref('primary')
const vstate = ref('default')
const messageFor: Record<string, string> = {
  default: '',
  invalid: 'This field is required.',
  valid: 'Looks good.',
  warning: 'Please double-check this.',
}
const message = computed(() => messageFor[vstate.value])

onBeforeUnmount(() => {
  off()
  dd.dispose()
})
</script>

<template>
  <div class="example-appearance" style="width: 100%">
    <DemoControls>
      <DemoSelect v-model="size" label="Size" :options="['xs', 'sm', 'md', 'lg', 'xl']" />
      <DemoSelect v-model="variant" label="Variant" :options="['outlined', 'filled', 'underlined']" />
      <DemoSelect v-model="color" label="Color" colors="form" />
      <DemoSelect v-model="vstate" label="Validation" :options="['default', 'valid', 'invalid', 'warning']" />
    </DemoControls>

    <mono-dropdown-table :control-data-dropdown.prop="dd" label="Owner" placeholder="Pick a person…" clearable
      :size="size" :variant="variant" :color="color"
      :validation-state="vstate" :validation-message="message"
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

<style scoped>
.example-appearance {
  max-width: 420px;
}
</style>
