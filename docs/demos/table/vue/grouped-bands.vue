<script setup lang="ts">
import { ref, onBeforeUnmount } from 'vue'
import '@mono-lit/helper/ui/table'
import '@mono-lit/helper/ui/button'
import { controlMonoTable } from '@mono-lit/helper'

type Row = { Id: number; Region: string; Team: string; Name: string; Score: number }

const ROW_HEIGHT = 36
const REGIONS = ['North', 'South', 'East', 'West']
const TEAMS = ['Platform', 'Frontend', 'Design', 'Data']
// 3,000 rows in no particular order — the band keys lead the sort, so the bands come out contiguous.
const data: Row[] = Array.from({ length: 3000 }, (_, i) => ({
  Id: i + 1,
  Region: REGIONS[(i * 7) % REGIONS.length],
  Team: TEAMS[Math.floor(i / 3) % TEAMS.length],
  Name: `Member ${String(i + 1).padStart(4, '0')}`,
  Score: 40 + ((i * 13) % 60),
}))

const table = controlMonoTable<Row>(data, { keyExpr: 'Id', searchValue: ['Name', 'Team', 'Region'] })

// Declared on ONE header — it is table-wide. Region bands, Team bands inside each.
const grouped = {
  // A checkbox on every band, in the row checkboxes' column: ticks the band's rows.
  selectable: true,
  chunk: 100, // rows per request when the source is remote (the first one carries $count)
  fields: [
    {
      field: 'Region',
      custom: (r: Row) => `${r.Region} region`,
      // An emoji per band (any text works) — or an iconify class, like the Team level below.
      icon: (r: Row) => ({ North: '🧭', South: '🌴', East: '🌅', West: '🏔️' })[r.Region] ?? '',
      variant: 'tonal' as const,
      // Per band, from its first row: a theme token or any CSS colour.
      color: (r: Row) => (r.Region === 'North' ? 'primary' : r.Region === 'South' ? 'success' : r.Region === 'East' ? 'warning' : '#7c3aed'),
    },
    { field: 'Team', variant: 'text' as const, color: 'neutral', icon: 'i-mdi-account-group' },
  ],
}

const rows = ref<Row[]>([])
const padTop = ref(0)
const padBottom = ref(0)
const total = ref(0)
const bands = ref(0)
const selected = ref(0)
const off = table.subscribe(() => {
  rows.value = [...table.items]
  padTop.value = table.virtualPadTop
  padBottom.value = table.virtualPadBottom
  total.value = table.totalCount
  bands.value = table.grouped.length
  selected.value = table.check().count()
})

onBeforeUnmount(() => {
  off()
  table.dispose()
})
</script>

<template>
  <div style="width: 100%;">
    <div class="example-toolbar">
      <mono-table-search :control-table.prop="table" placeholder="Search name, team or region…" />
      <div class="example-actions">
        <mono-button size="xs" variant="outline" @click="table.collapseAllGrouped()">Collapse all</mono-button>
        <mono-button size="xs" variant="outline" @click="table.expandAllGrouped()">Expand all</mono-button>
      </div>
    </div>
    <p class="example-count">
      <strong>{{ rows.length }}</strong> rows in DOM · {{ total }} total · {{ bands }} bands · {{ selected }} selected — click a band to fold it
    </p>

    <!-- The band <tr>s are inserted by mono itself; this template only draws data rows
         and the two spacers (whose heights already include the bands outside the window). -->
    <div mono-table-scroll mono-sticky-head mono-scroll-y class="example-scroll">
      <table mono-table class="example-table">
        <thead>
          <tr>
            <th mono-sticky-left class="example-select"><mono-table-checkbox type="all" :control-table.prop="table" /></th>
            <th><mono-table-th :control-table.prop="table" field="Id" caption="Id" :sort.prop="true" :grouped.prop="grouped" /></th>
            <th><mono-table-th :control-table.prop="table" field="Name" caption="Name" :sort.prop="true" /></th>
            <th><mono-table-th :control-table.prop="table" field="Team" caption="Team" :sort.prop="true" /></th>
            <th><mono-table-th :control-table.prop="table" field="Region" caption="Region" :sort.prop="true" /></th>
            <th><mono-table-th :control-table.prop="table" field="Score" caption="Score" :sort.prop="true" /></th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="padTop" :style="{ height: padTop + 'px' }" aria-hidden="true"><td colspan="6"></td></tr>
          <tr v-for="row in rows" :key="row.Id">
            <td mono-sticky-left class="example-select"><mono-table-checkbox :control-table.prop="table" :item.prop="row" /></td>
            <td>{{ row.Id }}</td>
            <td>{{ row.Name }}</td>
            <td>{{ row.Team }}</td>
            <td>{{ row.Region }}</td>
            <td>{{ row.Score }}</td>
          </tr>
          <tr v-if="padBottom" :style="{ height: padBottom + 'px' }" aria-hidden="true"><td colspan="6"></td></tr>
        </tbody>
      </table>

      <mono-table-paging :control-table.prop="table" type="virtual-scroll" :row-height="ROW_HEIGHT" :overscan="10" />
    </div>
  </div>
</template>

<style scoped>
.example-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 0.4rem;
}
.example-actions {
  display: flex;
  gap: 0.5rem;
}
.example-count {
  margin: 0 0 0.6rem;
  font-size: 0.8rem;
  opacity: 0.75;
  font-family: 'DM Mono', ui-monospace, monospace;
}
.example-scroll {
  overflow: auto !important;
  max-height: 420px;
  border: 1px solid var(--border);
  border-radius: 10px;
}
.example-table {
  min-width: 860px; /* wide enough to scroll sideways: the checkbox column stays pinned */
}
.example-select {
  width: 44px;
  text-align: center;
}
/* Every body row — data and band — is exactly ROW_HEIGHT: the virtual window is
   computed from scrollTop / row-height and never measures. */
.example-table :deep(tbody td) {
  height: 36px;
  padding-top: 0;
  padding-bottom: 0;
  box-sizing: border-box;
  white-space: nowrap;
}
</style>
