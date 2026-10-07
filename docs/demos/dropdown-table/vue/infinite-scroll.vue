<script setup lang="ts">
import { ref, onBeforeUnmount } from 'vue'
import '@mono-lit/helper/ui/dropdown-table'
import '@mono-lit/helper/ui/table'
import '@mono-lit/helper/ui/chip'
import { controlMonoDataDropdown } from '@mono-lit/helper'

type Person = { Id: number; Name: string; Team: string }

const TEAMS = ['Platform', 'Frontend', 'Design', 'Data', 'Mobile']
// A large local array so the panel visibly accumulates chunk by chunk.
const people: Person[] = Array.from({ length: 500 }, (_, i) => ({
  Id: i + 1,
  Name: `Member ${String(i + 1).padStart(3, '0')}`,
  Team: TEAMS[i % TEAMS.length],
}))

// pageSize = the chunk appended each time you scroll to the bottom of the panel.
const dd = controlMonoDataDropdown<Person>(people, {
  keyExpr: 'Id',
  displayExpr: 'Name',
  pageSize: 25,
  searchValue: ['Name', 'Team'],
})

// In infinity mode `grid.items` IS the accumulated buffer — it grows, it isn't replaced.
const rows = ref<Person[]>([])
const loaded = ref(0)
const total = ref(0)
const off = dd.table.subscribe(() => {
  rows.value = [...dd.table.items]
  loaded.value = dd.table.loadedCount
  total.value = dd.table.totalCount
})
dd.table.load()

const selected = ref<number | null>(null)

onBeforeUnmount(() => {
  off()
  dd.dispose()
})
</script>

<template>
  <div class="example-demo" style="width: 100%">
    <mono-dropdown-table :control-data-dropdown.prop="dd" label="Owner" placeholder="Pick a person…"
      clearable helper-text="Scroll the panel to append the next 25 rows."
      :dropdown.prop="{ width: 420, maxHeight: 300 }"
      :model-value="selected" @change="selected = $event.detail.modelValue">
      <mono-table-search :control-table.prop="dd.table" slot="search" placeholder="Search name or team…" />

      <!-- The table AND the pager both go in the default (body) slot. The panel's
           body region is the scroll container (`overflow: auto`), so
           <mono-table-paging type="infinity-scroll"> resolves it automatically and
           appends the next page as you near the bottom. Searching resets the
           accumulator back to page 0. -->
      <table mono-table>
        <thead>
          <tr>
            <th>Name</th>
            <th>Team</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="r in rows" :key="r.Id" :data-row-key="String(r.Id)">
            <td>{{ r.Name }}</td>
            <td>
              <mono-chip size="xs" color="primary" variant="soft">{{ r.Team }}</mono-chip>
            </td>
          </tr>
        </tbody>
      </table>

      <mono-table-paging :control-table.prop="dd.table" type="infinity-scroll" />
    </mono-dropdown-table>

    <p class="example-value">
      Selected id: <strong>{{ selected ?? '—' }}</strong> · {{ loaded }} / {{ total }} loaded
    </p>
  </div>
</template>

<style scoped>
.example-demo {
  max-width: 420px;
}
.example-value {
  margin-top: 0.75rem;
  font-size: 0.8rem;
  color: var(--foreground);
  opacity: 0.75;
}
/* Keep the header row visible while the panel body scrolls. */
thead th {
  position: sticky;
  top: 0;
  z-index: 2;
  background: var(--background);
}
</style>
