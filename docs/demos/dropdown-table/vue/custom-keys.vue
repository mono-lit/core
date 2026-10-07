<script setup lang="ts">
import { ref, onBeforeUnmount } from 'vue'
import '@mono-lit/helper/ui/dropdown-table'
import '@mono-lit/helper/ui/table'
import { controlMonoDataDropdown } from '@mono-lit/helper'

// Rows in their natural shape — no { key, text } pre-mapping.
type User = { id: number; first: string; last: string; team: string }
const users: User[] = [
  { id: 9, first: 'John', last: 'Doe', team: 'Platform' },
  { id: 11, first: 'Jane', last: 'Reyes', team: 'Frontend' },
  { id: 14, first: 'Lina', last: 'Cho', team: 'Design' },
  { id: 18, first: 'Omar', last: 'Said', team: 'Platform' },
]

// (a) keyExpr="id" + displayExpr="first" → modelValue is the id, field shows the first name.
const ddField = controlMonoDataDropdown<User>(users, { keyExpr: 'id', displayExpr: 'first', pageSize: 20 })
// (b) keyExpr="id" + a FUNCTION displayExpr → field shows a computed label.
const ddFn = controlMonoDataDropdown<User>(users, {
  keyExpr: 'id',
  displayExpr: (u: User) => `${u.first} ${u.last} · ${u.team}`,
  pageSize: 20,
})

const rowsField = ref<User[]>([])
const rowsFn = ref<User[]>([])
const offA = ddField.table.subscribe(() => (rowsField.value = [...ddField.table.items]))
const offB = ddFn.table.subscribe(() => (rowsFn.value = [...ddFn.table.items]))
ddField.table.load()
ddFn.table.load()

const selectedA = ref<number | null>(11)
const selectedB = ref<number | null>(14)

onBeforeUnmount(() => {
  offA(); offB()
  ddField.dispose(); ddFn.dispose()
})
</script>

<template>
  <div style="width: 100%; display: grid; gap: 1.25rem;">
    <div>
      <div class="example-note">keyExpr="id" + display-value="first" → modelValue = id</div>
      <mono-dropdown-table :control-data-dropdown.prop="ddField" label="Owner" placeholder="Pick a user…" clearable
        :model-value="selectedA" @change="selectedA = $event.detail.modelValue">
        <table mono-table>
          <thead>
            <tr><th>First</th><th>Last</th><th>Team</th></tr>
          </thead>
          <tbody>
            <tr v-for="u in rowsField" :key="u.id" :data-row-key="String(u.id)">
              <td>{{ u.first }}</td><td>{{ u.last }}</td><td>{{ u.team }}</td>
            </tr>
          </tbody>
        </table>
      </mono-dropdown-table>
      <div class="example-out">modelValue → {{ JSON.stringify(selectedA) }}</div>
    </div>

    <div>
      <div class="example-note">keyExpr="id" + function displayExpr → field shows a computed label</div>
      <mono-dropdown-table :control-data-dropdown.prop="ddFn" label="Owner (full label)" placeholder="Pick a user…" clearable
        :model-value="selectedB" @change="selectedB = $event.detail.modelValue">
        <table mono-table>
          <thead>
            <tr><th>First</th><th>Last</th><th>Team</th></tr>
          </thead>
          <tbody>
            <tr v-for="u in rowsFn" :key="u.id" :data-row-key="String(u.id)">
              <td>{{ u.first }}</td><td>{{ u.last }}</td><td>{{ u.team }}</td>
            </tr>
          </tbody>
        </table>
      </mono-dropdown-table>
      <div class="example-out">modelValue → {{ JSON.stringify(selectedB) }}</div>
    </div>
  </div>
</template>

<style scoped>
.example-note {
  font-size: 0.7rem; font-weight: 700; letter-spacing: 0.06em; text-transform: uppercase;
  color: var(--foreground); opacity: 0.55; margin-bottom: 0.4rem;
}
.example-out {
  font-family: 'DM Mono', ui-monospace, monospace; font-size: 0.78rem;
  margin-top: 0.35rem; color: var(--foreground); opacity: 0.7;
}
</style>
