<script setup lang="ts">
import { ref, onBeforeUnmount } from 'vue'
import '@mono-lit/helper/ui/table'
import '@mono-lit/helper/ui/card'
import { controlMonoTable } from '@mono-lit/helper'

type Row = { Id: number; Brand: string; Product: string; SoldAt: string | null }

// Timestamps across two years, a few sharing a day and one sharing a minute, so
// every level of the tree has something to show — and one blank.
const rows: Row[] = [
  { Id: 1, Brand: 'One', Product: 'Alpha', SoldAt: '2026-03-05T13:05:09' },
  { Id: 2, Brand: 'One', Product: 'Beta', SoldAt: '2026-03-05T13:05:30' },
  { Id: 3, Brand: 'Two', Product: 'Gamma', SoldAt: '2026-03-05T16:40:00' },
  { Id: 4, Brand: 'Two', Product: 'Alpha', SoldAt: '2026-03-20T08:00:00' },
  { Id: 5, Brand: 'One', Product: 'Delta', SoldAt: '2026-07-01T09:15:00' },
  { Id: 6, Brand: 'Two', Product: 'Beta', SoldAt: '2026-11-11T11:11:11' },
  { Id: 7, Brand: 'One', Product: 'Gamma', SoldAt: '2025-12-31T23:59:59' },
  { Id: 8, Brand: 'Two', Product: 'Delta', SoldAt: '2025-06-15T10:00:00' },
  { Id: 9, Brand: 'One', Product: 'Alpha', SoldAt: null },
]

// `dateFilter` on the datetime column (the default depth is month — `'second'`
// here for the full drill-down); `headerFilter` on the others. The
// lists cascade both ways: filter Brand and the tree shows that brand's dates;
// filter a month and the Brand list shows the brands sold that month.
const table = controlMonoTable<Row>(rows, {
  keyExpr: 'Id',
  pageSize: 20,
  props: {
    th: [
      { field: 'Brand', caption: 'Brand', headerFilter: true, sort: true },
      { field: 'Product', caption: 'Product', headerFilter: true, sort: true },
      { field: 'SoldAt', caption: 'Sold at', dateFilter: { depth: 'second' }, sort: true },
    ],
  },
})

const items = ref<Row[]>([])
const off = table.subscribe(() => {
  items.value = [...table.items]
})
table.load()

onBeforeUnmount(() => {
  off()
  table.dispose()
})

const fmt = (v: string | null) => (v ? v.replace('T', ' ') : '—')
</script>

<template>
  <mono-card bordered width="100%" class="example-card">
    <div class="example-toolbar">
      <strong class="example-title">Sales</strong>
      <span class="example-hint">Click the funnel on "Sold at": tick a year, or expand it down to the second.</span>
    </div>

    <div mono-table-scroll>
      <table mono-table>
        <thead>
          <tr>
            <th><mono-table-th :control-table.prop="table" field="Brand" /></th>
            <th><mono-table-th :control-table.prop="table" field="Product" /></th>
            <th><mono-table-th :control-table.prop="table" field="SoldAt" /></th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="row in items" :key="row.Id">
            <td>{{ row.Brand }}</td>
            <td>{{ row.Product }}</td>
            <td>{{ fmt(row.SoldAt) }}</td>
          </tr>
        </tbody>
      </table>
    </div>

    <div v-show="!items.length" mono-table-empty>
      <div mono-empty-title>Nothing sold then</div>
      <div mono-empty-sub>Clear a column filter to see the rows again.</div>
    </div>

    <div mono-table-foot>
      <mono-table-info :control-table.prop="table" />
    </div>
  </mono-card>
</template>

<style scoped>
.example-card {
  --mono-card-padding: 0;
  width: 100%;
  overflow: hidden;
}

.example-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  padding: 0.72rem 1rem;
  flex-wrap: wrap;
}

.example-title {
  font-size: 0.9rem;
  color: var(--foreground);
}

.example-hint {
  font-size: 0.78rem;
  color: var(--foreground);
  opacity: 0.7;
}
</style>
