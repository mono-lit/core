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
  { Id: 6, Name: 'Barbara Liskov', Role: 'Professor' },
  { Id: 7, Name: 'Donald Knuth', Role: 'Author' },
  { Id: 8, Name: 'Margaret Hamilton', Role: 'Director' },
]

const dd = controlMonoDataDropdown<Person>(people, {
  keyExpr: 'Id',
  displayExpr: 'Name',
  multiple: true,
  pageSize: 5,
  searchValue: ['Name', 'Role'],
})

const rows = ref<Person[]>([])
const off = dd.subscribe(() => {
  rows.value = [...dd.table.items]
})
dd.table.load()

// Preset selection — resolved to display text via the array data() lookup.
// `max="4"` on the element caps the USER at four rows: a fifth tick is rejected
// and the checkbox un-ticks itself (the header "all" fills the room left and
// stops). `max-visible="3"` only decides how many chips DRAW before "+N more".
const selected = ref<number[]>([2, 5])

onBeforeUnmount(() => {
  off()
  dd.dispose()
})
</script>

<template>
  <div class="example-demo" style="width: 100%">
    <mono-dropdown-table  :control-data-dropdown.prop="dd" label="Team" placeholder="Pick people…"
      clearable multiple :max="4" :max-visible="3" :dropdown.prop="{ width: 460 }"
      :model-value.prop="selected" @change="selected = $event.detail.modelValue">
      <mono-table-search :control-table.prop="dd.table" slot="search" placeholder="Search name or role…" />

      <table mono-table>
        <thead>
          <tr>
            <th style="width: 2.6rem; text-align: center">
              <!-- Covers EVERY row, not just the page on screen: `type="all"`
                   reads the whole set, so page 2 is selected too. -->
              <mono-table-checkbox
                type="all"
                mode="all"
                :control-table.prop="dd.table"
                size="sm"
                aria-label-text="Select all people"
              />
            </th>
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
            <td style="text-align: center">
              <mono-table-checkbox :control-table.prop="dd.table" :item.prop="r" size="sm" />
            </td>
            <td>{{ r.Name }}</td>
            <td>{{ r.Role }}</td>
          </tr>
        </tbody>
      </table>

      <mono-table-paging :control-table.prop="dd.table" slot="footer" simple />
    </mono-dropdown-table>

    <p class="example-value">Selected ids: <strong>{{ selected.join(', ') || '—' }}</strong></p>
  </div>
</template>

<style scoped>
.example-demo {
  max-width: 460px;
}
.example-value {
  margin-top: 0.75rem;
  font-size: 0.8rem;
  color: var(--foreground);
  opacity: 0.75;
}
</style>
