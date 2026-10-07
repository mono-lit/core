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
  { Id: 6, Name: 'Barbara Liskov', Role: 'Professor' },
  { Id: 7, Name: 'Donald Knuth', Role: 'Author' },
  { Id: 8, Name: 'Margaret Hamilton', Role: 'Director' },
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

// The FIELD width (css-size) and the PANEL size (dropdown object) are independent.
const fieldWidth = ref(280)
const panelWidth = ref(460)
const panelHeight = ref(220)
const dropdown = computed(() => ({ width: panelWidth.value, maxHeight: panelHeight.value }))

onBeforeUnmount(() => {
  off()
  dd.dispose()
})
</script>

<template>
  <div class="example-sizing" style="width: 100%">
    <div class="example-controls">
      <label>Field width: <strong>{{ fieldWidth }}px</strong>
        <input type="range" min="180" max="480" step="10" v-model.number="fieldWidth" />
      </label>
      <label>Panel width: <strong>{{ panelWidth }}px</strong>
        <input type="range" min="260" max="620" step="10" v-model.number="panelWidth" />
      </label>
      <label>Panel height: <strong>{{ panelHeight }}px</strong>
        <input type="range" min="120" max="440" step="10" v-model.number="panelHeight" />
      </label>
    </div>

    <mono-dropdown-table :control-data-dropdown.prop="dd" label="Owner" placeholder="Pick a person…" clearable
      :width.prop="fieldWidth" :dropdown.prop="dropdown"
      :model-value="selected" @change="selected = $event.detail.modelValue">
      <mono-table-search :control-table.prop="dd.table" slot="search" placeholder="Search name or role…" />

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
.example-sizing {
  max-width: 640px;
}
.example-controls {
  display: flex;
  flex-wrap: wrap;
  gap: 1.25rem;
  margin-bottom: 0.9rem;
  font-size: 0.8rem;
  color: var(--foreground);
}
.example-controls label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}
</style>
