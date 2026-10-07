<script setup lang="ts">
import { ref, onBeforeUnmount } from 'vue'
import '@mono-lit/helper/ui/table'
import '@mono-lit/helper/ui/chip'
import { controlMonoTable } from '@mono-lit/helper'

type Row = { Id: number; Name: string; Team: string; Score: number }

const TEAMS = ['Platform', 'Frontend', 'Design', 'Data', 'Mobile']
// A large-ish local array so accumulation is visible page-by-page.
const data: Row[] = Array.from({ length: 500 }, (_, i) => ({
  Id: i + 1,
  Name: `Member ${String(i + 1).padStart(3, '0')}`,
  Team: TEAMS[i % TEAMS.length],
  Score: 40 + ((i * 7) % 60),
}))

// pageSize = the chunk appended each time you scroll to the end.
const table = controlMonoTable<Row>(data, { pageSize: 25, searchValue: ['Name', 'Team'] })

const rows = ref<Row[]>([])
const loaded = ref(0)
const total = ref(0)
const off = table.subscribe(() => {
  rows.value = [...table.items]
  loaded.value = table.loadedCount
  total.value = table.totalCount
})
table.load()

onBeforeUnmount(() => {
  off()
  table.dispose()
})
</script>

<template>
  <div style="width: 100%;">
    <div class="example-toolbar">
      <mono-table-search :control-table.prop="table" placeholder="Search name or team…" />
      <span class="example-count">{{ loaded }} / {{ total }} loaded</span>
    </div>

    <!-- A fixed-height vertical scroll region. `<mono-table-paging type="infinity-scroll">`
         sits INSIDE it so it finds this `.mono-table-scroll` and appends the next page
         when you scroll to the bottom. -->
    <div mono-table-scroll mono-sticky-head mono-scroll-y class="example-scroll">
      <table mono-table>
        <thead>
          <tr><th>Id</th><th>Name</th><th>Team</th><th>Score</th></tr>
        </thead>
        <tbody>
          <tr v-for="row in rows" :key="row.Id">
            <td>{{ row.Id }}</td>
            <td>{{ row.Name }}</td>
            <td><mono-chip size="xs" color="primary" variant="soft">{{ row.Team }}</mono-chip></td>
            <td>{{ row.Score }}</td>
          </tr>
        </tbody>
      </table>

      <mono-table-paging :control-table.prop="table" type="infinity-scroll" />
    </div>
  </div>
</template>

<style scoped>
.example-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 0.6rem;
}
.example-count {
  font-size: 0.8rem;
  color: var(--foreground);
  opacity: 0.7;
  font-family: 'DM Mono', ui-monospace, monospace;
}
/* Force the vertical scroll region (the VitePress doc CSS otherwise pins
   .mono-table-scroll to overflow-y:hidden). */
.example-scroll {
  overflow-y: auto !important;
  max-height: 340px;
  border: 1px solid var(--border);
  border-radius: 10px;
}
.example-scroll :deep(thead th) {
  position: sticky;
  top: 0;
  z-index: 2;
  background: var(--card);
}
</style>
