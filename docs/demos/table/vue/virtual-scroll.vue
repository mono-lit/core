<script setup lang="ts">
import { ref, onBeforeUnmount } from 'vue'
import '@mono-lit/helper/ui/table'
import '@mono-lit/helper/ui/chip'
import { controlMonoTable } from '@mono-lit/helper'

type Row = { Id: number; Name: string; Team: string; Score: number }

const ROW_HEIGHT = 44
const TEAMS = ['Platform', 'Frontend', 'Design', 'Data', 'Mobile']
// 10,000 rows — only the height-visible ones are ever in the DOM.
const data: Row[] = Array.from({ length: 10000 }, (_, i) => ({
  Id: i + 1,
  Name: `Member ${String(i + 1).padStart(5, '0')}`,
  Team: TEAMS[i % TEAMS.length],
  Score: 40 + ((i * 7) % 60),
}))

const table = controlMonoTable<Row>(data, { pageSize: 100, searchValue: ['Name', 'Team'] })

const rows = ref<Row[]>([]) // the windowed slice (only ~visible rows)
const padTop = ref(0)
const padBottom = ref(0)
const loaded = ref(0)
const total = ref(0)
const off = table.subscribe(() => {
  rows.value = [...table.items]
  padTop.value = table.virtualPadTop
  padBottom.value = table.virtualPadBottom
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
      <span class="example-count">
        <strong>{{ rows.length }}</strong> rows in DOM · {{ loaded }} loaded · {{ total }} total
      </span>
    </div>

    <!-- Windowed rendering: a top spacer <tr>, only the visible rows, a bottom
         spacer <tr> — sized from the grid's virtualPadTop / virtualPadBottom so
         the scrollbar reflects all loaded rows while the DOM stays tiny. -->
    <div mono-table-scroll mono-sticky-head mono-scroll-y class="example-scroll">
      <table mono-table class="example-table">
        <thead>
          <tr><th>Id</th><th>Name</th><th>Team</th><th>Score</th></tr>
        </thead>
        <tbody>
          <tr v-if="padTop" :style="{ height: padTop + 'px' }" aria-hidden="true"><td colspan="4"></td></tr>
          <tr v-for="row in rows" :key="row.Id">
            <td>{{ row.Id }}</td>
            <td>{{ row.Name }}</td>
            <td><mono-chip size="xs" color="primary" variant="soft">{{ row.Team }}</mono-chip></td>
            <td>{{ row.Score }}</td>
          </tr>
          <tr v-if="padBottom" :style="{ height: padBottom + 'px' }" aria-hidden="true"><td colspan="4"></td></tr>
        </tbody>
      </table>

      <mono-table-paging :control-table.prop="table" type="virtual-scroll" :row-height="ROW_HEIGHT" />
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
  opacity: 0.75;
  font-family: 'DM Mono', ui-monospace, monospace;
}
.example-scroll {
  overflow-y: auto !important;
  max-height: 400px;
  border: 1px solid var(--border);
  border-radius: 10px;
}
.example-scroll :deep(thead th) {
  position: sticky;
  top: 0;
  z-index: 2;
  background: var(--card);
}
/* Fixed row height must match ROW_HEIGHT / the paging row-height so the window
   math and spacer heights line up exactly. */
.example-table :deep(tbody td) {
  height: 44px;
  padding-top: 0;
  padding-bottom: 0;
  box-sizing: border-box;
}
</style>
